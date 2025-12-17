# Implementación del Módulo de Recepción - Ejemplos Prácticos

Este documento contiene ejemplos de código listos para usar en el módulo de Recepción.

---

## 1. ESTRUCTURA DE CARPETAS

```
frontend/src/features/recepcion/
├── components/
│   ├── RecepcionStatusBadge.tsx        # Badge de estado
│   ├── RecepcionTable.tsx               # Tabla de recepciones
│   ├── RecepcionForm.tsx                # Formulario crear/editar
│   ├── RecepcionDetailModal.tsx         # Modal de detalles
│   └── RecepcionRejectionModal.tsx      # Modal rechazo
├── hooks/
│   └── useRecepcion.ts                  # Hook para API
├── pages/
│   └── RecepcionPage.tsx                # Página principal
├── types/
│   └── recepcion.types.ts               # Types de Recepción
└── index.ts                             # Exports
```

---

## 2. TIPOS (recepcion.types.ts)

```typescript
// frontend/src/features/recepcion/types/recepcion.types.ts

export type RecepcionStatus = 'pendiente' | 'en_recepcion' | 'completada' | 'rechazada';
export type UnidadMedida = 'kg' | 'lb' | 'ton' | 'unid';
export type CalidadRecepcion = 'premium' | 'standar' | 'baja';

export interface Recepcion {
  id: string;
  numero_recepcion: string;
  proveedor_id: string;
  proveedor_nombre: string;
  materia_prima_id: string;
  materia_prima_nombre: string;
  codigo_lote: string;
  cantidad: number;
  unidad_medida: UnidadMedida;
  peso_neto: number;
  peso_bruto: number;
  calidad: CalidadRecepcion;
  estado: RecepcionStatus;
  fecha_recepcion: string;
  fecha_esperada: string;
  temperatura: number;
  humedad: number;
  observaciones?: string;
  rechazo_motivo?: string;
  documentos: RecepcionDocumento[];
  usuario_recibe: string;
  usuario_recibe_nombre: string;
  created_at: string;
  updated_at: string;
}

export interface RecepcionDocumento {
  id: string;
  tipo: 'factura' | 'certificado' | 'analisis' | 'foto' | 'otro';
  nombre: string;
  url: string;
  uploaded_at: string;
}

export interface CreateRecepcionDTO {
  proveedor_id: string;
  materia_prima_id: string;
  codigo_lote: string;
  cantidad: number;
  unidad_medida: UnidadMedida;
  peso_neto: number;
  peso_bruto: number;
  calidad: CalidadRecepcion;
  fecha_recepcion: string;
  temperatura: number;
  humedad: number;
  observaciones?: string;
}

export interface UpdateRecepcionDTO extends Partial<CreateRecepcionDTO> {
  estado?: RecepcionStatus;
}

export interface RecepcionFilters {
  search?: string;
  estado?: RecepcionStatus;
  proveedor_id?: string;
  materia_prima_id?: string;
  fecha_desde?: string;
  fecha_hasta?: string;
  calidad?: CalidadRecepcion;
  page?: number;
  page_size?: number;
}

export interface RecepcionResponse {
  data: Recepcion[];
  meta: {
    page: number;
    page_size: number;
    total: number;
    total_pages: number;
  };
}
```

---

## 3. COMPONENTE: RecepcionStatusBadge

```typescript
// frontend/src/features/recepcion/components/RecepcionStatusBadge.tsx

import { Badge } from '@/components/common/Badge';
import type { RecepcionStatus } from '../types/recepcion.types';

interface RecepcionStatusBadgeProps {
  status: RecepcionStatus;
}

export const RecepcionStatusBadge = ({ status }: RecepcionStatusBadgeProps) => {
  const variants = {
    pendiente: 'warning',
    en_recepcion: 'primary',
    completada: 'success',
    rechazada: 'danger',
  } as const;

  const labels = {
    pendiente: 'Pendiente',
    en_recepcion: 'En Recepción',
    completada: 'Completada',
    rechazada: 'Rechazada',
  };

  return (
    <Badge variant={variants[status] as any}>
      {labels[status]}
    </Badge>
  );
};
```

---

## 4. COMPONENTE: RecepcionTable

