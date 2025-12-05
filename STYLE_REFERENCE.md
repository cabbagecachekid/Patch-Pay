# Style Reference - Patch Pay Terminal Aesthetic

This document contains the exact styling patterns extracted from the reference implementation.

## Core Color Classes

### Backgrounds
```tsx
// Main app background
className="min-h-screen bg-zinc-900 text-amber-100 font-mono"

// Panel backgrounds
className="bg-black border-4 border-amber-600 p-4"
className="bg-zinc-800 border-4 border-amber-600 p-6"
className="bg-zinc-900 border-2 border-amber-600"

// Active/selected backgrounds
className="border-amber-400 bg-amber-950"
className="border-green-400 bg-green-950 shadow-lg shadow-green-600/50"
```

### Borders
```tsx
// Primary borders (thick)
className="border-4 border-amber-600"

// Secondary borders (thin)
className="border-2 border-amber-600"
className="border-2 border-amber-700"

// Active/selected borders
className="border-4 border-amber-400"
className="border-4 border-green-400"

// Inactive/dimmed borders
className="border-4 border-amber-700"
className="border-4 border-amber-800"
```

### Text Colors
```tsx
// Primary text
className="text-amber-100"

// Headers
className="text-amber-500"
className="text-amber-400"

// Secondary/muted text
className="text-amber-600"
className="text-amber-700"

// Success states
className="text-green-400"
className="text-green-600"

// Error states
className="text-red-400"
```

## Component Patterns

### Header Bar
```tsx
<div className="border-b-4 border-amber-600 bg-black p-4">
  <div className="max-w-7xl mx-auto flex items-center justify-between">
    <div>
      <h1 className="text-3xl font-bold text-amber-500">PATCH PAY</h1>
      <p className="text-xs text-amber-600">THE TRANSFER TOWER</p>
    </div>
    <div className="flex gap-4">
      <button className="px-4 py-2 border-2 border-amber-600 hover:bg-amber-600 hover:text-black transition text-sm">
        HOME
      </button>
      <button className="px-4 py-2 bg-amber-600 text-black font-bold text-sm">
        SWITCHBOARD
      </button>
    </div>
  </div>
</div>
```

### Control Panel
```tsx
<div className="mb-6 bg-black border-4 border-amber-600 p-4">
  <div className="flex items-center justify-between mb-4">
    <div>
      <h2 className="text-xl font-bold text-amber-500">SWITCHBOARD CONTROL PANEL</h2>
      <p className="text-xs text-amber-700">MANUAL CONNECTION SYSTEM • EST. 1927</p>
    </div>
    <div className="flex items-center gap-2 px-3 py-1 border-2 border-green-600 text-green-400 text-xs">
      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
      OPERATOR READY
    </div>
  </div>
</div>
```

### Input Fields
```tsx
// Text input
<input
  type="text"
  className="w-full bg-zinc-900 border-2 border-amber-600 text-amber-100 p-2 text-sm focus:outline-none focus:border-amber-400"
  placeholder="Name or email"
/>

// Number input with dollar sign
<div className="relative">
  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-sm text-amber-600">$</span>
  <input
    type="number"
    className="w-full bg-zinc-900 border-2 border-amber-600 text-amber-100 p-2 pl-6 text-lg focus:outline-none focus:border-amber-400"
  />
</div>

// Select dropdown
<select
  className="w-full bg-zinc-900 border-2 border-amber-600 text-amber-100 p-2 text-sm focus:outline-none focus:border-amber-400"
>
  <option value="option1">Option 1</option>
</select>

// Label
<label className="block text-xs mb-1 text-amber-700">AMOUNT</label>
```

### Buttons
```tsx
// Primary button
<button className="w-full bg-amber-600 text-black font-bold p-2 text-sm hover:bg-amber-500 transition flex items-center justify-center gap-1">
  <Zap size={14} />
  FIND ROUTES
</button>

// Secondary button
<button className="px-4 py-2 border-2 border-amber-600 hover:bg-amber-600 hover:text-black transition text-sm">
  HOME
</button>

// Success button
<button className="w-full bg-green-600 text-black font-bold p-2 hover:bg-green-500 transition">
  EXECUTE TRANSFER
</button>

// Small action button
<button className="text-xs border border-green-600 px-2 py-1 hover:bg-green-600 hover:text-black transition">
  DISCONNECT
</button>
```

