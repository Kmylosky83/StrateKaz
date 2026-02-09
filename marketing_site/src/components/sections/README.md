# FinalCTASection Component

## Overview

Componente optimizado de la sección final de call-to-action que implementa el design system
StrateKaz minimalista. Reemplaza la sección inline anterior con un componente independiente y
reutilizable.

## Design System StrateKaz Minimalista

### Colores Aplicados

- **Fondo principal**: `bg-black-deep` (#000000)
- **Card container**: `bg-black-card` (#0a0a0a)
- **Bordes sutiles**: `border-black-border` (#2a2a2a)
- **Texto principal**: `text-white-text` (#ffffff)
- **Texto secundario**: `text-white-muted` (#e5e5e5)
- **Texto terciario**: `text-white-soft` (#f5f5f5)
- **Rosa accent**: `bg-brand-500` (#ec268f) - SOLO para icono Award y TrialCTA

### Tipografía

- **Títulos**: `font-title` (Montserrat)
- **Contenido**: `font-content` (Inter)

## Características

### ✅ Eliminado

- Fondo blanco no consistente con design system
- Gradientes agresivos (from-brand-50 to-brand-100)
- Hardcoding de contenido en JSX
- Importaciones innecesarias (Button, Globe, Award inline)

### ✅ Implementado

- **Componente independiente** en `src/components/sections/FinalCTASection.tsx`
- **Design system consistente** con fondo negro y card minimalista
- **Rosa controlado** - solo en icono Award y TrialCTA button
- **Contenido configurable** vía constante FINAL_CTA_CONTENT
- **Props interface completa** con TypeScript y JSDoc
- **Layout profesional** optimizado para empresas ISO/BPM

### Contenido Empresarial

- Enfocado en compliance ISO 9001/14001
- Benefits específicos para auditorías
- Trust indicators profesionales
- Call-to-action empresarial

## Usage

```tsx
import { FinalCTASection } from '@components/sections/FinalCTASection'

// Uso básico
<FinalCTASection
  onTrialStart={() => handleTrialStart()}
  onDemoClick={handleDemoRequest}
/>

// Con contenido personalizado
<FinalCTASection
  onTrialStart={() => handleTrialStart()}
  onDemoClick={handleDemoRequest}
  title="Custom Title"
  subtitle="Custom subtitle content"
/>
```

## Props Interface

```typescript
interface FinalCTASectionProps {
  /** Handler for trial start button click */
  onTrialStart: () => void;
  /** Handler for demo request button click */
  onDemoClick: () => void;
  /** Optional custom title override */
  title?: string;
  /** Optional custom subtitle override */
  subtitle?: string;
}
```

## Design Principles

1. **Minimalismo**: Fondo negro profundo sin distracciones
2. **Jerarquía Visual**: Rosa solo en elementos clave (icono + CTA principal)
3. **Profesionalidad**: Contenido empresarial enfocado en compliance
4. **Tipografía Clara**: Montserrat para títulos, Inter para contenido
5. **Spacing Consistente**: py-16 lg:py-20 para breathing room
6. **Responsividad**: Layout adaptable mobile-first

## Integración

El componente ha sido:

- ✅ Exportado en `src/components/index.ts`
- ✅ Integrado en `LandingPage.tsx` reemplazando sección inline
- ✅ Mantenidas todas las funcionalidades originales
- ✅ Aplicado design system StrateKaz consistentemente

## Visual Structure

```
FinalCTASection
├── Section (bg-black-deep, py-16 lg:py-20)
│   └── Container (max-w-4xl, centered)
│       └── Card (bg-black-card, border-black-border, rounded-3xl)
│           ├── Award Icon (bg-brand-500) [ÚNICO ELEMENTO ROSA]
│           ├── Title (font-title, text-white-text)
│           ├── Subtitle (font-content, text-white-muted)
│           ├── Benefits Grid (hidden lg:flex)
│           ├── Action Buttons
│           │   ├── TrialCTA (brand-500) [ROSA]
│           │   └── Demo Button (ghost, white-muted)
│           └── Trust Indicators (text-white-soft)
└── Additional Trust Element
```

Este componente completa la optimización del design system StrateKaz minimalista en la landing page.
