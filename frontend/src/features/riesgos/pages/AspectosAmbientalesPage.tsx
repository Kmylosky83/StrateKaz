import { Leaf, ArrowLeft, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AspectosAmbientalesPage() {
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
          <div className="p-3 bg-green-100 rounded-lg">
            <Leaf className="h-8 w-8 text-green-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Aspectos e Impactos Ambientales</h1>
            <p className="text-gray-600">Identificación y evaluación según ISO 14001:2015</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Aspectos Ambientales</h3>
          <div className="space-y-3">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded">
              <p className="text-sm font-medium text-blue-900">Consumo de Recursos</p>
              <p className="text-xs text-blue-700 mt-1">Agua, energía, materias primas</p>
            </div>
            <div className="p-3 bg-orange-50 border border-orange-200 rounded">
              <p className="text-sm font-medium text-orange-900">Emisiones Atmosféricas</p>
              <p className="text-xs text-orange-700 mt-1">Gases, partículas, vapores</p>
            </div>
            <div className="p-3 bg-purple-50 border border-purple-200 rounded">
              <p className="text-sm font-medium text-purple-900">Vertimientos</p>
              <p className="text-xs text-purple-700 mt-1">Aguas residuales, efluentes</p>
            </div>
            <div className="p-3 bg-red-50 border border-red-200 rounded">
              <p className="text-sm font-medium text-red-900">Residuos Peligrosos</p>
              <p className="text-xs text-red-700 mt-1">RESPEL según Decreto 4741</p>
            </div>
            <div className="p-3 bg-green-50 border border-green-200 rounded">
              <p className="text-sm font-medium text-green-900">Residuos No Peligrosos</p>
              <p className="text-xs text-green-700 mt-1">Ordinarios, reciclables, orgánicos</p>
            </div>
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
              <p className="text-sm font-medium text-yellow-900">Ruido y Vibraciones</p>
              <p className="text-xs text-yellow-700 mt-1">Contaminación acústica</p>
            </div>
            <div className="p-3 bg-indigo-50 border border-indigo-200 rounded">
              <p className="text-sm font-medium text-indigo-900">Uso del Suelo</p>
              <p className="text-xs text-indigo-700 mt-1">Ocupación y modificación</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Evaluación de Significancia</h3>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-900 mb-2">Criterios de Evaluación</p>
              <div className="space-y-2">
                <div className="p-3 bg-gray-50 rounded border border-gray-200">
                  <p className="text-xs font-medium text-gray-900">Magnitud del Impacto</p>
                  <p className="text-xs text-gray-600 mt-1">Escala: 1 (bajo) - 5 (alto)</p>
                </div>
                <div className="p-3 bg-gray-50 rounded border border-gray-200">
                  <p className="text-xs font-medium text-gray-900">Frecuencia</p>
                  <p className="text-xs text-gray-600 mt-1">Periodicidad de ocurrencia</p>
                </div>
                <div className="p-3 bg-gray-50 rounded border border-gray-200">
                  <p className="text-xs font-medium text-gray-900">Requisitos Legales</p>
                  <p className="text-xs text-gray-600 mt-1">Cumplimiento normativo</p>
                </div>
                <div className="p-3 bg-gray-50 rounded border border-gray-200">
                  <p className="text-xs font-medium text-gray-900">Partes Interesadas</p>
                  <p className="text-xs text-gray-600 mt-1">Preocupación de stakeholders</p>
                </div>
                <div className="p-3 bg-gray-50 rounded border border-gray-200">
                  <p className="text-xs font-medium text-gray-900">Reversibilidad</p>
                  <p className="text-xs text-gray-600 mt-1">Capacidad de recuperación</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Tipos de Impacto</h3>
          <div className="space-y-3">
            <div className="p-4 bg-red-50 border-l-4 border-red-500">
              <p className="font-bold text-sm text-red-900">Negativo Alto</p>
              <p className="text-xs text-red-700 mt-1">Contaminación severa, agotamiento de recursos</p>
            </div>
            <div className="p-4 bg-orange-50 border-l-4 border-orange-500">
              <p className="font-bold text-sm text-orange-900">Negativo Moderado</p>
              <p className="text-xs text-orange-700 mt-1">Afectación controlable, reversible</p>
            </div>
            <div className="p-4 bg-yellow-50 border-l-4 border-yellow-500">
              <p className="font-bold text-sm text-yellow-900">Negativo Bajo</p>
              <p className="text-xs text-yellow-700 mt-1">Impacto mínimo, temporal</p>
            </div>
            <div className="p-4 bg-green-50 border-l-4 border-green-500">
              <p className="font-bold text-sm text-green-900">Positivo</p>
              <p className="text-xs text-green-700 mt-1">Mejora ambiental, conservación</p>
            </div>
          </div>

          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <p className="text-xs font-medium text-blue-900 mb-2">Condición Operacional</p>
            <div className="space-y-1 text-xs text-blue-700">
              <p>• Normal</p>
              <p>• Anormal</p>
              <p>• Emergencia</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Normatividad Ambiental Colombiana</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-sm font-semibold text-blue-900 mb-2">Residuos Peligrosos</p>
            <p className="text-xs text-blue-700">Decreto 4741 de 2005</p>
            <p className="text-xs text-blue-700 mt-1">Resolución 1362 de 2007</p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <p className="text-sm font-semibold text-green-900 mb-2">Vertimientos</p>
            <p className="text-xs text-green-700">Resolución 631 de 2015</p>
            <p className="text-xs text-green-700 mt-1">Decreto 1076 de 2015</p>
          </div>
          <div className="p-4 bg-orange-50 rounded-lg">
            <p className="text-sm font-semibold text-orange-900 mb-2">Emisiones</p>
            <p className="text-xs text-orange-700">Resolución 909 de 2008</p>
            <p className="text-xs text-orange-700 mt-1">Resolución 2254 de 2017</p>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg">
            <p className="text-sm font-semibold text-purple-900 mb-2">Ruido</p>
            <p className="text-xs text-purple-700">Resolución 627 de 2006</p>
            <p className="text-xs text-purple-700 mt-1">Límites permisibles</p>
          </div>
        </div>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <div className="flex items-start gap-4">
          <Leaf className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
          <div>
            <h3 className="text-lg font-semibold text-green-900 mb-2">Próximamente</h3>
            <p className="text-green-800 text-sm">
              Esta página permitirá identificar, evaluar y controlar aspectos e impactos ambientales según ISO 14001:2015.
              Incluirá gestión de permisos ambientales, seguimiento de requisitos legales, indicadores de desempeño
              ambiental y planes de manejo ambiental.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
