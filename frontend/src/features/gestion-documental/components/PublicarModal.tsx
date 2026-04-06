/**
 * PublicarModal — Configuración de publicación de documento
 *
 * Permite configurar antes de publicar:
 *  - Fecha de vigencia (opcional)
 *  - Lectura obligatoria para todos los usuarios del tenant
 *  - Aplicar a todos los usuarios activos ahora mismo
 */
import { useState } from 'react';
import { Send, BookOpen, Users, Calendar, Info } from 'lucide-react';
import { BaseModal } from '@/components/modals/BaseModal';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/forms';
import { usePublicarDocumento } from '../hooks/useGestionDocumental';

// ==================== TYPES ====================

export interface PublicarModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentoId: number;
  documentoTitulo: string;
  documentoCodigo?: string;
}

// ==================== COMPONENT ====================

export function PublicarModal({
  isOpen,
  onClose,
  documentoId,
  documentoTitulo,
  documentoCodigo,
}: PublicarModalProps) {
  const publicarMutation = usePublicarDocumento();

  const [lecturaObligatoria, setLecturaObligatoria] = useState(false);
  const [aplicaATodos, setAplicaATodos] = useState(false);
  const [fechaVigencia, setFechaVigencia] = useState('');

  const handleClose = () => {
    if (publicarMutation.isPending) return;
    // Resetear estado al cerrar
    setLecturaObligatoria(false);
    setAplicaATodos(false);
    setFechaVigencia('');
    onClose();
  };

  const handlePublicar = () => {
    publicarMutation.mutate(
      {
        id: documentoId,
        ...(fechaVigencia ? { fecha_vigencia: fechaVigencia } : {}),
        ...(lecturaObligatoria ? { lectura_obligatoria: true } : {}),
        ...(aplicaATodos ? { aplica_a_todos: true } : {}),
      },
      {
        onSuccess: () => {
          setLecturaObligatoria(false);
          setAplicaATodos(false);
          setFechaVigencia('');
          onClose();
        },
      }
    );
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Publicar Documento"
      subtitle={documentoCodigo ? `${documentoCodigo} — ${documentoTitulo}` : documentoTitulo}
      size="sm"
    >
      <div className="space-y-5">
        {/* Info banner */}
        <div className="flex items-start gap-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 p-3.5">
          <Info className="w-4 h-4 mt-0.5 shrink-0 text-blue-600 dark:text-blue-400" />
          <p className="text-sm text-blue-800 dark:text-blue-200 leading-relaxed">
            El documento pasará a estado <span className="font-semibold">Publicado</span> y quedará
            disponible para consulta en el repositorio del tenant.
          </p>
        </div>

        {/* Fecha de vigencia */}
        <div>
          <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            <Calendar className="w-4 h-4" />
            Fecha de vigencia
            <span className="text-xs font-normal text-gray-400">(opcional)</span>
          </label>
          <Input
            type="date"
            value={fechaVigencia}
            onChange={(e) => setFechaVigencia(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            placeholder="Hoy (por defecto)"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Si no se indica, la vigencia inicia hoy.
          </p>
        </div>

        {/* Opciones de distribución */}
        <div className="space-y-3">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Opciones de distribución
          </p>

          {/* Lectura obligatoria */}
          <label className="flex items-start gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={lecturaObligatoria}
              onChange={(e) => setLecturaObligatoria(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
            <div>
              <div className="flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-gray-100 transition-colors">
                  Lectura obligatoria
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">
                Los usuarios deben confirmar la lectura. También aplica a nuevos usuarios que se
                incorporen en el futuro.
              </p>
            </div>
          </label>

          {/* Aplicar a todos ahora */}
          <label className="flex items-start gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={aplicaATodos}
              onChange={(e) => setAplicaATodos(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
            <div>
              <div className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-gray-100 transition-colors">
                  Distribuir a todos los usuarios activos ahora
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">
                Se asigna inmediatamente a todos los usuarios con cargo activo en el tenant.
              </p>
            </div>
          </label>
        </div>

        {/* Acciones */}
        <div className="flex justify-end gap-3 pt-1">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleClose}
            disabled={publicarMutation.isPending}
          >
            Cancelar
          </Button>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Send className="w-4 h-4" />}
            onClick={handlePublicar}
            isLoading={publicarMutation.isPending}
            className="bg-green-600 hover:bg-green-700 border-green-600"
          >
            Publicar
          </Button>
        </div>
      </div>
    </BaseModal>
  );
}
