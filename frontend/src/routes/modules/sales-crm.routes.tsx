/**
 * Rutas: Sales CRM (Ventas y CRM)
 * Capa 2 — Modulo de Negocio
 */
import { lazy } from 'react';
import { Route, Navigate } from 'react-router-dom';
import { withModuleGuard } from '../helpers';

const ClientesPage = lazy(() =>
  import('@/features/sales-crm').then((m) => ({ default: m.ClientesPage }))
);
const PipelinePage = lazy(() =>
  import('@/features/sales-crm').then((m) => ({ default: m.PipelinePage }))
);
const CotizacionesPage = lazy(() =>
  import('@/features/sales-crm').then((m) => ({ default: m.CotizacionesPage }))
);
const PedidosPage = lazy(() =>
  import('@/features/sales-crm').then((m) => ({ default: m.PedidosPage }))
);
const FacturasPage = lazy(() =>
  import('@/features/sales-crm').then((m) => ({ default: m.FacturasPage }))
);
const PQRSPage = lazy(() => import('@/features/sales-crm').then((m) => ({ default: m.PQRSPage })));
const EncuestasPage = lazy(() =>
  import('@/features/sales-crm').then((m) => ({ default: m.EncuestasPage }))
);
const FidelizacionPage = lazy(() =>
  import('@/features/sales-crm').then((m) => ({ default: m.FidelizacionPage }))
);

export const salesCrmRoutes = (
  <>
    <Route path="/ventas" element={<Navigate to="/ventas/clientes" replace />} />
    <Route path="/ventas/clientes" element={withModuleGuard(ClientesPage, 'sales_crm')} />
    <Route path="/ventas/pipeline" element={withModuleGuard(PipelinePage, 'sales_crm')} />
    <Route path="/ventas/cotizaciones" element={withModuleGuard(CotizacionesPage, 'sales_crm')} />
    <Route path="/ventas/pedidos" element={withModuleGuard(PedidosPage, 'sales_crm')} />
    <Route path="/ventas/facturas" element={withModuleGuard(FacturasPage, 'sales_crm')} />
    <Route path="/ventas/pqrs" element={withModuleGuard(PQRSPage, 'sales_crm')} />
    <Route path="/ventas/encuestas" element={withModuleGuard(EncuestasPage, 'sales_crm')} />
    <Route path="/ventas/fidelizacion" element={withModuleGuard(FidelizacionPage, 'sales_crm')} />
  </>
);
