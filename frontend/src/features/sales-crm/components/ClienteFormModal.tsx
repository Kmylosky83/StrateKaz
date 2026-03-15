/**
 * ClienteFormModal - Modal CRUD para clientes
 * Sales CRM Module — StrateKaz SGI
 */
import { useState, useEffect } from 'react';
import { Modal, Button, Spinner } from '@/components/common';
import { Input, Select, Textarea } from '@/components/forms';
import { useCreateCliente, useUpdateCliente, useSegmentos, useCanalesVenta } from '../hooks';
import { useSelectUsers } from '@/hooks/useSelectLists';
import { PILookupField } from '@/features/gestion-estrategica/components/PILookupField';
import type { Cliente, CreateClienteDTO } from '../types';

interface ClienteFormModalProps {
  item: Cliente | null;
  isOpen: boolean;
  onClose: () => void;
}

const INITIAL_FORM: CreateClienteDTO = {
  tipo_persona: 'JURIDICA',
  tipo_cliente: 'OTRO',
  nombre_comercial: '',
  razon_social: '',
  nit: '',
  cedula: '',
  digito_verificacion: '',
  telefono: '',
  email: '',
  direccion: '',
  ciudad: '',
  departamento: '',
  pais: 'Colombia',
  credito_aprobado: 0,
  dias_credito: 30,
  descuento_maximo: 0,
  segmento: undefined,
  canal_venta: undefined,
  vendedor_asignado: undefined,
  observaciones: '',
};

const TIPO_PERSONA_OPTIONS = [
  { value: 'NATURAL', label: 'Persona Natural' },
  { value: 'JURIDICA', label: 'Persona Jurídica' },
];

const TIPO_CLIENTE_OPTIONS = [
  { value: 'CARNICERIA', label: 'Carnicería' },
  { value: 'RESTAURANTE', label: 'Restaurante' },
  { value: 'PROCESADORA', label: 'Procesadora' },
  { value: 'INDUSTRIA', label: 'Industria' },
  { value: 'EXPORTADOR', label: 'Exportador' },
  { value: 'OTRO', label: 'Otro' },
];

