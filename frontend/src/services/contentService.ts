// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export interface ContentItem {
  id: string;
  title: string;
  description: string;
  shortDescription?: string;
  fullDescription?: string;
  type: 'video' | 'audio' | 'article' | 'playlist';
  category: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  approach: 'western' | 'eastern' | 'hybrid';
  severity?: 'mild' | 'moderate' | 'severe';
  tags: string[];
  thumbnail?: string;
  imageUrl?: string;
  audioUrl?: string;
  videoUrl?: string;
  fileUrl?: string;
  externalUrl?: string;
  duration?: number; // in minutes
  estimatedReadTime?: number; // in minutes
  viewCount: number;
  averageRating?: number;
  ratingCount: number;
  isBookmarked?: boolean;
  isFeatured: boolean;
  author?: {
    id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ContentFilters {
  search?: string;
  category?: string;
  type?: string;
  difficulty?: string;
  approach?: string;
  severity?: string;
  tags?: string[];
  featured?: boolean;
  sortBy?: 'createdAt' | 'viewCount' | 'rating' | 'title';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface ContentResponse {
  success: boolean;
  data: {
    content: ContentItem[];
    recommendations?: ContentItem[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
    filters?: {
      categories: Array<{ name: string; count: number }>;
      types: Array<{ name: string; count: number }>;
    };
  };
}

export interface ContentDetailResponse {
  success: boolean;
  data: {
    content: ContentItem;
    userRating?: {
      rating: number;
      review?: string;
    };
    relatedContent: ContentItem[];
  };
}

export interface SearchResponse {
  success: boolean;
  data: {
    results: ContentItem[];
    suggestions: string[];
    query: string;
    count: number;
  };
}

export interface RecommendationsResponse {
  success: boolean;
  data: {
    recommendations: ContentItem[];
  };
}

export interface RatingResponse {
  success: boolean;
  message: string;
  data: {
    rating: {
      rating: number;
      review?: string;
    };
    averageRating: number;
    totalRatings: number;
  };
}

export interface CategoriesResponse {
  success: boolean;
  data: {
    categories: Array<{ name: string; count: number }>;
    types: Array<{ name: string; count: number }>;
    approaches: Array<{ name: string; count: number }>;
  };
}

export interface BookmarkResponse {
  success: boolean;
  message: string;
}

export interface InteractionResponse {
  success: boolean;
  message: string;
  data?: Record<string, unknown>;
}

class ContentService {
  private getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  }

  async getContent(filters: ContentFilters = {}): Promise<ContentResponse> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value)) {
          params.append(key, value.join(','));
        } else {
          params.append(key, value.toString());
        }
      }
    });

    const response = await fetch(`${API_BASE_URL}/content?${params}`, {
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error('Failed to fetch content');
    }

    return response.json();
  }

  async getContentById(id: string): Promise<ContentDetailResponse> {
    const response = await fetch(`${API_BASE_URL}/content/${id}`, {
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error('Failed to fetch content details');
    }

    return response.json();
  }

  async searchContent(query: string, filters: Partial<ContentFilters> = {}): Promise<SearchResponse> {
    const params = new URLSearchParams({ q: query });
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    const response = await fetch(`${API_BASE_URL}/content/search?${params}`, {
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error('Failed to search content');
    }

    return response.json();
  }

  async rateContent(contentId: string, rating: number, review?: string): Promise<RatingResponse> {
    const response = await fetch(`${API_BASE_URL}/content/${contentId}/rate`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ rating, review })
    });

    if (!response.ok) {
      throw new Error('Failed to rate content');
    }

    return response.json();
  }

  async getRecommendations(): Promise<RecommendationsResponse> {
    const response = await fetch(`${API_BASE_URL}/content/recommendations`, {
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error('Failed to fetch recommendations');
    }

    return response.json();
  }

  async getCategories(): Promise<CategoriesResponse> {
    const response = await fetch(`${API_BASE_URL}/content/categories`, {
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error('Failed to fetch categories');
    }

    return response.json();
  }

  async bookmarkContent(contentId: string): Promise<BookmarkResponse> {
    const response = await fetch(`${API_BASE_URL}/content/${contentId}/bookmark`, {
      method: 'POST',
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error('Failed to bookmark content');
    }

    return response.json();
  }

  async removeBookmark(contentId: string): Promise<BookmarkResponse> {
    const response = await fetch(`${API_BASE_URL}/content/${contentId}/bookmark`, {
      method: 'DELETE',
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error('Failed to remove bookmark');
    }

    return response.json();
  }

  async trackInteraction(contentId: string, type: 'view' | 'like' | 'share' | 'download', metadata?: Record<string, unknown>): Promise<InteractionResponse> {
    const response = await fetch(`${API_BASE_URL}/content/interactions`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({
        contentId,
        type,
        metadata
      })
    });

    if (!response.ok) {
      throw new Error('Failed to track interaction');
    }

    return response.json();
  }
}

export const contentService = new ContentService();
