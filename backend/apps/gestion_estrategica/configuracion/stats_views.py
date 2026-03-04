"""
Views de Estadisticas para Configuracion - Gestion Estrategica
Sistema de Gestion StrateKaz

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

# Secciones validas para estadisticas
VALID_SECTIONS = ['empresa', 'sedes', 'integraciones', 'modulos', 'consecutivos', 'unidades_medida', 'normas_iso']


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
    - consecutivos: Estadisticas de consecutivos configurados
    - unidades_medida: Estadisticas de unidades de medida
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
            'consecutivos': calculate_consecutivos_stats,
            'unidades_medida': calculate_unidades_medida_stats,
            'normas_iso': calculate_normas_iso_stats,
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
    """
    Calcula estadisticas de la seccion Empresa.

    Lee datos del Tenant actual (via django-tenants connection.tenant)
    que es el modelo fuente editado por /api/tenant/tenants/me/.
    """
    from django.db import connection

    stats = []

    # Obtener el Tenant actual del schema activo
    tenant = getattr(connection, 'tenant', None)
    if not tenant:
        stats.append({
            'key': 'is_configured',
            'label': 'Estado',
            'value': 'Sin configurar',
            'icon': 'AlertCircle',
            'iconColor': 'warning',
            'description': 'No se pudo determinar la empresa actual'
        })
        return stats

    # Empresa configurada (tiene NIT?)
    is_configured = bool(getattr(tenant, 'nit', None))
    stats.append({
        'key': 'is_configured',
        'label': 'Estado',
        'value': 'Configurada' if is_configured else 'Incompleta',
        'icon': 'CheckCircle2' if is_configured else 'AlertCircle',
        'iconColor': 'success' if is_configured else 'warning',
    })

    # Antiguedad
    fecha_constitucion = getattr(tenant, 'fecha_constitucion', None)
    if fecha_constitucion:
        today = timezone.now().date()
        dias = (today - fecha_constitucion).days
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
            'label': 'Antigüedad',
            'value': antiguedad_text,
            'icon': 'Calendar',
            'iconColor': 'primary',
        })

    # Campos completos - usando campos del modelo Tenant
    campos_requeridos = [
        # Datos de identificacion fiscal
        'razon_social',
        'nit',
        'representante_legal',
        'tipo_sociedad',
        'regimen_tributario',
        # Datos de contacto oficial
        'direccion_fiscal',
        'ciudad',
        'departamento',
        'telefono_principal',
        'email_corporativo',
        # Datos opcionales pero importantes
        'actividad_economica',
        'nombre_comercial',
    ]

    campos_completos = 0
    for campo in campos_requeridos:
        valor = getattr(tenant, campo, None)
        if valor is not None:
            if isinstance(valor, str):
                if valor.strip():
                    campos_completos += 1
            else:
                campos_completos += 1

    total_campos = len(campos_requeridos)
    porcentaje = int((campos_completos / total_campos) * 100) if total_campos > 0 else 0

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

    # Capacidad total - SIMPLIFICADO
    # Suma directa de todas las capacidades sin conversiones complejas
    from decimal import Decimal

    # Intentar primero con el nuevo campo capacidad_almacenamiento
    capacidad_total = sedes.exclude(
        capacidad_almacenamiento__isnull=True
    ).aggregate(
        total=Sum('capacidad_almacenamiento')
    )['total'] or Decimal('0')

    # Fallback: usar campo legacy si no hay capacidad nueva
    if capacidad_total == 0:
        capacidad_total = sedes.aggregate(
            total=Sum('capacidad_almacenamiento_kg')
        )['total'] or Decimal('0')

    # Solo mostrar stat si hay capacidad configurada
    if capacidad_total > 0:
        # Formatear con separador de miles
        try:
            cap_formateada = f'{capacidad_total:,.2f}'.replace(',', '.')
        except (ValueError, TypeError):
            cap_formateada = str(capacidad_total)

        stats.append({
            'key': 'capacidad_total',
            'label': 'Capacidad Total',
            'value': cap_formateada,
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


def calculate_consecutivos_stats():
    """Calcula estadisticas de la seccion Consecutivos"""
    # Modelo migrado a organizacion
    from apps.gestion_estrategica.organizacion.models_consecutivos import ConsecutivoConfig

    stats = []
    consecutivos = ConsecutivoConfig.objects.filter(deleted_at__isnull=True)

    # Total de consecutivos
    total = consecutivos.count()
    stats.append({
        'key': 'total',
        'label': 'Total',
        'value': str(total),
        'icon': 'Hash',
        'iconColor': 'primary',
    })

    # Activos
    activos = consecutivos.filter(is_active=True).count()
    stats.append({
        'key': 'activos',
        'label': 'Activos',
        'value': str(activos),
        'icon': 'Activity',
        'iconColor': 'success' if activos > 0 else 'warning',
    })

    # Del sistema vs custom
    sistema = consecutivos.filter(es_sistema=True).count()
    custom = consecutivos.filter(es_sistema=False).count()
    stats.append({
        'key': 'sistema',
        'label': 'Sistema',
        'value': str(sistema),
        'icon': 'Settings',
        'iconColor': 'info',
        'description': f'{custom} personalizados'
    })

    # Categorias en uso
    categorias_en_uso = consecutivos.values('categoria').distinct().count()
    stats.append({
        'key': 'categorias',
        'label': 'Categorias',
        'value': str(categorias_en_uso),
        'icon': 'Layers',
        'iconColor': 'primary',
    })

    return stats


def calculate_normas_iso_stats():
    """Calcula estadisticas de la seccion Normas ISO"""
    from .models import NormaISO

    stats = []
    normas = NormaISO.objects.filter(deleted_at__isnull=True)

    # Total de normas
    total = normas.count()
    stats.append({
        'key': 'total',
        'label': 'Total Normas',
        'value': str(total),
        'icon': 'Shield',
        'iconColor': 'primary',
    })

    # Activas
    activas = normas.filter(is_active=True).count()
    stats.append({
        'key': 'activas',
        'label': 'Activas',
        'value': str(activas),
        'icon': 'Activity',
        'iconColor': 'success' if activas > 0 else 'warning',
    })

    return stats


def calculate_unidades_medida_stats():
    """Calcula estadisticas de la seccion Unidades de Medida"""
    # Modelo migrado a organizacion
    from apps.gestion_estrategica.organizacion.models_unidades import UnidadMedida

    stats = []
    unidades = UnidadMedida.objects.filter(deleted_at__isnull=True)

    # Total de unidades
    total = unidades.count()
    stats.append({
        'key': 'total',
        'label': 'Total',
        'value': str(total),
        'icon': 'Ruler',
        'iconColor': 'primary',
    })

    # Activas
    activas = unidades.filter(is_active=True).count()
    stats.append({
        'key': 'activas',
        'label': 'Activas',
        'value': str(activas),
        'icon': 'Activity',
        'iconColor': 'success' if activas > 0 else 'warning',
    })

    # Del sistema vs custom
    sistema = unidades.filter(es_sistema=True).count()
    custom = unidades.filter(es_sistema=False).count()
    stats.append({
        'key': 'sistema',
        'label': 'Sistema',
        'value': str(sistema),
        'icon': 'Settings',
        'iconColor': 'info',
        'description': f'{custom} personalizadas'
    })

    # Categorias en uso
    categorias_en_uso = unidades.values('categoria').distinct().count()
    stats.append({
        'key': 'categorias',
        'label': 'Categorias',
        'value': str(categorias_en_uso),
        'icon': 'Layers',
        'iconColor': 'primary',
    })

    return stats
