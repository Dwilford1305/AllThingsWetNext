'use client'

import { useEffect, useState } from 'react'
import { isMobileDevice, isTouchDevice } from '@/lib/utils'

interface MobilePerformanceProviderProps {
  children: React.ReactNode
}

/**
 * Mobile Performance Provider
 * Applies mobile-specific optimizations and configurations
 */
export function MobilePerformanceProvider({ children }: MobilePerformanceProviderProps) {
  const [isMobile, setIsMobile] = useState(false)
  const [isTouch, setIsTouch] = useState(false)

  useEffect(() => {
    // Detect mobile and touch devices
    setIsMobile(isMobileDevice())
    setIsTouch(isTouchDevice())

    // Apply mobile-specific optimizations
    if (typeof window !== 'undefined') {
      // Disable hover effects on touch devices to prevent sticky hover states
      if (isTouchDevice()) {
        document.documentElement.classList.add('touch-device')
      }

      // Prevent zoom on double-tap for better UX
      if (isMobileDevice()) {
        document.documentElement.classList.add('mobile-device')
        
        // Disable touch zoom on specific elements
        const meta = document.createElement('meta')
        meta.name = 'viewport'
        meta.content = 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover'
        
        // Only apply no-zoom if not already set
        const existingMeta = document.querySelector('meta[name="viewport"]')
        if (existingMeta && !existingMeta.getAttribute('content')?.includes('user-scalable=no')) {
          existingMeta.setAttribute('content', meta.content)
        }
      }

      // Optimize scroll performance on mobile
      if (isMobileDevice()) {
        // Use passive event listeners for better scroll performance
        const options = { passive: true }
        
        // Add smooth scrolling optimization
        document.documentElement.style.scrollBehavior = 'smooth'
        
        // Optimize touch scrolling
        ;(document.body.style as any).webkitOverflowScrolling = 'touch'
        document.body.style.overscrollBehavior = 'contain'
      }

      // Prefetch critical resources on mobile
      if (isMobileDevice()) {
        // Preload critical fonts
        const fontLink = document.createElement('link')
        fontLink.rel = 'preload'
        fontLink.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap'
        fontLink.as = 'style'
        document.head.appendChild(fontLink)
      }
    }
  }, [])

  return (
    <div 
      className={`mobile-performance-wrapper ${isMobile ? 'is-mobile' : ''} ${isTouch ? 'is-touch' : ''}`}
      style={{
        // Optimize rendering performance
        willChange: isMobile ? 'transform' : 'auto',
        // Improve paint performance
        contain: isMobile ? 'layout style paint' : 'none',
      }}
    >
      {children}
    </div>
  )
}

/**
 * Mobile Loading Skeleton
 * Optimized loading component for mobile devices
 */
export function MobileLoadingSkeleton({ 
  lines = 3, 
  className = '',
  height = 'h-4'
}: { 
  lines?: number
  className?: string
  height?: string 
}) {
  return (
    <div className={`animate-pulse space-y-3 ${className}`}>
      {Array.from({ length: lines }, (_, i) => (
        <div 
          key={i}
          className={`bg-gray-200 rounded mobile:rounded-lg ${height} ${
            i === lines - 1 ? 'w-3/4' : 'w-full'
          }`}
        />
      ))}
    </div>
  )
}

/**
 * Mobile Optimized Spinner
 * Performance-optimized loading spinner for mobile
 */
export function MobileSpinner({ 
  size = 'md',
  className = ''
}: {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}) {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2 mobile:w-8 mobile:h-8',
    lg: 'w-8 h-8 border-4 mobile:w-10 mobile:h-10'
  }

  return (
    <div 
      className={`${sizeClasses[size]} border-gray-300 border-t-blue-600 rounded-full animate-spin ${className}`}
      style={{
        // Optimize animation performance
        willChange: 'transform',
        backfaceVisibility: 'hidden',
        perspective: 1000,
      }}
    />
  )
}

/**
 * Mobile Performance Metrics Hook
 * Provides performance metrics and mobile-specific optimizations
 */
export function useMobilePerformance() {
  const [metrics, setMetrics] = useState({
    isMobile: false,
    isTouch: false,
    isSlowConnection: false,
    prefersReducedMotion: false
  })

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const updateMetrics = () => {
        setMetrics({
          isMobile: isMobileDevice(),
          isTouch: isTouchDevice(),
          isSlowConnection: (navigator as any).connection ? 
            ((navigator as any).connection.effectiveType === '2g' || 
             (navigator as any).connection.effectiveType === 'slow-2g') : false,
          prefersReducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches
        })
      }

      updateMetrics()

      // Listen for connection changes
      if ((navigator as any).connection) {
        ((navigator as any).connection).addEventListener('change', updateMetrics)
      }

      // Listen for motion preference changes
      const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
      motionQuery.addEventListener('change', updateMetrics)

      return () => {
        if ((navigator as any).connection) {
          ((navigator as any).connection).removeEventListener('change', updateMetrics)
        }
        motionQuery.removeEventListener('change', updateMetrics)
      }
    }
  }, [])

  return metrics
}

/**
 * Mobile Intersection Observer Hook
 * Optimized for mobile performance with mobile-specific options
 */
export function useMobileIntersectionObserver(
  elementRef: React.RefObject<Element>,
  options?: IntersectionObserverInit
) {
  const [isIntersecting, setIsIntersecting] = useState(false)
  const [hasIntersected, setHasIntersected] = useState(false)

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    // Mobile-optimized intersection observer options
    const mobileOptions: IntersectionObserverInit = {
      threshold: isMobileDevice() ? 0.1 : 0.3, // Lower threshold for mobile
      rootMargin: isMobileDevice() ? '50px' : '20px', // Larger margin for mobile
      ...options
    }

    const observer = new IntersectionObserver(([entry]) => {
      const isCurrentlyIntersecting = entry.isIntersecting
      setIsIntersecting(isCurrentlyIntersecting)
      
      if (isCurrentlyIntersecting && !hasIntersected) {
        setHasIntersected(true)
      }
    }, mobileOptions)

    observer.observe(element)

    return () => observer.disconnect()
  }, [elementRef, options, hasIntersected])

  return { isIntersecting, hasIntersected }
}