/**
 * InformeGerencialTab — Dashboard consolidado para la Revisión por la Dirección
 *
 * Consolida datos de los 14 módulos C2 en un informe ejecutivo ISO 9.3.
 * Provee:
 * - Selector de rango de fechas
 * - Resumen ejecutivo con gauge global y radar
 * - 15 secciones ISO como tarjetas con gráficos
 * - Layout responsivo (3 col desktop, 2 tablet, 1 mobile)
 * - Animaciones de entrada con Framer Motion
 *
 * Usa exclusivamente componentes del Design System.
 */
import { useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { FileBarChart, Calendar, RefreshCw, Printer, Download, Mail, Loader2 } from 'lucide-react';
import { format, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import { Card, Button, Spinner, EmptyState, Badge } from '@/components/common';
import { DateRangePicker, Select } from '@/components/forms';
import {
  useInformeConsolidado,
  useProgramasRevision,
  useExportInformeGerencialPDF,
} from '../../../../hooks/useRevisionDireccion';
import { EnviarInformeModal } from '../../EnviarInformeModal';
import { ResumenEjecutivoCard } from './ResumenEjecutivoCard';
import {
  AccionesPreviasSection,
  ContextoSection,
  CumplimientoSection,
  SatisfaccionSection,
  ObjetivosSection,
  NoConformidadesSection,
  AuditoriasSection,
  ProveedoresSection,
  RecursosHumanosSection,
  PresupuestoSection,
  RiesgosSection,
  AccidentalidadSection,
  AmbientalSection,
  FormacionSection,
  ParticipacionSection,
} from './secciones';

// Default: últimos 6 meses
const DEFAULT_DESDE = format(subMonths(new Date(), 6), 'yyyy-MM-dd');
const DEFAULT_HASTA = format(new Date(), 'yyyy-MM-dd');

// Stagger animation for section cards
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.0, 0.0, 0.2, 1] },
  },
};

