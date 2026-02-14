/**
 * Rutas del Sistema ERP StrateKaz - Orden Logico de 8 Niveles (0-7)
 *
 * Alineado con docs/01-arquitectura/ORDEN-LOGICO-CONFIGURACION.md
 *
 * NIVEL 0 - AUTOMATICO: Seed al crear tenant (SystemModules, Tabs, Secciones, RBAC)
 * NIVEL 1 - FUNDACION EMPRESARIAL: EmpresaConfig, Branding, Modulos habilitados
 * NIVEL 2 - ESTRUCTURA ORGANIZACIONAL: Areas, Cargos, Sedes, Organigrama
 * NIVEL 3 - DIRECCION ESTRATEGICA: Identidad, DOFA, Planeacion, Proyectos, Docs, Plan Trabajo
 * NIVEL 4 - TALENTO HUMANO: Seleccion, Colaboradores, Formacion, Nomina, Desempeno
 * NIVEL 5 - RIESGOS Y CUMPLIMIENTO: Cumplimiento, Riesgos, Workflows
 * NIVEL 6 - GESTION HSEQ: Medicina, Seguridad, Higiene, Accidentalidad, Emergencias, Ambiental
 * NIVEL 7 - OPERACIONES: Supply Chain, Produccion, Logistica, Ventas, Finanzas, Contabilidad, Analytics
 *
 * OPTIMIZADO: Code splitting con React.lazy() para reducir bundle inicial
 */
import { lazy, Suspense, ComponentType } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { ModuleGuard } from './ModuleGuard';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { LoginPage } from '@/pages/LoginPage';
import { ForgotPasswordPage } from '@/pages/ForgotPasswordPage';
import { ResetPasswordPage } from '@/pages/ResetPasswordPage';
import { AuthCallbackPage } from '@/pages/AuthCallbackPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { ErrorPage } from '@/pages/ErrorPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { PageLoader } from '@/components/common/PageLoader';

// Helper para envolver componentes lazy con Suspense
const withSuspense = (Component: ComponentType) => (
  <Suspense fallback={<PageLoader />}>
    <Component />
  </Suspense>
);

// Helper para envolver con Suspense + ModuleGuard (doble proteccion frontend)
const withModuleGuard = (Component: ComponentType, moduleCode: string) => (
  <ModuleGuard moduleCode={moduleCode}>
    <Suspense fallback={<PageLoader />}>
      <Component />
    </Suspense>
  </ModuleGuard>
);

// ==================== ADMIN GLOBAL (Solo Superusuarios) ====================
const AdminGlobalPage = lazy(() =>
  import('@/features/admin-global').then((m) => ({ default: m.AdminGlobalPage }))
);

// ==================== NIVEL 1-2: FUNDACION + ESTRUCTURA (gestion_estrategica) ====================
const UsersPage = lazy(() => import('@/features/users/pages/UsersPage'));
const ConfiguracionPage = lazy(
  () => import('@/features/gestion-estrategica/pages/ConfiguracionPage')
);
const OrganizacionPage = lazy(
  () => import('@/features/gestion-estrategica/pages/OrganizacionPage')
);

// ==================== NIVEL 3: DIRECCION ESTRATEGICA ====================
const IdentidadPage = lazy(() => import('@/features/gestion-estrategica/pages/IdentidadPage'));
const PlaneacionPage = lazy(() => import('@/features/gestion-estrategica/pages/PlaneacionPage'));
const ProyectosPage = lazy(() => import('@/features/gestion-estrategica/pages/ProyectosPage'));
const RevisionDireccionPage = lazy(
  () => import('@/features/gestion-estrategica/pages/RevisionDireccionPage')
);
const ContextoPage = lazy(() => import('@/features/gestion-estrategica/pages/ContextoPage'));

// ==================== NIVEL 4: TALENTO HUMANO ====================
const TalentHubPage = lazy(() =>
  import('@/features/talent-hub').then((m) => ({ default: m.TalentHubPage }))
);

// ==================== NIVEL 5: RIESGOS Y CUMPLIMIENTO ====================
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

// ==================== NIVEL 6: GESTION INTEGRAL HSEQ ====================
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

