import express from 'express';
import { authenticate } from '../middleware/auth';
import {
  getCrisisResources,
  createOrUpdateSafetyPlan,
  getSafetyPlan,
  deleteSafetyPlan
} from '../controllers/crisisController';

const router = express.Router();

// Public route for crisis resources (no authentication required)
router.get('/resources', getCrisisResources);

// Protected routes for safety plans
router.post('/safety-plan', authenticate, createOrUpdateSafetyPlan);
router.get('/safety-plan', authenticate, getSafetyPlan);
router.delete('/safety-plan', authenticate, deleteSafetyPlan);

export default router;
