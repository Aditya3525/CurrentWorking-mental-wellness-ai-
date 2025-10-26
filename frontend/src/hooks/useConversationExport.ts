import { useMutation } from '@tanstack/react-query';
import { saveAs } from 'file-saver';

import { conversationsApi } from '../services/api';

/**
 * Hook to export a single conversation
 */
export function useExportConversation() {
  return useMutation({
    mutationFn: async ({
      conversationId,
      format,
      includeSystemMessages = true,
      filename,
    }: {
      conversationId: string;
      format: 'pdf' | 'text' | 'json';
      includeSystemMessages?: boolean;
      filename?: string;
    }) => {
      const blob = await conversationsApi.exportConversation(
        conversationId,
        format,
        includeSystemMessages
      );

      // Generate filename if not provided
      const defaultFilename = filename || `conversation_${Date.now()}.${format === 'json' ? 'json' : format === 'pdf' ? 'pdf' : 'txt'}`;

      // Trigger download
      saveAs(blob, defaultFilename);

      return { success: true };
    },
  });
}

/**
 * Hook to export multiple conversations
 */
export function useBulkExportConversations() {
  return useMutation({
    mutationFn: async ({
      conversationIds,
      format,
      filename,
    }: {
      conversationIds: string[];
      format: 'text' | 'json';
      filename?: string;
    }) => {
      const blob = await conversationsApi.exportBulkConversations(
        conversationIds,
        format
      );

      // Generate filename if not provided
      const defaultFilename = filename || `conversations_bulk_${Date.now()}.${format === 'json' ? 'json' : 'txt'}`;

      // Trigger download
      saveAs(blob, defaultFilename);

      return { success: true };
    },
  });
}
