/**
 * Modal para crear/editar Rutas de Recolección (H-SC-10).
 *
 * Cuando `es_proveedor_interno=true` la ruta se registra automáticamente
 * como Proveedor Interno en el catálogo CT de Proveedores (backend signal).
 */
import { useEffect, useState } from 'react';
import { Hash, Route, Settings2 } from 'lucide-react';

import { BaseModal } from '@/components/modals/BaseModal';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/forms/Input';
import { Textarea } from '@/components/forms/Textarea';
import { Switch } from '@/components/forms/Switch';

import { useCreateRuta, useUpdateRuta } from '../hooks/useRutas';
import type { RutaRecoleccion, CreateRutaDTO, UpdateRutaDTO } from '../types/rutas.types';

interface RutaFormModalProps {
  ruta: RutaRecoleccion | null;
  isOpen: boolean;
  onClose: () => void;
}

interface FormData {
  codigo: string;
  nombre: string;
  descripcion: string;
  es_proveedor_interno: boolean;
  is_active: boolean;
}

const defaultFormData: FormData = {
  codigo: '',
  nombre: '',
  descripcion: '',
  es_proveedor_interno: true,
  is_active: true,
};

export default function RutaFormModal({ ruta, isOpen, onClose }: RutaFormModalProps) {
  const isEditing = ruta !== null;
  const [formData, setFormData] = useState<FormData>(defaultFormData);

  const createMutation = useCreateRuta();
  const updateMutation = useUpdateRuta();

  useEffect(() => {
    if (isEditing && ruta) {
      setFormData({
        codigo: ruta.codigo || '',
        nombre: ruta.nombre || '',
        descripcion: ruta.descripcion || '',
        es_proveedor_interno: ruta.es_proveedor_interno ?? true,
        is_active: ruta.is_active ?? true,
      });
    } else {
      setFormData({ ...defaultFormData });
    }
  }, [isEditing, ruta, isOpen]);

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
      es_proveedor_interno: formData.es_proveedor_interno,
      is_active: formData.is_active,
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
            {/* Código — opcional */}
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
            placeholder="Notas internas sobre esta ruta: zonas cubiertas, vehículos, etc."
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Proveedor interno
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  La empresa recoge de una UNeg propia
                </p>
              </div>
              <Switch
                checked={formData.es_proveedor_interno}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, es_proveedor_interno: checked })
                }
              />
            </div>

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

          {formData.es_proveedor_interno && (
            <div className="rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 p-3 text-sm text-blue-700 dark:text-blue-300">
              Esta ruta se registrará automáticamente como <strong>Proveedor Interno</strong> en el
              catálogo de Proveedores.
            </div>
          )}
        </div>
      </form>
    </BaseModal>
  );
}
