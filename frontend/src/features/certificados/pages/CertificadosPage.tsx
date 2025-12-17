/**
 * Pagina Principal del Modulo Certificados de Recoleccion
 *
 * Vista para gestionar certificados emitidos:
 * - Listado con filtros
 * - Estadisticas
 * - Generar nuevo certificado
 * - Ver/Reimprimir certificados
 * - Eliminar certificados (solo gerente)
 */
import { useState, useRef, useEffect } from 'react';
import {
  Award,
  FileText,
  Eye,
  Printer,
  Trash2,
  Scale,
  Plus,
  Search,
  AlertCircle,
  CheckCircle,
  Building2,
} from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/forms/Input';
import { Select } from '@/components/forms/Select';
import { Badge } from '@/components/common/Badge';
import { Modal } from '@/components/common/Modal';
import {
  PageHeader,
  StatsGrid,
  FilterCard,
  FilterGrid,
  DataTableCard,
} from '@/components/layout';
import { formatCurrency } from '@/utils/formatters';
import { formatFechaLocal } from '@/utils/dateUtils';
import { useAuthStore } from '@/store/authStore';
import { CargoCodes } from '@/constants/permissions';
import { useBrandingConfig } from '@/hooks/useBrandingConfig';
import { CertificadoRecoleccion } from '@/features/recolecciones/components/CertificadoRecoleccion';
import { useEcoaliados } from '@/features/ecoaliados/api/useEcoaliados';
import { useCertificadoRecoleccion } from '@/features/recolecciones/api/useRecolecciones';
import type { PeriodoCertificado, CertificadoRecoleccionParams, CertificadoRecoleccionData } from '@/features/recolecciones/types/recoleccion.types';
import {
  useCertificados,
  useCertificado,
  useDeleteCertificado,
} from '../api/useCertificados';
import type { Certificado, CertificadoFilters, PeriodoCertificado as PeriodoCertificadoType } from '../types/certificado.types';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

const PERIODOS_OPTIONS = [
  { value: '', label: 'Todos los periodos' },
  { value: 'mensual', label: 'Mensual' },
  { value: 'bimestral', label: 'Bimestral' },
  { value: 'trimestral', label: 'Trimestral' },
  { value: 'semestral', label: 'Semestral' },
  { value: 'anual', label: 'Anual' },
  { value: 'personalizado', label: 'Personalizado' },
];

const PERIODOS_GENERAR_OPTIONS = [
  { value: 'mensual', label: 'Mensual' },
  { value: 'bimestral', label: 'Bimestral' },
  { value: 'trimestral', label: 'Trimestral' },
  { value: 'semestral', label: 'Semestral' },
  { value: 'anual', label: 'Anual' },
  { value: 'personalizado', label: 'Personalizado (fechas específicas)' },
];

// Generar opciones de meses
const getMesesOptions = () => {
  const meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  return meses.map((mes, index) => ({ value: String(index + 1), label: mes }));
};

// Generar opciones de años (últimos 3 años)
const getAniosOptions = () => {
  const currentYear = new Date().getFullYear();
  return [
    { value: String(currentYear), label: String(currentYear) },
    { value: String(currentYear - 1), label: String(currentYear - 1) },
    { value: String(currentYear - 2), label: String(currentYear - 2) },
  ];
};

interface CertificadosPageProps {
  /** Si está embebido dentro de EcoNortePage, no muestra header propio */
  embedded?: boolean;
  /** Trigger para abrir modal de nuevo certificado desde EcoNortePage */
  triggerNewForm?: number;
}

