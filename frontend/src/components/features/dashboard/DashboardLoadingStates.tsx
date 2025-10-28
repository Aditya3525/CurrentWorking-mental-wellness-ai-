import { AlertCircle, RefreshCw, WifiOff } from 'lucide-react';
import React from 'react';

import { Button } from '../../ui/button';
import { Card, CardContent, CardHeader } from '../../ui/card';
import { Skeleton } from '../../ui/skeleton';

// Loading Skeleton Components
export function DashboardLoadingSkeleton() {
  return (
    <div className="min-h-screen bg-background pb-safe animate-pulse">
      {/* Header Skeleton */}
      <div className="bg-gradient-to-r from-primary/10 to-accent/10 p-4 md:p-6">
        <div className="max-w-7xl mx-auto space-y-4">
          <div className="flex justify-between items-start">
            <div className="space-y-2 flex-1">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-48" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-9 w-9 rounded-full" />
              <Skeleton className="h-9 w-9 rounded-full" />
            </div>
          </div>
          
          {/* Mood Check Skeleton */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <Skeleton className="h-5 w-5" />
                <Skeleton className="h-5 w-32" />
              </div>
              <div className="flex gap-2">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-10 w-20 rounded-md" />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
        {/* Quick Actions Skeleton */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-3">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-lg" />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Today's Practice Skeleton */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-32 w-full rounded-lg" />
            <div className="grid md:grid-cols-2 gap-4">
              <Skeleton className="h-20 w-full rounded-lg" />
              <Skeleton className="h-20 w-full rounded-lg" />
            </div>
          </CardContent>
        </Card>

        {/* Metrics Skeleton */}
        <div className="grid md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-10 w-24" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-4 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Insights Skeleton */}
        <div className="grid lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-20 w-full rounded-lg" />
              <Skeleton className="h-20 w-full rounded-lg" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-24" />
            </CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-16 w-full rounded-lg" />
              <Skeleton className="h-16 w-full rounded-lg" />
              <Skeleton className="h-16 w-full rounded-lg" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Error Display Components
interface ErrorMessageProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  showRetry?: boolean;
}

export function ErrorMessage({ 
  title = 'Something went wrong',
  message, 
  onRetry,
  showRetry = true 
}: ErrorMessageProps) {
  return (
    <div className="flex items-center justify-center min-h-[400px] p-6">
      <Card className="max-w-md w-full">
        <CardContent className="pt-6 text-center space-y-4">
          <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertCircle className="h-6 w-6 text-destructive" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">{title}</h3>
            <p className="text-sm text-muted-foreground">{message}</p>
          </div>
          {showRetry && onRetry && (
            <Button onClick={onRetry} variant="outline" className="w-full">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Network Status Indicator
interface NetworkStatusProps {
  isOnline: boolean;
}

export function NetworkStatus({ isOnline }: NetworkStatusProps) {
  if (isOnline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-500 text-yellow-950 px-4 py-2 text-sm flex items-center justify-center gap-2">
      <WifiOff className="h-4 w-4" />
      <span>You&apos;re offline. Some features may be unavailable.</span>
    </div>
  );
}

// Pull-to-Refresh Indicator
interface PullToRefreshIndicatorProps {
  pullProgress: number;
  isRefreshing: boolean;
  shouldTrigger: boolean;
}

export function PullToRefreshIndicator({ 
  pullProgress, 
  isRefreshing,
  shouldTrigger 
}: PullToRefreshIndicatorProps) {
  if (pullProgress === 0 && !isRefreshing) return null;

  return (
    <div 
      className="fixed top-0 left-0 right-0 z-40 flex items-center justify-center transition-all duration-200"
      style={{ 
        height: isRefreshing ? '60px' : `${Math.min(pullProgress * 60, 60)}px`,
        opacity: pullProgress
      }}
    >
      <div className="bg-background/95 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg">
        <RefreshCw 
          className={`h-5 w-5 text-primary ${isRefreshing || shouldTrigger ? 'animate-spin' : ''}`}
          style={{
            transform: `rotate(${pullProgress * 360}deg)`
          }}
        />
      </div>
    </div>
  );
}

// Empty State Component
interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center space-y-4">
      {icon && (
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
          {icon}
        </div>
      )}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground max-w-md">{description}</p>
      </div>
      {action && (
        <Button onClick={action.onClick} className="mt-4">
          {action.label}
        </Button>
      )}
    </div>
  );
}

// Loading Indicator (inline)
export function LoadingIndicator({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="flex items-center justify-center p-8 space-x-3">
      <RefreshCw className="h-5 w-5 animate-spin text-primary" />
      <span className="text-sm text-muted-foreground">{message}</span>
    </div>
  );
}

// Connection Status
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = React.useState(navigator.onLine);

  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}
