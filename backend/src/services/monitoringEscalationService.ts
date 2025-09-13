import { PrismaClient } from '@prisma/client';
import { MentalHealthStateService } from './mentalHealthStateService';
import type { MentalHealthState } from '../types/mentalHealth';
import { EnhancedAuditService } from './auditServiceEnhanced';

const prisma = new PrismaClient();

export interface MonitoringAlert {
  userId: string;
  alertType: 'pattern_change' | 'risk_escalation' | 'engagement_drop' | 'crisis_indicators';
  severity: 'low' | 'medium' | 'high' | 'critical';
  indicators: string[];
  confidenceScore: number;
  timeframe: string;
  recommendedActions: string[];
  timestamp: Date;
}

export interface EscalationTrigger {
  type: 'crisis_language' | 'pattern_escalation' | 'risk_threshold' | 'manual_review';
  detected: boolean;
  confidence: number;
  details: any;
}

export interface EscalationProtocol {
  level: 'monitor' | 'concern' | 'crisis';
  triggers: EscalationTrigger[];
  actions: string[];
  notifications: NotificationConfig[];
  followUpRequired: boolean;
  timeframe: string;
}

export interface NotificationConfig {
  method: 'email' | 'sms' | 'webhook' | 'console_log';
  recipient: string;
  template: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
}

export interface RiskAssessment {
  userId: string;
  overallRisk: 'low' | 'moderate' | 'high' | 'severe';
  riskScore: number; // 0-100
  primaryConcerns: string[];
  protectiveFactors: string[];
  riskFactors: string[];
  immediateActions: string[];
  monitoringRecommendations: string[];
  lastAssessed: Date;
  confidence: number;
}

/**
 * Advanced Monitoring and Escalation Service for Mental Health Crisis Management
 * Provides pattern detection, risk assessment, and automated escalation protocols
 */
export class MonitoringEscalationService {

  /**
   * Monitor user for pattern changes and risk escalation
   */
  static async monitorUser(userId: string): Promise<MonitoringAlert[]> {
    try {
      console.log('[Monitoring] Starting user monitoring for:', userId);

      const alerts: MonitoringAlert[] = [];

      // Get comprehensive user data for analysis
      const userData = await this.getUserMonitoringData(userId);

      // Check for pattern changes
      const patternAlerts = await this.detectPatternChanges(userId, userData);
      alerts.push(...patternAlerts);

      // Check for risk escalation
      const riskAlerts = await this.detectRiskEscalation(userId, userData);
      alerts.push(...riskAlerts);

      // Check for engagement drops
      const engagementAlerts = await this.detectEngagementChanges(userId, userData);
      alerts.push(...engagementAlerts);

      // Check for crisis indicators
      const crisisAlerts = await this.detectCrisisIndicators(userId, userData);
      alerts.push(...crisisAlerts);

      // Log monitoring results
      await EnhancedAuditService.logUserActivity({
        userId,
        action: 'user_monitoring_completed',
        details: {
          alertCount: alerts.length,
          alertTypes: alerts.map(a => a.alertType),
          highestSeverity: alerts.length > 0 ? alerts.reduce((max, alert) => 
            this.getSeverityScore(alert.severity) > this.getSeverityScore(max.severity) ? alert : max
          ).severity : 'none'
        },
        ipAddress: undefined,
        userAgent: undefined
      });

      console.log('[Monitoring] Generated', alerts.length, 'alerts for user:', userId);

      return alerts.sort((a, b) => this.getSeverityScore(b.severity) - this.getSeverityScore(a.severity));

    } catch (error) {
      console.error('[Monitoring] Error monitoring user:', userId, error);
      return [];
    }
  }

