# Plantillas de Codigo CRUD — Cualquier Modulo C2

**Codigo listo para copiar y adaptar a cualquier modulo de negocio (C2).**
Los ejemplos usan HSEQ/Accidentalidad como caso concreto, pero el patron aplica a todos los modulos.
Reemplazar nombres de app, modelos y campos segun el modulo destino.

---

## 1. Estructura de Archivos Inicial

### Crear directorios

```bash
# Backend
mkdir -p backend/apps/motor_hseq/accidentalidad
mkdir -p backend/apps/motor_hseq/seguridad_industrial
mkdir -p backend/apps/motor_hseq/medicina_laboral
mkdir -p backend/apps/motor_hseq/comites

# Frontend
mkdir -p frontend/src/features/hseq/api
mkdir -p frontend/src/features/hseq/components/incidentes
mkdir -p frontend/src/features/hseq/components/inspecciones
mkdir -p frontend/src/features/hseq/hooks
mkdir -p frontend/src/features/hseq/types
mkdir -p frontend/src/features/hseq/pages
```

---

## 2. Tipos TypeScript - Plantillas

### Plantilla Base de Tipos

**Archivo**: `frontend/src/features/hseq/types/incidentes.ts`

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

export const ESTADOS_INVESTIGACION = [
  { value: 'PENDIENTE', label: 'Pendiente' },
  { value: 'EN_PROCESO', label: 'En Proceso' },
  { value: 'COMPLETADA', label: 'Completada' },
  { value: 'CERRADA', label: 'Cerrada' },
] as const;
```

### Index de Tipos

**Archivo**: `frontend/src/features/hseq/types/index.ts`

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

export {
  TIPOS_INCIDENTE,
  SEVERIDADES,
  ESTADOS_INVESTIGACION,
} from './incidentes';

// Inspecciones
export type {
  TipoInspeccion,
  EstadoInspeccion,
  Inspeccion,
  InspeccionList,
  InspeccionCreateUpdate,
} from './inspecciones';

export {
  TIPOS_INSPECCION,
  ESTADOS_INSPECCION,
} from './inspecciones';
```

---

## 3. API Clients - Plantillas

### Plantilla API Client

**Archivo**: `frontend/src/features/hseq/api/incidentesApi.ts`

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
};
```

### Index de API

**Archivo**: `frontend/src/features/hseq/api/index.ts`

```typescript
/**
 * API Barrel Export - HSEQ
 */
export * from './incidentesApi';
export * from './inspeccionesApi';
export * from './capacitacionesApi';
```

---

## 4. Hooks React Query - Plantillas

### Plantilla Hook Completo

**Archivo**: `frontend/src/features/hseq/hooks/useIncidentes.ts`

```typescript
/**
 * Hooks para Incidentes usando TanStack Query
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
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

### Index de Hooks

**Archivo**: `frontend/src/features/hseq/hooks/index.ts`

```typescript
/**
 * Hooks Barrel Export - HSEQ
 */
