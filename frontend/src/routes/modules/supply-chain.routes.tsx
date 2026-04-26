/**
 * Rutas: Supply Chain (Cadena de Suministro)
 * Capa 2 — Módulo de Negocio.
 *
 * Secciones LIVE post refactor 2026-04-21 (Proveedor → CT):
 *   precios → recepcion → liquidaciones → almacenamiento → catálogos
 *
 * REDIRECT: /supply-chain/proveedores → /catalogo-productos/proveedores
 * ELIMINADO: evaluaciones (scope Admin/Compras futuro)
 * Compras dormida (tabla existe sin UI activa).
 */
import { lazy } from 'react';
import { Route, Navigate } from 'react-router-dom';
import { withFullGuard } from '../helpers';

const SupplyChainPage = lazy(() =>
  import('@/features/supply-chain').then((m) => ({ default: m.SupplyChainPage }))
);

export const supplyChainRoutes = (
  <>
    <Route path="/supply-chain" element={<Navigate to="/supply-chain/precios" replace />} />
    {/* Redirect legacy path — modelo Proveedor movido a CT (2026-04-21). */}
    <Route
      path="/supply-chain/proveedores"
      element={<Navigate to="/catalogo-productos/proveedores" replace />}
    />
    <Route
      path="/supply-chain/precios"
      element={withFullGuard(SupplyChainPage, 'supply_chain', 'precios')}
    />
    <Route
      path="/supply-chain/recoleccion"
      element={withFullGuard(SupplyChainPage, 'supply_chain', 'vouchers_recoleccion')}
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
      path="/supply-chain/catalogos"
      element={withFullGuard(SupplyChainPage, 'supply_chain', 'catalogos')}
    />
    {/* H-SC-10: catálogo de rutas de recolección (reemplaza dropdown UNeg en vouchers) */}
    <Route
      path="/supply-chain/rutas-recoleccion"
      element={withFullGuard(SupplyChainPage, 'supply_chain', 'catalogos_sc')}
    />
    {/* Fase 1 QC: parámetros de calidad y sus rangos */}
    <Route
      path="/supply-chain/parametros-calidad"
      element={withFullGuard(SupplyChainPage, 'supply_chain', 'catalogos_sc')}
    />
    {/* Fase 1 Inventario: dashboard por almacén + kardex */}
    <Route
      path="/supply-chain/inventario"
      element={withFullGuard(SupplyChainPage, 'supply_chain', 'almacenamiento')}
    />
  </>
);
