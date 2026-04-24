/**
 * Modal para crear/editar RangoCalidad (clasificación de valores medidos).
 *
 * Un rango define un tramo (min, max) dentro del cual una medición cae, con
 * nombre legible, código y color para UI. Ej: "Tipo A" (0-5%), "Tipo B" (5-10%).
 */
import { useEffect, useState } from 'react';

import { BaseModal } from '@/components/modals/BaseModal';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/forms/Input';
import { Switch } from '@/components/forms/Switch';

import { useCreateRangoCalidad, useUpdateRangoCalidad } from '../hooks/useRangosCalidad';
import type { RangoCalidad } from '../types/calidad.types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  parametroId: number;
  rango: RangoCalidad | null;
}

interface FormState {
  code: string;
  name: string;
  min_value: string;
  max_value: string;
  color_hex: string;
  order: number;
  is_active: boolean;
}

const emptyForm: FormState = {
  code: '',
  name: '',
  min_value: '',
  max_value: '',
  color_hex: '#10B981',
  order: 0,
  is_active: true,
};

export default function RangoCalidadFormModal({ isOpen, onClose, parametroId, rango }: Props) {
  const isEditing = rango !== null;
  const [form, setForm] = useState<FormState>(emptyForm);

  const createMut = useCreateRangoCalidad();
  const updateMut = useUpdateRangoCalidad();
  const isLoading = createMut.isPending || updateMut.isPending;

  useEffect(() => {
    if (isEditing && rango) {
      setForm({
        code: rango.code || '',
        name: rango.name || '',
        min_value: String(rango.min_value ?? ''),
        max_value:
          rango.max_value !== null && rango.max_value !== undefined ? String(rango.max_value) : '',
        color_hex: rango.color_hex || '#10B981',
        order: rango.order ?? 0,
        is_active: rango.is_active ?? true,
      });
    } else {
      setForm({ ...emptyForm });
    }
  }, [rango, isEditing, isOpen]);

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.code.trim()) {
      const { toast } = await import('sonner');
      toast.warning('Complete Código y Nombre');
      return;
    }

    const payload = {
      parameter: parametroId,
      code: form.code.trim(),
      name: form.name.trim(),
      min_value: form.min_value !== '' ? Number(form.min_value) : 0,
      max_value: form.max_value !== '' ? Number(form.max_value) : null,
      color_hex: form.color_hex,
      order: Number(form.order) || 0,
      is_active: form.is_active,
    };

    try {
      if (isEditing && rango) {
        await updateMut.mutateAsync({ id: rango.id, data: payload });
      } else {
        await createMut.mutateAsync(payload);
      }
      onClose();
    } catch {
      // Toast se muestra en el hook.
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Rango' : 'Nuevo Rango de Calidad'}
      subtitle="Tramo de valores con nombre, color y clasificación"
      size="md"
      footer={
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={handleSubmit}
            isLoading={isLoading}
            disabled={isLoading}
          >
            {isEditing ? 'Actualizar' : 'Crear'}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Código *"
            placeholder="A, B, C..."
            required
            value={form.code}
            onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
          />
          <Input
            label="Nombre *"
            placeholder="Tipo A / Premium"
            required
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Valor mínimo"
            type="number"
            step="0.01"
            placeholder="(vacío = sin límite)"
            value={form.min_value}
            onChange={(e) => setForm((f) => ({ ...f, min_value: e.target.value }))}
            helperText="Inclusivo"
          />
          <Input
            label="Valor máximo"
            type="number"
            step="0.01"
            placeholder="(vacío = sin límite)"
            value={form.max_value}
            onChange={(e) => setForm((f) => ({ ...f, max_value: e.target.value }))}
            helperText="Inclusivo"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Color
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={form.color_hex}
                onChange={(e) => setForm((f) => ({ ...f, color_hex: e.target.value }))}
                className="h-10 w-14 rounded-md border border-gray-300 dark:border-gray-600 cursor-pointer"
              />
              <Input
                value={form.color_hex}
                onChange={(e) => setForm((f) => ({ ...f, color_hex: e.target.value }))}
                placeholder="#10B981"
              />
            </div>
          </div>

          <Input
            label="Orden"
            type="number"
            value={form.order}
            onChange={(e) => setForm((f) => ({ ...f, order: Number(e.target.value) || 0 }))}
            helperText="Los rangos se ordenan de menor a mayor"
          />
        </div>

        <Switch
          label="Activo"
          checked={form.is_active}
          onCheckedChange={(v) => setForm((f) => ({ ...f, is_active: v }))}
        />
      </div>
    </BaseModal>
  );
}
