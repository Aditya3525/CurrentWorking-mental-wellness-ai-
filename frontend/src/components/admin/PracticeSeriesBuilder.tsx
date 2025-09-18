import {
  Save,
  ArrowLeft,
  Plus,
  Trash2,
  GripVertical,
  ChevronDown,
  ChevronUp,
  Target,
  Clock,
  TrendingUp,
  Settings,
  CheckCircle,
  AlertCircle,
  Eye,
  Brain,
  Wind,
  Heart,
  Activity,
  TreePine,
  Zap,
  BookOpen
} from 'lucide-react';
import React, { useState, useEffect } from 'react';

// Types
interface Practice {
  id: string;
  title: string;
  type: 'meditation' | 'breathing' | 'mindfulness' | 'movement';
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  duration: number; // in minutes
  instructor: string;
  category: string;
  description: string;
  prerequisiteIds: string[];
  isAvailable: boolean;
}

interface SeriesStep {
  id: string;
  practiceId: string;
  order: number;
  isRequired: boolean;
  unlockConditions: {
    type: 'immediate' | 'completion' | 'time_delay' | 'achievement';
    value?: number; // days for time_delay, score for achievement
    previousStepId?: string;
  };
  adaptiveSettings: {
    canSkip: boolean;
    canRepeat: boolean;
    recommendationWeight: number; // 0-1
  };
  goals: string[];
  expectedOutcomes: string[];
}

interface ProgressionRule {
  id: string;
  type: 'linear' | 'branching' | 'adaptive' | 'free_choice';
  description: string;
  conditions: {
    minCompletionRate?: number;
    minRating?: number;
    requiredSteps?: string[];
    timeConstraints?: {
      minDaysBetween?: number;
      maxDaysBetween?: number;
    };
  };
}

interface SeriesAnalytics {
  totalParticipants: number;
  averageCompletionRate: number;
  averageRating: number;
  dropoffPoints: {
    stepId: string;
    percentage: number;
  }[];
  popularPaths: string[][];
  timeToComplete: {
    average: number;
    median: number;
    range: [number, number];
  };
}

interface PracticeSeries {
  id?: string;
  title: string;
  description: string;
  shortDescription: string;
  instructor: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  estimatedDuration: number; // total duration in days
  
  // Series structure
  steps: SeriesStep[];
  progressionRules: ProgressionRule[];
  
  // Content
  thumbnailUrl?: string;
  introVideoUrl?: string;
  goals: string[];
  benefits: string[];
  tags: string[];
  
  // Requirements
  prerequisites: string[];
  equipment: string[];
  timeCommitment: string;
  
  // Settings
  isPublic: boolean;
  allowSelfPaced: boolean;
  allowCustomOrder: boolean;
  enableCommunity: boolean;
  certificateEligible: boolean;
  
  // Analytics
  analytics?: SeriesAnalytics;
  
  // Metadata
  status: 'draft' | 'published' | 'archived';
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
}

interface PracticeSeriesBuilderProps {
  onNavigate: (page: string, seriesId?: string) => void;
  seriesId?: string; // For editing existing series
}

// Mock data
const mockPractices: Practice[] = [
  {
    id: '1',
    title: 'Basic Breath Awareness',
    type: 'breathing',
    difficulty: 'beginner',
    duration: 10,
    instructor: 'Dr. Sarah Johnson',
    category: 'Breathing',
    description: 'Introduction to conscious breathing',
    prerequisiteIds: [],
    isAvailable: true
  },
  {
    id: '2',
    title: 'Body Scan Meditation',
    type: 'meditation',
    difficulty: 'beginner',
    duration: 15,
    instructor: 'Dr. Sarah Johnson',
    category: 'Mindfulness',
    description: 'Progressive body awareness practice',
    prerequisiteIds: ['1'],
    isAvailable: true
  },
  {
    id: '3',
    title: '4-7-8 Breathing Pattern',
    type: 'breathing',
    difficulty: 'intermediate',
    duration: 12,
    instructor: 'Dr. Michael Chen',
    category: 'Breathing',
    description: 'Advanced breathing for relaxation',
    prerequisiteIds: ['1'],
    isAvailable: true
  },
  {
    id: '4',
    title: 'Mindful Movement Flow',
    type: 'movement',
    difficulty: 'beginner',
    duration: 20,
    instructor: 'Emma Rodriguez',
    category: 'Movement',
    description: 'Gentle yoga-inspired movements',
    prerequisiteIds: [],
    isAvailable: true
  },
  {
    id: '5',
    title: 'Loving Kindness Meditation',
    type: 'meditation',
    difficulty: 'intermediate',
    duration: 18,
    instructor: 'Dr. Sarah Johnson',
    category: 'Mindfulness',
    description: 'Cultivating compassion practice',
    prerequisiteIds: ['2'],
    isAvailable: true
  }
];

