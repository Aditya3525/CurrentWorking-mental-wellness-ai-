import express from 'express';
import { authenticate } from '../middleware/auth';
import { trackProgress, getProgressHistory } from '../controllers/progressController';

const router = express.Router();

router.use(authenticate as any);
router.post('/', trackProgress as any);
router.get('/', getProgressHistory as any);

export default router;
