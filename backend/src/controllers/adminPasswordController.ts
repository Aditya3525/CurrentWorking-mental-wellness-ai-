import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';
import { adminLoginLimiter } from './adminAuthController';

const prisma = new PrismaClient();

// Types
interface PasswordResetToken {
  id: string;
  adminId: string;
  token: string;
  expiresAt: Date;
  isUsed: boolean;
  createdAt: Date;
}

// In-memory storage for password reset tokens (in production, use Redis or database)
const passwordResetTokens = new Map<string, PasswordResetToken>();

// Generate password reset token
function generateResetToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Create password reset token
async function createPasswordResetToken(adminId: string): Promise<string> {
  const token = generateResetToken();
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

  const resetToken: PasswordResetToken = {
    id: `reset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    adminId,
    token,
    expiresAt,
    isUsed: false,
    createdAt: new Date()
  };

  passwordResetTokens.set(token, resetToken);

  // Clean up expired tokens
  cleanupExpiredTokens();

  return token;
}

// Verify password reset token
function verifyPasswordResetToken(token: string): { valid: boolean; adminId?: string; error?: string } {
  const resetToken = passwordResetTokens.get(token);

  if (!resetToken) {
    return { valid: false, error: 'Invalid reset token' };
  }

  if (resetToken.isUsed) {
    return { valid: false, error: 'Reset token already used' };
  }

  if (resetToken.expiresAt < new Date()) {
    return { valid: false, error: 'Reset token expired' };
  }

  return { valid: true, adminId: resetToken.adminId };
}

// Mark token as used
function markTokenAsUsed(token: string): void {
  const resetToken = passwordResetTokens.get(token);
  if (resetToken) {
    resetToken.isUsed = true;
    passwordResetTokens.set(token, resetToken);
  }
}

// Clean up expired tokens
function cleanupExpiredTokens(): void {
  const now = new Date();
  for (const [token, resetToken] of passwordResetTokens.entries()) {
    if (resetToken.expiresAt < now || resetToken.isUsed) {
      passwordResetTokens.delete(token);
    }
  }
}

// Request password reset
export const requestPasswordReset = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.get('User-Agent') || 'unknown';

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required'
      });
    }

    // Find admin user
    const adminUser = await prisma.adminUser.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        isActive: true
      }
    });

    // Always return success to prevent email enumeration attacks
    if (!adminUser || !adminUser.isActive) {
      return res.status(200).json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.'
      });
    }

    // Create reset token
    const resetToken = await createPasswordResetToken(adminUser.id);

    // Log the password reset request
    await prisma.adminActivity.create({
      data: {
        adminId: adminUser.id,
        action: 'PASSWORD_RESET_REQUEST',
        resource: '',
        details: JSON.stringify({
          email: adminUser.email,
          ipAddress,
          userAgent
        }),
        ipAddress,
        timestamp: new Date()
      }
    });

    // In a real application, you would send an email with the reset link
    // For demo purposes, we'll log the token to console
    console.log(`🔐 Password Reset Token for ${email}: ${resetToken}`);
    console.log(`🔗 Reset URL: http://localhost:3000/admin/reset-password?token=${resetToken}`);

    return res.status(200).json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent.',
      // In development, include the token for testing
      ...(process.env.NODE_ENV === 'development' && { resetToken })
    });

  } catch (error) {
    console.error('Password reset request error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Reset password with token
export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.get('User-Agent') || 'unknown';

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Reset token and new password are required'
      });
    }

    // Validate password strength
    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 8 characters long'
      });
    }

    // Check password complexity
    const hasUpperCase = /[A-Z]/.test(newPassword);
    const hasLowerCase = /[a-z]/.test(newPassword);
    const hasNumbers = /\d/.test(newPassword);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);

    if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChar) {
      return res.status(400).json({
        success: false,
        error: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
      });
    }

    // Verify reset token
    const verification = verifyPasswordResetToken(token);
    if (!verification.valid || !verification.adminId) {
      return res.status(400).json({
        success: false,
        error: verification.error || 'Invalid reset token'
      });
    }

    // Hash new password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update admin password
    await prisma.adminUser.update({
      where: { id: verification.adminId },
      data: {
        password: hashedPassword,
        updatedAt: new Date()
      }
    });

    // Mark token as used
    markTokenAsUsed(token);

    // Log the password reset
    await prisma.adminActivity.create({
      data: {
        adminId: verification.adminId,
        action: 'PASSWORD_RESET_COMPLETE',
        resource: '',
        details: JSON.stringify({
          ipAddress,
          userAgent,
          tokenUsed: token.slice(0, 8) + '...' // Log partial token for audit
        }),
        ipAddress,
        timestamp: new Date()
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Password has been reset successfully'
    });

  } catch (error) {
    console.error('Password reset error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Change password (for logged-in admin)
export const changePassword = async (req: Request, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const adminUser = (req as any).adminUser; // Set by requireAdmin middleware
    const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.get('User-Agent') || 'unknown';

    if (!adminUser) {
      return res.status(401).json({
        success: false,
        error: 'Admin authentication required'
      });
    }

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Current password and new password are required'
      });
    }

    // Get admin user with password
    const admin = await prisma.adminUser.findUnique({
      where: { id: adminUser.userId },
      select: {
        id: true,
        email: true,
        password: true
      }
    });

    if (!admin || !admin.password) {
      return res.status(404).json({
        success: false,
        error: 'Admin user not found'
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, admin.password);
    if (!isCurrentPasswordValid) {
      // Log failed password change attempt
      await prisma.adminActivity.create({
        data: {
          adminId: admin.id,
          action: 'PASSWORD_CHANGE_FAILED',
          resource: '',
          details: JSON.stringify({
            reason: 'Invalid current password',
            ipAddress,
            userAgent
          }),
          ipAddress,
          timestamp: new Date()
        }
      });

      return res.status(400).json({
        success: false,
        error: 'Current password is incorrect'
      });
    }

    // Validate new password strength (same as reset password)
    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'New password must be at least 8 characters long'
      });
    }

    const hasUpperCase = /[A-Z]/.test(newPassword);
    const hasLowerCase = /[a-z]/.test(newPassword);
    const hasNumbers = /\d/.test(newPassword);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);

    if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChar) {
      return res.status(400).json({
        success: false,
        error: 'New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
      });
    }

    // Check if new password is different from current
    const isSamePassword = await bcrypt.compare(newPassword, admin.password);
    if (isSamePassword) {
      return res.status(400).json({
        success: false,
        error: 'New password must be different from current password'
      });
    }

    // Hash new password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update admin password
    await prisma.adminUser.update({
      where: { id: admin.id },
      data: {
        password: hashedPassword,
        updatedAt: new Date()
      }
    });

    // Log successful password change
    await prisma.adminActivity.create({
      data: {
        adminId: admin.id,
        action: 'PASSWORD_CHANGE_SUCCESS',
        resource: '',
        details: JSON.stringify({
          ipAddress,
          userAgent
        }),
        ipAddress,
        timestamp: new Date()
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Change password error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Get admin password reset info (for debugging in development)
export const getPasswordResetInfo = async (req: Request, res: Response) => {
  try {
    if (process.env.NODE_ENV !== 'development') {
      return res.status(404).json({
        success: false,
        error: 'Not found'
      });
    }

    cleanupExpiredTokens();

    const activeTokens = Array.from(passwordResetTokens.values())
      .filter(token => !token.isUsed && token.expiresAt > new Date())
      .map(token => ({
        id: token.id,
        adminId: token.adminId,
        token: token.token,
        expiresAt: token.expiresAt,
        createdAt: token.createdAt
      }));

    return res.status(200).json({
      success: true,
      activeTokens,
      count: activeTokens.length
    });

  } catch (error) {
    console.error('Get password reset info error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Clean up expired tokens periodically (call this when server starts)
export const startPasswordResetCleanup = () => {
  // Clean up expired tokens every hour
  setInterval(cleanupExpiredTokens, 60 * 60 * 1000);
};