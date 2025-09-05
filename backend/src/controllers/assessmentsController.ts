import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import Joi from 'joi';

const prisma = new PrismaClient();

// Static catalog of supported assessments (could be stored in DB in future)
const ASSESSMENT_CATALOG = [
  { id: 'anxiety', title: 'Anxiety Assessment', questions: 10 },
  { id: 'stress', title: 'Stress Assessment', questions: 12 },
  { id: 'emotionalIntelligence', title: 'Emotional Intelligence Assessment', questions: 15 },
  { id: 'overthinking', title: 'Overthinking Pattern Assessment', questions: 8 }
];

const submitSchema = Joi.object({
  assessmentType: Joi.string().valid(...ASSESSMENT_CATALOG.map(a => a.id)).required(),
  responses: Joi.object().required(),
  score: Joi.number().min(0).max(100).required()
});

export const listAssessments = async (_req: Request, res: Response) => {
  res.json({ success: true, data: ASSESSMENT_CATALOG });
};

export const submitAssessment = async (req: any, res: Response) => {
  try {
    const { error } = submitSchema.validate(req.body);
    if (error) {
      res.status(400).json({ success: false, error: error.details[0].message });
      return;
    }

    const { assessmentType, responses, score } = req.body;
    const userId = req.user.id;

    const record = await prisma.assessment.create({
      data: {
        userId,
        assessmentType,
        score,
        responses: JSON.stringify(responses)
      }
    });

    res.status(201).json({ success: true, data: { assessment: record } });
  } catch (e) {
    console.error('Submit assessment error', e);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

export const getAssessmentHistory = async (req: any, res: Response) => {
  try {
    const userId = req.user.id;
    const history = await prisma.assessment.findMany({
      where: { userId },
      orderBy: { completedAt: 'desc' },
      take: 50
    });
    res.json({ success: true, data: history });
  } catch (e) {
    console.error('Get assessment history error', e);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};
