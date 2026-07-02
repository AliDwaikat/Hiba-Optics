/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Brand palette — sourced from CSS variables defined in src/styles/global.css.
        // Never hardcode hex values in components; reference these tokens instead.
        gold: 'var(--color-gold)',
        'gold-deep': 'var(--color-gold-deep)',
        black: 'var(--color-black)',
        white: 'var(--color-white)',
        'gray-900': 'var(--color-gray-900)',
        'gray-500': 'var(--color-gray-500)',
        'gray-100': 'var(--color-gray-100)',
      },
      fontFamily: {
        // Tajawal drives Arabic; Inter carries Latin text and Western digits.
        sans: ['Tajawal', 'Inter', 'system-ui', 'sans-serif'],
        latin: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
