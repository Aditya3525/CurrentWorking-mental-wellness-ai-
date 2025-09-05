import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const listContent = async (req: Request, res: Response) => {
  try {
    const { category, type, approach } = req.query;
    const where: any = {};
    if (category) where.category = category;
    if (type) where.type = type;
    if (approach) where.approach = approach;
    where.isPublished = true;

    const items = await prisma.content.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100
    });
    res.json({ success: true, data: items });
  } catch (e) {
    console.error('List content error', e);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

export const getContentById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const content = await prisma.content.findUnique({ where: { id } });
    if (!content || !content.isPublished) {
      res.status(404).json({ success: false, error: 'Content not found' });
      return;
    }
    res.json({ success: true, data: content });
  } catch (e) {
    console.error('Get content error', e);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};
