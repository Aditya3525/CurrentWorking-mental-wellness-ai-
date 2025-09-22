import React, { useEffect, useState } from 'react';

import { AssessmentList, AssessmentFlow, InsightsResults } from './components/features/assessment';
import { LandingPage, OAuthCallback, PasswordSetup } from './components/features/auth';
import { Chatbot } from './components/features/chat';
import { ContentLibrary, Practices } from './components/features/content';
import { Dashboard } from './components/features/dashboard';
import { OnboardingFlow } from './components/features/onboarding';
import { PersonalizedPlan } from './components/features/plans';
import { Progress, Profile } from './components/features/profile';
import { HelpSafety } from './components/layout';
import { AdminAuthProvider, useAdminAuth } from './contexts/AdminAuthContext';
import AdminDashboard from './admin/AdminDashboard';
import { ChatProvider } from './contexts/ChatContext';
import { ToastProvider } from './contexts/ToastContext';
import { getCurrentUser, loginUser, registerUser, signOut, StoredUser, completeOnboarding, setupUserPassword } from './services/auth';

type Page = 
  | 'landing'
  | 'onboarding'
  | 'password-setup'
  | 'dashboard'
  | 'assessments'
  | 'assessment-flow'
  | 'insights'
  | 'plan'
  | 'chatbot'
  | 'library'
  | 'practices'
  | 'progress'
  | 'profile'
  | 'help'
  | 'oauth-callback'
  | 'admin';

type User = StoredUser;

