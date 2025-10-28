# Onboarding Flow - Mobile & Tablet Responsive Implementation Guide

## Overview
This document provides the complete implementation strategy for making the Onboarding Flow mobile and tablet responsive while preserving all desktop functionality.

## Current State Analysis
- **File**: `frontend/src/components/features/onboarding/OnboardingFlow.tsx`
- **Lines**: 972 lines
- **Steps**: 7 steps (Welcome → Profile → Safety → Emergency → Approach → Security → Mood)
- **Current Issues**: 
  - Desktop-only layouts
  - No mobile-specific navigation
  - No responsive form fields
  - Header actions don't adapt to small screens

## Implementation Phases

### Phase 1: Core Responsive Structure ✅ START HERE

#### 1.1 Add Device Detection Hook
```tsx
// At the top of OnboardingFlow component, after existing imports
const device = useDevice();
const { isMobile, isTablet, isTabletPortrait, isDesktop } = device;
```

#### 1.2 Replace Main Container (Line ~894)
**Current**:
```tsx
return (
  <div className="min-h-screen bg-background p-6 flex items-center justify-center">
    <div className="w-full max-w-2xl">
```

**Replace with**:
```tsx
return (
  <div className="min-h-screen bg-background flex flex-col">
    {/* Mobile/Tablet Safe Area Padding */}
    <div className={`flex-1 flex items-center justify-center ${
      isMobile ? 'px-4 py-safe' : 'p-6'
    }`}>
      <div className={`w-full ${
        isMobile ? 'max-w-full' : isTablet ? 'max-w-3xl' : 'max-w-2xl'
      }`}>
```

#### 1.3 Create Responsive Header Component
**Insert after device detection, before renderStep function**:

```tsx
// Responsive Header Component
const renderHeader = () => {
  if (isMobile) {
    // Mobile: Compressed header with overflow menu
    return (
      <div className="sticky top-0 z-50 bg-background border-b px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {currentStep > 0 && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handlePrevious}
                disabled={currentStep === 0}
                className="h-8 w-8"
                aria-label="Previous step"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <span className="text-sm font-medium">
              Step {currentStep + 1}/{totalSteps}
            </span>
          </div>
          
          {/* Mobile Overflow Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => saveProgressToStorage(true)}>
                <Save className="mr-2 h-4 w-4" />
                Save Progress
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleSaveAndExit}>
                <LogOut className="mr-2 h-4 w-4" />
                Save & Exit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExitWithoutSaving}>
                Skip to Dashboard
              </DropdownMenuItem>
              {currentStep > 0 && (
                <DropdownMenuItem onClick={handleStartFresh} className="text-destructive">
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  Start Fresh
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        {/* Progress Bar */}
        <div className="mt-3">
          <Progress value={progress} className="h-1.5" />
          <p className="text-xs text-muted-foreground mt-1">
            {Math.round(progress)}% complete
          </p>
        </div>
      </div>
    );
  }

  if (isTablet) {
    // Tablet: Keep some actions visible
    return (
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          {currentStep > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleStartFresh}
              className="flex items-center gap-2"
            >
              <AlertTriangle className="h-3 w-3" />
              <span className="hidden sm:inline">Start Fresh</span>
            </Button>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSaveAndExit}
            className="flex items-center gap-2"
          >
            <Save className="h-3 w-3" />
            Save & Exit
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleExitWithoutSaving}>
                Skip to Dashboard
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    );
  }

  // Desktop: Original header (unchanged)
  return (
    <div className="flex items-center justify-between mb-4">
      {currentStep > 0 ? (
        <Button
          variant="outline"
          size="sm"
          onClick={handleStartFresh}
          className="flex items-center gap-2"
        >
          <AlertTriangle className="h-4 w-4" />
          Start Fresh
        </Button>
      ) : (
        <div className="flex-1" />
      )}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleSaveAndExit}
          className="flex items-center gap-2"
        >
          <Save className="h-4 w-4" />
          Save & Exit
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleExitWithoutSaving}
          className="flex items-center gap-2 text-muted-foreground"
          title="Exit to dashboard and complete onboarding later"
        >
          <LogOut className="h-4 w-4" />
          Skip to Dashboard
        </Button>
      </div>
    </div>
  );
};
```

