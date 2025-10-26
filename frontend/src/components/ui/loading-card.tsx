/**
 * LoadingCard Component
 * 
 * Pre-built loading states for cards with consistent styling
 */

import { Brain, Heart, MessageCircle, TrendingUp } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card';
import { LoadingContainer } from './loading-spinner';
import { Skeleton } from './skeleton';
import { cn } from './utils';

export interface LoadingCardProps {
  /** Optional title for the card */
  title?: string;
  /** Optional description */
  description?: string;
  /** Custom message */
  message?: string;
  /** Custom className */
  className?: string;
}

/**
 * Basic loading card with spinner
 */
export function LoadingCard({ 
  title, 
  description, 
  message = 'Loading...', 
  className 
}: LoadingCardProps) {
  return (
    <Card className={className}>
      {(title || description) && (
        <CardHeader>
          {title && <CardTitle>{title}</CardTitle>}
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
      )}
      <CardContent>
        <LoadingContainer message={message} size="md" />
      </CardContent>
    </Card>
  );
}

export interface SkeletonCardProps {
  /** Show header skeleton */
  showHeader?: boolean;
  /** Number of content lines */
  lines?: number;
  /** Custom className */
  className?: string;
}

/**
 * Card with skeleton placeholders
 */
export function SkeletonCard({ 
  showHeader = true, 
  lines = 3, 
  className 
}: SkeletonCardProps) {
  return (
    <Card className={className}>
      {showHeader && (
        <CardHeader className="space-y-2">
          <Skeleton className="h-6 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
        </CardHeader>
      )}
      <CardContent className="space-y-3">
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton 
            key={i} 
            className={cn(
              'h-4',
              i === lines - 1 ? 'w-3/4' : 'w-full'
            )} 
          />
        ))}
      </CardContent>
    </Card>
  );
}

/**
 * Stat card with skeleton (for dashboard metrics)
 */
export function SkeletonStatCard({ className }: { className?: string }) {
  return (
    <Card className={className}>
      <CardContent className="p-6">
        <div className="flex items-center space-x-4">
          <Skeleton className="h-12 w-12 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-6 w-16" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export interface EmptyCardProps {
  /** Icon to display */
  icon?: React.ReactNode;
  /** Title message */
  title: string;
  /** Description message */
  description?: string;
  /** Optional action button */
  action?: React.ReactNode;
  /** Custom className */
  className?: string;
}

/**
 * Empty state card
 */
export function EmptyCard({ 
  icon, 
  title, 
  description, 
  action, 
  className 
}: EmptyCardProps) {
  return (
    <Card className={className}>
      <CardContent className="flex flex-col items-center justify-center p-12 text-center">
        {icon && (
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            {icon}
          </div>
        )}
        <h3 className="mb-2 text-lg font-semibold">{title}</h3>
        {description && (
          <p className="mb-4 text-sm text-muted-foreground">{description}</p>
        )}
        {action}
      </CardContent>
    </Card>
  );
}

/**
 * Assessment loading card with brain icon
 */
export function AssessmentLoadingCard({ message = 'Loading assessment...' }: { message?: string }) {
  return (
    <Card className="w-full max-w-2xl">
      <CardContent className="p-12 text-center">
        <Brain className="h-12 w-12 mx-auto mb-4 text-primary animate-pulse" />
        <p className="text-lg text-muted-foreground">{message}</p>
      </CardContent>
    </Card>
  );
}

/**
 * Mood tracking loading card
 */
export function MoodLoadingCard({ message = 'Loading mood data...' }: { message?: string }) {
  return (
    <Card className="w-full">
      <CardContent className="p-8 text-center">
        <Heart className="h-10 w-10 mx-auto mb-3 text-primary animate-pulse" />
        <p className="text-muted-foreground">{message}</p>
      </CardContent>
    </Card>
  );
}

/**
 * Chat loading card
 */
export function ChatLoadingCard({ message = 'Loading conversation...' }: { message?: string }) {
  return (
    <Card className="w-full">
      <CardContent className="p-8 text-center">
        <MessageCircle className="h-10 w-10 mx-auto mb-3 text-primary animate-pulse" />
        <p className="text-muted-foreground">{message}</p>
      </CardContent>
    </Card>
  );
}

/**
 * Insights loading card
 */
export function InsightsLoadingCard({ message = 'Analyzing your data...' }: { message?: string }) {
  return (
    <Card className="w-full">
      <CardContent className="p-8 text-center">
        <TrendingUp className="h-10 w-10 mx-auto mb-3 text-primary animate-pulse" />
        <p className="text-muted-foreground">{message}</p>
      </CardContent>
    </Card>
  );
}
