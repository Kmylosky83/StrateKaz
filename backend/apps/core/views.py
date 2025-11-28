"""
Views para el módulo Core
Incluye health check para Docker y vistas de autenticación
"""
from django.http import JsonResponse
from django.views.decorators.http import require_GET
from django.db import connection
from django.views.decorators.csrf import csrf_exempt


@require_GET
@csrf_exempt
def health_check(request):
    """
    Endpoint de health check para Docker healthcheck
    
    Verifica:
    - Conectividad a la base de datos
    - Estado general de la aplicación
    
    Returns:
        JsonResponse con status 200 si todo está OK
        JsonResponse con status 503 si hay problemas
    """
    try:
        # Verificar conexión a la base de datos
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            db_status = 'connected'
        
        return JsonResponse({
            'status': 'healthy',
            'database': db_status,
            'service': 'grasas-huesos-backend',
            'version': '1.0.0'
        }, status=200)
    
    except Exception as e:
        return JsonResponse({
            'status': 'unhealthy',
            'database': 'disconnected',
            'service': 'grasas-huesos-backend',
            'error': str(e)
        }, status=503)


from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def current_user(request):
    """
    Endpoint para obtener información del usuario autenticado actual
    
    Returns:
        JsonResponse con datos del usuario
    """
    user = request.user
    
    return Response({
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'first_name': user.first_name,
        'last_name': user.last_name,
        'full_name': user.get_full_name(),
        'cargo': {
            'id': user.cargo.id,
            'code': user.cargo.code,
            'name': user.cargo.name,
            'level': user.cargo.level,
        } if user.cargo else None,
        'cargo_code': user.cargo_code,
        'cargo_level': user.cargo_level,
        'phone': user.phone,
        'document_type': user.document_type,
        'document_type_display': user.get_document_type_display(),
        'document_number': user.document_number,
        'is_active': user.is_active,
        'is_staff': user.is_staff,
        'is_superuser': user.is_superuser,
        'is_deleted': user.is_deleted,
        'date_joined': user.date_joined,
        'last_login': user.last_login,
    })
