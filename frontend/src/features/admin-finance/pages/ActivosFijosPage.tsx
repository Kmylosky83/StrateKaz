/**
 * Página: Activos Fijos
 *
 * Gestión de activos fijos con subsecciones:
 * - Inventario de Activos
 * - Depreciaciones
 * - Mantenimientos
 * - Movimientos
 */
import { useState } from 'react';
import {
  Building2,
  TrendingDown,
  Wrench,
  ArrowRightLeft,
  Plus,
  Filter,
  Download,
  Eye,
  Edit,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  MapPin,
  User,
  Calendar,
} from 'lucide-react';
import { PageHeader } from '@/components/layout';
import { Tabs } from '@/components/common/Tabs';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { cn } from '@/utils/cn';

// ==================== MOCK DATA ====================

const mockActivos = [
  { id: 1, codigo: 'AF-001', nombre: 'Computador Dell Optiplex', categoria: 'Equipos de Cómputo', ubicacion: 'Oficina Principal', responsable: 'Juan Pérez', costo_adquisicion: 4500000, depreciacion_acumulada: 1500000, valor_libros: 3000000, estado: 'activo' },
  { id: 2, codigo: 'AF-002', nombre: 'Montacargas Toyota', categoria: 'Maquinaria', ubicacion: 'Bodega A', responsable: 'Carlos Rodríguez', costo_adquisicion: 85000000, depreciacion_acumulada: 25000000, valor_libros: 60000000, estado: 'activo' },
  { id: 3, codigo: 'AF-003', nombre: 'Vehículo Chevrolet NHR', categoria: 'Vehículos', ubicacion: 'Parqueadero', responsable: 'Pedro López', costo_adquisicion: 65000000, depreciacion_acumulada: 20000000, valor_libros: 45000000, estado: 'en_mantenimiento' },
  { id: 4, codigo: 'AF-004', nombre: 'Impresora HP LaserJet', categoria: 'Equipos de Cómputo', ubicacion: 'Oficina Contabilidad', responsable: 'María García', costo_adquisicion: 2800000, depreciacion_acumulada: 1400000, valor_libros: 1400000, estado: 'activo' },
];

const mockDepreciaciones = [
  { id: 1, activo: 'Computador Dell Optiplex', periodo: '2024-12', valor_inicial: 3500000, depreciacion: 125000, valor_final: 3375000 },
  { id: 2, activo: 'Montacargas Toyota', periodo: '2024-12', valor_inicial: 62000000, depreciacion: 1416667, valor_final: 60583333 },
  { id: 3, activo: 'Vehículo Chevrolet NHR', periodo: '2024-12', valor_inicial: 46000000, depreciacion: 1083333, valor_final: 44916667 },
];

const mockMantenimientos = [
  { id: 1, activo: 'Montacargas Toyota', tipo: 'preventivo', descripcion: 'Cambio de aceite y filtros', fecha_programada: '2025-01-15', costo: 850000, estado: 'programado' },
  { id: 2, activo: 'Vehículo Chevrolet NHR', tipo: 'correctivo', descripcion: 'Reparación sistema de frenos', fecha_programada: '2024-12-28', costo: 1200000, estado: 'en_proceso' },
  { id: 3, activo: 'Impresora HP LaserJet', tipo: 'preventivo', descripcion: 'Limpieza general y cambio de toner', fecha_programada: '2025-01-10', costo: 350000, estado: 'programado' },
];

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(value);
};

// ==================== SECTIONS ====================

