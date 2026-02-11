"""
Tareas asíncronas para Multi-Tenant System

Este módulo implementa la creación asíncrona de schemas de tenant usando Celery,
con sistema de progreso en tiempo real via Redis.

ARQUITECTURA:
1. El ViewSet crea el registro de Tenant (sin schema)
2. Se encola la tarea create_tenant_schema_task
3. La tarea crea el schema y ejecuta migraciones
4. El progreso se publica en Redis (canal tenant_progress:{task_id})
5. El frontend recibe actualizaciones via WebSocket/polling

SEGURIDAD:
- Las tareas usan task_acks_late para garantizar que no se pierdan
- Si falla, el tenant queda marcado con schema_status='failed'
- Se puede reintentar manualmente desde Admin Global
"""
import logging
import json
import threading
from datetime import datetime
from typing import Optional, Dict, Any

from celery import shared_task, current_task
from django.db import connection, close_old_connections
from django.core.management import call_command
from django.conf import settings
from django_tenants.utils import schema_context, get_tenant_model
import redis

logger = logging.getLogger(__name__)

# Conexión a Redis para publicar progreso
def get_redis_client():
    """Obtener cliente Redis para publicar progreso."""
    return redis.Redis(
        host=settings.REDIS_HOST if hasattr(settings, 'REDIS_HOST') else 'redis',
        port=settings.REDIS_PORT if hasattr(settings, 'REDIS_PORT') else 6379,
        db=settings.REDIS_PROGRESS_DB if hasattr(settings, 'REDIS_PROGRESS_DB') else 2,
        decode_responses=True
    )


def publish_progress(task_id: str, data: Dict[str, Any]):
    """
    Publicar progreso de la tarea a Redis.

    El frontend puede suscribirse al canal 'tenant_progress:{task_id}'
    o hacer polling al endpoint /api/tenant/tenants/creation-status/{task_id}/

    Args:
        task_id: ID de la tarea Celery
        data: Diccionario con información de progreso
    """
    try:
        client = get_redis_client()
        channel = f"tenant_progress:{task_id}"

        # Agregar timestamp
        data['timestamp'] = datetime.now().isoformat()
        data['task_id'] = task_id

        # Publicar al canal (para WebSocket)
        client.publish(channel, json.dumps(data))

        # También guardar en key para polling
        client.setex(
            f"tenant_status:{task_id}",
            3600,  # Expira en 1 hora
            json.dumps(data)
        )

        logger.debug(f"Progress published: {channel} -> {data}")
    except Exception as e:
        logger.warning(f"Failed to publish progress: {e}")


def get_migration_count() -> int:
    """
    Obtener el numero de migraciones a ejecutar.
    Calcula dinamicamente desde el MigrationLoader de Django.
    """
    try:
        from django.db.migrations.loader import MigrationLoader
        loader = MigrationLoader(connection)
        return len(loader.disk_migrations)
    except Exception:
        return 200  # Fallback conservador


