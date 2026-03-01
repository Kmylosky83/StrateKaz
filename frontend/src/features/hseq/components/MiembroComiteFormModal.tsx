import { useState, useEffect } from 'react';
import { Modal, Button, Spinner } from '@/components/common';
import { Input, Select, Checkbox } from '@/components/forms';
import { useSelectColaboradores } from '@/hooks/useSelectLists';
import { useCreateMiembroComite, useUpdateMiembroComite, useComites } from '../hooks/useComites';
import type { MiembroComiteList, CreateMiembroComiteDTO } from '../types/comites.types';

interface MiembroComiteFormModalProps {
  item: MiembroComiteList | null;
  isOpen: boolean;
  onClose: () => void;
}

const INITIAL_FORM: CreateMiembroComiteDTO = {
  comite: 0,
  empleado_id: 0,
  empleado_nombre: '',
  empleado_cargo: '',
  rol: '',
  es_principal: true,
  representa_a: '',
  fecha_inicio: '',
};

const ROL_OPTIONS = [
  { value: 'PRESIDENTE', label: 'Presidente' },
  { value: 'SECRETARIO', label: 'Secretario' },
  { value: 'REPRESENTANTE_EMPLEADOR', label: 'Representante del Empleador' },
  { value: 'REPRESENTANTE_TRABAJADORES', label: 'Representante de los Trabajadores' },
  { value: 'VIGÍA', label: 'Vigía' },
  { value: 'BRIGADISTA', label: 'Brigadista' },
  { value: 'MIEMBRO', label: 'Miembro' },
];

const REPRESENTA_OPTIONS = [
  { value: 'EMPLEADOR', label: 'Empleador' },
  { value: 'TRABAJADORES', label: 'Trabajadores' },
  { value: 'INDEPENDIENTE', label: 'Independiente' },
];

export default function MiembroComiteFormModal({
  item,
  isOpen,
  onClose,
}: MiembroComiteFormModalProps) {
  const [formData, setFormData] = useState<CreateMiembroComiteDTO>(INITIAL_FORM);

  const createMutation = useCreateMiembroComite();
  const updateMutation = useUpdateMiembroComite();
  const { data: comitesData } = useComites();
  const { data: colaboradores } = useSelectColaboradores();

  const isLoading = createMutation.isPending || updateMutation.isPending;
  const comites = Array.isArray(comitesData)
    ? comitesData
    : ((comitesData as { results?: { id: number; nombre?: string }[] })?.results ?? []);
  const colaboradoresList = Array.isArray(colaboradores) ? colaboradores : [];

  useEffect(() => {
    if (item) {
      setFormData({
        comite: item.comite ?? 0,
        empleado_id: 0,
        empleado_nombre: item.empleado_nombre || '',
        empleado_cargo: item.empleado_cargo || '',
        rol: item.rol || '',
        es_principal: item.es_principal ?? true,
        representa_a: item.representa_a || '',
        fecha_inicio: item.fecha_inicio || '',
      });
    } else {
      setFormData(INITIAL_FORM);
    }
  }, [item, isOpen]);

  const handleColaboradorChange = (colaboradorId: number) => {
    const colaborador = colaboradoresList.find((c) => c.id === colaboradorId);
    setFormData((prev) => ({
      ...prev,
      empleado_id: colaboradorId,
      empleado_nombre: colaborador?.label || '',
      empleado_cargo: colaborador?.extra?.cargo || '',
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...formData };

    if (!payload.comite) delete (payload as Partial<CreateMiembroComiteDTO>).comite;
    if (!payload.empleado_id) delete (payload as Partial<CreateMiembroComiteDTO>).empleado_id;
    if (!payload.representa_a) delete payload.representa_a;

    if (item) {
      updateMutation.mutate({ id: item.id, datos: payload }, { onSuccess: onClose });
    } else {
      createMutation.mutate(payload, { onSuccess: onClose });
    }
  };

  const handleChange = (field: keyof CreateMiembroComiteDTO, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={item ? 'Editar Miembro' : 'Agregar Miembro al Comité'}
      size="large"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Fila 1: Comité | Rol */}
          <Select
            label="Comité *"
            value={formData.comite}
            onChange={(e) => handleChange('comite', parseInt(e.target.value))}
            required
          >
            <option value={0}>Seleccionar comité...</option>
            {comites.map((comite) => (
              <option key={comite.id} value={comite.id}>
                {comite.nombre}
              </option>
            ))}
          </Select>

          <Select
            label="Rol *"
            value={formData.rol}
            onChange={(e) => handleChange('rol', e.target.value)}
            required
          >
            <option value="">Seleccionar rol...</option>
            {ROL_OPTIONS.map((opcion) => (
              <option key={opcion.value} value={opcion.value}>
                {opcion.label}
              </option>
            ))}
          </Select>

          {/* Fila 2: Colaborador | Representa a */}
          <Select
            label="Colaborador *"
            value={formData.empleado_id}
            onChange={(e) => handleColaboradorChange(parseInt(e.target.value))}
            required
          >
            <option value={0}>Seleccionar colaborador...</option>
            {colaboradoresList.map((col) => (
              <option key={col.id} value={col.id}>
                {col.label}
              </option>
            ))}
          </Select>

          <Select
            label="Representa a"
            value={formData.representa_a ?? ''}
            onChange={(e) => handleChange('representa_a', e.target.value)}
          >
            <option value="">Seleccionar...</option>
            {REPRESENTA_OPTIONS.map((opcion) => (
              <option key={opcion.value} value={opcion.value}>
                {opcion.label}
              </option>
            ))}
          </Select>

          {/* Fila 3: Fecha Inicio | Checkbox Es Principal */}
          <Input
            label="Fecha de Inicio *"
            type="date"
            value={formData.fecha_inicio}
            onChange={(e) => handleChange('fecha_inicio', e.target.value)}
            required
          />

          <div className="flex items-center pt-6">
            <Checkbox
              id="es_principal"
              label="Es Miembro Principal"
              checked={formData.es_principal ?? false}
              onChange={(e) => handleChange('es_principal', e.target.checked)}
            />
          </div>
        </div>

        {/* Fila de botones */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Spinner size="small" className="mr-2" />
                Guardando...
              </>
            ) : (
              <>{item ? 'Actualizar' : 'Crear'} Miembro</>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
