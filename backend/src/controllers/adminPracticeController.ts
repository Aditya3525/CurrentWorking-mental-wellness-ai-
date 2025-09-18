import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

// Validation schemas
const createPracticeSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1),
  shortDescription: z.string().min(1).max(300),
  type: z.enum(['meditation', 'breathing', 'mindfulness', 'movement']),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced', 'expert']),
  duration: z.number().int().positive(),
  instructor: z.string().min(1),
  category: z.string().min(1),
  isPublished: z.boolean().default(false),
  isFeatured: z.boolean().default(false),
  
  // Practice-specific content
  content: z.object({
    instructions: z.string().optional(),
    preparation: z.string().optional(),
    guidance: z.string().optional(),
    modifications: z.string().optional(),
    audioFiles: z.array(z.object({
      url: z.string(),
      title: z.string(),
      type: z.enum(['instruction', 'background', 'guidance', 'ambient']),
      duration: z.number().optional()
    })).optional(),
    visualAids: z.array(z.object({
      url: z.string(),
      type: z.enum(['image', 'video', 'diagram']),
      description: z.string(),
      altText: z.string()
    })).optional()
  }),
  
  // Practice steps (for structured practices)
  steps: z.array(z.object({
    order: z.number().int(),
    title: z.string(),
    description: z.string(),
    duration: z.number().optional(),
    breathingPattern: z.object({
      inhale: z.number(),
      hold: z.number(),
      exhale: z.number(),
      pause: z.number()
    }).optional(),
    instructions: z.string().optional()
  })).optional(),
  
  // Equipment and requirements
  equipment: z.object({
    essential: z.array(z.string()).optional(),
    recommended: z.array(z.string()).optional(),
    optional: z.array(z.string()).optional()
  }).optional(),
  
  // Space requirements
  spaceRequirements: z.object({
    indoor: z.boolean().default(true),
    outdoor: z.boolean().default(false),
    quietSpace: z.boolean().default(true),
    minimumSpace: z.string().optional(),
    surfaceType: z.array(z.string()).optional()
  }).optional(),
  
  // Benefits and outcomes
  benefits: z.array(z.object({
    category: z.string(),
    description: z.string(),
    evidenceLevel: z.enum(['high', 'moderate', 'limited', 'anecdotal'])
  })).optional(),
  
  // Safety information
  safety: z.object({
    contraindications: z.array(z.string()).optional(),
    precautions: z.array(z.string()).optional(),
    ageRecommendations: z.object({
      minimum: z.number().optional(),
      maximum: z.number().optional(),
      notes: z.string().optional()
    }).optional()
  }).optional(),
  
  // Metadata
  tags: z.array(z.string()).optional(),
  prerequisites: z.array(z.string()).optional(),
  targetAudience: z.array(z.string()).optional()
});

const updatePracticeSchema = createPracticeSchema.partial();

const createSeriesSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1),
  shortDescription: z.string().min(1).max(300),
  instructor: z.string().min(1),
  category: z.string().min(1),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced', 'expert']),
  estimatedDuration: z.number().int().positive(), // days
  
  // Series structure
  steps: z.array(z.object({
    practiceId: z.string(),
    order: z.number().int(),
    isRequired: z.boolean().default(true),
    unlockConditions: z.object({
      type: z.enum(['immediate', 'completion', 'time_delay', 'achievement']),
      value: z.number().optional(),
      previousStepId: z.string().optional()
    }),
    adaptiveSettings: z.object({
      canSkip: z.boolean().default(false),
      canRepeat: z.boolean().default(true),
      recommendationWeight: z.number().min(0).max(1)
    }),
    goals: z.array(z.string()).optional(),
    expectedOutcomes: z.array(z.string()).optional()
  })),
  
  // Progression rules
  progressionRules: z.array(z.object({
    type: z.enum(['linear', 'branching', 'adaptive', 'free_choice']),
    description: z.string(),
    conditions: z.object({
      minCompletionRate: z.number().optional(),
      minRating: z.number().optional(),
      requiredSteps: z.array(z.string()).optional(),
      timeConstraints: z.object({
        minDaysBetween: z.number().optional(),
        maxDaysBetween: z.number().optional()
      }).optional()
    }).optional()
  })).optional(),
  
  // Series settings
  goals: z.array(z.string()).optional(),
  benefits: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  prerequisites: z.array(z.string()).optional(),
  equipment: z.array(z.string()).optional(),
  timeCommitment: z.string().optional(),
  isPublic: z.boolean().default(false),
  allowSelfPaced: z.boolean().default(true),
  allowCustomOrder: z.boolean().default(false),
  enableCommunity: z.boolean().default(false),
  certificateEligible: z.boolean().default(false)
});

