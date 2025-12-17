/**
 * Modal para iniciar una nueva recepción de materia prima
 * Permite seleccionar recolector y sus recolecciones pendientes
 */
import { useState, useEffect, useMemo } from 'react';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { Select } from '@/components/forms/Select';
import { Input } from '@/components/forms/Input';
import { Badge } from '@/components/common/Badge';
import { Loader2, AlertCircle, CheckSquare, Square, Package } from 'lucide-react';
import { useIniciarRecepcion, useRecoleccionesPendientes } from '../api/useRecepciones';
import { useRecolectores } from '@/features/users/hooks/useUsers';
import { formatDate, formatWeight } from '@/utils/formatters';
import type { IniciarRecepcionDTO } from '../types/recepcion.types';

interface IniciarRecepcionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const IniciarRecepcionModal = ({
  isOpen,
  onClose,
  onSuccess,
}: IniciarRecepcionModalProps) => {
  const [recolectorId, setRecolectorId] = useState<number | null>(null);
  const [selectedRecolecciones, setSelectedRecolecciones] = useState<Set<number>>(
    new Set()
  );
  const [observaciones, setObservaciones] = useState('');

  const { data: recolectores, isLoading: loadingRecolectores } = useRecolectores();
  const { data: pendientes, isLoading: loadingPendientes } =
    useRecoleccionesPendientes(recolectorId || undefined);
  const iniciarMutation = useIniciarRecepcion();

  // Reset form cuando se cierra el modal
  useEffect(() => {
    if (!isOpen) {
      setRecolectorId(null);
      setSelectedRecolecciones(new Set());
      setObservaciones('');
    }
  }, [isOpen]);

  // Calcular totales de las recolecciones seleccionadas (solo kg)
  const totales = useMemo(() => {
    if (!pendientes?.recolecciones) {
      return { totalKg: 0, cantidad: 0 };
    }

    const recoleccionesSeleccionadas = pendientes.recolecciones.filter((r) =>
      selectedRecolecciones.has(r.id)
    );

    return {
      totalKg: recoleccionesSeleccionadas.reduce((sum, r) => sum + Number(r.cantidad_kg), 0),
      cantidad: recoleccionesSeleccionadas.length,
    };
  }, [pendientes, selectedRecolecciones]);

  const handleToggleRecoleccion = (id: number) => {
    const newSelected = new Set(selectedRecolecciones);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedRecolecciones(newSelected);
  };

  const handleSelectAll = () => {
    if (!pendientes?.recolecciones) return;

    if (selectedRecolecciones.size === pendientes.recolecciones.length) {
      setSelectedRecolecciones(new Set());
    } else {
      setSelectedRecolecciones(
        new Set(pendientes.recolecciones.map((r) => r.id))
      );
    }
  };

  const handleSubmit = async () => {
    if (!recolectorId || selectedRecolecciones.size === 0) return;

    const data: IniciarRecepcionDTO = {
      recolector_id: recolectorId,
      recoleccion_ids: Array.from(selectedRecolecciones),
      observaciones_recepcion: observaciones || undefined,
    };

    try {
      await iniciarMutation.mutateAsync(data);
      onSuccess?.();
      onClose();
    } catch (error) {
      // Error ya manejado por el hook
    }
  };

  const recolectoresOptions = useMemo(() => {
    return (
      recolectores?.results?.map((r) => ({
        value: r.id,
        label: r.full_name,
      })) || []
    );
  }, [recolectores]);

  const isSubmitDisabled =
    !recolectorId ||
    selectedRecolecciones.size === 0 ||
    iniciarMutation.isPending;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Iniciar Recepción de Materia Prima"
      size="3xl"
    >
      <div className="space-y-6">
        {/* Selector de Recolector */}
        <div>
          <Select
            label="Recolector *"
            placeholder="Seleccione un recolector"
            options={recolectoresOptions}
            value={recolectorId || ''}
            onChange={(e) =>
              setRecolectorId(e.target.value ? Number(e.target.value) : null)
            }
            disabled={loadingRecolectores}
          />
          {loadingRecolectores && (
            <p className="mt-2 text-sm text-gray-500 flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Cargando recolectores...
            </p>
          )}
        </div>

        {/* Lista de recolecciones pendientes */}
        {recolectorId && (
          <>
            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  Recolecciones Pendientes
                </h4>
                {pendientes && pendientes.count > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSelectAll}
                    leftIcon={
                      selectedRecolecciones.size === pendientes.count ? (
                        <CheckSquare className="h-4 w-4" />
                      ) : (
                        <Square className="h-4 w-4" />
                      )
                    }
                  >
                    {selectedRecolecciones.size === pendientes.count
                      ? 'Deseleccionar todo'
                      : 'Seleccionar todo'}
                  </Button>
                )}
              </div>

              {loadingPendientes ? (
                <div className="flex items-center justify-center py-8 text-gray-500">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                  Cargando recolecciones...
                </div>
              ) : !pendientes || pendientes.count === 0 ? (
                <div className="text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <Package className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                  <p className="text-gray-600 dark:text-gray-400">
                    No hay recolecciones pendientes para este recolector
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {pendientes.recolecciones.map((recoleccion) => {
                    const isSelected = selectedRecolecciones.has(recoleccion.id);

                    return (
                      <div
                        key={recoleccion.id}
                        className={`border rounded-lg p-4 cursor-pointer transition-all ${
                          isSelected
                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                        onClick={() => handleToggleRecoleccion(recoleccion.id)}
                      >
                        <div className="flex items-start gap-3">
                          <div className="mt-1">
                            {isSelected ? (
                              <CheckSquare className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                            ) : (
                              <Square className="h-5 w-5 text-gray-400" />
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-2">
                              <div>
                                <Badge variant="primary" size="sm">
                                  {recoleccion.codigo_voucher}
                                </Badge>
                              </div>
                              <span className="text-sm text-gray-500 dark:text-gray-400">
                                {formatDate(recoleccion.fecha_recoleccion)}
                              </span>
                            </div>

                            <h5 className="font-medium text-gray-900 dark:text-gray-100 mb-1">
                              {recoleccion.ecoaliado.razon_social}
                            </h5>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                              Código: {recoleccion.ecoaliado.codigo}
                            </p>

                            <div className="flex items-center justify-end mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                              <div className="text-right">
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  Peso Recolectado
                                </p>
                                <p className="text-lg font-bold text-primary-700 dark:text-primary-400">
                                  {formatWeight(recoleccion.cantidad_kg)}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Resumen de selección */}
            {selectedRecolecciones.size > 0 && (
              <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg p-4">
                <h5 className="font-medium text-gray-900 dark:text-gray-100 mb-3">
                  Resumen de la Recepción
                </h5>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Recolecciones Seleccionadas
                    </p>
                    <p className="text-2xl font-bold text-primary-700 dark:text-primary-400">
                      {totales.cantidad}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Peso Total Esperado
                    </p>
                    <p className="text-2xl font-bold text-primary-700 dark:text-primary-400">
                      {formatWeight(totales.totalKg)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Observaciones */}
            <div>
              <Input
                label="Observaciones (Opcional)"
                placeholder="Observaciones generales de la recepción..."
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                helperText="Información adicional sobre esta recepción"
              />
            </div>
          </>
        )}

        {/* Mensaje de información */}
        {!recolectorId && (
          <div className="flex items-start gap-3 p-4 bg-info-50 dark:bg-info-900/20 border border-info-200 dark:border-info-800 rounded-lg">
            <AlertCircle className="h-5 w-5 text-info-600 dark:text-info-400 mt-0.5" />
            <div className="text-sm text-info-800 dark:text-info-300">
              <p className="font-medium mb-1">Seleccione un recolector</p>
              <p>
                Primero seleccione el recolector para ver sus recolecciones
                pendientes de recepción.
              </p>
            </div>
          </div>
        )}

        {/* Botones de acción */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="ghost" onClick={onClose} disabled={iniciarMutation.isPending}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={isSubmitDisabled}
            isLoading={iniciarMutation.isPending}
          >
            Iniciar Recepción
          </Button>
        </div>
      </div>
    </Modal>
  );
};
