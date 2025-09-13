import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const listContent = async (req: Request, res: Response) => {
  try {
    const { 
      category, 
      type, 
      approach, 
      search,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      difficulty,
      severityLevel
    } = req.query;
    
    const where: any = { isPublished: true };

    // Simple equals filters
    if (category && category !== 'all') where.category = category;
    if (type && type !== 'all') where.type = type;
    if (difficulty && difficulty !== 'all') where.difficulty = difficulty;
    if (severityLevel && severityLevel !== 'all') where.severityLevel = severityLevel;

    // Approach: include content marked for 'all' when a specific approach is requested
    if (approach && approach !== 'all') {
      where.AND = [...(where.AND || []), { OR: [{ approach }, { approach: 'all' }] }];
    }

    // Text search
    if (search) {
      where.AND = [...(where.AND || []), {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { tags: { contains: search, mode: 'insensitive' } },
          { author: { contains: search, mode: 'insensitive' } },
        ]
      }];
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);

    const [items, total] = await Promise.all([
      prisma.content.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy as string]: sortOrder },
        select: {
          id: true,
          title: true,
          description: true,
          type: true,
          category: true,
          approach: true,
          duration: true,
          difficulty: true,
          tags: true,
          author: true,
          thumbnailUrl: true,
          rating: true,
          viewCount: true,
          severityLevel: true,
          externalUrl: true,
          fileUrl: true,
          createdAt: true,
          _count: {
            select: {
              contentRatings: true
            }
          }
        }
      }),
      prisma.content.count({ where })
    ]);

    res.json({ 
      success: true, 
      data: {
        content: items,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total,
          pages: Math.ceil(total / parseInt(limit as string))
        }
      }
    });
  } catch (e) {
    console.error('List content error', e);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

export const getContentById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const content = await prisma.content.findUnique({ 
      where: { id },
      include: {
        contentRatings: {
          select: {
            rating: true,
            review: true,
            createdAt: true,
            user: {
              select: {
                name: true,
                firstName: true,
                lastName: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        playlistItems: {
          include: {
            playlist: {
              select: {
                id: true,
                title: true,
                category: true,
                isPublished: true
              }
            }
          }
        }
      }
    });
    
    if (!content || !content.isPublished) {
      res.status(404).json({ success: false, error: 'Content not found' });
      return;
    }

    // Increment view count
    await prisma.content.update({
      where: { id },
      data: { viewCount: { increment: 1 } }
    });

    // Calculate average rating
    const averageRating = content.contentRatings.length > 0 
      ? content.contentRatings.reduce((sum, r) => sum + r.rating, 0) / content.contentRatings.length 
      : null;

    const enhancedContent = {
      ...content,
      averageRating,
      totalRatings: content.contentRatings.length,
      playlists: content.playlistItems
        .filter(item => item.playlist.isPublished)
        .map(item => item.playlist)
    };
    
    res.json({ success: true, data: enhancedContent });
  } catch (e) {
    console.error('Get content error', e);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

export const rateContent = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const { rating, review } = req.body;
    const userId = req.user.id;

    if (!rating || rating < 1 || rating > 5) {
      res.status(400).json({ 
        success: false, 
        error: 'Rating must be between 1 and 5' 
      });
      return;
    }

    // Check if content exists
    const content = await prisma.content.findUnique({
      where: { id, isPublished: true }
    });

    if (!content) {
      res.status(404).json({ success: false, error: 'Content not found' });
      return;
    }

    // Upsert rating
    const contentRating = await prisma.contentRating.upsert({
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
      data: {
        rating: contentRating,
        averageRating,
        totalRatings: allRatings.length
      }
    });
  } catch (error) {
    console.error('Rate content error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

export const getUserRating = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const rating = await prisma.contentRating.findUnique({
      where: {
        userId_contentId: {
          userId,
          contentId: id
        }
      }
    });

    res.json({ 
      success: true, 
      data: { rating } 
    });
  } catch (error) {
    console.error('Get user rating error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

export const listPlaylists = async (req: Request, res: Response) => {
  try {
    const { 
      category, 
      approach, 
      search,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      difficulty,
      severityLevel
    } = req.query;
    
    const where: any = { isPublished: true };

    if (category && category !== 'all') where.category = category;
    if (difficulty && difficulty !== 'all') where.difficulty = difficulty;
    if (severityLevel && severityLevel !== 'all') where.severityLevel = severityLevel;

    if (approach && approach !== 'all') {
      where.AND = [...(where.AND || []), { OR: [{ approach }, { approach: 'all' }] }];
    }

    if (search) {
      where.AND = [...(where.AND || []), {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { tags: { contains: search, mode: 'insensitive' } },
        ]
      }];
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);

    const [playlists, total] = await Promise.all([
      prisma.playlist.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy as string]: sortOrder },
        include: {
          items: {
            include: {
              content: {
                select: {
                  id: true,
                  title: true,
                  type: true,
                  duration: true,
                  thumbnailUrl: true,
                  isPublished: true
                }
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

    // Filter out unpublished content from playlists
    const enhancedPlaylists = playlists.map(playlist => ({
      ...playlist,
      items: playlist.items.filter(item => item.content.isPublished),
      itemCount: playlist.items.filter(item => item.content.isPublished).length,
      totalDuration: playlist.items
        .filter(item => item.content.isPublished)
        .reduce((total, item) => {
          const duration = item.content.duration;
          if (duration) {
            const minutes = parseInt(duration.replace(/\D/g, ''));
            return total + (minutes || 0);
          }
          return total;
        }, 0)
    }));

    res.json({ 
      success: true, 
      data: {
        playlists: enhancedPlaylists,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total,
          pages: Math.ceil(total / parseInt(limit as string))
        }
      }
    });
  } catch (error) {
    console.error('List playlists error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

export const getPlaylistById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const playlist = await prisma.playlist.findUnique({ 
      where: { id },
      include: {
        items: {
          include: {
            content: {
              select: {
                id: true,
                title: true,
                description: true,
                type: true,
                duration: true,
                difficulty: true,
                author: true,
                thumbnailUrl: true,
                rating: true,
                isPublished: true,
                content: true,
                externalUrl: true,
                fileUrl: true
              }
            }
          },
          orderBy: { order: 'asc' }
        },
        ratings: {
          select: {
            rating: true,
            review: true,
            createdAt: true,
            user: {
              select: {
                name: true,
                firstName: true,
                lastName: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    });
    
    if (!playlist || !playlist.isPublished) {
      res.status(404).json({ success: false, error: 'Playlist not found' });
      return;
    }

    // Increment view count
    await prisma.playlist.update({
      where: { id },
      data: { viewCount: { increment: 1 } }
    });

    // Filter out unpublished content
    const publishedItems = playlist.items.filter(item => item.content.isPublished);

    // Calculate average rating
    const averageRating = playlist.ratings.length > 0 
      ? playlist.ratings.reduce((sum, r) => sum + r.rating, 0) / playlist.ratings.length 
      : null;

    const totalDuration = publishedItems.reduce((total, item) => {
      const duration = item.content.duration;
      if (duration) {
        const minutes = parseInt(duration.replace(/\D/g, ''));
        return total + (minutes || 0);
      }
      return total;
    }, 0);

    const enhancedPlaylist = {
      ...playlist,
      items: publishedItems,
      itemCount: publishedItems.length,
      totalDuration,
      averageRating,
      totalRatings: playlist.ratings.length
    };
    
    res.json({ success: true, data: enhancedPlaylist });
  } catch (error) {
    console.error('Get playlist error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

export const ratePlaylist = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const { rating, review } = req.body;
    const userId = req.user.id;

    if (!rating || rating < 1 || rating > 5) {
      res.status(400).json({ 
        success: false, 
        error: 'Rating must be between 1 and 5' 
      });
      return;
    }

    // Check if playlist exists
    const playlist = await prisma.playlist.findUnique({
      where: { id, isPublished: true }
    });

    if (!playlist) {
      res.status(404).json({ success: false, error: 'Playlist not found' });
      return;
    }

    // Upsert rating
    const playlistRating = await prisma.playlistRating.upsert({
      where: {
        userId_playlistId: {
          userId,
          playlistId: id
        }
      },
      update: {
        rating,
        review: review || null
      },
      create: {
        userId,
        playlistId: id,
        rating,
        review: review || null
      }
    });

    // Update playlist's average rating
    const allRatings = await prisma.playlistRating.findMany({
      where: { playlistId: id },
      select: { rating: true }
    });

    const averageRating = allRatings.reduce((sum, r) => sum + r.rating, 0) / allRatings.length;

    await prisma.playlist.update({
      where: { id },
      data: { 
        rating: averageRating,
        ratingCount: allRatings.length
      }
    });

    res.json({ 
      success: true, 
      data: {
        rating: playlistRating,
        averageRating,
        totalRatings: allRatings.length
      }
    });
  } catch (error) {
    console.error('Rate playlist error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

export const getUserPlaylistRating = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const rating = await prisma.playlistRating.findUnique({
      where: {
        userId_playlistId: {
          userId,
          playlistId: id
        }
      }
    });

    res.json({ 
      success: true, 
      data: { rating } 
    });
  } catch (error) {
    console.error('Get user playlist rating error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

export const getPersonalizedRecommendations = async (req: any, res: Response) => {
  try {
    const userId = req.user.id;
    const { limit = 10, category, type } = req.query;

    // Get user profile for personalization
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        approach: true,
        assessments: {
          where: { isLatest: true },
          select: { assessmentType: true, score: true }
        }
      }
    });

    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }

    // Build recommendation query
    const where: any = { isPublished: true };
    
    if (category && category !== 'all') where.category = category;
    if (type && type !== 'all') where.type = type;

    // Prefer user's approach if set
    if (user.approach && user.approach !== 'all') {
      where.approach = {
        in: [user.approach, 'all', 'hybrid']
      };
    }

    // Get content with personalization scoring
    const content = await prisma.content.findMany({
      where,
      take: parseInt(limit as string) * 2, // Get more to allow for filtering
      orderBy: [
        { rating: 'desc' },
        { viewCount: 'desc' },
        { createdAt: 'desc' }
      ],
      select: {
        id: true,
        title: true,
        description: true,
        type: true,
        category: true,
        approach: true,
        duration: true,
        difficulty: true,
        tags: true,
        author: true,
        thumbnailUrl: true,
        rating: true,
        severityLevel: true,
        viewCount: true
      }
    });

    // Simple scoring algorithm (can be enhanced with ML later)
    const scoredContent = content.map(item => {
      let score = 0;
      
      // Approach match
      if (item.approach === user.approach) score += 3;
      else if (item.approach === 'hybrid') score += 2;
      else if (item.approach === 'all') score += 1;
      
      // Rating boost
      if (item.rating) score += item.rating;
      
      // Popularity boost
      score += Math.min(item.viewCount / 100, 2);
      
      // Assessment-based recommendations
      user.assessments.forEach(assessment => {
        if (assessment.assessmentType === 'anxiety' && item.category === 'Anxiety') {
          score += assessment.score > 15 ? 3 : 1;
        }
        if (assessment.assessmentType === 'stress' && item.category === 'Stress Management') {
          score += assessment.score > 20 ? 3 : 1;
        }
      });
      
      return { ...item, score };
    });

    // Sort by score and take top results
    const recommendations = scoredContent
      .sort((a, b) => b.score - a.score)
      .slice(0, parseInt(limit as string))
      .map(({ score, ...item }) => item);

    res.json({ 
      success: true, 
      data: {
        recommendations,
        userProfile: {
          approach: user.approach,
          assessmentCount: user.assessments.length
        }
      }
    });
  } catch (error) {
    console.error('Get personalized recommendations error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

export const searchContent = async (req: Request, res: Response) => {
  try {
    const { q, type, category, approach, page = 1, limit = 20 } = req.query;
    
    if (!q || (q as string).length < 2) {
      res.status(400).json({ 
        success: false, 
        error: 'Search query must be at least 2 characters long' 
      });
      return;
    }

    const where: any = { 
      isPublished: true,
      OR: [
        { title: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { tags: { contains: q, mode: 'insensitive' } },
        { author: { contains: q, mode: 'insensitive' } },
        { keywords: { contains: q, mode: 'insensitive' } },
      ]
    };
    
    if (type && type !== 'all') where.type = type;
    if (category && category !== 'all') where.category = category;
    if (approach && approach !== 'all') where.approach = approach;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);

    const [results, total] = await Promise.all([
      prisma.content.findMany({
        where,
        skip,
        take,
        orderBy: [
          { rating: 'desc' },
          { viewCount: 'desc' }
        ],
        select: {
          id: true,
          title: true,
          description: true,
          type: true,
          category: true,
          approach: true,
          duration: true,
          difficulty: true,
          tags: true,
          author: true,
          thumbnailUrl: true,
          rating: true,
          viewCount: true
        }
      }),
      prisma.content.count({ where })
    ]);

    res.json({ 
      success: true, 
      data: {
        results,
        query: q,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total,
          pages: Math.ceil(total / parseInt(limit as string))
        }
      }
    });
  } catch (error) {
    console.error('Search content error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};
