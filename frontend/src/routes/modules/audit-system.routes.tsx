/**
 * Rutas: Audit System (Sistema de Auditoria)
 * Capa 3 — Inteligencia
 */
import { lazy } from 'react';
import { Route, Navigate } from 'react-router-dom';
import { withFullGuard } from '../helpers';

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
    <Route
      path="/auditoria/logs"
      element={withFullGuard(LogsSistemaPage, 'audit_system', 'logs_sistema')}
    />
    <Route
      path="/auditoria/notificaciones"
      element={withFullGuard(NotificacionesPage, 'audit_system', 'notificaciones')}
    />
    <Route
      path="/auditoria/alertas"
      element={withFullGuard(AlertasPage, 'audit_system', 'alertas')}
    />
    <Route path="/auditoria/tareas" element={withFullGuard(TareasPage, 'audit_system', 'tareas')} />
  </>
);
