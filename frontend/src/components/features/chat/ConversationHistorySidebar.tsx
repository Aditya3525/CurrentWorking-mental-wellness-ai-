import { Search, Plus, Loader2, FolderOpen, AlertCircle } from 'lucide-react';
import React, { useState, useMemo } from 'react';

import {
  useConversations,
  useCreateConversation,
  useDeleteConversation,
  useRenameConversation,
  useArchiveConversation,
  useSearchConversations,
} from '../../../hooks/useConversations';
import type { Conversation } from '../../../services/api';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { ScrollArea } from '../../ui/scroll-area';
import { Skeleton } from '../../ui/skeleton';

import { ConversationItem } from './ConversationItem';

interface ConversationHistorySidebarProps {
  activeConversationId: string | null;
  onSelectConversation: (conversationId: string | null) => void;
  className?: string;
}

// Helper function to group conversations by date
function groupConversationsByDate(conversations: Conversation[]) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const lastWeek = new Date(today);
  lastWeek.setDate(lastWeek.getDate() - 7);
  const lastMonth = new Date(today);
  lastMonth.setDate(lastMonth.getDate() - 30);

  const groups: Record<string, Conversation[]> = {
    Today: [],
    Yesterday: [],
    'Last 7 Days': [],
    'Last 30 Days': [],
    Older: [],
  };

  conversations.forEach((conv) => {
    const convDate = new Date(conv.lastMessageAt);
    const convDateOnly = new Date(convDate.getFullYear(), convDate.getMonth(), convDate.getDate());

    if (convDateOnly.getTime() === today.getTime()) {
      groups.Today.push(conv);
    } else if (convDateOnly.getTime() === yesterday.getTime()) {
      groups.Yesterday.push(conv);
    } else if (convDate >= lastWeek) {
      groups['Last 7 Days'].push(conv);
    } else if (convDate >= lastMonth) {
      groups['Last 30 Days'].push(conv);
    } else {
      groups.Older.push(conv);
    }
  });

  // Filter out empty groups
  return Object.entries(groups).filter(([_, convs]) => convs.length > 0);
}

export function ConversationHistorySidebar({
  activeConversationId,
  onSelectConversation,
  className = '',
}: ConversationHistorySidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch conversations
  const { data: conversations = [], isLoading, error } = useConversations(false);
  const { data: searchResults = [] } = useSearchConversations(searchQuery);

  // Mutations
  const createConversation = useCreateConversation();
  const deleteConversation = useDeleteConversation();
  const renameConversation = useRenameConversation();
  const archiveConversation = useArchiveConversation();

  // Use search results if searching, otherwise use all conversations
  const displayedConversations = searchQuery.trim() ? searchResults : conversations;

  // Group conversations by date
  const groupedConversations = useMemo(
    () => groupConversationsByDate(displayedConversations),
    [displayedConversations]
  );

  const handleNewChat = () => {
    // Clear active conversation to start fresh
    onSelectConversation(null);
  };

  const handleRename = (conversationId: string, newTitle: string) => {
    renameConversation.mutate(conversationId, newTitle);
  };

  const handleDelete = (conversationId: string) => {
    // Soft delete - just archive the conversation
    archiveConversation.mutate({ conversationId, isArchived: true }, {
      onSuccess: () => {
        // If deleted conversation was active, clear selection
        if (conversationId === activeConversationId) {
          onSelectConversation(null);
        }
      },
    });
  };

  const handlePermanentDelete = (conversationId: string) => {
    // Hard delete - permanently remove from database
    deleteConversation.mutate(conversationId, {
      onSuccess: () => {
        // If deleted conversation was active, clear selection
        if (conversationId === activeConversationId) {
          onSelectConversation(null);
        }
      },
    });
  };

  return (
    <div className={`flex flex-col h-full bg-background border-r ${className}`}>
      {/* Header with New Chat button */}
      <div className="p-4 border-b space-y-3">
        <Button
          onClick={handleNewChat}
          className="w-full"
          variant="default"
          size="sm"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Chat
        </Button>

        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
      </div>

      {/* Conversation List */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {isLoading ? (
            // Loading skeleton
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="px-3 py-2">
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-1/2 mt-1" />
                </div>
              ))}
            </div>
          ) : error ? (
            // Error state
            <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
              <AlertCircle className="h-12 w-12 text-destructive mb-3" />
              <p className="text-sm text-muted-foreground">
                Failed to load conversations
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {error instanceof Error ? error.message : 'Unknown error'}
              </p>
            </div>
          ) : displayedConversations.length === 0 ? (
            // Empty state
            <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
              <FolderOpen className="h-12 w-12 text-muted-foreground/50 mb-3" />
              <p className="text-sm font-medium text-muted-foreground">
                {searchQuery.trim() ? 'No conversations found' : 'No conversations yet'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {searchQuery.trim()
                  ? 'Try a different search term'
                  : 'Start a new chat to begin'}
              </p>
            </div>
          ) : (
            // Conversation list grouped by date
            <div className="space-y-4">
              {groupedConversations.map(([group, convs]) => (
                <div key={group}>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase px-3 mb-2">
                    {group}
                  </h3>
                  <div className="space-y-1">
                    {convs.map((conversation) => (
                      <ConversationItem
                        key={conversation.id}
                        conversation={conversation}
                        isActive={conversation.id === activeConversationId}
                        onClick={() => onSelectConversation(conversation.id)}
                        onRename={handleRename}
                        onDelete={handleDelete}
                        onPermanentDelete={handlePermanentDelete}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Footer with conversation count */}
      {!isLoading && conversations.length > 0 && (
        <div className="p-3 border-t">
          <p className="text-xs text-muted-foreground text-center">
            {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
          </p>
        </div>
      )}
    </div>
  );
}
