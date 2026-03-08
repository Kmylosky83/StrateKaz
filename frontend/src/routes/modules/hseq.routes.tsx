/**
 * Rutas: HSEQ Management (Gestión HSEQ)
 * Capa 2 — Módulo de Negocio (Operaciones)
 *
 * 7 tabs operativos: medicina, seguridad, higiene, comités,
 * accidentalidad, emergencias, ambiental.
 *
 * Redirects a Sistema de Gestión:
 * - /hseq/sistema-documental → /sistema-gestion/documentos
 * - /hseq/planificacion → /sistema-gestion/planificacion
 * - /hseq/mejora-continua → /sistema-gestion/auditorias
 * - /hseq/calidad → /sistema-gestion/calidad
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

export const hseqRoutes = (
  <>
    <Route path="/hseq" element={<Navigate to="/hseq/dashboard" replace />} />
    <Route path="/hseq/dashboard" element={withModuleGuard(HSEQPage, 'hseq_management')} />

    {/* Redirects a Sistema de Gestión (sprint sistema-gestion-hseq-1) */}
    <Route
      path="/hseq/sistema-documental"
      element={<Navigate to="/sistema-gestion/documentos" replace />}
    />
    <Route
      path="/hseq/planificacion"
      element={<Navigate to="/sistema-gestion/planificacion" replace />}
    />
    <Route
      path="/hseq/mejora-continua"
      element={<Navigate to="/sistema-gestion/auditorias" replace />}
    />

    {/* Redirect calidad → sistema-gestion (sprint sidebar-6-layers) */}
    <Route path="/hseq/calidad" element={<Navigate to="/sistema-gestion/calidad" replace />} />

    {/* 7 tabs operativos HSEQ */}
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
  </>
);
