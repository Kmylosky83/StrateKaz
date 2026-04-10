"""
Tareas asíncronas para Multi-Tenant System

ARQUITECTURA POST-REFACTOR:
1. El ViewSet/Serializer crea el registro de Tenant (sin schema) → schema_status='pending'
2. Se encola create_tenant_schema_task
3. La task delega a TenantLifecycleService.provision_schema_for_pending_tenant()
4. El servicio crea schema + migraciones + seeds + marca ready
5. El progreso se publica a Redis via progress_callback (el servicio no sabe de Redis)
6. El frontend recibe actualizaciones via polling a /creation-status/

SEGURIDAD:
- Las tareas usan task_acks_late para garantizar que no se pierdan
- Si falla, el servicio marca schema_status='failed' + cleanup del schema
- Se puede reintentar manualmente desde Admin Global
"""
import logging
import json
from datetime import datetime
from typing import Optional, Dict, Any

from celery import shared_task
from django.apps import apps as django_apps
from django.db import close_old_connections
from django.conf import settings
from django_tenants.utils import schema_context, get_tenant_model
import redis

logger = logging.getLogger(__name__)


# ══════════════════════════════════════════════════════════════════
# Redis progress helpers (concern de la task, no del servicio)
# ══════════════════════════════════════════════════════════════════

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
    """
    try:
        client = get_redis_client()
        channel = f"tenant_progress:{task_id}"

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


def get_task_status(task_id: str) -> Optional[Dict[str, Any]]:
    """
    Obtener el estado actual de una tarea de creación de tenant.
    Primero intenta obtener de Redis (más reciente), luego de Celery.
    """
    try:
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


# ══════════════════════════════════════════════════════════════════
# TASK: Crear schema de tenant (flujo principal de onboarding)
# ══════════════════════════════════════════════════════════════════

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

    Delega a TenantLifecycleService.provision_schema_for_pending_tenant()
    para la operación de lifecycle (DDL + migrate + seeds + ready).
    La task se encarga de: progreso Redis, encadenar admin setup, y
    retornar el dict que el frontend espera via polling.

    Args:
        tenant_id: ID del Tenant creado (row ya existe con status='pending')
        created_by_id: ID del TenantUser que creó el tenant (opcional)
        admin_mode: 'new' | 'existing' — si se omite, no se configura admin
        admin_email: Email del admin (requerido cuando admin_mode != None)
        admin_first_name: Nombre del admin (para admin_mode='new')
        admin_last_name: Apellido del admin (para admin_mode='new')
        admin_cargo_name: Nombre del cargo a asignar

    Returns:
        Dict con el resultado de la operación
    """
    from apps.tenant.models import Tenant
    from apps.tenant.services import (
        TenantLifecycleService,
        TenantNotFoundError,
        TenantLifecycleError,
    )

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
        # Obtener schema_name para los mensajes de progreso
        tenant = Tenant.objects.get(id=tenant_id)
        schema_name = tenant.schema_name

        # Crear closure de progreso que publica a Redis
        def _progress_callback(pct: int, phase: str, msg: str) -> None:
            publish_progress(task_id, {
                'status': 'running',
                'phase': phase,
                'message': msg,
                'progress': pct,
                'tenant_id': tenant_id,
                'schema_name': schema_name,
            })

        # Delegar al servicio
        tenant, warnings = TenantLifecycleService.provision_schema_for_pending_tenant(
            tenant_id=tenant_id,
            progress_callback=_progress_callback,
        )

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

        if warnings:
            result['warnings'] = warnings

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

    except (TenantNotFoundError, TenantLifecycleError) as e:
        error_msg = str(e)
        logger.error(f"[Task {task_id}] Service error: {error_msg}")

        # El servicio ya marcó schema_status='failed' internamente.
        # Solo publicamos a Redis.
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

    except Exception as e:
        error_msg = str(e)
        logger.exception(f"[Task {task_id}] Error creating schema: {error_msg}")

        # El servicio ya intentó marcar 'failed' y hacer cleanup.
        # Publicar a Redis como fallback.
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


