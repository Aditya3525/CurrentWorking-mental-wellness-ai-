import { ArrowRight, ArrowLeft, Shield, Heart, Users, CheckCircle, AlertTriangle, X } from 'lucide-react';
import React, { useState } from 'react';
import { Button } from '../../ui/button';
import { Card, CardContent } from '../../ui/card';
import { Checkbox } from '../../ui/checkbox';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Progress } from '../../ui/progress';
import { RadioGroup, RadioGroupItem } from '../../ui/radio-group';

interface OnboardingFlowProps {
  onComplete: (profileData: {
    approach?: 'western' | 'eastern' | 'hybrid';
    firstName?: string;
    lastName?: string;
    birthday?: string;
    gender?: string;
    region?: string;
    emergencyContact?: string;
    emergencyPhone?: string;
  }) => void;
  user: { 
    name: string; 
    email: string;
    firstName?: string;
    lastName?: string;
    profilePhoto?: string;
    isGoogleUser?: boolean;
  } | null;
  onClose?: () => void;
}

interface ProfileData {
  firstName?: string;
  lastName?: string;
  birthday?: string;
  gender?: string;
  region?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  dataConsent: boolean;
  clinicianSharing: boolean;
  currentMood?: string;
  approach?: 'western' | 'eastern' | 'hybrid';
}

