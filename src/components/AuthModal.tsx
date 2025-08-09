'use client';

import { useState } from 'react';
import { csrfFetch } from '@/lib/csrf';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { X, Mail, Lock, User, Building } from 'lucide-react';
import { DevCaptcha } from '@/components/DevCaptcha';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
}

export function AuthModal({ isOpen, onClose, initialMode = 'login' }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    accountType: 'user' as 'user' | 'business_owner',
    agreeToTerms: false,
  });
  const [captchaToken, setCaptchaToken] = useState<string>('');

  const { login } = useAuth();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      if (mode === 'login') {
  const result = await login(formData.email, formData.password, captchaToken || (process.env.NEXT_PUBLIC_DEV_CAPTCHA ? undefined : 'dev_bypass'));
        if (result.success) {
          onClose();
          // Reset form
          setFormData({
            email: '',
            password: '',
            firstName: '',
            lastName: '',
            accountType: 'user',
            agreeToTerms: false,
          });
        } else {
          setError(result.error || 'Login failed');
        }
      } else {
        // Register
  const response = await csrfFetch('/api/auth/signup', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
            firstName: formData.firstName,
            lastName: formData.lastName,
            accountType: formData.accountType,
      agreeToTerms: formData.agreeToTerms,
      captchaToken: captchaToken || (process.env.NEXT_PUBLIC_DEV_CAPTCHA ? undefined : 'dev_bypass')
          }),
        });

        const data = await response.json();

        if (response.ok) {
          // Auto-login after successful registration
          const loginResult = await login(formData.email, formData.password);
          if (loginResult.success) {
            onClose();
            // Reset form
            setFormData({
              email: '',
              password: '',
              firstName: '',
              lastName: '',
              accountType: 'user',
              agreeToTerms: false,
            });
            setCaptchaToken('');
          }
        } else {
          setError(data.error || 'Registration failed');
        }
      }
    } catch (error) {
      setError('Network error. Please try again.');
      console.error('Auth error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-md mx-4">
        <Card className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {mode === 'login' ? 'Welcome Back' : 'Create Account'}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Close modal"
            >
              <X size={20} />
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                      First Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-600" />
                      <input
                        type="text"
                        id="firstName"
                        name="firstName"
                        required
                        value={formData.firstName}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-600" />
                      <input
                        type="text"
                        id="lastName"
                        name="lastName"
                        required
                        value={formData.lastName}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label htmlFor="accountType" className="block text-sm font-medium text-gray-700 mb-1">
                    Account Type
                  </label>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-600" />
                    <select
                      id="accountType"
                      name="accountType"
                      value={formData.accountType}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="user">Regular User</option>
                      <option value="business_owner">Business Owner</option>
                    </select>
                  </div>
                </div>
              </>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-600" />
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-600" />
                <input
                  type="password"
                  id="password"
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              {mode === 'register' && (
                <p className="mt-1 text-xs text-gray-500">
                  Minimum 8 characters with uppercase, lowercase, number, and special character
                </p>
              )}
            </div>

            {mode === 'register' && (
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="agreeToTerms"
                  name="agreeToTerms"
                  required
                  checked={formData.agreeToTerms}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="agreeToTerms" className="ml-2 text-sm text-gray-700">
                  I agree to the{' '}
                  <a href="/terms-of-service" className="text-blue-600 hover:underline" target="_blank">
                    Terms of Service
                  </a>{' '}
                  and{' '}
                  <a href="/privacy-policy" className="text-blue-600 hover:underline" target="_blank">
                    Privacy Policy
                  </a>
                </label>
              </div>
            )}

            {process.env.NEXT_PUBLIC_DEV_CAPTCHA === 'true' && (
              <DevCaptcha onSolved={(t) => setCaptchaToken(t)} className="pt-2" />
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || (process.env.NEXT_PUBLIC_DEV_CAPTCHA === 'true' && !captchaToken)}
            >
              {isLoading
                ? (mode === 'login' ? 'Signing In...' : 'Creating Account...')
                : (mode === 'login' ? 'Sign In' : 'Create Account')
              }
            </Button>
          </form>

          {/* Switch Mode */}
          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setMode(mode === 'login' ? 'register' : 'login');
                setError('');
              }}
              className="text-sm text-blue-600 hover:underline"
            >
              {mode === 'login'
                ? "Don't have an account? Sign up"
                : 'Already have an account? Sign in'
              }
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}
