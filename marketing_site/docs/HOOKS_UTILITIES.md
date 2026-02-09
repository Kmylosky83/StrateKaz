# Hooks y Utilidades Responsive

## Custom Hooks

### 1. `useBreakpoint()`

Detecta el breakpoint actual del viewport.

```typescript
import { useBreakpoint } from '@/hooks/useResponsive';

export const MyComponent = () => {
  const breakpoint = useBreakpoint(); // 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'

  return (
    <div>
      <p>Breakpoint actual: {breakpoint}</p>
      {breakpoint === 'xs' && <MobileOnlyContent />}
    </div>
  );
};
```

**Implementación interna**:

```typescript
export const useBreakpoint = () => {
  const [breakpoint, setBreakpoint] = useState<Breakpoint>('xs');

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const breakpoints = Object.entries(BREAKPOINTS).reverse() as [Breakpoint, number][];

      for (const [key, value] of breakpoints) {
        if (width >= value) {
          setBreakpoint(key);
          break;
        }
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return breakpoint;
};
```

### 2. `useMediaQuery(query)`

Hook para media queries personalizadas.

```typescript
import { useMediaQuery } from '@/hooks/useResponsive';

export const ResponsiveComponent = () => {
  const isLandscape = useMediaQuery('(orientation: landscape)');
  const isDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const isHighDensity = useMediaQuery('(min-resolution: 2dppx)');

  return (
    <div>
      {isLandscape && <LandscapeLayout />}
      {isDarkMode && <DarkTheme />}
      {isHighDensity && <HighResImages />}
    </div>
  );
};
```

**Implementación**:

```typescript
export const useMediaQuery = (query: string): boolean => {
  const [matches, setMatches] = useState<boolean>(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    setMatches(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setMatches(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [query]);

  return matches;
};
```

### 3. `useIsMobile()` / `useIsTablet()` / `useIsDesktop()`

Hooks convenientes para dispositivos específicos.

```typescript
import { useIsMobile, useIsTablet, useIsDesktop } from '@/hooks/useResponsive';

export const AdaptiveComponent = () => {
  const isMobile = useIsMobile();   // < md (768px)
  const isTablet = useIsTablet();   // md to lg (768px - 1024px)
  const isDesktop = useIsDesktop(); // >= lg (1024px)

  if (isMobile) return <MobileView />;
  if (isTablet) return <TabletView />;
  return <DesktopView />;
};
```

### 4. `useIsAbove(breakpoint)` / `useIsBelow(breakpoint)`

Hooks para comparaciones de breakpoint.

```typescript
import { useIsAbove, useIsBelow } from '@/hooks/useResponsive';

export const ConditionalComponent = () => {
  const showSidebar = useIsAbove('lg');     // >= 1024px
  const compactMode = useIsBelow('sm');     // < 640px
  const showDetails = useIsAbove('md');     // >= 768px

  return (
    <div className={cn('layout', { 'with-sidebar': showSidebar })}>
      {compactMode ? <CompactHeader /> : <FullHeader />}
      <main>
        <Content />
        {showDetails && <DetailPanel />}
      </main>
      {showSidebar && <Sidebar />}
    </div>
  );
};
```

### 5. `useViewport()`

Hook para dimensiones exactas del viewport.

```typescript
import { useViewport } from '@/hooks/useResponsive';

export const DimensionAware = () => {
  const { width, height } = useViewport();

  const aspectRatio = width / height;
  const isSquarish = Math.abs(aspectRatio - 1) < 0.2;

  return (
    <div>
      <p>Viewport: {width}x{height}</p>
      <p>Aspect ratio: {aspectRatio.toFixed(2)}</p>
      {isSquarish && <SquareOptimizedLayout />}
    </div>
  );
};
```

### 6. `useResponsiveValue(values, defaultValue)`

Hook para valores responsivos.

