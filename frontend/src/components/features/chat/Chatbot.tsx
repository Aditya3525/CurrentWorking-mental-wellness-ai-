import { 
  ArrowLeft,
  AlertTriangle,
  Bot,
  Loader2,
  MessageCircle,
  Mic,
  MoreHorizontal,
  Paperclip,
  Phone,
  Send,
  User,
  X,
  Download,
  FileText,
  Image,
  Video,
  ExternalLink
} from 'lucide-react';
import React, { useEffect, useState, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { useChatContext } from '../../../contexts/ChatContext';
import {
  Message,
  ChatbotProps,
  isUserMessage,
  isSystemMessage,
  isBotMessage,
  CrisisSeverity,
  getMessageGroupInfo,
  MessageAttachment,
  AttachmentType
} from '../../../types/chat';

import { Button } from '../../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Input } from '../../ui/input';

import { EmergencyContacts } from './EmergencyContacts';
import { VirtualizedMessageListWithRef, VirtualizedMessageListRef } from './VirtualizedMessageList';

export function Chatbot({ user, onNavigate, isModal = false, onClose }: ChatbotProps): JSX.Element {
  const [showFullEmergencyContacts, setShowFullEmergencyContacts] = useState<boolean>(false);
  const [containerDimensions, setContainerDimensions] = useState({ width: 0, height: 0 });
  const virtualizedListRef = useRef<VirtualizedMessageListRef>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const {
    messages,
    inputValue,
    isTyping,
    showCrisisWarning,
    crisisDetection,
    selectedFiles,
    isRecording,
    speechRecognitionSupported,
    microphonePermission,
    speechError,
    messagesEndRef,
    setInputValue,
    setShowCrisisWarning,
    handleSendMessage,
    handleSuggestionClick,
    handleKeyPress,
    handleFileSelect,
    removeSelectedFile,
    clearSelectedFiles,
    toggleSpeechRecognition,
    stopSpeechRecognition,
    clearSpeechError,
    initializeChat
  } = useChatContext();

  // Initialize chat when component mounts or user changes
  useEffect(() => {
    initializeChat(user);
  }, [user, initializeChat]);

  // Track container dimensions for virtualization
  useEffect(() => {
    const updateDimensions = () => {
      if (messagesContainerRef.current) {
        const { clientWidth, clientHeight } = messagesContainerRef.current;
        setContainerDimensions({ width: clientWidth, height: clientHeight });
      }
    };

    // Initial measurement
    updateDimensions();

    // Set up resize observer
    const resizeObserver = new ResizeObserver(updateDimensions);
    if (messagesContainerRef.current) {
      resizeObserver.observe(messagesContainerRef.current);
    }

    // Also listen to window resize as backup
    window.addEventListener('resize', updateDimensions);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateDimensions);
    };
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (virtualizedListRef.current && messages.length > 0) {
      // Small delay to ensure the list has rendered the new message
      setTimeout(() => {
        virtualizedListRef.current?.scrollToBottom();
      }, 50);
    }
  }, [messages.length]);

  // Scroll to bottom when typing state changes
  useEffect(() => {
    if (isTyping && virtualizedListRef.current) {
      setTimeout(() => {
        virtualizedListRef.current?.scrollToBottom();
      }, 100);
    }
  }, [isTyping]);

  // Component for rendering different attachment types
  const AttachmentRenderer = ({ attachment }: { attachment: MessageAttachment }): JSX.Element => {
    const handleDownload = () => {
      const link = document.createElement('a');
      link.href = attachment.url;
      link.download = attachment.name;
      link.click();
    };

    const getAttachmentIcon = () => {
      switch (attachment.type) {
        case AttachmentType.IMAGE:
          return <Image className="h-4 w-4" />;
        case AttachmentType.VIDEO:
          return <Video className="h-4 w-4" />;
        case AttachmentType.PDF:
          return <FileText className="h-4 w-4" />;
        case AttachmentType.LINK:
          return <ExternalLink className="h-4 w-4" />;
        default:
          return <Paperclip className="h-4 w-4" />;
      }
    };

    const formatFileSize = (bytes: number): string => {
      if (bytes === 0) return '0 B';
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

        // Render based on attachment type
        switch (attachment.type) {
          case AttachmentType.IMAGE:
            return (
              <div className="mt-2 max-w-sm">
                <button
                  type="button"
                  onClick={() => window.open(attachment.url, '_blank')}
                  className="block rounded-lg border overflow-hidden hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <img 
                    src={attachment.url} 
                    alt={attachment.name}
                    className="max-w-full h-auto"
                  />
                </button>
                <div className="flex items-center justify-between mt-1 text-xs text-muted-foreground">
                  <span>{attachment.name}</span>
                  {attachment.size && <span>{formatFileSize(attachment.size)}</span>}
                </div>
              </div>
            );

          case AttachmentType.VIDEO:
            return (
              <div className="mt-2 max-w-sm">
                <video 
                  src={attachment.url}
                  controls
                  className="rounded-lg border max-w-full h-auto"
                >
                  <track kind="captions" srcLang="en" label="English captions" />
                  Your browser does not support the video tag.
                </video>
                <div className="flex items-center justify-between mt-1 text-xs text-muted-foreground">
                  <span>{attachment.name}</span>
                  {attachment.size && <span>{formatFileSize(attachment.size)}</span>}
                </div>
              </div>
            );      default:
        // Generic file attachment
        return (
          <div className="mt-2 p-3 border rounded-lg bg-muted/50 max-w-sm">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-muted flex items-center justify-center">
                {getAttachmentIcon()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{attachment.name}</p>
                {attachment.size && (
                  <p className="text-xs text-muted-foreground">{formatFileSize(attachment.size)}</p>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDownload}
                className="h-8 w-8 p-0"
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
        );
    }
  };

  const MessageBubble = ({ 
    message, 
    isConsecutive = false, 
    isLastInGroup = true 
  }: { 
    message: Message; 
    isConsecutive?: boolean; 
    isLastInGroup?: boolean; 
  }): JSX.Element => {
    const isUser = isUserMessage(message);
    const isSystem = isSystemMessage(message);

    return (
      <div className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'} ${
        isLastInGroup ? 'mb-4' : 'mb-1'
      }`}>
        {!isUser && (
          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
            isSystem ? 'bg-amber-100' : 'bg-primary/10'
          } ${isConsecutive ? 'opacity-0' : 'opacity-100'}`}>
            {isSystem ? (
              <AlertTriangle className="h-4 w-4 text-amber-600" />
            ) : (
              <Bot className="h-4 w-4 text-primary" />
            )}
          </div>
        )}
        
        <div className={`max-w-[80%] ${isUser ? 'order-1' : 'order-2'}`}>
          <div
            className={`px-4 py-3 ${
              isUser
                ? 'bg-primary text-primary-foreground ml-auto'
                : isSystem
                ? 'bg-amber-50 border border-amber-200 text-amber-800'
                : 'bg-muted'
            } ${
              // Adjust border radius for message grouping
              (() => {
                if (!isConsecutive && isLastInGroup) {
                  return 'rounded-2xl'; // Single message
                } else if (!isConsecutive && !isLastInGroup) {
                  return isUser 
                    ? 'rounded-2xl rounded-br-md' // First in group (user)
                    : 'rounded-2xl rounded-bl-md'; // First in group (bot/system)
                } else if (isConsecutive && !isLastInGroup) {
                  return isUser
                    ? 'rounded-r-2xl rounded-l-md' // Middle in group (user)
                    : 'rounded-l-2xl rounded-r-md'; // Middle in group (bot/system)
                } else { // isConsecutive && isLastInGroup
                  return isUser
                    ? 'rounded-2xl rounded-tr-md' // Last in group (user)
                    : 'rounded-2xl rounded-tl-md'; // Last in group (bot/system)
                }
              })()
            }`}
          >
            {/* Conditional content rendering - Markdown for bot messages, plain text for others */}
            {isBotMessage(message) && !isSystem ? (
              <div className="markdown-content text-sm leading-relaxed">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    // Custom component overrides to match app styling
                    p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                    h1: ({ children }) => <h1 className="text-base font-semibold mb-2 text-foreground">{children}</h1>,
                    h2: ({ children }) => <h2 className="text-sm font-semibold mb-2 text-foreground">{children}</h2>,
                    h3: ({ children }) => <h3 className="text-sm font-medium mb-1 text-foreground">{children}</h3>,
                    h4: ({ children }) => <h4 className="text-sm font-medium mb-1 text-foreground">{children}</h4>,
                    ul: ({ children }) => <ul className="list-disc list-inside space-y-1 mb-2 pl-1">{children}</ul>,
                    ol: ({ children }) => <ol className="list-decimal list-inside space-y-1 mb-2 pl-1">{children}</ol>,
                    li: ({ children }) => <li className="text-sm leading-relaxed">{children}</li>,
                    code: ({ children }) => (
                      <code className="bg-muted/60 text-foreground px-1.5 py-0.5 rounded text-xs font-mono border">
                        {children}
                      </code>
                    ),
                    pre: ({ children }) => (
                      <pre className="bg-muted/60 border rounded-md p-3 mt-2 mb-2 text-xs font-mono overflow-x-auto">
                        {children}
                      </pre>
                    ),
                    blockquote: ({ children }) => (
                      <blockquote className="border-l-4 border-muted-foreground/30 pl-4 my-2 italic text-muted-foreground">
                        {children}
                      </blockquote>
                    ),
                    strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
                    em: ({ children }) => <em className="italic">{children}</em>,
                    a: ({ href, children }) => (
                      <a 
                        href={href} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:text-primary/80 underline underline-offset-2"
                      >
                        {children}
                      </a>
                    ),
                    table: ({ children }) => (
                      <div className="overflow-x-auto my-2">
                        <table className="min-w-full border border-muted">{children}</table>
                      </div>
                    ),
                    thead: ({ children }) => <thead className="bg-muted/50">{children}</thead>,
                    tbody: ({ children }) => <tbody>{children}</tbody>,
                    tr: ({ children }) => <tr className="border-b border-muted last:border-b-0">{children}</tr>,
                    th: ({ children }) => <th className="text-left p-2 text-xs font-medium">{children}</th>,
                    td: ({ children }) => <td className="p-2 text-xs">{children}</td>,
                    hr: () => <hr className="my-3 border-muted" />
                  }}
                >
                  {message.content}
                </ReactMarkdown>
                
                {/* Streaming indicator for bot messages */}
                {isBotMessage(message) && message.isStreaming && !message.streamingComplete && (
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-primary/60 rounded-full animate-pulse"></div>
                      <div className="w-2 h-2 bg-primary/60 rounded-full animate-pulse" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-primary/60 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    <span className="text-xs text-muted-foreground">AI is responding...</span>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <p className="text-sm leading-relaxed">{message.content}</p>
              </div>
            )}
            
            {/* Streaming indicator for empty bot messages (outside the conditional) */}
            {isBotMessage(message) && !message.content && message.isStreaming && (
              <div className="flex items-center gap-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-primary/60 rounded-full animate-pulse"></div>
                  <div className="w-2 h-2 bg-primary/60 rounded-full animate-pulse" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-primary/60 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <span className="text-xs text-muted-foreground">AI is thinking...</span>
              </div>
            )}
            
            {/* Render attachments if present */}
            {message.attachments && message.attachments.length > 0 && (
              <div className="space-y-2">
                {message.attachments.map((attachment, index) => (
                  <AttachmentRenderer key={index} attachment={attachment} />
                ))}
              </div>
            )}
          </div>
          
          {/* Only show timestamp for last message in group */}
          {isLastInGroup && (
            <div className={`flex items-center gap-2 mt-1 text-xs text-muted-foreground ${
              isUser ? 'justify-end' : 'justify-start'
            }`}>
              <span>{message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          )}

          {/* Suggestions - only for bot messages, last message in group, and after streaming is complete */}
          {isBotMessage(message) && message.suggestions && isLastInGroup && message.streamingComplete !== false && (
            <div className="flex flex-wrap gap-2 mt-3">
              {message.suggestions.map((suggestion, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  {suggestion}
                </Button>
              ))}
            </div>
          )}
        </div>

        {isUser && (
          <div className={`w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0 ${
            isConsecutive ? 'opacity-0' : 'opacity-100'
          }`}>
            <User className="h-4 w-4 text-primary-foreground" />
          </div>
        )}
      </div>
    );
  };

  const chatContent = (
    <>
      {/* Header */}
      <div className={`border-b p-4 ${isModal ? '' : 'bg-gradient-to-r from-primary/10 to-accent/10'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {!isModal && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => onNavigate('dashboard')}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            )}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                <MessageCircle className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h1 className="font-semibold">AI Wellbeing Companion</h1>
                <p className="text-xs text-muted-foreground">Always here to listen</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isModal && onClose && (
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            )}
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Messages - Virtualized List */}
      <div ref={messagesContainerRef} className="flex-1 overflow-hidden">
        {containerDimensions.width > 0 && containerDimensions.height > 0 && (
          <VirtualizedMessageListWithRef
            ref={virtualizedListRef}
            messages={messages}
            isTyping={isTyping}
            containerHeight={containerDimensions.height}
            containerWidth={containerDimensions.width}
            MessageBubble={MessageBubble}
          />
        )}
        
        {/* Fallback for initial render while dimensions are being measured */}
        {containerDimensions.width === 0 && (
          <div className="p-4">
            {messages.slice(-5).map((message, index) => {
              const groupInfo = getMessageGroupInfo(messages, index + Math.max(0, messages.length - 5));
              return (
                <MessageBubble 
                  key={message.id} 
                  message={message} 
                  isConsecutive={groupInfo.isConsecutive}
                  isLastInGroup={groupInfo.isLastInGroup}
                />
              );
            })}
            
            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex gap-3 justify-start">
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
            )}
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t p-4">
        {/* Speech Error Display */}
        {speechError && (
          <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-red-700">{speechError}</p>
              <button
                onClick={clearSpeechError}
                className="text-xs text-red-600 hover:text-red-800 underline mt-1"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Selected Files Preview */}
        {selectedFiles.length > 0 && (
          <div className="mb-3 space-y-2">
            <div className="text-xs text-muted-foreground font-medium">
              {selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''} selected:
            </div>
            <div className="flex flex-wrap gap-2">
              {selectedFiles.map((file, index) => (
                <div key={index} className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2 text-sm">
                  <Paperclip className="h-4 w-4" />
                  <span className="truncate max-w-32">{file.name}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                    onClick={() => removeSelectedFile(index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div className="flex gap-2">
          <div className="flex-1 relative">
            {/* Speech recognition indicator */}
            {isRecording && (
              <div className="absolute -top-8 left-0 right-0 flex items-center justify-center">
                <div className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-2 animate-pulse">
                  <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>
                  Listening...
                </div>
              </div>
            )}
            
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={isRecording ? "Listening..." : "Share what's on your mind..."}
              className="pr-20"
              disabled={isRecording}
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 w-6 p-0" 
                onClick={() => document.getElementById('file-upload')?.click()}
                aria-label="Attach file"
              >
                <Paperclip className="h-4 w-4" />
              </Button>
              <input
                id="file-upload"
                type="file"
                multiple
                className="hidden"
                accept="image/*,application/pdf,video/*,.txt,.doc,.docx"
                onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
                aria-label="Select files to attach"
              />
              <Button 
                variant="ghost" 
                size="sm" 
                className={`h-6 w-6 p-0 ${
                  isRecording ? 'text-red-500 animate-pulse' : ''
                } ${
                  !speechRecognitionSupported || microphonePermission === 'denied' 
                    ? 'opacity-50 cursor-not-allowed' 
                    : ''
                } ${
                  microphonePermission === 'checking' ? 'animate-spin' : ''
                }`}
                onClick={speechRecognitionSupported ? toggleSpeechRecognition : undefined}
                disabled={!speechRecognitionSupported || microphonePermission === 'checking'}
                aria-label={
                  isRecording 
                    ? "Stop recording" 
                    : microphonePermission === 'denied'
                      ? "Microphone access denied"
                      : microphonePermission === 'checking'
                        ? "Requesting microphone access"
                        : "Start voice message"
                }
                title={
                  !speechRecognitionSupported 
                    ? "Speech recognition not supported in this browser" 
                    : microphonePermission === 'denied'
                      ? "Microphone access denied. Click to try again."
                      : microphonePermission === 'checking'
                        ? "Requesting microphone permission..."
                        : isRecording 
                          ? "Click to stop recording" 
                          : "Click to start voice message"
                }
              >
                <Mic className={`h-4 w-4 ${
                  isRecording ? 'text-red-500' : ''
                } ${
                  microphonePermission === 'denied' ? 'text-muted-foreground' : ''
                }`} />
              </Button>
            </div>
          </div>
          <Button 
            onClick={handleSendMessage}
            disabled={(!inputValue.trim() && selectedFiles.length === 0) || isTyping}
            size="sm"
          >
            {isTyping ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </>
  );

  if (isModal) {
    return <div className="flex flex-col h-full">{chatContent}</div>;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {chatContent}

      {/* Enhanced Crisis Warning Modal with Severity-based Responses */}
      {showCrisisWarning && crisisDetection && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg">
            <CardHeader>
              <CardTitle className={`flex items-center gap-2 ${
                crisisDetection.severity === CrisisSeverity.SEVERE 
                  ? 'text-red-600' 
                  : crisisDetection.severity === CrisisSeverity.MODERATE 
                  ? 'text-orange-600' 
                  : 'text-yellow-600'
              }`}>
                <AlertTriangle className="h-5 w-5" />
                {crisisDetection.severity === CrisisSeverity.SEVERE 
                  ? 'Immediate Safety Concern' 
                  : crisisDetection.severity === CrisisSeverity.MODERATE 
                  ? 'We\'re Here to Support You' 
                  : 'Checking In With You'
                }
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className={`p-3 rounded-lg ${
                crisisDetection.severity === CrisisSeverity.SEVERE 
                  ? 'bg-red-50 border border-red-200' 
                  : crisisDetection.severity === CrisisSeverity.MODERATE 
                  ? 'bg-orange-50 border border-orange-200' 
                  : 'bg-yellow-50 border border-yellow-200'
              }`}>
                {crisisDetection.severity === CrisisSeverity.SEVERE && (
                  <p className="text-sm text-red-800 font-medium">
                    I&apos;m very concerned about your safety. You mentioned: <em>&ldquo;{crisisDetection.triggers.slice(0, 2).join(', ')}&rdquo;</em>
                    {crisisDetection.triggers.length > 2 && ' and more'}. Please get immediate help - you don&apos;t have to face this alone.
                  </p>
                )}
                
                {crisisDetection.severity === CrisisSeverity.MODERATE && (
                  <p className="text-sm text-orange-800">
                    I can hear that you&apos;re struggling with feelings like: <em>&ldquo;{crisisDetection.triggers.slice(0, 3).join(', ')}&rdquo;</em>
                    {crisisDetection.triggers.length > 3 && ' and others'}. These feelings are valid, and professional support can make a real difference.
                  </p>
                )}
                
                {crisisDetection.severity === CrisisSeverity.MILD && (
                  <p className="text-sm text-yellow-800">
                    I notice you&apos;re experiencing some difficult feelings. It&apos;s completely normal to feel this way sometimes, 
                    and there are ways to work through these challenges.
                  </p>
                )}
              </div>

              {/* Recommended Actions */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Recommended Actions:</h4>
                <ul className="text-xs space-y-1 text-muted-foreground">
                  {crisisDetection.recommendedActions.slice(0, 3).map((action, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="w-1 h-1 bg-current rounded-full mt-2 flex-shrink-0"></span>
                      {action}
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="space-y-3">
                {crisisDetection.severity === CrisisSeverity.SEVERE && (
                  <>
                    <Button className="w-full bg-red-600 hover:bg-red-700" onClick={() => window.open('tel:988')}>
                      <Phone className="h-4 w-4 mr-2" />
                      Call 988 NOW (Crisis Lifeline)
                    </Button>
                    
                    <Button 
                      variant="destructive" 
                      className="w-full"
                      onClick={() => window.open('tel:911')}
                    >
                      <Phone className="h-4 w-4 mr-2" />
                      Call 911 (Emergency)
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      className="w-full border-red-300"
                      onClick={() => setShowFullEmergencyContacts(true)}
                    >
                      View All Emergency Resources
                    </Button>
                  </>
                )}
                
                {crisisDetection.severity === CrisisSeverity.MODERATE && (
                  <>
                    <Button className="w-full bg-orange-600 hover:bg-orange-700" onClick={() => window.open('tel:988')}>
                      <Phone className="h-4 w-4 mr-2" />
                      Call 988 (Crisis Support)
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      className="w-full border-orange-300"
                      onClick={() => onNavigate('help')}
                    >
                      Find Professional Support
                    </Button>
                  </>
                )}
                
                {crisisDetection.severity === CrisisSeverity.MILD && (
                  <>
                    <Button 
                      className="w-full bg-yellow-600 hover:bg-yellow-700" 
                      onClick={() => onNavigate('help')}
                    >
                      View Coping Resources
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      className="w-full border-yellow-300"
                      onClick={() => window.open('tel:988')}
                    >
                      <Phone className="h-4 w-4 mr-2" />
                      Talk to Someone (988)
                    </Button>
                  </>
                )}
                
                <Button 
                  variant="ghost" 
                  className="w-full"
                  onClick={() => setShowCrisisWarning(false)}
                >
                  Continue Conversation
                </Button>
              </div>

              {/* Emergency Contacts */}
              {crisisDetection.emergencyContacts && (
                <div className="text-xs text-muted-foreground space-y-1 border-t pt-3">
                  <p className="font-medium">24/7 Crisis Resources:</p>
                  {crisisDetection.emergencyContacts.slice(0, 3).map((contact, index) => (
                    <p key={index}>• {contact.name}: {contact.number}</p>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Full Emergency Contacts Modal */}
      {showFullEmergencyContacts && crisisDetection && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <EmergencyContacts
            contacts={crisisDetection.emergencyContacts || []}
            severity={crisisDetection.severity || CrisisSeverity.MILD}
            onCall={(url) => window.open(url)}
            onClose={() => setShowFullEmergencyContacts(false)}
          />
        </div>
      )}
    </div>
  );
}