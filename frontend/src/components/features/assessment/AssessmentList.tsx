import {
  ArrowLeft,
  Brain,
  CheckCircle,
  Clock,
  Heart,
  Play,
  Shield,
  Sparkles,
  Target,
  Users,
  Zap,
  RefreshCw,
  BarChart3
} from 'lucide-react';
import React from 'react';

import {
  AssessmentHistoryEntry,
  AssessmentInsights,
  AssessmentTrend
} from '../../../services/api';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { Card, CardContent } from '../../ui/card';
import { InlineLoading } from '../../ui/loading-spinner';
import { Progress } from '../../ui/progress';

import { AssessmentTrendsVisualization } from './AssessmentTrendsVisualization';
import { friendlyAssessmentLabel, trendLabelForType, deltaClassForType } from './assessmentUtils';
import { OVERALL_ASSESSMENT_OPTION_IDS } from './OverallAssessmentSelection';

interface AssessmentListProps {
  onStartAssessment: (assessmentId: string) => void;
  onStartCombinedAssessment: () => void;
  onNavigate: (page: string) => void;
  onViewAssessmentResults: (assessmentType: string | null) => void;
  insights: AssessmentInsights | null;
  history: AssessmentHistoryEntry[];
  isLoading: boolean;
  isStartingCombinedAssessment?: boolean;
  errorMessage?: string | null;
}

interface AssessmentCardConfig {
  id: string;
  title: string;
  description: string;
  duration: string;
  questions: number;
  icon: React.ReactNode;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  category: 'required' | 'recommended' | 'optional';
  typeKey?: string;
}

interface AssessmentCardState extends AssessmentCardConfig {
  completed: boolean;
  lastTaken?: string;
  score?: number;
  trend?: AssessmentTrend;
  change?: number | null;
  recommendations?: string[];
  trendLabel?: string;
}

const baseAssessments: AssessmentCardConfig[] = [
  {
    id: 'anxiety_assessment',
    title: 'Anxiety Assessment (GAD-7)',
    description: 'A standardized 7-question assessment for generalized anxiety disorder screening.',
    duration: '2-3 minutes',
    questions: 7,
    icon: <Brain className="h-6 w-6" />,
    difficulty: 'Beginner',
    category: 'required',
    typeKey: 'anxiety_assessment'
  },
  {
    id: 'depression',
    title: 'Depression Assessment (PHQ-9)',
    description: 'Nine-item Patient Health Questionnaire for tracking depressive symptoms.',
    duration: '5-7 minutes',
    questions: 9,
    icon: <Heart className="h-6 w-6" />,
    difficulty: 'Beginner',
    category: 'required',
    typeKey: 'depression_phq9'
  },
  {
    id: 'stress',
    title: 'Stress (PSS-10)',
    description: 'Standard 10-item Perceived Stress Scale to understand stress over the past month.',
    duration: '5-6 minutes',
    questions: 10,
    icon: <Target className="h-6 w-6" />,
    difficulty: 'Beginner',
    category: 'required',
    typeKey: 'stress_pss10'
  },
  {
    id: 'emotional-intelligence',
    title: 'Emotional Intelligence (TEIQue-SF)',
    description: 'Comprehensive 30-item trait emotional intelligence inventory.',
    duration: '8-10 minutes',
    questions: 30,
    icon: <Sparkles className="h-6 w-6" />,
    difficulty: 'Intermediate',
    category: 'recommended',
    typeKey: 'emotional_intelligence_teique'
  },
  {
    id: 'overthinking',
    title: 'Overthinking (PTQ)',
    description: 'Fifteen-item Perseverative Thinking Questionnaire for repetitive thought loops.',
    duration: '6-7 minutes',
    questions: 15,
    icon: <Zap className="h-6 w-6" />,
    difficulty: 'Intermediate',
    category: 'recommended',
    typeKey: 'overthinking_ptq'
  },
  {
    id: 'trauma-fear',
    title: 'Trauma & Fear Response (PCL-5)',
    description: 'Standard 20-item PTSD Checklist for DSM-5 (optional, sensitive content).',
    duration: '8-10 minutes',
    questions: 20,
    icon: <Shield className="h-6 w-6" />,
    difficulty: 'Advanced',
    category: 'optional',
    typeKey: 'trauma_pcl5'
  },
  {
    id: 'archetypes',
    title: 'Personality (Mini-IPIP)',
    description: 'Twenty-item Mini-IPIP to understand your Big Five personality blend.',
    duration: '6-7 minutes',
    questions: 20,
    icon: <Users className="h-6 w-6" />,
    difficulty: 'Advanced',
    category: 'optional',
    typeKey: 'personality_mini_ipip'
  }
];

