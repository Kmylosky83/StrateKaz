/**
 * TodosPermisosSubTab - Vista de referencia de todos los permisos del sistema
 *
 * Muestra los permisos organizados por módulo con:
 * - Filtros por módulo y acción
 * - Búsqueda por nombre o código
 * - Información de uso (cargos y roles que lo usan)
 *
 * DINÁMICO: Consume datos desde la API /core/permissions/
 */
import { useState, useMemo } from 'react';
import {
  Shield,
  Search,
  Eye,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  Download,
  Settings,
  Filter,
  ChevronDown,
  ChevronRight,
  Users,
  Briefcase,
  Info,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/forms/Input';
import { Select } from '@/components/forms/Select';
import { Badge } from '@/components/common/Badge';
import { Card } from '@/components/common/Card';
import { Tooltip } from '@/components/common/Tooltip';
import type { Permiso, PermisoAgrupado } from '../organizacion/roles/types';
import {
  usePermisos,
  usePermisosAgrupados,
  usePermisoModulos,
  usePermisoAcciones,
} from '../../hooks/useRolesPermisos';

// ==================== HELPERS ====================

// Mapeo de iconos por acción (dinámico, acepta cualquier string)
const getAccionIcon = (action: string) => {
  const icons: Record<string, typeof Eye> = {
    VIEW: Eye,
    VIEW_LIST: Eye,
    VIEW_DETAIL: Eye,
    CREATE: Plus,
    EDIT: Edit,
    DELETE: Trash2,
    APPROVE: CheckCircle,
    REJECT: Trash2,
    CANCEL: Trash2,
    EXPORT: Download,
    IMPORT: Download,
    PRINT: Download,
    MANAGE: Settings,
    ASSIGN: Users,
    EXECUTE: CheckCircle,
    AUDIT: Shield,
  };
  return icons[action] || Shield;
};

// Colores por acción (dinámico, acepta cualquier string)
const getAccionColor = (action: string) => {
  const colors: Record<string, string> = {
    VIEW: 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300',
    VIEW_LIST: 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300',
    VIEW_DETAIL: 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300',
    CREATE: 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300',
    EDIT: 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300',
    DELETE: 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300',
    APPROVE: 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300',
    REJECT: 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300',
    CANCEL: 'bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300',
    EXPORT: 'bg-cyan-100 dark:bg-cyan-900/50 text-cyan-700 dark:text-cyan-300',
    IMPORT: 'bg-cyan-100 dark:bg-cyan-900/50 text-cyan-700 dark:text-cyan-300',
    PRINT: 'bg-cyan-100 dark:bg-cyan-900/50 text-cyan-700 dark:text-cyan-300',
    MANAGE: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300',
    ASSIGN: 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300',
    EXECUTE: 'bg-teal-100 dark:bg-teal-900/50 text-teal-700 dark:text-teal-300',
    AUDIT: 'bg-pink-100 dark:bg-pink-900/50 text-pink-700 dark:text-pink-300',
  };
  return colors[action] || 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300';
};

const getScopeLabel = (scope: string) => {
  const labels: Record<string, { label: string; color: string }> = {
    OWN: { label: 'Propios', color: 'text-amber-600 dark:text-amber-400' },
    TEAM: { label: 'Equipo', color: 'text-blue-600 dark:text-blue-400' },
    ALL: { label: 'Todos', color: 'text-green-600 dark:text-green-400' },
  };
  return labels[scope] || { label: scope, color: 'text-gray-600 dark:text-gray-400' };
};

// Agrupar permisos por módulo (usa moduloOptions desde la API)
const agruparPermisosPorModulo = (
  permisos: Permiso[],
  moduloOptions: { value: string; label: string }[]
): PermisoAgrupado[] => {
  const grupos: Record<string, PermisoAgrupado> = {};

  permisos.forEach((permiso) => {
    if (!grupos[permiso.module]) {
      const moduloOption = moduloOptions.find((m) => m.value === permiso.module);
      grupos[permiso.module] = {
        module: permiso.module,
        label: moduloOption?.label || permiso.module,
        permissions: [],
      };
    }
    grupos[permiso.module].permissions.push(permiso);
  });

  return Object.values(grupos).sort((a, b) => a.label.localeCompare(b.label));
};

// ==================== COMPONENTE PRINCIPAL ====================

export const TodosPermisosSubTab = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [moduloFilter, setModuloFilter] = useState<string>('');
  const [accionFilter, setAccionFilter] = useState<string>('');
  const [expandedModules, setExpandedModules] = useState<string[]>([]);

  // API Queries - Catálogos dinámicos de módulos y acciones
  const { data: modulosAPI = [], isLoading: loadingModulos } = usePermisoModulos();
  const { data: accionesAPI = [], isLoading: loadingAcciones } = usePermisoAcciones();

  // API Queries - Datos de permisos
  const {
    data: permisosData,
    isLoading: loadingPermisos,
    error: permisosError,
    refetch: refetchPermisos,
  } = usePermisos({
    search: searchQuery || undefined,
    module: moduloFilter || undefined,
    action: accionFilter || undefined,
  });

  // También intentamos obtener permisos agrupados si el endpoint existe
  const { data: permisosAgrupadosAPI } = usePermisosAgrupados();

  // Opciones para los selects (desde la API)
  const moduloOptions = useMemo(() => {
    return modulosAPI.map((m) => ({ value: m.value, label: m.label }));
  }, [modulosAPI]);

  const accionOptions = useMemo(() => {
    return accionesAPI.map((a) => ({ value: a.value, label: a.label }));
  }, [accionesAPI]);

  // Obtener permisos de la API
  const permisos: Permiso[] = useMemo(() => {
    if (!permisosData) return [];
    return Array.isArray(permisosData) ? permisosData : (permisosData.results || []);
  }, [permisosData]);

  // Agrupar por módulo (usar API agrupada o agrupar localmente)
  const permisosAgrupados = useMemo(() => {
    if (permisosAgrupadosAPI && Array.isArray(permisosAgrupadosAPI) && permisosAgrupadosAPI.length > 0) {
      // Filtrar si hay filtros activos
      if (searchQuery || moduloFilter || accionFilter) {
        return permisosAgrupadosAPI
          .map((grupo) => ({
            ...grupo,
            permissions: grupo.permissions.filter((p) => {
              const matchesSearch = !searchQuery ||
                p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.code.toLowerCase().includes(searchQuery.toLowerCase());
              const matchesModulo = !moduloFilter || p.module === moduloFilter;
              const matchesAccion = !accionFilter || p.action === accionFilter;
              return matchesSearch && matchesModulo && matchesAccion;
            }),
          }))
          .filter((grupo) => grupo.permissions.length > 0);
      }
      return permisosAgrupadosAPI;
    }
    return agruparPermisosPorModulo(permisos, moduloOptions);
  }, [permisosAgrupadosAPI, permisos, searchQuery, moduloFilter, accionFilter, moduloOptions]);

  const toggleModule = (module: string) => {
    setExpandedModules((prev) =>
      prev.includes(module)
        ? prev.filter((m) => m !== module)
        : [...prev, module]
    );
  };

  const expandAll = () => {
    setExpandedModules(permisosAgrupados.map((g) => g.module));
  };

  const collapseAll = () => {
    setExpandedModules([]);
  };

  // Estadísticas calculadas desde los datos reales
  const stats = useMemo(() => {
    const allPermisos = permisosAgrupados.flatMap((g) => g.permissions);
    const byAction: Record<string, number> = {};
    const byModule: Record<string, number> = {};

    allPermisos.forEach((p) => {
      byAction[p.action] = (byAction[p.action] || 0) + 1;
      byModule[p.module] = (byModule[p.module] || 0) + 1;
    });

    return { byAction, byModule, total: allPermisos.length };
  }, [permisosAgrupados]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Catálogo de Permisos
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {loadingPermisos
              ? 'Cargando permisos...'
              : `Referencia completa de los ${stats.total} permisos del sistema`
            }
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={expandAll}
            disabled={loadingPermisos || permisosAgrupados.length === 0}
          >
            Expandir todo
          </Button>
          <span className="text-gray-300 dark:text-gray-600">|</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={collapseAll}
            disabled={loadingPermisos || expandedModules.length === 0}
          >
            Colapsar todo
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetchPermisos()}
            disabled={loadingPermisos}
          >
            <RefreshCw className={`h-4 w-4 ${loadingPermisos ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Resumen estadístico - Dinámico desde API */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {loadingAcciones ? (
          <Card className="p-3 col-span-full">
            <div className="flex items-center justify-center gap-2 text-gray-500 dark:text-gray-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Cargando acciones...</span>
            </div>
          </Card>
        ) : (
          accionOptions.map((accion) => {
            const Icon = getAccionIcon(accion.value);
            const count = stats.byAction[accion.value] || 0;
            return (
              <Card
                key={accion.value}
                className={`p-3 cursor-pointer transition-colors ${
                  accionFilter === accion.value
                    ? 'ring-2 ring-blue-500'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
                onClick={() =>
                  setAccionFilter(accionFilter === accion.value ? '' : accion.value)
                }
              >
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded ${getAccionColor(accion.value)}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {loadingPermisos ? '-' : count}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{accion.label}</div>
                  </div>
                </div>
              </Card>
            );
          })
        )}
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
              value={moduloFilter}
              onChange={(e) => setModuloFilter(e.target.value)}
              disabled={loadingModulos}
              options={[
                { value: '', label: loadingModulos ? 'Cargando...' : 'Todos los módulos' },
                ...moduloOptions,
              ]}
            />
          </div>
          <div className="w-full sm:w-48">
            <Select
              value={accionFilter}
              onChange={(e) => setAccionFilter(e.target.value)}
              disabled={loadingAcciones}
              options={[
                { value: '', label: loadingAcciones ? 'Cargando...' : 'Todas las acciones' },
                ...accionOptions,
              ]}
            />
          </div>
        </div>
      </Card>

      {/* Error state */}
      {permisosError && (
        <Card className="p-4 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700">
          <p className="text-red-700 dark:text-red-300">
            Error al cargar los permisos. Por favor, intente de nuevo.
          </p>
        </Card>
      )}

      {/* Loading state */}
      {loadingPermisos && (
        <Card className="p-12">
          <div className="flex flex-col items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500 dark:text-blue-400 mb-4" />
            <p className="text-gray-500 dark:text-gray-400">Cargando permisos del sistema...</p>
          </div>
        </Card>
      )}

      {/* Lista de permisos agrupados */}
      {!loadingPermisos && (
        <div className="space-y-3">
          {permisosAgrupados.map((grupo) => {
            const isExpanded = expandedModules.includes(grupo.module);

            return (
              <Card key={grupo.module} className="overflow-hidden">
                {/* Header del módulo */}
                <div
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={() => toggleModule(grupo.module)}
                >
                  <div className="flex items-center gap-3">
                    {isExpanded ? (
                      <ChevronDown className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                    )}
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-gray-100">{grupo.label}</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {grupo.permissions.length} permisos
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary">{grupo.permissions.length}</Badge>
                </div>

                {/* Lista de permisos */}
                {isExpanded && (
                  <div className="divide-y divide-gray-100 dark:divide-gray-700">
                    {grupo.permissions.map((permiso) => {
                      const AccionIcon = getAccionIcon(permiso.action);
                      const scopeInfo = getScopeLabel(permiso.scope);

                      return (
                        <div
                          key={permiso.id}
                          className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800"
                        >
                          <div className="flex items-center gap-3 flex-1">
                            <div
                              className={`p-2 rounded ${getAccionColor(
                                permiso.action
                              )}`}
                            >
                              <AccionIcon className="h-4 w-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-gray-900 dark:text-gray-100">
                                {permiso.name}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400 font-mono">
                                {permiso.code}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            {/* Alcance */}
                            <div className="text-right">
                              <div className="text-xs text-gray-400 dark:text-gray-500">Alcance</div>
                              <div className={`text-sm font-medium ${scopeInfo.color}`}>
                                {scopeInfo.label}
                              </div>
                            </div>

                            {/* Info uso - TODO: Conectar con API real cuando exista */}
                            <Tooltip content="Estadísticas de uso (próximamente)">
                              <div className="flex items-center gap-2 text-gray-400 dark:text-gray-500">
                                <div className="flex items-center gap-1">
                                  <Briefcase className="h-4 w-4" />
                                  <span className="text-xs">-</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Users className="h-4 w-4" />
                                  <span className="text-xs">-</span>
                                </div>
                              </div>
                            </Tooltip>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Empty state */}
      {!loadingPermisos && permisosAgrupados.length === 0 && (
        <Card className="p-12 text-center">
          <Filter className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            No se encontraron permisos
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Ajusta los filtros para ver los permisos disponibles.
          </p>
        </Card>
      )}

      {/* Leyenda */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Info className="h-4 w-4 text-blue-500 dark:text-blue-400" />
          <h4 className="font-medium text-gray-900 dark:text-gray-100">Leyenda de Alcances</h4>
        </div>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <span className="font-medium text-green-600 dark:text-green-400">Todos (ALL)</span>
            <p className="text-gray-500 dark:text-gray-400">
              Acceso a todos los registros del sistema
            </p>
          </div>
          <div>
            <span className="font-medium text-blue-600 dark:text-blue-400">Equipo (TEAM)</span>
            <p className="text-gray-500 dark:text-gray-400">
              Acceso a registros del equipo o área
            </p>
          </div>
          <div>
            <span className="font-medium text-amber-600 dark:text-amber-400">Propios (OWN)</span>
            <p className="text-gray-500 dark:text-gray-400">
              Solo registros creados por el usuario
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};
