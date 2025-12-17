/**
 * Modal para ver el detalle completo de una recepción
 * Incluye tabs y acciones (Pesar, Confirmar, Cancelar)
 * Sigue el patrón del Design System
 */
import { useState } from 'react';
import {
  X,
  Package,
  User,
  Calendar,
  Scale,
  TrendingDown,
  FileText,
  Printer,
  AlertCircle,
  CheckCircle,
  XCircle,
  Info,
} from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { cn } from '@/utils/cn';
import {
  formatWeight,
  formatPercentage,
  formatDateTime,
} from '@/utils/formatters';
import type { RecepcionDetallada, EstadoRecepcion } from '../types/recepcion.types';

type TabType = 'general' | 'recolecciones' | 'observaciones';

interface Tab {
  id: TabType;
  label: string;
  icon: React.ElementType;
}

interface RecepcionDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  recepcion: RecepcionDetallada | null;
  onPesar?: () => void;
  onConfirmar?: () => void;
  onCancelar?: () => void;
  canWeigh?: boolean;
  canConfirm?: boolean;
  canCancel?: boolean;
}

const estadoBadgeVariant: Record<
  EstadoRecepcion,
  'primary' | 'success' | 'warning' | 'danger' | 'info' | 'gray'
> = {
  INICIADA: 'info',
  PESADA: 'warning',
  CONFIRMADA: 'success',
  CANCELADA: 'danger',
};

