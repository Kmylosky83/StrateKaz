import { useState, useEffect } from 'react';
import { Modal, Button, Spinner } from '@/components/common';
import { Input, Select, Textarea } from '@/components/forms';
import { useCreateBrigada, useUpdateBrigada, useTiposBrigada } from '../hooks/useEmergencias';
import type { Brigada } from '../types/emergencias.types';

interface BrigadaFormModalProps {
  item: Brigada | null;
  isOpen: boolean;
  onClose: () => void;
}

interface FormData {
  tipo_brigada: number;
  codigo: string;
  nombre: string;
  descripcion: string;
  sede: string;
  area_cobertura: string;
  lider_brigada: string;
  lider_contacto: string;
  numero_minimo_brigadistas: number;
  equipamiento_asignado: string;
  ubicacion_equipamiento: string;
  fecha_conformacion: string;
  fecha_proxima_capacitacion: string;
}

const INITIAL_FORM: FormData = {
  tipo_brigada: 0,
  codigo: '',
  nombre: '',
  descripcion: '',
  sede: '',
  area_cobertura: '',
  lider_brigada: '',
  lider_contacto: '',
  numero_minimo_brigadistas: 5,
  equipamiento_asignado: '',
  ubicacion_equipamiento: '',
  fecha_conformacion: '',
  fecha_proxima_capacitacion: '',
};

export default function BrigadaFormModal({ item, isOpen, onClose }: BrigadaFormModalProps) {
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM);

  const createMutation = useCreateBrigada();
  const updateMutation = useUpdateBrigada();
  const { data: tiposData } = useTiposBrigada();

  const isLoading = createMutation.isPending || updateMutation.isPending;
  const tipos = Array.isArray(tiposData)
    ? tiposData
    : ((tiposData as unknown as { results?: { id: number; codigo: string; nombre: string }[] })
        ?.results ?? []);

  useEffect(() => {
    if (item) {
      setFormData({
        tipo_brigada: item.tipo_brigada,
        codigo: item.codigo ?? '',
        nombre: item.nombre ?? '',
        descripcion: item.descripcion ?? '',
        sede: item.sede ?? '',
        area_cobertura: item.area_cobertura ?? '',
        lider_brigada: item.lider_brigada ?? '',
        lider_contacto: item.lider_contacto ?? '',
        numero_minimo_brigadistas: item.numero_minimo_brigadistas ?? 5,
        equipamiento_asignado: item.equipamiento_asignado ?? '',
        ubicacion_equipamiento: item.ubicacion_equipamiento ?? '',
        fecha_conformacion: item.fecha_conformacion ?? '',
        fecha_proxima_capacitacion: item.fecha_proxima_capacitacion ?? '',
      });
    } else {
      setFormData(INITIAL_FORM);
    }
  }, [item, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: Record<string, unknown> = { ...formData };
    if (!payload.tipo_brigada) delete payload.tipo_brigada;

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
      title={item ? 'Editar Brigada' : 'Nueva Brigada'}
      size="large"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Fila 1: Tipo Brigada | Código | Nombre */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Select
            label="Tipo de Brigada *"
            value={formData.tipo_brigada}
            onChange={(e) => handleChange('tipo_brigada', parseInt(e.target.value))}
            required
          >
            <option value={0}>Seleccionar tipo...</option>
            {(tipos as Array<{ id: number; codigo: string; nombre: string }>).map((tipo) => (
              <option key={tipo.id} value={tipo.id}>
                {tipo.nombre}
              </option>
            ))}
          </Select>
          <Input
            label="Código"
            value={formData.codigo}
            onChange={(e) => handleChange('codigo', e.target.value)}
            placeholder="Auto-generado si vacío"
          />
          <Input
            label="Nombre *"
            value={formData.nombre}
            onChange={(e) => handleChange('nombre', e.target.value)}
            placeholder="Nombre de la brigada..."
            required
          />
        </div>

        {/* Fila 2: Líder | Contacto líder */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Líder de Brigada *"
            value={formData.lider_brigada}
            onChange={(e) => handleChange('lider_brigada', e.target.value)}
            placeholder="Nombre del líder..."
            required
          />
          <Input
            label="Contacto del Líder"
            value={formData.lider_contacto}
            onChange={(e) => handleChange('lider_contacto', e.target.value)}
            placeholder="Teléfono o extensión..."
          />
        </div>

        {/* Fila 3: Sede | Área Cobertura | Mín. Brigadistas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="Sede"
            value={formData.sede}
            onChange={(e) => handleChange('sede', e.target.value)}
            placeholder="Sede de la brigada..."
          />
          <Input
            label="Área de Cobertura"
            value={formData.area_cobertura}
            onChange={(e) => handleChange('area_cobertura', e.target.value)}
            placeholder="Áreas cubiertas..."
          />
          <Input
            label="Mín. Brigadistas"
            type="number"
            value={formData.numero_minimo_brigadistas}
            onChange={(e) =>
              handleChange('numero_minimo_brigadistas', parseInt(e.target.value) || 5)
            }
          />
        </div>

        {/* Fila 4: Fechas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Fecha Conformación *"
            type="date"
            value={formData.fecha_conformacion}
            onChange={(e) => handleChange('fecha_conformacion', e.target.value)}
            required
          />
          <Input
            label="Próxima Capacitación"
            type="date"
            value={formData.fecha_proxima_capacitacion}
            onChange={(e) => handleChange('fecha_proxima_capacitacion', e.target.value)}
          />
        </div>

        {/* Fila 5: Descripción */}
        <Textarea
          label="Descripción"
          value={formData.descripcion}
          onChange={(e) => handleChange('descripcion', e.target.value)}
          placeholder="Descripción y objetivos de la brigada..."
          rows={2}
        />

        {/* Fila 6: Equipamiento */}
        <Textarea
          label="Equipamiento Asignado"
          value={formData.equipamiento_asignado}
          onChange={(e) => handleChange('equipamiento_asignado', e.target.value)}
          placeholder="Equipos y materiales asignados..."
          rows={2}
        />

        {/* Fila 7: Ubicación equipamiento */}
        <Input
          label="Ubicación del Equipamiento"
          value={formData.ubicacion_equipamiento}
          onChange={(e) => handleChange('ubicacion_equipamiento', e.target.value)}
          placeholder="Dónde se almacena el equipamiento..."
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
              <>{item ? 'Actualizar' : 'Crear'} Brigada</>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
