/**
 * PlantillaFormModal - Modal para crear/editar plantillas de flujo
 *
 * Campos: nombre, descripcion, categoria, version (display), tiempo estimado,
 * requiere aprobacion gerencia, permite cancelacion, etiquetas.
 */
import { useState, useEffect } from 'react';
import { Button, Spinner } from '@/components/common';
import { BaseModal } from '@/components/modals/BaseModal';
import { Input, Select, Textarea } from '@/components/forms';
import { useCreatePlantilla, useUpdatePlantilla, useCategorias } from '../hooks/useWorkflows';
import type { PlantillaFlujo, CreatePlantillaDTO } from '../types/workflow.types';

interface PlantillaFormModalProps {
  item: PlantillaFlujo | null;
  isOpen: boolean;
  onClose: () => void;
}

const INITIAL_FORM: CreatePlantillaDTO = {
  codigo: '',
  nombre: '',
  descripcion: '',
  categoria: undefined,
  tiempo_estimado_horas: '',
  requiere_aprobacion_gerencia: false,
  permite_cancelacion: true,
  etiquetas: [],
};

export default function PlantillaFormModal({ item, isOpen, onClose }: PlantillaFormModalProps) {
  const [formData, setFormData] = useState<CreatePlantillaDTO>(INITIAL_FORM);
  const [etiquetasText, setEtiquetasText] = useState('');

  const createMutation = useCreatePlantilla();
  const updateMutation = useUpdatePlantilla();
  const { data: categoriasData } = useCategorias();

  const categorias = Array.isArray(categoriasData)
    ? categoriasData
    : (categoriasData?.results ?? []);

  const isLoading = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (item) {
      setFormData({
        codigo: item.codigo || '',
        nombre: item.nombre || '',
        descripcion: item.descripcion || '',
        categoria: item.categoria || undefined,
        tiempo_estimado_horas: item.tiempo_estimado_horas || '',
        requiere_aprobacion_gerencia: item.requiere_aprobacion_gerencia ?? false,
        permite_cancelacion: item.permite_cancelacion ?? true,
        etiquetas: item.etiquetas || [],
      });
      setEtiquetasText((item.etiquetas || []).join(', '));
    } else {
      setFormData(INITIAL_FORM);
      setEtiquetasText('');
    }
  }, [item, isOpen]);

  const handleChange = (field: keyof CreatePlantillaDTO, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const payload = { ...formData };

    // Parsear etiquetas desde texto
    payload.etiquetas = etiquetasText
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    // Limpiar FK opcionales vacíos
    if (!payload.categoria) delete payload.categoria;
    if (!payload.tiempo_estimado_horas) delete payload.tiempo_estimado_horas;

    if (item) {
      updateMutation.mutate({ id: item.id, data: payload }, { onSuccess: onClose });
    } else {
      createMutation.mutate(payload, {
        onSuccess: onClose,
      });
    }
  };

  const categoriasOptions = categorias.map((c) => ({
    value: String(c.id),
    label: c.nombre,
  }));

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={item ? 'Editar Plantilla de Flujo' : 'Nueva Plantilla de Flujo'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Código */}
          <Input
            label="Código *"
            value={formData.codigo}
            onChange={(e) => handleChange('codigo', e.target.value.toUpperCase())}
            placeholder="Ej: APROBACION_COMPRAS"
            required
            disabled={!!item}
            helperText={item ? 'El código no se puede modificar' : undefined}
          />

          {/* Nombre */}
          <Input
            label="Nombre *"
            value={formData.nombre}
            onChange={(e) => handleChange('nombre', e.target.value)}
            placeholder="Ej: Flujo de Aprobación de Compras"
            required
          />

          {/* Categoría */}
          <Select
            label="Categoría"
            value={String(formData.categoria || '')}
            onChange={(e) =>
              handleChange('categoria', e.target.value ? Number(e.target.value) : undefined)
            }
          >
            <option value="">Sin categoría</option>
            {categoriasOptions.map((op) => (
              <option key={op.value} value={op.value}>
                {op.label}
              </option>
            ))}
          </Select>

          {/* Tiempo estimado */}
          <Input
            label="Tiempo Estimado (horas)"
            type="number"
            value={formData.tiempo_estimado_horas || ''}
            onChange={(e) => handleChange('tiempo_estimado_horas', e.target.value)}
            placeholder="Ej: 24"
            min="0"
            step="0.5"
          />
        </div>

        {/* Descripción */}
        <Textarea
          label="Descripción"
          value={formData.descripcion || ''}
          onChange={(e) => handleChange('descripcion', e.target.value)}
          placeholder="Describe el propósito de este flujo de trabajo..."
          rows={3}
        />

        {/* Etiquetas */}
        <Input
          label="Etiquetas"
          value={etiquetasText}
          onChange={(e) => setEtiquetasText(e.target.value)}
          placeholder="compras, aprobación, finanzas (separar con comas)"
          helperText="Separa las etiquetas con comas"
        />

        {/* Opciones */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
              formData.requiere_aprobacion_gerencia
                ? 'bg-purple-50 border-purple-300 dark:bg-purple-900/20 dark:border-purple-700'
                : 'bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700'
            }`}
            onClick={() =>
              handleChange('requiere_aprobacion_gerencia', !formData.requiere_aprobacion_gerencia)
            }
          >
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Requiere aprobación de gerencia
            </span>
            <div
              className={`w-10 h-5 rounded-full relative transition-colors ${
                formData.requiere_aprobacion_gerencia
                  ? 'bg-purple-600'
                  : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <div
                className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                  formData.requiere_aprobacion_gerencia ? 'translate-x-5' : 'translate-x-0.5'
                }`}
              />
            </div>
          </div>

          <div
            className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
              formData.permite_cancelacion
                ? 'bg-green-50 border-green-300 dark:bg-green-900/20 dark:border-green-700'
                : 'bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700'
            }`}
            onClick={() => handleChange('permite_cancelacion', !formData.permite_cancelacion)}
          >
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Permite cancelación
            </span>
            <div
              className={`w-10 h-5 rounded-full relative transition-colors ${
                formData.permite_cancelacion ? 'bg-green-600' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <div
                className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                  formData.permite_cancelacion ? 'translate-x-5' : 'translate-x-0.5'
                }`}
              />
            </div>
          </div>
        </div>

        {/* Versión (solo lectura en edición) */}
        {item && (
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <span>Versión actual:</span>
            <span className="font-mono font-medium text-gray-900 dark:text-gray-100">
              v{item.version}
            </span>
            <span className="text-gray-400">|</span>
            <span>Estado:</span>
            <span className="font-medium text-gray-900 dark:text-gray-100">{item.estado}</span>
          </div>
        )}

        {/* Botones */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={isLoading || !formData.nombre.trim() || !formData.codigo.trim()}
          >
            {isLoading ? (
              <>
                <Spinner size="sm" className="mr-2" />
                Guardando...
              </>
            ) : (
              <>{item ? 'Actualizar' : 'Crear'} Plantilla</>
            )}
          </Button>
        </div>
      </form>
    </BaseModal>
  );
}
