'use client';

import Link from 'next/link';
import { useUser } from '@auth0/nextjs-auth0/client';
import { Card } from '@/components/ui/Card';
import { Lock } from 'lucide-react';


interface AdminAuthProps {
  children: React.ReactNode;
}

export const AdminAuth = ({ children }: AdminAuthProps) => {
  const { user, isLoading } = useUser();
  const isSuperAdmin = user?.role === 'super_admin';

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user || !isSuperAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="p-8 w-full max-w-md">
          <div className="text-center">
            <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Access Denied</h1>
            <p className="text-gray-600 mt-2 mb-6">
              Super Administrator access required to view this page.
            </p>
            {!user ? (
              <p className="text-sm text-gray-500">
                Please{' '}
                <Link href="/" className="text-blue-600 hover:underline">
                  sign in
                </Link>{' '}
                with a super admin account.
              </p>
            ) : (
              <p className="text-sm text-gray-500">
                Your account ({user.role}) does not have sufficient permissions.
              </p>
            )}
          </div>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
// ...file ends here
};
