import {
  Plus,
  Edit,
  Trash2,
  Search,
  Brain,
  Wind,
  Eye,
  Waves,
  Heart,
  Scan,
  Filter,
  Clock
} from 'lucide-react';
import React, { useState, useEffect, useCallback, useMemo } from 'react';

import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { useNotificationStore } from '../stores/notificationStore';

export interface Practice {
  id: string;
  title: string;
  type: 'meditation' | 'breathing' | 'yoga' | 'sleep';
  types?: string;
  duration: number;
  level?: 'Beginner' | 'Intermediate' | 'Advanced';
  difficulty?: string;
  approach: 'Western' | 'Eastern' | 'Hybrid' | 'All';
  format?: 'Audio' | 'Video' | 'Audio/Video';
  description?: string;
  audioUrl?: string;
  videoUrl?: string;
  youtubeUrl?: string;
  thumbnailUrl?: string;
  // Tags come back from backend as comma-separated string; normalize to array
  tags?: string[];
  isPublished: boolean;
  createdAt: string;
}

interface RawPractice {
  id: string;
  title?: string;
  type?: string;
  types?: string;
  duration?: number | string;
  level?: string;
  difficulty?: string;
  approach?: string;
  format?: string;
  description?: string;
  audioUrl?: string;
  videoUrl?: string;
  youtubeUrl?: string;
  thumbnailUrl?: string;
  tags?: string[] | string | null;
  isPublished?: boolean;
  createdAt?: string;
}

const normalizePracticeType = (value?: string): Practice['type'] => {
  const normalized = (value ?? '').toLowerCase();
  if (normalized === 'breathing') return 'breathing';
  if (normalized === 'sleep') return 'sleep';
  if (normalized === 'yoga') return 'yoga';
  return 'meditation';
};

const normalizePracticeLevel = (value?: string): Practice['level'] => {
  const normalized = (value ?? '').toLowerCase();
  if (normalized === 'intermediate') return 'Intermediate';
  if (normalized === 'advanced') return 'Advanced';
  return 'Beginner';
};

const normalizePracticeApproach = (value?: string): Practice['approach'] => {
  switch ((value ?? '').toLowerCase()) {
    case 'western':
      return 'Western';
    case 'eastern':
      return 'Eastern';
    case 'hybrid':
      return 'Hybrid';
    case 'all':
      return 'All';
    default:
      return 'All';
  }
};

const normalizeTags = (value?: string[] | string | null): string[] => {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.map(tag => tag.trim()).filter(Boolean);
  }
  if (typeof value === 'string') {
    return value
      .split(',')
      .map(tag => tag.trim())
      .filter(Boolean);
  }
  return [];
};

const mapRawPractice = (raw: RawPractice): Practice => {
  const durationValue = typeof raw.duration === 'string'
    ? parseInt(raw.duration, 10)
    : raw.duration;

  return {
    id: raw.id,
    title: raw.title ?? 'Untitled Practice',
    type: normalizePracticeType(raw.type ?? raw.types),
    types: raw.types ?? raw.type ?? 'meditation',
    duration: Number.isFinite(durationValue) && typeof durationValue === 'number' ? durationValue : 5,
    level: normalizePracticeLevel(raw.level ?? raw.difficulty),
    difficulty: raw.difficulty,
    approach: normalizePracticeApproach(raw.approach),
    format: (raw.format as Practice['format']) ?? undefined,
    description: raw.description ?? undefined,
    audioUrl: raw.audioUrl ?? undefined,
    videoUrl: raw.videoUrl ?? undefined,
    youtubeUrl: raw.youtubeUrl ?? undefined,
    thumbnailUrl: raw.thumbnailUrl ?? undefined,
    tags: normalizeTags(raw.tags),
    isPublished: Boolean(raw.isPublished),
    createdAt: raw.createdAt ?? new Date().toISOString()
  };
};

interface PracticesListProps {
  embedded?: boolean;
  onAdd?: () => void;
  onEdit?: (practice: Practice) => void;
  itemsExternal?: Practice[];
  setItemsExternal?: (items: Practice[] | ((prev: Practice[]) => Practice[])) => void;
}

