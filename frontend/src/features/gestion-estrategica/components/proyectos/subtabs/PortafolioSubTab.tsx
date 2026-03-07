/**
 * SubTab de Portafolio - Gestión de Proyectos PMI
 *
 * Layout según Catálogo de Vistas UI:
 * - SectionHeader con título, contador, toggle de vista y botón de acción
 * - Contenido: Dashboard con KPIs o Vista Kanban
 *
 * El toggle Dashboard/Kanban está integrado en el SectionHeader (no como tabs separados)
 */
import { useState } from 'react';
import {
  Briefcase,
  LayoutDashboard,
  KanbanSquare,
  Plus,
  User,
  Calendar,
  Target,
  TrendingUp,
} from 'lucide-react';
import { SectionHeader, Button, ViewToggle, Badge, Spinner } from '@/components/common';
import { BaseModal } from '@/components/modals/BaseModal';
import { Input, Select, Textarea } from '@/components/forms';
import { PortafolioDashboard } from '../PortafolioDashboard';
import { ProyectosKanban } from '../ProyectosKanban';
import { useProyecto, useProyectosDashboard, useCreateProyecto } from '../../../hooks/useProyectos';
import { programasApi } from '../../../api/proyectosApi';
import { useSelectUsers } from '@/hooks/useSelectLists';
import { useQuery } from '@tanstack/react-query';
import type {
  Proyecto,
  CreateProyectoDTO,
  TipoProyecto,
  PrioridadProyecto,
} from '../../../types/proyectos.types';

type ViewMode = 'dashboard' | 'kanban';

const VIEW_OPTIONS = [
  { value: 'dashboard' as const, label: 'Dashboard', icon: LayoutDashboard },
  { value: 'kanban' as const, label: 'Kanban', icon: KanbanSquare },
];

// ==================== MODAL DETALLE PROYECTO ====================

interface ProyectoDetailModalProps {
  proyectoId: number;
  isOpen: boolean;
  onClose: () => void;
}

