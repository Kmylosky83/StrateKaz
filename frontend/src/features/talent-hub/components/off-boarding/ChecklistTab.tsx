/**
 * Checklist Tab - Off-Boarding
 * Talent Hub - Sistema de Gestión StrateKaz
 */

import { useState } from 'react';
import { Plus, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { SectionHeader } from '@/components/common/SectionHeader';
import { Card } from '@/components/common/Card';
import { EmptyState } from '@/components/common/EmptyState';
import { Button } from '@/components/common/Button';
import { Select } from '@/components/forms/Select';
import { Input } from '@/components/forms/Input';
import { cn } from '@/utils/cn';
import {
  useProcesosRetiro,
  useChecklistRetiro,
  useCompletarChecklistItem,
  usePazSalvos,
  useAprobarPazSalvo,
  useRechazarPazSalvo,
} from '../../hooks/useOffBoarding';
import type { EstadoItem, EstadoPazSalvo } from '../../types';
import { estadoItemOptions, estadoPazSalvoOptions, tipoPazSalvoOptions } from '../../types';
import { ChecklistItemFormModal } from './ChecklistItemFormModal';
import { PazSalvoFormModal } from './PazSalvoFormModal';

const getEstadoColor = (estado: string) => {
  switch (estado) {
    case 'pendiente':
      return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300';
    case 'en_proceso':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
    case 'completado':
    case 'aprobado':
      return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
    case 'rechazado':
      return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300';
    case 'no_aplica':
      return 'bg-gray-100 text-gray-600 dark:bg-gray-900/30 dark:text-gray-400';
    default:
      return 'bg-gray-100 text-gray-600';
  }
};

export function ChecklistTab() {
  const [selectedProcesoId, setSelectedProcesoId] = useState<number | null>(null);
  const [showChecklistModal, setShowChecklistModal] = useState(false);
  const [showPazSalvoModal, setShowPazSalvoModal] = useState(false);
  const [cantidadDevuelta, setCantidadDevuelta] = useState<Record<number, number>>({});

  const { data: procesos = [] } = useProcesosRetiro();
  const { data: checklistItems = [] } = useChecklistRetiro(
    selectedProcesoId ? { proceso_retiro: selectedProcesoId } : undefined
  );
  const { data: pazSalvos = [] } = usePazSalvos(
    selectedProcesoId ? { proceso_retiro: selectedProcesoId } : undefined
  );

  const completarMutation = useCompletarChecklistItem();
  const aprobarPazSalvoMutation = useAprobarPazSalvo();
  const rechazarPazSalvoMutation = useRechazarPazSalvo();

  const procesoOptions = procesos.map((proceso) => ({
    value: proceso.id.toString(),
    label: `${proceso.colaborador_nombre} - ${proceso.tipo_retiro_nombre}`,
  }));

  const handleCompletarItem = (id: number) => {
    completarMutation.mutate({ id });
  };

  const handleAprobarPazSalvo = (id: number) => {
    const cantidad = cantidadDevuelta[id] || 0;
    aprobarPazSalvoMutation.mutate({
      id,
      data: { cantidad_devuelta: cantidad },
    });
  };

  const handleRechazarPazSalvo = (id: number) => {
    const observaciones = prompt('Ingrese el motivo del rechazo:');
    if (observaciones) {
      rechazarPazSalvoMutation.mutate({ id, observaciones });
    }
  };

  return (
    <div className="space-y-6">
      {/* Proceso Selector */}
      <Card className="p-4">
        <Select
          label="Seleccione un Proceso de Retiro"
          value={selectedProcesoId?.toString() || ''}
          onChange={(e) => setSelectedProcesoId(e.target.value ? Number(e.target.value) : null)}
          options={[{ value: '', label: 'Seleccionar proceso...' }, ...procesoOptions]}
        />
      </Card>

      {selectedProcesoId ? (
        <>
          {/* Checklist Items Section */}
          <div className="space-y-4">
            <SectionHeader
              title="Checklist de Retiro"
              description="Items a completar durante el proceso de retiro"
            >
              <Button onClick={() => setShowChecklistModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Agregar Item
              </Button>
            </SectionHeader>

            {checklistItems.length === 0 ? (
              <EmptyState
                title="No hay items en el checklist"
                description="Agregue items al checklist para este proceso de retiro."
                action={{
                  label: 'Agregar Item',
                  onClick: () => setShowChecklistModal(true),
                }}
              />
            ) : (
              <Card>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="text-left p-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                          Orden
                        </th>
                        <th className="text-left p-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                          Descripción
                        </th>
                        <th className="text-left p-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                          Área Responsable
                        </th>
                        <th className="text-left p-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                          Estado
                        </th>
                        <th className="text-left p-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                          Fecha Completado
                        </th>
                        <th className="text-left p-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {checklistItems.map((item) => (
                        <tr
                          key={item.id}
                          className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                        >
                          <td className="p-3 text-sm font-medium text-gray-900 dark:text-gray-100">
                            {item.orden}
                          </td>
                          <td className="p-3 text-sm text-gray-600 dark:text-gray-400">
                            {item.descripcion}
                          </td>
                          <td className="p-3 text-sm text-gray-600 dark:text-gray-400">
                            {item.area_responsable}
                          </td>
                          <td className="p-3">
                            <span
                              className={cn(
                                'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                                getEstadoColor(item.estado)
                              )}
                            >
                              {estadoItemOptions.find((opt) => opt.value === item.estado)?.label}
                            </span>
                          </td>
                          <td className="p-3 text-sm text-gray-600 dark:text-gray-400">
                            {item.fecha_completado
                              ? new Date(item.fecha_completado).toLocaleDateString('es-CO')
                              : '-'}
                          </td>
                          <td className="p-3">
                            {item.estado !== 'completado' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleCompletarItem(item.id)}
                                disabled={completarMutation.isPending}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Completar
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </div>

          {/* Paz y Salvos Section */}
          <div className="space-y-4">
            <SectionHeader
              title="Paz y Salvos"
              description="Control de entrega de elementos y documentación"
            >
              <Button onClick={() => setShowPazSalvoModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Agregar Paz y Salvo
              </Button>
            </SectionHeader>

            {pazSalvos.length === 0 ? (
              <EmptyState
                title="No hay paz y salvos registrados"
                description="Agregue paz y salvos para controlar la entrega de elementos."
                action={{
                  label: 'Agregar Paz y Salvo',
                  onClick: () => setShowPazSalvoModal(true),
                }}
              />
            ) : (
              <Card>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="text-left p-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                          Tipo
                        </th>
                        <th className="text-left p-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                          Descripción
                        </th>
                        <th className="text-left p-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                          Área
                        </th>
                        <th className="text-left p-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                          Cantidad
                        </th>
                        <th className="text-left p-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                          Estado
                        </th>
                        <th className="text-left p-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                          Aprobado Por
                        </th>
                        <th className="text-left p-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {pazSalvos.map((paz) => (
                        <tr
                          key={paz.id}
                          className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                        >
                          <td className="p-3">
                            <span
                              className={cn(
                                'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                                'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                              )}
                            >
                              {tipoPazSalvoOptions.find((opt) => opt.value === paz.tipo)?.label}
                            </span>
                          </td>
                          <td className="p-3 text-sm text-gray-600 dark:text-gray-400">
                            {paz.descripcion}
                          </td>
                          <td className="p-3 text-sm text-gray-600 dark:text-gray-400">
                            {paz.area_responsable}
                          </td>
                          <td className="p-3 text-sm text-gray-600 dark:text-gray-400">
                            {paz.cantidad_devuelta}/{paz.cantidad_entregada}
                          </td>
                          <td className="p-3">
                            <span
                              className={cn(
                                'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                                getEstadoColor(paz.estado)
                              )}
                            >
                              {estadoPazSalvoOptions.find((opt) => opt.value === paz.estado)?.label}
                            </span>
                          </td>
                          <td className="p-3 text-sm text-gray-600 dark:text-gray-400">
                            {paz.aprobado_por_nombre || '-'}
                          </td>
                          <td className="p-3">
                            {paz.estado === 'pendiente' && (
                              <div className="flex items-center gap-2">
                                <Input
                                  type="number"
                                  min="0"
                                  max={paz.cantidad_entregada}
                                  value={cantidadDevuelta[paz.id] || 0}
                                  onChange={(e) =>
                                    setCantidadDevuelta({
                                      ...cantidadDevuelta,
                                      [paz.id]: Number(e.target.value),
                                    })
                                  }
                                  className="w-16"
                                  placeholder="Cant."
                                />
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleAprobarPazSalvo(paz.id)}
                                  disabled={aprobarPazSalvoMutation.isPending}
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Aprobar
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleRechazarPazSalvo(paz.id)}
                                  disabled={rechazarPazSalvoMutation.isPending}
                                >
                                  <XCircle className="h-4 w-4 mr-1" />
                                  Rechazar
                                </Button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </div>
        </>
      ) : (
        <EmptyState
          title="Seleccione un proceso de retiro"
          description="Seleccione un proceso para ver su checklist y paz y salvos."
        />
      )}

      {/* Modals */}
      {showChecklistModal && selectedProcesoId && (
        <ChecklistItemFormModal
          isOpen={showChecklistModal}
          onClose={() => setShowChecklistModal(false)}
          procesoId={selectedProcesoId}
        />
      )}

      {showPazSalvoModal && selectedProcesoId && (
        <PazSalvoFormModal
          isOpen={showPazSalvoModal}
          onClose={() => setShowPazSalvoModal(false)}
          procesoId={selectedProcesoId}
        />
      )}
    </div>
  );
}