export function InformeGerencialTab() {
  const [fechaDesde, setFechaDesde] = useState(DEFAULT_DESDE);
  const [fechaHasta, setFechaHasta] = useState(DEFAULT_HASTA);
  const [selectedProgramacionId, setSelectedProgramacionId] = useState<number | null>(null);
  const [showEnviarModal, setShowEnviarModal] = useState(false);
  const [enviarActaId, setEnviarActaId] = useState<number | null>(null);

  const {
    data: informe,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useInformeConsolidado(fechaDesde, fechaHasta);

  // Programaciones para selector de PDF export
  const { data: programacionesData } = useProgramasRevision({});
  const programaciones = useMemo(() => {
    const items =
      programacionesData?.results ?? (Array.isArray(programacionesData) ? programacionesData : []);
    return items;
  }, [programacionesData]);

  // Auto-select first programacion if none selected
  useMemo(() => {
    if (!selectedProgramacionId && programaciones.length > 0) {
      setSelectedProgramacionId(programaciones[0].id);
    }
  }, [selectedProgramacionId, programaciones]);

  const exportPDFMutation = useExportInformeGerencialPDF();

  const handleDateChange = useCallback((range: { startDate: string; endDate: string }) => {
    if (range.startDate) setFechaDesde(range.startDate);
    if (range.endDate) setFechaHasta(range.endDate);
  }, []);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const handleExportPDF = useCallback(() => {
    if (!selectedProgramacionId) return;
    exportPDFMutation.mutate({
      programacionId: selectedProgramacionId,
      fechaDesde,
      fechaHasta,
    });
  }, [selectedProgramacionId, fechaDesde, fechaHasta, exportPDFMutation]);

  const handleEnviar = useCallback(() => {
    // For sending via email, we need an acta ID. Use the programacion's acta if available.
    // The backend endpoint expects an acta ID for enviar-informe.
    // We'll use the selected programacion ID as context for the send modal.
    if (selectedProgramacionId) {
      setEnviarActaId(selectedProgramacionId);
      setShowEnviarModal(true);
    }
  }, [selectedProgramacionId]);

  // Period display
  const periodoLabel = useMemo(() => {
    try {
      const desde = format(new Date(fechaDesde), "d 'de' MMM yyyy", { locale: es });
      const hasta = format(new Date(fechaHasta), "d 'de' MMM yyyy", { locale: es });
      return `${desde} — ${hasta}`;
    } catch {
      return `${fechaDesde} — ${fechaHasta}`;
    }
  }, [fechaDesde, fechaHasta]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Spinner size="lg" />
        <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
          Consolidando datos de todos los modulos...
        </p>
      </div>
    );
  }

  // Error state
  if (isError || !informe) {
    return (
      <EmptyState
        icon={<FileBarChart className="w-12 h-12" />}
        title="Error al cargar el informe consolidado"
        description="No se pudieron obtener los datos de los modulos. Intenta nuevamente."
        action={{
          label: 'Reintentar',
          onClick: () => refetch(),
        }}
      />
    );
  }

  const { modulos, resumen_ejecutivo } = informe;

  return (
    <div className="space-y-6 print:space-y-4">
      {/* Header con controles */}
      <Card padding="sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-2">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <FileBarChart className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900 dark:text-white">
                Informe Gerencial — Revision por la Direccion
              </h2>
              <div className="flex items-center gap-2 mt-0.5">
                <Calendar className="w-3 h-3 text-gray-400" />
                <span className="text-xs text-gray-500 dark:text-gray-400">{periodoLabel}</span>
                {isFetching && (
                  <Badge variant="info" size="sm">
                    <RefreshCw className="w-3 h-3 animate-spin mr-1" />
                    Actualizando
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <DateRangePicker
              startDate={fechaDesde}
              endDate={fechaHasta}
              onChange={handleDateChange}
              startLabel="Desde"
              endLabel="Hasta"
            />
            <div className="flex items-center gap-2 print:hidden">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => refetch()}
                leftIcon={<RefreshCw className="w-4 h-4" />}
              >
                Actualizar
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handlePrint}
                leftIcon={<Printer className="w-4 h-4" />}
              >
                Imprimir
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleExportPDF}
                disabled={!selectedProgramacionId || exportPDFMutation.isPending}
                leftIcon={
                  exportPDFMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )
                }
              >
                {exportPDFMutation.isPending ? 'Generando...' : 'Exportar PDF'}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleEnviar}
                disabled={!selectedProgramacionId}
                leftIcon={<Mail className="w-4 h-4" />}
              >
                Enviar
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Resumen ejecutivo */}
      <ResumenEjecutivoCard modulos={modulos} resumen={resumen_ejecutivo} />

      {/* 15 secciones ISO en grid responsivo */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 print:grid-cols-2"
      >
        {/* §9.3.2a — Estado de acciones anteriores */}
        <motion.div variants={itemVariants}>
          <AccionesPreviasSection modulo={modulos.calidad_no_conformidades} />
        </motion.div>

        {/* §9.3.2b — Cambios en contexto */}
        <motion.div variants={itemVariants}>
          <ContextoSection modulo={modulos.contexto_organizacional} />
        </motion.div>

        {/* §9.3.2c — Cumplimiento legal */}
        <motion.div variants={itemVariants}>
          <CumplimientoSection modulo={modulos.cumplimiento_legal} />
        </motion.div>

        {/* §9.3.2c — Satisfacción del cliente */}
        <motion.div variants={itemVariants}>
          <SatisfaccionSection modulo={modulos.satisfaccion_cliente} />
        </motion.div>

        {/* §9.3.2c — Objetivos estratégicos */}
        <motion.div variants={itemVariants}>
          <ObjetivosSection modulo={modulos.planeacion_estrategica} />
        </motion.div>

        {/* §9.3.2c — No conformidades */}
        <motion.div variants={itemVariants}>
          <NoConformidadesSection modulo={modulos.calidad_no_conformidades} />
        </motion.div>

        {/* §9.3.2d — Auditorías */}
        <motion.div variants={itemVariants}>
          <AuditoriasSection modulo={modulos.auditorias_mejora_continua} />
        </motion.div>

        {/* §9.3.2e — Proveedores */}
        <motion.div variants={itemVariants}>
          <ProveedoresSection modulo={modulos.proveedores} />
        </motion.div>

        {/* §9.3.2e — Riesgos y oportunidades */}
        <motion.div variants={itemVariants}>
          <RiesgosSection modulo={modulos.riesgos_oportunidades} />
        </motion.div>

        {/* §9.3.2f — Talento humano */}
        <motion.div variants={itemVariants}>
          <RecursosHumanosSection modulo={modulos.talento_humano} />
        </motion.div>

        {/* §9.3.2f — Presupuesto */}
        <motion.div variants={itemVariants}>
          <PresupuestoSection modulo={modulos.presupuesto_recursos} />
        </motion.div>

        {/* §9.3.2f — Formación */}
        <motion.div variants={itemVariants}>
          <FormacionSection modulo={modulos.formacion_capacitacion} />
        </motion.div>

        {/* §9.3.2c — Accidentalidad SST */}
        <motion.div variants={itemVariants}>
          <AccidentalidadSection modulo={modulos.accidentalidad_sst} />
        </motion.div>

        {/* §9.3.2c — Gestión ambiental */}
        <motion.div variants={itemVariants}>
          <AmbientalSection modulo={modulos.gestion_ambiental} />
        </motion.div>

        {/* §9.3.2g — Participación de trabajadores */}
        <motion.div variants={itemVariants}>
          <ParticipacionSection modulo={modulos.gestion_comites} />
        </motion.div>
      </motion.div>

      {/* Selector de programación para export */}
      {programaciones.length > 0 && (
        <div className="print:hidden">
          <Card padding="sm">
            <div className="flex items-center gap-4 px-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                Programación para exportar:
              </span>
              <Select
                value={String(selectedProgramacionId || '')}
                onChange={(e) => setSelectedProgramacionId(Number(e.target.value) || null)}
                options={programaciones.map((p) => ({
                  value: String(p.id),
                  label: `${p.periodo} — ${format(new Date(p.fecha_programada), 'dd/MM/yyyy', { locale: es })}`,
                }))}
                placeholder="Seleccione una programación"
              />
            </div>
          </Card>
        </div>
      )}

      {/* Footer info */}
      <div className="text-center text-xs text-gray-400 dark:text-gray-500 py-4 print:py-2">
        Informe generado conforme a ISO 9001:2015, ISO 14001:2015, ISO 45001:2018 — Clausula 9.3
        <br />
        Sistema Integrado de Gestion StrateKaz
      </div>

      {/* Modal Enviar Informe por Correo */}
      {showEnviarModal && enviarActaId && (
        <EnviarInformeModal
          isOpen={showEnviarModal}
          onClose={() => {
            setShowEnviarModal(false);
            setEnviarActaId(null);
          }}
          actaId={enviarActaId}
          actaNumero={programaciones.find((p) => p.id === selectedProgramacionId)?.periodo || 'N/A'}
        />
      )}
    </div>
  );
}
