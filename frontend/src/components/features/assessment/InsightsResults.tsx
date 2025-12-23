import {
  AlertCircle,
  ArrowLeft,
  Brain,
  Download,
  Heart,
  Lightbulb,
  MessageCircle,
  Play,
  Share,
  Sparkles,
  Target,
  TrendingUp
} from 'lucide-react';
import React, { useMemo } from 'react';

import {
  AssessmentHistoryEntry,
  AssessmentInsights
} from '../../../services/api';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Progress } from '../../ui/progress';
import { InsightsSkeleton } from '../../ui/skeleton-loaders';

import { deltaClassForType, trendLabelForType } from './assessmentUtils';
import { OVERALL_ASSESSMENT_OPTION_IDS } from './OverallAssessmentSelection';

interface InsightsResultsProps {
  insights: AssessmentInsights | null;
  history: AssessmentHistoryEntry[];
  onNavigate: (page: string) => void;
  isLoading: boolean;
  errorMessage?: string | null;
  focusAssessmentType?: string | null;
}

const friendlyLabel = (type: string): string => {
  switch (type) {
    case 'anxiety':
      return 'Anxiety';
    case 'stress':
      return 'Stress';
    case 'emotionalIntelligence':
      return 'Emotional Intelligence';
    case 'overthinking':
      return 'Overthinking';
    default:
      return type
        .split(/(?=[A-Z])/)
        .join(' ')
        .replace(/^[a-z]/, (match) => match.toUpperCase());
  }
};

const getScoreColor = (score: number) => {
  if (score >= 70) return 'text-red-600';
  if (score >= 40) return 'text-yellow-600';
  return 'text-green-600';
};

const getScoreBg = (score: number) => {
  if (score >= 70) return 'bg-red-50 border-red-200';
  if (score >= 40) return 'bg-yellow-50 border-yellow-200';
  return 'bg-green-50 border-green-200';
};

const formatChange = (change?: number | null): string | undefined => {
  if (change === undefined || change === null) return undefined;
  const rounded = Math.round(change);
  if (rounded === 0) return '0';
  return `${rounded > 0 ? '+' : ''}${rounded}`;
};

const relativeTimeFormat = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

const formatRelativeTime = (dateString: string): string => {
  const time = new Date(dateString).getTime();
  if (Number.isNaN(time)) {
    return 'Unknown';
  }
  const diff = time - Date.now();
  const units: Array<{ unit: Intl.RelativeTimeFormatUnit; ms: number }> = [
    { unit: 'day', ms: 86_400_000 },
    { unit: 'hour', ms: 3_600_000 },
    { unit: 'minute', ms: 60_000 }
  ];

  for (const { unit, ms } of units) {
    const value = diff / ms;
    if (Math.abs(value) >= 1) {
      return relativeTimeFormat.format(Math.round(value), unit);
    }
  }

  return 'Just now';
};

const BASIC_OVERALL_ASSESSMENT_SET = new Set(OVERALL_ASSESSMENT_OPTION_IDS);
const normalizeTypeKey = (value: string): string => value.toLowerCase().replace(/[^a-z0-9]/g, '');
const BASIC_OVERALL_NORMALIZED_SET = new Set(Array.from(BASIC_OVERALL_ASSESSMENT_SET).map(normalizeTypeKey));

