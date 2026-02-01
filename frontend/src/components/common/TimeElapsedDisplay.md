# TimeElapsedDisplay Component

Componente reutilizable para mostrar tiempo transcurrido en tiempo real desde una fecha inicial, con soporte para múltiples formatos, variantes y animaciones.

## Tabla de Contenidos

- [Características](#características)
- [Instalación](#instalación)
- [Uso Básico](#uso-básico)
- [API del Hook](#api-del-hook)
- [API del Componente](#api-del-componente)
- [Variantes](#variantes)
- [Formatos](#formatos)
- [Granularidades](#granularidades)
- [Ejemplos Avanzados](#ejemplos-avanzados)
- [TypeScript](#typescript)

## Características

- ✅ **Actualización en tiempo real**: Actualiza automáticamente según intervalo configurable
- ✅ **Múltiples formatos**: Long, short, compact
- ✅ **Granularidades flexibles**: Desde años hasta segundos
- ✅ **4 Variantes visuales**: inline, card, badge, hero
- ✅ **Dark mode**: Soporte completo para modo oscuro
- ✅ **Animaciones sutiles**: Transiciones suaves con Framer Motion
- ✅ **TypeScript strict**: Totalmente tipado
- ✅ **Accesible**: ARIA labels y tooltips
- ✅ **Personalizable**: Icons, labels, badges, colores

## Instalación

Los archivos ya están integrados en el Design System:

```tsx
import { TimeElapsedDisplay } from '@/components/common';
import { useTimeElapsed } from '@/hooks';
```

## Uso Básico

### Ejemplo Simple

```tsx
import { TimeElapsedDisplay } from '@/components/common';

function MyComponent() {
  return (
    <TimeElapsedDisplay
      startDate={new Date('2020-01-15')}
      label="Operando desde"
      variant="inline"
      showIcon
    />
  );
}
```

**Salida:**
```
🕐 Operando desde: 5 años, 11 meses, 17 días
```

### Con Card

```tsx
<TimeElapsedDisplay
  startDate={new Date('2020-01-15')}
  label="Sistema Activo"
  variant="card"
  size="lg"
  showIcon
  showBadge
  badgeText="En Línea"
  format="long"
  granularities={['years', 'months', 'days']}
/>
```

## API del Hook

### `useTimeElapsed`

Hook que calcula y actualiza el tiempo transcurrido.

#### Parámetros

```typescript
interface TimeElapsedConfig {
  startDate: Date | string;           // Fecha inicial (requerido)
  updateInterval?: number;            // Intervalo en ms (default: 60000)
  granularities?: TimeUnit[];         // ['years', 'months', 'days']
  format?: 'long' | 'short' | 'compact'; // default: 'long'
  pauseOnUnmount?: boolean;           // default: true
  showZeros?: boolean;                // default: false
  separator?: string;                 // default: ', ' o ' '
}
```

#### Retorno

```typescript
interface UseTimeElapsedReturn {
  elapsed: TimeElapsedValue;    // Valores calculados
  formatted: string;            // String formateado
  startDate: Date;              // Fecha normalizada
  currentDate: Date;            // Fecha actual
  refresh: () => void;          // Forzar actualización
  isActive: boolean;            // Estado del contador
}
```

#### Ejemplo

```tsx
const { elapsed, formatted, refresh } = useTimeElapsed({
  startDate: new Date('2020-01-15'),
  format: 'long',
  granularities: ['years', 'months', 'days'],
  updateInterval: 60000,
});

console.log(formatted); // "5 años, 11 meses, 17 días"
console.log(elapsed.totalDays); // 2177
```

## API del Componente

### Props

```typescript
interface TimeElapsedDisplayProps {
  // Configuración del hook
  startDate: Date | string;
  updateInterval?: number;
  granularities?: TimeUnit[];
  format?: 'long' | 'short' | 'compact';
  showZeros?: boolean;
  separator?: string;

  // Props visuales
  variant?: 'inline' | 'card' | 'badge' | 'hero';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  label?: string;
  showIcon?: boolean;
  icon?: ReactNode;
  animate?: boolean;
  showBadge?: boolean;
  badgeText?: string;
  tooltip?: string;

  // Callbacks
  onUpdate?: (elapsed: TimeElapsedValue) => void;

  // HTML props estándar
  className?: string;
  ...HTMLAttributes<HTMLDivElement>
}
```

## Variantes

### 1. Inline (Default)

Texto en línea con opción de icono.

```tsx
<TimeElapsedDisplay
  startDate={new Date('2020-01-15')}
  variant="inline"
  label="Fundación"
  showIcon
/>
```

**Uso:** Headers, descripciones, listas

### 2. Card

Card completo con padding, bordes y sombra.

```tsx
<TimeElapsedDisplay
  startDate={new Date('2020-01-15')}
  variant="card"
  label="Proyecto Activo"
  showIcon
  showBadge
  badgeText="En Curso"
/>
```

**Uso:** Dashboards, grids de estadísticas

### 3. Badge

Badge compacto estilo pill.

```tsx
<TimeElapsedDisplay
  startDate={new Date('2024-01-01')}
  variant="badge"
  format="compact"
  granularities={['days', 'hours']}
/>
```

**Uso:** Navbar, headers, tooltips

### 4. Hero

Diseño grande para landing pages.

```tsx
<TimeElapsedDisplay
  startDate={new Date('2020-01-15')}
  variant="hero"
  label="Transformando la Industria desde"
  showIcon
  showBadge
  badgeText="Líderes del Sector"
/>
```

**Uso:** Hero sections, páginas de marketing

## Formatos

### Long (Completo)

```tsx
format="long"
// Salida: "5 años, 11 meses, 17 días"
```

### Short (Abreviado)

```tsx
format="short"
// Salida: "5a 11m 17d"
```

### Compact (Ultra Compacto)

```tsx
format="compact"
// Salida: "5a 11m 17d"
```

## Granularidades

Controla qué unidades de tiempo mostrar:

```typescript
type TimeUnit = 'years' | 'months' | 'days' | 'hours' | 'minutes' | 'seconds';
```

### Ejemplos

```tsx
// Solo años y meses
granularities={['years', 'months']}
// "5 años, 11 meses"

// Años, meses y días
granularities={['years', 'months', 'days']}
// "5 años, 11 meses, 17 días"

// Para eventos recientes (días, horas, minutos)
granularities={['days', 'hours', 'minutes']}
// "2 días, 5 horas, 30 minutos"

// Uptime completo (hasta segundos)
granularities={['hours', 'minutes', 'seconds']}
updateInterval={1000} // Actualizar cada segundo
// "73 horas, 42 minutos, 15 segundos"
```

## Ejemplos Avanzados

### Dashboard de Empresa

```tsx
import { TimeElapsedDisplay } from '@/components/common';
import { Building2 } from 'lucide-react';

export function CompanyDashboard() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <TimeElapsedDisplay
        startDate={new Date('2020-01-15')}
        label="Fundación"
        variant="card"
        size="lg"
        showIcon
        icon={<Building2 />}
        format="long"
        granularities={['years', 'months']}
      />

      <TimeElapsedDisplay
        startDate={new Date('2021-06-20')}
        label="Certificación ISO"
        variant="card"
        size="lg"
        showIcon
        format="long"
        granularities={['years', 'months']}
        showBadge
        badgeText="Certificado"
      />

      <TimeElapsedDisplay
        startDate={new Date('2024-01-01')}
        label="Sistema en Línea"
        variant="card"
        size="lg"
        showIcon
        format="short"
        granularities={['days', 'hours']}
        updateInterval={60000}
        showBadge
        badgeText="Activo"
        animate
      />
    </div>
  );
}
```

### Navbar con Badge

```tsx
export function Navbar() {
  return (
    <nav className="flex items-center justify-between p-4">
      <h1>Dashboard</h1>
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600">Sistema activo:</span>
        <TimeElapsedDisplay
          startDate={new Date('2024-01-01')}
          variant="badge"
          format="compact"
          granularities={['days', 'hours']}
          updateInterval={60000}
        />
      </div>
    </nav>
  );
}
```

### Landing Page Hero

```tsx
export function LandingHero() {
  return (
    <section className="py-20 bg-gradient-to-br from-primary-50 to-accent-50">
      <div className="max-w-4xl mx-auto">
        <TimeElapsedDisplay
          startDate={new Date('2020-01-15')}
          label="Transformando la Industria desde"
          variant="hero"
          showIcon
          format="long"
          granularities={['years', 'months']}
          showBadge
          badgeText="Líderes del Sector"
          animate
        />
      </div>
    </section>
  );
}
```

### Con Callback de Eventos

```tsx
export function AnniversaryCounter() {
  const handleUpdate = (elapsed) => {
    // Detectar aniversarios
    if (elapsed.months === 0 && elapsed.days === 0) {
      console.log(`¡Celebremos ${elapsed.years} años!`);
      // Mostrar notificación, confetti, etc.
    }
  };

  return (
    <TimeElapsedDisplay
      startDate={new Date('2020-01-15')}
      label="Celebrando"
      variant="card"
      format="long"
      granularities={['years', 'months', 'days']}
      onUpdate={handleUpdate}
      showBadge
      badgeText="Aniversario Próximo"
    />
  );
}
```

### Uptime Monitor (Alta Frecuencia)

```tsx
export function ServerUptime() {
  return (
    <TimeElapsedDisplay
      startDate={new Date('2025-01-01T00:00:00')}
      label="Server Uptime"
      variant="inline"
      size="sm"
      format="long"
      granularities={['days', 'hours', 'minutes', 'seconds']}
      updateInterval={1000} // Actualizar cada segundo
      showIcon
      animate
    />
  );
}
```

### Uso Directo del Hook

```tsx
import { useTimeElapsed } from '@/hooks';

export function CustomDisplay() {
  const { elapsed, formatted, refresh } = useTimeElapsed({
    startDate: new Date('2020-01-15'),
    format: 'long',
    granularities: ['years', 'months', 'days'],
    updateInterval: 60000,
  });

  return (
    <div>
      <p>Formateado: {formatted}</p>
      <p>Total días: {elapsed.totalDays}</p>
      <button onClick={refresh}>Actualizar</button>
    </div>
  );
}
```

## TypeScript

### Tipos Exportados

```typescript
// Hook
import type {
  TimeElapsedConfig,
  TimeElapsedValue,
  UseTimeElapsedReturn,
  TimeUnit,
  FormatStyle,
} from '@/hooks';

// Componente
import type {
  TimeElapsedDisplayProps,
  TimeElapsedVariant,
  TimeElapsedSize,
} from '@/components/common';
```

### Ejemplo Tipado

```tsx
import { TimeElapsedDisplay, TimeElapsedDisplayProps } from '@/components/common';
import { TimeElapsedValue } from '@/hooks';

const config: TimeElapsedDisplayProps = {
  startDate: new Date('2020-01-15'),
  variant: 'card',
  format: 'long',
  granularities: ['years', 'months', 'days'],
  onUpdate: (elapsed: TimeElapsedValue) => {
    console.log(`Total días: ${elapsed.totalDays}`);
  },
};

export function TypedComponent() {
  return <TimeElapsedDisplay {...config} />;
}
```

## Mejores Prácticas

1. **Intervalo de Actualización**
   - Para años/meses: `60000` (1 minuto) es suficiente
   - Para días/horas: `60000` (1 minuto)
   - Para minutos/segundos: `1000` (1 segundo)
   - Para uptime crítico: `500` (0.5 segundos)

2. **Granularidades**
   - Eventos antiguos: `['years', 'months']`
   - Eventos medianos: `['years', 'months', 'days']`
   - Eventos recientes: `['days', 'hours', 'minutes']`
   - Uptime: `['hours', 'minutes', 'seconds']`

3. **Formatos**
   - Dashboards: `'long'`
   - Cards compactos: `'short'`
   - Badges/Pills: `'compact'`

4. **Performance**
   - Evita `updateInterval` muy bajo (<500ms) sin razón
   - Usa `pauseOnUnmount: true` para evitar memory leaks
   - Considera `memo()` si el componente padre re-renderiza frecuentemente

## Accesibilidad

El componente incluye:
- `title` attribute para tooltips
- Texto semántico con labels claros
- Contraste adecuado en dark mode
- Animaciones respetuosas del `prefers-reduced-motion`

## Soporte de Navegadores

- Chrome/Edge: ✅ Completo
- Firefox: ✅ Completo
- Safari: ✅ Completo
- IE11: ❌ No soportado (requiere Framer Motion)

## Licencia

Parte del Design System de Grasas y Huesos del Norte - Sistema StrateKaz
