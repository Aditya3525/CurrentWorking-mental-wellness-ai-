import express from 'express';
import passport from '../config/passport';
import {
  register,
  login,
  getCurrentUser,
  googleAuthSuccess,
  googleAuthFailure,
  validateToken,
  setupPassword,
  updateProfile,
  logout,
  setSecurityQuestion,
  getSecurityQuestionForReset,
  resetPasswordWithSecurityAnswer,
  resetPasswordWithSecurityAnswerAuthenticated,
  updateSecurityQuestionWithPassword,
  updateApproachWithPassword
} from '../controllers/authController';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { asyncHandler } from '../middleware/errorHandler';
import {
  registerSchema,
  loginSchema,
  passwordSetupSchema,
  updateProfileSchema,
} from '../api/validators';

const router = express.Router();

// Traditional email/password routes
router.post('/register', validate(registerSchema), asyncHandler(register));
router.post('/login', validate(loginSchema), asyncHandler(login));

// Google OAuth routes
router.get('/google', 
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: '/api/auth/google/failure' }),
  asyncHandler(googleAuthSuccess)
);

router.get('/google/failure', googleAuthFailure);

// Token validation
router.post('/validate', asyncHandler(validateToken));

// Protected routes
router.get('/me', authenticate as any, asyncHandler(getCurrentUser));
router.post('/setup-password', authenticate as any, validate(passwordSetupSchema), asyncHandler(setupPassword));
router.post('/security-question', authenticate as any, asyncHandler(setSecurityQuestion));
router.put('/profile', authenticate as any, validate(updateProfileSchema), asyncHandler(updateProfile));
router.post('/security-question/update', authenticate as any, asyncHandler(updateSecurityQuestionWithPassword));
router.post('/password/reset-with-answer', authenticate as any, asyncHandler(resetPasswordWithSecurityAnswerAuthenticated));
router.post('/approach/update', authenticate as any, asyncHandler(updateApproachWithPassword));
router.post('/logout', asyncHandler(logout));

// Forgot password via security question
router.post('/forgot-password', asyncHandler(getSecurityQuestionForReset));
router.post('/reset-password', asyncHandler(resetPasswordWithSecurityAnswer));

export default router;
