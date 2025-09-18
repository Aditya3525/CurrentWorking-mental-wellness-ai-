import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Joi from 'joi';

const prisma = new PrismaClient();

// Validation schemas
const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
});

const contentSchema = Joi.object({
  title: Joi.string().min(1).max(200).required(),
  type: Joi.string().valid('video', 'audio', 'article', 'playlist').required(),
  category: Joi.string().valid('Mindfulness', 'Anxiety', 'Stress Management', 'Relaxation', 'Emotional Intelligence', 'Series').required(),
  approach: Joi.string().valid('western', 'eastern', 'hybrid', 'all').required(),
  content: Joi.string().required(),
  description: Joi.string().optional(),
  author: Joi.string().optional(),
  duration: Joi.string().optional(),
  difficulty: Joi.string().valid('Beginner', 'Intermediate', 'Advanced').optional(),
  tags: Joi.string().optional(),
  fileType: Joi.string().optional(),
  fileUrl: Joi.string().optional(),
  externalUrl: Joi.string().optional(),
  thumbnailUrl: Joi.string().optional(),
  severityLevel: Joi.string().valid('Mild', 'Moderate', 'Severe').optional(),
  targetAudience: Joi.string().optional(),
  effectiveness: Joi.number().min(0).max(5).optional(),
  prerequisites: Joi.string().optional(),
  outcomes: Joi.string().optional(),
  keywords: Joi.string().optional(),
  adminNotes: Joi.string().optional(),
  isPublished: Joi.boolean().default(false),
});

const playlistSchema = Joi.object({
  title: Joi.string().min(1).max(200).required(),
  description: Joi.string().optional(),
  category: Joi.string().valid('Mindfulness', 'Anxiety', 'Stress Management', 'Relaxation', 'Emotional Intelligence', 'Series').required(),
  approach: Joi.string().valid('western', 'eastern', 'hybrid', 'all').required(),
  difficulty: Joi.string().valid('Beginner', 'Intermediate', 'Advanced').optional(),
  tags: Joi.string().optional(),
  thumbnailUrl: Joi.string().optional(),
  severityLevel: Joi.string().valid('Mild', 'Moderate', 'Severe').optional(),
  adminNotes: Joi.string().optional(),
  isPublished: Joi.boolean().default(false),
});

// Helper function to log admin activities
const logAdminActivity = async (
  adminId: string,
  action: string,
  resource?: string,
  details?: any,
  ipAddress?: string
) => {
  try {
    await prisma.adminActivity.create({
      data: {
        adminId,
        action,
        resource,
        details: details ? JSON.stringify(details) : null,
        ipAddress,
      }
    });
  } catch (error) {
    console.error('Failed to log admin activity:', error);
  }
};

// Admin Authentication
export const adminLogin = async (req: Request, res: Response) => {
  try {
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      res.status(400).json({
        success: false,
        error: error.details[0].message,
      });
      return;
    }

    const { email, password } = value;

    // Find admin user
    const admin = await prisma.adminUser.findUnique({
      where: { email },
    });

    if (!admin || !admin.isActive) {
      res.status(401).json({
        success: false,
        error: 'Invalid credentials or inactive account',
      });
      return;
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, admin.password);
    if (!validPassword) {
      res.status(401).json({
        success: false,
        error: 'Invalid credentials',
      });
      return;
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: admin.id,
        email: admin.email,
        role: admin.role,
        type: 'admin'
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '8h' }
    );

    // Create session record
    await prisma.adminSession.create({
      data: {
        adminId: admin.id,
        token,
        expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000), // 8 hours
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      }
    });

    // Update last login
    await prisma.adminUser.update({
      where: { id: admin.id },
      data: { lastLoginAt: new Date() }
    });

    // Log activity
    await logAdminActivity(admin.id, 'login', undefined, { method: 'password' }, req.ip);

    res.json({
      success: true,
      data: {
        token,
        admin: {
          id: admin.id,
          email: admin.email,
          name: admin.name,
          role: admin.role,
        }
      }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error during login',
    });
  }
};

