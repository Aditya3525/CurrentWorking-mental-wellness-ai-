import { 
  Calendar,
  CheckCircle,
  Clock,
  Edit,
  Eye,
  Filter,
  MoreHorizontal,
  Plus,
  Search,
  Trash2,
  Upload,
  Video,
  FileText,
  Headphones,
  File,
  List,
  Grid,
  Download,
  Share2,
  AlertCircle,
  PlayCircle
} from 'lucide-react';
import React, { useState, useEffect, useMemo } from 'react';

// Types
interface ContentItem {
  id: string;
  title: string;
  description: string;
  type: 'video' | 'audio' | 'article' | 'pdf' | 'playlist';
  status: 'draft' | 'published' | 'scheduled' | 'archived' | 'pending_approval';
  category: string;
  subcategory: string;
  approach: 'western' | 'eastern' | 'hybrid';
  severity: 'low' | 'medium' | 'high';
  tags: string[];
  author: string;
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
  scheduledFor?: Date;
  duration?: string;
  fileSize?: string;
  views: number;
  rating: number;
  thumbnail?: string;
  url?: string;
  filePath?: string;
  isBookmarked: boolean;
  contentCount?: number; // For playlists
}

interface FilterOptions {
  search: string;
  type: string;
  status: string;
  category: string;
  approach: string;
  severity: string;
  author: string;
  dateRange: {
    start?: Date;
    end?: Date;
  };
}

interface SortOptions {
  field: keyof ContentItem;
  direction: 'asc' | 'desc';
}

interface AdminContentListProps {
  onNavigate: (page: string, contentId?: string) => void;
}

// Mock data - in real app, this would come from API
const mockContentData: ContentItem[] = [
  {
    id: '1',
    title: 'Mindful Breathing Meditation',
    description: 'A comprehensive guide to breathing techniques for stress relief and mindfulness.',
    type: 'video',
    status: 'published',
    category: 'Meditation',
    subcategory: 'Breathing',
    approach: 'hybrid',
    severity: 'low',
    tags: ['breathing', 'meditation', 'stress-relief', 'beginner'],
    author: 'Dr. Sarah Johnson',
    createdAt: new Date('2024-03-15'),
    updatedAt: new Date('2024-03-16'),
    publishedAt: new Date('2024-03-16'),
    duration: '15:30',
    views: 1247,
    rating: 4.8,
    thumbnail: '/api/placeholder/300/200',
    url: 'https://youtube.com/watch?v=example1',
    isBookmarked: false
  },
  {
    id: '2',
    title: 'Understanding Anxiety: A Clinical Perspective',
    description: 'An in-depth article exploring the psychological and physiological aspects of anxiety disorders.',
    type: 'article',
    status: 'published',
    category: 'Psychology',
    subcategory: 'Anxiety',
    approach: 'western',
    severity: 'medium',
    tags: ['anxiety', 'clinical', 'psychology', 'disorders'],
    author: 'Prof. Michael Chen',
    createdAt: new Date('2024-03-10'),
    updatedAt: new Date('2024-03-12'),
    publishedAt: new Date('2024-03-12'),
    views: 892,
    rating: 4.6,
    isBookmarked: true
  },
  {
    id: '3',
    title: 'Relaxing Nature Sounds Collection',
    description: 'A curated collection of calming nature sounds for meditation and sleep.',
    type: 'audio',
    status: 'published',
    category: 'Sleep',
    subcategory: 'Sounds',
    approach: 'eastern',
    severity: 'low',
    tags: ['nature', 'sounds', 'sleep', 'relaxation'],
    author: 'Sound Therapy Team',
    createdAt: new Date('2024-03-08'),
    updatedAt: new Date('2024-03-08'),
    publishedAt: new Date('2024-03-08'),
    duration: '60:00',
    fileSize: '45.2 MB',
    views: 2156,
    rating: 4.9,
    isBookmarked: false
  },
  {
    id: '4',
    title: 'Cognitive Behavioral Therapy Workbook',
    description: 'A comprehensive PDF workbook with CBT exercises and worksheets.',
    type: 'pdf',
    status: 'draft',
    category: 'Therapy',
    subcategory: 'CBT',
    approach: 'western',
    severity: 'high',
    tags: ['cbt', 'therapy', 'workbook', 'exercises'],
    author: 'Dr. Emily Rodriguez',
    createdAt: new Date('2024-03-14'),
    updatedAt: new Date('2024-03-15'),
    fileSize: '12.8 MB',
    views: 0,
    rating: 0,
    isBookmarked: false
  },
  {
    id: '5',
    title: 'Complete Mindfulness Journey',
    description: 'A structured playlist combining videos, audios, and articles for a comprehensive mindfulness experience.',
    type: 'playlist',
    status: 'scheduled',
    category: 'Mindfulness',
    subcategory: 'Journey',
    approach: 'hybrid',
    severity: 'medium',
    tags: ['mindfulness', 'journey', 'comprehensive', 'playlist'],
    author: 'Mindfulness Team',
    createdAt: new Date('2024-03-16'),
    updatedAt: new Date('2024-03-16'),
    scheduledFor: new Date('2024-03-20'),
    contentCount: 12,
    views: 0,
    rating: 0,
    isBookmarked: false
  }
];

