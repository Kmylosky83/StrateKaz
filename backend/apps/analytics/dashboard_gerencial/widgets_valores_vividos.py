"""
Widget de Valores Vividos para Dashboard Gerencial

Este módulo integra los datos de Valores Vividos (Identidad Corporativa)
con el Dashboard Gerencial de Analytics, permitiendo visualizar:

- Índice de Vivencia de Valores
- Top valores más vividos
- Tendencia mensual de vinculación
- Valores subrepresentados (alertas)
"""
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from django.utils import timezone
from django.db.models import Count, Avg, Q, F
from django.apps import apps

logger = logging.getLogger(__name__)


class ValoresVividosWidgetService:
    """
    Servicio que proporciona datos de Valores Vividos
    en formato compatible con widgets del Dashboard Gerencial.
    """

    @staticmethod
    def is_available() -> bool:
        """Verifica si el módulo de Valores Vividos está disponible."""
        try:
            apps.get_model('identidad', 'ValorVivido')
            return True
        except LookupError:
            return False

    @classmethod
    def get_indice_vivencia(cls, empresa_id: Optional[int] = None) -> Dict[str, Any]:
        """
        Calcula el Índice de Vivencia de Valores.

        Este KPI mide qué tan bien la organización vive sus valores,
        basado en la cantidad y calidad de acciones vinculadas.

        Returns:
            dict: {
                'valor': float (0-100),
                'tendencia': str ('up', 'down', 'stable'),
                'variacion': float,
                'color': str,
                'descripcion': str
            }
        """
        if not cls.is_available():
            return cls._empty_kpi('Módulo no disponible')

        ValorVivido = apps.get_model('identidad', 'ValorVivido')
        CorporateValue = apps.get_model('identidad', 'CorporateValue')

        # Obtener período actual (último mes)
        hoy = timezone.now().date()
        inicio_mes = hoy.replace(day=1)
        inicio_mes_anterior = (inicio_mes - timedelta(days=1)).replace(day=1)

        # Queryset base
        qs = ValorVivido.objects.filter(is_active=True)
        if empresa_id:
            qs = qs.filter(valor__identity__empresa_id=empresa_id)

        # Contar valores activos
        total_valores = CorporateValue.objects.filter(is_active=True).count()
        if total_valores == 0:
            return cls._empty_kpi('No hay valores definidos')

        # Calcular métricas del mes actual
        acciones_mes_actual = qs.filter(fecha_vinculacion__gte=inicio_mes).count()
        puntaje_promedio = qs.filter(fecha_vinculacion__gte=inicio_mes).aggregate(
            promedio=Avg('puntaje')
        )['promedio'] or 0

        # Calcular métricas del mes anterior
        acciones_mes_anterior = qs.filter(
            fecha_vinculacion__gte=inicio_mes_anterior,
            fecha_vinculacion__lt=inicio_mes
        ).count()

        # Calcular índice (0-100)
        # Fórmula: (puntaje_promedio / 10) * 50 + (cobertura_valores) * 50
        valores_con_acciones = qs.filter(
            fecha_vinculacion__gte=inicio_mes
        ).values('valor').distinct().count()
        cobertura = (valores_con_acciones / total_valores) * 100 if total_valores > 0 else 0
        indice = (puntaje_promedio / 10) * 50 + (cobertura / 100) * 50

        # Calcular tendencia
        if acciones_mes_anterior > 0:
            variacion = ((acciones_mes_actual - acciones_mes_anterior) / acciones_mes_anterior) * 100
        else:
            variacion = 100 if acciones_mes_actual > 0 else 0

        if variacion > 5:
            tendencia = 'up'
            color = 'green'
        elif variacion < -5:
            tendencia = 'down'
            color = 'red'
        else:
            tendencia = 'stable'
            color = 'gray'

        return {
            'valor': round(indice, 1),
            'tendencia': tendencia,
            'variacion': round(variacion, 1),
            'color': color,
            'descripcion': f'{acciones_mes_actual} acciones vinculadas este mes',
            'detalles': {
                'puntaje_promedio': round(puntaje_promedio, 2),
                'cobertura_valores': round(cobertura, 1),
                'valores_activos': valores_con_acciones,
                'total_valores': total_valores,
            }
        }

    @classmethod
    def get_top_valores(
        cls,
        empresa_id: Optional[int] = None,
        limite: int = 5,
        dias: int = 30
    ) -> List[Dict[str, Any]]:
        """
        Obtiene los valores más vividos en el período.

        Returns:
            list: [
                {'valor': str, 'acciones': int, 'puntaje_promedio': float},
                ...
            ]
        """
        if not cls.is_available():
            return []

        ValorVivido = apps.get_model('identidad', 'ValorVivido')

        desde = timezone.now().date() - timedelta(days=dias)

        qs = ValorVivido.objects.filter(
            is_active=True,
            fecha_vinculacion__gte=desde
        )
        if empresa_id:
            qs = qs.filter(valor__identity__empresa_id=empresa_id)

        top = qs.values(
            'valor__id',
            'valor__name',
            'valor__icon',
            'valor__color'
        ).annotate(
            acciones=Count('id'),
            puntaje_promedio=Avg('puntaje')
        ).order_by('-acciones')[:limite]

        return [
            {
                'id': item['valor__id'],
                'nombre': item['valor__name'],
                'icon': item['valor__icon'],
                'color': item['valor__color'],
                'acciones': item['acciones'],
                'puntaje': round(item['puntaje_promedio'] or 0, 1),
            }
            for item in top
        ]

    @classmethod
    def get_tendencia_mensual(
        cls,
        empresa_id: Optional[int] = None,
        meses: int = 6
    ) -> List[Dict[str, Any]]:
        """
        Obtiene tendencia mensual de valores vividos para gráficos.

        Returns:
            list: [
                {'mes': str, 'total': int, 'puntaje_promedio': float},
                ...
            ]
        """
        if not cls.is_available():
            return []

        ValorVivido = apps.get_model('identidad', 'ValorVivido')
        from django.db.models.functions import TruncMonth

        desde = timezone.now().date() - timedelta(days=meses * 30)

        qs = ValorVivido.objects.filter(
            is_active=True,
            fecha_vinculacion__gte=desde
        )
        if empresa_id:
            qs = qs.filter(valor__identity__empresa_id=empresa_id)

        tendencia = qs.annotate(
            mes=TruncMonth('fecha_vinculacion')
        ).values('mes').annotate(
            total=Count('id'),
            puntaje_promedio=Avg('puntaje')
        ).order_by('mes')

        return [
            {
                'mes': item['mes'].strftime('%Y-%m') if item['mes'] else '',
                'mes_nombre': item['mes'].strftime('%b %Y') if item['mes'] else '',
                'total': item['total'],
                'puntaje': round(item['puntaje_promedio'] or 0, 1),
            }
            for item in tendencia
        ]

    @classmethod
    def get_alertas_valores(
        cls,
        empresa_id: Optional[int] = None,
        umbral: int = 3
    ) -> List[Dict[str, Any]]:
        """
        Identifica valores subrepresentados (alertas).

        Returns:
            list: [
                {'valor': str, 'acciones': int, 'alerta': str},
                ...
            ]
        """
        if not cls.is_available():
            return []

        ValorVivido = apps.get_model('identidad', 'ValorVivido')
        CorporateValue = apps.get_model('identidad', 'CorporateValue')

        # Último mes
        desde = timezone.now().date() - timedelta(days=30)

        # Obtener todos los valores activos
        valores = CorporateValue.objects.filter(is_active=True)
        if empresa_id:
            valores = valores.filter(identity__empresa_id=empresa_id)

        # Contar acciones por valor
        acciones_por_valor = {}
        qs = ValorVivido.objects.filter(
            is_active=True,
            fecha_vinculacion__gte=desde
        )
        if empresa_id:
            qs = qs.filter(valor__identity__empresa_id=empresa_id)

        conteo = qs.values('valor_id').annotate(total=Count('id'))
        for item in conteo:
            acciones_por_valor[item['valor_id']] = item['total']

        # Identificar valores bajo umbral
        alertas = []
        for valor in valores:
            acciones = acciones_por_valor.get(valor.id, 0)
            if acciones < umbral:
                alertas.append({
                    'id': valor.id,
                    'nombre': valor.name,
                    'acciones': acciones,
                    'deficit': umbral - acciones,
                    'alerta': 'CRITICO' if acciones == 0 else 'BAJO',
                    'icon': valor.icon,
                    'color': valor.color,
                })

        return sorted(alertas, key=lambda x: x['acciones'])

    @classmethod
    def get_widget_data(
        cls,
        widget_tipo: str,
        empresa_id: Optional[int] = None,
        **params
    ) -> Dict[str, Any]:
        """
        Obtiene datos formateados para un tipo de widget específico.

        Args:
            widget_tipo: 'kpi_indice', 'chart_tendencia', 'list_top', 'alert_subrepresentados'
            empresa_id: ID de empresa para filtrar
            **params: Parámetros adicionales según tipo de widget

        Returns:
            dict: Datos formateados para el widget
        """
        if widget_tipo == 'kpi_indice':
            return cls.get_indice_vivencia(empresa_id)

        elif widget_tipo == 'chart_tendencia':
            meses = params.get('meses', 6)
            return {
                'tipo': 'line',
                'datos': cls.get_tendencia_mensual(empresa_id, meses),
                'config': {
                    'xAxis': 'mes_nombre',
                    'yAxis': 'total',
                    'color': '#8B5CF6',
                }
            }

        elif widget_tipo == 'list_top':
            limite = params.get('limite', 5)
            dias = params.get('dias', 30)
            return {
                'tipo': 'list',
                'datos': cls.get_top_valores(empresa_id, limite, dias),
                'config': {
                    'titulo': f'Top {limite} Valores Vividos',
                    'subtitulo': f'Últimos {dias} días',
                }
            }

        elif widget_tipo == 'alert_subrepresentados':
            umbral = params.get('umbral', 3)
            alertas = cls.get_alertas_valores(empresa_id, umbral)
            return {
                'tipo': 'alert_list',
                'datos': alertas,
                'count': len(alertas),
                'config': {
                    'titulo': 'Valores que Necesitan Atención',
                    'umbral': umbral,
                }
            }

        else:
            return {'error': f'Tipo de widget no soportado: {widget_tipo}'}

    @staticmethod
    def _empty_kpi(mensaje: str) -> Dict[str, Any]:
        """Retorna un KPI vacío con mensaje."""
        return {
            'valor': 0,
            'tendencia': 'stable',
            'variacion': 0,
            'color': 'gray',
            'descripcion': mensaje,
            'detalles': {}
        }


def get_valores_vividos_summary(empresa_id: Optional[int] = None) -> Dict[str, Any]:
    """
    Función de conveniencia para obtener resumen completo de Valores Vividos.

    Útil para integrar en el dashboard principal de Analytics.
    """
    service = ValoresVividosWidgetService

    if not service.is_available():
        return {
            'disponible': False,
            'mensaje': 'El módulo de Valores Vividos no está disponible'
        }

    return {
        'disponible': True,
        'indice': service.get_indice_vivencia(empresa_id),
        'top_valores': service.get_top_valores(empresa_id, limite=3),
        'alertas': service.get_alertas_valores(empresa_id)[:3],
        'tendencia': service.get_tendencia_mensual(empresa_id, meses=3),
    }
