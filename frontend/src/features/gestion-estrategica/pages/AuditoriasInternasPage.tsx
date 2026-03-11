/**
 * Página: Auditorías Internas - Sistema de Gestión
 * 4 tabs: Programas Auditoría, Auditorías, Hallazgos, Evaluación Cumplimiento
 * Design System: ResponsiveTable + RBAC per section + FSM transitions
 */
import { useState, useMemo } from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import { Modules, Sections } from '@/constants/permissions';
import {
  ClipboardCheck,
  FileCheck,
  AlertOctagon,
  Scale,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  FileText,
  Filter,
  Play,
  Flag,
  Lock,
  Send,
  Wrench,
  CheckSquare,
} from 'lucide-react';
import { PageHeader } from '@/components/layout';
import {
  Tabs,
  EmptyState,
  KpiCard,
  KpiCardGrid,
  SectionToolbar,
  StatusBadge,
  Badge,
  Progress,
  ConfirmDialog,
  Button,
  ResponsiveTable,
} from '@/components/common';
import type { ResponsiveTableColumn } from '@/components/common';
import { Select, Textarea, Checkbox } from '@/components/forms';
import { formatStatusLabel } from '@/components/common/StatusBadge';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import {
  useProgramasAuditoria,
  useDeleteProgramaAuditoria,
  useAprobarProgramaAuditoria,
  useIniciarProgramaAuditoria,
  useCompletarProgramaAuditoria,
  useAuditorias,
  useDeleteAuditoria,
  useIniciarAuditoria,
  useCerrarAuditoria,
  useHallazgos,
  useDeleteHallazgo,
  useComunicarHallazgo,
  useIniciarTratamientoHallazgo,
  useVerificarHallazgo,
  useCerrarHallazgo,
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

// ==================== UTILITY FUNCTIONS ====================

const getEstadoBadgeColor = (estado: string): 'default' | 'success' | 'warning' | 'danger' => {
  const e = estado.toUpperCase();
  if (
    e.includes('COMPLETADO') ||
    e.includes('CERRAD') ||
    e.includes('APROBADO') ||
    e.includes('VERIFICADO')
  )
    return 'success';
  if (
    e.includes('EJECUCION') ||
    e.includes('PROCESO') ||
    e.includes('TRATAMIENTO') ||
    e.includes('PLANIFICAD')
  )
    return 'warning';
  if (e.includes('CANCELAD')) return 'danger';
  return 'default';
};

const getTipoBadgeVariant = (tipo: string): 'danger' | 'warning' | 'default' | 'success' => {
  if (tipo === 'NO_CONFORMIDAD_MAYOR') return 'danger';
  if (tipo === 'NO_CONFORMIDAD_MENOR') return 'warning';
  if (tipo === 'OPORTUNIDAD_MEJORA' || tipo === 'FORTALEZA') return 'success';
  return 'default';
};

const getImpactoBadgeVariant = (impacto: string): 'danger' | 'warning' | 'success' | 'default' => {
  if (impacto === 'ALTO') return 'danger';
  if (impacto === 'MEDIO') return 'warning';
  if (impacto === 'BAJO') return 'success';
  return 'default';
};

const getResultadoBadgeVariant = (
  resultado: string
): 'success' | 'warning' | 'danger' | 'default' => {
  if (resultado === 'CUMPLE') return 'success';
  if (resultado === 'CUMPLE_PARCIAL') return 'warning';
  if (resultado === 'NO_CUMPLE') return 'danger';
  return 'default';
};

// FSM transition maps (inferred from estado since List serializers don't include transiciones_disponibles)
const getProgramaTransitions = (estado: string): string[] => {
  const map: Record<string, string[]> = {
    BORRADOR: ['aprobar'],
    APROBADO: ['iniciar'],
    EN_EJECUCION: ['completar'],
  };
  return map[estado] || [];
};

const getAuditoriaTransitions = (estado: string): string[] => {
  const map: Record<string, string[]> = {
    PROGRAMADA: ['iniciar'],
    PLANIFICADA: ['iniciar'],
    EN_EJECUCION: ['cerrar'],
    INFORME_PENDIENTE: ['cerrar'],
  };
  return map[estado] || [];
};

const getHallazgoTransitions = (estado: string): string[] => {
  const map: Record<string, string[]> = {
    IDENTIFICADO: ['comunicar'],
    COMUNICADO: ['iniciar_tratamiento'],
    EN_TRATAMIENTO: ['verificar'],
    VERIFICADO: ['cerrar'],
  };
  return map[estado] || [];
};

// ==================== FILTER CONSTANTS ====================

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

const TRANSITION_LABELS: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  aprobar: { label: 'Aprobar', icon: <CheckCircle className="w-4 h-4" />, color: 'text-green-500' },
  iniciar: { label: 'Iniciar', icon: <Play className="w-4 h-4" />, color: 'text-blue-500' },
  completar: { label: 'Completar', icon: <Flag className="w-4 h-4" />, color: 'text-green-500' },
  cerrar: { label: 'Cerrar', icon: <Lock className="w-4 h-4" />, color: 'text-green-600' },
  comunicar: { label: 'Comunicar', icon: <Send className="w-4 h-4" />, color: 'text-blue-500' },
  iniciar_tratamiento: {
    label: 'Iniciar Tratamiento',
    icon: <Wrench className="w-4 h-4" />,
    color: 'text-yellow-500',
  },
  verificar: {
    label: 'Verificar',
    icon: <CheckSquare className="w-4 h-4" />,
    color: 'text-green-500',
  },
};

