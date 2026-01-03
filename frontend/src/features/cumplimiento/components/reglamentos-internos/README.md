# Componentes UI - Reglamentos Internos

Componentes React para la gestión de reglamentos internos de la empresa.

## Estructura de Archivos

```
reglamentos-internos/
├── index.ts                      # Barrel export
├── ReglamentosInternosTab.tsx   # Componente principal (Tab)
├── ReglamentosTable.tsx          # Tabla con TanStack Table
├── ReglamentoFormModal.tsx       # Modal de formulario CRUD
└── README.md                     # Este archivo
```

## Componentes Creados

### 1. ReglamentosInternosTab.tsx

**Descripción**: Componente principal del tab de Reglamentos Internos.

**Características**:
- Dashboard con 5 cards de estadísticas (Total, Vigentes, En Revisión, Aprobados, Obsoletos)
- Barra de acciones con botones de Filtros, Exportar y Nuevo Reglamento
- Panel de filtros expandible (Estado, Búsqueda)
- Badges de filtros rápidos por estado
- Integración con hook `useReglamentos`
- Modales para CRUD y confirmación de eliminación

**Estados gestionados**:
- Filtros de búsqueda y paginación
- Modal de formulario (crear/editar)
- Modal de confirmación de eliminación
- Estado de carga y errores

### 2. ReglamentosTable.tsx

**Descripción**: Tabla de reglamentos con TanStack Table v8.

**Columnas**:
1. Código (texto)
2. Nombre del Reglamento (con tipo)
3. Versión (formato monospace)
4. Estado (badge con colores)
5. Sistemas (badges múltiples)
6. Fecha Vigencia
7. Próxima Revisión (con alertas de vencimiento)
8. Aprobado Por
9. Acciones (Descargar, Editar, Eliminar)

**Características**:
- Paginación del servidor
- Estados vacíos y de carga
- Hover effects
- Responsive design
- Dark mode completo

**Colores por Estado**:
- `borrador` → Gris (FileText icon)
- `en_revision` → Amarillo/Warning (Clock icon)
- `aprobado` → Azul/Info (FileCheck icon)
- `vigente` → Verde/Success (CheckCircle2 icon)
- `obsoleto` → Rojo/Danger (XCircle icon)

### 3. ReglamentoFormModal.tsx

**Descripción**: Modal para crear/editar reglamentos.

**Secciones del formulario**:

1. **Información Básica**
   - Tipo de reglamento (select)
   - Código (input)
   - Nombre (input)
   - Descripción (textarea)

2. **Estado y Versión**
   - Estado (select con 5 opciones)
   - Versión actual (input)

3. **Fechas de Control**
   - Fecha de aprobación (date)
   - Fecha de vigencia (date)
   - Próxima revisión (date)

4. **Sistemas de Gestión Aplicables**
   - SST (checkbox)
   - Ambiental (checkbox)
   - Calidad (checkbox)
   - PESV (checkbox)

5. **Documento del Reglamento**
   - Upload de archivo (PDF/DOC)
   - Muestra archivo existente en modo edición

6. **Observaciones**
   - Textarea para información adicional

**Validaciones**:
- Tipo de reglamento requerido
- Código requerido
- Nombre requerido
- Versión requerida
- Al menos un sistema de gestión debe estar seleccionado

## Integración con el Backend

### Endpoints utilizados:

```typescript
// GET - Listar reglamentos con filtros
GET /motor_cumplimiento/reglamentos-internos/reglamentos/
  ?empresa={empresaId}
  &estado={estado}
  &search={search}
  &page={page}
  &page_size={pageSize}

// GET - Obtener tipos de reglamento
GET /motor_cumplimiento/reglamentos-internos/tipos/

// POST - Crear reglamento (multipart/form-data)
POST /motor_cumplimiento/reglamentos-internos/reglamentos/

// PATCH - Actualizar reglamento (multipart/form-data)
PATCH /motor_cumplimiento/reglamentos-internos/reglamentos/{id}/

// DELETE - Eliminar reglamento
DELETE /motor_cumplimiento/reglamentos-internos/reglamentos/{id}/
```

## Hooks Utilizados

