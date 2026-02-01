/**
 * Tab de Programación de Revisiones por la Dirección
 * Calendario y listado de revisiones programadas
 */
import { Calendar, Plus, Clock, Users } from 'lucide-react';
import { Card, Button, Badge } from '@/components/common';
import { DataTableCard } from '@/components/layout/DataTableCard';
import { useProgramasRevision, useProgramacionesProximas } from '../../../hooks/useRevisionDireccion';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { ProgramacionRevision } from '../../../types/revisionDireccion';

const ProgramacionRow = ({ programacion }: { programacion: ProgramacionRevision }) => {
  const getEstadoBadge = (estado: string) => {
    const variants: Record<string, 'primary' | 'success' | 'warning' | 'danger' | 'gray'> = {
      PROGRAMADA: 'primary',
      NOTIFICADA: 'info' as any,
      EN_CURSO: 'warning',
      REALIZADA: 'success',
      CANCELADA: 'gray',
    };
    return <Badge variant={variants[estado] || 'gray'}>{programacion.estado_display}</Badge>;
  };

  return (
    <tr className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50">
      <td className="px-4 py-3">
        <span className="font-medium text-gray-900 dark:text-gray-100">{programacion.codigo}</span>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-900 dark:text-gray-100">
            {format(new Date(programacion.fecha_programada), 'dd/MM/yyyy', { locale: es })}
          </span>
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-900 dark:text-gray-100">
            {programacion.hora_inicio}
          </span>
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-900 dark:text-gray-100">
            {programacion.total_convocados || 0} convocados
          </span>
        </div>
      </td>
      <td className="px-4 py-3 text-center">{getEstadoBadge(programacion.estado)}</td>
      <td className="px-4 py-3">
        {programacion.tiene_acta && (
          <Badge variant="success" size="sm">
            Acta Generada
          </Badge>
        )}
      </td>
      <td className="px-4 py-3 text-center">
        <Button variant="ghost" size="sm">
          Ver
        </Button>
      </td>
    </tr>
  );
};

export const ProgramacionTab = () => {
  const { data: programacionesData, isLoading } = useProgramasRevision({});
  const { data: proximasData } = useProgramacionesProximas(3);

  const programaciones = programacionesData?.results || [];
  const proximas = proximasData?.results || [];

  return (
    <div className="space-y-6">
      {/* Próximas Revisiones */}
      {proximas.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Próximas Revisiones
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {proximas.map((prog) => (
              <Card key={prog.id} className="border-blue-200 dark:border-blue-800">
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <span className="font-medium text-gray-900 dark:text-gray-100">{prog.codigo}</span>
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
                      {prog.total_convocados} convocados
                    </p>
                  </div>
                  <Button variant="outline" size="sm" className="w-full mt-3">
                    Ver Detalle
                  </Button>
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
          <Button size="sm" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Nueva Programación
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
                  Código
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
                <ProgramacionRow key={prog.id} programacion={prog} />
              ))}
            </tbody>
          </table>
        </div>
      </DataTableCard>
    </div>
  );
};
