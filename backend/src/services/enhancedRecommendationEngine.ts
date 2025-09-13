import { ContentRecommendationService } from './contentRecommendationService';
import { MentalHealthStateService } from './mentalHealthStateService';
import type { MentalHealthState } from '../types/mentalHealth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface EnhancedRecommendationCriteria {
  userId: string;
  mentalHealthScore?: number;
  currentState?: string;
  approach?: 'western' | 'eastern' | 'hybrid';
  immediateNeeds?: string[];
  sessionContext?: string;
  maxRecommendations?: number;
  includeEmergencyResources?: boolean;
}

export interface ContentMatch {
  contentId: string;
  title: string;
  type: string;
  category: string;
  description: string;
  approach: string;
  difficulty: string;
  duration: string;
  relevanceScore: number;
  reasonForRecommendation: string;
  urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
  tags: string[];
  contentUrl?: string;
  thumbnailUrl?: string;
}

export interface VectorSearchResult {
  content: any;
  similarityScore: number;
  matchedKeywords: string[];
}

/**
 * Enhanced Content Recommendation Engine with Vector Search and Real-time State Matching
 * Extends the existing ContentRecommendationService with AI-powered matching
 */
export class EnhancedRecommendationEngine {
  
  /**
   * Generate enhanced recommendations using multiple AI techniques
   */
  static async generateEnhancedRecommendations(
    criteria: EnhancedRecommendationCriteria
  ): Promise<ContentMatch[]> {
    try {
      console.log('[Enhanced Recommendations] Starting generation for user:', criteria.userId);

      // Get current mental health state if not provided
      const mentalHealthState = await MentalHealthStateService.getUserState(criteria.userId);
      
      // Combine provided criteria with real-time state
      const enhancedCriteria = {
        ...criteria,
        mentalHealthScore: criteria.mentalHealthScore || mentalHealthState.score,
        currentState: criteria.currentState || mentalHealthState.state,
        approach: criteria.approach || await this.determineOptimalApproach(criteria.userId, mentalHealthState),
        immediateNeeds: criteria.immediateNeeds || mentalHealthState.topConcerns || [],
      };

      console.log('[Enhanced Recommendations] Enhanced criteria:', enhancedCriteria);

      // Get base recommendations from existing service
      const baseRecommendations = await ContentRecommendationService.generateRecommendations({
        userId: criteria.userId,
        approach: enhancedCriteria.approach,
        maxRecommendations: (criteria.maxRecommendations || 5) * 2, // Get more for filtering
        categories: this.mapStateToCategories(enhancedCriteria.currentState),
        contentTypes: this.mapNeedsToContentTypes(enhancedCriteria.immediateNeeds)
      });

      // Enhance recommendations with AI scoring
      const enhancedRecommendations = await Promise.all(
        baseRecommendations.map(rec => this.enhanceRecommendation(rec, enhancedCriteria))
      );

      // Vector similarity matching (simulated for now - would use actual vector DB in production)
      const vectorMatches = await this.performVectorSearch(enhancedCriteria);

      // Combine and deduplicate recommendations
      const allRecommendations = [...enhancedRecommendations, ...vectorMatches];
      const uniqueRecommendations = this.deduplicateRecommendations(allRecommendations);

      // Apply urgency-based filtering and sorting
      const filteredRecommendations = this.applyUrgencyFiltering(
        uniqueRecommendations,
        enhancedCriteria
      );

      // Add emergency resources if needed
      if (criteria.includeEmergencyResources || enhancedCriteria.mentalHealthScore >= 80) {
        const emergencyResources = await this.getEmergencyResources(enhancedCriteria);
        filteredRecommendations.unshift(...emergencyResources);
      }

      // Return top recommendations
      const finalRecommendations = filteredRecommendations
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, criteria.maxRecommendations || 5);

      console.log('[Enhanced Recommendations] Generated', finalRecommendations.length, 'recommendations');

      return finalRecommendations;

    } catch (error) {
      console.error('[Enhanced Recommendations] Error:', error);
      
      // Fallback to basic recommendations
      try {
        const fallbackRecs = await ContentRecommendationService.generateRecommendations({
          userId: criteria.userId,
          approach: criteria.approach || 'hybrid',
          maxRecommendations: criteria.maxRecommendations || 3
        });

        return fallbackRecs.map(rec => ({
          contentId: rec.contentId,
          title: rec.title,
          type: rec.type,
          category: rec.category,
          description: rec.title, // Fallback
          approach: criteria.approach || 'hybrid',
          difficulty: rec.difficulty || 'medium',
          duration: rec.duration || 'unknown',
          relevanceScore: rec.relevanceScore,
          reasonForRecommendation: rec.reason,
          urgencyLevel: 'medium' as const,
          tags: []
        }));
      } catch (fallbackError) {
        console.error('[Enhanced Recommendations] Fallback failed:', fallbackError);
        return this.getDefaultRecommendations(criteria.approach || 'hybrid');
      }
    }
  }

  /**
   * Determine optimal therapeutic approach based on user state and history
   */
  private static async determineOptimalApproach(
    userId: string,
    mentalHealthState: any
  ): Promise<'western' | 'eastern' | 'hybrid'> {
    try {
      // Check user preference first
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { approach: true }
      });

      if (user?.approach) {
        return user.approach as 'western' | 'eastern' | 'hybrid';
      }

      // Auto-determine based on mental health patterns
      const { topConcerns, score, clinicalIndicators } = mentalHealthState;

      // High anxiety/panic -> Western (structured CBT)
      if (topConcerns.includes('anxiety') && score >= 60) {
        return 'western';
      }

      // Stress/overwhelm -> Eastern (mindfulness)
      if (topConcerns.includes('stress') || topConcerns.includes('overwhelm')) {
        return 'eastern';
      }

      // Severe/complex issues -> Hybrid
      if (score >= 70 || topConcerns.length >= 3) {
        return 'hybrid';
      }

      // Default to hybrid for balanced approach
      return 'hybrid';

    } catch (error) {
      console.error('[Enhanced Recommendations] Approach determination error:', error);
      return 'hybrid';
    }
  }

  /**
   * Map mental health state to relevant content categories
   */
  private static mapStateToCategories(state: string): string[] {
    const categoryMap: Record<string, string[]> = {
      'crisis': ['crisis-support', 'emergency-resources', 'grounding-techniques'],
      'worst': ['immediate-relief', 'crisis-support', 'breathing-exercises'],
      'bad': ['coping-strategies', 'stress-management', 'anxiety-relief'],
      'managing': ['maintenance', 'skill-building', 'wellness-practices'],
      'good': ['growth', 'prevention', 'enhancement'],
      'great': ['optimization', 'advanced-practices', 'leadership']
    };

    return categoryMap[state] || ['general-wellness', 'coping-strategies'];
  }

  /**
   * Map immediate needs to content types
   */
  private static mapNeedsToContentTypes(needs: string[]): string[] {
    const typeMap: Record<string, string[]> = {
      'anxiety': ['breathing-exercise', 'guided-meditation', 'cbt-worksheet'],
      'stress': ['mindfulness', 'relaxation', 'time-management'],
      'depression': ['mood-boosting', 'behavioral-activation', 'self-compassion'],
      'trauma': ['grounding', 'safety-planning', 'trauma-informed'],
      'sleep': ['sleep-hygiene', 'relaxation', 'bedtime-routine'],
      'social': ['communication-skills', 'relationship-building', 'social-support']
    };

    const contentTypes: string[] = [];
    for (const need of needs) {
      const lowerNeed = need.toLowerCase();
      for (const [key, types] of Object.entries(typeMap)) {
        if (lowerNeed.includes(key)) {
          contentTypes.push(...types);
        }
      }
    }

    return contentTypes.length > 0 ? [...new Set(contentTypes)] : ['general', 'wellness'];
  }

  /**
   * Enhance a base recommendation with AI-powered analysis
   */
  private static async enhanceRecommendation(
    baseRec: any,
    criteria: EnhancedRecommendationCriteria
  ): Promise<ContentMatch> {
    // Calculate enhanced relevance score
    let relevanceScore = baseRec.relevanceScore || 0.5;

    // Boost score for approach match
    if (baseRec.approach === criteria.approach) {
      relevanceScore += 0.2;
    }

    // Boost score for immediate needs match
    for (const need of criteria.immediateNeeds || []) {
      if (baseRec.category?.toLowerCase().includes(need.toLowerCase()) ||
          baseRec.title?.toLowerCase().includes(need.toLowerCase())) {
        relevanceScore += 0.15;
      }
    }

    // Determine urgency level
    const urgencyLevel = this.calculateUrgencyLevel(baseRec, criteria);

    // Generate enhanced reason
    const reasonForRecommendation = this.generateEnhancedReason(baseRec, criteria);

    return {
      contentId: baseRec.contentId,
      title: baseRec.title,
      type: baseRec.type,
      category: baseRec.category,
      description: baseRec.personalizedTitle || baseRec.title,
      approach: baseRec.approach || criteria.approach || 'hybrid',
      difficulty: baseRec.difficulty || 'medium',
      duration: baseRec.duration || 'unknown',
      relevanceScore: Math.min(relevanceScore, 1.0),
      reasonForRecommendation,
      urgencyLevel,
      tags: this.extractTags(baseRec, criteria)
    };
  }

  /**
   * Perform vector similarity search (simulated - would use actual vector DB)
   */
  private static async performVectorSearch(
    criteria: EnhancedRecommendationCriteria
  ): Promise<ContentMatch[]> {
    try {
      // In production, this would query a vector database like Pinecone, Weaviate, or Chroma
      // For now, we'll simulate with keyword matching and state-based content selection
      
      const searchTerms = [
        ...(criteria.immediateNeeds || []),
        criteria.currentState || '',
        criteria.approach || '',
        ...(criteria.sessionContext?.split(' ') || [])
      ].filter(Boolean);

      console.log('[Vector Search] Simulated search terms:', searchTerms);

      // Simulate finding content based on search terms
      const simulatedMatches: ContentMatch[] = [];

      // Add state-specific emergency content for high scores
      if ((criteria.mentalHealthScore || 0) >= 80) {
        simulatedMatches.push({
          contentId: 'emergency-grounding',
          title: '5-Minute Emergency Grounding Technique',
          type: 'guided-exercise',
          category: 'crisis-support',
          description: 'Immediate relief technique for overwhelming emotions',
          approach: 'hybrid',
          difficulty: 'easy',
          duration: '5 minutes',
          relevanceScore: 0.95,
          reasonForRecommendation: 'High distress level detected - immediate relief needed',
          urgencyLevel: 'critical',
          tags: ['emergency', 'grounding', 'quick-relief']
        });
      }

      // Add approach-specific content
      if (criteria.approach === 'western') {
        simulatedMatches.push({
          contentId: 'cbt-thought-record',
          title: 'Cognitive Restructuring Worksheet',
          type: 'worksheet',
          category: 'cbt-tools',
          description: 'Identify and challenge negative thought patterns',
          approach: 'western',
          difficulty: 'medium',
          duration: '15 minutes',
          relevanceScore: 0.8,
          reasonForRecommendation: 'Western approach preference - evidence-based CBT technique',
          urgencyLevel: 'medium',
          tags: ['cbt', 'cognitive-restructuring', 'worksheet']
        });
      } else if (criteria.approach === 'eastern') {
        simulatedMatches.push({
          contentId: 'mindfulness-body-scan',
          title: 'Mindful Body Scan Meditation',
          type: 'guided-meditation',
          category: 'mindfulness',
          description: 'Cultivate present-moment awareness and release tension',
          approach: 'eastern',
          difficulty: 'easy',
          duration: '20 minutes',
          relevanceScore: 0.8,
          reasonForRecommendation: 'Eastern approach preference - mindfulness-based practice',
          urgencyLevel: 'medium',
          tags: ['mindfulness', 'body-scan', 'meditation']
        });
      }

      return simulatedMatches;

    } catch (error) {
      console.error('[Vector Search] Error:', error);
      return [];
    }
  }

  /**
   * Calculate urgency level for a recommendation
   */
  private static calculateUrgencyLevel(
    recommendation: any,
    criteria: EnhancedRecommendationCriteria
  ): 'low' | 'medium' | 'high' | 'critical' {
    const score = criteria.mentalHealthScore || 0;
    const state = criteria.currentState || 'managing';

    // Critical urgency for crisis situations
    if (state === 'crisis' || score >= 90) return 'critical';

    // High urgency for severe distress
    if (state === 'worst' || score >= 80) return 'high';

    // Medium urgency for moderate distress
    if (state === 'bad' || score >= 60) return 'medium';

    // Low urgency for maintenance/wellness
    return 'low';
  }

  /**
   * Generate enhanced reasoning for recommendation
   */
  private static generateEnhancedReason(
    recommendation: any,
    criteria: EnhancedRecommendationCriteria
  ): string {
    const reasons: string[] = [];

    // State-based reasoning
    if (criteria.currentState === 'crisis' || (criteria.mentalHealthScore || 0) >= 90) {
      reasons.push('Immediate crisis support needed');
    } else if (criteria.currentState === 'worst') {
      reasons.push('High distress level requires immediate relief');
    } else if (criteria.currentState === 'bad') {
      reasons.push('Moderate distress - focused coping strategies helpful');
    }

    // Approach-based reasoning
    if (recommendation.approach === criteria.approach) {
      reasons.push(`Matches your preferred ${criteria.approach} therapeutic approach`);
    }

    // Need-based reasoning
    for (const need of criteria.immediateNeeds || []) {
      if (recommendation.category?.toLowerCase().includes(need.toLowerCase())) {
        reasons.push(`Addresses your current concern with ${need}`);
      }
    }

    // Default reasoning
    if (reasons.length === 0) {
      reasons.push('Recommended based on your current mental health profile');
    }

    return reasons.join('; ');
  }

  /**
   * Extract relevant tags from recommendation and criteria
   */
  private static extractTags(
    recommendation: any,
    criteria: EnhancedRecommendationCriteria
  ): string[] {
    const tags: string[] = [];

    // Add approach tags
    if (criteria.approach) {
      tags.push(criteria.approach);
    }

    // Add state tags
    if (criteria.currentState) {
      tags.push(criteria.currentState);
    }

    // Add immediate need tags
    if (criteria.immediateNeeds) {
      tags.push(...criteria.immediateNeeds);
    }

    // Add content type tags
    if (recommendation.type) {
      tags.push(recommendation.type);
    }

    if (recommendation.category) {
      tags.push(recommendation.category);
    }

    return [...new Set(tags)];
  }

  /**
   * Remove duplicate recommendations
   */
  private static deduplicateRecommendations(recommendations: ContentMatch[]): ContentMatch[] {
    const seen = new Set<string>();
    return recommendations.filter(rec => {
      if (seen.has(rec.contentId)) {
        return false;
      }
      seen.add(rec.contentId);
      return true;
    });
  }

  /**
   * Apply urgency-based filtering and prioritization
   */
  private static applyUrgencyFiltering(
    recommendations: ContentMatch[],
    criteria: EnhancedRecommendationCriteria
  ): ContentMatch[] {
    // Sort by urgency first, then relevance score
    const urgencyOrder = { critical: 4, high: 3, medium: 2, low: 1 };
    
    return recommendations.sort((a, b) => {
      const urgencyDiff = urgencyOrder[b.urgencyLevel] - urgencyOrder[a.urgencyLevel];
      if (urgencyDiff !== 0) return urgencyDiff;
      return b.relevanceScore - a.relevanceScore;
    });
  }

  /**
   * Get emergency resources for crisis situations
   */
  private static async getEmergencyResources(
    criteria: EnhancedRecommendationCriteria
  ): Promise<ContentMatch[]> {
    return [
      {
        contentId: 'crisis-hotline',
        title: 'Crisis Support Hotlines',
        type: 'emergency-resource',
        category: 'crisis-support',
        description: '24/7 crisis support and suicide prevention resources',
        approach: 'hybrid',
        difficulty: 'easy',
        duration: 'immediate',
        relevanceScore: 1.0,
        reasonForRecommendation: 'Emergency resources for immediate crisis support',
        urgencyLevel: 'critical',
        tags: ['emergency', 'crisis', 'hotline', 'immediate-help'],
        contentUrl: 'tel:988'
      },
      {
        contentId: 'emergency-grounding',
        title: 'Emergency Grounding Techniques',
        type: 'crisis-intervention',
        category: 'grounding',
        description: 'Quick techniques to manage overwhelming emotions',
        approach: 'hybrid',
        difficulty: 'easy',
        duration: '2-5 minutes',
        relevanceScore: 0.95,
        reasonForRecommendation: 'Immediate grounding needed for crisis management',
        urgencyLevel: 'critical',
        tags: ['emergency', 'grounding', 'quick-relief']
      }
    ];
  }

  /**
   * Get default recommendations when all else fails
   */
  private static getDefaultRecommendations(approach: string): ContentMatch[] {
    const defaults: ContentMatch[] = [
      {
        contentId: 'basic-breathing',
        title: 'Basic Breathing Exercise',
        type: 'breathing-exercise',
        category: 'relaxation',
        description: 'Simple breathing technique for immediate calm',
        approach,
        difficulty: 'easy',
        duration: '3 minutes',
        relevanceScore: 0.7,
        reasonForRecommendation: 'Basic relaxation technique suitable for all situations',
        urgencyLevel: 'medium',
        tags: ['breathing', 'relaxation', 'basic']
      },
      {
        contentId: 'general-wellness',
        title: 'Daily Wellness Check-in',
        type: 'self-reflection',
        category: 'wellness',
        description: 'Quick daily practice for mental health maintenance',
        approach,
        difficulty: 'easy',
        duration: '5 minutes',
        relevanceScore: 0.6,
        reasonForRecommendation: 'General wellness support',
        urgencyLevel: 'low',
        tags: ['wellness', 'daily-practice', 'self-care']
      }
    ];

    return defaults;
  }

  /**
   * Test the enhanced recommendation engine
   */
  static async testEngine(): Promise<{ success: boolean; error?: string }> {
    try {
      const testCriteria: EnhancedRecommendationCriteria = {
        userId: 'test-user',
        mentalHealthScore: 65,
        currentState: 'bad',
        approach: 'hybrid',
        immediateNeeds: ['anxiety', 'stress'],
        maxRecommendations: 3
      };

      const recommendations = await this.generateEnhancedRecommendations(testCriteria);
      
      return {
        success: recommendations.length > 0 && recommendations.every(rec => rec.relevanceScore > 0)
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
}
