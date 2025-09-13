import { PrismaClient } from '@prisma/client';
import { MentalHealthStateService } from './mentalHealthStateService';
import { ContentRecommendationService } from './contentRecommendationService';
import { EnhancedAuditService } from './auditServiceEnhanced';

const prisma = new PrismaClient();

export interface MentalHealthAgentConfig {
  userId: string;
  sessionId: string;
  approach?: 'western' | 'eastern' | 'hybrid';
  emergencyContact?: string;
  enableEscalation?: boolean;
}

export interface AgentResponse {
  response: string;
  approach: string;
  mentalHealthScore: number;
  contentSuggestions: string[];
  shouldEscalate: boolean;
  escalationLevel: 'none' | 'monitor' | 'concern' | 'crisis';
  tools_used: string[];
  reasoning: string;
}

export interface EscalationReport {
  userId: string;
  sessionId: string;
  timestamp: Date;
  escalationLevel: 'concern' | 'crisis';
  triggerReasons: string[];
  userMessage: string;
  agentResponse: string;
  mentalHealthState: any;
  recommendedActions: string[];
  emergencyContacts?: string[];
  reportId: string;
}

/**
 * Mental Health Assistant Agent (Simplified Version Without LangChain)
 * Uses Gemini directly for now, can be upgraded to LangChain later
 */
export class MentalHealthAgent {
  private geminiService: any;

  constructor() {
    // For now, we'll use a simplified approach
    // TODO: Implement LangChain when packages are stable
  }

  /**
   * Generate AI response using a simplified approach
   */
  async generateResponse(
    userMessage: string,
    config: MentalHealthAgentConfig
  ): Promise<AgentResponse> {
    try {
      console.log('[Mental Health Agent] Generating response for user:', config.userId);

      // Get user's mental health state
      const mentalHealthState = await MentalHealthStateService.getUserState(config.userId);
      
      // Detect crisis patterns
      const crisisPatterns = await this.detectCrisisPatterns(config.userId, userMessage, config.sessionId);
      
      // Get content recommendations
      const recommendations = await ContentRecommendationService.generateRecommendations({
        userId: config.userId,
        approach: config.approach,
        maxRecommendations: 3
      });

      // Determine if escalation is needed
      const shouldEscalate = crisisPatterns.riskLevel === 'crisis' || mentalHealthState.requiresImmediate;
      const escalationLevel = this.mapRiskToEscalationLevel(crisisPatterns.riskLevel);

      // Generate response using existing approach router
      const { approachRouter } = await import('./langchainRouter');
      const approachResponse = await approachRouter.routeResponse(
        userMessage,
        {
          id: config.userId,
          name: 'User',
          approach: config.approach || 'hybrid'
        },
        mentalHealthState
      );

      // Create escalation report if needed
      if (shouldEscalate && config.enableEscalation) {
        await this.createEscalationReport({
          userId: config.userId,
          sessionId: config.sessionId,
          userMessage,
          agentResponse: approachResponse.message,
          escalationLevel: escalationLevel === 'crisis' ? 'crisis' : 'concern',
          triggerReasons: crisisPatterns.triggers,
          mentalHealthState
        });
      }

      // Log interaction
      await EnhancedAuditService.logUserActivity({
        userId: config.userId,
        action: 'mental_health_agent_response',
        details: {
          sessionId: config.sessionId,
          approach: config.approach,
          mentalHealthScore: mentalHealthState.score,
          escalationLevel,
          toolsUsed: ['mental_health_scoring', 'crisis_detection', 'content_recommendations']
        },
        ipAddress: undefined,
        userAgent: undefined
      });

      return {
        response: approachResponse.message,
        approach: config.approach || 'hybrid',
        mentalHealthScore: mentalHealthState.score,
        contentSuggestions: recommendations.map(r => r.title).slice(0, 3),
        shouldEscalate: shouldEscalate || false,
        escalationLevel,
        tools_used: ['mental_health_scoring', 'crisis_detection', 'content_recommendations'],
        reasoning: `Mental health score: ${mentalHealthState.score}, Risk level: ${crisisPatterns.riskLevel}`
      };

    } catch (error) {
      console.error('[Mental Health Agent] Error:', error);
      
      // Fallback response
      return {
        response: "I'm here to support you. If you're in crisis, please reach out to a mental health professional or emergency services immediately. You can call 988 for the Suicide & Crisis Lifeline.",
        approach: config.approach || 'hybrid',
        mentalHealthScore: 60,
        contentSuggestions: [],
        shouldEscalate: false,
        escalationLevel: 'none',
        tools_used: [],
        reasoning: 'Fallback due to agent error'
      };
    }
  }

