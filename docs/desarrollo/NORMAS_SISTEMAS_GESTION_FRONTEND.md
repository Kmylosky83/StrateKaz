# Vista Frontend de Normas y Sistemas de Gestión

**Fecha:** 2026-01-20
**Versión:** v3.4+
**Estado:** ✅ Implementado

## Descripción

Vista CRUD completa para gestión de Normas y Sistemas de Gestión desde el Tab "Configuración" en Dirección Estratégica.

El sistema NO maneja solo Normas ISO, sino un **catálogo universal** que incluye:

- **Normas ISO:** ISO 9001, ISO 14001, ISO 45001, ISO 27001
- **Sistemas Colombianos:** SG-SST (Decreto 1072/2015), PESV (Resolución 40595/2022)
- **Otras Normativas:** Decreto 1072, Resolución 312/2019, y normativas personalizadas

## Arquitectura

### Patrón de Vista
**Vista 2: Lista CRUD** según `docs/desarrollo/CATALOGO_VISTAS_UI.md`

- Section Header fuera del Card (icono + título + contador + botón crear)
- DataTable en Card con acciones por fila
- Empty State con CTA
- Modal de formulario para crear/editar
- ConfirmDialog para eliminar

### Estructura de Archivos

```
frontend/src/features/gestion-estrategica/
├── components/
│   ├── NormasISOSection.tsx           # Componente principal (Vista 2)
│   └── modals/
│       └── NormaISOFormModal.tsx      # Modal de formulario
├── hooks/
│   └── useNormasISO.ts                # React Query hooks
└── api/
    └── strategicApi.ts                # API client (actualizado)
```

## Componentes

### 1. NormasISOSection.tsx
- **Ubicación:** `components/NormasISOSection.tsx`
- **Responsabilidad:** Lista principal de normas y sistemas de gestión
- **Características:**
  - Tabla con columnas: Norma, Código, Categoría, Color, Estado, Acciones
  - Badge "Sistema" para normas es_sistema=true
  - Preview visual de color e icono
  - ActionButtons con restricciones RBAC
  - Empty state cuando no hay datos
  - Soporta: ISO, PESV, SG-SST y normativas personalizadas

### 2. NormaISOFormModal.tsx
- **Ubicación:** `components/modals/NormaISOFormModal.tsx`
- **Responsabilidad:** Formulario de creación/edición
- **Características:**
  - Campos: code, name, short_name, description, category, icon, color, orden
  - Selector de icono (Lucide React)
  - Color picker con presets
  - Preview en tiempo real
  - Validación: código único, formato hex
  - Modo create/edit
  - Ejemplos: ISO_9001, PESV, SG_SST, etc.

## Hooks

### useNormasISO.ts
- **Ubicación:** `hooks/useNormasISO.ts`
- **Exports:**
  - `useNormasISO()` - Lista completa
  - `useNormaISO(id)` - Detalle por ID
  - `useNormasISOChoices()` - Opciones para selects
  - `useNormasISOByCategory()` - Agrupadas por categoría
  - `useCreateNormaISO()` - Crear
  - `useUpdateNormaISO()` - Actualizar
  - `useDeleteNormaISO()` - Eliminar

## API Client

### Endpoints Implementados

```typescript
normasISOApi.getAll()              // GET /api/configuracion/normas-iso/
normasISOApi.getById(id)           // GET /api/configuracion/normas-iso/{id}/
normasISOApi.getChoices()          // GET /api/configuracion/normas-iso/choices/
normasISOApi.getByCategory()      // GET /api/configuracion/normas-iso/by-category/
normasISOApi.create(data)          // POST /api/configuracion/normas-iso/
normasISOApi.update(id, data)      // PATCH /api/configuracion/normas-iso/{id}/
normasISOApi.delete(id)            // DELETE /api/configuracion/normas-iso/{id}/
```

### DTOs

```typescript
interface CreateNormaISODTO {
  code: string;             // Requerido (ej: "ISO-9001")
  name: string;             // Requerido
  short_name?: string;      // Opcional (ej: "ISO 9001")
  description?: string;     // Opcional
  category: string;         // Requerido
  icon?: string;            // Opcional (nombre de icono Lucide)
  color?: string;           // Opcional (formato HEX #RRGGBB)
  orden?: number;           // Opcional (default: 0)
  is_active?: boolean;      // Opcional (default: true)
}

interface UpdateNormaISODTO extends Partial<CreateNormaISODTO> {}
```

## Integración

### ConfiguracionTab.tsx

```typescript
import { NormasISOSection } from './NormasISOSection';

const SECTION_COMPONENTS: Record<string, React.ComponentType> = {
  empresa: EmpresaSection,
  sedes: SedesSection,
  integraciones: IntegracionesSection,
  'normas-iso': NormasISOSection,  // ← Nueva sección
  branding: BrandingSection,
  modulos: ModulosAndFeaturesSection,
};
```

### Permisos

