/**
 * Rutas: Fundación (C1)
 * Configuración organizacional, estructura y identidad corporativa
 *
 * Módulo: fundacion
 * Se configura 1 vez, afecta a todos los demás módulos
 */
import { lazy } from 'react';
import { Route, Navigate } from 'react-router-dom';
import { withModuleGuard } from '../helpers';

const ConfiguracionPage = lazy(
  () => import('@/features/gestion-estrategica/pages/ConfiguracionPage')
);
const OrganizacionPage = lazy(
  () => import('@/features/gestion-estrategica/pages/OrganizacionPage')
);
const IdentidadPage = lazy(() => import('@/features/gestion-estrategica/pages/IdentidadPage'));

export const fundacionRoutes = (
  <>
    <Route path="/fundacion" element={<Navigate to="/fundacion/configuracion" replace />} />

    {/* Tab 1: Configuración (empresa, sedes, normas, módulos) */}
    <Route
      path="/fundacion/configuracion"
      element={withModuleGuard(ConfiguracionPage, 'fundacion')}
    />

    {/* Tab 2: Organización (procesos, mapa, consecutivos) */}
    <Route
      path="/fundacion/organizacion"
      element={withModuleGuard(OrganizacionPage, 'fundacion')}
    />

    {/* Tab 3: Identidad Corporativa (misión, visión, valores, políticas) */}
    <Route path="/fundacion/identidad" element={withModuleGuard(IdentidadPage, 'fundacion')} />
  </>
);
