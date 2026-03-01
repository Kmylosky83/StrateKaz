/**
 * Modal CRUD: Control de Exposición (Higiene Industrial - Sprint 9)
 * Connected to useCreateControlExposicion/useUpdateControlExposicion hooks
 */
import { useState, useEffect } from 'react';
import { Modal, Button, Spinner } from '@/components/common';
import { Input, Select, Textarea, Checkbox } from '@/components/forms';
import {
  useCreateControlExposicion,
  useUpdateControlExposicion,
  useAgentesRiesgo,
} from '../hooks/useHigieneIndustrial';
import type {
  ControlExposicionList,
  CreateControlExposicionDTO,
  JerarquiaControl,
  TipoControl,
  EstadoControl,
} from '../types/higiene-industrial.types';

interface ControlExposicionFormModalProps {
  item: ControlExposicionList | null;
  isOpen: boolean;
  onClose: () => void;
}

const INITIAL_FORM: CreateControlExposicionDTO = {
  codigo: '',
  nombre: '',
  descripcion: '',
  jerarquia_control: 'EPP',
  tipo_control: 'INDIVIDUO',
  agente_riesgo: 0,
  area_aplicacion: '',
  responsable_implementacion: '',
  estado: 'PLANIFICADO',
  observaciones: '',
};

export default function ControlExposicionFormModal({
  item,
  isOpen,
  onClose,
}: ControlExposicionFormModalProps) {
  const [formData, setFormData] = useState<CreateControlExposicionDTO>(INITIAL_FORM);
  const createMutation = useCreateControlExposicion();
  const updateMutation = useUpdateControlExposicion();
  const { data: agentesData } = useAgentesRiesgo();

  const agentes = agentesData?.results ?? [];

  const isLoading = createMutation.isPending || updateMutation.isPending;
  const isEditing = !!item;

  useEffect(() => {
    if (item) {
      setFormData({
        codigo: item.codigo,
        nombre: item.nombre,
        descripcion: '',
        jerarquia_control: item.jerarquia_control,
        tipo_control: item.tipo_control,
        agente_riesgo: 0,
        area_aplicacion: item.area_aplicacion,
        responsable_implementacion: '',
        estado: item.estado,
        observaciones: '',
      });
    } else {
      setFormData(INITIAL_FORM);
    }
  }, [item]);

  const handleChange = (field: keyof CreateControlExposicionDTO, value: any) => {
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
      console.error('Error al guardar control de exposición:', error);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Control de Exposición' : 'Nuevo Control de Exposición'}
      size="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Código"
            value={formData.codigo}
            onChange={(e) => handleChange('codigo', e.target.value)}
            placeholder="Se genera automáticamente"
          />

          <Input
            label="Nombre *"
            value={formData.nombre}
            onChange={(e) => handleChange('nombre', e.target.value)}
            required
            placeholder="Ej: Cabina de extracción"
          />

          <Select
            label="Jerarquía de Control *"
            value={formData.jerarquia_control}
            onChange={(e) => handleChange('jerarquia_control', e.target.value as JerarquiaControl)}
            required
          >
            <option value="ELIMINACION">Eliminación</option>
            <option value="SUSTITUCION">Sustitución</option>
            <option value="CONTROLES_INGENIERIA">Controles de Ingeniería</option>
            <option value="CONTROLES_ADMINISTRATIVOS">Controles Administrativos</option>
            <option value="EPP">EPP (Equipo de Protección Personal)</option>
          </Select>

          <Select
            label="Tipo de Control *"
            value={formData.tipo_control}
            onChange={(e) => handleChange('tipo_control', e.target.value as TipoControl)}
            required
          >
            <option value="FUENTE">En la Fuente</option>
            <option value="MEDIO">En el Medio</option>
            <option value="INDIVIDUO">En el Individuo</option>
          </Select>

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

          <Input
            label="Área de Aplicación"
            value={formData.area_aplicacion || ''}
            onChange={(e) => handleChange('area_aplicacion', e.target.value)}
            placeholder="Ej: Producción, Almacén"
          />

          <Input
            label="Fecha de Implementación"
            type="date"
            value={formData.fecha_implementacion || ''}
            onChange={(e) => handleChange('fecha_implementacion', e.target.value)}
          />

          <Input
            label="Responsable de Implementación"
            value={formData.responsable_implementacion || ''}
            onChange={(e) => handleChange('responsable_implementacion', e.target.value)}
            placeholder="Nombre del responsable"
          />

          <Input
            label="Efectividad Esperada (%)"
            type="number"
            min="0"
            max="100"
            value={formData.efectividad_esperada || ''}
            onChange={(e) => handleChange('efectividad_esperada', parseFloat(e.target.value))}
          />

          <div className="flex items-center">
            <Checkbox
              id="requiere_mantenimiento"
              label="Requiere Mantenimiento"
              checked={formData.requiere_mantenimiento || false}
              onChange={(e) => handleChange('requiere_mantenimiento', e.target.checked)}
            />
          </div>

          {formData.requiere_mantenimiento && (
            <Input
              label="Frecuencia de Mantenimiento"
              value={formData.frecuencia_mantenimiento || ''}
              onChange={(e) => handleChange('frecuencia_mantenimiento', e.target.value)}
              placeholder="Ej: Mensual, Trimestral"
            />
          )}

          <Input
            label="Costo de Implementación (COP)"
            type="number"
            min="0"
            value={formData.costo_implementacion || ''}
            onChange={(e) => handleChange('costo_implementacion', parseFloat(e.target.value))}
          />

          <Select
            label="Estado *"
            value={formData.estado || 'PLANIFICADO'}
            onChange={(e) => handleChange('estado', e.target.value as EstadoControl)}
            required
          >
            <option value="PLANIFICADO">Planificado</option>
            <option value="EN_IMPLEMENTACION">En Implementación</option>
            <option value="IMPLEMENTADO">Implementado</option>
            <option value="EN_MANTENIMIENTO">En Mantenimiento</option>
            <option value="SUSPENDIDO">Suspendido</option>
            <option value="RETIRADO">Retirado</option>
          </Select>
        </div>

        <Textarea
          label="Descripción *"
          value={formData.descripcion}
          onChange={(e) => handleChange('descripcion', e.target.value)}
          required
          rows={3}
          placeholder="Descripción detallada del control de exposición"
        />

        <Textarea
          label="Observaciones"
          value={formData.observaciones || ''}
          onChange={(e) => handleChange('observaciones', e.target.value)}
          rows={3}
          placeholder="Observaciones adicionales"
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
              <>{isEditing ? 'Actualizar' : 'Crear'} Control</>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
