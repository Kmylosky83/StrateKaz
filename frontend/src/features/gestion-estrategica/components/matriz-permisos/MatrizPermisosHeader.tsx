/**
 * Header de la Matriz de Permisos
 */
import { Shield, Download } from 'lucide-react';
import { Button } from '@/components/common/Button';
import type { MatrizPermisosHeaderProps } from './types';

export const MatrizPermisosHeader = ({
  onExport,
  isLoading,
  cargoName,
}: MatrizPermisosHeaderProps) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
          <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
            <Shield className="h-6 w-6 text-purple-600 dark:text-purple-400" />
          </div>
          Matriz de Permisos por Cargo
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Configure que módulos y secciones puede acceder cada cargo
        </p>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={onExport}
        disabled={isLoading}
        title={cargoName ? `Exportar permisos de ${cargoName}` : 'Exportar resumen de cargos'}
      >
        <Download className="h-4 w-4 mr-2" />
        Exportar Excel
      </Button>
    </div>
  );
};
