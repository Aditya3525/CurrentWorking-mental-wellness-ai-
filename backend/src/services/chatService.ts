import { PrismaClient } from '@prisma/client';
import { llmService } from './llmProvider';
import { recommendationService, RecommendationResult } from './recommendationService';
import { UserContext, AIMessage } from '../types/ai';
import type { AssessmentInsightsPayload, AssessmentTypeSummary } from './assessmentInsightsService';
import { logger } from '../utils/logger';
import { conversationMemoryService } from './conversationMemoryService';
import { conversationService } from './conversationService';
import { structuredExercisesService } from './structuredExercisesService';
import { contextAwarenessService } from './contextAwarenessService';

const prisma = new PrismaClient();
const chatLogger = logger.child({ module: 'ChatService' });

type ApproachMode = 'western' | 'eastern' | 'hybrid';

type SentimentSnapshot = {
  label: 'positive' | 'neutral' | 'negative';
  score: number;
  dominantEmotion: string | null;
  keywords: string[];
  summary: string;
};

type EnhancedSentiment = {
  primary: {
    emotion: 'joy' | 'sadness' | 'anxiety' | 'anger' | 'fear' | 'neutral';
    confidence: number; // 0-1
    intensity: number; // 0-10
  };
  secondary: Array<{
    emotion: string;
    confidence: number;
  }>;
  tone: {
    formality: number; // 0-1 (casual to formal)
    urgency: number; // 0-1
    hopefulness: number; // 0-1
  };
  indicators: {
    crisisRisk: number; // 0-1
    progressIndicators: string[];
    concerningPatterns: string[];
  };
  linguisticFeatures: {
    questionCount: number;
    exclamationCount: number;
    negationCount: number;
    firstPersonCount: number;
    absoluteWords: string[]; // "always", "never", "completely"
  };
};

type CoachingDirectives = {
  westernFocus: string[];
  easternPractices: string[];
  hybridBridge: string[];
  reminders: string[];
};

const POSITIVE_WORDS = [
  'calm',
  'hopeful',
  'relief',
  'better',
  'progress',
  'grateful',
  'steady',
  'improving'
];

const NEGATIVE_WORDS = [
  'anxious',
  'anxiety',
  'worried',
  'worry',
  'panic',
  'fear',
  'stressed',
  'stress',
  'overwhelmed',
  'tired',
  'exhausted',
  'sad',
  'hopeless',
  'lonely',
  'angry',
  'frustrated'
];

const EMOTION_KEYWORDS: Record<string, string[]> = {
  anxiety: ['anxious', 'worry', 'panic', 'nervous', 'fear'],
  stress: ['stress', 'overwhelmed', 'pressure', 'tense'],
  sadness: ['sad', 'down', 'hopeless', 'blue', 'numb'],
  anger: ['angry', 'frustrated', 'irritated', 'mad'],
  fatigue: ['tired', 'exhausted', 'drained', 'worn out']
};

const EASTERN_PRACTICES = [
  '5-minute diaphragmatic breathing (inhale 4, hold 4, exhale 6)',
  'Guided mindfulness body scan releasing jaw, shoulders, and belly',
  'Gentle seated spinal twist and cat-cow to release stagnant energy',
  'Loving-kindness meditation repeating warm, compassionate phrases'
];

const WESTERN_TECHNIQUES = [
  'Cognitive reframing: write the automatic thought, evidence for/against, and a balanced belief',
  'Behavioral activation: schedule a 10-minute nourishing activity in the next 24 hours',
  'Thought labeling: notice and name the thinking pattern (e.g., catastrophizing, mind-reading)',
  '5-4-3-2-1 sensory grounding to reset the nervous system'
];

const HYBRID_BRIDGES = [
  'Pair a grounding breath with one CBT reframe to anchor the new belief',
  'After journaling thoughts, seal the insight with a short compassion mantra',
  'Alternate cognitive reframing with a body-based release to integrate mind and body'
];

const APPROACH_DESCRIPTIONS: Record<ApproachMode, string> = {
  western:
    'Western clinical coaching: highlight thought patterns, behavioral experiments, CBT reframes, and evidence-based coping.',
  eastern:
    'Eastern contemplative coaching: weave in mindfulness, breathwork, somatic awareness, yoga/meditation rituals, and compassion.',
  hybrid:
    'Hybrid guidance: blend CBT-style reflection with mindful, body-based practices so the user experiences both cognitive clarity and calm.'
};

export class ChatService {
  
