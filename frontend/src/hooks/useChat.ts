/**
 * Chat Hooks using React Query
 * 
 * Optimized hooks for AI chat interactions with automatic caching and real-time updates.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { useToast } from '../contexts/ToastContext';
import { queryKeys } from '../lib/queryClient';
import { chatApi } from '../services/api';

/**
 * Fetch chat history
 */
export function useChatHistory() {
  return useQuery({
    queryKey: queryKeys.chatHistory(),
    queryFn: async () => {
      const response = await chatApi.getChatHistory();
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch chat history');
      }
      return response.data;
    },
    staleTime: 1 * 60 * 1000, // Cache for 1 minute (chat is more dynamic)
    refetchInterval: 30 * 1000, // Refetch every 30 seconds for real-time feel
  });
}

/**
 * Send chat message mutation
 */
export function useSendChatMessage() {
  const queryClient = useQueryClient();
  const { push } = useToast();

  return useMutation({
    mutationFn: async (content: string) => {
      const response = await chatApi.sendMessage(content);
      if (!response.success) {
        throw new Error(response.error || 'Failed to send message');
      }
      return response.data;
    },
    onSuccess: () => {
      // Invalidate chat history to refetch with new messages
      queryClient.invalidateQueries({ queryKey: queryKeys.chatHistory() });
    },
    onError: (error) => {
      push({
        title: 'Message Failed',
        description: error instanceof Error ? error.message : 'Please try again.',
        type: 'error',
      });
    },
  });
}

/**
 * Prefetch chat history for faster navigation
 */
export function usePrefetchChatHistory() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.chatHistory(),
      queryFn: async () => {
        const response = await chatApi.getChatHistory();
        return response.data;
      },
    });
  };
}
