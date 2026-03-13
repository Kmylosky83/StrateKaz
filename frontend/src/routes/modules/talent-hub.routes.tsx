/**
 * Rutas: Talent Hub (Centro de Talento Humano)
 * Capa 2 — Modulo de Negocio
 */
import { lazy } from 'react';
import { Route, Navigate } from 'react-router-dom';
import { withModuleGuard } from '../helpers';

const TalentHubPage = lazy(() =>
  import('@/features/talent-hub').then((m) => ({ default: m.TalentHubPage }))
);

export const talentHubRoutes = (
  <>
    <Route path="/talento" element={<Navigate to="/talento/estructura" replace />} />
    <Route path="/talento/estructura" element={withModuleGuard(TalentHubPage, 'talent_hub')} />
    <Route path="/talento/seleccion" element={withModuleGuard(TalentHubPage, 'talent_hub')} />
    <Route path="/talento/colaboradores" element={withModuleGuard(TalentHubPage, 'talent_hub')} />
    <Route path="/talento/onboarding" element={withModuleGuard(TalentHubPage, 'talent_hub')} />
    <Route path="/talento/formacion" element={withModuleGuard(TalentHubPage, 'talent_hub')} />
    <Route path="/talento/desempeno" element={withModuleGuard(TalentHubPage, 'talent_hub')} />
    <Route path="/talento/control-tiempo" element={withModuleGuard(TalentHubPage, 'talent_hub')} />
    <Route path="/talento/novedades" element={withModuleGuard(TalentHubPage, 'talent_hub')} />
    <Route path="/talento/disciplinario" element={withModuleGuard(TalentHubPage, 'talent_hub')} />
    <Route path="/talento/nomina" element={withModuleGuard(TalentHubPage, 'talent_hub')} />
    <Route path="/talento/off-boarding" element={withModuleGuard(TalentHubPage, 'talent_hub')} />
    <Route
      path="/talento/consultores-externos"
      element={withModuleGuard(TalentHubPage, 'talent_hub')}
    />
  </>
);
