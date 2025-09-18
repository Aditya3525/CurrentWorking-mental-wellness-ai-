import { Bot } from 'lucide-react';
import React, { useCallback, useRef, useEffect, useMemo } from 'react';
import { VariableSizeList as List } from 'react-window';

import { Message, getMessageGroupInfo } from '../../../types/chat';
import { MessageHeightCalculator } from '../../../utils/messageHeightCalculator';

interface VirtualizedMessageListProps {
  messages: Message[];
  isTyping: boolean;
  containerHeight: number;
  containerWidth: number;
  onScroll?: (scrollOffset: number) => void;
  scrollToBottom?: boolean;
  MessageBubble: React.ComponentType<{
    message: Message;
    isConsecutive?: boolean;
    isLastInGroup?: boolean;
  }>;
}

interface ListItemProps {
  index: number;
  style: React.CSSProperties;
  data: {
    messages: Message[];
    isTyping: boolean;
    MessageBubble: VirtualizedMessageListProps['MessageBubble'];
    heightCalculator: MessageHeightCalculator;
  };
}

const ListItem = React.memo(({ index, style, data }: ListItemProps) => {
  const { messages, isTyping, MessageBubble } = data;
  
  // Handle typing indicator (shown as last item)
  if (index === messages.length && isTyping) {
    return (
      <div style={style}>
        <div className="flex gap-3 justify-start mb-4 px-4">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <Bot className="h-4 w-4 text-primary" />
          </div>
          <div className="bg-muted rounded-2xl px-4 py-3">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const message = messages[index];
  if (!message) return null;

  const groupInfo = getMessageGroupInfo(messages, index);

  return (
    <div style={style}>
      <div className="px-4">
        <MessageBubble
          message={message}
          isConsecutive={groupInfo.isConsecutive}
          isLastInGroup={groupInfo.isLastInGroup}
        />
      </div>
    </div>
  );
});

ListItem.displayName = 'ListItem';

export function VirtualizedMessageList({
  messages,
  isTyping,
  containerHeight,
  containerWidth,
  onScroll,
  scrollToBottom = false,
  MessageBubble
}: VirtualizedMessageListProps): JSX.Element {
  const listRef = useRef<List>(null);
  const heightCalculator = useMemo(
    () => new MessageHeightCalculator({
      containerWidth,
      messageMaxWidth: containerWidth * 0.8
    }),
    [containerWidth]
  );

  // Calculate total number of items (messages + typing indicator)
  const itemCount = messages.length + (isTyping ? 1 : 0);

  // Memoized item data to prevent unnecessary re-renders
  const itemData = useMemo(() => ({
    messages,
    isTyping,
    MessageBubble,
    heightCalculator
  }), [messages, isTyping, MessageBubble, heightCalculator]);

  // Calculate item height
  const getItemHeight = useCallback((index: number): number => {
    // Typing indicator height
    if (index === messages.length && isTyping) {
      return MessageHeightCalculator.getTypingIndicatorHeight();
    }

    const message = messages[index];
    if (!message) {
      return MessageHeightCalculator.getEstimatedHeight({} as Message);
    }

    const groupInfo = getMessageGroupInfo(messages, index);
    return heightCalculator.calculateMessageHeight(
      message,
      groupInfo.isConsecutive,
      groupInfo.isLastInGroup
    );
  }, [messages, isTyping, heightCalculator]);

  // Scroll to bottom when requested
  useEffect(() => {
    if (scrollToBottom && listRef.current && itemCount > 0) {
      // Use requestAnimationFrame to ensure the list has rendered
      requestAnimationFrame(() => {
        listRef.current?.scrollToItem(itemCount - 1, 'end');
      });
    }
  }, [scrollToBottom, itemCount, messages.length]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (listRef.current && messages.length > 0) {
      // Check if user is near bottom before auto-scrolling
      const list = listRef.current;
      const scrollElement = (list as unknown as { _outerRef: HTMLElement })._outerRef;
      const scrollOffset = scrollElement.scrollTop;
      const scrollHeight = scrollElement.scrollHeight;
      const clientHeight = containerHeight;
      
      // If user is within 100px of bottom, auto-scroll
      if (scrollHeight - scrollOffset - clientHeight < 100) {
        setTimeout(() => {
          list.scrollToItem(itemCount - 1, 'end');
        }, 50);
      }
    }
  }, [messages.length, itemCount, containerHeight]);

  // Handle scroll events
  const handleScroll = useCallback(({ scrollOffset }: { scrollOffset: number }) => {
    onScroll?.(scrollOffset);
  }, [onScroll]);

  // Reset height cache when container width changes
  useEffect(() => {
    heightCalculator.updateOptions({
      containerWidth,
      messageMaxWidth: containerWidth * 0.8
    });
    
    // Reset item heights in the list
    if (listRef.current) {
      listRef.current.resetAfterIndex(0);
    }
  }, [containerWidth, heightCalculator]);

  // Provide public methods for scrolling
  useEffect(() => {
    const scrollToBottomMethod = () => {
      if (listRef.current && itemCount > 0) {
        listRef.current.scrollToItem(itemCount - 1, 'end');
      }
    };

    // Store method for potential external access
    if (listRef.current) {
      (listRef.current as { scrollToBottom?: () => void }).scrollToBottom = scrollToBottomMethod;
    }
  }, [itemCount]);

  return (
    <List
      ref={listRef}
      height={containerHeight}
      width={containerWidth}
      itemCount={itemCount}
      itemSize={getItemHeight}
      itemData={itemData}
      overscanCount={5} // Render 5 extra items for smooth scrolling
      onScroll={handleScroll}
      className="scrollbar-thin scrollbar-track-transparent scrollbar-thumb-muted-foreground/20"
    >
      {ListItem}
    </List>
  );
}

// Export for external scroll control
export interface VirtualizedMessageListRef {
  scrollToBottom: () => void;
  scrollToItem: (index: number, align?: 'auto' | 'start' | 'center' | 'end') => void;
}

export const VirtualizedMessageListWithRef = React.forwardRef<
  VirtualizedMessageListRef,
  VirtualizedMessageListProps
>(({ messages, isTyping, containerHeight, containerWidth, onScroll, MessageBubble }, ref) => {
  const listRef = useRef<List>(null);
  const heightCalculator = useMemo(
    () => new MessageHeightCalculator({
      containerWidth,
      messageMaxWidth: containerWidth * 0.8
    }),
    [containerWidth]
  );

  const itemCount = messages.length + (isTyping ? 1 : 0);

  const itemData = useMemo(() => ({
    messages,
    isTyping,
    MessageBubble,
    heightCalculator
  }), [messages, isTyping, MessageBubble, heightCalculator]);

  const getItemHeight = useCallback((index: number): number => {
    if (index === messages.length && isTyping) {
      return MessageHeightCalculator.getTypingIndicatorHeight();
    }

    const message = messages[index];
    if (!message) {
      return MessageHeightCalculator.getEstimatedHeight({} as Message);
    }

    const groupInfo = getMessageGroupInfo(messages, index);
    return heightCalculator.calculateMessageHeight(
      message,
      groupInfo.isConsecutive,
      groupInfo.isLastInGroup
    );
  }, [messages, isTyping, heightCalculator]);

  const handleScroll = useCallback(({ scrollOffset }: { scrollOffset: number }) => {
    onScroll?.(scrollOffset);
  }, [onScroll]);

  // Expose methods through ref
  React.useImperativeHandle(ref, () => ({
    scrollToBottom: () => {
      if (listRef.current && itemCount > 0) {
        listRef.current.scrollToItem(itemCount - 1, 'end');
      }
    },
    scrollToItem: (index: number, align: 'auto' | 'start' | 'center' | 'end' = 'auto') => {
      if (listRef.current) {
        listRef.current.scrollToItem(index, align);
      }
    }
  }), [itemCount]);

  useEffect(() => {
    heightCalculator.updateOptions({
      containerWidth,
      messageMaxWidth: containerWidth * 0.8
    });
    
    if (listRef.current) {
      listRef.current.resetAfterIndex(0);
    }
  }, [containerWidth, heightCalculator]);

  return (
    <List
      ref={listRef}
      height={containerHeight}
      width={containerWidth}
      itemCount={itemCount}
      itemSize={getItemHeight}
      itemData={itemData}
      overscanCount={5}
      onScroll={handleScroll}
      className="scrollbar-thin scrollbar-track-transparent scrollbar-thumb-muted-foreground/20"
    >
      {ListItem}
    </List>
  );
});

VirtualizedMessageListWithRef.displayName = 'VirtualizedMessageListWithRef';