function AppInner() {
  const { admin, adminLogin } = useAdminAuth();
  const [currentPage, setCurrentPage] = useState<Page>('landing');
  const [user, setUser] = useState<User | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [loginError, setLoginError] = useState<{ error: string; suggestion?: string; message?: string } | null>(null);
  const [currentAssessment, setCurrentAssessment] = useState<string | null>(null);

  // Check for existing authentication on app load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await getCurrentUser();
        if (currentUser) {
          console.log('Found existing user:', currentUser);
          setUser(currentUser);
          
          // Determine where to route existing user
          if (!currentUser.isOnboarded) {
            console.log('User not onboarded - routing to onboarding');
            setCurrentPage('onboarding');
          } else {
            console.log('User onboarded - routing to dashboard');
            setCurrentPage('dashboard');
          }
        } else {
          console.log('No existing user - staying on landing');
          setCurrentPage('landing');
        }
      } catch (error) {
        console.error('Auth check error:', error);
        setCurrentPage('landing');
      } finally {
        setLoadingUser(false);
      }
    };

    checkAuth();
  }, []);

  // Check for OAuth callback
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('token') || urlParams.get('error') || urlParams.get('redirect') || urlParams.get('needs_setup')) {
      console.log('OAuth callback detected');
      setCurrentPage('oauth-callback');
    }
  }, []);

  // Check for onboarding when navigating to dashboard
  useEffect(() => {
    if (currentPage === 'dashboard' && user && !user.isOnboarded && !loadingUser) {
      console.log('User reached dashboard but not onboarded - redirecting to onboarding');
      setCurrentPage('onboarding');
    }
  }, [currentPage, user, loadingUser]);

  const navigateTo = (page: Page) => {
    setCurrentPage(page);
  };

  const startAssessment = (assessmentId: string) => {
    setCurrentAssessment(assessmentId);
    setCurrentPage('assessment-flow');
  };

  const completeAssessment = (scores: Record<string, number>, meta?: { aiInsights?: string }) => {
    setUser(prev => prev ? {
      ...prev,
      assessmentScores: { ...prev.assessmentScores, ...scores },
      lastAssessmentInsights: meta?.aiInsights || prev.lastAssessmentInsights
    } : null);
    setCurrentAssessment(null);
    setCurrentPage('insights');
  };

  const signUp = async (userData: { name: string; email: string; password: string }) => {
    try {
      setAuthError(null);
      console.log('Starting registration process for:', userData);
      
      const newUser = await registerUser(userData);
      console.log('Registration successful:', newUser);
      
      // Set user data and route to onboarding
      setUser({
        ...newUser,
        isOnboarded: false, // Ensure new users go through onboarding
        assessmentScores: {},
        dataConsent: false,
        clinicianSharing: false
      });
      
      console.log('Routing new user to onboarding');
      setCurrentPage('onboarding');
      
    } catch (error) {
      console.error('Registration error:', error);
      // Handle structured ApiResponse thrown from registerUser
      if (error && typeof error === 'object' && 'suggestLogin' in error) {
        const errObj = error as { suggestLogin?: boolean; email?: string; error?: string; status?: number };
        if (errObj.suggestLogin) {
          setAuthError(errObj.error || 'An account already exists. Please log in instead.');
          window.dispatchEvent(new CustomEvent('show-login-from-duplicate', { detail: { email: errObj.email || userData.email } }));
          return;
        }
      }
      setAuthError(error instanceof Error ? error.message : 'Registration failed');
    }
  };

  const login = async (credentials: { email: string; password: string }) => {
    try {
      setLoginError(null);
      setAuthError(null);
      console.log('Attempting login for:', credentials.email);
      const existing = await loginUser(credentials);
      if (existing) {
        console.log('Login successful:', existing);
        setUser(existing);
        setCurrentPage(existing.isOnboarded ? 'dashboard' : 'onboarding');
      } else {
        setLoginError({
          error: 'Invalid credentials',
          suggestion: 'check_credentials'
        });
      }
    } catch (error: unknown) {
      console.error('Login error:', error);
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { error?: string; suggestion?: string; message?: string } } };
        const errorData = axiosError.response?.data;
        if (errorData?.suggestion === 'create_account') {
          setLoginError({
            error: errorData.error,
            suggestion: 'create_account',
            message: errorData.message
          });
        } else if (errorData?.suggestion === 'use_google_or_setup_password') {
          setLoginError({
            error: errorData.error,
            suggestion: 'use_google_or_setup_password'
          });
        } else {
          setLoginError({
            error: errorData?.error || 'Login failed',
            suggestion: 'check_credentials'
          });
        }
      } else {
        setAuthError(error instanceof Error ? error.message : 'Login failed');
      }
    }
  };

  const logout = () => {
    signOut();
    setUser(null);
    setCurrentPage('landing');
    // Clear any query params that might trigger OAuth callback logic
    window.history.replaceState({}, document.title, '/');
  };

  const handleAdminLogin = async (credentials: { email: string; password: string }) => {
    await adminLogin(credentials);
    // Navigate to admin page - the AdminDashboard component will handle authentication checks
    setCurrentPage('admin');
  };

  const handleOAuthSuccess = (userData: {
    id: string;
    name: string;
    email: string;
    token: string;
    needsSetup?: boolean;
    needsPassword?: boolean;
    isOnboarded?: boolean;
    hasPassword?: boolean;
    firstName?: string;
    lastName?: string;
    profilePhoto?: string;
    isGoogleUser?: boolean;
    justCreated?: boolean;
    birthday?: string;
    gender?: string;
    region?: string;
    language?: string;
    approach?: string;
    emergencyContact?: string;
    emergencyPhone?: string;
    dataConsent?: boolean;
    clinicianSharing?: boolean;
    createdAt?: string;
    updatedAt?: string;
  }) => {
    console.log('OAuth Success Data:', userData);
    
    // Set complete user data from backend (includes all profile fields)
    setUser({
      id: userData.id,
      name: userData.name,
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      profilePhoto: userData.profilePhoto,
      isOnboarded: userData.isOnboarded || false,
      assessmentScores: {},
      dataConsent: userData.dataConsent || true,
      clinicianSharing: userData.clinicianSharing || false,
      birthday: userData.birthday,
      gender: userData.gender,
      region: userData.region,
      language: userData.language,
      approach: userData.approach as 'western' | 'eastern' | 'hybrid' | undefined,
      emergencyContact: userData.emergencyContact,
      emergencyPhone: userData.emergencyPhone,
      createdAt: userData.createdAt || new Date().toISOString(),
      updatedAt: userData.updatedAt || new Date().toISOString()
    });
    
    // Store token and complete user data
    localStorage.setItem('token', userData.token);
    localStorage.setItem('user', JSON.stringify(userData));
    
    // Clear URL parameters
    window.history.replaceState({}, document.title, '/');
    
    // Determine flow based on user status
    console.log('User status check:', {
      needsPassword: userData.needsPassword,
      needsSetup: userData.needsSetup,
      isOnboarded: userData.isOnboarded,
      hasPassword: userData.hasPassword,
      justCreated: userData.justCreated
    });
    
    // Simplified routing logic:
    // - New Google users (justCreated) -> password setup
    // - Existing users -> dashboard (app will handle onboarding check)
    if (userData.justCreated) {
      console.log('Routing new Google user to password setup');
      setCurrentPage('password-setup');
    } else {
      console.log('Routing existing user to dashboard');
      // Let the app's general onboarding logic handle routing
      if (!userData.isOnboarded) {
        console.log('User not onboarded, will redirect to onboarding from dashboard/app logic');
      }
      setCurrentPage('dashboard');
    }
  };

  const handleOAuthError = (error: string) => {
    setAuthError(error);
    // Clear URL parameters
    window.history.replaceState({}, document.title, '/');
    setCurrentPage('landing');
  };

  const completeOnboardingFlow = async (profileData: {
    approach?: 'western' | 'eastern' | 'hybrid';
    firstName?: string;
    lastName?: string;
    birthday?: string;
    gender?: string;
    region?: string;
    language?: string;
    emergencyContact?: string;
    emergencyPhone?: string;
  }) => {
    try {
      console.log('Completing onboarding with data:', profileData);
      
      if (profileData.approach) {
        // Send all profile data to backend
        const updatedUser = await completeOnboarding(profileData.approach, profileData);
        if (updatedUser) {
          console.log('Onboarding completed, updated user:', updatedUser);
          setUser(updatedUser);
        }
      } else {
        setUser(prev => prev ? { ...prev, isOnboarded: true } : null);
      }
      
      console.log('Onboarding complete - routing to dashboard');
      setCurrentPage('dashboard');
      
    } catch (error) {
      console.error('Onboarding completion error:', error);
      // Still proceed to dashboard even if backend update fails
      setUser(prev => prev ? { ...prev, isOnboarded: true, approach: profileData.approach } : null);
      console.log('Onboarding fallback - routing to dashboard');
      setCurrentPage('dashboard');
    }
  };

  const completePasswordSetup = async (password: string) => {
    try {
      setAuthError(null);
      console.log('Setting up user password...');
      
      const updatedUser = await setupUserPassword(password);
      if (updatedUser) {
        console.log('Password setup successful:', updatedUser);
        setUser(updatedUser);
        
        // Check if user still needs onboarding after password setup
        if (!updatedUser.isOnboarded) {
          console.log('User needs onboarding - routing to onboarding');
          setCurrentPage('onboarding');
        } else {
          console.log('User is fully onboarded - routing to dashboard');
          setCurrentPage('dashboard');
        }
      } else {
        throw new Error('Password setup failed');
      }
    } catch (error) {
      console.error('Password setup error:', error);
      setAuthError(error instanceof Error ? error.message : 'Password setup failed');
    }
  };

  // Load persisted user on mount and handle OAuth callback
  useEffect(() => {
    // Check if this is an OAuth callback
    const checkOAuthCallback = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const path = window.location.pathname;
      
      if (path === '/auth/callback' || urlParams.has('token') || urlParams.has('error')) {
        setCurrentPage('oauth-callback');
        return true;
      }
      return false;
    };

    const loadUser = async () => {
      try {
        // Skip user loading if this is an OAuth callback
        if (checkOAuthCallback()) {
          setLoadingUser(false);
          return;
        }

        const u = await getCurrentUser();
        if (u) {
          setUser(u);
          setCurrentPage(u.isOnboarded ? 'dashboard' : 'onboarding');
        }
      } catch (error) {
        console.error('Error loading user:', error);
      } finally {
        setLoadingUser(false);
      }
    };
    
    loadUser();
  }, []);

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'landing':
  return <LandingPage onSignUp={signUp} onLogin={login} onAdminLogin={handleAdminLogin} authError={authError} loginError={loginError} />;
      case 'oauth-callback':
        return <OAuthCallback onAuthSuccess={handleOAuthSuccess} onAuthError={handleOAuthError} />;
      case 'password-setup':
        return <PasswordSetup 
          user={user} 
          onComplete={completePasswordSetup}
          error={authError}
          isLoading={false}
        />;
      case 'onboarding':
        return <OnboardingFlow onComplete={completeOnboardingFlow} user={user} />;
      case 'dashboard':
        return <Dashboard user={user} onNavigate={navigateTo} onStartAssessment={startAssessment} onLogout={logout} />;
      case 'assessments':
        return <AssessmentList onStartAssessment={startAssessment} onNavigate={navigateTo} user={user} />;
      case 'assessment-flow':
        return <AssessmentFlow 
          assessmentId={currentAssessment!} 
          onComplete={completeAssessment}
          onNavigate={navigateTo}
        />;
      case 'insights':
        return <InsightsResults user={user} onNavigate={navigateTo} />;
      case 'plan':
        return <PersonalizedPlan user={user} onNavigate={navigateTo} />;
      case 'chatbot':
        return <Chatbot user={user} onNavigate={navigateTo} />;
      case 'library':
        return <ContentLibrary onNavigate={navigateTo} user={user} />;
      case 'practices':
        return <Practices onNavigate={navigateTo} />;
      case 'progress':
        return <Progress user={user} onNavigate={navigateTo} />;
      case 'profile':
        return <Profile user={user} onNavigate={navigateTo} setUser={setUser} onLogout={logout} />;
      case 'help':
        return <HelpSafety onNavigate={navigateTo} />;
      case 'admin':
        return <AdminDashboard />;
      default:
  return <LandingPage onSignUp={signUp} onLogin={login} onAdminLogin={handleAdminLogin} authError={authError} loginError={loginError} />;
    }
  };
  return (
    <div className="min-h-screen bg-background">
      {loadingUser ? (
        <div className="flex items-center justify-center h-screen text-muted-foreground">Loading...</div>
      ) : (
        renderCurrentPage()
      )}
    </div>
  );
}

export default function App() {
  return (
    <AdminAuthProvider>
      <ChatProvider>
        <ToastProvider>
          <AppInner />
        </ToastProvider>
      </ChatProvider>
    </AdminAuthProvider>
  );
}