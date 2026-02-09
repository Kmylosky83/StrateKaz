import { useState, useEffect } from 'react';
import { Modal, Button, Spinner } from '@/components/common';
import { Input, Select, Textarea } from '@/components/forms';
import { useCreateAuditoria, useUpdateAuditoria, useProgramasAuditoria } from '../hooks/useMejoraContinua';
import type { AuditoriaList, CreateAuditoriaDTO } from '../types/mejora-continua.types';

interface AuditoriaFormModalProps {
  item: AuditoriaList | null;
  isOpen: boolean;
  onClose: () => void;
}

const INITIAL_FORM: CreateAuditoriaDTO = {
  programa: 0,
  codigo: '',
  tipo: 'INTERNA',
  norma_principal: 'ISO_9001',
  titulo: '',
  objetivo: '',
  alcance: '',
  criterios: '',
  fecha_planificada_inicio: '',
  fecha_planificada_fin: '',
  auditor_lider: '',
};

const TIPO_OPTIONS = [
  { value: 'INTERNA', label: 'Auditoría Interna' },
  { value: 'EXTERNA', label: 'Auditoría Externa' },
  { value: 'SEGUIMIENTO', label: 'Auditoría de Seguimiento' },
  { value: 'CERTIFICACION', label: 'Auditoría de Certificación' },
  { value: 'RENOVACION', label: 'Auditoría de Renovación' },
];

const NORMA_OPTIONS = [
  { value: 'ISO_9001', label: 'ISO 9001 - Calidad' },
  { value: 'ISO_14001', label: 'ISO 14001 - Ambiental' },
  { value: 'ISO_45001', label: 'ISO 45001 - SST' },
  { value: 'ISO_27001', label: 'ISO 27001 - Seguridad Información' },
  { value: 'DECRETO_1072', label: 'Decreto 1072 - SG-SST' },
  { value: 'RES_0312', label: 'Resolución 0312' },
  { value: 'RES_40595', label: 'Resolución 40595 - PESV' },
  { value: 'MULTIPLE', label: 'Múltiples Normas' },
];

export default function AuditoriaFormModal({
  item,
  isOpen,
  onClose,
}: AuditoriaFormModalProps) {
  const [formData, setFormData] = useState<CreateAuditoriaDTO>(INITIAL_FORM);

  const createMutation = useCreateAuditoria();
  const updateMutation = useUpdateAuditoria();
  const { data: programasData } = useProgramasAuditoria();

  const isLoading = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (item) {
      setFormData({
        programa: item.programa,
        codigo: item.codigo,
        tipo: item.tipo,
        norma_principal: item.norma_principal,
        titulo: item.titulo,
        objetivo: item.objetivo,
        alcance: item.alcance,
        criterios: item.criterios || '',
        fecha_planificada_inicio: item.fecha_planificada_inicio,
        fecha_planificada_fin: item.fecha_planificada_fin,
        auditor_lider: item.auditor_lider,
      });
    } else {
      setFormData(INITIAL_FORM);
    }
  }, [item, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (item) {
      updateMutation.mutate(
        { id: item.id, datos: formData },
        { onSuccess: onClose }
      );
    } else {
      createMutation.mutate(formData, { onSuccess: onClose });
    }
  };

  const handleChange = (field: keyof CreateAuditoriaDTO, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const programas = programasData?.results || [];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={item ? 'Editar Auditoría' : 'Nueva Auditoría'}
      size="large"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Programa de Auditoría *"
            value={formData.programa}
            onChange={(e) => handleChange('programa', parseInt(e.target.value))}
            required
          >
            <option value={0}>Seleccionar programa...</option>
            {programas.map((programa) => (
              <option key={programa.id} value={programa.id}>
                {programa.codigo} - {programa.nombre}
              </option>
            ))}
          </Select>

          <Input
            label="Código"
            value={formData.codigo}
            onChange={(e) => handleChange('codigo', e.target.value)}
            placeholder="AUD-2026-001"
          />

          <Select
            label="Tipo de Auditoría *"
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

          <Select
            label="Norma Principal *"
            value={formData.norma_principal}
            onChange={(e) => handleChange('norma_principal', e.target.value)}
            required
          >
            {NORMA_OPTIONS.map((norma) => (
              <option key={norma.value} value={norma.value}>
                {norma.label}
              </option>
            ))}
          </Select>

          <div className="md:col-span-2">
            <Input
              label="Título *"
              value={formData.titulo}
              onChange={(e) => handleChange('titulo', e.target.value)}
              placeholder="Auditoría Interna al Sistema de Gestión de Calidad"
              required
            />
          </div>

          <div className="md:col-span-2">
            <Textarea
              label="Objetivo *"
              value={formData.objetivo}
              onChange={(e) => handleChange('objetivo', e.target.value)}
              placeholder="Verificar la conformidad del sistema con la norma ISO 9001..."
              rows={3}
              required
            />
          </div>

          <div className="md:col-span-2">
            <Textarea
              label="Alcance *"
              value={formData.alcance}
              onChange={(e) => handleChange('alcance', e.target.value)}
              placeholder="Procesos de gestión de calidad, producción y servicio al cliente..."
              rows={3}
              required
            />
          </div>

          <div className="md:col-span-2">
            <Textarea
              label="Criterios de Auditoría"
              value={formData.criterios}
              onChange={(e) => handleChange('criterios', e.target.value)}
              placeholder="Requisitos de ISO 9001:2015, procedimientos internos..."
              rows={2}
            />
          </div>

          <Input
            label="Fecha Planificada Inicio *"
            type="date"
            value={formData.fecha_planificada_inicio}
            onChange={(e) => handleChange('fecha_planificada_inicio', e.target.value)}
            required
          />

          <Input
            label="Fecha Planificada Fin *"
            type="date"
            value={formData.fecha_planificada_fin}
            onChange={(e) => handleChange('fecha_planificada_fin', e.target.value)}
            required
          />

          <div className="md:col-span-2">
            <Input
              label="Auditor Líder *"
              value={formData.auditor_lider}
              onChange={(e) => handleChange('auditor_lider', e.target.value)}
              placeholder="Nombre del auditor líder"
              required
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
              <>{item ? 'Actualizar' : 'Crear'} Auditoría</>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
