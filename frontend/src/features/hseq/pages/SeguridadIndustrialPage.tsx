/**
 * Página: Gestión de Seguridad Industrial HSEQ
 *
 * Sistema completo de seguridad industrial con 4 subsecciones:
 * - Permisos de Trabajo
 * - Inspecciones de Seguridad
 * - Entregas EPP
 * - Programas de Seguridad
 */
import { useState } from 'react';
import {
  FileText,
  ClipboardCheck,
  HardHat,
  Shield,
  Plus,
  Download,
  Filter,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Edit,
  Trash2,
  User,
  Calendar,
  AlertTriangle,
  TrendingUp,
  Activity,
  Package,
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
//   usePermisosTrabajo,
//   useInspecciones,
//   useEntregasEPP,
//   useProgramasSeguridad,
// } from '../hooks/useSeguridadIndustrial';
// import type {
//   PermisoTrabajo,
//   Inspeccion,
//   EntregaEPP,
//   ProgramaSeguridad,
// } from '../types/seguridad-industrial.types';

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
    COMPLETADO: 'success',
    COMPLETADA: 'success',
    APROBADO: 'success',
    EN_USO: 'success',
    SATISFACTORIO: 'success',
    EN_EJECUCION: 'primary',
    EN_PROCESO: 'primary',
    ACEPTABLE: 'primary',
    PROGRAMADA: 'warning',
    PENDIENTE_APROBACION: 'warning',
    DEFICIENTE: 'warning',
    CANCELADO: 'danger',
    CANCELADA: 'danger',
    VENCIDO: 'danger',
    CRITICO: 'danger',
    DEVUELTO: 'danger',
    EXTRAVIADO: 'danger',
    DANADO: 'danger',
    BORRADOR: 'gray',
  };
  return estadoMap[estado] || 'gray';
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
    TRABAJO_ALTURAS: 'Trabajo en Alturas',
    ESPACIOS_CONFINADOS: 'Espacios Confinados',
    TRABAJO_CALIENTE: 'Trabajo en Caliente',
    TRABAJO_ELECTRICO: 'Trabajo Eléctrico',
    EXCAVACION: 'Excavación',
    PREVENCION_RIESGOS: 'Prevención de Riesgos',
    CAPACITACION: 'Capacitación',
    VIGILANCIA_SALUD: 'Vigilancia de Salud',
    INSPECCION: 'Inspección',
    PREPARACION_EMERGENCIAS: 'Preparación para Emergencias',
    INVESTIGACION_INCIDENTES: 'Investigación de Incidentes',
    MEJORA_CONTINUA: 'Mejora Continua',
  };
  return tipoMap[tipo] || formatEstado(tipo);
};

const formatCategoria = (categoria: string): string => {
  const categoriaMap: Record<string, string> = {
    CABEZA: 'Protección de Cabeza',
    OJOS_CARA: 'Protección de Ojos y Cara',
    AUDITIVA: 'Protección Auditiva',
    RESPIRATORIA: 'Protección Respiratoria',
    MANOS: 'Protección de Manos',
    PIES: 'Protección de Pies',
    CUERPO: 'Protección de Cuerpo',
    CAIDAS: 'Protección contra Caídas',
    OTROS: 'Otros',
  };
  return categoriaMap[categoria] || formatEstado(categoria);
};

// ==================== MOCK DATA ====================

