import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { llmService } from '../services/llmProvider';
import Joi from 'joi';

const prisma = new PrismaClient();

// Unified assessment catalog (source of truth for frontend)
// In future this could be persisted in DB; keeping static for now with richer metadata.
export const ASSESSMENT_CATALOG = [
  {
    id: 'anxiety',
    title: 'Anxiety Assessment',
    questions: 10,
    estimatedTime: '5-7 minutes',
    difficulty: 'Beginner',
    category: 'required',
    description: 'Helps identify anxiety patterns and symptom impact.'
  },
  {
    id: 'stress',
    title: 'Stress Assessment',
    questions: 12,
    estimatedTime: '5-8 minutes',
    difficulty: 'Beginner',
    category: 'required',
    description: 'Evaluates current stress load and coping capacity.'
  },
  {
    id: 'emotionalIntelligence',
    title: 'Emotional Intelligence Assessment',
    questions: 15,
    estimatedTime: '8-10 minutes',
    difficulty: 'Intermediate',
    category: 'recommended',
    description: 'Assesses awareness, regulation, and empathy dimensions.'
  },
  {
    id: 'overthinking',
    title: 'Overthinking Pattern Assessment',
    questions: 8,
    estimatedTime: '4-6 minutes',
    difficulty: 'Intermediate',
    category: 'recommended',
    description: 'Identifies rumination and cognitive looping patterns.'
  }
];

const submitSchema = Joi.object({
  assessmentType: Joi.string().valid(...ASSESSMENT_CATALOG.map(a => a.id)).required(),
  responses: Joi.alternatives(Joi.object(), Joi.array()).required(),
  score: Joi.number().min(0).max(100).required(),
  metadata: Joi.object().optional(),
  revisionReason: Joi.string().max(300).optional()
});

export const listAssessments = async (_req: Request, res: Response) => {
  res.json({ success: true, data: ASSESSMENT_CATALOG });
};

// In-memory question banks (should be persisted later). Keep IDs stable.
interface QuestionOption { value: string; label: string; score: number }
interface Question { id: string; text: string; subtext?: string; type: 'likert' | 'multiple-choice' | 'binary'; options: QuestionOption[] }
interface QuestionSet { id: string; title: string; description: string; estimatedTime: string; questions: Question[] }

const likert = (base: string, count: number, startIndex = 1, labels = ['Not at all','Several days','More than half the days','Nearly every day'], scores=[0,25,50,75]): Question[] =>
  Array.from({ length: count }).map((_, i) => ({
    id: `${base}_${i + startIndex}`,
    text: `${base.replace(/_/g,' ')} question ${i + 1}?`,
    type: 'likert',
    options: labels.map((l, idx) => ({ value: String(idx), label: l, score: scores[idx] || 0 }))
  }));