export const adminLogout = async (req: any, res: Response) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (token) {
      // Deactivate session
      await prisma.adminSession.updateMany({
        where: { token },
        data: { isActive: false }
      });
    }

    // Log activity
    if (req.admin?.id) {
      await logAdminActivity(req.admin.id, 'logout', undefined, {}, req.ip);
    }

    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Admin logout error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error during logout',
    });
  }
};

// Content Management
export const createContent = async (req: any, res: Response) => {
  try {
    const { error, value } = contentSchema.validate(req.body);
    if (error) {
      res.status(400).json({
        success: false,
        error: error.details[0].message,
      });
      return;
    }

    const content = await prisma.content.create({
      data: {
        ...value,
        createdBy: req.admin.id,
      }
    });

    // Log activity
    await logAdminActivity(
      req.admin.id,
      'create_content',
      content.id,
      { contentType: content.type, title: content.title },
      req.ip
    );

    res.status(201).json({
      success: true,
      data: content
    });
  } catch (error) {
    console.error('Create content error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error creating content',
    });
  }
};

export const updateContent = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const { error, value } = contentSchema.validate(req.body);
    if (error) {
      res.status(400).json({
        success: false,
        error: error.details[0].message,
      });
      return;
    }

    // Check if content exists
    const existingContent = await prisma.content.findUnique({
      where: { id }
    });

    if (!existingContent) {
      res.status(404).json({
        success: false,
        error: 'Content not found',
      });
      return;
    }

    const content = await prisma.content.update({
      where: { id },
      data: {
        ...value,
        lastEditedBy: req.admin.id,
      }
    });

    // Log activity
    await logAdminActivity(
      req.admin.id,
      'update_content',
      content.id,
      { contentType: content.type, title: content.title },
      req.ip
    );

    res.json({
      success: true,
      data: content
    });
  } catch (error) {
    console.error('Update content error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error updating content',
    });
  }
};

export const deleteContent = async (req: any, res: Response) => {
  try {
    const { id } = req.params;

    // Check if content exists and get details for logging
    const existingContent = await prisma.content.findUnique({
      where: { id }
    });

    if (!existingContent) {
      res.status(404).json({
        success: false,
        error: 'Content not found',
      });
      return;
    }

    // Delete content (this will cascade to playlist items and ratings)
    await prisma.content.delete({
      where: { id }
    });

    // Log activity
    await logAdminActivity(
      req.admin.id,
      'delete_content',
      id,
      { contentType: existingContent.type, title: existingContent.title },
      req.ip
    );

    res.json({
      success: true,
      message: 'Content deleted successfully'
    });
  } catch (error) {
    console.error('Delete content error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error deleting content',
    });
  }
};

export const listAllContent = async (req: any, res: Response) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      category, 
      type, 
      approach, 
      isPublished,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const where: any = {};
    
    if (category && category !== 'all') where.category = category;
    if (type && type !== 'all') where.type = type;
    if (approach && approach !== 'all') where.approach = approach;
    if (isPublished !== undefined) where.isPublished = isPublished === 'true';
    
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { tags: { contains: search, mode: 'insensitive' } },
        { author: { contains: search, mode: 'insensitive' } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const [content, total] = await Promise.all([
      prisma.content.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
        include: {
          playlistItems: {
            include: {
              playlist: {
                select: { id: true, title: true }
              }
            }
          },
          contentRatings: {
            select: {
              rating: true
            }
          },
          _count: {
            select: {
              contentRatings: true,
              recommendations: true
            }
          }
        }
      }),
      prisma.content.count({ where })
    ]);

    // Calculate average ratings
    const enhancedContent = content.map(item => ({
      ...item,
      averageRating: item.contentRatings.length > 0 
        ? item.contentRatings.reduce((sum, r) => sum + r.rating, 0) / item.contentRatings.length 
        : null,
      totalRatings: item.contentRatings.length,
      playlistCount: item.playlistItems.length,
      recommendationCount: item._count.recommendations,
      playlists: item.playlistItems.map(pi => pi.playlist)
    }));

    res.json({
      success: true,
      data: {
        content: enhancedContent,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('List content error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error listing content',
    });
  }
};

