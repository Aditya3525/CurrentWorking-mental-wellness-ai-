# 🎨 UX/UI Improvements Guide

## User Experience Enhancements

### 1. Accessibility Improvements (WCAG 2.1 AA Compliance)

#### A. Keyboard Navigation

```typescript
// frontend/src/hooks/useKeyboardNavigation.ts
import { useEffect, useCallback } from 'react';

export function useKeyboardNavigation(containerRef: React.RefObject<HTMLElement>) {
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        const first = focusableElements[0] as HTMLElement;
        const last = focusableElements[focusableElements.length - 1] as HTMLElement;
        
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
      
      // Arrow key navigation for lists
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        const currentIndex = Array.from(focusableElements).indexOf(
          document.activeElement as HTMLElement
        );
        
        if (currentIndex !== -1) {
          e.preventDefault();
          const nextIndex = e.key === 'ArrowDown' 
            ? Math.min(currentIndex + 1, focusableElements.length - 1)
            : Math.max(currentIndex - 1, 0);
          
          (focusableElements[nextIndex] as HTMLElement).focus();
        }
      }
    };
    
    container.addEventListener('keydown', handleKeyDown);
    return () => container.removeEventListener('keydown', handleKeyDown);
  }, [containerRef]);
}
```

#### B. Screen Reader Support

```typescript
// frontend/src/components/common/ScreenReaderOnly.tsx
export function ScreenReaderOnly({ children }: { children: React.ReactNode }) {
  return (
    <span className="sr-only absolute w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap border-0">
      {children}
    </span>
  );
}

// Usage in components
export function Dashboard() {
  return (
    <div>
      <h1>
        Dashboard
        <ScreenReaderOnly>for Mental Wellbeing Tracking</ScreenReaderOnly>
      </h1>
      
      <button aria-label="Start new mood check-in">
        <Smile />
        <ScreenReaderOnly>Start mood check-in</ScreenReaderOnly>
      </button>
    </div>
  );
}
```

#### C. ARIA Live Regions for Dynamic Content

```typescript
// frontend/src/components/common/LiveRegion.tsx
export function LiveRegion({ 
  children, 
  politeness = 'polite' 
}: { 
  children: React.ReactNode;
  politeness?: 'polite' | 'assertive';
}) {
  return (
    <div
      role="status"
      aria-live={politeness}
      aria-atomic="true"
      className="sr-only"
    >
      {children}
    </div>
  );
}

// Usage for chat messages
export function Chatbot() {
  const [announcement, setAnnouncement] = useState('');
  
  const handleNewMessage = (message: string) => {
    setAnnouncement(`New message: ${message}`);
    setTimeout(() => setAnnouncement(''), 1000);
  };
  
  return (
    <div>
      <LiveRegion>{announcement}</LiveRegion>
      {/* Chat UI */}
    </div>
  );
}
```

#### D. Color Contrast & Dark Mode

```typescript
// frontend/src/styles/accessibility.css
:root {
  /* WCAG AA compliant colors */
  --color-primary: #0066cc; /* 4.5:1 on white */
  --color-error: #c41e3a; /* 4.5:1 on white */
  --color-success: #008000; /* 4.5:1 on white */
  --color-warning: #cc6600; /* 4.5:1 on white */
  
  /* Text colors */
  --color-text-primary: #1a1a1a; /* 16:1 on white */
  --color-text-secondary: #4a4a4a; /* 10:1 on white */
}

[data-theme="dark"] {
  --color-primary: #4da3ff;
  --color-error: #ff6b6b;
  --color-success: #51cf66;
  --color-warning: #ffa94d;
  
  --color-text-primary: #f5f5f5;
  --color-text-secondary: #c9c9c9;
  --color-bg-primary: #1a1a1a;
  --color-bg-secondary: #2d2d2d;
}
```

#### E. Focus Indicators

```css
/* frontend/src/styles/focus.css */
*:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
  border-radius: 4px;
}

button:focus-visible {
  box-shadow: 0 0 0 3px rgba(0, 102, 204, 0.3);
}

/* Skip to main content link */
.skip-link {
  position: absolute;
  top: -40px;
  left: 0;
  background: var(--color-primary);
  color: white;
  padding: 8px;
  text-decoration: none;
  z-index: 100;
}

.skip-link:focus {
  top: 0;
}
```

### 2. Progressive Disclosure & Information Architecture

#### A. Stepped Forms with Progress Indication

