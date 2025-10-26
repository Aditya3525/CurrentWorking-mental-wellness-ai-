/**
 * Progress Component - Function Testing Script
 * 
 * This script tests all helper functions in the Progress component
 * to ensure they handle edge cases correctly.
 */

console.log('🧪 Starting Progress Component Function Tests...\n');

// ============================================================================
// TEST DATA
// ============================================================================

// Generate dynamic dates relative to today
const generateMoodEntry = (id, mood, emoji, daysAgo) => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  const dateStr = date.toISOString().split('T')[0];
  return {
    id,
    mood,
    emoji,
    date: dateStr,
    createdAt: date.toISOString()
  };
};

const testMoodEntries = [
  generateMoodEntry(1, 'Great', '�', 0),  // Today
  generateMoodEntry(2, 'Good', '😊', 1),   // Yesterday
  generateMoodEntry(3, 'Okay', '�', 2),   // 2 days ago
  generateMoodEntry(4, 'Good', '😊', 3),   // 3 days ago
  generateMoodEntry(5, 'Struggling', '😔', 5),  // 5 days ago (gap here)
  generateMoodEntry(6, 'Anxious', '😰', 6),     // 6 days ago
];

const emptyMoodEntries = [];

const singleMoodEntry = [
  generateMoodEntry(1, 'Great', '😄', 0)  // Today
];

// ============================================================================
// HELPER FUNCTIONS (Copied from Progress.tsx)
// ============================================================================

const DAY_IN_MS = 24 * 60 * 60 * 1000;

const MOOD_SCORES = {
  Great: 5,
  Good: 4,
  Okay: 3,
  Struggling: 2,
  Anxious: 1
};

const toStartOfDay = (date) => {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy.getTime();
};

const calculateCurrentStreak = (entries) => {
  if (!entries.length) return 0;
  const uniqueDays = Array.from(new Set(entries.map((entry) => toStartOfDay(new Date(entry.createdAt))))).sort((a, b) => b - a);
  if (!uniqueDays.length) return 0;

  const todayStart = toStartOfDay(new Date());
  if (todayStart - uniqueDays[0] > DAY_IN_MS * 1.5) {
    return 0;
  }

  let streak = 1;
  for (let i = 1; i < uniqueDays.length; i += 1) {
    const diff = uniqueDays[i - 1] - uniqueDays[i];
    if (diff > DAY_IN_MS * 1.5) break;
    streak += 1;
  }
  return streak;
};

const calculateLongestStreak = (entries) => {
  if (!entries.length) return 0;
  const uniqueDays = Array.from(new Set(entries.map((entry) => toStartOfDay(new Date(entry.createdAt))))).sort((a, b) => a - b);
  if (uniqueDays.length === 0) return 0;

  let longest = 1;
  let current = 1;

  for (let i = 1; i < uniqueDays.length; i += 1) {
    const diff = uniqueDays[i] - uniqueDays[i - 1];
    if (diff <= DAY_IN_MS * 1.5) {
      current += 1;
      longest = Math.max(longest, current);
    } else {
      current = 1;
    }
  }

  return longest;
};

const getLastMoodCheckInDate = (entries) => {
  if (!entries.length) return undefined;
  const latestTimestamp = entries.reduce((latest, entry) => {
    const timestamp = new Date(entry.createdAt).getTime();
    return timestamp > latest ? timestamp : latest;
  }, 0);

  if (!latestTimestamp) return undefined;
  return new Date(latestTimestamp).toISOString().split('T')[0];
};

const countMoodEntriesInRange = (entries, days) => {
  if (!entries.length) return 0;
  
  // Calculate cutoff as start of day N days ago
  // This ensures we count full days, not partial hours
  const todayStart = toStartOfDay(new Date());
  const cutoff = todayStart - (days - 1) * DAY_IN_MS;
  
  const uniqueDays = new Set();
  entries.forEach((entry) => {
    const entryDay = toStartOfDay(new Date(entry.createdAt));
    if (entryDay >= cutoff && entryDay <= todayStart) {
      uniqueDays.add(entryDay);
    }
  });
  return uniqueDays.size;
};

const computeAverageMood = (entries) => {
  if (!entries.length) return 0;
  const scores = entries
    .map((entry) => MOOD_SCORES[entry.mood])
    .filter((score) => typeof score === 'number');
  if (!scores.length) return 0;
  const total = scores.reduce((acc, value) => acc + value, 0);
  return total / scores.length;
};

const normalizeMoodForHeatmap = (mood) => {
  switch (mood) {
    case 'Great':
    case 'Good':
    case 'Okay':
    case 'Struggling':
    case 'Anxious':
      return mood;
    default:
      return 'Okay';
  }
};

// ============================================================================
// TEST FUNCTIONS
// ============================================================================

let passedTests = 0;
let failedTests = 0;

function assert(condition, testName, expected, actual) {
  if (condition) {
    console.log(`✅ PASS: ${testName}`);
    passedTests++;
  } else {
    console.log(`❌ FAIL: ${testName}`);
    console.log(`   Expected: ${expected}`);
    console.log(`   Actual: ${actual}`);
    failedTests++;
  }
}

