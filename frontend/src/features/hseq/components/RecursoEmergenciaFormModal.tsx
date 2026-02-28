import { useState, useEffect } from 'react';
import { Modal, Button, Spinner } from '@/components/common';
import { Input, Select, Textarea } from '@/components/forms';
import { useCreateRecursoEmergencia, useUpdateRecursoEmergencia } from '../hooks/useEmergencias';
import type { RecursoEmergencia } from '../types/emergencias.types';

interface RecursoEmergenciaFormModalProps {
  item: RecursoEmergencia | null;
  isOpen: boolean;
  onClose: () => void;
}

interface FormData {
  codigo: string;
  tipo_recurso: string;
  nombre: string;
  descripcion: string;
  marca: string;
  modelo: string;
  numero_serie: string;
  capacidad: string;
  edificio: string;
  piso: string;
  area: string;
  ubicacion_especifica: string;
  tipo_agente: string;
  fecha_adquisicion: string;
  fecha_vencimiento: string;
  frecuencia_inspeccion: string;
  fecha_proxima_inspeccion: string;
  responsable: string;
  tiene_señalizacion: boolean;
  observaciones: string;
}

const INITIAL_FORM: FormData = {
  codigo: '',
  tipo_recurso: 'EXTINTOR',
  nombre: '',
  descripcion: '',
  marca: '',
  modelo: '',
  numero_serie: '',
  capacidad: '',
  edificio: '',
  piso: '',
  area: '',
  ubicacion_especifica: '',
  tipo_agente: '',
  fecha_adquisicion: '',
  fecha_vencimiento: '',
  frecuencia_inspeccion: 'MENSUAL',
  fecha_proxima_inspeccion: '',
  responsable: '',
  tiene_señalizacion: true,
  observaciones: '',
};

const TIPO_RECURSO_OPTIONS = [
  { value: 'EXTINTOR', label: 'Extintor' },
  { value: 'BOTIQUIN', label: 'Botiquín' },
  { value: 'CAMILLA', label: 'Camilla' },
  { value: 'ALARMA', label: 'Alarma' },
  { value: 'SEÑALIZACION', label: 'Señalización' },
  { value: 'EQUIPO_COMUNICACION', label: 'Equipo de Comunicación' },
  { value: 'LINTERNA', label: 'Linterna' },
  { value: 'MEGAFONO', label: 'Megáfono' },
  { value: 'EQUIPO_RESCATE', label: 'Equipo de Rescate' },
  { value: 'DESFIBRILADOR', label: 'Desfibrilador' },
  { value: 'OTRO', label: 'Otro' },
];

const FRECUENCIA_OPTIONS = [
  { value: 'SEMANAL', label: 'Semanal' },
  { value: 'QUINCENAL', label: 'Quincenal' },
  { value: 'MENSUAL', label: 'Mensual' },
  { value: 'TRIMESTRAL', label: 'Trimestral' },
  { value: 'SEMESTRAL', label: 'Semestral' },
  { value: 'ANUAL', label: 'Anual' },
];

