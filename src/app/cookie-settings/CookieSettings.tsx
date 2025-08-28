"use client";
import { useEffect, useState } from 'react';
import { Cookie, Check, RefreshCw } from 'lucide-react';

interface CookiePreferences {
  essential: boolean;
  analytics: boolean;
  functional: boolean;
  version: string;
}

const DEFAULT_PREFERENCES: CookiePreferences = {
  essential: true,
  analytics: false,
  functional: false,
  version: 'v2'
};

export default function CookieSettings() {
  const [preferences, setPreferences] = useState<CookiePreferences>(DEFAULT_PREFERENCES);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const stored = localStorage.getItem('cookie_consent_v2');
    if (stored) {
      try {
        const storedPrefs = JSON.parse(stored);
        setPreferences(storedPrefs);
      } catch (_e) {
        console.error('Error parsing stored cookie preferences:', _e);
        setPreferences(DEFAULT_PREFERENCES);
      }
    }
  }, []);

  const handlePreferenceChange = (category: keyof Omit<CookiePreferences, 'version'>, value: boolean) => {
    if (category === 'essential') return; // Cannot change essential cookies
    
    setPreferences(prev => ({
      ...prev,
      [category]: value
    }));
    setSaved(false);
  };

  const savePreferences = async () => {
    setLoading(true);
    
    // Simulate a brief loading state for better UX
    await new Promise(resolve => setTimeout(resolve, 500));
    
    localStorage.setItem('cookie_consent_v2', JSON.stringify(preferences));
    
    // Fire custom event for analytics integration
    window.dispatchEvent(new CustomEvent('cookiePreferencesUpdated', { detail: preferences }));
    
    setSaved(true);
    setLoading(false);
    
    // Auto-hide success message after 3 seconds
    setTimeout(() => setSaved(false), 3000);
  };

  const resetToDefaults = () => {
    setPreferences(DEFAULT_PREFERENCES);
    setSaved(false);
  };

  return (
    <div className="space-y-6">
      {/* Success Message */}
      {saved && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4 flex items-center gap-3">
          <Check className="h-5 w-5 text-green-600 flex-shrink-0" />
          <div className="text-sm text-green-800">
            Your cookie preferences have been saved successfully!
          </div>
        </div>
      )}

      {/* Cookie Categories */}
      <div className="space-y-6">
        {/* Essential Cookies */}
        <div className="border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <Cookie className="h-5 w-5 text-blue-600" />
                Essential Cookies
              </h3>
              <p className="text-sm text-gray-600 mt-1">Required for basic site functionality</p>
            </div>
            <div className="bg-green-100 text-green-800 text-sm px-3 py-1 rounded-full font-medium">
              Always Active
            </div>
          </div>
          
          <p className="text-gray-700 mb-4">
            These cookies are necessary for the website to function properly. They enable core 
            features like user authentication, security protection, session management, and form submissions. 
            Essential cookies cannot be disabled as they are required for the basic operation of our website.
          </p>
          
          <div className="bg-gray-50 rounded-md p-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">What these cookies do:</h4>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• Maintain your login session securely</li>
              <li>• Protect against cross-site request forgery (CSRF) attacks</li>
              <li>• Remember your authentication state</li>
              <li>• Store temporarily necessary form data</li>
              <li>• Enable secure communication with our servers</li>
            </ul>
          </div>
        </div>

        {/* Analytics Cookies */}
        <div className="border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Analytics Cookies</h3>
              <p className="text-sm text-gray-600 mt-1">Help us understand how you use our site</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.analytics}
                onChange={(e) => handlePreferenceChange('analytics', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-12 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
          
          <p className="text-gray-700 mb-4">
            These cookies collect anonymized information about how visitors interact with our website. 
            This data helps us understand user behavior, identify popular content, and make informed 
            decisions about improving our website and user experience.
          </p>
          
          <div className="bg-gray-50 rounded-md p-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">What these cookies track:</h4>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• Pages visited and time spent on each page</li>
              <li>• Traffic sources and referral websites</li>
              <li>• Device and browser information (anonymized)</li>
              <li>• User journey and navigation patterns</li>
              <li>• Popular content and search queries</li>
            </ul>
            <p className="text-xs text-gray-500 mt-3">
              <strong>Note:</strong> All analytics data is collected anonymously and cannot be used to identify individual users.
            </p>
          </div>
        </div>

        {/* Functional Cookies */}
        <div className="border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Functional Cookies</h3>
              <p className="text-sm text-gray-600 mt-1">Enhance your experience with personalized features</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.functional}
                onChange={(e) => handlePreferenceChange('functional', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-12 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
          
          <p className="text-gray-700 mb-4">
            These cookies remember your preferences and settings to provide a more personalized 
            and convenient experience. They enhance functionality but are not essential for basic 
            website operation. You can disable these cookies without affecting core features.
          </p>
          
          <div className="bg-gray-50 rounded-md p-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">What these cookies remember:</h4>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• Your preferred language and region settings</li>
              <li>• Theme preferences (light/dark mode)</li>
              <li>• Saved search filters and sorting preferences</li>
              <li>• User interface customizations</li>
              <li>• Recently viewed items or pages</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-4 justify-between items-center pt-6 border-t border-gray-200">
        <button
          onClick={resetToDefaults}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          Reset to Defaults
        </button>
        
        <button
          onClick={savePreferences}
          disabled={loading || saved}
          className="flex items-center gap-2 px-6 py-2 text-sm font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-400 transition-colors"
        >
          {loading ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : saved ? (
            <Check className="h-4 w-4" />
          ) : null}
          {loading ? 'Saving...' : saved ? 'Saved!' : 'Save Preferences'}
        </button>
      </div>

      {/* Additional Information */}
      <div className="bg-blue-50 rounded-lg p-6 mt-8">
        <h3 className="text-lg font-medium text-blue-900 mb-3">Additional Information</h3>
        <div className="text-sm text-blue-800 space-y-2">
          <p>
            <strong>Browser Settings:</strong> You can also manage cookies through your browser settings. 
            Note that disabling cookies may affect website functionality.
          </p>
          <p>
            <strong>Updates:</strong> We may update our cookie practices from time to time. 
            Any changes will be reflected in our Privacy Policy.
          </p>
          <p>
            <strong>Questions:</strong> If you have questions about our cookie usage, please contact us at{' '}
            <a href="mailto:allthingswetaskiwin@gmail.com" className="underline text-blue-900 font-medium">
              allthingswetaskiwin@gmail.com
            </a>.
          </p>
        </div>
      </div>

      {/* Privacy Policy Link */}
      <div className="text-center pt-6 border-t border-gray-200">
        <p className="text-sm text-gray-600">
          For more details about how we handle your data, please read our{' '}
          <a href="/privacy-policy" className="text-blue-600 hover:text-blue-800 underline font-medium">
            Privacy Policy
          </a>{' '}
          and{' '}
          <a href="/terms-of-service" className="text-blue-600 hover:text-blue-800 underline font-medium">
            Terms of Service
          </a>.
        </p>
      </div>
    </div>
  );
}