# Accessibility Testing Guide

This guide outlines the accessibility testing procedures and standards for All Things Wetaskiwin platform to ensure WCAG 2.1 AA compliance.

## Overview

The platform follows Web Content Accessibility Guidelines (WCAG) 2.1 Level AA standards to provide an inclusive experience for all users, including those with disabilities.

## Automated Testing

### 1. Jest Accessibility Tests

Run the comprehensive accessibility test suite:

```bash
npm test -- tests/accessibility-compliance.test.ts
```

**What it tests:**
- HTML accessibility patterns
- Form accessibility (labels, fieldsets, error handling)
- Button and interactive element accessibility
- Color contrast requirements (WCAG AA 4.5:1 minimum)
- Keyboard navigation patterns
- Screen reader support (ARIA labels, heading hierarchy)
- Mobile accessibility (touch targets, zoom support)
- Error handling and validation patterns

### 2. Build-time Accessibility Checks

The build process includes accessibility linting. Run:

```bash
npm run build
```

Any critical accessibility issues will prevent the build from completing.

## Manual Testing Procedures

### 1. Keyboard Navigation Testing

**Test all interactive elements are keyboard accessible:**

1. Start at the top of the page and press `Tab` repeatedly
2. Verify all focusable elements receive focus in logical order
3. Ensure skip navigation link appears on first `Tab` press
4. Verify modal dialogs trap focus appropriately
5. Test `Escape` key closes modals and dropdowns
6. Confirm `Enter` and `Space` activate buttons appropriately

**Expected Results:**
- All buttons, links, and form controls are focusable
- Focus indicators are clearly visible (blue ring/outline)
- Tab order follows logical page structure
- No keyboard traps (except intentional modal focus trapping)

### 2. Screen Reader Testing

**Recommended screen readers for testing:**
- **Windows**: NVDA (free), JAWS (paid)
- **macOS**: VoiceOver (built-in)
- **Mobile**: TalkBack (Android), VoiceOver (iOS)

**Test scenarios:**

1. **Heading Structure:**
   - Navigate by headings (H1-H6)
   - Verify logical hierarchy (no heading levels skipped)
   - Confirm page has single H1 element

2. **Form Accessibility:**
   - Navigate by form elements
   - Verify all inputs have associated labels
   - Confirm error messages are announced
   - Test fieldset/legend groupings

3. **Landmarks and Regions:**
   - Navigate by landmarks (main, navigation, banner, contentinfo)
   - Verify proper ARIA labels on landmarks
   - Confirm skip links work correctly

4. **Interactive Elements:**
   - Test button names are descriptive
   - Verify link text is meaningful (not just "click here")
   - Confirm modal dialogs are properly announced

### 3. Color Contrast Testing

**Tools:**
- Browser DevTools Accessibility panel
- WebAIM Contrast Checker
- Colour Contrast Analyser (CCA)

**Test Requirements:**
- **Normal text**: Minimum 4.5:1 contrast ratio
- **Large text** (18pt+ or 14pt+ bold): Minimum 3:1 contrast ratio
- **UI components**: Minimum 3:1 contrast ratio for focus indicators, borders

**Common color combinations to verify:**
- Body text: `#111827` on `#ffffff` (gray-900 on white)
- Secondary text: `#374151` on `#ffffff` (gray-700 on white)
- Primary buttons: `#ffffff` on `#2563eb` (white on blue-600)
- Links: `#2563eb` on `#ffffff` (blue-600 on white)

### 4. Mobile Accessibility Testing

**Touch Target Testing:**
- Minimum 44px × 44px touch targets
- Adequate spacing between interactive elements
- Test with device in both portrait and landscape

**Zoom Testing:**
- Test up to 200% zoom without horizontal scrolling
- Verify all content remains accessible
- Ensure no content is cut off or becomes unreachable

**Gesture Testing:**
- Verify all functionality works with assistive touch
- Test voice control on iOS/Android
- Confirm swipe gestures have alternatives

## Component-Specific Testing

### Navigation Component
- [x] Skip navigation links implemented
- [x] ARIA labels on navigation regions
- [x] Current page indication with `aria-current="page"`
- [x] Keyboard navigation between menu items
- [x] Mobile menu accessibility

### Modal Components (ReportModal, etc.)
- [x] `role="dialog"` and `aria-modal="true"`
- [x] `aria-labelledby` and `aria-describedby`
- [x] Focus management (initial focus, focus trapping)
- [x] Escape key closes modal
- [x] Focus returns to trigger element on close

### Form Components
- [x] Proper label associations (`for` attribute)
- [x] Fieldset/legend for grouped inputs
- [x] Error message announcements (`role="alert"`)
- [x] Required field indicators
- [x] Help text associations (`aria-describedby`)

### Button Components
- [x] Improved focus indicators (blue ring)
- [x] Proper disabled state handling
- [x] Icon-only buttons have `aria-label`
- [x] Button text is descriptive

## Accessibility Checklist for New Features

### Before Development
- [ ] Review designs for color contrast compliance
- [ ] Ensure proper heading hierarchy in mockups
- [ ] Plan keyboard navigation flow
- [ ] Identify any complex UI patterns requiring ARIA

### During Development
- [ ] Use semantic HTML elements when possible
- [ ] Add appropriate ARIA labels and descriptions
- [ ] Implement proper focus management
- [ ] Test keyboard navigation as you build
- [ ] Verify color contrast meets WCAG AA standards

### Before Deployment
- [ ] Run automated accessibility tests
- [ ] Perform manual keyboard testing
- [ ] Test with at least one screen reader
- [ ] Verify mobile accessibility
- [ ] Check color contrast ratios
- [ ] Validate HTML for accessibility issues

## Known Issues and Limitations

### Current Status
- ✅ Basic accessibility infrastructure in place
- ✅ Skip navigation implemented
- ✅ Improved ARIA labels throughout navigation
- ✅ Better focus management in modals
- ✅ Enhanced form accessibility
- ✅ Accessible color contrast ratios

### Areas for Future Improvement
- [ ] Live region announcements for dynamic content updates
- [ ] Enhanced mobile gesture alternatives
- [ ] Advanced ARIA patterns for complex widgets
- [ ] User preference controls for reduced motion/animations
- [ ] High contrast mode support

## Resources

### WCAG Guidelines
- [WCAG 2.1 Quick Reference](https://www.w3.org/WAI/WCAG21/quickref/)
- [WebAIM WCAG 2 Checklist](https://webaim.org/standards/wcag/checklist)

### Testing Tools
- [WAVE Web Accessibility Evaluator](https://wave.webaim.org/)
- [axe DevTools Browser Extension](https://www.deque.com/axe/devtools/)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)

### Screen Reader Resources
- [NVDA Screen Reader](https://www.nvaccess.org/download/) (Windows, free)
- [VoiceOver User Guide](https://support.apple.com/guide/voiceover/welcome/mac) (macOS)
- [Basic screen reader commands](https://webaim.org/articles/screenreader_testing/)

## Contact

For accessibility questions or to report accessibility barriers, contact:
- **Email**: allthingswetaskiwin@gmail.com
- **Subject Line**: "Accessibility Support Request"

We are committed to addressing accessibility concerns promptly and providing information in accessible formats when needed.