/**
 * Rutas: Gestión Documental (módulo independiente V2)
 * Nivel 2 — Infraestructura (PLANEAR)
 *
 * 1 tab: Documentos (tipos, documentos, control cambios, distribución)
 * NOTA: Auditorías Internas removido — pertenece a VERIFICAR (ISO 9.2),
 * se reubicará en NIVEL_INTELIGENCIA al activar L30.
 */
import { lazy } from 'react';
import { Route, Navigate } from 'react-router-dom';
import { withFullGuard } from '../helpers';

const GestionDocumentalPage = lazy(
  () => import('@/features/gestion-documental/pages/GestionDocumentalPage')
);

export const gestionDocumentalRoutes = (
  <>
    <Route
      path="/gestion-documental"
      element={<Navigate to="/gestion-documental/documentos" replace />}
    />
    <Route
      path="/gestion-documental/documentos"
      element={withFullGuard(GestionDocumentalPage, 'gestion_documental', 'documentos')}
    />
    {/* Auditorías Internas → se activará con NIVEL_INTELIGENCIA (L30) */}
    <Route
      path="/gestion-documental/auditorias"
      element={<Navigate to="/gestion-documental/documentos" replace />}
    />
  </>
);
