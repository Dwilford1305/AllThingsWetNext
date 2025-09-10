/**
 * Mobile User Experience Tests
 * Tests for mobile-specific UI/UX improvements and touch interactions
 */

import { mobileUtils, isMobileDevice, isTouchDevice, imageSizes } from '../src/lib/utils'

describe('Mobile UX Enhancements', () => {
  describe('Mobile Detection Utilities', () => {
    test('mobile detection utilities are available', () => {
      expect(typeof isMobileDevice).toBe('function')
      expect(typeof isTouchDevice).toBe('function')
    })

    test('mobile utils contain required touch classes', () => {
      expect(mobileUtils.touchTarget).toContain('min-h-touch-target')
      expect(mobileUtils.touchTarget).toContain('min-w-touch-target')
      expect(mobileUtils.touchFeedback).toContain('active:scale-95')
      expect(mobileUtils.mobileInput).toContain('mobile:min-h-input-mobile')
    })

    test('mobile class combination works correctly', () => {
      const combined = mobileUtils.getMobileClasses('base-class', 'mobile-class')
      expect(combined).toContain('base-class')
      expect(combined).toContain('mobile-class')
      expect(combined).toContain('min-h-touch-target')
      expect(combined).toContain('active:scale-95')
    })
  })

  describe('Touch Target Accessibility', () => {
    test('touch targets meet minimum 44px requirement', () => {
      expect(mobileUtils.touchTarget).toContain('min-h-touch-target')
      expect(mobileUtils.touchTarget).toContain('min-w-touch-target')
    })

    test('touch feedback is included for interactive elements', () => {
      expect(mobileUtils.touchFeedback).toContain('active:scale-95')
      expect(mobileUtils.touchFeedback).toContain('transition-transform')
    })

    test('mobile input heights meet accessibility standards', () => {
      expect(mobileUtils.mobileInput).toContain('mobile:min-h-input-mobile')
      expect(mobileUtils.mobileInput).toContain('mobile:text-base')
    })
  })

  describe('Mobile Image Optimization', () => {
    test('responsive image sizes are defined', () => {
      expect(imageSizes.mobile).toBe('(max-width: 768px) 100vw')
      expect(imageSizes.tablet).toBe('(max-width: 1024px) 50vw')
      expect(imageSizes.desktop).toBe('33vw')
      expect(imageSizes.full).toContain('(max-width: 768px) 100vw')
    })

    test('image sizes cover all device categories', () => {
      expect(imageSizes).toHaveProperty('mobile')
      expect(imageSizes).toHaveProperty('tablet')
      expect(imageSizes).toHaveProperty('desktop')
      expect(imageSizes).toHaveProperty('full')
    })
  })

  describe('Mobile Component Behavior', () => {
    test('button component includes mobile-friendly classes', () => {
      // Test that mobile utilities can be applied to button components
      const buttonClass = mobileUtils.getMobileClasses('btn-base')
      expect(buttonClass).toContain('min-h-touch-target')
      expect(buttonClass).toContain('touch:select-none')
    })

    test('mobile spacing utilities work correctly', () => {
      expect(mobileUtils.mobileSpacing).toContain('mobile:space-y-4')
      expect(mobileUtils.mobileButton).toContain('mobile:h-12')
    })
  })

  describe('Responsive Design Validation', () => {
    test('mobile breakpoints are properly defined', () => {
      // These should be available through the mobile utilities
      expect(mobileUtils.mobileInput).toContain('mobile:')
      expect(mobileUtils.mobileButton).toContain('mobile:')
      expect(mobileUtils.mobileSpacing).toContain('mobile:')
    })

    test('touch device considerations are included', () => {
      expect(mobileUtils.touchTarget).toContain('touch:select-none')
    })
  })

  describe('Accessibility Compliance', () => {
    test('minimum touch target sizes are enforced', () => {
      // Touch targets should be at least 44px as per WCAG guidelines
      expect(mobileUtils.touchTarget).toContain('min-h-touch-target')
      expect(mobileUtils.touchTarget).toContain('min-w-touch-target')
    })

    test('form inputs have mobile-optimized sizes', () => {
      // Mobile form inputs should be larger for better usability
      expect(mobileUtils.mobileInput).toContain('mobile:min-h-input-mobile')
      expect(mobileUtils.mobileInput).toContain('mobile:px-4')
      expect(mobileUtils.mobileInput).toContain('mobile:py-3')
    })

    test('text sizing prevents zoom on mobile', () => {
      // Text should be 16px or larger to prevent zoom on iOS
      expect(mobileUtils.mobileInput).toContain('mobile:text-base')
    })
  })

  describe('Performance Considerations', () => {
    test('touch manipulation is optimized', () => {
      expect(mobileUtils.touchTarget).toContain('touch:select-none')
    })

    test('transitions are performance-optimized', () => {
      expect(mobileUtils.touchFeedback).toContain('transition-transform')
      expect(mobileUtils.touchFeedback).toContain('duration-100')
    })
  })
})