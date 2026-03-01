/**
 * OportunidadFormModal - Modal CRUD para oportunidades de venta
 * Sales CRM Module — StrateKaz SGI
 */
import { useState, useEffect } from 'react';
import { Modal, Button, Spinner } from '@/components/common';
import { Input, Select, Textarea } from '@/components/forms';
import { useCreateOportunidad, useUpdateOportunidad, useClientes } from '../hooks';
import { useSelectUsers } from '@/hooks/useSelectLists';
import type { Oportunidad, CreateOportunidadDTO } from '../types';

interface OportunidadFormModalProps {
  item: Oportunidad | null;
  isOpen: boolean;
  onClose: () => void;
}

const INITIAL_FORM: CreateOportunidadDTO = {
  cliente: 0,
  titulo: '',
  descripcion: '',
  etapa: 'PROSPECTO',
  prioridad: 'MEDIA',
  valor_estimado: 0,
  probabilidad_cierre: 50,
  fecha_estimada_cierre: '',
  fuente_lead: '',
  producto_interes: '',
  vendedor: 0,
  observaciones: '',
};

const FUENTE_OPTIONS = [
  { value: '', label: 'Seleccione fuente...' },
  { value: 'REFERIDO', label: 'Referido' },
  { value: 'WEB', label: 'Sitio Web' },
  { value: 'LLAMADA', label: 'Llamada' },
  { value: 'FERIA', label: 'Feria / Evento' },
  { value: 'RED_SOCIAL', label: 'Red Social' },
  { value: 'OTRO', label: 'Otro' },
];

const PRIORIDAD_OPTIONS = [
  { value: 'BAJA', label: 'Baja' },
  { value: 'MEDIA', label: 'Media' },
  { value: 'ALTA', label: 'Alta' },
  { value: 'CRITICA', label: 'Crítica' },
];

const ETAPA_OPTIONS = [
  { value: 'PROSPECTO', label: 'Prospecto' },
  { value: 'CONTACTADO', label: 'Contactado' },
  { value: 'CALIFICADO', label: 'Calificado' },
  { value: 'PROPUESTA', label: 'Propuesta' },
  { value: 'NEGOCIACION', label: 'Negociación' },
];

export default function OportunidadFormModal({ item, isOpen, onClose }: OportunidadFormModalProps) {
  const [formData, setFormData] = useState<CreateOportunidadDTO>(INITIAL_FORM);

  const createMutation = useCreateOportunidad();
  const updateMutation = useUpdateOportunidad();

  const { data: clientesData } = useClientes({ page_size: 200 });
  const { data: usuarios = [] } = useSelectUsers();

  const clientes = Array.isArray(clientesData) ? clientesData : (clientesData?.results ?? []);

  const isLoading = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (item) {
      setFormData({
        cliente: item.cliente,
        contacto: item.contacto || undefined,
        titulo: item.titulo,
        descripcion: item.descripcion || '',
        etapa: item.etapa,
        prioridad: item.prioridad,
        valor_estimado: item.valor_estimado ?? 0,
        probabilidad_cierre: item.probabilidad_cierre ?? 50,
        fecha_estimada_cierre: item.fecha_estimada_cierre || '',
        fuente_lead: item.fuente_lead || '',
        producto_interes: item.producto_interes || '',
        vendedor: item.vendedor,
        observaciones: item.observaciones || '',
      });
    } else {
      setFormData(INITIAL_FORM);
    }
  }, [item, isOpen]);

  const handleChange = (field: keyof CreateOportunidadDTO, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const payload = { ...formData };

    // Limpiar FK opcionales vacíos
    if (!payload.contacto) delete payload.contacto;
    if (!payload.fuente_lead) delete payload.fuente_lead;

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

  const usuariosOptions = usuarios.map((u) => ({
    value: String(u.id),
    label: u.label,
  }));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={item ? 'Editar Oportunidad' : 'Nueva Oportunidad'}
      size="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

          {/* Vendedor */}
          <Select
            label="Vendedor *"
            value={String(formData.vendedor || '')}
            onChange={(e) => handleChange('vendedor', Number(e.target.value))}
            required
          >
            <option value="">Seleccione un vendedor...</option>
            {usuariosOptions.map((op) => (
              <option key={op.value} value={op.value}>
                {op.label}
              </option>
            ))}
          </Select>

          {/* Título */}
          <div className="md:col-span-2">
            <Input
              label="Título *"
              value={formData.titulo}
              onChange={(e) => handleChange('titulo', e.target.value)}
              placeholder="Título de la oportunidad"
              required
            />
          </div>

          {/* Valor Estimado */}
          <Input
            label="Valor Estimado (COP)"
            type="number"
            value={String(formData.valor_estimado ?? 0)}
            onChange={(e) => handleChange('valor_estimado', Number(e.target.value))}
            min={0}
          />

          {/* Probabilidad */}
          <Input
            label="Probabilidad de Cierre (%)"
            type="number"
            value={String(formData.probabilidad_cierre ?? 50)}
            onChange={(e) => handleChange('probabilidad_cierre', Number(e.target.value))}
            min={0}
            max={100}
          />

          {/* Fecha Estimada de Cierre */}
          <Input
            label="Fecha Estimada de Cierre"
            type="date"
            value={formData.fecha_estimada_cierre || ''}
            onChange={(e) => handleChange('fecha_estimada_cierre', e.target.value)}
          />

          {/* Fuente */}
          <Select
            label="Fuente del Lead"
            value={formData.fuente_lead || ''}
            onChange={(e) => handleChange('fuente_lead', e.target.value)}
            options={FUENTE_OPTIONS}
          />

          {/* Prioridad */}
          <Select
            label="Prioridad"
            value={formData.prioridad || 'MEDIA'}
            onChange={(e) => handleChange('prioridad', e.target.value)}
            options={PRIORIDAD_OPTIONS}
          />

          {/* Etapa (solo en edición) */}
          {item && (
            <Select
              label="Etapa"
              value={formData.etapa || 'PROSPECTO'}
              onChange={(e) => handleChange('etapa', e.target.value)}
              options={ETAPA_OPTIONS}
            />
          )}

          {/* Producto de Interés */}
          <Input
            label="Producto de Interés"
            value={formData.producto_interes || ''}
            onChange={(e) => handleChange('producto_interes', e.target.value)}
            placeholder="Ej: Cortes premium, Embutidos"
          />
        </div>

        {/* Descripción */}
        <Textarea
          label="Descripción"
          value={formData.descripcion || ''}
          onChange={(e) => handleChange('descripcion', e.target.value)}
          placeholder="Detalles sobre la oportunidad..."
          rows={3}
        />

        {/* Observaciones */}
        <Textarea
          label="Observaciones"
          value={formData.observaciones || ''}
          onChange={(e) => handleChange('observaciones', e.target.value)}
          placeholder="Notas adicionales..."
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
              <>{item ? 'Actualizar' : 'Crear'} Oportunidad</>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
