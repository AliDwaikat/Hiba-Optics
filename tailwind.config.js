/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Brand palette — sourced from CSS variables defined in src/styles/global.css.
        // Never hardcode hex values in components; reference these tokens instead.
        yellow: 'var(--color-yellow)',
        'yellow-deep': 'var(--color-yellow-deep)',
        ink: 'var(--color-ink)',
        black: 'var(--color-black)',
        white: 'var(--color-white)',
        cream: 'var(--color-cream)',
        'gray-900': 'var(--color-gray-900)',
        'gray-600': 'var(--color-gray-600)',
        'gray-300': 'var(--color-gray-300)',
        'gray-100': 'var(--color-gray-100)',
        success: 'var(--color-success)',
        error: 'var(--color-error)',
      },
      fontFamily: {
        // Tajawal drives everything — Arabic, Latin names, and numbers.
        sans: ['Tajawal', 'system-ui', 'sans-serif'],
        base: ['Tajawal', 'system-ui', 'sans-serif'],
        latin: ['Tajawal', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: 'var(--shadow-card)',
      },
    },
  },
  plugins: [],
}
