import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import Joi from 'joi';
import { llmService } from '../services/llmProvider';

const prisma = new PrismaClient();

// Static catalog of supported assessments (could be stored in DB in future)
const ASSESSMENT_CATALOG = [
  { id: 'anxiety', title: 'Anxiety Assessment', questions: 10 },
  { id: 'stress', title: 'Stress Level Check', questions: 18 },
  { id: 'emotionalIntelligence', title: 'Emotional Intelligence Assessment', questions: 28 },
  { id: 'overthinking', title: 'Overthinking Patterns', questions: 20 },
  { id: 'personality', title: 'Personality Type Assessment', questions: 25 },
  { id: 'trauma-fear', title: 'Trauma & Fear Response', questions: 22 },
  { id: 'archetypes', title: 'Psychological Archetypes', questions: 36 }
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

    // Create assessment record
    const record = await prisma.assessment.create({
      data: {
        userId,
        assessmentType,
        score,
        responses: JSON.stringify(responses)
      }
    });

    // Generate AI insights in the background
    try {
      // Get user basic data for insights
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          firstName: true,
          lastName: true,
          name: true,
          birthday: true,
          gender: true,
          approach: true,
          region: true
        }
      });

      if (user) {
        // Calculate age
        let age = null;
        if (user.birthday) {
          const birthDate = new Date(user.birthday);
          age = Math.floor((Date.now() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
        }

        // Create insight generation prompt
        const insightPrompt = `Generate brief, personalized insights for this assessment:

User: ${user.firstName || user.name || 'User'}, Age: ${age || 'Not specified'}, Approach: ${user.approach || 'Not specified'}

Assessment: ${assessmentType}, Score: ${score}
Responses: ${JSON.stringify(responses)}

Provide 2-3 sentences of supportive, actionable insights without being clinical.`;

        // Generate insights using AI
        const aiResponse = await llmService.generateResponse(
          [{ role: 'user', content: insightPrompt }],
          { maxTokens: 200, temperature: 0.7 }
        );

        // Update the assessment with insights
        await prisma.assessment.update({
          where: { id: record.id },
          data: { aiInsights: aiResponse.content }
        });
      }
    } catch (insightError) {
      console.error('Failed to generate insights:', insightError);
      // Don't fail the assessment submission if insights fail
    }

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

export const getLatestAssessment = async (req: any, res: Response) => {
  try {
    const userId = req.user.id;
    const latest = await prisma.assessment.findFirst({
      where: { userId },
      orderBy: { completedAt: 'desc' }
    });
    
    if (!latest) {
      res.status(404).json({ success: false, error: 'No assessments found' });
      return;
    }
    
    res.json({ success: true, data: latest });
  } catch (e) {
    console.error('Get latest assessment error', e);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};
