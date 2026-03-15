/**
 * Rutas: Fundación (C1)
 * Constitución de la empresa — Arquitectura Cascada V2
 *
 * Módulo: fundacion
 * Se configura 1 vez, afecta a todos los demás módulos
 *
 * 4 Tabs (flujo empresarial PHVA):
 * 1. Mi Empresa — ¿Quién soy? (datos, sedes, unidades de negocio)
 * 2. Mi Contexto e Identidad — ¿Dónde estoy? (stakeholders, contexto, misión, valores, normas, alcance)
 * 3. Mi Organización — ¿Cómo funciono? (procesos, cargos, organigrama, caracterizaciones, mapa)
 * 4. Mis Políticas y Reglamentos — ¿Con qué reglas opero? (políticas, reglamento, contratos tipo)
 */
import { lazy } from 'react';
import { Route, Navigate } from 'react-router-dom';
import { withModuleGuard } from '../helpers';

const MiEmpresaPage = lazy(() => import('@/features/gestion-estrategica/pages/MiEmpresaPage'));
const ContextoIdentidadPage = lazy(
  () => import('@/features/gestion-estrategica/pages/ContextoIdentidadPage')
);
const OrganizacionPage = lazy(
  () => import('@/features/gestion-estrategica/pages/OrganizacionPage')
);
const PoliticasReglamentosPage = lazy(
  () => import('@/features/gestion-estrategica/pages/PoliticasReglamentosPage')
);

export const fundacionRoutes = (
  <>
    <Route path="/fundacion" element={<Navigate to="/fundacion/mi-empresa" replace />} />

    {/* Tab 1: Mi Empresa (empresa, sedes, unidades de negocio) */}
    <Route path="/fundacion/mi-empresa" element={withModuleGuard(MiEmpresaPage, 'fundacion')} />

    {/* Tab 2: Mi Contexto e Identidad (stakeholders, contexto, misión, valores, normas, alcance) */}
    <Route
      path="/fundacion/contexto-identidad"
      element={withModuleGuard(ContextoIdentidadPage, 'fundacion')}
    />

    {/* Tab 3: Mi Organización (áreas, cargos, organigrama, caracterizaciones, mapa) */}
    <Route
      path="/fundacion/organizacion"
      element={withModuleGuard(OrganizacionPage, 'fundacion')}
    />

    {/* Tab 4: Mis Políticas y Reglamentos (políticas obligatorias, reglamento interno, contratos tipo) */}
    <Route
      path="/fundacion/politicas-reglamentos"
      element={withModuleGuard(PoliticasReglamentosPage, 'fundacion')}
    />
  </>
);