const QUESTION_BANK: Record<string, QuestionSet> = {
  anxiety: {
    id: 'anxiety',
    title: 'Anxiety Assessment',
    description: 'Identify anxiety patterns and triggers.',
    estimatedTime: '5-7 minutes',
    questions: [
      { id: 'anxiety_1', text: 'How often do you feel nervous, anxious, or on edge?', type: 'likert', options: likert('a1',1)[0].options },
      { id: 'anxiety_2', text: 'How often do you have trouble relaxing?', type: 'likert', options: likert('a2',1)[0].options },
      { id: 'anxiety_3', text: 'Do you worry too much about different things?', type: 'likert', options: likert('a3',1)[0].options },
      { id: 'anxiety_4', text: 'How often do you feel restless or find it hard to sit still?', type: 'likert', options: likert('a4',1)[0].options },
      { id: 'anxiety_5', text: 'Do you have trouble falling or staying asleep due to worry?', type: 'binary', options: [
        { value: 'no', label: 'No, my sleep is fine', score: 0 },
        { value: 'sometimes', label: 'Sometimes it affects my sleep', score: 50 },
        { value: 'yes', label: 'Yes, frequently affects my sleep', score: 100 }
      ]},
      { id: 'anxiety_6', text: 'How often do you experience physical symptoms when anxious?', type: 'likert', options: [
        { value: '0', label: 'Never', score: 0 },{ value: '1', label: 'Rarely', score: 20 },{ value: '2', label: 'Sometimes', score: 50 },{ value: '3', label: 'Often', score: 80 }
      ]},
      { id: 'anxiety_7', text: 'Do you avoid certain situations because they make you anxious?', type: 'multiple-choice', options: [
        { value: 'never', label: 'Never avoid situations', score: 0 },{ value: 'rarely', label: 'Rarely avoid situations', score: 25 },{ value: 'sometimes', label: 'Sometimes avoid situations', score: 50 },{ value: 'often', label: 'Often avoid situations', score: 75 },{ value: 'always', label: 'Frequently avoid situations', score: 100 }
      ]},
      { id: 'anxiety_8', text: 'Rate your overall anxiety level past two weeks.', type: 'likert', options: [
        { value: '1', label: 'Very low', score: 10 },{ value: '2', label: 'Low', score: 30 },{ value: '3', label: 'Moderate', score: 50 },{ value: '4', label: 'High', score: 70 },{ value: '5', label: 'Very high', score: 90 }
      ]},
      { id: 'anxiety_9', text: 'Do you feel like your worries are hard to control?', type: 'binary', options: [
        { value: 'no', label: 'I can usually manage', score: 0 },{ value: 'sometimes', label: 'Sometimes out of control', score: 50 },{ value: 'yes', label: 'Often uncontrollable', score: 100 }
      ]},
      { id: 'anxiety_10', text: 'How much do anxiety symptoms interfere with daily activities?', type: 'likert', options: [
        { value: '0', label: 'Not at all', score: 0 },{ value: '1', label: 'A little', score: 25 },{ value: '2', label: 'Moderately', score: 50 },{ value: '3', label: 'Quite a bit', score: 75 },{ value: '4', label: 'Extremely', score: 100 }
      ]}
    ]
  },
  stress: {
    id: 'stress',
    title: 'Stress Assessment',
    description: 'Evaluate current stress exposure and impact.',
    estimatedTime: '5-8 minutes',
    questions: [
      { id: 'stress_1', text: 'How often do you feel overwhelmed by responsibilities?', type: 'likert', options: likert('s1',1)[0].options },
      { id: 'stress_2', text: 'How frequently do you experience tension headaches or muscle tightness?', type: 'likert', options: likert('s2',1)[0].options },
      { id: 'stress_3', text: 'Difficulty relaxing after work or study?', type: 'likert', options: likert('s3',1)[0].options },
      { id: 'stress_4', text: 'Do daily tasks feel harder than they should?', type: 'likert', options: likert('s4',1)[0].options },
      { id: 'stress_5', text: 'Do you notice irritability linked to pressure?', type: 'likert', options: likert('s5',1)[0].options },
      { id: 'stress_6', text: 'Does stress affect your sleep quality?', type: 'likert', options: likert('s6',1)[0].options },
      ...likert('stress_placeholder',6,7)
    ]
  },
  emotionalIntelligence: {
    id: 'emotionalIntelligence',
    title: 'Emotional Intelligence Assessment',
    description: 'Measures awareness, regulation, empathy.',
    estimatedTime: '8-10 minutes',
    questions: [
      ...likert('self_awareness',5,1),
      ...likert('regulation',5,1),
      ...likert('empathy',5,1)
    ]
  },
  overthinking: {
    id: 'overthinking',
    title: 'Overthinking Pattern Assessment',
    description: 'Identifies rumination & looping thoughts.',
    estimatedTime: '4-6 minutes',
    questions: [
      { id: 'overthinking_1', text: 'How often do thoughts loop without resolution?', type: 'likert', options: likert('o1',1)[0].options },
      { id: 'overthinking_2', text: 'Do small issues expand into larger worries quickly?', type: 'likert', options: likert('o2',1)[0].options },
      ...likert('overthinking_placeholder',6,3)
    ]
  }
};

