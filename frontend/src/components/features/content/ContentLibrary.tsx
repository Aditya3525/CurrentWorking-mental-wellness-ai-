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
  Sparkles,
  TrendingUp,
  Eye,
  FileText,
  List
} from 'lucide-react';
import React, { useState, useEffect, useCallback } from 'react';

import { contentService, type ContentItem, type ContentFilters } from '../../../services/contentService';
import { ImageWithFallback } from '../../common/ImageWithFallback';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { Card, CardContent } from '../../ui/card';
import { Input } from '../../ui/input';

interface ContentLibraryProps {
  onNavigate: (page: string) => void;
  user?: {
    id: string;
    approach?: string;
  };
}

interface PersonalizedSection {
  id: string;
  title: string;
  description: string;
  content: ContentItem[];
  icon: React.ReactNode;
}

// Mock auth hook for now since the actual one doesn't exist
const useAuth = () => ({
  user: null
});

export function ContentLibrary({ onNavigate }: ContentLibraryProps) {
  // State management
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ContentItem[]>([]);
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  const [content, setContent] = useState<ContentItem[]>([]);
  const [personalizedSections, setPersonalizedSections] = useState<PersonalizedSection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter states
  const [filters, setFilters] = useState<ContentFilters>({
    page: 1,
    limit: 12,
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
  const [showFilters, setShowFilters] = useState(false);
  const [categories, setCategories] = useState<Array<{ name: string; count: number }>>([]);
  const [types, setTypes] = useState<Array<{ name: string; count: number }>>([]);
  
  // Pagination
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  });
  
  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'for-you' | 'featured' | 'bookmarks'>('for-you');

  const { user: authUser } = useAuth();

  // Content icons mapping
  const getContentIcon = (type: string) => {
    switch (type) {
      case 'video': return <Video className="w-4 h-4" />;
      case 'audio': return <Headphones className="w-4 h-4" />;
      case 'article': return <BookOpen className="w-4 h-4" />;
      case 'playlist': return <List className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  // Load initial data
  useEffect(() => {
    loadInitialContent();
    loadCategories();
  }, []);

  // Load content when filters change
  useEffect(() => {
    loadContent();
  }, [filters]);

  const loadInitialContent = useCallback(async () => {
    try {
      setIsLoading(true);
      const [contentResponse, recommendationsResponse] = await Promise.all([
        contentService.getContent({
          page: 1,
          limit: 12,
          sortBy: 'createdAt',
          sortOrder: 'desc'
        }),
        authUser ? contentService.getRecommendations() : Promise.resolve({ data: { recommendations: [] } })
      ]);

      setContent(contentResponse.data.content);
      setPagination(contentResponse.data.pagination);
      
      if (authUser) {
        await createPersonalizedSections(contentResponse.data.content, recommendationsResponse.data.recommendations);
      }
    } catch (error) {
      console.error('Error loading initial content:', error);
      setError('Failed to load content');
    } finally {
      setIsLoading(false);
    }
  }, [authUser]);

  const loadContent = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await contentService.getContent(filters);
      setContent(response.data.content);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Error loading content:', error);
      setError('Failed to load content');
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  const loadCategories = async () => {
    try {
      const response = await contentService.getCategories();
      setCategories(response.data.categories);
      setTypes(response.data.types);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const createPersonalizedSections = async (allContent: ContentItem[], userRecommendations: ContentItem[]) => {
    const sections: PersonalizedSection[] = [];

    // For You section (recommendations)
    if (userRecommendations.length > 0) {
      sections.push({
        id: 'for-you',
        title: 'For You',
        description: 'Personalized content based on your journey',
        content: userRecommendations.slice(0, 6),
        icon: <Sparkles className="w-5 h-5" />
      });
    }

    // Featured content
    const featured = allContent.filter(item => item.isFeatured).slice(0, 6);
    if (featured.length > 0) {
      sections.push({
        id: 'featured',
        title: 'Featured',
        description: 'Editor\'s picks and trending content',
        content: featured,
        icon: <Star className="w-5 h-5" />
      });
    }

    // Popular content
    const popular = allContent.filter(item => item.viewCount > 100).slice(0, 6);
    if (popular.length > 0) {
      sections.push({
        id: 'popular',
        title: 'Popular',
        description: 'Most viewed content this week',
        content: popular,
        icon: <TrendingUp className="w-5 h-5" />
      });
    }

    // Approach-based content
    if (authUser?.approach && authUser.approach !== 'hybrid') {
      const approachContent = allContent.filter(item => 
        item.approach === authUser.approach || item.approach === 'hybrid'
      ).slice(0, 6);
      
      if (approachContent.length > 0) {
        sections.push({
          id: 'approach',
          title: `${authUser.approach.charAt(0).toUpperCase() + authUser.approach.slice(1)} Approach`,
          description: `Content aligned with your ${authUser.approach} approach`,
          content: approachContent,
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
      const response = await contentService.searchContent(query, {
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
  const updateFilters = (newFilters: Partial<ContentFilters>) => {
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

  // Content interaction handlers
  const handleBookmark = async (contentId: string) => {
    try {
      const item = content.find(c => c.id === contentId);
      if (!item) return;

      if (item.isBookmarked) {
        await contentService.removeBookmark(contentId);
      } else {
        await contentService.bookmarkContent(contentId);
      }

      // Update local state
      setContent(prev => prev.map(c => 
        c.id === contentId ? { ...c, isBookmarked: !c.isBookmarked } : c
      ));
    } catch (error) {
      console.error('Error updating bookmark:', error);
    }
  };

  const handleContentClick = async (contentItem: ContentItem) => {
    setSelectedContent(contentItem);
    
    // Track view interaction
    try {
      await contentService.trackInteraction(contentItem.id, 'view', {
        source: 'content_library',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error tracking view:', error);
    }
  };

  // Render functions
  const renderContentCard = (item: ContentItem, size: 'small' | 'medium' | 'large' = 'medium') => {
    const cardClasses = {
      small: 'w-64',
      medium: 'w-80', 
      large: 'w-96'
    };

    return (
      <Card 
        key={item.id} 
        className={`${cardClasses[size]} cursor-pointer group hover:shadow-lg transition-all duration-200 bg-gray-800 border-gray-700 hover:border-purple-500`}
        onClick={() => handleContentClick(item)}
      >
        <div className="relative">
          <ImageWithFallback
            src={item.thumbnail || item.imageUrl || '/default-content.jpg'}
            alt={item.title}
            className="w-full h-48 object-cover rounded-t-lg"
          />
          
          {/* Content type overlay */}
          <div className="absolute top-2 left-2">
            <Badge variant="secondary" className="flex items-center gap-1 bg-black/60 text-white border-none">
              {getContentIcon(item.type)}
              {item.type}
            </Badge>
          </div>

          {/* Duration overlay */}
          {item.duration && (
            <div className="absolute top-2 right-2">
              <Badge variant="secondary" className="flex items-center gap-1 bg-black/60 text-white border-none">
                <Clock className="w-3 h-3" />
                {item.duration}m
              </Badge>
            </div>
          )}

          {/* Featured badge */}
          {item.isFeatured && (
            <div className="absolute bottom-2 left-2">
              <Badge variant="secondary" className="flex items-center gap-1 bg-yellow-500/80 text-black border-none">
                <Star className="w-3 h-3" />
                Featured
              </Badge>
            </div>
          )}

          {/* Play overlay for videos */}
          {item.type === 'video' && (
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 rounded-t-lg">
              <div className="bg-white/90 rounded-full p-3">
                <Play className="w-6 h-6 text-gray-800" />
              </div>
            </div>
          )}
        </div>

        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-semibold text-white text-sm line-clamp-2 group-hover:text-purple-400 transition-colors">
              {item.title}
            </h3>
            <Button
              variant="ghost"
              size="sm"
              className="p-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                handleBookmark(item.id);
              }}
            >
              <Bookmark 
                className={`w-4 h-4 ${item.isBookmarked ? 'fill-purple-500 text-purple-500' : 'text-gray-400'}`} 
              />
            </Button>
          </div>

          <p className="text-sm text-gray-400 mb-3 line-clamp-2">
            {item.shortDescription || item.description}
          </p>

          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs border-gray-600 text-gray-300">
                {item.difficulty}
              </Badge>
              <Badge variant="outline" className="text-xs border-gray-600 text-gray-300">
                {item.category}
              </Badge>
            </div>
            
            <div className="flex items-center gap-2">
              {item.averageRating && (
                <div className="flex items-center gap-1">
                  <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                  <span>{item.averageRating.toFixed(1)}</span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                <span>{item.viewCount}</span>
              </div>
            </div>
          </div>
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
        {section.content.map(item => renderContentCard(item, 'medium'))}
      </div>
    </div>
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

        {/* Sort Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Sort By</label>
          <select
            value={`${filters.sortBy}-${filters.sortOrder}`}
            onChange={(e) => {
              const [sortBy, sortOrder] = e.target.value.split('-');
              updateFilters({ sortBy: sortBy as any, sortOrder: sortOrder as 'asc' | 'desc' });
            }}
            className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white"
          >
            <option value="createdAt-desc">Newest First</option>
            <option value="createdAt-asc">Oldest First</option>
            <option value="viewCount-desc">Most Popular</option>
            <option value="rating-desc">Highest Rated</option>
            <option value="title-asc">Title A-Z</option>
            <option value="title-desc">Title Z-A</option>
          </select>
        </div>
      </div>
    </div>
  );

  const renderContentGrid = (contentList: ContentItem[]) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {contentList.map(item => renderContentCard(item, 'medium'))}
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

  if (isLoading && content.length === 0) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Loading content...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <Button onClick={loadInitialContent} className="bg-purple-600 hover:bg-purple-700">
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
            <h1 className="text-3xl font-bold text-white">Content Library</h1>
            <p className="text-gray-400">Discover articles, videos, and resources for your wellbeing journey</p>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            type="text"
            placeholder="Search content, topics, or keywords..."
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
            { id: 'all', label: 'All Content', icon: <BookOpen className="w-4 h-4" /> },
            { id: 'featured', label: 'Featured', icon: <Star className="w-4 h-4" /> },
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
            Search Results for "{searchQuery}" ({searchResults.length})
          </h2>
          {renderContentGrid(searchResults)}
        </div>
      ) : searchQuery && searchResults.length === 0 && !isSearching ? (
        <div className="text-center py-12">
          <BookOpen className="w-16 h-16 text-gray-600 mx-auto mb-4" />
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
                  <p className="text-gray-400">Complete your assessment to get personalized recommendations</p>
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

          {/* All Content */}
          {activeTab === 'all' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">All Content</h2>
                <p className="text-sm text-gray-400">{pagination.total} items</p>
              </div>
              {renderContentGrid(content)}
              {renderPagination()}
            </div>
          )}

          {/* Featured Content */}
          {activeTab === 'featured' && (
            <div>
              <h2 className="text-xl font-bold text-white mb-6">Featured Content</h2>
              {renderContentGrid(content.filter(item => item.isFeatured))}
            </div>
          )}

          {/* Bookmarked Content */}
          {activeTab === 'bookmarks' && (
            <div>
              <h2 className="text-xl font-bold text-white mb-6">Your Bookmarks</h2>
              {renderContentGrid(content.filter(item => item.isBookmarked))}
            </div>
          )}
        </>
      )}

      {/* Content Detail Modal */}
      {selectedContent && (
        <ContentDetailModal
          content={selectedContent}
          onClose={() => setSelectedContent(null)}
          onBookmark={handleBookmark}
        />
      )}
    </div>
  );
}

// Content Detail Modal Component
interface ContentDetailModalProps {
  content: ContentItem;
  onClose: () => void;
  onBookmark: (contentId: string) => void;
}

function ContentDetailModal({ content, onClose, onBookmark }: ContentDetailModalProps) {
  return (
    <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <h2 className="text-2xl font-bold text-white">{content.title}</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-400 hover:text-white"
            >
              ✕
            </Button>
          </div>

          {content.thumbnail && (
            <div className="mb-6">
              <ImageWithFallback
                src={content.thumbnail}
                alt={content.title}
                className="w-full h-64 object-cover rounded-lg"
              />
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <p className="text-gray-300 mb-4">{content.description}</p>
              
              {content.fullDescription && (
                <div className="prose prose-invert max-w-none">
                  <div dangerouslySetInnerHTML={{ __html: content.fullDescription }} />
                </div>
              )}
            </div>

            <div>
              <div className="bg-gray-700 rounded-lg p-4 mb-4">
                <h3 className="font-semibold text-white mb-3">Details</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Type:</span>
                    <span className="text-white capitalize">{content.type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Category:</span>
                    <span className="text-white">{content.category}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Difficulty:</span>
                    <span className="text-white">{content.difficulty}</span>
                  </div>
                  {content.duration && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Duration:</span>
                      <span className="text-white">{content.duration} min</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-400">Views:</span>
                    <span className="text-white">{content.viewCount}</span>
                  </div>
                  {content.averageRating && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Rating:</span>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                        <span className="text-white">{content.averageRating.toFixed(1)}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <Button
                  onClick={() => onBookmark(content.id)}
                  variant="outline"
                  className="w-full border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  <Bookmark className={`w-4 h-4 mr-2 ${content.isBookmarked ? 'fill-purple-500 text-purple-500' : ''}`} />
                  {content.isBookmarked ? 'Remove Bookmark' : 'Bookmark'}
                </Button>

                {content.type === 'video' && (
                  <Button className="w-full bg-purple-600 hover:bg-purple-700">
                    <Play className="w-4 h-4 mr-2" />
                    Watch Video
                  </Button>
                )}

                {content.type === 'audio' && (
                  <Button className="w-full bg-purple-600 hover:bg-purple-700">
                    <Headphones className="w-4 h-4 mr-2" />
                    Listen
                  </Button>
                )}

                {content.type === 'article' && (
                  <Button className="w-full bg-purple-600 hover:bg-purple-700">
                    <BookOpen className="w-4 h-4 mr-2" />
                    Read Article
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ContentLibrary;