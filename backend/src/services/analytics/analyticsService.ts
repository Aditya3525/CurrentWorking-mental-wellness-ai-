import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface ContentAnalytics {
  totalContent: number;
  publishedContent: number;
  draftContent: number;
  totalViews: number;
  averageRating: number;
  contentByCategory: Array<{
    category: string;
    count: number;
    averageRating: number;
    totalViews: number;
  }>;
  contentByType: Array<{
    type: string;
    count: number;
    averageRating: number;
    totalViews: number;
  }>;
  topPerformingContent: Array<{
    id: string;
    title: string;
    views: number;
    rating: number;
    category: string;
    type: string;
  }>;
  recentContent: Array<{
    id: string;
    title: string;
    createdAt: Date;
    isPublished: boolean;
    category: string;
  }>;
  lowPerformingContent: Array<{
    id: string;
    title: string;
    views: number;
    rating: number;
    category: string;
  }>;
}

export interface UserEngagementAnalytics {
  totalUsers: number;
  activeUsers: number;
  newUsersThisMonth: number;
  totalAssessments: number;
  totalMoodEntries: number;
  averageSessionLength: number;
  userRetentionRate: number;
  usersByApproach: Array<{
    approach: string;
    count: number;
  }>;
  usersByRegion: Array<{
    region: string;
    count: number;
  }>;
  engagementTrends: Array<{
    date: Date;
    activeUsers: number;
    newUsers: number;
    assessmentsCompleted: number;
    contentViewed: number;
  }>;
}

export interface AdminActivityAnalytics {
  totalAdmins: number;
  contentCreated: number;
  contentUpdated: number;
  contentDeleted: number;
  recentActivities: Array<{
    adminId: string;
    adminName: string;
    action: string;
    targetType: string;
    targetId: string;
    timestamp: Date;
    details: any;
  }>;
  adminProductivity: Array<{
    adminId: string;
    adminName: string;
    contentCreated: number;
    contentUpdated: number;
    lastActive: Date;
  }>;
}

export interface PerformanceMetrics {
  averageResponseTime: number;
  slowestEndpoints: Array<{
    endpoint: string;
    averageResponseTime: number;
    requestCount: number;
  }>;
  errorRate: number;
  uptime: number;
  databaseQueryPerformance: Array<{
    query: string;
    averageTime: number;
    frequency: number;
  }>;
  cacheHitRate: number;
  contentDeliveryMetrics: {
    averageLoadTime: number;
    compressionRatio: number;
    cdnHitRate: number;
  };
}

export class AnalyticsService {
  
