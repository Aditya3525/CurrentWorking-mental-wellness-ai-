import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Validation schemas (using simple validation since zod is not available)
const validateSearchParams = (query: any) => {
  const errors: string[] = [];
  
  if (query.page && (isNaN(parseInt(query.page)) || parseInt(query.page) < 1)) {
    errors.push('Page must be a positive number');
  }
  
  if (query.limit && (isNaN(parseInt(query.limit)) || parseInt(query.limit) < 1 || parseInt(query.limit) > 100)) {
    errors.push('Limit must be between 1 and 100');
  }
  
  if (query.type && !['video', 'audio', 'article', 'playlist'].includes(query.type)) {
    errors.push('Invalid content type');
  }
  
  if (query.difficulty && !['Beginner', 'Intermediate', 'Advanced'].includes(query.difficulty)) {
    errors.push('Invalid difficulty level');
  }
  
  if (query.sortBy && !['createdAt', 'viewCount', 'rating', 'title'].includes(query.sortBy)) {
    errors.push('Invalid sort field');
  }
  
  if (query.sortOrder && !['asc', 'desc'].includes(query.sortOrder)) {
    errors.push('Invalid sort order');
  }
  
  return errors;
};

// Utility functions
const buildContentWhere = (params: any) => {
  const where: any = { isPublished: true };

  if (params.search) {
    where.OR = [
      { title: { contains: params.search, mode: 'insensitive' } },
      { description: { contains: params.search, mode: 'insensitive' } },
      { content: { contains: params.search, mode: 'insensitive' } },
      { tags: { contains: params.search, mode: 'insensitive' } }
    ];
  }

  if (params.category) where.category = params.category;
  if (params.type) where.type = params.type;
  if (params.difficulty) where.difficulty = params.difficulty;
  if (params.approach) where.approach = params.approach;

  if (params.tags) {
    const tagArray = params.tags.split(',').map((tag: string) => tag.trim());
    where.OR = tagArray.map((tag: string) => ({
      tags: { contains: tag, mode: 'insensitive' }
    }));
  }

  if (params.duration) {
    // Duration filter for video/audio content
    where.duration = { not: null };
  }

  return where;
};

const getPersonalizedRecommendations = async (userId: string, limit: number = 5) => {
  try {
    // Get user's content recommendations
    const recommendations = await prisma.contentRecommendation.findMany({
      where: { 
        userId,
        viewed: false
      },
      include: {
        content: {
          include: {
            contentRatings: {
              select: { rating: true }
            }
          }
        }
      },
      orderBy: [
        { priority: 'asc' },
        { relevanceScore: 'desc' }
      ],
      take: limit
    });

    if (recommendations.length > 0) {
      return recommendations.map(r => r.content);
    }

    // Fallback to popular content if no personalized recommendations
    const popularContent = await prisma.content.findMany({
      where: { isPublished: true },
      orderBy: { viewCount: 'desc' },
      take: limit,
      include: {
        contentRatings: {
          select: { rating: true }
        }
      }
    });

    return popularContent;
  } catch (error) {
    console.error('Error getting personalized recommendations:', error);
    return [];
  }
};

