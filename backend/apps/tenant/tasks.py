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
from typing import Optional, Dict, Any, List

from celery import shared_task, current_task
from django.apps import apps as django_apps
from django.db import connection, close_old_connections
from django.core.management import call_command
from django.conf import settings
from django.utils import timezone
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
    created_by_id: Optional[int] = None,
    # Campos de configuración de admin (todos opcionales — backward compatible)
    admin_mode: Optional[str] = None,
    admin_email: Optional[str] = None,
    admin_first_name: str = '',
    admin_last_name: str = '',
    admin_cargo_name: str = 'Administrador General',
) -> Dict[str, Any]:
    """
    Crear el schema de PostgreSQL para un tenant y ejecutar migraciones.

    Esta tarea se ejecuta de forma asíncrona después de crear el registro
    del Tenant en la base de datos. Permite que el usuario no tenga que
    esperar mientras se ejecutan las migraciones (~15-25 minutos).

    Si admin_mode y admin_email son provistos, al finalizar exitosamente
    se encola setup_tenant_admin_task para crear/vincular el admin en el
    nuevo schema — sin bloquear ni reintentar esta tarea.

    Args:
        tenant_id: ID del Tenant creado
        created_by_id: ID del TenantUser que creó el tenant (opcional)
        admin_mode: 'new' | 'existing' — si se omite, no se configura admin
        admin_email: Email del admin (requerido cuando admin_mode != None)
        admin_first_name: Nombre del admin (para admin_mode='new')
        admin_last_name: Apellido del admin (para admin_mode='new')
        admin_cargo_name: Nombre del cargo a asignar (default 'Administrador General')

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
        from psycopg2 import sql
        with connection.cursor() as cursor:
            cursor.execute(
                sql.SQL('CREATE SCHEMA IF NOT EXISTS {}').format(
                    sql.Identifier(schema_name)
                )
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

            # 3. Configuracion de identidad corporativa
            # No critico: estados de politica, tipos, roles de firmante
            # Sin esto, el modulo de identidad no tiene tablas de config
            try:
                call_command('seed_config_identidad', verbosity=0)
                logger.info(f"[Task {task_id}] seed_config_identidad completed")
            except Exception as e:
                logger.warning(f"[Task {task_id}] seed_config_identidad failed (non-critical): {e}")

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

        # Encadenar configuración de admin si fue solicitada
        if admin_mode and admin_email:
            try:
                setup_tenant_admin_task.delay(
                    tenant_id=tenant_id,
                    admin_email=admin_email,
                    admin_first_name=admin_first_name,
                    admin_last_name=admin_last_name,
                    admin_cargo_name=admin_cargo_name,
                    admin_mode=admin_mode,
                    created_by_id=created_by_id,
                )
                logger.info(
                    f"[Task {task_id}] setup_tenant_admin_task encolada "
                    f"para admin_email={admin_email} (admin_mode={admin_mode})"
                )
            except Exception as e:
                # No fallar el schema creation por error en el encadenamiento
                logger.error(
                    f"[Task {task_id}] Error al encolar setup_tenant_admin_task: {e}"
                )

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
        from psycopg2 import sql
        with connection.cursor() as cursor:
            cursor.execute(
                sql.SQL('DROP SCHEMA IF EXISTS {} CASCADE').format(
                    sql.Identifier(schema_name)
                )
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


@shared_task(
    bind=True,
    name='apps.tenant.tasks.setup_tenant_admin',
    max_retries=2,
    default_retry_delay=30,
    acks_late=True,
    time_limit=10 * 60,
    soft_time_limit=8 * 60,
)
def setup_tenant_admin_task(
    self,
    tenant_id: int,
    admin_email: str,
    admin_first_name: str = '',
    admin_last_name: str = '',
    admin_cargo_name: str = 'Administrador General',
    admin_mode: str = 'new',
    created_by_id: Optional[int] = None,
) -> Dict[str, Any]:
    """
    Configurar el usuario administrador de un tenant recién creado.

    Se ejecuta automáticamente encadenada desde create_tenant_schema_task
    cuando admin_mode y admin_email están presentes.

    Flujo admin_mode='new':
      1. Crea TenantUser (schema public)
      2. Crea TenantUserAccess vinculando al tenant
      3. Dentro del schema del tenant crea core.User (is_superuser=True)
         con Cargo obtenido/creado por admin_cargo_name
      4. Genera setup token y envía email de bienvenida

    Flujo admin_mode='existing':
      1. Obtiene TenantUser activo por email
      2. Crea (o reactiva) TenantUserAccess para este tenant
      3. Dentro del schema del tenant crea core.User (is_superuser=True)
         con Cargo obtenido/creado por admin_cargo_name
      4. Envía email de nuevo acceso concedido

    Args:
        tenant_id: ID del Tenant donde crear/vincular el admin
        admin_email: Email del admin
        admin_first_name: Nombre (requerido para admin_mode='new')
        admin_last_name: Apellido (opcional)
        admin_cargo_name: Nombre del cargo a asignar
        admin_mode: 'new' | 'existing'
        created_by_id: ID del TenantUser que lanzó la creación (opcional)

    Returns:
        Dict con resultado de la operación
    """
    from apps.tenant.models import Tenant, TenantUser, TenantUserAccess
    from apps.core.utils.email_branding import get_email_branding_context

    task_id = self.request.id
    logger.info(
        f"[Task {task_id}] setup_tenant_admin iniciando "
        f"tenant_id={tenant_id} admin_email={admin_email} admin_mode={admin_mode}"
    )

    try:
        # ── 1. Obtener tenant y verificar que esté listo ──────────────────
        tenant = Tenant.objects.get(id=tenant_id)

        if tenant.schema_status != 'ready':
            error_msg = (
                f"Tenant {tenant_id} tiene schema_status='{tenant.schema_status}', "
                "se esperaba 'ready'. No se puede configurar el admin."
            )
            logger.error(f"[Task {task_id}] {error_msg}")
            raise ValueError(error_msg)

        schema_name = tenant.schema_name

        # ── 2. Resolver / crear TenantUser en schema public ──────────────
        tenant_user = None

        if admin_mode == 'new':
            # Crear TenantUser nuevo con contraseña temporal
            import uuid as _uuid
            temp_password = _uuid.uuid4().hex
            tenant_user = TenantUser(
                email=admin_email,
                first_name=admin_first_name,
                last_name=admin_last_name,
                is_active=True,
            )
            tenant_user.set_password(temp_password)
            tenant_user.save()
            logger.info(f"[Task {task_id}] TenantUser creado: {admin_email}")

        elif admin_mode == 'existing':
            tenant_user = TenantUser.objects.get(email=admin_email, is_active=True)
            logger.info(f"[Task {task_id}] TenantUser existente encontrado: {admin_email}")

        # ── 3. Crear / reactivar TenantUserAccess ────────────────────────
        access, created_access = TenantUserAccess.objects.get_or_create(
            tenant_user=tenant_user,
            tenant=tenant,
            defaults={'is_active': True},
        )
        if not created_access and not access.is_active:
            access.is_active = True
            access.save(update_fields=['is_active'])
            logger.info(
                f"[Task {task_id}] TenantUserAccess reactivado para {admin_email}"
            )

        # ── 4. Crear core.User dentro del schema del tenant ───────────────
        raw_setup_token = None
        with schema_context(schema_name):
            User = django_apps.get_model('core', 'User')
            Cargo = django_apps.get_model('core', 'Cargo')

            # Obtener o crear Cargo de administrador
            cargo_code = 'ADMIN_GENERAL'
            cargo, _ = Cargo.objects.get_or_create(
                code=cargo_code,
                defaults={
                    'name': admin_cargo_name,
                    'description': 'Cargo de administración general del sistema',
                },
            )

            # Verificar si ya existe un User con ese email en el schema
            if User.objects.filter(email=admin_email).exists():
                logger.warning(
                    f"[Task {task_id}] User con email {admin_email} ya existe "
                    f"en schema {schema_name}. Omitiendo creación."
                )
                core_user = User.objects.get(email=admin_email)
            else:
                # Generar username único a partir del email
                base_username = admin_email.split('@')[0].lower()
                username = base_username
                counter = 1
                while User.objects.filter(username=username).exists():
                    username = f'{base_username}{counter}'
                    counter += 1

                import uuid as _uuid2
                temp_pwd = _uuid2.uuid4().hex
                core_user = User(
                    username=username,
                    email=admin_email,
                    first_name=admin_first_name,
                    last_name=admin_last_name,
                    cargo=cargo,
                    is_active=True,
                    is_staff=True,
                    is_superuser=True,
                )
                core_user.set_password(temp_pwd)
                core_user.save()
                logger.info(
                    f"[Task {task_id}] core.User creado en schema {schema_name}: "
                    f"{admin_email}"
                )

            # ── 5. Enviar email según modo ────────────────────────────────
            from django.conf import settings as django_settings
            frontend_url = getattr(
                django_settings, 'FRONTEND_URL', 'https://app.stratekaz.com'
            )

            if admin_mode == 'new':
                # Generar token de setup de contraseña
                raw_setup_token = core_user.set_password_setup_token()
                core_user.save(
                    update_fields=['password_setup_token', 'password_setup_expires']
                )

                setup_url = (
                    f"{frontend_url}/setup-password"
                    f"?token={core_user.password_setup_token}"
                    f"&email={admin_email}"
                    f"&tenant_id={tenant_id}"
                )

                from apps.core.tasks import send_setup_password_email_task
                send_setup_password_email_task.delay(
                    user_email=admin_email,
                    user_name=(
                        core_user.get_full_name()
                        or admin_first_name
                        or admin_email
                    ),
                    tenant_name=tenant.name,
                    cargo_name=admin_cargo_name,
                    setup_url=setup_url,
                    expiry_hours=User.PASSWORD_SETUP_EXPIRY_HOURS,
                    primary_color=tenant.primary_color or '#ec268f',
                    secondary_color=tenant.secondary_color or '#000000',
                )
                logger.info(
                    f"[Task {task_id}] Email setup_password encolado para {admin_email}"
                )

            elif admin_mode == 'existing':
                login_url = f"{frontend_url}/login?tenant_id={tenant_id}"
                from apps.core.tasks import send_new_access_email_task
                send_new_access_email_task.delay(
                    user_email=admin_email,
                    user_name=(
                        core_user.get_full_name()
                        or tenant_user.get_full_name()
                        or admin_email
                    ),
                    tenant_name=tenant.name,
                    cargo_name=admin_cargo_name,
                    login_url=login_url,
                    primary_color=tenant.primary_color or '#ec268f',
                    secondary_color=tenant.secondary_color or '#000000',
                )
                logger.info(
                    f"[Task {task_id}] Email new_access_granted encolado para {admin_email}"
                )

        logger.info(
            f"[Task {task_id}] setup_tenant_admin completado exitosamente "
            f"para tenant_id={tenant_id}, admin_email={admin_email}"
        )

        return {
            'success': True,
            'tenant_id': tenant_id,
            'admin_email': admin_email,
            'admin_mode': admin_mode,
            'message': (
                f'Admin configurado correctamente en {tenant.name}'
            ),
        }

    except Tenant.DoesNotExist:
        error_msg = f"Tenant con ID {tenant_id} no encontrado"
        logger.error(f"[Task {task_id}] {error_msg}")
        return {'success': False, 'error': error_msg}

    except TenantUser.DoesNotExist:
        error_msg = (
            f"TenantUser activo con email '{admin_email}' no encontrado "
            f"(admin_mode='{admin_mode}')"
        )
        logger.error(f"[Task {task_id}] {error_msg}")
        return {'success': False, 'error': error_msg}

    except Exception as exc:
        logger.exception(
            f"[Task {task_id}] Error en setup_tenant_admin "
            f"tenant_id={tenant_id} admin_email={admin_email}: {exc}"
        )
        # Reintentar en errores transitorios (conexión, etc.)
        raise self.retry(exc=exc)


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


@shared_task(name='apps.tenant.tasks.check_tenant_expirations')
def check_tenant_expirations() -> Dict[str, Any]:
    """
    Tarea periódica que desactiva tenants con suscripciones o trials vencidos.

    Busca tenants activos donde:
    - is_trial=True AND trial_ends_at ya pasó → desactivar
    - is_trial=False AND subscription_ends_at ya pasó → desactivar

    Para cada tenant vencido, establece is_active=False.
    Todas las escrituras se realizan dentro de schema_context('public')
    ya que el modelo Tenant vive en el schema público.

    Configurar en Celery Beat para ejecutar diariamente a las 12:30 AM.

    Returns:
        Dict con conteos de trials y suscripciones desactivadas.
    """
    from apps.tenant.models import Tenant

    now = timezone.now()
    expired_trials: List[str] = []
    expired_subscriptions: List[str] = []

    logger.info("Starting tenant expiration check...")

    with schema_context('public'):
        # 1. Trials vencidos: activos, en trial, con fecha de fin pasada
        expired_trial_tenants = Tenant.objects.filter(
            is_active=True,
            is_trial=True,
            trial_ends_at__isnull=False,
            trial_ends_at__lt=now,
        )

        for tenant in expired_trial_tenants:
            tenant.is_active = False
            tenant.save(update_fields=['is_active'])
            expired_trials.append(tenant.name)
            logger.info(
                f"Trial expired: deactivated tenant '{tenant.name}' "
                f"(trial_ends_at={tenant.trial_ends_at})"
            )

        # 2. Suscripciones vencidas: activos, no trial, con fecha de fin pasada
        expired_sub_tenants = Tenant.objects.filter(
            is_active=True,
            is_trial=False,
            subscription_ends_at__isnull=False,
            subscription_ends_at__lt=now,
        )

        for tenant in expired_sub_tenants:
            tenant.is_active = False
            tenant.save(update_fields=['is_active'])
            expired_subscriptions.append(tenant.name)
            logger.info(
                f"Subscription expired: deactivated tenant '{tenant.name}' "
                f"(subscription_ends_at={tenant.subscription_ends_at})"
            )

    total = len(expired_trials) + len(expired_subscriptions)
    summary = {
        'expired_trials': len(expired_trials),
        'expired_subscriptions': len(expired_subscriptions),
        'total_deactivated': total,
        'trial_names': expired_trials,
        'subscription_names': expired_subscriptions,
    }

    logger.info(
        f"Tenant expiration check complete: "
        f"{len(expired_trials)} trials expired, "
        f"{len(expired_subscriptions)} subscriptions expired, "
        f"{total} total deactivated"
    )

    return summary