```typescript
import {
  useReglamentos,
  useTiposReglamento,
  useCreateReglamentoWithFile,
  useUpdateReglamentoWithFile,
} from '../../hooks/useReglamentos';
```

## Tipos TypeScript

```typescript
import type {
  Reglamento,
  CreateReglamentoDTO,
  UpdateReglamentoDTO,
  EstadoReglamento,
  ReglamentoFilters,
} from '../../types/cumplimiento.types';
```

## Componentes Comunes Utilizados

```typescript
// UI Components
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { EmptyState } from '@/components/common/EmptyState';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';

// Form Components
import { Input } from '@/components/forms/Input';
import { Textarea } from '@/components/forms/Textarea';
import { Alert } from '@/components/common/Alert';

// Modals
import { BaseModal } from '@/components/modals/BaseModal';

// Icons (lucide-react)
import {
  FileText,
  Plus,
  Download,
  Filter,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileCheck,
  Clock,
  Edit,
  Trash2,
  Upload,
} from 'lucide-react';
```

## Funcionalidades Implementadas

### CRUD Completo
- ✅ Crear reglamento con upload de documento
- ✅ Editar reglamento (actualizar datos y documento)
- ✅ Eliminar reglamento (con confirmación)
- ✅ Listar reglamentos con paginación

### Filtros
- ✅ Filtro por estado (select)
- ✅ Búsqueda por código/nombre
- ✅ Filtros rápidos con badges
- ✅ Limpiar filtros

### Visualización
- ✅ Cards de estadísticas por estado
- ✅ Tabla con todas las columnas requeridas
- ✅ Badges de sistemas aplicables
- ✅ Indicador de próxima revisión con alertas
- ✅ Descarga de documentos

### Control de Versiones
- ✅ Muestra versión actual en la tabla
- ✅ Campo de versión en el formulario
- ℹ️ Historial de versiones (pendiente - requiere componente adicional)

### Publicaciones y Socializaciones
- ℹ️ Registro de publicaciones (pendiente - requiere componente adicional)
- ℹ️ Registro de socializaciones (pendiente - requiere componente adicional)

## Próximas Funcionalidades

### Componentes Adicionales Sugeridos:

1. **VersionesHistorialModal.tsx**
   - Lista de versiones anteriores
   - Comparación entre versiones
   - Descarga de versiones antiguas

2. **PublicacionesTab.tsx**
   - Registro de publicaciones
   - Medios de publicación
   - Evidencias de publicación

3. **SocializacionesTab.tsx**
   - Registro de socializaciones
   - Tipos de socialización
   - Lista de asistencia
   - Evidencias

4. **AprobacionFlow.tsx**
   - Workflow de aprobación
   - Asignación de aprobadores
   - Notificaciones

## Uso

```typescript
import { ReglamentosInternosTab } from '@/features/cumplimiento/components';

// En el componente padre
<ReglamentosInternosTab activeSection="reglamentos-internos" />
```

## Notas de Desarrollo

- Todos los componentes soportan Dark Mode
- Diseño responsive (móvil, tablet, desktop)
- Manejo de estados de carga y error
- Validaciones de formulario
- Mensajes de éxito/error con toast
- Accesibilidad (labels, alt text, keyboard navigation)

## Colores del Design System

```typescript
// Estados de Reglamento
const ESTADO_COLORS = {
  borrador: 'gray',      // bg-gray-100, text-gray-800
  en_revision: 'warning', // bg-warning-100, text-warning-800
  aprobado: 'info',      // bg-info-100, text-info-800
  vigente: 'success',    // bg-success-100, text-success-800
  obsoleto: 'danger',    // bg-danger-100, text-danger-800
};

// Sistemas de Gestión
const SISTEMA_COLORS = {
  sst: 'warning',        // Amarillo
  ambiental: 'success',  // Verde
  calidad: 'info',       // Azul
  pesv: 'primary',       // Primario
};
```

## Testing

Para testear los componentes:

```bash
# Ejecutar en el directorio frontend
npm run dev
```

Navegar a: `http://localhost:5173/cumplimiento/reglamentos-internos`

---

**Fecha de creación**: 2025-12-25
**Versión**: 1.0.0
**Autor**: Sistema de Gestión StrateKaz