  /**
   * Perform comprehensive risk assessment
   */
  static async assessRisk(userId: string): Promise<RiskAssessment> {
    try {
      console.log('[Risk Assessment] Starting assessment for:', userId);

      // Get current mental health state
      const mentalHealthState = await MentalHealthStateService.getUserState(userId);

      // Get monitoring data
      const userData = await this.getUserMonitoringData(userId);

      // Analyze conversation patterns for risk indicators
      const conversationRisk = await this.analyzeConversationRisk(userId, userData.recentMessages);

      // Analyze assessment trends
      const assessmentRisk = this.analyzeAssessmentRisk(userData.assessments);

      // Analyze behavioral patterns
      const behaviorRisk = this.analyzeBehavioralRisk(userData);

      // Calculate overall risk score
      const riskScore = this.calculateOverallRisk({
        mentalHealthScore: mentalHealthState.score,
        conversationRisk: conversationRisk.score,
        assessmentRisk: assessmentRisk.score,
        behaviorRisk: behaviorRisk.score,
        requiresImmediate: mentalHealthState.requiresImmediate
      });

      // Determine risk level
      const overallRisk = this.determineRiskLevel(riskScore);

      // Generate protective and risk factors
      const factors = this.identifyRiskFactors(userData, mentalHealthState);

      // Generate recommendations
      const recommendations = this.generateRiskRecommendations(overallRisk, riskScore, factors);

      const riskAssessment: RiskAssessment = {
        userId,
        overallRisk,
        riskScore,
        primaryConcerns: mentalHealthState.topConcerns || [],
        protectiveFactors: factors.protective,
        riskFactors: factors.risk,
        immediateActions: recommendations.immediate,
        monitoringRecommendations: recommendations.monitoring,
        lastAssessed: new Date(),
        confidence: this.calculateConfidence(userData)
      };

      // Store risk assessment
      await this.storeRiskAssessment(riskAssessment);

      console.log('[Risk Assessment] Completed with risk level:', overallRisk, 'score:', riskScore);

      return riskAssessment;

    } catch (error) {
      console.error('[Risk Assessment] Error:', error);
      
      // Return safe default assessment
      return {
        userId,
        overallRisk: 'moderate',
        riskScore: 50,
        primaryConcerns: ['Unable to assess - data unavailable'],
        protectiveFactors: ['Engagement with mental health resources'],
        riskFactors: ['Assessment data unavailable'],
        immediateActions: ['Schedule comprehensive assessment'],
        monitoringRecommendations: ['Regular check-ins recommended'],
        lastAssessed: new Date(),
        confidence: 0.3
      };
    }
  }

  /**
   * Execute escalation protocol based on risk level and triggers
   */
  static async executeEscalation(
    userId: string,
    triggers: EscalationTrigger[],
    context: {
      userMessage?: string;
      agentResponse?: string;
      sessionId?: string;
      mentalHealthState?: any;
    }
  ): Promise<EscalationProtocol> {
    try {
      console.log('[Escalation] Executing protocol for user:', userId, 'triggers:', triggers.length);

      // Determine escalation level based on triggers
      const escalationLevel = this.determineEscalationLevel(triggers);

      // Generate protocol actions
      const actions = this.generateEscalationActions(escalationLevel, triggers);

      // Configure notifications
      const notifications = await this.configureNotifications(userId, escalationLevel);

      const protocol: EscalationProtocol = {
        level: escalationLevel,
        triggers,
        actions,
        notifications,
        followUpRequired: escalationLevel !== 'monitor',
        timeframe: this.getEscalationTimeframe(escalationLevel)
      };

      // Create escalation report
      await this.createEscalationReport({
        userId,
        protocol,
        context,
        triggers
      });

      // Send notifications
      await this.sendEscalationNotifications(protocol, userId, context);

      console.log('[Escalation] Protocol executed:', escalationLevel);

      return protocol;

    } catch (error) {
      console.error('[Escalation] Error executing protocol:', error);
      
      // Execute minimal safety protocol
      return {
        level: 'concern',
        triggers,
        actions: ['Manual review required', 'Monitor closely'],
        notifications: [{
          method: 'console_log',
          recipient: 'system',
          template: 'escalation_error',
          urgency: 'high'
        }],
        followUpRequired: true,
        timeframe: '24 hours'
      };
    }
  }

