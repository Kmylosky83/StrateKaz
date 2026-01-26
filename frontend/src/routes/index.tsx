/**
 * Rutas del Sistema ERP - Estructura de 6 Niveles
 *
 * NIVEL 1 - Estratégico: Dirección Estratégica
 * NIVEL 2 - Cumplimiento: Cumplimiento, Riesgos, Workflows
 * NIVEL 3 - Torre de Control: Gestión HSEQ
 * NIVEL 4 - Cadena de Valor: Supply Chain, Producción, Logística, Ventas
 * NIVEL 5 - Habilitadores: Talento, Finanzas, Contabilidad
 * NIVEL 6 - Inteligencia: Analítica, Auditoría
 *
 * OPTIMIZADO: Code splitting con React.lazy() para reducir bundle inicial
 */
import { lazy, Suspense, ComponentType } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { LoginPage } from '@/pages/LoginPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { PageLoader } from '@/components/common/PageLoader';

// Helper para envolver componentes lazy con Suspense
const withSuspense = (Component: ComponentType) => (
  <Suspense fallback={<PageLoader />}>
    <Component />
  </Suspense>
);

// ==================== NIVEL 1: DIRECCIÓN ESTRATÉGICA ====================
// Importación directa de páginas para mejor tree-shaking y chunks más pequeños
const UsersPage = lazy(() => import('@/features/users/pages/UsersPage'));
const ConfiguracionPage = lazy(
  () => import('@/features/gestion-estrategica/pages/ConfiguracionPage')
);
const OrganizacionPage = lazy(
  () => import('@/features/gestion-estrategica/pages/OrganizacionPage')
);
const IdentidadPage = lazy(() => import('@/features/gestion-estrategica/pages/IdentidadPage'));
const PlaneacionPage = lazy(() => import('@/features/gestion-estrategica/pages/PlaneacionPage'));
const ProyectosPage = lazy(() => import('@/features/gestion-estrategica/pages/ProyectosPage'));
const RevisionDireccionPage = lazy(
  () => import('@/features/gestion-estrategica/pages/RevisionDireccionPage')
);
const ContextoPage = lazy(
  () => import('@/features/gestion-estrategica/pages/ContextoPage')
);

// Soporte Estratégico (nuevo módulo)
const GestionDocumentalPage = lazy(
  () => import('@/features/soporte-estrategico/pages/GestionDocumentalPage')
);
const PlanificacionSistemaPageNueva = lazy(
  () => import('@/features/soporte-estrategico/pages/PlanificacionSistemaPage')
);

// ==================== NIVEL 2: CUMPLIMIENTO ====================
// Motor de Cumplimiento
const MatrizLegalPage = lazy(() =>
  import('@/features/cumplimiento').then((m) => ({ default: m.MatrizLegalPage }))
);
const RequisitosLegalesPage = lazy(() =>
  import('@/features/cumplimiento').then((m) => ({ default: m.RequisitosLegalesPage }))
);
const PartesInteresadasPage = lazy(() =>
  import('@/features/cumplimiento').then((m) => ({ default: m.PartesInteresadasPage }))
);
const ReglamentosInternosPage = lazy(() =>
  import('@/features/cumplimiento').then((m) => ({ default: m.ReglamentosInternosPage }))
);

// Motor de Riesgos
const RiesgosProcesosPage = lazy(() =>
  import('@/features/riesgos').then((m) => ({ default: m.RiesgosProcesosPage }))
);
const IPEVRPage = lazy(() => import('@/features/riesgos').then((m) => ({ default: m.IPEVRPage })));
const AspectosAmbientalesPage = lazy(() =>
  import('@/features/riesgos').then((m) => ({ default: m.AspectosAmbientalesPage }))
);
const RiesgosVialesPage = lazy(() =>
  import('@/features/riesgos').then((m) => ({ default: m.RiesgosVialesPage }))
);
const SagrilaftPteePage = lazy(() =>
  import('@/features/riesgos').then((m) => ({ default: m.SagrilaftPteePage }))
);
const SeguridadInformacionPage = lazy(() =>
  import('@/features/riesgos').then((m) => ({ default: m.SeguridadInformacionPage }))
);

