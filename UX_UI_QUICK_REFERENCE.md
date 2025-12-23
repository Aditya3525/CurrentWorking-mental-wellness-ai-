# UX/UI Polish - Quick Reference Guide

**Quick guide for developers to use the new UX/UI components**

---

## 🚀 Progressive Web App (PWA)

### Already Integrated ✅
The PWA install prompt appears automatically after 30 seconds for new users. No additional setup needed!

### Check if Installed
```tsx
import { useIsInstalled } from '@/components/ui/pwa-install-prompt';

function Header() {
  const isInstalled = useIsInstalled();
  
  return (
    <div>
      {isInstalled && <Badge>App Mode</Badge>}
    </div>
  );
}
```

### Service Worker Management
```javascript
// Force update service worker
navigator.serviceWorker.controller?.postMessage({ type: 'SKIP_WAITING' });

// Clear all caches
navigator.serviceWorker.controller?.postMessage({ type: 'CLEAR_CACHE' });
```

---

## 📦 Empty States

### Basic Usage
```tsx
import { EmptyState } from '@/components/ui/empty-state';
import { FileQuestion } from 'lucide-react';

<EmptyState
  icon={FileQuestion}
  title="No items found"
  description="Get started by adding your first item"
  action={{
    label: "Add Item",
    onClick: handleAdd
  }}
/>
```

### Compact Version (for cards/sidebars)
```tsx
import { EmptyStateCompact } from '@/components/ui/empty-state';

<EmptyStateCompact
  icon={Inbox}
  title="No messages"
  description="Your inbox is empty"
  action={{ label: "Compose", onClick: handleCompose }}
/>
```

### List Version (for tables)
```tsx
import { EmptyStateList } from '@/components/ui/empty-state';

<EmptyStateList
  icon={Users}
  title="No users found"
  description="Try adjusting your filters"
/>
```

---

## ✨ Success Animations

### Quick Success
```tsx
import { useSuccessAnimation, SuccessAnimation } from '@/components/ui/success-animation';

function SaveButton() {
  const { show, showSuccess } = useSuccessAnimation();
  
  const handleSave = async () => {
    await save();
    showSuccess("Saved successfully!", "checkmark"); // or "confetti" or "sparkle"
  };
  
  return (
    <>
      <Button onClick={handleSave}>Save</Button>
      <SuccessAnimation show={show} />
    </>
  );
}
```

### Custom Duration
```tsx
<SuccessAnimation
  show={show}
  message="Profile updated!"
  variant="confetti"
  duration={3000} // 3 seconds
  onComplete={() => console.log('Animation done')}
/>
```

---

## 📳 Haptic Feedback

### Quick Usage
```tsx
import { hapticButtonClick, hapticSuccess, hapticError } from '@/utils/hapticFeedback';

<Button onClick={() => {
  hapticButtonClick(); // Light vibration
  handleClick();
}}>
  Click Me
</Button>

// On success
await hapticSuccess(); // [10, 50, 10]

// On error
await hapticError(); // [50, 100, 50, 100, 50]
```

### Using the Hook
```tsx
import { useHaptic } from '@/utils/hapticFeedback';

function Component() {
  const haptic = useHaptic();
  
  const handleAction = async () => {
    if (success) {
      await haptic.success();
    } else {
      await haptic.error();
    }
  };
  
  return <Button onClick={handleAction}>Action</Button>;
}
```

### Available Patterns
- `buttonClick()` - Light tap (10ms)
- `success()` - Success pattern
- `error()` - Error pattern
- `warning()` - Warning pattern
- `notification()` - Notification
- `selection()` - Item selection (5ms)
- `impact()` - Heavy impact (40ms)

---

## 🎬 Page Transitions

### Wrap Your Pages
```tsx
import { PageTransition } from '@/components/ui/page-transition';

function Dashboard() {
  return (
    <PageTransition variant="fade"> {/* or "slide" or "scale" */}
      <div>Your content</div>
    </PageTransition>
  );
}
```

### Staggered List Animation
```tsx
import { StaggeredAnimation } from '@/components/ui/page-transition';

<StaggeredAnimation staggerDelay={50}>
  {items.map(item => (
    <Card key={item.id}>{item.name}</Card>
  ))}
</StaggeredAnimation>
```

### Utility Transitions
```tsx
import { 
  FadeInTransition, 
  SlideUpTransition, 
  ScaleInTransition,
  BounceInTransition 
} from '@/components/ui/page-transition';

<FadeInTransition delay={200}>
  <Alert>Important message</Alert>
</FadeInTransition>

<SlideUpTransition>
  <Sheet.Content>Modal content</Sheet.Content>
</SlideUpTransition>

<BounceInTransition>
  <Badge>New!</Badge>
</BounceInTransition>
```

---

## 💬 Contextual Tooltips

### Basic Tooltip
```tsx
import { ContextualTooltip } from '@/components/ui/contextual-tooltip';

<ContextualTooltip content="This helps you understand your progress">
  <span>Progress Score</span>
</ContextualTooltip>
```

### Variants
```tsx
// Help icon
<ContextualTooltip variant="help" content="Click for help">
  <label>Setting Name</label>
</ContextualTooltip>

// Tip (lightbulb)
<ContextualTooltip variant="tip" content="Pro tip: Use keyboard shortcuts">
  <Button>Actions</Button>
</ContextualTooltip>

// Warning
<ContextualTooltip variant="warning" content="This action cannot be undone">
  <Button variant="destructive">Delete</Button>
</ContextualTooltip>
```

### Inline Help Icon
```tsx
import { InlineHelp } from '@/components/ui/contextual-tooltip';

<div className="flex items-center gap-2">
  <label>Complex Setting</label>
  <InlineHelp content="Detailed explanation here" />
</div>
```