export default function ClienteFormModal({ item, isOpen, onClose }: ClienteFormModalProps) {
  const [formData, setFormData] = useState<CreateClienteDTO>(INITIAL_FORM);
  const [piId, setPiId] = useState<number | null>(null);
  const [piNombre, setPiNombre] = useState('');

  const createMutation = useCreateCliente();
  const updateMutation = useUpdateCliente();

  const { data: segmentosData } = useSegmentos({ activo: true });
  const { data: canalesData } = useCanalesVenta({ activo: true });
  const { data: usuarios = [] } = useSelectUsers();

  const segmentos = Array.isArray(segmentosData) ? segmentosData : (segmentosData?.results ?? []);
  const canales = Array.isArray(canalesData) ? canalesData : (canalesData?.results ?? []);

  const isLoading = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (item) {
      setFormData({
        tipo_persona: item.tipo_persona,
        tipo_cliente: item.tipo_cliente,
        nombre_comercial: item.nombre_comercial,
        razon_social: item.razon_social || '',
        nit: item.nit || '',
        cedula: item.cedula || '',
        digito_verificacion: item.digito_verificacion || '',
        telefono: item.telefono || '',
        email: item.email || '',
        direccion: item.direccion || '',
        ciudad: item.ciudad || '',
        departamento: item.departamento || '',
        pais: item.pais || 'Colombia',
        credito_aprobado: item.credito_aprobado ?? 0,
        dias_credito: item.dias_credito ?? 30,
        descuento_maximo: item.descuento_maximo ?? 0,
        segmento: item.segmento || undefined,
        canal_venta: item.canal_venta || undefined,
        vendedor_asignado: item.vendedor_asignado || undefined,
        observaciones: item.observaciones || '',
      });
      setPiId(item.parte_interesada_id ?? null);
      setPiNombre(item.parte_interesada_nombre ?? '');
    } else {
      setFormData(INITIAL_FORM);
      setPiId(null);
      setPiNombre('');
    }
  }, [item, isOpen]);

  const handleChange = (field: keyof CreateClienteDTO, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const payload = { ...formData, parte_interesada_id: piId, parte_interesada_nombre: piNombre };

    // Limpiar FK opcionales vacíos (evitar pk=0)
    if (!payload.segmento) delete payload.segmento;
    if (!payload.canal_venta) delete payload.canal_venta;
    if (!payload.vendedor_asignado) delete payload.vendedor_asignado;

    if (item) {
      updateMutation.mutate({ id: item.id, datos: payload }, { onSuccess: onClose });
    } else {
      createMutation.mutate(payload, { onSuccess: onClose });
    }
  };

  const segmentoOptions = segmentos.map((s) => ({
    value: String(s.id),
    label: s.nombre,
  }));

  const canalOptions = canales.map((c) => ({
    value: String(c.id),
    label: c.nombre,
  }));

  const usuariosOptions = usuarios.map((u) => ({
    value: String(u.id),
    label: u.label,
  }));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={item ? 'Editar Cliente' : 'Nuevo Cliente'}
      size="3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Información Básica */}
        <div>
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            Información Básica
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Tipo de Persona *"
              value={formData.tipo_persona}
              onChange={(e) => handleChange('tipo_persona', e.target.value)}
              options={TIPO_PERSONA_OPTIONS}
              required
            />

            <Select
              label="Tipo de Cliente *"
              value={formData.tipo_cliente}
              onChange={(e) => handleChange('tipo_cliente', e.target.value)}
              options={TIPO_CLIENTE_OPTIONS}
              required
            />

            <Input
              label="Nombre Comercial *"
              value={formData.nombre_comercial}
              onChange={(e) => handleChange('nombre_comercial', e.target.value)}
              placeholder="Nombre comercial del cliente"
              required
            />

            <Input
              label="Razón Social"
              value={formData.razon_social || ''}
              onChange={(e) => handleChange('razon_social', e.target.value)}
              placeholder="Razón social legal"
            />

            {formData.tipo_persona === 'JURIDICA' ? (
              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    label="NIT"
                    value={formData.nit || ''}
                    onChange={(e) => handleChange('nit', e.target.value)}
                    placeholder="Ej: 900123456"
                  />
                </div>
                <div className="w-20">
                  <Input
                    label="DV"
                    value={formData.digito_verificacion || ''}
                    onChange={(e) => handleChange('digito_verificacion', e.target.value)}
                    placeholder="0"
                    maxLength={1}
                  />
                </div>
              </div>
            ) : (
              <Input
                label="Cédula"
                value={formData.cedula || ''}
                onChange={(e) => handleChange('cedula', e.target.value)}
                placeholder="Número de documento"
              />
            )}

            <Select
              label="Segmento"
              value={String(formData.segmento || '')}
              onChange={(e) =>
                handleChange('segmento', e.target.value ? Number(e.target.value) : undefined)
              }
            >
              <option value="">Sin segmento</option>
              {segmentoOptions.map((op) => (
                <option key={op.value} value={op.value}>
                  {op.label}
                </option>
              ))}
            </Select>

            <Select
              label="Canal de Venta"
              value={String(formData.canal_venta || '')}
              onChange={(e) =>
                handleChange('canal_venta', e.target.value ? Number(e.target.value) : undefined)
              }
            >
              <option value="">Seleccione canal...</option>
              {canalOptions.map((op) => (
                <option key={op.value} value={op.value}>
                  {op.label}
                </option>
              ))}
            </Select>
          </div>
        </div>

        {/* Contacto */}
        <div>
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            Datos de Contacto
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Teléfono"
              type="tel"
              value={formData.telefono || ''}
              onChange={(e) => handleChange('telefono', e.target.value)}
              placeholder="Ej: +57 300 123 4567"
            />

            <Input
              label="Correo Electrónico"
              type="email"
              value={formData.email || ''}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder="correo@empresa.com"
            />

            <Input
              label="Dirección"
              value={formData.direccion || ''}
              onChange={(e) => handleChange('direccion', e.target.value)}
              placeholder="Dirección completa"
            />

            <Input
              label="Ciudad"
              value={formData.ciudad || ''}
              onChange={(e) => handleChange('ciudad', e.target.value)}
              placeholder="Ej: Bogotá"
            />

            <Input
              label="Departamento"
              value={formData.departamento || ''}
              onChange={(e) => handleChange('departamento', e.target.value)}
              placeholder="Ej: Cundinamarca"
            />

            <Input
              label="País"
              value={formData.pais || 'Colombia'}
              onChange={(e) => handleChange('pais', e.target.value)}
              placeholder="Colombia"
            />
          </div>
        </div>

        {/* Comercial */}
        <div>
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            Condiciones Comerciales
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Plazo de Pago (días)"
              type="number"
              value={String(formData.dias_credito ?? 30)}
              onChange={(e) => handleChange('dias_credito', Number(e.target.value))}
              min={0}
              max={365}
            />

            <Input
              label="Cupo de Crédito"
              type="number"
              value={String(formData.credito_aprobado ?? 0)}
              onChange={(e) => handleChange('credito_aprobado', Number(e.target.value))}
              min={0}
              helperText="Monto máximo de crédito aprobado"
            />

            <Input
              label="Descuento Comercial (%)"
              type="number"
              value={String(formData.descuento_maximo ?? 0)}
              onChange={(e) => handleChange('descuento_maximo', Number(e.target.value))}
              min={0}
              max={100}
              step={0.5}
            />

            <Select
              label="Vendedor Asignado"
              value={String(formData.vendedor_asignado || '')}
              onChange={(e) =>
                handleChange(
                  'vendedor_asignado',
                  e.target.value ? Number(e.target.value) : undefined
                )
              }
            >
              <option value="">Sin vendedor asignado</option>
              {usuariosOptions.map((op) => (
                <option key={op.value} value={op.value}>
                  {op.label}
                </option>
              ))}
            </Select>
          </div>
        </div>

        {/* Vínculo Parte Interesada */}
        <div>
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            Vínculo con Parte Interesada
          </h4>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
            Vincule este cliente con una Parte Interesada registrada en Fundación.
          </p>
          <PILookupField
            value={piId}
            displayName={piNombre}
            onChange={(id, nombre) => {
              setPiId(id);
              setPiNombre(nombre);
            }}
          />
        </div>

        {/* Observaciones */}
        <Textarea
          label="Observaciones"
          value={formData.observaciones || ''}
          onChange={(e) => handleChange('observaciones', e.target.value)}
          placeholder="Notas adicionales sobre el cliente..."
          rows={3}
        />

        {/* Código (solo en edición) */}
        {item && (
          <Input
            label="Código de Cliente"
            value={item.codigo_cliente}
            disabled
            helperText="Se genera automáticamente"
          />
        )}

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
              <>{item ? 'Actualizar' : 'Crear'} Cliente</>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
