import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';

import { chatApi } from '../services/api';
import {
  Message,
  User,
  ChatContextType,
  ChatProviderProps,
  createMessage,
  DEFAULT_SUGGESTIONS,
  CrisisDetection,
  CrisisSeverity,
  CrisisFollowUp,
  MILD_CRISIS_KEYWORDS,
  MODERATE_CRISIS_KEYWORDS,
  SEVERE_CRISIS_KEYWORDS,
  MILD_CRISIS_ACTIONS,
  MODERATE_CRISIS_ACTIONS,
  SEVERE_CRISIS_ACTIONS,
  EMERGENCY_CONTACTS,
  ANXIOUS_SUGGESTIONS,
  DEFAULT_SUGGESTIONS_FALLBACK,
  CRISIS_KEYWORDS,
  MessageAttachment,
  AttachmentType
} from '../types/chat';

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: ChatProviderProps): JSX.Element {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState<string>('');
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [isStreamingActive, setIsStreamingActive] = useState<boolean>(false);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
  const [showCrisisWarning, setShowCrisisWarning] = useState<boolean>(false);
  const [crisisDetection, setCrisisDetection] = useState<CrisisDetection | null>(null);
  const [crisisHistory, setCrisisHistory] = useState<CrisisDetection[]>([]);
  const [followUpReminders, setFollowUpReminders] = useState<CrisisFollowUp[]>([]);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [speechRecognitionSupported, setSpeechRecognitionSupported] = useState<boolean>(false);
  const [microphonePermission, setMicrophonePermission] = useState<'granted' | 'denied' | 'prompt' | 'checking'>('prompt');
  const [speechError, setSpeechError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null); // Using any to handle browser compatibility

  // Contextual suggestion generation function
  const generateSuggestions = useCallback((message: string, userContext: User | null): string[] => {
    // Start with the existing hardcoded suggestions as fallback
    const defaultSuggestions = ['Tell me more', 'What else?'];
    
    // Normalize message for analysis
    const lowerMessage = message.toLowerCase();
    
    // Anxiety-related suggestions
    if (lowerMessage.includes('anxious') || lowerMessage.includes('anxiety') || lowerMessage.includes('worried')) {
      return ['Try breathing exercise', 'Tell me more', 'What helps you calm down?'];
    }
    
    // Depression or sadness-related suggestions
    if (lowerMessage.includes('sad') || lowerMessage.includes('depressed') || lowerMessage.includes('down') || lowerMessage.includes('hopeless')) {
      return ['How long have you felt this way?', 'What usually lifts your mood?', 'Would you like to talk about it?'];
    }
    
    // Sleep-related suggestions
    if (lowerMessage.includes('sleep') || lowerMessage.includes('insomnia') || lowerMessage.includes('tired') || lowerMessage.includes('exhausted')) {
      return ['Tell me about your sleep routine', 'Try a relaxation technique', 'What keeps you awake?'];
    }
    
    // Stress-related suggestions
    if (lowerMessage.includes('stress') || lowerMessage.includes('overwhelmed') || lowerMessage.includes('pressure')) {
      return ['What\'s causing the most stress?', 'Let\'s try a coping strategy', 'How can I help you manage this?'];
    }
    
    // Relationship-related suggestions
    if (lowerMessage.includes('relationship') || lowerMessage.includes('partner') || lowerMessage.includes('friend') || lowerMessage.includes('family')) {
      return ['How are you feeling about this?', 'Have you talked to them about it?', 'What support do you need?'];
    }
    
    // Work-related suggestions
    if (lowerMessage.includes('work') || lowerMessage.includes('job') || lowerMessage.includes('boss') || lowerMessage.includes('career')) {
      return ['How is this affecting you?', 'What would help at work?', 'Let\'s explore your options'];
    }
    
    // Positive emotions - encourage exploration
    if (lowerMessage.includes('happy') || lowerMessage.includes('good') || lowerMessage.includes('better') || lowerMessage.includes('great')) {
      return ['That\'s wonderful to hear!', 'What contributed to this?', 'How can we build on this?'];
    }
    
    // Self-care related suggestions
    if (lowerMessage.includes('self-care') || lowerMessage.includes('taking care') || lowerMessage.includes('health')) {
      return ['What self-care works for you?', 'Let\'s create a plan', 'What small step can you take today?'];
    }
    
    // Personalization based on user context
    if (userContext) {
      const approach = (userContext as any).preferences?.therapyApproach;
      
      // Tailor suggestions based on therapy approach preference
      if (approach === 'eastern') {
        return [...defaultSuggestions, 'Try mindfulness meditation', 'Focus on present moment'];
      } else if (approach === 'western') {
        return [...defaultSuggestions, 'Let\'s analyze this situation', 'What are your thoughts about this?'];
      }
      
      // Consider user's assessment history
      const assessments = (userContext as any).completedAssessments;
      if (assessments && assessments.length > 0) {
        return [...defaultSuggestions, 'How does this relate to your recent assessment?', 'Let\'s track your progress'];
      }
    }
    
    // Return default suggestions if no specific patterns match
    return [...DEFAULT_SUGGESTIONS_FALLBACK];
  }, []);

  // Initialize speech recognition
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      setSpeechRecognitionSupported(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        console.log('🎤 Speech recognition started');
        setIsRecording(true);
        setSpeechError(null);
      };

      recognition.onresult = (event: any) => {
        let transcript = '';
        let isFinal = false;
        
        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            isFinal = true;
          }
        }
        
        setInputValue(transcript);
        
        // If the result is final and we have content, you could auto-send here
        // For now, we'll just let the user review and send manually
      };

      recognition.onend = () => {
        console.log('🎤 Speech recognition ended');
        setIsRecording(false);
      };

      recognition.onerror = (event: any) => {
        console.error('🎤 Speech recognition error:', event.error, event);
        setIsRecording(false);
        
        switch (event.error) {
          case 'audio-capture':
            setSpeechError('Microphone access denied. Please allow microphone access and try again.');
            setMicrophonePermission('denied');
            break;
          case 'not-allowed':
            setSpeechError('Microphone permission was denied. Please enable microphone access in your browser settings.');
            setMicrophonePermission('denied');
            break;
          case 'no-speech':
            setSpeechError('No speech detected. Please try speaking more clearly.');
            break;
          case 'network':
            setSpeechError('Network error occurred. Please check your internet connection.');
            break;
          default:
            setSpeechError(`Speech recognition error: ${event.error}`);
        }
      };

      recognitionRef.current = recognition;
    } else {
      setSpeechRecognitionSupported(false);
      console.warn('Speech recognition not supported in this browser');
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  // Request microphone permission
  const requestMicrophonePermission = useCallback(async (): Promise<boolean> => {
    try {
      setMicrophonePermission('checking');
      setSpeechError(null);
      
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Stop the stream immediately as we only needed permission
      stream.getTracks().forEach(track => track.stop());
      
      setMicrophonePermission('granted');
      console.log('🎤 Microphone permission granted');
      return true;
    } catch (error: any) {
      console.error('🎤 Microphone permission error:', error);
      setMicrophonePermission('denied');
      
      if (error.name === 'NotAllowedError') {
        setSpeechError('Microphone access was denied. Please allow microphone access to use speech-to-text.');
      } else if (error.name === 'NotFoundError') {
        setSpeechError('No microphone found. Please connect a microphone and try again.');
      } else {
        setSpeechError('Unable to access microphone. Please check your browser settings.');
      }
      return false;
    }
  }, []);

  const clearSpeechError = useCallback(() => {
    setSpeechError(null);
  }, []);

  // Speech recognition functions
  const toggleSpeechRecognition = useCallback(async () => {
    if (!speechRecognitionSupported || !recognitionRef.current) {
      console.warn('Speech recognition not available');
      setSpeechError('Speech recognition is not supported in this browser.');
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      return;
    }

    // Clear any previous errors
    setSpeechError(null);

    // Request microphone permission if we haven't already
    if (microphonePermission !== 'granted') {
      const permissionGranted = await requestMicrophonePermission();
      
      if (!permissionGranted) {
        return;
      }
    }

    try {
      console.log('🎤 Starting speech recognition...');
      recognitionRef.current.start();
    } catch (error: any) {
      console.error('🎤 Error starting speech recognition:', error);
      setSpeechError('Failed to start speech recognition. Please try again.');
    }
  }, [isRecording, speechRecognitionSupported, microphonePermission, requestMicrophonePermission]);

  const stopSpeechRecognition = useCallback(() => {
    if (recognitionRef.current && isRecording) {
      recognitionRef.current.stop();
    }
  }, [isRecording]);

  const scrollToBottom = (): void => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const initializeChat = useCallback((user: User): void => {
    // Store the current user for context
    setCurrentUser(user);
    
    // Only initialize once per session
    if (!isInitialized) {
      const greeting = createMessage.bot(
        `Hello ${([user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.name || 'there')}! I'm your AI wellbeing companion. I'm here to listen, support, and help guide you through your mental health journey. How are you feeling today?`,
        [...DEFAULT_SUGGESTIONS]
      );
      setMessages([greeting]);
      setIsInitialized(true);
    }
  }, [isInitialized]);

  const detectCrisisLanguage = (text: string): CrisisDetection => {
    const lowerText = text.toLowerCase();
    const detectedTriggers: string[] = [];
    let severity: CrisisSeverity | null = null;
    let recommendedActions: string[] = [];
    let requiresImmediate = false;

    // Check for severe crisis keywords first (highest priority)
    const severeMatches = SEVERE_CRISIS_KEYWORDS.filter(keyword => 
      lowerText.includes(keyword.toLowerCase())
    );
    
    if (severeMatches.length > 0) {
      severity = CrisisSeverity.SEVERE;
      detectedTriggers.push(...severeMatches);
      recommendedActions = [...SEVERE_CRISIS_ACTIONS];
      requiresImmediate = true;
    } else {
      // Check for moderate crisis keywords
      const moderateMatches = MODERATE_CRISIS_KEYWORDS.filter(keyword => 
        lowerText.includes(keyword.toLowerCase())
      );
      
      if (moderateMatches.length > 0) {
        severity = CrisisSeverity.MODERATE;
        detectedTriggers.push(...moderateMatches);
        recommendedActions = [...MODERATE_CRISIS_ACTIONS];
        requiresImmediate = moderateMatches.length >= 3; // Multiple moderate triggers = immediate
      } else {
        // Check for mild crisis keywords
        const mildMatches = MILD_CRISIS_KEYWORDS.filter(keyword => 
          lowerText.includes(keyword.toLowerCase())
        );
        
        if (mildMatches.length > 0) {
          severity = CrisisSeverity.MILD;
          detectedTriggers.push(...mildMatches);
          recommendedActions = [...MILD_CRISIS_ACTIONS];
          requiresImmediate = false;
        }
      }
    }

    const detected = detectedTriggers.length > 0;
    
    return {
      detected,
      severity,
      triggers: detectedTriggers,
      recommendedActions,
      requiresImmediate,
      emergencyContacts: requiresImmediate ? EMERGENCY_CONTACTS : undefined
    };
  };

  const handleSendMessage = async (): Promise<void> => {
    if (!inputValue.trim() && selectedFiles.length === 0) return;

    // Create attachments from selected files
    const attachments = selectedFiles.length > 0 
      ? await createAttachmentsFromFiles(selectedFiles)
      : undefined;

    const userMessage = createMessage.user(inputValue || "📎 Shared files", attachments);
    setMessages(prev => [...prev, userMessage]);
    const messageContent = inputValue;
    setInputValue('');
    clearSelectedFiles(); // Clear files after sending

    // Check for crisis language with enhanced detection
    const crisisResult = detectCrisisLanguage(messageContent);
    if (crisisResult.detected) {
      // Add to crisis history
      setCrisisHistory(prev => [...prev, { ...crisisResult, followUpScheduled: new Date() }]);
      setCrisisDetection(crisisResult);
      setShowCrisisWarning(true);
      
      // Schedule appropriate follow-ups based on severity
      if (crisisResult.severity === CrisisSeverity.SEVERE) {
        scheduleFollowUp(crisisResult, 'safety_check', 30); // 30 minutes
        scheduleFollowUp(crisisResult, 'proactive_checkin', 120); // 2 hours
      } else if (crisisResult.severity === CrisisSeverity.MODERATE) {
        scheduleFollowUp(crisisResult, 'proactive_checkin', 60); // 1 hour
        scheduleFollowUp(crisisResult, 'resource_followup', 1440); // 24 hours
      } else {
        scheduleFollowUp(crisisResult, 'proactive_checkin', 240); // 4 hours
      }
      
      let crisisMessage: string;
      if (crisisResult.severity === CrisisSeverity.SEVERE) {
        crisisMessage = 'I\'m very concerned about your safety. Please call 988 (Suicide Prevention Lifeline) immediately or go to your nearest emergency room. You don\'t have to go through this alone.';
      } else if (crisisResult.severity === CrisisSeverity.MODERATE) {
        crisisMessage = 'I\'m concerned about how you\'re feeling. Please consider reaching out to a mental health professional or trusted person for support. Your feelings are valid and help is available.';
      } else {
        crisisMessage = 'I notice you\'re going through a difficult time. Remember that it\'s okay to ask for help, and support is available when you need it.';
      }
      
      const systemMessage = createMessage.system(crisisMessage);
      setMessages(prev => [...prev, systemMessage]);
      return;
    }

    // Create placeholder bot message with isTyping=true
    const placeholderBotMessage = createMessage.bot('', undefined, undefined, true);
    setMessages(prev => [...prev, placeholderBotMessage]);
    setIsStreamingActive(true);
    setStreamingMessageId(placeholderBotMessage.id);
    setIsTyping(true);
    
    // Prepare user context and message history for better AI responses
    const userContext = currentUser ? {
      name: currentUser.firstName,
      recentMoods: (currentUser as any).recentMoods || [],
      completedAssessments: (currentUser as any).completedAssessments || [],
      preferredApproach: (currentUser as any).preferences?.therapyApproach
    } : undefined;

    const messageHistory = messages.slice(-10).map(m => ({
      role: m.type === 'user' ? 'user' as const : 'assistant' as const,
      content: m.content
    }));
    
    try {
      console.log('🚀 Starting streaming response for message:', messageContent);
      
      // Try streaming first with context
      const stream = await chatApi.streamMessage(messageContent, {
        userContext,
        messageHistory
      });
      const reader = stream.getReader();
      const decoder = new TextDecoder();
      
      let accumulatedContent = '';
      let isFirstChunk = true;
      
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          console.log('✅ Streaming completed');
          break;
        }
        
        const chunk = decoder.decode(value, { stream: true });
        console.log('📦 Received chunk:', chunk);
        
        // Parse potential JSON chunks (in case the backend sends structured data)
        const lines = chunk.split('\n').filter(line => line.trim());
        
        for (const line of lines) {
          try {
            if (line.startsWith('data: ')) {
              const jsonData = line.substring(6);
              if (jsonData === '[DONE]') {
                continue;
              }
              
              const parsed = JSON.parse(jsonData);
              if (parsed.content) {
                accumulatedContent += parsed.content;
              }
            } else {
              // Treat as plain text
              accumulatedContent += chunk;
            }
          } catch (parseError) {
            // If not JSON, treat as plain text
            accumulatedContent += line;
          }
        }
        
        // Update the message content incrementally
        setMessages(prev => prev.map(msg => 
          msg.id === placeholderBotMessage.id 
            ? { 
                ...msg, 
                content: accumulatedContent,
                isStreaming: true,
                streamingComplete: false
              } as Message
            : msg
        ));
        
        // Remove typing indicator after first chunk
        if (isFirstChunk) {
          setIsTyping(false);
          isFirstChunk = false;
        }
      }
      
      // Finalize the message with personalized suggestions
      const suggestions = generateSuggestions(messageContent, currentUser);

      setMessages(prev => prev.map(msg => 
        msg.id === placeholderBotMessage.id 
          ? { 
              ...msg, 
              content: accumulatedContent || 'I apologize, but I encountered an issue generating a response.',
              suggestions,
              isStreaming: false,
              streamingComplete: true
            } as Message
          : msg
      ));
      
    } catch (streamError) {
      console.warn('⚠️ Streaming failed, falling back to regular API:', streamError);
      
      try {
        // Fallback to regular API with context
        const response = await chatApi.sendMessage(messageContent, {
          userContext,
          messageHistory
        });
        console.log('📥 Fallback API response:', response);
        
        if (response.success && response.data) {
          const suggestions = generateSuggestions(messageContent, currentUser);

          setMessages(prev => prev.map(msg => 
            msg.id === placeholderBotMessage.id 
              ? { 
                  ...msg, 
                  content: response.data.message?.content || response.data.response || 'I apologize, but I encountered an issue generating a response.',
                  suggestions,
                  isStreaming: false,
                  streamingComplete: true
                } as Message
              : msg
          ));
        } else {
          // Final fallback
          setMessages(prev => prev.map(msg => 
            msg.id === placeholderBotMessage.id 
              ? { 
                  ...msg, 
                  content: 'I\'m having trouble connecting right now, but I\'m here to listen. Could you tell me more about how you\'re feeling?',
                  isStreaming: false,
                  streamingComplete: true
                } as Message
              : msg
          ));
        }
      } catch (fallbackError) {
        console.error('❌ Both streaming and fallback API failed:', fallbackError);
        
        // Ultimate fallback
        setMessages(prev => prev.map(msg => 
          msg.id === placeholderBotMessage.id 
            ? { 
                ...msg, 
                content: 'I\'m experiencing some technical difficulties right now. In the meantime, please know that I\'m here to support you. What would you like to talk about?',
                isStreaming: false,
                streamingComplete: true
              } as Message
            : msg
        ));
      }
    } finally {
      setIsStreamingActive(false);
      setStreamingMessageId(null);
      setIsTyping(false);
    }
  };

  const handleSuggestionClick = (suggestion: string): void => {
    setInputValue(suggestion);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      // Stop speech recognition if active before sending
      if (isRecording) {
        stopSpeechRecognition();
      }
      handleSendMessage();
    }
    // ESC key to stop speech recognition
    if (e.key === 'Escape' && isRecording) {
      e.preventDefault();
      stopSpeechRecognition();
    }
  };

  // File handling functions
  const handleFileSelect = useCallback((files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const validFiles = fileArray.filter(file => {
      // Basic file validation - can be extended
      const maxSize = 10 * 1024 * 1024; // 10MB
      const allowedTypes = ['image/', 'application/pdf', 'video/', 'text/'];
      
      return file.size <= maxSize && 
             allowedTypes.some(type => file.type.startsWith(type));
    });
    
    setSelectedFiles(prev => [...prev, ...validFiles]);
  }, []);

  const removeSelectedFile = useCallback((index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  const clearSelectedFiles = useCallback(() => {
    setSelectedFiles([]);
  }, []);

  // Helper function to create attachments from files
  const createAttachmentsFromFiles = (files: File[]): Promise<MessageAttachment[]> => {
    return Promise.all(files.map(async (file) => {
      const url = URL.createObjectURL(file);
      
      // Determine attachment type based on file type
      let type: AttachmentType;
      if (file.type.startsWith('image/')) {
        type = AttachmentType.IMAGE;
      } else if (file.type === 'application/pdf') {
        type = AttachmentType.PDF;
      } else if (file.type.startsWith('video/')) {
        type = AttachmentType.VIDEO;
      } else {
        type = AttachmentType.LINK; // Fallback for other file types
      }

      return {
        type,
        url,
        name: file.name,
        size: file.size,
        mimeType: file.type,
        thumbnail: file.type.startsWith('image/') ? url : undefined
      };
    }));
  };

  // Follow-up mechanism functions
  const getFollowUpMessage = (type: CrisisFollowUp['type'], severity: CrisisSeverity | null): string => {
    switch (type) {
      case 'proactive_checkin':
        if (severity === CrisisSeverity.SEVERE) {
          return "Hi, I wanted to check in with you. How are you feeling right now? Remember, support is always available if you need it.";
        } else if (severity === CrisisSeverity.MODERATE) {
          return "I wanted to follow up on our earlier conversation. How have you been doing? Is there anything specific you'd like to talk about?";
        } else {
          return "Just checking in to see how you're feeling today. Sometimes it helps to have someone to talk to.";
        }
      case 'resource_followup':
        return "I wanted to follow up about the resources we discussed. Have you had a chance to look into any of them, or would you like more specific recommendations?";
      case 'safety_check':
        return "I'm checking in because I care about your safety. How are you feeling right now? If you're having thoughts of hurting yourself, please reach out for help immediately.";
      default:
        return "How are you doing? I'm here if you need someone to talk to.";
    }
  };

  const checkPendingFollowUps = useCallback(() => {
    const now = new Date();
    const pendingFollowUps = followUpReminders.filter(
      followUp => !followUp.completed && followUp.scheduledTime <= now
    );

    pendingFollowUps.forEach(followUp => {
      // Create a system message for the follow-up
      const followUpMessage = createMessage.system(followUp.message);
      setMessages(prev => [...prev, followUpMessage]);
      
      // Mark as completed
      setFollowUpReminders(prev =>
        prev.map(f => f.id === followUp.id ? { ...f, completed: true } : f)
      );
    });
  }, [followUpReminders]);

  const scheduleFollowUp = useCallback((detection: CrisisDetection, type: CrisisFollowUp['type'], delayMinutes: number) => {
    const followUpId = Math.random().toString(36).substring(2, 15);
    const scheduledTime = new Date(Date.now() + delayMinutes * 60 * 1000);
    
    const followUp: CrisisFollowUp = {
      id: followUpId,
      userId: currentUser?.id || 'anonymous',
      crisisDetectionId: `crisis_${Date.now()}`,
      scheduledTime,
      completed: false,
      type,
      message: getFollowUpMessage(type, detection.severity)
    };

    setFollowUpReminders(prev => [...prev, followUp]);
    
    // Schedule automatic follow-up
    setTimeout(() => {
      checkPendingFollowUps();
    }, delayMinutes * 60 * 1000);
  }, [currentUser, checkPendingFollowUps]);

  // Check for pending follow-ups on mount and periodically
  useEffect(() => {
    checkPendingFollowUps();
    const interval = setInterval(checkPendingFollowUps, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [checkPendingFollowUps]);

  const value: ChatContextType = {
    messages,
    inputValue,
    isTyping,
    isStreamingActive,
    streamingMessageId,
    showCrisisWarning,
    crisisDetection,
    crisisHistory,
    followUpReminders,
    selectedFiles,
    isDragOver,
    isRecording,
    speechRecognitionSupported,
    microphonePermission,
    speechError,
    messagesEndRef,
    setInputValue,
    setShowCrisisWarning,
    setCrisisDetection,
    scheduleFollowUp,
    checkPendingFollowUps,
    handleSendMessage,
    handleSuggestionClick,
    handleKeyPress,
    handleFileSelect,
    removeSelectedFile,
    clearSelectedFiles,
    toggleSpeechRecognition,
    stopSpeechRecognition,
    requestMicrophonePermission,
    clearSpeechError,
    detectCrisisLanguage,
    initializeChat
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChatContext(): ChatContextType {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
}