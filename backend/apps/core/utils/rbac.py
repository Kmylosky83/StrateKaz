"""
Utilidades RBAC — Fuente única de verdad para permisos del usuario.

Sistema RBAC Unificado v4.1:
- Los permisos se derivan de CargoSectionAccess + RolAdicionalSectionAccess + GroupSectionAccess
- Formato de permission_codes: "modulo.seccion.accion"
- Usado por: current_user(), impersonate_profile(), UserDetailSerializer
- Lógica OR: si CUALQUIER fuente otorga el permiso, se permite

IMPORTANTE: NO usar get_permisos_efectivos() ni el modelo Permiso legacy.
Toda la lógica de permisos pasa por SectionAccess (Cargo + RolAdicional + Group).
"""
import logging

logger = logging.getLogger('apps')


def compute_user_rbac(user):
    """
    Computa section_ids y permission_codes para un usuario.

    Fuentes (combinadas con lógica OR):
    1. CargoSectionAccess (permisos del cargo)
    2. RolAdicionalSectionAccess (permisos de roles adicionales válidos)
    3. GroupSectionAccess (permisos de grupos activos)

    Args:
        user: Instancia de User (con cargo cargado)

    Returns:
        tuple: (section_ids, permission_codes)
            - Superusuario: (None, ['*'])
            - Sin cargo ni roles ni grupos: ([], [])
            - Normal: ([1, 2, 3], ['modulo.seccion.view', ...])
    """
    if user.is_superuser:
        return None, ['*']

    section_ids = set()
    permission_codes = set()

    # ---------------------------------------------------------------
    # 1. Permisos del Cargo → CargoSectionAccess
    # ---------------------------------------------------------------
    cargo = getattr(user, 'cargo', None)
    if cargo:
        from apps.core.models import CargoSectionAccess

        cargo_accesses = CargoSectionAccess.objects.filter(
            cargo=cargo
        ).select_related('section__tab__module')

        _collect_section_access(cargo_accesses, section_ids, permission_codes)

    # ---------------------------------------------------------------
    # 2. Permisos de Roles Adicionales → RolAdicionalSectionAccess
    # ---------------------------------------------------------------
    if hasattr(user, 'usuarios_roles_adicionales'):
        from apps.core.models import RolAdicionalSectionAccess

        valid_rol_ids = [
            ura.rol_adicional_id
            for ura in user.usuarios_roles_adicionales.select_related(
                'rol_adicional'
            ).filter(is_active=True)
            if ura.is_valid
        ]

        if valid_rol_ids:
            rol_accesses = RolAdicionalSectionAccess.objects.filter(
                rol_adicional_id__in=valid_rol_ids,
            ).select_related('section__tab__module')

            _collect_section_access(rol_accesses, section_ids, permission_codes)

    # ---------------------------------------------------------------
    # 3. Permisos de Grupos activos → GroupSectionAccess
    # ---------------------------------------------------------------
    from apps.core.models import GroupSectionAccess, UserGroup

    group_ids = list(
        UserGroup.objects.filter(
            user=user,
            group__is_active=True
        ).values_list('group_id', flat=True)
    )

    if group_ids:
        group_accesses = GroupSectionAccess.objects.filter(
            group_id__in=group_ids
        ).select_related('section__tab__module')

        _collect_section_access(group_accesses, section_ids, permission_codes)

    # ---------------------------------------------------------------
    # 4. Tab-level permission codes (derivados de sections autorizadas)
    # ---------------------------------------------------------------
    # Los guards de rutas FE (withFullGuard) pueden pasar tab_code como
    # sectionCode — ej: withFullGuard(..., 'supply_chain', 'proveedores')
    # donde 'proveedores' es un tab que contiene varias sub-sections.
    #
    # Si el user tiene al menos UNA sub-section del tab con can_view=True,
    # damos acceso tab-level. Esto alinea la doctrina FE con el sidebar
    # backend (que muestra el tab si cualquier sub-section es accesible).
    if section_ids:
        from apps.core.models import TabSection
        tabs_authorized = TabSection.objects.filter(
            id__in=section_ids,
            is_enabled=True,
        ).select_related('tab__module').values_list(
            'tab__code', 'tab__module__code'
        ).distinct()

        for tab_code, module_code in tabs_authorized:
            if tab_code and module_code:
                permission_codes.add(
                    f"{module_code.lower()}.{tab_code.lower()}.view"
                )

    # ---------------------------------------------------------------
    # Retornar como listas (compatible con API existente)
    # ---------------------------------------------------------------
    if not section_ids and not permission_codes:
        return [], []

    return list(section_ids), list(permission_codes)


def _collect_section_access(accesses, section_ids, permission_codes):
    """
    Collects section_ids and permission_codes from a queryset of
    SectionAccess records (CargoSectionAccess, RolAdicionalSectionAccess,
    or GroupSectionAccess).

    All three models share the same field structure (can_view, can_create,
    can_edit, can_delete, custom_actions, section FK).

    Args:
        accesses: QuerySet of *SectionAccess records
        section_ids: set to accumulate viewable section IDs
        permission_codes: set to accumulate permission code strings
    """
    for access in accesses:
        if access.can_view:
            section_ids.add(access.section_id)

        section = access.section
        try:
            module_code = section.tab.module.code.lower()
            section_code = section.code.lower()
        except AttributeError:
            logger.warning(
                '%s id=%d: section sin tab o module',
                type(access).__name__, access.id
            )
            continue

        if access.can_view:
            permission_codes.add(f"{module_code}.{section_code}.view")
        if access.can_create:
            permission_codes.add(f"{module_code}.{section_code}.create")
        if access.can_edit:
            permission_codes.add(f"{module_code}.{section_code}.edit")
        if access.can_delete:
            permission_codes.add(f"{module_code}.{section_code}.delete")

        # Custom actions (enviar, aprobar, etc.)
        if access.custom_actions:
            for action_code, enabled in access.custom_actions.items():
                if enabled:
                    permission_codes.add(
                        f"{module_code}.{section_code}.{action_code}"
                    )
