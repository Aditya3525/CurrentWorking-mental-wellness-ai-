import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface AIContextData {
  userId: string;
  sessionId: string;
  contextType: 'conversation' | 'assessment' | 'mood_tracking' | 'crisis_intervention';
  contextData: any;
  priority?: number;
  expiresAt?: Date;
}

export interface ChatContext {
  recentMessages: any[];
  userProfile: any;
  assessmentHistory: any[];
  moodHistory: any[];
  currentConcerns: string[];
  conversationGoals: string[];
}

export class AIContextService {
  private static readonly MAX_CONTEXT_TOKENS = 4000; // Conservative limit for most models
  private static readonly CONTEXT_PRIORITIES = {
    crisis_intervention: 1,
    current_conversation: 2,
    recent_assessments: 3,
    mood_trends: 4,
    historical_data: 5
  };

  /**
   * Store AI context for a user session
   */
  static async storeContext(data: AIContextData): Promise<void> {
    try {
      // For now, use existing ChatMessage table with enhanced metadata
      await prisma.chatMessage.create({
        data: {
          userId: data.userId,
          content: `[CONTEXT_${data.contextType.toUpperCase()}]`,
          type: 'system',
          metadata: JSON.stringify({
            contextType: data.contextType,
            contextData: data.contextData,
            sessionId: data.sessionId,
            priority: data.priority || 3,
            expiresAt: data.expiresAt,
            isContextMarker: true
          })
        }
      });
    } catch (error) {
      console.error('Failed to store AI context:', error);
    }
  }

