import { 
  Search, 
  Edit, 
  Trash2, 
  BookOpen, 
  Plus,
  MoreVertical,
  Eye,
  EyeOff
} from 'lucide-react';
import React, { useEffect, useState, useCallback } from 'react';

import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../components/ui/dropdown-menu';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';

import { useToast } from '../contexts/ToastContext';
import { ContentForm, ContentRecord } from './ContentForm';

export interface ContentItem {
  id:string; title:string; type:string; approach:string; isPublished:boolean; createdAt:string; description?:string; thumbnailUrl?:string; tags?:string;
}

interface ContentListProps {
  embedded?: boolean;
  onAdd?: () => void;
  onEdit?: (c: ContentItem) => void;
  refreshSignal?: number;
  itemsExternal?: ContentItem[];
  setItemsExternal?: React.Dispatch<React.SetStateAction<ContentItem[]>>;
}

export const ContentList: React.FC<ContentListProps> = ({ embedded, onAdd, onEdit, refreshSignal, itemsExternal, setItemsExternal }) => {
  const { push } = useToast();
  const [items,setItems]=useState<ContentItem[]>(itemsExternal || []);
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState<string|null>(null);
  const [showForm,setShowForm]=useState(false);
  const [editing,setEditing]=useState<ContentItem|null>(null);
  const [filters,setFilters]=useState({ search:'', approach:'all', type:'all' });

  // Map ContentRecord to ContentItem for type compatibility
  function mapContent(rec: ContentRecord): ContentItem {
    return {
      id: rec.id,
      title: rec.title,
      type: rec.type,
      approach: rec.approach,
      isPublished: rec.isPublished,
      createdAt: new Date().toISOString(),
      description: rec.description || undefined,
      thumbnailUrl: rec.thumbnailUrl || undefined,
      tags: rec.tags || undefined
    };
  }

  const load = useCallback(async () => {
    // If we're in embedded mode and have external data management, don't load
    if (embedded && itemsExternal && setItemsExternal) {
      return;
    }
    
    setLoading(true); setError(null);
    try {
      const params = new URLSearchParams();
      if(filters.search) params.set('search', filters.search);
      if(filters.approach && filters.approach !== 'all') params.set('approach', filters.approach);
      if(filters.type && filters.type !== 'all') params.set('contentType', filters.type);
  const res = await fetch('/api/admin/content?'+params.toString(), { credentials:'include' });
      const data = await res.json();
      if(!data.success) throw new Error(data.error||'Failed to load');
      (setItemsExternal || setItems)(data.data);
    } catch(e){ setError(e instanceof Error ? e.message : 'Failed to load'); } finally { setLoading(false); }
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

  function onSaved(item: ContentRecord){
    const mappedItem = mapContent(item);
    setShowForm(false); setEditing(null);
    (setItemsExternal || setItems)(prev => {
      const idx = prev.findIndex(p=>p.id===mappedItem.id);
      if (idx>=0) {
        const copy = [...prev]; copy[idx]=mappedItem; return copy;
      }
      return [mappedItem, ...prev];
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-900">Content Library</h2>
        {!embedded && (
          <Button onClick={() => { setEditing(null); setShowForm(true); }} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            New Content
          </Button>
        )}
        {embedded && onAdd && (
          <Button onClick={onAdd} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            New Content
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label htmlFor="search-input" className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="search-input"
                  placeholder="Search content..."
                  value={filters.search}
                  onChange={(e) => setFilters(f => ({ ...f, search: e.target.value }))}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="type-select" className="text-sm font-medium">Type</label>
              <Select value={filters.type} onValueChange={(value) => setFilters(f => ({ ...f, type: value }))}>
                <SelectTrigger id="type-select">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="audio">Audio</SelectItem>
                  <SelectItem value="video">Video</SelectItem>
                  <SelectItem value="story">Story</SelectItem>
                  <SelectItem value="article">Article</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="approach-select" className="text-sm font-medium">Approach</label>
              <Select value={filters.approach} onValueChange={(value) => setFilters(f => ({ ...f, approach: value }))}>
                <SelectTrigger id="approach-select">
                  <SelectValue placeholder="All Approaches" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Approaches</SelectItem>
                  <SelectItem value="western">Western</SelectItem>
                  <SelectItem value="eastern">Eastern</SelectItem>
                  <SelectItem value="hybrid">Hybrid</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content Grid */}
      {loading && (
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-gray-500">Loading content...</p>
          </CardContent>
        </Card>
      )}
      
      {error && (
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-red-600">{error}</p>
          </CardContent>
        </Card>
      )}
      
      {!loading && !error && items.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No content yet</p>
            <p className="text-gray-400 text-sm mt-2">Click &quot;New Content&quot; to add your first item</p>
          </CardContent>
        </Card>
      )}
      
      {!loading && !error && items.length > 0 && (
        <div className="grid gap-4">
          {items.map((item) => (
            <Card key={item.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-lg text-gray-900">{item.title}</h3>
                      <div className="flex items-center gap-2">
                        <Badge variant={item.type === 'audio' ? 'default' : item.type === 'video' ? 'secondary' : 'outline'}>
                          {item.type}
                        </Badge>
                        <Badge variant="outline">
                          {item.approach}
                        </Badge>
                        <div className="flex items-center gap-1">
                          {item.isPublished ? (
                            <>
                              <Eye className="h-4 w-4 text-green-600" />
                              <Badge variant="default" className="bg-green-100 text-green-800">Published</Badge>
                            </>
                          ) : (
                            <>
                              <EyeOff className="h-4 w-4 text-gray-400" />
                              <Badge variant="secondary">Draft</Badge>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {item.description && (
                      <p className="text-gray-600 text-sm mb-3">{item.description}</p>
                    )}
                    
                    <p className="text-xs text-gray-400">
                      Created: {new Date(item.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  
                  <div className="ml-4">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            if (embedded && onEdit) {
                              onEdit(item);
                            } else {
                              setEditing(item);
                              setShowForm(true);
                            }
                          }}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={async () => {
                            const prev = items;
                            (setItemsExternal || setItems)(items.filter(x => x.id !== item.id));
                            try {
                              const res = await fetch(`/api/admin/content/${item.id}`, {
                                method: 'DELETE',
                                credentials: 'include'
                              });
                              if (!res.ok) throw new Error('Delete failed');
                              push({ type: 'success', message: 'Content deleted' });
                            } catch (e) {
                              (setItemsExternal || setItems)(prev);
                              push({
                                type: 'error',
                                message: e instanceof Error ? e.message : 'Delete failed'
                              });
                            }
                          }}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      {!embedded && showForm && (
        <ContentForm
          existing={editing}
          onClose={() => {
            setShowForm(false);
            setEditing(null);
          }}
          onSaved={onSaved}
        />
      )}
    </div>
  );
};
