/**
 * Modal para crear/editar Vista Dashboard
 */
import { useState, useEffect } from 'react';
import { BaseModal } from '@/components/modals/BaseModal';
import { Button } from '@/components/common/Button';
import { Input, Textarea, Select, Checkbox } from '@/components/forms';
import { useCreateVistaDashboard, useUpdateVistaDashboard } from '../hooks/useAnalytics';
import type { VistaDashboard, PerspectivaBSC } from '../types';

interface VistaDashboardFormModalProps {
  item: VistaDashboard | null;
  isOpen: boolean;
  onClose: () => void;
}

interface FormData {
  codigo: string;
  nombre: string;
  descripcion: string;
  perspectiva: PerspectivaBSC;
  es_publica: boolean;
  activa: boolean;
}

const INITIAL_FORM: FormData = {
  codigo: '',
  nombre: '',
  descripcion: '',
  perspectiva: 'general',
  es_publica: true,
  activa: true,
};

export const VistaDashboardFormModal = ({
  item,
  isOpen,
  onClose,
}: VistaDashboardFormModalProps) => {
  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const createVista = useCreateVistaDashboard();
  const updateVista = useUpdateVistaDashboard();

  const isEditing = !!item;

  useEffect(() => {
    if (isOpen && item) {
      setForm({
        codigo: item.codigo,
        nombre: item.nombre,
        descripcion: item.descripcion || '',
        perspectiva: item.perspectiva || 'general',
        es_publica: item.es_publica,
        activa: item.activa,
      });
    } else if (isOpen) {
      setForm(INITIAL_FORM);
    }
  }, [isOpen, item]);

  const handleChange = (field: keyof FormData, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    if (!form.nombre) return;

    const payload = {
      codigo: form.codigo,
      nombre: form.nombre,
      descripcion: form.descripcion || undefined,
      perspectiva: form.perspectiva,
      es_publica: form.es_publica,
      activa: form.activa,
    };

    if (isEditing) {
      updateVista.mutate({ id: item.id, data: payload }, { onSuccess: () => onClose() });
    } else {
      createVista.mutate(payload, { onSuccess: () => onClose() });
    }
  };

  const isPending = createVista.isPending || updateVista.isPending;
  const isValid = !!form.nombre;

  const perspectivaOptions = [
    { value: 'general', label: 'General' },
    { value: 'financiera', label: 'Financiera' },
    { value: 'cliente', label: 'Cliente' },
    { value: 'procesos', label: 'Procesos Internos' },
    { value: 'aprendizaje', label: 'Aprendizaje y Crecimiento' },
  ];

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Vista Dashboard' : 'Nueva Vista Dashboard'}
      size="lg"
    >
      <div className="space-y-4">
        <Input
          label="Código"
          value={form.codigo}
          onChange={(e) => handleChange('codigo', e.target.value)}
          placeholder="Se genera automáticamente"
          disabled={isEditing}
        />

        <Input
          label="Nombre"
          value={form.nombre}
          onChange={(e) => handleChange('nombre', e.target.value)}
          placeholder="Ej: Dashboard Financiero Gerencial"
          required
        />

        <Textarea
          label="Descripción"
          value={form.descripcion}
          onChange={(e) => handleChange('descripcion', e.target.value)}
          placeholder="Descripción del dashboard..."
          rows={3}
        />

        <Select
          label="Perspectiva BSC"
          value={form.perspectiva}
          onChange={(e) => handleChange('perspectiva', e.target.value)}
          options={perspectivaOptions}
        />

        <div className="grid grid-cols-2 gap-4">
          <label className="flex items-center gap-3 p-4 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
            <Checkbox
              checked={form.es_publica}
              onChange={(e) => handleChange('es_publica', e.target.checked)}
            />
            <div className="flex-1">
              <div className="font-medium text-gray-900 dark:text-gray-100">Pública</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Visible para todos</div>
            </div>
          </label>

          <label className="flex items-center gap-3 p-4 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
            <Checkbox
              checked={form.activa}
              onChange={(e) => handleChange('activa', e.target.checked)}
            />
            <div className="flex-1">
              <div className="font-medium text-gray-900 dark:text-gray-100">Activa</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Disponible para uso</div>
            </div>
          </label>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={!isValid || isPending}
            isLoading={isPending}
          >
            {isEditing ? 'Actualizar' : 'Crear'} Vista
          </Button>
        </div>
      </div>
    </BaseModal>
  );
};
