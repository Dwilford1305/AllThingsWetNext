"use client";
import { useEffect, useState } from 'react';
import { X, Cookie, Settings } from 'lucide-react';

interface CookiePreferences {
  essential: boolean;
  analytics: boolean;
  functional: boolean;
  version: string;
}

const DEFAULT_PREFERENCES: CookiePreferences = {
  essential: true, // Always true, cannot be disabled
  analytics: false,
  functional: false,
  version: 'v2'
};

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>(DEFAULT_PREFERENCES);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const stored = localStorage.getItem('cookie_consent_v2');
    if (!stored) {
      setVisible(true);
      setPreferences(DEFAULT_PREFERENCES);
    } else {
      try {
        const storedPrefs = JSON.parse(stored);
        setPreferences(storedPrefs);
      } catch (_e) {
        // Invalid stored data, show consent again
        setVisible(true);
        setPreferences(DEFAULT_PREFERENCES);
      }
    }
  }, []);

  const savePreferences = (prefs: CookiePreferences) => {
    localStorage.setItem('cookie_consent_v2', JSON.stringify(prefs));
    setPreferences(prefs);
    setVisible(false);
    setShowSettings(false);
    
    // Fire custom event for analytics integration
    window.dispatchEvent(new CustomEvent('cookiePreferencesUpdated', { detail: prefs }));
  };

  const acceptAll = () => {
    const allAccepted = {
      essential: true,
      analytics: true,
      functional: true,
      version: 'v2'
    };
    savePreferences(allAccepted);
  };

  const acceptEssentialOnly = () => {
    const essentialOnly = {
      essential: true,
      analytics: false,
      functional: false,
      version: 'v2'
    };
    savePreferences(essentialOnly);
  };

  const handlePreferenceChange = (category: keyof Omit<CookiePreferences, 'version'>, value: boolean) => {
    if (category === 'essential') return; // Cannot change essential cookies
    
    setPreferences(prev => ({
      ...prev,
      [category]: value
    }));
  };

  const saveCustomPreferences = () => {
    savePreferences(preferences);
  };

  if (!visible) return null;

  return (
    <>
      {/* Main Cookie Banner */}
      {!showSettings && (
        <div 
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-2xl shadow-xl rounded-lg bg-white border border-gray-200 p-6 animate-fade-in"
          role="dialog"
          aria-labelledby="cookie-banner-title"
          aria-describedby="cookie-banner-description"
        >
          <div className="flex items-start gap-3">
            <Cookie className="h-6 w-6 text-blue-600 flex-shrink-0 mt-1" aria-hidden="true" />
            <div className="flex-1">
              <h3 id="cookie-banner-title" className="text-lg font-semibold text-gray-900 mb-2">
                Cookie Preferences
              </h3>
              <p id="cookie-banner-description" className="text-sm text-gray-700 mb-4">
                We use cookies to enhance your browsing experience and analyze site usage. 
                Essential cookies are required for site functionality, while optional cookies 
                help us improve our services. You can customize your preferences or learn more 
                in our{' '}
                <a href="/privacy-policy" className="underline text-blue-600 hover:text-blue-800">
                  Privacy Policy
                </a>.
              </p>
              
              <div className="flex flex-wrap gap-2 sm:gap-3">
                <button 
                  onClick={acceptAll}
                  className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  aria-describedby="accept-all-help"
                >
                  Accept All
                </button>
                <span id="accept-all-help" className="sr-only">Accept all cookies including analytics and functional cookies</span>
                
                <button 
                  onClick={acceptEssentialOnly}
                  className="px-4 py-2 text-sm font-medium bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                  aria-describedby="essential-only-help"
                >
                  Essential Only
                </button>
                <span id="essential-only-help" className="sr-only">Accept only essential cookies required for site functionality</span>
                
                <button 
                  onClick={() => setShowSettings(true)}
                  className="px-4 py-2 text-sm font-medium border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors flex items-center gap-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  aria-describedby="customize-help"
                >
                  <Settings className="h-4 w-4" aria-hidden="true" />
                  Customize
                </button>
                <span id="customize-help" className="sr-only">Customize individual cookie preferences</span>
              </div>
            </div>
            <button 
              onClick={() => setVisible(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1"
              aria-label="Close cookie banner"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {/* Cookie Settings Panel */}
      {showSettings && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <Cookie className="h-6 w-6 text-blue-600" />
                  Cookie Settings
                </h2>
                <button 
                  onClick={() => setShowSettings(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                  aria-label="Close settings"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Essential Cookies */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Essential Cookies</h3>
                      <p className="text-sm text-gray-600">Required for basic site functionality</p>
                    </div>
                    <div className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium">
                      Always Active
                    </div>
                  </div>
                  <p className="text-sm text-gray-700">
                    These cookies are necessary for the website to function properly. They enable core 
                    features like authentication, security, and session management. Essential cookies 
                    cannot be disabled.
                  </p>
                  <div className="mt-3 text-xs text-gray-500">
                    <strong>Examples:</strong> Session tokens, CSRF protection, authentication state
                  </div>
                </div>

                {/* Analytics Cookies */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Analytics Cookies</h3>
                      <p className="text-sm text-gray-600">Help us understand how you use our site</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences.analytics}
                        onChange={(e) => handlePreferenceChange('analytics', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  <p className="text-sm text-gray-700">
                    These cookies collect information about how visitors use our website, such as 
                    which pages are visited most often. This data helps us improve the website 
                    and user experience.
                  </p>
                  <div className="mt-3 text-xs text-gray-500">
                    <strong>Examples:</strong> Page views, session duration, traffic sources, user behavior patterns
                  </div>
                </div>

                {/* Functional Cookies */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Functional Cookies</h3>
                      <p className="text-sm text-gray-600">Enhance your experience with personalized features</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences.functional}
                        onChange={(e) => handlePreferenceChange('functional', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  <p className="text-sm text-gray-700">
                    These cookies remember your preferences and settings to provide enhanced, 
                    personalized features. They improve your experience but are not essential 
                    for basic functionality.
                  </p>
                  <div className="mt-3 text-xs text-gray-500">
                    <strong>Examples:</strong> Language preferences, theme settings, saved filters, user interface customizations
                  </div>
                </div>
              </div>

              <div className="mt-8 flex flex-wrap gap-3 justify-end">
                <button 
                  onClick={() => setShowSettings(false)}
                  className="px-4 py-2 text-sm font-medium border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={saveCustomPreferences}
                  className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Save Preferences
                </button>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200 text-xs text-gray-500 text-center">
                You can change these preferences at any time by accessing Cookie Settings in our footer 
                or through your browser settings. For more information, see our{' '}
                <a href="/privacy-policy" className="underline text-blue-600 hover:text-blue-800">
                  Privacy Policy
                </a>.
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
