# Componentes UI - Requisitos Legales

## Descripción

Conjunto completo de componentes para la gestión de Requisitos Legales en el módulo de Motor de Cumplimiento, siguiendo el patrón establecido por MatrizLegalTab.

## Componentes Creados

### 1. `RequisitosLegalesTab.tsx` (Componente Principal)

**Características:**
- Dashboard de vencimientos con alertas visuales
- Sistema de filtros por estado y búsqueda
- Badges de filtros rápidos (Todos, Vigentes, Próximos a Vencer, Vencidos)
- CRUD completo de requisitos
- Integración con hooks de React Query
- Exportación de datos

**Props:**
```typescript
interface RequisitosLegalesTabProps {
  activeSection?: string; // Código de subsección activa
}
```

**Uso:**
```tsx
import { RequisitosLegalesTab } from '@/features/cumplimiento/components/requisitos-legales';

<RequisitosLegalesTab activeSection="requisitos-legales" />
```

---

### 2. `VencimientosCard.tsx` (Dashboard de Alertas)

**Características:**
- 4 KPIs con colores: Total, Vigentes (verde), Próximos a Vencer (amarillo), Vencidos (rojo)
- Lista de requisitos críticos ordenados por urgencia
- Indicador de días para vencer con formato legible
- Sistema de colores dinámico según estado
- Click handler para edición rápida

**Colores por Estado:**
- Verde (success): Vigente, >30 días para vencer
- Amarillo (warning): Próximo a vencer, ≤30 días
- Rojo (danger): Vencido, días negativos
- Gris (gray): No Aplica, sin vencimiento

**Props:**
```typescript
interface VencimientosCardProps {
  requisitos: EmpresaRequisito[];
  onRequisitoClick?: (requisito: EmpresaRequisito) => void;
}
```

---

### 3. `RequisitosTable.tsx` (Tabla con TanStack Table)

**Características:**
- Paginación del servidor
- Columnas: Requisito, Sistemas, Expedición, Vencimiento, Días para Vencer, Estado, Responsable, Acciones
- Badges de estado con íconos (CheckCircle2, AlertTriangle, XCircle, Clock)
- Componente `DiasVencerBadge` con colores dinámicos
- Empty state y loading skeleton
- Acciones CRUD (Editar, Eliminar)

**Props:**
```typescript
interface RequisitosTableProps {
  data: EmpresaRequisito[];
  totalCount: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onEdit: (requisito: EmpresaRequisito) => void;
  onDelete: (requisito: EmpresaRequisito) => void;
  isLoading?: boolean;
}
```

---

### 4. `RequisitoFormModal.tsx` (Modal CRUD)

**Características:**
- Formulario completo con validación
- Selección de requisito legal desde catálogo
- Campos de documento: número, fechas (expedición, vencimiento)
- Upload de documento soporte (PDF, DOC, DOCX, JPG, PNG)
- Selector de estado (6 opciones)
- Campo de justificación obligatorio para "No Aplica"
- Observaciones adicionales
- Modo crear/editar automático

**Estados Disponibles:**
1. Vigente
2. Próximo a Vencer
3. Vencido
4. En Trámite
5. En Renovación
6. No Aplica (requiere justificación)

**Props:**
```typescript
interface RequisitoFormModalProps {
  requisito: EmpresaRequisito | null;
  isOpen: boolean;
  onClose: () => void;
  empresaId: number;
}
```

---

### 5. `index.ts` (Barrel Export)

Exporta todos los componentes para importación simplificada:

```typescript
export { RequisitosLegalesTab } from './RequisitosLegalesTab';
export { RequisitosTable } from './RequisitosTable';
export { RequisitoFormModal } from './RequisitoFormModal';
export { VencimientosCard } from './VencimientosCard';
```

---

## Hooks Utilizados

### Del módulo `cumplimiento/hooks/useRequisitos.ts`:

1. **`useEmpresaRequisitos(filters)`**
   - Lista de requisitos de empresa con filtros
   - Paginación y búsqueda

2. **`useVencimientos(empresaId, dias)`**
   - Requisitos próximos a vencer
   - Por defecto: 30 días

3. **`useCreateEmpresaRequisitoWithFile()`**
   - Crear requisito con upload de archivo

4. **`useUpdateEmpresaRequisitoWithFile()`**
   - Actualizar requisito con upload de archivo

5. **`useRequisitosLegales()`**
   - Catálogo de requisitos legales para selección

---

