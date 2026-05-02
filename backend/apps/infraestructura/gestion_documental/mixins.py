"""
Mixins para Gestión Documental
==============================

DocumentoAccessMixin: Valida acceso basado en clasificación del documento.

Lógica (Arquitectura GD v5, sección 8.5):
  - PUBLICO / INTERNO → visible para todo el tenant
  - CONFIDENCIAL / RESTRINGIDO → solo si:
      * user está en usuarios_autorizados, O
      * user.cargo está en cargos_distribucion, O
      * user es elaborado_por, revisado_por o aprobado_por
"""
from rest_framework.exceptions import PermissionDenied


def check_acceso_documento(usuario, documento):
    """
    Verifica si el usuario tiene acceso al documento según su clasificación.
    Retorna True si tiene acceso, False si no.
    """
    if documento.clasificacion not in ('CONFIDENCIAL', 'RESTRINGIDO'):
        return True

    # Responsables del documento siempre tienen acceso
    if usuario.id in (
        documento.elaborado_por_id,
        documento.revisado_por_id,
        documento.aprobado_por_id,
    ):
        return True

    # Usuario explícitamente autorizado
    if documento.usuarios_autorizados.filter(id=usuario.id).exists():
        return True

    # Cargo del usuario está en los cargos de distribución
    cargo_id = getattr(usuario, 'cargo_id', None)
    if cargo_id and documento.cargos_distribucion.filter(id=cargo_id).exists():
        return True

    return False


def verificar_acceso_documento(usuario, documento):
    """
    Como check_acceso_documento pero lanza PermissionDenied si no tiene acceso.
    Usar en views donde se necesita cortar la ejecución.
    """
    if not check_acceso_documento(usuario, documento):
        raise PermissionDenied(
            'No tiene permiso para acceder a este documento. '
            'Los documentos con clasificación Confidencial o Restringido '
            'requieren autorización explícita.'
        )
