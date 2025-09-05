import React, { useState, useEffect } from 'react';
import { Button } from '../../ui/button';
import { Card, CardContent } from '../../ui/card';
import { Progress } from '../../ui/progress';
import { RadioGroup, RadioGroupItem } from '../../ui/radio-group';
import { Label } from '../../ui/label';
import { 
  ArrowLeft,
  ArrowRight,
  Clock,
  Brain,
  Heart,
  Sparkles,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';

interface AssessmentFlowProps {
  assessmentId: string;
  onComplete: (scores: any) => void;
  onNavigate: (page: string) => void;
}

interface Question {
  id: string;
  text: string;
  subtext?: string;
  type: 'likert' | 'multiple-choice' | 'binary';
  options: Array<{
    value: string;
    label: string;
    score: number;
  }>;
}

interface AssessmentData {
  title: string;
  description: string;
  totalQuestions: number;
  estimatedTime: string;
  questions: Question[];
  scoringKey: string;
}

export function AssessmentFlow({ assessmentId, onComplete, onNavigate }: AssessmentFlowProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [startTime] = useState(Date.now());
  const [isProcessing, setIsProcessing] = useState(false);

  // Mock assessment data - in real app this would come from API
  const getAssessmentData = (id: string): AssessmentData => {
    const assessments: Record<string, AssessmentData> = {
      anxiety: {
        title: 'Anxiety Assessment',
        description: 'This assessment helps identify your anxiety patterns and triggers.',
        totalQuestions: 10, // Shortened for demo
        estimatedTime: '5-7 minutes',
        scoringKey: 'anxiety',
        questions: [
          {
            id: 'anxiety_1',
            text: 'How often do you feel nervous, anxious, or on edge?',
            type: 'likert',
            options: [
              { value: '0', label: 'Not at all', score: 0 },
              { value: '1', label: 'Several days', score: 25 },
              { value: '2', label: 'More than half the days', score: 50 },
              { value: '3', label: 'Nearly every day', score: 75 },
            ]
          },
          {
            id: 'anxiety_2',
            text: 'How often do you have trouble relaxing?',
            type: 'likert',
            options: [
              { value: '0', label: 'Not at all', score: 0 },
              { value: '1', label: 'Several days', score: 25 },
              { value: '2', label: 'More than half the days', score: 50 },
              { value: '3', label: 'Nearly every day', score: 75 },
            ]
          },
          {
            id: 'anxiety_3',
            text: 'Do you worry too much about different things?',
            type: 'likert',
            options: [
              { value: '0', label: 'Not at all', score: 0 },
              { value: '1', label: 'Several days', score: 25 },
              { value: '2', label: 'More than half the days', score: 50 },
              { value: '3', label: 'Nearly every day', score: 75 },
            ]
          },
          {
            id: 'anxiety_4',
            text: 'How often do you feel restless or find it hard to sit still?',
            type: 'likert',
            options: [
              { value: '0', label: 'Not at all', score: 0 },
              { value: '1', label: 'Several days', score: 25 },
              { value: '2', label: 'More than half the days', score: 50 },
              { value: '3', label: 'Nearly every day', score: 75 },
            ]
          },
          {
            id: 'anxiety_5',
            text: 'Do you have trouble falling or staying asleep due to worry?',
            type: 'binary',
            options: [
              { value: 'no', label: 'No, my sleep is fine', score: 0 },
              { value: 'sometimes', label: 'Sometimes it affects my sleep', score: 50 },
              { value: 'yes', label: 'Yes, frequently affects my sleep', score: 100 },
            ]
          },
          {
            id: 'anxiety_6',
            text: 'How often do you experience physical symptoms when anxious (rapid heartbeat, sweating, trembling)?',
            type: 'likert',
            options: [
              { value: '0', label: 'Never', score: 0 },
              { value: '1', label: 'Rarely', score: 20 },
              { value: '2', label: 'Sometimes', score: 50 },
              { value: '3', label: 'Often', score: 80 },
            ]
          },
          {
            id: 'anxiety_7',
            text: 'Do you avoid certain situations because they make you anxious?',
            type: 'multiple-choice',
            options: [
              { value: 'never', label: 'Never avoid situations', score: 0 },
              { value: 'rarely', label: 'Rarely avoid situations', score: 25 },
              { value: 'sometimes', label: 'Sometimes avoid situations', score: 50 },
              { value: 'often', label: 'Often avoid situations', score: 75 },
              { value: 'always', label: 'Frequently avoid situations', score: 100 },
            ]
          },
          {
            id: 'anxiety_8',
            text: 'How would you rate your overall anxiety level in the past two weeks?',
            type: 'likert',
            options: [
              { value: '1', label: 'Very low', score: 10 },
              { value: '2', label: 'Low', score: 30 },
              { value: '3', label: 'Moderate', score: 50 },
              { value: '4', label: 'High', score: 70 },
              { value: '5', label: 'Very high', score: 90 },
            ]
          },
          {
            id: 'anxiety_9',
            text: 'Do you feel like your worries are hard to control?',
            type: 'binary',
            options: [
              { value: 'no', label: 'No, I can usually manage my worries', score: 0 },
              { value: 'sometimes', label: 'Sometimes they feel out of control', score: 50 },
              { value: 'yes', label: 'Yes, they often feel uncontrollable', score: 100 },
            ]
          },
          {
            id: 'anxiety_10',
            text: 'How much do anxiety symptoms interfere with your daily activities?',
            type: 'likert',
            options: [
              { value: '0', label: 'Not at all', score: 0 },
              { value: '1', label: 'A little bit', score: 25 },
              { value: '2', label: 'Moderately', score: 50 },
              { value: '3', label: 'Quite a bit', score: 75 },
              { value: '4', label: 'Extremely', score: 100 },
            ]
          },
        ]
      },
      // Add other assessments as needed
    };

    return assessments[id] || assessments.anxiety;
  };

  const assessment = getAssessmentData(assessmentId);
  const currentQ = assessment.questions[currentQuestion];
  const progress = ((currentQuestion + 1) / assessment.totalQuestions) * 100;
  const timeElapsed = Math.floor((Date.now() - startTime) / 1000 / 60);

  const handleAnswer = (value: string) => {
    setAnswers(prev => ({
      ...prev,
      [currentQ.id]: value
    }));
  };

  const handleNext = () => {
    if (currentQuestion < assessment.totalQuestions - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleComplete = async () => {
    setIsProcessing(true);
    
    // Calculate score based on answers
    let totalScore = 0;
    let maxScore = 0;
    
    assessment.questions.forEach(question => {
      const answer = answers[question.id];
      if (answer) {
        const option = question.options.find(opt => opt.value === answer);
        if (option) {
          totalScore += option.score;
        }
      }
      maxScore += Math.max(...question.options.map(opt => opt.score));
    });

    const normalizedScore = Math.round((totalScore / maxScore) * 100);
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const scores = {
      [assessment.scoringKey]: normalizedScore
    };
    
    onComplete(scores);
  };

  const canProceed = () => {
    return answers[currentQ?.id] !== undefined;
  };

  const getQuestionIcon = () => {
    if (assessmentId.includes('anxiety')) return <Brain className="h-5 w-5 text-primary" />;
    if (assessmentId.includes('stress')) return <Heart className="h-5 w-5 text-primary" />;
    return <Sparkles className="h-5 w-5 text-primary" />;
  };

  if (isProcessing) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center space-y-6">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto animate-pulse">
              <Brain className="h-8 w-8 text-primary" />
            </div>
            <div className="space-y-3">
              <h2 className="text-2xl">Processing Your Results</h2>
              <p className="text-muted-foreground">
                We're analyzing your responses to provide personalized insights. This won't take long...
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex justify-center">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Generating your personalized recommendations...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/10 to-accent/10 p-6">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => onNavigate('assessments')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Exit Assessment
            </Button>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>{timeElapsed} min elapsed</span>
            </div>
          </div>

          {/* Progress */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getQuestionIcon()}
                <span className="font-medium">{assessment.title}</span>
              </div>
              <span className="text-sm text-muted-foreground">
                {currentQuestion + 1} of {assessment.totalQuestions}
              </span>
            </div>
            <Progress value={progress} className="h-2" />
            <p className="text-sm text-muted-foreground">
              {Math.round(progress)}% complete
            </p>
          </div>
        </div>
      </div>

      {/* Question */}
      <div className="max-w-2xl mx-auto p-6">
        <Card>
          <CardContent className="p-8">
            <div className="space-y-8">
              {/* Question Text */}
              <div className="space-y-3">
                <h2 className="text-2xl leading-relaxed">
                  {currentQ?.text}
                </h2>
                {currentQ?.subtext && (
                  <p className="text-muted-foreground">
                    {currentQ.subtext}
                  </p>
                )}
              </div>

              {/* Answer Options */}
              <RadioGroup
                value={answers[currentQ?.id] || ''}
                onValueChange={handleAnswer}
              >
                <div className="space-y-3">
                  {currentQ?.options.map((option) => (
                    <div 
                      key={option.value}
                      className="flex items-start space-x-3 p-4 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => handleAnswer(option.value)}
                    >
                      <RadioGroupItem value={option.value} id={option.value} className="mt-1" />
                      <Label 
                        htmlFor={option.value} 
                        className="text-base leading-relaxed cursor-pointer flex-1"
                      >
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>

              {/* Safety Note for Sensitive Questions */}
              {(currentQ?.text.toLowerCase().includes('harm') || 
                currentQ?.text.toLowerCase().includes('suicide') ||
                currentQ?.text.toLowerCase().includes('death')) && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-sm text-amber-800 font-medium">
                        Need immediate support?
                      </p>
                      <p className="text-sm text-amber-700">
                        If you're having thoughts of self-harm, please reach out for help immediately. 
                        Call 988 (US) or your local emergency services.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between mt-6">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentQuestion === 0}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Previous
          </Button>

          <Button
            onClick={handleNext}
            disabled={!canProceed()}
            className="flex items-center gap-2"
          >
            {currentQuestion === assessment.totalQuestions - 1 ? (
              <>
                Complete Assessment
                <CheckCircle className="h-4 w-4" />
              </>
            ) : (
              <>
                Next Question
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>

        {/* Save Progress */}
        <div className="text-center mt-4">
          <Button variant="ghost" size="sm" className="text-muted-foreground">
            Save & Continue Later
          </Button>
        </div>
      </div>
    </div>
  );
}