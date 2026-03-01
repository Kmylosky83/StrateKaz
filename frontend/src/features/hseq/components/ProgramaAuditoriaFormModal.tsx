import { useState, useEffect } from 'react';
import { Modal, Button, Spinner } from '@/components/common';
import { Input, Select, Textarea, Checkbox } from '@/components/forms';
import { useCreateProgramaAuditoria, useUpdateProgramaAuditoria } from '../hooks/useMejoraContinua';
import type {
  ProgramaAuditoriaList,
  CreateProgramaAuditoriaDTO,
} from '../types/mejora-continua.types';

interface ProgramaAuditoriaFormModalProps {
  item: ProgramaAuditoriaList | null;
  isOpen: boolean;
  onClose: () => void;
}

const INITIAL_FORM: CreateProgramaAuditoriaDTO = {
  codigo: '',
  nombre: '',
  año: new Date().getFullYear(),
  alcance: '',
  objetivos: '',
  criterios_auditoria: '',
  normas_aplicables: [],
  recursos_necesarios: '',
  responsable_programa: '',
  observaciones: '',
};

const NORMAS_OPTIONS = [
  { value: 'ISO_9001', label: 'ISO 9001 - Calidad' },
  { value: 'ISO_14001', label: 'ISO 14001 - Ambiental' },
  { value: 'ISO_45001', label: 'ISO 45001 - SST' },
  { value: 'ISO_27001', label: 'ISO 27001 - Seguridad Información' },
  { value: 'DECRETO_1072', label: 'Decreto 1072 - SG-SST' },
  { value: 'RES_0312', label: 'Resolución 0312 - Estándares Mínimos' },
  { value: 'RES_40595', label: 'Resolución 40595 - PESV' },
];

export default function ProgramaAuditoriaFormModal({
  item,
  isOpen,
  onClose,
}: ProgramaAuditoriaFormModalProps) {
  const [formData, setFormData] = useState<CreateProgramaAuditoriaDTO>(INITIAL_FORM);

  const createMutation = useCreateProgramaAuditoria();
  const updateMutation = useUpdateProgramaAuditoria();

  const isLoading = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (item) {
      setFormData({
        codigo: item.codigo,
        nombre: item.nombre,
        año: item.año,
        alcance: item.alcance,
        objetivos: item.objetivos,
        criterios_auditoria: item.criterios_auditoria || '',
        normas_aplicables: item.normas_aplicables || [],
        recursos_necesarios: item.recursos_necesarios || '',
        responsable_programa: item.responsable_programa,
        fecha_inicio: item.fecha_inicio || '',
        fecha_fin: item.fecha_fin || '',
        observaciones: item.observaciones || '',
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

  const handleChange = (field: keyof CreateProgramaAuditoriaDTO, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleNormaToggle = (norma: string) => {
    setFormData((prev) => {
      const normas = prev.normas_aplicables || [];
      const exists = normas.includes(norma);

      return {
        ...prev,
        normas_aplicables: exists ? normas.filter((n) => n !== norma) : [...normas, norma],
      };
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={item ? 'Editar Programa de Auditoría' : 'Nuevo Programa de Auditoría'}
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

          <Input
            label="Año *"
            type="number"
            value={formData.año}
            onChange={(e) => handleChange('año', parseInt(e.target.value))}
            min={2020}
            max={2050}
            required
          />

          <div className="md:col-span-2">
            <Input
              label="Nombre del Programa *"
              value={formData.nombre}
              onChange={(e) => handleChange('nombre', e.target.value)}
              placeholder="Programa Anual de Auditorías Internas 2026"
              required
            />
          </div>

          <div className="md:col-span-2">
            <Textarea
              label="Alcance *"
              value={formData.alcance}
              onChange={(e) => handleChange('alcance', e.target.value)}
              placeholder="Todos los procesos del Sistema de Gestión"
              rows={3}
              required
            />
          </div>

          <div className="md:col-span-2">
            <Textarea
              label="Objetivos *"
              value={formData.objetivos}
              onChange={(e) => handleChange('objetivos', e.target.value)}
              placeholder="Verificar conformidad con requisitos, identificar oportunidades de mejora..."
              rows={3}
              required
            />
          </div>

          <div className="md:col-span-2">
            <Textarea
              label="Criterios de Auditoría"
              value={formData.criterios_auditoria}
              onChange={(e) => handleChange('criterios_auditoria', e.target.value)}
              placeholder="Normas ISO aplicables, requisitos legales, procedimientos internos..."
              rows={2}
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Normas Aplicables
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 p-4 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-800/40">
              {NORMAS_OPTIONS.map((norma) => (
                <Checkbox
                  key={norma.value}
                  label={norma.label}
                  checked={formData.normas_aplicables?.includes(norma.value) || false}
                  onChange={() => handleNormaToggle(norma.value)}
                />
              ))}
            </div>
          </div>

          <div className="md:col-span-2">
            <Textarea
              label="Recursos Necesarios"
              value={formData.recursos_necesarios}
              onChange={(e) => handleChange('recursos_necesarios', e.target.value)}
              placeholder="Personal auditor, equipos, tiempo estimado..."
              rows={2}
            />
          </div>

          <Input
            label="Responsable del Programa *"
            value={formData.responsable_programa}
            onChange={(e) => handleChange('responsable_programa', e.target.value)}
            placeholder="Nombre del responsable"
            required
          />

          <div />

          <Input
            label="Fecha Inicio"
            type="date"
            value={formData.fecha_inicio || ''}
            onChange={(e) => handleChange('fecha_inicio', e.target.value)}
          />

          <Input
            label="Fecha Fin"
            type="date"
            value={formData.fecha_fin || ''}
            onChange={(e) => handleChange('fecha_fin', e.target.value)}
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
              <>{item ? 'Actualizar' : 'Crear'} Programa</>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
