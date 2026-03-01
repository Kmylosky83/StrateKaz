/**
 * Página de Requisitos Legales
 *
 * Gestión de licencias, permisos, conceptos y autorizaciones:
 * - Licencias de funcionamiento
 * - Permisos ambientales
 * - Registros sanitarios
 * - Conceptos de bomberos
 * - Certificaciones técnicas
 * - Control de vencimientos y renovaciones
 */
import { useState } from 'react';
import {
  BookOpen,
  Plus,
  Search,
  Filter,
  Download,
  AlertCircle,
  CheckCircle2,
  Clock,
  FileCheck,
  Calendar,
  Bell,
} from 'lucide-react';
import { PageHeader } from '@/components/layout';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/forms/Input';

export default function RequisitosLegalesPage() {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <PageHeader
        title="Requisitos Legales"
        description="Gestión de licencias, permisos, conceptos y autorizaciones"
      />

      {/* ESTADÍSTICAS RÁPIDAS */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Total Requisitos</span>
            <BookOpen className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">24</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Licencias y permisos</p>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Vigentes</span>
            <CheckCircle2 className="w-4 h-4 text-green-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">18</p>
          <p className="text-xs text-green-600 mt-1">Al día</p>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Por Vencer</span>
            <Clock className="w-4 h-4 text-orange-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">3</p>
          <p className="text-xs text-orange-600 mt-1">Próximos 30 días</p>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Vencidas</span>
            <AlertCircle className="w-4 h-4 text-red-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">2</p>
          <p className="text-xs text-red-600 mt-1">Requieren atención</p>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">En Trámite</span>
            <FileCheck className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">1</p>
          <p className="text-xs text-blue-600 mt-1">En proceso</p>
        </div>
      </div>

      {/* ALERTAS IMPORTANTES */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
              <Clock className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-orange-900 dark:text-orange-100 mb-1">
                3 Requisitos próximos a vencer
              </h4>
              <p className="text-sm text-orange-700 dark:text-orange-300">
                Renovaciones requeridas en los próximos 30 días
              </p>
              <Button variant="ghost" size="sm" className="mt-2 text-sm font-medium text-orange-700 dark:text-orange-400 hover:underline p-0 h-auto">
                Ver detalles →
              </Button>
            </div>
          </div>
        </div>

        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-red-900 dark:text-red-100 mb-1">2 Requisitos vencidos</h4>
              <p className="text-sm text-red-700 dark:text-red-300">
                Acción inmediata requerida para mantener cumplimiento
              </p>
              <Button variant="ghost" size="sm" className="mt-2 text-sm font-medium text-red-700 dark:text-red-400 hover:underline p-0 h-auto">
                Gestionar ahora →
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* BARRA DE ACCIONES */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Buscador */}
          <div className="flex-1">
            <Input
              placeholder="Buscar licencias, permisos o autorizaciones..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>

          {/* Botones de acción */}
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              Filtros
            </Button>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
            <Button variant="primary" size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Requisito
            </Button>
          </div>
        </div>
      </div>

      {/* TABLA DE REQUISITOS */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Nombre
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Entidad
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Número/Código
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Fecha Expedición
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Fecha Vencimiento
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Días Restantes
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {/* Vencida */}
              <tr className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer bg-red-50/50 dark:bg-red-900/10">
                <td className="px-4 py-4 whitespace-nowrap">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                    Licencia
                  </span>
                </td>
                <td className="px-4 py-4 text-sm font-medium text-gray-900 dark:text-white">
                  Licencia Sanitaria
                </td>
                <td className="px-4 py-4 text-sm text-gray-500 dark:text-gray-400">
                  Secretaría de Salud
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  LS-2023-0458
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  15/02/2023
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  15/02/2024
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                    <AlertCircle className="w-3 h-3" />
                    Vencida
                  </span>
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <span className="text-sm font-medium text-red-600">-90 días</span>
                </td>
              </tr>

              {/* Por vencer */}
              <tr className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer bg-orange-50/50 dark:bg-orange-900/10">
                <td className="px-4 py-4 whitespace-nowrap">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                    Permiso
                  </span>
                </td>
                <td className="px-4 py-4 text-sm font-medium text-gray-900 dark:text-white">
                  Permiso Ambiental
                </td>
                <td className="px-4 py-4 text-sm text-gray-500 dark:text-gray-400">CAR</td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  PA-2024-1523
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  10/01/2024
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  10/01/2025
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400">
                    <Clock className="w-3 h-3" />
                    Por Vencer
                  </span>
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <span className="text-sm font-medium text-orange-600">18 días</span>
                </td>
              </tr>

              {/* Vigente */}
              <tr className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                <td className="px-4 py-4 whitespace-nowrap">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
                    Concepto
                  </span>
                </td>
                <td className="px-4 py-4 text-sm font-medium text-gray-900 dark:text-white">
                  Concepto Técnico Bomberos
                </td>
                <td className="px-4 py-4 text-sm text-gray-500 dark:text-gray-400">Bomberos Bogotá</td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  CTB-2024-0892
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  05/06/2024
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  05/06/2025
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                    <CheckCircle2 className="w-3 h-3" />
                    Vigente
                  </span>
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <span className="text-sm text-gray-600 dark:text-gray-400">164 días</span>
                </td>
              </tr>

              {/* En trámite */}
              <tr className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                <td className="px-4 py-4 whitespace-nowrap">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                    Licencia
                  </span>
                </td>
                <td className="px-4 py-4 text-sm font-medium text-gray-900 dark:text-white">
                  Licencia de Construcción
                </td>
                <td className="px-4 py-4 text-sm text-gray-500 dark:text-gray-400">Curaduría Urbana</td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  LC-2024-1156
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  -
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  -
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                    <FileCheck className="w-3 h-3" />
                    En Trámite
                  </span>
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <span className="text-sm text-gray-600 dark:text-gray-400">-</span>
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
              <span className="font-medium">24</span> resultados
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">Anterior</Button>
              <Button variant="primary" size="sm">1</Button>
              <Button variant="outline" size="sm">Siguiente</Button>
            </div>
          </div>
        </div>
      </div>

      {/* CALENDARIO DE VENCIMIENTOS */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Próximos Vencimientos
            </h3>
          </div>
          <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
            Ver calendario completo →
          </Button>
        </div>
        <div className="space-y-3">
          {[
            { name: 'Permiso Ambiental', entity: 'CAR', days: 18, status: 'warning' },
            { name: 'Registro Mercantil', entity: 'Cámara de Comercio', days: 25, status: 'warning' },
            { name: 'Certificado INVIMA', entity: 'INVIMA', days: 28, status: 'warning' },
          ].map((item, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                  <Bell className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{item.name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{item.entity}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-orange-600">Vence en {item.days} días</p>
                <Button variant="ghost" size="sm" className="text-xs text-blue-600 hover:text-blue-700 p-0 h-auto">Programar renovación</Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
