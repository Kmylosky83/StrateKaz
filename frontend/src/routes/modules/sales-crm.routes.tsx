/**
 * Rutas: Sales CRM (Ventas y CRM)
 * Capa 2 — Modulo de Negocio
 */
import { lazy } from 'react';
import { Route, Navigate } from 'react-router-dom';
import { withFullGuard } from '../helpers';

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
    <Route path="/ventas/clientes" element={withFullGuard(ClientesPage, 'sales_crm', 'clientes')} />
    <Route path="/ventas/pipeline" element={withFullGuard(PipelinePage, 'sales_crm', 'pipeline')} />
    <Route
      path="/ventas/cotizaciones"
      element={withFullGuard(CotizacionesPage, 'sales_crm', 'cotizaciones')}
    />
    <Route path="/ventas/pedidos" element={withFullGuard(PedidosPage, 'sales_crm', 'pedidos')} />
    <Route path="/ventas/facturas" element={withFullGuard(FacturasPage, 'sales_crm', 'facturas')} />
    <Route path="/ventas/pqrs" element={withFullGuard(PQRSPage, 'sales_crm', 'pqrs')} />
    <Route
      path="/ventas/encuestas"
      element={withFullGuard(EncuestasPage, 'sales_crm', 'encuestas')}
    />
    <Route
      path="/ventas/fidelizacion"
      element={withFullGuard(FidelizacionPage, 'sales_crm', 'fidelizacion')}
    />
  </>
);
