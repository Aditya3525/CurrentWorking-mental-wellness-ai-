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
  Heart,
  Loader2,
  AlertCircle,
  Clock
} from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '../components/ui/dialog';
import { ScrollArea } from '../components/ui/scroll-area';
import { Skeleton } from '../components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { useAdminAuth } from '../contexts/AdminAuthContext';
import { useNotificationStore } from '../stores/notificationStore';

import { ContentForm, ContentRecord } from './ContentForm';
import { ContentList, ContentItem } from './ContentList';
import { PracticeForm, PracticeRecord } from './PracticeForm';
import { PracticesList, Practice } from './PracticesList';

type ToastPush = (toast: { title: string; description?: string; type: 'success' | 'error' | 'warning' | 'info'; duration?: number }) => void;

type AdminUser = { id: string; email: string; role: string; name?: string } | null;

const PRACTICE_LEVELS: Practice['level'][] = ['Beginner', 'Intermediate', 'Advanced'];

const normalizePracticeLevel = (level?: string | null): Practice['level'] => {
  if (level && PRACTICE_LEVELS.includes(level as Practice['level'])) {
    return level as Practice['level'];
  }
  return 'Beginner';
};

const normalizeTags = (raw?: string[] | string | null): string[] => {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw.map(tag => tag.trim()).filter(Boolean);
  }
  if (typeof raw === 'string') {
    return raw
      .split(',')
      .map(tag => tag.trim())
      .filter(Boolean);
  }
  return [];
};

const mapPractice = (rec: PracticeRecord): Practice => {
  return {
    id: rec.id,
    title: rec.title,
    types: rec.types || rec.type || 'meditation',
    type: rec.type,
    duration: rec.duration,
    level: normalizePracticeLevel(rec.level || rec.difficulty),
    difficulty: rec.difficulty,
    approach: rec.approach,
    format: rec.format,
    description: rec.description,
    audioUrl: rec.audioUrl,
    videoUrl: rec.videoUrl,
    youtubeUrl: rec.youtubeUrl,
    thumbnailUrl: rec.thumbnailUrl,
    tags: normalizeTags(rec.tags),
    isPublished: rec.isPublished,
    createdAt:
      typeof (rec as unknown as { createdAt?: string }).createdAt === 'string'
        ? (rec as unknown as { createdAt?: string }).createdAt!
        : new Date().toISOString()
  };
};

const mapContent = (rec: ContentRecord): ContentItem => {
  return {
    id: rec.id,
    title: rec.title,
    type: rec.type,
    approach: rec.approach,
    category: rec.category,
    difficulty: rec.difficulty,
    isPublished: rec.isPublished,
    createdAt:
      typeof (rec as unknown as { createdAt?: string }).createdAt === 'string'
        ? (rec as unknown as { createdAt?: string }).createdAt!
        : new Date().toISOString(),
    description: rec.description || undefined,
    thumbnailUrl: rec.thumbnailUrl || undefined,
    tags: normalizeTags(rec.tags)
  };
};

const ADMIN_API_BASE = '/api/admin';

const fetchAdminCollection = async <TItem, TMapped>(
  endpoint: string,
  mapFn: (item: TItem) => TMapped,
  signal?: AbortSignal
): Promise<TMapped[]> => {
  const response = await fetch(`${ADMIN_API_BASE}${endpoint}`, {
    credentials: 'include',
    signal
  });

  if (!response.ok) {
    throw new Error(`Failed to load ${endpoint}`);
  }

  const json = await response.json();
  const data: unknown = Array.isArray(json) ? json : json?.data;
  if (!Array.isArray(data)) {
    return [];
  }

  return (data as TItem[]).map(mapFn);
};

interface UseAdminDashboardDataResult {
  practices: Practice[];
  contentItems: ContentItem[];
  isLoading: boolean;
  error: string | null;
  lastUpdated: string | null;
  refreshAll: () => Promise<void>;
  setPractices: React.Dispatch<React.SetStateAction<Practice[]>>;
  setContentItems: React.Dispatch<React.SetStateAction<ContentItem[]>>;
  markUpdated: () => void;
}

