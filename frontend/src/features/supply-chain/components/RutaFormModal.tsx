/**
 * Modal para crear/editar Rutas de Recolección.
 *
 * Refactor 2026-04-25 (H-SC-RUTA-02):
 *   - Eliminado el switch "es_proveedor_interno" (concepto deprecado).
 *   - Agregado selector "modo_operacion" (PASS_THROUGH | SEMI_AUTONOMA).
 *   - La Ruta NUNCA es Proveedor. Los proveedores se asocian vía RutaParada.
 */
import { useEffect, useMemo, useState } from 'react';
import { Hash, Route, Settings2, Info, UserCheck } from 'lucide-react';

import { BaseModal } from '@/components/modals/BaseModal';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/forms/Input';
import { Select } from '@/components/forms/Select';
import { Textarea } from '@/components/forms/Textarea';
import { Switch } from '@/components/forms/Switch';

import { useCreateRuta, useUpdateRuta, useRuta } from '../hooks/useRutas';
import { useUsers } from '@/features/users/hooks/useUsers';
import {
  ModoOperacion,
  MODO_OPERACION_LABELS,
  type RutaRecoleccion,
  type CreateRutaDTO,
  type UpdateRutaDTO,
} from '../types/rutas.types';

interface RutaFormModalProps {
  ruta: RutaRecoleccion | null;
  isOpen: boolean;
  onClose: () => void;
}

interface FormData {
  codigo: string;
  nombre: string;
  descripcion: string;
  modo_operacion: ModoOperacion;
  is_active: boolean;
  /** H-SC-RUTA-RBAC-INSTANCIA: object-level RBAC */
  conductor_principal: number | '';
  conductores_adicionales: number[];
}

const defaultFormData: FormData = {
  codigo: '',
  nombre: '',
  descripcion: '',
  modo_operacion: ModoOperacion.PASS_THROUGH,
  is_active: true,
  conductor_principal: '',
  conductores_adicionales: [],
};

