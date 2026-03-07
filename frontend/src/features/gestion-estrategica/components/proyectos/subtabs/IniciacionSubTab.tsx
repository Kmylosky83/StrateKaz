/**
 * SubTab de Iniciación
 * Workspace para proyectos en fase de iniciación
 * Enfocado en charter, stakeholders, objetivos y cronograma preliminar
 */
import { useState } from 'react';
import { Card, Badge, EmptyState, SectionHeader, Spinner } from '@/components/common';
import { StatsGrid } from '@/components/layout/StatsGrid';
import { useProyectos, useProyecto } from '../../../hooks/useProyectos';
import { BaseModal } from '@/components/modals/BaseModal';
import type { Proyecto } from '../../../types/proyectos.types';
import {
  FileText,
  Users,
  Target,
  Calendar,
  ClipboardCheck,
  Eye,
  Briefcase,
  AlertCircle,
} from 'lucide-react';

// ==================== MODAL DETALLE PROYECTO ====================

interface ProyectoDetailModalProps {
  proyectoId: number;
  isOpen: boolean;
  onClose: () => void;
}

const ProyectoDetailModal = ({ proyectoId, isOpen, onClose }: ProyectoDetailModalProps) => {
  const { data: proyecto, isLoading } = useProyecto(proyectoId);

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Detalle del Proyecto" size="2xl">
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : proyecto ? (
        <div className="space-y-6">
          {/* Header */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {proyecto.nombre}
              </h3>
              <Badge variant="info" size="sm">
                {proyecto.codigo}
              </Badge>
              <Badge variant="warning" size="sm">
                Iniciación
              </Badge>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {proyecto.descripcion || 'Sin descripción'}
            </p>
          </div>

          {/* Métricas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
              <span className="text-xs text-gray-500 dark:text-gray-400">Sponsor</span>
              <p className="font-medium text-gray-900 dark:text-gray-100 mt-1">
                {proyecto.sponsor_nombre || 'Sin asignar'}
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
              <span className="text-xs text-gray-500 dark:text-gray-400">Gerente de Proyecto</span>
              <p className="font-medium text-gray-900 dark:text-gray-100 mt-1">
                {proyecto.gerente_nombre || 'Sin asignar'}
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
              <span className="text-xs text-gray-500 dark:text-gray-400">Prioridad</span>
              <div className="mt-1">
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
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
              <span className="text-xs text-gray-500 dark:text-gray-400">Tipo</span>
              <p className="font-medium text-gray-900 dark:text-gray-100 mt-1">
                {proyecto.tipo_display}
              </p>
            </div>
          </div>

          {/* Fechas y presupuesto */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Fecha inicio planificada
              </span>
              <p className="font-medium text-gray-900 dark:text-gray-100">
                {proyecto.fecha_inicio_plan
                  ? new Date(proyecto.fecha_inicio_plan).toLocaleDateString('es-CO')
                  : 'Sin definir'}
              </p>
            </div>
            <div>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Fecha fin planificada
              </span>
              <p className="font-medium text-gray-900 dark:text-gray-100">
                {proyecto.fecha_fin_plan
                  ? new Date(proyecto.fecha_fin_plan).toLocaleDateString('es-CO')
                  : 'Sin definir'}
              </p>
            </div>
          </div>

          {/* Justificación */}
          {proyecto.justificacion && (
            <div>
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Justificación
              </span>
              <p className="text-sm text-gray-900 dark:text-gray-100 mt-1">
                {proyecto.justificacion}
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500">No se encontró el proyecto</div>
      )}
    </BaseModal>
  );
};

// ==================== COMPONENTE PRINCIPAL ====================

export const IniciacionSubTab = () => {
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
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

      {/* Checklist de Iniciación PMI */}
      <Card>
        <div className="p-6">
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Checklist de Iniciación PMI
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <FileText className="h-5 w-5 text-purple-600 mt-0.5 shrink-0" />
              <div>
                <h4 className="font-medium text-sm text-gray-900 dark:text-gray-100">
                  Acta de Constitución
                </h4>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Documentar objetivos, alcance y justificación
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Users className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
              <div>
                <h4 className="font-medium text-sm text-gray-900 dark:text-gray-100">
                  Stakeholders
                </h4>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Identificar sponsor y partes interesadas
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Target className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
              <div>
                <h4 className="font-medium text-sm text-gray-900 dark:text-gray-100">
                  Objetivos del Proyecto
                </h4>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Definir metas SMART y criterios de éxito
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-orange-600 mt-0.5 shrink-0" />
              <div>
                <h4 className="font-medium text-sm text-gray-900 dark:text-gray-100">
                  Cronograma Preliminar
                </h4>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Estimar fechas de inicio y fin
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Lista de Proyectos en Iniciación */}
      {proyectos.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {proyectos.map((proyecto) => (
            <Card
              key={proyecto.id}
              className="cursor-pointer hover:ring-2 hover:ring-purple-500/30 transition-all"
              onClick={() => setSelectedProjectId(proyecto.id)}
            >
              <div className="p-6">
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
                  <button
                    className="ml-4 p-2 text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedProjectId(proyecto.id);
                    }}
                    title="Ver detalles"
                  >
                    <Eye className="h-5 w-5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Sponsor</span>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {proyecto.sponsor_nombre || 'Sin asignar'}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Gerente</span>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {proyecto.gerente_nombre || 'Sin asignar'}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Inicio planificado</span>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {proyecto.fecha_inicio_plan
                        ? new Date(proyecto.fecha_inicio_plan).toLocaleDateString('es-CO')
                        : 'Sin definir'}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Tipo</span>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {proyecto.tipo_display}
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<ClipboardCheck className="h-12 w-12" />}
          title="No hay proyectos en iniciación"
          description="Los proyectos pasan a esta fase desde el Kanban en Portafolio"
        />
      )}

      {/* Modal Detalle Proyecto */}
      {selectedProjectId && (
        <ProyectoDetailModal
          proyectoId={selectedProjectId}
          isOpen={!!selectedProjectId}
          onClose={() => setSelectedProjectId(null)}
        />
      )}
    </div>
  );
};
