"""
MS-003: User Preferences Views
Sistema de Gestión StrateKaz

Vistas para gestión de preferencias de usuario (singleton pattern).
"""
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from apps.core.models import UserPreferences
from apps.core.serializers import UserPreferencesSerializer
from apps.core.utils.audit_logging import log_preferences_updated
import logging

logger = logging.getLogger('audit')


class UserPreferencesView(APIView):
    """
    Gestión de preferencias del usuario autenticado (singleton).

    Solo maneja las preferencias del usuario actual, no requiere pk en la URL.

    Endpoints:
    - GET /api/core/user-preferences/ - Obtener preferencias
    - PUT /api/core/user-preferences/ - Actualizar completo
    - PATCH /api/core/user-preferences/ - Actualizar parcial
    """
    permission_classes = [IsAuthenticated]

    def get_object(self):
        """
        Obtiene o crea las preferencias del usuario actual.
        Siempre retorna las preferencias, creándolas si no existen.
        """
        preferences, created = UserPreferences.get_or_create_for_user(self.request.user)

        if created:
            logger.info(
                f"MS-003: Preferencias creadas automáticamente para usuario {self.request.user.username}"
            )

        return preferences

    def get(self, request):
        """
        GET /api/core/user-preferences/

        Obtiene las preferencias del usuario actual.
        Si no existen, las crea con valores por defecto.
        """
        preferences = self.get_object()
        serializer = UserPreferencesSerializer(preferences)
        return Response(serializer.data)

    def put(self, request):
        """
        PUT /api/core/user-preferences/

        Actualiza completamente las preferencias del usuario actual.
        """
        preferences = self.get_object()
        serializer = UserPreferencesSerializer(
            preferences,
            data=request.data,
            partial=False
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()

        # Logging de auditoría
        log_preferences_updated(request.user, serializer.validated_data)

        return Response(serializer.data)

    def patch(self, request):
        """
        PATCH /api/core/user-preferences/

        Actualiza parcialmente las preferencias del usuario actual.
        """
        preferences = self.get_object()
        serializer = UserPreferencesSerializer(
            preferences,
            data=request.data,
            partial=True
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()

        # Logging de auditoría
        log_preferences_updated(request.user, serializer.validated_data)

        return Response(serializer.data)
