/**
 * Rutas: HSEQ (legacy — redirects a Gestión Integral V2)
 *
 * Cascada V2 renombró hseq_management → gestion_integral
 * Ruta canónica: /gestion-integral/
 */
import { Route, Navigate } from 'react-router-dom';

export const hseqRoutes = (
  <>
    <Route path="/hseq" element={<Navigate to="/gestion-integral/medicina-laboral" replace />} />
    <Route path="/hseq/dashboard" element={<Navigate to="/gestion-integral/dashboard" replace />} />
    <Route
      path="/hseq/medicina-laboral"
      element={<Navigate to="/gestion-integral/medicina-laboral" replace />}
    />
    <Route
      path="/hseq/seguridad-industrial"
      element={<Navigate to="/gestion-integral/seguridad-industrial" replace />}
    />
    <Route
      path="/hseq/higiene-industrial"
      element={<Navigate to="/gestion-integral/higiene-industrial" replace />}
    />
    <Route path="/hseq/comites" element={<Navigate to="/gestion-integral/comites" replace />} />
    <Route
      path="/hseq/accidentalidad"
      element={<Navigate to="/gestion-integral/accidentalidad" replace />}
    />
    <Route
      path="/hseq/emergencias"
      element={<Navigate to="/gestion-integral/emergencias" replace />}
    />
    <Route
      path="/hseq/gestion-ambiental"
      element={<Navigate to="/gestion-integral/gestion-ambiental" replace />}
    />

    {/* Legacy redirects a módulos V2 independientes */}
    <Route
      path="/hseq/sistema-documental"
      element={<Navigate to="/gestion-documental/documentos" replace />}
    />
    <Route
      path="/hseq/planificacion"
      element={<Navigate to="/planificacion-operativa/planificacion" replace />}
    />
    <Route
      path="/hseq/mejora-continua"
      element={<Navigate to="/acciones-mejora/no-conformidades" replace />}
    />
  </>
);