```typescript
import { useResponsiveValue } from '@/hooks/useResponsive';

export const FlexibleComponent = () => {
  const columns = useResponsiveValue(
    {
      xs: 1,
      sm: 2,
      md: 3,
      lg: 4,
      xl: 6
    },
    2 // default fallback
  );

  const spacing = useResponsiveValue(
    {
      xs: '1rem',
      md: '1.5rem',
      lg: '2rem'
    },
    '1rem'
  );

  return (
    <div
      className={`grid gap-4`}
      style={{
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        padding: spacing
      }}
    >
      {/* Content */}
    </div>
  );
};
```

### 7. `useShowOn(breakpoints)` / `useHideOn(breakpoints)`

Hooks para visibilidad condicional.

```typescript
import { useShowOn, useHideOn } from '@/hooks/useResponsive';

export const ConditionalVisibility = () => {
  const showOnMobile = useShowOn(['xs', 'sm']);
  const hideOnTablet = useHideOn(['md']);
  const showOnDesktop = useShowOn(['lg', 'xl', '2xl']);

  return (
    <div>
      {showOnMobile && <MobileOnlyWidget />}
      {!hideOnTablet && <TabletContent />}
      {showOnDesktop && <DesktopFeatures />}
    </div>
  );
};
```

### 8. `useIsTouchDevice()`

Detecta dispositivos táctiles.

```typescript
import { useIsTouchDevice } from '@/hooks/useResponsive';

export const InteractiveComponent = () => {
  const isTouch = useIsTouchDevice();

  return (
    <div>
      {isTouch ? (
        <TouchOptimizedControls />
      ) : (
        <MouseOptimizedControls />
      )}
    </div>
  );
};
```

### 9. `useOrientation()`

Detecta orientación del dispositivo.

```typescript
import { useOrientation } from '@/hooks/useResponsive';

export const OrientationAware = () => {
  const orientation = useOrientation(); // 'portrait' | 'landscape'

  return (
    <div className={cn('container', `orientation-${orientation}`)}>
      {orientation === 'landscape' ? (
        <HorizontalLayout />
      ) : (
        <VerticalLayout />
      )}
    </div>
  );
};
```

## Utilidades de Clase

### 1. Container Utilities

```typescript
import { container } from '@/utils/responsive.utils';

// Contenedor responsive estándar
<div className={container.responsive()}>
  <Content />
</div>

// Contenedor optimizado para contenido
<div className={container.content('mt-8')}>
  <Article />
</div>

// Contenedor estrecho para CTAs
<div className={container.narrow('text-center')}>
  <CallToAction />
</div>

// Contenedor personalizado
<div className={container.custom({ xs: 'full', lg: '6xl' }, 'bg-gray-100')}>
  <CustomContent />
</div>
```

### 2. Spacing Utilities

```typescript
import { spacing } from '@/utils/responsive.utils';

// Padding responsive
<div className={spacing.padding({ xs: 4, md: 6, lg: 8 })}>
  <Content />
</div>

// Espaciado horizontal
<div className={spacing.px({ xs: 2, sm: 4, lg: 6 })}>
  <Content />
</div>

// Espaciado de sección
<section className={spacing.section('lg')}>
  <SectionContent />
</section>
```

### 3. Grid Utilities

```typescript
import { grid } from '@/utils/responsive.utils';

// Grid responsive dinámico
<div className={grid.cols({ xs: 1, sm: 2, lg: 3, xl: 4 })}>
  {items.map(item => <Card key={item.id}>{item.content}</Card>)}
</div>

// Gap responsive
<div className={cn('grid grid-cols-2', grid.gap({ xs: 2, sm: 4, lg: 6 }))}>
  <Card />
  <Card />
</div>

// Patrones comunes
<div className={grid.pattern('cards')}>
  {/* grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 */}
</div>

<div className={grid.pattern('features')}>
  {/* grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 */}
</div>
```

### 4. Typography Utilities

