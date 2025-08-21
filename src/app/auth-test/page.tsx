'use client'

import Navigation from '@/components/ui/Navigation'
import FoldableLayout from '@/components/FoldableLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { User, LogOut } from 'lucide-react'
import { useUser } from '@auth0/nextjs-auth0/client';

export default function AuthTestPage() {
  const { user } = useUser();
  const handleLogin = () => { window.location.href = '/api/auth/login'; };
  const handleLogout = () => { window.location.href = '/api/auth/logout'; };
  const testApiCall = async () => {
    alert('With Auth0, use getAccessToken or call your protected API route.');
  };

  return (
    <FoldableLayout>
      <Navigation />
      <div className="max-w-2xl mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Authentication System Test
          </h1>
          <p className="text-gray-600">
            Test the new user authentication and account management system (now using Auth0)
          </p>
        </div>
        {!user ? (
          <div className="max-w-md mx-auto">
            <Button onClick={handleLogin} variant="primary">
              Log In with Auth0
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            <Card className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
                    <User className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {user.name || user.nickname || user.email}
                    </h2>
                    <p className="text-gray-600">{user.email}</p>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            </Card>
            <div>
              <Button onClick={testApiCall} variant="secondary">
                Test Auth0 Session
              </Button>
            </div>
          </div>
        )}
      </div>
    </FoldableLayout>
  );
}
