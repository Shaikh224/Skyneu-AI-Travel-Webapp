/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'skyneu-blue': '#118DFF',
        'skyneu-green': '#18CB96',
        'skyneu-dark': '#2B2B2B',
        'skyneu-text': '#6F7C8F',
        'skyneu-light': '#F2F2F2',
        // Dark mode colors
        'dark-bg': '#0F0F0F',
        'dark-surface': '#1A1A1A',
        'dark-card': '#262626',
        'dark-hover': '#303030',
        'dark-border': '#2A2A2A',
        'dark-text': '#E5E5E5',
        'dark-text-secondary': '#A0A0A0',
      },
      fontFamily: {
        'poppins': ['Poppins', 'sans-serif'],
        'inter': ['Inter', 'sans-serif'],
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
    },
  },
  plugins: [],
};