export const getContentById = async (req: any, res: Response) => {
  try {
    const { id } = req.params;

    const content = await prisma.content.findUnique({
      where: { id },
      include: {
        playlistItems: {
          include: {
            playlist: {
              select: { id: true, title: true, category: true }
            }
          }
        },
        contentRatings: {
          include: {
            user: {
              select: { id: true, name: true, firstName: true, lastName: true }
            }
          }
        },
        recommendations: {
          take: 5,
          orderBy: { recommendedAt: 'desc' },
          include: {
            user: {
              select: { id: true, name: true }
            }
          }
        }
      }
    });

    if (!content) {
      res.status(404).json({
        success: false,
        error: 'Content not found',
      });
      return;
    }

    // Calculate average rating
    const averageRating = content.contentRatings.length > 0 
      ? content.contentRatings.reduce((sum, r) => sum + r.rating, 0) / content.contentRatings.length 
      : null;

    const enhancedContent = {
      ...content,
      averageRating,
      totalRatings: content.contentRatings.length,
      playlists: content.playlistItems.map(pi => pi.playlist),
      recentRecommendations: content.recommendations
    };

    res.json({
      success: true,
      data: enhancedContent
    });
  } catch (error) {
    console.error('Get content error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error getting content',
    });
  }
};

// Playlist Management
export const createPlaylist = async (req: any, res: Response) => {
  try {
    const { error, value } = playlistSchema.validate(req.body);
    if (error) {
      res.status(400).json({
        success: false,
        error: error.details[0].message,
      });
      return;
    }

    const playlist = await prisma.playlist.create({
      data: {
        ...value,
        createdBy: req.admin.id,
      }
    });

    // Log activity
    await logAdminActivity(
      req.admin.id,
      'create_playlist',
      playlist.id,
      { title: playlist.title, category: playlist.category },
      req.ip
    );

    res.status(201).json({
      success: true,
      data: playlist
    });
  } catch (error) {
    console.error('Create playlist error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error creating playlist',
    });
  }
};

export const updatePlaylist = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const { error, value } = playlistSchema.validate(req.body);
    if (error) {
      res.status(400).json({
        success: false,
        error: error.details[0].message,
      });
      return;
    }

    // Check if playlist exists
    const existingPlaylist = await prisma.playlist.findUnique({
      where: { id }
    });

    if (!existingPlaylist) {
      res.status(404).json({
        success: false,
        error: 'Playlist not found',
      });
      return;
    }

    const playlist = await prisma.playlist.update({
      where: { id },
      data: {
        ...value,
        lastEditedBy: req.admin.id,
      }
    });

    // Log activity
    await logAdminActivity(
      req.admin.id,
      'update_playlist',
      playlist.id,
      { title: playlist.title, category: playlist.category },
      req.ip
    );

    res.json({
      success: true,
      data: playlist
    });
  } catch (error) {
    console.error('Update playlist error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error updating playlist',
    });
  }
};

export const deletePlaylist = async (req: any, res: Response) => {
  try {
    const { id } = req.params;

    // Check if playlist exists and get details for logging
    const existingPlaylist = await prisma.playlist.findUnique({
      where: { id }
    });

    if (!existingPlaylist) {
      res.status(404).json({
        success: false,
        error: 'Playlist not found',
      });
      return;
    }

    // Delete playlist (this will cascade to playlist items and ratings)
    await prisma.playlist.delete({
      where: { id }
    });

    // Log activity
    await logAdminActivity(
      req.admin.id,
      'delete_playlist',
      id,
      { title: existingPlaylist.title, category: existingPlaylist.category },
      req.ip
    );

    res.json({
      success: true,
      message: 'Playlist deleted successfully'
    });
  } catch (error) {
    console.error('Delete playlist error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error deleting playlist',
    });
  }
};