### Feature Badge
```tsx
import { FeatureTip } from '@/components/ui/contextual-tooltip';

<FeatureTip badge="New" content="Try our new AI-powered insights!">
  <Button>AI Insights</Button>
</FeatureTip>
```

### Quick Tip Banner
```tsx
import { QuickTip } from '@/components/ui/contextual-tooltip';

<QuickTip 
  variant="tip"
  content="Did you know? You can use keyboard shortcuts for faster navigation"
  onDismiss={() => setShowTip(false)}
/>
```

---

## 🎨 CSS Animations

### Use Built-in Classes

```tsx
// Confetti effect
<div className="animate-confetti" />

// Sparkle effect
<div className="animate-sparkle" />

// Bounce in
<div className="animate-bounce-in" />

// Fade in up
<div className="animate-fade-in-up" />

// Shake (errors)
<div className="animate-shake" />

// Shimmer loading
<div className="animate-shimmer" />

// Button press effect
<button className="btn-press-effect">Press Me</button>

// Hover lift
<div className="hover-lift">Lift on hover</div>
```

### Loading Dots
```tsx
<div className="flex gap-1">
  <div className="loading-dot h-2 w-2 bg-primary rounded-full" />
  <div className="loading-dot h-2 w-2 bg-primary rounded-full" />
  <div className="loading-dot h-2 w-2 bg-primary rounded-full" />
</div>
```

---

## 🛠️ Common Patterns

### Form Submit with Feedback
```tsx
function FormComponent() {
  const { show, showSuccess } = useSuccessAnimation();
  const haptic = useHaptic();
  
  const handleSubmit = async (data) => {
    try {
      await submitForm(data);
      haptic.success();
      showSuccess("Form submitted!", "checkmark");
    } catch (error) {
      haptic.error();
      toast.error("Submission failed");
    }
  };
  
  return (
    <>
      <Form onSubmit={handleSubmit} />
      <SuccessAnimation show={show} />
    </>
  );
}
```

### Empty State with Loading
```tsx
function DataList({ data, isLoading }) {
  if (isLoading) {
    return <Skeleton count={5} />;
  }
  
  if (data.length === 0) {
    return (
      <EmptyState
        icon={Inbox}
        title="No data available"
        description="Add some items to get started"
        action={{
          label: "Add Item",
          onClick: handleAdd
        }}
      />
    );
  }
  
  return <StaggeredAnimation>{data.map(renderItem)}</StaggeredAnimation>;
}
```

### Interactive Button
```tsx
function InteractiveButton() {
  const { showSuccess } = useSuccessAnimation();
  const haptic = useHaptic();
  
  return (
    <button
      className="btn-press-effect hover-lift"
      onClick={async () => {
        haptic.buttonClick();
        await handleAction();
        haptic.success();
        showSuccess("Done!", "checkmark");
      }}
    >
      Click Me
    </button>
  );
}
```

### Page with Transition and Empty State
```tsx
function PageComponent() {
  const { data, isLoading } = useQuery('data', fetchData);
  
  return (
    <PageTransition variant="fade">
      {isLoading ? (
        <Skeleton />
      ) : data?.length === 0 ? (
        <EmptyState
          icon={FileQuestion}
          title="No results"
          action={{ label: "Refresh", onClick: refetch }}
        />
      ) : (
        <StaggeredAnimation>
          {data.map(item => <Card key={item.id}>{item}</Card>)}
        </StaggeredAnimation>
      )}
    </PageTransition>
  );
}
```

---

## 📱 PWA Icon Assets Needed

Create these icon files in `frontend/public/icons/`:

```
icons/
├── icon-72x72.png
├── icon-96x96.png
├── icon-128x128.png
├── icon-144x144.png
├── icon-152x152.png
├── icon-192x192.png
├── icon-384x384.png
├── icon-512x512.png
├── badge-72x72.png
├── shortcut-chat.png
├── shortcut-assessment.png
└── shortcut-mood.png
```

**Quick Tip:** Use a tool like [PWA Asset Generator](https://github.com/elegantapp/pwa-asset-generator) to generate all sizes from a single logo.

---

## 🧪 Testing Checklist

### PWA
- [ ] Install prompt appears on mobile
- [ ] App works offline
- [ ] Service worker caches correctly
- [ ] Icons display properly
- [ ] iOS Add to Home Screen works

### Animations
- [ ] Smooth 60fps on mobile
- [ ] Respects `prefers-reduced-motion`
- [ ] Success animations trigger correctly
- [ ] Page transitions smooth

### Haptics
- [ ] Vibrates on supported devices
- [ ] User preference saves
- [ ] Doesn't error on unsupported devices

### Tooltips
- [ ] Keyboard accessible
- [ ] Screen reader compatible
- [ ] Touch works on mobile
- [ ] Positions correctly

---

## 🔍 Debugging

### Service Worker Issues
```javascript
// Check registration
navigator.serviceWorker.getRegistrations()
  .then(registrations => console.log(registrations));

// Check cache
caches.keys().then(keys => console.log(keys));
```

### Haptic Not Working
```javascript
// Check support
console.log('Haptics supported:', 'vibrate' in navigator);

// Check preference
console.log('User enabled:', getHapticPreference());

// Force enable
setHapticPreference(true);
```

### Animation Performance
```javascript
// Check if reduced motion
const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
console.log('Reduced motion:', prefersReduced);
```

---

## 📚 Full Documentation

See `UX_UI_POLISH_IMPLEMENTATION.md` for complete implementation details, architecture, and advanced usage.

---

**Happy coding! 🎉**
