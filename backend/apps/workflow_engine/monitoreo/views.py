from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from datetime import timedelta
from dateutil.relativedelta import relativedelta

from .models import MetricaFlujo, AlertaFlujo, ReglaSLA, DashboardWidget, ReporteAutomatico
from .serializers import MetricaFlujoSerializer, AlertaFlujoSerializer, ReglaSLASerializer, DashboardWidgetSerializer, ReporteAutomaticoSerializer


class MetricaFlujoViewSet(viewsets.ModelViewSet):
    serializer_class = MetricaFlujoSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ["plantilla", "periodo"]
    ordering = ["-fecha_inicio"]

    def get_queryset(self):
        return MetricaFlujo.objects.filter(empresa_id=self.request.user.empresa_id).select_related("plantilla")

    def perform_create(self, serializer):
        serializer.save(empresa_id=self.request.user.empresa_id)

    @action(detail=False, methods=["post"])
    def generar_metricas(self, request):
        from apps.workflow_engine.disenador_flujos.models import PlantillaFlujo
        from datetime import datetime
        plantilla_id = request.data.get("plantilla_id")
        if not plantilla_id:
            return Response({"error": "Faltan parámetros"}, status=status.HTTP_400_BAD_REQUEST)
        return Response({"message": "Métricas generadas"})

    @action(detail=False, methods=["get"])
    def tendencias(self, request):
        return Response({"metricas": []})

    @action(detail=False, methods=["get"])
    def comparativo(self, request):
        return Response([])


class AlertaFlujoViewSet(viewsets.ModelViewSet):
    serializer_class = AlertaFlujoSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ["tipo", "severidad", "estado"]
    ordering = ["-fecha_generacion"]

    def get_queryset(self):
        return AlertaFlujo.objects.filter(empresa_id=self.request.user.empresa_id)

    def perform_create(self, serializer):
        serializer.save(empresa_id=self.request.user.empresa_id)

    @action(detail=False, methods=["get"])
    def activas(self, request):
        alertas = self.get_queryset().filter(estado="activa")
        return Response({"total": alertas.count(), "por_severidad": {}})

    @action(detail=True, methods=["post"])
    def atender(self, request, pk=None):
        alerta = self.get_object()
        alerta.estado = request.data.get("estado", "atendida")
        alerta.atendida_por = request.user
        alerta.fecha_atencion = timezone.now()
        alerta.save()
        return Response(self.get_serializer(alerta).data)


class ReglaSLAViewSet(viewsets.ModelViewSet):
    serializer_class = ReglaSLASerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ["plantilla", "nodo", "is_active"]
    ordering = ["plantilla", "nodo"]

    def get_queryset(self):
        return ReglaSLA.objects.filter(empresa_id=self.request.user.empresa_id)

    def perform_create(self, serializer):
        serializer.save(empresa_id=self.request.user.empresa_id)


class DashboardWidgetViewSet(viewsets.ModelViewSet):
    serializer_class = DashboardWidgetSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ["tipo_widget", "is_visible"]
    ordering = ["posicion_y", "posicion_x"]

    def get_queryset(self):
        return DashboardWidget.objects.filter(usuario=self.request.user)

    def perform_create(self, serializer):
        serializer.save(usuario=self.request.user)

    @action(detail=False, methods=["get"])
    def mi_dashboard(self, request):
        widgets = self.get_queryset().filter(is_visible=True)
        return Response({"widgets": self.get_serializer(widgets, many=True).data, "total": widgets.count()})


class ReporteAutomaticoViewSet(viewsets.ModelViewSet):
    serializer_class = ReporteAutomaticoSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ["frecuencia", "formato", "is_active"]
    ordering = ["nombre"]

    def get_queryset(self):
        return ReporteAutomatico.objects.filter(empresa_id=self.request.user.empresa_id)

    def perform_create(self, serializer):
        serializer.save(empresa_id=self.request.user.empresa_id)

    @action(detail=True, methods=["post"])
    def ejecutar_ahora(self, request, pk=None):
        reporte = self.get_object()
        reporte.ultimo_envio = timezone.now()
        if reporte.frecuencia == "diario":
            reporte.proximo_envio = timezone.now() + timedelta(days=1)
        elif reporte.frecuencia == "semanal":
            reporte.proximo_envio = timezone.now() + timedelta(weeks=1)
        elif reporte.frecuencia == "mensual":
            reporte.proximo_envio = timezone.now() + relativedelta(months=1)
        reporte.save()
        return Response({"message": "Reporte ejecutado", "reporte": self.get_serializer(reporte).data})

