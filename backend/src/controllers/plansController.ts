import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import Joi from 'joi';

const prisma = new PrismaClient();

const progressSchema = Joi.object({
  progress: Joi.number().min(0).max(100).required()
});

export const getPersonalizedPlan = async (req: any, res: Response) => {
  try {
    const userId = req.user.id;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const approach = user?.approach || 'hybrid';

    // Fetch modules matching user approach or hybrid universal modules
    const modules = await prisma.planModule.findMany({
      where: { OR: [{ approach }, { approach: 'hybrid' }] },
      orderBy: { order: 'asc' }
    });

    // Fetch user progress
    const progress = await prisma.userPlanModule.findMany({ where: { userId } });
    const progressMap = new Map(progress.map(p => [p.moduleId, p]));

    const enriched = modules.map(m => ({
      ...m,
      userState: progressMap.get(m.id) || null
    }));

    res.json({ success: true, data: enriched });
  } catch (e) {
    console.error('Get personalized plan error', e);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

export const updateModuleProgress = async (req: any, res: Response) => {
  try {
    const { error } = progressSchema.validate(req.body);
    if (error) {
      res.status(400).json({ success: false, error: error.details[0].message });
      return;
    }
    const userId = req.user.id;
    const { moduleId } = req.params;
    const { progress } = req.body;

    const record = await prisma.userPlanModule.upsert({
      where: { userId_moduleId: { userId, moduleId } },
      update: { progress },
      create: { userId, moduleId, progress }
    });
    res.json({ success: true, data: record });
  } catch (e) {
    console.error('Update module progress error', e);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

export const completeModule = async (req: any, res: Response) => {
  try {
    const userId = req.user.id;
    const { moduleId } = req.params;
    const record = await prisma.userPlanModule.upsert({
      where: { userId_moduleId: { userId, moduleId } },
      update: { completed: true, progress: 100, completedAt: new Date() },
      create: { userId, moduleId, completed: true, progress: 100, completedAt: new Date() }
    });
    res.json({ success: true, data: record });
  } catch (e) {
    console.error('Complete module error', e);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};