```typescript
import { typography } from '@/utils/responsive.utils';

// Tipografía responsive
<h1 className={typography.size({ xs: 'xl', md: '2xl', lg: '4xl' })}>
  Responsive Heading
</h1>

// Tipografía fluida
<h1 className={typography.fluid('hero')}>
  Hero Title
</h1>

// Headings con escalado automático
<h1 className={typography.heading(1)}>Level 1 Heading</h1>
<h2 className={typography.heading(2)}>Level 2 Heading</h2>
```

### 5. Display Utilities

```typescript
import { display } from '@/utils/responsive.utils';

// Mostrar/ocultar por breakpoint
<div className={display.show('md')}>
  {/* hidden sm:block */}
  Visible from tablet up
</div>

<div className={display.hide('lg')}>
  {/* lg:hidden */}
  Hidden on desktop
</div>

// Mostrar solo en rango específico
<div className={display.only('md', 'lg')}>
  {/* hidden md:block xl:hidden */}
  Only visible on tablet
</div>
```

### 6. Flex Utilities

```typescript
import { flex } from '@/utils/responsive.utils';

// Dirección responsive
<div className={flex.direction({ xs: 'col', md: 'row' })}>
  <div>Item 1</div>
  <div>Item 2</div>
</div>

// Justification responsive
<div className={flex.justify({ xs: 'center', md: 'between' })}>
  <Item />
  <Item />
</div>

// Patrones comunes
<div className={flex.pattern('center')}>
  {/* flex justify-center items-center */}
</div>

<div className={flex.pattern('between')}>
  {/* flex justify-between items-center */}
</div>
```

## Funciones de Utilidad

### 1. `responsive<T>(values, prefix)`

Genera clases responsivas automáticamente.

```typescript
import { responsive } from '@/utils/responsive.utils';

// Ejemplo interno de uso
const paddingClasses = responsive({ xs: '4', sm: '6', lg: '8' }, 'p-');
// Resultado: 'p-4 sm:p-6 lg:p-8'

const textClasses = responsive({ xs: 'center', md: 'left' }, 'text-');
// Resultado: 'text-center md:text-left'
```

### 2. `cn(...inputs)`

Combina clases condicionalmente (adaptación de clsx).

```typescript
import { cn } from '@/utils/responsive.utils';

const buttonClasses = cn('base-button', 'transition-colors', {
  'bg-blue-500': isPrimary,
  'bg-gray-500': !isPrimary,
  'opacity-50': disabled,
});

// Con responsive utilities
const cardClasses = cn('card-base', spacing.padding({ xs: 4, lg: 6 }), {
  'border-2': hasBorder,
  'shadow-lg': hasElevation,
});
```

## Composición de Hooks

### Combinar múltiples hooks

```typescript
const useResponsiveLayout = () => {
  const isMobile = useIsMobile();
  const isTouch = useIsTouchDevice();
  const orientation = useOrientation();
  const { width } = useViewport();

  const layout = useMemo(() => {
    if (isMobile && orientation === 'portrait') {
      return 'mobile-portrait';
    }
    if (isMobile && orientation === 'landscape') {
      return 'mobile-landscape';
    }
    if (width < 1024) {
      return 'tablet';
    }
    return 'desktop';
  }, [isMobile, orientation, width]);

  const touchOptimized = isTouch && isMobile;

  return {
    layout,
    touchOptimized,
    showSidebar: !isMobile,
    compactNavigation: isMobile,
    gridColumns: isMobile ? 1 : width > 1200 ? 4 : 3
  };
};

// Uso en componente
export const ResponsiveApp = () => {
  const { layout, touchOptimized, showSidebar, gridColumns } = useResponsiveLayout();

  return (
    <div className={cn('app', `layout-${layout}`, { 'touch-optimized': touchOptimized })}>
      <Header compact={layout === 'mobile-portrait'} />
      <main>
        <div className={`grid grid-cols-${gridColumns} gap-6`}>
          <Content />
        </div>
      </main>
      {showSidebar && <Sidebar />}
    </div>
  );
};
```