// ==================== NIVEL 7: OPERACIONES Y SOPORTE ====================
// Cadena de Suministro (supply_chain)
const SupplyChainPage = lazy(() =>
  import('@/features/supply-chain').then((m) => ({ default: m.SupplyChainPage }))
);
const GestionProveedoresPage = lazy(() =>
  import('@/features/supply-chain').then((m) => ({ default: m.GestionProveedoresPage }))
);

// Operaciones de Produccion
const ProductionOpsPage = lazy(() => import('@/features/production-ops/pages/ProductionOpsPage'));

// Logistica y Flota
const LogisticsFleetPage = lazy(
  () => import('@/features/logistics-fleet/pages/LogisticsFleetPage')
);

// Ventas y CRM
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

// Administracion y Finanzas
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

// Contabilidad (Modulo Activable)
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

// Analitica e Inteligencia de Negocios
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
const DashboardBuilderPage = lazy(() =>
  import('@/features/analytics').then((m) => ({ default: m.DashboardBuilderPage }))
);

// Sistema de Auditoria
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

// ==================== PAGINAS PUBLICAS (Sin autenticacion) ====================
const EncuestaPublicaPage = lazy(
  () => import('@/features/gestion-estrategica/pages/EncuestaPublicaPage')
);
const ResponderPruebaPage = lazy(() => import('@/features/talent-hub/pages/ResponderPruebaPage'));
const ResponderEntrevistaPage = lazy(
  () => import('@/features/talent-hub/pages/ResponderEntrevistaPage')
);

