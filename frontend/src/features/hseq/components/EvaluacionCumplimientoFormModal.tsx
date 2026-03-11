import { useState, useEffect } from 'react';
import { Modal, Button, Spinner } from '@/components/common';
import { Input, Select, Textarea } from '@/components/forms';
import { useSelectUsers } from '@/hooks/useSelectLists';
import {
  useCreateEvaluacionCumplimiento,
  useUpdateEvaluacionCumplimiento,
} from '../hooks/useMejoraContinua';
import type {
  EvaluacionCumplimientoList,
  CreateEvaluacionCumplimientoDTO,
} from '../types/mejora-continua.types';

interface EvaluacionCumplimientoFormModalProps {
  item: EvaluacionCumplimientoList | null;
  isOpen: boolean;
  onClose: () => void;
}

const INITIAL_FORM: CreateEvaluacionCumplimientoDTO = {
  codigo: '',
  tipo: 'LEGAL',
  nombre: '',
  descripcion: '',
  resultado: 'EN_PROCESO',
  porcentaje_cumplimiento: 0,
  evidencia_cumplimiento: '',
  brechas_identificadas: '',
  acciones_requeridas: '',
  evaluador: 0,
  periodicidad: 'SEMESTRAL',
  fecha_evaluacion: '',
  observaciones: '',
};

const TIPO_OPTIONS = [
  { value: 'LEGAL', label: 'Legal' },
  { value: 'REGLAMENTARIO', label: 'Reglamentario' },
  { value: 'CONTRACTUAL', label: 'Contractual' },
  { value: 'NORMATIVO', label: 'Normativo' },
  { value: 'CLIENTE', label: 'Requisito de Cliente' },
  { value: 'VOLUNTARIO', label: 'Voluntario' },
];

const RESULTADO_OPTIONS = [
  { value: 'CUMPLE', label: 'Cumple' },
  { value: 'CUMPLE_PARCIAL', label: 'Cumple Parcialmente' },
  { value: 'NO_CUMPLE', label: 'No Cumple' },
  { value: 'NO_APLICA', label: 'No Aplica' },
  { value: 'EN_PROCESO', label: 'En Proceso' },
];

const PERIODICIDAD_OPTIONS = [
  { value: 'MENSUAL', label: 'Mensual' },
  { value: 'BIMESTRAL', label: 'Bimestral' },
  { value: 'TRIMESTRAL', label: 'Trimestral' },
  { value: 'SEMESTRAL', label: 'Semestral' },
  { value: 'ANUAL', label: 'Anual' },
];

