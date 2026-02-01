import { Shield, ArrowLeft, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function IPEVRPage() {
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
            <Shield className="h-8 w-8 text-orange-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">IPEVR - Matriz GTC-45</h1>
            <p className="text-gray-600">Identificación de Peligros, Evaluación y Valoración de Riesgos</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Clasificación de Peligros</h3>
          <div className="space-y-3">
            <div className="p-3 bg-red-50 border border-red-200 rounded">
              <p className="text-sm font-medium text-red-900">Biológicos</p>
              <p className="text-xs text-red-700 mt-1">Virus, bacterias, hongos</p>
            </div>
            <div className="p-3 bg-orange-50 border border-orange-200 rounded">
              <p className="text-sm font-medium text-orange-900">Físicos</p>
              <p className="text-xs text-orange-700 mt-1">Ruido, temperatura, radiación</p>
            </div>
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
              <p className="text-sm font-medium text-yellow-900">Químicos</p>
              <p className="text-xs text-yellow-700 mt-1">Gases, vapores, líquidos</p>
            </div>
            <div className="p-3 bg-purple-50 border border-purple-200 rounded">
              <p className="text-sm font-medium text-purple-900">Biomecánicos</p>
              <p className="text-xs text-purple-700 mt-1">Postura, movimiento repetitivo</p>
            </div>
            <div className="p-3 bg-blue-50 border border-blue-200 rounded">
              <p className="text-sm font-medium text-blue-900">Psicosociales</p>
              <p className="text-xs text-blue-700 mt-1">Estrés, carga mental</p>
            </div>
            <div className="p-3 bg-indigo-50 border border-indigo-200 rounded">
              <p className="text-sm font-medium text-indigo-900">Condiciones de Seguridad</p>
              <p className="text-xs text-indigo-700 mt-1">Mecánicos, eléctricos, locativos</p>
            </div>
            <div className="p-3 bg-pink-50 border border-pink-200 rounded">
              <p className="text-sm font-medium text-pink-900">Fenómenos Naturales</p>
              <p className="text-xs text-pink-700 mt-1">Sismo, inundación, vendaval</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Valoración del Riesgo</h3>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-900 mb-2">Nivel de Deficiencia (ND)</p>
              <div className="space-y-2">
                <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span className="text-xs">Muy alto</span>
                  <span className="text-xs font-bold">10</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span className="text-xs">Alto</span>
                  <span className="text-xs font-bold">6</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span className="text-xs">Medio</span>
                  <span className="text-xs font-bold">2</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span className="text-xs">Bajo</span>
                  <span className="text-xs font-bold">0</span>
                </div>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-900 mb-2">Nivel de Exposición (NE)</p>
              <div className="space-y-2">
                <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span className="text-xs">Continua</span>
                  <span className="text-xs font-bold">4</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span className="text-xs">Frecuente</span>
                  <span className="text-xs font-bold">3</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span className="text-xs">Ocasional</span>
                  <span className="text-xs font-bold">2</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span className="text-xs">Esporádica</span>
                  <span className="text-xs font-bold">1</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Niveles de Riesgo</h3>
          <div className="space-y-3">
            <div className="p-4 bg-red-600 text-white rounded-lg">
              <p className="font-bold text-sm">I - Riesgo No Aceptable</p>
              <p className="text-xs mt-1">4000 - 2400</p>
              <p className="text-xs mt-2">Suspender actividades. Intervención urgente.</p>
            </div>
            <div className="p-4 bg-orange-500 text-white rounded-lg">
              <p className="font-bold text-sm">II - Riesgo Alto</p>
              <p className="text-xs mt-1">1900 - 600</p>
              <p className="text-xs mt-2">Intervención prioritaria. Corregir y adoptar medidas.</p>
            </div>
            <div className="p-4 bg-yellow-500 text-white rounded-lg">
              <p className="font-bold text-sm">III - Riesgo Medio</p>
              <p className="text-xs mt-1">500 - 150</p>
              <p className="text-xs mt-2">Mejorar si es posible. Planificar intervención.</p>
            </div>
            <div className="p-4 bg-green-600 text-white rounded-lg">
              <p className="font-bold text-sm">IV - Riesgo Bajo</p>
              <p className="text-xs mt-1">140 - 0</p>
              <p className="text-xs mt-2">Mantener controles existentes. Monitorear.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Fórmula de Cálculo GTC-45</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-6 bg-blue-50 rounded-lg">
            <p className="text-sm font-medium text-blue-900 mb-2">Nivel de Probabilidad</p>
            <p className="text-2xl font-bold text-blue-600 mb-2">NP = ND × NE</p>
            <p className="text-xs text-blue-700">Deficiencia × Exposición</p>
          </div>
          <div className="text-center p-6 bg-purple-50 rounded-lg">
            <p className="text-sm font-medium text-purple-900 mb-2">Nivel de Riesgo</p>
            <p className="text-2xl font-bold text-purple-600 mb-2">NR = NP × NC</p>
            <p className="text-xs text-purple-700">Probabilidad × Consecuencia</p>
          </div>
          <div className="text-center p-6 bg-orange-50 rounded-lg">
            <p className="text-sm font-medium text-orange-900 mb-2">Nivel de Intervención</p>
            <p className="text-2xl font-bold text-orange-600 mb-2">NI = NR</p>
            <p className="text-xs text-orange-700">Define prioridad de acción</p>
          </div>
        </div>
      </div>

      <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
        <div className="flex items-start gap-4">
          <AlertTriangle className="h-6 w-6 text-orange-600 flex-shrink-0 mt-1" />
          <div>
            <h3 className="text-lg font-semibold text-orange-900 mb-2">Próximamente</h3>
            <p className="text-orange-800 text-sm">
              Esta página implementará la matriz completa de identificación de peligros y evaluación de riesgos
              según la GTC-45. Incluirá evaluación por procesos, cargos, actividades rutinarias y no rutinarias,
              generación automática de planes de acción y seguimiento de controles.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