### Switchboard Jack (Circular Connector)
```tsx
// Container
<div className="border-4 p-3 transition-all border-amber-700 hover:border-amber-500 cursor-pointer">
  
  {/* Jack connector */}
  <div className="flex justify-center mb-2">
    <div className="w-10 h-10 rounded-full border-4 border-amber-700 bg-zinc-900 flex items-center justify-center">
      <div className="w-3 h-3 rounded-full bg-zinc-900"></div>
    </div>
  </div>
  
  {/* Label */}
  <div className="text-center">
    <div className="font-bold text-xs mb-1">CHASE</div>
    <div className="text-xs text-amber-700">Savings</div>
    <div className="text-sm font-bold mt-1 text-green-400">$5000</div>
  </div>
</div>

// Active/selected jack
<div className="border-4 border-amber-400 bg-amber-950 shadow-lg shadow-amber-600/50">
  <div className="w-10 h-10 rounded-full border-4 border-amber-400 bg-amber-600">
    <div className="w-3 h-3 rounded-full bg-zinc-900"></div>
  </div>
</div>

// Connected jack (success state)
<div className="border-4 border-green-400 bg-green-950 shadow-lg shadow-green-600/50">
  <div className="w-10 h-10 rounded-full border-4 border-green-400 bg-green-600">
    <div className="w-3 h-3 rounded-full bg-zinc-900"></div>
  </div>
</div>
```

### Status Indicators
```tsx
// Ready status
<div className="flex items-center gap-2 px-3 py-1 border-2 border-green-600 text-green-400 text-xs">
  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
  OPERATOR READY
</div>

// Active connection
<div className="text-green-400 text-xs mb-2 flex items-center gap-2 font-bold">
  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
  ACTIVE CONNECTION
</div>

// Route patched
<div className="text-xs text-green-400 border-2 border-green-600 px-3 py-1">
  <div className="flex items-center gap-2">
    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
    ROUTE PATCHED
  </div>
</div>
```

### Panels and Sections
```tsx
// Main switchboard panel
<div className="bg-zinc-800 border-4 border-amber-600 p-6 relative">
  {/* Background pattern */}
  <div 
    className="absolute inset-0 opacity-5 pointer-events-none"
    style={{
      backgroundImage: 'radial-gradient(circle, #d97706 1px, transparent 1px)',
      backgroundSize: '20px 20px'
    }}
  ></div>
  
  <div className="relative z-10">
    {/* Content */}
  </div>
</div>

// Section with border
<div className="col-span-3 border-2 border-amber-700 p-4">
  <div className="text-xs text-amber-500 font-bold mb-3 border-b border-amber-700 pb-1">
    SOURCE ACCOUNTS
  </div>
  {/* Content */}
</div>

// Active connection panel
<div className="mt-4 border-4 border-green-600 bg-green-950 p-4">
  <div className="flex items-center justify-between mb-2">
    <div className="text-green-400 font-bold text-sm flex items-center gap-2">
      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
      ACTIVE CONNECTION
    </div>
  </div>
  {/* Connection details */}
</div>
```

### Grid Layouts
```tsx
// 4-column input grid
<div className="grid grid-cols-4 gap-3">
  {/* Input fields */}
</div>

// 3-column account grid
<div className="grid grid-cols-3 gap-3">
  {/* Account cards */}
</div>

// 5-column main layout (3 + 2)
<div className="grid grid-cols-5 gap-6">
  <div className="col-span-3">
    {/* Source accounts */}
  </div>
  <div className="col-span-2">
    {/* Transfer methods */}
  </div>
</div>
```

### Modal/Overlay
```tsx
<div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-6">
  <div className="bg-zinc-900 border-4 border-amber-600 max-w-5xl w-full max-h-[80vh] overflow-y-auto">
    {/* Header */}
    <div className="bg-black border-b-4 border-amber-600 p-4 flex items-center justify-between sticky top-0">
      <h2 className="text-xl font-bold text-amber-500">AVAILABLE ROUTES</h2>
      <button className="text-amber-500 hover:text-amber-300">
        <X size={24} />
      </button>
    </div>
    
    {/* Content */}
    <div className="p-6 space-y-4">
      {/* Route cards */}
    </div>
  </div>
</div>
```

