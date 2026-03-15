/**
 * Rutas: Supply Chain (Cadena de Suministro)
 * Capa 2 — Módulo de Negocio
 *
 * Página unificada con 7 tabs en flujo de negocio:
 * proveedores → precios → compras → almacenamiento → programación →
 * evaluaciones → catálogos
 */
import { lazy } from 'react';
import { Route, Navigate } from 'react-router-dom';
import { withModuleGuard } from '../helpers';

const SupplyChainPage = lazy(() =>
  import('@/features/supply-chain').then((m) => ({ default: m.SupplyChainPage }))
);

export const supplyChainRoutes = (
  <>
    <Route path="/supply-chain" element={<Navigate to="/supply-chain/proveedores" replace />} />
    <Route
      path="/supply-chain/proveedores"
      element={withModuleGuard(SupplyChainPage, 'supply_chain')}
    />
    <Route
      path="/supply-chain/precios"
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
      path="/supply-chain/programacion"
      element={withModuleGuard(SupplyChainPage, 'supply_chain')}
    />
    <Route
      path="/supply-chain/evaluaciones"
      element={withModuleGuard(SupplyChainPage, 'supply_chain')}
    />
    {/* unidades-negocio migrado a Fundación/Mi Empresa */}
    <Route
      path="/supply-chain/unidades-negocio"
      element={<Navigate to="/fundacion/mi-empresa" replace />}
    />
    <Route
      path="/supply-chain/catalogos"
      element={withModuleGuard(SupplyChainPage, 'supply_chain')}
    />
  </>
);