```typescript
// frontend/src/features/recepcion/components/RecepcionTable.tsx

import { Edit2, Trash2, Eye, AlertCircle } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { RecepcionStatusBadge } from './RecepcionStatusBadge';
import type { Recepcion } from '../types/recepcion.types';

interface RecepcionTableProps {
  data: Recepcion[];
  isLoading?: boolean;
  onEdit?: (recepcion: Recepcion) => void;
  onDelete?: (recepcion: Recepcion) => void;
  onDetail?: (recepcion: Recepcion) => void;
  onReject?: (recepcion: Recepcion) => void;
}

export function RecepcionTable({
  data,
  isLoading,
  onEdit,
  onDelete,
  onDetail,
  onReject,
}: RecepcionTableProps) {
  if (isLoading) {
    return (
      <div className="text-center py-8 text-gray-500">
        Cargando recepciones...
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No hay recepciones para mostrar
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
          <tr>
            <th className="px-6 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">
              N° Recepción
            </th>
            <th className="px-6 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">
              Proveedor
            </th>
            <th className="px-6 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">
              Materia Prima
            </th>
            <th className="px-6 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">
              Cantidad
            </th>
            <th className="px-6 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">
              Calidad
            </th>
            <th className="px-6 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">
              Fecha
            </th>
            <th className="px-6 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">
              Estado
            </th>
            <th className="px-6 py-3 text-right font-semibold text-gray-700 dark:text-gray-300">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {data.map((recepcion) => (
            <tr
              key={recepcion.id}
              className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <td className="px-6 py-4 font-medium text-gray-900 dark:text-gray-100">
                {recepcion.numero_recepcion}
              </td>
              <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                {recepcion.proveedor_nombre}
              </td>
              <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                {recepcion.materia_prima_nombre}
              </td>
              <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                {recepcion.cantidad} {recepcion.unidad_medida}
              </td>
              <td className="px-6 py-4">
                <Badge variant="primary" size="sm">
                  {recepcion.calidad.toUpperCase()}
                </Badge>
              </td>
              <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                {format(new Date(recepcion.fecha_recepcion), 'dd MMM yyyy', { locale: es })}
              </td>
              <td className="px-6 py-4">
                <RecepcionStatusBadge status={recepcion.estado} />
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDetail?.(recepcion)}
                    title="Ver detalles"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>

                  {recepcion.estado !== 'completada' && recepcion.estado !== 'rechazada' && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit?.(recepcion)}
                        title="Editar"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>

                      {recepcion.estado === 'en_recepcion' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onReject?.(recepcion)}
                          title="Rechazar"
                        >
                          <AlertCircle className="h-4 w-4 text-danger-600" />
                        </Button>
                      )}
                    </>
                  )}

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete?.(recepcion)}
                    title="Eliminar"
                  >
                    <Trash2 className="h-4 w-4 text-danger-600" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

---

## 5. COMPONENTE: RecepcionForm

```typescript
// frontend/src/features/recepcion/components/RecepcionForm.tsx

import { useState } from 'react';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/forms/Input';
import { Select } from '@/components/forms/Select';
import { Modal } from '@/components/common/Modal';
import type { Recepcion, CreateRecepcionDTO, UnidadMedida, CalidadRecepcion } from '../types/recepcion.types';

interface RecepcionFormProps {
  isOpen: boolean;
  onClose: () => void;
  recepcion?: Recepcion;
  onSubmit: (data: CreateRecepcionDTO) => Promise<void>;
  proveedores: Array<{ value: string; label: string }>;
  materiasPrimas: Array<{ value: string; label: string }>;
}

