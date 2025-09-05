import express from 'express';
import { authenticate } from '../middleware/auth';
import { getPersonalizedPlan, updateModuleProgress, completeModule } from '../controllers/plansController';

const router = express.Router();

router.use(authenticate as any);
router.get('/personalized', getPersonalizedPlan as any);
router.put('/modules/:moduleId/progress', updateModuleProgress as any);
router.post('/modules/:moduleId/complete', completeModule as any);

export default router;
