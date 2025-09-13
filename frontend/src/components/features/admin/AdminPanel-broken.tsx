import { BarChart3, FileText, List, Plus, Star, TrendingUp, Users, Edit2, Trash2 } from 'lucide-react';
import React, { useState, useEffect } from 'react';

import { Button } from '../../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';

interface AdminPanelProps {
  onNavigate: (page: string) => void;
}

interface DashboardStats {
  stats: {
    totalContent: number;
    publishedContent: number;
    totalPlaylists: number;
    publishedPlaylists: number;
    totalUsers: number;
  };
  popularContent: {
    id: string;
    title: string;
    type: string;
    category: string;
    viewCount: number;
    rating: number;
  }[];
  recentActivity: {
    id: string;
    action: string;
    resource: string;
    timestamp: string;
    admin: { name: string; email: string };
  }[];
}

export function AdminPanel({ onNavigate }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  
  // Content Management State
  const [contentList, setContentList] = useState<any[]>([]);
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [showContentForm, setShowContentForm] = useState(false);
  const [showPlaylistForm, setShowPlaylistForm] = useState(false);
  const [editingContent, setEditingContent] = useState<any>(null);
  const [editingPlaylist, setEditingPlaylist] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contentForm, setContentForm] = useState({
    title: '',
    type: 'article',
    category: 'Mindfulness',
    approach: 'western',
    content: '',
    description: '',
    author: '',
    duration: '',
    difficulty: 'Beginner',
    tags: '',
    fileUrl: '',
    externalUrl: '',
    thumbnailUrl: '',
    severityLevel: 'Mild',
    isPublished: false
  });
  const [playlistForm, setPlaylistForm] = useState({
    title: '',
    description: '',
    category: 'Mindfulness',
    approach: 'western',
    difficulty: 'Beginner',
    tags: '',
    thumbnailUrl: '',
    severityLevel: 'Mild',
    isPublished: false
  });

  useEffect(() => {
    const adminToken = localStorage.getItem('adminToken');
    if (!adminToken) {
      onNavigate('admin-login');
      return;
    }
    
    loadDashboardStats();
  }, [onNavigate]);

  useEffect(() => {
    const loadDataForActiveTab = async () => {
      if (activeTab === 'content') {
        try {
          setLoading(true);
          setError(null);
          const adminToken = localStorage.getItem('adminToken');
          if (!adminToken) {
            onNavigate('admin-login');
            return;
          }

          const response = await fetch('/api/admin/content', {
            headers: {
              'Authorization': `Bearer ${adminToken}`,
            },
          });

          if (response.ok) {
            const data = await response.json();
            setContentList(data || []);
          } else {
            console.error('Failed to load content:', response.statusText);
            setContentList([]);
          }
        } catch (error) {
          console.error('Error loading content:', error);
          setError('Failed to load content');
          setContentList([]);
        } finally {
          setLoading(false);
        }
      } else if (activeTab === 'playlists') {
        try {
          setLoading(true);
          setError(null);
          const adminToken = localStorage.getItem('adminToken');
          if (!adminToken) {
            onNavigate('admin-login');
            return;
          }

          const response = await fetch('/api/admin/playlists', {
            headers: {
              'Authorization': `Bearer ${adminToken}`,
            },
          });

          if (response.ok) {
            const data = await response.json();
            setPlaylists(data || []);
          } else {
            console.error('Failed to load playlists:', response.statusText);
            setPlaylists([]);
          }
        } catch (error) {
          console.error('Error loading playlists:', error);
          setError('Failed to load playlists');
          setPlaylists([]);
        } finally {
          setLoading(false);
        }
      }
    };
    
    loadDataForActiveTab();
  }, [activeTab, onNavigate]);

  const loadDashboardStats = async () => {
    try {
      const response = await fetch('/api/admin/dashboard/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setDashboardStats(data.data);
      }
    } catch (error) {
      console.error('Failed to load dashboard stats:', error);
    }
  };

  // Load content list
  // Create or update content
  const handleContentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const adminToken = localStorage.getItem('adminToken');
      const url = editingContent ? `/api/admin/content/${editingContent.id}` : '/api/admin/content';
      const method = editingContent ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(contentForm),
      });

      if (response.ok) {
        setShowContentForm(false);
        setEditingContent(null);
        setContentForm({
          title: '',
          type: 'article',
          category: 'Mindfulness',
          approach: 'western',
          content: '',
          description: '',
          author: '',
          duration: '',
          difficulty: 'Beginner',
          tags: '',
          fileUrl: '',
          externalUrl: '',
          thumbnailUrl: '',
          severityLevel: 'Mild',
          isPublished: false
        });
        
        // Reload content list inline
        const reloadResponse = await fetch('/api/admin/content', {
          headers: {
            'Authorization': `Bearer ${adminToken}`,
          },
        });
        if (reloadResponse.ok) {
          const data = await reloadResponse.json();
          setContentList(data || []);
        }
      }
    } catch (error) {
      console.error('Error saving content:', error);
      setError('Failed to save content');
    }
  };

  // Delete content
  const handleDeleteContent = async (contentId: string) => {
    if (!confirm('Are you sure you want to delete this content?')) return;
    
    try {
      const adminToken = localStorage.getItem('adminToken');
      const response = await fetch(`/api/admin/content/${contentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
        },
      });

      if (response.ok) {
        // Reload content list inline
        const reloadResponse = await fetch('/api/admin/content', {
          headers: {
            'Authorization': `Bearer ${adminToken}`,
          },
        });
        if (reloadResponse.ok) {
          const data = await reloadResponse.json();
          setContentList(data || []);
        }
      }
    } catch (error) {
      console.error('Error deleting content:', error);
      setError('Failed to delete content');
    }
  };

  // Delete playlist (simple version)
  const handleDeletePlaylist = async (playlistId: string) => {
    if (!confirm('Are you sure you want to delete this playlist?')) return;
    
    try {
      const adminToken = localStorage.getItem('adminToken');
      const response = await fetch(`/api/admin/playlists/${playlistId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
        },
      });

      if (response.ok) {
        // Reload playlist list inline
        const reloadResponse = await fetch('/api/admin/playlists', {
          headers: {
            'Authorization': `Bearer ${adminToken}`,
          },
        });
        if (reloadResponse.ok) {
          const data = await reloadResponse.json();
          setPlaylistList(data || []);
        }
      }
    } catch (error) {
      console.error('Error deleting playlist:', error);
      setError('Failed to delete playlist');
    }
  };

  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Content</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardStats?.stats.totalContent || 0}</div>
            <p className="text-xs text-muted-foreground">
              {dashboardStats?.stats.publishedContent || 0} published
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Playlists</CardTitle>
            <List className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardStats?.stats.totalPlaylists || 0}</div>
            <p className="text-xs text-muted-foreground">
              {dashboardStats?.stats.publishedPlaylists || 0} published
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardStats?.stats.totalUsers || 0}</div>
            <p className="text-xs text-muted-foreground">Registered users</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Engagement</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboardStats?.popularContent.reduce((sum, item) => sum + item.viewCount, 0) || 0}
            </div>
            <p className="text-xs text-muted-foreground">Total views</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Rating</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboardStats?.popularContent.length ? 
                (dashboardStats.popularContent.reduce((sum, item) => sum + (item.rating || 0), 0) / 
                 dashboardStats.popularContent.length).toFixed(1) : 'N/A'
              }
            </div>
            <p className="text-xs text-muted-foreground">Content rating</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Popular Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Popular Content</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {dashboardStats?.popularContent.map((item, index) => (
              <div key={item.id} className="flex items-center justify-between p-2 rounded border">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                    {index + 1}
                  </span>
                  <div>
                    <p className="font-medium text-sm">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.category}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{item.viewCount} views</p>
                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3 text-yellow-400 fill-current" />
                    <span className="text-xs">{item.rating?.toFixed(1) || 'N/A'}</span>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {dashboardStats?.recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-center justify-between p-2 rounded border">
                <div>
                  <p className="font-medium text-sm">{activity.action.replace(/_/g, ' ')}</p>
                  <p className="text-xs text-muted-foreground">
                    by {activity.admin.name}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">
                    {new Date(activity.timestamp).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderContentManagement = () => {
    console.log('renderContentManagement called');
    console.log('contentList:', contentList);
    console.log('loading:', loading);
    console.log('error:', error);
    
    try {
      return (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Content Management</h2>
            <Button onClick={() => setShowContentForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Content
            </Button>
          </div>

          {loading && (
            <Card>
              <CardContent className="text-center py-8">
                <p>Loading content...</p>
              </CardContent>
            </Card>
          )}

          {error && (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-red-600">{error}</p>
              </CardContent>
            </Card>
          )}

          {!loading && !error && (
            <>
              {/* Content List */}
              <Card>
                <CardHeader>
                  <CardTitle>Content Library ({contentList?.length || 0} items)</CardTitle>
                </CardHeader>
                <CardContent>
                  {contentList && contentList.length > 0 ? (
                    <div className="space-y-4">
                      {contentList.map((content) => (
                        <div key={content.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div>
                            <h4 className="font-semibold">{content.title}</h4>
                            <p className="text-sm text-muted-foreground">
                              {content.type} • {content.category} • {content.approach}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditingContent(content);
                                setContentForm(content);
                                setShowContentForm(true);
                              }}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => content.id && handleDeleteContent(content.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">
                      No content found. Click "Add Content" to create your first piece of content.
                    </p>
                  )}
                </CardContent>
              </Card>
            </>
          )}

          {/* Content Form Modal */}
          {showContentForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <CardHeader>
                  <CardTitle>
                    {editingContent ? 'Edit Content' : 'Add New Content'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleContentSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Title</label>
                      <input
                        type="text"
                        value={contentForm.title}
                        onChange={(e) => setContentForm({...contentForm, title: e.target.value})}
                        className="w-full p-2 border rounded"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Type</label>
                        <select
                          value={contentForm.type}
                          onChange={(e) => setContentForm({...contentForm, type: e.target.value as any})}
                          className="w-full p-2 border rounded"
                        >
                          <option value="article">Article</option>
                          <option value="video">Video</option>
                          <option value="audio">Audio</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Category</label>
                        <select
                          value={contentForm.category}
                          onChange={(e) => setContentForm({...contentForm, category: e.target.value})}
                          className="w-full p-2 border rounded"
                        >
                          <option value="Mindfulness">Mindfulness</option>
                          <option value="Stress Management">Stress Management</option>
                          <option value="Sleep">Sleep</option>
                          <option value="Anxiety">Anxiety</option>
                          <option value="Depression">Depression</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Approach</label>
                        <select
                          value={contentForm.approach}
                          onChange={(e) => setContentForm({...contentForm, approach: e.target.value as any})}
                          className="w-full p-2 border rounded"
                        >
                          <option value="western">Western</option>
                          <option value="eastern">Eastern</option>
                          <option value="hybrid">Hybrid</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Description</label>
                      <textarea
                        value={contentForm.description}
                        onChange={(e) => setContentForm({...contentForm, description: e.target.value})}
                        className="w-full p-2 border rounded h-20"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Content</label>
                      <textarea
                        value={contentForm.content}
                        onChange={(e) => setContentForm({...contentForm, content: e.target.value})}
                        className="w-full p-2 border rounded h-32"
                        required
                      />
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setShowContentForm(false);
                          setEditingContent(null);
                          setContentForm({
                            title: '',
                            type: 'article',
                            category: 'Mindfulness',
                            approach: 'western',
                            content: '',
                            description: '',
                            author: '',
                            duration: '',
                            difficulty: 'Beginner',
                            tags: '',
                            fileUrl: '',
                            externalUrl: '',
                            thumbnailUrl: '',
                            severityLevel: 'Mild',
                            isPublished: false
                          });
                        }}
                      >
                        Cancel
                      </Button>
                      <Button type="submit">
                        {editingContent ? 'Update' : 'Create'}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      );
    } catch (error) {
      console.error('Error in renderContentManagement:', error);
      return (
        <div className="p-4 text-red-600">
          Error loading content management. Please refresh the page.
        </div>
      );
    }
  };
            <CardHeader>
              <CardTitle>All Content ({contentList?.length || 0})</CardTitle>
            </CardHeader>
            <CardContent>
              {!contentList || contentList.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No content found. Add your first content!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {contentList.map((content) => (
                    <div key={content.id || Math.random()} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <h3 className="font-semibold">{content.title || 'Untitled'}</h3>
                        <p className="text-sm text-muted-foreground">
                          {content.type || 'Unknown'} • {content.category || 'Uncategorized'} • {content.approach || 'Unknown'}
                        </p>
                        {content.description && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {content.description.substring(0, 100)}...
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingContent(content);
                            setContentForm({...contentForm, ...content});
                            setShowContentForm(true);
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => content.id && handleDeleteContent(content.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Simple Content Form Modal */}
          {showContentForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <Card className="w-full max-w-md">
                <CardHeader>
                  <CardTitle>{editingContent ? 'Edit Content' : 'Add New Content'}</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleContentSubmit} className="space-y-4">
                    <div>
                      <label htmlFor="title" className="block text-sm font-medium mb-1">Title *</label>
                      <input
                        id="title"
                        type="text"
                        className="w-full p-2 border rounded-md"
                        value={contentForm.title}
                        onChange={(e) => setContentForm({...contentForm, title: e.target.value})}
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="type" className="block text-sm font-medium mb-1">Type *</label>
                      <select
                        id="type"
                        className="w-full p-2 border rounded-md"
                        value={contentForm.type}
                        onChange={(e) => setContentForm({...contentForm, type: e.target.value})}
                      >
                        <option value="article">Article</option>
                        <option value="video">Video</option>
                        <option value="audio">Audio</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="category" className="block text-sm font-medium mb-1">Category *</label>
                      <select
                        id="category"
                        className="w-full p-2 border rounded-md"
                        value={contentForm.category}
                        onChange={(e) => setContentForm({...contentForm, category: e.target.value})}
                      >
                        <option value="Mindfulness">Mindfulness</option>
                        <option value="Anxiety">Anxiety</option>
                        <option value="Stress Management">Stress Management</option>
                        <option value="Relaxation">Relaxation</option>
                        <option value="Emotional Intelligence">Emotional Intelligence</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="approach" className="block text-sm font-medium mb-1">Approach *</label>
                      <select
                        id="approach"
                        className="w-full p-2 border rounded-md"
                        value={contentForm.approach}
                        onChange={(e) => setContentForm({...contentForm, approach: e.target.value})}
                      >
                        <option value="western">Western</option>
                        <option value="eastern">Eastern</option>
                        <option value="hybrid">Hybrid</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="content" className="block text-sm font-medium mb-1">Content *</label>
                      <textarea
                        id="content"
                        className="w-full p-2 border rounded-md h-24"
                        value={contentForm.content}
                        onChange={(e) => setContentForm({...contentForm, content: e.target.value})}
                        placeholder="Enter the main content..."
                        required
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setShowContentForm(false);
                          setEditingContent(null);
                        }}
                      >
                        Cancel
                      </Button>
                      <Button type="submit">
                        {editingContent ? 'Update' : 'Create'}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      );
    } catch (error) {
      console.error('Error in renderContentManagement:', error);
      return (
        <div className="text-center py-8">
          <p className="text-red-600">Error loading content management. Please refresh the page.</p>
        </div>
      );
    }
  };

  const renderPlaylistManagement = () => {
    try {
      return (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Playlist Management</h2>
            <Button onClick={() => setShowPlaylistForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Playlist
            </Button>
          </div>

          {loading && (
            <Card>
              <CardContent className="text-center py-8">
                <p>Loading playlists...</p>
              </CardContent>
            </Card>
          )}

          {error && (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-red-600">{error}</p>
              </CardContent>
            </Card>
          )}

          {/* Playlist Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {playlists && playlists.length > 0 && playlists.map((playlist) => (
              <Card key={playlist.id || Math.random()}>
                <CardHeader>
                  <CardTitle className="text-lg">{playlist.title || 'Untitled Playlist'}</CardTitle>
                </CardHeader>
                <CardContent>
                  {playlist.description && (
                    <p className="text-sm text-muted-foreground mb-4">
                      {playlist.description}
                    </p>
                  )}
                  <div className="space-y-2 text-sm">
                    <p><strong>Category:</strong> {playlist.category || 'Uncategorized'}</p>
                    <p><strong>Approach:</strong> {playlist.approach || 'Unknown'}</p>
                    <p><strong>Items:</strong> {playlist._count?.items || 0}</p>
                  </div>
                  <div className="flex justify-end gap-2 mt-4">
                    <Button variant="outline" size="sm">Edit</Button>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => playlist.id && handleDeletePlaylist(playlist.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {(!playlists || playlists.length === 0) && !loading && (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-muted-foreground">No playlists found. Create your first playlist!</p>
              </CardContent>
            </Card>
          )}

          {/* Playlist Form Modal (Simple) */}
          {showPlaylistForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <Card className="w-full max-w-md">
                <CardHeader>
                  <CardTitle>Create New Playlist</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="playlistTitle" className="block text-sm font-medium mb-1">Title *</label>
                      <input
                        id="playlistTitle"
                        type="text"
                        className="w-full p-2 border rounded-md"
                        placeholder="Enter playlist title"
                      />
                    </div>
                    <div>
                      <label htmlFor="playlistDescription" className="block text-sm font-medium mb-1">Description</label>
                      <textarea
                        id="playlistDescription"
                        className="w-full p-2 border rounded-md h-20"
                        placeholder="Enter playlist description"
                      />
                    </div>
                    <div className="flex justify-end gap-2 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowPlaylistForm(false)}
                      >
                        Cancel
                      </Button>
                      <Button>Create</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      );
    } catch (error) {
      console.error('Error in renderPlaylistManagement:', error);
      return (
        <div className="text-center py-8">
          <p className="text-red-600">Error loading playlist management. Please refresh the page.</p>
        </div>
      );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Admin Panel</h1>
              <p className="text-muted-foreground">Mental Wellbeing AI Content Management System</p>
            </div>
            
            <div className="flex items-center gap-4">
              <Button variant="outline" onClick={() => {
                localStorage.removeItem('adminToken');
                onNavigate('admin-login');
              }}>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="playlists">Playlists</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>
          
          <div className="mt-6">
            <TabsContent value="dashboard" className="mt-0">
              {renderDashboard()}
            </TabsContent>
            
            <TabsContent value="content" className="mt-0">
              {activeTab === 'content' ? renderContentManagement() : null}
            </TabsContent>
            
            <TabsContent value="playlists" className="mt-0">
              {activeTab === 'playlists' ? renderPlaylistManagement() : null}
            </TabsContent>
            
            <TabsContent value="analytics" className="mt-0">
              <div className="text-center py-12">
                <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Advanced Analytics</h3>
                <p className="text-muted-foreground">Analytics dashboard coming soon...</p>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
