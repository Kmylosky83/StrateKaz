/**
 * Modal de creación/edición de Consecutivos
 *
 * Campos alineados con ConsecutivoConfigSerializer (backend):
 * prefix, suffix, separator, padding, numero_inicial, categoria,
 * include_year/month/day, reset_yearly/monthly.
 *
 * Preview en vivo del formato generado.
 */
import { useState, useEffect, useMemo } from 'react';
import { BaseModal } from '@/components/modals/BaseModal';
import { Input } from '@/components/forms/Input';
import { Select } from '@/components/forms/Select';
import { Switch } from '@/components/forms/Switch';
import { Button } from '@/components/common/Button';
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
  descripcion: string;
  categoria: string;
  prefix: string;
  suffix: string;
  separator: string;
  padding: number;
  numero_inicial: number;
  include_year: boolean;
  include_month: boolean;
  include_day: boolean;
  reset_yearly: boolean;
  reset_monthly: boolean;
}

const defaultFormData: FormData = {
  nombre: '',
  codigo: '',
  descripcion: '',
  categoria: 'GENERAL',
  prefix: '',
  suffix: '',
  separator: '-',
  padding: 5,
  numero_inicial: 1,
  include_year: true,
  include_month: false,
  include_day: false,
  reset_yearly: true,
  reset_monthly: false,
};

const CATEGORIA_OPTIONS = [
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

const SEPARATOR_OPTIONS = [
  { value: '-', label: 'Guión (-)' },
  { value: '/', label: 'Diagonal (/)' },
  { value: '_', label: 'Guión bajo (_)' },
  { value: '.', label: 'Punto (.)' },
  { value: '', label: 'Sin separador' },
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
        descripcion: consecutivo.descripcion || '',
        categoria: consecutivo.categoria || 'GENERAL',
        prefix: consecutivo.prefix || '',
        suffix: consecutivo.suffix || '',
        separator: consecutivo.separator ?? '-',
        padding: consecutivo.padding || 5,
        numero_inicial: consecutivo.numero_inicial || 1,
        include_year: consecutivo.include_year ?? true,
        include_month: consecutivo.include_month ?? false,
        include_day: consecutivo.include_day ?? false,
        reset_yearly: consecutivo.reset_yearly ?? true,
        reset_monthly: consecutivo.reset_monthly ?? false,
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

  // Preview del formato en vivo
  const formatPreview = useMemo(() => {
    const parts: string[] = [];
    const today = new Date();

    if (formData.prefix) parts.push(formData.prefix);

    if (formData.include_day) {
      parts.push(
        `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`
      );
    } else if (formData.include_month) {
      parts.push(`${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}`);
    } else if (formData.include_year) {
      parts.push(String(today.getFullYear()));
    }

    parts.push(String(formData.numero_inicial).padStart(formData.padding, '0'));

    if (formData.suffix) parts.push(formData.suffix);

    return parts.join(formData.separator);
  }, [formData]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.nombre.trim()) newErrors.nombre = 'El nombre es requerido';
    if (!formData.codigo.trim()) newErrors.codigo = 'El código es requerido';
    if (!formData.prefix.trim()) newErrors.prefix = 'El prefijo es requerido';
    if (formData.padding < 1 || formData.padding > 10) {
      newErrors.padding = 'Debe ser entre 1 y 10';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    const payload: CreateConsecutivoDTO = {
      nombre: formData.nombre.trim(),
      codigo: formData.codigo.trim().toUpperCase(),
      descripcion: formData.descripcion.trim() || undefined,
      categoria: formData.categoria,
      prefix: formData.prefix.trim().toUpperCase(),
      suffix: formData.suffix.trim().toUpperCase() || undefined,
      separator: formData.separator,
      padding: formData.padding,
      numero_inicial: formData.numero_inicial,
      include_year: formData.include_year,
      include_month: formData.include_month,
      include_day: formData.include_day,
      reset_yearly: formData.reset_yearly,
      reset_monthly: formData.reset_monthly,
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

        {/* Prefijo + Sufijo + Separador */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Input
            label="Prefijo *"
            value={formData.prefix}
            onChange={(e) => handleChange('prefix', e.target.value.toUpperCase())}
            error={errors.prefix}
            placeholder="Ej: FAC"
          />
          <Input
            label="Sufijo"
            value={formData.suffix}
            onChange={(e) => handleChange('suffix', e.target.value.toUpperCase())}
            placeholder="Ej: CO"
          />
          <Select
            label="Separador"
            value={formData.separator}
            onChange={(e) => handleChange('separator', e.target.value)}
            options={SEPARATOR_OPTIONS}
          />
        </div>

        {/* Dígitos + Número inicial + Categoría */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Input
            label="Dígitos de relleno"
            type="number"
            value={String(formData.padding)}
            onChange={(e) => handleChange('padding', parseInt(e.target.value) || 5)}
            error={errors.padding}
            min={1}
            max={10}
          />
          <Input
            label="Número inicial"
            type="number"
            value={String(formData.numero_inicial)}
            onChange={(e) => handleChange('numero_inicial', parseInt(e.target.value) || 1)}
            min={1}
          />
          <Select
            label="Categoría"
            value={formData.categoria}
            onChange={(e) => handleChange('categoria', e.target.value)}
            options={CATEGORIA_OPTIONS}
          />
        </div>

        {/* Componentes de fecha */}
        <div className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
          <p className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">
            Componentes de fecha
          </p>
          <div className="flex flex-wrap gap-6">
            <Switch
              label="Incluir año"
              checked={formData.include_year}
              onCheckedChange={(checked) => handleChange('include_year', checked)}
            />
            <Switch
              label="Incluir mes"
              checked={formData.include_month}
              onCheckedChange={(checked) => handleChange('include_month', checked)}
            />
            <Switch
              label="Incluir día"
              checked={formData.include_day}
              onCheckedChange={(checked) => handleChange('include_day', checked)}
            />
          </div>
        </div>

        {/* Reinicio automático */}
        <div className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
          <p className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">
            Reinicio automático
          </p>
          <div className="flex flex-wrap gap-6">
            <Switch
              label="Reinicio anual"
              checked={formData.reset_yearly}
              onCheckedChange={(checked) => handleChange('reset_yearly', checked)}
            />
            <Switch
              label="Reinicio mensual"
              checked={formData.reset_monthly}
              onCheckedChange={(checked) => handleChange('reset_monthly', checked)}
            />
          </div>
        </div>

        {/* Descripción */}
        <Input
          label="Descripción"
          value={formData.descripcion}
          onChange={(e) => handleChange('descripcion', e.target.value)}
          placeholder="Descripción del uso de este consecutivo"
        />
      </div>
    </BaseModal>
  );
};
