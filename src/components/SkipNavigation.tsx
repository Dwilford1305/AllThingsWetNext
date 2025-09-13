'use client'

import { useState, useEffect } from 'react'

/**
 * Skip Navigation component for keyboard accessibility
 * Allows users to skip directly to main content
 */
const SkipNavigation = () => {
  const [isVisible, setIsVisible] = useState(false)

  const handleKeyDown = (event: KeyboardEvent) => {
    // Show skip link on first Tab press
    if (event.key === 'Tab' && !isVisible) {
      setIsVisible(true)
    }
  }

  const handleBlur = () => {
    // Hide skip link when not focused
    setIsVisible(false)
  }

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isVisible])

  return (
    <div className="sr-only focus-within:not-sr-only">
      <a
        href="#main-content"
        className={`
          fixed top-4 left-4 z-[9999] px-4 py-2 bg-blue-600 text-white 
          rounded-md font-medium transition-all duration-200 
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
          transform ${isVisible ? 'translate-y-0' : '-translate-y-full'}
          hover:bg-blue-700
        `}
        onFocus={() => setIsVisible(true)}
        onBlur={handleBlur}
      >
        Skip to main content
      </a>
      <a
        href="#navigation"
        className={`
          fixed top-16 left-4 z-[9999] px-4 py-2 bg-blue-600 text-white 
          rounded-md font-medium transition-all duration-200 
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
          transform ${isVisible ? 'translate-y-0' : '-translate-y-full'}
          hover:bg-blue-700
        `}
        onFocus={() => setIsVisible(true)}
        onBlur={handleBlur}
      >
        Skip to navigation
      </a>
    </div>
  )
}

export default SkipNavigation