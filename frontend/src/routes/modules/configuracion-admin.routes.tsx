/**
 * Rutas: Configuración de Plataforma (Infraestructura)
 *
 * Módulo: configuracion_plataforma
 * 3 tabs: General, Catálogos, Conexiones
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
      element={<Navigate to="/configuracion-admin/general" replace />}
    />
    <Route path="/configuracion-admin/general" element={GuardedPage} />
    <Route path="/configuracion-admin/catalogos" element={GuardedPage} />
    <Route path="/configuracion-admin/conexiones" element={GuardedPage} />
  </>
);
