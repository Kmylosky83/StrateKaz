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
  Clock,
  XCircle,
  Eye,
  Edit,
  FileText,
  Calendar,
  TrendingUp,
  Activity,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { PageHeader } from '@/components/layout';
import {
  Tabs,
  Card,
  Button,
  EmptyState,
  Spinner,
  KpiCard,
  KpiCardGrid,
  SectionToolbar,
  StatusBadge,
  Progress,
  ExportButton,
} from '@/components/common';
import { formatStatusLabel } from '@/components/common/StatusBadge';
import {
  useAccidentesTrabajo,
  useEnfermedadesLaborales,
  useIncidentesTrabajo,
  useInvestigacionesATEL,
} from '../hooks/useAccidentalidad';
import { cn } from '@/utils/cn';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// ==================== UTILITY FUNCTIONS ====================

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
  return tipoMap[tipo] || formatStatusLabel(tipo);
};

// ==================== ACCIDENTES DE TRABAJO SECTION ====================

const AccidentesTrabajoSection = () => {
  const { data, isLoading } = useAccidentesTrabajo();
  const accidentes = data?.results ?? [];

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
      <KpiCardGrid>
        <KpiCard
          label="Total Accidentes"
          value={stats.total}
          icon={<AlertTriangle className="w-5 h-5" />}
          color="red"
          description="Este año"
        />
        <KpiCard
          label="Graves/Mortales"
          value={stats.graves}
          icon={<AlertCircle className="w-5 h-5" />}
          color="danger"
          valueColor="text-danger-600 dark:text-danger-400"
          description="Requieren investigación"
        />
        <KpiCard
          label="Con Incapacidad"
          value={stats.conIncapacidad}
          icon={<Clock className="w-5 h-5" />}
          color="warning"
          valueColor="text-warning-600 dark:text-warning-400"
          description="Generaron ausencias"
        />
        <KpiCard
          label="Días Incapacidad"
          value={stats.diasIncapacidadTotal}
          icon={<Calendar className="w-5 h-5" />}
          color="primary"
          valueColor="text-primary-600 dark:text-primary-400"
          description="Total acumulado"
        />
      </KpiCardGrid>

      <div className="flex items-center justify-between gap-2">
        <SectionToolbar
          title="Accidentes de Trabajo Registrados"
          onFilter={() => console.log('Filtros AT')}
          primaryAction={{ label: 'Nuevo Accidente', onClick: () => console.log('Nuevo AT') }}
          className="flex-1"
        />
        <ExportButton
          endpoint="/api/hseq/accidentalidad/accidentes-trabajo/export/"
          filename="accidentes_trabajo"
        />
      </div>

      {/* Accidentes Table */}
      <Card variant="bordered" padding="none">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Código</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Fecha</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Trabajador</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tipo Evento</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Gravedad</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Días Inc.</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Parte Cuerpo</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Acciones</th>
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
                    <StatusBadge status={accidente.gravedad} preset="gravedad" />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                    {accidente.dias_incapacidad}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                    {formatStatusLabel(accidente.parte_cuerpo)}
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

// ==================== ENFERMEDADES LABORALES SECTION ====================

const EnfermedadesLaboralesSection = () => {
  const { data, isLoading } = useEnfermedadesLaborales();
  const enfermedades = data?.results ?? [];

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
      <KpiCardGrid>
        <KpiCard
          label="Total EL"
          value={stats.total}
          icon={<Stethoscope className="w-5 h-5" />}
          color="blue"
          description="Enfermedades registradas"
        />
        <KpiCard
          label="Calificadas Laborales"
          value={stats.calificadasLaborales}
          icon={<CheckCircle className="w-5 h-5" />}
          color="success"
          valueColor="text-success-600 dark:text-success-400"
          description="Confirmadas como laborales"
        />
        <KpiCard
          label="En Estudio"
          value={stats.enEstudio}
          icon={<Clock className="w-5 h-5" />}
          color="warning"
          valueColor="text-warning-600 dark:text-warning-400"
          description="Pendientes de calificación"
        />
        <KpiCard
          label="PCL Promedio"
          value={`${stats.pclPromedio.toFixed(1)}%`}
          icon={<TrendingUp className="w-5 h-5" />}
          color="primary"
          valueColor="text-primary-600 dark:text-primary-400"
          description="Pérdida capacidad laboral"
        />
      </KpiCardGrid>

      <SectionToolbar
        title="Enfermedades Laborales Registradas"
        onFilter={() => console.log('Filtros EL')}
        onExport={() => console.log('Exportar EL')}
        primaryAction={{ label: 'Nueva Enfermedad Laboral', onClick: () => console.log('Nueva EL') }}
      />

      {/* Enfermedades Grid */}
      <div className="grid grid-cols-1 gap-6">
        {enfermedades.map((enfermedad) => (
          <Card key={enfermedad.id} variant="bordered" padding="md">
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-semibold text-gray-900 dark:text-white">{enfermedad.codigo_el}</h4>
                    <StatusBadge status={enfermedad.estado_calificacion} preset="proceso" />
                    <StatusBadge status={enfermedad.tipo_enfermedad} variant="info" label={formatTipo(enfermedad.tipo_enfermedad)} />
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">{enfermedad.diagnostico_descripcion}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    Factor de Riesgo: {enfermedad.factor_riesgo}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Trabajador</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">{enfermedad.trabajador_nombre}</p>
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

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                <Button variant="ghost" size="sm" leftIcon={<Eye className="w-4 h-4" />}>Ver Detalle</Button>
                <Button variant="ghost" size="sm" leftIcon={<Edit className="w-4 h-4" />}>Editar</Button>
                <Button variant="ghost" size="sm" leftIcon={<FileText className="w-4 h-4" />}>Documentos</Button>
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
  const { data, isLoading } = useIncidentesTrabajo();
  const incidentes = data?.results ?? [];

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
      <KpiCardGrid>
        <KpiCard
          label="Total Incidentes"
          value={stats.total}
          icon={<AlertOctagon className="w-5 h-5" />}
          color="orange"
          description="Últimos 30 días"
        />
        <KpiCard
          label="Casi Accidentes"
          value={stats.casiAccidentes}
          icon={<AlertTriangle className="w-5 h-5" />}
          color="warning"
          valueColor="text-warning-600 dark:text-warning-400"
          description="Oportunidades de mejora"
        />
        <KpiCard
          label="Condiciones Inseguras"
          value={stats.condicionesInseguras}
          icon={<XCircle className="w-5 h-5" />}
          color="primary"
          valueColor="text-primary-600 dark:text-primary-400"
          description="Requieren corrección"
        />
        <KpiCard
          label="Potencial Alto"
          value={stats.potencialAlto}
          icon={<AlertCircle className="w-5 h-5" />}
          color="danger"
          valueColor="text-danger-600 dark:text-danger-400"
          description="Alta prioridad"
        />
      </KpiCardGrid>

      <SectionToolbar
        title="Incidentes Registrados"
        onFilter={() => console.log('Filtros Incidentes')}
        onExport={() => console.log('Exportar Incidentes')}
        primaryAction={{ label: 'Nuevo Incidente', onClick: () => console.log('Nuevo Incidente') }}
      />

      {/* Incidentes Grid */}
      <div className="grid grid-cols-1 gap-6">
        {incidentes.map((incidente) => (
          <Card key={incidente.id} variant="bordered" padding="md">
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-semibold text-gray-900 dark:text-white">{incidente.codigo_incidente}</h4>
                    <StatusBadge
                      status={incidente.potencial_gravedad}
                      preset="gravedad"
                      label={`Potencial ${formatStatusLabel(incidente.potencial_gravedad)}`}
                    />
                    <StatusBadge status={incidente.tipo_incidente} variant="info" label={formatTipo(incidente.tipo_incidente)} />
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">{incidente.descripcion_evento}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Fecha Evento</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">
                    {format(new Date(incidente.fecha_evento), 'dd/MM/yyyy', { locale: es })}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Reportado Por</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">{incidente.reportado_por_nombre}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Requiere Investigación</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">
                    {incidente.requiere_investigacion ? 'Sí' : 'No'}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                <Button variant="ghost" size="sm" leftIcon={<Eye className="w-4 h-4" />}>Ver Detalle</Button>
                <Button variant="ghost" size="sm" leftIcon={<Edit className="w-4 h-4" />}>Editar</Button>
                {incidente.requiere_investigacion && (
                  <Button variant="ghost" size="sm" leftIcon={<Search className="w-4 h-4" />}>Investigar</Button>
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
  const { data, isLoading } = useInvestigacionesATEL();
  const investigaciones = data?.results ?? [];

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
      <KpiCardGrid>
        <KpiCard
          label="Total Investigaciones"
          value={stats.total}
          icon={<Search className="w-5 h-5" />}
          color="purple"
          description="Este año"
        />
        <KpiCard
          label="En Desarrollo"
          value={stats.enDesarrollo}
          icon={<Activity className="w-5 h-5" />}
          color="warning"
          valueColor="text-warning-600 dark:text-warning-400"
          description="En proceso"
        />
        <KpiCard
          label="Completadas"
          value={stats.completadas}
          icon={<CheckCircle className="w-5 h-5" />}
          color="primary"
          valueColor="text-primary-600 dark:text-primary-400"
          description="Finalizadas"
        />
        <KpiCard
          label="Aprobadas"
          value={stats.aprobadas}
          icon={<CheckCircle className="w-5 h-5" />}
          color="success"
          valueColor="text-success-600 dark:text-success-400"
          description="Validadas"
        />
      </KpiCardGrid>

      <SectionToolbar
        title="Investigaciones ATEL"
        onFilter={() => console.log('Filtros Investigaciones')}
        onExport={() => console.log('Exportar Investigaciones')}
        primaryAction={{ label: 'Nueva Investigación', onClick: () => console.log('Nueva Investigación') }}
      />

      {/* Investigaciones Table */}
      <Card variant="bordered" padding="none">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Código</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Evento</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Metodología</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Líder</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Fecha Límite</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Causas</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Acciones</th>
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
                        {formatStatusLabel(investigacion.evento_tipo || '')}
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
                    <StatusBadge status={investigacion.estado} preset="proceso" />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                    {format(new Date(investigacion.fecha_limite), 'dd/MM/yyyy', { locale: es })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                    {investigacion.total_causas || 0}
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

// ==================== MAIN PAGE COMPONENT ====================

export default function AccidentalidadPage() {
  const [activeTab, setActiveTab] = useState('accidentes-trabajo');

  const tabs = [
    { id: 'accidentes-trabajo', label: 'Accidentes de Trabajo', icon: <AlertTriangle className="w-4 h-4" /> },
    { id: 'enfermedades-laborales', label: 'Enfermedades Laborales', icon: <Stethoscope className="w-4 h-4" /> },
    { id: 'incidentes', label: 'Incidentes', icon: <AlertOctagon className="w-4 h-4" /> },
    { id: 'investigaciones', label: 'Investigaciones', icon: <Search className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Gestión de Accidentalidad"
        description="Control integral de accidentes de trabajo, enfermedades laborales, incidentes e investigaciones ATEL"
      />

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} variant="pills" />

      <div className="mt-6">
        {activeTab === 'accidentes-trabajo' && <AccidentesTrabajoSection />}
        {activeTab === 'enfermedades-laborales' && <EnfermedadesLaboralesSection />}
        {activeTab === 'incidentes' && <IncidentesSection />}
        {activeTab === 'investigaciones' && <InvestigacionesSection />}
      </div>
    </div>
  );
}