export const listContent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validate query parameters
    const validationErrors = validateSearchParams(req.query);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: validationErrors
      });
    }

    const {
      page = '1',
      limit = '10',
      search,
      category,
      type,
      difficulty,
      approach,
      tags,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      duration
    } = req.query;

    const userId = (req as any).user?.id;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where = buildContentWhere({
      search, category, type, difficulty, approach, tags, duration
    });

    // Build orderBy
    let orderBy: any = {};
    switch (sortBy) {
      case 'viewCount':
        orderBy = { viewCount: sortOrder };
        break;
      case 'rating':
        orderBy = { rating: sortOrder };
        break;
      case 'title':
        orderBy = { title: sortOrder };
        break;
      default:
        orderBy = { createdAt: sortOrder };
    }

    const [content, total, recommendations] = await Promise.all([
      prisma.content.findMany({
        where,
        orderBy,
        skip,
        take: limitNum,
        include: {
          contentRatings: {
            select: { rating: true, review: true }
          }
        }
      }),
      prisma.content.count({ where }),
      // Get personalized recommendations if user is logged in
      userId ? getPersonalizedRecommendations(userId, 5) : []
    ]);

    // Calculate average ratings
    const contentWithRatings = content.map(item => {
      const ratings = item.contentRatings.map(r => r.rating);
      const averageRating = ratings.length > 0 
        ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length 
        : null;
      
      return {
        ...item,
        averageRating,
        ratingCount: ratings.length,
        contentRatings: undefined // Remove from response
      };
    });

    const totalPages = Math.ceil(total / limitNum);

    res.json({
      success: true,
      data: {
        content: contentWithRatings,
        recommendations,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages,
          hasNext: pageNum < totalPages,
          hasPrev: pageNum > 1
        },
        filters: {
          categories: await prisma.content.groupBy({
            by: ['category'],
            where: { isPublished: true },
            _count: { _all: true }
          }),
          types: await prisma.content.groupBy({
            by: ['type'],
            where: { isPublished: true },
            _count: { _all: true }
          })
        }
      }
    });

  } catch (error) {
    console.error('List content error:', error);
    next(error);
  }
};

export const getContentById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id;

    const content = await prisma.content.findUnique({
      where: { id },
      include: {
        contentRatings: {
          include: {
            user: {
              select: { name: true }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 5
        }
      }
    });

    if (!content || !content.isPublished) {
      return res.status(404).json({
        success: false,
        message: 'Content not found'
      });
    }

    // Increment view count
    await prisma.content.update({
      where: { id },
      data: { viewCount: { increment: 1 } }
    });

    // Track user activity if logged in
    if (userId) {
      await prisma.userActivity.create({
        data: {
          userId,
          action: 'content_viewed',
          details: JSON.stringify({
            contentId: id,
            contentTitle: content.title,
            contentType: content.type
          })
        }
      });

      // Mark recommendation as viewed if it exists
      await prisma.contentRecommendation.updateMany({
        where: { userId, contentId: id },
        data: { viewed: true }
      });
    }

    // Get user's rating if logged in
    let userRating = null;
    if (userId) {
      const rating = await prisma.contentRating.findUnique({
        where: {
          userId_contentId: { userId, contentId: id }
        }
      });
      userRating = rating;
    }

    // Calculate average rating
    const ratings = content.contentRatings.map(r => r.rating);
    const averageRating = ratings.length > 0 
      ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length 
      : null;

    // Get related content
    const relatedContent = await prisma.content.findMany({
      where: {
        isPublished: true,
        id: { not: id },
        OR: [
          { category: content.category },
          { type: content.type }
        ]
      },
      take: 5,
      orderBy: { viewCount: 'desc' },
      include: {
        contentRatings: {
          select: { rating: true }
        }
      }
    });

    const relatedWithRatings = relatedContent.map(item => {
      const itemRatings = item.contentRatings.map(r => r.rating);
      const itemAverageRating = itemRatings.length > 0 
        ? itemRatings.reduce((sum, rating) => sum + rating, 0) / itemRatings.length 
        : null;
      
      return {
        ...item,
        averageRating: itemAverageRating,
        ratingCount: itemRatings.length,
        contentRatings: undefined
      };
    });

    res.json({
      success: true,
      data: {
        content: {
          ...content,
          averageRating,
          ratingCount: ratings.length,
          contentRatings: content.contentRatings.map(r => ({
            rating: r.rating,
            review: r.review,
            userName: r.user.name,
            createdAt: r.createdAt
          }))
        },
        userRating,
        relatedContent: relatedWithRatings
      }
    });

  } catch (error) {
    console.error('Get content error:', error);
    next(error);
  }
};

