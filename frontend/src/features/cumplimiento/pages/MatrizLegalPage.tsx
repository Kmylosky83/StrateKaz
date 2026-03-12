/**
 * Página de Matriz Legal - Tab 1 de Cumplimiento Normativo
 *
 * Layout estándar con secciones:
 * - PageHeader con título y tabs de secciones inline
 * - Contenido de la sección activa (Normas, Evaluación)
 */
import { useState } from 'react';
import {
  Scale,
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  AlertCircle,
  CheckCircle2,
  Tag,
  BookOpen,
  ClipboardCheck,
  type LucideIcon,
} from 'lucide-react';
import { PageHeader } from '@/components/layout';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/forms/Input';
import { usePageSections } from '@/hooks/usePageSections';

// Códigos del módulo y tab en la BD
const MODULE_CODE = 'motor_cumplimiento';
const TAB_CODE = 'matriz_legal';

// Mapeo de nombres de iconos a componentes
const _ICON_MAP: Record<string, LucideIcon> = {
  BookOpen,
  ClipboardCheck,
  Scale,
  AlertCircle,
  CheckCircle2,
};

// ============================================================================
// SECCIÓN: NORMAS
// ============================================================================
const NormasSection = () => {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <>
      {/* ESTADÍSTICAS RÁPIDAS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Total Normativas</span>
            <Scale className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">127</p>
          <p className="text-xs text-green-600 mt-1">+5 este mes</p>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Vigentes</span>
            <CheckCircle2 className="w-4 h-4 text-green-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">115</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Aplicables actualmente</p>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Derogadas</span>
            <AlertCircle className="w-4 h-4 text-orange-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">12</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Históricas</p>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Cumplimiento</span>
            <CheckCircle2 className="w-4 h-4 text-green-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">96%</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Estado general</p>
        </div>
      </div>

      {/* BARRA DE ACCIONES */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Buscador */}
          <div className="flex-1">
            <Input
              placeholder="Buscar por número, nombre o área..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>

          {/* Botones de acción */}
          <div className="flex gap-2">
            <Button variant="outline" size="sm" leftIcon={<Filter className="w-4 h-4" />}>
              Filtros
            </Button>
            <Button variant="outline" size="sm" leftIcon={<Download className="w-4 h-4" />}>
              Exportar
            </Button>
            <Button variant="outline" size="sm" leftIcon={<Upload className="w-4 h-4" />}>
              Importar
            </Button>
            <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
              Nueva Normativa
            </Button>
          </div>
        </div>
      </div>

      {/* TABLA DE NORMATIVAS */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Número
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Nombre
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Área
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Fecha Expedición
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Cumplimiento
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {/* Ejemplo de filas */}
              <tr className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                <td className="px-4 py-4 whitespace-nowrap">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                    Decreto
                  </span>
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                  1072/2015
                </td>
                <td className="px-4 py-4 text-sm text-gray-900 dark:text-white">
                  Decreto Único Reglamentario del Sector Trabajo
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400">
                    SST
                  </span>
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  26/05/2015
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                    <CheckCircle2 className="w-3 h-3" />
                    Vigente
                  </span>
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div className="bg-green-600 h-2 rounded-full" style={{ width: '95%' }}></div>
                    </div>
                    <span className="text-xs text-gray-600 dark:text-gray-400">95%</span>
                  </div>
                </td>
              </tr>

              <tr className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                <td className="px-4 py-4 whitespace-nowrap">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
                    Resolución
                  </span>
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                  0312/2019
                </td>
                <td className="px-4 py-4 text-sm text-gray-900 dark:text-white">
                  Estándares Mínimos del SG-SST
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400">
                    SST
                  </span>
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  13/02/2019
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                    <CheckCircle2 className="w-3 h-3" />
                    Vigente
                  </span>
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div className="bg-green-600 h-2 rounded-full" style={{ width: '88%' }}></div>
                    </div>
                    <span className="text-xs text-gray-600 dark:text-gray-400">88%</span>
                  </div>
                </td>
              </tr>

              <tr className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                <td className="px-4 py-4 whitespace-nowrap">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                    Ley
                  </span>
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                  1562/2012
                </td>
                <td className="px-4 py-4 text-sm text-gray-900 dark:text-white">
                  Sistema General de Riesgos Laborales
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400">
                    SST
                  </span>
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  11/07/2012
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                    <CheckCircle2 className="w-3 h-3" />
                    Vigente
                  </span>
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{ width: '100%' }}
                      ></div>
                    </div>
                    <span className="text-xs text-gray-600 dark:text-gray-400">100%</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 border-t border-gray-200 dark:border-gray-600 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700 dark:text-gray-300">
              Mostrando <span className="font-medium">1</span> a{' '}
              <span className="font-medium">10</span> de <span className="font-medium">127</span>{' '}
              resultados
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                Anterior
              </Button>
              <Button variant="primary" size="sm">
                1
              </Button>
              <Button variant="outline" size="sm">
                2
              </Button>
              <Button variant="outline" size="sm">
                Siguiente
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* FILTROS POR ÁREA */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Filtrar por área</h3>
        <div className="flex flex-wrap gap-2">
          {[
            { label: 'SST', count: 45, color: 'orange' },
            { label: 'Ambiental', count: 28, color: 'green' },
            { label: 'Calidad', count: 22, color: 'blue' },
            { label: 'Comercial', count: 15, color: 'purple' },
            { label: 'Laboral', count: 12, color: 'red' },
            { label: 'Tributaria', count: 5, color: 'yellow' },
          ].map((area) => (
            <Button
              key={area.label}
              variant="outline"
              size="sm"
              leftIcon={<Tag className="w-3.5 h-3.5" />}
              className={`
                ${
                  area.color === 'orange'
                    ? 'border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100 dark:bg-orange-900/20 dark:border-orange-800 dark:text-orange-400'
                    : area.color === 'green'
                      ? 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400'
                      : area.color === 'blue'
                        ? 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400'
                        : area.color === 'purple'
                          ? 'border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100 dark:bg-purple-900/20 dark:border-purple-800 dark:text-purple-400'
                          : area.color === 'red'
                            ? 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400'
                            : 'border-yellow-200 bg-yellow-50 text-yellow-700 hover:bg-yellow-100 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-400'
                }
              `}
            >
              {area.label}
              <span className="ml-2 opacity-60">({area.count})</span>
            </Button>
          ))}
        </div>
      </div>
    </>
  );
};

