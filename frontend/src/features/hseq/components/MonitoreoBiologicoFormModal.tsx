/**
 * Modal CRUD: Monitoreo Biológico (Higiene Industrial - Sprint 9)
 * Connected to useCreateMonitoreoBiologico/useUpdateMonitoreoBiologico hooks
 */
import { useState, useEffect } from 'react';
import { Modal, Button, Spinner } from '@/components/common';
import { Input, Select, Textarea } from '@/components/forms';
import {
  useCreateMonitoreoBiologico,
  useUpdateMonitoreoBiologico,
} from '../hooks/useHigieneIndustrial';
import type {
  MonitoreoBiologicoList,
  CreateMonitoreoBiologicoDTO,
  TipoExamen,
  ResultadoExamen,
} from '../types/higiene-industrial.types';

interface MonitoreoBiologicoFormModalProps {
  item: MonitoreoBiologicoList | null;
  isOpen: boolean;
  onClose: () => void;
}

const INITIAL_FORM: CreateMonitoreoBiologicoDTO = {
  numero_examen: '',
  trabajador_nombre: '',
  trabajador_identificacion: '',
  tipo_examen: 'PERIODICO',
  fecha_examen: '',
  examenes_realizados: '',
};

export default function MonitoreoBiologicoFormModal({ item, isOpen, onClose }: MonitoreoBiologicoFormModalProps) {
  const [formData, setFormData] = useState<CreateMonitoreoBiologicoDTO>(INITIAL_FORM);
  const createMutation = useCreateMonitoreoBiologico();
  const updateMutation = useUpdateMonitoreoBiologico();

  const isLoading = createMutation.isPending || updateMutation.isPending;
  const isEditing = !!item;

  useEffect(() => {
    if (item) {
      setFormData({
        numero_examen: item.numero_examen,
        trabajador_nombre: item.trabajador_nombre,
        trabajador_identificacion: item.trabajador_identificacion,
        trabajador_cargo: item.trabajador_cargo,
        tipo_examen: item.tipo_examen,
        fecha_examen: item.fecha_examen,
        examenes_realizados: '',
        resultado: item.resultado,
        requiere_seguimiento: item.requiere_seguimiento,
      });
    } else {
      setFormData(INITIAL_FORM);
    }
  }, [item]);

  const handleChange = (field: keyof CreateMonitoreoBiologicoDTO, value: any) => {
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
      console.error('Error al guardar examen de monitoreo biológico:', error);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Examen de Monitoreo Biológico' : 'Nuevo Examen de Monitoreo Biológico'}
      size="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Número de Examen *"
            value={formData.numero_examen}
            onChange={(e) => handleChange('numero_examen', e.target.value)}
            required
            placeholder="Ej: EMO-001-2024"
          />

          <Input
            label="Nombre del Trabajador *"
            value={formData.trabajador_nombre}
            onChange={(e) => handleChange('trabajador_nombre', e.target.value)}
            required
            placeholder="Nombre completo"
          />

          <Input
            label="Identificación *"
            value={formData.trabajador_identificacion}
            onChange={(e) => handleChange('trabajador_identificacion', e.target.value)}
            required
            placeholder="Cédula o documento"
          />

          <Input
            label="Cargo"
            value={formData.trabajador_cargo || ''}
            onChange={(e) => handleChange('trabajador_cargo', e.target.value)}
            placeholder="Cargo del trabajador"
          />

          <Select
            label="Tipo de Examen *"
            value={formData.tipo_examen}
            onChange={(e) => handleChange('tipo_examen', e.target.value as TipoExamen)}
            required
          >
            <option value="INGRESO">Ingreso</option>
            <option value="PERIODICO">Periódico</option>
            <option value="RETIRO">Retiro</option>
            <option value="POST_INCAPACIDAD">Post-Incapacidad</option>
            <option value="REUBICACION">Reubicación</option>
          </Select>

          <Input
            label="Fecha del Examen *"
            type="date"
            value={formData.fecha_examen}
            onChange={(e) => handleChange('fecha_examen', e.target.value)}
            required
          />

          <Input
            label="Indicador Biológico"
            value={formData.indicador_biologico || ''}
            onChange={(e) => handleChange('indicador_biologico', e.target.value)}
            placeholder="Ej: Plomo en sangre"
          />

          <Input
            label="Valor Medido"
            type="number"
            step="0.01"
            value={formData.valor_medido || ''}
            onChange={(e) => handleChange('valor_medido', parseFloat(e.target.value))}
          />

          <Input
            label="Unidad de Medida"
            value={formData.unidad_medida || ''}
            onChange={(e) => handleChange('unidad_medida', e.target.value)}
            placeholder="Ej: μg/dL, mg/L"
          />

          <Input
            label="Valor de Referencia"
            value={formData.valor_referencia || ''}
            onChange={(e) => handleChange('valor_referencia', e.target.value)}
            placeholder="Ej: < 10 μg/dL"
          />

          <Select
            label="Resultado"
            value={formData.resultado || 'PENDIENTE'}
            onChange={(e) => handleChange('resultado', e.target.value as ResultadoExamen)}
          >
            <option value="PENDIENTE">Pendiente</option>
            <option value="APTO">Apto</option>
            <option value="APTO_CON_RECOMENDACIONES">Apto con Recomendaciones</option>
            <option value="NO_APTO">No Apto</option>
          </Select>

          <Input
            label="Médico Responsable"
            value={formData.medico_responsable || ''}
            onChange={(e) => handleChange('medico_responsable', e.target.value)}
            placeholder="Nombre del médico"
          />

          <Input
            label="Licencia Médica"
            value={formData.licencia_medica || ''}
            onChange={(e) => handleChange('licencia_medica', e.target.value)}
            placeholder="Número de licencia"
          />

          <Input
            label="IPS / Entidad"
            value={formData.ips_entidad || ''}
            onChange={(e) => handleChange('ips_entidad', e.target.value)}
            placeholder="Nombre de la IPS"
          />

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="requiere_seguimiento"
              checked={formData.requiere_seguimiento || false}
              onChange={(e) => handleChange('requiere_seguimiento', e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <label htmlFor="requiere_seguimiento" className="text-sm text-gray-700 dark:text-gray-300">
              Requiere Seguimiento
            </label>
          </div>

          {formData.requiere_seguimiento && (
            <Input
              label="Fecha Próximo Examen"
              type="date"
              value={formData.fecha_proximo_examen || ''}
              onChange={(e) => handleChange('fecha_proximo_examen', e.target.value)}
            />
          )}
        </div>

        <Textarea
          label="Exámenes Realizados *"
          value={formData.examenes_realizados}
          onChange={(e) => handleChange('examenes_realizados', e.target.value)}
          required
          rows={3}
          placeholder="Ej: Hemograma, Audiometría, Espirometría"
        />

        <Textarea
          label="Hallazgos"
          value={formData.hallazgos || ''}
          onChange={(e) => handleChange('hallazgos', e.target.value)}
          rows={3}
          placeholder="Hallazgos relevantes del examen médico"
        />

        <Textarea
          label="Recomendaciones"
          value={formData.recomendaciones || ''}
          onChange={(e) => handleChange('recomendaciones', e.target.value)}
          rows={3}
          placeholder="Recomendaciones médicas"
        />

        <Textarea
          label="Restricciones"
          value={formData.restricciones || ''}
          onChange={(e) => handleChange('restricciones', e.target.value)}
          rows={2}
          placeholder="Restricciones laborales, si aplica"
        />

        <Textarea
          label="Observaciones"
          value={formData.observaciones || ''}
          onChange={(e) => handleChange('observaciones', e.target.value)}
          rows={2}
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
              <>{isEditing ? 'Actualizar' : 'Crear'} Examen</>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
