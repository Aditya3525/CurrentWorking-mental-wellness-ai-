import assert from 'assert';

import {
  anxietyQuestionCount,
  anxietyQuestionIds,
  scoreAnxietyAssessment
} from '../services/assessments/anxietyAssessment';

type ResponseValue = string | number;

type ResponseMap = Record<string, ResponseValue>;

const buildResponses = (builder: (id: string, index: number) => ResponseValue): ResponseMap => {
  const ids = anxietyQuestionIds();
  return ids.reduce<ResponseMap>((acc, id, index) => {
    acc[id] = builder(id, index);
    return acc;
  }, {});
};

const isReverseScored = (id: string): boolean => ['anxiety_q5', 'anxiety_q7', 'anxiety_q10', 'anxiety_q19'].includes(id);

const clamp = (value: number) => Math.max(0, Math.min(4, Math.round(value)));

// Test 1: Validate metadata
assert.strictEqual(anxietyQuestionCount(), 20, 'Anxiety assessment should include 20 questions');
assert.strictEqual(anxietyQuestionIds().length, 20, 'Question ID list should be 20 long');

// Test 2: All minimal answers
const calmResponses = buildResponses((id) => clamp(isReverseScored(id) ? 4 : 0));
const calmResult = scoreAnxietyAssessment(calmResponses);
assert.strictEqual(calmResult.rawScore, 0, 'Raw score should be 0 when all responses are minimal');
assert.strictEqual(calmResult.maxScore, 80, 'Max score should be 80 for 20 questions on a 0-4 scale');
assert.strictEqual(calmResult.normalizedScoreRounded, 0, 'Normalized score should be zero for calm responses');
assert.strictEqual(calmResult.interpretation, 'Minimal anxiety', 'Interpretation should match minimal anxiety band');

// Test 3: High anxiety pattern (agree with activating statements, disagree with reverse-scored)
const activatedResponses = buildResponses((id) => clamp(isReverseScored(id) ? 0 : 4));
const activatedResult = scoreAnxietyAssessment(activatedResponses);
assert.strictEqual(activatedResult.rawScore, 80, 'Raw score should reach maximum when anxiety responses are high');
assert.strictEqual(activatedResult.normalizedScoreRounded, 100, 'Normalized score should be 100 at maximum activation');
assert.strictEqual(activatedResult.interpretation, 'Severe anxiety', 'Interpretation should indicate severe anxiety');

// Test 4: Reverse scoring sanity check
const mixedResponses = buildResponses((id, index) => (isReverseScored(id) ? 4 : index % 5));
const mixedResult = scoreAnxietyAssessment(mixedResponses);
assert.ok(mixedResult.rawScore < 80, 'Reverse scored answers should reduce total raw score when selected with high values');

// Test 5: Category breakdown normalization
const breakdownKeys = Object.keys(mixedResult.categoryBreakdown);
assert.deepStrictEqual(new Set(breakdownKeys), new Set(['cognitive', 'physical', 'behavioral']), 'Category breakdown should include cognitive, physical, and behavioral keys');
breakdownKeys.forEach((key) => {
  const entry = mixedResult.categoryBreakdown[key as keyof typeof mixedResult.categoryBreakdown];
  assert.ok(entry.normalized >= 0 && entry.normalized <= 100, `Category ${key} normalized score should be within 0-100`);
});

console.log('✅ Anxiety assessment scoring tests passed');
