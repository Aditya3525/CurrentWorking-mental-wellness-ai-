import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Types
export interface DashboardData {
  user: {
    id: string;
    name: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
    approach: string | null;
    profileCompletion: number;
    memberSince: string;
  };
  assessmentScores: {
    anxiety: number | null;
    stress: number | null;
    emotionalIntelligence: number | null;
    wellnessScore: number | null;
    byType: Record<string, AssessmentSummary>;
    overallTrend: string;
    aiSummary: string;
    updatedAt: string;
  } | null;
  recentInsights: Insight[];
  weeklyProgress: {
    practices: ProgressMetric;
    moodCheckins: ProgressMetric;
    assessments: ProgressMetric;
    currentStreak: number;
  };
  recentMoods: MoodEntry[];
  recommendedPractice: RecommendedPractice | null;
}

export interface AssessmentSummary {
  latestScore: number;
  previousScore: number | null;
  change: number | null;
  averageScore: number;
  bestScore: number;
  trend: string;
  interpretation: string;
  recommendations: string[];
  lastCompletedAt: string;
  historyCount: number;
}

export interface Insight {
  type: 'ai-summary' | 'pattern' | 'progress';
  title: string;
  description: string;
  icon: string;
  severity?: 'success' | 'warning' | 'info';
  timestamp: string;
}

export interface ProgressMetric {
  completed: number;
  goal: number;
  percentage: number;
}

export interface MoodEntry {
  mood: string;
  notes: string | null;
  createdAt: string;
}

export interface RecommendedPractice {
  title: string;
  description: string | null;
  type: string;
  duration: string | number | null;
  tags: string[] | null;
  reason: string;
  approach: string | null;
}

export interface WeeklyProgress {
  practices: ProgressMetric & { details: PracticeDetail[] };
  moodCheckins: ProgressMetric & { moodDistribution: Record<string, number> };
  assessments: ProgressMetric & { types: string[] };
  streak: {
    current: number;
    message: string;
  };
}

export interface PracticeDetail {
  title: string;
  type: string;
  completedAt: string | null;
}

export interface InsightsResponse {
  insights: Insight[];
  aiSummary: string;
  overallTrend: string;
  wellnessScore?: {
    value: number;
    method: string;
    updatedAt: string;
  };
}

export interface RecommendationResponse {
  recommendations: RecommendedPractice[];
  focusAreas: string[];
  rationale: string;
}

// API functions
async function fetchDashboardSummary(token: string): Promise<DashboardData> {
  const response = await fetch(`${API_BASE_URL}/dashboard/summary`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch dashboard summary');
  }

  return response.json();
}

async function fetchInsights(token: string): Promise<InsightsResponse> {
  const response = await fetch(`${API_BASE_URL}/dashboard/insights`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch insights');
  }

  return response.json();
}

async function fetchWeeklyProgress(token: string): Promise<WeeklyProgress> {
  const response = await fetch(`${API_BASE_URL}/dashboard/weekly-progress`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch weekly progress');
  }

  return response.json();
}

async function fetchRecommendedPractice(token: string): Promise<RecommendationResponse> {
  const response = await fetch(`${API_BASE_URL}/dashboard/recommended-practice`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch recommended practice');
  }

  return response.json();
}