export function RecepcionForm({
  isOpen,
  onClose,
  recepcion,
  onSubmit,
  proveedores,
  materiasPrimas,
}: RecepcionFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<CreateRecepcionDTO>({
    proveedor_id: recepcion?.proveedor_id || '',
    materia_prima_id: recepcion?.materia_prima_id || '',
    codigo_lote: recepcion?.codigo_lote || '',
    cantidad: recepcion?.cantidad || 0,
    unidad_medida: recepcion?.unidad_medida || 'kg',
    peso_neto: recepcion?.peso_neto || 0,
    peso_bruto: recepcion?.peso_bruto || 0,
    calidad: recepcion?.calidad || 'standar',
    fecha_recepcion: recepcion?.fecha_recepcion.split('T')[0] || new Date().toISOString().split('T')[0],
    temperatura: recepcion?.temperatura || 0,
    humedad: recepcion?.humedad || 0,
    observaciones: recepcion?.observaciones || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await onSubmit(formData);
      onClose();
      setFormData({
        proveedor_id: '',
        materia_prima_id: '',
        codigo_lote: '',
        cantidad: 0,
        unidad_medida: 'kg',
        peso_neto: 0,
        peso_bruto: 0,
        calidad: 'standar',
        fecha_recepcion: new Date().toISOString().split('T')[0],
        temperatura: 0,
        humedad: 0,
        observaciones: '',
      });
      setErrors({});
    } catch (error: any) {
      setErrors(error.response?.data?.errors || { submit: 'Error al guardar' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={recepcion ? 'Editar Recepción' : 'Nueva Recepción de Materia Prima'}
      size="3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Información Básica */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Información Básica
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Proveedor *"
              options={proveedores}
              value={formData.proveedor_id}
              onChange={(e) => setFormData({...formData, proveedor_id: e.target.value})}
              error={errors.proveedor_id}
              placeholder="Selecciona proveedor"
            />
            <Select
              label="Materia Prima *"
              options={materiasPrimas}
              value={formData.materia_prima_id}
              onChange={(e) => setFormData({...formData, materia_prima_id: e.target.value})}
              error={errors.materia_prima_id}
              placeholder="Selecciona materia prima"
            />
            <Input
              label="Código de Lote *"
              value={formData.codigo_lote}
              onChange={(e) => setFormData({...formData, codigo_lote: e.target.value})}
              error={errors.codigo_lote}
              placeholder="Ej: LOTE-2024-001"
            />
            <Input
              label="Fecha de Recepción *"
              type="date"
              value={formData.fecha_recepcion}
              onChange={(e) => setFormData({...formData, fecha_recepcion: e.target.value})}
              error={errors.fecha_recepcion}
            />
          </div>
        </div>

        {/* Cantidad y Unidad */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Cantidad
          </h3>
          <div className="grid grid-cols-3 gap-4">
            <Input
              label="Cantidad *"
              type="number"
              step="0.01"
              value={formData.cantidad}
              onChange={(e) => setFormData({...formData, cantidad: parseFloat(e.target.value)})}
              error={errors.cantidad}
              placeholder="0.00"
            />
            <Select
              label="Unidad Medida *"
              options={[
                { value: 'kg', label: 'Kilogramos (kg)' },
                { value: 'lb', label: 'Libras (lb)' },
                { value: 'ton', label: 'Toneladas (ton)' },
                { value: 'unid', label: 'Unidades' },
              ]}
              value={formData.unidad_medida}
              onChange={(e) => setFormData({...formData, unidad_medida: e.target.value as UnidadMedida})}
            />
            <Select
              label="Calidad *"
              options={[
                { value: 'premium', label: 'Premium' },
                { value: 'standar', label: 'Estándar' },
                { value: 'baja', label: 'Baja' },
              ]}
              value={formData.calidad}
              onChange={(e) => setFormData({...formData, calidad: e.target.value as CalidadRecepcion})}
            />
          </div>
        </div>

        {/* Pesos */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Pesos (Kg)
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Peso Neto *"
              type="number"
              step="0.01"
              value={formData.peso_neto}
              onChange={(e) => setFormData({...formData, peso_neto: parseFloat(e.target.value)})}
              error={errors.peso_neto}
            />
            <Input
              label="Peso Bruto *"
              type="number"
              step="0.01"
              value={formData.peso_bruto}
              onChange={(e) => setFormData({...formData, peso_bruto: parseFloat(e.target.value)})}
              error={errors.peso_bruto}
            />
          </div>
        </div>

        {/* Condiciones */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Condiciones
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Temperatura (°C)"
              type="number"
              step="0.1"
              value={formData.temperatura}
              onChange={(e) => setFormData({...formData, temperatura: parseFloat(e.target.value)})}
              error={errors.temperatura}
            />
            <Input
              label="Humedad (%)"
              type="number"
              step="0.1"
              min="0"
              max="100"
              value={formData.humedad}
              onChange={(e) => setFormData({...formData, humedad: parseFloat(e.target.value)})}
              error={errors.humedad}
            />
          </div>
        </div>

        {/* Observaciones */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Observaciones
          </h3>
          <textarea
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            rows={3}
            placeholder="Notas adicionales sobre la recepción..."
            value={formData.observaciones || ''}
            onChange={(e) => setFormData({...formData, observaciones: e.target.value})}
          />
        </div>

        {/* Errores generales */}
        {errors.submit && (
          <div className="p-3 bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-700 rounded-lg text-danger-700 dark:text-danger-400 text-sm">
            {errors.submit}
          </div>
        )}

        {/* Acciones */}
        <div className="flex gap-3 justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button
            variant="ghost"
            type="button"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            variant="primary"
            type="submit"
            isLoading={isLoading}
          >
            {recepcion ? 'Actualizar Recepción' : 'Crear Recepción'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
```

---

## 6. HOOK: useRecepcion

```typescript
// frontend/src/features/recepcion/hooks/useRecepcion.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/client';
import type {
  Recepcion,
  CreateRecepcionDTO,
  UpdateRecepcionDTO,
  RecepcionFilters,
  RecepcionResponse,
} from '../types/recepcion.types';

export function useRecepcion(filters: RecepcionFilters) {
  return useQuery({
    queryKey: ['recepcion', filters],
    queryFn: async () => {
      const response = await api.get<RecepcionResponse>('/api/recepcion', {
        params: filters,
      });
      return response.data;
    },
  });
}

export function useRecepcionById(id: string) {
  return useQuery({
    queryKey: ['recepcion', id],
    queryFn: async () => {
      const response = await api.get<{ data: Recepcion }>(`/api/recepcion/${id}`);
      return response.data.data;
    },
    enabled: !!id,
  });
}

export function useCreateRecepcion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateRecepcionDTO) => {
      const response = await api.post<{ data: Recepcion }>('/api/recepcion', data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recepcion'] });
    },
  });
}

export function useUpdateRecepcion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateRecepcionDTO }) => {
      const response = await api.patch<{ data: Recepcion }>(`/api/recepcion/${id}`, data);
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['recepcion'] });
      queryClient.invalidateQueries({ queryKey: ['recepcion', variables.id] });
    },
  });
}

