import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface AuditEvent {
  userId: string;
  action: string;
  details?: any;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  deviceInfo?: string;
  location?: string;
  riskScore?: number;
}

export interface SystemAuditEvent {
  action: string;
  component: string;
  details: any;
  severity: 'info' | 'warning' | 'error' | 'critical';
  userId?: string;
}

export class EnhancedAuditService {
  /**
   * Log user activity with enhanced context
   */
  static async logUserActivity(event: AuditEvent): Promise<void> {
    try {
      // Calculate risk score based on activity patterns
      const riskScore = await this.calculateRiskScore(event);
      
      await prisma.userActivity.create({
        data: {
          userId: event.userId,
          action: event.action,
          details: event.details ? JSON.stringify(event.details) : null,
          ipAddress: event.ipAddress,
          userAgent: event.userAgent,
          sessionId: event.sessionId,
          deviceInfo: event.deviceInfo,
          location: event.location,
          riskScore: riskScore,
        },
      });

      // Check for suspicious activity patterns
      await this.detectSuspiciousActivity(event.userId);
    } catch (error) {
      console.error('Enhanced audit logging failed:', error);
      // Fallback to basic logging without system audit log for now
    }
  }

  /**
   * Log system-level events
   */
  static async logSystemEvent(event: SystemAuditEvent): Promise<void> {
    try {
      await prisma.systemAuditLog.create({
        data: {
          action: event.action,
          component: event.component,
          details: JSON.stringify(event.details),
          severity: event.severity,
          userId: event.userId,
        },
      });
    } catch (error) {
      console.error('System audit logging failed:', error);
    }
  }

  /**
   * Calculate risk score based on user behavior patterns
   */
  private static async calculateRiskScore(event: AuditEvent): Promise<number> {
    try {
      // Get recent user activities (last 24 hours)
      const recentActivities = await prisma.userActivity.findMany({
        where: {
          userId: event.userId,
          timestamp: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
        },
        orderBy: { timestamp: 'desc' },
        take: 100,
      });

      let riskScore = 0;

      // Multiple failed login attempts
      const failedLogins = recentActivities.filter(a => 
        a.action === 'login_failed'
      ).length;
      riskScore += Math.min(failedLogins * 0.2, 1.0);

      // Unusual activity patterns
      const activityFrequency = recentActivities.length;
      if (activityFrequency > 50) riskScore += 0.3; // Too many activities

      // IP address changes
      const uniqueIPs = new Set(recentActivities.map(a => a.ipAddress).filter(Boolean));
      if (uniqueIPs.size > 3) riskScore += 0.2; // Multiple IPs

      // Time-based anomalies (activity at unusual hours)
      const currentHour = new Date().getHours();
      if (currentHour < 6 || currentHour > 23) riskScore += 0.1;

      return Math.min(riskScore, 1.0); // Cap at 1.0
    } catch (error) {
      console.error('Risk score calculation failed:', error);
      return 0;
    }
  }

  /**
   * Detect suspicious activity patterns
   */
  private static async detectSuspiciousActivity(userId: string): Promise<void> {
    try {
      const recentActivities = await prisma.userActivity.findMany({
        where: {
          userId,
          timestamp: {
            gte: new Date(Date.now() - 60 * 60 * 1000), // Last hour
          },
        },
        orderBy: { timestamp: 'desc' },
      });

      // Check for rapid-fire assessment submissions
      const assessmentSubmissions = recentActivities.filter(a => 
        a.action === 'assessment_completed'
      );
      
      if (assessmentSubmissions.length > 5) {
        await this.logSystemEvent({
          action: 'suspicious_activity_detected',
          component: 'audit_service',
          details: {
            userId,
            pattern: 'rapid_assessment_submissions',
            count: assessmentSubmissions.length,
            timeframe: '1_hour'
          },
          severity: 'warning'
        });
      }

      // Check for high-risk score activities
      const highRiskActivities = recentActivities.filter(a => 
        a.riskScore && a.riskScore > 0.7
      );

      if (highRiskActivities.length > 3) {
        await this.logSystemEvent({
          action: 'high_risk_user_detected',
          component: 'audit_service',
          details: {
            userId,
            highRiskCount: highRiskActivities.length,
            maxRiskScore: Math.max(...highRiskActivities.map(a => a.riskScore || 0))
          },
          severity: 'warning'
        });
      }
    } catch (error) {
      console.error('Suspicious activity detection failed:', error);
    }
  }

  /**
   * Get audit trail for a user
   */
  static async getUserAuditTrail(
    userId: string, 
    days: number = 30,
    actions?: string[]
  ): Promise<any[]> {
    try {
      const activities = await prisma.userActivity.findMany({
        where: {
          userId,
          timestamp: {
            gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
          },
          ...(actions && { action: { in: actions } }),
        },
        orderBy: { timestamp: 'desc' },
        take: 1000,
      });

      return activities.map(activity => ({
        ...activity,
        details: activity.details ? JSON.parse(activity.details) : null,
      }));
    } catch (error) {
      console.error('Failed to get user audit trail:', error);
      return [];
    }
  }

  /**
   * Get system audit logs
   */
  static async getSystemAuditLogs(
    component?: string,
    severity?: string,
    days: number = 7
  ): Promise<any[]> {
    try {
      const logs = await prisma.systemAuditLog.findMany({
        where: {
          timestamp: {
            gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
          },
          ...(component && { component }),
          ...(severity && { severity }),
        },
        orderBy: { timestamp: 'desc' },
        take: 1000,
      });

      return logs.map(log => ({
        ...log,
        details: JSON.parse(log.details),
      }));
    } catch (error) {
      console.error('Failed to get system audit logs:', error);
      return [];
    }
  }
}
