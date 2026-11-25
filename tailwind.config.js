/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          light: '#FBF7F0',
          dark: '#15171B',
        },
        surface: {
          light: '#FFFFFF',
          dark: '#1F2228',
        },
        ink: {
          light: '#1F2328',
          dark: '#F5F1EA',
        },
        muted: {
          light: '#716C74',
          dark: '#A6A2AC',
        },
        accent: {
          DEFAULT: '#1E46E6',
          light: '#E4EBFF',
          dark: '#6E8CFF',
        },
        coral: {
          DEFAULT: '#FF6B4A',
          light: '#FFE8E1',
          dark: '#FF8A6B',
        },
        teal: {
          DEFAULT: '#0E9E78',
          light: '#DFF7F0',
          dark: '#3FD6A8',
        },
        amber: {
          DEFAULT: '#C97A1A',
          light: '#FDF1DC',
          dark: '#F2B35B',
        },
        plum: {
          DEFAULT: '#B14C85',
          light: '#FBE7F0',
          dark: '#E07CB6',
        },
        border: {
          light: '#EBE4D8',
          dark: '#2E3137',
        },
      },
      fontFamily: {
        display: ['"Newsreader"', 'ui-serif', 'Georgia', 'serif'],
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        card: '20px',
        tile: '14px',
      },
      boxShadow: {
        soft: '0 2px 10px -2px rgba(31, 35, 40, 0.07), 0 1px 2px rgba(31, 35, 40, 0.05)',
        softDark: '0 2px 14px -2px rgba(0, 0, 0, 0.45)',
        lift: '0 12px 28px -8px rgba(30, 70, 230, 0.18)',
        liftDark: '0 12px 28px -8px rgba(0, 0, 0, 0.55)',
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
        'confetti-pop': {
          '0%': { transform: 'scale(0) rotate(0deg)', opacity: '0' },
          '50%': { transform: 'scale(1.2) rotate(10deg)', opacity: '1' },
          '100%': { transform: 'scale(1) rotate(0deg)', opacity: '1' },
        },
      },
      animation: {
        'pop-in': 'pop-in 0.25s ease-out',
        'fade-up': 'fade-up 0.3s ease-out',
        'confetti-pop': 'confetti-pop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
    },
  },
  plugins: [],
}
