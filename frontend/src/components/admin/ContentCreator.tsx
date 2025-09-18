import { 
  Save, 
  Eye, 
  Upload, 
  Link, 
  Type, 
  File, 
  Video, 
  Headphones, 
  FileText, 
  PlayCircle,
  X,
  Plus,
  AlertCircle,
  Check,
  Clock,
  ChevronDown,
  ChevronUp,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Quote,
  Code,
  Image,
  ArrowLeft
} from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';

// Types
type ContentType = 'video' | 'audio' | 'article' | 'pdf' | 'playlist';

interface ContentFormData {
  title: string;
  description: string;
  type: ContentType;
  category: string;
  subcategory: string;
  approach: 'western' | 'eastern' | 'hybrid';
  severity: 'low' | 'medium' | 'high';
  tags: string[];
  author: string;
  duration?: string;
  
  // Type-specific fields
  url?: string; // For videos and external content
  content?: string; // For articles
  file?: File; // For PDFs and audio files
  playlist?: PlaylistItem[]; // For playlists
  
  // Metadata
  thumbnail?: File;
  scheduledFor?: Date;
  status: 'draft' | 'scheduled' | 'published';
}

interface PlaylistItem {
  id: string;
  title: string;
  type: ContentType;
  duration?: string;
  order: number;
}

interface ValidationError {
  field: string;
  message: string;
}

