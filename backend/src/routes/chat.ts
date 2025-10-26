import express from 'express';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { sendMessageSchema, getChatHistorySchema } from '../api/validators/chat.validator';
import { 
  sendMessage, 
  getChatHistory, 
  getChatInsights, 
  getAIHealthCheck, 
  testAIProviders,
  getConversationMemory,
  getConversationSummary,
  getConversationStarters,
  getProactiveCheckIn,
  getMoodBasedGreeting,
  getExerciseRecommendations
} from '../controllers/chatController';

const router = express.Router();

router.use(authenticate as any);
router.post('/message', validate(sendMessageSchema), sendMessage as any);
router.get('/history', validate(getChatHistorySchema), getChatHistory as any);
router.get('/insights', getChatInsights as any);
router.get('/ai/health', getAIHealthCheck as any);
router.get('/ai/test', testAIProviders as any);
router.get('/memory/:userId', getConversationMemory as any);
router.get('/summary/:userId', getConversationSummary as any);
router.get('/starters', getConversationStarters as any);
router.get('/check-in', getProactiveCheckIn as any);
router.get('/greeting', getMoodBasedGreeting as any);
router.post('/exercises', getExerciseRecommendations as any);

export default router;
