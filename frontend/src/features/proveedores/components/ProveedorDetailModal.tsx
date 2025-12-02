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
  CreditCard,
  Info,
  Clock,
  AlertTriangle,
  Building2,
  User,
  Mail,
  Briefcase,
} from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { cn } from '@/utils/cn';
import type { Proveedor } from '@/types/proveedores.types';

type TabType = 'general' | 'precios' | 'financiero' | 'adicional';

interface Tab {
  id: TabType;
  label: string;
  icon: React.ElementType;
  show: boolean;
}

interface ProveedorDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  proveedor: Proveedor | null;
  onEdit: (proveedor: Proveedor) => void;
  onDelete: (proveedor: Proveedor) => void;
  onCambiarPrecio?: (proveedor: Proveedor) => void;
  onVerHistorial?: (proveedor: Proveedor) => void;
  onToggleStatus: (proveedor: Proveedor) => void;
  canChangePrecio: boolean;
  showPrecioColumns?: boolean;
}

export const ProveedorDetailModal = ({
  isOpen,
  onClose,
  proveedor,
  onEdit,
  onDelete,
  onCambiarPrecio,
  onVerHistorial,
  onToggleStatus,
  canChangePrecio,
  showPrecioColumns = true,
}: ProveedorDetailModalProps) => {
  const [activeTab, setActiveTab] = useState<TabType>('general');

  if (!isOpen || !proveedor) return null;

  const tienePrecio = proveedor.precios_materia_prima && proveedor.precios_materia_prima.length > 0;
  const tieneInfoFinanciera =
    (proveedor.formas_pago_display && proveedor.formas_pago_display.length > 0) ||
    proveedor.banco ||
    proveedor.dias_plazo_pago;
  const tieneInfoAdicional = proveedor.observaciones || proveedor.created_by_nombre;

  // Configurar tabs dinámicamente
  const allTabs: Tab[] = [
    { id: 'general', label: 'General', icon: FileText, show: true },
    {
      id: 'precios',
      label: 'Precios',
      icon: DollarSign,
      show: showPrecioColumns && !!proveedor.es_proveedor_materia_prima,
    },
    { id: 'financiero', label: 'Financiero', icon: CreditCard, show: !!tieneInfoFinanciera },
    { id: 'adicional', label: 'Adicional', icon: Info, show: !!tieneInfoAdicional },
  ];
  const tabs = allTabs.filter((tab) => tab.show);

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

  const getTipoProveedorBadge = (tipo: string) => {
    switch (tipo) {
      case 'MATERIA_PRIMA_EXTERNO':
        return <Badge variant="primary">Materia Prima</Badge>;
      case 'UNIDAD_NEGOCIO':
        return <Badge variant="info">Unidad Interna</Badge>;
      case 'PRODUCTO_SERVICIO':
        return <Badge variant="warning">Producto/Servicio</Badge>;
      default:
        return <Badge variant="gray">{tipo}</Badge>;
    }
  };

  const getSubtipoMateriaBadges = (subtipos?: string[] | null) => {
    if (!subtipos || subtipos.length === 0) return null;

    const colors: Record<string, 'success' | 'warning' | 'info'> = {
      SEBO: 'success',
      HUESO: 'warning',
      ACU: 'info',
    };

    return (
      <div className="flex flex-wrap gap-1">
        {subtipos.map((subtipo, idx) => (
          <Badge key={idx} variant={colors[subtipo] || 'gray'} size="sm">
            {subtipo}
          </Badge>
        ))}
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
                  {proveedor.codigo_interno && (
                    <span className="px-2 py-0.5 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded text-xs font-mono font-bold">
                      {proveedor.codigo_interno}
                    </span>
                  )}
                  {getTipoProveedorBadge(proveedor.tipo_proveedor)}
                  <button
                    onClick={() => onToggleStatus(proveedor)}
                    className={cn(
                      'px-2 py-0.5 rounded-full text-xs font-medium transition-colors',
                      proveedor.is_active
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                    )}
                  >
                    {proveedor.is_active ? 'Activo' : 'Inactivo'}
                  </button>
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 truncate">
                  {proveedor.nombre_comercial}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {proveedor.tipo_documento} {proveedor.numero_documento}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Subtipos */}
            {proveedor.subtipo_materia && proveedor.subtipo_materia.length > 0 && (
              <div className="mt-3">{getSubtipoMateriaBadges(proveedor.subtipo_materia)}</div>
            )}
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
                {/* Información de la empresa */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
                    Información de la Empresa
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {renderField(Building2, 'Razón Social', proveedor.razon_social)}
                    {renderField(
                      Briefcase,
                      'Modalidad Logística',
                      proveedor.modalidad_logistica === 'COMPRA_EN_PUNTO'
                        ? 'Compra en Punto'
                        : proveedor.modalidad_logistica === 'ENTREGA_PLANTA'
                          ? 'Entrega en Planta'
                          : null
                    )}
                    {renderField(Building2, 'Unidad Interna', proveedor.unidad_negocio_nombre)}
                    {renderField(FileText, 'NIT', proveedor.nit)}
                  </div>
                </div>

                {/* Ubicación */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
                    Ubicación
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {renderField(MapPin, 'Dirección', proveedor.direccion)}
                    {renderField(
                      MapPin,
                      'Ciudad / Departamento',
                      `${proveedor.ciudad}, ${proveedor.departamento}`
                    )}
                  </div>
                </div>

                {/* Contacto */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
                    Contacto
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {renderField(Phone, 'Teléfono', proveedor.telefono)}
                    {renderField(Mail, 'Email', proveedor.email)}
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Precios */}
            {activeTab === 'precios' && showPrecioColumns && proveedor.es_proveedor_materia_prima && (
              <div className="space-y-4">
                {tienePrecio && proveedor.precios_materia_prima ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {proveedor.precios_materia_prima.map((precio) => (
                        <div
                          key={precio.id}
                          className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {precio.tipo_materia_display}
                              </p>
                              <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                                ${parseFloat(precio.precio_kg).toLocaleString('es-CO')}
                                <span className="text-sm font-normal text-gray-500 ml-1">/kg</span>
                              </p>
                            </div>
                            <DollarSign className="h-8 w-8 text-blue-400 dark:text-blue-600" />
                          </div>
                          {precio.vigente_desde && (
                            <div className="mt-2 flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                              <Clock className="h-3 w-3" />
                              Vigente desde:{' '}
                              {new Date(precio.vigente_desde).toLocaleDateString('es-CO')}
                            </div>
                          )}
                          {precio.modificado_por_nombre && (
                            <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                              Modificado por: {precio.modificado_por_nombre}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-2 pt-2">
                      {onVerHistorial && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const p = proveedor;
                            onClose();
                            setTimeout(() => onVerHistorial(p), 150);
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
                            const p = proveedor;
                            onClose();
                            setTimeout(() => onCambiarPrecio(p), 150);
                          }}
                        >
                          <DollarSign className="h-4 w-4 mr-2" />
                          Cambiar Precio
                        </Button>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                      <AlertTriangle className="h-8 w-8 text-amber-600 dark:text-amber-400" />
                    </div>
                    <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                      Sin precios asignados
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                      Este proveedor no tiene precios configurados
                    </p>
                    {canChangePrecio && onCambiarPrecio && (
                      <Button
                        variant="primary"
                        onClick={() => {
                          const p = proveedor;
                          onClose();
                          setTimeout(() => onCambiarPrecio(p), 150);
                        }}
                      >
                        <DollarSign className="h-4 w-4 mr-2" />
                        Asignar Precio
                      </Button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Tab: Financiero */}
            {activeTab === 'financiero' && tieneInfoFinanciera && (
              <div className="space-y-6">
                {/* Formas de pago */}
                {proveedor.formas_pago_display && proveedor.formas_pago_display.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      Formas de Pago
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {proveedor.formas_pago_display.map((fp, idx) => (
                        <Badge key={idx} variant="info">
                          {fp}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Plazo */}
                {proveedor.dias_plazo_pago && (
                  <div>
                    {renderField(
                      Clock,
                      'Días de Plazo para Pago',
                      `${proveedor.dias_plazo_pago} días`
                    )}
                  </div>
                )}

                {/* Datos bancarios */}
                {proveedor.banco && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
                      Datos Bancarios
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {renderField(Building2, 'Banco', proveedor.banco)}
                      {renderField(CreditCard, 'Tipo de Cuenta', proveedor.tipo_cuenta)}
                      {renderField(CreditCard, 'Número de Cuenta', proveedor.numero_cuenta)}
                      {renderField(User, 'Titular', proveedor.titular_cuenta)}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tab: Adicional */}
            {activeTab === 'adicional' && tieneInfoAdicional && (
              <div className="space-y-6">
                {proveedor.observaciones && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      Observaciones
                    </h4>
                    <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                      <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                        {proveedor.observaciones}
                      </p>
                    </div>
                  </div>
                )}

                {proveedor.created_by_nombre && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      Registro
                    </h4>
                    <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                      <p>
                        <span className="font-medium">Creado por:</span>{' '}
                        {proveedor.created_by_nombre}
                      </p>
                      {proveedor.created_at && (
                        <p>
                          <span className="font-medium">Fecha:</span>{' '}
                          {new Date(proveedor.created_at).toLocaleDateString('es-CO', {
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
              </div>
            )}
          </div>

          {/* Footer con acciones */}
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 rounded-b-xl">
            <div className="flex items-center justify-between">
              <Button variant="outline" onClick={onClose}>
                Cerrar
              </Button>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    // Guardar referencia antes de cerrar
                    const proveedorToEdit = proveedor;
                    onClose();
                    // Delay para que el modal cierre completamente antes de abrir otro
                    setTimeout(() => {
                      onEdit(proveedorToEdit);
                    }, 150);
                  }}
                >
                  <Edit2 className="h-4 w-4 mr-2" />
                  Editar
                </Button>
                <Button
                  variant="danger"
                  onClick={() => {
                    const proveedorToDelete = proveedor;
                    onClose();
                    setTimeout(() => {
                      onDelete(proveedorToDelete);
                    }, 150);
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Eliminar
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
