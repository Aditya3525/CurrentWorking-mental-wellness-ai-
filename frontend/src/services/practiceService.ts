// Practice interfaces
export interface PracticeItem {
  id: string;
  title: string;
  description: string;
  shortDescription?: string;
  fullDescription?: string;
  type: 'meditation' | 'breathing' | 'yoga' | 'sleep' | 'movement' | 'visualization';
  category: string;
  subcategory?: string;
  duration: number; // in minutes
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  instructor: string;
  instructorBio?: string;
  thumbnail?: string;
  imageUrl?: string;
  audioUrl?: string;
  videoUrl?: string;
  
  // Admin content fields
  isActive: boolean;
  isFeatured: boolean;
  isBookmarked: boolean;
  isPremium: boolean;
  
  // Metadata
  tags: string[];
  approach: 'western' | 'eastern' | 'hybrid';
  targetMoods: string[];
  benefits: string[];
  prerequisites?: string[];
  
  // Statistics
  viewCount: number;
  completionCount: number;
  averageRating?: number;
  ratingCount?: number;
  
  // Series information
  seriesId?: string;
  seriesTitle?: string;
  seriesOrder?: number;
  totalSessions?: number;
  
  // Timing
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  
  // User progress
  userProgress?: number;
  lastAccessed?: string;
  isCompleted?: boolean;
  personalRating?: number;
}

export interface PracticeSeries {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  instructor: string;
  totalSessions: number;
  totalDuration: number;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  category: string;
  approach: 'western' | 'eastern' | 'hybrid';
  practices: PracticeItem[];
  userProgress?: number;
  isBookmarked: boolean;
}

export interface PracticeFilters {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  type?: string;
  difficulty?: string;
  duration?: string; // short, medium, long
  approach?: string;
  instructor?: string;
  isPremium?: boolean;
  isFeatured?: boolean;
  sortBy?: 'createdAt' | 'title' | 'duration' | 'rating' | 'viewCount' | 'completionCount';
  sortOrder?: 'asc' | 'desc';
  targetMood?: string;
}

export interface PracticeSearchResult {
  results: PracticeItem[];
  suggestions: string[];
  totalCount: number;
}

export interface PracticeInteraction {
  practiceId: string;
  type: 'view' | 'start' | 'complete' | 'pause' | 'bookmark' | 'rate' | 'download';
  data?: {
    rating?: number;
    duration?: number;
    completionPercentage?: number;
    source?: string;
    timestamp?: string;
    notes?: string;
  };
}

export interface PracticeSession {
  id: string;
  practiceId: string;
  userId: string;
  startedAt: string;
  completedAt?: string;
  duration: number;
  completionPercentage: number;
  rating?: number;
  notes?: string;
  mood?: {
    before: string;
    after: string;
  };
}

export interface PracticeRecommendation {
  practiceId: string;
  score: number;
  reason: string;
  type: 'similar' | 'next_in_series' | 'mood_based' | 'assessment_based' | 'trending';
}

// API Response interfaces
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

