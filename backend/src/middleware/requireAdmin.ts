import { Request, Response, NextFunction } from 'express';
import { verifyAdminToken } from '../controllers/adminAuthController';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Types
interface AdminUser {
  userId: string;
  email: string;
  role: string;
  isAdmin: boolean;
  sessionId: string;
}

// Extend Request type to include adminUser
declare global {
  namespace Express {
    interface Request {
      adminUser?: AdminUser;
    }
  }
}

// Log admin activity helper
async function logAdminActivity(
  adminId: string,
  action: string,
  details: any = {},
  ipAddress: string,
  userAgent: string,
  endpoint?: string
) {
  try {
    await prisma.adminActivity.create({
      data: {
        adminId,
        action,
        resource: endpoint,
        details: JSON.stringify({
          ...details,
          endpoint,
          timestamp: new Date().toISOString()
        }),
        ipAddress,
        timestamp: new Date()
      }
    });
  } catch (error) {
    console.error('Failed to log admin activity:', error);
  }
}

// Main admin authentication middleware
export const requireAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.get('User-Agent') || 'unknown';
    const endpoint = `${req.method} ${req.path}`;

    // Extract token from cookie or Authorization header
    let token = req.cookies?.adminToken;
    
    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      await logAdminActivity(
        'unknown',
        'ADMIN_ACCESS_DENIED',
        { reason: 'No token provided', endpoint },
        ipAddress,
        userAgent,
        endpoint
      );

      return res.status(401).json({
        success: false,
        error: 'Admin authentication required',
        code: 'NO_TOKEN'
      });
    }

    // Verify the admin token
    const verification = verifyAdminToken(token);
    if (!verification.valid || !verification.payload) {
      await logAdminActivity(
        'unknown',
        'ADMIN_ACCESS_DENIED',
        { reason: verification.error || 'Invalid token', endpoint },
        ipAddress,
        userAgent,
        endpoint
      );

      return res.status(401).json({
        success: false,
        error: verification.error || 'Invalid admin token',
        code: verification.error === 'Token expired' ? 'TOKEN_EXPIRED' : 'INVALID_TOKEN'
      });
    }

    const payload = verification.payload;

    // Double-check user still has admin privileges
    const adminUser = await prisma.adminUser.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
        name: true
      }
    });

    if (!adminUser) {
      await logAdminActivity(
        payload.userId,
        'ADMIN_ACCESS_DENIED',
        { reason: 'Admin user not found', endpoint },
        ipAddress,
        userAgent,
        endpoint
      );

      return res.status(401).json({
        success: false,
        error: 'Admin user not found',
        code: 'USER_NOT_FOUND'
      });
    }

    if (adminUser.role !== 'admin' && adminUser.role !== 'super_admin') {
      await logAdminActivity(
        payload.userId,
        'ADMIN_ACCESS_DENIED',
        { reason: 'Insufficient privileges', endpoint, userRole: adminUser.role },
        ipAddress,
        userAgent,
        endpoint
      );

      return res.status(403).json({
        success: false,
        error: 'Access denied: Admin privileges required',
        code: 'INSUFFICIENT_PRIVILEGES'
      });
    }

    if (!adminUser.isActive) {
      await logAdminActivity(
        payload.userId,
        'ADMIN_ACCESS_DENIED',
        { reason: 'Account deactivated', endpoint },
        ipAddress,
        userAgent,
        endpoint
      );

      return res.status(403).json({
        success: false,
        error: 'Account is deactivated',
        code: 'ACCOUNT_DEACTIVATED'
      });
    }

    // Set admin user in request for downstream use
    req.adminUser = {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
      isAdmin: payload.isAdmin,
      sessionId: payload.sessionId
    };

    // Log successful admin access
    await logAdminActivity(
      payload.userId,
      'ADMIN_ACCESS_GRANTED',
      { endpoint, method: req.method },
      ipAddress,
      userAgent,
      endpoint
    );

    next();

  } catch (error) {
    console.error('Admin authentication middleware error:', error);
    
    const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.get('User-Agent') || 'unknown';
    const endpoint = `${req.method} ${req.path}`;

    await logAdminActivity(
      'unknown',
      'ADMIN_AUTH_ERROR',
      { error: error instanceof Error ? error.message : 'Unknown error', endpoint },
      ipAddress,
      userAgent,
      endpoint
    );

    return res.status(500).json({
      success: false,
      error: 'Internal server error during admin authentication',
      code: 'AUTH_ERROR'
    });
  }
};