## Patrones Avanzados

### 1. Lazy Loading Responsivo

```typescript
import { lazy, Suspense } from 'react';
import { useIsMobile } from '@/hooks/useResponsive';

const DesktopChart = lazy(() => import('./DesktopChart'));
const MobileChart = lazy(() => import('./MobileChart'));

export const ResponsiveChart = (props) => {
  const isMobile = useIsMobile();

  return (
    <Suspense fallback={<ChartSkeleton />}>
      {isMobile ? <MobileChart {...props} /> : <DesktopChart {...props} />}
    </Suspense>
  );
};
```

### 2. Performance Monitoring

```typescript
import { useViewport, useBreakpoint } from '@/hooks/useResponsive';
import { useEffect } from 'react';

export const useResponsiveAnalytics = () => {
  const viewport = useViewport();
  const breakpoint = useBreakpoint();

  useEffect(() => {
    // Track responsive usage
    analytics.track('viewport_change', {
      width: viewport.width,
      height: viewport.height,
      breakpoint,
      timestamp: Date.now(),
    });
  }, [breakpoint, viewport]);

  useEffect(() => {
    // Track performance for mobile users
    if (breakpoint === 'xs' || breakpoint === 'sm') {
      const observer = new PerformanceObserver(list => {
        list.getEntries().forEach(entry => {
          if (entry.entryType === 'largest-contentful-paint') {
            analytics.track('mobile_lcp', {
              value: entry.startTime,
              breakpoint,
            });
          }
        });
      });

      observer.observe({ entryTypes: ['largest-contentful-paint'] });
      return () => observer.disconnect();
    }
  }, [breakpoint]);
};
```

### 3. Configuración Global

```typescript
// ResponsiveProvider.tsx
import { createContext, useContext } from 'react';
import { useBreakpoint, useViewport, useIsTouchDevice } from '@/hooks/useResponsive';

const ResponsiveContext = createContext(null);

export const ResponsiveProvider = ({ children }) => {
  const breakpoint = useBreakpoint();
  const viewport = useViewport();
  const isTouch = useIsTouchDevice();

  const value = {
    breakpoint,
    viewport,
    isTouch,
    isMobile: breakpoint === 'xs' || breakpoint === 'sm',
    isTablet: breakpoint === 'md',
    isDesktop: breakpoint === 'lg' || breakpoint === 'xl' || breakpoint === '2xl'
  };

  return (
    <ResponsiveContext.Provider value={value}>
      {children}
    </ResponsiveContext.Provider>
  );
};

export const useResponsive = () => {
  const context = useContext(ResponsiveContext);
  if (!context) {
    throw new Error('useResponsive must be used within ResponsiveProvider');
  }
  return context;
};
```

## Testing de Hooks

```typescript
// __tests__/useResponsive.test.tsx
import { renderHook } from '@testing-library/react';
import { useBreakpoint, useIsMobile } from '@/hooks/useResponsive';

// Mock window.innerWidth
const mockViewport = (width: number, height: number) => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  });
  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: height,
  });
  window.dispatchEvent(new Event('resize'));
};

describe('Responsive Hooks', () => {
  test('useBreakpoint returns correct breakpoint for mobile', () => {
    mockViewport(375, 667);
    const { result } = renderHook(() => useBreakpoint());
    expect(result.current).toBe('xs');
  });

  test('useIsMobile returns true for mobile viewports', () => {
    mockViewport(640, 800);
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(true);
  });

  test('responsive utilities generate correct classes', () => {
    const classes = responsive({ xs: 'center', md: 'left' }, 'text-');
    expect(classes).toBe('text-center md:text-left');
  });
});
```

---

**Documentación completa del sistema mobile-first de StrateKaz implementado profesionalmente** 🚀

Para más información, consulta:

- [Sistema Responsive](./RESPONSIVE_SYSTEM.md)
- [Optimizaciones Mobile](./MOBILE_OPTIMIZATION.md)
