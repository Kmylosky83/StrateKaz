/**
 * Página: Gestión de Emergencias HSEQ
 *
 * Sistema completo de gestión de emergencias con 6 subsecciones:
 * - Análisis de Vulnerabilidad
 * - Planes de Emergencia
 * - Planos de Evacuación
 * - Brigadas y Brigadistas
 * - Simulacros
 * - Recursos de Emergencia
 */
import { useState } from 'react';
import {
  Shield,
  FileText,
  Map,
  Users,
  Calendar,
  Package,
  Plus,
  Download,
  Filter,
  Eye,
  Edit,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Clock,
  Activity,
  XCircle,
  MapPin,
  Phone,
  User,
  Flame,
  Heart,
  Radio,
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

import type {
  AnalisisVulnerabilidadList,
  PlanEmergenciaList,
  PlanoEvacuacion,
  BrigadaList,
  SimulacroList,
  RecursoEmergenciaList,
  NivelVulnerabilidad,
  EstadoAnalisisVulnerabilidad,
  EstadoPlanEmergencia,
  EstadoBrigada,
  EstadoSimulacro,
  EstadoRecursoEmergencia,
  TipoRecursoEmergencia,
} from '../types/emergencias.types';

// ==================== UTILITY FUNCTIONS ====================

const getNivelVulnerabilidadVariant = (
  nivel: NivelVulnerabilidad
): 'success' | 'warning' | 'danger' | 'info' => {
  const map: Record<NivelVulnerabilidad, 'success' | 'warning' | 'danger' | 'info'> = {
    BAJO: 'success',
    MEDIO: 'warning',
    ALTO: 'danger',
    CRITICO: 'danger',
  };
  return map[nivel] || 'info';
};

const getEstadoAnalisisVariant = (
  estado: EstadoAnalisisVulnerabilidad
): 'success' | 'primary' | 'warning' | 'gray' => {
  const map: Record<EstadoAnalisisVulnerabilidad, 'success' | 'primary' | 'warning' | 'gray'> = {
    BORRADOR: 'gray',
    EN_REVISION: 'warning',
    APROBADO: 'success',
    ACTUALIZADO: 'primary',
  };
  return map[estado] || 'gray';
};

const getEstadoPlanVariant = (
  estado: EstadoPlanEmergencia
): 'success' | 'primary' | 'warning' | 'danger' | 'gray' => {
  const map: Record<EstadoPlanEmergencia, 'success' | 'primary' | 'warning' | 'danger' | 'gray'> = {
    BORRADOR: 'gray',
    EN_REVISION: 'warning',
    APROBADO: 'primary',
    VIGENTE: 'success',
    DESACTUALIZADO: 'danger',
  };
  return map[estado] || 'gray';
};

const getEstadoBrigadaVariant = (
  estado: EstadoBrigada
): 'success' | 'primary' | 'warning' | 'danger' => {
  const map: Record<EstadoBrigada, 'success' | 'primary' | 'warning' | 'danger'> = {
    ACTIVA: 'success',
    EN_FORMACION: 'warning',
    INACTIVA: 'danger',
    DISUELTA: 'danger',
  };
  return map[estado] || 'warning';
};

const getEstadoSimulacroVariant = (
  estado: EstadoSimulacro
): 'success' | 'primary' | 'warning' | 'danger' | 'info' | 'gray' => {
  const map: Record<EstadoSimulacro, 'success' | 'primary' | 'warning' | 'danger' | 'info' | 'gray'> = {
    PROGRAMADO: 'info',
    CONFIRMADO: 'primary',
    REALIZADO: 'success',
    EVALUADO: 'success',
    CANCELADO: 'danger',
    POSPUESTO: 'warning',
  };
  return map[estado] || 'gray';
};

const getEstadoRecursoVariant = (
  estado: EstadoRecursoEmergencia
): 'success' | 'warning' | 'danger' | 'gray' => {
  const map: Record<EstadoRecursoEmergencia, 'success' | 'warning' | 'danger' | 'gray'> = {
    OPERATIVO: 'success',
    EN_MANTENIMIENTO: 'warning',
    FUERA_SERVICIO: 'danger',
    DADO_BAJA: 'gray',
  };
  return map[estado] || 'gray';
};

const getTipoRecursoIcon = (tipo: TipoRecursoEmergencia) => {
  const iconMap: Record<TipoRecursoEmergencia, React.ReactNode> = {
    EXTINTOR: <Flame className="w-4 h-4" />,
    BOTIQUIN: <Heart className="w-4 h-4" />,
    CAMILLA: <Activity className="w-4 h-4" />,
    ALARMA: <Radio className="w-4 h-4" />,
    SEÑALIZACION: <MapPin className="w-4 h-4" />,
    EQUIPO_COMUNICACION: <Phone className="w-4 h-4" />,
    LINTERNA: <Activity className="w-4 h-4" />,
    MEGAFONO: <Radio className="w-4 h-4" />,
    EQUIPO_RESCATE: <Users className="w-4 h-4" />,
    DESFIBRILADOR: <Heart className="w-4 h-4" />,
    OTRO: <Package className="w-4 h-4" />,
  };
  return iconMap[tipo] || <Package className="w-4 h-4" />;
};

const formatEstado = (estado: string): string => {
  return estado.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase());
};