// Workflows Engine
const DisenadorFlujosPage = lazy(() =>
  import('@/features/workflows').then((m) => ({ default: m.DisenadorFlujosPage }))
);
const EjecucionPage = lazy(() =>
  import('@/features/workflows').then((m) => ({ default: m.EjecucionPage }))
);
const MonitoreoPage = lazy(() =>
  import('@/features/workflows').then((m) => ({ default: m.MonitoreoPage }))
);

// ==================== NIVEL 3: TORRE DE CONTROL (HSEQ) ====================
const HSEQPage = lazy(() => import('@/features/hseq').then((m) => ({ default: m.HSEQPage })));
const SistemaDocumentalPage = lazy(() =>
  import('@/features/hseq').then((m) => ({ default: m.SistemaDocumentalPage }))
);
const PlanificacionSistemaPage = lazy(() =>
  import('@/features/hseq').then((m) => ({ default: m.PlanificacionSistemaPage }))
);
const CalidadPage = lazy(() => import('@/features/hseq').then((m) => ({ default: m.CalidadPage })));
const MedicinaLaboralPage = lazy(() =>
  import('@/features/hseq').then((m) => ({ default: m.MedicinaLaboralPage }))
);
const SeguridadIndustrialPage = lazy(() =>
  import('@/features/hseq').then((m) => ({ default: m.SeguridadIndustrialPage }))
);
const HigieneIndustrialPage = lazy(() =>
  import('@/features/hseq').then((m) => ({ default: m.HigieneIndustrialPage }))
);
const GestionComitesPage = lazy(() =>
  import('@/features/hseq').then((m) => ({ default: m.GestionComitesPage }))
);
const AccidentalidadPage = lazy(() =>
  import('@/features/hseq').then((m) => ({ default: m.AccidentalidadPage }))
);
const EmergenciasPage = lazy(() =>
  import('@/features/hseq').then((m) => ({ default: m.EmergenciasPage }))
);
const GestionAmbientalPage = lazy(() =>
  import('@/features/hseq').then((m) => ({ default: m.GestionAmbientalPage }))
);
const MejoraContinuaPage = lazy(() =>
  import('@/features/hseq').then((m) => ({ default: m.MejoraContinuaPage }))
);

// ==================== NIVEL 4: CADENA DE VALOR ====================
// Operaciones de Producción
const ProductionOpsPage = lazy(() => import('@/features/production-ops/pages/ProductionOpsPage'));

// Logística y Flota
const LogisticsFleetPage = lazy(
  () => import('@/features/logistics-fleet/pages/LogisticsFleetPage')
);

// Supply Chain (Proveedores legacy → será refactorizado a supply_chain)
const MateriaPrimaPage = lazy(() => import('@/features/proveedores/pages/MateriaPrimaPage'));
const ProductosServiciosPage = lazy(
  () => import('@/features/proveedores/pages/ProductosServiciosPage')
);
const PruebasAcidezPage = lazy(() => import('@/features/proveedores/pages/PruebasAcidezPage'));

// Sales & CRM
const ClientesPage = lazy(() =>
  import('@/features/sales-crm').then((m) => ({ default: m.ClientesPage }))
);
const PipelinePage = lazy(() =>
  import('@/features/sales-crm').then((m) => ({ default: m.PipelinePage }))
);
const CotizacionesPage = lazy(() =>
  import('@/features/sales-crm').then((m) => ({ default: m.CotizacionesPage }))
);
const PedidosPage = lazy(() =>
  import('@/features/sales-crm').then((m) => ({ default: m.PedidosPage }))
);
const FacturasPage = lazy(() =>
  import('@/features/sales-crm').then((m) => ({ default: m.FacturasPage }))
);
const PQRSPage = lazy(() => import('@/features/sales-crm').then((m) => ({ default: m.PQRSPage })));
const EncuestasPage = lazy(() =>
  import('@/features/sales-crm').then((m) => ({ default: m.EncuestasPage }))
);
const FidelizacionPage = lazy(() =>
  import('@/features/sales-crm').then((m) => ({ default: m.FidelizacionPage }))
);

