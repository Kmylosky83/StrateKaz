import { Lock, ArrowLeft, Shield, Database, AlertTriangle, Key } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function SeguridadInformacionPage() {
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
          <div className="p-3 bg-red-100 rounded-lg">
            <Lock className="h-8 w-8 text-red-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Seguridad de la Información</h1>
            <p className="text-gray-600">Sistema de Gestión según ISO 27001:2022</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-red-100 rounded-lg">
              <Shield className="h-6 w-6 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Triada CIA</h3>
          </div>
          <div className="space-y-3">
            <div className="p-4 bg-blue-50 border-l-4 border-blue-500">
              <p className="text-sm font-semibold text-blue-900 mb-1">Confidencialidad</p>
              <p className="text-xs text-blue-700">
                Garantizar que la información solo sea accesible a personas autorizadas
              </p>
            </div>
            <div className="p-4 bg-green-50 border-l-4 border-green-500">
              <p className="text-sm font-semibold text-green-900 mb-1">Integridad</p>
              <p className="text-xs text-green-700">
                Asegurar que la información sea exacta y completa
              </p>
            </div>
            <div className="p-4 bg-purple-50 border-l-4 border-purple-500">
              <p className="text-sm font-semibold text-purple-900 mb-1">Disponibilidad</p>
              <p className="text-xs text-purple-700">
                Garantizar acceso a la información cuando se necesite
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Database className="h-6 w-6 text-orange-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Activos de Información</h3>
          </div>
          <div className="space-y-3">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded">
              <p className="text-sm font-medium text-blue-900">Información</p>
              <p className="text-xs text-blue-700 mt-1">Bases de datos, documentos, registros</p>
            </div>
            <div className="p-3 bg-purple-50 border border-purple-200 rounded">
              <p className="text-sm font-medium text-purple-900">Software</p>
              <p className="text-xs text-purple-700 mt-1">Aplicaciones, sistemas operativos</p>
            </div>
            <div className="p-3 bg-orange-50 border border-orange-200 rounded">
              <p className="text-sm font-medium text-orange-900">Hardware</p>
              <p className="text-xs text-orange-700 mt-1">Servidores, equipos, dispositivos</p>
            </div>
            <div className="p-3 bg-green-50 border border-green-200 rounded">
              <p className="text-sm font-medium text-green-900">Personas</p>
              <p className="text-xs text-green-700 mt-1">Conocimiento, habilidades</p>
            </div>
            <div className="p-3 bg-red-50 border border-red-200 rounded">
              <p className="text-sm font-medium text-red-900">Servicios</p>
              <p className="text-xs text-red-700 mt-1">Comunicaciones, utilidades</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-purple-100 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Amenazas Comunes</h3>
          </div>
          <div className="space-y-3">
            <div className="p-3 bg-red-50 border border-red-200 rounded">
              <p className="text-sm font-medium text-red-900">Ciberataques</p>
              <p className="text-xs text-red-700 mt-1">Malware, ransomware, phishing</p>
            </div>
            <div className="p-3 bg-orange-50 border border-orange-200 rounded">
              <p className="text-sm font-medium text-orange-900">Accesos No Autorizados</p>
              <p className="text-xs text-orange-700 mt-1">Intrusión, robo de credenciales</p>
            </div>
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
              <p className="text-sm font-medium text-yellow-900">Errores Humanos</p>
              <p className="text-xs text-yellow-700 mt-1">Divulgación, eliminación accidental</p>
            </div>
            <div className="p-3 bg-purple-50 border border-purple-200 rounded">
              <p className="text-sm font-medium text-purple-900">Fallas Técnicas</p>
              <p className="text-xs text-purple-700 mt-1">Hardware, software, red</p>
            </div>
            <div className="p-3 bg-blue-50 border border-blue-200 rounded">
              <p className="text-sm font-medium text-blue-900">Desastres</p>
              <p className="text-xs text-blue-700 mt-1">Incendio, inundación, terremoto</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-indigo-100 rounded-lg">
            <Key className="h-6 w-6 text-indigo-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Controles ISO 27001:2022 - Anexo A</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-sm font-semibold text-blue-900 mb-2">Organizacionales (37)</p>
            <p className="text-xs text-blue-700">Políticas, roles, gestión de activos, RRHH</p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <p className="text-sm font-semibold text-green-900 mb-2">Personas (8)</p>
            <p className="text-xs text-green-700">Selección, concientización, disciplina</p>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg">
            <p className="text-sm font-semibold text-purple-900 mb-2">Físicos (14)</p>
            <p className="text-xs text-purple-700">Perímetros, acceso, protección equipos</p>
          </div>
          <div className="p-4 bg-orange-50 rounded-lg">
            <p className="text-sm font-semibold text-orange-900 mb-2">Tecnológicos (34)</p>
            <p className="text-xs text-orange-700">Acceso, criptografía, desarrollo seguro</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Evaluación de Riesgos</h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-blue-50 rounded">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-sm">1</span>
              </div>
              <div>
                <p className="text-sm font-medium text-blue-900">Identificación de Activos</p>
                <p className="text-xs text-blue-700 mt-1">Inventario completo de activos de información</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-purple-50 rounded">
              <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-sm">2</span>
              </div>
              <div>
                <p className="text-sm font-medium text-purple-900">Valoración de Activos</p>
                <p className="text-xs text-purple-700 mt-1">Clasificación por confidencialidad, integridad, disponibilidad</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-orange-50 rounded">
              <div className="w-8 h-8 bg-orange-600 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-sm">3</span>
              </div>
              <div>
                <p className="text-sm font-medium text-orange-900">Identificación Amenazas</p>
                <p className="text-xs text-orange-700 mt-1">Amenazas y vulnerabilidades potenciales</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-green-50 rounded">
              <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-sm">4</span>
              </div>
              <div>
                <p className="text-sm font-medium text-green-900">Análisis de Riesgos</p>
                <p className="text-xs text-green-700 mt-1">Probabilidad e impacto, nivel de riesgo</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-red-50 rounded">
              <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-sm">5</span>
              </div>
              <div>
                <p className="text-sm font-medium text-red-900">Tratamiento de Riesgos</p>
                <p className="text-xs text-red-700 mt-1">Mitigar, aceptar, transferir, evitar</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Normatividad Relacionada</h3>
          <div className="space-y-3">
            <div className="p-3 bg-gray-50 border border-gray-200 rounded">
              <p className="text-sm font-medium text-gray-900">ISO 27001:2022</p>
              <p className="text-xs text-gray-600 mt-1">Sistema de Gestión de Seguridad de la Información</p>
            </div>
            <div className="p-3 bg-gray-50 border border-gray-200 rounded">
              <p className="text-sm font-medium text-gray-900">Ley 1581 de 2012</p>
              <p className="text-xs text-gray-600 mt-1">Protección de Datos Personales</p>
            </div>
            <div className="p-3 bg-gray-50 border border-gray-200 rounded">
              <p className="text-sm font-medium text-gray-900">Decreto 1377 de 2013</p>
              <p className="text-xs text-gray-600 mt-1">Reglamentación Ley 1581</p>
            </div>
            <div className="p-3 bg-gray-50 border border-gray-200 rounded">
              <p className="text-sm font-medium text-gray-900">Ley 1273 de 2009</p>
              <p className="text-xs text-gray-600 mt-1">Delitos informáticos</p>
            </div>
            <div className="p-3 bg-gray-50 border border-gray-200 rounded">
              <p className="text-sm font-medium text-gray-900">ISO 27002:2022</p>
              <p className="text-xs text-gray-600 mt-1">Código de buenas prácticas</p>
            </div>
            <div className="p-3 bg-gray-50 border border-gray-200 rounded">
              <p className="text-sm font-medium text-gray-900">ISO 27005:2022</p>
              <p className="text-xs text-gray-600 mt-1">Gestión de riesgos de seguridad</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-start gap-4">
          <Lock className="h-6 w-6 text-red-600 flex-shrink-0 mt-1" />
          <div>
            <h3 className="text-lg font-semibold text-red-900 mb-2">Próximamente</h3>
            <p className="text-red-800 text-sm">
              Esta página implementará el Sistema de Gestión de Seguridad de la Información según ISO 27001:2022.
              Incluirá inventario de activos de información, evaluación de riesgos, declaración de aplicabilidad (SoA),
              gestión de incidentes de seguridad, registros de acceso, y cumplimiento de controles del Anexo A.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
