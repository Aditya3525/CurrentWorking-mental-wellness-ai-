import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  Check, 
  X, 
  AlertCircle, 
  Calendar, 
  User, 
  Eye, 
  Edit, 
  Send, 
  RotateCcw,
  GitBranch,
  FileText,
  Users,
  CheckCircle,
  XCircle,
  PlayCircle,
  Pause,
  Archive,
  Star,
  MessageSquare,
  History,
  ChevronRight,
  ChevronDown,
  Filter,
  Search,
  MoreHorizontal,
  Download,
  Share,
  Bell
} from 'lucide-react';

// Types
interface WorkflowContent {
  id: string;
  title: string;
  type: 'video' | 'audio' | 'article' | 'pdf' | 'playlist';
  author: string;
  status: 'draft' | 'pending_review' | 'approved' | 'published' | 'rejected' | 'scheduled' | 'archived';
  currentStep: number;
  totalSteps: number;
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
  scheduledFor?: Date;
  version: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedTo?: string;
  reviewers: WorkflowReviewer[];
  comments: WorkflowComment[];
  checklist: WorkflowChecklistItem[];
  metadata: {
    views?: number;
    likes?: number;
    completionRate?: number;
    lastModified: Date;
    wordCount?: number;
    duration?: string;
  };
}

interface WorkflowReviewer {
  id: string;
  name: string;
  role: 'editor' | 'admin' | 'subject_expert' | 'legal' | 'technical';
  status: 'pending' | 'approved' | 'rejected' | 'changes_requested';
  reviewedAt?: Date;
  comments?: string;
  isRequired: boolean;
}

interface WorkflowComment {
  id: string;
  author: string;
  content: string;
  timestamp: Date;
  type: 'general' | 'suggestion' | 'issue' | 'approval';
  resolved?: boolean;
}

interface WorkflowChecklistItem {
  id: string;
  label: string;
  completed: boolean;
  required: boolean;
  assignee?: string;
  dueDate?: Date;
}

interface WorkflowStats {
  total: number;
  draft: number;
  pending_review: number;
  approved: number;
  published: number;
  rejected: number;
  scheduled: number;
  archived: number;
}

interface PublishingWorkflowProps {
  onNavigate?: (page: string) => void;
}

