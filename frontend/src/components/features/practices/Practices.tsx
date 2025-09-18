import React, { useState, useEffect, useCallback } from 'react';
import { 
  ArrowLeft,
  Search,
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
  Filter,
  Star,
  Eye,
  Sparkles,
  TrendingUp,
  Brain,
  List,
  Timer,
  Target,
  Zap
} from 'lucide-react';

import { practiceService, PracticeItem, PracticeFilters, PracticeSeries } from '../../../services/practiceService';
import { useAuth } from '../../../contexts/AuthContext';
import { ImageWithFallback } from '../../common/ImageWithFallback';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { Card, CardContent, CardHeader } from '../../ui/card';
import { Input } from '../../ui/input';
import { Progress } from '../../ui/progress';
import { Slider } from '../../ui/slider';

interface PracticesProps {
  onNavigate: (page: string) => void;
  user?: any;
}

interface PersonalizedSection {
  id: string;
  title: string;
  description: string;
  practices: PracticeItem[];
  icon: React.ReactNode;
}

interface PracticeSession {
  practice: PracticeItem;
  sessionId?: string;
  currentTime: number;
  isPlaying: boolean;
  volume: number;
  isCompleted: boolean;
  startedAt: Date;
}

export function Practices({ onNavigate, user }: PracticesProps) {
  // Core state
  const [practices, setPractices] = useState<PracticeItem[]>([]);
  const [series, setSeries] = useState<PracticeSeries[]>([]);
  const [personalizedSections, setPersonalizedSections] = useState<PersonalizedSection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Session state
  const [currentSession, setCurrentSession] = useState<PracticeSession | null>(null);
  const [showPostPractice, setShowPostPractice] = useState(false);
  const [postPracticeRating, setPostPracticeRating] = useState<number | null>(null);

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<PracticeItem[]>([]);
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const [filters, setFilters] = useState<PracticeFilters>({
    page: 1,
    limit: 12,
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
  const [showFilters, setShowFilters] = useState(false);
  const [categories, setCategories] = useState<Array<{ name: string; count: number }>>([]);
  const [types, setTypes] = useState<Array<{ name: string; count: number }>>([]);
  const [instructors, setInstructors] = useState<Array<{ name: string; count: number }>>([]);

  // Pagination
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  });

  const [activeTab, setActiveTab] = useState<'for-you' | 'all' | 'series' | 'bookmarks'>('for-you');

  const { user: authUser } = useAuth();

  // Practice type icons mapping
  const getPracticeIcon = (type: string) => {
    switch (type) {
      case 'meditation': return <Heart className="w-4 h-4" />;
      case 'breathing': return <Waves className="w-4 h-4" />;
      case 'yoga': return <Users className="w-4 h-4" />;
      case 'sleep': return <Clock className="w-4 h-4" />;
      case 'movement': return <Zap className="w-4 h-4" />;
      case 'visualization': return <Target className="w-4 h-4" />;
      default: return <Heart className="w-4 h-4" />;
    }
  };

  // Load initial data
  useEffect(() => {
    loadInitialData();
    loadCategories();
  }, []);

  // Load practices when filters change
  useEffect(() => {
    loadPractices();
  }, [filters]);

  const loadInitialData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [practicesResponse, seriesResponse, recommendationsResponse] = await Promise.all([
        practiceService.getPractices({
          page: 1,
          limit: 12,
          sortBy: 'createdAt',
          sortOrder: 'desc'
        }),
        practiceService.getSeries({ limit: 6 }),
        authUser ? practiceService.getRecommendations() : Promise.resolve({ data: { recommendations: [] } })
      ]);

      setPractices(practicesResponse.data.items);
      setPagination(practicesResponse.data.pagination);
      setSeries(seriesResponse.data.items);
      
      if (authUser) {
        await createPersonalizedSections(
          practicesResponse.data.items, 
          recommendationsResponse.data.recommendations
        );
      }
    } catch (error) {
      console.error('Error loading initial data:', error);
      setError('Failed to load practices');
    } finally {
      setIsLoading(false);
    }
  }, [authUser]);

  const loadPractices = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await practiceService.getPractices(filters);
      setPractices(response.data.items);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Error loading practices:', error);
      setError('Failed to load practices');
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  const loadCategories = async () => {
    try {
      const response = await practiceService.getCategories();
      setCategories(response.data.categories);
      setTypes(response.data.types);
      setInstructors(response.data.instructors);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const createPersonalizedSections = async (allPractices: PracticeItem[], userRecommendations: PracticeItem[]) => {
    const sections: PersonalizedSection[] = [];

    // For You section (recommendations)
    if (userRecommendations.length > 0) {
      sections.push({
        id: 'for-you',
        title: 'Recommended for You',
        description: 'Practices tailored to your journey and preferences',
        practices: userRecommendations.slice(0, 6),
        icon: <Sparkles className="w-5 h-5" />
      });
    }

    // Featured practices
    const featured = allPractices.filter(practice => practice.isFeatured).slice(0, 6);
    if (featured.length > 0) {
      sections.push({
        id: 'featured',
        title: 'Featured Practices',
        description: 'Handpicked by our wellness experts',
        practices: featured,
        icon: <Star className="w-5 h-5" />
      });
    }

    // Popular practices
    const popular = allPractices.filter(practice => practice.completionCount > 50).slice(0, 6);
    if (popular.length > 0) {
      sections.push({
        id: 'popular',
        title: 'Most Popular',
        description: 'Loved by our community',
        practices: popular,
        icon: <TrendingUp className="w-5 h-5" />
      });
    }

    // Quick practices (under 10 minutes)
    const quick = allPractices.filter(practice => practice.duration <= 10).slice(0, 6);
    if (quick.length > 0) {
      sections.push({
        id: 'quick',
        title: 'Quick Sessions',
        description: 'Perfect for busy schedules',
        practices: quick,
        icon: <Timer className="w-5 h-5" />
      });
    }

    // Approach-based practices
    if (authUser?.approach && authUser.approach !== 'hybrid') {
      const approachPractices = allPractices.filter(practice => 
        practice.approach === authUser.approach || practice.approach === 'hybrid'
      ).slice(0, 6);
      
      if (approachPractices.length > 0) {
        sections.push({
          id: 'approach',
          title: `${authUser.approach.charAt(0).toUpperCase() + authUser.approach.slice(1)} Practices`,
          description: `Aligned with your ${authUser.approach} wellness approach`,
          practices: approachPractices,
          icon: authUser.approach === 'western' ? <Brain className="w-5 h-5" /> : <Heart className="w-5 h-5" />
        });
      }
    }

    setPersonalizedSections(sections);
  };

  // Search functionality
  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setSearchSuggestions([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    try {
      const response = await practiceService.searchPractices(query, {
        category: filters.category,
        type: filters.type,
        difficulty: filters.difficulty
      });
      
      setSearchResults(response.data.results);
      setSearchSuggestions(response.data.suggestions);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  }, [filters]);

  // Debounced search
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      handleSearch(searchQuery);
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery, handleSearch]);

  // Filter handlers
  const updateFilters = (newFilters: Partial<PracticeFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters, page: 1 }));
  };

  const clearFilters = () => {
    setFilters({
      page: 1,
      limit: 12,
      sortBy: 'createdAt',
      sortOrder: 'desc'
    });
  };

  // Practice session handlers
  const startPractice = async (practice: PracticeItem) => {
    try {
      // Track view interaction
      await practiceService.trackInteraction(practice.id, 'view', {
        source: 'practice_library',
        timestamp: new Date().toISOString()
      });

      // Start session
      const sessionResponse = await practiceService.startSession(practice.id);
      
      setCurrentSession({
        practice,
        sessionId: sessionResponse.data.sessionId,
        currentTime: 0,
        isPlaying: true,
        volume: 0.7,
        isCompleted: false,
        startedAt: new Date()
      });

      await practiceService.trackInteraction(practice.id, 'start', {
        sessionId: sessionResponse.data.sessionId,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error starting practice:', error);
      // Fallback to local session without backend tracking
      setCurrentSession({
        practice,
        currentTime: 0,
        isPlaying: true,
        volume: 0.7,
        isCompleted: false,
        startedAt: new Date()
      });
    }
  };

  const togglePlayPause = async () => {
    if (currentSession) {
      const newIsPlaying = !currentSession.isPlaying;
      setCurrentSession(prev => prev ? {
        ...prev,
        isPlaying: newIsPlaying
      } : null);

      // Track pause interaction
      if (!newIsPlaying && currentSession.sessionId) {
        try {
          await practiceService.trackInteraction(currentSession.practice.id, 'pause', {
            sessionId: currentSession.sessionId,
            currentTime: currentSession.currentTime,
            timestamp: new Date().toISOString()
          });
        } catch (error) {
          console.error('Error tracking pause:', error);
        }
      }
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

  const completePractice = async () => {
    if (currentSession) {
      setCurrentSession(prev => prev ? {
        ...prev,
        isCompleted: true,
        isPlaying: false
      } : null);

      // Track completion
      if (currentSession.sessionId) {
        try {
          await practiceService.completeSession(currentSession.sessionId, {
            completionPercentage: 100,
            rating: postPracticeRating || undefined
          });
        } catch (error) {
          console.error('Error completing session:', error);
        }
      }

      await practiceService.trackInteraction(currentSession.practice.id, 'complete', {
        sessionId: currentSession.sessionId,
        duration: currentSession.currentTime,
        timestamp: new Date().toISOString()
      });

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

  const handleBookmark = async (practiceId: string) => {
    try {
      const practice = practices.find(p => p.id === practiceId);
      if (!practice) return;

      if (practice.isBookmarked) {
        await practiceService.removeBookmark(practiceId);
      } else {
        await practiceService.bookmarkPractice(practiceId);
      }

      // Update local state
      setPractices(prev => prev.map(p => 
        p.id === practiceId ? { ...p, isBookmarked: !p.isBookmarked } : p
      ));
    } catch (error) {
      console.error('Error updating bookmark:', error);
    }
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

  // Render functions
  const renderPracticeCard = (practice: PracticeItem, size: 'small' | 'medium' | 'large' = 'medium') => {
    const cardClasses = {
      small: 'w-64',
      medium: 'w-80', 
      large: 'w-96'
    };

    return (
      <Card 
        key={practice.id} 
        className={`${cardClasses[size]} cursor-pointer group hover:shadow-lg transition-all duration-200 bg-gray-800 border-gray-700 hover:border-purple-500`}
      >
        <div className="relative">
          <ImageWithFallback
            src={practice.thumbnail || practice.imageUrl || '/default-practice.jpg'}
            alt={practice.title}
            className="w-full h-48 object-cover rounded-t-lg"
          />
          
          {/* Practice type overlay */}
          <div className="absolute top-2 left-2">
            <Badge variant="secondary" className="flex items-center gap-1 bg-black/60 text-white border-none">
              {getPracticeIcon(practice.type)}
              {practice.type}
            </Badge>
          </div>

          {/* Duration overlay */}
          <div className="absolute top-2 right-2">
            <Badge variant="secondary" className="flex items-center gap-1 bg-black/60 text-white border-none">
              <Clock className="w-3 h-3" />
              {practice.duration}m
            </Badge>
          </div>

          {/* Featured badge */}
          {practice.isFeatured && (
            <div className="absolute bottom-2 left-2">
              <Badge variant="secondary" className="flex items-center gap-1 bg-yellow-500/80 text-black border-none">
                <Star className="w-3 h-3" />
                Featured
              </Badge>
            </div>
          )}

          {/* Series badge */}
          {practice.seriesId && (
            <div className="absolute bottom-2 right-2">
              <Badge variant="secondary" className="flex items-center gap-1 bg-purple-500/80 text-white border-none">
                <List className="w-3 h-3" />
                Series
              </Badge>
            </div>
          )}

          {/* Play overlay */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 rounded-t-lg">
            <div className="bg-white/90 rounded-full p-3">
              <Play className="w-6 h-6 text-gray-800" />
            </div>
          </div>
        </div>

        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-semibold text-white text-sm line-clamp-2 group-hover:text-purple-400 transition-colors">
              {practice.title}
            </h3>
            <Button
              variant="ghost"
              size="sm"
              className="p-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                handleBookmark(practice.id);
              }}
            >
              <Bookmark 
                className={`w-4 h-4 ${practice.isBookmarked ? 'fill-purple-500 text-purple-500' : 'text-gray-400'}`} 
              />
            </Button>
          </div>

          <p className="text-sm text-gray-400 mb-3 line-clamp-2">
            {practice.shortDescription || practice.description}
          </p>

          <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs border-gray-600 text-gray-300">
                {practice.difficulty}
              </Badge>
              <Badge variant="outline" className="text-xs border-gray-600 text-gray-300">
                {practice.category}
              </Badge>
            </div>
            
            <div className="flex items-center gap-2">
              {practice.averageRating && (
                <div className="flex items-center gap-1">
                  <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                  <span>{practice.averageRating.toFixed(1)}</span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                <span>{practice.completionCount}</span>
              </div>
            </div>
          </div>

          <div className="text-xs text-gray-500 mb-3">
            with {practice.instructor}
          </div>

          <Button 
            className="w-full bg-purple-600 hover:bg-purple-700"
            onClick={() => startPractice(practice)}
          >
            <Play className="w-4 h-4 mr-2" />
            Start Practice
          </Button>
        </CardContent>
      </Card>
    );
  };

  const renderPersonalizedSection = (section: PersonalizedSection) => (
    <div key={section.id} className="mb-8">
      <div className="flex items-center gap-3 mb-4">
        <div className="text-purple-500">{section.icon}</div>
        <div>
          <h2 className="text-xl font-bold text-white">{section.title}</h2>
          <p className="text-sm text-gray-400">{section.description}</p>
        </div>
      </div>
      
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
        {section.practices.map(practice => renderPracticeCard(practice, 'medium'))}
      </div>
    </div>
  );

  const renderSeriesCard = (series: PracticeSeries) => (
    <Card key={series.id} className="cursor-pointer group hover:shadow-lg transition-all duration-200 bg-gray-800 border-gray-700 hover:border-purple-500">
      <div className="relative">
        <ImageWithFallback
          src={series.thumbnail}
          alt={series.title}
          className="w-full h-48 object-cover rounded-t-lg"
        />
        
        <div className="absolute top-2 left-2">
          <Badge variant="secondary" className="flex items-center gap-1 bg-black/60 text-white border-none">
            <List className="w-3 h-3" />
            {series.totalSessions} Sessions
          </Badge>
        </div>

        <div className="absolute top-2 right-2">
          <Badge variant="secondary" className="flex items-center gap-1 bg-black/60 text-white border-none">
            <Clock className="w-3 h-3" />
            {series.totalDuration}m
          </Badge>
        </div>
      </div>

      <CardContent className="p-4">
        <h3 className="font-semibold text-white mb-2 group-hover:text-purple-400 transition-colors">
          {series.title}
        </h3>
        <p className="text-sm text-gray-400 mb-3 line-clamp-2">
          {series.description}
        </p>
        
        <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
          <Badge variant="outline" className="text-xs border-gray-600 text-gray-300">
            {series.difficulty}
          </Badge>
          <span>with {series.instructor}</span>
        </div>

        {series.userProgress && series.userProgress > 0 && (
          <div className="mb-3">
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>Progress</span>
              <span>{Math.round(series.userProgress)}%</span>
            </div>
            <Progress value={series.userProgress} className="h-2" />
          </div>
        )}

        <Button className="w-full bg-purple-600 hover:bg-purple-700">
          <Play className="w-4 h-4 mr-2" />
          {series.userProgress && series.userProgress > 0 ? 'Continue Series' : 'Start Series'}
        </Button>
      </CardContent>
    </Card>
  );

  const renderFilters = () => (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Filter className="w-5 h-5" />
          Filters
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={clearFilters}
          className="text-gray-400 hover:text-white"
        >
          Clear All
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Category Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
          <select
            value={filters.category || ''}
            onChange={(e) => updateFilters({ category: e.target.value || undefined })}
            className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white"
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat.name} value={cat.name}>
                {cat.name} ({cat.count})
              </option>
            ))}
          </select>
        </div>

        {/* Type Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Type</label>
          <select
            value={filters.type || ''}
            onChange={(e) => updateFilters({ type: e.target.value || undefined })}
            className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white"
          >
            <option value="">All Types</option>
            {types.map(type => (
              <option key={type.name} value={type.name}>
                {type.name} ({type.count})
              </option>
            ))}
          </select>
        </div>

        {/* Duration Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Duration</label>
          <select
            value={filters.duration || ''}
            onChange={(e) => updateFilters({ duration: e.target.value || undefined })}
            className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white"
          >
            <option value="">Any Duration</option>
            <option value="short">Short (5-10 min)</option>
            <option value="medium">Medium (10-20 min)</option>
            <option value="long">Long (20+ min)</option>
          </select>
        </div>

        {/* Difficulty Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Difficulty</label>
          <select
            value={filters.difficulty || ''}
            onChange={(e) => updateFilters({ difficulty: e.target.value || undefined })}
            className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white"
          >
            <option value="">All Levels</option>
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
          </select>
        </div>
      </div>
    </div>
  );

  const renderPracticeGrid = (practiceList: PracticeItem[]) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {practiceList.map(practice => renderPracticeCard(practice, 'medium'))}
    </div>
  );

  const renderSeriesGrid = (seriesList: PracticeSeries[]) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {seriesList.map(series => renderSeriesCard(series))}
    </div>
  );

  const renderPagination = () => (
    <div className="flex items-center justify-between mt-8">
      <div className="text-sm text-gray-400">
        Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} results
      </div>
      
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => updateFilters({ page: pagination.page - 1 })}
          disabled={!pagination.hasPrev || isLoading}
          className="border-gray-600 text-gray-300 hover:bg-gray-700"
        >
          Previous
        </Button>
        
        <div className="flex items-center gap-1">
          {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
            const pageNum = Math.max(1, pagination.page - 2) + i;
            if (pageNum > pagination.totalPages) return null;
            
            return (
              <Button
                key={pageNum}
                variant={pageNum === pagination.page ? "default" : "outline"}
                size="sm"
                onClick={() => updateFilters({ page: pageNum })}
                className={pageNum === pagination.page 
                  ? "bg-purple-600 hover:bg-purple-700" 
                  : "border-gray-600 text-gray-300 hover:bg-gray-700"
                }
              >
                {pageNum}
              </Button>
            );
          })}
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => updateFilters({ page: pagination.page + 1 })}
          disabled={!pagination.hasNext || isLoading}
          className="border-gray-600 text-gray-300 hover:bg-gray-700"
        >
          Next
        </Button>
      </div>
    </div>
  );

  // Practice session modal
  if (currentSession) {
    const totalSeconds = currentSession.practice.duration * 60;
    const progress = (currentSession.currentTime / totalSeconds) * 100;

    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900/20 to-blue-900/20 flex items-center justify-center p-6">
        <Card className="w-full max-w-md bg-gray-800 border-gray-700">
          <CardContent className="p-8 space-y-6">
            {/* Practice Info */}
            <div className="text-center space-y-2">
              <ImageWithFallback
                src={currentSession.practice.thumbnail || currentSession.practice.imageUrl || '/default-practice.jpg'}
                alt={currentSession.practice.title}
                className="w-24 h-24 rounded-full mx-auto object-cover"
              />
              <h2 className="text-xl font-semibold text-white">{currentSession.practice.title}</h2>
              <p className="text-sm text-gray-400">
                with {currentSession.practice.instructor}
              </p>
            </div>

            {/* Progress */}
            <div className="space-y-3">
              <Progress value={progress} className="h-2" />
              <div className="flex justify-between text-sm text-gray-400">
                <span>{formatTime(currentSession.currentTime)}</span>
                <span>{formatTime(totalSeconds)}</span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={resetPractice}
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
              
              <Button
                size="lg"
                onClick={togglePlayPause}
                className="bg-purple-600 hover:bg-purple-700 rounded-full w-16 h-16"
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
                onClick={closePractice}
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                <SkipForward className="h-4 w-4" />
              </Button>
            </div>

            {/* Volume Control */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <VolumeX className="h-4 w-4 text-gray-400" />
                <Slider
                  value={[currentSession.volume]}
                  onValueChange={handleVolumeChange}
                  max={1}
                  step={0.1}
                  className="flex-1"
                />
                <Volume2 className="h-4 w-4 text-gray-400" />
              </div>
            </div>

            {/* Completion Message */}
            {currentSession.isCompleted && (
              <div className="text-center space-y-4 p-4 bg-green-900/20 rounded-lg border border-green-500/20">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
                <h3 className="text-lg font-semibold text-white">Practice Complete!</h3>
                <p className="text-sm text-gray-400">
                  Great work! How was your practice?
                </p>
                
                {/* Rating */}
                <div className="flex items-center justify-center space-x-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setPostPracticeRating(star)}
                      className={`p-1 ${
                        postPracticeRating && star <= postPracticeRating
                          ? 'text-yellow-500'
                          : 'text-gray-400'
                      }`}
                    >
                      <Star className="h-5 w-5 fill-current" />
                    </button>
                  ))}
                </div>
                
                <Button
                  onClick={closePractice}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  Finish
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Loading state
  if (isLoading && practices.length === 0) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Loading practices...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <Button onClick={loadInitialData} className="bg-purple-600 hover:bg-purple-700">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigate('dashboard')}
            className="text-gray-400 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-white">Practice Library</h1>
            <p className="text-gray-400">Guided practices and series for your wellness journey</p>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            type="text"
            placeholder="Search practices, instructors, or techniques..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-3 bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-purple-500"
          />
          {isSearching && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-500"></div>
            </div>
          )}
        </div>

        {/* Search Suggestions */}
        {searchQuery && searchSuggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-10">
            <div className="p-2">
              <p className="text-xs text-gray-400 mb-2">Suggestions:</p>
              {searchSuggestions.map((suggestion, index) => (
                <button
                  key={index}
                  className="block w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 rounded-md"
                  onClick={() => setSearchQuery(suggestion)}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Content Tabs */}
      <div className="mb-6">
        <div className="flex space-x-1 bg-gray-800 rounded-lg p-1 w-fit">
          {[
            { id: 'for-you', label: 'For You', icon: <Sparkles className="w-4 h-4" /> },
            { id: 'all', label: 'All Practices', icon: <Heart className="w-4 h-4" /> },
            { id: 'series', label: 'Series', icon: <List className="w-4 h-4" /> },
            { id: 'bookmarks', label: 'Bookmarks', icon: <Bookmark className="w-4 h-4" /> }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Filter Toggle */}
      <div className="mb-6">
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className="border-gray-600 text-gray-300 hover:bg-gray-700"
        >
          <Filter className="w-4 h-4 mr-2" />
          {showFilters ? 'Hide Filters' : 'Show Filters'}
        </Button>
      </div>

      {/* Filters */}
      {showFilters && renderFilters()}

      {/* Content Display */}
      {searchQuery && searchResults.length > 0 ? (
        <div>
          <h2 className="text-xl font-bold text-white mb-4">
            Search Results for &quot;{searchQuery}&quot; ({searchResults.length})
          </h2>
          {renderPracticeGrid(searchResults)}
        </div>
      ) : searchQuery && searchResults.length === 0 && !isSearching ? (
        <div className="text-center py-12">
          <Heart className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-300 mb-2">No results found</h3>
          <p className="text-gray-400">Try adjusting your search terms or filters</p>
        </div>
      ) : (
        <>
          {/* Personalized Sections */}
          {activeTab === 'for-you' && authUser && (
            <div>
              {personalizedSections.length > 0 ? (
                personalizedSections.map(section => renderPersonalizedSection(section))
              ) : (
                <div className="text-center py-12">
                  <Sparkles className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-300 mb-2">Building your personalized experience</h3>
                  <p className="text-gray-400">Complete your assessment to get personalized practice recommendations</p>
                  <Button 
                    onClick={() => onNavigate('assessment')}
                    className="mt-4 bg-purple-600 hover:bg-purple-700"
                  >
                    Take Assessment
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* All Practices */}
          {activeTab === 'all' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">All Practices</h2>
                <p className="text-sm text-gray-400">{pagination.total} practices</p>
              </div>
              {renderPracticeGrid(practices)}
              {renderPagination()}
            </div>
          )}

          {/* Practice Series */}
          {activeTab === 'series' && (
            <div>
              <h2 className="text-xl font-bold text-white mb-6">Practice Series</h2>
              {renderSeriesGrid(series)}
            </div>
          )}

          {/* Bookmarked Practices */}
          {activeTab === 'bookmarks' && (
            <div>
              <h2 className="text-xl font-bold text-white mb-6">Your Bookmarks</h2>
              {renderPracticeGrid(practices.filter(practice => practice.isBookmarked))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default Practices;