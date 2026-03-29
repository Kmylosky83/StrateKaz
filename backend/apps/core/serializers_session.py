"""
MS-002-A: Serializers para Sesiones de Usuario

Serializers para gestión de sesiones activas.
"""
from rest_framework import serializers
from django.utils import timezone
from .models import UserSession


class UserSessionSerializer(serializers.ModelSerializer):
    """
    Serializer completo para UserSession.
    Incluye campos calculados para UI.
    """
    device_display = serializers.SerializerMethodField()
    time_remaining = serializers.SerializerMethodField()
    time_elapsed = serializers.SerializerMethodField()

    class Meta:
        model = UserSession
        fields = [
            'id',
            'device_type',
            'device_os',
            'device_browser',
            'device_name',
            'device_display',
            'ip_address',
            'country',
            'city',
            'created_at',
            'last_activity',
            'expires_at',
            'time_remaining',
            'time_elapsed',
            'is_active',
            'is_current',
        ]
        read_only_fields = [
            'id',
            'device_type',
            'device_os',
            'device_browser',
            'ip_address',
            'country',
            'city',
            'created_at',
            'last_activity',
            'expires_at',
            'is_active',
            'is_current',
        ]

    def get_device_display(self, obj) -> str:
        """Genera nombre legible del dispositivo."""
        if obj.device_name:
            return obj.device_name
        return f"{obj.device_browser} en {obj.device_os}"

    def get_time_remaining(self, obj) -> str | None:
        """Tiempo restante hasta expiración en formato legible."""
        if obj.is_expired:
            return None
        delta = obj.expires_at - timezone.now()
        seconds = max(0, int(delta.total_seconds()))

        if seconds < 60:
            return "menos de 1 min"
        elif seconds < 3600:
            return f"{seconds // 60} min"
        elif seconds < 86400:
            hours = seconds // 3600
            return f"{hours}h"
        else:
            days = seconds // 86400
            return f"{days} días"

    def get_time_elapsed(self, obj) -> str:
        """Tiempo transcurrido desde última actividad."""
        delta = timezone.now() - obj.last_activity
        seconds = int(delta.total_seconds())

        if seconds < 60:
            return "Hace un momento"
        elif seconds < 3600:
            minutes = seconds // 60
            return f"Hace {minutes} min"
        elif seconds < 86400:
            hours = seconds // 3600
            return f"Hace {hours}h"
        else:
            days = seconds // 86400
            return f"Hace {days} días"


class UserSessionListSerializer(UserSessionSerializer):
    """
    Serializer para listados — hereda del completo porque el FE
    necesita device_os, device_browser, city, country, time_remaining, device_name.
    """
    pass


class UpdateDeviceNameSerializer(serializers.Serializer):
    """
    Serializer para actualizar nombre de dispositivo.
    """
    device_name = serializers.CharField(
        max_length=100,
        required=True,
        help_text="Nombre personalizado para este dispositivo"
    )

    def validate_device_name(self, value):
        """Validar y limpiar nombre."""
        value = value.strip()
        if len(value) < 2:
            raise serializers.ValidationError(
                "El nombre debe tener al menos 2 caracteres"
            )
        return value
