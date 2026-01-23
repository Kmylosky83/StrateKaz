/**
 * Modal para crear/editar Normas y Sistemas de Gestión
 *
 * Formulario completo para gestión de normas y sistemas de gestión con validación:
 * - Código único
 * - Nombre completo y corto
 * - Categoría
 * - Icono (selector)
 * - Color (color picker)
 * - Descripción
 * - Orden
 *
 * Usa Design System:
 * - BaseModal para el contenedor
 * - Input, Select, Textarea para formulario
 * - Button para acciones
 *
 * Soporta:
 * - Normas ISO (ISO 9001, ISO 14001, ISO 45001, ISO 27001)
 * - Sistemas Colombianos (SG-SST, PESV)
 * - Otras Normativas (Decreto 1072, Resoluciones, etc.)
 *
 * Restricciones:
 * - NO editar normas del sistema (es_sistema=true)
 * - Solo permitir crear normas custom
 * - Validar unicidad de código
 */
import { useState, useEffect } from 'react';
import { FileCheck, Palette } from 'lucide-react';
import { BaseModal } from '@/components/modals/BaseModal';
import { Button } from '@/components/common/Button';
import { Alert } from '@/components/common/Alert';
import { Input } from '@/components/forms/Input';
import { Select } from '@/components/forms/Select';
import { Textarea } from '@/components/forms/Textarea';
import { Switch } from '@/components/forms/Switch';
import {
  useCreateNormaISO,
  useUpdateNormaISO,
  useNormaISO,
  useNormasISOChoices,
} from '../../hooks/useNormasISO';
import type { NormaISO, CreateNormaISODTO } from '../../api/strategicApi';

interface NormaISOFormModalProps {
  norma: NormaISO | null;
  isOpen: boolean;
  onClose: () => void;
}

interface FormData {
  code: string;
  name: string;
  short_name: string;
  description: string;
  category: string;
  customCategory: string;
  icon: string;
  color: string;
  orden: string;
  is_active: boolean;
}

const defaultFormData: FormData = {
  code: '',
  name: '',
  short_name: '',
  description: '',
  category: '',
  customCategory: '',
  icon: 'FileCheck',
  color: '#3b82f6', // Blue-500 por defecto
  orden: '0',
  is_active: true,
};

// Valor especial para "Otra categoría"
const OTHER_CATEGORY_VALUE = '__OTHER__';

// Iconos disponibles (Lucide React)
const ICON_OPTIONS = [
  { value: 'FileCheck', label: 'FileCheck - Documento verificado' },
  { value: 'Shield', label: 'Shield - Escudo (Seguridad)' },
  { value: 'Award', label: 'Award - Premio (Calidad)' },
  { value: 'Leaf', label: 'Leaf - Hoja (Ambiental)' },
  { value: 'Users', label: 'Users - Personas (Recursos Humanos)' },
  { value: 'Lock', label: 'Lock - Candado (Seguridad Info)' },
  { value: 'Heart', label: 'Heart - Corazón (Salud)' },
  { value: 'TrendingUp', label: 'TrendingUp - Tendencia (Mejora)' },
  { value: 'BarChart3', label: 'BarChart3 - Gráfico (Gestión)' },
  { value: 'Target', label: 'Target - Objetivo (Metas)' },
];

// Colores predefinidos
const COLOR_PRESETS = [
  { value: '#3b82f6', label: 'Azul' },
  { value: '#10b981', label: 'Verde' },
  { value: '#f59e0b', label: 'Ámbar' },
  { value: '#ef4444', label: 'Rojo' },
  { value: '#8b5cf6', label: 'Púrpura' },
  { value: '#06b6d4', label: 'Cian' },
  { value: '#f97316', label: 'Naranja' },
  { value: '#ec4899', label: 'Rosa' },
  { value: '#6366f1', label: 'Índigo' },
  { value: '#14b8a6', label: 'Verde azulado' },
];

