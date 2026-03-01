/**
 * Modal de formulario para Órdenes de Trabajo (Mantenimiento)
 * Production Ops - StrateKaz SGI
 */
import { useState, useEffect, useMemo } from 'react';
import { Modal, Button, Spinner } from '@/components/common';
import { Input, Select, Textarea } from '@/components/forms';
import {
  useCreateOrdenTrabajo,
  useUpdateOrdenTrabajo,
  useActivosProduccion,
  useTiposMantenimientoActivos,
} from '../hooks/useProductionOps';
import { useSelectUsers } from '@/hooks/useSelectLists';
import type { OrdenTrabajo, CreateOrdenTrabajoDTO } from '../types/production-ops.types';
import { useAuthStore } from '@/store/authStore';

interface OrdenTrabajoFormModalProps {
  item: OrdenTrabajo | null;
  isOpen: boolean;
  onClose: () => void;
}

interface OTFormData {
  activo: number;
  tipo_mantenimiento: number;
  prioridad: number;
  descripcion_problema: string;
  fecha_programada: string;
  asignado_a: number;
  observaciones: string;
}

const INITIAL_FORM: OTFormData = {
  activo: 0,
  tipo_mantenimiento: 0,
  prioridad: 3,
  descripcion_problema: '',
  fecha_programada: '',
  asignado_a: 0,
  observaciones: '',
};

const PRIORIDAD_OT_OPTIONS = [
  { value: '1', label: 'Crítica' },
  { value: '2', label: 'Alta' },
  { value: '3', label: 'Media' },
  { value: '4', label: 'Baja' },
  { value: '5', label: 'Planificada' },
];

export default function OrdenTrabajoFormModal({
  item,
  isOpen,
  onClose,
}: OrdenTrabajoFormModalProps) {
  const [formData, setFormData] = useState<OTFormData>(INITIAL_FORM);
  const user = useAuthStore((s) => s.user);

  const createMutation = useCreateOrdenTrabajo();
  const updateMutation = useUpdateOrdenTrabajo();

  const { data: activosData } = useActivosProduccion({ page_size: 100 });
  const { data: tiposMantenimiento = [] } = useTiposMantenimientoActivos();
  const { data: usuarios = [] } = useSelectUsers();

  const activos = useMemo(() => {
    const raw = activosData;
    return Array.isArray(raw) ? raw : (raw?.results ?? []);
  }, [activosData]);

  const isLoading = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (item) {
      setFormData({
        activo: item.activo || 0,
        tipo_mantenimiento: item.tipo_mantenimiento || 0,
        prioridad: item.prioridad || 3,
        descripcion_problema: item.descripcion_problema || '',
        fecha_programada: item.fecha_programada || '',
        asignado_a: item.asignado_a || 0,
        observaciones: item.observaciones || '',
      });
    } else {
      setFormData(INITIAL_FORM);
    }
  }, [item, isOpen]);

  const handleChange = (field: keyof OTFormData, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const payload: CreateOrdenTrabajoDTO = {
      activo: formData.activo,
      tipo_mantenimiento: formData.tipo_mantenimiento,
      descripcion_problema: formData.descripcion_problema,
      solicitante: user?.id || 0,
      prioridad: formData.prioridad,
    };

    if (formData.fecha_programada) payload.fecha_programada = formData.fecha_programada;
    if (formData.asignado_a) payload.asignado_a = formData.asignado_a;

    if (item) {
      const updatePayload = {
        ...payload,
        ...(formData.observaciones ? { observaciones: formData.observaciones } : {}),
      };
      updateMutation.mutate({ id: item.id, data: updatePayload }, { onSuccess: onClose });
    } else {
      createMutation.mutate(payload, { onSuccess: onClose });
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={item ? 'Editar Orden de Trabajo' : 'Nueva Orden de Trabajo'}
      size="large"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Activo */}
          <Select
            label="Activo / Equipo *"
            value={String(formData.activo || '')}
            onChange={(e) => handleChange('activo', Number(e.target.value))}
            required
          >
            <option value="">Seleccione un activo...</option>
            {activos.map((a) => (
              <option key={a.id} value={String(a.id)}>
                {a.codigo} - {a.nombre}
              </option>
            ))}
          </Select>

          {/* Tipo Mantenimiento */}
          <Select
            label="Tipo de Mantenimiento *"
            value={String(formData.tipo_mantenimiento || '')}
            onChange={(e) => handleChange('tipo_mantenimiento', Number(e.target.value))}
            required
          >
            <option value="">Seleccione un tipo...</option>
            {tiposMantenimiento.map((t) => (
              <option key={t.id} value={String(t.id)}>
                {t.nombre}
              </option>
            ))}
          </Select>

          {/* Prioridad */}
          <Select
            label="Prioridad *"
            value={String(formData.prioridad)}
            onChange={(e) => handleChange('prioridad', Number(e.target.value))}
            required
          >
            {PRIORIDAD_OT_OPTIONS.map((op) => (
              <option key={op.value} value={op.value}>
                {op.label}
              </option>
            ))}
          </Select>

          {/* Fecha Programada */}
          <Input
            label="Fecha Programada"
            type="date"
            value={formData.fecha_programada}
            onChange={(e) => handleChange('fecha_programada', e.target.value)}
          />

          {/* Asignado a */}
          <Select
            label="Asignado a"
            value={String(formData.asignado_a || '')}
            onChange={(e) => handleChange('asignado_a', Number(e.target.value))}
          >
            <option value="">Sin asignar</option>
            {usuarios.map((u) => (
              <option key={u.id} value={String(u.id)}>
                {u.label}
              </option>
            ))}
          </Select>
        </div>

        {/* Descripción del Problema */}
        <Textarea
          label="Descripción del Problema / Trabajo *"
          value={formData.descripcion_problema}
          onChange={(e) => handleChange('descripcion_problema', e.target.value)}
          rows={3}
          placeholder="Describa el problema o trabajo a realizar..."
          required
        />

        {/* Observaciones */}
        <Textarea
          label="Observaciones"
          value={formData.observaciones}
          onChange={(e) => handleChange('observaciones', e.target.value)}
          rows={2}
          placeholder="Repuestos necesarios, notas adicionales..."
        />

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
              <>{item ? 'Actualizar' : 'Crear'} Orden de Trabajo</>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
