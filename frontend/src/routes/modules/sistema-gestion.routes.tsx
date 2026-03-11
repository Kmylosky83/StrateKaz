/**
 * Rutas: Sistema de Gestión
 * Plan maestro de trabajo, gestión documental, auditorías internas, acciones de mejora
 *
 * Pages:
 * - Planificacion: features/gestion-estrategica/pages/PlanificacionSistemaPage
 * - GestionDocumental: features/gestion-estrategica/pages/GestionDocumentalPage
 * - Auditorías: features/gestion-estrategica/pages/AuditoriasInternasPage
 * - Acciones Mejora: features/gestion-estrategica/pages/AccionesMejoraPage
 */
import { lazy } from 'react';
import { Route, Navigate } from 'react-router-dom';
import { withModuleGuard } from '../helpers';

const SGPlanificacionPage = lazy(
  () => import('@/features/gestion-estrategica/pages/PlanificacionSistemaPage')
);
const SGGestionDocumentalPage = lazy(
  () => import('@/features/gestion-estrategica/pages/GestionDocumentalPage')
);
const SGAuditoriasPage = lazy(
  () => import('@/features/gestion-estrategica/pages/AuditoriasInternasPage')
);
const SGAccionesMejoraPage = lazy(
  () => import('@/features/gestion-estrategica/pages/AccionesMejoraPage')
);

export const sistemaGestionRoutes = (
  <>
    <Route
      path="/sistema-gestion"
      element={<Navigate to="/sistema-gestion/planificacion" replace />}
    />
    <Route
      path="/sistema-gestion/planificacion"
      element={withModuleGuard(SGPlanificacionPage, 'sistema_gestion')}
    />
    <Route
      path="/sistema-gestion/documentos"
      element={withModuleGuard(SGGestionDocumentalPage, 'sistema_gestion')}
    />
    <Route
      path="/sistema-gestion/auditorias"
      element={withModuleGuard(SGAuditoriasPage, 'sistema_gestion')}
    />
    <Route
      path="/sistema-gestion/acciones"
      element={withModuleGuard(SGAccionesMejoraPage, 'sistema_gestion')}
    />
  </>
);
