import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface ErrorLog {
  id: string;
  message: string;
  stack: string;
  level: 'error' | 'warning' | 'info' | 'debug';
  timestamp: Date;
  userId?: string;
  route?: string;
  method?: string;
  userAgent?: string;
  ip?: string;
  metadata?: any;
}

export interface AlertRule {
  id: string;
  name: string;
  condition: string; // e.g., "error_rate > 5%"
  threshold: number;
  timeWindow: number; // minutes
  isActive: boolean;
  webhookUrl?: string;
  emailRecipients?: string[];
}

export class ErrorTrackingService {
  private errorBuffer: ErrorLog[] = [];
  private alertRules: AlertRule[] = [
    {
      id: 'high-error-rate',
      name: 'High Error Rate',
      condition: 'error_rate > 5%',
      threshold: 5,
      timeWindow: 15,
      isActive: true,
      emailRecipients: ['admin@mentalwellbeing.app']
    },
    {
      id: 'database-errors',
      name: 'Database Connection Errors',
      condition: 'database_errors > 10',
      threshold: 10,
      timeWindow: 5,
      isActive: true,
      emailRecipients: ['dev@mentalwellbeing.app']
    },
    {
      id: 'auth-failures',
      name: 'Authentication Failures',
      condition: 'auth_failures > 20',
      threshold: 20,
      timeWindow: 10,
      isActive: true,
      emailRecipients: ['security@mentalwellbeing.app']
    }
  ];

  /**
   * Log an error with context
   */
  async logError(error: Error, context: {
    level?: 'error' | 'warning' | 'info' | 'debug';
    userId?: string;
    route?: string;
    method?: string;
    userAgent?: string;
    ip?: string;
    metadata?: any;
  } = {}) {
    const errorLog: Omit<ErrorLog, 'id'> = {
      message: error.message,
      stack: error.stack || '',
      level: context.level || 'error',
      timestamp: new Date(),
      userId: context.userId,
      route: context.route,
      method: context.method,
      userAgent: context.userAgent,
      ip: context.ip,
      metadata: context.metadata,
    };

    // Store in database (create error_logs table)
    try {
      // TODO: Create error_logs table in Prisma schema
      console.error('[ERROR_TRACKING]', {
        ...errorLog,
        stack: errorLog.stack.substring(0, 1000) // Truncate stack trace
      });

      // Add to buffer for real-time processing
      this.errorBuffer.push({
        id: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...errorLog
      });

      // Keep buffer size manageable
      if (this.errorBuffer.length > 1000) {
        this.errorBuffer = this.errorBuffer.slice(-500);
      }

      // Check alert rules
      await this.checkAlertRules();

    } catch (dbError) {
      console.error('Failed to log error to database:', dbError);
      console.error('Original error:', errorLog);
    }
  }

  /**
   * Express middleware for error tracking
   */
  errorMiddleware() {
    return (error: Error, req: Request, res: Response, next: NextFunction) => {
      this.logError(error, {
        level: 'error',
        userId: req.user?.id,
        route: req.path,
        method: req.method,
        userAgent: req.get('User-Agent'),
        ip: req.ip,
        metadata: {
          body: req.body,
          query: req.query,
          params: req.params,
        }
      });

      // Don't expose internal errors to client
      const isProduction = process.env.NODE_ENV === 'production';
      const statusCode = error.statusCode || 500;
      
      res.status(statusCode).json({
        error: {
          message: isProduction ? 'Internal server error' : error.message,
          ...(isProduction ? {} : { stack: error.stack })
        }
      });
    };
  }

