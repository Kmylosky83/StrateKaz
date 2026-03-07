/**
 * Modal de Formulario de Área/Departamento
 *
 * CRUD completo para áreas organizacionales.
 * Usa Design System: BaseModal, Input, Select, Textarea, Switch, IconPicker
 *
 * Features:
 * - Crear/Editar área
 * - Selector de área padre (jerarquía)
 * - Selector de responsable (usuario)
 * - Centro de costo opcional
 * - Icono y color dinámicos
 * - Validación de código único
 */
import { useEffect, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Building2, Palette } from 'lucide-react';
import { BaseModal } from '@/components/modals/BaseModal';
import { Button, DynamicIcon } from '@/components/common';
import { Input, Select, Textarea, Switch } from '@/components/forms';
import { AreaIconSelector } from './AreaIconSelector';
import {
  useAreas,
  useCreateArea,
  useUpdateArea,
  type Area,
  type CreateAreaDTO,
} from '../../hooks/useAreas';
import { useSelectUsers } from '@/hooks/useSelectLists';

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
  icon: string;
  color: string;
  is_active: boolean;
  orden: number;
}

// Opciones de colores disponibles
const COLOR_OPTIONS = [
  { value: 'purple', label: 'Morado', class: 'bg-purple-500' },
  { value: 'blue', label: 'Azul', class: 'bg-blue-500' },
  { value: 'green', label: 'Verde', class: 'bg-green-500' },
  { value: 'red', label: 'Rojo', class: 'bg-red-500' },
  { value: 'amber', label: 'Ámbar', class: 'bg-amber-500' },
  { value: 'orange', label: 'Naranja', class: 'bg-orange-500' },
  { value: 'teal', label: 'Turquesa', class: 'bg-teal-500' },
  { value: 'cyan', label: 'Cian', class: 'bg-cyan-500' },
  { value: 'indigo', label: 'Índigo', class: 'bg-indigo-500' },
  { value: 'pink', label: 'Rosa', class: 'bg-pink-500' },
  { value: 'gray', label: 'Gris', class: 'bg-gray-500' },
];

// ==================== COMPONENT ====================

