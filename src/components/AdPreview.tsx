'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import { BusinessAd } from '@/types'

interface AdPreviewProps {
  ad: BusinessAd
  className?: string
}

const AdPreview = ({ ad, className = '' }: AdPreviewProps) => {
  const { tier, photo, logo, businessName, adSize } = ad

  const getTierStyle = () => {
    switch (tier) {
      case 'silver':
        return {
          bgColor: 'bg-gradient-to-br from-slate-100 to-slate-200',
          borderColor: 'border-slate-300',
          textColor: 'text-slate-800',
          accentColor: 'text-slate-600'
        }
      case 'gold':
        return {
          bgColor: 'bg-gradient-to-br from-yellow-50 to-yellow-100',
          borderColor: 'border-yellow-300',
          textColor: 'text-yellow-900',
          accentColor: 'text-yellow-700'
        }
      case 'platinum':
        return {
          bgColor: 'bg-gradient-to-br from-purple-50 to-purple-100',
          borderColor: 'border-purple-300',
          textColor: 'text-purple-900',
          accentColor: 'text-purple-700'
        }
      default:
        return {
          bgColor: 'bg-gray-100',
          borderColor: 'border-gray-300',
          textColor: 'text-gray-800',
          accentColor: 'text-gray-600'
        }
    }
  }

  const style = getTierStyle()

  // Responsive sizing based on ad dimensions
  const getResponsiveClasses = () => {
    if (tier === 'gold') {
      // Leaderboard - wide and short
      return 'w-full h-16 sm:h-20 lg:h-24'
    } else if (tier === 'silver') {
      // Medium rectangle - square-ish
      return 'w-64 h-48 sm:w-72 sm:h-52'
    } else {
      // Platinum - large rectangle
      return 'w-64 h-56 sm:w-80 sm:h-64'
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={`${style.bgColor} ${style.borderColor} ${getResponsiveClasses()} border-2 rounded-lg overflow-hidden shadow-lg ${className}`}
      style={{ maxWidth: `${adSize.width}px`, maxHeight: `${adSize.height}px` }}
    >
      <div className="relative w-full h-full p-2 sm:p-3">
        {/* Photo Background */}
        {photo && (
          <div className="absolute inset-2 sm:inset-3 rounded overflow-hidden bg-gray-200">
            <Image
              src={photo}
              alt={businessName}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 300px, 400px"
              onError={(e) => {
                // Handle broken images by hiding the image element
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                // Show a placeholder background
                const parent = target.parentElement;
                if (parent) {
                  parent.className += ' bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center';
                  parent.innerHTML = `<div class="text-gray-500 text-center p-2"><div class="text-2xl mb-1">🏢</div><div class="text-xs">${businessName}</div></div>`;
                }
              }}
            />
            {/* Overlay for text readability */}
            <div className="absolute inset-0 bg-black bg-opacity-20" />
          </div>
        )}

        {/* Content Overlay */}
        <div className="relative z-10 h-full flex flex-col justify-between">
          {/* Logo (Platinum only) */}
          {tier === 'platinum' && logo && (
            <div className="flex justify-end">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white rounded-full p-1.5 shadow-md">
                <Image
                  src={logo}
                  alt={`${businessName} logo`}
                  width={64}
                  height={64}
                  className="w-full h-full object-contain rounded-full"
                />
              </div>
            </div>
          )}

          {/* Business Name */}
          <div className="bg-white bg-opacity-90 rounded px-2 py-1 shadow-sm">
            <h3 className={`${style.textColor} font-bold text-xs sm:text-sm text-center truncate`}>
              {businessName}
            </h3>
            {tier !== 'silver' && (
              <p className={`${style.accentColor} text-xs text-center capitalize`}>
                {tier} Member
              </p>
            )}
          </div>
        </div>

        {/* Tier Badge */}
        <div className="absolute top-1 left-1 sm:top-2 sm:left-2">
          <span className={`${style.bgColor} ${style.borderColor} ${style.textColor} text-xs px-1 py-0.5 rounded border font-medium shadow-sm`}>
            {tier.toUpperCase()}
          </span>
        </div>
      </div>
    </motion.div>
  )
}

export default AdPreview