const defaultSeries: PracticeSeries = {
  title: '',
  description: '',
  shortDescription: '',
  instructor: '',
  category: 'Mindfulness',
  difficulty: 'beginner',
  estimatedDuration: 7,
  steps: [],
  progressionRules: [],
  goals: [],
  benefits: [],
  tags: [],
  prerequisites: [],
  equipment: [],
  timeCommitment: '15-20 minutes daily',
  isPublic: false,
  allowSelfPaced: true,
  allowCustomOrder: false,
  enableCommunity: false,
  certificateEligible: false,
  status: 'draft',
  createdAt: new Date(),
  updatedAt: new Date()
};

export const PracticeSeriesBuilder: React.FC<PracticeSeriesBuilderProps> = ({ 
  onNavigate, 
  seriesId 
}) => {
  const [series, setSeries] = useState<PracticeSeries>(defaultSeries);
  const [practices] = useState<Practice[]>(mockPractices);
  const [activeTab, setActiveTab] = useState<'structure' | 'progression' | 'content' | 'settings' | 'analytics'>('structure');
  const [showPracticeSelector, setShowPracticeSelector] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error' | null>(null);

  // Load existing series if editing
  useEffect(() => {
    if (seriesId) {
      // Load series data from API
      console.log('Loading series:', seriesId);
    }
  }, [seriesId]);

  // Auto-save
  useEffect(() => {
    const timer = setTimeout(() => {
      if (series.title) {
        handleAutoSave();
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [series]);

  const handleAutoSave = async () => {
    setSaveStatus('saving');
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus(null), 2000);
    } catch (error) {
      setSaveStatus('error');
      console.error('Auto-save failed:', error);
    }
  };

  const updateSeries = (updates: Partial<PracticeSeries>) => {
    setSeries(prev => ({ ...prev, ...updates, updatedAt: new Date() }));
  };

  const addPracticeToSeries = (practice: Practice) => {
    const newStep: SeriesStep = {
      id: `step-${Date.now()}`,
      practiceId: practice.id,
      order: series.steps.length + 1,
      isRequired: true,
      unlockConditions: {
        type: series.steps.length === 0 ? 'immediate' : 'completion',
        previousStepId: series.steps.length > 0 ? series.steps[series.steps.length - 1].id : undefined
      },
      adaptiveSettings: {
        canSkip: false,
        canRepeat: true,
        recommendationWeight: 1.0
      },
      goals: [],
      expectedOutcomes: []
    };

    updateSeries({
      steps: [...series.steps, newStep]
    });
    setShowPracticeSelector(false);
  };

  const removeStep = (stepId: string) => {
    const updatedSteps = series.steps
      .filter(step => step.id !== stepId)
      .map((step, index) => ({ ...step, order: index + 1 }));
    
    updateSeries({ steps: updatedSteps });
  };

  const updateStep = (stepId: string, updates: Partial<SeriesStep>) => {
    updateSeries({
      steps: series.steps.map(step => 
        step.id === stepId ? { ...step, ...updates } : step
      )
    });
  };

  const moveStep = (stepId: string, direction: 'up' | 'down') => {
    const currentIndex = series.steps.findIndex(step => step.id === stepId);
    if (currentIndex === -1) return;
    
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= series.steps.length) return;
    
    const newSteps = [...series.steps];
    [newSteps[currentIndex], newSteps[newIndex]] = [newSteps[newIndex], newSteps[currentIndex]];
    
    // Update order numbers
    const reorderedSteps = newSteps.map((step, index) => ({ ...step, order: index + 1 }));
    
    updateSeries({ steps: reorderedSteps });
  };

  const addProgressionRule = () => {
    const newRule: ProgressionRule = {
      id: `rule-${Date.now()}`,
      type: 'linear',
      description: '',
      conditions: {}
    };
    
    updateSeries({
      progressionRules: [...series.progressionRules, newRule]
    });
  };

  const updateProgressionRule = (ruleId: string, updates: Partial<ProgressionRule>) => {
    updateSeries({
      progressionRules: series.progressionRules.map(rule => 
        rule.id === ruleId ? { ...rule, ...updates } : rule
      )
    });
  };

  const removeProgressionRule = (ruleId: string) => {
    updateSeries({
      progressionRules: series.progressionRules.filter(rule => rule.id !== ruleId)
    });
  };

  const getPracticeById = (practiceId: string): Practice | undefined => {
    return practices.find(p => p.id === practiceId);
  };

  const getPracticeTypeIcon = (type: Practice['type']) => {
    switch (type) {
      case 'meditation': return <Brain className="w-4 h-4" />;
      case 'breathing': return <Wind className="w-4 h-4" />;
      case 'mindfulness': return <Heart className="w-4 h-4" />;
      case 'movement': return <Activity className="w-4 h-4" />;
      default: return <Zap className="w-4 h-4" />;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'text-green-400 bg-green-900';
      case 'intermediate': return 'text-yellow-400 bg-yellow-900';
      case 'advanced': return 'text-orange-400 bg-orange-900';
      case 'expert': return 'text-red-400 bg-red-900';
      default: return 'text-gray-400 bg-gray-900';
    }
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  };

  const calculateTotalDuration = () => {
    return series.steps.reduce((total, step) => {
      const practice = getPracticeById(step.practiceId);
      return total + (practice?.duration || 0);
    }, 0);
  };

  const renderStructureTab = () => (
    <div className="space-y-6">
      {/* Series Overview */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Series Structure</h3>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-400">
              {series.steps.length} practices • {formatDuration(calculateTotalDuration())} total
            </span>
            <button
              onClick={() => setShowPracticeSelector(true)}
              className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Practice</span>
            </button>
          </div>
        </div>

        {series.steps.length === 0 ? (
          <div className="text-center py-12">
            <TreePine className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <h4 className="text-xl font-semibold text-gray-300 mb-2">Build Your Practice Series</h4>
            <p className="text-gray-400 mb-6 max-w-md mx-auto">
              Create a structured learning journey by adding practices in a logical sequence.
            </p>
            <button
              onClick={() => setShowPracticeSelector(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add First Practice
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {series.steps.map((step, index) => {
              const practice = getPracticeById(step.practiceId);
              if (!practice) return null;

              return (
                <div
                  key={step.id}
                  className="bg-gray-700 border border-gray-600 rounded-lg p-4 hover:border-gray-500 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    {/* Drag Handle */}
                    <div className="cursor-move text-gray-400 hover:text-white">
                      <GripVertical className="w-5 h-5" />
                    </div>

                    {/* Step Number */}
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                      {step.order}
                    </div>

                    {/* Practice Info */}
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <div className="flex items-center space-x-2">
                          {getPracticeTypeIcon(practice.type)}
                          <h4 className="font-medium text-white">{practice.title}</h4>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(practice.difficulty)}`}>
                          {practice.difficulty}
                        </span>
                        <div className="flex items-center space-x-1 text-sm text-gray-400">
                          <Clock className="w-4 h-4" />
                          <span>{formatDuration(practice.duration)}</span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-400">{practice.description}</p>
                      
                      {/* Step Settings */}
                      <div className="flex items-center space-x-4 mt-3">
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={step.isRequired}
                            onChange={(e) => updateStep(step.id, { isRequired: e.target.checked })}
                            className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                          />
                          <span className="text-xs text-gray-300">Required</span>
                        </label>
                        
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={step.adaptiveSettings.canSkip}
                            onChange={(e) => updateStep(step.id, { 
                              adaptiveSettings: { ...step.adaptiveSettings, canSkip: e.target.checked }
                            })}
                            className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                          />
                          <span className="text-xs text-gray-300">Can Skip</span>
                        </label>
                        
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={step.adaptiveSettings.canRepeat}
                            onChange={(e) => updateStep(step.id, { 
                              adaptiveSettings: { ...step.adaptiveSettings, canRepeat: e.target.checked }
                            })}
                            className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                          />
                          <span className="text-xs text-gray-300">Can Repeat</span>
                        </label>
                        
                        <select
                          value={step.unlockConditions.type}
                          onChange={(e) => updateStep(step.id, {
                            unlockConditions: { ...step.unlockConditions, type: e.target.value as SeriesStep['unlockConditions']['type'] }
                          })}
                          className="bg-gray-600 border border-gray-500 rounded px-2 py-1 text-gray-100 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="immediate">Immediate Access</option>
                          <option value="completion">After Previous</option>
                          <option value="time_delay">Time Delay</option>
                          <option value="achievement">Achievement Based</option>
                        </select>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => moveStep(step.id, 'up')}
                        disabled={index === 0}
                        className="p-1 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronUp className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => moveStep(step.id, 'down')}
                        disabled={index === series.steps.length - 1}
                        className="p-1 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => removeStep(step.id)}
                        className="p-1 text-gray-400 hover:text-red-400"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Practice Selector Modal */}
      {showPracticeSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">Add Practice to Series</h3>
              <button
                onClick={() => setShowPracticeSelector(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {practices.filter(practice => 
                !series.steps.some(step => step.practiceId === practice.id)
              ).map(practice => (
                <button
                  key={practice.id}
                  className="bg-gray-700 border border-gray-600 rounded-lg p-4 hover:border-blue-500 cursor-pointer transition-colors w-full text-left"
                  onClick={() => addPracticeToSeries(practice)}
                >
                  <div className="flex items-center space-x-3 mb-2">
                    {getPracticeTypeIcon(practice.type)}
                    <h4 className="font-medium text-white">{practice.title}</h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(practice.difficulty)}`}>
                      {practice.difficulty}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 mb-2">{practice.description}</p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{practice.instructor}</span>
                    <span>{formatDuration(practice.duration)}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderProgressionTab = () => (
    <div className="space-y-6">
      {/* Progression Rules */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Progression Rules</h3>
          <button
            onClick={addProgressionRule}
            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Rule</span>
          </button>
        </div>

        {series.progressionRules.length === 0 ? (
          <div className="text-center py-8">
            <Target className="w-12 h-12 text-gray-500 mx-auto mb-4" />
            <p className="text-gray-400 mb-4">No progression rules defined yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {series.progressionRules.map((rule) => (
              <div key={rule.id} className="bg-gray-700 border border-gray-600 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <span className="block text-sm font-medium text-gray-300 mb-2">
                      Rule Type
                    </span>
                    <select
                      value={rule.type}
                      onChange={(e) => updateProgressionRule(rule.id, { type: e.target.value as ProgressionRule['type'] })}
                      className="w-full bg-gray-600 border border-gray-500 rounded px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="linear">Linear Progression</option>
                      <option value="branching">Branching Paths</option>
                      <option value="adaptive">Adaptive Learning</option>
                      <option value="free_choice">Free Choice</option>
                    </select>
                  </div>
                  
                  <div className="flex items-end">
                    <button
                      onClick={() => removeProgressionRule(rule.id)}
                      className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-600 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <div>
                  <span className="block text-sm font-medium text-gray-300 mb-2">
                    Description
                  </span>
                  <textarea
                    value={rule.description}
                    onChange={(e) => updateProgressionRule(rule.id, { description: e.target.value })}
                    rows={2}
                    className="w-full bg-gray-600 border border-gray-500 rounded px-3 py-2 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Describe how this rule affects series progression..."
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderContentTab = () => (
    <div className="space-y-6">
      {/* Basic Information */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Series Information</h3>
        
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="seriesTitle" className="block text-sm font-medium text-gray-300 mb-2">
                Series Title *
              </label>
              <input
                type="text"
                id="seriesTitle"
                value={series.title}
                onChange={(e) => updateSeries({ title: e.target.value })}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter series title..."
                required
              />
            </div>
            
            <div>
              <label htmlFor="seriesInstructor" className="block text-sm font-medium text-gray-300 mb-2">
                Lead Instructor *
              </label>
              <input
                type="text"
                id="seriesInstructor"
                value={series.instructor}
                onChange={(e) => updateSeries({ instructor: e.target.value })}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter instructor name..."
                required
              />
            </div>
          </div>
          
          <div>
            <label htmlFor="shortDesc" className="block text-sm font-medium text-gray-300 mb-2">
              Short Description *
            </label>
            <input
              type="text"
              id="shortDesc"
              value={series.shortDescription}
              onChange={(e) => updateSeries({ shortDescription: e.target.value })}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Brief description for listings..."
              maxLength={120}
              required
            />
            <div className="text-xs text-gray-400 mt-1">{series.shortDescription.length}/120 characters</div>
          </div>
          
          <div>
            <label htmlFor="fullDesc" className="block text-sm font-medium text-gray-300 mb-2">
              Full Description *
            </label>
            <textarea
              id="fullDesc"
              value={series.description}
              onChange={(e) => updateSeries({ description: e.target.value })}
              rows={4}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Detailed description of the series, its goals, and what participants can expect..."
              required
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="seriesCategory" className="block text-sm font-medium text-gray-300 mb-2">
                Category *
              </label>
              <select
                id="seriesCategory"
                value={series.category}
                onChange={(e) => updateSeries({ category: e.target.value })}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Mindfulness">Mindfulness</option>
                <option value="Stress Management">Stress Management</option>
                <option value="Sleep">Sleep</option>
                <option value="Movement">Movement</option>
                <option value="Focus">Focus</option>
                <option value="Emotional Regulation">Emotional Regulation</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="seriesDifficulty" className="block text-sm font-medium text-gray-300 mb-2">
                Difficulty Level *
              </label>
              <select
                id="seriesDifficulty"
                value={series.difficulty}
                onChange={(e) => updateSeries({ difficulty: e.target.value as PracticeSeries['difficulty'] })}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
                <option value="expert">Expert</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="duration" className="block text-sm font-medium text-gray-300 mb-2">
                Estimated Duration (days)
              </label>
              <input
                type="number"
                id="duration"
                min="1"
                max="365"
                value={series.estimatedDuration}
                onChange={(e) => updateSeries({ estimatedDuration: Number(e.target.value) })}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSettingsTab = () => (
    <div className="space-y-6">
      {/* Series Settings */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Series Settings</h3>
        
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-md font-medium text-gray-300 mb-3">Access & Pacing</h4>
              <div className="space-y-3">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={series.isPublic}
                    onChange={(e) => updateSeries({ isPublic: e.target.checked })}
                    className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-300">Public series</span>
                </label>
                
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={series.allowSelfPaced}
                    onChange={(e) => updateSeries({ allowSelfPaced: e.target.checked })}
                    className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-300">Allow self-paced progression</span>
                </label>
                
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={series.allowCustomOrder}
                    onChange={(e) => updateSeries({ allowCustomOrder: e.target.checked })}
                    className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-300">Allow custom practice order</span>
                </label>
              </div>
            </div>
            
            <div>
              <h4 className="text-md font-medium text-gray-300 mb-3">Features</h4>
              <div className="space-y-3">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={series.enableCommunity}
                    onChange={(e) => updateSeries({ enableCommunity: e.target.checked })}
                    className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-300">Enable community features</span>
                </label>
                
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={series.certificateEligible}
                    onChange={(e) => updateSeries({ certificateEligible: e.target.checked })}
                    className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-300">Certificate eligible</span>
                </label>
              </div>
            </div>
          </div>
          
          <div>
            <label htmlFor="timeCommitment" className="block text-sm font-medium text-gray-300 mb-2">
              Time Commitment
            </label>
            <input
              type="text"
              id="timeCommitment"
              value={series.timeCommitment}
              onChange={(e) => updateSeries({ timeCommitment: e.target.value })}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., 15-20 minutes daily"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderAnalyticsTab = () => (
    <div className="space-y-6">
      {/* Analytics Preview */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Series Analytics Preview</h3>
        
        <div className="text-center py-12">
          <TrendingUp className="w-16 h-16 text-gray-500 mx-auto mb-4" />
          <h4 className="text-xl font-semibold text-gray-300 mb-2">Analytics Coming Soon</h4>
          <p className="text-gray-400 mb-6 max-w-md mx-auto">
            Once your series is published and users start participating, detailed analytics will appear here.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
            <div className="bg-gray-700 rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-400 mb-1">0</div>
              <div className="text-sm text-gray-400">Total Participants</div>
            </div>
            <div className="bg-gray-700 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-400 mb-1">0%</div>
              <div className="text-sm text-gray-400">Completion Rate</div>
            </div>
            <div className="bg-gray-700 rounded-lg p-4">
              <div className="text-2xl font-bold text-yellow-400 mb-1">0.0</div>
              <div className="text-sm text-gray-400">Average Rating</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTabs = () => {
    const tabs = [
      { id: 'structure', label: 'Structure', icon: <TreePine className="w-4 h-4" /> },
      { id: 'progression', label: 'Progression', icon: <Target className="w-4 h-4" /> },
      { id: 'content', label: 'Content', icon: <BookOpen className="w-4 h-4" /> },
      { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
      { id: 'analytics', label: 'Analytics', icon: <TrendingUp className="w-4 h-4" /> }
    ];

    return (
      <div className="border-b border-gray-700 mb-6">
        <nav className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`py-4 px-2 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => onNavigate('practice-list')}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">
              {seriesId ? 'Edit Practice Series' : 'Create Practice Series'}
            </h1>
            <p className="text-gray-400">
              {series.title || 'Build a structured learning journey'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          {saveStatus && (
            <div className={`flex items-center space-x-2 text-sm ${
              saveStatus === 'saving' ? 'text-yellow-400' :
              saveStatus === 'saved' ? 'text-green-400' :
              'text-red-400'
            }`}>
              {saveStatus === 'saving' && <div className="w-4 h-4 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />}
              {saveStatus === 'saved' && <CheckCircle className="w-4 h-4" />}
              {saveStatus === 'error' && <AlertCircle className="w-4 h-4" />}
              <span>
                {saveStatus === 'saving' && 'Saving...'}
                {saveStatus === 'saved' && 'Saved'}
                {saveStatus === 'error' && 'Save failed'}
              </span>
            </div>
          )}
          
          <button
            className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors flex items-center space-x-2"
          >
            <Eye className="w-4 h-4" />
            <span>Preview</span>
          </button>
          
          <button
            onClick={() => {
              setIsSaving(true);
              // Save logic here
              setTimeout(() => setIsSaving(false), 1000);
            }}
            disabled={isSaving}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving...' : 'Save Series'}</span>
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      {renderTabs()}

      {/* Content */}
      <div>
        {activeTab === 'structure' && renderStructureTab()}
        {activeTab === 'progression' && renderProgressionTab()}
        {activeTab === 'content' && renderContentTab()}
        {activeTab === 'settings' && renderSettingsTab()}
        {activeTab === 'analytics' && renderAnalyticsTab()}
      </div>
    </div>
  );
};