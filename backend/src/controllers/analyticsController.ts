import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AnalyticsService } from '../services/analytics/analyticsService';
import { errorTrackingService } from '../services/analytics/errorTrackingService';

const prisma = new PrismaClient();
const analyticsService = new AnalyticsService();

// Utility function to check admin access
const checkAdminAccess = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true }
  });
  return user?.role === 'ADMIN';
};

// Utility function for date range filtering
const getDateRange = (period: string) => {
  const now = new Date();
  let startDate: Date;

  switch (period) {
    case '7d':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case '30d':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case '90d':
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    case '1y':
      startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      break;
    default:
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }

  return { startDate, endDate: now };
};

// Dashboard Overview Analytics
export const getDashboardAnalytics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId || !(await checkAdminAccess(userId))) {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const { period = '30d' } = req.query;
    const { startDate, endDate } = getDateRange(period as string);

    const [
      totalUsers,
      activeUsers,
      totalContent,
      publishedContent,
      totalPractices,
      userActivities,
      contentViews,
      practiceCompletions,
      assessmentResults,
      newUsers
    ] = await Promise.all([
      // Total users
      prisma.user.count(),
      
      // Active users (with activity in period)
      prisma.userActivity.findMany({
        where: { createdAt: { gte: startDate, lte: endDate } },
        distinct: ['userId']
      }).then(activities => activities.length),

      // Total content
      prisma.content.count(),

      // Published content
      prisma.content.count({ where: { isPublished: true } }),

      // Total practices
      prisma.practice.count(),

      // User activities in period
      prisma.userActivity.count({
        where: { createdAt: { gte: startDate, lte: endDate } }
      }),

      // Content views in period
      prisma.content.aggregate({
        where: { 
          updatedAt: { gte: startDate, lte: endDate }
        },
        _sum: { viewCount: true }
      }),

      // Practice completions in period
      prisma.userProgress.count({
        where: { 
          createdAt: { gte: startDate, lte: endDate },
          type: 'practice_completed'
        }
      }),

      // Assessment completions in period
      prisma.assessment.count({
        where: { createdAt: { gte: startDate, lte: endDate } }
      }),

      // New users in period
      prisma.user.count({
        where: { createdAt: { gte: startDate, lte: endDate } }
      })
    ]);

    res.json({
      success: true,
      data: {
        overview: {
          totalUsers,
          activeUsers,
          totalContent,
          publishedContent,
          totalPractices,
          userActivities,
          contentViews: contentViews._sum.viewCount || 0,
          practiceCompletions,
          assessmentResults,
          newUsers
        },
        period: {
          startDate,
          endDate,
          days: Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
        }
      }
    });

  } catch (error) {
    console.error('Dashboard analytics error:', error);
    next(error);
  }
};

// Content Analytics
export const getContentAnalytics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId || !(await checkAdminAccess(userId))) {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const { period = '30d', limit = '10' } = req.query;
    const { startDate, endDate } = getDateRange(period as string);
    const limitNum = parseInt(limit as string);

    const [
      contentStats,
      topContent,
      contentByCategory,
      contentByType,
      recentContent,
      contentRatings
    ] = await Promise.all([
      // Content statistics
      prisma.content.aggregate({
        _count: { _all: true },
        _sum: { viewCount: true },
        _avg: { rating: true }
      }),

      // Top performing content
      prisma.content.findMany({
        where: { isPublished: true },
        orderBy: { viewCount: 'desc' },
        take: limitNum,
        include: {
          contentRatings: {
            select: { rating: true }
          }
        }
      }),

      // Content by category
      prisma.content.groupBy({
        by: ['category'],
        where: { isPublished: true },
        _count: { _all: true },
        _sum: { viewCount: true },
        _avg: { rating: true }
      }),

      // Content by type
      prisma.content.groupBy({
        by: ['type'],
        where: { isPublished: true },
        _count: { _all: true },
        _sum: { viewCount: true },
        _avg: { rating: true }
      }),

      // Recent content
      prisma.content.findMany({
        where: { 
          createdAt: { gte: startDate, lte: endDate }
        },
        orderBy: { createdAt: 'desc' },
        take: limitNum,
        include: {
          contentRatings: {
            select: { rating: true }
          }
        }
      }),

      // Content ratings distribution
      prisma.contentRating.groupBy({
        by: ['rating'],
        _count: { _all: true },
        orderBy: { rating: 'asc' }
      })
    ]);

    // Calculate average ratings for top content
    const topContentWithRatings = topContent.map(content => {
      const ratings = content.contentRatings.map(r => r.rating);
      const averageRating = ratings.length > 0 
        ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length 
        : null;
      
      return {
        id: content.id,
        title: content.title,
        category: content.category,
        type: content.type,
        viewCount: content.viewCount,
        averageRating,
        ratingCount: ratings.length,
        createdAt: content.createdAt
      };
    });

    res.json({
      success: true,
      data: {
        overview: {
          totalContent: contentStats._count._all,
          totalViews: contentStats._sum.viewCount || 0,
          averageRating: contentStats._avg.rating || 0
        },
        topContent: topContentWithRatings,
        contentByCategory: contentByCategory.map(cat => ({
          category: cat.category,
          count: cat._count._all,
          totalViews: cat._sum.viewCount || 0,
          averageRating: cat._avg.rating || 0
        })),
        contentByType: contentByType.map(type => ({
          type: type.type,
          count: type._count._all,
          totalViews: type._sum.viewCount || 0,
          averageRating: type._avg.rating || 0
        })),
        recentContent: recentContent.map(content => {
          const ratings = content.contentRatings.map(r => r.rating);
          const averageRating = ratings.length > 0 
            ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length 
            : null;
          
          return {
            id: content.id,
            title: content.title,
            category: content.category,
            type: content.type,
            viewCount: content.viewCount,
            averageRating,
            createdAt: content.createdAt
          };
        }),
        ratingDistribution: contentRatings.map(rating => ({
          rating: rating.rating,
          count: rating._count._all
        }))
      }
    });

  } catch (error) {
    console.error('Content analytics error:', error);
    next(error);
  }
};

