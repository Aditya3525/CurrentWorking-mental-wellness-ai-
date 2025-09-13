import React from 'react';
import { Button } from '../../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Progress } from '../../ui/progress';
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

interface AssessmentListProps {
  onStartAssessment: (assessmentId: string) => void;
  onViewResults: (assessmentId: string, assessmentData: any) => void;
  onNavigate: (page: string) => void;
  user: any;
}

interface Assessment {
  id: string;
  title: string;
  description: string;
  duration: string;
  questions: number;
  icon: React.ReactNode;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  category: 'required' | 'recommended' | 'optional';
  completed: boolean;
  lastTaken?: string;
  score?: number;
  insights?: string;
  assessmentRecord?: any;
}

export function AssessmentList({ onStartAssessment, onViewResults, onNavigate, user }: AssessmentListProps) {
  // Get assessment completion status from backend data
  const getAssessmentData = (assessmentId: string) => {
    const assessmentHistory = user?.assessmentHistory || {};
    const assessmentScores = user?.assessmentScores || {};
    
    return {
      completed: !!assessmentScores[assessmentId],
      score: assessmentScores[assessmentId],
      lastTaken: assessmentHistory[assessmentId]?.completedAt 
        ? new Date(assessmentHistory[assessmentId].completedAt).toLocaleDateString()
        : undefined,
      insights: assessmentHistory[assessmentId]?.aiInsights,
      assessmentRecord: assessmentHistory[assessmentId]
    };
  };

  const assessments: Assessment[] = [
    {
      id: 'anxiety',
      title: 'Anxiety Assessment',
      description: 'Understand your anxiety patterns and triggers to develop effective coping strategies.',
      duration: '5-7 minutes',
      questions: 10,
      icon: <Brain className="h-6 w-6" />,
      difficulty: 'Beginner',
      category: 'required',
      ...getAssessmentData('anxiety')
    },
    {
      id: 'stress',
      title: 'Stress Level Check',
      description: 'Evaluate your current stress levels and identify key stressors in your daily life.',
      duration: '4-6 minutes',
      questions: 18,
      icon: <Target className="h-6 w-6" />,
      difficulty: 'Beginner',
      category: 'required',
      ...getAssessmentData('stress')
    },
    {
      id: 'emotionalIntelligence',
      title: 'Emotional Intelligence',
      description: 'Assess your ability to understand and manage emotions effectively.',
      duration: '8-10 minutes',
      questions: 28,
      icon: <Heart className="h-6 w-6" />,
      difficulty: 'Intermediate',
      category: 'recommended',
      ...getAssessmentData('emotionalIntelligence')
    },
    {
      id: 'overthinking',
      title: 'Overthinking Patterns',
      description: 'Identify rumination patterns and thought loops that create anxiety.',
      duration: '6-8 minutes',
      questions: 20,
      icon: <Zap className="h-6 w-6" />,
      difficulty: 'Intermediate',
      category: 'recommended',
      ...getAssessmentData('overthinking')
    },
    {
      id: 'personality',
      title: 'Personality Type Assessment',
      description: 'Discover your core personality traits using the Big 5 psychological model.',
      duration: '10-12 minutes',
      questions: 25,
      icon: <Users className="h-6 w-6" />,
      difficulty: 'Intermediate',
      category: 'recommended',
      ...getAssessmentData('personality')
    },
    {
      id: 'trauma-fear',
      title: 'Trauma & Fear Response',
      description: 'Gentle assessment of trauma responses and fear patterns (completely optional).',
      duration: '8-10 minutes',
      questions: 22,
      icon: <Shield className="h-6 w-6" />,
      difficulty: 'Advanced',
      category: 'optional',
      ...getAssessmentData('trauma-fear')
    }
  ];

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
      percentage: Math.round((completed / total) * 100)
    };
  };

  const stats = getCompletionStats();

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
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 ml-4">
                    {assessment.completed ? (
                      <>
                        <Button 
                          onClick={() => onViewResults(assessment.id, assessment.assessmentRecord)}
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