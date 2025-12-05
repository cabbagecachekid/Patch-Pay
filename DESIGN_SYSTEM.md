# Patch Pay Design System

## Color Palette

### Primary Colors

**Amber/Gold (Primary Brand Color)**
- `amber-100: #FEF3C7` - Light text on dark backgrounds
- `amber-400: #FBBF24` - Highlighted borders, selected states
- `amber-500: #F59E0B` - Headers, primary text emphasis
- `amber-600: #D97706` - Borders, buttons, primary interactive elements
- `amber-700: #B45309` - Secondary text, descriptions
- `amber-950: #451A03` - Selected/active backgrounds (very dark amber)

### Accent Colors

**Green (Success/Active States)**
- `green-400: #4ADE80` - Active indicators, success text
- `green-500: #22C55E` - Success buttons (hover state)
- `green-600: #16A34A` - Success buttons, active connections
- `green-800: #166534` - Dividers in success panels
- `green-950: #052E16` - Success panel backgrounds

**Red (Warning/Insufficient Funds)**
- `red-400: #F87171` - Insufficient balance indicators

### Neutral/Background Colors

- `Black: #000000` - Primary panels, headers, high-contrast backgrounds

**Zinc Shades**
- `zinc-800: #27272A` - Secondary panel backgrounds
- `zinc-900: #18181B` - Input fields, card backgrounds, main app background

---

## Typography

### Font Family
```css
font-family: 'Courier New', Courier, monospace;
```
**Rationale**: Monospace font gives authentic vintage terminal/computer aesthetic from the 1920s-1980s era

### Font Sizes

**Headings**
- **H1 (Main Title)**: `text-3xl` (30px) - "PATCH PAY"
- **H2 (Section Headers)**: `text-2xl` (24px) - "CONTROL ROOM", "SWITCHBOARD ROUTING"
- **H3 (Subsections)**: `text-xl` (20px) - "SOURCE ACCOUNTS", "DESTINATION"
- **H4 (Small Headers)**: `text-base` (16px) - Labels and instructions

**Body Text**
- **Regular**: `text-sm` (14px) - Descriptions, helper text
- **Emphasized**: `text-base` (16px) - Primary content
- **Large Numbers**: `text-2xl` (24px) - Amount inputs
- **Extra Large**: `text-xl` (20px) - Route type names

**Small Text**
- **Labels**: `text-xs` (12px) - Field labels, metadata, timestamps

### Font Weights
- **Normal**: Default weight for body text
- **Bold** (`font-bold`): Headers, emphasis, button text, account names

---

## Border Styles

### Border Widths
- **Thin**: `border-2` (2px) - Input fields, secondary panels, subtle dividers
- **Thick**: `border-4` (4px) - Main panels, primary containers, emphasis

### Border Colors
- **Primary**: `border-amber-600` - Main interactive elements
- **Highlighted**: `border-amber-400` - Selected/active states
- **Secondary**: `border-amber-700` or `border-amber-800` - Inactive/disabled states
- **Success**: `border-green-600` - Active connections, success states
- **Subtle**: `border-amber-700` - Dividers, less important borders

---

## Component Styles

### Buttons

**Primary Button (Call-to-Action)**
```css
bg-amber-600 text-black font-bold p-4 hover:bg-amber-500
```

**Secondary Button (Navigation)**
```css
border-2 border-amber-600 text-amber-600 hover:bg-amber-600 hover:text-black
```

**Success Button**
```css
bg-green-600 text-black font-bold p-4 hover:bg-green-500
```

### Panels/Cards

**Main Panel**
```css
bg-black border-4 border-amber-600 p-6
```

**Secondary Panel**
```css
bg-zinc-800 border-4 border-amber-600 p-8
```

### Input Fields
```css
bg-zinc-900 border-2 border-amber-600 text-amber-100 p-3 focus:outline-none focus:border-amber-400
```

### Switchboard Jacks (Circular Connectors)

**Active Jack**
```css
w-12 h-12 rounded-full border-4 border-amber-400 bg-amber-600
```
Inner circle: `w-4 h-4 rounded-full bg-zinc-900`

**Inactive Jack**
```css
w-12 h-12 rounded-full border-4 border-amber-700 bg-zinc-900
```
Inner circle: `w-4 h-4 rounded-full bg-zinc-900`

**Success/Connected Jack**
```css
w-12 h-12 rounded-full border-4 border-green-400 bg-green-600
```
Inner circle: `w-4 h-4 rounded-full bg-zinc-900`

### Status Indicators

**Ready/Active Status**
```css
border-2 border-green-600 text-green-400
```
Dot: `w-2 h-2 bg-green-400 rounded-full animate-pulse`

**Connection Active**
```css
border-4 border-green-600 bg-green-950 text-green-400
```
Dot: `w-3 h-3 bg-green-400 rounded-full animate-pulse`

### Selection States

**Selected/Active Item**
```css
border-amber-400 bg-amber-950 shadow-lg shadow-amber-600/50
```

**Inactive/Disabled Item**
```css
border-amber-800 opacity-40
```

---

## Spacing

### Padding
- **Tight**: `p-2` (8px) - Compact elements
- **Normal**: `p-4` (16px) - Standard padding
- **Generous**: `p-6` (24px) - Main panels
- **Extra**: `p-8` (32px) - Large panels, switchboard