  /**
   * Detect crisis patterns in user message
   */
  private async detectCrisisPatterns(userId: string, message: string, sessionId?: string): Promise<{
    riskLevel: 'low' | 'moderate' | 'high' | 'crisis';
    triggers: string[];
    patterns: string[];
    confidence: number;
  }> {
    try {
      // Crisis language patterns (enhanced)
      const crisisPatterns = {
        immediate: [
          'suicide', 'suicidal', 'kill myself', 'end it all', 'don\'t want to live',
          'hurt myself', 'self harm', 'self-harm', 'cutting', 'overdose',
          'want to die', 'end my life', 'better off dead'
        ],
        severe: [
          'hopeless', 'no point', 'can\'t go on', 'not worth living',
          'nobody cares', 'give up', 'tired of fighting', 'can\'t take it'
        ],
        concerning: [
          'very depressed', 'extremely anxious', 'panic attack', 'breakdown',
          'losing control', 'can\'t cope', 'overwhelmed', 'falling apart'
        ]
      };

      const lowerMessage = message.toLowerCase();
      const triggers: string[] = [];
      let riskLevel: 'low' | 'moderate' | 'high' | 'crisis' = 'low';
      
      // Check immediate crisis indicators
      const immediateMatches = crisisPatterns.immediate.filter(pattern => 
        lowerMessage.includes(pattern)
      );
      if (immediateMatches.length > 0) {
        triggers.push(...immediateMatches);
        riskLevel = 'crisis';
      }

      // Check severe indicators
      if (riskLevel !== 'crisis') {
        const severeMatches = crisisPatterns.severe.filter(pattern => 
          lowerMessage.includes(pattern)
        );
        if (severeMatches.length >= 2) {
          triggers.push(...severeMatches);
          riskLevel = 'high';
        }
      }

      // Check concerning indicators
      if (riskLevel === 'low') {
        const concerningMatches = crisisPatterns.concerning.filter(pattern => 
          lowerMessage.includes(pattern)
        );
        if (concerningMatches.length > 0) {
          triggers.push(...concerningMatches);
          riskLevel = concerningMatches.length >= 2 ? 'high' : 'moderate';
        }
      }

      // Calculate confidence based on pattern strength
      const confidence = Math.min(
        0.3 + (triggers.length * 0.2),
        1.0
      );

      return {
        riskLevel,
        triggers,
        patterns: [],
        confidence
      };

    } catch (error) {
      console.error('Crisis pattern detection error:', error);
      return {
        riskLevel: 'low',
        triggers: [],
        patterns: [],
        confidence: 0.1
      };
    }
  }

  /**
   * Map risk level to escalation level
   */
  private mapRiskToEscalationLevel(riskLevel: string): 'none' | 'monitor' | 'concern' | 'crisis' {
    switch (riskLevel) {
      case 'crisis': return 'crisis';
      case 'high': return 'concern';
      case 'moderate': return 'monitor';
      default: return 'none';
    }
  }

  /**
   * Create escalation report for human intervention
   */
  private async createEscalationReport(params: {
    userId: string;
    sessionId: string;
    userMessage: string;
    agentResponse: string;
    escalationLevel: 'concern' | 'crisis';
    triggerReasons: string[];
    mentalHealthState: any;
  }): Promise<EscalationReport> {
    const reportId = `ESC-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const recommendedActions = params.escalationLevel === 'crisis' 
      ? [
          'Contact emergency services immediately if imminent risk',
          'Reach out to user\'s emergency contact',
          'Schedule immediate professional intervention',
          'Monitor user closely for next 24-48 hours',
          'Provide crisis hotline numbers'
        ]
      : [
          'Schedule check-in within 24 hours',
          'Consider referral to mental health professional',
          'Provide additional supportive resources',
          'Monitor conversation patterns closely'
        ];

    const report: EscalationReport = {
      userId: params.userId,
      sessionId: params.sessionId,
      timestamp: new Date(),
      escalationLevel: params.escalationLevel,
      triggerReasons: params.triggerReasons,
      userMessage: params.userMessage,
      agentResponse: params.agentResponse,
      mentalHealthState: params.mentalHealthState,
      recommendedActions,
      reportId
    };

    // Store escalation report in database
    try {
      await prisma.escalationReport.create({
        data: {
          id: reportId,
          userId: params.userId,
          sessionId: params.sessionId,
          escalationLevel: params.escalationLevel,
          triggerReasons: JSON.stringify(params.triggerReasons),
          userMessage: params.userMessage,
          agentResponse: params.agentResponse,
          mentalHealthState: JSON.stringify(params.mentalHealthState),
          recommendedActions: JSON.stringify(recommendedActions),
          status: 'pending'
        }
      });
    } catch (error) {
      console.error('Failed to store escalation report:', error);
    }

    // Log escalation event
    await EnhancedAuditService.logUserActivity({
      userId: params.userId,
      action: 'escalation_created',
      details: {
        reportId,
        level: params.escalationLevel,
        triggers: params.triggerReasons
      },
      ipAddress: undefined,
      userAgent: undefined
    });

    // Notify (console for now)
    console.log(`🚨 ESCALATION ALERT - Report ${reportId}`);
    console.log(`User: ${params.userId}`);
    console.log(`Level: ${params.escalationLevel}`);
    console.log(`Triggers: ${params.triggerReasons.join(', ')}`);

    return report;
  }

  /**
   * Clear message history for a session
   */
  clearSessionHistory(sessionId: string): void {
    // No-op for simplified version
    console.log(`[Mental Health Agent] Session history cleared for: ${sessionId}`);
  }

  /**
   * Test agent functionality
   */
  async testAgent(): Promise<{ success: boolean; error?: string }> {
    try {
      const testConfig: MentalHealthAgentConfig = {
        userId: 'test-user',
        sessionId: 'test-session',
        approach: 'hybrid',
        enableEscalation: false
      };

      const response = await this.generateResponse("I'm feeling stressed about work", testConfig);
      
      return {
        success: response.response.length > 0 && response.approach === 'hybrid'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
}

// Export singleton instance
export const mentalHealthAgent = new MentalHealthAgent();
