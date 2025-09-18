import {
  Save,
  ArrowLeft,
  Plus,
  Trash2,
  Edit3,
  TrendingUp,
  BarChart3,
  Target,
  Star,
  Clock,
  Users,
  Activity,
  Brain,
  Wind,
  Heart,
  Zap,
  CheckCircle,
  AlertCircle,
  Eye,
  Calendar,
  Award,
  Filter,
  Download,
  Upload,
  Settings,
  Info,
  LineChart,
  PieChart,
  TrendingDown,
  RefreshCw,
  MoreHorizontal,
  Copy,
  FileText,
  Tag
} from 'lucide-react';
import React, { useState, useEffect } from 'react';

// Types
interface EffectivenessMetrics {
  overallRating: number; // 1-5 stars
  completionRate: number; // percentage
  dropoffRate: number; // percentage
  averageSessionDuration: number; // minutes
  repeatUsage: number; // percentage who use multiple times
  reportedBenefits: {
    stressReduction: number;
    anxietyRelief: number;
    improvedSleep: number;
    increasedFocus: number;
    emotionalRegulation: number;
    physicalComfort: number;
  };
  userFeedback: {
    positive: number;
    neutral: number;
    negative: number;
  };
  clinicalOutcomes?: {
    pre_assessmentAvg: number;
    post_assessmentAvg: number;
    significanceLevel: number;
  };
}

interface PersonalizationData {
  recommendationTags: string[];
  targetAudience: {
    ageGroups: string[];
    experienceLevels: string[];
    mentalHealthConditions: string[];
    preferences: string[];
  };
  adaptiveParameters: {
    difficultyScaling: boolean;
    durationFlexibility: boolean;
    contentVariations: string[];
    progressionSpeed: 'slow' | 'medium' | 'fast' | 'adaptive';
  };
  contextualFactors: {
    timeOfDay: string[];
    environment: string[];
    mood: string[];
    energyLevel: string[];
  };
}

interface RecommendationEngine {
  algorithmType: 'collaborative' | 'content_based' | 'hybrid' | 'ml_based';
  weightFactors: {
    userHistory: number;
    similarUsers: number;
    contentSimilarity: number;
    effectiveness: number;
    recency: number;
  };
  triggerConditions: {
    completionThreshold: number;
    ratingThreshold: number;
    usageFrequency: number;
    contextualMatch: boolean;
  };
  outputRules: {
    maxRecommendations: number;
    diversityFactor: number;
    noveltyBoost: boolean;
    seasonalAdjustment: boolean;
  };
}

interface AnalyticsConfig {
  trackingEnabled: boolean;
  dataRetentionDays: number;
  anonymizeData: boolean;
  consentRequired: boolean;
  reportingFrequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  dashboardMetrics: string[];
  alertThresholds: {
    lowCompletionRate: number;
    highDropoffRate: number;
    lowRating: number;
    technicalErrors: number;
  };
  exportFormats: string[];
}

interface PracticeMetadata {
  id?: string;
  practiceId: string;
  lastUpdated: Date;
  
  // Effectiveness tracking
  effectiveness: EffectivenessMetrics;
  
  // Personalization data
  personalization: PersonalizationData;
  
  // Recommendation engine
  recommendations: RecommendationEngine;
  
  // Analytics configuration
  analytics: AnalyticsConfig;
  
  // Performance tracking
  performance: {
    technicalMetrics: {
      loadTime: number;
      errorRate: number;
      apiResponseTime: number;
    };
    userEngagement: {
      sessionDuration: number;
      interactionRate: number;
      returnRate: number;
    };
  };
  
  // Optimization suggestions
  optimizations: {
    id: string;
    type: 'content' | 'technical' | 'ux' | 'personalization';
    priority: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    implementationEffort: 'low' | 'medium' | 'high';
    expectedImpact: 'low' | 'medium' | 'high';
    status: 'pending' | 'in_progress' | 'completed' | 'dismissed';
  }[];
}