// ============================================================================
// TEST: calculateCurrentStreak
// ============================================================================

console.log('\n📊 Testing calculateCurrentStreak()');
console.log('═'.repeat(60));

const streak1 = calculateCurrentStreak(testMoodEntries);
assert(streak1 === 4, 'Current streak with recent entries', 4, streak1);

const streak2 = calculateCurrentStreak(emptyMoodEntries);
assert(streak2 === 0, 'Current streak with empty array', 0, streak2);

const streak3 = calculateCurrentStreak(singleMoodEntry);
assert(streak3 === 1, 'Current streak with single entry', 1, streak3);

// Test with old entries (should return 0)
const oldEntries = [
  { id: 1, mood: 'Great', emoji: '😄', date: '2025-09-01', createdAt: '2025-09-01T10:00:00Z' }
];
const streak4 = calculateCurrentStreak(oldEntries);
assert(streak4 === 0, 'Current streak with old entries (>1 day gap)', 0, streak4);

// ============================================================================
// TEST: calculateLongestStreak
// ============================================================================

console.log('\n📊 Testing calculateLongestStreak()');
console.log('═'.repeat(60));

const longest1 = calculateLongestStreak(testMoodEntries);
assert(longest1 === 4, 'Longest streak with gap', 4, longest1);

const longest2 = calculateLongestStreak(emptyMoodEntries);
assert(longest2 === 0, 'Longest streak with empty array', 0, longest2);

const longest3 = calculateLongestStreak(singleMoodEntry);
assert(longest3 === 1, 'Longest streak with single entry', 1, longest3);

// Test with all consecutive entries
const consecutiveEntries = [
  { id: 1, mood: 'Great', createdAt: '2025-10-23T10:00:00Z' },
  { id: 2, mood: 'Good', createdAt: '2025-10-22T10:00:00Z' },
  { id: 3, mood: 'Okay', createdAt: '2025-10-21T10:00:00Z' },
  { id: 4, mood: 'Good', createdAt: '2025-10-20T10:00:00Z' },
  { id: 5, mood: 'Great', createdAt: '2025-10-19T10:00:00Z' },
];
const longest4 = calculateLongestStreak(consecutiveEntries);
assert(longest4 === 5, 'Longest streak with all consecutive', 5, longest4);

// ============================================================================
// TEST: getLastMoodCheckInDate
// ============================================================================

console.log('\n📊 Testing getLastMoodCheckInDate()');
console.log('═'.repeat(60));

const lastDate1 = getLastMoodCheckInDate(testMoodEntries);
assert(lastDate1 === '2025-10-23', 'Last check-in date with multiple entries', '2025-10-23', lastDate1);

const lastDate2 = getLastMoodCheckInDate(emptyMoodEntries);
assert(lastDate2 === undefined, 'Last check-in date with empty array', undefined, lastDate2);

const lastDate3 = getLastMoodCheckInDate(singleMoodEntry);
assert(lastDate3 === '2025-10-23', 'Last check-in date with single entry', '2025-10-23', lastDate3);

// ============================================================================
// TEST: countMoodEntriesInRange
// ============================================================================

console.log('\n📊 Testing countMoodEntriesInRange()');
console.log('═'.repeat(60));

const count1 = countMoodEntriesInRange(testMoodEntries, 7);
assert(count1 === 6, 'Count entries in last 7 days', 6, count1);

const count2 = countMoodEntriesInRange(emptyMoodEntries, 7);
assert(count2 === 0, 'Count entries with empty array', 0, count2);

// "Last 3 days" means today, yesterday, and 2 days ago = 3 unique days (entries 1, 2, 3)
const count3 = countMoodEntriesInRange(testMoodEntries, 3);
assert(count3 === 3, 'Count entries in last 3 days', 3, count3);

const count4 = countMoodEntriesInRange(testMoodEntries, 1);
assert(count4 === 1, 'Count entries in last 1 day', 1, count4);

// ============================================================================
// TEST: computeAverageMood
// ============================================================================

console.log('\n📊 Testing computeAverageMood()');
console.log('═'.repeat(60));

const avg1 = computeAverageMood(testMoodEntries);
const expectedAvg1 = (5 + 4 + 3 + 4 + 2 + 1) / 6; // 3.166...
assert(Math.abs(avg1 - expectedAvg1) < 0.01, 'Average mood with multiple entries', expectedAvg1.toFixed(2), avg1.toFixed(2));

const avg2 = computeAverageMood(emptyMoodEntries);
assert(avg2 === 0, 'Average mood with empty array', 0, avg2);

const avg3 = computeAverageMood(singleMoodEntry);
assert(avg3 === 5, 'Average mood with single entry (Great)', 5, avg3);