// ==================== PROGRAMAS AUDITORÍA SECTION ====================

interface ProgramasAuditoriaProps {
  onOpenModal: (item?: ProgramaAuditoriaList) => void;
}

const ProgramasAuditoriaSection = ({ onOpenModal }: ProgramasAuditoriaProps) => {
  const { canDo } = usePermissions();
  const canCreate = canDo(Modules.SISTEMA_GESTION, Sections.EJECUCION_AUDITORIA, 'create');
  const canEdit = canDo(Modules.SISTEMA_GESTION, Sections.EJECUCION_AUDITORIA, 'edit');
  const canDelete = canDo(Modules.SISTEMA_GESTION, Sections.EJECUCION_AUDITORIA, 'delete');

  const { data, isLoading } = useProgramasAuditoria();
  const deleteMutation = useDeleteProgramaAuditoria();
  const aprobarMutation = useAprobarProgramaAuditoria();
  const iniciarMutation = useIniciarProgramaAuditoria();
  const completarMutation = useCompletarProgramaAuditoria();

  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [transitionConfirm, setTransitionConfirm] = useState<{ id: number; action: string } | null>(
    null
  );

  const programas = data?.results ?? [];

  const stats = useMemo(
    () => ({
      total: programas.length,
      aprobados: programas.filter((p) => p.estado === 'APROBADO').length,
      enEjecucion: programas.filter((p) => p.estado === 'EN_EJECUCION').length,
      completados: programas.filter((p) => p.estado === 'COMPLETADO').length,
    }),
    [programas]
  );

  const executeTransition = () => {
    if (!transitionConfirm) return;
    const { id, action } = transitionConfirm;
    const mutations: Record<string, { mutate: (id: number, opts?: unknown) => void }> = {
      aprobar: aprobarMutation,
      iniciar: iniciarMutation,
      completar: completarMutation,
    };
    mutations[action]?.mutate(id, { onSettled: () => setTransitionConfirm(null) });
  };

  const columns: ResponsiveTableColumn<ProgramaAuditoriaList>[] = [
    {
      key: 'codigo',
      header: 'Código',
      priority: 1,
      render: (item) => (
        <span className="font-medium text-gray-900 dark:text-white">{item.codigo}</span>
      ),
    },
    {
      key: 'nombre',
      header: 'Nombre',
      priority: 1,
      render: (item) => (
        <span>
          {item.nombre}
          {item.version > 1 && <span className="ml-2 text-xs text-gray-500">v{item.version}</span>}
        </span>
      ),
    },
    { key: 'año', header: 'Año', priority: 3, render: (item) => item.año },
    {
      key: 'estado',
      header: 'Estado',
      priority: 2,
      render: (item) => (
        <StatusBadge
          status={item.estado_display ?? item.estado}
          variant={getEstadoBadgeColor(item.estado)}
        />
      ),
    },
    {
      key: 'avance',
      header: 'Avance',
      priority: 3,
      hideOnTablet: true,
      render: (item) => (
        <div className="flex items-center gap-2">
          <Progress value={item.porcentaje_avance ?? 0} className="w-24" />
          <span className="text-xs text-gray-500">{item.porcentaje_avance ?? 0}%</span>
        </div>
      ),
    },
    {
      key: 'auditorias',
      header: 'Auditorías',
      priority: 4,
      hideOnTablet: true,
      render: (item) => item.cantidad_auditorias ?? 0,
    },
    {
      key: 'responsable',
      header: 'Responsable',
      priority: 3,
      render: (item) => item.responsable_programa_nombre ?? 'N/A',
    },
  ];

  if (programas.length === 0 && !isLoading) {
    return (
      <EmptyState
        icon={<ClipboardCheck className="w-16 h-16" />}
        title="No hay programas de auditoría registrados"
        description="Comience creando un programa de auditoría para planificar las auditorías del sistema de gestión"
        action={canCreate ? { label: 'Nuevo Programa', onClick: () => onOpenModal() } : undefined}
      />
    );
  }

  return (
    <div className="space-y-6">
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

      <SectionToolbar
        title="Programas de Auditoría"
        primaryAction={
          canCreate ? { label: 'Nuevo Programa', onClick: () => onOpenModal() } : undefined
        }
      />

      <ResponsiveTable
        data={programas}
        columns={columns}
        keyExtractor={(item) => item.id}
        isLoading={isLoading}
        emptyMessage="No hay programas de auditoría"
        hoverable
        mobileCardTitle={(item) => `${item.codigo} — ${item.nombre}`}
        mobileCardSubtitle={(item) => item.responsable_programa_nombre ?? ''}
        renderActions={(item) => (
          <div className="flex items-center gap-1">
            {getProgramaTransitions(item.estado).map((transition) => {
              const config = TRANSITION_LABELS[transition];
              if (!config) return null;
              return (
                <Button
                  key={transition}
                  variant="ghost"
                  size="sm"
                  onClick={() => setTransitionConfirm({ id: item.id, action: transition })}
                  title={config.label}
                >
                  <span className={config.color}>{config.icon}</span>
                </Button>
              );
            })}
            {canEdit && (
              <Button variant="ghost" size="sm" onClick={() => onOpenModal(item)} title="Editar">
                <Edit className="w-4 h-4" />
              </Button>
            )}
            {canDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDeleteId(item.id)}
                title="Eliminar"
              >
                <Trash2 className="w-4 h-4 text-red-500" />
              </Button>
            )}
          </div>
        )}
      />

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

      <ConfirmDialog
        isOpen={transitionConfirm !== null}
        onClose={() => setTransitionConfirm(null)}
        onConfirm={executeTransition}
        title={`${TRANSITION_LABELS[transitionConfirm?.action ?? '']?.label ?? ''} Programa`}
        message={`¿Está seguro de ${(TRANSITION_LABELS[transitionConfirm?.action ?? '']?.label ?? '').toLowerCase()} este programa de auditoría?`}
        confirmLabel={TRANSITION_LABELS[transitionConfirm?.action ?? '']?.label ?? 'Confirmar'}
        variant="default"
      />
    </div>
  );
};

