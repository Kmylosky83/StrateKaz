/**
 * Selector de Cargo con badges de información
 */
import { Briefcase, Users, Shield, Loader2 } from 'lucide-react';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { Select } from '@/components/forms/Select';
import { Spinner } from '@/components/common/Spinner';
import type { CargoSelectorProps } from './types';

export const CargoSelector = ({
  options,
  selectedCargoId,
  onCargoChange,
  selectedCargo,
  isLoadingCargos,
  isLoadingAccess,
  stats,
}: CargoSelectorProps) => {
  return (
    <Card className="p-4">
      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
        <div className="flex-1 max-w-md">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            <Briefcase className="inline h-4 w-4 mr-1" />
            Seleccione un Cargo
          </label>
          {isLoadingCargos ? (
            <div className="flex items-center gap-2 py-2">
              <Spinner size="sm" />
              <span className="text-sm text-gray-500">Cargando cargos...</span>
            </div>
          ) : (
            <Select
              value={selectedCargoId ?? ''}
              onChange={(e) => onCargoChange(e.target.value)}
              placeholder="-- Seleccione un cargo --"
              options={options}
            />
          )}
        </div>

        {/* Stats del cargo seleccionado */}
        {selectedCargo && (
          <div className="flex flex-wrap items-center gap-3">
            {isLoadingAccess ? (
              <Badge variant="gray" className="flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" />
                Cargando permisos...
              </Badge>
            ) : (
              <>
                <Badge variant="primary" className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {selectedCargo.users_count || 0} usuarios
                </Badge>
                <Badge variant="info" className="flex items-center gap-1">
                  <Shield className="h-3 w-3" />
                  {stats.selectedCount} de {stats.totalSections} secciones
                </Badge>
                {selectedCargo.area_nombre && (
                  <Badge variant="gray">{selectedCargo.area_nombre}</Badge>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};
