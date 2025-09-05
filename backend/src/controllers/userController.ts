import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import Joi from 'joi';
import { AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();

// Dynamic age range (10-100 years)
const now = new Date();
const minBirthday = new Date(now.getFullYear() - 100, now.getMonth(), now.getDate()); // oldest allowed
const maxBirthday = new Date(now.getFullYear() - 10, now.getMonth(), now.getDate());  // youngest allowed

// Common birthday validator message
const birthdayField = Joi.date()
  .min(minBirthday)
  .max(maxBirthday)
  .optional()
  .messages({
    'date.min': 'Birthday indicates age over 100 - please enter a valid date',
    'date.max': 'You must be at least 10 years old to use this app',
  });

// Validation schemas
const updateProfileSchema = Joi.object({
  name: Joi.string().min(2).max(50).optional(),
  firstName: Joi.string().min(1).max(50).optional(),
  lastName: Joi.string().min(1).max(50).optional(),
  approach: Joi.string().valid('western', 'eastern', 'hybrid').optional(),
  birthday: birthdayField,
  gender: Joi.string().optional(),
  region: Joi.string().optional(),
  language: Joi.string().optional(),
  emergencyContact: Joi.string().optional(),
  emergencyPhone: Joi.string().optional(),
  dataConsent: Joi.boolean().optional(),
  clinicianSharing: Joi.boolean().optional(),
});

const onboardingSchema = Joi.object({
  firstName: Joi.string().min(1).max(50).optional(),
  lastName: Joi.string().min(1).max(50).optional(),
  birthday: birthdayField,
  gender: Joi.string().optional(),
  region: Joi.string().optional(),
  language: Joi.string().optional(),
  emergencyContact: Joi.string().optional(),
  emergencyPhone: Joi.string().optional(),
  approach: Joi.string().valid('western', 'eastern', 'hybrid').required(),
});

const moodSchema = Joi.object({
  mood: Joi.string().required(),
  notes: Joi.string().optional(),
});

// Update user profile
export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const { error } = updateProfileSchema.validate(req.body);
    if (error) {
      res.status(400).json({
        success: false,
        error: error.details[0].message,
      });
      return;
    }

    const userId = req.params.userId;
    
    // Ensure user can only update their own profile
    if (userId !== req.user?.id) {
      res.status(403).json({
        success: false,
        error: 'Not authorized to update this profile',
      });
      return;
    }

    const updates = req.body;
    // Normalize birthday if provided as string (e.g. '2006-05-03' or '03-05-2006')
    if (updates.birthday) {
      try {
        let dateInput = updates.birthday;
        if (typeof dateInput === 'string') {
          if (/^\d{2}-\d{2}-\d{4}$/.test(dateInput)) {
            const [dd, mm, yyyy] = dateInput.split('-');
            dateInput = `${yyyy}-${mm}-${dd}`;
          }
          const d = new Date(dateInput);
          if (!isNaN(d.getTime())) {
            const age = now.getFullYear() - d.getFullYear() - (now < new Date(now.getFullYear(), d.getMonth(), d.getDate()) ? 1 : 0);
            if (age < 10 || age > 100) {
              res.status(400).json({ success: false, error: 'Birthday must indicate age between 10 and 100 years' });
              return; // ensure early exit
            }
            updates.birthday = d;
          } else {
            delete updates.birthday;
          }
        }
      } catch {
        delete updates.birthday;
      }
    }
    
    const user = await prisma.user.update({
      where: { id: userId },
      data: updates,
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
      error: 'Server error',
    });
  }
};

// Complete onboarding
export const completeOnboarding = async (req: AuthRequest, res: Response) => {
  try {
    const { error } = onboardingSchema.validate(req.body);
    if (error) {
      res.status(400).json({
        success: false,
        error: error.details[0].message,
      });
      return;
    }

    const { 
      approach,
      firstName,
      lastName,
      birthday,
      gender,
      region,
      language,
      emergencyContact,
      emergencyPhone
    } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
      return;
    }

    // Prepare update data
    const updateData: any = {
      isOnboarded: true,
      approach,
    };

    // Add optional fields if provided
    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (birthday) {
      const d = new Date(birthday);
      if (!isNaN(d.getTime())) {
        const age = now.getFullYear() - d.getFullYear() - (now < new Date(now.getFullYear(), d.getMonth(), d.getDate()) ? 1 : 0);
        if (age < 10 || age > 100) {
          res.status(400).json({ success: false, error: 'Birthday must indicate age between 10 and 100 years' });
          return;
        }
        updateData.birthday = d;
      }
    }
    if (gender) updateData.gender = gender;
    if (region) updateData.region = region;
    if (language) updateData.language = language;
    if (emergencyContact) updateData.emergencyContact = emergencyContact;
    if (emergencyPhone) updateData.emergencyPhone = emergencyPhone;

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
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
    console.error('Complete onboarding error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
    });
  }
};

// Log mood entry
export const logMood = async (req: AuthRequest, res: Response) => {
  try {
    const { error } = moodSchema.validate(req.body);
    if (error) {
      res.status(400).json({
        success: false,
        error: error.details[0].message,
      });
      return;
    }

    const { mood, notes } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
      return;
    }

    const moodEntry = await prisma.moodEntry.create({
      data: {
        userId,
        mood,
        notes,
      },
    });

    res.json({
      success: true,
      data: { moodEntry },
    });
  } catch (error) {
    console.error('Log mood error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
    });
  }
};

// Get mood history
export const getMoodHistory = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
      return;
    }

    const limit = parseInt(req.query.limit as string) || 30;
    const offset = parseInt(req.query.offset as string) || 0;

    const moodEntries = await prisma.moodEntry.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    res.json({
      success: true,
      data: { moodEntries },
    });
  } catch (error) {
    console.error('Get mood history error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
    });
  }
};