interface Practice {
  id: string;
  title: string;
  type: 'meditation' | 'breathing' | 'mindfulness' | 'movement';
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  duration: number;
  instructor: string;
  category: string;
}

interface PracticeMetadataManagerProps {
  onNavigate: (page: string, practiceId?: string) => void;
  practiceId?: string; // For viewing specific practice metadata
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
    category: 'Breathing'
  },
  {
    id: '2',
    title: 'Body Scan Meditation',
    type: 'meditation',
    difficulty: 'beginner',
    duration: 15,
    instructor: 'Dr. Sarah Johnson',
    category: 'Mindfulness'
  },
  {
    id: '3',
    title: '4-7-8 Breathing Pattern',
    type: 'breathing',
    difficulty: 'intermediate',
    duration: 12,
    instructor: 'Dr. Michael Chen',
    category: 'Breathing'
  }
];

const defaultMetadata: Omit<PracticeMetadata, 'id' | 'practiceId'> = {
  lastUpdated: new Date(),
  effectiveness: {
    overallRating: 0,
    completionRate: 0,
    dropoffRate: 0,
    averageSessionDuration: 0,
    repeatUsage: 0,
    reportedBenefits: {
      stressReduction: 0,
      anxietyRelief: 0,
      improvedSleep: 0,
      increasedFocus: 0,
      emotionalRegulation: 0,
      physicalComfort: 0
    },
    userFeedback: {
      positive: 0,
      neutral: 0,
      negative: 0
    }
  },
  personalization: {
    recommendationTags: [],
    targetAudience: {
      ageGroups: [],
      experienceLevels: [],
      mentalHealthConditions: [],
      preferences: []
    },
    adaptiveParameters: {
      difficultyScaling: false,
      durationFlexibility: false,
      contentVariations: [],
      progressionSpeed: 'medium'
    },
    contextualFactors: {
      timeOfDay: [],
      environment: [],
      mood: [],
      energyLevel: []
    }
  },
  recommendations: {
    algorithmType: 'hybrid',
    weightFactors: {
      userHistory: 0.3,
      similarUsers: 0.2,
      contentSimilarity: 0.2,
      effectiveness: 0.2,
      recency: 0.1
    },
    triggerConditions: {
      completionThreshold: 80,
      ratingThreshold: 3.5,
      usageFrequency: 3,
      contextualMatch: true
    },
    outputRules: {
      maxRecommendations: 5,
      diversityFactor: 0.3,
      noveltyBoost: true,
      seasonalAdjustment: false
    }
  },
  analytics: {
    trackingEnabled: true,
    dataRetentionDays: 365,
    anonymizeData: true,
    consentRequired: true,
    reportingFrequency: 'weekly',
    dashboardMetrics: ['completion_rate', 'rating', 'engagement'],
    alertThresholds: {
      lowCompletionRate: 60,
      highDropoffRate: 40,
      lowRating: 3.0,
      technicalErrors: 5
    },
    exportFormats: ['csv', 'json']
  },
  performance: {
    technicalMetrics: {
      loadTime: 0,
      errorRate: 0,
      apiResponseTime: 0
    },
    userEngagement: {
      sessionDuration: 0,
      interactionRate: 0,
      returnRate: 0
    }
  },
  optimizations: []
};

