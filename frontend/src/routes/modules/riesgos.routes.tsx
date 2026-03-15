/**
 * Rutas: Riesgos (legacy — redirects a Protección V2)
 *
 * Cascada V2 consolidó motor_riesgos en proteccion_cumplimiento → /proteccion/
 */
import { Route, Navigate } from 'react-router-dom';

export const riesgosRoutes = (
  <>
    <Route path="/riesgos" element={<Navigate to="/proteccion/riesgos-procesos" replace />} />
    <Route
      path="/riesgos/procesos"
      element={<Navigate to="/proteccion/riesgos-procesos" replace />}
    />
    <Route path="/riesgos/ipevr" element={<Navigate to="/proteccion/ipevr" replace />} />
    <Route
      path="/riesgos/ambientales"
      element={<Navigate to="/proteccion/aspectos-ambientales" replace />}
    />
    <Route path="/riesgos/viales" element={<Navigate to="/proteccion/riesgos-viales" replace />} />
    <Route path="/riesgos/sagrilaft" element={<Navigate to="/proteccion/sagrilaft" replace />} />
    <Route
      path="/riesgos/seguridad-info"
      element={<Navigate to="/proteccion/seguridad-info" replace />}
    />
  </>
);
