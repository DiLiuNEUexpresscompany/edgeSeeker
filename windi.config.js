import { defineConfig } from 'windicss/helpers';

export default defineConfig({
  darkMode: 'class',
  theme: {
    fontFamily: {
      sans: ['DM Sans', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      display: ['Cabinet Grotesk', 'DM Sans', 'ui-sans-serif', 'system-ui'],
      mono: ['JetBrains Mono', 'monospace'],
    },
    extend: {
      colors: {
        primary: {
          light: '#f472b6', // Pink 400
          DEFAULT: '#db2777', // Pink 600
          dark: '#4c1d95',   // Purple 900
        },
        surface: {
          light: '#ffffff',
          DEFAULT: '#f9fafb',
          dark: '#f3f4f6',
        },
        accent: {
          purple: '#6d28d9', // Rich purple
          magenta: '#ec4899', // Bright magenta/pink
          violet: '#8b5cf6', // Violet
          midnight: '#312e81', // Indigo 950
        },
      },
      borderRadius: {
        '4xl': '2rem',
      },
      boxShadow: {
        'bento': '0 2px 10px rgba(0, 0, 0, 0.04), 0 0 1px rgba(0, 0, 0, 0.1)',
        'bento-hover': '0 5px 20px rgba(0, 0, 0, 0.08), 0 0 1px rgba(0, 0, 0, 0.1)',
        'floating': '0 10px 30px -5px rgba(0, 0, 0, 0.1), 0 0 5px rgba(0, 0, 0, 0.05)',
        'glow': '0 0 15px rgba(236, 72, 153, 0.5)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'fade-out': 'fadeOut 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'slide-left': 'slideLeft 0.3s ease-out',
        'slide-right': 'slideRight 0.3s ease-out',
        'progress-bar': 'progressBar 6s linear',
        'progress-step': 'progressStep 60ms linear',
        'spin-clockwise': 'spinClockwise 1.2s linear infinite',
        'spin-counterclockwise': 'spinCounterclockwise 1s linear infinite',
        'shimmer': 'shimmer 2s infinite',
        'float': 'float 3s ease-in-out infinite',
        'scale': 'scale 0.2s ease-out',
        'pulse-glow': 'pulseGlow 2s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeOut: {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideLeft: {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideRight: {
          '0%': { opacity: '0', transform: 'translateX(-20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        progressBar: {
          '0%': { width: '0%' },
          '100%': { width: '100%' },
        },
        progressStep: {
          '0%': { width: '0%' },
          '100%': { width: '1%' }, // Incremental progress
        },
        spinClockwise: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        spinCounterclockwise: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(-360deg)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        scale: {
          '0%': { transform: 'scale(1)' },
          '100%': { transform: 'scale(1.1)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 5px rgba(236, 72, 153, 0.2), 0 0 0 rgba(236, 72, 153, 0)' },
          '50%': { boxShadow: '0 0 20px rgba(236, 72, 153, 0.6), 0 0 10px rgba(236, 72, 153, 0.2)' },
        },
      },
      transitionProperty: {
        'opacity-transform': 'opacity, transform',
        'width': 'width',
        'spacing': 'margin, padding',
        'colors': 'color, background-color, border-color, text-decoration-color, fill, stroke',
        'shadow': 'box-shadow',
        'all-smooth': 'all',
      },
      transitionTimingFunction: {
        'ease-out': 'ease-out',
        'ease-in-out': 'ease-in-out',
        'bounce': 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      transitionDuration: {
        '50': '50ms',
        '150': '150ms',
        '250': '250ms',
        '350': '350ms',
        '450': '450ms',
      },
      backgroundImage: {
        'shimmer-gradient': 'linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)',
        'diagonal-gradient': 'linear-gradient(135deg, var(--tw-gradient-stops))',
        'radial-gradient': 'radial-gradient(circle, var(--tw-gradient-stops))',
      },
      backgroundSize: {
        'shimmer': '200% 100%',
      },
      scrollbarHide: {
        '.scrollbar-hide': {
          '-ms-overflow-style': 'none', // IE and Edge
          'scrollbar-width': 'none', // Firefox
        },
        '.scrollbar-hide::-webkit-scrollbar': {
          'display': 'none', // Chrome, Safari, Opera
        },
      },
    },
  },
  plugins: [
    require('windicss/plugin/typography'),
    require('windicss/plugin/forms'),
    require('windicss/plugin/line-clamp'),
    require('windicss/plugin/aspect-ratio'),
  ],
});