#### 1.4 Create Sticky Bottom Action Bar for Mobile
**Insert before return statement**:

```tsx
// Mobile Sticky Bottom Action Bar
const renderMobileActions = () => {
  if (!isMobile) return null;

  return (
    <div className="sticky bottom-0 left-0 right-0 bg-background border-t p-4 safe-bottom">
      <div className="flex flex-col gap-3">
        {/* Secondary Actions */}
        <div className="flex items-center justify-between text-sm">
          {currentStep > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className="h-9"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Previous
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => saveProgressToStorage(true)}
            className="h-9 text-muted-foreground"
          >
            Save & continue later
          </Button>
        </div>

        {/* Primary Action */}
        <Button
          onClick={handleNext}
          disabled={!canProceed()}
          className="w-full h-12 text-base font-medium"
          size="lg"
        >
          {currentStep === totalSteps - 1 ? 'Complete Setup' : 'Next Step'}
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
      </div>
    </div>
  );
};
```

#### 1.5 Update Progress Bar Display (Desktop/Tablet Only)
**Replace existing progress section (Line ~928)**:

```tsx
{/* Progress Bar - Desktop/Tablet Only (Mobile shows in header) */}
{!isMobile && (
  <div className="mb-8">
    <div className="flex justify-between text-sm text-muted-foreground mb-2">
      <span>Step {currentStep + 1} of {totalSteps}</span>
      <span>{Math.round(progress)}% complete</span>
    </div>
    <Progress value={progress} className="h-2" />
  </div>
)}
```

#### 1.6 Update Card Padding
**Replace Card component (Line ~936)**:

```tsx
<Card>
  <CardContent className={`${
    isMobile ? 'p-4 pb-24' : isTablet ? 'p-6' : 'p-8'
  }`}>
    {renderStep()}
  </CardContent>
</Card>
```

#### 1.7 Update Navigation Section (Desktop/Tablet Only)
**Replace navigation section (Line ~942)**:

```tsx
{/* Navigation - Desktop/Tablet Only */}
{!isMobile && (
  <div className="flex flex-col gap-3 mt-6">
    <Button
      variant="outline"
      onClick={() => saveProgressToStorage(true)}
      className="flex items-center gap-2 self-start"
    >
      <Save className="h-4 w-4" />
      Save & continue later
    </Button>

    <div className="flex justify-between gap-3">
      <Button
        variant="outline"
        onClick={handlePrevious}
        disabled={currentStep === 0}
        className="flex items-center gap-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Previous
      </Button>

      <Button
        onClick={handleNext}
        disabled={!canProceed()}
        className="flex items-center gap-2"
      >
        {currentStep === totalSteps - 1 ? 'Complete Setup' : 'Next Step'}
        <ArrowRight className="h-4 w-4" />
      </Button>
    </div>
  </div>
)}
```

### Phase 2: Form Field Responsiveness

#### 2.1 Update Step 1 (Profile Details) - Lines ~420-520
**Replace name fields section**:

