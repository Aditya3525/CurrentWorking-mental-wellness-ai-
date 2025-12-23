import { ReactNode, useEffect, useState } from 'react';

import { cn } from './utils';

export interface PageTransitionProps {
  children: ReactNode;
  className?: string;
  variant?: 'fade' | 'slide' | 'scale' | 'none';
  duration?: number; // in milliseconds
}

/**
 * Page Transition Component
 * Animates page entry and exit
 */
export function PageTransition({
  children,
  className,
  variant = 'fade',
  duration = 300,
}: PageTransitionProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 10);

    return () => clearTimeout(timer);
  }, []);

  const getAnimationClasses = () => {
    if (!isVisible) {
      switch (variant) {
        case 'fade':
          return 'opacity-0';
        case 'slide':
          return 'opacity-0 translate-y-4';
        case 'scale':
          return 'opacity-0 scale-95';
        default:
          return '';
      }
    }

    return 'opacity-100 translate-y-0 scale-100';
  };

  if (variant === 'none') {
    return <>{children}</>;
  }

  return (
    <div
      className={cn(
        'transition-all ease-out',
        getAnimationClasses(),
        className
      )}
      style={{
        transitionDuration: `${duration}ms`,
      }}
    >
      {children}
    </div>
  );
}

/**
 * Staggered Children Animation
 * Animates children with a stagger effect
 */
export interface StaggeredAnimationProps {
  children: ReactNode[];
  staggerDelay?: number; // delay between each child in ms
  className?: string;
}

export function StaggeredAnimation({
  children,
  staggerDelay = 50,
  className,
}: StaggeredAnimationProps) {
  const [visibleItems, setVisibleItems] = useState<Set<number>>(new Set());

  useEffect(() => {
    children.forEach((_, index) => {
      setTimeout(() => {
        setVisibleItems((prev) => new Set(prev).add(index));
      }, index * staggerDelay);
    });
  }, [children, staggerDelay]);

  return (
    <>
      {children.map((child, index) => (
        <div
          key={index}
          className={cn(
            'transition-all duration-300',
            visibleItems.has(index)
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-2',
            className
          )}
        >
          {child}
        </div>
      ))}
    </>
  );
}

/**
 * Route Transition Wrapper
 * Use with your routing library
 */
export interface RouteTransitionProps {
  children: ReactNode;
  routeKey: string; // unique key for each route
  variant?: 'fade' | 'slide' | 'scale';
}

export function RouteTransition({
  children,
  routeKey,
  variant = 'fade',
}: RouteTransitionProps) {
  const [displayedKey, setDisplayedKey] = useState(routeKey);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    if (routeKey !== displayedKey) {
      setIsTransitioning(true);

      // Wait for exit animation
      setTimeout(() => {
        setDisplayedKey(routeKey);
        setIsTransitioning(false);
      }, 200);
    }
  }, [routeKey, displayedKey]);

  const getTransitionClasses = () => {
    if (isTransitioning) {
      switch (variant) {
        case 'fade':
          return 'opacity-0';
        case 'slide':
          return 'opacity-0 -translate-x-4';
        case 'scale':
          return 'opacity-0 scale-95';
      }
    }

    return 'opacity-100 translate-x-0 scale-100';
  };

  return (
    <div
      className={cn(
        'transition-all duration-200 ease-in-out',
        getTransitionClasses()
      )}
    >
      {children}
    </div>
  );
}

/**
 * Slide Up Transition
 * Common pattern for modal/sheet content
 */
export function SlideUpTransition({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'animate-in slide-in-from-bottom-8 fade-in-0 duration-300',
        className
      )}
    >
      {children}
    </div>
  );
}

/**
 * Fade In Transition
 * Simple fade in effect
 */
export function FadeInTransition({ 
  children, 
  className,
  delay = 0 
}: { 
  children: ReactNode; 
  className?: string;
  delay?: number;
}) {
  return (
    <div
      className={cn(
        'animate-in fade-in-0 duration-500',
        className
      )}
      style={{
        animationDelay: `${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

/**
 * Scale In Transition
 * Zoom effect
 */
export function ScaleInTransition({ 
  children, 
  className 
}: { 
  children: ReactNode; 
  className?: string;
}) {
  return (
    <div
      className={cn(
        'animate-in zoom-in-95 fade-in-0 duration-300',
        className
      )}
    >
      {children}
    </div>
  );
}

/**
 * Bounce In Transition
 * Playful bounce effect
 */
export function BounceInTransition({ 
  children, 
  className 
}: { 
  children: ReactNode; 
  className?: string;
}) {
  return (
    <div
      className={cn(
        'animate-in zoom-in-50 duration-500',
        className
      )}
      style={{
        animationTimingFunction: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      }}
    >
      {children}
    </div>
  );
}

/**
 * Reveal Transition
 * Gradual reveal from bottom
 */
export function RevealTransition({ 
  children, 
  className 
}: { 
  children: ReactNode; 
  className?: string;
}) {
  return (
    <div
      className={cn(
        'animate-in slide-in-from-bottom-4 fade-in-0 duration-700',
        className
      )}
    >
      {children}
    </div>
  );
}
