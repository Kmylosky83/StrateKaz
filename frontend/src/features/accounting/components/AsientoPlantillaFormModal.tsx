/**
 * Modal CRUD para Plantillas de Asiento Contable
 */
import { useState, useEffect } from 'react';
import { Modal, Button, Spinner } from '@/components/common';
import { Input, Select, Textarea } from '@/components/forms';
import { useCreatePlantilla, useUpdatePlantilla, useTiposDocumento } from '../hooks';
import type { AsientoPlantilla, TipoDocumentoContableList } from '../types';

interface Props {
  item: AsientoPlantilla | null;
  isOpen: boolean;
  onClose: () => void;
}

const INITIAL = {
  codigo: '',
  nombre: '',
  descripcion: '',
  tipo_documento: 0,
  es_recurrente: false,
  frecuencia: '' as string,
};

export default function AsientoPlantillaFormModal({ item, isOpen, onClose }: Props) {
  const [form, setForm] = useState(INITIAL);
  const createMut = useCreatePlantilla();
  const updateMut = useUpdatePlantilla();
  const loading = createMut.isPending || updateMut.isPending;

  const { data: tiposData } = useTiposDocumento();
  const tipos = (
    Array.isArray(tiposData)
      ? tiposData
      : ((tiposData as { results?: TipoDocumentoContableList[] })?.results ?? [])
  ) as TipoDocumentoContableList[];

  useEffect(() => {
    if (item) {
      setForm({
        codigo: item.codigo,
        nombre: item.nombre,
        descripcion: item.descripcion,
        tipo_documento: item.tipo_documento,
        es_recurrente: item.es_recurrente,
        frecuencia: item.frecuencia || '',
      });
    } else {
      setForm(INITIAL);
    }
  }, [item, isOpen]);

  const set = (field: string, value: string | number | boolean) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: Record<string, unknown> = { ...form };
    if (!payload.tipo_documento) delete payload.tipo_documento;
    if (!payload.frecuencia) delete payload.frecuencia;
    if (item) {
      updateMut.mutate({ id: item.id, data: payload }, { onSuccess: onClose });
    } else {
      createMut.mutate(payload, { onSuccess: onClose });
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={item ? 'Editar Plantilla' : 'Nueva Plantilla de Asiento'}
      size="medium"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Código *"
            value={form.codigo}
            onChange={(e) => set('codigo', e.target.value)}
            required
          />
          <Input
            label="Nombre *"
            value={form.nombre}
            onChange={(e) => set('nombre', e.target.value)}
            required
          />
        </div>

        <Select
          label="Tipo de Documento *"
          value={String(form.tipo_documento || '')}
          onChange={(e) => set('tipo_documento', Number(e.target.value))}
        >
          <option value="">Seleccione...</option>
          {tipos
            .filter((t) => t.is_active)
            .map((t) => (
              <option key={t.id} value={t.id}>
                {t.codigo} - {t.nombre}
              </option>
            ))}
        </Select>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Frecuencia"
            value={form.frecuencia}
            onChange={(e) => {
              set('frecuencia', e.target.value);
              if (e.target.value) set('es_recurrente', true);
            }}
          >
            <option value="">No recurrente</option>
            <option value="diaria">Diaria</option>
            <option value="semanal">Semanal</option>
            <option value="mensual">Mensual</option>
            <option value="trimestral">Trimestral</option>
            <option value="semestral">Semestral</option>
            <option value="anual">Anual</option>
          </Select>
        </div>

        <Textarea
          label="Descripción"
          value={form.descripcion}
          onChange={(e) => set('descripcion', e.target.value)}
          rows={2}
        />

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? (
              <>
                <Spinner size="small" className="mr-2" />
                Guardando...
              </>
            ) : item ? (
              'Actualizar'
            ) : (
              'Crear'
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