// ==================== NIVEL 5: HABILITADORES ====================
// Centro de Talento (Talent Hub)
const TalentHubPage = lazy(() =>
  import('@/features/talent-hub').then((m) => ({ default: m.TalentHubPage }))
);

// Administración y Finanzas
const TesoreriaPage = lazy(() =>
  import('@/features/admin-finance').then((m) => ({ default: m.TesoreriaPage }))
);
const PresupuestoPage = lazy(() =>
  import('@/features/admin-finance').then((m) => ({ default: m.PresupuestoPage }))
);
const ActivosFijosPage = lazy(() =>
  import('@/features/admin-finance').then((m) => ({ default: m.ActivosFijosPage }))
);
const ServiciosGeneralesPage = lazy(() =>
  import('@/features/admin-finance').then((m) => ({ default: m.ServiciosGeneralesPage }))
);

// Contabilidad (Módulo Activable)
const ConfigContablePage = lazy(() =>
  import('@/features/accounting').then((m) => ({ default: m.ConfigContablePage }))
);
const MovimientosContablesPage = lazy(() =>
  import('@/features/accounting').then((m) => ({ default: m.MovimientosContablesPage }))
);
const InformesContablesPage = lazy(() =>
  import('@/features/accounting').then((m) => ({ default: m.InformesContablesPage }))
);
const IntegracionContablePage = lazy(() =>
  import('@/features/accounting').then((m) => ({ default: m.IntegracionContablePage }))
);

// ==================== NIVEL 6: INTELIGENCIA ====================
// Analítica
const ConfigIndicadoresPage = lazy(() =>
  import('@/features/analytics').then((m) => ({ default: m.ConfigIndicadoresPage }))
);
const DashboardGerencialPage = lazy(() =>
  import('@/features/analytics').then((m) => ({ default: m.DashboardGerencialPage }))
);
const IndicadoresAreaPage = lazy(() =>
  import('@/features/analytics').then((m) => ({ default: m.IndicadoresAreaPage }))
);
const AnalisisTendenciasPage = lazy(() =>
  import('@/features/analytics').then((m) => ({ default: m.AnalisisTendenciasPage }))
);
const GeneradorInformesPage = lazy(() =>
  import('@/features/analytics').then((m) => ({ default: m.GeneradorInformesPage }))
);
const AccionesIndicadorPage = lazy(() =>
  import('@/features/analytics').then((m) => ({ default: m.AccionesIndicadorPage }))
);
const ExportacionPage = lazy(() =>
  import('@/features/analytics').then((m) => ({ default: m.ExportacionPage }))
);
const AnalyticsDemoPage = lazy(() =>
  import('@/features/analytics').then((m) => ({ default: m.AnalyticsDemoPage }))
);

// Sistema de Auditoría
const LogsSistemaPage = lazy(() =>
  import('@/features/audit-system').then((m) => ({ default: m.LogsSistemaPage }))
);
const NotificacionesPage = lazy(() =>
  import('@/features/audit-system').then((m) => ({ default: m.NotificacionesPage }))
);
const AlertasPage = lazy(() =>
  import('@/features/audit-system').then((m) => ({ default: m.AlertasPage }))
);
const TareasPage = lazy(() =>
  import('@/features/audit-system').then((m) => ({ default: m.TareasPage }))
);

// ==================== PERFIL DE USUARIO ====================
const PerfilPage = lazy(() => import('@/features/perfil').then((m) => ({ default: m.PerfilPage })));
const SeguridadPage = lazy(() =>
  import('@/features/perfil').then((m) => ({ default: m.SeguridadPage }))
);
const PreferenciasPage = lazy(() =>
  import('@/features/perfil').then((m) => ({ default: m.PreferenciasPage }))
);