export const NormaISOFormModal = ({ norma, isOpen, onClose }: NormaISOFormModalProps) => {
  const isEditing = norma !== null;

  const [formData, setFormData] = useState<FormData>(defaultFormData);

  // Queries y mutations
  const { data: normaDetail } = useNormaISO(norma?.id || 0);
  const { data: choices } = useNormasISOChoices();
  const createMutation = useCreateNormaISO();
  const updateMutation = useUpdateNormaISO();

  // Cargar datos al editar
  useEffect(() => {
    if (isEditing && normaDetail) {
      // Verificar si la categoría existe en las opciones
      const categoryExists = choices?.categorias?.some((c) => c.value === normaDetail.category);

      setFormData({
        code: normaDetail.code,
        name: normaDetail.name,
        short_name: normaDetail.short_name || '',
        description: normaDetail.description || '',
        category: categoryExists ? normaDetail.category : OTHER_CATEGORY_VALUE,
        customCategory: categoryExists ? '' : normaDetail.category || '',
        icon: normaDetail.icon || 'FileCheck',
        color: normaDetail.color || '#3b82f6',
        orden: normaDetail.orden?.toString() || '0',
        is_active: normaDetail.is_active,
      });
    } else if (!isEditing) {
      setFormData(defaultFormData);
    }
  }, [normaDetail, isEditing, choices]);

  // Determinar la categoría final (del select o personalizada)
  const getFinalCategory = () => {
    if (formData.category === OTHER_CATEGORY_VALUE) {
      return formData.customCategory.trim();
    }
    return formData.category;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const finalCategory = getFinalCategory();

    const baseData: CreateNormaISODTO = {
      code: formData.code.toUpperCase(),
      name: formData.name,
      short_name: formData.short_name || undefined,
      description: formData.description || undefined,
      category: finalCategory,
      icon: formData.icon,
      color: formData.color,
      orden: parseInt(formData.orden) || 0,
      is_active: formData.is_active,
    };

    if (isEditing && norma) {
      await updateMutation.mutateAsync({
        id: norma.id,
        data: baseData,
      });
    } else {
      await createMutation.mutateAsync(baseData);
    }

    onClose();
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  // Opciones para categorías desde backend + opción "Otra..."
  const categoryOptions = [
    ...(choices?.categorias?.map((c) => ({
      value: c.value,
      label: c.label,
    })) || []),
    { value: OTHER_CATEGORY_VALUE, label: 'Otra categoría...' },
  ];

  // Validar si la categoría es válida
  const isCategoryValid =
    formData.category !== '' &&
    (formData.category !== OTHER_CATEGORY_VALUE || formData.customCategory.trim() !== '');

  const footer = (
    <>
      <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
        Cancelar
      </Button>
      <Button
        type="submit"
        variant="primary"
        onClick={handleSubmit}
        disabled={isLoading || !formData.code || !formData.name || !isCategoryValid}
        isLoading={isLoading}
      >
        {isEditing ? 'Guardar Cambios' : 'Agregar Norma'}
      </Button>
    </>
  );

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Norma o Sistema de Gestión' : 'Agregar Norma o Sistema de Gestión'}
      subtitle="Configure normas ISO, PESV, SG-SST u otras normativas aplicables"
      size="3xl"
      footer={footer}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Alerta de sistema */}
        {isEditing && norma?.es_sistema && (
          <Alert
            variant="warning"
            message="Esta es una norma del sistema y no puede ser editada completamente. Solo algunos campos están disponibles."
          />
        )}

        {/* Sección: Identificación */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
            Identificación
          </h4>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Código *"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              placeholder="Ej: ISO_9001, PESV, SG_SST"
              required
              disabled={isEditing && norma?.es_sistema}
              helperText="Código único para identificar la norma (Ej: ISO_9001, PESV, SG_SST)"
            />
            <Select
              label="Categoría de la Norma *"
              value={formData.category}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  category: e.target.value,
                  customCategory:
                    e.target.value !== OTHER_CATEGORY_VALUE ? '' : formData.customCategory,
                })
              }
              options={[{ value: '', label: 'Seleccione...' }, ...categoryOptions]}
              required
              disabled={isEditing && norma?.es_sistema}
            />
          </div>

          {/* Input para categoría personalizada */}
          {formData.category === OTHER_CATEGORY_VALUE && (
            <Input
              label="Nueva Categoría *"
              value={formData.customCategory}
              onChange={(e) => setFormData({ ...formData, customCategory: e.target.value })}
              placeholder="Ej: Seguridad Alimentaria, BPM, HACCP"
              required
              helperText="Escriba el nombre de la nueva categoría"
            />
          )}

          <Input
            label="Nombre Completo *"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Ej: ISO 9001:2015, PESV, SG-SST"
            required
          />

          <Input
            label="Nombre Corto"
            value={formData.short_name}
            onChange={(e) => setFormData({ ...formData, short_name: e.target.value })}
            placeholder="ISO 9001"
            helperText="Versión abreviada para mostrar en badges y menús"
          />

          <Textarea
            label="Descripción"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Descripción detallada de la norma..."
            rows={3}
          />
        </div>

        {/* Sección: Apariencia */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Apariencia
          </h4>

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Icono"
              value={formData.icon}
              onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
              options={ICON_OPTIONS}
              helperText="Icono visual para identificar la norma"
            />

            <Input
              label="Orden de Visualización"
              type="number"
              value={formData.orden}
              onChange={(e) => setFormData({ ...formData, orden: e.target.value })}
              placeholder="0"
              helperText="Orden en listas (menor = primero)"
            />
          </div>

          {/* Color Picker */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Color
            </label>
            <div className="flex items-center gap-4">
              <Input
                type="color"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="w-20 h-10"
              />
              <Input
                type="text"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                placeholder="#3b82f6"
                className="flex-1 font-mono"
                pattern="^#[0-9A-Fa-f]{6}$"
                helperText="Formato HEX (#RRGGBB)"
              />
            </div>

            {/* Color Presets */}
            <div className="flex flex-wrap gap-2 mt-3">
              <span className="text-xs text-gray-500 dark:text-gray-400 w-full">
                Colores predefinidos:
              </span>
              {COLOR_PRESETS.map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, color: preset.value })}
                  className={`w-8 h-8 rounded border-2 transition-all ${
                    formData.color === preset.value
                      ? 'border-gray-900 dark:border-white scale-110'
                      : 'border-gray-300 dark:border-gray-600 hover:scale-105'
                  }`}
                  style={{ backgroundColor: preset.value }}
                  title={preset.label}
                />
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Vista previa:</p>
            <div className="flex items-center gap-3">
              <div
                className="p-3 rounded-lg"
                style={{
                  backgroundColor: `${formData.color}20`,
                }}
              >
                <FileCheck className="h-6 w-6" style={{ color: formData.color }} />
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-gray-100">
                  {formData.name || 'Nombre de la norma'}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {formData.short_name || formData.code || 'CODIGO'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Sección: Estado */}
        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Norma Activa</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Desactive para ocultar esta norma en el sistema
            </p>
          </div>
          <Switch
            checked={formData.is_active}
            onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
          />
        </div>

        <Alert
          variant="info"
          message="Las normas y sistemas de gestión se utilizan en todo el sistema para categorizar políticas, alcances, objetivos y procesos."
        />
      </form>
    </BaseModal>
  );
};