```tsx
<div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'sm:grid-cols-2'}`}>
  <div className="space-y-2">
    <Label htmlFor="firstName">
      First Name <span className="text-destructive">*</span>
    </Label>
    <Input
      id="firstName"
      name="given-name"
      autoComplete="given-name"
      autoCapitalize="words"
      placeholder="e.g., Sarah"
      value={profileData.firstName || ''}
      onChange={(e) => {
        setProfileData(prev => ({ ...prev, firstName: e.target.value }));
        setValidationErrors(prev => ({ ...prev, firstName: '' }));
      }}
      className={validationErrors.firstName ? 'border-destructive' : ''}
      aria-invalid={!!validationErrors.firstName}
      aria-describedby={validationErrors.firstName ? 'firstName-error' : undefined}
    />
    {validationErrors.firstName && (
      <p id="firstName-error" className="text-xs text-destructive" role="alert">
        {validationErrors.firstName}
      </p>
    )}
  </div>

  <div className="space-y-2">
    <Label htmlFor="lastName">
      Last Name <span className="text-destructive">*</span>
    </Label>
    <Input
      id="lastName"
      name="family-name"
      autoComplete="family-name"
      autoCapitalize="words"
      placeholder="e.g., Johnson"
      value={profileData.lastName || ''}
      onChange={(e) => {
        setProfileData(prev => ({ ...prev, lastName: e.target.value }));
        setValidationErrors(prev => ({ ...prev, lastName: '' }));
      }}
      className={validationErrors.lastName ? 'border-destructive' : ''}
      aria-invalid={!!validationErrors.lastName}
      aria-describedby={validationErrors.lastName ? 'lastName-error' : undefined}
    />
    {validationErrors.lastName && (
      <p id="lastName-error" className="text-xs text-destructive" role="alert">
        {validationErrors.lastName}
      </p>
    )}
  </div>
</div>
```

#### 2.2 Update Birthday Field with Mobile-Friendly Input
```tsx
<div className="space-y-2">
  <Label htmlFor="birthday">
    Birthday <span className="text-destructive">*</span>
  </Label>
  <Input
    id="birthday"
    type="date"
    name="bday"
    autoComplete="bday"
    value={profileData.birthday || ''}
    onChange={(e) => {
      setProfileData(prev => ({ ...prev, birthday: e.target.value }));
      validateBirthday(e.target.value);
      setValidationErrors(prev => ({ ...prev, birthday: '' }));
    }}
    className={`${validationErrors.birthday || birthdayError ? 'border-destructive' : ''} ${
      isMobile ? 'text-base' : ''
    }`}
    aria-invalid={!!(validationErrors.birthday || birthdayError)}
    aria-describedby={(validationErrors.birthday || birthdayError) ? 'birthday-error' : undefined}
    max={new Date().toISOString().split('T')[0]}
  />
  {(validationErrors.birthday || birthdayError) && (
    <p id="birthday-error" className="text-xs text-destructive" role="alert">
      {validationErrors.birthday || birthdayError}
    </p>
  )}
  <p className="text-xs text-muted-foreground">
    Must be between 10 and 100 years old
  </p>
</div>
```

#### 2.3 Update Gender Radio Group for Better Mobile UX
```tsx
<div className="space-y-2">
  <Label>
    Gender <span className="text-destructive">*</span>
  </Label>
  <RadioGroup
    value={profileData.gender || ''}
    onValueChange={(value) => {
      setProfileData(prev => ({ ...prev, gender: value }));
      setValidationErrors(prev => ({ ...prev, gender: '' }));
    }}
    className={isMobile ? 'flex flex-col gap-3' : 'grid grid-cols-2 gap-3'}
    aria-invalid={!!validationErrors.gender}
  >
    {['Male', 'Female', 'Non-binary', 'Prefer not to say'].map((gender) => (
      <div key={gender} className={`flex items-center space-x-2 rounded-md border p-3 ${
        profileData.gender === gender ? 'border-primary bg-primary/5' : 'border-input'
      } ${isMobile ? 'min-h-[48px]' : ''}`}>
        <RadioGroupItem value={gender} id={`gender-${gender}`} />
        <Label
          htmlFor={`gender-${gender}`}
          className="flex-1 cursor-pointer font-normal"
        >
          {gender}
        </Label>
      </div>
    ))}
  </RadioGroup>
  {validationErrors.gender && (
    <p className="text-xs text-destructive" role="alert">
      {validationErrors.gender}
    </p>
  )}