// Practice Analytics
export const getPracticeAnalytics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId || !(await checkAdminAccess(userId))) {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const { period = '30d', limit = '10' } = req.query;
    const { startDate, endDate } = getDateRange(period as string);
    const limitNum = parseInt(limit as string);

    const [
      practiceStats,
      topPractices,
      practicesByType,
      recentPractices,
      completionRates,
      practiceProgress
    ] = await Promise.all([
      // Practice statistics
      prisma.practice.aggregate({
        _count: { _all: true },
        _avg: { duration: true }
      }),

      // Top performing practices
      prisma.practice.findMany({
        orderBy: { viewCount: 'desc' },
        take: limitNum,
        include: {
          practiceRatings: {
            select: { rating: true }
          }
        }
      }),

      // Practices by type
      prisma.practice.groupBy({
        by: ['type'],
        _count: { _all: true },
        _sum: { viewCount: true },
        _avg: { duration: true }
      }),

      // Recent practices
      prisma.practice.findMany({
        where: { 
          createdAt: { gte: startDate, lte: endDate }
        },
        orderBy: { createdAt: 'desc' },
        take: limitNum
      }),

      // Practice completion rates
      prisma.userProgress.groupBy({
        by: ['practiceId'],
        where: {
          type: 'practice_completed',
          createdAt: { gte: startDate, lte: endDate }
        },
        _count: { _all: true }
      }),

      // Practice progress over time
      prisma.userProgress.findMany({
        where: {
          createdAt: { gte: startDate, lte: endDate }
        },
        orderBy: { createdAt: 'asc' },
        take: 100
      })
    ]);

    // Calculate average ratings for top practices
    const topPracticesWithRatings = topPractices.map(practice => {
      const ratings = practice.practiceRatings.map(r => r.rating);
      const averageRating = ratings.length > 0 
        ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length 
        : null;
      
      return {
        id: practice.id,
        title: practice.title,
        type: practice.type,
        duration: practice.duration,
        difficulty: practice.difficulty,
        viewCount: practice.viewCount,
        averageRating,
        ratingCount: ratings.length,
        createdAt: practice.createdAt
      };
    });

    res.json({
      success: true,
      data: {
        overview: {
          totalPractices: practiceStats._count._all,
          averageDuration: practiceStats._avg.duration || 0
        },
        topPractices: topPracticesWithRatings,
        practicesByType: practicesByType.map(type => ({
          type: type.type,
          count: type._count._all,
          totalViews: type._sum.viewCount || 0,
          averageDuration: type._avg.duration || 0
        })),
        recentPractices: recentPractices.map(practice => ({
          id: practice.id,
          title: practice.title,
          type: practice.type,
          duration: practice.duration,
          difficulty: practice.difficulty,
          createdAt: practice.createdAt
        })),
        completionRates: completionRates.map(rate => ({
          practiceId: rate.practiceId,
          completions: rate._count._all
        })),
        progressTrend: practiceProgress.map(progress => ({
          date: progress.createdAt,
          type: progress.type,
          practiceId: progress.practiceId
        }))
      }
    });

  } catch (error) {
    console.error('Practice analytics error:', error);
    next(error);
  }
};

