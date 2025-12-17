"""
Permissions personalizados del módulo Recepciones
Sistema de Gestión Grasas y Huesos del Norte
"""
from rest_framework import permissions
from apps.core.permissions_constants import CargoCodes


class PuedeVerRecepciones(permissions.BasePermission):
    """
    Permiso para ver recepciones

    Todos los roles autenticados pueden ver recepciones,
    pero el queryset se filtra según el rol en el ViewSet:
    - Recolector: Solo recepciones relacionadas con sus recolecciones
    - Líderes/Gerente/SuperAdmin: Todas las recepciones
    """

    message = 'Debe estar autenticado para ver recepciones.'

    def has_permission(self, request, view):
        """Verificar permiso a nivel de vista"""
        # Solo requiere autenticación
        return request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        """Verificar permiso a nivel de objeto (recepción específica)"""
        # SuperAdmin tiene todos los permisos
        if request.user.is_superuser:
            return True

        # Gerente (nivel 3+) puede ver todas las recepciones
        if request.user.has_cargo_level(3):
            return True

        # Verificar que tenga cargo
        if not request.user.cargo:
            return False

        # Líder Logística puede ver todas las recepciones
        if request.user.cargo.code == CargoCodes.LIDER_LOGISTICA_ECONORTE:
            return True

        # Recolector solo puede ver recepciones de sus propias recolecciones
        if request.user.cargo.code == CargoCodes.RECOLECTOR_ECONORTE:
            # Verificar si la recepción está relacionada con alguna de sus recolecciones
            if hasattr(obj, 'recoleccion') and obj.recoleccion:
                return obj.recoleccion.recolector == request.user
            return False

        return True


class PuedeIniciarRecepcion(permissions.BasePermission):
    """
    Permiso para iniciar/crear nuevas recepciones

    Roles permitidos:
    - Líder Logística Econorte: Puede iniciar recepciones
    - Gerente: Puede iniciar recepciones
    - SuperAdmin: Puede iniciar recepciones
    """

    message = 'No tiene permisos para iniciar recepciones. Se requiere cargo de Líder Logística o superior.'

    def has_permission(self, request, view):
        """Verificar permiso a nivel de vista"""
        # Verificar autenticación
        if not request.user or not request.user.is_authenticated:
            return False

        # SuperAdmin tiene todos los permisos
        if request.user.is_superuser:
            return True

        # Verificar que tenga cargo
        if not request.user.cargo:
            return False

        # Líder Logística Econorte puede iniciar recepciones
        if request.user.cargo.code == CargoCodes.LIDER_LOGISTICA_ECONORTE:
            return True

        # Gerente (nivel 3+) puede iniciar recepciones
        if request.user.has_cargo_level(3):
            return True

        return False


class PuedeRegistrarPesaje(permissions.BasePermission):
    """
    Permiso para registrar peso en báscula

    Roles permitidos:
    - Líder Logística Econorte: Puede registrar pesaje
    - Gerente: Puede registrar pesaje
    - SuperAdmin: Puede registrar pesaje
    """

    message = 'No tiene permisos para registrar pesaje. Se requiere cargo de Líder Logística o superior.'

    def has_permission(self, request, view):
        """Verificar permiso a nivel de vista"""
        # Verificar autenticación
        if not request.user or not request.user.is_authenticated:
            return False

        # SuperAdmin tiene todos los permisos
        if request.user.is_superuser:
            return True

        # Verificar que tenga cargo
        if not request.user.cargo:
            return False

        # Líder Logística Econorte puede registrar pesaje
        if request.user.cargo.code == CargoCodes.LIDER_LOGISTICA_ECONORTE:
            return True

        # Gerente (nivel 3+) puede registrar pesaje
        if request.user.has_cargo_level(3):
            return True

        return False

    def has_object_permission(self, request, view, obj):
        """Verificar permiso a nivel de objeto (recepción específica)"""
        # SuperAdmin tiene todos los permisos
        if request.user.is_superuser:
            return True

        # Gerente (nivel 3+) puede registrar pesaje en cualquier recepción
        if request.user.has_cargo_level(3):
            return True

        # Verificar que tenga cargo
        if not request.user.cargo:
            return False

        # Líder Logística puede registrar pesaje en cualquier recepción
        if request.user.cargo.code == CargoCodes.LIDER_LOGISTICA_ECONORTE:
            return True

        return False