// ==================== AUDITORÍAS SECTION ====================

interface AuditoriasProps {
  onOpenModal: (item?: AuditoriaList) => void;
}

const AuditoriasSection = ({ onOpenModal }: AuditoriasProps) => {
  const { canDo } = usePermissions();
  const canCreate = canDo(Modules.SISTEMA_GESTION, Sections.EJECUCION_AUDITORIA, 'create');
  const canEdit = canDo(Modules.SISTEMA_GESTION, Sections.EJECUCION_AUDITORIA, 'edit');
  const canDelete = canDo(Modules.SISTEMA_GESTION, Sections.EJECUCION_AUDITORIA, 'delete');

  const [tipoFilter, setTipoFilter] = useState<TipoAuditoria | ''>('');
  const queryParams = useMemo(() => {
    const params: Record<string, unknown> = {};
    if (tipoFilter) params.tipo = tipoFilter;
    return Object.keys(params).length > 0 ? params : undefined;
  }, [tipoFilter]);

  const { data, isLoading } = useAuditorias(queryParams);
  const deleteMutation = useDeleteAuditoria();
  const iniciarMutation = useIniciarAuditoria();
  const cerrarMutation = useCerrarAuditoria();

  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [transitionConfirm, setTransitionConfirm] = useState<{ id: number; action: string } | null>(
    null
  );

  const auditorias = data?.results ?? [];

  const stats = useMemo(
    () => ({
      total: auditorias.length,
      programadas: auditorias.filter((a) => a.estado === 'PROGRAMADA').length,
      enCurso: auditorias.filter((a) => a.estado === 'EN_EJECUCION').length,
      cerradas: auditorias.filter((a) => a.estado === 'CERRADA').length,
    }),
    [auditorias]
  );

  const executeTransition = () => {
    if (!transitionConfirm) return;
    const { id, action } = transitionConfirm;
    const mutations: Record<string, { mutate: (id: number, opts?: unknown) => void }> = {
      iniciar: iniciarMutation,
      cerrar: cerrarMutation,
    };
    mutations[action]?.mutate(id, { onSettled: () => setTransitionConfirm(null) });
  };

  const columns: ResponsiveTableColumn<AuditoriaList>[] = [
    {
      key: 'codigo',
      header: 'Código',
      priority: 1,
      render: (item) => (
        <span className="font-medium text-gray-900 dark:text-white">{item.codigo}</span>
      ),
    },
    { key: 'titulo', header: 'Título', priority: 1, render: (item) => item.titulo },
    {
      key: 'tipo',
      header: 'Tipo',
      priority: 3,
      render: (item) => (
        <Badge variant="default">{item.tipo_display ?? formatStatusLabel(item.tipo)}</Badge>
      ),
    },
    {
      key: 'norma',
      header: 'Norma',
      priority: 4,
      hideOnTablet: true,
      render: (item) => item.norma_principal_display ?? item.norma_principal,
    },
    {
      key: 'estado',
      header: 'Estado',
      priority: 2,
      render: (item) => (
        <StatusBadge
          status={item.estado_display ?? item.estado}
          variant={getEstadoBadgeColor(item.estado)}
        />
      ),
    },
    {
      key: 'hallazgos',
      header: 'Hallazgos',
      priority: 3,
      render: (item) => (
        <div className="flex items-center gap-1">
          <span className="font-medium">{item.total_hallazgos}</span>
          {item.no_conformidades_mayores > 0 && (
            <Badge variant="danger" size="sm">
              {item.no_conformidades_mayores} NC+
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: 'auditor',
      header: 'Auditor Líder',
      priority: 3,
      hideOnTablet: true,
      render: (item) => item.auditor_lider_nombre ?? 'N/A',
    },
    {
      key: 'fecha',
      header: 'Fecha',
      priority: 4,
      hideOnTablet: true,
      render: (item) =>
        format(new Date(item.fecha_planificada_inicio), 'dd/MM/yyyy', { locale: es }),
    },
  ];

  if (auditorias.length === 0 && !isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Filter className="w-4 h-4 text-gray-500" />
          <Select
            value={tipoFilter}
            onChange={(e) => setTipoFilter(e.target.value as TipoAuditoria | '')}
            options={TIPO_AUDITORIA_OPTIONS}
          />
        </div>
        <EmptyState
          icon={<FileCheck className="w-16 h-16" />}
          title="No hay auditorías registradas"
          description="Comience creando auditorías para evaluar la conformidad del sistema de gestión"
          action={
            canCreate ? { label: 'Nueva Auditoría', onClick: () => onOpenModal() } : undefined
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
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

      <SectionToolbar
        title="Auditorías"
        primaryAction={
          canCreate ? { label: 'Nueva Auditoría', onClick: () => onOpenModal() } : undefined
        }
      >
        <div className="flex items-center gap-3">
          <Filter className="w-4 h-4 text-gray-500" />
          <Select
            value={tipoFilter}
            onChange={(e) => setTipoFilter(e.target.value as TipoAuditoria | '')}
            options={TIPO_AUDITORIA_OPTIONS}
          />
        </div>
      </SectionToolbar>

      <ResponsiveTable
        data={auditorias}
        columns={columns}
        keyExtractor={(item) => item.id}
        isLoading={isLoading}
        emptyMessage="No hay auditorías"
        hoverable
        mobileCardTitle={(item) => `${item.codigo} — ${item.titulo}`}
        mobileCardSubtitle={(item) => item.auditor_lider_nombre ?? ''}
        renderActions={(item) => (
          <div className="flex items-center gap-1">
            {getAuditoriaTransitions(item.estado).map((transition) => {
              const config = TRANSITION_LABELS[transition];
              if (!config) return null;
              return (
                <Button
                  key={transition}
                  variant="ghost"
                  size="sm"
                  onClick={() => setTransitionConfirm({ id: item.id, action: transition })}
                  title={config.label}
                >
                  <span className={config.color}>{config.icon}</span>
                </Button>
              );
            })}
            {canEdit && (
              <Button variant="ghost" size="sm" onClick={() => onOpenModal(item)} title="Editar">
                <Edit className="w-4 h-4" />
              </Button>
            )}
            {canDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDeleteId(item.id)}
                title="Eliminar"
              >
                <Trash2 className="w-4 h-4 text-red-500" />
              </Button>
            )}
          </div>
        )}
      />

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

      <ConfirmDialog
        isOpen={transitionConfirm !== null}
        onClose={() => setTransitionConfirm(null)}
        onConfirm={executeTransition}
        title={`${TRANSITION_LABELS[transitionConfirm?.action ?? '']?.label ?? ''} Auditoría`}
        message={`¿Está seguro de ${(TRANSITION_LABELS[transitionConfirm?.action ?? '']?.label ?? '').toLowerCase()} esta auditoría?`}
        confirmLabel={TRANSITION_LABELS[transitionConfirm?.action ?? '']?.label ?? 'Confirmar'}
        variant="default"
      />
    </div>
  );
};

// ==================== HALLAZGOS SECTION ====================

interface HallazgosProps {
  onOpenModal: (item?: HallazgoList) => void;
}

const HallazgosSection = ({ onOpenModal }: HallazgosProps) => {
  const { canDo } = usePermissions();
  const canCreate = canDo(Modules.SISTEMA_GESTION, Sections.EJECUCION_AUDITORIA, 'create');
  const canEdit = canDo(Modules.SISTEMA_GESTION, Sections.EJECUCION_AUDITORIA, 'edit');
  const canDelete = canDo(Modules.SISTEMA_GESTION, Sections.EJECUCION_AUDITORIA, 'delete');

  const [impactoFilter, setImpactoFilter] = useState<ImpactoHallazgo | ''>('');
  const queryParams = useMemo(() => {
    const params: Record<string, unknown> = {};
    if (impactoFilter) params.impacto = impactoFilter;
    return Object.keys(params).length > 0 ? params : undefined;
  }, [impactoFilter]);

  const { data, isLoading } = useHallazgos(queryParams);
  const deleteMutation = useDeleteHallazgo();
  const comunicarMutation = useComunicarHallazgo();
  const iniciarTratamientoMutation = useIniciarTratamientoHallazgo();
  const verificarMutation = useVerificarHallazgo();
  const cerrarMutation = useCerrarHallazgo();

  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [transitionConfirm, setTransitionConfirm] = useState<{ id: number; action: string } | null>(
    null
  );
  const [verificarData, setVerificarData] = useState<{
    id: number;
    esEficaz: boolean;
    observaciones: string;
  } | null>(null);

  const hallazgos = data?.results ?? [];

  const stats = useMemo(
    () => ({
      total: hallazgos.length,
      ncMayor: hallazgos.filter((h) => h.tipo === 'NO_CONFORMIDAD_MAYOR').length,
      ncMenor: hallazgos.filter((h) => h.tipo === 'NO_CONFORMIDAD_MENOR').length,
      oportunidades: hallazgos.filter((h) => h.tipo === 'OPORTUNIDAD_MEJORA').length,
    }),
    [hallazgos]
  );

  const executeTransition = () => {
    if (!transitionConfirm) return;
    const { id, action } = transitionConfirm;
    if (action === 'verificar') {
      setTransitionConfirm(null);
      setVerificarData({ id, esEficaz: true, observaciones: '' });
      return;
    }
    const mutations: Record<string, { mutate: (id: number, opts?: unknown) => void }> = {
      comunicar: comunicarMutation,
      iniciar_tratamiento: iniciarTratamientoMutation,
      cerrar: cerrarMutation,
    };
    mutations[action]?.mutate(id, { onSettled: () => setTransitionConfirm(null) });
  };

  const executeVerificar = () => {
    if (!verificarData) return;
    verificarMutation.mutate(
      {
        id: verificarData.id,
        datos: { es_eficaz: verificarData.esEficaz, observaciones: verificarData.observaciones },
      },
      { onSettled: () => setVerificarData(null) }
    );
  };

  const columns: ResponsiveTableColumn<HallazgoList>[] = [
    {
      key: 'codigo',
      header: 'Código',
      priority: 1,
      render: (item) => (
        <span className="font-medium text-gray-900 dark:text-white">{item.codigo}</span>
      ),
    },
    { key: 'titulo', header: 'Título', priority: 1, render: (item) => item.titulo },
    {
      key: 'tipo',
      header: 'Tipo',
      priority: 2,
      render: (item) => (
        <Badge variant={getTipoBadgeVariant(item.tipo)}>
          {item.tipo_display ?? formatStatusLabel(item.tipo)}
        </Badge>
      ),
    },
    {
      key: 'estado',
      header: 'Estado',
      priority: 2,
      render: (item) => (
        <StatusBadge
          status={item.estado_display ?? item.estado}
          variant={getEstadoBadgeColor(item.estado)}
        />
      ),
    },
    {
      key: 'impacto',
      header: 'Impacto',
      priority: 3,
      render: (item) =>
        item.impacto ? (
          <Badge variant={getImpactoBadgeVariant(item.impacto)}>
            {item.impacto_display ?? item.impacto}
          </Badge>
        ) : (
          <span className="text-xs text-gray-400">--</span>
        ),
    },
    {
      key: 'proceso',
      header: 'Proceso/Área',
      priority: 4,
      hideOnTablet: true,
      render: (item) => item.proceso_area,
    },
    {
      key: 'responsable',
      header: 'Responsable',
      priority: 3,
      hideOnTablet: true,
      render: (item) => item.responsable_proceso_nombre ?? 'N/A',
    },
    {
      key: 'fecha',
      header: 'Detección',
      priority: 4,
      hideOnTablet: true,
      render: (item) => format(new Date(item.fecha_deteccion), 'dd/MM/yyyy', { locale: es }),
    },
    {
      key: 'dias',
      header: 'Días Abierto',
      priority: 3,
      render: (item) =>
        item.dias_abierto !== undefined ? (
          <Badge
            variant={
              item.dias_abierto > 30 ? 'danger' : item.dias_abierto > 15 ? 'warning' : 'default'
            }
          >
            {item.dias_abierto} días
          </Badge>
        ) : null,
    },
  ];

  if (hallazgos.length === 0 && !isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Filter className="w-4 h-4 text-gray-500" />
          <Select
            value={impactoFilter}
            onChange={(e) => setImpactoFilter(e.target.value as ImpactoHallazgo | '')}
            options={IMPACTO_OPTIONS}
          />
        </div>
        <EmptyState
          icon={<AlertOctagon className="w-16 h-16" />}
          title="No hay hallazgos registrados"
          description="Los hallazgos de auditoría se registrarán aquí"
          action={canCreate ? { label: 'Nuevo Hallazgo', onClick: () => onOpenModal() } : undefined}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
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

      <SectionToolbar
        title="Hallazgos"
        primaryAction={
          canCreate ? { label: 'Nuevo Hallazgo', onClick: () => onOpenModal() } : undefined
        }
      >
        <div className="flex items-center gap-3">
          <Filter className="w-4 h-4 text-gray-500" />
          <Select
            value={impactoFilter}
            onChange={(e) => setImpactoFilter(e.target.value as ImpactoHallazgo | '')}
            options={IMPACTO_OPTIONS}
          />
        </div>
      </SectionToolbar>

      <ResponsiveTable
        data={hallazgos}
        columns={columns}
        keyExtractor={(item) => item.id}
        isLoading={isLoading}
        emptyMessage="No hay hallazgos"
        hoverable
        mobileCardTitle={(item) => `${item.codigo} — ${item.titulo}`}
        mobileCardSubtitle={(item) => item.proceso_area}
        renderActions={(item) => (
          <div className="flex items-center gap-1">
            {getHallazgoTransitions(item.estado).map((transition) => {
              const config = TRANSITION_LABELS[transition];
              if (!config) return null;
              return (
                <Button
                  key={transition}
                  variant="ghost"
                  size="sm"
                  onClick={() => setTransitionConfirm({ id: item.id, action: transition })}
                  title={config.label}
                >
                  <span className={config.color}>{config.icon}</span>
                </Button>
              );
            })}
            {canEdit && (
              <Button variant="ghost" size="sm" onClick={() => onOpenModal(item)} title="Editar">
                <Edit className="w-4 h-4" />
              </Button>
            )}
            {canDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDeleteId(item.id)}
                title="Eliminar"
              >
                <Trash2 className="w-4 h-4 text-red-500" />
              </Button>
            )}
          </div>
        )}
      />

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

      <ConfirmDialog
        isOpen={transitionConfirm !== null}
        onClose={() => setTransitionConfirm(null)}
        onConfirm={executeTransition}
        title={`${TRANSITION_LABELS[transitionConfirm?.action ?? '']?.label ?? ''} Hallazgo`}
        message={`¿Está seguro de ${(TRANSITION_LABELS[transitionConfirm?.action ?? '']?.label ?? '').toLowerCase()} este hallazgo?`}
        confirmLabel={TRANSITION_LABELS[transitionConfirm?.action ?? '']?.label ?? 'Confirmar'}
        variant="default"
      />

      {/* Verificar Hallazgo — requires eficacia + observaciones */}
      <ConfirmDialog
        isOpen={verificarData !== null}
        onClose={() => setVerificarData(null)}
        onConfirm={executeVerificar}
        title="Verificar Hallazgo"
        message=""
        confirmLabel="Verificar"
        variant="default"
      >
        <div className="space-y-4 py-2">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Indique si la acción tomada fue eficaz y agregue observaciones de la verificación.
          </p>
          <Checkbox
            label="La acción fue eficaz"
            checked={verificarData?.esEficaz ?? true}
            onChange={(e) =>
              setVerificarData((prev) =>
                prev ? { ...prev, esEficaz: (e.target as HTMLInputElement).checked } : null
              )
            }
          />
          <Textarea
            label="Observaciones de Verificación"
            value={verificarData?.observaciones ?? ''}
            onChange={(e) =>
              setVerificarData((prev) => (prev ? { ...prev, observaciones: e.target.value } : null))
            }
            placeholder="Resultados de la verificación de eficacia..."
            rows={3}
          />
        </div>
      </ConfirmDialog>
    </div>
  );
};

