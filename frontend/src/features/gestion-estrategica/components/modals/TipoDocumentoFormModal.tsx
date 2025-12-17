/**
 * Modal para crear/editar Tipos de Documento
 *
 * Los tipos de documento son dinámicos y pertenecen a una categoría.
 * Incluye prefijo sugerido para consecutivos.
 *
 * Usa Design System:
 * - BaseModal para el contenedor
 * - Input, Select, Textarea para formulario
 * - Switch para opciones
 * - Badge para categoría
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
  useCreateTipoDocumento,
  useUpdateTipoDocumento,
  useCategorias,
} from '../../hooks/useStrategic';
import type {
  TipoDocumento,
  CreateTipoDocumentoDTO,
  UpdateTipoDocumentoDTO,
  CategoriaDocumento,
} from '../../types/strategic.types';

interface TipoDocumentoFormModalProps {
  tipoDocumento: TipoDocumento | null;
  isOpen: boolean;
  onClose: () => void;
}

interface FormData {
  code: string;
  name: string;
  description: string;
  categoria: number | '';
  prefijo_sugerido: string;
  order: number;
  is_active: boolean;
}

const defaultFormData: FormData = {
  code: '',
  name: '',
  description: '',
  categoria: '',
  prefijo_sugerido: '',
  order: 0,
  is_active: true,
};

// Mapeo de colores hex a variantes de Badge
const colorToVariant = (color: string): 'primary' | 'success' | 'purple' | 'warning' | 'info' | 'secondary' | 'gray' | 'danger' => {
  const colorMap: Record<string, 'primary' | 'success' | 'purple' | 'warning' | 'info' | 'secondary' | 'gray' | 'danger'> = {
    '#10B981': 'success',
    '#8B5CF6': 'purple',
    '#F59E0B': 'warning',
    '#6B7280': 'secondary',
    '#3B82F6': 'primary',
    '#14B8A6': 'info',
    '#EF4444': 'danger',
  };
  return colorMap[color] || 'gray';
};

export const TipoDocumentoFormModal = ({ tipoDocumento, isOpen, onClose }: TipoDocumentoFormModalProps) => {
  const isEditing = tipoDocumento !== null;

  const [formData, setFormData] = useState<FormData>(defaultFormData);

  const createMutation = useCreateTipoDocumento();
  const updateMutation = useUpdateTipoDocumento();
  const { data: categoriasData } = useCategorias();

  // Crear mapa de categorías para acceso rápido
  const categoriasMap = useMemo(() => {
    const map = new Map<number, CategoriaDocumento>();
    categoriasData?.results?.forEach((cat) => map.set(cat.id, cat));
    return map;
  }, [categoriasData]);

  // Opciones de categorías para el select
  const categoriaOptions = useMemo(() => {
    if (!categoriasData?.results) return [];
    return categoriasData.results
      .filter(c => c.is_active)
      .map((cat) => ({
        value: String(cat.id),
        label: cat.name,
      }));
  }, [categoriasData]);

  useEffect(() => {
    if (tipoDocumento) {
      setFormData({
        code: tipoDocumento.code,
        name: tipoDocumento.name,
        description: tipoDocumento.description || '',
        categoria: tipoDocumento.categoria,
        prefijo_sugerido: tipoDocumento.prefijo_sugerido || '',
        order: tipoDocumento.order,
        is_active: tipoDocumento.is_active,
      });
    } else {
      setFormData(defaultFormData);
    }
  }, [tipoDocumento]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isEditing && tipoDocumento) {
      const updateData: UpdateTipoDocumentoDTO = {
        name: formData.name,
        description: formData.description || undefined,
        categoria: formData.categoria ? Number(formData.categoria) : undefined,
        prefijo_sugerido: formData.prefijo_sugerido || undefined,
        order: formData.order,
        is_active: formData.is_active,
      };
      await updateMutation.mutateAsync({ id: tipoDocumento.id, data: updateData });
    } else {
      if (!formData.categoria) return;
      const createData: CreateTipoDocumentoDTO = {
        code: formData.code.toUpperCase(),
        name: formData.name,
        description: formData.description || undefined,
        categoria: Number(formData.categoria),
        prefijo_sugerido: formData.prefijo_sugerido || undefined,
      };
      await createMutation.mutateAsync(createData);
    }

    onClose();
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  // Categoría seleccionada para mostrar badge
  const selectedCategoria = formData.categoria ? categoriasMap.get(Number(formData.categoria)) : null;

  const footer = (
    <>
      <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
        Cancelar
      </Button>
      <Button
        type="submit"
        variant="primary"
        onClick={handleSubmit}
        disabled={isLoading || !formData.code || !formData.name || !formData.categoria}
        isLoading={isLoading}
      >
        {isEditing ? 'Guardar Cambios' : 'Crear Tipo de Documento'}
      </Button>
    </>
  );

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Tipo de Documento' : 'Nuevo Tipo de Documento'}
      subtitle="Define un tipo de documento para usar en consecutivos y clasificación"
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
            placeholder="FACTURA"
            disabled={isEditing}
            required
            helperText="Identificador único (sin espacios)"
          />
          <Input
            label="Nombre *"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Factura de Venta"
            required
            helperText="Nombre descriptivo"
          />
        </div>

        {/* Categoría */}
        <Select
          label="Categoría *"
          value={formData.categoria?.toString() || ''}
          onChange={(e) => setFormData({ ...formData, categoria: e.target.value ? Number(e.target.value) : '' })}
          options={[{ value: '', label: 'Seleccionar categoría...' }, ...categoriaOptions]}
          required
        />

        {/* Vista previa de categoría */}
        {selectedCategoria && (
          <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <span className="text-sm text-gray-600 dark:text-gray-400">Categoría:</span>
            <Badge variant={colorToVariant(selectedCategoria.color)} size="sm">
              {selectedCategoria.name}
            </Badge>
          </div>
        )}

        {/* Descripción */}
        <Textarea
          label="Descripción"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Documento fiscal emitido al cliente..."
          rows={3}
        />

        {/* Prefijo Sugerido */}
        <Input
          label="Prefijo Sugerido para Consecutivo"
          value={formData.prefijo_sugerido}
          onChange={(e) => setFormData({ ...formData, prefijo_sugerido: e.target.value.toUpperCase() })}
          placeholder="FAC"
          helperText="Prefijo recomendado al crear consecutivos (ej: FAC, REC, OC)"
        />

        {/* Vista previa del consecutivo */}
        {formData.prefijo_sugerido && (
          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Ejemplo de consecutivo:</p>
            <code className="text-lg font-mono font-bold text-green-600 dark:text-green-400">
              {formData.prefijo_sugerido}-{new Date().getFullYear()}-0001
            </code>
          </div>
        )}

        {/* Orden */}
        <Input
          label="Orden de visualización"
          type="number"
          value={formData.order.toString()}
          onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
          min={0}
          helperText="Menor número aparece primero dentro de su categoría"
        />

        {/* Estado activo */}
        {isEditing && (
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Tipo de Documento Activo</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Los tipos inactivos no aparecen en los selectores
              </p>
            </div>
            <Switch
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
            />
          </div>
        )}

        {/* Advertencia si es del sistema */}
        {tipoDocumento?.is_system && (
          <Alert
            variant="warning"
            message="Este es un tipo de documento del sistema. Solo puede modificarse el nombre, descripción y prefijo sugerido."
          />
        )}

        {/* Info sobre consecutivos */}
        <Alert
          variant="info"
          message="Los tipos de documento se usan para clasificar documentos y configurar consecutivos automáticos. El prefijo sugerido facilita la creación de consecutivos."
        />
      </form>
    </BaseModal>
  );
};