export function useDeleteRecepcion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api/recepcion/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recepcion'] });
    },
  });
}

export function useProveedores() {
  return useQuery({
    queryKey: ['proveedores'],
    queryFn: async () => {
      const response = await api.get<{ data: Array<{id: string; nombre: string}> }>('/api/proveedores');
      return response.data.data;
    },
  });
}

export function useMateriasPrimas() {
  return useQuery({
    queryKey: ['materias-primas'],
    queryFn: async () => {
      const response = await api.get<{ data: Array<{id: string; nombre: string}> }>('/api/materias-primas');
      return response.data.data;
    },
  });
}
```

---

## 7. PÁGINA PRINCIPAL: RecepcionPage

```typescript
// frontend/src/features/recepcion/pages/RecepcionPage.tsx

import { useState, useMemo } from 'react';
import { Plus, Download, FileText, AlertCircle, Package, CheckCircle2, Clock } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/forms/Input';
import { Select } from '@/components/forms/Select';
import {
  PageHeader,
  FilterCard,
  FilterGrid,
  StatsGrid,
  DataTableCard,
  PageTabs,
} from '@/components/layout';
import { Modal } from '@/components/common/Modal';
import { RecepcionTable } from '../components/RecepcionTable';
import { RecepcionForm } from '../components/RecepcionForm';
import { RecepcionStatusBadge } from '../components/RecepcionStatusBadge';
import {
  useRecepcion,
  useCreateRecepcion,
  useUpdateRecepcion,
  useDeleteRecepcion,
  useProveedores,
  useMateriasPrimas,
} from '../hooks/useRecepcion';
import type {
  Recepcion,
  CreateRecepcionDTO,
  RecepcionFilters,
} from '../types/recepcion.types';
import { Badge } from '@/components/common/Badge';

