import { authApi, usersApi, User } from './api';

// Updated auth service that uses the backend API
export interface StoredUser extends User {
  assessmentScores?: {
    anxiety?: number;
    stress?: number;
    emotionalIntelligence?: number;
    overthinking?: number;
  };
}

export async function registerUser(userData: { name: string; email: string; password: string }): Promise<StoredUser> {
  try {
    if (!userData.password || userData.password.length < 6) {
      throw new Error('Password must be at least 6 characters long');
    }

    const response = await authApi.register(userData);

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Registration failed');
    }

    return response.data.user as StoredUser;
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
}

export async function loginUser(credentials: { email: string; password: string }): Promise<StoredUser | null> {
  try {
    if (!credentials.password) {
      throw new Error('Password is required');
    }

    const response = await authApi.login(credentials);

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Login failed');
    }

    return response.data.user as StoredUser;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
}

export async function getCurrentUser(): Promise<StoredUser | null> {
  try {
    if (!authApi.isAuthenticated()) {
      return null;
    }

    const response = await authApi.getCurrentUser();
    
    if (!response.success || !response.data) {
      // Token might be expired, clear it
      authApi.logout();
      return null;
    }

    return response.data.user as StoredUser;
  } catch (error) {
    console.error('Get current user error:', error);
    authApi.logout();
    return null;
  }
}

export async function updateUser(updater: (user: StoredUser) => Partial<StoredUser>): Promise<StoredUser | null> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      throw new Error('No user logged in');
    }

    const updates = updater(currentUser);
    const response = await usersApi.updateProfile(currentUser.id, updates);

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Update failed');
    }

    return response.data.user as StoredUser;
  } catch (error) {
    console.error('Update user error:', error);
    throw error;
  }
}

export function signOut(): void {
  try {
  // Optional server notification
  authApi.serverLogout().catch(() => {});
    authApi.logout();
    // Remove any legacy keys that might keep user logged in
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('token');
  } catch (e) {
    console.warn('Sign out cleanup issue:', e);
  }
}

// Helper function to complete onboarding
export async function completeOnboarding(
  approach: 'western' | 'eastern' | 'hybrid',
  profileData?: {
    firstName?: string;
    lastName?: string;
    birthday?: string;
    gender?: string;
    region?: string;
    language?: string;
    emergencyContact?: string;
    emergencyPhone?: string;
  }
): Promise<StoredUser | null> {
  try {
    // Prepare the complete onboarding data
    const onboardingData = {
      approach,
      ...profileData
    };
    
    const response = await usersApi.completeOnboarding(onboardingData);
    
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Onboarding completion failed');
    }

    return response.data.user as StoredUser;
  } catch (error) {
    console.error('Complete onboarding error:', error);
    throw error;
  }
}

export async function setupUserPassword(password: string): Promise<StoredUser | null> {
  try {
    console.log('Setting up user password...');
    const response = await authApi.setupPassword(password);
    console.log('Setup password response:', response);
    
    if (response.success && response.data) {
      console.log('Password setup successful, returning user:', response.data.user);
      return response.data.user as StoredUser;
    } else {
      console.log('Password setup failed - invalid response:', response);
      return null;
    }
  } catch (error) {
    console.error('Setup password error:', error);
    throw error;
  }
}

export async function updateUserProfile(profileData: {
  birthday?: string;
  gender?: string;
  region?: string;
  language?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  approach?: 'western' | 'eastern' | 'hybrid';
}): Promise<StoredUser | null> {
  try {
    const response = await authApi.updateProfile(profileData);
    if (response.success && response.data) {
      return response.data.user as StoredUser;
    }
    return null;
  } catch (error) {
    console.error('Update profile error:', error);
    throw error;
  }
}
