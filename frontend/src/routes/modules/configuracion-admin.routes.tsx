/**
 * Rutas: Configuración de Plataforma (Infraestructura)
 *
 * Módulo: configuracion_plataforma
 * 3 tabs: General, Catálogos, Conexiones
 */
import { lazy } from 'react';
import { Route, Navigate } from 'react-router-dom';
import { withFullGuard } from '../helpers';

const ConfiguracionAdminPage = lazy(
  () => import('@/features/configuracion-admin/pages/ConfiguracionAdminPage')
);

export const configuracionAdminRoutes = (
  <>
    <Route
      path="/configuracion-admin"
      element={<Navigate to="/configuracion-admin/general" replace />}
    />
    <Route
      path="/configuracion-admin/general"
      element={withFullGuard(ConfiguracionAdminPage, 'configuracion_plataforma', 'general')}
    />
    <Route
      path="/configuracion-admin/catalogos"
      element={withFullGuard(ConfiguracionAdminPage, 'configuracion_plataforma', 'catalogos')}
    />
    <Route
      path="/configuracion-admin/conexiones"
      element={withFullGuard(ConfiguracionAdminPage, 'configuracion_plataforma', 'conexiones')}
    />
  </>
);