const ProyectoDetailModal = ({ proyectoId, isOpen, onClose }: ProyectoDetailModalProps) => {
  const { data: proyecto, isLoading } = useProyecto(proyectoId);

  const estadoBadgeVariant = (
    estado: string
  ): 'primary' | 'success' | 'warning' | 'danger' | 'gray' => {
    const map: Record<string, 'primary' | 'success' | 'warning' | 'danger' | 'gray'> = {
      completado: 'success',
      ejecucion: 'primary',
      planificacion: 'warning',
      iniciacion: 'warning',
      monitoreo: 'primary',
      cancelado: 'danger',
      suspendido: 'danger',
      propuesto: 'gray',
      cierre: 'success',
    };
    return map[estado] ?? 'gray';
  };

  const saludColor = (salud?: string) => {
    if (salud === 'verde') return 'text-green-600';
    if (salud === 'amarillo') return 'text-yellow-500';
    if (salud === 'rojo') return 'text-red-600';
    return 'text-gray-500';
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Detalle del Proyecto"
      size="2xl"
      footer={
        <Button variant="secondary" onClick={onClose}>
          Cerrar
        </Button>
      }
    >
      {isLoading ? (
        <div className="flex justify-center py-10">
          <Spinner size="lg" />
        </div>
      ) : proyecto ? (
        <div className="space-y-6">
          {/* Cabecera */}
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-gray-500 font-mono mb-1">{proyecto.codigo}</p>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {proyecto.nombre}
              </h3>
              {proyecto.descripcion && (
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  {proyecto.descripcion}
                </p>
              )}
            </div>
            <Badge variant={estadoBadgeVariant(proyecto.estado)}>
              {proyecto.estado_display ?? proyecto.estado}
            </Badge>
          </div>

          {/* Métricas rápidas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-center">
              <p className="text-xs text-gray-500 mb-1">Avance</p>
              <p className="text-xl font-bold text-blue-600">{proyecto.porcentaje_avance}%</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-center">
              <p className="text-xs text-gray-500 mb-1">Prioridad</p>
              <p className="text-sm font-semibold capitalize text-gray-800 dark:text-gray-200">
                {proyecto.prioridad_display ?? proyecto.prioridad}
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-center">
              <p className="text-xs text-gray-500 mb-1">Tipo</p>
              <p className="text-sm font-semibold capitalize text-gray-800 dark:text-gray-200">
                {proyecto.tipo_display ?? proyecto.tipo}
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-center">
              <p className="text-xs text-gray-500 mb-1">Actividades</p>
              <p className="text-xl font-bold text-purple-600">{proyecto.total_actividades ?? 0}</p>
            </div>
          </div>

          {/* Barra progreso */}
          <div>
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Progreso del proyecto</span>
              <span>{proyecto.porcentaje_avance}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${proyecto.porcentaje_avance}%` }}
              />
            </div>
          </div>

          {/* Detalles */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Equipo */}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                <User className="h-3.5 w-3.5" /> Equipo
              </h4>
              {proyecto.sponsor_nombre && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-medium">Sponsor:</span> {proyecto.sponsor_nombre}
                </p>
              )}
              {proyecto.gerente_nombre && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-medium">Gerente:</span> {proyecto.gerente_nombre}
                </p>
              )}
              {!proyecto.sponsor_nombre && !proyecto.gerente_nombre && (
                <p className="text-xs text-gray-400">Sin equipo asignado</p>
              )}
            </div>

            {/* Fechas */}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" /> Fechas Planificadas
              </h4>
              {proyecto.fecha_inicio_plan && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-medium">Inicio:</span>{' '}
                  {new Date(proyecto.fecha_inicio_plan).toLocaleDateString('es-CO')}
                </p>
              )}
              {proyecto.fecha_fin_plan && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-medium">Fin:</span>{' '}
                  {new Date(proyecto.fecha_fin_plan).toLocaleDateString('es-CO')}
                </p>
              )}
              {!proyecto.fecha_inicio_plan && !proyecto.fecha_fin_plan && (
                <p className="text-xs text-gray-400">Sin fechas planificadas</p>
              )}
            </div>

            {/* Presupuesto */}
            {(proyecto.presupuesto_estimado ?? proyecto.presupuesto_aprobado) && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                  <TrendingUp className="h-3.5 w-3.5" /> Presupuesto
                </h4>
                {proyecto.presupuesto_estimado != null && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-medium">Estimado:</span>{' '}
                    {Number(proyecto.presupuesto_estimado).toLocaleString('es-CO', {
                      style: 'currency',
                      currency: 'COP',
                      maximumFractionDigits: 0,
                    })}
                  </p>
                )}
                {proyecto.presupuesto_aprobado != null && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-medium">Aprobado:</span>{' '}
                    {Number(proyecto.presupuesto_aprobado).toLocaleString('es-CO', {
                      style: 'currency',
                      currency: 'COP',
                      maximumFractionDigits: 0,
                    })}
                  </p>
                )}
              </div>
            )}

            {/* Justificación */}
            {proyecto.justificacion && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                  <Target className="h-3.5 w-3.5" /> Justificación
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">{proyecto.justificacion}</p>
              </div>
            )}
          </div>

          {/* Salud del proyecto */}
          {proyecto.health_status && (
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Salud del proyecto:{' '}
                <span className={`font-semibold capitalize ${saludColor(proyecto.health_status)}`}>
                  {proyecto.health_status}
                </span>
              </p>
              {proyecto.health_notes && (
                <p className="mt-1 text-xs text-gray-500">{proyecto.health_notes}</p>
              )}
            </div>
          )}
        </div>
      ) : (
        <p className="text-center text-gray-500 py-8">No se encontró el proyecto</p>
      )}
    </BaseModal>
  );
};

// ==================== MODAL CREAR PROYECTO ====================

interface ProyectoCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TIPOS_PROYECTO: { value: TipoProyecto; label: string }[] = [
  { value: 'mejora', label: 'Mejora' },
  { value: 'implementacion', label: 'Implementación' },
  { value: 'desarrollo', label: 'Desarrollo' },
  { value: 'infraestructura', label: 'Infraestructura' },
  { value: 'normativo', label: 'Normativo' },
  { value: 'otro', label: 'Otro' },
];

const PRIORIDADES: { value: PrioridadProyecto; label: string }[] = [
  { value: 'baja', label: 'Baja' },
  { value: 'media', label: 'Media' },
  { value: 'alta', label: 'Alta' },
];

export const ProyectoCreateModal = ({ isOpen, onClose }: ProyectoCreateModalProps) => {
  const createMutation = useCreateProyecto();
  const { data: users = [] } = useSelectUsers();
  const { data: programasData } = useQuery({
    queryKey: ['proyectos', 'programas-select'],
    queryFn: () => programasApi.getAll({ page_size: 200 }),
  });

  const programas = programasData?.results ?? (Array.isArray(programasData) ? programasData : []);

  const [form, setForm] = useState<Partial<CreateProyectoDTO>>({
    tipo: 'mejora',
    prioridad: 'media',
    tipo_origen: 'manual',
    estado: 'iniciacion',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (field: keyof CreateProyectoDTO, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!form.nombre?.trim()) newErrors.nombre = 'El nombre es requerido';
    if (!form.tipo) newErrors.tipo = 'El tipo es requerido';
    if (!form.prioridad) newErrors.prioridad = 'La prioridad es requerida';
    return newErrors;
  };

  const handleSubmit = () => {
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    const cleanData = { ...form };
    if (!cleanData.fecha_inicio_plan) cleanData.fecha_inicio_plan = undefined;
    if (!cleanData.fecha_fin_plan) cleanData.fecha_fin_plan = undefined;
    if (!cleanData.codigo) delete cleanData.codigo;
    // Asignar sponsor/gerente como number o undefined
    if (cleanData.sponsor) cleanData.sponsor = Number(cleanData.sponsor);
    else delete cleanData.sponsor;
    if (cleanData.gerente_proyecto) cleanData.gerente_proyecto = Number(cleanData.gerente_proyecto);
    else delete cleanData.gerente_proyecto;
    // Programa
    if (cleanData.programa) cleanData.programa = Number(cleanData.programa);
    else delete cleanData.programa;
    // Auto-estado: iniciacion (el proyecto se crea e inicia directamente)
    cleanData.estado = 'iniciacion';

    createMutation.mutate(cleanData as CreateProyectoDTO, {
      onSuccess: () => {
        setForm({
          tipo: 'mejora',
          prioridad: 'media',
          tipo_origen: 'manual',
          estado: 'iniciacion',
        });
        setErrors({});
        onClose();
      },
    });
  };

  const handleClose = () => {
    setForm({ tipo: 'mejora', prioridad: 'media', tipo_origen: 'manual', estado: 'iniciacion' });
    setErrors({});
    onClose();
  };

  const userOptions = [
    { value: '', label: 'Sin asignar' },
    ...users.map((u) => ({ value: String(u.value), label: u.label })),
  ];

  const programaOptions = [
    { value: '', label: 'Sin programa' },
    ...programas.map((p) => ({
      value: String(p.id),
      label: `${p.codigo || ''} ${p.nombre}`.trim(),
    })),
  ];

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Nuevo Proyecto"
      subtitle="El proyecto se creará en estado de Iniciación automáticamente"
      size="2xl"
      footer={
        <>
          <Button variant="secondary" onClick={handleClose} disabled={createMutation.isPending}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={createMutation.isPending}
            isLoading={createMutation.isPending}
          >
            Crear Proyecto
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {/* Código y Nombre */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="Código"
            placeholder="Automático"
            value={form.codigo ?? ''}
            onChange={(e) => handleChange('codigo', e.target.value)}
            helperText="Vacío = autogenerar"
          />
          <div className="md:col-span-2">
            <Input
              label="Nombre del Proyecto *"
              placeholder="Nombre descriptivo del proyecto"
              value={form.nombre ?? ''}
              onChange={(e) => handleChange('nombre', e.target.value)}
              error={errors.nombre}
            />
          </div>
        </div>

        {/* Tipo, Prioridad, Programa */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Select
            label="Tipo *"
            value={form.tipo ?? 'mejora'}
            onChange={(e) => handleChange('tipo', e.target.value)}
            error={errors.tipo}
            options={TIPOS_PROYECTO}
          />
          <Select
            label="Prioridad *"
            value={form.prioridad ?? 'media'}
            onChange={(e) => handleChange('prioridad', e.target.value)}
            error={errors.prioridad}
            options={PRIORIDADES}
          />
          <Select
            label="Programa"
            value={form.programa ? String(form.programa) : ''}
            onChange={(e) => handleChange('programa', e.target.value)}
            options={programaOptions}
          />
        </div>

        {/* Sponsor y Gerente */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Sponsor"
            value={form.sponsor ? String(form.sponsor) : ''}
            onChange={(e) => handleChange('sponsor', e.target.value)}
            options={userOptions}
          />
          <Select
            label="Gerente de Proyecto"
            value={form.gerente_proyecto ? String(form.gerente_proyecto) : ''}
            onChange={(e) => handleChange('gerente_proyecto', e.target.value)}
            options={userOptions}
          />
        </div>

        {/* Fechas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Fecha Inicio Planificada"
            type="date"
            value={form.fecha_inicio_plan ?? ''}
            onChange={(e) => handleChange('fecha_inicio_plan', e.target.value)}
          />
          <Input
            label="Fecha Fin Planificada"
            type="date"
            value={form.fecha_fin_plan ?? ''}
            onChange={(e) => handleChange('fecha_fin_plan', e.target.value)}
          />
        </div>

        {/* Descripción */}
        <Textarea
          label="Descripción"
          resize="none"
          rows={2}
          placeholder="Descripción del proyecto..."
          value={form.descripcion ?? ''}
          onChange={(e) => handleChange('descripcion', e.target.value)}
        />

        {/* Justificación */}
        <Textarea
          label="Justificación"
          resize="none"
          rows={2}
          placeholder="¿Por qué es necesario este proyecto?"
          value={form.justificacion ?? ''}
          onChange={(e) => handleChange('justificacion', e.target.value)}
        />
      </div>
    </BaseModal>
  );
};

// ==================== COMPONENTE PRINCIPAL ====================

export const PortafolioSubTab = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard');
  const [selectedProject, setSelectedProject] = useState<Proyecto | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { data: dashboard } = useProyectosDashboard();

  const handleProjectClick = (proyecto: Proyecto) => {
    setSelectedProject(proyecto);
  };

  const handleCreateProject = () => {
    setShowCreateModal(true);
  };

  const totalProyectos = dashboard?.total_proyectos ?? 0;

  return (
    <div className="space-y-6">
      {/* SectionHeader con toggle de vista y botón de acción */}
      <SectionHeader
        icon={
          <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
            <Briefcase className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          </div>
        }
        title="Portafolio de Proyectos"
        description={`${totalProyectos} proyecto${totalProyectos !== 1 ? 's' : ''} en portafolio`}
        actions={
          <div className="flex items-center gap-3">
            <ViewToggle
              value={viewMode}
              onChange={setViewMode}
              options={VIEW_OPTIONS}
              moduleColor="purple"
            />
            <Button variant="primary" size="sm" onClick={handleCreateProject}>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Proyecto
            </Button>
          </div>
        }
      />

      {/* Contenido según modo de vista */}
      {viewMode === 'dashboard' ? (
        <PortafolioDashboard />
      ) : (
        <ProyectosKanban onProjectClick={handleProjectClick} />
      )}

      {/* Modal Detalle Proyecto */}
      {selectedProject && (
        <ProyectoDetailModal
          proyectoId={selectedProject.id}
          isOpen={!!selectedProject}
          onClose={() => setSelectedProject(null)}
        />
      )}

      {/* Modal Crear Proyecto */}
      <ProyectoCreateModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} />
    </div>
  );
};
