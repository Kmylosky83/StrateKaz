import { useState } from 'react';
import {
  X,
  Edit2,
  Trash2,
  DollarSign,
  History,
  FileText,
  Phone,
  MapPin,
  Info,
  Clock,
  Building2,
  User,
  Mail,
  Navigation,
  Award,
} from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { cn } from '@/utils/cn';
import type { Ecoaliado } from '@/types/proveedores.types';
import { CertificadoModal } from '@/features/recolecciones/components/CertificadoModal';

type TabType = 'general' | 'ubicacion' | 'comercial' | 'adicional';

interface Tab {
  id: TabType;
  label: string;
  icon: React.ElementType;
}

interface EcoaliadoDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  ecoaliado: Ecoaliado | null;
  onEdit: (ecoaliado: Ecoaliado) => void;
  onDelete: (ecoaliado: Ecoaliado) => void;
  onCambiarPrecio?: (ecoaliado: Ecoaliado) => void;
  onVerHistorial?: (ecoaliado: Ecoaliado) => void;
  onToggleStatus: (ecoaliado: Ecoaliado) => void;
  canChangePrecio: boolean;
  canManage: boolean;
}

export const EcoaliadoDetailModal = ({
  isOpen,
  onClose,
  ecoaliado,
  onEdit,
  onDelete,
  onCambiarPrecio,
  onVerHistorial,
  onToggleStatus,
  canChangePrecio,
  canManage,
}: EcoaliadoDetailModalProps) => {
  const [activeTab, setActiveTab] = useState<TabType>('general');
  const [isCertificadoModalOpen, setIsCertificadoModalOpen] = useState(false);

  if (!isOpen || !ecoaliado) return null;

  const tabs: Tab[] = [
    { id: 'general', label: 'General', icon: FileText },
    { id: 'ubicacion', label: 'Ubicación', icon: MapPin },
    { id: 'comercial', label: 'Comercial', icon: DollarSign },
    { id: 'adicional', label: 'Adicional', icon: Info },
  ];

  // Helper para renderizar campos
  const renderField = (
    icon: React.ElementType,
    label: string,
    value: React.ReactNode,
    className?: string
  ) => {
    if (!value) return null;
    const Icon = icon;

    return (
      <div className={cn('flex items-start gap-3', className)}>
        <div className="flex-shrink-0 w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
          <Icon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 break-words">
            {value}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 transition-opacity" onClick={onClose} />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-2xl bg-white dark:bg-gray-800 rounded-xl shadow-2xl transform transition-all">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0 pr-4">
                <div className="flex items-center gap-3 mb-2">
                  <span className="px-2 py-0.5 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded text-xs font-mono font-bold">
                    {ecoaliado.codigo}
                  </span>
                  <button
                    onClick={() => onToggleStatus(ecoaliado)}
                    className={cn(
                      'px-2 py-0.5 rounded-full text-xs font-medium transition-colors',
                      ecoaliado.is_active
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                    )}
                  >
                    {ecoaliado.is_active ? 'Activo' : 'Inactivo'}
                  </button>
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 truncate">
                  {ecoaliado.razon_social}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {ecoaliado.documento_tipo_display} {ecoaliado.documento_numero}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="px-6 border-b border-gray-200 dark:border-gray-700">
            <nav className="flex gap-1 -mb-px" aria-label="Tabs">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors',
                      activeTab === tab.id
                        ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Content */}
          <div className="px-6 py-5 max-h-[60vh] overflow-y-auto">
            {/* Tab: General */}
            {activeTab === 'general' && (
              <div className="space-y-6">
                {/* Información básica */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
                    Información Básica
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {renderField(FileText, 'Código', ecoaliado.codigo)}
                    {renderField(Building2, 'Razón Social', ecoaliado.razon_social)}
                    {renderField(
                      FileText,
                      'Documento',
                      `${ecoaliado.documento_tipo_display} ${ecoaliado.documento_numero}`
                    )}
                    {renderField(Building2, 'Unidad de Negocio', ecoaliado.unidad_negocio_nombre)}
                  </div>
                </div>

                {/* Contacto */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
                    Contacto
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {renderField(Phone, 'Teléfono', ecoaliado.telefono)}
                    {renderField(Mail, 'Email', ecoaliado.email)}
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Ubicación */}
            {activeTab === 'ubicacion' && (
              <div className="space-y-6">
                {/* Dirección */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
                    Dirección
                  </h4>
                  <div className="grid grid-cols-1 gap-4">
                    {renderField(MapPin, 'Dirección', ecoaliado.direccion)}
                    {renderField(
                      MapPin,
                      'Ciudad / Departamento',
                      `${ecoaliado.ciudad}, ${ecoaliado.departamento}`
                    )}
                  </div>
                </div>

                {/* Geolocalización */}
                {ecoaliado.tiene_geolocalizacion && ecoaliado.latitud && ecoaliado.longitud && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
                      Coordenadas GPS
                    </h4>
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                          <Navigation className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                            Ubicación Georreferenciada
                          </p>
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                              <p className="text-xs text-gray-500 dark:text-gray-400">Latitud</p>
                              <p className="font-mono font-medium text-blue-900 dark:text-blue-100">
                                {ecoaliado.latitud.toFixed(6)}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 dark:text-gray-400">Longitud</p>
                              <p className="font-mono font-medium text-blue-900 dark:text-blue-100">
                                {ecoaliado.longitud.toFixed(6)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tab: Comercial */}
            {activeTab === 'comercial' && (
              <div className="space-y-6">
                {/* Precio de compra */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
                    Precio de Compra
                  </h4>
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Precio por Kilogramo
                        </p>
                        <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                          ${parseFloat(ecoaliado.precio_compra_kg).toLocaleString('es-CO')}
                          <span className="text-sm font-normal text-gray-500 ml-1">/kg</span>
                        </p>
                      </div>
                      <DollarSign className="h-8 w-8 text-blue-400 dark:text-blue-600" />
                    </div>
                  </div>

                  {/* Acciones de precio */}
                  <div className="flex flex-wrap gap-2 pt-3">
                    {onVerHistorial && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const e = ecoaliado;
                          onClose();
                          setTimeout(() => onVerHistorial(e), 150);
                        }}
                      >
                        <History className="h-4 w-4 mr-2" />
                        Ver Historial
                      </Button>
                    )}
                    {canChangePrecio && onCambiarPrecio && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => {
                          const e = ecoaliado;
                          onClose();
                          setTimeout(() => onCambiarPrecio(e), 150);
                        }}
                      >
                        <DollarSign className="h-4 w-4 mr-2" />
                        Cambiar Precio
                      </Button>
                    )}
                  </div>
                </div>

                {/* Certificado de Recoleccion */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
                    Certificado de Recoleccion
                  </h4>
                  <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                        <Award className="h-5 w-5 text-green-600 dark:text-green-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                          Generar Certificado
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                          Genera un certificado formal de las recolecciones realizadas por este ecoaliado
                          en un periodo determinado (mensual, trimestral, semestral, anual).
                        </p>
                        <Button
                          variant="success"
                          size="sm"
                          onClick={() => setIsCertificadoModalOpen(true)}
                        >
                          <Award className="h-4 w-4 mr-2" />
                          Generar Certificado
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Información comercial */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
                    Información Comercial
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {renderField(Building2, 'Unidad de Negocio', ecoaliado.unidad_negocio_nombre)}
                    {renderField(User, 'Comercial Asignado', ecoaliado.comercial_asignado_nombre)}
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Adicional */}
            {activeTab === 'adicional' && (
              <div className="space-y-6">
                {/* Observaciones */}
                {ecoaliado.observaciones && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      Observaciones
                    </h4>
                    <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                      <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                        {ecoaliado.observaciones}
                      </p>
                    </div>
                  </div>
                )}

                {/* Información de registro */}
                {ecoaliado.created_by_nombre && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      Información de Registro
                    </h4>
                    <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                      <p>
                        <span className="font-medium">Creado por:</span>{' '}
                        {ecoaliado.created_by_nombre}
                      </p>
                      {ecoaliado.created_at && (
                        <p>
                          <span className="font-medium">Fecha de creación:</span>{' '}
                          {new Date(ecoaliado.created_at).toLocaleDateString('es-CO', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      )}
                      {ecoaliado.updated_at && ecoaliado.updated_at !== ecoaliado.created_at && (
                        <p>
                          <span className="font-medium">Última actualización:</span>{' '}
                          {new Date(ecoaliado.updated_at).toLocaleDateString('es-CO', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Fechas del sistema (si no hay created_by) */}
                {!ecoaliado.created_by_nombre && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      Fechas
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {ecoaliado.created_at &&
                        renderField(
                          Clock,
                          'Fecha de Creación',
                          new Date(ecoaliado.created_at).toLocaleDateString('es-CO', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })
                        )}
                      {ecoaliado.updated_at &&
                        renderField(
                          Clock,
                          'Última Actualización',
                          new Date(ecoaliado.updated_at).toLocaleDateString('es-CO', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })
                        )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer con acciones */}
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 rounded-b-xl">
            <div className="flex items-center justify-between">
              <Button variant="outline" onClick={onClose}>
                Cerrar
              </Button>
              {canManage && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      const ecoaliadoToEdit = ecoaliado;
                      onClose();
                      setTimeout(() => {
                        onEdit(ecoaliadoToEdit);
                      }, 150);
                    }}
                  >
                    <Edit2 className="h-4 w-4 mr-2" />
                    Editar
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => {
                      const ecoaliadoToDelete = ecoaliado;
                      onClose();
                      setTimeout(() => {
                        onDelete(ecoaliadoToDelete);
                      }, 150);
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Eliminar
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Certificado */}
      <CertificadoModal
        isOpen={isCertificadoModalOpen}
        onClose={() => setIsCertificadoModalOpen(false)}
        ecoaliadoId={ecoaliado.id}
        ecoaliadoNombre={ecoaliado.razon_social}
      />
    </div>
  );
};
