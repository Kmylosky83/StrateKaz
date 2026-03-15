/**
 * Rutas legacy: Gestión Estratégica → Redirects
 *
 * Este módulo fue separado en 3 módulos independientes (Sprint P0):
 *   - /fundacion (C1: Configuración, Organización, Identidad)
 *   - /planeacion-estrategica (C2: Contexto, Planeación, Riesgos, Proyectos)
 *   - /revision-direccion (C3: Revisiones gerenciales)
 *
 * Estas rutas solo existen para compatibilidad con URLs antiguas.
 */
import { Route, Navigate } from 'react-router-dom';

export const gestionEstrategicaRoutes = (
  <>
    {/* Redirect raíz */}
    <Route path="/gestion-estrategica" element={<Navigate to="/fundacion/mi-empresa" replace />} />

    {/* C1 — Fundación (legacy → nuevas rutas) */}
    <Route
      path="/gestion-estrategica/configuracion"
      element={<Navigate to="/fundacion/mi-empresa" replace />}
    />
    <Route
      path="/gestion-estrategica/organizacion"
      element={<Navigate to="/fundacion/organizacion" replace />}
    />
    <Route
      path="/gestion-estrategica/identidad"
      element={<Navigate to="/fundacion/mi-empresa" replace />}
    />

    {/* C2 — Planeación Estratégica */}
    <Route
      path="/gestion-estrategica/contexto"
      element={<Navigate to="/planeacion-estrategica/contexto" replace />}
    />
    <Route
      path="/gestion-estrategica/planeacion"
      element={<Navigate to="/planeacion-estrategica/planeacion" replace />}
    />
    <Route
      path="/gestion-estrategica/riesgos-oportunidades"
      element={<Navigate to="/planeacion-estrategica/riesgos-oportunidades" replace />}
    />
    <Route
      path="/gestion-estrategica/proyectos"
      element={<Navigate to="/planeacion-estrategica/proyectos" replace />}
    />

    {/* C3 — Revisión por la Dirección */}
    <Route
      path="/gestion-estrategica/revision-direccion"
      element={<Navigate to="/revision-direccion/programacion" replace />}
    />

    {/* Legacy: Soporte Estratégico → Sistema de Gestión */}
    <Route
      path="/soporte-estrategico"
      element={<Navigate to="/sistema-gestion/documentos" replace />}
    />
    <Route
      path="/soporte-estrategico/gestion-documental"
      element={<Navigate to="/sistema-gestion/documentos" replace />}
    />
    <Route
      path="/soporte-estrategico/planificacion-sistema"
      element={<Navigate to="/sistema-gestion/planificacion" replace />}
    />
  </>
);