@shared_task(
    bind=True,
    name='apps.tenant.tasks.create_tenant_schema',
    max_retries=0,  # Sin auto-retry. El retry se hace manual desde Admin Global.
    acks_late=True,
    reject_on_worker_lost=True,
    track_started=True,
    time_limit=45 * 60,  # 45 minutos limite hard
    soft_time_limit=40 * 60,  # 40 minutos limite soft
)
def create_tenant_schema_task(
    self,
    tenant_id: int,
    created_by_id: Optional[int] = None
) -> Dict[str, Any]:
    """
    Crear el schema de PostgreSQL para un tenant y ejecutar migraciones.

    Esta tarea se ejecuta de forma asíncrona después de crear el registro
    del Tenant en la base de datos. Permite que el usuario no tenga que
    esperar mientras se ejecutan las migraciones (~15-25 minutos).

    Args:
        tenant_id: ID del Tenant creado
        created_by_id: ID del TenantUser que creó el tenant (opcional)

    Returns:
        Dict con el resultado de la operación

    Raises:
        Exception: Si falla la creación del schema o migraciones
    """
    from apps.tenant.models import Tenant

    task_id = self.request.id
    start_time = datetime.now()

    logger.info(f"[Task {task_id}] Starting schema creation for tenant_id={tenant_id}")

    # Publicar inicio
    publish_progress(task_id, {
        'status': 'started',
        'phase': 'initializing',
        'message': 'Iniciando creación del tenant...',
        'progress': 0,
        'tenant_id': tenant_id,
    })

    try:
        # Obtener el tenant
        tenant = Tenant.objects.get(id=tenant_id)
        schema_name = tenant.schema_name

        logger.info(f"[Task {task_id}] Creating schema: {schema_name}")

        # Fase 1: Crear schema (5%)
        publish_progress(task_id, {
            'status': 'running',
            'phase': 'creating_schema',
            'message': f'Creando schema {schema_name}...',
            'progress': 5,
            'tenant_id': tenant_id,
            'schema_name': schema_name,
        })

        # Crear el schema si no existe
        with connection.cursor() as cursor:
            cursor.execute(
                f'CREATE SCHEMA IF NOT EXISTS "{schema_name}"'
            )

        logger.info(f"[Task {task_id}] Schema {schema_name} created successfully")

        # Fase 2: Ejecutar migraciones (5% - 95%)
        publish_progress(task_id, {
            'status': 'running',
            'phase': 'running_migrations',
            'message': 'Ejecutando migraciones de base de datos...',
            'progress': 10,
            'tenant_id': tenant_id,
            'schema_name': schema_name,
        })

        # Ejecutar migrate para el schema del tenant
        # django-tenants se encarga de esto automaticamente al guardar con auto_create_schema
        # Pero lo hacemos manual para tener control del progreso
        #
        # Publicar progreso estimado durante migraciones ya que migrate_schemas
        # no soporta callbacks. Usamos un thread que incrementa el progreso
        # periódicamente basado en tiempo estimado (~25 min).
        migration_done = threading.Event()

        def _publish_migration_progress():
            """Thread que publica progreso estimado durante migraciones."""
            import time
            estimated_duration = 25 * 60  # 25 minutos estimados
            interval = 30  # Publicar cada 30 segundos
            elapsed = 0
            while not migration_done.is_set():
                migration_done.wait(timeout=interval)
                if migration_done.is_set():
                    break
                elapsed += interval
                # Progreso de 10% a 85% basado en tiempo estimado
                ratio = min(elapsed / estimated_duration, 1.0)
                estimated_progress = 10 + int(ratio * 75)
                estimated_progress = min(estimated_progress, 85)
                try:
                    publish_progress(task_id, {
                        'status': 'running',
                        'phase': 'running_migrations',
                        'message': f'Aplicando estructura de datos ({int(elapsed/60)} min)...',
                        'progress': estimated_progress,
                        'tenant_id': tenant_id,
                        'schema_name': schema_name,
                    })
                except Exception:
                    pass  # No interrumpir migraciones por error de progreso

        progress_thread = threading.Thread(target=_publish_migration_progress, daemon=True)
        progress_thread.start()

        try:
            call_command(
                'migrate_schemas',
                schema_name=schema_name,
                interactive=False,
                verbosity=0,
            )
        finally:
            migration_done.set()
            progress_thread.join(timeout=5)

        # Fase 3: Cargar datos iniciales (seed) - 90% - 95%
        # IMPORTANTE: Cerrar conexiones viejas después de las migraciones.
        # Las migraciones pueden tardar 15-25 min, durante los cuales PostgreSQL
        # puede cerrar la conexión por inactividad.
        close_old_connections()

        publish_progress(task_id, {
            'status': 'running',
            'phase': 'seeding_data',
            'message': 'Cargando datos iniciales del sistema...',
            'progress': 90,
            'tenant_id': tenant_id,
            'schema_name': schema_name,
        })

        # Ejecutar seeds dentro del contexto del tenant
        # CRITICO: Si los seeds esenciales fallan, el tenant queda inutilizable.
        # En ese caso marcamos como 'failed' para que el admin pueda reintentar.
        from django_tenants.utils import schema_context
        seed_errors = []
        with schema_context(schema_name):
            # 1. Estructura de modulos (CRITICO - sin esto no hay sidebar)
            try:
                call_command('seed_estructura_final', verbosity=0)
                logger.info(f"[Task {task_id}] seed_estructura_final completed")
            except Exception as e:
                error_msg = f"seed_estructura_final failed: {e}"
                logger.error(f"[Task {task_id}] {error_msg}")
                seed_errors.append(error_msg)

            # 2. Permisos RBAC (CRITICO - sin esto no hay control de acceso)
            try:
                call_command('seed_permisos_rbac', verbosity=0)
                logger.info(f"[Task {task_id}] seed_permisos_rbac completed")
            except Exception as e:
                error_msg = f"seed_permisos_rbac failed: {e}"
                logger.error(f"[Task {task_id}] {error_msg}")
                seed_errors.append(error_msg)

            # 3. Cargo Administrador con permisos completos
            # No critico: el cargo se puede crear despues manualmente
            try:
                call_command('seed_admin_cargo', verbosity=0)
                logger.info(f"[Task {task_id}] seed_admin_cargo completed")
            except Exception as e:
                logger.warning(f"[Task {task_id}] seed_admin_cargo failed (non-critical): {e}")

        # Si hubo errores en seeds criticos, marcar como failed
        if seed_errors:
            error_detail = '; '.join(seed_errors)
            raise Exception(f"Seeds criticos fallaron: {error_detail}")

        # Fase 4: Finalización (95% - 100%)
        # Cerrar conexiones viejas antes de actualizar estado
        close_old_connections()

        publish_progress(task_id, {
            'status': 'running',
            'phase': 'finalizing',
            'message': 'Finalizando configuración del tenant...',
            'progress': 96,
            'tenant_id': tenant_id,
            'schema_name': schema_name,
        })

        # Actualizar estado del tenant a 'ready'
        tenant.refresh_from_db()
        tenant.schema_status = 'ready'
        tenant.schema_error = ''
        tenant.save(update_fields=['schema_status', 'schema_error'])

        # Calcular duración
        duration = (datetime.now() - start_time).total_seconds()

        logger.info(
            f"[Task {task_id}] Schema {schema_name} created successfully "
            f"in {duration:.1f} seconds"
        )

        # Publicar éxito
        result = {
            'status': 'completed',
            'phase': 'done',
            'message': f'Tenant {tenant.name} creado exitosamente',
            'progress': 100,
            'tenant_id': tenant_id,
            'schema_name': schema_name,
            'duration_seconds': duration,
            'success': True,
        }

        publish_progress(task_id, result)

        return result

    except Tenant.DoesNotExist:
        error_msg = f"Tenant con ID {tenant_id} no encontrado"
        logger.error(f"[Task {task_id}] {error_msg}")

        publish_progress(task_id, {
            'status': 'failed',
            'phase': 'error',
            'message': error_msg,
            'progress': 0,
            'tenant_id': tenant_id,
            'error': error_msg,
            'success': False,
        })

        raise

    except Exception as e:
        error_msg = str(e)
        logger.exception(f"[Task {task_id}] Error creating schema: {error_msg}")

        # Actualizar estado del tenant a 'failed'
        # IMPORTANTE: Cerrar conexiones viejas primero, ya que el error
        # podría ser InterfaceError (connection already closed) y el save
        # necesita una conexión fresca.
        try:
            close_old_connections()
            tenant = Tenant.objects.get(id=tenant_id)
            tenant.schema_status = 'failed'
            tenant.schema_error = error_msg[:1000]
            tenant.save(update_fields=['schema_status', 'schema_error'])
        except Exception as save_error:
            # Fallback: intentar con conexión completamente nueva
            logger.error(
                f"[Task {task_id}] Failed to save error state: {save_error}. "
                f"Attempting fresh connection..."
            )
            try:
                close_old_connections()
                from django.db import connections
                connections['default'].ensure_connection()
                tenant = Tenant.objects.get(id=tenant_id)
                tenant.schema_status = 'failed'
                tenant.schema_error = error_msg[:1000]
                tenant.save(update_fields=['schema_status', 'schema_error'])
            except Exception as final_error:
                logger.critical(
                    f"[Task {task_id}] CRITICAL: Cannot save failure state for "
                    f"tenant_id={tenant_id}. Error: {final_error}"
                )

        publish_progress(task_id, {
            'status': 'failed',
            'phase': 'error',
            'message': f'Error al crear tenant: {error_msg}',
            'progress': 0,
            'tenant_id': tenant_id,
            'error': error_msg,
            'success': False,
        })

        raise


