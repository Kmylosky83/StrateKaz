/**
 * Modal para crear/editar ParametroCalidad (catálogo QC de Supply Chain).
 *
 * Un parámetro representa una magnitud medible al recepcionar MP (acidez,
 * humedad, densidad, pH...). Sus clasificaciones se gestionan aparte como
 * RangoCalidad via RangoCalidadFormModal.
 */
import { useEffect, useState } from 'react';

import { BaseModal } from '@/components/modals/BaseModal';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/forms/Input';
import { Textarea } from '@/components/forms/Textarea';
import { Switch } from '@/components/forms/Switch';

import {
  useCreateParametroCalidad,
  useUpdateParametroCalidad,
} from '../hooks/useParametrosCalidad';
import type { ParametroCalidad } from '../types/calidad.types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  parametro: ParametroCalidad | null;
}

interface FormState {
  code: string;
  name: string;
  unit: string;
  description: string;
  decimals: number;
  is_active: boolean;
}

const emptyForm: FormState = {
  code: '',
  name: '',
  unit: '',
  description: '',
  decimals: 2,
  is_active: true,
};

export default function ParametroCalidadFormModal({ isOpen, onClose, parametro }: Props) {
  const isEditing = parametro !== null;
  const [form, setForm] = useState<FormState>(emptyForm);

  const createMut = useCreateParametroCalidad();
  const updateMut = useUpdateParametroCalidad();
  const isLoading = createMut.isPending || updateMut.isPending;

  useEffect(() => {
    if (isEditing && parametro) {
      setForm({
        code: parametro.code || '',
        name: parametro.name || '',
        unit: parametro.unit || '',
        description: parametro.description || '',
        decimals: parametro.decimals ?? 2,
        is_active: parametro.is_active ?? true,
      });
    } else {
      setForm({ ...emptyForm });
    }
  }, [parametro, isEditing, isOpen]);

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.unit.trim()) {
      const { toast } = await import('sonner');
      toast.warning('Complete los campos requeridos: Nombre y Unidad');
      return;
    }

    const payload = {
      name: form.name.trim(),
      unit: form.unit.trim(),
      description: form.description || undefined,
      decimals: form.decimals,
      is_active: form.is_active,
    };

    try {
      if (isEditing && parametro) {
        await updateMut.mutateAsync({ id: parametro.id, data: payload });
      } else {
        await createMut.mutateAsync({
          ...payload,
          code: form.code.trim() || form.name.trim().toUpperCase().replace(/\s+/g, '_'),
        });
      }
      onClose();
    } catch {
      // Toast ya se muestra en el hook.
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Parámetro de Calidad' : 'Nuevo Parámetro de Calidad'}
      subtitle="Magnitud medible al recepcionar materia prima"
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
            label="Código"
            placeholder="ACIDEZ"
            value={form.code}
            onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
            helperText={!isEditing ? 'Opcional — se genera del nombre si se deja vacío' : undefined}
          />
          <Input
            label="Nombre *"
            placeholder="Acidez"
            required
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Unidad *"
            placeholder="%, kg, pH..."
            required
            value={form.unit}
            onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
          />
          <Input
            label="Decimales"
            type="number"
            min={0}
            max={6}
            value={form.decimals}
            onChange={(e) => setForm((f) => ({ ...f, decimals: Number(e.target.value) || 0 }))}
          />
        </div>

        <Textarea
          label="Descripción"
          rows={3}
          placeholder="Breve descripción del parámetro y su relevancia"
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
        />

        <Switch
          label="Activo"
          description="Los parámetros inactivos no aparecen en la sección QC del voucher"
          checked={form.is_active}
          onCheckedChange={(v) => setForm((f) => ({ ...f, is_active: v }))}
        />
      </div>
    </BaseModal>
  );
}
