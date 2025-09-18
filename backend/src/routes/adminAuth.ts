import express from 'express';
import {
  adminLogin,
  adminLogout,
  getAdminProfile,
  refreshAdminToken,
  getActiveSessions,
  revokeAdminSession,
  adminLoginLimiter
} from '../controllers/adminAuthController';
import {
  requestPasswordReset,
  resetPassword,
  changePassword,
  getPasswordResetInfo
} from '../controllers/adminPasswordController';
import { requireAdmin, requireSuperAdmin, logAdminAction } from '../middleware/requireAdmin';

const router = express.Router();

// Admin Authentication Routes
router.post('/login', adminLoginLimiter, adminLogin);
router.post('/logout', adminLogout);
router.post('/refresh', refreshAdminToken);

// Admin Password Management Routes
router.post('/request-reset', adminLoginLimiter, requestPasswordReset);
router.post('/reset-password', resetPassword);
router.post('/change-password', requireAdmin, logAdminAction('CHANGE_PASSWORD'), changePassword);

// Admin Profile Routes (protected)
router.get('/profile', requireAdmin, getAdminProfile);

// Admin Session Management (protected)
router.get('/sessions', requireAdmin, logAdminAction('VIEW_ADMIN_SESSIONS'), getActiveSessions);
router.delete('/sessions/:sessionId', requireSuperAdmin, logAdminAction('REVOKE_ADMIN_SESSION'), revokeAdminSession);

// Development only - password reset debugging
if (process.env.NODE_ENV === 'development') {
  router.get('/reset-info', getPasswordResetInfo);
}

// Health check for admin routes
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Admin auth routes are healthy',
    timestamp: new Date().toISOString()
  });
});

export default router;