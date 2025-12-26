/**
 * Tab de Actas de Revisión por la Dirección
 * Listado y gestión de actas generadas
 */
import { FileText, Download, CheckCircle, Plus, Calendar } from 'lucide-react';
import { Card, Button, Badge } from '@/components/common';
import { DataTableCard } from '@/components/layout/DataTableCard';
import { useActasRevision } from '../../../hooks/useRevisionDireccion';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { ActaRevisionDireccion } from '../../../types/revisionDireccion';

const ActaRow = ({ acta }: { acta: ActaRevisionDireccion }) => {
  const getEstadoBadge = (estado: string) => {
    const variants: Record<string, 'primary' | 'success' | 'warning' | 'danger' | 'gray'> = {
      BORRADOR: 'gray',
      EN_REVISION: 'warning',
      APROBADA: 'success',
      CERRADA: 'primary',
    };
    return <Badge variant={variants[estado] || 'gray'}>{acta.estado_display}</Badge>;
  };

  return (
    <tr className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50">
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-gray-400" />
          <span className="font-medium text-gray-900 dark:text-gray-100">{acta.numero_acta}</span>
        </div>
      </td>
      <td className="px-4 py-3">
        <span className="text-sm text-gray-900 dark:text-gray-100">
          {acta.programacion_codigo}
        </span>
      </td>
      <td className="px-4 py-3">
        <span className="text-sm text-gray-900 dark:text-gray-100">
          {format(new Date(acta.fecha_revision), 'dd/MM/yyyy', { locale: es })}
        </span>
      </td>
      <td className="px-4 py-3">
        <div className="text-sm">
          <p className="text-gray-900 dark:text-gray-100">{acta.total_participantes} participantes</p>
          <p className="text-xs text-gray-500">
            {acta.total_compromisos} {acta.total_compromisos === 1 ? 'compromiso' : 'compromisos'}
          </p>
        </div>
      </td>
      <td className="px-4 py-3 text-center">{getEstadoBadge(acta.estado)}</td>
      <td className="px-4 py-3 text-center">
        {acta.esta_aprobada && (
          <div className="flex items-center justify-center gap-1 text-green-600">
            <CheckCircle className="h-4 w-4" />
            <span className="text-xs">Aprobada</span>
          </div>
        )}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm">
            Ver
          </Button>
          {acta.esta_aprobada && (
            <Button variant="ghost" size="sm">
              <Download className="h-4 w-4" />
            </Button>
          )}
        </div>
      </td>
    </tr>
  );
};

export const ActasTab = () => {
  const { data: actasData, isLoading } = useActasRevision({});

  const actas = actasData?.results || [];
  const actasAprobadas = actas.filter((a) => a.esta_aprobada).length;
  const actasBorrador = actas.filter((a) => a.estado === 'BORRADOR').length;

  return (
    <div className="space-y-6">
      {/* Resumen de Actas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Total Actas
              </span>
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{actas.length}</p>
          </div>
        </Card>

        <Card>
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Actas Aprobadas
              </span>
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-green-600">{actasAprobadas}</p>
          </div>
        </Card>

        <Card>
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                En Borrador
              </span>
              <Calendar className="h-5 w-5 text-gray-600" />
            </div>
            <p className="text-2xl font-bold text-gray-600">{actasBorrador}</p>
          </div>
        </Card>
      </div>

      {/* Tabla de Actas */}
      <DataTableCard
        title="Todas las Actas"
        headerActions={
          <Button size="sm" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Nueva Acta
          </Button>
        }
        isEmpty={actas.length === 0}
        isLoading={isLoading}
        emptyMessage="No hay actas generadas"
      >
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Número Acta
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Programación
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Fecha Revisión
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Detalles
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Estado
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Aprobación
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {actas.map((acta) => (
                <ActaRow key={acta.id} acta={acta} />
              ))}
            </tbody>
          </table>
        </div>
      </DataTableCard>
    </div>
  );
};
