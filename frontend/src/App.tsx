import { QueryClientProvider } from '@tanstack/react-query';
import React, { useCallback, useEffect, useRef, useState } from 'react';

import { AdminDashboard } from './admin/AdminDashboard';
import { AssessmentList, AssessmentFlow, CombinedAssessmentFlow, InsightsResults, OverallAssessmentInvite, OverallAssessmentSelection, OVERALL_ASSESSMENT_OPTION_IDS } from './components/features/assessment';
import { AssessmentCompletionPayload } from './components/features/assessment/AssessmentFlow';
import { AdminLoginPage, LandingPage, OAuthCallback, PasswordSetup, UserLoginPage } from './components/features/auth';
import { Chatbot } from './components/features/chat';
import { ContentLibrary, Practices } from './components/features/content';
import { Dashboard } from './components/features/dashboard';
import { OnboardingFlow } from './components/features/onboarding';
import { PersonalizedPlan } from './components/features/plans';
import { Progress, Profile } from './components/features/profile';
import { HelpSafety } from './components/layout';
import { ToastContainer } from './components/ui/ToastContainer';
import { AdminAuthProvider, useAdminAuth } from './contexts/AdminAuthContext';
import { ChatProvider } from './contexts/ChatContext';
import { ToastProvider } from './contexts/ToastContext';
import { useAssessmentHistory } from './hooks/useAssessments';
import { queryClient } from './lib/queryClient';
import { assessmentsApi, AssessmentInsights, AssessmentSessionSummary } from './services/api';
import { getCurrentUser, loginUser, registerUser, signOut, StoredUser, completeOnboarding, setupUserPassword } from './services/auth';
import { useAuthStore } from './stores/authStore';

type Page = 
  | 'landing'
  | 'user-login'
  | 'admin-login'
  | 'onboarding'
  | 'password-setup'
  | 'dashboard'
  | 'assessments'
  | 'assessment-flow'
  | 'combined-assessment-flow'
  | 'assessment-invite'
  | 'assessment-selection'
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

const normalizePath = (path: string): string => {
  if (!path) return '/';
  if (path === '/') return '/';
  return path.replace(/\/+$/, '') || '/';
};

const PAGE_ROUTES: Record<Page, string> = {
  landing: '/',
  'user-login': '/user_login',
  'admin-login': '/admin_login',
  onboarding: '/onboarding',
  'password-setup': '/password-setup',
  dashboard: '/dashboard',
  assessments: '/assessments',
  'assessment-flow': '/assessments/active',
  'combined-assessment-flow': '/assessments/combined',
  'assessment-invite': '/assessments/invite',
  'assessment-selection': '/assessments/selection',
  insights: '/insights',
  plan: '/plan',
  chatbot: '/chatbot',
  library: '/library',
  practices: '/practices',
  progress: '/progress',
  profile: '/profile',
  help: '/help',
  'oauth-callback': '/auth/callback',
  admin: '/admin'
};

const PATH_TO_PAGE: Record<string, Page> = Object.entries(PAGE_ROUTES).reduce((acc, [page, route]) => {
  acc[route] = page as Page;
  return acc;
}, {} as Record<string, Page>);

const PUBLIC_PAGES = new Set<Page>(['landing', 'user-login', 'admin-login', 'oauth-callback']);

const PRE_ONBOARDING_ALLOWED_PAGES = new Set<Page>([
  'onboarding',
  'assessment-invite',
  'assessment-selection',
  'combined-assessment-flow',
  'assessment-flow',
  'insights',
  'password-setup'
]);

const pathToPage = (rawPath: string): Page => {
  const normalized = normalizePath(rawPath);
  return PATH_TO_PAGE[normalized] ?? 'landing';
};

const resolveInitialPage = (user: User | null, requestedPage: Page, adminAuthenticated: boolean): Page => {
  if (requestedPage === 'admin') {
    return adminAuthenticated ? 'admin' : 'admin-login';
  }

  if (!user) {
    return PUBLIC_PAGES.has(requestedPage) ? requestedPage : 'user-login';
  }

  if (!user.isOnboarded && !PRE_ONBOARDING_ALLOWED_PAGES.has(requestedPage)) {
    return 'onboarding';
  }

  if (requestedPage === 'landing' || requestedPage === 'user-login' || requestedPage === 'admin-login') {
    return user.isOnboarded ? 'dashboard' : 'onboarding';
  }

  if (requestedPage === 'oauth-callback') {
    return user.isOnboarded ? 'dashboard' : 'onboarding';
  }

  return requestedPage;
};

