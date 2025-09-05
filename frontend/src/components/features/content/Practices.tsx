import React, { useState, useEffect } from 'react';
import { Button } from '../../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Progress } from '../../ui/progress';
import { Badge } from '../../ui/badge';
import { Slider } from '../../ui/slider';
import { ImageWithFallback } from '../../common/ImageWithFallback';
import { 
  ArrowLeft,
  Play,
  Pause,
  RotateCcw,
  Heart,
  Waves,
  Users,
  Clock,
  Volume2,
  VolumeX,
  Download,
  Bookmark,
  CheckCircle,
  SkipForward
} from 'lucide-react';

interface PracticesProps {
  onNavigate: (page: string) => void;
}

interface Practice {
  id: string;
  title: string;
  description: string;
  type: 'meditation' | 'breathing' | 'yoga' | 'sleep';
  duration: number; // in minutes
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  instructor: string;
  image: string;
  hasDownload: boolean;
  tags: string[];
}

interface PracticeSession {
  practice: Practice;
  currentTime: number;
  isPlaying: boolean;
  volume: number;
  isCompleted: boolean;
}

export function Practices({ onNavigate }: PracticesProps) {
  const [currentSession, setCurrentSession] = useState<PracticeSession | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDuration, setSelectedDuration] = useState<string>('all');
  const [postPracticeRating, setPostPracticeRating] = useState<number | null>(null);
  const [showPostPractice, setShowPostPractice] = useState(false);

  const practices: Practice[] = [
    {
      id: '1',
      title: '5-Minute Calm Breathing',
      description: 'Quick and effective breathing technique to reduce anxiety and center yourself.',
      type: 'breathing',
      duration: 5,
      difficulty: 'Beginner',
      instructor: 'Dr. Sarah Chen',
      image: 'https://images.unsplash.com/photo-1687180948607-9ba1dd045e10?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYWxtJTIwbWVkaXRhdGlvbiUyMHdlbGxuZXNzfGVufDF8fHx8MTc1NjcxMDg4Nnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      hasDownload: true,
      tags: ['anxiety', 'quick', 'workplace']
    },
    {
      id: '2',
      title: 'Body Scan Meditation',
      description: 'Progressive relaxation technique to release tension and increase body awareness.',
      type: 'meditation',
      duration: 15,
      difficulty: 'Beginner',
      instructor: 'Michael Rodriguez',
      image: 'https://images.unsplash.com/photo-1622048769696-4d042b1028de?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwZWFjZWZ1bCUyMHlvZ2ElMjBtZWRpdGF0aW9ufGVufDF8fHx8MTc1NjcxMDg4OXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      hasDownload: true,
      tags: ['relaxation', 'sleep', 'tension']
    },
    {
      id: '3',
      title: 'Gentle Morning Yoga',
      description: 'Wake up your body with gentle stretches and mindful movement.',
      type: 'yoga',
      duration: 20,
      difficulty: 'Beginner',
      instructor: 'Emma Thompson',
      image: 'https://images.unsplash.com/photo-1599744403700-b7330f3c4dbe?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHxtaW5kZnVsbmVzcyUyMG5hdHVyZSUyMHBlYWNlZnVsfGVufDF8fHx8MTc1NjcxMDg5M3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      hasDownload: false,
      tags: ['morning', 'energy', 'flexibility']
    },
    {
      id: '4',
      title: 'Deep Sleep Preparation',
      description: 'Wind down with this calming practice designed to prepare your mind and body for rest.',
      type: 'sleep',
      duration: 25,
      difficulty: 'Beginner',
      instructor: 'Dr. Lisa Park',
      image: 'https://images.unsplash.com/photo-1687180948607-9ba1dd045e10?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYWxtJTIwbWVkaXRhdGlvbiUyMHdlbGxuZXNzfGVufDF8fHx8MTc1NjcxMDg4Bnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      hasDownload: true,
      tags: ['sleep', 'evening', 'insomnia']
    },
    {
      id: '5',
      title: 'Loving-Kindness Meditation',
      description: 'Cultivate compassion and self-acceptance through this traditional meditation practice.',
      type: 'meditation',
      duration: 18,
      difficulty: 'Intermediate',
      instructor: 'James Wilson',
      image: 'https://images.unsplash.com/photo-1622048769696-4d042b1028de?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwZWFjZWZ1bCUyMHlvZ2ElMjBtZWRpdGF0aW9ufGVufDF8fHx8MTc1NjcxMDg4OXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      hasDownload: true,
      tags: ['compassion', 'self-love', 'relationships']
    },
    {
      id: '6',
      title: '4-7-8 Breathing for Anxiety',
      description: 'Powerful breathing pattern to quickly calm the nervous system during anxious moments.',
      type: 'breathing',
      duration: 8,
      difficulty: 'Beginner',
      instructor: 'Dr. Sarah Chen',
      image: 'https://images.unsplash.com/photo-1599744403700-b7330f3c4dbe?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHxtaW5kZnVsbmVzcyUyMG5hdHVyZSUyMHBlYWNlZnVsfGVufDF8fHx8MTc1NjcxMDg5M3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      hasDownload: true,
      tags: ['anxiety', 'panic', 'quick relief']
    }
  ];

  const categories = [
    { id: 'all', label: 'All Practices', icon: Heart },
    { id: 'meditation', label: 'Meditation', icon: Heart },
    { id: 'breathing', label: 'Breathing', icon: Waves },
    { id: 'yoga', label: 'Yoga', icon: Users },
    { id: 'sleep', label: 'Sleep', icon: Clock }
  ];

  const durations = [
    { id: 'all', label: 'Any Duration' },
    { id: 'short', label: '5-10 minutes' },
    { id: 'medium', label: '10-20 minutes' },
    { id: 'long', label: '20+ minutes' }
  ];

  const filteredPractices = practices.filter(practice => {
    const matchesCategory = selectedCategory === 'all' || practice.type === selectedCategory;
    const matchesDuration = selectedDuration === 'all' || 
      (selectedDuration === 'short' && practice.duration <= 10) ||
      (selectedDuration === 'medium' && practice.duration > 10 && practice.duration <= 20) ||
      (selectedDuration === 'long' && practice.duration > 20);
    
    return matchesCategory && matchesDuration;
  });

  const startPractice = (practice: Practice) => {
    setCurrentSession({
      practice,
      currentTime: 0,
      isPlaying: true,
      volume: 0.7,
      isCompleted: false
    });
  };

  const togglePlayPause = () => {
    if (currentSession) {
      setCurrentSession(prev => prev ? {
        ...prev,
        isPlaying: !prev.isPlaying
      } : null);
    }
  };

  const handleVolumeChange = (value: number[]) => {
    if (currentSession) {
      setCurrentSession(prev => prev ? {
        ...prev,
        volume: value[0]
      } : null);
    }
  };

  const completePractice = () => {
    if (currentSession) {
      setCurrentSession(prev => prev ? {
        ...prev,
        isCompleted: true,
        isPlaying: false
      } : null);
      setShowPostPractice(true);
    }
  };

  const resetPractice = () => {
    if (currentSession) {
      setCurrentSession(prev => prev ? {
        ...prev,
        currentTime: 0,
        isPlaying: false,
        isCompleted: false
      } : null);
    }
  };

  const closePractice = () => {
    setCurrentSession(null);
    setShowPostPractice(false);
    setPostPracticeRating(null);
  };

  // Simulate practice progress
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (currentSession?.isPlaying && !currentSession.isCompleted) {
      interval = setInterval(() => {
        setCurrentSession(prev => {
          if (!prev) return null;
          
          const newTime = prev.currentTime + 1;
          const totalTime = prev.practice.duration * 60; // Convert to seconds
          
          if (newTime >= totalTime) {
            setTimeout(completePractice, 100);
            return { ...prev, currentTime: totalTime, isPlaying: false };
          }
          
          return { ...prev, currentTime: newTime };
        });
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [currentSession?.isPlaying, currentSession?.isCompleted]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'meditation': return <Heart className="h-4 w-4" />;
      case 'breathing': return <Waves className="h-4 w-4" />;
      case 'yoga': return <Users className="h-4 w-4" />;
      case 'sleep': return <Clock className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'meditation': return 'bg-green-100 text-green-800';
      case 'breathing': return 'bg-blue-100 text-blue-800';
      case 'yoga': return 'bg-purple-100 text-purple-800';
      case 'sleep': return 'bg-indigo-100 text-indigo-800';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return 'bg-green-100 text-green-800';
      case 'Intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'Advanced': return 'bg-red-100 text-red-800';
    }
  };

  if (currentSession) {
    const totalSeconds = currentSession.practice.duration * 60;
    const progress = (currentSession.currentTime / totalSeconds) * 100;

    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5 flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 space-y-6">
            {/* Practice Info */}
            <div className="text-center space-y-2">
              <ImageWithFallback
                src={currentSession.practice.image}
                alt={currentSession.practice.title}
                className="w-24 h-24 rounded-full mx-auto object-cover"
              />
              <h2 className="text-xl font-semibold">{currentSession.practice.title}</h2>
              <p className="text-sm text-muted-foreground">
                with {currentSession.practice.instructor}
              </p>
            </div>

            {/* Progress */}
            <div className="space-y-3">
              <Progress value={progress} className="h-2" />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>{formatTime(currentSession.currentTime)}</span>
                <span>{formatTime(totalSeconds)}</span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={resetPractice}
                disabled={currentSession.currentTime === 0}
              >
                <RotateCcw className="h-4 w-4" />
              </Button>

              <Button
                size="lg"
                className="rounded-full w-16 h-16"
                onClick={togglePlayPause}
                disabled={currentSession.isCompleted}
              >
                {currentSession.isPlaying ? (
                  <Pause className="h-6 w-6" />
                ) : (
                  <Play className="h-6 w-6" />
                )}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={completePractice}
                disabled={currentSession.isCompleted}
              >
                <SkipForward className="h-4 w-4" />
              </Button>
            </div>

            {/* Volume Control */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {currentSession.volume === 0 ? (
                  <VolumeX className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Volume2 className="h-4 w-4 text-muted-foreground" />
                )}
                <Slider
                  value={[currentSession.volume]}
                  onValueChange={handleVolumeChange}
                  max={1}
                  step={0.1}
                  className="flex-1"
                />
              </div>
            </div>

            {/* Exit */}
            <Button
              variant="outline"
              className="w-full"
              onClick={closePractice}
            >
              Exit Practice
            </Button>
          </CardContent>
        </Card>

        {/* Post-Practice Modal */}
        {showPostPractice && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle className="text-center flex items-center justify-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Practice Complete!
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-center text-muted-foreground">
                  Great job completing "{currentSession.practice.title}". How do you feel now?
                </p>

                <div className="space-y-3">
                  <div className="grid grid-cols-5 gap-2">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <Button
                        key={rating}
                        variant={postPracticeRating === rating ? 'default' : 'outline'}
                        className="aspect-square"
                        onClick={() => setPostPracticeRating(rating)}
                      >
                        {rating === 1 ? '😔' : rating === 2 ? '😐' : rating === 3 ? '🙂' : rating === 4 ? '😊' : '🤗'}
                      </Button>
                    ))}
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      className="flex-1"
                      onClick={() => {
                        // Save rating and close
                        closePractice();
                      }}
                    >
                      Complete
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => startPractice(currentSession.practice)}
                    >
                      Practice Again
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    );
  }

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
            <h1 className="text-3xl">Mindful Practices</h1>
            <p className="text-muted-foreground text-lg">
              Guided meditations, breathing exercises, and gentle yoga practices for your wellbeing
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        {/* Filters */}
        <div className="space-y-4 mb-8">
          {/* Category Filter */}
          <div className="space-y-2">
            <span className="text-sm font-medium">Practice Type:</span>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => {
                const Icon = category.icon;
                return (
                  <Button
                    key={category.id}
                    variant={selectedCategory === category.id ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedCategory(category.id)}
                    className="flex items-center gap-1"
                  >
                    <Icon className="h-4 w-4" />
                    {category.label}
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Duration Filter */}
          <div className="space-y-2">
            <span className="text-sm font-medium">Duration:</span>
            <div className="flex flex-wrap gap-2">
              {durations.map((duration) => (
                <Button
                  key={duration.id}
                  variant={selectedDuration === duration.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedDuration(duration.id)}
                >
                  {duration.label}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Practices Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPractices.map((practice) => (
            <Card key={practice.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="relative">
                <ImageWithFallback
                  src={practice.image}
                  alt={practice.title}
                  className="w-full h-48 object-cover"
                />
                
                {/* Play overlay */}
                <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors flex items-center justify-center group">
                  <Button 
                    size="lg"
                    className="opacity-0 group-hover:opacity-100 transition-opacity rounded-full w-16 h-16"
                    onClick={() => startPractice(practice)}
                  >
                    <Play className="h-6 w-6" />
                  </Button>
                </div>

                {/* Duration badge */}
                <Badge className="absolute top-2 left-2 bg-black/70 text-white">
                  {practice.duration} min
                </Badge>

                {/* Bookmark */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 right-2 bg-white/80 hover:bg-white"
                >
                  <Bookmark className="h-4 w-4" />
                </Button>
              </div>

              <CardContent className="p-4 space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge 
                      className={getTypeColor(practice.type)}
                    >
                      <div className="flex items-center gap-1">
                        {getTypeIcon(practice.type)}
                        <span className="capitalize">{practice.type}</span>
                      </div>
                    </Badge>
                    
                    <Badge 
                      variant="outline"
                      className={getDifficultyColor(practice.difficulty)}
                    >
                      {practice.difficulty}
                    </Badge>
                  </div>

                  <h3 className="font-semibold leading-tight">{practice.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {practice.description}
                  </p>
                </div>

                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>with {practice.instructor}</span>
                  <div className="flex items-center gap-2">
                    {practice.hasDownload && (
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        <Download className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-1">
                  {practice.tags.slice(0, 3).map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>

                <Button 
                  className="w-full"
                  onClick={() => startPractice(practice)}
                >
                  <Play className="h-4 w-4 mr-2" />
                  Start Practice
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {filteredPractices.length === 0 && (
          <div className="text-center py-12">
            <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No practices found</h3>
            <p className="text-muted-foreground mb-4">
              Try adjusting your filters to find practices that match your needs.
            </p>
            <Button 
              variant="outline"
              onClick={() => {
                setSelectedCategory('all');
                setSelectedDuration('all');
              }}
            >
              Clear Filters
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}