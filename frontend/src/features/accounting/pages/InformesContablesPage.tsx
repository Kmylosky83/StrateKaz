/**
 * Página: Informes Contables
 *
 * Generación de estados financieros:
 * - Balance General: Estado de situación financiera
 * - Estado de Resultados: Pérdidas y ganancias
 * - Libros: Mayor, diario, auxiliares
 * - Reportes: Reportes personalizados
 */
import { useState } from 'react';
import {
  BarChart3,
  FileText,
  BookOpen,
  FileSpreadsheet,
  Download,
  Printer,
  Calendar,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Building2,
  Filter,
  Eye,
  RefreshCw,
} from 'lucide-react';
import { PageHeader } from '@/components/layout';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Tabs } from '@/components/common/Tabs';
import { cn } from '@/utils/cn';

// ==================== MOCK DATA ====================

const mockBalanceGeneral = {
  fecha: '2024-12-31',
  activos: {
    corrientes: [
      { cuenta: '11', nombre: 'DISPONIBLE', saldo: 245000000 },
      { cuenta: '13', nombre: 'DEUDORES', saldo: 180000000 },
      { cuenta: '14', nombre: 'INVENTARIOS', saldo: 320000000 },
    ],
    no_corrientes: [
      { cuenta: '15', nombre: 'PROPIEDADES, PLANTA Y EQUIPO', saldo: 850000000 },
      { cuenta: '16', nombre: 'INTANGIBLES', saldo: 45000000 },
      { cuenta: '17', nombre: 'DIFERIDOS', saldo: 28000000 },
    ],
  },
  pasivos: {
    corrientes: [
      { cuenta: '21', nombre: 'OBLIGACIONES FINANCIERAS', saldo: 120000000 },
      { cuenta: '22', nombre: 'PROVEEDORES', saldo: 185000000 },
      { cuenta: '23', nombre: 'CUENTAS POR PAGAR', saldo: 95000000 },
      { cuenta: '24', nombre: 'IMPUESTOS', saldo: 45000000 },
      { cuenta: '25', nombre: 'OBLIGACIONES LABORALES', saldo: 68000000 },
    ],
    no_corrientes: [
      { cuenta: '21', nombre: 'OBLIGACIONES FINANCIERAS LP', saldo: 280000000 },
      { cuenta: '27', nombre: 'DIFERIDOS', saldo: 35000000 },
    ],
  },
  patrimonio: [
    { cuenta: '31', nombre: 'CAPITAL SOCIAL', saldo: 500000000 },
    { cuenta: '33', nombre: 'RESERVAS', saldo: 85000000 },
    { cuenta: '36', nombre: 'RESULTADOS DEL EJERCICIO', saldo: 255000000 },
  ],
};

const mockEstadoResultados = {
  periodo: { inicio: '2024-01-01', fin: '2024-12-31' },
  ingresos: [
    { cuenta: '41', nombre: 'INGRESOS OPERACIONALES', valor: 2850000000 },
    { cuenta: '42', nombre: 'NO OPERACIONALES', valor: 45000000 },
  ],
  costos: [
    { cuenta: '61', nombre: 'COSTO DE VENTAS', valor: 1650000000 },
  ],
  gastos: [
    { cuenta: '51', nombre: 'OPERACIONALES DE ADMINISTRACIÓN', valor: 420000000 },
    { cuenta: '52', nombre: 'OPERACIONALES DE VENTAS', valor: 380000000 },
    { cuenta: '53', nombre: 'NO OPERACIONALES', valor: 85000000 },
  ],
  impuestos: 105000000,
};

