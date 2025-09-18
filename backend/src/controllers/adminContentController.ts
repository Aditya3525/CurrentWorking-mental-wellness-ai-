import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

// Validation schemas
const createContentSchema = z.object({
  title: z.string().min(1).max(200),
  shortDescription: z.string().min(1).max(300),
  fullDescription: z.string().min(1),
  category: z.string().min(1),
  type: z.enum(['article', 'video', 'audio', 'infographic', 'guide', 'quiz']),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
  estimatedReadTime: z.number().int().positive().optional(),
  tags: z.array(z.string()).optional(),
  isPublished: z.boolean().default(false),
  isFeatured: z.boolean().default(false),
  authorId: z.string().optional(),
  metadata: z.object({
    keywords: z.array(z.string()).optional(),
    targetAudience: z.array(z.string()).optional(),
    prerequisites: z.array(z.string()).optional(),
    learningObjectives: z.array(z.string()).optional(),
    references: z.array(z.string()).optional()
  }).optional()
});

const updateContentSchema = createContentSchema.partial();

const bulkOperationSchema = z.object({
  action: z.enum(['publish', 'unpublish', 'feature', 'unfeature', 'delete', 'update_category', 'add_tags', 'remove_tags']),
  contentIds: z.array(z.string()),
  data: z.any().optional() // For operations that need additional data
});

// File upload configuration
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp|pdf|mp4|mp3|wav|ogg/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

// Utility functions
const createSlug = (title: string): string => {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .trim();
};

const optimizeImage = async (buffer: Buffer, filename: string): Promise<{ buffer: Buffer; filename: string }> => {
  const ext = path.extname(filename).toLowerCase();
  
  if (['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) {
    const optimizedBuffer = await sharp(buffer)
      .resize(1920, 1080, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 80 })
      .toBuffer();
    
    return {
      buffer: optimizedBuffer,
      filename: filename.replace(/\.[^.]+$/, '.jpg')
    };
  }
  
  return { buffer, filename };
};

const saveFile = async (buffer: Buffer, filename: string, folder: string = 'content'): Promise<string> => {
  const uploadsDir = path.join(process.cwd(), 'uploads', folder);
  await fs.mkdir(uploadsDir, { recursive: true });
  
  const uniqueFilename = `${uuidv4()}-${filename}`;
  const filePath = path.join(uploadsDir, uniqueFilename);
  
  await fs.writeFile(filePath, buffer);
  
  return `/uploads/${folder}/${uniqueFilename}`;
};

// Controllers
export const createContent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = createContentSchema.parse(req.body);
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
    }

    // Check if user has admin role
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
    const existingContent = await prisma.content.findUnique({
      where: { slug }
    });

    if (existingContent) {
      return res.status(409).json({
        success: false,
        message: 'Content with this title already exists'
      });
    }

    const content = await prisma.content.create({
      data: {
        ...validatedData,
        slug,
        authorId: userId,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      include: {
        author: {
          select: { id: true, name: true, email: true }
        },
        _count: {
          select: { 
            views: true,
            likes: true,
            comments: true 
          }
        }
      }
    });

    // Log admin activity
    await prisma.adminActivity.create({
      data: {
        adminId: userId,
        action: 'CREATE_CONTENT',
        resourceType: 'CONTENT',
        resourceId: content.id,
        details: {
          title: content.title,
          type: content.type,
          category: content.category
        }
      }
    });

    res.status(201).json({
      success: true,
      message: 'Content created successfully',
      data: content
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

export const getContentList = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      page = '1',
      limit = '10',
      search,
      category,
      type,
      difficulty,
      status,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      authorId,
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
        { shortDescription: { contains: search as string, mode: 'insensitive' } },
        { tags: { hasSome: [search as string] } }
      ];
    }

    if (category) where.category = category;
    if (type) where.type = type;
    if (difficulty) where.difficulty = difficulty;
    if (authorId) where.authorId = authorId;
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

    // Build orderBy
    const orderBy: any = {};
    if (sortBy === 'popularity') {
      orderBy.views = { _count: sortOrder };
    } else if (sortBy === 'engagement') {
      orderBy.likes = { _count: sortOrder };
    } else {
      orderBy[sortBy as string] = sortOrder;
    }

    const [content, total] = await Promise.all([
      prisma.content.findMany({
        where,
        orderBy,
        skip,
        take: limitNum,
        include: {
          author: {
            select: { id: true, name: true, email: true }
          },
          _count: {
            select: { 
              views: true,
              likes: true,
              comments: true 
            }
          }
        }
      }),
      prisma.content.count({ where })
    ]);

    const totalPages = Math.ceil(total / limitNum);

    res.json({
      success: true,
      data: {
        content,
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

export const getContentById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const content = await prisma.content.findUnique({
      where: { id },
      include: {
        author: {
          select: { id: true, name: true, email: true }
        },
        _count: {
          select: { 
            views: true,
            likes: true,
            comments: true 
          }
        }
      }
    });

    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Content not found'
      });
    }

    res.json({
      success: true,
      data: content
    });

  } catch (error) {
    next(error);
  }
};

