"""
Views de Estadisticas para Configuracion - Gestion Estrategica
Sistema de Gestion Grasas y Huesos del Norte

Endpoint de estadisticas dinamicas por seccion del modulo Configuracion.
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
from django.db.models import Sum, Count, Q
from datetime import timedelta
import logging

logger = logging.getLogger(__name__)

# Secciones validas (consecutivos fue movido a organizacion/)
VALID_SECTIONS = ['empresa', 'sedes', 'integraciones', 'modulos']


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def config_stats_view(request):
    """
    Endpoint para obtener estadisticas dinamicas por seccion.

    GET /api/strategic/configuracion/config-stats/?section=empresa

    Secciones disponibles:
    - empresa: Estadisticas de configuracion de empresa
    - sedes: Estadisticas de sedes
    - integraciones: Estadisticas de integraciones externas
    - modulos: Estadisticas de modulos del sistema

    NOTA: consecutivos fue movido a /organizacion/consecutivos/
    """
    section = request.query_params.get('section', '').lower()

    if not section:
        return Response(
            {'error': 'El parametro "section" es requerido', 'valid_sections': VALID_SECTIONS},
            status=status.HTTP_400_BAD_REQUEST
        )

    if section not in VALID_SECTIONS:
        return Response(
            {'error': f'Seccion "{section}" no valida', 'valid_sections': VALID_SECTIONS},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        # Calcular estadisticas segun la seccion
        calculators = {
            'empresa': calculate_empresa_stats,
            'sedes': calculate_sedes_stats,
            'integraciones': calculate_integraciones_stats,
            'modulos': calculate_modulos_stats,
        }

        stats = calculators[section]()

        return Response({
            'section': section,
            'stats': stats
        })

    except Exception as e:
        logger.error(f"Error calculando estadisticas para seccion '{section}': {str(e)}")
        return Response(
            {'error': 'Error al calcular estadisticas', 'detail': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


def calculate_empresa_stats():
    """Calcula estadisticas de la seccion Empresa"""
    from .models import EmpresaConfig

    stats = []
    instance = EmpresaConfig.get_instance()

    if not instance:
        # No hay configuracion
        stats.append({
            'key': 'is_configured',
            'label': 'Estado',
            'value': 'Sin configurar',
            'icon': 'AlertCircle',
            'iconColor': 'warning',
            'description': 'La empresa no ha sido configurada'
        })
        return stats

    # Empresa configurada
    is_configured = bool(instance.nit)
    stats.append({
        'key': 'is_configured',
        'label': 'Estado',
        'value': 'Configurada' if is_configured else 'Incompleta',
        'icon': 'CheckCircle2' if is_configured else 'AlertCircle',
        'iconColor': 'success' if is_configured else 'warning',
    })

    # Antiguedad
    if instance.fecha_constitucion:
        today = timezone.now().date()
        dias = (today - instance.fecha_constitucion).days
        years = dias // 365
        months = (dias % 365) // 30

        if years > 0:
            antiguedad_text = f"{years} año{'s' if years > 1 else ''}"
            if months > 0:
                antiguedad_text += f", {months} mes{'es' if months > 1 else ''}"
        else:
            antiguedad_text = f"{months} mes{'es' if months > 1 else ''}" if months > 0 else "Reciente"

        stats.append({
            'key': 'antiguedad',
            'label': 'Antiguedad',
            'value': antiguedad_text,
            'icon': 'Calendar',
            'iconColor': 'primary',
        })

    # Campos completos
    campos_requeridos = [
        'razon_social', 'nit', 'digito_verificacion', 'direccion',
        'ciudad', 'departamento', 'telefono', 'email', 'representante_legal',
        'tipo_empresa', 'regimen_tributario', 'actividad_economica'
    ]
    campos_completos = sum(1 for campo in campos_requeridos if getattr(instance, campo, None))
    total_campos = len(campos_requeridos)
    porcentaje = int((campos_completos / total_campos) * 100)

    stats.append({
        'key': 'campos_completos',
        'label': 'Completitud',
        'value': f'{campos_completos}/{total_campos}',
        'icon': 'FileText',
        'iconColor': 'success' if porcentaje >= 80 else 'warning' if porcentaje >= 50 else 'danger',
        'description': f'{porcentaje}% de campos requeridos'
    })

    return stats


def calculate_sedes_stats():
    """Calcula estadisticas de la seccion Sedes"""
    from .models import SedeEmpresa

    stats = []
    sedes = SedeEmpresa.objects.filter(deleted_at__isnull=True)

    # Total de sedes
    total = sedes.count()
    stats.append({
        'key': 'total_sedes',
        'label': 'Total Sedes',
        'value': str(total),
        'icon': 'MapPin',
        'iconColor': 'primary',
    })

    # Sede principal
    tiene_principal = sedes.filter(es_sede_principal=True).exists()
    stats.append({
        'key': 'sede_principal',
        'label': 'Sede Principal',
        'value': 'Configurada' if tiene_principal else 'Sin definir',
        'icon': 'Building2',
        'iconColor': 'success' if tiene_principal else 'warning',
    })

    # Sedes con GPS
    sedes_con_gps = sedes.filter(
        Q(latitud__isnull=False) & Q(longitud__isnull=False)
    ).count()
    stats.append({
        'key': 'sedes_gps',
        'label': 'Con GPS',
        'value': f'{sedes_con_gps}/{total}' if total > 0 else '0',
        'icon': 'Navigation',
        'iconColor': 'success' if sedes_con_gps == total else 'primary',
    })

    # Capacidad total (si aplica)
    capacidad_total = sedes.aggregate(
        total=Sum('capacidad_almacenamiento_kg')
    )['total'] or 0

    if capacidad_total > 0:
        # Formatear capacidad
        if capacidad_total >= 1000:
            cap_text = f'{capacidad_total/1000:.1f} ton'
        else:
            cap_text = f'{capacidad_total:.0f} kg'

        stats.append({
            'key': 'capacidad_total',
            'label': 'Capacidad Total',
            'value': cap_text,
            'icon': 'Warehouse',
            'iconColor': 'primary',
        })

    return stats


def calculate_integraciones_stats():
    """Calcula estadisticas de la seccion Integraciones"""
    from .models import IntegracionExterna

    stats = []
    integraciones = IntegracionExterna.objects.filter(deleted_at__isnull=True)

    # Total
    total = integraciones.count()
    stats.append({
        'key': 'total',
        'label': 'Total',
        'value': str(total),
        'icon': 'Plug',
        'iconColor': 'primary',
    })

    # Activas
    activas = integraciones.filter(is_active=True).count()
    stats.append({
        'key': 'activas',
        'label': 'Activas',
        'value': str(activas),
        'icon': 'Activity',
        'iconColor': 'success' if activas > 0 else 'warning',
    })

    # Saludables (conexion exitosa en las ultimas 24h)
    hace_24h = timezone.now() - timedelta(hours=24)
    saludables = integraciones.filter(
        is_active=True,
        ultima_conexion_exitosa__gte=hace_24h
    ).count()
    stats.append({
        'key': 'saludables',
        'label': 'Saludables',
        'value': str(saludables),
        'icon': 'CheckCircle2',
        'iconColor': 'success' if saludables == activas else 'warning',
    })

    # Criticas (activas pero no saludables)
    criticas = activas - saludables
    if criticas > 0:
        stats.append({
            'key': 'criticas',
            'label': 'Criticas',
            'value': str(criticas),
            'icon': 'AlertCircle',
            'iconColor': 'danger',
            'description': 'Sin conexion en 24h'
        })

    return stats


def calculate_modulos_stats():
    """Calcula estadisticas de la seccion Modulos"""
    from apps.core.models import SystemModule, ModuleTab, TabSection

    stats = []

    # Modulos
    total_modulos = SystemModule.objects.count()
    modulos_habilitados = SystemModule.objects.filter(is_enabled=True).count()

    stats.append({
        'key': 'modulos',
        'label': 'Modulos',
        'value': f'{modulos_habilitados}/{total_modulos}',
        'icon': 'Package',
        'iconColor': 'primary',
        'description': f'{int((modulos_habilitados/total_modulos)*100) if total_modulos > 0 else 0}% habilitados'
    })

    # Tabs habilitados
    total_tabs = ModuleTab.objects.count()
    tabs_habilitados = ModuleTab.objects.filter(is_enabled=True).count()

    stats.append({
        'key': 'tabs',
        'label': 'Tabs',
        'value': f'{tabs_habilitados}/{total_tabs}',
        'icon': 'Layers',
        'iconColor': 'primary',
    })

    # Secciones habilitadas
    total_secciones = TabSection.objects.count()
    secciones_habilitadas = TabSection.objects.filter(is_enabled=True).count()

    stats.append({
        'key': 'secciones',
        'label': 'Secciones',
        'value': f'{secciones_habilitadas}/{total_secciones}',
        'icon': 'Grid3X3',
        'iconColor': 'primary',
    })

    # Cobertura general
    total_elementos = total_modulos + total_tabs + total_secciones
    elementos_habilitados = modulos_habilitados + tabs_habilitados + secciones_habilitadas
    cobertura = int((elementos_habilitados / total_elementos) * 100) if total_elementos > 0 else 0

    stats.append({
        'key': 'cobertura',
        'label': 'Cobertura',
        'value': f'{cobertura}%',
        'icon': 'TrendingUp',
        'iconColor': 'success' if cobertura >= 80 else 'warning' if cobertura >= 50 else 'danger',
    })

    return stats