  /**
   * Build comprehensive context for AI interactions
   */
  static async buildChatContext(userId: string, sessionId?: string): Promise<ChatContext> {
    try {
      // Get user profile
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          assessments: {
            orderBy: { completedAt: 'desc' },
            take: 5
          },
          moodEntries: {
            orderBy: { createdAt: 'desc' },
            take: 10
          }
        }
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Get recent chat messages
      const recentMessages = await prisma.chatMessage.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 20
      });

      // Filter and organize by priority
      const contextMessages = recentMessages
        .filter(msg => msg.type === 'system' && msg.metadata)
        .map(msg => ({
          ...msg,
          metadata: JSON.parse(msg.metadata || '{}')
        }))
        .filter(msg => msg.metadata.isContextMarker);

      // Build context object
      const context: ChatContext = {
        recentMessages: recentMessages
          .filter(msg => msg.type !== 'system')
          .slice(0, 10)
          .map(msg => ({
            content: msg.content,
            type: msg.type,
            timestamp: msg.createdAt
          })),
        
        userProfile: {
          name: user.firstName || user.name,
          age: user.birthday ? this.calculateAge(user.birthday) : null,
          approach: user.approach,
          gender: user.gender,
          region: user.region,
          isOnboarded: user.isOnboarded
        },

        assessmentHistory: user.assessments.map(assessment => ({
          type: assessment.assessmentType,
          score: assessment.score,
          insights: assessment.aiInsights,
          completedAt: assessment.completedAt,
          responses: assessment.responses ? JSON.parse(assessment.responses) : {}
        })),

        moodHistory: user.moodEntries.map(entry => ({
          mood: entry.mood,
          notes: entry.notes,
          date: entry.createdAt
        })),

        currentConcerns: this.extractCurrentConcerns(user.assessments, user.moodEntries),
        conversationGoals: this.generateConversationGoals(user.assessments, user.approach || undefined)
      };

      return context;
    } catch (error) {
      console.error('Failed to build chat context:', error);
      return this.getEmptyContext();
    }
  }

  /**
   * Optimize context to fit within token limits
   */
  static optimizeContextForTokens(context: ChatContext, maxTokens: number = this.MAX_CONTEXT_TOKENS): any {
    // Estimate tokens (rough approximation: 1 token ≈ 4 characters)
    const estimateTokens = (text: string): number => Math.ceil(text.length / 4);

    let currentTokens = 0;
    const optimizedContext: any = {
      userProfile: context.userProfile,
      currentConcerns: context.currentConcerns,
      conversationGoals: context.conversationGoals,
      recentMessages: [],
      assessmentHistory: [],
      moodHistory: []
    };

    // Add core profile data (always include)
    currentTokens += estimateTokens(JSON.stringify(optimizedContext.userProfile));
    currentTokens += estimateTokens(JSON.stringify(optimizedContext.currentConcerns));
    currentTokens += estimateTokens(JSON.stringify(optimizedContext.conversationGoals));

    // Add recent messages (highest priority)
    for (const message of context.recentMessages) {
      const messageTokens = estimateTokens(JSON.stringify(message));
      if (currentTokens + messageTokens <= maxTokens * 0.6) { // Reserve 60% for messages
        optimizedContext.recentMessages.push(message);
        currentTokens += messageTokens;
      } else {
        break;
      }
    }

    // Add assessment history (medium priority)
    for (const assessment of context.assessmentHistory) {
      const assessmentTokens = estimateTokens(JSON.stringify(assessment));
      if (currentTokens + assessmentTokens <= maxTokens * 0.8) { // Use up to 80% total
        optimizedContext.assessmentHistory.push(assessment);
        currentTokens += assessmentTokens;
      } else {
        break;
      }
    }

    // Add mood history (lower priority)
    for (const mood of context.moodHistory) {
      const moodTokens = estimateTokens(JSON.stringify(mood));
      if (currentTokens + moodTokens <= maxTokens * 0.9) { // Use up to 90% total
        optimizedContext.moodHistory.push(mood);
        currentTokens += moodTokens;
      } else {
        break;
      }
    }

    return {
      context: optimizedContext,
      estimatedTokens: currentTokens,
      compressionRatio: currentTokens / this.estimateTokens(JSON.stringify(context))
    };
  }

  /**
   * Extract current concerns from user data
   */
  private static extractCurrentConcerns(assessments: any[], moodEntries: any[]): string[] {
    const concerns = new Set<string>();

    // From recent assessments
    assessments.slice(0, 3).forEach(assessment => {
      if (assessment.score > 60) { // High score indicates concern
        concerns.add(assessment.assessmentType);
      }
    });

    // From recent mood entries
    const recentNegativeMoods = moodEntries
      .slice(0, 5)
      .filter(entry => ['Struggling', 'Anxious'].includes(entry.mood));
    
    if (recentNegativeMoods.length > 2) {
      concerns.add('mood_instability');
    }

    return Array.from(concerns);
  }

  /**
   * Generate conversation goals based on user profile
   */
  private static generateConversationGoals(assessments: any[], approach?: string): string[] {
    const goals = [];

    // Based on approach
    if (approach === 'western') {
      goals.push('provide_evidence_based_strategies');
      goals.push('focus_on_cognitive_behavioral_techniques');
    } else if (approach === 'eastern') {
      goals.push('emphasize_mindfulness_practices');
      goals.push('incorporate_holistic_wellness');
    } else {
      goals.push('blend_western_and_eastern_approaches');
    }

    // Based on recent assessments
    const latestAssessment = assessments[0];
    if (latestAssessment) {
      if (latestAssessment.assessmentType === 'anxiety') {
        goals.push('address_anxiety_management');
      } else if (latestAssessment.assessmentType === 'stress') {
        goals.push('focus_on_stress_reduction');
      }
    }

    goals.push('build_therapeutic_rapport');
    goals.push('encourage_self_reflection');

    return goals;
  }

  /**
   * Calculate age from birthday
   */
  private static calculateAge(birthday: Date): number {
    const today = new Date();
    const birthDate = new Date(birthday);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }

  /**
   * Estimate tokens in text
   */
  private static estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  /**
   * Get empty context fallback
   */
  private static getEmptyContext(): ChatContext {
    return {
      recentMessages: [],
      userProfile: {},
      assessmentHistory: [],
      moodHistory: [],
      currentConcerns: [],
      conversationGoals: ['build_therapeutic_rapport']
    };
  }

  /**
   * Clean up expired context data
   */
  static async cleanupExpiredContext(): Promise<void> {
    try {
      // Clean up old context markers (older than 7 days)
      await prisma.chatMessage.deleteMany({
        where: {
          type: 'system',
          content: {
            startsWith: '[CONTEXT_'
          },
          createdAt: {
            lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        }
      });
    } catch (error) {
      console.error('Failed to cleanup expired context:', error);
    }
  }

  /**
   * Update context based on new user activity
   */
  static async updateContextFromActivity(userId: string, activity: string, data: any): Promise<void> {
    try {
      const contextData: AIContextData = {
        userId,
        sessionId: `session_${Date.now()}`,
        contextType: this.getContextTypeFromActivity(activity),
        contextData: {
          activity,
          data,
          timestamp: new Date()
        },
        priority: this.getPriorityFromActivity(activity)
      };

      await this.storeContext(contextData);
    } catch (error) {
      console.error('Failed to update context from activity:', error);
    }
  }

  /**
   * Map activity to context type
   */
  private static getContextTypeFromActivity(activity: string): 'conversation' | 'assessment' | 'mood_tracking' | 'crisis_intervention' {
    if (activity.includes('assessment')) return 'assessment';
    if (activity.includes('mood')) return 'mood_tracking';
    if (activity.includes('crisis') || activity.includes('emergency')) return 'crisis_intervention';
    return 'conversation';
  }

  /**
   * Get priority based on activity type
   */
  private static getPriorityFromActivity(activity: string): number {
    if (activity.includes('crisis') || activity.includes('emergency')) return 1;
    if (activity.includes('assessment_completed')) return 2;
    if (activity.includes('mood_logged')) return 3;
    return 4;
  }
}
