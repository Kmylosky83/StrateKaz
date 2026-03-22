"""
Views para el módulo Core
Incluye health check para Docker y vistas de autenticación
"""
from django.http import JsonResponse
from django.views.decorators.http import require_GET
from django.db import connection
from django.views.decorators.csrf import csrf_exempt
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status as http_status
from celery.result import AsyncResult


@require_GET
@csrf_exempt
def health_check(request):
    """
    Endpoint de health check básico para monitoreo de uptime.

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
            'service': 'stratekaz-backend',
            'version': '1.0.0'
        }, status=200)

    except Exception as e:
        return JsonResponse({
            'status': 'unhealthy',
            'database': 'disconnected',
            'service': 'stratekaz-backend',
            'error': str(e)
        }, status=503)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def health_check_deep(request):
    """
    Endpoint de health check profundo para diagnóstico detallado.
    Requiere autenticación (IsAuthenticated).

    GET /api/core/health-deep/

    Verifica:
    - Conectividad a la base de datos con query de prueba
    - Espacio en disco disponible
    - Estado del cache (Redis)
    - Celery workers
    - Timestamp de verificación

    Returns:
        Response con status 200 si todo está OK
        Response con status 503 si hay problemas críticos
    """
    import shutil
    from datetime import datetime
    from django.conf import settings
    from django.core.cache import cache

    checks = {
        'timestamp': datetime.now().isoformat(),
        'service': 'stratekaz-backend',
        'version': '5.3.0',
        'environment': getattr(settings, 'SENTRY_ENVIRONMENT', 'unknown'),
    }
    all_healthy = True

    # 1. Verificar base de datos
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            cursor.execute("SELECT COUNT(*) FROM django_migrations")
            migration_count = cursor.fetchone()[0]
        checks['database'] = {
            'status': 'connected',
            'migrations_count': migration_count,
        }
    except Exception as e:
        checks['database'] = {
            'status': 'error',
            'error': str(e),
        }
        all_healthy = False

    # 2. Verificar espacio en disco
    try:
        base_path = settings.BASE_DIR
        total, used, free = shutil.disk_usage(base_path)
        used_percent = (used / total) * 100
        free_gb = free / (1024 ** 3)

        if used_percent > 90:
            disk_status = 'critical'
            all_healthy = False
        elif used_percent > 80:
            disk_status = 'warning'
        else:
            disk_status = 'healthy'

        checks['disk'] = {
            'status': disk_status,
            'used_percent': round(used_percent, 1),
            'free_gb': round(free_gb, 1),
            'path': str(base_path),
        }
    except Exception as e:
        checks['disk'] = {
            'status': 'error',
            'error': str(e),
        }

    # 3. Verificar cache (Redis)
    try:
        cache_key = '_health_check_test_'
        cache.set(cache_key, 'ok', 10)
        cache_value = cache.get(cache_key)
        cache.delete(cache_key)

        checks['cache'] = {
            'status': 'connected' if cache_value == 'ok' else 'error',
            'backend': settings.CACHES.get('default', {}).get('BACKEND', 'unknown').split('.')[-1],
        }
        if cache_value != 'ok':
            all_healthy = False
    except Exception as e:
        checks['cache'] = {
            'status': 'error',
            'error': str(e),
        }
        all_healthy = False

    # 4. Verificar Celery workers
    try:
        from config.celery import app as celery_app

        inspector = celery_app.control.inspect(timeout=3.0)
        ping_result = inspector.ping()
        if ping_result:
            worker_count = len(ping_result)
            checks['celery'] = {
                'status': 'healthy',
                'workers': worker_count,
            }
        else:
            checks['celery'] = {
                'status': 'error',
                'message': 'No hay workers respondiendo',
            }
            all_healthy = False
    except Exception as e:
        checks['celery'] = {
            'status': 'error',
            'error': str(e),
        }

    # 5. Verificar directorio de logs
    try:
        logs_dir = settings.BASE_DIR / 'logs'
        if logs_dir.exists():
            log_files = list(logs_dir.glob('*.log'))
            total_log_size = sum(f.stat().st_size for f in log_files) / (1024 * 1024)
            checks['logs'] = {
                'status': 'ok' if total_log_size < 100 else 'warning',
                'total_size_mb': round(total_log_size, 2),
                'file_count': len(log_files),
            }
        else:
            checks['logs'] = {'status': 'ok', 'message': 'directorio de logs no encontrado'}
    except Exception as e:
        checks['logs'] = {
            'status': 'error',
            'error': str(e),
        }

    # Resultado final
    checks['overall_status'] = 'healthy' if all_healthy else 'unhealthy'

    return Response(checks, status=http_status.HTTP_200_OK if all_healthy else http_status.HTTP_503_SERVICE_UNAVAILABLE)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def current_user(request):
    """
    Endpoint para obtener información del usuario autenticado actual

    Returns:
        JsonResponse con datos del usuario
    """
    user = request.user

    # RBAC Unificado v4.0: fuente única de verdad desde CargoSectionAccess
    from apps.core.utils.rbac import compute_user_rbac
    section_ids, permission_codes = compute_user_rbac(user)

    # 3. Obtener empresa_nombre desde el Tenant actual
    # NOTA: El branding (incluyendo company_name) está ahora en el modelo Tenant
    empresa_nombre = None
    if hasattr(request, 'tenant') and request.tenant:
        empresa_nombre = request.tenant.name

    # 4. Obtener area_nombre desde cargo.area
    area_nombre = None
    if user.cargo and hasattr(user.cargo, 'area') and user.cargo.area:
        area_nombre = user.cargo.area.name

    # 5. Obtener photo_url (URL completa de la foto de perfil)
    photo_url = None
    if user.photo:
        photo_url = request.build_absolute_uri(user.photo.url)

    # 6. Proveedor vinculado (portal proveedor / profesional externo)
    proveedor_nombre = None
    if user.proveedor_id_ext:
        try:
            from django.apps import apps as django_apps
            Proveedor = django_apps.get_model('gestion_proveedores', 'Proveedor')
            prov = Proveedor.objects.filter(pk=user.proveedor_id_ext).first()
            proveedor_nombre = prov.nombre_comercial if prov else None
        except (LookupError, Exception):
            pass

    # 7. Cliente vinculado (portal cliente)
    cliente_nombre = None
    if user.cliente_id_ext:
        try:
            from django.apps import apps as django_apps
            Cliente = django_apps.get_model('gestion_clientes', 'Cliente')
            cli = Cliente.objects.filter(pk=user.cliente_id_ext).first()
            cliente_nombre = (cli.nombre_comercial or cli.razon_social) if cli else None
        except (LookupError, Exception):
            pass

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
        'cargo_name': user.cargo.name if user.cargo else None,
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
        # RBAC Data required by frontend
        'section_ids': section_ids,
        'permission_codes': permission_codes,
        # Datos de contexto laboral (agregados para perfil)
        'empresa_nombre': empresa_nombre,
        'area_nombre': area_nombre,
        # Foto de perfil
        'photo_url': photo_url,
        # Portal: proveedor/cliente vinculado
        'proveedor': user.proveedor_id_ext,
        'proveedor_nombre': proveedor_nombre,
        'cliente': user.cliente_id_ext,
        'cliente_nombre': cliente_nombre,
    })


# ═══════════════════════════════════════════════════
# LOGOUT ENDPOINT (P0-03)
# ═══════════════════════════════════════════════════

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    """
    Endpoint de logout que invalida el refresh token (P0-03)

    POST /api/auth/logout/

    Body:
        {
            "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
        }

    Returns:
        204 No Content si el logout fue exitoso
        400 Bad Request si el token es inválido
    """
    from apps.core.serializers import LogoutSerializer
    import logging

    logger = logging.getLogger('security')

    serializer = LogoutSerializer(data=request.data)
    if serializer.is_valid():
        try:
            serializer.save()
            # Log de seguridad para auditoría
            logger.info(
                f"Logout exitoso - User: {request.user.username} (ID: {request.user.id}) "
                f"- IP: {request.META.get('REMOTE_ADDR', 'unknown')}"
            )
            return Response(status=http_status.HTTP_204_NO_CONTENT)
        except Exception as e:
            logger.warning(
                f"Error en logout - User: {request.user.username} - Error: {str(e)}"
            )
            return Response(
                {'error': 'Error al invalidar el token'},
                status=http_status.HTTP_400_BAD_REQUEST
            )

    return Response(serializer.errors, status=http_status.HTTP_400_BAD_REQUEST)


# ═══════════════════════════════════════════════════
# CELERY TASK ENDPOINTS
# ═══════════════════════════════════════════════════

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def test_celery_task(request):
    """
    Endpoint de prueba para ejecutar una tarea de Celery.

    POST /api/core/test-celery/

    Body:
        {
            "task_type": "example|email|report|health_check",
            "params": {...}
        }
    """
    from apps.core.tasks import (
        example_task,
        send_email_async,
        generate_report_async,
        system_health_check,
    )

    task_type = request.data.get('task_type', 'example')
    params = request.data.get('params', {})

    try:
        if task_type == 'example':
            task = example_task.delay(
                params.get('param1', 'test_value'),
                param2=params.get('param2', 0)
            )

        elif task_type == 'email':
            task = send_email_async.delay(
                subject=params.get('subject', 'Test Email'),
                message=params.get('message', 'Test message from Celery'),
                recipient_list=params.get('recipients', [request.user.email]),
                html_message=params.get('html_message', None),
            )

        elif task_type == 'report':
            task = generate_report_async.delay(
                report_type=params.get('report_type', 'test_report'),
                params=params.get('report_params', {}),
                user_id=request.user.id,
            )

        elif task_type == 'health_check':
            task = system_health_check.delay()

        else:
            return Response(
                {'error': f'Invalid task_type: {task_type}'},
                status=http_status.HTTP_400_BAD_REQUEST
            )

        return Response({
            'status': 'success',
            'message': 'Task queued successfully',
            'task_id': task.id,
            'task_type': task_type,
            'task_state': task.state,
        }, status=http_status.HTTP_201_CREATED)

    except Exception as e:
        return Response(
            {'error': str(e)},
            status=http_status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def task_status(request, task_id):
    """
    Obtener el estado de una tarea de Celery.

    GET /api/core/task-status/{task_id}/

    Returns:
        {
            "task_id": "...",
            "state": "PENDING|STARTED|SUCCESS|FAILURE|RETRY|REVOKED",
            "result": {...},
            "error": "...",
            "traceback": "..."
        }
    """
    try:
        task = AsyncResult(task_id)

        response_data = {
            'task_id': task_id,
            'state': task.state,
            'ready': task.ready(),
            'successful': task.successful() if task.ready() else None,
            'failed': task.failed() if task.ready() else None,
        }

        if task.state == 'PENDING':
            response_data['info'] = 'Task is waiting for execution'

        elif task.state == 'STARTED':
            response_data['info'] = 'Task has started'

        elif task.state == 'PROGRESS':
            response_data['progress'] = task.info

        elif task.state == 'SUCCESS':
            response_data['result'] = task.result

        elif task.state == 'FAILURE':
            response_data['error'] = str(task.info)
            response_data['traceback'] = task.traceback

        return Response(response_data, status=http_status.HTTP_200_OK)

    except Exception as e:
        return Response(
            {'error': str(e)},
            status=http_status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def revoke_task(request, task_id):
    """
    Revocar/cancelar una tarea de Celery.

    POST /api/core/revoke-task/{task_id}/

    Body:
        {
            "terminate": true|false  // Terminar inmediatamente si está en ejecución
        }
    """
    try:
        from celery.task.control import revoke

        terminate = request.data.get('terminate', False)

        revoke(task_id, terminate=terminate)

        return Response({
            'status': 'success',
            'message': f'Task {task_id} revoked',
            'task_id': task_id,
            'terminated': terminate,
        }, status=http_status.HTTP_200_OK)

    except Exception as e:
        return Response(
            {'error': str(e)},
            status=http_status.HTTP_500_INTERNAL_SERVER_ERROR
        )
