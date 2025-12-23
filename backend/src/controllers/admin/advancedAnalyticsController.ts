import { Request, Response } from 'express';
import { advancedAnalyticsService } from '../../services/advancedAnalyticsService';

interface AnalyticsTimeframe {
  startDate: Date;
  endDate: Date;
}

const getTimeframeHELPER = (timeframe: string): AnalyticsTimeframe => {
  const timeframes: Record<string, AnalyticsTimeframe> = {
    '7d': {
      startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      endDate: new Date()
    },
    '30d': {
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      endDate: new Date()
    },
    '90d': {
      startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
      endDate: new Date()
    },
    'all': {
      startDate: new Date(2020, 0, 1),
      endDate: new Date()
    }
  };

  return timeframes[timeframe] || timeframes['30d'];
};

/**
 * GET /api/admin/analytics/ai-performance
 * Get AI provider performance metrics
 */
export const getAIPerformanceAnalytics = async (req: Request, res: Response) => {
  try {
    const { timeframe = '30d' } = req.query;
    const { startDate, endDate } = getTimeframeHELPER(timeframe as string);

    const aiAnalytics = await advancedAnalyticsService.getAIProviderAnalytics(
      startDate,
      endDate
    );

    res.json({
      success: true,
      data: aiAnalytics
    });
  } catch (error) {
    console.error('Error fetching AI performance analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch AI performance analytics'
    });
  }
};

/**
 * GET /api/admin/analytics/crisis-detection
 * Get crisis detection metrics
 */
export const getCrisisDetectionAnalytics = async (req: Request, res: Response) => {
  try {
    const { timeframe = '30d' } = req.query;
    const { startDate, endDate } = getTimeframeHELPER(timeframe as string);

    const crisisAnalytics = await advancedAnalyticsService.getCrisisAnalytics(
      startDate,
      endDate
    );

    res.json({
      success: true,
      data: crisisAnalytics
    });
  } catch (error) {
    console.error('Error fetching crisis detection analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch crisis detection analytics'
    });
  }
};

/**
 * GET /api/admin/analytics/system-health
 * Get system health metrics
 */
export const getSystemHealthAnalytics = async (req: Request, res: Response) => {
  try {
    const { timeframe = '30d' } = req.query;
    const { startDate, endDate } = getTimeframeHELPER(timeframe as string);

    const healthAnalytics = await advancedAnalyticsService.getSystemHealthAnalytics(
      startDate,
      endDate
    );

    res.json({
      success: true,
      data: healthAnalytics
    });
  } catch (error) {
    console.error('Error fetching system health analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch system health analytics'
    });
  }
};

/**
 * GET /api/admin/analytics/user-engagement
 * Get user engagement metrics
 */
export const getUserEngagementAnalytics = async (req: Request, res: Response) => {
  try {
    const { timeframe = '30d' } = req.query;
    const { startDate, endDate } = getTimeframeHELPER(timeframe as string);

    const engagementAnalytics = await advancedAnalyticsService.getUserEngagementAnalytics(
      startDate,
      endDate
    );

    res.json({
      success: true,
      data: engagementAnalytics
    });
  } catch (error) {
    console.error('Error fetching user engagement analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user engagement analytics'
    });
  }
};

/**
 * GET /api/admin/analytics/wellness-impact
 * Get wellness impact metrics
 */
export const getWellnessImpactAnalytics = async (req: Request, res: Response) => {
  try {
    const { timeframe = '30d' } = req.query;
    const { startDate, endDate } = getTimeframeHELPER(timeframe as string);

    const impactAnalytics = await advancedAnalyticsService.getWellnessImpactMetrics(
      startDate,
      endDate
    );

    res.json({
      success: true,
      data: impactAnalytics
    });
  } catch (error) {
    console.error('Error fetching wellness impact analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch wellness impact analytics'
    });
  }
};

/**
 * GET /api/admin/analytics/comprehensive
 * Get all analytics in one comprehensive response
 */
export const getComprehensiveAnalytics = async (req: Request, res: Response) => {
  try {
    const { timeframe = '30d' } = req.query;
    const { startDate, endDate } = getTimeframeHELPER(timeframe as string);

    const [
      aiAnalytics,
      crisisAnalytics,
      healthAnalytics,
      engagementAnalytics,
      impactAnalytics
    ] = await Promise.all([
      advancedAnalyticsService.getAIProviderAnalytics(startDate, endDate),
      advancedAnalyticsService.getCrisisAnalytics(startDate, endDate),
      advancedAnalyticsService.getSystemHealthAnalytics(startDate, endDate),
      advancedAnalyticsService.getUserEngagementAnalytics(startDate, endDate),
      advancedAnalyticsService.getWellnessImpactMetrics(startDate, endDate)
    ]);

    res.json({
      success: true,
      data: {
        aiPerformance: aiAnalytics,
        crisisDetection: crisisAnalytics,
        systemHealth: healthAnalytics,
        userEngagement: engagementAnalytics,
        wellnessImpact: impactAnalytics,
        timeframe: {
          type: timeframe,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        }
      }
    });
  } catch (error) {
    console.error('Error fetching comprehensive analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch comprehensive analytics'
    });
  }
};
