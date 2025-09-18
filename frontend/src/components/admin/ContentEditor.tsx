import React, { useState, useEffect, useRef } from 'react';
import { 
  Save, 
  Eye, 
  X, 
  Plus, 
  Trash2, 
  ArrowLeft,
  Edit3,
  Tag,
  Globe,
  Users,
  Calendar,
  Clock,
  AlertCircle,
  Check,
  ChevronDown,
  ChevronUp,
  History,
  Copy,
  Download,
  ExternalLink,
  Settings,
  Hash,
  Target,
  Layers,
  FileText,
  Image as ImageIcon,
  Link as LinkIcon
} from 'lucide-react';

// Types
interface ContentMetadata {
  id: string;
  title: string;
  description: string;
  type: 'video' | 'audio' | 'article' | 'pdf' | 'playlist';
  category: string;
  subcategory: string;
  approach: 'western' | 'eastern' | 'hybrid';
  severity: 'low' | 'medium' | 'high';
  tags: string[];
  author: string;
  createdAt: Date;
  updatedAt: Date;
  status: 'draft' | 'published' | 'archived';
  
  // SEO & Metadata
  slug?: string;
  metaTitle?: string;
  metaDescription?: string;
  keywords?: string[];
  canonicalUrl?: string;
  
  // Content relationships
  relatedContent?: string[];
  prerequisites?: string[];
  followUpContent?: string[];
  
  // Analytics & Engagement
  views?: number;
  likes?: number;
  completionRate?: number;
  averageRating?: number;
  reviewCount?: number;
  
  // Technical metadata
  fileSize?: number;
  duration?: string;
  resolution?: string;
  encoding?: string;
  thumbnailUrl?: string;
}

interface ContentVersion {
  id: string;
  version: string;
  createdAt: Date;
  author: string;
  changes: string;
  data: Partial<ContentMetadata>;
}

interface ContentEditorProps {
  contentId: string;
  onNavigate: (page: string) => void;
  onSave?: (data: ContentMetadata) => void;
}

const categories = [
  'Meditation', 'Psychology', 'Sleep', 'Therapy', 'Mindfulness', 
  'Stress Management', 'Anxiety', 'Depression', 'Self-Care', 'Wellness'
];

const subcategories: Record<string, string[]> = {
  'Meditation': ['Breathing', 'Mindfulness', 'Loving-kindness', 'Body Scan', 'Walking'],
  'Psychology': ['Anxiety', 'Depression', 'Trauma', 'Relationships', 'Self-esteem'],
  'Sleep': ['Relaxation', 'Sounds', 'Stories', 'Music', 'Guided'],
  'Therapy': ['CBT', 'DBT', 'ACT', 'Mindfulness-based', 'Exposure'],
  'Mindfulness': ['Present Moment', 'Awareness', 'Acceptance', 'Non-judgment', 'Breathing'],
  'Stress Management': ['Relaxation', 'Coping Skills', 'Time Management', 'Boundaries', 'Exercise'],
  'Anxiety': ['Techniques', 'Exposure', 'Grounding', 'Breathing', 'Progressive Relaxation'],
  'Depression': ['Mood Lifting', 'Activity', 'Thoughts', 'Behavioral', 'Social'],
  'Self-Care': ['Daily Routines', 'Boundaries', 'Rest', 'Nutrition', 'Exercise'],
  'Wellness': ['Holistic', 'Lifestyle', 'Balance', 'Growth', 'Prevention']
};