export const CertificadosPage = ({ embedded = false, triggerNewForm = 0 }: CertificadosPageProps) => {
  const user = useAuthStore((state) => state.user);
  const { logo } = useBrandingConfig();
  const certificadoRef = useRef<HTMLDivElement>(null);
  const lastTriggerRef = useRef(0); // Para evitar abrir modal al cambiar de tab
  const queryClient = useQueryClient();

  // Estado de filtros
  const [filters, setFilters] = useState<CertificadoFilters>({
    search: '',
    periodo: undefined,
    fecha_desde: '',
    fecha_hasta: '',
    page: 1,
    page_size: 20,
  });

  // Estado para modales
  const [selectedCertificadoId, setSelectedCertificadoId] = useState<number | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);

  // Estado para generación de certificado
  const [generateForm, setGenerateForm] = useState<{
    ecoaliado_id: number | null;
    periodo: PeriodoCertificado;
    año: number;
    mes: number;
    fecha_inicio: string;
    fecha_fin: string;
  }>({
    ecoaliado_id: null,
    periodo: 'mensual',
    año: new Date().getFullYear(),
    mes: new Date().getMonth() + 1,
    fecha_inicio: '',
    fecha_fin: '',
  });

  // Estado para preview del certificado generado
  const [generatedCertificado, setGeneratedCertificado] = useState<CertificadoRecoleccionData | null>(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  // Estado para búsqueda de ecoaliado
  const [ecoaliadoSearch, setEcoaliadoSearch] = useState('');

  // Queries
  const { data: certificadosData, isLoading } = useCertificados(filters);
  const { data: certificadoDetalle, isLoading: isLoadingDetalle } = useCertificado(
    isDetailModalOpen ? selectedCertificadoId : null
  );
  const { data: ecoaliadosData } = useEcoaliados({ is_active: true, page_size: 1000 });

  // Mutations
  const deleteMutation = useDeleteCertificado();
  const generateMutation = useCertificadoRecoleccion();

  // Permisos
  const canDelete = ['gerente', 'superadmin'].includes(user?.cargo_code || '');
  const canGenerate = ['gerente', 'superadmin', CargoCodes.LIDER_COMERCIAL_ECONORTE, CargoCodes.COMERCIAL_ECONORTE].includes(user?.cargo_code || '');

  // Efecto para abrir modal desde trigger externo
  // Solo abre cuando el trigger realmente cambia, no al montar el componente
  useEffect(() => {
    if (triggerNewForm > 0 && triggerNewForm !== lastTriggerRef.current) {
      lastTriggerRef.current = triggerNewForm;
      handleOpenGenerateModal();
    }
  }, [triggerNewForm]);

  // Handlers - Filtros
  const handleSearchChange = (value: string) => {
    setFilters((prev) => ({ ...prev, search: value, page: 1 }));
  };

  const handleFilterChange = (key: keyof CertificadoFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value || undefined, page: 1 }));
  };

  const handleClearFilters = () => {
    setFilters({
      search: '',
      periodo: undefined,
      fecha_desde: '',
      fecha_hasta: '',
      page: 1,
      page_size: 20,
    });
  };

  // Handlers - Modal Detalle
  const handleVerDetalle = (certificado: Certificado) => {
    setSelectedCertificadoId(certificado.id);
    setIsDetailModalOpen(true);
  };

  const handleCloseDetalle = () => {
    setIsDetailModalOpen(false);
    setSelectedCertificadoId(null);
  };

  // Handlers - Modal Generar
  const handleOpenGenerateModal = () => {
    setGenerateForm({
      ecoaliado_id: null,
      periodo: 'mensual',
      año: new Date().getFullYear(),
      mes: new Date().getMonth() + 1,
      fecha_inicio: '',
      fecha_fin: '',
    });
    setGeneratedCertificado(null);
    setIsPreviewMode(false);
    setEcoaliadoSearch('');
    setIsGenerateModalOpen(true);
  };

  const handleCloseGenerateModal = () => {
    setIsGenerateModalOpen(false);
    setGeneratedCertificado(null);
    setIsPreviewMode(false);
  };

  const handleGenerateFormChange = (key: string, value: string | number | null) => {
    setGenerateForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleGenerateCertificado = async () => {
    if (!generateForm.ecoaliado_id) {
      toast.error('Debe seleccionar un ecoaliado');
      return;
    }

    const params: CertificadoRecoleccionParams = {
      ecoaliado_id: generateForm.ecoaliado_id,
      periodo: generateForm.periodo,
    };

    if (generateForm.periodo === 'personalizado') {
      if (!generateForm.fecha_inicio || !generateForm.fecha_fin) {
        toast.error('Debe seleccionar las fechas del periodo');
        return;
      }
      params.fecha_inicio = generateForm.fecha_inicio;
      params.fecha_fin = generateForm.fecha_fin;
    } else {
      params.año = generateForm.año;
      if (generateForm.periodo === 'mensual') {
        params.mes = generateForm.mes;
      }
    }

    try {
      const result = await generateMutation.mutateAsync(params);
      setGeneratedCertificado(result);
      setIsPreviewMode(true);
      // Invalidar query de certificados para refrescar la lista
      queryClient.invalidateQueries({ queryKey: ['certificados'] });
      toast.success('Certificado generado y guardado exitosamente');
    } catch (error) {
      // El error ya se maneja en el hook
    }
  };

  const handleDelete = async (certificado: Certificado) => {
    if (
      window.confirm(
        `¿Está seguro de eliminar el certificado "${certificado.numero_certificado}"?\n\nEsta acción no se puede deshacer.`
      )
    ) {
      try {
        await deleteMutation.mutateAsync(certificado.id);
      } catch (error) {
        console.error('Error al eliminar certificado:', error);
      }
    }
  };

  const handlePrint = () => {
    if (!certificadoRef.current) return;

    const certificadoData = isPreviewMode ? generatedCertificado : certificadoDetalle?.datos_certificado;
    if (!certificadoData) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Por favor permita las ventanas emergentes para imprimir');
      return;
    }

    const certificadoContent = certificadoRef.current.innerHTML;
    // Usar logo del branding (puede ser URL absoluta o relativa)
    const logoUrl = logo.startsWith('http') ? logo : `${window.location.origin}${logo}`;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Certificado de Recolección</title>
          <style>
            @page { size: A4; margin: 15mm; }
            body { margin: 0; padding: 0; font-family: 'Times New Roman', serif; font-size: 12px; line-height: 1.6; }
            * { box-sizing: border-box; }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .text-left { text-align: left; }
            .text-justify { text-align: justify; }
            .font-bold { font-weight: bold; }
            .font-semibold { font-weight: 600; }
            .text-lg { font-size: 16px; }
            .text-xl { font-size: 18px; }
            .text-2xl { font-size: 22px; }
            .text-sm { font-size: 11px; }
            .text-xs { font-size: 10px; }
            .uppercase { text-transform: uppercase; }
            .mb-2 { margin-bottom: 8px; }
            .mb-3 { margin-bottom: 12px; }
            .mb-4 { margin-bottom: 16px; }
            .mb-6 { margin-bottom: 24px; }
            .mb-8 { margin-bottom: 32px; }
            .mt-8 { margin-top: 32px; }
            .mt-12 { margin-top: 48px; }
            .pt-2 { padding-top: 8px; }
            .pt-4 { padding-top: 16px; }
            .pb-4 { padding-bottom: 16px; }
            .p-3 { padding: 12px; }
            .p-4 { padding: 16px; }
            .gap-4 { gap: 16px; }
            .flex { display: flex; }
            .items-center { align-items: center; }
            .justify-between { justify-content: space-between; }
            .grid { display: grid; }
            .grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
            .border { border: 1px solid #d1d5db; }
            .border-t { border-top: 1px solid #d1d5db; }
            .border-t-2 { border-top: 2px solid #1f2937; }
            .border-b-2 { border-bottom: 2px solid #1f2937; }
            .rounded { border-radius: 4px; }
            .rounded-lg { border-radius: 8px; }
            .bg-white { background-color: white; }
            .bg-gray-50 { background-color: #f9fafb; }
            .bg-gray-100 { background-color: #f3f4f6; }
            .bg-green-50 { background-color: #f0fdf4; }
            .text-gray-500 { color: #6b7280; }
            .text-gray-600 { color: #4b5563; }
            .text-gray-700 { color: #374151; }
            .text-gray-800 { color: #1f2937; }
            .text-green-800 { color: #166534; }
            .text-primary-600 { color: #2563eb; }
            .text-green-600 { color: #16a34a; }
            .border-gray-300 { border-color: #d1d5db; }
            .border-green-200 { border-color: #bbf7d0; }
            .w-full { width: 100%; }
            .font-mono { font-family: 'Courier New', monospace; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #d1d5db; padding: 8px 12px; }
            th { background-color: #f3f4f6; }
            img { max-width: 100%; height: auto; }
            @media print { body { print-color-adjust: exact; -webkit-print-color-adjust: exact; } }
          </style>
        </head>
        <body>
          ${certificadoContent.replace(/src="\/logo-dark\.png"/g, 'src="' + logoUrl + '"')}
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
                window.onafterprint = function() { window.close(); };
              }, 500);
            };
          </script>
        </body>
      </html>
    `);

    printWindow.document.close();
  };

  // Helpers
  const getPeriodoBadgeVariant = (periodo: PeriodoCertificadoType): 'primary' | 'info' | 'success' | 'warning' | 'gray' => {
    const variants: Record<PeriodoCertificadoType, 'primary' | 'info' | 'success' | 'warning' | 'gray'> = {
      mensual: 'primary',
      bimestral: 'info',
      trimestral: 'success',
      semestral: 'warning',
      anual: 'success',
      personalizado: 'gray',
    };
    return variants[periodo] || 'gray';
  };

  // Filtrar ecoaliados por búsqueda
  const filteredEcoaliados = ecoaliadosData?.results?.filter((ecoaliado) => {
    if (!ecoaliadoSearch) return true;
    const searchLower = ecoaliadoSearch.toLowerCase();
    return (
      ecoaliado.razon_social.toLowerCase().includes(searchLower) ||
      ecoaliado.codigo.toLowerCase().includes(searchLower) ||
      ecoaliado.documento_numero?.toLowerCase().includes(searchLower)
    );
  }) || [];

  const selectedEcoaliado = ecoaliadosData?.results?.find(
    (e) => e.id === generateForm.ecoaliado_id
  );

  const hasActiveFilters = filters.periodo || filters.fecha_desde || filters.fecha_hasta;
  const activeFiltersCount = [filters.periodo, filters.fecha_desde, filters.fecha_hasta].filter(Boolean).length;

  // Calcular estadisticas usando totales agregados del backend
  const certificados = certificadosData?.results || [];
  const totalCertificados = certificadosData?.count || 0;
  // Usar totales del backend (suma de TODOS los certificados, no solo la página actual)
  const totalKgCertificados = certificadosData?.totales?.total_kg || 0;
  // Total de recolecciones solo de la página actual (el backend no agrega esto)
  const totalRecoleccionesPagina = certificados.reduce((acc, c) => acc + c.total_recolecciones, 0);

  return (
    <div className="space-y-6">
      {/* HEADER - Solo cuando no está embebido */}
      {!embedded && (
        <PageHeader
          title="Certificados de Recolección"
          description="Historial de certificados emitidos a ecoaliados"
          actions={
            canGenerate && (
              <Button variant="primary" onClick={handleOpenGenerateModal}>
                <Plus className="h-5 w-5 mr-2" />
                Generar Certificado
              </Button>
            )
          }
        />
      )}

      {/* ESTADISTICAS */}
      <StatsGrid
        stats={[
          {
            label: 'Total Certificados',
            value: totalCertificados,
            icon: Award,
            iconColor: 'primary',
          },
          {
            label: 'Kg Totales Certificados',
            value: totalKgCertificados.toLocaleString('es-CO', { maximumFractionDigits: 0 }) + ' kg',
            icon: Scale,
            iconColor: 'success',
          },
          {
            label: 'Recolecciones (página)',
            value: totalRecoleccionesPagina,
            icon: FileText,
            iconColor: 'info',
          },
        ]}
      />

      {/* FILTROS */}
      <FilterCard
        collapsible
        searchPlaceholder="Buscar por numero o ecoaliado..."
        searchValue={filters.search}
        onSearchChange={handleSearchChange}
        activeFiltersCount={activeFiltersCount}
        hasActiveFilters={!!hasActiveFilters}
        onClearFilters={handleClearFilters}
      >
        <FilterGrid columns={3}>
          <Select
            label="Periodo"
            value={filters.periodo || ''}
            onChange={(e) => handleFilterChange('periodo', e.target.value)}
            options={PERIODOS_OPTIONS}
          />

          <Input
            label="Fecha desde"
            type="date"
            value={filters.fecha_desde || ''}
            onChange={(e) => handleFilterChange('fecha_desde', e.target.value)}
          />

          <Input
            label="Fecha hasta"
            type="date"
            value={filters.fecha_hasta || ''}
            onChange={(e) => handleFilterChange('fecha_hasta', e.target.value)}
          />
        </FilterGrid>
      </FilterCard>

      {/* TABLA */}
      <DataTableCard
        pagination={{
          currentPage: filters.page || 1,
          pageSize: filters.page_size || 20,
          totalItems: totalCertificados,
          hasPrevious: (filters.page || 1) > 1,
          hasNext: (filters.page || 1) * (filters.page_size || 20) < totalCertificados,
          onPageChange: (page) => setFilters((prev) => ({ ...prev, page })),
        }}
        isEmpty={certificados.length === 0}
        isLoading={isLoading}
        emptyMessage="No se encontraron certificados"
      >
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Certificado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Ecoaliado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Periodo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Recolecciones
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Total Kg
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Valor Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Emitido
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {certificados.map((certificado) => (
                <tr
                  key={certificado.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  {/* Numero Certificado */}
                  <td className="px-6 py-4">
                    <span className="text-sm font-mono font-medium text-primary-600 dark:text-primary-400">
                      {certificado.numero_certificado}
                    </span>
                  </td>

                  {/* Ecoaliado */}
                  <td className="px-6 py-4">
                    <div>
                      <span className="text-xs font-mono text-gray-500 dark:text-gray-400">
                        {certificado.ecoaliado_codigo}
                      </span>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mt-1">
                        {certificado.ecoaliado_razon_social}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {certificado.ecoaliado_ciudad}
                      </p>
                    </div>
                  </td>

                  {/* Periodo */}
                  <td className="px-6 py-4">
                    <div>
                      <Badge variant={getPeriodoBadgeVariant(certificado.periodo)} size="sm">
                        {certificado.periodo_display}
                      </Badge>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        {certificado.descripcion_periodo}
                      </p>
                    </div>
                  </td>

                  {/* Recolecciones */}
                  <td className="px-6 py-4">
                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {certificado.total_recolecciones}
                    </span>
                  </td>

                  {/* Total Kg */}
                  <td className="px-6 py-4">
                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {certificado.total_kg.toLocaleString('es-CO', { maximumFractionDigits: 2 })} kg
                    </span>
                  </td>

                  {/* Valor Total */}
                  <td className="px-6 py-4">
                    <span className="text-sm font-bold text-success-600 dark:text-success-400">
                      {formatCurrency(certificado.total_valor)}
                    </span>
                  </td>

                  {/* Emitido */}
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 dark:text-gray-100">
                      {formatFechaLocal(certificado.fecha_emision.split('T')[0])}
                    </div>
                    {certificado.emitido_por_nombre && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {certificado.emitido_por_nombre}
                      </p>
                    )}
                  </td>

                  {/* Acciones */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleVerDetalle(certificado)}
                        title="Ver/Imprimir"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Ver
                      </Button>
                      {canDelete && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(certificado)}
                          title="Eliminar"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DataTableCard>

      {/* MODAL DE DETALLE */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={handleCloseDetalle}
        title="Certificado de Recolección"
        size="4xl"
      >
        {isLoadingDetalle ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
          </div>
        ) : certificadoDetalle ? (
          <div className="space-y-4">
            {/* Preview del certificado */}
            <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-auto max-h-[70vh]">
              <div className="mx-auto" style={{ width: '210mm' }}>
                <CertificadoRecoleccion
                  ref={certificadoRef}
                  certificado={certificadoDetalle.datos_certificado}
                />
              </div>
            </div>

            {/* Botones de accion */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button variant="outline" onClick={handleCloseDetalle}>
                Cerrar
              </Button>
              <Button variant="primary" onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-2" />
                Imprimir
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            No se pudo cargar el certificado
          </div>
        )}
      </Modal>

      {/* MODAL DE GENERAR CERTIFICADO */}
      <Modal
        isOpen={isGenerateModalOpen}
        onClose={handleCloseGenerateModal}
        title={isPreviewMode ? 'Certificado Generado' : 'Generar Nuevo Certificado'}
        size={isPreviewMode ? '4xl' : 'xl'}
      >
        {!isPreviewMode ? (
          <div className="space-y-6">
            {/* Selector de Ecoaliado */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Ecoaliado *
              </label>

              {/* Ecoaliado seleccionado */}
              {selectedEcoaliado ? (
                <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {selectedEcoaliado.razon_social}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {selectedEcoaliado.codigo} • {selectedEcoaliado.ciudad}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleGenerateFormChange('ecoaliado_id', null)}
                  >
                    Cambiar
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {/* Buscador */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Buscar por nombre, código o documento..."
                      value={ecoaliadoSearch}
                      onChange={(e) => setEcoaliadoSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-gray-100"
                    />
                  </div>

                  {/* Lista de ecoaliados */}
                  <div className="max-h-48 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg">
                    {filteredEcoaliados.length === 0 ? (
                      <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                        {ecoaliadoSearch ? 'No se encontraron ecoaliados' : 'Cargando ecoaliados...'}
                      </div>
                    ) : (
                      filteredEcoaliados.map((ecoaliado) => (
                        <button
                          key={ecoaliado.id}
                          onClick={() => handleGenerateFormChange('ecoaliado_id', ecoaliado.id)}
                          className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 last:border-b-0 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                {ecoaliado.razon_social}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {ecoaliado.codigo} • {ecoaliado.documento_numero} • {ecoaliado.ciudad}
                              </p>
                            </div>
                            <Building2 className="h-4 w-4 text-gray-400" />
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Selector de Periodo */}
            <Select
              label="Tipo de Periodo *"
              value={generateForm.periodo}
              onChange={(e) => handleGenerateFormChange('periodo', e.target.value as PeriodoCertificado)}
              options={PERIODOS_GENERAR_OPTIONS}
            />

            {/* Campos según tipo de periodo */}
            {generateForm.periodo === 'personalizado' ? (
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Fecha Inicio *"
                  type="date"
                  value={generateForm.fecha_inicio}
                  onChange={(e) => handleGenerateFormChange('fecha_inicio', e.target.value)}
                />
                <Input
                  label="Fecha Fin *"
                  type="date"
                  value={generateForm.fecha_fin}
                  onChange={(e) => handleGenerateFormChange('fecha_fin', e.target.value)}
                />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="Año *"
                  value={String(generateForm.año)}
                  onChange={(e) => handleGenerateFormChange('año', parseInt(e.target.value))}
                  options={getAniosOptions()}
                />
                {generateForm.periodo === 'mensual' && (
                  <Select
                    label="Mes *"
                    value={String(generateForm.mes)}
                    onChange={(e) => handleGenerateFormChange('mes', parseInt(e.target.value))}
                    options={getMesesOptions()}
                  />
                )}
              </div>
            )}

            {/* Info */}
            <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-700 dark:text-blue-300">
                <p className="font-medium">Información</p>
                <p className="mt-1">
                  Se generará un certificado con todas las recolecciones del ecoaliado
                  en el periodo seleccionado. El certificado se guardará automáticamente
                  y podrá reimprimirlo cuando lo necesite.
                </p>
              </div>
            </div>

            {/* Botones */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button variant="outline" onClick={handleCloseGenerateModal}>
                Cancelar
              </Button>
              <Button
                variant="primary"
                onClick={handleGenerateCertificado}
                disabled={!generateForm.ecoaliado_id || generateMutation.isPending}
              >
                {generateMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Generando...
                  </>
                ) : (
                  <>
                    <Award className="h-4 w-4 mr-2" />
                    Generar Certificado
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          /* Preview del certificado generado */
          <div className="space-y-4">
            <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <p className="text-sm font-medium text-green-700 dark:text-green-300">
                Certificado generado y guardado exitosamente
              </p>
            </div>

            {/* Preview del certificado */}
            <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-auto max-h-[60vh]">
              <div className="mx-auto" style={{ width: '210mm' }}>
                <CertificadoRecoleccion
                  ref={certificadoRef}
                  certificado={generatedCertificado!}
                />
              </div>
            </div>

            {/* Botones de accion */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button variant="outline" onClick={handleCloseGenerateModal}>
                Cerrar
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setIsPreviewMode(false);
                  setGeneratedCertificado(null);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Generar Otro
              </Button>
              <Button variant="primary" onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-2" />
                Imprimir
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