const deriveScoresFromSummary = (summaries: AssessmentInsights['byType']): Record<string, number> => {
  return Object.entries(summaries).reduce((acc, [type, summary]) => {
    const rounded = Math.round(summary.latestScore);
    const mappedType = (() => {
      switch (type) {
        case 'anxiety_assessment':
          return 'anxiety';
        case 'personality_mini_ipip':
          return 'personality';
        default:
          return type;
      }
    })();
    acc[mappedType] = rounded;
    if (mappedType !== type) {
      acc[type] = rounded;
    }
    return acc;
  }, {} as Record<string, number>);
};

const OVERALL_ASSESSMENT_ID_SET = new Set<string>(OVERALL_ASSESSMENT_OPTION_IDS);

const sanitizeCombinedAssessmentSelection = (types: string[] | null | undefined): string[] => {
  if (!types || types.length === 0) {
    return [];
  }

  return types.filter((type) => OVERALL_ASSESSMENT_ID_SET.has(type));
};

const DEFAULT_COMBINED_SELECTION = (() => {
  const defaults = sanitizeCombinedAssessmentSelection([
    'anxiety_gad2',
    'depression_phq2',
    'stress_pss4',
    'overthinking_rrs4',
    'trauma_pcptsd5',
    'emotional_intelligence_eq5',
    'personality_bigfive10'
  ]);

  return defaults.length > 0 ? defaults : Array.from(OVERALL_ASSESSMENT_ID_SET);
})();

const ONBOARDING_STORAGE_KEY = 'mw-onboarding-progress';
const DASHBOARD_TOUR_STORAGE_KEY = 'mw-dashboard-tour-pending';

