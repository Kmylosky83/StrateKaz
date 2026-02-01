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
    'bg-secondary-100', 'text-secondary-800', 'bg-secondary-900/30', 'text-secondary-400',
    'bg-accent-100', 'text-accent-800', 'bg-accent-900/30', 'text-accent-400',
    'bg-success-100', 'text-success-800', 'bg-success-900/30', 'text-success-400',
    'bg-warning-100', 'text-warning-800', 'bg-warning-900/30', 'text-warning-400',
    'bg-danger-100', 'text-danger-800', 'bg-danger-900/30', 'text-danger-400',
    'bg-info-100', 'text-info-800', 'bg-info-900/30', 'text-info-400',
    'bg-gray-100', 'text-gray-800', 'bg-gray-800', 'text-gray-300',
  ],
  theme: {
    extend: {
      colors: {
        // Primary - Dinámico desde branding (CSS variables con fallback ROSA StrateKaz)
        // Fallbacks: Rosa StrateKaz #ec268f
        primary: {
          50: 'rgb(var(--color-primary-50, 253 242 248) / <alpha-value>)',
          100: 'rgb(var(--color-primary-100, 252 231 243) / <alpha-value>)',
          200: 'rgb(var(--color-primary-200, 251 207 232) / <alpha-value>)',
          300: 'rgb(var(--color-primary-300, 249 168 212) / <alpha-value>)',
          400: 'rgb(var(--color-primary-400, 244 114 182) / <alpha-value>)',
          500: 'rgb(var(--color-primary-500, 236 38 143) / <alpha-value>)',
          600: 'rgb(var(--color-primary-600, 219 39 119) / <alpha-value>)',
          700: 'rgb(var(--color-primary-700, 190 24 93) / <alpha-value>)',
          800: 'rgb(var(--color-primary-800, 157 23 77) / <alpha-value>)',
          900: 'rgb(var(--color-primary-900, 131 24 67) / <alpha-value>)',
          950: 'rgb(var(--color-primary-950, 80 7 36) / <alpha-value>)',
        },
        // Secondary - Dinámico desde branding (CSS variables con fallback GRIS)
        // Fallbacks: Tonos de gris neutral
        secondary: {
          50: 'rgb(var(--color-secondary-50, 250 250 250) / <alpha-value>)',
          100: 'rgb(var(--color-secondary-100, 245 245 245) / <alpha-value>)',
          200: 'rgb(var(--color-secondary-200, 229 231 235) / <alpha-value>)',
          300: 'rgb(var(--color-secondary-300, 209 213 219) / <alpha-value>)',
          400: 'rgb(var(--color-secondary-400, 156 163 175) / <alpha-value>)',
          500: 'rgb(var(--color-secondary-500, 107 114 128) / <alpha-value>)',
          600: 'rgb(var(--color-secondary-600, 75 85 99) / <alpha-value>)',
          700: 'rgb(var(--color-secondary-700, 55 65 81) / <alpha-value>)',
          800: 'rgb(var(--color-secondary-800, 31 41 55) / <alpha-value>)',
          900: 'rgb(var(--color-secondary-900, 17 24 39) / <alpha-value>)',
          950: 'rgb(var(--color-secondary-950, 3 7 18) / <alpha-value>)',
        },
        // Accent - Dinámico desde branding (CSS variables con fallback AMARILLO/ÁMBAR)
        // Fallbacks: Tonos de amarillo/ámbar
        accent: {
          50: 'rgb(var(--color-accent-50, 255 251 235) / <alpha-value>)',
          100: 'rgb(var(--color-accent-100, 254 243 199) / <alpha-value>)',
          200: 'rgb(var(--color-accent-200, 253 230 138) / <alpha-value>)',
          300: 'rgb(var(--color-accent-300, 252 211 77) / <alpha-value>)',
          400: 'rgb(var(--color-accent-400, 251 191 36) / <alpha-value>)',
          500: 'rgb(var(--color-accent-500, 245 158 11) / <alpha-value>)',
          600: 'rgb(var(--color-accent-600, 217 119 6) / <alpha-value>)',
          700: 'rgb(var(--color-accent-700, 180 83 9) / <alpha-value>)',
          800: 'rgb(var(--color-accent-800, 146 64 14) / <alpha-value>)',
          900: 'rgb(var(--color-accent-900, 120 53 15) / <alpha-value>)',
          950: 'rgb(var(--color-accent-950, 69 26 3) / <alpha-value>)',
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
      // Animaciones del Design System
      animation: {
        // Pulse sutil para skeletons - más lento y suave que el default
        'pulse-subtle': 'pulse-subtle 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        'pulse-subtle': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}
