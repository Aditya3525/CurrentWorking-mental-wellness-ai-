import { 
  Send,
  ArrowLeft,
  MessageCircle,
  Bot,
  Loader2,
  AlertTriangle,
  Phone,
  X,
  Mic,
  Paperclip
} from 'lucide-react';
import React, { useState, useRef, useEffect } from 'react';

import { chatApi, insightsApi } from '../../../services/api';
import { Button } from '../../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';

interface ChatbotProps {
  user: {
    id?: string;
    name?: string;
    firstName?: string;
    lastName?: string;
    assessmentScores?: Record<string, number>;
  } | null;
  onNavigate: (page: string) => void;
  isModal?: boolean;
  onClose?: () => void;
}

interface Message {
  id: string;
  type: 'user' | 'bot' | 'system';
  content: string;
  timestamp: Date;
  suggestions?: string[];
  isTyping?: boolean;
}

export function Chatbot({ user, onNavigate, isModal = false, onClose }: ChatbotProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'bot',
  content: `Hello ${([user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.name || 'there')}! I'm your AI wellbeing companion. I'm here to listen, support, and help guide you through your mental health journey. How are you feeling today?`,
      timestamp: new Date()
    }
  ]);
  
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showCrisisWarning, setShowCrisisWarning] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  /* ---------- Utility: smooth scroll to bottom ---------- */
  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior, block: 'end' });
    } else if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom('auto');
  }, []); // initial

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const detectCrisisLanguage = (text: string): boolean => {
    const crisisKeywords = [
      'suicide', 'kill myself', 'end it all', 'don\'t want to live',
      'hurt myself', 'self harm', 'cutting', 'overdose',
      'hopeless', 'no point', 'better off dead'
    ];
    
    return crisisKeywords.some(keyword => 
      text.toLowerCase().includes(keyword.toLowerCase())
    );
  };

  const detectMentalHealthSummaryRequest = (text: string): boolean => {
    const summaryKeywords = [
      'mental health', 'how am i doing', 'my progress', 'overall health',
      'assessment results', 'my assessments', 'health summary', 'how\'s my mental health',
      'my mental state', 'psychological profile', 'wellbeing summary'
    ];
    
    return summaryKeywords.some(keyword => 
      text.toLowerCase().includes(keyword.toLowerCase())
    );
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isTyping) return;

    const messageContent = inputValue.trim();
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: messageContent,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');

    // Check for crisis language
    if (detectCrisisLanguage(messageContent)) {
      setShowCrisisWarning(true);
      const crisisMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'system',
        content: 'I\'m concerned about your safety. If you\'re having thoughts of hurting yourself, please reach out for immediate help.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, crisisMessage]);
      return;
    }

    // Check for mental health summary request
    if (detectMentalHealthSummaryRequest(messageContent)) {
      setIsTyping(true);
      
      try {
        console.log('🧠 Requesting mental health summary...');
        const summaryResponse = await insightsApi.getMentalHealthSummary();
        
        if (summaryResponse.success && summaryResponse.data) {
          const summaryMessage: Message = {
            id: (Date.now() + 2).toString(),
            type: 'bot',
            content: summaryResponse.data.summary,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, summaryMessage]);

          // Dispatch chat:interaction event for mental health summary
          window.dispatchEvent(new CustomEvent('chat:interaction', { 
            detail: { 
              userMessage: messageContent, 
              botResponse: summaryMessage.content, 
              type: 'mental-health-summary',
              timestamp: new Date().toISOString() 
            } 
          }));
        } else {
          throw new Error('Failed to get mental health summary');
        }
      } catch (error) {
        console.error('❌ Mental health summary error:', error);
        const fallbackMessage: Message = {
          id: (Date.now() + 2).toString(),
          type: 'bot',
          content: 'I\'d love to give you a comprehensive overview of your mental health, but I need you to complete some assessments first. Would you like me to guide you to the assessment section?',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, fallbackMessage]);

        // Dispatch event even for fallback responses
        window.dispatchEvent(new CustomEvent('chat:interaction', { 
          detail: { 
            userMessage: messageContent, 
            botResponse: fallbackMessage.content, 
            type: 'mental-health-summary-fallback',
            timestamp: new Date().toISOString() 
          } 
        }));
      } finally {
        setIsTyping(false);
      }
      return;
    }

    // Show typing indicator
    setIsTyping(true);
    
    try {
      // Call the real backend API with Gemini
      console.log('🤖 Sending message to chat API:', messageContent);
      const response = await chatApi.sendMessage(messageContent);
      console.log('📥 Chat API response:', response);
      
      if (response.success && response.data) {
        const botResponse: Message = {
          id: (Date.now() + 2).toString(),
          type: 'bot',
          content: response.data.message?.content || response.data.response || 'I apologize, but I encountered an issue generating a response.',
          timestamp: new Date()
        };

        setMessages(prev => [...prev, botResponse]);

        // Dispatch chat:interaction event to trigger dashboard updates
        window.dispatchEvent(new CustomEvent('chat:interaction', { 
          detail: { 
            userMessage: messageContent, 
            botResponse: botResponse.content, 
            timestamp: new Date().toISOString() 
          } 
        }));
      } else {
        console.error('❌ Chat API failed:', response.error);
        // Fallback to local response if API fails
        const fallbackMessage: Message = {
          id: (Date.now() + 2).toString(),
          type: 'bot',
          content: 'I\'m having trouble connecting right now, but I\'m here to listen. Could you tell me more about how you\'re feeling?',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, fallbackMessage]);

        // Still dispatch event for fallback responses
        window.dispatchEvent(new CustomEvent('chat:interaction', { 
          detail: { 
            userMessage: messageContent, 
            botResponse: fallbackMessage.content, 
            timestamp: new Date().toISOString() 
          } 
        }));
      }
    } catch (error) {
      console.error('❌ Chat API error:', error);
      
      // Fallback to local response on error
      const errorMessage: Message = {
        id: (Date.now() + 2).toString(),
        type: 'bot',
        content: 'I\'m experiencing some technical difficulties right now. In the meantime, please know that I\'m here to support you. What would you like to talk about?',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);

      // Dispatch event even for error responses
      window.dispatchEvent(new CustomEvent('chat:interaction', { 
        detail: { 
          userMessage: messageContent, 
          botResponse: errorMessage.content, 
          timestamp: new Date().toISOString() 
        } 
      }));
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatMessage = (content: string) => {
    const lines = content.split('\n');
    const formatted: JSX.Element[] = [];
    let buffer: string[] = [];
    
    lines.forEach((raw, idx) => {
      const line = raw.trim();
      if (!line && buffer.length) {
        formatted.push(<p key={`p-${idx}`} className="mb-3">{formatInlineText(buffer.join(' '))}</p>);
        buffer = [];
      } else if (line.startsWith('•')) {
        if (buffer.length) {
          formatted.push(<p key={`p-${idx}`} className="mb-3">{formatInlineText(buffer.join(' '))}</p>);
          buffer = [];
        }
        formatted.push(
          <div key={`b-${idx}`} className="flex items-start mb-2 ml-4">
            <span className="text-gray-500 mr-2">•</span>
            <span>{formatInlineText(line.slice(1).trim())}</span>
          </div>
        );
      } else {
        buffer.push(line);
      }
    });
    if (buffer.length) formatted.push(<p key="final" className="mb-3">{formatInlineText(buffer.join(' '))}</p>);
    return formatted;
  };

  const formatInlineText = (text: string) => {
    // Split by **bold** patterns while preserving the markers
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={index} className="font-semibold">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

const MessageBubble = ({ message }: { message: Message }) => {
  const isUser = message.type === 'user';
  const isSystem = message.type === 'system';

  // Get user initials
  const getUserInitials = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
    } else if (user?.name) {
      const nameParts = user.name.split(' ');
      if (nameParts.length >= 2) {
        return `${nameParts[0].charAt(0)}${nameParts[1].charAt(0)}`.toUpperCase();
      } else {
        return user.name.charAt(0).toUpperCase();
      }
    }
    return 'U'; // Default to 'U' for User
  };

  // system message centered
  if (isSystem) {
    return (
      <div className="flex justify-center mb-3 px-2">
        <div className="max-w-md text-center text-sm bg-amber-100 text-amber-900 px-3 py-2 rounded-md shadow-sm">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3 px-2`}>
      <div className={`flex items-end ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* Avatar for both user and bot */}
        <div className={isUser ? 'ml-3 mt-[2px]' : 'mr-3 mt-[2px]'}>
          <div className="w-8 h-8 rounded-full flex items-center justify-center">
            {isUser ? (
              // User avatar with initials
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                <span className="text-white text-xs font-semibold">
                  {getUserInitials()}
                </span>
              </div>
            ) : (
              // Bot avatar
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                <Bot className="h-4 w-4 text-gray-600" />
              </div>
            )}
          </div>
        </div>

        {/* Bubble */}
        <div className={`px-4 py-3 text-sm leading-relaxed max-w-[80%] shadow-sm ${
          isUser
            ? 'bg-blue-500 text-white rounded-lg rounded-br-none'
            : 'bg-white text-gray-800 rounded-lg rounded-bl-none border border-gray-200'
        }`}>
          <div className={isUser ? 'whitespace-pre-wrap text-left' : 'text-left'}>
            {isUser ? <p className="whitespace-pre-wrap m-0">{message.content}</p> : <div>{formatMessage(message.content)}</div>}
          </div>
        </div>
      </div>
    </div>
  );
};

  return (
    <div className="fixed inset-0 bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 border-b bg-white z-20">
        <div className="h-16 px-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {!isModal && (
              <Button variant="ghost" size="sm" onClick={() => onNavigate('dashboard')} className="mr-2">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
            )}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-blue-50 rounded-full flex items-center justify-center">
                <MessageCircle className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h1 className="font-semibold text-base">AI Wellbeing Companion</h1>
                <p className="text-xs text-gray-500">Always here to listen</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isModal && onClose && (
              <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Messages area */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto bg-gray-50 scrollbar-hide"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        <div className="max-w-3xl mx-auto py-6 px-4 pb-40">
          {messages.map(m => <MessageBubble key={m.id} message={m} />)}

          {isTyping && (
            <div className="flex justify-start mb-3 px-2">
              <div className="mr-3">
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                  <Bot className="h-4 w-4 text-gray-600" />
                </div>
              </div>
              <div className="bg-gray-100 px-3 py-2 rounded-lg max-w-[40%]">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input area (fixed) */}
      <div className="flex-shrink-0 border-t bg-white">
        <div className="max-w-3xl mx-auto p-4">
          <div className="flex gap-2 items-center">
            <div className="flex-1">
              <textarea
                ref={textareaRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Share what's on your mind..."
                className="w-full resize-none rounded-lg border border-gray-200 px-4 py-3 h-[52px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                rows={1}
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-[52px] w-[52px] rounded-lg"
                aria-label="Attach file"
                onClick={() => { /* implement attach */ }}
              >
                <Paperclip className="h-5 w-5 text-gray-500" />
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                className="h-[52px] w-[52px] rounded-lg"
                aria-label="Record audio"
                onClick={() => { /* implement mic */ }}
              >
                <Mic className="h-5 w-5 text-gray-500" />
              </Button>

              <Button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isTyping}
                size="icon"
                className="h-[52px] w-[52px] rounded-lg"
              >
                {isTyping ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Crisis Warning Modal */}
      {showCrisisWarning && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-5 w-5" />
                We Care About Your Safety
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">
                It sounds like you might be going through something serious. We want to help you connect 
                with immediate professional support.
              </p>
              
              <div className="space-y-3">
                <Button className="w-full" onClick={() => window.open('tel:988')}>
                  <Phone className="h-4 w-4 mr-2" />
                  Call 988 (Crisis Lifeline)
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => onNavigate('help')}
                >
                  View Crisis Resources
                </Button>
                
                <Button 
                  variant="ghost" 
                  className="w-full"
                  onClick={() => setShowCrisisWarning(false)}
                >
                  Continue Conversation
                </Button>
              </div>

              <div className="text-xs text-gray-500 space-y-1">
                <p>• National Suicide Prevention Lifeline: 988</p>
                <p>• Crisis Text Line: Text HOME to 741741</p>
                <p>• Emergency Services: 911</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}