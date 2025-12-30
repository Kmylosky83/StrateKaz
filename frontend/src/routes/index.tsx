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
import { SmartRedirect } from '@/components/common/SmartRedirect';
import { PageLoader } from '@/components/common/PageLoader';

// Helper para envolver componentes lazy con Suspense
const withSuspense = (Component: ComponentType) => (
  <Suspense fallback={<PageLoader />}>
    <Component />
  </Suspense>
);

// ==================== NIVEL 1: DIRECCIÓN ESTRATÉGICA ====================
const UsersPage = lazy(() => import('@/features/users/pages/UsersPage'));
const ConfiguracionPage = lazy(() => import('@/features/gestion-estrategica').then(m => ({ default: m.ConfiguracionPage })));
const OrganizacionPage = lazy(() => import('@/features/gestion-estrategica').then(m => ({ default: m.OrganizacionPage })));
const IdentidadPage = lazy(() => import('@/features/gestion-estrategica').then(m => ({ default: m.IdentidadPage })));
const PlaneacionPage = lazy(() => import('@/features/gestion-estrategica').then(m => ({ default: m.PlaneacionPage })));
const ProyectosPage = lazy(() => import('@/features/gestion-estrategica').then(m => ({ default: m.ProyectosPage })));
const RevisionDireccionPage = lazy(() => import('@/features/gestion-estrategica').then(m => ({ default: m.RevisionDireccionPage })));

// ==================== NIVEL 2: CUMPLIMIENTO ====================
// Motor de Riesgos
const RiesgosPage = lazy(() => import('@/features/riesgos').then(m => ({ default: m.RiesgosPage })));
const ContextoOrganizacionalPage = lazy(() => import('@/features/riesgos').then(m => ({ default: m.ContextoOrganizacionalPage })));
const RiesgosProcesosPage = lazy(() => import('@/features/riesgos').then(m => ({ default: m.RiesgosProcesosPage })));
const IPEVRPage = lazy(() => import('@/features/riesgos').then(m => ({ default: m.IPEVRPage })));
const AspectosAmbientalesPage = lazy(() => import('@/features/riesgos').then(m => ({ default: m.AspectosAmbientalesPage })));
const RiesgosVialesPage = lazy(() => import('@/features/riesgos').then(m => ({ default: m.RiesgosVialesPage })));
const SagrilaftPteePage = lazy(() => import('@/features/riesgos').then(m => ({ default: m.SagrilaftPteePage })));
const SeguridadInformacionPage = lazy(() => import('@/features/riesgos').then(m => ({ default: m.SeguridadInformacionPage })));

// Workflows Engine
const WorkflowsPage = lazy(() => import('@/features/workflows').then(m => ({ default: m.WorkflowsPage })));
const DisenadorFlujosPage = lazy(() => import('@/features/workflows').then(m => ({ default: m.DisenadorFlujosPage })));
const EjecucionPage = lazy(() => import('@/features/workflows').then(m => ({ default: m.EjecucionPage })));
const MonitoreoPage = lazy(() => import('@/features/workflows').then(m => ({ default: m.MonitoreoPage })));

// ==================== NIVEL 3: TORRE DE CONTROL (HSEQ) ====================
const HSEQPage = lazy(() => import('@/features/hseq').then(m => ({ default: m.HSEQPage })));
const SistemaDocumentalPage = lazy(() => import('@/features/hseq').then(m => ({ default: m.SistemaDocumentalPage })));
const PlanificacionSistemaPage = lazy(() => import('@/features/hseq').then(m => ({ default: m.PlanificacionSistemaPage })));
const CalidadPage = lazy(() => import('@/features/hseq').then(m => ({ default: m.CalidadPage })));
const MedicinaLaboralPage = lazy(() => import('@/features/hseq').then(m => ({ default: m.MedicinaLaboralPage })));
const SeguridadIndustrialPage = lazy(() => import('@/features/hseq').then(m => ({ default: m.SeguridadIndustrialPage })));
const HigieneIndustrialPage = lazy(() => import('@/features/hseq').then(m => ({ default: m.HigieneIndustrialPage })));
const GestionComitesPage = lazy(() => import('@/features/hseq').then(m => ({ default: m.GestionComitesPage })));
const AccidentalidadPage = lazy(() => import('@/features/hseq').then(m => ({ default: m.AccidentalidadPage })));
const EmergenciasPage = lazy(() => import('@/features/hseq').then(m => ({ default: m.EmergenciasPage })));
const GestionAmbientalPage = lazy(() => import('@/features/hseq').then(m => ({ default: m.GestionAmbientalPage })));
const MejoraContinuaPage = lazy(() => import('@/features/hseq').then(m => ({ default: m.MejoraContinuaPage })));

