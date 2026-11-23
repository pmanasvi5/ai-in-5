/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          light: '#FAF9F6',
          dark: '#1C1B1F',
        },
        surface: {
          light: '#FFFFFF',
          dark: '#262429',
        },
        ink: {
          light: '#242424',
          dark: '#F2F1F5',
        },
        muted: {
          light: '#6B6670',
          dark: '#A9A5B0',
        },
        accent: {
          DEFAULT: '#8B7CE8',
          light: '#DCEBFA',
          dark: '#A897F2',
        },
        sage: '#A8C3A0',
        peach: '#F0C4A8',
        border: {
          light: '#ECE9E4',
          dark: '#36343B',
        },
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        card: '18px',
      },
      boxShadow: {
        soft: '0 2px 10px -2px rgba(36, 36, 36, 0.06), 0 1px 2px rgba(36, 36, 36, 0.04)',
        softDark: '0 2px 10px -2px rgba(0, 0, 0, 0.4)',
      },
      keyframes: {
        'pop-in': {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'fade-up': {
          '0%': { transform: 'translateY(6px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      animation: {
        'pop-in': 'pop-in 0.25s ease-out',
        'fade-up': 'fade-up 0.3s ease-out',
      },
    },
  },
  plugins: [],
}
