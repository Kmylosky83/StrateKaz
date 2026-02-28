import { useState, useEffect } from 'react';
import { Modal, Button, Spinner } from '@/components/common';
import { Input, Select, Textarea } from '@/components/forms';
import { useCreateInvestigacionATEL, useUpdateInvestigacionATEL } from '../hooks/useAccidentalidad';
import type { InvestigacionATEL, CreateInvestigacionATELDTO } from '../types/accidentalidad.types';
import { useSelectUsers } from '@/hooks/useSelectLists';

interface InvestigacionATELFormModalProps {
  item: InvestigacionATEL | null;
  isOpen: boolean;
  onClose: () => void;
}

const INITIAL_FORM: CreateInvestigacionATELDTO = {
  accidente_trabajo_id: undefined,
  enfermedad_laboral_id: undefined,
  incidente_trabajo_id: undefined,
  metodologia: 'ARBOL_CAUSAS',
  lider_investigacion_id: 0,
  fecha_inicio: '',
  fecha_limite: '',
  descripcion_hechos: '',
};

const METODOLOGIA_OPTIONS = [
  { value: 'ARBOL_CAUSAS', label: 'Árbol de Causas' },
  { value: 'CINCO_PORQUES', label: '5 Porqués' },
  { value: 'ISHIKAWA', label: 'Ishikawa' },
  { value: 'TAPROOT', label: 'TapRooT' },
  { value: 'OTRO', label: 'Otro' },
];

export default function InvestigacionATELFormModal({
  item,
  isOpen,
  onClose,
}: InvestigacionATELFormModalProps) {
  const [formData, setFormData] = useState<CreateInvestigacionATELDTO>(INITIAL_FORM);

  const createMutation = useCreateInvestigacionATEL();
  const updateMutation = useUpdateInvestigacionATEL();
  const { data: users = [] } = useSelectUsers();

  const isLoading = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (item) {
      setFormData({
        accidente_trabajo_id: item.accidente_trabajo_id ?? undefined,
        enfermedad_laboral_id: item.enfermedad_laboral_id ?? undefined,
        incidente_trabajo_id: item.incidente_trabajo_id ?? undefined,
        metodologia: item.metodologia || 'ARBOL_CAUSAS',
        lider_investigacion_id: item.lider_investigacion_id ?? 0,
        fecha_inicio: item.fecha_inicio || '',
        fecha_limite: item.fecha_limite || '',
        descripcion_hechos: item.descripcion_hechos || '',
      });
    } else {
      setFormData(INITIAL_FORM);
    }
  }, [item, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const payload = { ...formData };

    if (!payload.lider_investigacion_id)
      delete (payload as Partial<CreateInvestigacionATELDTO>).lider_investigacion_id;
    if (!payload.accidente_trabajo_id) delete payload.accidente_trabajo_id;
    if (!payload.enfermedad_laboral_id) delete payload.enfermedad_laboral_id;
    if (!payload.incidente_trabajo_id) delete payload.incidente_trabajo_id;

    if (item) {
      updateMutation.mutate({ id: item.id, dto: payload }, { onSuccess: onClose });
    } else {
      createMutation.mutate(payload, { onSuccess: onClose });
    }
  };

  const handleChange = (field: keyof CreateInvestigacionATELDTO, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={item ? 'Editar Investigación' : 'Nueva Investigación ATEL'}
      size="large"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Sección: Evento relacionado */}
          <div className="md:col-span-2">
            <p className="text-sm font-medium text-gray-500 mb-3">
              Evento relacionado (opcional — complete solo el campo aplicable)
            </p>
          </div>

          <Input
            label="ID Accidente de Trabajo"
            type="number"
            value={
              formData.accidente_trabajo_id !== undefined
                ? String(formData.accidente_trabajo_id)
                : ''
            }
            onChange={(e) =>
              handleChange(
                'accidente_trabajo_id',
                e.target.value !== '' ? parseInt(e.target.value) : undefined
              )
            }
            placeholder="Número de accidente"
          />

          <Input
            label="ID Enfermedad Laboral"
            type="number"
            value={
              formData.enfermedad_laboral_id !== undefined
                ? String(formData.enfermedad_laboral_id)
                : ''
            }
            onChange={(e) =>
              handleChange(
                'enfermedad_laboral_id',
                e.target.value !== '' ? parseInt(e.target.value) : undefined
              )
            }
            placeholder="Número de enfermedad laboral"
          />

          <Input
            label="ID Incidente de Trabajo"
            type="number"
            value={
              formData.incidente_trabajo_id !== undefined
                ? String(formData.incidente_trabajo_id)
                : ''
            }
            onChange={(e) =>
              handleChange(
                'incidente_trabajo_id',
                e.target.value !== '' ? parseInt(e.target.value) : undefined
              )
            }
            placeholder="Número de incidente"
          />

          {/* Fila: Metodología */}
          <Select
            label="Metodología *"
            value={formData.metodologia}
            onChange={(e) => handleChange('metodologia', e.target.value)}
            required
          >
            {METODOLOGIA_OPTIONS.map((op) => (
              <option key={op.value} value={op.value}>
                {op.label}
              </option>
            ))}
          </Select>

          {/* Fila: Líder de Investigación (ancho completo) */}
          <div className="md:col-span-2">
            <Select
              label="Líder de Investigación *"
              value={String(formData.lider_investigacion_id || '')}
              onChange={(e) => handleChange('lider_investigacion_id', Number(e.target.value))}
              required
            >
              <option value="">Seleccionar líder...</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.label}
                </option>
              ))}
            </Select>
          </div>

          {/* Fila: Fecha Inicio | Fecha Límite */}
          <Input
            label="Fecha de Inicio *"
            type="date"
            value={formData.fecha_inicio}
            onChange={(e) => handleChange('fecha_inicio', e.target.value)}
            required
          />

          <Input
            label="Fecha Límite *"
            type="date"
            value={formData.fecha_limite}
            onChange={(e) => handleChange('fecha_limite', e.target.value)}
            required
          />

          {/* Fila: Descripción de los Hechos (ancho completo) */}
          <div className="md:col-span-2">
            <Textarea
              label="Descripción de los Hechos *"
              value={formData.descripcion_hechos}
              onChange={(e) => handleChange('descripcion_hechos', e.target.value)}
              placeholder="Describa los hechos y circunstancias del evento que se va a investigar..."
              rows={4}
              required
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
              <>{item ? 'Actualizar' : 'Crear'} Investigación</>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
