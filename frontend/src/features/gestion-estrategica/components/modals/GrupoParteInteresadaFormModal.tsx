/**
 * Modal para CRUD de Grupos de Partes Interesadas Custom
 *
 * Sprint 17: Permite crear/editar grupos empresariales personalizados
 * (los grupos del sistema con es_sistema=true NO se pueden editar/eliminar)
 *
 * Campos: codigo, nombre, descripcion, icono, color
 *
 * Ubicacion: gestion-estrategica/contexto
 * API: /gestion-estrategica/contexto/grupos-parte-interesada/
 */
import React, { useState, useEffect } from 'react';
import { BaseModal } from '@/components/modals/BaseModal';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/forms/Input';
import { Textarea } from '@/components/forms/Textarea';
import { Select } from '@/components/forms/Select';
import { Alert } from '@/components/common/Alert';
import {
  useCreateGrupoParteInteresada,
  useUpdateGrupoParteInteresada,
  type GrupoParteInteresada,
} from '../../hooks/usePartesInteresadas';

// =============================================================================
// CONSTANTES
// =============================================================================

const ICONO_OPTIONS = [
  { value: 'Users', label: 'Usuarios (Users)' },
  { value: 'Building2', label: 'Edificio (Building2)' },
  { value: 'ShoppingCart', label: 'Carrito (ShoppingCart)' },
  { value: 'Truck', label: 'Camión (Truck)' },
  { value: 'TrendingUp', label: 'Tendencia (TrendingUp)' },
  { value: 'MapPin', label: 'Ubicación (MapPin)' },
  { value: 'Landmark', label: 'Monumento (Landmark)' },
  { value: 'Globe', label: 'Globo (Globe)' },
  { value: 'Leaf', label: 'Hoja (Leaf)' },
  { value: 'Briefcase', label: 'Maletín (Briefcase)' },
  { value: 'UserCircle', label: 'Usuario círculo (UserCircle)' },
  { value: 'LayoutGrid', label: 'Cuadrícula (LayoutGrid)' },
];

const COLOR_OPTIONS = [
  { value: '#3B82F6', label: 'Azul (Blue)' },
  { value: '#10B981', label: 'Verde (Green)' },
  { value: '#F59E0B', label: 'Naranja (Orange)' },
  { value: '#EF4444', label: 'Rojo (Red)' },
  { value: '#8B5CF6', label: 'Violeta (Purple)' },
  { value: '#EC4899', label: 'Rosa (Pink)' },
  { value: '#06B6D4', label: 'Cyan (Cyan)' },
  { value: '#6B7280', label: 'Gris (Gray)' },
];

// =============================================================================
// INTERFACES
// =============================================================================

interface GrupoParteInteresadaFormModalProps {
  grupo: GrupoParteInteresada | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface FormData {
  codigo: string;
  nombre: string;
  descripcion: string;
  icono: string;
  color: string;
}

// =============================================================================
// COMPONENTE
// =============================================================================

export const GrupoParteInteresadaFormModal = ({
  grupo,
  isOpen,
  onClose,
  onSuccess,
}: GrupoParteInteresadaFormModalProps) => {
  const isEditing = !!grupo;
  const [formData, setFormData] = useState<FormData>({
    codigo: '',
    nombre: '',
    descripcion: '',
    icono: 'Users',
    color: '#3B82F6',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Mutations
  const { create, isCreating } = useCreateGrupoParteInteresada();
  const { update, isUpdating } = useUpdateGrupoParteInteresada();

  // Cargar datos del grupo al editar
  useEffect(() => {
    if (grupo) {
      setFormData({
        codigo: grupo.codigo,
        nombre: grupo.nombre,
        descripcion: grupo.descripcion || '',
        icono: grupo.icono || 'Users',
        color: grupo.color || '#3B82F6',
      });
    } else {
      setFormData({
        codigo: '',
        nombre: '',
        descripcion: '',
        icono: 'Users',
        color: '#3B82F6',
      });
    }
    setErrors({});
  }, [grupo, isOpen]);

  // Validaciones
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.codigo.trim()) {
      newErrors.codigo = 'El código es obligatorio';
    }
    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es obligatorio';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      if (isEditing) {
        await update(grupo.id, formData);
      } else {
        await create(formData);
      }
      onSuccess?.();
      onClose();
    } catch {
      // Los hooks ya manejan el toast de error
    }
  };

  const isLoading = isCreating || isUpdating;

  const footer = (
    <>
      <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
        Cancelar
      </Button>
      <Button
        type="submit"
        variant="primary"
        onClick={handleSubmit}
        disabled={isLoading}
        isLoading={isLoading}
      >
        {isEditing ? 'Actualizar' : 'Crear'}
      </Button>
    </>
  );

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Grupo' : 'Nuevo Grupo'}
      size="md"
      footer={footer}
    >
      {grupo?.es_sistema && (
        <Alert
          variant="warning"
          message="Este es un grupo del sistema. No se puede modificar su código ni eliminarlo."
          className="mb-4"
        />
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Código */}
        <Input
          label="Código *"
          placeholder="Ej: GEXT-CUSTOM"
          value={formData.codigo}
          onChange={(e) => setFormData({ ...formData, codigo: e.target.value.toUpperCase() })}
          error={errors.codigo}
          disabled={grupo?.es_sistema}
          maxLength={20}
        />

        {/* Nombre */}
        <Input
          label="Nombre *"
          placeholder="Ej: Grupos Externos Personalizados"
          value={formData.nombre}
          onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
          error={errors.nombre}
          maxLength={100}
        />

        {/* Descripción */}
        <Textarea
          label="Descripción"
          placeholder="Breve descripción del grupo..."
          value={formData.descripcion}
          onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
          rows={3}
        />

        {/* Icono */}
        <Select
          label="Icono"
          value={formData.icono}
          onChange={(e) => setFormData({ ...formData, icono: e.target.value })}
          options={ICONO_OPTIONS}
        />

        {/* Color */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Color
          </label>
          <div className="grid grid-cols-4 gap-2">
            {COLOR_OPTIONS.map((opt) => (
              <Button
                key={opt.value}
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setFormData({ ...formData, color: opt.value })}
                className={`h-10 rounded-lg border-2 transition-all !min-h-0 !p-0 ${
                  formData.color === opt.value
                    ? 'border-gray-900 dark:border-gray-100 scale-105'
                    : 'border-gray-300 dark:border-gray-600'
                }`}
                style={{ backgroundColor: opt.value }}
                title={opt.label}
              />
            ))}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            Color seleccionado: {COLOR_OPTIONS.find((c) => c.value === formData.color)?.label}
          </p>
        </div>
      </form>
    </BaseModal>
  );
};

export default GrupoParteInteresadaFormModal;
