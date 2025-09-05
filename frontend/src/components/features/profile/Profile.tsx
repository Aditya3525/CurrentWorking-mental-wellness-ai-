import React, { useState } from 'react';
import { 
  ArrowLeft,
  User,
  Shield,
  Bell,
  Accessibility,
  Download,
  Trash2,
  AlertTriangle,
  Phone,
  Lock,
  Smartphone,
  Monitor
} from 'lucide-react';
import { usersApi } from '../../../services/api';
import { Alert, AlertDescription } from '../../ui/alert';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
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
}

type SetUserFn = (updater: (prev: ProfileUser) => ProfileUser) => void;
interface ProfileProps {
  user: ProfileUser | null;
  onNavigate: (page: string) => void;
  // Broaden type to accept parent React state setter directly
  setUser: (updater: any) => void;
  onLogout?: () => void;
}

export function Profile({ user, onNavigate, setUser, onLogout }: ProfileProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
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

  const [accessibilitySettings, setAccessibilitySettings] = useState({
    largeText: false,
    highContrast: false,
    screenReader: false,
    reducedMotion: false,
    voiceGuidance: false
  });

  const connectedDevices = [
    { name: 'iPhone 14', type: 'mobile', lastActive: '2 minutes ago', current: true },
    { name: 'MacBook Pro', type: 'desktop', lastActive: '1 hour ago', current: false },
    { name: 'iPad Air', type: 'tablet', lastActive: '3 days ago', current: false }
  ];

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
      if (typeof setUser === 'function') {
        const fn = setUser as SetUserFn;
        fn(prev => ({ ...prev, ...resp.data!.user }));
      }
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
                </div>

                {isEditing && (
                  <div className="flex gap-2 pt-4">
                    <Button onClick={handleSaveProfile} disabled={isSaving}>{isSaving ? 'Saving...' : 'Save Changes'}</Button>
                    <Button variant="outline" onClick={() => setIsEditing(false)} disabled={isSaving}>Cancel</Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Emergency Contacts */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5 text-primary" />
                  Emergency Contacts
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="emergencyContact">Contact Name</Label>
                    <Input
                      id="emergencyContact"
                      value={editedProfile.emergencyContact}
                      onChange={(e) => setEditedProfile(prev => ({ ...prev, emergencyContact: e.target.value }))}
                      placeholder="e.g., Mom, Partner, Best Friend"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="emergencyPhone">Phone Number</Label>
                    <Input
                      id="emergencyPhone"
                      type="tel"
                      value={editedProfile.emergencyPhone}
                      onChange={(e) => setEditedProfile(prev => ({ ...prev, emergencyPhone: e.target.value }))}
                      placeholder="e.g., +1 (555) 123-4567"
                    />
                  </div>
                </div>

                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    We&apos;ll only suggest contacting this person if our AI detects you might be in crisis. 
                    You always have full control over whether to reach out.
                  </AlertDescription>
                </Alert>
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
                        setAccessibilitySettings(prev => ({ ...prev, largeText: checked }))
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
                        setAccessibilitySettings(prev => ({ ...prev, highContrast: checked }))
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
                        setAccessibilitySettings(prev => ({ ...prev, screenReader: checked }))
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
                        setAccessibilitySettings(prev => ({ ...prev, reducedMotion: checked }))
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
                        setAccessibilitySettings(prev => ({ ...prev, voiceGuidance: checked }))
                      }
                    />
                  </div>
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