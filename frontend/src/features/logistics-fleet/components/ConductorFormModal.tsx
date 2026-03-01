/**
 * Modal CRUD para Conductores
 */
import { useState, useEffect } from 'react';
import { Modal, Button, Spinner } from '@/components/common';
import { Input, Select } from '@/components/forms';
import { useCreateConductor, useUpdateConductor } from '../hooks/useLogisticsFleet';
import type { Conductor, CreateConductorDTO } from '../types/logistics-fleet.types';

interface Props {
  item: Conductor | null;
  isOpen: boolean;
  onClose: () => void;
}

const INITIAL_FORM: CreateConductorDTO = {
  nombre_completo: '',
  tipo_documento: 'CC',
  documento_identidad: '',
  telefono: '',
  email: '',
  licencia_conduccion: '',
  categoria_licencia: 'B1',
  fecha_vencimiento_licencia: '',
  fecha_ingreso: new Date().toISOString().split('T')[0],
  es_empleado: true,
  empresa_transportadora: '',
};

const CATEGORIAS = ['A1', 'A2', 'B1', 'B2', 'B3', 'C1', 'C2', 'C3'] as const;

export default function ConductorFormModal({ item, isOpen, onClose }: Props) {
  const [formData, setFormData] = useState<CreateConductorDTO>(INITIAL_FORM);
  const createMutation = useCreateConductor();
  const updateMutation = useUpdateConductor();
  const isLoading = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (item) {
      setFormData({
        nombre_completo: item.nombre_completo,
        tipo_documento: item.tipo_documento,
        documento_identidad: item.documento_identidad,
        telefono: item.telefono,
        email: item.email || '',
        licencia_conduccion: item.licencia_conduccion,
        categoria_licencia: item.categoria_licencia,
        fecha_vencimiento_licencia: item.fecha_vencimiento_licencia,
        fecha_ingreso: item.fecha_ingreso,
        es_empleado: item.es_empleado,
        empresa_transportadora: item.empresa_transportadora || '',
      });
    } else {
      setFormData(INITIAL_FORM);
    }
  }, [item, isOpen]);

  const handleChange = (field: keyof CreateConductorDTO, value: string | number | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (item) {
      updateMutation.mutate({ id: item.id, data: formData }, { onSuccess: onClose });
    } else {
      createMutation.mutate(formData, { onSuccess: onClose });
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={item ? 'Editar Conductor' : 'Nuevo Conductor'}
      size="large"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Nombre Completo *"
            value={formData.nombre_completo}
            onChange={(e) => handleChange('nombre_completo', e.target.value)}
            required
          />
          <div className="grid grid-cols-3 gap-2">
            <Select
              label="Tipo Doc *"
              value={formData.tipo_documento}
              onChange={(e) => handleChange('tipo_documento', e.target.value)}
            >
              <option value="CC">CC</option>
              <option value="CE">CE</option>
              <option value="PA">PA</option>
            </Select>
            <div className="col-span-2">
              <Input
                label="Nro. Documento *"
                value={formData.documento_identidad}
                onChange={(e) => handleChange('documento_identidad', e.target.value)}
                required
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Teléfono *"
            value={formData.telefono}
            onChange={(e) => handleChange('telefono', e.target.value)}
            required
          />
          <Input
            label="Email"
            type="email"
            value={formData.email || ''}
            onChange={(e) => handleChange('email', e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="Nro. Licencia *"
            value={formData.licencia_conduccion}
            onChange={(e) => handleChange('licencia_conduccion', e.target.value)}
            required
          />
          <Select
            label="Categoría *"
            value={formData.categoria_licencia}
            onChange={(e) => handleChange('categoria_licencia', e.target.value)}
          >
            {CATEGORIAS.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </Select>
          <Input
            label="Vencimiento Licencia *"
            type="date"
            value={formData.fecha_vencimiento_licencia}
            onChange={(e) => handleChange('fecha_vencimiento_licencia', e.target.value)}
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="Fecha Ingreso *"
            type="date"
            value={formData.fecha_ingreso}
            onChange={(e) => handleChange('fecha_ingreso', e.target.value)}
            required
          />
          <Select
            label="Tipo Conductor"
            value={formData.es_empleado ? 'true' : 'false'}
            onChange={(e) => handleChange('es_empleado', e.target.value === 'true')}
          >
            <option value="true">Empleado</option>
            <option value="false">Tercero</option>
          </Select>
          {!formData.es_empleado && (
            <Input
              label="Empresa Transportadora"
              value={formData.empresa_transportadora || ''}
              onChange={(e) => handleChange('empresa_transportadora', e.target.value)}
            />
          )}
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Spinner size="small" className="mr-2" />
                Guardando...
              </>
            ) : item ? (
              'Actualizar'
            ) : (
              'Crear'
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
