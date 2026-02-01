/**
 * Página: Gestión de Accidentalidad HSEQ
 *
 * Sistema completo de gestión de accidentalidad con 4 subsecciones:
 * - Accidentes de Trabajo
 * - Enfermedades Laborales
 * - Incidentes
 * - Investigaciones
 */
import { useState } from 'react';
import {
  AlertTriangle,
  Stethoscope,
  AlertOctagon,
  Search,
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
  CheckCircle,
  AlertCircle,
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
//   useAccidentesTrabajo,
//   useEnfermedadesLaborales,
//   useIncidentes,
//   useInvestigaciones,
// } from '../hooks/useAccidentalidad';
// import type {
//   AccidenteTrabajo,
//   EnfermedadLaboral,
//   IncidenteTrabajo,
//   InvestigacionATEL,
// } from '../types/accidentalidad.types';

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
    COMPLETADA: 'success',
    CERRADA: 'success',
    VERIFICADO: 'success',
    VERIFICADA: 'success',
    CALIFICADA_LABORAL: 'success',
    DIVULGADA: 'success',
    EN_REVISION: 'primary',
    EN_DESARROLLO: 'primary',
    EN_PROGRESO: 'primary',
    EN_EJECUCION: 'primary',
    EN_PROCESO: 'primary',
    INICIADA: 'warning',
    PENDIENTE: 'warning',
    PLANIFICADO: 'warning',
    EN_ESTUDIO: 'warning',
    CANCELADO: 'danger',
    CANCELADA: 'danger',
    CALIFICADA_COMUN: 'info',
    APELADA: 'info',
  };
  return estadoMap[estado] || 'gray';
};

const getGravedadBadgeVariant = (gravedad: string): 'danger' | 'warning' | 'info' | 'success' => {
  const gravedadMap: Record<string, 'danger' | 'warning' | 'info' | 'success'> = {
    MORTAL: 'danger',
    GRAVE: 'danger',
    CRITICO: 'danger',
    ALTO: 'danger',
    MODERADO: 'warning',
    MEDIO: 'warning',
    LEVE: 'info',
    BAJO: 'success',
  };
  return gravedadMap[gravedad] || 'info';
};

const formatEstado = (estado: string): string => {
  return estado.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase());
};

const formatTipo = (tipo: string): string => {
  const tipoMap: Record<string, string> = {
    CAIDA_MISMO_NIVEL: 'Caída Mismo Nivel',
    CAIDA_DIFERENTE_NIVEL: 'Caída Diferente Nivel',
    GOLPE_OBJETO: 'Golpe con/por Objeto',
    ATRAPAMIENTO: 'Atrapamiento',
    CORTE: 'Corte',
    QUEMADURA: 'Quemadura',
    CONTACTO_ELECTRICO: 'Contacto Eléctrico',
    SOBREESFUERZO: 'Sobreesfuerzo',
    EXPOSICION_SUSTANCIA: 'Exposición a Sustancia',
    ACCIDENTE_TRANSITO: 'Accidente de Tránsito',
    MUSCULOESQUELETICA: 'Musculoesquelética',
    RESPIRATORIA: 'Respiratoria',
    DERMATOLOGICA: 'Dermatológica',
    AUDITIVA: 'Auditiva',
    MENTAL: 'Mental',
    CARDIOVASCULAR: 'Cardiovascular',
    CANCER_OCUPACIONAL: 'Cáncer Ocupacional',
    INTOXICACION: 'Intoxicación',
    CASI_ACCIDENTE: 'Casi Accidente',
    CONDICION_INSEGURA: 'Condición Insegura',
    ACTO_INSEGURO: 'Acto Inseguro',
    EMERGENCIA_CONTROLADA: 'Emergencia Controlada',
    ARBOL_CAUSAS: 'Árbol de Causas',
    CINCO_PORQUES: '5 Porqués',
    ISHIKAWA: 'Ishikawa (Espina de Pescado)',
    TAPROOT: 'TapRooT',
  };
  return tipoMap[tipo] || formatEstado(tipo);
};

// ==================== MOCK DATA ====================

