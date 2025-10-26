import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  ReferenceLine
} from 'recharts';

import { AssessmentHistoryEntry, AssessmentInsights, AssessmentTrend } from '../../../services/api';
import { Badge } from '../../ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';

import { deltaClassForType, friendlyAssessmentLabel, trendColor } from './assessmentUtils';

interface AssessmentTrendsVisualizationProps {
  history: AssessmentHistoryEntry[];
  insights: AssessmentInsights | null;
}

interface TimelinePoint {
  dateLabel: string;
  iso: string;
  scores: Record<string, number>;
}

const colorPalette = [
  '#2563eb',
  '#dc2626',
  '#16a34a',
  '#9333ea',
  '#f59e0b',
  '#0ea5e9',
  '#f97316',
  '#14b8a6',
  '#8b5cf6',
  '#d946ef'
];

const OVERALL_COLOR = '#111827';

const formatDate = (iso: string): string => {
  try {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) {
      return iso;
    }

    return new Intl.DateTimeFormat('en', {
      month: 'short',
      day: 'numeric'
    }).format(date);
  } catch (error) {
    return iso;
  }
};

const buildTimeline = (history: AssessmentHistoryEntry[]): Array<Record<string, number | string>> => {
  if (!history.length) return [];

  const groupedByDate = new Map<string, TimelinePoint>();

  [...history]
    .sort((a, b) => new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime())
    .forEach((entry) => {
      const dateKey = new Date(entry.completedAt).toISOString().split('T')[0];
      const existing = groupedByDate.get(dateKey);
      const label = formatDate(entry.completedAt);

      if (!existing) {
        groupedByDate.set(dateKey, {
          dateLabel: label,
          iso: entry.completedAt,
          scores: { [entry.assessmentType]: Math.round(entry.score * 10) / 10 }
        });
      } else {
        existing.scores[entry.assessmentType] = Math.round(entry.score * 10) / 10;
      }
    });

  return Array.from(groupedByDate.values())
    .sort((a, b) => new Date(a.iso).getTime() - new Date(b.iso).getTime())
    .map((point) => {
      const values = Object.values(point.scores);
      const overall = values.length ? values.reduce((acc, value) => acc + value, 0) / values.length : null;

      return {
        date: point.dateLabel,
        iso: point.iso,
        overall: overall !== null ? Math.round(overall * 10) / 10 : null,
        ...point.scores
      };
    });
};

const buildPatternComparisons = (
  insights: AssessmentInsights | null
): Array<{
  key: string;
  label: string;
  current: number;
  previous?: number;
  change?: number | null;
  trend: AssessmentTrend;
}> => {
  if (!insights) return [];

  return Object.entries(insights.byType).map(([key, summary]) => ({
    key,
    label: friendlyAssessmentLabel(key),
    current: Math.round(summary.latestScore * 10) / 10,
    previous:
      summary.previousScore !== null ? Math.round(summary.previousScore * 10) / 10 : undefined,
    change: summary.change,
    trend: summary.trend
  }));
};

const tooltipFormatter = (value: number, name: string) => {
  if (value === null || value === undefined) return ['—', friendlyAssessmentLabel(name)];
  return [`${value}`, friendlyAssessmentLabel(name)];
};

const tooltipLabelFormatter = (label: string) => `Completed on ${label}`;

export const AssessmentTrendsVisualization: React.FC<AssessmentTrendsVisualizationProps> = ({
  history,
  insights
}) => {
  const timelineData = useMemo(() => buildTimeline(history), [history]);
  const patternData = useMemo(() => buildPatternComparisons(insights), [insights]);
  const uniqueTypes = useMemo(
    () => Array.from(new Set(history.map((entry) => entry.assessmentType))),
    [history]
  );

  const typeColors = useMemo(
    () =>
      uniqueTypes.reduce<Record<string, string>>((acc, type, index) => {
        acc[type] = colorPalette[index % colorPalette.length];
        return acc;
      }, {}),
    [uniqueTypes]
  );

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader className="pb-0">
          <CardTitle>Assessment journey</CardTitle>
          <CardDescription>
            Track how each assessment area and your overall wellbeing scores evolve over time.
          </CardDescription>
        </CardHeader>
        <CardContent className="h-[360px] pt-0">
          {timelineData.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timelineData} margin={{ top: 20, right: 24, left: 0, bottom: 12 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" stroke="#6b7280" tickLine={false} />
                <YAxis domain={[0, 100]} stroke="#6b7280" tickLine={false} tickCount={6} />
                <Tooltip formatter={tooltipFormatter} labelFormatter={tooltipLabelFormatter} />
                <Legend />
                {uniqueTypes.map((type) => (
                  <Line
                    key={type}
                    type="monotone"
                    dataKey={type}
                    name={friendlyAssessmentLabel(type)}
                    stroke={typeColors[type]}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    isAnimationActive={false}
                    connectNulls
                  />
                ))}
                <Line
                  type="monotone"
                  dataKey="overall"
                  name="Overall wellbeing"
                  stroke={OVERALL_COLOR}
                  strokeWidth={3}
                  dot={{ r: 3 }}
                  strokeDasharray="4 2"
                  isAnimationActive={false}
                  connectNulls
                />
                <ReferenceLine y={50} stroke="#a1a1aa" strokeDasharray="3 3" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              Complete an assessment to unlock trend visualizations.
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-0">
          <CardTitle>Pattern comparison</CardTitle>
          <CardDescription>
            Compare your most recent scores with earlier results to see where growth is happening and
            where extra care may help.
          </CardDescription>
        </CardHeader>
        <CardContent className="h-[320px] pt-0">
          {patternData.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={patternData} margin={{ top: 20, right: 24, left: 0, bottom: 12 }}>
                <CartesianGrid vertical={false} stroke="#e5e7eb" />
                <XAxis
                  dataKey="label"
                  stroke="#6b7280"
                  tickLine={false}
                  interval={0}
                  tick={{ fontSize: 12 }}
                />
                <YAxis domain={[0, 100]} stroke="#6b7280" tickLine={false} tickCount={6} />
                <Tooltip
                  formatter={(value: number, name: string) => [value, name === 'current' ? 'Current' : 'Previous']}
                  labelFormatter={(label: string) => friendlyAssessmentLabel(label)}
                />
                <Legend />
                <Bar dataKey="previous" name="Previous" fill="#cbd5f5" radius={[6, 6, 0, 0]} />
                <Bar dataKey="current" name="Current" fill="#6366f1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              Comparison data will appear once you have at least two assessments in an area.
            </div>
          )}
        </CardContent>
        {insights ? (
          <CardContent className="border-t pt-4">
            <div className="flex flex-wrap gap-3 text-sm">
              <div className={`font-medium ${trendColor(insights.overallTrend)}`}>
                Overall trend: {insights.overallTrend === 'baseline' ? 'Building baseline' : insights.overallTrend}
              </div>
              <div className="flex flex-wrap gap-2">
                {patternData.map((pattern) => (
                  <Badge key={pattern.key} variant="outline" className="gap-1">
                    <span>{pattern.label}</span>
                    {typeof pattern.change === 'number' && pattern.change !== 0 ? (
                      <span className={deltaClassForType(pattern.key, pattern.change)}>
                        {pattern.change > 0 ? '+' : ''}{Math.round(pattern.change)}
                      </span>
                    ) : (
                      <span className="text-slate-500">•</span>
                    )}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        ) : null}
      </Card>
    </div>
  );
};
