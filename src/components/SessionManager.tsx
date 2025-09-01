"use client";
import { useUser } from '@auth0/nextjs-auth0/client';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { LogOut, Shield } from 'lucide-react';

export default function SessionManager() {
  const { user, isLoading } = useUser();
  const router = useRouter();

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="ml-2">Loading session...</span>
        </div>
      </Card>
    );
  }

  if (!user) {
    return (
      <Card className="p-6">
        <div className="text-center text-gray-500">
          No active session found.
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center space-x-2 mb-4">
        <Shield className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-semibold">Active Session</h3>
      </div>
      
      <div className="space-y-3">
        <div className="flex justify-between items-center py-2 border-b border-gray-200">
          <div>
            <div className="font-medium">Auth0 Session</div>
            <div className="text-sm text-gray-600">
              {user.email} • {user.email_verified ? 'Verified' : 'Unverified'}
            </div>
            <div className="text-xs text-gray-500">
              Last updated: {user.updated_at ? new Date(user.updated_at).toLocaleString() : 'N/A'}
            </div>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/api/auth/logout')}
            className="flex items-center space-x-1"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </Button>
        </div>
      </div>

      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-800">
          <Shield className="w-4 h-4 inline mr-1" />
          Your session is managed by Auth0 and is secure by default.
        </p>
      </div>
    </Card>
  );
}