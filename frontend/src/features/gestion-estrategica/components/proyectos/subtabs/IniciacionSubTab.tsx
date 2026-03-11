/**
 * SubTab de Iniciación — Workspace por proyecto
 *
 * Flujo automatizado:
 * 1. Proyecto se crea en Portafolio con estado='iniciacion' + sponsor/gerente ya asignados
 * 2. Aquí el usuario: crea el Acta de Constitución → la aprueba → registra partes interesadas
 * 3. Checklist interactivo: click en item → navega al tab/acción correspondiente
 * 4. Resumen del proyecto editable inline (sin tab separado de Configuración)
 *
 * DS: Card + Badge + Button + SectionToolbar + Tabs + Select + BaseModal
 */
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Card, Badge, EmptyState, Button } from '@/components/common';
import { usePermissions } from '@/hooks/usePermissions';
import { Modules, Sections } from '@/constants/permissions';
import { Tabs } from '@/components/common/Tabs';
import { Select } from '@/components/forms';
import { BaseModal } from '@/components/modals/BaseModal';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Input, Textarea } from '@/components/forms';
import {
  useProyectos,
  useProyecto,
  useUpdateProyecto,
  useCambiarEstadoProyecto,
  useCharters,
  useInteresados,
  proyectosKeys,
} from '../../../hooks/useProyectos';
import { useSelectUsers } from '@/hooks/useSelectLists';
import { CharterView } from '../charter/CharterView';
import { StakeholdersSection } from '../stakeholders/StakeholdersSection';
import { MatrizPoderInteres } from '../stakeholders/MatrizPoderInteres';
import type { Proyecto } from '../../../types/proyectos.types';
import type { Tab } from '@/components/common/Tabs';
import {
  FileText,
  Users,
  ClipboardCheck,
  Check,
  Circle,
  Pencil,
  UserCheck,
  ChevronDown,
  ChevronUp,
  ArrowRight,
} from 'lucide-react';

// ==================== CHECKLIST HELPERS ====================

interface ChecklistItem {
  key: string;
  label: string;
  completed: boolean;
  /** Tab al que navegar cuando se hace click */
  targetTab?: string;
  /** Acción especial (abrir modal de edición) */
  targetAction?: 'edit-project';
}

const useInitiationChecklist = (proyectoId: number | null, proyecto?: Proyecto) => {
  const { data: chartersData } = useCharters(proyectoId ? { proyecto: proyectoId } : undefined);
  const { data: interesadosData } = useInteresados(
    proyectoId ? { proyecto: proyectoId, is_active: true } : undefined
  );

  const charters = useMemo(
    () => chartersData?.results ?? (Array.isArray(chartersData) ? chartersData : []),
    [chartersData]
  );
  const interesados = useMemo(
    () => interesadosData?.results ?? (Array.isArray(interesadosData) ? interesadosData : []),
    [interesadosData]
  );

  const checklist: ChecklistItem[] = useMemo(() => {
    if (!proyecto) return [];
    return [
      {
        key: 'sponsor',
        label: 'Sponsor asignado',
        completed: !!proyecto.sponsor_nombre,
        targetAction: 'edit-project',
      },
      {
        key: 'gerente',
        label: 'Gerente de Proyecto asignado',
        completed: !!proyecto.gerente_nombre,
        targetAction: 'edit-project',
      },
      {
        key: 'acta',
        label: 'Acta de Constitución creada',
        completed: charters.length > 0,
        targetTab: 'charter',
      },
      {
        key: 'acta_aprobada',
        label: 'Acta de Constitución aprobada',
        completed: charters.length > 0 && !!charters[0]?.fecha_aprobacion,
        targetTab: 'charter',
      },
      {
        key: 'interesados',
        label: 'Partes interesadas identificadas',
        completed: interesados.length > 0,
        targetTab: 'stakeholders',
      },
    ];
  }, [proyecto, charters, interesados]);

  const completedCount = checklist.filter((c) => c.completed).length;

  return { checklist, completedCount };
};

// ==================== PROGRESS INDICATOR (clickable) ====================

interface ProgressIndicatorProps {
  checklist: ChecklistItem[];
  completedCount: number;
  onItemClick: (item: ChecklistItem) => void;
  onAdvance?: () => void;
  isAdvancing?: boolean;
}

