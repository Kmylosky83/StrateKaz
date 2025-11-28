/**
 * Pagina Principal del Modulo Recolecciones
 *
 * Caracteristicas:
 * - Lista de recolecciones con filtros
 * - Estadisticas en tiempo real
 * - Registro de nuevas recolecciones
 * - Visualizacion e impresion de vouchers
 * - Control de acceso por permisos
 */
import { useState, useRef } from 'react';
import {
  Plus,
  Search,
  Filter,
  X,
  Receipt,
  Scale,
  DollarSign,
  TrendingUp,
  Calendar,
  Printer,
} from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/forms/Input';
import { Card } from '@/components/common/Card';
import { useAuthStore } from '@/store/authStore';
import { RecoleccionesTable } from '../components/RecoleccionesTable';
import { RegistrarRecoleccionModal } from '../components/RegistrarRecoleccionModal';
import { VoucherModal } from '../components/VoucherModal';
import { VoucherRecoleccion } from '../components/VoucherRecoleccion';
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
  VoucherData,
} from '../types/recoleccion.types';

export const RecoleccionesPage = () => {
  // Usuario autenticado
  const user = useAuthStore((state) => state.user);

  // Estado de filtros
  const [filters, setFilters] = useState<RecoleccionFilters>({
    search: '',
    fecha_desde: '',
    fecha_hasta: '',
    page: 1,
    page_size: 20,
  });

  const [showFilters, setShowFilters] = useState(false);

  // Modales
  const [isRegistrarOpen, setIsRegistrarOpen] = useState(false);
  const [isVoucherOpen, setIsVoucherOpen] = useState(false);
  const [selectedProgramacion, setSelectedProgramacion] = useState<ProgramacionEnRuta | null>(null);
  const [selectedRecoleccionId, setSelectedRecoleccionId] = useState<number | null>(null);

  // Estado para voucher recien creado (impresion automatica)
  const [voucherRecienCreado, setVoucherRecienCreado] = useState<VoucherData | null>(null);
  const voucherPrintRef = useRef<HTMLDivElement>(null);

  // Queries
  const { data: recoleccionesData, isLoading: isLoadingRecolecciones } = useRecolecciones(filters);
  const { data: estadisticasData } = useEstadisticasRecolecciones(
    filters.fecha_desde || undefined,
    filters.fecha_hasta || undefined
  );
  const { data: programacionesEnRuta } = useProgramacionesEnRuta();

  // Mutations
  const registrarMutation = useRegistrarRecoleccion();

  // Permisos
  // Registrar: recolectores, lideres logisticos, gerente, superadmin
  const canRegistrar = [
    'recolector_econorte',
    'lider_log_econorte',
    'gerente',
    'superadmin',
    'coordinador_recoleccion',
  ].includes(user?.cargo_code || '');

  // Ver todas: lideres, gerente, superadmin (recolectores solo ven las suyas)
  const canVerTodas = [
    'lider_log_econorte',
    'lider_com_econorte',
    'gerente',
    'superadmin',
    'coordinador_recoleccion',
  ].includes(user?.cargo_code || '');

  // Handlers - Registrar Recoleccion
  const handleOpenRegistrar = (programacion?: ProgramacionEnRuta) => {
    if (programacion) {
      setSelectedProgramacion(programacion);
    } else if (programacionesEnRuta?.results && programacionesEnRuta.results.length > 0) {
      // Si no se especifica, tomar la primera disponible
      setSelectedProgramacion(programacionesEnRuta.results[0]);
    }
    setIsRegistrarOpen(true);
  };

  const handleCloseRegistrar = () => {
    setIsRegistrarOpen(false);
    setSelectedProgramacion(null);
  };

  const handleSubmitRegistrar = async (data: RegistrarRecoleccionDTO) => {
    try {
      const response = await registrarMutation.mutateAsync(data);

      // Guardar voucher para impresion automatica
      setVoucherRecienCreado(response.voucher);

      handleCloseRegistrar();

      // Imprimir automaticamente despues de cerrar modal
      setTimeout(() => {
        handlePrintVoucher(response.voucher);
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

  // Handlers - Reimprimir
  const handleReimprimir = (recoleccion: Recoleccion) => {
    setSelectedRecoleccionId(recoleccion.id);
    setIsVoucherOpen(true);
  };

  // Handlers - Imprimir Voucher (automatico al crear)
  const handlePrintVoucher = (voucher: VoucherData) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Por favor permita las ventanas emergentes para imprimir');
      return;
    }

    // Generar HTML del voucher
    const voucherHtml = generateVoucherHtml(voucher);

    printWindow.document.write(voucherHtml);
    printWindow.document.close();
  };

  // Funcion auxiliar para generar HTML del voucher
  const generateVoucherHtml = (voucher: VoucherData): string => {
    const formatCurrency = (value: number) => {
      return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(value);
    };

    const formatDate = (dateString: string) => {
      return new Date(dateString).toLocaleString('es-CO', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    };

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Voucher ${voucher.codigo_voucher}</title>
          <style>
            @page { size: 80mm auto; margin: 0; }
            body {
              margin: 0;
              padding: 4mm;
              font-family: 'Courier New', monospace;
              font-size: 12px;
              width: 80mm;
              max-width: 80mm;
              box-sizing: border-box;
            }
            .header { text-align: center; border-bottom: 1px dashed #333; padding-bottom: 2mm; margin-bottom: 2mm; }
            .header .empresa { font-weight: bold; font-size: 14px; }
            .title { text-align: center; font-weight: bold; border-bottom: 1px dashed #333; padding-bottom: 2mm; margin-bottom: 2mm; }
            .title .codigo { font-size: 18px; }
            .section { border-bottom: 1px dashed #333; padding-bottom: 2mm; margin-bottom: 2mm; }
            .section-title { font-weight: bold; margin-bottom: 1mm; }
            table { width: 100%; border-collapse: collapse; }
            td { padding: 1mm 0; }
            .text-right { text-align: right; }
            .font-bold { font-weight: bold; }
            .total-row { font-size: 14px; font-weight: bold; }
            .letras { text-align: center; font-size: 10px; border-bottom: 1px dashed #333; padding-bottom: 2mm; margin-bottom: 2mm; }
            .firmas { margin-top: 16mm; display: flex; justify-content: space-between; }
            .firma { text-align: center; flex: 1; }
            .firma-linea { border-top: 1px solid #000; width: 20mm; margin: 0 auto 1mm; }
            .footer { text-align: center; margin-top: 4mm; font-size: 10px; }
            @media print { body { print-color-adjust: exact; } }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="empresa">${voucher.empresa.nombre}</div>
            <div>NIT: ${voucher.empresa.nit}</div>
            <div>${voucher.empresa.direccion}</div>
            <div>Tel: ${voucher.empresa.telefono}</div>
          </div>

          <div class="title">
            <div>COMPROBANTE DE RECOLECCION</div>
            <div class="codigo">${voucher.codigo_voucher}</div>
            <div style="font-size: 10px;">${formatDate(voucher.fecha_recoleccion)}</div>
          </div>

          <div class="section">
            <div class="section-title">PROVEEDOR:</div>
            <div>${voucher.ecoaliado_info.razon_social}</div>
            <div>NIT: ${voucher.ecoaliado_info.nit}</div>
            <div>Cod: ${voucher.ecoaliado_info.codigo}</div>
            ${voucher.ecoaliado_info.direccion ? `<div>${voucher.ecoaliado_info.direccion}</div>` : ''}
            <div>${voucher.ecoaliado_info.ciudad}</div>
          </div>

          <div class="section">
            <div class="section-title">DETALLE:</div>
            <table>
              <tr>
                <td>Cantidad:</td>
                <td class="text-right font-bold">${voucher.detalle.cantidad_kg.toLocaleString('es-CO')} kg</td>
              </tr>
              <tr>
                <td>Precio/kg:</td>
                <td class="text-right">${formatCurrency(voucher.detalle.precio_kg)}</td>
              </tr>
            </table>
          </div>

          <div class="section">
            <table>
              <tr>
                <td>Subtotal:</td>
                <td class="text-right">${formatCurrency(voucher.detalle.subtotal)}</td>
              </tr>
              <tr>
                <td>IVA:</td>
                <td class="text-right">${formatCurrency(voucher.detalle.iva)}</td>
              </tr>
              <tr class="total-row">
                <td>TOTAL:</td>
                <td class="text-right">${formatCurrency(voucher.detalle.total)}</td>
              </tr>
            </table>
          </div>

          <div class="letras">
            <div class="font-bold">SON:</div>
            <div>${voucher.detalle.total_letras}</div>
          </div>

          <div class="section">
            <div>Recolector: ${voucher.recolector_nombre}</div>
          </div>

          <div class="firmas">
            <div class="firma">
              <div class="firma-linea"></div>
              <div style="font-size: 10px;">ENTREGA</div>
            </div>
            <div class="firma">
              <div class="firma-linea"></div>
              <div style="font-size: 10px;">RECIBE</div>
            </div>
          </div>

          <div class="footer">
            <div>*** ORIGINAL ***</div>
            <div>Gracias por su preferencia</div>
          </div>

          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() { window.close(); };
            };
          </script>
        </body>
      </html>
    `;
  };

  // Handlers - Filtros
  const handleSearchChange = (value: string) => {
    setFilters((prev) => ({ ...prev, search: value, page: 1 }));
  };

  const handleFilterChange = (key: keyof RecoleccionFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const handleClearFilters = () => {
    setFilters({
      search: '',
      fecha_desde: '',
      fecha_hasta: '',
      page: 1,
      page_size: 20,
    });
  };

  const hasActiveFilters = filters.fecha_desde || filters.fecha_hasta;

  // Formatear moneda para estadisticas
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Recolecciones</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Registro y seguimiento de recolecciones de material
          </p>
        </div>
        <div className="flex items-center gap-3">
          {canRegistrar && programacionesEnRuta?.results && programacionesEnRuta.results.length > 0 && (
            <Button variant="primary" onClick={() => handleOpenRegistrar()}>
              <Plus className="h-5 w-5 mr-2" />
              Registrar Recoleccion
            </Button>
          )}
        </div>
      </div>

      {/* PROGRAMACIONES EN RUTA (para recolectores) */}
      {canRegistrar && programacionesEnRuta?.results && programacionesEnRuta.results.length > 0 && (
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Programaciones Listas para Registrar ({programacionesEnRuta.count})
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {programacionesEnRuta.results.slice(0, 6).map((prog) => (
              <div
                key={prog.id}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-primary-500 transition-colors cursor-pointer"
                onClick={() => handleOpenRegistrar(prog)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="font-medium text-gray-900 dark:text-gray-100">
                    {prog.ecoaliado_codigo}
                  </div>
                  <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded">
                    EN RUTA
                  </span>
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  {prog.ecoaliado_razon_social}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-500 mb-3">
                  {prog.ecoaliado_direccion} - {prog.ecoaliado_ciudad}
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                  <span className="text-sm text-green-600 dark:text-green-400 font-medium">
                    {formatCurrency(prog.precio_kg)}/kg
                  </span>
                  {prog.cantidad_estimada_kg && (
                    <span className="text-xs text-gray-500">
                      Est: {prog.cantidad_estimada_kg.toLocaleString('es-CO')} kg
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
          {programacionesEnRuta.results.length > 6 && (
            <div className="mt-4 text-center">
              <span className="text-sm text-gray-500">
                +{programacionesEnRuta.results.length - 6} programaciones mas
              </span>
            </div>
          )}
        </Card>
      )}

      {/* ESTADISTICAS */}
      {estadisticasData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Total Recolecciones</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                  {estadisticasData.total_recolecciones.toLocaleString('es-CO')}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Hoy: {estadisticasData.recolecciones_hoy}
                </div>
              </div>
              <Receipt className="h-8 w-8 text-primary-400" />
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Total Kilogramos</div>
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                  {estadisticasData.total_kg_recolectados.toLocaleString('es-CO')}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Prom: {estadisticasData.promedio_kg_por_recoleccion.toLocaleString('es-CO')} kg
                </div>
              </div>
              <Scale className="h-8 w-8 text-blue-400" />
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Total Pagado</div>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                  {formatCurrency(estadisticasData.total_valor_pagado)}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Prom: {formatCurrency(estadisticasData.promedio_valor_por_recoleccion)}
                </div>
              </div>
              <DollarSign className="h-8 w-8 text-green-400" />
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Esta Semana</div>
                <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mt-1">
                  {estadisticasData.recolecciones_semana.toLocaleString('es-CO')}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Este mes: {estadisticasData.recolecciones_mes}
                </div>
              </div>
              <TrendingUp className="h-8 w-8 text-yellow-400" />
            </div>
          </Card>
        </div>
      )}

      {/* FILTROS */}
      <Card>
        <div className="space-y-4">
          {/* Buscador Principal */}
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <Input
                placeholder="Buscar por codigo voucher, ecoaliado..."
                value={filters.search}
                onChange={(e) => handleSearchChange(e.target.value)}
                leftIcon={<Search className="h-5 w-5 text-gray-400" />}
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="flex-shrink-0"
            >
              <Filter className="h-5 w-5 mr-2" />
              Filtros
              {hasActiveFilters && (
                <span className="ml-2 bg-primary-600 text-white text-xs px-2 py-0.5 rounded-full">
                  {Object.values({ fechas: filters.fecha_desde || filters.fecha_hasta }).filter(Boolean).length}
                </span>
              )}
            </Button>
            {hasActiveFilters && (
              <Button variant="outline" onClick={handleClearFilters}>
                <X className="h-5 w-5" />
              </Button>
            )}
          </div>

          {/* Filtros Avanzados */}
          {showFilters && (
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Input
                  type="date"
                  label="Fecha Desde"
                  value={filters.fecha_desde}
                  onChange={(e) => handleFilterChange('fecha_desde', e.target.value)}
                />

                <Input
                  type="date"
                  label="Fecha Hasta"
                  value={filters.fecha_hasta}
                  onChange={(e) => handleFilterChange('fecha_hasta', e.target.value)}
                />
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* TABLA DE RECOLECCIONES */}
      <Card>
        <RecoleccionesTable
          recolecciones={recoleccionesData?.results || []}
          onVerVoucher={handleVerVoucher}
          onReimprimir={handleReimprimir}
          isLoading={isLoadingRecolecciones}
        />

        {/* Paginacion */}
        {recoleccionesData && recoleccionesData.count > (filters.page_size || 20) && (
          <div className="mt-4 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 pt-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Mostrando {((filters.page || 1) - 1) * (filters.page_size || 20) + 1} -{' '}
              {Math.min((filters.page || 1) * (filters.page_size || 20), recoleccionesData.count)}{' '}
              de {recoleccionesData.count}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={(filters.page || 1) <= 1}
                onClick={() => setFilters((prev) => ({ ...prev, page: (prev.page || 1) - 1 }))}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={(filters.page || 1) * (filters.page_size || 20) >= recoleccionesData.count}
                onClick={() => setFilters((prev) => ({ ...prev, page: (prev.page || 1) + 1 }))}
              >
                Siguiente
              </Button>
            </div>
          </div>
        )}
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

      {/* Voucher oculto para impresion automatica */}
      {voucherRecienCreado && (
        <div className="hidden">
          <VoucherRecoleccion ref={voucherPrintRef} voucher={voucherRecienCreado} />
        </div>
      )}
    </div>
  );
};