export const AreaFormModal = ({ area, isOpen, onClose, onSuccess }: AreaFormModalProps) => {
  const isEditing = !!area;

  // Hooks de mutación
  const createMutation = useCreateArea();
  const updateMutation = useUpdateArea();

  // Query para obtener áreas (para selector de padre)
  const { data: areasData } = useAreas({ is_active: true });

  // Query para obtener usuarios (para selector de responsable)
  const { data: usersData } = useSelectUsers();

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
      icon: 'Building2',
      color: 'purple',
      is_active: true,
      orden: 0,
    },
  });

  // Watch para preview del icono
  const watchedIcon = watch('icon');
  const watchedColor = watch('color');

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
          icon: area.icon || 'Building2',
          color: area.color || 'purple',
          is_active: area.is_active,
          orden: area.orden || 0,
        });
      } else {
        reset({
          code: '',
          name: '',
          description: '',
          parent: '',
          cost_center: '',
          manager: '',
          icon: 'Building2',
          color: 'purple',
          is_active: true,
          orden: 0,
        });
      }
    }
  }, [isOpen, area, reset]);

  // Opciones de áreas padre (excluir área actual y sus hijos para evitar ciclos)
  const parentOptions = useMemo(() => {
    const areas = areasData?.results || [];
    // Filtrar área actual si estamos editando (no puede ser su propio padre)
    const filtered = area ? areas.filter((a) => a.id !== area.id) : areas;

    return [
      { value: '', label: 'Sin proceso padre (raiz)' },
      ...filtered.map((a) => ({
        value: a.id.toString(),
        label: a.name,
      })),
    ];
  }, [areasData?.results, area]);

  // Opciones de responsables
  const managerOptions = useMemo(() => {
    const users = usersData || [];
    return [
      { value: '', label: 'Sin responsable asignado' },
      ...users.map((u) => ({
        value: String(u.id),
        label: u.label,
      })),
    ];
  }, [usersData]);

  // Submit handler
  const onSubmit = async (data: AreaFormData) => {
    const payload: CreateAreaDTO = {
      code: data.code.toUpperCase().trim(),
      name: data.name.trim(),
      description: data.description?.trim() || undefined,
      parent: data.parent ? parseInt(data.parent, 10) : undefined,
      cost_center: data.cost_center?.trim() || undefined,
      manager: data.manager ? parseInt(data.manager, 10) : undefined,
      icon: data.icon || 'Building2',
      color: data.color || 'purple',
      is_active: data.is_active,
      orden: data.orden || 0,
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
      title={isEditing ? 'Editar Proceso' : 'Nuevo Proceso'}
      subtitle={
        isEditing
          ? `Modificar informacion del proceso ${area?.code}`
          : 'Complete los campos para crear un nuevo proceso organizacional'
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
            {isEditing ? 'Guardar Cambios' : 'Crear Proceso'}
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
              helperText="Codigo unico del proceso (3-20 caracteres)"
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
            placeholder="Descripción del proceso, alcance y responsabilidades..."
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
                  label="Proceso Padre"
                  options={parentOptions}
                  placeholder="Seleccionar proceso padre"
                  helperText="Deje vacio si es un proceso raiz"
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
                  helperText="Usuario responsable del proceso"
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
              error={errors.orden?.message}
              {...register('orden', {
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

        {/* Sección: Apariencia */}
        <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300 mb-2">
            <Palette className="h-4 w-4" />
            <span className="text-sm font-medium">Apariencia</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Preview del área */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Vista previa
              </label>
              <div className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                <div
                  className={`p-2 rounded-lg ${
                    watchedColor === 'blue'
                      ? 'bg-blue-100 dark:bg-blue-900/30'
                      : watchedColor === 'green'
                        ? 'bg-green-100 dark:bg-green-900/30'
                        : watchedColor === 'red'
                          ? 'bg-red-100 dark:bg-red-900/30'
                          : watchedColor === 'amber'
                            ? 'bg-amber-100 dark:bg-amber-900/30'
                            : watchedColor === 'orange'
                              ? 'bg-orange-100 dark:bg-orange-900/30'
                              : watchedColor === 'teal'
                                ? 'bg-teal-100 dark:bg-teal-900/30'
                                : watchedColor === 'cyan'
                                  ? 'bg-cyan-100 dark:bg-cyan-900/30'
                                  : watchedColor === 'indigo'
                                    ? 'bg-indigo-100 dark:bg-indigo-900/30'
                                    : watchedColor === 'pink'
                                      ? 'bg-pink-100 dark:bg-pink-900/30'
                                      : watchedColor === 'gray'
                                        ? 'bg-gray-100 dark:bg-gray-700'
                                        : 'bg-purple-100 dark:bg-purple-900/30'
                  }`}
                >
                  <DynamicIcon
                    name={watchedIcon || 'Building2'}
                    size={24}
                    className={
                      watchedColor === 'blue'
                        ? 'text-blue-600 dark:text-blue-400'
                        : watchedColor === 'green'
                          ? 'text-green-600 dark:text-green-400'
                          : watchedColor === 'red'
                            ? 'text-red-600 dark:text-red-400'
                            : watchedColor === 'amber'
                              ? 'text-amber-600 dark:text-amber-400'
                              : watchedColor === 'orange'
                                ? 'text-orange-600 dark:text-orange-400'
                                : watchedColor === 'teal'
                                  ? 'text-teal-600 dark:text-teal-400'
                                  : watchedColor === 'cyan'
                                    ? 'text-cyan-600 dark:text-cyan-400'
                                    : watchedColor === 'indigo'
                                      ? 'text-indigo-600 dark:text-indigo-400'
                                      : watchedColor === 'pink'
                                        ? 'text-pink-600 dark:text-pink-400'
                                        : watchedColor === 'gray'
                                          ? 'text-gray-600 dark:text-gray-400'
                                          : 'text-purple-600 dark:text-purple-400'
                    }
                  />
                </div>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Asi se vera el proceso
                </span>
              </div>
            </div>

            {/* Selector de Color */}
            <Controller
              name="color"
              control={control}
              render={({ field }) => (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Color
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {COLOR_OPTIONS.map((colorOpt) => (
                      <Button
                        key={colorOpt.value}
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => field.onChange(colorOpt.value)}
                        title={colorOpt.label}
                        disabled={isPending}
                        className={`!w-8 !h-8 !min-h-0 !p-0 rounded-full ${colorOpt.class} transition-all ${
                          field.value === colorOpt.value
                            ? 'ring-2 ring-offset-2 ring-gray-900 dark:ring-white scale-110'
                            : 'hover:scale-105'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Selecciona el color que identificara este proceso
                  </p>
                </div>
              )}
            />
          </div>

          {/* Selector de Icono */}
          <Controller
            name="icon"
            control={control}
            render={({ field }) => (
              <AreaIconSelector
                label="Icono del proceso"
                value={field.value}
                onChange={field.onChange}
                helperText="Selecciona un icono para identificar visualmente este proceso"
                disabled={isPending}
                columns={8}
              />
            )}
          />
        </div>

        {/* Sección: Estado */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <Controller
            name="is_active"
            control={control}
            render={({ field: { value, onChange, ...field } }) => (
              <Switch
                label="Proceso Activo"
                checked={value}
                onCheckedChange={onChange}
                description="Los procesos inactivos no aparecen en los selectores"
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