const updateSeriesSchema = createSeriesSchema.partial();

// Utility functions
const createSlug = (title: string): string => {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .trim();
};

// Controllers
export const createPractice = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = createPracticeSchema.parse(req.body);
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
    }

    // Check admin role
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    if (user?.role !== 'ADMIN') {
      return res.status(403).json({ 
        success: false, 
        message: 'Admin access required' 
      });
    }

    const slug = createSlug(validatedData.title);
    
    // Check for duplicate slug
    const existingPractice = await prisma.practice.findUnique({
      where: { slug }
    });

    if (existingPractice) {
      return res.status(409).json({
        success: false,
        message: 'Practice with this title already exists'
      });
    }

    const practice = await prisma.practice.create({
      data: {
        ...validatedData,
        slug,
        createdById: userId,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true }
        },
        _count: {
          select: { 
            sessions: true,
            favorites: true,
            ratings: true 
          }
        }
      }
    });

    // Log admin activity
    await prisma.adminActivity.create({
      data: {
        adminId: userId,
        action: 'CREATE_PRACTICE',
        resourceType: 'PRACTICE',
        resourceId: practice.id,
        details: {
          title: practice.title,
          type: practice.type,
          category: practice.category
        }
      }
    });

    res.status(201).json({
      success: true,
      message: 'Practice created successfully',
      data: practice
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors
      });
    }
    next(error);
  }
};

export const getPracticeList = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      page = '1',
      limit = '10',
      search,
      category,
      type,
      difficulty,
      status,
      instructor,
      duration,
      equipment,
      spaceType,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      featured
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Build where clause
    const where: any = {};

    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
        { instructor: { contains: search as string, mode: 'insensitive' } },
        { tags: { hasSome: [search as string] } }
      ];
    }

    if (category) where.category = category;
    if (type) where.type = type;
    if (difficulty) where.difficulty = difficulty;
    if (instructor) where.instructor = { contains: instructor as string, mode: 'insensitive' };
    if (featured !== undefined) where.isFeatured = featured === 'true';
    
    if (status) {
      switch (status) {
        case 'published':
          where.isPublished = true;
          break;
        case 'draft':
          where.isPublished = false;
          break;
      }
    }

    if (duration) {
      const [min, max] = (duration as string).split('-').map(Number);
      where.duration = {};
      if (min) where.duration.gte = min;
      if (max) where.duration.lte = max;
    }

    if (equipment) {
      where.OR = [
        { equipment: { path: ['essential'], array_contains: [equipment] } },
        { equipment: { path: ['recommended'], array_contains: [equipment] } },
        { equipment: { path: ['optional'], array_contains: [equipment] } }
      ];
    }

    if (spaceType) {
      switch (spaceType) {
        case 'indoor':
          where.spaceRequirements = { path: ['indoor'], equals: true };
          break;
        case 'outdoor':
          where.spaceRequirements = { path: ['outdoor'], equals: true };
          break;
        case 'quiet':
          where.spaceRequirements = { path: ['quietSpace'], equals: true };
          break;
      }
    }

    // Build orderBy
    const orderBy: any = {};
    if (sortBy === 'popularity') {
      orderBy.sessions = { _count: sortOrder };
    } else if (sortBy === 'rating') {
      orderBy.averageRating = sortOrder;
    } else {
      orderBy[sortBy as string] = sortOrder;
    }

    const [practices, total] = await Promise.all([
      prisma.practice.findMany({
        where,
        orderBy,
        skip,
        take: limitNum,
        include: {
          createdBy: {
            select: { id: true, name: true, email: true }
          },
          _count: {
            select: { 
              sessions: true,
              favorites: true,
              ratings: true 
            }
          }
        }
      }),
      prisma.practice.count({ where })
    ]);

    const totalPages = Math.ceil(total / limitNum);

    res.json({
      success: true,
      data: {
        practices,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages,
          hasNext: pageNum < totalPages,
          hasPrev: pageNum > 1
        }
      }
    });

  } catch (error) {
    next(error);
  }
};

export const getPracticeById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const practice = await prisma.practice.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true }
        },
        _count: {
          select: { 
            sessions: true,
            favorites: true,
            ratings: true 
          }
        },
        ratings: {
          select: {
            rating: true,
            comment: true,
            user: {
              select: { name: true }
            },
            createdAt: true
          },
          orderBy: { createdAt: 'desc' },
          take: 5
        }
      }
    });

    if (!practice) {
      return res.status(404).json({
        success: false,
        message: 'Practice not found'
      });
    }

    res.json({
      success: true,
      data: practice
    });

  } catch (error) {
    next(error);
  }
};