// ==================== MOCK DATA ====================

const mockAnalisis: AnalisisVulnerabilidadList[] = [
  {
    id: 1,
    codigo: 'AV-2024-001',
    nombre: 'Análisis de vulnerabilidad sede principal',
    tipo_amenaza: 'NATURAL',
    fecha_analisis: '2024-01-15',
    nivel_vulnerabilidad: 'MEDIO',
    puntuacion_vulnerabilidad: '65',
    estado: 'APROBADO',
    proxima_revision: '2024-07-15',
    total_amenazas: 8,
    amenazas_criticas: 2,
    creado_en: '2024-01-15',
    actualizado_en: '2024-01-20',
  },
  {
    id: 2,
    codigo: 'AV-2024-002',
    nombre: 'Análisis de vulnerabilidad planta de producción',
    tipo_amenaza: 'TECNOLOGICA',
    fecha_analisis: '2024-02-01',
    nivel_vulnerabilidad: 'ALTO',
    puntuacion_vulnerabilidad: '78',
    estado: 'EN_REVISION',
    proxima_revision: null,
    total_amenazas: 12,
    amenazas_criticas: 5,
    creado_en: '2024-02-01',
    actualizado_en: '2024-02-05',
  },
];

const mockPlanes: PlanEmergenciaList[] = [
  {
    id: 1,
    codigo: 'PE-2024-001',
    nombre: 'Plan de Emergencias Sede Principal',
    version: '2.0',
    fecha_elaboracion: '2024-01-10',
    fecha_vigencia: '2025-01-10',
    fecha_revision: '2024-07-10',
    estado: 'VIGENTE',
    total_procedimientos: 8,
    total_planos: 5,
    total_simulacros: 3,
    creado_en: '2024-01-10',
    actualizado_en: '2024-01-15',
  },
  {
    id: 2,
    codigo: 'PE-2024-002',
    nombre: 'Plan de Emergencias Planta Producción',
    version: '1.0',
    fecha_elaboracion: '2024-02-15',
    fecha_vigencia: '2025-02-15',
    fecha_revision: '2024-08-15',
    estado: 'APROBADO',
    total_procedimientos: 6,
    total_planos: 3,
    total_simulacros: 1,
    creado_en: '2024-02-15',
    actualizado_en: '2024-02-20',
  },
];

const mockPlanos: PlanoEvacuacion[] = [
  {
    id: 1,
    empresa_id: 1,
    plan_emergencia: 1,
    codigo: 'PLN-2024-001',
    nombre: 'Plano Evacuación Piso 1 - Administración',
    version: '1.0',
    edificio: 'Edificio Principal',
    piso: '1',
    area: 'Administración',
    descripcion: 'Plano de evacuación del área administrativa',
    capacidad_personas: 50,
    numero_rutas: 2,
    rutas_detalle: [],
    puntos_encuentro: [],
    punto_encuentro_principal: 'Parqueadero Norte',
    punto_encuentro_alterno: 'Zona Verde Este',
    salidas_emergencia: 3,
    extintores: 4,
    alarmas: 2,
    botiquines: 1,
    archivo_plano: '/planos/piso1.pdf',
    plano_thumbnail: null,
    fecha_elaboracion: '2024-01-15',
    fecha_actualizacion: '2024-01-15',
    fecha_revision_programada: '2024-07-15',
    publicado: true,
    ubicaciones_publicacion: 'Recepción, Sala de reuniones',
    activo: true,
    creado_en: '2024-01-15',
    actualizado_en: '2024-01-15',
    creado_por: 'admin',
  },
  {
    id: 2,
    empresa_id: 1,
    plan_emergencia: 1,
    codigo: 'PLN-2024-002',
    nombre: 'Plano Evacuación Piso 2 - Producción',
    version: '1.0',
    edificio: 'Planta Producción',
    piso: '2',
    area: 'Producción',
    descripcion: 'Plano de evacuación del área de producción',
    capacidad_personas: 80,
    numero_rutas: 3,
    rutas_detalle: [],
    puntos_encuentro: [],
    punto_encuentro_principal: 'Parqueadero Sur',
    punto_encuentro_alterno: 'Cancha deportiva',
    salidas_emergencia: 4,
    extintores: 8,
    alarmas: 4,
    botiquines: 2,
    archivo_plano: '/planos/piso2.pdf',
    plano_thumbnail: null,
    fecha_elaboracion: '2024-01-20',
    fecha_actualizacion: '2024-01-20',
    fecha_revision_programada: '2024-07-20',
    publicado: true,
    ubicaciones_publicacion: 'Entrada producción, Área de máquinas',
    activo: true,
    creado_en: '2024-01-20',
    actualizado_en: '2024-01-20',
    creado_por: 'admin',
  },
];

