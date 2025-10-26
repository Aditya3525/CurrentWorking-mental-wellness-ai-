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
  Check,
  Timer,
  Layers,
  Filter,
  ChevronDown,
  ChevronUp,
  Music,
  Video as VideoIcon,
  Star
} from 'lucide-react';
import React, { useState, useEffect, useCallback } from 'react';

import { ImageWithFallback } from '../../common/ImageWithFallback';
import { MediaPlayer } from '../../common/MediaPlayer';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Progress } from '../../ui/progress';
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
    
    return matchesCategory && matchesDuration && matchesFormat && matchesApproach && matchesDifficulty;
  });

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
        <div className="space-y-6 mb-10">
          {/* Practice Type & Format */}
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-start gap-6">
                <div className="flex flex-col gap-2 bg-muted/30 rounded-lg p-3">
                  <span className="text-xs font-semibold tracking-wide text-primary/90 uppercase">Practice Type</span>
                  <div className="flex flex-wrap gap-2">
                    {categories.map(category => {
                      const Icon = category.icon;
                      const active = selectedCategories.length === 0 ? category.id === 'all' : selectedCategories.includes(category.id);
                      return (
                        <Button
                          key={category.id}
                          variant={active ? 'default' : 'outline'}
                          size="sm"
                          aria-pressed={active}
                          onClick={() => toggleMulti(category.id, selectedCategories, setSelectedCategories)}
                          className={`flex items-center gap-1 transition-all ${active ? 'shadow-sm font-semibold' : ''}`}
                        >
                          <Icon className="h-4 w-4" />
                          {category.label}
                          {active && category.id !== 'all' && <Check className="h-3 w-3 ml-0.5" />}
                        </Button>
                      );
                    })}
                  </div>
                </div>
                <div className="flex flex-col gap-2 bg-muted/30 rounded-lg p-3">
                  <span className="text-xs font-semibold tracking-wide text-primary/90 uppercase">Format</span>
                  <div className="flex flex-wrap gap-2">
                    {formats.map(f => {
                      const Icon = f.icon;
                      const active = selectedFormats.length === 0 ? f.id === 'all' : selectedFormats.includes(f.id);
                      return (
                        <Button
                          key={f.id}
                          variant={active ? 'default' : 'outline'}
                          size="sm"
                          aria-pressed={active}
                          onClick={() => toggleMulti(f.id, selectedFormats, setSelectedFormats)}
                          className={`flex items-center gap-1 transition-all ${active ? 'shadow-sm font-semibold' : ''}`}
                        >
                          <Icon className="h-4 w-4" />
                          {f.label}
                          {active && f.id !== 'all' && <Check className="h-3 w-3 ml-0.5" />}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

          {/* Duration */}
          <div className="flex flex-wrap gap-6 items-start">
            <div className="flex flex-col gap-2 bg-muted/30 rounded-lg p-3">
              <span className="text-xs font-semibold tracking-wide text-primary/90 uppercase">Duration</span>
              <div className="flex flex-wrap gap-2">
                {durations.map(d => {
                  const Icon = Timer;
                  const active = selectedDuration === d.id;
                  return (
                    <Button
                      key={d.id}
                      variant={active ? 'default' : 'outline'}
                      size="sm"
                      aria-pressed={active}
                      onClick={() => setSelectedDuration(d.id)}
                      className={`flex items-center gap-1 transition-all ${active ? 'shadow-sm font-semibold' : ''}`}
                    >
                      <Icon className="h-4 w-4" />
                      {d.label}
                      {active && d.id !== 'all' && <Check className="h-3 w-3 ml-0.5" />}
                    </Button>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAdvancedFilters(s => !s)}
                className="flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                {showAdvancedFilters ? 'Hide Advanced Filters' : 'Show Advanced Filters'}
                {showAdvancedFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {showAdvancedFilters && (
            <div className="flex flex-wrap gap-6 animate-in fade-in slide-in-from-top-2">
              <div className="flex flex-col gap-2 bg-muted/30 rounded-lg p-3">
                <span className="text-xs font-semibold tracking-wide text-primary/90 uppercase">Approach</span>
                <div className="flex flex-wrap gap-2">
                  {approaches.map(a => {
                    const Icon = a.icon;
                    const active = selectedApproaches.length === 0 ? a.id === 'all' : selectedApproaches.includes(a.id);
                    return (
                      <Button
                        key={a.id}
                        variant={active ? 'default' : 'outline'}
                        size="sm"
                        aria-pressed={active}
                        onClick={() => toggleMulti(a.id, selectedApproaches, setSelectedApproaches)}
                        className={`flex items-center gap-1 transition-all ${active ? 'shadow-sm font-semibold' : ''}`}
                      >
                        <Icon className="h-4 w-4" />
                        {a.label}
                        {active && a.id !== 'all' && <Check className="h-3 w-3 ml-0.5" />}
                      </Button>
                    );
                  })}
                </div>
              </div>
              <div className="flex flex-col gap-2 bg-muted/30 rounded-lg p-3">
                <span className="text-xs font-semibold tracking-wide text-primary/90 uppercase">Difficulty</span>
                <div className="flex flex-wrap gap-2">
                  {difficulties.map(d => {
                    const Icon = d.icon;
                    const active = selectedDifficulties.length === 0 ? d.id === 'all' : selectedDifficulties.includes(d.id);
                    return (
                      <Button
                        key={d.id}
                        variant={active ? 'default' : 'outline'}
                        size="sm"
                        aria-pressed={active}
                        onClick={() => toggleMulti(d.id, selectedDifficulties, setSelectedDifficulties)}
                        className={`flex items-center gap-1 transition-all ${active ? 'shadow-sm font-semibold' : ''}`}
                      >
                        <Icon className="h-4 w-4" />
                        {d.label}
                        {active && d.id !== 'all' && <Check className="h-3 w-3 ml-0.5" />}
                      </Button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Practices Grid */}
        {loading && (
          <div className="py-12 text-center text-muted-foreground">Loading practices...</div>
        )}
        {error && !loading && (
          <div className="py-12 text-center text-destructive">{error}</div>
        )}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {!loading && !error && filteredPractices.map((practice) => (
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
        {!loading && !error && filteredPractices.length === 0 && (
          <div className="text-center py-16 space-y-6 animate-in fade-in">
            <div className="mx-auto w-40 h-40 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
              <Heart className="h-16 w-16 text-primary/60" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-semibold">No practices match your filters</h3>
              <p className="text-muted-foreground max-w-md mx-auto">Refine or clear filters to explore more mindfulness, breathing, yoga, and sleep practices curated for you.</p>
            </div>
            <div className="flex gap-3 justify-center">
              <Button
                onClick={() => {
                  setSelectedCategories([]);
                  setSelectedDuration('all');
                  setSelectedFormats([]);
                  setSelectedApproaches([]);
                  setSelectedDifficulties([]);
                }}
              >
                Clear All Filters
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowAdvancedFilters(s => !s)}
              >
                {showAdvancedFilters ? 'Hide Advanced' : 'Adjust Filters'}
              </Button>
            </div>
            {/* Suggestions */}
            {practices.length > 0 && (
              <div className="max-w-3xl mx-auto text-left">
                <h4 className="text-sm font-semibold mb-3 flex items-center gap-2"><Star className="h-4 w-4 text-amber-500" /> Popular Practices</h4>
                <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {practices.slice(0,3).map(p => (
                    <Button
                      key={p.id}
                      variant="outline"
                      className="justify-start text-left flex-col items-start h-auto p-3 gap-1"
                      onClick={() => startPractice(p)}
                    >
                      <span className="text-sm font-medium line-clamp-1">{p.title}</span>
                      <span className="text-xs text-muted-foreground capitalize">{p.type} • {p.duration}m</span>
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
