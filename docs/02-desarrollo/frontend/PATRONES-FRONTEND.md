# Patrones de Desarrollo Frontend

**Documento de referencia para patrones React estandarizados en StrateKaz**
**Fecha**: 2026-02-08
**Proyecto**: StrateKaz - ERP Multi-tenant

---

## Índice

1. [Estructura de Carpetas](#estructura-de-carpetas)
2. [Patrones de Arquitectura](#patrones-de-arquitectura)
3. [Componentes Reutilizables](#componentes-reutilizables)
4. [Tipos TypeScript](#tipos-typescript)
5. [API Clients](#api-clients)
6. [Hooks React Query](#hooks-react-query)
7. [Páginas con Tabs](#páginas-con-tabs)
8. [Formularios](#formularios)
9. [Tablas de Datos](#tablas-de-datos)
10. [Ejemplos Completos](#ejemplos-completos)

---

## 1. Estructura de Carpetas

### Patrón Establecido

```
frontend/src/features/[modulo]/
├── api/
│   ├── index.ts              # Barrel export
│   └── [entidad]Api.ts       # Cliente API específico
├── components/
│   ├── [entidad]/            # Componentes por entidad
│   │   ├── [Entidad]Tab.tsx
│   │   ├── [Entidad]Table.tsx
│   │   ├── [Entidad]FormModal.tsx
│   │   └── index.ts
│   └── index.ts
├── hooks/
│   ├── index.ts              # Barrel export
│   └── use[Entidad].ts       # Hooks React Query
├── pages/
│   ├── [Modulo]Page.tsx      # Página principal
│   └── [SubModulo]Page.tsx   # Páginas secundarias
├── types/
│   ├── index.ts              # Barrel export
│   └── [entidad].ts          # Tipos TypeScript
├── index.ts                  # Barrel export del módulo
└── README.md                 # Documentación
```

### Ejemplo Aplicado a HSEQ

```
frontend/src/features/hseq/
├── api/
│   ├── index.ts
│   ├── incidentesApi.ts
│   ├── inspeccionesApi.ts
│   ├── capacitacionesApi.ts
│   └── indicadoresApi.ts
├── components/
│   ├── incidentes/
│   │   ├── IncidentesTab.tsx
│   │   ├── IncidentesTable.tsx
│   │   ├── IncidenteFormModal.tsx
│   │   ├── InvestigacionFormModal.tsx
│   │   └── index.ts
│   ├── inspecciones/
│   │   ├── InspeccionesTab.tsx
│   │   ├── InspeccionesTable.tsx
│   │   └── InspeccionFormModal.tsx
│   └── index.ts
├── hooks/
│   ├── index.ts
│   ├── useIncidentes.ts
│   ├── useInspecciones.ts
│   └── useCapacitaciones.ts
├── pages/
│   ├── HSEQPage.tsx
│   ├── AccidentalidadPage.tsx
│   ├── SeguridadIndustrialPage.tsx
│   └── MedicinaLaboralPage.tsx
├── types/
│   ├── index.ts
│   ├── incidentes.ts
│   ├── inspecciones.ts
│   └── capacitaciones.ts
├── index.ts
└── README.md
```

---

## 2. Patrones de Arquitectura

### 2.1 Barrel Exports

**Archivo**: `index.ts` (en cada carpeta)

```typescript
/**
 * Módulo HSEQ - Feature Module
 * Sistema de Gestión StrateKaz
 *
 * Exportación centralizada de:
 * - Pages
 * - Tipos TypeScript
 * - API clients
 * - Hooks React Query
 * - Componentes UI
 */

// ==================== PAGES ====================
export { default as HSEQPage } from './pages/HSEQPage';
export { default as AccidentalidadPage } from './pages/AccidentalidadPage';
export { default as SeguridadIndustrialPage } from './pages/SeguridadIndustrialPage';

// ==================== TIPOS ====================
export * from './types';

// ==================== API CLIENTS ====================
export * from './api';

// ==================== HOOKS ====================
export * from './hooks';

// ==================== COMPONENTES ====================
export { IncidentesTab } from './components/incidentes/IncidentesTab';
export { InspeccionesTab } from './components/inspecciones/InspeccionesTab';
```

### 2.2 Naming Conventions

- **Páginas**: `[Modulo]Page.tsx` (PascalCase + Page)
- **Componentes**: `[Entidad][Tipo].tsx` (PascalCase descriptivo)
- **Hooks**: `use[Entidad].ts` (camelCase + use prefix)
- **API Clients**: `[entidad]Api.ts` (camelCase + Api suffix)
- **Tipos**: `[entidad].ts` (camelCase)

---

## 3. Componentes Reutilizables

### 3.1 PageHeader

**Ubicación**: `@/components/layout/PageHeader`

```typescript
import { PageHeader } from '@/components/layout';
import { Plus } from 'lucide-react';

<PageHeader
  title="Accidentalidad"
  description="Gestión de incidentes, accidentes e investigaciones"
  actions={
    <button className="btn-primary">
      <Plus className="w-4 h-4 mr-2" />
      Nuevo Incidente
    </button>
  }
  tabs={
    <PageTabs
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    />
  }
/>
```

### 3.2 SelectionCard

**Ubicación**: `@/components/common/SelectionCard`

```typescript
import { SelectionCard, SelectionCardGrid } from '@/components/common/SelectionCard';
import { AlertTriangle, FileText, Users } from 'lucide-react';

<SelectionCardGrid columns={3}>
  <SelectionCard
    icon={AlertTriangle}
    title="Incidentes y Accidentes"
    subtitle="Reporte, investigación e indicadores"
    href="/hseq/accidentalidad"
    variant="gradient"
    color="orange"
  />

  <SelectionCard
    icon={FileText}
    title="Inspecciones"
    subtitle="Inspecciones de seguridad y EPP"
    href="/hseq/seguridad-industrial"
    variant="glass"
    color="blue"
  />
</SelectionCardGrid>
```

**Variantes disponibles**:
- `default`: Card simple con hover
- `gradient`: Gradiente de color con brillo
- `glass`: Efecto glassmorphism
- `glow`: Sombras intensas

**Colores disponibles**:
- `purple`: Morado (planificación, mejora continua)
- `blue`: Azul (sistema documental, higiene)
- `green`: Verde (calidad, ambiental)
- `orange`: Naranja (SST, emergencias)

### 3.3 PageTabs

**Ubicación**: `@/components/layout/PageTabs`

```typescript
import { PageTabs } from '@/components/layout';
import { AlertTriangle, Search, BarChart3 } from 'lucide-react';
import { useState } from 'react';

const tabs = [
  { id: 'incidentes', label: 'Incidentes', icon: AlertTriangle, badge: 12 },
  { id: 'investigaciones', label: 'Investigaciones', icon: Search, badge: 5 },
  { id: 'indicadores', label: 'Indicadores', icon: BarChart3 },
];

const [activeTab, setActiveTab] = useState('incidentes');

<PageTabs
  tabs={tabs}
  activeTab={activeTab}
  onTabChange={setActiveTab}
/>

{/* Renderizado condicional */}
{activeTab === 'incidentes' && <IncidentesTab />}
{activeTab === 'investigaciones' && <InvestigacionesTab />}
{activeTab === 'indicadores' && <IndicadoresTab />}
```

---

## 4. Tipos TypeScript

### 4.1 Patrón Base

**Archivo**: `types/[entidad].ts`

```typescript
/**
 * Tipos para Incidentes y Accidentes
 * Backend: backend/apps/motor_hseq/accidentalidad/
 */

// ==================== ENUMS ====================

export type TipoIncidente =
  | 'ACCIDENTE_TRABAJO'
  | 'INCIDENTE'
  | 'ACCIDENTE_FATAL'
  | 'ENFERMEDAD_LABORAL';

export type SeveridadIncidente = 'LEVE' | 'GRAVE' | 'MORTAL';

export type EstadoInvestigacion =
  | 'PENDIENTE'
  | 'EN_PROCESO'
  | 'COMPLETADA'
  | 'CERRADA';

// ==================== TIPOS BASE ====================

export interface BaseTimestamped {
  created_at: string;
  updated_at: string;
}

export interface BaseSoftDelete extends BaseTimestamped {
  is_active: boolean;
  deleted_at: string | null;
}

// ==================== MODELOS ====================

/**
 * Incidente completo (GET detail)
 */
export interface Incidente extends BaseSoftDelete {
  id: number;
  codigo: string;
  tipo_incidente: TipoIncidente;
  fecha_incidente: string;
  hora_incidente: string;
  lugar: string;
  area_id: number;
  area_nombre?: string;
  proceso_id: number;
  proceso_nombre?: string;
  trabajador_afectado_id?: number;
  trabajador_afectado_nombre?: string;
  descripcion: string;
  testigos?: string;
  severidad: SeveridadIncidente;
  dias_incapacidad?: number;
  parte_cuerpo_afectada?: string;
  tipo_lesion?: string;
  requiere_investigacion: boolean;
  estado_investigacion: EstadoInvestigacion;
  reportado_por_id: number;
  reportado_por_nombre?: string;
  investigacion?: Investigacion;
  acciones_inmediatas?: AccionInmediata[];
}

/**
 * Incidente para listas (GET list)
 */
export interface IncidenteList {
  id: number;
  codigo: string;
  tipo_incidente: TipoIncidente;
  fecha_incidente: string;
  area_nombre: string;
  trabajador_afectado_nombre?: string;
  severidad: SeveridadIncidente;
  estado_investigacion: EstadoInvestigacion;
  requiere_investigacion: boolean;
}

/**
 * Incidente para crear/actualizar (POST/PATCH)
 */
export interface IncidenteCreateUpdate {
  tipo_incidente: TipoIncidente;
  fecha_incidente: string;
  hora_incidente: string;
  lugar: string;
  area_id: number;
  proceso_id: number;
  trabajador_afectado_id?: number;
  descripcion: string;
  testigos?: string;
  severidad: SeveridadIncidente;
  dias_incapacidad?: number;
  parte_cuerpo_afectada?: string;
  tipo_lesion?: string;
  requiere_investigacion: boolean;
}

// ==================== CHOICES PARA FORMS ====================

export const TIPOS_INCIDENTE = [
  { value: 'ACCIDENTE_TRABAJO', label: 'Accidente de Trabajo' },
  { value: 'INCIDENTE', label: 'Incidente' },
  { value: 'ACCIDENTE_FATAL', label: 'Accidente Fatal' },
  { value: 'ENFERMEDAD_LABORAL', label: 'Enfermedad Laboral' },
] as const;

export const SEVERIDADES = [
  { value: 'LEVE', label: 'Leve' },
  { value: 'GRAVE', label: 'Grave' },
  { value: 'MORTAL', label: 'Mortal' },
] as const;
```

### 4.2 Barrel Export

**Archivo**: `types/index.ts`

```typescript
/**
 * Barrel Export - Tipos HSEQ
 */

// Incidentes
export type {
  TipoIncidente,
  SeveridadIncidente,
  EstadoInvestigacion,
  Incidente,
  IncidenteList,
  IncidenteCreateUpdate,
} from './incidentes';

export { TIPOS_INCIDENTE, SEVERIDADES } from './incidentes';

// Inspecciones
export type {
  TipoInspeccion,
  EstadoInspeccion,
  Inspeccion,
  InspeccionList,
  InspeccionCreateUpdate,
} from './inspecciones';
```

---

## 5. API Clients

### 5.1 Patrón API Client

**Archivo**: `api/[entidad]Api.ts`

```typescript
/**
 * API Cliente para Incidentes
 * Backend: /api/hseq/incidentes/
 */
import apiClient from '@/services/api/apiClient';
import type {
  Incidente,
  IncidenteList,
  IncidenteCreateUpdate,
} from '../types';

const BASE_URL = '/api/hseq/incidentes';

// ============================================================================
// TIPOS DE FILTROS Y PAGINACIÓN
// ============================================================================

export interface IncidentesListParams {
  page?: number;
  page_size?: number;
  search?: string;
  tipo_incidente?: string;
  severidad?: string;
  estado_investigacion?: string;
  area_id?: number;
  fecha_desde?: string;
  fecha_hasta?: string;
  ordering?: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// ============================================================================
// API METHODS
// ============================================================================

export const incidentesApi = {
  /**
   * Listar incidentes con paginación y filtros
   */
  list: async (
    params?: IncidentesListParams
  ): Promise<PaginatedResponse<IncidenteList>> => {
    const response = await apiClient.get<PaginatedResponse<IncidenteList>>(
      BASE_URL,
      { params }
    );
    return response.data;
  },

  /**
   * Obtener detalle de incidente
   */
  get: async (id: number): Promise<Incidente> => {
    const response = await apiClient.get<Incidente>(`${BASE_URL}/${id}/`);
    return response.data;
  },

  /**
   * Crear incidente
   */
  create: async (data: IncidenteCreateUpdate): Promise<Incidente> => {
    const response = await apiClient.post<Incidente>(`${BASE_URL}/`, data);
    return response.data;
  },

  /**
   * Actualizar incidente
   */
  update: async (
    id: number,
    data: Partial<IncidenteCreateUpdate>
  ): Promise<Incidente> => {
    const response = await apiClient.patch<Incidente>(
      `${BASE_URL}/${id}/`,
      data
    );
    return response.data;
  },

  /**
   * Eliminar incidente (soft delete)
   */
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/${id}/`);
  },

  /**
   * Exportar incidentes a Excel
   */
  exportExcel: async (params?: IncidentesListParams): Promise<Blob> => {
    const response = await apiClient.get(`${BASE_URL}/export_excel/`, {
      params,
      responseType: 'blob',
    });
    return response.data;
  },

  /**
   * Obtener estadísticas de incidentes
   */
  getStats: async (params?: {
    fecha_desde?: string;
    fecha_hasta?: string;
  }): Promise<IncidentesStats> => {
    const response = await apiClient.get<IncidentesStats>(
      `${BASE_URL}/stats/`,
      { params }
    );
    return response.data;
  },
};

// ============================================================================
// TIPOS AUXILIARES
// ============================================================================

export interface IncidentesStats {
  total: number;
  por_tipo: Array<{ tipo: string; count: number }>;
  por_severidad: Array<{ severidad: string; count: number }>;
  por_mes: Array<{ mes: string; count: number }>;
  tasa_accidentalidad: number;
  dias_perdidos: number;
}
```

### 5.2 Barrel Export

**Archivo**: `api/index.ts`

```typescript
/**
 * API Barrel Export - HSEQ
 */
export * from './incidentesApi';
export * from './inspeccionesApi';
export * from './capacitacionesApi';
```

---

## 6. Hooks React Query

### 6.1 Patrón de Hooks

**Archivo**: `hooks/useIncidentes.ts`

```typescript
/**
 * Hooks para Incidentes usando TanStack Query
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  incidentesApi,
  type IncidentesListParams,
} from '../api/incidentesApi';
import type { Incidente, IncidenteCreateUpdate } from '../types';

// ============================================================================
// QUERY KEYS
// ============================================================================

export const incidentesKeys = {
  all: ['incidentes'] as const,
  lists: () => [...incidentesKeys.all, 'list'] as const,
  list: (params?: IncidentesListParams) =>
    [...incidentesKeys.lists(), params] as const,
  details: () => [...incidentesKeys.all, 'detail'] as const,
  detail: (id: number) => [...incidentesKeys.details(), id] as const,
  stats: (params?: { fecha_desde?: string; fecha_hasta?: string }) =>
    [...incidentesKeys.all, 'stats', params] as const,
};

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Hook para listar incidentes con filtros y paginación
 */
export function useIncidentes(params?: IncidentesListParams) {
  return useQuery({
    queryKey: incidentesKeys.list(params),
    queryFn: () => incidentesApi.list(params),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

/**
 * Hook para obtener detalle de un incidente
 */
export function useIncidente(id: number | null | undefined) {
  return useQuery({
    queryKey: incidentesKeys.detail(id!),
    queryFn: () => incidentesApi.get(id!),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook para obtener estadísticas de incidentes
 */
export function useIncidentesStats(params?: {
  fecha_desde?: string;
  fecha_hasta?: string;
}) {
  return useQuery({
    queryKey: incidentesKeys.stats(params),
    queryFn: () => incidentesApi.getStats(params),
    staleTime: 10 * 60 * 1000, // 10 minutos
  });
}

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Hook para crear incidente
 */
export function useCreateIncidente() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: IncidenteCreateUpdate) => incidentesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: incidentesKeys.lists() });
      toast.success('Incidente creado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Error al crear incidente');
    },
  });
}

/**
 * Hook para actualizar incidente
 */
export function useUpdateIncidente() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: Partial<IncidenteCreateUpdate>;
    }) => incidentesApi.update(id, data),
    onSuccess: (updatedIncidente) => {
      queryClient.invalidateQueries({ queryKey: incidentesKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: incidentesKeys.detail(updatedIncidente.id),
      });
      toast.success('Incidente actualizado exitosamente');
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.detail || 'Error al actualizar incidente'
      );
    },
  });
}

