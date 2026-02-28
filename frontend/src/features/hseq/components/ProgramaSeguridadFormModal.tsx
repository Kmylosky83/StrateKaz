import { useState, useEffect } from 'react';
import { Modal, Button, Spinner } from '@/components/common';
import { Input, Select, Textarea } from '@/components/forms';
import {
  useCreateProgramaSeguridad,
  useUpdateProgramaSeguridad,
} from '../hooks/useSeguridadIndustrial';
import type {
  ProgramaSeguridad,
  CreateProgramaSeguridadDTO,
  TipoProgramaSeguridad,
} from '../types/seguridad-industrial.types';
import { useSelectUsers } from '@/hooks/useSelectLists';

interface ProgramaSeguridadFormModalProps {
  item: ProgramaSeguridad | null;
  isOpen: boolean;
  onClose: () => void;
}

const INITIAL_FORM: CreateProgramaSeguridadDTO = {
  codigo: '',
  nombre: '',
  descripcion: '',
  tipo_programa: 'PREVENCION_RIESGOS',
  alcance: '',
  responsable_id: 0,
  fecha_inicio: '',
  fecha_fin: '',
  presupuesto_asignado: undefined,
  recursos_requeridos: '',
  normativa_aplicable: '',
};

const TIPO_PROGRAMA_OPTIONS: { value: TipoProgramaSeguridad; label: string }[] = [
  { value: 'PREVENCION_RIESGOS', label: 'Prevención de Riesgos' },
  { value: 'CAPACITACION', label: 'Capacitación' },
  { value: 'VIGILANCIA_SALUD', label: 'Vigilancia de Salud' },
  { value: 'INSPECCION', label: 'Inspección' },
  { value: 'PREPARACION_EMERGENCIAS', label: 'Preparación para Emergencias' },
  { value: 'INVESTIGACION_INCIDENTES', label: 'Investigación de Incidentes' },
  { value: 'MEJORA_CONTINUA', label: 'Mejora Continua' },
  { value: 'OTRO', label: 'Otro' },
];

