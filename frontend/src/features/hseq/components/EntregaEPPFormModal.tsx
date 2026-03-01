import { useState, useEffect } from 'react';
import { Modal, Button, Spinner } from '@/components/common';
import { Input, Select, Textarea, Checkbox } from '@/components/forms';
import {
  useCreateEntregaEPP,
  useUpdateEntregaEPP,
  useTiposEPP,
} from '../hooks/useSeguridadIndustrial';
import type { EntregaEPP, CreateEntregaEPPDTO } from '../types/seguridad-industrial.types';
import { useSelectUsers, useSelectColaboradores } from '@/hooks/useSelectLists';

interface EntregaEPPFormModalProps {
  item: EntregaEPP | null;
  isOpen: boolean;
  onClose: () => void;
}

const INITIAL_FORM: CreateEntregaEPPDTO = {
  colaborador_id: 0,
  tipo_epp_id: 0,
  marca: '',
  modelo: '',
  talla: '',
  serial: '',
  cantidad: 1,
  fecha_entrega: '',
  entregado_por_id: 0,
  capacitacion_realizada: false,
  fecha_capacitacion: '',
  observaciones: '',
};

export default function EntregaEPPFormModal({ item, isOpen, onClose }: EntregaEPPFormModalProps) {
  const [formData, setFormData] = useState<CreateEntregaEPPDTO>(INITIAL_FORM);

  const createMutation = useCreateEntregaEPP();
  const updateMutation = useUpdateEntregaEPP();

  const { data: tiposEPP = [] } = useTiposEPP({ activo: true });
  const { data: colaboradores = [] } = useSelectColaboradores();
  const { data: usuarios = [] } = useSelectUsers();

  const isLoading = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (item) {
      setFormData({
        colaborador_id: item.colaborador_id ?? item.colaborador?.id ?? 0,
        tipo_epp_id: item.tipo_epp_id ?? item.tipo_epp?.id ?? 0,
        marca: item.marca || '',
        modelo: item.modelo || '',
        talla: item.talla || '',
        serial: item.serial || '',
        cantidad: item.cantidad ?? 1,
        fecha_entrega: item.fecha_entrega || '',
        entregado_por_id: item.entregado_por_id ?? item.entregado_por?.id ?? 0,
        capacitacion_realizada: item.capacitacion_realizada ?? false,
        fecha_capacitacion: item.fecha_capacitacion || '',
        observaciones: item.observaciones || '',
      });
    } else {
      setFormData(INITIAL_FORM);
    }
  }, [item, isOpen]);

  const handleChange = (field: keyof CreateEntregaEPPDTO, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const payload = { ...formData };

    // Limpiar campos opcionales vacíos
    if (!payload.marca) delete payload.marca;
    if (!payload.modelo) delete payload.modelo;
    if (!payload.talla) delete payload.talla;
    if (!payload.serial) delete payload.serial;
    if (!payload.observaciones) delete payload.observaciones;
    if (!payload.capacitacion_realizada || !payload.fecha_capacitacion) {
      delete payload.fecha_capacitacion;
    }

    if (item) {
      updateMutation.mutate({ id: item.id, dto: payload }, { onSuccess: onClose });
    } else {
      createMutation.mutate(payload, { onSuccess: onClose });
    }
  };

  const colaboradoresOptions = colaboradores.map((c) => ({
    value: String(c.id),
    label: c.label,
  }));

  const tiposEPPOptions = tiposEPP.map((t) => ({
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
      title={item ? 'Editar Entrega de EPP' : 'Nueva Entrega de EPP'}
      size="large"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Colaborador */}
          <Select
            label="Colaborador *"
            value={String(formData.colaborador_id || '')}
            onChange={(e) => handleChange('colaborador_id', Number(e.target.value))}
            required
          >
            <option value="">Seleccione un colaborador...</option>
            {colaboradoresOptions.map((op) => (
              <option key={op.value} value={op.value}>
                {op.label}
              </option>
            ))}
          </Select>

          {/* Tipo de EPP */}
          <Select
            label="Tipo de EPP *"
            value={String(formData.tipo_epp_id || '')}
            onChange={(e) => handleChange('tipo_epp_id', Number(e.target.value))}
            required
          >
            <option value="">Seleccione un tipo de EPP...</option>
            {tiposEPPOptions.map((op) => (
              <option key={op.value} value={op.value}>
                {op.label}
              </option>
            ))}
          </Select>

          {/* Marca */}
          <Input
            label="Marca"
            value={formData.marca || ''}
            onChange={(e) => handleChange('marca', e.target.value)}
            placeholder="Ej: 3M, Honeywell"
          />

          {/* Modelo */}
          <Input
            label="Modelo"
            value={formData.modelo || ''}
            onChange={(e) => handleChange('modelo', e.target.value)}
            placeholder="Ej: Serie 6000"
          />

          {/* Talla */}
          <Input
            label="Talla"
            value={formData.talla || ''}
            onChange={(e) => handleChange('talla', e.target.value)}
            placeholder="Ej: M, L, XL, 42"
          />

          {/* Serial */}
          <Input
            label="Serial"
            value={formData.serial || ''}
            onChange={(e) => handleChange('serial', e.target.value)}
            placeholder="Número de serie del equipo"
          />

          {/* Cantidad */}
          <Input
            label="Cantidad"
            type="number"
            value={formData.cantidad !== undefined ? String(formData.cantidad) : '1'}
            onChange={(e) =>
              handleChange(
                'cantidad',
                e.target.value !== '' ? parseFloat(e.target.value) || undefined : undefined
              )
            }
            placeholder="1"
          />

          {/* Fecha de Entrega */}
          <Input
            label="Fecha de Entrega *"
            type="date"
            value={formData.fecha_entrega}
            onChange={(e) => handleChange('fecha_entrega', e.target.value)}
            required
          />

          {/* Entregado Por */}
          <Select
            label="Entregado Por *"
            value={String(formData.entregado_por_id || '')}
            onChange={(e) => handleChange('entregado_por_id', Number(e.target.value))}
            required
          >
            <option value="">Seleccione un usuario...</option>
            {usuariosOptions.map((op) => (
              <option key={op.value} value={op.value}>
                {op.label}
              </option>
            ))}
          </Select>

          {/* Capacitación Realizada */}
          <div className="pt-2">
            <Checkbox
              checked={formData.capacitacion_realizada ?? false}
              onChange={(e) => {
                handleChange('capacitacion_realizada', e.target.checked);
                if (!e.target.checked) handleChange('fecha_capacitacion', '');
              }}
              label="Capacitación realizada"
            />
          </div>

          {/* Fecha Capacitación (condicional) */}
          {formData.capacitacion_realizada && (
            <Input
              label="Fecha de Capacitación"
              type="date"
              value={formData.fecha_capacitacion || ''}
              onChange={(e) => handleChange('fecha_capacitacion', e.target.value)}
            />
          )}

          {/* Observaciones */}
          <div className="md:col-span-2">
            <Textarea
              label="Observaciones"
              value={formData.observaciones || ''}
              onChange={(e) => handleChange('observaciones', e.target.value)}
              placeholder="Observaciones adicionales sobre la entrega..."
              rows={3}
            />
          </div>
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
              <>{item ? 'Actualizar' : 'Registrar'} Entrega</>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