export const updateContent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const validatedData = updateContentSchema.parse(req.body);
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
    }

    // Check if content exists
    const existingContent = await prisma.content.findUnique({
      where: { id }
    });

    if (!existingContent) {
      return res.status(404).json({
        success: false,
        message: 'Content not found'
      });
    }

    // Generate new slug if title is being updated
    let updateData: any = { ...validatedData, updatedAt: new Date() };
    
    if (validatedData.title && validatedData.title !== existingContent.title) {
      const newSlug = createSlug(validatedData.title);
      
      // Check for duplicate slug
      const slugExists = await prisma.content.findFirst({
        where: { 
          slug: newSlug,
          id: { not: id }
        }
      });

      if (slugExists) {
        return res.status(409).json({
          success: false,
          message: 'Content with this title already exists'
        });
      }

      updateData.slug = newSlug;
    }

    const updatedContent = await prisma.content.update({
      where: { id },
      data: updateData,
      include: {
        author: {
          select: { id: true, name: true, email: true }
        },
        _count: {
          select: { 
            views: true,
            likes: true,
            comments: true 
          }
        }
      }
    });

    // Log admin activity
    await prisma.adminActivity.create({
      data: {
        adminId: userId,
        action: 'UPDATE_CONTENT',
        resourceType: 'CONTENT',
        resourceId: id,
        details: {
          title: updatedContent.title,
          changes: Object.keys(validatedData)
        }
      }
    });

    res.json({
      success: true,
      message: 'Content updated successfully',
      data: updatedContent
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

export const deleteContent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
    }

    // Check if content exists
    const existingContent = await prisma.content.findUnique({
      where: { id }
    });

    if (!existingContent) {
      return res.status(404).json({
        success: false,
        message: 'Content not found'
      });
    }

    // Delete associated files if any
    if (existingContent.thumbnailUrl) {
      try {
        const filePath = path.join(process.cwd(), existingContent.thumbnailUrl);
        await fs.unlink(filePath);
      } catch (error) {
        console.error('Error deleting thumbnail:', error);
      }
    }

    // Delete content
    await prisma.content.delete({
      where: { id }
    });

    // Log admin activity
    await prisma.adminActivity.create({
      data: {
        adminId: userId,
        action: 'DELETE_CONTENT',
        resourceType: 'CONTENT',
        resourceId: id,
        details: {
          title: existingContent.title,
          type: existingContent.type
        }
      }
    });

    res.json({
      success: true,
      message: 'Content deleted successfully'
    });

  } catch (error) {
    next(error);
  }
};

export const uploadContentFiles = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const uploadSingle = upload.single('file');
    
    uploadSingle(req, res, async (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          message: err.message
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded'
        });
      }

      const { buffer, originalname, mimetype } = req.file;
      const { folder = 'content' } = req.body;

      try {
        let fileBuffer = buffer;
        let filename = originalname;

        // Optimize images
        if (mimetype.startsWith('image/')) {
          const optimized = await optimizeImage(buffer, originalname);
          fileBuffer = optimized.buffer;
          filename = optimized.filename;
        }

        const fileUrl = await saveFile(fileBuffer, filename, folder);

        res.json({
          success: true,
          message: 'File uploaded successfully',
          data: {
            url: fileUrl,
            originalName: originalname,
            size: fileBuffer.length,
            mimeType: mimetype
          }
        });

      } catch (uploadError) {
        console.error('File upload error:', uploadError);
        res.status(500).json({
          success: false,
          message: 'Failed to save file'
        });
      }
    });

  } catch (error) {
    next(error);
  }
};

