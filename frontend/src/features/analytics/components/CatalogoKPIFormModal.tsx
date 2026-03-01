/**
 * Modal para crear/editar KPI en el catálogo
 */
import { useState, useEffect } from 'react';
import { BaseModal } from '@/components/modals/BaseModal';
import { Button } from '@/components/common/Button';
import { Input, Textarea, Select, Checkbox } from '@/components/forms';
import { useCreateCatalogoKPI, useUpdateCatalogoKPI } from '../hooks/useAnalytics';
import type { CatalogoKPI } from '../types';

interface CatalogoKPIFormModalProps {
  item: CatalogoKPI | null;
  isOpen: boolean;
  onClose: () => void;
}

interface FormData {
  codigo: string;
  nombre: string;
  descripcion: string;
  categoria: string;
  tipo_indicador: string;
  perspectiva_bsc: string;
  frecuencia_medicion: string;
  unidad_medida: string;
  activo: boolean;
}

const INITIAL_FORM: FormData = {
  codigo: '',
  nombre: '',
  descripcion: '',
  categoria: '',
  tipo_indicador: '',
  perspectiva_bsc: '',
  frecuencia_medicion: '',
  unidad_medida: '',
  activo: true,
};

const CATEGORIAS = [
  { value: 'sst', label: 'SST' },
  { value: 'pesv', label: 'PESV' },
  { value: 'ambiental', label: 'Ambiental' },
  { value: 'calidad', label: 'Calidad' },
  { value: 'financiero', label: 'Financiero' },
  { value: 'operacional', label: 'Operacional' },
  { value: 'rrhh', label: 'RRHH' },
  { value: 'comercial', label: 'Comercial' },
];

const TIPOS_INDICADOR = [
  { value: 'eficiencia', label: 'Eficiencia' },
  { value: 'eficacia', label: 'Eficacia' },
  { value: 'efectividad', label: 'Efectividad' },
];

const PERSPECTIVAS_BSC = [
  { value: 'financiera', label: 'Financiera' },
  { value: 'cliente', label: 'Cliente' },
  { value: 'procesos', label: 'Procesos' },
  { value: 'aprendizaje', label: 'Aprendizaje' },
  { value: 'general', label: 'General' },
];

const FRECUENCIAS = [
  { value: 'diario', label: 'Diario' },
  { value: 'semanal', label: 'Semanal' },
  { value: 'quincenal', label: 'Quincenal' },
  { value: 'mensual', label: 'Mensual' },
  { value: 'trimestral', label: 'Trimestral' },
  { value: 'semestral', label: 'Semestral' },
  { value: 'anual', label: 'Anual' },
];

export const CatalogoKPIFormModal = ({ item, isOpen, onClose }: CatalogoKPIFormModalProps) => {
  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const createKPI = useCreateCatalogoKPI();
  const updateKPI = useUpdateCatalogoKPI();

  const isEditing = !!item;

  useEffect(() => {
    if (isOpen && item) {
      setForm({
        codigo: item.codigo,
        nombre: item.nombre,
        descripcion: item.descripcion || '',
        categoria: item.categoria,
        tipo_indicador: item.tipo_indicador,
        perspectiva_bsc: item.perspectiva_bsc,
        frecuencia_medicion: item.frecuencia_medicion,
        unidad_medida: item.unidad_medida,
        activo: item.activo,
      });
    } else if (isOpen) {
      setForm(INITIAL_FORM);
    }
  }, [isOpen, item]);

  const handleChange = (field: keyof FormData, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    if (!form.nombre || !form.categoria) return;

    const payload = {
      codigo: form.codigo,
      nombre: form.nombre,
      descripcion: form.descripcion || undefined,
      categoria: form.categoria,
      tipo_indicador: form.tipo_indicador,
      perspectiva_bsc: form.perspectiva_bsc,
      frecuencia_medicion: form.frecuencia_medicion,
      unidad_medida: form.unidad_medida,
      activo: form.activo,
    };

    if (isEditing) {
      updateKPI.mutate({ id: item.id, data: payload }, { onSuccess: () => onClose() });
    } else {
      createKPI.mutate(payload, { onSuccess: () => onClose() });
    }
  };

  const isPending = createKPI.isPending || updateKPI.isPending;
  const isValid = form.nombre && form.categoria;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar KPI' : 'Nuevo KPI'}
      size="lg"
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Código"
            value={form.codigo}
            onChange={(e) => handleChange('codigo', e.target.value)}
            placeholder="Se genera automáticamente"
          />
          <Input
            label="Nombre"
            value={form.nombre}
            onChange={(e) => handleChange('nombre', e.target.value)}
            placeholder="Nombre del KPI"
            required
          />
        </div>

        <Textarea
          label="Descripción"
          value={form.descripcion}
          onChange={(e) => handleChange('descripcion', e.target.value)}
          placeholder="Descripción del indicador..."
          rows={3}
        />

        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Categoría"
            value={form.categoria}
            onChange={(e) => handleChange('categoria', e.target.value)}
            options={CATEGORIAS}
            required
          />
          <Select
            label="Tipo de Indicador"
            value={form.tipo_indicador}
            onChange={(e) => handleChange('tipo_indicador', e.target.value)}
            options={TIPOS_INDICADOR}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Perspectiva BSC"
            value={form.perspectiva_bsc}
            onChange={(e) => handleChange('perspectiva_bsc', e.target.value)}
            options={PERSPECTIVAS_BSC}
            required
          />
          <Select
            label="Frecuencia de Medición"
            value={form.frecuencia_medicion}
            onChange={(e) => handleChange('frecuencia_medicion', e.target.value)}
            options={FRECUENCIAS}
            required
          />
        </div>

        <Input
          label="Unidad de Medida"
          value={form.unidad_medida}
          onChange={(e) => handleChange('unidad_medida', e.target.value)}
          placeholder="Ej: %, IF, días, etc."
          required
        />

        <Checkbox
          label="KPI Activo"
          checked={form.activo}
          onChange={(e) => handleChange('activo', e.target.checked)}
        />

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={!isValid || isPending}
            isLoading={isPending}
          >
            {isEditing ? 'Actualizar' : 'Crear'} KPI
          </Button>
        </div>
      </div>
    </BaseModal>
  );
};
