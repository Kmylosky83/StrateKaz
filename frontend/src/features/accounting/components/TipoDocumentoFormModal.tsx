/**
 * Modal CRUD para Tipos de Documento Contable
 */
import { useState, useEffect } from 'react';
import { Modal, Button, Spinner } from '@/components/common';
import { Input, Select, Textarea } from '@/components/forms';
import { useCreateTipoDocumento, useUpdateTipoDocumento } from '../hooks';
import type { TipoDocumentoContable } from '../types';

interface Props {
  item: TipoDocumentoContable | null;
  isOpen: boolean;
  onClose: () => void;
}

const INITIAL = {
  codigo: '',
  nombre: '',
  clase_documento: 'CD' as string,
  prefijo: '',
  requiere_aprobacion: false,
  afecta_contabilidad: true,
  usa_periodo_numeracion: true,
  descripcion: '',
};

export default function TipoDocumentoFormModal({ item, isOpen, onClose }: Props) {
  const [form, setForm] = useState(INITIAL);
  const createMut = useCreateTipoDocumento();
  const updateMut = useUpdateTipoDocumento();
  const loading = createMut.isPending || updateMut.isPending;

  useEffect(() => {
    if (item) {
      setForm({
        codigo: item.codigo,
        nombre: item.nombre,
        clase_documento: item.clase_documento,
        prefijo: item.prefijo,
        requiere_aprobacion: item.requiere_aprobacion,
        afecta_contabilidad: item.afecta_contabilidad,
        usa_periodo_numeracion: item.usa_periodo_numeracion,
        descripcion: item.descripcion,
      });
    } else {
      setForm(INITIAL);
    }
  }, [item, isOpen]);

  const set = (field: string, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (item) {
      updateMut.mutate({ id: item.id, data: form }, { onSuccess: onClose });
    } else {
      createMut.mutate(form, { onSuccess: onClose });
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={item ? 'Editar Tipo de Documento' : 'Nuevo Tipo de Documento'}
      size="medium"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Código *"
            value={form.codigo}
            onChange={(e) => set('codigo', e.target.value)}
            placeholder="Ej: CD"
            required
          />
          <Input
            label="Nombre *"
            value={form.nombre}
            onChange={(e) => set('nombre', e.target.value)}
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Clase de Documento *"
            value={form.clase_documento}
            onChange={(e) => set('clase_documento', e.target.value)}
          >
            <option value="CD">Comprobante Diario</option>
            <option value="CE">Comprobante de Egreso</option>
            <option value="CI">Comprobante de Ingreso</option>
            <option value="CA">Comprobante de Ajuste</option>
            <option value="CC">Comprobante de Cierre</option>
            <option value="NC">Nota Contable</option>
          </Select>
          <Input
            label="Prefijo"
            value={form.prefijo}
            onChange={(e) => set('prefijo', e.target.value)}
          />
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
