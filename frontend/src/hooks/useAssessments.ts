/**
 * Assessment Hooks using React Query
 * 
 * Optimized data fetching hooks for assessments with automatic caching,
 * background refetching, and optimistic updates.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '../lib/queryClient';
import { assessmentsApi } from '../services/api';
import { useNotificationStore } from '../stores/notificationStore';

/**
 * Fetch all assessment templates
 */
export function useAssessmentTemplates() {
  return useQuery({
    queryKey: queryKeys.assessmentTemplates,
    queryFn: async () => {
      const response = await assessmentsApi.getAssessmentTemplates();
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch assessment templates');
      }
      return response.data;
    },
    staleTime: 15 * 60 * 1000, // Templates rarely change, cache for 15 minutes
  });
}

/**
 * Fetch assessment history for current user
 */
export function useAssessmentHistory() {
  return useQuery({
    queryKey: queryKeys.assessmentHistory(),
    queryFn: async () => {
      const response = await assessmentsApi.getAssessmentHistory();
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch assessment history');
      }
      return response.data;
    },
    staleTime: 2 * 60 * 1000, // Cache for 2 minutes
  });
}

/**
 * Fetch assessment insights (returns both history and insights)
 */
export function useAssessmentInsights() {
  return useQuery({
    queryKey: queryKeys.assessmentInsights(),
    queryFn: async () => {
      const response = await assessmentsApi.getAssessmentHistory();
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch insights');
      }
      return response.data?.insights;
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
}

/**
 * Submit assessment mutation with optimistic updates
 */
export function useSubmitAssessment() {
  const queryClient = useQueryClient();
  const { push } = useNotificationStore();

  return useMutation({
    mutationFn: async (data: {
      assessmentType: string;
      responses: Record<string, number>;
      sessionId?: string;
    }) => {
      const response = await assessmentsApi.submitAssessment(data);
      if (!response.success) {
        throw new Error(response.error || 'Failed to submit assessment');
      }
      return response.data;
    },
    onSuccess: () => {
      // Invalidate and refetch related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.assessmentHistory() });
      queryClient.invalidateQueries({ queryKey: queryKeys.assessmentInsights() });
      queryClient.invalidateQueries({ queryKey: queryKeys.assessments });
      
      push({
        title: 'Assessment Completed',
        description: 'Your assessment has been saved successfully.',
        type: 'success',
      });
    },
    onError: (error) => {
      push({
        title: 'Submission Failed',
        description: error instanceof Error ? error.message : 'Please try again.',
        type: 'error',
      });
    },
  });
}

/**
 * Start assessment session
 */
export function useStartAssessmentSession() {
  const queryClient = useQueryClient();
  const { push } = useNotificationStore();

  return useMutation({
    mutationFn: async (selectedTypes: string[]) => {
      const response = await assessmentsApi.startAssessmentSession({ selectedTypes });
      if (!response.success) {
        throw new Error(response.error || 'Failed to start session');
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.assessments });
    },
    onError: (error) => {
      push({
        title: 'Session Start Failed',
        description: error instanceof Error ? error.message : 'Please try again.',
        type: 'error',
      });
    },
  });
}

/**
 * Complete assessment session
 */
export function useCompleteAssessmentSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sessionId: string) => {
      const response = await assessmentsApi.updateAssessmentSessionStatus(sessionId, 'completed');
      if (!response.success) {
        throw new Error(response.error || 'Failed to complete session');
      }
      return response.data;
    },
    onSuccess: () => {
      // Invalidate all assessment-related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.assessments });
      queryClient.invalidateQueries({ queryKey: queryKeys.assessmentHistory() });
      queryClient.invalidateQueries({ queryKey: queryKeys.assessmentInsights() });
    },
  });
}

/**
 * Prefetch assessment templates (useful for preloading)
 */
export function usePrefetchAssessmentTemplates() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.assessmentTemplates,
      queryFn: async () => {
        const response = await assessmentsApi.getAssessmentTemplates();
        return response.data;
      },
    });
  };
}
