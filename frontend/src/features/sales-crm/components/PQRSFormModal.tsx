/**
 * PQRSFormModal - Modal CRUD para tickets PQRS
 * Sales CRM Module — StrateKaz SGI
 */
import { useState, useEffect } from 'react';
import { Modal, Button, Spinner } from '@/components/common';
import { Input, Select, Textarea } from '@/components/forms';
import { useCreatePQRS, useUpdatePQRS, useClientes } from '../hooks';
import { useSelectUsers } from '@/hooks/useSelectLists';
import type { PQRS, CreatePQRSDTO } from '../types';

interface PQRSFormModalProps {
  item: PQRS | null;
  isOpen: boolean;
  onClose: () => void;
}

const INITIAL_FORM: CreatePQRSDTO = {
  tipo: 'PETICION',
  cliente: 0,
  asunto: '',
  descripcion: '',
  prioridad: 'MEDIA',
  canal_recepcion: 'WEB',
  observaciones: '',
};

const TIPO_OPTIONS = [
  { value: 'PETICION', label: 'Petición' },
  { value: 'QUEJA', label: 'Queja' },
  { value: 'RECLAMO', label: 'Reclamo' },
  { value: 'SUGERENCIA', label: 'Sugerencia' },
  { value: 'FELICITACION', label: 'Felicitación' },
];

const PRIORIDAD_OPTIONS = [
  { value: 'BAJA', label: 'Baja' },
  { value: 'MEDIA', label: 'Media' },
  { value: 'ALTA', label: 'Alta' },
  { value: 'URGENTE', label: 'Urgente' },
];

const CANAL_OPTIONS = [
  { value: 'TELEFONO', label: 'Teléfono' },
  { value: 'EMAIL', label: 'Correo Electrónico' },
  { value: 'PRESENCIAL', label: 'Presencial' },
  { value: 'WEB', label: 'Sitio Web' },
  { value: 'WHATSAPP', label: 'WhatsApp' },
];

export default function PQRSFormModal({ item, isOpen, onClose }: PQRSFormModalProps) {
  const [formData, setFormData] = useState<CreatePQRSDTO>(INITIAL_FORM);

  const createMutation = useCreatePQRS();
  const updateMutation = useUpdatePQRS();

  const { data: clientesData } = useClientes({ page_size: 200 });
  const { data: usuarios = [] } = useSelectUsers();

  const clientes = Array.isArray(clientesData) ? clientesData : (clientesData?.results ?? []);

  const isLoading = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (item) {
      setFormData({
        tipo: item.tipo,
        cliente: item.cliente,
        contacto: item.contacto || undefined,
        asunto: item.asunto,
        descripcion: item.descripcion,
        prioridad: item.prioridad,
        canal_recepcion: item.canal_recepcion,
        pedido_relacionado: item.pedido_relacionado || undefined,
        factura_relacionada: item.factura_relacionada || undefined,
        observaciones: item.observaciones || '',
      });
    } else {
      setFormData(INITIAL_FORM);
    }
  }, [item, isOpen]);

  const handleChange = (field: keyof CreatePQRSDTO, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const payload = { ...formData };

    // Limpiar FK opcionales vacíos
    if (!payload.contacto) delete payload.contacto;
    if (!payload.pedido_relacionado) delete payload.pedido_relacionado;
    if (!payload.factura_relacionada) delete payload.factura_relacionada;

    if (item) {
      updateMutation.mutate({ id: item.id, datos: payload }, { onSuccess: onClose });
    } else {
      createMutation.mutate(payload, { onSuccess: onClose });
    }
  };

  const clienteOptions = clientes.map((c) => ({
    value: String(c.id),
    label: c.nombre_comercial,
  }));

  const _usuariosOptions = usuarios.map((u) => ({
    value: String(u.id),
    label: u.label,
  }));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={item ? 'Editar PQRS' : 'Nuevo Ticket PQRS'}
      size="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Tipo */}
          <Select
            label="Tipo de PQRS *"
            value={formData.tipo}
            onChange={(e) => handleChange('tipo', e.target.value)}
            options={TIPO_OPTIONS}
            required
          />

          {/* Cliente */}
          <Select
            label="Cliente *"
            value={String(formData.cliente || '')}
            onChange={(e) => handleChange('cliente', Number(e.target.value))}
            required
          >
            <option value="">Seleccione un cliente...</option>
            {clienteOptions.map((op) => (
              <option key={op.value} value={op.value}>
                {op.label}
              </option>
            ))}
          </Select>

          {/* Asunto */}
          <div className="md:col-span-2">
            <Input
              label="Asunto *"
              value={formData.asunto}
              onChange={(e) => handleChange('asunto', e.target.value)}
              placeholder="Describa brevemente el asunto"
              required
            />
          </div>

          {/* Prioridad */}
          <Select
            label="Prioridad"
            value={formData.prioridad || 'MEDIA'}
            onChange={(e) => handleChange('prioridad', e.target.value)}
            options={PRIORIDAD_OPTIONS}
          />

          {/* Canal de Recepción */}
          <Select
            label="Canal de Recepción *"
            value={formData.canal_recepcion}
            onChange={(e) => handleChange('canal_recepcion', e.target.value)}
            options={CANAL_OPTIONS}
            required
          />
        </div>

        {/* Descripción */}
        <Textarea
          label="Descripción *"
          value={formData.descripcion}
          onChange={(e) => handleChange('descripcion', e.target.value)}
          placeholder="Describa en detalle la petición, queja, reclamo o sugerencia..."
          rows={4}
          required
        />

        {/* Observaciones */}
        <Textarea
          label="Observaciones"
          value={formData.observaciones || ''}
          onChange={(e) => handleChange('observaciones', e.target.value)}
          placeholder="Notas internas adicionales..."
          rows={2}
        />

        {/* Botones */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
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
              <>{item ? 'Actualizar' : 'Crear'} PQRS</>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
