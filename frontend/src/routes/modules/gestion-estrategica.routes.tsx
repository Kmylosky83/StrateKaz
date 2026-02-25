/**
 * Rutas: Gestion Estrategica
 * Capa 1 (Fundacion) + Capa 2 (Planeacion Estrategica)
 *
 * Incluye: Configuracion, Organizacion, Identidad, Planeacion,
 * Contexto, Proyectos, Riesgos y Oportunidades, Revision Direccion
 */
import { lazy } from 'react';
import { Route, Navigate } from 'react-router-dom';
import { withModuleGuard } from '../helpers';

// Nivel 1-2: Fundacion + Estructura
const ConfiguracionPage = lazy(
  () => import('@/features/gestion-estrategica/pages/ConfiguracionPage')
);
const OrganizacionPage = lazy(
  () => import('@/features/gestion-estrategica/pages/OrganizacionPage')
);

// Nivel 3: Direccion Estrategica
const IdentidadPage = lazy(() => import('@/features/gestion-estrategica/pages/IdentidadPage'));
const PlaneacionPage = lazy(() => import('@/features/gestion-estrategica/pages/PlaneacionPage'));
const ProyectosPage = lazy(() => import('@/features/gestion-estrategica/pages/ProyectosPage'));
const RevisionDireccionPage = lazy(
  () => import('@/features/gestion-estrategica/pages/RevisionDireccionPage')
);
const ContextoPage = lazy(() => import('@/features/gestion-estrategica/pages/ContextoPage'));
const RiesgosOportunidadesPage = lazy(
  () => import('@/features/gestion-estrategica/pages/RiesgosOportunidadesPage')
);

export const gestionEstrategicaRoutes = (
  <>
    <Route
      path="/gestion-estrategica"
      element={<Navigate to="/gestion-estrategica/configuracion" replace />}
    />

    {/* Tab 1: Configuracion (Fundacion) */}
    <Route
      path="/gestion-estrategica/configuracion"
      element={withModuleGuard(ConfiguracionPage, 'gestion_estrategica')}
    />

    {/* Tab 2: Organizacion (Estructura) */}
    <Route
      path="/gestion-estrategica/organizacion"
      element={withModuleGuard(OrganizacionPage, 'gestion_estrategica')}
    />

    {/* Tab 3: Identidad Corporativa */}
    <Route
      path="/gestion-estrategica/identidad"
      element={withModuleGuard(IdentidadPage, 'gestion_estrategica')}
    />

    {/* Tab 4: Planeacion Estrategica */}
    <Route
      path="/gestion-estrategica/planeacion"
      element={withModuleGuard(PlaneacionPage, 'gestion_estrategica')}
    />

    {/* Tab 4b: Contexto Organizacional (DOFA/PESTEL) */}
    <Route
      path="/gestion-estrategica/contexto"
      element={withModuleGuard(ContextoPage, 'gestion_estrategica')}
    />

    {/* Tab 5: Gestion de Proyectos */}
    <Route
      path="/gestion-estrategica/proyectos"
      element={withModuleGuard(ProyectosPage, 'gestion_estrategica')}
    />

    {/* Tab 6: Riesgos y Oportunidades (ISO 6.1) */}
    <Route
      path="/gestion-estrategica/riesgos-oportunidades"
      element={withModuleGuard(RiesgosOportunidadesPage, 'gestion_estrategica')}
    />

    {/* Tab 7: Revision por Direccion (ISO 9.3) */}
    <Route
      path="/gestion-estrategica/revision-direccion"
      element={withModuleGuard(RevisionDireccionPage, 'gestion_estrategica')}
    />

    {/* Legacy redirects: Soporte Estrategico -> Sistema de Gestion */}
    <Route
      path="/soporte-estrategico"
      element={<Navigate to="/sistema-gestion/documentos" replace />}
    />
    <Route
      path="/soporte-estrategico/gestion-documental"
      element={<Navigate to="/sistema-gestion/documentos" replace />}
    />
    <Route
      path="/soporte-estrategico/planificacion-sistema"
      element={<Navigate to="/sistema-gestion/planificacion" replace />}
    />
  </>
);
