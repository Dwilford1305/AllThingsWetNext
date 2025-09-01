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
    
    // Primary detection based on known foldable widths
    const isDefinitelyFoldable = (
      (viewportWidth >= 650 && viewportWidth <= 690) || // Pixel Fold, OnePlus Open, Honor Magic V, Motorola Razr+ (expanded range)
      (viewportWidth >= 715 && viewportWidth <= 735) || // Surface Duo range (expanded)
      (viewportWidth >= 740 && viewportWidth <= 785) || // Samsung Z Fold series, Xiaomi, Huawei (expanded)
      (viewportWidth >= 840 && viewportWidth <= 860)    // Pixel 9 Pro Fold (851px)
    );
    
    // Secondary detection: aspect ratio-based for unfolded devices
    // Foldables typically have wide aspect ratios when unfolded
    const aspectRatioDetection = () => {
      if (typeof window === 'undefined') return false;
      const aspectRatio = window.innerWidth / window.innerHeight;
      // Adjusted for Pixel 9 Pro Fold (1.21 ratio) and other foldables
      return aspectRatio > 1.15 && aspectRatio < 2.1 && viewportWidth >= 640 && viewportWidth <= 900;
    };
    
    const isFoldable = isDefinitelyFoldable || aspectRatioDetection();
    
    // Debug logging for development - always show for now to help identify your device
    console.log('FoldableLayout detection:', { 
      viewportWidth, 
      aspectRatio: typeof window !== 'undefined' ? (window.innerWidth / window.innerHeight).toFixed(2) : 'N/A',
      isDefinitelyFoldable, 
      aspectRatioDetection: aspectRatioDetection(),
      finalResult: isFoldable 
    });
    
    return isFoldable;
  };

  return (
    <div className={`min-h-screen w-full max-w-full box-border pt-12 ${isFoldableUnfolded() && viewportWidth > 480 ? 'pl-24' : ''}`}>
      {children}
    </div>
  );
};

export default FoldableLayout;
