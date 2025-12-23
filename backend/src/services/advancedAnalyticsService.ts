import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();
const analyticsLogger = logger.child({ module: 'AdvancedAnalytics' });

/**
 * Track AI provider usage
 */
export async function trackAIUsage(data: {
  provider: string;
  model?: string;
  userId?: string;
  conversationId?: string;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  responseTime: number;
  success: boolean;
  errorMessage?: string;
}) {
  try {
    await prisma.aIUsageMetric.create({
      data: {
        provider: data.provider,
        model: data.model,
        userId: data.userId,
        conversationId: data.conversationId,
        promptTokens: data.promptTokens || 0,
        completionTokens: data.completionTokens || 0,
        totalTokens: data.totalTokens || 0,
        responseTime: data.responseTime,
        success: data.success,
        errorMessage: data.errorMessage,
        requestedAt: new Date(),
        completedAt: new Date()
      }
    });
  } catch (error) {
    analyticsLogger.error({ error, data }, 'Failed to track AI usage');
  }
}

/**
 * Track crisis detection event
 */
export async function trackCrisisEvent(data: {
  userId: string;
  conversationId?: string;
  crisisLevel: string;
  confidence: number;
  indicators: string[];
  actionTaken: any;
  responseTime?: number;
}) {
  try {
    await prisma.crisisEvent.create({
      data: {
        userId: data.userId,
        conversationId: data.conversationId,
        crisisLevel: data.crisisLevel,
        confidence: data.confidence,
        indicators: JSON.stringify(data.indicators),
        actionTaken: JSON.stringify(data.actionTaken),
        responseTime: data.responseTime,
        detectedAt: new Date()
      }
    });

    analyticsLogger.warn(
      {
        userId: data.userId,
        crisisLevel: data.crisisLevel,
        confidence: data.confidence
      },
      'Crisis event tracked'
    );
  } catch (error) {
    analyticsLogger.error({ error, data }, 'Failed to track crisis event');
  }
}

/**
 * Track system health metric
 */
export async function trackSystemMetric(data: {
  metricType: 'api_response' | 'db_query' | 'memory_usage' | 'cpu_usage';
  endpoint?: string;
  value: number;
  unit: 'ms' | 'mb' | 'percent';
  tags?: Record<string, any>;
}) {
  try {
    await prisma.systemHealthMetric.create({
      data: {
        metricType: data.metricType,
        endpoint: data.endpoint,
        value: data.value,
        unit: data.unit,
        tags: data.tags ? JSON.stringify(data.tags) : null,
        recordedAt: new Date()
      }
    });
  } catch (error) {
    // Don't log errors for health metrics to avoid recursion
    console.error('Failed to track system metric:', error);
  }
}

/**
 * Track user session
 */
export async function createUserSession(data: {
  userId: string;
  deviceType?: string;
  browserInfo?: string;
}): Promise<string> {
  try {
    const session = await prisma.userSession.create({
      data: {
        userId: data.userId,
        deviceType: data.deviceType,
        browserInfo: data.browserInfo,
        startedAt: new Date()
      }
    });
    return session.id;
  } catch (error) {
    analyticsLogger.error({ error, data }, 'Failed to create user session');
    throw error;
  }
}

/**
 * End user session
 */
export async function endUserSession(sessionId: string, data: {
  pagesViewed: number;
  actionsPerformed: number;
  featuresUsed: string[];
}) {
  try {
    const session = await prisma.userSession.findUnique({
      where: { id: sessionId }
    });

    if (!session) {
      return;
    }

    const duration = Math.floor((Date.now() - session.startedAt.getTime()) / 1000);

    await prisma.userSession.update({
      where: { id: sessionId },
      data: {
        endedAt: new Date(),
        duration,
        pagesViewed: data.pagesViewed,
        actionsPerformed: data.actionsPerformed,
        featuresUsed: JSON.stringify(data.featuresUsed)
      }
    });
  } catch (error) {
    analyticsLogger.error({ error, sessionId }, 'Failed to end user session');
  }
}