  /**
   * Get comprehensive user data for monitoring
   */
  private static async getUserMonitoringData(userId: string): Promise<any> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        assessments: {
          orderBy: { completedAt: 'desc' },
          take: 20
        },
        moodEntries: {
          orderBy: { createdAt: 'desc' },
          take: 30
        },
        chatMessages: {
          orderBy: { createdAt: 'desc' },
          take: 50,
          select: {
            content: true,
            type: true,
            createdAt: true,
            metadata: true
          }
        },
        userActivities: {
          orderBy: { timestamp: 'desc' },
          take: 100
        }
      }
    });

    return {
      user,
      assessments: user?.assessments || [],
      moodEntries: user?.moodEntries || [],
      recentMessages: user?.chatMessages || [],
      activities: user?.userActivities || []
    };
  }

  /**
   * Detect pattern changes in user behavior/responses
   */
  private static async detectPatternChanges(userId: string, userData: any): Promise<MonitoringAlert[]> {
    const alerts: MonitoringAlert[] = [];

    try {
      // Analyze mood trend changes
      const moodTrendChange = this.analyzeMoodTrendChange(userData.moodEntries);
      if (moodTrendChange.significant) {
        alerts.push({
          userId,
          alertType: 'pattern_change',
          severity: moodTrendChange.severity,
          indicators: moodTrendChange.indicators,
          confidenceScore: moodTrendChange.confidence,
          timeframe: '14 days',
          recommendedActions: moodTrendChange.actions,
          timestamp: new Date()
        });
      }

      // Analyze assessment score changes
      const assessmentChange = this.analyzeAssessmentChange(userData.assessments);
      if (assessmentChange.significant) {
        alerts.push({
          userId,
          alertType: 'pattern_change',
          severity: assessmentChange.severity,
          indicators: assessmentChange.indicators,
          confidenceScore: assessmentChange.confidence,
          timeframe: '30 days',
          recommendedActions: assessmentChange.actions,
          timestamp: new Date()
        });
      }

    } catch (error) {
      console.error('[Pattern Detection] Error:', error);
    }

    return alerts;
  }

  /**
   * Detect risk escalation indicators
   */
  private static async detectRiskEscalation(userId: string, userData: any): Promise<MonitoringAlert[]> {
    const alerts: MonitoringAlert[] = [];

    try {
      // Check for escalating language in recent messages
      const languageEscalation = this.analyzeLanguageEscalation(userData.recentMessages);
      if (languageEscalation.detected) {
        alerts.push({
          userId,
          alertType: 'risk_escalation',
          severity: languageEscalation.severity,
          indicators: languageEscalation.indicators,
          confidenceScore: languageEscalation.confidence,
          timeframe: '7 days',
          recommendedActions: languageEscalation.actions,
          timestamp: new Date()
        });
      }

      // Check for risk threshold breaches
      const thresholdBreach = this.checkRiskThresholds(userData);
      if (thresholdBreach.detected) {
        alerts.push({
          userId,
          alertType: 'risk_escalation',
          severity: thresholdBreach.severity,
          indicators: thresholdBreach.indicators,
          confidenceScore: thresholdBreach.confidence,
          timeframe: 'current',
          recommendedActions: thresholdBreach.actions,
          timestamp: new Date()
        });
      }

    } catch (error) {
      console.error('[Risk Escalation Detection] Error:', error);
    }

    return alerts;
  }

  /**
   * Detect engagement changes
   */
  private static async detectEngagementChanges(userId: string, userData: any): Promise<MonitoringAlert[]> {
    const alerts: MonitoringAlert[] = [];

    try {
      const engagementAnalysis = this.analyzeEngagementPatterns(userData.activities, userData.recentMessages);
      
      if (engagementAnalysis.significantDrop) {
        alerts.push({
          userId,
          alertType: 'engagement_drop',
          severity: engagementAnalysis.severity,
          indicators: engagementAnalysis.indicators,
          confidenceScore: engagementAnalysis.confidence,
          timeframe: '14 days',
          recommendedActions: engagementAnalysis.actions,
          timestamp: new Date()
        });
      }

    } catch (error) {
      console.error('[Engagement Detection] Error:', error);
    }

    return alerts;
  }

  /**
   * Detect crisis indicators
   */
  private static async detectCrisisIndicators(userId: string, userData: any): Promise<MonitoringAlert[]> {
    const alerts: MonitoringAlert[] = [];

    try {
      const crisisAnalysis = this.analyzeCrisisIndicators(userData.recentMessages, userData.assessments);
      
      if (crisisAnalysis.detected) {
        alerts.push({
          userId,
          alertType: 'crisis_indicators',
          severity: 'critical',
          indicators: crisisAnalysis.indicators,
          confidenceScore: crisisAnalysis.confidence,
          timeframe: 'immediate',
          recommendedActions: crisisAnalysis.actions,
          timestamp: new Date()
        });
      }

    } catch (error) {
      console.error('[Crisis Detection] Error:', error);
    }

    return alerts;
  }

  /**
   * Helper methods for analysis
   */
  private static analyzeMoodTrendChange(moodEntries: any[]): any {
    if (moodEntries.length < 7) {
      return { significant: false };
    }

    const recent7 = moodEntries.slice(0, 7).map(e => e.mood);
    const previous7 = moodEntries.slice(7, 14).map(e => e.mood);

    if (previous7.length < 7) {
      return { significant: false };
    }

    const recentAvg = recent7.reduce((sum, mood) => sum + mood, 0) / recent7.length;
    const previousAvg = previous7.reduce((sum, mood) => sum + mood, 0) / previous7.length;

    const change = recentAvg - previousAvg;
    const percentChange = Math.abs(change) / previousAvg;

    if (percentChange > 0.3) { // 30% change threshold
      const severity = Math.abs(change) > 2 ? 'high' : 'medium';
      const direction = change < 0 ? 'declining' : 'improving';
      
      return {
        significant: true,
        severity: direction === 'declining' ? severity : 'low',
        indicators: [`Mood trend ${direction} by ${Math.round(percentChange * 100)}% over 7 days`],
        confidence: Math.min(percentChange, 1.0),
        actions: direction === 'declining' 
          ? ['Increase support frequency', 'Consider intervention']
          : ['Acknowledge improvement', 'Maintain current support']
      };
    }

    return { significant: false };
  }

  private static analyzeAssessmentChange(assessments: any[]): any {
    if (assessments.length < 2) {
      return { significant: false };
    }

    const recent = assessments[0];
    const previous = assessments[1];

    const scoreDiff = recent.score - previous.score;
    const percentChange = Math.abs(scoreDiff) / previous.score;

    if (percentChange > 0.25 || Math.abs(scoreDiff) > 15) { // 25% or 15 point change
      const severity = Math.abs(scoreDiff) > 20 ? 'high' : 'medium';
      const direction = scoreDiff > 0 ? 'increased' : 'decreased';
      
      return {
        significant: true,
        severity: scoreDiff > 0 ? severity : 'low',
        indicators: [`${recent.assessmentType} score ${direction} by ${Math.abs(scoreDiff)} points`],
        confidence: Math.min(percentChange, 1.0),
        actions: scoreDiff > 0 
          ? ['Review assessment responses', 'Consider additional support']
          : ['Acknowledge progress', 'Continue current approach']
      };
    }

    return { significant: false };
  }

  private static analyzeConversationRisk(userId: string, messages: any[]): Promise<{ score: number; indicators: string[] }> {
    // This would integrate with the crisis detection from langchainAgent
    // For now, simple keyword analysis
    const riskKeywords = [
      'suicide', 'kill myself', 'end it all', 'hopeless', 'no point',
      'hurt myself', 'better off dead', 'can\'t go on'
    ];

    let riskScore = 0;
    const indicators: string[] = [];

    for (const message of messages.slice(0, 10)) {
      if (message.type === 'user') {
        const content = message.content.toLowerCase();
        for (const keyword of riskKeywords) {
          if (content.includes(keyword)) {
            riskScore += 15;
            indicators.push(`Risk language detected: "${keyword}"`);
          }
        }
      }
    }

    return Promise.resolve({
      score: Math.min(riskScore, 100),
      indicators
    });
  }

  private static analyzeAssessmentRisk(assessments: any[]): { score: number; indicators: string[] } {
    if (assessments.length === 0) {
      return { score: 30, indicators: ['No assessment data available'] };
    }

    const recentAssessment = assessments[0];
    const score = recentAssessment.score;
    const indicators: string[] = [];

    if (score >= 80) {
      indicators.push('Severe distress level detected in recent assessment');
    } else if (score >= 60) {
      indicators.push('Moderate distress level in recent assessment');
    }

    return { score: Math.min(score, 100), indicators };
  }

  private static analyzeBehavioralRisk(userData: any): { score: number; indicators: string[] } {
    const indicators: string[] = [];
    let score = 0;

    // Check engagement patterns
    const recentActivity = userData.activities.filter((a: any) => 
      Date.now() - new Date(a.timestamp).getTime() < 7 * 24 * 60 * 60 * 1000
    );

    if (recentActivity.length < 5) {
      score += 20;
      indicators.push('Low engagement in past week');
    }

    // Check message patterns
    const recentMessages = userData.recentMessages.filter((m: any) => 
      Date.now() - new Date(m.createdAt).getTime() < 7 * 24 * 60 * 60 * 1000
    );

    if (recentMessages.length < 5) {
      score += 15;
      indicators.push('Reduced communication frequency');
    }

    return { score: Math.min(score, 100), indicators };
  }

  private static calculateOverallRisk(factors: {
    mentalHealthScore: number;
    conversationRisk: number;
    assessmentRisk: number;
    behaviorRisk: number;
    requiresImmediate?: boolean;
  }): number {
    if (factors.requiresImmediate) return 95;

    // Weighted average of risk factors
    const weights = {
      mentalHealth: 0.4,
      conversation: 0.3,
      assessment: 0.2,
      behavior: 0.1
    };

    return Math.round(
      factors.mentalHealthScore * weights.mentalHealth +
      factors.conversationRisk * weights.conversation +
      factors.assessmentRisk * weights.assessment +
      factors.behaviorRisk * weights.behavior
    );
  }

  private static determineRiskLevel(score: number): 'low' | 'moderate' | 'high' | 'severe' {
    if (score >= 90) return 'severe';
    if (score >= 70) return 'high';
    if (score >= 40) return 'moderate';
    return 'low';
  }

  private static identifyRiskFactors(userData: any, mentalHealthState: any): {
    protective: string[];
    risk: string[];
  } {
    const protective: string[] = [];
    const risk: string[] = [];

    // Protective factors
    if (userData.activities.length > 20) {
      protective.push('High engagement with mental health resources');
    }
    if (userData.moodEntries.length > 10) {
      protective.push('Consistent mood tracking');
    }

    // Risk factors
    if (mentalHealthState.score >= 70) {
      risk.push('High distress levels in recent assessments');
    }
    if (mentalHealthState.topConcerns.length >= 3) {
      risk.push('Multiple concurrent mental health concerns');
    }

    return { protective, risk };
  }

  private static generateRiskRecommendations(
    riskLevel: string,
    score: number,
    factors: { protective: string[]; risk: string[] }
  ): { immediate: string[]; monitoring: string[] } {
    const immediate: string[] = [];
    const monitoring: string[] = [];

    switch (riskLevel) {
      case 'severe':
        immediate.push('Immediate professional intervention required');
        immediate.push('Contact emergency services if imminent risk');
        immediate.push('Notify emergency contacts');
        monitoring.push('Continuous monitoring for 72 hours');
        break;
      case 'high':
        immediate.push('Schedule professional consultation within 24-48 hours');
        immediate.push('Increase check-in frequency');
        monitoring.push('Daily monitoring recommended');
        break;
      case 'moderate':
        immediate.push('Consider scheduling therapy session');
        immediate.push('Provide additional coping resources');
        monitoring.push('Weekly monitoring sufficient');
        break;
      default:
        monitoring.push('Standard monitoring intervals adequate');
    }

    return { immediate, monitoring };
  }

  private static calculateConfidence(userData: any): number {
    let confidence = 0.5; // Base confidence

    // More data = higher confidence
    if (userData.assessments.length >= 3) confidence += 0.2;
    if (userData.moodEntries.length >= 10) confidence += 0.1;
    if (userData.recentMessages.length >= 10) confidence += 0.1;
    if (userData.activities.length >= 20) confidence += 0.1;

    return Math.min(confidence, 1.0);
  }

  private static async storeRiskAssessment(assessment: RiskAssessment): Promise<void> {
    // In production, this would store in a separate risk_assessments table
    await EnhancedAuditService.logUserActivity({
      userId: assessment.userId,
      action: 'risk_assessment_completed',
      details: {
        riskLevel: assessment.overallRisk,
        riskScore: assessment.riskScore,
        confidence: assessment.confidence,
        primaryConcerns: assessment.primaryConcerns
      },
      ipAddress: undefined,
      userAgent: undefined
    });
  }

  private static getSeverityScore(severity: string): number {
    const scores = { low: 1, medium: 2, high: 3, critical: 4 };
    return scores[severity as keyof typeof scores] || 0;
  }

  private static determineEscalationLevel(triggers: EscalationTrigger[]): 'monitor' | 'concern' | 'crisis' {
    const hasCrisis = triggers.some(t => t.type === 'crisis_language' && t.detected);
    const hasHighConfidence = triggers.some(t => t.confidence >= 0.8);
    const multipleRisks = triggers.filter(t => t.detected).length >= 2;

    if (hasCrisis) return 'crisis';
    if (hasHighConfidence && multipleRisks) return 'concern';
    return 'monitor';
  }

  private static generateEscalationActions(level: string, triggers: EscalationTrigger[]): string[] {
    const actions: string[] = [];

    switch (level) {
      case 'crisis':
        actions.push('Immediate crisis intervention protocol');
        actions.push('Contact emergency services if imminent risk');
        actions.push('Notify all emergency contacts');
        actions.push('Continuous monitoring for 72 hours');
        break;
      case 'concern':
        actions.push('Escalate to human reviewer within 4 hours');
        actions.push('Increase monitoring frequency');
        actions.push('Prepare intervention resources');
        actions.push('Schedule professional consultation');
        break;
      case 'monitor':
        actions.push('Flag for review within 24 hours');
        actions.push('Monitor conversation patterns');
        actions.push('Track assessment changes');
        break;
    }

    return actions;
  }

  private static async configureNotifications(userId: string, level: string): Promise<NotificationConfig[]> {
    const notifications: NotificationConfig[] = [];

    // For now, using console logging - would be replaced with actual notification services
    const urgencyMap = { monitor: 'low', concern: 'high', crisis: 'critical' } as const;

    notifications.push({
      method: 'console_log',
      recipient: 'mental_health_team',
      template: `escalation_${level}`,
      urgency: urgencyMap[level as keyof typeof urgencyMap] || 'low'
    });

    return notifications;
  }

  private static async createEscalationReport(params: {
    userId: string;
    protocol: EscalationProtocol;
    context: any;
    triggers: EscalationTrigger[];
  }): Promise<void> {
    // This would create an escalation report in the database
    await EnhancedAuditService.logUserActivity({
      userId: params.userId,
      action: 'escalation_protocol_executed',
      details: {
        level: params.protocol.level,
        triggersCount: params.triggers.length,
        actionsCount: params.protocol.actions.length,
        followUpRequired: params.protocol.followUpRequired
      },
      ipAddress: undefined,
      userAgent: undefined
    });
  }

  private static async sendEscalationNotifications(
    protocol: EscalationProtocol,
    userId: string,
    context: any
  ): Promise<void> {
    for (const notification of protocol.notifications) {
      if (notification.method === 'console_log') {
        console.log(`🚨 ESCALATION NOTIFICATION [${notification.urgency.toUpperCase()}]`);
        console.log(`User: ${userId}`);
        console.log(`Level: ${protocol.level}`);
        console.log(`Triggers: ${protocol.triggers.map(t => t.type).join(', ')}`);
        console.log(`Actions: ${protocol.actions.join('; ')}`);
      }
      // In production, would implement email, SMS, webhook notifications
    }
  }

  private static getEscalationTimeframe(level: string): string {
    const timeframes = {
      monitor: '24-48 hours',
      concern: '4-8 hours',
      crisis: 'immediate'
    };
    return timeframes[level as keyof typeof timeframes] || '24 hours';
  }

  // Additional helper methods for pattern analysis...
  private static analyzeLanguageEscalation(messages: any[]): any {
    // Implementation would analyze conversation for escalating negative language
    return { detected: false };
  }

  private static checkRiskThresholds(userData: any): any {
    // Implementation would check various risk thresholds
    return { detected: false };
  }

  private static analyzeEngagementPatterns(activities: any[], messages: any[]): any {
    // Implementation would analyze user engagement patterns
    return { significantDrop: false };
  }

  private static analyzeCrisisIndicators(messages: any[], assessments: any[]): any {
    // Implementation would analyze for crisis indicators
    return { detected: false };
  }

  /**
   * Test the monitoring and escalation system
   */
  static async testSystem(): Promise<{ success: boolean; error?: string }> {
    try {
      const testUserId = 'test-user';
      
      // Test monitoring
      const alerts = await this.monitorUser(testUserId);
      
      // Test risk assessment
      const riskAssessment = await this.assessRisk(testUserId);
      
      return {
        success: Array.isArray(alerts) && riskAssessment.userId === testUserId
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
}
