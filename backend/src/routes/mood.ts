import express from 'express';
import { authenticate } from '../middleware/auth';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// Get mood entries for authenticated user
router.get('/', authenticate as any, async (req: any, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized'
      });
    }
    
    const { limit = '30', startDate, endDate } = req.query;
    
    const where: any = { userId };
    
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate as string);
      if (endDate) where.createdAt.lte = new Date(endDate as string);
    }
    
    const moodEntries = await prisma.moodEntry.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit as string)
    });
    
    res.json({
      success: true,
      data: moodEntries
    });
  } catch (error) {
    console.error('Error fetching mood entries:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch mood entries'
    });
  }
});

// Log a new mood entry
router.post('/', authenticate as any, async (req: any, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized'
      });
    }
    
    const { mood, notes } = req.body;
    
    if (!mood) {
      return res.status(400).json({
        success: false,
        error: 'Mood is required'
      });
    }
    
    const moodEntry = await prisma.moodEntry.create({
      data: {
        userId,
        mood,
        notes
      }
    });
    
    res.status(201).json({
      success: true,
      data: moodEntry
    });
  } catch (error) {
    console.error('Error creating mood entry:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create mood entry'
    });
  }
});

export default router;
