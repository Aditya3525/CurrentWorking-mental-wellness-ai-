import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'your-admin-secret-key';

// Rate limiting for admin login attempts
export const adminLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: {
    error: 'Too many admin login attempts from this IP, please try again after 15 minutes.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true
});

// Types
interface AdminTokenPayload {
  userId: string;
  email: string;
  role: string;
  isAdmin: boolean;
  sessionId: string;
  iat?: number;
  exp?: number;
}

interface AdminSession {
  id: string;
  userId: string;
  createdAt: Date;
  lastActivity: Date;
  ipAddress: string;
  userAgent: string;
  isActive: boolean;
}

// Admin session storage (in production, use Redis or database)
const adminSessions = new Map<string, AdminSession>();

// Generate admin session ID
function generateSessionId(): string {
  return `admin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Log admin activity
async function logAdminActivity(
  adminId: string,
  action: string,
  details: any = {},
  ipAddress: string,
  userAgent: string
) {
  try {
    await prisma.adminActivity.create({
      data: {
        adminId,
        action,
        resource: details.endpoint || '',
        details: JSON.stringify(details),
        ipAddress,
        timestamp: new Date()
      }
    });
  } catch (error) {
    console.error('Failed to log admin activity:', error);
  }
}

// Verify admin credentials
async function verifyAdminCredentials(email: string, password: string) {
  try {
    const adminUser = await prisma.adminUser.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        password: true,
        role: true,
        isActive: true,
        lastLoginAt: true
      }
    });

    if (!adminUser) {
      return { success: false, error: 'Invalid credentials' };
    }

    if (adminUser.role !== 'admin' && adminUser.role !== 'super_admin') {
      return { success: false, error: 'Access denied: Admin privileges required' };
    }

    if (!adminUser.isActive) {
      return { success: false, error: 'Account is deactivated' };
    }

    if (!adminUser.password) {
      return { success: false, error: 'Password not set for this account' };
    }

    const isPasswordValid = await bcrypt.compare(password, adminUser.password);
    if (!isPasswordValid) {
      return { success: false, error: 'Invalid credentials' };
    }

    return {
      success: true,
      user: {
        id: adminUser.id,
        email: adminUser.email,
        name: adminUser.name,
        role: adminUser.role,
        isActive: adminUser.isActive,
        lastLoginAt: adminUser.lastLoginAt
      }
    };
  } catch (error) {
    console.error('Admin credential verification error:', error);
    return { success: false, error: 'Authentication service error' };
  }
}

// Create admin JWT token
function createAdminToken(user: any, sessionId: string): string {
  const payload: AdminTokenPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    isAdmin: true,
    sessionId
  };

  return jwt.sign(payload, ADMIN_JWT_SECRET, {
    expiresIn: '4h', // Admin sessions expire after 4 hours
    issuer: 'wellness-ai-admin',
    audience: 'wellness-ai-admin-panel'
  });
}

// Verify admin JWT token
export function verifyAdminToken(token: string): { valid: boolean; payload?: AdminTokenPayload; error?: string } {
  try {
    const payload = jwt.verify(token, ADMIN_JWT_SECRET, {
      issuer: 'wellness-ai-admin',
      audience: 'wellness-ai-admin-panel'
    }) as AdminTokenPayload;

    // Check if session is still active
    const session = adminSessions.get(payload.sessionId);
    if (!session || !session.isActive) {
      return { valid: false, error: 'Session expired or invalid' };
    }

    // Update session activity
    session.lastActivity = new Date();
    adminSessions.set(payload.sessionId, session);

    return { valid: true, payload };
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return { valid: false, error: 'Token expired' };
    } else if (error instanceof jwt.JsonWebTokenError) {
      return { valid: false, error: 'Invalid token' };
    }
    return { valid: false, error: 'Token verification failed' };
  }
}

// Admin Login Controller
export const adminLogin = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.get('User-Agent') || 'unknown';

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }

    // Verify admin credentials
    const verification = await verifyAdminCredentials(email, password);
    if (!verification.success) {
      // Log failed login attempt
      try {
        await logAdminActivity(
          'unknown',
          'ADMIN_LOGIN_FAILED',
          { email, reason: verification.error },
          ipAddress,
          userAgent
        );
      } catch (logError) {
        console.error('Failed to log admin login failure:', logError);
      }

      return res.status(401).json({
        success: false,
        error: verification.error
      });
    }

    const user = verification.user!;

    // Create admin session
    const sessionId = generateSessionId();
    const session: AdminSession = {
      id: sessionId,
      userId: user.id,
      createdAt: new Date(),
      lastActivity: new Date(),
      ipAddress,
      userAgent,
      isActive: true
    };

    adminSessions.set(sessionId, session);

    // Create admin JWT token
    const token = createAdminToken(user, sessionId);

    // Update admin user's last login time
    await prisma.adminUser.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

    // Log successful admin login
    await logAdminActivity(
      user.id,
      'ADMIN_LOGIN_SUCCESS',
      { sessionId, loginMethod: 'password' },
      ipAddress,
      userAgent
    );

    // Set secure cookie
    res.cookie('adminToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 4 * 60 * 60 * 1000 // 4 hours
    });

    return res.status(200).json({
      success: true,
      message: 'Admin login successful',
      admin: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        lastLoginAt: user.lastLoginAt
      },
      token, // Also return token for client-side storage if needed
      sessionExpiry: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString()
    });

  } catch (error) {
    console.error('Admin login error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error during admin login'
    });
  }
};

// Admin Logout Controller
export const adminLogout = async (req: Request, res: Response) => {
  try {
    const token = req.cookies.adminToken || req.headers.authorization?.replace('Bearer ', '');
    const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.get('User-Agent') || 'unknown';

    if (token) {
      const verification = verifyAdminToken(token);
      if (verification.valid && verification.payload) {
        const sessionId = verification.payload.sessionId;
        const userId = verification.payload.userId;

        // Deactivate session
        const session = adminSessions.get(sessionId);
        if (session) {
          session.isActive = false;
          adminSessions.set(sessionId, session);
        }

        // Log admin logout
        await logAdminActivity(
          userId,
          'ADMIN_LOGOUT',
          { sessionId, logoutMethod: 'manual' },
          ipAddress,
          userAgent
        );
      }
    }

    // Clear admin cookie
    res.clearCookie('adminToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });

    return res.status(200).json({
      success: true,
      message: 'Admin logout successful'
    });

  } catch (error) {
    console.error('Admin logout error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error during admin logout'
    });
  }
};

// Get Admin Profile
export const getAdminProfile = async (req: Request, res: Response) => {
  try {
    const adminUserFromToken = (req as any).adminUser; // Set by requireAdmin middleware

    if (!adminUserFromToken) {
      return res.status(401).json({
        success: false,
        error: 'Admin authentication required'
      });
    }

    // Get fresh admin user data
    const adminUser = await prisma.adminUser.findUnique({
      where: { id: adminUserFromToken.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true
      }
    });

    if (!adminUser) {
      return res.status(404).json({
        success: false,
        error: 'Admin user not found'
      });
    }

    return res.status(200).json({
      success: true,
      admin: adminUser
    });

  } catch (error) {
    console.error('Get admin profile error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Refresh Admin Token
export const refreshAdminToken = async (req: Request, res: Response) => {
  try {
    const token = req.cookies.adminToken || req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'No admin token provided'
      });
    }

    const verification = verifyAdminToken(token);
    if (!verification.valid || !verification.payload) {
      return res.status(401).json({
        success: false,
        error: verification.error || 'Invalid admin token'
      });
    }

    const payload = verification.payload;

    // Get fresh admin user data
    const adminUser = await prisma.adminUser.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true
      }
    });

    if (!adminUser || (adminUser.role !== 'admin' && adminUser.role !== 'super_admin') || !adminUser.isActive) {
      return res.status(401).json({
        success: false,
        error: 'Admin access revoked'
      });
    }

    // Create new token with same session ID
    const newToken = createAdminToken(adminUser, payload.sessionId);

    // Update cookie
    res.cookie('adminToken', newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 4 * 60 * 60 * 1000 // 4 hours
    });

    return res.status(200).json({
      success: true,
      message: 'Admin token refreshed',
      token: newToken,
      sessionExpiry: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString()
    });

  } catch (error) {
    console.error('Refresh admin token error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Clean up expired sessions (should be called periodically)
export const cleanupExpiredSessions = () => {
  const now = new Date();
  const fourHoursAgo = new Date(now.getTime() - 4 * 60 * 60 * 1000);

  for (const [sessionId, session] of adminSessions.entries()) {
    if (session.lastActivity < fourHoursAgo) {
      adminSessions.delete(sessionId);
    }
  }
};

// Get active admin sessions (for monitoring)
export const getActiveSessions = async (req: Request, res: Response) => {
  try {
    const adminUser = (req as any).adminUser;
    
    if (!adminUser) {
      return res.status(401).json({
        success: false,
        error: 'Admin authentication required'
      });
    }

    // Clean up expired sessions first
    cleanupExpiredSessions();

    const activeSessions = Array.from(adminSessions.values())
      .filter(session => session.isActive)
      .map(session => ({
        id: session.id,
        userId: session.userId,
        createdAt: session.createdAt,
        lastActivity: session.lastActivity,
        ipAddress: session.ipAddress,
        userAgent: session.userAgent
      }));

    return res.status(200).json({
      success: true,
      sessions: activeSessions,
      count: activeSessions.length
    });

  } catch (error) {
    console.error('Get active sessions error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Revoke admin session
export const revokeAdminSession = async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const adminUser = (req as any).adminUser;
    const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.get('User-Agent') || 'unknown';

    if (!adminUser) {
      return res.status(401).json({
        success: false,
        error: 'Admin authentication required'
      });
    }

    const session = adminSessions.get(sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }

    // Deactivate session
    session.isActive = false;
    adminSessions.set(sessionId, session);

    // Log session revocation
    await logAdminActivity(
      adminUser.userId,
      'ADMIN_SESSION_REVOKED',
      { revokedSessionId: sessionId, targetUserId: session.userId },
      ipAddress,
      userAgent
    );

    return res.status(200).json({
      success: true,
      message: 'Admin session revoked successfully'
    });

  } catch (error) {
    console.error('Revoke admin session error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Start session cleanup interval (call this when server starts)
export const startSessionCleanup = () => {
  // Clean up expired sessions every hour
  setInterval(cleanupExpiredSessions, 60 * 60 * 1000);
};