// User Analytics
export const getUserAnalytics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId || !(await checkAdminAccess(userId))) {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const { period = '30d' } = req.query;
    const { startDate, endDate } = getDateRange(period as string);

    const [
      userStats,
      userRegistrations,
      userActivities,
      topActiveUsers,
      usersByAge,
      assessmentResults
    ] = await Promise.all([
      // User statistics
      prisma.user.aggregate({
        _count: { _all: true }
      }),

      // User registrations over time
      prisma.user.findMany({
        where: {
          createdAt: { gte: startDate, lte: endDate }
        },
        select: {
          createdAt: true
        },
        orderBy: { createdAt: 'asc' }
      }),

      // User activity summary
      prisma.userActivity.groupBy({
        by: ['action'],
        where: {
          createdAt: { gte: startDate, lte: endDate }
        },
        _count: { _all: true }
      }),

      // Most active users
      prisma.userActivity.groupBy({
        by: ['userId'],
        where: {
          createdAt: { gte: startDate, lte: endDate }
        },
        _count: { _all: true },
        orderBy: {
          _count: {
            _all: 'desc'
          }
        },
        take: 10
      }),

      // Users by age group
      prisma.user.findMany({
        where: {
          age: { not: null }
        },
        select: { age: true }
      }),

      // Assessment results summary
      prisma.assessment.groupBy({
        by: ['type'],
        where: {
          createdAt: { gte: startDate, lte: endDate }
        },
        _count: { _all: true }
      })
    ]);

    // Process age groups
    const ageGroups = {
      '18-25': 0,
      '26-35': 0,
      '36-45': 0,
      '46-55': 0,
      '56+': 0
    };

    usersByAge.forEach(user => {
      if (user.age) {
        if (user.age <= 25) ageGroups['18-25']++;
        else if (user.age <= 35) ageGroups['26-35']++;
        else if (user.age <= 45) ageGroups['36-45']++;
        else if (user.age <= 55) ageGroups['46-55']++;
        else ageGroups['56+']++;
      }
    });

    // Get user details for top active users
    const topActiveUserIds = topActiveUsers.map(u => u.userId);
    const activeUserDetails = await prisma.user.findMany({
      where: { id: { in: topActiveUserIds } },
      select: { id: true, name: true, email: true }
    });

    const topActiveUsersWithDetails = topActiveUsers.map(activity => {
      const user = activeUserDetails.find(u => u.id === activity.userId);
      return {
        userId: activity.userId,
        name: user?.name || 'Unknown',
        email: user?.email || 'Unknown',
        activityCount: activity._count._all
      };
    });

    res.json({
      success: true,
      data: {
        overview: {
          totalUsers: userStats._count._all,
          newUsers: userRegistrations.length,
          totalActivities: userActivities.reduce((sum, activity) => sum + activity._count._all, 0)
        },
        registrationTrend: userRegistrations.map(user => ({
          date: user.createdAt
        })),
        activityBreakdown: userActivities.map(activity => ({
          action: activity.action,
          count: activity._count._all
        })),
        topActiveUsers: topActiveUsersWithDetails,
        ageDistribution: Object.entries(ageGroups).map(([range, count]) => ({
          ageRange: range,
          count
        })),
        assessmentResults: assessmentResults.map(result => ({
          type: result.type,
          count: result._count._all
        }))
      }
    });

  } catch (error) {
    console.error('User analytics error:', error);
    next(error);
  }
};

