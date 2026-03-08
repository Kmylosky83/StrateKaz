/**
 * Modal para crear/editar Seguimiento EVM del Proyecto
 * DS: BaseModal + Input + Textarea + Select + Button
 */
import { useState, useEffect } from 'react';
import { BaseModal } from '@/components/modals/BaseModal';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/forms/Input';
import { Textarea } from '@/components/forms/Textarea';
import { Select } from '@/components/forms/Select';
import { useCreateSeguimiento, useUpdateSeguimiento } from '../../../hooks/useProyectos';
import type {
  SeguimientoProyecto,
  CreateSeguimientoDTO,
  UpdateSeguimientoDTO,
  EstadoGeneral,
} from '../../../types/proyectos.types';

interface SeguimientoFormModalProps {
  seguimiento: SeguimientoProyecto | null;
  proyectoId: number;
  isOpen: boolean;
  onClose: () => void;
}

const ESTADO_OPTIONS = [
  { value: 'verde', label: 'Verde - En plan' },
  { value: 'amarillo', label: 'Amarillo - En riesgo' },
  { value: 'rojo', label: 'Rojo - Crítico' },
];

export const SeguimientoFormModal = ({
  seguimiento,
  proyectoId,
  isOpen,
  onClose,
}: SeguimientoFormModalProps) => {
  const isEditing = seguimiento !== null;

  const [formData, setFormData] = useState<CreateSeguimientoDTO>({
    proyecto: proyectoId,
    fecha: new Date().toISOString().split('T')[0],
    porcentaje_avance: 0,
    costo_acumulado: '0',
    estado_general: 'verde',
    valor_planificado: '0',
    valor_ganado: '0',
    costo_actual: '0',
    logros_periodo: '',
    problemas_encontrados: '',
    acciones_correctivas: '',
    proximas_actividades: '',
    observaciones: '',
  });

  const createMutation = useCreateSeguimiento();
  const updateMutation = useUpdateSeguimiento();

  useEffect(() => {
    if (seguimiento) {
      setFormData({
        proyecto: seguimiento.proyecto,
        fecha: seguimiento.fecha,
        porcentaje_avance: seguimiento.porcentaje_avance,
        costo_acumulado: seguimiento.costo_acumulado || '0',
        estado_general: seguimiento.estado_general,
        valor_planificado: seguimiento.valor_planificado || '0',
        valor_ganado: seguimiento.valor_ganado || '0',
        costo_actual: seguimiento.costo_actual || '0',
        logros_periodo: seguimiento.logros_periodo || '',
        problemas_encontrados: seguimiento.problemas_encontrados || '',
        acciones_correctivas: seguimiento.acciones_correctivas || '',
        proximas_actividades: seguimiento.proximas_actividades || '',
        observaciones: seguimiento.observaciones || '',
      });
    } else {
      setFormData({
        proyecto: proyectoId,
        fecha: new Date().toISOString().split('T')[0],
        porcentaje_avance: 0,
        costo_acumulado: '0',
        estado_general: 'verde',
        valor_planificado: '0',
        valor_ganado: '0',
        costo_actual: '0',
        logros_periodo: '',
        problemas_encontrados: '',
        acciones_correctivas: '',
        proximas_actividades: '',
        observaciones: '',
      });
    }
  }, [seguimiento, proyectoId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing && seguimiento) {
      const updateData: UpdateSeguimientoDTO = { ...formData };
      delete (updateData as Record<string, unknown>).proyecto;
      await updateMutation.mutateAsync({ id: seguimiento.id, data: updateData });
    } else {
      await createMutation.mutateAsync(formData);
    }
    onClose();
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  const footer = (
    <>
      <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
        Cancelar
      </Button>
      <Button
        type="submit"
        variant="primary"
        onClick={handleSubmit}
        disabled={isLoading || !formData.fecha}
        isLoading={isLoading}
      >
        {isEditing ? 'Guardar Cambios' : 'Registrar Seguimiento'}
      </Button>
    </>
  );

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Seguimiento' : 'Nuevo Seguimiento'}
      subtitle="Seguimiento EVM del proyecto"
      size="2xl"
      footer={footer}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="Fecha *"
            type="date"
            value={formData.fecha}
            onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
            required
          />
          <Input
            label="Avance %"
            type="number"
            value={String(formData.porcentaje_avance)}
            onChange={(e) =>
              setFormData({ ...formData, porcentaje_avance: Number(e.target.value) })
            }
            min="0"
            max="100"
          />
          <Select
            label="Estado General"
            value={formData.estado_general || 'verde'}
            onChange={(e) =>
              setFormData({ ...formData, estado_general: e.target.value as EstadoGeneral })
            }
            options={ESTADO_OPTIONS}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="Valor Planificado (PV)"
            type="number"
            value={formData.valor_planificado || '0'}
            onChange={(e) => setFormData({ ...formData, valor_planificado: e.target.value })}
            min="0"
            step="0.01"
          />
          <Input
            label="Valor Ganado (EV)"
            type="number"
            value={formData.valor_ganado || '0'}
            onChange={(e) => setFormData({ ...formData, valor_ganado: e.target.value })}
            min="0"
            step="0.01"
          />
          <Input
            label="Costo Actual (AC)"
            type="number"
            value={formData.costo_actual || '0'}
            onChange={(e) => setFormData({ ...formData, costo_actual: e.target.value })}
            min="0"
            step="0.01"
          />
        </div>

        {/* SPI / CPI live preview */}
        {(() => {
          const pv = Number(formData.valor_planificado ?? 0);
          const ev = Number(formData.valor_ganado ?? 0);
          const ac = Number(formData.costo_actual ?? 0);
          const spi = pv > 0 ? ev / pv : null;
          const cpi = ac > 0 ? ev / ac : null;
          const color = (v: number | null) =>
            v == null
              ? 'text-gray-400'
              : v >= 1
                ? 'text-green-600 dark:text-green-400'
                : v >= 0.9
                  ? 'text-yellow-600 dark:text-yellow-400'
                  : 'text-red-600 dark:text-red-400';
          return (
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-4 py-2.5 text-center">
                <p className="text-xs text-gray-500 mb-0.5">SPI (Eficiencia Plazo)</p>
                <p className={`text-xl font-bold ${color(spi)}`}>
                  {spi != null ? spi.toFixed(2) : '—'}
                </p>
                <p className="text-xs text-gray-400">
                  {spi != null && spi >= 1 ? 'A tiempo' : spi != null ? 'Retrasado' : 'Sin datos'}
                </p>
              </div>
              <div className="rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-4 py-2.5 text-center">
                <p className="text-xs text-gray-500 mb-0.5">CPI (Eficiencia Costo)</p>
                <p className={`text-xl font-bold ${color(cpi)}`}>
                  {cpi != null ? cpi.toFixed(2) : '—'}
                </p>
                <p className="text-xs text-gray-400">
                  {cpi != null && cpi >= 1
                    ? 'Bajo presupuesto'
                    : cpi != null
                      ? 'Sobre presupuesto'
                      : 'Sin datos'}
                </p>
              </div>
            </div>
          );
        })()}

        <Input
          label="Costo Acumulado"
          type="number"
          value={formData.costo_acumulado || '0'}
          onChange={(e) => setFormData({ ...formData, costo_acumulado: e.target.value })}
          min="0"
          step="0.01"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Textarea
            label="Logros del Período"
            value={formData.logros_periodo || ''}
            onChange={(e) => setFormData({ ...formData, logros_periodo: e.target.value })}
            placeholder="Principales logros alcanzados..."
            rows={2}
          />
          <Textarea
            label="Problemas Encontrados"
            value={formData.problemas_encontrados || ''}
            onChange={(e) => setFormData({ ...formData, problemas_encontrados: e.target.value })}
            placeholder="Problemas o bloqueos..."
            rows={2}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Textarea
            label="Acciones Correctivas"
            value={formData.acciones_correctivas || ''}
            onChange={(e) => setFormData({ ...formData, acciones_correctivas: e.target.value })}
            placeholder="Acciones para mitigar problemas..."
            rows={2}
          />
          <Textarea
            label="Próximas Actividades"
            value={formData.proximas_actividades || ''}
            onChange={(e) => setFormData({ ...formData, proximas_actividades: e.target.value })}
            placeholder="Actividades para el próximo período..."
            rows={2}
          />
        </div>

        <Textarea
          label="Observaciones"
          value={formData.observaciones || ''}
          onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
          placeholder="Notas adicionales..."
          rows={2}
        />
      </form>
    </BaseModal>
  );
};