  /**
   * Get comprehensive content analytics
   */
  async getContentAnalytics(dateRange?: { start: Date; end: Date }): Promise<ContentAnalytics> {
    const whereClause = dateRange ? {
      createdAt: {
        gte: dateRange.start,
        lte: dateRange.end
      }
    } : {};

    // Get basic content stats
    const [totalContent, publishedContent, contentStats] = await Promise.all([
      prisma.content.count({ where: whereClause }),
      prisma.content.count({ 
        where: { ...whereClause, isPublished: true } 
      }),
      prisma.content.aggregate({
        where: whereClause,
        _avg: {
          rating: true,
        },
        _sum: {
          viewCount: true,
        }
      })
    ]);

    const draftContent = totalContent - publishedContent;

    // Get content by category
    const contentByCategory = await prisma.content.groupBy({
      by: ['category'],
      where: whereClause,
      _count: {
        id: true,
      },
      _avg: {
        rating: true,
      },
      _sum: {
        viewCount: true,
      }
    });

    // Get content by type
    const contentByType = await prisma.content.groupBy({
      by: ['type'],
      where: whereClause,
      _count: {
        id: true,
      },
      _avg: {
        rating: true,
      },
      _sum: {
        viewCount: true,
      }
    });

    // Get top performing content
    const topPerformingContent = await prisma.content.findMany({
      where: whereClause,
      select: {
        id: true,
        title: true,
        viewCount: true,
        rating: true,
        category: true,
        type: true,
      },
      orderBy: [
        { viewCount: 'desc' },
        { rating: 'desc' }
      ],
      take: 10
    });

    // Get recent content
    const recentContent = await prisma.content.findMany({
      where: whereClause,
      select: {
        id: true,
        title: true,
        createdAt: true,
        isPublished: true,
        category: true,
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    });

    // Get low performing content (low views and ratings)
    const lowPerformingContent = await prisma.content.findMany({
      where: {
        ...whereClause,
        isPublished: true,
        viewCount: { lt: 10 },
        OR: [
          { rating: { lt: 3.0 } },
          { rating: null }
        ]
      },
      select: {
        id: true,
        title: true,
        viewCount: true,
        rating: true,
        category: true,
      },
      orderBy: [
        { viewCount: 'asc' },
        { rating: 'asc' }
      ],
      take: 10
    });

    return {
      totalContent,
      publishedContent,
      draftContent,
      totalViews: contentStats._sum.viewCount || 0,
      averageRating: contentStats._avg.rating || 0,
      contentByCategory: contentByCategory.map(item => ({
        category: item.category,
        count: item._count.id,
        averageRating: item._avg.rating || 0,
        totalViews: item._sum.viewCount || 0,
      })),
      contentByType: contentByType.map(item => ({
        type: item.type,
        count: item._count.id,
        averageRating: item._avg.rating || 0,
        totalViews: item._sum.viewCount || 0,
      })),
      topPerformingContent: topPerformingContent.map(item => ({
        id: item.id,
        title: item.title,
        views: item.viewCount,
        rating: item.rating || 0,
        category: item.category,
        type: item.type,
      })),
      recentContent,
      lowPerformingContent: lowPerformingContent.map(item => ({
        id: item.id,
        title: item.title,
        views: item.viewCount,
        rating: item.rating || 0,
        category: item.category,
      })),
    };
  }

  /**
   * Get user engagement analytics
   */
  async getUserEngagementAnalytics(dateRange?: { start: Date; end: Date }): Promise<UserEngagementAnalytics> {
    const whereClause = dateRange ? {
      createdAt: {
        gte: dateRange.start,
        lte: dateRange.end
      }
    } : {};

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Get basic user stats
    const [
      totalUsers, 
      newUsersThisMonth, 
      totalAssessments, 
      totalMoodEntries,
      activeUsers
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({
        where: {
          createdAt: {
            gte: oneMonthAgo
          }
        }
      }),
      prisma.assessment.count({ where: whereClause }),
      prisma.moodEntry.count({ where: whereClause }),
      prisma.user.count({
        where: {
          updatedAt: {
            gte: thirtyDaysAgo
          }
        }
      })
    ]);

    // Get users by approach
    const usersByApproach = await prisma.user.groupBy({
      by: ['approach'],
      _count: {
        id: true,
      },
      where: {
        approach: {
          not: null
        }
      }
    });

    // Get users by region
    const usersByRegion = await prisma.user.groupBy({
      by: ['region'],
      _count: {
        id: true,
      },
      where: {
        region: {
          not: null
        }
      }
    });

    // Calculate retention rate (simplified)
    const retentionRate = totalUsers > 0 ? (activeUsers / totalUsers) * 100 : 0;

    // Get engagement trends (last 30 days)
    const engagementTrends = await this.getEngagementTrends(30);

    return {
      totalUsers,
      activeUsers,
      newUsersThisMonth,
      totalAssessments,
      totalMoodEntries,
      averageSessionLength: 0, // TODO: Implement session tracking
      userRetentionRate: retentionRate,
      usersByApproach: usersByApproach.map(item => ({
        approach: item.approach || 'Not specified',
        count: item._count.id,
      })),
      usersByRegion: usersByRegion.map(item => ({
        region: item.region || 'Not specified',
        count: item._count.id,
      })),
      engagementTrends,
    };
  }

  /**
   * Get admin activity analytics
   */
  async getAdminActivityAnalytics(dateRange?: { start: Date; end: Date }): Promise<AdminActivityAnalytics> {
    const whereClause = dateRange ? {
      createdAt: {
        gte: dateRange.start,
        lte: dateRange.end
      }
    } : {};

    // Count content operations
    const [contentCreated, contentUpdated] = await Promise.all([
      prisma.content.count({
        where: {
          ...whereClause,
          createdBy: { not: null }
        }
      }),
      prisma.content.count({
        where: {
          ...whereClause,
          lastEditedBy: { not: null },
          updatedAt: { not: undefined }
        }
      })
    ]);

    // Get admin productivity stats
    const adminProductivity = await prisma.content.groupBy({
      by: ['createdBy'],
      where: {
        ...whereClause,
        createdBy: { not: null }
      },
      _count: {
        id: true,
      }
    });

    // TODO: Implement audit log system for detailed activity tracking
    const recentActivities: any[] = [];

    return {
      totalAdmins: 0, // TODO: Count actual admin users
      contentCreated,
      contentUpdated,
      contentDeleted: 0, // TODO: Track deletions
      recentActivities,
      adminProductivity: adminProductivity.map(item => ({
        adminId: item.createdBy || '',
        adminName: 'Admin User', // TODO: Join with user table
        contentCreated: item._count.id,
        contentUpdated: 0, // TODO: Calculate updates
        lastActive: new Date(),
      })),
    };
  }

