import { 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Copy, 
  Eye, 
  Clock,
  Users,
  Star,
  TrendingUp,
  Grid3X3,
  List,
  ChevronDown,
  ChevronUp,
  Activity,
  Heart,
  Brain,
  Zap,
  TreePine,
  Wind,
  CheckCircle,
  AlertCircle,
  Download,
  Upload,
  Share2,
  BarChart3,
  Archive
} from 'lucide-react';
import React, { useState, useEffect } from 'react';

// Types
interface Practice {
  id: string;
  title: string;
  type: 'meditation' | 'breathing' | 'mindfulness' | 'movement' | 'series';
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  category: string;
  subcategory: string;
  duration: number; // in minutes
  instructor: string;
  status: 'draft' | 'published' | 'archived' | 'under_review';
  description: string;
  preparationTime: number; // in minutes
  windDownTime: number; // in minutes
  equipment: string[];
  spaceRequirement: 'small' | 'medium' | 'large' | 'any';
  prerequisites: string[];
  benefits: string[];
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
  
  // Analytics
  analytics: {
    totalSessions: number;
    uniqueUsers: number;
    averageCompletion: number;
    averageRating: number;
    totalRatings: number;
    popularityScore: number;
    effectivenessScore: number;
    engagementRate: number;
  };
  
  // Content
  hasAudioGuide: boolean;
  hasVisualAids: boolean;
  hasProgressTracking: boolean;
  breathingPattern?: {
    inhale: number;
    hold: number;
    exhale: number;
    pause: number;
  };
  
  // Series specific
  seriesId?: string;
  seriesPosition?: number;
  isPartOfSeries: boolean;
}

interface PracticeFilters {
  type: string;
  difficulty: string;
  category: string;
  instructor: string;
  status: string;
  duration: string;
  equipment: string;
  spaceRequirement: string;
  hasAudioGuide: boolean | null;
  hasVisualAids: boolean | null;
}

interface AdminPracticeListProps {
  onNavigate: (page: string, practiceId?: string) => void;
}