/**
 * Create wellness snapshot
 */
export async function createWellnessSnapshot(data: {
  userId: string;
  wellnessScore: number;
  assessmentScores: Record<string, any>;
  moodAverage?: string;
  engagementLevel?: string;
  periodStart: Date;
  periodEnd: Date;
}) {
  try {
    await prisma.wellnessSnapshot.create({
      data: {
        userId: data.userId,
        wellnessScore: data.wellnessScore,
        assessmentScores: JSON.stringify(data.assessmentScores),
        moodAverage: data.moodAverage,
        engagementLevel: data.engagementLevel,
        periodStart: data.periodStart,
        periodEnd: data.periodEnd,
        recordedAt: new Date()
      }
    });
  } catch (error) {
    analyticsLogger.error({ error, data }, 'Failed to create wellness snapshot');
  }
}

/**
 * Get AI provider analytics
 */
export async function getAIProviderAnalytics(startDate: Date, endDate: Date) {
  try {
    const [usage, successRate, avgResponseTime, tokenUsage] = await Promise.all([
      // Usage by provider
      prisma.aIUsageMetric.groupBy({
        by: ['provider'],
        where: {
          requestedAt: { gte: startDate, lte: endDate }
        },
        _count: { id: true },
        _avg: { responseTime: true }
      }),

      // Success rate
      prisma.aIUsageMetric.groupBy({
        by: ['provider', 'success'],
        where: {
          requestedAt: { gte: startDate, lte: endDate }
        },
        _count: { id: true }
      }),

      // Average response time by provider
      prisma.aIUsageMetric.groupBy({
        by: ['provider'],
        where: {
          requestedAt: { gte: startDate, lte: endDate },
          success: true
        },
        _avg: {
          responseTime: true
        }
      }),

      // Token usage
      prisma.aIUsageMetric.aggregate({
        where: {
          requestedAt: { gte: startDate, lte: endDate }
        },
        _sum: {
          promptTokens: true,
          completionTokens: true,
          totalTokens: true
        }
      })
    ]);

    // Calculate success rate for each provider
    const successRateMap = new Map<string, { total: number; successful: number }>();
    successRate.forEach(sr => {
      if (!successRateMap.has(sr.provider)) {
        successRateMap.set(sr.provider, { total: 0, successful: 0 });
      }
      const stats = successRateMap.get(sr.provider)!;
      stats.total += sr._count.id;
      if (sr.success) {
        stats.successful += sr._count.id;
      }
    });

    return {
      providerUsage: usage.map(u => ({
        provider: u.provider,
        requests: u._count.id,
        avgResponseTime: Math.round(u._avg.responseTime || 0),
        successRate: successRateMap.has(u.provider)
          ? ((successRateMap.get(u.provider)!.successful / successRateMap.get(u.provider)!.total) * 100).toFixed(1)
          : '0'
      })),
      totalTokens: tokenUsage._sum.totalTokens || 0,
      promptTokens: tokenUsage._sum.promptTokens || 0,
      completionTokens: tokenUsage._sum.completionTokens || 0,
      avgResponseTime: avgResponseTime.map(a => ({
        provider: a.provider,
        avgTime: Math.round(a._avg.responseTime || 0)
      }))
    };
  } catch (error) {
    analyticsLogger.error({ error }, 'Failed to get AI provider analytics');
    throw error;
  }
}

/**
 * Get crisis detection analytics
 */
