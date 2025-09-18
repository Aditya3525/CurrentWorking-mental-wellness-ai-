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
  ExternalLink,
  Download,
  PlayCircle,
  List,
  Grid
} from 'lucide-react';
import React, { useState, useEffect } from 'react';

import { ImageWithFallback } from '../../common/ImageWithFallback';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Input } from '../../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';

interface ContentLibraryProps {
  onNavigate: (page: string) => void;
  user?: any;
}

interface ContentItem {
  id: string;
  title: string;
  description?: string;
  type: 'video' | 'audio' | 'article' | 'playlist';
  duration?: string;
  difficulty?: string;
  category: string;
  tags?: string;
  author?: string;
  thumbnailUrl?: string;
  rating?: number;
  viewCount: number;
  approach: string;
  severityLevel?: string;
  createdAt: string;
  _count?: {
    contentRatings: number;
  };
}

interface PlaylistItem {
  id: string;
  title: string;
  description?: string;
  category: string;
  approach: string;
  difficulty?: string;
  tags?: string;
  thumbnailUrl?: string;
  rating?: number;
  viewCount: number;
  severityLevel?: string;
  itemCount?: number;
  totalDuration?: number;
  items?: any[];
}

interface ContentResponse {
  success: boolean;
  data: {
    content: ContentItem[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
}

interface PlaylistResponse {
  success: boolean;
  data: {
    playlists: PlaylistItem[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
}

export function EnhancedContentLibrary({ onNavigate, user }: ContentLibraryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedApproach, setSelectedApproach] = useState<string>(user?.approach || 'all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [selectedSeverity, setSelectedSeverity] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeTab, setActiveTab] = useState('content');
  
  const [content, setContent] = useState<ContentItem[]>([]);
  const [playlists, setPlaylists] = useState<PlaylistItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    total: 0,
    pages: 0,
    limit: 12
  });

  const categories = ['all', 'Mindfulness', 'Anxiety', 'Stress Management', 'Relaxation', 'Emotional Intelligence', 'Series'];
  const types = ['all', 'video', 'audio', 'article'];
  const difficulties = ['all', 'Beginner', 'Intermediate', 'Advanced'];
  const severityLevels = ['all', 'Mild', 'Moderate', 'Severe'];
  const approaches = [
    { value: 'all', label: 'All Approaches', icon: Users },
    { value: 'western', label: 'Western Therapy', icon: Brain },
    { value: 'eastern', label: 'Eastern Practices', icon: Heart },
    { value: 'hybrid', label: 'Hybrid Approach', icon: Heart }
  ];

  // Fetch content
  const fetchContent = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pagination.limit.toString(),
        sortBy,
        sortOrder,
        ...(selectedCategory !== 'all' && { category: selectedCategory }),
        ...(selectedType !== 'all' && { type: selectedType }),
        ...(selectedApproach !== 'all' && { approach: selectedApproach }),
        ...(selectedDifficulty !== 'all' && { difficulty: selectedDifficulty }),
        ...(selectedSeverity !== 'all' && { severityLevel: selectedSeverity }),
        ...(searchQuery && { search: searchQuery }),
      });

