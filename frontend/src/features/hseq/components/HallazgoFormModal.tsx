import { useState, useEffect } from 'react';
import { Modal, Button, Spinner } from '@/components/common';
import { Input, Select, Textarea } from '@/components/forms';
import { useCreateHallazgo, useUpdateHallazgo, useAuditorias } from '../hooks/useMejoraContinua';
import type { HallazgoList, CreateHallazgoDTO } from '../types/mejora-continua.types';

interface HallazgoFormModalProps {
  item: HallazgoList | null;
  isOpen: boolean;
  onClose: () => void;
}

const INITIAL_FORM: CreateHallazgoDTO = {
  auditoria: 0,
  codigo: '',
  tipo: 'OBSERVACION',
  titulo: '',
  descripcion: '',
  evidencia: '',
  criterio: '',
  proceso_area: '',
  clausula_norma: '',
  norma_referencia: '',
  identificado_por: '',
  responsable_proceso: '',
  fecha_deteccion: '',
  fecha_cierre_esperada: '',
  analisis_causa_raiz: '',
  accion_propuesta: '',
};

const TIPO_OPTIONS = [
  { value: 'NO_CONFORMIDAD_MAYOR', label: 'No Conformidad Mayor' },
  { value: 'NO_CONFORMIDAD_MENOR', label: 'No Conformidad Menor' },
  { value: 'OBSERVACION', label: 'Observación' },
  { value: 'OPORTUNIDAD_MEJORA', label: 'Oportunidad de Mejora' },
  { value: 'FORTALEZA', label: 'Fortaleza' },
];

export default function HallazgoFormModal({ item, isOpen, onClose }: HallazgoFormModalProps) {
  const [formData, setFormData] = useState<CreateHallazgoDTO>(INITIAL_FORM);

  const createMutation = useCreateHallazgo();
  const updateMutation = useUpdateHallazgo();
  const { data: auditoriasData } = useAuditorias();

  const isLoading = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (item) {
      setFormData({
        auditoria: item.auditoria,
        codigo: item.codigo || '',
        tipo: item.tipo,
        titulo: item.titulo,
        descripcion: item.descripcion,
        evidencia: item.evidencia,
        criterio: item.criterio,
        proceso_area: item.proceso_area || '',
        clausula_norma: item.clausula_norma || '',
        norma_referencia: item.norma_referencia || '',
        identificado_por: item.identificado_por,
        responsable_proceso: item.responsable_proceso || '',
        fecha_deteccion: item.fecha_deteccion,
        fecha_cierre_esperada: item.fecha_cierre_esperada || '',
        analisis_causa_raiz: item.analisis_causa_raiz || '',
        accion_propuesta: item.accion_propuesta || '',
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

  const handleChange = (field: keyof CreateHallazgoDTO, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const auditorias = auditoriasData?.results || [];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={item ? 'Editar Hallazgo' : 'Nuevo Hallazgo'}
      size="large"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Auditoría *"
            value={formData.auditoria}
            onChange={(e) => handleChange('auditoria', parseInt(e.target.value))}
            required
          >
            <option value={0}>Seleccionar auditoría...</option>
            {auditorias.map((auditoria) => (
              <option key={auditoria.id} value={auditoria.id}>
                {auditoria.codigo} - {auditoria.titulo}
              </option>
            ))}
          </Select>

          <Input
            label="Código"
            value={formData.codigo}
            onChange={(e) => handleChange('codigo', e.target.value)}
            placeholder="HAL-2026-001"
          />

          <Select
            label="Tipo de Hallazgo *"
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

          <Input
            label="Proceso"
            value={formData.proceso_area}
            onChange={(e) => handleChange('proceso_area', e.target.value)}
            placeholder="Ej: Producción, Gestión de Calidad"
          />

          <div className="md:col-span-2">
            <Input
              label="Título *"
              value={formData.titulo}
              onChange={(e) => handleChange('titulo', e.target.value)}
              placeholder="Resumen breve del hallazgo"
              required
            />
          </div>

          <div className="md:col-span-2">
            <Textarea
              label="Descripción *"
              value={formData.descripcion}
              onChange={(e) => handleChange('descripcion', e.target.value)}
              placeholder="Descripción detallada del hallazgo..."
              rows={3}
              required
            />
          </div>

          <div className="md:col-span-2">
            <Textarea
              label="Evidencia *"
              value={formData.evidencia}
              onChange={(e) => handleChange('evidencia', e.target.value)}
              placeholder="Documentos, registros, observaciones que soportan el hallazgo..."
              rows={2}
              required
            />
          </div>

          <div className="md:col-span-2">
            <Textarea
              label="Criterio *"
              value={formData.criterio}
              onChange={(e) => handleChange('criterio', e.target.value)}
              placeholder="Requisito de norma, procedimiento o política aplicable..."
              rows={2}
              required
            />
          </div>

          <Input
            label="Cláusula de la Norma"
            value={formData.clausula_norma}
            onChange={(e) => handleChange('clausula_norma', e.target.value)}
            placeholder="Ej: 8.5.1, 6.1.2"
          />

          <Input
            label="Norma de Referencia"
            value={formData.norma_referencia}
            onChange={(e) => handleChange('norma_referencia', e.target.value)}
            placeholder="Ej: ISO 9001:2015"
          />

          <Input
            label="Identificado Por *"
            value={formData.identificado_por}
            onChange={(e) => handleChange('identificado_por', e.target.value)}
            placeholder="Nombre del auditor"
            required
          />

          <Input
            label="Responsable del Proceso"
            value={formData.responsable_proceso}
            onChange={(e) => handleChange('responsable_proceso', e.target.value)}
            placeholder="Nombre del responsable"
          />

          <Input
            label="Fecha de Detección *"
            type="date"
            value={formData.fecha_deteccion}
            onChange={(e) => handleChange('fecha_deteccion', e.target.value)}
            required
          />

          <Input
            label="Fecha Cierre Esperada"
            type="date"
            value={formData.fecha_cierre_esperada}
            onChange={(e) => handleChange('fecha_cierre_esperada', e.target.value)}
          />

          <div className="md:col-span-2">
            <Textarea
              label="Análisis de Causa Raíz"
              value={formData.analisis_causa_raiz}
              onChange={(e) => handleChange('analisis_causa_raiz', e.target.value)}
              placeholder="Análisis de las causas que originaron el hallazgo..."
              rows={2}
            />
          </div>

          <div className="md:col-span-2">
            <Textarea
              label="Acción Propuesta"
              value={formData.accion_propuesta}
              onChange={(e) => handleChange('accion_propuesta', e.target.value)}
              placeholder="Acción correctiva o preventiva propuesta..."
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
              <>{item ? 'Actualizar' : 'Crear'} Hallazgo</>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
