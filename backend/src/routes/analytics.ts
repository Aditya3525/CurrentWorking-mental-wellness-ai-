import express from 'express';
import { authenticate } from '../middleware/auth';
import {
  getDashboardAnalytics,
  getContentAnalytics,
  getPracticeAnalytics,
  getUserAnalytics,
  getEngagementAnalytics,
  getSystemAnalytics
} from '../controllers/analyticsController';

const router = express.Router();

// Apply authentication to all analytics routes
router.use(authenticate as any);

// Dashboard overview analytics
router.get('/dashboard', getDashboardAnalytics as any);

// Content analytics
router.get('/content', getContentAnalytics as any);

// Practice analytics
router.get('/practices', getPracticeAnalytics as any);

// User analytics
router.get('/users', getUserAnalytics as any);

// Engagement analytics
router.get('/engagement', getEngagementAnalytics as any);

// System performance analytics
router.get('/system', getSystemAnalytics as any);

export default router;