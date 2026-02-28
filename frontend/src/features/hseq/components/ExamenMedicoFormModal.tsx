import { useState, useEffect } from 'react';
import { Modal, Button, Spinner } from '@/components/common';
import { Input, Select, Textarea } from '@/components/forms';
import {
  useCreateExamenMedico,
  useUpdateExamenMedico,
  useTiposExamen,
} from '../hooks/useMedicinaLaboral';
import type { ExamenMedico } from '../hooks/useMedicinaLaboral';
import { useSelectColaboradores } from '@/hooks/useSelectLists';
import { CONCEPTO_APTITUD_OPTIONS } from '../types/medicina-laboral.types';

interface ExamenMedicoFormModalProps {
  item: ExamenMedico | null;
  isOpen: boolean;
  onClose: () => void;
}

interface FormData {
  tipo_examen: number;
  colaborador_id: number;
  fecha_programada: string;
  fecha_realizado: string;
  entidad_prestadora: string;
  medico_evaluador: string;
  concepto_aptitud: string;
  hallazgos_relevantes: string;
  recomendaciones: string;
  costo_examen: number | undefined;
  observaciones: string;
}

const INITIAL_FORM: FormData = {
  tipo_examen: 0,
  colaborador_id: 0,
  fecha_programada: '',
  fecha_realizado: '',
  entidad_prestadora: '',
  medico_evaluador: '',
  concepto_aptitud: 'PENDIENTE',
  hallazgos_relevantes: '',
  recomendaciones: '',
  costo_examen: undefined,
  observaciones: '',
};

export default function ExamenMedicoFormModal({
  item,
  isOpen,
  onClose,
}: ExamenMedicoFormModalProps) {
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM);

  const createMutation = useCreateExamenMedico();
  const updateMutation = useUpdateExamenMedico();
  const { data: tiposExamen } = useTiposExamen();
  const { data: colaboradores } = useSelectColaboradores();

  const isLoading = createMutation.isPending || updateMutation.isPending;
  const tiposArray = Array.isArray(tiposExamen) ? tiposExamen : [];
  const colaboradoresArray = Array.isArray(colaboradores) ? colaboradores : [];

  useEffect(() => {
    if (item) {
      setFormData({
        tipo_examen: item.tipo_examen,
        colaborador_id: item.colaborador_id,
        fecha_programada: item.fecha_programada ?? '',
        fecha_realizado: item.fecha_realizado ?? '',
        entidad_prestadora: item.entidad_prestadora ?? '',
        medico_evaluador: item.medico_evaluador ?? '',
        concepto_aptitud: item.concepto_aptitud ?? 'PENDIENTE',
        hallazgos_relevantes: item.hallazgos_relevantes ?? '',
        recomendaciones: item.recomendaciones ?? '',
        costo_examen: item.costo_examen ? Number(item.costo_examen) : undefined,
        observaciones: item.observaciones ?? '',
      });
    } else {
      setFormData(INITIAL_FORM);
    }
  }, [item, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: Record<string, unknown> = { ...formData };
    if (!payload.tipo_examen) delete payload.tipo_examen;
    if (!payload.colaborador_id) delete payload.colaborador_id;
    if (!payload.costo_examen) delete payload.costo_examen;

    if (item) {
      updateMutation.mutate(
        { id: item.id, datos: payload as Partial<FormData> },
        { onSuccess: onClose }
      );
    } else {
      createMutation.mutate(payload as FormData, { onSuccess: onClose });
    }
  };

  const handleChange = (field: keyof FormData, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={item ? 'Editar Examen Médico' : 'Nuevo Examen Médico'}
      size="large"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Fila 1: Tipo | Colaborador */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Tipo de Examen *"
            value={formData.tipo_examen}
            onChange={(e) => handleChange('tipo_examen', parseInt(e.target.value))}
            required
          >
            <option value={0}>Seleccionar tipo...</option>
            {tiposArray.map((tipo) => (
              <option key={tipo.id} value={tipo.id}>
                {tipo.nombre}
              </option>
            ))}
          </Select>

          <Select
            label="Colaborador *"
            value={formData.colaborador_id}
            onChange={(e) => handleChange('colaborador_id', parseInt(e.target.value))}
            required
          >
            <option value={0}>Seleccionar colaborador...</option>
            {colaboradoresArray.map((col) => (
              <option key={col.value} value={col.value}>
                {col.label}
              </option>
            ))}
          </Select>
        </div>

        {/* Fila 2: Fechas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Fecha Programada *"
            type="date"
            value={formData.fecha_programada}
            onChange={(e) => handleChange('fecha_programada', e.target.value)}
            required
          />
          <Input
            label="Fecha Realizado"
            type="date"
            value={formData.fecha_realizado}
            onChange={(e) => handleChange('fecha_realizado', e.target.value)}
          />
        </div>

        {/* Fila 3: Entidad y Médico */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Entidad Prestadora"
            value={formData.entidad_prestadora}
            onChange={(e) => handleChange('entidad_prestadora', e.target.value)}
            placeholder="IPS o proveedor del examen..."
          />
          <Input
            label="Médico Evaluador"
            value={formData.medico_evaluador}
            onChange={(e) => handleChange('medico_evaluador', e.target.value)}
            placeholder="Nombre del médico..."
          />
        </div>

        {/* Fila 4: Concepto | Costo */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Concepto de Aptitud"
            value={formData.concepto_aptitud}
            onChange={(e) => handleChange('concepto_aptitud', e.target.value)}
          >
            {CONCEPTO_APTITUD_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
          <Input
            label="Costo del Examen"
            type="number"
            value={formData.costo_examen ?? ''}
            onChange={(e) =>
              handleChange(
                'costo_examen',
                e.target.value !== '' ? parseFloat(e.target.value) : undefined
              )
            }
            placeholder="0.00"
          />
        </div>

        {/* Fila 5: Hallazgos */}
        <Textarea
          label="Hallazgos Relevantes"
          value={formData.hallazgos_relevantes}
          onChange={(e) => handleChange('hallazgos_relevantes', e.target.value)}
          placeholder="Hallazgos encontrados en el examen..."
          rows={2}
        />

        {/* Fila 6: Recomendaciones */}
        <Textarea
          label="Recomendaciones"
          value={formData.recomendaciones}
          onChange={(e) => handleChange('recomendaciones', e.target.value)}
          placeholder="Recomendaciones médicas..."
          rows={2}
        />

        {/* Fila 7: Observaciones */}
        <Textarea
          label="Observaciones"
          value={formData.observaciones}
          onChange={(e) => handleChange('observaciones', e.target.value)}
          placeholder="Observaciones adicionales..."
          rows={2}
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
              <>{item ? 'Actualizar' : 'Programar'} Examen</>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
