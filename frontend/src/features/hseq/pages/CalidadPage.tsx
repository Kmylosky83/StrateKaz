/**
 * Página: Gestión de Calidad HSEQ
 *
 * Sistema completo de gestión de calidad con 4 subsecciones:
 * - No Conformidades
 * - Acciones Correctivas
 * - Salidas No Conformes
 * - Control de Cambios
 */
import { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle,
  Package,
  RefreshCw,
  Plus,
  Download,
  Filter,
  Clock,
  XCircle,
  Eye,
  Edit,
  Trash2,
  FileText,
  User,
  Calendar,
  TrendingUp,
  Activity,
} from 'lucide-react';
import { PageHeader } from '@/components/layout';
import { Tabs } from '@/components/common/Tabs';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { EmptyState } from '@/components/common/EmptyState';
import { Badge } from '@/components/common/Badge';
import { Spinner } from '@/components/common/Spinner';
import { cn } from '@/utils/cn';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// Mock imports - to be replaced with actual hooks and types
// import {
//   useNoConformidades,
//   useAccionesCorrectivas,
//   useSalidasNoConformes,
//   useControlCambios,
// } from '../hooks/useCalidad';
// import type {
//   NoConformidad,
//   AccionCorrectiva,
//   SalidaNoConforme,
//   SolicitudCambio,
// } from '../types/calidad.types';

// ==================== PROGRESS COMPONENT ====================

interface ProgressProps {
  value: number;
  max?: number;
  className?: string;
  showLabel?: boolean;
  variant?: 'default' | 'success' | 'warning' | 'danger';
}

const Progress = ({ value, max = 100, className, showLabel = false, variant = 'default' }: ProgressProps) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  const variantColors = {
    default: 'bg-primary-600',
    success: 'bg-success-600',
    warning: 'bg-warning-600',
    danger: 'bg-danger-600',
  };

  const getVariant = (): 'default' | 'success' | 'warning' | 'danger' => {
    if (variant !== 'default') return variant;
    if (percentage >= 80) return 'success';
    if (percentage >= 50) return 'warning';
    return 'danger';
  };

  const currentVariant = getVariant();

  return (
    <div className={cn('w-full', className)}>
      <div className="flex items-center gap-2">
        <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className={cn('h-full transition-all duration-300', variantColors[currentVariant])}
            style={{ width: `${percentage}%` }}
          />
        </div>
        {showLabel && (
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-[3rem] text-right">
            {percentage.toFixed(0)}%
          </span>
        )}
      </div>
    </div>
  );
};

// ==================== UTILITY FUNCTIONS ====================

const getEstadoBadgeVariant = (
  estado: string
): 'success' | 'primary' | 'warning' | 'danger' | 'info' | 'gray' => {
  const estadoMap: Record<string, 'success' | 'primary' | 'warning' | 'danger' | 'info' | 'gray'> = {
    CERRADA: 'success',
    RESUELTA: 'success',
    APROBADA: 'success',
    IMPLEMENTADA: 'success',
    COMPLETADA: 'success',
    EN_VERIFICACION: 'primary',
    EN_REVISION: 'primary',
    EN_TRATAMIENTO: 'primary',
    EN_ANALISIS: 'primary',
    ABIERTA: 'warning',
    PENDIENTE: 'warning',
    BLOQUEADA: 'danger',
    RECHAZADA: 'danger',
    VENCIDA: 'danger',
    BORRADOR: 'gray',
  };
  return estadoMap[estado] || 'gray';
};

const getSeveridadBadgeVariant = (severidad: string): 'danger' | 'warning' | 'info' => {
  const severidadMap: Record<string, 'danger' | 'warning' | 'info'> = {
    MAYOR: 'danger',
    CRITICA: 'danger',
    MENOR: 'warning',
    OBSERVACION: 'info',
  };
  return severidadMap[severidad] || 'info';
};