const mockPermisosTrabajo = [
  {
    id: 1,
    numero_permiso: 'PT-2024-001',
    tipo_permiso: { nombre: 'Trabajo en Alturas', color: '#EF4444' },
    ubicacion: 'Área de Producción - Nivel 3',
    descripcion_trabajo: 'Mantenimiento de sistema de ventilación en techo',
    fecha_inicio: '2024-01-20T08:00:00',
    fecha_fin: '2024-01-20T17:00:00',
    solicitante: { full_name: 'Juan Pérez' },
    supervisor: { full_name: 'Carlos Rodríguez' },
    estado: 'APROBADO',
    autorizado_sst: true,
    autorizado_operaciones: true,
  },
  {
    id: 2,
    numero_permiso: 'PT-2024-002',
    tipo_permiso: { nombre: 'Trabajo en Caliente', color: '#F59E0B' },
    ubicacion: 'Taller de Mantenimiento',
    descripcion_trabajo: 'Soldadura de estructura metálica',
    fecha_inicio: '2024-01-21T09:00:00',
    fecha_fin: '2024-01-21T16:00:00',
    solicitante: { full_name: 'María González' },
    supervisor: { full_name: 'Ana Martínez' },
    estado: 'PENDIENTE_APROBACION',
    autorizado_sst: true,
    autorizado_operaciones: false,
  },
  {
    id: 3,
    numero_permiso: 'PT-2024-003',
    tipo_permiso: { nombre: 'Espacios Confinados', color: '#8B5CF6' },
    ubicacion: 'Tanque de Almacenamiento #2',
    descripcion_trabajo: 'Inspección interna y limpieza de tanque',
    fecha_inicio: '2024-01-22T07:00:00',
    fecha_fin: '2024-01-22T15:00:00',
    solicitante: { full_name: 'Pedro López' },
    supervisor: { full_name: 'Laura Sánchez' },
    estado: 'EN_EJECUCION',
    autorizado_sst: true,
    autorizado_operaciones: true,
  },
];

const mockInspecciones = [
  {
    id: 1,
    numero_inspeccion: 'INS-2024-001',
    tipo_inspeccion: { nombre: 'Inspección de Equipos contra Incendios' },
    fecha_programada: '2024-01-15',
    fecha_realizada: '2024-01-15',
    ubicacion: 'Planta de Producción',
    area: 'Todas las áreas',
    inspector: { full_name: 'Carlos Rodríguez' },
    estado: 'COMPLETADA',
    porcentaje_cumplimiento: 95,
    resultado_global: 'SATISFACTORIO',
    numero_hallazgos: 2,
    numero_hallazgos_criticos: 0,
  },
  {
    id: 2,
    numero_inspeccion: 'INS-2024-002',
    tipo_inspeccion: { nombre: 'Inspección de Orden y Aseo' },
    fecha_programada: '2024-01-18',
    fecha_realizada: '2024-01-18',
    ubicacion: 'Área de Almacenamiento',
    area: 'Almacén',
    inspector: { full_name: 'Ana Martínez' },
    estado: 'COMPLETADA',
    porcentaje_cumplimiento: 78,
    resultado_global: 'ACEPTABLE',
    numero_hallazgos: 5,
    numero_hallazgos_criticos: 1,
  },
  {
    id: 3,
    numero_inspeccion: 'INS-2024-003',
    tipo_inspeccion: { nombre: 'Inspección de Herramientas Manuales' },
    fecha_programada: '2024-01-25',
    fecha_realizada: null,
    ubicacion: 'Taller de Mantenimiento',
    area: 'Mantenimiento',
    inspector: { full_name: 'Juan Pérez' },
    estado: 'PROGRAMADA',
    porcentaje_cumplimiento: null,
    resultado_global: null,
    numero_hallazgos: 0,
    numero_hallazgos_criticos: 0,
  },
];

const mockEntregasEPP = [
  {
    id: 1,
    numero_entrega: 'EPP-2024-001',
    colaborador: { full_name: 'Juan Pérez', username: 'jperez' },
    tipo_epp: { nombre: 'Casco de Seguridad', categoria: 'CABEZA' },
    marca: 'MSA',
    modelo: 'V-Gard',
    talla: 'Universal',
    cantidad: 1,
    fecha_entrega: '2024-01-10',
    fecha_reposicion_programada: '2024-07-10',
    entregado_por: { full_name: 'Ana Martínez' },
    estado: 'EN_USO',
    capacitacion_realizada: true,
  },
  {
    id: 2,
    numero_entrega: 'EPP-2024-002',
    colaborador: { full_name: 'María González', username: 'mgonzalez' },
    tipo_epp: { nombre: 'Guantes de Nitrilo', categoria: 'MANOS' },
    marca: 'Ansell',
    modelo: 'Touch N Tuff',
    talla: 'M',
    cantidad: 10,
    fecha_entrega: '2024-01-12',
    fecha_reposicion_programada: '2024-02-12',
    entregado_por: { full_name: 'Ana Martínez' },
    estado: 'EN_USO',
    capacitacion_realizada: false,
  },
  {
    id: 3,
    numero_entrega: 'EPP-2024-003',
    colaborador: { full_name: 'Carlos Rodríguez', username: 'crodriguez' },
    tipo_epp: { nombre: 'Arnés de Seguridad', categoria: 'CAIDAS' },
    marca: '3M',
    modelo: 'DBI-SALA',
    talla: 'L',
    cantidad: 1,
    fecha_entrega: '2024-01-15',
    fecha_reposicion_programada: '2025-01-15',
    entregado_por: { full_name: 'Ana Martínez' },
    estado: 'EN_USO',
    capacitacion_realizada: true,
  },
];

