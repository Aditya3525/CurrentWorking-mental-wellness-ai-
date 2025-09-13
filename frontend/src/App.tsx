import { MessageCircle, LogOut } from 'lucide-react';
import React, { useEffect, useState } from 'react';

import { AdminLogin, AdminPanel } from './components/features/admin';
import { AssessmentList, AssessmentFlow, InsightsResults, AssessmentResults } from './components/features/assessment';
import { LandingPage, OAuthCallback, PasswordSetup } from './components/features/auth';
import { Chatbot } from './components/features/chat';
import { Practices } from './components/features/content';
import { EnhancedContentLibrary } from './components/features/content/EnhancedContentLibrary';
import { Dashboard } from './components/features/dashboard';
import { OnboardingFlow } from './components/features/onboarding';
import { PersonalizedPlan } from './components/features/plans';
import { Progress, Profile } from './components/features/profile';
import { HelpSafety } from './components/layout';
import { Button } from './components/ui/button';
import { getCurrentUser, loginUser, registerUser, signOut, StoredUser, completeOnboarding, setupUserPassword } from './services/auth';

type Page = 
  | 'landing'
  | 'onboarding'
  | 'password-setup'
  | 'dashboard'
  | 'assessments'
  | 'assessment-flow'
  | 'assessment-results'
  | 'insights'
  | 'plan'
  | 'chatbot'
  | 'library'
  | 'practices'
  | 'progress'
  | 'profile'
  | 'help'
  | 'oauth-callback'
  | 'admin-login'
  | 'admin-panel'
  | 'main';