</div>
```

#### 2.4 Update Step 2 (Safety & Privacy) Consent Section
**Make checkboxes more touch-friendly**:

```tsx
<div className="space-y-4">
  <div className="space-y-3">
    {[
      {
        id: 'dataConsent',
        label: 'I consent to secure data collection',
        description: 'Required for personalized recommendations',
        required: true
      },
      {
        id: 'clinicianSharing',
        label: 'Allow sharing with licensed clinicians (optional)',
        description: 'Your data can be shared with mental health professionals if you choose',
        required: false
      }
    ].map((consent) => (
      <div
        key={consent.id}
        className={`flex items-start space-x-3 rounded-lg border p-4 ${
          isMobile ? 'min-h-[56px]' : ''
        } ${
          consent.id === 'dataConsent' && !profileData[consent.id as keyof ProfileData]
            ? 'border-destructive bg-destructive/5'
            : 'border-input'
        }`}
      >
        <Checkbox
          id={consent.id}
          checked={profileData[consent.id as keyof ProfileData] as boolean || false}
          onCheckedChange={(checked) => {
            setProfileData(prev => ({
              ...prev,
              [consent.id]: checked === true
            }));
          }}
          className={isMobile ? 'mt-0.5 h-5 w-5' : ''}
          aria-required={consent.required}
        />
        <div className="flex-1 space-y-1">
          <Label
            htmlFor={consent.id}
            className={`cursor-pointer font-medium ${isMobile ? 'text-sm' : ''}`}
          >
            {consent.label}
            {consent.required && <span className="text-destructive ml-1">*</span>}
          </Label>
          <p className={`text-muted-foreground ${isMobile ? 'text-xs' : 'text-sm'}`}>
            {consent.description}
          </p>
        </div>
      </div>
    ))}
  </div>
</div>
```

#### 2.5 Update Step 3 (Emergency Contact) for Mobile
```tsx
<div className="space-y-4">
  <div className="space-y-2">
    <Label htmlFor="emergencyContact">Emergency Contact Name</Label>
    <Input
      id="emergencyContact"
      name="name"
      autoComplete="name"
      autoCapitalize="words"
      placeholder="e.g., John Smith"
      value={profileData.emergencyContact || ''}
      onChange={(e) => setProfileData(prev => ({ ...prev, emergencyContact: e.target.value }))}
      className={isMobile ? 'text-base' : ''}
    />
    <p className="text-xs text-muted-foreground">
      Someone we can contact in case of emergency
    </p>
  </div>

  <div className="space-y-2">
    <Label htmlFor="emergencyPhone">Emergency Contact Phone</Label>
    <Input
      id="emergencyPhone"
      type="tel"
      name="tel"
      autoComplete="tel"
      inputMode="tel"
      placeholder="+1 (555) 123-4567"
      value={profileData.emergencyPhone || ''}
      onChange={(e) => setProfileData(prev => ({ ...prev, emergencyPhone: e.target.value }))}
      className={isMobile ? 'text-base' : ''}
    />
    <p className="text-xs text-muted-foreground">
      Include country code for international numbers
    </p>
  </div>

  {/* Mobile: Full-width skip button */}
  <div className={isMobile ? 'pt-2' : ''}>
    <Button 
      variant="outline" 
      className={isMobile ? 'w-full' : ''}
      onClick={() => {
        setProfileData(prev => ({ 
          ...prev, 
          emergencyContact: '', 
          emergencyPhone: '' 
        }));
        setCurrentStep(currentStep + 1);
      }}
    >
      Skip this step
    </Button>
  </div>
