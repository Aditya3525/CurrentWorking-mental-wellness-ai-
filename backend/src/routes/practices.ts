import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// Public: list published practices (optionally filter by type/difficulty)
router.get('/', async (req, res) => {
  try {
    const { type, difficulty, approach, format } = req.query;
    const where: any = { isPublished: true };
    if (type && typeof type === 'string') where.type = type;
    if (difficulty && typeof difficulty === 'string') where.difficulty = difficulty;
    if (approach && typeof approach === 'string') where.approach = approach;
    if (format && typeof format === 'string') where.format = format;

    const practices = await prisma.practice.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });

    res.json({ success: true, data: practices });
  } catch (error) {
    console.error('Public practices fetch error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch practices' });
  }
});

// Public: get single published practice
router.get('/:id', async (req, res) => {
  try {
    const practice = await prisma.practice.findFirst({
      where: { id: req.params.id, isPublished: true }
    });
    if (!practice) return res.status(404).json({ success: false, error: 'Practice not found' });
    res.json({ success: true, data: practice });
  } catch (error) {
    console.error('Public practice fetch error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch practice' });
  }
});

export default router;