export async function getCrisisAnalytics(startDate: Date, endDate: Date) {
  try {
    const [eventsByLevel, responseTimeStats, resolutionStats, trend] = await Promise.all([
      // Events by crisis level
      prisma.crisisEvent.groupBy({
        by: ['crisisLevel'],
        where: {
          detectedAt: { gte: startDate, lte: endDate }
        },
        _count: { id: true }
      }),

      // Response time statistics
      prisma.crisisEvent.aggregate({
        where: {
          detectedAt: { gte: startDate, lte: endDate },
          responseTime: { not: null }
        },
        _avg: { responseTime: true },
        _min: { responseTime: true },
        _max: { responseTime: true }
      }),

      // Resolution statistics
      prisma.crisisEvent.groupBy({
        by: ['resolved'],
        where: {
          detectedAt: { gte: startDate, lte: endDate }
        },
        _count: { id: true }
      }),

      // Daily trend
      prisma.$queryRaw<Array<{ date: string; count: bigint; level: string }>>`
        SELECT 
          date("detectedAt") as date,
          "crisisLevel" as level,
          COUNT(*) as count
        FROM crisis_events
        WHERE "detectedAt" >= ${startDate.toISOString()}
          AND "detectedAt" <= ${endDate.toISOString()}
        GROUP BY date("detectedAt"), "crisisLevel"
        ORDER BY date ASC
      `
    ]);

    return {
      totalEvents: eventsByLevel.reduce((sum, e) => sum + e._count.id, 0),
      eventsByLevel: eventsByLevel.map(e => ({
        level: e.crisisLevel,
        count: e._count.id
      })),
      avgResponseTime: Math.round(responseTimeStats._avg.responseTime || 0),
      minResponseTime: responseTimeStats._min.responseTime || 0,
      maxResponseTime: responseTimeStats._max.responseTime || 0,
      resolutionRate: resolutionStats.length > 0
        ? ((resolutionStats.find(r => r.resolved)?._count.id || 0) / 
           resolutionStats.reduce((sum, r) => sum + r._count.id, 0) * 100).toFixed(1)
        : '0',
      trend: trend.map(t => ({
        date: t.date,
        level: t.level,
        count: Number(t.count)
      }))
    };
  } catch (error) {
    analyticsLogger.error({ error }, 'Failed to get crisis analytics');
    throw error;
  }
}

/**
 * Get system health analytics
 */
export async function getSystemHealthAnalytics(startDate: Date, endDate: Date) {
  try {
    const [apiMetrics, dbMetrics, resourceMetrics] = await Promise.all([
      // API response times
      prisma.systemHealthMetric.aggregate({
        where: {
          metricType: 'api_response',
          recordedAt: { gte: startDate, lte: endDate }
        },
        _avg: { value: true },
        _min: { value: true },
        _max: { value: true }
      }),

      // Database query times
      prisma.systemHealthMetric.aggregate({
        where: {
          metricType: 'db_query',
          recordedAt: { gte: startDate, lte: endDate }
        },
        _avg: { value: true }
      }),

      // Resource usage
      prisma.systemHealthMetric.groupBy({
        by: ['metricType'],
        where: {
          metricType: { in: ['memory_usage', 'cpu_usage'] },
          recordedAt: { gte: startDate, lte: endDate }
        },
        _avg: { value: true },
        _max: { value: true }
      })
    ]);

    return {
      api: {
        avgResponseTime: Math.round(apiMetrics._avg.value || 0),
        minResponseTime: Math.round(apiMetrics._min.value || 0),
        maxResponseTime: Math.round(apiMetrics._max.value || 0)
      },
      database: {
        avgQueryTime: Math.round(dbMetrics._avg.value || 0)
      },
      resources: resourceMetrics.map(r => ({
        type: r.metricType,
        avgUsage: Math.round(r._avg.value || 0),
        maxUsage: Math.round(r._max.value || 0)
      }))
    };
  } catch (error) {
    analyticsLogger.error({ error }, 'Failed to get system health analytics');
    throw error;
  }
}

/**
 * Get user engagement analytics
 */
