/**
 * Pagina: Configuracion Contable
 *
 * Gestion del Plan Unico de Cuentas (PUC) Colombia:
 * - Plan de Cuentas: Arbol jerarquico de cuentas
 * - Tipos de Documento: Tipos de comprobantes contables
 * - Terceros: Registro de terceros para contabilidad
 * - Centros de Costo: Estructura de centros de costo
 */
import { useState } from 'react';
import {
  BookOpen,
  FileText,
  Users,
  Building2,
  Plus,
  Search,
  Edit2,
  Trash2,
  ChevronRight,
  ChevronDown,
  CheckCircle,
  XCircle,
  Filter,
  Download,
  Upload,
} from 'lucide-react';
import { PageHeader } from '@/components/layout';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Tabs } from '@/components/common/Tabs';
import { cn } from '@/utils/cn';
import type { CuentaContableTree, CentroCostoContableTree } from '../types';
import {
  usePlanesCuentas,
  useCuentasArbol,
  useTiposDocumento,
  useTerceros,
  useCentrosCostoContable,
} from '../hooks';

const dec = (v: string | number | null | undefined): number => Number(v ?? 0);

const extractResults = <T,>(data: unknown): T[] => {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  const d = data as { results?: T[] };
  return d.results ?? [];
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(value);

// ==================== COMPONENTS ====================

const CuentaTreeItem = ({ cuenta, level = 0 }: { cuenta: CuentaContableTree; level?: number }) => {
  const [expanded, setExpanded] = useState(level < 1);
  const hasChildren = cuenta.children && cuenta.children.length > 0;

  return (
    <div>
      <div
        className="flex items-center gap-2 py-2 px-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg cursor-pointer"
        style={{ marginLeft: `${level * 24}px` }}
      >
        {hasChildren ? (
          <button onClick={() => setExpanded(!expanded)} className="p-0.5">
            {expanded ? (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-400" />
            )}
          </button>
        ) : (
          <span className="w-5" />
        )}

        <span className="font-mono text-sm font-medium text-primary-600 w-20">{cuenta.codigo}</span>
        <span className="flex-1 text-sm text-gray-900 dark:text-white">{cuenta.nombre}</span>

        <Badge variant={cuenta.naturaleza === 'debito' ? 'primary' : 'success'} size="sm">
          {cuenta.naturaleza === 'debito' ? 'Debito' : 'Credito'}
        </Badge>

        <Badge variant={cuenta.acepta_movimientos ? 'warning' : 'secondary'} size="sm">
          {cuenta.acepta_movimientos ? 'Movimiento' : 'Titulo'}
        </Badge>

        {cuenta.saldo_final && dec(cuenta.saldo_final) !== 0 && (
          <span className="text-xs font-mono text-gray-500">
            {formatCurrency(dec(cuenta.saldo_final))}
          </span>
        )}

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" className="p-1">
            <Edit2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {expanded && hasChildren && (
        <div>
          {cuenta.children.map((hijo) => (
            <CuentaTreeItem key={hijo.id} cuenta={hijo} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
};

const CentroCostoTreeItem = ({
  centro,
  level = 0,
}: {
  centro: CentroCostoContableTree;
  level?: number;
}) => {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = centro.children && centro.children.length > 0;

  return (
    <div>
      <div
        className="flex items-center gap-2 py-2 px-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg"
        style={{ marginLeft: `${level * 24}px` }}
      >
        {hasChildren ? (
          <button onClick={() => setExpanded(!expanded)} className="p-0.5">
            {expanded ? (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-400" />
            )}
          </button>
        ) : (
          <span className="w-5" />
        )}
        <span className="font-mono text-sm font-medium text-primary-600 w-20">{centro.codigo}</span>
        <span className="flex-1 text-sm text-gray-900 dark:text-white">{centro.nombre}</span>
        <Badge variant="secondary" size="sm">
          {centro.tipo_centro}
        </Badge>
        {dec(centro.presupuesto_anual) > 0 && (
          <span className="text-xs font-mono text-gray-500">
            {formatCurrency(dec(centro.presupuesto_anual))}
          </span>
        )}
        <Button variant="ghost" size="sm" className="p-1">
          <Edit2 className="w-4 h-4" />
        </Button>
      </div>
      {expanded &&
        hasChildren &&
        centro.children.map((sub) => (
          <CentroCostoTreeItem key={sub.id} centro={sub} level={level + 1} />
        ))}
    </div>
  );
};

const PlanCuentasSection = () => {
  const { data: planesData } = usePlanesCuentas();
  const planes = extractResults(planesData);
  const planActivo = planes.find((p) => p.es_activo);

  const { data: arbolData, isLoading } = useCuentasArbol(
    planActivo ? { plan_cuentas: planActivo.id } : undefined
  );
  const arbol: CuentaContableTree[] = Array.isArray(arbolData) ? arbolData : [];
  const totalCuentas = planActivo?.total_cuentas ?? 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar cuenta..."
              className="pl-9 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm w-64 bg-white dark:bg-gray-800"
            />
          </div>
          <Button variant="outline" size="sm" leftIcon={<Filter className="w-4 h-4" />}>
            Filtros
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" leftIcon={<Download className="w-4 h-4" />}>
            Exportar
          </Button>
          <Button variant="outline" size="sm" leftIcon={<Upload className="w-4 h-4" />}>
            Importar PUC
          </Button>
          <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
            Nueva Cuenta
          </Button>
        </div>
      </div>

      <Card variant="bordered" padding="none">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <div className="flex items-center gap-4 text-xs font-medium text-gray-500 uppercase">
            <span className="w-5" />
            <span className="w-20">Codigo</span>
            <span className="flex-1">Nombre de la Cuenta</span>
            <span className="w-16">Naturaleza</span>
            <span className="w-20">Tipo</span>
            <span className="w-16">Acciones</span>
          </div>
        </div>
        <div className="max-h-[500px] overflow-y-auto p-2">
          {isLoading ? (
            <p className="text-center text-gray-500 py-8">Cargando plan de cuentas...</p>
          ) : arbol.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No hay cuentas registradas</p>
          ) : (
            arbol.map((cuenta) => <CuentaTreeItem key={cuenta.id} cuenta={cuenta} />)
          )}
        </div>
      </Card>

      <div className="flex items-center justify-between text-sm text-gray-500">
        <span>Total: {totalCuentas} cuentas</span>
        <span>
          {planActivo?.nombre ?? 'Sin plan activo'} ({planActivo?.tipo_plan_display ?? '-'})
        </span>
      </div>
    </div>
  );
};

const TiposDocumentoSection = () => {
  const { data, isLoading } = useTiposDocumento();
  const tipos = extractResults(data);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar tipo de documento..."
            className="pl-9 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm w-64 bg-white dark:bg-gray-800"
          />
        </div>
        <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
          Nuevo Tipo
        </Button>
      </div>

      <Card variant="bordered" padding="none">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Codigo
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Nombre
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Clase
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Prefijo
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                Consecutivo
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                Aprobacion
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                Estado
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {isLoading ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                  Cargando...
                </td>
              </tr>
            ) : tipos.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                  No hay tipos de documento registrados
                </td>
              </tr>
            ) : (
              tipos.map((tipo) => (
                <tr key={tipo.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-4 py-3 font-mono text-sm font-medium text-primary-600">
                    {tipo.codigo}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{tipo.nombre}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {tipo.clase_documento_display}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 font-mono">
                    {tipo.prefijo || '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-right font-medium">
                    {tipo.consecutivo_actual}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {tipo.requiere_aprobacion ? (
                      <CheckCircle className="w-4 h-4 text-green-500 mx-auto" />
                    ) : (
                      <XCircle className="w-4 h-4 text-gray-300 mx-auto" />
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Badge variant={tipo.is_active ? 'success' : 'danger'} size="sm">
                      {tipo.is_active ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm" className="p-1">
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="p-1 text-red-500">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
};

const TercerosSection = () => {
  const [filtroTipo, setFiltroTipo] = useState('');
  const params: Record<string, unknown> = {};
  if (filtroTipo) params.tipo_tercero = filtroTipo;

  const { data, isLoading } = useTerceros(params);
  const terceros = extractResults(data);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar tercero..."
              className="pl-9 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm w-64 bg-white dark:bg-gray-800"
            />
          </div>
          <select
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800"
          >
            <option value="">Todos los tipos</option>
            <option value="proveedor">Proveedores</option>
            <option value="cliente">Clientes</option>
            <option value="empleado">Empleados</option>
            <option value="otro">Otros</option>
          </select>
        </div>
        <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
          Nuevo Tercero
        </Button>
      </div>

      <Card variant="bordered" padding="none">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Identificacion
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Razon Social / Nombre
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Tipo
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Persona
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Ciudad
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                Estado
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                  Cargando...
                </td>
              </tr>
            ) : terceros.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                  No hay terceros registrados
                </td>
              </tr>
            ) : (
              terceros.map((tercero) => (
                <tr key={tercero.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-4 py-3">
                    <div className="flex flex-col">
                      <span className="font-mono text-sm">{tercero.identificacion_completa}</span>
                      <span className="text-xs text-gray-500">
                        {tercero.tipo_identificacion_display}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                    {tercero.razon_social}
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant={
                        tercero.tipo_tercero === 'cliente'
                          ? 'success'
                          : tercero.tipo_tercero === 'proveedor'
                            ? 'primary'
                            : tercero.tipo_tercero === 'empleado'
                              ? 'warning'
                              : 'secondary'
                      }
                      size="sm"
                    >
                      {tercero.tipo_tercero_display}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{tercero.tipo_persona}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{tercero.ciudad || '-'}</td>
                  <td className="px-4 py-3 text-center">
                    <Badge variant={tercero.is_active ? 'success' : 'danger'} size="sm">
                      {tercero.is_active ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm" className="p-1">
                        <Edit2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
};

const CentrosCostoSection = () => {
  const { data, isLoading } = useCentrosCostoContable();
  const centros = extractResults(data);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar centro de costo..."
            className="pl-9 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm w-64 bg-white dark:bg-gray-800"
          />
        </div>
        <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
          Nuevo Centro
        </Button>
      </div>

      <Card variant="bordered" padding="none">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Codigo
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Nombre
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Tipo
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Centro Padre
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Responsable
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                Presupuesto
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                Estado
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {isLoading ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                  Cargando...
                </td>
              </tr>
            ) : centros.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                  No hay centros de costo registrados
                </td>
              </tr>
            ) : (
              centros.map((centro) => (
                <tr key={centro.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-4 py-3 font-mono text-sm font-medium text-primary-600">
                    {centro.codigo}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                    {centro.nombre}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{centro.tipo_centro_display}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 font-mono">
                    {centro.centro_padre_codigo || '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {centro.responsable_nombre || '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-right font-mono">
                    {dec(centro.presupuesto_anual) > 0
                      ? formatCurrency(dec(centro.presupuesto_anual))
                      : '-'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Badge variant={centro.is_active ? 'success' : 'danger'} size="sm">
                      {centro.is_active ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm" className="p-1">
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="p-1 text-red-500">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
};

// ==================== MAIN COMPONENT ====================

export default function ConfigContablePage() {
  const tabs = [
    {
      id: 'plan-cuentas',
      label: 'Plan de Cuentas',
      icon: <BookOpen className="w-4 h-4" />,
      content: <PlanCuentasSection />,
    },
    {
      id: 'tipos-documento',
      label: 'Tipos de Documento',
      icon: <FileText className="w-4 h-4" />,
      content: <TiposDocumentoSection />,
    },
    {
      id: 'terceros',
      label: 'Terceros',
      icon: <Users className="w-4 h-4" />,
      content: <TercerosSection />,
    },
    {
      id: 'centros-costo',
      label: 'Centros de Costo',
      icon: <Building2 className="w-4 h-4" />,
      content: <CentrosCostoSection />,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Configuracion Contable"
        description="Plan Unico de Cuentas (PUC) Colombia y parametros del sistema contable"
      />

      <Tabs tabs={tabs} defaultTab="plan-cuentas" />
    </div>
  );
}
