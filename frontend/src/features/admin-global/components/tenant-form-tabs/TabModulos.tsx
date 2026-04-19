/**
 * Tab Modulos - Seleccion de modulos habilitados para la empresa.
 */
import { Check, Clock } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { AVAILABLE_MODULES, isModuleDeployed } from '@/constants/modules';
import { CATEGORY_LABELS } from './constants';
import type { TabModulosProps } from './types';

export const TabModulos = ({ formData, handleModuleToggle }: TabModulosProps) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Selecciona los modulos que estaran disponibles para esta empresa.
        </p>
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {formData.enabled_modules?.length || 0} de {AVAILABLE_MODULES.length}
        </span>
      </div>

      <div className="space-y-4">
        {Object.keys(CATEGORY_LABELS).map((category) => {
          const categoryModules = AVAILABLE_MODULES.filter((m) => m.category === category);
          if (categoryModules.length === 0) return null;

          const categoryInfo = CATEGORY_LABELS[category];

          return (
            <div key={category}>
              <div className="flex items-center gap-2 mb-2">
                {categoryInfo.icon}
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                  {categoryInfo.label}
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {categoryModules.map((module) => {
                  const isEnabled = formData.enabled_modules?.includes(module.code) ?? false;
                  const isDeployed = isModuleDeployed(module.code);
                  return (
                    <Button
                      key={module.code}
                      type="button"
                      size="sm"
                      variant={isEnabled ? 'outline' : 'ghost'}
                      onClick={() => handleModuleToggle(module.code)}
                      className={`flex items-center gap-2 !justify-start text-left text-sm w-full ${
                        isEnabled
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                          : isDeployed
                            ? 'border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                            : 'border border-dashed border-gray-200 dark:border-gray-700 opacity-60 hover:opacity-80'
                      }`}
                    >
                      <div
                        className={`flex-shrink-0 w-4 h-4 rounded flex items-center justify-center ${
                          isEnabled ? 'bg-primary-500 text-white' : 'bg-gray-200 dark:bg-gray-700'
                        }`}
                      >
                        {isEnabled && <Check className="h-3 w-3" />}
                      </div>
                      <span
                        className={`truncate flex-1 ${
                          isEnabled
                            ? 'text-primary-700 dark:text-primary-300 font-medium'
                            : 'text-gray-600 dark:text-gray-400'
                        }`}
                      >
                        {module.name}
                      </span>
                      {!isDeployed && <Clock className="h-3 w-3 flex-shrink-0 text-gray-400" />}
                    </Button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {formData.enabled_modules?.length === 0 && (
        <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
          Ningun modulo seleccionado. La empresa no vera ningun modulo en el sidebar.
        </p>
      )}
    </div>
  );
};
