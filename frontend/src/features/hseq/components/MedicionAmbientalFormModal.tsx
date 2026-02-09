/**
 * Modal CRUD: Medición Ambiental (Higiene Industrial - Sprint 9)
 * Connected to useCreateMedicionAmbiental/useUpdateMedicionAmbiental hooks
 */
import { useState, useEffect } from 'react';
import { Modal, Button, Spinner } from '@/components/common';
import { Input, Select, Textarea } from '@/components/forms';
import {
  useCreateMedicionAmbiental,
  useUpdateMedicionAmbiental,
  useAgentesRiesgo,
  usePuntosMedicion,
} from '../hooks/useHigieneIndustrial';
import type { MedicionAmbientalList, CreateMedicionAmbientalDTO, EstadoMedicion } from '../types/higiene-industrial.types';

interface MedicionAmbientalFormModalProps {
  item: MedicionAmbientalList | null;
  isOpen: boolean;
  onClose: () => void;
}

const INITIAL_FORM: CreateMedicionAmbientalDTO = {
  numero_medicion: '',
  agente_riesgo: 0,
  punto_medicion: 0,
  fecha_medicion: '',
  hora_inicio: '',
  valor_medido: 0,
  unidad_medida: '',
  equipo_utilizado: '',
  estado: 'PLANIFICADA',
  observaciones: '',
};

export default function MedicionAmbientalFormModal({ item, isOpen, onClose }: MedicionAmbientalFormModalProps) {
  const [formData, setFormData] = useState<CreateMedicionAmbientalDTO>(INITIAL_FORM);
  const createMutation = useCreateMedicionAmbiental();
  const updateMutation = useUpdateMedicionAmbiental();
  const { data: agentesData } = useAgentesRiesgo();
  const { data: puntosData } = usePuntosMedicion();

  const agentes = agentesData?.results ?? [];
  const puntos = puntosData?.results ?? [];

  const isLoading = createMutation.isPending || updateMutation.isPending;
  const isEditing = !!item;

  useEffect(() => {
    if (item) {
      setFormData({
        numero_medicion: item.numero_medicion,
        agente_riesgo: 0,
        punto_medicion: 0,
        fecha_medicion: item.fecha_medicion,
        hora_inicio: '',
        valor_medido: parseFloat(item.valor_medido) || 0,
        unidad_medida: item.unidad_medida,
        equipo_utilizado: '',
        estado: item.estado,
        observaciones: '',
      });
    } else {
      setFormData(INITIAL_FORM);
    }
  }, [item]);

  const handleChange = (field: keyof CreateMedicionAmbientalDTO, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (isEditing) {
        await updateMutation.mutateAsync({ id: item.id, datos: formData });
      } else {
        await createMutation.mutateAsync(formData);
      }
      onClose();
    } catch (error) {
      console.error('Error al guardar medición ambiental:', error);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Medición Ambiental' : 'Nueva Medición Ambiental'}
      size="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Número de Medición *"
            value={formData.numero_medicion}
            onChange={(e) => handleChange('numero_medicion', e.target.value)}
            required
            placeholder="Ej: MED-001-2024"
          />

          <Select
            label="Agente de Riesgo *"
            value={formData.agente_riesgo}
            onChange={(e) => handleChange('agente_riesgo', parseInt(e.target.value))}
            required
          >
            <option value={0}>Seleccionar agente</option>
            {agentes.map((agente) => (
              <option key={agente.id} value={agente.id}>
                {agente.codigo} - {agente.nombre}
              </option>
            ))}
          </Select>

          <Select
            label="Punto de Medición *"
            value={formData.punto_medicion}
            onChange={(e) => handleChange('punto_medicion', parseInt(e.target.value))}
            required
          >
            <option value={0}>Seleccionar punto</option>
            {puntos.map((punto) => (
              <option key={punto.id} value={punto.id}>
                {punto.codigo} - {punto.nombre}
              </option>
            ))}
          </Select>

          <Input
            label="Fecha de Medición *"
            type="date"
            value={formData.fecha_medicion}
            onChange={(e) => handleChange('fecha_medicion', e.target.value)}
            required
          />

          <Input
            label="Hora Inicio *"
            type="time"
            value={formData.hora_inicio}
            onChange={(e) => handleChange('hora_inicio', e.target.value)}
            required
          />

          <Input
            label="Hora Fin"
            type="time"
            value={formData.hora_fin || ''}
            onChange={(e) => handleChange('hora_fin', e.target.value)}
          />

          <Input
            label="Valor Medido *"
            type="number"
            step="0.01"
            value={formData.valor_medido}
            onChange={(e) => handleChange('valor_medido', parseFloat(e.target.value))}
            required
          />

          <Input
            label="Unidad de Medida *"
            value={formData.unidad_medida}
            onChange={(e) => handleChange('unidad_medida', e.target.value)}
            required
            placeholder="Ej: dB, mg/m³, lux"
          />

          <Input
            label="Límite Permisible Aplicable"
            type="number"
            step="0.01"
            value={formData.limite_permisible_aplicable || ''}
            onChange={(e) => handleChange('limite_permisible_aplicable', parseFloat(e.target.value))}
          />

          <Input
            label="Temperatura Ambiente (°C)"
            type="number"
            step="0.1"
            value={formData.temperatura_ambiente || ''}
            onChange={(e) => handleChange('temperatura_ambiente', parseFloat(e.target.value))}
          />

          <Input
            label="Humedad Relativa (%)"
            type="number"
            step="0.1"
            value={formData.humedad_relativa || ''}
            onChange={(e) => handleChange('humedad_relativa', parseFloat(e.target.value))}
          />

          <Input
            label="Equipo Utilizado"
            value={formData.equipo_utilizado || ''}
            onChange={(e) => handleChange('equipo_utilizado', e.target.value)}
            placeholder="Ej: Sonómetro"
          />

          <Input
            label="Número de Serie"
            value={formData.numero_serie || ''}
            onChange={(e) => handleChange('numero_serie', e.target.value)}
          />

          <Input
            label="Fecha de Calibración"
            type="date"
            value={formData.fecha_calibracion || ''}
            onChange={(e) => handleChange('fecha_calibracion', e.target.value)}
          />

          <Input
            label="Realizado Por"
            value={formData.realizado_por || ''}
            onChange={(e) => handleChange('realizado_por', e.target.value)}
            placeholder="Nombre del higienista"
          />

          <Select
            label="Estado *"
            value={formData.estado || 'PLANIFICADA'}
            onChange={(e) => handleChange('estado', e.target.value as EstadoMedicion)}
            required
          >
            <option value="PLANIFICADA">Planificada</option>
            <option value="EN_PROCESO">En Proceso</option>
            <option value="COMPLETADA">Completada</option>
            <option value="REVISADA">Revisada</option>
            <option value="APROBADA">Aprobada</option>
            <option value="CANCELADA">Cancelada</option>
          </Select>
        </div>

        <Textarea
          label="Observaciones"
          value={formData.observaciones || ''}
          onChange={(e) => handleChange('observaciones', e.target.value)}
          rows={3}
          placeholder="Observaciones adicionales sobre la medición"
        />

        <Textarea
          label="Recomendaciones"
          value={formData.recomendaciones || ''}
          onChange={(e) => handleChange('recomendaciones', e.target.value)}
          rows={3}
          placeholder="Recomendaciones derivadas de la medición"
        />

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Spinner className="mr-2" />
                Guardando...
              </>
            ) : (
              <>{isEditing ? 'Actualizar' : 'Crear'} Medición</>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
