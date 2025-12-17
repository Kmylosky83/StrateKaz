/**
 * Modal para crear/editar Configuración de Consecutivos
 *
 * Sistema simplificado sin áreas/procesos.
 * Formato: PREF-AÑO?-NUM
 *
 * Usa Design System:
 * - BaseModal para el contenedor
 * - Input, Select para formulario
 * - Switch para opciones
 * - Alert para información
 * - Button para acciones
 */
import { useState, useEffect, useMemo, ChangeEvent } from 'react';
import { BaseModal } from '@/components/modals/BaseModal';
import { Button } from '@/components/common/Button';
import { Alert } from '@/components/common/Alert';
import { Input } from '@/components/forms/Input';
import { Select } from '@/components/forms/Select';
import { Switch } from '@/components/forms/Switch';
import {
  useCreateConsecutivo,
  useUpdateConsecutivo,
  useConsecutivoChoices,
} from '../../hooks/useStrategic';
import type {
  ConsecutivoConfig,
  CreateConsecutivoConfigDTO,
  UpdateConsecutivoConfigDTO,
  SeparatorType,
} from '../../types/strategic.types';

interface ConsecutivoFormModalProps {
  consecutivo: ConsecutivoConfig | null;
  isOpen: boolean;
  onClose: () => void;
}

interface FormData {
  tipo_documento: number | '';
  prefix: string;
  suffix: string;
  current_number: number;
  padding: number;
  include_year: boolean;
  include_month: boolean;
  include_day: boolean;
  separator: SeparatorType;
  reset_yearly: boolean;
  reset_monthly: boolean;
  is_active: boolean;
}

const defaultFormData: FormData = {
  tipo_documento: '',
  prefix: '',
  suffix: '',
  current_number: 0,
  padding: 4,
  include_year: true,
  include_month: false,
  include_day: false,
  separator: '-',
  reset_yearly: true,
  reset_monthly: false,
  is_active: true,
};

