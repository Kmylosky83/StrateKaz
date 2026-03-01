/**
 * Página: Auditorías Internas - Sistema de Gestión
 * 4 tabs: Programas Auditoría, Auditorías, Hallazgos, Evaluación Cumplimiento
 * Connected to real hooks from useMejoraContinua (HSEQ)
 * MODULE_CODE = 'sistema_gestion'
 */
import { useState, useMemo } from 'react';
import {
  ClipboardCheck,
  FileCheck,
  AlertOctagon,
  Scale,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  FileText,
  Filter,
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
  Badge,
  Progress,
  ConfirmDialog,
} from '@/components/common';
import { Select } from '@/components/forms';
import { formatStatusLabel } from '@/components/common/StatusBadge';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import {
  useProgramasAuditoria,
  useDeleteProgramaAuditoria,
  useAuditorias,
  useDeleteAuditoria,
  useHallazgos,
  useDeleteHallazgo,
  useEvaluacionesCumplimiento,
  useDeleteEvaluacionCumplimiento,
} from '@/features/hseq/hooks/useMejoraContinua';

import ProgramaAuditoriaFormModal from '@/features/hseq/components/ProgramaAuditoriaFormModal';
import AuditoriaFormModal from '@/features/hseq/components/AuditoriaFormModal';
import HallazgoFormModal from '@/features/hseq/components/HallazgoFormModal';
import EvaluacionCumplimientoFormModal from '@/features/hseq/components/EvaluacionCumplimientoFormModal';

import type {
  ProgramaAuditoriaList,
  AuditoriaList,
  HallazgoList,
  EvaluacionCumplimientoList,
  TipoAuditoria,
  ImpactoHallazgo,
} from '@/features/hseq/types/mejora-continua.types';

const MODULE_CODE = 'sistema_gestion';

// ==================== UTILITY FUNCTIONS ====================

const getEstadoBadgeColor = (estado: string): 'default' | 'success' | 'warning' | 'danger' => {
  const estadoUpper = estado.toUpperCase();
  if (
    estadoUpper.includes('COMPLETADO') ||
    estadoUpper.includes('CERRAD') ||
    estadoUpper.includes('APROBADO')
  ) {
    return 'success';
  }
  if (
    estadoUpper.includes('EJECUCION') ||
    estadoUpper.includes('PROCESO') ||
    estadoUpper.includes('CURSO')
  ) {
    return 'warning';
  }
  if (estadoUpper.includes('CANCELAD')) {
    return 'danger';
  }
  return 'default';
};

// ==================== PROGRAMAS AUDITORÍA SECTION ====================

interface ProgramasAuditoriaProps {
  onOpenModal: (item?: ProgramaAuditoriaList) => void;
}

