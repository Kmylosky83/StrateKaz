/**
 * Modal para crear/editar Categorías de Documentos
 *
 * Las categorías son dinámicas y pueden ser creadas por el usuario.
 * Usa colores e iconos configurables para identificación visual.
 *
 * Usa Design System:
 * - BaseModal para el contenedor
 * - Input, Select, Textarea para formulario
 * - Switch para opciones
 * - Badge para vista previa
 * - Button para acciones
 */
import { useState, useEffect, useMemo } from 'react';
import { BaseModal } from '@/components/modals/BaseModal';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Alert } from '@/components/common/Alert';
import { Input } from '@/components/forms/Input';
import { Select } from '@/components/forms/Select';
import { Textarea } from '@/components/forms/Textarea';
import { Switch } from '@/components/forms/Switch';
import {
  useCreateCategoria,
  useUpdateCategoria,
} from '../../hooks/useStrategic';
import type {
  CategoriaDocumento,
  CreateCategoriaDocumentoDTO,
  UpdateCategoriaDocumentoDTO,
} from '../../types/strategic.types';

interface CategoriaFormModalProps {
  categoria: CategoriaDocumento | null;
  isOpen: boolean;
  onClose: () => void;
}

interface FormData {
  code: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  order: number;
  is_active: boolean;
}

const defaultFormData: FormData = {
  code: '',
  name: '',
  description: '',
  color: '#3B82F6',
  icon: 'FolderOpen',
  order: 0,
  is_active: true,
};

// Colores predefinidos para categorías (hex colors)
const COLOR_OPTIONS = [
  { value: '#3B82F6', label: 'Azul', variant: 'primary' as const },
  { value: '#10B981', label: 'Verde', variant: 'success' as const },
  { value: '#8B5CF6', label: 'Morado', variant: 'purple' as const },
  { value: '#F59E0B', label: 'Ámbar', variant: 'warning' as const },
  { value: '#14B8A6', label: 'Teal', variant: 'info' as const },
  { value: '#6B7280', label: 'Gris', variant: 'secondary' as const },
  { value: '#EF4444', label: 'Rojo', variant: 'danger' as const },
  { value: '#EC4899', label: 'Rosa', variant: 'pink' as const },
];

// Iconos disponibles (nombres de Lucide)
const ICON_OPTIONS = [
  { value: 'FolderOpen', label: 'Carpeta' },
  { value: 'FileText', label: 'Documento' },
  { value: 'DollarSign', label: 'Finanzas' },
  { value: 'ShoppingCart', label: 'Compras' },
  { value: 'Shield', label: 'Gestión' },
  { value: 'Wrench', label: 'Mantenimiento' },
  { value: 'Users', label: 'Personal' },
  { value: 'Truck', label: 'Logística' },
  { value: 'Factory', label: 'Producción' },
  { value: 'ClipboardCheck', label: 'Calidad' },
  { value: 'AlertTriangle', label: 'Riesgos' },
  { value: 'BookOpen', label: 'Manual' },
  { value: 'Settings', label: 'Configuración' },
  { value: 'Package', label: 'Inventario' },
];

export const CategoriaFormModal = ({ categoria, isOpen, onClose }: CategoriaFormModalProps) => {
  const isEditing = categoria !== null;

  const [formData, setFormData] = useState<FormData>(defaultFormData);

  const createMutation = useCreateCategoria();
  const updateMutation = useUpdateCategoria();

  useEffect(() => {
    if (categoria) {
      setFormData({
        code: categoria.code,
        name: categoria.name,
        description: categoria.description || '',
        color: categoria.color || '#3B82F6',
        icon: categoria.icon || 'FolderOpen',
        order: categoria.order,
        is_active: categoria.is_active,
      });
    } else {
      setFormData(defaultFormData);
    }
  }, [categoria]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isEditing && categoria) {
      const updateData: UpdateCategoriaDocumentoDTO = {
        name: formData.name,
        description: formData.description || undefined,
        color: formData.color,
        icon: formData.icon,
        order: formData.order,
        is_active: formData.is_active,
      };
      await updateMutation.mutateAsync({ id: categoria.id, data: updateData });
    } else {
      const createData: CreateCategoriaDocumentoDTO = {
        code: formData.code.toUpperCase(),
        name: formData.name,
        description: formData.description || undefined,
        color: formData.color,
        icon: formData.icon,
        order: formData.order,
        is_active: formData.is_active,
      };
      await createMutation.mutateAsync(createData);
    }

    onClose();
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  // Obtener variante del badge según el color seleccionado
  const selectedColorVariant = useMemo(() => {
    const found = COLOR_OPTIONS.find(c => c.value === formData.color);
    return found?.variant || 'primary';
  }, [formData.color]);

  const footer = (
    <>
      <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
        Cancelar
      </Button>
      <Button
        type="submit"
        variant="primary"
        onClick={handleSubmit}
        disabled={isLoading || !formData.code || !formData.name}
        isLoading={isLoading}
      >
        {isEditing ? 'Guardar Cambios' : 'Crear Categoría'}
      </Button>
    </>
  );

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Categoría' : 'Nueva Categoría'}
      subtitle="Configura una categoría para agrupar tipos de documentos"
      size="lg"
      footer={footer}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Código y Nombre */}
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Código *"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
            placeholder="FINANCIERO"
            disabled={isEditing}
            required
            helperText="Identificador único (sin espacios)"
          />
          <Input
            label="Nombre *"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Financiero"
            required
            helperText="Nombre descriptivo"
          />
        </div>

        {/* Descripción */}
        <Textarea
          label="Descripción"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Documentos financieros y contables de la organización..."
          rows={3}
        />

        {/* Color e Icono */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Color
            </label>
            <div className="grid grid-cols-4 gap-2">
              {COLOR_OPTIONS.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, color: color.value })}
                  className={`
                    w-full h-10 rounded-lg border-2 transition-all
                    ${formData.color === color.value
                      ? 'border-gray-900 dark:border-white ring-2 ring-offset-2 ring-gray-400'
                      : 'border-transparent hover:border-gray-300'
                    }
                  `}
                  style={{ backgroundColor: color.value }}
                  title={color.label}
                />
              ))}
            </div>
          </div>
          <Select
            label="Icono"
            value={formData.icon}
            onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
            options={ICON_OPTIONS.map(i => ({ value: i.value, label: i.label }))}
          />
        </div>

        {/* Vista previa */}
        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Vista previa:</p>
          <div className="flex items-center gap-3">
            <Badge variant={selectedColorVariant} size="md">
              {formData.name || 'Nombre de la categoría'}
            </Badge>
            <span className="text-sm text-gray-500">
              ({formData.code || 'CODIGO'})
            </span>
          </div>
        </div>

        {/* Orden */}
        <Input
          label="Orden de visualización"
          type="number"
          value={formData.order.toString()}
          onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
          min={0}
          helperText="Menor número aparece primero"
        />

        {/* Estado activo */}
        {isEditing && (
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Categoría Activa</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Las categorías inactivas no aparecen en los selectores
              </p>
            </div>
            <Switch
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
            />
          </div>
        )}

        {/* Advertencia si es del sistema */}
        {categoria?.is_system && (
          <Alert
            variant="warning"
            message="Esta es una categoría del sistema. Algunos campos no pueden modificarse."
          />
        )}
      </form>
    </BaseModal>
  );
};