  /**
   * Get error statistics
   */
  async getErrorStatistics(timeRange: { start: Date; end: Date }) {
    const errors = this.errorBuffer.filter(
      error => error.timestamp >= timeRange.start && error.timestamp <= timeRange.end
    );

    const totalErrors = errors.length;
    const errorsByLevel = errors.reduce((acc, error) => {
      acc[error.level] = (acc[error.level] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const errorsByRoute = errors.reduce((acc, error) => {
      const route = error.route || 'unknown';
      acc[route] = (acc[route] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const errorsByUser = errors.reduce((acc, error) => {
      if (error.userId) {
        acc[error.userId] = (acc[error.userId] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    // Calculate error rate (errors per hour)
    const timeRangeHours = (timeRange.end.getTime() - timeRange.start.getTime()) / (1000 * 60 * 60);
    const errorRate = timeRangeHours > 0 ? totalErrors / timeRangeHours : 0;

    // Get most common errors
    const errorFrequency = errors.reduce((acc, error) => {
      acc[error.message] = (acc[error.message] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topErrors = Object.entries(errorFrequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([message, count]) => ({ message, count }));

    return {
      totalErrors,
      errorRate: Math.round(errorRate * 100) / 100,
      errorsByLevel,
      errorsByRoute: Object.entries(errorsByRoute)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([route, count]) => ({ route, count })),
      errorsByUser: Object.entries(errorsByUser)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([userId, count]) => ({ userId, count })),
      topErrors,
      recentErrors: errors
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, 20)
    };
  }

  /**
   * Check alert rules and trigger notifications
   */
  private async checkAlertRules() {
    const now = new Date();

    for (const rule of this.alertRules) {
      if (!rule.isActive) continue;

      const windowStart = new Date(now.getTime() - rule.timeWindow * 60 * 1000);
      const recentErrors = this.errorBuffer.filter(
        error => error.timestamp >= windowStart && error.timestamp <= now
      );

      let shouldAlert = false;

      switch (rule.condition.split(' ')[0]) {
        case 'error_rate':
          const errorRate = (recentErrors.length / rule.timeWindow) * 60; // errors per hour
          shouldAlert = errorRate > rule.threshold;
          break;

        case 'database_errors':
          const dbErrors = recentErrors.filter(
            error => error.message.toLowerCase().includes('database') ||
                    error.message.toLowerCase().includes('prisma') ||
                    error.message.toLowerCase().includes('connection')
          ).length;
          shouldAlert = dbErrors > rule.threshold;
          break;

        case 'auth_failures':
          const authErrors = recentErrors.filter(
            error => error.route?.includes('/auth') ||
                    error.message.toLowerCase().includes('authentication') ||
                    error.message.toLowerCase().includes('authorization')
          ).length;
          shouldAlert = authErrors > rule.threshold;
          break;
      }

      if (shouldAlert) {
        await this.triggerAlert(rule, recentErrors);
      }
    }
  }

  /**
   * Trigger alert notification
   */
  private async triggerAlert(rule: AlertRule, errors: ErrorLog[]) {
    const alertData = {
      rule: rule.name,
      condition: rule.condition,
      threshold: rule.threshold,
      actualCount: errors.length,
      timeWindow: rule.timeWindow,
      timestamp: new Date(),
      errors: errors.slice(0, 5) // Include first 5 errors
    };

    console.warn('[ALERT TRIGGERED]', alertData);

    // TODO: Implement actual notification sending
    // - Email notifications
    // - Webhook notifications
    // - Slack/Discord notifications
    // - SMS for critical alerts

    // Send to webhook if configured
    if (rule.webhookUrl) {
      try {
        await fetch(rule.webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(alertData)
        });
      } catch (error) {
        console.error('Failed to send webhook alert:', error);
      }
    }

    // Send email notifications
    if (rule.emailRecipients && rule.emailRecipients.length > 0) {
      await this.sendEmailAlert(rule.emailRecipients, alertData);
    }
  }

  /**
   * Send email alert
   */
  private async sendEmailAlert(recipients: string[], alertData: any) {
    // TODO: Implement email service integration (SendGrid, SES, etc.)
    console.log('Email alert would be sent to:', recipients, alertData);
  }

  /**
   * Get system health status
   */
  async getSystemHealth() {
    const now = new Date();
    const lastHour = new Date(now.getTime() - 60 * 60 * 1000);
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const errorsLastHour = this.errorBuffer.filter(
      error => error.timestamp >= lastHour
    ).length;

    const errorsLast24Hours = this.errorBuffer.filter(
      error => error.timestamp >= last24Hours
    ).length;

    // Calculate health score (0-100)
    let healthScore = 100;
    
    // Deduct points for errors
    healthScore -= Math.min(errorsLastHour * 5, 50); // Max 50 points for recent errors
    healthScore -= Math.min(errorsLast24Hours * 0.5, 30); // Max 30 points for daily errors

    // Ensure score is between 0-100
    healthScore = Math.max(0, Math.min(100, healthScore));

    let status: 'healthy' | 'warning' | 'critical';
    if (healthScore >= 90) status = 'healthy';
    else if (healthScore >= 70) status = 'warning';
    else status = 'critical';

    return {
      status,
      healthScore: Math.round(healthScore),
      errorsLastHour,
      errorsLast24Hours,
      lastChecked: now,
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      activeAlerts: this.alertRules.filter(rule => rule.isActive).length
    };
  }

  /**
   * Clear old errors from buffer
   */
  clearOldErrors(olderThanDays: number = 7) {
    const cutoffDate = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);
    this.errorBuffer = this.errorBuffer.filter(error => error.timestamp >= cutoffDate);
  }

  /**
   * Add custom alert rule
   */
  addAlertRule(rule: Omit<AlertRule, 'id'>) {
    const newRule: AlertRule = {
      id: `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...rule
    };
    this.alertRules.push(newRule);
    return newRule;
  }

  /**
   * Update alert rule
   */
  updateAlertRule(id: string, updates: Partial<AlertRule>) {
    const ruleIndex = this.alertRules.findIndex(rule => rule.id === id);
    if (ruleIndex !== -1) {
      this.alertRules[ruleIndex] = { ...this.alertRules[ruleIndex], ...updates };
      return this.alertRules[ruleIndex];
    }
    return null;
  }

  /**
   * Get all alert rules
   */
  getAlertRules() {
    return this.alertRules;
  }
}

export const errorTrackingService = new ErrorTrackingService();