const getPrioridadBadgeVariant = (prioridad: string): 'danger' | 'warning' | 'primary' | 'gray' => {
  const prioridadMap: Record<string, 'danger' | 'warning' | 'primary' | 'gray'> = {
    CRITICA: 'danger',
    ALTA: 'warning',
    MEDIA: 'primary',
    BAJA: 'gray',
  };
  return prioridadMap[prioridad] || 'gray';
};

const formatEstado = (estado: string): string => {
  return estado.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase());
};

const formatTipo = (tipo: string): string => {
  const tipoMap: Record<string, string> = {
    AUDITORIA_INTERNA: 'Auditoría Interna',
    AUDITORIA_EXTERNA: 'Auditoría Externa',
    QUEJA_CLIENTE: 'Queja Cliente',
    INSPECCION: 'Inspección',
    PROCESO: 'Proceso',
    PREVENTIVA: 'Preventiva',
    CORRECTIVA: 'Correctiva',
    MEJORA: 'Mejora',
  };
  return tipoMap[tipo] || formatEstado(tipo);
};

// ==================== MOCK DATA ====================

const mockNoConformidades = [
  {
    id: 1,
    codigo: 'NC-2024-001',
    titulo: 'Falta de calibración en equipos de medición',
    origen: 'AUDITORIA_INTERNA',
    severidad: 'MAYOR',
    estado: 'ABIERTA',
    fecha_deteccion: '2024-01-15',
    area_afectada: 'Producción',
    responsable: 'Juan Pérez',
  },
  {
    id: 2,
    codigo: 'NC-2024-002',
    titulo: 'Documentación desactualizada en proceso de empaque',
    origen: 'INSPECCION',
    severidad: 'MENOR',
    estado: 'EN_VERIFICACION',
    fecha_deteccion: '2024-01-18',
    area_afectada: 'Empaque',
    responsable: 'María González',
  },
  {
    id: 3,
    codigo: 'NC-2024-003',
    titulo: 'Incumplimiento de temperatura en almacenamiento',
    origen: 'QUEJA_CLIENTE',
    severidad: 'CRITICA',
    estado: 'ABIERTA',
    fecha_deteccion: '2024-01-20',
    area_afectada: 'Almacén',
    responsable: 'Carlos Rodríguez',
  },
];

const mockAccionesCorrectivas = [
  {
    id: 1,
    codigo: 'AC-2024-001',
    tipo: 'CORRECTIVA',
    nc_relacionada: 'NC-2024-001',
    descripcion: 'Realizar calibración de todos los equipos de medición',
    estado: 'PENDIENTE',
    responsable: 'Juan Pérez',
    fecha_limite: '2024-02-15',
    avance: 30,
  },
  {
    id: 2,
    codigo: 'AC-2024-002',
    tipo: 'PREVENTIVA',
    nc_relacionada: null,
    descripcion: 'Actualizar procedimientos de control de documentos',
    estado: 'EJECUTADA',
    responsable: 'María González',
    fecha_limite: '2024-01-30',
    avance: 100,
  },
  {
    id: 3,
    codigo: 'AC-2024-003',
    tipo: 'MEJORA',
    nc_relacionada: null,
    descripcion: 'Implementar sistema de monitoreo de temperatura en tiempo real',
    estado: 'PENDIENTE',
    responsable: 'Carlos Rodríguez',
    fecha_limite: '2024-03-01',
    avance: 15,
  },
];

const mockSalidasNoConformes = [
  {
    id: 1,
    codigo: 'SNC-2024-001',
    producto: 'Huesos bovinos premium',
    lote: 'LOT-2024-0115',
    cantidad: 250,
    unidad: 'kg',
    disposicion: 'REPROCESO',
    estado: 'EN_TRATAMIENTO',
    fecha_deteccion: '2024-01-15',
  },
  {
    id: 2,
    codigo: 'SNC-2024-002',
    producto: 'Grasa porcina refinada',
    lote: 'LOT-2024-0118',
    cantidad: 100,
    unidad: 'kg',
    disposicion: 'ELIMINACION',
    estado: 'BLOQUEADA',
    fecha_deteccion: '2024-01-18',
  },
  {
    id: 3,
    codigo: 'SNC-2024-003',
    producto: 'Huesos porcinos',
    lote: 'LOT-2024-0120',
    cantidad: 150,
    unidad: 'kg',
    disposicion: 'RECLASIFICACION',
    estado: 'RESUELTA',
    fecha_deteccion: '2024-01-20',
  },
];