// ==================== PORTALES ESS / MSS ====================
const MiPortalPage = lazy(() =>
  import('@/features/mi-portal').then((m) => ({ default: m.MiPortalPage }))
);
const MiEquipoPage = lazy(() =>
  import('@/features/mi-equipo').then((m) => ({ default: m.MiEquipoPage }))
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
      {/* RUTAS PUBLICAS */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/auth/callback" element={<AuthCallbackPage />} />
      <Route path="/encuestas/responder/:token" element={withSuspense(EncuestaPublicaPage)} />
      <Route path="/pruebas/responder/:token" element={withSuspense(ResponderPruebaPage)} />
      <Route path="/entrevistas/responder/:token" element={withSuspense(ResponderEntrevistaPage)} />

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* RUTAS PROTEGIDAS */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* DASHBOARD PRINCIPAL - Pagina de inicio post-login */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          <Route path="/dashboard" element={<DashboardPage />} />

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* ADMIN GLOBAL - Solo Superusuarios (is_superuser=true) */}
          {/* Gestion de: Tenants, Planes, Usuarios Globales, Modulos */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          <Route path="/admin-global" element={withSuspense(AdminGlobalPage)} />

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* PERFIL DE USUARIO */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          <Route path="/perfil" element={withSuspense(PerfilPage)} />
          <Route path="/perfil/seguridad" element={withSuspense(SeguridadPage)} />
          <Route path="/perfil/preferencias" element={withSuspense(PreferenciasPage)} />

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* PORTALES ESS / MSS (Acceso universal, sin ModuleGuard) */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          <Route path="/mi-portal" element={withSuspense(MiPortalPage)} />
          <Route path="/mi-equipo" element={withSuspense(MiEquipoPage)} />

          {/* Usuarios - Modulo transversal */}
          <Route path="/usuarios" element={withSuspense(UsersPage)} />

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* NIVEL 1-2: FUNDACION EMPRESARIAL + ESTRUCTURA ORGANIZACIONAL */}
          {/* Modulo: gestion_estrategica (es el modulo core, siempre activo) */}
          {/* Nivel 1: Configuracion empresa (EmpresaConfig, branding, modulos) */}
          {/* Nivel 2: Estructura (Areas, Cargos, Sedes, Organigrama) */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          <Route
            path="/gestion-estrategica"
            element={<Navigate to="/gestion-estrategica/configuracion" replace />}
          />

          {/* Tab 1: Configuracion (Nivel 1 - Fundacion) */}
          <Route
            path="/gestion-estrategica/configuracion"
            element={withModuleGuard(ConfiguracionPage, 'gestion_estrategica')}
          />

          {/* Tab 2: Organizacion (Nivel 2 - Estructura) */}
          <Route
            path="/gestion-estrategica/organizacion"
            element={withModuleGuard(OrganizacionPage, 'gestion_estrategica')}
          />

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* NIVEL 3: DIRECCION ESTRATEGICA */}
          {/* Identidad, Contexto, Planeacion, Proyectos, Revision Direccion */}
          {/* Gestion Documental y Planificacion Sistema (via HSEQ) */}
          {/* ═══════════════════════════════════════════════════════════════ */}

          {/* Tab 3: Identidad Corporativa (mision, vision, valores, politicas) */}
          <Route
            path="/gestion-estrategica/identidad"
            element={withModuleGuard(IdentidadPage, 'gestion_estrategica')}
          />

          {/* Tab 4: Planeacion Estrategica (objetivos, indicadores, metas) */}
          <Route
            path="/gestion-estrategica/planeacion"
            element={withModuleGuard(PlaneacionPage, 'gestion_estrategica')}
          />

          {/* Tab 4b: Contexto Organizacional (DOFA/PESTEL/Porter/TOWS) */}
          <Route
            path="/gestion-estrategica/contexto"
            element={withModuleGuard(ContextoPage, 'gestion_estrategica')}
          />

          {/* Tab 5: Gestion de Proyectos (PMI/PMBOK con Kanban) */}
          <Route
            path="/gestion-estrategica/proyectos"
            element={withModuleGuard(ProyectosPage, 'gestion_estrategica')}
          />

          {/* Tab 6: Revision por Direccion (ISO 9.3) */}
          <Route
            path="/gestion-estrategica/revision-direccion"
            element={withModuleGuard(RevisionDireccionPage, 'gestion_estrategica')}
          />

          {/* Soporte Estrategico: Gestion Documental y Planificacion Sistema */}
          {/* Redirige a HSEQ donde estan las implementaciones completas */}
          <Route
            path="/soporte-estrategico"
            element={<Navigate to="/hseq/sistema-documental" replace />}
          />
          <Route
            path="/soporte-estrategico/gestion-documental"
            element={<Navigate to="/hseq/sistema-documental" replace />}
          />
          <Route
            path="/soporte-estrategico/planificacion-sistema"
            element={<Navigate to="/hseq/planificacion" replace />}
          />

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* NIVEL 4: TALENTO HUMANO (Centro de Talento) */}
          {/* Modulo: talent_hub */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          <Route path="/talento" element={<Navigate to="/talento/estructura" replace />} />
          <Route
            path="/talento/estructura"
            element={withModuleGuard(TalentHubPage, 'talent_hub')}
          />
          <Route path="/talento/seleccion" element={withModuleGuard(TalentHubPage, 'talent_hub')} />
          <Route
            path="/talento/colaboradores"
            element={withModuleGuard(TalentHubPage, 'talent_hub')}
          />
          <Route
            path="/talento/onboarding"
            element={withModuleGuard(TalentHubPage, 'talent_hub')}
          />
          <Route path="/talento/formacion" element={withModuleGuard(TalentHubPage, 'talent_hub')} />
          <Route path="/talento/desempeno" element={withModuleGuard(TalentHubPage, 'talent_hub')} />
          <Route
            path="/talento/control-tiempo"
            element={withModuleGuard(TalentHubPage, 'talent_hub')}
          />
          <Route path="/talento/novedades" element={withModuleGuard(TalentHubPage, 'talent_hub')} />
          <Route
            path="/talento/disciplinario"
            element={withModuleGuard(TalentHubPage, 'talent_hub')}
          />
          <Route path="/talento/nomina" element={withModuleGuard(TalentHubPage, 'talent_hub')} />
          <Route
            path="/talento/off-boarding"
            element={withModuleGuard(TalentHubPage, 'talent_hub')}
          />

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* NIVEL 5: GESTION DE RIESGOS Y CUMPLIMIENTO */}
          {/* ═══════════════════════════════════════════════════════════════ */}

          {/* Modulo: Motor de Cumplimiento (motor_cumplimiento) */}
          <Route
            path="/cumplimiento"
            element={<Navigate to="/cumplimiento/matriz-legal" replace />}
          />
          <Route
            path="/cumplimiento/matriz-legal"
            element={withModuleGuard(MatrizLegalPage, 'motor_cumplimiento')}
          />
          <Route
            path="/cumplimiento/requisitos-legales"
            element={withModuleGuard(RequisitosLegalesPage, 'motor_cumplimiento')}
          />
          <Route
            path="/cumplimiento/partes-interesadas"
            element={withModuleGuard(PartesInteresadasPage, 'motor_cumplimiento')}
          />
          <Route
            path="/cumplimiento/reglamentos-internos"
            element={withModuleGuard(ReglamentosInternosPage, 'motor_cumplimiento')}
          />

          {/* Modulo: Motor de Riesgos (motor_riesgos) */}
          <Route path="/riesgos" element={<Navigate to="/riesgos/procesos" replace />} />
          <Route
            path="/riesgos/procesos"
            element={withModuleGuard(RiesgosProcesosPage, 'motor_riesgos')}
          />
          <Route path="/riesgos/ipevr" element={withModuleGuard(IPEVRPage, 'motor_riesgos')} />
          <Route
            path="/riesgos/ambientales"
            element={withModuleGuard(AspectosAmbientalesPage, 'motor_riesgos')}
          />
          <Route
            path="/riesgos/viales"
            element={withModuleGuard(RiesgosVialesPage, 'motor_riesgos')}
          />
          <Route
            path="/riesgos/sagrilaft"
            element={withModuleGuard(SagrilaftPteePage, 'motor_riesgos')}
          />
          <Route
            path="/riesgos/seguridad-info"
            element={withModuleGuard(SeguridadInformacionPage, 'motor_riesgos')}
          />

          {/* Modulo: Flujos de Trabajo (workflow_engine) */}
          <Route path="/workflows" element={<Navigate to="/workflows/disenador" replace />} />
          <Route
            path="/workflows/disenador"
            element={withModuleGuard(DisenadorFlujosPage, 'workflow_engine')}
          />
          <Route
            path="/workflows/ejecucion"
            element={withModuleGuard(EjecucionPage, 'workflow_engine')}
          />
          <Route
            path="/workflows/monitoreo"
            element={withModuleGuard(MonitoreoPage, 'workflow_engine')}
          />

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* NIVEL 6: GESTION INTEGRAL HSEQ */}
          {/* Modulo: hseq_management */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          <Route path="/hseq" element={<Navigate to="/hseq/sistema-documental" replace />} />
          <Route path="/hseq/dashboard" element={withModuleGuard(HSEQPage, 'hseq_management')} />

          {/* Tab 1: Sistema Documental (Gestion Documental centralizada) */}
          <Route
            path="/hseq/sistema-documental"
            element={withModuleGuard(SistemaDocumentalPage, 'hseq_management')}
          />

          {/* Tab 2: Planificacion del Sistema (Plan de Trabajo Anual, Programas) */}
          <Route
            path="/hseq/planificacion"
            element={withModuleGuard(PlanificacionSistemaPage, 'hseq_management')}
          />

          {/* Tab 3: Calidad (No conformidades, Auditorias) */}
          <Route path="/hseq/calidad" element={withModuleGuard(CalidadPage, 'hseq_management')} />

          {/* Tab 4: Medicina Laboral (Examenes medicos) */}
          <Route
            path="/hseq/medicina-laboral"
            element={withModuleGuard(MedicinaLaboralPage, 'hseq_management')}
          />

          {/* Tab 5: Seguridad Industrial (Inspecciones, EPP) */}
          <Route
            path="/hseq/seguridad-industrial"
            element={withModuleGuard(SeguridadIndustrialPage, 'hseq_management')}
          />

          {/* Tab 6: Higiene Industrial (Mediciones ambientales) */}
          <Route
            path="/hseq/higiene-industrial"
            element={withModuleGuard(HigieneIndustrialPage, 'hseq_management')}
          />

          {/* Tab 7: Gestion de Comites */}
          <Route
            path="/hseq/comites"
            element={withModuleGuard(GestionComitesPage, 'hseq_management')}
          />

          {/* Tab 8: Accidentalidad (ATEL - Investigacion AT/EL) */}
          <Route
            path="/hseq/accidentalidad"
            element={withModuleGuard(AccidentalidadPage, 'hseq_management')}
          />

          {/* Tab 9: Emergencias (Planes, Brigadas) */}
          <Route
            path="/hseq/emergencias"
            element={withModuleGuard(EmergenciasPage, 'hseq_management')}
          />

          {/* Tab 10: Gestion Ambiental */}
          <Route
            path="/hseq/gestion-ambiental"
            element={withModuleGuard(GestionAmbientalPage, 'hseq_management')}
          />

          {/* Tab 11: Mejora Continua (Acciones correctivas) */}
          <Route
            path="/hseq/mejora-continua"
            element={withModuleGuard(MejoraContinuaPage, 'hseq_management')}
          />

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* NIVEL 7: OPERACIONES Y SOPORTE (Independientes entre si) */}
          {/* ═══════════════════════════════════════════════════════════════ */}

          {/* Modulo: Cadena de Suministro (supply_chain) */}
          <Route
            path="/supply-chain"
            element={<Navigate to="/supply-chain/proveedores" replace />}
          />
          <Route
            path="/supply-chain/proveedores"
            element={withModuleGuard(GestionProveedoresPage, 'supply_chain')}
          />
          <Route
            path="/supply-chain/programacion"
            element={withModuleGuard(SupplyChainPage, 'supply_chain')}
          />
          <Route
            path="/supply-chain/compras"
            element={withModuleGuard(SupplyChainPage, 'supply_chain')}
          />
          <Route
            path="/supply-chain/almacenamiento"
            element={withModuleGuard(SupplyChainPage, 'supply_chain')}
          />
          <Route
            path="/supply-chain/pruebas-acidez"
            element={withModuleGuard(SupplyChainPage, 'supply_chain')}
          />
          <Route
            path="/supply-chain/catalogos"
            element={withModuleGuard(SupplyChainPage, 'supply_chain')}
          />

          {/* Modulo: Operaciones de Produccion (production_ops) */}
          <Route path="/produccion" element={<Navigate to="/produccion/recepcion" replace />} />
          <Route
            path="/produccion/recepcion"
            element={withModuleGuard(ProductionOpsPage, 'production_ops')}
          />
          <Route
            path="/produccion/procesamiento"
            element={withModuleGuard(ProductionOpsPage, 'production_ops')}
          />
          <Route
            path="/produccion/mantenimiento"
            element={withModuleGuard(ProductionOpsPage, 'production_ops')}
          />
          <Route
            path="/produccion/producto-terminado"
            element={withModuleGuard(ProductionOpsPage, 'production_ops')}
          />

          {/* Modulo: Logistica y Flota (logistics_fleet) */}
          <Route path="/logistica" element={<Navigate to="/logistica/transporte" replace />} />
          <Route
            path="/logistica/transporte"
            element={withModuleGuard(LogisticsFleetPage, 'logistics_fleet')}
          />
          <Route
            path="/logistica/despachos"
            element={withModuleGuard(LogisticsFleetPage, 'logistics_fleet')}
          />
          <Route
            path="/logistica/flota"
            element={withModuleGuard(LogisticsFleetPage, 'logistics_fleet')}
          />
          <Route
            path="/logistica/pesv"
            element={withModuleGuard(LogisticsFleetPage, 'logistics_fleet')}
          />

          {/* Modulo: Ventas y CRM (sales_crm) */}
          <Route path="/ventas" element={<Navigate to="/ventas/clientes" replace />} />
          <Route path="/ventas/clientes" element={withModuleGuard(ClientesPage, 'sales_crm')} />
          <Route path="/ventas/pipeline" element={withModuleGuard(PipelinePage, 'sales_crm')} />
          <Route
            path="/ventas/cotizaciones"
            element={withModuleGuard(CotizacionesPage, 'sales_crm')}
          />
          <Route path="/ventas/pedidos" element={withModuleGuard(PedidosPage, 'sales_crm')} />
          <Route path="/ventas/facturas" element={withModuleGuard(FacturasPage, 'sales_crm')} />
          <Route path="/ventas/pqrs" element={withModuleGuard(PQRSPage, 'sales_crm')} />
          <Route path="/ventas/encuestas" element={withModuleGuard(EncuestasPage, 'sales_crm')} />
          <Route
            path="/ventas/fidelizacion"
            element={withModuleGuard(FidelizacionPage, 'sales_crm')}
          />

          {/* Modulo: Administracion y Finanzas (admin_finance) */}
          <Route path="/finanzas" element={<Navigate to="/finanzas/tesoreria" replace />} />
          <Route
            path="/finanzas/tesoreria"
            element={withModuleGuard(TesoreriaPage, 'admin_finance')}
          />
          <Route
            path="/finanzas/presupuesto"
            element={withModuleGuard(PresupuestoPage, 'admin_finance')}
          />
          <Route
            path="/finanzas/activos-fijos"
            element={withModuleGuard(ActivosFijosPage, 'admin_finance')}
          />
          <Route
            path="/finanzas/servicios-generales"
            element={withModuleGuard(ServiciosGeneralesPage, 'admin_finance')}
          />

          {/* Modulo: Contabilidad (accounting) */}
          <Route
            path="/contabilidad"
            element={<Navigate to="/contabilidad/configuracion" replace />}
          />
          <Route
            path="/contabilidad/configuracion"
            element={withModuleGuard(ConfigContablePage, 'accounting')}
          />
          <Route
            path="/contabilidad/movimientos"
            element={withModuleGuard(MovimientosContablesPage, 'accounting')}
          />
          <Route
            path="/contabilidad/informes"
            element={withModuleGuard(InformesContablesPage, 'accounting')}
          />
          <Route
            path="/contabilidad/integracion"
            element={withModuleGuard(IntegracionContablePage, 'accounting')}
          />

          {/* Modulo: Analitica e Inteligencia de Negocios (analytics) */}
          <Route path="/analytics" element={<Navigate to="/analytics/configuracion" replace />} />
          <Route
            path="/analytics/configuracion"
            element={withModuleGuard(ConfigIndicadoresPage, 'analytics')}
          />
          <Route
            path="/analytics/dashboards"
            element={withModuleGuard(DashboardGerencialPage, 'analytics')}
          />
          <Route
            path="/analytics/indicadores"
            element={withModuleGuard(IndicadoresAreaPage, 'analytics')}
          />
          <Route
            path="/analytics/analisis"
            element={withModuleGuard(AnalisisTendenciasPage, 'analytics')}
          />
          <Route
            path="/analytics/informes"
            element={withModuleGuard(GeneradorInformesPage, 'analytics')}
          />
          <Route
            path="/analytics/acciones"
            element={withModuleGuard(AccionesIndicadorPage, 'analytics')}
          />
          <Route
            path="/analytics/exportacion"
            element={withModuleGuard(ExportacionPage, 'analytics')}
          />
          <Route
            path="/analytics/builder"
            element={withModuleGuard(DashboardBuilderPage, 'analytics')}
          />
          <Route path="/analytics/demo" element={withModuleGuard(AnalyticsDemoPage, 'analytics')} />

          {/* Modulo: Sistema de Auditoria (audit_system) */}
          <Route path="/auditoria" element={<Navigate to="/auditoria/logs" replace />} />
          <Route
            path="/auditoria/logs"
            element={withModuleGuard(LogsSistemaPage, 'audit_system')}
          />
          <Route
            path="/auditoria/notificaciones"
            element={withModuleGuard(NotificacionesPage, 'audit_system')}
          />
          <Route path="/auditoria/alertas" element={withModuleGuard(AlertasPage, 'audit_system')} />
          <Route path="/auditoria/tareas" element={withModuleGuard(TareasPage, 'audit_system')} />
        </Route>
      </Route>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* REDIRECT RAIZ Y 404 */}
      {/* ═══════════════════════════════════════════════════════════════ */}

      {/* Ruta raiz redirige a Mi Portal (home del empleado) */}
      <Route path="/" element={<Navigate to="/mi-portal" replace />} />

      {/* 500 Error */}
      <Route path="/error" element={<ErrorPage />} />

      {/* 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};