async function saveMoodEntry(token: string, mood: string, notes?: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/users/mood`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ mood, notes }),
  });

  if (!response.ok) {
    throw new Error('Failed to save mood entry');
  }
}

// Custom hooks
export function useDashboardData() {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    // Get token from localStorage (stored by TokenManager in api.ts)
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      setToken(storedToken);
    }
  }, []);

  return useQuery({
    queryKey: ['dashboard', 'summary'],
    queryFn: () => fetchDashboardSummary(token!),
    enabled: !!token,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
  });
}

export function useInsights() {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    // Get token from localStorage (stored by TokenManager in api.ts)
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      setToken(storedToken);
    }
  }, []);

  return useQuery({
    queryKey: ['dashboard', 'insights'],
    queryFn: () => fetchInsights(token!),
    enabled: !!token,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useWeeklyProgress() {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    // Get token from localStorage (stored by TokenManager in api.ts)
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      setToken(storedToken);
    }
  }, []);

  return useQuery({
    queryKey: ['dashboard', 'weekly-progress'],
    queryFn: () => fetchWeeklyProgress(token!),
    enabled: !!token,
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 5 * 60 * 1000, // Auto-refresh every 5 minutes
  });
}

export function useRecommendedPractice() {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    // Get token from localStorage (stored by TokenManager in api.ts)
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      setToken(storedToken);
    }
  }, []);

  return useQuery({
    queryKey: ['dashboard', 'recommended-practice'],
    queryFn: () => fetchRecommendedPractice(token!),
    enabled: !!token,
    staleTime: 15 * 60 * 1000, // 15 minutes
  });
}

export function useSaveMood() {
  const queryClient = useQueryClient();
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    // Get token from localStorage (stored by TokenManager in api.ts)
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      setToken(storedToken);
    }
  }, []);

  return useMutation({
    mutationFn: ({ mood, notes }: { mood: string; notes?: string }) =>
      saveMoodEntry(token!, mood, notes),
    onSuccess: () => {
      // Invalidate and refetch dashboard data
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

// WebSocket hook for real-time updates
export function useDashboardWebSocket() {
  const queryClient = useQueryClient();
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    // Get token from localStorage (stored by TokenManager in api.ts)
    const storedToken = localStorage.getItem('token');
    if (!storedToken) return;

    const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:5000';
    
    // Note: WebSocket implementation would need backend support
    // This is a placeholder for future WebSocket implementation
    const ws = new WebSocket(`${WS_URL}/dashboard?token=${storedToken}`);

    ws.onopen = () => {
      setIsConnected(true);
      console.log('[Dashboard] WebSocket connected');
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        // Handle different update types
        switch (data.type) {
          case 'insight_generated':
            queryClient.invalidateQueries({ queryKey: ['dashboard', 'insights'] });
            break;
          case 'streak_updated':
            queryClient.invalidateQueries({ queryKey: ['dashboard', 'weekly-progress'] });
            break;
          case 'assessment_completed':
            queryClient.invalidateQueries({ queryKey: ['dashboard', 'summary'] });
            break;
          default:
            console.log('[Dashboard] Unknown update type:', data.type);
        }
        
        setLastUpdate(new Date());
      } catch (error) {
        console.error('[Dashboard] WebSocket message error:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('[Dashboard] WebSocket error:', error);
      setIsConnected(false);
    };

    ws.onclose = () => {
      setIsConnected(false);
      console.log('[Dashboard] WebSocket disconnected');
    };

    return () => {
      ws.close();
    };
  }, [queryClient]);

  return { isConnected, lastUpdate };
}

// Pull-to-refresh hook
export function usePullToRefresh(onRefresh: () => Promise<void>) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [startY, setStartY] = useState(0);
  const [pullDistance, setPullDistance] = useState(0);

  const PULL_THRESHOLD = 80; // pixels to pull before triggering refresh

  useEffect(() => {
    let touchStarted = false;

    const handleTouchStart = (e: TouchEvent) => {
      if (window.scrollY === 0) {
        touchStarted = true;
        setStartY(e.touches[0].clientY);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!touchStarted || isRefreshing) return;

      const currentY = e.touches[0].clientY;
      const distance = currentY - startY;

      if (distance > 0 && window.scrollY === 0) {
        setPullDistance(Math.min(distance, PULL_THRESHOLD * 1.5));
        
        // Prevent default scroll behavior when pulling
        if (distance > 10) {
          e.preventDefault();
        }
      }
    };

    const handleTouchEnd = async () => {
      if (!touchStarted) return;
      touchStarted = false;

      if (pullDistance >= PULL_THRESHOLD && !isRefreshing) {
        setIsRefreshing(true);
        try {
          await onRefresh();
        } finally {
          setIsRefreshing(false);
        }
      }

      setPullDistance(0);
    };

    document.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [startY, pullDistance, isRefreshing, onRefresh, PULL_THRESHOLD]);

  return {
    isRefreshing,
    pullDistance,
    pullProgress: Math.min(pullDistance / PULL_THRESHOLD, 1),
    shouldTrigger: pullDistance >= PULL_THRESHOLD,
  };
}