const mockAccidentesTrabajo = [
  {
    id: 1,
    codigo_at: 'AT-2024-001',
    fecha_evento: '2024-01-15',
    trabajador_nombre: 'Carlos Ramírez',
    cargo_trabajador: 'Operario de Producción',
    tipo_evento: 'CAIDA_MISMO_NIVEL',
    gravedad: 'MODERADO',
    tipo_lesion: 'ESGUINCE',
    parte_cuerpo: 'TOBILLO_DERECHO',
    dias_incapacidad: 5,
    mortal: false,
    reportado_arl: true,
    requiere_investigacion: true,
  },
  {
    id: 2,
    codigo_at: 'AT-2024-002',
    fecha_evento: '2024-01-18',
    trabajador_nombre: 'Ana Martínez',
    cargo_trabajador: 'Auxiliar de Despacho',
    tipo_evento: 'GOLPE_OBJETO',
    gravedad: 'LEVE',
    tipo_lesion: 'CONTUSION',
    parte_cuerpo: 'MANO_IZQUIERDA',
    dias_incapacidad: 2,
    mortal: false,
    reportado_arl: true,
    requiere_investigacion: false,
  },
  {
    id: 3,
    codigo_at: 'AT-2024-003',
    fecha_evento: '2024-01-20',
    trabajador_nombre: 'Pedro López',
    cargo_trabajador: 'Conductor',
    tipo_evento: 'ACCIDENTE_TRANSITO',
    gravedad: 'GRAVE',
    tipo_lesion: 'FRACTURA',
    parte_cuerpo: 'PIERNA_DERECHA',
    dias_incapacidad: 45,
    mortal: false,
    reportado_arl: true,
    requiere_investigacion: true,
  },
];

const mockEnfermedadesLaborales = [
  {
    id: 1,
    codigo_el: 'EL-2024-001',
    fecha_diagnostico: '2024-01-10',
    trabajador_nombre: 'María González',
    cargo_trabajador: 'Empacadora',
    tipo_enfermedad: 'MUSCULOESQUELETICA',
    diagnostico_descripcion: 'Síndrome del túnel carpiano bilateral',
    factor_riesgo: 'Movimientos repetitivos',
    estado_calificacion: 'CALIFICADA_LABORAL',
    porcentaje_pcl: 15,
    reportado_arl: true,
    requiere_investigacion: true,
  },
  {
    id: 2,
    codigo_el: 'EL-2024-002',
    fecha_diagnostico: '2024-01-12',
    trabajador_nombre: 'José Rodríguez',
    cargo_trabajador: 'Operario de Horno',
    tipo_enfermedad: 'RESPIRATORIA',
    diagnostico_descripcion: 'Bronquitis crónica ocupacional',
    factor_riesgo: 'Exposición a vapores y humos',
    estado_calificacion: 'EN_ESTUDIO',
    porcentaje_pcl: null,
    reportado_arl: true,
    requiere_investigacion: true,
  },
  {
    id: 3,
    codigo_el: 'EL-2024-003',
    fecha_diagnostico: '2024-01-15',
    trabajador_nombre: 'Laura Sánchez',
    cargo_trabajador: 'Auxiliar de Mantenimiento',
    tipo_enfermedad: 'DERMATOLOGICA',
    diagnostico_descripcion: 'Dermatitis de contacto',
    factor_riesgo: 'Contacto con químicos de limpieza',
    estado_calificacion: 'CALIFICADA_LABORAL',
    porcentaje_pcl: 8,
    reportado_arl: true,
    requiere_investigacion: false,
  },
];

const mockIncidentes = [
  {
    id: 1,
    codigo_incidente: 'INC-2024-001',
    fecha_evento: '2024-01-14',
    tipo_incidente: 'CASI_ACCIDENTE',
    descripcion_evento: 'Operario estuvo a punto de caer desde plataforma elevada',
    potencial_gravedad: 'ALTO',
    reportado_por_nombre: 'Supervisor Juan Pérez',
    hubo_danos_materiales: false,
    requiere_investigacion: true,
  },
  {
    id: 2,
    codigo_incidente: 'INC-2024-002',
    fecha_evento: '2024-01-16',
    tipo_incidente: 'CONDICION_INSEGURA',
    descripcion_evento: 'Escalera con peldaño suelto identificada en área de producción',
    potencial_gravedad: 'MEDIO',
    reportado_por_nombre: 'Operario Carlos Gómez',
    hubo_danos_materiales: false,
    requiere_investigacion: false,
  },
  {
    id: 3,
    codigo_incidente: 'INC-2024-003',
    fecha_evento: '2024-01-19',
    tipo_incidente: 'ACTO_INSEGURO',
    descripcion_evento: 'Trabajador operando montacargas sin cinturón de seguridad',
    potencial_gravedad: 'ALTO',
    reportado_por_nombre: 'Supervisor Ana Torres',
    hubo_danos_materiales: false,
    requiere_investigacion: true,
  },
];

