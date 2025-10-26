import {
  ArrowLeft,
  Award,
  BarChart3,
  Brain,
  Calendar as CalendarIcon,
  CheckCircle,
  Flame,
  Heart,
  Smile,
  Star,
  Target,
  TrendingUp,
  Trophy,
  Zap
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { assessmentsApi, moodApi, plansApi, progressApi } from '../../../services/api';
import type {
  AssessmentHistoryEntry,
  AssessmentInsights,
  MoodEntry,
  PlanModuleWithState,
  ProgressEntry,
  User
} from '../../../services/api';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { Calendar } from '../../ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { ErrorBoundary } from '../../ui/error-boundary';
import { Progress as ProgressBar } from '../../ui/progress';
import { Skeleton } from '../../ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import { friendlyAssessmentLabel, isHigherScoreBetter } from '../assessment/assessmentUtils';
import {
  AssessmentComparisonChart,
  type AssessmentScore,
  ConversationSummaryWidget,
  ConversationTopicsWidget,
  EmotionalPatternWidget,
  MoodCalendarHeatmap,
  type MoodCalendarHeatmapProps,
  StreakTracker,
  type StreakData,
  WellnessScoreTrend,
  type WellnessDataPoint
} from '../dashboard';

const DAY_IN_MS = 24 * 60 * 60 * 1000;

type TimeRange = '7d' | '30d' | '6m';

type MetricMetadata = {
  label: string;
  max?: number;
  unit?: '%' | 'hrs' | '/5' | string;
  higherIsBetter?: boolean;
};

type ActivityItem = {
  id: string;
  date: Date;
  label: string;
  type: 'mood' | 'progress' | 'assessment' | 'plan';
  meta?: string;
};

type MetricSummary = {
  metricKey: string;
  rawMetricName: string;
  entries: ProgressEntry[];
  latest: ProgressEntry;
  previous?: ProgressEntry;
  change: number | null;
  average: number;
};

const METRIC_METADATA: Record<string, MetricMetadata> = {
  anxiety: { label: 'Anxiety', max: 100, unit: '%', higherIsBetter: false },
  anxietyassessment: { label: 'Anxiety', max: 100, unit: '%', higherIsBetter: false },
  stress: { label: 'Stress', max: 100, unit: '%', higherIsBetter: false },
  stresspss10: { label: 'Stress (PSS-10)', max: 100, unit: '%', higherIsBetter: false },
  overthinking: { label: 'Overthinking', max: 100, unit: '%', higherIsBetter: false },
  overthinkingptq: { label: 'Overthinking (PTQ)', max: 100, unit: '%', higherIsBetter: false },
  overthinkingbrooding: { label: 'Overthinking (Brooding)', max: 100, unit: '%', higherIsBetter: false },
  depression: { label: 'Depression', max: 100, unit: '%', higherIsBetter: false },
  depressionphq9: { label: 'Depression (PHQ-9)', max: 100, unit: '%', higherIsBetter: false },
  emotionalintelligence: { label: 'Emotional Intelligence', max: 100, unit: '%', higherIsBetter: true },
  emotionalintelligenceteique: { label: 'Emotional Intelligence (TEIQue-SF)', max: 100, unit: '%', higherIsBetter: true },
  emotionalintelligenceei10: { label: 'Emotional Intelligence', max: 100, unit: '%', higherIsBetter: true },
  teiquesf: { label: 'Emotional Intelligence (TEIQue-SF)', max: 100, unit: '%', higherIsBetter: true },
  sleep: { label: 'Sleep Quality', max: 10, unit: 'hrs', higherIsBetter: true },
  mood: { label: 'Mood', max: 5, unit: '/5', higherIsBetter: true },
  wellnessscore: { label: 'Wellness Score', max: 100, unit: '%', higherIsBetter: true }
};

const ACTIVITY_COLORS: Record<ActivityItem['type'], string> = {
  mood: 'bg-blue-500',
  progress: 'bg-emerald-500',
  assessment: 'bg-purple-500',
  plan: 'bg-amber-500'
};

type MoodHeatmapMood = 'Great' | 'Good' | 'Okay' | 'Struggling' | 'Anxious';

const MOOD_EMOJI: Record<MoodHeatmapMood, string> = {
  Great: '😊',
  Good: '🙂',
  Okay: '😐',
  Struggling: '😔',
  Anxious: '😰'
};

const normalizeMoodForHeatmap = (mood: string): MoodHeatmapMood => {
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

const MOOD_SCORES: Record<string, number> = {
  Great: 5,
  Good: 4,
  Okay: 3,
  Struggling: 2,
  Anxious: 1
};

const normalizeMetricKey = (metric: string): string => metric.toLowerCase().replace(/[^a-z0-9]/g, '');

const toStartOfDay = (date: Date): number => {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy.getTime();
};

const formatRelativeDate = (date: Date): string => {
  const todayStart = toStartOfDay(new Date());
  const valueStart = toStartOfDay(date);
  const diffDays = Math.round((todayStart - valueStart) / DAY_IN_MS);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays > 1 && diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString();
};

const calculateCurrentStreak = (entries: MoodEntry[]): number => {
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

const calculateLongestStreak = (entries: MoodEntry[]): number => {
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

const getLastMoodCheckInDate = (entries: MoodEntry[]): string | undefined => {
  if (!entries.length) return undefined;
  const latestTimestamp = entries.reduce((latest, entry) => {
    const timestamp = new Date(entry.createdAt).getTime();
    return timestamp > latest ? timestamp : latest;
  }, 0);

  if (!latestTimestamp) return undefined;
  return new Date(latestTimestamp).toISOString().split('T')[0];
};

/**
 * Counts unique days with mood entries in the last N days (inclusive of today)
 * @param entries - Array of mood entries
 * @param days - Number of days to look back (e.g., 7 means "last 7 days including today")
 * @returns Count of unique days with at least one mood entry
 */
const countMoodEntriesInRange = (entries: MoodEntry[], days: number): number => {
  if (!entries.length) return 0;
  
  // Calculate cutoff as start of day N days ago
  // This ensures we count full days, not partial hours
  const todayStart = toStartOfDay(new Date());
  const cutoff = todayStart - (days - 1) * DAY_IN_MS;
  
  const uniqueDays = new Set<number>();
  entries.forEach((entry) => {
    const entryDay = toStartOfDay(new Date(entry.createdAt));
    if (entryDay >= cutoff && entryDay <= todayStart) {
      uniqueDays.add(entryDay);
    }
  });
  return uniqueDays.size;
};

const computeAverageMood = (entries: MoodEntry[]): number => {
  if (!entries.length) return 0;
  const scores = entries
    .map((entry) => MOOD_SCORES[entry.mood])
    .filter((score): score is number => typeof score === 'number');
  if (!scores.length) return 0;
  const total = scores.reduce((acc, value) => acc + value, 0);
  return total / scores.length;
};

const buildMetricSummaries = (
  filteredEntries: ProgressEntry[],
  fallbackEntries: ProgressEntry[]
): Record<string, MetricSummary> => {
  const source = filteredEntries.length ? filteredEntries : fallbackEntries;
  const groups = new Map<string, ProgressEntry[]>();

  source.forEach((entry) => {
    const key = normalizeMetricKey(entry.metric);
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(entry);
  });

  const summaries: Record<string, MetricSummary> = {};
  groups.forEach((entries, key) => {
    const sorted = entries.slice().sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const latest = sorted[sorted.length - 1];
    const previous = sorted.length > 1 ? sorted[sorted.length - 2] : undefined;
    const change = previous ? latest.value - previous.value : null;
    const average = sorted.reduce((acc, item) => acc + item.value, 0) / sorted.length;

    summaries[key] = {
      metricKey: key,
      rawMetricName: latest.metric,
      entries: sorted,
      latest,
      previous,
      change,
      average
    };
  });

  return summaries;
};

const formatMetricValue = (summary: MetricSummary, value: number): string => {
  const metadata = METRIC_METADATA[summary.metricKey];
  if (!metadata) {
    return Number.isInteger(value) ? value.toString() : value.toFixed(1);
  }

  if (metadata.unit === '%') {
    return `${Math.round(value)}%`;
  }

  if (metadata.unit === '/5') {
    return `${value.toFixed(1)}/5`;
  }

  if (metadata.unit === 'hrs') {
    return `${value.toFixed(1)} hrs`;
  }

  const formatted = Number.isInteger(value) ? value.toFixed(0) : value.toFixed(1);
  return metadata.unit ? `${formatted} ${metadata.unit}` : formatted;
};

const getNormalizedMetricValue = (summary: MetricSummary): number => {
  const metadata = METRIC_METADATA[summary.metricKey];
  const max = metadata?.max ?? Math.max(summary.latest.value, summary.previous?.value ?? 0, 100);
  if (!max) return 0;
  return Math.max(0, Math.min(100, (summary.latest.value / max) * 100));
};

const describeMetricChange = (summary: MetricSummary): { label: string; variant: 'default' | 'secondary' | 'destructive' } => {
  if (summary.change === null) {
    return { label: 'No recent change', variant: 'secondary' };
  }
  const metadata = METRIC_METADATA[summary.metricKey];
  const higherIsBetter = metadata?.higherIsBetter ?? false;
  const improvement = higherIsBetter ? summary.change >= 0 : summary.change <= 0;
  return {
    label: improvement ? 'Improving' : 'Needs attention',
    variant: improvement ? 'default' : 'destructive'
  };
};

const extractActivityDates = (
  moodEntries: MoodEntry[],
  progressEntries: ProgressEntry[],
  assessmentHistory: AssessmentHistoryEntry[],
  planModules: PlanModuleWithState[]
): Date[] => {
  const timestamps = new Set<number>();

  moodEntries.forEach((entry) => timestamps.add(toStartOfDay(new Date(entry.createdAt))));
  progressEntries.forEach((entry) => timestamps.add(toStartOfDay(new Date(entry.date))));
  assessmentHistory.forEach((entry) => timestamps.add(toStartOfDay(new Date(entry.completedAt))));
  planModules.forEach((module) => {
    if (module.userState?.updatedAt) {
      timestamps.add(toStartOfDay(new Date(module.userState.updatedAt)));
    }
    if (module.userState?.scheduledFor) {
      timestamps.add(toStartOfDay(new Date(module.userState.scheduledFor)));
    }
    if (module.userState?.completedAt) {
      timestamps.add(toStartOfDay(new Date(module.userState.completedAt)));
    }
  });

  return Array.from(timestamps)
    .sort((a, b) => a - b)
    .map((timestamp) => new Date(timestamp));
};

const buildTimeline = (
  moodEntries: MoodEntry[],
  progressEntries: ProgressEntry[],
  assessmentHistory: AssessmentHistoryEntry[],
  planModules: PlanModuleWithState[],
  metricSummaries: Record<string, MetricSummary>
): ActivityItem[] => {
  const items: ActivityItem[] = [];

  moodEntries.forEach((entry) => {
    const date = new Date(entry.createdAt);
    items.push({
      id: `mood-${entry.id}`,
      date,
      label: `Mood check-in: ${entry.mood}`,
      type: 'mood',
      meta: entry.notes ?? undefined
    });
  });

  progressEntries.forEach((entry) => {
    const date = new Date(entry.date);
    const key = normalizeMetricKey(entry.metric);
    const summary = metricSummaries[key];
    const formatted = summary
      ? formatMetricValue(summary, entry.value)
      : Number.isInteger(entry.value)
        ? entry.value.toString()
        : entry.value.toFixed(1);
    items.push({
      id: `progress-${entry.id}`,
      date,
      label: `Logged ${friendlyAssessmentLabel(entry.metric)}: ${formatted}`,
      type: 'progress',
      meta: entry.notes ?? undefined
    });
  });

  assessmentHistory.forEach((entry) => {
    const date = new Date(entry.completedAt);
    items.push({
      id: `assessment-${entry.id}`,
      date,
      label: `Completed ${friendlyAssessmentLabel(entry.assessmentType)} (Score ${Math.round(entry.score)})`,
      type: 'assessment',
      meta: entry.interpretation
    });
  });

  planModules.forEach((module) => {
    if (!module.userState) return;

    if (module.userState.completedAt) {
      items.push({
        id: `plan-${module.id}-completed`,
        date: new Date(module.userState.completedAt),
        label: `Completed ${module.title}`,
        type: 'plan',
        meta: module.userState.notes ?? undefined
      });
    } else if (module.userState.updatedAt) {
      items.push({
        id: `plan-${module.id}-updated`,
        date: new Date(module.userState.updatedAt),
        label: `Updated ${module.title} to ${Math.round(module.userState.progress)}%`,
        type: 'plan',
        meta: module.userState.notes ?? undefined
      });
    }
  });

  return items.sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 8);
};

const buildAchievements = (
  assessmentHistory: AssessmentHistoryEntry[],
  currentStreak: number,
  modulesCompleted: number,
  totalModules: number,
  focusAreasCount: number
) => {
  const sortedAssessments = assessmentHistory
    .slice()
    .sort((a, b) => new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime());

  const firstAssessmentDate = sortedAssessments.length ? sortedAssessments[0].completedAt : undefined;
  const streakTarget = 5;
  const streakProgress = Math.min(100, Math.round((currentStreak / streakTarget) * 100));
  const moduleProgress = totalModules ? Math.round((modulesCompleted / totalModules) * 100) : 0;

  return [
    {
      id: 'first-steps',
      title: 'First Steps',
      description: 'Completed your first assessment',
      icon: <Star className="h-6 w-6" />,
      earned: assessmentHistory.length > 0,
      earnedDate: firstAssessmentDate,
      progress: assessmentHistory.length > 0 ? undefined : 0
    },
    {
      id: 'consistency',
      title: 'Consistency Champion',
      description: `Maintain a ${streakTarget}-day check-in streak`,
      icon: <Flame className="h-6 w-6" />,
      earned: currentStreak >= streakTarget,
      earnedDate: currentStreak >= streakTarget ? new Date().toISOString() : undefined,
      progress: currentStreak >= streakTarget ? undefined : streakProgress
    },
    {
      id: 'practice-pioneer',
      title: 'Practice Pioneer',
      description: 'Complete your personalised plan modules',
      icon: <Heart className="h-6 w-6" />,
      earned: totalModules > 0 && modulesCompleted === totalModules,
      earnedDate: totalModules > 0 && modulesCompleted === totalModules ? new Date().toISOString() : undefined,
      progress: totalModules > 0 && modulesCompleted === totalModules ? undefined : moduleProgress
    },
    {
      id: 'balanced-growth',
      title: 'Balanced Growth',
      description: 'Keep all assessment areas on track',
      icon: <Trophy className="h-6 w-6" />,
      earned: focusAreasCount === 0 && assessmentHistory.length > 0,
      earnedDate: focusAreasCount === 0 && assessmentHistory.length > 0 ? new Date().toISOString() : undefined,
      progress: focusAreasCount === 0 ? undefined : Math.max(10, 100 - focusAreasCount * 25)
    }
  ];
};

const buildPositiveAndFocusInsights = (insights: AssessmentInsights | null) => {
  if (!insights) {
    return {
      positiveTrends: [] as Array<{ id: string; label: string; detail: string }>,
      focusAreas: [] as Array<{ id: string; label: string; detail: string }>
    };
  }

  const positiveTrends: Array<{ id: string; label: string; detail: string }> = [];
  const focusAreas: Array<{ id: string; label: string; detail: string }> = [];

  Object.entries(insights.byType).forEach(([type, summary]) => {
    const label = friendlyAssessmentLabel(type);
    const change = summary.change;
    const higherIsBetter = isHigherScoreBetter(type);
    const recommendation = summary.recommendations[0] ?? summary.interpretation ?? 'Keep going—your consistency is working!';

    const isPositive =
      summary.trend === 'improving' ||
      (change !== null && ((higherIsBetter && change > 0) || (!higherIsBetter && change < 0)));

    const isNegative =
      summary.trend === 'declining' ||
      (change !== null && ((higherIsBetter && change < 0) || (!higherIsBetter && change > 0)));

    if (isPositive) {
      positiveTrends.push({ id: type, label, detail: recommendation });
    } else if (isNegative) {
      focusAreas.push({
        id: type,
        label,
        detail: recommendation
      });
    }
  });

  return {
    positiveTrends: positiveTrends.slice(0, 3),
    focusAreas: focusAreas.slice(0, 3)
  };
};

const getTimeRangeLabel = (range: TimeRange) => {
  switch (range) {
    case '7d':
      return 'Last 7 Days';
    case '30d':
      return 'Last 30 Days';
    case '6m':
      return 'Last 6 Months';
    default:
      return 'All Time';
  }
};

interface ProgressProps {
  user: User | null;
  onNavigate: (page: string) => void;
}

export function Progress({ user, onNavigate }: ProgressProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRange>('30d');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshIndex, setRefreshIndex] = useState(0);

  const [progressEntries, setProgressEntries] = useState<ProgressEntry[]>([]);
  const [moodEntries, setMoodEntries] = useState<MoodEntry[]>([]);
  const [planModules, setPlanModules] = useState<PlanModuleWithState[]>([]);
  const [assessmentHistory, setAssessmentHistory] = useState<AssessmentHistoryEntry[]>([]);
  const [assessmentInsights, setAssessmentInsights] = useState<AssessmentInsights | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const [progressRes, moodRes, planRes, assessmentsRes] = await Promise.all([
          progressApi.getProgressHistory(),
          moodApi.getMoodHistory(),
          plansApi.getPersonalizedPlan(),
          assessmentsApi.getAssessmentHistory()
        ]);

        if (!isMounted) return;

        if (progressRes.success && Array.isArray(progressRes.data)) {
          setProgressEntries(progressRes.data.map((entry) => ({ ...entry, notes: entry.notes ?? undefined })));
        } else {
          setProgressEntries([]);
          if (progressRes.error) {
            setError((prev) => prev ?? progressRes.error);
          }
        }

        if (moodRes.success && moodRes.data) {
          setMoodEntries(moodRes.data.moodEntries ?? []);
        } else {
          setMoodEntries([]);
          if (moodRes.error) {
            setError((prev) => prev ?? moodRes.error);
          }
        }

        if (planRes.success && Array.isArray(planRes.data)) {
          setPlanModules(planRes.data);
        } else {
          setPlanModules([]);
          if (planRes.error) {
            setError((prev) => prev ?? planRes.error);
          }
        }

        if (assessmentsRes.success && assessmentsRes.data) {
          setAssessmentHistory(assessmentsRes.data.history ?? []);
          setAssessmentInsights(assessmentsRes.data.insights ?? null);
        } else {
          setAssessmentHistory([]);
          setAssessmentInsights(null);
          if (assessmentsRes.error) {
            setError((prev) => prev ?? assessmentsRes.error);
          }
        }
      } catch (fetchError) {
        if (!isMounted) return;
        console.error('Failed to load progress data', fetchError);
        setError('Unable to load your progress right now. Please try again.');
        setProgressEntries([]);
        setMoodEntries([]);
        setPlanModules([]);
        setAssessmentHistory([]);
        setAssessmentInsights(null);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [refreshIndex]);

  const sortedAssessmentHistory = useMemo(
    () =>
      assessmentHistory
        .slice()
        .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()),
    [assessmentHistory]
  );

  const currentStreak = useMemo(() => calculateCurrentStreak(moodEntries), [moodEntries]);
  const moodCheckinsWeek = useMemo(() => countMoodEntriesInRange(moodEntries, 7), [moodEntries]);
  const averageMoodScore = useMemo(() => computeAverageMood(moodEntries), [moodEntries]);

  const totalModules = planModules.length;
  const modulesCompleted = useMemo(
    () => planModules.filter((module) => module.userState?.completed).length,
    [planModules]
  );
  const planAverageProgress = useMemo(() => {
    if (!totalModules) return 0;
    const totalProgress = planModules.reduce(
      (acc, module) => acc + (module.userState?.progress ?? 0),
      0
    );
    return totalProgress / totalModules;
  }, [planModules, totalModules]);

  const filteredProgressEntries = useMemo(() => {
    if (!progressEntries.length) return [];
    const rangeDays = selectedTimeRange === '7d' ? 7 : selectedTimeRange === '30d' ? 30 : 180;
    const cutoff = Date.now() - rangeDays * DAY_IN_MS;
    return progressEntries.filter((entry) => new Date(entry.date).getTime() >= cutoff);
  }, [progressEntries, selectedTimeRange]);

  const metricSummaries = useMemo(
    () => buildMetricSummaries(filteredProgressEntries, progressEntries),
    [filteredProgressEntries, progressEntries]
  );

  const { positiveTrends, focusAreas } = useMemo(
    () => buildPositiveAndFocusInsights(assessmentInsights),
    [assessmentInsights]
  );

  const activityItems = useMemo(
    () => buildTimeline(moodEntries, progressEntries, sortedAssessmentHistory, planModules, metricSummaries),
    [moodEntries, progressEntries, sortedAssessmentHistory, planModules, metricSummaries]
  );

  const calendarActivityDates = useMemo(
    () => extractActivityDates(moodEntries, progressEntries, assessmentHistory, planModules),
    [moodEntries, progressEntries, assessmentHistory, planModules]
  );

  const achievements = useMemo(
    () => buildAchievements(assessmentHistory, currentStreak, modulesCompleted, totalModules, focusAreas.length),
    [assessmentHistory, currentStreak, modulesCompleted, totalModules, focusAreas.length]
  );

  const moodHeatmapEntries = useMemo<MoodCalendarHeatmapProps['entries']>(() => {
    if (!moodEntries.length) return [];

    const entriesByDate = new Map<string, { mood: MoodHeatmapMood; timestamp: number }>();

    moodEntries.forEach((entry) => {
      const entryDate = new Date(entry.createdAt);
      const dateKey = entryDate.toISOString().split('T')[0];
      const normalizedMood = normalizeMoodForHeatmap(entry.mood);
      const timestamp = entryDate.getTime();
      const existing = entriesByDate.get(dateKey);

      if (!existing || timestamp > existing.timestamp) {
        entriesByDate.set(dateKey, { mood: normalizedMood, timestamp });
      }
    });

    return Array.from(entriesByDate.entries())
      .map(([date, value]) => ({
        date,
        mood: value.mood,
        emoji: MOOD_EMOJI[value.mood]
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [moodEntries]);

  const wellnessTrendData = useMemo<WellnessDataPoint[]>(() => {
    if (!progressEntries.length) return [];

    const relevantEntries = progressEntries
      .filter((entry) => {
        const key = normalizeMetricKey(entry.metric);
        return key === 'wellnessscore' || key === 'wellbeing' || key === 'overallwellness';
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return relevantEntries.map((entry) => ({
      date: new Date(entry.date).toISOString().split('T')[0],
      score: Math.round(entry.value)
    }));
  }, [progressEntries]);

  const streakTrackerData = useMemo<StreakData>(() => ({
    currentStreak,
    longestStreak: calculateLongestStreak(moodEntries),
    totalCheckIns: moodEntries.length,
    thisWeekCheckIns: moodCheckinsWeek,
    lastCheckInDate: getLastMoodCheckInDate(moodEntries)
  }), [currentStreak, moodEntries, moodCheckinsWeek]);

  const assessmentComparisonScores = useMemo<AssessmentScore[]>(() => {
    if (!sortedAssessmentHistory.length) return [];

    const latestByType = new Map<string, AssessmentHistoryEntry>();

    sortedAssessmentHistory.forEach((entry) => {
      if (!latestByType.has(entry.assessmentType)) {
        latestByType.set(entry.assessmentType, entry);
      }
    });

    const uniqueEntries = Array.from(latestByType.values());
    uniqueEntries.sort((a, b) => b.score - a.score);

    return uniqueEntries.map((entry) => ({
      type: entry.assessmentType,
      label: friendlyAssessmentLabel(entry.assessmentType),
      score: Math.round(entry.score),
      date: entry.completedAt,
      maxScore: entry.maxScore ?? undefined
    }));
  }, [sortedAssessmentHistory]);

  const assessmentsCompletedLast30Days = useMemo(() => {
    const cutoff = Date.now() - 30 * DAY_IN_MS;
    return assessmentHistory.filter((entry) => new Date(entry.completedAt).getTime() >= cutoff).length;
  }, [assessmentHistory]);

  const handleRetry = () => setRefreshIndex((prev) => prev + 1);

  const renderLoadingState = () => (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <Skeleton className="h-10 w-2/5" />
      <div className="grid md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index}>
            <CardContent className="p-6 space-y-4">
              <Skeleton className="h-10 w-10 rounded-full mx-auto" />
              <Skeleton className="h-6 w-1/2 mx-auto" />
              <Skeleton className="h-4 w-2/3 mx-auto" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardContent className="p-6 space-y-4">
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-4/5" />
        </CardContent>
      </Card>
    </div>
  );

  const renderErrorState = () => (
    <div className="max-w-6xl mx-auto p-6">
      <Card>
        <CardContent className="p-6 space-y-4 text-center">
          <p className="text-lg font-medium">We couldn&apos;t load your progress.</p>
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button onClick={handleRetry}>Retry</Button>
        </CardContent>
      </Card>
    </div>
  );

  const averageMoodDisplay = averageMoodScore ? `${averageMoodScore.toFixed(1)}/5` : '—';
  const averageMoodPercent = Math.min(100, Math.max(0, averageMoodScore * 20));
  const planProgressPercent = Math.round(planAverageProgress);

  const userGreeting = useMemo(() => {
    const name = user?.firstName || user?.name;
    return name ? `Keep going, ${name}!` : "You're building something meaningful.";
  }, [user]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/5">
      <div className="bg-gradient-to-r from-primary/20 via-primary/10 to-accent/20 border-b border-primary/10">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between mb-6">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => onNavigate('dashboard')}
              className="hover:bg-primary/10 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <Badge variant="outline" className="px-3 py-1">
              <TrendingUp className="h-3 w-3 mr-1" />
              {assessmentHistory.length} Assessments
            </Badge>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-xl">
                <BarChart3 className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  Your Progress
                </h1>
                <p className="text-muted-foreground">
                  {userGreeting}
                </p>
              </div>
            </div>
            <p className="text-base text-muted-foreground max-w-2xl">
              Track your wellbeing journey, celebrate achievements, and stay motivated with real-time insights.
            </p>
          </div>
        </div>
      </div>

      {loading && !error ? (
        renderLoadingState()
      ) : error ? (
        renderErrorState()
      ) : (
        <div className="max-w-7xl mx-auto px-6 py-8">
          <Tabs defaultValue="overview" className="space-y-8">
            <TabsList className="grid w-full grid-cols-4 bg-muted/50 p-1 rounded-xl h-auto">
              <TabsTrigger 
                value="overview" 
                className="data-[state=active]:bg-background data-[state=active]:shadow-md rounded-lg py-3 font-medium transition-all"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Overview
              </TabsTrigger>
              <TabsTrigger 
                value="trends" 
                className="data-[state=active]:bg-background data-[state=active]:shadow-md rounded-lg py-3 font-medium transition-all"
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                Trends
              </TabsTrigger>
              <TabsTrigger 
                value="goals" 
                className="data-[state=active]:bg-background data-[state=active]:shadow-md rounded-lg py-3 font-medium transition-all"
              >
                <Target className="h-4 w-4 mr-2" />
                Goals
              </TabsTrigger>
              <TabsTrigger 
                value="achievements" 
                className="data-[state=active]:bg-background data-[state=active]:shadow-md rounded-lg py-3 font-medium transition-all"
              >
                <Award className="h-4 w-4 mr-2" />
                Achievements
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-8">
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="border-2 hover:border-primary/50 transition-all hover:shadow-lg group">
                  <CardContent className="p-6">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="p-3 bg-gradient-to-br from-orange-500/10 to-orange-500/5 rounded-xl group-hover:scale-110 transition-transform">
                          <Flame className="h-6 w-6 text-orange-500" />
                        </div>
                        <Badge variant="secondary" className="font-semibold">
                          {currentStreak > 0 ? 'Active' : 'Start'}
                        </Badge>
                      </div>
                      <div>
                        <div className="text-3xl font-bold text-orange-600">{currentStreak}</div>
                        <div className="text-sm text-muted-foreground font-medium">Day Streak</div>
                      </div>
                      <ProgressBar 
                        value={Math.min((currentStreak / 7) * 100, 100)} 
                        className="h-1.5" 
                        indicatorClassName="bg-gradient-to-r from-orange-500 to-orange-400"
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-2 hover:border-primary/50 transition-all hover:shadow-lg group">
                  <CardContent className="p-6">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="p-3 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl group-hover:scale-110 transition-transform">
                          <Heart className="h-6 w-6 text-primary" />
                        </div>
                        <Badge variant="secondary" className="font-semibold">
                          This Week
                        </Badge>
                      </div>
                      <div>
                        <div className="text-3xl font-bold text-primary">{moodCheckinsWeek}</div>
                        <div className="text-sm text-muted-foreground font-medium">Check-ins</div>
                      </div>
                      <ProgressBar 
                        value={(moodCheckinsWeek / 7) * 100} 
                        className="h-1.5" 
                        indicatorClassName="bg-gradient-to-r from-primary to-blue-400"
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-2 hover:border-primary/50 transition-all hover:shadow-lg group">
                  <CardContent className="p-6">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="p-3 bg-gradient-to-br from-green-500/10 to-green-500/5 rounded-xl group-hover:scale-110 transition-transform">
                          <Target className="h-6 w-6 text-green-500" />
                        </div>
                        <Badge variant="secondary" className="font-semibold">
                          {totalModules > 0 ? `${Math.round((modulesCompleted/totalModules)*100)}%` : 'N/A'}
                        </Badge>
                      </div>
                      <div>
                        <div className="text-3xl font-bold text-green-600">
                          {modulesCompleted}/{totalModules || '—'}
                        </div>
                        <div className="text-sm text-muted-foreground font-medium">Modules Done</div>
                      </div>
                      <ProgressBar 
                        value={totalModules > 0 ? (modulesCompleted / totalModules) * 100 : 0} 
                        className="h-1.5" 
                        indicatorClassName="bg-gradient-to-r from-green-500 to-emerald-400"
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-2 hover:border-primary/50 transition-all hover:shadow-lg group">
                  <CardContent className="p-6">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="p-3 bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 rounded-xl group-hover:scale-110 transition-transform">
                          <Star className="h-6 w-6 text-yellow-500" />
                        </div>
                        <Badge variant="secondary" className="font-semibold">
                          {averageMoodScore >= 4 ? 'Great' : averageMoodScore >= 3 ? 'Good' : 'Fair'}
                        </Badge>
                      </div>
                      <div>
                        <div className="text-3xl font-bold text-yellow-600">{averageMoodDisplay}</div>
                        <div className="text-sm text-muted-foreground font-medium">Avg Mood</div>
                      </div>
                      <ProgressBar 
                        value={averageMoodPercent} 
                        className="h-1.5" 
                        indicatorClassName="bg-gradient-to-r from-yellow-500 to-amber-400"
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  <Card className="border-2 shadow-lg">
                    <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/5 border-b">
                      <CardTitle className="flex items-center gap-2 text-xl">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <BarChart3 className="h-5 w-5 text-primary" />
                        </div>
                        Recent Activity
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      {activityItems.length ? (
                        <div className="space-y-3">
                          {activityItems.map((item) => (
                            <div 
                              key={item.id} 
                              className="flex items-start gap-4 p-4 rounded-xl bg-gradient-to-r from-muted/50 to-muted/30 hover:from-muted/70 hover:to-muted/50 transition-all border border-transparent hover:border-primary/20"
                            >
                              <div className={`w-3 h-3 rounded-full ${ACTIVITY_COLORS[item.type]} mt-1.5 shadow-lg`} />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-foreground">{item.label}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <CalendarIcon className="h-3 w-3 text-muted-foreground" />
                                  <p className="text-xs text-muted-foreground">{formatRelativeDate(item.date)}</p>
                                </div>
                                {item.meta && (
                                  <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{item.meta}</p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <div className="p-4 bg-muted/50 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                            <BarChart3 className="h-8 w-8 text-muted-foreground" />
                          </div>
                          <p className="text-sm font-medium mb-1">No activity logged yet</p>
                          <p className="text-xs text-muted-foreground">
                            Complete an assessment, log your mood, or update a practice to see it here.
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                <Card className="border-2 shadow-lg">
                  <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/5 border-b">
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <CalendarIcon className="h-5 w-5 text-primary" />
                      </div>
                      Activity Calendar
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      className="rounded-lg"
                      modifiers={{ activity: calendarActivityDates }}
                      modifiersClassNames={{ activity: 'bg-primary text-primary-foreground font-semibold rounded-full' }}
                    />
                    <div className="mt-4 p-3 bg-primary/5 rounded-lg border border-primary/10">
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        <span className="font-semibold text-foreground">Highlighted days</span> show mood check-ins, assessments, plan updates, or progress logs.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid lg:grid-cols-2 gap-6">
                <div className="transform hover:scale-[1.02] transition-transform">
                  <ErrorBoundary fallbackTitle="Streak Tracker Error" fallbackMessage="Unable to load streak data.">
                    <StreakTracker data={streakTrackerData} />
                  </ErrorBoundary>
                </div>
                <div className="transform hover:scale-[1.02] transition-transform">
                  <ErrorBoundary fallbackTitle="Mood Calendar Error" fallbackMessage="Unable to load mood calendar.">
                    <MoodCalendarHeatmap entries={moodHeatmapEntries} days={120} />
                  </ErrorBoundary>
                </div>
              </div>

              <div className="grid lg:grid-cols-2 gap-6">
                <div className="transform hover:scale-[1.02] transition-transform">
                  <ErrorBoundary fallbackTitle="Wellness Trend Error" fallbackMessage="Unable to load wellness trend data.">
                    <WellnessScoreTrend data={wellnessTrendData} days={120} title="Wellness Score Trend" />
                  </ErrorBoundary>
                </div>
                <div className="transform hover:scale-[1.02] transition-transform">
                  <ErrorBoundary fallbackTitle="Assessment Chart Error" fallbackMessage="Unable to load assessment comparison.">
                    <AssessmentComparisonChart scores={assessmentComparisonScores} title="Latest Assessment Comparison" />
                  </ErrorBoundary>
                </div>
              </div>

              {user && (
                <div className="grid lg:grid-cols-3 gap-6">
                  <div className="transform hover:scale-[1.02] transition-transform">
                    <ErrorBoundary fallbackTitle="Conversation Summary Error" fallbackMessage="Unable to load conversation data." showRefresh={false}>
                      <ConversationSummaryWidget userId={user.id} />
                    </ErrorBoundary>
                  </div>
                  <div className="transform hover:scale-[1.02] transition-transform">
                    <ErrorBoundary fallbackTitle="Topics Error" fallbackMessage="Unable to load conversation topics." showRefresh={false}>
                      <ConversationTopicsWidget userId={user.id} />
                    </ErrorBoundary>
                  </div>
                  <div className="transform hover:scale-[1.02] transition-transform">
                    <ErrorBoundary fallbackTitle="Emotional Pattern Error" fallbackMessage="Unable to load emotional patterns." showRefresh={false}>
                      <EmotionalPatternWidget userId={user.id} />
                    </ErrorBoundary>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="trends" className="space-y-6">
              <div className="flex gap-2 flex-wrap">
                {(['7d', '30d', '6m'] as const).map((range) => (
                  <Button
                    key={range}
                    variant={selectedTimeRange === range ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedTimeRange(range)}
                    className={selectedTimeRange === range ? 'shadow-md' : 'hover:bg-primary/10'}
                  >
                    <CalendarIcon className="h-3 w-3 mr-2" />
                    {getTimeRangeLabel(range)}
                  </Button>
                ))}
              </div>

              <div className="grid lg:grid-cols-2 gap-6">
                <Card className="border-2 shadow-lg">
                  <CardHeader className="bg-gradient-to-r from-red-500/5 to-orange-500/5 border-b">
                    <CardTitle className="flex items-center gap-2">
                      <div className="p-2 bg-red-500/10 rounded-lg">
                        <Brain className="h-5 w-5 text-red-600" />
                      </div>
                      Anxiety &amp; Stress Levels
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6 p-6">
                    {['anxiety', 'stress'].map((metricKey) => {
                      const summary =
                        metricSummaries[metricKey] ||
                        metricSummaries[`${metricKey}assessment`] ||
                        metricSummaries[`${metricKey}pss10`];

                      if (!summary) {
                        return (
                          <div key={metricKey} className="space-y-1">
                            <span className="text-sm text-muted-foreground capitalize">{metricKey}</span>
                            <p className="text-xs text-muted-foreground">No entries yet</p>
                          </div>
                        );
                      }

                      const changeDescriptor = describeMetricChange(summary);
                      return (
                        <div key={metricKey} className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm">{friendlyAssessmentLabel(summary.rawMetricName)}</span>
                            <Badge variant={changeDescriptor.variant}>
                              {formatMetricValue(summary, summary.latest.value)}
                            </Badge>
                          </div>
                          <ProgressBar value={getNormalizedMetricValue(summary)} className="h-2" />
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>{changeDescriptor.label}</span>
                            {summary.change !== null && (
                              <span>
                                Δ {summary.change > 0 ? '+' : ''}
                                {Math.abs(summary.change) < 1
                                  ? summary.change.toFixed(1)
                                  : Math.round(summary.change)}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>

                <Card className="border-2 shadow-lg">
                  <CardHeader className="bg-gradient-to-r from-pink-500/5 to-purple-500/5 border-b">
                    <CardTitle className="flex items-center gap-2">
                      <div className="p-2 bg-pink-500/10 rounded-lg">
                        <Heart className="h-5 w-5 text-pink-600" />
                      </div>
                      Mood &amp; Practice Consistency
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6 p-6">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-4 bg-gradient-to-r from-pink-500/5 to-pink-500/10 rounded-xl border border-pink-200/30">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 bg-pink-500/10 rounded-lg">
                            <Smile className="h-5 w-5 text-pink-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Average mood</p>
                            <p className="text-2xl font-bold text-foreground">{averageMoodDisplay}</p>
                          </div>
                        </div>
                        <Badge variant="default" className="bg-pink-500/10 text-pink-700 border-pink-300">{averageMoodPercent}%</Badge>
                      </div>
                      <div className="relative h-2 bg-muted/30 rounded-full overflow-hidden">
                        <div 
                          className="absolute h-full bg-gradient-to-r from-pink-500 to-purple-500 transition-all duration-500 rounded-full shadow-sm"
                          style={{ width: `${averageMoodPercent}%` }}
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-4 bg-gradient-to-r from-blue-500/5 to-blue-500/10 rounded-xl border border-blue-200/30">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 bg-blue-500/10 rounded-lg">
                            <Target className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Plan progress</p>
                            <p className="text-2xl font-bold text-foreground">{planProgressPercent}%</p>
                          </div>
                        </div>
                        <Badge variant="secondary" className="bg-blue-500/10 text-blue-700 border-blue-300">
                          {modulesCompleted}/{totalModules}
                        </Badge>
                      </div>
                      <div className="relative h-2 bg-muted/30 rounded-full overflow-hidden">
                        <div 
                          className="absolute h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-500 rounded-full shadow-sm"
                          style={{ width: `${planProgressPercent}%` }}
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-4 bg-gradient-to-r from-green-500/5 to-green-500/10 rounded-xl border border-green-200/30">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 bg-green-500/10 rounded-lg">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Assessment cadence</p>
                            <p className="text-2xl font-bold text-foreground">{assessmentsCompletedLast30Days}</p>
                          </div>
                        </div>
                        <Badge variant="secondary" className="bg-green-500/10 text-green-700 border-green-300">
                          in 30 days
                        </Badge>
                      </div>
                      <div className="relative h-2 bg-muted/30 rounded-full overflow-hidden">
                        <div 
                          className="absolute h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-500 rounded-full shadow-sm"
                          style={{ width: `${Math.min(100, assessmentsCompletedLast30Days * 25)}%` }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="border-2 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-purple-500/5 to-indigo-500/5 border-b">
                  <CardTitle className="flex items-center gap-2">
                    <div className="p-2 bg-purple-500/10 rounded-lg">
                      <TrendingUp className="h-5 w-5 text-purple-600" />
                    </div>
                    Insights &amp; Patterns
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  {positiveTrends.length || focusAreas.length ? (
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h4 className="font-semibold text-base flex items-center gap-2">
                          <div className="p-1.5 bg-green-500/10 rounded-lg">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          </div>
                          Positive trends
                        </h4>
                        <div className="space-y-3">
                          {positiveTrends.length ? (
                            positiveTrends.map((trend) => (
                              <div key={trend.id} className="flex items-start gap-3 p-3 rounded-xl bg-green-500/5 border border-green-200/30 hover:bg-green-500/10 transition-colors">
                                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                                <div className="text-sm space-y-1">
                                  <p className="font-medium text-foreground">{trend.label}</p>
                                  <p className="text-muted-foreground">{trend.detail}</p>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="p-6 text-center rounded-xl bg-muted/30 border border-dashed">
                              <p className="text-sm text-muted-foreground">Keep logging to discover emerging patterns.</p>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h4 className="font-semibold text-base flex items-center gap-2">
                          <div className="p-1.5 bg-yellow-500/10 rounded-lg">
                            <Zap className="h-4 w-4 text-yellow-600" />
                          </div>
                          Areas for focus
                        </h4>
                        <div className="space-y-3">
                          {focusAreas.length ? (
                            focusAreas.map((area) => (
                              <div key={area.id} className="flex items-start gap-3 p-3 rounded-xl bg-yellow-500/5 border border-yellow-200/30 hover:bg-yellow-500/10 transition-colors">
                                <Zap className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                                <div className="text-sm space-y-1">
                                  <p className="font-medium text-foreground">{area.label}</p>
                                  <p className="text-muted-foreground">{area.detail}</p>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="p-6 text-center rounded-xl bg-muted/30 border border-dashed">
                              <p className="text-sm text-muted-foreground">You&apos;re balanced across tracked areas right now.</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12 space-y-4">
                      <div className="p-4 bg-primary/5 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
                        <TrendingUp className="h-8 w-8 text-primary" />
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Insights will appear once you complete assessments.</p>
                        <p className="text-xs text-muted-foreground">Track your mental wellbeing journey</p>
                      </div>
                      <Button size="sm" onClick={() => onNavigate('assessments')} className="shadow-md">
                        Take an assessment
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="goals" className="space-y-6">
              <div className="flex justify-between items-center p-6 rounded-xl bg-gradient-to-r from-blue-500/5 to-cyan-500/5 border border-blue-200/30">
                <div>
                  <h2 className="text-2xl font-bold">Your plan goals</h2>
                  <p className="text-sm text-muted-foreground mt-1">Track your personalized wellness modules</p>
                </div>
                <Button onClick={() => onNavigate('plan')} className="shadow-md">
                  <Target className="h-4 w-4 mr-2" />
                  View personalised plan
                </Button>
              </div>

              {planModules.length ? (
                <div className="space-y-4">
                  {planModules.map((module) => {
                    const progress = Math.round(module.userState?.progress ?? 0);
                    const deadline = module.userState?.scheduledFor
                      ? new Date(module.userState.scheduledFor).toLocaleDateString()
                      : 'Not scheduled';
                    const isCompleted = module.userState?.completed;

                    return (
                      <Card key={module.id} className={`border-2 shadow-lg transition-all hover:shadow-xl ${isCompleted ? 'border-green-300 bg-green-500/5' : 'hover:border-primary/50'}`}>
                        <CardContent className="p-6 space-y-4">
                          <div className="flex items-start justify-between">
                            <div className="space-y-2 flex-1">
                              <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${isCompleted ? 'bg-green-500/10' : 'bg-blue-500/10'}`}>
                                  {isCompleted ? (
                                    <CheckCircle className="h-5 w-5 text-green-600" />
                                  ) : (
                                    <Target className="h-5 w-5 text-blue-600" />
                                  )}
                                </div>
                                <h3 className="font-semibold text-lg">{module.title}</h3>
                              </div>
                              <p className="text-sm text-muted-foreground pl-11">{module.description}</p>
                            </div>
                            <Badge variant={isCompleted ? 'default' : 'secondary'} className={isCompleted ? 'bg-green-500 hover:bg-green-600' : ''}>
                              {isCompleted ? (
                                <>
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Completed
                                </>
                              ) : (
                                'Active'
                              )}
                            </Badge>
                          </div>

                          <div className="space-y-3 pl-11">
                            <div className="flex justify-between items-center text-sm">
                              <span className="font-medium text-muted-foreground">Progress</span>
                              <span className="font-bold text-lg">{progress}%</span>
                            </div>
                            <div className="relative h-3 bg-muted/30 rounded-full overflow-hidden">
                              <div 
                                className={`absolute h-full transition-all duration-500 rounded-full shadow-sm ${
                                  isCompleted 
                                    ? 'bg-gradient-to-r from-green-500 to-emerald-500' 
                                    : 'bg-gradient-to-r from-blue-500 to-cyan-500'
                                }`}
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                          </div>

                          <div className="flex justify-between items-center pt-2 pl-11 border-t">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <CalendarIcon className="h-4 w-4" />
                              <span>Scheduled: {deadline}</span>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => onNavigate('plan')} className="hover:bg-primary/10">
                              Update plan
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <Card className="border-2 border-dashed">
                  <CardContent className="p-12 text-center space-y-4">
                    <div className="p-4 bg-primary/5 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
                      <Target className="h-8 w-8 text-primary" />
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Your personalised plan isn&apos;t set up yet.</p>
                      <p className="text-xs text-muted-foreground">Complete assessments to generate tailored goals.</p>
                    </div>
                    <Button size="sm" onClick={() => onNavigate('plan')} className="shadow-md">
                      <Target className="h-4 w-4 mr-2" />
                      Build my plan
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="achievements" className="space-y-6">
              <div className="p-6 rounded-xl bg-gradient-to-r from-yellow-500/5 via-orange-500/5 to-amber-500/5 border border-yellow-200/30">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-yellow-500/10 rounded-lg">
                    <Trophy className="h-6 w-6 text-yellow-600" />
                  </div>
                  <h2 className="text-2xl font-bold">Achievements &amp; milestones</h2>
                </div>
                <p className="text-muted-foreground">
                  Celebrate your momentum and see what&apos;s next on your wellbeing journey.
                </p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {achievements.map((achievement) => {
                  const isEarned = achievement.earned;
                  return (
                    <Card
                      key={achievement.id}
                      className={`border-2 shadow-lg transition-all hover:scale-[1.02] ${
                        isEarned 
                          ? 'border-yellow-300 bg-gradient-to-br from-yellow-500/10 via-yellow-500/5 to-orange-500/10' 
                          : 'opacity-70 hover:opacity-90 border-muted'
                      }`}
                    >
                      <CardContent className="p-6 text-center space-y-4">
                        <div
                          className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto transition-all ${
                            isEarned 
                              ? 'bg-gradient-to-br from-yellow-500 to-orange-500 text-white shadow-lg' 
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {achievement.icon}
                        </div>

                        <div className="space-y-2">
                          <h3 className="font-semibold text-lg">{achievement.title}</h3>
                          <p className="text-sm text-muted-foreground">{achievement.description}</p>
                        </div>

                        {isEarned ? (
                          <div className="space-y-2 pt-2 border-t">
                            <Badge variant="default" className="bg-yellow-500 hover:bg-yellow-600">
                              <Award className="h-3 w-3 mr-1" />
                              Earned
                            </Badge>
                            {achievement.earnedDate && (
                              <p className="text-xs text-muted-foreground">
                                {new Date(achievement.earnedDate).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-3 pt-2 border-t">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">Progress</span>
                              <span className="font-semibold">{Math.round(achievement.progress ?? 0)}%</span>
                            </div>
                            <div className="relative h-2 bg-muted/30 rounded-full overflow-hidden">
                              <div 
                                className="absolute h-full bg-gradient-to-r from-primary to-accent transition-all duration-500 rounded-full"
                                style={{ width: `${achievement.progress ?? 0}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}