const categories = [
  'Meditation', 'Psychology', 'Sleep', 'Therapy', 'Mindfulness', 
  'Stress Management', 'Anxiety', 'Depression', 'Self-Care', 'Wellness'
];

const authors = [
  'Dr. Sarah Johnson', 'Prof. Michael Chen', 'Sound Therapy Team', 
  'Dr. Emily Rodriguez', 'Mindfulness Team'
];

export const AdminContentList: React.FC<AdminContentListProps> = ({ onNavigate }) => {
  const [contentData, setContentData] = useState<ContentItem[]>(mockContentData);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [showFilters, setShowFilters] = useState(false);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // Filters
  const [filters, setFilters] = useState<FilterOptions>({
    search: '',
    type: 'all',
    status: 'all',
    category: 'all',
    approach: 'all',
    severity: 'all',
    author: 'all',
    dateRange: {}
  });
  
  // Sorting
  const [sort, setSort] = useState<SortOptions>({
    field: 'updatedAt',
    direction: 'desc'
  });

  // Filter and sort content
  const filteredAndSortedContent = useMemo(() => {
    let filtered = contentData.filter(item => {
      const matchesSearch = filters.search === '' || 
        item.title.toLowerCase().includes(filters.search.toLowerCase()) ||
        item.description.toLowerCase().includes(filters.search.toLowerCase()) ||
        item.tags.some(tag => tag.toLowerCase().includes(filters.search.toLowerCase()));
      
      const matchesType = filters.type === 'all' || item.type === filters.type;
      const matchesStatus = filters.status === 'all' || item.status === filters.status;
      const matchesCategory = filters.category === 'all' || item.category === filters.category;
      const matchesApproach = filters.approach === 'all' || item.approach === filters.approach;
      const matchesSeverity = filters.severity === 'all' || item.severity === filters.severity;
      const matchesAuthor = filters.author === 'all' || item.author === filters.author;
      
      return matchesSearch && matchesType && matchesStatus && 
             matchesCategory && matchesApproach && matchesSeverity && matchesAuthor;
    });

    // Sort
    filtered.sort((a, b) => {
      const aValue = a[sort.field];
      const bValue = b[sort.field];
      
      if (aValue === undefined || bValue === undefined) return 0;
      
      if (aValue < bValue) return sort.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sort.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [contentData, filters, sort]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedContent.length / itemsPerPage);
  const paginatedContent = filteredAndSortedContent.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSelectAll = () => {
    if (selectedItems.length === paginatedContent.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(paginatedContent.map(item => item.id));
    }
  };

  const handleSelectItem = (itemId: string) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleBulkAction = async (action: string) => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      switch (action) {
        case 'publish':
          setContentData(prev => prev.map(item => 
            selectedItems.includes(item.id) 
              ? { ...item, status: 'published' as const, publishedAt: new Date() }
              : item
          ));
          break;
        case 'archive':
          setContentData(prev => prev.map(item => 
            selectedItems.includes(item.id) 
              ? { ...item, status: 'archived' as const }
              : item
          ));
          break;
        case 'delete':
          setContentData(prev => prev.filter(item => !selectedItems.includes(item.id)));
          break;
      }
      
      setSelectedItems([]);
    } catch (error) {
      console.error('Bulk action failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSort = (field: keyof ContentItem) => {
    setSort(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const getTypeIcon = (type: ContentItem['type']) => {
    switch (type) {
      case 'video': return <Video className="w-4 h-4" />;
      case 'audio': return <Headphones className="w-4 h-4" />;
      case 'article': return <FileText className="w-4 h-4" />;
      case 'pdf': return <File className="w-4 h-4" />;
      case 'playlist': return <PlayCircle className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: ContentItem['status']) => {
    switch (status) {
      case 'published': return 'bg-green-500';
      case 'draft': return 'bg-gray-500';
      case 'scheduled': return 'bg-blue-500';
      case 'archived': return 'bg-yellow-500';
      case 'pending_approval': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Content Management</h1>
          <p className="text-gray-400 mt-1">
            Manage all content across your platform
          </p>
        </div>
        <div className="flex items-center space-x-3 mt-4 sm:mt-0">
          <button
            onClick={() => onNavigate('content-upload')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Create Content</span>
          </button>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 ${
              showFilters ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            <Filter className="w-4 h-4" />
            <span>Filters</span>
          </button>
        </div>
      </div>

      {/* Search and Controls */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
        <div className="flex flex-col lg:flex-row lg:items-center space-y-4 lg:space-y-0 lg:space-x-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search content by title, description, or tags..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg pl-10 pr-4 py-2 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-400 hover:text-white'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-400 hover:text-white'
              }`}
            >
              <Grid className="w-4 h-4" />
            </button>
          </div>

          {/* Items per page */}
          <select
            value={itemsPerPage}
            onChange={(e) => setItemsPerPage(Number(e.target.value))}
            className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-gray-100"
          >
            <option value={10}>10 per page</option>
            <option value={25}>25 per page</option>
            <option value={50}>50 per page</option>
          </select>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <select
                value={filters.type}
                onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
                className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-gray-100"
              >
                <option value="all">All Types</option>
                <option value="video">Video</option>
                <option value="audio">Audio</option>
                <option value="article">Article</option>
                <option value="pdf">PDF</option>
                <option value="playlist">Playlist</option>
              </select>

              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-gray-100"
              >
                <option value="all">All Statuses</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
                <option value="scheduled">Scheduled</option>
                <option value="archived">Archived</option>
                <option value="pending_approval">Pending Approval</option>
              </select>

              <select
                value={filters.category}
                onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-gray-100"
              >
                <option value="all">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>

              <select
                value={filters.author}
                onChange={(e) => setFilters(prev => ({ ...prev, author: e.target.value }))}
                className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-gray-100"
              >
                <option value="all">All Authors</option>
                {authors.map(author => (
                  <option key={author} value={author}>{author}</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Bulk Actions */}
      {selectedItems.length > 0 && (
        <div className="bg-blue-900 border border-blue-700 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-blue-100">
              {selectedItems.length} item{selectedItems.length !== 1 ? 's' : ''} selected
            </span>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleBulkAction('publish')}
                disabled={isLoading}
                className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                Publish
              </button>
              <button
                onClick={() => handleBulkAction('archive')}
                disabled={isLoading}
                className="px-3 py-1 bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors disabled:opacity-50"
              >
                Archive
              </button>
              <button
                onClick={() => handleBulkAction('delete')}
                disabled={isLoading}
                className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Content Table/Grid */}
      {viewMode === 'list' ? (
        <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-750">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedItems.length === paginatedContent.length && paginatedContent.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-gray-600 bg-gray-700"
                  />
                </th>
                <th 
                  className="px-4 py-3 text-left text-gray-300 cursor-pointer hover:text-white"
                  onClick={() => handleSort('title')}
                >
                  Content
                </th>
                <th className="px-4 py-3 text-left text-gray-300">Type</th>
                <th 
                  className="px-4 py-3 text-left text-gray-300 cursor-pointer hover:text-white"
                  onClick={() => handleSort('status')}
                >
                  Status
                </th>
                <th className="px-4 py-3 text-left text-gray-300">Category</th>
                <th className="px-4 py-3 text-left text-gray-300">Author</th>
                <th 
                  className="px-4 py-3 text-left text-gray-300 cursor-pointer hover:text-white"
                  onClick={() => handleSort('views')}
                >
                  Views
                </th>
                <th 
                  className="px-4 py-3 text-left text-gray-300 cursor-pointer hover:text-white"
                  onClick={() => handleSort('updatedAt')}
                >
                  Updated
                </th>
                <th className="px-4 py-3 text-left text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedContent.map((item, index) => (
                <tr key={item.id} className="border-t border-gray-700 hover:bg-gray-750">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedItems.includes(item.id)}
                      onChange={() => handleSelectItem(item.id)}
                      className="rounded border-gray-600 bg-gray-700"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center space-x-3">
                      {item.thumbnail && (
                        <img
                          src={item.thumbnail}
                          alt={item.title}
                          className="w-12 h-8 object-cover rounded"
                        />
                      )}
                      <div>
                        <p className="font-medium text-white truncate max-w-xs">{item.title}</p>
                        <p className="text-sm text-gray-400 truncate max-w-xs">{item.description}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center space-x-2">
                      {getTypeIcon(item.type)}
                      <span className="text-gray-300 capitalize">{item.type}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-white ${getStatusColor(item.status)}`}>
                      {item.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-300">{item.category}</td>
                  <td className="px-4 py-3 text-gray-300">{item.author}</td>
                  <td className="px-4 py-3 text-gray-300">{item.views.toLocaleString()}</td>
                  <td className="px-4 py-3 text-gray-300">{formatDate(item.updatedAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => onNavigate('content-edit', item.id)}
                        className="p-1 text-blue-400 hover:text-blue-300"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        className="p-1 text-green-400 hover:text-green-300"
                        title="Preview"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        className="p-1 text-gray-400 hover:text-white"
                        title="More options"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {paginatedContent.map((item) => (
            <div key={item.id} className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden hover:border-gray-600 transition-colors">
              <div className="relative">
                {item.thumbnail && (
                  <img
                    src={item.thumbnail}
                    alt={item.title}
                    className="w-full h-32 object-cover"
                  />
                )}
                <div className="absolute top-2 left-2">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-white ${getStatusColor(item.status)}`}>
                    {item.status.replace('_', ' ')}
                  </span>
                </div>
                <div className="absolute top-2 right-2">
                  <input
                    type="checkbox"
                    checked={selectedItems.includes(item.id)}
                    onChange={() => handleSelectItem(item.id)}
                    className="rounded border-gray-600 bg-gray-700"
                  />
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-center space-x-2 mb-2">
                  {getTypeIcon(item.type)}
                  <span className="text-sm text-gray-400 capitalize">{item.type}</span>
                  {item.duration && (
                    <>
                      <span className="text-gray-600">•</span>
                      <span className="text-sm text-gray-400">{item.duration}</span>
                    </>
                  )}
                </div>
                <h3 className="font-medium text-white mb-2 line-clamp-2">{item.title}</h3>
                <p className="text-sm text-gray-400 mb-3 line-clamp-2">{item.description}</p>
                <div className="flex items-center justify-between">
                  <div className="text-xs text-gray-500">
                    <p>{item.views.toLocaleString()} views</p>
                    <p>{formatDate(item.updatedAt)}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => onNavigate('content-edit', item.id)}
                      className="p-1 text-blue-400 hover:text-blue-300"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      className="p-1 text-green-400 hover:text-green-300"
                      title="Preview"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-gray-400">
            Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredAndSortedContent.length)} of {filteredAndSortedContent.length} results
          </p>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            {[...Array(totalPages)].map((_, index) => {
              const page = index + 1;
              if (
                page === 1 ||
                page === totalPages ||
                (page >= currentPage - 2 && page <= currentPage + 2)
              ) {
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-2 rounded-lg ${
                      currentPage === page
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {page}
                  </button>
                );
              } else if (
                page === currentPage - 3 ||
                page === currentPage + 3
              ) {
                return <span key={page} className="text-gray-500">...</span>;
              }
              return null;
            })}
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Empty State */}
      {filteredAndSortedContent.length === 0 && (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-12 text-center">
          <FileText className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">No content found</h3>
          <p className="text-gray-400 mb-6">
            {filters.search || filters.type !== 'all' || filters.status !== 'all'
              ? 'Try adjusting your filters or search terms.'
              : 'Get started by creating your first piece of content.'
            }
          </p>
          <button
            onClick={() => onNavigate('content-upload')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create Content
          </button>
        </div>
      )}
    </div>
  );
};