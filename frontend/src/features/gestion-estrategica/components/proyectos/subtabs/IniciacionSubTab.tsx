/**
 * SubTab de Iniciación
 * Workspace para proyectos en fase de iniciación
 * Enfocado en charter, stakeholders, objetivos y cronograma preliminar
 *
 * Funcionalidad:
 * - Tarjetas con checklist dinámico por proyecto
 * - Modal de edición para asignar sponsor, gerente, fechas, justificación
 */
import { useState, useEffect } from 'react';
import { Card, Badge, EmptyState, SectionHeader, Spinner, Button } from '@/components/common';
import { StatsGrid } from '@/components/layout/StatsGrid';
import { useProyectos, useProyecto, useUpdateProyecto } from '../../../hooks/useProyectos';
import { useSelectUsers } from '@/hooks/useSelectLists';
import { BaseModal } from '@/components/modals/BaseModal';
import { Input, Select, Textarea } from '@/components/forms';
import type { Proyecto } from '../../../types/proyectos.types';
import {
  FileText,
  Users,
  Target,
  Calendar,
  ClipboardCheck,
  Pencil,
  Briefcase,
  AlertCircle,
  Check,
  Circle,
} from 'lucide-react';

// ==================== CHECKLIST HELPERS ====================

interface ChecklistItem {
  key: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  completed: boolean;
}

const getProjectChecklist = (proyecto: Proyecto): ChecklistItem[] => [
  {
    key: 'justificacion',
    label: 'Acta de Constitución',
    description: 'Justificación y descripción documentadas',
    icon: <FileText className="h-4 w-4" />,
    completed: !!(proyecto.justificacion && proyecto.descripcion),
  },
  {
    key: 'stakeholders',
    label: 'Stakeholders',
    description: 'Sponsor y gerente asignados',
    icon: <Users className="h-4 w-4" />,
    completed: !!(proyecto.sponsor_nombre && proyecto.gerente_nombre),
  },
  {
    key: 'objetivos',
    label: 'Objetivos del Proyecto',
    description: 'Beneficios esperados definidos',
    icon: <Target className="h-4 w-4" />,
    completed: !!proyecto.beneficios_esperados,
  },
  {
    key: 'cronograma',
    label: 'Cronograma Preliminar',
    description: 'Fechas de inicio y fin estimadas',
    icon: <Calendar className="h-4 w-4" />,
    completed: !!(proyecto.fecha_inicio_plan && proyecto.fecha_fin_plan),
  },
];

// ==================== MODAL EDICIÓN PROYECTO ====================

interface ProyectoEditModalProps {
  proyectoId: number;
  isOpen: boolean;
  onClose: () => void;
}

