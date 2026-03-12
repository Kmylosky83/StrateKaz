/**
 * Procesos Tab - Off-Boarding
 * Talent Hub - Sistema de Gestión StrateKaz
 */

import { useState } from 'react';
import { Plus, CheckCircle, Eye } from 'lucide-react';
import { SectionHeader } from '@/components/common/SectionHeader';
import { Card } from '@/components/common/Card';
import { EmptyState } from '@/components/common/EmptyState';
import { Button } from '@/components/common/Button';
import { Select } from '@/components/forms/Select';
import { cn } from '@/utils/cn';
import { useProcesosRetiro, useCerrarProcesoRetiro } from '../../hooks/useOffBoarding';
import type { EstadoProceso } from '../../types';
import { estadoProcesoOptions, motivoRetiroOptions } from '../../types';
import { ProcesoFormModal } from './ProcesoFormModal';

const getEstadoColor = (estado: EstadoProceso) => {
  switch (estado) {
    case 'iniciado':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
    case 'checklist_pendiente':
    case 'paz_salvo_pendiente':
    case 'examen_pendiente':
    case 'entrevista_pendiente':
    case 'liquidacion_pendiente':
      return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300';
    case 'completado':
      return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
    case 'cancelado':
      return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300';
    default:
      return 'bg-gray-100 text-gray-600 dark:bg-gray-900/30 dark:text-gray-400';
  }
};

export function ProcesosTab() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [estadoFilter, setEstadoFilter] = useState<EstadoProceso | ''>('');
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const { data: procesos = [], isLoading } = useProcesosRetiro(
    estadoFilter ? { estado: estadoFilter } : undefined
  );
  const cerrarMutation = useCerrarProcesoRetiro();

  const handleCerrar = (id: number) => {
    cerrarMutation.mutate(id);
  };

  if (isLoading) {
    return <div className="p-8 text-center text-gray-500">Cargando procesos...</div>;
  }

  return (
    <div className="space-y-4">
      <SectionHeader
        title="Procesos de Retiro"
        description="Gestión de procesos de desvinculación laboral"
      >
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Proceso
        </Button>
      </SectionHeader>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Select
            label="Estado"
            value={estadoFilter}
            onChange={(e) => setEstadoFilter(e.target.value as EstadoProceso | '')}
            options={[{ value: '', label: 'Todos' }, ...estadoProcesoOptions]}
          />
        </div>
      </Card>

      {/* Procesos List */}
      {procesos.length === 0 ? (
        <EmptyState
          title="No hay procesos de retiro"
          description="Comienza creando un nuevo proceso de retiro."
          action={{
            label: 'Nuevo Proceso',
            onClick: () => setShowCreateModal(true),
          }}
        />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left p-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Colaborador
                  </th>
                  <th className="text-left p-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Tipo Retiro
                  </th>
                  <th className="text-left p-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Fecha Notificación
                  </th>
                  <th className="text-left p-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Último Día
                  </th>
                  <th className="text-left p-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Progreso
                  </th>
                  <th className="text-left p-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Estado
                  </th>
                  <th className="text-left p-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {procesos.map((proceso) => (
                  <>
                    <tr
                      key={proceso.id}
                      className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer"
                      onClick={() => setExpandedId(expandedId === proceso.id ? null : proceso.id)}
                    >
                      <td className="p-3 text-sm">
                        <div>
                          <div className="font-medium text-gray-900 dark:text-gray-100">
                            {proceso.colaborador_nombre}
                          </div>
                          {proceso.colaborador_identificacion && (
                            <div className="text-xs text-gray-500">
                              {proceso.colaborador_identificacion}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-3 text-sm text-gray-600 dark:text-gray-400">
                        {proceso.tipo_retiro_nombre}
                      </td>
                      <td className="p-3 text-sm text-gray-600 dark:text-gray-400">
                        {new Date(proceso.fecha_notificacion).toLocaleDateString('es-CO')}
                      </td>
                      <td className="p-3 text-sm text-gray-600 dark:text-gray-400">
                        {new Date(proceso.fecha_ultimo_dia_trabajo).toLocaleDateString('es-CO')}
                      </td>
                      <td className="p-3 text-sm text-gray-600 dark:text-gray-400">
                        {proceso.progreso_porcentaje != null
                          ? `${proceso.progreso_porcentaje}%`
                          : '-'}
                      </td>
                      <td className="p-3">
                        <span
                          className={cn(
                            'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                            getEstadoColor(proceso.estado)
                          )}
                        >
                          {proceso.estado_display ||
                            estadoProcesoOptions.find((opt) => opt.value === proceso.estado)?.label}
                        </span>
                      </td>
                      <td className="p-3" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              setExpandedId(expandedId === proceso.id ? null : proceso.id)
                            }
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {proceso.estado !== 'completado' && proceso.estado !== 'cancelado' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCerrar(proceso.id)}
                              disabled={cerrarMutation.isPending}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Cerrar
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                    {expandedId === proceso.id && (
                      <tr key={`${proceso.id}-expanded`}>
                        <td colSpan={7} className="p-4 bg-gray-50 dark:bg-gray-800/50">
                          <div className="space-y-2">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div>
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                  Motivo de retiro:
                                </span>
                                <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                                  {proceso.motivo_retiro_display ||
                                    motivoRetiroOptions.find(
                                      (opt) => opt.value === proceso.motivo_retiro
                                    )?.label}
                                </span>
                              </div>
                              {proceso.esta_completado != null && (
                                <div>
                                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Completado:
                                  </span>
                                  <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                                    {proceso.esta_completado ? 'Sí' : 'No'}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Modals */}
      {showCreateModal && (
        <ProcesoFormModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} />
      )}
    </div>
  );
}
