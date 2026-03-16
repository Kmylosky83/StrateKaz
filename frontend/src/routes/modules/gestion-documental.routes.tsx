/**
 * Rutas: Gestión Documental (módulo independiente V2)
 * Nivel 2 — Infraestructura (PLANEAR)
 *
 * 2 tabs: Documentos + Auditorías Internas
 * Pages en features/gestion-documental/pages/
 */
import { lazy } from 'react';
import { Route, Navigate } from 'react-router-dom';
import { withModuleGuard } from '../helpers';

const GestionDocumentalPage = lazy(
  () => import('@/features/gestion-documental/pages/GestionDocumentalPage')
);
const AuditoriasInternasPage = lazy(
  () => import('@/features/gestion-documental/pages/AuditoriasInternasPage')
);

export const gestionDocumentalRoutes = (
  <>
    <Route
      path="/gestion-documental"
      element={<Navigate to="/gestion-documental/documentos" replace />}
    />
    <Route
      path="/gestion-documental/documentos"
      element={withModuleGuard(GestionDocumentalPage, 'gestion_documental')}
    />
    <Route
      path="/gestion-documental/auditorias"
      element={withModuleGuard(AuditoriasInternasPage, 'gestion_documental')}
    />
  </>
);
