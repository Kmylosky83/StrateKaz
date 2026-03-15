/**
 * Rutas: Admin Finance (legacy — redirects a módulos V2)
 *
 * Cascada V2 dividió admin_finance en 2 módulos:
 * - administracion → /administracion/
 * - tesoreria → /tesoreria/
 */
import { Route, Navigate } from 'react-router-dom';

export const adminFinanceRoutes = (
  <>
    <Route path="/finanzas" element={<Navigate to="/tesoreria/tesoreria" replace />} />
    <Route path="/finanzas/tesoreria" element={<Navigate to="/tesoreria/tesoreria" replace />} />
    <Route
      path="/finanzas/presupuesto"
      element={<Navigate to="/administracion/presupuesto" replace />}
    />
    <Route
      path="/finanzas/activos-fijos"
      element={<Navigate to="/administracion/activos-fijos" replace />}
    />
    <Route
      path="/finanzas/servicios-generales"
      element={<Navigate to="/administracion/servicios-generales" replace />}
    />
  </>
);
