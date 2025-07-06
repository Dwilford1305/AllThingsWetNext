'use client'

import { motion } from 'framer-motion'
import { ExternalLink, Zap } from 'lucide-react'

interface AdPlaceholderProps {
  type: 'google' | 'silver' | 'gold' | 'platinum'
  size?: 'banner' | 'square' | 'leaderboard' | 'sidebar' | 'large'
  className?: string
  title?: string
}

const AdPlaceholder = ({ 
  type, 
  size = 'banner', 
  className = '', 
  title 
}: AdPlaceholderProps) => {
  const getSizeClasses = () => {
    switch (size) {
      case 'leaderboard':
        return 'h-12 sm:h-16 lg:h-20'
      case 'large':
        return 'h-32 sm:h-36 lg:h-40'
      case 'square':
        return 'h-24 sm:h-28 lg:h-32'
      case 'sidebar':
        return 'h-40 sm:h-48 lg:h-56'
      case 'banner':
      default:
        return 'h-16 sm:h-20 lg:h-24'
    }
  }

  const getContent = () => {
    switch (type) {
      case 'google':
        return {
          bgColor: 'bg-gradient-to-br from-blue-50 to-gray-100',
          borderColor: 'border-gray-200',
          textColor: 'text-gray-600',
          icon: ExternalLink,
          label: 'Advertisement',
          subtitle: 'Google AdSense'
        }
      case 'silver':
        return {
          bgColor: 'bg-gradient-to-br from-slate-50 to-gray-100',
          borderColor: 'border-slate-300',
          textColor: 'text-slate-700',
          icon: Zap,
          label: 'Enhanced Listing',
          subtitle: 'Silver Member • $19.99/mo'
        }
      case 'gold':
        return {
          bgColor: 'bg-gradient-to-br from-yellow-50 to-orange-100',
          borderColor: 'border-yellow-300',
          textColor: 'text-yellow-700',
          icon: Zap,
          label: 'Featured Placement',
          subtitle: 'Gold Member • $39.99/mo'
        }
      case 'platinum':
        return {
          bgColor: 'bg-gradient-to-br from-purple-50 to-blue-100',
          borderColor: 'border-purple-300',
          textColor: 'text-purple-700',
          icon: Zap,
          label: 'Premium Spotlight',
          subtitle: 'Platinum Member • $79.99/mo'
        }
      default:
        return {
          bgColor: 'bg-gray-100',
          borderColor: 'border-gray-200',
          textColor: 'text-gray-600',
          icon: ExternalLink,
          label: 'Advertisement',
          subtitle: 'Sponsored Content'
        }
    }
  }

  const content = getContent()
  const IconComponent = content.icon

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      viewport={{ once: true, amount: 0.1, margin: "0px 0px -100px 0px" }}
      className={`${content.bgColor} ${content.borderColor} ${getSizeClasses()} border-2 border-dashed rounded-lg flex flex-col items-center justify-center p-2 sm:p-3 lg:p-4 ${className}`}
    >
      <IconComponent className={`h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 xl:h-8 xl:w-8 ${content.textColor} mb-1 sm:mb-2`} />
      <div className={`text-xs sm:text-sm lg:text-base font-semibold ${content.textColor} text-center leading-tight`}>
        {title || content.label}
      </div>
      <div className={`text-xs ${content.textColor} opacity-75 text-center`}>
        {content.subtitle}
      </div>
      {type === 'google' && (
        <div className="text-xs text-gray-400 mt-1 hidden lg:block">
          728x90 • 320x50 (Mobile)
        </div>
      )}
    </motion.div>
  )
}

export default AdPlaceholder
