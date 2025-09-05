import { PrismaClient } from '@prisma/client';
import { llmService } from './llmProvider';
import { UserContext, AIMessage } from '../types/ai';

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
  }> {
    try {
      // Check for crisis language first
      if (this.detectCrisisLanguage(userMessage)) {
        console.log(`[ChatService] Crisis language detected for user ${userId}`);
        
        // Save user message with crisis flag
        const userMsg = await this.saveChatMessage(userId, userMessage, 'user', { crisis: true });
        
        // Save crisis response
        const crisisResponse = this.getCrisisResponse();
        const botMessage = await this.saveChatMessage(userId, crisisResponse, 'system', { crisis: true });

        return {
          response: crisisResponse,
          provider: 'crisis-system',
          model: 'intervention',
          botMessage,
          context: 'crisis-intervention'
        };
      }

      // Get user context for personalization
      const userContext = await this.getUserContext(userId);
      
      // Get recent chat history for context
      const chatHistory = await this.getChatHistory(userId, 10);
      
      // Convert chat history to AI message format (reverse to chronological order)
      const historyMessages: AIMessage[] = chatHistory
        .reverse()
        .map(msg => ({
          role: msg.type === 'user' ? 'user' : 'assistant',
          content: msg.content
        }));

      // Build conversation context
      const conversationContext = {
        user: userContext,
        messages: [...historyMessages, { role: 'user' as const, content: userMessage }],
        sessionId: sessionId || `session_${userId}_${Date.now()}`,
        timestamp: new Date()
      };

      console.log(`[ChatService] Generating AI response for user ${userId} with ${userContext.approach || 'general'} approach`);

      // Generate AI response using the corrected method name
      const aiResponse = await llmService.generateResponse(
        [{ role: 'user', content: userMessage }],
        {
          maxTokens: 150,
          temperature: 0.7
        },
        conversationContext
      );

      // Save user message
      await this.saveChatMessage(userId, userMessage, 'user');

      // Save bot response
      const botMessage = await this.saveChatMessage(userId, aiResponse.content, 'bot', {
        provider: aiResponse.provider,
        model: aiResponse.model,
        processingTime: aiResponse.processingTime,
        tokensUsed: aiResponse.usage?.total_tokens
      });

      console.log(`[ChatService] ✅ AI response generated using ${aiResponse.provider} in ${aiResponse.processingTime}ms`);

      return {
        response: aiResponse.content,
        provider: aiResponse.provider,
        model: aiResponse.model,
        usage: aiResponse.usage,
        botMessage,
        context: `ai-${aiResponse.provider?.toLowerCase()}`
      };

    } catch (error: any) {
      console.error('[ChatService] Error generating AI response:', error);
      
      // Save user message even on error
      await this.saveChatMessage(userId, userMessage, 'user');
      
      // Get fallback response
      const fallbackResponse = this.getFallbackResponse(userMessage);
      const botMessage = await this.saveChatMessage(userId, fallbackResponse, 'bot', {
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

  getCrisisResponse(): string {
    return `I'm very concerned about your safety and wellbeing. If you're having thoughts of hurting yourself, please reach out for immediate help:

🆘 **Crisis Resources:**
• **National Suicide Prevention Lifeline**: 988 or 1-800-273-8255
• **Crisis Text Line**: Text HOME to 741741
• **Emergency Services**: 911

You are not alone, and there are people who want to help you. Please consider reaching out to a trusted friend, family member, or mental health professional.

Would you like me to help you find local mental health resources?`;
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
}

export const chatService = new ChatService();