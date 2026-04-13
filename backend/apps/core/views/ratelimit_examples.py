"""
EJEMPLOS DE USO: Rate Limiting en vistas y ViewSets.

Este archivo muestra cómo aplicar rate limiting a diferentes endpoints.
NO USAR EN PRODUCCIÓN - Solo para referencia.
"""
from rest_framework import viewsets, status
from rest_framework.decorators import api_view, action
from rest_framework.response import Response
from rest_framework.views import APIView
from apps.core.decorators import (
    login_rate_limit,
    api_rate_limit,
    sensitive_rate_limit,
    password_reset_rate_limit,
    data_export_rate_limit,
    RateLimitMixin,
)


# ═══════════════════════════════════════════════════
# EJEMPLO 1: Function-based View con decorador
# ═══════════════════════════════════════════════════
@api_view(['POST'])
@login_rate_limit
def example_login_view(request):
    """
    Endpoint de login con rate limiting.
    Límite: 5 intentos por minuto.
    """
    # Lógica de autenticación
    return Response({'message': 'Login successful'})


@api_view(['POST'])
@password_reset_rate_limit
def example_password_reset_view(request):
    """
    Endpoint de reset de contraseña con rate limiting.
    Límite: 3 intentos por hora.
    """
    # Lógica de reset de contraseña
    return Response({'message': 'Password reset email sent'})


# ═══════════════════════════════════════════════════
# EJEMPLO 2: Class-based View con decorador
# ═══════════════════════════════════════════════════
class ExampleLoginView(APIView):
    """
    Vista de login con rate limiting aplicado al método dispatch.
    """

    @login_rate_limit
    def dispatch(self, request, *args, **kwargs):
        return super().dispatch(request, *args, **kwargs)

    def post(self, request):
        # Lógica de autenticación
        return Response({'message': 'Login successful'})


# ═══════════════════════════════════════════════════
# EJEMPLO 3: ViewSet con RateLimitMixin
# ═══════════════════════════════════════════════════
class ExampleUserViewSet(RateLimitMixin, viewsets.ModelViewSet):
    """
    ViewSet con rate limiting automático.
    Aplica límite a todas las acciones del ViewSet.
    """
    # Configurar límites personalizados
    rate_limit_key = 'user_viewset'
    rate_limit_limit = 50  # 50 requests
    rate_limit_period = 60  # por minuto

    # queryset y serializer_class aquí...

    @action(detail=False, methods=['post'])
    @data_export_rate_limit
    def export_data(self, request):
        """
        Acción personalizada con rate limiting adicional.
        Esta acción tiene un límite más restrictivo (5 por hora).
        """
        # Lógica de exportación
        return Response({'message': 'Export started'})


# ═══════════════════════════════════════════════════
# EJEMPLO 4: ViewSet con rate limiting selectivo
# ═══════════════════════════════════════════════════
class ExampleDataViewSet(viewsets.ModelViewSet):
    """
    ViewSet con rate limiting solo en acciones sensibles.
    """

    def list(self, request, *args, **kwargs):
        """Lista sin rate limiting restrictivo."""
        return super().list(request, *args, **kwargs)

    @sensitive_rate_limit
    def create(self, request, *args, **kwargs):
        """
        Creación con rate limiting.
        Límite: 10 por minuto.
        """
        return super().create(request, *args, **kwargs)

    @sensitive_rate_limit
    def update(self, request, *args, **kwargs):
        """
        Actualización con rate limiting.
        Límite: 10 por minuto.
        """
        return super().update(request, *args, **kwargs)

    @sensitive_rate_limit
    def destroy(self, request, *args, **kwargs):
        """
        Eliminación con rate limiting.
        Límite: 10 por minuto.
        """
        return super().destroy(request, *args, **kwargs)


# ═══════════════════════════════════════════════════
# EJEMPLO 5: Endpoint público con rate limiting
# ═══════════════════════════════════════════════════
@api_view(['POST'])
@api_rate_limit  # 100 requests por minuto
def example_public_api(request):
    """
    Endpoint público con rate limiting general.
    """
    return Response({'message': 'Public endpoint'})


# ═══════════════════════════════════════════════════
# CÓMO APLICAR EN TU PROYECTO:
# ═══════════════════════════════════════════════════
"""
1. Para endpoints de autenticación (login, registro):
   - Usar @login_rate_limit (5 por minuto)
   - Protege contra ataques de fuerza bruta

2. Para endpoints de reset de contraseña:
   - Usar @password_reset_rate_limit (3 por hora)
   - Previene abuso del sistema de notificaciones

3. Para endpoints de exportación de datos:
   - Usar @data_export_rate_limit (5 por hora)
   - Evita sobrecarga del servidor

4. Para endpoints sensibles (creación, actualización, eliminación):
   - Usar @sensitive_rate_limit (10 por minuto)
   - Protege recursos críticos

5. Para ViewSets completos:
   - Heredar de RateLimitMixin
   - Configurar rate_limit_key, rate_limit_limit, rate_limit_period

6. Para APIs públicas:
   - Usar @api_rate_limit (100 por minuto)
   - Balance entre usabilidad y protección
"""


# ═══════════════════════════════════════════════════
# MONITOREO DE RATE LIMITING
# ═══════════════════════════════════════════════════
"""
Los logs de rate limiting se guardan en:
- backend/logs/security.log

Formato de log:
{
    "timestamp": "2025-12-30 10:30:45",
    "level": "WARNING",
    "event": "Rate limit exceeded",
    "ip": "192.168.1.100",
    "endpoint": "/api/tenant/auth/login/",
    "limit": 5,
    "period": 60
}

Para monitorear en producción:
1. Revisar backend/logs/security.log regularmente
2. Configurar alertas para múltiples eventos de la misma IP
3. Bloquear IPs con comportamiento sospechoso (automático después de 10 eventos)
"""
