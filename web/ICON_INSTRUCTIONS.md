# Icon Creation Instructions

## Current Status
A placeholder SVG icon has been created at `public/icon.svg` with the Metropolis aesthetic.

## To Create Production Icons

### Option 1: Use the SVG (Quick)
```bash
# Install ImageMagick (if not already installed)
# macOS:
brew install imagemagick

# Convert SVG to PNG icons
convert public/icon.svg -resize 192x192 public/icon-192.png
convert public/icon.svg -resize 512x512 public/icon-512.png
```

### Option 2: Design Custom Icons (Recommended)

#### Design Guidelines
**Theme**: Metropolis (1927 film) - Industrial Art Deco
**Colors**:
- Background: `#000000` (black)
- Foreground: `#f0e6d2` (cream)
- Accent: `#d4c5b0` (beige)

**Style Elements**:
- Geometric shapes (circles, squares, triangles)
- Angular, mechanical forms
- Gears, circuits, machinery
- Art Deco patterns
- Bold, industrial typography
- High contrast

**Inspiration**:
- 1920s Art Deco architecture
- Industrial machinery
- Vintage control panels
- Fritz Lang's Metropolis film
- Bauhaus design

#### Icon Sizes Required
1. **192x192px** - Standard icon
2. **512x512px** - High-resolution icon

#### Safe Area
Keep important content within the center 80% of the icon (outer 10% on each side may be cropped on some devices).

#### Tools
- **Figma**: Free, web-based
- **Adobe Illustrator**: Professional vector tool
- **Inkscape**: Free, open-source
- **Canva**: Simple, template-based

### Option 3: Use Icon Generator

1. Visit [RealFaviconGenerator](https://realfavicongenerator.net/)
2. Upload your base image (512x512 minimum)
3. Configure:
   - iOS: Black background, cream icon
   - Android: Adaptive icon with safe area
   - Windows: Tile with theme colors
4. Download package
5. Replace files in `public/` directory

### Option 4: Commission Design

If you want a professional icon:
1. Hire designer on Fiverr/Upwork
2. Provide brand guidelines (Metropolis theme)
3. Request deliverables:
   - SVG source file
   - 192x192 PNG
   - 512x512 PNG
   - Maskable versions (with safe area)

## Icon Checklist

- [ ] 192x192px PNG created
- [ ] 512x512px PNG created
- [ ] Icons use Metropolis color scheme
- [ ] Important content in safe area (center 80%)
- [ ] Icons look good on both light and dark backgrounds
- [ ] Icons are recognizable at small sizes
- [ ] Files placed in `public/` directory
- [ ] Manifest updated (if needed)
- [ ] Tested on multiple devices

## Testing Icons

### Desktop
1. Install PWA
2. Check icon in:
   - Applications folder (macOS)
   - Start menu (Windows)
   - App drawer (Linux)

### Mobile
1. Add to home screen
2. Check icon appearance
3. Verify no cropping of important elements

### Browser
1. Open DevTools
2. Application > Manifest
3. Preview icons
4. Check for warnings

## Current Placeholder

The current SVG icon features:
- Black background
- Cream geometric gear design
- Art Deco corner accents
- Letter "M" for Metropolis
- Industrial aesthetic

This is functional but basic. A custom-designed icon will make the app more professional and recognizable.
