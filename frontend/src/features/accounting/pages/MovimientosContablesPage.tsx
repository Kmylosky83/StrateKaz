/**
 * Página: Movimientos Contables
 *
 * Gestión de comprobantes contables:
 * - Comprobantes: Lista y gestión de comprobantes
 * - Nuevo Comprobante: Crear nuevos movimientos
 * - Plantillas: Plantillas de asientos predefinidos
 * - Borradores: Comprobantes en estado borrador
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileSpreadsheet,
  Plus,
  Search,
  Eye,
  Edit2,
  Trash2,
  Copy,
  CheckCircle,
  Clock,
  XCircle,
  Filter,
  Download,
  Printer,
  FileText,
  Save,
  RotateCcw,
} from 'lucide-react';
import { PageHeader } from '@/components/layout';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Tabs } from '@/components/common/Tabs';

// ==================== MOCK DATA ====================

const mockComprobantes = [
  {
    id: 1,
    numero: 'CE-2024-0156',
    tipo: { codigo: 'CE', nombre: 'Comprobante de Egreso' },
    fecha: '2024-12-28',
    concepto: 'Pago a proveedores - Facturas diciembre',
    tercero: 'Proveedor ABC S.A.S.',
    total_debito: 15800000,
    total_credito: 15800000,
    estado: 'contabilizado',
    created_by: 'Juan Pérez',
  },
  {
    id: 2,
    numero: 'CI-2024-0089',
    tipo: { codigo: 'CI', nombre: 'Comprobante de Ingreso' },
    fecha: '2024-12-27',
    concepto: 'Recaudo de cartera - Clientes varios',
    tercero: 'Varios',
    total_debito: 28500000,
    total_credito: 28500000,
    estado: 'contabilizado',
    created_by: 'María López',
  },
  {
    id: 3,
    numero: 'NC-2024-0045',
    tipo: { codigo: 'NC', nombre: 'Nota Contable' },
    fecha: '2024-12-26',
    concepto: 'Ajuste por depreciación mensual',
    tercero: 'Interno',
    total_debito: 4500000,
    total_credito: 4500000,
    estado: 'borrador',
    created_by: 'Carlos García',
  },
  {
    id: 4,
    numero: 'CE-2024-0155',
    tipo: { codigo: 'CE', nombre: 'Comprobante de Egreso' },
    fecha: '2024-12-25',
    concepto: 'Pago nómina quincenal',
    tercero: 'Nómina',
    total_debito: 45000000,
    total_credito: 45000000,
    estado: 'contabilizado',
    created_by: 'Juan Pérez',
  },
  {
    id: 5,
    numero: 'NC-2024-0044',
    tipo: { codigo: 'NC', nombre: 'Nota Contable' },
    fecha: '2024-12-24',
    concepto: 'Reclasificación cuentas por cobrar',
    tercero: 'Interno',
    total_debito: 8200000,
    total_credito: 8200000,
    estado: 'anulado',
    created_by: 'María López',
  },
];

const mockPlantillas = [
  { id: 1, codigo: 'PAGO-PROV', nombre: 'Pago a Proveedores', descripcion: 'Plantilla para pagos a proveedores nacionales', lineas: 3, uso_mensual: 45 },
  { id: 2, codigo: 'REC-CART', nombre: 'Recaudo Cartera', descripcion: 'Recaudo de cartera clientes', lineas: 2, uso_mensual: 38 },
  { id: 3, codigo: 'NOM-QUIN', nombre: 'Nómina Quincenal', descripcion: 'Contabilización de nómina quincenal', lineas: 12, uso_mensual: 2 },
  { id: 4, codigo: 'DEP-MEN', nombre: 'Depreciación Mensual', descripcion: 'Registro de depreciación de activos', lineas: 8, uso_mensual: 1 },
  { id: 5, codigo: 'IVA-MEN', nombre: 'Provisión IVA', descripcion: 'Provisión mensual de IVA', lineas: 4, uso_mensual: 1 },
];

const mockDetalleComprobante = [
  { id: 1, cuenta: '110505', nombre_cuenta: 'Caja general', tercero: '-', centro_costo: 'ADM', debito: 0, credito: 15800000, descripcion: 'Pago efectivo' },
  { id: 2, cuenta: '220505', nombre_cuenta: 'Proveedores nacionales', tercero: 'Proveedor ABC', centro_costo: 'OPE', debito: 15800000, credito: 0, descripcion: 'Cancelación factura FV-001234' },
];

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(value);
};

// ==================== COMPONENTS ====================

const ComprobantesSection = () => {
  const [selectedComprobante, setSelectedComprobante] = useState<number | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar comprobante..."
              className="pl-9 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm w-64 bg-white dark:bg-gray-800"
            />
          </div>
          <select className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800">
            <option value="">Todos los tipos</option>
            <option value="CE">Comprobante Egreso</option>
            <option value="CI">Comprobante Ingreso</option>
            <option value="NC">Nota Contable</option>
          </select>
          <select className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800">
            <option value="">Todos los estados</option>
            <option value="borrador">Borrador</option>
            <option value="contabilizado">Contabilizado</option>
            <option value="anulado">Anulado</option>
          </select>
          <input
            type="date"
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" leftIcon={<Download className="w-4 h-4" />}>
            Exportar
          </Button>
          <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
            Nuevo Comprobante
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Lista de comprobantes */}
        <div className="lg:col-span-2">
          <Card variant="bordered" padding="none">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Número</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Concepto</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Estado</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {mockComprobantes.map((comp) => (
                  <tr
                    key={comp.id}
                    className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer ${selectedComprobante === comp.id ? 'bg-primary-50 dark:bg-primary-900/20' : ''}`}
                    onClick={() => setSelectedComprobante(comp.id)}
                  >
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="font-mono text-sm font-medium text-primary-600">{comp.numero}</span>
                        <span className="text-xs text-gray-500">{comp.tipo.nombre}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{comp.fecha}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="text-sm text-gray-900 dark:text-white truncate max-w-[200px]">{comp.concepto}</span>
                        <span className="text-xs text-gray-500">{comp.tercero}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-medium">{formatCurrency(comp.total_debito)}</td>
                    <td className="px-4 py-3 text-center">
                      <Badge
                        variant={
                          comp.estado === 'contabilizado' ? 'success' :
                          comp.estado === 'borrador' ? 'warning' : 'danger'
                        }
                        size="sm"
                      >
                        {comp.estado.charAt(0).toUpperCase() + comp.estado.slice(1)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" className="p-1">
                          <Eye className="w-4 h-4" />
                        </Button>
                        {comp.estado === 'borrador' && (
                          <Button variant="ghost" size="sm" className="p-1">
                            <Edit2 className="w-4 h-4" />
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" className="p-1">
                          <Printer className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>

        {/* Detalle del comprobante seleccionado */}
        <div>
          <Card variant="bordered" padding="md">
            {selectedComprobante ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900 dark:text-white">Detalle del Comprobante</h3>
                  <Badge variant="success" size="sm">Cuadrado</Badge>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Número:</span>
                    <span className="font-mono font-medium">CE-2024-0156</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Fecha:</span>
                    <span>2024-12-28</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Creado por:</span>
                    <span>Juan Pérez</span>
                  </div>
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <p className="text-xs font-medium text-gray-500 uppercase mb-2">Movimientos</p>
                  <div className="space-y-2">
                    {mockDetalleComprobante.map((det) => (
                      <div key={det.id} className="text-xs p-2 bg-gray-50 dark:bg-gray-800 rounded">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="font-mono text-primary-600">{det.cuenta}</span>
                            <p className="text-gray-600 truncate max-w-[150px]">{det.nombre_cuenta}</p>
                          </div>
                          <div className="text-right">
                            {det.debito > 0 && <p className="text-blue-600">{formatCurrency(det.debito)}</p>}
                            {det.credito > 0 && <p className="text-green-600">{formatCurrency(det.credito)}</p>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <div className="flex justify-between text-sm font-medium">
                    <span>Total Débitos:</span>
                    <span className="text-blue-600">{formatCurrency(15800000)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-medium">
                    <span>Total Créditos:</span>
                    <span className="text-green-600">{formatCurrency(15800000)}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                <FileSpreadsheet className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Seleccione un comprobante para ver el detalle</p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

const NuevoComprobanteSection = () => {
  const [lineas, setLineas] = useState([
    { id: 1, cuenta: '', tercero: '', centro_costo: '', debito: 0, credito: 0, descripcion: '' },
    { id: 2, cuenta: '', tercero: '', centro_costo: '', debito: 0, credito: 0, descripcion: '' },
  ]);

  return (
    <div className="space-y-6">
      {/* Encabezado del comprobante */}
      <Card variant="bordered" padding="md">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Datos del Comprobante</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo de Documento</label>
            <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800">
              <option value="">Seleccionar...</option>
              <option value="CE">Comprobante de Egreso</option>
              <option value="CI">Comprobante de Ingreso</option>
              <option value="NC">Nota Contable</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fecha</label>
            <input
              type="date"
              defaultValue="2024-12-29"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Número</label>
            <input
              type="text"
              placeholder="Automático"
              disabled
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-gray-100 dark:bg-gray-700"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Plantilla</label>
            <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800">
              <option value="">Sin plantilla</option>
              <option value="PAGO-PROV">Pago a Proveedores</option>
              <option value="REC-CART">Recaudo Cartera</option>
            </select>
          </div>
          <div className="md:col-span-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Concepto</label>
            <input
              type="text"
              placeholder="Descripción del comprobante..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800"
            />
          </div>
        </div>
      </Card>

      {/* Detalle del comprobante */}
      <Card variant="bordered" padding="md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Detalle Contable</h3>
          <Button variant="outline" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
            Agregar Línea
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase w-32">Cuenta</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Tercero</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase w-24">C. Costo</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase w-32">Débito</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase w-32">Crédito</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Descripción</th>
                <th className="px-3 py-2 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {lineas.map((linea, index) => (
                <tr key={linea.id}>
                  <td className="px-3 py-2">
                    <input
                      type="text"
                      placeholder="Código"
                      className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-800 font-mono"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <select className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-800">
                      <option value="">Seleccionar...</option>
                      <option value="1">Proveedor ABC S.A.S.</option>
                      <option value="2">Cliente XYZ Ltda.</option>
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    <select className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-800">
                      <option value="">-</option>
                      <option value="ADM">ADM</option>
                      <option value="OPE">OPE</option>
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      placeholder="0"
                      className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-800 text-right"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      placeholder="0"
                      className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-800 text-right"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="text"
                      placeholder="Descripción del movimiento"
                      className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-800"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <Button variant="ghost" size="sm" className="p-1 text-red-500">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700">
              <tr>
                <td colSpan={3} className="px-3 py-2 text-right font-medium">Totales:</td>
                <td className="px-3 py-2 text-right font-medium text-blue-600">{formatCurrency(0)}</td>
                <td className="px-3 py-2 text-right font-medium text-green-600">{formatCurrency(0)}</td>
                <td colSpan={2} className="px-3 py-2">
                  <Badge variant="warning" size="sm">Diferencia: $0</Badge>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>

      {/* Acciones */}
      <div className="flex items-center justify-end gap-3">
        <Button variant="outline" leftIcon={<RotateCcw className="w-4 h-4" />}>
          Limpiar
        </Button>
        <Button variant="outline" leftIcon={<Save className="w-4 h-4" />}>
          Guardar Borrador
        </Button>
        <Button variant="primary" leftIcon={<CheckCircle className="w-4 h-4" />}>
          Contabilizar
        </Button>
      </div>
    </div>
  );
};

const PlantillasSection = () => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar plantilla..."
            className="pl-9 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm w-64 bg-white dark:bg-gray-800"
          />
        </div>
        <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
          Nueva Plantilla
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {mockPlantillas.map((plantilla) => (
          <Card key={plantilla.id} variant="bordered" padding="md" className="hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-primary-600" />
              </div>
              <Badge variant="secondary" size="sm">{plantilla.lineas} líneas</Badge>
            </div>

            <h3 className="font-semibold text-gray-900 dark:text-white">{plantilla.nombre}</h3>
            <p className="text-sm text-gray-500 font-mono mb-2">{plantilla.codigo}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{plantilla.descripcion}</p>

            <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
              <span className="text-xs text-gray-500">{plantilla.uso_mensual} usos este mes</span>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" className="p-1">
                  <Copy className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" className="p-1">
                  <Edit2 className="w-4 h-4" />
                </Button>
                <Button variant="primary" size="sm">
                  Usar
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

const BorradoresSection = () => {
  const borradores = mockComprobantes.filter(c => c.estado === 'borrador');

  return (
    <div className="space-y-4">
      {borradores.length === 0 ? (
        <Card variant="bordered" padding="lg">
          <div className="text-center py-8">
            <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No hay borradores pendientes</h3>
            <p className="text-gray-500">Todos los comprobantes han sido contabilizados</p>
          </div>
        </Card>
      ) : (
        <Card variant="bordered" padding="none">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Número</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Concepto</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Creado por</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {borradores.map((comp) => (
                <tr key={comp.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-4 py-3 font-mono text-sm font-medium text-primary-600">{comp.numero}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{comp.tipo.nombre}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{comp.fecha}</td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{comp.concepto}</td>
                  <td className="px-4 py-3 text-sm text-right font-medium">{formatCurrency(comp.total_debito)}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{comp.created_by}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="outline" size="sm">
                        Editar
                      </Button>
                      <Button variant="primary" size="sm">
                        Contabilizar
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
};

// ==================== MAIN COMPONENT ====================

export default function MovimientosContablesPage() {
  const tabs = [
    {
      id: 'comprobantes',
      label: 'Comprobantes',
      icon: <FileSpreadsheet className="w-4 h-4" />,
      content: <ComprobantesSection />,
    },
    {
      id: 'nuevo',
      label: 'Nuevo Comprobante',
      icon: <Plus className="w-4 h-4" />,
      content: <NuevoComprobanteSection />,
    },
    {
      id: 'plantillas',
      label: 'Plantillas',
      icon: <Copy className="w-4 h-4" />,
      content: <PlantillasSection />,
    },
    {
      id: 'borradores',
      label: 'Borradores',
      icon: <Clock className="w-4 h-4" />,
      badge: '1',
      content: <BorradoresSection />,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Movimientos Contables"
        description="Gestión de comprobantes y asientos contables"
      />

      <Tabs tabs={tabs} defaultTab="comprobantes" />
    </div>
  );
}