# ══════════════════════════════════════════════════════════════════
# TASK: Retry manual
# ══════════════════════════════════════════════════════════════════

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
    """
    return create_tenant_schema_task.apply(args=[tenant_id]).get()


# ══════════════════════════════════════════════════════════════════
# TASK: Cleanup de tenant fallido
# ══════════════════════════════════════════════════════════════════

@shared_task(name='apps.tenant.tasks.cleanup_failed_tenant')
def cleanup_failed_tenant_task(tenant_id: int) -> Dict[str, Any]:
    """
    Limpiar un tenant cuya creación falló.

    Delega a TenantLifecycleService.delete_tenant_with_schema() para
    eliminar row + domain + schema en una operación atómica con
    post-validación de invariante.
    """
    from apps.tenant.models import Tenant
    from apps.tenant.services import (
        TenantLifecycleService,
        TenantNotFoundError,
        SchemaDropFailedError,
        TenantInvariantViolationError,
    )

    try:
        tenant = Tenant.objects.get(id=tenant_id)
        schema_name = tenant.schema_name

        logger.info(f"Cleaning up failed tenant: {tenant.name} ({schema_name})")

        TenantLifecycleService.delete_tenant_with_schema(
            schema_name=schema_name,
            confirmation_token=(
                TenantLifecycleService.CONFIRMATION_TOKEN_TEMPLATE
                .format(schema_name=schema_name)
            ),
            deleted_by_user_id=None,
        )

        return {
            'success': True,
            'message': f'Tenant {schema_name} eliminado correctamente',
        }

    except Tenant.DoesNotExist:
        return {
            'success': False,
            'message': f'Tenant con ID {tenant_id} no encontrado',
        }
    except (TenantNotFoundError, SchemaDropFailedError, TenantInvariantViolationError) as e:
        logger.exception(f"Error cleaning up tenant {tenant_id}: {e}")
        return {
            'success': False,
            'message': str(e),
        }
    except Exception as e:
        logger.exception(f"Error cleaning up tenant {tenant_id}: {e}")
        return {
            'success': False,
            'message': str(e),
        }


# ══════════════════════════════════════════════════════════════════
# TASK: Setup de admin en tenant recién creado
# ══════════════════════════════════════════════════════════════════

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
            defaults={'is_active': True, 'is_admin': True},
        )
        if not created_access:
            updates = []
            if not access.is_active:
                access.is_active = True
                updates.append('is_active')
            if not access.is_admin:
                access.is_admin = True
                updates.append('is_admin')
            if updates:
                access.save(update_fields=updates)
                logger.info(
                    f"[Task {task_id}] TenantUserAccess actualizado ({', '.join(updates)}) para {admin_email}"
                )

        # ── 4. Crear core.User dentro del schema del tenant ───────────────
        raw_setup_token = None
        with schema_context(schema_name):
            User = django_apps.get_model('core', 'User')
            Cargo = django_apps.get_model('core', 'Cargo')

            cargo_code = 'ADMIN_GENERAL'
            cargo, _ = Cargo.objects.get_or_create(
                code=cargo_code,
                defaults={
                    'name': admin_cargo_name,
                    'description': 'Cargo de administración general del sistema',
                },
            )

            if User.objects.filter(email=admin_email).exists():
                logger.warning(
                    f"[Task {task_id}] User con email {admin_email} ya existe "
                    f"en schema {schema_name}. Omitiendo creación."
                )
                return {
                    'success': True,
                    'message': f'User {admin_email} ya existía en {schema_name}',
                    'admin_email': admin_email,
                    'action': 'skipped_existing',
                }

            import uuid as _uuid
            raw_setup_token = _uuid.uuid4().hex

            user_data = {
                'email': admin_email,
                'first_name': admin_first_name or 'Admin',
                'last_name': admin_last_name or '',
                'is_active': True,
                'is_staff': True,
                'is_superuser': True,
                'cargo': cargo,
                'setup_token': raw_setup_token,
            }

            user = User(**user_data)
            user.set_unusable_password()
            user.save()
            logger.info(f"[Task {task_id}] User creado en {schema_name}: {admin_email}")

        # ── 5. Enviar email de bienvenida ─────────────────────────────────
        try:
            from apps.core.tasks import send_setup_password_email_task
            send_setup_password_email_task.delay(
                user_id=user.id,
                tenant_id=tenant_id,
                setup_token=raw_setup_token,
            )
            logger.info(f"[Task {task_id}] Email de bienvenida encolado para {admin_email}")
        except Exception as email_err:
            logger.warning(
                f"[Task {task_id}] No se pudo encolar email de bienvenida: {email_err}"
            )

        return {
            'success': True,
            'message': f'Admin {admin_email} configurado en {schema_name}',
            'admin_email': admin_email,
            'action': admin_mode,
            'tenant_id': tenant_id,
        }

    except Tenant.DoesNotExist:
        error_msg = f"Tenant {tenant_id} no encontrado"
        logger.error(f"[Task {task_id}] {error_msg}")
        raise

    except TenantUser.DoesNotExist:
        error_msg = f"TenantUser con email {admin_email} no encontrado (admin_mode='existing')"
        logger.error(f"[Task {task_id}] {error_msg}")
        raise

    except Exception as e:
        logger.exception(f"[Task {task_id}] Error en setup_tenant_admin: {e}")
        try:
            self.retry(exc=e)
        except self.MaxRetriesExceededError:
            logger.error(f"[Task {task_id}] Max retries exceeded for setup_tenant_admin")
        raise


# ══════════════════════════════════════════════════════════════════
# Tareas periódicas del módulo tenant
# ══════════════════════════════════════════════════════════════════

@shared_task(name='apps.tenant.tasks.check_tenant_expirations')
def check_tenant_expirations():
    """Verificar y desactivar tenants con trial/suscripción vencida."""
    from apps.tenant.models import Tenant
    from django.utils import timezone as tz

    now = tz.now()
    expired_trials = Tenant.objects.filter(
        is_active=True,
        is_trial=True,
        trial_ends_at__lt=now,
    )

    count = 0
    for tenant in expired_trials:
        tenant.is_active = False
        with schema_context('public'):
            tenant.save(update_fields=['is_active'])
        count += 1
        logger.info(f"Trial expired: {tenant.name} ({tenant.schema_name})")

    expired_subs = Tenant.objects.filter(
        is_active=True,
        is_trial=False,
        subscription_ends_at__lt=now,
    )

    for tenant in expired_subs:
        tenant.is_active = False
        with schema_context('public'):
            tenant.save(update_fields=['is_active'])
        count += 1
        logger.info(f"Subscription expired: {tenant.name} ({tenant.schema_name})")

    return {'expired_count': count, 'timestamp': now.isoformat()}


@shared_task(name='apps.tenant.tasks.cleanup_stale_creating_tenants')
def cleanup_stale_creating_tenants():
    """
    Detectar tenants que llevan más de 1 hora en status 'creating'.
    Los marca como 'failed' para que el admin los vea y decida.
    """
    from apps.tenant.models import Tenant
    from django.utils import timezone as tz

    threshold = tz.now() - tz.timedelta(hours=1)

    stale = Tenant.objects.filter(
        schema_status='creating',
        updated_at__lt=threshold,
    )

    count = 0
    for tenant in stale:
        tenant.schema_status = 'failed'
        tenant.schema_error = 'Timeout: más de 1 hora en status creating'
        with schema_context('public'):
            tenant.save(update_fields=['schema_status', 'schema_error'])
        count += 1
        logger.warning(f"Stale tenant marked as failed: {tenant.name} ({tenant.schema_name})")

    return {'stale_count': count}
