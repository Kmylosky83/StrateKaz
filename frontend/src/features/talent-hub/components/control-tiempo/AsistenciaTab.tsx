/**
 * AsistenciaTab - Registros de asistencia
 */
import { useState, useMemo } from 'react';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Input } from '@/components/forms/Input';
import { Select } from '@/components/forms/Select';
import { SectionHeader } from '@/components/common/SectionHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { Spinner } from '@/components/common/Spinner';
import { useModuleColor } from '@/hooks/useModuleColor';
import { getModuleColorClasses } from '@/utils/moduleColors';
import { UserCheck, Plus } from 'lucide-react';
import { useRegistrosAsistencia } from '../../hooks/useControlTiempo';
import type { EstadoAsistencia } from '../../types';
import { estadoAsistenciaOptions } from '../../types/controlTiempo.types';
import { RegistroAsistenciaFormModal } from './RegistroAsistenciaFormModal';

const ESTADO_BADGE: Record<EstadoAsistencia, 'success' | 'danger' | 'warning' | 'info' | 'gray'> = {
  presente: 'success',
  ausente: 'danger',
  tardanza: 'warning',
  permiso: 'info',
  incapacidad: 'gray',
  vacaciones: 'info',
  licencia: 'gray',
};

export const AsistenciaTab = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);

  const { color: moduleColor } = useModuleColor('TALENT_HUB');
  const colorClasses = getModuleColorClasses(moduleColor);

  const { data: registros, isLoading } = useRegistrosAsistencia({
    fecha_desde: fechaInicio || undefined,
    fecha_hasta: fechaFin || undefined,
    estado: (estadoFilter as EstadoAsistencia | undefined) || undefined,
  });

  const filtered = useMemo(() => {
    if (!registros) return [];
    return registros.filter((r) => {
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        if (!r.colaborador_nombre.toLowerCase().includes(term)) return false;
      }
      return true;
    });
  }, [registros, searchTerm]);

  const handleCreate = () => {
    setIsFormOpen(true);
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        icon={
          <div className={`p-2 rounded-lg ${colorClasses.badge}`}>
            <UserCheck className={`h-5 w-5 ${colorClasses.icon}`} />
          </div>
        }
        title="Asistencia"
        description="Registros de entrada, salida y marcajes"
        variant="compact"
        actions={
          <div className="flex items-center gap-3 flex-nowrap">
            <Input
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              className="w-40"
            />
            <Input
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              className="w-40"
            />
            <Select
              value={estadoFilter}
              onChange={(e) => setEstadoFilter(e.target.value)}
              options={[{ value: '', label: 'Todos los estados' }, ...estadoAsistenciaOptions]}
              className="w-40"
            />
            <Input
              placeholder="Buscar colaborador..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-48"
            />
            <Button variant="primary" size="sm" onClick={handleCreate}>
              <Plus size={16} className="mr-1" />
              Nuevo Registro
            </Button>
          </div>
        }
      />

      <Card variant="bordered" padding="none">
        {isLoading ? (
          <div className="py-16 text-center">
            <Spinner size="lg" className="mx-auto" />
            <p className="mt-3 text-sm text-gray-500">Cargando registros...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16">
            <EmptyState
              icon={<UserCheck className="h-12 w-12 text-gray-300" />}
              title="Sin registros"
              description={
                searchTerm || estadoFilter || fechaInicio
                  ? 'No se encontraron registros con los filtros aplicados.'
                  : 'No hay registros de asistencia.'
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Fecha
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Colaborador
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Turno
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Entrada
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Salida
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Estado
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Horas
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Tardanza
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
                {filtered.map((registro) => (
                  <tr
                    key={registro.id}
                    className="group transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                      {new Date(registro.fecha).toLocaleDateString('es-CO', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {registro.colaborador_nombre}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                      {registro.turno_nombre || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                      {registro.hora_entrada || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                      {registro.hora_salida || '-'}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={ESTADO_BADGE[registro.estado]} size="sm">
                        {registro.estado}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                      {Number(registro.horas_trabajadas) > 0
                        ? `${Number(registro.horas_trabajadas).toFixed(1)}h`
                        : '-'}
                    </td>
                    <td className="px-4 py-3">
                      {registro.minutos_tardanza > 0 ? (
                        <span className="text-sm text-orange-600 dark:text-orange-400 font-medium">
                          {registro.minutos_tardanza} min
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!isLoading && filtered.length > 0 && (
          <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-3 text-sm text-gray-500">
            Mostrando {filtered.length} de {registros?.length || 0} registros
          </div>
        )}
      </Card>

      <RegistroAsistenciaFormModal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} />
    </div>
  );
};
