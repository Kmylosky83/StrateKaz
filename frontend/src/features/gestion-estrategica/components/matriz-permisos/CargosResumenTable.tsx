/**
 * Tabla de resumen de cargos (cuando no hay cargo seleccionado)
 */
import { Briefcase, Users, Settings } from 'lucide-react';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { cn } from '@/lib/utils';
import type { CargosResumenTableProps } from './types';

const getNivelVariant = (nivel: string) => {
  switch (nivel) {
    case 'ESTRATEGICO':
      return 'danger';
    case 'TACTICO':
      return 'info';
    case 'OPERATIVO':
      return 'success';
    case 'APOYO':
      return 'primary';
    case 'EXTERNO':
      return 'warning';
    default:
      return 'gray';
  }
};

export const CargosResumenTable = ({ cargos, onCargoSelect }: CargosResumenTableProps) => {
  return (
    <Card className="overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Users className="h-4 w-4 text-purple-600" />
          Resumen de Permisos por Cargo
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          Seleccione un cargo de la tabla o del selector superior para configurar sus permisos
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800/30">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">
                Cargo
              </th>
              <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">
                Área
              </th>
              <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">
                Nivel
              </th>
              <th className="px-4 py-3 text-center font-medium text-gray-600 dark:text-gray-400">
                Usuarios
              </th>
              <th className="px-4 py-3 text-center font-medium text-gray-600 dark:text-gray-400">
                Permisos
              </th>
              <th className="px-4 py-3 text-center font-medium text-gray-600 dark:text-gray-400">
                Acción
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {cargos.map((cargo) => (
              <tr
                key={cargo.id}
                className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors cursor-pointer"
                onClick={() => onCargoSelect(cargo.id)}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-gray-400" />
                    <span className="font-medium text-gray-900 dark:text-white">
                      {cargo.name}
                    </span>
                    {cargo.is_system && (
                      <Badge variant="gray" size="sm">
                        Sistema
                      </Badge>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                  {cargo.area_nombre || '-'}
                </td>
                <td className="px-4 py-3">
                  <Badge variant={getNivelVariant(cargo.nivel_jerarquico)} size="sm">
                    {cargo.nivel_jerarquico}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-center">
                  <span
                    className={cn(
                      'inline-flex items-center justify-center min-w-[2rem] px-2 py-0.5 rounded-full text-xs font-medium',
                      (cargo.users_count || 0) > 0
                        ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                        : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                    )}
                  >
                    {cargo.users_count || 0}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span
                    className={cn(
                      'inline-flex items-center justify-center min-w-[2rem] px-2 py-0.5 rounded-full text-xs font-medium',
                      (cargo.permissions_count || 0) > 0
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                        : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                    )}
                  >
                    {cargo.permissions_count || 0}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onCargoSelect(cargo.id);
                    }}
                    className="text-purple-600 hover:text-purple-700 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                    title="Configurar permisos"
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {cargos.length === 0 && (
        <div className="p-12 text-center">
          <Briefcase className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">No hay cargos configurados</p>
        </div>
      )}
    </Card>
  );
};
