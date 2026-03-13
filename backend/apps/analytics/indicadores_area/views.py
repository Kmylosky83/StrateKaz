"""
Views para Indicadores Área - Analytics
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Count, Avg, Q
from django.utils import timezone
from datetime import timedelta
from apps.core.mixins import StandardViewSetMixin
from .models import ValorKPI, AccionPorKPI, AlertaKPI
from .serializers import ValorKPISerializer, AccionPorKPISerializer, AlertaKPISerializer


class ValorKPIViewSet(StandardViewSetMixin, viewsets.ModelViewSet):
    """ViewSet para ValorKPI"""
    queryset = ValorKPI.objects.select_related('kpi', 'registrado_por')
    serializer_class = ValorKPISerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['kpi', 'semaforo', 'is_active']
    search_fields = ['kpi__codigo', 'kpi__nombre', 'periodo']
    ordering_fields = ['fecha_medicion', 'valor', 'porcentaje_cumplimiento']
    ordering = ['-fecha_medicion']

    def get_queryset(self):
        queryset = super().get_queryset()
        empresa_id = self.request.query_params.get('empresa_id')
        if empresa_id:
            queryset = queryset.filter(empresa_id=empresa_id)
        return queryset

    @action(detail=False, methods=['post'], url_path='registrar-valor')
    def registrar_valor(self, request):
        """Registrar un nuevo valor de KPI"""
        data = request.data.copy()
        data['registrado_por'] = request.user.id
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['get'], url_path='ultimos-valores')
    def ultimos_valores(self, request):
        """Obtener los últimos N valores de un KPI"""
        kpi_id = request.query_params.get('kpi_id')
        limit = int(request.query_params.get('limit', 10))

        if not kpi_id:
            return Response(
                {'error': 'Parámetro kpi_id es requerido'},
                status=status.HTTP_400_BAD_REQUEST
            )

        valores = self.get_queryset().filter(
            kpi_id=kpi_id
        ).order_by('-fecha_medicion')[:limit]

        serializer = self.get_serializer(valores, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def tendencia(self, request):
        """Obtener tendencia de un KPI (últimos 6 meses)"""
        kpi_id = request.query_params.get('kpi_id')
        if not kpi_id:
            return Response(
                {'error': 'Parámetro kpi_id es requerido'},
                status=status.HTTP_400_BAD_REQUEST
            )

        fecha_inicio = timezone.now().date() - timedelta(days=180)
        valores = self.get_queryset().filter(
            kpi_id=kpi_id,
            fecha_medicion__gte=fecha_inicio
        ).order_by('fecha_medicion').values(
            'periodo', 'valor', 'valor_meta', 'semaforo', 'fecha_medicion'
        )

        return Response(list(valores))


class AccionPorKPIViewSet(StandardViewSetMixin, viewsets.ModelViewSet):
    """ViewSet para AccionPorKPI"""
    queryset = AccionPorKPI.objects.select_related('valor_kpi')
    serializer_class = AccionPorKPISerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['estado', 'tipo_accion', 'responsable_id', 'is_active']
    search_fields = ['descripcion', 'valor_kpi__kpi__codigo']
    ordering_fields = ['fecha_compromiso', 'created_at']
    ordering = ['fecha_compromiso']

    def get_queryset(self):
        queryset = super().get_queryset()
        empresa_id = self.request.query_params.get('empresa_id')
        if empresa_id:
            queryset = queryset.filter(empresa_id=empresa_id)
        return queryset


class AlertaKPIViewSet(StandardViewSetMixin, viewsets.ModelViewSet):
    """ViewSet para AlertaKPI"""
    queryset = AlertaKPI.objects.select_related('kpi', 'leida_por')
    serializer_class = AlertaKPISerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['kpi', 'tipo_alerta', 'esta_leida', 'is_active']
    search_fields = ['kpi__codigo', 'kpi__nombre', 'mensaje']
    ordering_fields = ['fecha_generacion']
    ordering = ['-fecha_generacion']

    def get_queryset(self):
        queryset = super().get_queryset()
        empresa_id = self.request.query_params.get('empresa_id')
        if empresa_id:
            queryset = queryset.filter(empresa_id=empresa_id)
        return queryset

    @action(detail=True, methods=['post'], url_path='marcar-leida')
    def marcar_leida(self, request, pk=None):
        """Marcar alerta como leída"""
        alerta = self.get_object()
        alerta.marcar_como_leida(request.user)
        return Response({'success': True, 'message': 'Alerta marcada como leída'})

    @action(detail=False, methods=['get'], url_path='no-leidas')
    def no_leidas(self, request):
        """Obtener alertas no leídas"""
        alertas = self.get_queryset().filter(esta_leida=False)
        serializer = self.get_serializer(alertas, many=True)
        return Response(serializer.data)
