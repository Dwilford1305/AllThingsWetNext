'use client';

import { useState, useEffect } from 'react';

// Custom hook to detect if device is likely a foldable in unfolded state
function useIsFoldableUnfolded() {
  const [viewportWidth, setViewportWidth] = useState(0);
  const [isFoldable, setIsFoldable] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setViewportWidth(width);

      // Primary detection based on known foldable widths
      const isDefinitelyFoldable =
        (width >= 650 && width <= 690) || // Pixel Fold, OnePlus Open, Honor Magic V, Motorola Razr+ (expanded range)
        (width >= 715 && width <= 735) || // Surface Duo range (expanded)
        (width >= 740 && width <= 785) || // Samsung Z Fold series, Xiaomi, Huawei (expanded)
        (width >= 840 && width <= 860);   // Pixel 9 Pro Fold (851px)

      // Secondary detection: aspect ratio-based for unfolded devices
      // Foldables typically have wide aspect ratios when unfolded
      const aspectRatio = window.innerWidth / window.innerHeight;
      // Adjusted for Pixel 9 Pro Fold (1.21 ratio) and other foldables
      const aspectRatioDetection =
        aspectRatio > 1.15 && aspectRatio < 2.1 && width >= 640 && width <= 900;

      setIsFoldable(isDefinitelyFoldable || aspectRatioDetection);
    };

    // Set initial viewport width and foldable state
    if (typeof window !== 'undefined') {
      handleResize();
      setTimeout(handleResize, 100);
      window.addEventListener('resize', handleResize);
      window.addEventListener('orientationchange', handleResize);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('orientationchange', handleResize);
      }
    };
  }, []);

  return { isFoldableUnfolded: isFoldable, viewportWidth };
}

export default useIsFoldableUnfolded;