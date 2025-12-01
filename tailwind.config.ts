import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Monad Official Colors
        monad: {
          purple: '#836EF9',
          'purple-light': '#A594FF',
          'purple-dark': '#5B3FD9',
          violet: '#9B87F5',
          indigo: '#6366F1',
        },
        // Dark theme colors inspired by GMGN.ai
        dark: {
          bg: '#0D0D0F',
          'bg-secondary': '#131316',
          'bg-tertiary': '#1A1A1F',
          card: '#16161A',
          'card-hover': '#1E1E24',
          border: '#2A2A32',
          'border-light': '#3A3A45',
        },
        // Text colors
        text: {
          primary: '#FFFFFF',
          secondary: '#A1A1AA',
          muted: '#71717A',
        },
        // Status colors
        status: {
          success: '#22C55E',
          'success-bg': 'rgba(34, 197, 94, 0.1)',
          error: '#EF4444',
          'error-bg': 'rgba(239, 68, 68, 0.1)',
          warning: '#F59E0B',
          'warning-bg': 'rgba(245, 158, 11, 0.1)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      backgroundImage: {
        'gradient-monad': 'linear-gradient(135deg, #836EF9 0%, #5B3FD9 100%)',
        'gradient-card': 'linear-gradient(180deg, rgba(131, 110, 249, 0.05) 0%, transparent 100%)',
      },
      boxShadow: {
        'glow-purple': '0 0 20px rgba(131, 110, 249, 0.3)',
        'glow-purple-lg': '0 0 40px rgba(131, 110, 249, 0.4)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}

export default config
