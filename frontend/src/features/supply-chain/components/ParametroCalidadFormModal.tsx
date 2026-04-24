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
  codigo: string;
  nombre: string;
  unidad: string;
  descripcion: string;
  tipo_medida: string;
  is_active: boolean;
}

const emptyForm: FormState = {
  codigo: '',
  nombre: '',
  unidad: '',
  descripcion: '',
  tipo_medida: 'numero',
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
        codigo: parametro.codigo || '',
        nombre: parametro.nombre || '',
        unidad: parametro.unidad || '',
        descripcion: parametro.descripcion || '',
        tipo_medida: parametro.tipo_medida || 'numero',
        is_active: parametro.is_active ?? true,
      });
    } else {
      setForm({ ...emptyForm });
    }
  }, [parametro, isEditing, isOpen]);

  const handleSubmit = async () => {
    if (!form.nombre.trim() || !form.unidad.trim()) {
      const { toast } = await import('sonner');
      toast.warning('Complete los campos requeridos: Nombre y Unidad');
      return;
    }

    const payload = {
      nombre: form.nombre.trim(),
      unidad: form.unidad.trim(),
      descripcion: form.descripcion || undefined,
      tipo_medida: form.tipo_medida || undefined,
      is_active: form.is_active,
    };

    try {
      if (isEditing && parametro) {
        await updateMut.mutateAsync({ id: parametro.id, data: payload });
      } else {
        await createMut.mutateAsync({
          ...payload,
          codigo: form.codigo.trim() || form.nombre.trim().toUpperCase().replace(/\s+/g, '_'),
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
            value={form.codigo}
            onChange={(e) => setForm((f) => ({ ...f, codigo: e.target.value }))}
            helperText={!isEditing ? 'Opcional — se genera del nombre si se deja vacío' : undefined}
          />
          <Input
            label="Nombre *"
            placeholder="Acidez"
            required
            value={form.nombre}
            onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Unidad *"
            placeholder="%, kg, pH..."
            required
            value={form.unidad}
            onChange={(e) => setForm((f) => ({ ...f, unidad: e.target.value }))}
          />
          <Input
            label="Tipo de medida"
            placeholder="numero"
            value={form.tipo_medida}
            onChange={(e) => setForm((f) => ({ ...f, tipo_medida: e.target.value }))}
          />
        </div>

        <Textarea
          label="Descripción"
          rows={3}
          placeholder="Breve descripción del parámetro y su relevancia"
          value={form.descripcion}
          onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))}
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
