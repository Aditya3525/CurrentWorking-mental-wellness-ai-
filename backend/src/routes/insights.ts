import { Router } from 'express';
import { authenticate, requirePassword } from '../middleware/auth';
import { generateAssessmentInsights, getMentalHealthSummary } from '../controllers/insightsController';

const router = Router();

router.use(authenticate as any);
router.use(requirePassword as any);

// Generate AI insights for a completed assessment
router.post('/assessment', generateAssessmentInsights as any);

// Get comprehensive mental health summary based on all assessments
router.get('/mental-health-summary', getMentalHealthSummary as any);

export default router;
