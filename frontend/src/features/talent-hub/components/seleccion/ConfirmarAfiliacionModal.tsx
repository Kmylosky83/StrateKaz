/**
 * ConfirmarAfiliacionModal - Confirmar que un candidato fue afiliado
 * Permite ingresar fecha de afiliacion y numero de afiliacion
 */
import { useState } from 'react';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/forms/Input';
import { Modal } from '@/components/common/Modal';
import { Badge } from '@/components/common/Badge';
import { CheckCircle, Building2, User, Calendar } from 'lucide-react';
import { useConfirmarAfiliacion } from '../../hooks/useSeleccionContratacion';
import type { AfiliacionSS } from '../../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  afiliacion: AfiliacionSS;
}

export const ConfirmarAfiliacionModal = ({ isOpen, onClose, afiliacion }: Props) => {
  const confirmarMutation = useConfirmarAfiliacion();

  const [fechaAfiliacion, setFechaAfiliacion] = useState(new Date().toISOString().split('T')[0]);
  const [numeroAfiliacion, setNumeroAfiliacion] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    confirmarMutation.mutate(
      {
        id: afiliacion.id,
        fecha_afiliacion: fechaAfiliacion,
        numero_afiliacion: numeroAfiliacion || undefined,
      },
      { onSuccess: onClose }
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Confirmar Afiliacion" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Info de la afiliacion */}
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <User size={14} className="text-gray-400" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {afiliacion.candidato_nombre}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Building2 size={14} className="text-gray-400" />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {afiliacion.entidad_nombre}
              </span>
              <Badge variant="info">{afiliacion.tipo_entidad}</Badge>
            </div>
            <div className="flex items-center gap-2">
              <Calendar size={14} className="text-gray-400" />
              <span className="text-xs text-gray-500">
                Solicitada: {new Date(afiliacion.fecha_solicitud).toLocaleDateString('es-CO')}
              </span>
            </div>
          </div>
        </div>

        {/* Datos de confirmacion */}
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
          <p className="text-xs text-green-700 dark:text-green-400 flex items-center gap-1">
            <CheckCircle size={12} />
            Al confirmar, el estado cambiara a &quot;Afiliado&quot;.
          </p>
        </div>

        <Input
          label="Fecha de afiliacion efectiva"
          type="date"
          value={fechaAfiliacion}
          onChange={(e) => setFechaAfiliacion(e.target.value)}
          required
        />

        <Input
          label="Numero de afiliacion (opcional)"
          value={numeroAfiliacion}
          onChange={(e) => setNumeroAfiliacion(e.target.value)}
          placeholder="Ej: 123456789"
        />

        {/* Acciones */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" isLoading={confirmarMutation.isPending}>
            <CheckCircle size={16} className="mr-1" />
            Confirmar Afiliacion
          </Button>
        </div>
      </form>
    </Modal>
  );
};
