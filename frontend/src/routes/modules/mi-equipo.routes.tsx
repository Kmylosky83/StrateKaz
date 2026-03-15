/**
 * Rutas: Mi Equipo (módulo independiente V2)
 * Nivel 4 — Equipo Humano (PLANEAR)
 *
 * 4 tabs: Perfiles de Cargo, Selección, Colaboradores, Onboarding
 * Ciclo de vinculación del colaborador.
 */
import { lazy } from 'react';
import { Route, Navigate } from 'react-router-dom';
import { withModuleGuard } from '../helpers';

const MiEquipoModulePage = lazy(() => import('@/features/mi-equipo/pages/MiEquipoModulePage'));

export const miEquipoRoutes = (
  <>
    <Route path="/mi-equipo" element={<Navigate to="/mi-equipo/perfiles-cargo" replace />} />

    {/* Tab 1: Perfiles de Cargo */}
    <Route
      path="/mi-equipo/perfiles-cargo"
      element={withModuleGuard(MiEquipoModulePage, 'mi_equipo')}
    />

    {/* Tab 2: Selección y Contratación */}
    <Route path="/mi-equipo/seleccion" element={withModuleGuard(MiEquipoModulePage, 'mi_equipo')} />

    {/* Tab 3: Colaboradores */}
    <Route
      path="/mi-equipo/colaboradores"
      element={withModuleGuard(MiEquipoModulePage, 'mi_equipo')}
    />

    {/* Tab 4: Onboarding e Inducción */}
    <Route
      path="/mi-equipo/onboarding"
      element={withModuleGuard(MiEquipoModulePage, 'mi_equipo')}
    />
  </>
);
