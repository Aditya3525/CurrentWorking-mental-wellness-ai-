import express from 'express';
import { authenticate } from '../middleware/auth';
import { listAssessments, submitAssessment, getAssessmentHistory } from '../controllers/assessmentsController';

const router = express.Router();

router.use(authenticate as any);
router.get('/', listAssessments as any);
router.post('/', submitAssessment as any);
router.get('/history', getAssessmentHistory as any);

export default router;
