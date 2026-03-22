/**
 * Rutas: Revisión por la Dirección (C3)
 * Revisiones gerenciales, actas y seguimiento de compromisos (ISO 9.3)
 *
 * Módulo: revision_direccion
 * Capa Inteligencia — lee de todos los C2, no modifica
 */
import { lazy } from 'react';
import { Route, Navigate } from 'react-router-dom';
import { withFullGuard } from '../helpers';

const RevisionDireccionPage = lazy(
  () => import('@/features/gestion-estrategica/pages/RevisionDireccionPage')
);

export const revisionDireccionRoutes = (
  <>
    <Route
      path="/revision-direccion"
      element={<Navigate to="/revision-direccion/programacion" replace />}
    />

    {/* Revisión por la Dirección (programación, actas, compromisos) */}
    <Route
      path="/revision-direccion/programacion"
      element={withFullGuard(RevisionDireccionPage, 'revision_direccion', 'programacion')}
    />
  </>
);