class PuedeConfirmarRecepcion(permissions.BasePermission):
    """
    Permiso para confirmar recepciones

    Roles permitidos:
    - Líder Logística Econorte: Puede confirmar recepciones
    - Gerente: Puede confirmar recepciones
    - SuperAdmin: Puede confirmar recepciones
    """

    message = 'No tiene permisos para confirmar recepciones. Se requiere cargo de Líder Logística o superior.'

    def has_permission(self, request, view):
        """Verificar permiso a nivel de vista"""
        # Verificar autenticación
        if not request.user or not request.user.is_authenticated:
            return False

        # SuperAdmin tiene todos los permisos
        if request.user.is_superuser:
            return True

        # Verificar que tenga cargo
        if not request.user.cargo:
            return False

        # Líder Logística Econorte puede confirmar recepciones
        if request.user.cargo.code == CargoCodes.LIDER_LOGISTICA_ECONORTE:
            return True

        # Gerente (nivel 3+) puede confirmar recepciones
        if request.user.has_cargo_level(3):
            return True

        return False

    def has_object_permission(self, request, view, obj):
        """Verificar permiso a nivel de objeto (recepción específica)"""
        # SuperAdmin tiene todos los permisos
        if request.user.is_superuser:
            return True

        # Gerente (nivel 3+) puede confirmar cualquier recepción
        if request.user.has_cargo_level(3):
            return True

        # Verificar que tenga cargo
        if not request.user.cargo:
            return False

        # Líder Logística puede confirmar cualquier recepción
        if request.user.cargo.code == CargoCodes.LIDER_LOGISTICA_ECONORTE:
            return True

        return False


class PuedeCancelarRecepcion(permissions.BasePermission):
    """
    Permiso para cancelar recepciones

    Roles permitidos:
    - Líder Logística Econorte: Puede cancelar recepciones INICIADA
    - Gerente: Puede cancelar recepciones INICIADA y PESADA
    - SuperAdmin: Puede cancelar cualquier recepción

    Notas:
    - Solo recepciones no confirmadas pueden ser canceladas
    - El estado de la recepción determina qué roles pueden cancelarla
    """

    message = 'No tiene permisos para cancelar recepciones. Se requiere cargo de Líder Logística o superior.'

    def has_permission(self, request, view):
        """Verificar permiso a nivel de vista"""
        # Verificar autenticación
        if not request.user or not request.user.is_authenticated:
            return False

        # SuperAdmin tiene todos los permisos
        if request.user.is_superuser:
            return True

        # Verificar que tenga cargo
        if not request.user.cargo:
            return False

        # Líder Logística Econorte puede cancelar recepciones INICIADA
        if request.user.cargo.code == CargoCodes.LIDER_LOGISTICA_ECONORTE:
            return True

        # Gerente (nivel 3+) puede cancelar recepciones
        if request.user.has_cargo_level(3):
            return True

        return False

    def has_object_permission(self, request, view, obj):
        """Verificar permiso a nivel de objeto (recepción específica)"""
        # SuperAdmin tiene todos los permisos
        if request.user.is_superuser:
            return True

        # Gerente (nivel 3+) puede cancelar cualquier recepción cancelable
        if request.user.has_cargo_level(3):
            return True

        # Verificar que tenga cargo
        if not request.user.cargo:
            return False

        # Líder Logística puede cancelar recepciones en estado INICIADA
        if request.user.cargo.code == CargoCodes.LIDER_LOGISTICA_ECONORTE:
            # Solo puede cancelar si está en estado INICIADA
            if hasattr(obj, 'estado') and obj.estado == 'INICIADA':
                return True
            return False

        return False


class PuedeVerEstadisticasRecepcion(permissions.BasePermission):
    """
    Permiso para ver estadísticas de recepciones

    Roles permitidos:
    - Líder Logística Econorte: Puede ver estadísticas
    - Líder Comercial Econorte: Puede ver estadísticas
    - Gerente: Puede ver todas las estadísticas
    - SuperAdmin: Puede ver todas las estadísticas
    """

    message = 'No tiene permisos para ver estadísticas de recepciones.'

    def has_permission(self, request, view):
        """Verificar permiso a nivel de vista"""
        # Verificar autenticación
        if not request.user or not request.user.is_authenticated:
            return False

        # SuperAdmin tiene todos los permisos
        if request.user.is_superuser:
            return True

        # Verificar que tenga cargo
        if not request.user.cargo:
            return False

        # Códigos de cargo permitidos para ver estadísticas
        cargos_permitidos = [
            CargoCodes.LIDER_LOGISTICA_ECONORTE,
            CargoCodes.LIDER_COMERCIAL_ECONORTE,
        ]

        if request.user.cargo.code in cargos_permitidos:
            return True

        # Gerente (nivel 3+) puede ver estadísticas
        if request.user.has_cargo_level(3):
            return True

        return False


# Alias para compatibilidad con views
PuedeVerEstadisticas = PuedeVerEstadisticasRecepcion
