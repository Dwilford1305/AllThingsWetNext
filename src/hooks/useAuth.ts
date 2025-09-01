'use client';

import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: unknown;
  getAuthHeaders: () => Record<string, string>;
}

/**
 * Unified authentication hook that works with both Auth0 and custom JWT tokens
 * This hook provides a consistent interface for checking authentication status
 * and getting headers for API requests
 */
export function useAuth(): AuthState {
  const { user: auth0User, isLoading: auth0Loading } = useUser();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuthentication = useCallback(() => {
    // If Auth0 user is present, user is authenticated
    if (auth0User) {
      setIsAuthenticated(true);
      setIsLoading(false);
      return;
    }

    // Check for custom JWT token as fallback
    const token = localStorage.getItem('accessToken');
    if (token) {
      setIsAuthenticated(true);
      setIsLoading(false);
      return;
    }

    setIsAuthenticated(false);
    setIsLoading(auth0Loading);
  }, [auth0User, auth0Loading]);

  useEffect(() => {
    checkAuthentication();
  }, [checkAuthentication]);

  const getAuthHeaders = useCallback((): Record<string, string> => {
    const headers: Record<string, string> = {};
    
    // Try to get custom JWT token first
    const token = localStorage.getItem('accessToken');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Add CSRF token if available
    if (typeof document !== 'undefined') {
      const csrfToken = document.cookie
        .split('; ')
        .find(c => c.startsWith('csrfToken='))
        ?.split('=')[1];
      
      if (csrfToken) {
        headers['X-CSRF-Token'] = csrfToken;
      }
    }

    return headers;
  }, []);

  return {
    isAuthenticated,
    isLoading,
    user: auth0User,
    getAuthHeaders,
  };
}