export const RecepcionDetailModal = ({
  isOpen,
  onClose,
  recepcion,
  onPesar,
  onConfirmar,
  onCancelar,
  canWeigh = false,
  canConfirm = false,
  canCancel = false,
}: RecepcionDetailModalProps) => {
  const [activeTab, setActiveTab] = useState<TabType>('general');

  if (!isOpen || !recepcion) return null;

  const tabs: Tab[] = [
    { id: 'general', label: 'General', icon: Info },
    { id: 'recolecciones', label: `Recolecciones (${recepcion.cantidad_recolecciones})`, icon: Package },
    { id: 'observaciones', label: 'Observaciones', icon: FileText },
  ];

  const mermaAlta = recepcion.porcentaje_merma > 5;

  const handlePrint = () => {
    window.print();
  };

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
        <div className="relative w-full max-w-3xl bg-white dark:bg-gray-800 rounded-xl shadow-2xl transform transition-all">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0 pr-4">
                <div className="flex items-center gap-3 mb-2">
                  <span className="px-2 py-0.5 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded text-xs font-mono font-bold">
                    {recepcion.codigo_recepcion}
                  </span>
                  <Badge variant={estadoBadgeVariant[recepcion.estado]} size="sm">
                    {recepcion.estado_display}
                  </Badge>
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  Recepción de Materia Prima
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Recolector: {recepcion.recolector_nombre}
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
                {/* Resumen de pesos */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg p-3">
                    <p className="text-xs text-primary-700 dark:text-primary-400 mb-1">
                      Peso Esperado
                    </p>
                    <p className="text-lg font-bold text-primary-900 dark:text-primary-200">
                      {formatWeight(recepcion.peso_esperado_kg)}
                    </p>
                  </div>

                  <div className="bg-success-50 dark:bg-success-900/20 border border-success-200 dark:border-success-800 rounded-lg p-3">
                    <p className="text-xs text-success-700 dark:text-success-400 mb-1">
                      Peso Real
                    </p>
                    <p className="text-lg font-bold text-success-900 dark:text-success-200">
                      {recepcion.peso_real_kg
                        ? formatWeight(recepcion.peso_real_kg)
                        : 'Pendiente'}
                    </p>
                  </div>

                  <div
                    className={cn(
                      'border rounded-lg p-3',
                      mermaAlta
                        ? 'bg-danger-50 dark:bg-danger-900/20 border-danger-200 dark:border-danger-800'
                        : 'bg-warning-50 dark:bg-warning-900/20 border-warning-200 dark:border-warning-800'
                    )}
                  >
                    <p
                      className={cn(
                        'text-xs mb-1',
                        mermaAlta
                          ? 'text-danger-700 dark:text-danger-400'
                          : 'text-warning-700 dark:text-warning-400'
                      )}
                    >
                      Merma
                    </p>
                    <p
                      className={cn(
                        'text-lg font-bold',
                        mermaAlta
                          ? 'text-danger-900 dark:text-danger-200'
                          : 'text-warning-900 dark:text-warning-200'
                      )}
                    >
                      {recepcion.merma_kg > 0
                        ? `${formatWeight(recepcion.merma_kg)} (${formatPercentage(recepcion.porcentaje_merma)})`
                        : '-'}
                    </p>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-3">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                      Recolecciones
                    </p>
                    <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                      {recepcion.cantidad_recolecciones}
                    </p>
                  </div>
                </div>

                {/* Información del recolector */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
                    Información del Recolector
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {renderField(User, 'Nombre', recepcion.recolector_nombre)}
                    {renderField(FileText, 'Documento', recepcion.recolector_documento)}
                  </div>
                </div>

                {/* Fechas */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
                    Fechas y Registro
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {renderField(Calendar, 'Fecha Recepción', formatDateTime(recepcion.fecha_recepcion))}
                    {recepcion.fecha_pesaje && renderField(Scale, 'Fecha Pesaje', formatDateTime(recepcion.fecha_pesaje))}
                    {recepcion.fecha_confirmacion && renderField(CheckCircle, 'Fecha Confirmación', formatDateTime(recepcion.fecha_confirmacion))}
                    {renderField(User, 'Recibido por', recepcion.recibido_por_nombre)}
                  </div>
                </div>

                {/* Datos de pesaje */}
                {recepcion.estado !== 'INICIADA' && (recepcion.numero_ticket_bascula || recepcion.tanque_destino) && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
                      Datos de Pesaje
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {renderField(FileText, 'Ticket Báscula', recepcion.numero_ticket_bascula)}
                      {renderField(Package, 'Tanque Destino', recepcion.tanque_destino)}
                    </div>
                  </div>
                )}

                {/* Información de cancelación */}
                {recepcion.estado === 'CANCELADA' && (
                  <div className="flex items-start gap-3 p-4 bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800 rounded-lg">
                    <AlertCircle className="h-5 w-5 text-danger-600 dark:text-danger-400 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-medium text-danger-900 dark:text-danger-200 mb-1">
                        Recepción Cancelada
                      </p>
                      {recepcion.motivo_cancelacion && (
                        <p className="text-sm text-danger-800 dark:text-danger-300 mb-2">
                          <strong>Motivo:</strong> {recepcion.motivo_cancelacion}
                        </p>
                      )}
                      {recepcion.cancelado_por_nombre && (
                        <p className="text-sm text-danger-800 dark:text-danger-300">
                          <strong>Cancelado por:</strong> {recepcion.cancelado_por_nombre}
                          {recepcion.fecha_cancelacion &&
                            ` el ${formatDateTime(recepcion.fecha_cancelacion)}`}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tab: Recolecciones */}
            {activeTab === 'recolecciones' && (
              <div className="space-y-4">
                <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Código
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Ecoaliado
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Kg Esperados
                        </th>
                        {recepcion.estado !== 'INICIADA' && (
                          <>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                              Merma
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                              Kg Reales
                            </th>
                          </>
                        )}
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                      {recepcion.detalles.map((detalle) => (
                        <tr key={detalle.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                          <td className="px-4 py-3 text-sm">
                            <Badge variant="info" size="sm">
                              {detalle.recoleccion_codigo}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <div>
                              <p className="font-medium text-gray-900 dark:text-gray-100">
                                {detalle.ecoaliado_nombre}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {detalle.ecoaliado_codigo}
                              </p>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-right font-medium text-gray-900 dark:text-gray-100">
                            {formatWeight(detalle.peso_esperado_kg)}
                          </td>
                          {recepcion.estado !== 'INICIADA' && (
                            <>
                              <td className="px-4 py-3 text-sm text-right font-medium text-warning-700 dark:text-warning-400">
                                {formatWeight(detalle.merma_kg)} ({formatPercentage(detalle.porcentaje_merma)})
                              </td>
                              <td className="px-4 py-3 text-sm text-right font-bold text-success-700 dark:text-success-400">
                                {detalle.peso_real_kg
                                  ? formatWeight(detalle.peso_real_kg)
                                  : formatWeight(detalle.peso_esperado_kg - detalle.merma_kg)}
                              </td>
                            </>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Tab: Observaciones */}
            {activeTab === 'observaciones' && (
              <div className="space-y-4">
                {recepcion.observaciones_recepcion ? (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Observaciones Generales
                    </h4>
                    <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                      <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                        {recepcion.observaciones_recepcion}
                      </p>
                    </div>
                  </div>
                ) : null}

                {recepcion.observaciones_merma ? (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Observaciones de Merma
                    </h4>
                    <div className="bg-warning-50 dark:bg-warning-900/20 p-4 rounded-lg border border-warning-200 dark:border-warning-800">
                      <p className="text-sm text-warning-800 dark:text-warning-300 whitespace-pre-wrap">
                        {recepcion.observaciones_merma}
                      </p>
                    </div>
                  </div>
                ) : null}

                {!recepcion.observaciones_recepcion && !recepcion.observaciones_merma && (
                  <div className="text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <FileText className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                    <p className="text-gray-600 dark:text-gray-400">
                      No hay observaciones registradas
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer con acciones */}
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 rounded-b-xl">
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                {recepcion.estado === 'CONFIRMADA' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrint}
                    leftIcon={<Printer className="h-4 w-4" />}
                  >
                    Imprimir
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                {/* Acciones según estado */}
                {recepcion.puede_pesar && canWeigh && onPesar && (
                  <Button
                    variant="outline"
                    onClick={onPesar}
                    leftIcon={<Scale className="h-4 w-4" />}
                  >
                    Registrar Pesaje
                  </Button>
                )}

                {recepcion.puede_confirmar && canConfirm && onConfirmar && (
                  <Button
                    variant="primary"
                    onClick={onConfirmar}
                    leftIcon={<CheckCircle className="h-4 w-4" />}
                  >
                    Confirmar
                  </Button>
                )}

                {recepcion.puede_cancelar && canCancel && onCancelar && (
                  <Button
                    variant="danger"
                    onClick={onCancelar}
                    leftIcon={<XCircle className="h-4 w-4" />}
                  >
                    Cancelar
                  </Button>
                )}

                <Button variant="outline" onClick={onClose}>
                  Cerrar
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
