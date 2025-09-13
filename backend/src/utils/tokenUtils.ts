import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface JwtPayload {
  id: string;
  email: string;
  tokenVersion: number;
  iat?: number;
  exp?: number;
}

export interface RefreshTokenPayload {
  userId: string;
  tokenVersion: number;
  iat?: number;
  exp?: number;
}

export class TokenManager {
  private static readonly ACCESS_TOKEN_EXPIRE = '15m';
  private static readonly REFRESH_TOKEN_EXPIRE = '7d';

  /**
   * Generate access token (short-lived)
   */
  static generateAccessToken(user: { id: string; email: string; tokenVersion: number }): string {
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET not configured');
    }

    return jwt.sign(
      {
        id: user.id,
        email: user.email,
        tokenVersion: user.tokenVersion
      },
      process.env.JWT_SECRET,
      { expiresIn: this.ACCESS_TOKEN_EXPIRE }
    );
  }

  /**
   * Generate refresh token (long-lived)
   */
  static async generateRefreshToken(userId: string, tokenVersion: number): Promise<string> {
    if (!process.env.JWT_REFRESH_SECRET) {
      throw new Error('JWT_REFRESH_SECRET not configured');
    }

    const refreshToken = jwt.sign(
      { userId, tokenVersion },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: this.REFRESH_TOKEN_EXPIRE }
    );

    // Store refresh token in database
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await prisma.refreshToken.create({
      data: {
        userId,
        token: refreshToken,
        expiresAt
      }
    });

    return refreshToken;
  }

  /**
   * Verify access token
   */
  static async verifyAccessToken(token: string): Promise<JwtPayload | null> {
    try {
      if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET not configured');
      }

      // Check if token is blacklisted
      const blacklisted = await prisma.tokenBlacklist.findUnique({
        where: { token }
      });

      if (blacklisted) {
        return null;
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET) as JwtPayload;
      
      // Verify user still exists and token version matches
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: { tokenVersion: true }
      });

      if (!user || user.tokenVersion !== decoded.tokenVersion) {
        return null;
      }

      return decoded;
    } catch (error) {
      return null;
    }
  }

  /**
   * Verify refresh token
   */
  static async verifyRefreshToken(token: string): Promise<RefreshTokenPayload | null> {
    try {
      if (!process.env.JWT_REFRESH_SECRET) {
        throw new Error('JWT_REFRESH_SECRET not configured');
      }

      const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET) as RefreshTokenPayload;
      
      // Check if refresh token exists and is not revoked
      const refreshToken = await prisma.refreshToken.findUnique({
        where: { token },
        include: { user: true }
      });

      if (!refreshToken || refreshToken.isRevoked || refreshToken.expiresAt < new Date()) {
        return null;
      }

      // Verify token version
      if (refreshToken.user.tokenVersion !== decoded.tokenVersion) {
        return null;
      }

      return decoded;
    } catch (error) {
      return null;
    }
  }

  /**
   * Refresh access token using refresh token
   */
  static async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string; newRefreshToken: string } | null> {
    const payload = await this.verifyRefreshToken(refreshToken);
    if (!payload) {
      return null;
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true, tokenVersion: true }
    });

    if (!user) {
      return null;
    }

    // Generate new tokens
    const newAccessToken = this.generateAccessToken(user);
    const newRefreshToken = await this.generateRefreshToken(user.id, user.tokenVersion);

    // Revoke old refresh token
    await prisma.refreshToken.update({
      where: { token: refreshToken },
      data: { isRevoked: true }
    });

    return {
      accessToken: newAccessToken,
      newRefreshToken
    };
  }

  /**
   * Blacklist access token
   */
  static async blacklistToken(token: string, reason: string): Promise<void> {
    try {
      const decoded = jwt.decode(token) as any;
      if (!decoded?.exp) return;

      const expiresAt = new Date(decoded.exp * 1000);

      await prisma.tokenBlacklist.create({
        data: {
          token,
          expiresAt,
          reason
        }
      });
    } catch (error) {
      console.error('Error blacklisting token:', error);
    }
  }

  /**
   * Revoke all refresh tokens for user
   */
  static async revokeAllRefreshTokens(userId: string): Promise<void> {
    await prisma.refreshToken.updateMany({
      where: { userId },
      data: { isRevoked: true }
    });
  }

  /**
   * Invalidate all tokens for user (increment token version)
   */
  static async invalidateAllTokens(userId: string, reason: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: { tokenVersion: { increment: 1 } }
    });

    await this.revokeAllRefreshTokens(userId);
  }

  /**
   * Clean up expired tokens
   */
  static async cleanupExpiredTokens(): Promise<void> {
    const now = new Date();

    // Remove expired refresh tokens
    await prisma.refreshToken.deleteMany({
      where: { expiresAt: { lt: now } }
    });

    // Remove expired blacklisted tokens
    await prisma.tokenBlacklist.deleteMany({
      where: { expiresAt: { lt: now } }
    });
  }
}