export const searchContent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { q, category, type, difficulty } = req.query;

    if (!q || typeof q !== 'string' || q.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters long'
      });
    }

    const searchTerm = q.trim();
    const where: any = {
      isPublished: true,
      OR: [
        { title: { contains: searchTerm, mode: 'insensitive' } },
        { description: { contains: searchTerm, mode: 'insensitive' } },
        { content: { contains: searchTerm, mode: 'insensitive' } },
        { tags: { contains: searchTerm, mode: 'insensitive' } }
      ]
    };

    if (category) where.category = category;
    if (type) where.type = type;
    if (difficulty) where.difficulty = difficulty;

    const [results, suggestions] = await Promise.all([
      prisma.content.findMany({
        where,
        take: 20,
        orderBy: { viewCount: 'desc' },
        include: {
          contentRatings: {
            select: { rating: true }
          }
        }
      }),
      // Get search suggestions based on content titles and tags
      prisma.content.findMany({
        where: { 
          isPublished: true,
          OR: [
            { title: { contains: searchTerm, mode: 'insensitive' } },
            { tags: { contains: searchTerm, mode: 'insensitive' } }
          ]
        },
        select: { title: true, tags: true },
        take: 10
      })
    ]);

    // Extract unique suggestions
    const suggestionSet = new Set<string>();
    suggestions.forEach(item => {
      if (item.title.toLowerCase().includes(searchTerm.toLowerCase())) {
        suggestionSet.add(item.title);
      }
      if (item.tags) {
        const tags = item.tags.split(',').map(tag => tag.trim());
        tags.forEach(tag => {
          if (tag.toLowerCase().includes(searchTerm.toLowerCase())) {
            suggestionSet.add(tag);
          }
        });
      }
    });

    const resultsWithRatings = results.map(item => {
      const ratings = item.contentRatings.map(r => r.rating);
      const averageRating = ratings.length > 0 
        ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length 
        : null;
      
      return {
        ...item,
        averageRating,
        ratingCount: ratings.length,
        contentRatings: undefined
      };
    });

    res.json({
      success: true,
      data: {
        results: resultsWithRatings,
        suggestions: Array.from(suggestionSet).slice(0, 5),
        query: searchTerm,
        count: results.length
      }
    });

  } catch (error) {
    console.error('Search content error:', error);
    next(error);
  }
};

export const rateContent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { rating, review } = req.body;
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }

    // Verify content exists and is published
    const content = await prisma.content.findUnique({
      where: { id },
      select: { id: true, isPublished: true }
    });

    if (!content || !content.isPublished) {
      return res.status(404).json({
        success: false,
        message: 'Content not found'
      });
    }

    // Create or update rating
    const contentRating = await prisma.contentRating.upsert({
      where: {
        userId_contentId: { userId, contentId: id }
      },
      update: {
        rating: parseInt(rating),
        review: review || null,
        updatedAt: new Date()
      },
      create: {
        userId,
        contentId: id,
        rating: parseInt(rating),
        review: review || null
      }
    });

    // Update content's average rating
    const allRatings = await prisma.contentRating.findMany({
      where: { contentId: id },
      select: { rating: true }
    });

    const averageRating = allRatings.reduce((sum, r) => sum + r.rating, 0) / allRatings.length;

    await prisma.content.update({
      where: { id },
      data: {
        rating: averageRating,
        ratingCount: allRatings.length
      }
    });

    res.json({
      success: true,
      message: 'Rating submitted successfully',
      data: {
        rating: contentRating,
        averageRating,
        totalRatings: allRatings.length
      }
    });

  } catch (error) {
    console.error('Rate content error:', error);
    next(error);
  }
};

export const getContentCategories = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const [categories, types, approaches] = await Promise.all([
      prisma.content.groupBy({
        by: ['category'],
        where: { isPublished: true },
        _count: { _all: true },
        orderBy: { _count: { _all: 'desc' } }
      }),
      prisma.content.groupBy({
        by: ['type'],
        where: { isPublished: true },
        _count: { _all: true },
        orderBy: { _count: { _all: 'desc' } }
      }),
      prisma.content.groupBy({
        by: ['approach'],
        where: { isPublished: true },
        _count: { _all: true },
        orderBy: { _count: { _all: 'desc' } }
      })
    ]);

    res.json({
      success: true,
      data: {
        categories: categories.map(c => ({
          name: c.category,
          count: c._count._all
        })),
        types: types.map(t => ({
          name: t.type,
          count: t._count._all
        })),
        approaches: approaches.map(a => ({
          name: a.approach,
          count: a._count._all
        }))
      }
    });

  } catch (error) {
    console.error('Get categories error:', error);
    next(error);
  }
};

