import {
  ArrowLeft,
  User,
  Shield,
  Bell,
  Accessibility,
  Download,
  Trash2,
  AlertTriangle,
  Lock,
  Smartphone,
  Monitor,
  KeyRound,
  BookOpen,
  MessageSquareLock
} from 'lucide-react';
import React, { type Dispatch, type SetStateAction, useMemo, useState } from 'react';

import { useAccessibility } from '../../../contexts/AccessibilityContext';
import { authApi, usersApi } from '../../../services/api';
import { Alert, AlertDescription, AlertTitle } from '../../ui/alert';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { RadioGroup, RadioGroupItem } from '../../ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Separator } from '../../ui/separator';
import { Switch } from '../../ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';

interface ProfileUser {
  id: string;
  name: string;
  email: string;
  birthday?: string;
  region?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  firstName?: string;
  lastName?: string;
  approach?: 'western' | 'eastern' | 'hybrid';
  securityQuestion?: string | null;
}

interface ProfileProps {
  user: ProfileUser | null;
  onNavigate: (page: string) => void;
  setUser: Dispatch<SetStateAction<ProfileUser | null>>;
  onLogout?: () => void;
}

export function Profile({ user, onNavigate, setUser, onLogout }: ProfileProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [securityQuestionError, setSecurityQuestionError] = useState<string | null>(null);
  const [securityQuestionSuccess, setSecurityQuestionSuccess] = useState<string | null>(null);
  const [passwordResetError, setPasswordResetError] = useState<string | null>(null);
  const [passwordResetSuccess, setPasswordResetSuccess] = useState<string | null>(null);
  const [approachUpdateError, setApproachUpdateError] = useState<string | null>(null);
  const [approachUpdateSuccess, setApproachUpdateSuccess] = useState<string | null>(null);
  const [isUpdatingSecurityQuestion, setIsUpdatingSecurityQuestion] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [isUpdatingApproach, setIsUpdatingApproach] = useState(false);
  const [editedProfile, setEditedProfile] = useState({
  firstName: user?.firstName || '',
  lastName: user?.lastName || '',
    email: user?.email || '',
  birthday: user?.birthday ? user.birthday.split('T')[0] : '',
  region: user?.region || '',
  emergencyContact: user?.emergencyContact || '',
  emergencyPhone: user?.emergencyPhone || ''
  });
  const [birthdayError, setBirthdayError] = useState<string | null>(null);

  const [privacySettings, setPrivacySettings] = useState({
    dataSharing: false,
    clinicianAccess: false,
    anonymousAnalytics: true,
    marketingEmails: false,
    researchParticipation: false
  });

  const [notificationSettings, setNotificationSettings] = useState({
    practiceReminders: true,
    assessmentReminders: true,
    progressUpdates: true,
    wellbeingTips: true,
    emergencyAlerts: true,
    emailNotifications: true,
    pushNotifications: true
  });

  const {
    settings: accessibilitySettings,
    setSetting: setAccessibilitySetting,
    resetSettings: resetAccessibilitySettings,
    speak: speakAccessibility,
    isVoiceGuidanceSupported,
    setFontFamily
  } = useAccessibility();

  const fontOptions: Array<{ value: typeof accessibilitySettings.fontFamily; label: string; subtitle: string; stack?: string }> = [
    { value: 'system', label: 'System Default', subtitle: 'Match your device preferences' },
    { value: 'roboto', label: 'Roboto', subtitle: 'Digital-first sans-serif with confident strokes', stack: '"Roboto", "Helvetica Neue", Helvetica, Arial, sans-serif' },
    { value: 'openSans', label: 'Open Sans', subtitle: 'Versatile legibility across many devices', stack: '"Open Sans", "Segoe UI", "Helvetica Neue", Arial, sans-serif' },
    { value: 'lato', label: 'Lato', subtitle: 'Friendly, rounded sans-serif for balanced reading', stack: '"Lato", "Helvetica Neue", Helvetica, Arial, sans-serif' },
    { value: 'inter', label: 'Inter', subtitle: 'Modern UI font optimized for screens', stack: '"Inter", "Helvetica Neue", Helvetica, Arial, sans-serif' },
    { value: 'poppins', label: 'Poppins', subtitle: 'Geometric sans-serif with approachable character', stack: '"Poppins", "Helvetica Neue", Helvetica, Arial, sans-serif' },
    { value: 'montserrat', label: 'Montserrat', subtitle: 'Wide geometric sans-serif, crisp and scalable', stack: '"Montserrat", "Helvetica Neue", Helvetica, Arial, sans-serif' },
    { value: 'workSans', label: 'Work Sans', subtitle: 'Readable sans-serif tuned for UI elements', stack: '"Work Sans", "Helvetica Neue", Helvetica, Arial, sans-serif' },
    { value: 'nunito', label: 'Nunito', subtitle: 'Soft, modern sans-serif with high readability', stack: '"Nunito", "Helvetica Neue", Helvetica, Arial, sans-serif' },
    { value: 'helvetica', label: 'Helvetica', subtitle: 'Classic neutral sans-serif for a professional look', stack: '"Helvetica Neue", Helvetica, Arial, sans-serif' },
    { value: 'arial', label: 'Arial', subtitle: 'Clean sans-serif for easy reading', stack: '"Arial", "Helvetica Neue", Helvetica, sans-serif' },
    { value: 'verdana', label: 'Verdana', subtitle: 'Wide sans-serif for maximum clarity', stack: '"Verdana", "Geneva", sans-serif' },
    { value: 'georgia', label: 'Georgia', subtitle: 'Elegant serif tuned for screens', stack: '"Georgia", "Times New Roman", serif' },
    { value: 'times', label: 'Times New Roman', subtitle: 'Classic serif with print-like feel', stack: '"Times New Roman", Times, serif' }
  ];

  const selectedFontOption = fontOptions.find(o => o.value === accessibilitySettings.fontFamily);
  const selectedFontStack = selectedFontOption?.stack;

  const DEFAULT_SECURITY_QUESTIONS = useMemo(
    () => [
      "What is your mother's maiden name?",
      'What was the name of your first pet?',
      'What city were you born in?',
      "What is your favorite teacher's name?",
      'What was the model of your first mobile phone?',
      "What is your favorite childhood friend's name?",
      'What is your favorite movie?',
      'What was the name of your first school?',
      "What's your favorite food?",
      "What's your dream job as a child?"
    ],
    []
  );

  const connectedDevices = [
    { name: 'iPhone 14', type: 'mobile', lastActive: '2 minutes ago', current: true },
    { name: 'MacBook Pro', type: 'desktop', lastActive: '1 hour ago', current: false },
    { name: 'iPad Air', type: 'tablet', lastActive: '3 days ago', current: false }
  ];

  const [securityQuestionForm, setSecurityQuestionForm] = useState({
    currentPassword: '',
    mode: 'predefined' as 'predefined' | 'custom',
    question: DEFAULT_SECURITY_QUESTIONS[0] ?? '',
    customQuestion: '',
    answer: ''
  });

  const [passwordResetForm, setPasswordResetForm] = useState({
    answer: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [approachForm, setApproachForm] = useState({
    password: '',
    approach: (user?.approach as 'western' | 'eastern' | 'hybrid' | undefined) || 'hybrid'
  });

  const validateBirthday = (dateStr: string | undefined) => {
    if (!dateStr) return true;
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

  const handleSaveProfile = async () => {
    if (!user) return;
    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);
    try {
      if (!validateBirthday(editedProfile.birthday)) {
        setIsSaving(false);
        return;
      }
      // Build payload with only allowed & present fields
  const payload: Partial<ProfileUser & { emergencyContact: string; emergencyPhone: string; region: string; birthday: string }> = {};
  if (editedProfile.firstName && editedProfile.firstName !== user.firstName) payload.firstName = editedProfile.firstName;
  if (editedProfile.lastName && editedProfile.lastName !== user.lastName) payload.lastName = editedProfile.lastName;
      if (editedProfile.birthday) {
        // Normalize to YYYY-MM-DD
        const raw = editedProfile.birthday;
        if (/^\d{2}-\d{2}-\d{4}$/.test(raw)) {
          const [dd, mm, yyyy] = raw.split('-');
          payload.birthday = `${yyyy}-${mm}-${dd}`;
        } else {
          payload.birthday = raw; // assume already YYYY-MM-DD from date input
        }
      }
      if (editedProfile.region !== undefined) payload.region = editedProfile.region;
      if (editedProfile.emergencyContact !== undefined) payload.emergencyContact = editedProfile.emergencyContact;
      if (editedProfile.emergencyPhone !== undefined) payload.emergencyPhone = editedProfile.emergencyPhone;

      if (Object.keys(payload).length === 0) {
        setIsEditing(false);
        setIsSaving(false);
        return;
      }

      const resp = await usersApi.updateProfile(user.id, payload);
      if (!resp.success || !resp.data) {
        throw new Error(resp.error || 'Update failed');
      }
      // Merge returned user (authoritative) with any other existing local fields
  setUser(prev => (prev ? { ...prev, ...resp.data!.user } : resp.data!.user));
      setSaveSuccess(true);
      setIsEditing(false);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setIsSaving(false);
      // Auto-clear success after brief delay
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  };

  const handleDeleteAccount = () => {
    // In a real app, this would make an API call
    console.log('Account deletion requested');
    setShowDeleteConfirm(false);
    onNavigate('landing');
  };

  const handleExportData = () => {
    // In a real app, this would generate and download user data
    console.log('Data export requested');
  };

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'mobile': return <Smartphone className="h-4 w-4" />;
      case 'desktop': return <Monitor className="h-4 w-4" />;
      case 'tablet': return <Smartphone className="h-4 w-4" />;
    }
  };

  const normalizeSecurityQuestionPayload = () => {
    const question = securityQuestionForm.mode === 'custom'
      ? securityQuestionForm.customQuestion.trim()
      : securityQuestionForm.question.trim();

    return {
      currentPassword: securityQuestionForm.currentPassword,
      question,
      answer: securityQuestionForm.answer.trim()
    };
  };

  const handleUpdateSecurityQuestion = async () => {
    if (!user) return;
    const payload = normalizeSecurityQuestionPayload();

    if (!payload.currentPassword) {
      setSecurityQuestionError('Please enter your current password to update your security question.');
      return;
    }

    if (!payload.question) {
      setSecurityQuestionError('Please select or provide a security question.');
      return;
    }

    if (!payload.answer) {
      setSecurityQuestionError('Please provide an answer to your security question.');
      return;
    }

    setIsUpdatingSecurityQuestion(true);
    setSecurityQuestionError(null);
    setSecurityQuestionSuccess(null);

    try {
      const response = await authApi.updateSecurityQuestionWithPassword(payload);
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to update security question');
      }

  setUser(prev => (prev ? { ...prev, ...response.data!.user } : response.data!.user));

      setSecurityQuestionSuccess('Security question updated successfully.');
      setSecurityQuestionForm({
        currentPassword: '',
        mode: 'predefined',
        question: DEFAULT_SECURITY_QUESTIONS[0] ?? '',
        customQuestion: '',
        answer: ''
      });
    } catch (error) {
      setSecurityQuestionError(error instanceof Error ? error.message : 'Unable to update security question');
    } finally {
      setIsUpdatingSecurityQuestion(false);
      setTimeout(() => setSecurityQuestionSuccess(null), 4000);
    }
  };

  const handleResetPasswordWithAnswer = async () => {
    if (!user) return;
    setPasswordResetError(null);
    setPasswordResetSuccess(null);

    const { answer, newPassword, confirmPassword } = passwordResetForm;

    if (!answer.trim()) {
      setPasswordResetError('Please answer your security question to continue.');
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setPasswordResetError('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordResetError('New password and confirmation do not match.');
      return;
    }

    setIsResettingPassword(true);

    try {
      const response = await authApi.resetPasswordAuthenticated({
        answer: answer.trim(),
        newPassword
      });

      if (!response.success) {
        throw new Error(response.error || 'Unable to update password');
      }

      setPasswordResetSuccess('Password updated successfully. You can use it the next time you sign in.');
      setPasswordResetForm({ answer: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      setPasswordResetError(error instanceof Error ? error.message : 'Failed to update password');
    } finally {
      setIsResettingPassword(false);
      setTimeout(() => setPasswordResetSuccess(null), 4000);
    }
  };

  const handleUpdateApproach = async () => {
    if (!user) return;
    setApproachUpdateError(null);
    setApproachUpdateSuccess(null);

    if (!approachForm.password) {
      setApproachUpdateError('Please enter your password to confirm this change.');
      return;
    }

    setIsUpdatingApproach(true);

    try {
      const response = await authApi.updateApproachWithPassword({
        password: approachForm.password,
        approach: approachForm.approach,
      });

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Unable to update approach');
      }

  setUser(prev => (prev ? { ...prev, ...response.data!.user } : response.data!.user));

      setApproachUpdateSuccess('Approach preference updated successfully.');
      setApproachForm({ password: '', approach: response.data!.user.approach as 'western' | 'eastern' | 'hybrid' });
    } catch (error) {
      setApproachUpdateError(error instanceof Error ? error.message : 'Failed to update approach');
    } finally {
      setIsUpdatingApproach(false);
      setTimeout(() => setApproachUpdateSuccess(null), 4000);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/10 to-accent/10 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => onNavigate('dashboard')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center">
              <User className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl">{[user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.name}</h1>
              <p className="text-muted-foreground">{user?.email}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        <Tabs defaultValue="personal" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="personal">Personal</TabsTrigger>
            <TabsTrigger value="privacy">Privacy</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="accessibility">Accessibility</TabsTrigger>
            <TabsTrigger value="account">Account</TabsTrigger>
          </TabsList>

          {/* Personal Information Tab */}
          <TabsContent value="personal" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5 text-primary" />
                    Personal Information
                  </CardTitle>
                  <Button
                    variant={isEditing ? 'default' : 'outline'}
                    size="sm"
                    disabled={isSaving}
                    onClick={() => isEditing ? handleSaveProfile() : setIsEditing(true)}
                  >
                    {isEditing ? (isSaving ? 'Saving...' : 'Save Changes') : 'Edit Profile'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {saveError && (
                  <Alert className="border-red-300 bg-red-50">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{saveError}</AlertDescription>
                  </Alert>
                )}
                {saveSuccess && (
                  <Alert className="border-green-300 bg-green-50">
                    <AlertDescription>Profile updated successfully.</AlertDescription>
                  </Alert>
                )}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={editedProfile.firstName}
                      onChange={(e) => setEditedProfile(prev => ({ ...prev, firstName: e.target.value }))}
                      disabled={!isEditing}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={editedProfile.lastName}
                      onChange={(e) => setEditedProfile(prev => ({ ...prev, lastName: e.target.value }))}
                      disabled={!isEditing}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={editedProfile.email}
                      onChange={(e) => setEditedProfile(prev => ({ ...prev, email: e.target.value }))}
                      disabled={!isEditing}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="birthday">Birthday</Label>
                    <Input
                      id="birthday"
                      type="date"
                      value={editedProfile.birthday}
                      onChange={(e) => {
                        setEditedProfile(prev => ({ ...prev, birthday: e.target.value }));
                        if (birthdayError) setBirthdayError(null);
                      }}
                      disabled={!isEditing}
                    />
                    {birthdayError && <p className="text-sm text-red-600 mt-1">{birthdayError}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="region">Country / Region</Label>
                    <select
                      id="region"
                      value={editedProfile.region}
                      onChange={(e) => setEditedProfile(prev => ({ ...prev, region: e.target.value }))}
                      disabled={!isEditing}
                      className="border-input flex h-9 w-full rounded-md border bg-input-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="">Select country</option>
                      {['India','United States','United Kingdom','Canada','Australia','Germany','France','Spain','Brazil','Japan','Singapore','United Arab Emirates'].map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="emergencyContact">Emergency Contact Name</Label>
                    <Input
                      id="emergencyContact"
                      value={editedProfile.emergencyContact}
                      onChange={(e) => setEditedProfile(prev => ({ ...prev, emergencyContact: e.target.value }))}
                      disabled={!isEditing}
                      placeholder="e.g., Mom, Partner, Best Friend"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="emergencyPhone">Emergency Contact Phone</Label>
                    <Input
                      id="emergencyPhone"
                      type="tel"
                      value={editedProfile.emergencyPhone}
                      onChange={(e) => setEditedProfile(prev => ({ ...prev, emergencyPhone: e.target.value }))}
                      disabled={!isEditing}
                      placeholder="e.g., +1 (555) 123-4567"
                    />
                    <p className="text-xs text-muted-foreground">
                      We&apos;ll only suggest contacting this person if our AI detects you might be in crisis. You always have full control.
                    </p>
                  </div>
                </div>

                {isEditing && (
                  <div className="flex gap-2 pt-4">
                    <Button onClick={handleSaveProfile} disabled={isSaving}>{isSaving ? 'Saving...' : 'Save Changes'}</Button>
                    <Button variant="outline" onClick={() => setIsEditing(false)} disabled={isSaving}>Cancel</Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Privacy & Data Tab */}
          <TabsContent value="privacy" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  Privacy & Data Controls
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Data Sharing for Personalization</Label>
                      <p className="text-sm text-muted-foreground">
                        Allow us to use your assessment data to improve recommendations
                      </p>
                    </div>
                    <Switch
                      checked={privacySettings.dataSharing}
                      onCheckedChange={(checked) => 
                        setPrivacySettings(prev => ({ ...prev, dataSharing: checked }))
                      }
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Clinician Access</Label>
                      <p className="text-sm text-muted-foreground">
                        Allow licensed clinicians to view your anonymized reports
                      </p>
                    </div>
                    <Switch
                      checked={privacySettings.clinicianAccess}
                      onCheckedChange={(checked) => 
                        setPrivacySettings(prev => ({ ...prev, clinicianAccess: checked }))
                      }
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Anonymous Analytics</Label>
                      <p className="text-sm text-muted-foreground">
                        Help improve the app with anonymous usage statistics
                      </p>
                    </div>
                    <Switch
                      checked={privacySettings.anonymousAnalytics}
                      onCheckedChange={(checked) => 
                        setPrivacySettings(prev => ({ ...prev, anonymousAnalytics: checked }))
                      }
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Research Participation</Label>
                      <p className="text-sm text-muted-foreground">
                        Contribute to mental health research with anonymized data
                      </p>
                    </div>
                    <Switch
                      checked={privacySettings.researchParticipation}
                      onCheckedChange={(checked) => 
                        setPrivacySettings(prev => ({ ...prev, researchParticipation: checked }))
                      }
                    />
                  </div>
                </div>

                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    Your data is always encrypted and secure. You can change these settings or delete your data anytime.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            {/* Connected Devices */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5 text-primary" />
                  Connected Devices
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {connectedDevices.map((device, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center gap-3">
                        {getDeviceIcon(device.type)}
                        <div>
                          <p className="font-medium">{device.name}</p>
                          <p className="text-sm text-muted-foreground">
                            Last active: {device.lastActive}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {device.current && (
                          <Badge variant="default">Current</Badge>
                        )}
                        {!device.current && (
                          <Button variant="outline" size="sm">
                            Remove
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-primary" />
                  Notification Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Practice Reminders</Label>
                      <p className="text-sm text-muted-foreground">
                        Gentle reminders for your daily mindfulness practice
                      </p>
                    </div>
                    <Switch
                      checked={notificationSettings.practiceReminders}
                      onCheckedChange={(checked) => 
                        setNotificationSettings(prev => ({ ...prev, practiceReminders: checked }))
                      }
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Assessment Reminders</Label>
                      <p className="text-sm text-muted-foreground">
                        Periodic reminders to complete wellbeing assessments
                      </p>
                    </div>
                    <Switch
                      checked={notificationSettings.assessmentReminders}
                      onCheckedChange={(checked) => 
                        setNotificationSettings(prev => ({ ...prev, assessmentReminders: checked }))
                      }
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Progress Updates</Label>
                      <p className="text-sm text-muted-foreground">
                        Weekly summaries of your wellbeing progress
                      </p>
                    </div>
                    <Switch
                      checked={notificationSettings.progressUpdates}
                      onCheckedChange={(checked) => 
                        setNotificationSettings(prev => ({ ...prev, progressUpdates: checked }))
                      }
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Wellbeing Tips</Label>
                      <p className="text-sm text-muted-foreground">
                        Helpful tips and educational content
                      </p>
                    </div>
                    <Switch
                      checked={notificationSettings.wellbeingTips}
                      onCheckedChange={(checked) => 
                        setNotificationSettings(prev => ({ ...prev, wellbeingTips: checked }))
                      }
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Emergency Alerts</Label>
                      <p className="text-sm text-muted-foreground">
                        Important safety and crisis resource notifications
                      </p>
                    </div>
                    <Switch
                      checked={notificationSettings.emergencyAlerts}
                      onCheckedChange={(checked) => 
                        setNotificationSettings(prev => ({ ...prev, emergencyAlerts: checked }))
                      }
                    />
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t">
                  <h4 className="font-medium">Delivery Methods</h4>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Push Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Notifications on your device when the app is closed
                      </p>
                    </div>
                    <Switch
                      checked={notificationSettings.pushNotifications}
                      onCheckedChange={(checked) => 
                        setNotificationSettings(prev => ({ ...prev, pushNotifications: checked }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Weekly summaries and important updates via email
                      </p>
                    </div>
                    <Switch
                      checked={notificationSettings.emailNotifications}
                      onCheckedChange={(checked) => 
                        setNotificationSettings(prev => ({ ...prev, emailNotifications: checked }))
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Accessibility Tab */}
          <TabsContent value="accessibility" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Accessibility className="h-5 w-5 text-primary" />
                  Accessibility Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Large Text</Label>
                      <p className="text-sm text-muted-foreground">
                        Increase text size throughout the app
                      </p>
                    </div>
                    <Switch
                      checked={accessibilitySettings.largeText}
                      onCheckedChange={(checked) =>
                        setAccessibilitySetting('largeText', checked, {
                          announce: 'Large text {state}'
                        })
                      }
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>High Contrast</Label>
                      <p className="text-sm text-muted-foreground">
                        Increase contrast for better visibility
                      </p>
                    </div>
                    <Switch
                      checked={accessibilitySettings.highContrast}
                      onCheckedChange={(checked) =>
                        setAccessibilitySetting('highContrast', checked, {
                          announce: 'High contrast mode {state}'
                        })
                      }
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Dark Mode</Label>
                      <p className="text-sm text-muted-foreground">
                        Apply a softer palette for low-light environments
                      </p>
                    </div>
                    <Switch
                      checked={accessibilitySettings.darkMode}
                      onCheckedChange={(checked) =>
                        setAccessibilitySetting('darkMode', checked, {
                          announce: 'Dark mode {state}'
                        })
                      }
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Screen Reader Support</Label>
                      <p className="text-sm text-muted-foreground">
                        Enhanced support for screen reading technology
                      </p>
                    </div>
                    <Switch
                      checked={accessibilitySettings.screenReader}
                      onCheckedChange={(checked) =>
                        setAccessibilitySetting('screenReader', checked, {
                          announce: 'Screen reader enhancements {state}'
                        })
                      }
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Reduced Motion</Label>
                      <p className="text-sm text-muted-foreground">
                        Minimize animations and transitions
                      </p>
                    </div>
                    <Switch
                      checked={accessibilitySettings.reducedMotion}
                      onCheckedChange={(checked) =>
                        setAccessibilitySetting('reducedMotion', checked, {
                          announce: 'Reduced motion {state}'
                        })
                      }
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Voice Guidance</Label>
                      <p className="text-sm text-muted-foreground">
                        Audio guidance for meditation and breathing exercises
                      </p>
                    </div>
                    <Switch
                      checked={accessibilitySettings.voiceGuidance}
                      onCheckedChange={(checked) =>
                        setAccessibilitySetting('voiceGuidance', checked, {
                          announce: 'Voice guidance {state}'
                        })
                      }
                      disabled={!isVoiceGuidanceSupported && !accessibilitySettings.voiceGuidance}
                    />
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <Label>Font Style</Label>
                    <p className="text-sm text-muted-foreground">
                      Choose the typography that feels most comfortable across the app.
                    </p>
                    <Select
                      value={accessibilitySettings.fontFamily}
                      onValueChange={(value) => {
                        const targetOption = fontOptions.find(option => option.value === value);
                        setFontFamily(value as typeof accessibilitySettings.fontFamily, {
                          announce: `Font changed to ${targetOption?.label ?? value}`
                        });
                      }}
                    >
                      <SelectTrigger className="w-full sm:w-72">
                        <SelectValue placeholder="Select a font" />
                      </SelectTrigger>
                      <SelectContent>
                        {fontOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            <div className="flex flex-col text-left" style={{ fontFamily: option.stack }}>
                              <span className="font-medium">{option.label}</span>
                              <span className="text-xs text-muted-foreground">{option.subtitle}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="rounded-md border p-3 text-sm" style={{ fontFamily: selectedFontStack }}>
                      &ldquo;Small changes in typography can make longer sessions feel calmer.&rdquo; — Accessibility Team
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2 border-t pt-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Button variant="outline" size="sm" onClick={resetAccessibilitySettings}>
                      Reset accessibility preferences
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!accessibilitySettings.voiceGuidance || !isVoiceGuidanceSupported}
                      onClick={() => speakAccessibility('Voice guidance sample. This is how key updates will sound.')}
                    >
                      Play voice guidance sample
                    </Button>
                  </div>
                  {!isVoiceGuidanceSupported && (
                    <p className="text-xs text-muted-foreground">
                      Voice guidance isn&apos;t available in this browser, but other accessibility improvements will still work.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Account Management Tab */}
          <TabsContent value="account" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5 text-primary" />
                  Data Management
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg border">
                  <div>
                    <h4 className="font-medium">Export Your Data</h4>
                    <p className="text-sm text-muted-foreground">
                      Download a copy of all your data including assessments, progress, and settings
                    </p>
                  </div>
                  <Button variant="outline" onClick={handleExportData}>
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg border">
                  <div>
                    <h4 className="font-medium">Data Retention</h4>
                    <p className="text-sm text-muted-foreground">
                      Your data is kept secure and is only retained as long as your account is active
                    </p>
                  </div>
                  <Badge variant="secondary">Active</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquareLock className="h-5 w-5 text-primary" />
                  Password Recovery
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Reset your password using your security question. This is the same process we use when you choose “Forgot password” at sign in.
                </p>

                {passwordResetError && (
                  <Alert variant="destructive">
                    <AlertTitle>Unable to update password</AlertTitle>
                    <AlertDescription>{passwordResetError}</AlertDescription>
                  </Alert>
                )}

                {passwordResetSuccess && (
                  <Alert className="border-green-200 bg-green-50">
                    <AlertDescription>{passwordResetSuccess}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label>Your security question</Label>
                    <p className="text-sm font-medium text-foreground">
                      {user?.securityQuestion || 'You have not set a security question yet'}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="security-answer">Security answer</Label>
                    <Input
                      id="security-answer"
                      value={passwordResetForm.answer}
                      onChange={(event) => setPasswordResetForm(prev => ({ ...prev, answer: event.target.value }))}
                      placeholder="Enter your answer"
                      disabled={isResettingPassword || !user?.securityQuestion}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="new-password">New password</Label>
                    <Input
                      id="new-password"
                      type="password"
                      value={passwordResetForm.newPassword}
                      onChange={(event) => setPasswordResetForm(prev => ({ ...prev, newPassword: event.target.value }))}
                      placeholder="Choose a new password"
                      disabled={isResettingPassword}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm new password</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      value={passwordResetForm.confirmPassword}
                      onChange={(event) => setPasswordResetForm(prev => ({ ...prev, confirmPassword: event.target.value }))}
                      placeholder="Retype your new password"
                      disabled={isResettingPassword}
                    />
                  </div>
                </div>

                <Button
                  onClick={handleResetPasswordWithAnswer}
                  disabled={isResettingPassword || !user?.securityQuestion}
                  className="w-full"
                >
                  {isResettingPassword ? 'Updating password…' : 'Update password'}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <KeyRound className="h-5 w-5 text-primary" />
                  Update Security Question
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Change your security question by confirming your password. You&apos;ll use this question whenever you need to recover your account.
                </p>

                {securityQuestionError && (
                  <Alert variant="destructive">
                    <AlertTitle>Unable to update question</AlertTitle>
                    <AlertDescription>{securityQuestionError}</AlertDescription>
                  </Alert>
                )}

                {securityQuestionSuccess && (
                  <Alert className="border-green-200 bg-green-50">
                    <AlertDescription>{securityQuestionSuccess}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="current-password">Current password</Label>
                    <Input
                      id="current-password"
                      type="password"
                      value={securityQuestionForm.currentPassword}
                      onChange={(event) => setSecurityQuestionForm(prev => ({ ...prev, currentPassword: event.target.value }))}
                      placeholder="Confirm with your password"
                      disabled={isUpdatingSecurityQuestion}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Select a question</Label>
                    <div className="space-y-3">
                      <RadioGroup
                        value={securityQuestionForm.mode === 'custom' ? 'custom' : securityQuestionForm.question}
                        onValueChange={(value) => {
                          if (value === 'custom') {
                            setSecurityQuestionForm(prev => ({ ...prev, mode: 'custom' }));
                          } else {
                            setSecurityQuestionForm(prev => ({ ...prev, mode: 'predefined', question: value }));
                          }
                        }}
                        className="grid gap-3 md:grid-cols-2"
                      >
                        {DEFAULT_SECURITY_QUESTIONS.map((question) => (
                          <div key={question} className="flex items-start gap-3 rounded-lg border border-border/70 bg-background p-3">
                            <RadioGroupItem value={question} id={`question-${question}`} className="mt-1" />
                            <Label htmlFor={`question-${question}`} className="cursor-pointer text-sm leading-6">
                              {question}
                            </Label>
                          </div>
                        ))}
                        <div className="flex items-start gap-3 rounded-lg border border-dashed border-border/70 bg-background p-3">
                          <RadioGroupItem value="custom" id="profile-custom-question" className="mt-1" />
                          <div className="flex-1 space-y-2">
                            <Label htmlFor="profile-custom-question" className="cursor-pointer text-sm font-medium">
                              Use a custom question
                            </Label>
                            <Input
                              type="text"
                              value={securityQuestionForm.customQuestion}
                              onChange={(event) => setSecurityQuestionForm(prev => ({ ...prev, customQuestion: event.target.value }))}
                              placeholder="Enter your own question"
                              disabled={securityQuestionForm.mode !== 'custom' || isUpdatingSecurityQuestion}
                              className="text-sm"
                            />
                          </div>
                        </div>
                      </RadioGroup>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="security-answer-new">Answer</Label>
                    <Input
                      id="security-answer-new"
                      type="text"
                      value={securityQuestionForm.answer}
                      onChange={(event) => setSecurityQuestionForm(prev => ({ ...prev, answer: event.target.value }))}
                      placeholder="Your answer"
                      disabled={isUpdatingSecurityQuestion}
                    />
                  </div>
                </div>

                <Button onClick={handleUpdateSecurityQuestion} disabled={isUpdatingSecurityQuestion} className="w-full">
                  {isUpdatingSecurityQuestion ? 'Updating question…' : 'Save security question'}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  Change Your Approach
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Choose how you’d like your wellbeing plan personalized. Confirm with your password to avoid accidental changes.
                </p>

                {approachUpdateError && (
                  <Alert variant="destructive">
                    <AlertTitle>Unable to update preference</AlertTitle>
                    <AlertDescription>{approachUpdateError}</AlertDescription>
                  </Alert>
                )}

                {approachUpdateSuccess && (
                  <Alert className="border-green-200 bg-green-50">
                    <AlertDescription>{approachUpdateSuccess}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label>Your current approach</Label>
                    <p className="text-sm font-medium text-foreground capitalize">{user?.approach ?? 'Not set'}</p>
                    <p className="text-xs text-muted-foreground">
                      This setting tailors recommendations to match western clinical practices, eastern holistic traditions, or a hybrid of both.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Select a new approach</Label>
                    <RadioGroup
                      value={approachForm.approach}
                      onValueChange={(value) => setApproachForm(prev => ({ ...prev, approach: value as 'western' | 'eastern' | 'hybrid' }))}
                      className="space-y-2"
                    >
                      <div className="flex items-start gap-3 rounded-lg border p-3">
                        <RadioGroupItem value="western" id="approach-western" className="mt-1" />
                        <div>
                          <Label htmlFor="approach-western" className="cursor-pointer">Western</Label>
                          <p className="text-xs text-muted-foreground">Evidence-based therapeutic practices, CBT, and structured interventions.</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 rounded-lg border p-3">
                        <RadioGroupItem value="eastern" id="approach-eastern" className="mt-1" />
                        <div>
                          <Label htmlFor="approach-eastern" className="cursor-pointer">Eastern</Label>
                          <p className="text-xs text-muted-foreground">Meditation-first practices, breath-work, ayurvedic and holistic approaches.</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 rounded-lg border p-3">
                        <RadioGroupItem value="hybrid" id="approach-hybrid" className="mt-1" />
                        <div>
                          <Label htmlFor="approach-hybrid" className="cursor-pointer">Hybrid</Label>
                          <p className="text-xs text-muted-foreground">A balanced mix suited to both science-backed therapy and reflective practices.</p>
                        </div>
                      </div>
                    </RadioGroup>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="approach-password">Confirm with password</Label>
                    <Input
                      id="approach-password"
                      type="password"
                      value={approachForm.password}
                      onChange={(event) => setApproachForm(prev => ({ ...prev, password: event.target.value }))}
                      placeholder="Enter your password"
                      disabled={isUpdatingApproach}
                    />
                  </div>
                </div>

                <Button onClick={handleUpdateApproach} disabled={isUpdatingApproach} className="w-full">
                  {isUpdatingApproach ? 'Saving preference…' : 'Save approach preference'}
                </Button>
              </CardContent>
            </Card>

            <Card className="border-red-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <Trash2 className="h-5 w-5" />
                  Danger Zone
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Deleting your account will permanently remove all your data, including assessments, 
                    progress tracking, and personalized recommendations. This action cannot be undone.
                  </AlertDescription>
                </Alert>

                <Button 
                  variant="destructive" 
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Account Permanently
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Logout Button at Bottom */}
        <div className="mt-10 flex justify-center">
          <Button 
            variant="ghost" 
            onClick={() => { if (onLogout && window.confirm('Log out of your session?')) onLogout(); }} 
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            Logout
          </Button>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle className="text-red-600">Confirm Account Deletion</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Are you absolutely sure you want to delete your account? This action cannot be undone and you will lose:
                </p>
                
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>All assessment results and progress data</li>
                  <li>Personalized recommendations and insights</li>
                  <li>Practice history and achievements</li>
                  <li>Account settings and preferences</li>
                </ul>

                <div className="flex gap-2">
                  <Button 
                    variant="destructive" 
                    onClick={handleDeleteAccount}
                    className="flex-1"
                  >
                    Yes, Delete Forever
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