### Route Card
```tsx
<div className="border-4 border-amber-400 bg-amber-950 p-4">
  {/* Recommended badge */}
  <div className="text-amber-400 text-xs mb-2 flex items-center gap-2 font-bold">
    <Zap size={14} />
    RECOMMENDED ROUTE
  </div>
  
  {/* Route info */}
  <div className="flex items-start justify-between mb-3">
    <div className="flex-1">
      <div className="text-lg font-bold text-amber-300 mb-1">
        DIRECT TRANSFER
      </div>
      <div className="text-sm text-amber-600">
        Direct P2P transfer from Chase
      </div>
    </div>
    
    {/* Metrics */}
    <div className="flex gap-6 ml-6">
      <div className="text-center">
        <div className="text-xs text-amber-700">TIME</div>
        <div className="flex items-center gap-1 text-amber-300">
          <Clock size={14} />
          <span className="font-bold text-sm">2 min</span>
        </div>
      </div>
      <div className="text-center">
        <div className="text-xs text-amber-700">FEE</div>
        <div className="flex items-center gap-1 text-green-400">
          <DollarSign size={14} />
          <span className="font-bold text-sm">0</span>
        </div>
      </div>
    </div>
  </div>
  
  {/* Route visualization */}
  <div className="bg-zinc-900 border-2 border-amber-700 p-3 mb-3">
    <div className="flex items-center gap-2 flex-wrap text-xs">
      <div className="border-2 border-amber-600 bg-black px-2 py-1">
        <div className="font-bold">CHASE</div>
        <div className="text-xs text-amber-700">$1000</div>
      </div>
      <ArrowRight size={14} className="text-amber-600 mx-1" />
      <div className="border-2 border-green-600 bg-green-950 px-2 py-1">
        <div className="font-bold text-green-400 text-xs">P2P</div>
      </div>
    </div>
  </div>
  
  {/* Action button */}
  <button className="w-full bg-amber-600 text-black font-bold p-2 hover:bg-amber-500 transition text-sm">
    PATCH THIS ROUTE
  </button>
</div>
```

### Instructions Panel
```tsx
<div className="mt-4 bg-black border-2 border-amber-700 p-3">
  <h4 className="font-bold text-xs mb-2 text-amber-500">OPERATOR INSTRUCTIONS</h4>
  <div className="grid grid-cols-4 gap-2 text-xs text-amber-700">
    <div>1. SET PARAMETERS</div>
    <div>2. FIND ROUTES</div>
    <div>3. SELECT ROUTE</div>
    <div>4. EXECUTE TRANSFER</div>
  </div>
</div>
```

## Typography Scale

```tsx
// Extra large (main title)
className="text-3xl font-bold text-amber-500"

// Large (section headers)
className="text-xl font-bold text-amber-500"

// Medium (subsection headers)
className="text-lg font-bold text-amber-300"

// Base (primary content)
className="text-sm text-amber-600"

// Small (labels, metadata)
className="text-xs text-amber-700"
```

## Spacing Patterns

```tsx
// Tight spacing
className="gap-2 p-2"

// Normal spacing
className="gap-3 p-3"

// Generous spacing
className="gap-4 p-4"

// Large spacing
className="gap-6 p-6"
```

## Transition Effects

```tsx
// Standard transition
className="transition"
className="transition-all"

// Hover states
className="hover:bg-amber-600 hover:text-black"
className="hover:bg-amber-500"
className="hover:border-amber-500"

// Pulse animation
className="animate-pulse"
```

## Shadow Effects

```tsx
// Glow effect for selected items
className="shadow-lg shadow-amber-600/50"
className="shadow-lg shadow-green-600/50"
```

## Usage Notes

1. **Always use `font-mono`** on the root element for terminal aesthetic
2. **Border hierarchy**: 4px for main panels, 2px for inputs/secondary elements
3. **Color hierarchy**: amber-500 for headers, amber-600 for borders, amber-700 for muted text
4. **Active states**: Use amber-400 borders and amber-950 backgrounds
5. **Success states**: Use green-400 text, green-600 borders, green-950 backgrounds
6. **Spacing**: Prefer gap-3 and p-3 for compact layouts, gap-6 and p-6 for spacious layouts
7. **Text sizes**: xs for labels, sm for content, xl for headers
8. **Background pattern**: Always use the radial gradient dot pattern at 5% opacity
