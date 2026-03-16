/**
 * Rutas del Sistema ERP StrateKaz
 *
 * ARCHIVO PROTEGIDO: No modificar en sprints de modulo.
 * Cada modulo tiene sus rutas en routes/modules/{modulo}.routes.tsx
 *
 * Arquitectura de Capas:
 *   C0 — Plataforma: Admin Global, Core
 *   C1 — Fundacion: Configuracion, Organizacion, Identidad
 *   C2 — Modulos de Negocio: Independientes entre si
 *   C3 — Inteligencia: Analytics, Audit (read-only)
 *   Portales: Mi Portal, Mi Equipo, Proveedor Portal
 */
import { lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { AdaptiveLayout } from '@/layouts/AdaptiveLayout';
import { LoginPage } from '@/pages/LoginPage';
import { ForgotPasswordPage } from '@/pages/ForgotPasswordPage';
import { ResetPasswordPage } from '@/pages/ResetPasswordPage';
import { SetupPasswordPage } from '@/pages/SetupPasswordPage';
import { AuthCallbackPage } from '@/pages/AuthCallbackPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { ErrorPage } from '@/pages/ErrorPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { withSuspense } from './helpers';

// ═══════════════════════════════════════════════════════════════
// Rutas por modulo (cada archivo es independiente)
// ═══════════════════════════════════════════════════════════════
import { adminGlobalRoutes } from './modules/admin-global.routes';
import { perfilRoutes } from './modules/perfil.routes';
import { portalsRoutes } from './modules/portals.routes';
import { fundacionRoutes } from './modules/fundacion.routes';
import { planeacionEstrategicaRoutes } from './modules/planeacion-estrategica.routes';
import { revisionDireccionRoutes } from './modules/revision-direccion.routes';
import { gestionEstrategicaRoutes } from './modules/gestion-estrategica.routes';
import { gestionDocumentalRoutes } from './modules/gestion-documental.routes';
import { sistemaGestionRoutes } from './modules/sistema-gestion.routes';
import { miEquipoRoutes } from './modules/mi-equipo.routes';
import { planificacionOperativaRoutes } from './modules/planificacion-operativa.routes';
import { proteccionCumplimientoRoutes } from './modules/proteccion-cumplimiento.routes';
import { accionesMejoraRoutes } from './modules/acciones-mejora.routes';
import { talentHubRoutes } from './modules/talent-hub.routes';
import { cumplimientoRoutes } from './modules/cumplimiento.routes';
import { riesgosRoutes } from './modules/riesgos.routes';
import { workflowsRoutes } from './modules/workflows.routes';
import { gestionIntegralRoutes } from './modules/gestion-integral.routes';
import { hseqRoutes } from './modules/hseq.routes';
import { supplyChainRoutes } from './modules/supply-chain.routes';
import { productionOpsRoutes } from './modules/production-ops.routes';
import { logisticsFleetRoutes } from './modules/logistics-fleet.routes';
import { salesCrmRoutes } from './modules/sales-crm.routes';
import { administracionRoutes } from './modules/administracion.routes';
import { tesoreriaRoutes } from './modules/tesoreria.routes';
import { accountingRoutes } from './modules/accounting.routes';
import { analyticsRoutes } from './modules/analytics.routes';
import { auditSystemRoutes } from './modules/audit-system.routes';

// Paginas publicas (lazy)
const EncuestaPublicaPage = lazy(
  () => import('@/features/gestion-estrategica/pages/EncuestaPublicaPage')
);
const ResponderPruebaPage = lazy(() => import('@/features/talent-hub/pages/ResponderPruebaPage'));
const ResponderEntrevistaPage = lazy(
  () => import('@/features/talent-hub/pages/ResponderEntrevistaPage')
);
const FirmarContratoPage = lazy(() => import('@/features/talent-hub/pages/FirmarContratoPage'));
const VacantesPublicasPage = lazy(() => import('@/features/talent-hub/pages/VacantesPublicasPage'));
const PostulacionPage = lazy(() => import('@/features/talent-hub/pages/PostulacionPage'));

export const AppRoutes = () => {
  return (
    <Routes>
      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* RUTAS PUBLICAS */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/setup-password" element={<SetupPasswordPage />} />
      <Route path="/auth/callback" element={<AuthCallbackPage />} />
      <Route path="/encuestas/responder/:token" element={withSuspense(EncuestaPublicaPage)} />
      <Route path="/pruebas/responder/:token" element={withSuspense(ResponderPruebaPage)} />
      <Route path="/entrevistas/responder/:token" element={withSuspense(ResponderEntrevistaPage)} />
      <Route path="/contratos/firmar/:token" element={withSuspense(FirmarContratoPage)} />
      <Route path="/vacantes" element={withSuspense(VacantesPublicasPage)} />
      <Route path="/vacantes/:id/postular" element={withSuspense(PostulacionPage)} />

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* RUTAS PROTEGIDAS */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AdaptiveLayout />}>
          {/* Dashboard principal */}
          <Route path="/dashboard" element={<DashboardPage />} />

          {/* C0 — Plataforma */}
          {adminGlobalRoutes}

          {/* Perfil y Portales (acceso universal) */}
          {perfilRoutes}
          {portalsRoutes}

          {/* C1 — Fundacion */}
          {fundacionRoutes}

          {/* Infraestructura (PLANEAR) */}
          {gestionDocumentalRoutes}

          {/* Equipo (PLANEAR) */}
          {miEquipoRoutes}

          {/* Planificación (PLANEAR) */}
          {planificacionOperativaRoutes}

          {/* C2 — Modulos de Negocio (independientes) */}
          {planeacionEstrategicaRoutes}
          {proteccionCumplimientoRoutes}
          {workflowsRoutes}
          {gestionIntegralRoutes}

          {/* Cadena de Valor (HACER) */}
          {supplyChainRoutes}
          {productionOpsRoutes}
          {logisticsFleetRoutes}
          {salesCrmRoutes}

          {/* Talento + Soporte (HACER) */}
          {talentHubRoutes}
          {administracionRoutes}
          {tesoreriaRoutes}
          {accountingRoutes}

          {/* Legacy redirects (V1 paths → V2 modules) */}
          {cumplimientoRoutes}
          {riesgosRoutes}
          {hseqRoutes}
          {sistemaGestionRoutes}
          {/* C3 — Inteligencia + Mejora Continua */}
          {analyticsRoutes}
          {revisionDireccionRoutes}
          {accionesMejoraRoutes}
          {auditSystemRoutes}

          {/* Legacy redirects (gestion-estrategica → nuevas rutas) */}
          {gestionEstrategicaRoutes}
        </Route>
      </Route>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* REDIRECT RAIZ Y ERRORES */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <Route path="/" element={<Navigate to="/mi-portal" replace />} />
      <Route path="/error" element={<ErrorPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};
