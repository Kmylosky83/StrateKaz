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
from rest_framework import status as http_status
from celery.result import AsyncResult


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
