import { Calendar, TrendingUp, Target, Award, Flame, CheckCircle } from 'lucide-react';
import React from 'react';

import { Badge } from '../../ui/badge';
import { Card } from '../../ui/card';
import { Progress } from '../../ui/progress';

export interface UserProgress {
  totalSessions: number;
  totalMinutes: number;
  currentStreak: number;
  longestStreak: number;
  weeklyGoal: number;
  weeklyProgress: number;
  monthlyGoal: number;
  monthlyProgress: number;
  completedCategories: string[];
  achievements: Achievement[];
  recentActivity: ActivityItem[];
  weeklyStats: WeeklyStats[];
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt: string;
  category: 'streak' | 'time' | 'sessions' | 'variety' | 'milestone';
}

export interface ActivityItem {
  id: string;
  title: string;
  type: 'content' | 'practice';
  category: string;
  duration?: number;
  completedAt: string;
  rating?: number;
}

export interface WeeklyStats {
  week: string;
  sessions: number;
  minutes: number;
  avgRating: number;
}

interface ProgressTrackingSystemProps {
  userProgress: UserProgress;
  showDetailed?: boolean;
  variant?: 'dashboard' | 'full' | 'compact';
}

export const ProgressTrackingSystem: React.FC<ProgressTrackingSystemProps> = ({
  userProgress,
  showDetailed = false,
  variant = 'dashboard'
}) => {
  const getStreakColor = (streak: number) => {
    if (streak >= 30) return 'text-purple-400';
    if (streak >= 14) return 'text-blue-400';
    if (streak >= 7) return 'text-green-400';
    return 'text-yellow-400';
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const getAchievementIcon = (category: string) => {
    switch (category) {
      case 'streak':
        return '🔥';
      case 'time':
        return '⏰';
      case 'sessions':
        return '📊';
      case 'variety':
        return '🌈';
      case 'milestone':
        return '🏆';
      default:
        return '⭐';
    }
  };

  if (variant === 'compact') {
    return (
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-white">Your Progress</h3>
          <div className="flex items-center gap-1 text-orange-400">
            <Flame className="w-4 h-4" />
            <span className="font-bold">{userProgress.currentStreak}</span>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-3 text-center">
          <div>
            <div className="text-2xl font-bold text-purple-400">{userProgress.totalSessions}</div>
            <div className="text-xs text-gray-400">Sessions</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-400">{formatDuration(userProgress.totalMinutes)}</div>
            <div className="text-xs text-gray-400">Total Time</div>
          </div>
        </div>
        
        <div className="mt-3">
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-gray-400">Weekly Goal</span>
            <span className="text-gray-300">{userProgress.weeklyProgress}/{userProgress.weeklyGoal}</span>
          </div>
          <Progress 
            value={(userProgress.weeklyProgress / userProgress.weeklyGoal) * 100} 
            className="h-2"
          />
        </div>
      </Card>
    );
  }

  if (variant === 'dashboard') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Current Streak */}
        <Card className="p-6 bg-gradient-to-br from-orange-900 to-red-900">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Flame className="w-6 h-6 text-orange-400" />
              <span className="font-medium text-white">Current Streak</span>
            </div>
          </div>
          <div className="text-center">
            <div className={`text-4xl font-bold ${getStreakColor(userProgress.currentStreak)}`}>
              {userProgress.currentStreak}
            </div>
            <div className="text-sm text-gray-300 mt-1">
              days • best: {userProgress.longestStreak}
            </div>
          </div>
        </Card>

        {/* Total Sessions */}
        <Card className="p-6 bg-gradient-to-br from-purple-900 to-blue-900">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-6 h-6 text-purple-400" />
              <span className="font-medium text-white">Sessions</span>
            </div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-purple-400">
              {userProgress.totalSessions}
            </div>
            <div className="text-sm text-gray-300 mt-1">
              {formatDuration(userProgress.totalMinutes)} total
            </div>
          </div>
        </Card>

        {/* Weekly Goal */}
        <Card className="p-6 bg-gradient-to-br from-green-900 to-teal-900">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Target className="w-6 h-6 text-green-400" />
              <span className="font-medium text-white">Weekly Goal</span>
            </div>
          </div>
          <div className="text-center mb-3">
            <div className="text-2xl font-bold text-green-400">
              {userProgress.weeklyProgress}/{userProgress.weeklyGoal}
            </div>
            <div className="text-sm text-gray-300">sessions this week</div>
          </div>
          <Progress 
            value={(userProgress.weeklyProgress / userProgress.weeklyGoal) * 100} 
            className="h-3"
          />
        </Card>

        {/* Achievements */}
        <Card className="p-6 bg-gradient-to-br from-yellow-900 to-orange-900">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Award className="w-6 h-6 text-yellow-400" />
              <span className="font-medium text-white">Achievements</span>
            </div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-yellow-400">
              {userProgress.achievements.length}
            </div>
            <div className="text-sm text-gray-300 mt-1">
              unlocked
            </div>
            {userProgress.achievements.length > 0 && (
              <div className="flex justify-center mt-2">
                <span className="text-2xl">
                  {getAchievementIcon(userProgress.achievements[userProgress.achievements.length - 1].category)}
                </span>
              </div>
            )}
          </div>
        </Card>
      </div>
    );
  }

  // Full variant
  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6 text-center">
          <Flame className="w-8 h-8 text-orange-400 mx-auto mb-3" />
          <div className={`text-3xl font-bold ${getStreakColor(userProgress.currentStreak)} mb-1`}>
            {userProgress.currentStreak}
          </div>
          <div className="text-sm text-gray-400">Current Streak</div>
          <div className="text-xs text-gray-500 mt-1">
            Best: {userProgress.longestStreak} days
          </div>
        </Card>

        <Card className="p-6 text-center">
          <CheckCircle className="w-8 h-8 text-purple-400 mx-auto mb-3" />
          <div className="text-3xl font-bold text-purple-400 mb-1">
            {userProgress.totalSessions}
          </div>
          <div className="text-sm text-gray-400">Total Sessions</div>
          <div className="text-xs text-gray-500 mt-1">
            {formatDuration(userProgress.totalMinutes)}
          </div>
        </Card>

        <Card className="p-6 text-center">
          <Target className="w-8 h-8 text-green-400 mx-auto mb-3" />
          <div className="text-3xl font-bold text-green-400 mb-1">
            {Math.round((userProgress.weeklyProgress / userProgress.weeklyGoal) * 100)}%
          </div>
          <div className="text-sm text-gray-400">Weekly Goal</div>
          <Progress 
            value={(userProgress.weeklyProgress / userProgress.weeklyGoal) * 100} 
            className="h-2 mt-2"
          />
        </Card>

        <Card className="p-6 text-center">
          <Award className="w-8 h-8 text-yellow-400 mx-auto mb-3" />
          <div className="text-3xl font-bold text-yellow-400 mb-1">
            {userProgress.achievements.length}
          </div>
          <div className="text-sm text-gray-400">Achievements</div>
          <div className="text-xs text-gray-500 mt-1">
            {userProgress.completedCategories.length} categories explored
          </div>
        </Card>
      </div>

      {/* Recent Achievements */}
      {userProgress.achievements.length > 0 && (
        <Card className="p-6">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-yellow-400" />
            Recent Achievements
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {userProgress.achievements.slice(-6).map((achievement) => (
              <div key={achievement.id} className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg">
                <div className="text-2xl">
                  {getAchievementIcon(achievement.category)}
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-white text-sm">{achievement.title}</h4>
                  <p className="text-xs text-gray-400 line-clamp-2">{achievement.description}</p>
                  <div className="text-xs text-gray-500 mt-1">
                    {new Date(achievement.unlockedAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Recent Activity */}
      {showDetailed && userProgress.recentActivity.length > 0 && (
        <Card className="p-6">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-400" />
            Recent Activity
          </h3>
          <div className="space-y-3">
            {userProgress.recentActivity.slice(0, 10).map((activity) => (
              <div key={activity.id} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <Badge variant={activity.type === 'content' ? 'default' : 'secondary'} size="sm">
                    {activity.type}
                  </Badge>
                  <div>
                    <h4 className="font-medium text-white text-sm">{activity.title}</h4>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <span>{activity.category}</span>
                      {activity.duration && <span>• {formatDuration(activity.duration)}</span>}
                      <span>• {new Date(activity.completedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                {activity.rating && (
                  <div className="flex items-center gap-1">
                    <span className="text-yellow-400">★</span>
                    <span className="text-sm text-gray-300">{activity.rating}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Weekly Trend */}
      {showDetailed && userProgress.weeklyStats.length > 0 && (
        <Card className="p-6">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-green-400" />
            Weekly Trend
          </h3>
          <div className="space-y-3">
            {userProgress.weeklyStats.map((week) => (
              <div key={week.week} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-green-400" />
                  <div>
                    <div className="font-medium text-white text-sm">Week {week.week}</div>
                    <div className="text-xs text-gray-400">
                      {week.sessions} sessions • {formatDuration(week.minutes)}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 text-sm">
                    <span className="text-yellow-400">★</span>
                    <span className="text-gray-300">{week.avgRating.toFixed(1)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

export default ProgressTrackingSystem;