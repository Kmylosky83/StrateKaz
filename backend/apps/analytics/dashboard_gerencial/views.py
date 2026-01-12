"""
Views para Dashboard Gerencial - Analytics
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from apps.core.mixins import StandardViewSetMixin, OrderingMixin
from .models import VistaDashboard, WidgetDashboard, FavoritoDashboard
from .serializers import (
    VistaDashboardSerializer, WidgetDashboardSerializer, FavoritoDashboardSerializer
)
from .widgets_valores_vividos import ValoresVividosWidgetService, get_valores_vividos_summary


class VistaDashboardViewSet(StandardViewSetMixin, OrderingMixin, viewsets.ModelViewSet):
    """ViewSet para VistaDashboard"""
    queryset = VistaDashboard.objects.prefetch_related('widgets', 'roles_permitidos')
    serializer_class = VistaDashboardSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['perspectiva_bsc', 'es_publica', 'is_active']
    search_fields = ['codigo', 'nombre', 'descripcion']
    ordering_fields = ['codigo', 'nombre', 'orden', 'created_at']
    ordering = ['orden', 'nombre']

    def get_queryset(self):
        queryset = super().get_queryset()
        empresa_id = self.request.query_params.get('empresa_id')
        if empresa_id:
            queryset = queryset.filter(empresa_id=empresa_id)
        return queryset

    @action(detail=False, methods=['get'])
    def mis_favoritos(self, request):
        """Obtener dashboards favoritos del usuario actual"""
        favoritos = FavoritoDashboard.objects.filter(
            usuario=request.user
        ).select_related('vista')
        vistas = [fav.vista for fav in favoritos]
        serializer = self.get_serializer(vistas, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def agregar_favorito(self, request, pk=None):
        """Agregar esta vista a favoritos del usuario"""
        vista = self.get_object()
        es_default = request.data.get('es_default', False)

        favorito, created = FavoritoDashboard.objects.get_or_create(
            usuario=request.user,
            vista=vista,
            defaults={'es_default': es_default}
        )

        if not created and es_default:
            favorito.es_default = True
            favorito.save()

        return Response({
            'success': True,
            'created': created,
            'message': 'Dashboard agregado a favoritos' if created else 'Ya estaba en favoritos'
        })

    # =========================================================================
    # INTEGRACIÓN CON VALORES VIVIDOS (BI)
    # =========================================================================

    @action(detail=False, methods=['get'], url_path='valores-vividos')
    def valores_vividos(self, request):
        """
        Obtiene resumen de Valores Vividos para el dashboard.

        GET /api/analytics/dashboard/vistas/valores-vividos/

        Integra datos del módulo de Identidad Corporativa:
        - Índice de Vivencia de Valores (KPI principal)
        - Top valores más vividos
        - Alertas de valores subrepresentados
        - Tendencia mensual

        Query params:
        - empresa_id: ID de empresa (opcional)
        """
        empresa_id = request.query_params.get('empresa_id')
        if empresa_id:
            empresa_id = int(empresa_id)

        resumen = get_valores_vividos_summary(empresa_id)
        return Response(resumen)

    @action(detail=False, methods=['get'], url_path='valores-vividos/widget')
    def valores_vividos_widget(self, request):
        """
        Obtiene datos para un widget específico de Valores Vividos.

        GET /api/analytics/dashboard/vistas/valores-vividos/widget/?tipo=kpi_indice

        Query params:
        - tipo: 'kpi_indice', 'chart_tendencia', 'list_top', 'alert_subrepresentados'
        - empresa_id: ID de empresa (opcional)
        - meses: Número de meses para tendencia (default: 6)
        - limite: Número de items para top (default: 5)
        - dias: Días a considerar para top (default: 30)
        - umbral: Umbral para alertas (default: 3)
        """
        tipo = request.query_params.get('tipo', 'kpi_indice')
        empresa_id = request.query_params.get('empresa_id')

        if empresa_id:
            empresa_id = int(empresa_id)

        params = {
            'meses': int(request.query_params.get('meses', 6)),
            'limite': int(request.query_params.get('limite', 5)),
            'dias': int(request.query_params.get('dias', 30)),
            'umbral': int(request.query_params.get('umbral', 3)),
        }

        data = ValoresVividosWidgetService.get_widget_data(
            widget_tipo=tipo,
            empresa_id=empresa_id,
            **params
        )
        return Response(data)


class WidgetDashboardViewSet(StandardViewSetMixin, OrderingMixin, viewsets.ModelViewSet):
    """ViewSet para WidgetDashboard"""
    queryset = WidgetDashboard.objects.select_related('vista').prefetch_related('kpis')
    serializer_class = WidgetDashboardSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['vista', 'tipo_widget', 'is_active']
    search_fields = ['titulo', 'vista__nombre']
    ordering_fields = ['orden', 'created_at']
    ordering = ['vista', 'orden']

    def get_queryset(self):
        queryset = super().get_queryset()
        empresa_id = self.request.query_params.get('empresa_id')
        if empresa_id:
            queryset = queryset.filter(empresa_id=empresa_id)
        return queryset


class FavoritoDashboardViewSet(viewsets.ModelViewSet):
    """ViewSet para FavoritoDashboard"""
    queryset = FavoritoDashboard.objects.select_related('usuario', 'vista')
    serializer_class = FavoritoDashboardSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['usuario', 'vista', 'es_default']
    ordering = ['-es_default', '-fecha_agregado']

    def get_queryset(self):
        """Filtrar solo favoritos del usuario actual"""
        return super().get_queryset().filter(usuario=self.request.user)
