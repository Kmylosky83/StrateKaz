import { useState, useEffect } from 'react';
import { HelpCircle } from 'lucide-react';
import { Modal, Button, Spinner, Tooltip } from '@/components/common';
import { Input, Select, Textarea } from '@/components/forms';
import {
  useCreateAccionCorrectiva,
  useUpdateAccionCorrectiva,
  useNoConformidades,
} from '../hooks/useCalidad';
import type { AccionCorrectivaList, CreateAccionCorrectivaDTO } from '../types/calidad.types';
import { TIPO_ACCION_OPCIONES } from '../types/calidad.types';

interface AccionCorrectivaFormModalProps {
  item: AccionCorrectivaList | null;
  isOpen: boolean;
  onClose: () => void;
}

const INITIAL_FORM: CreateAccionCorrectivaDTO = {
  tipo: 'CORRECTIVA',
  no_conformidad: 0,
  descripcion: '',
  objetivo: '',
  fecha_planificada: '',
  fecha_limite: '',
  recursos_necesarios: '',
  responsable: 0,
  costo_estimado: undefined,
};

export default function AccionCorrectivaFormModal({
  item,
  isOpen,
  onClose,
}: AccionCorrectivaFormModalProps) {
  const [formData, setFormData] = useState<CreateAccionCorrectivaDTO>(INITIAL_FORM);

  const createMutation = useCreateAccionCorrectiva();
  const updateMutation = useUpdateAccionCorrectiva();
  const { data: ncData } = useNoConformidades();

  const isLoading = createMutation.isPending || updateMutation.isPending;
  const noConformidades = ncData?.results ?? [];

  useEffect(() => {
    if (item) {
      setFormData({
        tipo: item.tipo,
        no_conformidad: 0,
        descripcion: item.descripcion,
        objetivo: '',
        fecha_planificada: '',
        fecha_limite: item.fecha_limite,
        recursos_necesarios: '',
        responsable: item.responsable_detail?.id ?? 0,
        costo_estimado: undefined,
      });
    } else {
      setFormData(INITIAL_FORM);
    }
  }, [item, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...formData };
    if (!payload.responsable) delete (payload as Partial<CreateAccionCorrectivaDTO>).responsable;
    if (!payload.costo_estimado)
      delete (payload as Partial<CreateAccionCorrectivaDTO>).costo_estimado;

    if (item) {
      updateMutation.mutate({ id: item.id, datos: payload }, { onSuccess: onClose });
    } else {
      createMutation.mutate(payload as CreateAccionCorrectivaDTO, { onSuccess: onClose });
    }
  };

  const handleChange = (field: keyof CreateAccionCorrectivaDTO, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={item ? 'Editar Acción Correctiva' : 'Nueva Acción Correctiva'}
      size="large"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Fila 1: Tipo | No Conformidad */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Tipo de Acción *
              </label>
              <Tooltip
                content="Correctiva: elimina la causa de una no conformidad detectada. Preventiva: elimina la causa de una no conformidad potencial. De mejora: incrementa el desempeño sin no conformidad previa."
                position="top"
              >
                <HelpCircle className="h-3.5 w-3.5 text-gray-400 cursor-help" />
              </Tooltip>
            </div>
            <Select
              value={formData.tipo}
              onChange={(e) => handleChange('tipo', e.target.value)}
              required
            >
              {TIPO_ACCION_OPCIONES.map((opcion) => (
                <option key={opcion.value} value={opcion.value}>
                  {opcion.label}
                </option>
              ))}
            </Select>
          </div>

          <Select
            label="No Conformidad *"
            value={formData.no_conformidad}
            onChange={(e) => handleChange('no_conformidad', parseInt(e.target.value))}
            required
          >
            <option value={0}>Seleccionar NC...</option>
            {noConformidades.map((nc) => (
              <option key={nc.id} value={nc.id}>
                {nc.codigo} - {nc.titulo}
              </option>
            ))}
          </Select>
        </div>

        {/* Fila 2: Descripción */}
        <div>
          <Textarea
            label="Descripción *"
            value={formData.descripcion}
            onChange={(e) => handleChange('descripcion', e.target.value)}
            placeholder="Descripción detallada de la acción a implementar..."
            rows={3}
            required
          />
        </div>

        {/* Fila 3: Objetivo */}
        <div>
          <Textarea
            label="Objetivo"
            value={formData.objetivo}
            onChange={(e) => handleChange('objetivo', e.target.value)}
            placeholder="Resultado esperado al ejecutar esta acción..."
            rows={2}
          />
        </div>

        {/* Fila 4: Fechas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Fecha Planificada *"
            type="date"
            value={formData.fecha_planificada}
            onChange={(e) => handleChange('fecha_planificada', e.target.value)}
            required
          />

          <div className="space-y-1">
            <div className="flex items-center gap-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Fecha Límite *
              </label>
              <Tooltip
                content="Fecha máxima para completar la acción. Según ISO 9001, las acciones correctivas deben cerrarse dentro de plazos razonables definidos por la organización."
                position="top"
              >
                <HelpCircle className="h-3.5 w-3.5 text-gray-400 cursor-help" />
              </Tooltip>
            </div>
            <Input
              type="date"
              value={formData.fecha_limite}
              onChange={(e) => handleChange('fecha_limite', e.target.value)}
              required
            />
          </div>
        </div>

        {/* Fila 5: Recursos y Costo */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Recursos Necesarios"
            value={formData.recursos_necesarios}
            onChange={(e) => handleChange('recursos_necesarios', e.target.value)}
            placeholder="Ej: Capacitación, equipos, materiales..."
          />

          <Input
            label="Costo Estimado"
            type="number"
            value={formData.costo_estimado ?? ''}
            onChange={(e) =>
              handleChange(
                'costo_estimado',
                e.target.value !== '' ? parseFloat(e.target.value) : undefined
              )
            }
            placeholder="0.00"
          />
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
              <>{item ? 'Actualizar' : 'Crear'} Acción</>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