</div>
```

#### 2.6 Update Step 4 (Approach Selection) for Better Mobile Layout
```tsx
<div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'sm:grid-cols-1 lg:grid-cols-3'}`}>
  {[
    {
      id: 'western',
      title: 'Therapy-Based',
      subtitle: '(Western)',
      description: 'Evidence-based therapy, CBT strategies, and modern psychological approaches.',
      icon: '🧠',
      features: ['CBT & DBT', 'Assessments', 'Goal plans', 'Tracking']
    },
    {
      id: 'eastern',
      title: 'Yoga-Based',
      subtitle: '(Eastern)', 
      description: 'Mindfulness, meditation, yoga practices, and ancient wisdom.',
      icon: '🧘',
      features: ['Meditation', 'Yoga', 'Breathwork', 'Mind-body']
    },
    {
      id: 'hybrid',
      title: 'Hybrid',
      subtitle: '(Best of Both)',
      description: 'Combine Western therapy with Eastern practices for integrated wellbeing.',
      icon: '⚖️',
      features: ['Balanced', 'Diverse', 'Holistic', 'Flexible']
    }
  ].map((approach) => (
    <Button
      key={approach.id}
      variant="outline"
      className={`${isMobile ? 'h-auto' : 'h-auto'} p-4 flex-col items-start text-left space-y-3 ${
        profileData.approach === approach.id 
          ? 'border-primary bg-primary/5 ring-2 ring-primary' 
          : 'hover:bg-muted/50'
      }`}
      onClick={() => {
        const selectedApproach = approach.id as ProfileData['approach'];
        setProfileData(prev => ({ ...prev, approach: selectedApproach }));
      }}
    >
      <div className="flex items-start gap-3 w-full">
        <span className={`${isMobile ? 'text-3xl' : 'text-2xl'} flex-shrink-0`}>
          {approach.icon}
        </span>
        <div className="flex-1 min-w-0">
          <h3 className={`font-semibold ${isMobile ? 'text-base' : 'text-base'}`}>
            {approach.title}
          </h3>
          <p className="text-xs text-muted-foreground">{approach.subtitle}</p>
          <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-muted-foreground mt-2 leading-relaxed`}>
            {approach.description}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5 w-full">
        {approach.features.map((feature) => (
          <span key={feature} className="text-xs bg-muted px-2 py-0.5 rounded-full">
            {feature}
          </span>
        ))}
      </div>
    </Button>
  ))}
</div>
```

#### 2.7 Update Step 6 (Mood Check) Grid for Mobile
```tsx
<div className={`grid gap-3 ${
  isMobile ? 'grid-cols-2' : 'sm:grid-cols-2 md:grid-cols-3'
}`}>
  {[
    { mood: 'Great', emoji: '😊', color: 'bg-green-100 border-green-200' },
    { mood: 'Good', emoji: '🙂', color: 'bg-blue-100 border-blue-200' },
    { mood: 'Okay', emoji: '😐', color: 'bg-yellow-100 border-yellow-200' },
    { mood: 'Struggling', emoji: '😔', color: 'bg-orange-100 border-orange-200' },
    { mood: 'Anxious', emoji: '😰', color: 'bg-red-100 border-red-200' },
    { mood: 'Not sure', emoji: '🤔', color: 'bg-gray-100 border-gray-200' },
  ].map(({ mood, emoji, color }) => (
    <Button
      key={mood}
      variant="outline"
      className={`${isMobile ? 'h-24' : 'h-20'} flex-col gap-2 ${
        profileData.currentMood === mood 
          ? 'border-primary bg-primary/10 ring-2 ring-primary' 
          : color
      }`}
      onClick={() => setProfileData(prev => ({ ...prev, currentMood: mood }))}
    >
      <span className={isMobile ? 'text-3xl' : 'text-2xl'}>{emoji}</span>
      <span className={`${isMobile ? 'text-sm' : 'text-sm'} font-medium`}>{mood}</span>
    </Button>
  ))}
