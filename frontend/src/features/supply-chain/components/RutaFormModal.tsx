/**
 * Modal para crear/editar Rutas de Recolección.
 *
 * Refactor 2026-04-25 (H-SC-RUTA-02):
 *   - Eliminado el switch "es_proveedor_interno" (concepto deprecado).
 *   - Agregado selector "modo_operacion" (PASS_THROUGH | SEMI_AUTONOMA).
 *   - La Ruta NUNCA es Proveedor. Los proveedores se asocian vía RutaParada.
 */
import { useEffect, useState } from 'react';
import { Hash, Route, Settings2, Info } from 'lucide-react';

import { BaseModal } from '@/components/modals/BaseModal';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/forms/Input';
import { Select } from '@/components/forms/Select';
import { Textarea } from '@/components/forms/Textarea';
import { Switch } from '@/components/forms/Switch';

import { useCreateRuta, useUpdateRuta } from '../hooks/useRutas';
import {
  ModoOperacion,
  MODO_OPERACION_LABELS,
  type RutaRecoleccion,
  type CreateRutaDTO,
  type UpdateRutaDTO,
} from '../types/rutas.types';

interface RutaFormModalProps {
  ruta: RutaRecoleccion | null;
  isOpen: boolean;
  onClose: () => void;
}

interface FormData {
  codigo: string;
  nombre: string;
  descripcion: string;
  modo_operacion: ModoOperacion;
  is_active: boolean;
}

const defaultFormData: FormData = {
  codigo: '',
  nombre: '',
  descripcion: '',
  modo_operacion: ModoOperacion.PASS_THROUGH,
  is_active: true,
};

export default function RutaFormModal({ ruta, isOpen, onClose }: RutaFormModalProps) {
  const isEditing = ruta !== null;
  const [formData, setFormData] = useState<FormData>(defaultFormData);

  const createMutation = useCreateRuta();
  const updateMutation = useUpdateRuta();

  useEffect(() => {
    if (isEditing && ruta) {
      setFormData({
        codigo: ruta.codigo || '',
        nombre: ruta.nombre || '',
        descripcion: ruta.descripcion || '',
        modo_operacion: ruta.modo_operacion ?? ModoOperacion.PASS_THROUGH,
        is_active: ruta.is_active ?? true,
      });
    } else {
      setFormData({ ...defaultFormData });
    }
  }, [isEditing, ruta, isOpen]);

  const handleSubmit = async (e?: React.FormEvent | React.MouseEvent) => {
    e?.preventDefault();

    if (!formData.nombre.trim()) {
      const { toast } = await import('sonner');
      toast.warning('Complete los campos requeridos: Nombre', { duration: 5000 });
      return;
    }

    const baseData = {
      nombre: formData.nombre.trim(),
      descripcion: formData.descripcion || undefined,
      modo_operacion: formData.modo_operacion,
      is_active: formData.is_active,
    };

    try {
      if (isEditing && ruta) {
        await updateMutation.mutateAsync({
          id: ruta.id,
          data: baseData as UpdateRutaDTO,
        });
      } else {
        const createData: CreateRutaDTO = {
          ...baseData,
          ...(formData.codigo.trim() ? { codigo: formData.codigo.trim() } : {}),
        };
        await createMutation.mutateAsync(createData);
      }
      onClose();
    } catch {
      // El hook ya muestra el toast.
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  const footer = (
    <>
      <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
        Cancelar
      </Button>
      <Button
        type="button"
        variant="primary"
        onClick={handleSubmit}
        disabled={isLoading}
        isLoading={isLoading}
      >
        {isEditing ? 'Guardar Cambios' : 'Crear Ruta'}
      </Button>
    </>
  );

  const modoOptions = Object.entries(MODO_OPERACION_LABELS).map(([value, label]) => ({
    value,
    label,
  }));

  const esSemiAutonoma = formData.modo_operacion === ModoOperacion.SEMI_AUTONOMA;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Ruta de Recolección' : 'Nueva Ruta de Recolección'}
      size="2xl"
      footer={footer}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Sección: Identificación */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
              <Route className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
              Identificación
            </h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Código — opcional, auto-genera RUTA-001 */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Código
              </label>
              {isEditing ? (
                <div className="flex h-10 items-center gap-2 px-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50">
                  <Hash className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500 shrink-0" />
                  <span className="font-mono text-sm font-semibold text-blue-600 dark:text-blue-400 tracking-wider">
                    {formData.codigo}
                  </span>
                </div>
              ) : (
                <Input
                  value={formData.codigo}
                  onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                  placeholder="Se asignará al crear"
                  helperText="Opcional — dejar vacío para generar automáticamente"
                />
              )}
            </div>

            <Input
              label="Nombre *"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              placeholder="Ruta Norte, Circuito Sur, Recolección Zona 3"
              required
            />
          </div>

          <Textarea
            label="Descripción"
            value={formData.descripcion}
            onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
            placeholder="Notas internas: zonas cubiertas, vehículos asignados, etc."
            rows={2}
          />
        </div>

        {/* Sección: Operación */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
              <Settings2 className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </div>
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
              Operación
            </h4>
          </div>

          <Select
            label="Modo de operación *"
            value={formData.modo_operacion}
            onChange={(e) =>
              setFormData({ ...formData, modo_operacion: e.target.value as ModoOperacion })
            }
            options={modoOptions}
            required
          />

          {esSemiAutonoma && (
            <div className="rounded-lg border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/20 p-3 text-sm text-purple-700 dark:text-purple-300 flex gap-2">
              <Info className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <strong>Modo Semi-autónoma:</strong> esta ruta gestiona caja propia. Después de
                crearla, configure el doble precio por proveedor en{' '}
                <strong>Cadena de Suministro → Precios de Ruta</strong>: lo que la ruta paga al
                productor y lo que la empresa le paga a la ruta. La diferencia cubre los gastos
                operativos de la ruta.
              </div>
            </div>
          )}

          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Activo</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Desactivar para ocultar sin eliminar
              </p>
            </div>
            <Switch
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
            />
          </div>
        </div>
      </form>
    </BaseModal>
  );
}
