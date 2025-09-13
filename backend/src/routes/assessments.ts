import express from 'express';
import { authenticate, requirePassword } from '../middleware/auth';
import { listAssessments, submitAssessment, getAssessmentHistory, getLatestAssessment } from '../controllers/assessmentsController';

const router = express.Router();

router.use(authenticate as any);
router.use(requirePassword as any);
router.get('/', listAssessments as any);
router.post('/', submitAssessment as any);
router.get('/history', getAssessmentHistory as any);
router.get('/latest', getLatestAssessment as any);

export default router;
