/**
 * Rutas: Acciones de Mejora (módulo independiente V2)
 * Nivel 14 — Mejora Continua (ACTUAR)
 *
 * 3 tabs: No Conformidades, Acciones Correctivas, Oportunidades de Mejora
 * Página única con tabs internos.
 */
import { lazy } from 'react';
import { Route, Navigate } from 'react-router-dom';
import { withModuleGuard } from '../helpers';

const AccionesMejoraPage = lazy(
  () => import('@/features/acciones-mejora/pages/AccionesMejoraPage')
);

export const accionesMejoraRoutes = (
  <>
    <Route
      path="/acciones-mejora"
      element={<Navigate to="/acciones-mejora/no-conformidades" replace />}
    />
    <Route
      path="/acciones-mejora/no-conformidades"
      element={withModuleGuard(AccionesMejoraPage, 'acciones_mejora')}
    />
    <Route
      path="/acciones-mejora/acciones-correctivas"
      element={withModuleGuard(AccionesMejoraPage, 'acciones_mejora')}
    />
    <Route
      path="/acciones-mejora/oportunidades-mejora"
      element={withModuleGuard(AccionesMejoraPage, 'acciones_mejora')}
    />
  </>
);