</div>
```

### Phase 3: Final Layout Assembly

**Replace the entire return statement (starting ~Line 894) with:**

```tsx
return (
  <div className="min-h-screen bg-background flex flex-col">
    {/* Render responsive header */}
    {renderHeader()}

    {/* Main Content Area */}
    <div className={`flex-1 flex items-center justify-center ${
      isMobile ? 'px-4 pb-4' : 'p-6'
    }`}>
      <div className={`w-full ${
        isMobile ? 'max-w-full' : isTablet ? 'max-w-3xl' : 'max-w-2xl'
      }`}>
        {/* Progress Bar - Desktop/Tablet Only */}
        {!isMobile && (
          <div className="mb-8">
            <div className="flex justify-between text-sm text-muted-foreground mb-2">
              <span>Step {currentStep + 1} of {totalSteps}</span>
              <span>{Math.round(progress)}% complete</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {/* Main Content Card */}
        <Card className={isMobile ? 'border-0 shadow-none' : ''}>
          <CardContent className={`${
            isMobile ? 'p-4 pb-32' : isTablet ? 'p-6' : 'p-8'
          }`}>
            {renderStep()}
          </CardContent>
        </Card>

        {/* Navigation - Desktop/Tablet Only */}
        {!isMobile && (
          <div className="flex flex-col gap-3 mt-6">
            <Button
              variant="outline"
              onClick={() => saveProgressToStorage(true)}
              className="flex items-center gap-2 self-start"
            >
              <Save className="h-4 w-4" />
              Save & continue later
            </Button>

            <div className="flex justify-between gap-3">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentStep === 0}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Previous
              </Button>

              <Button
                onClick={handleNext}
                disabled={!canProceed()}
                className="flex items-center gap-2"
              >
                {currentStep === totalSteps - 1 ? 'Complete Setup' : 'Next Step'}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>

    {/* Mobile Sticky Bottom Action Bar */}
    {renderMobileActions()}
  </div>
);
```

## CSS Additions Required

Add to `frontend/src/index.css` or global styles:

```css
/* Safe area support for mobile devices */
@supports (padding: max(0px)) {
  .safe-bottom {
    padding-bottom: max(1rem, env(safe-area-inset-bottom));
  }
  
  .py-safe {
    padding-top: max(1rem, env(safe-area-inset-top));
    padding-bottom: max(1rem, env(safe-area-inset-bottom));
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

/* Focus visible for accessibility */
:focus-visible {
  outline: 2px solid hsl(var(--primary));
  outline-offset: 2px;
}

/* Improve touch targets on mobile */
@media (max-width: 767px) {
  button,
  a,
  input,
  select,
  textarea {
    min-height: 44px;
    min-width: 44px;
  }
}
```

## Testing Checklist

### Mobile (320px - 767px)
- [ ] Header shows compressed with overflow menu
- [ ] Progress bar visible in header
- [ ] All form fields single-column
- [ ] Sticky bottom action bar visible
- [ ] "Next Step" button full-width with 48px height
- [ ] All tap targets ≥44px
- [ ] No horizontal scroll
- [ ] Keyboard doesn't overlap actions
- [ ] Safe area padding on notched devices

### Tablet Portrait (768px - 991px)
- [ ] Two-column layout for name fields
- [ ] Header shows "Save & Exit" button
- [ ] Progress bar at top
- [ ] Actions at bottom of card
- [ ] No sticky elements

### Tablet Landscape (992px - 1199px)
- [ ] Similar to tablet portrait
- [ ] More breathing room
- [ ] Two-column grids where appropriate

### Desktop (≥1200px)
- [ ] Original layout preserved
- [ ] All functionality unchanged
- [ ] No visual regressions

### Accessibility
- [ ] Screen reader navigation logical
- [ ] Keyboard navigation works
- [ ] Focus indicators visible
- [ ] Color contrast ≥4.5:1
- [ ] Form validation announces errors
- [ ] ARIA labels present

### Performance
- [ ] No layout shift (CLS ≤0.1)
- [ ] Step transitions <150ms
- [ ] No jank on interactions
- [ ] Smooth scrolling

## Implementation Order

1. ✅ Add device detection hook
2. ✅ Implement responsive header
3. ✅ Create mobile action bar
4. ✅ Update main container layout
5. ✅ Make progress bar conditional
6. ✅ Update form fields responsiveness
7. ✅ Add CSS for safe areas
8. ✅ Test on all breakpoints
9. Add CSS animations with reduced motion support
10. Implement error summary with focus management
11. Add analytics tracking

## Files Modified
- `frontend/src/components/features/onboarding/OnboardingFlow.tsx` (main file)
- `frontend/src/index.css` or `frontend/src/App.css` (global styles)

## Estimated Implementation Time
- Phase 1 (Core Structure): 2-3 hours
- Phase 2 (Form Fields): 1-2 hours
- Phase 3 (Testing & Polish): 1-2 hours
- **Total**: 4-7 hours

## Notes
- All desktop functionality preserved
- Progressive enhancement approach
- Accessibility-first design
- Performance optimized
- Future-ready for Phase 2 enhancements (bottom sheets, native pickers)