const useAdminDashboardData = (
  admin: AdminUser,
  push: ToastPush
): UseAdminDashboardDataResult => {
  const [practices, setPractices] = useState<Practice[]>([]);
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const loadAll = useCallback(async (signal?: AbortSignal) => {
    if (!admin) {
      setPractices([]);
      setContentItems([]);
      setIsLoading(false);
      setError(null);
      setLastUpdated(null);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const [practiceResults, contentResults] = await Promise.all([
        fetchAdminCollection<PracticeRecord, Practice>('/practices', mapPractice, signal),
        fetchAdminCollection<ContentRecord, ContentItem>('/content', mapContent, signal)
      ]);
      setPractices(practiceResults);
      setContentItems(contentResults);
      setLastUpdated(new Date().toISOString());
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        return;
      }
      console.error('Error loading dashboard data:', err);
      const message = err instanceof Error ? err.message : 'Failed to load dashboard data';
      setError(message);
      push({
        type: 'error',
        title: 'Error',
        description: message
      });
    } finally {
      setIsLoading(false);
    }
  }, [admin, push]);

  useEffect(() => {
    const controller = new AbortController();
    loadAll(controller.signal);
    return () => controller.abort();
  }, [loadAll]);

  return {
    practices,
    contentItems,
    isLoading,
    error,
    lastUpdated,
    refreshAll: () => loadAll(),
    setPractices,
    setContentItems,
    markUpdated: () => setLastUpdated(new Date().toISOString())
  };
};

type Tab = 'practices' | 'content';

