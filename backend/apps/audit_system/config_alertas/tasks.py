"""
Tareas Celery para Configuración de Alertas - Audit System

- ejecutar_verificacion_alertas: Evalúa ConfiguracionAlerta y genera AlertaGenerada
- escalar_alertas_no_atendidas: Escala alertas no atendidas según EscalamientoAlerta
- limpiar_alertas_antiguas: Limpieza de alertas atendidas antiguas

NOTA: Todas las tareas iteran sobre tenants activos usando schema_context
porque Celery Beat ejecuta en el schema 'public' donde las tablas tenant no existen.
"""
import logging
from celery import shared_task
from django.utils import timezone
from datetime import timedelta

logger = logging.getLogger(__name__)


def _get_active_tenants():
    """Retorna tenants activos (excluye public schema)."""
    from apps.tenant.models import Tenant
    return Tenant.objects.filter(is_active=True).exclude(schema_name='public')


@shared_task(
    bind=True,
    name='apps.audit_system.config_alertas.tasks.ejecutar_verificacion_alertas',
    max_retries=3,
    default_retry_delay=300,
)
def ejecutar_verificacion_alertas(self):
    """
    Evalúa todas las ConfiguracionAlerta activas y genera AlertaGenerada
    cuando se cumplen las condiciones configuradas.

    Se ejecuta cada hora.
    """
    from django_tenants.utils import schema_context

    ahora = timezone.now()
    total_alertas = 0
    total_errores = 0

    for tenant in _get_active_tenants():
        try:
            with schema_context(tenant.schema_name):
                alertas, errores = _ejecutar_verificacion_en_tenant(ahora)
                total_alertas += alertas
                total_errores += errores
        except Exception as e:
            total_errores += 1
            logger.error(
                f'[ConfigAlertas] Error en tenant {tenant.schema_name}: {e}'
            )

    if total_alertas > 0:
        logger.info(f'[ConfigAlertas] {total_alertas} alertas generadas en total')
    if total_errores > 0:
        logger.warning(f'[ConfigAlertas] {total_errores} errores durante verificación')

    return {
        'alertas_generadas': total_alertas,
        'errores': total_errores,
        'fecha': str(ahora),
    }


def _ejecutar_verificacion_en_tenant(ahora):
    """Ejecuta verificación de alertas dentro de un schema tenant."""
    from .models import ConfiguracionAlerta

    alertas_generadas = 0
    errores = 0

    configuraciones = ConfiguracionAlerta.objects.filter(
        is_active=True,
    ).select_related('tipo_alerta')

    for config in configuraciones:
        try:
            tipo = config.tipo_alerta
            condicion = config.condicion or {}

            if tipo.categoria == 'vencimiento':
                alertas_generadas += _verificar_vencimientos(config, tipo, condicion, ahora)
            elif tipo.categoria == 'umbral':
                alertas_generadas += _verificar_umbrales(config, tipo, condicion, ahora)
            elif tipo.categoria == 'inactividad':
                alertas_generadas += _verificar_inactividad(config, tipo, condicion, ahora)

        except Exception as e:
            errores += 1
            logger.error(
                f'[ConfigAlertas] Error evaluando configuracion {config.id} '
                f'({config.nombre}): {str(e)}'
            )

    return alertas_generadas, errores


def _verificar_vencimientos(config, tipo, condicion, ahora):
    """Verifica campos de fecha próximos a vencer."""
    from django.apps import apps
    from django.contrib.contenttypes.models import ContentType
    from .models import AlertaGenerada

    modelo_str = condicion.get('modelo')
    campo_fecha = condicion.get('campo_fecha')
    dias_anticipacion = config.dias_anticipacion or 15

    if not modelo_str or not campo_fecha:
        return 0

    try:
        app_label, model_name = modelo_str.split('.')
        Model = apps.get_model(app_label, model_name)
    except (ValueError, LookupError):
        logger.warning(f'[ConfigAlertas] Modelo no encontrado: {modelo_str}')
        return 0

    fecha_limite = ahora.date() + timedelta(days=dias_anticipacion)
    filtros = {
        f'{campo_fecha}__lte': fecha_limite,
        f'{campo_fecha}__gte': ahora.date(),
    }

    registros = Model.objects.filter(**filtros)
    content_type = ContentType.objects.get_for_model(Model)
    count = 0

    for registro in registros:
        fecha_campo = getattr(registro, campo_fecha, None)
        if not fecha_campo:
            continue

        existe = AlertaGenerada.objects.filter(
            configuracion=config,
            content_type=content_type,
            object_id=str(registro.pk),
            esta_atendida=False,
        ).exists()

        if not existe:
            dias_restantes = (fecha_campo - ahora.date()).days if hasattr(fecha_campo, 'date') is False else (fecha_campo.date() - ahora.date()).days

            AlertaGenerada.objects.create(
                configuracion=config,
                content_type=content_type,
                object_id=str(registro.pk),
                titulo=f'{tipo.nombre}: {str(registro)[:200]}',
                mensaje=f'{campo_fecha} vence en {dias_restantes} días ({fecha_campo})',
                severidad=tipo.severidad_default if dias_restantes > 7 else 'danger',
                fecha_vencimiento=fecha_campo if hasattr(fecha_campo, 'isoformat') else None,
            )
            count += 1

    return count


