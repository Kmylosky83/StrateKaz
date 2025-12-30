/**
 * Rutas del Sistema ERP - Estructura de 6 Niveles
 *
 * NIVEL 1 - Estratégico: Dirección Estratégica
 * NIVEL 2 - Cumplimiento: Cumplimiento, Riesgos, Workflows
 * NIVEL 3 - Torre de Control: Gestión HSEQ
 * NIVEL 4 - Cadena de Valor: Supply Chain, Producción, Logística, Ventas
 * NIVEL 5 - Habilitadores: Talento, Finanzas, Contabilidad
 * NIVEL 6 - Inteligencia: Analítica, Auditoría
 */
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { LoginPage } from '@/pages/LoginPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { SmartRedirect } from '@/components/common/SmartRedirect';

// ==================== NIVEL 1: DIRECCIÓN ESTRATÉGICA ====================
import UsersPage from '@/features/users/pages/UsersPage';
import {
  ConfiguracionPage,
  OrganizacionPage,
  IdentidadPage,
  PlaneacionPage,
  ProyectosPage,
  RevisionDireccionPage,
} from '@/features/gestion-estrategica';

// ==================== NIVEL 2: CUMPLIMIENTO ====================
// Motor de Cumplimiento - Próximamente (en features/cumplimiento)
// Motor de Riesgos
import {
  RiesgosPage,
  ContextoOrganizacionalPage,
  RiesgosProcesosPage,
  IPEVRPage,
  AspectosAmbientalesPage,
  RiesgosVialesPage,
  SagrilaftPteePage,
  SeguridadInformacionPage,
} from '@/features/riesgos';

// Workflows Engine
import {
  WorkflowsPage,
  DisenadorFlujosPage,
  EjecucionPage,
  MonitoreoPage,
} from '@/features/workflows';

// ==================== NIVEL 3: TORRE DE CONTROL (HSEQ) ====================
import {
  HSEQPage,
  SistemaDocumentalPage,
  PlanificacionSistemaPage,
  CalidadPage,
  MedicinaLaboralPage,
  SeguridadIndustrialPage,
  HigieneIndustrialPage,
  GestionComitesPage,
  AccidentalidadPage,
  EmergenciasPage,
  GestionAmbientalPage,
  MejoraContinuaPage,
} from '@/features/hseq';

// ==================== NIVEL 4: CADENA DE VALOR ====================
// Supply Chain (Proveedores legacy → será refactorizado a supply_chain)
import MateriaPrimaPage from '@/features/proveedores/pages/MateriaPrimaPage';
import ProductosServiciosPage from '@/features/proveedores/pages/ProductosServiciosPage';
import PruebasAcidezPage from '@/features/proveedores/pages/PruebasAcidezPage';

// Logistics & Fleet - Próximamente

// Sales & CRM
import {
  ClientesPage,
  PipelinePage,
  CotizacionesPage,
  PedidosPage,
  FacturasPage,
  PQRSPage,
  EncuestasPage,
  FidelizacionPage,
} from '@/features/sales-crm';

// ==================== NIVEL 5: HABILITADORES ====================
// Centro de Talento (Talent Hub)
import { TalentHubPage } from '@/features/talent-hub';
// Administración y Finanzas
import {
  AdminFinancePage,
  TesoreriaPage,
  PresupuestoPage,
  ActivosFijosPage,
  ServiciosGeneralesPage,
} from '@/features/admin-finance';
// Contabilidad (Módulo Activable)
import {
  AccountingPage,
  ConfigContablePage,
  MovimientosContablesPage,
  InformesContablesPage,
  IntegracionContablePage,
} from '@/features/accounting';

// ==================== NIVEL 6: INTELIGENCIA ====================
// Analítica
import {
  AnalyticsPage,
  ConfigIndicadoresPage,
  DashboardGerencialPage,
  IndicadoresAreaPage,
  AnalisisTendenciasPage,
  GeneradorInformesPage,
  AccionesIndicadorPage,
  ExportacionPage,
} from '@/features/analytics';

