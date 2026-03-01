/**
 * Modal CRUD para Terceros Contables
 */
import { useState, useEffect } from 'react';
import { Modal, Button, Spinner } from '@/components/common';
import { Input, Select } from '@/components/forms';
import { useCreateTercero, useUpdateTercero } from '../hooks';
import type { Tercero } from '../types';

interface Props {
  item: Tercero | null;
  isOpen: boolean;
  onClose: () => void;
}

const INITIAL = {
  tipo_identificacion: 'nit',
  numero_identificacion: '',
  digito_verificacion: '',
  razon_social: '',
  nombre_comercial: '',
  tipo_tercero: 'cliente' as string,
  tipo_persona: 'juridica' as string,
  responsable_iva: false,
  regimen: 'comun',
  direccion: '',
  ciudad: '',
  telefono: '',
  email: '',
};

export default function TerceroFormModal({ item, isOpen, onClose }: Props) {
  const [form, setForm] = useState(INITIAL);
  const createMut = useCreateTercero();
  const updateMut = useUpdateTercero();
  const loading = createMut.isPending || updateMut.isPending;

  useEffect(() => {
    if (item) {
      setForm({
        tipo_identificacion: item.tipo_identificacion,
        numero_identificacion: item.numero_identificacion,
        digito_verificacion: item.digito_verificacion || '',
        razon_social: item.razon_social,
        nombre_comercial: item.nombre_comercial || '',
        tipo_tercero: item.tipo_tercero,
        tipo_persona: item.tipo_persona,
        responsable_iva: item.responsable_iva,
        regimen: item.regimen,
        direccion: item.direccion,
        ciudad: item.ciudad || '',
        telefono: item.telefono,
        email: item.email,
      });
    } else {
      setForm(INITIAL);
    }
  }, [item, isOpen]);

  const set = (field: string, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: Record<string, unknown> = { ...form };
    if (!payload.digito_verificacion) delete payload.digito_verificacion;
    if (!payload.nombre_comercial) delete payload.nombre_comercial;
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
      title={item ? 'Editar Tercero' : 'Nuevo Tercero'}
      size="large"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Select
            label="Tipo Identificación *"
            value={form.tipo_identificacion}
            onChange={(e) => set('tipo_identificacion', e.target.value)}
          >
            <option value="nit">NIT</option>
            <option value="cc">Cédula de Ciudadanía</option>
            <option value="ce">Cédula de Extranjería</option>
            <option value="pasaporte">Pasaporte</option>
            <option value="rut">RUT</option>
            <option value="otro">Otro</option>
          </Select>
          <Input
            label="Número *"
            value={form.numero_identificacion}
            onChange={(e) => set('numero_identificacion', e.target.value)}
            required
          />
          <Input
            label="Dígito Verificación"
            value={form.digito_verificacion}
            onChange={(e) => set('digito_verificacion', e.target.value)}
            maxLength={1}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Razón Social *"
            value={form.razon_social}
            onChange={(e) => set('razon_social', e.target.value)}
            required
          />
          <Input
            label="Nombre Comercial"
            value={form.nombre_comercial}
            onChange={(e) => set('nombre_comercial', e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Select
            label="Tipo Tercero *"
            value={form.tipo_tercero}
            onChange={(e) => set('tipo_tercero', e.target.value)}
          >
            <option value="cliente">Cliente</option>
            <option value="proveedor">Proveedor</option>
            <option value="empleado">Empleado</option>
            <option value="accionista">Accionista</option>
            <option value="gobierno">Gobierno</option>
            <option value="otro">Otro</option>
          </Select>
          <Select
            label="Tipo Persona *"
            value={form.tipo_persona}
            onChange={(e) => set('tipo_persona', e.target.value)}
          >
            <option value="juridica">Jurídica</option>
            <option value="natural">Natural</option>
          </Select>
          <Select
            label="Régimen *"
            value={form.regimen}
            onChange={(e) => set('regimen', e.target.value)}
          >
            <option value="comun">Común</option>
            <option value="simplificado">Simplificado</option>
            <option value="gran_contribuyente">Gran Contribuyente</option>
            <option value="no_responsable">No Responsable IVA</option>
          </Select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="Dirección"
            value={form.direccion}
            onChange={(e) => set('direccion', e.target.value)}
          />
          <Input
            label="Ciudad"
            value={form.ciudad}
            onChange={(e) => set('ciudad', e.target.value)}
          />
          <Input
            label="Teléfono"
            value={form.telefono}
            onChange={(e) => set('telefono', e.target.value)}
          />
        </div>

        <Input
          label="Correo Electrónico"
          type="email"
          value={form.email}
          onChange={(e) => set('email', e.target.value)}
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
