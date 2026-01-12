/**
 * MatrizPermisosSection - Matriz de Permisos por Cargo (Refactorizado)
 *
 * Muestra la estructura real de módulos del sistema (SystemModule > ModuleTab > TabSection)
 * permitiendo configurar qué módulos/tabs/secciones puede acceder cada cargo.
 *
 * Ubicación: Gestión Estratégica > Organización > Control de Acceso > Acceso a Secciones
 */
import { useCallback } from 'react';
import { AlertTriangle, RotateCcw, Save, Loader2 } from 'lucide-react';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Spinner } from '@/components/common/Spinner';
import { StatsGrid, StatsGridSkeleton } from '@/components/layout';
import { cn } from '@/lib/utils';
import { useMatrizPermisos } from '../../hooks/useMatrizPermisos';

// Sub-componentes
import { MatrizPermisosHeader } from './MatrizPermisosHeader';
import { CargoSelector } from './CargoSelector';
import { CargosResumenTable } from './CargosResumenTable';
import { ModuleRow } from './ModuleRow';
import { TabRow } from './TabRow';
import { SectionRow } from './SectionRow';
import { ChangesAlert } from './ChangesAlert';
import { exportMatrizToExcel } from './ExcelExporter';

export const MatrizPermisosSection = () => {
  const {
    // Estado
    selectedCargoId,
    selectedCargo,
    cargosList,
    cargoOptions,
    expandedModules,
    expandedTabs,
    selectedSections,
    hasChanges,
    // Data
    modulesTree,
    stats,
    statsItems,
    // Loading
    isLoading,
    isLoadingCargos,
    isLoadingAccess,
    isSaving,
    // Handlers
    handleCargoChange,
    toggleModule,
    toggleTab,
    toggleSection,
    toggleAllSectionsInTab,
    toggleAllSectionsInModule,
    handleSave,
    handleReset,
    // Helpers
    getModuleSelectionState,
    getTabSelectionState,
    getModuleSectionsCount,
  } = useMatrizPermisos();

  // Handler para exportar Excel
  const handleExportExcel = useCallback(() => {
    exportMatrizToExcel({
      modulesTree,
      cargos: cargosList,
      selectedCargo,
      selectedSections,
    });
  }, [modulesTree, cargosList, selectedCargo, selectedSections]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <MatrizPermisosHeader
        onExport={handleExportExcel}
        isLoading={isLoading}
        cargoName={selectedCargo?.name}
      />

      {/* Stats */}
      {isLoading ? <StatsGridSkeleton count={4} /> : <StatsGrid stats={statsItems} columns={4} />}

      {/* Selector de cargo */}
      <CargoSelector
        options={cargoOptions}
        selectedCargoId={selectedCargoId}
        onCargoChange={handleCargoChange}
        selectedCargo={selectedCargo}
        isLoadingCargos={isLoadingCargos}
        isLoadingAccess={isLoadingAccess}
        stats={stats}
      />

      {/* Alerta de módulos sin secciones */}
      {stats.modulesWithoutSections > 0 && selectedCargoId && (
        <div
          className={cn(
            'flex items-start gap-3 p-3 rounded-lg',
            'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800'
          )}
        >
          <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
              {stats.modulesWithoutSections} módulo(s) sin secciones configuradas
            </p>
            <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-0.5">
              Estos módulos aparecen en gris porque aún no tienen tabs/secciones. Configure la
              estructura en &quot;Configuración &gt; Módulos&quot;.
            </p>
          </div>
        </div>
      )}

      {/* Contenido principal */}
      {!selectedCargoId ? (
        <CargosResumenTable cargos={cargosList} onCargoSelect={handleCargoChange} />
      ) : isLoading || isLoadingAccess ? (
        <Card className="p-12">
          <div className="flex flex-col items-center justify-center">
            <Spinner size="lg" />
            <p className="text-gray-500 dark:text-gray-400 mt-4">
              {isLoadingAccess ? 'Cargando permisos del cargo...' : 'Cargando estructura de módulos...'}
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Alerta de cambios pendientes */}
          <ChangesAlert
            hasChanges={hasChanges}
            onSave={handleSave}
            onReset={handleReset}
            isSaving={isSaving}
          />

          {/* Árbol de módulos */}
          <Card className="divide-y divide-gray-200 dark:divide-gray-700">
            {modulesTree?.modules
              .filter((m) => m.is_enabled)
              .map((module) => (
                <ModuleRow
                  key={module.id}
                  module={module}
                  isExpanded={expandedModules.has(module.id)}
                  selectionState={getModuleSelectionState(module)}
                  sectionsCount={getModuleSectionsCount(module)}
                  onToggle={() => toggleModule(module.id)}
                  onToggleAll={() => toggleAllSectionsInModule(module)}
                >
                  {module.tabs
                    .filter((t) => t.is_enabled)
                    .map((tab) => (
                      <TabRow
                        key={tab.id}
                        tab={tab}
                        isExpanded={expandedTabs.has(tab.id)}
                        selectionState={getTabSelectionState(tab)}
                        onToggle={() => toggleTab(tab.id)}
                        onToggleAll={() => toggleAllSectionsInTab(tab)}
                      >
                        {tab.sections
                          .filter((s) => s.is_enabled)
                          .map((section) => (
                            <SectionRow
                              key={section.id}
                              section={section}
                              isSelected={selectedSections.has(section.id)}
                              onToggle={() => toggleSection(section.id)}
                            />
                          ))}
                      </TabRow>
                    ))}
                </ModuleRow>
              ))}
          </Card>

          {/* Botones de guardado */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button variant="outline" onClick={handleReset} disabled={!hasChanges || isSaving}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Restablecer
            </Button>
            <Button variant="primary" onClick={handleSave} disabled={!hasChanges || isSaving}>
              {isSaving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {isSaving ? 'Guardando...' : 'Guardar Permisos'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
