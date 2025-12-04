# Mobile Responsiveness Guide

## Overview
The Metropolis Survival System is now fully responsive across all device sizes, from mobile phones (320px) to large desktop screens (1920px+).

## Breakpoints Used

Following Tailwind CSS conventions:
- **Mobile**: < 640px (sm)
- **Tablet**: 640px - 768px (sm - md)
- **Desktop**: 768px - 1024px (md - lg)
- **Large Desktop**: > 1024px (lg+)

## Page-by-Page Improvements

### Landing Page

#### Mobile (< 640px)
- **System Status Badge**: Reduced padding, smaller text (12px → 14px)
- **Circular Gauge**: Scaled down from 256px to 192px
- **Title**: Reduced from 8xl to 6xl (96px → 60px)
- **Subtitle**: Reduced from 5xl to 3xl
- **Geometric Divider**: Smaller elements and gaps
- **Footer**: Stacked layout, hidden "FINANCIAL ROUTING SYSTEM" text
- **Corner Decorations**: Maintained but scaled appropriately

#### Tablet (640px - 768px)
- **Title**: 7xl (72px)
- **Subtitle**: 4xl
- **Footer**: Single row with abbreviated text

#### Desktop (> 768px)
- **Full Layout**: All elements at original size
- **Footer**: Three-column layout with all text visible

### Control Room

#### Mobile (< 640px)
- **Header**: Reduced padding (16px), smaller title (2xl)
- **Subtitle**: Hidden on mobile
- **Mode Selector**: Stacked vertical layout
  - "AUTOMATIC" → "AUTO"
  - "MANUAL SWITCHBOARD" → "MANUAL"
  - "EDIT ACCOUNTS" → "EDIT"
- **Bottom Bar**: Abbreviated text, smaller padding
- **Grid Layout**: Single column for all content

#### Tablet (640px - 1024px)
- **Mode Selector**: Horizontal layout with abbreviated text
- **Grid**: Still single column until lg breakpoint

#### Desktop (> 1024px)
- **Full Layout**: 3-column grid (sidebar + 2-col main)
- **All Text**: Full labels visible

### Route Calculator

#### Mobile (< 640px)
- **Form Inputs**: Reduced padding, smaller text
- **Labels**: "SEND TO (TARGET ACCOUNT)" → "SEND TO (TARGET)"
- **Source Grid**: 2 columns instead of 3
- **Stats Grid**: Maintained 3 columns but smaller text
  - "TOTAL FEES" → "FEES"
  - Date only (no time) for arrival
- **Transfer Steps**: Stacked layout (vertical)
- **Route Cards**: Smaller padding, truncated reasoning text

#### Tablet (640px - 768px)
- **Source Grid**: 3 columns
- **Form**: 2-column grid for amount/deadline
- **Steps**: Still stacked for readability

#### Desktop (> 768px)
- **Full Layout**: All text and spacing at original size
- **Steps**: Horizontal layout with full details

### Account Setup

#### Mobile (< 640px)
- **Bank Grid**: 2 columns
- **Form Inputs**: Reduced padding
- **Account Type Buttons**: Smaller text
- **Balance/Nickname**: 2-column grid maintained

#### Tablet & Desktop
- **Bank Grid**: 3 columns
- **Full spacing and text sizes**

### Switchboard (Manual Mode)

#### Note
The switchboard is inherently desktop-focused due to its interactive nature. On mobile:
- Minimum height maintained (500px)
- Touch-friendly jack buttons (48px)
- Scrollable connection log
- Instructions panel responsive

## Touch Targets

All interactive elements meet WCAG 2.1 AA standards:
- **Minimum Size**: 44x44px (iOS) / 48x48px (Android)
- **Buttons**: Adequate spacing between elements
- **Form Inputs**: Large enough for easy tapping

## Typography Scale

### Mobile
- **Body Text**: 14px (text-sm)
- **Small Text**: 12px (text-xs)
- **Headings**: 
  - H1: 24px (text-2xl)
  - H2: 20px (text-xl)
  - H3: 18px (text-lg)

### Desktop
- **Body Text**: 16px (text-base)
- **Small Text**: 14px (text-sm)
- **Headings**:
  - H1: 36px (text-4xl)
  - H2: 30px (text-3xl)
  - H3: 24px (text-2xl)

## Layout Patterns

### Stacking Strategy
1. **Mobile First**: Single column, stacked elements
2. **Tablet**: Introduce 2-column grids where appropriate
3. **Desktop**: Full multi-column layouts

### Grid Breakpoints
```css
grid-cols-1              /* Mobile: All stacked */
sm:grid-cols-2           /* Tablet: 2 columns */
md:grid-cols-3           /* Desktop: 3 columns */
lg:grid-cols-3           /* Large: Maintain or expand */
```

### Flex Patterns
```css
flex-col                 /* Mobile: Vertical */
sm:flex-row              /* Tablet+: Horizontal */
```

## Spacing Scale

### Mobile
- **Padding**: 16px (p-4)
- **Gaps**: 8px (gap-2)
- **Margins**: 16px (mb-4)

### Desktop
- **Padding**: 24-32px (p-6, p-8)
- **Gaps**: 16-24px (gap-4, gap-6)
- **Margins**: 32px (mb-8)

## Testing Checklist

### Devices to Test
- [ ] iPhone SE (375px)
- [ ] iPhone 12/13/14 (390px)
- [ ] iPhone 14 Pro Max (430px)
- [ ] iPad Mini (768px)
- [ ] iPad Pro (1024px)
- [ ] Desktop (1280px)
- [ ] Large Desktop (1920px)

### Orientations
- [ ] Portrait (mobile/tablet)
- [ ] Landscape (mobile/tablet)

### Browsers
- [ ] Safari (iOS)
- [ ] Chrome (Android)
- [ ] Chrome (Desktop)
- [ ] Firefox (Desktop)
- [ ] Safari (macOS)

## Common Issues & Solutions

### Issue: Text Overflow
**Solution**: Use `truncate` or `line-clamp-{n}` utilities

### Issue: Buttons Too Small
**Solution**: Minimum `px-4 py-2` on mobile, `px-6 py-3` on desktop

### Issue: Grid Breaks Layout
**Solution**: Always start with `grid-cols-1`, add breakpoints

### Issue: Fixed Positioning Covers Content
**Solution**: Add bottom padding to page container (`pb-20`)

## Performance Considerations

### Image Optimization
- Use responsive images with `srcset`
- Lazy load below-the-fold content
- Optimize SVG animations for mobile

### Animation Performance
- Reduce motion on mobile if needed
- Use `transform` and `opacity` for animations
- Consider `prefers-reduced-motion` media query

### Font Loading
- System fonts load instantly
- Custom fonts use `font-display: swap`

## Future Enhancements

1. **PWA Support**: Add manifest for install-to-homescreen
2. **Offline Mode**: Cache critical assets
3. **Gesture Support**: Swipe navigation on mobile
4. **Haptic Feedback**: Vibration on button presses (mobile)
5. **Dark Mode**: Already dark, but could add light mode toggle
