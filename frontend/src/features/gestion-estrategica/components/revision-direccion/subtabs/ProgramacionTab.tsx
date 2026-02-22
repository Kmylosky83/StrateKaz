/**
 * Tab de Programacion de Revisiones por la Direccion
 * Calendario y listado de revisiones programadas
 */
import { useState } from 'react';
import { Calendar, Plus, Clock, Users, Send, XCircle, Edit3 } from 'lucide-react';
import { Card, Badge, Button, ConfirmDialog } from '@/components/common';
import { DataTableCard } from '@/components/layout/DataTableCard';
import {
  useProgramasRevision,
  useProgramacionesProximas,
  useEnviarNotificaciones,
  useCancelarProgramacion,
} from '../../../hooks/useRevisionDireccion';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { ProgramacionRevision } from '../../../types/revision-direccion.types';
import { ProgramacionFormModal } from '../ProgramacionFormModal';

export const ProgramacionTab = () => {
  const [showFormModal, setShowFormModal] = useState(false);
  const [selectedProgramacion, setSelectedProgramacion] = useState<ProgramacionRevision | null>(
    null
  );
  const [cancelId, setCancelId] = useState<number | null>(null);

  const { data: programacionesData, isLoading } = useProgramasRevision({});
  const { data: proximasData } = useProgramacionesProximas(3);
  const enviarNotifMutation = useEnviarNotificaciones();
  const cancelarMutation = useCancelarProgramacion();

  const programaciones = programacionesData?.results || [];
  const proximas = proximasData?.results || [];

  const handleEdit = (prog: ProgramacionRevision) => {
    setSelectedProgramacion(prog);
    setShowFormModal(true);
  };

  const handleNew = () => {
    setSelectedProgramacion(null);
    setShowFormModal(true);
  };

  const handleCloseModal = () => {
    setShowFormModal(false);
    setSelectedProgramacion(null);
  };

  const getEstadoBadge = (estado: string, display?: string) => {
    const variants: Record<string, 'primary' | 'success' | 'warning' | 'danger' | 'gray'> = {
      programada: 'primary',
      convocada: 'warning',
      realizada: 'success',
      cancelada: 'gray',
      reprogramada: 'warning',
    };
    return <Badge variant={variants[estado] || 'gray'}>{display || estado}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Proximas Revisiones */}
      {proximas.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Proximas Revisiones
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {proximas.map((prog) => (
              <Card key={prog.id} className="border-blue-200 dark:border-blue-800">
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {prog.periodo}
                    </span>
                    <Badge variant="primary" size="sm">
                      {format(new Date(prog.fecha_programada), 'dd MMM', { locale: es })}
                    </Badge>
                  </div>
                  <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    <p className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      {prog.hora_inicio}
                    </p>
                    <p className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      {prog.total_participantes ?? 0} convocados
                    </p>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleEdit(prog)}
                    >
                      Ver Detalle
                    </Button>
                    {prog.estado === 'programada' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => enviarNotifMutation.mutate(prog.id)}
                        disabled={enviarNotifMutation.isPending}
                      >
                        <Send className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Tabla de Programaciones */}
      <DataTableCard
        title="Todas las Programaciones"
        headerActions={
          <Button size="sm" className="flex items-center gap-2" onClick={handleNew}>
            <Plus className="h-4 w-4" />
            Nueva Programacion
          </Button>
        }
        isEmpty={programaciones.length === 0}
        isLoading={isLoading}
        emptyMessage="No hay revisiones programadas"
      >
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Nombre
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Fecha
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Hora
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Convocados
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Estado
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Acta
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {programaciones.map((prog) => (
                <tr
                  key={prog.id}
                  className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                >
                  <td className="px-4 py-3">
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {prog.periodo}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-900 dark:text-gray-100">
                        {format(new Date(prog.fecha_programada), 'dd/MM/yyyy', { locale: es })}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-900 dark:text-gray-100">
                        {prog.hora_inicio}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-900 dark:text-gray-100">
                        {prog.total_participantes ?? 0} convocados
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {getEstadoBadge(prog.estado, prog.estado_display)}
                  </td>
                  <td className="px-4 py-3">
                    {prog.tiene_acta && (
                      <Badge variant="success" size="sm">
                        Acta Generada
                      </Badge>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(prog)}>
                        <Edit3 className="h-3.5 w-3.5 mr-1" />
                        Ver
                      </Button>
                      {prog.estado === 'programada' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setCancelId(prog.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <XCircle className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DataTableCard>

      {/* Modal de Formulario */}
      {showFormModal && (
        <ProgramacionFormModal
          programacion={selectedProgramacion}
          isOpen={showFormModal}
          onClose={handleCloseModal}
        />
      )}

      {/* Confirm Cancelar */}
      {cancelId && (
        <ConfirmDialog
          isOpen={!!cancelId}
          onClose={() => setCancelId(null)}
          onConfirm={() => {
            cancelarMutation.mutate(
              { id: cancelId, data: { motivo: 'Cancelada por el usuario' } },
              { onSuccess: () => setCancelId(null) }
            );
          }}
          title="Cancelar Programación"
          message="¿Está seguro de cancelar esta revisión programada? Esta acción no se puede deshacer."
          confirmLabel="Si, Cancelar"
          variant="danger"
          isLoading={cancelarMutation.isPending}
        />
      )}
    </div>
  );
};
