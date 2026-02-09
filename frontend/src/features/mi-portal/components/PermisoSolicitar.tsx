/**
 * PermisoSolicitar - Formulario para solicitar permisos
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Card, Button, Modal } from '@/components/common';
import { Input } from '@/components/forms';
import { FileText, Plus } from 'lucide-react';
import { useSolicitarPermiso } from '../api/miPortalApi';
import type { SolicitudPermisoFormData, TipoPermisoESS } from '../types';

const TIPOS_PERMISO: { value: TipoPermisoESS; label: string }[] = [
  { value: 'personal', label: 'Personal' },
  { value: 'medico', label: 'Medico' },
  { value: 'familiar', label: 'Familiar' },
  { value: 'academico', label: 'Academico' },
  { value: 'legal', label: 'Legal / Diligencia' },
  { value: 'otro', label: 'Otro' },
];

export function PermisoSolicitar() {
  const [isOpen, setIsOpen] = useState(false);
  const solicitarMutation = useSolicitarPermiso();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SolicitudPermisoFormData>();

  const onSubmit = (data: SolicitudPermisoFormData) => {
    solicitarMutation.mutate(data, {
      onSuccess: () => {
        reset();
        setIsOpen(false);
      },
    });
  };

  return (
    <>
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
              <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Solicitar permiso
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Cree una solicitud de permiso para su jefe directo
              </p>
            </div>
          </div>
          <Button onClick={() => setIsOpen(true)} size="sm">
            <Plus className="w-4 h-4 mr-1" />
            Nuevo permiso
          </Button>
        </div>
      </Card>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Solicitar permiso">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Tipo de permiso
            </label>
            <select
              {...register('tipo_permiso', { required: 'Seleccione un tipo' })}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Seleccione...</option>
              {TIPOS_PERMISO.map((tipo) => (
                <option key={tipo.value} value={tipo.value}>
                  {tipo.label}
                </option>
              ))}
            </select>
            {errors.tipo_permiso && (
              <p className="mt-1 text-xs text-red-600">{errors.tipo_permiso.message}</p>
            )}
          </div>

          <Input
            label="Fecha"
            type="date"
            {...register('fecha', { required: 'Requerido' })}
            error={errors.fecha?.message}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Hora inicio (opcional)"
              type="time"
              {...register('hora_inicio')}
            />
            <Input
              label="Hora fin (opcional)"
              type="time"
              {...register('hora_fin')}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Motivo
            </label>
            <textarea
              {...register('motivo', { required: 'Describa el motivo' })}
              rows={3}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
              placeholder="Describa brevemente el motivo del permiso..."
            />
            {errors.motivo && (
              <p className="mt-1 text-xs text-red-600">{errors.motivo.message}</p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" type="button" onClick={() => setIsOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={solicitarMutation.isPending}>
              {solicitarMutation.isPending ? 'Enviando...' : 'Enviar solicitud'}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