const mockLibrosMayor = [
  { cuenta: '110505', nombre: 'Caja general', saldo_anterior: 15000000, debitos: 85000000, creditos: 78000000, saldo_final: 22000000 },
  { cuenta: '111005', nombre: 'Bancos nacionales', saldo_anterior: 180000000, debitos: 450000000, creditos: 407000000, saldo_final: 223000000 },
  { cuenta: '130505', nombre: 'Clientes nacionales', saldo_anterior: 120000000, debitos: 285000000, creditos: 225000000, saldo_final: 180000000 },
  { cuenta: '143505', nombre: 'Materias primas', saldo_anterior: 280000000, debitos: 650000000, creditos: 610000000, saldo_final: 320000000 },
  { cuenta: '220505', nombre: 'Proveedores nacionales', saldo_anterior: 150000000, debitos: 420000000, creditos: 455000000, saldo_final: 185000000 },
];

const mockReportesDisponibles = [
  { id: 1, nombre: 'Balance de Comprobación', descripcion: 'Sumas y saldos de todas las cuentas', categoria: 'libros', frecuencia: 'Mensual' },
  { id: 2, nombre: 'Libro Diario', descripcion: 'Registro cronológico de transacciones', categoria: 'libros', frecuencia: 'Diario' },
  { id: 3, nombre: 'Certificación de Retenciones', descripcion: 'Certificado para proveedores', categoria: 'fiscal', frecuencia: 'Anual' },
  { id: 4, nombre: 'Medios Magnéticos', descripcion: 'Información exógena DIAN', categoria: 'fiscal', frecuencia: 'Anual' },
  { id: 5, nombre: 'Análisis de Cartera', descripcion: 'Antigüedad de cuentas por cobrar', categoria: 'gestion', frecuencia: 'Mensual' },
  { id: 6, nombre: 'Flujo de Caja', descripcion: 'Movimiento de efectivo', categoria: 'gestion', frecuencia: 'Mensual' },
];

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(value);
};

// ==================== COMPONENTS ====================

