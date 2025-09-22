import React, { useEffect, useState } from 'react';
import { 
  Plus, 
  LogOut, 
  Brain, 
  BookOpen, 
  Shield,
  Menu,
  X,
  FileText,
  Headphones,
  Video,
  BookMarked,
  Mic,
  Heart
} from 'lucide-react';

import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { useAdminAuth } from '../contexts/AdminAuthContext';
import { useToast } from '../contexts/ToastContext';

import { ContentForm, ContentRecord } from './ContentForm';
import { ContentList, ContentItem } from './ContentList';
import { PracticeForm, PracticeRecord } from './PracticeForm';
import { PracticesList, Practice } from './PracticesList';

type Tab = 'practices' | 'content';

export const AdminDashboard: React.FC = () => {
  const { admin, isAdminAuthenticated, isLoading, adminLogout } = useAdminAuth();
  const { push } = useToast();
  const [tab, setTab] = useState<Tab>('practices');
  const [showForm, setShowForm] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Modal states for card-like functionality
  const [showAddContentModal, setShowAddContentModal] = useState(false);
  const [showAddPracticeModal, setShowAddPracticeModal] = useState(false);
  
  // Store full record objects as received from lists/forms without tight typing to avoid cross-file interface drift
  // Mirror shapes used in list components for type compatibility
  type EditablePractice = PracticeRecord | Practice;
  type EditableContent = ContentRecord | ContentItem;
  const [editingPractice, setEditingPractice] = useState<EditablePractice | null>(null);
  const [editingContent, setEditingContent] = useState<EditableContent | null>(null);
  const [practices, setPractices] = useState<Practice[]>([]);
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);

  // Check authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAdminAuthenticated || !admin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-muted-foreground mb-4">You need to be logged in as an admin to access this page.</p>
          <button 
            onClick={() => window.location.href = '/'}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  // Load initial data when admin is authenticated
  useEffect(() => {
    const loadInitialData = async () => {
      if (!admin) return;
      
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      
      try {
        // Load practices
        const practicesResponse = await fetch(`${API_BASE_URL}/admin/practices`, {
          credentials: 'include'
        });
        if (practicesResponse.ok) {
          const practicesData = await practicesResponse.json();
          if (practicesData.success) {
            setPractices(practicesData.data.map(mapPractice));
          }
        }

        // Load content
        const contentResponse = await fetch(`${API_BASE_URL}/admin/content`, {
          credentials: 'include'
        });
        if (contentResponse.ok) {
          const contentData = await contentResponse.json();
          if (contentData.success) {
            setContentItems(contentData.data.map(mapContent));
          }
        }
      } catch (error) {
        console.error('Error loading initial data:', error);
        push({ type: 'error', message: 'Failed to load dashboard data' });
      }
    };

    loadInitialData();
  }, [admin, push]);

  const openAdd = () => {
    // Show the appropriate modal based on current tab
    if (tab === 'content') {
      setShowAddContentModal(true);
    } else if (tab === 'practices') {
      setShowAddPracticeModal(true);
    }
  };

  const openAddForm = (type?: string) => {
    setEditingPractice(null);
    setEditingContent(null);
    setShowForm(true);
    setShowAddContentModal(false);
    setShowAddPracticeModal(false);
    
    // If type is specified, pre-populate the form type
    if (type && tab === 'content') {
      // We'll handle content type pre-population in the form
    } else if (type && tab === 'practices') {
      // We'll handle practice type pre-population in the form
    }
  };

  const handleEditPractice = (p: EditablePractice) => { 
    setEditingPractice(p); 
    setEditingContent(null); 
    setShowForm(true); 
  };
  
  const handleEditContent = (c: EditableContent) => { 
    setEditingContent(c); 
    setEditingPractice(null); 
    setShowForm(true); 
  };

  function mapPractice(rec: PracticeRecord): Practice {
    return {
      id: rec.id,
      title: rec.title,
      types: rec.types || rec.type || 'Meditation',
      type: rec.type,
      duration: rec.duration,
      level: rec.level || rec.difficulty || 'Beginner',
      difficulty: rec.difficulty,
      approach: rec.approach,
      description: rec.description,
      audioUrl: rec.audioUrl,
      videoUrl: rec.videoUrl,
      youtubeUrl: rec.youtubeUrl,
      thumbnailUrl: rec.thumbnailUrl,
      tags: rec.tags,
      isPublished: rec.isPublished,
      createdAt: (typeof (rec as unknown as { createdAt?: string }).createdAt === 'string') ? (rec as unknown as { createdAt?: string }).createdAt! : new Date().toISOString()
    };
  }

  function mapContent(rec: ContentRecord): ContentItem {
    return {
      id: rec.id,
      title: rec.title,
      type: rec.type,
      approach: rec.approach,
      isPublished: rec.isPublished,
      createdAt: (typeof (rec as unknown as { createdAt?: string }).createdAt === 'string') ? (rec as unknown as { createdAt?: string }).createdAt! : new Date().toISOString(),
      description: rec.description || undefined,
      thumbnailUrl: rec.thumbnailUrl || undefined,
      tags: rec.tags || undefined
    };
  }

  const handlePracticeSaved = (saved: PracticeRecord) => {
    const p = mapPractice(saved);
    setPractices(prev => {
      const idx = prev.findIndex(i=>i.id===p.id);
      if(idx>=0){ const copy=[...prev]; copy[idx]=p; return copy; }
      return [p, ...prev];
    });
    setShowForm(false); 
    setEditingPractice(null); 
    setEditingContent(null);
  };

  const handleContentSaved = (saved: ContentRecord) => {
    const c = mapContent(saved);
    setContentItems(prev => {
      const idx = prev.findIndex(i=>i.id===c.id);
      if(idx>=0){ const copy=[...prev]; copy[idx]=c; return copy; }
      return [c, ...prev];
    });
    setShowForm(false); 
    setEditingPractice(null); 
    setEditingContent(null);
  };

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to logout?')) {
      await adminLogout();
      push({ type: 'success', message: 'Successfully logged out' });
    }
  };

  // Quick stats for dashboard
  const stats = [
    {
      title: 'Total Practices',
      value: practices.length,
      icon: Brain,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Content Items',
      value: contentItems.length,
      icon: BookOpen,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Published',
      value: [...practices, ...contentItems].filter(item => item.isPublished).length,
      icon: Shield,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/10 to-accent/10 border-b">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex justify-between items-center">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <Shield className="h-6 w-6 text-primary" />
                <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
              </div>
              <p className="text-muted-foreground">
                Manage practices, content, and monitor platform health
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Mobile menu toggle */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
              
              {/* Desktop menu */}
              <div className="hidden md:flex items-center gap-4">
                <div className="text-right">
                  <Badge variant="secondary" className="bg-primary/10 text-primary">
                    {admin?.role || 'Admin'}
                  </Badge>
                  <p className="text-sm text-muted-foreground mt-1">
                    {admin?.email}
                  </p>
                </div>
                
                <Button
                  variant="outline"
                  onClick={handleLogout}
                  className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </div>
            </div>
          </div>
          
          {/* Mobile menu */}
          {mobileMenuOpen && (
            <div className="md:hidden mt-4 p-4 bg-background rounded-lg border space-y-3">
              <div className="text-center">
                <Badge variant="secondary" className="bg-primary/10 text-primary">
                  {admin?.role || 'Admin'}
                </Badge>
                <p className="text-sm text-muted-foreground mt-1">
                  {admin?.email}
                </p>
              </div>
              <Button
                variant="outline"
                onClick={handleLogout}
                className="w-full text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {stats.map((stat, index) => (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {stat.title}
                    </p>
                    <p className="text-2xl font-bold">
                      {stat.value}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Content Tabs */}
        <Tabs value={tab} onValueChange={(value) => setTab(value as Tab)} className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="practices" className="flex items-center gap-2">
                <Brain className="h-4 w-4" />
                Practices
              </TabsTrigger>
              <TabsTrigger value="content" className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Content
              </TabsTrigger>
            </TabsList>
            
            <Button onClick={openAdd} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add {tab === 'practices' ? 'Practice' : 'Content'}
            </Button>
          </div>

          <TabsContent value="practices" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-primary" />
                  Practices Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                <PracticesList 
                  embedded 
                  onAdd={openAdd} 
                  onEdit={handleEditPractice} 
                  itemsExternal={practices} 
                  setItemsExternal={setPractices} 
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="content" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  Content Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ContentList 
                  embedded 
                  onAdd={openAdd} 
                  onEdit={handleEditContent} 
                  itemsExternal={contentItems} 
                  setItemsExternal={setContentItems} 
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Form Modal - Now as overlay modal */}
        {showForm && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto border-primary/20 shadow-lg">
              <CardHeader className="border-b sticky top-0 bg-background z-10">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    {tab === 'practices' ? (
                      <Brain className="h-5 w-5 text-primary" />
                    ) : (
                      <BookOpen className="h-5 w-5 text-primary" />
                    )}
                    {editingPractice || editingContent ? 'Update' : 'Add'} {tab === 'practices' ? 'Practice' : 'Content'}
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => { 
                      setShowForm(false); 
                      setEditingPractice(null); 
                      setEditingContent(null); 
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {tab === 'practices' && (
                  <PracticeForm 
                    existing={editingPractice ?? undefined} 
                    onSaved={handlePracticeSaved} 
                    onClose={() => { 
                      setShowForm(false); 
                      setEditingPractice(null); 
                    }} 
                  />
                )}
                {tab === 'content' && (
                  <ContentForm 
                    existing={editingContent ?? undefined} 
                    onSaved={handleContentSaved} 
                    onClose={() => { 
                      setShowForm(false); 
                      setEditingContent(null); 
                    }} 
                  />
                )}
              </CardContent>
            </Card>
          </div>
        )}
        </div>

      {/* Add Content Modal */}
      {showAddContentModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardContent className="p-6 space-y-6">
              <div className="text-center space-y-2">
                <BookOpen className="h-12 w-12 text-primary mx-auto" />
                <h3 className="text-2xl font-semibold">Add New Content</h3>
                <p className="text-muted-foreground">Choose the type of content you want to create</p>
              </div>
              <div className="space-y-3">
                <Button 
                  className="w-full justify-start h-auto p-4" 
                  variant="outline"
                  onClick={() => openAddForm('article')}
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <FileText className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="text-left">
                      <div className="font-medium">Article</div>
                      <div className="text-sm text-muted-foreground">Written content and guides</div>
                    </div>
                  </div>
                </Button>
                
                <Button 
                  className="w-full justify-start h-auto p-4" 
                  variant="outline"
                  onClick={() => openAddForm('audio')}
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Headphones className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="text-left">
                      <div className="font-medium">Audio</div>
                      <div className="text-sm text-muted-foreground">Podcasts and audio content</div>
                    </div>
                  </div>
                </Button>
                
                <Button 
                  className="w-full justify-start h-auto p-4" 
                  variant="outline"
                  onClick={() => openAddForm('video')}
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Video className="h-6 w-6 text-purple-600" />
                    </div>
                    <div className="text-left">
                      <div className="font-medium">Video</div>
                      <div className="text-sm text-muted-foreground">Video tutorials and sessions</div>
                    </div>
                  </div>
                </Button>
                
                <Button 
                  className="w-full justify-start h-auto p-4" 
                  variant="outline"
                  onClick={() => openAddForm('story')}
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <BookMarked className="h-6 w-6 text-orange-600" />
                    </div>
                    <div className="text-left">
                      <div className="font-medium">Story</div>
                      <div className="text-sm text-muted-foreground">Inspirational stories and experiences</div>
                    </div>
                  </div>
                </Button>
              </div>
              <Button 
                variant="ghost" 
                className="w-full" 
                onClick={() => setShowAddContentModal(false)}
              >
                Cancel
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Add Practice Modal */}
      {showAddPracticeModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardContent className="p-6 space-y-6">
              <div className="text-center space-y-2">
                <Brain className="h-12 w-12 text-primary mx-auto" />
                <h3 className="text-2xl font-semibold">Add New Practice</h3>
                <p className="text-muted-foreground">Choose the type of practice you want to create</p>
              </div>
              <div className="space-y-3">
                <Button 
                  className="w-full justify-start h-auto p-4" 
                  variant="outline"
                  onClick={() => openAddForm('meditation')}
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Brain className="h-6 w-6 text-purple-600" />
                    </div>
                    <div className="text-left">
                      <div className="font-medium">Meditation</div>
                      <div className="text-sm text-muted-foreground">Guided meditation sessions</div>
                    </div>
                  </div>
                </Button>
                
                <Button 
                  className="w-full justify-start h-auto p-4" 
                  variant="outline"
                  onClick={() => openAddForm('breathing')}
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Mic className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="text-left">
                      <div className="font-medium">Breathing Exercise</div>
                      <div className="text-sm text-muted-foreground">Breathwork and breathing techniques</div>
                    </div>
                  </div>
                </Button>
                
                <Button 
                  className="w-full justify-start h-auto p-4" 
                  variant="outline"
                  onClick={() => openAddForm('mindfulness')}
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Heart className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="text-left">
                      <div className="font-medium">Mindfulness</div>
                      <div className="text-sm text-muted-foreground">Mindfulness and awareness practices</div>
                    </div>
                  </div>
                </Button>
                
                <Button 
                  className="w-full justify-start h-auto p-4" 
                  variant="outline"
                  onClick={() => openAddForm('cbt')}
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <BookOpen className="h-6 w-6 text-orange-600" />
                    </div>
                    <div className="text-left">
                      <div className="font-medium">CBT Exercise</div>
                      <div className="text-sm text-muted-foreground">Cognitive behavioral therapy techniques</div>
                    </div>
                  </div>
                </Button>
              </div>
              <Button 
                variant="ghost" 
                className="w-full" 
                onClick={() => setShowAddPracticeModal(false)}
              >
                Cancel
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