export const updatePractice = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const validatedData = updatePracticeSchema.parse(req.body);
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
    }

    // Check if practice exists
    const existingPractice = await prisma.practice.findUnique({
      where: { id }
    });

    if (!existingPractice) {
      return res.status(404).json({
        success: false,
        message: 'Practice not found'
      });
    }

    // Generate new slug if title is being updated
    let updateData: any = { ...validatedData, updatedAt: new Date() };
    
    if (validatedData.title && validatedData.title !== existingPractice.title) {
      const newSlug = createSlug(validatedData.title);
      
      // Check for duplicate slug
      const slugExists = await prisma.practice.findFirst({
        where: { 
          slug: newSlug,
          id: { not: id }
        }
      });

      if (slugExists) {
        return res.status(409).json({
          success: false,
          message: 'Practice with this title already exists'
        });
      }

      updateData.slug = newSlug;
    }

    const updatedPractice = await prisma.practice.update({
      where: { id },
      data: updateData,
      include: {
        createdBy: {
          select: { id: true, name: true, email: true }
        },
        _count: {
          select: { 
            sessions: true,
            favorites: true,
            ratings: true 
          }
        }
      }
    });

    // Log admin activity
    await prisma.adminActivity.create({
      data: {
        adminId: userId,
        action: 'UPDATE_PRACTICE',
        resourceType: 'PRACTICE',
        resourceId: id,
        details: {
          title: updatedPractice.title,
          changes: Object.keys(validatedData)
        }
      }
    });

    res.json({
      success: true,
      message: 'Practice updated successfully',
      data: updatedPractice
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors
      });
    }
    next(error);
  }
};

export const deletePractice = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
    }

    // Check if practice exists
    const existingPractice = await prisma.practice.findUnique({
      where: { id }
    });

    if (!existingPractice) {
      return res.status(404).json({
        success: false,
        message: 'Practice not found'
      });
    }

    // Check if practice is used in any series
    const seriesUsage = await prisma.practiceSeries.findFirst({
      where: {
        steps: {
          some: {
            practiceId: id
          }
        }
      }
    });

    if (seriesUsage) {
      return res.status(409).json({
        success: false,
        message: 'Cannot delete practice as it is used in practice series'
      });
    }

    // Delete associated files
    if (existingPractice.content && existingPractice.content.audioFiles) {
      for (const audioFile of existingPractice.content.audioFiles) {
        try {
          const filePath = path.join(process.cwd(), audioFile.url);
          await fs.unlink(filePath);
        } catch (error) {
          console.error('Error deleting audio file:', error);
        }
      }
    }

    if (existingPractice.content && existingPractice.content.visualAids) {
      for (const visual of existingPractice.content.visualAids) {
        try {
          const filePath = path.join(process.cwd(), visual.url);
          await fs.unlink(filePath);
        } catch (error) {
          console.error('Error deleting visual file:', error);
        }
      }
    }

    // Delete practice
    await prisma.practice.delete({
      where: { id }
    });

    // Log admin activity
    await prisma.adminActivity.create({
      data: {
        adminId: userId,
        action: 'DELETE_PRACTICE',
        resourceType: 'PRACTICE',
        resourceId: id,
        details: {
          title: existingPractice.title,
          type: existingPractice.type
        }
      }
    });

    res.json({
      success: true,
      message: 'Practice deleted successfully'
    });

  } catch (error) {
    next(error);
  }
};

export const createPracticeSeries = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = createSeriesSchema.parse(req.body);
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
    }

    // Check admin role
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    if (user?.role !== 'ADMIN') {
      return res.status(403).json({ 
        success: false, 
        message: 'Admin access required' 
      });
    }

    const slug = createSlug(validatedData.title);
    
    // Check for duplicate slug
    const existingSeries = await prisma.practiceSeries.findUnique({
      where: { slug }
    });

    if (existingSeries) {
      return res.status(409).json({
        success: false,
        message: 'Practice series with this title already exists'
      });
    }

    // Validate that all referenced practices exist
    const practiceIds = validatedData.steps.map(step => step.practiceId);
    const existingPractices = await prisma.practice.findMany({
      where: { id: { in: practiceIds } },
      select: { id: true }
    });

    if (existingPractices.length !== practiceIds.length) {
      return res.status(400).json({
        success: false,
        message: 'Some referenced practices do not exist'
      });
    }

    const series = await prisma.practiceSeries.create({
      data: {
        ...validatedData,
        slug,
        createdById: userId,
        status: 'draft',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true }
        },
        _count: {
          select: { 
            enrollments: true,
            completions: true 
          }
        }
      }
    });

    // Log admin activity
    await prisma.adminActivity.create({
      data: {
        adminId: userId,
        action: 'CREATE_PRACTICE_SERIES',
        resourceType: 'PRACTICE_SERIES',
        resourceId: series.id,
        details: {
          title: series.title,
          practiceCount: validatedData.steps.length,
          category: series.category
        }
      }
    });

    res.status(201).json({
      success: true,
      message: 'Practice series created successfully',
      data: series
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors
      });
    }
    next(error);
  }
};

