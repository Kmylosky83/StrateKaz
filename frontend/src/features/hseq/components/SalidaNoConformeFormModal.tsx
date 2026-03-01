import { useState, useEffect } from 'react';
import { Modal, Button, Spinner } from '@/components/common';
import { Input, Select, Textarea, Checkbox } from '@/components/forms';
import { useCreateSalidaNoConforme, useUpdateSalidaNoConforme } from '../hooks/useCalidad';
import type { SalidaNoConformeList, CreateSalidaNoConformeDTO } from '../types/calidad.types';
import {
  TIPO_SALIDA_NO_CONFORME_OPCIONES,
  NIVEL_RIESGO_USO_OPCIONES,
} from '../types/calidad.types';
import type { NivelRiesgoUso } from '../types/calidad.types';

interface SalidaNoConformeFormModalProps {
  item: SalidaNoConformeList | null;
  isOpen: boolean;
  onClose: () => void;
}

const INITIAL_FORM: CreateSalidaNoConformeDTO = {
  tipo: 'PRODUCTO',
  descripcion_producto: '',
  descripcion_no_conformidad: '',
  fecha_deteccion: '',
  lote_numero: '',
  cantidad_afectada: 0,
  unidad_medida: 'unidades',
  ubicacion_actual: '',
  requisito_incumplido: '',
  impacto_cliente: '',
  riesgo_uso: 'MEDIO' as NivelRiesgoUso,
  detectado_por: 0,
  bloqueada: true,
};

export default function SalidaNoConformeFormModal({
  item,
  isOpen,
  onClose,
}: SalidaNoConformeFormModalProps) {
  const [formData, setFormData] = useState<CreateSalidaNoConformeDTO>(INITIAL_FORM);

  const createMutation = useCreateSalidaNoConforme();
  const updateMutation = useUpdateSalidaNoConforme();

  const isLoading = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (item) {
      setFormData({
        tipo: item.tipo,
        descripcion_producto: item.descripcion_producto,
        descripcion_no_conformidad: '',
        fecha_deteccion: item.fecha_deteccion,
        lote_numero: '',
        cantidad_afectada: parseFloat(item.cantidad_afectada) || 0,
        unidad_medida: item.unidad_medida,
        ubicacion_actual: '',
        requisito_incumplido: '',
        impacto_cliente: '',
        riesgo_uso: 'MEDIO' as NivelRiesgoUso,
        detectado_por: 0,
        bloqueada: item.bloqueada,
      });
    } else {
      setFormData(INITIAL_FORM);
    }
  }, [item, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const payload = { ...formData };
    if (!payload.detectado_por) {
      delete (payload as Partial<CreateSalidaNoConformeDTO>).detectado_por;
    }

    if (item) {
      updateMutation.mutate({ id: item.id, datos: payload }, { onSuccess: onClose });
    } else {
      createMutation.mutate(payload, { onSuccess: onClose });
    }
  };

  const handleChange = (field: keyof CreateSalidaNoConformeDTO, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={item ? 'Editar Salida No Conforme' : 'Nueva Salida No Conforme'}
      size="large"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Fila 1: Tipo | Riesgo de Uso */}
          <Select
            label="Tipo *"
            value={formData.tipo}
            onChange={(e) => handleChange('tipo', e.target.value)}
            required
          >
            {TIPO_SALIDA_NO_CONFORME_OPCIONES.map((opcion) => (
              <option key={opcion.value} value={opcion.value}>
                {opcion.label}
              </option>
            ))}
          </Select>

          <Select
            label="Riesgo de Uso"
            value={formData.riesgo_uso ?? 'MEDIO'}
            onChange={(e) => handleChange('riesgo_uso', e.target.value as NivelRiesgoUso)}
          >
            {NIVEL_RIESGO_USO_OPCIONES.map((opcion) => (
              <option key={opcion.value} value={opcion.value}>
                {opcion.label}
              </option>
            ))}
          </Select>

          {/* Fila 2: Producto/Servicio (full) */}
          <div className="md:col-span-2">
            <Input
              label="Producto / Servicio *"
              value={formData.descripcion_producto}
              onChange={(e) => handleChange('descripcion_producto', e.target.value)}
              placeholder="Nombre o referencia del producto o servicio"
              required
            />
          </div>

          {/* Fila 3: Descripción de la No Conformidad (full) */}
          <div className="md:col-span-2">
            <Textarea
              label="Descripción de la No Conformidad *"
              value={formData.descripcion_no_conformidad}
              onChange={(e) => handleChange('descripcion_no_conformidad', e.target.value)}
              placeholder="Describa detalladamente la no conformidad detectada..."
              rows={3}
              required
            />
          </div>

          {/* Fila 4: Fecha Detección | Lote/Número */}
          <Input
            label="Fecha de Detección *"
            type="date"
            value={formData.fecha_deteccion}
            onChange={(e) => handleChange('fecha_deteccion', e.target.value)}
            required
          />

          <Input
            label="Lote / Número"
            value={formData.lote_numero ?? ''}
            onChange={(e) => handleChange('lote_numero', e.target.value)}
            placeholder="Ej: LOT-2024-001, Batch #5"
          />

          {/* Fila 5: Cantidad Afectada | Unidad de Medida */}
          <Input
            label="Cantidad Afectada *"
            type="number"
            value={formData.cantidad_afectada}
            onChange={(e) => handleChange('cantidad_afectada', parseFloat(e.target.value) || 0)}
            placeholder="0"
            required
          />

          <Input
            label="Unidad de Medida *"
            value={formData.unidad_medida}
            onChange={(e) => handleChange('unidad_medida', e.target.value)}
            placeholder="Ej: unidades, kg, litros, metros"
            required
          />

          {/* Fila 6: Ubicación Actual | Bloqueada */}
          <Input
            label="Ubicación Actual *"
            value={formData.ubicacion_actual}
            onChange={(e) => handleChange('ubicacion_actual', e.target.value)}
            placeholder="Ej: Almacén B, Línea de producción 3"
            required
          />

          <div className="mt-6">
            <Checkbox
              checked={formData.bloqueada ?? true}
              onChange={(e) => handleChange('bloqueada', e.target.checked)}
              label="Producto bloqueado / en cuarentena"
            />
          </div>

          {/* Fila 7: Requisito Incumplido (full) */}
          <div className="md:col-span-2">
            <Textarea
              label="Requisito Incumplido *"
              value={formData.requisito_incumplido}
              onChange={(e) => handleChange('requisito_incumplido', e.target.value)}
              placeholder="Especifique el requisito, norma o especificación que no se cumplió..."
              rows={2}
              required
            />
          </div>

          {/* Fila 8: Impacto al Cliente (full) */}
          <div className="md:col-span-2">
            <Textarea
              label="Impacto al Cliente"
              value={formData.impacto_cliente ?? ''}
              onChange={(e) => handleChange('impacto_cliente', e.target.value)}
              placeholder="Describa el impacto potencial o real sobre el cliente..."
              rows={2}
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
              <>{item ? 'Actualizar' : 'Crear'} Salida No Conforme</>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
