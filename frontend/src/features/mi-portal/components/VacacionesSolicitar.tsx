/**
 * VacacionesSolicitar - Modal para crear solicitud de vacaciones
 */

import { useForm } from 'react-hook-form';
import { Modal, Button, Alert } from '@/components/common';
import { Input } from '@/components/forms';
import { useSolicitarVacaciones } from '../api/miPortalApi';
import type { SolicitudVacacionesFormData } from '../types';

interface VacacionesSolicitarProps {
  isOpen: boolean;
  onClose: () => void;
  diasDisponibles: number;
}

export function VacacionesSolicitar({ isOpen, onClose, diasDisponibles }: VacacionesSolicitarProps) {
  const solicitarMutation = useSolicitarVacaciones();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SolicitudVacacionesFormData>();

  const onSubmit = (data: SolicitudVacacionesFormData) => {
    solicitarMutation.mutate(data, {
      onSuccess: () => {
        reset();
        onClose();
      },
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Solicitar vacaciones">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {diasDisponibles <= 0 && (
          <Alert variant="warning">
            No tiene dias de vacaciones disponibles.
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Fecha inicio"
            type="date"
            {...register('fecha_inicio', { required: 'Requerido' })}
            error={errors.fecha_inicio?.message}
          />
          <Input
            label="Fecha fin"
            type="date"
            {...register('fecha_fin', { required: 'Requerido' })}
            error={errors.fecha_fin?.message}
          />
        </div>

        <Input
          label="Dias solicitados"
          type="number"
          {...register('dias_solicitados', {
            required: 'Requerido',
            min: { value: 1, message: 'Minimo 1 dia' },
            max: { value: diasDisponibles, message: `Maximo ${diasDisponibles} dias` },
            valueAsNumber: true,
          })}
          error={errors.dias_solicitados?.message}
        />

        <Input
          label="Observaciones (opcional)"
          {...register('observaciones')}
        />

        <div className="flex justify-end gap-3 pt-4">
          <Button variant="outline" type="button" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={solicitarMutation.isPending || diasDisponibles <= 0}
          >
            {solicitarMutation.isPending ? 'Enviando...' : 'Enviar solicitud'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
