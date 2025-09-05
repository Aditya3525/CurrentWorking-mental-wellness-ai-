import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import Joi from 'joi';

const prisma = new PrismaClient();

// Validation schemas
const registerSchema = Joi.object({
  name: Joi.string().min(2).max(50).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

// Generate JWT token
const generateToken = (userId: string): string => {
  // Use provided secret or safe fallback for development to prevent silent flow break
  const secret = process.env.JWT_SECRET || 'dev-fallback-secret';
  return jwt.sign(
    { id: userId },
    secret as jwt.Secret,
    { expiresIn: process.env.JWT_EXPIRE || '7d' } as jwt.SignOptions
  );
};

// Google OAuth Success callback
export const googleAuthSuccess = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.redirect('http://localhost:3000/auth/callback?error=oauth_failed');
    }

    const user = req.user as any;
    const token = generateToken(user.id);

    // Detect if this user was just created in passport strategy
    const justCreated = user.justCreated;

    // Determine redirect:
    // Existing user (has password OR already onboarded) -> dashboard
    // Newly created Google user with no password -> setup-password
    // After password but not onboarded -> onboarding
    let redirectParam = 'dashboard';
    let needsSetup = false;

    if (justCreated && !user.password) {
      redirectParam = 'setup-password';
      needsSetup = true;
    } else if (!user.isOnboarded) {
      // Only prompt onboarding if not a fully onboarded existing account
      redirectParam = 'onboarding';
      needsSetup = true;
    }

    // Create comprehensive user data object for frontend
    const userData = {
      id: user.id,
      email: user.email,
      name: user.name,
      firstName: user.firstName,
      lastName: user.lastName,
      profilePhoto: user.profilePhoto,
      isOnboarded: user.isOnboarded,
  hasPassword: !!user.password,
    justCreated, // Include justCreated in user data
      approach: user.approach,
      birthday: user.birthday,
      gender: user.gender,
      region: user.region,
      language: user.language
    };

    // Redirect to frontend OAuth callback with token and comprehensive user data
    const userDataEncoded = encodeURIComponent(JSON.stringify(userData));
    res.redirect(`http://localhost:3000/auth/callback?token=${token}&redirect=${redirectParam}&needs_setup=${needsSetup}&user_data=${userDataEncoded}`);
  } catch (error) {
    console.error('Google OAuth success error:', error);
    res.redirect('http://localhost:3000/auth/callback?error=oauth_error');
  }
};

// Google OAuth Failure callback
export const googleAuthFailure = (req: Request, res: Response) => {
  res.redirect('http://localhost:3000/auth/callback?error=oauth_cancelled');
};

// Stateless logout (client simply discards token; endpoint provided for future blacklisting/session tracking)
export const logout = async (_req: Request, res: Response) => {
  try {
    // For JWT stateless auth, just respond success. Could add token blacklist storage here.
    res.json({ success: true, data: { message: 'Logged out' } });
  } catch (e) {
    res.status(500).json({ success: false, error: 'Logout failed' });
  }
};

// Register user
export const register = async (req: Request, res: Response) => {
  try {
    // Validate request
    const { error } = registerSchema.validate(req.body);
    if (error) {
      res.status(400).json({
        success: false,
        error: error.details[0].message,
      });
      return;
    }

    const { name, email, password } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      res.status(400).json({
        success: false,
        error: 'User already exists with this email',
      });
      return;
    }

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
      },
      select: {
        id: true,
        name: true,
  firstName: true,
  lastName: true,
        email: true,
        isOnboarded: true,
        approach: true,
        createdAt: true,
      },
    });

    // Generate token
    const token = generateToken(user.id);

    res.status(201).json({
      success: true,
      data: {
        user,
        token,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error during registration',
    });
  }
};

// Login user
export const login = async (req: Request, res: Response) => {
  try {
    // Validate request
    const { error } = loginSchema.validate(req.body);
    if (error) {
      res.status(400).json({
        success: false,
        error: error.details[0].message,
      });
      return;
    }

    const { email, password } = req.body;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      res.status(400).json({
        success: false,
        error: 'Invalid credentials',
      });
      return;
    }

    // Check password
    if (!user.password) {
      res.status(400).json({
        success: false,
        error: 'Invalid credentials',
      });
      return;
    }
    
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      res.status(400).json({
        success: false,
        error: 'Invalid credentials',
      });
      return;
    }

    // Generate token
    const token = generateToken(user.id);

    // Return user data (excluding password)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: userPassword, ...userWithoutPassword } = user;

    res.json({
      success: true,
      data: {
        user: userWithoutPassword,
        token,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error during login',
    });
  }
};

