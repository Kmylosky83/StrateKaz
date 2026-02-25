/**
 * Rutas: HSEQ Management (Torre de Control)
 * Capa 2 — Modulo de Negocio
 */
import { lazy } from 'react';
import { Route, Navigate } from 'react-router-dom';
import { withModuleGuard } from '../helpers';

const HSEQPage = lazy(() => import('@/features/hseq').then((m) => ({ default: m.HSEQPage })));
const PlanificacionSistemaPage = lazy(() =>
  import('@/features/hseq').then((m) => ({ default: m.PlanificacionSistemaPage }))
);
const CalidadPage = lazy(() => import('@/features/hseq').then((m) => ({ default: m.CalidadPage })));
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
const MejoraContinuaPage = lazy(() =>
  import('@/features/hseq').then((m) => ({ default: m.MejoraContinuaPage }))
);

export const hseqRoutes = (
  <>
    <Route path="/hseq" element={<Navigate to="/hseq/dashboard" replace />} />
    <Route path="/hseq/dashboard" element={withModuleGuard(HSEQPage, 'hseq_management')} />

    {/* Redirige al Sistema de Gestion */}
    <Route
      path="/hseq/sistema-documental"
      element={<Navigate to="/sistema-gestion/documentos" replace />}
    />

    <Route
      path="/hseq/planificacion"
      element={withModuleGuard(PlanificacionSistemaPage, 'hseq_management')}
    />
    <Route path="/hseq/calidad" element={withModuleGuard(CalidadPage, 'hseq_management')} />
    <Route
      path="/hseq/medicina-laboral"
      element={withModuleGuard(MedicinaLaboralPage, 'hseq_management')}
    />
    <Route
      path="/hseq/seguridad-industrial"
      element={withModuleGuard(SeguridadIndustrialPage, 'hseq_management')}
    />
    <Route
      path="/hseq/higiene-industrial"
      element={withModuleGuard(HigieneIndustrialPage, 'hseq_management')}
    />
    <Route path="/hseq/comites" element={withModuleGuard(GestionComitesPage, 'hseq_management')} />
    <Route
      path="/hseq/accidentalidad"
      element={withModuleGuard(AccidentalidadPage, 'hseq_management')}
    />
    <Route path="/hseq/emergencias" element={withModuleGuard(EmergenciasPage, 'hseq_management')} />
    <Route
      path="/hseq/gestion-ambiental"
      element={withModuleGuard(GestionAmbientalPage, 'hseq_management')}
    />
    <Route
      path="/hseq/mejora-continua"
      element={withModuleGuard(MejoraContinuaPage, 'hseq_management')}
    />
  </>
);
