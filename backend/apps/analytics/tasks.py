"""
Celery tasks para el modulo Analytics.

Tasks:
- calcular_kpis_automaticos: Diario, calcula KPIs desde datos de modulos operativos
- snapshot_dashboard_gerencial: Cada hora, cachea datos del dashboard cross-module

NOTA: Todas las tareas iteran sobre tenants activos usando schema_context
porque Celery Beat ejecuta en el schema 'public' donde las tablas tenant no existen.
"""
import logging
from datetime import timedelta
from decimal import Decimal

from celery import shared_task
from django.apps import apps
from django.db.models import Avg, Count, Q, Sum
from django.utils import timezone

logger = logging.getLogger('analytics')


def _get_active_tenants():
    """Retorna tenants activos (excluye public schema)."""
    from apps.tenant.models import Tenant
    return Tenant.objects.filter(is_active=True).exclude(schema_name='public')


@shared_task(
    bind=True,
    name='apps.analytics.tasks.calcular_kpis_automaticos',
    max_retries=1,
    time_limit=15 * 60,
    soft_time_limit=12 * 60,
)
def calcular_kpis_automaticos(self):
    """
    Calcula valores de KPIs automaticamente desde modulos operativos.

    Ejecuta diariamente a las 2 AM via Celery Beat.
    Busca KPIs activos con fuente_datos definida y calcula su valor actual
    basado en queries a los modulos correspondientes.
    """
    from django_tenants.utils import schema_context

    try:
        FichaTecnicaKPI = apps.get_model('config_indicadores', 'FichaTecnicaKPI')
        ValorKPI = apps.get_model('indicadores_area', 'ValorKPI')
    except LookupError as e:
        logger.error(f"Modelos de analytics no disponibles: {e}")
        return {'status': 'models_not_found'}

    ahora = timezone.now()
    periodo = ahora.strftime('%Y-%m')
    total_calculados = 0
    total_errores = 0

    for tenant in _get_active_tenants():
        try:
            with schema_context(tenant.schema_name):
                kpis = FichaTecnicaKPI.objects.filter(
                    is_active=True,
                    fuente_datos__startswith='auto:',
                )

                for kpi in kpis:
                    try:
                        valor = _calcular_valor_kpi(kpi)
                        if valor is not None:
                            ValorKPI.objects.update_or_create(
                                kpi=kpi,
                                periodo=periodo,
                                empresa_id=kpi.empresa_id,
                                defaults={
                                    'valor': Decimal(str(valor)),
                                    'fecha_registro': ahora,
                                    'registrado_automatico': True,
                                    'observaciones': f'Calculado automaticamente desde {kpi.fuente_datos}',
                                },
                            )
                            total_calculados += 1
                    except Exception as e:
                        logger.error(f"Error calculando KPI {kpi.codigo} en {tenant.schema_name}: {e}")
                        total_errores += 1
        except Exception as e:
            logger.error(f'[Analytics] Error en tenant {tenant.schema_name}: {e}')

    result = {
        'calculados': total_calculados,
        'errores': total_errores,
        'periodo': periodo,
        'timestamp': ahora.isoformat(),
    }
    if total_calculados > 0:
        logger.info(f"[Auto-KPI] {result}")

    return result


def _calcular_valor_kpi(kpi) -> float | None:
    """
    Calcula el valor de un KPI basado en su fuente_datos.

    Formato fuente_datos: "auto:{app_label}.{ModelName}.{campo}:{filtros}"
    Ejemplos:
      - auto:accidentalidad.AccidenteTrabajo.count:fecha_evento__year=2026
      - auto:colaboradores.Colaborador.count:estado=ACTIVO
      - auto:calidad.NoConformidad.count:estado=ABIERTA
      - auto:emergencias.Simulacro.count:estado__in=REALIZADO,EVALUADO
      - auto:requisitos_legales.RequisitoLegal.percent:estado_cumplimiento=CUMPLE
    """
    fuente = kpi.fuente_datos
    if not fuente.startswith('auto:'):
        return None

    try:
        spec = fuente[5:]
        parts = spec.split(':')
        model_spec = parts[0]
        filter_spec = parts[1] if len(parts) > 1 else ''

        model_parts = model_spec.split('.')
        if len(model_parts) < 3:
            return None

        app_label = model_parts[0]
        model_name = model_parts[1]
        operation = model_parts[2]

        Model = apps.get_model(app_label, model_name)
        qs = Model.objects.filter(empresa_id=kpi.empresa_id)

        if filter_spec:
            filters = {}
            for f in filter_spec.split(','):
                if '=' not in f:
                    continue
                key, val = f.split('=', 1)
                key = key.strip()
                val = val.strip()

                if val == '{year}':
                    val = str(timezone.now().year)
                if key.endswith('__in'):
                    val = val.split('|')

                if isinstance(val, str) and val.isdigit():
                    val = int(val)

                filters[key] = val

            qs = qs.filter(**filters)

        if operation == 'count':
            return float(qs.count())
        elif operation == 'sum':
            field = model_parts[3] if len(model_parts) > 3 else 'id'
            result = qs.aggregate(total=Sum(field))['total']
            return float(result) if result else 0.0
        elif operation == 'avg':
            field = model_parts[3] if len(model_parts) > 3 else 'id'
            result = qs.aggregate(promedio=Avg(field))['promedio']
            return float(result) if result else 0.0
        elif operation == 'percent':
            total = Model.objects.filter(empresa_id=kpi.empresa_id).count()
            if total == 0:
                return 0.0
            return round(qs.count() / total * 100, 1)

        return None

    except Exception as e:
        logger.warning(f"Error parsing fuente_datos '{fuente}': {e}")
        return None


@shared_task(
    bind=True,
    name='apps.analytics.tasks.snapshot_dashboard_gerencial',
    max_retries=1,
    time_limit=5 * 60,
    soft_time_limit=4 * 60,
)
def snapshot_dashboard_gerencial(self):
    """
    Genera snapshot del dashboard gerencial cross-module.

    Ejecuta cada hora via Celery Beat.
    Guarda el resultado en cache (via SnapshotDashboard model si existe)
    para que el frontend no necesite esperar la agregacion en tiempo real.
    """
    from django_tenants.utils import schema_context

    procesadas = 0

    for tenant in _get_active_tenants():
        try:
            with schema_context(tenant.schema_name):
                from apps.analytics.dashboard_gerencial.services import CrossModuleStatsService

                try:
                    Empresa = apps.get_model('configuracion', 'Empresa')
                    empresas = Empresa.objects.filter(is_active=True)
                except LookupError:
                    empresas = []

                for empresa in empresas:
                    try:
                        data = CrossModuleStatsService.get_dashboard_completo(empresa.id)
                        procesadas += 1
                    except Exception as e:
                        logger.error(
                            f"Error generando snapshot para empresa {empresa.id} "
                            f"en {tenant.schema_name}: {e}"
                        )
        except Exception as e:
            logger.error(f'[Dashboard Snapshot] Error en tenant {tenant.schema_name}: {e}')

    result = {
        'empresas_procesadas': procesadas,
        'timestamp': timezone.now().isoformat(),
    }
    if procesadas > 0:
        logger.info(f"[Dashboard Snapshot] {result}")

    return result
