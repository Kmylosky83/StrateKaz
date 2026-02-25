/**
 * Rutas: Audit System (Sistema de Auditoria)
 * Capa 3 — Inteligencia
 */
import { lazy } from 'react';
import { Route, Navigate } from 'react-router-dom';
import { withModuleGuard } from '../helpers';

const LogsSistemaPage = lazy(() =>
  import('@/features/audit-system').then((m) => ({ default: m.LogsSistemaPage }))
);
const NotificacionesPage = lazy(() =>
  import('@/features/audit-system').then((m) => ({ default: m.NotificacionesPage }))
);
const AlertasPage = lazy(() =>
  import('@/features/audit-system').then((m) => ({ default: m.AlertasPage }))
);
const TareasPage = lazy(() =>
  import('@/features/audit-system').then((m) => ({ default: m.TareasPage }))
);

export const auditSystemRoutes = (
  <>
    <Route path="/auditoria" element={<Navigate to="/auditoria/logs" replace />} />
    <Route path="/auditoria/logs" element={withModuleGuard(LogsSistemaPage, 'audit_system')} />
    <Route
      path="/auditoria/notificaciones"
      element={withModuleGuard(NotificacionesPage, 'audit_system')}
    />
    <Route path="/auditoria/alertas" element={withModuleGuard(AlertasPage, 'audit_system')} />
    <Route path="/auditoria/tareas" element={withModuleGuard(TareasPage, 'audit_system')} />
  </>
);
