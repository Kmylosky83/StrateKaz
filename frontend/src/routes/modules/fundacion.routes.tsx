/**
 * Rutas: Fundación (C1)
 * Constitución de la empresa: identidad, organización y sistema de gestión
 *
 * Módulo: fundacion
 * Se configura 1 vez, afecta a todos los demás módulos
 *
 * Tabs (flujo empresarial):
 * 1. Mi Empresa — ¿Quién soy? (datos, misión/visión, valores, sedes)
 * 2. Mi Organización — ¿Cómo funciono? (procesos, caracterizaciones, mapa)
 * 3. Mi Sistema de Gestión — ¿Con qué reglas opero? (normas, alcance, políticas, config)
 */
import { lazy } from 'react';
import { Route, Navigate } from 'react-router-dom';
import { withModuleGuard } from '../helpers';

const MiEmpresaPage = lazy(() => import('@/features/gestion-estrategica/pages/MiEmpresaPage'));
const OrganizacionPage = lazy(
  () => import('@/features/gestion-estrategica/pages/OrganizacionPage')
);
const MiSistemaGestionPage = lazy(
  () => import('@/features/gestion-estrategica/pages/MiSistemaGestionPage')
);

export const fundacionRoutes = (
  <>
    <Route path="/fundacion" element={<Navigate to="/fundacion/mi-empresa" replace />} />

    {/* Tab 1: Mi Empresa (empresa, misión/visión, valores, sedes) */}
    <Route path="/fundacion/mi-empresa" element={withModuleGuard(MiEmpresaPage, 'fundacion')} />

    {/* Tab 2: Mi Organización (procesos, caracterizaciones, mapa) */}
    <Route
      path="/fundacion/organizacion"
      element={withModuleGuard(OrganizacionPage, 'fundacion')}
    />

    {/* Tab 3: Mi Sistema de Gestión (normas, alcance, políticas, consecutivos, módulos, integraciones) */}
    <Route
      path="/fundacion/sistema-gestion"
      element={withModuleGuard(MiSistemaGestionPage, 'fundacion')}
    />
  </>
);