  async generateAIResponse(
    userId: string,
    userMessage: string,
    sessionId?: string,
    conversationId?: string
  ): Promise<{
    response: string;
    provider?: string;
    model?: string;
    usage?: any;
    botMessage?: any;
    context?: string;
    conversationId?: string;
    conversationTitle?: string;
    recommendations?: RecommendationResult;
    recommendationsMeta?: {
      fallbackUsed: boolean;
      message?: string;
    };
    fallbackMeta?: {
      message: string;
      reason?: string;
    };
  }> {
    let approachMode: ApproachMode = 'hybrid';
    let sentimentSnapshot: SentimentSnapshot | null = null;
    let recommendationResult: RecommendationResult | null = null;
    let activeConversationId = conversationId;
    let newConversationCreated = false;
    let generatedTitle: string | undefined;

    try {
      // Create conversation if none provided
      if (!activeConversationId) {
        const newConversation = await conversationService.createConversation(userId);
        activeConversationId = newConversation.id;
        newConversationCreated = true;
        chatLogger.info({ userId, conversationId: activeConversationId }, 'Created new conversation');
      }

      // Check for crisis language first
      if (this.detectCrisisLanguage(userMessage)) {
        chatLogger.warn({ userId }, 'Crisis language detected in chat message');

        // Save user message with crisis flag
        await this.saveChatMessage(userId, userMessage, 'user', { crisis: true }, activeConversationId);

        // Save crisis response
        const crisisResponse = this.getCrisisResponse();
        const botMessage = await this.saveChatMessage(userId, crisisResponse, 'system', { crisis: true }, activeConversationId);

        // Update conversation timestamp
        if (activeConversationId) {
          await conversationService.updateLastMessageTime(activeConversationId);

          // Generate title if this is a new conversation
          if (newConversationCreated) {
            generatedTitle = await conversationService.generateConversationTitle(activeConversationId);
          }
        }

        return {
          response: crisisResponse,
          provider: 'crisis-system',
          model: 'intervention',
          botMessage,
          context: 'crisis-intervention',
          conversationId: activeConversationId,
          conversationTitle: generatedTitle
        };
      }

      // Get user context and latest wellbeing metrics
      const userContext = await this.getUserContext(userId);

      approachMode = this.determineConversationApproach(userContext, userMessage);
      sentimentSnapshot = this.estimateSentiment(userMessage);

      // Get conversation memory context
      const memoryContext = await conversationMemoryService.getMemory(userId);
      
      // Get contextual awareness (time of day, recent events)
      const contextInsight = contextAwarenessService.getContextualInsight({
        userId,
        recentEvents: [], // This would come from a future tracking system
        emotionalState: sentimentSnapshot.label,
        emotion: sentimentSnapshot.dominantEmotion || 'neutral',
        energyLevel: 'medium', // Could be inferred from messages
        userName: userContext.firstName
      });

      // Check if user is requesting an exercise
      const exerciseRequest = this.detectExerciseRequest(userMessage);
      if (exerciseRequest) {
        // Map sentiment emotion to exercise emotion type
        const emotionMap: Record<string, 'anxiety' | 'stress' | 'anger' | 'depression' | 'overwhelm'> = {
          'anxiety': 'anxiety',
          'stress': 'stress',
          'anger': 'anger',
          'sadness': 'depression',
          'fatigue': 'overwhelm'
        };
        
        const emotion = sentimentSnapshot.dominantEmotion 
          ? (emotionMap[sentimentSnapshot.dominantEmotion] || 'stress')
          : 'stress';

        const recommendedExercise = structuredExercisesService.getRecommendedExercise({
          emotion,
          timeAvailable: exerciseRequest.timeAvailable || 10,
          experienceLevel: 'beginner'
        });

        if (recommendedExercise) {
          const exerciseResponse = structuredExercisesService.formatExerciseForChat(recommendedExercise);
          
          // Save user message
          await this.saveChatMessage(userId, userMessage, 'user', {
            sentiment: sentimentSnapshot,
            exerciseRequested: true
          }, activeConversationId);

          // Save exercise response
          const botMessage = await this.saveChatMessage(userId, exerciseResponse, 'bot', {
            provider: 'structured-exercise',
            exerciseType: recommendedExercise.type,
            exerciseId: recommendedExercise.id
          }, activeConversationId);

          // Update conversation memory
          await conversationMemoryService.updateMemory(userId, userMessage, 'user');

          // Update conversation timestamp
          if (activeConversationId) {
            await conversationService.updateLastMessageTime(activeConversationId);

            // Generate title if this is a new conversation
            if (newConversationCreated) {
              generatedTitle = await conversationService.generateConversationTitle(activeConversationId);
            }
          }

          return {
            response: exerciseResponse,
            provider: 'structured-exercise',
            model: recommendedExercise.type,
            botMessage,
            context: 'exercise-delivery',
            conversationId: activeConversationId,
            conversationTitle: generatedTitle
          };
        }
      }

      // Get recent chat history for context
      const chatHistory = await this.getChatHistory(userId, 8);

      const historyMessages: AIMessage[] = chatHistory
        .reverse()
        .map((msg) => ({
          role: msg.type === 'user' ? 'user' : 'assistant',
          content: msg.content
        }));

      const directives = this.buildCoachingDirectives(approachMode, userContext, sentimentSnapshot);

      recommendationResult = await recommendationService.getContentRecommendations({
        userId,
        userContext,
        approach: approachMode,
        sentiment: sentimentSnapshot,
        wellnessScore: userContext.wellnessScore,
        maxItems: 4
      });

      const systemPrompt = this.buildSystemPrompt({
        approach: approachMode,
        userContext,
        sentiment: sentimentSnapshot,
        directives,
        recommendations: recommendationResult.items,
        memoryContext,
        contextInsight
      });

      const promptMessages: AIMessage[] = [
        { role: 'system', content: systemPrompt },
        ...historyMessages,
        { role: 'user', content: userMessage }
      ];

      const conversationContext = {
        user: { ...userContext, approachEngine: approachMode },
        messages: promptMessages,
        sessionId: sessionId || `session_${userId}_${Date.now()}`,
        timestamp: new Date(),
        recommendations: recommendationResult.items
      };

      chatLogger.info(
        {
          userId,
          approach: approachMode,
          wellnessScore: userContext.wellnessScore ?? null,
          sentimentLabel: sentimentSnapshot?.label ?? null
        },
        'Generating AI response'
      );

      const aiResponse = await llmService.generateResponse(
        promptMessages,
        {
          maxTokens: this.getMaxTokensForApproach(approachMode),
          temperature: this.getTemperatureForApproach(approachMode)
        },
        conversationContext
      );

      if (recommendationResult.fallbackUsed) {
        chatLogger.warn({ userId }, 'Falling back to default recommendations');
      }

      // Save user message (with sentiment metadata)
      await this.saveChatMessage(userId, userMessage, 'user', {
        sentiment: sentimentSnapshot,
        recommendations: recommendationResult.items
      }, activeConversationId);

      // Update conversation memory with user message
      await conversationMemoryService.updateMemory(userId, userMessage, 'user');

      const botMessage = await this.saveChatMessage(userId, aiResponse.content, 'bot', {
        provider: aiResponse.provider,
        model: aiResponse.model,
        processingTime: aiResponse.processingTime,
        tokensUsed: aiResponse.usage?.total_tokens,
        approach: approachMode,
        wellnessScore: userContext.wellnessScore,
        sentiment: sentimentSnapshot,
        directives,
        recommendations: recommendationResult.items,
        recommendationFocus: recommendationResult.focusAreas,
        recommendationRationale: recommendationResult.rationale
      }, activeConversationId);

      // Update conversation memory with bot response
      await conversationMemoryService.updateMemory(userId, aiResponse.content, 'bot');

      // Update conversation timestamp
      if (activeConversationId) {
        await conversationService.updateLastMessageTime(activeConversationId);

        // Generate title if this is a new conversation
        if (newConversationCreated) {
          generatedTitle = await conversationService.generateConversationTitle(activeConversationId);
        }
      }

      chatLogger.info(
        {
          userId,
          conversationId: activeConversationId,
          provider: aiResponse.provider,
          durationMs: aiResponse.processingTime,
          recommendationFallback: recommendationResult.fallbackUsed
        },
        'AI response generated successfully'
      );

      return {
        response: aiResponse.content,
        provider: aiResponse.provider,
        model: aiResponse.model,
        usage: aiResponse.usage,
        botMessage,
        context: `ai-${aiResponse.provider?.toLowerCase()}`,
        conversationId: activeConversationId,
        conversationTitle: generatedTitle,
        recommendations: recommendationResult,
        recommendationsMeta: {
          fallbackUsed: recommendationResult.fallbackUsed,
          message: recommendationResult.fallbackMessage
        }
      };
    } catch (error: any) {
      chatLogger.error({ userId, conversationId: activeConversationId, err: error }, 'Failed to generate AI response, returning fallback');

      // Save user message even on error (preserve metadata if we already computed it)
      await this.saveChatMessage(userId, userMessage, 'user', {
        sentiment: sentimentSnapshot,
        approach: approachMode,
        error: error.message,
        recommendations: recommendationResult?.items ?? []
      }, activeConversationId);

      const fallbackPayload = recommendationResult ?? this.buildEmergencyRecommendationSet(sentimentSnapshot);
      const fallbackResponse = this.getFallbackResponse(userMessage);
      const botMessage = await this.saveChatMessage(userId, fallbackResponse, 'bot', {
        provider: 'fallback',
        approach: approachMode,
        sentiment: sentimentSnapshot,
        error: error.message,
        recommendations: fallbackPayload.items ?? []
      }, activeConversationId);

      // Update conversation timestamp even on error
      if (activeConversationId) {
        await conversationService.updateLastMessageTime(activeConversationId);
        
        // Generate title if this is a new conversation
        if (newConversationCreated) {
          generatedTitle = await conversationService.generateConversationTitle(activeConversationId);
        }
      }

      return {
        response: fallbackResponse,
        provider: 'fallback',
        model: 'system',
        botMessage,
        context: 'fallback',
        conversationId: activeConversationId,
        conversationTitle: generatedTitle,
        recommendations: fallbackPayload,
        recommendationsMeta: {
          fallbackUsed: true,
          message:
            fallbackPayload.fallbackMessage ??
            'We shared a few grounding prompts while our personalised assistant restarts.'
        },
        fallbackMeta: {
          message: 'I shared a supportive prompt while we bring the assistant back online.',
          reason: error?.message
        }
      };
    }
  }

