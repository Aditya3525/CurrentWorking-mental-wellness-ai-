import { 
  Play, 
  Pause, 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  Settings, 
  Timer, 
  Heart, 
  Star,
  Bookmark,
  BookmarkCheck,
  Share2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import React, { useState, useEffect, useCallback } from 'react';

import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { Card } from '../../ui/card';
import { Progress } from '../../ui/progress';
import { Slider } from '../../ui/slider';

export interface PracticeItem {
  id: string;
  title: string;
  description: string;
  type: 'meditation' | 'breathing' | 'yoga' | 'sleep' | 'movement' | 'visualization';
  category: string;
  duration: number;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  instructor: string;
  thumbnail?: string;
  audioUrl?: string;
  videoUrl?: string;
  isBookmarked?: boolean;
  isFeatured: boolean;
  averageRating?: number;
  ratingCount?: number;
  completionCount: number;
  benefits: string[];
  targetMoods: string[];
  seriesId?: string;
  seriesTitle?: string;
  seriesOrder?: number;
  progress?: {
    completed: boolean;
    percentage: number;
    lastPosition?: number;
    streakCount?: number;
  };
}

interface RichPracticePlayerProps {
  practice: PracticeItem;
  isOpen: boolean;
  onClose: () => void;
  onBookmark?: (practice: PracticeItem) => void;
  onRate?: (practice: PracticeItem, rating: number) => void;
  onShare?: (practice: PracticeItem) => void;
  onComplete?: (practice: PracticeItem) => void;
  nextPractice?: PracticeItem;
  previousPractice?: PracticeItem;
  onNavigatePractice?: (practice: PracticeItem) => void;
}

export const RichPracticePlayer: React.FC<RichPracticePlayerProps> = ({
  practice,
  isOpen,
  onClose,
  onBookmark,
  onRate,
  onShare,
  onComplete,
  nextPractice,
  previousPractice,
  onNavigatePractice
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(practice.progress?.lastPosition || 0);
  const [volume, setVolume] = useState(75);
  const [isMuted, setIsMuted] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showRating, setShowRating] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(practice.duration * 60); // Convert to seconds

  useEffect(() => {
    if (isOpen) {
      setCurrentTime(practice.progress?.lastPosition || 0);
      setTimeRemaining((practice.duration * 60) - (practice.progress?.lastPosition || 0));
    }
  }, [isOpen, practice]);

  const handleComplete = useCallback(() => {
    setIsPlaying(false);
    if (onComplete) {
      onComplete(practice);
    }
    setShowRating(true);
  }, [onComplete, practice]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && sessionStarted) {
      interval = setInterval(() => {
        setCurrentTime(prev => {
          const newTime = prev + 1;
          setTimeRemaining(Math.max(0, (practice.duration * 60) - newTime));
          
          // Auto-complete when reaching the end
          if (newTime >= practice.duration * 60) {
            setIsPlaying(false);
            handleComplete();
          }
          
          return newTime;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, sessionStarted, practice.duration, handleComplete]);

  const handlePlayPause = () => {
    if (!sessionStarted) {
      setSessionStarted(true);
    }
    setIsPlaying(!isPlaying);
  };

  const handleReset = () => {
    setCurrentTime(0);
    setTimeRemaining(practice.duration * 60);
    setIsPlaying(false);
    setSessionStarted(false);
  };

  const handleVolumeToggle = () => {
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (value: number[]) => {
    setVolume(value[0]);
    if (value[0] > 0) {
      setIsMuted(false);
    }
  };

  const handleBookmark = () => {
    if (onBookmark) {
      onBookmark(practice);
    }
  };

  const handleRating = (rating: number) => {
    setUserRating(rating);
    if (onRate) {
      onRate(practice, rating);
    }
    setShowRating(false);
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const progress = (currentTime / (practice.duration * 60)) * 100;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl bg-gray-900 border-gray-700">
        <div className="relative">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-700">
            <div className="flex items-center gap-3">
              <Button variant="ghost" onClick={onClose} size="sm">
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <div>
                <h2 className="text-xl font-bold text-white">{practice.title}</h2>
                <p className="text-sm text-gray-400">with {practice.instructor}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBookmark}
              >
                {practice.isBookmarked ? (
                  <BookmarkCheck className="w-4 h-4 text-purple-400" />
                ) : (
                  <Bookmark className="w-4 h-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onShare?.(practice)}
              >
                <Share2 className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSettings(!showSettings)}
              >
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Practice Image/Video */}
          <div className="relative h-64 bg-gradient-to-br from-purple-900 to-blue-900 overflow-hidden">
            {practice.thumbnail && (
              <img 
                src={practice.thumbnail} 
                alt={practice.title}
                className="w-full h-full object-cover opacity-60"
              />
            )}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <Button
                  variant="default"
                  size="lg"
                  onClick={handlePlayPause}
                  className="bg-purple-600 hover:bg-purple-700 rounded-full w-16 h-16 mb-4"
                >
                  {isPlaying ? (
                    <Pause className="w-8 h-8" />
                  ) : (
                    <Play className="w-8 h-8 ml-1" />
                  )}
                </Button>
                <div className="text-white">
                  <div className="text-2xl font-bold">{formatTime(timeRemaining)}</div>
                  <div className="text-sm opacity-75">remaining</div>
                </div>
              </div>
            </div>
            
            {/* Practice Info Overlay */}
            <div className="absolute top-4 left-4 flex gap-2">
              <Badge variant="default" className="bg-black/50">
                <Timer className="w-3 h-3 mr-1" />
                {practice.duration} min
              </Badge>
              <Badge variant="default" className="bg-black/50">
                {practice.difficulty}
              </Badge>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="p-4 border-b border-gray-700">
            <Progress value={progress} className="h-2 mb-2" />
            <div className="flex justify-between text-xs text-gray-400">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(practice.duration * 60)}</span>
            </div>
          </div>

          {/* Controls */}
          <div className="p-6">
            <div className="flex items-center justify-center gap-4 mb-6">
              <Button
                variant="ghost"
                onClick={handleReset}
                disabled={!sessionStarted}
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
              
              <Button
                variant="ghost"
                onClick={() => previousPractice && onNavigatePractice?.(previousPractice)}
                disabled={!previousPractice}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              
              <Button
                variant="default"
                size="lg"
                onClick={handlePlayPause}
                className="bg-purple-600 hover:bg-purple-700 rounded-full w-14 h-14"
              >
                {isPlaying ? (
                  <Pause className="w-6 h-6" />
                ) : (
                  <Play className="w-6 h-6 ml-1" />
                )}
              </Button>
              
              <Button
                variant="ghost"
                onClick={() => nextPractice && onNavigatePractice?.(nextPractice)}
                disabled={!nextPractice}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleVolumeToggle}
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </Button>
                <div className="w-20">
                  <Slider
                    value={[isMuted ? 0 : volume]}
                    onValueChange={handleVolumeChange}
                    max={100}
                    step={1}
                    className="w-full"
                  />
                </div>
              </div>
            </div>

            {/* Practice Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-white mb-2">Benefits</h3>
                <div className="flex flex-wrap gap-1">
                  {practice.benefits.map((benefit, index) => (
                    <Badge key={index} variant="outline" size="sm">
                      {benefit}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold text-white mb-2">Target Moods</h3>
                <div className="flex flex-wrap gap-1">
                  {practice.targetMoods.map((mood, index) => (
                    <Badge key={index} variant="outline" size="sm" className="text-purple-400">
                      {mood}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            {/* Series Navigation */}
            {practice.seriesId && (
              <div className="mt-6 p-4 bg-gray-800 rounded-lg">
                <h3 className="font-semibold text-white mb-2">Series: {practice.seriesTitle}</h3>
                <p className="text-sm text-gray-400">
                  Session {practice.seriesOrder} • {practice.completionCount.toLocaleString()} completions
                </p>
              </div>
            )}

            {/* Stats */}
            <div className="mt-6 flex items-center justify-between text-sm text-gray-400">
              <div className="flex items-center gap-4">
                {practice.averageRating && (
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span>{practice.averageRating.toFixed(1)} ({practice.ratingCount})</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Heart className="w-4 h-4" />
                  <span>{practice.completionCount.toLocaleString()} completions</span>
                </div>
              </div>
              
              {practice.progress?.streakCount && (
                <div className="flex items-center gap-1">
                  <span>🔥 {practice.progress.streakCount} day streak</span>
                </div>
              )}
            </div>
          </div>

          {/* Settings Panel */}
          {showSettings && (
            <div className="absolute top-16 right-4 bg-gray-800 border border-gray-600 rounded-lg p-4 min-w-48 z-10">
              <h3 className="font-semibold text-white mb-3">Playback Settings</h3>
              <div className="space-y-3">
                <div>
                  <label htmlFor="playback-speed" className="block text-sm text-gray-300 mb-1">Speed</label>
                  <select
                    id="playback-speed"
                    value={playbackSpeed}
                    onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                  >
                    <option value={0.5}>0.5x</option>
                    <option value={0.75}>0.75x</option>
                    <option value={1}>1x</option>
                    <option value={1.25}>1.25x</option>
                    <option value={1.5}>1.5x</option>
                  </select>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSettings(false)}
                  className="w-full"
                >
                  Close
                </Button>
              </div>
            </div>
          )}

          {/* Rating Modal */}
          {showRating && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <Card className="p-6 bg-gray-800 border-gray-600">
                <h3 className="font-semibold text-white mb-4 text-center">How was your practice?</h3>
                <div className="flex justify-center gap-2 mb-4">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      onClick={() => handleRating(rating)}
                      className="hover:scale-110 transition-transform"
                    >
                      <Star
                        className={`w-8 h-8 ${
                          rating <= userRating
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-400 hover:text-yellow-400'
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowRating(false)}
                    className="flex-1"
                  >
                    Skip
                  </Button>
                  <Button
                    variant="default"
                    onClick={() => handleRating(userRating || 5)}
                    className="flex-1 bg-purple-600 hover:bg-purple-700"
                  >
                    Submit
                  </Button>
                </div>
              </Card>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default RichPracticePlayer;