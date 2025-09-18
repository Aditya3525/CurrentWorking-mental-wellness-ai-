import { Message } from '../types/chat';

// Constants for message sizing calculations
const MESSAGE_PADDING = 24; // 12px top + 12px bottom
const CONTAINER_HORIZONTAL_PADDING = 32; // 16px left + 16px right (px-4)
const AVATAR_HEIGHT = 32; // w-8 h-8
const MESSAGE_BUBBLE_PADDING = 24; // 12px top + 12px bottom (py-3)
const MESSAGE_BUBBLE_HORIZONTAL_PADDING = 32; // 16px left + 16px right (px-4)
const LINE_HEIGHT = 20; // Estimated line height for text
const MIN_MESSAGE_HEIGHT = 48; // Minimum height for a message bubble
const ATTACHMENT_HEIGHT = 200; // Estimated height for attachments
const TYPING_INDICATOR_HEIGHT = 80; // Height of typing indicator with padding
const CONSECUTIVE_MESSAGE_MARGIN = 4; // mb-1
const LAST_GROUP_MESSAGE_MARGIN = 16; // mb-4
const SYSTEM_MESSAGE_EXTRA_HEIGHT = 8; // Additional height for system message styling

interface MessageHeightCalculatorOptions {
  containerWidth: number;
  messageMaxWidth: number; // 80% of container width
}

export class MessageHeightCalculator {
  private canvas: HTMLCanvasElement;
  private context: CanvasRenderingContext2D;
  private options: MessageHeightCalculatorOptions;
  private heightCache: Map<string, number> = new Map();

  constructor(options: MessageHeightCalculatorOptions) {
    this.options = options;
    
    // Create a canvas for text measurement
    this.canvas = document.createElement('canvas');
    this.context = this.canvas.getContext('2d')!;
    
    // Set font for measurement (matching the app's font)
    this.context.font = '14px system-ui, -apple-system, sans-serif';
  }

  /**
   * Calculate the height of a message including all its content
   */
  calculateMessageHeight(message: Message, isConsecutive: boolean, isLastInGroup: boolean): number {
    const cacheKey = this.getCacheKey(message, isConsecutive, isLastInGroup);
    
    // Check cache first
    if (this.heightCache.has(cacheKey)) {
      return this.heightCache.get(cacheKey)!;
    }

    let height = 0;

    // Base message container padding
    height += MESSAGE_PADDING;

    // Avatar height (only for non-consecutive bot/system messages)
    if (!isConsecutive && (message.type === 'bot' || message.type === 'system')) {
      height = Math.max(height, AVATAR_HEIGHT);
    }

    // Message bubble content height
    const bubbleContentHeight = this.calculateBubbleContentHeight(message);
    height = Math.max(height, bubbleContentHeight + MESSAGE_BUBBLE_PADDING);

    // System message extra styling
    if (message.type === 'system') {
      height += SYSTEM_MESSAGE_EXTRA_HEIGHT;
    }

    // Margin between messages
    height += isLastInGroup ? LAST_GROUP_MESSAGE_MARGIN : CONSECUTIVE_MESSAGE_MARGIN;

    // Cache the result
    this.heightCache.set(cacheKey, height);
    
    return height;
  }

  /**
   * Calculate the height of message bubble content
   */
  private calculateBubbleContentHeight(message: Message): number {
    let contentHeight = 0;

    // Text content height
    if (message.content.trim()) {
      contentHeight += this.calculateTextHeight(message.content);
    }

    // Attachments height
    if (message.attachments && message.attachments.length > 0) {
      contentHeight += message.attachments.length * ATTACHMENT_HEIGHT;
    }

    // Suggestions height (for bot messages)
    if (message.type === 'bot' && message.suggestions && message.suggestions.length > 0) {
      // Estimate suggestion buttons height (typically 2-3 rows)
      const suggestionsPerRow = Math.floor(this.options.messageMaxWidth / 120); // ~120px per suggestion
      const suggestionRows = Math.ceil(message.suggestions.length / suggestionsPerRow);
      contentHeight += suggestionRows * 36; // 36px per row including margins
    }

    return Math.max(contentHeight, MIN_MESSAGE_HEIGHT);
  }

