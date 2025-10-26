import { 
  ArrowLeft,
  Search,
  Play,
  BookOpen,
  Headphones,
  Video,
  Clock,
  Star,
  Bookmark,
  Filter,
  Heart,
  Brain,
  Users,
  Activity,
  AlertCircle,
  Cloud,
  Layers,
  Share2,
  Check
} from 'lucide-react';
import React, { useState, useEffect } from 'react';

import { ImageWithFallback } from '../../common/ImageWithFallback';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { Card, CardContent } from '../../ui/card';
import { Input } from '../../ui/input';
import { MediaPlayerDialog } from './MediaPlayerDialog';
import type { LibraryItem } from './types';

interface UserLike { approach?: 'western' | 'eastern' | 'hybrid' | 'all'; }

interface ContentLibraryProps {
  onNavigate: (page: string) => void;
  user?: UserLike;
}

const youtubeThumbFromId = (id?: string | null) => (id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null);

const isProbablyUrl = (value?: string | null) => {
  if (!value) return false;
  return /^https?:\/\//i.test(value.trim());
};

const extractYouTubeId = (raw?: string | null) => {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;
  try {
    const url = new URL(trimmed);
    if (url.hostname.includes('youtu.be')) {
      return url.pathname.replace('/', '').split(/[?&#]/)[0] || null;
    }
    const vParam = url.searchParams.get('v');
    if (vParam) return vParam;
    if (url.pathname.startsWith('/embed/')) {
      return url.pathname.split('/')[2] || null;
    }
    if (url.pathname.startsWith('/shorts/')) {
      return url.pathname.split('/')[2] || null;
    }
  } catch (e) {
    return trimmed.length <= 20 ? trimmed : null;
  }
  return trimmed.length <= 20 ? trimmed : null;
};

const parseTags = (raw: unknown): string[] => {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.map(String).map((tag) => tag.trim()).filter(Boolean);
  if (typeof raw === 'string') {
    return raw
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);
  }
  return [];
};

const parseDuration = (raw: unknown): { label: string | null; seconds: number | null } => {
  if (!raw) return { label: null, seconds: null };
  const numeric = typeof raw === 'number' ? raw : Number.parseFloat(String(raw));
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return { label: null, seconds: null };
  }
  if (numeric >= 3600) {
    const hours = Math.floor(numeric / 3600);
    const mins = Math.round((numeric % 3600) / 60);
    return { label: `${hours}h ${mins}m`, seconds: Math.round(numeric) };
  }
  if (numeric > 60) {
    const mins = Math.round(numeric / 60);
    return { label: `${mins} min`, seconds: Math.round(numeric) };
  }
  return { label: `${Math.round(numeric)} min`, seconds: Math.round(numeric * 60) };
};

