/**
 * Rutas: Sistema de Gestión
 * Gestión documental, planificación, auditorías internas, acciones de mejora, calidad
 *
 * Pages:
 * - GestionDocumental: features/gestion-estrategica/pages/
 * - Planificacion: features/gestion-estrategica/pages/PlanificacionSistemaPage
 * - Auditorías: features/gestion-estrategica/pages/ (consume hooks de hseq)
 * - Acciones Mejora: features/gestion-estrategica/pages/ (consume hooks de hseq)
 * - Calidad: features/hseq/ (migrada desde HSEQ → SGI)
 */
import { lazy } from 'react';
import { Route, Navigate } from 'react-router-dom';
import { withModuleGuard } from '../helpers';

const SGGestionDocumentalPage = lazy(
  () => import('@/features/gestion-estrategica/pages/GestionDocumentalPage')
);
const SGPlanificacionPage = lazy(
  () => import('@/features/gestion-estrategica/pages/PlanificacionSistemaPage')
);
const SGAuditoriasPage = lazy(
  () => import('@/features/gestion-estrategica/pages/AuditoriasInternasPage')
);
const SGAccionesMejoraPage = lazy(
  () => import('@/features/gestion-estrategica/pages/AccionesMejoraPage')
);
const SGCalidadPage = lazy(() =>
  import('@/features/hseq').then((m) => ({ default: m.CalidadPage }))
);

export const sistemaGestionRoutes = (
  <>
    <Route
      path="/sistema-gestion"
      element={<Navigate to="/sistema-gestion/planificacion" replace />}
    />
    <Route
      path="/sistema-gestion/documentos"
      element={withModuleGuard(SGGestionDocumentalPage, 'sistema_gestion')}
    />
    <Route
      path="/sistema-gestion/planificacion"
      element={withModuleGuard(SGPlanificacionPage, 'sistema_gestion')}
    />
    <Route
      path="/sistema-gestion/auditorias"
      element={withModuleGuard(SGAuditoriasPage, 'sistema_gestion')}
    />
    <Route
      path="/sistema-gestion/acciones"
      element={withModuleGuard(SGAccionesMejoraPage, 'sistema_gestion')}
    />
    <Route
      path="/sistema-gestion/calidad"
      element={withModuleGuard(SGCalidadPage, 'sistema_gestion')}
    />
  </>
);
