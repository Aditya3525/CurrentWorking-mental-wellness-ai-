import { Heart, MessageCircle, Sparkles, TrendingUp } from 'lucide-react';
import React from 'react';

import { Button } from '../../ui/button';

interface EmptyStateProps {
  onStarterClick?: (starter: string) => void;
  starters?: string[];
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  onStarterClick,
  starters = [
    "I'm feeling anxious today",
    "Help me relax with a breathing exercise",
    "I want to improve my mood",
    "I'm having trouble sleeping"
  ]
}) => {
  return (
    <div className="flex flex-col items-center justify-center h-full py-12 px-4">
      {/* Animated Gradient Illustration */}
      <div className="relative mb-8">
        {/* Outer animated ring */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 blur-2xl opacity-30 animate-pulse" 
             style={{ width: '200px', height: '200px', top: '-50px', left: '-50px' }}
        />
        
        {/* Inner floating icons */}
        <div className="relative w-24 h-24 flex items-center justify-center">
          <div className="absolute top-0 left-0 animate-bounce" style={{ animationDuration: '3s' }}>
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
              <Heart className="h-6 w-6 text-white" fill="white" />
            </div>
          </div>
          
          <div className="absolute top-0 right-0 animate-bounce" style={{ animationDuration: '3.5s', animationDelay: '0.5s' }}>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
          </div>
          
          <div className="absolute bottom-0 left-0 animate-bounce" style={{ animationDuration: '4s', animationDelay: '1s' }}>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-pink-600 flex items-center justify-center shadow-lg">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
          </div>
          
          <div className="absolute bottom-0 right-0 animate-bounce" style={{ animationDuration: '3.2s', animationDelay: '1.5s' }}>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-lg">
              <MessageCircle className="h-4 w-4 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Welcome Message */}
      <div className="text-center mb-8 max-w-md">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Welcome to Your AI Wellness Companion
        </h2>
        <p className="text-muted-foreground text-sm">
          I&apos;m here to support your wellbeing journey. Share what&apos;s on your mind, and let&apos;s work together toward better emotional health.
        </p>
      </div>

      {/* Starter Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl w-full">
        {starters.map((starter, index) => (
          <Button
            key={index}
            variant="outline"
            className="h-auto py-4 px-5 text-left justify-start hover:bg-primary/5 hover:border-primary transition-all group"
            onClick={() => onStarterClick && onStarterClick(starter)}
          >
            <div className="flex items-start gap-3 w-full">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center flex-shrink-0 group-hover:from-primary/30 group-hover:to-primary/20 transition-colors">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 text-sm">
                {starter}
              </div>
            </div>
          </Button>
        ))}
      </div>

      {/* Helper Text */}
      <p className="text-xs text-muted-foreground mt-6 text-center max-w-sm">
        💡 Tip: Click any suggestion above or type your own message below to start our conversation
      </p>
    </div>
  );
};

export default EmptyState;