function AppInner() {
  const [currentPage, setCurrentPage] = useState<Page>(() => pathToPage(window.location.pathname));
  
  // Auth state from Zustand store
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const updateUser = useAuthStore((state) => state.updateUser);
  const logoutFromStore = useAuthStore((state) => state.logout);
  
  const [loadingUser, setLoadingUser] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [loginError, setLoginError] = useState<{ error: string; suggestion?: string; message?: string } | null>(null);
  const [currentAssessment, setCurrentAssessment] = useState<string | null>(null);
  const [selectedAssessmentTypes, setSelectedAssessmentTypes] = useState<string[]>([]);
  
  // React Query for assessment data ✅
  const { 
    data: assessmentData, 
    isLoading: assessmentsLoading,
    error: assessmentQueryError,
    refetch: refetchAssessments 
  } = useAssessmentHistory();
  
  // Derive values from React Query
  const assessmentHistory = assessmentData?.history ?? [];
  const assessmentInsights = assessmentData?.insights ?? null;
  const assessmentError = assessmentQueryError?.message ?? null;
  
  // OLD STATE - Commented out, now using React Query above
  // const [assessmentHistory, setAssessmentHistory] = useState<AssessmentHistoryEntry[]>([]);
  // const [assessmentInsights, setAssessmentInsights] = useState<AssessmentInsights | null>(null);
  // const [assessmentsLoading, setAssessmentsLoading] = useState(false);
  // const [assessmentError, setAssessmentError] = useState<string | null>(null);
  
  const [activeSession, setActiveSession] = useState<AssessmentSessionSummary | null>(null);
  const [isStartingOverallSession, setIsStartingOverallSession] = useState(false);
  const [assessmentSelectionDefaults, setAssessmentSelectionDefaults] = useState<string[] | undefined>(undefined);
  const [assessmentSelectionReturnPage, setAssessmentSelectionReturnPage] = useState<Page>('dashboard');
  const [lastCombinedSelection, setLastCombinedSelection] = useState<string[] | null>(null);
  const [insightsFocusType, setInsightsFocusType] = useState<string | null>(null);
  const pendingInsightsFocusRef = useRef<string | null | undefined>(undefined);
  const [dashboardTourPending, setDashboardTourPending] = useState<boolean>(() => {
    if (typeof window === 'undefined') {
      return false;
    }
    return localStorage.getItem(DASHBOARD_TOUR_STORAGE_KEY) === 'true';
  });

  const updateDashboardTourPending = useCallback((value: boolean) => {
    setDashboardTourPending(value);
    try {
      localStorage.setItem(DASHBOARD_TOUR_STORAGE_KEY, value ? 'true' : 'false');
    } catch (error) {
      console.warn('Failed to persist dashboard tour preference:', error);
    }
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPage(pathToPage(window.location.pathname));
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const syncAssessments = useCallback(
    async (activeUserId: string | null, updateUserScores = true) => {
      if (!activeUserId) {
        // Clear active session (React Query will handle history/insights)
        setActiveSession(null);
        return;
      }

      try {
        // Refetch assessment data (React Query handles loading/error states)
        const result = await refetchAssessments();
        
        // Also fetch active session (not cached by React Query)
        const sessionResponse = await assessmentsApi.getActiveAssessmentSession();

        // Update user scores if needed and data is available
        if (updateUserScores && user && user.id === activeUserId && result.data) {
          const derivedScores = deriveScoresFromSummary(result.data.insights.byType);
          const previousScores = user.assessmentScores ?? {};
          const mergedScores = { ...previousScores, ...derivedScores };
          const hasChanges = Object.entries(derivedScores).some(
            ([key, value]) => previousScores[key as keyof typeof previousScores] !== value
          );

          if (hasChanges) {
            updateUser({ assessmentScores: mergedScores });
          }
        }

        // Update active session state
        if (sessionResponse.success) {
          const session = sessionResponse.data?.session ?? null;
          setActiveSession(session);

          if (session) {
            const sanitizedSelection = sanitizeCombinedAssessmentSelection(session.selectedTypes);
            setLastCombinedSelection(sanitizedSelection.length > 0 ? sanitizedSelection : null);
          }
        } else {
          setActiveSession(null);
        }
      } catch (error) {
        // React Query handles assessment errors, just clear session on failure
        setActiveSession(null);
      }
    },
    [refetchAssessments, user, updateUser] // React Query and Zustand selectors are stable
  );

  // Keep assessment data in sync whenever the active user changes
  useEffect(() => {
    syncAssessments(user?.id ?? null, true);
  }, [user?.id, syncAssessments]);

  // Removed automatic redirect - users now manually navigate via button
  // useEffect(() => {
  //   if (currentPage === 'insights' && postAssessmentRedirect) {
  //     const timer = window.setTimeout(() => {
  //       setPostAssessmentRedirect(null);
  //       setCurrentPage(postAssessmentRedirect);
  //     }, 6000);

  //     return () => window.clearTimeout(timer);
  //   }

  //   return undefined;
  // }, [currentPage, postAssessmentRedirect]);

  const navigateTo = useCallback((page: Page) => {
    if (page === 'insights') {
      if (pendingInsightsFocusRef.current !== undefined) {
        setInsightsFocusType(pendingInsightsFocusRef.current ?? null);
        pendingInsightsFocusRef.current = undefined;
      } else {
        setInsightsFocusType(null);
      }
    } else {
      setInsightsFocusType(null);
      pendingInsightsFocusRef.current = undefined;
    }

    setCurrentPage(page);

    const targetPath = PAGE_ROUTES[page];
    if (targetPath && normalizePath(window.location.pathname) !== targetPath) {
      window.history.pushState({ page }, '', targetPath);
    }
  }, []);

  const startGoogleOAuth = useCallback(() => {
    window.location.assign('http://localhost:5000/api/auth/google');
  }, []);

  const startAssessment = (assessmentId: string, session?: AssessmentSessionSummary | null) => {
    // React Query handles error state
    setCurrentAssessment(assessmentId);
    setActiveSession(session ?? null);
    navigateTo('assessment-flow');
  };

  const viewAssessmentResults = useCallback((assessmentType: string | null) => {
    pendingInsightsFocusRef.current = assessmentType;
    setInsightsFocusType(assessmentType);
    navigateTo('insights');
  }, [navigateTo]);

  const startBasicOverallAssessment = useCallback(() => {
    const recentSelection = sanitizeCombinedAssessmentSelection(lastCombinedSelection);
    const defaults = recentSelection.length > 0 ? recentSelection : DEFAULT_COMBINED_SELECTION;

    // React Query handles error state
  setAssessmentSelectionDefaults([...defaults]);
    setAssessmentSelectionReturnPage('assessments');
    navigateTo('assessment-selection');
  }, [lastCombinedSelection, navigateTo]);

  const handleAssessmentInviteDecision = (accept: boolean) => {
    if (accept) {
      // React Query handles error state
      setAssessmentSelectionReturnPage('dashboard');
      const defaults = sanitizeCombinedAssessmentSelection(lastCombinedSelection);
      setAssessmentSelectionDefaults(defaults.length > 0 ? defaults : undefined);
      navigateTo('assessment-selection');
      return;
    }
    navigateTo('dashboard');
  };

  const beginOverallAssessment = async (selectedTypes: string[]) => {
    const sanitizedSelectedTypes = sanitizeCombinedAssessmentSelection(selectedTypes);

    if (sanitizedSelectedTypes.length === 0 || isStartingOverallSession) {
      return;
    }

    // React Query handles error state
    setIsStartingOverallSession(true);

    try {
      const response = await assessmentsApi.startAssessmentSession({ selectedTypes: sanitizedSelectedTypes });
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Unable to start assessment session');
      }

      const session = response.data.session;
      
      // Store selected types and session for combined flow
      setSelectedAssessmentTypes(sanitizedSelectedTypes);
      setActiveSession(session);
      setLastCombinedSelection(sanitizedSelectedTypes);
      setAssessmentSelectionDefaults(undefined);
      navigateTo('combined-assessment-flow');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to start assessment session';
      // Show error via toast notification
      console.error('Failed to start assessment session:', message);
    } finally {
      setIsStartingOverallSession(false);
    }
  };

  const completeCombinedAssessment = async (results: {
    sessionId: string;
    assessments: Array<{
      assessmentType: string;
      responses: Record<string, string>;
      score: number;
      rawScore: number;
      maxScore: number;
      categoryBreakdown?: Record<string, { raw: number; normalized: number; interpretation?: string }>;
      responseDetails: Array<{
        questionId: string;
        questionText: string;
        answerLabel: string;
        answerValue: string | number | null;
        answerScore?: number;
      }>;
    }>;
  }) => {
    if (!user) {
      pendingInsightsFocusRef.current = null;
      setInsightsFocusType(null);
      navigateTo('insights');
      return;
    }

    // React Query handles loading state
    try {
      const response = await assessmentsApi.submitCombinedAssessments({
        sessionId: results.sessionId,
        assessments: results.assessments.map((assessment) => ({
          assessmentType: assessment.assessmentType,
          responses: assessment.responses,
          score: assessment.score,
          rawScore: assessment.rawScore,
          maxScore: assessment.maxScore,
          categoryBreakdown: assessment.categoryBreakdown,
          responseDetails: assessment.responseDetails
        }))
      });
      
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Unable to save combined assessments');
      }

      // Refetch assessment data (React Query will update automatically)
      await refetchAssessments();
      
    // Update session and selection state
    setActiveSession(response.data.session);
    const sanitizedSessionSelection = sanitizeCombinedAssessmentSelection(response.data.session.selectedTypes);
    setLastCombinedSelection(sanitizedSessionSelection.length > 0 ? sanitizedSessionSelection : null);
      setAssessmentSelectionReturnPage('dashboard');
      setAssessmentSelectionDefaults(undefined);

      // Update user scores
      if (user) {
        const derivedScores = deriveScoresFromSummary(response.data.insights.byType);
        const mergedScores = { ...user.assessmentScores, ...derivedScores };
        updateUser({ assessmentScores: mergedScores });
      }

    // Clear temporary state
    setSelectedAssessmentTypes([]);
    pendingInsightsFocusRef.current = null;
    navigateTo('insights');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to save combined assessments';
      console.error('Combined assessment submission error:', message, error);
      throw error instanceof Error ? error : new Error(message);
    }
  };

  const completeAssessment = async (payload: AssessmentCompletionPayload) => {
    if (!user) {
      setCurrentAssessment(null);
      pendingInsightsFocusRef.current = payload.assessmentType;
      setInsightsFocusType(payload.assessmentType);
      navigateTo('insights');
      return;
    }

    // React Query handles loading state
    try {
      const response = await assessmentsApi.submitAssessment({
        assessmentType: payload.assessmentType,
        responses: payload.submissionResponses,
        responseDetails: payload.responseDetails,
        score: payload.score,
        rawScore: payload.rawScore,
        maxScore: payload.maxScore,
        sessionId: payload.sessionId,
        categoryBreakdown: payload.categoryBreakdown
      });

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Unable to save assessment');
      }

      // Refetch assessment data (React Query will update automatically)
      const refetchResult = await refetchAssessments();

      const sessionSummary = response.data.session ?? activeSession;
      setActiveSession(sessionSummary);

      if (user && refetchResult.data) {
        const derivedScores = deriveScoresFromSummary(refetchResult.data.insights.byType);
        const previousScores = user.assessmentScores ?? {};
        const mergedScores = { ...previousScores, ...derivedScores };
        updateUser({ assessmentScores: mergedScores });
      }

      if (sessionSummary && sessionSummary.status !== 'completed' && sessionSummary.pendingTypes.length > 0) {
        const nextAssessmentType = sessionSummary.pendingTypes[0];
        if (nextAssessmentType) {
          setCurrentAssessment(nextAssessmentType);
          navigateTo('assessment-flow');
          return;
        }
      }

      setCurrentAssessment(null);
      pendingInsightsFocusRef.current = payload.assessmentType;
      navigateTo('insights');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to save assessment';
      console.error('Assessment submission error:', message, error);
      throw error instanceof Error ? error : new Error(message);
    }
  };

  const signUp = async (userData: { name: string; email: string; password: string }) => {
    try {
      setAuthError(null);
      console.log('Starting registration process for:', userData);
      
      const result = await registerUser(userData);
      console.log('Registration successful:', result);
      
      // Set user data with token and route to onboarding
      setUser({
        ...result.user,
        isOnboarded: false, // Ensure new users go through onboarding
        assessmentScores: {},
        dataConsent: false,
        clinicianSharing: false
      }, result.token);
      
      console.log('Routing new user to onboarding');
  navigateTo('onboarding');
      
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
      const result = await loginUser(credentials);
      if (result) {
        console.log('Login successful:', result);
        setUser(result.user, result.token);
        navigateTo(result.user.isOnboarded ? 'dashboard' : 'onboarding');
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
    logoutFromStore(); // Clear all auth state (user, isAuthenticated, isLoading, error)
    navigateTo('landing');
    // React Query will clear assessment data automatically
    // Clear active session
    setActiveSession(null);
    updateDashboardTourPending(false);
    // Clear any query params that might trigger OAuth callback logic
    window.history.replaceState({}, document.title, '/');
  };

  const adminAuth = useAdminAuth();
  const { admin, adminLogin } = adminAuth;

  const handleAdminLogin = async (credentials: { email: string; password: string }) => {
    try {
      console.log('App.tsx: Starting admin login process');
      await adminLogin(credentials);
      console.log('App.tsx: Admin login successful, redirecting to admin dashboard');
    navigateTo('admin');
    } catch (error) {
      console.error('App.tsx: Admin login failed:', error);
      // The error will be handled by the AdminAuthContext
    }
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
    }, userData.token);
    
    // Store complete user data (token is now handled by authStore)
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
      navigateTo('password-setup');
    } else {
      console.log('Routing existing user to dashboard');
      // Let the app's general onboarding logic handle routing
      if (!userData.isOnboarded) {
        console.log('User not onboarded, will redirect to onboarding from dashboard/app logic');
      }
      navigateTo('dashboard');
    }
  };

  const handleOAuthError = (error: string) => {
    setAuthError(error);
    // Clear URL parameters
    window.history.replaceState({}, document.title, '/');
    navigateTo('landing');
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
    console.log('completeOnboardingFlow called with:', profileData);
    console.log('Current token in localStorage:', localStorage.getItem('token'));
    
    try {
      console.log('Completing onboarding with data:', profileData);
      console.log('Current user before onboarding:', user);
      
      if (profileData.approach) {
        console.log('Making API call to complete onboarding...');
        // Send all profile data to backend
        const updatedUser = await completeOnboarding(profileData.approach, profileData);
        console.log('API response received:', updatedUser);
        if (updatedUser) {
          console.log('Onboarding completed, updated user:', updatedUser);
          setUser(updatedUser);
          try {
            localStorage.removeItem(ONBOARDING_STORAGE_KEY);
          } catch (storageError) {
            console.warn('Failed to clear onboarding draft:', storageError);
          }
          updateDashboardTourPending(true);
        } else {
          console.log('No updated user returned from API');
        }
      } else {
        console.log('No approach selected, skipping API call');
        if (user) {
          updateUser({ isOnboarded: true });
        }
        try {
          localStorage.removeItem(ONBOARDING_STORAGE_KEY);
        } catch (storageError) {
          console.warn('Failed to clear onboarding draft:', storageError);
        }
        updateDashboardTourPending(true);
      }
      
      console.log('Onboarding complete - routing to overall assessment invite');
      navigateTo('assessment-invite');
      
    } catch (error) {
      console.error('Onboarding completion error:', error);
      // Don't proceed to dashboard if backend update fails - show error instead
      setAuthError('Failed to save onboarding data. Please try again.');
      // Don't set user as onboarded if backend failed
      // setUser(prev => prev ? { ...prev, isOnboarded: true, approach: profileData.approach } : null);
      // setCurrentPage('dashboard');
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
          navigateTo('onboarding');
        } else {
          console.log('User is fully onboarded - routing to dashboard');
          navigateTo('dashboard');
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
    const applyPage = (page: Page, replace = false) => {
      const targetPath = PAGE_ROUTES[page];
      if (targetPath && targetPath !== normalizePath(window.location.pathname)) {
        const state = { page };
        if (replace) {
          window.history.replaceState(state, '', targetPath);
        } else {
          window.history.pushState(state, '', targetPath);
        }
      }
      setCurrentPage(page);
    };

    const checkOAuthCallback = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const path = window.location.pathname;

      if (
        path === PAGE_ROUTES['oauth-callback'] ||
        urlParams.has('token') ||
        urlParams.has('error') ||
        urlParams.has('redirect') ||
        urlParams.has('needs_setup')
      ) {
        applyPage('oauth-callback', true);
        return true;
      }
      return false;
    };

    const loadUser = async () => {
      try {
        if (checkOAuthCallback()) {
          setLoadingUser(false);
          return;
        }

        const requestedPage = pathToPage(window.location.pathname);
        const existingUser = await getCurrentUser();

        if (existingUser) {
          setUser(existingUser);
          const targetPage = resolveInitialPage(existingUser, requestedPage, Boolean(admin));
          const replace = targetPage !== requestedPage;
          applyPage(targetPage, replace);
        } else {
          setUser(null);
          const targetPage = resolveInitialPage(null, requestedPage, Boolean(admin));
          const replace = targetPage !== requestedPage;
          applyPage(targetPage, replace);
        }
      } catch (error) {
        console.error('Error loading user:', error);
        applyPage('landing', true);
      } finally {
        setLoadingUser(false);
      }
    };

    loadUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [admin]); // setUser is stable (from Zustand) and doesn't need to be in dependencies

  useEffect(() => {
    if (loadingUser) {
      return;
    }

    if (!user) {
      if (currentPage === 'admin') {
        navigateTo('admin-login');
      } else if (!PUBLIC_PAGES.has(currentPage)) {
        navigateTo('user-login');
      }
      return;
    }

    if (!user.isOnboarded && !PRE_ONBOARDING_ALLOWED_PAGES.has(currentPage)) {
      navigateTo('onboarding');
      return;
    }

    if (currentPage === 'admin' && !admin) {
      navigateTo('admin-login');
    }
  }, [user, loadingUser, currentPage, admin, navigateTo]);

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'user-login':
        return (
          <UserLoginPage
            onLogin={login}
            onSignUp={signUp}
            authError={authError}
            loginError={loginError}
            onNavigateHome={() => navigateTo('landing')}
            onNavigateAdmin={() => navigateTo('admin-login')}
            startOAuth={startGoogleOAuth}
          />
        );
      case 'admin-login':
        return (
          <AdminLoginPage
            onAdminLogin={handleAdminLogin}
            authError={authError}
            loginError={loginError}
            onNavigateHome={() => navigateTo('landing')}
            onNavigateUserLogin={() => navigateTo('user-login')}
          />
        );
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
        return (
          <OnboardingFlow
            onComplete={completeOnboardingFlow}
            user={user}
            onExit={() => {
              // When user exits onboarding, give them choice to take assessment or go to dashboard
              if (user?.hasCompletedOnboarding) {
                // If they've already completed onboarding before, go straight to dashboard
                navigateTo('dashboard');
              } else {
                // First-time users get the assessment invite
                navigateTo('assessment-invite');
              }
            }}
          />
        );
      case 'dashboard':
        return (
          <Dashboard
            user={user}
            onNavigate={navigateTo}
            onLogout={logout}
            showTour={dashboardTourPending}
            onTourDismiss={() => updateDashboardTourPending(false)}
            onTourComplete={() => updateDashboardTourPending(false)}
          />
        );
      case 'assessments':
        return (
          <AssessmentList
            onStartAssessment={startAssessment}
            onStartCombinedAssessment={startBasicOverallAssessment}
            onNavigate={navigateTo}
            onViewAssessmentResults={viewAssessmentResults}
            insights={assessmentInsights}
            history={assessmentHistory}
            isLoading={assessmentsLoading}
            isStartingCombinedAssessment={isStartingOverallSession}
            errorMessage={assessmentError}
          />
        );
      case 'assessment-invite':
        return (
          <OverallAssessmentInvite
            onDecision={handleAssessmentInviteDecision}
            userName={user?.firstName || user?.name}
          />
        );
      case 'assessment-selection':
        return (
          <OverallAssessmentSelection
            onSubmit={beginOverallAssessment}
            onCancel={() => {
              setAssessmentSelectionDefaults(undefined);
              navigateTo(assessmentSelectionReturnPage);
            }}
            isSubmitting={isStartingOverallSession}
            errorMessage={assessmentError}
            defaultSelected={assessmentSelectionDefaults}
          />
        );
      case 'combined-assessment-flow':
        return activeSession && selectedAssessmentTypes.length > 0 ? (
          <CombinedAssessmentFlow
            selectedTypes={selectedAssessmentTypes}
            sessionId={activeSession.id}
            onComplete={completeCombinedAssessment}
            onCancel={() => navigateTo(assessmentSelectionReturnPage)}
          />
        ) : (
          <Dashboard
            user={user}
            onNavigate={navigateTo}
            onLogout={logout}
            showTour={dashboardTourPending}
            onTourDismiss={() => updateDashboardTourPending(false)}
            onTourComplete={() => updateDashboardTourPending(false)}
          />
        );
      case 'assessment-flow':
        return currentAssessment ? (
          <AssessmentFlow
            assessmentId={currentAssessment}
            sessionId={activeSession?.id}
            onComplete={completeAssessment}
            onNavigate={navigateTo}
          />
        ) : (
          <Dashboard
            user={user}
            onNavigate={navigateTo}
            onLogout={logout}
            showTour={dashboardTourPending}
            onTourDismiss={() => updateDashboardTourPending(false)}
            onTourComplete={() => updateDashboardTourPending(false)}
          />
        );
      case 'insights':
        return (
          <InsightsResults
            insights={assessmentInsights}
            history={assessmentHistory}
            onNavigate={navigateTo}
            isLoading={assessmentsLoading}
            errorMessage={assessmentError}
            focusAssessmentType={insightsFocusType}
          />
        );
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
        // Only show if admin session exists
        return admin ? <AdminDashboard /> : <LandingPage onSignUp={signUp} onLogin={login} onAdminLogin={handleAdminLogin} authError={authError} loginError={loginError} />;
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
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <AdminAuthProvider>
          <ChatProvider>
            <AppInner />
            <ToastContainer />
          </ChatProvider>
        </AdminAuthProvider>
      </ToastProvider>
    </QueryClientProvider>
  );
}
