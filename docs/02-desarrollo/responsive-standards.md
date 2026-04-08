# Responsive Design Standards

## Breakpoints (synced with Tailwind)
```
mobile:  < 768px   (sm)
tablet:  768-1023px (md)
desktop: 1024-1279px (lg)
wide:    >= 1280px  (xl)
```

## Hook
```typescript
import { useResponsive } from '@/hooks';
const { isMobile, isTablet, isDesktop, breakpoint, width } = useResponsive();
// Debounced 150ms, SSR-safe. Public pages: use window.innerWidth directly.
```

## Button Sizes (WCAG 2.1 Level AA)
```
sm: min-h-[44px]  — WCAG minimum
md: min-h-[48px]  — Google/Material standard
lg: min-h-[56px]  — Optimal for CTAs
```
Minimum 8px gap between adjacent buttons (`gap-3`).

## Tabs (DynamicSections)
- **Mobile (< 768px)**: Icon-only + tooltip, max 5 tabs, horizontal scroll
- **Desktop (>= 768px)**: Icon + text
- Touch target: always >= 44x44px

## Tables: ResponsiveTable
```
Desktop (>= 1024px): Full table
Tablet (768-1023px):  Table + horizontal scroll + hide low-priority cols
Mobile (< 768px):     Card view (vertical)
```

### Column Priority System
| Priority | Mobile | Tablet | Desktop |
|----------|--------|--------|---------|
| 1 | Title | Yes | Yes |
| 2 | Metadata | Yes | Yes |
| 3 | Hidden | Yes | Yes |
| 4 | Hidden | Hidden | Yes |
| 5 | Hidden | Hidden | Yes |

### Usage Pattern
```typescript
<ResponsiveTable<T & Record<string, unknown>>
  data={items as (T & Record<string, unknown>)[]}
  columns={[
    { key: 'nombre', header: 'Nombre', priority: 1, render: (item) => item.nombre },
    { key: 'cargo', header: 'Cargo', priority: 2, render: (item) => item.cargo.name },
  ]}
  keyExtractor={(item) => item.id}
  mobileCardTitle={(item) => item.nombre}
  renderActions={(item) => <Button size="sm">Editar</Button>}
/>
```

## Rules
- Use `useResponsive()` hook, NOT custom `window.innerWidth` (except public pages)
- Prefer CSS (`hidden sm:inline`) over conditional rendering
- All touch targets >= 44px
- Card view for tables with >3 columns on mobile
- Icon-only tabs on mobile when >3 tabs
- Debounce resize events (150ms minimum)

## Components
| Component | Path |
|-----------|------|
| `useResponsive` | `hooks/useResponsive.ts` |
| `ResponsiveTable` | `components/common/ResponsiveTable.tsx` |
| `MobileCardList` | `components/common/MobileCardList.tsx` |
