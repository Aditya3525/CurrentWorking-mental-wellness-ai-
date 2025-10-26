import { describe, expect, it } from 'vitest';

import {
  anxietyQuestionCount,
  anxietyQuestionIds,
  scoreAnxietyAssessment
} from '../src/services/assessments/anxietyAssessment';

type ResponseValue = string | number;

type ResponseMap = Record<string, ResponseValue>;

const buildResponses = (builder: (id: string, index: number) => ResponseValue): ResponseMap => {
  const ids = anxietyQuestionIds();
  return ids.reduce<ResponseMap>((acc, id, index) => {
    acc[id] = builder(id, index);
    return acc;
  }, {});
};

const reverseScoredIds = new Set(['anxiety_q5', 'anxiety_q7', 'anxiety_q10', 'anxiety_q19']);
const isReverseScored = (id: string) => reverseScoredIds.has(id);
const clamp = (value: number) => Math.max(0, Math.min(4, Math.round(value)));

describe('anxiety assessment scoring', () => {
  it('exposes the correct metadata', () => {
    expect(anxietyQuestionCount()).toBe(20);
    expect(anxietyQuestionIds()).toHaveLength(20);
  });

  it('returns minimum scores for calm responses', () => {
    const calmResponses = buildResponses((id) => clamp(isReverseScored(id) ? 4 : 0));
    const result = scoreAnxietyAssessment(calmResponses);

    expect(result.rawScore).toBe(0);
    expect(result.maxScore).toBe(80);
    expect(result.normalizedScoreRounded).toBe(0);
    expect(result.interpretation).toBe('Minimal anxiety');
  });

  it('returns maximum scores for activated responses', () => {
    const activatedResponses = buildResponses((id) => clamp(isReverseScored(id) ? 0 : 4));
    const result = scoreAnxietyAssessment(activatedResponses);

    expect(result.rawScore).toBe(80);
    expect(result.normalizedScoreRounded).toBe(100);
    expect(result.interpretation).toBe('Severe anxiety');
  });

  it('reduces score when reverse-scored answers are high', () => {
    const mixedResponses = buildResponses((id, index) => (isReverseScored(id) ? 4 : index % 5));
    const result = scoreAnxietyAssessment(mixedResponses);

    expect(result.rawScore).toBeLessThan(80);
  });

  it('normalises category breakdown values', () => {
    const mixedResponses = buildResponses((id, index) => (isReverseScored(id) ? 4 : index % 5));
    const result = scoreAnxietyAssessment(mixedResponses);

    expect(Object.keys(result.categoryBreakdown)).toEqual(
      expect.arrayContaining(['cognitive', 'physical', 'behavioral'])
    );

    Object.values(result.categoryBreakdown).forEach((entry) => {
      expect(entry.normalized).toBeGreaterThanOrEqual(0);
      expect(entry.normalized).toBeLessThanOrEqual(100);
    });
  });
});