```typescript
// frontend/src/components/common/StepIndicator.tsx
interface Step {
  id: string;
  label: string;
  completed: boolean;
  current: boolean;
}

export function StepIndicator({ steps }: { steps: Step[] }) {
  return (
    <nav aria-label="Progress">
      <ol className="flex items-center justify-between">
        {steps.map((step, index) => (
          <li 
            key={step.id}
            className="relative flex-1"
            aria-current={step.current ? 'step' : undefined}
          >
            <div className="flex items-center">
              <span
                className={`
                  flex h-10 w-10 items-center justify-center rounded-full
                  ${step.completed ? 'bg-green-500' : ''}
                  ${step.current ? 'bg-blue-500' : ''}
                  ${!step.completed && !step.current ? 'bg-gray-300' : ''}
                `}
              >
                {step.completed ? (
                  <CheckCircle className="text-white" />
                ) : (
                  <span className="text-white font-semibold">{index + 1}</span>
                )}
              </span>
              <span className="ml-2 text-sm font-medium">
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div className="absolute top-5 right-0 h-0.5 w-full bg-gray-300">
                <div 
                  className="h-full bg-blue-500 transition-all"
                  style={{ width: step.completed ? '100%' : '0%' }}
                />
              </div>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
```

#### B. Contextual Help & Tooltips

```typescript
// frontend/src/components/common/HelpTooltip.tsx
import * as Tooltip from '@radix-ui/react-tooltip';
import { HelpCircle } from 'lucide-react';

export function HelpTooltip({ content }: { content: string }) {
  return (
    <Tooltip.Provider delayDuration={300}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <button
            className="inline-flex items-center justify-center ml-1"
            aria-label="More information"
          >
            <HelpCircle className="w-4 h-4 text-gray-400 hover:text-gray-600" />
          </button>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            className="bg-gray-900 text-white px-3 py-2 rounded-md text-sm max-w-xs"
            sideOffset={5}
          >
            {content}
            <Tooltip.Arrow className="fill-gray-900" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}

// Usage
<Label>
  Emergency Contact
  <HelpTooltip content="A trusted person we can notify if you're in crisis" />
</Label>
```

### 3. Error Handling & User Feedback

#### A. Comprehensive Error States

```typescript
// frontend/src/components/common/ErrorBoundary.tsx
import React from 'react';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    
    // Send to error tracking service
    if (window.gtag) {
      window.gtag('event', 'exception', {
        description: error.message,
        fatal: false
      });
    }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
            <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <h2 className="mt-4 text-xl font-semibold text-center">
              Something went wrong
            </h2>
            <p className="mt-2 text-sm text-gray-600 text-center">
              We've been notified and are looking into it. Please try refreshing the page.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => window.location.reload()}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md"
              >
                Refresh Page
              </button>
              <button
                onClick={() => this.setState({ hasError: false })}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-md"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
```

#### B. Loading Skeletons

```typescript
// frontend/src/components/common/Skeleton.tsx
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse bg-gray-200 rounded ${className}`}
      role="status"
      aria-label="Loading"
    />
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-64" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="border rounded-lg p-4 space-y-3">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-4 w-24" />
          </div>
        ))}
      </div>
    </div>
  );
}
```

#### C. Toast Notifications with Actions

```typescript
// frontend/src/contexts/ToastContext.tsx - Enhanced
interface ToastAction {
  label: string;
  onClick: () => void;
}

interface Toast {
  id: string;
  title: string;
  description?: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  action?: ToastAction;
  persistent?: boolean;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  
  const push = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36);
    const newToast = { ...toast, id };
    
    setToasts(prev => [...prev, newToast]);
    
    if (!toast.persistent && toast.duration !== 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, toast.duration || 5000);
    }
  }, []);
  
  return (
    <ToastContext.Provider value={{ toasts, push, remove }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={remove} />
    </ToastContext.Provider>
  );
}

// Enhanced toast with undo action
function useUndoableAction() {
  const { push } = useToast();
  
  const executeWithUndo = async (
    action: () => Promise<void>,
    undo: () => Promise<void>,
    message: string
  ) => {
    await action();
    
    push({
      title: message,
      type: 'success',
      action: {
        label: 'Undo',
        onClick: async () => {
          await undo();
          push({
            title: 'Action undone',
            type: 'info',
            duration: 3000
          });
        }
      },
      duration: 8000
    });
  };
  
  return { executeWithUndo };
}
```

### 4. Mobile-First Responsive Design

#### A. Touch-Friendly Interfaces

```css
/* frontend/src/styles/touch.css */
/* Minimum touch target size: 44x44px (WCAG 2.5.5) */
button, a, input[type="checkbox"], input[type="radio"] {
  min-width: 44px;
  min-height: 44px;
  touch-action: manipulation; /* Disable double-tap zoom */
}

/* Increase spacing for mobile */
@media (max-width: 768px) {
  .button-group {
    gap: 16px; /* Increase from 8px */
  }
  
  .form-field {
    margin-bottom: 24px; /* Increase from 16px */
  }
}

