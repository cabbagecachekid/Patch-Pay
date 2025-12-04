# WCAG Accessibility Testing Checklist

Use this checklist to verify WCAG compliance after the text accessibility improvements.

## Visual Testing

### Color Contrast
- [ ] All text on dark backgrounds is clearly readable
- [ ] Button text has sufficient contrast in both normal and hover states
- [ ] Status indicators (green, yellow, red) are distinguishable
- [ ] Form labels are clearly visible
- [ ] Error messages stand out from normal text

### Text Size
- [ ] All body text is at least 14px (text-sm)
- [ ] Text remains readable when zoomed to 200%
- [ ] No text appears cut off or overlapping at 200% zoom
- [ ] Line height provides adequate spacing

### Focus Indicators
- [ ] Tab through all interactive elements
- [ ] Each element shows a visible focus outline
- [ ] Focus outline is clearly visible on all backgrounds
- [ ] Focus order follows logical reading order

## Keyboard Navigation

### Landing Page
- [ ] Tab to "ENTER CONTROL ROOM" button
- [ ] Press Enter to navigate to control room
- [ ] Focus is visible throughout

### Control Room
- [ ] Tab to EXIT button
- [ ] Tab to AUTOMATIC/MANUAL mode buttons
- [ ] Tab to EDIT ACCOUNTS button
- [ ] All buttons respond to Enter/Space

### Account Setup
- [ ] Tab through bank search input
- [ ] Tab through bank selection buttons
- [ ] Tab through account type buttons
- [ ] Tab through balance and nickname inputs
- [ ] Tab to ADD ACCOUNT button
- [ ] Tab to SKIP SETUP button

### Route Calculator
- [ ] Tab to amount input
- [ ] Tab to deadline input
- [ ] Tab to CALCULATE ROUTES button
- [ ] Results are announced when displayed

### Switchboard
- [ ] Tab through all jack buttons
- [ ] Tab to CLEAR ALL button
- [ ] Jack connections work with keyboard (Enter/Space)

## Screen Reader Testing

### Semantic Structure
- [ ] Page title is announced
- [ ] Headings are properly nested (h1 → h2 → h3)
- [ ] Landmarks are identified (main, navigation, contentinfo)
- [ ] Lists are announced as lists with item counts

### Form Labels
- [ ] All inputs have associated labels
- [ ] Labels are announced when focusing inputs
- [ ] Required fields are indicated
- [ ] Error messages are associated with fields

### Dynamic Content
- [ ] Status changes are announced (CONNECTED, OPERATIONAL)
- [ ] Error messages are announced immediately
- [ ] Success messages are announced
- [ ] Loading states are announced

### ARIA Labels
- [ ] Buttons describe their action
- [ ] Toggle buttons announce their state (pressed/not pressed)
- [ ] Decorative elements are hidden from screen readers
- [ ] Icons have text alternatives

## Browser Testing

### Chrome/Edge
- [ ] Test with ChromeVox extension
- [ ] Test keyboard navigation
- [ ] Test zoom to 200%

### Firefox
- [ ] Test with NVDA (Windows)
- [ ] Test keyboard navigation
- [ ] Test zoom to 200%

### Safari
- [ ] Test with VoiceOver (Mac)
- [ ] Test keyboard navigation
- [ ] Test zoom to 200%

### Mobile
- [ ] Test with VoiceOver (iOS)
- [ ] Test with TalkBack (Android)
- [ ] Test touch targets (minimum 44x44px)

## Automated Testing

### Tools to Run
- [ ] axe DevTools browser extension
- [ ] WAVE browser extension
- [ ] Lighthouse accessibility audit
- [ ] W3C HTML Validator

### Expected Results
- [ ] No critical or serious issues in axe
- [ ] No errors in WAVE
- [ ] Lighthouse accessibility score > 90
- [ ] Valid HTML with no errors

## Specific Component Tests

### Landing Page
- [ ] "METROPOLIS" heading is h1
- [ ] "SURVIVAL SYSTEM" is h2
- [ ] Decorative elements are hidden from screen readers
- [ ] Status indicator announces "SYSTEM OPERATIONAL"

### Control Room
- [ ] "CONTROL ROOM" heading is h1
- [ ] Account list is announced as a list
- [ ] Status indicators update properly
- [ ] Mode toggle announces current selection

### Switchboard
- [ ] Jack buttons have descriptive labels
- [ ] Connection status is announced
- [ ] Instructions update based on state
- [ ] Audio feedback has visual alternatives

### Route Calculator
- [ ] Form inputs have proper labels
- [ ] Amount input accepts decimal values
- [ ] Deadline input is accessible
- [ ] Results are structured with headings
- [ ] Error messages are announced immediately

## Pass Criteria

✅ **Pass**: All items checked with no critical issues
⚠️ **Conditional Pass**: Minor issues that don't prevent usage
❌ **Fail**: Critical issues that prevent access

## Notes Section
Use this space to document any issues found:

---

**Date Tested**: _______________
**Tester**: _______________
**Browser/OS**: _______________
**Assistive Technology**: _______________

**Issues Found**:
1. 
2. 
3. 

**Recommendations**:
1. 
2. 
3.
