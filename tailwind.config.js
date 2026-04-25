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
        'bookvault-primary': 'var(--color-primary)',
        'bookvault-primary-container': 'var(--color-primary-container)',
        'bookvault-surface': 'var(--color-surface)',
        'bookvault-surface-low': 'var(--color-surface-low)',
        'bookvault-surface-lowest': 'var(--color-surface-lowest)',
        'bookvault-secondary': 'var(--color-secondary)',
        'bookvault-tertiary': 'var(--color-tertiary)',
        'on-primary': 'var(--color-on-primary)',
        'on-surface': 'var(--color-on-surface)',
        'on-surface-variant': 'var(--color-on-surface-variant)',
        'outline-variant': 'var(--color-outline-variant)',
      },
      fontFamily: {
        serif: ['"Noto Serif"', 'serif'],
        sans: ['"Manrope"', 'sans-serif'],
      },
      borderRadius: {
        'book': '1rem',
      },
      boxShadow: {
        'premium': 'var(--shadow-premium)',
      }
    },
  },
  plugins: [],
}
