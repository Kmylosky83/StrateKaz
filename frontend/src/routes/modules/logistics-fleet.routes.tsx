/**
 * Rutas: Logistics Fleet (Logistica y Flota)
 * Capa 2 — Modulo de Negocio
 */
import { lazy } from 'react';
import { Route, Navigate } from 'react-router-dom';
import { withFullGuard } from '../helpers';

const LogisticsFleetPage = lazy(
  () => import('@/features/logistics-fleet/pages/LogisticsFleetPage')
);

export const logisticsFleetRoutes = (
  <>
    <Route path="/logistica" element={<Navigate to="/logistica/transporte" replace />} />
    <Route
      path="/logistica/transporte"
      element={withFullGuard(LogisticsFleetPage, 'logistics_fleet', 'transporte')}
    />
    <Route
      path="/logistica/despachos"
      element={withFullGuard(LogisticsFleetPage, 'logistics_fleet', 'despachos')}
    />
    <Route
      path="/logistica/flota"
      element={withFullGuard(LogisticsFleetPage, 'logistics_fleet', 'flota')}
    />
    <Route
      path="/logistica/pesv"
      element={withFullGuard(LogisticsFleetPage, 'logistics_fleet', 'pesv')}
    />
  </>
);
