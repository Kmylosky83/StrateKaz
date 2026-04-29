/**
 * Rutas: Gestión Documental (módulo independiente V2)
 * Nivel 2 — Infraestructura (PLANEAR)
 *
 * Arquitectura 5 tabs (dashboard/repositorio/en_proceso/archivo/configuracion).
 * Usa withModuleGuard porque es una página contenedora — las sub-secciones
 * controlan su propio acceso vía usePageSections (RBAC por sección desde BD).
 *
 * NOTA: Auditorías Internas removido — pertenece a VERIFICAR (ISO 9.2),
 * se reubicará en NIVEL_INTELIGENCIA al activar L30.
 */
import { lazy } from 'react';
import { Route, Navigate } from 'react-router-dom';
import { withModuleGuard } from '../helpers';

const GestionDocumentalPage = lazy(
  () => import('@/features/infraestructura/gestion-documental/pages/GestionDocumentalPage')
);

export const gestionDocumentalRoutes = (
  <>
    {/* Ruta principal — preserva ?section= para deep-links de notificaciones */}
    <Route
      path="/gestion-documental"
      element={withModuleGuard(GestionDocumentalPage, 'gestion_documental')}
    />
    {/* Backward compat: paths legacy redirigen preservando query params */}
    <Route
      path="/gestion-documental/documentos"
      element={<Navigate to="/gestion-documental" replace />}
    />
    <Route
      path="/gestion-documental/auditorias"
      element={<Navigate to="/gestion-documental" replace />}
    />
  </>
);
