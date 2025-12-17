/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  safelist: [
    // Badge variants - ensure these classes are always generated
    'bg-primary-100', 'text-primary-800', 'bg-primary-900/30', 'text-primary-400',
    'bg-success-100', 'text-success-800', 'bg-success-900/30', 'text-success-400',
    'bg-warning-100', 'text-warning-800', 'bg-warning-900/30', 'text-warning-400',
    'bg-danger-100', 'text-danger-800', 'bg-danger-900/30', 'text-danger-400',
    'bg-info-100', 'text-info-800', 'bg-info-900/30', 'text-info-400',
    'bg-gray-100', 'text-gray-800', 'bg-gray-800', 'text-gray-300',
  ],
  theme: {
    extend: {
      colors: {
        // Primary - Dinámico desde branding (CSS variables con fallback VERDE)
        // Fallbacks: Verde corporativo #16A34A (success-600)
        primary: {
          50: 'rgb(var(--color-primary-50, 240 253 244) / <alpha-value>)',
          100: 'rgb(var(--color-primary-100, 220 252 231) / <alpha-value>)',
          200: 'rgb(var(--color-primary-200, 187 247 208) / <alpha-value>)',
          300: 'rgb(var(--color-primary-300, 134 239 172) / <alpha-value>)',
          400: 'rgb(var(--color-primary-400, 74 222 128) / <alpha-value>)',
          500: 'rgb(var(--color-primary-500, 34 197 94) / <alpha-value>)',
          600: 'rgb(var(--color-primary-600, 22 163 74) / <alpha-value>)',
          700: 'rgb(var(--color-primary-700, 21 128 61) / <alpha-value>)',
          800: 'rgb(var(--color-primary-800, 22 101 52) / <alpha-value>)',
          900: 'rgb(var(--color-primary-900, 20 83 45) / <alpha-value>)',
          950: 'rgb(var(--color-primary-950, 5 46 22) / <alpha-value>)',
        },
        // Grises Neutrales
        gray: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
          950: '#030712',
        },
        // Estados
        success: {
          50: '#f0fdf4',
          100: '#dcfce7',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        danger: {
          50: '#fef2f2',
          100: '#fee2e2',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
        },
        info: {
          50: '#eff6ff',
          100: '#dbeafe',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        heading: ['Montserrat', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
      },
      boxShadow: {
        'sm': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        'DEFAULT': '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        'md': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        'lg': '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
        'xl': '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
      },
      borderRadius: {
        'lg': '0.5rem',
        'xl': '0.75rem',
        '2xl': '1rem',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}