// ==================== EVALUACIÓN CUMPLIMIENTO SECTION ====================

interface EvaluacionesCumplimientoProps {
  onOpenModal: (item?: EvaluacionCumplimientoList) => void;
}

const EvaluacionesCumplimientoSection = ({ onOpenModal }: EvaluacionesCumplimientoProps) => {
  const { canDo } = usePermissions();
  const canCreate = canDo(Modules.SISTEMA_GESTION, Sections.EJECUCION_AUDITORIA, 'create');
  const canEdit = canDo(Modules.SISTEMA_GESTION, Sections.EJECUCION_AUDITORIA, 'edit');
  const canDelete = canDo(Modules.SISTEMA_GESTION, Sections.EJECUCION_AUDITORIA, 'delete');

  const { data, isLoading } = useEvaluacionesCumplimiento();
  const deleteMutation = useDeleteEvaluacionCumplimiento();
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const evaluaciones = data?.results ?? [];

  const stats = useMemo(
    () => ({
      total: evaluaciones.length,
      cumple: evaluaciones.filter((e) => e.resultado === 'CUMPLE').length,
      cumpleParcial: evaluaciones.filter((e) => e.resultado === 'CUMPLE_PARCIAL').length,
      noCumple: evaluaciones.filter((e) => e.resultado === 'NO_CUMPLE').length,
    }),
    [evaluaciones]
  );

  const columns: ResponsiveTableColumn<EvaluacionCumplimientoList>[] = [
    {
      key: 'codigo',
      header: 'Código',
      priority: 1,
      render: (item) => (
        <span className="font-medium text-gray-900 dark:text-white">{item.codigo}</span>
      ),
    },
    { key: 'nombre', header: 'Nombre', priority: 1, render: (item) => item.nombre },
    {
      key: 'tipo',
      header: 'Tipo',
      priority: 3,
      render: (item) => (
        <Badge variant="default">{item.tipo_display ?? formatStatusLabel(item.tipo)}</Badge>
      ),
    },
    {
      key: 'resultado',
      header: 'Resultado',
      priority: 2,
      render: (item) => (
        <Badge variant={getResultadoBadgeVariant(item.resultado)}>
          {item.resultado_display ?? formatStatusLabel(item.resultado)}
        </Badge>
      ),
    },
    {
      key: 'cumplimiento',
      header: '% Cumpl.',
      priority: 3,
      render: (item) => (
        <div className="flex items-center gap-2">
          <Progress value={item.porcentaje_cumplimiento} className="w-20" />
          <span className="text-sm font-medium">{item.porcentaje_cumplimiento}%</span>
        </div>
      ),
    },
    {
      key: 'fecha',
      header: 'Evaluación',
      priority: 3,
      render: (item) => format(new Date(item.fecha_evaluacion), 'dd/MM/yyyy', { locale: es }),
    },
    {
      key: 'proxima',
      header: 'Próxima',
      priority: 4,
      hideOnTablet: true,
      render: (item) =>
        item.proxima_evaluacion
          ? format(new Date(item.proxima_evaluacion), 'dd/MM/yyyy', { locale: es })
          : 'N/A',
    },
    {
      key: 'responsable',
      header: 'Responsable',
      priority: 4,
      hideOnTablet: true,
      render: (item) => item.responsable_cumplimiento_nombre ?? 'N/A',
    },
  ];

  if (evaluaciones.length === 0 && !isLoading) {
    return (
      <EmptyState
        icon={<Scale className="w-16 h-16" />}
        title="No hay evaluaciones de cumplimiento registradas"
        description="Comience registrando evaluaciones de cumplimiento legal y normativo"
        action={canCreate ? { label: 'Nueva Evaluación', onClick: () => onOpenModal() } : undefined}
      />
    );
  }

  return (
    <div className="space-y-6">
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

      <SectionToolbar
        title="Evaluaciones de Cumplimiento"
        primaryAction={
          canCreate ? { label: 'Nueva Evaluación', onClick: () => onOpenModal() } : undefined
        }
      />

      <ResponsiveTable
        data={evaluaciones}
        columns={columns}
        keyExtractor={(item) => item.id}
        isLoading={isLoading}
        emptyMessage="No hay evaluaciones de cumplimiento"
        hoverable
        mobileCardTitle={(item) => `${item.codigo} — ${item.nombre}`}
        mobileCardSubtitle={(item) => item.responsable_cumplimiento_nombre ?? ''}
        renderActions={(item) => (
          <div className="flex items-center gap-1">
            {canEdit && (
              <Button variant="ghost" size="sm" onClick={() => onOpenModal(item)} title="Editar">
                <Edit className="w-4 h-4" />
              </Button>
            )}
            {canDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDeleteId(item.id)}
                title="Eliminar"
              >
                <Trash2 className="w-4 h-4 text-red-500" />
              </Button>
            )}
          </div>
        )}
      />

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

  const tabs = [
    { id: 'programas', label: 'Programas Auditoría', icon: <ClipboardCheck className="w-4 h-4" /> },
    { id: 'auditorias', label: 'Auditorías', icon: <FileCheck className="w-4 h-4" /> },
    { id: 'hallazgos', label: 'Hallazgos', icon: <AlertOctagon className="w-4 h-4" /> },
    { id: 'cumplimiento', label: 'Eval. Cumplimiento', icon: <Scale className="w-4 h-4" /> },
  ];

  const handleOpenModal = <T,>(
    setter: React.Dispatch<React.SetStateAction<T | undefined>>,
    setOpen: React.Dispatch<React.SetStateAction<boolean>>,
    item?: T
  ) => {
    setter(item);
    setOpen(true);
  };

  const handleCloseModal = <T,>(
    setter: React.Dispatch<React.SetStateAction<T | undefined>>,
    setOpen: React.Dispatch<React.SetStateAction<boolean>>
  ) => {
    setter(undefined);
    setOpen(false);
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
          <ProgramasAuditoriaSection
            onOpenModal={(item) => handleOpenModal(setSelectedPrograma, setProgramaModalOpen, item)}
          />
        )}
        {activeTab === 'auditorias' && (
          <AuditoriasSection
            onOpenModal={(item) =>
              handleOpenModal(setSelectedAuditoria, setAuditoriaModalOpen, item)
            }
          />
        )}
        {activeTab === 'hallazgos' && (
          <HallazgosSection
            onOpenModal={(item) => handleOpenModal(setSelectedHallazgo, setHallazgoModalOpen, item)}
          />
        )}
        {activeTab === 'cumplimiento' && (
          <EvaluacionesCumplimientoSection
            onOpenModal={(item) =>
              handleOpenModal(setSelectedEvaluacion, setEvaluacionModalOpen, item)
            }
          />
        )}
      </div>

      {/* Modals */}
      <ProgramaAuditoriaFormModal
        item={selectedPrograma ?? null}
        isOpen={programaModalOpen}
        onClose={() => handleCloseModal(setSelectedPrograma, setProgramaModalOpen)}
      />
      <AuditoriaFormModal
        item={selectedAuditoria ?? null}
        isOpen={auditoriaModalOpen}
        onClose={() => handleCloseModal(setSelectedAuditoria, setAuditoriaModalOpen)}
      />
      <HallazgoFormModal
        item={selectedHallazgo ?? null}
        isOpen={hallazgoModalOpen}
        onClose={() => handleCloseModal(setSelectedHallazgo, setHallazgoModalOpen)}
      />
      <EvaluacionCumplimientoFormModal
        item={selectedEvaluacion ?? null}
        isOpen={evaluacionModalOpen}
        onClose={() => handleCloseModal(setSelectedEvaluacion, setEvaluacionModalOpen)}
      />
    </div>
  );
};

export default AuditoriasInternasPage;
