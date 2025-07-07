'use client';

import { useState, useEffect } from 'react';

interface FoldableLayoutProps {
  children: React.ReactNode;
}

const FoldableLayout = ({ children }: FoldableLayoutProps) => {
  const [viewportWidth, setViewportWidth] = useState(0);

  useEffect(() => {
    const handleResize = () => {
      setViewportWidth(window.innerWidth);
    };

    // Set initial viewport width
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
    // Be more specific about foldable detection
    // Pro Fold unfolded: ~673px, Z Fold inner: ~768px but less than tablets
    return viewportWidth >= 673 && viewportWidth <= 820;
  };

  return (
    <div className={`min-h-screen transition-all duration-300 ${isFoldableUnfolded() ? 'pl-20' : ''}`}>
      {children}
    </div>
  );
};

export default FoldableLayout;