export default function RecursoEmergenciaFormModal({
  item,
  isOpen,
  onClose,
}: RecursoEmergenciaFormModalProps) {
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM);

  const createMutation = useCreateRecursoEmergencia();
  const updateMutation = useUpdateRecursoEmergencia();

  const isLoading = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (item) {
      setFormData({
        codigo: item.codigo ?? '',
        tipo_recurso: item.tipo_recurso ?? 'EXTINTOR',
        nombre: item.nombre ?? '',
        descripcion: item.descripcion ?? '',
        marca: item.marca ?? '',
        modelo: item.modelo ?? '',
        numero_serie: item.numero_serie ?? '',
        capacidad: item.capacidad ?? '',
        edificio: item.edificio ?? '',
        piso: item.piso ?? '',
        area: item.area ?? '',
        ubicacion_especifica: item.ubicacion_especifica ?? '',
        tipo_agente: item.tipo_agente ?? '',
        fecha_adquisicion: item.fecha_adquisicion ?? '',
        fecha_vencimiento: item.fecha_vencimiento ?? '',
        frecuencia_inspeccion: item.frecuencia_inspeccion ?? 'MENSUAL',
        fecha_proxima_inspeccion: item.fecha_proxima_inspeccion ?? '',
        responsable: item.responsable ?? '',
        tiene_señalizacion: item.tiene_señalizacion ?? true,
        observaciones: item.observaciones ?? '',
      });
    } else {
      setFormData(INITIAL_FORM);
    }
  }, [item, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: Record<string, unknown> = { ...formData };

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
      title={item ? 'Editar Recurso de Emergencia' : 'Nuevo Recurso de Emergencia'}
      size="large"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Fila 1: Código | Tipo | Nombre */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="Código"
            value={formData.codigo}
            onChange={(e) => handleChange('codigo', e.target.value)}
            placeholder="Auto-generado si vacío"
          />
          <Select
            label="Tipo de Recurso *"
            value={formData.tipo_recurso}
            onChange={(e) => handleChange('tipo_recurso', e.target.value)}
            required
          >
            {TIPO_RECURSO_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
          <Input
            label="Nombre *"
            value={formData.nombre}
            onChange={(e) => handleChange('nombre', e.target.value)}
            placeholder="Nombre del recurso..."
            required
          />
        </div>

        {/* Fila 2: Marca | Modelo | Serie */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="Marca"
            value={formData.marca}
            onChange={(e) => handleChange('marca', e.target.value)}
            placeholder="Marca del equipo..."
          />
          <Input
            label="Modelo"
            value={formData.modelo}
            onChange={(e) => handleChange('modelo', e.target.value)}
            placeholder="Modelo..."
          />
          <Input
            label="Número de Serie"
            value={formData.numero_serie}
            onChange={(e) => handleChange('numero_serie', e.target.value)}
            placeholder="Serie..."
          />
        </div>

        {/* Fila 3: Edificio | Piso | Área */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="Edificio"
            value={formData.edificio}
            onChange={(e) => handleChange('edificio', e.target.value)}
            placeholder="Edificio..."
          />
          <Input
            label="Piso"
            value={formData.piso}
            onChange={(e) => handleChange('piso', e.target.value)}
            placeholder="Piso..."
          />
          <Input
            label="Área *"
            value={formData.area}
            onChange={(e) => handleChange('area', e.target.value)}
            placeholder="Área de ubicación..."
            required
          />
        </div>

        {/* Fila 4: Ubicación Específica | Capacidad */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Ubicación Específica"
            value={formData.ubicacion_especifica}
            onChange={(e) => handleChange('ubicacion_especifica', e.target.value)}
            placeholder="Ej: Pasillo principal, junto a escalera"
          />
          <Input
            label="Capacidad"
            value={formData.capacidad}
            onChange={(e) => handleChange('capacidad', e.target.value)}
            placeholder="Ej: 10 lbs, 20 unidades"
          />
        </div>

        {/* Fila 5: Tipo agente | Responsable */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Tipo de Agente"
            value={formData.tipo_agente}
            onChange={(e) => handleChange('tipo_agente', e.target.value)}
            placeholder="Ej: Polvo químico seco, CO2"
          />
          <Input
            label="Responsable"
            value={formData.responsable}
            onChange={(e) => handleChange('responsable', e.target.value)}
            placeholder="Responsable del recurso..."
          />
        </div>

        {/* Fila 6: Fechas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="Fecha Adquisición"
            type="date"
            value={formData.fecha_adquisicion}
            onChange={(e) => handleChange('fecha_adquisicion', e.target.value)}
          />
          <Input
            label="Fecha Vencimiento"
            type="date"
            value={formData.fecha_vencimiento}
            onChange={(e) => handleChange('fecha_vencimiento', e.target.value)}
          />
          <Input
            label="Próxima Inspección"
            type="date"
            value={formData.fecha_proxima_inspeccion}
            onChange={(e) => handleChange('fecha_proxima_inspeccion', e.target.value)}
          />
        </div>

        {/* Fila 7: Frecuencia | Señalización */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Frecuencia de Inspección"
            value={formData.frecuencia_inspeccion}
            onChange={(e) => handleChange('frecuencia_inspeccion', e.target.value)}
          >
            {FRECUENCIA_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
          <Select
            label="¿Tiene Señalización?"
            value={formData.tiene_señalizacion ? 'true' : 'false'}
            onChange={(e) => handleChange('tiene_señalizacion', e.target.value === 'true')}
          >
            <option value="true">Sí</option>
            <option value="false">No</option>
          </Select>
        </div>

        {/* Fila 8: Descripción */}
        <Textarea
          label="Descripción"
          value={formData.descripcion}
          onChange={(e) => handleChange('descripcion', e.target.value)}
          placeholder="Descripción del recurso..."
          rows={2}
        />

        {/* Fila 9: Observaciones */}
        <Textarea
          label="Observaciones"
          value={formData.observaciones}
          onChange={(e) => handleChange('observaciones', e.target.value)}
          placeholder="Observaciones adicionales..."
          rows={2}
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
              <>{item ? 'Actualizar' : 'Crear'} Recurso</>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
