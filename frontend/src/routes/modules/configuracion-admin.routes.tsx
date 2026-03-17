/**
 * Rutas: Configuración de Plataforma (Infraestructura)
 *
 * Módulo: configuracion_plataforma
 * Centro de control técnico del tenant: módulos, consecutivos,
 * catálogos maestros, integraciones y configuración transversal.
 */
import { lazy } from 'react';
import { Route, Navigate } from 'react-router-dom';
import { withModuleGuard } from '../helpers';

const ConfiguracionAdminPage = lazy(
  () => import('@/features/configuracion-admin/pages/ConfiguracionAdminPage')
);

const GuardedPage = withModuleGuard(ConfiguracionAdminPage, 'configuracion_plataforma');

export const configuracionAdminRoutes = (
  <>
    <Route
      path="/configuracion-admin"
      element={<Navigate to="/configuracion-admin/configuracion" replace />}
    />
    <Route path="/configuracion-admin/configuracion" element={GuardedPage} />
  </>
);
