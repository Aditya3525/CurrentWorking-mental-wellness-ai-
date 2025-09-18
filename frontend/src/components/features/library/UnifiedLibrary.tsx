import React, { useState, useEffect, useCallback } from 'react';

import { Search, Book, Heart, Filter, Zap, TrendingUp, Star } from 'lucide-react';

import { useAuth } from '../../../contexts/AuthContext';
import { contentService } from '../../../services/contentService';
import { practiceService } from '../../../services/practiceService';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Card } from '../../ui/card';
import { Badge } from '../../ui/badge';
import ContentLibrary from '../content/ContentLibrary';
import Practices from '../practices/Practices';

export interface UnifiedSearchResult {
  type: 'content' | 'practice';
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty?: string;
  duration?: string;
  rating?: number;
  thumbnail?: string;
  isBookmarked?: boolean;
}

const UnifiedLibrary: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'unified' | 'content' | 'practices'>('unified');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UnifiedSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    type: 'all' as 'all' | 'content' | 'practice',
    category: '',
    difficulty: '',
    duration: ''
  });
  const [recommendations, setRecommendations] = useState({
    crossContent: [] as UnifiedSearchResult[],
    trending: [] as UnifiedSearchResult[],
    forYou: [] as UnifiedSearchResult[]
  });

  // Unified search functionality
  const performUnifiedSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const [contentResults, practiceResults] = await Promise.all([
        contentService.searchContent(query, {
          category: filters.category || undefined,
          difficulty: filters.difficulty || undefined
        }),
        practiceService.searchPractices(query, {
          category: filters.category || undefined,
          difficulty: filters.difficulty || undefined,
          duration: filters.duration || undefined
        })
      ]);

      const unified: UnifiedSearchResult[] = [
        ...contentResults.data.results.map(item => ({
          type: 'content' as const,
          id: item.id,
          title: item.title,
          description: item.description,
          category: item.category,
          difficulty: item.difficulty,
          rating: item.averageRating,
          thumbnail: item.thumbnail,
          isBookmarked: item.isBookmarked
        })),
        ...practiceResults.data.results.map(item => ({
          type: 'practice' as const,
          id: item.id,
          title: item.title,
          description: item.description,
          category: item.category,
          difficulty: item.difficulty,
          duration: `${item.duration} min`,
          rating: item.averageRating,
          thumbnail: item.thumbnail,
          isBookmarked: item.isBookmarked
        }))
      ];

      // Filter by type if specified
      const filteredResults = filters.type === 'all' 
        ? unified 
        : unified.filter(item => item.type === filters.type);

      // Sort by relevance and rating
      filteredResults.sort((a, b) => (b.rating || 0) - (a.rating || 0));

      setSearchResults(filteredResults);
    } catch (error) {
      console.error('Unified search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [filters]);

  // Load cross-recommendations
  useEffect(() => {
    const loadRecommendations = async () => {
      try {
        const [contentRecs, practiceRecs] = await Promise.all([
          contentService.getRecommendations(),
          practiceService.getRecommendations(6)
        ]);

        const crossContent = [
          ...contentRecs.data.recommendations.slice(0, 3).map(item => ({
            type: 'content' as const,
            id: item.id,
            title: item.title,
            description: item.description,
            category: item.category,
            difficulty: item.difficulty,
            rating: item.averageRating,
            thumbnail: item.thumbnail,
            isBookmarked: item.isBookmarked
          })),
          ...practiceRecs.data.recommendations.slice(0, 3).map(item => ({
            type: 'practice' as const,
            id: item.id,
            title: item.title,
            description: item.description,
            category: item.category,
            difficulty: item.difficulty,
            duration: `${item.duration} min`,
            rating: item.averageRating,
            thumbnail: item.thumbnail,
            isBookmarked: item.isBookmarked
          }))
        ];

        setRecommendations(prev => ({
          ...prev,
          crossContent,
          forYou: crossContent.slice(0, 4)
        }));
      } catch (error) {
        console.error('Failed to load recommendations:', error);
      }
    };

    if (user) {
      loadRecommendations();
    }
  }, [user]);

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery && activeTab === 'unified') {
        performUnifiedSearch(searchQuery);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, performUnifiedSearch, activeTab]);

  const renderUnifiedSearchCard = (item: UnifiedSearchResult) => (
    <Card key={`${item.type}-${item.id}`} className="p-4 hover:bg-gray-800 transition-all cursor-pointer group">
      <div className="flex items-start gap-4">
        {item.thumbnail && (
          <img 
            src={item.thumbnail} 
            alt={item.title}
            className="w-16 h-16 rounded-lg object-cover"
          />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant={item.type === 'content' ? 'default' : 'secondary'}>
              {item.type === 'content' ? (
                <><Book className="w-3 h-3 mr-1" /> Content</>
              ) : (
                <><Heart className="w-3 h-3 mr-1" /> Practice</>
              )}
            </Badge>
            {item.rating && (
              <div className="flex items-center gap-1">
                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                <span className="text-sm text-gray-300">{item.rating.toFixed(1)}</span>
              </div>
            )}
          </div>
          <h3 className="font-medium text-white mb-1 group-hover:text-purple-400 transition-colors">
            {item.title}
          </h3>
          <p className="text-sm text-gray-400 mb-2 line-clamp-2">{item.description}</p>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Badge variant="outline" size="sm">{item.category}</Badge>
            {item.difficulty && <Badge variant="outline" size="sm">{item.difficulty}</Badge>}
            {item.duration && <Badge variant="outline" size="sm">{item.duration}</Badge>}
          </div>
        </div>
      </div>
    </Card>
  );

  const renderUnifiedView = () => (
    <div className="space-y-6">
      {/* Search Section */}
      <div className="space-y-4">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search across all content and practices..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            Filters
          </Button>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <Card className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label htmlFor="type-filter" className="block text-sm font-medium text-gray-300 mb-2">Type</label>
                <select
                  id="type-filter"
                  value={filters.type}
                  onChange={(e) => setFilters(prev => ({ 
                    ...prev, 
                    type: e.target.value as 'all' | 'content' | 'practice'
                  }))}
                  className="w-full p-2 bg-gray-800 border border-gray-600 rounded-lg text-white"
                >
                  <option value="all">All</option>
                  <option value="content">Content Only</option>
                  <option value="practice">Practices Only</option>
                </select>
              </div>
              <div>
                <label htmlFor="category-filter" className="block text-sm font-medium text-gray-300 mb-2">Category</label>
                <select
                  id="category-filter"
                  value={filters.category}
                  onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full p-2 bg-gray-800 border border-gray-600 rounded-lg text-white"
                >
                  <option value="">All Categories</option>
                  <option value="anxiety">Anxiety</option>
                  <option value="depression">Depression</option>
                  <option value="stress">Stress</option>
                  <option value="mindfulness">Mindfulness</option>
                  <option value="sleep">Sleep</option>
                  <option value="relationships">Relationships</option>
                </select>
              </div>
              <div>
                <label htmlFor="difficulty-filter" className="block text-sm font-medium text-gray-300 mb-2">Difficulty</label>
                <select
                  id="difficulty-filter"
                  value={filters.difficulty}
                  onChange={(e) => setFilters(prev => ({ ...prev, difficulty: e.target.value }))}
                  className="w-full p-2 bg-gray-800 border border-gray-600 rounded-lg text-white"
                >
                  <option value="">All Levels</option>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
              <div>
                <label htmlFor="duration-filter" className="block text-sm font-medium text-gray-300 mb-2">Duration</label>
                <select
                  id="duration-filter"
                  value={filters.duration}
                  onChange={(e) => setFilters(prev => ({ ...prev, duration: e.target.value }))}
                  className="w-full p-2 bg-gray-800 border border-gray-600 rounded-lg text-white"
                >
                  <option value="">Any Duration</option>
                  <option value="1-5">1-5 minutes</option>
                  <option value="5-15">5-15 minutes</option>
                  <option value="15-30">15-30 minutes</option>
                  <option value="30+">30+ minutes</option>
                </select>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Search Results */}
      {searchQuery && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white">Search Results</h2>
            {!isSearching && (
              <span className="text-sm text-gray-400">
                {searchResults.length} results found
              </span>
            )}
          </div>
          
          {isSearching ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
            </div>
          ) : searchResults.length > 0 ? (
            <div className="grid gap-4">
              {searchResults.map(renderUnifiedSearchCard)}
            </div>
          ) : (
            <Card className="p-8 text-center">
              <p className="text-gray-400">No results found for &ldquo;{searchQuery}&rdquo;</p>
              <p className="text-sm text-gray-500 mt-2">Try adjusting your search terms or filters</p>
            </Card>
          )}
        </div>
      )}

      {/* Recommendations when not searching */}
      {!searchQuery && (
        <div className="space-y-8">
          {/* For You Section */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-5 h-5 text-purple-400" />
              <h2 className="text-xl font-semibold text-white">Recommended for You</h2>
            </div>
            <div className="grid gap-4">
              {recommendations.forYou.map(renderUnifiedSearchCard)}
            </div>
          </div>

          {/* Cross-Content Recommendations */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-green-400" />
              <h2 className="text-xl font-semibold text-white">Trending Now</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recommendations.crossContent.map(renderUnifiedSearchCard)}
            </div>
          </div>

          {/* Quick Access */}
          <div>
            <h2 className="text-xl font-semibold text-white mb-4">Quick Access</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button
                variant="outline"
                className="h-20 flex flex-col items-center justify-center gap-2"
                onClick={() => setActiveTab('content')}
              >
                <Book className="w-6 h-6" />
                <span>Content Library</span>
              </Button>
              <Button
                variant="outline"
                className="h-20 flex flex-col items-center justify-center gap-2"
                onClick={() => setActiveTab('practices')}
              >
                <Heart className="w-6 h-6" />
                <span>Practice Library</span>
              </Button>
              <Button
                variant="outline"
                className="h-20 flex flex-col items-center justify-center gap-2"
                onClick={() => {
                  setFilters(prev => ({ ...prev, type: 'practice', duration: '1-5' }));
                  setSearchQuery('quick');
                }}
              >
                <Zap className="w-6 h-6" />
                <span>Quick Sessions</span>
              </Button>
              <Button
                variant="outline"
                className="h-20 flex flex-col items-center justify-center gap-2"
                onClick={() => {
                  setFilters(prev => ({ ...prev, category: 'mindfulness' }));
                  setSearchQuery('mindfulness');
                }}
              >
                <Star className="w-6 h-6" />
                <span>Mindfulness</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Navigation Tabs */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex space-x-1 bg-gray-800 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('unified')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === 'unified'
                ? 'bg-purple-600 text-white shadow-lg'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Unified Library
            </div>
          </button>
          <button
            onClick={() => setActiveTab('content')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === 'content'
                ? 'bg-purple-600 text-white shadow-lg'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <Book className="w-4 h-4" />
              Content
            </div>
          </button>
          <button
            onClick={() => setActiveTab('practices')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === 'practices'
                ? 'bg-purple-600 text-white shadow-lg'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4" />
              Practices
            </div>
          </button>
        </div>

        {/* User Greeting */}
        {user && (
          <div className="text-right">
            <p className="text-sm text-gray-400">Welcome back,</p>
            <p className="font-medium text-white">{user.name}</p>
          </div>
        )}
      </div>

      {/* Tab Content */}
      <div className="min-h-screen">
        {activeTab === 'unified' && renderUnifiedView()}
        {activeTab === 'content' && <ContentLibrary onNavigate={() => {}} />}
        {activeTab === 'practices' && <Practices onNavigate={() => {}} />}
      </div>
    </div>
  );
};

export default UnifiedLibrary;