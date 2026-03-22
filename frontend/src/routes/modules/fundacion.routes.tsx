/**
 * Rutas: Fundación (C1)
 * Constitución de la empresa — Arquitectura Cascada V2
 *
 * Módulo: fundacion
 * Se configura 1 vez, afecta a todos los demás módulos
 *
 * 3 Tabs (flujo empresarial):
 * 1. Mi Empresa — ¿Quién soy? (datos, sedes, unidades de negocio)
 * 2. Mi Contexto e Identidad — ¿Dónde estoy? (stakeholders, contexto, misión, valores, normas, alcance)
 * 3. Mi Organización — ¿Cómo funciono? (procesos, cargos, organigrama, caracterizaciones, mapa)
 *
 * Políticas y Reglamentos se gestionan desde Gestión Documental (Nivel 2)
 */
import { lazy } from 'react';
import { Route, Navigate } from 'react-router-dom';
import { withFullGuard } from '../helpers';

const MiEmpresaPage = lazy(() => import('@/features/gestion-estrategica/pages/MiEmpresaPage'));
const ContextoIdentidadPage = lazy(
  () => import('@/features/gestion-estrategica/pages/ContextoIdentidadPage')
);
const OrganizacionPage = lazy(
  () => import('@/features/gestion-estrategica/pages/OrganizacionPage')
);

export const fundacionRoutes = (
  <>
    <Route path="/fundacion" element={<Navigate to="/fundacion/mi-empresa" replace />} />

    {/* Tab 1: Mi Empresa (empresa, sedes, unidades de negocio) */}
    <Route
      path="/fundacion/mi-empresa"
      element={withFullGuard(MiEmpresaPage, 'fundacion', 'empresa')}
    />

    {/* Tab 2: Mi Contexto e Identidad (stakeholders, contexto, misión, valores, normas, alcance) */}
    <Route
      path="/fundacion/contexto-identidad"
      element={withFullGuard(ContextoIdentidadPage, 'fundacion', 'analisis_contexto')}
    />

    {/* Tab 3: Mi Organización (áreas, cargos, organigrama, caracterizaciones, mapa) */}
    <Route
      path="/fundacion/organizacion"
      element={withFullGuard(OrganizacionPage, 'fundacion', 'organizacion')}
    />
  </>
);