const BalanceGeneralSection = () => {
  const balance = mockBalanceGeneral;
  const totalActivosCorrientes = balance.activos.corrientes.reduce((sum, a) => sum + a.saldo, 0);
  const totalActivosNoCorrientes = balance.activos.no_corrientes.reduce((sum, a) => sum + a.saldo, 0);
  const totalActivos = totalActivosCorrientes + totalActivosNoCorrientes;

  const totalPasivosCorrientes = balance.pasivos.corrientes.reduce((sum, p) => sum + p.saldo, 0);
  const totalPasivosNoCorrientes = balance.pasivos.no_corrientes.reduce((sum, p) => sum + p.saldo, 0);
  const totalPasivos = totalPasivosCorrientes + totalPasivosNoCorrientes;

  const totalPatrimonio = balance.patrimonio.reduce((sum, p) => sum + p.saldo, 0);

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Fecha de Corte</label>
            <input
              type="date"
              defaultValue="2024-12-31"
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Centro de Costo</label>
            <select className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800">
              <option value="">Todos</option>
              <option value="ADM">Administración</option>
              <option value="OPE">Operaciones</option>
            </select>
          </div>
          <Button variant="outline" size="sm" leftIcon={<RefreshCw className="w-4 h-4" />} className="mt-5">
            Actualizar
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" leftIcon={<Download className="w-4 h-4" />}>
            Excel
          </Button>
          <Button variant="outline" size="sm" leftIcon={<FileText className="w-4 h-4" />}>
            PDF
          </Button>
          <Button variant="outline" size="sm" leftIcon={<Printer className="w-4 h-4" />}>
            Imprimir
          </Button>
        </div>
      </div>

      {/* Balance General */}
      <Card variant="bordered" padding="md">
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">GRASAS Y HUESOS DEL NORTE S.A.S.</h2>
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">BALANCE GENERAL</h3>
          <p className="text-sm text-gray-500">Al 31 de Diciembre de 2024</p>
          <p className="text-xs text-gray-400">(Cifras expresadas en pesos colombianos)</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* ACTIVOS */}
          <div>
            <h4 className="font-bold text-gray-900 dark:text-white border-b-2 border-gray-900 dark:border-white pb-2 mb-4">
              ACTIVOS
            </h4>

            <div className="mb-4">
              <h5 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Activos Corrientes</h5>
              {balance.activos.corrientes.map((item) => (
                <div key={item.cuenta} className="flex justify-between py-1 text-sm">
                  <span className="text-gray-600 dark:text-gray-400">{item.nombre}</span>
                  <span className="font-mono">{formatCurrency(item.saldo)}</span>
                </div>
              ))}
              <div className="flex justify-between py-1 text-sm font-semibold border-t border-gray-200 dark:border-gray-700 mt-2">
                <span>Total Activos Corrientes</span>
                <span className="font-mono">{formatCurrency(totalActivosCorrientes)}</span>
              </div>
            </div>

            <div className="mb-4">
              <h5 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Activos No Corrientes</h5>
              {balance.activos.no_corrientes.map((item) => (
                <div key={item.cuenta} className="flex justify-between py-1 text-sm">
                  <span className="text-gray-600 dark:text-gray-400">{item.nombre}</span>
                  <span className="font-mono">{formatCurrency(item.saldo)}</span>
                </div>
              ))}
              <div className="flex justify-between py-1 text-sm font-semibold border-t border-gray-200 dark:border-gray-700 mt-2">
                <span>Total Activos No Corrientes</span>
                <span className="font-mono">{formatCurrency(totalActivosNoCorrientes)}</span>
              </div>
            </div>

            <div className="flex justify-between py-2 font-bold text-lg border-t-2 border-gray-900 dark:border-white">
              <span>TOTAL ACTIVOS</span>
              <span className="font-mono text-primary-600">{formatCurrency(totalActivos)}</span>
            </div>
          </div>

          {/* PASIVOS Y PATRIMONIO */}
          <div>
            <h4 className="font-bold text-gray-900 dark:text-white border-b-2 border-gray-900 dark:border-white pb-2 mb-4">
              PASIVOS Y PATRIMONIO
            </h4>

            <div className="mb-4">
              <h5 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Pasivos Corrientes</h5>
              {balance.pasivos.corrientes.map((item) => (
                <div key={item.cuenta} className="flex justify-between py-1 text-sm">
                  <span className="text-gray-600 dark:text-gray-400">{item.nombre}</span>
                  <span className="font-mono">{formatCurrency(item.saldo)}</span>
                </div>
              ))}
              <div className="flex justify-between py-1 text-sm font-semibold border-t border-gray-200 dark:border-gray-700 mt-2">
                <span>Total Pasivos Corrientes</span>
                <span className="font-mono">{formatCurrency(totalPasivosCorrientes)}</span>
              </div>
            </div>

            <div className="mb-4">
              <h5 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Pasivos No Corrientes</h5>
              {balance.pasivos.no_corrientes.map((item) => (
                <div key={item.cuenta} className="flex justify-between py-1 text-sm">
                  <span className="text-gray-600 dark:text-gray-400">{item.nombre}</span>
                  <span className="font-mono">{formatCurrency(item.saldo)}</span>
                </div>
              ))}
              <div className="flex justify-between py-1 text-sm font-semibold border-t border-gray-200 dark:border-gray-700 mt-2">
                <span>Total Pasivos No Corrientes</span>
                <span className="font-mono">{formatCurrency(totalPasivosNoCorrientes)}</span>
              </div>
            </div>

            <div className="flex justify-between py-2 font-semibold border-t border-gray-300 dark:border-gray-600">
              <span>TOTAL PASIVOS</span>
              <span className="font-mono">{formatCurrency(totalPasivos)}</span>
            </div>

            <div className="mb-4 mt-4">
              <h5 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Patrimonio</h5>
              {balance.patrimonio.map((item) => (
                <div key={item.cuenta} className="flex justify-between py-1 text-sm">
                  <span className="text-gray-600 dark:text-gray-400">{item.nombre}</span>
                  <span className="font-mono">{formatCurrency(item.saldo)}</span>
                </div>
              ))}
              <div className="flex justify-between py-1 text-sm font-semibold border-t border-gray-200 dark:border-gray-700 mt-2">
                <span>Total Patrimonio</span>
                <span className="font-mono">{formatCurrency(totalPatrimonio)}</span>
              </div>
            </div>

            <div className="flex justify-between py-2 font-bold text-lg border-t-2 border-gray-900 dark:border-white">
              <span>TOTAL PASIVO + PATRIMONIO</span>
              <span className="font-mono text-primary-600">{formatCurrency(totalPasivos + totalPatrimonio)}</span>
            </div>
          </div>
        </div>

        {/* Verificación */}
        <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <div className="flex items-center justify-center gap-2">
            <Badge variant="success">Cuadrado</Badge>
            <span className="text-sm text-green-700 dark:text-green-300">
              Activos ({formatCurrency(totalActivos)}) = Pasivos + Patrimonio ({formatCurrency(totalPasivos + totalPatrimonio)})
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
};

