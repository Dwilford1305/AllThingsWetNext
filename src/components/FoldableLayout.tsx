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
    
    // Comprehensive foldable detection based on popular devices in market
    // Samsung Galaxy Z Fold series: Z Fold 6 (~768px), Z Fold 5 (~768px), Z Fold 4 (~768px)
    // Google Pixel Fold / Pixel 9 Pro Fold: ~673px
    // OnePlus Open: ~673px (similar to Pixel)
    // Honor Magic V2/V3: ~673px
    // Xiaomi Mix Fold series: ~748px
    // Huawei Mate X series: ~748px
    // Microsoft Surface Duo: ~720px (when both screens combined)
    // Motorola Razr+ (when unfolded): ~673px
    // Oppo Find N series: ~748px
    // Vivo X Fold series: ~748px
    
    const isDefinitelyFoldable = (
      (viewportWidth >= 670 && viewportWidth <= 678) || // Pixel Fold, OnePlus Open, Honor Magic V, Motorola Razr+
      (viewportWidth >= 685 && viewportWidth <= 695) || // Z Fold variants (your specific device)
      (viewportWidth >= 715 && viewportWidth <= 725) || // Surface Duo range
      (viewportWidth >= 745 && viewportWidth <= 755) || // Xiaomi Mix Fold, Huawei Mate X, Oppo Find N, Vivo X Fold
      (viewportWidth >= 760 && viewportWidth <= 780)    // Samsung Galaxy Z Fold series (768px)
    );
    
    // Debug logging for development
    if (process.env.NODE_ENV === 'development') {
      console.log('FoldableLayout detection:', { viewportWidth, isDefinitelyFoldable });
    }
    
    return isDefinitelyFoldable;
  };

  return (
    <div className={`min-h-screen transition-all duration-300 overflow-x-hidden w-full max-w-full box-border ${isFoldableUnfolded() ? 'pl-24' : ''}`}>
      {children}
    </div>
  );
};

export default FoldableLayout;