// Middleware for optional admin authentication (doesn't fail if not admin)
export const optionalAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies?.adminToken || req.headers.authorization?.replace('Bearer ', '');
    
    if (token) {
      const verification = verifyAdminToken(token);
      if (verification.valid && verification.payload) {
        const payload = verification.payload;
        
        // Check if user still has admin privileges
        const adminUser = await prisma.adminUser.findUnique({
          where: { id: payload.userId },
          select: {
            id: true,
            email: true,
            role: true,
            isActive: true,
            name: true
          }
        });

        if (adminUser && (adminUser.role === 'admin' || adminUser.role === 'super_admin') && adminUser.isActive) {
          req.adminUser = {
            userId: payload.userId,
            email: payload.email,
            role: payload.role,
            isAdmin: true,
            sessionId: payload.sessionId
          };
        }
      }
    }

    next();
  } catch (error) {
    console.error('Optional admin middleware error:', error);
    // Don't fail the request, just continue without admin context
    next();
  }
};

// Middleware for specific admin roles (future expansion)
export const requireAdminRole = (requiredRole: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // First run requireAdmin
    await requireAdmin(req, res, () => {});
    
    if (res.headersSent) {
      return; // Response already sent by requireAdmin
    }

    const adminUser = req.adminUser;
    if (!adminUser) {
      return res.status(401).json({
        success: false,
        error: 'Admin authentication required',
        code: 'NO_ADMIN'
      });
    }

    // Check specific role requirement
    if (adminUser.role !== requiredRole) {
      const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
      const userAgent = req.get('User-Agent') || 'unknown';
      const endpoint = `${req.method} ${req.path}`;

      await logAdminActivity(
        adminUser.userId,
        'ADMIN_ROLE_ACCESS_DENIED',
        { 
          requiredRole, 
          userRole: adminUser.role, 
          endpoint 
        },
        ipAddress,
        userAgent,
        endpoint
      );

      return res.status(403).json({
        success: false,
        error: `Access denied: ${requiredRole} role required`,
        code: 'INSUFFICIENT_ROLE'
      });
    }

    next();
  };
};

// Middleware for admin action logging
export const logAdminAction = (actionName: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const adminUser = req.adminUser;
    if (!adminUser) {
      return next(); // Skip logging if not admin
    }

    const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.get('User-Agent') || 'unknown';
    const endpoint = `${req.method} ${req.path}`;

    // Store original res.json to capture response data
    const originalJson = res.json;
    let responseData: any = null;

    res.json = function(body: any) {
      responseData = body;
      return originalJson.call(this, body);
    };

    // Store original res.end to log after response
    const originalEnd = res.end;
    res.end = function(...args: any[]) {
      // Log the admin action
      logAdminActivity(
        adminUser.userId,
        actionName,
        {
          endpoint,
          method: req.method,
          requestBody: req.body,
          queryParams: req.query,
          responseStatus: res.statusCode,
          success: res.statusCode >= 200 && res.statusCode < 300
        },
        ipAddress,
        userAgent,
        endpoint
      ).catch(error => {
        console.error('Failed to log admin action:', error);
      });

      return originalEnd.apply(this, args);
    };

    next();
  };
};

// Middleware for super admin only actions (future expansion)
export const requireSuperAdmin = async (req: Request, res: Response, next: NextFunction) => {
  // First run requireAdmin
  await requireAdmin(req, res, () => {});
  
  if (res.headersSent) {
    return; // Response already sent by requireAdmin
  }

  const adminUser = req.adminUser;
  if (!adminUser) {
    return res.status(401).json({
      success: false,
      error: 'Admin authentication required',
      code: 'NO_ADMIN'
    });
  }

  // Check if user is super admin (for now, all ADMIN role users are super admins)
  // In the future, you might have ADMIN and SUPER_ADMIN roles
  if (adminUser.role !== 'ADMIN') {
    const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.get('User-Agent') || 'unknown';
    const endpoint = `${req.method} ${req.path}`;

    await logAdminActivity(
      adminUser.userId,
      'SUPER_ADMIN_ACCESS_DENIED',
      { endpoint, userRole: adminUser.role },
      ipAddress,
      userAgent,
      endpoint
    );

    return res.status(403).json({
      success: false,
      error: 'Access denied: Super admin privileges required',
      code: 'INSUFFICIENT_SUPER_ADMIN'
    });
  }

  next();
};

// Utility function to check if current request is from admin
export const isAdminRequest = (req: Request): boolean => {
  return !!(req.adminUser && req.adminUser.isAdmin);
};

// Utility function to get admin user from request
export const getAdminUser = (req: Request): AdminUser | null => {
  return req.adminUser || null;
};