const mockContent: ContentMetadata = {
  id: '1',
  title: 'Advanced Mindfulness Meditation for Anxiety Relief',
  description: 'A comprehensive 20-minute guided meditation session designed to help individuals manage anxiety through advanced mindfulness techniques.',
  type: 'audio',
  category: 'Meditation',
  subcategory: 'Mindfulness',
  approach: 'hybrid',
  severity: 'medium',
  tags: ['anxiety', 'mindfulness', 'guided meditation', 'breathing', 'relaxation'],
  author: 'Dr. Sarah Johnson',
  createdAt: new Date('2024-01-15'),
  updatedAt: new Date('2024-02-20'),
  status: 'published',
  slug: 'advanced-mindfulness-meditation-anxiety-relief',
  metaTitle: 'Advanced Mindfulness Meditation for Anxiety Relief - Mental Wellbeing App',
  metaDescription: 'Discover peace with our 20-minute guided mindfulness meditation designed specifically for anxiety relief. Expert-led session with proven techniques.',
  keywords: ['mindfulness meditation', 'anxiety relief', 'guided meditation', 'stress reduction', 'mental health'],
  canonicalUrl: 'https://mentalwellbeing.app/content/meditation/advanced-mindfulness-anxiety-relief',
  relatedContent: ['2', '3', '5'],
  prerequisites: ['4'],
  followUpContent: ['6', '7'],
  views: 15420,
  likes: 1240,
  completionRate: 78,
  averageRating: 4.6,
  reviewCount: 342,
  fileSize: 45600000,
  duration: '20:15',
  encoding: 'MP3, 320kbps',
  thumbnailUrl: '/thumbnails/mindfulness-meditation.jpg'
};

const mockVersions: ContentVersion[] = [
  {
    id: '1',
    version: '1.3.0',
    createdAt: new Date('2024-02-20'),
    author: 'Dr. Sarah Johnson',
    changes: 'Updated meditation script for better clarity and added background music fade-in/out',
    data: { title: 'Advanced Mindfulness Meditation for Anxiety Relief', status: 'published' }
  },
  {
    id: '2',
    version: '1.2.0',
    createdAt: new Date('2024-02-01'),
    author: 'Dr. Sarah Johnson',
    changes: 'Improved audio quality and reduced background noise',
    data: { title: 'Advanced Mindfulness Meditation for Anxiety Relief', status: 'published' }
  },
  {
    id: '3',
    version: '1.1.0',
    createdAt: new Date('2024-01-20'),
    author: 'Content Team',
    changes: 'Added new introduction and updated tags',
    data: { title: 'Advanced Mindfulness Meditation for Anxiety Relief', status: 'draft' }
  }
];

