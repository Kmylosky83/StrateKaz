# ContextoOrganizacionalTab

Componente Tab para la gestión del Contexto Organizacional en el Motor de Riesgos.

## Descripción

Este componente implementa la interfaz completa para el análisis del contexto organizacional, incluyendo:

- **Análisis DOFA**: Identificación de Fortalezas, Oportunidades, Debilidades y Amenazas
- **Estrategias TOWS**: Matriz de estrategias cruzadas basadas en DOFA
- **Análisis PESTEL**: Factores del entorno (Político, Económico, Social, Tecnológico, Ecológico, Legal)
- **5 Fuerzas de Porter**: Análisis competitivo del sector

## Características

- ✅ 4 subtabs dinámicos con navegación fluida
- ✅ Visualizaciones interactivas de cada metodología
- ✅ Estados empty state para cada análisis
- ✅ Estadísticas en tiempo real
- ✅ Integración con componentes visuales especializados
- ✅ Sistema de badges de estado
- ✅ Botones de exportación (preparados para futura implementación)
- ✅ Responsive design

## Uso

```tsx
import { ContextoOrganizacionalTab } from '@/features/riesgos/components/tabs';

function RiesgosPage() {
  return (
    <ContextoOrganizacionalTab activeSection="dofa" />
  );
}
```

## Props

| Prop | Tipo | Requerido | Default | Descripción |
|------|------|-----------|---------|-------------|
| `activeSection` | `string` | No | - | Código de subsección activa (desde API/DynamicSections) |

## Subtabs

### 1. Análisis DOFA (`dofa`)

Matriz DOFA con visualización de 4 cuadrantes:
- Fortalezas (verde)
- Oportunidades (azul)
- Debilidades (amarillo)
- Amenazas (rojo)

**Componente visual**: `MatrizDOFAVisual`

### 2. Estrategias TOWS (`tows`)

Grid 2x2 de estrategias cruzadas:
- FO (Maxi-Maxi): Fortalezas + Oportunidades
- FA (Maxi-Mini): Fortalezas + Amenazas
- DO (Mini-Maxi): Debilidades + Oportunidades
- DA (Mini-Mini): Debilidades + Amenazas

**Componente visual**: `EstrategiasTOWSGrid`

### 3. Análisis PESTEL (`pestel`)

Lista categorizada de factores del entorno:
- Político
- Económico
- Social
- Tecnológico
- Ecológico
- Legal

**Componente visual**: `PESTELChart`

### 4. 5 Fuerzas de Porter (`porter`)

Diagrama en forma de diamante:
- Rivalidad competitiva (centro)
- Nuevos entrantes (arriba)
- Productos sustitutos (abajo)
- Poder de proveedores (izquierda)
- Poder de clientes (derecha)

**Componente visual**: `PorterDiagram`

## Componentes Visuales Integrados

Todos los componentes visuales están en `frontend/src/features/riesgos/components/contexto/`:

- `MatrizDOFAVisual.tsx`
- `EstrategiasTOWSGrid.tsx`
- `PESTELChart.tsx`
- `PorterDiagram.tsx`

## Estados

### Sin Análisis

Cada subtab muestra un `EmptyState` cuando no hay análisis vigente, con un botón de acción para crear uno nuevo.

### Con Análisis

Muestra:
- Header con información del análisis
- Estadísticas rápidas
- Visualización interactiva
- Botones de acción (exportar, nuevo análisis)

## Eventos/Handlers

### Click en elementos

```tsx
handleFactorDofaClick(factor: FactorDOFA)
handleEstrategiaTowsClick(estrategia: EstrategiaTOWS)
handleFactorPestelClick(factor: FactorPESTEL)
handleFuerzaPorterClick(fuerza: FuerzaPorter)
```

### Acciones de análisis

```tsx
handleCreateAnalisisDofa()
handleCreateAnalisisPestel()
handleCreateAnalisisPorter()
handleExportAnalisis()
```

## Integración con API

Actualmente utiliza datos MOCK. Para integrar con el backend:

1. Crear hooks personalizados en `frontend/src/features/riesgos/hooks/`:
   - `useAnalisisDofa()`
   - `useAnalisisPestel()`
   - `useAnalisisPorter()`

2. Reemplazar las constantes MOCK:

```tsx
// Antes
const analisisDofa = MOCK_ANALISIS_DOFA;

// Después
const { data: analisisDofa, isLoading, error } = useAnalisisDofa();
```

3. Conectar con endpoints:
   - `GET /api/motor-riesgos/contexto/dofa/`
   - `GET /api/motor-riesgos/contexto/pestel/`
   - `GET /api/motor-riesgos/contexto/porter/`

## Próximas Implementaciones

- [ ] Modales de creación/edición para cada tipo de análisis
- [ ] Modales de detalle para factores y estrategias
- [ ] Exportación a PDF/Excel
- [ ] Histórico de análisis
- [ ] Comparación entre períodos
- [ ] Sistema de aprobación de análisis
- [ ] Notificaciones de vencimiento
- [ ] Dashboards de análisis consolidado

## Tipos TypeScript

Todos los tipos se encuentran en `frontend/src/features/riesgos/types/contexto.types.ts`:

```typescript
- AnalisisDOFA
- FactorDOFA
- EstrategiaTOWS
- AnalisisPESTEL
- FactorPESTEL
- AnalisisPorter
- FuerzaPorter
```

## Ejemplo Completo

```tsx
import { useState } from 'react';
import { ContextoOrganizacionalTab } from '@/features/riesgos/components/tabs';

function ContextoOrganizacionalPage() {
  const [activeSection, setActiveSection] = useState('dofa');

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">
        Contexto Organizacional
      </h1>

      <ContextoOrganizacionalTab activeSection={activeSection} />
    </div>
  );
}
```

## Dependencias

- `@/components/common/Tabs` - Sistema de tabs
- `@/components/common/Button` - Botones
- `@/components/common/Card` - Contenedores
- `@/components/common/Badge` - Indicadores de estado
- `@/components/common/EmptyState` - Estados vacíos
- `lucide-react` - Iconos

## Estilo y Diseño

Sigue el design system del proyecto:
- Variante de tabs: `pills`
- Cards con padding dinámico
- Responsive grid layouts
- Dark mode compatible
- Animaciones suaves en transiciones

## Notas de Desarrollo

1. **Configuración de subtabs**: Centralizada en constante `SUBTABS`
2. **IDs de subtabs**: Definidos en `SUBTAB_IDS` para type safety
3. **Renderizado condicional**: Cada subtab tiene su función `render*Section()`
4. **Handlers preparados**: Todos los eventos tienen handlers, listos para conectar con API
5. **Mock data**: Facilita desarrollo sin backend (cambiar a `null` para ver empty states)

## Autor

Sistema de Gestión StrateKaz
Módulo: Motor de Riesgos
Fecha: 2025-01
