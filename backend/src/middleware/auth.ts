import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { TokenManager, JwtPayload } from '../utils/tokenUtils';

const prisma = new PrismaClient();

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
    tokenVersion: number;
    password?: string | null;
  };
  ipAddress?: string;
  userAgent?: string;
}

export const authenticate = async (
  req: AuthRequest,
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
    
    const decoded = await TokenManager.verifyAccessToken(token);
    
    if (!decoded) {
      res.status(401).json({
        success: false,
        error: 'Invalid or expired token.',
      });
      return;
    }
    
    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { 
        id: true, 
        email: true, 
        name: true, 
        password: true
      },
    });

    if (!user) {
      res.status(401).json({
        success: false,
        error: 'Invalid token - user not found.',
      });
      return;
    }

    // Add request metadata
    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      tokenVersion: decoded.tokenVersion || 1,
      password: user.password
    };
    req.ipAddress = req.ip || req.connection.remoteAddress;
    req.userAgent = req.headers['user-agent'];

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({
      success: false,
      error: 'Invalid token.',
    });
  }
};

export const authenticateRefresh = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      res.status(401).json({
        success: false,
        error: 'Refresh token required.',
      });
      return;
    }

    const result = await TokenManager.refreshAccessToken(refreshToken);
    
    if (!result) {
      res.status(401).json({
        success: false,
        error: 'Invalid or expired refresh token.',
      });
      return;
    }

    res.json({
      success: true,
      data: {
        accessToken: result.accessToken,
        refreshToken: result.newRefreshToken
      }
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(401).json({
      success: false,
      error: 'Token refresh failed.',
    });
  }
};

// Middleware to ensure user has a password before accessing protected routes
export const requirePassword = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated.',
      });
      return;
    }

    if (!req.user.password) {
      res.status(403).json({
        success: false,
        error: 'Password setup required. Please set up your password before accessing this resource.',
        requiresPasswordSetup: true
      });
      return;
    }

    next();
  } catch (error) {
    console.error('Password requirement check error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error during password validation.',
    });
  }
};

export { AuthRequest };
