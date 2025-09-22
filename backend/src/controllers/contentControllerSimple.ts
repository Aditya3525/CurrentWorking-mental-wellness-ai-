import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const listContent = async (req: Request, res: Response) => {
  try {
    const {
      page = 1,
      limit = 12,
      category,
      type,
      difficulty,
      approach,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Build where clause
    const where: any = { isPublished: true };

    if (search) {
      where.OR = [
        { title: { contains: search as string } },
        { description: { contains: search as string } },
        { content: { contains: search as string } }
      ];
    }

    if (category) where.category = category as string;
    if (type) where.type = type as string;
    if (difficulty) where.difficulty = difficulty as string;
    if (approach) where.approach = approach as string;

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

    // Fetch content and total count
    const [content, total] = await Promise.all([
      prisma.content.findMany({
        where,
        orderBy,
        skip,
        take: limitNum,
        include: {
          contentRatings: {
            select: { rating: true }
          }
        }
      }),
      prisma.content.count({ where })
    ]);

    const totalPages = Math.ceil(total / limitNum);

    res.json({
      success: true,
      data: {
        content: content.map(item => ({
          ...item,
          averageRating: item.rating,
          isBookmarked: false // TODO: Implement user bookmarks
        })),
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
    console.error('Error listing content:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch content'
    });
  }
};

export const getContentById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const content = await prisma.content.findUnique({
      where: { id },
      include: {
        contentRatings: {
          select: { rating: true, review: true }
        }
      }
    });

    if (!content) {
      return res.status(404).json({
        success: false,
        error: 'Content not found'
      });
    }

    // Get related content (same category or approach)
    const relatedContent = await prisma.content.findMany({
      where: {
        AND: [
          { id: { not: id } },
          { isPublished: true },
          {
            OR: [
              { category: content.category },
              { approach: content.approach }
            ]
          }
        ]
      },
      take: 4,
      orderBy: { viewCount: 'desc' }
    });

    // Increment view count
    await prisma.content.update({
      where: { id },
      data: { viewCount: { increment: 1 } }
    });

    res.json({
      success: true,
      data: {
        content: {
          ...content,
          averageRating: content.rating
        },
        relatedContent
      }
    });
    return;
  } catch (error) {
    console.error('Error fetching content:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch content'
    });
  }
};

export const searchContent = async (req: Request, res: Response) => {
  try {
    const { q: query } = req.query;

    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Search query is required'
      });
    }

    const results = await prisma.content.findMany({
      where: {
        AND: [
          { isPublished: true },
          {
            OR: [
              { title: { contains: query as string } },
              { description: { contains: query as string } },
              { content: { contains: query as string } },
              { tags: { contains: query as string } }
            ]
          }
        ]
      },
      orderBy: { viewCount: 'desc' },
      take: 20
    });

    res.json({
      success: true,
      data: {
        results,
        suggestions: [], // TODO: Implement search suggestions
        query,
        count: results.length
      }
    });
    return;
  } catch (error) {
    console.error('Error searching content:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to search content'
    });
  }
};

export const rateContent = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const { rating, review } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        error: 'Rating must be between 1 and 5'
      });
    }

    // Check if content exists
    const content = await prisma.content.findUnique({
      where: { id }
    });

    if (!content) {
      return res.status(404).json({
        success: false,
        error: 'Content not found'
      });
    }

    // Upsert user rating
    await prisma.contentRating.upsert({
      where: {
        userId_contentId: {
          userId,
          contentId: id
        }
      },
      update: {
        rating,
        review: review || null
      },
      create: {
        userId,
        contentId: id,
        rating,
        review: review || null
      }
    });

    // Recalculate average rating
    const ratings = await prisma.contentRating.findMany({
      where: { contentId: id },
      select: { rating: true }
    });

    const averageRating = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;

    await prisma.content.update({
      where: { id },
      data: {
        rating: averageRating,
        ratingCount: ratings.length
      }
    });

    res.json({
      success: true,
      message: 'Rating submitted successfully',
      data: {
        rating: { rating, review },
        averageRating,
        totalRatings: ratings.length
      }
    });
    return;
  } catch (error) {
    console.error('Error rating content:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to submit rating'
    });
  }
};

export const getCategories = async (req: Request, res: Response) => {
  try {
    // Get unique categories, types, and approaches with counts
    const [categoryStats, typeStats, approachStats] = await Promise.all([
      prisma.content.groupBy({
        by: ['category'],
        where: { isPublished: true },
        _count: { category: true }
      }),
      prisma.content.groupBy({
        by: ['type'],
        where: { isPublished: true },
        _count: { type: true }
      }),
      prisma.content.groupBy({
        by: ['approach'],
        where: { isPublished: true },
        _count: { approach: true }
      })
    ]);

    res.json({
      success: true,
      data: {
        categories: categoryStats.map(stat => ({
          name: stat.category,
          count: stat._count.category
        })),
        types: typeStats.map(stat => ({
          name: stat.type,
          count: stat._count.type
        })),
        approaches: approachStats.map(stat => ({
          name: stat.approach,
          count: stat._count.approach
        }))
      }
    });
    return;
  } catch (error) {
    console.error('Error fetching categories:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch categories'
    });
  }
};