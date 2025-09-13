import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface RecommendationCriteria {
  userId: string;
  contentTypes?: string[];
  categories?: string[];
  maxRecommendations?: number;
  approach?: string;
  difficulty?: string;
}

export interface ContentRecommendation {
  contentId: string;
  title: string;
  type: string;
  category: string;
  reason: string;
  relevanceScore: number;
  priority: number;
  personalizedTitle?: string;
  estimatedBenefit: number;
  duration?: string;
  difficulty?: string;
}

export interface UserContentProfile {
  primaryConcerns: string[];
  preferredTypes: string[];
  engagementLevel: number;
  completionRate: number;
  averageRating: number;
  lastEngagement: Date | null;
}

export class ContentRecommendationService {
  /**
   * Generate personalized content recommendations for a user
   */
  static async generateRecommendations(criteria: RecommendationCriteria): Promise<ContentRecommendation[]> {
    try {
      // Get user profile and context
      const user = await prisma.user.findUnique({
        where: { id: criteria.userId },
        include: {
          assessments: {
            orderBy: { completedAt: 'desc' },
            take: 5
          },
          moodEntries: {
            orderBy: { createdAt: 'desc' },
            take: 10
          }
        }
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Build user content profile
      const userProfile = await this.buildUserContentProfile(criteria.userId);

      // Get available content
      const content = await prisma.content.findMany({
        where: {
          isPublished: true,
          ...(criteria.contentTypes && { type: { in: criteria.contentTypes } }),
          ...(criteria.categories && { category: { in: criteria.categories } }),
          ...(criteria.approach && { approach: { in: [criteria.approach, 'hybrid'] } }),
          ...(criteria.difficulty && { difficulty: criteria.difficulty })
        }
      });

      // Score and rank content
      const scoredContent = content.map(item => 
        this.scoreContentForUser(item, user, userProfile)
      );

      // Filter and sort by relevance
      const recommendations = scoredContent
        .filter(item => item.relevanceScore > 0.3) // Minimum relevance threshold
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, criteria.maxRecommendations || 10);

      // Store recommendations in database for tracking
      await this.storeRecommendations(criteria.userId, recommendations);

      return recommendations;
    } catch (error) {
      console.error('Failed to generate content recommendations:', error);
      return [];
    }
  }

  /**
   * Build comprehensive user content profile
   */
  private static async buildUserContentProfile(userId: string): Promise<UserContentProfile> {
    try {
      // For now, build basic profile from available data
      // In future, this would use ContentRecommendation table
      
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          assessments: { orderBy: { completedAt: 'desc' }, take: 10 }
        }
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Extract primary concerns from recent assessments
      const primaryConcerns = user.assessments
        .filter(a => a.score > 50) // Significant scores
        .map(a => a.assessmentType)
        .slice(0, 3); // Top 3 concerns

      return {
        primaryConcerns,
        preferredTypes: ['article', 'exercise'], // Default preferences
        engagementLevel: 0.7, // Default engagement level
        completionRate: 0.6, // Default completion rate
        averageRating: 3.5, // Default rating
        lastEngagement: null // Will be updated with actual data
      };
    } catch (error) {
      console.error('Failed to build user content profile:', error);
      return this.getDefaultProfile();
    }
  }

