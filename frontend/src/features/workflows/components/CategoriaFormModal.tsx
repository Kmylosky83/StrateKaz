/**
 * CategoriaFormModal - CRUD modal para categorías de flujo
 *
 * Campos: nombre, descripcion, color (con preview), icono.
 */
import { useState, useEffect } from 'react';
import { Modal, Button, Spinner } from '@/components/common';
import { Input, Textarea } from '@/components/forms';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { categoriasApi } from '../api/workflowApi';
import type { CategoriaFlujo } from '../types/workflow.types';

interface CategoriaFormModalProps {
  item: CategoriaFlujo | null;
  isOpen: boolean;
  onClose: () => void;
}

interface FormState {
  nombre: string;
  descripcion: string;
  color: string;
  icono: string;
}

const INITIAL_FORM: FormState = {
  nombre: '',
  descripcion: '',
  color: '#8B5CF6',
  icono: 'GitBranch',
};

const PRESET_COLORS = [
  '#8B5CF6', // Purple
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#6366F1', // Indigo
];

export default function CategoriaFormModal({ item, isOpen, onClose }: CategoriaFormModalProps) {
  const [formData, setFormData] = useState<FormState>(INITIAL_FORM);
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data: Partial<CategoriaFlujo>) => categoriasApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wf-categorias'] });
      toast.success('Categoría creada exitosamente');
      onClose();
    },
    onError: () => toast.error('Error al crear la categoría'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CategoriaFlujo> }) =>
      categoriasApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wf-categorias'] });
      toast.success('Categoría actualizada');
      onClose();
    },
    onError: () => toast.error('Error al actualizar la categoría'),
  });

  const isLoading = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (item) {
      setFormData({
        nombre: item.nombre || '',
        descripcion: item.descripcion || '',
        color: item.color || '#8B5CF6',
        icono: item.icono || 'GitBranch',
      });
    } else {
      setFormData(INITIAL_FORM);
    }
  }, [item, isOpen]);

  const handleChange = (field: keyof FormState, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nombre.trim()) return;

    const payload: Partial<CategoriaFlujo> = {
      nombre: formData.nombre.trim(),
      descripcion: formData.descripcion.trim(),
      color: formData.color,
      icono: formData.icono.trim(),
    };

    if (item) {
      updateMutation.mutate({ id: item.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={item ? 'Editar Categoría' : 'Nueva Categoría'}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Nombre */}
        <Input
          label="Nombre *"
          value={formData.nombre}
          onChange={(e) => handleChange('nombre', e.target.value)}
          placeholder="Ej: Aprobaciones, HSEQ, Administrativo"
          required
        />

        {/* Descripción */}
        <Textarea
          label="Descripción"
          value={formData.descripcion}
          onChange={(e) => handleChange('descripcion', e.target.value)}
          placeholder="Describe el tipo de flujos que agrupa esta categoría..."
          rows={3}
        />

        {/* Icono */}
        <Input
          label="Icono"
          value={formData.icono}
          onChange={(e) => handleChange('icono', e.target.value)}
          placeholder="Ej: GitBranch, FileText, CheckCircle"
          helperText="Nombre del icono de Lucide React"
        />

        {/* Color */}
        <div className="space-y-2">
          <span className="block text-sm font-medium text-gray-700 dark:text-gray-300">Color</span>

          {/* Preset colors */}
          <div className="flex items-center gap-2">
            {PRESET_COLORS.map((color) => (
              <div
                key={color}
                onClick={() => handleChange('color', color)}
                className={`w-8 h-8 rounded-full cursor-pointer transition-all border-2 ${
                  formData.color === color
                    ? 'border-gray-900 dark:border-white scale-110 ring-2 ring-offset-2 ring-gray-400'
                    : 'border-transparent hover:scale-105'
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>

          {/* Custom color input */}
          <div className="flex items-center gap-3">
            <Input
              value={formData.color}
              onChange={(e) => handleChange('color', e.target.value)}
              placeholder="#8B5CF6"
              className="flex-1"
            />
            <div
              className="w-10 h-10 rounded-lg border border-gray-300 dark:border-gray-600 flex-shrink-0"
              style={{ backgroundColor: formData.color }}
            />
          </div>
        </div>

        {/* Preview */}
        <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <span className="block text-xs text-gray-500 dark:text-gray-400 mb-2">Vista previa</span>
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold"
              style={{ backgroundColor: formData.color }}
            >
              {formData.nombre ? formData.nombre.charAt(0).toUpperCase() : 'C'}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {formData.nombre || 'Nombre de la categoría'}
              </p>
              {formData.descripcion && (
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[250px]">
                  {formData.descripcion}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Botones */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading || !formData.nombre.trim()}>
            {isLoading ? (
              <>
                <Spinner size="sm" className="mr-2" />
                Guardando...
              </>
            ) : (
              <>{item ? 'Actualizar' : 'Crear'} Categoría</>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