export const PracticesList: React.FC<PracticesListProps> = ({
  embedded = false,
  onAdd,
  onEdit,
  itemsExternal,
  setItemsExternal
}) => {
  const { push } = useNotificationStore();
  const [items, setItems] = useState<Practice[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [filterApproach, setFilterApproach] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const filterGridClasses = 'grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4';

  // Use external items if provided (embedded mode)
  const currentItems = embedded && itemsExternal ? itemsExternal : items;
  const setCurrentItems = embedded && setItemsExternal ? setItemsExternal : setItems;

  const loadPractices = useCallback(async () => {
    // Check if we're in embedded mode and have external data
    if (embedded && itemsExternal) {
      return; // Don't make API call if we have external data
    }

    setLoading(true);
    try {
      const response = await fetch('/api/admin/practices', {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to load practices');
      }
      
      const data = await response.json();
      const source = Array.isArray(data.data) ? data.data : [];
      const normalized = source.map((item: RawPractice) => mapRawPractice(item));
      setItems(normalized);
    } catch (error) {
      console.error('Error loading practices:', error);
      push({ 
        type: 'error', 
        title: 'Error', 
        description: 'Failed to load practices' 
      });
    } finally {
      setLoading(false);
    }
  }, [embedded, itemsExternal, push, setItems]);

  useEffect(() => {
    void loadPractices();
  }, [loadPractices]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this practice?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/practices/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to delete practice');
      }

      setCurrentItems((prev: Practice[]) => prev.filter(item => item.id !== id));
      push({ 
        type: 'success', 
        title: 'Success', 
        description: 'Practice deleted successfully' 
      });
    } catch (error) {
      console.error('Error deleting practice:', error);
      push({ 
        type: 'error', 
        title: 'Error', 
        description: 'Failed to delete practice' 
      });
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Meditation': return <Brain className="h-4 w-4" />;
      case 'Breathing': return <Wind className="h-4 w-4" />;
      case 'Visualization': return <Eye className="h-4 w-4" />;
      case 'Progressive Relaxation': return <Waves className="h-4 w-4" />;
      case 'Mindfulness': return <Heart className="h-4 w-4" />;
      case 'Body Scan': return <Scan className="h-4 w-4" />;
      default: return <Brain className="h-4 w-4" />;
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'Beginner': return 'bg-green-100 text-green-800';
      case 'Intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'Advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getApproachColor = (approach: string) => {
    switch (approach) {
      case 'cbt': return 'bg-blue-100 text-blue-800';
      case 'mindfulness': return 'bg-green-100 text-green-800';
      case 'dbt': return 'bg-purple-100 text-purple-800';
      case 'act': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Filter items based on search and filters
  const filteredItems = currentItems.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesType = filterType === 'all' || item.type === filterType;
    const matchesLevel = filterLevel === 'all' || (item.level || item.difficulty) === filterLevel;
    const matchesApproach = filterApproach === 'all' || item.approach === filterApproach;
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'published' && item.isPublished) ||
                         (filterStatus === 'draft' && !item.isPublished);

    return matchesSearch && matchesType && matchesLevel && matchesApproach && matchesStatus;
  });

  const headerSubtitle = useMemo(() => {
    return `Manage mindfulness practices and exercises (${filteredItems.length} items)`;
  }, [filteredItems.length]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Practice Management</h2>
          <p className="text-muted-foreground">{headerSubtitle}</p>
        </div>
        {onAdd && (
          <Button onClick={onAdd} className="flex items-center gap-2 self-start sm:self-auto">
            <Plus className="h-4 w-4" />
            Add Practice
          </Button>
        )}
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className={filterGridClasses}>
            <div className="relative md:col-span-2 lg:col-span-2">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search practices..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-11"
              />
            </div>
            
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="h-11">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="Meditation">Meditation</SelectItem>
                <SelectItem value="Breathing">Breathing</SelectItem>
                <SelectItem value="Visualization">Visualization</SelectItem>
                <SelectItem value="Progressive Relaxation">Progressive Relaxation</SelectItem>
                <SelectItem value="Mindfulness">Mindfulness</SelectItem>
                <SelectItem value="Body Scan">Body Scan</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterLevel} onValueChange={setFilterLevel}>
              <SelectTrigger className="h-11">
                <SelectValue placeholder="All Levels" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="Beginner">Beginner</SelectItem>
                <SelectItem value="Intermediate">Intermediate</SelectItem>
                <SelectItem value="Advanced">Advanced</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterApproach} onValueChange={setFilterApproach}>
              <SelectTrigger className="h-11">
                <SelectValue placeholder="All Approaches" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Approaches</SelectItem>
                <SelectItem value="general">General</SelectItem>
                <SelectItem value="cbt">CBT</SelectItem>
                <SelectItem value="mindfulness">Mindfulness</SelectItem>
                <SelectItem value="dbt">DBT</SelectItem>
                <SelectItem value="act">ACT</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="h-11">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Practices List */}
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="text-muted-foreground">Loading practices...</div>
        </div>
      ) : filteredItems.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">No practices found</h3>
            <p className="text-sm text-muted-foreground">
              {currentItems.length === 0 
                ? "Get started by creating your first practice"
                : "Try adjusting your filters or search terms"
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => (
            <Card key={item.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {getTypeIcon(item.type)}
                    <span className="text-sm font-medium">{item.type}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {onEdit && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(item)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(item.id)}
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <h3 className="font-medium text-sm mb-2 line-clamp-2">{item.title}</h3>
                
                {item.description && (
                  <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                    {item.description}
                  </p>
                )}

                <div className="flex flex-wrap gap-1 mb-3">
                  <Badge variant="secondary" className={getApproachColor(item.approach)}>
                    {item.approach.toUpperCase()}
                  </Badge>
                  <Badge variant="secondary" className={getLevelColor(item.level || item.difficulty || 'Beginner')}>
                    {item.level || item.difficulty || 'Beginner'}
                  </Badge>
                  {item.isPublished ? (
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      Published
                    </Badge>
                  ) : (
                    <Badge variant="outline">Draft</Badge>
                  )}
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {item.duration}min
                  </Badge>
                </div>

                {Array.isArray(item.tags) && item.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {item.tags.slice(0, 3).map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {item.tags.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{item.tags.length - 3}
                      </Badge>
                    )}
                  </div>
                )}

                <div className="text-xs text-muted-foreground">
                  Created: {new Date(item.createdAt).toLocaleDateString()}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