export const PracticeMetadataManager: React.FC<PracticeMetadataManagerProps> = ({ 
  onNavigate, 
  practiceId 
}) => {
  const [practices] = useState<Practice[]>(mockPractices);
  const [selectedPractice, setSelectedPractice] = useState<Practice | null>(null);
  const [metadata, setMetadata] = useState<PracticeMetadata | null>(null);
  const [activeTab, setActiveTab] = useState<'effectiveness' | 'personalization' | 'recommendations' | 'analytics' | 'optimizations'>('effectiveness');
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error' | null>(null);
  const [showOptimizationModal, setShowOptimizationModal] = useState(false);

  // Load practice and metadata
  useEffect(() => {
    if (practiceId) {
      const practice = practices.find(p => p.id === practiceId);
      setSelectedPractice(practice || null);
      // Load metadata from API
      loadMetadata(practiceId);
    }
  }, [practiceId, practices]);

  const loadMetadata = async (id: string) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      const mockMetadata: PracticeMetadata = {
        id: `meta-${id}`,
        practiceId: id,
        ...defaultMetadata,
        effectiveness: {
          ...defaultMetadata.effectiveness,
          overallRating: 4.2,
          completionRate: 78,
          dropoffRate: 15,
          averageSessionDuration: 12,
          repeatUsage: 45,
          reportedBenefits: {
            stressReduction: 85,
            anxietyRelief: 72,
            improvedSleep: 68,
            increasedFocus: 76,
            emotionalRegulation: 71,
            physicalComfort: 64
          },
          userFeedback: {
            positive: 82,
            neutral: 15,
            negative: 3
          }
        }
      };
      setMetadata(mockMetadata);
    } catch (error) {
      console.error('Failed to load metadata:', error);
    }
  };

  const updateMetadata = (updates: Partial<PracticeMetadata>) => {
    if (!metadata) return;
    setMetadata({ ...metadata, ...updates, lastUpdated: new Date() });
  };

  const handleAutoSave = async () => {
    if (!metadata) return;
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

  // Auto-save
  useEffect(() => {
    if (metadata) {
      const timer = setTimeout(handleAutoSave, 2000);
      return () => clearTimeout(timer);
    }
  }, [metadata]);

  const addOptimization = (optimization: Omit<PracticeMetadata['optimizations'][0], 'id'>) => {
    if (!metadata) return;
    const newOptimization = {
      id: `opt-${Date.now()}`,
      ...optimization
    };
    updateMetadata({
      optimizations: [...metadata.optimizations, newOptimization]
    });
    setShowOptimizationModal(false);
  };

  const updateOptimization = (optimizationId: string, updates: Partial<PracticeMetadata['optimizations'][0]>) => {
    if (!metadata) return;
    updateMetadata({
      optimizations: metadata.optimizations.map(opt => 
        opt.id === optimizationId ? { ...opt, ...updates } : opt
      )
    });
  };

  const removeOptimization = (optimizationId: string) => {
    if (!metadata) return;
    updateMetadata({
      optimizations: metadata.optimizations.filter(opt => opt.id !== optimizationId)
    });
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

  const getOptimizationPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-400 bg-red-900';
      case 'high': return 'text-orange-400 bg-orange-900';
      case 'medium': return 'text-yellow-400 bg-yellow-900';
      case 'low': return 'text-blue-400 bg-blue-900';
      default: return 'text-gray-400 bg-gray-900';
    }
  };

  const renderEffectivenessTab = () => {
    if (!metadata) return null;

    return (
      <div className="space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Overall Rating</span>
              <Star className="w-4 h-4 text-yellow-400" />
            </div>
            <div className="text-2xl font-bold text-white">
              {metadata.effectiveness.overallRating.toFixed(1)}
            </div>
            <div className="flex items-center space-x-1 mt-1">
              {[1, 2, 3, 4, 5].map(star => (
                <Star
                  key={star}
                  className={`w-3 h-3 ${
                    star <= metadata.effectiveness.overallRating
                      ? 'text-yellow-400 fill-current'
                      : 'text-gray-500'
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Completion Rate</span>
              <CheckCircle className="w-4 h-4 text-green-400" />
            </div>
            <div className="text-2xl font-bold text-white">
              {metadata.effectiveness.completionRate}%
            </div>
            <div className="text-xs text-green-400 mt-1">
              +5% from last month
            </div>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Avg Duration</span>
              <Clock className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-2xl font-bold text-white">
              {metadata.effectiveness.averageSessionDuration}m
            </div>
            <div className="text-xs text-gray-400 mt-1">
              Expected: {selectedPractice?.duration}m
            </div>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Repeat Usage</span>
              <RefreshCw className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl font-bold text-white">
              {metadata.effectiveness.repeatUsage}%
            </div>
            <div className="text-xs text-purple-400 mt-1">
              High engagement
            </div>
          </div>
        </div>

        {/* Reported Benefits */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Reported Benefits</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(metadata.effectiveness.reportedBenefits).map(([benefit, percentage]) => (
              <div key={benefit} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-300 capitalize">
                    {benefit.replace(/([A-Z])/g, ' $1').toLowerCase()}
                  </span>
                  <span className="text-sm font-medium text-white">{percentage}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* User Feedback */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">User Feedback Distribution</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400 mb-1">
                {metadata.effectiveness.userFeedback.positive}%
              </div>
              <div className="text-sm text-gray-400">Positive</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-400 mb-1">
                {metadata.effectiveness.userFeedback.neutral}%
              </div>
              <div className="text-sm text-gray-400">Neutral</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-400 mb-1">
                {metadata.effectiveness.userFeedback.negative}%
              </div>
              <div className="text-sm text-gray-400">Negative</div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderPersonalizationTab = () => {
    if (!metadata) return null;

    return (
      <div className="space-y-6">
        {/* Target Audience */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Target Audience</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <span className="block text-sm font-medium text-gray-300 mb-2">Age Groups</span>
              <div className="space-y-2">
                {['18-25', '26-35', '36-45', '46-55', '56-65', '65+'].map(age => (
                  <label key={age} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={metadata.personalization.targetAudience.ageGroups.includes(age)}
                      onChange={(e) => {
                        const ageGroups = e.target.checked
                          ? [...metadata.personalization.targetAudience.ageGroups, age]
                          : metadata.personalization.targetAudience.ageGroups.filter(a => a !== age);
                        updateMetadata({
                          personalization: {
                            ...metadata.personalization,
                            targetAudience: { ...metadata.personalization.targetAudience, ageGroups }
                          }
                        });
                      }}
                      className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-300">{age}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <span className="block text-sm font-medium text-gray-300 mb-2">Experience Levels</span>
              <div className="space-y-2">
                {['beginner', 'intermediate', 'advanced', 'expert'].map(level => (
                  <label key={level} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={metadata.personalization.targetAudience.experienceLevels.includes(level)}
                      onChange={(e) => {
                        const experienceLevels = e.target.checked
                          ? [...metadata.personalization.targetAudience.experienceLevels, level]
                          : metadata.personalization.targetAudience.experienceLevels.filter(l => l !== level);
                        updateMetadata({
                          personalization: {
                            ...metadata.personalization,
                            targetAudience: { ...metadata.personalization.targetAudience, experienceLevels }
                          }
                        });
                      }}
                      className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-300 capitalize">{level}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Adaptive Parameters */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Adaptive Parameters</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={metadata.personalization.adaptiveParameters.difficultyScaling}
                  onChange={(e) => updateMetadata({
                    personalization: {
                      ...metadata.personalization,
                      adaptiveParameters: {
                        ...metadata.personalization.adaptiveParameters,
                        difficultyScaling: e.target.checked
                      }
                    }
                  })}
                  className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-300">Enable difficulty scaling</span>
              </label>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={metadata.personalization.adaptiveParameters.durationFlexibility}
                  onChange={(e) => updateMetadata({
                    personalization: {
                      ...metadata.personalization,
                      adaptiveParameters: {
                        ...metadata.personalization.adaptiveParameters,
                        durationFlexibility: e.target.checked
                      }
                    }
                  })}
                  className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-300">Allow duration flexibility</span>
              </label>
            </div>

            <div>
              <span className="block text-sm font-medium text-gray-300 mb-2">Progression Speed</span>
              <select
                value={metadata.personalization.adaptiveParameters.progressionSpeed}
                onChange={(e) => updateMetadata({
                  personalization: {
                    ...metadata.personalization,
                    adaptiveParameters: {
                      ...metadata.personalization.adaptiveParameters,
                      progressionSpeed: e.target.value as any
                    }
                  }
                })}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="slow">Slow</option>
                <option value="medium">Medium</option>
                <option value="fast">Fast</option>
                <option value="adaptive">Adaptive</option>
              </select>
            </div>
          </div>
        </div>

        {/* Recommendation Tags */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Recommendation Tags</h3>
          <div className="flex flex-wrap gap-2 mb-4">
            {metadata.personalization.recommendationTags.map((tag, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-blue-600 text-white rounded-full text-sm flex items-center space-x-2"
              >
                <span>{tag}</span>
                <button
                  onClick={() => {
                    const tags = metadata.personalization.recommendationTags.filter((_, i) => i !== index);
                    updateMetadata({
                      personalization: { ...metadata.personalization, recommendationTags: tags }
                    });
                  }}
                  className="text-blue-200 hover:text-white"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="text"
              placeholder="Add recommendation tag..."
              className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  const tag = e.currentTarget.value.trim();
                  if (tag && !metadata.personalization.recommendationTags.includes(tag)) {
                    updateMetadata({
                      personalization: {
                        ...metadata.personalization,
                        recommendationTags: [...metadata.personalization.recommendationTags, tag]
                      }
                    });
                    e.currentTarget.value = '';
                  }
                }
              }}
            />
            <button className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderOptimizationsTab = () => {
    if (!metadata) return null;

    return (
      <div className="space-y-6">
        {/* Optimization Summary */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Optimization Opportunities</h3>
            <button
              onClick={() => setShowOptimizationModal(true)}
              className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Optimization</span>
            </button>
          </div>

          {metadata.optimizations.length === 0 ? (
            <div className="text-center py-8">
              <TrendingUp className="w-12 h-12 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400 mb-4">No optimization suggestions yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {metadata.optimizations.map((optimization) => (
                <div key={optimization.id} className="bg-gray-700 border border-gray-600 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getOptimizationPriorityColor(optimization.priority)}`}>
                          {optimization.priority}
                        </span>
                        <span className="text-xs text-gray-400 uppercase">{optimization.type}</span>
                        <span className={`text-xs px-2 py-1 rounded ${
                          optimization.status === 'completed' ? 'bg-green-900 text-green-400' :
                          optimization.status === 'in_progress' ? 'bg-yellow-900 text-yellow-400' :
                          optimization.status === 'dismissed' ? 'bg-red-900 text-red-400' :
                          'bg-gray-900 text-gray-400'
                        }`}>
                          {optimization.status.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-sm text-gray-300 mb-2">{optimization.description}</p>
                      <div className="flex items-center space-x-4 text-xs text-gray-400">
                        <span>Effort: {optimization.implementationEffort}</span>
                        <span>Impact: {optimization.expectedImpact}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => updateOptimization(optimization.id, { 
                          status: optimization.status === 'completed' ? 'pending' : 'completed' 
                        })}
                        className="p-1 text-gray-400 hover:text-green-400"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => removeOptimization(optimization.id)}
                        className="p-1 text-gray-400 hover:text-red-400"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Optimization Modal */}
        {showOptimizationModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 max-w-2xl w-full mx-4">
              <h3 className="text-lg font-semibold text-white mb-4">Add Optimization</h3>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  addOptimization({
                    type: formData.get('type') as any,
                    priority: formData.get('priority') as any,
                    description: formData.get('description') as string,
                    implementationEffort: formData.get('effort') as any,
                    expectedImpact: formData.get('impact') as any,
                    status: 'pending'
                  });
                }}
                className="space-y-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="block text-sm font-medium text-gray-300 mb-2">Type</span>
                    <select
                      name="type"
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="content">Content</option>
                      <option value="technical">Technical</option>
                      <option value="ux">User Experience</option>
                      <option value="personalization">Personalization</option>
                    </select>
                  </div>
                  <div>
                    <span className="block text-sm font-medium text-gray-300 mb-2">Priority</span>
                    <select
                      name="priority"
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <span className="block text-sm font-medium text-gray-300 mb-2">Description</span>
                  <textarea
                    name="description"
                    rows={3}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Describe the optimization opportunity..."
                    required
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="block text-sm font-medium text-gray-300 mb-2">Implementation Effort</span>
                    <select
                      name="effort"
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                  <div>
                    <span className="block text-sm font-medium text-gray-300 mb-2">Expected Impact</span>
                    <select
                      name="impact"
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 pt-4">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Add Optimization
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowOptimizationModal(false)}
                    className="px-4 py-2 bg-gray-600 text-gray-300 rounded-lg hover:bg-gray-500 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderTabs = () => {
    const tabs = [
      { id: 'effectiveness', label: 'Effectiveness', icon: <BarChart3 className="w-4 h-4" /> },
      { id: 'personalization', label: 'Personalization', icon: <Target className="w-4 h-4" /> },
      { id: 'recommendations', label: 'Recommendations', icon: <Star className="w-4 h-4" /> },
      { id: 'analytics', label: 'Analytics', icon: <LineChart className="w-4 h-4" /> },
      { id: 'optimizations', label: 'Optimizations', icon: <TrendingUp className="w-4 h-4" /> }
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

  if (!practiceId) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <button
            onClick={() => onNavigate('practice-list')}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">Practice Metadata Manager</h1>
            <p className="text-gray-400">Select a practice to view and manage its metadata</p>
          </div>
        </div>

        {/* Practice Selection */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Select Practice</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {practices.map(practice => (
              <button
                key={practice.id}
                onClick={() => onNavigate('practice-metadata', practice.id)}
                className="bg-gray-700 border border-gray-600 rounded-lg p-4 hover:border-blue-500 transition-colors text-left"
              >
                <div className="flex items-center space-x-3 mb-2">
                  {getPracticeTypeIcon(practice.type)}
                  <h4 className="font-medium text-white">{practice.title}</h4>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(practice.difficulty)}`}>
                    {practice.difficulty}
                  </span>
                </div>
                <p className="text-sm text-gray-400 mb-2">{practice.category}</p>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{practice.instructor}</span>
                  <span>{practice.duration}m</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!selectedPractice || !metadata) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading metadata...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => onNavigate('practice-metadata')}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center space-x-3 mb-1">
              {getPracticeTypeIcon(selectedPractice.type)}
              <h1 className="text-2xl font-bold text-white">{selectedPractice.title}</h1>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(selectedPractice.difficulty)}`}>
                {selectedPractice.difficulty}
              </span>
            </div>
            <p className="text-gray-400">Metadata Management & Analytics</p>
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
          
          <button className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors flex items-center space-x-2">
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
          
          <button
            onClick={() => {
              setIsSaving(true);
              setTimeout(() => setIsSaving(false), 1000);
            }}
            disabled={isSaving}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving...' : 'Save Metadata'}</span>
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      {renderTabs()}

      {/* Content */}
      <div>
        {activeTab === 'effectiveness' && renderEffectivenessTab()}
        {activeTab === 'personalization' && renderPersonalizationTab()}
        {activeTab === 'optimizations' && renderOptimizationsTab()}
        {(activeTab === 'recommendations' || activeTab === 'analytics') && (
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-12 text-center">
            <Settings className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-300 mb-2">Coming Soon</h3>
            <p className="text-gray-400 max-w-md mx-auto">
              {activeTab === 'recommendations' 
                ? 'Advanced recommendation engine configuration will be available in the next release.'
                : 'Comprehensive analytics dashboard is under development.'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};