// ==================== NIVEL 4: CADENA DE VALOR ====================
// Supply Chain (Proveedores legacy → será refactorizado a supply_chain)
const MateriaPrimaPage = lazy(() => import('@/features/proveedores/pages/MateriaPrimaPage'));
const ProductosServiciosPage = lazy(() => import('@/features/proveedores/pages/ProductosServiciosPage'));
const PruebasAcidezPage = lazy(() => import('@/features/proveedores/pages/PruebasAcidezPage'));

// Sales & CRM
const ClientesPage = lazy(() => import('@/features/sales-crm').then(m => ({ default: m.ClientesPage })));
const PipelinePage = lazy(() => import('@/features/sales-crm').then(m => ({ default: m.PipelinePage })));
const CotizacionesPage = lazy(() => import('@/features/sales-crm').then(m => ({ default: m.CotizacionesPage })));
const PedidosPage = lazy(() => import('@/features/sales-crm').then(m => ({ default: m.PedidosPage })));
const FacturasPage = lazy(() => import('@/features/sales-crm').then(m => ({ default: m.FacturasPage })));
const PQRSPage = lazy(() => import('@/features/sales-crm').then(m => ({ default: m.PQRSPage })));
const EncuestasPage = lazy(() => import('@/features/sales-crm').then(m => ({ default: m.EncuestasPage })));
const FidelizacionPage = lazy(() => import('@/features/sales-crm').then(m => ({ default: m.FidelizacionPage })));

// ==================== NIVEL 5: HABILITADORES ====================
// Centro de Talento (Talent Hub)
const TalentHubPage = lazy(() => import('@/features/talent-hub').then(m => ({ default: m.TalentHubPage })));

// Administración y Finanzas
const AdminFinancePage = lazy(() => import('@/features/admin-finance').then(m => ({ default: m.AdminFinancePage })));
const TesoreriaPage = lazy(() => import('@/features/admin-finance').then(m => ({ default: m.TesoreriaPage })));
const PresupuestoPage = lazy(() => import('@/features/admin-finance').then(m => ({ default: m.PresupuestoPage })));
const ActivosFijosPage = lazy(() => import('@/features/admin-finance').then(m => ({ default: m.ActivosFijosPage })));
const ServiciosGeneralesPage = lazy(() => import('@/features/admin-finance').then(m => ({ default: m.ServiciosGeneralesPage })));

// Contabilidad (Módulo Activable)
const AccountingPage = lazy(() => import('@/features/accounting').then(m => ({ default: m.AccountingPage })));
const ConfigContablePage = lazy(() => import('@/features/accounting').then(m => ({ default: m.ConfigContablePage })));
const MovimientosContablesPage = lazy(() => import('@/features/accounting').then(m => ({ default: m.MovimientosContablesPage })));
const InformesContablesPage = lazy(() => import('@/features/accounting').then(m => ({ default: m.InformesContablesPage })));
const IntegracionContablePage = lazy(() => import('@/features/accounting').then(m => ({ default: m.IntegracionContablePage })));

// ==================== NIVEL 6: INTELIGENCIA ====================
// Analítica
const AnalyticsPage = lazy(() => import('@/features/analytics').then(m => ({ default: m.AnalyticsPage })));
const ConfigIndicadoresPage = lazy(() => import('@/features/analytics').then(m => ({ default: m.ConfigIndicadoresPage })));
const DashboardGerencialPage = lazy(() => import('@/features/analytics').then(m => ({ default: m.DashboardGerencialPage })));
const IndicadoresAreaPage = lazy(() => import('@/features/analytics').then(m => ({ default: m.IndicadoresAreaPage })));
const AnalisisTendenciasPage = lazy(() => import('@/features/analytics').then(m => ({ default: m.AnalisisTendenciasPage })));
const GeneradorInformesPage = lazy(() => import('@/features/analytics').then(m => ({ default: m.GeneradorInformesPage })));
const AccionesIndicadorPage = lazy(() => import('@/features/analytics').then(m => ({ default: m.AccionesIndicadorPage })));
const ExportacionPage = lazy(() => import('@/features/analytics').then(m => ({ default: m.ExportacionPage })));

