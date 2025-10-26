import express from 'express';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { logMoodSchema, getMoodHistorySchema } from '../api/validators/mood.validator';
import { getUserProfile, updateProfile, completeOnboarding, logMood, getMoodHistory } from '../controllers/userController';

const router = express.Router();

// All routes require authentication
router.use(authenticate as any);

// Non-id routes must be declared before parameterized routes to avoid route collisions
router.post('/complete-onboarding', completeOnboarding as any);

// Mood tracking routes
router.post('/mood', validate(logMoodSchema), logMood as any);
router.get('/mood-history', validate(getMoodHistorySchema), getMoodHistory as any);

// User profile routes
router.get('/:userId', getUserProfile as any);
router.put('/:userId', updateProfile as any);

export default router;