const trendChipClasses: Record<AssessmentTrend | 'baseline', string> = {
  improving: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  declining: 'bg-rose-50 text-rose-700 border border-rose-200',
  stable: 'bg-blue-50 text-blue-700 border border-blue-200',
  baseline: 'bg-slate-100 text-slate-600 border border-slate-200'
};

const relativeTimeFormat = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

const BASIC_OVERALL_ASSESSMENT_SET = new Set(OVERALL_ASSESSMENT_OPTION_IDS);

interface CombinedHistorySnapshot {
  id: string;
  completedAt: string;
  combinedScore: number;
  change: number | null;
  assessments: AssessmentHistoryEntry[];
}

const getRelativeTime = (dateString?: string): string | undefined => {
  if (!dateString) return undefined;
  const target = new Date(dateString).getTime();
  if (Number.isNaN(target)) return undefined;
  const now = Date.now();
  const diffMs = target - now;

  const units: Array<{ unit: Intl.RelativeTimeFormatUnit; ms: number }> = [
    { unit: 'day', ms: 86_400_000 },
    { unit: 'hour', ms: 3_600_000 },
    { unit: 'minute', ms: 60_000 }
  ];

  for (const { unit, ms } of units) {
    const value = diffMs / ms;
    if (Math.abs(value) >= 1) {
      return relativeTimeFormat.format(Math.round(value), unit);
    }
  }

  return 'Just now';
};

const formatChange = (change?: number | null): string | undefined => {
  if (change === undefined || change === null) return undefined;
  const rounded = Math.round(change);
  if (rounded === 0) return '0';
  return `${rounded > 0 ? '+' : ''}${rounded}`;
};

