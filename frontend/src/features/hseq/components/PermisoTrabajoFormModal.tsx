import { useState, useEffect } from 'react';
import { Modal, Button, Spinner } from '@/components/common';
import { Input, Select, Textarea } from '@/components/forms';
import {
  useCreatePermisoTrabajo,
  useUpdatePermisoTrabajo,
  useTiposPermisoTrabajo,
} from '../hooks/useSeguridadIndustrial';
import type { PermisoTrabajo, CreatePermisoTrabajoDTO } from '../types/seguridad-industrial.types';
import { useSelectUsers } from '@/hooks/useSelectLists';

interface PermisoTrabajoFormModalProps {
  item: PermisoTrabajo | null;
  isOpen: boolean;
  onClose: () => void;
}

const INITIAL_FORM: CreatePermisoTrabajoDTO = {
  tipo_permiso_id: 0,
  ubicacion: '',
  descripcion_trabajo: '',
  fecha_inicio: '',
  fecha_fin: '',
  solicitante_id: 0,
  ejecutor_id: undefined,
  supervisor_id: 0,
  requiere_vigilia: false,
  vigilia_id: undefined,
};

export default function PermisoTrabajoFormModal({
  item,
  isOpen,
  onClose,
}: PermisoTrabajoFormModalProps) {
  const [formData, setFormData] = useState<CreatePermisoTrabajoDTO>(INITIAL_FORM);

  const createMutation = useCreatePermisoTrabajo();
  const updateMutation = useUpdatePermisoTrabajo();

  const { data: tiposPermiso = [] } = useTiposPermisoTrabajo({ activo: true });
  const { data: usuarios = [] } = useSelectUsers();

  const isLoading = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (item) {
      setFormData({
        tipo_permiso_id: item.tipo_permiso_id ?? item.tipo_permiso?.id ?? 0,
        ubicacion: item.ubicacion || '',
        descripcion_trabajo: item.descripcion_trabajo || '',
        fecha_inicio: item.fecha_inicio || '',
        fecha_fin: item.fecha_fin || '',
        solicitante_id: item.solicitante_id ?? item.solicitante?.id ?? 0,
        ejecutor_id: item.ejecutor_id ?? item.ejecutor?.id ?? undefined,
        supervisor_id: item.supervisor_id ?? item.supervisor?.id ?? 0,
        requiere_vigilia: item.requiere_vigilia ?? false,
        vigilia_id: item.vigilia_id ?? item.vigilia?.id ?? undefined,
      });
    } else {
      setFormData(INITIAL_FORM);
    }
  }, [item, isOpen]);

  const handleChange = (field: keyof CreatePermisoTrabajoDTO, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const payload = { ...formData };

    // Limpiar FK opcionales con valor vacío
    if (!payload.ejecutor_id) delete payload.ejecutor_id;
    if (!payload.vigilia_id) delete payload.vigilia_id;
    if (!payload.requiere_vigilia) delete payload.vigilia_id;

    if (item) {
      updateMutation.mutate({ id: item.id, dto: payload }, { onSuccess: onClose });
    } else {
      createMutation.mutate(payload, { onSuccess: onClose });
    }
  };

  const tiposPermisoOptions = tiposPermiso.map((t) => ({
    value: String(t.id),
    label: t.nombre,
  }));

  const usuariosOptions = usuarios.map((u) => ({
    value: String(u.id),
    label: u.label,
  }));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={item ? 'Editar Permiso de Trabajo' : 'Nuevo Permiso de Trabajo'}
      size="large"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Tipo de Permiso */}
          <div className="md:col-span-2">
            <Select
              label="Tipo de Permiso *"
              value={String(formData.tipo_permiso_id || '')}
              onChange={(e) => handleChange('tipo_permiso_id', Number(e.target.value))}
              required
            >
              <option value="">Seleccione un tipo...</option>
              {tiposPermisoOptions.map((op) => (
                <option key={op.value} value={op.value}>
                  {op.label}
                </option>
              ))}
            </Select>
          </div>

          {/* Ubicación */}
          <div className="md:col-span-2">
            <Input
              label="Ubicación *"
              value={formData.ubicacion}
              onChange={(e) => handleChange('ubicacion', e.target.value)}
              placeholder="Ej: Planta 2, Área de soldadura"
              required
            />
          </div>

          {/* Descripción del Trabajo */}
          <div className="md:col-span-2">
            <Textarea
              label="Descripción del Trabajo *"
              value={formData.descripcion_trabajo}
              onChange={(e) => handleChange('descripcion_trabajo', e.target.value)}
              placeholder="Describa detalladamente el trabajo a realizar..."
              rows={3}
              required
            />
          </div>

          {/* Fecha Inicio */}
          <Input
            label="Fecha y Hora de Inicio *"
            type="datetime-local"
            value={formData.fecha_inicio}
            onChange={(e) => handleChange('fecha_inicio', e.target.value)}
            required
          />

          {/* Fecha Fin */}
          <Input
            label="Fecha y Hora de Fin *"
            type="datetime-local"
            value={formData.fecha_fin}
            onChange={(e) => handleChange('fecha_fin', e.target.value)}
            required
          />

          {/* Solicitante */}
          <Select
            label="Solicitante *"
            value={String(formData.solicitante_id || '')}
            onChange={(e) => handleChange('solicitante_id', Number(e.target.value))}
            required
          >
            <option value="">Seleccione un usuario...</option>
            {usuariosOptions.map((op) => (
              <option key={op.value} value={op.value}>
                {op.label}
              </option>
            ))}
          </Select>

          {/* Supervisor */}
          <Select
            label="Supervisor *"
            value={String(formData.supervisor_id || '')}
            onChange={(e) => handleChange('supervisor_id', Number(e.target.value))}
            required
          >
            <option value="">Seleccione un usuario...</option>
            {usuariosOptions.map((op) => (
              <option key={op.value} value={op.value}>
                {op.label}
              </option>
            ))}
          </Select>

          {/* Ejecutor (opcional) */}
          <Select
            label="Ejecutor"
            value={String(formData.ejecutor_id || '')}
            onChange={(e) =>
              handleChange('ejecutor_id', e.target.value ? Number(e.target.value) : undefined)
            }
          >
            <option value="">Sin ejecutor asignado</option>
            {usuariosOptions.map((op) => (
              <option key={op.value} value={op.value}>
                {op.label}
              </option>
            ))}
          </Select>

          {/* Requiere Vigilia */}
          <div className="flex items-center gap-3 pt-2">
            <input
              id="requiere_vigilia"
              type="checkbox"
              checked={formData.requiere_vigilia ?? false}
              onChange={(e) => {
                handleChange('requiere_vigilia', e.target.checked);
                if (!e.target.checked) handleChange('vigilia_id', undefined);
              }}
              className="h-4 w-4 rounded border-gray-300 text-blue-600"
            />
            <label htmlFor="requiere_vigilia" className="text-sm font-medium text-gray-700">
              Requiere vigilia
            </label>
          </div>

          {/* Vigilia (condicional) */}
          {formData.requiere_vigilia && (
            <Select
              label="Vigilia"
              value={String(formData.vigilia_id || '')}
              onChange={(e) =>
                handleChange('vigilia_id', e.target.value ? Number(e.target.value) : undefined)
              }
            >
              <option value="">Seleccione un usuario...</option>
              {usuariosOptions.map((op) => (
                <option key={op.value} value={op.value}>
                  {op.label}
                </option>
              ))}
            </Select>
          )}
        </div>

        {/* Botones */}
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
              <>{item ? 'Actualizar' : 'Crear'} Permiso</>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