// ============================================================================
// SECCIÓN: EVALUACIÓN
// ============================================================================
const EvaluacionSection = () => {
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
      <div className="text-center py-12">
        <ClipboardCheck className="w-16 h-16 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Evaluación de Cumplimiento
        </h3>
        <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
          Aquí podrás evaluar el cumplimiento de cada artículo de las normas registradas, documentar
          evidencias y generar reportes de estado.
        </p>
        <Button
          variant="primary"
          size="sm"
          className="mt-6"
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Nueva Evaluación
        </Button>
      </div>
    </div>
  );
};

// ============================================================================
// PÁGINA PRINCIPAL
// ============================================================================
export default function MatrizLegalPage() {
  // Hook que maneja secciones localmente
  const {
    sections,
    activeSection,
    setActiveSection,
    activeSectionData,
    isLoading: sectionsLoading,
  } = usePageSections({
    moduleCode: MODULE_CODE,
    tabCode: TAB_CODE,
  });

  // Si está cargando, mostrar skeleton
  if (sectionsLoading && !activeSection) {
    return (
      <div className="space-y-4">
        <div className="h-12 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
        <div className="h-96 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
      </div>
    );
  }

  // Renderizar contenido según sección activa
  const renderSectionContent = () => {
    switch (activeSection) {
      case 'normas':
        return <NormasSection />;
      case 'evaluacion':
        return <EvaluacionSection />;
      default:
        return <NormasSection />;
    }
  };

  return (
    <div className="space-y-6">
      {/* PageHeader con título y tabs de secciones inline */}
      <PageHeader
        title="Matriz Legal"
        description={
          activeSectionData.description ||
          'Gestión de decretos, leyes, resoluciones y normativa aplicable'
        }
        sections={sections}
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        moduleColor="blue"
      />

      {/* Contenido de la sección activa */}
      {renderSectionContent()}
    </div>
  );
}
