import { useState, useEffect } from 'react';
import { Modal, Button, Spinner } from '@/components/common';
import { Input, Textarea } from '@/components/forms';
import {
  useCreatePlanoEvacuacion,
  useUpdatePlanoEvacuacion,
  usePlanesEmergencia,
} from '../hooks/useEmergencias';
import { Select } from '@/components/forms';
import type { PlanoEvacuacion } from '../types/emergencias.types';

interface PlanoEvacuacionFormModalProps {
  item: PlanoEvacuacion | null;
  isOpen: boolean;
  onClose: () => void;
}

interface FormData {
  plan_emergencia: number;
  codigo: string;
  nombre: string;
  version: string;
  edificio: string;
  piso: string;
  area: string;
  descripcion: string;
  capacidad_personas: number;
  numero_rutas: number;
  punto_encuentro_principal: string;
  punto_encuentro_alterno: string;
  salidas_emergencia: number;
  extintores: number;
  alarmas: number;
  botiquines: number;
  archivo_plano: string;
  fecha_elaboracion: string;
  fecha_revision_programada: string;
}

const INITIAL_FORM: FormData = {
  plan_emergencia: 0,
  codigo: '',
  nombre: '',
  version: '1.0',
  edificio: '',
  piso: '',
  area: '',
  descripcion: '',
  capacidad_personas: 0,
  numero_rutas: 0,
  punto_encuentro_principal: '',
  punto_encuentro_alterno: '',
  salidas_emergencia: 0,
  extintores: 0,
  alarmas: 0,
  botiquines: 0,
  archivo_plano: '',
  fecha_elaboracion: '',
  fecha_revision_programada: '',
};

export default function PlanoEvacuacionFormModal({
  item,
  isOpen,
  onClose,
}: PlanoEvacuacionFormModalProps) {
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM);

  const createMutation = useCreatePlanoEvacuacion();
  const updateMutation = useUpdatePlanoEvacuacion();
  const { data: planesData } = usePlanesEmergencia();

  const isLoading = createMutation.isPending || updateMutation.isPending;
  const planes = Array.isArray(planesData)
    ? planesData
    : ((planesData as unknown as { results?: { id: number; codigo: string; nombre: string }[] })
        ?.results ?? []);

  useEffect(() => {
    if (item) {
      setFormData({
        plan_emergencia: item.plan_emergencia,
        codigo: item.codigo ?? '',
        nombre: item.nombre ?? '',
        version: item.version ?? '1.0',
        edificio: item.edificio ?? '',
        piso: item.piso ?? '',
        area: item.area ?? '',
        descripcion: item.descripcion ?? '',
        capacidad_personas: item.capacidad_personas ?? 0,
        numero_rutas: item.numero_rutas ?? 0,
        punto_encuentro_principal: item.punto_encuentro_principal ?? '',
        punto_encuentro_alterno: item.punto_encuentro_alterno ?? '',
        salidas_emergencia: item.salidas_emergencia ?? 0,
        extintores: item.extintores ?? 0,
        alarmas: item.alarmas ?? 0,
        botiquines: item.botiquines ?? 0,
        archivo_plano: item.archivo_plano ?? '',
        fecha_elaboracion: item.fecha_elaboracion ?? '',
        fecha_revision_programada: item.fecha_revision_programada ?? '',
      });
    } else {
      setFormData(INITIAL_FORM);
    }
  }, [item, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: Record<string, unknown> = { ...formData };
    if (!payload.plan_emergencia) delete payload.plan_emergencia;

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
      title={item ? 'Editar Plano de Evacuación' : 'Nuevo Plano de Evacuación'}
      size="large"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Fila 1: Plan | Código | Nombre */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Select
            label="Plan de Emergencia *"
            value={formData.plan_emergencia}
            onChange={(e) => handleChange('plan_emergencia', parseInt(e.target.value))}
            required
          >
            <option value={0}>Seleccionar plan...</option>
            {(planes as Array<{ id: number; codigo: string; nombre: string }>).map((plan) => (
              <option key={plan.id} value={plan.id}>
                {plan.codigo} - {plan.nombre}
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
            placeholder="Nombre del plano..."
            required
          />
        </div>

        {/* Fila 2: Edificio | Piso | Área */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="Edificio *"
            value={formData.edificio}
            onChange={(e) => handleChange('edificio', e.target.value)}
            placeholder="Ej: Edificio Principal"
            required
          />
          <Input
            label="Piso *"
            value={formData.piso}
            onChange={(e) => handleChange('piso', e.target.value)}
            placeholder="Ej: 1, 2, Sótano"
            required
          />
          <Input
            label="Área"
            value={formData.area}
            onChange={(e) => handleChange('area', e.target.value)}
            placeholder="Área específica..."
          />
        </div>

        {/* Fila 3: Capacidad | Rutas | Salidas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="Capacidad (personas)"
            type="number"
            value={formData.capacidad_personas}
            onChange={(e) => handleChange('capacidad_personas', parseInt(e.target.value) || 0)}
          />
          <Input
            label="Número de Rutas"
            type="number"
            value={formData.numero_rutas}
            onChange={(e) => handleChange('numero_rutas', parseInt(e.target.value) || 0)}
          />
          <Input
            label="Salidas de Emergencia"
            type="number"
            value={formData.salidas_emergencia}
            onChange={(e) => handleChange('salidas_emergencia', parseInt(e.target.value) || 0)}
          />
        </div>

        {/* Fila 4: Recursos */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="Extintores"
            type="number"
            value={formData.extintores}
            onChange={(e) => handleChange('extintores', parseInt(e.target.value) || 0)}
          />
          <Input
            label="Alarmas"
            type="number"
            value={formData.alarmas}
            onChange={(e) => handleChange('alarmas', parseInt(e.target.value) || 0)}
          />
          <Input
            label="Botiquines"
            type="number"
            value={formData.botiquines}
            onChange={(e) => handleChange('botiquines', parseInt(e.target.value) || 0)}
          />
        </div>

        {/* Fila 5: Puntos de encuentro */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Punto de Encuentro Principal"
            value={formData.punto_encuentro_principal}
            onChange={(e) => handleChange('punto_encuentro_principal', e.target.value)}
            placeholder="Ej: Parqueadero norte"
          />
          <Input
            label="Punto de Encuentro Alterno"
            value={formData.punto_encuentro_alterno}
            onChange={(e) => handleChange('punto_encuentro_alterno', e.target.value)}
            placeholder="Ej: Parque municipal"
          />
        </div>

        {/* Fila 6: Fechas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Fecha Elaboración *"
            type="date"
            value={formData.fecha_elaboracion}
            onChange={(e) => handleChange('fecha_elaboracion', e.target.value)}
            required
          />
          <Input
            label="Próxima Revisión"
            type="date"
            value={formData.fecha_revision_programada}
            onChange={(e) => handleChange('fecha_revision_programada', e.target.value)}
          />
        </div>

        {/* Fila 7: Descripción */}
        <Textarea
          label="Descripción"
          value={formData.descripcion}
          onChange={(e) => handleChange('descripcion', e.target.value)}
          placeholder="Descripción del plano de evacuación..."
          rows={2}
        />

        {/* Fila 8: Archivo plano (URL) */}
        <Input
          label="Archivo del Plano (URL) *"
          value={formData.archivo_plano}
          onChange={(e) => handleChange('archivo_plano', e.target.value)}
          placeholder="URL del archivo del plano..."
          required
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
              <>{item ? 'Actualizar' : 'Crear'} Plano</>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