### Gaps
- **Tight**: `gap-2` (8px) - Inline elements
- **Normal**: `gap-4` (16px) - Related items
- **Generous**: `gap-6` (24px) - Sections
- **Large**: `gap-12` (48px) - Major sections (like switchboard columns)

### Margins
- **Small**: `mb-2`, `mt-2` (8px)
- **Medium**: `mb-4`, `mt-4` (16px)
- **Large**: `mb-6`, `mt-6` (24px)

---

## Visual Effects

### Shadows
**Glow Effect (for selected items)**: `shadow-lg shadow-amber-600/50`
- Used sparingly for emphasis on active/selected states

### Animations
**Pulse (for active indicators)**: `animate-pulse`
- Used on status dots to show live/active state

### Opacity
- **Dimmed/Inactive**: `opacity-40`
- **Subtle Background Pattern**: `opacity-5` (for decorative switchboard grid)

### Transitions
**Standard transition**: `transition` or `transition-all`
- Applied to interactive elements (buttons, cards) for smooth hover effects

---

## Background Patterns

### Switchboard Grid Pattern
```css
background-image: radial-gradient(circle, #d97706 1px, transparent 1px)
background-size: 20px 20px
opacity: 5%
```
Creates subtle dot grid pattern suggesting circuitry/switchboard connections

---

## Page-Specific Designs

### Landing Page (Terminal Style)

The landing page uses a **retro terminal/command-line interface** aesthetic:

**Terminal Header**
```tsx
<div className="border-b-2 border-amber-600 p-2 bg-black">
  {/* macOS-style window controls */}
  <div className="flex gap-2">
    <div className="w-3 h-3 rounded-full bg-red-500" />
    <div className="w-3 h-3 rounded-full bg-yellow-500" />
    <div className="w-3 h-3 rounded-full bg-green-500" />
  </div>
  <span className="text-amber-400 text-xs">PATCH_PAY_v1.0</span>
</div>
```

**Terminal Grid Background**
```css
background-image: radial-gradient(circle, #D97706 1px, transparent 1px)
background-size: 20px 20px
opacity: 5%
```

**Terminal Commands (Buttons)**
```tsx
{/* Primary command */}
<button className="bg-amber-600 text-black font-bold px-4 py-2 text-sm">
  &gt; START_CONTROL_ROOM
</button>

{/* Secondary command */}
<button className="border-2 border-amber-600 text-amber-400 hover:bg-amber-600 hover:text-black">
  &gt; MANUAL_SWITCHBOARD
</button>
```

**System Status Panel**
```tsx
<div className="bg-zinc-900 border-2 border-amber-600 p-3">
  <div className="text-amber-400 text-xs">&gt; SYSTEM_STATUS:</div>
  <div className="grid grid-cols-3 gap-2 text-xs">
    <div>
      <span className="text-amber-700">VER:</span>
      <span className="text-amber-100">1.0</span>
    </div>
    {/* More status items */}
  </div>
</div>
```

**Key Features**:
- Compact, terminal-like layout
- Command-line prompt syntax (`>` prefix)
- System status display with key metrics
- Monospace font throughout
- Minimal decorative elements
- Focus on functionality over aesthetics

## Design Principles

1. **High Contrast**: Dark backgrounds (black, zinc-900) with bright amber text for readability
2. **Chunky Borders**: Thick 4px borders on main elements for bold, vintage aesthetic
3. **Monospace Typography**: Reinforces computer/terminal heritage
4. **Amber = Action**: Primary interactive elements use amber/gold
5. **Green = Success**: Active connections, successful states use green
6. **Circles for Connection Points**: Round jacks/connectors reference physical switchboard plugs
7. **Minimal Gradients**: Flat colors maintain vintage terminal aesthetic
8. **Glow Effects**: Used sparingly on selected items to suggest electrical connection
9. **Terminal Aesthetic**: Landing page uses command-line interface styling for retro computing feel

---

## Responsive Considerations

- Use `md:` prefix for tablet+ breakpoints
- Grid layouts collapse from 2 columns to 1 on mobile
- Maintain minimum touch target sizes (44px) for mobile
- Stack switchboard sections vertically on small screens

---

## Usage Examples

### Primary CTA Button
```tsx
<button className="bg-amber-600 text-black font-bold p-4 hover:bg-amber-500 transition">
  CALCULATE ROUTES
</button>
```

### Main Panel
```tsx
<div className="bg-black border-4 border-amber-600 p-6">
  <h2 className="text-2xl text-amber-500 font-bold mb-4">CONTROL ROOM</h2>
  {/* Content */}
</div>
```

### Active Status Indicator
```tsx
<div className="border-2 border-green-600 text-green-400 p-2 flex items-center gap-2">
  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
  <span className="text-xs">OPERATIONAL</span>
</div>
```

### Input Field
```tsx
<input
  type="text"
  className="w-full bg-zinc-900 border-2 border-amber-600 text-amber-100 p-3 focus:outline-none focus:border-amber-400 transition"
  placeholder="Enter amount..."
/>
```

---

**Built with vintage industrial aesthetics. Inspired by 1927 switchboard technology.**