export * from './useIncidentes';
export * from './useInspecciones';
export * from './useCapacitaciones';
```

---

## 5. Componentes - Plantillas

### Tabla con Paginación

**Archivo**: `frontend/src/features/hseq/components/incidentes/IncidentesTable.tsx`

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
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Cargando...</div>
      </div>
    );
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
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500"
          />
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                Código
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                Fecha
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                Tipo
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                Área
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                Severidad
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                Estado
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
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
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                    {incidente.tipo_incidente.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                  {incidente.area_nombre}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      incidente.severidad === 'LEVE'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                        : incidente.severidad === 'GRAVE'
                        ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
                        : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                    }`}
                  >
                    {incidente.severidad}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                    {incidente.estado_investigacion}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => onView(incidente)}
                      className="text-blue-600 hover:text-blue-800 dark:text-blue-400"
                      title="Ver detalle"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onEdit(incidente)}
                      className="text-orange-600 hover:text-orange-800 dark:text-orange-400"
                      title="Editar"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(incidente.id)}
                      className="text-red-600 hover:text-red-800 dark:text-red-400"
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
                  className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
                >
                  Anterior
                </button>
                <span className="px-3 py-1 text-sm text-gray-700 dark:text-gray-300">
                  Página {page} de {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
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

### Tab Container

**Archivo**: `frontend/src/features/hseq/components/incidentes/IncidentesTab.tsx`

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
    formModal.openEdit(incidente as any);
  };

  const handleView = (incidente: IncidenteList) => {
    console.log('Ver incidente:', incidente);
  };

  const handleExport = () => {
    exportMutation.mutate();
  };

  return (
    <div className="space-y-6">
      {/* Header y acciones */}
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
            className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
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

      {/* Modal */}
      <IncidenteFormModal
        isOpen={formModal.isOpen}
        onClose={formModal.close}
        incidente={formModal.data}
      />
    </div>
  );
}
```

### Página con Tabs

**Archivo**: `frontend/src/features/hseq/pages/AccidentalidadPage.tsx`

```typescript
import { useState } from 'react';
import { PageHeader, PageTabs } from '@/components/layout';
import { AlertTriangle, Search, BarChart3, BookOpen } from 'lucide-react';
import { IncidentesTab } from '../components/incidentes/IncidentesTab';

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
        description="Gestión de incidentes, accidentes e investigaciones"
        tabs={
          <PageTabs
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
        }
      />

      {/* Renderizado condicional */}
      {activeTab === 'incidentes' && <IncidentesTab />}
      {activeTab === 'investigaciones' && (
        <div className="p-6 bg-white dark:bg-gray-800 rounded-lg">
          <p className="text-gray-600 dark:text-gray-400">
            Investigaciones - En desarrollo
          </p>
        </div>
      )}
      {activeTab === 'indicadores' && (
        <div className="p-6 bg-white dark:bg-gray-800 rounded-lg">
          <p className="text-gray-600 dark:text-gray-400">
            Indicadores - En desarrollo
          </p>
        </div>
      )}
      {activeTab === 'reportes' && (
        <div className="p-6 bg-white dark:bg-gray-800 rounded-lg">
          <p className="text-gray-600 dark:text-gray-400">
            Reportes - En desarrollo
          </p>
        </div>
      )}
    </div>
  );
}
```

---

## 6. Index Files - Plantillas

### Módulo Index

**Archivo**: `frontend/src/features/hseq/index.ts`

```typescript
/**
 * Módulo HSEQ - Feature Module
 * Sistema de Gestión StrateKaz
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
```

### Components Index

**Archivo**: `frontend/src/features/hseq/components/incidentes/index.ts`

```typescript
export { IncidentesTab } from './IncidentesTab';
export { IncidentesTable } from './IncidentesTable';
export { IncidenteFormModal } from './IncidenteFormModal';
```

---

## Comandos Útiles

### Crear estructura completa

```bash
# Crear archivos de tipos
touch frontend/src/features/hseq/types/incidentes.ts
touch frontend/src/features/hseq/types/index.ts

# Crear archivos de API
touch frontend/src/features/hseq/api/incidentesApi.ts
touch frontend/src/features/hseq/api/index.ts

# Crear archivos de hooks
touch frontend/src/features/hseq/hooks/useIncidentes.ts
touch frontend/src/features/hseq/hooks/index.ts

# Crear componentes
touch frontend/src/features/hseq/components/incidentes/IncidentesTab.tsx
touch frontend/src/features/hseq/components/incidentes/IncidentesTable.tsx
touch frontend/src/features/hseq/components/incidentes/IncidenteFormModal.tsx
touch frontend/src/features/hseq/components/incidentes/index.ts

# Crear páginas
touch frontend/src/features/hseq/pages/AccidentalidadPage.tsx

# Index principal
touch frontend/src/features/hseq/index.ts
```

---

**Fecha de Creación**: 26 de diciembre de 2025
