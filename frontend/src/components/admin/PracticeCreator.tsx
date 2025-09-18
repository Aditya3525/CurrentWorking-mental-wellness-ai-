import { 
  Save,
  Eye,
  ArrowLeft,
  Plus,
  Trash2,
  Clock,
  Settings,
  Pause,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Brain,
  Wind,
  Activity,
  CheckCircle,
  AlertCircle,
  Volume2,
  Image,
  FileText,
  Target
} from 'lucide-react';
import React, { useState, useEffect, useCallback } from 'react';

// Types
interface PracticeStep {
  id: string;
  title: string;
  description: string;
  duration: number; // in seconds
  type: 'instruction' | 'breathing' | 'movement' | 'meditation' | 'pause' | 'transition';
  audioUrl?: string;
  imageUrl?: string;
  breathingPattern?: {
    inhale: number;
    hold: number;
    exhale: number;
    pause: number;
    cycles?: number;
  };
  guidance?: string;
  cues?: string[];
}

interface BreathingPattern {
  name: string;
  inhale: number;
  hold: number;
  exhale: number;
  pause: number;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

interface Practice {
  id?: string;
  title: string;
  type: 'meditation' | 'breathing' | 'mindfulness' | 'movement' | 'series';
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  category: string;
  subcategory: string;
  duration: number; // in minutes
  instructor: string;
  description: string;
  shortDescription: string;
  
  // Timing
  preparationTime: number; // in minutes
  practiceTime: number; // in minutes (main practice)
  windDownTime: number; // in minutes
  
  // Requirements
  equipment: string[];
  spaceRequirement: 'small' | 'medium' | 'large' | 'any';
  prerequisites: string[];
  
  // Content
  benefits: string[];
  tags: string[];
  steps: PracticeStep[];
  
  // Audio & Visual
  hasAudioGuide: boolean;
  audioIntroUrl?: string;
  audioGuideUrl?: string;
  audioOutroUrl?: string;
  hasVisualAids: boolean;
  thumbnailUrl?: string;
  backgroundImageUrl?: string;
  visualAids: string[];
  
  // Breathing specific
  breathingPattern?: BreathingPattern;
  isGuidedBreathing: boolean;
  
  // Movement specific
  movementType?: 'yoga' | 'stretching' | 'tai-chi' | 'walking' | 'dance' | 'other';
  intensityLevel?: 'gentle' | 'moderate' | 'vigorous';
  
  // Metadata
  targetAudience: string[];
  timeOfDay: string[];
  practiceGoals: string[];
  contraindications: string[];
  modifications: string[];
  
