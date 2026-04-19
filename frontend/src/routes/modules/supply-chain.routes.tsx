/**
 * Rutas: Supply Chain (Cadena de Suministro)
 * Capa 2 — Módulo de Negocio
 *
 * Secciones (flujo de negocio):
 * proveedores → precios → recepcion → liquidaciones → almacenamiento →
 * evaluaciones → catálogos
 *
 * Compras dormida (tabla existe pero sin UI/URLs). programacion eliminada en S6.
 */
import { lazy } from 'react';
import { Route, Navigate } from 'react-router-dom';
import { withFullGuard } from '../helpers';

const SupplyChainPage = lazy(() =>
  import('@/features/supply-chain').then((m) => ({ default: m.SupplyChainPage }))
);

export const supplyChainRoutes = (
  <>
    <Route path="/supply-chain" element={<Navigate to="/supply-chain/proveedores" replace />} />
    <Route
      path="/supply-chain/proveedores"
      element={withFullGuard(SupplyChainPage, 'supply_chain', 'proveedores')}
    />
    <Route
      path="/supply-chain/precios"
      element={withFullGuard(SupplyChainPage, 'supply_chain', 'precios')}
    />
    <Route
      path="/supply-chain/recepcion"
      element={withFullGuard(SupplyChainPage, 'supply_chain', 'recepcion')}
    />
    <Route
      path="/supply-chain/liquidaciones"
      element={withFullGuard(SupplyChainPage, 'supply_chain', 'liquidaciones')}
    />
    <Route
      path="/supply-chain/almacenamiento"
      element={withFullGuard(SupplyChainPage, 'supply_chain', 'almacenamiento')}
    />
    <Route
      path="/supply-chain/evaluaciones"
      element={withFullGuard(SupplyChainPage, 'supply_chain', 'evaluaciones')}
    />
    <Route
      path="/supply-chain/catalogos"
      element={withFullGuard(SupplyChainPage, 'supply_chain', 'catalogos')}
    />
  </>
);
