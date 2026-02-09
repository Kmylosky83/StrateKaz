# Sistema Responsive Mobile-First

## Arquitectura General

El sistema responsive de StrateKaz está diseñado con un enfoque **mobile-first** profesional,
priorizando la experiencia en dispositivos móviles y escalando hacia pantallas más grandes.

### Filosofía Mobile-First

1. **Diseño desde móvil hacia desktop** - No al revés
2. **Touch-friendly interfaces** - Targets mínimo 44px
3. **Contenido esencial primero** - Progressive enhancement
4. **Performance optimizado** - Carga rápida en conexiones lentas
5. **TypeScript type-safe** - Sin errores de runtime

## Breakpoints System

```typescript
export const BREAKPOINTS = {
  xs: 375, // Mobile small (iPhone SE/12/13 mini)
  sm: 640, // Mobile large to tablet small
  md: 768, // Tablet portrait
  lg: 1024, // Desktop small / Tablet landscape
  xl: 1280, // Desktop standard
  '2xl': 1536, // Desktop large
} as const;
```

### Criterios de Breakpoints

- **xs (375px)**: iPhone SE, dispositivos compactos
- **sm (640px)**: Teléfonos grandes, tablets pequeños
- **md (768px)**: Tablets portrait, punto de transición principal
- **lg (1024px)**: Desktop small, tablets landscape
- **xl (1280px)**: Desktop estándar
- **2xl (1536px)**: Monitores grandes, desktop premium

## Container System

### Contenedores Disponibles

#### 1. `container-responsive`

```css
/* Mobile-first container con padding apropiado */
.container-responsive {
  width: 100%;
  margin: 0 auto;
  padding: 0 1rem; /* 16px en móvil */
}

/* Escalado responsivo */
@media (min-width: 640px) {
  padding: 0 1.5rem;
} /* 24px */
@media (min-width: 1024px) {
  padding: 0 2rem;
} /* 32px */
@media (max-width: 1536px) {
  max-width: 1536px;
}
```

#### 2. `container-content`

```css
/* Optimizado para legibilidad de contenido */
.container-content {
  max-width: 48rem; /* 768px */
  margin: 0 auto;
  padding: 0 1rem;
}
```

#### 3. `container-narrow`

```css
/* CTAs y contenido enfocado */
.container-narrow {
  max-width: 42rem; /* 672px */
  margin: 0 auto;
  padding: 0 1rem;
}
```

#### 4. `container-full`

```css
/* Sin restricciones de ancho */
.container-full {
  width: 100%;
  padding: 0 1rem;
}
```

## Spacing System

### Escalas de Espaciado

```typescript
export const SPACING_SCALES = {
  section: {
    xs: { mobile: '2rem', tablet: '2.5rem', desktop: '3rem' },
    sm: { mobile: '3rem', tablet: '4rem', desktop: '5rem' },
    md: { mobile: '4rem', tablet: '5rem', desktop: '6rem' },
    lg: { mobile: '5rem', tablet: '6rem', desktop: '8rem' },
    xl: { mobile: '6rem', tablet: '8rem', desktop: '10rem' },
  },
  component: {
    xs: { mobile: '0.5rem', tablet: '0.75rem', desktop: '1rem' },
    sm: { mobile: '1rem', tablet: '1.25rem', desktop: '1.5rem' },
    md: { mobile: '1.5rem', tablet: '2rem', desktop: '2.5rem' },
    lg: { mobile: '2rem', tablet: '2.5rem', desktop: '3rem' },
  },
};
```

### Aplicación Práctica

```typescript
// Uso en componentes
const spacing = useSpacing();

// Espaciado de sección responsive
<section className={spacing.section('md')}>
  {/* py-16 sm:py-20 lg:py-24 */}
</section>

// Espaciado de componente
<div className={spacing.component('sm')}>
  {/* p-4 sm:p-5 lg:p-6 */}
</div>
```

## Typography System

### Tipografía Fluid

El sistema utiliza **fluid typography** que escala suavemente entre breakpoints:

```css
/* Escalado fluido automático */
.text-fluid-xs {
  font-size: clamp(0.75rem, 0.7rem + 0.25vw, 0.875rem);
}
.text-fluid-base {
  font-size: clamp(1rem, 0.875rem + 0.625vw, 1.25rem);
}
.text-fluid-2xl {
  font-size: clamp(1.5rem, 0.5rem + 5vw, 3rem);
}
.text-fluid-hero {
  font-size: clamp(2.5rem, 1rem + 7.5vw, 6rem);
}
```

### Jerarquía de Texto

```typescript
export const TYPOGRAPHY_HIERARCHY = {
  hero: 'text-fluid-hero', // Títulos principales
  h1: 'text-fluid-4xl', // Títulos de página
  h2: 'text-fluid-3xl', // Títulos de sección
  h3: 'text-fluid-2xl', // Subtítulos
  h4: 'text-fluid-xl', // Títulos de card
  body: 'text-fluid-base', // Texto principal
  caption: 'text-fluid-sm', // Texto secundario
  small: 'text-fluid-xs', // Texto auxiliar
};
```

## Grid System

### Patrones de Grid Comunes

```typescript
export const GRID_PATTERNS = {
  // Cards adaptables
  cards: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6',

  // Features principales
  features: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8',

  // Galería de imágenes
  gallery: 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4',

  // Blog posts
  blog: 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8',

  // Servicios (mobile-first)
  services: 'grid grid-cols-1 sm:grid-cols-2 gap-4',

  // CTA grid
  cta: 'grid grid-cols-1 gap-6 sm:gap-8',
};
```