const mockProgramasSeguridad = [
  {
    id: 1,
    codigo: 'PROG-SEG-001',
    nombre: 'Programa de Prevención de Riesgos Laborales',
    descripcion: 'Programa integral para la identificación y control de riesgos en todas las áreas',
    tipo_programa: 'PREVENCION_RIESGOS',
    responsable: { full_name: 'Carlos Rodríguez' },
    fecha_inicio: '2024-01-01',
    fecha_fin: '2024-12-31',
    estado: 'EN_EJECUCION',
    porcentaje_avance: 45,
    presupuesto_asignado: 15000000,
    presupuesto_ejecutado: 6750000,
  },
  {
    id: 2,
    codigo: 'PROG-SEG-002',
    nombre: 'Programa de Capacitación en Seguridad',
    descripcion: 'Capacitaciones mensuales en temas de SST para todo el personal',
    tipo_programa: 'CAPACITACION',
    responsable: { full_name: 'Ana Martínez' },
    fecha_inicio: '2024-01-01',
    fecha_fin: '2024-12-31',
    estado: 'EN_EJECUCION',
    porcentaje_avance: 60,
    presupuesto_asignado: 8000000,
    presupuesto_ejecutado: 4800000,
  },
  {
    id: 3,
    codigo: 'PROG-SEG-003',
    nombre: 'Programa de Preparación para Emergencias',
    descripcion: 'Desarrollo de brigadas, simulacros y planes de emergencia',
    tipo_programa: 'PREPARACION_EMERGENCIAS',
    responsable: { full_name: 'Juan Pérez' },
    fecha_inicio: '2024-01-01',
    fecha_fin: '2024-12-31',
    estado: 'PLANIFICADO',
    porcentaje_avance: 25,
    presupuesto_asignado: 10000000,
    presupuesto_ejecutado: 2500000,
  },
];

// ==================== PERMISOS DE TRABAJO SECTION ====================

