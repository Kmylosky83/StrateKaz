/**
 * Modal de creación/edición de Integraciones Externas
 *
 * Patrón: BaseModal + useState form + create/update mutations.
 */
import { useState, useEffect } from 'react';
import { BaseModal } from '@/components/modals/BaseModal';
import { Input } from '@/components/forms/Input';
import { Select } from '@/components/forms/Select';
import { Button } from '@/components/common/Button';
import { useCreateIntegracion, useUpdateIntegracion } from '../hooks/useConfigAdmin';
import type { IntegracionExterna, CreateIntegracionDTO } from '../types/config-admin.types';

interface IntegracionFormModalProps {
  integracion: IntegracionExterna | null;
  isOpen: boolean;
  onClose: () => void;
}

interface FormData {
  nombre: string;
  tipo_servicio: string;
  proveedor: string;
  url_base: string;
  api_key: string;
  descripcion: string;
}

const defaultFormData: FormData = {
  nombre: '',
  tipo_servicio: 'API_REST',
  proveedor: '',
  url_base: '',
  api_key: '',
  descripcion: '',
};

const TIPO_SERVICIO_OPTIONS = [
  { value: 'API_REST', label: 'API REST' },
  { value: 'WEBHOOK', label: 'Webhook' },
  { value: 'SOAP', label: 'SOAP' },
  { value: 'SFTP', label: 'SFTP' },
  { value: 'SMTP', label: 'SMTP' },
  { value: 'OAUTH2', label: 'OAuth 2.0' },
  { value: 'OTRO', label: 'Otro' },
];

export const IntegracionFormModal = ({
  integracion,
  isOpen,
  onClose,
}: IntegracionFormModalProps) => {
  const isEdit = !!integracion;
  const createMutation = useCreateIntegracion();
  const updateMutation = useUpdateIntegracion();
  const isLoading = createMutation.isPending || updateMutation.isPending;

  const [formData, setFormData] = useState<FormData>(defaultFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (isOpen && integracion && !isInitialized) {
      setFormData({
        nombre: integracion.nombre || '',
        tipo_servicio: integracion.tipo_servicio || 'API_REST',
        proveedor: integracion.proveedor || '',
        url_base: integracion.url_base || '',
        api_key: '',
        descripcion: integracion.descripcion || '',
      });
      setIsInitialized(true);
    }
    if (isOpen && !integracion && !isInitialized) {
      setFormData(defaultFormData);
      setIsInitialized(true);
    }
    if (!isOpen) {
      setIsInitialized(false);
      setErrors({});
    }
  }, [isOpen, integracion, isInitialized]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.nombre.trim()) newErrors.nombre = 'El nombre es requerido';
    if (!formData.proveedor.trim()) newErrors.proveedor = 'El proveedor es requerido';
    if (!formData.url_base.trim()) newErrors.url_base = 'La URL base es requerida';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    const payload: CreateIntegracionDTO = {
      nombre: formData.nombre.trim(),
      tipo_servicio: formData.tipo_servicio,
      proveedor: formData.proveedor.trim(),
      url_base: formData.url_base.trim(),
      descripcion: formData.descripcion.trim() || undefined,
      ...(formData.api_key ? { api_key: formData.api_key } : {}),
    };

    try {
      if (isEdit && integracion) {
        await updateMutation.mutateAsync({ id: integracion.id, data: payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
      onClose();
    } catch {
      // Error handled by mutation onError
    }
  };

  const handleChange = (field: keyof FormData, value: string) => {
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
      title={isEdit ? 'Editar Integración' : 'Nueva Integración'}
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? 'Guardando...' : isEdit ? 'Guardar Cambios' : 'Crear Integración'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {/* Nombre + Proveedor */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Nombre *"
            value={formData.nombre}
            onChange={(e) => handleChange('nombre', e.target.value)}
            error={errors.nombre}
            placeholder="Ej: Facturación electrónica DIAN"
          />
          <Input
            label="Proveedor *"
            value={formData.proveedor}
            onChange={(e) => handleChange('proveedor', e.target.value)}
            error={errors.proveedor}
            placeholder="Ej: Alegra, Siigo"
          />
        </div>

        {/* Tipo de servicio */}
        <Select
          label="Tipo de Servicio"
          value={formData.tipo_servicio}
          onChange={(e) => handleChange('tipo_servicio', e.target.value)}
          options={TIPO_SERVICIO_OPTIONS}
        />

        {/* URL Base */}
        <Input
          label="URL Base *"
          value={formData.url_base}
          onChange={(e) => handleChange('url_base', e.target.value)}
          error={errors.url_base}
          placeholder="https://api.proveedor.com/v1"
        />

        {/* API Key */}
        <Input
          label={isEdit ? 'API Key (dejar vacío para no cambiar)' : 'API Key'}
          type="password"
          value={formData.api_key}
          onChange={(e) => handleChange('api_key', e.target.value)}
          placeholder={isEdit ? '••••••••' : 'Clave de acceso al servicio'}
        />

        {/* Descripción */}
        <Input
          label="Descripción"
          value={formData.descripcion}
          onChange={(e) => handleChange('descripcion', e.target.value)}
          placeholder="Descripción de la integración"
        />
      </div>
    </BaseModal>
  );
};