// Sistema de Auditoría
const AuditSystemPage = lazy(() => import('@/features/audit-system').then(m => ({ default: m.AuditSystemPage })));
const LogsSistemaPage = lazy(() => import('@/features/audit-system').then(m => ({ default: m.LogsSistemaPage })));
const NotificacionesPage = lazy(() => import('@/features/audit-system').then(m => ({ default: m.NotificacionesPage })));
const AlertasPage = lazy(() => import('@/features/audit-system').then(m => ({ default: m.AlertasPage })));
const TareasPage = lazy(() => import('@/features/audit-system').then(m => ({ default: m.TareasPage })));

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
          {/* NIVEL 1: DIRECCIÓN ESTRATÉGICA */}
          {/* Código: Gestion_Estrategica */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          <Route
            path="/gestion-estrategica"
            element={<Navigate to="/gestion-estrategica/configuracion" replace />}
          />

          {/* Tab 1: Configuración */}
          <Route path="/gestion-estrategica/configuracion" element={withSuspense(ConfiguracionPage)} />

          {/* Tab 2: Organización */}
          <Route path="/gestion-estrategica/organizacion" element={withSuspense(OrganizacionPage)} />

          {/* Tab 3: Identidad Corporativa */}
          <Route path="/gestion-estrategica/identidad" element={withSuspense(IdentidadPage)} />

          {/* Tab 4: Planeación Estratégica */}
          <Route path="/gestion-estrategica/planeacion" element={withSuspense(PlaneacionPage)} />

          {/* Tab 5: Gestión de Proyectos (PMI) */}
          <Route path="/gestion-estrategica/proyectos" element={withSuspense(ProyectosPage)} />

          {/* Tab 6: Revisión por Dirección (ISO 9.3) */}
          <Route path="/gestion-estrategica/revision-direccion" element={withSuspense(RevisionDireccionPage)} />

          {/* Usuarios - Módulo transversal dentro de Dirección Estratégica */}
          <Route path="/usuarios" element={withSuspense(UsersPage)} />

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* NIVEL 2: CUMPLIMIENTO */}
          {/* ═══════════════════════════════════════════════════════════════ */}

          {/* Módulo: Motor de Cumplimiento (motor_cumplimiento) - Próximamente */}
          <Route
            path="/cumplimiento"
            element={<div className="p-8 text-center text-gray-500">Motor de Cumplimiento - Próximamente</div>}
          />
          <Route
            path="/cumplimiento/matriz-legal"
            element={<div className="p-8 text-center text-gray-500">Matriz Legal - Próximamente</div>}
          />
          <Route
            path="/cumplimiento/requisitos-legales"
            element={<div className="p-8 text-center text-gray-500">Requisitos Legales - Próximamente</div>}
          />
          <Route
            path="/cumplimiento/partes-interesadas"
            element={<div className="p-8 text-center text-gray-500">Partes Interesadas - Próximamente</div>}
          />
          <Route
            path="/cumplimiento/reglamentos-internos"
            element={<div className="p-8 text-center text-gray-500">Reglamentos Internos - Próximamente</div>}
          />

          {/* Módulo: Motor de Riesgos (motor_riesgos) */}
          <Route
            path="/riesgos"
            element={withSuspense(RiesgosPage)}
          />
          <Route path="/riesgos/contexto" element={withSuspense(ContextoOrganizacionalPage)} />
          <Route path="/riesgos/procesos" element={withSuspense(RiesgosProcesosPage)} />
          <Route path="/riesgos/ipevr" element={withSuspense(IPEVRPage)} />
          <Route path="/riesgos/ambientales" element={withSuspense(AspectosAmbientalesPage)} />
          <Route path="/riesgos/viales" element={withSuspense(RiesgosVialesPage)} />
          <Route path="/riesgos/sagrilaft" element={withSuspense(SagrilaftPteePage)} />
          <Route path="/riesgos/seguridad-info" element={withSuspense(SeguridadInformacionPage)} />

          {/* Módulo: Flujos de Trabajo (workflow_engine) */}
          <Route path="/workflows" element={withSuspense(WorkflowsPage)} />
          <Route path="/workflows/disenador" element={withSuspense(DisenadorFlujosPage)} />
          <Route path="/workflows/ejecucion" element={withSuspense(EjecucionPage)} />
          <Route path="/workflows/monitoreo" element={withSuspense(MonitoreoPage)} />

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* NIVEL 3: TORRE DE CONTROL (HSEQ MANAGEMENT) */}
          {/* Código: hseq_management */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          <Route
            path="/hseq"
            element={<Navigate to="/hseq/dashboard" replace />}
          />
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
          <Route path="/hseq/seguridad-industrial" element={withSuspense(SeguridadIndustrialPage)} />

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
          <Route path="/proveedores/productos-servicios" element={withSuspense(ProductosServiciosPage)} />
          <Route path="/proveedores/pruebas-acidez" element={withSuspense(PruebasAcidezPage)} />

          {/* Módulo: Operaciones de Producción (production_ops) - Próximamente */}
          <Route
            path="/produccion"
            element={<div className="p-8 text-center text-gray-500">Base de Operaciones - Próximamente</div>}
          />

          {/* Módulo: Logística y Flota (logistics_fleet) - Próximamente */}
          <Route
            path="/logistica"
            element={<div className="p-8 text-center text-gray-500">Logística y Flota - Próximamente</div>}
          />

          {/* Módulo: Ventas y CRM (sales_crm) */}
          <Route
            path="/ventas"
            element={<Navigate to="/ventas/clientes" replace />}
          />
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
          <Route path="/talento" element={withSuspense(TalentHubPage)} />
          <Route path="/talento/estructura" element={withSuspense(TalentHubPage)} />
          <Route path="/talento/seleccion" element={withSuspense(TalentHubPage)} />
          <Route path="/talento/colaboradores" element={withSuspense(TalentHubPage)} />

          {/* Módulo: Administración y Finanzas (admin_finance) */}
          <Route path="/finanzas" element={<Navigate to="/finanzas/dashboard" replace />} />
          <Route path="/finanzas/dashboard" element={withSuspense(AdminFinancePage)} />
          <Route path="/finanzas/tesoreria" element={withSuspense(TesoreriaPage)} />
          <Route path="/finanzas/presupuesto" element={withSuspense(PresupuestoPage)} />
          <Route path="/finanzas/activos-fijos" element={withSuspense(ActivosFijosPage)} />
          <Route path="/finanzas/servicios-generales" element={withSuspense(ServiciosGeneralesPage)} />

          {/* Módulo: Contabilidad (accounting) - MÓDULO ACTIVABLE */}
          <Route path="/contabilidad" element={<Navigate to="/contabilidad/dashboard" replace />} />
          <Route path="/contabilidad/dashboard" element={withSuspense(AccountingPage)} />
          <Route path="/contabilidad/configuracion" element={withSuspense(ConfigContablePage)} />
          <Route path="/contabilidad/movimientos" element={withSuspense(MovimientosContablesPage)} />
          <Route path="/contabilidad/informes" element={withSuspense(InformesContablesPage)} />
          <Route path="/contabilidad/integracion" element={withSuspense(IntegracionContablePage)} />

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* NIVEL 6: INTELIGENCIA */}
          {/* ═══════════════════════════════════════════════════════════════ */}

          {/* Módulo: Analítica (analytics) */}
          <Route path="/analytics" element={<Navigate to="/analytics/dashboard" replace />} />

          {/* Semana 23 - Configuración e Indicadores */}
          <Route path="/analytics/dashboard" element={withSuspense(AnalyticsPage)} />
          <Route path="/analytics/configuracion" element={withSuspense(ConfigIndicadoresPage)} />
          <Route path="/analytics/dashboards" element={withSuspense(DashboardGerencialPage)} />
          <Route path="/analytics/indicadores" element={withSuspense(IndicadoresAreaPage)} />

          {/* Semana 24 - Análisis, Informes, Acciones y Exportación */}
          <Route path="/analytics/analisis" element={withSuspense(AnalisisTendenciasPage)} />
          <Route path="/analytics/informes" element={withSuspense(GeneradorInformesPage)} />
          <Route path="/analytics/acciones" element={withSuspense(AccionesIndicadorPage)} />
          <Route path="/analytics/exportacion" element={withSuspense(ExportacionPage)} />

          {/* Módulo: Sistema de Auditoría (audit_system) */}
          <Route path="/auditoria" element={<Navigate to="/auditoria/dashboard" replace />} />

          {/* Semana 25 - Sistema de Auditoría */}
          <Route path="/auditoria/dashboard" element={withSuspense(AuditSystemPage)} />
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
      {/* SMART REDIRECT Y 404 */}
      {/* ═══════════════════════════════════════════════════════════════ */}

      {/* Smart Redirect - Landing inteligente según rol y última ruta */}
      <Route path="/" element={<SmartRedirect />} />
      <Route path="/dashboard" element={<SmartRedirect />} />

      {/* 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};
