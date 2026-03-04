"""
Audit Logging - StrateKaz P0-10
Logging centralizado para operaciones críticas.
"""
import logging

security_logger = logging.getLogger('security')
audit_logger = logging.getLogger('audit')


def get_client_ip(request):
    """Obtiene IP del cliente considerando proxies."""
    if not request:
        return 'system'
    xff = request.META.get('HTTP_X_FORWARDED_FOR')
    return xff.split(',')[0].strip() if xff else request.META.get('REMOTE_ADDR', 'unknown')


def _user_str(user):
    return f"{user.username}" if user and user.is_authenticated else "anonymous"


# USER OPERATIONS
def log_user_created(request, new_user):
    security_logger.info(f"USER_CREATED: {new_user.username} (ID:{new_user.id}) by {_user_str(request.user)} - IP: {get_client_ip(request)}")


def log_user_deleted(request, user, hard=False):
    t = "HARD_DELETED" if hard else "SOFT_DELETED"
    security_logger.warning(f"USER_{t}: {user.username} (ID:{user.id}) by {_user_str(request.user)} - IP: {get_client_ip(request)}")


def log_user_restored(request, user):
    security_logger.info(f"USER_RESTORED: {user.username} (ID:{user.id}) by {_user_str(request.user)} - IP: {get_client_ip(request)}")


def log_user_updated(request, user, self_update=False):
    by = "self" if self_update else f"by {_user_str(request.user)}"
    security_logger.info(f"USER_UPDATED: {user.username} (ID:{user.id}) - {by} - IP: {get_client_ip(request)}")


def log_password_changed(request, user, self_change=False):
    by = "self" if self_change else f"by {_user_str(request.user)}"
    security_logger.warning(f"PASSWORD_CHANGED: {user.username} (ID:{user.id}) - {by} - IP: {get_client_ip(request)}")


def log_user_photo_updated(request, user):
    """Log cuando un usuario actualiza su foto de perfil"""
    security_logger.info(f"USER_PHOTO_UPDATED: {user.username} (ID:{user.id}) - IP: {get_client_ip(request)}")


# RBAC OPERATIONS
def log_permissions_assigned(request, target, target_type, perm_ids, action='assigned'):
    v = "ASSIGNED" if action == 'assigned' else "REMOVED"
    security_logger.info(f"PERMISSIONS_{v}: {len(perm_ids)} to {target_type} '{target}' by {_user_str(request.user)} - IP: {get_client_ip(request)}")


def log_section_access_changed(request, cargo, count, action='assigned'):
    v = "ASSIGNED" if action == 'assigned' else "CLEARED"
    security_logger.info(f"SECTION_ACCESS_{v}: {count} sections to cargo '{cargo.name}' by {_user_str(request.user)} - IP: {get_client_ip(request)}")


def log_role_assigned(request, user, role, action='assigned'):
    v = "ASSIGNED" if action == 'assigned' else "REMOVED"
    security_logger.info(f"ROLE_{v}: '{role.name}' to user '{user.username}' by {_user_str(request.user)} - IP: {get_client_ip(request)}")


def log_additional_role_changed(request, user, rol, action='assigned'):
    v = "ASSIGNED" if action == 'assigned' else "REVOKED"
    security_logger.info(f"ADDITIONAL_ROLE_{v}: '{rol.nombre}' to '{user.username}' by {_user_str(request.user)} - IP: {get_client_ip(request)}")


def log_group_membership_changed(request, group, user_ids, action='added'):
    v = "ADDED" if action == 'added' else "REMOVED"
    security_logger.info(f"GROUP_MEMBERS_{v}: {len(user_ids)} users to group '{group.name}' by {_user_str(request.user)} - IP: {get_client_ip(request)}")


# FINANCIAL OPERATIONS
def log_financial_operation(request, comprobante, operation):
    audit_logger.warning(f"COMPROBANTE_{operation.upper()}: #{comprobante.numero} (ID:{comprobante.id}) by {_user_str(request.user)} - IP: {get_client_ip(request)}")


# DOCUMENT/SIGNATURE OPERATIONS
def log_document_signed(request, doc, doc_type):
    audit_logger.info(f"DOCUMENT_SIGNED: {doc_type} (ID:{doc.id}) by {_user_str(request.user)} - IP: {get_client_ip(request)}")


def log_document_approved(request, doc, doc_type):
    audit_logger.info(f"DOCUMENT_APPROVED: {doc_type} (ID:{doc.id}) by {_user_str(request.user)} - IP: {get_client_ip(request)}")


def log_signature_revoked(request, sig, reason=None):
    r = f" - Reason: {reason}" if reason else ""
    security_logger.warning(f"SIGNATURE_REVOKED: ID:{sig.id} by {_user_str(request.user)} - IP: {get_client_ip(request)}{r}")


# TWO FACTOR AUTHENTICATION OPERATIONS
def log_2fa_enabled(request, user):
    """Log cuando un usuario habilita 2FA"""
    security_logger.warning(f"2FA_ENABLED: user '{user.username}' (ID:{user.id}) - IP: {get_client_ip(request)}")


def log_2fa_disabled(request, user):
    """Log cuando un usuario deshabilita 2FA"""
    security_logger.warning(f"2FA_DISABLED: user '{user.username}' (ID:{user.id}) - IP: {get_client_ip(request)}")


def log_2fa_verified(request, user, method='totp'):
    """Log de verificación exitosa de 2FA durante login"""
    security_logger.info(f"2FA_VERIFIED: user '{user.username}' (ID:{user.id}) via {method.upper()} - IP: {get_client_ip(request)}")


def log_2fa_failed(request, username, reason='invalid_code'):
    """Log de intento fallido de 2FA"""
    security_logger.warning(f"2FA_FAILED: user '{username}' - Reason: {reason} - IP: {get_client_ip(request)}")


def log_backup_codes_generated(request, user):
    """Log cuando se generan nuevos códigos de respaldo"""
    security_logger.info(f"2FA_BACKUP_CODES_GENERATED: user '{user.username}' (ID:{user.id}) - IP: {get_client_ip(request)}")


def log_backup_code_used(request, user):
    """Log cuando se usa un código de respaldo"""
    security_logger.warning(f"2FA_BACKUP_CODE_USED: user '{user.username}' (ID:{user.id}) - IP: {get_client_ip(request)}")


# IMPERSONATION OPERATIONS
def log_impersonation(request, target_user):
    """Log cuando un superadmin impersona a otro usuario"""
    security_logger.warning(
        f"IMPERSONATE: superadmin '{_user_str(request.user)}' (ID:{request.user.id}) "
        f"viewing as '{target_user.username}' (ID:{target_user.id}) "
        f"- IP: {get_client_ip(request)}"
    )


def log_impersonation_failed(request, target_info, reason='unknown'):
    """Log cuando un intento de impersonación falla"""
    security_logger.warning(
        f"IMPERSONATE_FAILED: superadmin '{_user_str(request.user)}' (ID:{request.user.id}) "
        f"target='{target_info}' reason='{reason}' "
        f"- IP: {get_client_ip(request)}"
    )


# USER PREFERENCES OPERATIONS (MS-003)
def log_preferences_updated(user, updated_fields):
    """
    Log cuando un usuario actualiza sus preferencias.

    Args:
        user: Usuario que actualiza preferencias
        updated_fields: Diccionario con los campos actualizados
    """
    fields = ', '.join([f"{k}={v}" for k, v in updated_fields.items()])
    audit_logger.info(f"PREFERENCES_UPDATED: user '{user.username}' (ID:{user.id}) - Fields: {fields}")
