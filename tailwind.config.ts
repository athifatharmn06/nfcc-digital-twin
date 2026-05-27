import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        nfcc: {
          cyan:  '#06b6d4',
          green: '#10b981',
          red:   '#f43f5e',
          amber: '#f59e0b',
          blue:  '#3b82f6',
          bg:    '#060c18',
          panel: 'rgba(8,16,32,0.92)',
          card:  'rgba(10,20,40,0.65)',
        },
      },
      fontFamily: {
        display: ['Orbitron', 'ui-monospace', 'monospace'],
        mono:    ['JetBrains Mono', 'Fira Code', 'ui-monospace', 'Consolas', 'monospace'],
        sans:    ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'neon-cyan':  '0 0 8px rgba(6,182,212,0.5),  0 0 24px rgba(6,182,212,0.15)',
        'neon-green': '0 0 8px rgba(16,185,129,0.5), 0 0 24px rgba(16,185,129,0.15)',
        'neon-red':   '0 0 8px rgba(244,63,94,0.6),  0 0 24px rgba(244,63,94,0.20)',
        'neon-amber': '0 0 8px rgba(245,158,11,0.5), 0 0 24px rgba(245,158,11,0.15)',
      },
      animation: {
        'pulse-slow':    'pulse 3s cubic-bezier(0.4,0,0.6,1) infinite',
        'spin-slow':     'spin 8s linear infinite',
        'blink':         'blink 1s step-end infinite',
        'slide-in-left': 'slideInLeft 0.25s ease-out',
        'fade-in':       'fadeIn 0.3s ease-out',
      },
      keyframes: {
        blink: {
          '0%,100%': { opacity: '1' },
          '50%':     { opacity: '0' },
        },
        slideInLeft: {
          from: { opacity: '0', transform: 'translateX(-10px)' },
          to:   { opacity: '1', transform: 'translateX(0)' },
        },
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(3px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
};

export default config;