const EstadoResultadosSection = () => {
  const estado = mockEstadoResultados;
  const totalIngresos = estado.ingresos.reduce((sum, i) => sum + i.valor, 0);
  const totalCostos = estado.costos.reduce((sum, c) => sum + c.valor, 0);
  const totalGastos = estado.gastos.reduce((sum, g) => sum + g.valor, 0);
  const utilidadBruta = totalIngresos - totalCostos;
  const utilidadOperacional = utilidadBruta - totalGastos;
  const utilidadNeta = utilidadOperacional - estado.impuestos;

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Período</label>
            <div className="flex items-center gap-2">
              <input
                type="date"
                defaultValue="2024-01-01"
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800"
              />
              <span className="text-gray-500">a</span>
              <input
                type="date"
                defaultValue="2024-12-31"
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800"
              />
            </div>
          </div>
          <Button variant="outline" size="sm" leftIcon={<RefreshCw className="w-4 h-4" />} className="mt-5">
            Actualizar
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" leftIcon={<Download className="w-4 h-4" />}>
            Excel
          </Button>
          <Button variant="outline" size="sm" leftIcon={<FileText className="w-4 h-4" />}>
            PDF
          </Button>
        </div>
      </div>

      {/* Estado de Resultados */}
      <Card variant="bordered" padding="md">
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">GRASAS Y HUESOS DEL NORTE S.A.S.</h2>
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">ESTADO DE RESULTADOS</h3>
          <p className="text-sm text-gray-500">Del 1 de Enero al 31 de Diciembre de 2024</p>
          <p className="text-xs text-gray-400">(Cifras expresadas en pesos colombianos)</p>
        </div>

        <div className="max-w-2xl mx-auto">
          {/* Ingresos */}
          <div className="mb-4">
            <h5 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">INGRESOS</h5>
            {estado.ingresos.map((item) => (
              <div key={item.cuenta} className="flex justify-between py-1 text-sm">
                <span className="text-gray-600 dark:text-gray-400">{item.nombre}</span>
                <span className="font-mono">{formatCurrency(item.valor)}</span>
              </div>
            ))}
            <div className="flex justify-between py-1 text-sm font-semibold border-t border-gray-200 dark:border-gray-700 mt-2">
              <span>TOTAL INGRESOS</span>
              <span className="font-mono text-green-600">{formatCurrency(totalIngresos)}</span>
            </div>
          </div>

          {/* Costos */}
          <div className="mb-4">
            <h5 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">COSTOS</h5>
            {estado.costos.map((item) => (
              <div key={item.cuenta} className="flex justify-between py-1 text-sm">
                <span className="text-gray-600 dark:text-gray-400">{item.nombre}</span>
                <span className="font-mono">({formatCurrency(item.valor)})</span>
              </div>
            ))}
            <div className="flex justify-between py-1 text-sm font-semibold border-t border-gray-200 dark:border-gray-700 mt-2">
              <span>UTILIDAD BRUTA</span>
              <span className="font-mono text-blue-600">{formatCurrency(utilidadBruta)}</span>
            </div>
          </div>

          {/* Gastos */}
          <div className="mb-4">
            <h5 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">GASTOS OPERACIONALES</h5>
            {estado.gastos.map((item) => (
              <div key={item.cuenta} className="flex justify-between py-1 text-sm">
                <span className="text-gray-600 dark:text-gray-400">{item.nombre}</span>
                <span className="font-mono">({formatCurrency(item.valor)})</span>
              </div>
            ))}
            <div className="flex justify-between py-1 text-sm font-semibold border-t border-gray-200 dark:border-gray-700 mt-2">
              <span>UTILIDAD OPERACIONAL</span>
              <span className="font-mono text-blue-600">{formatCurrency(utilidadOperacional)}</span>
            </div>
          </div>

          {/* Impuestos y Utilidad Neta */}
          <div className="mb-4">
            <div className="flex justify-between py-1 text-sm">
              <span className="text-gray-600 dark:text-gray-400">Provisión Impuesto de Renta</span>
              <span className="font-mono">({formatCurrency(estado.impuestos)})</span>
            </div>
          </div>

          <div className="flex justify-between py-3 font-bold text-lg border-t-2 border-gray-900 dark:border-white">
            <span>UTILIDAD NETA DEL EJERCICIO</span>
            <span className={cn('font-mono', utilidadNeta >= 0 ? 'text-green-600' : 'text-red-600')}>
              {formatCurrency(utilidadNeta)}
            </span>
          </div>
        </div>

        {/* KPIs */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg text-center">
            <p className="text-sm text-gray-500">Margen Bruto</p>
            <p className="text-2xl font-bold text-blue-600">{((utilidadBruta / totalIngresos) * 100).toFixed(1)}%</p>
          </div>
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg text-center">
            <p className="text-sm text-gray-500">Margen Operacional</p>
            <p className="text-2xl font-bold text-blue-600">{((utilidadOperacional / totalIngresos) * 100).toFixed(1)}%</p>
          </div>
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg text-center">
            <p className="text-sm text-gray-500">Margen Neto</p>
            <p className="text-2xl font-bold text-green-600">{((utilidadNeta / totalIngresos) * 100).toFixed(1)}%</p>
          </div>
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg text-center">
            <p className="text-sm text-gray-500">EBITDA</p>
            <p className="text-2xl font-bold text-primary-600">{formatCurrency(utilidadOperacional + 45000000)}</p>
          </div>
        </div>
      </Card>
    </div>
  );
};

