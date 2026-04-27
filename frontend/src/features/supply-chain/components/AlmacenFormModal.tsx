/**
 * Modal para crear/editar Almacenes (Supply Chain - vista CRUD global).
 *
 * Diferencia con AlmacenFormModal de gestion-estrategica:
 * - Aquí la Sede es seleccionable (Select), no viene fijada por contexto.
 * - Pensado para una vista de "todos los almacenes del tenant".
 *
 * Endpoint: /api/supply-chain/catalogos/almacenes/
 *
 * Design System:
 *   BaseModal · Input · Select · Textarea · Switch · Button (Lucide icons).
 */
import { useEffect, useState } from 'react';
import { Warehouse, Hash, Settings2, Building2 } from 'lucide-react';

import { BaseModal } from '@/components/modals/BaseModal';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/forms/Input';
import { Select } from '@/components/forms/Select';
import { Textarea } from '@/components/forms/Textarea';
import { Switch } from '@/components/forms/Switch';

import { useCreateAlmacen, useUpdateAlmacen } from '../hooks/useAlmacenes';
import { useTiposAlmacen } from '../hooks/useTiposAlmacen';
import { useSedes } from '@/features/gestion-estrategica/hooks/useStrategic';
import type { Almacen, CreateAlmacenDTO, UpdateAlmacenDTO } from '../types';
import type { SedeEmpresaList } from '@/features/gestion-estrategica/types/strategic.types';

interface AlmacenFormModalProps {
  almacen: Almacen | null;
  isOpen: boolean;
  onClose: () => void;
}

interface FormData {
  codigo: string;
  nombre: string;
  descripcion: string;
  direccion: string;
  sede: string;
  tipo_almacen: string;
  capacidad_maxima: string;
  permite_recepcion: boolean;
  permite_despacho: boolean;
  is_active: boolean;
}

const defaultFormData: FormData = {
  codigo: '',
  nombre: '',
  descripcion: '',
  direccion: '',
  sede: '',
  tipo_almacen: '',
  capacidad_maxima: '',
  permite_recepcion: true,
  permite_despacho: true,
  is_active: true,
};

