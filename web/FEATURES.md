# Metropolis Survival System - Feature List

## 🎨 Visual Design

### Art Deco Industrial Aesthetic
- **Color Palette**: Deep blacks (#0a0a0a), steel grays (#4a4a4a), aged brass (#8b6914)
- **Warning Colors**: Amber (#cc8800), danger red (#cc0000)
- **Typography**: Bebas Neue (headings), Roboto Mono (body)
- **Effects**: Scanline overlay, glowing lights, metallic shadows, rivets

### Industrial Components
- **Panels**: Steel-textured backgrounds with rivets and beveled edges
- **Buttons**: Beveled metallic appearance with brass borders
- **Gauges**: Black displays with amber readouts
- **Lights**: Pulsing warning indicators

## 🏠 Landing Page

### Animated Elements
- ✅ Pulsing warning lights (red/amber)
- ✅ Dramatic title reveal with scale animation
- ✅ Decorative corner brackets with brass accents
- ✅ Scanline effect for vintage CRT feel
- ✅ System status indicator
- ✅ Bottom info bar with slide-in animation

### Interactive
- ✅ "Enter Control Room" button with hover effects
- ✅ Smooth page transitions

## 🎛️ Control Room

### Navigation
- ✅ Compact header with mode selector
- ✅ Mode toggle (AUTO / MANUAL)
- ✅ Account count display
- ✅ Mobile-responsive layout

### Automatic Mode
- ✅ 3-column grid layout (sidebar + main content)
- ✅ Quick Account Add panel with management
- ✅ System status gauges with animated progress bars
- ✅ Account count indicator
- ✅ Operational status with pulsing light
- ✅ Route Calculator integration
- ✅ Full algorithm integration

### Manual Switchboard Mode
- ✅ Interactive telephone switchboard interface
- ✅ Vintage 1927 aesthetic
- ✅ Mobile-optimized version for small screens
- ✅ Fee calculator integration

## 📞 Switchboard Features (Dead Tech Resurrection)

### Core Functionality
- ✅ **Click-to-Connect**: Click source jack, then target jack
- ✅ **Visual Cables**: Animated SVG cables with glow effects
- ✅ **Indicator Lights**: Green lights pulse when connected
- ✅ **Connection Log**: Real-time list of active connections
- ✅ **Unplug Function**: Click to disconnect individual cables
- ✅ **Clear All**: Disconnect all connections at once

### Enhanced Features

#### 🎵 Audio Feedback
- ✅ **Click Sound**: Vintage "click" when selecting a jack (600Hz square wave)
- ✅ **Connection Sound**: Two-tone beep when cable connects (600Hz + 800Hz)
- ✅ **Disconnect Sound**: Lower tone when unplugging (400Hz)
- ✅ **Web Audio API**: Real-time synthesized sounds

#### 🖱️ Visual Feedback
- ✅ **Hover Effects**: Jacks glow amber when hovered
- ✅ **Active State**: Selected jack scales up and shows "PLUGGED" label
- ✅ **Dragging Cable**: Dashed line follows cursor while connecting
- ✅ **Connection Animation**: Cables draw smoothly with path animation
- ✅ **Status Indicators**: Green lights pulse on connected jacks

#### 📊 Information Display
- ✅ **Account Balances**: Show available funds on each jack
- ✅ **Connection Count**: Display number of active connections
- ✅ **Timestamps**: Log when each connection was made
- ✅ **Operator Notes**: Instructions and system information

### Switchboard Details
- **Jacks**: 3 source accounts (Savings, Checking, Cash App) + 1 target
- **Visual Design**: Brass-bordered circular sockets with indicator lights
- **Panel**: Black background with industrial texture and corner rivets
- **Cables**: Curved paths with shadow and glow effects
- **Layout**: Sources on left, target on right (classic switchboard arrangement)

## 🎯 The Metaphor

### 1920s Technology → 2024 Problem
- **Then**: Telephone operators manually connected calls
- **Now**: Users manually route money between accounts
- **Result**: Complex financial routing becomes tangible and visual

### Why It Works
1. **Familiar Mental Model**: Everyone understands plugging cables
2. **Visual Clarity**: See all connections at once
3. **Direct Control**: Manual override of automatic systems
4. **Tactile Feedback**: Audio and visual confirmation
5. **Historical Authenticity**: Genuine 1927 aesthetic

## 🚀 Technical Stack

- **React 18**: Component framework
- **TypeScript**: Type safety
- **Tailwind CSS**: Utility-first styling
- **Framer Motion**: Smooth animations
- **React Router**: Page navigation
- **Web Audio API**: Vintage sound effects
- **SVG**: Cable rendering and animations
- **Vite**: Fast dev server and build tool

## 📱 Responsive Design

- ✅ Mobile-friendly layouts
- ✅ Adaptive grid systems
- ✅ Touch-friendly buttons
- ✅ Responsive typography

## 🎮 User Experience

### Interaction Patterns
- **Progressive Disclosure**: Start simple, reveal complexity
- **Immediate Feedback**: Audio + visual confirmation
- **Error Prevention**: Can't connect jack to itself
- **Easy Undo**: Unplug button on each connection
- **Clear Instructions**: Context-sensitive help text

### Accessibility
- Keyboard navigation support (via buttons)
- High contrast colors
- Clear visual indicators
- Audio feedback (optional)

## 🔮 Future Enhancements

### Potential Additions
- [ ] Drag-and-drop cable routing (physical dragging)
- [ ] Multi-hop connections (chain multiple accounts)
- [ ] Saved presets ("patch bay configurations")
- [ ] Historical connection log
- [ ] Busy signals for unavailable accounts
- [ ] Transfer amount input per connection
- [ ] Integration with actual routing algorithm
- [ ] Operator's logbook (connection history)
- [ ] More vintage sound effects
- [ ] Haptic feedback (mobile)

## 📖 Documentation

- `SWITCHBOARD.md`: Philosophy and design rationale
- `FEATURES.md`: This file - complete feature list
- Code comments: Inline documentation

---

**Built with ❤️ and a love for dead technology**
