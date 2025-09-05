import React, { useState } from 'react';
import { Button } from '../../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Progress as ProgressBar } from '../../ui/progress';
import { Badge } from '../../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import { Calendar } from '../../ui/calendar';
import { 
  ArrowLeft,
  TrendingUp,
  Target,
  Award,
  Calendar as CalendarIcon,
  Flame,
  Star,
  CheckCircle,
  BarChart3,
  Heart,
  Brain,
  Zap,
  Trophy
} from 'lucide-react';

interface ProgressProps {
  user: any;
  onNavigate: (page: string) => void;
}

export function Progress({ user, onNavigate }: ProgressProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedTimeRange, setSelectedTimeRange] = useState<'7d' | '30d' | '6m'>('30d');

  // Mock progress data
  const streakData = {
    current: 7,
    longest: 14,
    thisWeek: 5,
    thisMonth: 22
  };

  const goals = [
    {
      id: '1',
      title: 'Daily Mindfulness Practice',
      description: 'Complete at least 10 minutes of mindfulness practice daily',
      progress: 73,
      target: 30,
      current: 22,
      deadline: '2024-02-15',
      isActive: true
    },
    {
      id: '2',
      title: 'Reduce Anxiety Score',
      description: 'Decrease anxiety assessment score by 15 points',
      progress: 60,
      target: 15,
      current: 9,
      deadline: '2024-03-01',
      isActive: true
    },
    {
      id: '3',
      title: 'Sleep Quality Improvement',
      description: 'Maintain consistent bedtime routine for better sleep',
      progress: 45,
      target: 21,
      current: 9,
      deadline: '2024-02-28',
      isActive: true
    }
  ];

  const achievements = [
    {
      id: '1',
      title: 'First Steps',
      description: 'Completed your first assessment',
      icon: <Star className="h-6 w-6" />,
      earned: true,
      earnedDate: '2024-01-15'
    },
    {
      id: '2',
      title: 'Consistent Learner',
      description: 'Practiced 7 days in a row',
      icon: <Flame className="h-6 w-6" />,
      earned: true,
      earnedDate: '2024-01-22'
    },
    {
      id: '3',
      title: 'Self-Care Champion',
      description: 'Completed 50 practice sessions',
      icon: <Heart className="h-6 w-6" />,
      earned: false,
      progress: 32
    },
    {
      id: '4',
      title: 'Mindful Master',
      description: 'Practiced mindfulness for 30 days',
      icon: <Brain className="h-6 w-6" />,
      earned: false,
      progress: 18
    },
    {
      id: '5',
      title: 'Progress Pioneer',
      description: 'Showed improvement in all assessment areas',
      icon: <Trophy className="h-6 w-6" />,
      earned: false,
      progress: 66
    }
  ];

  const weeklyStats = {
    practiceMinutes: 125,
    sessionsCompleted: 8,
    moodAverage: 7.2,
    streakDays: 5
  };

  // Mock chart data
  const generateChartData = (timeRange: string) => {
    const dataPoints = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 180;
    return Array.from({ length: dataPoints }, (_, i) => ({
      date: new Date(Date.now() - (dataPoints - i) * 24 * 60 * 60 * 1000),
      anxiety: Math.max(20, 80 - Math.random() * 40 - i * 0.5),
      stress: Math.max(15, 75 - Math.random() * 35 - i * 0.3),
      mood: Math.min(10, 4 + Math.random() * 4 + i * 0.02),
      practices: Math.floor(Math.random() * 3)
    }));
  };

  const chartData = generateChartData(selectedTimeRange);
  const latestData = chartData[chartData.length - 1];

  const getTimeRangeLabel = (range: string) => {
    switch (range) {
      case '7d': return 'Last 7 Days';
      case '30d': return 'Last 30 Days';
      case '6m': return 'Last 6 Months';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/10 to-accent/10 p-6">
        <div className="max-w-6xl mx-auto">
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
            <h1 className="text-3xl">Your Progress</h1>
            <p className="text-muted-foreground text-lg">
              Track your wellbeing journey, celebrate achievements, and stay motivated
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
            <TabsTrigger value="goals">Goals</TabsTrigger>
            <TabsTrigger value="achievements">Achievements</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Quick Stats */}
            <div className="grid md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="space-y-2">
                    <Flame className="h-8 w-8 text-orange-500 mx-auto" />
                    <div className="text-2xl font-semibold">{streakData.current}</div>
                    <div className="text-sm text-muted-foreground">Day Streak</div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 text-center">
                  <div className="space-y-2">
                    <Heart className="h-8 w-8 text-primary mx-auto" />
                    <div className="text-2xl font-semibold">{weeklyStats.practiceMinutes}</div>
                    <div className="text-sm text-muted-foreground">Minutes This Week</div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 text-center">
                  <div className="space-y-2">
                    <Target className="h-8 w-8 text-green-500 mx-auto" />
                    <div className="text-2xl font-semibold">{weeklyStats.sessionsCompleted}</div>
                    <div className="text-sm text-muted-foreground">Sessions Completed</div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 text-center">
                  <div className="space-y-2">
                    <Star className="h-8 w-8 text-yellow-500 mx-auto" />
                    <div className="text-2xl font-semibold">{weeklyStats.moodAverage}</div>
                    <div className="text-sm text-muted-foreground">Avg Mood Rating</div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-primary" />
                      Recent Activity
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {[
                        { date: 'Today', activity: 'Completed 10-min breathing exercise', type: 'practice' },
                        { date: 'Today', activity: 'Mood check-in: Feeling good', type: 'mood' },
                        { date: 'Yesterday', activity: 'Finished anxiety assessment', type: 'assessment' },
                        { date: 'Yesterday', activity: 'Completed body scan meditation', type: 'practice' },
                        { date: '2 days ago', activity: 'Set new goal: Daily mindfulness', type: 'goal' },
                      ].map((item, index) => (
                        <div key={index} className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
                          <div className={`w-2 h-2 rounded-full ${
                            item.type === 'practice' ? 'bg-green-500' :
                            item.type === 'mood' ? 'bg-blue-500' :
                            item.type === 'assessment' ? 'bg-purple-500' :
                            'bg-yellow-500'
                          }`} />
                          <div className="flex-1">
                            <p className="text-sm">{item.activity}</p>
                            <p className="text-xs text-muted-foreground">{item.date}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CalendarIcon className="h-5 w-5 text-primary" />
                    Calendar
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    className="rounded-md"
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Trends Tab */}
          <TabsContent value="trends" className="space-y-6">
            {/* Time Range Selector */}
            <div className="flex gap-2">
              {(['7d', '30d', '6m'] as const).map((range) => (
                <Button
                  key={range}
                  variant={selectedTimeRange === range ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedTimeRange(range)}
                >
                  {getTimeRangeLabel(range)}
                </Button>
              ))}
            </div>

            {/* Trend Charts */}
            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5 text-primary" />
                    Anxiety & Stress Levels
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Current Anxiety</span>
                      <Badge variant={latestData.anxiety > 60 ? 'destructive' : latestData.anxiety > 40 ? 'secondary' : 'default'}>
                        {Math.round(latestData.anxiety)}%
                      </Badge>
                    </div>
                    <ProgressBar value={latestData.anxiety} className="h-2" />
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Current Stress</span>
                      <Badge variant={latestData.stress > 60 ? 'destructive' : latestData.stress > 40 ? 'secondary' : 'default'}>
                        {Math.round(latestData.stress)}%
                      </Badge>
                    </div>
                    <ProgressBar value={latestData.stress} className="h-2" />

                    <div className="text-xs text-muted-foreground">
                      {latestData.anxiety < 60 && latestData.stress < 60 
                        ? '✅ Both levels are in healthy range'
                        : '💡 Consider focusing on stress reduction practices'
                      }
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="h-5 w-5 text-primary" />
                    Mood & Practice Frequency
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Average Mood</span>
                      <Badge variant="default">
                        {latestData.mood.toFixed(1)}/10
                      </Badge>
                    </div>
                    <ProgressBar value={latestData.mood * 10} className="h-2" />
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Practice Consistency</span>
                      <Badge variant="secondary">
                        {Math.round((weeklyStats.sessionsCompleted / 7) * 100)}%
                      </Badge>
                    </div>
                    <ProgressBar value={(weeklyStats.sessionsCompleted / 7) * 100} className="h-2" />

                    <div className="text-xs text-muted-foreground">
                      📈 Mood improving with regular practice
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Insights */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Insights & Patterns
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <h4 className="font-medium">Positive Trends</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span>Anxiety levels decreased 15% this month</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span>Mood ratings consistently above 7/10</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span>Practice frequency increased 40%</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <h4 className="font-medium">Areas for Focus</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-yellow-600" />
                        <span>Stress spikes on weekday mornings</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-yellow-600" />
                        <span>Mood dips on Sunday evenings</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-yellow-600" />
                        <span>Could benefit from longer practices</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Goals Tab */}
          <TabsContent value="goals" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl">Your Goals</h2>
              <Button onClick={() => {/* Open goal creation modal */}}>
                <Target className="h-4 w-4 mr-2" />
                Set New Goal
              </Button>
            </div>

            <div className="space-y-4">
              {goals.map((goal) => (
                <Card key={goal.id}>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <h3 className="font-semibold">{goal.title}</h3>
                          <p className="text-sm text-muted-foreground">{goal.description}</p>
                        </div>
                        <Badge variant={goal.isActive ? 'default' : 'secondary'}>
                          {goal.isActive ? 'Active' : 'Completed'}
                        </Badge>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Progress</span>
                          <span>{goal.current}/{goal.target} • {goal.progress}%</span>
                        </div>
                        <ProgressBar value={goal.progress} className="h-2" />
                      </div>

                      <div className="flex justify-between items-center text-sm text-muted-foreground">
                        <span>Deadline: {new Date(goal.deadline).toLocaleDateString()}</span>
                        <Button variant="ghost" size="sm">
                          Edit Goal
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Achievements Tab */}
          <TabsContent value="achievements" className="space-y-6">
            <div className="space-y-4">
              <h2 className="text-xl">Achievements & Badges</h2>
              <p className="text-muted-foreground">
                Celebrate your progress and milestones on your wellbeing journey
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {achievements.map((achievement) => (
                <Card 
                  key={achievement.id}
                  className={`${achievement.earned ? 'border-primary bg-primary/5' : 'opacity-75'}`}
                >
                  <CardContent className="p-6 text-center space-y-3">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto ${
                      achievement.earned 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {achievement.icon}
                    </div>

                    <div className="space-y-1">
                      <h3 className="font-semibold">{achievement.title}</h3>
                      <p className="text-sm text-muted-foreground">{achievement.description}</p>
                    </div>

                    {achievement.earned ? (
                      <div className="space-y-1">
                        <Badge variant="default" className="mb-2">
                          <Award className="h-3 w-3 mr-1" />
                          Earned
                        </Badge>
                        <p className="text-xs text-muted-foreground">
                          {new Date(achievement.earnedDate!).toLocaleDateString()}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="text-sm text-muted-foreground">
                          {achievement.progress}% complete
                        </div>
                        <ProgressBar value={achievement.progress || 0} className="h-1" />
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}