  /**
   * Calculate the height needed for text content
   */
  private calculateTextHeight(text: string): number {
    // Remove markdown formatting for basic height calculation
    const plainText = this.stripMarkdown(text);
    
    // Calculate text width and wrap lines
    // Account for both message bubble padding and container padding
    const maxTextWidth = this.options.messageMaxWidth - MESSAGE_BUBBLE_HORIZONTAL_PADDING - CONTAINER_HORIZONTAL_PADDING;
    const words = plainText.split(' ');
    
    let currentLineWidth = 0;
    let lines = 1;

    for (const word of words) {
      const wordWidth = this.context.measureText(word + ' ').width;
      
      if (currentLineWidth + wordWidth > maxTextWidth) {
        lines++;
        currentLineWidth = wordWidth;
      } else {
        currentLineWidth += wordWidth;
      }
    }

    // Add extra lines for markdown elements (headers, lists, etc.)
    const markdownLines = this.countMarkdownLines(text);
    lines += markdownLines;

    return lines * LINE_HEIGHT;
  }

  /**
   * Strip markdown formatting for text measurement
   */
  private stripMarkdown(text: string): string {
    return text
      .replace(/#{1,6}\s+/g, '') // Remove headers
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
      .replace(/\*(.*?)\*/g, '$1') // Remove italic
      .replace(/`(.*?)`/g, '$1') // Remove inline code
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links, keep text
      .replace(/^\s*[-*+]\s+/gm, '') // Remove list markers
      .replace(/^\s*\d+\.\s+/gm, '') // Remove numbered list markers
      .replace(/```[\s\S]*?```/g, '[code block]') // Replace code blocks
      .replace(/^\s*>\s+/gm, '') // Remove blockquotes
      .trim();
  }

  /**
   * Count additional lines needed for markdown elements
   */
  private countMarkdownLines(text: string): number {
    let extraLines = 0;
    
    // Headers add some extra space
    extraLines += (text.match(/#{1,6}\s+/g) || []).length * 0.5;
    
    // Lists add some extra spacing
    extraLines += (text.match(/^\s*[-*+]\s+/gm) || []).length * 0.2;
    extraLines += (text.match(/^\s*\d+\.\s+/gm) || []).length * 0.2;
    
    // Code blocks take more space
    extraLines += (text.match(/```[\s\S]*?```/g) || []).length * 2;
    
    // Blockquotes add spacing
    extraLines += (text.match(/^\s*>\s+/gm) || []).length * 0.3;

    return Math.round(extraLines);
  }

  /**
   * Generate cache key for a message
   */
  private getCacheKey(message: Message, isConsecutive: boolean, isLastInGroup: boolean): string {
    return `${message.id}-${isConsecutive}-${isLastInGroup}-${this.options.containerWidth}`;
  }

  /**
   * Clear the height cache (call when container width changes)
   */
  clearCache(): void {
    this.heightCache.clear();
  }

  /**
   * Update container options
   */
  updateOptions(options: Partial<MessageHeightCalculatorOptions>): void {
    this.options = { ...this.options, ...options };
    this.clearCache(); // Clear cache when options change
  }

  /**
   * Calculate height for typing indicator
   */
  static getTypingIndicatorHeight(): number {
    return TYPING_INDICATOR_HEIGHT;
  }

  /**
   * Get estimated height for initial render (before content is measured)
   */
  static getEstimatedHeight(message: Message): number {
    let baseHeight = MIN_MESSAGE_HEIGHT + MESSAGE_PADDING;
    
    // Add height for attachments
    if (message.attachments && message.attachments.length > 0) {
      baseHeight += message.attachments.length * ATTACHMENT_HEIGHT;
    }
    
    // Add height for long messages (rough estimate)
    if (message.content.length > 100) {
      baseHeight += Math.floor(message.content.length / 100) * LINE_HEIGHT;
    }
    
    return baseHeight;
  }
}

/**
 * Hook for using message height calculator with dynamic container width
 */
export function useMessageHeightCalculator(containerWidth: number) {
  const calculator = new MessageHeightCalculator({
    containerWidth,
    messageMaxWidth: containerWidth * 0.8 // 80% max width as per design
  });

  return calculator;
}