/**
 * Hook para eliminar incidente
 */
export function useDeleteIncidente() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => incidentesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: incidentesKeys.lists() });
      toast.success('Incidente eliminado exitosamente');
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.detail || 'Error al eliminar incidente'
      );
    },
  });
}

/**
 * Hook para exportar incidentes
 */
export function useExportIncidentes() {
  return useMutation({
    mutationFn: (params?: IncidentesListParams) =>
      incidentesApi.exportExcel(params),
    onSuccess: (blob) => {
      // Descargar archivo
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `incidentes-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Archivo descargado exitosamente');
    },
    onError: () => {
      toast.error('Error al exportar incidentes');
    },
  });
}
```

### 6.2 Hook Genérico CRUD

**Uso del hook `useGenericCRUD`** (ya existe en el proyecto):

```typescript
import { useGenericCRUD } from '@/hooks/useGenericCRUD';
import type { Inspeccion } from '../types';

export function useInspecciones() {
  return useGenericCRUD<Inspeccion>({
    queryKey: ['inspecciones'],
    endpoint: '/api/hseq/inspecciones/',
    entityName: 'Inspección',
    isFeminine: true,
    isPaginated: true,
  });
}
```

---

## 7. Páginas con Tabs

### 7.1 Página Principal (Landing)

**Archivo**: `pages/HSEQPage.tsx`

```typescript
import { SelectionCard, SelectionCardGrid } from '@/components/common/SelectionCard';
import { PageHeader } from '@/components/layout';
import { AlertTriangle, FileText, Heart, Users } from 'lucide-react';

export default function HSEQPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Gestión HSEQ"
        description="Sistema Integrado de Gestión en Salud, Seguridad, Medio Ambiente y Calidad"
      />

      {/* HERO SECTION */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 p-8 text-white">
        <div className="relative z-10">
          <h2 className="text-2xl font-bold mb-2">Bienvenido a Gestión HSEQ</h2>
          <p className="text-blue-100 max-w-2xl">
            Gestión integrada de calidad, seguridad, salud ocupacional y medio ambiente.
          </p>
          <div className="mt-6 flex flex-wrap gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
              <span className="text-sm text-blue-200">ISO 45001</span>
              <p className="font-semibold">Seguridad y Salud Ocupacional</p>
            </div>
          </div>
        </div>
      </div>

      {/* GRID DE MÓDULOS */}
      <SelectionCardGrid columns={4}>
        <SelectionCard
          icon={AlertTriangle}
          title="Accidentalidad"
          subtitle="Reporte de incidentes, investigación e indicadores"
          href="/hseq/accidentalidad"
          variant="gradient"
          color="orange"
        />

        <SelectionCard
          icon={FileText}
          title="Seguridad Industrial"
          subtitle="Inspecciones, EPP, permisos de trabajo"
          href="/hseq/seguridad-industrial"
          variant="glass"
          color="blue"
        />

        <SelectionCard
          icon={Heart}
          title="Medicina Laboral"
          subtitle="Exámenes médicos, vigilancia epidemiológica"
          href="/hseq/medicina-laboral"
          variant="gradient"
          color="orange"
        />

        <SelectionCard
          icon={Users}
          title="Comités"
          subtitle="COPASST, Convivencia, Brigada de Emergencias"
          href="/hseq/comites"
          variant="glass"
          color="purple"
        />
      </SelectionCardGrid>
    </div>
  );
}
```

### 7.2 Página con Tabs

**Archivo**: `pages/AccidentalidadPage.tsx`

```typescript
import { useState } from 'react';
import { PageHeader } from '@/components/layout';
import { PageTabs } from '@/components/layout';
import { AlertTriangle, Search, BarChart3, BookOpen } from 'lucide-react';
import {
  IncidentesTab,
  InvestigacionesTab,
  IndicadoresTab,
  ReportesTab,
} from '../components';

const tabs = [
  { id: 'incidentes', label: 'Incidentes', icon: AlertTriangle },
  { id: 'investigaciones', label: 'Investigaciones', icon: Search },
  { id: 'indicadores', label: 'Indicadores', icon: BarChart3 },
  { id: 'reportes', label: 'Reportes', icon: BookOpen },
];

export default function AccidentalidadPage() {
  const [activeTab, setActiveTab] = useState('incidentes');

  return (
    <div className="space-y-6">
      <PageHeader
        title="Accidentalidad"
        description="Gestión de incidentes, accidentes e investigaciones de seguridad y salud en el trabajo"
        tabs={
          <PageTabs
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
        }
      />

      {/* Renderizado condicional de tabs */}
      {activeTab === 'incidentes' && <IncidentesTab />}
      {activeTab === 'investigaciones' && <InvestigacionesTab />}
      {activeTab === 'indicadores' && <IndicadoresTab />}
      {activeTab === 'reportes' && <ReportesTab />}
    </div>
  );
}
```

---

## 8. Formularios

### 8.1 Modal de Formulario con React Hook Form + Zod

**Archivo**: `components/incidentes/IncidenteFormModal.tsx`

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect } from 'react';
import { X } from 'lucide-react';
import { useCreateIncidente, useUpdateIncidente } from '../../hooks';
import type { Incidente } from '../../types';

// ============================================================================
// SCHEMA DE VALIDACIÓN
// ============================================================================

const incidenteSchema = z.object({
  tipo_incidente: z.enum([
    'ACCIDENTE_TRABAJO',
    'INCIDENTE',
    'ACCIDENTE_FATAL',
    'ENFERMEDAD_LABORAL',
  ]),
  fecha_incidente: z.string().min(1, 'La fecha es requerida'),
  hora_incidente: z.string().min(1, 'La hora es requerida'),
  lugar: z.string().min(1, 'El lugar es requerido'),
  area_id: z.number().min(1, 'El área es requerida'),
  proceso_id: z.number().min(1, 'El proceso es requerido'),
  trabajador_afectado_id: z.number().optional(),
  descripcion: z.string().min(10, 'La descripción debe tener al menos 10 caracteres'),
  testigos: z.string().optional(),
  severidad: z.enum(['LEVE', 'GRAVE', 'MORTAL']),
  dias_incapacidad: z.number().min(0).optional(),
  parte_cuerpo_afectada: z.string().optional(),
  tipo_lesion: z.string().optional(),
  requiere_investigacion: z.boolean(),
});

type IncidenteFormData = z.infer<typeof incidenteSchema>;

// ============================================================================
// PROPS
// ============================================================================

interface IncidenteFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  incidente?: Incidente | null;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function IncidenteFormModal({
  isOpen,
  onClose,
  incidente,
}: IncidenteFormModalProps) {
  const isEditing = !!incidente;
  const createMutation = useCreateIncidente();
  const updateMutation = useUpdateIncidente();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<IncidenteFormData>({
    resolver: zodResolver(incidenteSchema),
    defaultValues: incidente
      ? {
          tipo_incidente: incidente.tipo_incidente,
          fecha_incidente: incidente.fecha_incidente,
          hora_incidente: incidente.hora_incidente,
          lugar: incidente.lugar,
          area_id: incidente.area_id,
          proceso_id: incidente.proceso_id,
          trabajador_afectado_id: incidente.trabajador_afectado_id,
          descripcion: incidente.descripcion,
          testigos: incidente.testigos,
          severidad: incidente.severidad,
          dias_incapacidad: incidente.dias_incapacidad,
          parte_cuerpo_afectada: incidente.parte_cuerpo_afectada,
          tipo_lesion: incidente.tipo_lesion,
          requiere_investigacion: incidente.requiere_investigacion,
        }
      : {
          requiere_investigacion: true,
        },
  });

  const tipoIncidente = watch('tipo_incidente');

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      reset();
    }
  }, [isOpen, reset]);

  const onSubmit = async (data: IncidenteFormData) => {
    try {
      if (isEditing) {
        await updateMutation.mutateAsync({ id: incidente.id, data });
      } else {
        await createMutation.mutateAsync(data);
      }
      onClose();
    } catch (error) {
      console.error('Error al guardar incidente:', error);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {isEditing ? 'Editar Incidente' : 'Nuevo Incidente'}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Tipo de Incidente */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tipo de Incidente *
                </label>
                <select
                  {...register('tipo_incidente')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="">Seleccionar...</option>
                  <option value="ACCIDENTE_TRABAJO">Accidente de Trabajo</option>
                  <option value="INCIDENTE">Incidente</option>
                  <option value="ACCIDENTE_FATAL">Accidente Fatal</option>
                  <option value="ENFERMEDAD_LABORAL">Enfermedad Laboral</option>
                </select>
                {errors.tipo_incidente && (
                  <p className="text-red-600 text-sm mt-1">
                    {errors.tipo_incidente.message}
                  </p>
                )}
              </div>

              {/* Severidad */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Severidad *
                </label>
                <select
                  {...register('severidad')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="">Seleccionar...</option>
                  <option value="LEVE">Leve</option>
                  <option value="GRAVE">Grave</option>
                  <option value="MORTAL">Mortal</option>
                </select>
                {errors.severidad && (
                  <p className="text-red-600 text-sm mt-1">
                    {errors.severidad.message}
                  </p>
                )}
              </div>

              {/* Fecha */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Fecha *
                </label>
                <input
                  type="date"
                  {...register('fecha_incidente')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
                {errors.fecha_incidente && (
                  <p className="text-red-600 text-sm mt-1">
                    {errors.fecha_incidente.message}
                  </p>
                )}
              </div>

              {/* Hora */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Hora *
                </label>
                <input
                  type="time"
                  {...register('hora_incidente')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
                {errors.hora_incidente && (
                  <p className="text-red-600 text-sm mt-1">
                    {errors.hora_incidente.message}
                  </p>
                )}
              </div>
            </div>

            {/* Descripción */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Descripción del Incidente *
              </label>
              <textarea
                {...register('descripcion')}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="Describa detalladamente lo ocurrido..."
              />
              {errors.descripcion && (
                <p className="text-red-600 text-sm mt-1">
                  {errors.descripcion.message}
                </p>
              )}
            </div>

            {/* Requiere Investigación */}
            <div className="flex items-center">
              <input
                type="checkbox"
                {...register('requiere_investigacion')}
                className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
              />
              <label className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                Requiere investigación
              </label>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                disabled={isLoading}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
                disabled={isLoading}
              >
                {isLoading
                  ? 'Guardando...'
                  : isEditing
                  ? 'Actualizar'
                  : 'Crear'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
```

---

## 9. Tablas de Datos

### 9.1 Tabla Simple

**Archivo**: `components/incidentes/IncidentesTable.tsx`

```typescript
import { useState } from 'react';
import { Edit2, Trash2, Search, Eye } from 'lucide-react';
import { useIncidentes, useDeleteIncidente } from '../../hooks';
import type { IncidenteList } from '../../types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface IncidentesTableProps {
  onEdit: (incidente: IncidenteList) => void;
  onView: (incidente: IncidenteList) => void;
}

export function IncidentesTable({ onEdit, onView }: IncidentesTableProps) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useIncidentes({
    page,
    page_size: 10,
    search,
  });

  const deleteMutation = useDeleteIncidente();

  const handleDelete = async (id: number) => {
    if (window.confirm('¿Está seguro de eliminar este incidente?')) {
      await deleteMutation.mutateAsync(id);
    }
  };

  if (isLoading) {
    return <div>Cargando...</div>;
  }

  const incidentes = data?.results || [];
  const totalPages = Math.ceil((data?.count || 0) / 10);

  return (
    <div className="space-y-4">
      {/* Barra de búsqueda */}
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar por código, lugar, trabajador..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
          />
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Código
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Fecha
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Tipo
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Área
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Trabajador
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Severidad
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Estado
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {incidentes.map((incidente) => (
              <tr
                key={incidente.id}
                className="hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                  {incidente.codigo}
                </td>
                <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                  {format(new Date(incidente.fecha_incidente), 'PP', {
                    locale: es,
                  })}
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {incidente.tipo_incidente.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                  {incidente.area_nombre}
                </td>
                <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                  {incidente.trabajador_afectado_nombre || '-'}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      incidente.severidad === 'LEVE'
                        ? 'bg-green-100 text-green-800'
                        : incidente.severidad === 'GRAVE'
                        ? 'bg-orange-100 text-orange-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {incidente.severidad}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    {incidente.estado_investigacion}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => onView(incidente)}
                      className="text-blue-600 hover:text-blue-800"
                      title="Ver detalle"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onEdit(incidente)}
                      className="text-orange-600 hover:text-orange-800"
                      title="Editar"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(incidente.id)}
                      className="text-red-600 hover:text-red-800"
                      title="Eliminar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 border-t border-gray-200 dark:border-gray-600">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700 dark:text-gray-300">
                Mostrando {incidentes.length} de {data?.count} incidentes
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50"
                >
                  Anterior
                </button>
                <span className="px-3 py-1 text-sm">
                  Página {page} de {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50"
                >
                  Siguiente
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
```

---

## 10. Ejemplos Completos

### 10.1 Tab Completo con CRUD

**Archivo**: `components/incidentes/IncidentesTab.tsx`

```typescript
import { useState } from 'react';
import { Plus, Download } from 'lucide-react';
import { IncidentesTable } from './IncidentesTable';
import { IncidenteFormModal } from './IncidenteFormModal';
import { useExportIncidentes } from '../../hooks';
import { useFormModal } from '@/hooks/useFormModal';
import type { Incidente, IncidenteList } from '../../types';

export function IncidentesTab() {
  const formModal = useFormModal<Incidente>();
  const exportMutation = useExportIncidentes();

  const handleEdit = (incidente: IncidenteList) => {
    // Aquí deberías cargar el incidente completo si es necesario
    formModal.openEdit(incidente as any);
  };

  const handleView = (incidente: IncidenteList) => {
    // Navegar a detalle o abrir modal de vista
    console.log('Ver incidente:', incidente);
  };

  const handleExport = () => {
    exportMutation.mutate();
  };

  return (
    <div className="space-y-6">
      {/* Acciones */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Listado de Incidentes
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Gestión de incidentes y accidentes de trabajo
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleExport}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            disabled={exportMutation.isPending}
          >
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </button>
          <button
            onClick={formModal.openCreate}
            className="inline-flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Incidente
          </button>
        </div>
      </div>

      {/* Tabla */}
      <IncidentesTable onEdit={handleEdit} onView={handleView} />

      {/* Modal de Formulario */}
      <IncidenteFormModal
        isOpen={formModal.isOpen}
        onClose={formModal.close}
        incidente={formModal.data}
      />
    </div>
  );
}
```

---

## Resumen de Patrones

### Checklist de Desarrollo

Al crear un nuevo módulo HSEQ, sigue estos pasos:

1. **Crear tipos TypeScript** (`types/[entidad].ts`)
   - [ ] Definir enums y choices
   - [ ] Crear interfaces base (List, Detail, CreateUpdate)
   - [ ] Exportar en `types/index.ts`

2. **Crear API Client** (`api/[entidad]Api.ts`)
   - [ ] Definir base URL
   - [ ] Implementar métodos CRUD
   - [ ] Agregar métodos custom (export, stats, etc.)
   - [ ] Exportar en `api/index.ts`

3. **Crear Hooks React Query** (`hooks/use[Entidad].ts`)
   - [ ] Definir query keys
   - [ ] Crear hooks de queries (list, detail, stats)
   - [ ] Crear hooks de mutations (create, update, delete)
   - [ ] Agregar toast notifications
   - [ ] Exportar en `hooks/index.ts`

4. **Crear Componentes**
   - [ ] `[Entidad]Tab.tsx` - Componente principal del tab
   - [ ] `[Entidad]Table.tsx` - Tabla con paginación
   - [ ] `[Entidad]FormModal.tsx` - Modal de formulario
   - [ ] Exportar en `components/index.ts`

5. **Crear Páginas**
   - [ ] Página principal con SelectionCards
   - [ ] Páginas con tabs usando PageTabs
   - [ ] Exportar en `index.ts` del módulo

6. **Documentación**
   - [ ] Actualizar README.md del módulo
   - [ ] Comentar código complejo
   - [ ] Documentar tipos y APIs

---

## Referencias

- **Proyecto Base**: `frontend/src/features/cumplimiento/`
- **Motor Riesgos**: `frontend/src/features/riesgos/`
- **Hooks Genéricos**: `frontend/src/hooks/`
- **Componentes Comunes**: `frontend/src/components/common/`
- **Componentes Layout**: `frontend/src/components/layout/`

---

---

## Componentes Comunes Adicionales (Sprint 1-4)

### KpiCard / KpiCardGrid / KpiCardSkeleton

**Ubicacion**: `@/components/common`

```typescript
import { KpiCard, KpiCardGrid, KpiCardSkeleton } from '@/components/common';

// Grid responsivo de KPIs
<KpiCardGrid>
  <KpiCard
    title="Incidentes Abiertos"
    value={12}
    trend={{ value: -8, direction: 'down' }}
    icon={AlertTriangle}
    color="orange"
  />
</KpiCardGrid>

// Skeleton para loading
<KpiCardGrid>
  {[...Array(4)].map((_, i) => <KpiCardSkeleton key={i} />)}
</KpiCardGrid>
```

### SectionToolbar

**Ubicacion**: `@/components/common`

```typescript
import { SectionToolbar } from '@/components/common';

<SectionToolbar
  title="Listado de Inspecciones"
  description="Gestionar inspecciones de seguridad"
  actions={<Button onClick={openModal}>Nueva</Button>}
/>
```

### StatusBadge + formatStatusLabel

**Ubicacion**: `@/components/common`

```typescript
import { StatusBadge, formatStatusLabel } from '@/components/common';

// Auto color-mapping basado en el valor del estado
<StatusBadge status="activo" />        // verde
<StatusBadge status="pendiente" />     // amarillo
<StatusBadge status="cancelado" />     // rojo
<StatusBadge status="en_progreso" />   // azul

// formatStatusLabel convierte snake_case a "Title Case"
formatStatusLabel('en_progreso') // "En Progreso"
```

### DataGrid

**Ubicacion**: `@/components/common`

```typescript
import { DataGrid } from '@/components/common';

<DataGrid
  data={items}
  columns={columns}
  pagination
  sorting
  filtering
/>
```

### DynamicFormRenderer

**Ubicacion**: `@/features/workflows/components`

12 field types: text, textarea, number, date, datetime, select, multiselect, checkbox, radio, file, signature, rich_text.

```typescript
import { DynamicFormRenderer } from '@/features/workflows/components';

<DynamicFormRenderer
  campos={formFields}
  values={formValues}
  onChange={handleChange}
  errors={errors}
/>
```

---

**Fecha de Creacion**: 26 de diciembre de 2025
**Ultima Actualizacion**: 2026-02-08
**Autor**: Equipo de Desarrollo StrateKaz
