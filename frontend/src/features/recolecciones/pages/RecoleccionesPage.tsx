/**
 * Pagina Principal del Modulo Recolecciones
 *
 * Vista optimizada para RECOLECTORES:
 * - Cards de programaciones EN_RUTA como elemento principal
 * - Cada card permite registrar la recolección directamente
 * - Estadísticas arriba para contexto rápido
 * - Historial de recolecciones colapsable (secundario)
 *
 * Flujo del recolector:
 * 1. Ve sus programaciones asignadas (cards EN_RUTA)
 * 2. Click en card → Abre modal para registrar kg
 * 3. Sistema calcula valor y genera voucher
 */
import { useState, useEffect, useRef } from 'react';
import {
  Receipt,
  Scale,
  DollarSign,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  MapPin,
  Building2,
  Clock,
  CheckCircle2,
  Truck,
  Search,
  Printer,
} from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/forms/Input';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { formatCurrency } from '@/utils/formatters';
import { formatFechaLocal } from '@/utils/dateUtils';
import {
  PageHeader,
  StatsGrid,
} from '@/components/layout';
import { useAuthStore } from '@/store/authStore';
import { CargoCodes } from '@/constants/permissions';
import { RegistrarRecoleccionModal } from '../components/RegistrarRecoleccionModal';
import { VoucherModal } from '../components/VoucherModal';
import {
  useRecolecciones,
  useEstadisticasRecolecciones,
  useProgramacionesEnRuta,
  useRegistrarRecoleccion,
} from '../api/useRecolecciones';
import type {
  Recoleccion,
  RecoleccionFilters,
  ProgramacionEnRuta,
  RegistrarRecoleccionDTO,
} from '../types/recoleccion.types';

interface RecoleccionesPageProps {
  /** Modo embebido: oculta el PageHeader y controles cuando se usa dentro de otro componente */
  embedded?: boolean;
  /** Trigger externo para abrir el modal de registrar recolección */
  triggerNewForm?: number;
}