// Mock data
const mockPractices: Practice[] = [
  {
    id: '1',
    title: 'Morning Breath Awareness Meditation',
    type: 'meditation',
    difficulty: 'beginner',
    category: 'Mindfulness',
    subcategory: 'Breathing',
    duration: 15,
    instructor: 'Dr. Sarah Johnson',
    status: 'published',
    description: 'Start your day with focused breathing and gentle awareness cultivation',
    preparationTime: 2,
    windDownTime: 3,
    equipment: ['meditation cushion'],
    spaceRequirement: 'small',
    prerequisites: [],
    benefits: ['stress reduction', 'focus improvement', 'morning energy'],
    tags: ['morning', 'beginner-friendly', 'breath work', 'daily practice'],
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-02-15'),
    publishedAt: new Date('2024-02-10'),
    analytics: {
      totalSessions: 2847,
      uniqueUsers: 1532,
      averageCompletion: 87.5,
      averageRating: 4.6,
      totalRatings: 324,
      popularityScore: 92,
      effectivenessScore: 89,
      engagementRate: 73.2
    },
    hasAudioGuide: true,
    hasVisualAids: false,
    hasProgressTracking: true,
    isPartOfSeries: false
  },
  {
    id: '2',
    title: '4-7-8 Breathing Technique',
    type: 'breathing',
    difficulty: 'intermediate',
    category: 'Stress Relief',
    subcategory: 'Breathing Patterns',
    duration: 10,
    instructor: 'Dr. Michael Chen',
    status: 'published',
    description: 'Advanced breathing pattern for deep relaxation and anxiety relief',
    preparationTime: 1,
    windDownTime: 2,
    equipment: [],
    spaceRequirement: 'any',
    prerequisites: ['basic-breathing-awareness'],
    benefits: ['anxiety relief', 'improved sleep', 'stress reduction'],
    tags: ['breathing pattern', '4-7-8', 'anxiety', 'relaxation'],
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-02-20'),
    publishedAt: new Date('2024-01-25'),
    analytics: {
      totalSessions: 1923,
      uniqueUsers: 1087,
      averageCompletion: 94.2,
      averageRating: 4.8,
      totalRatings: 287,
      popularityScore: 85,
      effectivenessScore: 95,
      engagementRate: 81.4
    },
    hasAudioGuide: true,
    hasVisualAids: true,
    hasProgressTracking: true,
    breathingPattern: {
      inhale: 4,
      hold: 7,
      exhale: 8,
      pause: 2
    },
    isPartOfSeries: true,
    seriesId: 'breathing-mastery-series',
    seriesPosition: 3
  },
  {
    id: '3',
    title: 'Mindful Walking Practice',
    type: 'mindfulness',
    difficulty: 'beginner',
    category: 'Movement',
    subcategory: 'Walking Meditation',
    duration: 20,
    instructor: 'Lisa Thompson',
    status: 'published',
    description: 'Cultivate awareness through slow, intentional walking meditation',
    preparationTime: 3,
    windDownTime: 2,
    equipment: ['comfortable shoes'],
    spaceRequirement: 'medium',
    prerequisites: [],
    benefits: ['body awareness', 'present moment focus', 'gentle exercise'],
    tags: ['walking', 'mindfulness', 'outdoor', 'movement'],
    createdAt: new Date('2024-02-05'),
    updatedAt: new Date('2024-02-18'),
    publishedAt: new Date('2024-02-12'),
    analytics: {
      totalSessions: 1456,
      uniqueUsers: 892,
      averageCompletion: 78.9,
      averageRating: 4.4,
      totalRatings: 156,
      popularityScore: 76,
      effectivenessScore: 82,
      engagementRate: 65.7
    },
    hasAudioGuide: true,
    hasVisualAids: true,
    hasProgressTracking: false,
    isPartOfSeries: false
  },
  {
    id: '4',
    title: 'Gentle Morning Yoga Flow',
    type: 'movement',
    difficulty: 'beginner',
    category: 'Movement',
    subcategory: 'Yoga',
    duration: 25,
    instructor: 'Emma Rodriguez',
    status: 'published',
    description: 'Gentle yoga sequence to energize your body and calm your mind',
    preparationTime: 5,
    windDownTime: 5,
    equipment: ['yoga mat', 'yoga block', 'yoga strap'],
    spaceRequirement: 'medium',
    prerequisites: [],
    benefits: ['flexibility', 'strength', 'balance', 'relaxation'],
    tags: ['yoga', 'morning', 'gentle', 'flow'],
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-02-14'),
    publishedAt: new Date('2024-02-01'),
    analytics: {
      totalSessions: 3245,
      uniqueUsers: 1876,
      averageCompletion: 82.3,
      averageRating: 4.7,
      totalRatings: 421,
      popularityScore: 95,
      effectivenessScore: 87,
      engagementRate: 79.1
    },
    hasAudioGuide: true,
    hasVisualAids: true,
    hasProgressTracking: true,
    isPartOfSeries: true,
    seriesId: 'morning-wellness-series',
    seriesPosition: 2
  },
  {
    id: '5',
    title: 'Stress Relief Series',
    type: 'series',
    difficulty: 'intermediate',
    category: 'Stress Management',
    subcategory: 'Multi-Practice Series',
    duration: 180, // Total duration for series
    instructor: 'Dr. Sarah Johnson',
    status: 'published',
    description: 'Comprehensive 7-day stress relief program combining multiple techniques',
    preparationTime: 5,
    windDownTime: 10,
    equipment: ['meditation cushion', 'yoga mat'],
    spaceRequirement: 'medium',
    prerequisites: ['basic-meditation', 'breathing-basics'],
    benefits: ['stress reduction', 'emotional regulation', 'sleep improvement'],
    tags: ['series', 'stress relief', '7-day program', 'comprehensive'],
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-02-22'),
    publishedAt: new Date('2024-01-30'),
    analytics: {
      totalSessions: 892,
      uniqueUsers: 234,
      averageCompletion: 65.4,
      averageRating: 4.9,
      totalRatings: 89,
      popularityScore: 88,
      effectivenessScore: 94,
      engagementRate: 71.8
    },
    hasAudioGuide: true,
    hasVisualAids: true,
    hasProgressTracking: true,
    isPartOfSeries: false
  },
  {
    id: '6',
    title: 'Body Scan Relaxation',
    type: 'meditation',
    difficulty: 'beginner',
    category: 'Relaxation',
    subcategory: 'Body Awareness',
    duration: 12,
    instructor: 'Dr. Michael Chen',
    status: 'draft',
    description: 'Progressive body scan technique for deep relaxation and tension release',
    preparationTime: 2,
    windDownTime: 3,
    equipment: ['yoga mat', 'blanket'],
    spaceRequirement: 'medium',
    prerequisites: [],
    benefits: ['tension release', 'body awareness', 'deep relaxation'],
    tags: ['body scan', 'relaxation', 'tension relief', 'awareness'],
    createdAt: new Date('2024-02-20'),
    updatedAt: new Date('2024-02-22'),
    analytics: {
      totalSessions: 0,
      uniqueUsers: 0,
      averageCompletion: 0,
      averageRating: 0,
      totalRatings: 0,
      popularityScore: 0,
      effectivenessScore: 0,
      engagementRate: 0
    },
    hasAudioGuide: false,
    hasVisualAids: false,
    hasProgressTracking: false,
    isPartOfSeries: false
  }
];

