/**
 * Modal de Formulario de Área/Departamento
 *
 * CRUD completo para áreas organizacionales.
 * Usa Design System: BaseModal, Input, Select, Textarea, Switch
 *
 * Features:
 * - Crear/Editar área
 * - Selector de área padre (jerarquía)
 * - Selector de responsable (usuario)
 * - Centro de costo opcional
 * - Validación de código único
 */
import { useEffect, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Building2 } from 'lucide-react';
import { BaseModal } from '@/components/modals/BaseModal';
import { Button } from '@/components/common/Button';
import { Input, Select, Textarea, Switch } from '@/components/forms';
import {
  useAreas,
  useCreateArea,
  useUpdateArea,
  type Area,
  type CreateAreaDTO,
} from '../../hooks/useAreas';
import { usersAPI } from '@/api/users.api';
import { useQuery } from '@tanstack/react-query';

// ==================== TYPES ====================

interface AreaFormModalProps {
  /** Área a editar (null = crear nueva) */
  area: Area | null;
  /** Control de apertura */
  isOpen: boolean;
  /** Callback al cerrar */
  onClose: () => void;
  /** Callback opcional al guardar exitosamente */
  onSuccess?: (area: Area) => void;
}

interface AreaFormData {
  code: string;
  name: string;
  description: string;
  parent: string; // string para el select, se convierte a number
  cost_center: string;
  manager: string; // string para el select, se convierte a number
  is_active: boolean;
  order: number;
}

// ==================== COMPONENT ====================