  // Publishing
  status: 'draft' | 'published' | 'archived' | 'under_review';
  isPublic: boolean;
  publishedAt?: Date;
  scheduledPublishAt?: Date;
}

interface PracticeCreatorProps {
  onNavigate: (page: string, practiceId?: string) => void;
  practiceId?: string; // For editing existing practice
}

// Predefined data
const practiceCategories = {
  'Mindfulness': ['Body Awareness', 'Breath Awareness', 'Present Moment', 'Loving Kindness'],
  'Stress Management': ['Anxiety Relief', 'Tension Release', 'Emotional Regulation', 'Crisis Support'],
  'Sleep': ['Bedtime Routine', 'Sleep Preparation', 'Insomnia Support', 'Deep Rest'],
  'Movement': ['Yoga', 'Stretching', 'Walking Meditation', 'Gentle Exercise'],
  'Focus': ['Concentration', 'Mental Clarity', 'Attention Training', 'Productivity'],
  'Emotional Regulation': ['Anger Management', 'Grief Support', 'Joy Cultivation', 'Self-Compassion']
};

const breathingPatterns: BreathingPattern[] = [
  {
    name: '4-7-8 Breathing',
    inhale: 4,
    hold: 7,
    exhale: 8,
    pause: 0,
    description: 'Calming pattern for anxiety and sleep',
    difficulty: 'intermediate'
  },
  {
    name: 'Box Breathing',
    inhale: 4,
    hold: 4,
    exhale: 4,
    pause: 4,
    description: 'Balanced pattern for focus and stress relief',
    difficulty: 'beginner'
  },
  {
    name: 'Triangle Breathing',
    inhale: 4,
    hold: 4,
    exhale: 4,
    pause: 0,
    description: 'Simple pattern for beginners',
    difficulty: 'beginner'
  },
  {
    name: 'Coherent Breathing',
    inhale: 5,
    hold: 0,
    exhale: 5,
    pause: 0,
    description: 'Heart rate variability optimization',
    difficulty: 'intermediate'
  }
];


const defaultStep: Omit<PracticeStep, 'id'> = {
  title: '',
  description: '',
  duration: 60,
  type: 'instruction',
  guidance: '',
  cues: []
};

export const PracticeCreator: React.FC<PracticeCreatorProps> = ({ onNavigate, practiceId }) => {
  const [practice, setPractice] = useState<Practice>({
    title: '',
    type: 'meditation',
    difficulty: 'beginner',
    category: 'Mindfulness',
    subcategory: 'Breath Awareness',
    duration: 15,
    instructor: '',
    description: '',
    shortDescription: '',
    preparationTime: 2,
    practiceTime: 10,
    windDownTime: 3,
    equipment: [],
    spaceRequirement: 'small',
    prerequisites: [],
    benefits: [],
    tags: [],
    steps: [],
    hasAudioGuide: false,
    hasVisualAids: false,
    visualAids: [],
    isGuidedBreathing: false,
    targetAudience: [],
    timeOfDay: [],
    practiceGoals: [],
    contraindications: [],
    modifications: [],
    status: 'draft',
    isPublic: false
  });

  const [activeTab, setActiveTab] = useState<'basic' | 'structure' | 'content' | 'audio' | 'metadata' | 'publish'>('basic');
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error' | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['basic-info']));

  // Auto-save effect
  useEffect(() => {
    const timer = setTimeout(() => {
      if (practice.title) {
        handleAutoSave();
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [practice]);

  // Load existing practice if editing
  useEffect(() => {
    if (practiceId) {
      // Load practice data from API
      // For now, we'll use mock data
      console.log('Loading practice:', practiceId);
    }
  }, [practiceId]);

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

  const handleSave = async (publishNow = false) => {
    setIsSaving(true);
    try {
      const updatedPractice = {
        ...practice,
        status: publishNow ? 'published' as const : practice.status,
        publishedAt: publishNow ? new Date() : practice.publishedAt
      };
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      console.log('Practice saved:', updatedPractice);
      
      if (publishNow) {
        onNavigate('practice-list');
      }
    } catch (error) {
      console.error('Save failed:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const updatePractice = (updates: Partial<Practice>) => {
    setPractice(prev => ({ ...prev, ...updates }));
  };

  const updateTotalDuration = useCallback(() => {
    const totalDuration = practice.preparationTime + practice.practiceTime + practice.windDownTime;
    updatePractice({ duration: totalDuration });
  }, [practice.preparationTime, practice.practiceTime, practice.windDownTime]);

  useEffect(() => {
    updateTotalDuration();
  }, [updateTotalDuration]);

  const addStep = () => {
    const newStep: PracticeStep = {
      ...defaultStep,
      id: `step-${Date.now()}`,
      title: `Step ${practice.steps.length + 1}`
    };
    updatePractice({ steps: [...practice.steps, newStep] });
  };

  const updateStep = (stepId: string, updates: Partial<PracticeStep>) => {
    updatePractice({
      steps: practice.steps.map(step => 
        step.id === stepId ? { ...step, ...updates } : step
      )
    });
  };

  const removeStep = (stepId: string) => {
    updatePractice({
      steps: practice.steps.filter(step => step.id !== stepId)
    });
  };

  const moveStep = (stepId: string, direction: 'up' | 'down') => {
    const currentIndex = practice.steps.findIndex(step => step.id === stepId);
    if (currentIndex === -1) return;
    
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= practice.steps.length) return;
    
    const newSteps = [...practice.steps];
    [newSteps[currentIndex], newSteps[newIndex]] = [newSteps[newIndex], newSteps[currentIndex]];
    
    updatePractice({ steps: newSteps });
  };

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (minutes === 0) return `${remainingSeconds}s`;
    if (remainingSeconds === 0) return `${minutes}m`;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const getStepIcon = (type: PracticeStep['type']) => {
    switch (type) {
      case 'breathing': return <Wind className="w-4 h-4" />;
      case 'movement': return <Activity className="w-4 h-4" />;
      case 'meditation': return <Brain className="w-4 h-4" />;
      case 'pause': return <Pause className="w-4 h-4" />;
      case 'transition': return <RotateCcw className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const renderBasicTab = () => (
    <div className="space-y-6">
      {/* Basic Information */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Basic Information</h3>
          <button
            onClick={() => toggleSection('basic-info')}
            className="text-gray-400 hover:text-white"
          >
            {expandedSections.has('basic-info') ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>
        
        {expandedSections.has('basic-info') && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-2">
                  Practice Title *
                </label>
                <input
                  type="text"
                  id="title"
                  value={practice.title}
                  onChange={(e) => updatePractice({ title: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter practice title..."
                  required
                />
              </div>
              
              <div>
                <label htmlFor="instructor" className="block text-sm font-medium text-gray-300 mb-2">
                  Instructor *
                </label>
                <input
                  type="text"
                  id="instructor"
                  value={practice.instructor}
                  onChange={(e) => updatePractice({ instructor: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter instructor name..."
                  required
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="shortDescription" className="block text-sm font-medium text-gray-300 mb-2">
                Short Description *
              </label>
              <input
                type="text"
                id="shortDescription"
                value={practice.shortDescription}
                onChange={(e) => updatePractice({ shortDescription: e.target.value })}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Brief description for listings and previews..."
                maxLength={120}
                required
              />
              <div className="text-xs text-gray-400 mt-1">{practice.shortDescription.length}/120 characters</div>
            </div>
            
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-2">
                Full Description *
              </label>
              <textarea
                id="description"
                value={practice.description}
                onChange={(e) => updatePractice({ description: e.target.value })}
                rows={4}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Detailed description of the practice, its benefits, and what participants can expect..."
                required
              />
            </div>
          </div>
        )}
      </div>

      {/* Practice Type & Classification */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Classification</h3>
          <button
            onClick={() => toggleSection('classification')}
            className="text-gray-400 hover:text-white"
          >
            {expandedSections.has('classification') ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>
        
        {expandedSections.has('classification') && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="type" className="block text-sm font-medium text-gray-300 mb-2">
                  Practice Type *
                </label>
                <select
                  id="type"
                  value={practice.type}
                  onChange={(e) => updatePractice({ type: e.target.value as Practice['type'] })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="meditation">Meditation</option>
                  <option value="breathing">Breathing</option>
                  <option value="mindfulness">Mindfulness</option>
                  <option value="movement">Movement</option>
                  <option value="series">Series</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="difficulty" className="block text-sm font-medium text-gray-300 mb-2">
                  Difficulty Level *
                </label>
                <select
                  id="difficulty"
                  value={practice.difficulty}
                  onChange={(e) => updatePractice({ difficulty: e.target.value as Practice['difficulty'] })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                  <option value="expert">Expert</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="spaceRequirement" className="block text-sm font-medium text-gray-300 mb-2">
                  Space Required *
                </label>
                <select
                  id="spaceRequirement"
                  value={practice.spaceRequirement}
                  onChange={(e) => updatePractice({ spaceRequirement: e.target.value as Practice['spaceRequirement'] })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="any">Any Space</option>
                  <option value="small">Small Space</option>
                  <option value="medium">Medium Space</option>
                  <option value="large">Large Space</option>
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-300 mb-2">
                  Category *
                </label>
                <select
                  id="category"
                  value={practice.category}
                  onChange={(e) => {
                    const newCategory = e.target.value;
                    updatePractice({ 
                      category: newCategory, 
                      subcategory: practiceCategories[newCategory]?.[0] || '' 
                    });
                  }}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {Object.keys(practiceCategories).map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label htmlFor="subcategory" className="block text-sm font-medium text-gray-300 mb-2">
                  Subcategory *
                </label>
                <select
                  id="subcategory"
                  value={practice.subcategory}
                  onChange={(e) => updatePractice({ subcategory: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {(practiceCategories[practice.category] || []).map(subcategory => (
                    <option key={subcategory} value={subcategory}>{subcategory}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Timing Configuration */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Timing</h3>
          <button
            onClick={() => toggleSection('timing')}
            className="text-gray-400 hover:text-white"
          >
            {expandedSections.has('timing') ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>
        
        {expandedSections.has('timing') && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label htmlFor="preparationTime" className="block text-sm font-medium text-gray-300 mb-2">
                  Preparation (min)
                </label>
                <input
                  type="number"
                  id="preparationTime"
                  min="0"
                  max="15"
                  value={practice.preparationTime}
                  onChange={(e) => updatePractice({ preparationTime: Number(e.target.value) })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label htmlFor="practiceTime" className="block text-sm font-medium text-gray-300 mb-2">
                  Main Practice (min) *
                </label>
                <input
                  type="number"
                  id="practiceTime"
                  min="1"
                  max="120"
                  value={practice.practiceTime}
                  onChange={(e) => updatePractice({ practiceTime: Number(e.target.value) })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="windDownTime" className="block text-sm font-medium text-gray-300 mb-2">
                  Wind Down (min)
                </label>
                <input
                  type="number"
                  id="windDownTime"
                  min="0"
                  max="15"
                  value={practice.windDownTime}
                  onChange={(e) => updatePractice({ windDownTime: Number(e.target.value) })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <span className="block text-sm font-medium text-gray-300 mb-2">
                  Total Duration
                </span>
                <div className="w-full bg-gray-600 border border-gray-500 rounded-lg px-3 py-2 text-gray-300 text-center font-medium">
                  {practice.duration} min
                </div>
              </div>
            </div>
            
            <div className="bg-gray-700 rounded-lg p-4">
              <div className="flex items-center space-x-2 text-sm text-gray-300 mb-2">
                <Clock className="w-4 h-4" />
                <span>Timing Breakdown</span>
              </div>
              <div className="space-y-1 text-xs text-gray-400">
                <div>Preparation: Setting up space, getting comfortable</div>
                <div>Main Practice: The core practice experience</div>
                <div>Wind Down: Gentle transition back to regular awareness</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderStructureTab = () => (
    <div className="space-y-6">
      {/* Practice Steps */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Practice Structure</h3>
          <button
            onClick={addStep}
            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Step</span>
          </button>
        </div>
        
        {practice.steps.length === 0 ? (
          <div className="text-center py-8">
            <Brain className="w-12 h-12 text-gray-500 mx-auto mb-4" />
            <p className="text-gray-400 mb-4">No practice steps defined yet</p>
            <button
              onClick={addStep}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Add First Step
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {practice.steps.map((step, index) => (
              <div key={step.id} className="bg-gray-700 border border-gray-600 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-300">Step {index + 1}</span>
                      <div className="flex items-center space-x-1 text-gray-400">
                        {getStepIcon(step.type)}
                        <span className="text-xs capitalize">{step.type}</span>
                      </div>
                    </div>
                    <div className="text-xs text-gray-400">
                      {formatDuration(step.duration)}
                    </div>
                  </div>
                  
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
                      disabled={index === practice.steps.length - 1}
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
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <span className="block text-sm font-medium text-gray-300 mb-2">
                      Step Title
                    </span>
                    <input
                      type="text"
                      value={step.title}
                      onChange={(e) => updateStep(step.id, { title: e.target.value })}
                      className="w-full bg-gray-600 border border-gray-500 rounded px-3 py-2 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter step title..."
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="block text-sm font-medium text-gray-300 mb-2">
                        Type
                      </span>
                      <select
                        value={step.type}
                        onChange={(e) => updateStep(step.id, { type: e.target.value as PracticeStep['type'] })}
                        className="w-full bg-gray-600 border border-gray-500 rounded px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="instruction">Instruction</option>
                        <option value="breathing">Breathing</option>
                        <option value="movement">Movement</option>
                        <option value="meditation">Meditation</option>
                        <option value="pause">Pause</option>
                        <option value="transition">Transition</option>
                      </select>
                    </div>
                    
                    <div>
                      <span className="block text-sm font-medium text-gray-300 mb-2">
                        Duration (seconds)
                      </span>
                      <input
                        type="number"
                        min="5"
                        max="3600"
                        value={step.duration}
                        onChange={(e) => updateStep(step.id, { duration: Number(e.target.value) })}
                        className="w-full bg-gray-600 border border-gray-500 rounded px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="mb-4">
                  <span className="block text-sm font-medium text-gray-300 mb-2">
                    Description
                  </span>
                  <textarea
                    value={step.description}
                    onChange={(e) => updateStep(step.id, { description: e.target.value })}
                    rows={2}
                    className="w-full bg-gray-600 border border-gray-500 rounded px-3 py-2 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Describe what happens in this step..."
                  />
                </div>
                
                {step.type === 'breathing' && (
                  <div className="bg-gray-600 rounded p-3 mb-4">
                    <h5 className="text-sm font-medium text-gray-300 mb-3">Breathing Pattern</h5>
                    <div className="grid grid-cols-4 gap-2">
                      <div>
                        <span className="block text-xs text-gray-400 mb-1">Inhale (s)</span>
                        <input
                          type="number"
                          min="1"
                          max="20"
                          value={step.breathingPattern?.inhale || 4}
                          onChange={(e) => updateStep(step.id, {
                            breathingPattern: {
                              ...step.breathingPattern,
                              inhale: Number(e.target.value),
                              hold: step.breathingPattern?.hold || 0,
                              exhale: step.breathingPattern?.exhale || 4,
                              pause: step.breathingPattern?.pause || 0
                            }
                          })}
                          className="w-full bg-gray-500 border border-gray-400 rounded px-2 py-1 text-gray-100 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <span className="block text-xs text-gray-400 mb-1">Hold (s)</span>
                        <input
                          type="number"
                          min="0"
                          max="20"
                          value={step.breathingPattern?.hold || 0}
                          onChange={(e) => updateStep(step.id, {
                            breathingPattern: {
                              ...step.breathingPattern,
                              inhale: step.breathingPattern?.inhale || 4,
                              hold: Number(e.target.value),
                              exhale: step.breathingPattern?.exhale || 4,
                              pause: step.breathingPattern?.pause || 0
                            }
                          })}
                          className="w-full bg-gray-500 border border-gray-400 rounded px-2 py-1 text-gray-100 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <span className="block text-xs text-gray-400 mb-1">Exhale (s)</span>
                        <input
                          type="number"
                          min="1"
                          max="20"
                          value={step.breathingPattern?.exhale || 4}
                          onChange={(e) => updateStep(step.id, {
                            breathingPattern: {
                              ...step.breathingPattern,
                              inhale: step.breathingPattern?.inhale || 4,
                              hold: step.breathingPattern?.hold || 0,
                              exhale: Number(e.target.value),
                              pause: step.breathingPattern?.pause || 0
                            }
                          })}
                          className="w-full bg-gray-500 border border-gray-400 rounded px-2 py-1 text-gray-100 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <span className="block text-xs text-gray-400 mb-1">Pause (s)</span>
                        <input
                          type="number"
                          min="0"
                          max="20"
                          value={step.breathingPattern?.pause || 0}
                          onChange={(e) => updateStep(step.id, {
                            breathingPattern: {
                              ...step.breathingPattern,
                              inhale: step.breathingPattern?.inhale || 4,
                              hold: step.breathingPattern?.hold || 0,
                              exhale: step.breathingPattern?.exhale || 4,
                              pause: Number(e.target.value)
                            }
                          })}
                          className="w-full bg-gray-500 border border-gray-400 rounded px-2 py-1 text-gray-100 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                )}
                
                <div>
                  <span className="block text-sm font-medium text-gray-300 mb-2">
                    Guidance Notes (Optional)
                  </span>
                  <textarea
                    value={step.guidance || ''}
                    onChange={(e) => updateStep(step.id, { guidance: e.target.value })}
                    rows={2}
                    className="w-full bg-gray-600 border border-gray-500 rounded px-3 py-2 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Additional guidance or cues for instructors..."
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Breathing Pattern Presets (for breathing practices) */}
      {practice.type === 'breathing' && (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Breathing Pattern Presets</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {breathingPatterns.map((pattern) => (
              <div key={pattern.name} className="bg-gray-700 border border-gray-600 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-white">{pattern.name}</h4>
                  <span className={`px-2 py-1 rounded text-xs ${
                    pattern.difficulty === 'beginner' ? 'bg-green-900 text-green-300' :
                    pattern.difficulty === 'intermediate' ? 'bg-yellow-900 text-yellow-300' :
                    'bg-red-900 text-red-300'
                  }`}>
                    {pattern.difficulty}
                  </span>
                </div>
                <p className="text-sm text-gray-400 mb-3">{pattern.description}</p>
                <div className="flex items-center justify-between text-xs text-gray-300 mb-3">
                  <span>Inhale: {pattern.inhale}s</span>
                  <span>Hold: {pattern.hold}s</span>
                  <span>Exhale: {pattern.exhale}s</span>
                  <span>Pause: {pattern.pause}s</span>
                </div>
                <button
                  onClick={() => updatePractice({ breathingPattern: pattern })}
                  className="w-full px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
                >
                  Apply Pattern
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderTabs = () => {
    const tabs = [
      { id: 'basic', label: 'Basic Info', icon: <FileText className="w-4 h-4" /> },
      { id: 'structure', label: 'Structure', icon: <Settings className="w-4 h-4" /> },
      { id: 'content', label: 'Content', icon: <Image className="w-4 h-4" /> },
      { id: 'audio', label: 'Audio/Visual', icon: <Volume2 className="w-4 h-4" /> },
      { id: 'metadata', label: 'Metadata', icon: <Target className="w-4 h-4" /> },
      { id: 'publish', label: 'Publish', icon: <CheckCircle className="w-4 h-4" /> }
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
              {practiceId ? 'Edit Practice' : 'Create New Practice'}
            </h1>
            <p className="text-gray-400">
              {practice.title || 'Build a comprehensive practice experience'}
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
            onClick={() => setIsPreviewMode(!isPreviewMode)}
            className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors flex items-center space-x-2"
          >
            <Eye className="w-4 h-4" />
            <span>{isPreviewMode ? 'Edit' : 'Preview'}</span>
          </button>
          
          <button
            onClick={() => handleSave(false)}
            disabled={isSaving}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving...' : 'Save Draft'}</span>
          </button>
          
          <button
            onClick={() => handleSave(true)}
            disabled={isSaving || !practice.title || !practice.instructor}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            Publish
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      {!isPreviewMode && renderTabs()}

      {/* Content */}
      <div className="bg-gray-900 min-h-screen">
        {!isPreviewMode ? (
          <div>
            {activeTab === 'basic' && renderBasicTab()}
            {activeTab === 'structure' && renderStructureTab()}
            {activeTab === 'content' && (
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 text-center">
                <Image className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-400">Content management features coming soon...</p>
              </div>
            )}
            {activeTab === 'audio' && (
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 text-center">
                <Volume2 className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-400">Audio and visual management features coming soon...</p>
              </div>
            )}
            {activeTab === 'metadata' && (
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 text-center">
                <Target className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-400">Metadata and targeting features coming soon...</p>
              </div>
            )}
            {activeTab === 'publish' && (
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 text-center">
                <CheckCircle className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-400">Publishing workflow features coming soon...</p>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 text-center">
            <Eye className="w-12 h-12 text-gray-500 mx-auto mb-4" />
            <p className="text-gray-400">Practice preview mode coming soon...</p>
          </div>
        )}
      </div>
    </div>
  );
};