export default function EvaluacionCumplimientoFormModal({
  item,
  isOpen,
  onClose,
}: EvaluacionCumplimientoFormModalProps) {
  const [formData, setFormData] = useState<CreateEvaluacionCumplimientoDTO>(INITIAL_FORM);

  const createMutation = useCreateEvaluacionCumplimiento();
  const updateMutation = useUpdateEvaluacionCumplimiento();
  const { data: usuarios = [] } = useSelectUsers();

  const isLoading = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (item) {
      setFormData({
        codigo: item.codigo,
        tipo: item.tipo,
        nombre: item.nombre,
        descripcion: item.descripcion || '',
        resultado: item.resultado,
        porcentaje_cumplimiento: item.porcentaje_cumplimiento || 0,
        evidencia_cumplimiento: item.evidencia_cumplimiento ?? '',
        brechas_identificadas: item.brechas_identificadas ?? '',
        acciones_requeridas: item.acciones_requeridas ?? '',
        evaluador: item.evaluador ?? 0,
        responsable_cumplimiento: item.responsable_cumplimiento ?? undefined,
        periodicidad: item.periodicidad,
        fecha_evaluacion: item.fecha_evaluacion,
        observaciones: item.observaciones ?? '',
      });
    } else {
      setFormData(INITIAL_FORM);
    }
  }, [item, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (item) {
      updateMutation.mutate({ id: item.id, datos: formData }, { onSuccess: onClose });
    } else {
      createMutation.mutate(formData, { onSuccess: onClose });
    }
  };

  const handleChange = (field: keyof CreateEvaluacionCumplimientoDTO, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={item ? 'Editar Evaluación de Cumplimiento' : 'Nueva Evaluación de Cumplimiento'}
      size="large"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Código"
            value={formData.codigo}
            onChange={(e) => handleChange('codigo', e.target.value)}
            placeholder="Se genera automáticamente"
          />

          <Select
            label="Tipo *"
            value={formData.tipo}
            onChange={(e) => handleChange('tipo', e.target.value)}
            required
          >
            {TIPO_OPTIONS.map((tipo) => (
              <option key={tipo.value} value={tipo.value}>
                {tipo.label}
              </option>
            ))}
          </Select>

          <div className="md:col-span-2">
            <Input
              label="Nombre *"
              value={formData.nombre}
              onChange={(e) => handleChange('nombre', e.target.value)}
              placeholder="Ej: Evaluación cumplimiento Decreto 1072/2015"
              required
            />
          </div>

          <div className="md:col-span-2">
            <Textarea
              label="Descripción"
              value={formData.descripcion}
              onChange={(e) => handleChange('descripcion', e.target.value)}
              placeholder="Descripción del requisito evaluado..."
              rows={2}
            />
          </div>

          <Select
            label="Resultado *"
            value={formData.resultado}
            onChange={(e) => handleChange('resultado', e.target.value)}
            required
          >
            {RESULTADO_OPTIONS.map((resultado) => (
              <option key={resultado.value} value={resultado.value}>
                {resultado.label}
              </option>
            ))}
          </Select>

          <Input
            label="Porcentaje de Cumplimiento (%)"
            type="number"
            value={formData.porcentaje_cumplimiento}
            onChange={(e) => handleChange('porcentaje_cumplimiento', parseFloat(e.target.value))}
            min={0}
            max={100}
            step={0.1}
          />

          <div className="md:col-span-2">
            <Textarea
              label="Evidencia de Cumplimiento"
              value={formData.evidencia_cumplimiento}
              onChange={(e) => handleChange('evidencia_cumplimiento', e.target.value)}
              placeholder="Documentos, registros, procedimientos que evidencian el cumplimiento..."
              rows={2}
            />
          </div>

          <div className="md:col-span-2">
            <Textarea
              label="Brechas Identificadas"
              value={formData.brechas_identificadas}
              onChange={(e) => handleChange('brechas_identificadas', e.target.value)}
              placeholder="Gaps o incumplimientos detectados..."
              rows={2}
            />
          </div>

          <div className="md:col-span-2">
            <Textarea
              label="Acciones Requeridas"
              value={formData.acciones_requeridas}
              onChange={(e) => handleChange('acciones_requeridas', e.target.value)}
              placeholder="Acciones necesarias para cerrar brechas..."
              rows={2}
            />
          </div>

          <Select
            label="Evaluador *"
            value={formData.evaluador}
            onChange={(e) => handleChange('evaluador', parseInt(e.target.value))}
            required
          >
            <option value={0}>Seleccionar evaluador...</option>
            {usuarios.map((u) => (
              <option key={u.id} value={u.id}>
                {u.label}
              </option>
            ))}
          </Select>

          <Select
            label="Responsable del Cumplimiento"
            value={formData.responsable_cumplimiento ?? 0}
            onChange={(e) => {
              const val = parseInt(e.target.value);
              handleChange('responsable_cumplimiento', val || undefined);
            }}
          >
            <option value={0}>Seleccionar responsable...</option>
            {usuarios.map((u) => (
              <option key={u.id} value={u.id}>
                {u.label}
              </option>
            ))}
          </Select>

          <Select
            label="Periodicidad *"
            value={formData.periodicidad}
            onChange={(e) => handleChange('periodicidad', e.target.value)}
            required
          >
            {PERIODICIDAD_OPTIONS.map((periodo) => (
              <option key={periodo.value} value={periodo.value}>
                {periodo.label}
              </option>
            ))}
          </Select>

          <Input
            label="Fecha de Evaluación *"
            type="date"
            value={formData.fecha_evaluacion}
            onChange={(e) => handleChange('fecha_evaluacion', e.target.value)}
            required
          />

          <div className="md:col-span-2">
            <Textarea
              label="Observaciones"
              value={formData.observaciones}
              onChange={(e) => handleChange('observaciones', e.target.value)}
              placeholder="Observaciones adicionales..."
              rows={2}
            />
          </div>
        </div>

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
              <>{item ? 'Actualizar' : 'Crear'} Evaluación</>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
