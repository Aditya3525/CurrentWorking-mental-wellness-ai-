import express from 'express';
import { authenticate } from '../middleware/auth';
import { updateProfile, completeOnboarding, logMood, getMoodHistory } from '../controllers/userController';

const router = express.Router();

// All routes require authentication
router.use(authenticate as any);

// User profile routes
router.put('/:userId', updateProfile as any);
router.post('/complete-onboarding', completeOnboarding as any);

// Mood tracking routes
router.post('/mood', logMood as any);
router.get('/mood-history', getMoodHistory as any);

export default router;