export const addContentToPlaylist = async (req: any, res: Response) => {
  try {
    const { playlistId, contentId } = req.params;
    const { order } = req.body;

    // Check if playlist and content exist
    const [playlist, content] = await Promise.all([
      prisma.playlist.findUnique({ where: { id: playlistId } }),
      prisma.content.findUnique({ where: { id: contentId } })
    ]);

    if (!playlist) {
      res.status(404).json({
        success: false,
        error: 'Playlist not found',
      });
      return;
    }

    if (!content) {
      res.status(404).json({
        success: false,
        error: 'Content not found',
      });
      return;
    }

    // Get the next order if not provided
    let itemOrder = order;
    if (!itemOrder) {
      const lastItem = await prisma.playlistItem.findFirst({
        where: { playlistId },
        orderBy: { order: 'desc' }
      });
      itemOrder = (lastItem?.order || 0) + 1;
    }

    // Add content to playlist
    const playlistItem = await prisma.playlistItem.upsert({
      where: {
        playlistId_contentId: {
          playlistId,
          contentId
        }
      },
      update: {
        order: itemOrder
      },
      create: {
        playlistId,
        contentId,
        order: itemOrder
      },
      include: {
        content: {
          select: { id: true, title: true, type: true, duration: true }
        }
      }
    });

    // Log activity
    await logAdminActivity(
      req.admin.id,
      'add_content_to_playlist',
      playlistId,
      { 
        contentId, 
        contentTitle: content.title, 
        playlistTitle: playlist.title,
        order: itemOrder 
      },
      req.ip
    );

    res.json({
      success: true,
      data: playlistItem
    });
  } catch (error) {
    console.error('Add content to playlist error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error adding content to playlist',
    });
  }
};

export const removeContentFromPlaylist = async (req: any, res: Response) => {
  try {
    const { playlistId, contentId } = req.params;

    // Check if the playlist item exists
    const playlistItem = await prisma.playlistItem.findUnique({
      where: {
        playlistId_contentId: {
          playlistId,
          contentId
        }
      },
      include: {
        playlist: { select: { title: true } },
        content: { select: { title: true } }
      }
    });

    if (!playlistItem) {
      res.status(404).json({
        success: false,
        error: 'Content not found in playlist',
      });
      return;
    }

    // Remove content from playlist
    await prisma.playlistItem.delete({
      where: {
        playlistId_contentId: {
          playlistId,
          contentId
        }
      }
    });

    // Log activity
    await logAdminActivity(
      req.admin.id,
      'remove_content_from_playlist',
      playlistId,
      { 
        contentId, 
        contentTitle: playlistItem.content.title, 
        playlistTitle: playlistItem.playlist.title 
      },
      req.ip
    );

    res.json({
      success: true,
      message: 'Content removed from playlist successfully'
    });
  } catch (error) {
    console.error('Remove content from playlist error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error removing content from playlist',
    });
  }
};

export const reorderPlaylistItems = async (req: any, res: Response) => {
  try {
    const { playlistId } = req.params;
    const { items } = req.body; // Array of { contentId, order }

    if (!Array.isArray(items)) {
      res.status(400).json({
        success: false,
        error: 'Items must be an array',
      });
      return;
    }

    // Update all items in a transaction
    await prisma.$transaction(
      items.map(({ contentId, order }) =>
        prisma.playlistItem.update({
          where: {
            playlistId_contentId: {
              playlistId,
              contentId
            }
          },
          data: { order }
        })
      )
    );

    // Log activity
    await logAdminActivity(
      req.admin.id,
      'reorder_playlist_items',
      playlistId,
      { itemCount: items.length },
      req.ip
    );

    res.json({
      success: true,
      message: 'Playlist items reordered successfully'
    });
  } catch (error) {
    console.error('Reorder playlist items error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error reordering playlist items',
    });
  }
};

