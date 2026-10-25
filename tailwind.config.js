/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./popup.html",
    "./dashboard.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          base: '#000000',
          canvas: '#09090B',
          surface: '#121215',
          elevated: '#18181B',
          card: '#141417',
          hover: '#1F1F23',
          border: 'rgba(255, 255, 255, 0.09)',
          borderHover: 'rgba(255, 255, 255, 0.18)',
          white: '#FFFFFF',
          muted: '#71717A',
        },
        health: {
          good: '#FFFFFF',
          warning: '#FBBF24',
          critical: '#FB7185',
          info: '#38BDF8',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.15s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(2px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      }
    },
  },
  plugins: [],
}
