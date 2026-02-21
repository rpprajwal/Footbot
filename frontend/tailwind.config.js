/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
    './public/index.html'
  ],
  theme: {
    extend: {
      colors: {
        pitch: {
          dark: '#0a1910',
          base: '#0d2416',
          light: '#143424'
        },
        neon: {
          green: '#00ff66',
          dark: '#00cc52',
          glow: 'rgba(0, 255, 102, 0.4)'
        }
      },
      fontFamily: {
        display: ['Bebas Neue', 'sans-serif'],
        body: ['Outfit', 'sans-serif']
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}