export const listAllPlaylists = async (req: any, res: Response) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      category, 
      approach, 
      isPublished,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const where: any = {};
    
    if (category && category !== 'all') where.category = category;
    if (approach && approach !== 'all') where.approach = approach;
    if (isPublished !== undefined) where.isPublished = isPublished === 'true';
    
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { tags: { contains: search, mode: 'insensitive' } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const [playlists, total] = await Promise.all([
      prisma.playlist.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
        include: {
          items: {
            include: {
              content: {
                select: { id: true, title: true, type: true, duration: true }
              }
            },
            orderBy: { order: 'asc' }
          },
          _count: {
            select: {
              items: true,
              ratings: true
            }
          }
        }
      }),
      prisma.playlist.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        playlists,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('List playlists error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error listing playlists',
    });
  }
};

// Analytics and Dashboard
export const getDashboardStats = async (req: any, res: Response) => {
  try {
    const [
      totalContent,
      publishedContent,
      totalPlaylists,
      publishedPlaylists,
      totalUsers,
      recentActivity
    ] = await Promise.all([
      prisma.content.count(),
      prisma.content.count({ where: { isPublished: true } }),
      prisma.playlist.count(),
      prisma.playlist.count({ where: { isPublished: true } }),
      prisma.user.count(),
      prisma.adminActivity.findMany({
        take: 10,
        orderBy: { timestamp: 'desc' },
        include: {
          admin: {
            select: { name: true, email: true }
          }
        }
      })
    ]);

    // Get content by category
    const contentByCategory = await prisma.content.groupBy({
      by: ['category'],
      _count: true,
      where: { isPublished: true }
    });

    // Get content by type
    const contentByType = await prisma.content.groupBy({
      by: ['type'],
      _count: true,
      where: { isPublished: true }
    });

    // Get most popular content
    const popularContent = await prisma.content.findMany({
      take: 5,
      orderBy: { viewCount: 'desc' },
      where: { isPublished: true },
      select: {
        id: true,
        title: true,
        type: true,
        category: true,
        viewCount: true,
        rating: true
      }
    });

    res.json({
      success: true,
      data: {
        stats: {
          totalContent,
          publishedContent,
          totalPlaylists,
          publishedPlaylists,
          totalUsers
        },
        charts: {
          contentByCategory,
          contentByType
        },
        popularContent,
        recentActivity
      }
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error getting dashboard stats',
    });
  }
};

export const getContentAnalytics = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const { days = 30 } = req.query;

    const content = await prisma.content.findUnique({
      where: { id },
      include: {
        contentRatings: {
          where: {
            createdAt: {
              gte: new Date(Date.now() - parseInt(days) * 24 * 60 * 60 * 1000)
            }
          }
        },
        recommendations: {
          where: {
            recommendedAt: {
              gte: new Date(Date.now() - parseInt(days) * 24 * 60 * 60 * 1000)
            }
          },
          include: {
            user: {
              select: { approach: true, region: true }
            }
          }
        }
      }
    });

    if (!content) {
      res.status(404).json({
        success: false,
        error: 'Content not found',
      });
      return;
    }

    // Calculate analytics
    const averageRating = content.contentRatings.length > 0 
      ? content.contentRatings.reduce((sum, r) => sum + r.rating, 0) / content.contentRatings.length 
      : 0;

    const ratingDistribution = [1, 2, 3, 4, 5].map(rating => ({
      rating,
      count: content.contentRatings.filter(r => r.rating === rating).length
    }));

    const recommendationsByApproach = content.recommendations.reduce((acc, rec) => {
      const approach = rec.user.approach || 'unknown';
      acc[approach] = (acc[approach] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    res.json({
      success: true,
      data: {
        content: {
          id: content.id,
          title: content.title,
          type: content.type,
          category: content.category
        },
        analytics: {
          viewCount: content.viewCount,
          totalRatings: content.contentRatings.length,
          averageRating,
          ratingDistribution,
          totalRecommendations: content.recommendations.length,
          recommendationsByApproach
        }
      }
    });
  } catch (error) {
    console.error('Content analytics error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error getting content analytics',
    });
  }
};
