import { HelpCircle, Info, LightbulbIcon, AlertCircle } from 'lucide-react';
import React, { ReactNode } from 'react';

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './tooltip';
import { cn } from './utils';

export interface ContextualTooltipProps {
  content: ReactNode;
  children: ReactNode;
  variant?: 'info' | 'help' | 'tip' | 'warning';
  side?: 'top' | 'right' | 'bottom' | 'left';
  align?: 'start' | 'center' | 'end';
  delayDuration?: number;
  className?: string;
  showIcon?: boolean;
}

/**
 * Contextual Tooltip Component
 * Provides helpful hints and information throughout the app
 */
export function ContextualTooltip({
  content,
  children,
  variant = 'info',
  side = 'top',
  align = 'center',
  delayDuration = 400,
  className,
  showIcon = true,
}: ContextualTooltipProps) {
  const getIcon = () => {
    switch (variant) {
      case 'help':
        return <HelpCircle className="h-4 w-4" />;
      case 'tip':
        return <LightbulbIcon className="h-4 w-4" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'help':
        return 'text-blue-600 dark:text-blue-400';
      case 'tip':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'warning':
        return 'text-orange-600 dark:text-orange-400';
      default:
        return 'text-muted-foreground';
    }
  };

  return (
    <TooltipProvider delayDuration={delayDuration}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={cn('inline-flex items-center gap-1', className)}>
            {children}
            {showIcon && (
              <span className={cn('cursor-help', getVariantStyles())}>
                {getIcon()}
              </span>
            )}
          </span>
        </TooltipTrigger>
        <TooltipContent side={side} align={align} className="max-w-xs">
          {content}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * Inline Help Tooltip
 * Shows just an icon that reveals help text
 */
export function InlineHelp({
  content,
  variant = 'help',
  side = 'top',
  className,
}: Omit<ContextualTooltipProps, 'children' | 'showIcon'>) {
  const getIcon = () => {
    switch (variant) {
      case 'tip':
        return <LightbulbIcon className="h-4 w-4" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4" />;
      case 'info':
        return <Info className="h-4 w-4" />;
      default:
        return <HelpCircle className="h-4 w-4" />;
    }
  };

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className={cn(
              'inline-flex items-center justify-center rounded-full',
              'text-muted-foreground hover:text-foreground',
              'transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              'h-4 w-4',
              className
            )}
            aria-label="Help"
          >
            {getIcon()}
          </button>
        </TooltipTrigger>
        <TooltipContent side={side} className="max-w-xs">
          {content}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * Feature Tip Badge
 * Highlights new or important features
 */
export function FeatureTip({
  content,
  children,
  badge = 'New',
  side = 'top',
}: Omit<ContextualTooltipProps, 'variant' | 'showIcon'> & { badge?: string }) {
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex items-center gap-2 relative">
            {children}
            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-primary text-primary-foreground rounded-full animate-pulse">
              {badge}
            </span>
          </span>
        </TooltipTrigger>
        <TooltipContent side={side} className="max-w-xs">
          <div className="space-y-1">
            <p className="font-semibold text-sm">✨ {badge} Feature!</p>
            <p className="text-xs">{content}</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * Interactive Walkthrough Tooltip
 * For onboarding and feature tours
 */
export interface WalkthroughStep {
  target: string; // CSS selector
  title: string;
  content: ReactNode;
  placement?: 'top' | 'right' | 'bottom' | 'left';
}

export interface WalkthroughTooltipProps {
  steps: WalkthroughStep[];
  currentStep: number;
  onNext: () => void;
  onPrevious: () => void;
  onSkip: () => void;
  onComplete: () => void;
}

export function WalkthroughTooltip({
  steps,
  currentStep,
  onNext,
  onPrevious,
  onSkip,
  onComplete,
}: WalkthroughTooltipProps) {
  const step = steps[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;

  if (!step) return null;

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      {/* Overlay */}
      <button 
        onClick={onSkip}
        className="absolute inset-0 bg-black/50 pointer-events-auto cursor-default"
        aria-label="Skip tour"
      />

      {/* Tooltip */}
      <div className="absolute pointer-events-auto bg-card rounded-lg shadow-xl border p-4 max-w-sm">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-sm">{step.title}</h3>
            <div className="text-xs text-muted-foreground">
              {currentStep + 1} / {steps.length}
            </div>
          </div>

          {/* Content */}
          <div className="text-sm text-muted-foreground">
            {step.content}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between gap-2 pt-2">
            <button
              onClick={onSkip}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Skip Tour
            </button>

            <div className="flex gap-2">
              {!isFirstStep && (
                <button
                  onClick={onPrevious}
                  className="px-3 py-1.5 text-xs font-medium rounded-md hover:bg-muted transition-colors"
                >
                  Back
                </button>
              )}

              <button
                onClick={isLastStep ? onComplete : onNext}
                className="px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              >
                {isLastStep ? 'Got it!' : 'Next'}
              </button>
            </div>
          </div>

          {/* Progress Dots */}
          <div className="flex justify-center gap-1 pt-2">
            {steps.map((_, index) => (
              <div
                key={index}
                className={cn(
                  'h-1.5 rounded-full transition-all',
                  index === currentStep
                    ? 'w-6 bg-primary'
                    : 'w-1.5 bg-muted-foreground/30'
                )}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Quick Tip Component
 * Shows brief, dismissible tips
 */
export function QuickTip({
  content,
  onDismiss,
  variant = 'tip',
}: {
  content: ReactNode;
  onDismiss?: () => void;
  variant?: 'tip' | 'info' | 'warning';
}) {
  const getIcon = () => {
    switch (variant) {
      case 'warning':
        return <AlertCircle className="h-5 w-5" />;
      case 'info':
        return <Info className="h-5 w-5" />;
      default:
        return <LightbulbIcon className="h-5 w-5" />;
    }
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'warning':
        return 'bg-orange-50 dark:bg-orange-950 border-orange-200 dark:border-orange-800 text-orange-900 dark:text-orange-100';
      case 'info':
        return 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-100';
      default:
        return 'bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800 text-yellow-900 dark:text-yellow-100';
    }
  };

  return (
    <div
      className={cn(
        'flex items-start gap-3 p-3 rounded-lg border animate-in slide-in-from-top-2 fade-in duration-300',
        getVariantStyles()
      )}
    >
      <div className="flex-shrink-0 mt-0.5">{getIcon()}</div>
      
      <div className="flex-1 text-sm">{content}</div>

      {onDismiss && (
        <button
          onClick={onDismiss}
          className="flex-shrink-0 text-current opacity-60 hover:opacity-100 transition-opacity"
          aria-label="Dismiss"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}