export const RecoleccionesPage = ({ embedded = false, triggerNewForm = 0 }: RecoleccionesPageProps) => {
  // Usuario autenticado
  const user = useAuthStore((state) => state.user);
  const lastTriggerRef = useRef(0); // Para evitar abrir modal al cambiar de tab

  // Estado de filtros para historial
  const [filters, setFilters] = useState<RecoleccionFilters>({
    search: '',
    fecha_desde: '',
    fecha_hasta: '',
    page: 1,
    page_size: 10,
  });

  // Estado para mostrar/ocultar historial
  const [showHistorial, setShowHistorial] = useState(false);

  // Modales
  const [isRegistrarOpen, setIsRegistrarOpen] = useState(false);
  const [isVoucherOpen, setIsVoucherOpen] = useState(false);
  const [selectedProgramacion, setSelectedProgramacion] = useState<ProgramacionEnRuta | null>(null);
  const [selectedRecoleccionId, setSelectedRecoleccionId] = useState<number | null>(null);

  // Queries
  const { data: recoleccionesData, isLoading: isLoadingRecolecciones } = useRecolecciones(filters);
  const { data: estadisticasData } = useEstadisticasRecolecciones(
    filters.fecha_desde || undefined,
    filters.fecha_hasta || undefined
  );
  const { data: programacionesEnRuta, isLoading: isLoadingProgramaciones } = useProgramacionesEnRuta();

  // Mutations
  const registrarMutation = useRegistrarRecoleccion();

  // Permisos
  const canRegistrar = [
    CargoCodes.RECOLECTOR_ECONORTE,
    CargoCodes.LIDER_LOGISTICA_ECONORTE,
    'gerente',
    'superadmin',
    CargoCodes.COORDINADOR_RECOLECCION,
  ].includes(user?.cargo_code || '');

  const esRecolector = user?.cargo_code === CargoCodes.RECOLECTOR_ECONORTE;

  // Handlers - Registrar Recolección
  const handleOpenRegistrar = (programacion: ProgramacionEnRuta) => {
    setSelectedProgramacion(programacion);
    setIsRegistrarOpen(true);
  };

  const handleCloseRegistrar = () => {
    setIsRegistrarOpen(false);
    setSelectedProgramacion(null);
  };

  const handleSubmitRegistrar = async (data: RegistrarRecoleccionDTO) => {
    try {
      const response = await registrarMutation.mutateAsync(data);
      handleCloseRegistrar();
      // Abrir el voucher modal para que el usuario pueda imprimirlo
      setTimeout(() => {
        setSelectedRecoleccionId(response.recoleccion.id);
        setIsVoucherOpen(true);
      }, 300);
    } catch (error) {
      console.error('Error al registrar recoleccion:', error);
    }
  };

  // Handlers - Ver Voucher
  const handleVerVoucher = (recoleccion: Recoleccion) => {
    setSelectedRecoleccionId(recoleccion.id);
    setIsVoucherOpen(true);
  };

  const handleCloseVoucher = () => {
    setIsVoucherOpen(false);
    setSelectedRecoleccionId(null);
  };

  // Efecto para abrir modal desde trigger externo (EcoNortePage)
  // Solo abre cuando el trigger realmente cambia, no al montar el componente
  useEffect(() => {
    if (triggerNewForm > 0 && triggerNewForm !== lastTriggerRef.current && canRegistrar && programacionesEnRuta?.results?.length) {
      lastTriggerRef.current = triggerNewForm;
      setSelectedProgramacion(programacionesEnRuta.results[0]);
      setIsRegistrarOpen(true);
    }
  }, [triggerNewForm, canRegistrar, programacionesEnRuta?.results]);

  // Datos
  const recolecciones = recoleccionesData?.results || [];
  const programaciones = programacionesEnRuta?.results || [];
  const tieneProgramaciones = programaciones.length > 0;

  return (
    <div className="space-y-6">
      {/* HEADER */}
      {!embedded && (
        <PageHeader
          title="Recolecciones"
          description={
            esRecolector
              ? 'Registra las recolecciones de tus programaciones asignadas'
              : 'Registro y seguimiento de recolecciones de material'
          }
        />
      )}

      {/* ESTADÍSTICAS - Siempre arriba para contexto */}
      {estadisticasData && (
        <StatsGrid
          stats={[
            {
              label: 'Recolecciones Hoy',
              value: estadisticasData.recolecciones_hoy.toLocaleString('es-CO'),
              icon: Receipt,
              iconColor: 'primary',
              description: `Total: ${estadisticasData.total_recolecciones}`,
            },
            {
              label: 'Kg Recolectados',
              value: `${estadisticasData.total_kg_recolectados.toLocaleString('es-CO')}`,
              icon: Scale,
              iconColor: 'info',
              description: `Prom: ${estadisticasData.promedio_kg_por_recoleccion.toLocaleString('es-CO')} kg`,
            },
            {
              label: 'Valor Pagado',
              value: formatCurrency(estadisticasData.total_valor_pagado),
              icon: DollarSign,
              iconColor: 'success',
            },
            {
              label: 'Esta Semana',
              value: estadisticasData.recolecciones_semana.toLocaleString('es-CO'),
              icon: TrendingUp,
              iconColor: 'warning',
              description: `Este mes: ${estadisticasData.recolecciones_mes}`,
            },
          ]}
        />
      )}

      {/* PROGRAMACIONES EN RUTA - Elemento principal */}
      {canRegistrar && (
        <Card>
          <div className="p-5">
            {/* Header de sección */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
                  <Truck className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Programaciones Listas para Registrar
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {tieneProgramaciones
                      ? `${programaciones.length} programacion${programaciones.length > 1 ? 'es' : ''} en ruta`
                      : 'No tienes programaciones pendientes'}
                  </p>
                </div>
              </div>
              {tieneProgramaciones && (
                <Badge variant="info" size="lg">
                  {programaciones.length} pendiente{programaciones.length > 1 ? 's' : ''}
                </Badge>
              )}
            </div>

            {/* Loading */}
            {isLoadingProgramaciones && (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
              </div>
            )}

            {/* Sin programaciones */}
            {!isLoadingProgramaciones && !tieneProgramaciones && (
              <div className="text-center py-12 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                <CheckCircle2 className="h-12 w-12 text-success-500 mx-auto mb-3" />
                <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  Todo al día
                </h4>
                <p className="text-gray-500 dark:text-gray-400 mt-1">
                  No tienes programaciones pendientes por registrar
                </p>
              </div>
            )}

            {/* Grid de Cards de Programaciones */}
            {!isLoadingProgramaciones && tieneProgramaciones && (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {programaciones.map((prog) => (
                  <div
                    key={prog.id}
                    className="group relative bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl p-5 hover:border-primary-500 dark:hover:border-primary-500 hover:shadow-lg transition-all duration-200"
                  >
                    {/* Badge EN RUTA */}
                    <div className="absolute top-3 right-3">
                      <Badge variant="info" size="sm">
                        EN RUTA
                      </Badge>
                    </div>

                    {/* Código y Razón Social */}
                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-1">
                        <Building2 className="h-4 w-4 text-gray-400" />
                        <span className="text-xs font-mono text-gray-500 dark:text-gray-400">
                          {prog.ecoaliado_codigo}
                        </span>
                      </div>
                      <h4 className="text-base font-semibold text-gray-900 dark:text-gray-100 line-clamp-1">
                        {prog.ecoaliado_razon_social}
                      </h4>
                    </div>

                    {/* Dirección */}
                    <div className="flex items-start gap-2 mb-4 text-sm text-gray-600 dark:text-gray-400">
                      <MapPin className="h-4 w-4 flex-shrink-0 mt-0.5" />
                      <span className="line-clamp-2">
                        {prog.ecoaliado_direccion || 'Sin dirección'} - {prog.ecoaliado_ciudad}
                      </span>
                    </div>

                    {/* Precio y Cantidad Estimada */}
                    <div className="flex items-center justify-between py-3 px-4 bg-success-50 dark:bg-success-900/20 rounded-lg mb-4">
                      <div>
                        <span className="text-xs text-success-700 dark:text-success-300">Precio</span>
                        <div className="text-lg font-bold text-success-600 dark:text-success-400">
                          {formatCurrency(prog.precio_kg)}/kg
                        </div>
                      </div>
                      {prog.cantidad_estimada_kg && (
                        <div className="text-right">
                          <span className="text-xs text-success-700 dark:text-success-300">Estimado</span>
                          <div className="text-sm font-medium text-success-600 dark:text-success-400">
                            {prog.cantidad_estimada_kg.toLocaleString('es-CO')} kg
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Botón Registrar */}
                    <Button
                      variant="primary"
                      className="w-full"
                      onClick={() => handleOpenRegistrar(prog)}
                    >
                      <Scale className="h-4 w-4 mr-2" />
                      Registrar Recolección
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      )}

      {/* HISTORIAL DE RECOLECCIONES - Colapsable */}
      <Card>
        <div className="p-5">
          {/* Header colapsable */}
          <button
            onClick={() => setShowHistorial(!showHistorial)}
            className="w-full flex items-center justify-between text-left"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                <Receipt className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Historial de Recolecciones
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {recoleccionesData?.count || 0} recolecciones registradas
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="gray" size="sm">
                {recoleccionesData?.count || 0}
              </Badge>
              {showHistorial ? (
                <ChevronUp className="h-5 w-5 text-gray-400" />
              ) : (
                <ChevronDown className="h-5 w-5 text-gray-400" />
              )}
            </div>
          </button>

          {/* Contenido colapsable */}
          {showHistorial && (
            <div className="mt-5 pt-5 border-t border-gray-200 dark:border-gray-700">
              {/* Búsqueda simple */}
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Buscar por código voucher o ecoaliado..."
                    value={filters.search}
                    onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value, page: 1 }))}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Lista de recolecciones (formato compacto) */}
              {isLoadingRecolecciones ? (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                </div>
              ) : recolecciones.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  No se encontraron recolecciones
                </div>
              ) : (
                <div className="space-y-3">
                  {recolecciones.map((recoleccion) => (
                    <div
                      key={recoleccion.id}
                      className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        {/* Icono voucher */}
                        <div className="p-2 bg-success-100 dark:bg-success-900/30 rounded-lg">
                          <Receipt className="h-5 w-5 text-success-600 dark:text-success-400" />
                        </div>

                        {/* Info */}
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-mono text-sm font-medium text-gray-900 dark:text-gray-100">
                              {recoleccion.codigo_voucher}
                            </span>
                            <span className="text-xs text-gray-400">•</span>
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {recoleccion.ecoaliado_razon_social}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatFechaLocal(recoleccion.fecha_recoleccion.split('T')[0])}
                            </span>
                            <span className="flex items-center gap-1">
                              <Scale className="h-3 w-3" />
                              {recoleccion.cantidad_kg.toLocaleString('es-CO')} kg
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Valor y acciones */}
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-lg font-bold text-success-600 dark:text-success-400">
                            {formatCurrency(recoleccion.valor_total)}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleVerVoucher(recoleccion)}
                          title="Ver/Imprimir Voucher"
                        >
                          <Printer className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}

                  {/* Paginación simple */}
                  {recoleccionesData && recoleccionesData.count > filters.page_size! && (
                    <div className="flex items-center justify-center gap-2 pt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={filters.page === 1}
                        onClick={() => setFilters((prev) => ({ ...prev, page: prev.page! - 1 }))}
                      >
                        Anterior
                      </Button>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        Página {filters.page} de {Math.ceil(recoleccionesData.count / filters.page_size!)}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={filters.page! * filters.page_size! >= recoleccionesData.count}
                        onClick={() => setFilters((prev) => ({ ...prev, page: prev.page! + 1 }))}
                      >
                        Siguiente
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* MODALES */}
      <RegistrarRecoleccionModal
        isOpen={isRegistrarOpen}
        onClose={handleCloseRegistrar}
        onSubmit={handleSubmitRegistrar}
        programacion={selectedProgramacion}
        isLoading={registrarMutation.isPending}
      />

      <VoucherModal
        isOpen={isVoucherOpen}
        onClose={handleCloseVoucher}
        recoleccionId={selectedRecoleccionId}
      />
    </div>
  );
};
