import { PrismaClient } from '@prisma/client';
import { llmService } from './llmProvider';
import { UserContext, AIMessage } from '../types/ai';
import { AIContextService } from './aiContextService';
import { EnhancedAuditService } from './auditServiceEnhanced';
import { MentalHealthStateService } from './mentalHealthStateService';
import { approachRouter } from './langchainRouter';
import { mentalHealthAgent, MentalHealthAgentConfig } from './langchainAgent';
import { EnhancedRecommendationEngine } from './enhancedRecommendationEngine';
import { ContentRetrieverService } from './contentRetrieverService';
import { MonitoringEscalationService } from './monitoringEscalationService';

const prisma = new PrismaClient();

export class ChatService {
  
  async generateAIResponse(
    userId: string, 
    userMessage: string, 
    sessionId?: string
  ): Promise<{
    response: string;
    provider?: string;
    model?: string;
    usage?: any;
    botMessage?: any;
    context?: string;
    mentalHealthState?: string;
    contentSuggestions?: string[];
    contentResources?: Array<{
      id: string;
      title: string;
      type: string;
      category: string;
      approach: string;
      severityLevel?: string | null;
      url?: string | null;
      thumbnailUrl?: string | null;
    }>;
    shouldSuggestProfessional?: boolean;
  }> {
    try {
      // Log user interaction
      await EnhancedAuditService.logUserActivity({
        userId,
        action: 'chat_message_sent',
        details: { messageLength: userMessage.length, sessionId },
        ipAddress: undefined, // Will be set by controller
        userAgent: undefined
      });

      // Check for crisis language first
      if (this.detectCrisisLanguage(userMessage)) {
        console.log(`[ChatService] Crisis language detected for user ${userId}`);
        
        // Save user message with crisis flag
        const userMsg = await this.saveUniqueChatMessage(userId, userMessage, 'user', { crisis: true, sessionId });
        
        // Save crisis response
        const crisisResponse = this.getCrisisResponse();
        const botMessage = await this.saveUniqueChatMessage(userId, crisisResponse, 'system', { crisis: true, sessionId });

        // Update AI context with crisis information
        await AIContextService.updateContextFromActivity(userId, 'crisis_detected', {
          userMessage,
          response: crisisResponse
        });

        return {
          response: crisisResponse,
          provider: 'crisis-system',
          model: 'intervention',
          botMessage,
          context: 'crisis-intervention'
        };
      }

      // Build comprehensive AI context
      const aiContext = await AIContextService.buildChatContext(userId, sessionId);
      const optimizedContext = AIContextService.optimizeContextForTokens(aiContext);

      // Get user context for personalization (legacy support)
      const userContext = await this.getUserContext(userId);
      
      // Wellbeing overall report intent (must precede assessment listing logic)
      if (this.detectWellbeingReportIntent(userMessage)) {
        console.log(`[ChatService] Wellbeing report intent detected`);
        await this.saveUniqueChatMessage(userId, userMessage, 'user', { sessionId });
        const wellbeingReport = await this.generateWellbeingReport(userId);
        const botMessage = await this.saveUniqueChatMessage(userId, wellbeingReport.response, 'bot', { provider: wellbeingReport.provider, context: 'wellbeing-report' });
        return {
          response: wellbeingReport.response,
          provider: wellbeingReport.provider,
          model: 'wellbeing-report',
          botMessage,
          context: 'wellbeing-report'
        };
      }

      // Check for assessment-related queries
      const assessmentQuery = this.detectAssessmentQuery(userMessage);
      if (assessmentQuery.isAssessmentQuery) {
        console.log(`[ChatService] Assessment query detected: ${assessmentQuery.type}`);
        
        // Save user message
        await this.saveUniqueChatMessage(userId, userMessage, 'user');
        
        // Generate assessment-specific response
        const assessmentResponse = await this.generateAssessmentResponse(userId, userMessage, userContext, assessmentQuery);
        const botMessage = await this.saveUniqueChatMessage(userId, assessmentResponse.response, 'bot', {
          provider: assessmentResponse.provider,
          context: 'assessment-analysis'
        });

        return {
          response: assessmentResponse.response,
          provider: assessmentResponse.provider,
          model: 'assessment-analysis',
          botMessage,
          context: 'assessment-analysis'
        };
      }

      // Check if user needs more assessments (less than 30% completion)
      const assessmentGuidance = this.checkAssessmentCompletionGuidance(userContext, userMessage);
      if (assessmentGuidance.shouldSuggest) {
        console.log(`[ChatService] Assessment completion guidance triggered`);
        
        // Save user message
        await this.saveUniqueChatMessage(userId, userMessage, 'user');
        
        const botMessage = await this.saveUniqueChatMessage(userId, assessmentGuidance.response, 'bot', {
          provider: 'assessment-guidance',
          context: 'assessment-suggestion'
        });

        return {
          response: assessmentGuidance.response,
          provider: 'assessment-guidance',
          model: 'guidance-system',
          botMessage,
          context: 'assessment-suggestion'
        };
      }
      
      // Get recent chat history for context
      const chatHistory = await this.getChatHistory(userId, 10);
      
      // Convert chat history to AI message format (reverse to chronological order)
      const historyMessages: AIMessage[] = chatHistory
        .reverse()
        .map(msg => ({
          role: msg.type === 'user' ? 'user' : 'assistant',
          content: msg.content
        }));

      // Build enhanced conversation context
      const conversationContext = {
        user: userContext,
        messages: [...historyMessages, { role: 'user' as const, content: userMessage }],
        sessionId: sessionId || `session_${userId}_${Date.now()}`,
        timestamp: new Date(),
        // Enhanced context from AI Context Service
        enhancedContext: optimizedContext.context,
        contextMetadata: {
          estimatedTokens: optimizedContext.estimatedTokens,
          compressionRatio: optimizedContext.compressionRatio,
          primaryConcerns: aiContext.currentConcerns,
          conversationGoals: aiContext.conversationGoals
        }
      };

      console.log(`[ChatService] Generating AI response for user ${userId} with ${userContext.approach || 'general'} approach`);

      // Get current mental health state
      const mentalHealthState = await MentalHealthStateService.getUserState(userId);
      console.log(`[ChatService] User mental health state: ${mentalHealthState.state} (${mentalHealthState.score}/100)`);

      // Use approach router for personalized, state-aware responses
      const approachResponse = await approachRouter.routeResponse(
        userMessage,
        userContext,
        mentalHealthState
      );

      // Retrieve concrete content resources from library matching approach + severity + top concerns
      const retrievedResources = await ContentRetrieverService.fromMentalHealthContext({
        approach: (userContext.approach as any) || 'hybrid',
        topConcerns: mentalHealthState.topConcerns,
        severityScore: mentalHealthState.score,
        limit: 3
      });

      const contentResources = retrievedResources.map((r: any) => ({
        id: r.id,
        title: r.title,
        type: r.type,
        category: r.category,
        approach: r.approach,
        severityLevel: r.severityLevel || null,
        url: r.externalUrl || r.fileUrl || null,
        thumbnailUrl: r.thumbnailUrl || null
      }));

      console.log(`[ChatService] Generated ${approachResponse.approach} approach response via ${approachResponse.provider}`);

      // Save user message
      await this.saveUniqueChatMessage(userId, userMessage, 'user', {
        sessionId,
        mentalHealthState: mentalHealthState.state,
        stateScore: mentalHealthState.score
      });

      // Optionally append a friendly suggestion line if we have a concrete resource
      let finalResponse = approachResponse.message;
      if (contentResources.length > 0) {
        const top = contentResources[0];
        const kind = top.type === 'article' ? 'article' : top.type === 'audio' ? 'audio' : top.type === 'video' ? 'video' : 'resource';
        finalResponse += `\n\nSuggestion: ${top.title} (${top.category} ${kind}${top.approach ? ` • ${top.approach}` : ''})${top.url ? ` — ${top.url}` : ''}`;
      }

      // If professional support is suggested, add crisis resources
      if (approachResponse.shouldSuggestProfessional) {
        finalResponse += "\n\n" + this.getProfessionalSupportMessage();
      }

      // Save bot response with enhanced metadata
      const botMessage = await this.saveUniqueChatMessage(userId, finalResponse, 'bot', {
        provider: approachResponse.provider,
        approach: approachResponse.approach,
        mentalHealthState: mentalHealthState.state,
        stateScore: mentalHealthState.score,
        contentSuggestions: approachResponse.contentSuggestions,
        contentResources,
        shouldSuggestProfessional: approachResponse.shouldSuggestProfessional,
        sessionId
      });

      // Update AI context with state and approach information
      await AIContextService.updateContextFromActivity(userId, 'ai_response_generated', {
        approach: approachResponse.approach,
        mentalHealthState: mentalHealthState.state,
        stateScore: mentalHealthState.score,
        contentSuggestions: approachResponse.contentSuggestions,
        professionalSupportSuggested: approachResponse.shouldSuggestProfessional
      });

      console.log(`[ChatService] ✅ Enhanced AI response generated using ${approachResponse.approach} approach`);

      return {
        response: finalResponse,
        provider: approachResponse.provider,
        model: `${approachResponse.approach}-approach`,
        botMessage,
        context: `ai-${approachResponse.approach}`,
        mentalHealthState: mentalHealthState.state,
        contentSuggestions: approachResponse.contentSuggestions,
  contentResources,
        shouldSuggestProfessional: approachResponse.shouldSuggestProfessional
      };

    } catch (error: any) {
      console.error('[ChatService] Error generating AI response:', error);
      
      // Save user message even on error
  await this.saveUniqueChatMessage(userId, userMessage, 'user');
      
      // Get fallback response
      const fallbackResponse = this.getFallbackResponse(userMessage);
      const botMessage = await this.saveUniqueChatMessage(userId, fallbackResponse, 'bot', {
        provider: 'fallback',
        error: error.message
      });
      
      // Return fallback response on error
      return {
        response: fallbackResponse,
        provider: 'fallback',
        model: 'system',
        botMessage,
        context: 'fallback'
      };
    }
  }