export const AppRoutes = () => {
  return (
    <Routes>
      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* RUTAS PÚBLICAS */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <Route path="/login" element={<LoginPage />} />

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* RUTAS PROTEGIDAS */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* DASHBOARD PRINCIPAL - Página de inicio post-login */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          <Route path="/dashboard" element={<DashboardPage />} />

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* PERFIL DE USUARIO */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          <Route path="/perfil" element={withSuspense(PerfilPage)} />
          <Route path="/perfil/seguridad" element={withSuspense(SeguridadPage)} />
          <Route path="/perfil/preferencias" element={withSuspense(PreferenciasPage)} />

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* NIVEL 1: DIRECCIÓN ESTRATÉGICA */}
          {/* Código: Gestion_Estrategica */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          <Route
            path="/gestion-estrategica"
            element={<Navigate to="/gestion-estrategica/configuracion" replace />}
          />

          {/* Tab 1: Configuración */}
          <Route
            path="/gestion-estrategica/configuracion"
            element={withSuspense(ConfiguracionPage)}
          />

          {/* Tab 2: Organización */}
          <Route
            path="/gestion-estrategica/organizacion"
            element={withSuspense(OrganizacionPage)}
          />

          {/* Tab 3: Identidad Corporativa */}
          <Route path="/gestion-estrategica/identidad" element={withSuspense(IdentidadPage)} />

          {/* Tab 4: Planeación Estratégica */}
          <Route path="/gestion-estrategica/planeacion" element={withSuspense(PlaneacionPage)} />
          {/* Tab 4b: Contexto Organizacional (DOFA/PESTEL/Porter/TOWS) */}
          <Route
            path="/gestion-estrategica/contexto"
            element={withSuspense(ContextoPage)}
          />

          {/* Tab 5: Gestión de Proyectos (PMI) */}
          <Route path="/gestion-estrategica/proyectos" element={withSuspense(ProyectosPage)} />

          {/* Tab 6: Revisión por Dirección (ISO 9.3) */}
          <Route
            path="/gestion-estrategica/revision-direccion"
            element={withSuspense(RevisionDireccionPage)}
          />

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* MÓDULO: SOPORTE ESTRATÉGICO (soporte_estrategico) */}
          {/* Gestión Documental y Planificación del Sistema */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          <Route
            path="/soporte-estrategico"
            element={<Navigate to="/soporte-estrategico/gestion-documental" replace />}
          />
          <Route
            path="/soporte-estrategico/gestion-documental"
            element={withSuspense(GestionDocumentalPage)}
          />
          <Route
            path="/soporte-estrategico/planificacion-sistema"
            element={withSuspense(PlanificacionSistemaPageNueva)}
          />

          {/* Usuarios - Módulo transversal dentro de Dirección Estratégica */}
          <Route path="/usuarios" element={withSuspense(UsersPage)} />

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* NIVEL 2: CUMPLIMIENTO */}
          {/* ═══════════════════════════════════════════════════════════════ */}

          {/* Módulo: Motor de Cumplimiento (motor_cumplimiento) */}
          <Route path="/cumplimiento" element={<Navigate to="/cumplimiento/matriz-legal" replace />} />
          <Route path="/cumplimiento/matriz-legal" element={withSuspense(MatrizLegalPage)} />
          <Route
            path="/cumplimiento/requisitos-legales"
            element={withSuspense(RequisitosLegalesPage)}
          />
          <Route
            path="/cumplimiento/partes-interesadas"
            element={withSuspense(PartesInteresadasPage)}
          />
          <Route
            path="/cumplimiento/reglamentos-internos"
            element={withSuspense(ReglamentosInternosPage)}
          />

          {/* Módulo: Motor de Riesgos (motor_riesgos) */}
          {/* NOTA: contexto_organizacional en /gestion-estrategica/contexto */}
          <Route path="/riesgos" element={<Navigate to="/riesgos/procesos" replace />} />
          <Route path="/riesgos/procesos" element={withSuspense(RiesgosProcesosPage)} />
          <Route path="/riesgos/ipevr" element={withSuspense(IPEVRPage)} />
          <Route path="/riesgos/ambientales" element={withSuspense(AspectosAmbientalesPage)} />
          <Route path="/riesgos/viales" element={withSuspense(RiesgosVialesPage)} />
          <Route path="/riesgos/sagrilaft" element={withSuspense(SagrilaftPteePage)} />
          <Route path="/riesgos/seguridad-info" element={withSuspense(SeguridadInformacionPage)} />

          {/* Módulo: Flujos de Trabajo (workflow_engine) */}
          <Route path="/workflows" element={<Navigate to="/workflows/disenador" replace />} />
          <Route path="/workflows/disenador" element={withSuspense(DisenadorFlujosPage)} />
          <Route path="/workflows/ejecucion" element={withSuspense(EjecucionPage)} />
          <Route path="/workflows/monitoreo" element={withSuspense(MonitoreoPage)} />

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* NIVEL 3: TORRE DE CONTROL (HSEQ MANAGEMENT) */}
          {/* Código: hseq_management - Rutas definidas desde BD via seed */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          <Route path="/hseq" element={<Navigate to="/hseq/sistema-documental" replace />} />
          <Route path="/hseq/dashboard" element={withSuspense(HSEQPage)} />

          {/* Tab 1: Sistema Documental */}
          <Route path="/hseq/sistema-documental" element={withSuspense(SistemaDocumentalPage)} />

          {/* Tab 2: Planificación Sistema */}
          <Route path="/hseq/planificacion" element={withSuspense(PlanificacionSistemaPage)} />

          {/* Tab 3: Calidad */}
          <Route path="/hseq/calidad" element={withSuspense(CalidadPage)} />

          {/* Tab 4: Medicina Laboral */}
          <Route path="/hseq/medicina-laboral" element={withSuspense(MedicinaLaboralPage)} />

          {/* Tab 5: Seguridad Industrial */}
          <Route
            path="/hseq/seguridad-industrial"
            element={withSuspense(SeguridadIndustrialPage)}
          />

          {/* Tab 6: Higiene Industrial */}
          <Route path="/hseq/higiene-industrial" element={withSuspense(HigieneIndustrialPage)} />

          {/* Tab 7: Gestión de Comités */}
          <Route path="/hseq/comites" element={withSuspense(GestionComitesPage)} />

          {/* Tab 8: Accidentalidad (ATEL) */}
          <Route path="/hseq/accidentalidad" element={withSuspense(AccidentalidadPage)} />

          {/* Tab 9: Emergencias */}
          <Route path="/hseq/emergencias" element={withSuspense(EmergenciasPage)} />

          {/* Tab 10: Gestión Ambiental */}
          <Route path="/hseq/gestion-ambiental" element={withSuspense(GestionAmbientalPage)} />

          {/* Tab 11: Mejora Continua */}
          <Route path="/hseq/mejora-continua" element={withSuspense(MejoraContinuaPage)} />

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* NIVEL 4: CADENA DE VALOR */}
          {/* ═══════════════════════════════════════════════════════════════ */}

          {/* Módulo: Cadena de Suministro (supply_chain) */}
          {/* NOTA: proveedores/ y econorte/ son legacy, serán refactorizados */}

          {/* Proveedores (legacy - temporal hasta refactor) */}
          <Route
            path="/proveedores"
            element={<Navigate to="/proveedores/materia-prima" replace />}
          />
          <Route path="/proveedores/materia-prima" element={withSuspense(MateriaPrimaPage)} />
          <Route
            path="/proveedores/productos-servicios"
            element={withSuspense(ProductosServiciosPage)}
          />
          <Route path="/proveedores/programacion" element={withSuspense(MateriaPrimaPage)} />
          <Route path="/proveedores/compras" element={withSuspense(MateriaPrimaPage)} />
          <Route path="/proveedores/almacenamiento" element={withSuspense(MateriaPrimaPage)} />
          <Route path="/proveedores/pruebas-acidez" element={withSuspense(PruebasAcidezPage)} />

          {/* Módulo: Operaciones de Producción (production_ops) */}
          <Route path="/produccion" element={<Navigate to="/produccion/recepcion" replace />} />
          <Route path="/produccion/recepcion" element={withSuspense(ProductionOpsPage)} />
          <Route path="/produccion/procesamiento" element={withSuspense(ProductionOpsPage)} />
          <Route path="/produccion/mantenimiento" element={withSuspense(ProductionOpsPage)} />
          <Route path="/produccion/producto-terminado" element={withSuspense(ProductionOpsPage)} />

          {/* Módulo: Logística y Flota (logistics_fleet) */}
          <Route path="/logistica" element={<Navigate to="/logistica/transporte" replace />} />
          <Route path="/logistica/transporte" element={withSuspense(LogisticsFleetPage)} />
          <Route path="/logistica/despachos" element={withSuspense(LogisticsFleetPage)} />
          <Route path="/logistica/flota" element={withSuspense(LogisticsFleetPage)} />
          <Route path="/logistica/pesv" element={withSuspense(LogisticsFleetPage)} />

          {/* Módulo: Ventas y CRM (sales_crm) */}
          <Route path="/ventas" element={<Navigate to="/ventas/clientes" replace />} />
          {/* Tab 1: Gestión de Clientes */}
          <Route path="/ventas/clientes" element={withSuspense(ClientesPage)} />
          {/* Tab 2: Pipeline de Ventas */}
          <Route path="/ventas/pipeline" element={withSuspense(PipelinePage)} />
          {/* Tab 3: Cotizaciones */}
          <Route path="/ventas/cotizaciones" element={withSuspense(CotizacionesPage)} />
          {/* Tab 4: Pedidos */}
          <Route path="/ventas/pedidos" element={withSuspense(PedidosPage)} />
          {/* Tab 5: Facturas */}
          <Route path="/ventas/facturas" element={withSuspense(FacturasPage)} />
          {/* Tab 6: PQRS */}
          <Route path="/ventas/pqrs" element={withSuspense(PQRSPage)} />
          {/* Tab 7: Encuestas NPS */}
          <Route path="/ventas/encuestas" element={withSuspense(EncuestasPage)} />
          {/* Tab 8: Fidelización */}
          <Route path="/ventas/fidelizacion" element={withSuspense(FidelizacionPage)} />

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* NIVEL 5: HABILITADORES */}
          {/* ═══════════════════════════════════════════════════════════════ */}

          {/* Módulo: Talent Hub - Gestión del Talento Humano */}
          <Route path="/talento" element={<Navigate to="/talento/estructura" replace />} />
          <Route path="/talento/estructura" element={withSuspense(TalentHubPage)} />
          <Route path="/talento/seleccion" element={withSuspense(TalentHubPage)} />
          <Route path="/talento/colaboradores" element={withSuspense(TalentHubPage)} />
          <Route path="/talento/onboarding" element={withSuspense(TalentHubPage)} />
          <Route path="/talento/formacion" element={withSuspense(TalentHubPage)} />
          <Route path="/talento/desempeno" element={withSuspense(TalentHubPage)} />
          <Route path="/talento/control-tiempo" element={withSuspense(TalentHubPage)} />
          <Route path="/talento/novedades" element={withSuspense(TalentHubPage)} />
          <Route path="/talento/disciplinario" element={withSuspense(TalentHubPage)} />
          <Route path="/talento/nomina" element={withSuspense(TalentHubPage)} />
          <Route path="/talento/off-boarding" element={withSuspense(TalentHubPage)} />

          {/* Módulo: Administración y Finanzas (admin_finance) */}
          <Route path="/finanzas" element={<Navigate to="/finanzas/tesoreria" replace />} />
          <Route path="/finanzas/tesoreria" element={withSuspense(TesoreriaPage)} />
          <Route path="/finanzas/presupuesto" element={withSuspense(PresupuestoPage)} />
          <Route path="/finanzas/activos-fijos" element={withSuspense(ActivosFijosPage)} />
          <Route
            path="/finanzas/servicios-generales"
            element={withSuspense(ServiciosGeneralesPage)}
          />

          {/* Módulo: Contabilidad (accounting) - MÓDULO ACTIVABLE */}
          <Route path="/contabilidad" element={<Navigate to="/contabilidad/configuracion" replace />} />
          <Route path="/contabilidad/configuracion" element={withSuspense(ConfigContablePage)} />
          <Route
            path="/contabilidad/movimientos"
            element={withSuspense(MovimientosContablesPage)}
          />
          <Route path="/contabilidad/informes" element={withSuspense(InformesContablesPage)} />
          <Route path="/contabilidad/integracion" element={withSuspense(IntegracionContablePage)} />

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* NIVEL 6: INTELIGENCIA */}
          {/* ═══════════════════════════════════════════════════════════════ */}

          {/* Módulo: Analítica (analytics) */}
          <Route path="/analytics" element={<Navigate to="/analytics/configuracion" replace />} />

          {/* Semana 23 - Configuración e Indicadores */}
          <Route path="/analytics/configuracion" element={withSuspense(ConfigIndicadoresPage)} />
          <Route path="/analytics/dashboards" element={withSuspense(DashboardGerencialPage)} />
          <Route path="/analytics/indicadores" element={withSuspense(IndicadoresAreaPage)} />

          {/* Semana 24 - Análisis, Informes, Acciones y Exportación */}
          <Route path="/analytics/analisis" element={withSuspense(AnalisisTendenciasPage)} />
          <Route path="/analytics/informes" element={withSuspense(GeneradorInformesPage)} />
          <Route path="/analytics/acciones" element={withSuspense(AccionesIndicadorPage)} />
          <Route path="/analytics/exportacion" element={withSuspense(ExportacionPage)} />

          {/* Demo: Componentes Enterprise de Analytics */}
          <Route path="/analytics/demo" element={withSuspense(AnalyticsDemoPage)} />

          {/* Módulo: Sistema de Auditoría (audit_system) */}
          <Route path="/auditoria" element={<Navigate to="/auditoria/logs" replace />} />

          {/* Semana 25 - Sistema de Auditoría */}
          <Route path="/auditoria/logs" element={withSuspense(LogsSistemaPage)} />
          <Route path="/auditoria/notificaciones" element={withSuspense(NotificacionesPage)} />
          <Route path="/auditoria/alertas" element={withSuspense(AlertasPage)} />
          <Route path="/auditoria/tareas" element={withSuspense(TareasPage)} />

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* RUTAS LEGACY - DEPRECADAS (Mantener temporalmente para compatibilidad) */}
          {/* ═══════════════════════════════════════════════════════════════ */}

          {/* Redirigir rutas antiguas a nuevas ubicaciones */}
          <Route path="/motor-operaciones/*" element={<Navigate to="/proveedores" replace />} />
          <Route path="/gestion-integral/*" element={<Navigate to="/hseq" replace />} />
          <Route path="/cadena-valor/*" element={<Navigate to="/proveedores" replace />} />
          <Route path="/procesos-apoyo/*" element={<Navigate to="/talento" replace />} />
          <Route path="/inteligencia/*" element={<Navigate to="/analitica" replace />} />
          <Route path="/sst/*" element={<Navigate to="/hseq" replace />} />
          <Route path="/reportes" element={<Navigate to="/analitica" replace />} />
        </Route>
      </Route>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* REDIRECT RAÍZ Y 404 */}
      {/* ═══════════════════════════════════════════════════════════════ */}

      {/* Ruta raíz redirige al dashboard */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};
