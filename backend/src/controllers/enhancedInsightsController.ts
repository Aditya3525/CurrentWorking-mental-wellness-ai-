import { Response } from 'express';
import { PredictiveMentalHealthService } from '../services/predictiveMentalHealthService';
import { ContentRecommendationService } from '../services/contentRecommendationService';
import { AssessmentVersionService } from '../services/assessmentVersionService';
import { AIContextService } from '../services/aiContextService';
import { EnhancedAuditService } from '../services/auditServiceEnhanced';

// Enhanced Insights Controller with new features
export class EnhancedInsightsController {
  /**
   * Get predictive mental health analysis
   */
  static async getPredictiveAnalysis(req: any, res: Response) {
    try {
      const { assessmentType } = req.params;
      const userId = req.user.id;

      if (!assessmentType) {
        res.status(400).json({
          success: false,
          error: 'Assessment type is required'
        });
        return;
      }

      const analysis = await PredictiveMentalHealthService.generatePredictiveAnalysis(
        userId, 
        assessmentType
      );

      // Log this activity
      await EnhancedAuditService.logUserActivity({
        userId,
        action: 'predictive_analysis_requested',
        details: { assessmentType },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });

      res.json({
        success: true,
        data: { analysis }
      });
    } catch (error) {
      console.error('Predictive analysis error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate predictive analysis'
      });
    }
  }

  /**
   * Get mental health trends across all metrics
   */
  static async getMentalHealthTrends(req: any, res: Response) {
    try {
      const userId = req.user.id;

      const trends = await PredictiveMentalHealthService.analyzeMentalHealthTrends(userId);

      res.json({
        success: true,
        data: { trends }
      });
    } catch (error) {
      console.error('Mental health trends error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to analyze mental health trends'
      });
    }
  }

  /**
   * Get crisis risk assessment
   */
  static async getCrisisRiskAssessment(req: any, res: Response) {
    try {
      const userId = req.user.id;

      const riskAssessment = await PredictiveMentalHealthService.assessCrisisRisk(userId);

      // Log high-risk assessments for monitoring
      if (riskAssessment.riskLevel === 'high' || riskAssessment.riskLevel === 'critical') {
        await EnhancedAuditService.logUserActivity({
          userId,
          action: 'high_risk_detected',
          details: { 
            riskLevel: riskAssessment.riskLevel,
            riskScore: riskAssessment.score,
            factors: riskAssessment.factors
          },
          ipAddress: req.ip,
          userAgent: req.headers['user-agent']
        });
      }

      res.json({
        success: true,
        data: { riskAssessment }
      });
    } catch (error) {
      console.error('Crisis risk assessment error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to assess crisis risk'
      });
    }
  }

  /**
   * Get personalized content recommendations
   */
  static async getContentRecommendations(req: any, res: Response) {
    try {
      const userId = req.user.id;
      const { 
        types, 
        categories, 
        limit = 10, 
        approach, 
        difficulty 
      } = req.query;

      const recommendations = await ContentRecommendationService.generateRecommendations({
        userId,
        contentTypes: types ? (types as string).split(',') : undefined,
        categories: categories ? (categories as string).split(',') : undefined,
        maxRecommendations: parseInt(limit as string),
        approach: approach as string,
        difficulty: difficulty as string
      });

      res.json({
        success: true,
        data: { recommendations }
      });
    } catch (error) {
      console.error('Content recommendations error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate content recommendations'
      });
    }
  }

  /**
   * Get content recommendations by category
   */
  static async getRecommendationsByCategory(req: any, res: Response) {
    try {
      const userId = req.user.id;
      const { category } = req.params;
      const { limit = 5 } = req.query;

      const recommendations = await ContentRecommendationService.getRecommendationsByCategory(
        userId,
        category,
        parseInt(limit as string)
      );

      res.json({
        success: true,
        data: { recommendations }
      });
    } catch (error) {
      console.error('Category recommendations error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get category recommendations'
      });
    }
  }

  /**
   * Get mood-based content recommendations
   */
  static async getMoodBasedRecommendations(req: any, res: Response) {
    try {
      const userId = req.user.id;
      const { mood } = req.params;
      const { limit = 3 } = req.query;

      const recommendations = await ContentRecommendationService.getMoodBasedRecommendations(
        userId,
        mood,
        parseInt(limit as string)
      );

      res.json({
        success: true,
        data: { recommendations }
      });
    } catch (error) {
      console.error('Mood-based recommendations error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get mood-based recommendations'
      });
    }
  }

  /**
   * Update content engagement
   */
  static async updateContentEngagement(req: any, res: Response) {
    try {
      const userId = req.user.id;
      const { contentId } = req.params;
      const { action, value } = req.body;

      if (!['viewed', 'completed', 'rated'].includes(action)) {
        res.status(400).json({
          success: false,
          error: 'Invalid action. Must be viewed, completed, or rated'
        });
        return;
      }

      await ContentRecommendationService.updateEngagementMetrics(
        userId,
        contentId,
        action,
        value
      );

      // Log engagement for analytics
      await EnhancedAuditService.logUserActivity({
        userId,
        action: `content_${action}`,
        details: { contentId, value },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });

      res.json({
        success: true,
        data: { message: 'Engagement updated successfully' }
      });
    } catch (error) {
      console.error('Content engagement error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update content engagement'
      });
    }
  }

  /**
   * Get assessment version history
   */
  static async getAssessmentVersionHistory(req: any, res: Response) {
    try {
      const { assessmentId } = req.params;
      const userId = req.user.id;

      const history = await AssessmentVersionService.getVersionHistory(assessmentId);

      // Verify user owns this assessment
      if (history.length > 0 && history[0].userId !== userId) {
        res.status(403).json({
          success: false,
          error: 'Access denied'
        });
        return;
      }

      res.json({
        success: true,
        data: { history }
      });
    } catch (error) {
      console.error('Assessment version history error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get assessment version history'
      });
    }
  }

  /**
   * Compare assessment versions
   */
  static async compareAssessmentVersions(req: any, res: Response) {
    try {
      const { assessmentId1, assessmentId2 } = req.params;

      const comparison = await AssessmentVersionService.compareVersions(
        assessmentId1,
        assessmentId2
      );

      res.json({
        success: true,
        data: { comparison }
      });
    } catch (error) {
      console.error('Assessment comparison error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to compare assessment versions'
      });
    }
  }

  /**
   * Get assessment progression analysis
   */
  static async getProgressionAnalysis(req: any, res: Response) {
    try {
      const userId = req.user.id;
      const { assessmentType } = req.params;

      const analysis = await AssessmentVersionService.getProgressionAnalysis(
        userId,
        assessmentType
      );

      res.json({
        success: true,
        data: { analysis }
      });
    } catch (error) {
      console.error('Progression analysis error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get progression analysis'
      });
    }
  }

  /**
   * Build AI chat context
   */
  static async buildChatContext(req: any, res: Response) {
    try {
      const userId = req.user.id;
      const { sessionId } = req.query;

      const context = await AIContextService.buildChatContext(
        userId,
        sessionId as string
      );

      // Optimize for token limits
      const optimizedContext = AIContextService.optimizeContextForTokens(context);

      res.json({
        success: true,
        data: { 
          context: optimizedContext.context,
          metadata: {
            estimatedTokens: optimizedContext.estimatedTokens,
            compressionRatio: optimizedContext.compressionRatio
          }
        }
      });
    } catch (error) {
      console.error('Chat context build error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to build chat context'
      });
    }
  }

  /**
   * Get user audit trail
   */
  static async getUserAuditTrail(req: any, res: Response) {
    try {
      const userId = req.user.id;
      const { days = 30, actions } = req.query;

      const auditTrail = await EnhancedAuditService.getUserAuditTrail(
        userId,
        parseInt(days as string),
        actions ? (actions as string).split(',') : undefined
      );

      res.json({
        success: true,
        data: { auditTrail }
      });
    } catch (error) {
      console.error('Audit trail error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get audit trail'
      });
    }
  }

  /**
   * Detect suspicious activity
   */
  static async detectSuspiciousActivity(req: any, res: Response) {
    try {
      const userId = req.user.id;

      const suspicious = await EnhancedAuditService.detectSuspiciousActivity(userId);

      res.json({
        success: true,
        data: { suspicious }
      });
    } catch (error) {
      console.error('Suspicious activity detection error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to detect suspicious activity'
      });
    }
  }
}