export const getUserRecommendations = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const { limit = '10' } = req.query;
    const limitNum = parseInt(limit as string);

    const recommendations = await getPersonalizedRecommendations(userId, limitNum);

    res.json({
      success: true,
      data: {
        recommendations
      }
    });

  } catch (error) {
    console.error('Get recommendations error:', error);
    next(error);
  }
};

const interactionSchema = z.object({
  type: z.enum(['view', 'like', 'unlike', 'bookmark', 'unbookmark', 'share', 'download']),
  contentId: z.string(),
  metadata: z.object({
    source: z.string().optional(),
    duration: z.number().optional(), // for view tracking
    position: z.number().optional(), // for video/audio position
    device: z.string().optional(),
    userAgent: z.string().optional()
  }).optional()
});

// Utility functions
const buildContentWhere = (params: any, userId?: string) => {
  const where: any = { isPublished: true };

  if (params.search) {
    where.OR = [
      { title: { contains: params.search, mode: 'insensitive' } },
      { shortDescription: { contains: params.search, mode: 'insensitive' } },
      { fullDescription: { contains: params.search, mode: 'insensitive' } },
      { tags: { hasSome: [params.search] } }
    ];
  }

  if (params.category) where.category = params.category;
  if (params.type) where.type = params.type;
  if (params.difficulty) where.difficulty = params.difficulty;
  if (params.featured !== undefined) where.isFeatured = params.featured === 'true';

  if (params.tags) {
    const tagArray = params.tags.split(',').map((tag: string) => tag.trim());
    where.tags = { hasSome: tagArray };
  }

  if (params.estimatedReadTime) {
    const [min, max] = params.estimatedReadTime.split('-').map(Number);
    where.estimatedReadTime = {};
    if (min) where.estimatedReadTime.gte = min;
    if (max) where.estimatedReadTime.lte = max;
  }

  return where;
};

const getPersonalizedRecommendations = async (userId: string, limit: number = 5) => {
  try {
    // Get user's interaction history
    const userInteractions = await prisma.contentInteraction.findMany({
      where: { userId },
      include: { content: true },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    // Get user's assessment results for personalization
    const userAssessments = await prisma.assessment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 1
    });

    const preferences = userAssessments[0]?.results || {};
    
    // Build recommendation query based on user preferences and interactions
    const contentTypes = userInteractions
      .map(i => i.content?.type)
      .filter(Boolean)
      .slice(0, 3); // Top 3 preferred types

    const categories = userInteractions
      .map(i => i.content?.category)
      .filter(Boolean)
      .slice(0, 3); // Top 3 preferred categories

    const where: any = {
      isPublished: true,
      id: {
        notIn: userInteractions.map(i => i.contentId)
      }
    };

    if (contentTypes.length > 0 || categories.length > 0) {
      where.OR = [];
      if (contentTypes.length > 0) {
        where.OR.push({ type: { in: contentTypes } });
      }
      if (categories.length > 0) {
        where.OR.push({ category: { in: categories } });
      }
    }

    // Add difficulty preference based on assessment
    if (preferences.experienceLevel) {
      where.difficulty = preferences.experienceLevel;
    }

    const recommendations = await prisma.content.findMany({
      where,
      orderBy: [
        { isFeatured: 'desc' },
        { views: { _count: 'desc' } },
        { createdAt: 'desc' }
      ],
      take: limit,
      include: {
        author: {
          select: { name: true }
        },
        _count: {
          select: { views: true, likes: true, bookmarks: true }
        }
      }
    });

    return recommendations;
  } catch (error) {
    console.error('Error getting personalized recommendations:', error);
    return [];
  }
};