export function OnboardingFlow({ onComplete, user, onClose }: OnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [profileData, setProfileData] = useState<ProfileData>({
    // Pre-fill with Google data if available
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    dataConsent: false,
    clinicianSharing: false,
  });
  const [birthdayError, setBirthdayError] = useState<string | null>(null);

  const totalSteps = 6;
  const progress = ((currentStep) / (totalSteps - 1)) * 100;

  const validateBirthday = (dateStr: string | undefined) => {
    if (!dateStr) return true; // optional
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) {
      setBirthdayError('Invalid date');
      return false;
    }
    const today = new Date();
    let age = today.getFullYear() - d.getFullYear();
    if (today < new Date(today.getFullYear(), d.getMonth(), d.getDate())) age--;
    if (age < 10 || age > 100) {
      setBirthdayError('Age must be between 10 and 100');
      return false;
    }
    setBirthdayError(null);
    return true;
  };

  const handleNext = () => {
    // Validate birthday on basic profile step
    if (currentStep === 1) {
      const ok = validateBirthday(profileData.birthday);
      if (!ok) return;
    }
    if (currentStep === totalSteps - 1) {
      // Complete onboarding with all profile data
      const completionData = {
        approach: profileData.approach,
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        birthday: profileData.birthday,
        gender: profileData.gender,
        region: profileData.region,
        emergencyContact: profileData.emergencyContact,
        emergencyPhone: profileData.emergencyPhone
      };
      onComplete(completionData);
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0: return true; // Welcome step
      case 1: return true; // Basic profile (all optional)
      case 2: return profileData.dataConsent; // Safety & consent requires data consent
      case 3: return true; // Emergency contacts optional
      case 4: return profileData.approach !== undefined; // Approach selection required
      case 5: return true; // Mood check optional
      default: return false;
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="text-center space-y-6">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              <Heart className="h-10 w-10 text-primary" />
            </div>
            <div className="space-y-4">
              <h2 className="text-2xl">Welcome, {([user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.name)}! 👋</h2>
              <p className="text-muted-foreground text-lg">
                We&apos;re here to support your mental wellbeing journey. This quick setup will help us personalize your experience.
              </p>
              <div className="bg-muted/50 rounded-lg p-4 text-sm space-y-2">
                <p className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  Takes 5-8 minutes to complete
                </p>
                <p className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary" />
                  Your privacy and safety are our top priority
                </p>
                <p className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  You can skip any step and return later
                </p>
              </div>
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl">Tell us about yourself</h2>
              <p className="text-muted-foreground">
                Help us personalize your experience (all fields are optional)
              </p>
              {user?.isGoogleUser && user.profilePhoto && (
                <div className="flex justify-center mb-4">
                  <img 
                    src={user.profilePhoto} 
                    alt="Profile" 
                    className="w-20 h-20 rounded-full border-2 border-primary/20"
                  />
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={profileData.firstName || ''}
                    onChange={(e) => setProfileData(prev => ({ ...prev, firstName: e.target.value }))}
                    placeholder="Your first name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={profileData.lastName || ''}
                    onChange={(e) => setProfileData(prev => ({ ...prev, lastName: e.target.value }))}
                    placeholder="Your last name"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="birthday">Birthday</Label>
                <Input
                  id="birthday"
                  type="date"
                  value={profileData.birthday || ''}
                  onChange={(e) => {
                    setProfileData(prev => ({ ...prev, birthday: e.target.value }));
                    if (birthdayError) setBirthdayError(null);
                  }}
                />
                {birthdayError && (
                  <p className="text-sm text-red-600">{birthdayError}</p>
                )}
              </div>

              <div className="space-y-3">
                <Label>Gender (optional)</Label>
                <RadioGroup 
                  value={profileData.gender || ''} 
                  onValueChange={(value) => setProfileData(prev => ({ ...prev, gender: value }))}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="female" id="female" />
                    <Label htmlFor="female">Female</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="male" id="male" />
                    <Label htmlFor="male">Male</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="non-binary" id="non-binary" />
                    <Label htmlFor="non-binary">Non-binary</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="prefer-not-to-say" id="prefer-not-to-say" />
                    <Label htmlFor="prefer-not-to-say">Prefer not to say</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="region">Country / Region</Label>
                  <select
                    id="region"
                    value={profileData.region || ''}
                    onChange={(e) => setProfileData(prev => ({ ...prev, region: e.target.value }))}
                    className="border-input flex h-9 w-full rounded-md border bg-input-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="">Select country</option>
                    {['India','United States','United Kingdom','Canada','Australia','Germany','France','Spain','Brazil','Japan','Singapore','United Arab Emirates'].map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <Shield className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-2xl">Safety & Privacy</h2>
              <p className="text-muted-foreground">
                Your wellbeing and privacy are our highest priorities
              </p>
            </div>

            <div className="space-y-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                  <div className="space-y-2">
                    <h3 className="font-medium text-red-800">Important Safety Notice</h3>
                    <p className="text-sm text-red-700">
                      This app is designed for general wellbeing support and is not a substitute for professional 
                      medical care. If you&apos;re experiencing a mental health crisis or having thoughts of self-harm, 
                      please contact emergency services immediately.
                    </p>
                    <div className="text-sm text-red-700 font-medium">
                      Crisis Hotlines: 988 (US) | Text &quot;HELLO&quot; to 741741
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="dataConsent"
                    checked={profileData.dataConsent}
                    onCheckedChange={(checked) => 
                      setProfileData(prev => ({ ...prev, dataConsent: checked as boolean }))
                    }
                  />
                  <div className="space-y-1">
                    <Label htmlFor="dataConsent" className="text-sm leading-relaxed">
                      I understand that my responses will be used to personalize my wellbeing experience. 
                      My data is encrypted, secure, and I can delete it at any time.
                    </Label>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="clinicianSharing"
                    checked={profileData.clinicianSharing}
                    onCheckedChange={(checked) => 
                      setProfileData(prev => ({ ...prev, clinicianSharing: checked as boolean }))
                    }
                  />
                  <div className="space-y-1">
                    <Label htmlFor="clinicianSharing" className="text-sm leading-relaxed">
                      (Optional) Allow me to share anonymized insights with licensed clinicians for 
                      research and improved recommendations.
                    </Label>
                  </div>
                </div>
              </div>

              <div className="text-xs text-muted-foreground space-y-1">
                <p>• Your data is never sold to third parties</p>
                <p>• All personal information is encrypted</p>
                <p>• You can export or delete your data anytime</p>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-2xl">Emergency Contact</h2>
              <p className="text-muted-foreground">
                (Optional) Someone we can help you reach in case of emergency
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="emergencyContact">Contact Name</Label>
                <Input
                  id="emergencyContact"
                  value={profileData.emergencyContact || ''}
                  onChange={(e) => setProfileData(prev => ({ ...prev, emergencyContact: e.target.value }))}
                  placeholder="e.g., Mom, Partner, Best Friend"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="emergencyPhone">Phone Number</Label>
                <Input
                  id="emergencyPhone"
                  type="tel"
                  value={profileData.emergencyPhone || ''}
                  onChange={(e) => setProfileData(prev => ({ ...prev, emergencyPhone: e.target.value }))}
                  placeholder="e.g., +1 (555) 123-4567"
                />
              </div>

              <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground">
                <p>
                  We&apos;ll only suggest contacting this person if our AI detects you might be in crisis.
                  You always have full control over whether to reach out.
                </p>
              </div>

              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => {
                  // Clear optional fields then advance to next step
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
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl">Choose Your Wellbeing Approach</h2>
              <p className="text-muted-foreground">
                Select the approach that resonates most with you. You can change this anytime.
              </p>
            </div>

            <div className="space-y-4">
              {[
                {
                  id: 'western',
                  title: 'Therapy-Based (Western)',
                  description: 'Focus on evidence-based therapy techniques, cognitive behavioral strategies, and modern psychological approaches.',
                  icon: '🧠',
                  features: ['CBT & DBT techniques', 'Structured assessments', 'Goal-oriented plans', 'Progress tracking']
                },
                {
                  id: 'eastern',
                  title: 'Yoga-Based (Eastern)', 
                  description: 'Emphasize mindfulness, meditation, yoga practices, and ancient wisdom for holistic wellbeing.',
                  icon: '🧘',
                  features: ['Meditation practices', 'Yoga sessions', 'Breathwork', 'Mind-body connection']
                },
                {
                  id: 'hybrid',
                  title: 'Hybrid (Best of Both)',
                  description: 'Combine Western therapy techniques with Eastern practices for a comprehensive, integrated approach.',
                  icon: '⚖️',
                  features: ['Balanced approach', 'Diverse techniques', 'Holistic healing', 'Flexible methods']
                }
              ].map((approach) => (
                <Button
                  key={approach.id}
                  variant="outline"
                  className={`w-full p-6 h-auto flex-col items-start text-left space-y-3 ${
                    profileData.approach === approach.id 
                      ? 'border-primary bg-primary/5' 
                      : 'hover:bg-muted/50'
                  }`}
                  onClick={() => setProfileData(prev => ({ ...prev, approach: approach.id as 'western' | 'eastern' | 'hybrid' }))}
                >
                  <div className="flex items-center gap-3 w-full">
                    <span className="text-2xl">{approach.icon}</span>
                    <div className="flex-1">
                      <h3 className="font-medium text-base">{approach.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{approach.description}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {approach.features.map((feature) => (
                      <span key={feature} className="text-xs bg-muted px-2 py-1 rounded">
                        {feature}
                      </span>
                    ))}
                  </div>
                </Button>
              ))}
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl">How are you feeling today?</h2>
              <p className="text-muted-foreground">
                This helps us understand your starting point
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { mood: 'Great', emoji: '😊', color: 'bg-green-100 border-green-200 hover:bg-green-200' },
                { mood: 'Good', emoji: '🙂', color: 'bg-blue-100 border-blue-200 hover:bg-blue-200' },
                { mood: 'Okay', emoji: '😐', color: 'bg-yellow-100 border-yellow-200 hover:bg-yellow-200' },
                { mood: 'Struggling', emoji: '😔', color: 'bg-orange-100 border-orange-200 hover:bg-orange-200' },
                { mood: 'Anxious', emoji: '😰', color: 'bg-red-100 border-red-200 hover:bg-red-200' },
                { mood: 'Not sure', emoji: '🤔', color: 'bg-gray-100 border-gray-200 hover:bg-gray-200' },
              ].map(({ mood, emoji, color }) => (
                <Button
                  key={mood}
                  variant="outline"
                  className={`h-20 flex-col gap-2 ${
                    profileData.currentMood === mood 
                      ? 'border-primary bg-primary/10' 
                      : color
                  }`}
                  onClick={() => setProfileData(prev => ({ ...prev, currentMood: mood }))}
                >
                  <span className="text-2xl">{emoji}</span>
                  <span className="text-sm">{mood}</span>
                </Button>
              ))}
            </div>

            <div className="text-center">
              <Button 
                variant="ghost" 
                onClick={() => setProfileData(prev => ({ ...prev, currentMood: '' }))}
              >
                Prefer not to share
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background p-6 flex items-center justify-center">
      <div className="w-full max-w-2xl">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-muted-foreground mb-2">
            <span>Step {currentStep + 1} of {totalSteps}</span>
            <span>{Math.round(progress)}% complete</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Main Content */}
        <Card className="relative">
          {onClose && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-2 right-2 h-8 w-8 p-0 z-10"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
          <CardContent className="p-8">
            {renderStep()}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between mt-6">
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
    </div>
  );
}