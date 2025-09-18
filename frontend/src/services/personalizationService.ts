// Personalization Engine Service
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export interface UserAssessment {
  id: string;
  type: 'mental-health' | 'stress-level' | 'sleep-quality' | 'anxiety-level' | 'lifestyle';
  scores: {
    anxiety?: number;
    depression?: number;
    stress?: number;
    sleep?: number;
    socialSupport?: number;
    copingSkills?: number;
  };
  preferences: {
    preferredApproach: 'western' | 'eastern' | 'hybrid' | 'any';
    sessionLength: 'short' | 'medium' | 'long' | 'any';
    contentTypes: string[];
    timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night' | 'any';
    goals: string[];
  };
  severity: 'mild' | 'moderate' | 'severe';
  riskLevel: 'low' | 'medium' | 'high';
  completedAt: string;
  isActive: boolean;
}

export interface PersonalizationProfile {
  userId: string;
  assessments: UserAssessment[];
  currentNeeds: string[];
  learningPath: LearningPath;
  contentPreferences: ContentPreferences;
  practicePreferences: PracticePreferences;
  progressGoals: ProgressGoals;
  personalizedRecommendations: PersonalizedRecommendation[];
  lastUpdated: string;
}

export interface LearningPath {
  id: string;
  title: string;
  description: string;
  phases: LearningPhase[];
  estimatedDuration: string;
  difficultyProgression: string[];
  currentPhase: number;
  completionPercentage: number;
}

export interface LearningPhase {
  id: string;
  title: string;
  description: string;
  duration: string;
  objectives: string[];
  requiredContent: string[];
  requiredPractices: string[];
  isCompleted: boolean;
  order: number;
}

export interface ContentPreferences {
  preferredFormats: string[];
  preferredDuration: number[];
  preferredCategories: string[];
  avoidedTopics: string[];
  readingLevel: 'basic' | 'intermediate' | 'advanced';
  visualPreference: boolean;
  audioPreference: boolean;
}

export interface PracticePreferences {
  preferredTypes: string[];
  preferredDuration: number[];
  preferredInstructors: string[];
  backgroundMusicPreference: boolean;
  guidedVsSilent: 'guided' | 'silent' | 'both';
  difficultyPreference: 'gradual' | 'consistent' | 'challenging';
}

export interface ProgressGoals {
  dailySessionTarget: number;
  weeklySessionTarget: number;
  monthlyGoals: string[];
  targetCategories: string[];
  skillDevelopmentFocus: string[];
  streakGoal: number;
}

export interface PersonalizedRecommendation {
  id: string;
  type: 'content' | 'practice' | 'learning-path' | 'goal-adjustment';
  itemId: string;
  title: string;
  description: string;
  reasoning: string;
  priority: 'high' | 'medium' | 'low';
  category: string;
  confidenceScore: number;
  estimatedBenefit: string;
  recommendedAt: string;
  expiresAt?: string;
  interactionHistory: RecommendationInteraction[];
}

export interface RecommendationInteraction {
  type: 'viewed' | 'clicked' | 'completed' | 'dismissed' | 'bookmarked' | 'rated';
  timestamp: string;
  value?: number; // for ratings
}

export interface PersonalizationFilters {
  includeAssessmentBased?: boolean;
  includeBehaviorBased?: boolean;
  includeProgressBased?: boolean;
  maxRecommendations?: number;
  categories?: string[];
  contentTypes?: string[];
  practiceTypes?: string[];
  difficultyRange?: string[];
  durationRange?: number[];
  refreshRecommendations?: boolean;
}

export interface PersonalizationResponse {
  success: boolean;
  data: {
    profile: PersonalizationProfile;
    recommendations: PersonalizedRecommendation[];
    learningPath: LearningPath;
    nextActions: string[];
  };
}

export interface AssessmentBasedFilters {
  anxiety?: number;
  depression?: number;
  stress?: number;
  sleep?: number;
  severity?: string;
  approach?: string;
  riskLevel?: string;
}

