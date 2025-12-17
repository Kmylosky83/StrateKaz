/**
 * PermisosCargoSubTab - Gestión de permisos directos por cargo
 *
 * Permite asignar permisos específicos a cada cargo organizacional.
 * Los usuarios heredan automáticamente los permisos de su cargo.
 */
import { useState, useMemo, useEffect } from 'react';
import {
  Shield,
  Search,
  Edit2,
  Users,
  ChevronDown,
  ChevronRight,
  Check,
  AlertCircle,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/forms/Input';
import { Select } from '@/components/forms/Select';
import { Badge } from '@/components/common/Badge';
import { Card } from '@/components/common/Card';
import { Modal } from '@/components/common/Modal';
import {
  Permiso,
  PermisoAgrupado,
} from '../organizacion/roles/types';
import {
  useCargosConPermisos,
  useCargoPermisos,
  useAsignarPermisosCargo,
  usePermisosAgrupados,
} from '../../hooks/useRolesPermisos';

// Tipo para cargo desde API
interface CargoAPI {
  id: number;
  code: string;
  name: string;
  level: number;
  level_display: string;
  permissions_count: number;
  users_count: number;
  is_active: boolean;
  area_nombre?: string;
}

// ==================== COMPONENTES ====================

const NivelBadge = ({ nivel }: { nivel: number }) => {
  const config = {
    0: { label: 'Operativo', color: 'bg-gray-100 text-gray-700' },
    1: { label: 'Supervisión', color: 'bg-blue-100 text-blue-700' },
    2: { label: 'Coordinación', color: 'bg-purple-100 text-purple-700' },
    3: { label: 'Dirección', color: 'bg-amber-100 text-amber-700' },
  }[nivel] || { label: 'Desconocido', color: 'bg-gray-100 text-gray-700' };

  return (
    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${config.color}`}>
      {config.label}
    </span>
  );
};

interface PermisosCheckboxTreeProps {
  permisosAgrupados: PermisoAgrupado[];
  selectedIds: number[];
  onChange: (ids: number[]) => void;
}

const PermisosCheckboxTree = ({
  permisosAgrupados,
  selectedIds,
  onChange,
}: PermisosCheckboxTreeProps) => {
  const [expandedModules, setExpandedModules] = useState<string[]>(
    permisosAgrupados.map((g) => g.module)
  );

  const toggleModule = (module: string) => {
    setExpandedModules((prev) =>
      prev.includes(module)
        ? prev.filter((m) => m !== module)
        : [...prev, module]
    );
  };

  const togglePermiso = (permisoId: number) => {
    onChange(
      selectedIds.includes(permisoId)
        ? selectedIds.filter((id) => id !== permisoId)
        : [...selectedIds, permisoId]
    );
  };

  const toggleModulePermisos = (permisos: Permiso[]) => {
    const permisoIds = permisos.map((p) => p.id);
    const allSelected = permisoIds.every((id) => selectedIds.includes(id));

    if (allSelected) {
      onChange(selectedIds.filter((id) => !permisoIds.includes(id)));
    } else {
      onChange([...new Set([...selectedIds, ...permisoIds])]);
    }
  };

  return (
    <div className="space-y-2 max-h-96 overflow-y-auto">
      {permisosAgrupados.map((grupo) => {
        const isExpanded = expandedModules.includes(grupo.module);
        const permisoIds = grupo.permissions.map((p) => p.id);
        const selectedCount = permisoIds.filter((id) =>
          selectedIds.includes(id)
        ).length;
        const allSelected = selectedCount === grupo.permissions.length;
        const someSelected = selectedCount > 0 && !allSelected;

        return (
          <div key={grupo.module} className="border rounded-lg overflow-hidden">
            {/* Header del módulo */}
            <div
              className="flex items-center gap-3 p-3 bg-gray-50 cursor-pointer hover:bg-gray-100"
              onClick={() => toggleModule(grupo.module)}
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 text-gray-500" />
              ) : (
                <ChevronRight className="h-4 w-4 text-gray-500" />
              )}

              <input
                type="checkbox"
                checked={allSelected}
                ref={(el) => {
                  if (el) el.indeterminate = someSelected;
                }}
                onChange={(e) => {
                  e.stopPropagation();
                  toggleModulePermisos(grupo.permissions);
                }}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />

              <span className="font-medium text-gray-900">{grupo.label}</span>

              <span className="ml-auto text-sm text-gray-500">
                {selectedCount} / {grupo.permissions.length}
              </span>
            </div>

            {/* Lista de permisos */}
            {isExpanded && (
              <div className="divide-y divide-gray-100">
                {grupo.permissions.map((permiso) => (
                  <label
                    key={permiso.id}
                    className="flex items-center gap-3 px-3 py-2 pl-10 hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(permiso.id)}
                      onChange={() => togglePermiso(permiso.id)}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <div className="text-sm text-gray-900">{permiso.name}</div>
                      <div className="text-xs text-gray-500">{permiso.code}</div>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

interface CargoPermisosModalProps {
  cargo: CargoAPI;
  open: boolean;
  onClose: () => void;
  onSave: (cargoId: number, permisoIds: number[]) => Promise<void>;
  permisosAgrupados: PermisoAgrupado[];
  isLoading?: boolean;
}

const CargoPermisosModal = ({
  cargo,
  open,
  onClose,
  onSave,
  permisosAgrupados,
  isLoading = false,
}: CargoPermisosModalProps) => {
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // Cargar permisos actuales del cargo desde API
  const { data: cargoDetalle, isLoading: loadingDetalle } = useCargoPermisos(cargo?.id || null);

  // Inicializar selectedIds cuando se carguen los permisos del cargo
  useEffect(() => {
    if (cargoDetalle?.permissions) {
      setSelectedIds(cargoDetalle.permissions.map((p: any) => p.id));
    }
  }, [cargoDetalle]);

  const handleSave = async () => {
    await onSave(cargo.id, selectedIds);
  };

  const isLoadingAll = loadingDetalle || isLoading;

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title={`Permisos: ${cargo.name}`}
      size="lg"
    >
      <div className="space-y-4">
        {/* Info del cargo */}
        <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
          <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
            <Shield className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h4 className="font-medium text-gray-900">{cargo.name}</h4>
            <div className="flex items-center gap-2 mt-1">
              <NivelBadge nivel={cargo.level} />
              <span className="text-sm text-gray-500">
                {cargo.users_count} usuario(s) afectado(s)
              </span>
            </div>
          </div>
        </div>

        {/* Advertencia */}
        <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-amber-700">
            <strong>Importante:</strong> Los cambios en permisos afectan
            inmediatamente a todos los usuarios con este cargo (
            {cargo.users_count} usuario(s)).
          </div>
        </div>

        {/* Selector de permisos */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3">
            Seleccionar permisos ({selectedIds.length} seleccionados)
          </h4>
          {loadingDetalle ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
              <span className="ml-2 text-gray-500">Cargando permisos...</span>
            </div>
          ) : (
            <PermisosCheckboxTree
              permisosAgrupados={permisosAgrupados}
              selectedIds={selectedIds}
              onChange={setSelectedIds}
            />
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
        <Button variant="outline" onClick={onClose} disabled={isLoadingAll}>
          Cancelar
        </Button>
        <Button onClick={handleSave} disabled={isLoadingAll}>
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <Check className="h-4 w-4 mr-2" />
              Guardar Permisos
            </>
          )}
        </Button>
      </div>
    </Modal>
  );
};

// ==================== COMPONENTE PRINCIPAL ====================

export const PermisosCargoSubTab = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [nivelFilter, setNivelFilter] = useState<string>('');
  const [selectedCargo, setSelectedCargo] = useState<CargoAPI | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // API Queries
  const {
    data: cargosData,
    isLoading: loadingCargos,
    error: cargosError,
    refetch: refetchCargos
  } = useCargosConPermisos({ search: searchQuery || undefined });

  const { data: permisosAgrupadosData, isLoading: loadingPermisos } = usePermisosAgrupados();

  // Mutation para asignar permisos
  const asignarPermisos = useAsignarPermisosCargo();

  // Obtener cargos de la API
  const cargos: CargoAPI[] = useMemo(() => {
    if (!cargosData) return [];
    return Array.isArray(cargosData) ? cargosData : (cargosData.results || []);
  }, [cargosData]);

  // Obtener permisos agrupados
  const permisosAgrupados: PermisoAgrupado[] = useMemo(() => {
    if (!permisosAgrupadosData) return [];
    return Array.isArray(permisosAgrupadosData) ? permisosAgrupadosData : [];
  }, [permisosAgrupadosData]);

  // Filtrar cargos localmente
  const filteredCargos = useMemo(() => {
    return cargos.filter((cargo) => {
      const matchesSearch =
        !searchQuery ||
        cargo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cargo.code.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesNivel =
        !nivelFilter || cargo.level === parseInt(nivelFilter);

      return matchesSearch && matchesNivel;
    });
  }, [cargos, searchQuery, nivelFilter]);

  const handleEditPermisos = (cargo: CargoAPI) => {
    setSelectedCargo(cargo);
    setIsModalOpen(true);
  };

  const handleSavePermisos = async (cargoId: number, permisoIds: number[]) => {
    await asignarPermisos.mutateAsync({ cargoId, permissionIds: permisoIds });
    setIsModalOpen(false);
    setSelectedCargo(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Permisos por Cargo
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Asigna permisos a cada cargo. Los usuarios heredan automáticamente
            los permisos de su cargo.
          </p>
        </div>
      </div>

      {/* Filtros */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Buscar por nombre o código..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search className="h-4 w-4 text-gray-400" />}
            />
          </div>
          <div className="w-full sm:w-48">
            <Select
              value={nivelFilter}
              onChange={(e) => setNivelFilter(e.target.value)}
              options={[
                { value: '', label: 'Todos los niveles' },
                { value: '3', label: 'Dirección' },
                { value: '2', label: 'Coordinación' },
                { value: '1', label: 'Supervisión' },
                { value: '0', label: 'Operativo' },
              ]}
            />
          </div>
        </div>
      </Card>

      {/* Error state */}
      {cargosError && (
        <Card className="p-4 bg-red-50 border-red-200">
          <p className="text-red-700">Error al cargar los cargos. Por favor, intente de nuevo.</p>
        </Card>
      )}

      {/* Tabla de cargos */}
      <Card>
        {loadingCargos ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            <span className="ml-2 text-gray-500">Cargando cargos...</span>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cargo
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nivel
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Área
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Permisos
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Usuarios
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredCargos.map((cargo) => (
                    <tr key={cargo.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4">
                        <div>
                          <div className="font-medium text-gray-900">
                            {cargo.name}
                          </div>
                          <div className="text-sm text-gray-500">{cargo.code}</div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <NivelBadge nivel={cargo.level} />
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-500">
                        {cargo.level_display || cargo.area_nombre || '-'}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <Badge variant="info">
                          {cargo.permissions_count} permisos
                        </Badge>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <div className="flex items-center justify-center gap-1 text-sm text-gray-500">
                          <Users className="h-4 w-4" />
                          {cargo.users_count}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditPermisos(cargo)}
                        >
                          <Edit2 className="h-4 w-4 mr-1" />
                          Editar Permisos
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredCargos.length === 0 && !loadingCargos && (
              <div className="text-center py-12">
                <Shield className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No se encontraron cargos
                </h3>
                <p className="text-gray-500">
                  Ajusta los filtros para ver los cargos disponibles.
                </p>
              </div>
            )}
          </>
        )}
      </Card>

      {/* Modal de edición */}
      {selectedCargo && (
        <CargoPermisosModal
          cargo={selectedCargo}
          open={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedCargo(null);
          }}
          onSave={handleSavePermisos}
          permisosAgrupados={permisosAgrupados}
          isLoading={asignarPermisos.isPending}
        />
      )}
    </div>
  );
};