export default function RecepcionPage() {
  // Estados de filtros
  const [filters, setFilters] = useState<RecepcionFilters>({
    search: '',
    estado: undefined,
    proveedor_id: '',
    materia_prima_id: '',
    fecha_desde: '',
    fecha_hasta: '',
    page: 1,
    page_size: 10,
  });

  const [activeTab, setActiveTab] = useState('todas');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedRecepcion, setSelectedRecepcion] = useState<Recepcion | undefined>();
  const [rejectReason, setRejectReason] = useState('');

  // Queries
  const { data: recepcionData, isLoading: isLoadingRecepcion } = useRecepcion(filters);
  const { data: proveedoresData } = useProveedores();
  const { data: materiasPrimasData } = useMateriasPrimas();

  // Mutations
  const createRecepcionMutation = useCreateRecepcion();
  const updateRecepcionMutation = useUpdateRecepcion();
  const deleteRecepcionMutation = useDeleteRecepcion();

  const recepcion = recepcionData?.data || [];
  const total = recepcionData?.meta?.total || 0;

  // Preparar opciones de selects
  const proveedoresOptions = useMemo(
    () => (proveedoresData || []).map((p) => ({ value: p.id, label: p.nombre })),
    [proveedoresData]
  );

  const materiasPrimasOptions = useMemo(
    () => (materiasPrimasData || []).map((m) => ({ value: m.id, label: m.nombre })),
    [materiasPrimasData]
  );

  // Calcular estadísticas
  const stats = useMemo(() => {
    const pendientes = recepcion.filter((r) => r.estado === 'pendiente').length;
    const enRecepcion = recepcion.filter((r) => r.estado === 'en_recepcion').length;
    const completadas = recepcion.filter((r) => r.estado === 'completada').length;
    const rechazadas = recepcion.filter((r) => r.estado === 'rechazada').length;

    return [
      {
        label: 'Pendientes',
        value: pendientes,
        icon: Clock,
        iconColor: 'warning',
        description: 'Por procesar',
      },
      {
        label: 'En Recepción',
        value: enRecepcion,
        icon: Package,
        iconColor: 'primary',
        description: 'En progreso',
      },
      {
        label: 'Completadas',
        value: completadas,
        icon: CheckCircle2,
        iconColor: 'success',
        description: 'Procesadas',
      },
      {
        label: 'Rechazadas',
        value: rechazadas,
        icon: AlertCircle,
        iconColor: 'danger',
        description: 'Con problemas',
      },
    ];
  }, [recepcion]);

  // Tabs
  const tabs = [
    { id: 'todas', label: 'Todas', badge: total },
    { id: 'pendientes', label: 'Pendientes', badge: stats[0].value },
    { id: 'en_proceso', label: 'En Proceso', badge: stats[1].value },
    { id: 'completadas', label: 'Completadas', badge: stats[2].value },
  ];

  // Filtrar según tab
  const filteredData = useMemo(() => {
    if (activeTab === 'todas') return recepcion;
    if (activeTab === 'pendientes') return recepcion.filter((r) => r.estado === 'pendiente');
    if (activeTab === 'en_proceso') return recepcion.filter((r) => r.estado === 'en_recepcion');
    if (activeTab === 'completadas') return recepcion.filter((r) => r.estado === 'completada');
    return recepcion;
  }, [activeTab, recepcion]);

  // Handlers
  const handleCreateRecepcion = async (data: CreateRecepcionDTO) => {
    await createRecepcionMutation.mutateAsync(data);
  };

  const handleEditRecepcion = (recepcion: Recepcion) => {
    setSelectedRecepcion(recepcion);
    setIsFormOpen(true);
  };

  const handleUpdateRecepcion = async (data: CreateRecepcionDTO) => {
    if (selectedRecepcion) {
      await updateRecepcionMutation.mutateAsync({
        id: selectedRecepcion.id,
        data,
      });
    }
  };

  const handleDeleteRecepcion = async () => {
    if (selectedRecepcion) {
      await deleteRecepcionMutation.mutateAsync(selectedRecepcion.id);
      setIsDeleteOpen(false);
    }
  };

  const handleRejectRecepcion = async () => {
    if (selectedRecepcion && rejectReason) {
      await updateRecepcionMutation.mutateAsync({
        id: selectedRecepcion.id,
        data: {
          estado: 'rechazada',
          observaciones: `RECHAZADO: ${rejectReason}`,
        } as any,
      });
      setIsRejectOpen(false);
      setRejectReason('');
    }
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setSelectedRecepcion(undefined);
  };

  const handleClearFilters = () => {
    setFilters({
      search: '',
      estado: undefined,
      proveedor_id: '',
      materia_prima_id: '',
      fecha_desde: '',
      fecha_hasta: '',
      page: 1,
      page_size: 10,
    });
  };

  const activeFiltersCount = [
    filters.estado,
    filters.proveedor_id,
    filters.materia_prima_id,
    filters.fecha_desde,
  ].filter(Boolean).length;

  const hasActiveFilters = activeFiltersCount > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Recepción de Materias Primas"
        description="Gestione la recepción, validación y almacenamiento de materias primas"
        badges={[
          { label: `${total} Total`, variant: 'primary' },
          { label: stats[3].value > 0 ? `${stats[3].value} Rechazadas` : 'Sin rechazos', variant: stats[3].value > 0 ? 'warning' : 'success' },
        ]}
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="md"
              leftIcon={<Download className="h-4 w-4" />}
            >
              Exportar
            </Button>
            <Button
              variant="primary"
              size="md"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={() => {
                setSelectedRecepcion(undefined);
                setIsFormOpen(true);
              }}
            >
              Nueva Recepción
            </Button>
          </div>
        }
        tabs={
          <PageTabs
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
        }
      />

      {/* Estadísticas */}
      <StatsGrid stats={stats} columns={4} variant="default" />

      {/* Filtros */}
      <FilterCard
        collapsible
        searchPlaceholder="Buscar por número, proveedor, código de lote..."
        searchValue={filters.search || ''}
        onSearchChange={(value) =>
          setFilters({ ...filters, search: value, page: 1 })
        }
        activeFiltersCount={activeFiltersCount}
        hasActiveFilters={hasActiveFilters}
        onClearFilters={handleClearFilters}
      >
        <FilterGrid columns={5}>
          <Select
            label="Estado"
            placeholder="Todos"
            value={filters.estado || ''}
            onChange={(e) =>
              setFilters({
                ...filters,
                estado: e.target.value as any,
                page: 1,
              })
            }
            options={[
              { value: 'pendiente', label: 'Pendiente' },
              { value: 'en_recepcion', label: 'En Recepción' },
              { value: 'completada', label: 'Completada' },
              { value: 'rechazada', label: 'Rechazada' },
            ]}
          />
          <Select
            label="Proveedor"
            placeholder="Todos"
            value={filters.proveedor_id || ''}
            onChange={(e) =>
              setFilters({ ...filters, proveedor_id: e.target.value, page: 1 })
            }
            options={proveedoresOptions}
          />
          <Select
            label="Materia Prima"
            placeholder="Todas"
            value={filters.materia_prima_id || ''}
            onChange={(e) =>
              setFilters({
                ...filters,
                materia_prima_id: e.target.value,
                page: 1,
              })
            }
            options={materiasPrimasOptions}
          />
          <Input
            label="Desde"
            type="date"
            value={filters.fecha_desde || ''}
            onChange={(e) =>
              setFilters({ ...filters, fecha_desde: e.target.value, page: 1 })
            }
          />
          <Input
            label="Hasta"
            type="date"
            value={filters.fecha_hasta || ''}
            onChange={(e) =>
              setFilters({ ...filters, fecha_hasta: e.target.value, page: 1 })
            }
          />
        </FilterGrid>
      </FilterCard>

      {/* Tabla */}
      <DataTableCard
        title="Recepciones"
        pagination={{
          currentPage: filters.page || 1,
          pageSize: filters.page_size || 10,
          totalItems: total,
          hasNext: (filters.page || 1) * (filters.page_size || 10) < total,
          hasPrevious: (filters.page || 1) > 1,
          onPageChange: (page) => setFilters({ ...filters, page }),
        }}
        isLoading={isLoadingRecepcion}
        isEmpty={filteredData.length === 0}
        emptyMessage="No hay recepciones para mostrar"
        headerActions={
          <Button variant="outline" size="sm">
            <FileText className="h-4 w-4 mr-2" />
            Generar Reporte
          </Button>
        }
      >
        <RecepcionTable
          data={filteredData}
          isLoading={isLoadingRecepcion}
          onEdit={handleEditRecepcion}
          onDelete={(rec) => {
            setSelectedRecepcion(rec);
            setIsDeleteOpen(true);
          }}
          onDetail={(rec) => {
            setSelectedRecepcion(rec);
            setIsDetailOpen(true);
          }}
          onReject={(rec) => {
            setSelectedRecepcion(rec);
            setIsRejectOpen(true);
          }}
        />
      </DataTableCard>

      {/* Form Modal */}
      <RecepcionForm
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        recepcion={selectedRecepcion}
        onSubmit={
          selectedRecepcion ? handleUpdateRecepcion : handleCreateRecepcion
        }
        proveedores={proveedoresOptions}
        materiasPrimas={materiasPrimasOptions}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="Eliminar Recepción"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            ¿Está seguro de que desea eliminar la recepción{' '}
            <strong>{selectedRecepcion?.numero_recepcion}</strong>?
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Esta acción no se puede deshacer.
          </p>

          <div className="flex gap-3 justify-end pt-4">
            <Button
              variant="ghost"
              onClick={() => setIsDeleteOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="danger"
              onClick={handleDeleteRecepcion}
              isLoading={deleteRecepcionMutation.isPending}
            >
              Eliminar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Reject Modal */}
      <Modal
        isOpen={isRejectOpen}
        onClose={() => {
          setIsRejectOpen(false);
          setRejectReason('');
        }}
        title="Rechazar Recepción"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Motivo del rechazo para{' '}
            <strong>{selectedRecepcion?.numero_recepcion}</strong>:
          </p>

          <textarea
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500"
            rows={3}
            placeholder="Explique el motivo del rechazo..."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />

          <div className="flex gap-3 justify-end">
            <Button
              variant="ghost"
              onClick={() => {
                setIsRejectOpen(false);
                setRejectReason('');
              }}
            >
              Cancelar
            </Button>
            <Button
              variant="danger"
              onClick={handleRejectRecepcion}
              isLoading={updateRecepcionMutation.isPending}
              disabled={!rejectReason.trim()}
            >
              Rechazar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Detail Modal */}
      <Modal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        title="Detalles de Recepción"
        size="2xl"
      >
        {selectedRecepcion && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  N° Recepción
                </p>
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {selectedRecepcion.numero_recepcion}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Estado
                </p>
                <div className="mt-1">
                  <RecepcionStatusBadge status={selectedRecepcion.estado} />
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Proveedor
                </p>
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {selectedRecepcion.proveedor_nombre}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Materia Prima
                </p>
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {selectedRecepcion.materia_prima_nombre}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Cantidad
                </p>
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {selectedRecepcion.cantidad} {selectedRecepcion.unidad_medida}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Calidad
                </p>
                <div className="mt-1">
                  <Badge variant="primary">
                    {selectedRecepcion.calidad.toUpperCase()}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Observaciones
              </p>
              <p className="text-gray-900 dark:text-gray-100 mt-2">
                {selectedRecepcion.observaciones || 'Sin observaciones'}
              </p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
```

---

## 8. EXPORTS (index.ts)

```typescript
// frontend/src/features/recepcion/index.ts

export { RecepcionStatusBadge } from './components/RecepcionStatusBadge';
export { RecepcionTable } from './components/RecepcionTable';
export { RecepcionForm } from './components/RecepcionForm';

export {
  useRecepcion,
  useRecepcionById,
  useCreateRecepcion,
  useUpdateRecepcion,
  useDeleteRecepcion,
  useProveedores,
  useMateriasPrimas,
} from './hooks/useRecepcion';

export type {
  Recepcion,
  RecepcionStatus,
  CreateRecepcionDTO,
  UpdateRecepcionDTO,
  RecepcionFilters,
  RecepcionResponse,
} from './types/recepcion.types';
```

---

## 9. PRÓXIMOS PASOS

1. Crear la estructura de carpetas
2. Implementar los tipos en TypeScript
3. Crear los componentes
4. Crear los hooks de API
5. Crear la página principal
6. Registrar rutas en `frontend/src/routes/index.tsx`
7. Agregar a la navegación en `frontend/src/layouts/Sidebar.tsx`
8. Implementar API endpoints en backend

---

## 10. RUTAS (Para agregar a routes/index.tsx)

```typescript
import RecepcionPage from '@/features/recepcion/pages/RecepcionPage';

// Agregar a las rutas
{
  path: '/recepcion',
  element: <RecepcionPage />,
  breadcrumbs: [
    { label: 'Dashboard', path: '/' },
    { label: 'Recepción', path: '/recepcion' },
  ],
}
```
