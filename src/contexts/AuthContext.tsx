
// Placeholder for Auth0 integration
import { ReactNode } from 'react';

export function AuthProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export function useAuth() {
  throw new Error('useAuth is deprecated. Use Auth0 useUser instead.');
}
