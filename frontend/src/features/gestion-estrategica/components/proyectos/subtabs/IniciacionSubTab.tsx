/**
 * SubTab de Iniciación — Workspace por proyecto
 * Selector de proyecto + Tabs: Charter | Stakeholders | Configuración
 * Checklist dinámico como indicador de progreso en header
 */
import { useState, useEffect, useMemo } from 'react';
import { Card, Badge, EmptyState, Button, Spinner } from '@/components/common';
import { SectionToolbar } from '@/components/common/SectionToolbar';
import { Tabs } from '@/components/common/Tabs';
import { Select } from '@/components/forms';
import {
  useProyectos,
  useProyecto,
  useUpdateProyecto,
  useCharters,
  useInteresados,
  useActividades,
} from '../../../hooks/useProyectos';
import { useSelectUsers } from '@/hooks/useSelectLists';
import { BaseModal } from '@/components/modals/BaseModal';
import { Input, Textarea } from '@/components/forms';
import { CharterView } from '../charter/CharterView';
import { StakeholdersSection } from '../stakeholders/StakeholdersSection';
import { MatrizPoderInteres } from '../stakeholders/MatrizPoderInteres';
import type { Proyecto } from '../../../types/proyectos.types';
import type { Tab } from '@/components/common/Tabs';
import {
  FileText,
  Users,
  Target,
  Calendar,
  ClipboardCheck,
  Check,
  Circle,
  Settings,
  Briefcase,
} from 'lucide-react';

// ==================== CHECKLIST HELPERS ====================

interface ChecklistItem {
  key: string;
  label: string;
  completed: boolean;
}

const useInitiationChecklist = (proyectoId: number | null, proyecto?: Proyecto) => {
  const { data: chartersData } = useCharters(proyectoId ? { proyecto: proyectoId } : undefined);
  const { data: interesadosData } = useInteresados(
    proyectoId ? { proyecto: proyectoId, is_active: true } : undefined
  );
  const { data: actividadesData } = useActividades(
    proyectoId ? { proyecto: proyectoId, is_active: true } : undefined
  );

  const charters = chartersData?.results ?? (Array.isArray(chartersData) ? chartersData : []);
  const interesados =
    interesadosData?.results ?? (Array.isArray(interesadosData) ? interesadosData : []);
  const actividades =
    actividadesData?.results ?? (Array.isArray(actividadesData) ? actividadesData : []);

  const checklist: ChecklistItem[] = useMemo(() => {
    if (!proyecto) return [];
    return [
      {
        key: 'sponsor',
        label: 'Sponsor',
        completed: !!proyecto.sponsor_nombre,
      },
      {
        key: 'gerente',
        label: 'Gerente',
        completed: !!proyecto.gerente_nombre,
      },
      {
        key: 'acta',
        label: 'Acta de Constitución',
        completed: charters.length > 0,
      },
      {
        key: 'acta_aprobada',
        label: 'Acta Aprobada',
        completed: charters.length > 0 && !!charters[0]?.fecha_aprobacion,
      },
      {
        key: 'interesados',
        label: 'Partes Interesadas',
        completed: interesados.length > 0,
      },
      {
        key: 'cronograma',
        label: 'Cronograma',
        completed: actividades.length > 0,
      },
    ];
  }, [proyecto, charters, interesados, actividades]);

  const completedCount = checklist.filter((c) => c.completed).length;

  return { checklist, completedCount };
};

// ==================== PROGRESS INDICATOR ====================

