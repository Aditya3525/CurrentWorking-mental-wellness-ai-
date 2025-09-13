import express from 'express';
import passport from '../config/passport';
import { register, login, getCurrentUser, googleAuthSuccess, googleAuthFailure, validateToken, setupPassword, updateProfile, logout } from '../controllers/authController';
import { authenticate, authenticateRefresh, requirePassword } from '../middleware/auth';

const router = express.Router();

// Traditional email/password routes
router.post('/register', register);
router.post('/login', login);

// Token management routes
router.post('/refresh', authenticateRefresh);
router.post('/validate', validateToken);

// Google OAuth routes
router.get('/google', 
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: '/api/auth/google/failure' }),
  googleAuthSuccess
);

router.get('/google/failure', googleAuthFailure);

// Protected routes
router.get('/me', authenticate as any, getCurrentUser);
router.post('/setup-password', authenticate as any, setupPassword);
router.put('/profile', authenticate as any, requirePassword as any, updateProfile);
router.post('/logout', authenticate as any, logout);

export default router;
