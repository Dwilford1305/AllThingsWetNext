'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { AlertTriangle } from 'lucide-react';

const DevelopmentBanner = () => {
  const [viewportWidth, setViewportWidth] = useState(0);
  const pathname = usePathname();

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

  // Detect if device is likely a foldable in unfolded state (same logic as Navigation)
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

  // Only show on home page
  if (pathname !== '/') {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 bg-red-600 text-white px-4 py-3 z-50 border-b-2 border-red-700">
      <div className={`max-w-7xl mx-auto flex items-center justify-center ${
        isFoldableUnfolded() ? 'ml-24' : ''
      }`}>
        <div className="flex items-center space-x-2">
          <AlertTriangle className="h-5 w-5 flex-shrink-0 animate-pulse" />
          <span className="text-sm font-bold">
            🚧 DEVELOPMENT SITE - This is a beta version. Some features are disabled during testing. Contact{' '}
            <a 
              href="mailto:allthingswetaskiwin@gmail.com?subject=Banner Inquiry" 
              className="underline hover:no-underline font-semibold"
            >
              allthingswetaskiwin@gmail.com
            </a>
            {' '}for more information.
          </span>
        </div>
      </div>
    </div>
  );
};

export default DevelopmentBanner;
