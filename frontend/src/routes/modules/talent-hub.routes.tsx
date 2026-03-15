/**
 * Rutas: Talent Hub (Centro de Talento Humano — gestión continua)
 * Capa 2 — Módulo de Negocio (Cascada V2)
 *
 * Cascada V2: Los tabs de vinculación (perfiles, selección, colaboradores,
 * onboarding) se movieron al módulo Mi Equipo (/mi-equipo/).
 * Talent Hub conserva la gestión continua del ciclo de vida.
 */
import { lazy } from 'react';
import { Route, Navigate } from 'react-router-dom';
import { withModuleGuard } from '../helpers';

const TalentHubPage = lazy(() =>
  import('@/features/talent-hub').then((m) => ({ default: m.TalentHubPage }))
);

export const talentHubRoutes = (
  <>
    <Route path="/talento" element={<Navigate to="/talento/formacion" replace />} />

    {/* Legacy redirects → Mi Equipo (módulo independiente V2) */}
    <Route path="/talento/estructura" element={<Navigate to="/fundacion/organizacion" replace />} />
    <Route
      path="/talento/perfiles-cargo"
      element={<Navigate to="/mi-equipo/perfiles-cargo" replace />}
    />
    <Route path="/talento/seleccion" element={<Navigate to="/mi-equipo/seleccion" replace />} />
    <Route
      path="/talento/colaboradores"
      element={<Navigate to="/mi-equipo/colaboradores" replace />}
    />
    <Route path="/talento/onboarding" element={<Navigate to="/mi-equipo/onboarding" replace />} />

    {/* Talent Hub — Gestión continua */}
    <Route path="/talento/formacion" element={withModuleGuard(TalentHubPage, 'talent_hub')} />
    <Route path="/talento/desempeno" element={withModuleGuard(TalentHubPage, 'talent_hub')} />
    <Route path="/talento/control-tiempo" element={withModuleGuard(TalentHubPage, 'talent_hub')} />
    <Route
      path="/talento/novedades-nomina"
      element={withModuleGuard(TalentHubPage, 'talent_hub')}
    />
    <Route path="/talento/disciplinario" element={withModuleGuard(TalentHubPage, 'talent_hub')} />
    <Route path="/talento/off-boarding" element={withModuleGuard(TalentHubPage, 'talent_hub')} />
    <Route
      path="/talento/consultores-externos"
      element={withModuleGuard(TalentHubPage, 'talent_hub')}
    />

    {/* Legacy redirects (tabs fusionados en V2) */}
    <Route
      path="/talento/novedades"
      element={<Navigate to="/talento/novedades-nomina" replace />}
    />
    <Route path="/talento/nomina" element={<Navigate to="/talento/novedades-nomina" replace />} />
  </>
);