const mockInvestigaciones = [
  {
    id: 1,
    codigo_investigacion: 'INV-2024-001',
    evento_codigo: 'AT-2024-001',
    evento_tipo: 'ACCIDENTE_TRABAJO',
    metodologia: 'ARBOL_CAUSAS',
    lider_investigacion_nombre: 'Coordinador SST',
    fecha_inicio: '2024-01-16',
    fecha_limite: '2024-01-31',
    estado: 'EN_DESARROLLO',
    aprobada: false,
    total_causas: 3,
  },
  {
    id: 2,
    codigo_investigacion: 'INV-2024-002',
    evento_codigo: 'INC-2024-001',
    evento_tipo: 'INCIDENTE',
    metodologia: 'CINCO_PORQUES',
    lider_investigacion_nombre: 'Coordinador SST',
    fecha_inicio: '2024-01-15',
    fecha_limite: '2024-01-25',
    estado: 'COMPLETADA',
    aprobada: true,
    total_causas: 5,
  },
  {
    id: 3,
    codigo_investigacion: 'INV-2024-003',
    evento_codigo: 'EL-2024-001',
    evento_tipo: 'ENFERMEDAD_LABORAL',
    metodologia: 'ISHIKAWA',
    lider_investigacion_nombre: 'Médico Laboral',
    fecha_inicio: '2024-01-11',
    fecha_limite: '2024-02-10',
    estado: 'EN_REVISION',
    aprobada: false,
    total_causas: 4,
  },
];

// ==================== ACCIDENTES DE TRABAJO SECTION ====================

