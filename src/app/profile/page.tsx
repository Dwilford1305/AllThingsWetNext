'use client';

import { useState, useEffect, useCallback } from 'react';
import { csrfFetch } from '@/lib/csrf';
import Image from 'next/image';
import { useUser } from '@auth0/nextjs-auth0/client';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import Navigation from '@/components/ui/Navigation';
import FoldableLayout from '@/components/FoldableLayout';
import RequireAuth from '@/components/RequireAuth';
import { 
  User, 
  Settings, 
  Building, 
  Package, 
  Briefcase, 
  Shield, 
  Moon, 
  Sun, 
  Monitor,
  Camera,
  Phone,
  Mail,
  Lock,
  Bell,
  Eye,
  Save,
  Loader2
} from 'lucide-react';
import type { User as UserType, UserPreferences } from '@/types';
import BusinessRequestForm from '@/components/BusinessRequestForm';

interface ProfileData extends UserType {
  preferences: UserPreferences;
}

export default function ProfilePage() {
  const { user, isLoading: authLoading } = useUser();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('profile');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [viewportWidth, setViewportWidth] = useState(0);
  
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Detect viewport width for foldable detection
  useEffect(() => {
    const handleResize = () => {
      setViewportWidth(window.innerWidth);
    };

    const setInitialWidth = () => {
      if (typeof window !== 'undefined') {
        setViewportWidth(window.innerWidth);
      }
    };

    setInitialWidth();
    setTimeout(setInitialWidth, 100);

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  // Detect if device is likely a foldable in unfolded state
  const isFoldableUnfolded = () => {
    if (viewportWidth === 0) return false;
    
    const isDefinitelyFoldable = (
      (viewportWidth >= 650 && viewportWidth <= 690) || 
      (viewportWidth >= 715 && viewportWidth <= 735) || 
      (viewportWidth >= 740 && viewportWidth <= 785) || 
      (viewportWidth >= 840 && viewportWidth <= 860)    
    );
    
    const aspectRatioDetection = () => {
      if (typeof window === 'undefined') return false;
      const aspectRatio = window.innerWidth / window.innerHeight;
      return aspectRatio > 1.15 && aspectRatio < 2.1 && viewportWidth >= 640 && viewportWidth <= 900;
    };
    
    return isDefinitelyFoldable || aspectRatioDetection();
  };

  // Get appropriate padding based on device type
  const getTopPadding = () => {
    return isFoldableUnfolded() ? 'pt-8' : 'pt-20';
  };

  const loadProfileData = useCallback(async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
  const response = await fetch('/api/auth/profile', { credentials: 'include' });
      
      if (response.ok) {
        const result = await response.json();
        setProfileData(result.data);
      }
    } catch (_error) {
      console.error('Failed to load profile:', _error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
      return;
    }
    
    if (user) {
      loadProfileData();
    }
  }, [user, authLoading, router, loadProfileData]);

  const updateProfile = async (updates: Partial<ProfileData>) => {
    setIsSaving(true);
    setMessage(null);
    
    try {
  const response = await csrfFetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
      'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(updates),
      });
      
      const result = await response.json();
      
      if (response.ok) {
        setProfileData(result.data);
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to update profile' });
      }
    } catch (_error) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setIsSaving(false);
    }
  };

  const changePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }
    
    setIsSaving(true);
    setMessage(null);
    
    try {
  const response = await csrfFetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
      'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });
      
      const result = await response.json();
      
      if (response.ok) {
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setMessage({ type: 'success', text: 'Password changed successfully!' });
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to change password' });
      }
    } catch (_error) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <RequireAuth>
        <FoldableLayout>
          <Navigation />
          <div className={`min-h-screen bg-gray-50 flex items-center justify-center ${getTopPadding()}`}>
            <div className="flex items-center space-x-2">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span>Loading profile...</span>
            </div>
          </div>
        </FoldableLayout>
      </RequireAuth>
    );
  }

  if (!user || !profileData) {
    return (
      <RequireAuth>
        <FoldableLayout>
          <Navigation />
          <div className={`min-h-screen bg-gray-50 flex items-center justify-center ${getTopPadding()}`}>
            <Card className="p-8">
              <p className="text-center text-gray-600">Unable to load profile data.</p>
            </Card>
          </div>
        </FoldableLayout>
      </RequireAuth>
    );
  }

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'preferences', label: 'Preferences', icon: Settings },
    { id: 'business', label: 'Business', icon: Building },
    { id: 'listings', label: 'My Listings', icon: Package },
    { id: 'security', label: 'Security', icon: Shield },
  ];

  return (
    <RequireAuth>
      <FoldableLayout>
        <Navigation />
      <div className={`min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 profile-page ${getTopPadding()}`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Modern Header with gradient */}
          <div className="mb-8 text-center sm:text-left">
            <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
              Account Settings
            </h1>
            <p className="text-gray-600 mt-2 text-lg">Manage your profile, preferences, and business settings</p>
          </div>

          {/* Message */}
          {message && (
            <div className={`mb-6 p-4 rounded-md border ${
              message.type === 'success' 
                ? 'bg-green-50 text-green-800 border-green-200' 
                : 'bg-red-50 text-red-800 border-red-200'
            }`}>
              {message.text}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Sidebar */}
            <div className="lg:col-span-1">
              <Card className="p-6 bg-white/80 backdrop-blur-sm border-0 shadow-lg ring-1 ring-primary-100">
                {/* Profile Summary */}
                <div className="text-center mb-6">
                  <div className="w-20 h-20 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg">
                    {profileData.profileImage ? (
                      <Image
                        src={profileData.profileImage}
                        alt="Profile"
                        width={80}
                        height={80}
                        className="w-20 h-20 rounded-full object-cover"
                      />
                    ) : (
                      <User className="h-10 w-10 text-white" />
                    )}
                  </div>
                  <h3 className="font-semibold text-gray-900">
                    {profileData.firstName} {profileData.lastName}
                  </h3>
                  <p className="text-sm text-gray-600">{profileData.email}</p>
                  <p className="text-xs text-primary-700 mt-1 font-medium capitalize bg-primary-50 px-2 py-1 rounded-full">
                    {profileData.role.replace('_', ' ')}
                  </p>
                </div>

                {/* Navigation */}
                <nav className="space-y-1">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 profile-tab-button ${
                          activeTab === tab.id
                            ? 'bg-gradient-to-r from-primary-500 to-secondary-500 text-white shadow-md profile-tab-active'
                            : 'hover:bg-primary-50 text-gray-700 hover:text-primary-700 profile-tab-inactive'
                        }`}
                      >
                        <Icon size={16} />
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </nav>
              </Card>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              <Card className="p-6 bg-white/80 backdrop-blur-sm border-0 shadow-lg ring-1 ring-primary-100">
                {activeTab === 'profile' && (
                  <ProfileTab 
                    profileData={profileData} 
                    onUpdate={updateProfile} 
                    isSaving={isSaving} 
                  />
                )}
                
                {activeTab === 'preferences' && (
                  <PreferencesTab 
                    preferences={profileData.preferences} 
                    onUpdate={(prefs) => updateProfile({ preferences: prefs })} 
                    isSaving={isSaving} 
                  />
                )}
                
                {activeTab === 'business' && (
                  <BusinessTab userId={profileData.id} />
                )}
                
                {activeTab === 'listings' && (
                  <ListingsTab userId={profileData.id} />
                )}
                
                {activeTab === 'security' && (
                  <SecurityTab 
                    passwordForm={passwordForm}
                    onPasswordFormChange={setPasswordForm}
                    onChangePassword={changePassword}
                    isSaving={isSaving}
                  />
                )}
              </Card>
            </div>
          </div>
        </div>
      </div>
      </FoldableLayout>
    </RequireAuth>
  );
}

// Profile Tab Component
function ProfileTab({ 
  profileData, 
  onUpdate, 
  isSaving 
}: { 
  profileData: ProfileData; 
  onUpdate: (data: Partial<ProfileData>) => void; 
  isSaving: boolean;
}) {
  const [formData, setFormData] = useState({
    firstName: profileData.firstName,
    lastName: profileData.lastName,
    email: profileData.email,
    phone: profileData.phone || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate(formData);
  };

  return (
    <div>
      <h2 className="text-xl font-semibold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent mb-6">
        Profile Information
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Profile Picture */}
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Profile Picture
          </label>
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
              {profileData.profileImage ? (
                <Image
                  src={profileData.profileImage}
                  alt="Profile"
                  width={64}
                  height={64}
                  className="w-16 h-16 rounded-full object-cover"
                />
              ) : (
                <User className="h-8 w-8 text-gray-400" />
              )}
            </div>
            <Button type="button" variant="outline" size="sm">
              <Camera className="h-4 w-4 mr-2" />
              Change Photo
            </Button>
          </div>
        </div>

        {/* Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-900 mb-1">
              First Name
            </label>
            <input
              type="text"
              id="firstName"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
            />
          </div>
          
          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-900 mb-1">
              Last Name
            </label>
            <input
              type="text"
              id="lastName"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
            />
          </div>
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-900 mb-1">
            Email Address
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
            <input
              type="email"
              id="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
            />
          </div>
          <p className="text-xs text-gray-600 mt-1">
            Email changes require verification
          </p>
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-900 mb-1">
            Phone Number
          </label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
            <input
              type="tel"
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
              placeholder="(555) 123-4567"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

// Preferences Tab Component
function PreferencesTab({ 
  preferences, 
  onUpdate, 
  isSaving 
}: { 
  preferences: UserPreferences; 
  onUpdate: (prefs: UserPreferences) => void; 
  isSaving: boolean;
}) {
  const [prefs, setPrefs] = useState(preferences);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate(prefs);
  };

  const updateNotificationPref = (key: keyof UserPreferences['notifications'], value: boolean) => {
    setPrefs({
      ...prefs,
      notifications: {
        ...prefs.notifications,
        [key]: value
      }
    });
  };

  const updatePrivacyPref = (key: keyof UserPreferences['privacy'], value: boolean) => {
    setPrefs({
      ...prefs,
      privacy: {
        ...prefs.privacy,
        [key]: value
      }
    });
  };

  return (
    <div>
      <h2 className="text-xl font-semibold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent mb-6">
        Preferences
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Theme */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Theme</h3>
          <div className="space-y-3">
            {[
              { value: 'light', label: 'Light', icon: Sun },
              { value: 'dark', label: 'Dark', icon: Moon },
              { value: 'system', label: 'System', icon: Monitor },
            ].map(({ value, label, icon: Icon }) => (
              <label key={value} className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="theme"
                  value={value}
                  checked={prefs.theme === value}
                  onChange={(e) => setPrefs({ ...prefs, theme: e.target.value as 'light' | 'dark' | 'system' })}
                  className="h-4 w-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                />
                <Icon className="h-5 w-5 text-gray-500" />
                <span className="text-sm font-medium text-gray-900">{label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Notifications */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            <Bell className="h-5 w-5 inline mr-2" />
            Notifications
          </h3>
          <div className="space-y-3">
            {[
              { key: 'email', label: 'Email notifications' },
              { key: 'events', label: 'New events in your area' },
              { key: 'news', label: 'Local news updates' },
              { key: 'businessUpdates', label: 'Business directory updates' },
              { key: 'marketing', label: 'Marketing and promotional emails' },
            ].map(({ key, label }) => (
              <label key={key} className="flex items-center justify-between cursor-pointer">
                <span className="text-sm font-medium text-gray-800">{label}</span>
                <input
                  type="checkbox"
                  checked={prefs.notifications[key as keyof UserPreferences['notifications']]}
                  onChange={(e) => updateNotificationPref(key as keyof UserPreferences['notifications'], e.target.checked)}
                  className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
              </label>
            ))}
          </div>
        </div>

        {/* Privacy */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            <Eye className="h-5 w-5 inline mr-2" />
            Privacy
          </h3>
          <div className="space-y-3">
            {[
              { key: 'profileVisible', label: 'Make my profile visible to other users' },
              { key: 'contactInfoVisible', label: 'Show my contact information on listings' },
            ].map(({ key, label }) => (
              <label key={key} className="flex items-center justify-between cursor-pointer">
                <span className="text-sm font-medium text-gray-800">{label}</span>
                <input
                  type="checkbox"
                  checked={prefs.privacy[key as keyof UserPreferences['privacy']]}
                  onChange={(e) => updatePrivacyPref(key as keyof UserPreferences['privacy'], e.target.checked)}
                  className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
              </label>
            ))}
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Preferences
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

interface ClaimedBusiness {
  id: string;
  name: string;
  description: string;
  category: string;
  address: string;
  phone?: string;
  email?: string;
  website?: string;
  verified: boolean;
  isClaimed: boolean;
  claimedBy: string;
  claimedAt: string;
  subscriptionTier: string;
  subscriptionStatus: string;
}

// Business Tab Component
function BusinessTab({ userId: _userId }: { userId: string }) {
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [claimedBusinesses, setClaimedBusinesses] = useState<ClaimedBusiness[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadClaimedBusinesses();
  }, []);

  const loadClaimedBusinesses = async () => {
    setIsLoading(true);
    try {
  const response = await fetch('/api/user/businesses', { credentials: 'include' });
      
      if (response.ok) {
        const data = await response.json();
        setClaimedBusinesses(data.businesses || []);
      }
    } catch (error) {
      console.error('Failed to load claimed businesses:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (showRequestForm) {
    return (
      <div>
        <div className="mb-6">
          <Button 
            onClick={() => setShowRequestForm(false)}
            variant="outline"
            className="mb-4"
          >
            ← Back to Business Management
          </Button>
        </div>
        <BusinessRequestForm />
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-semibold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent mb-6">
        Business Management
      </h2>
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-primary-50 to-secondary-50 border border-primary-200 rounded-xl p-6">
          <h3 className="text-lg font-medium text-primary-900 mb-2">Add Your Business</h3>
          <p className="text-primary-800 mb-4">
            Get your business listed in our directory to reach more customers in Wetaskiwin.
          </p>
          <Button 
            className="bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 text-white shadow-md hover:shadow-lg transition-all duration-200"
            onClick={() => setShowRequestForm(true)}
          >
            <Building className="h-4 w-4 mr-2" />
            Request Business Listing
          </Button>
        </div>
        
        {/* Claimed businesses */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">My Businesses</h3>
          {isLoading ? (
            <div className="flex items-center space-x-2 text-gray-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Loading your businesses...</span>
            </div>
          ) : claimedBusinesses.length > 0 ? (
            <div className="space-y-4">
              {claimedBusinesses.map((business) => (
                <Card key={business.id} className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-semibold text-lg text-gray-900">{business.name}</h4>
                      <p className="text-gray-600 text-sm mb-2">{business.category}</p>
                      <p className="text-gray-700 text-sm mb-2">{business.description}</p>
                      <div className="flex items-center text-sm text-gray-500 space-x-4">
                        <span>📍 {business.address}</span>
                        {business.phone && <span>📞 {business.phone}</span>}
                        {business.verified && (
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">
                            ✓ Verified
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="ml-4 space-y-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          // Navigate to business management page
                          window.open(`/businesses?search=${encodeURIComponent(business.name)}`, '_blank');
                        }}
                        className="w-full"
                      >
                        View Listing
                      </Button>
                      <Button 
                        variant="primary" 
                        size="sm"
                        onClick={() => {
                          // Navigate to business management page
                          window.location.href = `/businesses/manage?id=${business.id}`;
                        }}
                        className="w-full"
                      >
                        Manage Listing
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-gray-600">No businesses claimed yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}

// Listings Tab Component
function ListingsTab({ userId: _userId }: { userId: string }) {
  const [activeListingTab, setActiveListingTab] = useState('classifieds');
  
  return (
    <div>
      <h2 className="text-xl font-semibold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent mb-6">
        My Listings
      </h2>
      
      {/* Sub-tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          {[
            { id: 'classifieds', label: 'Classified Ads', icon: Package },
            { id: 'jobs', label: 'Job Postings', icon: Briefcase },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveListingTab(tab.id)}
                className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeListingTab === tab.id
                    ? 'border-primary-500 text-primary-700'
                    : 'border-transparent text-gray-600 hover:text-gray-800'
                }`}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
      
      {activeListingTab === 'classifieds' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">Classified Ads</h3>
            <Button>
              <Package className="h-4 w-4 mr-2" />
              Post New Ad
            </Button>
          </div>
          <p className="text-gray-600">No classified ads posted yet.</p>
        </div>
      )}
      
      {activeListingTab === 'jobs' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">Job Postings</h3>
            <Button>
              <Briefcase className="h-4 w-4 mr-2" />
              Post New Job
            </Button>
          </div>
          <p className="text-gray-600">No job postings created yet.</p>
        </div>
      )}
    </div>
  );
}

