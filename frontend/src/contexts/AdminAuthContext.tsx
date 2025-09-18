import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

// Types
interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
}

interface AdminAuthContextType {
  admin: AdminUser | null;
  isAdminAuthenticated: boolean;
  isLoading: boolean;
  loginError: string | null;
  adminLogin: (credentials: { email: string; password: string }) => Promise<void>;
  adminLogout: () => Promise<void>;
  refreshAdminToken: () => Promise<boolean>;
  clearAdminError: () => void;
}

interface AdminAuthProviderProps {
  children: ReactNode;
}

interface AdminLoginResponse {
  success: boolean;
  message?: string;
  admin?: AdminUser;
  token?: string;
  sessionExpiry?: string;
  error?: string;
}

interface AdminProfileResponse {
  success: boolean;
  admin?: AdminUser;
  error?: string;
}

// Create context
const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

// Custom hook to use admin auth context
export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};

// Admin Auth Provider Component
export const AdminAuthProvider: React.FC<AdminAuthProviderProps> = ({ children }) => {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loginError, setLoginError] = useState<string | null>(null);

  const isAdminAuthenticated = !!admin;

  // API Base URL
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  // Clear admin error
  const clearAdminError = () => {
    setLoginError(null);
  };

  // Check for existing admin session on app load
  const checkAdminSession = useCallback(async (): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/auth/profile`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data: AdminProfileResponse = await response.json();
        if (data.success && data.admin) {
          setAdmin(data.admin);
          console.log('Found existing admin session:', data.admin);
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error('Error checking admin session:', error);
      return false;
    }
  }, [API_BASE_URL]);

  // Admin login function
  const adminLogin = async (credentials: { email: string; password: string }): Promise<void> => {
    setIsLoading(true);
    setLoginError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/admin/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(credentials),
      });

      const data: AdminLoginResponse = await response.json();

      if (response.ok && data.success && data.admin) {
        setAdmin(data.admin);
        setLoginError(null);
        console.log('Admin login successful:', data.admin);
        
        // Store token in localStorage as backup (though we're using httpOnly cookies)
        if (data.token) {
          localStorage.setItem('adminToken', data.token);
        }
        
        // Store session expiry for client-side checks
        if (data.sessionExpiry) {
          localStorage.setItem('adminSessionExpiry', data.sessionExpiry);
        }
      } else {
        const errorMessage = data.error || 'Admin login failed';
        setLoginError(errorMessage);
        console.error('Admin login failed:', errorMessage);
        throw new Error(errorMessage);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Network error during admin login';
      setLoginError(errorMessage);
      console.error('Admin login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Admin logout function
  const adminLogout = useCallback(async (): Promise<void> => {
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/admin/auth/logout`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // Clear admin state regardless of response status
      setAdmin(null);
      setLoginError(null);
      
      // Clear local storage
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminSessionExpiry');
      
      console.log('Admin logout completed');

      if (!response.ok) {
        console.warn('Admin logout request failed, but local state cleared');
      }
    } catch (error) {
      console.error('Admin logout error:', error);
      // Still clear local state even if server request fails
      setAdmin(null);
      setLoginError(null);
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminSessionExpiry');
    } finally {
      setIsLoading(false);
    }
  }, [API_BASE_URL]);

  // Refresh admin token
  const refreshAdminToken = useCallback(async (): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Update token in localStorage if provided
          if (data.token) {
            localStorage.setItem('adminToken', data.token);
          }
          
          // Update session expiry
          if (data.sessionExpiry) {
            localStorage.setItem('adminSessionExpiry', data.sessionExpiry);
          }
          
          console.log('Admin token refreshed successfully');
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error('Error refreshing admin token:', error);
      return false;
    }
  }, [API_BASE_URL]);

  // Auto-refresh token before expiry
  useEffect(() => {
    if (!isAdminAuthenticated) return;

    const checkTokenExpiry = () => {
      const expiryStr = localStorage.getItem('adminSessionExpiry');
      if (!expiryStr) return;

      const expiry = new Date(expiryStr);
      const now = new Date();
      const timeUntilExpiry = expiry.getTime() - now.getTime();
      
      // Refresh token if it expires within 30 minutes
      if (timeUntilExpiry < 30 * 60 * 1000 && timeUntilExpiry > 0) {
        console.log('Auto-refreshing admin token...');
        refreshAdminToken().catch(error => {
          console.error('Auto-refresh failed:', error);
          // If refresh fails, logout the admin
          adminLogout();
        });
      }
      
      // If token is already expired, logout
      if (timeUntilExpiry <= 0) {
        console.log('Admin token expired, logging out...');
        adminLogout();
      }
    };

    // Check immediately
    checkTokenExpiry();

    // Set up interval to check every 5 minutes
    const interval = setInterval(checkTokenExpiry, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [isAdminAuthenticated, refreshAdminToken, adminLogout]);

  // Check for existing admin session on mount
  useEffect(() => {
    const initializeAdminAuth = async () => {
      setIsLoading(true);
      
      try {
        // Check if there's a stored token and it's not expired
        const expiryStr = localStorage.getItem('adminSessionExpiry');
        if (expiryStr) {
          const expiry = new Date(expiryStr);
          if (expiry.getTime() <= Date.now()) {
            // Token expired, clear it
            localStorage.removeItem('adminToken');
            localStorage.removeItem('adminSessionExpiry');
            setIsLoading(false);
            return;
          }
        }

        // Try to restore admin session
        const hasValidSession = await checkAdminSession();
        if (!hasValidSession) {
          // Clear any stale tokens
          localStorage.removeItem('adminToken');
          localStorage.removeItem('adminSessionExpiry');
        }
      } catch (error) {
        console.error('Error initializing admin auth:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAdminAuth();
  }, [checkAdminSession]);

  // Context value
  const contextValue: AdminAuthContextType = {
    admin,
    isAdminAuthenticated,
    isLoading,
    loginError,
    adminLogin,
    adminLogout,
    refreshAdminToken,
    clearAdminError,
  };

  return (
    <AdminAuthContext.Provider value={contextValue}>
      {children}
    </AdminAuthContext.Provider>
  );
};

// Export context for testing
export { AdminAuthContext };