interface ContentCreatorProps {
  onNavigate: (page: string) => void;
  initialData?: Partial<ContentFormData>;
  isEditing?: boolean;
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

export const ContentCreator: React.FC<ContentCreatorProps> = ({ 
  onNavigate, 
  initialData, 
  isEditing = false 
}) => {
  const [formData, setFormData] = useState<ContentFormData>({
    title: '',
    description: '',
    type: 'article',
    category: '',
    subcategory: '',
    approach: 'hybrid',
    severity: 'medium',
    tags: [],
    author: '',
    status: 'draft',
    ...initialData
  });
  
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [currentTag, setCurrentTag] = useState('');
  const [urlMetadata, setUrlMetadata] = useState<any>(null);
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(false);
  
  // Auto-save functionality
  const autoSaveTimer = useRef<NodeJS.Timeout>();
  const isFirstRender = useRef(true);

  // Rich text editor state for articles
  const [editorContent, setEditorContent] = useState(formData.content || '');
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    // Auto-save after 2 seconds of inactivity
    if (autoSaveTimer.current) {
      clearTimeout(autoSaveTimer.current);
    }
    
    autoSaveTimer.current = setTimeout(() => {
      handleAutoSave();
    }, 2000);

    return () => {
      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current);
      }
    };
  }, [formData]);

  const handleAutoSave = async () => {
    if (formData.title.trim()) {
      setIsSaving(true);
      try {
        // Simulate auto-save API call
        await new Promise(resolve => setTimeout(resolve, 500));
        setLastSaved(new Date());
      } catch (error) {
        console.error('Auto-save failed:', error);
      } finally {
        setIsSaving(false);
      }
    }
  };

  const validateForm = (): ValidationError[] => {
    const newErrors: ValidationError[] = [];

    if (!formData.title.trim()) {
      newErrors.push({ field: 'title', message: 'Title is required' });
    }

    if (!formData.description.trim()) {
      newErrors.push({ field: 'description', message: 'Description is required' });
    }

    if (!formData.category) {
      newErrors.push({ field: 'category', message: 'Category is required' });
    }

    if (!formData.author.trim()) {
      newErrors.push({ field: 'author', message: 'Author is required' });
    }

    // Type-specific validation
    switch (formData.type) {
      case 'video':
        if (!formData.url?.trim()) {
          newErrors.push({ field: 'url', message: 'Video URL is required' });
        } else if (!isValidUrl(formData.url)) {
          newErrors.push({ field: 'url', message: 'Please enter a valid URL' });
        }
        break;
      
      case 'article':
        if (!editorContent.trim()) {
          newErrors.push({ field: 'content', message: 'Article content is required' });
        }
        break;
      
      case 'audio':
        if (!formData.file && !formData.url) {
          newErrors.push({ field: 'file', message: 'Audio file or URL is required' });
        }
        break;
      
      case 'pdf':
        if (!formData.file) {
          newErrors.push({ field: 'file', message: 'PDF file is required' });
        }
        break;
      
      case 'playlist':
        if (!formData.playlist || formData.playlist.length === 0) {
          newErrors.push({ field: 'playlist', message: 'Playlist must contain at least one item' });
        }
        break;
    }

    return newErrors;
  };

  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const extractYouTubeMetadata = async (url: string) => {
    if (!url.includes('youtube.com') && !url.includes('youtu.be')) return;
    
    setIsLoadingMetadata(true);
    try {
      // Simulate YouTube metadata extraction
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockMetadata = {
        title: 'Guided Meditation for Beginners',
        description: 'A peaceful 10-minute guided meditation perfect for those starting their mindfulness journey.',
        duration: '10:23',
        thumbnail: '/api/placeholder/480/360'
      };
      
      setUrlMetadata(mockMetadata);
      setFormData(prev => ({
        ...prev,
        title: prev.title || mockMetadata.title,
        description: prev.description || mockMetadata.description,
        duration: mockMetadata.duration
      }));
    } catch (error) {
      console.error('Failed to extract metadata:', error);
    } finally {
      setIsLoadingMetadata(false);
    }
  };

  const handleSubmit = async (status: 'draft' | 'published' | 'scheduled') => {
    const validationErrors = validateForm();
    setErrors(validationErrors);

    if (validationErrors.length > 0) {
      return;
    }

    setIsLoading(true);
    try {
      const submissionData = {
        ...formData,
        content: formData.type === 'article' ? editorContent : formData.content,
        status
      };

      // Simulate API submission
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      console.log('Content saved:', submissionData);
      
      // Navigate back to content list
      onNavigate('content-list');
    } catch (error) {
      console.error('Failed to save content:', error);
      setErrors([{ field: 'general', message: 'Failed to save content. Please try again.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTagAdd = () => {
    if (currentTag.trim() && !formData.tags.includes(currentTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, currentTag.trim()]
      }));
      setCurrentTag('');
    }
  };

  const handleTagRemove = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleFileUpload = (file: File) => {
    setFormData(prev => ({ ...prev, file }));
  };

  const getFieldError = (field: string) => {
    return errors.find(error => error.field === field)?.message;
  };

  const renderTypeSpecificFields = () => {
    switch (formData.type) {
      case 'video':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Video URL *
              </label>
              <div className="flex space-x-2">
                <input
                  type="url"
                  value={formData.url || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                  onBlur={() => formData.url && extractYouTubeMetadata(formData.url)}
                  placeholder="https://youtube.com/watch?v=..."
                  className={`flex-1 bg-gray-700 border rounded-lg px-3 py-2 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    getFieldError('url') ? 'border-red-500' : 'border-gray-600'
                  }`}
                />
                {isLoadingMetadata && (
                  <div className="flex items-center justify-center w-10 h-10 bg-gray-700 rounded-lg">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                  </div>
                )}
              </div>
              {getFieldError('url') && (
                <p className="mt-1 text-sm text-red-400">{getFieldError('url')}</p>
              )}
              {urlMetadata && (
                <div className="mt-3 p-3 bg-gray-750 rounded-lg">
                  <p className="text-sm text-green-400 mb-2">✓ Metadata extracted successfully</p>
                  <div className="flex space-x-3">
                    {urlMetadata.thumbnail && (
                      <img 
                        src={urlMetadata.thumbnail} 
                        alt="Video thumbnail" 
                        className="w-16 h-12 object-cover rounded"
                      />
                    )}
                    <div>
                      <p className="text-sm font-medium text-white">{urlMetadata.title}</p>
                      <p className="text-xs text-gray-400">{urlMetadata.duration}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 'article':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Article Content *
              </label>
              {/* Rich Text Editor Toolbar */}
              <div className="bg-gray-700 border border-gray-600 rounded-t-lg p-2 flex items-center space-x-2">
                <button
                  type="button"
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-600 rounded"
                  title="Bold"
                >
                  <Bold className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-600 rounded"
                  title="Italic"
                >
                  <Italic className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-600 rounded"
                  title="Underline"
                >
                  <Underline className="w-4 h-4" />
                </button>
                <div className="w-px h-6 bg-gray-600"></div>
                <button
                  type="button"
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-600 rounded"
                  title="Bullet List"
                >
                  <List className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-600 rounded"
                  title="Numbered List"
                >
                  <ListOrdered className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-600 rounded"
                  title="Quote"
                >
                  <Quote className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-600 rounded"
                  title="Code"
                >
                  <Code className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-600 rounded"
                  title="Insert Image"
                >
                  <Image className="w-4 h-4" />
                </button>
              </div>
              <textarea
                ref={editorRef}
                value={editorContent}
                onChange={(e) => setEditorContent(e.target.value)}
                rows={12}
                placeholder="Write your article content here..."
                className={`w-full bg-gray-700 border border-t-0 border-gray-600 rounded-b-lg px-3 py-2 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none ${
                  getFieldError('content') ? 'border-red-500' : ''
                }`}
              />
              {getFieldError('content') && (
                <p className="mt-1 text-sm text-red-400">{getFieldError('content')}</p>
              )}
            </div>
          </div>
        );

      case 'audio':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Audio Source *
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* File Upload */}
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Upload File</label>
                  <div className="border-2 border-dashed border-gray-600 rounded-lg p-4 text-center hover:border-gray-500 transition-colors">
                    <Headphones className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                    <input
                      type="file"
                      accept="audio/*"
                      onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                      className="hidden"
                      id="audio-upload"
                    />
                    <label htmlFor="audio-upload" className="cursor-pointer">
                      <span className="text-blue-400 hover:text-blue-300">Choose audio file</span>
                      <p className="text-xs text-gray-500 mt-1">MP3, WAV, M4A up to 100MB</p>
                    </label>
                  </div>
                  {formData.file && (
                    <p className="mt-2 text-sm text-green-400">✓ {formData.file.name}</p>
                  )}
                </div>
                
                {/* URL Input */}
                <div>
                  <label className="block text-sm text-gray-400 mb-2">External URL</label>
                  <input
                    type="url"
                    value={formData.url || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                    placeholder="https://example.com/audio.mp3"
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              {getFieldError('file') && (
                <p className="mt-1 text-sm text-red-400">{getFieldError('file')}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Duration
              </label>
              <input
                type="text"
                value={formData.duration || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
                placeholder="e.g., 15:30"
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        );

      case 'pdf':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                PDF Document *
              </label>
              <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center hover:border-gray-500 transition-colors">
                <File className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                  className="hidden"
                  id="pdf-upload"
                />
                <label htmlFor="pdf-upload" className="cursor-pointer">
                  <span className="text-blue-400 hover:text-blue-300 text-lg">Choose PDF file</span>
                  <p className="text-sm text-gray-500 mt-2">PDF files up to 50MB</p>
                </label>
                {formData.file && (
                  <div className="mt-4 p-3 bg-gray-750 rounded-lg">
                    <p className="text-sm text-green-400">✓ {formData.file.name}</p>
                    <p className="text-xs text-gray-500">{(formData.file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                )}
              </div>
              {getFieldError('file') && (
                <p className="mt-1 text-sm text-red-400">{getFieldError('file')}</p>
              )}
            </div>
          </div>
        );

      case 'playlist':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Playlist Items *
              </label>
              <div className="bg-gray-750 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-gray-300">
                    {formData.playlist?.length || 0} items
                  </span>
                  <button
                    type="button"
                    className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center space-x-1"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Content</span>
                  </button>
                </div>
                
                {formData.playlist && formData.playlist.length > 0 ? (
                  <div className="space-y-2">
                    {formData.playlist.map((item, index) => (
                      <div key={item.id} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <span className="text-gray-500 text-sm">{index + 1}.</span>
                          <div>
                            <p className="text-white font-medium">{item.title}</p>
                            <p className="text-sm text-gray-400 capitalize">{item.type} • {item.duration}</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          className="text-red-400 hover:text-red-300"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <PlayCircle className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-400">No items added yet</p>
                    <p className="text-sm text-gray-500">Click "Add Content" to start building your playlist</p>
                  </div>
                )}
              </div>
              {getFieldError('playlist') && (
                <p className="mt-1 text-sm text-red-400">{getFieldError('playlist')}</p>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
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
            <h1 className="text-2xl font-bold text-white">
              {isEditing ? 'Edit Content' : 'Create Content'}
            </h1>
            <div className="flex items-center space-x-4 mt-1">
              <p className="text-gray-400">
                {isEditing ? 'Update your content' : 'Add new content to your library'}
              </p>
              {lastSaved && (
                <div className="flex items-center space-x-1 text-xs text-gray-500">
                  <Check className="w-3 h-3" />
                  <span>Saved {lastSaved.toLocaleTimeString()}</span>
                </div>
              )}
              {isSaving && (
                <div className="flex items-center space-x-1 text-xs text-blue-400">
                  <Clock className="w-3 h-3 animate-spin" />
                  <span>Saving...</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
        {/* Content Type Selection */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Content Type</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {([
              { type: 'video', icon: Video, label: 'Video' },
              { type: 'audio', icon: Headphones, label: 'Audio' },
              { type: 'article', icon: FileText, label: 'Article' },
              { type: 'pdf', icon: File, label: 'PDF' },
              { type: 'playlist', icon: PlayCircle, label: 'Playlist' }
            ] as const).map(({ type, icon: Icon, label }) => (
              <button
                key={type}
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, type }))}
                className={`p-4 rounded-lg border-2 transition-all ${
                  formData.type === type
                    ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                    : 'border-gray-600 hover:border-gray-500 text-gray-400 hover:text-gray-300'
                }`}
              >
                <Icon className="w-6 h-6 mx-auto mb-2" />
                <span className="text-sm font-medium">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Basic Information */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter content title..."
                className={`w-full bg-gray-700 border rounded-lg px-3 py-2 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  getFieldError('title') ? 'border-red-500' : 'border-gray-600'
                }`}
              />
              {getFieldError('title') && (
                <p className="mt-1 text-sm text-red-400">{getFieldError('title')}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                placeholder="Describe your content..."
                className={`w-full bg-gray-700 border rounded-lg px-3 py-2 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none ${
                  getFieldError('description') ? 'border-red-500' : 'border-gray-600'
                }`}
              />
              {getFieldError('description') && (
                <p className="mt-1 text-sm text-red-400">{getFieldError('description')}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Category *
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  category: e.target.value,
                  subcategory: '' // Reset subcategory when category changes
                }))}
                className={`w-full bg-gray-700 border rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  getFieldError('category') ? 'border-red-500' : 'border-gray-600'
                }`}
              >
                <option value="">Select category</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
              {getFieldError('category') && (
                <p className="mt-1 text-sm text-red-400">{getFieldError('category')}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Subcategory
              </label>
              <select
                value={formData.subcategory}
                onChange={(e) => setFormData(prev => ({ ...prev, subcategory: e.target.value }))}
                disabled={!formData.category}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                <option value="">Select subcategory</option>
                {formData.category && subcategories[formData.category]?.map(subcategory => (
                  <option key={subcategory} value={subcategory}>{subcategory}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Author *
              </label>
              <input
                type="text"
                value={formData.author}
                onChange={(e) => setFormData(prev => ({ ...prev, author: e.target.value }))}
                placeholder="Content author..."
                className={`w-full bg-gray-700 border rounded-lg px-3 py-2 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  getFieldError('author') ? 'border-red-500' : 'border-gray-600'
                }`}
              />
              {getFieldError('author') && (
                <p className="mt-1 text-sm text-red-400">{getFieldError('author')}</p>
              )}
            </div>
          </div>
        </div>

        {/* Type-Specific Fields */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-white mb-4">
            {formData.type.charAt(0).toUpperCase() + formData.type.slice(1)} Content
          </h2>
          {renderTypeSpecificFields()}
        </div>

        {/* Advanced Options */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full flex items-center justify-between p-6 text-left"
          >
            <h2 className="text-lg font-semibold text-white">Advanced Options</h2>
            {showAdvanced ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </button>
          
          {showAdvanced && (
            <div className="px-6 pb-6 space-y-6 border-t border-gray-700">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Approach
                  </label>
                  <select
                    value={formData.approach}
                    onChange={(e) => setFormData(prev => ({ ...prev, approach: e.target.value as any }))}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="western">Western</option>
                    <option value="eastern">Eastern</option>
                    <option value="hybrid">Hybrid</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Severity Level
                  </label>
                  <select
                    value={formData.severity}
                    onChange={(e) => setFormData(prev => ({ ...prev, severity: e.target.value as any }))}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="scheduled">Scheduled</option>
                  </select>
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Tags
                </label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {formData.tags.map((tag) => (
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

              {/* Scheduling */}
              {formData.status === 'scheduled' && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Scheduled For
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.scheduledFor ? formData.scheduledFor.toISOString().slice(0, 16) : ''}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      scheduledFor: e.target.value ? new Date(e.target.value) : undefined 
                    }))}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* General Errors */}
        {getFieldError('general') && (
          <div className="bg-red-900 border border-red-700 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <span className="text-red-200">{getFieldError('general')}</span>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={() => handleSubmit('draft')}
              disabled={isLoading}
              className="px-6 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>Save Draft</span>
            </button>
            
            <button
              type="button"
              disabled={isLoading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              <Eye className="w-4 h-4" />
              <span>Preview</span>
            </button>
          </div>
          
          <div className="flex items-center space-x-3">
            {formData.status === 'scheduled' && (
              <button
                type="button"
                onClick={() => handleSubmit('scheduled')}
                disabled={isLoading}
                className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Clock className="w-4 h-4" />
                )}
                <span>Schedule</span>
              </button>
            )}
            
            <button
              type="button"
              onClick={() => handleSubmit('published')}
              disabled={isLoading}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Upload className="w-4 h-4" />
              )}
              <span>Publish</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};