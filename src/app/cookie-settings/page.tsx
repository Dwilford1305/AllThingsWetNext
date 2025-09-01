import CookieSettings from './CookieSettings';

export default function CookieSettingsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="px-6 py-8 sm:px-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                Cookie Settings
              </h1>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Manage your cookie preferences and learn about the different types of cookies we use 
                to enhance your experience on All Things Wetaskiwin.
              </p>
            </div>
            
            <CookieSettings />
          </div>
        </div>
      </div>
    </div>
  );
}