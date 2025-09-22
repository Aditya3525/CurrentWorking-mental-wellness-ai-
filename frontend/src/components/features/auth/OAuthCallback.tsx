import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import React, { useEffect, useState } from 'react';

import { Card, CardContent } from '../../ui/card';

interface OAuthCallbackProps {
  onAuthSuccess: (userData: { id: string; name: string; email: string; token: string; needsSetup?: boolean; needsPassword?: boolean; justCreated?: boolean }) => void;
  onAuthError: (error: string) => void;
}

export function OAuthCallback({ onAuthSuccess, onAuthError }: OAuthCallbackProps) {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Authenticating with Google...');
  const API_BASE_URL: string = (import.meta as unknown as { env?: { VITE_API_URL?: string } })?.env?.VITE_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        const error = urlParams.get('error');
        const redirectTo = urlParams.get('redirect');
        const needsSetup = urlParams.get('needs_setup') === 'true';
        const userDataParam = urlParams.get('user_data');

        if (error) {
          setStatus('error');
          setMessage('Authentication failed: ' + error);
          onAuthError(error);
          return;
        }

        if (!token) {
          setStatus('error');
          setMessage('No authentication token received');
          onAuthError('No authentication token received');
          return;
        }

        // Parse user data from URL
        let googleUserData = null;
        if (userDataParam) {
          try {
            googleUserData = JSON.parse(decodeURIComponent(userDataParam));
            console.log('Google User Data:', googleUserData);
          } catch (parseError) {
            console.error('Error parsing user data:', parseError);
          }
        }

        // Validate the token with the backend and get complete user profile
        const validateResponse = await fetch(`${API_BASE_URL}/auth/validate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });

        if (!validateResponse.ok) {
          throw new Error('Token validation failed');
        }

        const validatedUserData = await validateResponse.json();
        console.log('Complete user profile from backend:', validatedUserData);
        
        // Merge with Google user data if available, but prioritize backend data
        const completeUserData = {
          ...validatedUserData,
          ...(googleUserData || {}),
          token,
          needsSetup,
          needsPassword: redirectTo === 'setup-password',
          isGoogleUser: !!googleUserData,
          hasPassword: validatedUserData.hasPassword !== undefined ? validatedUserData.hasPassword : !!validatedUserData.password,
          justCreated: googleUserData?.justCreated
        };
        
        console.log('Final complete user data for frontend:', completeUserData);
        
        // Store token and complete user data
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(completeUserData));

        setStatus('success');
        
        // Determine the flow based on redirect parameter
        console.log('OAuth routing decision:', { redirectTo, needsSetup, hasPassword: completeUserData.hasPassword, isOnboarded: completeUserData.isOnboarded, justCreated: completeUserData.justCreated });
        
        // Simplified routing - let the main app handle the logic
        switch (redirectTo) {
          case 'setup-password':
            setMessage('Please set up a secure password...');
            setTimeout(() => {
              onAuthSuccess(completeUserData);
            }, 1500);
            break;
          default:
            // For existing users or any other case, go to dashboard
            // The app will handle onboarding checks
            setMessage('Welcome back! Taking you to your dashboard...');
            setTimeout(() => {
              onAuthSuccess(completeUserData);
            }, 1500);
        }

      } catch (error) {
        console.error('OAuth callback error:', error);
        setStatus('error');
        setMessage('Authentication failed. Please try again.');
        onAuthError('Authentication failed. Please try again.');
      }
    };

    handleCallback();
  }, [onAuthSuccess, onAuthError, API_BASE_URL]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-8 text-center space-y-6">
          {status === 'loading' && (
            <>
              <Loader2 className="w-12 h-12 mx-auto animate-spin text-blue-600" />
              <div className="space-y-2">
                <h2 className="text-2xl font-semibold">Signing you in...</h2>
                <p className="text-gray-600">{message}</p>
              </div>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle className="w-12 h-12 mx-auto text-green-600" />
              <div className="space-y-2">
                <h2 className="text-2xl font-semibold text-green-800">Success!</h2>
                <p className="text-gray-600">{message}</p>
                <p className="text-sm text-gray-500">Redirecting you to the app...</p>
              </div>
            </>
          )}

          {status === 'error' && (
            <>
              <XCircle className="w-12 h-12 mx-auto text-red-600" />
              <div className="space-y-2">
                <h2 className="text-2xl font-semibold text-red-800">Authentication Failed</h2>
                <p className="text-gray-600">{message}</p>
                <button
                  onClick={() => window.location.href = '/'}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  Try Again
                </button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
