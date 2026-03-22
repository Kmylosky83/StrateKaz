/**
 * Rutas: Production Ops (Operaciones de Produccion)
 * Capa 2 — Modulo de Negocio
 */
import { lazy } from 'react';
import { Route, Navigate } from 'react-router-dom';
import { withFullGuard } from '../helpers';

const ProductionOpsPage = lazy(() => import('@/features/production-ops/pages/ProductionOpsPage'));

export const productionOpsRoutes = (
  <>
    <Route path="/produccion" element={<Navigate to="/produccion/recepcion" replace />} />
    <Route
      path="/produccion/recepcion"
      element={withFullGuard(ProductionOpsPage, 'production_ops', 'recepcion')}
    />
    <Route
      path="/produccion/procesamiento"
      element={withFullGuard(ProductionOpsPage, 'production_ops', 'procesamiento')}
    />
    <Route
      path="/produccion/mantenimiento"
      element={withFullGuard(ProductionOpsPage, 'production_ops', 'mantenimiento')}
    />
    <Route
      path="/produccion/producto-terminado"
      element={withFullGuard(ProductionOpsPage, 'production_ops', 'producto_terminado')}
    />
  </>
);
