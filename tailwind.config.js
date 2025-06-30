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
      },
      backgroundImage: {
        'matrix-rain': 'linear-gradient(to bottom, rgba(0,255,65,0.1), rgba(255,215,0,0.2))',
      },
      fontFamily: {
        'matrix': ['Courier New', 'monospace'],
      },
      animation: {
        'matrix-fall': 'matrix-rain 10s linear infinite',
      },
      keyframes: {
        'matrix-rain': {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        }
      }
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
} 