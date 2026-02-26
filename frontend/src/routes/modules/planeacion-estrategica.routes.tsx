/**
 * Rutas: Planeación Estratégica (C2)
 * Contexto organizacional, planeación BSC, riesgos/oportunidades y proyectos
 *
 * Módulo: planeacion_estrategica
 * Independiente de otros C2
 */
import { lazy } from 'react';
import { Route, Navigate } from 'react-router-dom';
import { withModuleGuard } from '../helpers';

const ContextoPage = lazy(() => import('@/features/gestion-estrategica/pages/ContextoPage'));
const PlaneacionPage = lazy(() => import('@/features/gestion-estrategica/pages/PlaneacionPage'));
const RiesgosOportunidadesPage = lazy(
  () => import('@/features/gestion-estrategica/pages/RiesgosOportunidadesPage')
);
const ProyectosPage = lazy(() => import('@/features/gestion-estrategica/pages/ProyectosPage'));

export const planeacionEstrategicaRoutes = (
  <>
    <Route
      path="/planeacion-estrategica"
      element={<Navigate to="/planeacion-estrategica/contexto" replace />}
    />

    {/* Tab 1: Contexto Organizacional (DOFA, PESTEL, Porter, TOWS) */}
    <Route
      path="/planeacion-estrategica/contexto"
      element={withModuleGuard(ContextoPage, 'planeacion_estrategica')}
    />

    {/* Tab 2: Planeación Estratégica (BSC, KPIs, mapa estratégico) */}
    <Route
      path="/planeacion-estrategica/planeacion"
      element={withModuleGuard(PlaneacionPage, 'planeacion_estrategica')}
    />

    {/* Tab 3: Riesgos y Oportunidades (ISO 6.1) */}
    <Route
      path="/planeacion-estrategica/riesgos-oportunidades"
      element={withModuleGuard(RiesgosOportunidadesPage, 'planeacion_estrategica')}
    />

    {/* Tab 4: Gestión de Proyectos */}
    <Route
      path="/planeacion-estrategica/proyectos"
      element={withModuleGuard(ProyectosPage, 'planeacion_estrategica')}
    />
  </>
);
