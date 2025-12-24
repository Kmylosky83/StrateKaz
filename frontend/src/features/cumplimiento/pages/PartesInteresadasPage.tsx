/**
 * Página de Partes Interesadas
 *
 * Gestión de stakeholders y comunicaciones:
 * - Identificación de partes interesadas
 * - Clasificación (Clientes, Proveedores, Comunidad, Gobierno, etc.)
 * - Expectativas y requisitos
 * - Matriz de comunicaciones
 * - Plan de relacionamiento
 *
 * Basado en ISO 9001:2015 / ISO 14001:2015 / ISO 45001:2018
 * Contexto de la organización y partes interesadas
 */
import { useState } from 'react';
import {
  Users,
  Plus,
  Search,
  Filter,
  Download,
  MessageSquare,
  TrendingUp,
  Building2,
  UserCircle,
  Globe,
  ShieldCheck,
  Heart,
} from 'lucide-react';
import { PageHeader } from '@/components/layout';

export default function PartesInteresadasPage() {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <PageHeader
        title="Partes Interesadas"
        description="Gestión de stakeholders, expectativas y matriz de comunicaciones"
      />

      {/* ESTADÍSTICAS RÁPIDAS */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Total Stakeholders</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">47</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Partes identificadas</p>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Clientes</span>
            <Building2 className="w-4 h-4 text-green-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">12</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Activos</p>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Proveedores</span>
            <ShieldCheck className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">18</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Críticos: 5</p>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Gobierno</span>
            <Globe className="w-4 h-4 text-orange-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">8</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Entidades</p>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Comunicaciones</span>
            <MessageSquare className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">124</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Este mes</p>
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
                placeholder="Buscar partes interesadas..."
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
              Nueva Parte Interesada
            </button>
          </div>
        </div>
      </div>

      {/* CATEGORÍAS */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {[
          { name: 'Clientes', count: 12, icon: Building2, color: 'green', influence: 'Alta' },
          { name: 'Proveedores', count: 18, icon: ShieldCheck, color: 'purple', influence: 'Media' },
          { name: 'Colaboradores', count: 5, icon: Heart, color: 'red', influence: 'Alta' },
          { name: 'Gobierno', count: 8, icon: Globe, color: 'orange', influence: 'Alta' },
          { name: 'Comunidad', count: 2, icon: Users, color: 'blue', influence: 'Media' },
          { name: 'Accionistas', count: 1, icon: TrendingUp, color: 'green', influence: 'Alta' },
          { name: 'Competencia', count: 1, icon: UserCircle, color: 'gray', influence: 'Baja' },
        ].map((category) => (
          <div
            key={category.name}
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
          >
            <div className="flex items-center justify-between mb-3">
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center
                ${
                  category.color === 'green'
                    ? 'bg-green-100 dark:bg-green-900/30'
                    : category.color === 'purple'
                    ? 'bg-purple-100 dark:bg-purple-900/30'
                    : category.color === 'red'
                    ? 'bg-red-100 dark:bg-red-900/30'
                    : category.color === 'orange'
                    ? 'bg-orange-100 dark:bg-orange-900/30'
                    : category.color === 'blue'
                    ? 'bg-blue-100 dark:bg-blue-900/30'
                    : 'bg-gray-100 dark:bg-gray-700'
                }
              `}
              >
                <category.icon
                  className={`w-5 h-5
                  ${
                    category.color === 'green'
                      ? 'text-green-600 dark:text-green-400'
                      : category.color === 'purple'
                      ? 'text-purple-600 dark:text-purple-400'
                      : category.color === 'red'
                      ? 'text-red-600 dark:text-red-400'
                      : category.color === 'orange'
                      ? 'text-orange-600 dark:text-orange-400'
                      : category.color === 'blue'
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-gray-600 dark:text-gray-400'
                  }
                `}
                />
              </div>
              <span className="text-2xl font-bold text-gray-900 dark:text-white">{category.count}</span>
            </div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-1">{category.name}</h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Influencia: <span className="font-medium">{category.influence}</span>
            </p>
          </div>
        ))}
      </div>

      {/* TABLA DE PARTES INTERESADAS */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Matriz de Partes Interesadas
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Categoría
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Nombre
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Expectativas
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Influencia
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Interés
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Frecuencia Comunicación
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Última Comunicación
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              <tr className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                <td className="px-4 py-4 whitespace-nowrap">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                    Cliente
                  </span>
                </td>
                <td className="px-4 py-4 text-sm font-medium text-gray-900 dark:text-white">
                  Distribuidora Central S.A.
                </td>
                <td className="px-4 py-4 text-sm text-gray-500 dark:text-gray-400">
                  Calidad de producto, entrega oportuna
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                    Alta
                  </span>
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                    Alto
                  </span>
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  Semanal
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  Hace 2 días
                </td>
              </tr>

              <tr className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                <td className="px-4 py-4 whitespace-nowrap">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
                    Proveedor
                  </span>
                </td>
                <td className="px-4 py-4 text-sm font-medium text-gray-900 dark:text-white">
                  Materias Primas del Norte
                </td>
                <td className="px-4 py-4 text-sm text-gray-500 dark:text-gray-400">
                  Pagos puntuales, volumen de compra
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400">
                    Media
                  </span>
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400">
                    Medio
                  </span>
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  Quincenal
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  Hace 5 días
                </td>
              </tr>

              <tr className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                <td className="px-4 py-4 whitespace-nowrap">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400">
                    Gobierno
                  </span>
                </td>
                <td className="px-4 py-4 text-sm font-medium text-gray-900 dark:text-white">
                  Secretaría de Salud
                </td>
                <td className="px-4 py-4 text-sm text-gray-500 dark:text-gray-400">
                  Cumplimiento normativo, reportes
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                    Alta
                  </span>
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                    Bajo
                  </span>
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  Semestral
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  Hace 45 días
                </td>
              </tr>

              <tr className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                <td className="px-4 py-4 whitespace-nowrap">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                    Colaboradores
                  </span>
                </td>
                <td className="px-4 py-4 text-sm font-medium text-gray-900 dark:text-white">Sindicato</td>
                <td className="px-4 py-4 text-sm text-gray-500 dark:text-gray-400">
                  Condiciones laborales, seguridad
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                    Alta
                  </span>
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                    Alto
                  </span>
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  Mensual
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  Hace 12 días
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 border-t border-gray-200 dark:border-gray-600 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700 dark:text-gray-300">
              Mostrando <span className="font-medium">1</span> a <span className="font-medium">10</span> de{' '}
              <span className="font-medium">47</span> resultados
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

      {/* MATRIZ PODER/INTERÉS */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Matriz Poder / Interés
        </h3>
        <div className="grid grid-cols-2 gap-4 h-96">
          <div className="border-2 border-gray-300 dark:border-gray-600 rounded-lg p-4 bg-green-50/50 dark:bg-green-900/10">
            <h4 className="font-medium text-sm text-gray-900 dark:text-white mb-2">
              Alto Poder / Bajo Interés
            </h4>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">Mantener Satisfechos</p>
            <div className="space-y-2">
              <div className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded p-2 text-xs">
                Gobierno
              </div>
            </div>
          </div>
          <div className="border-2 border-red-300 dark:border-red-600 rounded-lg p-4 bg-red-50/50 dark:bg-red-900/10">
            <h4 className="font-medium text-sm text-gray-900 dark:text-white mb-2">
              Alto Poder / Alto Interés
            </h4>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">Gestionar de Cerca</p>
            <div className="space-y-2">
              <div className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded p-2 text-xs">
                Clientes Principales
              </div>
              <div className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded p-2 text-xs">
                Sindicato
              </div>
            </div>
          </div>
          <div className="border-2 border-gray-300 dark:border-gray-600 rounded-lg p-4 bg-gray-50/50 dark:bg-gray-700/10">
            <h4 className="font-medium text-sm text-gray-900 dark:text-white mb-2">
              Bajo Poder / Bajo Interés
            </h4>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">Monitorear</p>
            <div className="space-y-2">
              <div className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded p-2 text-xs">
                Competencia
              </div>
            </div>
          </div>
          <div className="border-2 border-blue-300 dark:border-blue-600 rounded-lg p-4 bg-blue-50/50 dark:bg-blue-900/10">
            <h4 className="font-medium text-sm text-gray-900 dark:text-white mb-2">
              Bajo Poder / Alto Interés
            </h4>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">Mantener Informados</p>
            <div className="space-y-2">
              <div className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded p-2 text-xs">
                Proveedores
              </div>
              <div className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded p-2 text-xs">
                Comunidad
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