export const updatePracticeSeries = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const validatedData = updateSeriesSchema.parse(req.body);
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
    }

    // Check if series exists
    const existingSeries = await prisma.practiceSeries.findUnique({
      where: { id }
    });

    if (!existingSeries) {
      return res.status(404).json({
        success: false,
        message: 'Practice series not found'
      });
    }

    // Generate new slug if title is being updated
    let updateData: any = { ...validatedData, updatedAt: new Date() };
    
    if (validatedData.title && validatedData.title !== existingSeries.title) {
      const newSlug = createSlug(validatedData.title);
      
      // Check for duplicate slug
      const slugExists = await prisma.practiceSeries.findFirst({
        where: { 
          slug: newSlug,
          id: { not: id }
        }
      });

      if (slugExists) {
        return res.status(409).json({
          success: false,
          message: 'Practice series with this title already exists'
        });
      }

      updateData.slug = newSlug;
    }

    // Validate practice IDs if steps are being updated
    if (validatedData.steps) {
      const practiceIds = validatedData.steps.map(step => step.practiceId);
      const existingPractices = await prisma.practice.findMany({
        where: { id: { in: practiceIds } },
        select: { id: true }
      });

      if (existingPractices.length !== practiceIds.length) {
        return res.status(400).json({
          success: false,
          message: 'Some referenced practices do not exist'
        });
      }
    }

    const updatedSeries = await prisma.practiceSeries.update({
      where: { id },
      data: updateData,
      include: {
        createdBy: {
          select: { id: true, name: true, email: true }
        },
        _count: {
          select: { 
            enrollments: true,
            completions: true 
          }
        }
      }
    });

    // Log admin activity
    await prisma.adminActivity.create({
      data: {
        adminId: userId,
        action: 'UPDATE_PRACTICE_SERIES',
        resourceType: 'PRACTICE_SERIES',
        resourceId: id,
        details: {
          title: updatedSeries.title,
          changes: Object.keys(validatedData)
        }
      }
    });

    res.json({
      success: true,
      message: 'Practice series updated successfully',
      data: updatedSeries
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors
      });
    }
    next(error);
  }
};

export const getPracticeAnalytics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
    }

    const { timeframe = '30', practiceId } = req.query;
    const days = parseInt(timeframe as string);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    let whereClause: any = {
      createdAt: { gte: startDate }
    };

    if (practiceId) {
      whereClause.id = practiceId;
    }

    const [
      totalPractices,
      publishedPractices,
      draftPractices,
      featuredPractices,
      practicesByType,
      practicesByDifficulty,
      recentSessions,
      topPractices,
      averageRatings
    ] = await Promise.all([
      prisma.practice.count(),
      prisma.practice.count({ where: { isPublished: true } }),
      prisma.practice.count({ where: { isPublished: false } }),
      prisma.practice.count({ where: { isFeatured: true } }),
      prisma.practice.groupBy({
        by: ['type'],
        _count: { _all: true }
      }),
      prisma.practice.groupBy({
        by: ['difficulty'],
        _count: { _all: true }
      }),
      prisma.practiceSession.count({
        where: { createdAt: { gte: startDate } }
      }),
      prisma.practice.findMany({
        take: 10,
        orderBy: {
          sessions: { _count: 'desc' }
        },
        include: {
          _count: {
            select: { sessions: true, favorites: true }
          }
        }
      }),
      prisma.practice.aggregate({
        _avg: { averageRating: true }
      })
    ]);

    res.json({
      success: true,
      data: {
        overview: {
          total: totalPractices,
          published: publishedPractices,
          draft: draftPractices,
          featured: featuredPractices,
          averageRating: averageRatings._avg.averageRating || 0
        },
        distribution: {
          byType: practicesByType,
          byDifficulty: practicesByDifficulty
        },
        engagement: {
          recentSessions,
          topPractices
        },
        timeframe: `${days} days`
      }
    });

  } catch (error) {
    next(error);
  }
};

export default {
  createPractice,
  getPracticeList,
  getPracticeById,
  updatePractice,
  deletePractice,
  createPracticeSeries,
  updatePracticeSeries,
  getPracticeAnalytics
};