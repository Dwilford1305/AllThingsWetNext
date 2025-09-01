'use client';

import { useUser } from '@auth0/nextjs-auth0/client';

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: unknown;
}

/**
 * Unified authentication hook that works with Auth0 only
 * This hook provides a consistent interface for checking authentication status
 */
export function useAuth(): AuthState {
  const { user: auth0User, isLoading: auth0Loading } = useUser();

  return {
    isAuthenticated: !!auth0User,
    isLoading: auth0Loading,
    user: auth0User,
  };
}