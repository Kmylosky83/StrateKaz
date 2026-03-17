/**
 * Modal de creación/edición de Consecutivos
 *
 * Patrón: BaseModal + useState form + create/update mutations.
 * Preview en vivo del formato generado.
 */
import { useState, useEffect } from 'react';
import { BaseModal } from '@/components/modals/BaseModal';
import { Input } from '@/components/forms/Input';
import { Select } from '@/components/forms/Select';
import { Switch } from '@/components/forms/Switch';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { useCreateConsecutivo, useUpdateConsecutivo } from '../hooks/useConfigAdmin';
import type { ConsecutivoConfig, CreateConsecutivoDTO } from '../types/config-admin.types';

interface ConsecutivoFormModalProps {
  consecutivo: ConsecutivoConfig | null;
  isOpen: boolean;
  onClose: () => void;
}

interface FormData {
  nombre: string;
  codigo: string;
  prefijo: string;
  sufijo: string;
  siguiente_numero: number;
  longitud_numero: number;
  modulo: string;
  tipo_documento: string;
  descripcion: string;
  is_active: boolean;
}

const defaultFormData: FormData = {
  nombre: '',
  codigo: '',
  prefijo: '',
  sufijo: '',
  siguiente_numero: 1,
  longitud_numero: 4,
  modulo: 'GENERAL',
  tipo_documento: '',
  descripcion: '',
  is_active: true,
};

const MODULO_OPTIONS = [
  { value: 'DOCUMENTOS', label: 'Documentos' },
  { value: 'COMPRAS', label: 'Compras' },
  { value: 'VENTAS', label: 'Ventas' },
  { value: 'INVENTARIO', label: 'Inventario' },
  { value: 'CONTABILIDAD', label: 'Contabilidad' },
  { value: 'PRODUCCION', label: 'Producción' },
  { value: 'CALIDAD', label: 'Calidad' },
  { value: 'RRHH', label: 'Recursos Humanos' },
  { value: 'SST', label: 'SST' },
  { value: 'AMBIENTAL', label: 'Ambiental' },
  { value: 'GENERAL', label: 'General' },
];

export const ConsecutivoFormModal = ({
  consecutivo,
  isOpen,
  onClose,
}: ConsecutivoFormModalProps) => {
  const isEdit = !!consecutivo;
  const createMutation = useCreateConsecutivo();
  const updateMutation = useUpdateConsecutivo();
  const isLoading = createMutation.isPending || updateMutation.isPending;

  const [formData, setFormData] = useState<FormData>(defaultFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (isOpen && consecutivo && !isInitialized) {
      setFormData({
        nombre: consecutivo.nombre || '',
        codigo: consecutivo.codigo || '',
        prefijo: consecutivo.prefijo || '',
        sufijo: consecutivo.sufijo || '',
        siguiente_numero: consecutivo.siguiente_numero || 1,
        longitud_numero: consecutivo.longitud_numero || 4,
        modulo: consecutivo.modulo || 'GENERAL',
        tipo_documento: consecutivo.tipo_documento || '',
        descripcion: consecutivo.descripcion || '',
        is_active: consecutivo.is_active ?? true,
      });
      setIsInitialized(true);
    }
    if (isOpen && !consecutivo && !isInitialized) {
      setFormData(defaultFormData);
      setIsInitialized(true);
    }
    if (!isOpen) {
      setIsInitialized(false);
      setErrors({});
    }
  }, [isOpen, consecutivo, isInitialized]);

  const formatPreview = `${formData.prefijo}${String(formData.siguiente_numero).padStart(formData.longitud_numero, '0')}${formData.sufijo}`;

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.nombre.trim()) newErrors.nombre = 'El nombre es requerido';
    if (!formData.codigo.trim()) newErrors.codigo = 'El código es requerido';
    if (formData.longitud_numero < 1 || formData.longitud_numero > 10) {
      newErrors.longitud_numero = 'Debe ser entre 1 y 10';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    const payload: CreateConsecutivoDTO = {
      nombre: formData.nombre.trim(),
      codigo: formData.codigo.trim().toUpperCase(),
      prefijo: formData.prefijo || undefined,
      sufijo: formData.sufijo || undefined,
      siguiente_numero: formData.siguiente_numero,
      longitud_numero: formData.longitud_numero,
      modulo: formData.modulo,
      tipo_documento: formData.tipo_documento || undefined,
      descripcion: formData.descripcion.trim() || undefined,
    };

    try {
      if (isEdit && consecutivo) {
        await updateMutation.mutateAsync({ id: consecutivo.id, data: payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
      onClose();
    } catch {
      // Error handled by mutation onError
    }
  };

  const handleChange = (field: keyof FormData, value: string | number | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Editar Consecutivo' : 'Nuevo Consecutivo'}
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? 'Guardando...' : isEdit ? 'Guardar Cambios' : 'Crear Consecutivo'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {/* Preview del formato */}
        <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
          <p className="text-xs text-gray-500 dark:text-gray-400">Vista previa del formato</p>
          <p className="mt-1 font-mono text-lg font-semibold text-gray-900 dark:text-white">
            {formatPreview || '—'}
          </p>
        </div>

        {/* Nombre + Código */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Nombre *"
            value={formData.nombre}
            onChange={(e) => handleChange('nombre', e.target.value)}
            error={errors.nombre}
            placeholder="Ej: Factura de venta"
          />
          <Input
            label="Código *"
            value={formData.codigo}
            onChange={(e) => handleChange('codigo', e.target.value.toUpperCase())}
            error={errors.codigo}
            placeholder="Ej: FACTURA"
            className="uppercase"
          />
        </div>

        {/* Prefijo + Sufijo */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Prefijo"
            value={formData.prefijo}
            onChange={(e) => handleChange('prefijo', e.target.value)}
            placeholder="Ej: FAC-"
          />
          <Input
            label="Sufijo"
            value={formData.sufijo}
            onChange={(e) => handleChange('sufijo', e.target.value)}
            placeholder="Ej: -2026"
          />
        </div>

        {/* Siguiente número + Longitud */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Siguiente número"
            type="number"
            value={String(formData.siguiente_numero)}
            onChange={(e) => handleChange('siguiente_numero', parseInt(e.target.value) || 1)}
            min={1}
          />
          <Input
            label="Longitud del número"
            type="number"
            value={String(formData.longitud_numero)}
            onChange={(e) => handleChange('longitud_numero', parseInt(e.target.value) || 4)}
            error={errors.longitud_numero}
            min={1}
            max={10}
          />
        </div>

        {/* Módulo + Estado */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select
            label="Módulo"
            value={formData.modulo}
            onChange={(e) => handleChange('modulo', e.target.value)}
            options={MODULO_OPTIONS}
          />
          <div className="flex items-end pb-1">
            <Switch
              label="Activo"
              checked={formData.is_active}
              onCheckedChange={(checked) => handleChange('is_active', checked)}
            />
          </div>
        </div>

        {/* Descripción */}
        <Input
          label="Descripción"
          value={formData.descripcion}
          onChange={(e) => handleChange('descripcion', e.target.value)}
          placeholder="Descripción del consecutivo"
        />
      </div>
    </BaseModal>
  );
};
