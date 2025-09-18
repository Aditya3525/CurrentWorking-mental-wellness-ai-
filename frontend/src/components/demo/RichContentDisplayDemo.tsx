import React, { useState } from 'react';

import RichContentCard from '../features/content/RichContentCard';
import RichPracticePlayer from '../features/practices/RichPracticePlayer';
import ProgressTrackingSystem from '../features/progress/ProgressTrackingSystem';
import { Button } from '../ui/button';
import { Card } from '../ui/card';

const RichContentDisplayDemo: React.FC = () => {
  const [selectedContent, setSelectedContent] = useState<any>(null);
  const [selectedPractice, setSelectedPractice] = useState<any>(null);
  const [showPlayer, setShowPlayer] = useState(false);

  // Sample content data
  const sampleContent = {
    id: '1',
    title: 'Understanding Anxiety: A Comprehensive Guide',
    description: 'Learn practical strategies for managing anxiety with evidence-based techniques from leading mental health professionals.',
    type: 'video' as const,
    category: 'anxiety',
    difficulty: 'Beginner' as const,
    approach: 'western' as const,
    thumbnail: 'https://images.unsplash.com/photo-1544027993-37dbfe43562a?w=400&h=300&fit=crop',
    duration: 25,
    averageRating: 4.8,
    ratingCount: 127,
    viewCount: 2341,
    isBookmarked: false,
    isFeatured: true,
    author: {
      id: '1',
      name: 'Dr. Sarah Johnson'
    },
    progress: {
      completed: false,
      percentage: 35,
      lastPosition: 8
    }
  };

  const samplePractice = {
    id: '1',
    title: 'Morning Mindfulness Meditation',
    description: 'Start your day with intention and clarity through this gentle mindfulness practice.',
    type: 'meditation' as const,
    category: 'mindfulness',
    duration: 10,
    difficulty: 'Beginner' as const,
    instructor: 'Maya Chen',
    thumbnail: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop',
    audioUrl: '/audio/morning-meditation.mp3',
    isBookmarked: true,
    isFeatured: true,
    averageRating: 4.9,
    ratingCount: 89,
    completionCount: 1205,
    benefits: ['Reduces stress', 'Improves focus', 'Enhances mood'],
    targetMoods: ['anxious', 'overwhelmed', 'restless'],
    seriesId: 'series-1',
    seriesTitle: 'Mindful Mornings',
    seriesOrder: 1,
    progress: {
      completed: true,
      percentage: 100,
      lastPosition: 0,
      streakCount: 7
    }
  };

  const sampleProgress = {
    totalSessions: 47,
    totalMinutes: 523,
    currentStreak: 12,
    longestStreak: 28,
    weeklyGoal: 5,
    weeklyProgress: 4,
    monthlyGoal: 20,
    monthlyProgress: 16,
    completedCategories: ['mindfulness', 'anxiety', 'sleep'],
    achievements: [
      {
        id: '1',
        title: 'First Steps',
        description: 'Completed your first meditation session',
        icon: '🎯',
        unlockedAt: '2025-09-01T10:00:00Z',
        category: 'milestone' as const
      },
      {
        id: '2',
        title: 'Week Warrior',
        description: 'Maintained a 7-day streak',
        icon: '🔥',
        unlockedAt: '2025-09-10T10:00:00Z',
        category: 'streak' as const
      },
      {
        id: '3',
        title: 'Mindful Explorer',
        description: 'Tried practices from 3 different categories',
        icon: '🌈',
        unlockedAt: '2025-09-15T10:00:00Z',
        category: 'variety' as const
      }
    ],
    recentActivity: [
      {
        id: '1',
        title: 'Breathing for Anxiety',
        type: 'practice' as const,
        category: 'breathing',
        duration: 5,
        completedAt: '2025-09-17T08:00:00Z',
        rating: 5
      },
      {
        id: '2',
        title: 'Sleep Hygiene Tips',
        type: 'content' as const,
        category: 'sleep',
        completedAt: '2025-09-16T21:00:00Z',
        rating: 4
      }
    ],
    weeklyStats: [
      {
        week: '37',
        sessions: 5,
        minutes: 45,
        avgRating: 4.6
      },
      {
        week: '36',
        sessions: 4,
        minutes: 38,
        avgRating: 4.4
      },
      {
        week: '35',
        sessions: 6,
        minutes: 52,
        avgRating: 4.8
      }
    ]
  };

  const handleContentPlay = (content: any) => {
    console.log('Playing content:', content.title);
  };

  const handleContentBookmark = (content: any) => {
    console.log('Bookmarking content:', content.title);
  };

  const handleContentRate = (content: any, rating: number) => {
    console.log('Rating content:', content.title, 'with', rating, 'stars');
  };

  const handleContentShare = (content: any) => {
    console.log('Sharing content:', content.title);
  };

  const handleContentNavigate = (content: any) => {
    setSelectedContent(content);
    console.log('Navigating to content:', content.title);
  };

  const handlePracticeBookmark = (practice: any) => {
    console.log('Bookmarking practice:', practice.title);
  };

  const handlePracticeRate = (practice: any, rating: number) => {
    console.log('Rating practice:', practice.title, 'with', rating, 'stars');
  };

  const handlePracticeShare = (practice: any) => {
    console.log('Sharing practice:', practice.title);
  };

  const handlePracticeComplete = (practice: any) => {
    console.log('Completed practice:', practice.title);
    setShowPlayer(false);
  };

  const handleOpenPracticePlayer = () => {
    setSelectedPractice(samplePractice);
    setShowPlayer(true);
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-white mb-4">Rich Content Display System</h1>
        <p className="text-gray-400 max-w-2xl mx-auto">
          Enhanced components for immersive content and practice experiences with progress tracking
        </p>
      </div>

      {/* Content Cards Section */}
      <section>
        <h2 className="text-2xl font-semibold text-white mb-6">Content Card Variants</h2>
        <div className="space-y-8">
          {/* Featured Variant */}
          <div>
            <h3 className="text-lg font-medium text-gray-300 mb-4">Featured Content Card</h3>
            <div className="max-w-lg">
              <RichContentCard
                content={sampleContent}
                variant="featured"
                onPlay={handleContentPlay}
                onBookmark={handleContentBookmark}
                onRate={handleContentRate}
                onShare={handleContentShare}
                onNavigate={handleContentNavigate}
              />
            </div>
          </div>

          {/* Default and Compact Grid */}
          <div>
            <h3 className="text-lg font-medium text-gray-300 mb-4">Default & Compact Variants</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <RichContentCard
                content={{...sampleContent, isFeatured: false}}
                variant="default"
                onPlay={handleContentPlay}
                onBookmark={handleContentBookmark}
                onRate={handleContentRate}
                onShare={handleContentShare}
                onNavigate={handleContentNavigate}
              />
              <div className="space-y-3">
                <RichContentCard
                  content={{...sampleContent, title: 'Quick Relaxation Technique'}}
                  variant="compact"
                  onBookmark={handleContentBookmark}
                  onNavigate={handleContentNavigate}
                />
                <RichContentCard
                  content={{...sampleContent, title: 'Breathing Exercise', type: 'audio'}}
                  variant="compact"
                  onBookmark={handleContentBookmark}
                  onNavigate={handleContentNavigate}
                />
                <RichContentCard
                  content={{...sampleContent, title: 'Sleep Hygiene Guide', type: 'article'}}
                  variant="compact"
                  onBookmark={handleContentBookmark}
                  onNavigate={handleContentNavigate}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Practice Player Section */}
      <section>
        <h2 className="text-2xl font-semibold text-white mb-6">Practice Player</h2>
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-medium text-white">Immersive Practice Experience</h3>
              <p className="text-gray-400">Full-featured practice player with timer, controls, and progress tracking</p>
            </div>
            <Button
              onClick={handleOpenPracticePlayer}
              className="bg-purple-600 hover:bg-purple-700"
            >
              Open Practice Player
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-300">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full" />
              <span>Real-time progress tracking</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full" />
              <span>Audio/video controls</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-400 rounded-full" />
              <span>Series navigation</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-yellow-400 rounded-full" />
              <span>Session completion tracking</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-orange-400 rounded-full" />
              <span>Playback speed control</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-pink-400 rounded-full" />
              <span>Rating and feedback system</span>
            </div>
          </div>
        </Card>
      </section>

      {/* Progress Tracking Section */}
      <section>
        <h2 className="text-2xl font-semibold text-white mb-6">Progress Tracking System</h2>
        
        <div className="space-y-8">
          {/* Dashboard Variant */}
          <div>
            <h3 className="text-lg font-medium text-gray-300 mb-4">Dashboard Overview</h3>
            <ProgressTrackingSystem
              userProgress={sampleProgress}
              variant="dashboard"
            />
          </div>

          {/* Compact Variant */}
          <div>
            <h3 className="text-lg font-medium text-gray-300 mb-4">Compact Progress Widget</h3>
            <div className="max-w-sm">
              <ProgressTrackingSystem
                userProgress={sampleProgress}
                variant="compact"
              />
            </div>
          </div>

          {/* Full Detailed View */}
          <div>
            <h3 className="text-lg font-medium text-gray-300 mb-4">Detailed Progress View</h3>
            <ProgressTrackingSystem
              userProgress={sampleProgress}
              variant="full"
              showDetailed={true}
            />
          </div>
        </div>
      </section>

      {/* Features Summary */}
      <section>
        <h2 className="text-2xl font-semibold text-white mb-6">Rich Display Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="p-6">
            <h3 className="font-semibold text-white mb-3">Adaptive Cards</h3>
            <ul className="text-sm text-gray-400 space-y-2">
              <li>• Multiple display variants</li>
              <li>• Responsive hover effects</li>
              <li>• Progress indicators</li>
              <li>• Interactive bookmarking</li>
              <li>• Rating system integration</li>
            </ul>
          </Card>

          <Card className="p-6">
            <h3 className="font-semibold text-white mb-3">Practice Timer</h3>
            <ul className="text-sm text-gray-400 space-y-2">
              <li>• Real-time countdown</li>
              <li>• Session state management</li>
              <li>• Audio/video controls</li>
              <li>• Playback speed options</li>
              <li>• Auto-completion detection</li>
            </ul>
          </Card>

          <Card className="p-6">
            <h3 className="font-semibold text-white mb-3">Progress Analytics</h3>
            <ul className="text-sm text-gray-400 space-y-2">
              <li>• Streak tracking</li>
              <li>• Goal progress visualization</li>
              <li>• Achievement system</li>
              <li>• Activity history</li>
              <li>• Weekly trend analysis</li>
            </ul>
          </Card>
        </div>
      </section>

      {/* Practice Player Modal */}
      <RichPracticePlayer
        practice={selectedPractice || samplePractice}
        isOpen={showPlayer}
        onClose={() => setShowPlayer(false)}
        onBookmark={handlePracticeBookmark}
        onRate={handlePracticeRate}
        onShare={handlePracticeShare}
        onComplete={handlePracticeComplete}
      />
    </div>
  );
};

export default RichContentDisplayDemo;