## Tipos TypeScript Utilizados

```typescript
import type {
  EmpresaRequisito,
  EmpresaRequisitoCreate,
  EstadoRequisito,
  RequisitoLegal,
} from '../../types/requisitosLegales';
```

**Estados (enum):**
```typescript
type EstadoRequisito =
  | 'vigente'
  | 'proximo_vencer'
  | 'vencido'
  | 'en_tramite'
  | 'renovando'
  | 'no_aplica';
```

---

## Design System

### Componentes Comunes Usados:
- `Button` (primary, outline, ghost)
- `Card` (padding variants: none, sm, md)
- `Badge` (success, warning, danger, info, gray)
- `EmptyState`
- `ConfirmDialog`
- `BaseModal`
- `Input`
- `Textarea`

### Íconos (lucide-react):
- `FileText` - Documentos
- `CheckCircle2` - Vigente
- `AlertTriangle` - Próximo a vencer
- `XCircle` - Vencido
- `Clock` - En proceso
- `Edit`, `Trash2` - Acciones
- `Plus`, `Download`, `Filter` - Toolbar
- `Upload` - Archivos

### Colores TailwindCSS:
- **Verde (success):** Vigentes, >30 días
- **Amarillo (warning):** Próximos a vencer, ≤30 días
- **Rojo (danger):** Vencidos
- **Azul (info):** En trámite
- **Gris (gray):** No aplica

---

## Funcionalidades Implementadas (Semana 7)

✅ Dashboard de vencimientos con alertas visuales
✅ Tabla de requisitos con estado
✅ Colores por estado (verde, amarillo, rojo)
✅ CRUD con modales
✅ Filtros por tipo, estado, sistema
✅ Indicador de días para vencer
✅ Upload de documentos soporte
✅ Justificación para "No Aplica"
✅ Badges de filtros rápidos
✅ Empty states y loading states
✅ Paginación del servidor
✅ Dark mode compatible

---

## Integración con Backend

**Endpoints utilizados:**
- `GET /motor_cumplimiento/requisitos-legales/empresa-requisitos/` - Lista
- `POST /motor_cumplimiento/requisitos-legales/empresa-requisitos/` - Crear
- `PATCH /motor_cumplimiento/requisitos-legales/empresa-requisitos/{id}/` - Actualizar
- `DELETE /motor_cumplimiento/requisitos-legales/empresa-requisitos/{id}/` - Eliminar
- `GET /motor_cumplimiento/requisitos-legales/empresa-requisitos/vencimientos/` - Alertas
- `GET /motor_cumplimiento/requisitos-legales/requisitos/` - Catálogo

---

## Próximos Pasos

1. Implementar exportación a Excel
2. Agregar filtros avanzados (por sistema, por responsable)
3. Implementar sistema de notificaciones automáticas
4. Agregar vista de renovación masiva
5. Integrar con calendario de vencimientos
6. Agregar gráficos de cumplimiento
7. Implementar historial de cambios

---

## Convenciones Seguidas

- ✅ Patrón MatrizLegalTab como referencia
- ✅ Hooks de React Query para data fetching
- ✅ TanStack Table para tablas
- ✅ BaseModal para modales
- ✅ Validación de formularios
- ✅ Estados de loading y error
- ✅ Dark mode compatible
- ✅ TypeScript estricto
- ✅ Comentarios JSDoc
- ✅ Estructura de carpetas consistente

---

## Archivos Creados

```
frontend/src/features/cumplimiento/components/requisitos-legales/
├── index.ts                      # Barrel export
├── RequisitosLegalesTab.tsx      # Componente principal (400+ líneas)
├── VencimientosCard.tsx          # Dashboard de alertas (230+ líneas)
├── RequisitosTable.tsx           # Tabla TanStack (350+ líneas)
├── RequisitoFormModal.tsx        # Modal CRUD (350+ líneas)
└── README.md                     # Este archivo
```

**Total:** 5 archivos, ~1,500 líneas de código TypeScript/React

---

## Ejemplo de Uso Completo

```tsx
import { RequisitosLegalesTab } from '@/features/cumplimiento/components/requisitos-legales';

function CumplimientoPage() {
  return (
    <div>
      <h1>Motor de Cumplimiento</h1>
      <RequisitosLegalesTab activeSection="requisitos-legales" />
    </div>
  );
}
```

---

Creado siguiendo las especificaciones de la Semana 7 del cronograma del proyecto SGI StrateKaz.
