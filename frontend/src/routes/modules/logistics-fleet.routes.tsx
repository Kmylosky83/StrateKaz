/**
 * Rutas: Logistics Fleet (Logistica y Flota)
 * Capa 2 — Modulo de Negocio
 */
import { lazy } from 'react';
import { Route, Navigate } from 'react-router-dom';
import { withModuleGuard } from '../helpers';

const LogisticsFleetPage = lazy(
  () => import('@/features/logistics-fleet/pages/LogisticsFleetPage')
);

export const logisticsFleetRoutes = (
  <>
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
  </>
);