// Sistema de Auditoría
import {
  AuditSystemPage,
  LogsSistemaPage,
  NotificacionesPage,
  AlertasPage,
  TareasPage,
} from '@/features/audit-system';

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
          <Route path="/gestion-estrategica/configuracion" element={<ConfiguracionPage />} />

          {/* Tab 2: Organización */}
          <Route path="/gestion-estrategica/organizacion" element={<OrganizacionPage />} />

          {/* Tab 3: Identidad Corporativa */}
          <Route path="/gestion-estrategica/identidad" element={<IdentidadPage />} />

          {/* Tab 4: Planeación Estratégica */}
          <Route path="/gestion-estrategica/planeacion" element={<PlaneacionPage />} />

          {/* Tab 5: Gestión de Proyectos (PMI) */}
          <Route path="/gestion-estrategica/proyectos" element={<ProyectosPage />} />

          {/* Tab 6: Revisión por Dirección (ISO 9.3) */}
          <Route path="/gestion-estrategica/revision-direccion" element={<RevisionDireccionPage />} />

          {/* Usuarios - Módulo transversal dentro de Dirección Estratégica */}
          <Route path="/usuarios" element={<UsersPage />} />

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
            element={<RiesgosPage />}
          />
          <Route path="/riesgos/contexto" element={<ContextoOrganizacionalPage />} />
          <Route path="/riesgos/procesos" element={<RiesgosProcesosPage />} />
          <Route path="/riesgos/ipevr" element={<IPEVRPage />} />
          <Route path="/riesgos/ambientales" element={<AspectosAmbientalesPage />} />
          <Route path="/riesgos/viales" element={<RiesgosVialesPage />} />
          <Route path="/riesgos/sagrilaft" element={<SagrilaftPteePage />} />
          <Route path="/riesgos/seguridad-info" element={<SeguridadInformacionPage />} />

          {/* Módulo: Flujos de Trabajo (workflow_engine) */}
          <Route path="/workflows" element={<WorkflowsPage />} />
          <Route path="/workflows/disenador" element={<DisenadorFlujosPage />} />
          <Route path="/workflows/ejecucion" element={<EjecucionPage />} />
          <Route path="/workflows/monitoreo" element={<MonitoreoPage />} />

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* NIVEL 3: TORRE DE CONTROL (HSEQ MANAGEMENT) */}
          {/* Código: hseq_management */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          <Route
            path="/hseq"
            element={<Navigate to="/hseq/dashboard" replace />}
          />
          <Route path="/hseq/dashboard" element={<HSEQPage />} />

          {/* Tab 1: Sistema Documental */}
          <Route path="/hseq/sistema-documental" element={<SistemaDocumentalPage />} />

          {/* Tab 2: Planificación Sistema */}
          <Route path="/hseq/planificacion" element={<PlanificacionSistemaPage />} />

          {/* Tab 3: Calidad */}
          <Route path="/hseq/calidad" element={<CalidadPage />} />

          {/* Tab 4: Medicina Laboral */}
          <Route path="/hseq/medicina-laboral" element={<MedicinaLaboralPage />} />

          {/* Tab 5: Seguridad Industrial */}
          <Route path="/hseq/seguridad-industrial" element={<SeguridadIndustrialPage />} />

          {/* Tab 6: Higiene Industrial */}
          <Route path="/hseq/higiene-industrial" element={<HigieneIndustrialPage />} />

          {/* Tab 7: Gestión de Comités */}
          <Route path="/hseq/comites" element={<GestionComitesPage />} />

          {/* Tab 8: Accidentalidad (ATEL) */}
          <Route path="/hseq/accidentalidad" element={<AccidentalidadPage />} />

          {/* Tab 9: Emergencias */}
          <Route path="/hseq/emergencias" element={<EmergenciasPage />} />

          {/* Tab 10: Gestión Ambiental */}
          <Route path="/hseq/gestion-ambiental" element={<GestionAmbientalPage />} />

          {/* Tab 11: Mejora Continua */}
          <Route path="/hseq/mejora-continua" element={<MejoraContinuaPage />} />

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
          <Route path="/proveedores/materia-prima" element={<MateriaPrimaPage />} />
          <Route path="/proveedores/productos-servicios" element={<ProductosServiciosPage />} />
          <Route path="/proveedores/pruebas-acidez" element={<PruebasAcidezPage />} />

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
          <Route path="/ventas/clientes" element={<ClientesPage />} />
          {/* Tab 2: Pipeline de Ventas */}
          <Route path="/ventas/pipeline" element={<PipelinePage />} />
          {/* Tab 3: Cotizaciones */}
          <Route path="/ventas/cotizaciones" element={<CotizacionesPage />} />
          {/* Tab 4: Pedidos */}
          <Route path="/ventas/pedidos" element={<PedidosPage />} />
          {/* Tab 5: Facturas */}
          <Route path="/ventas/facturas" element={<FacturasPage />} />
          {/* Tab 6: PQRS */}
          <Route path="/ventas/pqrs" element={<PQRSPage />} />
          {/* Tab 7: Encuestas NPS */}
          <Route path="/ventas/encuestas" element={<EncuestasPage />} />
          {/* Tab 8: Fidelización */}
          <Route path="/ventas/fidelizacion" element={<FidelizacionPage />} />

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* NIVEL 5: HABILITADORES */}
          {/* ═══════════════════════════════════════════════════════════════ */}

          {/* Módulo: Talent Hub - Gestión del Talento Humano */}
          <Route path="/talento" element={<TalentHubPage />} />
          <Route path="/talento/estructura" element={<TalentHubPage />} />
          <Route path="/talento/seleccion" element={<TalentHubPage />} />
          <Route path="/talento/colaboradores" element={<TalentHubPage />} />

          {/* Módulo: Administración y Finanzas (admin_finance) */}
          <Route path="/finanzas" element={<Navigate to="/finanzas/dashboard" replace />} />
          <Route path="/finanzas/dashboard" element={<AdminFinancePage />} />
          <Route path="/finanzas/tesoreria" element={<TesoreriaPage />} />
          <Route path="/finanzas/presupuesto" element={<PresupuestoPage />} />
          <Route path="/finanzas/activos-fijos" element={<ActivosFijosPage />} />
          <Route path="/finanzas/servicios-generales" element={<ServiciosGeneralesPage />} />

          {/* Módulo: Contabilidad (accounting) - MÓDULO ACTIVABLE */}
          <Route path="/contabilidad" element={<Navigate to="/contabilidad/dashboard" replace />} />
          <Route path="/contabilidad/dashboard" element={<AccountingPage />} />
          <Route path="/contabilidad/configuracion" element={<ConfigContablePage />} />
          <Route path="/contabilidad/movimientos" element={<MovimientosContablesPage />} />
          <Route path="/contabilidad/informes" element={<InformesContablesPage />} />
          <Route path="/contabilidad/integracion" element={<IntegracionContablePage />} />

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* NIVEL 6: INTELIGENCIA */}
          {/* ═══════════════════════════════════════════════════════════════ */}

          {/* Módulo: Analítica (analytics) */}
          <Route path="/analytics" element={<Navigate to="/analytics/dashboard" replace />} />

          {/* Semana 23 - Configuración e Indicadores */}
          <Route path="/analytics/dashboard" element={<AnalyticsPage />} />
          <Route path="/analytics/configuracion" element={<ConfigIndicadoresPage />} />
          <Route path="/analytics/dashboards" element={<DashboardGerencialPage />} />
          <Route path="/analytics/indicadores" element={<IndicadoresAreaPage />} />

          {/* Semana 24 - Análisis, Informes, Acciones y Exportación */}
          <Route path="/analytics/analisis" element={<AnalisisTendenciasPage />} />
          <Route path="/analytics/informes" element={<GeneradorInformesPage />} />
          <Route path="/analytics/acciones" element={<AccionesIndicadorPage />} />
          <Route path="/analytics/exportacion" element={<ExportacionPage />} />

          {/* Módulo: Sistema de Auditoría (audit_system) */}
          <Route path="/auditoria" element={<Navigate to="/auditoria/dashboard" replace />} />

          {/* Semana 25 - Sistema de Auditoría */}
          <Route path="/auditoria/dashboard" element={<AuditSystemPage />} />
          <Route path="/auditoria/logs" element={<LogsSistemaPage />} />
          <Route path="/auditoria/notificaciones" element={<NotificacionesPage />} />
          <Route path="/auditoria/alertas" element={<AlertasPage />} />
          <Route path="/auditoria/tareas" element={<TareasPage />} />

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
