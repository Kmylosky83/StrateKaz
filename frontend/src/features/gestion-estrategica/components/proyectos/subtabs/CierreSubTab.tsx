/**
 * SubTab de Cierre
 * Gestión de proyectos en fase de cierre
 */
import { Card, Badge, Button, EmptyState } from '@/components/common';
import { useProyectos } from '../../../hooks/useProyectos';
import {
  CheckCircle2,
  FileText,
  Award,
  BookOpen,
  Archive,
  Star,
  Users,
  Calendar,
} from 'lucide-react';

export const CierreSubTab = () => {
  const { data: proyectosCierre, isLoading: loadingCierre } = useProyectos({
    estado: 'cierre',
    is_active: true,
  });

  const { data: proyectosCompletados, isLoading: loadingCompletados } = useProyectos({
    estado: 'completado',
  });

  const isLoading = loadingCierre || loadingCompletados;
  const proyectosEnCierre = proyectosCierre?.results || [];
  const proyectosFinalizados = proyectosCompletados?.results || [];

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
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Fase de Cierre</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Proyectos en cierre y completados - Lecciones aprendidas y entrega formal
          </p>
        </div>
      </div>

      {/* Checklist de Cierre */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Checklist de Cierre
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <FileText className="h-5 w-5 text-purple-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100">
                  Acta de Cierre del Proyecto
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Documentar aceptación formal de entregables
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <BookOpen className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100">
                  Lecciones Aprendidas
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Capturar experiencias y mejores prácticas
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Archive className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100">
                  Archivo de Documentación
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Archivar documentos del proyecto
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Users className="h-5 w-5 text-orange-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100">
                  Liberación de Recursos
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Liberar equipo y recursos del proyecto
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Award className="h-5 w-5 text-indigo-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100">
                  Reconocimiento al Equipo
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Celebrar logros y reconocer esfuerzos
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Star className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100">
                  Evaluación Post-Proyecto
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Evaluar resultados vs objetivos
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Proyectos en Cierre */}
      {proyectosEnCierre.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Proyectos en Proceso de Cierre
          </h3>
          <div className="grid grid-cols-1 gap-4">
            {proyectosEnCierre.map((proyecto) => (
              <Card key={proyecto.id}>
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                          {proyecto.nombre}
                        </h3>
                        <Badge variant="warning" size="sm">
                          En Cierre
                        </Badge>
                      </div>
                      {proyecto.lecciones_aprendidas && (
                        <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                          <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                            Lecciones Aprendidas:
                          </h4>
                          <p className="text-sm text-blue-800 dark:text-blue-200">
                            {proyecto.lecciones_aprendidas}
                          </p>
                        </div>
                      )}
                    </div>
                    <Button variant="secondary" size="sm">
                      Acta de Cierre
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Progreso:</span>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-green-600 h-2 rounded-full"
                            style={{ width: `${proyecto.progreso_general || 0}%` }}
                          />
                        </div>
                        <span className="font-medium">{proyecto.progreso_general || 0}%</span>
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Fecha Fin Real:</span>
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {proyecto.fecha_fin_real
                          ? new Date(proyecto.fecha_fin_real).toLocaleDateString('es-CO')
                          : 'Pendiente'}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Presupuesto Final:</span>
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        ${proyecto.presupuesto_ejecutado || '0'}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Proyectos Completados */}
      {proyectosFinalizados.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Proyectos Completados
          </h3>
          <div className="grid grid-cols-1 gap-4">
            {proyectosFinalizados.slice(0, 5).map((proyecto) => (
              <Card key={proyecto.id}>
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                          {proyecto.nombre}
                        </h3>
                        <Badge variant="success" size="sm">
                          Completado
                        </Badge>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm mt-3">
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Finalizado:</span>
                          <p className="font-medium text-gray-900 dark:text-gray-100">
                            {proyecto.fecha_fin_real
                              ? new Date(proyecto.fecha_fin_real).toLocaleDateString('es-CO')
                              : 'N/A'}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Duración:</span>
                          <p className="font-medium text-gray-900 dark:text-gray-100">
                            {proyecto.fecha_inicio_real && proyecto.fecha_fin_real
                              ? `${Math.ceil(
                                  (new Date(proyecto.fecha_fin_real).getTime() -
                                    new Date(proyecto.fecha_inicio_real).getTime()) /
                                    (1000 * 60 * 60 * 24)
                                )} días`
                              : 'N/A'}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Inversión:</span>
                          <p className="font-medium text-gray-900 dark:text-gray-100">
                            ${proyecto.presupuesto_ejecutado || '0'}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Salud Final:</span>
                          <div className="mt-1">
                            <Badge
                              variant={
                                proyecto.health_status === 'verde'
                                  ? 'success'
                                  : proyecto.health_status === 'amarillo'
                                    ? 'warning'
                                    : 'danger'
                              }
                              size="sm"
                            >
                              {proyecto.health_status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      Ver Resumen
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {proyectosEnCierre.length === 0 && proyectosFinalizados.length === 0 && (
        <EmptyState
          icon={<CheckCircle2 className="h-12 w-12" />}
          title="No hay proyectos en cierre"
          description="Los proyectos pasarán a esta fase desde ejecución/monitoreo"
        />
      )}
    </div>
  );
};