export default function AlmacenFormModal({ almacen, isOpen, onClose }: AlmacenFormModalProps) {
  const isEditing = almacen !== null;
  const [formData, setFormData] = useState<FormData>(defaultFormData);

  const createMutation = useCreateAlmacen();
  const updateMutation = useUpdateAlmacen();
  const { data: tiposAlmacenData } = useTiposAlmacen();
  const { data: sedesData } = useSedes();

  const tiposAlmacen = Array.isArray(tiposAlmacenData)
    ? tiposAlmacenData
    : (tiposAlmacenData?.results ?? []);

  const sedes: SedeEmpresaList[] = Array.isArray(sedesData)
    ? (sedesData as SedeEmpresaList[])
    : ((sedesData as { results?: SedeEmpresaList[] } | undefined)?.results ?? []);

  useEffect(() => {
    if (isEditing && almacen) {
      setFormData({
        codigo: almacen.codigo || '',
        nombre: almacen.nombre || '',
        descripcion: almacen.descripcion || '',
        direccion: almacen.direccion || '',
        sede: almacen.sede?.toString() || '',
        tipo_almacen: almacen.tipo_almacen?.toString() || '',
        capacidad_maxima: almacen.capacidad_maxima?.toString() || '',
        permite_recepcion: almacen.permite_recepcion ?? true,
        permite_despacho: almacen.permite_despacho ?? true,
        is_active: almacen.is_active ?? true,
      });
    } else {
      setFormData({ ...defaultFormData });
    }
  }, [isEditing, almacen, isOpen]);

  const handleSubmit = async (e?: React.FormEvent | React.MouseEvent) => {
    e?.preventDefault();

    const camposFaltantes: string[] = [];
    if (!formData.nombre.trim()) camposFaltantes.push('Nombre');
    if (!formData.sede) camposFaltantes.push('Sede');

    if (camposFaltantes.length > 0) {
      const { toast } = await import('sonner');
      toast.warning(`Complete los campos requeridos: ${camposFaltantes.join(', ')}`, {
        duration: 5000,
      });
      return;
    }

    const baseData = {
      nombre: formData.nombre.trim(),
      descripcion: formData.descripcion || undefined,
      direccion: formData.direccion || undefined,
      sede: parseInt(formData.sede, 10),
      tipo_almacen: formData.tipo_almacen ? parseInt(formData.tipo_almacen, 10) : null,
      capacidad_maxima: formData.capacidad_maxima ? parseFloat(formData.capacidad_maxima) : null,
      permite_recepcion: formData.permite_recepcion,
      permite_despacho: formData.permite_despacho,
      is_active: formData.is_active,
    };

    try {
      if (isEditing && almacen) {
        await updateMutation.mutateAsync({
          id: almacen.id,
          data: baseData as UpdateAlmacenDTO,
        });
      } else {
        const createData: CreateAlmacenDTO = {
          ...baseData,
          ...(formData.codigo.trim() ? { codigo: formData.codigo.trim() } : {}),
        };
        await createMutation.mutateAsync(createData);
      }
      onClose();
    } catch {
      // Toast de error lo emite el hook.
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  const tipoAlmacenOptions = [
    { value: '', label: 'Sin especificar' },
    ...tiposAlmacen
      .filter((t) => t.is_active)
      .map((t) => ({ value: t.id.toString(), label: t.nombre })),
  ];

  const sedeOptions = [
    { value: '', label: 'Seleccione una sede' },
    ...sedes
      .filter((s) => s.is_active)
      .map((s) => ({
        value: s.id.toString(),
        label: s.codigo ? `${s.codigo} — ${s.nombre}` : s.nombre,
      })),
  ];

  const footer = (
    <>
      <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
        Cancelar
      </Button>
      <Button
        type="button"
        variant="primary"
        onClick={handleSubmit}
        disabled={isLoading}
        isLoading={isLoading}
      >
        {isEditing ? 'Guardar Cambios' : 'Crear Almacén'}
      </Button>
    </>
  );

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Almacén' : 'Nuevo Almacén'}
      size="2xl"
      footer={footer}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Sección: Identificación */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
              <Warehouse className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
              Identificación
            </h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Código
              </label>
              {isEditing ? (
                <div className="flex h-10 items-center gap-2 px-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50">
                  <Hash className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500 shrink-0" />
                  <span className="font-mono text-sm font-semibold text-blue-600 dark:text-blue-400 tracking-wider">
                    {formData.codigo}
                  </span>
                </div>
              ) : (
                <Input
                  value={formData.codigo}
                  onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                  placeholder="Se asignará al crear"
                  helperText="Opcional — dejar vacío para generar ALM-001"
                />
              )}
            </div>

            <Select
              label="Tipo de Almacén"
              value={formData.tipo_almacen}
              onChange={(e) => setFormData({ ...formData, tipo_almacen: e.target.value })}
              options={tipoAlmacenOptions}
              helperText="Silo, contenedor, pallet, piso, etc."
            />
          </div>

          <Input
            label="Nombre *"
            value={formData.nombre}
            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
            placeholder="Silo 1 Melaza, Bodega Norte, Tanque A-12"
            required
          />

          <Textarea
            label="Descripción"
            value={formData.descripcion}
            onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
            placeholder="Notas internas sobre este almacén"
            rows={2}
          />

          <Textarea
            label="Dirección / Ubicación física"
            value={formData.direccion}
            onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
            placeholder="Ej: Patio trasero, zona 3, estiba A-14"
            rows={2}
            helperText="Descripción de la ubicación física dentro de la sede"
          />
        </div>

        {/* Sección: Ubicación */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-sky-100 dark:bg-sky-900/30 rounded-lg">
              <Building2 className="w-4 h-4 text-sky-600 dark:text-sky-400" />
            </div>
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
              Sede
            </h4>
          </div>

          <Select
            label="Sede *"
            value={formData.sede}
            onChange={(e) => setFormData({ ...formData, sede: e.target.value })}
            options={sedeOptions}
            required
            helperText="Sede física del tenant a la que pertenece este almacén"
          />
        </div>

        {/* Sección: Operación */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
              <Settings2 className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </div>
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
              Operación
            </h4>
          </div>

          <Input
            label="Capacidad máxima"
            type="number"
            step="0.01"
            value={formData.capacidad_maxima}
            onChange={(e) => setFormData({ ...formData, capacidad_maxima: e.target.value })}
            placeholder="10000.00"
            helperText="Cantidad numérica — la unidad depende del tipo de almacén"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Permite recepción
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Puede recibir materia prima / producto
                </p>
              </div>
              <Switch
                checked={formData.permite_recepcion}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, permite_recepcion: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Permite despacho
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Puede despachar producto a otras sedes
                </p>
              </div>
              <Switch
                checked={formData.permite_despacho}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, permite_despacho: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600 sm:col-span-2">
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Activo</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Desactivar para ocultar sin eliminar
                </p>
              </div>
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
            </div>
          </div>
        </div>
      </form>
    </BaseModal>
  );
}