class PracticeService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = 'http://localhost:3001/api/practices';
  }

  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    const token = localStorage.getItem('authToken');
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Request failed');
      }
      
      return data;
    } catch (error) {
      console.error('Practice service error:', error);
      throw error;
    }
  }

  // Get practices with filtering and pagination
  async getPractices(filters: PracticeFilters = {}): Promise<ApiResponse<PaginatedResponse<PracticeItem>>> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    return this.request<PaginatedResponse<PracticeItem>>(`?${params.toString()}`);
  }

  // Get single practice by ID
  async getPracticeById(id: string): Promise<ApiResponse<PracticeItem>> {
    return this.request<PracticeItem>(`/${id}`);
  }

  // Search practices
  async searchPractices(
    query: string, 
    filters: Partial<PracticeFilters> = {}
  ): Promise<ApiResponse<PracticeSearchResult>> {
    const params = new URLSearchParams({ q: query });
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    return this.request<PracticeSearchResult>(`/search?${params.toString()}`);
  }

  // Get practice series
  async getSeries(filters: Partial<PracticeFilters> = {}): Promise<ApiResponse<PaginatedResponse<PracticeSeries>>> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    return this.request<PaginatedResponse<PracticeSeries>>(`/series?${params.toString()}`);
  }

  // Get single series by ID
  async getSeriesById(id: string): Promise<ApiResponse<PracticeSeries>> {
    return this.request<PracticeSeries>(`/series/${id}`);
  }

  // Get personalized recommendations
  async getRecommendations(limit: number = 12): Promise<ApiResponse<{ recommendations: PracticeItem[] }>> {
    return this.request<{ recommendations: PracticeItem[] }>(`/recommendations?limit=${limit}`);
  }

  // Get categories and types for filtering
  async getCategories(): Promise<ApiResponse<{
    categories: Array<{ name: string; count: number }>;
    types: Array<{ name: string; count: number }>;
    instructors: Array<{ name: string; count: number }>;
    approaches: Array<{ name: string; count: number }>;
  }>> {
    return this.request<{
      categories: Array<{ name: string; count: number }>;
      types: Array<{ name: string; count: number }>;
      instructors: Array<{ name: string; count: number }>;
      approaches: Array<{ name: string; count: number }>;
    }>('/categories');
  }

  // User interactions
  async trackInteraction(
    practiceId: string, 
    type: PracticeInteraction['type'], 
    data: PracticeInteraction['data'] = {}
  ): Promise<ApiResponse<void>> {
    return this.request<void>('/interactions', {
      method: 'POST',
      body: JSON.stringify({ practiceId, type, data }),
    });
  }

  // Start practice session
  async startSession(practiceId: string): Promise<ApiResponse<{ sessionId: string }>> {
    return this.request<{ sessionId: string }>('/sessions', {
      method: 'POST',
      body: JSON.stringify({ practiceId }),
    });
  }

  // Update practice session
  async updateSession(
    sessionId: string,
    updates: Partial<PracticeSession>
  ): Promise<ApiResponse<PracticeSession>> {
    return this.request<PracticeSession>(`/sessions/${sessionId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  // Complete practice session
  async completeSession(
    sessionId: string,
    completion: {
      completionPercentage: number;
      rating?: number;
      notes?: string;
      mood?: { before: string; after: string };
    }
  ): Promise<ApiResponse<PracticeSession>> {
    return this.request<PracticeSession>(`/sessions/${sessionId}/complete`, {
      method: 'POST',
      body: JSON.stringify(completion),
    });
  }

  // Bookmark management
  async bookmarkPractice(practiceId: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/${practiceId}/bookmark`, {
      method: 'POST',
    });
  }

  async removeBookmark(practiceId: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/${practiceId}/bookmark`, {
      method: 'DELETE',
    });
  }

  // Rating
  async ratePractice(
    practiceId: string, 
    rating: number, 
    review?: string
  ): Promise<ApiResponse<void>> {
    return this.request<void>(`/${practiceId}/rate`, {
      method: 'POST',
      body: JSON.stringify({ rating, review }),
    });
  }

  // Get user's practice history
  async getUserHistory(
    filters: { limit?: number; page?: number } = {}
  ): Promise<ApiResponse<PaginatedResponse<PracticeSession>>> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        params.append(key, value.toString());
      }
    });

    return this.request<PaginatedResponse<PracticeSession>>(`/history?${params.toString()}`);
  }

  // Get practice statistics
  async getStats(): Promise<ApiResponse<{
    totalSessions: number;
    totalMinutes: number;
    currentStreak: number;
    longestStreak: number;
    favoriteType: string;
    weeklyGoal: number;
    weeklyProgress: number;
    recentSessions: PracticeSession[];
  }>> {
    return this.request<{
      totalSessions: number;
      totalMinutes: number;
      currentStreak: number;
      longestStreak: number;
      favoriteType: string;
      weeklyGoal: number;
      weeklyProgress: number;
      recentSessions: PracticeSession[];
    }>('/stats');
  }

  // Download practice for offline use
  async downloadPractice(practiceId: string): Promise<ApiResponse<{ downloadUrl: string }>> {
    return this.request<{ downloadUrl: string }>(`/${practiceId}/download`, {
      method: 'POST',
    });
  }
}

export const practiceService = new PracticeService();
export default practiceService;