import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface RetrievalFilters {
  approach?: 'western' | 'eastern' | 'hybrid' | 'all';
  category?: string; // e.g., 'Mindfulness', 'Anxiety', etc.
  types?: Array<'video' | 'audio' | 'article'>;
  severityLevel?: 'Mild' | 'Moderate' | 'Severe';
  limit?: number;
}

export class ContentRetrieverService {
  /**
   * Retrieve published content matching filters, ranking by rating, views, and recency.
   */
  static async retrieve(filters: RetrievalFilters) {
    const where: any = { isPublished: true };

    if (filters.category) where.category = filters.category;
    if (filters.severityLevel) where.severityLevel = filters.severityLevel;
    if (filters.types && filters.types.length) where.type = { in: filters.types };

    // Approach: include hybrid as compatible with any specific approach
    if (filters.approach && filters.approach !== 'all') {
      where.approach = { in: [filters.approach, 'hybrid'] };
    }

    const items = await prisma.content.findMany({
      where,
      take: Math.min(filters.limit || 5, 25),
      orderBy: [
        { rating: 'desc' },
        { viewCount: 'desc' },
        { createdAt: 'desc' }
      ],
      select: {
        id: true,
        title: true,
        description: true,
        type: true,
        category: true,
        approach: true,
        duration: true,
        difficulty: true,
        tags: true,
        thumbnailUrl: true,
        rating: true,
        severityLevel: true,
        externalUrl: true,
        fileUrl: true
      }
    });

    return items;
  }

  /**
   * Convenience retriever from mental health context: pick category from concerns, severity mapping, and approach.
   */
  static async fromMentalHealthContext(params: {
    approach?: 'western' | 'eastern' | 'hybrid' | 'all';
    topConcerns?: string[];
    severityScore?: number; // 0-100
    limit?: number;
  }) {
    const category = this.mapConcernsToCategory(params.topConcerns);
    const severityLevel = this.mapScoreToSeverity(params.severityScore);
    return this.retrieve({
      approach: params.approach,
      category: category || undefined,
      severityLevel: severityLevel || undefined,
      limit: params.limit || 3
    });
  }

  private static mapConcernsToCategory(concerns?: string[]): string | null {
    if (!concerns || concerns.length === 0) return null;
    const c = concerns.join(' ').toLowerCase();
    if (c.includes('anxiety')) return 'Anxiety';
    if (c.includes('stress')) return 'Stress Management';
    if (c.includes('mindful') || c.includes('meditation')) return 'Mindfulness';
    if (c.includes('emotion')) return 'Emotional Intelligence';
    if (c.includes('relax')) return 'Relaxation';
    return null;
  }

  private static mapScoreToSeverity(score?: number): 'Mild' | 'Moderate' | 'Severe' | null {
    if (score === undefined || score === null) return null;
    if (score >= 70) return 'Severe';
    if (score >= 40) return 'Moderate';
    return 'Mild';
  }
}

export default ContentRetrieverService;