const ProgressIndicator = ({
  checklist,
  completedCount,
  onItemClick,
  onAdvance,
  isAdvancing,
}: ProgressIndicatorProps) => {
  if (checklist.length === 0) return null;
  const pct = (completedCount / checklist.length) * 100;
  const allDone = completedCount === checklist.length;

  return (
    <Card>
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Progreso de Iniciación
          </span>
          <Badge variant={allDone ? 'success' : 'info'} size="sm">
            {completedCount}/{checklist.length}
          </Badge>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-3">
          <div
            className={`h-2 rounded-full transition-all ${allDone ? 'bg-green-500' : 'bg-primary-500'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {checklist.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => !item.completed && onItemClick(item)}
                className={`flex items-center gap-1.5 text-xs transition-colors ${
                  item.completed
                    ? 'text-green-700 dark:text-green-400 cursor-default'
                    : 'text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 cursor-pointer'
                }`}
                title={item.completed ? 'Completado' : `Ir a: ${item.label}`}
              >
                {item.completed ? (
                  <Check className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                ) : (
                  <Circle className="h-3.5 w-3.5" />
                )}
                <span>{item.label}</span>
              </button>
            ))}
          </div>

          {/* Botón avanzar — aparece cuando checklist está completo */}
          {allDone && onAdvance && (
            <Button
              variant="primary"
              size="sm"
              onClick={onAdvance}
              disabled={isAdvancing}
              isLoading={isAdvancing}
            >
              <ArrowRight className="h-4 w-4 mr-1" />
              Avanzar a Planificación
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};

// ==================== TABS CONFIG ====================

const INICIACION_TABS: Tab[] = [
  { id: 'charter', label: 'Acta de Constitución', icon: <FileText className="h-4 w-4" /> },
  { id: 'stakeholders', label: 'Partes Interesadas', icon: <Users className="h-4 w-4" /> },
];

// ==================== COMPONENTE PRINCIPAL ====================

export const IniciacionSubTab = () => {
  const [selectedProyectoId, setSelectedProyectoId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState('charter');
  const [showAdvanceConfirm, setShowAdvanceConfirm] = useState(false);

  const { canDo } = usePermissions();
  const canEdit = canDo(Modules.PLANEACION_ESTRATEGICA, Sections.INICIACION, 'edit');
  const cambiarEstado = useCambiarEstadoProyecto();

  const { data: proyectosData, isLoading } = useProyectos({
    estado: 'iniciacion',
    is_active: true,
  });

  const proyectos: Proyecto[] = useMemo(
    () => proyectosData?.results ?? (Array.isArray(proyectosData) ? proyectosData : []),
    [proyectosData]
  );

  // Auto-seleccionar primer proyecto
  useEffect(() => {
    if (proyectos.length > 0 && !selectedProyectoId) {
      setSelectedProyectoId(proyectos[0].id);
    }
  }, [proyectos, selectedProyectoId]);

  const selectedProyecto = proyectos.find((p) => p.id === selectedProyectoId);

  // Fetch detail actualizado (sponsor_nombre, gerente_nombre, etc.)
  const { data: proyectoDetail } = useProyecto(selectedProyectoId ?? 0);
  // Usar detail como fuente principal — siempre tiene datos frescos post-mutación
  const displayProyecto = proyectoDetail || selectedProyecto;

  const { checklist, completedCount } = useInitiationChecklist(selectedProyectoId, displayProyecto);

  // Handler para checklist clickable
  const handleChecklistClick = useCallback((item: ChecklistItem) => {
    if (item.targetTab) {
      setActiveTab(item.targetTab);
    }
    if (item.targetAction === 'edit-project') {
      // Trigger el modal de edición del ProjectSummary
      // Usamos un evento custom para comunicar sin prop drilling complejo
      window.dispatchEvent(new CustomEvent('open-project-edit'));
    }
  }, []);

  const proyectoOptions = [
    { value: '', label: 'Seleccionar proyecto...' },
    ...proyectos.map((p) => ({
      value: String(p.id),
      label: `${p.codigo} - ${p.nombre}`,
    })),
  ];

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <div className="p-6 animate-pulse-subtle">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4" />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (proyectos.length === 0) {
    return (
      <EmptyState
        icon={<ClipboardCheck className="h-12 w-12" />}
        title="No hay proyectos en iniciación"
        description="Cree un nuevo proyecto desde Portafolio — se asignará automáticamente a esta fase"
      />
    );
  }

  return (
    <div className="space-y-3">
      {/* Selector de proyecto */}
      <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
        <div className="w-full sm:max-w-md">
          <Select
            label="Proyecto"
            value={selectedProyectoId ? String(selectedProyectoId) : ''}
            onChange={(e) => {
              const val = e.target.value;
              setSelectedProyectoId(val ? Number(val) : null);
              setActiveTab('charter');
            }}
            options={proyectoOptions}
          />
        </div>
        {displayProyecto && (
          <div className="flex items-center gap-2 pb-1">
            <Badge variant="info" size="sm">
              {displayProyecto.codigo}
            </Badge>
          </div>
        )}
      </div>

      {selectedProyectoId && displayProyecto && (
        <>
          {/* Resumen del proyecto (inline, siempre visible) */}
          <ProjectSummaryWithEvent
            proyecto={displayProyecto}
            proyectoId={selectedProyectoId}
            canEdit={canEdit}
          />

          {/* Checklist de progreso (clickable) + botón avanzar */}
          <ProgressIndicator
            checklist={checklist}
            completedCount={completedCount}
            onItemClick={handleChecklistClick}
            onAdvance={canEdit ? () => setShowAdvanceConfirm(true) : undefined}
            isAdvancing={cambiarEstado.isPending}
          />

          {/* Tabs */}
          <Tabs
            tabs={INICIACION_TABS}
            activeTab={activeTab}
            onChange={setActiveTab}
            variant="underline"
          />

          {/* Contenido del tab activo */}
          <div className="mt-4">
            {activeTab === 'charter' && <CharterView proyectoId={selectedProyectoId} />}
            {activeTab === 'stakeholders' && (
              <div className="space-y-6">
                <StakeholdersSection proyectoId={selectedProyectoId} />
                <MatrizPoderInteres proyectoId={selectedProyectoId} />
              </div>
            )}
          </div>

          {/* Confirmar avance de fase */}
          <ConfirmDialog
            isOpen={showAdvanceConfirm}
            onClose={() => setShowAdvanceConfirm(false)}
            onConfirm={async () => {
              await cambiarEstado.mutateAsync({
                id: selectedProyectoId!,
                estado: 'planificacion',
              });
              setShowAdvanceConfirm(false);
              setSelectedProyectoId(null);
            }}
            title="Avanzar a Planificación"
            message={`El proyecto "${displayProyecto?.nombre}" pasará a la fase de Planificación. Podrá definir el alcance, cronograma, recursos y presupuesto. ¿Desea continuar?`}
            confirmText="Avanzar"
            variant="info"
            isLoading={cambiarEstado.isPending}
          />
        </>
      )}
    </div>
  );
};

/**
 * Wrapper que escucha el evento 'open-project-edit' para abrir el modal
 * desde el checklist sin prop drilling complejo.
 */
const ProjectSummaryWithEvent = ({
  proyecto,
  proyectoId,
  canEdit = true,
}: {
  proyecto: Proyecto;
  proyectoId: number;
  canEdit?: boolean;
}) => {
  const [forceOpen, setForceOpen] = useState(false);

  useEffect(() => {
    const handler = () => setForceOpen(true);
    window.addEventListener('open-project-edit', handler);
    return () => window.removeEventListener('open-project-edit', handler);
  }, []);

  return (
    <ProjectSummaryControlled
      proyecto={proyecto}
      proyectoId={proyectoId}
      forceOpen={forceOpen}
      onForceOpenHandled={() => setForceOpen(false)}
      canEdit={canEdit}
    />
  );
};

/**
 * ProjectSummary con soporte para apertura forzada del modal
 */
const ProjectSummaryControlled = ({
  proyecto,
  proyectoId,
  forceOpen,
  onForceOpenHandled,
  canEdit = true,
}: {
  proyecto: Proyecto;
  proyectoId: number;
  forceOpen: boolean;
  onForceOpenHandled: () => void;
  canEdit?: boolean;
}) => {
  const updateProyecto = useUpdateProyecto();
  const queryClient = useQueryClient();
  const { data: users = [] } = useSelectUsers();
  const [showEdit, setShowEdit] = useState(false);
  const [expanded, setExpanded] = useState(false);

  // Escuchar forceOpen
  useEffect(() => {
    if (forceOpen) {
      setShowEdit(true);
      onForceOpenHandled();
    }
  }, [forceOpen, onForceOpenHandled]);

  const [form, setForm] = useState({
    sponsor: '',
    gerente_proyecto: '',
    fecha_inicio_plan: '',
    fecha_fin_plan: '',
    justificacion: '',
    beneficios_esperados: '',
    descripcion: '',
  });

  // Re-sync form when proyecto data changes OR when modal opens
  useEffect(() => {
    if (proyecto && showEdit) {
      setForm({
        sponsor: proyecto.sponsor ? String(proyecto.sponsor) : '',
        gerente_proyecto: proyecto.gerente_proyecto ? String(proyecto.gerente_proyecto) : '',
        fecha_inicio_plan: proyecto.fecha_inicio_plan || '',
        fecha_fin_plan: proyecto.fecha_fin_plan || '',
        justificacion: proyecto.justificacion || '',
        beneficios_esperados: proyecto.beneficios_esperados || '',
        descripcion: proyecto.descripcion || '',
      });
    }
  }, [proyecto, showEdit]);

  const handleSave = async () => {
    const data: Record<string, unknown> = {};
    if (form.sponsor) data.sponsor = Number(form.sponsor);
    else data.sponsor = null;
    if (form.gerente_proyecto) data.gerente_proyecto = Number(form.gerente_proyecto);
    else data.gerente_proyecto = null;
    if (form.fecha_inicio_plan) data.fecha_inicio_plan = form.fecha_inicio_plan;
    if (form.fecha_fin_plan) data.fecha_fin_plan = form.fecha_fin_plan;
    if (form.justificacion !== (proyecto?.justificacion || ''))
      data.justificacion = form.justificacion;
    if (form.beneficios_esperados !== (proyecto?.beneficios_esperados || ''))
      data.beneficios_esperados = form.beneficios_esperados;
    if (form.descripcion !== (proyecto?.descripcion || '')) data.descripcion = form.descripcion;

    try {
      await updateProyecto.mutateAsync({ id: proyectoId, data });
      // Esperar a que la query de detalle se refresque con datos frescos
      // antes de cerrar el modal — así displayProyecto + checklist se actualizan inmediatamente
      await queryClient.refetchQueries({ queryKey: proyectosKeys.proyecto(proyectoId) });
      setShowEdit(false);
    } catch {
      // Error manejado por el onError del hook
    }
  };

  const userOptions = [
    { value: '', label: 'Sin asignar' },
    ...users.map((u) => ({ value: String(u.id), label: u.label })),
  ];

  const hasMissing = !proyecto.sponsor_nombre || !proyecto.gerente_nombre;
  const hasExtras = proyecto.descripcion || proyecto.justificacion || proyecto.beneficios_esperados;

  return (
    <>
      <Card>
        <div className="px-4 py-3">
          {/* Fila principal compacta */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0 flex-1 flex-wrap">
              {/* Sponsor */}
              <div className="flex items-center gap-1.5">
                <UserCheck className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                <span className="text-xs text-gray-500">Sponsor:</span>
                <span
                  className={`text-xs font-medium ${
                    proyecto.sponsor_nombre
                      ? 'text-gray-900 dark:text-gray-100'
                      : 'text-amber-600 dark:text-amber-400'
                  }`}
                >
                  {proyecto.sponsor_nombre || 'Sin asignar'}
                </span>
              </div>

              <span className="text-gray-300 dark:text-gray-600 hidden sm:inline">|</span>

              {/* Gerente */}
              <div className="flex items-center gap-1.5">
                <UserCheck className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                <span className="text-xs text-gray-500">Gerente:</span>
                <span
                  className={`text-xs font-medium ${
                    proyecto.gerente_nombre
                      ? 'text-gray-900 dark:text-gray-100'
                      : 'text-amber-600 dark:text-amber-400'
                  }`}
                >
                  {proyecto.gerente_nombre || 'Sin asignar'}
                </span>
              </div>

              <span className="text-gray-300 dark:text-gray-600 hidden sm:inline">|</span>

              {/* Tipo + Prioridad */}
              <div className="flex items-center gap-2">
                <Badge variant="gray" size="sm">
                  {proyecto.tipo_display}
                </Badge>
                <Badge
                  variant={
                    proyecto.prioridad === 'critica'
                      ? 'danger'
                      : proyecto.prioridad === 'alta'
                        ? 'warning'
                        : 'info'
                  }
                  size="sm"
                >
                  {proyecto.prioridad_display}
                </Badge>
              </div>

              {/* Fechas inline */}
              {(proyecto.fecha_inicio_plan || proyecto.fecha_fin_plan) && (
                <>
                  <span className="text-gray-300 dark:text-gray-600 hidden md:inline">|</span>
                  <span className="text-xs text-gray-500 hidden md:inline">
                    {proyecto.fecha_inicio_plan &&
                      new Date(proyecto.fecha_inicio_plan).toLocaleDateString('es-CO')}
                    {proyecto.fecha_inicio_plan && proyecto.fecha_fin_plan && ' → '}
                    {proyecto.fecha_fin_plan &&
                      new Date(proyecto.fecha_fin_plan).toLocaleDateString('es-CO')}
                  </span>
                </>
              )}
            </div>

            {/* Acciones */}
            <div className="flex items-center gap-1 shrink-0">
              {hasExtras && (
                <button
                  type="button"
                  onClick={() => setExpanded(!expanded)}
                  className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  title={expanded ? 'Colapsar' : 'Ver más detalles'}
                >
                  {expanded ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </button>
              )}
              {canEdit && (
                <button
                  type="button"
                  onClick={() => setShowEdit(true)}
                  className={`p-1.5 rounded-md transition-colors ${
                    hasMissing
                      ? 'text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-900/20'
                      : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                  title="Editar datos del proyecto"
                >
                  <Pencil className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Detalles expandibles */}
          {expanded && hasExtras && (
            <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 grid grid-cols-1 md:grid-cols-3 gap-3">
              {proyecto.descripcion && (
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-0.5">
                    Descripción
                  </p>
                  <p className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-line line-clamp-3">
                    {proyecto.descripcion}
                  </p>
                </div>
              )}
              {proyecto.justificacion && (
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-0.5">
                    Justificación
                  </p>
                  <p className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-line line-clamp-3">
                    {proyecto.justificacion}
                  </p>
                </div>
              )}
              {proyecto.beneficios_esperados && (
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-0.5">
                    Beneficios Esperados
                  </p>
                  <p className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-line line-clamp-3">
                    {proyecto.beneficios_esperados}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Modal de edición */}
      <BaseModal
        isOpen={showEdit}
        onClose={() => setShowEdit(false)}
        title="Editar Proyecto"
        subtitle="Actualice los datos clave del proyecto"
        size="2xl"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowEdit(false)}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={handleSave}
              disabled={updateProyecto.isPending}
              isLoading={updateProyecto.isPending}
            >
              Guardar Cambios
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Sponsor"
              value={form.sponsor}
              onChange={(e) => setForm({ ...form, sponsor: e.target.value })}
              options={userOptions}
            />
            <Select
              label="Gerente de Proyecto"
              value={form.gerente_proyecto}
              onChange={(e) => setForm({ ...form, gerente_proyecto: e.target.value })}
              options={userOptions}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Fecha Inicio Planificada"
              type="date"
              value={form.fecha_inicio_plan}
              onChange={(e) => setForm({ ...form, fecha_inicio_plan: e.target.value })}
            />
            <Input
              label="Fecha Fin Planificada"
              type="date"
              value={form.fecha_fin_plan}
              onChange={(e) => setForm({ ...form, fecha_fin_plan: e.target.value })}
            />
          </div>
          <Textarea
            label="Descripción del Proyecto"
            value={form.descripcion}
            onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
            rows={2}
            placeholder="Describir el alcance y objetivos del proyecto..."
          />
          <Textarea
            label="Justificación"
            value={form.justificacion}
            onChange={(e) => setForm({ ...form, justificacion: e.target.value })}
            rows={2}
            placeholder="Razón de ser del proyecto..."
          />
          <Textarea
            label="Beneficios Esperados"
            value={form.beneficios_esperados}
            onChange={(e) => setForm({ ...form, beneficios_esperados: e.target.value })}
            rows={2}
            placeholder="Metas SMART y beneficios esperados..."
          />
        </div>
      </BaseModal>
    </>
  );
};
