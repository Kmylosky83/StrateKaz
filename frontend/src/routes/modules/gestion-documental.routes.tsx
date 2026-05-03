/**
 * Rutas: Gestión Documental (módulo independiente V2)
 * Nivel 2 — Infraestructura (PLANEAR)
 *
 * Arquitectura sidebar 2 tabs (sesión 2026-05-03 — H-GD-archivo-vs-repositorio):
 *   - Repositorio (tab gestion_documental) → /gestion-documental
 *     Documentos vivos del SGI (políticas, procedimientos, manuales).
 *     Sub-sections: dashboard, repositorio, en_proceso, configuracion.
 *   - Archivo (tab archivo) → /gestion-documental/archivo
 *     Registros operativos auto-archivados desde módulos C2.
 *     Sub-section: archivo_registros.
 *
 * Distinción ISO 9001 §7.5.2 (Documentos) vs §7.5.3 (Registros).
 *
 * Usa withModuleGuard porque son páginas contenedoras — las sub-secciones
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

const ArchivoPage = lazy(
  () => import('@/features/infraestructura/gestion-documental/pages/ArchivoPage')
);

export const gestionDocumentalRoutes = (
  <>
    {/* Tab 1: REPOSITORIO — preserva ?section= para deep-links de notificaciones */}
    <Route
      path="/gestion-documental"
      element={withModuleGuard(GestionDocumentalPage, 'infra_gestion_documental')}
    />
    {/* Tab 2: ARCHIVO — registros operativos auto-archivados desde C2 */}
    <Route
      path="/gestion-documental/archivo"
      element={withModuleGuard(ArchivoPage, 'infra_gestion_documental')}
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
