import { defineConfig } from 'windicss/helpers'

export default defineConfig({
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Terminal palette
        'terminal': {
          'bg': '#000000',
          'bg-secondary': '#0a0a0a',
          'border': '#333333',
          'text': '#ffffff',
          'muted': '#555555',
        },
        'accent': {
          'green': '#00ff00',
          'red': '#ff0000',
          'cyan': '#00ffff',
          'yellow': '#ffff00',
          'orange': '#ff8800',
          'purple': '#ff00ff',
        }
      },
      fontFamily: {
        'mono': ['JetBrains Mono', 'Fira Code', 'Courier New', 'monospace'],
      },
      animation: {
        'pulse': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'blink': 'blink 1s step-end infinite',
        'scroll': 'scroll 30s linear infinite',
      },
      keyframes: {
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
        scroll: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        }
      }
    },
  },
  plugins: [],
  extract: {
    include: ['src/**/*.{js,jsx,ts,tsx}'],
  },
})
