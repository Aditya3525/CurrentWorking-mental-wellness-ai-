import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface ActivityDetails {
  [key: string]: any;
}

export interface UserActivityLog {
  id: string;
  userId: string;
  action: string;
  details?: ActivityDetails;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
}

export class AuditLogger {
  /**
   * Log user activity
   */
  static async logActivity(
    userId: string,
    action: string,
    details?: ActivityDetails,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    try {
      await prisma.userActivity.create({
        data: {
          userId,
          action,
          details: details ? JSON.stringify(details) : null,
          ipAddress,
          userAgent
        }
      });
    } catch (error) {
      console.error('Failed to log user activity:', error);
      // Don't throw - logging should not break app functionality
    }
  }

  /**
   * Get user activity history
   */
  static async getUserActivityHistory(
    userId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<UserActivityLog[]> {
    const activities = await prisma.userActivity.findMany({
      where: { userId },
      orderBy: { timestamp: 'desc' },
      take: limit,
      skip: offset
    });

    return activities.map(activity => ({
      id: activity.id,
      userId: activity.userId,
      action: activity.action,
      details: activity.details ? JSON.parse(activity.details) : undefined,
      ipAddress: activity.ipAddress || undefined,
      userAgent: activity.userAgent || undefined,
      timestamp: activity.timestamp
    }));
  }

  /**
   * Get activity summary for user
   */
  static async getActivitySummary(userId: string, days: number = 30): Promise<{
    totalActivities: number;
    loginCount: number;
    assessmentCount: number;
    chatMessageCount: number;
    lastActivity: Date | null;
    activityByDay: { date: string; count: number }[];
  }> {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const activities = await prisma.userActivity.findMany({
      where: {
        userId,
        timestamp: { gte: since }
      },
      orderBy: { timestamp: 'desc' }
    });

    const summary = {
      totalActivities: activities.length,
      loginCount: activities.filter(a => a.action === 'login').length,
      assessmentCount: activities.filter(a => a.action === 'assessment_completed').length,
      chatMessageCount: activities.filter(a => a.action === 'chat_message').length,
      lastActivity: activities.length > 0 ? activities[0].timestamp : null,
      activityByDay: [] as { date: string; count: number }[]
    };

    // Group activities by day
    const activityByDay = new Map<string, number>();
    for (const activity of activities) {
      const date = activity.timestamp.toISOString().split('T')[0];
      activityByDay.set(date, (activityByDay.get(date) || 0) + 1);
    }

    summary.activityByDay = Array.from(activityByDay.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return summary;
  }

  /**
   * Get security events for user
   */
  static async getSecurityEvents(userId: string, limit: number = 20): Promise<UserActivityLog[]> {
    const securityActions = [
      'login',
      'logout',
      'password_change',
      'token_refresh',
      'failed_login',
      'account_locked',
      'password_reset'
    ];

    const activities = await prisma.userActivity.findMany({
      where: {
        userId,
        action: { in: securityActions }
      },
      orderBy: { timestamp: 'desc' },
      take: limit
    });

    return activities.map(activity => ({
      id: activity.id,
      userId: activity.userId,
      action: activity.action,
      details: activity.details ? JSON.parse(activity.details) : undefined,
      ipAddress: activity.ipAddress || undefined,
      userAgent: activity.userAgent || undefined,
      timestamp: activity.timestamp
    }));
  }

  /**
   * Detect suspicious activity patterns
   */
  static async detectSuspiciousActivity(userId: string): Promise<{
    suspicious: boolean;
    reasons: string[];
    confidence: number;
  }> {
    const activities = await prisma.userActivity.findMany({
      where: {
        userId,
        timestamp: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
      },
      orderBy: { timestamp: 'desc' }
    });

    const reasons: string[] = [];
    let suspicionScore = 0;

    // Check for multiple login attempts from different IPs
    const loginAttempts = activities.filter(a => a.action === 'login' || a.action === 'failed_login');
    const uniqueIPs = new Set(loginAttempts.map(a => a.ipAddress).filter(Boolean));
    
    if (uniqueIPs.size > 3) {
      reasons.push('Multiple login attempts from different IP addresses');
      suspicionScore += 30;
    }

    // Check for rapid successive logins
    const logins = activities.filter(a => a.action === 'login').slice(0, 5);
    if (logins.length >= 3) {
      const timeSpan = logins[0].timestamp.getTime() - logins[logins.length - 1].timestamp.getTime();
      if (timeSpan < 5 * 60 * 1000) { // 5 minutes
        reasons.push('Rapid successive login attempts');
        suspicionScore += 25;
      }
    }

    // Check for unusual activity patterns
    const hourCounts = new Map<number, number>();
    activities.forEach(activity => {
      const hour = activity.timestamp.getHours();
      hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);
    });

    // Detect activity during unusual hours (2 AM - 6 AM)
    const nightActivity = Array.from(hourCounts.entries())
      .filter(([hour]) => hour >= 2 && hour <= 6)
      .reduce((sum, [, count]) => sum + count, 0);

    if (nightActivity > activities.length * 0.3) {
      reasons.push('Unusual activity during night hours');
      suspicionScore += 15;
    }

    // Check for failed login attempts
    const failedLogins = activities.filter(a => a.action === 'failed_login').length;
    if (failedLogins > 3) {
      reasons.push('Multiple failed login attempts');
      suspicionScore += 20;
    }

    return {
      suspicious: suspicionScore >= 40,
      reasons,
      confidence: Math.min(suspicionScore, 100)
    };
  }

  /**
   * Clean up old activity logs
   */
  static async cleanupOldLogs(retentionDays: number = 90): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const result = await prisma.userActivity.deleteMany({
      where: {
        timestamp: { lt: cutoffDate }
      }
    });

    return result.count;
  }
}