export function AssessmentList({ onStartAssessment, onStartCombinedAssessment, onNavigate, onViewAssessmentResults, insights, history, isLoading, isStartingCombinedAssessment, errorMessage }: AssessmentListProps) {
  const summaryByType = insights?.byType ?? {};
  const combinedWellnessScore = insights?.wellnessScore ? Math.round(insights.wellnessScore.value) : null;
  const combinedWellnessUpdatedAt = insights?.wellnessScore?.updatedAt;
  const combinedWellnessRelativeTime = combinedWellnessUpdatedAt ? getRelativeTime(combinedWellnessUpdatedAt) : null;

  const resolveSummary = (typeKey?: string) => {
    if (!typeKey) return undefined;
    if (summaryByType[typeKey]) return summaryByType[typeKey];

    switch (typeKey) {
      case 'anxiety_assessment':
        return summaryByType.anxiety ?? summaryByType['anxiety_assessment'];
      case 'depression_phq9':
      case 'depression':
      case 'phq9':
        return (
          summaryByType.depression_phq9 ??
          summaryByType.depression ??
          summaryByType.phq9
        );
      case 'stress_pss10':
        return summaryByType.stress ?? summaryByType['stress'];
      case 'emotional_intelligence_teique':
      case 'emotional_intelligence':
      case 'emotional-intelligence':
      case 'emotionalIntelligence':
        return (
          summaryByType.emotional_intelligence_teique ??
          summaryByType.emotionalIntelligence ??
          summaryByType.emotional_intelligence ??
          summaryByType.emotional_intelligence_ei10 ??
          summaryByType.emotional_intelligence_eq5
        );
      case 'emotional_intelligence_ei10':
        return (
          summaryByType.emotional_intelligence_ei10 ??
          summaryByType.emotional_intelligence_teique ??
          summaryByType.emotionalIntelligence ??
          summaryByType['emotional-intelligence'] ??
          summaryByType.emotional_intelligence_eq5
        );
      case 'overthinking_brooding':
        return (
          summaryByType.overthinking_brooding ??
          summaryByType.overthinking ??
          summaryByType.overthinking_ptq
        );
      case 'overthinking_ptq':
      case 'overthinking':
        return (
          summaryByType.overthinking_ptq ??
          summaryByType.overthinking ??
          summaryByType.overthinking_brooding
        );
      case 'trauma_pcl5':
      case 'trauma':
        return (
          summaryByType.trauma_pcl5 ??
          summaryByType.trauma ??
          summaryByType['trauma-fear'] ??
          summaryByType.trauma_pcptsd5
        );
      case 'personality_mini_ipip':
      case 'archetypes':
      case 'personality':
        return (
          summaryByType.personality_mini_ipip ??
          summaryByType.personality ??
          summaryByType.archetypes
        );
      default:
        return undefined;
    }
  };

  const assessments: AssessmentCardState[] = baseAssessments.map((assessment) => {
    const typeKey = assessment.typeKey;
    const summary = resolveSummary(typeKey);

    return {
      ...assessment,
      completed: Boolean(summary),
      lastTaken: summary ? getRelativeTime(summary.lastCompletedAt) : undefined,
      score: summary ? Math.round(summary.latestScore) : undefined,
      trend: summary?.trend,
      change: summary?.change ?? null,
      recommendations: summary?.recommendations,
      trendLabel: summary ? trendLabelForType(typeKey ?? assessment.id, summary.trend) : undefined
    };
  });

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'required':
        return 'bg-red-100 text-red-800';
      case 'recommended':
        return 'bg-yellow-100 text-yellow-800';
      case 'optional':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner':
        return 'bg-green-100 text-green-800';
      case 'Intermediate':
        return 'bg-yellow-100 text-yellow-800';
      case 'Advanced':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCompletionStats = () => {
    const total = assessments.length;
    const completed = assessments.filter((a) => a.completed).length;
    const required = assessments.filter((a) => a.category === 'required');
    const requiredCompleted = required.filter((a) => a.completed).length;

    return {
      total,
      completed,
      required: required.length,
      requiredCompleted,
      percentage: total === 0 ? 0 : Math.round((completed / total) * 100)
    };
  };

  const stats = getCompletionStats();
  const showLoadingState = isLoading && history.length === 0 && Object.keys(summaryByType).length === 0;

  const basicOverallHistoryMap = new Map<string, AssessmentHistoryEntry[]>();
  const individualHistory = history.filter((entry) => {
    if (BASIC_OVERALL_ASSESSMENT_SET.has(entry.assessmentType)) {
      const key = entry.completedAt.slice(0, 16);
      const existing = basicOverallHistoryMap.get(key);
      if (existing) {
        existing.push(entry);
      } else {
        basicOverallHistoryMap.set(key, [entry]);
      }
      return false;
    }
    return true;
  });

  const combinedHistorySnapshots: CombinedHistorySnapshot[] = Array.from(basicOverallHistoryMap.entries())
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

  const combinedHistoryWithChange: CombinedHistorySnapshot[] = combinedHistorySnapshots.map((snapshot, index) => {
    const next = combinedHistorySnapshots[index + 1];
    return {
      ...snapshot,
      change: next ? snapshot.combinedScore - next.combinedScore : null
    };
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/10 to-accent/10 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onNavigate('dashboard')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </div>

          <div className="space-y-4">
            <h1 className="text-3xl">Mental Health Assessments</h1>
            <p className="text-muted-foreground text-lg">
              Science-based assessments to understand your mental wellbeing patterns
            </p>

            {/* Progress Overview */}
            <Card>
              <CardContent className="p-4">
                {/* Show combined wellness score if available */}
                {insights?.wellnessScore && (
                  <div className="mb-4 p-4 bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg border border-primary/20">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="font-semibold text-lg">Combined Wellness Score</p>
                        <p className="text-sm text-muted-foreground">
                          From your onboarding assessment
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-bold text-primary">
                          {Math.round(insights.wellnessScore.value)}
                        </div>
                        <div className="text-xs text-muted-foreground">/ 100</div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="flex items-center justify-between mb-3">
                  <div className="space-y-1">
                    <p className="font-medium">Individual Assessment Progress</p>
                    <p className="text-sm text-muted-foreground">
                      {stats.completed} of {stats.total} completed • {stats.requiredCompleted} of {stats.required} required done
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-semibold text-primary">
                      {stats.percentage}%
                    </div>
                    <div className="text-xs text-muted-foreground">Complete</div>
                  </div>
                </div>
                <Progress value={stats.percentage} className="h-2" />
                {showLoadingState && (
                  <div className="mt-3">
                    <InlineLoading message="Syncing your assessment history..." size="sm" />
                  </div>
                )}
                {errorMessage && (
                  <p className="mt-3 text-sm text-destructive">
                    {errorMessage}
                  </p>
                )}
                <div className="mt-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="text-sm text-muted-foreground">
                    Revisit the quick baseline you saw during onboarding to refresh personalized insights.
                  </div>
                  <Button
                    onClick={onStartCombinedAssessment}
                    disabled={isStartingCombinedAssessment}
                    className="w-full md:w-auto"
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    {isStartingCombinedAssessment ? 'Preparing assessment…' : 'Start Basic Overall Assessment'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        {/* Filter/Category Tabs */}
        <div className="flex gap-2 mb-6">
          <Badge variant="secondary" className="px-3 py-1">
            All Assessments
          </Badge>
          <Badge variant="outline" className="px-3 py-1">
            Required ({stats.required})
          </Badge>
          <Badge variant="outline" className="px-3 py-1">
            Recommended
          </Badge>
          <Badge variant="outline" className="px-3 py-1">
            Optional
          </Badge>
        </div>

        {(history.length > 0 || insights) && (
          <div className="mb-8">
            <AssessmentTrendsVisualization history={history} insights={insights} />
          </div>
        )}

        {/* Assessment Cards */}
        <div className="space-y-4">
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="p-6">
              <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/30">
                    <Sparkles className="h-6 w-6" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-semibold">Basic Overall Assessment</h2>
                      {combinedWellnessScore !== null && (
                        <Badge variant="outline" className="border-primary text-primary bg-primary/10">
                          Latest score {combinedWellnessScore}/100
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground max-w-xl">
                      Re-run the seven-question onboarding snapshot to refresh your combined wellness score and unlock the most up-to-date recommendations.
                    </p>
                    {combinedWellnessScore !== null && (
                      <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
                        <div className="flex items-center gap-1">
                          <BarChart3 className="h-4 w-4" />
                          <span>Wellness score {combinedWellnessScore}</span>
                        </div>
                        {combinedWellnessRelativeTime && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span>Last refreshed {combinedWellnessRelativeTime}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col-reverse sm:flex-row sm:items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onViewAssessmentResults(null)}
                    disabled={combinedWellnessScore === null}
                    className="sm:min-w-[150px]"
                  >
                    View latest results
                  </Button>
                  <Button
                    size="sm"
                    onClick={onStartCombinedAssessment}
                    disabled={isStartingCombinedAssessment}
                    className="sm:min-w-[170px]"
                  >
                    {isStartingCombinedAssessment ? 'Preparing…' : (
                      <span className="flex items-center gap-2">
                        <RefreshCw className="h-4 w-4" />
                        Retake baseline
                      </span>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {assessments.map((assessment) => (
            <Card
              key={assessment.id}
              className={`transition-all hover:shadow-md ${
                assessment.completed ? 'border-green-200 bg-green-50/30' : 'hover:border-primary/20'
              }`}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-start gap-4">
                      <div
                        className={`p-3 rounded-lg ${
                          assessment.completed ? 'bg-green-100' : 'bg-primary/10'
                        }`}
                      >
                        <div className={assessment.completed ? 'text-green-600' : 'text-primary'}>
                          {assessment.icon}
                        </div>
                      </div>

                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-xl font-semibold">{assessment.title}</h3>
                          {assessment.completed && (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          )}
                          {assessment.trend && (
                            <span
                              className={`text-xs font-medium px-2 py-1 rounded-full ${trendChipClasses[assessment.trend]}`}
                            >
                              {assessment.trendLabel ?? (assessment.trend === 'baseline'
                                ? 'Baseline'
                                : assessment.trend.charAt(0).toUpperCase() + assessment.trend.slice(1))}
                              {assessment.change !== null &&
                                assessment.change !== undefined &&
                                assessment.change !== 0 && (
                                  <span
                                    className={`ml-1 ${deltaClassForType(assessment.typeKey ?? assessment.id, assessment.change)}`}
                                  >
                                    ({formatChange(assessment.change)})
                                  </span>
                                )}
                            </span>
                          )}
                        </div>

                        <p className="text-muted-foreground leading-relaxed">
                          {assessment.description}
                        </p>

                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            <span>{assessment.duration}</span>
                          </div>
                          <div className="text-muted-foreground">
                            {assessment.questions} questions
                          </div>
                          <Badge variant="secondary" className={getCategoryColor(assessment.category)}>
                            {assessment.category}
                          </Badge>
                          <Badge variant="outline" className={getDifficultyColor(assessment.difficulty)}>
                            {assessment.difficulty}
                          </Badge>
                        </div>

                        {assessment.completed && assessment.lastTaken && (
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <p className="text-sm text-muted-foreground">Last taken: {assessment.lastTaken}</p>
                            {assessment.score !== undefined && (
                              <div className="text-sm">
                                <span className="text-muted-foreground">Score: </span>
                                <span className="font-semibold text-primary">{assessment.score}%</span>
                              </div>
                            )}
                          </div>
                        )}

                        {assessment.completed && assessment.recommendations && assessment.recommendations.length > 0 && (
                          <div className="text-sm text-muted-foreground space-y-1">
                            <p className="font-medium text-foreground">Next steps</p>
                            <ul className="list-disc list-inside space-y-1">
                              {assessment.recommendations.slice(0, 2).map((rec) => (
                                <li key={rec}>{rec}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 ml-4">
                    {assessment.completed ? (
                      <>
                        <Button onClick={() => onViewAssessmentResults(assessment.typeKey ?? assessment.id ?? null)} variant="outline" size="sm">
                          View Results
                        </Button>
                        <Button onClick={() => onStartAssessment(assessment.id)} size="sm">
                          Retake
                        </Button>
                      </>
                    ) : (
                      <Button onClick={() => onStartAssessment(assessment.id)} className="flex items-center gap-2">
                        <Play className="h-4 w-4" />
                        Start Assessment
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Bottom Info */}
        <Card className="mt-8">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <Shield className="h-6 w-6 text-primary mt-1" />
              <div className="space-y-2">
                <h3 className="font-semibold">Privacy &amp; Safety</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  All assessments are confidential and encrypted. Your responses help us provide personalized recommendations. You can pause and resume anytime. If you experience distress during any assessment, please stop and reach out for support.
                </p>
                <Button variant="link" className="p-0 h-auto text-sm" onClick={() => onNavigate('help')}>
                  Crisis Resources &amp; Support →
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {history.length > 0 && (
          <Card className="mt-8">
            <CardContent className="p-6 space-y-4">
              <div>
                <h3 className="text-lg font-semibold">Recent Assessment History</h3>
                <p className="text-sm text-muted-foreground">
                  Track how your scores are evolving across wellbeing areas.
                </p>
              </div>
              <div className="space-y-4">
                {combinedHistoryWithChange.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Basic Overall Assessment</h4>
                    {combinedHistoryWithChange.slice(0, 5).map((snapshot) => (
                      <div key={snapshot.id} className="space-y-3 rounded-lg border border-primary/30 bg-primary/5 p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-1">
                            <p className="text-sm font-medium text-muted-foreground">Combined wellbeing snapshot</p>
                            <p className="text-xs text-muted-foreground">Completed {getRelativeTime(snapshot.completedAt)}</p>
                          </div>
                          <div className="text-right space-y-1">
                            <p className="text-2xl font-semibold text-primary">{snapshot.combinedScore}%</p>
                            {snapshot.change !== null && (
                              <p className="text-sm text-muted-foreground">Change {formatChange(snapshot.change)} points</p>
                            )}
                          </div>
                        </div>
                        <div className="grid gap-2 pt-1 sm:grid-cols-2">
                          {snapshot.assessments.map((entry) => (
                            <div
                              key={`${snapshot.id}-${entry.assessmentType}`}
                              className="flex items-center justify-between rounded-md bg-white/80 px-3 py-2 text-xs"
                            >
                              <span className="font-medium text-muted-foreground">{friendlyAssessmentLabel(entry.assessmentType)}</span>
                              <span className="font-semibold text-primary">{Math.round(entry.score)}%</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {individualHistory.length > 0 && (
                  <div className="space-y-3">
                    {individualHistory.slice(0, 10).map((entry) => (
                      <div
                        key={`${entry.id}-${entry.completedAt}`}
                        className="flex items-start justify-between gap-4 rounded-lg border p-4"
                      >
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                            {friendlyAssessmentLabel(entry.assessmentType)}
                          </p>
                          <p className="text-base font-semibold">{entry.interpretation}</p>
                          <p className="text-sm text-muted-foreground">Completed {getRelativeTime(entry.completedAt)}</p>
                        </div>
                        <div className="text-right space-y-1">
                          <p className="text-2xl font-semibold text-primary">{Math.round(entry.score)}%</p>
                          {entry.changeFromPrevious !== null && (
                            <p className="text-sm text-muted-foreground">
                              Change {formatChange(entry.changeFromPrevious)} points
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {combinedHistoryWithChange.length === 0 && individualHistory.length === 0 && (
                  <p className="text-sm text-muted-foreground">No recent history available yet.</p>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
