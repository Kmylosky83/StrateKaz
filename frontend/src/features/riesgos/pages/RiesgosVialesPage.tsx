import { Car, ArrowLeft, MapPin, AlertTriangle, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function RiesgosVialesPage() {
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
          <div className="p-3 bg-blue-100 rounded-lg">
            <Car className="h-8 w-8 text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Riesgos Viales - PESV</h1>
            <p className="text-gray-600">Plan Estratégico de Seguridad Vial</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <MapPin className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Gestión de Rutas</h3>
          </div>
          <div className="space-y-3">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded">
              <p className="text-sm font-medium text-blue-900">Identificación de Rutas</p>
              <p className="text-xs text-blue-700 mt-1">Registro de rutas operacionales</p>
            </div>
            <div className="p-3 bg-indigo-50 border border-indigo-200 rounded">
              <p className="text-sm font-medium text-indigo-900">Puntos Críticos</p>
              <p className="text-xs text-indigo-700 mt-1">Zonas de alto riesgo vial</p>
            </div>
            <div className="p-3 bg-purple-50 border border-purple-200 rounded">
              <p className="text-sm font-medium text-purple-900">Planificación de Viajes</p>
              <p className="text-xs text-purple-700 mt-1">Tiempos de descanso y paradas</p>
            </div>
            <div className="p-3 bg-cyan-50 border border-cyan-200 rounded">
              <p className="text-sm font-medium text-cyan-900">Condiciones Climáticas</p>
              <p className="text-xs text-cyan-700 mt-1">Alertas meteorológicas</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-orange-100 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-orange-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Factores de Riesgo</h3>
          </div>
          <div className="space-y-3">
            <div className="p-3 bg-red-50 border border-red-200 rounded">
              <p className="text-sm font-medium text-red-900">Factor Humano</p>
              <p className="text-xs text-red-700 mt-1">Fatiga, distracción, velocidad</p>
            </div>
            <div className="p-3 bg-orange-50 border border-orange-200 rounded">
              <p className="text-sm font-medium text-orange-900">Factor Vehículo</p>
              <p className="text-xs text-orange-700 mt-1">Estado mecánico, mantenimiento</p>
            </div>
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
              <p className="text-sm font-medium text-yellow-900">Factor Vía</p>
              <p className="text-xs text-yellow-700 mt-1">Diseño, señalización, pavimento</p>
            </div>
            <div className="p-3 bg-amber-50 border border-amber-200 rounded">
              <p className="text-sm font-medium text-amber-900">Factor Ambiental</p>
              <p className="text-xs text-amber-700 mt-1">Clima, visibilidad, hora del día</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-green-100 rounded-lg">
            <Users className="h-6 w-6 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Pilares del PESV - Resolución 40595 de 2022</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-white font-bold text-xl">1</span>
            </div>
            <p className="text-sm font-semibold text-blue-900">Fortalecimiento de la Gestión</p>
            <p className="text-xs text-blue-700 mt-1">Política, objetivos, liderazgo</p>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-white font-bold text-xl">2</span>
            </div>
            <p className="text-sm font-semibold text-purple-900">Comportamiento Humano</p>
            <p className="text-xs text-purple-700 mt-1">Capacitación, exámenes médicos</p>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <div className="w-12 h-12 bg-orange-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-white font-bold text-xl">3</span>
            </div>
            <p className="text-sm font-semibold text-orange-900">Vehículos Seguros</p>
            <p className="text-xs text-orange-700 mt-1">Mantenimiento, inspecciones</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-white font-bold text-xl">4</span>
            </div>
            <p className="text-sm font-semibold text-green-900">Infraestructura Segura</p>
            <p className="text-xs text-green-700 mt-1">Rutas, estacionamientos</p>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-white font-bold text-xl">5</span>
            </div>
            <p className="text-sm font-semibold text-red-900">Atención a Víctimas</p>
            <p className="text-xs text-red-700 mt-1">Protocolos de emergencia</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Indicadores Clave</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
              <span className="text-xs text-gray-700">Tasa de accidentalidad</span>
              <span className="text-xs font-bold text-red-600">-</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
              <span className="text-xs text-gray-700">Incidentes por millón de km</span>
              <span className="text-xs font-bold text-orange-600">-</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
              <span className="text-xs text-gray-700">Cumplimiento mantenimiento</span>
              <span className="text-xs font-bold text-green-600">-</span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Requisitos Legales</h3>
          <div className="space-y-2 text-xs">
            <p className="text-gray-700">• Resolución 40595 de 2022</p>
            <p className="text-gray-700">• Ley 1503 de 2011</p>
            <p className="text-gray-700">• Ley 2050 de 2020</p>
            <p className="text-gray-700">• Decreto 1079 de 2015</p>
            <p className="text-gray-700">• NTC-ISO 39001</p>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Documentos PESV</h3>
          <div className="space-y-2 text-xs">
            <p className="text-gray-700">• Política de Seguridad Vial</p>
            <p className="text-gray-700">• Plan Estratégico</p>
            <p className="text-gray-700">• Matriz de Identificación</p>
            <p className="text-gray-700">• Planes de Acción</p>
            <p className="text-gray-700">• Informe Anual</p>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start gap-4">
          <Car className="h-6 w-6 text-blue-600 flex-shrink-0 mt-1" />
          <div>
            <h3 className="text-lg font-semibold text-blue-900 mb-2">Próximamente</h3>
            <p className="text-blue-800 text-sm">
              Esta página implementará la gestión completa del Plan Estratégico de Seguridad Vial según la
              Resolución 40595 de 2022. Incluirá gestión de rutas, identificación de puntos críticos, registro
              de incidentes viales, seguimiento de conductores y vehículos, y generación de informes de gestión.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
