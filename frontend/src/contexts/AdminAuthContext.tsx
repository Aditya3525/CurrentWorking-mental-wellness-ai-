import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface Admin {
  id: string;
  email: string;
  role: string;
  name?: string;
}

interface AdminAuthContextType {
  admin: Admin | null;
  adminLogin: (credentials: { email: string; password: string }) => Promise<void>;
  adminLogout: () => Promise<void>;
  isLoading: boolean;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};

interface AdminAuthProviderProps {
  children: ReactNode;
}

export const AdminAuthProvider: React.FC<AdminAuthProviderProps> = ({ children }) => {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch('/api/admin/session', {
          credentials: 'include'
        });
        
        if (response.ok) {
          const adminData = await response.json();
          setAdmin(adminData);
        }
      } catch (error) {
        console.error('Session check failed:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();
  }, []);

  const adminLogin = async (credentials: { email: string; password: string }) => {
    setIsLoading(true);
    try {
      console.log('Attempting admin login with:', credentials.email);
      
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
        credentials: 'include'
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      if (!response.ok) {
        const error = await response.text();
        console.error('Response error text:', error);
        throw new Error(error || 'Login failed');
      }

      const adminData = await response.json();
      console.log('Admin data received:', adminData);
      setAdmin(adminData);
      console.log('Admin login successful');
    } catch (error) {
      console.error('Admin login failed:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const adminLogout = async () => {
    try {
      await fetch('/api/admin/logout', {
        method: 'POST',
        credentials: 'include'
      });
    } catch (error) {
      console.error('Logout request failed:', error);
    } finally {
      setAdmin(null);
    }
  };

  const value = {
    admin,
    adminLogin,
    adminLogout,
    isLoading
  };

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
};
