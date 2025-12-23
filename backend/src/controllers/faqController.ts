import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { createRequestLogger } from '../utils/logger';

/**
 * Get all published FAQs
 * GET /api/faq
 */
export const getFAQs = async (req: Request, res: Response) => {
  const requestId = (req as any).id ?? res.locals.requestId;
  const log = createRequestLogger(requestId).child({ 
    controller: 'faq', 
    action: 'getFAQs'
  });

  try {
    const category = req.query.category as string | undefined;

    const faqs = await prisma.fAQ.findMany({
      where: {
        isPublished: true,
        ...(category && { category: category as any })
      },
      orderBy: [
        { order: 'asc' },
        { viewCount: 'desc' }
      ],
      select: {
        id: true,
        question: true,
        answer: true,
        category: true,
        tags: true,
        helpful: true,
        notHelpful: true,
        viewCount: true
      }
    });

    log.info({ count: faqs.length, category }, 'Fetched FAQs');

    res.json({
      success: true,
      data: { faqs }
    });
  } catch (error) {
    log.error({ err: error }, 'Failed to fetch FAQs');
    res.status(500).json({ success: false, error: 'Failed to fetch FAQs' });
  }
};

/**
 * Search FAQs
 * GET /api/faq/search?q=query
 */
export const searchFAQs = async (req: Request, res: Response) => {
  const requestId = (req as any).id ?? res.locals.requestId;
  const log = createRequestLogger(requestId).child({ 
    controller: 'faq', 
    action: 'searchFAQs'
  });

  try {
    const query = req.query.q as string;

    if (!query || query.trim().length < 2) {
      res.json({
        success: true,
        data: { faqs: [] }
      });
      return;
    }

    const searchTerm = query.toLowerCase();

    const faqs = await prisma.fAQ.findMany({
      where: {
        isPublished: true,
        OR: [
          { question: { contains: searchTerm } },
          { answer: { contains: searchTerm } },
          { tags: { contains: searchTerm } }
        ]
      },
      orderBy: { viewCount: 'desc' },
      select: {
        id: true,
        question: true,
        answer: true,
        category: true,
        tags: true,
        helpful: true,
        notHelpful: true
      }
    });

    log.info({ query, resultCount: faqs.length }, 'FAQ search completed');

    res.json({
      success: true,
      data: { faqs }
    });
  } catch (error) {
    log.error({ err: error }, 'Failed to search FAQs');
    res.status(500).json({ success: false, error: 'Failed to search FAQs' });
  }
};

/**
 * Increment FAQ view count
 * POST /api/faq/:id/view
 */
export const incrementFAQView = async (req: Request, res: Response) => {
  const requestId = (req as any).id ?? res.locals.requestId;
  const log = createRequestLogger(requestId).child({ 
    controller: 'faq', 
    action: 'incrementView'
  });

  try {
    const { id } = req.params;

    await prisma.fAQ.update({
      where: { id },
      data: {
        viewCount: { increment: 1 }
      }
    });

    log.info({ faqId: id }, 'FAQ view incremented');

    res.json({
      success: true,
      message: 'View recorded'
    });
  } catch (error) {
    log.error({ err: error }, 'Failed to increment view');
    res.status(500).json({ success: false, error: 'Failed to record view' });
  }
};

/**
 * Vote on FAQ helpfulness
 * POST /api/faq/:id/vote
 */
export const voteFAQ = async (req: Request, res: Response) => {
  const requestId = (req as any).id ?? res.locals.requestId;
  const log = createRequestLogger(requestId).child({ 
    controller: 'faq', 
    action: 'voteFAQ'
  });

  try {
    const { id } = req.params;
    const { helpful } = req.body;

    if (typeof helpful !== 'boolean') {
      res.status(400).json({ success: false, error: 'Invalid vote value' });
      return;
    }

    await prisma.fAQ.update({
      where: { id },
      data: {
        [helpful ? 'helpful' : 'notHelpful']: { increment: 1 }
      }
    });

    log.info({ faqId: id, helpful }, 'FAQ vote recorded');

    res.json({
      success: true,
      message: 'Thank you for your feedback'
    });
  } catch (error) {
    log.error({ err: error }, 'Failed to record vote');
    res.status(500).json({ success: false, error: 'Failed to record vote' });
  }
};