const mockBrigadas: BrigadaList[] = [
  {
    id: 1,
    codigo: 'BRG-001',
    nombre: 'Brigada de Primeros Auxilios',
    tipo_brigada: 1,
    tipo_brigada_nombre: 'Primeros Auxilios',
    tipo_brigada_color: '#10B981',
    lider_brigada: 'María González',
    estado: 'ACTIVA',
    numero_minimo_brigadistas: 5,
    numero_brigadistas_actuales: 6,
    total_brigadistas: 6,
    brigadistas_activos: 6,
    estado_capacidad: 'OPTIMO',
    fecha_conformacion: '2023-06-15',
    fecha_proxima_capacitacion: '2024-03-15',
    creado_en: '2023-06-15',
    actualizado_en: '2024-01-10',
  },
  {
    id: 2,
    codigo: 'BRG-002',
    nombre: 'Brigada Contra Incendios',
    tipo_brigada: 2,
    tipo_brigada_nombre: 'Contra Incendios',
    tipo_brigada_color: '#EF4444',
    lider_brigada: 'Carlos Rodríguez',
    estado: 'ACTIVA',
    numero_minimo_brigadistas: 6,
    numero_brigadistas_actuales: 5,
    total_brigadistas: 5,
    brigadistas_activos: 5,
    estado_capacidad: 'MINIMO',
    fecha_conformacion: '2023-06-15',
    fecha_proxima_capacitacion: '2024-02-20',
    creado_en: '2023-06-15',
    actualizado_en: '2024-01-10',
  },
  {
    id: 3,
    codigo: 'BRG-003',
    nombre: 'Brigada de Evacuación',
    tipo_brigada: 3,
    tipo_brigada_nombre: 'Evacuación',
    tipo_brigada_color: '#3B82F6',
    lider_brigada: 'Ana Martínez',
    estado: 'EN_FORMACION',
    numero_minimo_brigadistas: 8,
    numero_brigadistas_actuales: 4,
    total_brigadistas: 4,
    brigadistas_activos: 4,
    estado_capacidad: 'INSUFICIENTE',
    fecha_conformacion: '2024-01-01',
    fecha_proxima_capacitacion: '2024-02-15',
    creado_en: '2024-01-01',
    actualizado_en: '2024-01-15',
  },
];

const mockSimulacros: SimulacroList[] = [
  {
    id: 1,
    codigo: 'SIM-2024-001',
    nombre: 'Simulacro de Evacuación General',
    tipo_simulacro: 'EVACUACION',
    tipo_simulacro_display: 'Evacuación',
    plan_emergencia: 1,
    plan_emergencia_nombre: 'Plan de Emergencias Sede Principal',
    alcance: 'TOTAL',
    estado: 'PROGRAMADO',
    fecha_programada: '2024-03-15',
    fecha_realizada: null,
    coordinador: 'Carlos Rodríguez',
    fue_exitoso: false,
    total_brigadas: 3,
    total_evaluaciones: 0,
    dias_hasta_fecha: 45,
    creado_en: '2024-01-20',
    actualizado_en: '2024-01-20',
  },
  {
    id: 2,
    codigo: 'SIM-2024-002',
    nombre: 'Simulacro de Incendio - Área Producción',
    tipo_simulacro: 'INCENDIO',
    tipo_simulacro_display: 'Incendio',
    plan_emergencia: 1,
    plan_emergencia_nombre: 'Plan de Emergencias Sede Principal',
    alcance: 'PARCIAL',
    estado: 'REALIZADO',
    fecha_programada: '2024-01-25',
    fecha_realizada: '2024-01-25',
    coordinador: 'María González',
    fue_exitoso: true,
    total_brigadas: 2,
    total_evaluaciones: 1,
    dias_hasta_fecha: null,
    creado_en: '2024-01-10',
    actualizado_en: '2024-01-26',
  },
];