// Security Tab Component
function SecurityTab({ 
  passwordForm, 
  onPasswordFormChange, 
  onChangePassword, 
  isSaving 
}: {
  passwordForm: { currentPassword: string; newPassword: string; confirmPassword: string };
  onPasswordFormChange: (form: { currentPassword: string; newPassword: string; confirmPassword: string }) => void;
  onChangePassword: () => void;
  isSaving: boolean;
}) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onChangePassword();
  };

  return (
    <div>
      <h2 className="text-xl font-semibold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent mb-6">
        Security Settings
      </h2>
      
      <div className="space-y-8">
        {/* Change Password */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Change Password</h3>
          <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
            <div>
              <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Current Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                <input
                  type="password"
                  id="currentPassword"
                  value={passwordForm.currentPassword}
                  onChange={(e) => onPasswordFormChange({ ...passwordForm, currentPassword: e.target.value })}
                  className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                <input
                  type="password"
                  id="newPassword"
                  value={passwordForm.newPassword}
                  onChange={(e) => onPasswordFormChange({ ...passwordForm, newPassword: e.target.value })}
                  className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                <input
                  type="password"
                  id="confirmPassword"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => onPasswordFormChange({ ...passwordForm, confirmPassword: e.target.value })}
                  className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                />
              </div>
            </div>
            
            <Button type="submit" disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Changing...
                </>
              ) : (
                'Change Password'
              )}
            </Button>
          </form>
        </div>
        
        {/* Two-Factor Authentication */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Two-Factor Authentication</h3>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <p className="text-sm text-gray-700 mb-3">
              Add an extra layer of security to your account by enabling two-factor authentication.
            </p>
            <Button variant="outline" disabled>
              <Shield className="h-4 w-4 mr-2" />
              Enable 2FA (Coming Soon)
            </Button>
          </div>
        </div>

        {/* Session Management */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Session Management</h3>
          <p className="text-sm text-gray-600 mb-3">Review and revoke active login sessions on your account.</p>
          {/* Lazy load to avoid SSR issues */}
          <SessionManagerWrapper />
        </div>
      </div>
    </div>
  );
}

// Dynamic import wrapper kept simple (no next/dynamic to minimize code changes)
import dynamic from 'next/dynamic'
const SessionManager = dynamic(() => import('@/components/SessionManager'), { ssr: false })
function SessionManagerWrapper() { return <SessionManager /> }
