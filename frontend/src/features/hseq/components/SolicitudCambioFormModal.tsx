import { useState, useEffect } from 'react';
import { Modal, Button, Spinner } from '@/components/common';
import { Input, Select, Textarea } from '@/components/forms';
import { useCreateSolicitudCambio, useUpdateSolicitudCambio } from '../hooks/useCalidad';
import type { SolicitudCambioList, CreateSolicitudCambioDTO } from '../types/calidad.types';
import { TIPO_SOLICITUD_CAMBIO_OPCIONES, PRIORIDAD_CAMBIO_OPCIONES } from '../types/calidad.types';

interface SolicitudCambioFormModalProps {
  item: SolicitudCambioList | null;
  isOpen: boolean;
  onClose: () => void;
}

const INITIAL_FORM: CreateSolicitudCambioDTO = {
  tipo: 'PROCESO',
  prioridad: 'MEDIA',
  titulo: '',
  descripcion_actual: '',
  descripcion_cambio: '',
  justificacion: '',
  solicitante: 0,
  impacto_calidad: '',
  impacto_procesos: '',
  riesgos_identificados: '',
  medidas_mitigacion: '',
  costo_estimado: undefined,
};

export default function SolicitudCambioFormModal({
  item,
  isOpen,
  onClose,
}: SolicitudCambioFormModalProps) {
  const [formData, setFormData] = useState<CreateSolicitudCambioDTO>(INITIAL_FORM);

  const createMutation = useCreateSolicitudCambio();
  const updateMutation = useUpdateSolicitudCambio();

  const isLoading = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (item) {
      setFormData({
        tipo: item.tipo,
        prioridad: item.prioridad,
        titulo: item.titulo,
        descripcion_actual: '',
        descripcion_cambio: '',
        justificacion: '',
        solicitante: item.solicitante_detail?.id ?? 0,
        impacto_calidad: '',
        impacto_procesos: '',
        riesgos_identificados: '',
        medidas_mitigacion: '',
        costo_estimado: undefined,
      });
    } else {
      setFormData(INITIAL_FORM);
    }
  }, [item, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const payload = { ...formData };

    if (!payload.solicitante) {
      delete (payload as Partial<CreateSolicitudCambioDTO>).solicitante;
    }
    if (!payload.costo_estimado) {
      delete payload.costo_estimado;
    }
    if (!payload.impacto_calidad) delete payload.impacto_calidad;
    if (!payload.impacto_procesos) delete payload.impacto_procesos;
    if (!payload.riesgos_identificados) delete payload.riesgos_identificados;
    if (!payload.medidas_mitigacion) delete payload.medidas_mitigacion;

    if (item) {
      updateMutation.mutate({ id: item.id, datos: payload }, { onSuccess: onClose });
    } else {
      createMutation.mutate(payload, { onSuccess: onClose });
    }
  };

  const handleChange = (field: keyof CreateSolicitudCambioDTO, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={item ? 'Editar Solicitud de Cambio' : 'Nueva Solicitud de Cambio'}
      size="large"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Fila 1: Tipo de Cambio | Prioridad */}
          <Select
            label="Tipo de Cambio *"
            value={formData.tipo}
            onChange={(e) => handleChange('tipo', e.target.value)}
            required
          >
            {TIPO_SOLICITUD_CAMBIO_OPCIONES.map((opcion) => (
              <option key={opcion.value} value={opcion.value}>
                {opcion.label}
              </option>
            ))}
          </Select>

          <Select
            label="Prioridad *"
            value={formData.prioridad}
            onChange={(e) => handleChange('prioridad', e.target.value)}
            required
          >
            {PRIORIDAD_CAMBIO_OPCIONES.map((opcion) => (
              <option key={opcion.value} value={opcion.value}>
                {opcion.label}
              </option>
            ))}
          </Select>

          {/* Fila 2: Título (ancho completo) */}
          <div className="md:col-span-2">
            <Input
              label="Título *"
              value={formData.titulo}
              onChange={(e) => handleChange('titulo', e.target.value)}
              placeholder="Resumen breve de la solicitud de cambio"
              required
            />
          </div>

          {/* Fila 3: Descripción de la Situación Actual (ancho completo) */}
          <div className="md:col-span-2">
            <Textarea
              label="Descripción de la Situación Actual *"
              value={formData.descripcion_actual}
              onChange={(e) => handleChange('descripcion_actual', e.target.value)}
              placeholder="Describa el estado actual del proceso, procedimiento, documento u objeto del cambio..."
              rows={3}
              required
            />
          </div>

          {/* Fila 4: Descripción del Cambio Propuesto (ancho completo) */}
          <div className="md:col-span-2">
            <Textarea
              label="Descripción del Cambio Propuesto *"
              value={formData.descripcion_cambio}
              onChange={(e) => handleChange('descripcion_cambio', e.target.value)}
              placeholder="Describa en detalle el cambio que se propone realizar..."
              rows={3}
              required
            />
          </div>

          {/* Fila 5: Justificación (ancho completo) */}
          <div className="md:col-span-2">
            <Textarea
              label="Justificación *"
              value={formData.justificacion}
              onChange={(e) => handleChange('justificacion', e.target.value)}
              placeholder="Explique las razones que motivan este cambio..."
              rows={2}
              required
            />
          </div>

          {/* Fila 6: Impacto en Calidad | Impacto en Procesos */}
          <Input
            label="Impacto en Calidad"
            value={formData.impacto_calidad ?? ''}
            onChange={(e) => handleChange('impacto_calidad', e.target.value)}
            placeholder="Ej: Mejora en la trazabilidad del producto"
          />

          <Input
            label="Impacto en Procesos"
            value={formData.impacto_procesos ?? ''}
            onChange={(e) => handleChange('impacto_procesos', e.target.value)}
            placeholder="Ej: Actualización del procedimiento de producción"
          />

          {/* Fila 7: Riesgos Identificados | Medidas de Mitigación */}
          <Input
            label="Riesgos Identificados"
            value={formData.riesgos_identificados ?? ''}
            onChange={(e) => handleChange('riesgos_identificados', e.target.value)}
            placeholder="Ej: Posible resistencia al cambio por parte del equipo"
          />

          <Input
            label="Medidas de Mitigación"
            value={formData.medidas_mitigacion ?? ''}
            onChange={(e) => handleChange('medidas_mitigacion', e.target.value)}
            placeholder="Ej: Capacitación previa al equipo involucrado"
          />

          {/* Fila 8: Costo Estimado */}
          <Input
            label="Costo Estimado (COP)"
            type="number"
            value={formData.costo_estimado !== undefined ? String(formData.costo_estimado) : ''}
            onChange={(e) =>
              handleChange(
                'costo_estimado',
                e.target.value !== '' ? parseFloat(e.target.value) : undefined
              )
            }
            placeholder="0"
          />
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
              <>{item ? 'Actualizar' : 'Crear'} Solicitud</>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
