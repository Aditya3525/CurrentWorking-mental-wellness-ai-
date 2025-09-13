import express from 'express';
import { authenticate, requirePassword } from '../middleware/auth';
import { sendMessage, getChatHistory, getChatInsights, getAIHealthCheck, testAIProviders } from '../controllers/chatController';

const router = express.Router();

router.use(authenticate as any);
router.use(requirePassword as any);
router.post('/message', sendMessage as any);
router.get('/history', getChatHistory as any);
router.get('/insights', getChatInsights as any);
router.get('/ai/health', getAIHealthCheck as any);
router.get('/ai/test', testAIProviders as any);

export default router;
