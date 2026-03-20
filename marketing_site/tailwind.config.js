/** @type {import('tailwindcss').Config} */
import responsiveConfig from './src/config/responsive.config';

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    screens: {
      xs: '375px', // Mobile small (iPhone SE/12/13)
      sm: '640px', // Mobile large to tablet small
      md: '768px', // Tablet
      lg: '1024px', // Desktop small
      xl: '1280px', // Desktop standard
      '2xl': '1536px', // Desktop large
    },
    extend: {
      spacing: {
        // Professional spacing system for marketing site
        'section-xs': '2rem', // 32px - Small sections
        'section-sm': '3rem', // 48px - Regular sections
        'section-md': '4rem', // 64px - Main sections
        'section-lg': '5rem', // 80px - Hero sections
        'section-xl': '6rem', // 96px - Special sections

        // Component spacing
        'card-sm': '1rem', // 16px - Tight card padding
        'card-md': '1.5rem', // 24px - Standard card padding
        'card-lg': '2rem', // 32px - Large card padding

        // Container spacing
        'container-sm': '1rem', // Mobile container padding
        'container-md': '1.5rem', // Tablet container padding
        'container-lg': '2rem', // Desktop container padding

        // Touch-friendly sizes
        11: '2.75rem', // 44px - Minimum touch target
        12: '3rem', // 48px - Comfortable touch target
        13: '3.25rem', // 52px - Large touch target
        15: '3.75rem', // 60px - Extra large touch target
      },
      colors: {
        // StrateKaz Minimalista - Negro/Blanco/Rosa
        black: {
          deep: '#000000', // Fondo principal
          card: '#0a0a0a', // Cards/contenedores
          'card-soft': '#151515', // Cards más suaves
          hover: '#1a1a1a', // Hover states
          'hover-soft': '#121212', // Hover más sutil
          border: '#2a2a2a', // Bordes sutiles
          'border-soft': '#333333', // Bordes más suaves
        },
        white: '#ffffff', // Standard white color
        'white-text': '#ffffff', // Texto principal
        'white-text-soft': '#e5e5e5', // Texto secundario
        'white-muted': '#cccccc', // Texto terciario
        'white-muted-soft': '#b3b3b3', // Texto aún más suave
        'white-soft': '#f5f5f5', // Texto muy suave
        brand: {
          50: '#fdf2f8',
          100: '#fce7f3',
          200: '#fbcfe8',
          300: '#f9a8d4',
          400: '#f472b6',
          500: '#ec268f', // Rosa StrateKaz principal
          600: '#db2777',
          700: '#be185d',
          800: '#9d174d',
          900: '#831843',
        },
        // Colores de acento para UI
        accent: {
          icon: '#a855f7', // Color para iconos neutrales
          success: '#22c55e', // Verde para checkmarks
        },
        // Sistema de colores de éxito
        success: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        // Colores para servicios
        blue: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6', // Azul para ISO
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        system: {
          blue: {
            500: '#3b82f6', // Azul del sistema para ISO
          },
          red: {
            500: '#ef4444', // Rojo del sistema para auditorías
          },
          orange: {
            500: '#f97316', // Naranja del sistema para capacitación
          },
          purple: {
            500: '#a855f7', // Morado del sistema para proyectos
          },
          yellow: {
            50: '#fefce8',
            100: '#fef9c3',
            200: '#fef08a',
            300: '#fde047',
            400: '#facc15',
            500: '#eab308', // Amarillo para SST
            600: '#ca8a04',
            700: '#a16207',
            800: '#854d0e',
            900: '#713f12',
          },
        },
        red: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444', // Rojo para PESV
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
        },
        orange: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316', // Naranja para Transformación Digital
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
        },
        green: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e', // Verde para Profesionales Independientes
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        purple: {
          50: '#faf5ff',
          100: '#f3e8ff',
          200: '#e9d5ff',
          300: '#d8b4fe',
          400: '#c084fc',
          500: '#a855f7', // Morado para Emprendedores
          600: '#9333ea',
          700: '#7c3aed',
          800: '#6b21a8',
          900: '#581c87',
        },
      },
      fontSize: {
        // Mobile-first typography scale
        xs: ['0.75rem', { lineHeight: '1rem' }], // 12px
        sm: ['0.875rem', { lineHeight: '1.25rem' }], // 14px
        base: ['1rem', { lineHeight: '1.5rem' }], // 16px
        lg: ['1.125rem', { lineHeight: '1.75rem' }], // 18px
        xl: ['1.25rem', { lineHeight: '1.75rem' }], // 20px
        '2xl': ['1.5rem', { lineHeight: '2rem' }], // 24px
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }], // 30px
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }], // 36px
        '5xl': ['3rem', { lineHeight: '1' }], // 48px
        '6xl': ['3.75rem', { lineHeight: '1' }], // 60px
        '7xl': ['4.5rem', { lineHeight: '1' }], // 72px
        '8xl': ['6rem', { lineHeight: '1' }], // 96px

        // Fluid Typography - Smooth scaling between breakpoints
        'fluid-xs': [
          'clamp(0.75rem, 0.7rem + 0.25vw, 0.875rem)',
          { lineHeight: '1.4' },
        ], // 12px -> 14px
        'fluid-sm': [
          'clamp(0.875rem, 0.8rem + 0.375vw, 1rem)',
          { lineHeight: '1.5' },
        ], // 14px -> 16px
        'fluid-base': [
          'clamp(1rem, 0.875rem + 0.625vw, 1.25rem)',
          { lineHeight: '1.6' },
        ], // 16px -> 20px
        'fluid-lg': [
          'clamp(1.125rem, 0.875rem + 1.25vw, 1.875rem)',
          { lineHeight: '1.5' },
        ], // 18px -> 30px
        'fluid-xl': [
          'clamp(1.25rem, 0.75rem + 2.5vw, 2.25rem)',
          { lineHeight: '1.4' },
        ], // 20px -> 36px
        'fluid-2xl': [
          'clamp(1.5rem, 0.5rem + 5vw, 3rem)',
          { lineHeight: '1.3' },
        ], // 24px -> 48px
        'fluid-3xl': [
          'clamp(1.875rem, 0.25rem + 8.125vw, 3.75rem)',
          { lineHeight: '1.2' },
        ], // 30px -> 60px
        'fluid-4xl': [
          'clamp(2.25rem, 0rem + 11.25vw, 4.5rem)',
          { lineHeight: '1.1' },
        ], // 36px -> 72px
        'fluid-5xl': [
          'clamp(2.5rem, 0rem + 12.5vw, 6rem)',
          { lineHeight: '1' },
        ], // 40px -> 96px
        'fluid-hero': [
          'clamp(2.5rem, 1rem + 7.5vw, 6rem)',
          { lineHeight: '1.1' },
        ], // Hero optimized
      },
      fontFamily: {
        title: ['Montserrat', 'sans-serif'], // Títulos
        content: ['Inter', 'sans-serif'], // Contenido
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        flow: 'flow 3s ease-in-out infinite',
        'line-pulse': 'linePulse 2s ease-in-out infinite',
        shimmer: 'shimmer 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        flow: {
          '0%, 100%': { transform: 'translateX(-100%)', opacity: '0' },
          '50%': { transform: 'translateX(0)', opacity: '1' },
        },
        linePulse: {
          '0%, 100%': { opacity: '0.3' },
          '50%': { opacity: '0.8' },
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
      },
      maxWidth: {
        // Mobile-first container system
        container: '100%',
        'container-xs': '100%',
        'container-sm': '640px',
        'container-md': '768px',
        'container-lg': '1024px',
        'container-xl': '1280px',
        'container-2xl': '1536px',

        // Content widths for readability
        'content-prose': '65ch', // For article/blog content
        'content-narrow': '42rem', // 672px - for CTAs and focused content
        'content-normal': '48rem', // 768px - for general content
        'content-wide': '64rem', // 1024px - for wider content sections

      },
    },
  },
  plugins: [],
};
