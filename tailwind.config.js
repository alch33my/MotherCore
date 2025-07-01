/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'matrix-black': '#0a0a0a',
        'matrix-dark-gray': '#1a1a1a',
        'matrix-green': '#00ff41',
        'matrix-gold': '#ffd700',
        'matrix-amber': '#ffb000',
        'matrix-error': '#ff4444',
        'matrix-success': '#44ff44',
        'matrix-white': '#ffffff',
        'gold': '#ffd700',
        'amber': '#ffb000',
        'success': '#44ff44',
        'error': '#ff4444',
      },
      backgroundImage: {
        'matrix-rain': 'linear-gradient(to bottom, rgba(0,255,65,0.1), rgba(255,215,0,0.2))',
      },
      fontFamily: {
        'mono': ['Fira Code', 'monospace'],
      },
      animation: {
        'matrix-fall': 'matrix-rain 10s linear infinite',
      },
      keyframes: {
        'matrix-rain': {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        }
      },
      boxShadow: {
        'matrix': '0 0 10px rgba(255, 215, 0, 0.3)',
      },
      backdropBlur: {
        'xs': '2px',
      }
    },
  },
  plugins: [],
} 