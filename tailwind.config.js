/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: 'var(--theme-primaryLight)',
          500: 'var(--theme-primary)',
          600: 'var(--theme-primaryHover)',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        // blueカラーをテーマカラーにマッピング
        blue: {
          400: 'var(--theme-primaryLight)',
          500: 'var(--theme-primary)',
          600: 'var(--theme-primaryHover)',
        },
        // その他のテーマカラー
        violet: {
          500: 'var(--theme-secondary)',
        },
        purple: {
          500: 'var(--theme-secondary)',
        },
        green: {
          500: 'var(--theme-success)',
        },
        red: {
          500: 'var(--theme-error)',
        },
        amber: {
          500: 'var(--theme-warning)',
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-in': 'slideIn 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
