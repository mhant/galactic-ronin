/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        space: {
          900: '#030712',
          800: '#0B1120',
          700: '#151F38',
          600: '#1E2B4D',
        },
        hud: {
          cyan: '#00F0FF',
          blue: '#0070F3',
          green: '#00FF66',
          yellow: '#FFDD00',
          amber: '#FF9900',
          red: '#FF3366',
          purple: '#A855F7',
        }
      },
      fontFamily: {
        mono: ['Courier New', 'Consolas', 'Menlo', 'monospace'],
      },
      boxShadow: {
        'glow-cyan': '0 0 15px rgba(0, 240, 255, 0.4)',
        'glow-green': '0 0 15px rgba(0, 255, 102, 0.4)',
        'glow-red': '0 0 15px rgba(255, 51, 102, 0.4)',
        'glow-amber': '0 0 15px rgba(255, 153, 0, 0.4)',
      }
    },
  },
  plugins: [],
}