export function ContentLibrary({ onNavigate, user }: ContentLibraryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  // Multi-select filters
  const [selectedApproach, setSelectedApproach] = useState<'all' | 'western' | 'eastern' | 'hybrid'>(user?.approach || 'all');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]); // empty => all
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]); // empty => all
  const [animateKey, setAnimateKey] = useState(0);

  const [contentItems, setContentItems] = useState<LibraryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeItem, setActiveItem] = useState<LibraryItem | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [practicesResp, contentResp] = await Promise.all([
          fetch('/api/practices'),
          fetch('/api/public/content')
        ]);

        type RawPractice = {
          id: string;
          title: string;
          description?: string | null;
          duration?: number | string | null;
          difficulty?: string | null;
          approach?: string | null;
          tags?: string | string[] | null;
          thumbnailUrl?: string | null;
          format?: string | null;
          audioUrl?: string | null;
          videoUrl?: string | null;
          youtubeUrl?: string | null;
        };

        type RawContent = {
          id: string;
          title: string;
          type: 'video' | 'audio' | 'article' | 'playlist';
          category?: string | null;
          approach?: string | null;
          description?: string | null;
          youtubeUrl?: string | null;
          thumbnailUrl?: string | null;
          difficulty?: string | null;
          duration?: string | number | null;
          tags?: string | string[] | null;
          content?: string | null;
        };

        let practices: RawPractice[] = [];
        if (practicesResp.ok) {
          const json = await practicesResp.json();
          if (json.success && Array.isArray(json.data)) {
            practices = json.data;
          }
        }

        let publicContent: RawContent[] = [];
        if (contentResp.ok) {
          const json = await contentResp.json();
          if (json.success && Array.isArray(json.data)) {
            publicContent = json.data;
          }
        }

        const mappedPractices: LibraryItem[] = practices.map((p) => {
          const duration = parseDuration(p.duration);
          const approach = p.approach ? p.approach.toLowerCase() : 'all';
          const normalizedApproach = ['western', 'eastern', 'hybrid', 'all'].includes(approach) ? (approach as LibraryItem['approach']) : 'all';
          const youtubeId = extractYouTubeId(p.youtubeUrl);
          const format = (p.format || '').toLowerCase();
          const isVideoFormat = format === 'video';
          const audioSrc = isProbablyUrl(p.audioUrl) ? p.audioUrl!.trim() : undefined;
          const videoSrc = isProbablyUrl(p.videoUrl) ? p.videoUrl!.trim() : undefined;
          const thumbnail = p.thumbnailUrl || youtubeThumbFromId(youtubeId) || 'https://images.unsplash.com/photo-1526404085026-8a631c921f0c?auto=format&fit=crop&w=1200&q=60';

          return {
            id: p.id,
            title: p.title,
            description: p.description || '',
            category: 'Practice',
            approach: normalizedApproach,
            difficulty: (p.difficulty && ['Beginner', 'Intermediate', 'Advanced'].includes(p.difficulty)) ? (p.difficulty as LibraryItem['difficulty']) : 'Beginner',
            durationLabel: duration.label ?? (p.duration ? `${p.duration} min` : null),
            durationSeconds: duration.seconds,
            tags: parseTags(p.tags),
            thumbnail,
            rating: 5,
            author: 'Guided Practice Coach',
            displayType: isVideoFormat ? 'video' : 'audio',
            media: isVideoFormat
              ? {
                  kind: 'video',
                  src: videoSrc,
                  youtubeId,
                  poster: thumbnail
                }
              : audioSrc
                ? {
                    kind: 'audio',
                    src: audioSrc,
                    poster: thumbnail
                  }
                : null,
            body: null,
            source: 'practice',
            raw: p
          } satisfies LibraryItem;
        });

        const mappedContent: LibraryItem[] = publicContent.map((item) => {
          const youtubeId = extractYouTubeId(item.youtubeUrl);
          const duration = parseDuration(item.duration);
          const thumbnail = item.thumbnailUrl || youtubeThumbFromId(youtubeId) || 'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?auto=format&fit=crop&w=1200&q=60';
          const mediaSource = isProbablyUrl(item.content) ? item.content!.trim() : undefined;
          const approach = item.approach ? item.approach.toLowerCase() : 'all';
          const normalizedApproach = ['western', 'eastern', 'hybrid', 'all'].includes(approach) ? (approach as LibraryItem['approach']) : 'all';

          let media: LibraryItem['media'] = null;
          if (item.type === 'video') {
            media = {
              kind: 'video',
              src: mediaSource,
              youtubeId,
              poster: thumbnail
            };
          } else if (item.type === 'audio' && mediaSource) {
            media = {
              kind: 'audio',
              src: mediaSource,
              poster: thumbnail
            };
          }

          return {
            id: item.id,
            title: item.title,
            description: item.description || '',
            category: item.category || 'Content',
            approach: normalizedApproach,
            difficulty: item.difficulty as LibraryItem['difficulty'],
            durationLabel: duration.label,
            durationSeconds: duration.seconds,
            tags: parseTags(item.tags),
            thumbnail,
            rating: 4.6,
            author: 'Wellbeing Studio',
            displayType: item.type,
            media,
            body: item.type === 'article' ? item.content || '' : null,
            source: 'content',
            raw: item
          } satisfies LibraryItem;
        });

        const combined = [...mappedContent, ...mappedPractices];
        setContentItems(combined);
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Failed to load content';
        setError(msg);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const categories = [
    { id: 'all', label: 'All', icon: Heart },
    { id: 'Mindfulness', label: 'Mindfulness', icon: Heart },
    { id: 'Anxiety', label: 'Anxiety', icon: AlertCircle },
    { id: 'Stress Management', label: 'Stress Management', icon: Activity },
    { id: 'Relaxation', label: 'Relaxation', icon: Cloud },
    { id: 'Emotional Intelligence', label: 'Emotional Intelligence', icon: Brain },
    { id: 'Series', label: 'Series', icon: Layers },
    { id: 'Practice', label: 'Guided Practice', icon: Headphones }
  ];

  const types = [
    { id: 'all', label: 'All', icon: Filter },
    { id: 'video', label: 'Video', icon: Video },
    { id: 'audio', label: 'Audio', icon: Headphones },
    { id: 'article', label: 'Article', icon: BookOpen },
    { id: 'playlist', label: 'Playlist', icon: Play }
  ];

  const filteredContent = contentItems.filter((item) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      item.title.toLowerCase().includes(q) ||
      (item.description || '').toLowerCase().includes(q) ||
      item.tags.some((tag) => tag.toLowerCase().includes(q));
    const matchesCategory =
      selectedCategories.length === 0 ||
      selectedCategories.includes(item.category || 'Content');
    const matchesType =
      selectedTypes.length === 0 || selectedTypes.includes(item.displayType);
    const matchesApproach =
      selectedApproach === 'all' ||
      (item.approach && item.approach === selectedApproach) ||
      item.approach === 'all';
    return matchesSearch && matchesCategory && matchesType && matchesApproach;
  });

  // Toggle helpers
  const toggleMulti = (value: string, list: string[], setList: React.Dispatch<React.SetStateAction<string[]>>) => {
    if (value === 'all') { setList([]); return; }
    setList(prev => prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]);
  };

  useEffect(() => { setAnimateKey(k => k + 1); }, [searchQuery, selectedCategories, selectedTypes, selectedApproach]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return <Video className="h-4 w-4" />;
      case 'audio': return <Headphones className="h-4 w-4" />;
      case 'article': return <BookOpen className="h-4 w-4" />;
      case 'playlist': return <Play className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'video': return 'bg-red-100 text-red-800';
      case 'audio': return 'bg-green-100 text-green-800';
      case 'article': return 'bg-blue-100 text-blue-800';
      case 'playlist': return 'bg-purple-100 text-purple-800';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return 'bg-green-100 text-green-800';
      case 'Intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'Advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-slate-100 text-slate-700';
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
            <h1 className="text-3xl">Content Library</h1>
            <p className="text-muted-foreground text-lg">
              Curated videos, guided meditations, articles, and educational content for your wellbeing journey
            </p>

            {/* Approach preference message */}
            {user?.approach && user.approach !== selectedApproach && selectedApproach !== 'all' && (
              <div className="bg-accent/15 border border-accent/50 rounded-lg p-4 flex items-start gap-3">
                <span className="text-lg" role="img" aria-label="personalization">🎯</span>
                <p className="text-sm">
                  💡 <strong>Tip:</strong> You&apos;re currently viewing{' '}
                  <span className="capitalize font-medium">{selectedApproach}</span> content.{' '}
                  Your preferred approach is{' '}
                  <span className="capitalize font-medium">{user.approach}</span>.{' '}
                  <button 
                    onClick={() => setSelectedApproach(user.approach!)}
                    className="text-primary hover:underline font-semibold"
                  >
                    Switch to your preferred content
                  </button>
                </p>
              </div>
            )}

            {user?.approach && selectedApproach === user.approach && selectedApproach !== 'all' && (
              <div className="bg-primary/10 border border-primary/40 rounded-lg p-4 flex items-start gap-3">
                <span className="text-lg" role="img" aria-label="personalized">✨</span>
                <p className="text-sm">
                  ✨ Showing content tailored to your{' '}
                  <span className="capitalize font-medium">{user.approach}</span> approach preference.{' '}
                  <button 
                    onClick={() => setSelectedApproach('all')}
                    className="text-primary hover:underline font-semibold"
                  >
                    View all content
                  </button>
                </p>
              </div>
            )}

            {/* Search */}
            <div className="relative max-w-xl">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search videos, articles, playlists..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        {/* Filters */}
        <div className="space-y-6 mb-10">
          <div className="flex items-center gap-2 border-b pb-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-semibold">Filters</span>
          </div>
          <div className="space-y-5 animate-in fade-in slide-in-from-top-2">
            {/* Category Filter */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-semibold tracking-wide text-primary/80 uppercase">Category</span>
              <div className="flex flex-wrap gap-2">
                {categories.map(cat => {
                  const Icon = cat.icon;
                  const active = selectedCategories.length === 0 ? cat.id === 'all' : selectedCategories.includes(cat.id);
                  return (
                    <Button
                      key={cat.id}
                      variant={active ? 'default' : 'outline'}
                      size="sm"
                      aria-pressed={active}
                      onClick={() => toggleMulti(cat.id, selectedCategories, setSelectedCategories)}
                      className={`flex items-center gap-1 transition-all ${active ? 'shadow-sm font-semibold' : ''}`}
                    >
                      <Icon className="h-4 w-4" />
                      {cat.label}
                      {active && cat.id !== 'all' && <Check className="h-3 w-3" />}
                    </Button>
                  );
                })}
              </div>
            </div>
            {/* Type Filter */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-semibold tracking-wide text-primary/80 uppercase">Content Type</span>
              <div className="flex flex-wrap gap-2">
                {types.map(t => {
                  const Icon = t.icon;
                  const active = selectedTypes.length === 0 ? t.id === 'all' : selectedTypes.includes(t.id);
                  return (
                    <Button
                      key={t.id}
                      variant={active ? 'default' : 'outline'}
                      size="sm"
                      aria-pressed={active}
                      onClick={() => toggleMulti(t.id, selectedTypes, setSelectedTypes)}
                      className={`flex items-center gap-1 transition-all ${active ? 'shadow-sm font-semibold' : ''}`}
                    >
                      <Icon className="h-4 w-4" />
                      {t.label}
                      {active && t.id !== 'all' && <Check className="h-3 w-3" />}
                    </Button>
                  );
                })}
              </div>
            </div>
            {/* Approach Filter */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-semibold tracking-wide text-primary/80 uppercase">Approach</span>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={selectedApproach === 'all' ? 'default' : 'outline'}
                  size="sm"
                  aria-pressed={selectedApproach === 'all'}
                  onClick={() => setSelectedApproach('all')}
                >All Approaches</Button>
                <Button
                  variant={selectedApproach === 'western' ? 'default' : 'outline'}
                  size="sm"
                  aria-pressed={selectedApproach === 'western'}
                  onClick={() => setSelectedApproach('western')}
                  className="flex items-center gap-1"
                ><Brain className="h-3 w-3" /> Western</Button>
                <Button
                  variant={selectedApproach === 'eastern' ? 'default' : 'outline'}
                  size="sm"
                  aria-pressed={selectedApproach === 'eastern'}
                  onClick={() => setSelectedApproach('eastern')}
                  className="flex items-center gap-1"
                ><Heart className="h-3 w-3" /> Eastern</Button>
                <Button
                  variant={selectedApproach === 'hybrid' ? 'default' : 'outline'}
                  size="sm"
                  aria-pressed={selectedApproach === 'hybrid'}
                  onClick={() => setSelectedApproach('hybrid')}
                  className="flex items-center gap-1"
                ><Users className="h-3 w-3" /> Hybrid</Button>
              </div>
            </div>
          </div>
        </div>

        {/* Content Grid */}
        {loading && (
          <div className="py-12 text-center text-muted-foreground">Loading library...</div>
        )}
        {error && !loading && (
          <div className="py-12 text-center text-destructive">{error}</div>
        )}
        <div key={animateKey} className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 transition-all animate-in fade-in">
          {filteredContent.map(item => {
            const primaryActionLabel = item.displayType === 'article' ? 'Read' : 'Play';
            const primaryActionIcon = item.displayType === 'article' ? <BookOpen className="h-4 w-4" /> : <Play className="h-4 w-4" />;

            return (
              <Card
                key={item.id}
                role="button"
                tabIndex={0}
                onClick={() => setActiveItem(item)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    setActiveItem(item);
                  }
                }}
                className="overflow-hidden group hover:shadow-lg transition-all duration-300 hover:scale-[1.01] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
              <div className="relative">
                <ImageWithFallback
                  src={item.thumbnail || 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1200&q=60'}
                  alt={item.title}
                  className="w-full h-48 object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                {/* Quick Actions */}
                <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button size="icon" variant="secondary" className="h-8 w-8 rounded-full" aria-label="Bookmark" onClick={(event) => event.stopPropagation()}><Bookmark className="h-4 w-4" /></Button>
                  <Button size="icon" variant="secondary" className="h-8 w-8 rounded-full" aria-label="Share" onClick={(event) => event.stopPropagation()}><Share2 className="h-4 w-4" /></Button>
                  <Button
                    size="icon"
                    className="h-8 w-8 rounded-full"
                    aria-label={primaryActionLabel}
                    onClick={(event) => {
                      event.stopPropagation();
                      setActiveItem(item);
                    }}
                  >
                    {primaryActionIcon}
                  </Button>
                </div>
                {/* Type badge */}
                <Badge className={`absolute top-2 left-2 ${getTypeColor(item.displayType)} shadow`}>
                  <div className="flex items-center gap-1">
                    {getTypeIcon(item.displayType)}
                    <span className="capitalize">{item.displayType}</span>
                  </div>
                </Badge>
                {item.approach !== 'all' && (
                  <Badge className="absolute top-12 left-2 bg-white/90 text-gray-700 text-xs shadow">
                    {item.approach === 'western' && '🧠 Western'}
                    {item.approach === 'eastern' && '🕉️ Eastern'}
                    {item.approach === 'hybrid' && '🌸 Hybrid'}
                  </Badge>
                )}
              </div>
              <CardContent className="p-4 space-y-3">
                <div className="space-y-2">
                  <h3 className="font-semibold leading-tight line-clamp-2 group-hover:text-primary transition-colors">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">{item.description}</p>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>{item.durationLabel || '—'}</span>
                  </div>
                  <div className="flex items-center gap-0.5" aria-label={`Rating ${item.rating} of 5`}>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`h-3 w-3 ${i < (item.rating || 0) ? 'fill-current text-yellow-500' : 'text-muted-foreground'} transition-colors`} />
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  {item.difficulty && (
                    <Badge variant="outline" className={getDifficultyColor(item.difficulty)}>
                      {item.difficulty}
                    </Badge>
                  )}
                  <span className="text-xs text-muted-foreground">{item.author || 'Wellbeing Coach'}</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {item.tags.slice(0,3).map(tag => <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>)}
                </div>
              </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredContent.length === 0 && (
          <div className="text-center py-20 space-y-6 animate-in fade-in">
            <div className="mx-auto w-40 h-40 rounded-full bg-gradient-to-br from-primary/15 to-accent/15 flex items-center justify-center">
              <BookOpen className="h-16 w-16 text-primary/60" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-semibold">No content found</h3>
              <p className="text-muted-foreground max-w-md mx-auto">Adjust your search or clear filters to rediscover videos, articles, and playlists matched to your journey.</p>
            </div>
            <Button onClick={() => { setSearchQuery(''); setSelectedCategories([]); setSelectedTypes([]); setSelectedApproach('all'); }}>Clear Filters</Button>
          </div>
        )}

        {/* Featured Collections */}
        <div className="mt-16 space-y-8">
          <h2 className="text-3xl font-semibold tracking-tight">Featured Collections</h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="p-6 bg-gradient-to-br from-primary/10 to-accent/10 hover:shadow-md transition-all hover:scale-[1.015]">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Heart className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Anxiety Relief</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Immediate techniques and long-term strategies for managing anxiety
                </p>
                <Button size="sm" className="shadow-sm">
                  Explore Collection
                </Button>
              </div>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 hover:shadow-md transition-all hover:scale-[1.015]">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-green-600" />
                  <h3 className="font-semibold">Better Sleep</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Guided practices and education for improving sleep quality
                </p>
                <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white">
                  Explore Collection
                </Button>
              </div>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 hover:shadow-md transition-all hover:scale-[1.015]">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-purple-600" />
                  <h3 className="font-semibold">Relationships</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Building healthy connections and communication skills
                </p>
                <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white">
                  Explore Collection
                </Button>
              </div>
            </Card>
          </div>
        </div>
        <MediaPlayerDialog
          item={activeItem}
          open={Boolean(activeItem)}
          onOpenChange={(open) => {
            if (!open) {
              setActiveItem(null);
            }
          }}
        />
      </div>
    </div>
  );
}