### Uso Dinámico

```typescript
// Responsive grid con utilidades
const grid = useGrid();

<div className={grid.pattern('cards')}>
  {items.map(item => (
    <Card key={item.id}>{item.content}</Card>
  ))}
</div>

// Grid customizable
<div className={grid.cols({ xs: 1, sm: 2, lg: 3 })}>
  {/* Contenido */}
</div>
```

## Touch Targets

### Tamaños Mínimos

Siguiendo las mejores prácticas de accesibilidad móvil:

```typescript
export const TOUCH_TARGETS = {
  minimum: '44px', // 2.75rem - Estándar WCAG
  comfortable: '48px', // 3rem - Recomendado
  large: '52px', // 3.25rem - Óptimo
  extra: '60px', // 3.75rem - Premium
};
```

### Implementación en Componentes

```typescript
// Botones touch-friendly
<button className="min-h-[44px] min-w-[44px] p-2">
  <Icon className="h-6 w-6" />
</button>

// Navegación móvil
<nav className="flex gap-2">
  {links.map(link => (
    <Link
      key={link.id}
      className="min-h-[48px] flex items-center px-4"
    >
      {link.title}
    </Link>
  ))}
</nav>
```

## Color System

### Jerarquía de Colores Mobile-First

```typescript
export const MOBILE_COLOR_PRIORITIES = {
  primary: {
    background: 'bg-black-deep', // Fondo principal
    surface: 'bg-black-card', // Superficies/cards
    surfaceSoft: 'bg-black-card-soft', // Superficies suaves
  },
  text: {
    primary: 'text-white-text', // Texto principal
    secondary: 'text-white-muted', // Texto secundario
    soft: 'text-white-text-soft', // Texto suave
  },
  interactive: {
    primary: 'bg-brand-500', // CTAs principales
    hover: 'hover:bg-brand-600', // Estados hover
    focus: 'focus:ring-brand-500', // Estados focus
  },
};
```

## Optimizaciones de Performance

### Lazy Loading Responsivo

```typescript
// Componentes lazy load por breakpoint
const MobileComponent = lazy(() => import('./MobileComponent'));
const DesktopComponent = lazy(() => import('./DesktopComponent'));

export const ResponsiveComponent = () => {
  const isMobile = useIsMobile();

  return (
    <Suspense fallback={<ComponentSkeleton />}>
      {isMobile ? <MobileComponent /> : <DesktopComponent />}
    </Suspense>
  );
};
```

### Imágenes Responsivas

```typescript
// Optimización de imágenes por viewport
export const ResponsiveImage = ({ src, alt }) => {
  const viewport = useViewport();

  const imageSrc = useMemo(() => {
    if (viewport.width < 640) return `${src}?w=640&q=75`;
    if (viewport.width < 1024) return `${src}?w=1024&q=80`;
    return `${src}?w=1920&q=85`;
  }, [src, viewport.width]);

  return <img src={imageSrc} alt={alt} loading="lazy" />;
};
```

## Testing Responsivo

### Breakpoints de Testing

```javascript
// Viewport sizes para testing
export const TEST_VIEWPORTS = {
  mobile: { width: 375, height: 667 }, // iPhone SE
  mobileLarge: { width: 414, height: 896 }, // iPhone 11 Pro Max
  tablet: { width: 768, height: 1024 }, // iPad
  desktop: { width: 1024, height: 768 }, // Desktop small
  desktopLarge: { width: 1440, height: 900 }, // Desktop large
};
```

### Casos de Prueba

```typescript
describe('Responsive Components', () => {
  it('renders mobile layout correctly', () => {
    mockViewport(375, 667);
    render(<HeroSection />);

    expect(screen.getByText('Mobile Title')).toBeInTheDocument();
    expect(screen.queryByText('Desktop Description')).not.toBeInTheDocument();
  });

  it('adapts to tablet layout', () => {
    mockViewport(768, 1024);
    render(<ServicesSection />);

    expect(screen.getAllByRole('button')).toHaveLength(4);
  });
});
```

## Mejores Prácticas

### DO ✅

1. **Diseñar desde mobile hacia desktop**
2. **Usar hooks responsive para lógica condicional**
3. **Implementar touch targets mínimo 44px**
4. **Utilizar tipografía fluida para escalado suave**
5. **Aplicar lazy loading en componentes pesados**
6. **Testear en dispositivos reales**

### DON'T ❌

1. **No hardcodear breakpoints en componentes**
2. **No usar media queries CSS directas**
3. **No ignorar la jerarquía de información en móvil**
4. **No sobrecargar la interfaz móvil**
5. **No asumir soporte para hover en móvil**
6. **No usar elementos menores a 44px en móvil**

## Migración y Mantenimiento

### Migración desde Desktop-First

```typescript
// ANTES (Desktop-first)
<div className="flex space-x-4 lg:space-x-6">
  <div className="w-1/3 lg:w-1/4">Content</div>
</div>

// DESPUÉS (Mobile-first)
<div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
  <div className="w-full sm:w-1/3 lg:w-1/4">Content</div>
</div>
```

### Mantenimiento Continuo

1. **Auditorías regulares** de performance móvil
2. **Testing en dispositivos** físicos mensuales
3. **Actualización de breakpoints** según analytics
4. **Optimización de bundles** por usage patterns
5. **Monitoreo de Web Vitals** en mobile

---

**Próxima documentación**: [Hooks y Utilidades](./HOOKS_UTILITIES.md)
