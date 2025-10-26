/**
 * LoadingSpinner Component
 * 
 * Professional, reusable loading spinner with multiple sizes and variants
 */

import { Loader2 } from 'lucide-react';

import { cn } from './utils';

export interface LoadingSpinnerProps {
  /** Size variant */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  /** Custom className */
  className?: string;
  /** Label for screen readers */
  label?: string;
}

const sizeClasses = {
  xs: 'h-3 w-3',
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
  xl: 'h-12 w-12',
};

/**
 * Basic spinning loader icon
 */
export function LoadingSpinner({ 
  size = 'md', 
  className,
  label = 'Loading...'
}: LoadingSpinnerProps) {
  return (
    <Loader2 
      className={cn('animate-spin', sizeClasses[size], className)}
      role="status"
      aria-label={label}
    />
  );
}

export interface LoadingOverlayProps {
  /** Message to display */
  message?: string;
  /** Size of spinner */
  size?: LoadingSpinnerProps['size'];
}

/**
 * Full-screen loading overlay
 */
export function LoadingOverlay({ message = 'Loading...', size = 'xl' }: LoadingOverlayProps) {
  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
      role="alert"
      aria-live="polite"
    >
      <div className="flex flex-col items-center gap-4">
        <LoadingSpinner size={size} className="text-primary" />
        {message && (
          <p className="text-sm text-muted-foreground">{message}</p>
        )}
      </div>
    </div>
  );
}

export interface LoadingContainerProps {
  /** Message to display */
  message?: string;
  /** Size of spinner */
  size?: LoadingSpinnerProps['size'];
  /** Additional class names */
  className?: string;
}

/**
 * Centered loading container (for sections/cards)
 */
export function LoadingContainer({ 
  message = 'Loading...', 
  size = 'lg',
  className 
}: LoadingContainerProps) {
  return (
    <div 
      className={cn("flex flex-col items-center justify-center gap-4 p-8", className)}
      role="status"
      aria-live="polite"
    >
      <LoadingSpinner size={size} className="text-primary" />
      {message && (
        <p className="text-sm text-muted-foreground text-center">{message}</p>
      )}
    </div>
  );
}

export interface InlineLoadingProps {
  /** Message to display */
  message?: string;
  /** Size of spinner */
  size?: LoadingSpinnerProps['size'];
}

/**
 * Inline loading indicator (horizontal layout)
 */
export function InlineLoading({ message = 'Loading...', size = 'sm' }: InlineLoadingProps) {
  return (
    <div 
      className="flex items-center gap-2"
      role="status"
      aria-live="polite"
    >
      <LoadingSpinner size={size} className="text-primary" />
      {message && (
        <span className="text-sm text-muted-foreground">{message}</span>
      )}
    </div>
  );
}

export interface ButtonLoadingProps {
  /** Whether button is loading */
  loading: boolean;
  /** Button text when not loading */
  children: React.ReactNode;
  /** Button text when loading (optional) */
  loadingText?: string;
}

/**
 * Button content with loading state
 */
export function ButtonLoading({ loading, children, loadingText }: ButtonLoadingProps) {
  if (!loading) {
    return <>{children}</>;
  }

  return (
    <div className="flex items-center gap-2">
      <LoadingSpinner size="sm" />
      <span>{loadingText || children}</span>
    </div>
  );
}