const FOCUS_ALIAS_MAP: Record<string, string[]> = {
  anxiety: ['anxiety', 'anxiety_assessment'],
  anxietyassessment: ['anxiety', 'anxiety_assessment'],
  depression: ['depression', 'depression_phq9', 'phq9'],
  depressionphq9: ['depression', 'depression_phq9', 'phq9'],
  phq9: ['depression', 'depression_phq9', 'phq9'],
  stress: ['stress', 'stress_pss10'],
  stresspss10: ['stress', 'stress_pss10'],
  emotionalintelligence: ['emotional_intelligence', 'emotionalIntelligence', 'emotional_intelligence_teique', 'emotional_intelligence_ei10'],
  emotional_intelligence: ['emotional_intelligence', 'emotionalIntelligence', 'emotional_intelligence_teique', 'emotional_intelligence_ei10'],
  emotionalintelligenceteique: ['emotional_intelligence', 'emotional_intelligence_teique', 'emotionalIntelligence'],
  emotionalintelligenceei10: ['emotional_intelligence_ei10', 'emotional_intelligence', 'emotionalIntelligence'],
  emotionalintelligenceeq5: ['emotional_intelligence_eq5'],
  overthinking: ['overthinking', 'overthinking_ptq', 'overthinking_brooding'],
  overthinkingptq: ['overthinking', 'overthinking_ptq'],
  overthinkingbrooding: ['overthinking', 'overthinking_brooding'],
  trauma: ['trauma', 'trauma_pcl5', 'trauma-fear', 'traumafear'],
  traumapcl5: ['trauma_pcl5', 'trauma', 'trauma-fear'],
  traumafear: ['trauma-fear', 'trauma', 'trauma_pcl5'],
  traumapcptsd5: ['trauma_pcptsd5'],
  personality: ['personality', 'personality_mini_ipip', 'archetypes', 'psychological_archetypes'],
  personalityminiipip: ['personality_mini_ipip', 'personality', 'archetypes'],
  archetypes: ['archetypes', 'personality', 'personality_mini_ipip'],
  personalitybigfive10: ['personality_bigfive10'],
  anxietygad2: ['anxiety_gad2'],
  depressionphq2: ['depression_phq2'],
  stresspss4: ['stress_pss4'],
  overthinkingrrs4: ['overthinking_rrs4']
};

const getFocusMatchSet = (focusType?: string | null): Set<string> | null => {
  if (!focusType) return null;
  const normalized = normalizeTypeKey(focusType);
  const aliases = FOCUS_ALIAS_MAP[normalized] ?? [focusType];
  return new Set(aliases.map((alias) => normalizeTypeKey(alias)));
};

type BasicOverallSnapshot = {
  id: string;
  completedAt: string;
  combinedScore: number;
  change: number | null;
  assessments: AssessmentHistoryEntry[];
};

const buildRecommendations = (
  insights: AssessmentInsights | null,
  focusSet: Set<string> | null
): Array<{ title: string; description: string; type: 'immediate' | 'daily' | 'support'; }> => {
  if (!insights) return [];

  const unique = new Set<string>();
  const recs: Array<{ title: string; description: string; type: 'immediate' | 'daily' | 'support'; }> = [];

  const entries = focusSet
    ? Object.entries(insights.byType).filter(([type]) => focusSet.has(normalizeTypeKey(type)))
    : Object.entries(insights.byType);

  entries.forEach(([, summary]) => {
    summary.recommendations.forEach((line) => {
      if (!unique.has(line)) {
        unique.add(line);
        recs.push({
          title: line.split('.')[0],
          description: line,
          type: summary.trend === 'improving' ? 'daily' : summary.trend === 'declining' ? 'immediate' : 'support'
        });
      }
    });
  });

  return recs.slice(0, 4);
};

const getRecommendationIcon = (type: 'immediate' | 'daily' | 'support') => {
  switch (type) {
    case 'immediate':
      return <Heart className="h-4 w-4" />;
    case 'daily':
      return <Target className="h-4 w-4" />;
    default:
      return <MessageCircle className="h-4 w-4" />;
  }
};