const ProgramasAuditoriaSection = ({ onOpenModal }: ProgramasAuditoriaProps) => {
  const { data, isLoading } = useProgramasAuditoria();
  const deleteMutation = useDeleteProgramaAuditoria();
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const programas = data?.results ?? [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner />
      </div>
    );
  }

  if (programas.length === 0) {
    return (
      <EmptyState
        icon={<ClipboardCheck className="w-16 h-16" />}
        title="No hay programas de auditoría registrados"
        description="Comience creando un programa de auditoría para planificar las auditorías del sistema de gestión"
        action={{
          label: 'Nuevo Programa',
          onClick: () => onOpenModal(),
          icon: <Plus className="w-4 h-4" />,
        }}
      />
    );
  }

  const stats = {
    total: programas.length,
    aprobados: programas.filter((p) => p.estado === 'APROBADO').length,
    enEjecucion: programas.filter((p) => p.estado === 'EN_EJECUCION').length,
    completados: programas.filter((p) => p.estado === 'COMPLETADO').length,
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <KpiCardGrid>
        <KpiCard
          label="Total Programas"
          value={stats.total}
          icon={<ClipboardCheck className="w-5 h-5" />}
          color="primary"
        />
        <KpiCard
          label="Aprobados"
          value={stats.aprobados}
          icon={<CheckCircle className="w-5 h-5" />}
          color="success"
        />
        <KpiCard
          label="En Ejecución"
          value={stats.enEjecucion}
          icon={<TrendingUp className="w-5 h-5" />}
          color="warning"
        />
        <KpiCard
          label="Completados"
          value={stats.completados}
          icon={<FileText className="w-5 h-5" />}
          color="success"
        />
      </KpiCardGrid>

      {/* Actions */}
      <SectionToolbar
        title="Programas de Auditoría"
        primaryAction={{ label: 'Nuevo Programa', onClick: () => onOpenModal() }}
      />

      {/* Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Código
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Nombre
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Año
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Avance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Auditorías
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Responsable
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {programas.map((programa) => (
                <tr key={programa.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {programa.codigo}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                    {programa.nombre}
                    {programa.version > 1 && (
                      <span className="ml-2 text-xs text-gray-500">v{programa.version}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {programa.año}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge
                      status={programa.estado}
                      variant={getEstadoBadgeColor(programa.estado)}
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Progress value={programa.porcentaje_avance ?? 0} className="w-24" />
                      <span className="text-xs text-gray-500">
                        {programa.porcentaje_avance ?? 0}%
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                    {programa.auditorias_completadas ?? 0} / {programa.total_auditorias ?? 0}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                    {programa.responsable_programa_nombre ?? 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => onOpenModal(programa)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setDeleteId(programa.id)}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <ConfirmDialog
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={() => {
          if (deleteId) {
            deleteMutation.mutate(deleteId);
            setDeleteId(null);
          }
        }}
        title="Eliminar Programa de Auditoría"
        message="¿Está seguro de eliminar este programa? Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        variant="danger"
      />
    </div>
  );
};

// ==================== CONSTANTS FOR FILTERS ====================

const TIPO_AUDITORIA_OPTIONS: { value: TipoAuditoria | ''; label: string }[] = [
  { value: '', label: 'Todos los tipos' },
  { value: 'INTERNA', label: 'Auditoría Interna' },
  { value: 'EXTERNA', label: 'Auditoría Externa' },
  { value: 'SEGUIMIENTO', label: 'Seguimiento' },
  { value: 'CERTIFICACION', label: 'Certificación' },
  { value: 'RENOVACION', label: 'Renovación' },
  { value: 'CONTROL_INTERNO', label: 'Control Interno' },
  { value: 'DIAGNOSTICO', label: 'Diagnóstico' },
  { value: 'PROVEEDOR', label: 'Auditoría a Proveedor' },
];

const IMPACTO_OPTIONS: { value: ImpactoHallazgo | ''; label: string }[] = [
  { value: '', label: 'Todos los impactos' },
  { value: 'ALTO', label: 'Alto' },
  { value: 'MEDIO', label: 'Medio' },
  { value: 'BAJO', label: 'Bajo' },
];

const getImpactoBadgeVariant = (impacto: string): 'danger' | 'warning' | 'success' | 'default' => {
  if (impacto === 'ALTO') return 'danger';
  if (impacto === 'MEDIO') return 'warning';
  if (impacto === 'BAJO') return 'success';
  return 'default';
};

// ==================== AUDITORÍAS SECTION ====================

interface AuditoriasProps {
  onOpenModal: (item?: AuditoriaList) => void;
}

const AuditoriasSection = ({ onOpenModal }: AuditoriasProps) => {
  const [tipoFilter, setTipoFilter] = useState<TipoAuditoria | ''>('');

  const queryParams = useMemo(() => {
    const params: Record<string, unknown> = {};
    if (tipoFilter) params.tipo = tipoFilter;
    return Object.keys(params).length > 0 ? params : undefined;
  }, [tipoFilter]);

  const { data, isLoading } = useAuditorias(queryParams);
  const deleteMutation = useDeleteAuditoria();
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const auditorias = data?.results ?? [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner />
      </div>
    );
  }

  if (auditorias.length === 0) {
    return (
      <EmptyState
        icon={<FileCheck className="w-16 h-16" />}
        title="No hay auditorías registradas"
        description="Comience creando auditorías para evaluar la conformidad del sistema de gestión"
        action={{
          label: 'Nueva Auditoría',
          onClick: () => onOpenModal(),
          icon: <Plus className="w-4 h-4" />,
        }}
      />
    );
  }

  const stats = {
    total: auditorias.length,
    programadas: auditorias.filter((a) => a.estado === 'PROGRAMADA').length,
    enCurso: auditorias.filter((a) => a.estado === 'EN_EJECUCION').length,
    cerradas: auditorias.filter((a) => a.estado === 'CERRADA').length,
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <KpiCardGrid>
        <KpiCard
          label="Total Auditorías"
          value={stats.total}
          icon={<FileCheck className="w-5 h-5" />}
          color="primary"
        />
        <KpiCard
          label="Programadas"
          value={stats.programadas}
          icon={<Clock className="w-5 h-5" />}
          color="default"
        />
        <KpiCard
          label="En Curso"
          value={stats.enCurso}
          icon={<TrendingUp className="w-5 h-5" />}
          color="warning"
        />
        <KpiCard
          label="Cerradas"
          value={stats.cerradas}
          icon={<CheckCircle className="w-5 h-5" />}
          color="success"
        />
      </KpiCardGrid>

      {/* Filter + Actions */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Filter className="w-4 h-4 text-gray-500 flex-shrink-0" />
          <Select
            value={tipoFilter}
            onChange={(e) => setTipoFilter(e.target.value as TipoAuditoria | '')}
            options={TIPO_AUDITORIA_OPTIONS}
          />
        </div>
        <Button onClick={() => onOpenModal()}>
          <Plus className="w-4 h-4 mr-2" />
          Nueva Auditoría
        </Button>
      </div>

      {/* Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Código
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Título
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Norma
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Hallazgos
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Auditor Líder
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Fecha
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {auditorias.map((auditoria) => (
                <tr key={auditoria.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {auditoria.codigo}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                    {auditoria.titulo}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant="default">
                      {auditoria.tipo_display ?? formatStatusLabel(auditoria.tipo)}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                    {auditoria.norma_principal_display ?? auditoria.norma_principal}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge
                      status={auditoria.estado}
                      variant={getEstadoBadgeColor(auditoria.estado)}
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {auditoria.total_hallazgos}
                      </span>
                      {auditoria.no_conformidades_mayores > 0 && (
                        <Badge variant="danger" size="sm">
                          {auditoria.no_conformidades_mayores} NC Mayor
                        </Badge>
                      )}
                      {auditoria.no_conformidades_menores > 0 && (
                        <Badge variant="warning" size="sm">
                          {auditoria.no_conformidades_menores} NC Menor
                        </Badge>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                    {auditoria.auditor_lider_nombre ?? 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                    {format(new Date(auditoria.fecha_planificada_inicio), 'dd/MM/yyyy', {
                      locale: es,
                    })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => onOpenModal(auditoria)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setDeleteId(auditoria.id)}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <ConfirmDialog
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={() => {
          if (deleteId) {
            deleteMutation.mutate(deleteId);
            setDeleteId(null);
          }
        }}
        title="Eliminar Auditoría"
        message="¿Está seguro de eliminar esta auditoría? Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        variant="danger"
      />
    </div>
  );
};

// ==================== HALLAZGOS SECTION ====================

interface HallazgosProps {
  onOpenModal: (item?: HallazgoList) => void;
}

const HallazgosSection = ({ onOpenModal }: HallazgosProps) => {
  const [impactoFilter, setImpactoFilter] = useState<ImpactoHallazgo | ''>('');

  const queryParams = useMemo(() => {
    const params: Record<string, unknown> = {};
    if (impactoFilter) params.impacto = impactoFilter;
    return Object.keys(params).length > 0 ? params : undefined;
  }, [impactoFilter]);

  const { data, isLoading } = useHallazgos(queryParams);
  const deleteMutation = useDeleteHallazgo();
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const hallazgos = data?.results ?? [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner />
      </div>
    );
  }

  if (hallazgos.length === 0) {
    return (
      <EmptyState
        icon={<AlertOctagon className="w-16 h-16" />}
        title="No hay hallazgos registrados"
        description="Los hallazgos de auditoría se registrarán aquí automáticamente"
        action={{
          label: 'Nuevo Hallazgo',
          onClick: () => onOpenModal(),
          icon: <Plus className="w-4 h-4" />,
        }}
      />
    );
  }

  const stats = {
    total: hallazgos.length,
    ncMayor: hallazgos.filter((h) => h.tipo === 'NO_CONFORMIDAD_MAYOR').length,
    ncMenor: hallazgos.filter((h) => h.tipo === 'NO_CONFORMIDAD_MENOR').length,
    observaciones: hallazgos.filter((h) => h.tipo === 'OBSERVACION').length,
    oportunidades: hallazgos.filter((h) => h.tipo === 'OPORTUNIDAD_MEJORA').length,
  };

  const getTipoBadgeVariant = (tipo: string): 'danger' | 'warning' | 'default' | 'success' => {
    if (tipo === 'NO_CONFORMIDAD_MAYOR') return 'danger';
    if (tipo === 'NO_CONFORMIDAD_MENOR') return 'warning';
    if (tipo === 'OPORTUNIDAD_MEJORA') return 'success';
    return 'default';
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <KpiCardGrid>
        <KpiCard
          label="Total Hallazgos"
          value={stats.total}
          icon={<AlertOctagon className="w-5 h-5" />}
          color="primary"
        />
        <KpiCard
          label="NC Mayores"
          value={stats.ncMayor}
          icon={<XCircle className="w-5 h-5" />}
          color="danger"
        />
        <KpiCard
          label="NC Menores"
          value={stats.ncMenor}
          icon={<AlertOctagon className="w-5 h-5" />}
          color="warning"
        />
        <KpiCard
          label="Oportunidades"
          value={stats.oportunidades}
          icon={<TrendingUp className="w-5 h-5" />}
          color="success"
        />
      </KpiCardGrid>

      {/* Filter + Actions */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Filter className="w-4 h-4 text-gray-500 flex-shrink-0" />
          <Select
            value={impactoFilter}
            onChange={(e) => setImpactoFilter(e.target.value as ImpactoHallazgo | '')}
            options={IMPACTO_OPTIONS}
          />
        </div>
        <Button onClick={() => onOpenModal()}>
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Hallazgo
        </Button>
      </div>

      {/* Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Código
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Título
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Impacto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Proceso/Área
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Responsable
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Fecha Detección
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Días Abierto
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {hallazgos.map((hallazgo) => (
                <tr key={hallazgo.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {hallazgo.codigo}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                    {hallazgo.titulo}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant={getTipoBadgeVariant(hallazgo.tipo)}>
                      {hallazgo.tipo_display ?? formatStatusLabel(hallazgo.tipo)}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge
                      status={hallazgo.estado}
                      variant={getEstadoBadgeColor(hallazgo.estado)}
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {hallazgo.impacto ? (
                      <Badge variant={getImpactoBadgeVariant(hallazgo.impacto)}>
                        {hallazgo.impacto_display ?? hallazgo.impacto}
                      </Badge>
                    ) : (
                      <span className="text-xs text-gray-400">--</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                    {hallazgo.proceso_area}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                    {hallazgo.responsable_proceso_nombre ?? 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                    {format(new Date(hallazgo.fecha_deteccion), 'dd/MM/yyyy', { locale: es })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {hallazgo.dias_abierto !== undefined && (
                      <Badge
                        variant={
                          hallazgo.dias_abierto > 30
                            ? 'danger'
                            : hallazgo.dias_abierto > 15
                              ? 'warning'
                              : 'default'
                        }
                      >
                        {hallazgo.dias_abierto} días
                      </Badge>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => onOpenModal(hallazgo)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setDeleteId(hallazgo.id)}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <ConfirmDialog
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={() => {
          if (deleteId) {
            deleteMutation.mutate(deleteId);
            setDeleteId(null);
          }
        }}
        title="Eliminar Hallazgo"
        message="¿Está seguro de eliminar este hallazgo? Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        variant="danger"
      />
    </div>
  );
};

// ==================== EVALUACIÓN CUMPLIMIENTO SECTION ====================

interface EvaluacionesCumplimientoProps {
  onOpenModal: (item?: EvaluacionCumplimientoList) => void;
}

const EvaluacionesCumplimientoSection = ({ onOpenModal }: EvaluacionesCumplimientoProps) => {
  const { data, isLoading } = useEvaluacionesCumplimiento();
  const deleteMutation = useDeleteEvaluacionCumplimiento();
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const evaluaciones = data?.results ?? [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner />
      </div>
    );
  }

  if (evaluaciones.length === 0) {
    return (
      <EmptyState
        icon={<Scale className="w-16 h-16" />}
        title="No hay evaluaciones de cumplimiento registradas"
        description="Comience registrando evaluaciones de cumplimiento legal y normativo"
        action={{
          label: 'Nueva Evaluación',
          onClick: () => onOpenModal(),
          icon: <Plus className="w-4 h-4" />,
        }}
      />
    );
  }

  const stats = {
    total: evaluaciones.length,
    cumple: evaluaciones.filter((e) => e.resultado === 'CUMPLE').length,
    cumpleParcial: evaluaciones.filter((e) => e.resultado === 'CUMPLE_PARCIAL').length,
    noCumple: evaluaciones.filter((e) => e.resultado === 'NO_CUMPLE').length,
  };

  const getResultadoBadgeVariant = (
    resultado: string
  ): 'success' | 'warning' | 'danger' | 'default' => {
    if (resultado === 'CUMPLE') return 'success';
    if (resultado === 'CUMPLE_PARCIAL') return 'warning';
    if (resultado === 'NO_CUMPLE') return 'danger';
    return 'default';
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <KpiCardGrid>
        <KpiCard
          label="Total Evaluaciones"
          value={stats.total}
          icon={<Scale className="w-5 h-5" />}
          color="primary"
        />
        <KpiCard
          label="Cumple"
          value={stats.cumple}
          icon={<CheckCircle className="w-5 h-5" />}
          color="success"
        />
        <KpiCard
          label="Cumple Parcial"
          value={stats.cumpleParcial}
          icon={<Clock className="w-5 h-5" />}
          color="warning"
        />
        <KpiCard
          label="No Cumple"
          value={stats.noCumple}
          icon={<XCircle className="w-5 h-5" />}
          color="danger"
        />
      </KpiCardGrid>

      {/* Actions */}
      <SectionToolbar
        title="Evaluaciones de Cumplimiento"
        primaryAction={{ label: 'Nueva Evaluación', onClick: () => onOpenModal() }}
      />

      {/* Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Código
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Nombre
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Resultado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  % Cumplimiento
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Fecha Evaluación
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Próxima Evaluación
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Responsable
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {evaluaciones.map((evaluacion) => (
                <tr key={evaluacion.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {evaluacion.codigo}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                    {evaluacion.nombre}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant="default">
                      {evaluacion.tipo_display ?? formatStatusLabel(evaluacion.tipo)}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant={getResultadoBadgeVariant(evaluacion.resultado)}>
                      {evaluacion.resultado_display ?? formatStatusLabel(evaluacion.resultado)}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Progress value={evaluacion.porcentaje_cumplimiento} className="w-20" />
                      <span className="text-sm font-medium">
                        {evaluacion.porcentaje_cumplimiento}%
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                    {format(new Date(evaluacion.fecha_evaluacion), 'dd/MM/yyyy', { locale: es })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                    {evaluacion.proxima_evaluacion
                      ? format(new Date(evaluacion.proxima_evaluacion), 'dd/MM/yyyy', {
                          locale: es,
                        })
                      : 'N/A'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                    {evaluacion.responsable_cumplimiento_nombre ?? 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => onOpenModal(evaluacion)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setDeleteId(evaluacion.id)}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <ConfirmDialog
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={() => {
          if (deleteId) {
            deleteMutation.mutate(deleteId);
            setDeleteId(null);
          }
        }}
        title="Eliminar Evaluación de Cumplimiento"
        message="¿Está seguro de eliminar esta evaluación? Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        variant="danger"
      />
    </div>
  );
};

// ==================== MAIN PAGE ====================

export const AuditoriasInternasPage = () => {
  const [activeTab, setActiveTab] = useState('programas');
  const [programaModalOpen, setProgramaModalOpen] = useState(false);
  const [auditoriaModalOpen, setAuditoriaModalOpen] = useState(false);
  const [hallazgoModalOpen, setHallazgoModalOpen] = useState(false);
  const [evaluacionModalOpen, setEvaluacionModalOpen] = useState(false);
  const [selectedPrograma, setSelectedPrograma] = useState<ProgramaAuditoriaList | undefined>();
  const [selectedAuditoria, setSelectedAuditoria] = useState<AuditoriaList | undefined>();
  const [selectedHallazgo, setSelectedHallazgo] = useState<HallazgoList | undefined>();
  const [selectedEvaluacion, setSelectedEvaluacion] = useState<
    EvaluacionCumplimientoList | undefined
  >();

  // Suppress unused variable warning — MODULE_CODE used for route guard context
  void MODULE_CODE;

  const tabs = [
    {
      id: 'programas',
      label: 'Programas Auditoría',
      icon: <ClipboardCheck className="w-4 h-4" />,
    },
    {
      id: 'auditorias',
      label: 'Auditorías',
      icon: <FileCheck className="w-4 h-4" />,
    },
    {
      id: 'hallazgos',
      label: 'Hallazgos',
      icon: <AlertOctagon className="w-4 h-4" />,
    },
    {
      id: 'cumplimiento',
      label: 'Eval. Cumplimiento',
      icon: <Scale className="w-4 h-4" />,
    },
  ];

  const handleOpenProgramaModal = (item?: ProgramaAuditoriaList) => {
    setSelectedPrograma(item);
    setProgramaModalOpen(true);
  };

  const handleCloseProgramaModal = () => {
    setSelectedPrograma(undefined);
    setProgramaModalOpen(false);
  };

  const handleOpenAuditoriaModal = (item?: AuditoriaList) => {
    setSelectedAuditoria(item);
    setAuditoriaModalOpen(true);
  };

  const handleCloseAuditoriaModal = () => {
    setSelectedAuditoria(undefined);
    setAuditoriaModalOpen(false);
  };

  const handleOpenHallazgoModal = (item?: HallazgoList) => {
    setSelectedHallazgo(item);
    setHallazgoModalOpen(true);
  };

  const handleCloseHallazgoModal = () => {
    setSelectedHallazgo(undefined);
    setHallazgoModalOpen(false);
  };

  const handleOpenEvaluacionModal = (item?: EvaluacionCumplimientoList) => {
    setSelectedEvaluacion(item);
    setEvaluacionModalOpen(true);
  };

  const handleCloseEvaluacionModal = () => {
    setSelectedEvaluacion(undefined);
    setEvaluacionModalOpen(false);
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Auditorías Internas"
        description="Programas de auditoría, ejecución, hallazgos y evaluación de cumplimiento del sistema de gestión"
      />

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} variant="pills" />

      <div className="mt-6">
        {activeTab === 'programas' && (
          <ProgramasAuditoriaSection onOpenModal={handleOpenProgramaModal} />
        )}
        {activeTab === 'auditorias' && <AuditoriasSection onOpenModal={handleOpenAuditoriaModal} />}
        {activeTab === 'hallazgos' && <HallazgosSection onOpenModal={handleOpenHallazgoModal} />}
        {activeTab === 'cumplimiento' && (
          <EvaluacionesCumplimientoSection onOpenModal={handleOpenEvaluacionModal} />
        )}
      </div>

      {/* Modals */}
      <ProgramaAuditoriaFormModal
        item={selectedPrograma ?? null}
        isOpen={programaModalOpen}
        onClose={handleCloseProgramaModal}
      />
      <AuditoriaFormModal
        item={selectedAuditoria ?? null}
        isOpen={auditoriaModalOpen}
        onClose={handleCloseAuditoriaModal}
      />
      <HallazgoFormModal
        item={selectedHallazgo ?? null}
        isOpen={hallazgoModalOpen}
        onClose={handleCloseHallazgoModal}
      />
      <EvaluacionCumplimientoFormModal
        item={selectedEvaluacion ?? null}
        isOpen={evaluacionModalOpen}
        onClose={handleCloseEvaluacionModal}
      />
    </div>
  );
};

export default AuditoriasInternasPage;