// Test with all same mood
const sameMoodEntries = [
  { id: 1, mood: 'Good', createdAt: '2025-10-23T10:00:00Z' },
  { id: 2, mood: 'Good', createdAt: '2025-10-22T10:00:00Z' },
  { id: 3, mood: 'Good', createdAt: '2025-10-21T10:00:00Z' },
];
const avg4 = computeAverageMood(sameMoodEntries);
assert(avg4 === 4, 'Average mood with all same (Good)', 4, avg4);

// ============================================================================
// TEST: normalizeMoodForHeatmap
// ============================================================================

console.log('\n📊 Testing normalizeMoodForHeatmap()');
console.log('═'.repeat(60));

assert(normalizeMoodForHeatmap('Great') === 'Great', 'Normalize "Great"', 'Great', normalizeMoodForHeatmap('Great'));
assert(normalizeMoodForHeatmap('Good') === 'Good', 'Normalize "Good"', 'Good', normalizeMoodForHeatmap('Good'));
assert(normalizeMoodForHeatmap('Okay') === 'Okay', 'Normalize "Okay"', 'Okay', normalizeMoodForHeatmap('Okay'));
assert(normalizeMoodForHeatmap('Struggling') === 'Struggling', 'Normalize "Struggling"', 'Struggling', normalizeMoodForHeatmap('Struggling'));
assert(normalizeMoodForHeatmap('Anxious') === 'Anxious', 'Normalize "Anxious"', 'Anxious', normalizeMoodForHeatmap('Anxious'));
assert(normalizeMoodForHeatmap('Invalid') === 'Okay', 'Normalize invalid mood', 'Okay', normalizeMoodForHeatmap('Invalid'));
assert(normalizeMoodForHeatmap('') === 'Okay', 'Normalize empty string', 'Okay', normalizeMoodForHeatmap(''));

// ============================================================================
// EDGE CASE TESTS
// ============================================================================

console.log('\n📊 Testing Edge Cases');
console.log('═'.repeat(60));

// Test with null/undefined entries
try {
  calculateCurrentStreak(null);
  console.log('❌ FAIL: Should throw error with null entries');
  failedTests++;
} catch (e) {
  console.log('✅ PASS: Correctly throws error with null entries');
  passedTests++;
}

// Test with entries that have duplicate dates
const duplicateDates = [
  { id: 1, mood: 'Great', createdAt: '2025-10-23T10:00:00Z' },
  { id: 2, mood: 'Good', createdAt: '2025-10-23T14:00:00Z' }, // Same day, different time
  { id: 3, mood: 'Okay', createdAt: '2025-10-22T10:00:00Z' },
];
const streakDuplicates = calculateCurrentStreak(duplicateDates);
assert(streakDuplicates === 2, 'Current streak with duplicate dates (same day)', 2, streakDuplicates);

const countDuplicates = countMoodEntriesInRange(duplicateDates, 7);
assert(countDuplicates === 2, 'Count with duplicate dates (unique days)', 2, countDuplicates);

// Test with entries in wrong order (unsorted) - should handle consecutive days
const today = new Date();
const yesterday = new Date(today);
yesterday.setDate(yesterday.getDate() - 1);
const twoDaysAgo = new Date(today);
twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

const unsortedEntries = [
  { id: 1, mood: 'Great', createdAt: twoDaysAgo.toISOString() },
  { id: 2, mood: 'Good', createdAt: today.toISOString() },
  { id: 3, mood: 'Okay', createdAt: yesterday.toISOString() },
];
const streakUnsorted = calculateCurrentStreak(unsortedEntries);
assert(streakUnsorted === 3, 'Current streak with unsorted entries', 3, streakUnsorted);

// ============================================================================
// DIVISION BY ZERO TESTS
// ============================================================================

console.log('\n📊 Testing Division by Zero Safety');
console.log('═'.repeat(60));

const planProgressPercent = (modulesCompleted, totalModules) => {
  if (totalModules === 0) return 0;
  return Math.round((modulesCompleted / totalModules) * 100);
};

assert(planProgressPercent(0, 0) === 0, 'Plan progress with 0/0 modules', 0, planProgressPercent(0, 0));
assert(planProgressPercent(3, 5) === 60, 'Plan progress with 3/5 modules', 60, planProgressPercent(3, 5));
assert(planProgressPercent(5, 5) === 100, 'Plan progress with 5/5 modules', 100, planProgressPercent(5, 5));

// ============================================================================
// SUMMARY
// ============================================================================

console.log('\n' + '═'.repeat(60));
console.log('📊 TEST SUMMARY');
console.log('═'.repeat(60));
console.log(`✅ Passed: ${passedTests}`);
console.log(`❌ Failed: ${failedTests}`);
console.log(`📈 Total: ${passedTests + failedTests}`);
console.log(`🎯 Success Rate: ${((passedTests / (passedTests + failedTests)) * 100).toFixed(1)}%`);
console.log('═'.repeat(60));

if (failedTests === 0) {
  console.log('\n🎉 ALL TESTS PASSED! 🎉\n');
} else {
  console.log('\n⚠️  SOME TESTS FAILED - Review failures above\n');
}
