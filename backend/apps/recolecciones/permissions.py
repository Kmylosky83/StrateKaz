"""
Permissions personalizados del módulo Recolecciones
Sistema de Gestión Grasas y Huesos del Norte
"""
from rest_framework import permissions


class PuedeRegistrarRecoleccion(permissions.BasePermission):
    """
    Permiso para registrar nuevas recolecciones

    Roles permitidos:
    - Recolector Econorte: Solo puede registrar sus propias recolecciones
    - Líder Logística Econorte: Puede registrar cualquier recolección
    - Gerente: Puede registrar cualquier recolección
    - SuperAdmin: Puede registrar cualquier recolección
    """

    message = 'No tiene permisos para registrar recolecciones. Se requiere cargo de Recolector, Líder Logística o superior.'

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

        # Códigos de cargo permitidos para registrar recolecciones
        cargos_permitidos = [
            'recolector_econorte',
            'lider_logistica_econorte',
        ]

        # Verificar si tiene el cargo permitido
        if request.user.cargo.code in cargos_permitidos:
            return True

        # Gerente (nivel 3+) puede registrar
        if request.user.has_cargo_level(3):
            return True

        return False


class PuedeVerRecolecciones(permissions.BasePermission):
    """
    Permiso para ver recolecciones

    Todos los roles autenticados pueden ver recolecciones,
    pero el queryset se filtra según el rol en el ViewSet:
    - Recolector: Solo sus recolecciones
    - Comercial: Recolecciones de sus ecoaliados
    - Líderes/Gerente/SuperAdmin: Todas las recolecciones
    """

    message = 'Debe estar autenticado para ver recolecciones.'

    def has_permission(self, request, view):
        """Verificar permiso a nivel de vista"""
        # Solo requiere autenticación
        return request.user and request.user.is_authenticated


class PuedeGenerarVoucher(permissions.BasePermission):
    """
    Permiso para generar/ver vouchers de recolecciones

    Roles permitidos:
    - Recolector Econorte: Solo sus propios vouchers
    - Líder Logística Econorte: Todos los vouchers
    - Gerente: Todos los vouchers
    - SuperAdmin: Todos los vouchers
    """

    message = 'No tiene permisos para generar vouchers.'

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

        # Códigos de cargo permitidos
        cargos_permitidos = [
            'recolector_econorte',
            'lider_logistica_econorte',
        ]

        if request.user.cargo.code in cargos_permitidos:
            return True

        # Gerente (nivel 3+) puede ver vouchers
        if request.user.has_cargo_level(3):
            return True

        return False

    def has_object_permission(self, request, view, obj):
        """Verificar permiso a nivel de objeto (recolección específica)"""
        # SuperAdmin tiene todos los permisos
        if request.user.is_superuser:
            return True

        # Gerente (nivel 3+) puede ver todos los vouchers
        if request.user.has_cargo_level(3):
            return True

        # Verificar que tenga cargo
        if not request.user.cargo:
            return False

        # Líder Logística puede ver todos los vouchers
        if request.user.cargo.code == 'lider_logistica_econorte':
            return True

        # Recolector solo puede ver sus propios vouchers
        if request.user.cargo.code == 'recolector_econorte':
            return obj.recolector == request.user

        return False


class PuedeVerEstadisticas(permissions.BasePermission):
    """
    Permiso para ver estadísticas de recolecciones

    Roles permitidos:
    - Líder Comercial Econorte: Puede ver estadísticas
    - Líder Logística Econorte: Puede ver estadísticas
    - Comercial Econorte: Puede ver estadísticas (filtradas por sus ecoaliados)
    - Gerente: Puede ver todas las estadísticas
    - SuperAdmin: Puede ver todas las estadísticas
    """

    message = 'No tiene permisos para ver estadísticas de recolecciones.'

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
            'lider_com_econorte',
            'comercial_econorte',
            'lider_logistica_econorte',
        ]

        if request.user.cargo.code in cargos_permitidos:
            return True

        # Gerente (nivel 3+) puede ver estadísticas
        if request.user.has_cargo_level(3):
            return True

        return False


class PuedeEditarRecoleccion(permissions.BasePermission):
    """
    Permiso para editar recolecciones

    Roles permitidos:
    - Líder Logística Econorte: Puede editar cualquier recolección
    - Gerente: Puede editar cualquier recolección
    - SuperAdmin: Puede editar cualquier recolección

    NOTA: Los recolectores NO pueden editar recolecciones una vez registradas
    """

    message = 'No tiene permisos para editar recolecciones. Se requiere cargo de Líder Logística o superior.'

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

        # Solo Líder Logística puede editar
        if request.user.cargo.code == 'lider_logistica_econorte':
            return True

        # Gerente (nivel 3+) puede editar
        if request.user.has_cargo_level(3):
            return True

        return False


class PuedeEliminarRecoleccion(permissions.BasePermission):
    """
    Permiso para eliminar recolecciones

    Roles permitidos:
    - Gerente: Puede eliminar cualquier recolección
    - SuperAdmin: Puede eliminar cualquier recolección

    CRÍTICO: Solo roles de Dirección (nivel 3+) pueden eliminar recolecciones
    """

    message = 'No tiene permisos para eliminar recolecciones. Se requiere cargo de Gerente o SuperAdmin.'

    def has_permission(self, request, view):
        """Verificar permiso a nivel de vista"""
        # Verificar autenticación
        if not request.user or not request.user.is_authenticated:
            return False

        # SuperAdmin tiene todos los permisos
        if request.user.is_superuser:
            return True

        # Solo Gerente (nivel 3+) puede eliminar
        if request.user.has_cargo_level(3):
            return True

        return False