const LibrosSection = () => {
  return (
    <div className="space-y-6">
      {/* Filtros */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Tipo de Libro</label>
            <select className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800">
              <option value="mayor">Libro Mayor</option>
              <option value="diario">Libro Diario</option>
              <option value="auxiliar">Auxiliares</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Período</label>
            <select className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800">
              <option value="12">Diciembre 2024</option>
              <option value="11">Noviembre 2024</option>
              <option value="10">Octubre 2024</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Cuenta</label>
            <input
              type="text"
              placeholder="Código de cuenta..."
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800"
            />
          </div>
          <Button variant="outline" size="sm" leftIcon={<Filter className="w-4 h-4" />} className="mt-5">
            Filtrar
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" leftIcon={<Download className="w-4 h-4" />}>
            Exportar
          </Button>
          <Button variant="outline" size="sm" leftIcon={<Printer className="w-4 h-4" />}>
            Imprimir
          </Button>
        </div>
      </div>

      {/* Libro Mayor */}
      <Card variant="bordered" padding="none">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <h3 className="font-semibold text-gray-900 dark:text-white">Libro Mayor - Diciembre 2024</h3>
        </div>
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cuenta</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Saldo Anterior</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Débitos</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Créditos</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Saldo Final</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Detalle</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {mockLibrosMayor.map((libro) => (
              <tr key={libro.cuenta} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <td className="px-4 py-3 font-mono text-sm font-medium text-primary-600">{libro.cuenta}</td>
                <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{libro.nombre}</td>
                <td className="px-4 py-3 text-sm text-right font-mono">{formatCurrency(libro.saldo_anterior)}</td>
                <td className="px-4 py-3 text-sm text-right font-mono text-blue-600">{formatCurrency(libro.debitos)}</td>
                <td className="px-4 py-3 text-sm text-right font-mono text-green-600">{formatCurrency(libro.creditos)}</td>
                <td className="px-4 py-3 text-sm text-right font-mono font-medium">{formatCurrency(libro.saldo_final)}</td>
                <td className="px-4 py-3 text-center">
                  <Button variant="ghost" size="sm" className="p-1">
                    <Eye className="w-4 h-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700">
            <tr>
              <td colSpan={2} className="px-4 py-3 font-semibold">TOTALES</td>
              <td className="px-4 py-3 text-right font-mono font-semibold">{formatCurrency(595000000)}</td>
              <td className="px-4 py-3 text-right font-mono font-semibold text-blue-600">{formatCurrency(1890000000)}</td>
              <td className="px-4 py-3 text-right font-mono font-semibold text-green-600">{formatCurrency(1720000000)}</td>
              <td className="px-4 py-3 text-right font-mono font-semibold">{formatCurrency(930000000)}</td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </Card>
    </div>
  );
};

const ReportesSection = () => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Libros Oficiales */}
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary-600" />
            Libros Oficiales
          </h3>
          <div className="space-y-3">
            {mockReportesDisponibles.filter(r => r.categoria === 'libros').map((reporte) => (
              <Card key={reporte.id} variant="bordered" padding="sm" className="hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">{reporte.nombre}</h4>
                    <p className="text-xs text-gray-500 mt-1">{reporte.descripcion}</p>
                  </div>
                  <Badge variant="secondary" size="sm">{reporte.frecuencia}</Badge>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Reportes Fiscales */}
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-orange-600" />
            Reportes Fiscales
          </h3>
          <div className="space-y-3">
            {mockReportesDisponibles.filter(r => r.categoria === 'fiscal').map((reporte) => (
              <Card key={reporte.id} variant="bordered" padding="sm" className="hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">{reporte.nombre}</h4>
                    <p className="text-xs text-gray-500 mt-1">{reporte.descripcion}</p>
                  </div>
                  <Badge variant="warning" size="sm">{reporte.frecuencia}</Badge>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Reportes de Gestión */}
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-green-600" />
            Reportes de Gestión
          </h3>
          <div className="space-y-3">
            {mockReportesDisponibles.filter(r => r.categoria === 'gestion').map((reporte) => (
              <Card key={reporte.id} variant="bordered" padding="sm" className="hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">{reporte.nombre}</h4>
                    <p className="text-xs text-gray-500 mt-1">{reporte.descripcion}</p>
                  </div>
                  <Badge variant="success" size="sm">{reporte.frecuencia}</Badge>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ==================== MAIN COMPONENT ====================

export default function InformesContablesPage() {
  const tabs = [
    {
      id: 'balance',
      label: 'Balance General',
      icon: <FileSpreadsheet className="w-4 h-4" />,
      content: <BalanceGeneralSection />,
    },
    {
      id: 'resultados',
      label: 'Estado de Resultados',
      icon: <TrendingUp className="w-4 h-4" />,
      content: <EstadoResultadosSection />,
    },
    {
      id: 'libros',
      label: 'Libros',
      icon: <BookOpen className="w-4 h-4" />,
      content: <LibrosSection />,
    },
    {
      id: 'reportes',
      label: 'Reportes',
      icon: <BarChart3 className="w-4 h-4" />,
      content: <ReportesSection />,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Informes Contables"
        description="Estados financieros y reportes del sistema contable"
      />

      <Tabs tabs={tabs} defaultTab="balance" />
    </div>
  );
}
