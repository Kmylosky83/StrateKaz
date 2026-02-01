/**
 * Página: Configuración de Indicadores
 *
 * CRUD completo para la configuración de KPIs con 4 tabs:
 * - Catálogo KPIs
 * - Fichas Técnicas
 * - Metas
 * - Semáforos
 */
import { useState } from 'react';
import {
  BarChart3,
  FileText,
  Target,
  Palette,
  Plus,
  Edit,
  Trash2,
  Eye,
  Filter,
  Search,
  Download,
} from 'lucide-react';
import { PageHeader } from '@/components/layout';
import { Tabs } from '@/components/common/Tabs';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { cn } from '@/utils/cn';

// ==================== MOCK DATA ====================

const mockCatalogo = [
  {
    id: 1,
    codigo: 'KPI-SST-001',
    nombre: 'Índice de Frecuencia de Accidentalidad',
    categoria: 'sst',
    tipo_indicador: 'eficacia',
    perspectiva_bsc: 'procesos',
    frecuencia_medicion: 'mensual',
    unidad_medida: 'IF',
    activo: true,
  },
  {
    id: 2,
    codigo: 'KPI-FIN-001',
    nombre: 'EBITDA Mensual',
    categoria: 'financiero',
    tipo_indicador: 'efectividad',
    perspectiva_bsc: 'financiera',
    frecuencia_medicion: 'mensual',
    unidad_medida: '%',
    activo: true,
  },
  {
    id: 3,
    codigo: 'KPI-OP-001',
    nombre: 'Eficiencia Operacional',
    categoria: 'operacional',
    tipo_indicador: 'eficiencia',
    perspectiva_bsc: 'procesos',
    frecuencia_medicion: 'mensual',
    unidad_medida: '%',
    activo: true,
  },
  {
    id: 4,
    codigo: 'KPI-COM-001',
    nombre: 'Satisfacción del Cliente',
    categoria: 'comercial',
    tipo_indicador: 'eficacia',
    perspectiva_bsc: 'cliente',
    frecuencia_medicion: 'trimestral',
    unidad_medida: '/5',
    activo: true,
  },
  {
    id: 5,
    codigo: 'KPI-PESV-001',
    nombre: 'Cumplimiento Inspección Preoperacional',
    categoria: 'pesv',
    tipo_indicador: 'eficacia',
    perspectiva_bsc: 'procesos',
    frecuencia_medicion: 'mensual',
    unidad_medida: '%',
    activo: true,
  },
];

const mockFichasTecnicas = [
  {
    id: 1,
    kpi_codigo: 'KPI-SST-001',
    kpi_nombre: 'Índice de Frecuencia de Accidentalidad',
    formula: '(Número de AT / Horas trabajadas) x 200,000',
    fuente_datos: 'Sistema HSEQ - Módulo Accidentalidad',
    responsable_nombre: 'María García - Coordinadora SST',
  },
  {
    id: 2,
    kpi_codigo: 'KPI-FIN-001',
    kpi_nombre: 'EBITDA Mensual',
    formula: '(Utilidad Operacional + Depreciación + Amortización) / Ingresos x 100',
    fuente_datos: 'Sistema Contable - Estados Financieros',
    responsable_nombre: 'Carlos Rodríguez - Gerente Financiero',
  },
];

const mockMetas = [
  {
    id: 1,
    kpi_codigo: 'KPI-SST-001',
    kpi_nombre: 'Índice de Frecuencia de Accidentalidad',
    periodo: '2024',
    meta_minima: 3.0,
    meta_esperada: 2.5,
    meta_optima: 2.0,
    activa: true,
  },
  {
    id: 2,
    kpi_codigo: 'KPI-FIN-001',
    kpi_nombre: 'EBITDA Mensual',
    periodo: '2024',
    meta_minima: 12.0,
    meta_esperada: 15.0,
    meta_optima: 18.0,
    activa: true,
  },
  {
    id: 3,
    kpi_codigo: 'KPI-OP-001',
    kpi_nombre: 'Eficiencia Operacional',
    periodo: '2024',
    meta_minima: 80.0,
    meta_esperada: 85.0,
    meta_optima: 90.0,
    activa: true,
  },
];

const mockSemaforos = [
  {
    id: 1,
    kpi_codigo: 'KPI-SST-001',
    kpi_nombre: 'Índice de Frecuencia de Accidentalidad',
    umbral_verde_min: 0,
    umbral_verde_max: 2.5,
    umbral_amarillo_min: 2.5,
    umbral_amarillo_max: 3.5,
    umbral_rojo_min: 3.5,
    umbral_rojo_max: 999,
    logica_inversa: true,
  },
  {
    id: 2,
    kpi_codigo: 'KPI-FIN-001',
    kpi_nombre: 'EBITDA Mensual',
    umbral_verde_min: 15.0,
    umbral_verde_max: 999,
    umbral_amarillo_min: 12.0,
    umbral_amarillo_max: 15.0,
    umbral_rojo_min: 0,
    umbral_rojo_max: 12.0,
    logica_inversa: false,
  },
];

// ==================== UTILITY FUNCTIONS ====================

const getCategoriaColor = (categoria: string) => {
  const colors = {
    sst: 'bg-orange-100 text-orange-800',
    pesv: 'bg-blue-100 text-blue-800',
    ambiental: 'bg-green-100 text-green-800',
    calidad: 'bg-purple-100 text-purple-800',
    financiero: 'bg-indigo-100 text-indigo-800',
    operacional: 'bg-cyan-100 text-cyan-800',
    rrhh: 'bg-pink-100 text-pink-800',
    comercial: 'bg-teal-100 text-teal-800',
  };
  return colors[categoria as keyof typeof colors] || 'bg-gray-100 text-gray-800';
};

