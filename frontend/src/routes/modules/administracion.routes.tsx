/**
 * Rutas: Administración (módulo independiente V2)
 * Nivel 11A — Soporte (HACER)
 *
 * 3 tabs: Activos Fijos, Servicios Generales, Presupuesto
 */
import { lazy } from 'react';
import { Route, Navigate } from 'react-router-dom';
import { withFullGuard } from '../helpers';

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
      element={withFullGuard(ActivosFijosPage, 'administracion', 'activos_fijos')}
    />
    <Route
      path="/administracion/servicios-generales"
      element={withFullGuard(ServiciosGeneralesPage, 'administracion', 'servicios_generales')}
    />
    <Route
      path="/administracion/presupuesto"
      element={withFullGuard(PresupuestoPage, 'administracion', 'presupuesto')}
    />
  </>
);
