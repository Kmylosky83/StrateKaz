/**
 * Rutas: Cumplimiento (legacy — redirects a Protección V2)
 *
 * Cascada V2 consolidó motor_cumplimiento + motor_riesgos
 * en proteccion_cumplimiento → /proteccion/
 */
import { Route, Navigate } from 'react-router-dom';

export const cumplimientoRoutes = (
  <>
    <Route
      path="/cumplimiento"
      element={<Navigate to="/proteccion/cumplimiento-legal" replace />}
    />
    <Route
      path="/cumplimiento/matriz-legal"
      element={<Navigate to="/proteccion/cumplimiento-legal" replace />}
    />
    <Route
      path="/cumplimiento/requisitos-legales"
      element={<Navigate to="/proteccion/requisitos-legales" replace />}
    />
    <Route
      path="/cumplimiento/reglamentos-internos"
      element={<Navigate to="/proteccion/reglamentos-internos" replace />}
    />
    <Route
      path="/cumplimiento/partes-interesadas"
      element={<Navigate to="/planeacion-estrategica/contexto" replace />}
    />
  </>
);
