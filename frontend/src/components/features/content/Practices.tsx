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
  SkipForward,
  Timer,
  Layers,
  Filter,
  ChevronDown,
  Music,
  Video as VideoIcon,
  X,
  Search,
  SlidersHorizontal,
  Grid3x3,
  List,
  ArrowUp
} from 'lucide-react';
import React, { useState, useEffect, useCallback } from 'react';

import { useDevice } from '../../../hooks/use-device';
import { ImageWithFallback } from '../../common/ImageWithFallback';
import { MediaPlayer } from '../../common/MediaPlayer';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Input } from '../../ui/input';
import { Progress } from '../../ui/progress';
import { ResponsiveContainer } from '../../ui/responsive-layout';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter
} from '../../ui/sheet';
import { Slider } from '../../ui/slider';

interface PracticesProps {
  onNavigate: (page: string) => void;
}
interface Practice {
  id: string;
  title: string;
  description: string;
  type: 'meditation' | 'breathing' | 'yoga' | 'sleep';
  duration: number; // in minutes
  difficulty: 'Beginner' | 'Moderate' | 'Advanced';
  approach: 'Western' | 'Eastern' | 'Hybrid';
  format: 'Audio' | 'Video' | 'Audio/Video';
  instructor: string;
  image: string;
  hasDownload: boolean;
  tags: string[];
  audioUrl?: string | null;
  videoUrl?: string | null;
  youtubeUrl?: string | null;
}

interface PracticeSession {
  practice: Practice;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  volume: number;
  isCompleted: boolean;
}

