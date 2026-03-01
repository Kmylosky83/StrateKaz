/**
 * Modal CRUD para Verificaciones PESV
 */
import { useState, useEffect } from 'react';
import { Modal, Button, Spinner } from '@/components/common';
import { Input, Select, Textarea } from '@/components/forms';
import { useCreateVerificacion, useVehiculos } from '../hooks/useLogisticsFleet';
import {
  TipoVerificacionLabels,
  ResultadoVerificacionLabels,
} from '../types/logistics-fleet.types';
import type {
  VerificacionTercero,
  CreateVerificacionDTO,
  TipoVerificacion,
  ResultadoVerificacion,
} from '../types/logistics-fleet.types';

interface Props {
  item: VerificacionTercero | null;
  isOpen: boolean;
  onClose: () => void;
}

const TIPOS: TipoVerificacion[] = [
  'PREOPERACIONAL_DIARIA',
  'INSPECCION_MENSUAL',
  'AUDITORIA_EXTERNA',
  'INSPECCION_ESPECIAL',
];

const RESULTADOS: ResultadoVerificacion[] = ['APROBADO', 'APROBADO_CON_OBSERVACIONES', 'RECHAZADO'];

const INITIAL_FORM: CreateVerificacionDTO = {
  vehiculo: 0,
  fecha: new Date().toISOString().split('T')[0],
  tipo: 'PREOPERACIONAL_DIARIA',
  inspector_externo: '',
  checklist_items: [],
  resultado: 'APROBADO',
  kilometraje: 0,
  nivel_combustible: '',
  observaciones_generales: '',
  acciones_correctivas: '',
};

export default function VerificacionFormModal({ item, isOpen, onClose }: Props) {
  const [formData, setFormData] = useState<CreateVerificacionDTO>(INITIAL_FORM);
  const createMutation = useCreateVerificacion();
  const { data: vehiculosData } = useVehiculos({ is_active: true });
  const isLoading = createMutation.isPending;

  const vehiculos = Array.isArray(vehiculosData) ? vehiculosData : (vehiculosData?.results ?? []);

  useEffect(() => {
    if (item) {
      setFormData({
        vehiculo: item.vehiculo,
        fecha: item.fecha,
        tipo: item.tipo,
        inspector_externo: item.inspector_externo || '',
        checklist_items: item.checklist_items || [],
        resultado: item.resultado,
        kilometraje: item.kilometraje,
        nivel_combustible: item.nivel_combustible || '',
        observaciones_generales: item.observaciones_generales || '',
        acciones_correctivas: item.acciones_correctivas || '',
      });
    } else {
      setFormData(INITIAL_FORM);
    }
  }, [item, isOpen]);

  const handleChange = (field: keyof CreateVerificacionDTO, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...formData };
    if (!payload.vehiculo) delete (payload as Record<string, unknown>).vehiculo;
    createMutation.mutate(payload as CreateVerificacionDTO, { onSuccess: onClose });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={item ? 'Detalle Verificación' : 'Nueva Verificación PESV'}
      size="large"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Select
            label="Vehículo *"
            value={formData.vehiculo || ''}
            onChange={(e) => handleChange('vehiculo', Number(e.target.value))}
            required
          >
            <option value="">Seleccionar vehículo...</option>
            {vehiculos.map((v) => (
              <option key={v.id} value={v.id}>
                {v.placa} - {v.marca} {v.modelo}
              </option>
            ))}
          </Select>
          <Select
            label="Tipo Verificación *"
            value={formData.tipo}
            onChange={(e) => handleChange('tipo', e.target.value)}
            required
          >
            {TIPOS.map((t) => (
              <option key={t} value={t}>
                {TipoVerificacionLabels[t]}
              </option>
            ))}
          </Select>
          <Input
            label="Fecha *"
            type="date"
            value={formData.fecha}
            onChange={(e) => handleChange('fecha', e.target.value)}
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Select
            label="Resultado *"
            value={formData.resultado}
            onChange={(e) => handleChange('resultado', e.target.value)}
            required
          >
            {RESULTADOS.map((r) => (
              <option key={r} value={r}>
                {ResultadoVerificacionLabels[r]}
              </option>
            ))}
          </Select>
          <Input
            label="Kilometraje *"
            type="number"
            value={formData.kilometraje}
            onChange={(e) => handleChange('kilometraje', Number(e.target.value))}
            required
            min={0}
          />
          <Input
            label="Nivel Combustible"
            value={formData.nivel_combustible || ''}
            onChange={(e) => handleChange('nivel_combustible', e.target.value)}
            placeholder="Ej: 3/4, Lleno"
          />
        </div>

        <Input
          label="Inspector Externo"
          value={formData.inspector_externo || ''}
          onChange={(e) => handleChange('inspector_externo', e.target.value)}
          placeholder="Nombre del inspector (si aplica)"
        />

        <Textarea
          label="Observaciones Generales"
          value={formData.observaciones_generales || ''}
          onChange={(e) => handleChange('observaciones_generales', e.target.value)}
          rows={2}
        />

        <Textarea
          label="Acciones Correctivas"
          value={formData.acciones_correctivas || ''}
          onChange={(e) => handleChange('acciones_correctivas', e.target.value)}
          rows={2}
          placeholder="Acciones requeridas si el resultado no es aprobado"
        />

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
            ) : (
              'Crear'
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