export const bulkContentOperations = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = bulkOperationSchema.parse(req.body);
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
    }

    const { action, contentIds, data } = validatedData;

    let updateData: any = {};
    let actionDescription = '';

    switch (action) {
      case 'publish':
        updateData = { isPublished: true };
        actionDescription = 'Published';
        break;
      case 'unpublish':
        updateData = { isPublished: false };
        actionDescription = 'Unpublished';
        break;
      case 'feature':
        updateData = { isFeatured: true };
        actionDescription = 'Featured';
        break;
      case 'unfeature':
        updateData = { isFeatured: false };
        actionDescription = 'Unfeatured';
        break;
      case 'update_category':
        if (!data?.category) {
          return res.status(400).json({
            success: false,
            message: 'Category is required for update_category action'
          });
        }
        updateData = { category: data.category };
        actionDescription = `Updated category to ${data.category}`;
        break;
      case 'add_tags':
        if (!data?.tags || !Array.isArray(data.tags)) {
          return res.status(400).json({
            success: false,
            message: 'Tags array is required for add_tags action'
          });
        }
        // This requires a more complex update for array fields
        const addTagsResult = await prisma.$transaction(
          contentIds.map(id => 
            prisma.content.update({
              where: { id },
              data: {
                tags: {
                  push: data.tags
                }
              }
            })
          )
        );
        
        // Log admin activity
        await prisma.adminActivity.create({
          data: {
            adminId: userId,
            action: 'BULK_UPDATE_CONTENT',
            resourceType: 'CONTENT',
            details: {
              action: 'add_tags',
              contentCount: contentIds.length,
              tags: data.tags
            }
          }
        });

        return res.json({
          success: true,
          message: `Added tags to ${contentIds.length} content items`,
          data: { updated: addTagsResult.length }
        });

      case 'delete':
        // Get content details before deletion for logging
        const contentToDelete = await prisma.content.findMany({
          where: { id: { in: contentIds } },
          select: { id: true, title: true, thumbnailUrl: true }
        });

        // Delete associated files
        for (const content of contentToDelete) {
          if (content.thumbnailUrl) {
            try {
              const filePath = path.join(process.cwd(), content.thumbnailUrl);
              await fs.unlink(filePath);
            } catch (error) {
              console.error('Error deleting file:', error);
            }
          }
        }

        // Delete content
        const deleteResult = await prisma.content.deleteMany({
          where: { id: { in: contentIds } }
        });

        // Log admin activity
        await prisma.adminActivity.create({
          data: {
            adminId: userId,
            action: 'BULK_DELETE_CONTENT',
            resourceType: 'CONTENT',
            details: {
              contentCount: deleteResult.count,
              titles: contentToDelete.map(c => c.title)
            }
          }
        });

        return res.json({
          success: true,
          message: `Deleted ${deleteResult.count} content items`,
          data: { deleted: deleteResult.count }
        });

      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid action'
        });
    }

    // For non-delete and non-add_tags actions
    if (action !== 'delete' && action !== 'add_tags') {
      const result = await prisma.content.updateMany({
        where: { id: { in: contentIds } },
        data: updateData
      });

      // Log admin activity
      await prisma.adminActivity.create({
        data: {
          adminId: userId,
          action: 'BULK_UPDATE_CONTENT',
          resourceType: 'CONTENT',
          details: {
            action,
            contentCount: result.count,
            actionDescription
          }
        }
      });

      res.json({
        success: true,
        message: `${actionDescription} ${result.count} content items`,
        data: { updated: result.count }
      });
    }

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

// Content analytics
export const getContentAnalytics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
    }

    const { timeframe = '30', contentId } = req.query;
    const days = parseInt(timeframe as string);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    let whereClause: any = {
      createdAt: { gte: startDate }
    };

    if (contentId) {
      whereClause.id = contentId;
    }

    const [
      totalContent,
      publishedContent,
      draftContent,
      featuredContent,
      contentByType,
      contentByCategory,
      recentViews,
      topContent
    ] = await Promise.all([
      prisma.content.count(),
      prisma.content.count({ where: { isPublished: true } }),
      prisma.content.count({ where: { isPublished: false } }),
      prisma.content.count({ where: { isFeatured: true } }),
      prisma.content.groupBy({
        by: ['type'],
        _count: { _all: true }
      }),
      prisma.content.groupBy({
        by: ['category'],
        _count: { _all: true }
      }),
      prisma.contentView.count({
        where: { createdAt: { gte: startDate } }
      }),
      prisma.content.findMany({
        take: 10,
        orderBy: {
          views: { _count: 'desc' }
        },
        include: {
          _count: {
            select: { views: true, likes: true }
          }
        }
      })
    ]);

    res.json({
      success: true,
      data: {
        overview: {
          total: totalContent,
          published: publishedContent,
          draft: draftContent,
          featured: featuredContent
        },
        distribution: {
          byType: contentByType,
          byCategory: contentByCategory
        },
        engagement: {
          recentViews,
          topContent
        },
        timeframe: `${days} days`
      }
    });

  } catch (error) {
    next(error);
  }
};

export default {
  createContent,
  getContentList,
  getContentById,
  updateContent,
  deleteContent,
  uploadContentFiles,
  bulkContentOperations,
  getContentAnalytics
};
