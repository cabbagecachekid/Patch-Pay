/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./web/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Design System Colors
        'metropolis-black': '#000000',
        'metropolis-deep': '#0a0a0a',
        'metropolis-steel': '#2a2a2a',
        'metropolis-cream': '#f0e6d2',
        'metropolis-beige': '#d4c5b0',
        'metropolis-white': '#f5f5f5',
        'metropolis-danger': '#ff4444',
        'metropolis-panel': '#1a1a1a',
        'metropolis-border': '#3a3a3a',
        // Amber/Gold (Primary Brand)
        'metropolis-amber': {
          100: '#FEF3C7',
          400: '#FBBF24',
          500: '#F59E0B',
          600: '#D97706',
          700: '#B45309',
          950: '#451A03',
        },
      },
      fontFamily: {
        'heading': ['Impact', 'Arial Black', 'sans-serif'],
        'deco': ['Futura', 'Century Gothic', 'sans-serif'],
        'mono': ['Courier New', 'monospace'],
      },
      boxShadow: {
        'industrial': '0 4px 6px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
        'gauge': 'inset 0 2px 4px rgba(0, 0, 0, 0.6)',
        'brass': '0 2px 8px rgba(139, 105, 20, 0.3)',
      },
    },
  },
  plugins: [],
}
