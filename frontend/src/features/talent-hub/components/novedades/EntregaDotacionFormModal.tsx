/**
 * EntregaDotacionFormModal - Formulario para crear/editar entregas de dotacion
 */
import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { BaseModal } from '@/components/modals/BaseModal';
import { Input } from '@/components/forms/Input';
import { Select } from '@/components/forms/Select';
import { Textarea } from '@/components/forms/Textarea';
import { Checkbox } from '@/components/forms/Checkbox';
import { Button } from '@/components/common/Button';
import { Plus, Trash2 } from 'lucide-react';
import { useCreateEntregaDotacion, useUpdateEntregaDotacion } from '../../hooks/useNovedades';
import { useColaboradores } from '../../hooks/useColaboradores';
import type { EntregaDotacion, EntregaDotacionFormData } from '../../types';
import { periodoDotacionOptions } from '../../types';

interface EntregaDotacionFormModalProps {
  entrega: EntregaDotacion | null;
  isOpen: boolean;
  onClose: () => void;
}

interface ItemEntregado {
  descripcion: string;
  talla?: string;
  cantidad?: number;
}

export const EntregaDotacionFormModal = ({
  entrega,
  isOpen,
  onClose,
}: EntregaDotacionFormModalProps) => {
  const isEditing = !!entrega;

  const { data: colaboradores } = useColaboradores();
  const createMutation = useCreateEntregaDotacion();
  const updateMutation = useUpdateEntregaDotacion();

  const [items, setItems] = useState<ItemEntregado[]>([
    { descripcion: '', talla: '', cantidad: 1 },
  ]);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EntregaDotacionFormData>({
    defaultValues: {
      colaborador: 0,
      periodo: 'abril',
      anio: new Date().getFullYear(),
      fecha_entrega: '',
      items_entregados: [],
      firma_recibido: false,
      observaciones: '',
    },
  });

  useEffect(() => {
    if (entrega) {
      reset({
        colaborador: entrega.colaborador,
        periodo: entrega.periodo,
        anio: entrega.anio,
        fecha_entrega: entrega.fecha_entrega,
        items_entregados: entrega.items_entregados,
        firma_recibido: entrega.firma_recibido,
        observaciones: entrega.observaciones,
      });
      setItems(
        entrega.items_entregados.length > 0
          ? entrega.items_entregados
          : [{ descripcion: '', talla: '', cantidad: 1 }]
      );
    } else {
      reset({
        colaborador: 0,
        periodo: 'abril',
        anio: new Date().getFullYear(),
        fecha_entrega: '',
        items_entregados: [],
        firma_recibido: false,
        observaciones: '',
      });
      setItems([{ descripcion: '', talla: '', cantidad: 1 }]);
    }
  }, [entrega, reset]);

  const onSubmit = async (data: EntregaDotacionFormData) => {
    try {
      const formData = {
        ...data,
        items_entregados: items.filter((item) => item.descripcion.trim() !== ''),
      };

      if (isEditing) {
        await updateMutation.mutateAsync({ id: entrega.id, data: formData });
      } else {
        await createMutation.mutateAsync(formData);
      }
      onClose();
    } catch (error) {
      // Error handled by mutation
    }
  };

  const addItem = () => {
    setItems([...items, { descripcion: '', talla: '', cantidad: 1 }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof ItemEntregado, value: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const colaboradoresOptions = (colaboradores || []).map((c) => ({
    value: String(c.id),
    label: c.nombre_completo || `${c.primer_nombre} ${c.primer_apellido}`,
  }));

  const currentYear = new Date().getFullYear();
  const anioOptions = Array.from({ length: 5 }, (_, i) => ({
    value: String(currentYear - i),
    label: String(currentYear - i),
  }));

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Entrega' : 'Registrar Entrega de Dotacion'}
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Controller
            name="colaborador"
            control={control}
            rules={{ required: 'El colaborador es requerido' }}
            render={({ field }) => (
              <Select
                label="Colaborador *"
                {...field}
                value={String(field.value)}
                onChange={(e) => field.onChange(Number(e.target.value))}
                options={colaboradoresOptions}
                error={errors.colaborador?.message}
              />
            )}
          />

          <Controller
            name="periodo"
            control={control}
            rules={{ required: 'El periodo es requerido' }}
            render={({ field }) => (
              <Select
                label="Periodo *"
                {...field}
                options={periodoDotacionOptions}
                error={errors.periodo?.message}
              />
            )}
          />

          <Controller
            name="anio"
            control={control}
            rules={{ required: 'El año es requerido' }}
            render={({ field }) => (
              <Select
                label="Año *"
                {...field}
                value={String(field.value)}
                onChange={(e) => field.onChange(Number(e.target.value))}
                options={anioOptions}
                error={errors.anio?.message}
              />
            )}
          />

          <Controller
            name="fecha_entrega"
            control={control}
            rules={{ required: 'La fecha de entrega es requerida' }}
            render={({ field }) => (
              <Input
                label="Fecha Entrega *"
                type="date"
                {...field}
                error={errors.fecha_entrega?.message}
              />
            )}
          />

          <Controller
            name="firma_recibido"
            control={control}
            render={({ field }) => (
              <div className="flex items-center h-full pt-6">
                <Checkbox label="Firma recibida" checked={field.value} onChange={field.onChange} />
              </div>
            )}
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Items Entregados
            </label>
            <Button type="button" variant="outline" size="sm" onClick={addItem}>
              <Plus size={14} className="mr-1" />
              Agregar Item
            </Button>
          </div>

          <div className="space-y-3">
            {items.map((item, index) => (
              <div key={index} className="flex gap-3 items-start">
                <div className="flex-1">
                  <Input
                    placeholder="Descripcion (ej: Camisa polo)"
                    value={item.descripcion}
                    onChange={(e) => updateItem(index, 'descripcion', e.target.value)}
                  />
                </div>
                <div className="w-24">
                  <Input
                    placeholder="Talla"
                    value={item.talla || ''}
                    onChange={(e) => updateItem(index, 'talla', e.target.value)}
                  />
                </div>
                <div className="w-20">
                  <Input
                    type="number"
                    placeholder="Cant."
                    value={item.cantidad || 1}
                    onChange={(e) => updateItem(index, 'cantidad', Number(e.target.value))}
                    min={1}
                  />
                </div>
                {items.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeItem(index)}
                    className="text-gray-400 hover:text-red-600"
                  >
                    <Trash2 size={16} />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>

        <Controller
          name="observaciones"
          control={control}
          render={({ field }) => (
            <Textarea
              label="Observaciones"
              {...field}
              rows={3}
              placeholder="Observaciones adicionales..."
            />
          )}
        />

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={createMutation.isPending || updateMutation.isPending}
          >
            {isEditing ? 'Actualizar' : 'Registrar'}
          </Button>
        </div>
      </form>
    </BaseModal>
  );
};
