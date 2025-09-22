import { 
  ArrowLeft,
  Brain,
  Target,
  Heart,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Lightbulb,
  Download,
  Share,
  MessageCircle,
  Play
} from 'lucide-react';
import React, { useEffect, useState } from 'react';

import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Progress } from '../../ui/progress';
import { Sparkline } from '../../ui/Sparkline';

interface InsightsResultsProps {
  user: { assessmentScores?: Record<string, number>; lastAssessmentInsights?: string } | null;
  onNavigate: (page: string) => void;
}

interface TrendPoint { score: number; t: string }

export function InsightsResults({ user, onNavigate }: InsightsResultsProps) {
  const scores: Record<string, number> = user?.assessmentScores || {};
  const [trends, setTrends] = useState<Record<string, TrendPoint[]>>({});
  const [trendsLoading, setTrendsLoading] = useState(false);
  const [trendsError, setTrendsError] = useState<string | null>(null);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    setTrendsLoading(true);
    fetch('/api/assessments/trends', { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then(r => r.json())
      .then(json => {
        if (json.success) {
          setTrends(json.data || {});
        } else {
          setTrendsError(json.error || 'Failed to load trends');
        }
      })
      .catch(e => setTrendsError(e.message))
      .finally(() => setTrendsLoading(false));
  }, []);

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-red-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 70) return 'High';
    if (score >= 40) return 'Moderate';
    return 'Low';
  };

  const getScoreBg = (score: number) => {
    if (score >= 70) return 'bg-red-50 border-red-200';
    if (score >= 40) return 'bg-yellow-50 border-yellow-200';
    return 'bg-green-50 border-green-200';
  };

  const getRecommendations = (scores: Record<string, number>) => {
    const recommendations = [];
    
    if (scores.anxiety >= 60) {
      recommendations.push({
        type: 'immediate',
        title: 'Try 5-Minute Calm Breathing',
        description: 'Immediate anxiety relief through guided breathing',
        action: () => onNavigate('practices'),
        icon: <Heart className="h-4 w-4" />
      });
    }
    
    if (scores.stress >= 50) {
      recommendations.push({
        type: 'daily',
        title: 'Daily Mindfulness Practice',
        description: '10-minute morning routine to manage stress',
        action: () => onNavigate('practices'),
        icon: <Target className="h-4 w-4" />
      });
    }
    
    recommendations.push({
      type: 'support',
      title: 'Chat with AI Companion',
      description: 'Discuss your results with empathetic AI guidance',
      action: () => onNavigate('chatbot'),
      icon: <MessageCircle className="h-4 w-4" />
    });

    return recommendations;
  };

  const recommendations = getRecommendations(scores);

  const wellbeingInsight = user?.lastAssessmentInsights as string | undefined;

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
              Back to Dashboard
            </Button>
          </div>

          <div className="space-y-4">
            <h1 className="text-3xl">Your Wellbeing Insights</h1>
            <p className="text-muted-foreground text-lg">
              Based on your recent assessments • Updated today
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6 space-y-8">
        {/* Overall Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              Overall Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {wellbeingInsight && (
              <div className="bg-primary/5 rounded-lg p-4 border border-primary/10">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-primary" /> Your Wellbeing Insight
                </h3>
                <div className="text-sm whitespace-pre-line leading-relaxed text-muted-foreground">
                  {wellbeingInsight}
                </div>
              </div>
            )}
            {/* Removed 'What this means' section per requirement */}

            {scores.anxiety > 70 && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-medium text-amber-800">Consider Professional Support</p>
                    <p className="text-sm text-amber-700">
                      Your anxiety levels suggest you might benefit from speaking with a mental health professional. 
                      This isn&apos;t a sign something is wrong – it is a proactive step for your wellbeing.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Score Breakdown */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.entries(scores).map(([key, score]) => {
            const titles: Record<string, string> = {
              anxiety: 'Anxiety Level',
              stress: 'Stress Level',
              emotionalIntelligence: 'Emotional Intelligence',
              overthinking: 'Overthinking Patterns'
            };

            const descriptions: Record<string, string> = {
              anxiety: 'How often you experience worry and nervousness',
              stress: 'Your current stress and pressure levels',
              emotionalIntelligence: 'Your ability to understand and manage emotions',
              overthinking: 'Tendency to get stuck in repetitive thought patterns'
            };

            return (
              <Card key={key} className={`border-2 ${getScoreBg(score as number)}`}>
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">{titles[key]}</h3>
                    <Badge 
                      variant="secondary"
                      className={getScoreColor(score as number)}
                    >
                      {getScoreLabel(score as number)}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-2xl font-semibold">{(score as number)}%</span>
                    </div>
                    <Progress value={score as number} className="h-2" />
                  </div>

                  <p className="text-sm text-muted-foreground">
                    {descriptions[key]}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Personalized Recommendations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-primary" />
              Recommended Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Based on your results, here are some personalized steps to support your wellbeing:
            </p>

            <div className="grid md:grid-cols-2 gap-4">
              {recommendations.map((rec, index) => (
                <Card key={index} className="border hover:border-primary/20 transition-colors">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <div className="text-primary">{rec.icon}</div>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">{rec.title}</h4>
                        <p className="text-sm text-muted-foreground">{rec.description}</p>
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      className="w-full"
                      onClick={rec.action}
                    >
                      {rec.type === 'immediate' ? 'Start Now' : 'Learn More'}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Progress Trends */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Progress Over Time
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {trendsLoading && (
              <div className="text-center py-6 text-muted-foreground text-sm">Loading trends…</div>
            )}
            {trendsError && (
              <div className="text-center py-6 text-destructive text-sm">{trendsError}</div>
            )}
            {!trendsLoading && !trendsError && (
              (() => {
                const entries = Object.entries(trends || {});
                const hasData = entries.some(([, pts]) => pts && pts.length);
                if (!hasData) {
                  return (
                    <div className="text-center py-8 text-muted-foreground">
                      <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Take more assessments over time to see your progress trends</p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-3"
                        onClick={() => onNavigate('assessments')}
                      >
                        Take Another Assessment
                      </Button>
                    </div>
                  );
                }

                const titleMap: Record<string, string> = {
                  anxiety: 'Anxiety',
                  stress: 'Stress',
                  emotionalIntelligence: 'Emotional Intelligence',
                  overthinking: 'Overthinking'
                };

                return (
                  <div className="grid md:grid-cols-2 gap-6">
                    {entries.map(([type, pts]) => {
                      if (!pts?.length) return null;
                      const scoresArr = pts.map(p => p.score);
                      const latest = scoresArr[scoresArr.length - 1];
                      const prev = scoresArr.length > 1 ? scoresArr[scoresArr.length - 2] : undefined;
                      const delta = prev !== undefined ? latest - prev : 0;
                      const direction = delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat';
                      return (
                        <div key={type} className="p-4 rounded-lg border bg-muted/30">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-sm">{titleMap[type] || type}</h4>
                            <div className="text-xs flex items-center gap-2">
                              <span className="font-semibold">{latest}%</span>
                              {prev !== undefined && (
                                <span className={`font-medium ${direction === 'up' ? 'text-red-600' : direction === 'down' ? 'text-green-600' : 'text-muted-foreground'}`}> 
                                  {direction === 'up' ? '▲' : direction === 'down' ? '▼' : '■'} {delta > 0 ? '+' : ''}{delta.toFixed(1)}
                                </span>
                              )}
                            </div>
                          </div>
                          <Sparkline values={scoresArr} height={40} ariaLabel={`${titleMap[type] || type} progress trend`} />
                          <div className="mt-1 text-[10px] text-muted-foreground tracking-wide">
                            {pts.length} {pts.length === 1 ? 'data point' : 'assessments'}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()
            )}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Button 
            className="flex-1"
            onClick={() => onNavigate('plan')}
          >
            <Play className="h-4 w-4 mr-2" />
            Create Personalized Plan
          </Button>
          
          <Button 
            variant="outline"
            onClick={() => onNavigate('chatbot')}
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            Discuss Results
          </Button>

          <Button 
            variant="outline"
            onClick={() => {/* Export functionality */}}
          >
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>

          <Button 
            variant="outline"
            onClick={() => {/* Share functionality */}}
          >
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
                  <p>• These results are based on self-reported assessments and are for informational purposes only</p>
                  <p>• This is not a clinical diagnosis and should not replace professional medical advice</p>
                  <p>• If you&apos;re experiencing severe symptoms, please consult with a healthcare professional</p>
                  <p>• Your results are private and encrypted - you control who sees them</p>
                </div>
                <Button 
                  variant="link" 
                  className="p-0 h-auto text-sm"
                  onClick={() => onNavigate('help')}
                >
                  Crisis Resources & Professional Support →
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}