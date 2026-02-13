/**
 * Procesos Tab - Off-Boarding
 * Talent Hub - Sistema de Gestión StrateKaz
 */

import { useState } from 'react';
import { Plus, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { SectionHeader } from '@/components/common/SectionHeader';
import { Card } from '@/components/common/Card';
import { EmptyState } from '@/components/common/EmptyState';
import { Button } from '@/components/common/Button';
import { Select } from '@/components/forms/Select';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { cn } from '@/utils/cn';
import {
  useProcesosRetiro,
  useFinalizarProcesoRetiro,
  useCancelarProcesoRetiro,
} from '../../hooks/useOffBoarding';
import type { ProcesoRetiro, EstadoProceso } from '../../types';
import { estadoProcesoOptions } from '../../types';
import { ProcesoFormModal } from './ProcesoFormModal';

const getEstadoColor = (estado: EstadoProceso) => {
  switch (estado) {
    case 'iniciado':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
    case 'en_proceso':
    case 'pendiente_liquidacion':
      return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300';
    case 'finalizado':
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
  const [cancelProcesoId, setCancelProcesoId] = useState<number | null>(null);
  const [cancelMotivo, setCancelMotivo] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const { data: procesos = [], isLoading } = useProcesosRetiro(
    estadoFilter ? { estado: estadoFilter } : undefined
  );
  const finalizarMutation = useFinalizarProcesoRetiro();
  const cancelarMutation = useCancelarProcesoRetiro();

  const handleFinalizar = (id: number) => {
    finalizarMutation.mutate(id);
  };

  const handleCancelar = () => {
    if (!cancelProcesoId || !cancelMotivo.trim()) return;
    cancelarMutation.mutate(
      { id: cancelProcesoId, motivo: cancelMotivo },
      {
        onSuccess: () => {
          setCancelProcesoId(null);
          setCancelMotivo('');
        },
      }
    );
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                    Fecha Retiro
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
                          <div className="text-xs text-gray-500">{proceso.colaborador_cargo}</div>
                        </div>
                      </td>
                      <td className="p-3 text-sm text-gray-600 dark:text-gray-400">
                        {proceso.tipo_retiro_nombre}
                      </td>
                      <td className="p-3 text-sm text-gray-600 dark:text-gray-400">
                        {new Date(proceso.fecha_notificacion).toLocaleDateString('es-CO')}
                      </td>
                      <td className="p-3 text-sm text-gray-600 dark:text-gray-400">
                        {new Date(proceso.fecha_efectiva_retiro).toLocaleDateString('es-CO')}
                      </td>
                      <td className="p-3">
                        <span
                          className={cn(
                            'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                            getEstadoColor(proceso.estado)
                          )}
                        >
                          {estadoProcesoOptions.find((opt) => opt.value === proceso.estado)?.label}
                        </span>
                      </td>
                      <td className="p-3" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-2">
                          {proceso.estado !== 'finalizado' && proceso.estado !== 'cancelado' && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleFinalizar(proceso.id)}
                                disabled={finalizarMutation.isPending}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Finalizar
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setCancelProcesoId(proceso.id)}
                                disabled={cancelarMutation.isPending}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Cancelar
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                    {expandedId === proceso.id && (
                      <tr>
                        <td colSpan={6} className="p-4 bg-gray-50 dark:bg-gray-800/50">
                          <div className="space-y-2">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                  Documento:
                                </span>
                                <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                                  {proceso.colaborador_documento}
                                </span>
                              </div>
                              <div>
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                  Responsable:
                                </span>
                                <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                                  {proceso.responsable_proceso_nombre}
                                </span>
                              </div>
                            </div>
                            {proceso.motivo_retiro && (
                              <div>
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                  Motivo:
                                </span>
                                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                                  {proceso.motivo_retiro}
                                </p>
                              </div>
                            )}
                            {proceso.observaciones && (
                              <div>
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                  Observaciones:
                                </span>
                                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                                  {proceso.observaciones}
                                </p>
                              </div>
                            )}
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

      <ConfirmDialog
        isOpen={!!cancelProcesoId}
        onClose={() => {
          setCancelProcesoId(null);
          setCancelMotivo('');
        }}
        onConfirm={handleCancelar}
        title="Cancelar Proceso de Retiro"
        message="¿Está seguro de cancelar este proceso de retiro? Esta acción no se puede deshacer."
        confirmText="Cancelar Proceso"
        variant="danger"
      >
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Motivo de Cancelación *
          </label>
          <textarea
            value={cancelMotivo}
            onChange={(e) => setCancelMotivo(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-violet-500 dark:bg-gray-700 dark:text-gray-100"
            rows={3}
            placeholder="Ingrese el motivo de cancelación..."
          />
        </div>
      </ConfirmDialog>
    </div>
  );
}