export const listContent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedQuery = contentSearchSchema.parse(req.query);
    const userId = req.user?.id;

    const pageNum = parseInt(validatedQuery.page);
    const limitNum = parseInt(validatedQuery.limit);
    const skip = (pageNum - 1) * limitNum;

    const where = buildContentWhere(validatedQuery, userId);

    // Build orderBy
    let orderBy: any = {};
    switch (validatedQuery.sortBy) {
      case 'popularity':
        orderBy = { views: { _count: validatedQuery.sortOrder } };
        break;
      case 'rating':
        orderBy = { averageRating: validatedQuery.sortOrder };
        break;
      case 'title':
        orderBy = { title: validatedQuery.sortOrder };
        break;
      default:
        orderBy = { createdAt: validatedQuery.sortOrder };
    }

    const [content, total, featuredContent, recommendations] = await Promise.all([
      prisma.content.findMany({
        where,
        orderBy,
        skip,
        take: limitNum,
        include: {
          author: {
            select: { id: true, name: true }
          },
          _count: {
            select: { views: true, likes: true, bookmarks: true, comments: true }
          }
        }
      }),
      prisma.content.count({ where }),
      // Get featured content for homepage
      pageNum === 1 ? prisma.content.findMany({
        where: { isPublished: true, isFeatured: true },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          author: { select: { name: true } },
          _count: { select: { views: true, likes: true } }
        }
      }) : [],
      // Get personalized recommendations if user is logged in
      userId ? getPersonalizedRecommendations(userId, 5) : []
    ]);

    const totalPages = Math.ceil(total / limitNum);

    res.json({
      success: true,
      data: {
        content,
        featured: featuredContent,
        recommendations,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages,
          hasNext: pageNum < totalPages,
          hasPrev: pageNum > 1
        },
        filters: {
          categories: await prisma.content.groupBy({
            by: ['category'],
            where: { isPublished: true },
            _count: { _all: true }
          }),
          types: await prisma.content.groupBy({
            by: ['type'],
            where: { isPublished: true },
            _count: { _all: true }
          })
        }
      }
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Invalid query parameters',
        errors: error.errors
      });
    }
    next(error);
  }
};

export const getContentById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const content = await prisma.content.findUnique({
      where: { id },
      include: {
        author: {
          select: { id: true, name: true, email: true }
        },
        _count: {
          select: { views: true, likes: true, bookmarks: true, comments: true }
        }
      }
    });

    if (!content || !content.isPublished) {
      return res.status(404).json({
        success: false,
        message: 'Content not found'
      });
    }

    // Track view if user is logged in
    if (userId) {
      await prisma.contentInteraction.upsert({
        where: {
          userId_contentId_type: {
            userId,
            contentId: id,
            type: 'view'
          }
        },
        update: {
          createdAt: new Date()
        },
        create: {
          userId,
          contentId: id,
          type: 'view'
        }
      });
    }

    // Get user's interaction status
    let userInteractions = {};
    if (userId) {
      const interactions = await prisma.contentInteraction.findMany({
        where: { userId, contentId: id },
        select: { type: true }
      });
      
      userInteractions = {
        liked: interactions.some(i => i.type === 'like'),
        bookmarked: interactions.some(i => i.type === 'bookmark')
      };
    }

    // Get related content
    const relatedContent = await prisma.content.findMany({
      where: {
        isPublished: true,
        id: { not: id },
        OR: [
          { category: content.category },
          { type: content.type },
          { tags: { hasSome: content.tags || [] } }
        ]
      },
      take: 5,
      orderBy: { views: { _count: 'desc' } },
      include: {
        author: { select: { name: true } },
        _count: { select: { views: true, likes: true } }
      }
    });

    res.json({
      success: true,
      data: {
        content,
        userInteractions,
        relatedContent
      }
    });

  } catch (error) {
    next(error);
  }
};

