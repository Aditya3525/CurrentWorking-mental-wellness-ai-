import React, { useEffect, useState, useCallback } from 'react';
import { 
  Search, 
  Edit, 
  Trash2, 
  Clock, 
  Play,
  Plus,
  MoreVertical
} from 'lucide-react';

import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../components/ui/dropdown-menu';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';

import { useToast } from '../contexts/ToastContext';

export interface Practice {
  id: string;
  title: string;
  types: string; // CSV
  type?: string; // primary
  duration: number;
  level: string;
  difficulty?: string;
  approach: string;
  description?: string;
  audioUrl?: string;
  videoUrl?: string;
  youtubeUrl?: string;
  thumbnailUrl?: string;
  tags?: string;
  isPublished: boolean;
  createdAt: string;
}

interface PracticesListProps {
  embedded?: boolean;
  onAdd?: () => void;
  onEdit?: (p: Practice) => void;
  refreshSignal?: number; // parent can bump to reload
  itemsExternal?: Practice[];
  setItemsExternal?: React.Dispatch<React.SetStateAction<Practice[]>>;
}

export const PracticesList: React.FC<PracticesListProps> = ({ 
  embedded, 
  onAdd, 
  onEdit, 
  refreshSignal, 
  itemsExternal, 
  setItemsExternal 
}) => {
  const { push } = useToast();
  const [items, setItems] = useState<Practice[]>(itemsExternal || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState({ 
    search: '', 
    approach: 'all', 
    level: 'all', 
    type: 'all',
    isPublished: 'all'
  });

  const load = useCallback(async () => {
    // If we're in embedded mode and have external data management, don't load
    if (embedded && itemsExternal && setItemsExternal) {
      return;
    }
    
    setLoading(true); 
    setError(null);
    try {
      const params = new URLSearchParams();
      if(filters.search) params.set('search', filters.search);
      if(filters.approach && filters.approach !== 'all') params.set('approach', filters.approach);
      if(filters.level && filters.level !== 'all') params.set('level', filters.level);
      if(filters.type && filters.type !== 'all') params.set('type', filters.type);
      if(filters.isPublished && filters.isPublished !== 'all') params.set('isPublished', filters.isPublished);
      
      const res = await fetch('/api/admin/practices?' + params.toString(), { 
        credentials: 'include' 
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to load');
      (setItemsExternal || setItems)(data.data);
    } catch (e) { 
      setError(e instanceof Error ? e.message : 'Failed to load'); 
    } finally { 
      setLoading(false); 
    }
  }, [filters, setItemsExternal, embedded, itemsExternal]);

  useEffect(() => { 
    // If external data is provided, use it
    if (itemsExternal) {
      setItems(itemsExternal);
      return;
    }
    // Otherwise load from API
    load(); 
  }, [load, refreshSignal, itemsExternal]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this practice?')) return;
    
    try {
      const res = await fetch(`/api/admin/practices/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to delete');
      
      (setItemsExternal || setItems)(prev => prev.filter(p => p.id !== id));
      push({ type: 'success', message: 'Practice deleted successfully' });
    } catch (e) {
      push({ 
        type: 'error', 
        message: e instanceof Error ? e.message : 'Failed to delete practice' 
      });
    }
  };

  const getStatusBadge = (practice: Practice) => {
    if (practice.isPublished) {
      return <Badge className="bg-green-100 text-green-800">Published</Badge>;
    } else {
      return <Badge variant="secondary">Draft</Badge>;
    }
  };

  const getApproachBadge = (approach: string) => {
    const colors = {
      western: 'bg-blue-100 text-blue-800',
      eastern: 'bg-purple-100 text-purple-800',
      hybrid: 'bg-green-100 text-green-800'
    };
    return <Badge className={colors[approach as keyof typeof colors] || 'bg-gray-100 text-gray-800'}>
      {approach.charAt(0).toUpperCase() + approach.slice(1)}
    </Badge>;
  };

  const filteredItems = (itemsExternal || items).filter(item => {
    if (filters.search && !item.title.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }
    if (filters.approach && filters.approach !== 'all' && item.approach !== filters.approach) return false;
    if (filters.level && filters.level !== 'all' && item.level !== filters.level) return false;
    if (filters.type && filters.type !== 'all' && item.type !== filters.type) return false;
    if (filters.isPublished && filters.isPublished !== 'all' && item.isPublished.toString() !== filters.isPublished) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-muted-foreground">Loading practices...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-600 mb-4">{error}</div>
        <Button onClick={load} variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search practices..."
              value={filters.search}
              onChange={(e) => setFilters(f => ({ ...f, search: e.target.value }))}
              className="pl-10"
            />
          </div>
        </div>
        
        <div className="flex gap-2">
          <Select 
            value={filters.type} 
            onValueChange={(value) => setFilters(f => ({ ...f, type: value }))}
          >
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="Meditation">Meditation</SelectItem>
              <SelectItem value="Breathing">Breathing</SelectItem>
              <SelectItem value="Yoga">Yoga</SelectItem>
              <SelectItem value="Sleep">Sleep</SelectItem>
            </SelectContent>
          </Select>

          <Select 
            value={filters.level} 
            onValueChange={(value) => setFilters(f => ({ ...f, level: value }))}
          >
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              <SelectItem value="Beginner">Beginner</SelectItem>
              <SelectItem value="Intermediate">Intermediate</SelectItem>
              <SelectItem value="Advanced">Advanced</SelectItem>
            </SelectContent>
          </Select>

          <Select 
            value={filters.approach} 
            onValueChange={(value) => setFilters(f => ({ ...f, approach: value }))}
          >
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Approach" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Approaches</SelectItem>
              <SelectItem value="western">Western</SelectItem>
              <SelectItem value="eastern">Eastern</SelectItem>
              <SelectItem value="hybrid">Hybrid</SelectItem>
            </SelectContent>
          </Select>

          <Select 
            value={filters.isPublished} 
            onValueChange={(value) => setFilters(f => ({ ...f, isPublished: value }))}
          >
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="true">Published</SelectItem>
              <SelectItem value="false">Draft</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {filteredItems.length} of {(itemsExternal || items).length} practices
        </p>
        {!embedded && (
          <Button onClick={onAdd}>
            <Plus className="h-4 w-4 mr-2" />
            Add Practice
          </Button>
        )}
      </div>

      {/* Practices Grid */}
      {filteredItems.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="text-muted-foreground mb-4">No practices found</div>
            <Button 
              onClick={() => { 
                if (embedded && onAdd) { 
                  onAdd(); 
                } else if (onAdd) { 
                  onAdd(); 
                } 
              }}
              variant="outline"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Practice
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((practice) => (
            <Card key={practice.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <CardTitle className="text-lg line-clamp-2">{practice.title}</CardTitle>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      {practice.duration} min
                    </div>
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem 
                        onClick={() => {
                          if (embedded && onEdit) {
                            onEdit(practice);
                          } else if (onEdit) {
                            onEdit(practice);
                          }
                        }}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDelete(practice.id)} className="text-red-600">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {practice.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {practice.description}
                  </p>
                )}
                
                <div className="flex flex-wrap gap-2">
                  {getStatusBadge(practice)}
                  {getApproachBadge(practice.approach)}
                  <Badge variant="outline">{practice.level}</Badge>
                  {practice.type && (
                    <Badge variant="outline">{practice.type}</Badge>
                  )}
                </div>

                {practice.audioUrl && (
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <Play className="h-4 w-4" />
                    Audio Available
                  </div>
                )}
                
                <div className="text-xs text-muted-foreground">
                  Created: {new Date(practice.createdAt).toLocaleDateString()}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