const mockContent: WorkflowContent[] = [
  {
    id: '1',
    title: 'Advanced Mindfulness Meditation for Anxiety Relief',
    type: 'audio',
    author: 'Dr. Sarah Johnson',
    status: 'pending_review',
    currentStep: 2,
    totalSteps: 4,
    createdAt: new Date('2024-02-15'),
    updatedAt: new Date('2024-02-20'),
    version: '1.2.0',
    category: 'Meditation',
    priority: 'high',
    assignedTo: 'Editor Team',
    reviewers: [
      { id: '1', name: 'John Smith', role: 'editor', status: 'approved', reviewedAt: new Date('2024-02-18'), isRequired: true },
      { id: '2', name: 'Dr. Emily Chen', role: 'subject_expert', status: 'pending', isRequired: true },
      { id: '3', name: 'Legal Team', role: 'legal', status: 'pending', isRequired: false }
    ],
    comments: [
      { id: '1', author: 'John Smith', content: 'Great content structure. Minor audio quality improvements needed.', timestamp: new Date('2024-02-18'), type: 'suggestion' },
      { id: '2', author: 'Dr. Sarah Johnson', content: 'Updated audio quality as requested.', timestamp: new Date('2024-02-19'), type: 'general' }
    ],
    checklist: [
      { id: '1', label: 'Content accuracy review', completed: true, required: true, assignee: 'Dr. Emily Chen' },
      { id: '2', label: 'Audio quality check', completed: true, required: true, assignee: 'Technical Team' },
      { id: '3', label: 'SEO optimization', completed: false, required: false, assignee: 'Marketing Team' },
      { id: '4', label: 'Legal compliance check', completed: false, required: true, assignee: 'Legal Team' }
    ],
    metadata: {
      lastModified: new Date('2024-02-20'),
      duration: '20:15',
      views: 0,
      likes: 0
    }
  },
  {
    id: '2',
    title: 'Understanding Cognitive Behavioral Therapy Basics',
    type: 'article',
    author: 'Dr. Michael Brown',
    status: 'scheduled',
    currentStep: 4,
    totalSteps: 4,
    createdAt: new Date('2024-02-10'),
    updatedAt: new Date('2024-02-22'),
    scheduledFor: new Date('2024-02-25'),
    version: '2.0.0',
    category: 'Therapy',
    priority: 'medium',
    assignedTo: 'Content Manager',
    reviewers: [
      { id: '1', name: 'John Smith', role: 'editor', status: 'approved', reviewedAt: new Date('2024-02-20'), isRequired: true },
      { id: '2', name: 'Dr. Lisa Wang', role: 'subject_expert', status: 'approved', reviewedAt: new Date('2024-02-21'), isRequired: true }
    ],
    comments: [
      { id: '1', author: 'Dr. Lisa Wang', content: 'Excellent technical accuracy. Ready for publication.', timestamp: new Date('2024-02-21'), type: 'approval' }
    ],
    checklist: [
      { id: '1', label: 'Content accuracy review', completed: true, required: true },
      { id: '2', label: 'Grammar and style check', completed: true, required: true },
      { id: '3', label: 'SEO optimization', completed: true, required: false },
      { id: '4', label: 'Final approval', completed: true, required: true }
    ],
    metadata: {
      lastModified: new Date('2024-02-22'),
      wordCount: 2500,
      views: 0,
      likes: 0
    }
  },
  {
    id: '3',
    title: 'Sleep Stories for Better Rest',
    type: 'playlist',
    author: 'Content Team',
    status: 'draft',
    currentStep: 1,
    totalSteps: 4,
    createdAt: new Date('2024-02-22'),
    updatedAt: new Date('2024-02-22'),
    version: '1.0.0',
    category: 'Sleep',
    priority: 'low',
    assignedTo: 'Sarah Miller',
    reviewers: [],
    comments: [],
    checklist: [
      { id: '1', label: 'Playlist curation', completed: false, required: true, assignee: 'Content Team' },
      { id: '2', label: 'Audio quality check', completed: false, required: true },
      { id: '3', label: 'Content review', completed: false, required: true }
    ],
    metadata: {
      lastModified: new Date('2024-02-22'),
      views: 0,
      likes: 0
    }
  }
];

const workflowSteps = [
  { id: 1, label: 'Draft', description: 'Content creation and initial draft' },
  { id: 2, label: 'Review', description: 'Editorial and expert review' },
  { id: 3, label: 'Approval', description: 'Final approval and compliance check' },
  { id: 4, label: 'Publish', description: 'Live publication or scheduling' }
];

const statusColors = {
  draft: 'bg-gray-600 text-gray-200',
  pending_review: 'bg-yellow-600 text-yellow-200',
  approved: 'bg-green-600 text-green-200',
  published: 'bg-blue-600 text-blue-200',
  rejected: 'bg-red-600 text-red-200',
  scheduled: 'bg-purple-600 text-purple-200',
  archived: 'bg-gray-500 text-gray-300'
};

const priorityColors = {
  low: 'text-gray-400',
  medium: 'text-blue-400',
  high: 'text-orange-400',
  urgent: 'text-red-400'
};

