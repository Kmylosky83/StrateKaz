/**
 * Rutas: Planificación Operativa (módulo independiente V2)
 * Nivel 5 — Planificación (PLANEAR)
 *
 * 1 tab: Planificación del Sistema (plan de trabajo, programas, recursos)
 */
import { lazy } from 'react';
import { Route, Navigate } from 'react-router-dom';
import { withFullGuard } from '../helpers';

const PlanificacionSistemaPage = lazy(
  () => import('@/features/planificacion-operativa/pages/PlanificacionSistemaPage')
);

export const planificacionOperativaRoutes = (
  <>
    <Route
      path="/planificacion-operativa"
      element={<Navigate to="/planificacion-operativa/planificacion" replace />}
    />
    <Route
      path="/planificacion-operativa/planificacion"
      element={withFullGuard(PlanificacionSistemaPage, 'planificacion_operativa', 'planificacion')}
    />
  </>
);
