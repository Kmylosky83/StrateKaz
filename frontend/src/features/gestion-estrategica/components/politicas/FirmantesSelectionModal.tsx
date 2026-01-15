/**
 * Modal de Seleccion de Firmantes por Cargo
 * Sistema de Gestion StrateKaz v3.1
 *
 * Permite seleccionar CARGOS (no usuarios especificos) para revision y aprobacion.
 * Al seleccionar un cargo, se notificara a TODOS los usuarios de ese cargo.
 *
 * Flujo:
 * 1. ELABORO: Usuario actual (automatico)
 * 2. REVISO_TECNICO: Cargo seleccionado para revision tecnica
 * 3. APROBO_GERENTE: Cargo seleccionado para aprobacion final
 */
import { useState, useMemo } from 'react';
import { X, UserCheck, Users, Search, AlertCircle, Building2, ChevronRight } from 'lucide-react';

// Design System
import { Button } from '@/components/common/Button';

// Hooks
import { useBrandingConfig } from '@/hooks/useBrandingConfig';
import { useAuthStore } from '@/store/authStore';
import { useCargos } from '@/features/configuracion/hooks/useCargos';

// Types
import type { CargoList, NivelJerarquico } from '@/features/configuracion/types/rbac.types';

// ============================================================================
// TYPES
// ============================================================================

export interface CargoFirmanteSeleccion {
  rol_firmante: 'REVISO_TECNICO' | 'REVISO_JURIDICO' | 'APROBO_DIRECTOR' | 'APROBO_GERENTE' | 'APROBO_REPRESENTANTE_LEGAL';
  cargo_id: number;
  cargo_nombre?: string;
}

interface FirmantesSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (firmantes: CargoFirmanteSeleccion[]) => void;
  isLoading?: boolean;
}

// ============================================================================
// ROLES DISPONIBLES PARA FIRMA
// ============================================================================

const ROLES_DISPONIBLES = [
  {
    code: 'REVISO_TECNICO' as const,
    label: 'Reviso (Tecnico)',
    description: 'Revision tecnica del contenido de la politica',
    orden: 2,
    required: true,
    nivelesRecomendados: ['TACTICO', 'OPERATIVO'] as NivelJerarquico[],
  },
  {
    code: 'APROBO_GERENTE' as const,
    label: 'Aprobo (Gerente)',
    description: 'Aprobacion final de la politica',
    orden: 3,
    required: true,
    nivelesRecomendados: ['ESTRATEGICO', 'TACTICO'] as NivelJerarquico[],
  },
];

// ============================================================================
// HELPERS
// ============================================================================

const getNivelColor = (nivel: NivelJerarquico): string => {
  const colors: Record<NivelJerarquico, string> = {
    ESTRATEGICO: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
    TACTICO: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    OPERATIVO: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    APOYO: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    EXTERNO: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  };
  return colors[nivel] || colors.APOYO;
};

// ============================================================================
// COMPONENT
// ============================================================================