type User = StoredUser;

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('landing');
  const [user, setUser] = useState<User | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [showChatbot, setShowChatbot] = useState(false);
  const [currentAssessment, setCurrentAssessment] = useState<string | null>(null);
  const [currentAssessmentResults, setCurrentAssessmentResults] = useState<unknown | null>(null);

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

  const navigateTo = (page: Page) => {
    setCurrentPage(page);
  };

  const startAssessment = (assessmentId: string) => {
    setCurrentAssessment(assessmentId);
    setCurrentPage('assessment-flow');
  };

  const viewAssessmentResults = (assessmentId: string, assessmentData: unknown) => {
    setCurrentAssessment(assessmentId);
    setCurrentAssessmentResults(assessmentData);
    setCurrentPage('assessment-results');
  };

  const completeAssessment = (data: unknown) => {
    // Handle both old format (just scores) and new format (scores + assessment record)
    const d = data as Record<string, unknown>;
  const scores = d?.scores || data; // backward compatibility
  const assessmentRecord = d?.assessmentRecord;
    
    setUser(prev => prev ? {
      ...prev,
      assessmentScores: { ...prev.assessmentScores, ...(typeof scores === 'object' && scores !== null ? (scores as Record<string, unknown>) : {}) },
      // Store the latest assessment record for insights
      latestAssessment: assessmentRecord
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
      setAuthError(error instanceof Error ? error.message : 'Registration failed');
    }
  };

  const login = async (credentials: { email: string; password: string }) => {
    try {
      setAuthError(null);
      console.log('Attempting login for:', credentials.email);
      
      const existing = await loginUser(credentials);
      if (existing) {
        console.log('Login successful:', existing);
        setUser(existing);
        
        // Route based on onboarding status
        if (existing.isOnboarded) {
          console.log('Existing user routing to dashboard');
          setCurrentPage('dashboard');
        } else {
          console.log('Existing user needs onboarding');
          setCurrentPage('onboarding');
        }
      } else {
        console.log('Login failed - no user found');
        setAuthError('Login failed. Please check your credentials.');
      }
    } catch (error) {
      console.error('Login error:', error);
      setAuthError(error instanceof Error ? error.message : 'Login failed');
    }
  };

  const logout = () => {
    signOut();
    setUser(null);
    setCurrentPage('landing');
    // Clear any query params that might trigger OAuth callback logic
    window.history.replaceState({}, document.title, '/');
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
  }) => {
    console.log('OAuth Success Data:', userData);
    
    // Set complete user data
    setUser({
      id: userData.id,
      name: userData.name,
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      profilePhoto: userData.profilePhoto,
      isOnboarded: userData.isOnboarded || false,
      assessmentScores: {},
      dataConsent: true,
      clinicianSharing: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    
    // Store token and user data
    localStorage.setItem('token', userData.token);
    localStorage.setItem('user', JSON.stringify(userData));
    
    // Clear URL parameters
    window.history.replaceState({}, document.title, '/');
    
    // Determine flow based on user status
    console.log('User status check:', {
      needsPassword: userData.needsPassword,
      needsSetup: userData.needsSetup,
      isOnboarded: userData.isOnboarded,
      hasPassword: userData.hasPassword
    });
    
    // SECURITY: ALL users must have a password before proceeding
    if (!userData.hasPassword || userData.needsPassword) {
      console.log('Routing to password setup - user lacks password');
      setCurrentPage('password-setup');
    } else if (!userData.isOnboarded) {
      console.log('Routing to onboarding');
      setCurrentPage('onboarding');
    } else {
      console.log('Routing to dashboard');
      // Refresh latest user profile from backend to get all completion fields
      getCurrentUser().then(fresh => {
        if (fresh) setUser(fresh);
      }).finally(() => setCurrentPage('dashboard'));
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
  return <LandingPage onSignUp={signUp} onLogin={login} onNavigate={navigateTo} authError={authError} />;
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
        return <AssessmentList 
          onStartAssessment={startAssessment} 
          onViewResults={viewAssessmentResults}
          onNavigate={navigateTo} 
          user={user} 
        />;
      case 'assessment-flow':
        return <AssessmentFlow 
          assessmentId={currentAssessment!} 
          onComplete={completeAssessment}
          onNavigate={navigateTo}
        />;
      case 'assessment-results':
        return <AssessmentResults 
          assessmentId={currentAssessment!}
          assessmentData={currentAssessmentResults as unknown as { score: number; completedAt: string; aiInsights?: string } | null}
          onNavigate={navigateTo}
          onRetakeAssessment={startAssessment}
        />;
      case 'insights':
        return <InsightsResults user={user} onNavigate={navigateTo} />;
      case 'plan':
        return <PersonalizedPlan user={user} onNavigate={navigateTo} />;
      case 'chatbot':
        return <Chatbot user={user} onNavigate={navigateTo} />;
      case 'library':
        return (
          <EnhancedContentLibrary
            onNavigate={navigateTo}
            user={user ? ({ approach: (user as unknown as { approach?: string }).approach } as { approach?: string }) : undefined}
          />
        );
      case 'practices':
        return <Practices onNavigate={navigateTo} />;
      case 'progress':
        return <Progress user={user} onNavigate={navigateTo} />;
      case 'profile':
        return <Profile user={user} onNavigate={navigateTo} setUser={setUser} onLogout={logout} />;
      case 'help':
        return <HelpSafety onNavigate={navigateTo} />;
      case 'admin-login':
        return <AdminLogin onNavigate={navigateTo} />;
      case 'admin-panel':
        return <AdminPanel onNavigate={navigateTo} />;
      case 'main':
        return <Dashboard user={user} onNavigate={navigateTo} onStartAssessment={startAssessment} onLogout={logout} />;
      default:
  return <LandingPage onSignUp={signUp} onLogin={login} onNavigate={navigateTo} authError={authError} />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {loadingUser ? (
        <div className="flex items-center justify-center h-screen text-muted-foreground">Loading...</div>
      ) : (
        renderCurrentPage()
      )}

      {/* Simple top-right user bar - hide when chatbot is open or on landing/admin pages */}
      {!showChatbot && currentPage !== 'chatbot' && !['landing', 'admin-login', 'admin-panel'].includes(currentPage) && (
        <div className="fixed top-3 right-4 flex gap-3 items-center z-40">
          {user ? (
            <>
              <span className="text-sm text-muted-foreground hidden sm:inline">{user.email}</span>
              <Button variant="outline" size="sm" onClick={logout} className="flex items-center gap-1">
                <LogOut className="h-3.5 w-3.5" />
                <span>Sign out</span>
              </Button>
            </>
          ) : null}
        </div>
      )}
      
      {/* Floating Chatbot Button - only show when user is logged in and not on landing/onboarding */}
      {user && user.isOnboarded && !['landing', 'onboarding', 'chatbot'].includes(currentPage) && (
        <Button
          onClick={() => setShowChatbot(true)}
          className="fixed bottom-6 right-6 rounded-full w-14 h-14 shadow-lg z-50"
          size="lg"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      )}

      {/* Chatbot Modal */}
      {showChatbot && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md h-[600px] flex flex-col">
            <Chatbot 
              user={user} 
              onNavigate={navigateTo}
              isModal={true}
              onClose={() => setShowChatbot(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}