export const PublishingWorkflow: React.FC<PublishingWorkflowProps> = ({ onNavigate }) => {
  const [content, setContent] = useState<WorkflowContent[]>(mockContent);
  const [selectedContent, setSelectedContent] = useState<WorkflowContent | null>(null);
  const [viewMode, setViewMode] = useState<'kanban' | 'list' | 'calendar'>('kanban');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  // Calculate stats
  const stats: WorkflowStats = content.reduce((acc, item) => {
    acc.total++;
    acc[item.status]++;
    return acc;
  }, {
    total: 0,
    draft: 0,
    pending_review: 0,
    approved: 0,
    published: 0,
    rejected: 0,
    scheduled: 0,
    archived: 0
  });

  // Filter content
  const filteredContent = content.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || item.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || item.priority === filterPriority;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const handleStatusChange = (contentId: string, newStatus: WorkflowContent['status']) => {
    setContent(prev => prev.map(item => 
      item.id === contentId 
        ? { ...item, status: newStatus, updatedAt: new Date() }
        : item
    ));
  };

  const handleApproval = (contentId: string, reviewerId: string, status: 'approved' | 'rejected', comments?: string) => {
    setContent(prev => prev.map(item => {
      if (item.id === contentId) {
        const updatedReviewers = item.reviewers.map(reviewer => 
          reviewer.id === reviewerId 
            ? { ...reviewer, status, reviewedAt: new Date(), comments }
            : reviewer
        );
        
        // Check if all required reviewers have approved
        const allRequiredApproved = updatedReviewers
          .filter(r => r.isRequired)
          .every(r => r.status === 'approved');
        
        const newStatus = allRequiredApproved ? 'approved' : 'pending_review';
        
        return {
          ...item,
          reviewers: updatedReviewers,
          status: newStatus,
          updatedAt: new Date()
        };
      }
      return item;
    }));
  };

  const handlePublish = (contentId: string, publishAt?: Date) => {
    setContent(prev => prev.map(item => 
      item.id === contentId 
        ? { 
            ...item, 
            status: publishAt ? 'scheduled' : 'published',
            publishedAt: publishAt ? undefined : new Date(),
            scheduledFor: publishAt,
            updatedAt: new Date()
          }
        : item
    ));
  };

  const handleChecklistUpdate = (contentId: string, checklistItemId: string, completed: boolean) => {
    setContent(prev => prev.map(item => 
      item.id === contentId 
        ? {
            ...item,
            checklist: item.checklist.map(checkItem => 
              checkItem.id === checklistItemId 
                ? { ...checkItem, completed }
                : checkItem
            ),
            updatedAt: new Date()
          }
        : item
    ));
  };

  const getStatusIcon = (status: WorkflowContent['status']) => {
    switch (status) {
      case 'draft': return <Edit className="w-4 h-4" />;
      case 'pending_review': return <Clock className="w-4 h-4" />;
      case 'approved': return <CheckCircle className="w-4 h-4" />;
      case 'published': return <PlayCircle className="w-4 h-4" />;
      case 'rejected': return <XCircle className="w-4 h-4" />;
      case 'scheduled': return <Calendar className="w-4 h-4" />;
      case 'archived': return <Archive className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const renderKanbanView = () => {
    const columns = [
      { id: 'draft', title: 'Draft', items: filteredContent.filter(item => item.status === 'draft') },
      { id: 'pending_review', title: 'Under Review', items: filteredContent.filter(item => item.status === 'pending_review') },
      { id: 'approved', title: 'Approved', items: filteredContent.filter(item => item.status === 'approved') },
      { id: 'scheduled', title: 'Scheduled', items: filteredContent.filter(item => item.status === 'scheduled') },
      { id: 'published', title: 'Published', items: filteredContent.filter(item => item.status === 'published') }
    ];

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {columns.map(column => (
          <div key={column.id} className="bg-gray-800 rounded-lg overflow-hidden">
            <div className="bg-gray-750 px-4 py-3 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-white">{column.title}</h3>
                <span className="bg-gray-600 text-gray-200 px-2 py-1 rounded-full text-xs">
                  {column.items.length}
                </span>
              </div>
            </div>
            
            <div className="p-3 space-y-3 max-h-96 overflow-y-auto">
              {column.items.map(item => (
                <div
                  key={item.id}
                  className="bg-gray-700 rounded-lg p-3 hover:bg-gray-650 transition-colors cursor-pointer"
                  onClick={() => setSelectedContent(item)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="text-sm font-medium text-white line-clamp-2">{item.title}</h4>
                    <span className={`text-xs ${priorityColors[item.priority]}`}>
                      <Star className="w-3 h-3" />
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2 text-xs text-gray-400 mb-3">
                    <span className="capitalize">{item.type}</span>
                    <span>•</span>
                    <span>{item.category}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1">
                      <User className="w-3 h-3 text-gray-500" />
                      <span className="text-xs text-gray-400">{item.author}</span>
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      <div className="w-full bg-gray-600 rounded-full h-1">
                        <div
                          className="bg-blue-500 h-1 rounded-full"
                          style={{ width: `${(item.currentStep / item.totalSteps) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-400 ml-1">
                        {item.currentStep}/{item.totalSteps}
                      </span>
                    </div>
                  </div>
                  
                  {item.scheduledFor && (
                    <div className="mt-2 flex items-center space-x-1 text-xs text-purple-400">
                      <Calendar className="w-3 h-3" />
                      <span>{item.scheduledFor.toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              ))}
              
              {column.items.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p className="text-sm">No items</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderListView = () => (
    <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-750">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Content
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Progress
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Reviewers
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Updated
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {filteredContent.map(item => (
              <tr key={item.id} className="hover:bg-gray-750">
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded ${priorityColors[item.priority]} bg-gray-700`}>
                      {getStatusIcon(item.status)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{item.title}</p>
                      <p className="text-xs text-gray-400">{item.author} • {item.category}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[item.status]}`}>
                    {item.status.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-16 bg-gray-600 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${(item.currentStep / item.totalSteps) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-400">
                      {item.currentStep}/{item.totalSteps}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-1">
                    {item.reviewers.slice(0, 3).map(reviewer => (
                      <div
                        key={reviewer.id}
                        className={`w-6 h-6 rounded-full text-xs flex items-center justify-center ${
                          reviewer.status === 'approved' ? 'bg-green-600 text-white' :
                          reviewer.status === 'rejected' ? 'bg-red-600 text-white' :
                          'bg-gray-600 text-gray-300'
                        }`}
                        title={`${reviewer.name} - ${reviewer.status}`}
                      >
                        {reviewer.name.charAt(0)}
                      </div>
                    ))}
                    {item.reviewers.length > 3 && (
                      <span className="text-xs text-gray-400">+{item.reviewers.length - 3}</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-400">
                  {item.updatedAt.toLocaleDateString()}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setSelectedContent(item)}
                      className="p-1 text-gray-400 hover:text-white hover:bg-gray-600 rounded"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onNavigate?.('content-editor')}
                      className="p-1 text-gray-400 hover:text-white hover:bg-gray-600 rounded"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button className="p-1 text-gray-400 hover:text-white hover:bg-gray-600 rounded">
                      <MoreHorizontal className="w-4 h-4" />
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
          <h1 className="text-2xl font-bold text-white">Publishing Workflow</h1>
          <p className="text-gray-400">Manage content review, approval, and publishing process</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setViewMode('kanban')}
            className={`px-3 py-2 rounded text-sm ${
              viewMode === 'kanban' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Kanban
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-2 rounded text-sm ${
              viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            List
          </button>
          <button
            onClick={() => setViewMode('calendar')}
            className={`px-3 py-2 rounded text-sm ${
              viewMode === 'calendar' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Calendar
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
        {Object.entries(stats).map(([key, value]) => {
          if (key === 'total') return null;
          return (
            <div key={key} className="bg-gray-800 border border-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-white">{value}</p>
                  <p className="text-xs text-gray-400 capitalize">{key.replace('_', ' ')}</p>
                </div>
                <div className={`p-2 rounded ${statusColors[key as keyof typeof statusColors] || 'bg-gray-600'}`}>
                  {getStatusIcon(key as WorkflowContent['status'])}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search content..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          
          <div className="flex items-center space-x-2">
            <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded">
              <Download className="w-4 h-4" />
            </button>
            <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded">
              <Share className="w-4 h-4" />
            </button>
            <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded">
              <Bell className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="statusFilter" className="block text-sm font-medium text-gray-300 mb-2">
                  Status
                </label>
                <select
                  id="statusFilter"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Statuses</option>
                  <option value="draft">Draft</option>
                  <option value="pending_review">Pending Review</option>
                  <option value="approved">Approved</option>
                  <option value="published">Published</option>
                  <option value="rejected">Rejected</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="priorityFilter" className="block text-sm font-medium text-gray-300 mb-2">
                  Priority
                </label>
                <select
                  id="priorityFilter"
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Priorities</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Quick Filters
                </label>
                <div className="flex flex-wrap gap-2">
                  <button className="px-3 py-1 bg-gray-700 text-gray-300 rounded text-sm hover:bg-gray-600">
                    My Content
                  </button>
                  <button className="px-3 py-1 bg-gray-700 text-gray-300 rounded text-sm hover:bg-gray-600">
                    Needs Review
                  </button>
                  <button className="px-3 py-1 bg-gray-700 text-gray-300 rounded text-sm hover:bg-gray-600">
                    Overdue
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Content View */}
      {viewMode === 'kanban' && renderKanbanView()}
      {viewMode === 'list' && renderListView()}
      {viewMode === 'calendar' && (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-8 text-center">
          <Calendar className="w-16 h-16 text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">Calendar View</h3>
          <p className="text-gray-400">Calendar view for scheduled content would be implemented here</p>
        </div>
      )}

      {/* Content Detail Modal */}
      {selectedContent && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg max-w-4xl max-h-[90vh] overflow-hidden w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-700">
              <div>
                <h2 className="text-lg font-semibold text-white">{selectedContent.title}</h2>
                <p className="text-gray-400">{selectedContent.author} • {selectedContent.category}</p>
              </div>
              <button
                onClick={() => setSelectedContent(null)}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Status and Progress */}
                  <div className="bg-gray-750 rounded-lg p-4">
                    <h3 className="text-white font-medium mb-4">Workflow Progress</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusColors[selectedContent.status]}`}>
                          {getStatusIcon(selectedContent.status)}
                          <span className="ml-2 capitalize">{selectedContent.status.replace('_', ' ')}</span>
                        </span>
                        <span className="text-sm text-gray-400">
                          Step {selectedContent.currentStep} of {selectedContent.totalSteps}
                        </span>
                      </div>
                      
                      <div className="space-y-2">
                        {workflowSteps.map(step => (
                          <div key={step.id} className="flex items-center space-x-3">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                              step.id <= selectedContent.currentStep 
                                ? 'bg-blue-600 text-white' 
                                : 'bg-gray-600 text-gray-400'
                            }`}>
                              {step.id <= selectedContent.currentStep ? <Check className="w-3 h-3" /> : step.id}
                            </div>
                            <div>
                              <p className="text-sm text-white font-medium">{step.label}</p>
                              <p className="text-xs text-gray-400">{step.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  {/* Checklist */}
                  <div className="bg-gray-750 rounded-lg p-4">
                    <h3 className="text-white font-medium mb-4">Checklist</h3>
                    <div className="space-y-3">
                      {selectedContent.checklist.map(item => (
                        <div key={item.id} className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            checked={item.completed}
                            onChange={(e) => handleChecklistUpdate(selectedContent.id, item.id, e.target.checked)}
                            className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                          />
                          <div className="flex-1">
                            <p className={`text-sm ${item.completed ? 'text-gray-400 line-through' : 'text-white'}`}>
                              {item.label}
                              {item.required && <span className="text-red-400 ml-1">*</span>}
                            </p>
                            {item.assignee && (
                              <p className="text-xs text-gray-500">Assigned to: {item.assignee}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Comments */}
                  <div className="bg-gray-750 rounded-lg p-4">
                    <h3 className="text-white font-medium mb-4">Comments & Feedback</h3>
                    <div className="space-y-4">
                      {selectedContent.comments.map(comment => (
                        <div key={comment.id} className="flex space-x-3">
                          <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center text-xs text-white">
                              {comment.author.charAt(0)}
                            </div>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <p className="text-sm font-medium text-white">{comment.author}</p>
                              <span className={`px-2 py-0.5 rounded text-xs ${
                                comment.type === 'approval' ? 'bg-green-600 text-green-200' :
                                comment.type === 'issue' ? 'bg-red-600 text-red-200' :
                                'bg-gray-600 text-gray-200'
                              }`}>
                                {comment.type}
                              </span>
                              <span className="text-xs text-gray-400">
                                {comment.timestamp.toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-sm text-gray-300">{comment.content}</p>
                          </div>
                        </div>
                      ))}
                      
                      <div className="border-t border-gray-600 pt-4">
                        <div className="flex space-x-3">
                          <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-xs text-white">
                              A
                            </div>
                          </div>
                          <div className="flex-1">
                            <textarea
                              placeholder="Add a comment..."
                              rows={3}
                              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                            />
                            <div className="flex items-center justify-between mt-2">
                              <div className="flex items-center space-x-2 text-xs">
                                <button className="px-2 py-1 bg-gray-600 text-gray-300 rounded hover:bg-gray-500">
                                  General
                                </button>
                                <button className="px-2 py-1 bg-gray-600 text-gray-300 rounded hover:bg-gray-500">
                                  Suggestion
                                </button>
                                <button className="px-2 py-1 bg-gray-600 text-gray-300 rounded hover:bg-gray-500">
                                  Issue
                                </button>
                              </div>
                              <button className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">
                                Comment
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Sidebar */}
                <div className="space-y-6">
                  {/* Actions */}
                  <div className="bg-gray-750 rounded-lg p-4">
                    <h3 className="text-white font-medium mb-4">Actions</h3>
                    <div className="space-y-2">
                      <button
                        onClick={() => onNavigate?.('content-editor')}
                        className="w-full px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center space-x-2"
                      >
                        <Edit className="w-4 h-4" />
                        <span>Edit Content</span>
                      </button>
                      
                      {selectedContent.status === 'approved' && (
                        <button
                          onClick={() => handlePublish(selectedContent.id)}
                          className="w-full px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors flex items-center space-x-2"
                        >
                          <PlayCircle className="w-4 h-4" />
                          <span>Publish Now</span>
                        </button>
                      )}
                      
                      <button className="w-full px-3 py-2 bg-gray-600 text-gray-300 rounded hover:bg-gray-500 transition-colors flex items-center space-x-2">
                        <Calendar className="w-4 h-4" />
                        <span>Schedule</span>
                      </button>
                      
                      <button className="w-full px-3 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors flex items-center space-x-2">
                        <Archive className="w-4 h-4" />
                        <span>Archive</span>
                      </button>
                    </div>
                  </div>
                  
                  {/* Reviewers */}
                  <div className="bg-gray-750 rounded-lg p-4">
                    <h3 className="text-white font-medium mb-4">Reviewers</h3>
                    <div className="space-y-3">
                      {selectedContent.reviewers.map(reviewer => (
                        <div key={reviewer.id} className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs ${
                              reviewer.status === 'approved' ? 'bg-green-600 text-white' :
                              reviewer.status === 'rejected' ? 'bg-red-600 text-white' :
                              'bg-gray-600 text-gray-300'
                            }`}>
                              {reviewer.name.charAt(0)}
                            </div>
                            <div>
                              <p className="text-sm text-white">{reviewer.name}</p>
                              <p className="text-xs text-gray-400 capitalize">{reviewer.role}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-1">
                            {reviewer.isRequired && (
                              <span className="text-red-400 text-xs">*</span>
                            )}
                            <span className={`px-2 py-0.5 rounded text-xs capitalize ${
                              reviewer.status === 'approved' ? 'bg-green-600 text-green-200' :
                              reviewer.status === 'rejected' ? 'bg-red-600 text-red-200' :
                              'bg-yellow-600 text-yellow-200'
                            }`}>
                              {reviewer.status.replace('_', ' ')}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Metadata */}
                  <div className="bg-gray-750 rounded-lg p-4">
                    <h3 className="text-white font-medium mb-4">Details</h3>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Version:</span>
                        <span className="text-white">{selectedContent.version}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Created:</span>
                        <span className="text-white">{selectedContent.createdAt.toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Updated:</span>
                        <span className="text-white">{selectedContent.updatedAt.toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Priority:</span>
                        <span className={`capitalize ${priorityColors[selectedContent.priority]}`}>
                          {selectedContent.priority}
                        </span>
                      </div>
                      {selectedContent.metadata.duration && (
                        <div className="flex justify-between">
                          <span className="text-gray-400">Duration:</span>
                          <span className="text-white">{selectedContent.metadata.duration}</span>
                        </div>
                      )}
                      {selectedContent.metadata.wordCount && (
                        <div className="flex justify-between">
                          <span className="text-gray-400">Words:</span>
                          <span className="text-white">{selectedContent.metadata.wordCount.toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};