  /**
   * Score content item for specific user
   */
  private static scoreContentForUser(
    content: any, 
    user: any, 
    profile: UserContentProfile
  ): ContentRecommendation {
    let relevanceScore = 0;
    const reasons = [];

    // Assessment-based relevance
    const userConcerns = user.assessments
      .slice(0, 3)
      .map((a: any) => a.assessmentType);

    if (userConcerns.includes(content.category)) {
      relevanceScore += 0.4;
      reasons.push(`addresses_${content.category}_concerns`);
    }

    // Approach alignment
    if (content.approach === user.approach || content.approach === 'hybrid') {
      relevanceScore += 0.2;
      reasons.push('matches_preferred_approach');
    }

    // Content type preference
    if (profile.preferredTypes.includes(content.type)) {
      relevanceScore += 0.15;
      reasons.push('preferred_content_type');
    }

    // Difficulty appropriateness
    if (this.isDifficultyAppropriate(content.difficulty, user, profile)) {
      relevanceScore += 0.1;
      reasons.push('appropriate_difficulty_level');
    }

    // Novelty factor (avoid over-recommending same content)
    relevanceScore += Math.random() * 0.1; // Add some randomness

    // Calculate priority (1=high, 5=low)
    const priority = relevanceScore > 0.7 ? 1 : 
                    relevanceScore > 0.5 ? 2 : 
                    relevanceScore > 0.3 ? 3 : 4;

    // Generate personalized title
    const personalizedTitle = this.generatePersonalizedTitle(
      content.title, 
      user, 
      content.category
    );

    // Estimate benefit based on relevance and user profile
    const estimatedBenefit = relevanceScore * profile.engagementLevel * 0.8;

    return {
      contentId: content.id,
      title: content.title,
      type: content.type,
      category: content.category,
      reason: reasons.join(', '),
      relevanceScore: Math.round(relevanceScore * 100) / 100,
      priority,
      personalizedTitle,
      estimatedBenefit: Math.round(estimatedBenefit * 100) / 100,
      duration: content.duration,
      difficulty: content.difficulty
    };
  }

  /**
   * Check if difficulty level is appropriate for user
   */
  private static isDifficultyAppropriate(
    contentDifficulty: string, 
    user: any, 
    profile: UserContentProfile
  ): boolean {
    // If user is new (not onboarded), recommend beginner content
    if (!user.isOnboarded) {
      return contentDifficulty === 'Beginner';
    }

    // If user has high engagement, they can handle intermediate/advanced
    if (profile.engagementLevel > 0.7) {
      return ['Beginner', 'Intermediate'].includes(contentDifficulty);
    }

    // If user has many assessments, they're experienced
    if (user.assessments.length > 5) {
      return contentDifficulty !== 'Advanced'; // Avoid only advanced
    }

    // Default to beginner-friendly
    return ['Beginner', 'Intermediate'].includes(contentDifficulty);
  }

  /**
   * Generate personalized title based on user context
   */
  private static generatePersonalizedTitle(
    originalTitle: string, 
    user: any, 
    category: string
  ): string {
    const firstName = user.firstName || 'you';
    
    // Add personalization based on category and user context
    if (category === 'anxiety' && originalTitle.includes('Anxiety')) {
      return `${originalTitle} - Personalized for ${firstName}`;
    }
    
    if (category === 'stress' && user.approach === 'eastern') {
      return `${originalTitle} - Eastern Wellness Approach`;
    }
    
    if (category === 'mindfulness' && user.approach === 'western') {
      return `${originalTitle} - Evidence-Based Techniques`;
    }

    return originalTitle; // Return original if no personalization needed
  }

  /**
   * Store recommendations for tracking and analytics
   */
  private static async storeRecommendations(
    userId: string, 
    recommendations: ContentRecommendation[]
  ): Promise<void> {
    try {
      // For now, store as JSON in a simple format
      // In future, this would use the ContentRecommendation table
      console.log(`Storing ${recommendations.length} recommendations for user ${userId}`);
      
      // This would be implemented when the ContentRecommendation model is available
      // await prisma.contentRecommendation.createMany({
      //   data: recommendations.map(rec => ({
      //     userId,
      //     contentId: rec.contentId,
      //     reason: rec.reason,
      //     relevanceScore: rec.relevanceScore,
      //     priority: rec.priority,
      //     personalizedTitle: rec.personalizedTitle,
      //     estimatedBenefit: rec.estimatedBenefit
      //   }))
      // });
    } catch (error) {
      console.error('Failed to store recommendations:', error);
    }
  }