  /**
   * Save message but avoid duplicates within a short debounce window (2s) to prevent double responses
   */
  private async saveUniqueChatMessage(
    userId: string,
    content: string,
    type: 'user' | 'bot' | 'system',
    metadata?: any
  ): Promise<any> {
    const last = await prisma.chatMessage.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
    if (last && last.type === type && last.content === content) {
      const delta = Date.now() - last.createdAt.getTime();
      if (delta < 2000) {
        return last; // treat as duplicate within debounce window
      }
    }
    return this.saveChatMessage(userId, content, type, metadata);
  }

  private async getUserContext(userId: string): Promise<UserContext> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        assessments: {
          orderBy: { completedAt: 'desc' },
          take: 5
        },
        moodEntries: {
          orderBy: { createdAt: 'desc' },
          take: 5 // Get more mood history for better context
        }
      }
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Parse assessment responses for detailed context
    const detailedAssessments = user.assessments.map(assessment => {
      let responses = null;
      try {
        responses = JSON.parse(assessment.responses);
      } catch (e) {
        // If parsing fails, responses will be null
      }
      
      return {
        assessmentType: assessment.assessmentType,
        score: assessment.score,
        completedAt: assessment.completedAt,
        responses: responses,
        interpretation: this.interpretAssessmentScore(assessment.assessmentType, assessment.score),
        specificConcerns: this.extractSpecificConcerns(assessment.assessmentType, responses)
      };
    });

    // Get mood trends
    const moodTrend = this.analyzeMoodTrend(user.moodEntries);

    // Calculate age and age group
    const { age, ageGroup } = this.calculateAgeInfo(user.birthday || undefined);

    return {
      id: user.id,
      name: user.name,
      firstName: user.firstName || undefined,
      lastName: user.lastName || undefined,
      age: age,
      ageGroup: ageGroup,
      approach: user.approach as 'western' | 'eastern' | 'hybrid' | undefined,
      recentAssessments: detailedAssessments,
      currentMood: user.moodEntries[0]?.mood,
      moodTrend: moodTrend,
      hasCompletedAssessments: user.assessments.length > 0,
      preferences: {
        emergencyContact: user.emergencyContact,
        dataConsent: user.dataConsent,
        clinicianSharing: user.clinicianSharing
      }
    };
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
        if (score <= 25) return 'low stress';
        if (score <= 50) return 'moderate stress';
        if (score <= 75) return 'high stress';
        return 'very high stress';
      
      case 'emotionalintelligence':
        if (score >= 75) return 'high emotional intelligence';
        if (score >= 50) return 'moderate emotional intelligence';
        if (score >= 25) return 'developing emotional intelligence';
        return 'needs emotional intelligence support';
      
      case 'overthinking':
        if (score <= 25) return 'minimal overthinking';
        if (score <= 50) return 'mild overthinking patterns';
        if (score <= 75) return 'significant overthinking';
        return 'severe rumination patterns';
      
      case 'personality':
        if (score >= 80) return 'well-balanced personality traits';
        if (score >= 60) return 'healthy personality patterns';
        if (score >= 40) return 'moderate personality insights';
        return 'complex personality patterns';
      
      case 'trauma-fear':
        if (score <= 20) return 'minimal trauma responses';
        if (score <= 40) return 'mild trauma indicators';
        if (score <= 60) return 'moderate trauma patterns';
        if (score <= 80) return 'significant trauma responses';
        return 'severe trauma indicators requiring support';
      
      case 'archetypes':
        if (score >= 75) return 'clear archetypal patterns';
        if (score >= 50) return 'emerging archetypal traits';
        return 'diverse archetypal expressions';
      
      default:
        return score > 50 ? 'elevated concerns' : 'manageable levels';
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
        if (responses['workload'] && parseInt(responses['workload']) > 2) concerns.push('work-related stress');
        if (responses['relationships'] && parseInt(responses['relationships']) > 2) concerns.push('relationship stress');
      }
      
      // Overthinking pattern concerns
      if (assessmentType.toLowerCase().includes('overthinking')) {
        if (responses['rumination'] && parseInt(responses['rumination']) > 2) concerns.push('repetitive thinking');
        if (responses['whatif'] && parseInt(responses['whatif']) > 2) concerns.push('catastrophic thinking');
        if (responses['pastevents'] && parseInt(responses['pastevents']) > 2) concerns.push('dwelling on past');
        if (responses['selfcriticism'] && parseInt(responses['selfcriticism']) > 2) concerns.push('self-critical thoughts');
        if (responses['sleepthinking'] && parseInt(responses['sleepthinking']) > 2) concerns.push('racing thoughts at bedtime');
      }
      
      // Personality assessment insights
      if (assessmentType.toLowerCase().includes('personality')) {
        if (responses['introversion'] && parseInt(responses['introversion']) > 3) concerns.push('social energy management');
        if (responses['neuroticism'] && parseInt(responses['neuroticism']) > 3) concerns.push('emotional sensitivity');
        if (responses['openness'] && parseInt(responses['openness']) < 2) concerns.push('resistance to change');
        if (responses['conscientiousness'] && parseInt(responses['conscientiousness']) < 2) concerns.push('organization challenges');
        if (responses['agreeableness'] && parseInt(responses['agreeableness']) < 2) concerns.push('interpersonal difficulties');
      }
      
      // Trauma and fear response concerns
      if (assessmentType.toLowerCase().includes('trauma') || assessmentType.toLowerCase().includes('fear')) {
        if (responses['hypervigilance'] && parseInt(responses['hypervigilance']) > 2) concerns.push('heightened alertness');
        if (responses['avoidance'] && parseInt(responses['avoidance']) > 2) concerns.push('avoidance behaviors');
        if (responses['flashbacks'] && parseInt(responses['flashbacks']) > 2) concerns.push('intrusive memories');
        if (responses['dissociation'] && parseInt(responses['dissociation']) > 2) concerns.push('disconnection experiences');
        if (responses['startle'] && parseInt(responses['startle']) > 2) concerns.push('exaggerated startle response');
        if (responses['nightmares'] && parseInt(responses['nightmares']) > 2) concerns.push('trauma-related dreams');
      }
      
      // Emotional intelligence areas
      if (assessmentType.toLowerCase().includes('emotional') || assessmentType.toLowerCase().includes('intelligence')) {
        if (responses['selfawareness'] && parseInt(responses['selfawareness']) < 2) concerns.push('emotional self-awareness needs');
        if (responses['empathy'] && parseInt(responses['empathy']) < 2) concerns.push('empathy development');
        if (responses['regulation'] && parseInt(responses['regulation']) < 2) concerns.push('emotion regulation skills');
        if (responses['social'] && parseInt(responses['social']) < 2) concerns.push('social emotional skills');
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
    metadata?: any
  ): Promise<any> {
    return await prisma.chatMessage.create({
      data: {
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

  /** Detect explicit intent for an overall wellbeing / mental wellness report */
  private detectWellbeingReportIntent(message: string): boolean {
    const lower = message.toLowerCase();
    const patterns = [
      'overall mental wellness report',
      'overall mental wellbeing report',
      'overall wellbeing report',
      'overall wellness report',
      'overall report',
      'wellbeing report',
      'wellness report',
      'comprehensive mental health report',
      'summarize my assessments',
      'summary of my assessments',
      'overall assessment summary',
      'overall mental health summary',
      'my overall mental health',
      'overall mental health report'
    ];
    return patterns.some(p => lower.includes(p));
  }

  /** Generate synthesized wellbeing report (latest + historical deltas) with AI enhancement */
  private async generateWellbeingReport(userId: string): Promise<{ response: string; provider: string }> {
    // Fetch recent assessments (get more to compute previous deltas)
    const assessments = await prisma.assessment.findMany({
      where: { userId },
      orderBy: { completedAt: 'desc' },
      take: 50
    });
    if (!assessments.length) {
      return { response: 'I do not see any completed assessments yet. Once you complete some, I can generate an overall wellbeing report summarizing patterns and improvements over time.', provider: 'wellbeing-report' };
    }

    // Group by assessmentType
    const groups: Record<string, typeof assessments> = {} as any;
    for (const a of assessments) {
      (groups[a.assessmentType] = groups[a.assessmentType] || []).push(a);
    }
    const positiveHigher = new Set(['emotionalintelligence', 'emotional-intelligence', 'emotional_intelligence']);

    interface MetricSummary { type: string; latest: number; previous?: number; change?: number; direction: 'up'|'down'|'flat'; beneficialChange?: boolean; risk: 'low'|'moderate'|'high'; latestDate: Date; }
    const summaries: MetricSummary[] = [];
    for (const [type, arr] of Object.entries(groups)) {
      const sorted = arr.sort((a,b)=> b.completedAt.getTime()-a.completedAt.getTime());
      const latest = sorted[0];
      const previous = sorted[1];
      const change = previous ? latest.score - previous.score : undefined;
      let direction: 'up'|'down'|'flat' = 'flat';
      if (change !== undefined) direction = change > 0 ? 'up' : change < 0 ? 'down' : 'flat';
      const risk = latest.score >= 70 ? 'high' : latest.score >= 40 ? 'moderate' : 'low';
      const higherIsBetter = positiveHigher.has(type.toLowerCase());
      const beneficialChange = change === undefined ? undefined : higherIsBetter ? change > 0 : change < 0;
      summaries.push({ type, latest: latest.score, previous: previous?.score, change, direction, beneficialChange, risk, latestDate: latest.completedAt });
    }

    const improved = summaries.filter(s => s.beneficialChange);
    const declined = summaries.filter(s => s.beneficialChange === false);
    const stable = summaries.filter(s => s.change === 0 || s.change === undefined);

    const earliest = assessments[assessments.length-1].completedAt;
    const latestDate = assessments[0].completedAt;
    const spanDays = Math.max(1, Math.round((latestDate.getTime()-earliest.getTime())/(1000*60*60*24)));

    // Deterministic narrative baseline
    const line = (s: MetricSummary) => `${s.type}: ${s.latest}${s.previous!==undefined?` (${s.change!>=0?'+':''}${s.change})`:''}${s.risk==='high'?' high concern':s.risk==='moderate'?' moderate level':''}`;
    let narrative = `Overall Wellbeing Report (${spanDays} day span)\n\n`;
    narrative += `You have completed ${summaries.length} assessment categories recently.\n\n`;
    if (improved.length) narrative += `Improvements: ${improved.map(line).join('; ')}.\n`;
    if (declined.length) narrative += `Areas needing attention: ${declined.map(line).join('; ')}.\n`;
    if (stable.length) narrative += `Stable areas: ${stable.map(s=>s.type).join(', ')}.\n`;
    const highRisks = summaries.filter(s=> s.risk==='high');
    if (highRisks.length) narrative += `High priority focus: ${highRisks.map(s=>s.type).join(', ')}.\n`;
    narrative += `\nNext Step: Focus on one improvement habit at a time; I can suggest targeted practices if you ask.\n`;

    // Attempt AI enhancement
    try {
      const structured = JSON.stringify(summaries.map(s=>({type:s.type,latest:s.latest,previous:s.previous,change:s.change,risk:s.risk,beneficialChange:s.beneficialChange})));
      const systemMsg = `You are a supportive mental wellbeing assistant. Craft concise encouraging overall wellbeing reports.`;
      const userMsg = `Given these assessment metrics and a baseline summary, write a concise (<=160 words) narrative (no bullet list, no JSON, no prefacing) emphasizing progress, balanced tone, actionable encouragement, and mention scores are self-reported.\nMetrics JSON: ${structured}\nBaseline Summary: ${narrative}\nReturn ONLY the narrative.`;
      const aiResp = await llmService.generateResponse([
        { role: 'system', content: systemMsg },
        { role: 'user', content: userMsg }
      ], { temperature: 0.4, maxTokens: 400 });
      if (aiResp?.content && aiResp.content.trim().length > 50) {
        narrative = aiResp.content.trim();
        return { response: narrative, provider: aiResp.provider || 'wellbeing-report-ai' };
      }
    } catch (e) {
      console.warn('[ChatService] AI wellbeing report generation failed, using fallback:', (e as any).message);
    }
    return { response: narrative, provider: 'wellbeing-report' };
  }

  getCrisisResponse(): string {
    return `I'm very concerned about your safety and wellbeing. If you're having thoughts of hurting yourself, please reach out for immediate help:

🆘 **Crisis Resources:**
• **National Suicide Prevention Lifeline**: 988 or 1-800-273-8255
• **Crisis Text Line**: Text HOME to 741741
• **Emergency Services**: 911

You are not alone, and there are people who want to help you. Please consider reaching out to a trusted friend, family member, or mental health professional.

Would you like me to help you find local mental health resources?`;
  }

  getProfessionalSupportMessage(): string {
    return `💡 **Professional Support Suggestion:**
Based on what you've shared, it might be helpful to speak with a mental health professional who can provide personalized guidance for your situation.

**Options to consider:**
• **Therapist or Counselor**: For ongoing support and coping strategies
• **Primary Care Doctor**: Can discuss treatment options and referrals
• **Mental Health Hotline**: For immediate support and local resources
• **Employee Assistance Program**: If available through work or school

Remember, seeking professional help is a sign of strength and self-care. You deserve support.`;
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
   * Detect if user is asking about their assessment results or mental health analysis
   */
  private detectAssessmentQuery(message: string): { isAssessmentQuery: boolean; type: string; keywords: string[] } {
    const lowerMessage = message.toLowerCase();
    
    // Assessment-related keywords
    const assessmentKeywords = [
      'my assessment', 'my results', 'assessment results', 'my scores', 'my test',
      'mental health analysis', 'what do my results mean', 'according to my assessment',
      'based on my assessment', 'my mental health', 'how am i doing', 'my wellbeing',
      'my anxiety score', 'my stress level', 'my personality', 'my emotional intelligence'
    ];

    const foundKeywords = assessmentKeywords.filter(keyword => lowerMessage.includes(keyword));
    
    // Determine query type
    let queryType = 'general';
    if (lowerMessage.includes('anxiety')) queryType = 'anxiety';
    else if (lowerMessage.includes('stress')) queryType = 'stress';
    else if (lowerMessage.includes('personality')) queryType = 'personality';
    else if (lowerMessage.includes('emotional')) queryType = 'emotional-intelligence';
    else if (lowerMessage.includes('overthinking')) queryType = 'overthinking';
    else if (lowerMessage.includes('trauma') || lowerMessage.includes('fear')) queryType = 'trauma-fear';

    return {
      isAssessmentQuery: foundKeywords.length > 0,
      type: queryType,
      keywords: foundKeywords
    };
  }

  /**
   * Generate response based on user's assessment results and insights
   */
  private async generateAssessmentResponse(
    userId: string, 
    userMessage: string, 
    userContext: UserContext, 
    assessmentQuery: { type: string; keywords: string[] }
  ): Promise<{ response: string; provider: string }> {
    
    // Check if user has completed assessments
    if (!userContext.hasCompletedAssessments || !userContext.recentAssessments || userContext.recentAssessments.length === 0) {
      return {
        response: "I'd love to help you understand your mental health better! However, I don't see any completed assessments in your profile yet. To provide you with personalized insights about your wellbeing, I'd recommend completing some assessments first. Would you like me to suggest which assessments might be most helpful for you?",
        provider: 'assessment-guidance'
      };
    }

    // Get assessment insights from database
    const assessments = await prisma.assessment.findMany({
      where: { userId },
      orderBy: { completedAt: 'desc' },
      take: 5
    });

    // Build comprehensive assessment summary
    let assessmentSummary = `Based on your recent assessments, here's what I can share about your mental health:\n\n`;
    
    assessments.forEach(assessment => {
      const interpretation = this.interpretAssessmentScore(assessment.assessmentType, assessment.score);
      assessmentSummary += `**${assessment.assessmentType.charAt(0).toUpperCase() + assessment.assessmentType.slice(1)} Assessment:**\n`;
      assessmentSummary += `- Score: ${assessment.score}/100 (${interpretation})\n`;
      
      if (assessment.aiInsights) {
        assessmentSummary += `- AI Insights: ${assessment.aiInsights}\n`;
      }
      
      assessmentSummary += `- Completed: ${new Date(assessment.completedAt).toLocaleDateString()}\n\n`;
    });

    // Add overall analysis
    const avgScore = assessments.reduce((sum, a) => sum + a.score, 0) / assessments.length;
    const overallLevel = avgScore >= 70 ? 'need attention' : avgScore >= 40 ? 'moderate' : 'good';
    
    assessmentSummary += `**Overall Analysis:**\n`;
    assessmentSummary += `Your average wellbeing score is ${Math.round(avgScore)}/100, indicating ${overallLevel} levels. `;
    
    if (overallLevel === 'need attention') {
      assessmentSummary += `Some areas might benefit from focused attention and support. `;
    } else if (overallLevel === 'moderate') {
      assessmentSummary += `You're managing reasonably well with some areas for growth. `;
    } else {
      assessmentSummary += `You're doing well overall! `;
    }

    assessmentSummary += `\n\nWould you like to discuss any specific aspect of these results or explore coping strategies for any particular area?`;

    return {
      response: assessmentSummary,
      provider: 'assessment-analysis'
    };
  }

  /**
   * Check if user has completed less than 30% of assessments and suggest completing more
   */
  private checkAssessmentCompletionGuidance(userContext: UserContext, userMessage: string): { shouldSuggest: boolean; response: string } {
    
    // Total available assessments (from the catalog)
    const totalAssessments = 6; // anxiety, stress, emotional intelligence, overthinking, personality, trauma-fear
    const completedAssessments = userContext.recentAssessments?.length || 0;
    const completionPercentage = (completedAssessments / totalAssessments) * 100;

    // Only suggest if user has completed less than 30% (less than 2 assessments)
    // And if they're asking about mental health or wellbeing in general
    const isGeneralWellbeingQuery = this.isGeneralWellbeingQuery(userMessage);
    
    if (completionPercentage < 30 && isGeneralWellbeingQuery) {
      const remaining = totalAssessments - completedAssessments;
      
      return {
        shouldSuggest: true,
        response: `I'd love to give you a comprehensive analysis of your mental health! Currently, you've completed ${completedAssessments} out of ${totalAssessments} assessments (${Math.round(completionPercentage)}%). 

To provide you with more accurate and personalized insights about your wellbeing, I'd recommend completing a few more assessments. This will help me understand your mental health patterns better and give you more targeted recommendations.

Here are some assessments you might find helpful:
${completedAssessments === 0 ? '• Anxiety Assessment - Understanding worry and nervousness patterns\n• Stress Level Assessment - Evaluating current stress and pressure levels\n• Emotional Intelligence Assessment - Measuring emotional awareness and regulation' : 
  completedAssessments === 1 ? '• Stress Level Assessment - How you handle daily pressures\n• Emotional Intelligence Assessment - Your emotional awareness skills\n• Overthinking Patterns Assessment - Understanding repetitive thought cycles' :
  '• Personality Type Assessment - Understanding your core traits\n• Overthinking Patterns Assessment - Identifying thought loops\n• Trauma & Fear Response Assessment - Gentle exploration of trauma responses (optional)'}

Would you like to complete some assessments now so I can give you a more complete picture of your mental health?`
      };
    }

    return { shouldSuggest: false, response: '' };
  }

  /**
   * Check if user message is asking about general wellbeing/mental health
   */
  private isGeneralWellbeingQuery(message: string): boolean {
    const lowerMessage = message.toLowerCase();
    const wellbeingKeywords = [
      'how am i doing', 'my mental health', 'my wellbeing', 'how is my health',
      'analyze me', 'tell me about myself', 'what do you think about me',
      'my psychological state', 'my emotional state', 'how am i feeling',
      'what can you tell me', 'analyze my mood', 'my mental state'
    ];

    return wellbeingKeywords.some(keyword => lowerMessage.includes(keyword));
  }
}

export const chatService = new ChatService();