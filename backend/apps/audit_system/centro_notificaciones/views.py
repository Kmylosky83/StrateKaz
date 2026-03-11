"""Views para centro_notificaciones"""
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import extend_schema, extend_schema_view, OpenApiParameter
from drf_spectacular.types import OpenApiTypes
from .models import TipoNotificacion, Notificacion, PreferenciaNotificacion, NotificacionMasiva
from .serializers import TipoNotificacionSerializer, NotificacionSerializer, PreferenciaNotificacionSerializer, NotificacionMasivaSerializer
from apps.core.permissions import GranularActionPermission


class TipoNotificacionViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión de tipos de notificación

    RBAC: Requiere acceso a sección 'centro_notificaciones'
    """
    queryset = TipoNotificacion.objects.all()
    serializer_class = TipoNotificacionSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['categoria', 'is_active']

    # RBAC Configuration
    permission_classes = [IsAuthenticated, GranularActionPermission]
    section_code = 'centro_notificaciones'
    granular_action_map = {
        'list': 'can_view',
        'retrieve': 'can_view',
        'create': 'can_create',
        'update': 'can_edit',
        'partial_update': 'can_edit',
        'destroy': 'can_delete',
    }

@extend_schema_view(
    list=extend_schema(
        summary='Listar notificaciones',
        description='Obtiene todas las notificaciones del sistema con filtros por usuario, estado y prioridad',
        tags=['Audit System']
    ),
    retrieve=extend_schema(
        summary='Obtener detalle de notificación',
        description='Obtiene el detalle completo de una notificación específica',
        tags=['Audit System']
    ),
    create=extend_schema(
        summary='Crear nueva notificación',
        description='Crea una nueva notificación para un usuario',
        tags=['Audit System']
    ),
    update=extend_schema(
        summary='Actualizar notificación',
        description='Actualiza una notificación existente',
        tags=['Audit System']
    ),
    destroy=extend_schema(
        summary='Eliminar notificación',
        description='Elimina una notificación del sistema',
        tags=['Audit System']
    )
)
class NotificacionViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión de notificaciones del sistema

    Permite administrar las notificaciones enviadas a los usuarios, incluyendo:
    - Creación y envío de notificaciones
    - Marcado de lectura individual y masivo
    - Filtrado por estado y prioridad
    - Consulta de notificaciones no leídas

    RBAC: Acciones personales (no_leidas, marcar_leida) solo requieren IsAuthenticated.
    CRUD admin requiere acceso a sección 'centro_notificaciones'.
    """
    queryset = Notificacion.objects.select_related('tipo', 'usuario')
    serializer_class = NotificacionSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['usuario', 'esta_leida', 'prioridad']

    # RBAC Configuration (aplica solo a CRUD admin)
    permission_classes = [IsAuthenticated, GranularActionPermission]
    section_code = 'centro_notificaciones'
    granular_action_map = {
        'list': 'can_view',
        'retrieve': 'can_view',
        'create': 'can_create',
        'update': 'can_edit',
        'partial_update': 'can_edit',
        'destroy': 'can_delete',
    }

    # Acciones personales: solo IsAuthenticated (C0 plataforma)
    PERSONAL_ACTIONS = ('no_leidas', 'marcar_leida', 'marcar_todas_leidas')

    def get_permissions(self):
        if self.action in self.PERSONAL_ACTIONS:
            return [IsAuthenticated()]
        return super().get_permissions()

    @extend_schema(
        summary='Marcar notificación como leída',
        description='Marca una notificación específica como leída',
        tags=['Audit System']
    )
    @action(detail=True, methods=['post'], url_path='marcar-leida')
    def marcar_leida(self, request, pk=None):
        notif = self.get_object()
        notif.marcar_leida()
        return Response({'status': 'marked as read'})

    @extend_schema(
        summary='Marcar todas las notificaciones como leídas',
        description='Marca todas las notificaciones de un usuario como leídas',
        tags=['Audit System'],
        parameters=[
            OpenApiParameter(
                name='usuario_id',
                type=OpenApiTypes.UUID,
                location=OpenApiParameter.QUERY,
                description='ID del usuario',
                required=True
            )
        ]
    )
    @action(detail=False, methods=['post'], url_path='marcar-todas-leidas')
    def marcar_todas_leidas(self, request):
        usuario_id = request.data.get('usuario_id')
        Notificacion.objects.filter(usuario_id=usuario_id, esta_leida=False).update(esta_leida=True)
        return Response({'status': 'all marked as read'})

    @extend_schema(
        summary='Obtener notificaciones no leídas',
        description='Retorna todas las notificaciones no leídas del usuario actual',
        tags=['Audit System']
    )
    @action(detail=False, methods=['get'], url_path='no-leidas')
    def no_leidas(self, request):
        # Usar el usuario actual si no se especifica usuario_id
        usuario_id = request.query_params.get('usuario_id', request.user.id)
        notifs = self.get_queryset().filter(usuario_id=usuario_id, esta_leida=False)
        serializer = self.get_serializer(notifs, many=True)
        return Response(serializer.data)

class PreferenciaNotificacionViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión de preferencias de notificación

    Permite a los usuarios configurar sus preferencias de notificación por categoría.

    RBAC: Requiere acceso a sección 'centro_notificaciones'
    """
    queryset = PreferenciaNotificacion.objects.select_related('usuario', 'tipo_notificacion')
    serializer_class = PreferenciaNotificacionSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['usuario', 'tipo_notificacion']

    # RBAC Configuration
    permission_classes = [IsAuthenticated, GranularActionPermission]
    section_code = 'centro_notificaciones'
    granular_action_map = {
        'list': 'can_view',
        'retrieve': 'can_view',
        'create': 'can_create',
        'update': 'can_edit',
        'partial_update': 'can_edit',
        'destroy': 'can_delete',
    }


class NotificacionMasivaViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión de notificaciones masivas

    RBAC: Requiere acceso a sección 'centro_notificaciones'
    """
    queryset = NotificacionMasiva.objects.all()
    serializer_class = NotificacionMasivaSerializer

    # RBAC Configuration
    permission_classes = [IsAuthenticated, GranularActionPermission]
    section_code = 'centro_notificaciones'
    granular_action_map = {
        'list': 'can_view',
        'retrieve': 'can_view',
        'create': 'can_create',
        'update': 'can_edit',
        'partial_update': 'can_edit',
        'destroy': 'can_delete',
    }