class PersonalizationService {
  private getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  }

  // Get user's personalization profile
  async getPersonalizationProfile(): Promise<PersonalizationResponse> {
    const response = await fetch(`${API_BASE_URL}/personalization/profile`, {
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch personalization profile: ${response.statusText}`);
    }

    return response.json();
  }

  // Update user assessment data
  async updateAssessment(assessment: Partial<UserAssessment>): Promise<{ success: boolean; profile: PersonalizationProfile }> {
    const response = await fetch(`${API_BASE_URL}/personalization/assessment`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(assessment)
    });

    if (!response.ok) {
      throw new Error(`Failed to update assessment: ${response.statusText}`);
    }

    return response.json();
  }

  // Get personalized content recommendations
  async getPersonalizedContent(filters: PersonalizationFilters = {}): Promise<{
    success: boolean;
    data: {
      recommendations: PersonalizedRecommendation[];
      appliedFilters: AssessmentBasedFilters;
      reasoning: string[];
    };
  }> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          params.append(key, value.join(','));
        } else {
          params.append(key, value.toString());
        }
      }
    });

    const response = await fetch(`${API_BASE_URL}/personalization/content?${params.toString()}`, {
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch personalized content: ${response.statusText}`);
    }

    return response.json();
  }

  // Get personalized practice recommendations
  async getPersonalizedPractices(filters: PersonalizationFilters = {}): Promise<{
    success: boolean;
    data: {
      recommendations: PersonalizedRecommendation[];
      appliedFilters: AssessmentBasedFilters;
      reasoning: string[];
    };
  }> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          params.append(key, value.join(','));
        } else {
          params.append(key, value.toString());
        }
      }
    });

    const response = await fetch(`${API_BASE_URL}/personalization/practices?${params.toString()}`, {
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch personalized practices: ${response.statusText}`);
    }

    return response.json();
  }

  // Get learning path recommendations
  async getLearningPathRecommendations(): Promise<{
    success: boolean;
    data: {
      currentPath: LearningPath;
      alternativePaths: LearningPath[];
      nextSteps: string[];
    };
  }> {
    const response = await fetch(`${API_BASE_URL}/personalization/learning-path`, {
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch learning path: ${response.statusText}`);
    }

    return response.json();
  }

  // Track recommendation interaction
  async trackRecommendationInteraction(
    recommendationId: string,
    interaction: Omit<RecommendationInteraction, 'timestamp'>
  ): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${API_BASE_URL}/personalization/interaction`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({
        recommendationId,
        ...interaction,
        timestamp: new Date().toISOString()
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to track interaction: ${response.statusText}`);
    }

    return response.json();
  }

  // Update user preferences
  async updatePreferences(preferences: {
    contentPreferences?: Partial<ContentPreferences>;
    practicePreferences?: Partial<PracticePreferences>;
    progressGoals?: Partial<ProgressGoals>;
  }): Promise<{ success: boolean; profile: PersonalizationProfile }> {
    const response = await fetch(`${API_BASE_URL}/personalization/preferences`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(preferences)
    });

    if (!response.ok) {
      throw new Error(`Failed to update preferences: ${response.statusText}`);
    }

    return response.json();
  }

  // Generate assessment-based filters for content/practice queries
  generateAssessmentFilters(profile: PersonalizationProfile): AssessmentBasedFilters {
    const latestAssessment = profile.assessments
      .filter(a => a.isActive)
      .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())[0];

    if (!latestAssessment) {
      return {};
    }

    return {
      anxiety: latestAssessment.scores.anxiety,
      depression: latestAssessment.scores.depression,
      stress: latestAssessment.scores.stress,
      sleep: latestAssessment.scores.sleep,
      severity: latestAssessment.severity,
      approach: latestAssessment.preferences.preferredApproach,
      riskLevel: latestAssessment.riskLevel
    };
  }

  // Smart content filtering based on user profile
  async getSmartFilteredContent(baseFilters: Record<string, unknown> = {}): Promise<Record<string, unknown>> {
    try {
      const profile = await this.getPersonalizationProfile();
      const assessmentFilters = this.generateAssessmentFilters(profile.data.profile);
      
      // Merge base filters with personalized filters
      const enhancedFilters = {
        ...baseFilters,
        approach: assessmentFilters.approach !== 'any' ? assessmentFilters.approach : baseFilters.approach,
        severity: assessmentFilters.severity,
        difficulty: this.getDifficultyRecommendation(profile.data.profile),
        categories: this.getRecommendedCategories(profile.data.profile)
      };

      return enhancedFilters;
    } catch (error) {
      console.error('Failed to apply smart filtering:', error);
      return baseFilters;
    }
  }

  // Get difficulty recommendation based on user progress and assessment
  private getDifficultyRecommendation(profile: PersonalizationProfile): string | undefined {
    const latestAssessment = profile.assessments
      .filter(a => a.isActive)
      .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())[0];

    if (!latestAssessment) return undefined;

    // Base difficulty on assessment severity and user experience
    if (latestAssessment.severity === 'severe' || profile.learningPath.currentPhase === 0) {
      return 'Beginner';
    } else if (profile.learningPath.completionPercentage > 60) {
      return 'Advanced';
    } else {
      return 'Intermediate';
    }
  }

  // Get recommended categories based on assessment results
  private getRecommendedCategories(profile: PersonalizationProfile): string[] {
    const latestAssessment = profile.assessments
      .filter(a => a.isActive)
      .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())[0];

    if (!latestAssessment) return [];

    const categories: string[] = [];
    const scores = latestAssessment.scores;

    // Recommend categories based on high scores (areas needing attention)
    if (scores.anxiety && scores.anxiety > 7) categories.push('anxiety');
    if (scores.depression && scores.depression > 7) categories.push('depression');
    if (scores.stress && scores.stress > 7) categories.push('stress');
    if (scores.sleep && scores.sleep < 4) categories.push('sleep');

    // Always include mindfulness for holistic approach
    categories.push('mindfulness');

    return categories;
  }

  // Refresh recommendations based on recent activity
  async refreshRecommendations(): Promise<PersonalizedRecommendation[]> {
    const response = await fetch(`${API_BASE_URL}/personalization/refresh`, {
      method: 'POST',
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error(`Failed to refresh recommendations: ${response.statusText}`);
    }

    const result = await response.json();
    return result.data.recommendations;
  }
}

export const personalizationService = new PersonalizationService();
export default personalizationService;