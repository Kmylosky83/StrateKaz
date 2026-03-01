import { useState, useEffect } from 'react';
import { Modal, Button, Spinner } from '@/components/common';
import { Input, Select, Textarea, Checkbox } from '@/components/forms';
import { useCreateTipoComite, useUpdateTipoComite } from '../hooks/useComites';
import type { TipoComiteList, CreateTipoComiteDTO } from '../types/comites.types';

interface TipoComiteFormModalProps {
  item: TipoComiteList | null;
  isOpen: boolean;
  onClose: () => void;
}

const INITIAL_FORM: CreateTipoComiteDTO = {
  codigo: '',
  nombre: '',
  descripcion: '',
  normativa_base: '',
  periodicidad_reuniones: 'MENSUAL',
  num_minimo_miembros: 2,
  num_maximo_miembros: undefined,
  requiere_eleccion: false,
  duracion_periodo_meses: 24,
  requiere_quorum: true,
  porcentaje_quorum: 50,
};

const PERIODICIDAD_OPTIONS = [
  { value: 'MENSUAL', label: 'Mensual' },
  { value: 'BIMESTRAL', label: 'Bimestral' },
  { value: 'TRIMESTRAL', label: 'Trimestral' },
  { value: 'SEMESTRAL', label: 'Semestral' },
  { value: 'ANUAL', label: 'Anual' },
  { value: 'PERSONALIZADO', label: 'Personalizado' },
];

export default function TipoComiteFormModal({ item, isOpen, onClose }: TipoComiteFormModalProps) {
  const [formData, setFormData] = useState<CreateTipoComiteDTO>(INITIAL_FORM);

  const createMutation = useCreateTipoComite();
  const updateMutation = useUpdateTipoComite();

  const isLoading = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (item) {
      setFormData({
        codigo: item.codigo || '',
        nombre: item.nombre || '',
        descripcion: item.descripcion || '',
        normativa_base: '',
        periodicidad_reuniones: item.periodicidad_reuniones || 'MENSUAL',
        num_minimo_miembros: item.num_minimo_miembros ?? 2,
        num_maximo_miembros: undefined,
        requiere_eleccion: item.requiere_eleccion ?? false,
        duracion_periodo_meses: 24,
        requiere_quorum: true,
        porcentaje_quorum: 50,
      });
    } else {
      setFormData(INITIAL_FORM);
    }
  }, [item, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...formData };

    if (!payload.num_maximo_miembros) delete payload.num_maximo_miembros;
    if (!payload.normativa_base) delete payload.normativa_base;

    if (item) {
      updateMutation.mutate({ id: item.id, datos: payload }, { onSuccess: onClose });
    } else {
      createMutation.mutate(payload, { onSuccess: onClose });
    }
  };

  const handleChange = (field: keyof CreateTipoComiteDTO, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={item ? 'Editar Tipo de Comité' : 'Nuevo Tipo de Comité'}
      size="large"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Fila 1: Código | Nombre */}
          <Input
            label="Código *"
            value={formData.codigo}
            onChange={(e) => handleChange('codigo', e.target.value)}
            placeholder="Ej: COPASST, COCOLA, CSV"
            required
          />

          <Input
            label="Nombre *"
            value={formData.nombre}
            onChange={(e) => handleChange('nombre', e.target.value)}
            placeholder="Nombre completo del tipo de comité"
            required
          />

          {/* Fila 2: Descripción (ancho completo) */}
          <div className="md:col-span-2">
            <Textarea
              label="Descripción"
              value={formData.descripcion}
              onChange={(e) => handleChange('descripcion', e.target.value)}
              placeholder="Describa el propósito y alcance de este tipo de comité..."
              rows={3}
            />
          </div>

          {/* Fila 3: Normativa Base (ancho completo) */}
          <div className="md:col-span-2">
            <Input
              label="Normativa Base"
              value={formData.normativa_base ?? ''}
              onChange={(e) => handleChange('normativa_base', e.target.value)}
              placeholder="Ej: Resolución 0312 de 2019, Decreto 1072 de 2015"
            />
          </div>

          {/* Fila 4: Periodicidad | Duración Periodo (meses) */}
          <Select
            label="Periodicidad de Reuniones *"
            value={formData.periodicidad_reuniones}
            onChange={(e) => handleChange('periodicidad_reuniones', e.target.value)}
            required
          >
            {PERIODICIDAD_OPTIONS.map((opcion) => (
              <option key={opcion.value} value={opcion.value}>
                {opcion.label}
              </option>
            ))}
          </Select>

          <Input
            label="Duración del Período (meses)"
            type="number"
            value={
              formData.duracion_periodo_meses !== undefined
                ? String(formData.duracion_periodo_meses)
                : ''
            }
            onChange={(e) =>
              handleChange(
                'duracion_periodo_meses',
                e.target.value !== '' ? parseInt(e.target.value) : undefined
              )
            }
            placeholder="24"
          />

          {/* Fila 5: Mín. Miembros | Máx. Miembros */}
          <Input
            label="Mín. Miembros *"
            type="number"
            value={
              formData.num_minimo_miembros !== undefined ? String(formData.num_minimo_miembros) : ''
            }
            onChange={(e) =>
              handleChange(
                'num_minimo_miembros',
                e.target.value !== '' ? parseInt(e.target.value) : undefined
              )
            }
            placeholder="2"
            required
          />

          <Input
            label="Máx. Miembros"
            type="number"
            value={
              formData.num_maximo_miembros !== undefined ? String(formData.num_maximo_miembros) : ''
            }
            onChange={(e) =>
              handleChange(
                'num_maximo_miembros',
                e.target.value !== '' ? parseInt(e.target.value) : undefined
              )
            }
            placeholder="Sin límite"
          />

          {/* Fila 6: Checkboxes */}
          <div className="flex items-center pt-2">
            <Checkbox
              id="requiere_eleccion"
              label="Requiere Elección de Miembros"
              checked={formData.requiere_eleccion ?? false}
              onChange={(e) => handleChange('requiere_eleccion', e.target.checked)}
            />
          </div>

          <div className="flex items-center pt-2">
            <Checkbox
              id="requiere_quorum"
              label="Requiere Quórum"
              checked={formData.requiere_quorum ?? false}
              onChange={(e) => handleChange('requiere_quorum', e.target.checked)}
            />
          </div>

          {/* Fila 7: Porcentaje de Quórum (condicional) */}
          {formData.requiere_quorum && (
            <div className="md:col-span-2">
              <Input
                label="Porcentaje de Quórum (%)"
                type="number"
                value={
                  formData.porcentaje_quorum !== undefined ? String(formData.porcentaje_quorum) : ''
                }
                onChange={(e) =>
                  handleChange(
                    'porcentaje_quorum',
                    e.target.value !== '' ? parseInt(e.target.value) : undefined
                  )
                }
                placeholder="50"
              />
            </div>
          )}
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
              <>{item ? 'Actualizar' : 'Crear'} Tipo de Comité</>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
