/**
 * Rutas: Production Ops (Operaciones de Produccion)
 * Capa 2 — Modulo de Negocio
 */
import { lazy } from 'react';
import { Route, Navigate } from 'react-router-dom';
import { withModuleGuard } from '../helpers';

const ProductionOpsPage = lazy(() => import('@/features/production-ops/pages/ProductionOpsPage'));

export const productionOpsRoutes = (
  <>
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
  </>
);
