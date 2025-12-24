import { Landmark, ArrowLeft, AlertTriangle, Shield, Users, DollarSign } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function SagrilaftPteePage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Link
          to="/riesgos"
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </Link>
        <div className="flex items-center gap-3">
          <div className="p-3 bg-purple-100 rounded-lg">
            <Landmark className="h-8 w-8 text-purple-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">SAGRILAFT / PTEE</h1>
            <p className="text-gray-600">Sistema Antilavado de Activos y Contra el Terrorismo</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Shield className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">SAGRILAFT</h3>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Sistema de Autocontrol y Gestión del Riesgo Integral de Lavado de Activos y Financiación del Terrorismo
          </p>
          <div className="space-y-3">
            <div className="p-3 bg-purple-50 border border-purple-200 rounded">
              <p className="text-sm font-medium text-purple-900">Debida Diligencia</p>
              <p className="text-xs text-purple-700 mt-1">Conocimiento de clientes y proveedores</p>
            </div>
            <div className="p-3 bg-indigo-50 border border-indigo-200 rounded">
              <p className="text-sm font-medium text-indigo-900">Señales de Alerta</p>
              <p className="text-xs text-indigo-700 mt-1">Detección de operaciones inusuales</p>
            </div>
            <div className="p-3 bg-violet-50 border border-violet-200 rounded">
              <p className="text-sm font-medium text-violet-900">Matriz de Riesgo LA/FT</p>
              <p className="text-xs text-violet-700 mt-1">Evaluación de riesgo integral</p>
            </div>
            <div className="p-3 bg-fuchsia-50 border border-fuchsia-200 rounded">
              <p className="text-sm font-medium text-fuchsia-900">Reportes a UIAF</p>
              <p className="text-xs text-fuchsia-700 mt-1">Operaciones sospechosas e inusuales</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">PTEE</h3>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Programa de Transparencia y Ética Empresarial
          </p>
          <div className="space-y-3">
            <div className="p-3 bg-red-50 border border-red-200 rounded">
              <p className="text-sm font-medium text-red-900">Prevención de Soborno</p>
              <p className="text-xs text-red-700 mt-1">Antisoborno y anticorrupción</p>
            </div>
            <div className="p-3 bg-orange-50 border border-orange-200 rounded">
              <p className="text-sm font-medium text-orange-900">Código de Ética</p>
              <p className="text-xs text-orange-700 mt-1">Principios y valores organizacionales</p>
            </div>
            <div className="p-3 bg-amber-50 border border-amber-200 rounded">
              <p className="text-sm font-medium text-amber-900">Canal de Denuncias</p>
              <p className="text-xs text-amber-700 mt-1">Reporte de irregularidades</p>
            </div>
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
              <p className="text-sm font-medium text-yellow-900">Debida Diligencia</p>
              <p className="text-xs text-yellow-700 mt-1">Terceros y funcionarios públicos</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Elementos del Sistema SAGRILAFT</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <Users className="h-6 w-6 text-white" />
            </div>
            <p className="text-sm font-semibold text-blue-900 mb-1">Oficial de Cumplimiento</p>
            <p className="text-xs text-blue-700">Responsable del sistema</p>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <p className="text-sm font-semibold text-purple-900 mb-1">Políticas</p>
            <p className="text-xs text-purple-700">Marco normativo interno</p>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <div className="w-12 h-12 bg-orange-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <DollarSign className="h-6 w-6 text-white" />
            </div>
            <p className="text-sm font-semibold text-orange-900 mb-1">Metodología</p>
            <p className="text-xs text-orange-700">Identificación y gestión</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="h-6 w-6 text-white" />
            </div>
            <p className="text-sm font-semibold text-green-900 mb-1">Monitoreo</p>
            <p className="text-xs text-green-700">Seguimiento continuo</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Factores de Riesgo LA/FT</h3>
          <div className="space-y-2 text-xs">
            <div className="p-2 bg-red-50 rounded">
              <p className="font-medium text-red-900">Clientes / Proveedores</p>
              <p className="text-red-700">Perfil de riesgo de terceros</p>
            </div>
            <div className="p-2 bg-orange-50 rounded">
              <p className="font-medium text-orange-900">Productos / Servicios</p>
              <p className="text-orange-700">Susceptibilidad al riesgo</p>
            </div>
            <div className="p-2 bg-yellow-50 rounded">
              <p className="font-medium text-yellow-900">Canales de Distribución</p>
              <p className="text-yellow-700">Medios de comercialización</p>
            </div>
            <div className="p-2 bg-purple-50 rounded">
              <p className="font-medium text-purple-900">Jurisdicciones</p>
              <p className="text-purple-700">Zonas geográficas</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Marco Normativo</h3>
          <div className="space-y-2 text-xs text-gray-700">
            <p>• Circular Externa 100-000016 de 2020 (SFC)</p>
            <p>• Circular Externa 170 de 2002 (Supersociedades)</p>
            <p>• Resolución 314 de 2021 (Mincomercio)</p>
            <p>• Ley 1778 de 2016</p>
            <p>• Decreto 1674 de 2016</p>
            <p>• ISO 37001:2016 (Antisoborno)</p>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Señales de Alerta</h3>
          <div className="space-y-2 text-xs text-gray-700">
            <p>• Operaciones inusuales o complejas</p>
            <p>• Transacciones en efectivo frecuentes</p>
            <p>• Clientes en listas restrictivas</p>
            <p>• Inconsistencias documentales</p>
            <p>• Operaciones sin justificación económica</p>
            <p>• Resistencia a aportar información</p>
          </div>
        </div>
      </div>

      <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
        <div className="flex items-start gap-4">
          <Landmark className="h-6 w-6 text-purple-600 flex-shrink-0 mt-1" />
          <div>
            <h3 className="text-lg font-semibold text-purple-900 mb-2">Próximamente</h3>
            <p className="text-purple-800 text-sm">
              Esta página implementará el Sistema SAGRILAFT/PTEE completo, incluyendo debida diligencia de terceros,
              matriz de riesgo LA/FT, señales de alerta, gestión de reportes a UIAF, conocimiento de empleados,
              canal de denuncias y seguimiento de casos. Compatible con Circular Externa 100-000016 de 2020.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
