import { BarChart3, FileText, List, Plus, Star, TrendingUp, Users } from 'lucide-react';
import React, { useEffect, useState } from 'react';

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
  interface ContentRow {
    id?: string;
    title?: string;
    type?: 'article' | 'video' | 'audio' | string;
    category?: string;
    approach?: string;
    description?: string;
    [key: string]: unknown;
  }
  interface PlaylistRow {
    id?: string;
    title?: string;
    description?: string;
    category?: string;
    approach?: string;
    _count?: { items?: number };
    [key: string]: unknown;
  }
  const [contentList, setContentList] = useState<ContentRow[]>([]);
  const [playlists, setPlaylists] = useState<PlaylistRow[]>([]);
  const [showContentForm, setShowContentForm] = useState(false);
  const [showPlaylistForm, setShowPlaylistForm] = useState(false);
  const [editingContent, setEditingContent] = useState<ContentRow | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [contentForm, setContentForm] = useState({
    title: '',
    type: 'article', // 'article' | 'video' | 'audio'
    category: 'Mindfulness',
    approach: 'western',
    content: '', // article body
    description: '',
    author: '',
    duration: '', // for audio/video
    difficulty: 'Beginner',
    tags: '',
    fileUrl: '',
    externalUrl: '',
    thumbnailUrl: '',
    severityLevel: 'Mild',
  isPublished: true,
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
    isPublished: false,
  });

  // Lock background scroll when any modal is open
  useEffect(() => {
    const hasOpenModal = showContentForm || showPlaylistForm;
    const original = document.body.style.overflow;
    if (hasOpenModal) document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original || '';
    };
  }, [showContentForm, showPlaylistForm]);

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
            headers: { 'Authorization': `Bearer ${adminToken}`, 'Cache-Control': 'no-cache' },
            cache: 'no-store',
          });
          if (response.ok) {
            const data = await response.json();
            setContentList(data?.data?.content || data || []);
          } else {
            setContentList([]);
          }
        } catch (e) {
          console.error(e);
          setError('Failed to load content');
          setContentList([]);
        } finally {
          setLoading(false);
        }
      }

      if (activeTab === 'playlists') {
        try {
          setLoading(true);
          setError(null);
          const adminToken = localStorage.getItem('adminToken');
          if (!adminToken) {
            onNavigate('admin-login');
            return;
          }
          const response = await fetch('/api/admin/playlists', {
            headers: { 'Authorization': `Bearer ${adminToken}`, 'Cache-Control': 'no-cache' },
            cache: 'no-store',
          });
          if (response.ok) {
            const data = await response.json();
            setPlaylists(data?.data?.playlists || data || []);
          } else {
            setPlaylists([]);
          }
        } catch (e) {
          console.error(e);
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
    } catch (e) {
      console.error('Failed to load dashboard stats:', e);
    }
  };

  // Create or update content with type-based validation
  const handleContentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Type-based validation
    const type = contentForm.type;
    const hasExternal = !!contentForm.externalUrl?.trim();
    const hasFile = !!contentForm.fileUrl?.trim();

    if (type === 'article') {
      if (!contentForm.content?.trim()) {
        setError('Content is required for articles/stories.');
        return;
      }
    } else {
      if (!contentForm.duration?.trim()) {
        setError('Duration is required for audio and video.');
        return;
      }
      if (!hasExternal && !hasFile) {
        setError('Provide at least one: External URL or File URL for audio/video.');
        return;
      }
    }
    setError(null);

    try {
      const adminToken = localStorage.getItem('adminToken');
      const url = editingContent ? `/api/admin/content/${editingContent.id}` : '/api/admin/content';
      const method = editingContent ? 'PUT' : 'POST';

      // Backend requires `content` always. For media, use externalUrl or fileUrl as content value.
      const contentValue = contentForm.type === 'article'
        ? contentForm.content
        : (contentForm.externalUrl?.trim() || contentForm.fileUrl?.trim() || '');

      const payload = {
        ...contentForm,
        content: contentValue,
      };

      const response = await fetch(url, {
        method,
        headers: { 'Authorization': `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
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
            isPublished: true,
        });

        // Reload content list
        const reload = await fetch('/api/admin/content', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}`, 'Cache-Control': 'no-cache' },
          cache: 'no-store',
        });
        if (reload.ok) {
          const data = await reload.json();
          setContentList(data?.data?.content || data || []);
        }
      } else {
        // Surface backend error for easier debugging (validation/permissions)
        try {
          const errText = await response.text();
          let message = 'Failed to save content';
          try {
            const errJson = JSON.parse(errText);
            message = errJson?.error || errJson?.message || message;
          } catch {
            if (errText) message = errText;
          }
          setError(message);
        } catch {
          setError('Failed to save content');
        }
      }
    } catch (e) {
      console.error('Error saving content:', e);
      setError('Failed to save content');
    }
  };

  const handleDeleteContent = async (contentId: string) => {
    if (!confirm('Are you sure you want to delete this content?')) return;
    try {
      const adminToken = localStorage.getItem('adminToken');
      const response = await fetch(`/api/admin/content/${contentId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${adminToken}` },
      });
      if (response.ok) {
        const reload = await fetch('/api/admin/content', {
          headers: { 'Authorization': `Bearer ${adminToken}`, 'Cache-Control': 'no-cache' },
          cache: 'no-store',
        });
        if (reload.ok) {
          const data = await reload.json();
          setContentList(data?.data?.content || data || []);
        }
      }
    } catch (e) {
      console.error('Error deleting content:', e);
      setError('Failed to delete content');
    }
  };

  const handleDeletePlaylist = async (playlistId: string) => {
    if (!confirm('Are you sure you want to delete this playlist?')) return;
    try {
      const adminToken = localStorage.getItem('adminToken');
      const response = await fetch(`/api/admin/playlists/${playlistId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${adminToken}` },
      });
      if (response.ok) {
        const reload = await fetch('/api/admin/playlists', {
          headers: { 'Authorization': `Bearer ${adminToken}`, 'Cache-Control': 'no-cache' },
          cache: 'no-store',
        });
        if (reload.ok) {
          const data = await reload.json();
          setPlaylists(data?.data?.playlists || data || []);
        }
      }
    } catch (e) {
      console.error('Error deleting playlist:', e);
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
              {dashboardStats?.popularContent.length ? (
                (dashboardStats.popularContent.reduce((sum, item) => sum + (item.rating || 0), 0) /
                  dashboardStats.popularContent.length).toFixed(1)
              ) : (
                'N/A'
              )}
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
                  <p className="text-xs text-muted-foreground">by {activity.admin.name}</p>
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

          {/* Content List */}
          <Card>
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
                          <p className="text-xs text-muted-foreground mt-1">{content.description.substring(0, 100)}...</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            const c = content as Record<string, unknown>;
                            const url = (c.externalUrl as string) || (c.fileUrl as string);
                            if (url) {
                              window.open(url, '_blank');
                              return;
                            }
                            const t = c.type as string | undefined;
                            if (t === 'article') {
                              alert(`Preview: ${(c.title as string) || 'Article'}`);
                              return;
                            }
                            alert('No preview available for this item.');
                          }}
                        >
                          Preview
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingContent(content);
                            setContentForm({ ...contentForm, ...content });
                            setShowContentForm(true);
                          }}
                        >
                          Edit
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => content.id && handleDeleteContent(content.id)}>
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Content Form Modal */}
          {showContentForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center p-4 z-50 overflow-y-auto">
              <Card className="w-full max-w-[95vw] sm:max-w-lg md:max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col mx-auto rounded-lg shadow-xl">
                <CardHeader className="sticky top-0 bg-white z-10 border-b">
                  <CardTitle>{editingContent ? 'Edit Content' : 'Add New Content'}</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 pr-2">
                  <form onSubmit={handleContentSubmit} className="space-y-4">
                    <div>
                      <label htmlFor="title" className="block text-sm font-medium mb-1">Title *</label>
                      <input id="title" type="text" className="w-full p-2 border rounded-md" value={contentForm.title} onChange={(e) => setContentForm({ ...contentForm, title: e.target.value })} required />
                    </div>

                    <div>
                      <label htmlFor="type" className="block text-sm font-medium mb-1">Type *</label>
                      <select id="type" className="w-full p-2 border rounded-md" value={contentForm.type} onChange={(e) => setContentForm({ ...contentForm, type: e.target.value })}>
                        <option value="article">Article / Story</option>
                        <option value="video">Video</option>
                        <option value="audio">Audio</option>
                      </select>
                    </div>

          <div>
                      <label htmlFor="category" className="block text-sm font-medium mb-1">Category *</label>
                      <select id="category" className="w-full p-2 border rounded-md" value={contentForm.category} onChange={(e) => setContentForm({ ...contentForm, category: e.target.value })}>
                        <option value="Mindfulness">Mindfulness</option>
                        <option value="Anxiety">Anxiety</option>
                        <option value="Stress Management">Stress Management</option>
                        <option value="Relaxation">Relaxation</option>
                        <option value="Emotional Intelligence">Emotional Intelligence</option>
            <option value="Series">Series</option>
                      </select>
                    </div>

          <div>
                      <label htmlFor="approach" className="block text-sm font-medium mb-1">Approach *</label>
                      <select id="approach" className="w-full p-2 border rounded-md" value={contentForm.approach} onChange={(e) => setContentForm({ ...contentForm, approach: e.target.value })}>
                        <option value="western">Western</option>
                        <option value="eastern">Eastern</option>
                        <option value="hybrid">Hybrid</option>
            <option value="all">All</option>
                      </select>
                    </div>

                    {/* Article body only for articles */}
                    {contentForm.type === 'article' && (
                      <div>
                        <label htmlFor="content" className="block text-sm font-medium mb-1">Content *</label>
                        <textarea id="content" className="w-full p-2 border rounded-md h-24" value={contentForm.content} onChange={(e) => setContentForm({ ...contentForm, content: e.target.value })} placeholder="Enter the main content..." required={contentForm.type === 'article'} />
                      </div>
                    )}

                    {/* Description is always optional */}
                    <div>
                      <label htmlFor="description" className="block text-sm font-medium mb-1">Description</label>
                      <textarea id="description" className="w-full p-2 border rounded-md h-20" value={contentForm.description} onChange={(e) => setContentForm({ ...contentForm, description: e.target.value })} placeholder="Short summary shown in the library" />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {contentForm.type === 'article' && (
                        <div>
                          <label htmlFor="author" className="block text-sm font-medium mb-1">Author</label>
                          <input id="author" type="text" className="w-full p-2 border rounded-md" value={contentForm.author} onChange={(e) => setContentForm({ ...contentForm, author: e.target.value })} />
                        </div>
                      )}
                      {contentForm.type !== 'article' && (
                        <div>
                          <label htmlFor="duration" className="block text-sm font-medium mb-1">Duration *</label>
                          <input id="duration" type="text" className="w-full p-2 border rounded-md" placeholder="e.g., 5m, 12 minutes" value={contentForm.duration} onChange={(e) => setContentForm({ ...contentForm, duration: e.target.value })} required={contentForm.type !== 'article'} />
                        </div>
                      )}
                      <div>
                        <label htmlFor="difficulty" className="block text-sm font-medium mb-1">Difficulty</label>
                        <select id="difficulty" className="w-full p-2 border rounded-md" value={contentForm.difficulty} onChange={(e) => setContentForm({ ...contentForm, difficulty: e.target.value })}>
                          <option value="Beginner">Beginner</option>
                          <option value="Intermediate">Intermediate</option>
                          <option value="Advanced">Advanced</option>
                        </select>
                      </div>
                      <div>
                        <label htmlFor="severityLevel" className="block text-sm font-medium mb-1">Severity Level</label>
                        <select id="severityLevel" className="w-full p-2 border rounded-md" value={contentForm.severityLevel} onChange={(e) => setContentForm({ ...contentForm, severityLevel: e.target.value })}>
                          <option value="Mild">Mild</option>
                          <option value="Moderate">Moderate</option>
                          <option value="Severe">Severe</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="tags" className="block text-sm font-medium mb-1">Tags</label>
                      <input id="tags" type="text" className="w-full p-2 border rounded-md" placeholder="comma,separated,tags" value={contentForm.tags} onChange={(e) => setContentForm({ ...contentForm, tags: e.target.value })} />
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                      <div>
                        <label htmlFor="externalUrl" className="block text-sm font-medium mb-1">
                          {contentForm.type === 'article' ? 'External URL (optional)' : 'External URL (YouTube, etc) — required if no File URL'}
                        </label>
                        <input id="externalUrl" type="url" className="w-full p-2 border rounded-md" placeholder={contentForm.type === 'article' ? 'https://example.com/article' : 'https://youtube.com/...'} value={contentForm.externalUrl} onChange={(e) => setContentForm({ ...contentForm, externalUrl: e.target.value })} />
                      </div>
                      <div>
                        <label htmlFor="fileUrl" className="block text-sm font-medium mb-1">
                          {contentForm.type === 'article' ? 'File URL (PDF, optional)' : 'File URL (audio/video) — required if no External URL'}
                        </label>
                        <input id="fileUrl" type="url" className="w-full p-2 border rounded-md" placeholder={contentForm.type === 'article' ? 'https://cdn.example.com/file.pdf' : 'https://cdn.example.com/file.mp3 or .mp4'} value={contentForm.fileUrl} onChange={(e) => setContentForm({ ...contentForm, fileUrl: e.target.value })} />
                      </div>
                      <div>
                        <label htmlFor="thumbnailUrl" className="block text-sm font-medium mb-1">Thumbnail URL</label>
                        <input id="thumbnailUrl" type="url" className="w-full p-2 border rounded-md" placeholder="https://..." value={contentForm.thumbnailUrl} onChange={(e) => setContentForm({ ...contentForm, thumbnailUrl: e.target.value })} />
                      </div>
                      {contentForm.thumbnailUrl && <img src={contentForm.thumbnailUrl} alt="Preview" className="w-full h-32 object-cover rounded" />}
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                      <input id="isPublished" type="checkbox" className="h-4 w-4" checked={contentForm.isPublished} onChange={(e) => setContentForm({ ...contentForm, isPublished: e.target.checked })} />
                      <label htmlFor="isPublished" className="text-sm">Publish immediately</label>
                    </div>

                    <div className="flex justify-end gap-2 pt-4 sticky bottom-0 bg-white pb-2">
                      <Button type="button" variant="outline" onClick={() => { setShowContentForm(false); setEditingContent(null); }}>
                        Cancel
                      </Button>
                      <Button type="submit">{editingContent ? 'Update' : 'Create'}</Button>
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
                    <p className="text-sm text-muted-foreground mb-4">{playlist.description}</p>
                  )}
                  <div className="space-y-2 text-sm">
                    <p><strong>Category:</strong> {playlist.category || 'Uncategorized'}</p>
                    <p><strong>Approach:</strong> {playlist.approach || 'Unknown'}</p>
                    <p><strong>Items:</strong> {playlist._count?.items || 0}</p>
                  </div>
                  <div className="flex justify-end gap-2 mt-4">
                    <Button variant="outline" size="sm">Edit</Button>
                    <Button variant="destructive" size="sm" onClick={() => playlist.id && handleDeletePlaylist(playlist.id)}>
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

          {/* Playlist Form Modal */}
          {showPlaylistForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center p-4 z-50 overflow-y-auto">
              <Card className="w-full max-w-[95vw] sm:max-w-lg md:max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col mx-auto rounded-lg shadow-xl">
                <CardHeader className="sticky top-0 bg-white z-10 border-b">
                  <CardTitle>Create New Playlist</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 pr-2">
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="playlistTitle" className="block text-sm font-medium mb-1">Title *</label>
                      <input id="playlistTitle" type="text" className="w-full p-2 border rounded-md" placeholder="Enter playlist title" value={playlistForm.title} onChange={(e) => setPlaylistForm({ ...playlistForm, title: e.target.value })} />
                    </div>
                    <div>
                      <label htmlFor="playlistDescription" className="block text-sm font-medium mb-1">Description</label>
                      <textarea id="playlistDescription" className="w-full p-2 border rounded-md h-20" placeholder="Enter playlist description" value={playlistForm.description} onChange={(e) => setPlaylistForm({ ...playlistForm, description: e.target.value })} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label htmlFor="playlistCategory" className="block text-sm font-medium mb-1">Category</label>
                        <select id="playlistCategory" className="w-full p-2 border rounded-md" value={playlistForm.category} onChange={(e) => setPlaylistForm({ ...playlistForm, category: e.target.value })}>
                          <option value="Mindfulness">Mindfulness</option>
                          <option value="Anxiety">Anxiety</option>
                          <option value="Stress Management">Stress Management</option>
                          <option value="Relaxation">Relaxation</option>
                          <option value="Emotional Intelligence">Emotional Intelligence</option>
                          <option value="Series">Series</option>
                        </select>
                      </div>
                      <div>
                        <label htmlFor="playlistApproach" className="block text-sm font-medium mb-1">Approach</label>
                        <select id="playlistApproach" className="w-full p-2 border rounded-md" value={playlistForm.approach} onChange={(e) => setPlaylistForm({ ...playlistForm, approach: e.target.value })}>
                          <option value="western">Western</option>
                          <option value="eastern">Eastern</option>
                          <option value="hybrid">Hybrid</option>
                          <option value="all">All</option>
                        </select>
                      </div>
                      <div>
                        <label htmlFor="playlistSeverity" className="block text-sm font-medium mb-1">Severity</label>
                        <select id="playlistSeverity" className="w-full p-2 border rounded-md" value={playlistForm.severityLevel} onChange={(e) => setPlaylistForm({ ...playlistForm, severityLevel: e.target.value })}>
                          <option value="Mild">Mild</option>
                          <option value="Moderate">Moderate</option>
                          <option value="Severe">Severe</option>
                        </select>
                      </div>
                      <div className="flex items-center gap-2 pt-6">
                        <input id="playlistPublished" type="checkbox" className="h-4 w-4" checked={playlistForm.isPublished} onChange={(e) => setPlaylistForm({ ...playlistForm, isPublished: e.target.checked })} />
                        <label htmlFor="playlistPublished" className="text-sm">Published</label>
                      </div>
                    </div>
                    <div>
                      <label htmlFor="playlistThumbnail" className="block text-sm font-medium mb-1">Thumbnail URL</label>
                      <input id="playlistThumbnail" type="text" className="w-full p-2 border rounded-md" placeholder="https://..." value={playlistForm.thumbnailUrl} onChange={(e) => setPlaylistForm({ ...playlistForm, thumbnailUrl: e.target.value })} />
                    </div>
                    {playlistForm.thumbnailUrl && (
                      <img src={playlistForm.thumbnailUrl} alt="Preview" className="w-full h-32 object-cover rounded" />
                    )}
                    <div className="flex justify-end gap-2 pt-4 sticky bottom-0 bg-white pb-2">
                      <Button type="button" variant="outline" onClick={() => setShowPlaylistForm(false)}>Cancel</Button>
                      <Button
                        onClick={async () => {
                          try {
                            const adminToken = localStorage.getItem('adminToken');
                            if (!adminToken) {
                              onNavigate('admin-login');
                              return;
                            }
                            const response = await fetch('/api/admin/playlists', {
                              method: 'POST',
                              headers: {
                                'Authorization': `Bearer ${adminToken}`,
                                'Content-Type': 'application/json',
                              },
                              body: JSON.stringify(playlistForm),
                            });
                            if (response.ok) {
                              setShowPlaylistForm(false);
                              // reload playlists
                              const reload = await fetch('/api/admin/playlists', {
                                headers: { 'Authorization': `Bearer ${adminToken}`, 'Cache-Control': 'no-cache' },
                                cache: 'no-store',
                              });
                              if (reload.ok) {
                                const data = await reload.json();
                                setPlaylists(data?.data?.playlists || data || []);
                              }
                            } else {
                              const err = await response.text();
                              setError(err || 'Failed to create playlist');
                            }
                          } catch (e) {
                            console.error('Create playlist error:', e);
                            setError('Failed to create playlist');
                          }
                        }}
                      >
                        Create
                      </Button>
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
              <Button
                variant="outline"
                onClick={() => {
                  localStorage.removeItem('adminToken');
                  onNavigate('admin-login');
                }}
              >
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