  /**
   * Get default user profile
   */
  private static getDefaultProfile(): UserContentProfile {
    return {
      primaryConcerns: ['general_wellness'],
      preferredTypes: ['article', 'exercise'],
      engagementLevel: 0.5,
      completionRate: 0.5,
      averageRating: 3.0,
      lastEngagement: null
    };
  }

  /**
   * Update user engagement metrics
   */
  static async updateEngagementMetrics(
    userId: string, 
    contentId: string, 
    action: 'viewed' | 'completed' | 'rated',
    value?: number
  ): Promise<void> {
    try {
      // For now, just log the engagement
      console.log(`User ${userId} ${action} content ${contentId}${value ? ` with value ${value}` : ''}`);
      
      // This would update ContentRecommendation table when available
      // await prisma.contentRecommendation.updateMany({
      //   where: { userId, contentId },
      //   data: {
      //     viewed: action === 'viewed' ? true : undefined,
      //     completed: action === 'completed' ? true : undefined,
      //     rating: action === 'rated' ? value : undefined
      //   }
      // });
    } catch (error) {
      console.error('Failed to update engagement metrics:', error);
    }
  }

  /**
   * Get content recommendations by category
   */
  static async getRecommendationsByCategory(
    userId: string, 
    category: string, 
    limit: number = 5
  ): Promise<ContentRecommendation[]> {
    try {
      const recommendations = await this.generateRecommendations({
        userId,
        categories: [category],
        maxRecommendations: limit
      });

      return recommendations;
    } catch (error) {
      console.error('Failed to get recommendations by category:', error);
      return [];
    }
  }

  /**
   * Get trending content for user's demographic
   */
  static async getTrendingContent(
    userId: string, 
    limit: number = 5
  ): Promise<ContentRecommendation[]> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        return [];
      }

      // Get content that's popular with similar users
      // For now, return general popular content
      const content = await prisma.content.findMany({
        where: {
          isPublished: true,
          approach: { in: [user.approach || 'hybrid', 'hybrid'] }
        },
        take: limit * 2 // Get more to filter from
      });

      // Score based on general popularity and user fit
      const userProfile = await this.buildUserContentProfile(userId);
      const scoredContent = content.map(item => 
        this.scoreContentForUser(item, user, userProfile)
      );

      return scoredContent
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, limit);
    } catch (error) {
      console.error('Failed to get trending content:', error);
      return [];
    }
  }

  /**
   * Get content based on current mood
   */
  static async getMoodBasedRecommendations(
    userId: string, 
    currentMood: string,
    limit: number = 3
  ): Promise<ContentRecommendation[]> {
    try {
      let categories: string[] = [];

      // Map moods to content categories
      switch (currentMood.toLowerCase()) {
        case 'anxious':
          categories = ['anxiety', 'mindfulness', 'breathing'];
          break;
        case 'struggling':
          categories = ['depression', 'support', 'coping'];
          break;
        case 'stressed':
          categories = ['stress', 'relaxation', 'time_management'];
          break;
        case 'good':
        case 'great':
          categories = ['maintenance', 'growth', 'mindfulness'];
          break;
        default:
          categories = ['general_wellness', 'mindfulness'];
      }

      return await this.getRecommendationsByCategory(userId, categories[0], limit);
    } catch (error) {
      console.error('Failed to get mood-based recommendations:', error);
      return [];
    }
  }

  /**
   * Refresh user's recommendation profile
   */
  static async refreshUserProfile(userId: string): Promise<UserContentProfile> {
    try {
      // Recalculate user profile based on latest activity
      const profile = await this.buildUserContentProfile(userId);
      
      // Store updated profile (when ContentRecommendation table is available)
      console.log(`Refreshed profile for user ${userId}:`, profile);
      
      return profile;
    } catch (error) {
      console.error('Failed to refresh user profile:', error);
      return this.getDefaultProfile();
    }
  }
}
