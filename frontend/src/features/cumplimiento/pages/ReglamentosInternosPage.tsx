/**
 * Página de Reglamentos Internos
 *
 * Gestión de reglamentos con versionamiento:
 * - Reglamento Interno de Trabajo
 * - Reglamento de Higiene y Seguridad Industrial
 * - Políticas organizacionales
 * - Códigos de conducta
 * - Control de versiones y aprobaciones
 * - Notificaciones y divulgación
 */
import { useState } from 'react';
import {
  FileText,
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  CheckCircle2,
  Clock,
  Eye,
  GitBranch,
  Users,
  Calendar,
} from 'lucide-react';
import { PageHeader } from '@/components/layout';

export default function ReglamentosInternosPage() {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <PageHeader
        title="Reglamentos Internos"
        description="Gestión de reglamentos con control de versiones y aprobaciones"
      />

      {/* ESTADÍSTICAS RÁPIDAS */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Total Documentos</span>
            <FileText className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">15</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Reglamentos activos</p>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Versiones</span>
            <GitBranch className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">42</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Historial total</p>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Aprobados</span>
            <CheckCircle2 className="w-4 h-4 text-green-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">13</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Vigentes</p>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">En Revisión</span>
            <Clock className="w-4 h-4 text-orange-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">2</p>
          <p className="text-xs text-orange-600 mt-1">Pendientes de aprobación</p>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Divulgación</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">87%</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Empleados notificados</p>
        </div>
      </div>

      {/* BARRA DE ACCIONES */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Buscador */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar reglamentos o políticas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex gap-2">
            <button className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
              <Filter className="w-4 h-4 mr-2" />
              Filtros
            </button>
            <button className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </button>
            <button className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium">
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Reglamento
            </button>
          </div>
        </div>
      </div>

      {/* TABLA DE REGLAMENTOS */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Código
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Nombre del Reglamento
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Versión
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Fecha Aprobación
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Aprobado Por
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Divulgación
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {/* Reglamento aprobado */}
              <tr className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                  RIT-001
                </td>
                <td className="px-4 py-4 text-sm text-gray-900 dark:text-white">
                  Reglamento Interno de Trabajo
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <GitBranch className="w-4 h-4 text-purple-600" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">v3.0</span>
                  </div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  15/01/2024
                </td>
                <td className="px-4 py-4 text-sm text-gray-500 dark:text-gray-400">
                  Gerente General
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
                      <div className="bg-green-600 h-2 rounded-full" style={{ width: '100%' }}></div>
                    </div>
                    <span className="text-xs text-gray-600 dark:text-gray-400">100%</span>
                  </div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <button className="text-blue-600 hover:text-blue-700">
                    <Eye className="w-4 h-4" />
                  </button>
                </td>
              </tr>

              <tr className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                  RHSI-001
                </td>
                <td className="px-4 py-4 text-sm text-gray-900 dark:text-white">
                  Reglamento de Higiene y Seguridad Industrial
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <GitBranch className="w-4 h-4 text-purple-600" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">v2.1</span>
                  </div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  20/03/2024
                </td>
                <td className="px-4 py-4 text-sm text-gray-500 dark:text-gray-400">
                  Coordinador SST
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
                <td className="px-4 py-4 whitespace-nowrap">
                  <button className="text-blue-600 hover:text-blue-700">
                    <Eye className="w-4 h-4" />
                  </button>
                </td>
              </tr>

              {/* En revisión */}
              <tr className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer bg-orange-50/50 dark:bg-orange-900/10">
                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                  POL-AMB-001
                </td>
                <td className="px-4 py-4 text-sm text-gray-900 dark:text-white">
                  Política de Gestión Ambiental
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <GitBranch className="w-4 h-4 text-purple-600" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">v1.1</span>
                    <span className="text-xs text-orange-600">(Borrador)</span>
                  </div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  -
                </td>
                <td className="px-4 py-4 text-sm text-gray-500 dark:text-gray-400">-</td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400">
                    <Clock className="w-3 h-3" />
                    En Revisión
                  </span>
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <span className="text-xs text-gray-500 dark:text-gray-400">Pendiente</span>
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <button className="text-blue-600 hover:text-blue-700">
                    <Eye className="w-4 h-4" />
                  </button>
                </td>
              </tr>

              <tr className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                  COD-ETI-001
                </td>
                <td className="px-4 py-4 text-sm text-gray-900 dark:text-white">Código de Ética</td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <GitBranch className="w-4 h-4 text-purple-600" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">v1.0</span>
                  </div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  10/02/2024
                </td>
                <td className="px-4 py-4 text-sm text-gray-500 dark:text-gray-400">Junta Directiva</td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                    <CheckCircle2 className="w-3 h-3" />
                    Vigente
                  </span>
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div className="bg-orange-600 h-2 rounded-full" style={{ width: '72%' }}></div>
                    </div>
                    <span className="text-xs text-gray-600 dark:text-gray-400">72%</span>
                  </div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <button className="text-blue-600 hover:text-blue-700">
                    <Eye className="w-4 h-4" />
                  </button>
                </td>
              </tr>

              <tr className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                  POL-CAL-001
                </td>
                <td className="px-4 py-4 text-sm text-gray-900 dark:text-white">
                  Política Integrada de Calidad
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <GitBranch className="w-4 h-4 text-purple-600" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">v2.0</span>
                  </div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  05/04/2024
                </td>
                <td className="px-4 py-4 text-sm text-gray-500 dark:text-gray-400">
                  Gerente General
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
                <td className="px-4 py-4 whitespace-nowrap">
                  <button className="text-blue-600 hover:text-blue-700">
                    <Eye className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 border-t border-gray-200 dark:border-gray-600 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700 dark:text-gray-300">
              Mostrando <span className="font-medium">1</span> a <span className="font-medium">5</span> de{' '}
              <span className="font-medium">15</span> resultados
            </div>
            <div className="flex gap-2">
              <button className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-600">
                Anterior
              </button>
              <button className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">
                1
              </button>
              <button className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-600">
                2
              </button>
              <button className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-600">
                Siguiente
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* HISTORIAL DE VERSIONES */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-purple-600" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Próximas Revisiones Programadas
            </h3>
          </div>
          <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
            Ver todas →
          </button>
        </div>
        <div className="space-y-3">
          {[
            { name: 'Reglamento Interno de Trabajo', code: 'RIT-001', dueDate: '15/01/2025', version: 'v3.0 → v4.0' },
            { name: 'Política de Calidad', code: 'POL-CAL-001', dueDate: '05/04/2025', version: 'v2.0 → v3.0' },
          ].map((item, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {item.name} <span className="text-sm text-gray-500">({item.code})</span>
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Actualización: {item.version}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900 dark:text-white">{item.dueDate}</p>
                <button className="text-xs text-blue-600 hover:text-blue-700">
                  Programar revisión
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
