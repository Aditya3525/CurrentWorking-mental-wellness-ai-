import express from 'express';
import passport from '../config/passport';
import { register, login, getCurrentUser, googleAuthSuccess, googleAuthFailure, validateToken, setupPassword, updateProfile, logout } from '../controllers/authController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// Health: is Google OAuth configured?
router.get('/google/enabled', (_req, res) => {
  const enabled = !!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET;
  res.json({ success: true, data: { enabled } });
});

// Traditional email/password routes
router.post('/register', register);
router.post('/login', login);

// Google OAuth routes
router.get('/google', 
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: '/api/auth/google/failure' }),
  googleAuthSuccess
);

router.get('/google/failure', googleAuthFailure);

// Token validation
router.post('/validate', validateToken);

// Protected routes
router.get('/me', authenticate as any, getCurrentUser);
router.post('/setup-password', authenticate as any, setupPassword);
router.put('/profile', authenticate as any, updateProfile);
router.post('/logout', logout);

export default router;
