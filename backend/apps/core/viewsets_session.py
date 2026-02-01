"""
MS-002-A: ViewSet para Sesiones de Usuario

Endpoints para gestionar sesiones activas del usuario autenticado.
"""
import logging
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone

from .models import UserSession
from .serializers_session import (
    UserSessionSerializer,
    UserSessionListSerializer,
    UpdateDeviceNameSerializer,
)

security_logger = logging.getLogger('security')


class UserSessionViewSet(viewsets.ViewSet):
    """
    ViewSet para gestión de sesiones activas del usuario.

    Solo permite ver y gestionar sesiones del usuario autenticado.

    Endpoints:
    - GET /api/core/sessions/ - Listar sesiones activas
    - GET /api/core/sessions/{id}/ - Detalle de sesión
    - DELETE /api/core/sessions/{id}/ - Cerrar sesión específica
    - DELETE /api/core/sessions/close-others/ - Cerrar todas excepto actual
    - GET /api/core/sessions/current/ - Sesión actual
    - PATCH /api/core/sessions/{id}/rename/ - Renombrar dispositivo
    """

    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Obtiene solo sesiones activas del usuario autenticado."""
        return UserSession.get_active_sessions(self.request.user)

    def list(self, request):
        """
        GET /api/core/sessions/

        Lista todas las sesiones activas del usuario.
        """
        queryset = self.get_queryset()

        # Marcar sesión actual si tenemos el token
        current_token = self._get_current_token(request)
        if current_token:
            current_hash = UserSession.hash_token(current_token)
            for session in queryset:
                session.is_current = (session.refresh_token_hash == current_hash)

        serializer = UserSessionListSerializer(queryset, many=True)
        return Response({
            'count': queryset.count(),
            'sessions': serializer.data
        })

    def retrieve(self, request, pk=None):
        """
        GET /api/core/sessions/{id}/

        Detalle de una sesión específica.
        """
        try:
            session = self.get_queryset().get(pk=pk)
        except UserSession.DoesNotExist:
            return Response(
                {'error': 'Sesión no encontrada'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Marcar si es actual
        current_token = self._get_current_token(request)
        if current_token:
            current_hash = UserSession.hash_token(current_token)
            session.is_current = (session.refresh_token_hash == current_hash)

        serializer = UserSessionSerializer(session)
        return Response(serializer.data)

    def destroy(self, request, pk=None):
        """
        DELETE /api/core/sessions/{id}/

        Cierra una sesión específica.
        No permite cerrar la sesión actual (usar logout para eso).
        """
        try:
            session = self.get_queryset().get(pk=pk)
        except UserSession.DoesNotExist:
            return Response(
                {'error': 'Sesión no encontrada'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Verificar que no sea la sesión actual
        current_token = self._get_current_token(request)
        if current_token:
            current_hash = UserSession.hash_token(current_token)
            if session.refresh_token_hash == current_hash:
                return Response(
                    {'error': 'No puedes cerrar tu sesión actual. Usa logout.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

        # Cerrar sesión
        session.close()

        security_logger.info(
            f"Sesión cerrada remotamente - User: {request.user.username} - "
            f"Session ID: {pk} - Device: {session.device_browser} en {session.device_os}"
        )

        return Response(
            {'message': 'Sesión cerrada correctamente'},
            status=status.HTTP_200_OK
        )

    @action(detail=False, methods=['delete'])
    def close_others(self, request):
        """
        DELETE /api/core/sessions/close-others/

        Cierra todas las sesiones excepto la actual.
        """
        queryset = self.get_queryset()

        # Identificar sesión actual
        current_token = self._get_current_token(request)
        if not current_token:
            return Response(
                {'error': 'No se pudo identificar la sesión actual'},
                status=status.HTTP_400_BAD_REQUEST
            )

        current_hash = UserSession.hash_token(current_token)

        # Cerrar todas excepto la actual
        other_sessions = queryset.exclude(refresh_token_hash=current_hash)
        count = other_sessions.count()

        for session in other_sessions:
            session.close()

        security_logger.info(
            f"Cerradas {count} sesiones remotamente - User: {request.user.username}"
        )

        return Response({
            'message': f'{count} sesiones cerradas',
            'count': count
        })

    @action(detail=False, methods=['get'])
    def current(self, request):
        """
        GET /api/core/sessions/current/

        Obtiene información de la sesión actual.
        """
        current_token = self._get_current_token(request)
        if not current_token:
            return Response(
                {'error': 'No se pudo identificar la sesión actual'},
                status=status.HTTP_404_NOT_FOUND
            )

        session = UserSession.get_by_token(current_token)
        if not session:
            return Response(
                {'error': 'Sesión actual no encontrada'},
                status=status.HTTP_404_NOT_FOUND
            )

        session.is_current = True
        serializer = UserSessionSerializer(session)
        return Response(serializer.data)

    @action(detail=True, methods=['patch'])
    def rename(self, request, pk=None):
        """
        PATCH /api/core/sessions/{id}/rename/

        Renombra un dispositivo para fácil identificación.
        """
        try:
            session = self.get_queryset().get(pk=pk)
        except UserSession.DoesNotExist:
            return Response(
                {'error': 'Sesión no encontrada'},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = UpdateDeviceNameSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        session.device_name = serializer.validated_data['device_name']
        session.save(update_fields=['device_name'])

        return Response({
            'message': 'Nombre actualizado',
            'device_name': session.device_name
        })

    @action(detail=False, methods=['post'])
    def cleanup(self, request):
        """
        POST /api/core/sessions/cleanup/

        Limpia sesiones expiradas (solo admin).
        """
        if not request.user.is_staff:
            return Response(
                {'error': 'Solo administradores'},
                status=status.HTTP_403_FORBIDDEN
            )

        count = UserSession.cleanup_expired()
        return Response({
            'message': f'{count} sesiones expiradas eliminadas',
            'count': count
        })

    def _get_current_token(self, request) -> str | None:
        """
        Extrae el refresh token actual del request.

        El token puede venir en:
        1. Header X-Refresh-Token
        2. Cookie refresh_token
        3. Body de la request (para ciertas operaciones)
        """
        # Intentar desde header
        token = request.META.get('HTTP_X_REFRESH_TOKEN')
        if token:
            return token

        # Intentar desde cookie
        token = request.COOKIES.get('refresh_token')
        if token:
            return token

        # Intentar desde body (si existe)
        if hasattr(request, 'data') and isinstance(request.data, dict):
            token = request.data.get('refresh_token')
            if token:
                return token

        return None
