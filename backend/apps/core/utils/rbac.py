"""
Utilidades RBAC — Fuente única de verdad para permisos del usuario.

Sistema RBAC Unificado v4.0:
- Los permisos se derivan EXCLUSIVAMENTE de CargoSectionAccess
- Formato de permission_codes: "modulo.seccion.accion"
- Usado por: current_user(), impersonate_profile(), UserDetailSerializer

IMPORTANTE: NO usar get_permisos_efectivos() ni el modelo Permiso legacy.
Toda la lógica de permisos pasa por CargoSectionAccess.
"""
import logging

logger = logging.getLogger('apps')


def compute_user_rbac(user):
    """
    Computa section_ids y permission_codes para un usuario.

    Fuente: CargoSectionAccess (RBAC Unificado v4.0)

    Args:
        user: Instancia de User (con cargo cargado)

    Returns:
        tuple: (section_ids, permission_codes)
            - Superusuario: (None, ['*'])
            - Sin cargo: ([], [])
            - Normal: ([1, 2, 3], ['modulo.seccion.view', ...])
    """
    if user.is_superuser:
        return None, ['*']

    cargo = getattr(user, 'cargo', None)
    if not cargo:
        return [], []

    from apps.core.models import CargoSectionAccess

    # section_ids: secciones donde el usuario tiene can_view=True
    accesses = CargoSectionAccess.objects.filter(
        cargo=cargo
    ).select_related('section__tab__module')

    section_ids = []
    permission_codes = []

    for access in accesses:
        if access.can_view:
            section_ids.append(access.section_id)

        # Generar códigos de permiso: "modulo.seccion.accion"
        section = access.section
        try:
            module_code = section.tab.module.code.lower()
            section_code = section.code.lower()
        except AttributeError:
            logger.warning(
                'CargoSectionAccess id=%d: section sin tab o module', access.id
            )
            continue

        if access.can_view:
            permission_codes.append(f"{module_code}.{section_code}.view")
        if access.can_create:
            permission_codes.append(f"{module_code}.{section_code}.create")
        if access.can_edit:
            permission_codes.append(f"{module_code}.{section_code}.edit")
        if access.can_delete:
            permission_codes.append(f"{module_code}.{section_code}.delete")

        # Custom actions (enviar, aprobar, etc.)
        if access.custom_actions:
            for action_code, enabled in access.custom_actions.items():
                if enabled:
                    permission_codes.append(
                        f"{module_code}.{section_code}.{action_code}"
                    )

    return section_ids, permission_codes
