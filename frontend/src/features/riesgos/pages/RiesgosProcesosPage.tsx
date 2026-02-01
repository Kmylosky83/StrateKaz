import { AlertTriangle, ArrowLeft, Target, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function RiesgosProcesosPage() {
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
          <div className="p-3 bg-orange-100 rounded-lg">
            <AlertTriangle className="h-8 w-8 text-orange-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Riesgos y Oportunidades</h1>
            <p className="text-gray-600">Gestión de riesgos y oportunidades por proceso</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Riesgos</h3>
          </div>
          <div className="space-y-4">
            <div className="border-l-4 border-red-500 pl-4 py-2">
              <p className="text-sm font-medium text-gray-900">Riesgos Estratégicos</p>
              <p className="text-xs text-gray-600 mt-1">Afectan los objetivos estratégicos</p>
            </div>
            <div className="border-l-4 border-orange-500 pl-4 py-2">
              <p className="text-sm font-medium text-gray-900">Riesgos Operacionales</p>
              <p className="text-xs text-gray-600 mt-1">Procesos del día a día</p>
            </div>
            <div className="border-l-4 border-yellow-500 pl-4 py-2">
              <p className="text-sm font-medium text-gray-900">Riesgos Financieros</p>
              <p className="text-xs text-gray-600 mt-1">Impacto económico</p>
            </div>
            <div className="border-l-4 border-purple-500 pl-4 py-2">
              <p className="text-sm font-medium text-gray-900">Riesgos de Cumplimiento</p>
              <p className="text-xs text-gray-600 mt-1">Normatividad y regulaciones</p>
            </div>
            <div className="border-l-4 border-pink-500 pl-4 py-2">
              <p className="text-sm font-medium text-gray-900">Riesgos Reputacionales</p>
              <p className="text-xs text-gray-600 mt-1">Imagen y confianza</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Oportunidades</h3>
          </div>
          <div className="space-y-4">
            <div className="border-l-4 border-green-500 pl-4 py-2">
              <p className="text-sm font-medium text-gray-900">Expansión de Mercado</p>
              <p className="text-xs text-gray-600 mt-1">Nuevos segmentos y territorios</p>
            </div>
            <div className="border-l-4 border-blue-500 pl-4 py-2">
              <p className="text-sm font-medium text-gray-900">Innovación Tecnológica</p>
              <p className="text-xs text-gray-600 mt-1">Automatización y digitalización</p>
            </div>
            <div className="border-l-4 border-cyan-500 pl-4 py-2">
              <p className="text-sm font-medium text-gray-900">Alianzas Estratégicas</p>
              <p className="text-xs text-gray-600 mt-1">Colaboraciones y sinergias</p>
            </div>
            <div className="border-l-4 border-indigo-500 pl-4 py-2">
              <p className="text-sm font-medium text-gray-900">Optimización de Procesos</p>
              <p className="text-xs text-gray-600 mt-1">Eficiencia operacional</p>
            </div>
            <div className="border-l-4 border-teal-500 pl-4 py-2">
              <p className="text-sm font-medium text-gray-900">Sostenibilidad</p>
              <p className="text-xs text-gray-600 mt-1">Economía circular y responsabilidad</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-orange-100 rounded-lg">
            <Target className="h-6 w-6 text-orange-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Metodología de Gestión</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-2xl font-bold text-blue-600 mb-1">1</p>
            <p className="text-sm font-medium text-blue-900">Identificación</p>
            <p className="text-xs text-blue-700 mt-1">Detectar riesgos y oportunidades</p>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <p className="text-2xl font-bold text-orange-600 mb-1">2</p>
            <p className="text-sm font-medium text-orange-900">Análisis</p>
            <p className="text-xs text-orange-700 mt-1">Evaluar probabilidad e impacto</p>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <p className="text-2xl font-bold text-purple-600 mb-1">3</p>
            <p className="text-sm font-medium text-purple-900">Tratamiento</p>
            <p className="text-xs text-purple-700 mt-1">Definir acciones de control</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-2xl font-bold text-green-600 mb-1">4</p>
            <p className="text-sm font-medium text-green-900">Monitoreo</p>
            <p className="text-xs text-green-700 mt-1">Seguimiento y revisión</p>
          </div>
        </div>
      </div>

      <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
        <div className="flex items-start gap-4">
          <AlertTriangle className="h-6 w-6 text-orange-600 flex-shrink-0 mt-1" />
          <div>
            <h3 className="text-lg font-semibold text-orange-900 mb-2">Próximamente</h3>
            <p className="text-orange-800 text-sm">
              Esta página permitirá identificar, evaluar y gestionar riesgos y oportunidades por proceso. Incluirá
              matrices de riesgos, mapas de calor, planes de tratamiento y seguimiento de controles según ISO 31000
              e ISO 9001:2015 (cláusula 6.1).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