/* Prevent accidental touches */
.destructive-action {
  margin: 16px 0; /* Spacing from other elements */
}
```

#### B. Responsive Typography

```typescript
// frontend/src/styles/typography.ts
export const responsiveText = {
  h1: 'text-3xl md:text-4xl lg:text-5xl font-bold',
  h2: 'text-2xl md:text-3xl lg:text-4xl font-semibold',
  h3: 'text-xl md:text-2xl lg:text-3xl font-semibold',
  body: 'text-base md:text-lg',
  small: 'text-sm md:text-base',
};

// Fluid typography
:root {
  --font-size-base: clamp(1rem, 0.95rem + 0.25vw, 1.125rem);
  --font-size-lg: clamp(1.125rem, 1.05rem + 0.375vw, 1.25rem);
  --font-size-xl: clamp(1.25rem, 1.125rem + 0.625vw, 1.5rem);
}
```

### 5. Micro-interactions & Animations

```typescript
// frontend/src/components/common/AnimatedButton.tsx
import { motion } from 'framer-motion';

export function AnimatedButton({ children, onClick, ...props }: any) {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      onClick={onClick}
      {...props}
    >
      {children}
    </motion.button>
  );
}

// Confetti animation for assessment completion
export function CompletionConfetti() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 pointer-events-none z-50"
    >
      {/* Confetti particles */}
    </motion.div>
  );
}
```

### 6. Empty States & Zero Data

```typescript
// frontend/src/components/common/EmptyState.tsx
interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="w-16 h-16 mb-4 text-gray-400">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {title}
      </h3>
      <p className="text-sm text-gray-600 max-w-sm mb-6">
        {description}
      </p>
      {action && (
        <button
          onClick={action.onClick}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

// Usage
function AssessmentHistory() {
  const { data } = useAssessmentHistory();
  
  if (!data || data.length === 0) {
    return (
      <EmptyState
        icon={<ClipboardList />}
        title="No assessments yet"
        description="Take your first assessment to start tracking your mental wellbeing journey."
        action={{
          label: 'Take Assessment',
          onClick: () => navigate('/assessments')
        }}
      />
    );
  }
  
  return <AssessmentList data={data} />;
}
```

### 7. Onboarding & User Education

```typescript
// frontend/src/components/features/tour/ProductTour.tsx
import Joyride from 'react-joyride';

const DASHBOARD_TOUR_STEPS = [
  {
    target: '.mood-checkin',
    content: 'Track your daily mood here. Quick check-ins help identify patterns.',
    disableBeacon: true,
  },
  {
    target: '.assessment-card',
    content: 'Take comprehensive assessments to get personalized insights.',
  },
  {
    target: '.ai-chat',
    content: 'Chat with our AI companion for support anytime you need it.',
  },
  {
    target: '.wellness-plan',
    content: 'Follow your personalized wellness plan with exercises tailored to you.',
  },
];

export function DashboardTour({ onComplete }: { onComplete: () => void }) {
  return (
    <Joyride
      steps={DASHBOARD_TOUR_STEPS}
      continuous
      showProgress
      showSkipButton
      styles={{
        options: {
          primaryColor: '#0066cc',
          zIndex: 10000,
        },
      }}
      callback={(data) => {
        if (data.status === 'finished' || data.status === 'skipped') {
          onComplete();
        }
      }}
    />
  );
}
```

### 8. Form UX Improvements

```typescript
// frontend/src/components/common/SmartForm.tsx
export function SmartForm() {
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  
  const validateField = (name: string, value: string) => {
    // Real-time validation
    let error = '';
    
    if (name === 'email' && !value.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      error = 'Please enter a valid email address';
    }
    
    if (name === 'password' && value.length < 6) {
      error = 'Password must be at least 6 characters';
    }
    
    setFieldErrors(prev => ({ ...prev, [name]: error }));
  };
  
  return (
    <form>
      <div>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          onBlur={() => setTouched(prev => ({ ...prev, email: true }))}
          onChange={(e) => validateField('email', e.target.value)}
          aria-invalid={touched.email && !!fieldErrors.email}
          aria-describedby={fieldErrors.email ? 'email-error' : undefined}
        />
        {touched.email && fieldErrors.email && (
          <p id="email-error" className="text-red-600 text-sm mt-1" role="alert">
            {fieldErrors.email}
          </p>
        )}
      </div>
    </form>
  );
}
```

### Implementation Priority

**Phase 1 (Week 1-2):**
- ✅ Accessibility audit and keyboard navigation
- ✅ Screen reader support
- ✅ Color contrast fixes
- ✅ Error boundaries

**Phase 2 (Week 3-4):**
- ✅ Loading skeletons
- ✅ Empty states
- ✅ Toast enhancements
- ✅ Mobile responsiveness

**Phase 3 (Month 2):**
- ✅ Product tours
- ✅ Micro-interactions
- ✅ Advanced form validation
- ✅ User testing & iteration
