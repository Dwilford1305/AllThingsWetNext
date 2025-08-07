'use client'

import { useState, useEffect } from 'react'
import Navigation from '@/components/ui/Navigation'
import FoldableLayout from '@/components/FoldableLayout'
import { AuthForm } from '@/components/AuthForm'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { User, Building, Settings, LogOut, Shield } from 'lucide-react'
import type { User as UserType, AdminPermission } from '@/types'

interface ExtendedUser extends Partial<UserType> {
  verificationStatus?: 'pending' | 'rejected' | 'verified'
  businessIds?: string[]
  permissions?: AdminPermission[]
}

export default function AuthTestPage() {
  const [user, setUser] = useState<ExtendedUser | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Check if user is already logged in
    const savedUser = localStorage.getItem('user')
    const accessToken = localStorage.getItem('accessToken')
    
    if (savedUser && accessToken) {
      setUser(JSON.parse(savedUser) as ExtendedUser)
    }
  }, [])

  const handleLogin = (authData: Record<string, unknown>) => {
    const userData = authData.user as ExtendedUser
    setUser(userData)
  }

  const handleLogout = async () => {
    setLoading(true)
    try {
      const accessToken = localStorage.getItem('accessToken')
      
      if (accessToken) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        })
      }
      
      // Clear local storage
      localStorage.removeItem('user')
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      
      setUser(null)
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setLoading(false)
    }
  }

  const testApiCall = async () => {
    const accessToken = localStorage.getItem('accessToken')
    
    if (!accessToken) {
      alert('No access token found')
      return
    }

    try {
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })

      const result = await response.json()
      
      if (result.success) {
        alert('API call successful! Check console for user data.')
        console.log('User data:', result.data)
      } else {
        alert(`API call failed: ${result.error}`)
      }
    } catch (error) {
      alert('Network error during API call')
      console.error('API test error:', error)
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'super_admin': return 'bg-red-600 text-white'
      case 'admin': return 'bg-purple-600 text-white'
      case 'business_owner': return 'bg-blue-600 text-white'
      case 'user': return 'bg-green-600 text-white'
      default: return 'bg-gray-600 text-white'
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'super_admin':
      case 'admin':
        return <Shield className="h-4 w-4" />
      case 'business_owner':
        return <Building className="h-4 w-4" />
      default:
        return <User className="h-4 w-4" />
    }
  }

  return (
    <>
      <Navigation />
      <FoldableLayout>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Authentication System Test
            </h1>
            <p className="text-gray-600">
              Test the new user authentication and account management system
            </p>
          </div>

          {!user ? (
            <div className="max-w-md mx-auto">
              <AuthForm onLogin={handleLogin} />
            </div>
          ) : (
            <div className="space-y-6">
              {/* User Profile Card */}
              <Card className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
                      <User className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">
                        {user.firstName} {user.lastName}
                      </h2>
                      <p className="text-gray-600">{user.email}</p>
                      <div className="flex items-center space-x-2 mt-2">
                        <Badge className={getRoleColor(user.role || 'user')}>
                          {getRoleIcon(user.role || 'user')}
                          <span className="ml-1 capitalize">{(user.role || 'user').replace('_', ' ')}</span>
                        </Badge>
                        {user.isEmailVerified ? (
                          <Badge className="bg-green-100 text-green-800">Verified</Badge>
                        ) : (
                          <Badge className="bg-yellow-100 text-yellow-800">Unverified</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleLogout}
                    disabled={loading}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    {loading ? 'Signing out...' : 'Sign Out'}
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Account Details</h3>
                    <ul className="space-y-1 text-sm text-gray-600">
                      <li><strong>ID:</strong> {user.id}</li>
                      <li><strong>Phone:</strong> {user.phone || 'Not provided'}</li>
                      <li><strong>Created:</strong> {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}</li>
                      <li><strong>Last Login:</strong> {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : 'Never'}</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Account Status</h3>
                    <ul className="space-y-1 text-sm text-gray-600">
                      <li><strong>Active:</strong> {user.isActive ? 'Yes' : 'No'}</li>
                      <li><strong>Suspended:</strong> {user.isSuspended ? 'Yes' : 'No'}</li>
                      <li><strong>2FA:</strong> {user.twoFactorEnabled ? 'Enabled' : 'Disabled'}</li>
                      <li><strong>Theme:</strong> {user.preferences?.theme || 'System'}</li>
                    </ul>
                  </div>
                </div>
              </Card>

              {/* Business Owner Features */}
              {user.role === 'business_owner' && (
                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Building className="h-5 w-5 mr-2" />
                    Business Owner Features
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <strong>Verification Status:</strong>{' '}
                      <Badge className={
                        user.verificationStatus === 'verified' ? 'bg-green-100 text-green-800' :
                        user.verificationStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }>
                        {user.verificationStatus}
                      </Badge>
                    </div>
                    <div>
                      <strong>Owned Businesses:</strong> {user.businessIds?.length || 0}
                    </div>
                    <div className="space-x-2">
                      <Button size="sm" variant="outline">
                        <Building className="h-4 w-4 mr-2" />
                        Manage Businesses
                      </Button>
                      <Button size="sm" variant="outline">
                        Claim Business
                      </Button>
                    </div>
                  </div>
                </Card>
              )}

              {/* Admin Features */}
              {(user.role === 'admin' || user.role === 'super_admin') && (
                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Shield className="h-5 w-5 mr-2" />
                    Admin Features
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <strong>Permissions:</strong>{' '}
                      <div className="flex flex-wrap gap-1 mt-1">
                        {user.permissions?.length ? user.permissions.map((perm: string) => (
                          <Badge key={perm} variant="secondary" className="text-xs">
                            {perm.replace('_', ' ')}
                          </Badge>
                        )) : <span className="text-gray-500">No specific permissions</span>}
                      </div>
                    </div>
                    <div className="space-x-2">
                      <Button size="sm" variant="outline">
                        <Settings className="h-4 w-4 mr-2" />
                        Admin Dashboard
                      </Button>
                    </div>
                  </div>
                </Card>
              )}

              {/* API Testing */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  API Testing
                </h3>
                <div className="space-y-4">
                  <p className="text-gray-600">
                    Test authenticated API endpoints with your current session.
                  </p>
                  <div className="space-x-2">
                    <Button size="sm" onClick={testApiCall}>
                      Test /api/auth/me
                    </Button>
                    <Button size="sm" variant="outline">
                      Test Business Claims
                    </Button>
                  </div>
                </div>
              </Card>

              {/* Raw User Data (for debugging) */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Raw User Data (Debug)
                </h3>
                <pre className="bg-gray-100 p-4 rounded-md overflow-auto text-xs">
                  {JSON.stringify(user, null, 2)}
                </pre>
              </Card>
            </div>
          )}
        </div>
      </FoldableLayout>
    </>
  )
}
