import { 
  ArrowLeft,
  Brain,
  Target,
  Heart,
  Calendar,
  TrendingUp,
  MessageCircle,
  RotateCcw
} from 'lucide-react';
import React from 'react';

import { Button } from '../../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Progress } from '../../ui/progress';

interface AssessmentData {
  score: number;
  completedAt: string;
  aiInsights?: string;
}

interface AssessmentResultsProps {
  assessmentId: string;
  assessmentData: AssessmentData | null;
  onNavigate: (page: string) => void;
  onRetakeAssessment: (assessmentId: string) => void;
}

export function AssessmentResults({ 
  assessmentId, 
  assessmentData, 
  onNavigate, 
  onRetakeAssessment 
}: AssessmentResultsProps) {
  
  if (!assessmentData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center space-y-4">
            <h2 className="text-xl font-semibold">No Results Found</h2>
            <p className="text-muted-foreground">
              We couldn&apos;t find results for this assessment. Please try taking the assessment again.
            </p>
            <Button onClick={() => onNavigate('assessments')}>
              Back to Assessments
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getAssessmentTitle = (id: string) => {
    const titles = {
      anxiety: 'Anxiety Assessment',
      stress: 'Stress Level Check',
      emotionalIntelligence: 'Emotional Intelligence',
      overthinking: 'Overthinking Patterns',
      personality: 'Personality Type Assessment',
      'trauma-fear': 'Trauma & Fear Response'
    };
    return titles[id as keyof typeof titles] || 'Assessment';
  };

  const getAssessmentIcon = (id: string) => {
    const icons = {
      anxiety: <Brain className="h-6 w-6" />,
      stress: <Target className="h-6 w-6" />,
      emotionalIntelligence: <Heart className="h-6 w-6" />,
      overthinking: <Brain className="h-6 w-6" />,
      personality: <Target className="h-6 w-6" />,
      'trauma-fear': <Heart className="h-6 w-6" />
    };
    return icons[id as keyof typeof icons] || <Brain className="h-6 w-6" />;
  };

  const getScoreInterpretation = (score: number) => {
    if (score >= 70) return { level: 'High', color: 'text-red-600', bgColor: 'bg-red-50' };
    if (score >= 40) return { level: 'Moderate', color: 'text-yellow-600', bgColor: 'bg-yellow-50' };
    return { level: 'Low', color: 'text-green-600', bgColor: 'bg-green-50' };
  };

  const interpretation = getScoreInterpretation(assessmentData.score);
  const completedDate = new Date(assessmentData.completedAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
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
              onClick={() => onNavigate('assessments')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Assessments
            </Button>
          </div>

          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              {getAssessmentIcon(assessmentId)}
            </div>
            <div>
              <h1 className="text-3xl font-bold">{getAssessmentTitle(assessmentId)}</h1>
              <p className="text-muted-foreground">Your Assessment Results</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        
        {/* Score Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Your Score
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className={`p-6 rounded-lg ${interpretation.bgColor}`}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className={`text-3xl font-bold ${interpretation.color}`}>
                    {assessmentData.score}%
                  </div>
                  <div className={`text-sm font-medium ${interpretation.color}`}>
                    {interpretation.level} Level
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 text-sm text-muted-foreground mb-1">
                    <Calendar className="h-4 w-4" />
                    <span>Completed on</span>
                  </div>
                  <div className="font-medium">{completedDate}</div>
                </div>
              </div>
              
              <Progress value={assessmentData.score} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* AI Insights */}
        {assessmentData.aiInsights && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                AI-Powered Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gradient-to-br from-primary/5 to-accent/5 rounded-lg p-6">
                <p className="leading-relaxed text-foreground">
                  {assessmentData.aiInsights}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Button 
            onClick={() => onRetakeAssessment(assessmentId)}
            className="flex items-center gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Retake Assessment
          </Button>
          
          <Button 
            variant="outline"
            onClick={() => onNavigate('chatbot')}
            className="flex items-center gap-2"
          >
            <MessageCircle className="h-4 w-4" />
            Discuss Results with AI
          </Button>
          
          <Button 
            variant="outline"
            onClick={() => onNavigate('insights')}
          >
            View All Results
          </Button>
        </div>

        {/* Recommendations */}
        <Card>
          <CardHeader>
            <CardTitle>Recommendations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4">
              {interpretation.level === 'High' && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <h4 className="font-medium text-amber-800 mb-2">Consider Professional Support</h4>
                  <p className="text-sm text-amber-700">
                    Your results suggest you might benefit from speaking with a mental health professional.
                    This is a proactive step toward better wellbeing.
                  </p>
                </div>
              )}
              
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-2">Explore Coping Strategies</h4>
                <p className="text-sm text-blue-700">
                  Visit our content library for evidence-based techniques and practices 
                  tailored to your assessment results.
                </p>
                <Button 
                  variant="link" 
                  className="p-0 h-auto text-sm mt-2"
                  onClick={() => onNavigate('library')}
                >
                  Browse Content Library →
                </Button>
              </div>
              
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <h4 className="font-medium text-green-800 mb-2">Track Your Progress</h4>
                <p className="text-sm text-green-700">
                  Regular assessment retakes can help you monitor your mental health journey
                  and see improvements over time.
                </p>
                <Button 
                  variant="link" 
                  className="p-0 h-auto text-sm mt-2"
                  onClick={() => onNavigate('progress')}
                >
                  View Progress Tracking →
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