const ProyectoEditModal = ({ proyectoId, isOpen, onClose }: ProyectoEditModalProps) => {
  const { data: proyecto, isLoading } = useProyecto(proyectoId);
  const updateProyecto = useUpdateProyecto();
  const { data: users = [] } = useSelectUsers();

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

    updateProyecto.mutate(
      { id: proyectoId, data },
      {
        onSuccess: () => onClose(),
      }
    );
  };

  const userOptions = [
    { value: '', label: 'Sin asignar' },
    ...users.map((u) => ({ value: String(u.value), label: u.label })),
  ];

  const checklist = proyecto ? getProjectChecklist(proyecto) : [];
  const completedCount = checklist.filter((c) => c.completed).length;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Configurar Proyecto - Iniciación"
      size="2xl"
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleSave} disabled={updateProyecto.isPending}>
            {updateProyecto.isPending ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </div>
      }
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : proyecto ? (
        <div className="space-y-6">
          {/* Header del proyecto */}
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="info" size="sm">
              {proyecto.codigo}
            </Badge>
            <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {proyecto.nombre}
            </span>
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

          {/* Progreso del checklist */}
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-purple-900 dark:text-purple-200">
                Progreso de Iniciación
              </span>
              <span className="text-sm font-bold text-purple-600 dark:text-purple-400">
                {completedCount}/{checklist.length}
              </span>
            </div>
            <div className="w-full bg-purple-200 dark:bg-purple-800 rounded-full h-2">
              <div
                className="bg-purple-600 h-2 rounded-full transition-all"
                style={{ width: `${(completedCount / checklist.length) * 100}%` }}
              />
            </div>
            <div className="flex gap-4 mt-3">
              {checklist.map((item) => (
                <div key={item.key} className="flex items-center gap-1.5 text-xs">
                  {item.completed ? (
                    <Check className="h-3.5 w-3.5 text-green-600" />
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

          {/* Sección: Stakeholders */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-600" />
              Stakeholders
            </h4>
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
          </div>

          {/* Sección: Cronograma */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-orange-600" />
              Cronograma Preliminar
            </h4>
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
          </div>

          {/* Sección: Acta de Constitución */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
              <FileText className="h-4 w-4 text-purple-600" />
              Acta de Constitución
            </h4>
            <div className="space-y-4">
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
            </div>
          </div>

          {/* Sección: Objetivos */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
              <Target className="h-4 w-4 text-green-600" />
              Objetivos y Beneficios
            </h4>
            <Textarea
              label="Beneficios Esperados"
              value={form.beneficios_esperados}
              onChange={(e) => setForm({ ...form, beneficios_esperados: e.target.value })}
              rows={2}
              placeholder="Metas SMART y beneficios esperados..."
            />
          </div>
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500">No se encontró el proyecto</div>
      )}
    </BaseModal>
  );
};

// ==================== COMPONENTE PRINCIPAL ====================

export const IniciacionSubTab = () => {
  const [editProjectId, setEditProjectId] = useState<number | null>(null);
  const { data: proyectosData, isLoading } = useProyectos({
    estado: 'iniciacion',
    is_active: true,
  });

  const proyectos: Proyecto[] =
    proyectosData?.results ?? (Array.isArray(proyectosData) ? proyectosData : []);

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

  return (
    <div className="space-y-6">
      {/* Header DS */}
      <SectionHeader
        icon={
          <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
            <ClipboardCheck className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          </div>
        }
        title="Fase de Iniciación"
        description="Proyectos en fase de iniciación - Definición de charter y acta de constitución"
        actions={
          proyectos.length > 0 ? (
            <Badge variant="info" size="sm">
              {proyectos.length} proyecto{proyectos.length !== 1 ? 's' : ''}
            </Badge>
          ) : undefined
        }
      />

      {/* Stats rápidos */}
      {proyectos.length > 0 && (
        <StatsGrid
          columns={4}
          variant="compact"
          stats={[
            {
              label: 'En Iniciación',
              value: proyectos.length,
              icon: Briefcase,
              iconColor: 'primary',
            },
            {
              label: 'Con Sponsor',
              value: proyectos.filter((p) => p.sponsor_nombre).length,
              icon: Users,
              iconColor: 'success',
            },
            {
              label: 'Con Gerente',
              value: proyectos.filter((p) => p.gerente_nombre).length,
              icon: Target,
              iconColor: 'info',
            },
            {
              label: 'Sin fechas',
              value: proyectos.filter((p) => !p.fecha_inicio_plan).length,
              icon: AlertCircle,
              iconColor: 'warning',
            },
          ]}
        />
      )}

      {/* Lista de Proyectos con Checklist dinámico */}
      {proyectos.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {proyectos.map((proyecto) => {
            const checklist = getProjectChecklist(proyecto);
            const completedCount = checklist.filter((c) => c.completed).length;

            return (
              <Card key={proyecto.id}>
                <div className="p-6">
                  {/* Header del proyecto */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">
                          {proyecto.nombre}
                        </h3>
                        <Badge variant="info" size="sm">
                          {proyecto.codigo}
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
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                        {proyecto.descripcion || 'Sin descripción'}
                      </p>
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setEditProjectId(proyecto.id)}
                    >
                      <Pencil className="h-4 w-4 mr-1.5" />
                      Configurar
                    </Button>
                  </div>

                  {/* Info principal */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Sponsor</span>
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {proyecto.sponsor_nombre || (
                          <span className="text-amber-600 dark:text-amber-400">Sin asignar</span>
                        )}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Gerente</span>
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {proyecto.gerente_nombre || (
                          <span className="text-amber-600 dark:text-amber-400">Sin asignar</span>
                        )}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Inicio planificado</span>
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {proyecto.fecha_inicio_plan ? (
                          new Date(proyecto.fecha_inicio_plan).toLocaleDateString('es-CO')
                        ) : (
                          <span className="text-amber-600 dark:text-amber-400">Sin definir</span>
                        )}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Tipo</span>
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {proyecto.tipo_display}
                      </p>
                    </div>
                  </div>

                  {/* Checklist dinámico */}
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Checklist de Iniciación
                      </span>
                      <span className="text-xs font-bold text-purple-600 dark:text-purple-400">
                        {completedCount}/{checklist.length} completados
                      </span>
                    </div>
                    {/* Progress bar */}
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mb-3">
                      <div
                        className={`h-1.5 rounded-full transition-all ${
                          completedCount === checklist.length ? 'bg-green-500' : 'bg-purple-500'
                        }`}
                        style={{ width: `${(completedCount / checklist.length) * 100}%` }}
                      />
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {checklist.map((item) => (
                        <div
                          key={item.key}
                          className={`flex items-center gap-2 rounded-md px-2.5 py-1.5 text-xs ${
                            item.completed
                              ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                              : 'bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400'
                          }`}
                        >
                          {item.completed ? (
                            <Check className="h-3.5 w-3.5 shrink-0" />
                          ) : (
                            <Circle className="h-3.5 w-3.5 shrink-0" />
                          )}
                          <span className="truncate">{item.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={<ClipboardCheck className="h-12 w-12" />}
          title="No hay proyectos en iniciación"
          description="Los proyectos pasan a esta fase desde el Kanban en Portafolio"
        />
      )}

      {/* Modal Edición Proyecto */}
      {editProjectId && (
        <ProyectoEditModal
          proyectoId={editProjectId}
          isOpen={!!editProjectId}
          onClose={() => setEditProjectId(null)}
        />
      )}
    </div>
  );
};
