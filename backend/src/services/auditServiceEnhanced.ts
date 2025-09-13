import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface AuditEvent {
  userId: string;
  action: string;
  details?: any;
  ipAddress?: string;
  userAgent?: string;
}

export class EnhancedAuditService {
  /**
   * Log user activity with basic fields for now
   */
  static async logUserActivity(event: AuditEvent): Promise<void> {
    try {
      await prisma.userActivity.create({
        data: {
          userId: event.userId,
          action: event.action,
          details: event.details ? JSON.stringify(event.details) : null,
          ipAddress: event.ipAddress,
          userAgent: event.userAgent,
        },
      });
    } catch (error) {
      console.error('Enhanced audit logging failed:', error);
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
   * Detect suspicious activity patterns
   */
  static async detectSuspiciousActivity(userId: string): Promise<boolean> {
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
        console.warn(`Suspicious activity detected: User ${userId} submitted ${assessmentSubmissions.length} assessments in 1 hour`);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Suspicious activity detection failed:', error);
      return false;
    }
  }
}