export const AdminDashboard: React.FC = () => {
  const { admin, adminLogout } = useAdminAuth();
  const { push } = useNotificationStore();
  const [tab, setTab] = useState<Tab>('practices');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const {
    practices,
    contentItems,
    isLoading,
    error,
    lastUpdated,
    refreshAll,
    setPractices,
    setContentItems,
    markUpdated
  } = useAdminDashboardData(admin, push);

  const [selectedContentType, setSelectedContentType] = useState<string | null>(null);
  type EditablePractice = PracticeRecord | Practice;
  type EditableContent = ContentRecord | ContentItem;
  const [editingPractice, setEditingPractice] = useState<EditablePractice | null>(null);
  const [editingContent, setEditingContent] = useState<EditableContent | null>(null);
  const [activeModal, setActiveModal] = useState<'form' | 'add-practice' | 'add-content' | null>(null);

  const closeForm = useCallback(() => {
    setActiveModal(null);
    setEditingPractice(null);
    setEditingContent(null);
    setSelectedContentType(null);
  }, []);

  useEffect(() => {
    if (!admin) {
      closeForm();
      setMobileMenuOpen(false);
    }
  }, [admin, closeForm]);

  const openAdd = useCallback(() => {
    setSelectedContentType(null);
    setEditingPractice(null);
    setEditingContent(null);
    setActiveModal(tab === 'content' ? 'add-content' : 'add-practice');
  }, [tab]);

  const openAddForm = useCallback(
    (type?: string) => {
      setEditingPractice(null);
      setEditingContent(null);
      if (tab === 'content') {
        setSelectedContentType(type ?? null);
      }
      setActiveModal('form');
    },
    [tab]
  );

  const handleEditPractice = useCallback((practice: EditablePractice) => {
    setTab('practices');
    setEditingPractice(practice);
    setEditingContent(null);
    setActiveModal('form');
  }, []);

  const handleEditContent = useCallback((content: EditableContent) => {
    setTab('content');
    setEditingContent(content);
    setEditingPractice(null);
    setActiveModal('form');
  }, []);

  const handlePracticeSaved = useCallback(
    (saved: PracticeRecord) => {
      const mapped = mapPractice(saved);
      setPractices(prev => {
        const index = prev.findIndex(item => item.id === mapped.id);
        if (index >= 0) {
          const copy = [...prev];
          copy[index] = mapped;
          return copy;
        }
        return [mapped, ...prev];
      });
      markUpdated();
      closeForm();
    },
    [setPractices, markUpdated, closeForm]
  );

  const handleContentSaved = useCallback(
    (saved: ContentRecord) => {
      const mapped = mapContent(saved);
      setContentItems(prev => {
        const index = prev.findIndex(item => item.id === mapped.id);
        if (index >= 0) {
          const copy = [...prev];
          copy[index] = mapped;
          return copy;
        }
        return [mapped, ...prev];
      });
      markUpdated();
      closeForm();
    },
    [setContentItems, markUpdated, closeForm]
  );

  const handleLogout = useCallback(async () => {
    if (window.confirm('Are you sure you want to logout?')) {
      await adminLogout();
      push({ type: 'success', title: 'Success', description: 'Successfully logged out' });
    }
  }, [adminLogout, push]);

  const handleRefresh = useCallback(() => {
    void refreshAll();
  }, [refreshAll]);

  const stats = useMemo(() => {
    return [
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
  }, [practices, contentItems]);

  const hasData = practices.length > 0 || contentItems.length > 0;
  const isInitialLoading = isLoading && !hasData;

  const formattedLastUpdated = useMemo(() => {
    if (!lastUpdated) return null;
    try {
      return new Date(lastUpdated).toLocaleString();
    } catch {
      return lastUpdated;
    }
  }, [lastUpdated]);

  const isFormOpen = activeModal === 'form';
  const isPracticePickerOpen = activeModal === 'add-practice';
  const isContentPickerOpen = activeModal === 'add-content';
  const isEditingPractice = editingPractice !== null;
  const formTitle = isEditingPractice
    ? 'Update Practice'
    : editingContent
      ? 'Update Content'
      : tab === 'practices'
        ? 'Add Practice'
        : 'Add Content';

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

      <div className="max-w-7xl mx-auto p-6 space-y-8" aria-busy={isLoading}>
        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {isInitialLoading
            ? Array.from({ length: 3 }).map((_, index) => (
                <Card key={`stat-skeleton-${index}`}>
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4">
                      <Skeleton className="h-12 w-12 rounded-lg" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-6 w-16" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            : stats.map((stat, index) => (
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

        {error && (
          <div
            className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
            role="alert"
            aria-live="assertive"
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              className="mt-3"
            >
              Retry sync
            </Button>
          </div>
        )}

        {/* Main Content Tabs */}
        <Tabs value={tab} onValueChange={(value) => setTab(value as Tab)} className="space-y-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
              <Button
                variant="outline"
                onClick={handleRefresh}
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                <Loader2 className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button onClick={openAdd} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add {tab === 'practices' ? 'Practice' : 'Content'}
              </Button>
              {formattedLastUpdated && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground" aria-live="polite">
                  <Clock className="h-3 w-3" />
                  Updated {formattedLastUpdated}
                </span>
              )}
            </div>
          </div>

          {isLoading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Syncing latest data…
            </div>
          )}

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

        <Dialog
          open={isFormOpen}
          onOpenChange={(open) => {
            if (!open) {
              closeForm();
            } else {
              setActiveModal('form');
            }
          }}
        >
          <DialogContent className="admin-dialog-content">
            <DialogHeader className="admin-dialog-header px-6 pt-6 pb-4 border-b">
              <div className="flex items-center gap-3">
                {tab === 'practices' ? (
                  <Brain className="h-5 w-5 text-primary" />
                ) : (
                  <BookOpen className="h-5 w-5 text-primary" />
                )}
                <DialogTitle className="text-lg sm:text-xl font-semibold">{formTitle}</DialogTitle>
              </div>
              <DialogDescription>
                {tab === 'practices'
                  ? 'Create or update mindfulness practices and exercises.'
                  : 'Create or update content entries for your wellbeing library.'}
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="admin-dialog-scroll">
              <div className="admin-dialog-body px-6 py-6">
                {tab === 'practices' ? (
                  <PracticeForm
                    existing={editingPractice ?? undefined}
                    onSaved={handlePracticeSaved}
                    onClose={closeForm}
                  />
                ) : (
                  <ContentForm
                    existing={editingContent ?? undefined}
                    selectedType={selectedContentType}
                    onSaved={handleContentSaved}
                    onClose={closeForm}
                  />
                )}
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </div>

      <Dialog
        open={isContentPickerOpen}
        onOpenChange={(open) => {
          if (open) {
            setActiveModal('add-content');
          } else {
            setActiveModal(prev => (prev === 'add-content' ? null : prev));
          }
        }}
      >
        <DialogContent className="max-w-xl w-full space-y-6">
          <DialogHeader className="space-y-2 text-center">
            <div className="flex justify-center">
              <BookOpen className="h-12 w-12 text-primary" />
            </div>
            <DialogTitle className="text-2xl font-semibold">Add New Content</DialogTitle>
            <DialogDescription>Choose the type of content you want to create</DialogDescription>
          </DialogHeader>
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
              onClick={() => openAddForm('playlist')}
            >
              <div className="flex items-center gap-4">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Video className="h-6 w-6 text-purple-600" />
                </div>
                <div className="text-left">
                  <div className="font-medium">Playlist</div>
                  <div className="text-sm text-muted-foreground">Curated content collections</div>
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
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="ghost" className="w-full sm:w-auto">
                Cancel
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isPracticePickerOpen}
        onOpenChange={(open) => {
          if (open) {
            setActiveModal('add-practice');
          } else {
            setActiveModal(prev => (prev === 'add-practice' ? null : prev));
          }
        }}
      >
        <DialogContent className="max-w-md w-full space-y-4">
          <DialogHeader className="space-y-2 text-center">
            <div className="flex justify-center">
              <Brain className="h-10 w-10 text-primary" />
            </div>
            <DialogTitle className="text-xl sm:text-2xl font-semibold">Add New Practice</DialogTitle>
            <DialogDescription>Choose the type of practice you want to create</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Button
              className="w-full justify-start h-auto p-3 sm:p-4"
              variant="outline"
              onClick={() => openAddForm('meditation')}
            >
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="p-1.5 sm:p-2 bg-purple-100 rounded-lg">
                  <Brain className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
                </div>
                <div className="text-left">
                  <div className="font-medium text-sm sm:text-base">Meditation</div>
                  <div className="text-xs sm:text-sm text-muted-foreground">Guided meditation sessions</div>
                </div>
              </div>
            </Button>

            <Button
              className="w-full justify-start h-auto p-3 sm:p-4"
              variant="outline"
              onClick={() => openAddForm('breathing')}
            >
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="p-1.5 sm:p-2 bg-blue-100 rounded-lg">
                  <Mic className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                </div>
                <div className="text-left">
                  <div className="font-medium text-sm sm:text-base">Breathing Exercise</div>
                  <div className="text-xs sm:text-sm text-muted-foreground">Breathwork and breathing techniques</div>
                </div>
              </div>
            </Button>

            <Button
              className="w-full justify-start h-auto p-3 sm:p-4"
              variant="outline"
              onClick={() => openAddForm('mindfulness')}
            >
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="p-1.5 sm:p-2 bg-green-100 rounded-lg">
                  <Heart className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
                </div>
                <div className="text-left">
                  <div className="font-medium text-sm sm:text-base">Mindfulness</div>
                  <div className="text-xs sm:text-sm text-muted-foreground">Mindfulness and awareness practices</div>
                </div>
              </div>
            </Button>

            <Button
              className="w-full justify-start h-auto p-3 sm:p-4"
              variant="outline"
              onClick={() => openAddForm('cbt')}
            >
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="p-1.5 sm:p-2 bg-orange-100 rounded-lg">
                  <BookOpen className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600" />
                </div>
                <div className="text-left">
                  <div className="font-medium text-sm sm:text-base">CBT Exercise</div>
                  <div className="text-xs sm:text-sm text-muted-foreground">Cognitive behavioral therapy techniques</div>
                </div>
              </div>
            </Button>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="ghost" className="w-full sm:w-auto">
                Cancel
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;