  private async getUserContext(userId: string): Promise<UserContext> {
    const [user, insight] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        include: {
          assessments: {
            orderBy: { completedAt: 'desc' },
            take: 5
          },
          moodEntries: {
            orderBy: { createdAt: 'desc' },
            take: 5
          }
        }
      }),
      (prisma as any).assessmentInsight?.findUnique({
        where: { userId }
      }) ?? null
    ]);

    if (!user) {
      throw new Error('User not found');
    }

    let parsedSummary: AssessmentInsightsPayload | null = null;
    if (insight?.summary) {
      try {
        const rawSummary = typeof insight.summary === 'string' ? insight.summary : JSON.stringify(insight.summary);
        parsedSummary = JSON.parse(rawSummary) as AssessmentInsightsPayload;
      } catch (error) {
        parsedSummary = null;
      }
    }

    const insightsByType: Record<string, AssessmentTypeSummary> | undefined =
      parsedSummary?.insights?.byType ?? undefined;
    const wellnessScore =
      insight?.wellnessScore ?? parsedSummary?.insights?.wellnessScore?.value ?? undefined;
    const wellbeingTrend = insight?.overallTrend ?? parsedSummary?.insights?.overallTrend ?? undefined;
    const aiSummary = insight?.aiSummary ?? parsedSummary?.insights?.aiSummary ?? undefined;

    // Parse assessment responses for detailed context
  const detailedAssessments = user.assessments.map((assessment: typeof user.assessments[number]) => {
      let responses: Record<string, unknown> | null = null;
      try {
        responses = JSON.parse(assessment.responses);
      } catch (e) {
        responses = null;
      }

      return {
        assessmentType: assessment.assessmentType,
        score: assessment.score,
        completedAt: assessment.completedAt,
        responses,
        interpretation: this.interpretAssessmentScore(assessment.assessmentType, assessment.score),
        specificConcerns: this.extractSpecificConcerns(assessment.assessmentType, responses)
      };
    });

    const moodTrend = this.analyzeMoodTrend(user.moodEntries);
    const { age, ageGroup } = this.calculateAgeInfo(user.birthday || undefined);

    return {
      id: user.id,
      name: user.name,
      firstName: user.firstName || undefined,
      lastName: user.lastName || undefined,
      age,
      ageGroup,
      approach: user.approach as 'western' | 'eastern' | 'hybrid' | undefined,
      approachEngine: user.approach as 'western' | 'eastern' | 'hybrid' | undefined,
      recentAssessments: detailedAssessments,
      currentMood: user.moodEntries[0]?.mood,
      moodTrend,
      hasCompletedAssessments: user.assessments.length > 0,
      preferences: {
        emergencyContact: user.emergencyContact,
        dataConsent: user.dataConsent,
        clinicianSharing: user.clinicianSharing
      },
      wellnessScore,
      wellbeingTrend,
      aiSummary,
      assessmentInsights: insightsByType
        ? {
            byType: insightsByType as Record<string, AssessmentTypeSummary>,
            recommendations: this.collectRecommendations(
              insightsByType as Record<string, AssessmentTypeSummary>
            )
          }
        : undefined
    };
  }

  private collectRecommendations(byType: Record<string, AssessmentTypeSummary>): string[] {
    const recommendations = new Set<string>();
    Object.values(byType).forEach((summary) => {
      summary.recommendations?.forEach((rec) => recommendations.add(rec));
    });
    return Array.from(recommendations);
  }

  private determineConversationApproach(userContext: UserContext, userMessage: string): ApproachMode {
    if (userContext.approach) {
      return userContext.approach;
    }

    const normalized = userMessage.toLowerCase();
    const easternCue = /meditat|mindful|breath|yoga|chakra|ayurveda|pranayama|grounding/.test(normalized);
    const westernCue = /thought|pattern|trigger|therapy|cognitive|cbt|journal/.test(normalized);

    if (easternCue && westernCue) {
      return 'hybrid';
    }
    if (easternCue) {
      return 'eastern';
    }
    if (westernCue) {
      return 'western';
    }

    if (userContext.assessmentInsights?.byType) {
      const anxietySummary = userContext.assessmentInsights.byType['anxiety'];
      const stressSummary = userContext.assessmentInsights.byType['stress'];
      if (anxietySummary && anxietySummary.latestScore >= 60) {
        return 'hybrid';
      }
      if (stressSummary && stressSummary.latestScore >= 60) {
        return 'eastern';
      }
    }

    return 'hybrid';
  }

  private estimateSentiment(message: string): SentimentSnapshot {
    const lower = message.toLowerCase();
    let score = 0;
    const matchedKeywords = new Set<string>();

    POSITIVE_WORDS.forEach((word) => {
      if (lower.includes(word)) {
        score += 1;
        matchedKeywords.add(word);
      }
    });

    NEGATIVE_WORDS.forEach((word) => {
      if (lower.includes(word)) {
        score -= 1;
        matchedKeywords.add(word);
      }
    });

    let dominantEmotion: string | null = null;
    for (const [emotion, keywords] of Object.entries(EMOTION_KEYWORDS)) {
      if (keywords.some((keyword) => lower.includes(keyword))) {
        dominantEmotion = emotion;
        break;
      }
    }

    const label = score <= -2 ? 'negative' : score >= 2 ? 'positive' : 'neutral';

    return {
      label,
      score,
      dominantEmotion,
      keywords: Array.from(matchedKeywords),
      summary: `Sentiment ${label} (score ${score})${dominantEmotion ? ` with ${dominantEmotion} tone` : ''}`
    };
  }

  /**
   * Enhanced sentiment analysis with granular emotion detection
   */
  private analyzeEnhancedSentiment(message: string): EnhancedSentiment {
    const lower = message.toLowerCase();
    
    // Emotion scoring
    const emotionScores: Record<string, number> = {
      joy: 0,
      sadness: 0,
      anxiety: 0,
      anger: 0,
      fear: 0
    };

    // Joy indicators
    const joyWords = ['happy', 'great', 'wonderful', 'excited', 'grateful', 'better', 'good', 'progress', 'improving', 'hopeful', 'optimistic', 'proud'];
    joyWords.forEach(word => {
      if (lower.includes(word)) emotionScores.joy += 1;
    });

    // Sadness indicators
    const sadnessWords = ['sad', 'depressed', 'down', 'low', 'empty', 'numb', 'hopeless', 'worthless', 'lonely', 'isolated', 'dark', 'heavy'];
    sadnessWords.forEach(word => {
      if (lower.includes(word)) emotionScores.sadness += 1;
    });

    // Anxiety indicators
    const anxietyWords = ['anxious', 'worried', 'nervous', 'panic', 'overwhelmed', 'racing thoughts', 'can\'t stop', 'what if', 'scared', 'tense', 'on edge'];
    anxietyWords.forEach(word => {
      if (lower.includes(word)) emotionScores.anxiety += 1;
    });

    // Anger indicators
    const angerWords = ['angry', 'frustrated', 'annoyed', 'irritated', 'furious', 'mad', 'hate', 'unfair', 'rage'];
    angerWords.forEach(word => {
      if (lower.includes(word)) emotionScores.anger += 1;
    });

    // Fear indicators
    const fearWords = ['afraid', 'terrified', 'scared', 'fear', 'frightened', 'threatening', 'danger', 'unsafe'];
    fearWords.forEach(word => {
      if (lower.includes(word)) emotionScores.fear += 1;
    });

    // Determine primary emotion
    const maxScore = Math.max(...Object.values(emotionScores));
    let primaryEmotion: 'joy' | 'sadness' | 'anxiety' | 'anger' | 'fear' | 'neutral' = 'neutral';
    
    if (maxScore > 0) {
      const primaryEntry = Object.entries(emotionScores).find(([_, score]) => score === maxScore);
      if (primaryEntry) {
        primaryEmotion = primaryEntry[0] as 'joy' | 'sadness' | 'anxiety' | 'anger' | 'fear';
      }
    }

    // Calculate confidence (0-1)
    const totalEmotionWords = Object.values(emotionScores).reduce((a, b) => a + b, 0);
    const confidence = maxScore > 0 ? Math.min(maxScore / 5, 1) : 0.5;

    // Calculate intensity (0-10)
    const intensity = maxScore > 0 ? Math.min(maxScore * 2, 10) : 5;

    // Get secondary emotions
    const secondary = Object.entries(emotionScores)
      .filter(([emotion, score]) => emotion !== primaryEmotion && score > 0)
      .map(([emotion, score]) => ({
        emotion,
        confidence: Math.min(score / 5, 1)
      }))
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 2);

    // Analyze tone
    const formalWords = ['therefore', 'thus', 'furthermore', 'regarding', 'consequently'];
    const casualWords = ['like', 'kinda', 'sorta', 'yeah', 'stuff', 'things'];
    const formalityScore = formalWords.filter(w => lower.includes(w)).length;
    const casualScore = casualWords.filter(w => lower.includes(w)).length;
    const formality = formalityScore > casualScore ? 0.7 : casualScore > formalityScore ? 0.3 : 0.5;

    const urgencyWords = ['urgent', 'immediately', 'asap', 'emergency', 'critical', 'desperate', 'can\'t wait', 'right now'];
    const urgency = Math.min(urgencyWords.filter(w => lower.includes(w)).length / 3, 1);

    const hopeWords = ['hope', 'maybe', 'try', 'possibly', 'chance', 'looking forward', 'optimistic'];
    const hopelessWords = ['hopeless', 'pointless', 'useless', 'no point', 'give up', 'can\'t see'];
    const hopeScore = hopeWords.filter(w => lower.includes(w)).length;
    const hopelessScore = hopelessWords.filter(w => lower.includes(w)).length;
    const hopefulness = hopeScore > hopelessScore ? 0.7 : hopelessScore > hopeScore ? 0.2 : 0.5;

    // Crisis risk indicators
    const crisisWords = ['suicide', 'kill myself', 'end it all', 'better off dead', 'self-harm', 'hurt myself', 'no reason to live'];
    const crisisRisk = Math.min(crisisWords.filter(w => lower.includes(w)).length / 2, 1);

    // Progress indicators
    const progressWords = ['better', 'improving', 'progress', 'working', 'trying', 'learning', 'growing'];
    const progressIndicators = progressWords.filter(w => lower.includes(w));

    // Concerning patterns
    const concerningWords = ['always anxious', 'never happy', 'can\'t cope', 'falling apart', 'losing control', 'can\'t function'];
    const concerningPatterns = concerningWords.filter(w => lower.includes(w));

    // Linguistic features
    const questionCount = (message.match(/\?/g) || []).length;
    const exclamationCount = (message.match(/!/g) || []).length;
    const negationWords = ['not', 'no', 'never', 'nothing', 'nobody', 'nowhere', 'neither', 'none'];
    const negationCount = negationWords.filter(w => lower.includes(w)).length;
    const firstPersonWords = ['i ', 'i\'m', 'i\'ve', 'i\'ll', 'my ', 'me ', 'myself'];
    const firstPersonCount = firstPersonWords.filter(w => lower.includes(w)).length;
    const absoluteWords = ['always', 'never', 'completely', 'totally', 'entirely', 'absolutely', 'every', 'all', 'none'];
    const foundAbsolutes = absoluteWords.filter(w => lower.includes(w));

    return {
      primary: {
        emotion: primaryEmotion,
        confidence,
        intensity
      },
      secondary,
      tone: {
        formality,
        urgency,
        hopefulness
      },
      indicators: {
        crisisRisk,
        progressIndicators,
        concerningPatterns
      },
      linguisticFeatures: {
        questionCount,
        exclamationCount,
        negationCount,
        firstPersonCount,
        absoluteWords: foundAbsolutes
      }
    };
  }

  private buildCoachingDirectives(
    approach: ApproachMode,
    userContext: UserContext,
    sentiment: SentimentSnapshot
  ): CoachingDirectives {
    const byType = (userContext.assessmentInsights?.byType ?? {}) as Record<string, AssessmentTypeSummary>;
    const westernFocus: string[] = [];
    const easternPractices: string[] = [];
    const hybridBridge: string[] = [];
    const reminders: string[] = [];

    const anxietySummary = byType['anxiety'];
    const stressSummary = byType['stress'];
    const overthinkingSummary = byType['overthinking'];
    const emotionalIntelligenceSummary = byType['emotionalIntelligence'];

    if (anxietySummary && anxietySummary.latestScore >= 60) {
      westernFocus.push('Name anxious prediction loops and guide a CBT-style reframe with evidence.');
      easternPractices.push('Lead a calming breath such as 4-7-8 breathing to quiet the nervous system.');
    }

    if (stressSummary && stressSummary.latestScore >= 60) {
      westernFocus.push('Break overwhelming tasks into micro-steps and prioritise one action they can take.');
      easternPractices.push('Suggest a five-minute mindful walk noticing breath and sensations.');
    }

    if (overthinkingSummary && overthinkingSummary.latestScore >= 60) {
      westernFocus.push('Encourage thought-labeling and a worry journal to park looping thoughts.');
      easternPractices.push('Offer a sound-based grounding meditation to interrupt rumination.');
    }

    if (emotionalIntelligenceSummary && emotionalIntelligenceSummary.latestScore < 50) {
      westernFocus.push('Help them name the emotion, the trigger, and the need underneath it.');
      easternPractices.push('Invite a compassion-based mantra repeating “I am allowed to feel and release this.”');
    }

    if (sentiment.label === 'negative') {
      westernFocus.push('Affirm their feeling, then co-create a realistic experiment or boundary to regain control.');
      reminders.push('Keep tone warm, trauma-informed, and avoid minimizing difficult emotions.');
    } else if (sentiment.label === 'positive') {
      westernFocus.push('Reinforce what is working and highlight strengths they mentioned.');
      reminders.push('Celebrate progress briefly, then invite them to anchor the helpful pattern.');
    } else {
      reminders.push('Balance validation with gentle curiosity to surface underlying needs.');
    }

    if (userContext.wellnessScore && userContext.wellnessScore < 55) {
      hybridBridge.push('Mention their wellness index and encourage tracking one daily micro-win.');
    }

    if (approach === 'hybrid') {
      hybridBridge.push(...HYBRID_BRIDGES.slice(0, 2));
    } else if (approach === 'western') {
      westernFocus.push('Use evidence-based language (CBT, behavioral activation, journaling prompts).');
    } else if (approach === 'eastern') {
      easternPractices.push('Guide a short mindfulness ritual or somatic release aligned with their energy.');
    }

    if (easternPractices.length === 0) {
      easternPractices.push(...EASTERN_PRACTICES.slice(0, 2));
    }

    if (westernFocus.length === 0) {
      westernFocus.push(...WESTERN_TECHNIQUES.slice(0, 2));
    }

    if (hybridBridge.length === 0) {
      hybridBridge.push(HYBRID_BRIDGES[0]);
    }

    if (reminders.length === 0) {
      reminders.push('Close with a gentle invitation to share how the suggestion lands and offer professional resources if distress escalates.');
    }

    return {
      westernFocus: Array.from(new Set(westernFocus)).slice(0, 3),
      easternPractices: Array.from(new Set(easternPractices)).slice(0, 3),
      hybridBridge: Array.from(new Set(hybridBridge)).slice(0, 2),
      reminders: Array.from(new Set(reminders)).slice(0, 2)
    };
  }

  private buildSystemPrompt(args: {
    approach: ApproachMode;
    userContext: UserContext;
    sentiment: SentimentSnapshot;
    directives: CoachingDirectives;
    recommendations?: RecommendationResult['items'];
    memoryContext?: any;
    contextInsight?: any;
  }): string {
    const { approach, userContext, sentiment, directives, recommendations = [], memoryContext, contextInsight } = args;

    const wellnessText = userContext.wellnessScore
      ? `${userContext.wellnessScore.toFixed(1)} / 100`
      : 'not yet calculated';

    const trendText = userContext.wellbeingTrend ?? 'trend unavailable';

    const recommendationHighlights = userContext.assessmentInsights?.recommendations?.slice(0, 2) ?? [];
    const recommendationText = recommendationHighlights.length
      ? `Key personalised recommendations so far:\n- ${recommendationHighlights.join('\n- ')}`
      : 'No stored recommendations yet—use the insights below to craft new ones.';

    const domainText = userContext.assessmentInsights?.byType
      ? `Latest assessment signals:\n${Object.entries(
          userContext.assessmentInsights.byType as Record<string, AssessmentTypeSummary>
        )
          .slice(0, 4)
          .map(([type, summary]) => {
            const label = type
              .replace(/([A-Z])/g, ' $1')
              .replace(/^./, (c) => c.toUpperCase());
            return `- ${label.trim()}: score ${Math.round(summary.latestScore || 0)} (normalized ${Math.round(
              summary.normalizedScore || 0
            )}, trend ${summary.trend})`;
          })
          .join('\n')}`
      : null;

    const recommendationLines = recommendations.slice(0, 3).map((item) => {
      const sourceTag = item.source === 'library' ? 'library' : 'fallback';
      return `- ${item.title} (${item.type}) → ${item.reason} [${sourceTag}]`;
    });

    const recommendationSection = recommendationLines.length
      ? `Recommended resources to consider next:\n${recommendationLines.join('\n')}`
      : null;

    const directivesText = [
      directives.westernFocus.length
        ? `Conversation focus (western):
- ${directives.westernFocus.join('\n- ')}`
        : null,
      directives.easternPractices.length
        ? `Somatic / mindfulness suggestions (eastern):
- ${directives.easternPractices.join('\n- ')}`
        : null,
      directives.hybridBridge.length
        ? `Bridge ideas to blend mind and body work:
- ${directives.hybridBridge.join('\n- ')}`
        : null,
      directives.reminders.length
        ? `Coaching reminders:
- ${directives.reminders.join('\n- ')}`
        : null
    ]
      .filter(Boolean)
      .join('\n\n');

    // Build conversation memory context
    let memorySection = '';
    if (memoryContext) {
      if (memoryContext.recentTopics && memoryContext.recentTopics.length > 0) {
        memorySection += `\nRECENT CONVERSATION TOPICS:\n`;
        memorySection += memoryContext.recentTopics.slice(0, 5).map((topic: any) => 
          `- ${topic.topic} (mentioned ${topic.count} times, last on ${new Date(topic.lastMentioned).toLocaleDateString()})`
        ).join('\n');
      }

      if (memoryContext.recurringThemes && memoryContext.recurringThemes.length > 0) {
        memorySection += `\n\nRECURRING THEMES TO BE AWARE OF:\n`;
        memorySection += memoryContext.recurringThemes.slice(0, 3).map((theme: string) => `- ${theme}`).join('\n');
      }

      if (memoryContext.emotionalPatterns) {
        const { predominantMood, recentShift } = memoryContext.emotionalPatterns;
        if (predominantMood) {
          memorySection += `\n\nEMOTIONAL PATTERNS:\n`;
          memorySection += `Predominant mood: ${predominantMood}\n`;
          if (recentShift) {
            memorySection += `Recent shift: ${recentShift}\n`;
          }
        }
      }

      if (memoryContext.conversationStyle) {
        memorySection += `\nCONVERSATION STYLE:\n`;
        memorySection += `User prefers ${memoryContext.conversationStyle.preferredLength} responses and engages at ${memoryContext.conversationStyle.responsiveness} level.\n`;
      }
    }

    // Build contextual awareness section
    let contextSection = '';
    if (contextInsight) {
      contextSection = contextAwarenessService.buildContextPrompt(contextInsight);
    }

    return [
      `You are a compassionate wellbeing coach. ${APPROACH_DESCRIPTIONS[approach]}`,
      `Overall mental wellness score: ${wellnessText}. Trend: ${trendText}.`,
      userContext.aiSummary ? `Previous AI summary cue: ${userContext.aiSummary}` : null,
      domainText,
      `Latest message sentiment: ${sentiment.summary}. Keywords: ${
        sentiment.keywords.length ? sentiment.keywords.join(', ') : 'none detected'
      }`,
      recommendationText,
      recommendationSection,
      directivesText,
      memorySection || null,
      contextSection || null,
      'When you respond: 1) validate emotion, 2) reflect a thought/behavior pattern, 3) offer one practical action aligned with the approach, 4) close with a gentle question. Keep it under 150 words, trauma-informed, and avoid clinical diagnoses. Remind about professional help if they disclose severe risk.'
    ]
      .filter(Boolean)
      .join('\n\n');
  }

  private getTemperatureForApproach(approach: ApproachMode): number {
    switch (approach) {
      case 'western':
        return 0.55;
      case 'eastern':
        return 0.7;
      default:
        return 0.65;
    }
  }

  private getMaxTokensForApproach(approach: ApproachMode): number {
    switch (approach) {
      case 'western':
        return 200;
      case 'eastern':
        return 220;
      default:
        return 220;
    }
  }

  /**
   * Interpret assessment scores to provide meaningful context
   */
  private interpretAssessmentScore(assessmentType: string, score: number): string {
    switch (assessmentType.toLowerCase()) {
      case 'phq-9':
      case 'depression':
        if (score <= 4) return 'minimal depression';
        if (score <= 9) return 'mild depression';
        if (score <= 14) return 'moderate depression';
        if (score <= 19) return 'moderately severe depression';
        return 'severe depression';
      
      case 'gad-7':
      case 'anxiety':
        if (score <= 4) return 'minimal anxiety';
        if (score <= 9) return 'mild anxiety';
        if (score <= 14) return 'moderate anxiety';
        return 'severe anxiety';
      
      case 'stress':
        if (score <= 3) return 'low stress';
        if (score <= 6) return 'moderate stress';
        if (score <= 8) return 'high stress';
        return 'very high stress';
      
      case 'emotionalintelligence':
        if (score >= 8) return 'high emotional intelligence';
        if (score >= 6) return 'moderate emotional intelligence';
        return 'developing emotional intelligence';
      
      default:
        return score > 5 ? 'elevated concerns' : 'manageable levels';
    }
  }

  /**
   * Extract specific concerns from assessment responses
   */
  private extractSpecificConcerns(assessmentType: string, responses: any): string[] {
    if (!responses || typeof responses !== 'object') return [];
    
    const concerns: string[] = [];
    
    try {
      // PHQ-9 specific concerns
      if (assessmentType.toLowerCase().includes('phq') || assessmentType.toLowerCase().includes('depression')) {
        if (responses['sleep'] && parseInt(responses['sleep']) > 2) concerns.push('sleep difficulties');
        if (responses['appetite'] && parseInt(responses['appetite']) > 2) concerns.push('appetite changes');
        if (responses['concentration'] && parseInt(responses['concentration']) > 2) concerns.push('concentration issues');
        if (responses['energy'] && parseInt(responses['energy']) > 2) concerns.push('low energy');
        if (responses['selfEsteem'] && parseInt(responses['selfEsteem']) > 2) concerns.push('self-esteem issues');
      }
      
      // GAD-7 specific concerns
      if (assessmentType.toLowerCase().includes('gad') || assessmentType.toLowerCase().includes('anxiety')) {
        if (responses['restless'] && parseInt(responses['restless']) > 2) concerns.push('restlessness');
        if (responses['worry'] && parseInt(responses['worry']) > 2) concerns.push('excessive worry');
        if (responses['irritable'] && parseInt(responses['irritable']) > 2) concerns.push('irritability');
        if (responses['relaxing'] && parseInt(responses['relaxing']) > 2) concerns.push('difficulty relaxing');
      }
      
      // General stress concerns
      if (assessmentType.toLowerCase().includes('stress')) {
        if (responses['overwhelmed'] && parseInt(responses['overwhelmed']) > 2) concerns.push('feeling overwhelmed');
        if (responses['physical'] && parseInt(responses['physical']) > 2) concerns.push('physical stress symptoms');
      }
      
    } catch (e) {
      // If parsing fails, return empty array
    }
    
    return concerns;
  }

  /**
   * Analyze mood trend from recent entries
   */
  private analyzeMoodTrend(moodEntries: any[]): string {
    if (moodEntries.length === 0) return 'no mood data available';
    if (moodEntries.length === 1) return 'limited mood data';
    
    const moodValues: { [key: string]: number } = {
      'Great': 5,
      'Good': 4,
      'Okay': 3,
      'Struggling': 2,
      'Anxious': 1
    };
    
    const recent = moodEntries.slice(0, 3).map(entry => moodValues[entry.mood] || 3);
    const avg = recent.reduce((a, b) => a + b, 0) / recent.length;
    
    if (recent.length >= 2) {
      const isImproving = recent[0] > recent[1];
      const isDeclining = recent[0] < recent[1];
      
      if (isImproving) return 'mood improving';
      if (isDeclining) return 'mood declining';
    }
    
    if (avg >= 4) return 'generally positive mood';
    if (avg <= 2) return 'consistently low mood';
    return 'variable mood';
  }

  /**
   * Calculate age and age group from birthday
   */
  private calculateAgeInfo(birthday?: Date): { age?: number; ageGroup?: 'teen' | 'young-adult' | 'adult' | 'middle-aged' | 'senior' } {
    if (!birthday) {
      return { age: undefined, ageGroup: undefined };
    }

    const today = new Date();
    const birthDate = new Date(birthday);
    
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDifference = today.getMonth() - birthDate.getMonth();
    
    // Adjust age if birthday hasn't occurred this year
    if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    // Determine age group
    let ageGroup: 'teen' | 'young-adult' | 'adult' | 'middle-aged' | 'senior';
    
    if (age >= 13 && age <= 19) {
      ageGroup = 'teen';
    } else if (age >= 20 && age <= 29) {
      ageGroup = 'young-adult';
    } else if (age >= 30 && age <= 49) {
      ageGroup = 'adult';
    } else if (age >= 50 && age <= 64) {
      ageGroup = 'middle-aged';
    } else {
      ageGroup = 'senior';
    }

    return { age, ageGroup };
  }

  private async getChatHistory(userId: string, limit: number = 10): Promise<any[]> {
    return await prisma.chatMessage.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit * 2, // Get more to account for user/bot pairs
    });
  }

  async saveChatMessage(
    userId: string,
    content: string,
    type: 'user' | 'bot' | 'system',
    metadata?: any,
    conversationId?: string
  ): Promise<any> {
    // If no conversationId provided, this should never happen in normal flow
    // but we'll handle it for backward compatibility
    if (!conversationId) {
      throw new Error('conversationId is required for saving chat messages');
    }

    return await prisma.chatMessage.create({
      data: {
        conversationId,
        userId,
        content,
        type,
        metadata: metadata ? JSON.stringify(metadata) : null
      }
    });
  }

  detectCrisisLanguage(message: string): boolean {
    const crisisKeywords = [
      'suicide', 'suicidal', 'kill myself', 'end it all', 'don\'t want to live',
      'hurt myself', 'self harm', 'self-harm', 'cutting', 'overdose',
      'hopeless', 'no point', 'better off dead', 'want to die',
      'can\'t go on', 'end my life', 'not worth living'
    ];
    
    const lowerMessage = message.toLowerCase();
    return crisisKeywords.some(keyword => lowerMessage.includes(keyword));
  }

  detectExerciseRequest(message: string): { requested: boolean; timeAvailable?: number } | null {
    const lowerMessage = message.toLowerCase();
    
    // Exercise keywords
    const exerciseKeywords = [
      'exercise', 'breathing', 'meditation', 'mindfulness', 'relaxation',
      'grounding', 'calm down', 'technique', 'practice', 'cbt',
      'thought record', 'muscle relaxation', 'body scan'
    ];

    const hasExerciseKeyword = exerciseKeywords.some(keyword => lowerMessage.includes(keyword));
    
    // Check for request patterns
    const requestPatterns = [
      'can you help me',
      'give me',
      'show me',
      'teach me',
      'walk me through',
      'guide me',
      'i want to try',
      'i need',
      'help me',
      'what should i do'
    ];

    const hasRequestPattern = requestPatterns.some(pattern => lowerMessage.includes(pattern));

    if (hasExerciseKeyword || hasRequestPattern) {
      // Try to extract time available
      let timeAvailable: number | undefined;
      
      const timeMatch = lowerMessage.match(/(\d+)\s*(minute|min|hour)/);
      if (timeMatch) {
        const value = parseInt(timeMatch[1]);
        const unit = timeMatch[2];
        timeAvailable = unit.includes('hour') ? value * 60 : value;
      } else if (lowerMessage.includes('quick') || lowerMessage.includes('short')) {
        timeAvailable = 5;
      } else if (lowerMessage.includes('long') || lowerMessage.includes('detailed')) {
        timeAvailable = 15;
      }

      return {
        requested: true,
        timeAvailable
      };
    }

    return null;
  }

  getCrisisResponse(): string {
    return `I'm very concerned about your safety and wellbeing. If you're having thoughts of hurting yourself, please reach out for immediate help:

🆘 **Crisis Resources:**
• **National Suicide Prevention Lifeline**: 988 or 1-800-273-8255
• **Crisis Text Line**: Text HOME to 741741
• **Emergency Services**: 911

You are not alone, and there are people who want to help you. Please consider reaching out to a trusted friend, family member, or professional.

Would you like me to help you find local resources?`;
  }

  getFallbackResponse(userMessage: string): string {
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('anxious') || lowerMessage.includes('anxiety')) {
      return "I can hear that you're feeling anxious. Anxiety can be really overwhelming, but you're taking a positive step by reaching out. One thing that might help right now is taking some slow, deep breaths. What's been on your mind lately that's contributing to these feelings?";
    }
    
    if (lowerMessage.includes('sad') || lowerMessage.includes('depressed')) {
      return "I'm sorry you're feeling this way. Those feelings are valid, and it's important that you're talking about them. Sometimes when we're feeling down, it can help to focus on small, manageable things. Is there something small that usually brings you a bit of comfort?";
    }
    
    if (lowerMessage.includes('stress') || lowerMessage.includes('overwhelmed')) {
      return "Feeling overwhelmed can be really difficult to manage. It sounds like you have a lot on your plate right now. Sometimes it helps to break things down into smaller, more manageable pieces. What's the most pressing thing you're dealing with right now?";
    }
    
    // Default empathetic response
    return "Thank you for sharing with me. I can hear that you're going through something difficult right now. While I'm having some technical difficulties, I want you to know that your feelings are important and valid. How are you feeling in this moment?";
  }

  private buildEmergencyRecommendationSet(sentiment?: SentimentSnapshot | null): RecommendationResult {
    const focus = sentiment?.dominantEmotion?.toLowerCase() ?? 'wellbeing';
    const recommendations: RecommendationResult = {
      items: [
        {
          title: 'Two-minute grounding breath',
          type: 'suggestion',
          reason: 'Pause, inhale for four counts, hold for four, exhale for six to settle your nervous system.',
          source: 'fallback',
          metadata: { fallback: true, focus }
        },
        {
          title: 'Compassion check-in',
          type: 'suggestion',
          reason: 'Place a hand on your heart and name one kind thing you can tell yourself right now.',
          source: 'fallback',
          metadata: { fallback: true, focus }
        },
        {
          title: 'Micro-journal prompt',
          type: 'suggestion',
          reason: 'Write down what feels heavy, what you need, and one small action to support that need today.',
          source: 'fallback',
          metadata: { fallback: true, focus }
        }
      ],
      focusAreas: [focus],
      rationale: 'Default support suggestions while personalised recommendations are restored.',
      fallbackUsed: true,
      fallbackMessage: 'We shared a few quick grounding ideas while we reconnect to personalised content.'
    };

    return recommendations;
  }

  async getConversationInsights(userId: string): Promise<any> {
    const recentMessages = await prisma.chatMessage.findMany({
      where: { 
        userId,
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const userMessages = recentMessages.filter(m => m.type === 'user');
    const totalMessages = userMessages.length;

    // Basic insights
    let anxietyMentions = 0;
    let depressionMentions = 0;
    let stressMentions = 0;

    const anxietyKeywords = ['anxious', 'anxiety', 'worried', 'nervous', 'panic'];
    const depressionKeywords = ['depressed', 'depression', 'sad', 'hopeless', 'empty'];
    const stressKeywords = ['stressed', 'stress', 'overwhelmed', 'pressure'];

    for (const message of userMessages) {
      const content = message.content.toLowerCase();
      
      if (anxietyKeywords.some(keyword => content.includes(keyword))) {
        anxietyMentions++;
      }
      if (depressionKeywords.some(keyword => content.includes(keyword))) {
        depressionMentions++;
      }
      if (stressKeywords.some(keyword => content.includes(keyword))) {
        stressMentions++;
      }
    }

    return {
      totalMessages,
      messageFrequency: {
        anxiety: anxietyMentions,
        depression: depressionMentions,
        stress: stressMentions
      },
      period: '7 days',
      insights: {
        mostDiscussedTopic: anxietyMentions >= depressionMentions && anxietyMentions >= stressMentions 
          ? 'anxiety' 
          : depressionMentions >= stressMentions 
          ? 'depression' 
          : 'stress',
        engagementLevel: totalMessages > 10 ? 'high' : totalMessages > 5 ? 'medium' : 'low'
      }
    };
  }

  /**
   * Get AI provider status for debugging
   */
  async getProviderStatus(): Promise<any> {
    return await llmService.getProviderStatus();
  }

  /**
   * Test AI providers
   */
  async testProviders(): Promise<any> {
    return await llmService.testAllProviders();
  }

  /**
   * Clear chat history for user
   */
  async clearChatHistory(userId: string): Promise<void> {
    await prisma.chatMessage.deleteMany({
      where: { userId }
    });
  }

  /**
   * Get conversation topic suggestions based on user context and history
   */
  async getConversationStarters(userId: string): Promise<string[]> {
    try {
      const context = await this.getUserContext(userId);
      const memory = await conversationMemoryService.getMemory(userId);
      const starters: string[] = [];

      // Based on assessment scores
      const anxietyScore = context.assessmentInsights?.byType?.anxiety?.latestScore;
      const depressionScore = context.assessmentInsights?.byType?.depression?.latestScore;
      const stressScore = context.assessmentInsights?.byType?.stress?.latestScore;

      if (anxietyScore && anxietyScore > 60) {
        starters.push("💭 Let's talk about what's been making you anxious");
      }
      if (depressionScore && depressionScore > 60) {
        starters.push("🌧️ I'd like to talk about how I've been feeling lately");
      }
      if (stressScore && stressScore > 60) {
        starters.push("😰 Help me manage the stress I'm dealing with");
      }

      // Based on time since last chat
      const lastMessage = await prisma.chatMessage.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' }
      });

      if (lastMessage) {
        const daysSince = Math.floor((Date.now() - lastMessage.createdAt.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysSince > 3) {
          starters.push(`👋 It's been ${daysSince} days - what's new with you?`);
        } else if (daysSince === 0) {
          starters.push("💬 Continue our conversation from earlier");
        }
      }

      // Based on recurring themes from memory
      if (memory.recurringThemes?.includes('work')) {
        starters.push("💼 How have things been at work recently?");
      }
      if (memory.recurringThemes?.includes('relationships')) {
        starters.push("💕 Talk about my relationships");
      }
      if (memory.recurringThemes?.includes('sleep')) {
        starters.push("😴 I'm having trouble sleeping again");
      }

      // Progress check
      if (context.wellnessScore) {
        if (context.wellbeingTrend === 'improving') {
          starters.push("📈 Let's review my progress together");
        } else if (context.wellbeingTrend === 'declining') {
          starters.push("📉 I feel like I'm struggling more lately");
        }
      }

      // Time-based suggestions
      const hour = new Date().getHours();
      if (hour >= 21 || hour <= 5) {
        starters.push("🌙 Having trouble sleeping tonight");
      } else if (hour >= 6 && hour <= 9) {
        starters.push("☀️ Help me start my day with the right mindset");
      }

      // Always include general options
      if (starters.length < 4) {
        starters.push("🧘 I'd like to try a relaxation exercise");
        starters.push("📝 Help me process my thoughts and feelings");
        starters.push("❓ I have a question about mental wellness");
        starters.push("🎯 Set a personal goal with me");
      }

      // Return max 6 starters
      return starters.slice(0, 6);
    } catch (error) {
      chatLogger.error({ userId, err: error }, 'Failed to generate conversation starters');
      // Return default starters on error
      return [
        "💬 How are you feeling today?",
        "🧘 I'd like to try a relaxation exercise",
        "📝 Help me process my thoughts",
        "❓ I have a question about mental wellness"
      ];
    }
  }

  /**
   * Get last chat time for a user
   */
  private async getLastChatTime(userId: string): Promise<Date> {
    const lastMessage = await prisma.chatMessage.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
    return lastMessage?.createdAt || new Date(0);
  }

  /**
   * Generate contextual smart reply suggestions
   */
  generateSmartReplies(
    userMessage: string,
    botResponse: string,
    sentiment: SentimentSnapshot | null
  ): string[] {
    const replies: string[] = [];
    const lowerBot = botResponse.toLowerCase();
    const lowerUser = userMessage.toLowerCase();

    // Question-based replies
    if (lowerBot.includes('how are you feeling') || lowerBot.includes('how do you feel')) {
      if (sentiment?.dominantEmotion === 'anxiety') {
        replies.push("😰 Anxious and worried");
      }
      if (sentiment?.dominantEmotion === 'sadness') {
        replies.push("😔 Sad and down");
      }
      replies.push("😊 Pretty good actually");
      replies.push("😐 Okay, I guess");
      replies.push("😣 Not great, to be honest");
    } else if (lowerBot.includes('tell me more') || lowerBot.includes('can you elaborate')) {
      replies.push("💭 Let me explain in detail");
      replies.push("🤷 I'm not sure how to describe it");
      replies.push("⏭️ Let's move on to something else");
    } else if (lowerBot.includes('breathing') || lowerBot.includes('exercise') || lowerBot.includes('meditation')) {
      replies.push("✅ Let's do it right now");
      replies.push("📌 Save this for later");
      replies.push("🔄 Try something different instead");
    } else if (lowerBot.includes('would you like') || lowerBot.includes('do you want')) {
      replies.push("✅ Yes, please");
      replies.push("❌ No, thanks");
      replies.push("🤔 I'm not sure yet");
    } else if (lowerBot.match(/\?$/)) {
      // Generic question
      replies.push("✅ Yes");
      replies.push("❌ No");
      replies.push("🤔 Maybe");
    }

    // Sentiment-based suggestions
    if (sentiment?.label === 'negative' && replies.length < 3) {
      replies.push("😢 I need more support");
      replies.push("🆘 This is really hard right now");
    } else if (sentiment?.label === 'positive' && replies.length < 3) {
      replies.push("💪 I'm feeling better about this");
      replies.push("🙏 Thank you, that helps");
    }

    // Context-based suggestions
    if (lowerBot.includes('progress') || lowerBot.includes('improvement')) {
      replies.push("📊 Show me my progress");
    }
    if (lowerBot.includes('assessment') || lowerBot.includes('check-in')) {
      replies.push("📝 Take an assessment");
    }

    // Always include general options
    if (replies.length < 4) {
      replies.push("💬 Tell me more about that");
      replies.push("🔄 Change topic");
    }

    // Remove duplicates and limit to 4
    return Array.from(new Set(replies)).slice(0, 4);
  }

  /**
   * Generate AI-powered conversation summary
   */
  async generateConversationSummary(userId: string, sessionId?: string): Promise<{
    summary: string;
    keyInsights: string[];
    emotionalTrends: string[];
    topicsDiscussed: string[];
    actionItems: string[];
    overallSentiment: string;
  }> {
    try {
      // Get recent messages (session or last 20)
      const messages = await prisma.chatMessage.findMany({
        where: {
          userId,
          ...(sessionId && { sessionId })
        },
        orderBy: { createdAt: 'desc' },
        take: sessionId ? undefined : 20
      });

      if (messages.length === 0) {
        return {
          summary: 'No conversation to summarize yet.',
          keyInsights: [],
          emotionalTrends: [],
          topicsDiscussed: [],
          actionItems: [],
          overallSentiment: 'neutral'
        };
      }

      // Format conversation for AI
      const conversationText = messages.reverse().map(msg => 
        `${msg.type === 'user' ? 'User' : 'AI'}: ${msg.content}`
      ).join('\n');

      // Get memory for context
      const memory = await conversationMemoryService.getMemory(userId);

      // Generate summary using AI
      const summaryPrompt = `Please analyze this wellbeing conversation and provide a structured summary:

Conversation:
${conversationText}

Recurring themes from user's history: ${memory.recurringThemes?.join(', ') || 'None'}

Provide a JSON response with:
1. summary: A brief 2-3 sentence overview of the conversation
2. keyInsights: Array of 3-5 key insights about the user's mental state
3. emotionalTrends: Array of 2-3 emotional patterns observed
4. topicsDiscussed: Array of main topics covered
5. actionItems: Array of suggested next steps or exercises
6. overallSentiment: One word - positive, negative, or neutral

Format as valid JSON only.`;

      const response = await llmService.generateResponse(
        [{ role: 'user', content: summaryPrompt }],
        {
          temperature: 0.3,
          maxTokens: 800
        }
      );

      // Parse AI response
      let summaryData;
      try {
        const jsonMatch = response.content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          summaryData = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No JSON found in response');
        }
      } catch (error) {
        // Fallback to basic summary
        return {
          summary: `Conversation covered ${messages.length} messages discussing wellbeing topics.`,
          keyInsights: ['User engaged in therapeutic conversation'],
          emotionalTrends: ['Mixed emotions observed'],
          topicsDiscussed: memory.recurringThemes || ['General wellbeing'],
          actionItems: ['Continue regular check-ins'],
          overallSentiment: 'neutral'
        };
      }

      return {
        summary: summaryData.summary || '',
        keyInsights: summaryData.keyInsights || [],
        emotionalTrends: summaryData.emotionalTrends || [],
        topicsDiscussed: summaryData.topicsDiscussed || [],
        actionItems: summaryData.actionItems || [],
        overallSentiment: summaryData.overallSentiment || 'neutral'
      };
    } catch (error) {
      console.error('Error generating conversation summary:', error);
      throw error;
    }
  }

  /**
   * Get personalized check-in prompt based on user patterns
   */
  async getProactiveCheckIn(userId: string): Promise<{
    shouldCheckIn: boolean;
    message: string;
    reason: string;
    priority: 'high' | 'medium' | 'low';
  }> {
    try {
      const context = await this.getUserContext(userId);
      const memory = await conversationMemoryService.getMemory(userId);

      // Get last message timestamp
      const lastMessage = await prisma.chatMessage.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' }
      });

      if (!lastMessage) {
        return {
          shouldCheckIn: false,
          message: '',
          reason: 'No conversation history',
          priority: 'low'
        };
      }

      const hoursSinceLastChat = (Date.now() - lastMessage.createdAt.getTime()) / (1000 * 60 * 60);
      const daysSinceLastChat = Math.floor(hoursSinceLastChat / 24);

      // High priority check-ins
      // 1. User mentioned crisis keywords recently
      const recentMessages = await prisma.chatMessage.findMany({
        where: { 
          userId,
          createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      });

      const hasCrisisIndicators = recentMessages.some(msg => 
        msg.type === 'user' && (
          msg.content.toLowerCase().includes('hopeless') ||
          msg.content.toLowerCase().includes('can\'t go on') ||
          msg.content.toLowerCase().includes('overwhelmed')
        )
      );

      if (hasCrisisIndicators && hoursSinceLastChat >= 4) {
        return {
          shouldCheckIn: true,
          message: "I've been thinking about our last conversation. How are you feeling now? I'm here if you need support.",
          reason: 'Crisis follow-up',
          priority: 'high'
        };
      }

      // 2. High anxiety/depression scores + no contact for 2 days
      const anxietyScore = context.assessmentInsights?.byType?.anxiety?.latestScore || 0;
      const depressionScore = context.assessmentInsights?.byType?.depression?.latestScore || 0;

      if ((anxietyScore > 60 || depressionScore > 60) && daysSinceLastChat >= 2) {
        return {
          shouldCheckIn: true,
          message: `Hi! I noticed it's been ${daysSinceLastChat} days since we last talked. How have you been managing your ${anxietyScore > 60 ? 'anxiety' : 'mood'}?`,
          reason: 'High scores + inactive',
          priority: 'high'
        };
      }

      // Medium priority check-ins
      // 3. Consistent user but missed their pattern
      if (memory.averageSessionsPerWeek && memory.averageSessionsPerWeek >= 3 && daysSinceLastChat >= 3) {
        return {
          shouldCheckIn: true,
          message: `Hey there! I noticed we haven't chatted in a few days. Everything okay? I'm here whenever you need to talk.`,
          reason: 'Pattern deviation',
          priority: 'medium'
        };
      }

      // 4. User showed improvement, check-in to maintain progress
      const wellnessTrend = context.wellnessInsights?.trend;
      if (wellnessTrend === 'improving' && daysSinceLastChat >= 5) {
        return {
          shouldCheckIn: true,
          message: "You were making great progress! How are you maintaining your positive momentum? I'd love to hear an update.",
          reason: 'Progress maintenance',
          priority: 'medium'
        };
      }

      // Low priority check-ins
      // 5. Regular weekly check-in
      if (daysSinceLastChat >= 7) {
        return {
          shouldCheckIn: true,
          message: "It's been a week! I wanted to check in and see how things are going. What's been on your mind lately?",
          reason: 'Weekly check-in',
          priority: 'low'
        };
      }

      // No check-in needed
      return {
        shouldCheckIn: false,
        message: '',
        reason: 'Recent contact',
        priority: 'low'
      };
    } catch (error) {
      console.error('Error generating proactive check-in:', error);
      return {
        shouldCheckIn: false,
        message: '',
        reason: 'Error',
        priority: 'low'
      };
    }
  }

  /**
   * Generate mood-based greeting
   */
  async getMoodBasedGreeting(userId: string): Promise<string> {
    try {
      const context = await this.getUserContext(userId);
      const memory = await conversationMemoryService.getMemory(userId);
      
      const userName = context.firstName || 'there';
      const hour = new Date().getHours();
      
      // Time-based greeting base
      let timeGreeting = '';
      if (hour < 12) timeGreeting = 'Good morning';
      else if (hour < 17) timeGreeting = 'Good afternoon';
      else timeGreeting = 'Good evening';

      // Get recent sentiment trend
      const recentMessages = await prisma.chatMessage.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 5
      });

      // Check for improvement trend
      const wellnessTrend = context.wellnessInsights?.trend;
      const anxietyScore = context.assessmentInsights?.byType?.anxiety?.latestScore || 0;
      const depressionScore = context.assessmentInsights?.byType?.depression?.latestScore || 0;

      // Personalized greeting based on context
      if (wellnessTrend === 'improving') {
        return `${timeGreeting}, ${userName}! 🌟 I can see you've been making progress. How are you feeling today?`;
      }

      if (anxietyScore > 70) {
        return `${timeGreeting}, ${userName}. I'm here for you. Take a deep breath - let's talk about what's on your mind.`;
      }

      if (depressionScore > 70) {
        return `${timeGreeting}, ${userName}. I know things might feel heavy right now. I'm here to listen and support you.`;
      }

      if (wellnessTrend === 'declining') {
        return `${timeGreeting}, ${userName}. I've noticed things might be challenging lately. Want to talk about it?`;
      }

      // Check recurring themes
      if (memory.recurringThemes?.includes('work') && hour >= 9 && hour <= 17) {
        return `${timeGreeting}, ${userName}! How's your workday going so far?`;
      }

      if (memory.recurringThemes?.includes('sleep') && (hour < 7 || hour > 22)) {
        return `${timeGreeting}, ${userName}! How did you sleep? I'm here if you want to talk about rest.`;
      }

      // Default positive greeting
      const positiveGreetings = [
        `${timeGreeting}, ${userName}! 😊 How are you doing today?`,
        `${timeGreeting}, ${userName}! It's great to see you. What's on your mind?`,
        `${timeGreeting}, ${userName}! I'm here to listen. How can I support you today?`,
        `${timeGreeting}, ${userName}! Ready to chat whenever you are. How are you feeling?`
      ];

      return positiveGreetings[Math.floor(Math.random() * positiveGreetings.length)];
    } catch (error) {
      console.error('Error generating mood-based greeting:', error);
      return 'Hello! How are you feeling today?';
    }
  }

  /**
   * Get contextual exercise recommendations based on current state
   */
  async getContextualExerciseRecommendations(
    userId: string,
    currentMessage?: string
  ): Promise<{
    exercises: Array<{
      id: string;
      name: string;
      type: 'breathing' | 'mindfulness' | 'cbt' | 'grounding' | 'movement';
      duration: string;
      difficulty: 'easy' | 'medium' | 'advanced';
      description: string;
      matchReason: string;
      benefit: string;
    }>;
    priority: 'high' | 'medium' | 'low';
    contextualNote: string;
  }> {
    try {
      const context = await this.getUserContext(userId);
      const exercises: Array<{
        id: string;
        name: string;
        type: 'breathing' | 'mindfulness' | 'cbt' | 'grounding' | 'movement';
        duration: string;
        difficulty: 'easy' | 'medium' | 'advanced';
        description: string;
        matchReason: string;
        benefit: string;
      }> = [];

      // Analyze current message if provided
      let enhancedSentiment: EnhancedSentiment | null = null;
      if (currentMessage) {
        enhancedSentiment = this.analyzeEnhancedSentiment(currentMessage);
      }

      // Get assessment scores
      const anxietyScore = context.assessmentInsights?.byType?.anxiety?.latestScore || 0;
      const depressionScore = context.assessmentInsights?.byType?.depression?.latestScore || 0;
      const stressScore = context.assessmentInsights?.byType?.stress?.latestScore || 0;

      // Determine priority
      let priority: 'high' | 'medium' | 'low' = 'medium';
      if ((enhancedSentiment?.indicators?.crisisRisk ?? 0) > 0.5 || anxietyScore > 70 || depressionScore > 70) {
        priority = 'high';
      } else if (anxietyScore < 40 && depressionScore < 40 && stressScore < 40) {
        priority = 'low';
      }

      // HIGH ANXIETY - Breathing exercises
      if (anxietyScore > 60 || enhancedSentiment?.primary.emotion === 'anxiety') {
        exercises.push({
          id: 'breathing-478',
          name: '4-7-8 Breathing',
          type: 'breathing',
          duration: '5 minutes',
          difficulty: 'easy',
          description: 'Breathe in for 4 counts, hold for 7, exhale for 8. Repeat 4 times.',
          matchReason: 'Your anxiety levels suggest immediate calming techniques',
          benefit: 'Activates parasympathetic nervous system, reduces anxiety within minutes'
        });

        exercises.push({
          id: 'breathing-box',
          name: 'Box Breathing',
          type: 'breathing',
          duration: '5 minutes',
          difficulty: 'easy',
          description: 'Breathe in-4, hold-4, out-4, hold-4. Visualize tracing a box.',
          matchReason: 'Great for racing thoughts and panic',
          benefit: 'Used by Navy SEALs for stress management'
        });
      }

      // HIGH DEPRESSION - Activation exercises
      if (depressionScore > 60 || enhancedSentiment?.primary.emotion === 'sadness') {
        exercises.push({
          id: 'mindfulness-body-scan',
          name: 'Body Scan Meditation',
          type: 'mindfulness',
          duration: '10 minutes',
          difficulty: 'medium',
          description: 'Slowly bring awareness to each part of your body, from toes to head.',
          matchReason: 'Helps reconnect with your body when feeling numb or disconnected',
          benefit: 'Increases body awareness and reduces dissociation'
        });

        exercises.push({
          id: 'movement-gentle-walk',
          name: 'Mindful Walking',
          type: 'movement',
          duration: '10 minutes',
          difficulty: 'easy',
          description: 'Walk slowly, noticing each step, breath, and sensation.',
          matchReason: 'Gentle activation for when energy is low',
          benefit: 'Releases endorphins without overwhelming effort'
        });
      }

      // HIGH STRESS - Grounding techniques
      if (stressScore > 60 || (enhancedSentiment?.tone?.urgency ?? 0) > 0.7) {
        exercises.push({
          id: 'grounding-54321',
          name: '5-4-3-2-1 Grounding',
          type: 'grounding',
          duration: '5 minutes',
          difficulty: 'easy',
          description: 'Name 5 things you see, 4 you hear, 3 you touch, 2 you smell, 1 you taste.',
          matchReason: 'Perfect for overwhelm and stress',
          benefit: 'Brings you back to present moment immediately'
        });
      }

      // ANGER - Release techniques
      if (enhancedSentiment?.primary.emotion === 'anger') {
        exercises.push({
          id: 'breathing-progressive-relax',
          name: 'Progressive Muscle Relaxation',
          type: 'breathing',
          duration: '10 minutes',
          difficulty: 'medium',
          description: 'Tense and release each muscle group, from feet to head.',
          matchReason: 'Releases physical tension from anger',
          benefit: 'Reduces muscle tension and calms the nervous system'
        });
      }

      // RACING THOUGHTS - CBT exercises
      if ((enhancedSentiment?.linguisticFeatures?.questionCount ?? 0) > 3 || anxietyScore > 50) {
        exercises.push({
          id: 'cbt-thought-record',
          name: 'Thought Record',
          type: 'cbt',
          duration: '10 minutes',
          difficulty: 'medium',
          description: 'Write down: Situation → Thought → Emotion → Evidence For/Against → Balanced Thought',
          matchReason: 'Helpful for repetitive worry thoughts',
          benefit: 'Interrupts rumination and provides perspective'
        });
      }

      // LOW MOOD - Compassion practices
      if ((enhancedSentiment?.tone?.hopefulness ?? 1) < 0.3) {
        exercises.push({
          id: 'mindfulness-loving-kindness',
          name: 'Loving-Kindness Meditation',
          type: 'mindfulness',
          duration: '5 minutes',
          difficulty: 'easy',
          description: 'Repeat: "May I be safe, may I be happy, may I be healthy, may I be at ease"',
          matchReason: 'Builds self-compassion when you\'re being hard on yourself',
          benefit: 'Increases self-compassion and reduces self-criticism'
        });
      }

      // Default recommendations if nothing matches
      if (exercises.length === 0) {
        exercises.push({
          id: 'breathing-deep',
          name: 'Deep Breathing',
          type: 'breathing',
          duration: '3 minutes',
          difficulty: 'easy',
          description: 'Breathe deeply into your belly for 4 counts, exhale for 6.',
          matchReason: 'A gentle practice for any time',
          benefit: 'Quick stress relief and centering'
        });
      }

      // Generate contextual note
      let contextualNote = '';
      if (priority === 'high') {
        contextualNote = 'I sense you might be struggling right now. These exercises can provide immediate relief. Would you like to try one together?';
      } else if (priority === 'medium') {
        contextualNote = 'Based on how you\'re feeling, these exercises might be helpful. Pick one that resonates with you.';
      } else {
        contextualNote = 'Here are some practices to maintain your wellness. Consider making one part of your daily routine.';
      }

      // Limit to top 4 exercises
      return {
        exercises: exercises.slice(0, 4),
        priority,
        contextualNote
      };
    } catch (error) {
      console.error('Error generating exercise recommendations:', error);
      // Fallback recommendations
      return {
        exercises: [
          {
            id: 'breathing-basic',
            name: 'Deep Breathing',
            type: 'breathing',
            duration: '5 minutes',
            difficulty: 'easy',
            description: 'Take slow, deep breaths',
            matchReason: 'Universal calming technique',
            benefit: 'Reduces stress and anxiety'
          }
        ],
        priority: 'low',
        contextualNote: 'Take a moment to breathe and center yourself.'
      };
    }
  }
}

export const chatService = new ChatService();