import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface AdminRequest extends Request {
  admin?: {
    id: string;
    email: string;
    role: string;
    name: string;
  };
  ipAddress?: string;
  userAgent?: string;
}

export const authenticateAdmin = async (
  req: AdminRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: 'Access denied. No token provided.',
      });
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;
    
    if (decoded.type !== 'admin') {
      res.status(401).json({
        success: false,
        error: 'Invalid token type. Admin access required.',
      });
      return;
    }
    
    // Check if session is valid
    const session = await prisma.adminSession.findUnique({
      where: { 
        token,
        isActive: true,
        expiresAt: {
          gt: new Date()
        }
      },
      include: {
        admin: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            isActive: true
          }
        }
      }
    });

    if (!session || !session.admin.isActive) {
      res.status(401).json({
        success: false,
        error: 'Invalid or expired session.',
      });
      return;
    }
    
    // Add admin info to request
    req.admin = {
      id: session.admin.id,
      email: session.admin.email,
      name: session.admin.name,
      role: session.admin.role,
    };
    req.ipAddress = req.ip || req.connection.remoteAddress;
    req.userAgent = req.headers['user-agent'];

    next();
  } catch (error) {
    console.error('Admin authentication error:', error);
    res.status(401).json({
      success: false,
      error: 'Invalid token.',
    });
  }
};

export const requireRole = (allowedRoles: string[]) => {
  return (req: AdminRequest, res: Response, next: NextFunction) => {
    if (!req.admin) {
      res.status(401).json({
        success: false,
        error: 'Authentication required.',
      });
      return;
    }

    if (!allowedRoles.includes(req.admin.role)) {
      res.status(403).json({
        success: false,
        error: 'Insufficient permissions.',
      });
      return;
    }

    next();
  };
};

// Check if user has specific permission
export const requirePermission = (permission: string) => {
  return async (req: AdminRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.admin) {
        res.status(401).json({
          success: false,
          error: 'Authentication required.',
        });
        return;
      }

      const adminUser = await prisma.adminUser.findUnique({
        where: { id: req.admin.id },
        select: { permissions: true, role: true }
      });

      if (!adminUser) {
        res.status(401).json({
          success: false,
          error: 'Admin user not found.',
        });
        return;
      }

      // Super admin has all permissions
      if (adminUser.role === 'super_admin') {
        next();
        return;
      }

      // Check specific permissions
      const permissions = adminUser.permissions ? JSON.parse(adminUser.permissions) : [];
      
      if (!permissions.includes(permission)) {
        res.status(403).json({
          success: false,
          error: `Permission '${permission}' required.`,
        });
        return;
      }

      next();
    } catch (error) {
      console.error('Permission check error:', error);
      res.status(500).json({
        success: false,
        error: 'Server error checking permissions.',
      });
    }
  };
};

export { AdminRequest };