const mockControlCambios = [
  {
    id: 1,
    codigo: 'CC-2024-001',
    titulo: 'Modificación proceso de limpieza de equipos',
    tipo: 'PROCESO',
    prioridad: 'ALTA',
    estado: 'PENDIENTE',
    solicitante: 'Ana Martínez',
    fecha_solicitud: '2024-01-10',
  },
  {
    id: 2,
    codigo: 'CC-2024-002',
    titulo: 'Actualización de software de gestión de calidad',
    tipo: 'SISTEMA',
    prioridad: 'MEDIA',
    estado: 'EN_REVISION',
    solicitante: 'Pedro López',
    fecha_solicitud: '2024-01-12',
  },
  {
    id: 3,
    codigo: 'CC-2024-003',
    titulo: 'Cambio de proveedor de empaques',
    tipo: 'PROVEEDOR',
    prioridad: 'ALTA',
    estado: 'APROBADA',
    solicitante: 'Laura Sánchez',
    fecha_solicitud: '2024-01-14',
  },
];

// ==================== NO CONFORMIDADES SECTION ====================

const NoConformidadesSection = () => {
  // const { data: noConformidades, isLoading } = useNoConformidades();
  const isLoading = false;
  const noConformidades = mockNoConformidades;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner />
      </div>
    );
  }

  if (!noConformidades || noConformidades.length === 0) {
    return (
      <EmptyState
        icon={<AlertTriangle className="w-16 h-16" />}
        title="No hay no conformidades registradas"
        description="Comience registrando las no conformidades detectadas en el sistema de calidad"
        action={{
          label: 'Nueva No Conformidad',
          onClick: () => console.log('Nueva NC'),
          icon: <Plus className="w-4 h-4" />,
        }}
      />
    );
  }

  const stats = {
    total: noConformidades.length,
    abiertas: noConformidades.filter((nc) => nc.estado === 'ABIERTA').length,
    enVerificacion: noConformidades.filter((nc) => nc.estado === 'EN_VERIFICACION').length,
    cerradas: noConformidades.filter((nc) => nc.estado === 'CERRADA').length,
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total NC</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.total}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Últimos 30 días</p>
        </Card>

        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Abiertas</p>
              <p className="text-2xl font-bold text-warning-600 dark:text-warning-400 mt-1">{stats.abiertas}</p>
            </div>
            <div className="w-12 h-12 bg-warning-100 dark:bg-warning-900/30 rounded-lg flex items-center justify-center">
              <XCircle className="w-6 h-6 text-warning-600 dark:text-warning-400" />
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Requieren acción</p>
        </Card>

        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">En Verificación</p>
              <p className="text-2xl font-bold text-primary-600 dark:text-primary-400 mt-1">
                {stats.enVerificacion}
              </p>
            </div>
            <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">En proceso de verificación</p>
        </Card>

        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Cerradas</p>
              <p className="text-2xl font-bold text-success-600 dark:text-success-400 mt-1">{stats.cerradas}</p>
            </div>
            <div className="w-12 h-12 bg-success-100 dark:bg-success-900/30 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-success-600 dark:text-success-400" />
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Este mes</p>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">No Conformidades Registradas</h3>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" leftIcon={<Filter className="w-4 h-4" />}>
            Filtros
          </Button>
          <Button variant="outline" size="sm" leftIcon={<Download className="w-4 h-4" />}>
            Exportar
          </Button>
          <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
            Nueva No Conformidad
          </Button>
        </div>
      </div>

      {/* NC Table */}
      <Card variant="bordered" padding="none">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Código
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Título
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Origen
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Severidad
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Área
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Responsable
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {noConformidades.map((nc) => (
                <tr key={nc.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {nc.codigo}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                    <div className="max-w-xs">
                      <p className="font-medium truncate">{nc.titulo}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                    {formatTipo(nc.origen)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant={getSeveridadBadgeVariant(nc.severidad)} size="sm">
                      {formatEstado(nc.severidad)}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant={getEstadoBadgeVariant(nc.estado)} size="sm">
                      {formatEstado(nc.estado)}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                    {format(new Date(nc.fecha_deteccion), 'dd/MM/yyyy', { locale: es })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                    {nc.area_afectada}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                    {nc.responsable}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="w-4 h-4 text-danger-600" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

// ==================== ACCIONES CORRECTIVAS SECTION ====================

const AccionesCorrectivasSection = () => {
  // const { data: acciones, isLoading } = useAccionesCorrectivas();
  const isLoading = false;
  const acciones = mockAccionesCorrectivas;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner />
      </div>
    );
  }

  if (!acciones || acciones.length === 0) {
    return (
      <EmptyState
        icon={<CheckCircle className="w-16 h-16" />}
        title="No hay acciones correctivas registradas"
        description="Comience creando acciones correctivas para atender las no conformidades"
        action={{
          label: 'Nueva Acción',
          onClick: () => console.log('Nueva Acción'),
          icon: <Plus className="w-4 h-4" />,
        }}
      />
    );
  }

  const stats = {
    total: acciones.length,
    pendientes: acciones.filter((a) => a.estado === 'PENDIENTE').length,
    ejecutadas: acciones.filter((a) => a.estado === 'EJECUTADA').length,
    vencidas: acciones.filter((a) => a.estado === 'VENCIDA').length,
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Acciones</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.total}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Correctivas y preventivas</p>
        </Card>

        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Pendientes</p>
              <p className="text-2xl font-bold text-warning-600 dark:text-warning-400 mt-1">{stats.pendientes}</p>
            </div>
            <div className="w-12 h-12 bg-warning-100 dark:bg-warning-900/30 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-warning-600 dark:text-warning-400" />
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">En ejecución</p>
        </Card>

        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Ejecutadas</p>
              <p className="text-2xl font-bold text-success-600 dark:text-success-400 mt-1">{stats.ejecutadas}</p>
            </div>
            <div className="w-12 h-12 bg-success-100 dark:bg-success-900/30 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-success-600 dark:text-success-400" />
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Completadas</p>
        </Card>

        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Vencidas</p>
              <p className="text-2xl font-bold text-danger-600 dark:text-danger-400 mt-1">{stats.vencidas}</p>
            </div>
            <div className="w-12 h-12 bg-danger-100 dark:bg-danger-900/30 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-danger-600 dark:text-danger-400" />
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Requieren atención</p>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Acciones Correctivas y Preventivas</h3>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" leftIcon={<Filter className="w-4 h-4" />}>
            Filtros
          </Button>
          <Button variant="outline" size="sm" leftIcon={<Download className="w-4 h-4" />}>
            Exportar
          </Button>
          <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
            Nueva Acción
          </Button>
        </div>
      </div>

      {/* Actions Grid */}
      <div className="grid grid-cols-1 gap-6">
        {acciones.map((accion) => (
          <Card key={accion.id} variant="bordered" padding="md">
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-semibold text-gray-900 dark:text-white">{accion.codigo}</h4>
                    <Badge variant={getEstadoBadgeVariant(accion.estado)} size="sm">
                      {formatEstado(accion.estado)}
                    </Badge>
                    <Badge variant="info" size="sm">
                      {formatTipo(accion.tipo)}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">{accion.descripcion}</p>
                  {accion.nc_relacionada && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      NC Relacionada: {accion.nc_relacionada}
                    </p>
                  )}
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Responsable</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">{accion.responsable}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Fecha Límite</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">
                    {format(new Date(accion.fecha_limite), 'dd/MM/yyyy', { locale: es })}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Avance</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">{accion.avance}%</p>
                </div>
              </div>

              {/* Progress */}
              <div>
                <Progress value={accion.avance} showLabel={false} />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                <Button variant="ghost" size="sm" leftIcon={<Eye className="w-4 h-4" />}>
                  Ver Detalle
                </Button>
                <Button variant="ghost" size="sm" leftIcon={<Edit className="w-4 h-4" />}>
                  Editar
                </Button>
                <Button variant="ghost" size="sm" leftIcon={<FileText className="w-4 h-4" />}>
                  Evidencias
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

// ==================== SALIDAS NO CONFORMES SECTION ====================

const SalidasNoConformesSection = () => {
  // const { data: salidas, isLoading } = useSalidasNoConformes();
  const isLoading = false;
  const salidas = mockSalidasNoConformes;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner />
      </div>
    );
  }

  if (!salidas || salidas.length === 0) {
    return (
      <EmptyState
        icon={<Package className="w-16 h-16" />}
        title="No hay salidas no conformes registradas"
        description="Comience registrando las salidas de producción no conformes"
        action={{
          label: 'Nueva Salida NC',
          onClick: () => console.log('Nueva Salida NC'),
          icon: <Plus className="w-4 h-4" />,
        }}
      />
    );
  }

  const stats = {
    total: salidas.length,
    bloqueadas: salidas.filter((s) => s.estado === 'BLOQUEADA').length,
    enTratamiento: salidas.filter((s) => s.estado === 'EN_TRATAMIENTO').length,
    resueltas: salidas.filter((s) => s.estado === 'RESUELTA').length,
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Salidas</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.total}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Productos no conformes</p>
        </Card>

        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Bloqueadas</p>
              <p className="text-2xl font-bold text-danger-600 dark:text-danger-400 mt-1">{stats.bloqueadas}</p>
            </div>
            <div className="w-12 h-12 bg-danger-100 dark:bg-danger-900/30 rounded-lg flex items-center justify-center">
              <XCircle className="w-6 h-6 text-danger-600 dark:text-danger-400" />
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">En cuarentena</p>
        </Card>

        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">En Tratamiento</p>
              <p className="text-2xl font-bold text-warning-600 dark:text-warning-400 mt-1">
                {stats.enTratamiento}
              </p>
            </div>
            <div className="w-12 h-12 bg-warning-100 dark:bg-warning-900/30 rounded-lg flex items-center justify-center">
              <Activity className="w-6 h-6 text-warning-600 dark:text-warning-400" />
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">En proceso de disposición</p>
        </Card>

        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Resueltas</p>
              <p className="text-2xl font-bold text-success-600 dark:text-success-400 mt-1">{stats.resueltas}</p>
            </div>
            <div className="w-12 h-12 bg-success-100 dark:bg-success-900/30 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-success-600 dark:text-success-400" />
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Disposición completada</p>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Salidas No Conformes</h3>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" leftIcon={<Filter className="w-4 h-4" />}>
            Filtros
          </Button>
          <Button variant="outline" size="sm" leftIcon={<Download className="w-4 h-4" />}>
            Exportar
          </Button>
          <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
            Nueva Salida NC
          </Button>
        </div>
      </div>

      {/* Salidas Table */}
      <Card variant="bordered" padding="none">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Código
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Producto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Lote
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Cantidad
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Disposición
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {salidas.map((salida) => (
                <tr key={salida.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {salida.codigo}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                    <p className="font-medium">{salida.producto}</p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                    {salida.lote}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                    {salida.cantidad} {salida.unidad}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant="info" size="sm">
                      {formatEstado(salida.disposicion)}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant={getEstadoBadgeVariant(salida.estado)} size="sm">
                      {formatEstado(salida.estado)}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                    {format(new Date(salida.fecha_deteccion), 'dd/MM/yyyy', { locale: es })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Package className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

// ==================== CONTROL DE CAMBIOS SECTION ====================

const ControlCambiosSection = () => {
  // const { data: cambios, isLoading } = useControlCambios();
  const isLoading = false;
  const cambios = mockControlCambios;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner />
      </div>
    );
  }

  if (!cambios || cambios.length === 0) {
    return (
      <EmptyState
        icon={<RefreshCw className="w-16 h-16" />}
        title="No hay solicitudes de cambio registradas"
        description="Comience creando solicitudes de cambio para el sistema de gestión"
        action={{
          label: 'Nueva Solicitud',
          onClick: () => console.log('Nueva Solicitud'),
          icon: <Plus className="w-4 h-4" />,
        }}
      />
    );
  }

  const stats = {
    pendientes: cambios.filter((c) => c.estado === 'PENDIENTE').length,
    enRevision: cambios.filter((c) => c.estado === 'EN_REVISION').length,
    aprobadas: cambios.filter((c) => c.estado === 'APROBADA').length,
    implementadas: cambios.filter((c) => c.estado === 'IMPLEMENTADA').length,
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Pendientes</p>
              <p className="text-2xl font-bold text-warning-600 dark:text-warning-400 mt-1">{stats.pendientes}</p>
            </div>
            <div className="w-12 h-12 bg-warning-100 dark:bg-warning-900/30 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-warning-600 dark:text-warning-400" />
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Esperando revisión</p>
        </Card>

        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">En Revisión</p>
              <p className="text-2xl font-bold text-primary-600 dark:text-primary-400 mt-1">{stats.enRevision}</p>
            </div>
            <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
              <Activity className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">En evaluación</p>
        </Card>

        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Aprobadas</p>
              <p className="text-2xl font-bold text-success-600 dark:text-success-400 mt-1">{stats.aprobadas}</p>
            </div>
            <div className="w-12 h-12 bg-success-100 dark:bg-success-900/30 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-success-600 dark:text-success-400" />
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Listas para implementar</p>
        </Card>

        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Implementadas</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">{stats.implementadas}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Este mes</p>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Control de Cambios</h3>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" leftIcon={<Filter className="w-4 h-4" />}>
            Filtros
          </Button>
          <Button variant="outline" size="sm" leftIcon={<Download className="w-4 h-4" />}>
            Exportar
          </Button>
          <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
            Nueva Solicitud
          </Button>
        </div>
      </div>

      {/* Cambios Table */}
      <Card variant="bordered" padding="none">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Código
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Título
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Prioridad
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Solicitante
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {cambios.map((cambio) => (
                <tr key={cambio.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {cambio.codigo}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                    <div className="max-w-xs">
                      <p className="font-medium truncate">{cambio.titulo}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                    {formatEstado(cambio.tipo)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant={getPrioridadBadgeVariant(cambio.prioridad)} size="sm">
                      {formatEstado(cambio.prioridad)}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant={getEstadoBadgeVariant(cambio.estado)} size="sm">
                      {formatEstado(cambio.estado)}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                    {cambio.solicitante}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                    {format(new Date(cambio.fecha_solicitud), 'dd/MM/yyyy', { locale: es })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <FileText className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

// ==================== MAIN PAGE COMPONENT ====================

export default function CalidadPage() {
  const [activeTab, setActiveTab] = useState('no-conformidades');

  const tabs = [
    {
      id: 'no-conformidades',
      label: 'No Conformidades',
      icon: <AlertTriangle className="w-4 h-4" />,
    },
    {
      id: 'acciones-correctivas',
      label: 'Acciones Correctivas',
      icon: <CheckCircle className="w-4 h-4" />,
    },
    {
      id: 'salidas-no-conformes',
      label: 'Salidas No Conformes',
      icon: <Package className="w-4 h-4" />,
    },
    {
      id: 'control-cambios',
      label: 'Control de Cambios',
      icon: <RefreshCw className="w-4 h-4" />,
    },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Gestión de Calidad"
        description="Control integral de no conformidades, acciones correctivas, salidas no conformes y gestión de cambios"
      />

      {/* Tabs */}
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} variant="pills" />

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'no-conformidades' && <NoConformidadesSection />}
        {activeTab === 'acciones-correctivas' && <AccionesCorrectivasSection />}
        {activeTab === 'salidas-no-conformes' && <SalidasNoConformesSection />}
        {activeTab === 'control-cambios' && <ControlCambiosSection />}
      </div>
    </div>
  );
}
