'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AdPreview from './AdPreview';
import type { BusinessAd } from '@/types';

interface BusinessAdRotatorProps {
  tier: 'silver' | 'gold' | 'platinum';
  className?: string;
  rotationInterval?: number; // in milliseconds, default 15000 (15 seconds)
}

export const BusinessAdRotator = ({ 
  tier, 
  className = '', 
  rotationInterval = 15000 
}: BusinessAdRotatorProps) => {
  const [ads, setAds] = useState<BusinessAd[]>([]);
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch ads for the specific tier
  useEffect(() => {
    const fetchAds = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/businesses/ads?tier=${tier}`);
        const result = await response.json();
        
        if (result.success && result.data && result.data.length > 0) {
          // Filter active and visible ads
          const activeAds = result.data.filter((ad: BusinessAd) => ad.isActive && ad.isVisible);
          setAds(activeAds);
          setError(null);
        } else {
          setAds([]);
          setError(null); // No error if no ads, just empty state
        }
      } catch (error) {
        console.error('Error fetching ads:', error);
        setError('Failed to load ads');
        setAds([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAds();
  }, [tier]);

  // Rotation effect
  useEffect(() => {
    if (ads.length <= 1) return; // No need to rotate if 0 or 1 ad

    const interval = setInterval(() => {
      setCurrentAdIndex((prevIndex) => (prevIndex + 1) % ads.length);
    }, rotationInterval);

    return () => clearInterval(interval);
  }, [ads.length, rotationInterval]);

  // Loading state
  if (loading) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 ${className}`}>
        <div className="text-center p-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-600 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Loading {tier} ads...</p>
        </div>
      </div>
    );
  }

  // Error state - show placeholder instead of error for better UX
  if (error) {
    return (
      <div className={`flex items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 ${className}`}>
        <div className="text-center p-4">
          <p className="text-sm text-gray-500 capitalize">Sample {tier} ad space</p>
          <p className="text-xs text-gray-400 mt-1">Database not connected - showing placeholder</p>
        </div>
      </div>
    );
  }

  // No ads state
  if (ads.length === 0) {
    return (
      <div className={`flex items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 ${className}`}>
        <div className="text-center p-4">
          <p className="text-sm text-gray-500 capitalize">Sample {tier} ad space</p>
          <p className="text-xs text-gray-400 mt-1">Businesses can upgrade to display ads here</p>
        </div>
      </div>
    );
  }

  const currentAd = ads[currentAdIndex];

  return (
    <div className={`relative ${className}`}>
      <AnimatePresence mode="wait">
        <motion.div
          key={`${currentAd.id}-${currentAdIndex}`}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
          className="w-full"
        >
          <AdPreview ad={currentAd} className="w-full" />
        </motion.div>
      </AnimatePresence>
      
      {/* Rotation indicator */}
      {ads.length > 1 && (
        <div className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded flex items-center">
          <div className="flex space-x-1 mr-2">
            {ads.map((_, index) => (
              <div
                key={index}
                className={`w-1.5 h-1.5 rounded-full transition-colors duration-200 ${
                  index === currentAdIndex ? 'bg-white' : 'bg-white/40'
                }`}
              />
            ))}
          </div>
          <span>{currentAdIndex + 1}/{ads.length}</span>
        </div>
      )}
    </div>
  );
};