export const ConsecutivoFormModal = ({ consecutivo, isOpen, onClose }: ConsecutivoFormModalProps) => {
  const isEditing = consecutivo !== null;

  const [formData, setFormData] = useState<FormData>(defaultFormData);

  const createMutation = useCreateConsecutivo();
  const updateMutation = useUpdateConsecutivo();
  const { data: choices } = useConsecutivoChoices();

  useEffect(() => {
    if (consecutivo) {
      setFormData({
        tipo_documento: consecutivo.tipo_documento,
        prefix: consecutivo.prefix,
        suffix: consecutivo.suffix || '',
        current_number: consecutivo.current_number,
        padding: consecutivo.padding,
        include_year: consecutivo.include_year,
        include_month: consecutivo.include_month,
        include_day: consecutivo.include_day,
        separator: consecutivo.separator,
        reset_yearly: consecutivo.reset_yearly,
        reset_monthly: consecutivo.reset_monthly,
        is_active: consecutivo.is_active,
      });
    } else {
      setFormData(defaultFormData);
    }
  }, [consecutivo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isEditing && consecutivo) {
      const updateData: UpdateConsecutivoConfigDTO = {
        prefix: formData.prefix,
        suffix: formData.suffix || undefined,
        current_number: formData.current_number,
        padding: formData.padding,
        include_year: formData.include_year,
        include_month: formData.include_month,
        include_day: formData.include_day,
        separator: formData.separator,
        reset_yearly: formData.reset_yearly,
        reset_monthly: formData.reset_monthly,
        is_active: formData.is_active,
      };
      await updateMutation.mutateAsync({ id: consecutivo.id, data: updateData });
    } else {
      if (!formData.tipo_documento) return;
      const createData: CreateConsecutivoConfigDTO = {
        tipo_documento: Number(formData.tipo_documento),
        prefix: formData.prefix,
        suffix: formData.suffix || undefined,
        padding: formData.padding,
        include_year: formData.include_year,
        include_month: formData.include_month,
        include_day: formData.include_day,
        separator: formData.separator,
        reset_yearly: formData.reset_yearly,
        reset_monthly: formData.reset_monthly,
      };
      await createMutation.mutateAsync(createData);
    }

    onClose();
  };

  // Generar ejemplo de consecutivo dinámicamente
  const example = useMemo(() => {
    const sep = formData.separator || '';
    const parts: string[] = [formData.prefix || 'PRE'];

    // Fecha
    const now = new Date();
    if (formData.include_day) {
      parts.push(now.toISOString().slice(0, 10).replace(/-/g, ''));
    } else if (formData.include_month) {
      parts.push(`${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`);
    } else if (formData.include_year) {
      parts.push(String(now.getFullYear()));
    }

    // Número
    const nextNumber = formData.current_number + 1;
    parts.push(String(nextNumber).padStart(formData.padding, '0'));

    let result = parts.join(sep);

    // Sufijo
    if (formData.suffix) {
      result += `${sep}${formData.suffix}`;
    }

    return result;
  }, [formData]);

  const isLoading = createMutation.isPending || updateMutation.isPending;

  // Opciones para selects desde el endpoint unificado /choices/
  const tipoDocumentoOptions = useMemo(() => {
    if (!choices?.tipos_documento) return [];
    return choices.tipos_documento.map((t) => ({
      value: String(t.value),
      label: t.label,
    }));
  }, [choices]);

  const separatorOptions = useMemo(() => {
    if (!choices?.separators) {
      return [
        { value: '-', label: 'Guión (-)' },
        { value: '/', label: 'Diagonal (/)' },
        { value: '_', label: 'Guión bajo (_)' },
        { value: '', label: 'Sin separador' },
      ];
    }
    return choices.separators.map((s) => ({
      value: String(s.value),
      label: s.label,
    }));
  }, [choices]);

  const footer = (
    <>
      <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
        Cancelar
      </Button>
      <Button
        type="submit"
        variant="primary"
        onClick={handleSubmit}
        disabled={isLoading || !formData.prefix || (!isEditing && !formData.tipo_documento)}
        isLoading={isLoading}
      >
        {isEditing ? 'Guardar Cambios' : 'Crear Consecutivo'}
      </Button>
    </>
  );

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Consecutivo' : 'Nuevo Consecutivo'}
      subtitle="Configura la secuencia de numeración para documentos"
      size="xl"
      footer={footer}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Tipo de Documento */}
        <Select
          label="Tipo de Documento *"
          value={formData.tipo_documento?.toString() || ''}
          onChange={(e) =>
            setFormData({ ...formData, tipo_documento: e.target.value ? Number(e.target.value) : '' })
          }
          options={[{ value: '', label: 'Seleccionar tipo...' }, ...tipoDocumentoOptions]}
          disabled={isEditing}
          required
        />

        {/* Prefijo, Separador y Sufijo */}
        <div className="grid grid-cols-3 gap-4">
          <Input
            label="Prefijo *"
            value={formData.prefix}
            onChange={(e) => setFormData({ ...formData, prefix: e.target.value.toUpperCase() })}
            placeholder="REC"
            required
            helperText="Código identificador"
          />
          <Select
            label="Separador"
            value={formData.separator}
            onChange={(e) => setFormData({ ...formData, separator: e.target.value as SeparatorType })}
            options={separatorOptions}
          />
          <Input
            label="Sufijo"
            value={formData.suffix}
            onChange={(e) => setFormData({ ...formData, suffix: e.target.value.toUpperCase() })}
            placeholder=""
            helperText="Opcional"
          />
        </div>

        {/* Formato de Fecha */}
        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Formato de Fecha</p>
          <div className="grid grid-cols-3 gap-4">
            <div className="flex items-center justify-between p-2 bg-white dark:bg-gray-700 rounded border">
              <span className="text-sm text-gray-600 dark:text-gray-300">Año (YYYY)</span>
              <Switch
                size="sm"
                checked={formData.include_year}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setFormData({
                    ...formData,
                    include_year: e.target.checked,
                    include_month: e.target.checked ? formData.include_month : false,
                    include_day: e.target.checked ? formData.include_day : false,
                  })
                }
              />
            </div>
            <div className="flex items-center justify-between p-2 bg-white dark:bg-gray-700 rounded border">
              <span className="text-sm text-gray-600 dark:text-gray-300">Mes (MM)</span>
              <Switch
                size="sm"
                checked={formData.include_month}
                disabled={!formData.include_year}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setFormData({
                    ...formData,
                    include_month: e.target.checked,
                    include_day: e.target.checked ? formData.include_day : false,
                  })
                }
              />
            </div>
            <div className="flex items-center justify-between p-2 bg-white dark:bg-gray-700 rounded border">
              <span className="text-sm text-gray-600 dark:text-gray-300">Día (DD)</span>
              <Switch
                size="sm"
                checked={formData.include_day}
                disabled={!formData.include_month}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setFormData({ ...formData, include_day: e.target.checked })
                }
              />
            </div>
          </div>
        </div>

        {/* Padding y Número Actual */}
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Dígitos del Consecutivo"
            type="number"
            value={formData.padding.toString()}
            onChange={(e) => setFormData({ ...formData, padding: parseInt(e.target.value) || 4 })}
            min={1}
            max={10}
            helperText={`Ej: ${String(1).padStart(formData.padding, '0')}`}
          />
          {isEditing && (
            <Input
              label="Número Actual"
              type="number"
              value={formData.current_number.toString()}
              onChange={(e) => setFormData({ ...formData, current_number: parseInt(e.target.value) || 0 })}
              min={0}
              helperText="Último número usado"
            />
          )}
        </div>

        {/* Vista previa del consecutivo */}
        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Vista previa del próximo consecutivo:</p>
          <p className="text-xl font-mono font-bold text-green-600 dark:text-green-400">{example}</p>
        </div>

        {/* Opciones de Reinicio */}
        <div className="space-y-3">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Reinicio Automático</p>
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Reiniciar Anualmente</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">El consecutivo se reinicia a 0 cada año</p>
            </div>
            <Switch
              checked={formData.reset_yearly}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setFormData({
                  ...formData,
                  reset_yearly: e.target.checked,
                  reset_monthly: e.target.checked ? false : formData.reset_monthly,
                })
              }
            />
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Reiniciar Mensualmente</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">El consecutivo se reinicia a 0 cada mes</p>
            </div>
            <Switch
              checked={formData.reset_monthly}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setFormData({
                  ...formData,
                  reset_monthly: e.target.checked,
                  reset_yearly: e.target.checked ? false : formData.reset_yearly,
                })
              }
            />
          </div>

          {isEditing && (
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Consecutivo Activo</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Desactiva para deshabilitar este tipo</p>
              </div>
              <Switch
                checked={formData.is_active}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setFormData({ ...formData, is_active: e.target.checked })
                }
              />
            </div>
          )}
        </div>

        <Alert
          variant="info"
          message="El sistema genera códigos automáticamente cuando se crean documentos. Modificar el número actual puede causar duplicados."
        />
      </form>
    </BaseModal>
  );
};
