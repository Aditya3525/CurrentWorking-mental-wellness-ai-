import { Heart, Brain, Target, Sparkles, Play, MessageCircle, BookOpen, TrendingUp, Calendar, Award, ArrowRight } from 'lucide-react';
import React, { useState } from 'react';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Progress } from '../../ui/progress';

interface DashboardProps {
  user: any;
  onNavigate: (page: string) => void;
  onStartAssessment: (assessmentId: string) => void;
  onLogout?: () => void;
}

export function Dashboard({ user, onNavigate, onStartAssessment, onLogout }: DashboardProps) {
  const [todayMood, setTodayMood] = useState<string>('');

  const moodOptions = [
    { mood: 'Great', emoji: '😊', color: 'bg-green-100 text-green-800' },
    { mood: 'Good', emoji: '🙂', color: 'bg-blue-100 text-blue-800' },
    { mood: 'Okay', emoji: '😐', color: 'bg-yellow-100 text-yellow-800' },
    { mood: 'Struggling', emoji: '😔', color: 'bg-orange-100 text-orange-800' },
    { mood: 'Anxious', emoji: '😰', color: 'bg-red-100 text-red-800' },
  ];

  const getWelcomeMessage = () => {
    const hour = new Date().getHours();
    let timeGreeting = '';
    if (hour < 12) timeGreeting = 'Good morning';
    else if (hour < 17) timeGreeting = 'Good afternoon';
    else timeGreeting = 'Good evening';
    
    // Personalized greeting based on user profile completeness
    const hasProfile = user?.birthday || user?.region || user?.approach;
    const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.name || 'there';
    if (!hasProfile) {
      return `${timeGreeting}, ${fullName}! Welcome to your journey 🌟`;
    }
    return `${timeGreeting}, ${fullName}! 👋`;
  };

  const getProfileCompletion = () => {
    if (!user) return 0;
    // Updated to remove deprecated language field and include first/last name & emergency phone
    const tracked = [
      user.firstName,
      user.lastName,
      user.birthday,
      user.region,
      user.approach,
      user.emergencyContact,
      user.emergencyPhone
    ];
    const total = tracked.length;
    const completed = tracked.filter(v => v !== null && v !== undefined && v !== '').length;
    return total === 0 ? 0 : Math.round((completed / total) * 100);
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Moderate';
    return 'Needs attention';
  };

  const practiceTitle = (() => {
    switch (user?.approach) {
      case 'western': return "CBT Reflection Exercise";
      case 'eastern': return "Guided Mindful Breathing";
      case 'hybrid': return "Blended Mindfulness & CBT Practice";
      default: return "10-Minute Calm Breathing";
    }
  })();

  const practiceTags = (() => {
    switch (user?.approach) {
      case 'western': return ['CBT technique', 'Thought tracking', '5–10 min'];
      case 'eastern': return ['Meditation', 'Breathwork', 'Grounding'];
      case 'hybrid': return ['Mindfulness', 'Cognitive reframing', 'Balanced'];
      default: return ['Anxiety relief', 'Beginner friendly', '10 min'];
    }
  })();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/10 to-accent/10 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-start mb-6">
            <div className="space-y-2">
              <h1 className="text-2xl">
                {getWelcomeMessage()}
              </h1>
              <p className="text-muted-foreground">How are you feeling today?</p>
            </div>
            <div className="flex items-center gap-4">
              {/* Profile Completion Indicator */}
              {getProfileCompletion() < 100 && (
                <div className="text-right">
                  <p className="text-sm font-medium">Profile {getProfileCompletion()}% complete</p>
                  <Button variant="link" size="sm" className="p-0 h-auto text-xs" onClick={() => onNavigate('profile')}>
                    Complete setup →
                  </Button>
                </div>
              )}
              <Button variant="outline" onClick={() => onNavigate('profile')}>
                Profile
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => {
                  if (onLogout && window.confirm('Log out of your session?')) onLogout();
                }} 
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                Logout
              </Button>
            </div>
          </div>

          {/* Quick Mood Check */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <Heart className="h-5 w-5 text-primary" />
                <span className="font-medium">Quick mood check</span>
              </div>
              <div className="flex gap-2 flex-wrap">
                {moodOptions.map(({ mood, emoji }) => (
                  <Button
                    key={mood}
                    variant="outline"
                    size="sm"
                    className={`${todayMood === mood ? 'border-primary bg-primary/10' : ''}`}
                    onClick={() => setTodayMood(mood)}
                  >
                    <span className="mr-2">{emoji}</span>
                    {mood}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Key Metrics Overview */}
        {user?.assessmentScores && (
          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Brain className="h-5 w-5 text-primary" />
                  Anxiety Level
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-2xl font-semibold">
                      {user.assessmentScores.anxiety || 0}%
                    </span>
                    <Badge variant="secondary">
                      {getScoreLabel(user.assessmentScores.anxiety || 0)}
                    </Badge>
                  </div>
                  <Progress value={user.assessmentScores.anxiety || 0} className="h-2" />
                  <p className="text-sm text-muted-foreground">
                    Based on your latest assessment
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  Stress Level
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-2xl font-semibold">
                      {user.assessmentScores.stress || 0}%
                    </span>
                    <Badge variant="secondary">
                      {getScoreLabel(user.assessmentScores.stress || 0)}
                    </Badge>
                  </div>
                  <Progress value={user.assessmentScores.stress || 0} className="h-2" />
                  <p className="text-sm text-muted-foreground">
                    Trending down this week
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Emotional Intelligence
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-2xl font-semibold">
                      {user.assessmentScores.emotionalIntelligence || 0}%
                    </span>
                    <Badge variant="secondary">
                      {getScoreLabel(user.assessmentScores.emotionalIntelligence || 0)}
                    </Badge>
                  </div>
                  <Progress value={user.assessmentScores.emotionalIntelligence || 0} className="h-2" />
                  <p className="text-sm text-muted-foreground">
                    Strong foundation to build on
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Action Cards */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Today's Recommended Practice */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play className="h-5 w-5 text-primary" />
                Today&apos;s Practice
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <h3 className="font-semibold">{practiceTitle}</h3>
                    <p className="text-sm text-muted-foreground">
                      {user?.approach ? 'Personalized for your chosen approach.' : 'Perfect for reducing anxiety and centering yourself.'}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                      {practiceTags.map(tag => <span key={tag}>{tag}</span>)}
                    </div>
                  </div>
                  <Button onClick={() => onNavigate('practices')}>
                    Start Practice
                  </Button>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <Button 
                  variant="outline" 
                  className="justify-start h-auto p-4"
                  onClick={() => onNavigate('practices')}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Heart className="h-4 w-4" />
                      <span className="font-medium">5-min Mindfulness</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Quick reset for busy days</p>
                  </div>
                </Button>

                <Button 
                  variant="outline" 
                  className="justify-start h-auto p-4"
                  onClick={() => onNavigate('practices')}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      <span className="font-medium">Gentle Yoga</span>
                    </div>
                    <p className="text-xs text-muted-foreground">15-min body & mind</p>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                className="w-full justify-between"
                onClick={() => onStartAssessment('anxiety')}
              >
                <div className="flex items-center gap-2">
                  <Brain className="h-4 w-4" />
                  Take Assessment
                </div>
                <ArrowRight className="h-4 w-4" />
              </Button>

              <Button 
                variant="outline" 
                className="w-full justify-between"
                onClick={() => onNavigate('chatbot')}
              >
                <div className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4" />
                  Chat with AI
                </div>
                <ArrowRight className="h-4 w-4" />
              </Button>

              <Button 
                variant="outline" 
                className="w-full justify-between"
                onClick={() => onNavigate('library')}
              >
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Browse Library
                </div>
                <ArrowRight className="h-4 w-4" />
              </Button>

              <Button 
                variant="outline" 
                className="w-full justify-between"
                onClick={() => onNavigate('progress')}
              >
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  View Progress
                </div>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Recent Insights & This Week */}
        <div className="grid lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Recent Insights
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {user?.assessmentScores ? (
                <div className="space-y-3">
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-sm">
                      <strong>Pattern detected:</strong> Your stress levels tend to be higher on 
                      weekday mornings. Consider starting your day with a 5-minute breathing exercise.
                    </p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-sm">
                      <strong>Progress update:</strong> Your emotional awareness has improved 15% 
                      over the past month. Great work on the mindfulness practices!
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center space-y-3 py-6">
                  <Brain className="h-12 w-12 text-muted-foreground mx-auto" />
                  <div className="space-y-2">
                    <p className="text-sm font-medium">No insights yet</p>
                    <p className="text-xs text-muted-foreground">
                      Take your first assessment to get personalized insights
                    </p>
                  </div>
                  <Button 
                    size="sm" 
                    onClick={() => onNavigate('assessments')}
                  >
                    Get Started
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                This Week
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm">Daily practices</span>
                  </div>
                  <Badge variant="secondary">4/7 days</Badge>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-sm">Mood check-ins</span>
                  </div>
                  <Badge variant="secondary">6/7 days</Badge>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <span className="text-sm">Assessment progress</span>
                  </div>
                  <Badge variant="secondary">2/4 completed</Badge>
                </div>
              </div>

              <div className="pt-3 border-t">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Award className="h-4 w-4" />
                  <span>Current streak: 3 days</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Navigation Shortcuts */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Button
            variant="ghost"
            className="h-20 flex-col gap-2"
            onClick={() => onNavigate('assessments')}
          >
            <Brain className="h-6 w-6 text-primary" />
            <span className="text-sm">Assessments</span>
          </Button>

          <Button
            variant="ghost"
            className="h-20 flex-col gap-2"
            onClick={() => onNavigate('practices')}
          >
            <Heart className="h-6 w-6 text-primary" />
            <span className="text-sm">Practices</span>
          </Button>

          <Button
            variant="ghost"
            className="h-20 flex-col gap-2"
            onClick={() => onNavigate('library')}
          >
            <BookOpen className="h-6 w-6 text-primary" />
            <span className="text-sm">Library</span>
          </Button>

          <Button
            variant="ghost"
            className="h-20 flex-col gap-2"
            onClick={() => onNavigate('help')}
          >
            <Heart className="h-6 w-6 text-primary" />
            <span className="text-sm">Help</span>
          </Button>
        </div>
      </div>
    </div>
  );
}