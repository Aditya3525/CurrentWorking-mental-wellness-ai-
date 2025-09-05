import React, { useState, useRef, useEffect } from 'react';
import { 
  Send,
  ArrowLeft,
  MessageCircle,
  Bot,
  User,
  Loader2,
  AlertTriangle,
  Phone,
  X,
  Mic,
  Paperclip,
  MoreHorizontal
} from 'lucide-react';

import { Button } from '../../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Input } from '../../ui/input';
import { chatApi } from '../../../services/api';

interface ChatbotProps {
  user: any;
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
      timestamp: new Date(),
      suggestions: [
        "I'm feeling anxious",
        "I need a breathing exercise",
        "I'm having trouble sleeping",
        "I want to talk about my day"
      ]
    }
  ]);
  
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showCrisisWarning, setShowCrisisWarning] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const messageContent = inputValue;
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
          timestamp: new Date(),
          suggestions: messageContent.toLowerCase().includes('anxious') 
            ? ['Try breathing exercise', 'Tell me more', 'What helps you calm down?']
            : ['That\'s helpful', 'Tell me more', 'What else?']
        };

        setMessages(prev => [...prev, botResponse]);
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
    } finally {
      setIsTyping(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const MessageBubble = ({ message }: { message: Message }) => {
    const isUser = message.type === 'user';
    const isSystem = message.type === 'system';

    return (
      <div className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
        {!isUser && (
          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
            isSystem ? 'bg-amber-100' : 'bg-primary/10'
          }`}>
            {isSystem ? (
              <AlertTriangle className="h-4 w-4 text-amber-600" />
            ) : (
              <Bot className="h-4 w-4 text-primary" />
            )}
          </div>
        )}
        
        <div className={`max-w-[80%] ${isUser ? 'order-1' : 'order-2'}`}>
          <div
            className={`rounded-2xl px-4 py-3 ${
              isUser
                ? 'bg-primary text-primary-foreground ml-auto'
                : isSystem
                ? 'bg-amber-50 border border-amber-200 text-amber-800'
                : 'bg-muted'
            }`}
          >
            <p className="text-sm leading-relaxed">{message.content}</p>
          </div>
          
          <div className={`flex items-center gap-2 mt-1 text-xs text-muted-foreground ${
            isUser ? 'justify-end' : 'justify-start'
          }`}>
            <span>{message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>

          {/* Suggestions */}
          {message.suggestions && (
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
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
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

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
        
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
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t p-4">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Share what's on your mind..."
              className="pr-20"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <Paperclip className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <Mic className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <Button 
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isTyping}
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
              <p className="text-sm text-muted-foreground">
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

              <div className="text-xs text-muted-foreground space-y-1">
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