const mockRecursos: RecursoEmergenciaList[] = [
  {
    id: 1,
    codigo: 'EXT-001',
    tipo_recurso: 'EXTINTOR',
    tipo_recurso_display: 'Extintor',
    nombre: 'Extintor ABC 10 lb',
    area: 'Producción',
    ubicacion_especifica: 'Al lado de la puerta principal',
    estado: 'OPERATIVO',
    estado_display: 'Operativo',
    fecha_proxima_inspeccion: '2024-02-15',
    ultima_inspeccion: {
      fecha: '2024-01-15',
      resultado: 'CONFORME',
      inspector: 'Juan Pérez',
    },
    dias_proxima_inspeccion: 30,
    requiere_inspeccion: false,
    responsable: 'Coordinador SST',
    creado_en: '2023-06-01',
    actualizado_en: '2024-01-15',
  },
  {
    id: 2,
    codigo: 'BOT-001',
    tipo_recurso: 'BOTIQUIN',
    tipo_recurso_display: 'Botiquín',
    nombre: 'Botiquín Tipo A',
    area: 'Administración',
    ubicacion_especifica: 'Recepción',
    estado: 'OPERATIVO',
    estado_display: 'Operativo',
    fecha_proxima_inspeccion: '2024-02-01',
    ultima_inspeccion: {
      fecha: '2024-01-01',
      resultado: 'CONFORME',
      inspector: 'María González',
    },
    dias_proxima_inspeccion: 15,
    requiere_inspeccion: false,
    responsable: 'Enfermera Ocupacional',
    creado_en: '2023-06-01',
    actualizado_en: '2024-01-01',
  },
  {
    id: 3,
    codigo: 'CAM-001',
    tipo_recurso: 'CAMILLA',
    tipo_recurso_display: 'Camilla',
    nombre: 'Camilla Rígida',
    area: 'Enfermería',
    ubicacion_especifica: 'Consultorio médico',
    estado: 'EN_MANTENIMIENTO',
    estado_display: 'En Mantenimiento',
    fecha_proxima_inspeccion: '2024-03-01',
    ultima_inspeccion: {
      fecha: '2024-01-10',
      resultado: 'NO_CONFORME_MENOR',
      inspector: 'Carlos Rodríguez',
    },
    dias_proxima_inspeccion: 45,
    requiere_inspeccion: false,
    responsable: 'Enfermera Ocupacional',
    creado_en: '2023-06-01',
    actualizado_en: '2024-01-10',
  },
];

// ==================== ANÁLISIS DE VULNERABILIDAD SECTION ====================

