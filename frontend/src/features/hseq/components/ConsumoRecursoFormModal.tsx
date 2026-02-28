/**
 * Modal de creación: Registro de Consumo de Recursos (Gestión Ambiental - HSEQ)
 * Solo soporta modo creación (sin update aún).
 */
import { useState, useEffect } from 'react';
import { Modal, Button, Spinner } from '@/components/common';
import { Input, Select, Textarea } from '@/components/forms';
import { useCreateConsumo, useTiposRecursos } from '../hooks/useGestionAmbiental';
import type { CreateConsumoRecursoDTO } from '../types/gestion-ambiental.types';

interface ConsumoRecursoFormModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type FormState = Omit<CreateConsumoRecursoDTO, 'empresa_id'>;

const INITIAL_FORM: FormState = {
  periodo_year: new Date().getFullYear(),
  periodo_month: new Date().getMonth() + 1,
  tipo_recurso: 0,
  cantidad_consumida: 0,
  fuente_suministro: '',
  area_consumidora: '',
  costo_total: undefined,
  lectura_inicial: undefined,
  lectura_final: undefined,
  numero_factura: '',
  observaciones: '',
};

const MES_OPTIONS = [
  { value: 1, label: 'Enero' },
  { value: 2, label: 'Febrero' },
  { value: 3, label: 'Marzo' },
  { value: 4, label: 'Abril' },
  { value: 5, label: 'Mayo' },
  { value: 6, label: 'Junio' },
  { value: 7, label: 'Julio' },
  { value: 8, label: 'Agosto' },
  { value: 9, label: 'Septiembre' },
  { value: 10, label: 'Octubre' },
  { value: 11, label: 'Noviembre' },
  { value: 12, label: 'Diciembre' },
];

export default function ConsumoRecursoFormModal({ isOpen, onClose }: ConsumoRecursoFormModalProps) {
  const [formData, setFormData] = useState<FormState>(INITIAL_FORM);

  const createMutation = useCreateConsumo();
  const { data: tiposRecursosData } = useTiposRecursos();

  const tiposRecursos = tiposRecursosData?.results ?? [];

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

    // Limpiar FK si es 0
    if (!payload.tipo_recurso || payload.tipo_recurso === 0) delete payload.tipo_recurso;

    // Limpiar numéricos opcionales
    if (payload.costo_total === undefined) delete payload.costo_total;
    if (payload.lectura_inicial === undefined) delete payload.lectura_inicial;
    if (payload.lectura_final === undefined) delete payload.lectura_final;

    // Limpiar cadenas opcionales vacías
    if (!payload.fuente_suministro) delete payload.fuente_suministro;
    if (!payload.area_consumidora) delete payload.area_consumidora;
    if (!payload.numero_factura) delete payload.numero_factura;
    if (!payload.observaciones) delete payload.observaciones;

    createMutation.mutate(payload as CreateConsumoRecursoDTO, { onSuccess: onClose });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nuevo Registro de Consumo" size="large">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Fila 1: Año | Mes */}
          <Input
            label="Año *"
            type="number"
            value={formData.periodo_year}
            onChange={(e) =>
              handleChange('periodo_year', parseInt(e.target.value) || new Date().getFullYear())
            }
            required
            placeholder={String(new Date().getFullYear())}
          />

          <Select
            label="Mes *"
            value={formData.periodo_month}
            onChange={(e) => handleChange('periodo_month', parseInt(e.target.value))}
            required
          >
            {MES_OPTIONS.map((op) => (
              <option key={op.value} value={op.value}>
                {op.label}
              </option>
            ))}
          </Select>

          {/* Fila 2: Tipo de Recurso | Cantidad Consumida */}
          <Select
            label="Tipo de Recurso *"
            value={formData.tipo_recurso}
            onChange={(e) => handleChange('tipo_recurso', parseInt(e.target.value))}
            required
          >
            <option value={0}>Seleccionar tipo de recurso</option>
            {tiposRecursos.map((r) => (
              <option key={r.id} value={r.id}>
                {r.nombre} ({r.unidad_medida})
              </option>
            ))}
          </Select>

          <Input
            label="Cantidad Consumida *"
            type="number"
            step="0.001"
            value={formData.cantidad_consumida}
            onChange={(e) => handleChange('cantidad_consumida', parseFloat(e.target.value) || 0)}
            required
            placeholder="0.000"
          />

          {/* Fila 3: Fuente de Suministro | Área Consumidora */}
          <Input
            label="Fuente de Suministro"
            value={formData.fuente_suministro || ''}
            onChange={(e) => handleChange('fuente_suministro', e.target.value)}
            placeholder="Ej: Red pública, Pozo propio, Carro tanque"
          />

          <Input
            label="Área Consumidora"
            value={formData.area_consumidora || ''}
            onChange={(e) => handleChange('area_consumidora', e.target.value)}
            placeholder="Ej: Producción, Oficinas, Planta de tratamiento"
          />

          {/* Fila 4: Costo Total | Número Factura */}
          <Input
            label="Costo Total ($)"
            type="number"
            step="0.01"
            value={formData.costo_total !== undefined ? String(formData.costo_total) : ''}
            onChange={(e) =>
              handleChange(
                'costo_total',
                e.target.value !== '' ? parseFloat(e.target.value) || undefined : undefined
              )
            }
            placeholder="0.00"
          />

          <Input
            label="Número de Factura"
            value={formData.numero_factura || ''}
            onChange={(e) => handleChange('numero_factura', e.target.value)}
            placeholder="Ej: FAC-2024-001234"
          />

          {/* Fila 5: Lectura Inicial | Lectura Final */}
          <Input
            label="Lectura Inicial"
            type="number"
            step="0.001"
            value={formData.lectura_inicial !== undefined ? String(formData.lectura_inicial) : ''}
            onChange={(e) =>
              handleChange(
                'lectura_inicial',
                e.target.value !== '' ? parseFloat(e.target.value) || undefined : undefined
              )
            }
            placeholder="Lectura del medidor al inicio del período"
          />

          <Input
            label="Lectura Final"
            type="number"
            step="0.001"
            value={formData.lectura_final !== undefined ? String(formData.lectura_final) : ''}
            onChange={(e) =>
              handleChange(
                'lectura_final',
                e.target.value !== '' ? parseFloat(e.target.value) || undefined : undefined
              )
            }
            placeholder="Lectura del medidor al final del período"
          />

          {/* Fila 6: Observaciones (col-span-2) */}
          <div className="md:col-span-2">
            <Textarea
              label="Observaciones"
              value={formData.observaciones || ''}
              onChange={(e) => handleChange('observaciones', e.target.value)}
              rows={3}
              placeholder="Observaciones adicionales sobre el consumo registrado..."
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
