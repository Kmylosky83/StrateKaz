/**
 * Rutas: Motor de Cumplimiento
 * Capa 2 — Modulo de Negocio
 *
 * NOTA: Partes Interesadas fue migrado a Contexto Organizacional
 * (gestion_estrategica.contexto) como fuente canonica ISO 9001:2015 §4.2
 */
import { lazy } from 'react';
import { Route, Navigate } from 'react-router-dom';
import { withModuleGuard } from '../helpers';

const MatrizLegalPage = lazy(() =>
  import('@/features/cumplimiento').then((m) => ({ default: m.MatrizLegalPage }))
);
const RequisitosLegalesPage = lazy(() =>
  import('@/features/cumplimiento').then((m) => ({ default: m.RequisitosLegalesPage }))
);
const ReglamentosInternosPage = lazy(() =>
  import('@/features/cumplimiento').then((m) => ({ default: m.ReglamentosInternosPage }))
);

export const cumplimientoRoutes = (
  <>
    <Route path="/cumplimiento" element={<Navigate to="/cumplimiento/matriz-legal" replace />} />
    <Route
      path="/cumplimiento/matriz-legal"
      element={withModuleGuard(MatrizLegalPage, 'motor_cumplimiento')}
    />
    <Route
      path="/cumplimiento/requisitos-legales"
      element={withModuleGuard(RequisitosLegalesPage, 'motor_cumplimiento')}
    />
    {/* Partes Interesadas: redirect a Contexto Organizacional */}
    <Route
      path="/cumplimiento/partes-interesadas"
      element={<Navigate to="/planeacion-estrategica/contexto" replace />}
    />
    <Route
      path="/cumplimiento/reglamentos-internos"
      element={withModuleGuard(ReglamentosInternosPage, 'motor_cumplimiento')}
    />
  </>
);