export default function ProgramaSeguridadFormModal({
  item,
  isOpen,
  onClose,
}: ProgramaSeguridadFormModalProps) {
  const [formData, setFormData] = useState<CreateProgramaSeguridadDTO>(INITIAL_FORM);

  const createMutation = useCreateProgramaSeguridad();
  const updateMutation = useUpdateProgramaSeguridad();

  const { data: usuarios = [] } = useSelectUsers();

  const isLoading = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (item) {
      setFormData({
        codigo: item.codigo || '',
        nombre: item.nombre || '',
        descripcion: item.descripcion || '',
        tipo_programa: item.tipo_programa || 'PREVENCION_RIESGOS',
        alcance: item.alcance || '',
        responsable_id: item.responsable_id ?? item.responsable?.id ?? 0,
        fecha_inicio: item.fecha_inicio || '',
        fecha_fin: item.fecha_fin || '',
        presupuesto_asignado: item.presupuesto_asignado ?? undefined,
        recursos_requeridos: item.recursos_requeridos || '',
        normativa_aplicable: item.normativa_aplicable || '',
      });
    } else {
      setFormData(INITIAL_FORM);
    }
  }, [item, isOpen]);

  const handleChange = (field: keyof CreateProgramaSeguridadDTO, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const payload = { ...formData };

    // Limpiar FK opcional vacío
    if (!payload.responsable_id) delete payload.responsable_id;

    // Limpiar texto opcional vacío
    if (!payload.codigo) delete payload.codigo;
    if (!payload.recursos_requeridos) delete payload.recursos_requeridos;
    if (!payload.normativa_aplicable) delete payload.normativa_aplicable;

    // Limpiar numérico opcional
    if (!payload.presupuesto_asignado) delete payload.presupuesto_asignado;

    if (item) {
      updateMutation.mutate({ id: item.id, dto: payload }, { onSuccess: onClose });
    } else {
      createMutation.mutate(payload, { onSuccess: onClose });
    }
  };

  const usuariosOptions = usuarios.map((u) => ({
    value: String(u.id),
    label: u.label,
  }));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={item ? 'Editar Programa de Seguridad' : 'Nuevo Programa de Seguridad'}
      size="large"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Código (auto-generado, opcional) */}
          <Input
            label="Código"
            value={formData.codigo || ''}
            onChange={(e) => handleChange('codigo', e.target.value)}
            placeholder="Se genera automáticamente si no se especifica"
          />

          {/* Tipo de Programa */}
          <Select
            label="Tipo de Programa *"
            value={formData.tipo_programa}
            onChange={(e) => handleChange('tipo_programa', e.target.value as TipoProgramaSeguridad)}
            required
          >
            {TIPO_PROGRAMA_OPTIONS.map((op) => (
              <option key={op.value} value={op.value}>
                {op.label}
              </option>
            ))}
          </Select>

          {/* Nombre */}
          <div className="md:col-span-2">
            <Input
              label="Nombre del Programa *"
              value={formData.nombre}
              onChange={(e) => handleChange('nombre', e.target.value)}
              placeholder="Ej: Programa anual de prevención de riesgos laborales"
              required
            />
          </div>

          {/* Descripción */}
          <div className="md:col-span-2">
            <Textarea
              label="Descripción *"
              value={formData.descripcion}
              onChange={(e) => handleChange('descripcion', e.target.value)}
              placeholder="Describa el propósito y objetivos generales del programa..."
              rows={3}
              required
            />
          </div>

          {/* Alcance */}
          <div className="md:col-span-2">
            <Textarea
              label="Alcance *"
              value={formData.alcance}
              onChange={(e) => handleChange('alcance', e.target.value)}
              placeholder="Defina el alcance del programa (áreas, procesos, trabajadores cubiertos)..."
              rows={3}
              required
            />
          </div>

          {/* Responsable */}
          <Select
            label="Responsable *"
            value={String(formData.responsable_id || '')}
            onChange={(e) => handleChange('responsable_id', Number(e.target.value))}
            required
          >
            <option value="">Seleccione un responsable...</option>
            {usuariosOptions.map((op) => (
              <option key={op.value} value={op.value}>
                {op.label}
              </option>
            ))}
          </Select>

          {/* Presupuesto Asignado */}
          <Input
            label="Presupuesto Asignado"
            type="number"
            value={
              formData.presupuesto_asignado !== undefined
                ? String(formData.presupuesto_asignado)
                : ''
            }
            onChange={(e) =>
              handleChange(
                'presupuesto_asignado',
                e.target.value !== '' ? parseFloat(e.target.value) || undefined : undefined
              )
            }
            placeholder="0"
          />

          {/* Fecha Inicio */}
          <Input
            label="Fecha de Inicio *"
            type="date"
            value={formData.fecha_inicio}
            onChange={(e) => handleChange('fecha_inicio', e.target.value)}
            required
          />

          {/* Fecha Fin */}
          <Input
            label="Fecha de Fin *"
            type="date"
            value={formData.fecha_fin}
            onChange={(e) => handleChange('fecha_fin', e.target.value)}
            required
          />

          {/* Recursos Requeridos */}
          <div className="md:col-span-2">
            <Textarea
              label="Recursos Requeridos"
              value={formData.recursos_requeridos || ''}
              onChange={(e) => handleChange('recursos_requeridos', e.target.value)}
              placeholder="Describa los recursos humanos, técnicos y financieros necesarios..."
              rows={3}
            />
          </div>

          {/* Normativa Aplicable */}
          <div className="md:col-span-2">
            <Input
              label="Normativa Aplicable"
              value={formData.normativa_aplicable || ''}
              onChange={(e) => handleChange('normativa_aplicable', e.target.value)}
              placeholder="Ej: Resolución 0312 de 2019, Decreto 1072 de 2015"
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
              <>{item ? 'Actualizar' : 'Crear'} Programa</>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
