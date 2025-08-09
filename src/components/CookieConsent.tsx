"use client";
import { useEffect, useState } from 'react';

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = localStorage.getItem('cookie_consent_v1');
    if (!stored) setVisible(true);
  }, []);

  const accept = () => {
  localStorage.setItem('cookie_consent_v1', 'accepted');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-lg shadow-lg rounded-lg bg-white border border-gray-200 p-4 animate-fade-in">
      <p className="text-sm text-gray-700">
        We use essential cookies for authentication/security (httpOnly) and limited analytics to improve your experience. By using the site you agree.{' '}
        <a href="/privacy-policy" className="underline text-blue-600">Learn more</a>.
      </p>
      <div className="mt-3 flex gap-2 justify-end">
        <button onClick={accept} className="px-3 py-1.5 text-sm font-medium bg-blue-600 text-white rounded hover:bg-blue-700">Accept</button>
      </div>
    </div>
  );
}
