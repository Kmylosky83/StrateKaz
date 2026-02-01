import { TrendingUp, ArrowLeft, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ContextoOrganizacionalPage() {
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
            <TrendingUp className="h-8 w-8 text-orange-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Contexto Organizacional</h1>
            <p className="text-gray-600">Análisis DOFA, PESTEL y 5 Fuerzas de Porter</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Análisis DOFA</h3>
          <div className="space-y-3">
            <div className="p-3 bg-green-50 border border-green-200 rounded">
              <p className="text-sm font-medium text-green-900">Fortalezas</p>
              <p className="text-xs text-green-700 mt-1">Factores internos positivos</p>
            </div>
            <div className="p-3 bg-blue-50 border border-blue-200 rounded">
              <p className="text-sm font-medium text-blue-900">Oportunidades</p>
              <p className="text-xs text-blue-700 mt-1">Factores externos positivos</p>
            </div>
            <div className="p-3 bg-orange-50 border border-orange-200 rounded">
              <p className="text-sm font-medium text-orange-900">Debilidades</p>
              <p className="text-xs text-orange-700 mt-1">Factores internos negativos</p>
            </div>
            <div className="p-3 bg-red-50 border border-red-200 rounded">
              <p className="text-sm font-medium text-red-900">Amenazas</p>
              <p className="text-xs text-red-700 mt-1">Factores externos negativos</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Análisis PESTEL</h3>
          <div className="space-y-3">
            <div className="p-3 bg-purple-50 border border-purple-200 rounded">
              <p className="text-sm font-medium text-purple-900">Político</p>
              <p className="text-xs text-purple-700 mt-1">Regulaciones y estabilidad</p>
            </div>
            <div className="p-3 bg-indigo-50 border border-indigo-200 rounded">
              <p className="text-sm font-medium text-indigo-900">Económico</p>
              <p className="text-xs text-indigo-700 mt-1">Indicadores macroeconómicos</p>
            </div>
            <div className="p-3 bg-pink-50 border border-pink-200 rounded">
              <p className="text-sm font-medium text-pink-900">Social</p>
              <p className="text-xs text-pink-700 mt-1">Tendencias socioculturales</p>
            </div>
            <div className="p-3 bg-cyan-50 border border-cyan-200 rounded">
              <p className="text-sm font-medium text-cyan-900">Tecnológico</p>
              <p className="text-xs text-cyan-700 mt-1">Innovación y tecnología</p>
            </div>
            <div className="p-3 bg-green-50 border border-green-200 rounded">
              <p className="text-sm font-medium text-green-900">Ecológico</p>
              <p className="text-xs text-green-700 mt-1">Impacto ambiental</p>
            </div>
            <div className="p-3 bg-amber-50 border border-amber-200 rounded">
              <p className="text-sm font-medium text-amber-900">Legal</p>
              <p className="text-xs text-amber-700 mt-1">Marco regulatorio</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">5 Fuerzas de Porter</h3>
          <div className="space-y-3">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded">
              <p className="text-sm font-medium text-blue-900">Amenaza Nuevos Competidores</p>
              <p className="text-xs text-blue-700 mt-1">Barreras de entrada</p>
            </div>
            <div className="p-3 bg-orange-50 border border-orange-200 rounded">
              <p className="text-sm font-medium text-orange-900">Poder de Proveedores</p>
              <p className="text-xs text-orange-700 mt-1">Capacidad de negociación</p>
            </div>
            <div className="p-3 bg-purple-50 border border-purple-200 rounded">
              <p className="text-sm font-medium text-purple-900">Poder de Clientes</p>
              <p className="text-xs text-purple-700 mt-1">Influencia en precios</p>
            </div>
            <div className="p-3 bg-red-50 border border-red-200 rounded">
              <p className="text-sm font-medium text-red-900">Amenaza Productos Sustitutos</p>
              <p className="text-xs text-red-700 mt-1">Alternativas disponibles</p>
            </div>
            <div className="p-3 bg-green-50 border border-green-200 rounded">
              <p className="text-sm font-medium text-green-900">Rivalidad Competitiva</p>
              <p className="text-xs text-green-700 mt-1">Intensidad de competencia</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
        <div className="flex items-start gap-4">
          <AlertCircle className="h-6 w-6 text-orange-600 flex-shrink-0 mt-1" />
          <div>
            <h3 className="text-lg font-semibold text-orange-900 mb-2">Próximamente</h3>
            <p className="text-orange-800 text-sm">
              Esta página permitirá realizar análisis completos del contexto organizacional utilizando las metodologías
              DOFA, PESTEL y las 5 Fuerzas de Porter. Los resultados alimentarán automáticamente la identificación de
              riesgos y oportunidades estratégicas.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
