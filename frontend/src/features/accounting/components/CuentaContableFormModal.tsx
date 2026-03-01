/**
 * Modal CRUD para Cuentas Contables
 */
import { useState, useEffect } from 'react';
import { Modal, Button, Spinner } from '@/components/common';
import { Input, Select, Textarea } from '@/components/forms';
import {
  useCreateCuentaContable,
  useUpdateCuentaContable,
  usePlanesCuentas,
  useCuentasContables,
} from '../hooks';
import type { CuentaContable, PlanCuentasList, CuentaContableList } from '../types';

interface Props {
  item: CuentaContable | null;
  isOpen: boolean;
  onClose: () => void;
}

const INITIAL = {
  plan_cuentas: 0,
  codigo: '',
  nombre: '',
  descripcion: '',
  cuenta_padre: null as number | null,
  naturaleza: 'debito' as 'debito' | 'credito',
  tipo_cuenta: 'detalle' as 'detalle' | 'titulo',
  clase_cuenta: 'activo',
  exige_tercero: false,
  exige_centro_costo: false,
  acepta_movimientos: true,
};

export default function CuentaContableFormModal({ item, isOpen, onClose }: Props) {
  const [form, setForm] = useState(INITIAL);
  const createMut = useCreateCuentaContable();
  const updateMut = useUpdateCuentaContable();
  const loading = createMut.isPending || updateMut.isPending;

  const { data: planesData } = usePlanesCuentas();
  const planes = (
    Array.isArray(planesData)
      ? planesData
      : ((planesData as { results?: PlanCuentasList[] })?.results ?? [])
  ) as PlanCuentasList[];
  const planActivo = planes.find((p) => p.es_activo);

  const { data: cuentasData } = useCuentasContables({ tipo_cuenta: 'titulo' });
  const cuentasPadre = (
    Array.isArray(cuentasData)
      ? cuentasData
      : ((cuentasData as { results?: CuentaContableList[] })?.results ?? [])
  ) as CuentaContableList[];

  useEffect(() => {
    if (item) {
      setForm({
        plan_cuentas: item.plan_cuentas,
        codigo: item.codigo,
        nombre: item.nombre,
        descripcion: item.descripcion,
        cuenta_padre: item.cuenta_padre,
        naturaleza: item.naturaleza,
        tipo_cuenta: item.tipo_cuenta,
        clase_cuenta: item.clase_cuenta,
        exige_tercero: item.exige_tercero,
        exige_centro_costo: item.exige_centro_costo,
        acepta_movimientos: item.acepta_movimientos,
      });
    } else {
      setForm({ ...INITIAL, plan_cuentas: planActivo?.id ?? 0 });
    }
  }, [item, isOpen, planActivo?.id]);

  const set = (field: string, value: string | number | boolean | null) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: Record<string, unknown> = { ...form };
    if (!payload.cuenta_padre) delete payload.cuenta_padre;
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
      title={item ? 'Editar Cuenta Contable' : 'Nueva Cuenta Contable'}
      size="large"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Código *"
            value={form.codigo}
            onChange={(e) => set('codigo', e.target.value)}
            placeholder="Ej: 110505"
            required
          />
          <Input
            label="Nombre *"
            value={form.nombre}
            onChange={(e) => set('nombre', e.target.value)}
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Select
            label="Naturaleza *"
            value={form.naturaleza}
            onChange={(e) => set('naturaleza', e.target.value)}
          >
            <option value="debito">Débito</option>
            <option value="credito">Crédito</option>
          </Select>
          <Select
            label="Tipo *"
            value={form.tipo_cuenta}
            onChange={(e) => set('tipo_cuenta', e.target.value)}
          >
            <option value="detalle">Detalle (Movimiento)</option>
            <option value="titulo">Título</option>
          </Select>
          <Select
            label="Clase *"
            value={form.clase_cuenta}
            onChange={(e) => set('clase_cuenta', e.target.value)}
          >
            <option value="activo">Activo</option>
            <option value="pasivo">Pasivo</option>
            <option value="patrimonio">Patrimonio</option>
            <option value="ingreso">Ingreso</option>
            <option value="gasto">Gasto</option>
            <option value="costo">Costo</option>
            <option value="orden">Orden</option>
          </Select>
        </div>

        <Select
          label="Cuenta Padre"
          value={String(form.cuenta_padre || '')}
          onChange={(e) => set('cuenta_padre', e.target.value ? Number(e.target.value) : null)}
        >
          <option value="">Sin cuenta padre (raíz)</option>
          {cuentasPadre.map((c) => (
            <option key={c.id} value={c.id}>
              {c.codigo} - {c.nombre}
            </option>
          ))}
        </Select>

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
