import { useState, useEffect } from 'react';
import { HelpCircle } from 'lucide-react';
import { Modal, Button, Spinner, Tooltip } from '@/components/common';
import { Input, Select, Textarea } from '@/components/forms';
import { useCreateNoConformidad, useUpdateNoConformidad } from '../hooks/useCalidad';
import type { NoConformidadList, CreateNoConformidadDTO } from '../types/calidad.types';
import {
  TIPO_NO_CONFORMIDAD_OPCIONES,
  ORIGEN_NO_CONFORMIDAD_OPCIONES,
  SEVERIDAD_NO_CONFORMIDAD_OPCIONES,
} from '../types/calidad.types';

interface NoConformidadFormModalProps {
  item: NoConformidadList | null;
  isOpen: boolean;
  onClose: () => void;
}

const INITIAL_FORM: CreateNoConformidadDTO = {
  tipo: 'REAL',
  origen: 'PROCESO_INTERNO',
  severidad: 'MENOR',
  titulo: '',
  descripcion: '',
  fecha_deteccion: '',
  ubicacion: '',
  proceso_relacionado: '',
  requisito_incumplido: '',
  detectado_por: 0,
  responsable_analisis: undefined,
  observaciones: '',
};

export default function NoConformidadFormModal({
  item,
  isOpen,
  onClose,
}: NoConformidadFormModalProps) {
  const [formData, setFormData] = useState<CreateNoConformidadDTO>(INITIAL_FORM);

  const createMutation = useCreateNoConformidad();
  const updateMutation = useUpdateNoConformidad();

  const isLoading = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (item) {
      setFormData({
        tipo: item.tipo,
        origen: item.origen,
        severidad: item.severidad,
        titulo: item.titulo,
        descripcion: '',
        fecha_deteccion: item.fecha_deteccion,
        ubicacion: '',
        proceso_relacionado: '',
        requisito_incumplido: '',
        detectado_por: item.detectado_por_detail?.id ?? 0,
        responsable_analisis: undefined,
        observaciones: '',
      });
    } else {
      setFormData(INITIAL_FORM);
    }
  }, [item, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const payload = { ...formData };
    if (!payload.detectado_por) {
      delete (payload as Partial<CreateNoConformidadDTO>).detectado_por;
    }

    if (item) {
      updateMutation.mutate({ id: item.id, datos: payload }, { onSuccess: onClose });
    } else {
      createMutation.mutate(payload, { onSuccess: onClose });
    }
  };

  const handleChange = (
    field: keyof CreateNoConformidadDTO,
    value: string | number | undefined
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={item ? 'Editar No Conformidad' : 'Nueva No Conformidad'}
      size="large"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Fila 1: Tipo | Origen */}
          <div className="space-y-1">
            <div className="flex items-center gap-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Tipo *
              </label>
              <Tooltip
                content="Real: incumplimiento que ya ocurrió. Potencial: riesgo de incumplimiento que aún no se ha materializado."
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
              {TIPO_NO_CONFORMIDAD_OPCIONES.map((opcion) => (
                <option key={opcion.value} value={opcion.value}>
                  {opcion.label}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Origen *
              </label>
              <Tooltip
                content="Fuente donde se detectó la no conformidad: auditoría interna, queja de cliente, seguimiento de indicadores, revisión por la dirección, etc."
                position="top"
              >
                <HelpCircle className="h-3.5 w-3.5 text-gray-400 cursor-help" />
              </Tooltip>
            </div>
            <Select
              value={formData.origen}
              onChange={(e) => handleChange('origen', e.target.value)}
              required
            >
              {ORIGEN_NO_CONFORMIDAD_OPCIONES.map((opcion) => (
                <option key={opcion.value} value={opcion.value}>
                  {opcion.label}
                </option>
              ))}
            </Select>
          </div>

          {/* Fila 2: Severidad | Fecha de Detección */}
          <div className="space-y-1">
            <div className="flex items-center gap-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Severidad *
              </label>
              <Tooltip
                content="Mayor: incumplimiento sistémico que afecta la capacidad del sistema. Menor: incumplimiento puntual sin efecto sistémico. Observación: situación que puede derivar en no conformidad."
                position="top"
              >
                <HelpCircle className="h-3.5 w-3.5 text-gray-400 cursor-help" />
              </Tooltip>
            </div>
            <Select
              value={formData.severidad}
              onChange={(e) => handleChange('severidad', e.target.value)}
              required
            >
              {SEVERIDAD_NO_CONFORMIDAD_OPCIONES.map((opcion) => (
                <option key={opcion.value} value={opcion.value}>
                  {opcion.label}
                </option>
              ))}
            </Select>
          </div>

          <Input
            label="Fecha de Detección *"
            type="date"
            value={formData.fecha_deteccion}
            onChange={(e) => handleChange('fecha_deteccion', e.target.value)}
            required
          />

          {/* Fila 3: Título (ancho completo) */}
          <div className="md:col-span-2">
            <Input
              label="Título *"
              value={formData.titulo}
              onChange={(e) => handleChange('titulo', e.target.value)}
              placeholder="Resumen breve de la no conformidad"
              required
            />
          </div>

          {/* Fila 4: Descripción (ancho completo) */}
          <div className="md:col-span-2">
            <Textarea
              label="Descripción *"
              value={formData.descripcion}
              onChange={(e) => handleChange('descripcion', e.target.value)}
              placeholder="Descripción detallada de la no conformidad detectada..."
              rows={3}
              required
            />
          </div>

          {/* Fila 5: Ubicación | Proceso Relacionado */}
          <Input
            label="Ubicación"
            value={formData.ubicacion}
            onChange={(e) => handleChange('ubicacion', e.target.value)}
            placeholder="Ej: Planta 1, Área de producción"
          />

          <Input
            label="Proceso Relacionado"
            value={formData.proceso_relacionado}
            onChange={(e) => handleChange('proceso_relacionado', e.target.value)}
            placeholder="Ej: Gestión de Calidad, Producción"
          />

          {/* Fila 6: Requisito Incumplido (ancho completo) */}
          <div className="md:col-span-2 space-y-1">
            <div className="flex items-center gap-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Requisito Incumplido
              </label>
              <Tooltip
                content="Cite el numeral o cláusula específica de la norma ISO (ej: ISO 9001:2015 Numeral 8.5.1) o del procedimiento interno que no se está cumpliendo."
                position="top"
              >
                <HelpCircle className="h-3.5 w-3.5 text-gray-400 cursor-help" />
              </Tooltip>
            </div>
            <Textarea
              value={formData.requisito_incumplido}
              onChange={(e) => handleChange('requisito_incumplido', e.target.value)}
              placeholder="Requisito de norma, procedimiento o política que no se cumple..."
              rows={2}
            />
          </div>

          {/* Fila 7: Observaciones (ancho completo) */}
          <div className="md:col-span-2">
            <Textarea
              label="Observaciones"
              value={formData.observaciones}
              onChange={(e) => handleChange('observaciones', e.target.value)}
              placeholder="Observaciones adicionales relevantes..."
              rows={2}
            />
          </div>
        </div>

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
              <>{item ? 'Actualizar' : 'Crear'} No Conformidad</>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