export async function getUserEngagementAnalytics(startDate: Date, endDate: Date) {
  try {
    const [sessionStats, featureUsage, avgSessionDuration] = await Promise.all([
      // Session statistics
      prisma.userSession.count({
        where: {
          startedAt: { gte: startDate, lte: endDate }
        }
      }),

      // Feature usage - extract from featuresUsed JSON
      prisma.userSession.findMany({
        where: {
          startedAt: { gte: startDate, lte: endDate },
          featuresUsed: { not: null }
        },
        select: {
          featuresUsed: true
        }
      }),

      // Average session duration
      prisma.userSession.aggregate({
        where: {
          startedAt: { gte: startDate, lte: endDate },
          duration: { not: null }
        },
        _avg: { duration: true }
      })
    ]);

    // Parse feature usage
    const featureCount = new Map<string, number>();
    featureUsage.forEach(session => {
      try {
        const features = JSON.parse(session.featuresUsed || '[]');
        features.forEach((feature: string) => {
          featureCount.set(feature, (featureCount.get(feature) || 0) + 1);
        });
      } catch (e) {
        // Skip invalid JSON
      }
    });

    return {
      totalSessions: sessionStats,
      avgDuration: Math.round(avgSessionDuration._avg.duration || 0),
      topFeatures: Array.from(featureCount.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([feature, count]) => ({ feature, count }))
    };
  } catch (error) {
    analyticsLogger.error({ error }, 'Failed to get user engagement analytics');
    throw error;
  }
}

/**
 * Get wellness impact metrics
 */
export async function getWellnessImpactMetrics(startDate: Date, endDate: Date) {
  try {
    const [avgWellnessScore, wellnessTrend, improvementRate] = await Promise.all([
      // Average wellness score
      prisma.wellnessSnapshot.aggregate({
        where: {
          recordedAt: { gte: startDate, lte: endDate }
        },
        _avg: { wellnessScore: true }
      }),

      // Wellness trend over time
      prisma.$queryRaw<Array<{ date: string; avgScore: number }>>`
        SELECT 
          date("recordedAt") as date,
          AVG("wellnessScore") as avgScore
        FROM wellness_snapshots
        WHERE "recordedAt" >= ${startDate.toISOString()}
          AND "recordedAt" <= ${endDate.toISOString()}
        GROUP BY date("recordedAt")
        ORDER BY date ASC
      `,

      // Users with improvement
      prisma.$queryRaw<Array<{ improved: bigint }>>`
        WITH user_scores AS (
          SELECT 
            "userId",
            MIN("wellnessScore") as first_score,
            MAX("wellnessScore") as last_score
          FROM wellness_snapshots
          WHERE "recordedAt" >= ${startDate.toISOString()}
            AND "recordedAt" <= ${endDate.toISOString()}
          GROUP BY "userId"
        )
        SELECT COUNT(*) as improved
        FROM user_scores
        WHERE last_score > first_score
      `
    ]);

    const totalUsers = await prisma.wellnessSnapshot.groupBy({
      by: ['userId'],
      where: {
        recordedAt: { gte: startDate, lte: endDate }
      }
    });

    return {
      avgWellnessScore: Math.round(avgWellnessScore._avg.wellnessScore || 0),
      wellnessTrend: wellnessTrend.map(t => ({
        date: t.date,
        avgScore: Math.round(t.avgScore)
      })),
      improvementRate: totalUsers.length > 0
        ? ((Number(improvementRate[0]?.improved || 0) / totalUsers.length) * 100).toFixed(1)
        : '0',
      usersTracked: totalUsers.length
    };
  } catch (error) {
    analyticsLogger.error({ error }, 'Failed to get wellness impact metrics');
    throw error;
  }
}

export const advancedAnalyticsService = {
  trackAIUsage,
  trackCrisisEvent,
  trackSystemMetric,
  createUserSession,
  endUserSession,
  createWellnessSnapshot,
  getAIProviderAnalytics,
  getCrisisAnalytics,
  getSystemHealthAnalytics,
  getUserEngagementAnalytics,
  getWellnessImpactMetrics
};