def _verificar_umbrales(config, tipo, condicion, ahora):
    """Verifica valores que superan umbrales configurados."""
    from django.apps import apps
    from django.contrib.contenttypes.models import ContentType
    from .models import AlertaGenerada

    modelo_str = condicion.get('modelo')
    campo_valor = condicion.get('campo_valor')
    valor_umbral = condicion.get('valor_umbral')
    operador = condicion.get('operador', 'gte')

    if not modelo_str or not campo_valor or valor_umbral is None:
        return 0

    try:
        app_label, model_name = modelo_str.split('.')
        Model = apps.get_model(app_label, model_name)
    except (ValueError, LookupError):
        return 0

    filtro_key = f'{campo_valor}__{operador}'
    filtros = {filtro_key: valor_umbral}

    registros = Model.objects.filter(**filtros)
    content_type = ContentType.objects.get_for_model(Model)
    count = 0

    for registro in registros:
        existe = AlertaGenerada.objects.filter(
            configuracion=config,
            content_type=content_type,
            object_id=str(registro.pk),
            esta_atendida=False,
        ).exists()

        if not existe:
            valor_actual = getattr(registro, campo_valor, 'N/A')
            AlertaGenerada.objects.create(
                configuracion=config,
                content_type=content_type,
                object_id=str(registro.pk),
                titulo=f'{tipo.nombre}: {str(registro)[:200]}',
                mensaje=f'{campo_valor} = {valor_actual} (umbral: {valor_umbral})',
                severidad=tipo.severidad_default,
            )
            count += 1

    return count


def _verificar_inactividad(config, tipo, condicion, ahora):
    """Verifica registros sin actividad reciente."""
    from django.apps import apps
    from django.contrib.contenttypes.models import ContentType
    from .models import AlertaGenerada

    modelo_str = condicion.get('modelo')
    campo_fecha = condicion.get('campo_ultima_actividad', 'updated_at')
    dias_inactividad = condicion.get('dias_inactividad', 30)

    if not modelo_str:
        return 0

    try:
        app_label, model_name = modelo_str.split('.')
        Model = apps.get_model(app_label, model_name)
    except (ValueError, LookupError):
        return 0

    fecha_limite = ahora - timedelta(days=dias_inactividad)
    filtros = {f'{campo_fecha}__lt': fecha_limite}

    registros = Model.objects.filter(**filtros)[:100]
    content_type = ContentType.objects.get_for_model(Model)
    count = 0

    for registro in registros:
        existe = AlertaGenerada.objects.filter(
            configuracion=config,
            content_type=content_type,
            object_id=str(registro.pk),
            esta_atendida=False,
        ).exists()

        if not existe:
            AlertaGenerada.objects.create(
                configuracion=config,
                content_type=content_type,
                object_id=str(registro.pk),
                titulo=f'{tipo.nombre}: {str(registro)[:200]}',
                mensaje=f'Sin actividad desde hace más de {dias_inactividad} días',
                severidad=tipo.severidad_default,
            )
            count += 1

    return count


@shared_task(
    bind=True,
    name='apps.audit_system.config_alertas.tasks.escalar_alertas_no_atendidas',
    max_retries=3,
    default_retry_delay=300,
)
def escalar_alertas_no_atendidas(self):
    """
    Escala alertas no atendidas según la configuración de EscalamientoAlerta.
    Se ejecuta cada 2 horas.
    """
    from django_tenants.utils import schema_context
    from .models import AlertaGenerada, EscalamientoAlerta

    ahora = timezone.now()
    total_escalamientos = 0

    for tenant in _get_active_tenants():
        try:
            with schema_context(tenant.schema_name):
                alertas_pendientes = AlertaGenerada.objects.filter(
                    esta_atendida=False,
                ).select_related('configuracion', 'configuracion__tipo_alerta')

                for alerta in alertas_pendientes:
                    config = alerta.configuracion
                    escalamientos = EscalamientoAlerta.objects.filter(
                        configuracion_alerta=config,
                        is_active=True,
                    ).order_by('nivel')

                    for escalamiento in escalamientos:
                        horas_desde_creacion = (ahora - alerta.created_at).total_seconds() / 3600

                        if horas_desde_creacion >= escalamiento.horas_espera:
                            ya_escalado = hasattr(alerta, '_escalamiento_procesado')
                            if not ya_escalado:
                                logger.info(
                                    f'[ConfigAlertas] {tenant.schema_name}: '
                                    f'Escalando alerta {alerta.id} '
                                    f'al nivel {escalamiento.nivel}'
                                )
                                total_escalamientos += 1
        except Exception as e:
            logger.error(
                f'[ConfigAlertas] Error en tenant {tenant.schema_name}: {e}'
            )

    if total_escalamientos > 0:
        logger.info(
            f'[ConfigAlertas] {total_escalamientos} escalamientos realizados en total'
        )

    return {
        'escalamientos': total_escalamientos,
        'fecha': str(ahora),
    }


@shared_task(
    bind=True,
    name='apps.audit_system.config_alertas.tasks.limpiar_alertas_antiguas',
)
def limpiar_alertas_antiguas(self):
    """
    Limpia alertas atendidas con más de 90 días de antigüedad.
    Se ejecuta semanalmente los domingos a las 3 AM.
    """
    from django_tenants.utils import schema_context
    from .models import AlertaGenerada

    ahora = timezone.now()
    fecha_limite = ahora - timedelta(days=90)
    total_eliminadas = 0

    for tenant in _get_active_tenants():
        try:
            with schema_context(tenant.schema_name):
                count, _ = AlertaGenerada.objects.filter(
                    esta_atendida=True,
                    fecha_atencion__lt=fecha_limite,
                ).delete()

                if count > 0:
                    logger.info(
                        f'[ConfigAlertas] {tenant.schema_name}: '
                        f'{count} alertas antiguas eliminadas'
                    )
                    total_eliminadas += count
        except Exception as e:
            logger.error(
                f'[ConfigAlertas] Error en tenant {tenant.schema_name}: {e}'
            )

    return {'alertas_eliminadas': total_eliminadas, 'fecha': str(ahora)}