@shared_task(
    bind=True,
    name='apps.tenant.tasks.retry_tenant_schema',
    max_retries=1,
    time_limit=45 * 60,
    soft_time_limit=40 * 60,
)
def retry_tenant_schema_task(self, tenant_id: int) -> Dict[str, Any]:
    """
    Reintentar la creación del schema de un tenant que falló.

    Útil cuando hubo un error temporal (ej: conexión a BD) y se quiere
    reintentar sin crear un nuevo tenant.

    Args:
        tenant_id: ID del Tenant a reintentar

    Returns:
        Dict con el resultado de la operación
    """
    return create_tenant_schema_task.apply(args=[tenant_id]).get()


@shared_task(name='apps.tenant.tasks.cleanup_failed_tenant')
def cleanup_failed_tenant_task(tenant_id: int) -> Dict[str, Any]:
    """
    Limpiar un tenant cuya creación falló.

    Elimina el registro del tenant y su schema (si existe).
    Solo debe usarse para tenants que nunca completaron su creación.

    Args:
        tenant_id: ID del Tenant a limpiar

    Returns:
        Dict con el resultado de la operación
    """
    from apps.tenant.models import Tenant, Domain

    try:
        tenant = Tenant.objects.get(id=tenant_id)
        schema_name = tenant.schema_name

        logger.info(f"Cleaning up failed tenant: {tenant.name} ({schema_name})")

        # Eliminar dominios asociados
        Domain.objects.filter(tenant=tenant).delete()

        # Eliminar schema si existe
        with connection.cursor() as cursor:
            cursor.execute(
                f'DROP SCHEMA IF EXISTS "{schema_name}" CASCADE'
            )

        # Eliminar registro del tenant
        tenant.delete()

        return {
            'success': True,
            'message': f'Tenant {schema_name} eliminado correctamente',
        }

    except Tenant.DoesNotExist:
        return {
            'success': False,
            'message': f'Tenant con ID {tenant_id} no encontrado',
        }
    except Exception as e:
        logger.exception(f"Error cleaning up tenant {tenant_id}: {e}")
        return {
            'success': False,
            'message': str(e),
        }