const AccidentesTrabajoSection = () => {
  // const { data: accidentes, isLoading } = useAccidentesTrabajo();
  const isLoading = false;
  const accidentes = mockAccidentesTrabajo;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner />
      </div>
    );
  }

  if (!accidentes || accidentes.length === 0) {
    return (
      <EmptyState
        icon={<AlertTriangle className="w-16 h-16" />}
        title="No hay accidentes de trabajo registrados"
        description="Comience registrando los accidentes de trabajo para su análisis e investigación"
        action={{
          label: 'Nuevo Accidente',
          onClick: () => console.log('Nuevo AT'),
          icon: <Plus className="w-4 h-4" />,
        }}
      />
    );
  }

  const stats = {
    total: accidentes.length,
    graves: accidentes.filter((at) => at.gravedad === 'GRAVE' || at.gravedad === 'MORTAL').length,
    conIncapacidad: accidentes.filter((at) => at.dias_incapacidad > 0).length,
    diasIncapacidadTotal: accidentes.reduce((sum, at) => sum + (at.dias_incapacidad || 0), 0),
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Accidentes</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.total}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Este año</p>
        </Card>

        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Graves/Mortales</p>
              <p className="text-2xl font-bold text-danger-600 dark:text-danger-400 mt-1">{stats.graves}</p>
            </div>
            <div className="w-12 h-12 bg-danger-100 dark:bg-danger-900/30 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-danger-600 dark:text-danger-400" />
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Requieren investigación</p>
        </Card>

        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Con Incapacidad</p>
              <p className="text-2xl font-bold text-warning-600 dark:text-warning-400 mt-1">
                {stats.conIncapacidad}
              </p>
            </div>
            <div className="w-12 h-12 bg-warning-100 dark:bg-warning-900/30 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-warning-600 dark:text-warning-400" />
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Generaron ausencias</p>
        </Card>

        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Días Incapacidad</p>
              <p className="text-2xl font-bold text-primary-600 dark:text-primary-400 mt-1">
                {stats.diasIncapacidadTotal}
              </p>
            </div>
            <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Total acumulado</p>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Accidentes de Trabajo Registrados</h3>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" leftIcon={<Filter className="w-4 h-4" />}>
            Filtros
          </Button>
          <Button variant="outline" size="sm" leftIcon={<Download className="w-4 h-4" />}>
            Exportar
          </Button>
          <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
            Nuevo Accidente
          </Button>
        </div>
      </div>

      {/* Accidentes Table */}
      <Card variant="bordered" padding="none">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Código
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Trabajador
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Tipo Evento
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Gravedad
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Días Inc.
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Parte Cuerpo
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {accidentes.map((accidente) => (
                <tr key={accidente.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {accidente.codigo_at}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                    {format(new Date(accidente.fecha_evento), 'dd/MM/yyyy', { locale: es })}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                    <div>
                      <p className="font-medium">{accidente.trabajador_nombre}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{accidente.cargo_trabajador}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                    {formatTipo(accidente.tipo_evento)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant={getGravedadBadgeVariant(accidente.gravedad)} size="sm">
                      {formatEstado(accidente.gravedad)}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                    {accidente.dias_incapacidad}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                    {formatEstado(accidente.parte_cuerpo)}
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

// ==================== ENFERMEDADES LABORALES SECTION ====================

const EnfermedadesLaboralesSection = () => {
  // const { data: enfermedades, isLoading } = useEnfermedadesLaborales();
  const isLoading = false;
  const enfermedades = mockEnfermedadesLaborales;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner />
      </div>
    );
  }

  if (!enfermedades || enfermedades.length === 0) {
    return (
      <EmptyState
        icon={<Stethoscope className="w-16 h-16" />}
        title="No hay enfermedades laborales registradas"
        description="Comience registrando las enfermedades laborales diagnosticadas"
        action={{
          label: 'Nueva Enfermedad Laboral',
          onClick: () => console.log('Nueva EL'),
          icon: <Plus className="w-4 h-4" />,
        }}
      />
    );
  }

  const stats = {
    total: enfermedades.length,
    calificadasLaborales: enfermedades.filter((el) => el.estado_calificacion === 'CALIFICADA_LABORAL').length,
    enEstudio: enfermedades.filter((el) => el.estado_calificacion === 'EN_ESTUDIO').length,
    pclPromedio:
      enfermedades
        .filter((el) => el.porcentaje_pcl)
        .reduce((sum, el) => sum + (el.porcentaje_pcl || 0), 0) /
      (enfermedades.filter((el) => el.porcentaje_pcl).length || 1),
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total EL</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.total}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <Stethoscope className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Enfermedades registradas</p>
        </Card>

        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Calificadas Laborales</p>
              <p className="text-2xl font-bold text-success-600 dark:text-success-400 mt-1">
                {stats.calificadasLaborales}
              </p>
            </div>
            <div className="w-12 h-12 bg-success-100 dark:bg-success-900/30 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-success-600 dark:text-success-400" />
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Confirmadas como laborales</p>
        </Card>

        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">En Estudio</p>
              <p className="text-2xl font-bold text-warning-600 dark:text-warning-400 mt-1">{stats.enEstudio}</p>
            </div>
            <div className="w-12 h-12 bg-warning-100 dark:bg-warning-900/30 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-warning-600 dark:text-warning-400" />
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Pendientes de calificación</p>
        </Card>

        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">PCL Promedio</p>
              <p className="text-2xl font-bold text-primary-600 dark:text-primary-400 mt-1">
                {stats.pclPromedio.toFixed(1)}%
              </p>
            </div>
            <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Pérdida capacidad laboral</p>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Enfermedades Laborales Registradas</h3>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" leftIcon={<Filter className="w-4 h-4" />}>
            Filtros
          </Button>
          <Button variant="outline" size="sm" leftIcon={<Download className="w-4 h-4" />}>
            Exportar
          </Button>
          <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
            Nueva Enfermedad Laboral
          </Button>
        </div>
      </div>

      {/* Enfermedades Grid */}
      <div className="grid grid-cols-1 gap-6">
        {enfermedades.map((enfermedad) => (
          <Card key={enfermedad.id} variant="bordered" padding="md">
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-semibold text-gray-900 dark:text-white">{enfermedad.codigo_el}</h4>
                    <Badge variant={getEstadoBadgeVariant(enfermedad.estado_calificacion)} size="sm">
                      {formatEstado(enfermedad.estado_calificacion)}
                    </Badge>
                    <Badge variant="info" size="sm">
                      {formatTipo(enfermedad.tipo_enfermedad)}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">{enfermedad.diagnostico_descripcion}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    Factor de Riesgo: {enfermedad.factor_riesgo}
                  </p>
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Trabajador</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">
                    {enfermedad.trabajador_nombre}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{enfermedad.cargo_trabajador}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Fecha Diagnóstico</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">
                    {format(new Date(enfermedad.fecha_diagnostico), 'dd/MM/yyyy', { locale: es })}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">PCL</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">
                    {enfermedad.porcentaje_pcl ? `${enfermedad.porcentaje_pcl}%` : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Reportado ARL</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">
                    {enfermedad.reportado_arl ? 'Sí' : 'No'}
                  </p>
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
                  Documentos
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

// ==================== INCIDENTES SECTION ====================

const IncidentesSection = () => {
  // const { data: incidentes, isLoading } = useIncidentes();
  const isLoading = false;
  const incidentes = mockIncidentes;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner />
      </div>
    );
  }

  if (!incidentes || incidentes.length === 0) {
    return (
      <EmptyState
        icon={<AlertOctagon className="w-16 h-16" />}
        title="No hay incidentes registrados"
        description="Comience registrando los incidentes y casi accidentes para análisis preventivo"
        action={{
          label: 'Nuevo Incidente',
          onClick: () => console.log('Nuevo Incidente'),
          icon: <Plus className="w-4 h-4" />,
        }}
      />
    );
  }

  const stats = {
    total: incidentes.length,
    casiAccidentes: incidentes.filter((inc) => inc.tipo_incidente === 'CASI_ACCIDENTE').length,
    condicionesInseguras: incidentes.filter((inc) => inc.tipo_incidente === 'CONDICION_INSEGURA').length,
    potencialAlto: incidentes.filter(
      (inc) => inc.potencial_gravedad === 'ALTO' || inc.potencial_gravedad === 'CRITICO'
    ).length,
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Incidentes</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.total}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
              <AlertOctagon className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Últimos 30 días</p>
        </Card>

        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Casi Accidentes</p>
              <p className="text-2xl font-bold text-warning-600 dark:text-warning-400 mt-1">
                {stats.casiAccidentes}
              </p>
            </div>
            <div className="w-12 h-12 bg-warning-100 dark:bg-warning-900/30 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-warning-600 dark:text-warning-400" />
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Oportunidades de mejora</p>
        </Card>

        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Condiciones Inseguras</p>
              <p className="text-2xl font-bold text-primary-600 dark:text-primary-400 mt-1">
                {stats.condicionesInseguras}
              </p>
            </div>
            <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
              <XCircle className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Requieren corrección</p>
        </Card>

        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Potencial Alto</p>
              <p className="text-2xl font-bold text-danger-600 dark:text-danger-400 mt-1">{stats.potencialAlto}</p>
            </div>
            <div className="w-12 h-12 bg-danger-100 dark:bg-danger-900/30 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-danger-600 dark:text-danger-400" />
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Alta prioridad</p>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Incidentes Registrados</h3>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" leftIcon={<Filter className="w-4 h-4" />}>
            Filtros
          </Button>
          <Button variant="outline" size="sm" leftIcon={<Download className="w-4 h-4" />}>
            Exportar
          </Button>
          <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
            Nuevo Incidente
          </Button>
        </div>
      </div>

      {/* Incidentes Grid */}
      <div className="grid grid-cols-1 gap-6">
        {incidentes.map((incidente) => (
          <Card key={incidente.id} variant="bordered" padding="md">
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-semibold text-gray-900 dark:text-white">{incidente.codigo_incidente}</h4>
                    <Badge variant={getGravedadBadgeVariant(incidente.potencial_gravedad)} size="sm">
                      Potencial {formatEstado(incidente.potencial_gravedad)}
                    </Badge>
                    <Badge variant="info" size="sm">
                      {formatTipo(incidente.tipo_incidente)}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">{incidente.descripcion_evento}</p>
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Fecha Evento</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">
                    {format(new Date(incidente.fecha_evento), 'dd/MM/yyyy', { locale: es })}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Reportado Por</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">
                    {incidente.reportado_por_nombre}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Requiere Investigación</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">
                    {incidente.requiere_investigacion ? 'Sí' : 'No'}
                  </p>
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
                {incidente.requiere_investigacion && (
                  <Button variant="ghost" size="sm" leftIcon={<Search className="w-4 h-4" />}>
                    Investigar
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

// ==================== INVESTIGACIONES SECTION ====================

const InvestigacionesSection = () => {
  // const { data: investigaciones, isLoading } = useInvestigaciones();
  const isLoading = false;
  const investigaciones = mockInvestigaciones;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner />
      </div>
    );
  }

  if (!investigaciones || investigaciones.length === 0) {
    return (
      <EmptyState
        icon={<Search className="w-16 h-16" />}
        title="No hay investigaciones registradas"
        description="Comience creando investigaciones para analizar las causas de accidentes e incidentes"
        action={{
          label: 'Nueva Investigación',
          onClick: () => console.log('Nueva Investigación'),
          icon: <Plus className="w-4 h-4" />,
        }}
      />
    );
  }

  const stats = {
    total: investigaciones.length,
    enDesarrollo: investigaciones.filter((inv) => inv.estado === 'EN_DESARROLLO').length,
    completadas: investigaciones.filter((inv) => inv.estado === 'COMPLETADA').length,
    aprobadas: investigaciones.filter((inv) => inv.aprobada).length,
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Investigaciones</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.total}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
              <Search className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Este año</p>
        </Card>

        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">En Desarrollo</p>
              <p className="text-2xl font-bold text-warning-600 dark:text-warning-400 mt-1">
                {stats.enDesarrollo}
              </p>
            </div>
            <div className="w-12 h-12 bg-warning-100 dark:bg-warning-900/30 rounded-lg flex items-center justify-center">
              <Activity className="w-6 h-6 text-warning-600 dark:text-warning-400" />
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">En proceso</p>
        </Card>

        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Completadas</p>
              <p className="text-2xl font-bold text-primary-600 dark:text-primary-400 mt-1">{stats.completadas}</p>
            </div>
            <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Finalizadas</p>
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
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Validadas</p>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Investigaciones ATEL</h3>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" leftIcon={<Filter className="w-4 h-4" />}>
            Filtros
          </Button>
          <Button variant="outline" size="sm" leftIcon={<Download className="w-4 h-4" />}>
            Exportar
          </Button>
          <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
            Nueva Investigación
          </Button>
        </div>
      </div>

      {/* Investigaciones Table */}
      <Card variant="bordered" padding="none">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Código
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Evento
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Metodología
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Líder
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Fecha Límite
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Causas
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {investigaciones.map((investigacion) => (
                <tr key={investigacion.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {investigacion.codigo_investigacion}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                    <div>
                      <p className="font-medium">{investigacion.evento_codigo}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {formatEstado(investigacion.evento_tipo || '')}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                    {formatTipo(investigacion.metodologia)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                    {investigacion.lider_investigacion_nombre}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant={getEstadoBadgeVariant(investigacion.estado)} size="sm">
                      {formatEstado(investigacion.estado)}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                    {format(new Date(investigacion.fecha_limite), 'dd/MM/yyyy', { locale: es })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                    {investigacion.total_causas || 0}
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

export default function AccidentalidadPage() {
  const [activeTab, setActiveTab] = useState('accidentes-trabajo');

  const tabs = [
    {
      id: 'accidentes-trabajo',
      label: 'Accidentes de Trabajo',
      icon: <AlertTriangle className="w-4 h-4" />,
    },
    {
      id: 'enfermedades-laborales',
      label: 'Enfermedades Laborales',
      icon: <Stethoscope className="w-4 h-4" />,
    },
    {
      id: 'incidentes',
      label: 'Incidentes',
      icon: <AlertOctagon className="w-4 h-4" />,
    },
    {
      id: 'investigaciones',
      label: 'Investigaciones',
      icon: <Search className="w-4 h-4" />,
    },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Gestión de Accidentalidad"
        description="Control integral de accidentes de trabajo, enfermedades laborales, incidentes e investigaciones ATEL"
      />

      {/* Tabs */}
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} variant="pills" />

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'accidentes-trabajo' && <AccidentesTrabajoSection />}
        {activeTab === 'enfermedades-laborales' && <EnfermedadesLaboralesSection />}
        {activeTab === 'incidentes' && <IncidentesSection />}
        {activeTab === 'investigaciones' && <InvestigacionesSection />}
      </div>
    </div>
  );
}