// Get current user
export const getCurrentUser = async (req: any, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
  firstName: true,
  lastName: true,
        email: true,
        isOnboarded: true,
        approach: true,
        birthday: true,
        gender: true,
        region: true,
        language: true,
        emergencyContact: true,
        emergencyPhone: true,
        dataConsent: true,
        clinicianSharing: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found',
      });
      return;
    }

    res.json({
      success: true,
      data: { user },
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
    });
  }
};

// Validate JWT token
export const validateToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      res.status(401).json({ error: 'No token provided' });
      return;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        name: true,
        email: true,
        googleId: true,
        firstName: true,
        lastName: true,
        profilePhoto: true,
        isOnboarded: true,
        approach: true,
        birthday: true,
        gender: true,
        region: true,
        language: true,
        emergencyContact: true,
        emergencyPhone: true,
        dataConsent: true,
        clinicianSharing: true,
        password: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      res.status(401).json({ error: 'Invalid token' });
      return;
    }

  // Derive hasPassword flag and remove password hash
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password, ...safeUser } = user as any;
  (safeUser as any).hasPassword = !!password;
  res.json(safeUser);
  } catch (error) {
    console.error('Token validation error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Setup password for OAuth users
export const setupPassword = async (req: any, res: Response) => {
  try {
    console.log('Setup password request received');
    console.log('Request body:', req.body);
    console.log('User from auth middleware:', req.user);
    
    const { password } = req.body;
    
    if (!password || password.length < 6) {
      console.log('Password validation failed:', { password: password ? 'provided' : 'missing', length: password?.length });
      res.status(400).json({
        success: false,
        error: 'Password must be at least 6 characters long',
      });
      return;
    }

    if (!req.user || !req.user.id) {
      console.log('User not found in request:', req.user);
      res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
      return;
    }

    // Hash password
    console.log('Hashing password for user:', req.user.id);
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Update user with password
    console.log('Updating user password in database');
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { password: hashedPassword },
      select: {
        id: true,
        name: true,
  firstName: true,
  lastName: true,
        email: true,
        isOnboarded: true,
        approach: true,
        birthday: true,
        gender: true,
        region: true,
        language: true,
        emergencyContact: true,
        emergencyPhone: true,
        dataConsent: true,
        clinicianSharing: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    console.log('Password setup successful for user:', user.id);
    res.json({
      success: true,
      data: { user },
    });
  } catch (error) {
    console.error('Setup password error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error during password setup',
    });
  }
};

// Update user profile during onboarding
export const updateProfile = async (req: any, res: Response) => {
  try {
    const {
      birthday,
      gender,
      region,
      language,
      emergencyContact,
      emergencyPhone,
      approach,
  firstName,
  lastName,
      isOnboarded
    } = req.body;

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        ...(birthday && { 
          birthday: (() => {
            let b: any = birthday;
            if (typeof b === 'string' && /^\d{2}-\d{2}-\d{4}$/.test(b)) {
              const [dd, mm, yyyy] = b.split('-');
              b = `${yyyy}-${mm}-${dd}`;
            }
            const d = new Date(b);
            return isNaN(d.getTime()) ? undefined : d;
          })()
        }),
        ...(gender && { gender }),
        ...(region && { region }),
        ...(language && { language }),
        ...(emergencyContact && { emergencyContact }),
        ...(emergencyPhone && { emergencyPhone }),
        ...(approach && { approach }),
  ...(firstName && { firstName }),
  ...(lastName && { lastName }),
        ...(isOnboarded !== undefined && { isOnboarded }),
      },
      select: {
        id: true,
        name: true,
  firstName: true,
  lastName: true,
        email: true,
        isOnboarded: true,
        approach: true,
        birthday: true,
        gender: true,
        region: true,
        language: true,
        emergencyContact: true,
        emergencyPhone: true,
        dataConsent: true,
        clinicianSharing: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json({
      success: true,
      data: { user },
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error during profile update',
    });
  }
};
