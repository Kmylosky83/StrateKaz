/**
 * Modal de creación: Registro de Residuo (Gestión Ambiental - HSEQ)
 * Solo soporta modo creación (sin update aún).
 */
import { useState, useEffect } from 'react';
import { Modal, Button, Spinner } from '@/components/common';
import { Input, Select, Textarea } from '@/components/forms';
import { useCreateResiduo, useTiposResiduos, useGestores } from '../hooks/useGestionAmbiental';
import type {
  CreateRegistroResiduoDTO,
  TipoMovimiento,
  UnidadMedida,
} from '../types/gestion-ambiental.types';

interface RegistroResiduoFormModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type FormState = Omit<CreateRegistroResiduoDTO, 'empresa_id'>;

const INITIAL_FORM: FormState = {
  fecha: '',
  tipo_residuo: 0,
  tipo_movimiento: 'GENERACION',
  cantidad: 0,
  unidad_medida: 'KG',
  area_generadora: '',
  gestor: undefined,
  tratamiento_aplicado: '',
  numero_manifiesto: '',
  observaciones: '',
  registrado_por: '',
};

const TIPO_MOVIMIENTO_OPTIONS = [
  { value: 'GENERACION', label: 'Generación' },
  { value: 'DISPOSICION', label: 'Disposición' },
  { value: 'TRANSFERENCIA', label: 'Transferencia' },
  { value: 'APROVECHAMIENTO', label: 'Aprovechamiento' },
];

const UNIDAD_MEDIDA_OPTIONS = [
  { value: 'KG', label: 'Kilogramos' },
  { value: 'TON', label: 'Toneladas' },
  { value: 'LT', label: 'Litros' },
  { value: 'M3', label: 'Metros cúbicos' },
  { value: 'UND', label: 'Unidades' },
];

export default function RegistroResiduoFormModal({
  isOpen,
  onClose,
}: RegistroResiduoFormModalProps) {
  const [formData, setFormData] = useState<FormState>(INITIAL_FORM);

  const createMutation = useCreateResiduo();
  const { data: tiposResiduosData } = useTiposResiduos();
  const { data: gestoresData } = useGestores();

  const tiposResiduos = tiposResiduosData?.results ?? [];
  const gestores = gestoresData?.results ?? [];

  const isLoading = createMutation.isPending;

  useEffect(() => {
    if (isOpen) {
      setFormData(INITIAL_FORM);
    }
  }, [isOpen]);

  const handleChange = (field: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const payload = { ...formData } as Partial<FormState>;

    if (!payload.tipo_residuo || payload.tipo_residuo === 0) delete payload.tipo_residuo;
    if (!payload.gestor || payload.gestor === 0) delete payload.gestor;
    if (!payload.tratamiento_aplicado) delete payload.tratamiento_aplicado;
    if (!payload.numero_manifiesto) delete payload.numero_manifiesto;
    if (!payload.observaciones) delete payload.observaciones;
    if (!payload.registrado_por) delete payload.registrado_por;
    if (!payload.area_generadora) delete payload.area_generadora;

    createMutation.mutate(payload as CreateRegistroResiduoDTO, { onSuccess: onClose });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nuevo Registro de Residuo" size="large">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Fila 1: Fecha | Tipo Residuo */}
          <Input
            label="Fecha *"
            type="date"
            value={formData.fecha}
            onChange={(e) => handleChange('fecha', e.target.value)}
            required
          />

          <Select
            label="Tipo de Residuo *"
            value={formData.tipo_residuo}
            onChange={(e) => handleChange('tipo_residuo', parseInt(e.target.value))}
            required
          >
            <option value={0}>Seleccionar tipo de residuo</option>
            {tiposResiduos.map((tr) => (
              <option key={tr.id} value={tr.id}>
                {tr.nombre}
              </option>
            ))}
          </Select>

          {/* Fila 2: Tipo Movimiento | Cantidad */}
          <Select
            label="Tipo de Movimiento *"
            value={formData.tipo_movimiento}
            onChange={(e) => handleChange('tipo_movimiento', e.target.value as TipoMovimiento)}
            required
          >
            {TIPO_MOVIMIENTO_OPTIONS.map((op) => (
              <option key={op.value} value={op.value}>
                {op.label}
              </option>
            ))}
          </Select>

          <Input
            label="Cantidad *"
            type="number"
            step="0.001"
            value={formData.cantidad}
            onChange={(e) => handleChange('cantidad', parseFloat(e.target.value) || 0)}
            required
          />

          {/* Fila 3: Unidad de Medida | Área Generadora */}
          <Select
            label="Unidad de Medida"
            value={formData.unidad_medida}
            onChange={(e) => handleChange('unidad_medida', e.target.value as UnidadMedida)}
          >
            {UNIDAD_MEDIDA_OPTIONS.map((op) => (
              <option key={op.value} value={op.value}>
                {op.label}
              </option>
            ))}
          </Select>

          <Input
            label="Área Generadora"
            value={formData.area_generadora || ''}
            onChange={(e) => handleChange('area_generadora', e.target.value)}
            placeholder="Ej: Producción, Mantenimiento, Almacén"
          />

          {/* Fila 4: Gestor Ambiental */}
          <div className="md:col-span-2">
            <Select
              label="Gestor Ambiental"
              value={formData.gestor ?? 0}
              onChange={(e) => handleChange('gestor', parseInt(e.target.value) || undefined)}
            >
              <option value={0}>Sin gestor asignado</option>
              {gestores.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.razon_social}
                </option>
              ))}
            </Select>
          </div>

          {/* Fila 5: Tratamiento Aplicado | Número Manifiesto */}
          <Input
            label="Tratamiento Aplicado"
            value={formData.tratamiento_aplicado || ''}
            onChange={(e) => handleChange('tratamiento_aplicado', e.target.value)}
            placeholder="Ej: Incineración, Reciclaje, Relleno sanitario"
          />

          <Input
            label="Número de Manifiesto"
            value={formData.numero_manifiesto || ''}
            onChange={(e) => handleChange('numero_manifiesto', e.target.value)}
            placeholder="Ej: MAN-2024-001"
          />

          {/* Fila 6: Registrado Por */}
          <Input
            label="Registrado Por"
            value={formData.registrado_por || ''}
            onChange={(e) => handleChange('registrado_por', e.target.value)}
            placeholder="Nombre de quien registra"
          />

          {/* Fila 6: Observaciones (col-span-2) */}
          <div className="md:col-span-2">
            <Textarea
              label="Observaciones"
              value={formData.observaciones || ''}
              onChange={(e) => handleChange('observaciones', e.target.value)}
              rows={3}
              placeholder="Observaciones adicionales sobre el registro de residuo..."
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
              'Crear'
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
