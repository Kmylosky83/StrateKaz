/**
 * Rutas: Administración (módulo independiente V2)
 * Nivel 11A — Soporte (HACER)
 *
 * 3 tabs: Activos Fijos, Servicios Generales, Presupuesto
 */
import { lazy } from 'react';
import { Route, Navigate } from 'react-router-dom';
import { withModuleGuard } from '../helpers';

const ActivosFijosPage = lazy(() =>
  import('@/features/administracion').then((m) => ({ default: m.ActivosFijosPage }))
);
const ServiciosGeneralesPage = lazy(() =>
  import('@/features/administracion').then((m) => ({ default: m.ServiciosGeneralesPage }))
);
const PresupuestoPage = lazy(() =>
  import('@/features/administracion').then((m) => ({ default: m.PresupuestoPage }))
);

export const administracionRoutes = (
  <>
    <Route
      path="/administracion"
      element={<Navigate to="/administracion/activos-fijos" replace />}
    />
    <Route
      path="/administracion/activos-fijos"
      element={withModuleGuard(ActivosFijosPage, 'administracion')}
    />
    <Route
      path="/administracion/servicios-generales"
      element={withModuleGuard(ServiciosGeneralesPage, 'administracion')}
    />
    <Route
      path="/administracion/presupuesto"
      element={withModuleGuard(PresupuestoPage, 'administracion')}
    />
  </>
);
