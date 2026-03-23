"""
Middleware de auditoría de impersonación — StrateKaz SGI.

Registra todas las acciones realizadas durante sesiones de impersonación
y bloquea patrones de URL destructivos como capa de seguridad adicional.

Orden en MIDDLEWARE: después de AuthenticationMiddleware, antes de ModuleAccessMiddleware.

Fast path: si no hay impersonación, el middleware no hace nada más allá de
verificar un header — overhead mínimo (~0.01ms).
"""
import logging
import re

from django.http import JsonResponse
from apps.core.utils.audit_logging import get_client_ip
from apps.core.utils.impersonation import (
    IMPERSONATION_HEADER,
    is_impersonating,
)

security_logger = logging.getLogger('security')

# ─────────────────────────────────────────────────────────────────────────
# URL patterns bloqueados durante impersonación (S3 — backup de seguridad)
# Estos patrones se bloquean incluso si el decorator @block_during_impersonation
# no fue aplicado al view — defensa en profundidad.
# ─────────────────────────────────────────────────────────────────────────
BLOCKED_DURING_IMPERSONATION = [
    # No eliminar usuarios
    ('DELETE', re.compile(r'^/api/core/users/\d+/$')),
    # No cambiar contraseña
    ('POST', re.compile(r'^/api/core/users/\d+/change[_-]password/')),
    # No modificar 2FA
    ('POST', re.compile(r'^/api/core/2fa/(setup|enable|disable)/')),
    # No regenerar códigos de backup
    ('POST', re.compile(r'^/api/core/2fa/regenerate-backup-codes/')),
]

# Endpoints sensibles que se loggean incluso en GET
SENSITIVE_GET_PATTERNS = [
    re.compile(r'^/api/core/users/\d+/impersonate-profile/'),
    re.compile(r'^/api/core/users/firma-guardada/'),
    re.compile(r'^/api/core/permissions/'),
    re.compile(r'^/api/core/roles/'),
    re.compile(r'^/api/core/cargos-rbac/'),
    re.compile(r'^/api/core/2fa/'),
    re.compile(r'^/api/core/sessions/'),
]

# Endpoints que NO se auditan (ruido, health checks, estáticos)
EXCLUDED_PATTERNS = [
    re.compile(r'^/api/core/health'),
    re.compile(r'^/static/'),
    re.compile(r'^/media/'),
    re.compile(r'^/__debug__/'),
    re.compile(r'^/api/docs'),
    re.compile(r'^/api/redoc'),
]


def _classify_action(method, path):
    """Clasifica la acción según método HTTP y endpoint."""
    if 'change-password' in path or 'change_password' in path:
        return 'blocked_action'
    if 'firma-guardada' in path:
        return 'view_signature' if method == 'GET' else 'edit_profile'
    if 'impersonate-profile' in path:
        return 'view_profile'
    if '/permissions/' in path or '/roles/' in path:
        return 'view_permissions'
    if '/2fa/' in path:
        return 'blocked_action'

    method_action_map = {
        'GET': 'api_read',
        'POST': 'create_record',
        'PUT': 'update_record',
        'PATCH': 'update_record',
        'DELETE': 'delete_record',
    }
    return method_action_map.get(method, 'api_write')


def _is_excluded(path):
    """Verifica si el path debe excluirse del audit."""
    return any(p.search(path) for p in EXCLUDED_PATTERNS)


def _is_sensitive_get(path):
    """Verifica si un GET es a un endpoint sensible."""
    return any(p.search(path) for p in SENSITIVE_GET_PATTERNS)


class ImpersonationAuditMiddleware:
    """
    Middleware que:
    1. Bloquea patrones destructivos durante impersonación (403).
    2. Registra acciones de escritura y GETs sensibles en AuditImpersonation.

    Fast path: si no hay header de impersonación, sale inmediatamente.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # ── Fast path: sin header de impersonación → continuar ──
        if not request.META.get(IMPERSONATION_HEADER):
            return self.get_response(request)

        # ── Verificar si realmente es impersonación válida ──
        if not is_impersonating(request):
            return self.get_response(request)

        method = request.method
        path = request.path

        # ── Excluir rutas no relevantes ──
        if _is_excluded(path):
            return self.get_response(request)

        # ── S3: Bloquear acciones destructivas ──
        for blocked_method, pattern in BLOCKED_DURING_IMPERSONATION:
            if method == blocked_method and pattern.search(path):
                security_logger.warning(
                    f"IMPERSONATION_BLOCKED_MW: {method} {path} "
                    f"superadmin='{request.user.username}' "
                    f"(ID:{request.user.id}) "
                    f"target_header='{request.META.get(IMPERSONATION_HEADER)}' "
                    f"IP:{get_client_ip(request)}"
                )
                return JsonResponse(
                    {
                        'error': (
                            'Esta acción no está permitida durante '
                            'impersonación'
                        )
                    },
                    status=403,
                )

        # ── Obtener response primero ──
        response = self.get_response(request)

        # ── Registrar auditoría solo para escrituras y GETs sensibles ──
        should_audit = (
            method in ('POST', 'PUT', 'PATCH', 'DELETE')
            or (method == 'GET' and _is_sensitive_get(path))
        )

        if should_audit:
            self._record_audit(request, method, path, response)

        return response

    def _record_audit(self, request, method, path, response):
        """Crea registro en AuditImpersonation de forma segura."""
        try:
            from apps.audit_system.logs_sistema.models import (
                AuditImpersonation,
            )
            from django.contrib.auth import get_user_model

            User = get_user_model()
            impersonated_id = request.META.get(IMPERSONATION_HEADER)

            # Resolver target_user
            target_user = None
            try:
                target_user = User.objects.get(pk=int(impersonated_id))
            except (User.DoesNotExist, ValueError, TypeError):
                pass

            action = _classify_action(method, path)

            metadata = {
                'response_status': getattr(response, 'status_code', None),
                'query_params': dict(request.GET) if request.GET else {},
            }

            AuditImpersonation.objects.create(
                superadmin=request.user,
                target_user=target_user,
                action=action,
                endpoint=path[:500],
                method=method,
                ip_address=get_client_ip(request),
                user_agent=request.META.get('HTTP_USER_AGENT', '')[:500],
                metadata=metadata,
            )

            security_logger.info(
                f"IMPERSONATION_AUDIT: {method} {path} "
                f"action={action} "
                f"superadmin='{request.user.username}' "
                f"target='{target_user.username if target_user else '?'}' "
                f"status={getattr(response, 'status_code', '?')}"
            )
        except Exception:
            # Nunca romper el request por un fallo de auditoría
            security_logger.exception(
                f"IMPERSONATION_AUDIT_ERROR: Error registrando auditoría "
                f"para {method} {path}"
            )
