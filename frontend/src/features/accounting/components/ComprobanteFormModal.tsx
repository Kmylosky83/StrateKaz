/**
 * Modal CRUD para Comprobantes Contables (solo encabezado)
 */
import { useState, useEffect } from 'react';
import { Modal, Button, Spinner } from '@/components/common';
import { Input, Select, Textarea } from '@/components/forms';
import { useCreateComprobante, useUpdateComprobante, useTiposDocumento } from '../hooks';
import type { ComprobanteContable, TipoDocumentoContableList } from '../types';

interface Props {
  item: ComprobanteContable | null;
  isOpen: boolean;
  onClose: () => void;
}

const INITIAL = {
  tipo_documento: 0,
  fecha_comprobante: new Date().toISOString().split('T')[0],
  concepto: '',
  requiere_aprobacion: false,
  notas: '',
};

export default function ComprobanteFormModal({ item, isOpen, onClose }: Props) {
  const [form, setForm] = useState(INITIAL);
  const createMut = useCreateComprobante();
  const updateMut = useUpdateComprobante();
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
        tipo_documento: item.tipo_documento,
        fecha_comprobante: item.fecha_comprobante,
        concepto: item.concepto,
        requiere_aprobacion: item.requiere_aprobacion,
        notas: item.notas,
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
    if (item) {
      updateMut.mutate({ id: item.id, data: payload }, { onSuccess: onClose });
    } else {
      // Create with empty detalles — user adds them after creation
      (payload as Record<string, unknown>).detalles = [];
      createMut.mutate(payload, { onSuccess: onClose });
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={item ? 'Editar Comprobante' : 'Nuevo Comprobante'}
      size="medium"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          <Input
            label="Fecha *"
            type="date"
            value={form.fecha_comprobante}
            onChange={(e) => set('fecha_comprobante', e.target.value)}
            required
          />
        </div>

        <Textarea
          label="Concepto *"
          value={form.concepto}
          onChange={(e) => set('concepto', e.target.value)}
          rows={3}
          required
        />

        <Textarea
          label="Notas"
          value={form.notas}
          onChange={(e) => set('notas', e.target.value)}
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