const InventarioSection = () => {
  const activos = mockActivos;
  const totalActivos = activos.length;
  const valorAdquisicion = activos.reduce((s, a) => s + a.costo_adquisicion, 0);
  const depreciacionAcumulada = activos.reduce((s, a) => s + a.depreciacion_acumulada, 0);
  const valorLibros = activos.reduce((s, a) => s + a.valor_libros, 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Activos</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{totalActivos}</p>
            </div>
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
              <Building2 className="w-6 h-6 text-primary-600" />
            </div>
          </div>
        </Card>

        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Valor Adquisición</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{formatCurrency(valorAdquisicion)}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Depreciación Acum.</p>
              <p className="text-2xl font-bold text-danger-600 mt-1">{formatCurrency(depreciacionAcumulada)}</p>
            </div>
            <div className="w-12 h-12 bg-danger-100 rounded-lg flex items-center justify-center">
              <TrendingDown className="w-6 h-6 text-danger-600" />
            </div>
          </div>
        </Card>

        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Valor en Libros</p>
              <p className="text-2xl font-bold text-success-600 mt-1">{formatCurrency(valorLibros)}</p>
            </div>
            <div className="w-12 h-12 bg-success-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-success-600" />
            </div>
          </div>
        </Card>
      </div>

      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Inventario de Activos</h3>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" leftIcon={<Filter className="w-4 h-4" />}>Filtros</Button>
          <Button variant="outline" size="sm" leftIcon={<Download className="w-4 h-4" />}>Exportar</Button>
          <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>Nuevo Activo</Button>
        </div>
      </div>

      <Card variant="bordered" padding="none">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Código</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categoría</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ubicación</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Valor Libros</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {activos.map((activo) => (
                <tr key={activo.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{activo.codigo}</td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{activo.nombre}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{activo.categoria}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {activo.ubicacion}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-right text-gray-900 dark:text-white">{formatCurrency(activo.valor_libros)}</td>
                  <td className="px-6 py-4">
                    <Badge variant={activo.estado === 'activo' ? 'success' : activo.estado === 'en_mantenimiento' ? 'warning' : 'danger'} size="sm">
                      {activo.estado === 'en_mantenimiento' ? 'En Mantenimiento' : activo.estado.charAt(0).toUpperCase() + activo.estado.slice(1)}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm"><Eye className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="sm"><Edit className="w-4 h-4" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

const DepreciacionesSection = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Depreciaciones Mensuales</h3>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" leftIcon={<Calendar className="w-4 h-4" />}>Periodo: 2024-12</Button>
          <Button variant="primary" size="sm" leftIcon={<TrendingDown className="w-4 h-4" />}>Calcular Depreciación</Button>
        </div>
      </div>

      <Card variant="bordered" padding="none">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Activo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Periodo</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Valor Inicial</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Depreciación</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Valor Final</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {mockDepreciaciones.map((dep) => (
                <tr key={dep.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{dep.activo}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{dep.periodo}</td>
                  <td className="px-6 py-4 text-sm text-right text-gray-900 dark:text-white">{formatCurrency(dep.valor_inicial)}</td>
                  <td className="px-6 py-4 text-sm font-medium text-right text-danger-600">{formatCurrency(dep.depreciacion)}</td>
                  <td className="px-6 py-4 text-sm font-medium text-right text-gray-900 dark:text-white">{formatCurrency(dep.valor_final)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

const MantenimientosSection = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Mantenimientos de Activos</h3>
        <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>Programar Mantenimiento</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {mockMantenimientos.map((mant) => (
          <Card key={mant.id} variant="bordered" padding="md">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white">{mant.activo}</h4>
                <p className="text-sm text-gray-500">{mant.descripcion}</p>
              </div>
              <Badge variant={mant.tipo === 'preventivo' ? 'primary' : 'warning'} size="sm">
                {mant.tipo.charAt(0).toUpperCase() + mant.tipo.slice(1)}
              </Badge>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Fecha programada</span>
                <span className="font-medium">{mant.fecha_programada}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Costo estimado</span>
                <span className="font-medium">{formatCurrency(mant.costo)}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
              <Badge variant={mant.estado === 'programado' ? 'primary' : mant.estado === 'en_proceso' ? 'warning' : 'success'} size="sm">
                {mant.estado === 'en_proceso' ? 'En Proceso' : mant.estado.charAt(0).toUpperCase() + mant.estado.slice(1)}
              </Badge>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm"><Eye className="w-4 h-4" /></Button>
                <Button variant="ghost" size="sm"><Edit className="w-4 h-4" /></Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

// ==================== MAIN COMPONENT ====================

export default function ActivosFijosPage() {
  const [activeTab, setActiveTab] = useState('inventario');

  const tabs = [
    { id: 'inventario', label: 'Inventario', icon: <Building2 className="w-4 h-4" /> },
    { id: 'depreciaciones', label: 'Depreciaciones', icon: <TrendingDown className="w-4 h-4" /> },
    { id: 'mantenimientos', label: 'Mantenimientos', icon: <Wrench className="w-4 h-4" /> },
    { id: 'movimientos', label: 'Movimientos', icon: <ArrowRightLeft className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-8">
      <PageHeader title="Activos Fijos" description="Inventario, depreciaciones y mantenimiento de activos fijos" />
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} variant="pills" />
      <div className="mt-6">
        {activeTab === 'inventario' && <InventarioSection />}
        {activeTab === 'depreciaciones' && <DepreciacionesSection />}
        {activeTab === 'mantenimientos' && <MantenimientosSection />}
        {activeTab === 'movimientos' && <div className="p-8 text-center text-gray-500">Movimientos de Activos - Próximamente</div>}
      </div>
    </div>
  );
}