export function InsightsResults({ insights, history, onNavigate, isLoading, errorMessage, focusAssessmentType }: InsightsResultsProps) {
  const hasInsights = insights && Object.keys(insights.byType).length > 0;
  const focusSet = useMemo(() => getFocusMatchSet(focusAssessmentType), [focusAssessmentType]);

  const basicSummaryEntries = useMemo(() => {
    if (!insights) return [] as Array<[string, AssessmentInsights['byType'][string]]>;
    return Object.entries(insights.byType).filter(([type]) => BASIC_OVERALL_ASSESSMENT_SET.has(type));
  }, [insights]);

  const otherSummaryEntries = useMemo(() => {
    if (!insights) return [] as Array<[string, AssessmentInsights['byType'][string]]>;
    return Object.entries(insights.byType).filter(([type]) => !BASIC_OVERALL_ASSESSMENT_SET.has(type));
  }, [insights]);

  const combinedWellnessScore = insights?.wellnessScore ? Math.round(insights.wellnessScore.value) : null;
  const combinedWellnessUpdatedAt = insights?.wellnessScore?.updatedAt ?? null;

  const focusFilteredBasic = useMemo(() => {
    if (!focusSet) return basicSummaryEntries;
    return basicSummaryEntries.filter(([type]) => focusSet.has(normalizeTypeKey(type)));
  }, [basicSummaryEntries, focusSet]);

  const focusFilteredOther = useMemo(() => {
    if (!focusSet) return otherSummaryEntries;
    return otherSummaryEntries.filter(([type]) => focusSet.has(normalizeTypeKey(type)));
  }, [otherSummaryEntries, focusSet]);

  const hasFocusMatches = focusSet ? focusFilteredBasic.length + focusFilteredOther.length > 0 : false;
  const appliedFocusSet = focusSet && hasFocusMatches ? focusSet : null;
  const focusIncludesBasicOverall = appliedFocusSet
    ? Array.from(appliedFocusSet).some((key) => BASIC_OVERALL_NORMALIZED_SET.has(key))
    : false;

  const visibleBasicSummaryEntries = appliedFocusSet ? focusFilteredBasic : basicSummaryEntries;
  const visibleOtherSummaryEntries = appliedFocusSet ? focusFilteredOther : otherSummaryEntries;
  const nonBasicFocusedEntries = appliedFocusSet ? focusFilteredOther : [];

  const recommendations = buildRecommendations(insights, appliedFocusSet);

  const basicOverallHistoryMap = new Map<string, AssessmentHistoryEntry[]>();
  const filteredHistory = history.filter((entry) => {
    if (BASIC_OVERALL_ASSESSMENT_SET.has(entry.assessmentType)) {
      const key = entry.completedAt.slice(0, 16);
      const group = basicOverallHistoryMap.get(key);
      if (group) {
        group.push(entry);
      } else {
        basicOverallHistoryMap.set(key, [entry]);
      }
      return false;
    }
    return true;
  });

  const combinedHistorySnapshots: BasicOverallSnapshot[] = Array.from(basicOverallHistoryMap.entries())
    .map(([key, entries]) => {
      const sortedEntries = [...entries].sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());
      const latest = sortedEntries[0];
      const combinedScore = Math.round(sortedEntries.reduce((acc, entry) => acc + entry.score, 0) / sortedEntries.length);
      return {
        id: `basic-overall-${key}`,
        completedAt: latest.completedAt,
        combinedScore,
        change: null,
        assessments: sortedEntries
      };
    })
    .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());

  const combinedSnapshotsWithChange: BasicOverallSnapshot[] = combinedHistorySnapshots.map((snapshot, index) => {
    const next = combinedHistorySnapshots[index + 1];
    return {
      ...snapshot,
      change: next ? snapshot.combinedScore - next.combinedScore : null
    };
  });

  const groupedHistory = filteredHistory.reduce<Record<string, AssessmentHistoryEntry[]>>((acc, entry) => {
    if (!acc[entry.assessmentType]) {
      acc[entry.assessmentType] = [];
    }
    acc[entry.assessmentType].push(entry);
    return acc;
  }, {});

  Object.values(groupedHistory).forEach((entries) => {
    entries.sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());
  });

  const shouldShowCombinedSnapshots = !appliedFocusSet
    ? combinedSnapshotsWithChange.length > 0
    : Array.from(appliedFocusSet).some((key) => BASIC_OVERALL_NORMALIZED_SET.has(key)) && combinedSnapshotsWithChange.length > 0;

  const visibleCombinedSnapshots = shouldShowCombinedSnapshots
    ? combinedSnapshotsWithChange
    : [];

  const visibleGroupedHistoryEntries = appliedFocusSet
    ? Object.entries(groupedHistory).filter(([type]) => appliedFocusSet.has(normalizeTypeKey(type)))
    : Object.entries(groupedHistory);

  const hasTimelineData = visibleCombinedSnapshots.length > 0 || visibleGroupedHistoryEntries.length > 0;
  const focusLabel = focusAssessmentType ? friendlyLabel(focusAssessmentType) : null;
  const aiSummaryContent = useMemo(() => {
    if (!insights) return null;

    const baseSummary = insights.aiSummary?.trim();
    if (!appliedFocusSet) {
      return baseSummary || null;
    }

    const focusedEntries = Object.entries(insights.byType).filter(([type]) =>
      appliedFocusSet.has(normalizeTypeKey(type))
    );

    if (focusedEntries.length === 0) {
      return baseSummary || null;
    }

    const segments = focusedEntries
      .map(([type, summary]) => {
        const pieces: string[] = [];
        const interpretation = summary.interpretation?.trim();
        if (interpretation) {
          pieces.push(interpretation);
        }

        if (typeof summary.change === 'number') {
          const roundedChange = Math.round(summary.change);
          if (roundedChange !== 0) {
            const direction = roundedChange > 0 ? 'up' : 'down';
            pieces.push(`Recent score moved ${direction} by ${Math.abs(roundedChange)} points.`);
          }
        }

        if (pieces.length === 0) {
          const trendLabel = trendLabelForType(type, summary.trend);
          if (trendLabel) {
            pieces.push(`Trend is ${trendLabel.toLowerCase()}.`);
          }
        }

        const recommended = (summary.recommendations ?? []).filter(Boolean).slice(0, 2);
        if (recommended.length > 0) {
          pieces.push(`Suggested focus: ${recommended.join('; ')}`);
        }

        if (pieces.length === 0) {
          return null;
        }

        return `${friendlyLabel(type)}: ${pieces.join(' ')}`;
      })
      .filter((segment): segment is string => Boolean(segment));

    if (segments.length === 0) {
      return baseSummary || null;
    }

    return segments.join(' ');
  }, [appliedFocusSet, insights]);

  const showAISummary = hasInsights && Boolean(aiSummaryContent);

  const backNavigationTarget = appliedFocusSet && !focusIncludesBasicOverall ? 'assessments' : 'dashboard';
  const backNavigationLabel = backNavigationTarget === 'assessments' ? 'Back to Assessments' : 'Back to Dashboard';

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-gradient-to-r from-primary/10 to-accent/10 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between gap-4 mb-6">
            <Button variant="ghost" size="sm" onClick={() => onNavigate(backNavigationTarget)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              {backNavigationLabel}
            </Button>
            <Button onClick={() => onNavigate('dashboard')}>
              Go to Dashboard
            </Button>
          </div>

          <div className="space-y-4">
            <h1 className="text-3xl">Your Wellbeing Insights</h1>
            <p className="text-muted-foreground text-lg">
              {isLoading
                ? 'Syncing the latest assessments…'
                : appliedFocusSet
                  ? `Showing the latest results for ${focusLabel ?? 'this assessment'}`
                  : hasInsights
                    ? 'Based on your latest assessment history'
                    : 'Complete an assessment to unlock personalized insights'}
            </p>
            {appliedFocusSet && (
              <Badge variant="outline" className="border-primary/40 bg-primary/10 text-primary">
                Viewing {focusLabel ?? 'selected assessment'}
              </Badge>
            )}
            {errorMessage && (
              <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2 inline-block">
                {errorMessage}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6 space-y-8">
        {isLoading && !hasInsights ? (
          <InsightsSkeleton />
        ) : hasInsights ? (
          <>
            {/* AI Summary Card */}
            {showAISummary && (
              <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-primary" />
                  Your Wellbeing Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-muted-foreground leading-relaxed">
                    {aiSummaryContent}
                  </p>
                </div>
              </CardContent>
              </Card>
            )}

            {combinedWellnessScore !== null && visibleBasicSummaryEntries.length > 0 && (!appliedFocusSet || focusIncludesBasicOverall) && (
              <Card className="border-primary/30 bg-primary/5">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-primary" />
                      <span>Basic Overall Assessment</span>
                    </div>
                    <Badge variant="outline" className="border-primary/40 bg-white/70 text-primary">
                      Combined score {combinedWellnessScore}%
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="md:col-span-1 space-y-2">
                      <p className="text-4xl font-semibold text-primary">{combinedWellnessScore}</p>
                      <p className="text-sm text-muted-foreground">
                        Overall wellbeing snapshot from your quick baseline.
                      </p>
                      {combinedWellnessUpdatedAt && (
                        <p className="text-xs text-muted-foreground">
                          Last refreshed {formatRelativeTime(combinedWellnessUpdatedAt)}
                        </p>
                      )}
                    </div>
                    <div className="md:col-span-2 space-y-3">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Sub-assessment scores
                      </p>
                      <div className="grid gap-3 sm:grid-cols-2">
                          {visibleBasicSummaryEntries.map(([type, summary]) => (
                          <div key={type} className="rounded-lg border bg-white/80 px-4 py-3 shadow-sm">
                            <div className="flex items-center justify-between text-sm">
                              <span className="font-medium text-foreground">{friendlyLabel(type)}</span>
                              <span className="font-semibold text-primary">{Math.round(summary.latestScore)}%</span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">{summary.interpretation}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {appliedFocusSet && nonBasicFocusedEntries.map(([type, summary]) => (
              <Card key={type} className="border-primary/20">
                <CardHeader className="space-y-2">
                  <CardTitle className="flex items-center justify-between gap-2">
                    <span>{friendlyLabel(type)}</span>
                    <Badge variant="secondary" className={getScoreColor(summary.latestScore)}>
                      {trendLabelForType(type, summary.trend)}
                    </Badge>
                  </CardTitle>
                  <p className="text-sm text-muted-foreground leading-relaxed">{summary.interpretation}</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-lg border p-4 bg-muted/40">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Latest score</p>
                      <p className="text-3xl font-semibold text-primary mt-1">{Math.round(summary.latestScore)}%</p>
                      {summary.change !== null && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Change{' '}
                          <span className={deltaClassForType(type, summary.change)}>{formatChange(summary.change)}</span>
                          {' '}points
                        </p>
                      )}
                    </div>
                    <div className="rounded-lg border p-4">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Trend metrics</p>
                      <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                        <li>Average {Math.round(summary.averageScore)}%</li>
                        <li>Best {Math.round(summary.bestScore)}%</li>
                        {summary.lastCompletedAt && (
                          <li>Last completed {formatRelativeTime(summary.lastCompletedAt)}</li>
                        )}
                      </ul>
                    </div>
                  </div>

                  {summary.categoryBreakdown && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        {Object.keys(summary.categoryBreakdown).length === 1 && summary.categoryBreakdown.overall
                          ? 'Assessment Details'
                          : 'Symptom Categories'}
                      </p>
                      <div className="space-y-2">
                        {Object.entries(summary.categoryBreakdown).map(([category, details]) => (
                          <div key={category} className="flex items-center justify-between rounded-md border px-3 py-2 text-xs">
                            <div className="font-medium capitalize">{category === 'overall' ? 'Overall Score' : category.replace(/_/g, ' ')}</div>
                            <div className="text-right">
                              <p className="font-semibold text-primary">{Math.round(details.normalized)}%</p>
                              <p className="text-[11px] text-muted-foreground leading-tight">{details.interpretation}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}

            {!appliedFocusSet && visibleOtherSummaryEntries.length > 0 && (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {visibleOtherSummaryEntries.map(([type, summary]) => (
                  <Card key={type} className={`border-2 ${getScoreBg(summary.latestScore)}`}>
                    <CardContent className="p-6 space-y-4">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div>
                          <h3 className="font-semibold">{friendlyLabel(type)}</h3>
                          <p className="text-xs text-muted-foreground">{summary.interpretation}</p>
                        </div>
                        <Badge variant="secondary" className={getScoreColor(summary.latestScore)}>
                          {trendLabelForType(type, summary.trend)}
                        </Badge>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-2xl font-semibold">{Math.round(summary.latestScore)}%</span>
                          {summary.change !== null && (
                            <span className="text-sm text-muted-foreground">
                              Change{' '}
                              <span className={deltaClassForType(type, summary.change)}>
                                {formatChange(summary.change)}
                              </span>
                            </span>
                          )}
                        </div>
                        <Progress value={summary.latestScore} className="h-2" />
                        <p className="text-xs text-muted-foreground">
                          Average {Math.round(summary.averageScore)}% • Best {Math.round(summary.bestScore)}%
                        </p>
                        {typeof summary.rawScore === 'number' && summary.maxScore && (
                          <p className="text-xs text-muted-foreground">
                            Raw score {Math.round(summary.rawScore)} / {summary.maxScore}
                          </p>
                        )}
                      </div>

                      {summary.categoryBreakdown && (
                        <div className="mt-4 space-y-2">
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            {Object.keys(summary.categoryBreakdown).length === 1 && summary.categoryBreakdown.overall
                              ? 'Assessment Details'
                              : 'Symptom Categories'}
                          </p>
                          <div className="space-y-2">
                            {Object.entries(summary.categoryBreakdown).map(([category, details]) => (
                              <div key={category} className="flex items-center justify-between rounded-md border px-3 py-2 text-xs">
                                <div className="font-medium capitalize">{category === 'overall' ? 'Overall Score' : category.replace(/_/g, ' ')}</div>
                                <div className="text-right">
                                  <p className="font-semibold text-primary">{Math.round(details.normalized)}%</p>
                                  <p className="text-[11px] text-muted-foreground leading-tight">{details.interpretation}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {recommendations.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-primary" />
                    Recommended Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground">
                    Based on your momentum, try these gentle next steps:
                  </p>
                  <div className="grid md:grid-cols-2 gap-4">
                    {recommendations.map((rec) => (
                      <Card key={rec.description} className="border hover:border-primary/20 transition-colors">
                        <CardContent className="p-4 space-y-3">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg text-primary">
                              {getRecommendationIcon(rec.type)}
                            </div>
                            <div className="flex-1">
                              <h4 className="font-medium">{rec.title}</h4>
                              <p className="text-sm text-muted-foreground">{rec.description}</p>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            className="w-full"
                            onClick={() => onNavigate('practices')}
                          >
                            {rec.type === 'immediate' ? 'Start Now' : 'Explore Practice'}
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Progress Over Time
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {!hasTimelineData ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Complete another assessment to start building your progress timeline.</p>
                    <Button variant="outline" size="sm" className="mt-3" onClick={() => onNavigate('assessments')}>
                      Take Another Assessment
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {visibleCombinedSnapshots.length > 0 && (!appliedFocusSet || focusIncludesBasicOverall) && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-base">Basic Overall Assessment</h3>
                          <span className="text-xs text-muted-foreground">{visibleCombinedSnapshots.length} snapshots</span>
                        </div>
                        <div className="space-y-2">
                          {visibleCombinedSnapshots.slice(0, 4).map((snapshot) => (
                            <div key={snapshot.id} className="space-y-3 rounded-lg border p-4">
                              <div className="flex items-start justify-between gap-4">
                                <div>
                                  <p className="text-sm font-medium text-muted-foreground">Combined wellbeing snapshot</p>
                                  <p className="text-xs text-muted-foreground">
                                    Completed {formatRelativeTime(snapshot.completedAt)}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="text-lg font-semibold text-primary">{snapshot.combinedScore}%</p>
                                  {snapshot.change !== null && (
                                    <p className="text-xs text-muted-foreground">
                                      Change{' '}
                                      <span className={deltaClassForType('basic_overall_assessment', snapshot.change)}>
                                        {formatChange(snapshot.change)}
                                      </span>
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="grid gap-2 sm:grid-cols-2">
                                {snapshot.assessments.map((entry) => (
                                  <div key={`${snapshot.id}-${entry.assessmentType}`} className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2 text-xs">
                                    <span className="font-medium text-muted-foreground">{friendlyLabel(entry.assessmentType)}</span>
                                    <span className="font-semibold text-primary">{Math.round(entry.score)}%</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {visibleGroupedHistoryEntries.map(([type, entries]) => (
                      <div key={type} className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-base">{friendlyLabel(type)}</h3>
                          <span className="text-xs text-muted-foreground">{entries.length} results</span>
                        </div>
                        <div className="space-y-2">
                          {entries.slice(0, 4).map((entry) => (
                            <div
                              key={`${entry.id}-${entry.completedAt}`}
                              className="flex items-start justify-between gap-4 rounded-lg border p-3"
                            >
                              <div>
                                <p className="text-sm font-medium text-muted-foreground">{entry.interpretation}</p>
                                <p className="text-xs text-muted-foreground">
                                  Completed {formatRelativeTime(entry.completedAt)}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-lg font-semibold text-primary">{Math.round(entry.score)}%</p>
                                {entry.changeFromPrevious !== null && (
                                  <p className="text-xs text-muted-foreground">
                                    Change{' '}
                                    <span className={deltaClassForType(entry.assessmentType, entry.changeFromPrevious)}>
                                      {formatChange(entry.changeFromPrevious)}
                                    </span>
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        ) : (
          <Card>
            <CardContent className="p-10 text-center space-y-4">
              <Brain className="h-12 w-12 mx-auto text-primary" />
              <h2 className="text-2xl font-semibold">No assessments yet</h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                Take your first wellbeing assessment to unlock AI-powered insights, personalised guidance, and track your progress over time.
              </p>
              <Button size="lg" onClick={() => onNavigate('assessments')} className="mt-2">
                Start an Assessment
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Button className="flex-1" onClick={() => onNavigate('plan')}>
            <Play className="h-4 w-4 mr-2" />
            Create Personalised Plan
          </Button>

          <Button variant="outline" onClick={() => onNavigate('chatbot')}>
            <MessageCircle className="h-4 w-4 mr-2" />
            Discuss Results
          </Button>

          <Button variant="outline" onClick={() => {}}>
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>

          <Button variant="outline" onClick={() => {}}>
            <Share className="h-4 w-4 mr-2" />
            Share with Clinician
          </Button>
        </div>

        {/* Important Notes */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <AlertCircle className="h-6 w-6 text-muted-foreground mt-1" />
              <div className="space-y-2">
                <h3 className="font-semibold">Important Notes</h3>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>• These results are based on self-reported assessments and are for informational purposes only.</p>
                  <p>• This is not a clinical diagnosis and should not replace professional medical advice.</p>
                  <p>• If you’re experiencing severe symptoms, please consult with a healthcare professional.</p>
                  <p>• Your results are private and encrypted — you control who sees them.</p>
                </div>
                <Button variant="link" className="p-0 h-auto text-sm" onClick={() => onNavigate('help')}>
                  Crisis Resources &amp; Professional Support →
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