export const ContentEditor: React.FC<ContentEditorProps> = ({ 
  contentId, 
  onNavigate, 
  onSave 
}) => {
  const [content, setContent] = useState<ContentMetadata>(mockContent);
  const [originalContent, setOriginalContent] = useState<ContentMetadata>(mockContent);
  const [versions, setVersions] = useState<ContentVersion[]>(mockVersions);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [activeTab, setActiveTab] = useState<'basic' | 'metadata' | 'seo' | 'relationships' | 'analytics' | 'versions'>('basic');
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // Tag management
  const [currentTag, setCurrentTag] = useState('');
  const [currentKeyword, setCurrentKeyword] = useState('');
  
  // Related content management
  const [showRelatedSelector, setShowRelatedSelector] = useState(false);
  const [showPrereqSelector, setShowPrereqSelector] = useState(false);
  const [showFollowUpSelector, setShowFollowUpSelector] = useState(false);

  // Auto-save
  const autoSaveTimer = useRef<NodeJS.Timeout>();

  useEffect(() => {
    // Load content data
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setContent(mockContent);
      setOriginalContent(mockContent);
      setIsLoading(false);
    }, 500);
  }, [contentId]);

  useEffect(() => {
    // Check for changes
    const changed = JSON.stringify(content) !== JSON.stringify(originalContent);
    setHasChanges(changed);

    // Auto-save
    if (changed && autoSaveTimer.current) {
      clearTimeout(autoSaveTimer.current);
    }
    
    if (changed) {
      autoSaveTimer.current = setTimeout(() => {
        handleAutoSave();
      }, 3000);
    }

    return () => {
      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current);
      }
    };
  }, [content, originalContent]);

  const handleAutoSave = async () => {
    if (!hasChanges) return;
    
    setIsSaving(true);
    try {
      // Simulate auto-save
      await new Promise(resolve => setTimeout(resolve, 800));
      setOriginalContent(content);
    } catch (error) {
      console.error('Auto-save failed:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setOriginalContent(content);
      onSave?.(content);
      setHasChanges(false);
    } catch (error) {
      console.error('Save failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTagAdd = () => {
    if (currentTag.trim() && !content.tags.includes(currentTag.trim())) {
      setContent(prev => ({
        ...prev,
        tags: [...prev.tags, currentTag.trim()]
      }));
      setCurrentTag('');
    }
  };

  const handleTagRemove = (tagToRemove: string) => {
    setContent(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleKeywordAdd = () => {
    if (currentKeyword.trim() && !content.keywords?.includes(currentKeyword.trim())) {
      setContent(prev => ({
        ...prev,
        keywords: [...(prev.keywords || []), currentKeyword.trim()]
      }));
      setCurrentKeyword('');
    }
  };

  const handleKeywordRemove = (keywordToRemove: string) => {
    setContent(prev => ({
      ...prev,
      keywords: prev.keywords?.filter(keyword => keyword !== keywordToRemove) || []
    }));
  };

  const generateSlug = () => {
    const slug = content.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
    
    setContent(prev => ({ ...prev, slug }));
  };

  const tabs = [
    { id: 'basic', label: 'Basic Info', icon: Edit3 },
    { id: 'metadata', label: 'Metadata', icon: Tag },
    { id: 'seo', label: 'SEO', icon: Globe },
    { id: 'relationships', label: 'Relationships', icon: Layers },
    { id: 'analytics', label: 'Analytics', icon: Target },
    { id: 'versions', label: 'Versions', icon: History }
  ] as const;

  if (isLoading && !content.id) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => onNavigate('content-list')}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">Edit Content</h1>
            <div className="flex items-center space-x-4 mt-1">
              <p className="text-gray-400">ID: {content.id}</p>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                content.status === 'published' ? 'bg-green-900 text-green-200' :
                content.status === 'draft' ? 'bg-yellow-900 text-yellow-200' :
                'bg-gray-900 text-gray-200'
              }`}>
                {content.status}
              </span>
              {hasChanges && (
                <div className="flex items-center space-x-1 text-xs text-orange-400">
                  <AlertCircle className="w-3 h-3" />
                  <span>Unsaved changes</span>
                </div>
              )}
              {isSaving && (
                <div className="flex items-center space-x-1 text-xs text-blue-400">
                  <Clock className="w-3 h-3 animate-spin" />
                  <span>Auto-saving...</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => {/* Preview logic */}}
            className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors flex items-center space-x-2"
          >
            <Eye className="w-4 h-4" />
            <span>Preview</span>
          </button>
          
          <button
            onClick={handleSave}
            disabled={!hasChanges || isLoading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>Save Changes</span>
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg">
        <div className="flex overflow-x-auto">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex-shrink-0 flex items-center space-x-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === id
                  ? 'border-blue-500 text-blue-400 bg-gray-750'
                  : 'border-transparent text-gray-400 hover:text-gray-300 hover:bg-gray-750'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
        {activeTab === 'basic' && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-white mb-4">Basic Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-2">
                  Title
                </label>
                <input
                  id="title"
                  type="text"
                  value={content.title}
                  onChange={(e) => setContent(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="md:col-span-2">
                <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  id="description"
                  value={content.description}
                  onChange={(e) => setContent(prev => ({ ...prev, description: e.target.value }))}
                  rows={4}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-300 mb-2">
                  Category
                </label>
                <select
                  id="category"
                  value={content.category}
                  onChange={(e) => setContent(prev => ({ 
                    ...prev, 
                    category: e.target.value,
                    subcategory: '' 
                  }))}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="subcategory" className="block text-sm font-medium text-gray-300 mb-2">
                  Subcategory
                </label>
                <select
                  id="subcategory"
                  value={content.subcategory}
                  onChange={(e) => setContent(prev => ({ ...prev, subcategory: e.target.value }))}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select subcategory</option>
                  {content.category && subcategories[content.category]?.map(subcategory => (
                    <option key={subcategory} value={subcategory}>{subcategory}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="approach" className="block text-sm font-medium text-gray-300 mb-2">
                  Approach
                </label>
                <select
                  id="approach"
                  value={content.approach}
                  onChange={(e) => setContent(prev => ({ ...prev, approach: e.target.value as any }))}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="western">Western</option>
                  <option value="eastern">Eastern</option>
                  <option value="hybrid">Hybrid</option>
                </select>
              </div>

              <div>
                <label htmlFor="severity" className="block text-sm font-medium text-gray-300 mb-2">
                  Severity Level
                </label>
                <select
                  id="severity"
                  value={content.severity}
                  onChange={(e) => setContent(prev => ({ ...prev, severity: e.target.value as any }))}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              <div>
                <label htmlFor="author" className="block text-sm font-medium text-gray-300 mb-2">
                  Author
                </label>
                <input
                  id="author"
                  type="text"
                  value={content.author}
                  onChange={(e) => setContent(prev => ({ ...prev, author: e.target.value }))}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-300 mb-2">
                  Status
                </label>
                <select
                  id="status"
                  value={content.status}
                  onChange={(e) => setContent(prev => ({ ...prev, status: e.target.value as any }))}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'metadata' && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-white mb-4">Content Metadata</h2>
            
            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Tags
              </label>
              <div className="flex flex-wrap gap-2 mb-3">
                {content.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center space-x-1 px-3 py-1 bg-blue-600 text-white rounded-full text-sm"
                  >
                    <span>{tag}</span>
                    <button
                      type="button"
                      onClick={() => handleTagRemove(tag)}
                      className="text-blue-200 hover:text-white"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={currentTag}
                  onChange={(e) => setCurrentTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleTagAdd())}
                  placeholder="Add a tag..."
                  className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={handleTagAdd}
                  className="px-4 py-2 bg-gray-700 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Technical Metadata */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label htmlFor="duration" className="block text-sm font-medium text-gray-300 mb-2">
                  Duration
                </label>
                <input
                  id="duration"
                  type="text"
                  value={content.duration || ''}
                  onChange={(e) => setContent(prev => ({ ...prev, duration: e.target.value }))}
                  placeholder="e.g., 20:15"
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="fileSize" className="block text-sm font-medium text-gray-300 mb-2">
                  File Size (bytes)
                </label>
                <input
                  id="fileSize"
                  type="number"
                  value={content.fileSize || ''}
                  onChange={(e) => setContent(prev => ({ ...prev, fileSize: parseInt(e.target.value) || undefined }))}
                  placeholder="45600000"
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="encoding" className="block text-sm font-medium text-gray-300 mb-2">
                  Encoding
                </label>
                <input
                  id="encoding"
                  type="text"
                  value={content.encoding || ''}
                  onChange={(e) => setContent(prev => ({ ...prev, encoding: e.target.value }))}
                  placeholder="MP3, 320kbps"
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label htmlFor="thumbnailUrl" className="block text-sm font-medium text-gray-300 mb-2">
                Thumbnail URL
              </label>
              <input
                id="thumbnailUrl"
                type="url"
                value={content.thumbnailUrl || ''}
                onChange={(e) => setContent(prev => ({ ...prev, thumbnailUrl: e.target.value }))}
                placeholder="https://example.com/thumbnail.jpg"
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        )}

        {activeTab === 'seo' && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-white mb-4">SEO & Web Metadata</h2>
            
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="slug" className="block text-sm font-medium text-gray-300">
                    URL Slug
                  </label>
                  <button
                    type="button"
                    onClick={generateSlug}
                    className="text-xs text-blue-400 hover:text-blue-300"
                  >
                    Auto-generate
                  </button>
                </div>
                <input
                  id="slug"
                  type="text"
                  value={content.slug || ''}
                  onChange={(e) => setContent(prev => ({ ...prev, slug: e.target.value }))}
                  placeholder="advanced-mindfulness-meditation-anxiety-relief"
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {content.slug && (
                  <p className="mt-1 text-xs text-gray-500">
                    URL: https://mentalwellbeing.app/content/{content.category.toLowerCase()}/{content.slug}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="metaTitle" className="block text-sm font-medium text-gray-300 mb-2">
                  Meta Title
                </label>
                <input
                  id="metaTitle"
                  type="text"
                  value={content.metaTitle || ''}
                  onChange={(e) => setContent(prev => ({ ...prev, metaTitle: e.target.value }))}
                  placeholder="Page title for search engines..."
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="mt-1 text-xs text-gray-500">
                  {content.metaTitle?.length || 0}/60 characters (recommended)
                </p>
              </div>

              <div>
                <label htmlFor="metaDescription" className="block text-sm font-medium text-gray-300 mb-2">
                  Meta Description
                </label>
                <textarea
                  id="metaDescription"
                  value={content.metaDescription || ''}
                  onChange={(e) => setContent(prev => ({ ...prev, metaDescription: e.target.value }))}
                  rows={3}
                  placeholder="Brief description for search engine results..."
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
                <p className="mt-1 text-xs text-gray-500">
                  {content.metaDescription?.length || 0}/160 characters (recommended)
                </p>
              </div>

              <div>
                <label htmlFor="canonicalUrl" className="block text-sm font-medium text-gray-300 mb-2">
                  Canonical URL
                </label>
                <input
                  id="canonicalUrl"
                  type="url"
                  value={content.canonicalUrl || ''}
                  onChange={(e) => setContent(prev => ({ ...prev, canonicalUrl: e.target.value }))}
                  placeholder="https://mentalwellbeing.app/content/..."
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Keywords */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  SEO Keywords
                </label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {content.keywords?.map((keyword) => (
                    <span
                      key={keyword}
                      className="inline-flex items-center space-x-1 px-3 py-1 bg-green-600 text-white rounded-full text-sm"
                    >
                      <span>{keyword}</span>
                      <button
                        type="button"
                        onClick={() => handleKeywordRemove(keyword)}
                        className="text-green-200 hover:text-white"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={currentKeyword}
                    onChange={(e) => setCurrentKeyword(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleKeywordAdd())}
                    placeholder="Add SEO keyword..."
                    className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={handleKeywordAdd}
                    className="px-4 py-2 bg-gray-700 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'relationships' && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-white mb-4">Content Relationships</h2>
            
            <div className="space-y-6">
              {/* Related Content */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-300">
                    Related Content
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowRelatedSelector(true)}
                    className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors"
                  >
                    Add Related
                  </button>
                </div>
                <div className="space-y-2">
                  {content.relatedContent?.map((contentId) => (
                    <div key={contentId} className="flex items-center justify-between p-3 bg-gray-750 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <FileText className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-white text-sm">Content ID: {contentId}</p>
                          <p className="text-gray-400 text-xs">Related meditation content</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setContent(prev => ({
                          ...prev,
                          relatedContent: prev.relatedContent?.filter(id => id !== contentId)
                        }))}
                        className="text-red-400 hover:text-red-300"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {(!content.relatedContent || content.relatedContent.length === 0) && (
                    <p className="text-gray-500 text-sm text-center py-4">No related content added</p>
                  )}
                </div>
              </div>

              {/* Prerequisites */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-300">
                    Prerequisites
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPrereqSelector(true)}
                    className="px-3 py-1 bg-orange-600 text-white rounded text-xs hover:bg-orange-700 transition-colors"
                  >
                    Add Prerequisite
                  </button>
                </div>
                <div className="space-y-2">
                  {content.prerequisites?.map((contentId) => (
                    <div key={contentId} className="flex items-center justify-between p-3 bg-gray-750 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <FileText className="w-4 h-4 text-orange-400" />
                        <div>
                          <p className="text-white text-sm">Content ID: {contentId}</p>
                          <p className="text-gray-400 text-xs">Required before this content</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setContent(prev => ({
                          ...prev,
                          prerequisites: prev.prerequisites?.filter(id => id !== contentId)
                        }))}
                        className="text-red-400 hover:text-red-300"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {(!content.prerequisites || content.prerequisites.length === 0) && (
                    <p className="text-gray-500 text-sm text-center py-4">No prerequisites defined</p>
                  )}
                </div>
              </div>

              {/* Follow-up Content */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-300">
                    Follow-up Content
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowFollowUpSelector(true)}
                    className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 transition-colors"
                  >
                    Add Follow-up
                  </button>
                </div>
                <div className="space-y-2">
                  {content.followUpContent?.map((contentId) => (
                    <div key={contentId} className="flex items-center justify-between p-3 bg-gray-750 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <FileText className="w-4 h-4 text-green-400" />
                        <div>
                          <p className="text-white text-sm">Content ID: {contentId}</p>
                          <p className="text-gray-400 text-xs">Recommended after this content</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setContent(prev => ({
                          ...prev,
                          followUpContent: prev.followUpContent?.filter(id => id !== contentId)
                        }))}
                        className="text-red-400 hover:text-red-300"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {(!content.followUpContent || content.followUpContent.length === 0) && (
                    <p className="text-gray-500 text-sm text-center py-4">No follow-up content defined</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-white mb-4">Analytics & Performance</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-gray-750 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Views</p>
                    <p className="text-2xl font-bold text-white">{content.views?.toLocaleString()}</p>
                  </div>
                  <Eye className="w-8 h-8 text-blue-400" />
                </div>
              </div>

              <div className="bg-gray-750 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Likes</p>
                    <p className="text-2xl font-bold text-white">{content.likes?.toLocaleString()}</p>
                  </div>
                  <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-lg">♥</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-750 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Completion Rate</p>
                    <p className="text-2xl font-bold text-white">{content.completionRate}%</p>
                  </div>
                  <Check className="w-8 h-8 text-green-400" />
                </div>
              </div>

              <div className="bg-gray-750 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Rating</p>
                    <p className="text-2xl font-bold text-white">{content.averageRating}/5</p>
                    <p className="text-xs text-gray-500">({content.reviewCount} reviews)</p>
                  </div>
                  <div className="text-yellow-400 text-lg">★</div>
                </div>
              </div>
            </div>

            <div className="bg-gray-750 rounded-lg p-6">
              <h3 className="text-white font-medium mb-4">Engagement Overview</h3>
              <div className="h-64 flex items-center justify-center text-gray-500">
                <p>Analytics chart would be rendered here</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'versions' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Version History</h2>
              <div className="flex items-center space-x-2">
                <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded">
                  <Copy className="w-4 h-4" />
                </button>
                <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded">
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {versions.map((version, index) => (
                <div key={version.id} className="bg-gray-750 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="px-2 py-1 bg-blue-600 text-white rounded text-xs font-medium">
                          v{version.version}
                        </span>
                        {index === 0 && (
                          <span className="px-2 py-1 bg-green-600 text-white rounded text-xs">
                            Current
                          </span>
                        )}
                        <span className="text-gray-400 text-sm">
                          {version.createdAt.toLocaleDateString()}
                        </span>
                        <span className="text-gray-400 text-sm">by {version.author}</span>
                      </div>
                      <p className="text-gray-300 text-sm mb-2">{version.changes}</p>
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span>Status: {version.data.status}</span>
                        <span>Title: {version.data.title}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button className="px-3 py-1 text-blue-400 hover:text-blue-300 text-sm">
                        Compare
                      </button>
                      <button className="px-3 py-1 text-orange-400 hover:text-orange-300 text-sm">
                        Restore
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};