/**
 * TodosPermisosSubTab - Vista de referencia de todos los permisos del sistema
 *
 * Muestra los 68 permisos organizados por módulo con:
 * - Filtros por módulo y acción
 * - Búsqueda por nombre o código
 * - Información de uso (cargos y roles que lo usan)
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
} from 'lucide-react';
import { Input } from '@/components/forms/Input';
import { Select } from '@/components/forms/Select';
import { Badge } from '@/components/common/Badge';
import { Card } from '@/components/common/Card';
import { Tooltip } from '@/components/common/Tooltip';
import {
  Permiso,
  PermisoAgrupado,
  ModuloSistema,
  AccionPermiso,
  MODULO_OPTIONS,
  ACCION_OPTIONS,
} from '../organizacion/roles/types';

// ==================== DATOS MOCK - 68 PERMISOS ====================

const PERMISOS_COMPLETOS: Permiso[] = [
  // RECOLECCIONES - 13 permisos
  { id: 1, code: 'recolecciones.view_list', name: 'Ver lista de recolecciones', module: 'RECOLECCIONES', action: 'VIEW', scope: 'ALL' },
  { id: 2, code: 'recolecciones.view_detail', name: 'Ver detalle de recolección', module: 'RECOLECCIONES', action: 'VIEW', scope: 'ALL' },
  { id: 3, code: 'recolecciones.view_voucher', name: 'Ver comprobante de recolección', module: 'RECOLECCIONES', action: 'VIEW', scope: 'ALL' },
  { id: 4, code: 'recolecciones.view_certificado', name: 'Ver certificado de recolección', module: 'RECOLECCIONES', action: 'VIEW', scope: 'ALL' },
  { id: 5, code: 'recolecciones.create', name: 'Crear recolección', module: 'RECOLECCIONES', action: 'CREATE', scope: 'ALL' },
  { id: 6, code: 'recolecciones.update', name: 'Editar recolección', module: 'RECOLECCIONES', action: 'EDIT', scope: 'ALL' },
  { id: 7, code: 'recolecciones.delete', name: 'Eliminar recolección', module: 'RECOLECCIONES', action: 'DELETE', scope: 'ALL' },
  { id: 8, code: 'recolecciones.register', name: 'Registrar recolección propia', module: 'RECOLECCIONES', action: 'CREATE', scope: 'OWN' },
  { id: 9, code: 'recolecciones.generate_voucher', name: 'Generar comprobante', module: 'RECOLECCIONES', action: 'EXPORT', scope: 'ALL' },
  { id: 10, code: 'recolecciones.generate_certificate', name: 'Generar certificado', module: 'RECOLECCIONES', action: 'EXPORT', scope: 'ALL' },
  { id: 11, code: 'recolecciones.approve', name: 'Aprobar recolección', module: 'RECOLECCIONES', action: 'APPROVE', scope: 'ALL' },
  { id: 12, code: 'recolecciones.reject', name: 'Rechazar recolección', module: 'RECOLECCIONES', action: 'APPROVE', scope: 'ALL' },
  { id: 13, code: 'recolecciones.cancel', name: 'Cancelar recolección', module: 'RECOLECCIONES', action: 'MANAGE', scope: 'ALL' },

  // PROGRAMACIONES - 11 permisos
  { id: 14, code: 'programaciones.view_list', name: 'Ver lista de programaciones', module: 'PROGRAMACIONES', action: 'VIEW', scope: 'ALL' },
  { id: 15, code: 'programaciones.view_detail', name: 'Ver detalle de programación', module: 'PROGRAMACIONES', action: 'VIEW', scope: 'ALL' },
  { id: 16, code: 'programaciones.view_calendar', name: 'Ver calendario de rutas', module: 'PROGRAMACIONES', action: 'VIEW', scope: 'ALL' },
  { id: 17, code: 'programaciones.create', name: 'Crear programación', module: 'PROGRAMACIONES', action: 'CREATE', scope: 'ALL' },
  { id: 18, code: 'programaciones.update', name: 'Editar programación', module: 'PROGRAMACIONES', action: 'EDIT', scope: 'ALL' },
  { id: 19, code: 'programaciones.delete', name: 'Eliminar programación', module: 'PROGRAMACIONES', action: 'DELETE', scope: 'ALL' },
  { id: 20, code: 'programaciones.assign_collector', name: 'Asignar recolector', module: 'PROGRAMACIONES', action: 'MANAGE', scope: 'ALL' },
  { id: 21, code: 'programaciones.change_state', name: 'Cambiar estado', module: 'PROGRAMACIONES', action: 'MANAGE', scope: 'ALL' },
  { id: 22, code: 'programaciones.reprogram', name: 'Reprogramar', module: 'PROGRAMACIONES', action: 'EDIT', scope: 'ALL' },
  { id: 23, code: 'programaciones.confirm', name: 'Confirmar programación propia', module: 'PROGRAMACIONES', action: 'MANAGE', scope: 'OWN' },
  { id: 24, code: 'programaciones.complete', name: 'Completar programación propia', module: 'PROGRAMACIONES', action: 'MANAGE', scope: 'OWN' },

  // PROVEEDORES - 7 permisos
  { id: 25, code: 'proveedores.view_list', name: 'Ver lista de proveedores', module: 'PROVEEDORES', action: 'VIEW', scope: 'ALL' },
  { id: 26, code: 'proveedores.view_detail', name: 'Ver detalle de proveedor', module: 'PROVEEDORES', action: 'VIEW', scope: 'ALL' },
  { id: 27, code: 'proveedores.create', name: 'Crear proveedor', module: 'PROVEEDORES', action: 'CREATE', scope: 'ALL' },
  { id: 28, code: 'proveedores.update', name: 'Editar proveedor', module: 'PROVEEDORES', action: 'EDIT', scope: 'ALL' },
  { id: 29, code: 'proveedores.delete', name: 'Eliminar proveedor', module: 'PROVEEDORES', action: 'DELETE', scope: 'ALL' },
  { id: 30, code: 'proveedores.manage_prices', name: 'Gestionar precios', module: 'PROVEEDORES', action: 'MANAGE', scope: 'ALL' },
  { id: 31, code: 'proveedores.view_price_history', name: 'Ver historial de precios', module: 'PROVEEDORES', action: 'VIEW', scope: 'ALL' },

  // ECOALIADOS - 7 permisos
  { id: 32, code: 'ecoaliados.view_list', name: 'Ver lista de EcoAliados', module: 'ECOALIADOS', action: 'VIEW', scope: 'ALL' },
  { id: 33, code: 'ecoaliados.view_detail', name: 'Ver detalle de EcoAliado', module: 'ECOALIADOS', action: 'VIEW', scope: 'ALL' },
  { id: 34, code: 'ecoaliados.create', name: 'Crear EcoAliado', module: 'ECOALIADOS', action: 'CREATE', scope: 'ALL' },
  { id: 35, code: 'ecoaliados.update', name: 'Editar EcoAliado', module: 'ECOALIADOS', action: 'EDIT', scope: 'ALL' },
  { id: 36, code: 'ecoaliados.delete', name: 'Eliminar EcoAliado', module: 'ECOALIADOS', action: 'DELETE', scope: 'ALL' },
  { id: 37, code: 'ecoaliados.manage_prices', name: 'Gestionar precios', module: 'ECOALIADOS', action: 'MANAGE', scope: 'ALL' },
  { id: 38, code: 'ecoaliados.assign_commercial', name: 'Asignar comercial', module: 'ECOALIADOS', action: 'MANAGE', scope: 'ALL' },

  // RECEPCIONES - 8 permisos
  { id: 39, code: 'recepciones.view_list', name: 'Ver lista de recepciones', module: 'RECEPCIONES', action: 'VIEW', scope: 'ALL' },
  { id: 40, code: 'recepciones.view_detail', name: 'Ver detalle de recepción', module: 'RECEPCIONES', action: 'VIEW', scope: 'ALL' },
  { id: 41, code: 'recepciones.create', name: 'Crear recepción', module: 'RECEPCIONES', action: 'CREATE', scope: 'ALL' },
  { id: 42, code: 'recepciones.update', name: 'Editar recepción', module: 'RECEPCIONES', action: 'EDIT', scope: 'ALL' },
  { id: 43, code: 'recepciones.delete', name: 'Eliminar recepción', module: 'RECEPCIONES', action: 'DELETE', scope: 'ALL' },
  { id: 44, code: 'recepciones.weigh', name: 'Registrar pesaje', module: 'RECEPCIONES', action: 'MANAGE', scope: 'ALL' },
  { id: 45, code: 'recepciones.confirm', name: 'Confirmar recepción', module: 'RECEPCIONES', action: 'APPROVE', scope: 'ALL' },
  { id: 46, code: 'recepciones.cancel', name: 'Cancelar recepción', module: 'RECEPCIONES', action: 'MANAGE', scope: 'ALL' },

  // CERTIFICADOS - 6 permisos
  { id: 47, code: 'certificados.view_list', name: 'Ver lista de certificados', module: 'CERTIFICADOS', action: 'VIEW', scope: 'ALL' },
  { id: 48, code: 'certificados.view_detail', name: 'Ver detalle de certificado', module: 'CERTIFICADOS', action: 'VIEW', scope: 'ALL' },
  { id: 49, code: 'certificados.create', name: 'Crear certificado', module: 'CERTIFICADOS', action: 'CREATE', scope: 'ALL' },
  { id: 50, code: 'certificados.delete', name: 'Eliminar certificado', module: 'CERTIFICADOS', action: 'DELETE', scope: 'ALL' },
  { id: 51, code: 'certificados.generate', name: 'Generar certificado', module: 'CERTIFICADOS', action: 'EXPORT', scope: 'ALL' },
  { id: 52, code: 'certificados.download', name: 'Descargar certificado', module: 'CERTIFICADOS', action: 'EXPORT', scope: 'ALL' },

  // USUARIOS - 8 permisos
  { id: 53, code: 'users.view_list', name: 'Ver lista de usuarios', module: 'CORE', action: 'VIEW', scope: 'ALL' },
  { id: 54, code: 'users.view_detail', name: 'Ver detalle de usuario', module: 'CORE', action: 'VIEW', scope: 'ALL' },
  { id: 55, code: 'users.create', name: 'Crear usuario', module: 'CORE', action: 'CREATE', scope: 'ALL' },
  { id: 56, code: 'users.update', name: 'Editar usuario', module: 'CORE', action: 'EDIT', scope: 'ALL' },
  { id: 57, code: 'users.delete', name: 'Eliminar usuario', module: 'CORE', action: 'DELETE', scope: 'ALL' },
  { id: 58, code: 'users.assign_roles', name: 'Asignar roles', module: 'CORE', action: 'MANAGE', scope: 'ALL' },
  { id: 59, code: 'users.assign_cargo', name: 'Asignar cargo', module: 'CORE', action: 'MANAGE', scope: 'ALL' },
  { id: 60, code: 'users.manage_permissions', name: 'Gestionar permisos', module: 'CORE', action: 'MANAGE', scope: 'ALL' },

  // CONFIGURACIÓN - 6 permisos
  { id: 61, code: 'config.view_settings', name: 'Ver configuración', module: 'CORE', action: 'VIEW', scope: 'ALL' },
  { id: 62, code: 'config.manage_settings', name: 'Gestionar configuración', module: 'CORE', action: 'MANAGE', scope: 'ALL' },
  { id: 63, code: 'config.manage_roles', name: 'Gestionar roles', module: 'CORE', action: 'MANAGE', scope: 'ALL' },
  { id: 64, code: 'config.manage_groups', name: 'Gestionar grupos', module: 'CORE', action: 'MANAGE', scope: 'ALL' },
  { id: 65, code: 'config.manage_cargos', name: 'Gestionar cargos', module: 'CORE', action: 'MANAGE', scope: 'ALL' },
  { id: 66, code: 'config.manage_permissions', name: 'Gestionar permisos', module: 'CORE', action: 'MANAGE', scope: 'ALL' },

  // SST - 2 permisos (ejemplo)
  { id: 67, code: 'sst.view_list', name: 'Ver módulo SST', module: 'GESTION_INTEGRAL', action: 'VIEW', scope: 'ALL' },
  { id: 68, code: 'sst.manage_copasst', name: 'Gestionar COPASST', module: 'GESTION_INTEGRAL', action: 'MANAGE', scope: 'ALL' },
];

// ==================== HELPERS ====================

const getAccionIcon = (action: AccionPermiso) => {
  const icons = {
    VIEW: Eye,
    CREATE: Plus,
    EDIT: Edit,
    DELETE: Trash2,
    APPROVE: CheckCircle,
    EXPORT: Download,
    MANAGE: Settings,
  };
  return icons[action] || Shield;
};

const getAccionColor = (action: AccionPermiso) => {
  const colors: Record<AccionPermiso, string> = {
    VIEW: 'bg-blue-100 text-blue-700',
    CREATE: 'bg-green-100 text-green-700',
    EDIT: 'bg-amber-100 text-amber-700',
    DELETE: 'bg-red-100 text-red-700',
    APPROVE: 'bg-purple-100 text-purple-700',
    EXPORT: 'bg-cyan-100 text-cyan-700',
    MANAGE: 'bg-gray-100 text-gray-700',
  };
  return colors[action];
};

const getScopeLabel = (scope: string) => {
  const labels: Record<string, { label: string; color: string }> = {
    OWN: { label: 'Propios', color: 'text-amber-600' },
    TEAM: { label: 'Equipo', color: 'text-blue-600' },
    ALL: { label: 'Todos', color: 'text-green-600' },
  };
  return labels[scope] || { label: scope, color: 'text-gray-600' };
};

// Agrupar permisos por módulo
const agruparPermisosPorModulo = (permisos: Permiso[]): PermisoAgrupado[] => {
  const grupos: Record<string, PermisoAgrupado> = {};

  permisos.forEach((permiso) => {
    if (!grupos[permiso.module]) {
      const moduloOption = MODULO_OPTIONS.find((m) => m.value === permiso.module);
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

  // Filtrar permisos
  const filteredPermisos = useMemo(() => {
    return PERMISOS_COMPLETOS.filter((permiso) => {
      const matchesSearch =
        !searchQuery ||
        permiso.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        permiso.code.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesModulo = !moduloFilter || permiso.module === moduloFilter;
      const matchesAccion = !accionFilter || permiso.action === accionFilter;

      return matchesSearch && matchesModulo && matchesAccion;
    });
  }, [searchQuery, moduloFilter, accionFilter]);

  // Agrupar por módulo
  const permisosAgrupados = useMemo(
    () => agruparPermisosPorModulo(filteredPermisos),
    [filteredPermisos]
  );

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

  // Estadísticas
  const stats = useMemo(() => {
    const byAction: Record<string, number> = {};
    const byModule: Record<string, number> = {};

    PERMISOS_COMPLETOS.forEach((p) => {
      byAction[p.action] = (byAction[p.action] || 0) + 1;
      byModule[p.module] = (byModule[p.module] || 0) + 1;
    });

    return { byAction, byModule, total: PERMISOS_COMPLETOS.length };
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Todos los Permisos
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Referencia completa de los {stats.total} permisos del sistema
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={expandAll}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            Expandir todo
          </button>
          <span className="text-gray-300">|</span>
          <button
            onClick={collapseAll}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            Colapsar todo
          </button>
        </div>
      </div>

      {/* Resumen estadístico */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {ACCION_OPTIONS.map((accion) => {
          const Icon = getAccionIcon(accion.value as AccionPermiso);
          const count = stats.byAction[accion.value] || 0;
          return (
            <Card
              key={accion.value}
              className={`p-3 cursor-pointer transition-colors ${
                accionFilter === accion.value
                  ? 'ring-2 ring-blue-500'
                  : 'hover:bg-gray-50'
              }`}
              onClick={() =>
                setAccionFilter(accionFilter === accion.value ? '' : accion.value)
              }
            >
              <div className="flex items-center gap-2">
                <div
                  className={`p-1.5 rounded ${getAccionColor(
                    accion.value as AccionPermiso
                  )}`}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-lg font-semibold">{count}</div>
                  <div className="text-xs text-gray-500">{accion.label}</div>
                </div>
              </div>
            </Card>
          );
        })}
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
              options={[
                { value: '', label: 'Todos los módulos' },
                ...MODULO_OPTIONS,
              ]}
            />
          </div>
          <div className="w-full sm:w-48">
            <Select
              value={accionFilter}
              onChange={(e) => setAccionFilter(e.target.value)}
              options={[
                { value: '', label: 'Todas las acciones' },
                ...ACCION_OPTIONS.map((a) => ({ value: a.value, label: a.label })),
              ]}
            />
          </div>
        </div>
      </Card>

      {/* Lista de permisos agrupados */}
      <div className="space-y-3">
        {permisosAgrupados.map((grupo) => {
          const isExpanded = expandedModules.includes(grupo.module);

          return (
            <Card key={grupo.module} className="overflow-hidden">
              {/* Header del módulo */}
              <div
                className="flex items-center justify-between p-4 bg-gray-50 cursor-pointer hover:bg-gray-100"
                onClick={() => toggleModule(grupo.module)}
              >
                <div className="flex items-center gap-3">
                  {isExpanded ? (
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  )}
                  <div>
                    <h4 className="font-medium text-gray-900">{grupo.label}</h4>
                    <p className="text-sm text-gray-500">
                      {grupo.permissions.length} permisos
                    </p>
                  </div>
                </div>
                <Badge variant="secondary">{grupo.permissions.length}</Badge>
              </div>

              {/* Lista de permisos */}
              {isExpanded && (
                <div className="divide-y divide-gray-100">
                  {grupo.permissions.map((permiso) => {
                    const AccionIcon = getAccionIcon(permiso.action);
                    const scopeInfo = getScopeLabel(permiso.scope);

                    return (
                      <div
                        key={permiso.id}
                        className="flex items-center justify-between p-4 hover:bg-gray-50"
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
                            <div className="font-medium text-gray-900">
                              {permiso.name}
                            </div>
                            <div className="text-sm text-gray-500 font-mono">
                              {permiso.code}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          {/* Alcance */}
                          <div className="text-right">
                            <div className="text-xs text-gray-400">Alcance</div>
                            <div className={`text-sm font-medium ${scopeInfo.color}`}>
                              {scopeInfo.label}
                            </div>
                          </div>

                          {/* Info uso (mock) */}
                          <Tooltip content="Usado por 3 cargos y 2 roles">
                            <div className="flex items-center gap-2 text-gray-400">
                              <div className="flex items-center gap-1">
                                <Briefcase className="h-4 w-4" />
                                <span className="text-xs">3</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Users className="h-4 w-4" />
                                <span className="text-xs">2</span>
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

      {/* Empty state */}
      {permisosAgrupados.length === 0 && (
        <Card className="p-12 text-center">
          <Filter className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No se encontraron permisos
          </h3>
          <p className="text-gray-500">
            Ajusta los filtros para ver los permisos disponibles.
          </p>
        </Card>
      )}

      {/* Leyenda */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Info className="h-4 w-4 text-blue-500" />
          <h4 className="font-medium text-gray-900">Leyenda de Alcances</h4>
        </div>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <span className="font-medium text-green-600">Todos (ALL)</span>
            <p className="text-gray-500">
              Acceso a todos los registros del sistema
            </p>
          </div>
          <div>
            <span className="font-medium text-blue-600">Equipo (TEAM)</span>
            <p className="text-gray-500">
              Acceso a registros del equipo o área
            </p>
          </div>
          <div>
            <span className="font-medium text-amber-600">Propios (OWN)</span>
            <p className="text-gray-500">
              Solo registros creados por el usuario
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};