export function FirmantesSelectionModal({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
}: FirmantesSelectionModalProps) {
  const { primaryColor } = useBrandingConfig();
  const currentUser = useAuthStore((state) => state.user);

  // Obtener cargos de la empresa
  const { data: cargosData, isLoading: isLoadingCargos } = useCargos({
    is_active: true,
    page_size: 100,
  });

  const cargos = useMemo(() => {
    if (!cargosData) return [];
    // Si es paginado
    if ('results' in cargosData) {
      return cargosData.results as CargoList[];
    }
    // Si es array directo
    return cargosData as CargoList[];
  }, [cargosData]);

  // Estado para la seleccion de cargos por rol
  const [selectedCargos, setSelectedCargos] = useState<Record<string, number | null>>({
    REVISO_TECNICO: null,
    APROBO_GERENTE: null,
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [expandedRol, setExpandedRol] = useState<string | null>('REVISO_TECNICO');

  // Filtrar cargos por busqueda
  const filteredCargos = useMemo(() => {
    if (!searchTerm) return cargos;
    const term = searchTerm.toLowerCase();
    return cargos.filter(
      (c) =>
        c.name.toLowerCase().includes(term) ||
        c.code.toLowerCase().includes(term) ||
        c.area_nombre?.toLowerCase().includes(term) ||
        c.nivel_jerarquico_display?.toLowerCase().includes(term)
    );
  }, [cargos, searchTerm]);

  // Handlers
  const handleSelectCargo = (rol: string, cargoId: number) => {
    setSelectedCargos((prev) => ({
      ...prev,
      [rol]: cargoId,
    }));
    // Expandir siguiente rol si existe
    const currentIndex = ROLES_DISPONIBLES.findIndex(r => r.code === rol);
    if (currentIndex < ROLES_DISPONIBLES.length - 1) {
      setExpandedRol(ROLES_DISPONIBLES[currentIndex + 1].code);
    } else {
      setExpandedRol(null);
    }
  };

  const handleConfirm = () => {
    const firmantes: CargoFirmanteSeleccion[] = ROLES_DISPONIBLES
      .filter((rol) => selectedCargos[rol.code] !== null)
      .map((rol) => {
        const cargo = cargos.find(c => c.id === selectedCargos[rol.code]);
        return {
          rol_firmante: rol.code,
          cargo_id: selectedCargos[rol.code] as number,
          cargo_nombre: cargo?.name,
        };
      });

    onConfirm(firmantes);
  };

  // Validar que todos los roles requeridos esten seleccionados
  const canConfirm = ROLES_DISPONIBLES.every(
    (rol) => !rol.required || selectedCargos[rol.code] !== null
  );

  // Obtener cargo seleccionado para mostrar resumen
  const getSelectedCargoName = (rolCode: string): string | null => {
    const cargoId = selectedCargos[rolCode];
    if (!cargoId) return null;
    const cargo = cargos.find(c => c.id === cargoId);
    return cargo?.name || null;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-2xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl transform transition-all">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div
                className="p-2 rounded-lg"
                style={{ backgroundColor: `${primaryColor}20` }}
              >
                <Building2 className="w-5 h-5" style={{ color: primaryColor }} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Seleccionar Cargos Firmantes
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Elija los cargos que revisaran y aprobaran la politica
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Info del Elaborador */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <Users className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-900 dark:text-blue-100">
                    Usted sera el Elaborador
                  </h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                    Como creador de la politica, usted firmara primero como
                    &quot;Elaboro&quot; ({currentUser?.first_name || currentUser?.username})
                    {currentUser?.cargo && (
                      <span className="ml-1">- {currentUser.cargo.name}</span>
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Info sobre notificacion por cargo */}
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-amber-900 dark:text-amber-100">
                    Notificacion por Cargo
                  </h4>
                  <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                    Al seleccionar un cargo, se notificara a <strong>TODOS</strong> los usuarios
                    asignados a ese cargo. Cualquiera de ellos podra firmar.
                  </p>
                </div>
              </div>
            </div>

            {/* Busqueda de cargos */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar cargo por nombre, codigo o area..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {/* Seleccion de cargos por rol */}
            <div className="space-y-3">
              {ROLES_DISPONIBLES.map((rol) => {
                const isExpanded = expandedRol === rol.code;
                const selectedCargoName = getSelectedCargoName(rol.code);
                const isSelected = selectedCargos[rol.code] !== null;

                return (
                  <div
                    key={rol.code}
                    className={`border rounded-xl overflow-hidden transition-all ${
                      isSelected
                        ? 'border-primary-500 dark:border-primary-400'
                        : 'border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    {/* Encabezado del rol */}
                    <button
                      type="button"
                      onClick={() => setExpandedRol(isExpanded ? null : rol.code)}
                      className="w-full p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            isSelected
                              ? 'bg-primary-500 text-white'
                              : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
                          }`}
                        >
                          {isSelected ? (
                            <UserCheck className="w-4 h-4" />
                          ) : (
                            <span className="text-sm font-medium">{rol.orden}</span>
                          )}
                        </div>
                        <div className="text-left">
                          <h4 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                            {rol.label}
                            {rol.required && (
                              <span className="text-xs text-red-500">*</span>
                            )}
                          </h4>
                          {selectedCargoName ? (
                            <p className="text-sm text-primary-600 dark:text-primary-400 font-medium">
                              {selectedCargoName}
                            </p>
                          ) : (
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {rol.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <ChevronRight
                        className={`w-5 h-5 text-gray-400 transition-transform ${
                          isExpanded ? 'rotate-90' : ''
                        }`}
                      />
                    </button>

                    {/* Lista de cargos expandible */}
                    {isExpanded && (
                      <div className="border-t border-gray-200 dark:border-gray-700 max-h-60 overflow-y-auto">
                        {isLoadingCargos ? (
                          <div className="p-4 text-center text-gray-500">
                            Cargando cargos...
                          </div>
                        ) : filteredCargos.length === 0 ? (
                          <div className="p-4 text-center text-gray-500">
                            No se encontraron cargos
                          </div>
                        ) : (
                          <div className="divide-y divide-gray-100 dark:divide-gray-800">
                            {filteredCargos.map((cargo) => {
                              const isCargoSelected = selectedCargos[rol.code] === cargo.id;
                              const isRecommended = rol.nivelesRecomendados.includes(cargo.nivel_jerarquico);

                              return (
                                <button
                                  key={cargo.id}
                                  type="button"
                                  onClick={() => handleSelectCargo(rol.code, cargo.id)}
                                  className={`w-full p-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                                    isCargoSelected
                                      ? 'bg-primary-50 dark:bg-primary-900/20'
                                      : ''
                                  }`}
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                                      <Building2 className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                                    </div>
                                    <div className="text-left">
                                      <div className="flex items-center gap-2">
                                        <p className="font-medium text-gray-900 dark:text-white">
                                          {cargo.name}
                                        </p>
                                        {isRecommended && (
                                          <span className="px-1.5 py-0.5 text-[10px] font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded">
                                            Recomendado
                                          </span>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-2 mt-0.5">
                                        <span className={`px-2 py-0.5 text-xs font-medium rounded ${getNivelColor(cargo.nivel_jerarquico)}`}>
                                          {cargo.nivel_jerarquico_display || cargo.nivel_jerarquico}
                                        </span>
                                        {cargo.area_nombre && (
                                          <span className="text-xs text-gray-500 dark:text-gray-400">
                                            {cargo.area_nombre}
                                          </span>
                                        )}
                                        <span className="text-xs text-gray-400">
                                          ({cargo.users_count || 0} usuarios)
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                  {isCargoSelected && (
                                    <div
                                      className="w-6 h-6 rounded-full flex items-center justify-center"
                                      style={{ backgroundColor: primaryColor }}
                                    >
                                      <UserCheck className="w-4 h-4 text-white" />
                                    </div>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Alerta si no se han seleccionado todos */}
            {!canConfirm && (
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">
                  Debe seleccionar un cargo para cada rol requerido
                </span>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
            <Button variant="ghost" onClick={onClose} disabled={isLoading}>
              Cancelar
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={!canConfirm || isLoading}
              style={{ backgroundColor: primaryColor }}
            >
              {isLoading ? 'Iniciando firma...' : 'Iniciar Proceso de Firma'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FirmantesSelectionModal;
