import React, { useEffect, useState } from 'react';
import { Button } from '../../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Progress } from '../../ui/progress';
import { Badge } from '../../ui/badge';
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
  Play,
  Loader2
} from 'lucide-react';
import { assessmentsApi } from '../../../services/api';

interface InsightsResultsProps {
  user: any;
  onNavigate: (page: string) => void;
}

export function InsightsResults({ user, onNavigate }: InsightsResultsProps) {
  const [aiInsights, setAiInsights] = useState<string | null>(null);
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);
  const scores = user?.assessmentScores || {};

  // Fetch AI insights when component mounts
  useEffect(() => {
    const fetchAiInsights = async () => {
      // Check if we have a latest assessment with AI insights
      if (user?.latestAssessment?.aiInsights) {
        setAiInsights(user.latestAssessment.aiInsights);
        return;
      }

      // If not, try to fetch the latest assessment
      setIsLoadingInsights(true);
      try {
        const response = await assessmentsApi.getLatestAssessment();
        if (response.success && response.data.aiInsights) {
          setAiInsights(response.data.aiInsights);
        }
      } catch (error) {
        console.error('Failed to fetch AI insights:', error);
        // Fallback to assessment history
        try {
          const historyResponse = await assessmentsApi.getAssessmentHistory();
          if (historyResponse.success && historyResponse.data.length > 0) {
            const latestAssessment = historyResponse.data[0];
            if (latestAssessment.aiInsights) {
              setAiInsights(latestAssessment.aiInsights);
            }
          }
        } catch (historyError) {
          console.error('Failed to fetch assessment history:', historyError);
        }
      } finally {
        setIsLoadingInsights(false);
      }
    };

    fetchAiInsights();
  }, [user]);

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

  const getRecommendations = (scores: any) => {
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
            <div className="bg-muted/50 rounded-lg p-4">
              <h3 className="font-semibold mb-2">What this means</h3>
              <p className="text-muted-foreground leading-relaxed">
                Your current wellbeing profile shows {scores.anxiety > 60 ? 'elevated' : 'manageable'} anxiety levels 
                and {scores.stress > 50 ? 'moderate' : 'low'} stress patterns. 
                {scores.emotionalIntelligence > 70 
                  ? ' Your strong emotional intelligence is a great foundation for growth.' 
                  : ' Building emotional awareness will support your overall wellbeing.'
                }
              </p>
            </div>

            {scores.anxiety > 70 && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-medium text-amber-800">Consider Professional Support</p>
                    <p className="text-sm text-amber-700">
                      Your anxiety levels suggest you might benefit from speaking with a mental health professional. 
                      This doesn't mean anything is wrong - it's a proactive step for your wellbeing.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* AI Insights Section */}
        {(aiInsights || isLoadingInsights) && (
          <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-primary" />
                AI-Powered Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingInsights ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating personalized insights...
                </div>
              ) : aiInsights ? (
                <div className="bg-white/50 rounded-lg p-4">
                  <p className="leading-relaxed text-foreground">
                    {aiInsights}
                  </p>
                </div>
              ) : (
                <p className="text-muted-foreground">
                  Complete more assessments to receive AI-powered insights about your wellbeing patterns.
                </p>
              )}
            </CardContent>
          </Card>
        )}

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
                      <span className="text-2xl font-semibold">{score}%</span>
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
          <CardContent className="space-y-4">
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
                  <p>• If you're experiencing severe symptoms, please consult with a healthcare professional</p>
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