      const response = await fetch(`/api/content?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data: ContentResponse = await response.json();
        setContent(data.data.content);
        setPagination(prev => ({
          ...prev,
          ...data.data.pagination
        }));
      } else {
        console.error('Failed to fetch content');
      }
    } catch (error) {
      console.error('Error fetching content:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch playlists
  const fetchPlaylists = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pagination.limit.toString(),
        sortBy,
        sortOrder,
        ...(selectedCategory !== 'all' && { category: selectedCategory }),
        ...(selectedApproach !== 'all' && { approach: selectedApproach }),
        ...(selectedDifficulty !== 'all' && { difficulty: selectedDifficulty }),
        ...(selectedSeverity !== 'all' && { severityLevel: selectedSeverity }),
        ...(searchQuery && { search: searchQuery }),
      });

      const response = await fetch(`/api/content/playlists/list?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data: PlaylistResponse = await response.json();
        setPlaylists(data.data.playlists);
        setPagination(prev => ({
          ...prev,
          ...data.data.pagination
        }));
      } else {
        console.error('Failed to fetch playlists');
      }
    } catch (error) {
      console.error('Error fetching playlists:', error);
    } finally {
      setLoading(false);
    }
  };

  // Effect to fetch data when filters change
  useEffect(() => {
    if (activeTab === 'content') {
      fetchContent();
    } else {
      fetchPlaylists();
    }
  }, [
    currentPage, 
    selectedCategory, 
    selectedType, 
    selectedApproach, 
    selectedDifficulty, 
    selectedSeverity,
    sortBy,
    sortOrder,
    searchQuery,
    activeTab
  ]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return <Video className="h-4 w-4" />;
      case 'audio': return <Headphones className="h-4 w-4" />;
      case 'article': return <BookOpen className="h-4 w-4" />;
      case 'playlist': return <Play className="h-4 w-4" />;
      default: return <BookOpen className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'video': return 'bg-red-100 text-red-800';
      case 'audio': return 'bg-green-100 text-green-800';
      case 'article': return 'bg-blue-100 text-blue-800';
      case 'playlist': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSeverityColor = (severity?: string) => {
    switch (severity) {
      case 'Mild': return 'bg-green-100 text-green-800';
      case 'Moderate': return 'bg-yellow-100 text-yellow-800';
      case 'Severe': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const renderContentCard = (item: ContentItem) => (
    <Card key={item.id} className="group hover:shadow-md transition-all duration-200 cursor-pointer">
      <div className="relative">
        <ImageWithFallback
          src={item.thumbnailUrl || '/placeholder-image.jpg'}
          alt={item.title}
          className="w-full h-48 object-cover rounded-t-lg"
          fallbackSrc="/placeholder-image.jpg"
        />
        <div className="absolute top-2 left-2 flex gap-1">
          <Badge className={`${getTypeColor(item.type)} text-xs`}>
            {getTypeIcon(item.type)}
            <span className="ml-1 capitalize">{item.type}</span>
          </Badge>
          {item.severityLevel && (
            <Badge className={`${getSeverityColor(item.severityLevel)} text-xs`}>
              {item.severityLevel}
            </Badge>
          )}
        </div>
        {item.duration && (
          <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
            <Clock className="h-3 w-3 inline mr-1" />
            {item.duration}
          </div>
        )}
      </div>
      
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-sm line-clamp-2 flex-1">{item.title}</h3>
          <Button variant="ghost" size="sm" className="shrink-0 ml-2">
            <Bookmark className="h-4 w-4" />
          </Button>
        </div>
        
        {item.description && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {item.description}
          </p>
        )}
        
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="flex items-center">
              <Star className="h-4 w-4 text-yellow-400 fill-current" />
              <span className="text-sm ml-1">{item.rating?.toFixed(1) || 'N/A'}</span>
            </div>
            <span className="text-xs text-muted-foreground">
              ({item._count?.contentRatings || 0} reviews)
            </span>
          </div>
          <span className="text-xs text-muted-foreground">
            {item.viewCount} views
          </span>
        </div>
        
        <div className="flex flex-wrap gap-1 mb-3">
          <Badge variant="outline" className="text-xs">
            {item.category}
          </Badge>
          <Badge variant="outline" className="text-xs capitalize">
            {item.approach}
          </Badge>
          {item.difficulty && (
            <Badge variant="outline" className="text-xs">
              {item.difficulty}
            </Badge>
          )}
        </div>
        
        {item.author && (
          <p className="text-xs text-muted-foreground mb-3">
            By {item.author}
          </p>
        )}
        
        <Button className="w-full" size="sm">
          <PlayCircle className="h-4 w-4 mr-2" />
          {item.type === 'article' ? 'Read' : item.type === 'playlist' ? 'View Playlist' : 'Play'}
        </Button>
      </CardContent>
    </Card>
  );

  const renderPlaylistCard = (playlist: PlaylistItem) => (
    <Card key={playlist.id} className="group hover:shadow-md transition-all duration-200 cursor-pointer">
      <div className="relative">
        <ImageWithFallback
          src={playlist.thumbnailUrl || '/placeholder-image.jpg'}
          alt={playlist.title}
          className="w-full h-48 object-cover rounded-t-lg"
        />
        <div className="absolute top-2 left-2 flex gap-1">
          <Badge className="bg-purple-100 text-purple-800 text-xs">
            <List className="h-3 w-3 mr-1" />
            Playlist
          </Badge>
          {playlist.severityLevel && (
            <Badge className={`${getSeverityColor(playlist.severityLevel)} text-xs`}>
              {playlist.severityLevel}
            </Badge>
          )}
        </div>
        <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
          {playlist.itemCount || 0} items
        </div>
      </div>
      
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-sm line-clamp-2 flex-1">{playlist.title}</h3>
          <Button variant="ghost" size="sm" className="shrink-0 ml-2">
            <Bookmark className="h-4 w-4" />
          </Button>
        </div>
        
        {playlist.description && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {playlist.description}
          </p>
        )}
        
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="flex items-center">
              <Star className="h-4 w-4 text-yellow-400 fill-current" />
              <span className="text-sm ml-1">{playlist.rating?.toFixed(1) || 'N/A'}</span>
            </div>
          </div>
          <span className="text-xs text-muted-foreground">
            {playlist.viewCount} views
          </span>
        </div>
        
        <div className="flex flex-wrap gap-1 mb-3">
          <Badge variant="outline" className="text-xs">
            {playlist.category}
          </Badge>
          <Badge variant="outline" className="text-xs capitalize">
            {playlist.approach}
          </Badge>
          {playlist.difficulty && (
            <Badge variant="outline" className="text-xs">
              {playlist.difficulty}
            </Badge>
          )}
        </div>
        
        {playlist.totalDuration && (
          <p className="text-xs text-muted-foreground mb-3">
            Total duration: {playlist.totalDuration} minutes
          </p>
        )}
        
        <Button className="w-full" size="sm">
          <PlayCircle className="h-4 w-4 mr-2" />
          View Playlist
        </Button>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto p-6">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="ghost"
              onClick={() => onNavigate('dashboard')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </div>
          
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">Content Library</h1>
              <p className="text-muted-foreground text-lg">
                Curated videos, guided meditations, articles, and playlists for your wellbeing journey
              </p>
            </div>
            
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search content..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-full lg:w-80"
              />
            </div>
          </div>

          {/* Approach preference message */}
          {user?.approach && user.approach !== selectedApproach && selectedApproach !== 'all' && (
            <div className="bg-accent/20 border border-accent/30 rounded-lg p-4 mt-4">
              <p className="text-sm">
                💡 <strong>Tip:</strong> You're currently viewing{' '}
                <span className="capitalize font-medium">{selectedApproach}</span> content.{' '}
                Your preferred approach is{' '}
                <span className="capitalize font-medium">{user.approach}</span>.{' '}
                <button 
                  onClick={() => setSelectedApproach(user.approach!)}
                  className="text-primary hover:underline font-medium"
                >
                  Switch to your preferred content
                </button>
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="content">Individual Content</TabsTrigger>
            <TabsTrigger value="playlists">Playlists & Series</TabsTrigger>
          </TabsList>
          
          <TabsContent value="content" className="space-y-6">
            {/* Filters */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Filters:</span>
                <div className="flex items-center gap-2 ml-auto">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                  >
                    <Grid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {/* Category Filter */}
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category} className="capitalize">
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Type Filter */}
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {types.map((type) => (
                      <SelectItem key={type} value={type} className="capitalize">
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Approach Filter */}
                <Select value={selectedApproach} onValueChange={setSelectedApproach}>
                  <SelectTrigger>
                    <SelectValue placeholder="Approach" />
                  </SelectTrigger>
                  <SelectContent>
                    {approaches.map((approach) => (
                      <SelectItem key={approach.value} value={approach.value}>
                        {approach.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Difficulty Filter */}
                <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
                  <SelectTrigger>
                    <SelectValue placeholder="Difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    {difficulties.map((difficulty) => (
                      <SelectItem key={difficulty} value={difficulty}>
                        {difficulty}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Severity Filter */}
                <Select value={selectedSeverity} onValueChange={setSelectedSeverity}>
                  <SelectTrigger>
                    <SelectValue placeholder="Severity" />
                  </SelectTrigger>
                  <SelectContent>
                    {severityLevels.map((severity) => (
                      <SelectItem key={severity} value={severity}>
                        {severity}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Sort Filter */}
                <Select value={`${sortBy}-${sortOrder}`} onValueChange={(value) => {
                  const [by, order] = value.split('-');
                  setSortBy(by);
                  setSortOrder(order);
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="createdAt-desc">Newest First</SelectItem>
                    <SelectItem value="createdAt-asc">Oldest First</SelectItem>
                    <SelectItem value="rating-desc">Highest Rated</SelectItem>
                    <SelectItem value="viewCount-desc">Most Popular</SelectItem>
                    <SelectItem value="title-asc">Title A-Z</SelectItem>
                    <SelectItem value="title-desc">Title Z-A</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Content Grid */}
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <div className="h-48 bg-gray-200 rounded-t-lg" />
                    <CardContent className="p-4 space-y-2">
                      <div className="h-4 bg-gray-200 rounded" />
                      <div className="h-4 bg-gray-200 rounded w-3/4" />
                      <div className="h-3 bg-gray-200 rounded w-1/2" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className={viewMode === 'grid' ? 
                "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" : 
                "space-y-4"
              }>
                {content.map(renderContentCard)}
              </div>
            )}

            {/* Empty State */}
            {!loading && content.length === 0 && (
              <div className="text-center py-12">
                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No content found</h3>
                <p className="text-muted-foreground mb-4">
                  Try adjusting your search or filters to find what you're looking for.
                </p>
                <Button 
                  variant="outline"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('all');
                    setSelectedType('all');
                    setSelectedApproach('all');
                    setSelectedDifficulty('all');
                    setSelectedSeverity('all');
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="playlists" className="space-y-6">
            {/* Playlist Filters (similar to content but without type filter) */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Filters:</span>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {/* Similar filters but without type */}
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category} className="capitalize">
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedApproach} onValueChange={setSelectedApproach}>
                  <SelectTrigger>
                    <SelectValue placeholder="Approach" />
                  </SelectTrigger>
                  <SelectContent>
                    {approaches.map((approach) => (
                      <SelectItem key={approach.value} value={approach.value}>
                        {approach.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
                  <SelectTrigger>
                    <SelectValue placeholder="Difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    {difficulties.map((difficulty) => (
                      <SelectItem key={difficulty} value={difficulty}>
                        {difficulty}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedSeverity} onValueChange={setSelectedSeverity}>
                  <SelectTrigger>
                    <SelectValue placeholder="Severity" />
                  </SelectTrigger>
                  <SelectContent>
                    {severityLevels.map((severity) => (
                      <SelectItem key={severity} value={severity}>
                        {severity}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={`${sortBy}-${sortOrder}`} onValueChange={(value) => {
                  const [by, order] = value.split('-');
                  setSortBy(by);
                  setSortOrder(order);
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="createdAt-desc">Newest First</SelectItem>
                    <SelectItem value="createdAt-asc">Oldest First</SelectItem>
                    <SelectItem value="rating-desc">Highest Rated</SelectItem>
                    <SelectItem value="viewCount-desc">Most Popular</SelectItem>
                    <SelectItem value="title-asc">Title A-Z</SelectItem>
                    <SelectItem value="title-desc">Title Z-A</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Playlist Grid */}
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <div className="h-48 bg-gray-200 rounded-t-lg" />
                    <CardContent className="p-4 space-y-2">
                      <div className="h-4 bg-gray-200 rounded" />
                      <div className="h-4 bg-gray-200 rounded w-3/4" />
                      <div className="h-3 bg-gray-200 rounded w-1/2" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {playlists.map(renderPlaylistCard)}
              </div>
            )}

            {/* Empty State for Playlists */}
            {!loading && playlists.length === 0 && (
              <div className="text-center py-12">
                <List className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No playlists found</h3>
                <p className="text-muted-foreground mb-4">
                  Try adjusting your search or filters to find what you're looking for.
                </p>
                <Button 
                  variant="outline"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('all');
                    setSelectedApproach('all');
                    setSelectedDifficulty('all');
                    setSelectedSeverity('all');
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <Button
              variant="outline"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            
            <div className="flex items-center gap-1">
              {[...Array(Math.min(5, pagination.pages))].map((_, i) => {
                const page = i + 1;
                return (
                  <Button
                    key={page}
                    variant={currentPage === page ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </Button>
                );
              })}
            </div>
            
            <Button
              variant="outline"
              onClick={() => setCurrentPage(prev => Math.min(pagination.pages, prev + 1))}
              disabled={currentPage === pagination.pages}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