  /**
   * Get performance metrics
   */
  async getPerformanceMetrics(): Promise<PerformanceMetrics> {
    // TODO: Implement actual performance monitoring
    // This would typically integrate with monitoring tools like New Relic, DataDog, etc.
    
    return {
      averageResponseTime: 150, // ms
      slowestEndpoints: [
        {
          endpoint: '/api/content',
          averageResponseTime: 300,
          requestCount: 1000,
        },
        {
          endpoint: '/api/assessments',
          averageResponseTime: 250,
          requestCount: 800,
        }
      ],
      errorRate: 0.5, // percentage
      uptime: 99.9, // percentage
      databaseQueryPerformance: [
        {
          query: 'SELECT * FROM content',
          averageTime: 50,
          frequency: 500,
        }
      ],
      cacheHitRate: 85, // percentage
      contentDeliveryMetrics: {
        averageLoadTime: 200,
        compressionRatio: 0.7,
        cdnHitRate: 90,
      },
    };
  }

  /**
   * Get engagement trends for specified number of days
   */
  private async getEngagementTrends(days: number): Promise<UserEngagementAnalytics['engagementTrends']> {
    const trends = [];
    const currentDate = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(currentDate.getTime() - i * 24 * 60 * 60 * 1000);
      const nextDate = new Date(date.getTime() + 24 * 60 * 60 * 1000);

      const [activeUsers, newUsers, assessmentsCompleted] = await Promise.all([
        prisma.user.count({
          where: {
            updatedAt: {
              gte: date,
              lt: nextDate
            }
          }
        }),
        prisma.user.count({
          where: {
            createdAt: {
              gte: date,
              lt: nextDate
            }
          }
        }),
        prisma.assessment.count({
          where: {
            completedAt: {
              gte: date,
              lt: nextDate
            }
          }
        })
      ]);

      trends.push({
        date,
        activeUsers,
        newUsers,
        assessmentsCompleted,
        contentViewed: 0, // TODO: Implement content view tracking
      });
    }

    return trends;
  }

  /**
   * Generate comprehensive analytics report
   */
  async getComprehensiveReport(dateRange?: { start: Date; end: Date }) {
    const [
      contentAnalytics,
      userEngagementAnalytics,
      adminActivityAnalytics,
      performanceMetrics
    ] = await Promise.all([
      this.getContentAnalytics(dateRange),
      this.getUserEngagementAnalytics(dateRange),
      this.getAdminActivityAnalytics(dateRange),
      this.getPerformanceMetrics()
    ]);

    return {
      generatedAt: new Date(),
      dateRange,
      content: contentAnalytics,
      userEngagement: userEngagementAnalytics,
      adminActivity: adminActivityAnalytics,
      performance: performanceMetrics,
      summary: {
        totalContent: contentAnalytics.totalContent,
        totalUsers: userEngagementAnalytics.totalUsers,
        activeUsers: userEngagementAnalytics.activeUsers,
        averageRating: contentAnalytics.averageRating,
        systemHealth: performanceMetrics.uptime > 99 ? 'Good' : 'Needs Attention',
      }
    };
  }

  /**
   * Track user interaction with content
   */
  async trackContentInteraction(userId: string, contentId: string, interactionType: string, metadata?: any) {
    // TODO: Implement user activity tracking table
    try {
      await prisma.userActivity.create({
        data: {
          userId,
          activityType: interactionType,
          targetType: 'content',
          targetId: contentId,
          metadata: JSON.stringify(metadata || {}),
          timestamp: new Date(),
        }
      });

      // Update content view count if it's a view interaction
      if (interactionType === 'view') {
        await prisma.content.update({
          where: { id: contentId },
          data: {
            viewCount: {
              increment: 1
            }
          }
        });
      }
    } catch (error) {
      console.error('Error tracking content interaction:', error);
    }
  }

  /**
   * Get real-time analytics dashboard data
   */
  async getRealTimeDashboard() {
    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const lastHour = new Date(now.getTime() - 60 * 60 * 1000);

    const [
      activeUsersLast24h,
      activeUsersLastHour,
      newUsersToday,
      contentViewsToday,
      assessmentsToday
    ] = await Promise.all([
      prisma.user.count({
        where: {
          updatedAt: { gte: last24Hours }
        }
      }),
      prisma.user.count({
        where: {
          updatedAt: { gte: lastHour }
        }
      }),
      prisma.user.count({
        where: {
          createdAt: { gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()) }
        }
      }),
      // TODO: Implement proper content view tracking
      0,
      prisma.assessment.count({
        where: {
          completedAt: { gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()) }
        }
      })
    ]);

    return {
      timestamp: now,
      activeUsers: {
        last24Hours: activeUsersLast24h,
        lastHour: activeUsersLastHour,
      },
      newUsersToday,
      contentViewsToday,
      assessmentsToday,
      systemStatus: 'operational', // TODO: Implement health checks
    };
  }
}

export const analyticsService = new AnalyticsService();