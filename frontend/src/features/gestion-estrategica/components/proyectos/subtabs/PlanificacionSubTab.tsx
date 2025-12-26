/**
 * SubTab de Planificación
 * Gestión de proyectos en fase de planificación
 */
import { Card, Badge, Button, EmptyState } from '@/components/common';
import { useProyectos } from '../../../hooks/useProyectos';
import {
  Plus,
  FileText,
  GitBranch,
  Users,
  DollarSign,
  AlertTriangle,
  ListChecks,
} from 'lucide-react';

export const PlanificacionSubTab = () => {
  const { data: proyectosData, isLoading } = useProyectos({
    estado: 'PLANIFICACION',
    is_active: true,
  });

  const proyectos = proyectosData?.results || [];

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <div className="p-6 animate-pulse">
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
            Fase de Planificación
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Proyectos en fase de planificación - Desarrollo de plan de proyecto
          </p>
        </div>
      </div>

      {/* Áreas de Conocimiento PMI */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Áreas de Conocimiento PMI
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="flex items-start gap-3">
              <FileText className="h-5 w-5 text-purple-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100">
                  Gestión del Alcance
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  WBS, entregables y requisitos
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <ListChecks className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100">
                  Gestión del Cronograma
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Diagrama de Gantt, hitos, ruta crítica
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <DollarSign className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100">
                  Gestión de Costos
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Presupuesto, curva S, EVM
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100">
                  Gestión de Riesgos
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Matriz de riesgos, plan de respuesta
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Users className="h-5 w-5 text-indigo-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100">
                  Gestión de Recursos
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Equipo, roles, matriz RACI
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <GitBranch className="h-5 w-5 text-pink-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100">
                  Gestión de Calidad
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Métricas, plan de calidad
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
                        {proyecto.name}
                      </h3>
                      <Badge variant="info" size="sm">
                        {proyecto.code}
                      </Badge>
                    </div>
                    {proyecto.alcance && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                        Alcance: {proyecto.alcance}
                      </p>
                    )}
                  </div>
                  <Button variant="secondary" size="sm">
                    Plan de Proyecto
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Presupuesto:</span>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      ${proyecto.presupuesto_estimado || '0'}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Hitos:</span>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {proyecto.hitos_count || 0}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Equipo:</span>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {proyecto.equipo_count || 0} miembros
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Fecha Inicio:</span>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {proyecto.fecha_inicio_prevista
                        ? new Date(proyecto.fecha_inicio_prevista).toLocaleDateString('es-CO')
                        : 'Sin definir'}
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<FileText className="h-12 w-12" />}
          title="No hay proyectos en planificación"
          description="Los proyectos pasarán a esta fase desde iniciación"
        />
      )}
    </div>
  );
};