const AnalisisVulnerabilidadSection = () => {
  const isLoading = false;
  const analisis = mockAnalisis;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner />
      </div>
    );
  }

  if (!analisis || analisis.length === 0) {
    return (
      <EmptyState
        icon={<Shield className="w-16 h-16" />}
        title="No hay análisis de vulnerabilidad registrados"
        description="Comience identificando las amenazas y vulnerabilidades de la organización"
        action={{
          label: 'Nuevo Análisis',
          onClick: () => console.log('Nuevo Análisis'),
          icon: <Plus className="w-4 h-4" />,
        }}
      />
    );
  }

  const stats = {
    total: analisis.length,
    aprobados: analisis.filter((a) => a.estado === 'APROBADO').length,
    criticos: analisis.filter((a) => a.nivel_vulnerabilidad === 'CRITICO' || a.nivel_vulnerabilidad === 'ALTO').length,
    amenazasCriticas: analisis.reduce((acc, a) => acc + (a.amenazas_criticas || 0), 0),
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Análisis</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.total}</p>
            </div>
            <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
              <Shield className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            </div>
          </div>
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
        </Card>

        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Alto/Crítico</p>
              <p className="text-2xl font-bold text-danger-600 dark:text-danger-400 mt-1">{stats.criticos}</p>
            </div>
            <div className="w-12 h-12 bg-danger-100 dark:bg-danger-900/30 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-danger-600 dark:text-danger-400" />
            </div>
          </div>
        </Card>

        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Amenazas Críticas</p>
              <p className="text-2xl font-bold text-warning-600 dark:text-warning-400 mt-1">{stats.amenazasCriticas}</p>
            </div>
            <div className="w-12 h-12 bg-warning-100 dark:bg-warning-900/30 rounded-lg flex items-center justify-center">
              <XCircle className="w-6 h-6 text-warning-600 dark:text-warning-400" />
            </div>
          </div>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Análisis de Vulnerabilidad</h3>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" leftIcon={<Filter className="w-4 h-4" />}>
            Filtros
          </Button>
          <Button variant="outline" size="sm" leftIcon={<Download className="w-4 h-4" />}>
            Exportar
          </Button>
          <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
            Nuevo Análisis
          </Button>
        </div>
      </div>

      {/* Table */}
      <Card variant="bordered" padding="none">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Código</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Nombre</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tipo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Nivel</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Amenazas</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Próx. Revisión</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {analisis.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{item.codigo}</td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                    <p className="font-medium truncate max-w-xs">{item.nombre}</p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">{formatEstado(item.tipo_amenaza)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant={getNivelVulnerabilidadVariant(item.nivel_vulnerabilidad)} size="sm">
                      {formatEstado(item.nivel_vulnerabilidad)}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant={getEstadoAnalisisVariant(item.estado)} size="sm">
                      {formatEstado(item.estado)}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className="text-gray-600 dark:text-gray-300">{item.total_amenazas}</span>
                    {item.amenazas_criticas && item.amenazas_criticas > 0 && (
                      <span className="text-danger-600 dark:text-danger-400 ml-1">({item.amenazas_criticas} críticas)</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                    {item.proxima_revision ? format(new Date(item.proxima_revision), 'dd/MM/yyyy', { locale: es }) : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="sm"><Eye className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="sm"><Edit className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="sm"><Trash2 className="w-4 h-4 text-danger-600" /></Button>
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

// ==================== PLANES DE EMERGENCIA SECTION ====================

const PlanesEmergenciaSection = () => {
  const isLoading = false;
  const planes = mockPlanes;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner />
      </div>
    );
  }

  if (!planes || planes.length === 0) {
    return (
      <EmptyState
        icon={<FileText className="w-16 h-16" />}
        title="No hay planes de emergencia registrados"
        description="Comience creando el plan de emergencias de la organización"
        action={{
          label: 'Nuevo Plan',
          onClick: () => console.log('Nuevo Plan'),
          icon: <Plus className="w-4 h-4" />,
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Actions */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Planes de Emergencia</h3>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" leftIcon={<Download className="w-4 h-4" />}>
            Exportar
          </Button>
          <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
            Nuevo Plan
          </Button>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {planes.map((plan) => (
          <Card key={plan.id} variant="bordered" padding="md">
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-semibold text-gray-900 dark:text-white">{plan.codigo}</h4>
                    <Badge variant={getEstadoPlanVariant(plan.estado)} size="sm">
                      {formatEstado(plan.estado)}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">{plan.nombre}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Versión {plan.version}</p>
                </div>
                <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 py-3 border-t border-b border-gray-200 dark:border-gray-700">
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{plan.total_procedimientos}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Procedimientos</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{plan.total_planos}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Planos</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{plan.total_simulacros}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Simulacros</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Vigencia</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {format(new Date(plan.fecha_vigencia), 'dd/MM/yyyy', { locale: es })}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Próx. Revisión</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {format(new Date(plan.fecha_revision), 'dd/MM/yyyy', { locale: es })}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button variant="ghost" size="sm" leftIcon={<Eye className="w-4 h-4" />}>Ver</Button>
                <Button variant="ghost" size="sm" leftIcon={<Edit className="w-4 h-4" />}>Editar</Button>
                <Button variant="ghost" size="sm" leftIcon={<Download className="w-4 h-4" />}>Descargar</Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

// ==================== PLANOS DE EVACUACIÓN SECTION ====================

const PlanosEvacuacionSection = () => {
  const isLoading = false;
  const planos = mockPlanos;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner />
      </div>
    );
  }

  if (!planos || planos.length === 0) {
    return (
      <EmptyState
        icon={<Map className="w-16 h-16" />}
        title="No hay planos de evacuación registrados"
        description="Comience cargando los planos de evacuación de las instalaciones"
        action={{
          label: 'Nuevo Plano',
          onClick: () => console.log('Nuevo Plano'),
          icon: <Plus className="w-4 h-4" />,
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Actions */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Planos de Evacuación</h3>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" leftIcon={<Filter className="w-4 h-4" />}>
            Filtros
          </Button>
          <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
            Nuevo Plano
          </Button>
        </div>
      </div>

      {/* Planos Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {planos.map((plano) => (
          <Card key={plano.id} variant="bordered" padding="md">
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{plano.codigo}</p>
                  <h4 className="font-semibold text-gray-900 dark:text-white mt-1">{plano.nombre}</h4>
                </div>
                {plano.publicado ? (
                  <Badge variant="success" size="sm">Publicado</Badge>
                ) : (
                  <Badge variant="gray" size="sm">Borrador</Badge>
                )}
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                <MapPin className="w-4 h-4" />
                <span>{plano.edificio} - Piso {plano.piso}</span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Capacidad</p>
                  <p className="font-medium text-gray-900 dark:text-white">{plano.capacidad_personas} personas</p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Rutas</p>
                  <p className="font-medium text-gray-900 dark:text-white">{plano.numero_rutas} rutas</p>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1">
                  <Flame className="w-3 h-3" /> {plano.extintores} ext.
                </span>
                <span className="flex items-center gap-1">
                  <Radio className="w-3 h-3" /> {plano.alarmas} alarm.
                </span>
                <span className="flex items-center gap-1">
                  <Heart className="w-3 h-3" /> {plano.botiquines} botiq.
                </span>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                <Button variant="ghost" size="sm" leftIcon={<Eye className="w-4 h-4" />}>Ver Plano</Button>
                <Button variant="ghost" size="sm" leftIcon={<Edit className="w-4 h-4" />}>Editar</Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

// ==================== BRIGADAS SECTION ====================

const BrigadasSection = () => {
  const isLoading = false;
  const brigadas = mockBrigadas;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner />
      </div>
    );
  }

  if (!brigadas || brigadas.length === 0) {
    return (
      <EmptyState
        icon={<Users className="w-16 h-16" />}
        title="No hay brigadas registradas"
        description="Comience conformando las brigadas de emergencia"
        action={{
          label: 'Nueva Brigada',
          onClick: () => console.log('Nueva Brigada'),
          icon: <Plus className="w-4 h-4" />,
        }}
      />
    );
  }

  const totalBrigadistas = brigadas.reduce((acc, b) => acc + (b.brigadistas_activos || 0), 0);

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Brigadas</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{brigadas.length}</p>
            </div>
            <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            </div>
          </div>
        </Card>

        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Activas</p>
              <p className="text-2xl font-bold text-success-600 dark:text-success-400 mt-1">
                {brigadas.filter((b) => b.estado === 'ACTIVA').length}
              </p>
            </div>
            <div className="w-12 h-12 bg-success-100 dark:bg-success-900/30 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-success-600 dark:text-success-400" />
            </div>
          </div>
        </Card>

        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Brigadistas</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{totalBrigadistas}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <User className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </Card>

        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">En Formación</p>
              <p className="text-2xl font-bold text-warning-600 dark:text-warning-400 mt-1">
                {brigadas.filter((b) => b.estado === 'EN_FORMACION').length}
              </p>
            </div>
            <div className="w-12 h-12 bg-warning-100 dark:bg-warning-900/30 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-warning-600 dark:text-warning-400" />
            </div>
          </div>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Brigadas de Emergencia</h3>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" leftIcon={<Download className="w-4 h-4" />}>
            Exportar
          </Button>
          <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
            Nueva Brigada
          </Button>
        </div>
      </div>

      {/* Brigadas Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {brigadas.map((brigada) => (
          <Card key={brigada.id} variant="bordered" padding="md">
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${brigada.tipo_brigada_color}20` }}
                  >
                    <Users className="w-5 h-5" style={{ color: brigada.tipo_brigada_color }} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">{brigada.nombre}</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{brigada.tipo_brigada_nombre}</p>
                  </div>
                </div>
                <Badge variant={getEstadoBrigadaVariant(brigada.estado)} size="sm">
                  {formatEstado(brigada.estado)}
                </Badge>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Líder</span>
                  <span className="font-medium text-gray-900 dark:text-white">{brigada.lider_brigada}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Brigadistas</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {brigada.brigadistas_activos} / {brigada.numero_minimo_brigadistas}
                  </span>
                </div>
              </div>

              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className={cn(
                    'h-2 rounded-full transition-all',
                    brigada.estado_capacidad === 'OPTIMO' && 'bg-success-500',
                    brigada.estado_capacidad === 'MINIMO' && 'bg-warning-500',
                    brigada.estado_capacidad === 'INSUFICIENTE' && 'bg-danger-500'
                  )}
                  style={{
                    width: `${Math.min((brigada.numero_brigadistas_actuales / brigada.numero_minimo_brigadistas) * 100, 100)}%`,
                  }}
                />
              </div>

              {brigada.fecha_proxima_capacitacion && (
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <Calendar className="w-3 h-3" />
                  <span>Próx. capacitación: {format(new Date(brigada.fecha_proxima_capacitacion), 'dd/MM/yyyy', { locale: es })}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                <Button variant="ghost" size="sm" leftIcon={<Eye className="w-4 h-4" />}>Ver</Button>
                <Button variant="ghost" size="sm" leftIcon={<Users className="w-4 h-4" />}>Brigadistas</Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

// ==================== SIMULACROS SECTION ====================

const SimulacrosSection = () => {
  const isLoading = false;
  const simulacros = mockSimulacros;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner />
      </div>
    );
  }

  if (!simulacros || simulacros.length === 0) {
    return (
      <EmptyState
        icon={<Calendar className="w-16 h-16" />}
        title="No hay simulacros registrados"
        description="Comience programando simulacros de emergencia"
        action={{
          label: 'Nuevo Simulacro',
          onClick: () => console.log('Nuevo Simulacro'),
          icon: <Plus className="w-4 h-4" />,
        }}
      />
    );
  }

  const stats = {
    programados: simulacros.filter((s) => s.estado === 'PROGRAMADO' || s.estado === 'CONFIRMADO').length,
    realizados: simulacros.filter((s) => s.estado === 'REALIZADO' || s.estado === 'EVALUADO').length,
    exitosos: simulacros.filter((s) => s.fue_exitoso).length,
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Simulacros</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{simulacros.length}</p>
            </div>
            <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            </div>
          </div>
        </Card>

        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Programados</p>
              <p className="text-2xl font-bold text-info-600 dark:text-info-400 mt-1">{stats.programados}</p>
            </div>
            <div className="w-12 h-12 bg-info-100 dark:bg-info-900/30 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-info-600 dark:text-info-400" />
            </div>
          </div>
        </Card>

        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Realizados</p>
              <p className="text-2xl font-bold text-success-600 dark:text-success-400 mt-1">{stats.realizados}</p>
            </div>
            <div className="w-12 h-12 bg-success-100 dark:bg-success-900/30 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-success-600 dark:text-success-400" />
            </div>
          </div>
        </Card>

        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Exitosos</p>
              <p className="text-2xl font-bold text-success-600 dark:text-success-400 mt-1">{stats.exitosos}</p>
            </div>
            <div className="w-12 h-12 bg-success-100 dark:bg-success-900/30 rounded-lg flex items-center justify-center">
              <Activity className="w-6 h-6 text-success-600 dark:text-success-400" />
            </div>
          </div>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Simulacros de Emergencia</h3>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" leftIcon={<Filter className="w-4 h-4" />}>
            Filtros
          </Button>
          <Button variant="outline" size="sm" leftIcon={<Download className="w-4 h-4" />}>
            Exportar
          </Button>
          <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
            Nuevo Simulacro
          </Button>
        </div>
      </div>

      {/* Table */}
      <Card variant="bordered" padding="none">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Código</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Nombre</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tipo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Fecha</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Coordinador</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Resultado</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {simulacros.map((simulacro) => (
                <tr key={simulacro.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{simulacro.codigo}</td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                    <p className="font-medium truncate max-w-xs">{simulacro.nombre}</p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                    {simulacro.tipo_simulacro_display || formatEstado(simulacro.tipo_simulacro)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                    {format(new Date(simulacro.fecha_programada), 'dd/MM/yyyy', { locale: es })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant={getEstadoSimulacroVariant(simulacro.estado)} size="sm">
                      {formatEstado(simulacro.estado)}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">{simulacro.coordinador}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {simulacro.estado === 'REALIZADO' || simulacro.estado === 'EVALUADO' ? (
                      simulacro.fue_exitoso ? (
                        <Badge variant="success" size="sm">Exitoso</Badge>
                      ) : (
                        <Badge variant="danger" size="sm">No Exitoso</Badge>
                      )
                    ) : (
                      <span className="text-sm text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="sm"><Eye className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="sm"><Edit className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="sm"><FileText className="w-4 h-4" /></Button>
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

// ==================== RECURSOS DE EMERGENCIA SECTION ====================

const RecursosEmergenciaSection = () => {
  const isLoading = false;
  const recursos = mockRecursos;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner />
      </div>
    );
  }

  if (!recursos || recursos.length === 0) {
    return (
      <EmptyState
        icon={<Package className="w-16 h-16" />}
        title="No hay recursos de emergencia registrados"
        description="Comience registrando los equipos y recursos de emergencia"
        action={{
          label: 'Nuevo Recurso',
          onClick: () => console.log('Nuevo Recurso'),
          icon: <Plus className="w-4 h-4" />,
        }}
      />
    );
  }

  const stats = {
    total: recursos.length,
    operativos: recursos.filter((r) => r.estado === 'OPERATIVO').length,
    mantenimiento: recursos.filter((r) => r.estado === 'EN_MANTENIMIENTO').length,
    requierenInspeccion: recursos.filter((r) => r.requiere_inspeccion).length,
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Recursos</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.total}</p>
            </div>
            <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            </div>
          </div>
        </Card>

        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Operativos</p>
              <p className="text-2xl font-bold text-success-600 dark:text-success-400 mt-1">{stats.operativos}</p>
            </div>
            <div className="w-12 h-12 bg-success-100 dark:bg-success-900/30 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-success-600 dark:text-success-400" />
            </div>
          </div>
        </Card>

        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">En Mantenimiento</p>
              <p className="text-2xl font-bold text-warning-600 dark:text-warning-400 mt-1">{stats.mantenimiento}</p>
            </div>
            <div className="w-12 h-12 bg-warning-100 dark:bg-warning-900/30 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-warning-600 dark:text-warning-400" />
            </div>
          </div>
        </Card>

        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Requieren Inspección</p>
              <p className="text-2xl font-bold text-danger-600 dark:text-danger-400 mt-1">{stats.requierenInspeccion}</p>
            </div>
            <div className="w-12 h-12 bg-danger-100 dark:bg-danger-900/30 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-danger-600 dark:text-danger-400" />
            </div>
          </div>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recursos de Emergencia</h3>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" leftIcon={<Filter className="w-4 h-4" />}>
            Filtros
          </Button>
          <Button variant="outline" size="sm" leftIcon={<Download className="w-4 h-4" />}>
            Exportar
          </Button>
          <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
            Nuevo Recurso
          </Button>
        </div>
      </div>

      {/* Table */}
      <Card variant="bordered" padding="none">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Código</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tipo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Nombre</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Ubicación</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Próx. Inspección</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Responsable</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {recursos.map((recurso) => (
                <tr key={recurso.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{recurso.codigo}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {getTipoRecursoIcon(recurso.tipo_recurso)}
                      <span className="text-sm text-gray-600 dark:text-gray-300">
                        {recurso.tipo_recurso_display || formatEstado(recurso.tipo_recurso)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{recurso.nombre}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                    <p>{recurso.area}</p>
                    <p className="text-xs text-gray-400">{recurso.ubicacion_especifica}</p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant={getEstadoRecursoVariant(recurso.estado)} size="sm">
                      {recurso.estado_display || formatEstado(recurso.estado)}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                    {recurso.fecha_proxima_inspeccion ? (
                      <span className={cn(recurso.requiere_inspeccion && 'text-danger-600 dark:text-danger-400 font-medium')}>
                        {format(new Date(recurso.fecha_proxima_inspeccion), 'dd/MM/yyyy', { locale: es })}
                      </span>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">{recurso.responsable}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="sm"><Eye className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="sm"><Edit className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="sm"><CheckCircle className="w-4 h-4" /></Button>
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

export default function EmergenciasPage() {
  const [activeTab, setActiveTab] = useState('vulnerabilidad');

  const tabs = [
    {
      id: 'vulnerabilidad',
      label: 'Análisis Vulnerabilidad',
      icon: <Shield className="w-4 h-4" />,
    },
    {
      id: 'planes',
      label: 'Planes Emergencia',
      icon: <FileText className="w-4 h-4" />,
    },
    {
      id: 'planos',
      label: 'Planos Evacuación',
      icon: <Map className="w-4 h-4" />,
    },
    {
      id: 'brigadas',
      label: 'Brigadas',
      icon: <Users className="w-4 h-4" />,
    },
    {
      id: 'simulacros',
      label: 'Simulacros',
      icon: <Calendar className="w-4 h-4" />,
    },
    {
      id: 'recursos',
      label: 'Recursos',
      icon: <Package className="w-4 h-4" />,
    },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Gestión de Emergencias"
        description="Análisis de vulnerabilidad, planes de emergencia, brigadas, simulacros y recursos de emergencia"
      />

      {/* Tabs */}
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} variant="pills" />

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'vulnerabilidad' && <AnalisisVulnerabilidadSection />}
        {activeTab === 'planes' && <PlanesEmergenciaSection />}
        {activeTab === 'planos' && <PlanosEvacuacionSection />}
        {activeTab === 'brigadas' && <BrigadasSection />}
        {activeTab === 'simulacros' && <SimulacrosSection />}
        {activeTab === 'recursos' && <RecursosEmergenciaSection />}
      </div>
    </div>
  );
}
