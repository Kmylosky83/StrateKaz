/**
 * Página: Configuración Contable
 *
 * Gestión del Plan Único de Cuentas (PUC) Colombia:
 * - Plan de Cuentas: Árbol jerárquico de cuentas
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

// ==================== MOCK DATA ====================

const mockCuentas = [
  {
    id: 1,
    codigo: '1',
    nombre: 'ACTIVO',
    naturaleza: 'debito',
    tipo: 'titulo',
    nivel: 1,
    activa: true,
    expanded: true,
    hijos: [
      {
        id: 2,
        codigo: '11',
        nombre: 'DISPONIBLE',
        naturaleza: 'debito',
        tipo: 'titulo',
        nivel: 2,
        activa: true,
        expanded: true,
        hijos: [
          { id: 3, codigo: '1105', nombre: 'CAJA', naturaleza: 'debito', tipo: 'titulo', nivel: 3, activa: true, hijos: [
            { id: 4, codigo: '110505', nombre: 'Caja general', naturaleza: 'debito', tipo: 'movimiento', nivel: 4, activa: true },
            { id: 5, codigo: '110510', nombre: 'Cajas menores', naturaleza: 'debito', tipo: 'movimiento', nivel: 4, activa: true },
          ]},
          { id: 6, codigo: '1110', nombre: 'BANCOS', naturaleza: 'debito', tipo: 'titulo', nivel: 3, activa: true, hijos: [
            { id: 7, codigo: '111005', nombre: 'Moneda nacional', naturaleza: 'debito', tipo: 'movimiento', nivel: 4, activa: true },
          ]},
        ],
      },
      {
        id: 8,
        codigo: '13',
        nombre: 'DEUDORES',
        naturaleza: 'debito',
        tipo: 'titulo',
        nivel: 2,
        activa: true,
        hijos: [],
      },
    ],
  },
  {
    id: 9,
    codigo: '2',
    nombre: 'PASIVO',
    naturaleza: 'credito',
    tipo: 'titulo',
    nivel: 1,
    activa: true,
    hijos: [],
  },
  {
    id: 10,
    codigo: '3',
    nombre: 'PATRIMONIO',
    naturaleza: 'credito',
    tipo: 'titulo',
    nivel: 1,
    activa: true,
    hijos: [],
  },
  {
    id: 11,
    codigo: '4',
    nombre: 'INGRESOS',
    naturaleza: 'credito',
    tipo: 'titulo',
    nivel: 1,
    activa: true,
    hijos: [],
  },
  {
    id: 12,
    codigo: '5',
    nombre: 'GASTOS',
    naturaleza: 'debito',
    tipo: 'titulo',
    nivel: 1,
    activa: true,
    hijos: [],
  },
  {
    id: 13,
    codigo: '6',
    nombre: 'COSTOS DE VENTAS',
    naturaleza: 'debito',
    tipo: 'titulo',
    nivel: 1,
    activa: true,
    hijos: [],
  },
];

const mockTiposDocumento = [
  { id: 1, codigo: 'CE', nombre: 'Comprobante de Egreso', abreviatura: 'CE', consecutivo_actual: 156, activo: true },
  { id: 2, codigo: 'CI', nombre: 'Comprobante de Ingreso', abreviatura: 'CI', consecutivo_actual: 89, activo: true },
  { id: 3, codigo: 'NC', nombre: 'Nota Contable', abreviatura: 'NC', consecutivo_actual: 45, activo: true },
  { id: 4, codigo: 'ND', nombre: 'Nota Débito', abreviatura: 'ND', consecutivo_actual: 23, activo: true },
  { id: 5, codigo: 'NR', nombre: 'Nota Crédito', abreviatura: 'NR', consecutivo_actual: 18, activo: true },
  { id: 6, codigo: 'FA', nombre: 'Factura de Venta', abreviatura: 'FV', consecutivo_actual: 1250, activo: true },
  { id: 7, codigo: 'FC', nombre: 'Factura de Compra', abreviatura: 'FC', consecutivo_actual: 890, activo: true },
];

const mockTerceros = [
  { id: 1, tipo_documento: 'NIT', numero_documento: '900123456-1', razon_social: 'Proveedor ABC S.A.S.', tipo: 'proveedor', activo: true },
  { id: 2, tipo_documento: 'NIT', numero_documento: '800987654-2', razon_social: 'Cliente XYZ Ltda.', tipo: 'cliente', activo: true },
  { id: 3, tipo_documento: 'CC', numero_documento: '1234567890', razon_social: 'Juan Pérez García', tipo: 'empleado', activo: true },
  { id: 4, tipo_documento: 'NIT', numero_documento: '860000000-1', razon_social: 'DIAN', tipo: 'entidad', activo: true },
  { id: 5, tipo_documento: 'NIT', numero_documento: '890000000-1', razon_social: 'Banco de Colombia', tipo: 'banco', activo: true },
];

const mockCentrosCosto = [
  { id: 1, codigo: 'ADM', nombre: 'Administración', padre: null, nivel: 1, activo: true },
  { id: 2, codigo: 'ADM-GG', nombre: 'Gerencia General', padre: 'ADM', nivel: 2, activo: true },
  { id: 3, codigo: 'ADM-FIN', nombre: 'Finanzas', padre: 'ADM', nivel: 2, activo: true },
  { id: 4, codigo: 'OPE', nombre: 'Operaciones', padre: null, nivel: 1, activo: true },
  { id: 5, codigo: 'OPE-PRO', nombre: 'Producción', padre: 'OPE', nivel: 2, activo: true },
  { id: 6, codigo: 'OPE-LOG', nombre: 'Logística', padre: 'OPE', nivel: 2, activo: true },
  { id: 7, codigo: 'COM', nombre: 'Comercial', padre: null, nivel: 1, activo: true },
  { id: 8, codigo: 'COM-VEN', nombre: 'Ventas', padre: 'COM', nivel: 2, activo: true },
];

// ==================== COMPONENTS ====================

interface CuentaNode {
  id: number;
  codigo: string;
  nombre: string;
  naturaleza: string;
  tipo: string;
  nivel: number;
  activa: boolean;
  expanded?: boolean;
  hijos?: CuentaNode[];
}

const CuentaTreeItem = ({ cuenta, level = 0 }: { cuenta: CuentaNode; level?: number }) => {
  const [expanded, setExpanded] = useState(cuenta.expanded ?? false);
  const hasChildren = cuenta.hijos && cuenta.hijos.length > 0;

  return (
    <div>
      <div
        className={cn(
          'flex items-center gap-2 py-2 px-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg cursor-pointer',
          level > 0 && 'ml-6'
        )}
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

        <Badge
          variant={cuenta.naturaleza === 'debito' ? 'primary' : 'success'}
          size="sm"
        >
          {cuenta.naturaleza === 'debito' ? 'Débito' : 'Crédito'}
        </Badge>

        <Badge
          variant={cuenta.tipo === 'movimiento' ? 'warning' : 'secondary'}
          size="sm"
        >
          {cuenta.tipo === 'movimiento' ? 'Movimiento' : 'Título'}
        </Badge>

        {cuenta.activa ? (
          <CheckCircle className="w-4 h-4 text-green-500" />
        ) : (
          <XCircle className="w-4 h-4 text-red-500" />
        )}

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" className="p-1">
            <Edit2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {expanded && hasChildren && (
        <div>
          {cuenta.hijos!.map((hijo) => (
            <CuentaTreeItem key={hijo.id} cuenta={hijo} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
};

const PlanCuentasSection = () => {
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
            <span className="w-20">Código</span>
            <span className="flex-1">Nombre de la Cuenta</span>
            <span className="w-16">Naturaleza</span>
            <span className="w-20">Tipo</span>
            <span className="w-10">Estado</span>
            <span className="w-16">Acciones</span>
          </div>
        </div>
        <div className="max-h-[500px] overflow-y-auto p-2">
          {mockCuentas.map((cuenta) => (
            <CuentaTreeItem key={cuenta.id} cuenta={cuenta} />
          ))}
        </div>
      </Card>

      <div className="flex items-center justify-between text-sm text-gray-500">
        <span>Total: 245 cuentas activas</span>
        <span>Plan Único de Cuentas - PUC Colombia</span>
      </div>
    </div>
  );
};

const TiposDocumentoSection = () => {
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
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Código</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Abreviatura</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Consecutivo</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Estado</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {mockTiposDocumento.map((tipo) => (
              <tr key={tipo.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <td className="px-4 py-3 font-mono text-sm font-medium text-primary-600">{tipo.codigo}</td>
                <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{tipo.nombre}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{tipo.abreviatura}</td>
                <td className="px-4 py-3 text-sm text-right font-medium">{tipo.consecutivo_actual}</td>
                <td className="px-4 py-3 text-center">
                  <Badge variant={tipo.activo ? 'success' : 'danger'} size="sm">
                    {tipo.activo ? 'Activo' : 'Inactivo'}
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
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
};

const TercerosSection = () => {
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
          <select className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800">
            <option value="">Todos los tipos</option>
            <option value="proveedor">Proveedores</option>
            <option value="cliente">Clientes</option>
            <option value="empleado">Empleados</option>
            <option value="entidad">Entidades</option>
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
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Documento</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Número</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Razón Social / Nombre</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Estado</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {mockTerceros.map((tercero) => (
              <tr key={tercero.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <td className="px-4 py-3 text-sm text-gray-600">{tercero.tipo_documento}</td>
                <td className="px-4 py-3 font-mono text-sm">{tercero.numero_documento}</td>
                <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{tercero.razon_social}</td>
                <td className="px-4 py-3">
                  <Badge
                    variant={
                      tercero.tipo === 'cliente' ? 'success' :
                      tercero.tipo === 'proveedor' ? 'primary' :
                      tercero.tipo === 'empleado' ? 'warning' : 'secondary'
                    }
                    size="sm"
                  >
                    {tercero.tipo.charAt(0).toUpperCase() + tercero.tipo.slice(1)}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-center">
                  <Badge variant={tercero.activo ? 'success' : 'danger'} size="sm">
                    {tercero.activo ? 'Activo' : 'Inactivo'}
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
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
};

const CentrosCostoSection = () => {
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
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Código</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Centro Padre</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Nivel</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Estado</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {mockCentrosCosto.map((centro) => (
              <tr key={centro.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <td className="px-4 py-3 font-mono text-sm font-medium text-primary-600">{centro.codigo}</td>
                <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{centro.nombre}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{centro.padre || '-'}</td>
                <td className="px-4 py-3 text-center">
                  <Badge variant="secondary" size="sm">Nivel {centro.nivel}</Badge>
                </td>
                <td className="px-4 py-3 text-center">
                  <Badge variant={centro.activo ? 'success' : 'danger'} size="sm">
                    {centro.activo ? 'Activo' : 'Inactivo'}
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
            ))}
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
        title="Configuración Contable"
        description="Plan Único de Cuentas (PUC) Colombia y parámetros del sistema contable"
      />

      <Tabs tabs={tabs} defaultTab="plan-cuentas" />
    </div>
  );
}