export const AreaFormModal = ({
  area,
  isOpen,
  onClose,
  onSuccess,
}: AreaFormModalProps) => {
  const isEditing = !!area;

  // Hooks de mutación
  const createMutation = useCreateArea();
  const updateMutation = useUpdateArea();

  // Query para obtener áreas (para selector de padre)
  const { data: areasData } = useAreas({ is_active: true });

  // Query para obtener usuarios (para selector de responsable)
  const { data: usersData } = useQuery({
    queryKey: ['users', 'active'],
    queryFn: () => usersAPI.getUsers({ is_active: true }),
  });

  // Formulario
  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<AreaFormData>({
    defaultValues: {
      code: '',
      name: '',
      description: '',
      parent: '',
      cost_center: '',
      manager: '',
      is_active: true,
      order: 0,
    },
  });

  // Reset form cuando se abre/cierra o cambia el área
  useEffect(() => {
    if (isOpen) {
      if (area) {
        reset({
          code: area.code,
          name: area.name,
          description: area.description || '',
          parent: area.parent?.toString() || '',
          cost_center: area.cost_center || '',
          manager: area.manager?.toString() || '',
          is_active: area.is_active,
          order: area.order || 0,
        });
      } else {
        reset({
          code: '',
          name: '',
          description: '',
          parent: '',
          cost_center: '',
          manager: '',
          is_active: true,
          order: 0,
        });
      }
    }
  }, [isOpen, area, reset]);

  // Opciones de áreas padre (excluir área actual y sus hijos para evitar ciclos)
  const parentOptions = useMemo(() => {
    const areas = areasData?.results || [];
    // Filtrar área actual si estamos editando (no puede ser su propio padre)
    const filtered = area
      ? areas.filter((a) => a.id !== area.id)
      : areas;

    return [
      { value: '', label: 'Sin área padre (raíz)' },
      ...filtered.map((a) => ({
        value: a.id.toString(),
        label: `${a.code} - ${a.name}`,
      })),
    ];
  }, [areasData?.results, area]);

  // Opciones de responsables
  const managerOptions = useMemo(() => {
    const users = usersData?.results || [];
    return [
      { value: '', label: 'Sin responsable asignado' },
      ...users.map((u) => ({
        value: u.id.toString(),
        label: `${u.first_name} ${u.last_name}`.trim() || u.username,
      })),
    ];
  }, [usersData?.results]);

  // Submit handler
  const onSubmit = async (data: AreaFormData) => {
    const payload: CreateAreaDTO = {
      code: data.code.toUpperCase().trim(),
      name: data.name.trim(),
      description: data.description?.trim() || undefined,
      parent: data.parent ? parseInt(data.parent, 10) : undefined,
      cost_center: data.cost_center?.trim() || undefined,
      manager: data.manager ? parseInt(data.manager, 10) : undefined,
      is_active: data.is_active,
      order: data.order || 0,
    };

    try {
      let result: Area;
      if (isEditing && area) {
        result = await updateMutation.mutateAsync({ id: area.id, data: payload });
      } else {
        result = await createMutation.mutateAsync(payload);
      }
      onSuccess?.(result);
      onClose();
    } catch {
      // Error ya manejado en el hook con toast
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Área' : 'Nueva Área'}
      subtitle={
        isEditing
          ? `Modificar información del área ${area?.code}`
          : 'Complete los campos para crear una nueva área o departamento'
      }
      size="lg"
      id="area-form-modal"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit(onSubmit)}
            disabled={isPending}
            isLoading={isPending}
          >
            {isEditing ? 'Guardar Cambios' : 'Crear Área'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Sección: Información Básica */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300 mb-2">
            <Building2 className="h-4 w-4" />
            <span className="text-sm font-medium">Información Básica</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Código */}
            <Input
              label="Código *"
              placeholder="Ej: GER, OPE, ADM"
              error={errors.code?.message}
              helperText="Código único del área (3-20 caracteres)"
              {...register('code', {
                required: 'El código es obligatorio',
                minLength: {
                  value: 2,
                  message: 'Mínimo 2 caracteres',
                },
                maxLength: {
                  value: 20,
                  message: 'Máximo 20 caracteres',
                },
                pattern: {
                  value: /^[A-Za-z0-9_-]+$/,
                  message: 'Solo letras, números, guiones y guiones bajos',
                },
              })}
              className="uppercase"
              disabled={isPending}
            />

            {/* Nombre */}
            <Input
              label="Nombre *"
              placeholder="Ej: Gerencia General"
              error={errors.name?.message}
              {...register('name', {
                required: 'El nombre es obligatorio',
                minLength: {
                  value: 3,
                  message: 'Mínimo 3 caracteres',
                },
                maxLength: {
                  value: 100,
                  message: 'Máximo 100 caracteres',
                },
              })}
              disabled={isPending}
            />
          </div>

          {/* Descripción */}
          <Textarea
            label="Descripción"
            placeholder="Descripción de las funciones y responsabilidades del área..."
            rows={3}
            error={errors.description?.message}
            {...register('description', {
              maxLength: {
                value: 500,
                message: 'Máximo 500 caracteres',
              },
            })}
            disabled={isPending}
          />
        </div>

        {/* Sección: Jerarquía y Organización */}
        <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300 mb-2">
            <Building2 className="h-4 w-4" />
            <span className="text-sm font-medium">Jerarquía y Organización</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Área Padre */}
            <Controller
              name="parent"
              control={control}
              render={({ field }) => (
                <Select
                  label="Área Padre"
                  options={parentOptions}
                  placeholder="Seleccionar área padre"
                  helperText="Deje vacío si es un área raíz"
                  {...field}
                  disabled={isPending}
                />
              )}
            />

            {/* Centro de Costo */}
            <Input
              label="Centro de Costo"
              placeholder="Ej: CC-001"
              helperText="Código del centro de costo asociado"
              error={errors.cost_center?.message}
              {...register('cost_center', {
                maxLength: {
                  value: 50,
                  message: 'Máximo 50 caracteres',
                },
              })}
              disabled={isPending}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Responsable */}
            <Controller
              name="manager"
              control={control}
              render={({ field }) => (
                <Select
                  label="Responsable"
                  options={managerOptions}
                  placeholder="Seleccionar responsable"
                  helperText="Usuario responsable del área"
                  {...field}
                  disabled={isPending}
                />
              )}
            />

            {/* Orden */}
            <Input
              type="number"
              label="Orden de visualización"
              placeholder="0"
              helperText="Orden en que aparecerá en las listas"
              error={errors.order?.message}
              {...register('order', {
                valueAsNumber: true,
                min: {
                  value: 0,
                  message: 'El orden debe ser mayor o igual a 0',
                },
              })}
              disabled={isPending}
            />
          </div>
        </div>

        {/* Sección: Estado */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <Controller
            name="is_active"
            control={control}
            render={({ field: { value, onChange, ...field } }) => (
              <Switch
                label="Área Activa"
                checked={value}
                onCheckedChange={onChange}
                description="Las áreas inactivas no aparecen en los selectores"
                {...field}
                disabled={isPending}
              />
            )}
          />
        </div>
      </form>
    </BaseModal>
  );
};

export default AreaFormModal;
