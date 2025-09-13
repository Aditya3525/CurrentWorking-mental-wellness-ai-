import { Router } from 'express';
import { authenticate, requirePassword } from '../middleware/auth';
import { EnhancedInsightsController } from '../controllers/enhancedInsightsController';

const router = Router();

// All routes require authentication and password
router.use(authenticate as any);
router.use(requirePassword as any);

// Predictive Analytics Endpoints
router.get('/predictive/:assessmentType', EnhancedInsightsController.getPredictiveAnalysis as any);
router.get('/trends', EnhancedInsightsController.getMentalHealthTrends as any);
router.get('/crisis-risk', EnhancedInsightsController.getCrisisRiskAssessment as any);

// Content Recommendation Endpoints
router.get('/recommendations', EnhancedInsightsController.getContentRecommendations as any);
router.get('/recommendations/category/:category', EnhancedInsightsController.getRecommendationsByCategory as any);
router.get('/recommendations/mood/:mood', EnhancedInsightsController.getMoodBasedRecommendations as any);
router.post('/content/:contentId/engagement', EnhancedInsightsController.updateContentEngagement as any);

// Assessment Versioning Endpoints
router.get('/assessment/:assessmentId/versions', EnhancedInsightsController.getAssessmentVersionHistory as any);
router.get('/assessment/compare/:assessmentId1/:assessmentId2', EnhancedInsightsController.compareAssessmentVersions as any);
router.get('/assessment/progression/:assessmentType', EnhancedInsightsController.getProgressionAnalysis as any);

// AI Context Management Endpoints
router.get('/ai/context', EnhancedInsightsController.buildChatContext as any);

// Audit and Security Endpoints
router.get('/audit/trail', EnhancedInsightsController.getUserAuditTrail as any);
router.get('/audit/suspicious', EnhancedInsightsController.detectSuspiciousActivity as any);

export default router;
