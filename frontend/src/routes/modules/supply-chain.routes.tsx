/**
 * Rutas: Supply Chain (Cadena de Suministro)
 * Capa 2 — Modulo de Negocio
 */
import { lazy } from 'react';
import { Route, Navigate } from 'react-router-dom';
import { withModuleGuard } from '../helpers';

const SupplyChainPage = lazy(() =>
  import('@/features/supply-chain').then((m) => ({ default: m.SupplyChainPage }))
);
const GestionProveedoresPage = lazy(() =>
  import('@/features/supply-chain').then((m) => ({ default: m.GestionProveedoresPage }))
);

export const supplyChainRoutes = (
  <>
    <Route path="/supply-chain" element={<Navigate to="/supply-chain/proveedores" replace />} />
    <Route
      path="/supply-chain/proveedores"
      element={withModuleGuard(GestionProveedoresPage, 'supply_chain')}
    />
    <Route
      path="/supply-chain/programacion"
      element={withModuleGuard(SupplyChainPage, 'supply_chain')}
    />
    <Route
      path="/supply-chain/compras"
      element={withModuleGuard(SupplyChainPage, 'supply_chain')}
    />
    <Route
      path="/supply-chain/almacenamiento"
      element={withModuleGuard(SupplyChainPage, 'supply_chain')}
    />
    <Route
      path="/supply-chain/pruebas-acidez"
      element={withModuleGuard(SupplyChainPage, 'supply_chain')}
    />
    <Route
      path="/supply-chain/catalogos"
      element={withModuleGuard(SupplyChainPage, 'supply_chain')}
    />
  </>
);