export const searchContent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { q, category, type, difficulty } = req.query;

    if (!q || typeof q !== 'string' || q.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters long'
      });
    }

    const searchTerm = q.trim();
    const where: any = {
      isPublished: true,
      OR: [
        { title: { contains: searchTerm, mode: 'insensitive' } },
        { shortDescription: { contains: searchTerm, mode: 'insensitive' } },
        { fullDescription: { contains: searchTerm, mode: 'insensitive' } },
        { tags: { hasSome: [searchTerm] } }
      ]
    };

    if (category) where.category = category;
    if (type) where.type = type;
    if (difficulty) where.difficulty = difficulty;

    const [results, suggestions] = await Promise.all([
      prisma.content.findMany({
        where,
        take: 20,
        orderBy: [
          { isFeatured: 'desc' },
          { views: { _count: 'desc' } }
        ],
        include: {
          author: { select: { name: true } },
          _count: { select: { views: true, likes: true } }
        }
      }),
      // Get search suggestions based on tags
      prisma.content.findMany({
        where: { isPublished: true },
        select: { tags: true },
        take: 100
      }).then(contents => {
        const allTags = contents.flatMap(c => c.tags || []);
        const uniqueTags = [...new Set(allTags)];
        return uniqueTags
          .filter(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
          .slice(0, 5);
      })
    ]);

    res.json({
      success: true,
      data: {
        results,
        suggestions,
        query: searchTerm,
        count: results.length
      }
    });

  } catch (error) {
    next(error);
  }
};

export const trackContentInteraction = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = interactionSchema.parse(req.body);
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const { type, contentId, metadata } = validatedData;

    // Verify content exists and is published
    const content = await prisma.content.findUnique({
      where: { id: contentId },
      select: { id: true, isPublished: true }
    });

    if (!content || !content.isPublished) {
      return res.status(404).json({
        success: false,
        message: 'Content not found'
      });
    }

    // Handle different interaction types
    let result;
    switch (type) {
      case 'like':
        result = await prisma.contentInteraction.upsert({
          where: {
            userId_contentId_type: { userId, contentId, type: 'like' }
          },
          update: { createdAt: new Date() },
          create: {
            userId,
            contentId,
            type: 'like',
            metadata
          }
        });
        break;

      case 'unlike':
        result = await prisma.contentInteraction.deleteMany({
          where: { userId, contentId, type: 'like' }
        });
        break;

      case 'bookmark':
        result = await prisma.contentInteraction.upsert({
          where: {
            userId_contentId_type: { userId, contentId, type: 'bookmark' }
          },
          update: { createdAt: new Date() },
          create: {
            userId,
            contentId,
            type: 'bookmark',
            metadata
          }
        });
        break;

      case 'unbookmark':
        result = await prisma.contentInteraction.deleteMany({
          where: { userId, contentId, type: 'bookmark' }
        });
        break;

      case 'view':
      case 'share':
      case 'download':
        result = await prisma.contentInteraction.create({
          data: {
            userId,
            contentId,
            type,
            metadata
          }
        });
        break;

      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid interaction type'
        });
    }

    res.json({
      success: true,
      message: `${type} tracked successfully`,
      data: result
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

export const getUserBookmarks = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const { page = '1', limit = '10' } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const [bookmarks, total] = await Promise.all([
      prisma.contentInteraction.findMany({
        where: { userId, type: 'bookmark' },
        include: {
          content: {
            include: {
              author: { select: { name: true } },
              _count: { select: { views: true, likes: true } }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum
      }),
      prisma.contentInteraction.count({
        where: { userId, type: 'bookmark' }
      })
    ]);

    const totalPages = Math.ceil(total / limitNum);

    res.json({
      success: true,
      data: {
        bookmarks: bookmarks.map(b => b.content),
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

export const getContentCategories = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const categories = await prisma.content.groupBy({
      by: ['category'],
      where: { isPublished: true },
      _count: { _all: true },
      orderBy: { _count: { _all: 'desc' } }
    });

    const types = await prisma.content.groupBy({
      by: ['type'],
      where: { isPublished: true },
      _count: { _all: true },
      orderBy: { _count: { _all: 'desc' } }
    });

    res.json({
      success: true,
      data: {
        categories: categories.map(c => ({
          name: c.category,
          count: c._count._all
        })),
        types: types.map(t => ({
          name: t.type,
          count: t._count._all
        }))
      }
    });

  } catch (error) {
    next(error);
  }
};
