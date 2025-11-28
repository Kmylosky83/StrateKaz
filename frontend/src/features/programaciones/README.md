# Módulo de Programaciones

Sistema completo de gestión de programaciones de recolección para Grasas y Huesos del Norte.

## 📋 Tabla de Contenidos

- [Descripción](#descripción)
- [Estructura de Archivos](#estructura-de-archivos)
- [Componentes](#componentes)
- [API y Hooks](#api-y-hooks)
- [Tipos TypeScript](#tipos-typescript)
- [Uso](#uso)
- [Permisos](#permisos)
- [Flujo de Estados](#flujo-de-estados)

## 📝 Descripción

El módulo de **Programaciones** permite gestionar el ciclo completo de las recolecciones de material, desde la programación inicial hasta la completación, incluyendo:

- Creación y edición de programaciones
- Asignación de recolectores y vehículos
- Gestión de estados (Pendiente → Asignada → En Ruta → Completada)
- Reprogramación con historial
- Vista de tabla y calendario
- Filtros avanzados
- Estadísticas en tiempo real

## 📁 Estructura de Archivos

```
programaciones/
├── api/
│   ├── programacionesApi.ts      # Cliente Axios para API
│   └── useProgramaciones.ts      # React Query hooks
├── components/
│   ├── ProgramacionesTable.tsx   # Tabla con filas expandibles
│   ├── ProgramacionForm.tsx      # Formulario crear/editar
│   ├── AsignarRecolectorModal.tsx # Modal asignación recolector
│   ├── CambiarEstadoModal.tsx    # Modal cambio de estado
│   ├── ReprogramarModal.tsx      # Modal reprogramar
│   └── CalendarioView.tsx        # Vista calendario mensual
├── pages/
│   └── ProgramacionesPage.tsx    # Página principal
├── types/
│   └── programacion.types.ts     # Tipos TypeScript
├── index.ts                       # Barrel exports
└── README.md                      # Este archivo
```

## 🧩 Componentes

### ProgramacionesPage

**Descripción:** Página principal del módulo con vista de tabla y calendario intercambiable.

**Características:**
- Toggle entre vista tabla y calendario
- Filtros avanzados por estado, tipo, prioridad, recolector y fechas
- Estadísticas en tiempo real (total, pendientes, en proceso, completadas)
- Búsqueda por código o proveedor
- Control de acceso basado en permisos

**Props:** Ninguna (componente de página)

### ProgramacionesTable

**Descripción:** Tabla con filas expandibles que muestra todas las programaciones.

**Props:**
```typescript
interface ProgramacionesTableProps {
  programaciones: Programacion[];
  onEdit: (programacion: Programacion) => void;
  onDelete: (programacion: Programacion) => void;
  onAsignarRecolector: (programacion: Programacion) => void;
  onCambiarEstado: (programacion: Programacion) => void;
  onReprogramar: (programacion: Programacion) => void;
  canManage: boolean;
  isLoading?: boolean;
}
```

**Características:**
- Filas expandibles con información detallada
- Badges de estado y prioridad coloreados
- Acciones contextuales según estado
- Información de proveedor, recolector y cantidades
- Metadata de creación y modificación

### ProgramacionForm

**Descripción:** Formulario para crear o editar programaciones.

**Props:**
```typescript
interface ProgramacionFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateProgramacionDTO | UpdateProgramacionDTO) => void;
  programacion?: Programacion | null;
  isLoading?: boolean;
}
```

**Características:**
- Selección de proveedor con preview de información
- Selección de unidad de negocio
- Tipo de recolección y prioridad
- Fecha, hora inicio/fin
- Cantidad estimada y vehículo
- Validación con Zod
- Preview de información del proveedor seleccionado

### AsignarRecolectorModal

**Descripción:** Modal para asignar recolector a una programación.

**Props:**
```typescript
interface AsignarRecolectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: AsignarRecolectorDTO) => void;
  programacion: Programacion | null;
  isLoading?: boolean;
}
```

**Características:**
- Lista de recolectores activos
- Información del recolector (zona, vehículos disponibles)
- Asignación de vehículo
- Observaciones de asignación

### CambiarEstadoModal

**Descripción:** Modal para cambiar el estado de una programación con validaciones según flujo.

**Props:**
```typescript
interface CambiarEstadoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CambiarEstadoDTO) => void;
  programacion: Programacion | null;
  isLoading?: boolean;
}
```

**Características:**
- Estados disponibles según estado actual (flujo lógico)
- Campo obligatorio de cantidad recolectada al completar
- Motivo obligatorio al cancelar
- Validaciones dinámicas
- Advertencias visuales

### ReprogramarModal

**Descripción:** Modal para reprogramar una recolección.

**Props:**
```typescript
interface ReprogramarModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ReprogramarDTO) => void;
  programacion: Programacion | null;
  isLoading?: boolean;
}
```

**Características:**
- Nueva fecha y horario
- Motivo de reprogramación obligatorio (min 10 caracteres)
- Opción de mantener o cambiar recolector
- Fecha mínima: mañana
- Advertencia de impacto

### CalendarioView

**Descripción:** Vista de calendario mensual con eventos de programaciones.

**Props:**
```typescript
interface CalendarioViewProps {
  programaciones: Programacion[];
  onProgramacionClick: (programacion: Programacion) => void;
  isLoading?: boolean;
}
```

**Características:**
- Vista mensual con días de la semana
- Eventos coloreados por estado
- Borde coloreado por prioridad
- Click en evento para ver detalles
- Navegación entre meses
- Indicador de "hoy"
- Máximo 3 eventos por día con indicador "+N más"
- Estadísticas del mes actual

## 🔌 API y Hooks

### Cliente API (programacionesApi.ts)

```typescript
// CRUD
programacionesAPI.getProgramaciones(filters)
programacionesAPI.getProgramacion(id)
programacionesAPI.createProgramacion(data)
programacionesAPI.updateProgramacion(id, data)
programacionesAPI.deleteProgramacion(id)

// Acciones
programacionesAPI.asignarRecolector(id, data)
programacionesAPI.cambiarEstado(id, data)
programacionesAPI.reprogramar(id, data)
programacionesAPI.cancelarProgramacion(id, motivo)
programacionesAPI.iniciarRuta(id)
programacionesAPI.completarRecoleccion(id, cantidadKg, observaciones)

// Consultas
programacionesAPI.getEstadisticas(fechaDesde, fechaHasta)
programacionesAPI.getHistorial(id)
programacionesAPI.getRecolectores()
programacionesAPI.getRecolectoresDisponibles(fecha)
programacionesAPI.getProveedores()
programacionesAPI.getUnidadesNegocio()
programacionesAPI.getProgramacionesCalendario(fechaInicio, fechaFin, filtros)
```

### React Query Hooks

```typescript
// Queries
useProgramaciones(filters)
useProgramacion(id)
useEstadisticasProgramaciones(fechaDesde, fechaHasta)
useHistorialProgramacion(id)
useRecolectores()
useRecolectoresDisponibles(fecha)
useProveedoresProgramacion()
useUnidadesNegocioProgramacion()
useProgramacionesCalendario(fechaInicio, fechaFin, filtros)

// Mutations
useCreateProgramacion()
useUpdateProgramacion()
useDeleteProgramacion()
useAsignarRecolector()
useCambiarEstado()
useReprogramar()
useCancelarProgramacion()
useIniciarRuta()
useCompletarRecoleccion()
```

**Características de los Hooks:**
- Invalidación automática de caché
- Toast notifications de éxito/error
- Manejo de errores con mensajes específicos
- Refetch automático después de mutaciones

## 📦 Tipos TypeScript

### Programacion

```typescript
interface Programacion {
  id: number;
  codigo: string;
  proveedor: number;
  proveedor_razon_social: string;
  proveedor_ciudad: string;
  proveedor_direccion: string;
  unidad_negocio: number;
  unidad_negocio_nombre: string;
  tipo_recoleccion: TipoRecoleccion;
  fecha_programada: string;
  hora_inicio?: string | null;
  hora_fin?: string | null;
  fecha_reprogramada?: string | null;
  estado: EstadoProgramacion;
  prioridad: PrioridadProgramacion;
  recolector_asignado?: number | null;
  recolector_asignado_nombre?: string | null;
  vehiculo_asignado?: string | null;
  cantidad_estimada_kg?: number | null;
  cantidad_recolectada_kg?: number | null;
  observaciones?: string | null;
  motivo_cancelacion?: string | null;
  motivo_reprogramacion?: string | null;
  // ... timestamps y metadata
}
```

### Enums

```typescript
type EstadoProgramacion =
  | 'PENDIENTE'
  | 'ASIGNADA'
  | 'EN_RUTA'
  | 'COMPLETADA'
  | 'CANCELADA'
  | 'REPROGRAMADA';

type TipoRecoleccion =
  | 'RUTINARIA'
  | 'ESPECIAL'
  | 'EMERGENCIA'
  | 'SOLICITUD_CLIENTE';

type PrioridadProgramacion = 'BAJA' | 'MEDIA' | 'ALTA' | 'URGENTE';
```

## 🚀 Uso

### Importación en Router

```typescript
import { ProgramacionesPage } from '@/features/programaciones';

// En tu router:
<Route path="/programaciones" element={<ProgramacionesPage />} />
```

### Uso de Hooks

```typescript
import {
  useProgramaciones,
  useCreateProgramacion,
  useAsignarRecolector,
} from '@/features/programaciones';

function MyComponent() {
  const { data, isLoading } = useProgramaciones({ estado: 'PENDIENTE' });
  const createMutation = useCreateProgramacion();

  const handleCreate = async (data) => {
    await createMutation.mutateAsync(data);
  };

  return (
    // Tu componente
  );
}
```

## 🔐 Permisos

El módulo utiliza control de acceso basado en roles:

```typescript
// Roles con acceso completo
const canManage = ['lider_com_econorte', 'gerente', 'superadmin', 'coordinador_recoleccion'].includes(
  user?.cargo_code || ''
);
```

**Acciones según permisos:**
- **Lectura:** Todos los usuarios autenticados
- **Crear/Editar/Eliminar:** Solo usuarios con `canManage`
- **Asignar Recolector:** Solo usuarios con `canManage`
- **Cambiar Estado:** Solo usuarios con `canManage`
- **Reprogramar:** Solo usuarios con `canManage`

## 🔄 Flujo de Estados

```
PENDIENTE
    ↓ (Asignar recolector)
ASIGNADA
    ↓ (Iniciar ruta)
EN_RUTA
    ↓ (Completar con cantidad)
COMPLETADA (ESTADO FINAL)

Desde cualquier estado (excepto COMPLETADA):
    → CANCELADA (ESTADO FINAL)
    → REPROGRAMADA (vuelve al estado correspondiente)
```

### Transiciones Válidas

| Estado Actual | Estados Disponibles |
|--------------|---------------------|
| PENDIENTE | ASIGNADA, CANCELADA |
| ASIGNADA | EN_RUTA, PENDIENTE, CANCELADA |
| EN_RUTA | COMPLETADA, CANCELADA |
| COMPLETADA | - (estado final) |
| CANCELADA | - (estado final) |

## 🎨 Colores y Badges

### Estados
- **PENDIENTE:** Gris (`bg-gray-500`)
- **ASIGNADA:** Azul (`bg-blue-500`)
- **EN_RUTA:** Amarillo (`bg-yellow-500`)
- **COMPLETADA:** Verde (`bg-green-500`)
- **CANCELADA:** Rojo (`bg-red-500`)
- **REPROGRAMADA:** Morado (`bg-purple-500`)

### Prioridades
- **BAJA:** Verde
- **MEDIA:** Azul
- **ALTA:** Naranja
- **URGENTE:** Rojo

## 📊 Estadísticas

Las estadísticas se actualizan en tiempo real y muestran:
- Total de programaciones
- Pendientes (sin asignar)
- En Proceso (asignadas + en ruta)
- Completadas
- Canceladas
- Total kg estimado
- Total kg recolectado
- Promedio kg por recolección
- Tasa de completadas (%)

## 🔧 Filtros Disponibles

- **Búsqueda:** Código o proveedor
- **Estado:** Todos los estados
- **Tipo de Recolección:** Rutinaria, Especial, Emergencia, Solicitud
- **Prioridad:** Baja, Media, Alta, Urgente
- **Recolector:** Todos los recolectores activos
- **Rango de Fechas:** Desde - Hasta

## 🗓️ Vista Calendario

La vista de calendario incluye:
- Vista mensual completa
- Navegación entre meses
- Botón "Hoy" para volver al mes actual
- Eventos coloreados por estado
- Borde coloreado por prioridad
- Máximo 3 eventos visibles por día
- Click en evento para ver detalles/cambiar estado
- Estadísticas del mes visible

## 📝 Notas Importantes

1. **Fecha Mínima:** Al crear o reprogramar, la fecha mínima es mañana
2. **Cantidad Recolectada:** Obligatoria al completar una programación
3. **Motivo Cancelación:** Obligatorio al cancelar (mínimo 10 caracteres)
4. **Motivo Reprogramación:** Obligatorio al reprogramar (mínimo 10 caracteres)
5. **Estados Finales:** COMPLETADA y CANCELADA no pueden modificarse
6. **Eliminación:** Solo se pueden eliminar programaciones en estado PENDIENTE
7. **Mantener Recolector:** Al reprogramar, se puede elegir mantener el recolector asignado

## 🐛 Troubleshooting

### La tabla no muestra datos
- Verificar que el backend esté corriendo
- Revisar permisos del usuario
- Verificar filtros aplicados

### Error al crear programación
- Verificar que el proveedor esté activo
- Verificar que la fecha sea futura
- Revisar campos requeridos

### No aparecen recolectores
- Verificar que existan recolectores activos en el sistema
- Verificar permisos de acceso

## 🔗 Dependencias

- React 18+
- TypeScript 5+
- React Router v6
- TanStack Query (React Query)
- React Hook Form
- Zod
- date-fns
- Tailwind CSS
- lucide-react
- react-hot-toast

---

**Desarrollado para:** Grasas y Huesos del Norte
**Versión:** 1.0.0
**Fecha:** Noviembre 2025