const practiceCategories = [
  'Mindfulness', 'Stress Management', 'Sleep', 'Anxiety Relief', 
  'Movement', 'Relaxation', 'Focus', 'Emotional Regulation'
];

const equipmentOptions = [
  'meditation cushion', 'yoga mat', 'yoga block', 'yoga strap', 
  'blanket', 'timer', 'comfortable shoes', 'water bottle'
];

export const AdminPracticeList: React.FC<AdminPracticeListProps> = ({ onNavigate }) => {
  const [practices, setPractices] = useState<Practice[]>(mockPractices);
  const [filteredPractices, setFilteredPractices] = useState<Practice[]>(mockPractices);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPractices, setSelectedPractices] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [sortBy, setSortBy] = useState<keyof Practice>('updatedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [showFilters, setShowFilters] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [filters, setFilters] = useState<PracticeFilters>({
    type: 'all',
    difficulty: 'all',
    category: 'all',
    instructor: 'all',
    status: 'all',
    duration: 'all',
    equipment: 'all',
    spaceRequirement: 'all',
    hasAudioGuide: null,
    hasVisualAids: null
  });

  // Filter and search logic
  useEffect(() => {
    const filtered = practices.filter(practice => {
      const matchesSearch = practice.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           practice.instructor.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           practice.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           practice.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesType = filters.type === 'all' || practice.type === filters.type;
      const matchesDifficulty = filters.difficulty === 'all' || practice.difficulty === filters.difficulty;
      const matchesCategory = filters.category === 'all' || practice.category === filters.category;
      const matchesInstructor = filters.instructor === 'all' || practice.instructor === filters.instructor;
      const matchesStatus = filters.status === 'all' || practice.status === filters.status;
      
      const matchesDuration = filters.duration === 'all' || 
        (filters.duration === 'short' && practice.duration <= 10) ||
        (filters.duration === 'medium' && practice.duration > 10 && practice.duration <= 20) ||
        (filters.duration === 'long' && practice.duration > 20);
      
      const matchesEquipment = filters.equipment === 'all' || 
        practice.equipment.some(eq => eq.includes(filters.equipment)) ||
        (filters.equipment === 'none' && practice.equipment.length === 0);
      
      const matchesSpace = filters.spaceRequirement === 'all' || practice.spaceRequirement === filters.spaceRequirement;
      
      const matchesAudioGuide = filters.hasAudioGuide === null || practice.hasAudioGuide === filters.hasAudioGuide;
      const matchesVisualAids = filters.hasVisualAids === null || practice.hasVisualAids === filters.hasVisualAids;

      return matchesSearch && matchesType && matchesDifficulty && matchesCategory && 
             matchesInstructor && matchesStatus && matchesDuration && matchesEquipment && 
             matchesSpace && matchesAudioGuide && matchesVisualAids;
    });

    // Sort
    filtered.sort((a, b) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];
      
      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredPractices(filtered);
    setCurrentPage(1);
  }, [practices, searchQuery, filters, sortBy, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(filteredPractices.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedPractices = filteredPractices.slice(startIndex, startIndex + itemsPerPage);

  const handleSort = (field: keyof Practice) => {
    if (sortBy === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const handleSelectAll = () => {
    if (selectedPractices.size === paginatedPractices.length) {
      setSelectedPractices(new Set());
    } else {
      setSelectedPractices(new Set(paginatedPractices.map(p => p.id)));
    }
  };

  const handleSelectPractice = (practiceId: string) => {
    const newSelected = new Set(selectedPractices);
    if (newSelected.has(practiceId)) {
      newSelected.delete(practiceId);
    } else {
      newSelected.add(practiceId);
    }
    setSelectedPractices(newSelected);
  };

  const handleBulkAction = async (action: 'publish' | 'archive' | 'delete' | 'duplicate') => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setPractices(prev => {
        return prev.map(practice => {
          if (selectedPractices.has(practice.id)) {
            switch (action) {
              case 'publish':
                return { ...practice, status: 'published' as const, publishedAt: new Date() };
              case 'archive':
                return { ...practice, status: 'archived' as const };
              case 'delete':
                return practice; // Will be filtered out below
              case 'duplicate':
                return practice; // Will add duplicates below
              default:
                return practice;
            }
          }
          return practice;
        }).filter(practice => !(action === 'delete' && selectedPractices.has(practice.id)));
      });
      
      setSelectedPractices(new Set());
    } catch (error) {
      console.error(`Failed to ${action} practices:`, error);
    } finally {
      setIsLoading(false);
    }
  };

  const getPracticeTypeIcon = (type: Practice['type']) => {
    switch (type) {
      case 'meditation': return <Brain className="w-4 h-4" />;
      case 'breathing': return <Wind className="w-4 h-4" />;
      case 'mindfulness': return <Heart className="w-4 h-4" />;
      case 'movement': return <Activity className="w-4 h-4" />;
      case 'series': return <TreePine className="w-4 h-4" />;
      default: return <Zap className="w-4 h-4" />;
    }
  };

  const getDifficultyColor = (difficulty: Practice['difficulty']) => {
    switch (difficulty) {
      case 'beginner': return 'text-green-400 bg-green-900';
      case 'intermediate': return 'text-yellow-400 bg-yellow-900';
      case 'advanced': return 'text-orange-400 bg-orange-900';
      case 'expert': return 'text-red-400 bg-red-900';
      default: return 'text-gray-400 bg-gray-900';
    }
  };

  const getStatusColor = (status: Practice['status']) => {
    switch (status) {
      case 'published': return 'text-green-400 bg-green-900';
      case 'draft': return 'text-gray-400 bg-gray-900';
      case 'archived': return 'text-yellow-400 bg-yellow-900';
      case 'under_review': return 'text-blue-400 bg-blue-900';
      default: return 'text-gray-400 bg-gray-900';
    }
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  };

  const renderGridView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {paginatedPractices.map(practice => (
        <div key={practice.id} className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden hover:border-gray-600 transition-colors">
          <div className="relative">
            <div className="aspect-video bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
              <div className="text-white text-4xl">
                {getPracticeTypeIcon(practice.type)}
              </div>
            </div>
            <div className="absolute top-2 left-2">
              <input
                type="checkbox"
                checked={selectedPractices.has(practice.id)}
                onChange={() => handleSelectPractice(practice.id)}
                className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
              />
            </div>
            <div className="absolute top-2 right-2 flex items-center space-x-1">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(practice.difficulty)}`}>
                {practice.difficulty}
              </span>
            </div>
            <div className="absolute bottom-2 left-2 flex items-center space-x-1 text-white text-xs">
              <Clock className="w-3 h-3" />
              <span>{formatDuration(practice.duration)}</span>
            </div>
          </div>
          
          <div className="p-4">
            <div className="flex items-start justify-between mb-2">
              <h3 className="text-white font-medium text-sm line-clamp-2 flex-1">{practice.title}</h3>
              <div className="relative ml-2">
                <button className="p-1 text-gray-400 hover:text-white hover:bg-gray-700 rounded">
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400">{practice.instructor}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs ${getStatusColor(practice.status)}`}>
                  {practice.status}
                </span>
              </div>
              
              <div className="flex items-center space-x-2 text-xs text-gray-400">
                <span>{practice.category}</span>
                <span>•</span>
                <span className="capitalize">{practice.type}</span>
              </div>
              
              {practice.analytics.totalSessions > 0 && (
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-1">
                    <Users className="w-3 h-3 text-gray-500" />
                    <span className="text-gray-400">{practice.analytics.uniqueUsers}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Star className="w-3 h-3 text-yellow-500" />
                    <span className="text-gray-400">{practice.analytics.averageRating.toFixed(1)}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <TrendingUp className="w-3 h-3 text-green-500" />
                    <span className="text-gray-400">{practice.analytics.averageCompletion.toFixed(0)}%</span>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => onNavigate('practice-editor', practice.id)}
                className="flex-1 px-3 py-1.5 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors"
              >
                Edit
              </button>
              <button
                onClick={() => onNavigate('practice-preview', practice.id)}
                className="px-3 py-1.5 bg-gray-700 text-gray-300 rounded text-xs hover:bg-gray-600 transition-colors"
              >
                <Eye className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderListView = () => (
    <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-750 border-b border-gray-700">
            <tr>
              <th className="px-6 py-3 text-left">
                <input
                  type="checkbox"
                  checked={selectedPractices.size === paginatedPractices.length && paginatedPractices.length > 0}
                  onChange={handleSelectAll}
                  className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                <button
                  onClick={() => handleSort('title')}
                  className="flex items-center space-x-1 hover:text-white"
                >
                  <span>Practice</span>
                  {sortBy === 'title' && (
                    sortOrder === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                  )}
                </button>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                <button
                  onClick={() => handleSort('type')}
                  className="flex items-center space-x-1 hover:text-white"
                >
                  <span>Type</span>
                  {sortBy === 'type' && (
                    sortOrder === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                  )}
                </button>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                <button
                  onClick={() => handleSort('difficulty')}
                  className="flex items-center space-x-1 hover:text-white"
                >
                  <span>Difficulty</span>
                  {sortBy === 'difficulty' && (
                    sortOrder === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                  )}
                </button>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                <button
                  onClick={() => handleSort('duration')}
                  className="flex items-center space-x-1 hover:text-white"
                >
                  <span>Duration</span>
                  {sortBy === 'duration' && (
                    sortOrder === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                  )}
                </button>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                <button
                  onClick={() => handleSort('instructor')}
                  className="flex items-center space-x-1 hover:text-white"
                >
                  <span>Instructor</span>
                  {sortBy === 'instructor' && (
                    sortOrder === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                  )}
                </button>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Performance
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                <button
                  onClick={() => handleSort('status')}
                  className="flex items-center space-x-1 hover:text-white"
                >
                  <span>Status</span>
                  {sortBy === 'status' && (
                    sortOrder === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                  )}
                </button>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                <button
                  onClick={() => handleSort('updatedAt')}
                  className="flex items-center space-x-1 hover:text-white"
                >
                  <span>Updated</span>
                  {sortBy === 'updatedAt' && (
                    sortOrder === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                  )}
                </button>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {paginatedPractices.map(practice => (
              <tr key={practice.id} className="hover:bg-gray-750">
                <td className="px-6 py-4">
                  <input
                    type="checkbox"
                    checked={selectedPractices.has(practice.id)}
                    onChange={() => handleSelectPractice(practice.id)}
                    className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                  />
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center text-white">
                        {getPracticeTypeIcon(practice.type)}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white">{practice.title}</div>
                      <div className="text-sm text-gray-400">{practice.category}</div>
                      {practice.isPartOfSeries && (
                        <div className="flex items-center space-x-1 text-xs text-blue-400 mt-1">
                          <TreePine className="w-3 h-3" />
                          <span>Part of series</span>
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-2">
                    {getPracticeTypeIcon(practice.type)}
                    <span className="text-sm text-gray-300 capitalize">{practice.type}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(practice.difficulty)}`}>
                    {practice.difficulty}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-1 text-sm text-gray-300">
                    <Clock className="w-4 h-4" />
                    <span>{formatDuration(practice.duration)}</span>
                  </div>
                  <div className="text-xs text-gray-500">
                    +{practice.preparationTime + practice.windDownTime}m setup
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-300">{practice.instructor}</div>
                </td>
                <td className="px-6 py-4">
                  {practice.analytics.totalSessions > 0 ? (
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2 text-xs">
                        <Users className="w-3 h-3 text-gray-500" />
                        <span className="text-gray-400">{practice.analytics.uniqueUsers} users</span>
                      </div>
                      <div className="flex items-center space-x-2 text-xs">
                        <Star className="w-3 h-3 text-yellow-500" />
                        <span className="text-gray-400">{practice.analytics.averageRating.toFixed(1)} ({practice.analytics.totalRatings})</span>
                      </div>
                      <div className="flex items-center space-x-2 text-xs">
                        <TrendingUp className="w-3 h-3 text-green-500" />
                        <span className="text-gray-400">{practice.analytics.averageCompletion.toFixed(0)}% completion</span>
                      </div>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-500">No data yet</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(practice.status)}`}>
                    {practice.status === 'published' && <CheckCircle className="w-3 h-3 mr-1" />}
                    {practice.status === 'draft' && <Edit className="w-3 h-3 mr-1" />}
                    {practice.status === 'archived' && <Archive className="w-3 h-3 mr-1" />}
                    {practice.status === 'under_review' && <AlertCircle className="w-3 h-3 mr-1" />}
                    {practice.status.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-400">
                  {practice.updatedAt.toLocaleDateString()}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => onNavigate('practice-preview', practice.id)}
                      className="p-1 text-gray-400 hover:text-white hover:bg-gray-700 rounded"
                      title="Preview"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onNavigate('practice-editor', practice.id)}
                      className="p-1 text-gray-400 hover:text-white hover:bg-gray-700 rounded"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      className="p-1 text-gray-400 hover:text-white hover:bg-gray-700 rounded"
                      title="Duplicate"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      className="p-1 text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-white">Practice Library</h1>
          <p className="text-gray-400">Manage meditation, breathing, mindfulness, and movement practices</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => onNavigate('practice-creator')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>New Practice</span>
          </button>
          <button
            onClick={() => onNavigate('practice-series-builder')}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
          >
            <TreePine className="w-4 h-4" />
            <span>Create Series</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Total Practices</p>
              <p className="text-2xl font-bold text-white">{practices.length}</p>
            </div>
            <div className="p-3 bg-blue-600 rounded-lg">
              <Brain className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
        
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Published</p>
              <p className="text-2xl font-bold text-white">
                {practices.filter(p => p.status === 'published').length}
              </p>
            </div>
            <div className="p-3 bg-green-600 rounded-lg">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
        
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Avg Rating</p>
              <p className="text-2xl font-bold text-white">
                {(practices.reduce((sum, p) => sum + p.analytics.averageRating, 0) / practices.length).toFixed(1)}
              </p>
            </div>
            <div className="p-3 bg-yellow-600 rounded-lg">
              <Star className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
        
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Total Sessions</p>
              <p className="text-2xl font-bold text-white">
                {practices.reduce((sum, p) => sum + p.analytics.totalSessions, 0).toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-purple-600 rounded-lg">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 mb-4">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search practices..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-64"
              />
            </div>
            
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 px-3 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
            >
              <Filter className="w-4 h-4" />
              <span>Filters</span>
              {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
            </div>
            
            <div className="flex items-center space-x-2">
              <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded">
                <Download className="w-4 h-4" />
              </button>
              <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded">
                <Upload className="w-4 h-4" />
              </button>
              <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded">
                <Share2 className="w-4 h-4" />
              </button>
              <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded">
                <BarChart3 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Filter Options */}
        {showFilters && (
          <div className="border-t border-gray-700 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label htmlFor="typeFilter" className="block text-sm font-medium text-gray-300 mb-2">Type</label>
                <select
                  id="typeFilter"
                  value={filters.type}
                  onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Types</option>
                  <option value="meditation">Meditation</option>
                  <option value="breathing">Breathing</option>
                  <option value="mindfulness">Mindfulness</option>
                  <option value="movement">Movement</option>
                  <option value="series">Series</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="difficultyFilter" className="block text-sm font-medium text-gray-300 mb-2">Difficulty</label>
                <select
                  id="difficultyFilter"
                  value={filters.difficulty}
                  onChange={(e) => setFilters(prev => ({ ...prev, difficulty: e.target.value }))}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Levels</option>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                  <option value="expert">Expert</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="categoryFilter" className="block text-sm font-medium text-gray-300 mb-2">Category</label>
                <select
                  id="categoryFilter"
                  value={filters.category}
                  onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Categories</option>
                  {practiceCategories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label htmlFor="statusFilter" className="block text-sm font-medium text-gray-300 mb-2">Status</label>
                <select
                  id="statusFilter"
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Statuses</option>
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                  <option value="archived">Archived</option>
                  <option value="under_review">Under Review</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="durationFilter" className="block text-sm font-medium text-gray-300 mb-2">Duration</label>
                <select
                  id="durationFilter"
                  value={filters.duration}
                  onChange={(e) => setFilters(prev => ({ ...prev, duration: e.target.value }))}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Durations</option>
                  <option value="short">Short (≤10 min)</option>
                  <option value="medium">Medium (11-20 min)</option>
                  <option value="long">Long (&gt;20 min)</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="equipmentFilter" className="block text-sm font-medium text-gray-300 mb-2">Equipment</label>
                <select
                  id="equipmentFilter"
                  value={filters.equipment}
                  onChange={(e) => setFilters(prev => ({ ...prev, equipment: e.target.value }))}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Equipment</option>
                  <option value="none">No Equipment</option>
                  {equipmentOptions.map(equipment => (
                    <option key={equipment} value={equipment}>{equipment}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label htmlFor="spaceFilter" className="block text-sm font-medium text-gray-300 mb-2">Space Requirement</label>
                <select
                  id="spaceFilter"
                  value={filters.spaceRequirement}
                  onChange={(e) => setFilters(prev => ({ ...prev, spaceRequirement: e.target.value }))}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Spaces</option>
                  <option value="any">Any Space</option>
                  <option value="small">Small Space</option>
                  <option value="medium">Medium Space</option>
                  <option value="large">Large Space</option>
                </select>
              </div>
              
              <div>
                <span className="block text-sm font-medium text-gray-300 mb-2">Content Features</span>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={filters.hasAudioGuide === true}
                      onChange={(e) => setFilters(prev => ({ 
                        ...prev, 
                        hasAudioGuide: e.target.checked ? true : null 
                      }))}
                      className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-300">Has Audio Guide</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={filters.hasVisualAids === true}
                      onChange={(e) => setFilters(prev => ({ 
                        ...prev, 
                        hasVisualAids: e.target.checked ? true : null 
                      }))}
                      className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-300">Has Visual Aids</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bulk Actions */}
      {selectedPractices.size > 0 && (
        <div className="bg-blue-900 border border-blue-700 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-blue-200">
                {selectedPractices.size} practice{selectedPractices.size !== 1 ? 's' : ''} selected
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleBulkAction('publish')}
                disabled={isLoading}
                className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                Publish
              </button>
              <button
                onClick={() => handleBulkAction('archive')}
                disabled={isLoading}
                className="px-3 py-1 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700 transition-colors disabled:opacity-50"
              >
                Archive
              </button>
              <button
                onClick={() => handleBulkAction('duplicate')}
                disabled={isLoading}
                className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                Duplicate
              </button>
              <button
                onClick={() => handleBulkAction('delete')}
                disabled={isLoading}
                className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Practice List/Grid */}
      {viewMode === 'grid' ? renderGridView() : renderListView()}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-400">Show</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => setItemsPerPage(Number(e.target.value))}
                  className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <span className="text-sm text-gray-400">per page</span>
              </div>
              <div className="text-sm text-gray-400">
                Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredPractices.length)} of {filteredPractices.length} practices
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              
              <div className="flex items-center space-x-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = i + 1;
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-1 rounded ${
                        currentPage === page
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      } transition-colors`}
                    >
                      {page}
                    </button>
                  );
                })}
                {totalPages > 5 && (
                  <>
                    <span className="text-gray-400">...</span>
                    <button
                      onClick={() => setCurrentPage(totalPages)}
                      className="px-3 py-1 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors"
                    >
                      {totalPages}
                    </button>
                  </>
                )}
              </div>
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
