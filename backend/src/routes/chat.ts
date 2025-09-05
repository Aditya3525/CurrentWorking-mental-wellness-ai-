import express from 'express';
import { authenticate } from '../middleware/auth';
import { sendMessage, getChatHistory } from '../controllers/chatController';

const router = express.Router();

router.use(authenticate as any);
router.post('/message', sendMessage as any);
router.get('/history', getChatHistory as any);

export default router;
