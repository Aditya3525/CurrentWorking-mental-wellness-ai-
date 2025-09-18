import { 
  Brain, 
  Target, 
  Lightbulb, 
  Star,
  Eye,
  ThumbsUp,
  ThumbsDown,
  X,
  RefreshCw,
  BarChart3
} from 'lucide-react';
import React, { useState, useEffect } from 'react';

import { 
  PersonalizedRecommendation, 
  PersonalizationProfile,
  LearningPath,
  default as personalizationService
} from '../../../services/personalizationService';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { Card } from '../../ui/card';
import { Progress } from '../../ui/progress';

interface PersonalizedRecommendationsProps {
  variant?: 'sidebar' | 'dashboard' | 'full';
  maxRecommendations?: number;
  showLearningPath?: boolean;
  showFilters?: boolean;
  onRecommendationClick?: (recommendation: PersonalizedRecommendation) => void;
}

export const PersonalizedRecommendations: React.FC<PersonalizedRecommendationsProps> = ({
  variant = 'dashboard',
  maxRecommendations = 6,
  showLearningPath = true,
  showFilters = true,
  onRecommendationClick
}) => {
  const [profile, setProfile] = useState<PersonalizationProfile | null>(null);
  const [recommendations, setRecommendations] = useState<PersonalizedRecommendation[]>([]);
  const [learningPath, setLearningPath] = useState<LearningPath | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filters, setFilters] = useState({
    type: 'all' as 'all' | 'content' | 'practice' | 'learning-path',
    priority: 'all' as 'all' | 'high' | 'medium' | 'low'
  });

  useEffect(() => {
    const loadPersonalizationData = async () => {
      try {
        setLoading(true);
        const [profileResponse, contentRecs, practiceRecs, learningPathData] = await Promise.all([
          personalizationService.getPersonalizationProfile(),
          personalizationService.getPersonalizedContent({ maxRecommendations: maxRecommendations / 2 }),
          personalizationService.getPersonalizedPractices({ maxRecommendations: maxRecommendations / 2 }),
          showLearningPath ? personalizationService.getLearningPathRecommendations() : null
        ]);

        setProfile(profileResponse.data.profile);
        
        // Combine content and practice recommendations
        const allRecommendations = [
          ...contentRecs.data.recommendations,
          ...practiceRecs.data.recommendations
        ].sort((a, b) => {
          // Sort by priority and confidence score
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
          if (priorityDiff !== 0) return priorityDiff;
          return b.confidenceScore - a.confidenceScore;
        });

        setRecommendations(allRecommendations.slice(0, maxRecommendations));
        
        if (learningPathData) {
          setLearningPath(learningPathData.data.currentPath);
        }
      } catch (error) {
        console.error('Failed to load personalization data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPersonalizationData();
  }, [maxRecommendations, showLearningPath]);

  const handleRefreshRecommendations = async () => {
    try {
      setRefreshing(true);
      const newRecommendations = await personalizationService.refreshRecommendations();
      setRecommendations(newRecommendations.slice(0, maxRecommendations));
    } catch (error) {
      console.error('Failed to refresh recommendations:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleRecommendationInteraction = async (
    recommendation: PersonalizedRecommendation,
    type: 'viewed' | 'clicked' | 'dismissed' | 'completed' | 'bookmarked'
  ) => {
    try {
      await personalizationService.trackRecommendationInteraction(recommendation.id, { type });
      
      if (type === 'dismissed') {
        setRecommendations(prev => prev.filter(r => r.id !== recommendation.id));
      } else if (type === 'clicked' && onRecommendationClick) {
        onRecommendationClick(recommendation);
      }
    } catch (error) {
      console.error('Failed to track interaction:', error);
    }
  };

  const filteredRecommendations = recommendations.filter(rec => {
    if (filters.type !== 'all' && rec.type !== filters.type) return false;
    if (filters.priority !== 'all' && rec.priority !== filters.priority) return false;
    return true;
  });

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Assessment Insights */}
      {profile && variant !== 'sidebar' && (
        <Card className="p-6">
          <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Your Assessment Insights
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {profile.assessments?.length || 0}
              </div>
              <div className="text-sm text-gray-600">Assessments Completed</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {profile.currentNeeds?.length || 0}
              </div>
              <div className="text-sm text-gray-600">Current Focus Areas</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {profile.contentPreferences ? 1 : 0}
              </div>
              <div className="text-sm text-gray-600">Preferences Set</div>
            </div>
          </div>
          
          {profile.currentNeeds && profile.currentNeeds.length > 0 && (
            <div className="mt-4">
              <div className="text-sm font-medium mb-2">Current Focus Areas:</div>
              <div className="flex flex-wrap gap-2">
                {profile.currentNeeds.map((area, index) => (
                  <Badge key={index} variant="secondary">{area}</Badge>
                ))}
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Learning Path Progress */}
      {learningPath && showLearningPath && (
        <Card className="p-6">
          <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <Target className="w-5 h-5" />
            Your Learning Path: {learningPath.title}
          </h3>
          
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Progress</span>
                <span>{learningPath.completionPercentage}%</span>
              </div>
              <Progress value={learningPath.completionPercentage} className="h-2" />
            </div>
            
            <div className="text-sm text-gray-600">
              <strong>Current Phase:</strong> {learningPath.phases[learningPath.currentPhase]?.title || 'Getting Started'}
            </div>
            
            {learningPath.estimatedDuration && (
              <div className="text-sm text-gray-600">
                <strong>Estimated Duration:</strong> {learningPath.estimatedDuration}
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Recommendations */}
      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <Lightbulb className="w-5 h-5" />
            Personalized Recommendations
          </h3>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshRecommendations}
            disabled={refreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Filters */}
        {showFilters && variant !== 'sidebar' && (
          <div className="flex gap-4 mb-6">
            <div>
              <label htmlFor="type-filter" className="block text-sm font-medium mb-1">Type</label>
              <select
                id="type-filter"
                value={filters.type}
                onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value as typeof filters.type }))}
                className="border rounded px-3 py-1 text-sm"
              >
                <option value="all">All Types</option>
                <option value="content">Content</option>
                <option value="practice">Practice</option>
                <option value="learning-path">Learning Path</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="priority-filter" className="block text-sm font-medium mb-1">Priority</label>
              <select
                id="priority-filter"
                value={filters.priority}
                onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value as typeof filters.priority }))}
                className="border rounded px-3 py-1 text-sm"
              >
                <option value="all">All Priorities</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>
        )}

        {/* Recommendations Grid */}
        <div className={`grid gap-4 ${
          variant === 'sidebar' ? 'grid-cols-1' : 
          variant === 'dashboard' ? 'grid-cols-1 md:grid-cols-2' : 
          'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
        }`}>
          {filteredRecommendations.map((recommendation) => (
            <Card
              key={recommendation.id}
              className="p-4 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handleRecommendationInteraction(recommendation, 'clicked')}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <h4 className="font-medium text-sm leading-tight">
                    {recommendation.title}
                  </h4>
                  
                  <div className="flex items-center gap-1 ml-2">
                    <Star className="w-3 h-3 text-yellow-500 fill-current" />
                    <span className="text-xs text-gray-600">
                      {recommendation.confidenceScore.toFixed(1)}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-gray-600 line-clamp-2">
                  {recommendation.reasoning}
                </p>

                <div className="flex items-center justify-between">
                  <Badge
                    variant={
                      recommendation.priority === 'high' ? 'destructive' :
                      recommendation.priority === 'medium' ? 'default' : 'secondary'
                    }
                    className="text-xs"
                  >
                    {recommendation.priority}
                  </Badge>
                  
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRecommendationInteraction(recommendation, 'bookmarked');
                      }}
                    >
                      <ThumbsUp className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRecommendationInteraction(recommendation, 'dismissed');
                      }}
                    >
                      <ThumbsDown className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRecommendationInteraction(recommendation, 'dismissed');
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {recommendation.estimatedBenefit && (
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Eye className="w-3 h-3" />
                    <span>{recommendation.estimatedBenefit}</span>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>

        {filteredRecommendations.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Brain className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No recommendations found matching your filters.</p>
            <p className="text-sm">Try adjusting your filters or complete more assessments.</p>
          </div>
        )}
      </Card>
    </div>
  );
};