const ProgressIndicator = ({
  checklist,
  completedCount,
}: {
  checklist: ChecklistItem[];
  completedCount: number;
}) => {
  if (checklist.length === 0) return null;
  const pct = (completedCount / checklist.length) * 100;

  return (
    <Card>
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Progreso de Iniciación
          </span>
          <Badge variant={completedCount === checklist.length ? 'success' : 'info'} size="sm">
            {completedCount}/{checklist.length}
          </Badge>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-3">
          <div
            className={`h-2 rounded-full transition-all ${
              completedCount === checklist.length ? 'bg-green-500' : 'bg-primary-500'
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          {checklist.map((item) => (
            <div key={item.key} className="flex items-center gap-1.5 text-xs">
              {item.completed ? (
                <Check className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
              ) : (
                <Circle className="h-3.5 w-3.5 text-gray-400" />
              )}
              <span
                className={
                  item.completed
                    ? 'text-green-700 dark:text-green-400'
                    : 'text-gray-500 dark:text-gray-400'
                }
              >
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};

// ==================== CONFIGURACIÓN TAB ====================

interface ConfiguracionTabProps {
  proyectoId: number;
}

const ConfiguracionTab = ({ proyectoId }: ConfiguracionTabProps) => {
  const { data: proyecto, isLoading } = useProyecto(proyectoId);
  const updateProyecto = useUpdateProyecto();
  const { data: users = [] } = useSelectUsers();
  const [showEdit, setShowEdit] = useState(false);

  const [form, setForm] = useState({
    sponsor: '',
    gerente_proyecto: '',
    fecha_inicio_plan: '',
    fecha_fin_plan: '',
    justificacion: '',
    beneficios_esperados: '',
    descripcion: '',
  });

  useEffect(() => {
    if (proyecto) {
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
  }, [proyecto]);

  const handleSave = () => {
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

    updateProyecto.mutate({ id: proyectoId, data }, { onSuccess: () => setShowEdit(false) });
  };

  const userOptions = [
    { value: '', label: 'Sin asignar' },
    ...users.map((u) => ({ value: String(u.value), label: u.label })),
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!proyecto) return null;

  return (
    <>
      <div className="space-y-4">
        <SectionToolbar
          title="Configuración del Proyecto"
          subtitle="Sponsor, gerente, cronograma y justificación"
          primaryAction={{
            label: 'Editar',
            icon: <Settings className="h-4 w-4" />,
            onClick: () => setShowEdit(true),
            variant: 'secondary',
          }}
        />

        <Card>
          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Sponsor</p>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {proyecto.sponsor_nombre || (
                    <span className="text-amber-600 dark:text-amber-400">Sin asignar</span>
                  )}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Gerente de Proyecto
                </p>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {proyecto.gerente_nombre || (
                    <span className="text-amber-600 dark:text-amber-400">Sin asignar</span>
                  )}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Tipo</p>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {proyecto.tipo_display}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Inicio Planificado
                </p>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {proyecto.fecha_inicio_plan ? (
                    new Date(proyecto.fecha_inicio_plan).toLocaleDateString('es-CO')
                  ) : (
                    <span className="text-amber-600 dark:text-amber-400">Sin definir</span>
                  )}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Fin Planificado
                </p>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {proyecto.fecha_fin_plan ? (
                    new Date(proyecto.fecha_fin_plan).toLocaleDateString('es-CO')
                  ) : (
                    <span className="text-amber-600 dark:text-amber-400">Sin definir</span>
                  )}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Prioridad
                </p>
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
            </div>

            {(proyecto.descripcion || proyecto.justificacion || proyecto.beneficios_esperados) && (
              <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
                {proyecto.descripcion && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Descripción
                    </p>
                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">
                      {proyecto.descripcion}
                    </p>
                  </div>
                )}
                {proyecto.justificacion && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Justificación
                    </p>
                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">
                      {proyecto.justificacion}
                    </p>
                  </div>
                )}
                {proyecto.beneficios_esperados && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Beneficios Esperados
                    </p>
                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">
                      {proyecto.beneficios_esperados}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </Card>
      </div>

      <BaseModal
        isOpen={showEdit}
        onClose={() => setShowEdit(false)}
        title="Configurar Proyecto - Iniciación"
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
            rows={3}
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

// ==================== TABS CONFIG ====================

const INICIACION_TABS: Tab[] = [
  { id: 'charter', label: 'Acta de Constitución', icon: <FileText className="h-4 w-4" /> },
  { id: 'stakeholders', label: 'Partes Interesadas', icon: <Users className="h-4 w-4" /> },
  { id: 'config', label: 'Configuración', icon: <Settings className="h-4 w-4" /> },
];

// ==================== COMPONENTE PRINCIPAL ====================

export const IniciacionSubTab = () => {
  const [selectedProyectoId, setSelectedProyectoId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState('charter');

  const { data: proyectosData, isLoading } = useProyectos({
    estado: 'iniciacion',
    is_active: true,
  });

  const proyectos: Proyecto[] =
    proyectosData?.results ?? (Array.isArray(proyectosData) ? proyectosData : []);

  // Auto-select first project
  useEffect(() => {
    if (proyectos.length > 0 && !selectedProyectoId) {
      setSelectedProyectoId(proyectos[0].id);
    }
  }, [proyectos, selectedProyectoId]);

  const selectedProyecto = proyectos.find((p) => p.id === selectedProyectoId);

  const { checklist, completedCount } = useInitiationChecklist(
    selectedProyectoId,
    selectedProyecto
  );

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
        description="Los proyectos pasan a esta fase desde el Kanban en Portafolio"
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Project Selector */}
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
        {selectedProyecto && (
          <div className="flex items-center gap-2 pb-1">
            <Badge variant="info" size="sm">
              {selectedProyecto.codigo}
            </Badge>
            <Badge
              variant={
                selectedProyecto.prioridad === 'critica'
                  ? 'danger'
                  : selectedProyecto.prioridad === 'alta'
                    ? 'warning'
                    : 'info'
              }
              size="sm"
            >
              {selectedProyecto.prioridad_display}
            </Badge>
          </div>
        )}
      </div>

      {selectedProyectoId && (
        <>
          {/* Progress Indicator */}
          <ProgressIndicator checklist={checklist} completedCount={completedCount} />

          {/* Tabs */}
          <Tabs
            tabs={INICIACION_TABS}
            activeTab={activeTab}
            onChange={setActiveTab}
            variant="underline"
          />

          {/* Tab Content */}
          <div className="mt-4">
            {activeTab === 'charter' && <CharterView proyectoId={selectedProyectoId} />}
            {activeTab === 'stakeholders' && (
              <div className="space-y-6">
                <StakeholdersSection proyectoId={selectedProyectoId} />
                <MatrizPoderInteres proyectoId={selectedProyectoId} />
              </div>
            )}
            {activeTab === 'config' && <ConfiguracionTab proyectoId={selectedProyectoId} />}
          </div>
        </>
      )}
    </div>
  );
};