export function Practices({ onNavigate }: PracticesProps) {
  const device = useDevice();
  
  const [currentSession, setCurrentSession] = useState<PracticeSession | null>(null);
  // Filter state (multi-select except duration)
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]); // empty = All
  const [selectedDuration, setSelectedDuration] = useState<string>('all');
  const [selectedApproaches, setSelectedApproaches] = useState<string[]>([]);
  const [selectedDifficulties, setSelectedDifficulties] = useState<string[]>([]);
  const [selectedFormats, setSelectedFormats] = useState<string[]>([]); // Audio / Video
  const [showAdvancedFilters, setShowAdvancedFilters] = useState<boolean>(false);
  const [postPracticeRating, setPostPracticeRating] = useState<number | null>(null);
  const [showPostPractice, setShowPostPractice] = useState(false);

  // Mobile-responsive state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(device.isMobile ? 'list' : 'grid');
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [isActiveFiltersExpanded, setIsActiveFiltersExpanded] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);

  const [practices, setPractices] = useState<Practice[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true); setError(null);
      try {
        const resp = await fetch('/api/practices');
        if(!resp.ok) throw new Error('Failed to load practices');
        const json = await resp.json();
        if(!json.success) throw new Error(json.error || 'Failed to load practices');
  interface RawPractice { id:string; title:string; description?:string|null; type:string; duration:number; difficulty:string; approach:string; format:string; audioUrl?:string|null; videoUrl?:string|null; youtubeUrl?:string|null; thumbnailUrl?:string|null; tags?:string|null; }
        const mapped: Practice[] = (json.data as RawPractice[] || []).map((p) => ({
          id: p.id,
          title: p.title,
          description: p.description || '',
          type: (['meditation','breathing','yoga','sleep'].includes(p.type) ? p.type : 'meditation') as Practice['type'],
          duration: p.duration,
          difficulty: (['Beginner','Moderate','Advanced'].includes(p.difficulty) ? p.difficulty : 'Beginner') as Practice['difficulty'],
          approach: (['Western','Eastern','Hybrid'].includes(p.approach) ? p.approach : 'Western') as Practice['approach'],
          format: (['Audio','Video','Audio/Video'].includes(p.format) ? p.format : 'Audio') as Practice['format'],
          instructor: 'Guide',
          image: p.thumbnailUrl || '/placeholder-practice.jpg',
          hasDownload: !!p.audioUrl,
          tags: typeof p.tags === 'string' ? p.tags.split(',').map((t:string)=>t.trim()).filter((t:string)=>t.length>0) : [],
          audioUrl: p.audioUrl || undefined,
          videoUrl: p.videoUrl || undefined,
          youtubeUrl: p.youtubeUrl || undefined
        }));
        setPractices(mapped);
      } catch(err){
        const message = err instanceof Error ? err.message : 'Error loading practices';
        console.error(err);
        setError(message);
      } finally { setLoading(false); }
    };
    load();
  }, []);

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

  const formats = [
    { id: 'all', label: 'All', icon: Filter },
    { id: 'Audio', label: 'Audio', icon: Music },
    { id: 'Video', label: 'Video', icon: VideoIcon }
  ];

  const approaches = [
    { id: 'all', label: 'All Approaches', icon: Filter },
    { id: 'Western', label: 'Western', icon: Heart },
    { id: 'Eastern', label: 'Eastern', icon: Waves },
    { id: 'Hybrid', label: 'Hybrid', icon: Users }
  ];

  const difficulties = [
    { id: 'all', label: 'All Levels', icon: Layers },
    { id: 'Beginner', label: 'Beginner', icon: Layers },
    { id: 'Moderate', label: 'Moderate', icon: Layers },
    { id: 'Advanced', label: 'Advanced', icon: Layers }
  ];

  const filteredPractices = practices.filter(practice => {
    const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(practice.type);
    const matchesDuration = selectedDuration === 'all' || 
      (selectedDuration === 'short' && practice.duration <= 10) ||
      (selectedDuration === 'medium' && practice.duration > 10 && practice.duration <= 20) ||
      (selectedDuration === 'long' && practice.duration > 20);
    const matchesFormat = selectedFormats.length === 0 || selectedFormats.includes(practice.format) || (practice.format === 'Audio/Video' && (selectedFormats.includes('Audio') || selectedFormats.includes('Video')));
    const matchesApproach = selectedApproaches.length === 0 || selectedApproaches.includes(practice.approach);
    const matchesDifficulty = selectedDifficulties.length === 0 || selectedDifficulties.includes(practice.difficulty);
    const matchesSearch = searchQuery.trim() === '' || 
      practice.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      practice.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      practice.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return matchesCategory && matchesDuration && matchesFormat && matchesApproach && matchesDifficulty && matchesSearch;
  });

  // Sorting (currently fixed to 'recommended' - future: add sort UI)
  const sortedPractices = [...filteredPractices].sort((a, b) => {
    const sortBy: 'recommended' | 'popular' | 'duration' | 'newest' = 'recommended' as 'recommended' | 'popular' | 'duration' | 'newest'; // Default sort mode
    switch (sortBy) {
      case 'popular':
        // Sort by a popularity score (could be based on ratings, completions, etc.)
        return 0; // Placeholder - implement with real data
      case 'duration':
        return a.duration - b.duration;
      case 'newest':
        return 0; // Placeholder - would need a createdAt field
      case 'recommended':
      default:
        return 0; // Default order
    }
  });

  // Active filter count
  const activeFilterCount = 
    selectedCategories.length + 
    (selectedDuration !== 'all' ? 1 : 0) +
    selectedFormats.length +
    selectedApproaches.length +
    selectedDifficulties.length;

  const hasActiveFilters = activeFilterCount > 0 || searchQuery.trim() !== '';

  // Clear all filters
  const clearAllFilters = () => {
    setSelectedCategories([]);
    setSelectedDuration('all');
    setSelectedFormats([]);
    setSelectedApproaches([]);
    setSelectedDifficulties([]);
    setSearchQuery('');
  };

  // Scroll handler for back to top button
  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 500);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Toggle helpers
  const toggleMulti = (value: string, list: string[], setList: React.Dispatch<React.SetStateAction<string[]>>) => {
    if (value === 'all') { setList([]); return; }
    setList(prev => prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]);
  };

  const startPractice = (practice: Practice) => {
    setCurrentSession({ practice, currentTime: 0, duration: practice.duration * 60, isPlaying: true, volume: 0.7, isCompleted: false });
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

  const completePractice = useCallback(() => {
    if (currentSession) {
      setCurrentSession(prev => prev ? {
        ...prev,
        isCompleted: true,
        isPlaying: false
      } : null);
      setShowPostPractice(true);
    }
  }, [currentSession]);

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

  // Real-time updates come from MediaPlayer callbacks now

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
      case 'Moderate':
      case 'Intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'Advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (currentSession) {
  const totalSeconds = currentSession.duration || (currentSession.practice.duration * 60);
  const progress = totalSeconds ? (currentSession.currentTime / totalSeconds) * 100 : 0;
  const { audioUrl, videoUrl, youtubeUrl, format } = currentSession.practice as Practice;

    // Fullscreen minimal layout for YouTube practices
    if (youtubeUrl) {
      return (
        <div className="fixed inset-0 bg-black text-white flex flex-col">
          <div className="absolute top-4 left-4 z-20">
            <Button variant="outline" size="sm" onClick={closePractice} className="bg-black/60 backdrop-blur border-white/20 text-white hover:bg-black/70">
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>
          </div>
          <div className="flex-1 flex flex-col">
            <div className="flex-1">
              <MediaPlayer
                youtubeUrl={youtubeUrl}
                autoPlay
                fillScreen
                className="rounded-none"
                onTimeUpdate={(c,d)=>{
                  setCurrentSession(prev=> prev ? { ...prev, currentTime: c, duration: d || prev.duration } : prev);
                }}
                onEnded={()=> completePractice()}
              />
            </div>
            <div className="p-4 space-y-4 bg-gradient-to-t from-black/80 via-black/60 to-black/20">
              <div>
                <h2 className="text-2xl font-semibold">{currentSession.practice.title}</h2>
                <p className="text-sm text-white/70">with {currentSession.practice.instructor}</p>
              </div>
              <div className="space-y-2">
                <Progress value={progress} className="h-1 bg-white/20" />
                <div className="flex justify-between text-xs text-white/70 font-mono">
                  <span>{formatTime(currentSession.currentTime)}</span>
                  <span>{formatTime(totalSeconds)}</span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={resetPractice}
                  disabled={currentSession.currentTime === 0}
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  onClick={togglePlayPause}
                  disabled={currentSession.isCompleted}
                  className="rounded-full w-14 h-14 bg-white text-black hover:bg-white/90"
                >
                  {currentSession.isPlaying ? (
                    <Pause className="h-6 w-6" />
                  ) : (
                    <Play className="h-6 w-6" />
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={completePractice}
                  disabled={currentSession.isCompleted}
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                >
                  <SkipForward className="h-4 w-4" />
                </Button>
                <div className="flex-1 flex items-center gap-2 ml-4">
                  {currentSession.volume === 0 ? (
                    <VolumeX className="h-4 w-4 text-white/70" />
                  ) : (
                    <Volume2 className="h-4 w-4 text-white/70" />
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
            </div>
          </div>

          {showPostPractice && (
            <div className="fixed inset-0 z-30 bg-black/70 backdrop-blur flex items-center justify-center p-4">
              <Card className="w-full max-w-md bg-white text-black">
                <CardHeader>
                  <CardTitle className="text-center flex items-center justify-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    Practice Complete!
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-center text-muted-foreground">
                    Great job completing &ldquo;{currentSession.practice.title}&rdquo;. How do you feel now?
                  </p>
                  <div className="space-y-3">
                    <div className="grid grid-cols-5 gap-2">
                      {[1,2,3,4,5].map(r => (
                        <Button
                          key={r}
                          variant={postPracticeRating === r ? 'default' : 'outline'}
                          className="aspect-square"
                          onClick={() => setPostPracticeRating(r)}
                        >
                          {r === 1 ? '😔' : r === 2 ? '😐' : r === 3 ? '🙂' : r === 4 ? '😊' : '🤗'}
                        </Button>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Button className="flex-1" onClick={() => { closePractice(); }}>
                        Complete
                      </Button>
                      <Button variant="outline" onClick={() => startPractice(currentSession.practice)}>
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

            {/* Media Player */}
            <div className="space-y-4">
              <MediaPlayer
                audioUrl={format === 'Audio' || format === 'Audio/Video' ? audioUrl : undefined}
                videoUrl={format === 'Video' || format === 'Audio/Video' ? videoUrl : undefined}
                youtubeUrl={youtubeUrl}
                autoPlay
                onTimeUpdate={(c,d)=>{
                  setCurrentSession(prev=> prev ? { ...prev, currentTime: c, duration: d || prev.duration } : prev);
                }}
                onEnded={()=> completePractice()}
              />
              {/* Progress (simulated for now) */}
              <div className="space-y-3">
                <Progress value={progress} className="h-2" />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>{formatTime(currentSession.currentTime)}</span>
                  <span>{formatTime(totalSeconds)}</span>
                </div>
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
                  Great job completing &ldquo;{currentSession.practice.title}&rdquo;. How do you feel now?
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
    <ResponsiveContainer>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary/10 to-accent/10">
          <div className={`max-w-6xl mx-auto ${device.isMobile ? 'p-4' : 'p-6'}`}>
            <div className={`flex items-center gap-4 ${device.isMobile ? 'mb-4' : 'mb-6'}`}>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => onNavigate('dashboard')}
                className="min-h-[44px] touch-manipulation"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </div>

            <div className={`space-y-2 ${device.isMobile ? 'mb-4' : 'mb-6'}`}>
              <h1 className={`font-bold ${device.isMobile ? 'text-2xl truncate' : 'text-3xl'}`}>
                Mindful Practices
              </h1>
              <p className={`text-muted-foreground ${device.isMobile ? 'text-sm truncate' : 'text-lg'}`}>
                Guided meditations, breathing exercises, and gentle yoga practices for your wellbeing
              </p>
            </div>

            {/* Search */}
            {device.isMobile ? (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search practices..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-10 h-11 text-base"
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 touch-manipulation"
                    aria-label="Clear search"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ) : (
              <div className="relative max-w-xl">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Search practices..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 h-12"
                />
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className={`max-w-6xl mx-auto ${device.isMobile ? 'py-4 px-4' : 'py-8 px-6'}`}>
        
        {/* Sticky Filter Toolbar */}
        <div className={`${device.isMobile ? 'sticky top-0 z-10 bg-background -mx-4 px-4 py-3 border-b mb-4' : 'mb-6'}`}>
          <div className="flex items-center justify-between gap-3">
            {/* Mobile: Filter button + result count */}
            {device.isMobile ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsFilterSheetOpen(true)}
                  className="flex items-center gap-2 min-h-[44px]"
                  aria-label={`Open filters, ${activeFilterCount} active`}
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  <span>Filters</span>
                  {activeFilterCount > 0 && (
                    <Badge variant="secondary" className="ml-1 px-1.5 min-w-[20px] h-5 flex items-center justify-center">
                      {activeFilterCount}
                    </Badge>
                  )}
                </Button>
                
                <div className="text-sm text-muted-foreground">
                  {sortedPractices.length} {sortedPractices.length === 1 ? 'practice' : 'practices'}
                </div>
                
                {/* View toggle */}
                <div className="flex gap-1 bg-muted rounded-md p-1">
                  <Button
                    variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className="h-8 w-8 p-0"
                    aria-label="List view"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className="h-8 w-8 p-0"
                    aria-label="Grid view"
                  >
                    <Grid3x3 className="h-4 w-4" />
                  </Button>
                </div>
              </>
            ) : (
              /* Desktop: Inline filter chips */
              <div className="flex flex-wrap items-center gap-3 w-full">
                {/* Practice Type */}
                <div className="flex flex-wrap gap-2">
                  {categories.slice(0, 4).map(category => {
                    const Icon = category.icon;
                    const active = selectedCategories.length === 0 ? category.id === 'all' : selectedCategories.includes(category.id);
                    return (
                      <Button
                        key={category.id}
                        variant={active ? 'default' : 'outline'}
                        size="sm"
                        aria-pressed={active}
                        onClick={() => toggleMulti(category.id, selectedCategories, setSelectedCategories)}
                        className={`flex items-center gap-1 transition-all ${active ? 'shadow-sm' : ''}`}
                      >
                        <Icon className="h-4 w-4" />
                        {category.label}
                      </Button>
                    );
                  })}
                </div>
                
                {/* More filters button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  className="flex items-center gap-2"
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  More
                  {activeFilterCount > 4 && (
                    <Badge variant="secondary" className="ml-1 px-1.5 min-w-[20px] h-5">
                      {activeFilterCount - 4}
                    </Badge>
                  )}
                </Button>
                
                <div className="ml-auto flex items-center gap-3">
                  <div className="text-sm text-muted-foreground">
                    {sortedPractices.length} {sortedPractices.length === 1 ? 'practice' : 'practices'}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Mobile Bottom Sheet for Filters */}
        <Sheet open={isFilterSheetOpen} onOpenChange={setIsFilterSheetOpen}>
          <SheetContent side="bottom" className="h-[85vh] flex flex-col p-0">
            <SheetHeader className="px-4 py-4 border-b">
              <div className="flex items-center justify-between">
                <SheetTitle>Filters</SheetTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsFilterSheetOpen(false)}
                  className="h-8 w-8 p-0"
                  aria-label="Close filters"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </SheetHeader>
            
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
              {/* Practice Type */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold">Practice Type</h3>
                <div className="flex flex-wrap gap-2">
                  {categories.map(category => {
                    const Icon = category.icon;
                    const active = selectedCategories.length === 0 ? category.id === 'all' : selectedCategories.includes(category.id);
                    return (
                      <Button
                        key={category.id}
                        variant={active ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => toggleMulti(category.id, selectedCategories, setSelectedCategories)}
                        className="min-h-[44px] flex items-center gap-2"
                      >
                        <Icon className="h-4 w-4" />
                        {category.label}
                      </Button>
                    );
                  })}
                </div>
              </div>
              
              {/* Format */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold">Format</h3>
                <div className="flex flex-wrap gap-2">
                  {formats.map(f => {
                    const Icon = f.icon;
                    const active = selectedFormats.length === 0 ? f.id === 'all' : selectedFormats.includes(f.id);
                    return (
                      <Button
                        key={f.id}
                        variant={active ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => toggleMulti(f.id, selectedFormats, setSelectedFormats)}
                        className="min-h-[44px] flex items-center gap-2"
                      >
                        <Icon className="h-4 w-4" />
                        {f.label}
                      </Button>
                    );
                  })}
                </div>
              </div>
              
              {/* Duration */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold">Duration</h3>
                <div className="flex flex-wrap gap-2">
                  {durations.map(d => {
                    const active = selectedDuration === d.id;
                    return (
                      <Button
                        key={d.id}
                        variant={active ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedDuration(d.id)}
                        className="min-h-[44px] flex items-center gap-2"
                      >
                        <Timer className="h-4 w-4" />
                        {d.label}
                      </Button>
                    );
                  })}
                </div>
              </div>
              
              {/* Advanced Filters */}
              <div className="space-y-3">
                <button
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  className="flex items-center justify-between w-full text-sm font-semibold"
                >
                  <span>Advanced Filters</span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${showAdvancedFilters ? 'rotate-180' : ''}`} />
                </button>
                
                {showAdvancedFilters && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                    {/* Approach */}
                    <div className="space-y-2">
                      <h4 className="text-xs font-medium text-muted-foreground">Approach</h4>
                      <div className="flex flex-wrap gap-2">
                        {approaches.map(a => {
                          const Icon = a.icon;
                          const active = selectedApproaches.length === 0 ? a.id === 'all' : selectedApproaches.includes(a.id);
                          return (
                            <Button
                              key={a.id}
                              variant={active ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => toggleMulti(a.id, selectedApproaches, setSelectedApproaches)}
                              className="min-h-[44px] flex items-center gap-2"
                            >
                              <Icon className="h-4 w-4" />
                              {a.label}
                            </Button>
                          );
                        })}
                      </div>
                    </div>
                    
                    {/* Difficulty */}
                    <div className="space-y-2">
                      <h4 className="text-xs font-medium text-muted-foreground">Difficulty</h4>
                      <div className="flex flex-wrap gap-2">
                        {difficulties.map(d => {
                          const Icon = d.icon;
                          const active = selectedDifficulties.length === 0 ? d.id === 'all' : selectedDifficulties.includes(d.id);
                          return (
                            <Button
                              key={d.id}
                              variant={active ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => toggleMulti(d.id, selectedDifficulties, setSelectedDifficulties)}
                              className="min-h-[44px] flex items-center gap-2"
                            >
                              <Icon className="h-4 w-4" />
                              {d.label}
                            </Button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <SheetFooter className="px-4 py-4 border-t flex-row gap-3">
              <Button
                variant="outline"
                onClick={clearAllFilters}
                className="flex-1 min-h-[44px]"
              >
                Clear All
              </Button>
              <Button
                onClick={() => setIsFilterSheetOpen(false)}
                className="flex-1 min-h-[44px]"
              >
                Apply Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
        
        {/* Desktop Advanced Filters */}
        {!device.isMobile && showAdvancedFilters && (
          <div className="mb-6 p-4 bg-muted/30 rounded-lg space-y-4 animate-in fade-in slide-in-from-top-2">
            <div className="flex flex-wrap gap-6">
              {/* Format */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase">Format</span>
                <div className="flex flex-wrap gap-2">
                  {formats.map(f => {
                    const Icon = f.icon;
                    const active = selectedFormats.length === 0 ? f.id === 'all' : selectedFormats.includes(f.id);
                    return (
                      <Button
                        key={f.id}
                        variant={active ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => toggleMulti(f.id, selectedFormats, setSelectedFormats)}
                        className="flex items-center gap-1"
                      >
                        <Icon className="h-4 w-4" />
                        {f.label}
                      </Button>
                    );
                  })}
                </div>
              </div>
              
              {/* Duration */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase">Duration</span>
                <div className="flex flex-wrap gap-2">
                  {durations.map(d => {
                    const active = selectedDuration === d.id;
                    return (
                      <Button
                        key={d.id}
                        variant={active ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedDuration(d.id)}
                        className="flex items-center gap-1"
                      >
                        <Timer className="h-4 w-4" />
                        {d.label}
                      </Button>
                    );
                  })}
                </div>
              </div>
              
              {/* Approach */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase">Approach</span>
                <div className="flex flex-wrap gap-2">
                  {approaches.map(a => {
                    const Icon = a.icon;
                    const active = selectedApproaches.length === 0 ? a.id === 'all' : selectedApproaches.includes(a.id);
                    return (
                      <Button
                        key={a.id}
                        variant={active ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => toggleMulti(a.id, selectedApproaches, setSelectedApproaches)}
                        className="flex items-center gap-1"
                      >
                        <Icon className="h-4 w-4" />
                        {a.label}
                      </Button>
                    );
                  })}
                </div>
              </div>
              
              {/* Difficulty */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase">Difficulty</span>
                <div className="flex flex-wrap gap-2">
                  {difficulties.map(d => {
                    const Icon = d.icon;
                    const active = selectedDifficulties.length === 0 ? d.id === 'all' : selectedDifficulties.includes(d.id);
                    return (
                      <Button
                        key={d.id}
                        variant={active ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => toggleMulti(d.id, selectedDifficulties, setSelectedDifficulties)}
                        className="flex items-center gap-1"
                      >
                        <Icon className="h-4 w-4" />
                        {d.label}
                      </Button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Active Filters Summary */}
        {hasActiveFilters && (
          <div className={`mb-4 ${device.isMobile ? 'space-y-2' : ''}`}>
            {device.isMobile ? (
              <>
                <button
                  onClick={() => setIsActiveFiltersExpanded(!isActiveFiltersExpanded)}
                  className="flex items-center gap-2 text-sm font-medium min-h-[44px] w-full justify-between"
                >
                  <span>{activeFilterCount} active {activeFilterCount === 1 ? 'filter' : 'filters'}</span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${isActiveFiltersExpanded ? 'rotate-180' : ''}`} />
                </button>
                
                {isActiveFiltersExpanded && (
                  <div className="flex flex-wrap gap-2 animate-in fade-in slide-in-from-top-2">
                    {selectedCategories.map(catId => {
                      const cat = categories.find(c => c.id === catId);
                      return cat ? (
                        <Badge key={catId} variant="secondary" className="gap-1">
                          {cat.label}
                          <button onClick={() => toggleMulti(catId, selectedCategories, setSelectedCategories)}>
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ) : null;
                    })}
                    {searchQuery && (
                      <Badge variant="secondary" className="gap-1">
                        Search: {searchQuery}
                        <button onClick={() => setSearchQuery('')}>
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearAllFilters}
                      className="h-6 px-2 text-xs"
                    >
                      Clear all
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                {selectedCategories.map(catId => {
                  const cat = categories.find(c => c.id === catId);
                  return cat ? (
                    <Badge key={catId} variant="secondary" className="gap-1">
                      {cat.label}
                      <button onClick={() => toggleMulti(catId, selectedCategories, setSelectedCategories)}>
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ) : null;
                })}
                {searchQuery && (
                  <Badge variant="secondary" className="gap-1">
                    Search: {searchQuery}
                    <button onClick={() => setSearchQuery('')}>
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllFilters}
                  className="h-6 px-2 text-xs"
                >
                  Clear all
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Practices List/Grid */}
        {loading && (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Card key={i} className={device.isMobile || viewMode === 'list' ? 'flex gap-3 p-3' : 'overflow-hidden'}>
                {device.isMobile || viewMode === 'list' ? (
                  <>
                    <div className="w-32 h-20 bg-muted rounded animate-pulse" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded w-3/4 animate-pulse" />
                      <div className="h-3 bg-muted rounded w-full animate-pulse" />
                      <div className="h-8 bg-muted rounded w-full animate-pulse" />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-full h-48 bg-muted animate-pulse" />
                    <div className="p-4 space-y-2">
                      <div className="h-4 bg-muted rounded w-3/4 animate-pulse" />
                      <div className="h-3 bg-muted rounded w-full animate-pulse" />
                    </div>
                  </>
                )}
              </Card>
            ))}
          </div>
        )}
        
        {error && !loading && (
          <Card className="p-6 text-center space-y-4">
            <p className="text-destructive">{error}</p>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Retry
            </Button>
          </Card>
        )}
        
        {!loading && !error && sortedPractices.length === 0 && (
          <Card className="p-8 text-center space-y-4">
            <h3 className="text-lg font-semibold">No practices found</h3>
            <p className="text-muted-foreground">
              {hasActiveFilters ? "Try adjusting your filters" : "No practices available"}
            </p>
            {hasActiveFilters && (
              <div className="space-y-3">
                <Button variant="outline" onClick={clearAllFilters}>
                  Clear All Filters
                </Button>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>Try:</p>
                  <ul className="list-disc list-inside">
                    <li>Selecting &lsquo;All&rsquo; in categories</li>
                    <li>Expanding duration range</li>
                    <li>Including more formats</li>
                  </ul>
                </div>
              </div>
            )}
          </Card>
        )}
        
        {/* Mobile List View */}
        {!loading && !error && (device.isMobile || viewMode === 'list') && sortedPractices.length > 0 && (
          <div className="space-y-3">
            {sortedPractices.map((practice) => (
              <Card key={practice.id} className="flex gap-3 p-3 hover:shadow-md transition-shadow">
                {/* Thumbnail */}
                <div className="relative flex-shrink-0 w-32 h-20 rounded overflow-hidden">
                  <ImageWithFallback
                    src={practice.image}
                    alt={practice.title}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Duration badge */}
                  <Badge className="absolute top-1 left-1 bg-black/70 text-white text-xs px-1.5 py-0.5">
                    {practice.duration}min
                  </Badge>
                  
                  {/* Lock/Save badge */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-1 right-1 bg-white/80 hover:bg-white h-6 w-6 p-0"
                  >
                    <Bookmark className="h-3 w-3" />
                  </Button>
                </div>
                
                {/* Content */}
                <div className="flex-1 min-w-0 flex flex-col">
                  {/* Title */}
                  <h3 className="font-semibold text-sm line-clamp-2 mb-1">
                    {practice.title}
                  </h3>
                  
                  {/* Description */}
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                    {practice.description}
                  </p>
                  
                  {/* Meta row */}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                    <div className="flex items-center gap-1">
                      {getTypeIcon(practice.type)}
                      <span className="capitalize">{practice.type}</span>
                    </div>
                    <span>•</span>
                    <span className={getDifficultyColor(practice.difficulty)}>{practice.difficulty}</span>
                  </div>
                  
                  {/* Tags */}
                  <div className="flex flex-wrap gap-1 mb-2">
                    {practice.tags.slice(0, 2).map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs px-1.5 py-0">
                        {tag}
                      </Badge>
                    ))}
                    {practice.tags.length > 2 && (
                      <Badge variant="secondary" className="text-xs px-1.5 py-0">
                        +{practice.tags.length - 2}
                      </Badge>
                    )}
                  </div>
                  
                  {/* CTA */}
                  <Button 
                    size="sm"
                    className="w-full mt-auto min-h-[44px]"
                    onClick={() => startPractice(practice)}
                  >
                    <Play className="h-4 w-4 mr-1" />
                    Start Practice
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
        
        {/* Desktop Grid View */}
        {!loading && !error && !device.isMobile && viewMode === 'grid' && sortedPractices.length > 0 && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedPractices.map((practice) => (
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
        )}
        
        {/* Back to Top Button */}
        {showBackToTop && (
          <Button
            size="icon"
            className="fixed bottom-20 right-4 z-20 rounded-full shadow-lg min-h-[48px] min-w-[48px] animate-in fade-in slide-in-from-bottom-4"
            onClick={scrollToTop}
            aria-label="Scroll to top"
          >
            <ArrowUp className="h-5 w-5" />
          </Button>
        )}
      </div>
    </div>
    </ResponsiveContainer>
  );
}