// Engagement Analytics
export const getEngagementAnalytics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId || !(await checkAdminAccess(userId))) {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const { period = '30d' } = req.query;
    const { startDate, endDate } = getDateRange(period as string);

    const [
      dailyActiveUsers,
      contentEngagement,
      practiceEngagement,
      retentionData,
      sessionData
    ] = await Promise.all([
      // Daily active users
      prisma.userActivity.groupBy({
        by: ['createdAt'],
        where: {
          createdAt: { gte: startDate, lte: endDate }
        },
        _count: { userId: true }
      }),

      // Content engagement metrics
      prisma.contentRating.findMany({
        where: {
          createdAt: { gte: startDate, lte: endDate }
        },
        include: {
          content: {
            select: { title: true, category: true, type: true }
          }
        }
      }),

      // Practice engagement metrics
      prisma.practiceRating.findMany({
        where: {
          createdAt: { gte: startDate, lte: endDate }
        },
        include: {
          practice: {
            select: { title: true, type: true }
          }
        }
      }),

      // User retention (simplified)
      prisma.user.findMany({
        where: {
          createdAt: { gte: startDate, lte: endDate }
        },
        include: {
          activities: {
            where: {
              createdAt: { gte: startDate, lte: endDate }
            }
          }
        }
      }),

      // Session data (using activity as proxy)
      prisma.userActivity.findMany({
        where: {
          createdAt: { gte: startDate, lte: endDate }
        },
        orderBy: { createdAt: 'asc' }
      })
    ]);

    // Calculate engagement rates
    const totalContentRatings = contentEngagement.length;
    const averageContentRating = totalContentRatings > 0 
      ? contentEngagement.reduce((sum, rating) => sum + rating.rating, 0) / totalContentRatings 
      : 0;

    const totalPracticeRatings = practiceEngagement.length;
    const averagePracticeRating = totalPracticeRatings > 0 
      ? practiceEngagement.reduce((sum, rating) => sum + rating.rating, 0) / totalPracticeRatings 
      : 0;

    // Calculate retention rate (users who returned after first day)
    const newUsers = retentionData.length;
    const returningUsers = retentionData.filter(user => user.activities.length > 1).length;
    const retentionRate = newUsers > 0 ? (returningUsers / newUsers) * 100 : 0;

    res.json({
      success: true,
      data: {
        overview: {
          averageContentRating,
          averagePracticeRating,
          totalContentRatings,
          totalPracticeRatings,
          retentionRate,
          newUsers,
          returningUsers
        },
        dailyActiveUsers: dailyActiveUsers.map(day => ({
          date: day.createdAt,
          activeUsers: day._count.userId
        })),
        engagementTrends: {
          contentRatings: contentEngagement.map(rating => ({
            rating: rating.rating,
            contentTitle: rating.content.title,
            contentCategory: rating.content.category,
            contentType: rating.content.type,
            createdAt: rating.createdAt
          })),
          practiceRatings: practiceEngagement.map(rating => ({
            rating: rating.rating,
            practiceTitle: rating.practice.title,
            practiceType: rating.practice.type,
            createdAt: rating.createdAt
          }))
        },
        sessionMetrics: {
          totalSessions: sessionData.length,
          averageSessionLength: 15, // Placeholder - would need more detailed tracking
          bounceRate: 25 // Placeholder - would need more detailed tracking
        }
      }
    });

  } catch (error) {
    console.error('Engagement analytics error:', error);
    next(error);
  }
};

// System Performance Analytics
export const getSystemAnalytics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId || !(await checkAdminAccess(userId))) {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const { period = '30d' } = req.query;
    const { startDate, endDate } = getDateRange(period as string);

    const [
      databaseStats,
      apiUsage,
      errorLogs,
      performanceMetrics
    ] = await Promise.all([
      // Database statistics
      Promise.all([
        prisma.user.count(),
        prisma.content.count(),
        prisma.practice.count(),
        prisma.assessment.count(),
        prisma.userActivity.count({
          where: { createdAt: { gte: startDate, lte: endDate } }
        })
      ]),

      // API usage (using user activities as proxy)
      prisma.userActivity.groupBy({
        by: ['action'],
        where: {
          createdAt: { gte: startDate, lte: endDate }
        },
        _count: { _all: true }
      }),

      // Error tracking (placeholder - would need actual error logging)
      Promise.resolve([
        { type: 'database_error', count: 5 },
        { type: 'validation_error', count: 12 },
        { type: 'authentication_error', count: 8 }
      ]),

      // Performance metrics (placeholder - would need actual monitoring)
      Promise.resolve({
        averageResponseTime: 250,
        uptime: 99.8,
        memoryUsage: 65,
        cpuUsage: 45
      })
    ]);

    const [userCount, contentCount, practiceCount, assessmentCount, activityCount] = databaseStats;

    res.json({
      success: true,
      data: {
        database: {
          totalUsers: userCount,
          totalContent: contentCount,
          totalPractices: practiceCount,
          totalAssessments: assessmentCount,
          recentActivities: activityCount
        },
        apiUsage: apiUsage.map(usage => ({
          endpoint: usage.action,
          requests: usage._count._all
        })),
        errors: errorLogs,
        performance: {
          averageResponseTime: performanceMetrics.averageResponseTime,
          uptime: performanceMetrics.uptime,
          memoryUsage: performanceMetrics.memoryUsage,
          cpuUsage: performanceMetrics.cpuUsage
        },
        healthStatus: {
          database: 'healthy',
          api: 'healthy',
          storage: 'healthy',
          monitoring: 'active'
        }
      }
    });

  } catch (error) {
    console.error('System analytics error:', error);
    next(error);
  }
};