import express from 'express';
import { authenticate } from '../middleware/auth';
import { listAssessments, submitAssessment, getAssessmentHistory, getAssessmentQuestions, getAssessmentSummary, getAssessmentTrends } from '../controllers/assessmentsController';

const router = express.Router();

router.use(authenticate as any);
router.get('/', listAssessments as any);
router.post('/', submitAssessment as any);
router.get('/history', getAssessmentHistory as any);
router.get('/summary', getAssessmentSummary as any);
router.get('/trends', getAssessmentTrends as any);
router.get('/:type/questions', getAssessmentQuestions as any);

export default router;
