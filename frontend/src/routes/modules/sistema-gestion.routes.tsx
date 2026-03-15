/**
 * Rutas: Sistema de Gestión (legacy — redirects a módulos V2)
 *
 * Cascada V2 dividió sistema_gestion en 4 módulos independientes:
 * - gestion_documental → /gestion-documental/
 * - planificacion_operativa → /planificacion-operativa/
 * - acciones_mejora → /acciones-mejora/
 * - auditorias_internas → /gestion-documental/auditorias
 */
import { Route, Navigate } from 'react-router-dom';

export const sistemaGestionRoutes = (
  <>
    <Route
      path="/sistema-gestion"
      element={<Navigate to="/gestion-documental/documentos" replace />}
    />

    {/* Planificación → módulo independiente */}
    <Route
      path="/sistema-gestion/planificacion"
      element={<Navigate to="/planificacion-operativa/planificacion" replace />}
    />

    {/* Acciones de Mejora → módulo independiente */}
    <Route
      path="/sistema-gestion/acciones"
      element={<Navigate to="/acciones-mejora/no-conformidades" replace />}
    />

    {/* Gestión Documental → módulo independiente */}
    <Route
      path="/sistema-gestion/documentos"
      element={<Navigate to="/gestion-documental/documentos" replace />}
    />
    <Route
      path="/sistema-gestion/auditorias"
      element={<Navigate to="/gestion-documental/auditorias" replace />}
    />
  </>
);