const PermisosTrabajoSection = () => {
  // const { data: permisos, isLoading } = usePermisosTrabajo();
  const isLoading = false;
  const permisos = mockPermisosTrabajo;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner />
      </div>
    );
  }

  if (!permisos || permisos.length === 0) {
    return (
      <EmptyState
        icon={<FileText className="w-16 h-16" />}
        title="No hay permisos de trabajo registrados"
        description="Comience emitiendo permisos de trabajo para actividades de alto riesgo"
        action={{
          label: 'Nuevo Permiso',
          onClick: () => console.log('Nuevo Permiso'),
          icon: <Plus className="w-4 h-4" />,
        }}
      />
    );
  }

  const stats = {
    total: permisos.length,
    aprobados: permisos.filter((p) => p.estado === 'APROBADO').length,
    enEjecucion: permisos.filter((p) => p.estado === 'EN_EJECUCION').length,
    pendientes: permisos.filter((p) => p.estado === 'PENDIENTE_APROBACION').length,
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Permisos</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.total}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Últimos 30 días</p>
        </Card>

        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Aprobados</p>
              <p className="text-2xl font-bold text-success-600 dark:text-success-400 mt-1">{stats.aprobados}</p>
            </div>
            <div className="w-12 h-12 bg-success-100 dark:bg-success-900/30 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-success-600 dark:text-success-400" />
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Listos para ejecutar</p>
        </Card>

        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">En Ejecución</p>
              <p className="text-2xl font-bold text-primary-600 dark:text-primary-400 mt-1">{stats.enEjecucion}</p>
            </div>
            <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
              <Activity className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Trabajos activos</p>
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
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Requieren aprobación</p>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Permisos de Trabajo</h3>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" leftIcon={<Filter className="w-4 h-4" />}>
            Filtros
          </Button>
          <Button variant="outline" size="sm" leftIcon={<Download className="w-4 h-4" />}>
            Exportar
          </Button>
          <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
            Nuevo Permiso
          </Button>
        </div>
      </div>

      {/* Permisos Grid */}
      <div className="grid grid-cols-1 gap-6">
        {permisos.map((permiso) => (
          <Card key={permiso.id} variant="bordered" padding="md">
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-semibold text-gray-900 dark:text-white">{permiso.numero_permiso}</h4>
                    <Badge variant={getEstadoBadgeVariant(permiso.estado)} size="sm">
                      {formatEstado(permiso.estado)}
                    </Badge>
                    <Badge
                      variant="info"
                      size="sm"
                      style={{ backgroundColor: permiso.tipo_permiso.color, color: 'white' }}
                    >
                      {permiso.tipo_permiso.nombre}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">{permiso.descripcion_trabajo}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    📍 {permiso.ubicacion}
                  </p>
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Solicitante</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">
                    {permiso.solicitante.full_name}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Supervisor</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">
                    {permiso.supervisor.full_name}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Fecha Inicio</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">
                    {format(new Date(permiso.fecha_inicio), "dd/MM/yyyy HH:mm", { locale: es })}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Fecha Fin</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">
                    {format(new Date(permiso.fecha_fin), "dd/MM/yyyy HH:mm", { locale: es })}
                  </p>
                </div>
              </div>

              {/* Approvals */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400">SST:</span>
                  {permiso.autorizado_sst ? (
                    <CheckCircle className="w-4 h-4 text-success-600" />
                  ) : (
                    <XCircle className="w-4 h-4 text-gray-400" />
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400">Operaciones:</span>
                  {permiso.autorizado_operaciones ? (
                    <CheckCircle className="w-4 h-4 text-success-600" />
                  ) : (
                    <XCircle className="w-4 h-4 text-gray-400" />
                  )}
                </div>
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
                  Imprimir
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

// ==================== INSPECCIONES SECTION ====================

const InspeccionesSection = () => {
  // const { data: inspecciones, isLoading } = useInspecciones();
  const isLoading = false;
  const inspecciones = mockInspecciones;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner />
      </div>
    );
  }

  if (!inspecciones || inspecciones.length === 0) {
    return (
      <EmptyState
        icon={<ClipboardCheck className="w-16 h-16" />}
        title="No hay inspecciones registradas"
        description="Comience programando inspecciones de seguridad en las diferentes áreas"
        action={{
          label: 'Nueva Inspección',
          onClick: () => console.log('Nueva Inspección'),
          icon: <Plus className="w-4 h-4" />,
        }}
      />
    );
  }

  const stats = {
    total: inspecciones.length,
    programadas: inspecciones.filter((i) => i.estado === 'PROGRAMADA').length,
    completadas: inspecciones.filter((i) => i.estado === 'COMPLETADA').length,
    conHallazgos: inspecciones.filter((i) => i.numero_hallazgos_criticos > 0).length,
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Inspecciones</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.total}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
              <ClipboardCheck className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Este mes</p>
        </Card>

        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Programadas</p>
              <p className="text-2xl font-bold text-warning-600 dark:text-warning-400 mt-1">{stats.programadas}</p>
            </div>
            <div className="w-12 h-12 bg-warning-100 dark:bg-warning-900/30 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-warning-600 dark:text-warning-400" />
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Por realizar</p>
        </Card>

        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Completadas</p>
              <p className="text-2xl font-bold text-success-600 dark:text-success-400 mt-1">{stats.completadas}</p>
            </div>
            <div className="w-12 h-12 bg-success-100 dark:bg-success-900/30 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-success-600 dark:text-success-400" />
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Este mes</p>
        </Card>

        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Hallazgos Críticos</p>
              <p className="text-2xl font-bold text-danger-600 dark:text-danger-400 mt-1">{stats.conHallazgos}</p>
            </div>
            <div className="w-12 h-12 bg-danger-100 dark:bg-danger-900/30 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-danger-600 dark:text-danger-400" />
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Requieren acción</p>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Inspecciones de Seguridad</h3>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" leftIcon={<Filter className="w-4 h-4" />}>
            Filtros
          </Button>
          <Button variant="outline" size="sm" leftIcon={<Download className="w-4 h-4" />}>
            Exportar
          </Button>
          <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
            Nueva Inspección
          </Button>
        </div>
      </div>

      {/* Inspecciones Table */}
      <Card variant="bordered" padding="none">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Número
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Ubicación
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Inspector
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Cumplimiento
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Resultado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Hallazgos
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {inspecciones.map((inspeccion) => (
                <tr key={inspeccion.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {inspeccion.numero_inspeccion}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                    <p className="font-medium">{inspeccion.tipo_inspeccion.nombre}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {format(new Date(inspeccion.fecha_programada), 'dd/MM/yyyy', { locale: es })}
                    </p>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                    <p>{inspeccion.ubicacion}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{inspeccion.area}</p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                    {inspeccion.inspector.full_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant={getEstadoBadgeVariant(inspeccion.estado)} size="sm">
                      {formatEstado(inspeccion.estado)}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                    {inspeccion.porcentaje_cumplimiento !== null ? (
                      <div className="flex items-center gap-2">
                        <Progress value={inspeccion.porcentaje_cumplimiento} className="w-20" />
                        <span className="text-xs">{inspeccion.porcentaje_cumplimiento}%</span>
                      </div>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {inspeccion.resultado_global ? (
                      <Badge variant={getEstadoBadgeVariant(inspeccion.resultado_global)} size="sm">
                        {formatEstado(inspeccion.resultado_global)}
                      </Badge>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                    {inspeccion.numero_hallazgos > 0 ? (
                      <div className="flex items-center gap-1">
                        <span>{inspeccion.numero_hallazgos}</span>
                        {inspeccion.numero_hallazgos_criticos > 0 && (
                          <AlertTriangle className="w-4 h-4 text-danger-600" />
                        )}
                      </div>
                    ) : (
                      '-'
                    )}
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

// ==================== ENTREGAS EPP SECTION ====================

const EntregasEPPSection = () => {
  // const { data: entregas, isLoading } = useEntregasEPP();
  const isLoading = false;
  const entregas = mockEntregasEPP;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner />
      </div>
    );
  }

  if (!entregas || entregas.length === 0) {
    return (
      <EmptyState
        icon={<HardHat className="w-16 h-16" />}
        title="No hay entregas de EPP registradas"
        description="Comience registrando las entregas de equipos de protección personal"
        action={{
          label: 'Nueva Entrega',
          onClick: () => console.log('Nueva Entrega'),
          icon: <Plus className="w-4 h-4" />,
        }}
      />
    );
  }

  const stats = {
    total: entregas.length,
    enUso: entregas.filter((e) => e.estado === 'EN_USO').length,
    porVencer: entregas.filter((e) => {
      const diasRestantes = Math.floor(
        (new Date(e.fecha_reposicion_programada).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      );
      return diasRestantes <= 30 && diasRestantes > 0;
    }).length,
    conCapacitacion: entregas.filter((e) => e.capacitacion_realizada).length,
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Entregas</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.total}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
              <HardHat className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Este mes</p>
        </Card>

        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">En Uso</p>
              <p className="text-2xl font-bold text-success-600 dark:text-success-400 mt-1">{stats.enUso}</p>
            </div>
            <div className="w-12 h-12 bg-success-100 dark:bg-success-900/30 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-success-600 dark:text-success-400" />
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">EPP activos</p>
        </Card>

        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Por Vencer</p>
              <p className="text-2xl font-bold text-warning-600 dark:text-warning-400 mt-1">{stats.porVencer}</p>
            </div>
            <div className="w-12 h-12 bg-warning-100 dark:bg-warning-900/30 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-warning-600 dark:text-warning-400" />
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Próximos 30 días</p>
        </Card>

        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Con Capacitación</p>
              <p className="text-2xl font-bold text-primary-600 dark:text-primary-400 mt-1">{stats.conCapacitacion}</p>
            </div>
            <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
              <User className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Capacitación realizada</p>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Entregas de EPP</h3>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" leftIcon={<Filter className="w-4 h-4" />}>
            Filtros
          </Button>
          <Button variant="outline" size="sm" leftIcon={<Download className="w-4 h-4" />}>
            Exportar
          </Button>
          <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
            Nueva Entrega
          </Button>
        </div>
      </div>

      {/* Entregas Table */}
      <Card variant="bordered" padding="none">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Número
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Colaborador
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  EPP
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Categoría
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Marca/Modelo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Talla
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Fecha Entrega
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Reposición
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {entregas.map((entrega) => (
                <tr key={entrega.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {entrega.numero_entrega}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                    <p className="font-medium">{entrega.colaborador.full_name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{entrega.colaborador.username}</p>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                    <p className="font-medium">{entrega.tipo_epp.nombre}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Cant: {entrega.cantidad}</p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                    <Badge variant="info" size="sm">
                      {formatCategoria(entrega.tipo_epp.categoria)}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                    <p>{entrega.marca}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{entrega.modelo}</p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                    {entrega.talla}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                    {format(new Date(entrega.fecha_entrega), 'dd/MM/yyyy', { locale: es })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                    {format(new Date(entrega.fecha_reposicion_programada), 'dd/MM/yyyy', { locale: es })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant={getEstadoBadgeVariant(entrega.estado)} size="sm">
                      {formatEstado(entrega.estado)}
                    </Badge>
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

// ==================== PROGRAMAS DE SEGURIDAD SECTION ====================

const ProgramasSeguridadSection = () => {
  // const { data: programas, isLoading } = useProgramasSeguridad();
  const isLoading = false;
  const programas = mockProgramasSeguridad;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner />
      </div>
    );
  }

  if (!programas || programas.length === 0) {
    return (
      <EmptyState
        icon={<Shield className="w-16 h-16" />}
        title="No hay programas de seguridad registrados"
        description="Comience creando programas de seguridad para gestionar las actividades de SST"
        action={{
          label: 'Nuevo Programa',
          onClick: () => console.log('Nuevo Programa'),
          icon: <Plus className="w-4 h-4" />,
        }}
      />
    );
  }

  const stats = {
    total: programas.length,
    enEjecucion: programas.filter((p) => p.estado === 'EN_EJECUCION').length,
    planificados: programas.filter((p) => p.estado === 'PLANIFICADO').length,
    promedioAvance: Math.round(
      programas.reduce((acc, p) => acc + p.porcentaje_avance, 0) / programas.length
    ),
  };

  const presupuestoTotal = programas.reduce((acc, p) => acc + (p.presupuesto_asignado || 0), 0);
  const presupuestoEjecutado = programas.reduce((acc, p) => acc + p.presupuesto_ejecutado, 0);

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Programas</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.total}</p>
            </div>
            <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center">
              <Shield className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Activos en el sistema</p>
        </Card>

        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">En Ejecución</p>
              <p className="text-2xl font-bold text-primary-600 dark:text-primary-400 mt-1">{stats.enEjecucion}</p>
            </div>
            <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
              <Activity className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">En desarrollo actualmente</p>
        </Card>

        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Avance Promedio</p>
              <p className="text-2xl font-bold text-success-600 dark:text-success-400 mt-1">{stats.promedioAvance}%</p>
            </div>
            <div className="w-12 h-12 bg-success-100 dark:bg-success-900/30 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-success-600 dark:text-success-400" />
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Progreso general</p>
        </Card>

        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Ejecución Presupuestal</p>
              <p className="text-2xl font-bold text-warning-600 dark:text-warning-400 mt-1">
                {Math.round((presupuestoEjecutado / presupuestoTotal) * 100)}%
              </p>
            </div>
            <div className="w-12 h-12 bg-warning-100 dark:bg-warning-900/30 rounded-lg flex items-center justify-center">
              <Activity className="w-6 h-6 text-warning-600 dark:text-warning-400" />
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            ${(presupuestoEjecutado / 1000000).toFixed(1)}M de ${(presupuestoTotal / 1000000).toFixed(1)}M
          </p>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Programas de Seguridad</h3>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" leftIcon={<Filter className="w-4 h-4" />}>
            Filtros
          </Button>
          <Button variant="outline" size="sm" leftIcon={<Download className="w-4 h-4" />}>
            Exportar
          </Button>
          <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
            Nuevo Programa
          </Button>
        </div>
      </div>

      {/* Programas Grid */}
      <div className="grid grid-cols-1 gap-6">
        {programas.map((programa) => (
          <Card key={programa.id} variant="bordered" padding="md">
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-semibold text-gray-900 dark:text-white">{programa.codigo}</h4>
                    <Badge variant={getEstadoBadgeVariant(programa.estado)} size="sm">
                      {formatEstado(programa.estado)}
                    </Badge>
                    <Badge variant="info" size="sm">
                      {formatTipo(programa.tipo_programa)}
                    </Badge>
                  </div>
                  <p className="text-base font-medium text-gray-900 dark:text-white">{programa.nombre}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{programa.descripcion}</p>
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Responsable</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">
                    {programa.responsable.full_name}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Fecha Inicio</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">
                    {format(new Date(programa.fecha_inicio), 'dd/MM/yyyy', { locale: es })}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Fecha Fin</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">
                    {format(new Date(programa.fecha_fin), 'dd/MM/yyyy', { locale: es })}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Presupuesto</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">
                    ${(programa.presupuesto_asignado / 1000000).toFixed(1)}M
                  </p>
                </div>
              </div>

              {/* Progress */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Avance del Programa</span>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {programa.porcentaje_avance}%
                  </span>
                </div>
                <Progress value={programa.porcentaje_avance} showLabel={false} />
              </div>

              {/* Budget Progress */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Ejecución Presupuestal</span>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    ${(programa.presupuesto_ejecutado / 1000000).toFixed(1)}M / $
                    {(programa.presupuesto_asignado / 1000000).toFixed(1)}M
                  </span>
                </div>
                <Progress
                  value={programa.presupuesto_ejecutado}
                  max={programa.presupuesto_asignado}
                  showLabel={false}
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                <Button variant="ghost" size="sm" leftIcon={<Eye className="w-4 h-4" />}>
                  Ver Detalle
                </Button>
                <Button variant="ghost" size="sm" leftIcon={<Edit className="w-4 h-4" />}>
                  Editar
                </Button>
                <Button variant="ghost" size="sm" leftIcon={<Activity className="w-4 h-4" />}>
                  Actividades
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

// ==================== MAIN PAGE COMPONENT ====================

export default function SeguridadIndustrialPage() {
  const [activeTab, setActiveTab] = useState('permisos-trabajo');

  const tabs = [
    {
      id: 'permisos-trabajo',
      label: 'Permisos de Trabajo',
      icon: <FileText className="w-4 h-4" />,
    },
    {
      id: 'inspecciones',
      label: 'Inspecciones',
      icon: <ClipboardCheck className="w-4 h-4" />,
    },
    {
      id: 'entregas-epp',
      label: 'Entregas EPP',
      icon: <HardHat className="w-4 h-4" />,
    },
    {
      id: 'programas-seguridad',
      label: 'Programas de Seguridad',
      icon: <Shield className="w-4 h-4" />,
    },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Gestión de Seguridad Industrial"
        description="Control integral de permisos de trabajo, inspecciones de seguridad, entregas de EPP y programas de seguridad"
      />

      {/* Tabs */}
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} variant="pills" />

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'permisos-trabajo' && <PermisosTrabajoSection />}
        {activeTab === 'inspecciones' && <InspeccionesSection />}
        {activeTab === 'entregas-epp' && <EntregasEPPSection />}
        {activeTab === 'programas-seguridad' && <ProgramasSeguridadSection />}
      </div>
    </div>
  );
}
