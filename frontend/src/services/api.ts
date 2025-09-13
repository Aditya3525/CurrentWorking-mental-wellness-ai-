// API Configuration
const API_BASE_URL = 'http://localhost:5000/api';

// Types
export interface User {
  id: string;
  name: string;
  email: string;
  firstName?: string;
  lastName?: string;
  profilePhoto?: string;
  isOnboarded: boolean;
  approach?: 'western' | 'eastern' | 'hybrid';
  birthday?: string;
  gender?: string;
  region?: string;
  language?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  dataConsent: boolean;
  clinicianSharing: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  success: boolean;
  data?: {
    user: User;
    token: string;
  };
  error?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Token management
class TokenManager {
  private static TOKEN_KEY = 'token'; // Changed from 'auth_token' to match OAuth callback storage

  static getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  static setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  static removeToken(): void {
    localStorage.removeItem(this.TOKEN_KEY);
  }

  static getAuthHeaders(): Record<string, string> {
    const token = this.getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }
}

// HTTP Client
class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseURL}${endpoint}`;
      const config: RequestInit = {
        headers: {
          'Content-Type': 'application/json',
          ...TokenManager.getAuthHeaders(),
          ...options.headers,
        },
        ...options,
      };

      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

// Create API client instance
const apiClient = new ApiClient(API_BASE_URL);

// Auth API
export const authApi = {
  async register(userData: { name: string; email: string; password: string }): Promise<AuthResponse> {
    const response = await apiClient.post<{ user: User; token: string }>('/auth/register', userData);
    
    if (response.success && response.data) {
      TokenManager.setToken(response.data.token);
    }
    
    return response;
  },

  async login(credentials: { email: string; password: string }): Promise<AuthResponse> {
    const response = await apiClient.post<{ user: User; token: string }>('/auth/login', credentials);
    
    if (response.success && response.data) {
      TokenManager.setToken(response.data.token);
    }
    
    return response;
  },

  async getCurrentUser(): Promise<ApiResponse<{ user: User }>> {
    return apiClient.get<{ user: User }>('/auth/me');
  },

  async setupPassword(password: string): Promise<ApiResponse<{ user: User }>> {
    console.log('API: Setting up password...');
    try {
      const result = await apiClient.post<{ user: User }>('/auth/setup-password', { password });
      console.log('API: Password setup result:', result);
      return result;
    } catch (error) {
      console.error('API: Password setup error:', error);
      throw error;
    }
  },

  async updateProfile(profileData: {
    birthday?: string;
    gender?: string;
    region?: string;
    language?: string;
    emergencyContact?: string;
    emergencyPhone?: string;
    approach?: 'western' | 'eastern' | 'hybrid';
    isOnboarded?: boolean;
  }): Promise<ApiResponse<{ user: User }>> {
    return apiClient.put<{ user: User }>('/auth/profile', profileData);
  },

  logout(): void {
    TokenManager.removeToken();
  },

  async serverLogout(): Promise<ApiResponse<{ message: string }>> {
    return apiClient.post<{ message: string }>('/auth/logout');
  },

  isAuthenticated(): boolean {
    return !!TokenManager.getToken();
  }
};

// Users API
export const usersApi = {
  async updateProfile(userId: string, updates: Partial<User>): Promise<ApiResponse<{ user: User }>> {
    return apiClient.put<{ user: User }>(`/users/${userId}`, updates);
  },

  async completeOnboarding(onboardingData: {
    approach: 'western' | 'eastern' | 'hybrid';
    firstName?: string;
    lastName?: string;
    birthday?: string;
    gender?: string;
    region?: string;
    language?: string;
    emergencyContact?: string;
    emergencyPhone?: string;
  }): Promise<ApiResponse<{ user: User }>> {
    return apiClient.post<{ user: User }>('/users/complete-onboarding', onboardingData);
  }
};

// Assessments API
export const assessmentsApi = {
  async getAssessments(): Promise<ApiResponse<any[]>> {
    return apiClient.get('/assessments');
  },

  async submitAssessment(assessmentData: {
    assessmentType: string;
    responses: Record<string, any>;
    score: number;
  }): Promise<ApiResponse<any>> {
    return apiClient.post('/assessments', assessmentData);
  },

  async getAssessmentHistory(): Promise<ApiResponse<any[]>> {
    return apiClient.get('/assessments/history');
  },

  async getLatestAssessment(): Promise<ApiResponse<any>> {
    return apiClient.get('/assessments/latest');
  }
};

// Progress API
export const progressApi = {
  async trackProgress(data: {
    metric: string;
    value: number;
    notes?: string;
  }): Promise<ApiResponse<any>> {
    return apiClient.post('/progress', data);
  },

  async getProgressHistory(metric?: string): Promise<ApiResponse<any[]>> {
    const endpoint = metric ? `/progress?metric=${metric}` : '/progress';
    return apiClient.get(endpoint);
  }
};

// Mood API
export const moodApi = {
  async logMood(mood: string, notes?: string): Promise<ApiResponse<any>> {
    return apiClient.post('/users/mood', { mood, notes });
  },

  async getMoodHistory(): Promise<ApiResponse<any[]>> {
    return apiClient.get('/users/mood-history');
  }
};

// Chat API
export const chatApi = {
  async sendMessage(content: string): Promise<ApiResponse<any>> {
    return apiClient.post('/chat/message', { content });
  },

  async getChatHistory(): Promise<ApiResponse<any[]>> {
    return apiClient.get('/chat/history');
  }
};

// Plans API
export const plansApi = {
  async getPersonalizedPlan(): Promise<ApiResponse<any>> {
    return apiClient.get('/plans/personalized');
  },

  async updateModuleProgress(moduleId: string, progress: number): Promise<ApiResponse<any>> {
    return apiClient.put(`/plans/modules/${moduleId}/progress`, { progress });
  },

  async completeModule(moduleId: string): Promise<ApiResponse<any>> {
    return apiClient.post(`/plans/modules/${moduleId}/complete`);
  }
};

// Content API
export const contentApi = {
  async getContent(filters?: { category?: string; type?: string; approach?: string }): Promise<ApiResponse<any[]>> {
    const params = new URLSearchParams();
    if (filters?.category) params.append('category', filters.category);
    if (filters?.type) params.append('type', filters.type);
    if (filters?.approach) params.append('approach', filters.approach);
    
    const queryString = params.toString();
    const endpoint = queryString ? `/content?${queryString}` : '/content';
    
    return apiClient.get(endpoint);
  },

  async getContentById(id: string): Promise<ApiResponse<any>> {
    return apiClient.get(`/content/${id}`);
  }
};

// Insights API
export const insightsApi = {
  async generateAssessmentInsights(assessmentType: string, score: number, responses: any): Promise<ApiResponse<any>> {
    return apiClient.post('/insights/assessment', { assessmentType, score, responses });
  },

  async getMentalHealthSummary(): Promise<ApiResponse<any>> {
    return apiClient.get('/insights/mental-health-summary');
  }
};

export { TokenManager };
