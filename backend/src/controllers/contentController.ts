import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { createRequestLogger } from '../utils/logger';

const prisma = new PrismaClient();

const CONTENT_FALLBACK_SUGGESTIONS = [
  {
    title: 'Two-minute grounding breath',
    description: 'Inhale for four counts, hold for four, and exhale for six to regulate your nervous system.',
    type: 'practice'
  },
  {
    title: 'Compassion pause',
    description: 'Place a hand on your heart, take three slow breaths, and say something kind to yourself.',
    type: 'exercise'
  },
  {
    title: 'Micro-journal prompt',
    description: 'Write down what feels heavy, what you need, and one small action you can take today.',
    type: 'suggestion'
  }
];

export const listContent = async (req: Request, res: Response) => {
  try {
    const { category, type, approach } = req.query;
    const where: any = {};
    if (category) where.category = category;
    if (type) where.type = type;
    if (approach) where.approach = approach;
    where.isPublished = true;

    const requestId = (req as any).id ?? res.locals.requestId;
    const log = createRequestLogger(requestId).child({ controller: 'content', action: 'listContent' });
    log.info({ filters: { category, type, approach } }, 'Fetching content catalogue');

    const items = await prisma.content.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100
    });
    
    if (items.length === 0) {
      log.warn({ filters: { category, type, approach } }, 'No content available for filters, returning fallback suggestions');
      res.json({
        success: true,
        data: items,
        fallback: {
          message: 'We are curating more resources for this focus area. Here are a few quick practices to try in the meantime.',
          suggestions: CONTENT_FALLBACK_SUGGESTIONS
        }
      });
      return;
    }

    log.info({ count: items.length }, 'Content catalogue returned');
    res.json({ success: true, data: items });
  } catch (e) {
    const requestId = (req as any).id ?? res.locals.requestId;
    const log = createRequestLogger(requestId).child({ controller: 'content', action: 'listContent' });
    log.error({ err: e }, 'Failed to list content');
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

export const getContentById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const requestId = (req as any).id ?? res.locals.requestId;
    const log = createRequestLogger(requestId).child({ controller: 'content', action: 'getContentById', contentId: id });
    const content = await prisma.content.findUnique({ where: { id } });
    if (!content || !content.isPublished) {
      log.warn('Content not found or unpublished');
      res.status(404).json({ success: false, error: 'Content not found' });
      return;
    }
    log.info('Content returned');
    res.json({ success: true, data: content });
  } catch (e) {
    const requestId = (req as any).id ?? res.locals.requestId;
    const log = createRequestLogger(requestId).child({ controller: 'content', action: 'getContentById', contentId: req.params?.id });
    log.error({ err: e }, 'Failed to fetch content item');
    res.status(500).json({ success: false, error: 'Server error' });
  }
};