```typescript
// constants/permissions.ts
export const Sections = {
  NORMAS_ISO: 'normas-iso',  // ← Código de sección
  // ...
};
```

**Acciones RBAC:**
- `view` - Ver lista de normas
- `create` - Crear norma custom
- `edit` - Editar norma custom
- `delete` - Eliminar norma custom

**Restricción:** NO se pueden editar/eliminar normas del sistema (`es_sistema=true`)

## Características

### 1. Gestión de Color
- Color picker nativo HTML5
- Input manual con validación HEX (#RRGGBB)
- 10 colores predefinidos
- Preview en tiempo real

### 2. Gestión de Iconos
- Selector con 10 iconos Lucide React predefinidos:
  - FileCheck, Shield, Award, Leaf, Users
  - Lock, Heart, TrendingUp, BarChart3, Target
- Preview del icono seleccionado

### 3. Categorías
- Dinámicas desde backend
- Opciones cargadas via `getChoices()`
- Categorías incluyen:
  - **ISO**: Calidad, Ambiental, SST, Seguridad Información
  - **PESV**: Seguridad Vial
  - **SG_SST**: Seguridad y Salud en el Trabajo
  - **AMBIENTAL**: Gestión Ambiental
  - **CALIDAD**: Gestión de Calidad
  - **SEGURIDAD_INFORMACION**: Ciberseguridad
  - **OTRAS**: Normativas personalizadas

### 4. Validaciones
- Código único (validado en backend)
- Formato de color hex
- Campos requeridos: code, name, category

## Design System

### Componentes Utilizados
- `Card` - Contenedor principal
- `Badge` - Estados y categorías
- `Button` - Acciones
- `BaseModal` - Modal de formulario
- `Input`, `Select`, `Textarea` - Formularios
- `ActionButtons` - Acciones con RBAC
- `ConfirmDialog` - Confirmación de eliminación
- `Alert` - Mensajes informativos

### Toasts (Sonner)

- ✅ Success: "Norma/Sistema de Gestión creado exitosamente"
- ✅ Success: "Norma/Sistema de Gestión actualizado exitosamente"
- ✅ Success: "Norma/Sistema de Gestión eliminado exitosamente"
- ❌ Error: Mensajes de error del backend

## Estados de Carga

### Loading States
- Skeleton en tabla (3 filas animadas)
- Spinner en botones durante mutaciones
- Disabled de botones durante carga

### Empty State
- Icono FileCheck grande
- Mensaje: "No hay normas configuradas"
- Descripción: "Agregue normas ISO, PESV, SG-SST u otras normativas aplicables a su organización"
- Botón CTA: "Agregar Primera Norma" (con permiso create)

## Responsive Design

- **Desktop:** Tabla completa con todas las columnas
- **Tablet:** Grid responsive, colores colapsados
- **Mobile:** Cards apilados (future implementation)

## Accesibilidad

- Labels descriptivos
- ARIA attributes en botones
- Keyboard navigation
- Color contrast WCAG AA

## Testing

### Casos de Prueba

1. ✅ Listar normas y sistemas de gestión activos
2. ✅ Crear norma custom (ISO, PESV, SG-SST, etc.)
3. ✅ Editar norma custom
4. ✅ Eliminar norma custom
5. ❌ Intentar editar norma del sistema (debe fallar)
6. ❌ Intentar eliminar norma del sistema (debe fallar)
7. ✅ Validar código único
8. ✅ Validar formato de color
9. ✅ Preview de norma en tiempo real
10. ✅ Filtrar por categoría

### Datos de Prueba

```typescript
// Norma ISO del Sistema (no editable)
{
  id: 1,
  code: "ISO_9001",
  name: "ISO 9001:2015 - Sistemas de Gestión de Calidad",
  short_name: "ISO 9001",
  category: "CALIDAD",
  icon: "Award",
  color: "#3b82f6",
  orden: 1,
  es_sistema: true,
  is_active: true
}

// Sistema Colombiano (editable)
{
  id: 5,
  code: "PESV",
  name: "Plan Estratégico de Seguridad Vial - Resolución 40595/2022",
  short_name: "PESV",
  category: "PESV",
  icon: "Shield",
  color: "#f59e0b",
  orden: 5,
  es_sistema: false,
  is_active: true
}

// SG-SST (editable)
{
  id: 6,
  code: "SG_SST",
  name: "Sistema de Gestión de Seguridad y Salud en el Trabajo - Decreto 1072/2015",
  short_name: "SG-SST",
  category: "SG_SST",
  icon: "Heart",
  color: "#ef4444",
  orden: 6,
  es_sistema: false,
  is_active: true
}

// Norma Custom Personalizada (editable)
{
  id: 10,
  code: "NORMA_INTERNA_01",
  name: "Norma Interna de Procesos",
  short_name: "NI-01",
  category: "OTRAS",
  icon: "FileCheck",
  color: "#10b981",
  orden: 100,
  es_sistema: false,
  is_active: true
}
```

## Dependencias

### Backend
- ✅ ViewSet: `NormaISOViewSet` (configuracion/views.py)
- ✅ URL: `/api/configuracion/normas-iso/`
- ✅ Serializer: `NormaISOSerializer`
- ✅ Model: `NormaISO`
- ✅ Permissions: `IsAuthenticated` + section permissions

### Frontend
- ✅ React 18+
- ✅ TypeScript 5+
- ✅ TanStack Query v5
- ✅ Sonner (toasts)
- ✅ Lucide React (iconos)
- ✅ Tailwind CSS
- ✅ Design System custom

## Notas de Implementación

1. **Alcance Ampliado:** El sistema NO maneja solo ISO. Soporta catálogo universal: ISO, PESV, SG-SST, Decreto 1072, Resolución 312/2019, y normativas personalizadas.

2. **Normas del Sistema:** No se pueden editar ni eliminar. Solo se muestran en modo lectura con badge "Sistema".

3. **Códigos Únicos:** El backend valida que no existan códigos duplicados. Frontend muestra error del backend en toast. Ejemplos: `ISO_9001`, `PESV`, `SG_SST`, `DECRETO_1072`.

4. **Colores:** Solo se aceptan colores en formato HEX (#RRGGBB). El color picker facilita la selección.

5. **Iconos:** Lista limitada a 10 iconos relevantes. Se puede extender agregando más opciones a `ICON_OPTIONS`.

6. **Categorías:** Dinámicas desde backend. No hardcoded en frontend. Incluyen: ISO, PESV, SG_SST, AMBIENTAL, CALIDAD, SEGURIDAD_INFORMACION, OTRAS.

7. **Ordenamiento:** Campo `orden` permite controlar el orden en listas. Menor valor = primero.

8. **Nomenclatura en UI:** Todos los textos visibles usan "Normas y Sistemas de Gestión" en lugar de solo "Normas ISO".

## Ejemplos de Normas Soportadas

### Normas ISO Internacionales

- **ISO 9001:2015** - Sistema de Gestión de Calidad
- **ISO 14001:2015** - Sistema de Gestión Ambiental
- **ISO 45001:2018** - Sistema de Gestión de Seguridad y Salud en el Trabajo
- **ISO 27001:2013** - Sistema de Gestión de Seguridad de la Información

### Sistemas Colombianos

- **SG-SST** - Sistema de Gestión de Seguridad y Salud en el Trabajo (Decreto 1072 de 2015)
- **PESV** - Plan Estratégico de Seguridad Vial (Resolución 40595 de 2022)

### Normativas Colombianas

- **Decreto 1072 de 2015** - Decreto Único Reglamentario del Sector Trabajo
- **Resolución 312 de 2019** - Estándares Mínimos del Sistema de Gestión de SST
- **Resolución 0312 de 2019** - Estándares Mínimos SG-SST
- **Decreto 171 de 2016** - Reglamentación PESV

### Normativas Personalizadas

Las organizaciones pueden crear normativas internas como:

- Normas de calidad internas
- Procedimientos específicos del sector
- Requisitos de clientes
- Estándares corporativos

## Changelog

### v3.4.1 - 2026-01-20

- ✅ Actualización de nomenclatura a "Normas y Sistemas de Gestión"
- ✅ Ampliación de alcance: ISO, PESV, SG-SST y otras normativas
- ✅ Actualización de textos en UI
- ✅ Actualización de documentación
- ✅ Ejemplos de normas colombianas

### v3.4 - 2026-01-20

- ✅ Implementación inicial completa
- ✅ Vista 2: Lista CRUD
- ✅ Modal de formulario con validaciones
- ✅ API client con todos los endpoints
- ✅ Hooks React Query
- ✅ Integración con ConfiguracionTab
- ✅ Permisos RBAC
- ✅ Design System completo
- ✅ TypeScript types
- ✅ Documentación

## Próximos Pasos

1. **Testing E2E:** Cypress tests para flujos completos
2. **Mobile View:** Optimizar para dispositivos móviles
3. **Filtros Avanzados:** Por categoría, estado, tipo
4. **Búsqueda:** Full-text search en normas
5. **Exportación:** PDF/Excel de normas
6. **Iconos Dinámicos:** Permitir cualquier icono Lucide
7. **Temas:** Soporte para dark mode completo
8. **Drag & Drop:** Reordenar normas por arrastre
9. **Bulk Actions:** Activar/desactivar múltiples normas
10. **Historial:** Auditoría de cambios en normas

## Referencias

- **Backend ViewSet:** `backend/apps/gestion_estrategica/configuracion/views.py`
- **Model:** `backend/apps/gestion_estrategica/configuracion/models.py`
- **Catálogo UI:** `docs/desarrollo/CATALOGO_VISTAS_UI.md`
- **Design System:** Components en `frontend/src/components/`
- **Permisos:** `frontend/src/constants/permissions.ts`

---

**Implementado por:** Claude Code
**Revisado por:** [Pendiente]
**Aprobado por:** [Pendiente]
