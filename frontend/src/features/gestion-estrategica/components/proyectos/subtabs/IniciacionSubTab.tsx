/**
 * SubTab de Iniciación
 * Gestión de proyectos en fase de iniciación
 */
import { Card, Badge, Button, EmptyState } from '@/components/common';
import { useProyectos } from '../../../hooks/useProyectos';
import { Plus, FileText, Users, Target, Calendar } from 'lucide-react';

export const IniciacionSubTab = () => {
  const { data: proyectosData, isLoading } = useProyectos({
    estado: 'iniciacion',
    is_active: true,
  });

  const proyectos = proyectosData?.results || [];

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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Fase de Iniciación
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Proyectos en fase de iniciación - Definición de charter y acta de constitución
          </p>
        </div>
        <Button variant="primary" onClick={() => {}}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Proyecto
        </Button>
      </div>

      {/* Checklist de Iniciación */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Checklist de Iniciación
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <FileText className="h-5 w-5 text-purple-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100">
                  Acta de Constitución
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Documentar objetivos, alcance y justificación
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Users className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100">Stakeholders</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Identificar sponsor y partes interesadas
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Target className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100">
                  Objetivos del Proyecto
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Definir metas SMART y criterios de éxito
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-orange-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100">
                  Cronograma Preliminar
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Estimar fechas de inicio y fin
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Lista de Proyectos */}
      {proyectos.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {proyectos.map((proyecto) => (
            <Card key={proyecto.id}>
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        {proyecto.nombre}
                      </h3>
                      <Badge variant="info" size="sm">
                        {proyecto.codigo}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {proyecto.descripcion || 'Sin descripción'}
                    </p>
                  </div>
                  <Button variant="secondary" size="sm">
                    Ver Detalles
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Sponsor:</span>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {proyecto.sponsor_nombre || 'Sin asignar'}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Project Manager:</span>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {proyecto.gerente_nombre || 'Sin asignar'}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Prioridad:</span>
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
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Target className="h-12 w-12" />}
          title="No hay proyectos en iniciación"
          description="Crea un nuevo proyecto para comenzar la fase de iniciación"
        />
      )}
    </div>
  );
};
