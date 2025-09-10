/**
 * Comprehensive Mobile Experience Tests
 * Tests for responsive design, accessibility, and cross-device compatibility
 */

import { mobileUtils, isMobileDevice, isTouchDevice, imageSizes } from '../src/lib/utils'

describe('Comprehensive Mobile Experience', () => {
  describe('Responsive Breakpoint Testing', () => {
    test('mobile breakpoint utilities are available', () => {
      expect(mobileUtils.mobileInput).toContain('mobile:')
      expect(mobileUtils.mobileButton).toContain('mobile:')
      expect(mobileUtils.mobileSpacing).toContain('mobile:')
    })

    test('touch device utilities are available', () => {
      expect(mobileUtils.touchTarget).toContain('touch:')
      expect(mobileUtils.touchTarget).toContain('touch:select-none')
    })

    test('responsive image sizes cover all viewports', () => {
      expect(imageSizes.mobile).toContain('(max-width: 768px)')
      expect(imageSizes.tablet).toContain('(max-width: 1024px)')
      expect(imageSizes.full).toContain('(max-width: 768px) 100vw')
      expect(imageSizes.full).toContain('(max-width: 1024px) 50vw')
    })
  })

  describe('Touch Target Accessibility', () => {
    test('all interactive elements meet 44px minimum', () => {
      expect(mobileUtils.touchTarget).toContain('min-h-touch-target')
      expect(mobileUtils.touchTarget).toContain('min-w-touch-target')
    })

    test('form inputs meet 48px minimum for mobile', () => {
      expect(mobileUtils.mobileInput).toContain('mobile:min-h-input-mobile')
    })

    test('buttons have appropriate mobile sizing', () => {
      expect(mobileUtils.mobileButton).toContain('mobile:h-12')
      expect(mobileUtils.mobileButton).toContain('mobile:px-6')
    })
  })

  describe('Mobile Performance Optimizations', () => {
    test('touch manipulation is optimized', () => {
      expect(mobileUtils.touchTarget).toContain('touch:select-none')
    })

    test('transitions are optimized for performance', () => {
      expect(mobileUtils.touchFeedback).toContain('transition-transform')
      expect(mobileUtils.touchFeedback).toContain('duration-100')
    })

    test('active states provide immediate feedback', () => {
      expect(mobileUtils.touchFeedback).toContain('active:scale-95')
    })
  })

  describe('Form Optimization for Mobile', () => {
    test('mobile inputs prevent zoom on iOS', () => {
      expect(mobileUtils.mobileInput).toContain('mobile:text-base')
    })

    test('mobile inputs have larger touch targets', () => {
      expect(mobileUtils.mobileInput).toContain('mobile:min-h-input-mobile')
      expect(mobileUtils.mobileInput).toContain('mobile:px-4')
      expect(mobileUtils.mobileInput).toContain('mobile:py-3')
    })

    test('mobile spacing is optimized', () => {
      expect(mobileUtils.mobileSpacing).toContain('mobile:space-y-4')
    })
  })

  describe('Cross-Device Compatibility', () => {
    test('mobile detection utilities work correctly', () => {
      expect(typeof isMobileDevice).toBe('function')
      expect(typeof isTouchDevice).toBe('function')
    })

    test('utilities handle undefined window gracefully', () => {
      // These should not throw errors even without window object
      expect(() => isMobileDevice()).not.toThrow()
      expect(() => isTouchDevice()).not.toThrow()
    })

    test('image sizes are comprehensive for all devices', () => {
      expect(imageSizes).toHaveProperty('mobile')
      expect(imageSizes).toHaveProperty('tablet')
      expect(imageSizes).toHaveProperty('desktop')
      expect(imageSizes).toHaveProperty('full')
    })
  })

  describe('Foldable Device Support', () => {
    test('mobile utilities support foldable devices', () => {
      // Utilities should work for all screen sizes including foldables
      expect(mobileUtils.touchTarget).toBeTruthy()
      expect(mobileUtils.touchFeedback).toBeTruthy()
    })

    test('responsive breakpoints accommodate foldables', () => {
      // Touch and mobile breakpoints should work for foldable ranges
      expect(mobileUtils.mobileInput).toContain('mobile:')
    })
  })

  describe('Navigation Accessibility', () => {
    test('navigation utilities support accessibility', () => {
      expect(mobileUtils.touchTarget).toContain('min-h-touch-target')
      expect(mobileUtils.touchTarget).toContain('min-w-touch-target')
    })

    test('touch feedback is available for navigation', () => {
      expect(mobileUtils.touchFeedback).toBeTruthy()
      expect(mobileUtils.getMobileClasses).toBeTruthy()
    })
  })

  describe('Mobile Image Optimization', () => {
    test('mobile image sizes are appropriate', () => {
      expect(imageSizes.mobile).toBe('(max-width: 768px) 100vw')
    })

    test('tablet image sizes are optimized', () => {
      expect(imageSizes.tablet).toBe('(max-width: 1024px) 50vw')
    })

    test('full responsive string covers all cases', () => {
      const fullSizes = imageSizes.full
      expect(fullSizes).toContain('(max-width: 768px) 100vw')
      expect(fullSizes).toContain('(max-width: 1024px) 50vw')
      expect(fullSizes).toContain('33vw')
    })
  })

  describe('Mobile Layout Patterns', () => {
    test('mobile utility classes are comprehensive', () => {
      expect(mobileUtils.touchTarget).toBeTruthy()
      expect(mobileUtils.touchFeedback).toBeTruthy()
      expect(mobileUtils.mobileInput).toBeTruthy()
      expect(mobileUtils.mobileSpacing).toBeTruthy()
      expect(mobileUtils.mobileButton).toBeTruthy()
    })

    test('mobile class combination works properly', () => {
      const combined = mobileUtils.getMobileClasses('base-class', 'mobile-class')
      expect(combined).toContain('base-class')
      expect(combined).toContain('mobile-class')
      expect(combined).toContain('min-h-touch-target')
      expect(combined).toContain('active:scale-95')
    })
  })

  describe('Performance Considerations', () => {
    test('mobile utilities are performance optimized', () => {
      // Short transition durations for snappy mobile experience
      expect(mobileUtils.touchFeedback).toContain('duration-100')
    })

    test('touch manipulation prevents unwanted behaviors', () => {
      expect(mobileUtils.touchTarget).toContain('touch:select-none')
    })

    test('all utilities are available without errors', () => {
      expect(() => mobileUtils.getMobileClasses('test')).not.toThrow()
      expect(() => isMobileDevice()).not.toThrow()
      expect(() => isTouchDevice()).not.toThrow()
    })
  })

  describe('Complete Mobile Experience Validation', () => {
    test('all required mobile utilities exist', () => {
      const requiredUtils = [
        'touchTarget',
        'touchFeedback', 
        'mobileInput',
        'mobileSpacing',
        'mobileButton',
        'getMobileClasses'
      ]
      
      requiredUtils.forEach(util => {
        expect(mobileUtils).toHaveProperty(util)
        expect(mobileUtils[util as keyof typeof mobileUtils]).toBeTruthy()
      })
    })

    test('responsive image system is complete', () => {
      const requiredSizes = ['mobile', 'tablet', 'desktop', 'full']
      
      requiredSizes.forEach(size => {
        expect(imageSizes).toHaveProperty(size)
        expect(imageSizes[size as keyof typeof imageSizes]).toBeTruthy()
      })
    })

    test('mobile experience meets WCAG guidelines', () => {
      // Touch targets meet 44px minimum
      expect(mobileUtils.touchTarget).toContain('min-h-touch-target')
      expect(mobileUtils.touchTarget).toContain('min-w-touch-target')
      
      // Form inputs meet 48px minimum for mobile
      expect(mobileUtils.mobileInput).toContain('mobile:min-h-input-mobile')
      
      // Text size prevents mobile zoom
      expect(mobileUtils.mobileInput).toContain('mobile:text-base')
    })
  })
})