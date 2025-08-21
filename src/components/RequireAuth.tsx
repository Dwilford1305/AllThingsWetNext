"use client";

import { useEffect } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import { useRouter } from 'next/navigation';

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      // Redirect to Auth0 login; return URL set by Auth0 config
      router.push('/api/auth/login');
    }
  }, [isLoading, user, router]);

  if (isLoading) return null;
  if (!user) return null;
  return <>{children}</>;
}
