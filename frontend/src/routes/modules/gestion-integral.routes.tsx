/**
 * Rutas: Gestión Integral (módulo independiente V2)
 * Nivel 8 — HSEQ (HACER)
 *
 * 7 tabs operativos: medicina laboral, seguridad industrial,
 * higiene industrial, comités, accidentalidad, emergencias, ambiental.
 * Páginas en features/hseq/pages/
 */
import { lazy } from 'react';
import { Route, Navigate } from 'react-router-dom';
import { withModuleGuard } from '../helpers';

const HSEQPage = lazy(() => import('@/features/hseq').then((m) => ({ default: m.HSEQPage })));
const MedicinaLaboralPage = lazy(() =>
  import('@/features/hseq').then((m) => ({ default: m.MedicinaLaboralPage }))
);
const SeguridadIndustrialPage = lazy(() =>
  import('@/features/hseq').then((m) => ({ default: m.SeguridadIndustrialPage }))
);
const HigieneIndustrialPage = lazy(() =>
  import('@/features/hseq').then((m) => ({ default: m.HigieneIndustrialPage }))
);
const GestionComitesPage = lazy(() =>
  import('@/features/hseq').then((m) => ({ default: m.GestionComitesPage }))
);
const AccidentalidadPage = lazy(() =>
  import('@/features/hseq').then((m) => ({ default: m.AccidentalidadPage }))
);
const EmergenciasPage = lazy(() =>
  import('@/features/hseq').then((m) => ({ default: m.EmergenciasPage }))
);
const GestionAmbientalPage = lazy(() =>
  import('@/features/hseq').then((m) => ({ default: m.GestionAmbientalPage }))
);

const MODULE = 'gestion_integral';

export const gestionIntegralRoutes = (
  <>
    <Route
      path="/gestion-integral"
      element={<Navigate to="/gestion-integral/medicina-laboral" replace />}
    />
    <Route path="/gestion-integral/dashboard" element={withModuleGuard(HSEQPage, MODULE)} />
    <Route
      path="/gestion-integral/medicina-laboral"
      element={withModuleGuard(MedicinaLaboralPage, MODULE)}
    />
    <Route
      path="/gestion-integral/seguridad-industrial"
      element={withModuleGuard(SeguridadIndustrialPage, MODULE)}
    />
    <Route
      path="/gestion-integral/higiene-industrial"
      element={withModuleGuard(HigieneIndustrialPage, MODULE)}
    />
    <Route path="/gestion-integral/comites" element={withModuleGuard(GestionComitesPage, MODULE)} />
    <Route
      path="/gestion-integral/accidentalidad"
      element={withModuleGuard(AccidentalidadPage, MODULE)}
    />
    <Route
      path="/gestion-integral/emergencias"
      element={withModuleGuard(EmergenciasPage, MODULE)}
    />
    <Route
      path="/gestion-integral/gestion-ambiental"
      element={withModuleGuard(GestionAmbientalPage, MODULE)}
    />
  </>
);