export default function RutaFormModal({ ruta, isOpen, onClose }: RutaFormModalProps) {
  const isEditing = ruta !== null;
  const [formData, setFormData] = useState<FormData>(defaultFormData);

  const createMutation = useCreateRuta();
  const updateMutation = useUpdateRuta();

  // H-SC-RUTA-RBAC-INSTANCIA: en edit pedimos el detalle fresco para que los
  // conductores asignados estén siempre al día (la lista cacheada puede venir
  // de antes del PATCH si se edita el mismo registro varias veces seguidas).
  const { data: rutaDetail } = useRuta(isEditing && isOpen ? (ruta?.id ?? null) : null);
  const hydratedRuta = rutaDetail ?? ruta;

  useEffect(() => {
    if (isEditing && hydratedRuta) {
      setFormData({
        codigo: hydratedRuta.codigo || '',
        nombre: hydratedRuta.nombre || '',
        descripcion: hydratedRuta.descripcion || '',
        modo_operacion: hydratedRuta.modo_operacion ?? ModoOperacion.PASS_THROUGH,
        is_active: hydratedRuta.is_active ?? true,
        conductor_principal: hydratedRuta.conductor_principal ?? '',
        conductores_adicionales: hydratedRuta.conductores_adicionales ?? [],
      });
    } else {
      setFormData({ ...defaultFormData });
    }
  }, [isEditing, hydratedRuta, isOpen]);

  // H-SC-RUTA-RBAC-INSTANCIA: lista de usuarios para asignar como conductores.
  const { data: usersResponse } = useUsers({ is_active: true });
  const users = useMemo(() => {
    if (!usersResponse) return [];
    if (Array.isArray(usersResponse)) return usersResponse;
    const data = usersResponse as { results?: unknown[] };
    return Array.isArray(data.results) ? data.results : [];
  }, [usersResponse]) as Array<{
    id: number;
    full_name?: string;
    first_name?: string;
    last_name?: string;
    email?: string;
    cargo_nombre?: string | null;
  }>;

  const userLabel = (u: (typeof users)[number]) => {
    const full = (u.full_name || `${u.first_name ?? ''} ${u.last_name ?? ''}`).trim();
    const base = full || u.email || `Usuario #${u.id}`;
    return u.cargo_nombre ? `${base} · ${u.cargo_nombre}` : base;
  };

  const handleSubmit = async (e?: React.FormEvent | React.MouseEvent) => {
    e?.preventDefault();

    if (!formData.nombre.trim()) {
      const { toast } = await import('sonner');
      toast.warning('Complete los campos requeridos: Nombre', { duration: 5000 });
      return;
    }

    const baseData = {
      nombre: formData.nombre.trim(),
      descripcion: formData.descripcion || undefined,
      modo_operacion: formData.modo_operacion,
      is_active: formData.is_active,
      conductor_principal:
        formData.conductor_principal === '' ? null : formData.conductor_principal,
      conductores_adicionales: formData.conductores_adicionales,
    };

    try {
      if (isEditing && ruta) {
        await updateMutation.mutateAsync({
          id: ruta.id,
          data: baseData as UpdateRutaDTO,
        });
      } else {
        const createData: CreateRutaDTO = {
          ...baseData,
          ...(formData.codigo.trim() ? { codigo: formData.codigo.trim() } : {}),
        };
        await createMutation.mutateAsync(createData);
      }
      onClose();
    } catch {
      // El hook ya muestra el toast.
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

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
        {isEditing ? 'Guardar Cambios' : 'Crear Ruta'}
      </Button>
    </>
  );

  const modoOptions = Object.entries(MODO_OPERACION_LABELS).map(([value, label]) => ({
    value,
    label,
  }));

  const esSemiAutonoma = formData.modo_operacion === ModoOperacion.SEMI_AUTONOMA;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Ruta de Recolección' : 'Nueva Ruta de Recolección'}
      size="2xl"
      footer={footer}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Sección: Identificación */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
              <Route className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
              Identificación
            </h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Código — opcional, auto-genera RUTA-001 */}
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
                  helperText="Opcional — dejar vacío para generar automáticamente"
                />
              )}
            </div>

            <Input
              label="Nombre *"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              placeholder="Ruta Norte, Circuito Sur, Recolección Zona 3"
              required
            />
          </div>

          <Textarea
            label="Descripción"
            value={formData.descripcion}
            onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
            placeholder="Notas internas: zonas cubiertas, vehículos asignados, etc."
            rows={2}
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

          <Select
            label="Modo de operación *"
            value={formData.modo_operacion}
            onChange={(e) =>
              setFormData({ ...formData, modo_operacion: e.target.value as ModoOperacion })
            }
            options={modoOptions}
            required
          />

          {esSemiAutonoma && (
            <div className="rounded-lg border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/20 p-3 text-sm text-purple-700 dark:text-purple-300 flex gap-2">
              <Info className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <strong>Modo Semi-autónoma:</strong> esta ruta gestiona caja propia. Después de
                crearla, configure el doble precio por proveedor en{' '}
                <strong>Cadena de Suministro → Precios de Ruta</strong>: lo que la ruta paga al
                productor y lo que la empresa le paga a la ruta. La diferencia cubre los gastos
                operativos de la ruta.
              </div>
            </div>
          )}

          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
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

        {/* Sección: Conductores asignados (H-SC-RUTA-RBAC-INSTANCIA) */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-sky-100 dark:bg-sky-900/30 rounded-lg">
              <UserCheck className="w-4 h-4 text-sky-600 dark:text-sky-400" />
            </div>
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
              Conductores asignados
            </h4>
          </div>

          <div className="rounded-lg border border-sky-200 dark:border-sky-800 bg-sky-50 dark:bg-sky-900/20 p-3 text-xs text-sky-700 dark:text-sky-300 flex gap-2">
            <Info className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <strong>Acceso restringido:</strong> Solo el conductor principal y los adicionales ven
              y gestionan esta ruta. Administradores y supervisores con permiso elevado siempre la
              ven.
            </div>
          </div>

          <Select
            label="Conductor principal"
            value={formData.conductor_principal === '' ? '' : String(formData.conductor_principal)}
            onChange={(e) =>
              setFormData({
                ...formData,
                conductor_principal: e.target.value ? Number(e.target.value) : '',
              })
            }
            options={[
              { value: '', label: 'Sin asignar (visible solo para admin)' },
              ...users.map((u) => ({ value: String(u.id), label: userLabel(u) })),
            ]}
            helperText="Operador habitual de la ruta. Si lo dejas vacío, solo administradores la ven."
          />

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Conductores adicionales (backup, supervisores)
            </label>
            <div className="max-h-40 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-600 p-2 space-y-1">
              {users
                .filter((u) => u.id !== formData.conductor_principal)
                .map((u) => {
                  const checked = formData.conductores_adicionales.includes(u.id);
                  return (
                    <label
                      key={u.id}
                      className="flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => {
                          const next = e.target.checked
                            ? [...formData.conductores_adicionales, u.id]
                            : formData.conductores_adicionales.filter((x) => x !== u.id);
                          setFormData({ ...formData, conductores_adicionales: next });
                        }}
                      />
                      <span className="text-gray-700 dark:text-gray-300">{userLabel(u)}</span>
                    </label>
                  );
                })}
              {users.length === 0 && (
                <p className="text-xs text-gray-500 dark:text-gray-400 py-2">
                  No hay usuarios disponibles.
                </p>
              )}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Usuarios que también pueden ver y operar esta ruta (sin ser principales).
            </p>
          </div>
        </div>
      </form>
    </BaseModal>
  );
}