// ==================== SECTIONS ====================

const CatalogoKPISection = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const catalogos = mockCatalogo;

  return (
    <div className="space-y-4">
      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar KPIs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
          <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
            Nuevo KPI
          </Button>
        </div>
      </div>

      {/* Table */}
      <Card variant="bordered" padding="none">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Código
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Nombre
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Categoría
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Perspectiva BSC
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Frecuencia
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Estado
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {catalogos.map((kpi) => (
                <tr
                  key={kpi.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                >
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                    {kpi.codigo}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                    {kpi.nombre}
                  </td>
                  <td className="px-6 py-4">
                    <Badge
                      variant="gray"
                      size="sm"
                      className={getCategoriaColor(kpi.categoria)}
                    >
                      {kpi.categoria.toUpperCase()}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300 capitalize">
                    {kpi.tipo_indicador}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300 capitalize">
                    {kpi.perspectiva_bsc}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300 capitalize">
                    {kpi.frecuencia_medicion}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <Badge variant={kpi.activo ? 'success' : 'gray'} size="sm">
                      {kpi.activo ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
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

const FichasTecnicasSection = () => {
  const fichas = mockFichasTecnicas;

  return (
    <div className="space-y-4">
      {/* Actions */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Fichas Técnicas de KPIs
        </h3>
        <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
          Nueva Ficha
        </Button>
      </div>

      {/* Grid de Fichas */}
      <div className="grid grid-cols-1 gap-4">
        {fichas.map((ficha) => (
          <Card key={ficha.id} variant="bordered" padding="md">
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">
                    {ficha.kpi_nombre}
                  </h4>
                  <p className="text-sm text-gray-500">{ficha.kpi_codigo}</p>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm">
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Edit className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">
                    Fórmula
                  </label>
                  <p className="text-sm text-gray-900 dark:text-white mt-1 font-mono bg-gray-50 dark:bg-gray-800 p-2 rounded">
                    {ficha.formula}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">
                    Fuente de Datos
                  </label>
                  <p className="text-sm text-gray-900 dark:text-white mt-1">
                    {ficha.fuente_datos}
                  </p>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-500 uppercase">
                  Responsable de Medición
                </label>
                <p className="text-sm text-gray-900 dark:text-white mt-1">
                  {ficha.responsable_nombre}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

const MetasSection = () => {
  const metas = mockMetas;

  return (
    <div className="space-y-4">
      {/* Actions */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Metas por KPI
        </h3>
        <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
          Nueva Meta
        </Button>
      </div>

      {/* Table */}
      <Card variant="bordered" padding="none">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  KPI
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Periodo
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Mínima
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Esperada
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Óptima
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Estado
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {metas.map((meta) => (
                <tr
                  key={meta.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                >
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {meta.kpi_nombre}
                      </p>
                      <p className="text-xs text-gray-500">{meta.kpi_codigo}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                    {meta.periodo}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-right text-gray-900 dark:text-white">
                    {meta.meta_minima}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-right text-primary-600">
                    {meta.meta_esperada}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-right text-success-600">
                    {meta.meta_optima}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <Badge variant={meta.activa ? 'success' : 'gray'} size="sm">
                      {meta.activa ? 'Activa' : 'Inactiva'}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
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

const SemaforosSection = () => {
  const semaforos = mockSemaforos;

  return (
    <div className="space-y-4">
      {/* Actions */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Configuración de Semáforos
        </h3>
        <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
          Nuevo Semáforo
        </Button>
      </div>

      {/* Grid de Semáforos */}
      <div className="grid grid-cols-1 gap-4">
        {semaforos.map((semaforo) => (
          <Card key={semaforo.id} variant="bordered" padding="md">
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">
                    {semaforo.kpi_nombre}
                  </h4>
                  <p className="text-sm text-gray-500">{semaforo.kpi_codigo}</p>
                  {semaforo.logica_inversa && (
                    <Badge variant="info" size="sm" className="mt-2">
                      Lógica Inversa (menor es mejor)
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm">
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </Button>
                </div>
              </div>

              {/* Barras de Semáforo */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 bg-green-500 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold">Verde</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {semaforo.umbral_verde_min} - {semaforo.umbral_verde_max}
                    </p>
                    <p className="text-xs text-gray-500">
                      Óptimo - Meta cumplida
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 bg-yellow-500 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold">Amarillo</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {semaforo.umbral_amarillo_min} - {semaforo.umbral_amarillo_max}
                    </p>
                    <p className="text-xs text-gray-500">
                      Alerta - Requiere atención
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 bg-red-500 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold">Rojo</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {semaforo.umbral_rojo_min} - {semaforo.umbral_rojo_max}
                    </p>
                    <p className="text-xs text-gray-500">
                      Crítico - Acción inmediata
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

// ==================== MAIN COMPONENT ====================

export default function ConfigIndicadoresPage() {
  const [activeTab, setActiveTab] = useState('catalogo');

  const tabs = [
    { id: 'catalogo', label: 'Catálogo KPIs', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'fichas', label: 'Fichas Técnicas', icon: <FileText className="w-4 h-4" /> },
    { id: 'metas', label: 'Metas', icon: <Target className="w-4 h-4" /> },
    { id: 'semaforos', label: 'Semáforos', icon: <Palette className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Configuración de Indicadores"
        description="Administración del catálogo de KPIs, fichas técnicas, metas y semáforos"
      />

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} variant="pills" />

      <div className="mt-6">
        {activeTab === 'catalogo' && <CatalogoKPISection />}
        {activeTab === 'fichas' && <FichasTecnicasSection />}
        {activeTab === 'metas' && <MetasSection />}
        {activeTab === 'semaforos' && <SemaforosSection />}
      </div>
    </div>
  );
}