def get_task_status(task_id: str) -> Optional[Dict[str, Any]]:
    """
    Obtener el estado actual de una tarea de creación de tenant.

    Primero intenta obtener de Redis (más reciente), luego de Celery.

    Args:
        task_id: ID de la tarea Celery

    Returns:
        Dict con el estado o None si no se encuentra
    """
    try:
        # Intentar obtener de Redis primero (más actualizado)
        client = get_redis_client()
        status_data = client.get(f"tenant_status:{task_id}")

        if status_data:
            return json.loads(status_data)

        # Fallback a Celery result backend
        from celery.result import AsyncResult
        result = AsyncResult(task_id)

        if result.state == 'PENDING':
            return {
                'status': 'pending',
                'phase': 'queued',
                'message': 'Tarea en cola...',
                'progress': 0,
            }
        elif result.state == 'STARTED':
            return {
                'status': 'running',
                'phase': 'started',
                'message': 'Procesando...',
                'progress': 5,
            }
        elif result.state == 'SUCCESS':
            return result.result
        elif result.state == 'FAILURE':
            return {
                'status': 'failed',
                'phase': 'error',
                'message': str(result.result),
                'progress': 0,
                'error': str(result.result),
            }
        else:
            return {
                'status': result.state.lower(),
                'phase': 'unknown',
                'message': f'Estado: {result.state}',
                'progress': 0,
            }

    except Exception as e:
        logger.warning(f"Error getting task status: {e}")
        return None


@shared_task(name='apps.tenant.tasks.cleanup_stale_creating_tenants')
def cleanup_stale_creating_tenants():
    """
    Tarea periódica que detecta tenants atascados en 'creating' por más de 1 hora.

    Si la tarea Celery ya terminó (exitosa o fallida) pero el tenant sigue en
    'creating', actualiza su estado basándose en la realidad del schema.

    Configurar en Celery Beat para ejecutar cada 15 minutos.
    """
    from apps.tenant.models import Tenant
    from django.utils import timezone
    from datetime import timedelta

    stale_threshold = timezone.now() - timedelta(hours=1)

    stale_tenants = Tenant.objects.filter(
        schema_status='creating',
        updated_at__lt=stale_threshold,
    )

    for tenant in stale_tenants:
        logger.warning(
            f"Stale tenant detected: {tenant.name} (ID={tenant.id}) "
            f"has been in 'creating' since {tenant.updated_at}"
        )

        # Verificar si el schema existe y tiene tablas
        try:
            with connection.cursor() as cursor:
                # Contar tablas del tenant sospechoso
                cursor.execute("""
                    SELECT COUNT(*)
                    FROM information_schema.tables
                    WHERE table_schema = %s
                """, [tenant.schema_name])
                table_count = cursor.fetchone()[0]

                # Obtener referencia de un tenant 'ready' para comparar
                reference_count = 600  # fallback
                ready_tenant = Tenant.objects.filter(
                    schema_status='ready'
                ).exclude(schema_name='public').first()
                if ready_tenant:
                    cursor.execute("""
                        SELECT COUNT(*)
                        FROM information_schema.tables
                        WHERE table_schema = %s
                    """, [ready_tenant.schema_name])
                    reference_count = cursor.fetchone()[0]

            # Si tiene >= 90% de las tablas del tenant de referencia, esta completo
            threshold = int(reference_count * 0.9)
            if table_count >= threshold:
                # Schema parece completo
                tenant.schema_status = 'ready'
                tenant.schema_error = ''
                logger.info(
                    f"Stale tenant {tenant.name} auto-repaired to 'ready' "
                    f"({table_count}/{reference_count} tables found)"
                )
            else:
                tenant.schema_status = 'failed'
                tenant.schema_error = (
                    f'Tarea de creacion no completo. '
                    f'Schema tiene {table_count}/{reference_count} tablas. '
                    f'Detectado por cleanup automatico.'
                )
                logger.warning(
                    f"Stale tenant {tenant.name} marked as 'failed' "
                    f"({table_count}/{reference_count} tables)"
                )

            tenant.save(update_fields=['schema_status', 'schema_error'])

        except Exception as e:
            logger.error(f"Error checking stale tenant {tenant.name}: {e}")