export const getAssessmentQuestions = async (req: Request, res: Response) => {
  try {
    const { type } = (req.params as any);
    const canonical = type === 'emotional-intelligence' ? 'emotionalIntelligence' : type;
    if (!QUESTION_BANK[canonical]) {
      res.status(404).json({ success: false, error: 'Assessment type not found' });
      return;
    }
  res.json({ success: true, data: QUESTION_BANK[canonical] });
  } catch (e) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

export const submitAssessment = async (req: any, res: Response) => {
  try {
    const { error } = submitSchema.validate(req.body);
    if (error) {
      res.status(400).json({ success: false, error: error.details[0].message });
      return;
    }

    const { assessmentType, responses, score, metadata, revisionReason } = req.body;
    const userId = req.user.id;
    console.log('[submitAssessment] incoming', { userId, assessmentType, score, responseCount: responses ? Object.keys(responses || {}).length : 0 });

    // Use a transaction to ensure atomic versioning changes.
  const result = await prisma.$transaction(async (tx) => {
      // Fetch current latest assessment of this type for user
      const previousLatest = await tx.assessment.findFirst({
        where: { userId, assessmentType, isLatest: true },
        orderBy: { completedAt: 'desc' }
      });

      let parentId: string | null = null;
      let newVersion = 1;
      if (previousLatest) {
        // Mark previous as not latest
        await tx.assessment.update({
          where: { id: previousLatest.id },
            data: { isLatest: false }
        });
        parentId = previousLatest.parentId || previousLatest.id;
        newVersion = (previousLatest.version || 1) + 1;
      }

      // Create new primary assessment record (insights placeholder for later update)
      let aiInsights: string | undefined = undefined;

      // Lightweight heuristic fallback if LLM fails or not configured
      const heuristicInsights = () => {
        if (score >= 70) return 'Elevated indicators suggest focusing on grounding and professional support consideration.';
        if (score >= 40) return 'Moderate patterns observed; consistent self-care routines may help stabilization.';
        return 'Current indicators are within a lower range; maintain supportive habits and monitoring.';
      };

      try {
        if (process.env.GEMINI_API_KEY_1 || process.env.OPENAI_API_KEY_1 || process.env.ANTHROPIC_API_KEY_1) {
          const previousScore = previousLatest ? previousLatest.score : null;
          const delta = previousScore !== null ? score - previousScore : null;
          const deltaText = delta === null ? 'First assessment for this type.' : `Previous: ${previousScore}/100 (change ${delta >= 0 ? '+' : ''}${delta}).`;
          const systemMsg = { role: 'system', content: 'You are a compassionate, non-diagnostic mental wellbeing assistant. Output exactly 4 concise sentences separated by newlines. No numbering, no lists.' } as any;
          const userMsg = { role: 'user', content: `Assessment Type: ${assessmentType}\nCurrent Score: ${score}/100\n${deltaText}\nWrite: (1) interpretation with trend context, (2) key emerging pattern or stability, (3) single actionable self-care suggestion, (4) encouraging reinforcement referencing progress or consistency.` } as any;
          const resp: any = await (llmService as any).generateResponse([systemMsg, userMsg]);
          const text = resp?.message?.content || resp?.content || '';
          if (text.trim()) aiInsights = text.trim();
        }
      } catch (_e) {
        aiInsights = undefined;
      }

      if (!aiInsights) aiInsights = heuristicInsights();

      const assessment = await tx.assessment.create({
        data: {
          userId,
          assessmentType,
          score,
          responses: JSON.stringify(responses),
          version: newVersion,
          isLatest: true,
          parentId: parentId || undefined,
          metadata: metadata ? JSON.stringify(metadata) : undefined,
          aiInsights
        }
      });
      console.log('[submitAssessment] created assessment', { id: assessment.id, assessmentType: assessment.assessmentType, version: assessment.version });

      // Snapshot into AssessmentVersion for immutable history
      await tx.assessmentVersion.create({
        data: {
          assessmentId: assessment.id,
          userId,
          version: assessment.version,
          assessmentType,
          score,
          responses: JSON.stringify(responses),
          aiInsights: assessment.aiInsights,
          changes: previousLatest ? JSON.stringify({ fromVersion: previousLatest.version }) : undefined,
          reason: revisionReason || (previousLatest ? 'retake' : 'initial'),
          modifiedBy: userId
        }
      });

      return assessment;
    });

    res.status(201).json({ success: true, data: { assessment: result } });
    console.log('[submitAssessment] success response sent', { id: result.id, assessmentType: result.assessmentType });
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
      take: 100
    });
    res.json({ success: true, data: history });
  } catch (e) {
    console.error('Get assessment history error', e);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

export const getAssessmentSummary = async (req: any, res: Response) => {
  try {
    const userId = req.user.id;
    // Fetch latest two versions per type for delta calculations
    const assessments = await prisma.assessment.findMany({
      where: { userId },
      orderBy: { completedAt: 'desc' }
    });
    const byType: Record<string, any[]> = {};
    assessments.forEach(a => {
      if (!byType[a.assessmentType]) byType[a.assessmentType] = [];
      if (byType[a.assessmentType].length < 2) {
        byType[a.assessmentType].push(a);
      }
    });
    const summary = Object.entries(byType).map(([type, list]) => {
      const latest = list[0];
      const previous = list[1];
      const change = previous ? latest.score - previous.score : 0;
      let direction: 'up' | 'down' | 'same' = 'same';
      if (change > 2) direction = 'up';
      else if (change < -2) direction = 'down';
      const risk = latest.score >= 70 ? 'high' : latest.score >= 40 ? 'moderate' : 'low';
      return {
        type,
        latest: { score: latest.score, completedAt: latest.completedAt, version: latest.version, aiInsights: latest.aiInsights },
        previous: previous ? { score: previous.score, completedAt: previous.completedAt, version: previous.version } : null,
        change,
        direction,
        risk
      };
    });
    res.json({ success: true, data: summary });
  } catch (e) {
    console.error('Get assessment summary error', e);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

export const getAssessmentTrends = async (req: any, res: Response) => {
  try {
    const userId = req.user.id;
    const records = await prisma.assessment.findMany({
      where: { userId },
      orderBy: { completedAt: 'asc' },
      select: { assessmentType: true, score: true, completedAt: true }
    });
    const byType: Record<string, { score: number; t: string }[]> = {};
    records.forEach(r => {
      if (!byType[r.assessmentType]) byType[r.assessmentType] = [];
      byType[r.assessmentType].push({ score: r.score, t: r.completedAt.toISOString() });
    });
    res.json({ success: true, data: byType });
  } catch (e) {
    console.error('Get assessment trends error', e);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};
