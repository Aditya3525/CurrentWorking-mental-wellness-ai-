import { 
  Brain,
  Heart,
  Zap,
  Target,
  Shield,
  Users,
  Clock,
  CheckCircle,
  ArrowLeft,
  Play
} from 'lucide-react';
import React, { useEffect, useState, useMemo } from 'react';

import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { Card, CardContent } from '../../ui/card';
import { Progress } from '../../ui/progress';
import { Sparkline } from '../../ui/Sparkline';

interface AssessmentListProps {
  onStartAssessment: (assessmentId: string) => void;
  onNavigate: (page: string) => void;
  user?: unknown; // retained for future personalization usage
}

interface CatalogItem {
  id: string;
  title: string;
  description: string;
  questions: number;
  estimatedTime: string;
  difficulty: string;
  category: string;
}

interface HistoryItem {
  id: string;
  assessmentType: string;
  score: number;
  completedAt: string;
  version: number;
  isLatest: boolean;
}

interface SummaryItem {
  type: string;
  latest: { score: number; completedAt: string; version: number; aiInsights?: string };
  previous: { score: number; completedAt: string; version: number } | null;
  change: number;
  direction: 'up' | 'down' | 'same';
  risk: 'low' | 'moderate' | 'high';
}

export function AssessmentList({ onStartAssessment, onNavigate }: AssessmentListProps) {
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<SummaryItem[]>([]);
  const [trends, setTrends] = useState<Record<string, { score: number; t: string }[]>>({});

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('token');
        const [catRes, histRes, sumRes, trendRes] = await Promise.all([
          fetch('/api/assessments', { headers: token ? { Authorization: `Bearer ${token}` } : {} }),
          fetch('/api/assessments/history', { headers: token ? { Authorization: `Bearer ${token}` } : {} }),
          fetch('/api/assessments/summary', { headers: token ? { Authorization: `Bearer ${token}` } : {} }),
          fetch('/api/assessments/trends', { headers: token ? { Authorization: `Bearer ${token}` } : {} })
        ]);
        const catJson = await catRes.json();
        const histJson = await histRes.json();
        const sumJson = await sumRes.json();
        const trendJson = await trendRes.json();
        if (!catJson.success) throw new Error(catJson.error || 'Failed catalog');
        if (!histJson.success) throw new Error(histJson.error || 'Failed history');
        if (!sumJson.success) throw new Error(sumJson.error || 'Failed summary');
        if (!trendJson.success) throw new Error(trendJson.error || 'Failed trends');
        if (isMounted) {
          setCatalog(catJson.data);
          setHistory(histJson.data);
          setSummary(sumJson.data);
          setTrends(trendJson.data);
        }
      } catch (e) {
        if (isMounted) setError(e instanceof Error ? e.message : 'Unknown error');
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    load();
    return () => { isMounted = false; };
  }, []);

  // Map catalog to UI objects with completion info
  const assessments = useMemo(() => {
    const latestScores: Record<string, { score: number; completedAt: string }> = {};
    history.forEach(h => {
      if (h.isLatest) {
        latestScores[h.assessmentType] = { score: h.score, completedAt: h.completedAt };
      }
    });
    return catalog.map(item => {
      const key = item.id;
      const scoreMeta = latestScores[key];
      const summaryItem = summary.find(s => s.type === key);
      return {
        id: key,
        title: item.title,
        description: item.description,
        duration: item.estimatedTime,
        questions: item.questions,
  difficulty: item.difficulty as string,
  category: item.category as string,
        completed: !!scoreMeta,
        lastTaken: scoreMeta ? new Date(scoreMeta.completedAt).toLocaleDateString() : undefined,
        score: scoreMeta?.score,
        change: summaryItem?.change,
        direction: summaryItem?.direction,
        risk: summaryItem?.risk,
        icon: key.includes('anxiety') ? <Brain className="h-6 w-6" />
          : key.includes('stress') ? <Target className="h-6 w-6" />
          : key.includes('emotional') ? <Heart className="h-6 w-6" />
          : key.includes('overthinking') ? <Zap className="h-6 w-6" />
          : key.includes('trauma') ? <Shield className="h-6 w-6" />
          : key.includes('archetype') ? <Users className="h-6 w-6" />
          : <Brain className="h-6 w-6" />
      };
    });
  }, [catalog, history, summary]);

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'required': return 'bg-red-100 text-red-800';
      case 'recommended': return 'bg-yellow-100 text-yellow-800';
      case 'optional': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return 'bg-green-100 text-green-800';
      case 'Intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'Advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCompletionStats = () => {
    const total = assessments.length;
    const completed = assessments.filter(a => a.completed).length;
    const required = assessments.filter(a => a.category === 'required');
    const requiredCompleted = required.filter(a => a.completed).length;
    return {
      total,
      completed,
      required: required.length,
      requiredCompleted,
      percentage: total === 0 ? 0 : Math.round((completed / total) * 100)
    };
  };

  const stats = getCompletionStats();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        Loading assessments...
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-red-600">Failed to load assessments: {error}</p>
        <Button variant="outline" onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

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
                <div className="flex items-center justify-between mb-3">
                  <div className="space-y-1">
                    <p className="font-medium">Assessment Progress</p>
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
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        {/* Filter/Category Tabs */}
        <div className="flex gap-2 mb-6">
          <Badge variant="secondary" className="px-3 py-1">All Assessments</Badge>
          <Badge variant="outline" className="px-3 py-1">Required ({stats.required})</Badge>
          <Badge variant="outline" className="px-3 py-1">Recommended</Badge>
          <Badge variant="outline" className="px-3 py-1">Optional</Badge>
        </div>

        {/* Assessment Cards */}
        <div className="space-y-4">
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
                      <div className={`p-3 rounded-lg ${
                        assessment.completed ? 'bg-green-100' : 'bg-primary/10'
                      }`}>
                        <div className={assessment.completed ? 'text-green-600' : 'text-primary'}>
                          {assessment.icon}
                        </div>
                      </div>

                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <h3 className="text-xl font-semibold">{assessment.title}</h3>
                          {assessment.completed && (
                            <CheckCircle className="h-5 w-5 text-green-600" />
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
                          <Badge 
                            variant="secondary" 
                            className={getCategoryColor(assessment.category)}
                          >
                            {assessment.category}
                          </Badge>
                          <Badge 
                            variant="outline"
                            className={getDifficultyColor(assessment.difficulty)}
                          >
                            {assessment.difficulty}
                          </Badge>
                        </div>

                        {assessment.completed && assessment.lastTaken && (
                          <div className="flex items-center justify-between">
                            <p className="text-sm text-muted-foreground">
                              Last taken: {assessment.lastTaken}
                            </p>
                            {assessment.score && (
                              <div className="text-sm">
                                <span className="text-muted-foreground">Score: </span>
                                <span className="font-semibold text-primary">
                                  {assessment.score}%
                                </span>
                                {typeof assessment.change === 'number' && (
                                  <span className={`ml-2 text-xs font-medium ${assessment.direction === 'up' ? 'text-red-600' : assessment.direction === 'down' ? 'text-green-600' : 'text-muted-foreground'}`}>
                                    {assessment.direction === 'up' ? '▲' : assessment.direction === 'down' ? '▼' : '■'} {assessment.change > 0 ? '+' : ''}{assessment.change?.toFixed(1)}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                        {assessment.completed && trends[assessment.id]?.length > 1 && (
                          <div className="mt-2 flex items-center justify-between">
                            <Sparkline values={trends[assessment.id].map(p => p.score)} width={140} height={34} ariaLabel={`${assessment.title} trend`} />
                            <span className="text-xs text-muted-foreground ml-2">
                              {trends[assessment.id].length} pts
                            </span>
                          </div>
                        )}
                        {assessment.risk && (
                          <div className="mt-2">
                            <Badge variant="outline" className={
                              assessment.risk === 'high' ? 'border-red-300 text-red-700' : assessment.risk === 'moderate' ? 'border-yellow-300 text-yellow-700' : 'border-green-300 text-green-700'
                            }>
                              {assessment.risk.charAt(0).toUpperCase() + assessment.risk.slice(1)} risk
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 ml-4">
                    {assessment.completed ? (
                      <>
                        <Button 
                          onClick={() => onNavigate('insights')}
                          variant="outline"
                          size="sm"
                        >
                          View Results
                        </Button>
                        <Button 
                          onClick={() => onStartAssessment(assessment.id)}
                          size="sm"
                        >
                          Retake
                        </Button>
                      </>
                    ) : (
                      <Button 
                        onClick={() => onStartAssessment(assessment.id)}
                        className="flex items-center gap-2"
                      >
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
                <h3 className="font-semibold">Privacy & Safety</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  All assessments are confidential and encrypted. Your responses help us provide 
                  personalized recommendations. You can pause and resume anytime. If you experience 
                  distress during any assessment, please stop and reach out for support.
                </p>
                <Button 
                  variant="link" 
                  className="p-0 h-auto text-sm"
                  onClick={() => onNavigate('help')}
                >
                  Crisis Resources & Support →
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}