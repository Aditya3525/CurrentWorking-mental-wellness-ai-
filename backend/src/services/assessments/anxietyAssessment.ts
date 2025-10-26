export type AnxietyCategory = 'cognitive' | 'physical' | 'behavioral';

export interface AnxietyQuestion {
  id: string;
  index: number;
  category: AnxietyCategory;
  reverseScored?: boolean;
}

export interface AnxietyScoreSummary {
  rawScore: number;
  maxScore: number;
  normalizedScore: number;
  interpretation: string;
  categoryRaw: Record<AnxietyCategory, number>;
  categoryNormalized: Record<AnxietyCategory, number>;
  categoryInterpretations: Record<AnxietyCategory, string>;
  normalizedScoreRounded: number;
  categoryBreakdown: Record<AnxietyCategory, { raw: number; normalized: number; interpretation: string }>;
}

const QUESTIONS: AnxietyQuestion[] = [
  { id: 'anxiety_q1', index: 1, category: 'cognitive' },
  { id: 'anxiety_q2', index: 2, category: 'cognitive' },
  { id: 'anxiety_q3', index: 3, category: 'behavioral' },
  { id: 'anxiety_q4', index: 4, category: 'behavioral' },
  { id: 'anxiety_q5', index: 5, category: 'cognitive', reverseScored: true },
  { id: 'anxiety_q6', index: 6, category: 'behavioral' },
  { id: 'anxiety_q7', index: 7, category: 'behavioral', reverseScored: true },
  { id: 'anxiety_q8', index: 8, category: 'physical' },
  { id: 'anxiety_q9', index: 9, category: 'behavioral' },
  { id: 'anxiety_q10', index: 10, category: 'behavioral', reverseScored: true },
  { id: 'anxiety_q11', index: 11, category: 'physical' },
  { id: 'anxiety_q12', index: 12, category: 'cognitive' },
  { id: 'anxiety_q13', index: 13, category: 'physical' },
  { id: 'anxiety_q14', index: 14, category: 'cognitive' },
  { id: 'anxiety_q15', index: 15, category: 'cognitive' },
  { id: 'anxiety_q16', index: 16, category: 'physical' },
  { id: 'anxiety_q17', index: 17, category: 'physical' },
  { id: 'anxiety_q18', index: 18, category: 'cognitive' },
  { id: 'anxiety_q19', index: 19, category: 'cognitive', reverseScored: true },
  { id: 'anxiety_q20', index: 20, category: 'cognitive' }
];

const CATEGORY_QUESTION_COUNT: Record<AnxietyCategory, number> = QUESTIONS.reduce(
  (acc, question) => {
    acc[question.category] = (acc[question.category] ?? 0) + 1;
    return acc;
  },
  {
    cognitive: 0,
    physical: 0,
    behavioral: 0
  }
);

const MAX_SCORE_PER_QUESTION = 4;
const MAX_RAW_SCORE = QUESTIONS.length * MAX_SCORE_PER_QUESTION;

const clampScore = (value: number): number => {
  if (Number.isNaN(value)) return 0;
  if (value < 0) return 0;
  if (value > MAX_SCORE_PER_QUESTION) return MAX_SCORE_PER_QUESTION;
  return value;
};

const interpretAnxietyScore = (rawScore: number): string => {
  if (rawScore <= 15) return 'Minimal anxiety';
  if (rawScore <= 30) return 'Mild anxiety';
  if (rawScore <= 45) return 'Moderate anxiety';
  if (rawScore <= 60) return 'High anxiety';
  return 'Severe anxiety';
};

const categoryInterpretation = (category: AnxietyCategory, normalizedScore: number): string => {
  if (normalizedScore <= 20) {
    return `${categoryLabel(category)} responses show calm, steady patterns.`;
  }
  if (normalizedScore <= 40) {
    return `${categoryLabel(category)} responses suggest mild activation to monitor.`;
  }
  if (normalizedScore <= 60) {
    return `${categoryLabel(category)} responses point to moderate activation—consider supportive routines.`;
  }
  if (normalizedScore <= 80) {
    return `${categoryLabel(category)} responses reflect high activation—practice grounding strategies.`;
  }
  return `${categoryLabel(category)} responses highlight intense activation—seek extra support.`;
};

export const categoryLabel = (category: AnxietyCategory): string => {
  switch (category) {
    case 'cognitive':
      return 'Cognitive';
    case 'physical':
      return 'Physical';
    case 'behavioral':
      return 'Behavioral';
    default:
      return `${category}`.charAt(0).toUpperCase() + `${category}`.slice(1);
  }
};

export const validateAnxietyResponses = (responses: Record<string, unknown>): void => {
  const missing = QUESTIONS.filter((question) => !(question.id in responses));
  if (missing.length > 0) {
    throw new Error(`Missing responses for questions: ${missing.map((q) => q.id).join(', ')}`);
  }
};

export const scoreAnxietyAssessment = (
  responses: Record<string, unknown>
): AnxietyScoreSummary => {
  validateAnxietyResponses(responses);

  let rawScore = 0;
  const categoryRaw: Record<AnxietyCategory, number> = {
    cognitive: 0,
    physical: 0,
    behavioral: 0
  };

  for (const question of QUESTIONS) {
    const value = Number(responses[question.id]);
    const answer = clampScore(value);
    const scoredValue = question.reverseScored
      ? MAX_SCORE_PER_QUESTION - answer
      : answer;

    rawScore += scoredValue;
    categoryRaw[question.category] += scoredValue;
  }

  const normalizedScore = Math.round(((rawScore / MAX_RAW_SCORE) * 100) * 100) / 100;
  const categoryNormalized = (Object.keys(categoryRaw) as AnxietyCategory[]).reduce(
    (acc, category) => {
      const normalized = categoryRaw[category] / (CATEGORY_QUESTION_COUNT[category] * MAX_SCORE_PER_QUESTION) * 100;
      acc[category] = Math.round(normalized * 10) / 10;
      return acc;
    },
    {
      cognitive: 0,
      physical: 0,
      behavioral: 0
    } as Record<AnxietyCategory, number>
  );

  const categoryInterpretations = (Object.keys(categoryNormalized) as AnxietyCategory[]).reduce(
    (acc, category) => {
      acc[category] = categoryInterpretation(category, categoryNormalized[category]);
      return acc;
    },
    {
      cognitive: '',
      physical: '',
      behavioral: ''
    } as Record<AnxietyCategory, string>
  );

  const interpretation = interpretAnxietyScore(rawScore);

  const categoryBreakdown = (Object.keys(categoryRaw) as AnxietyCategory[]).reduce(
    (acc, category) => {
      acc[category] = {
        raw: Math.round(categoryRaw[category] * 10) / 10,
        normalized: categoryNormalized[category],
        interpretation: categoryInterpretations[category]
      };
      return acc;
    },
    {
      cognitive: { raw: 0, normalized: 0, interpretation: '' },
      physical: { raw: 0, normalized: 0, interpretation: '' },
      behavioral: { raw: 0, normalized: 0, interpretation: '' }
    } as Record<AnxietyCategory, { raw: number; normalized: number; interpretation: string }>
  );

  return {
    rawScore: Math.round(rawScore * 10) / 10,
    maxScore: MAX_RAW_SCORE,
    normalizedScore,
    normalizedScoreRounded: Math.round(normalizedScore * 10) / 10,
    interpretation,
    categoryRaw,
    categoryNormalized,
    categoryInterpretations,
    categoryBreakdown
  };
};

export const anxietyQuestionCount = () => QUESTIONS.length;
export const anxietyQuestionIds = () => QUESTIONS.map((question) => question.id);
