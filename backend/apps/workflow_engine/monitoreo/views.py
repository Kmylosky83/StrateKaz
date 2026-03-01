from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.db.models import Avg, Count
from datetime import timedelta
from dateutil.relativedelta import relativedelta
from decimal import Decimal

from apps.core.base_models.mixins import get_tenant_empresa
from .models import MetricaFlujo, AlertaFlujo, ReglaSLA, DashboardWidget, ReporteAutomatico
from .serializers import MetricaFlujoSerializer, AlertaFlujoSerializer, ReglaSLASerializer, DashboardWidgetSerializer, ReporteAutomaticoSerializer


class MetricaFlujoViewSet(viewsets.ModelViewSet):
    serializer_class = MetricaFlujoSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ["plantilla", "periodo"]
    ordering = ["-fecha_inicio"]

    def get_queryset(self):
        return MetricaFlujo.objects.select_related("plantilla")

    def perform_create(self, serializer):
        serializer.save(empresa=get_tenant_empresa())

    @action(detail=False, methods=["post"])
    def generar_metricas(self, request):
        """
        Genera métricas reales para una plantilla en un período dado.
        Params: plantilla_id (requerido), periodo (mensual|trimestral|anual),
                fecha_inicio, fecha_fin
        """
        from apps.workflow_engine.disenador_flujos.models import PlantillaFlujo
        from apps.workflow_engine.ejecucion.models import InstanciaFlujo, TareaActiva

        plantilla_id = request.data.get("plantilla_id")
        if not plantilla_id:
            return Response(
                {"error": "Se requiere plantilla_id"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            plantilla = PlantillaFlujo.objects.get(pk=plantilla_id)
        except PlantillaFlujo.DoesNotExist:
            return Response(
                {"error": "Plantilla no encontrada"},
                status=status.HTTP_404_NOT_FOUND,
            )

        periodo = request.data.get("periodo", "mensual")
        now = timezone.now()

        # Determinar rango de fechas
        fecha_fin_str = request.data.get("fecha_fin")
        fecha_inicio_str = request.data.get("fecha_inicio")

        if fecha_fin_str:
            from datetime import datetime
            fecha_fin = datetime.strptime(fecha_fin_str, "%Y-%m-%d").date()
        else:
            fecha_fin = now.date()

        if fecha_inicio_str:
            from datetime import datetime
            fecha_inicio = datetime.strptime(fecha_inicio_str, "%Y-%m-%d").date()
        else:
            if periodo == "mensual":
                fecha_inicio = fecha_fin.replace(day=1)
            elif periodo == "trimestral":
                fecha_inicio = fecha_fin - timedelta(days=90)
            else:  # anual
                fecha_inicio = fecha_fin - timedelta(days=365)

        empresa = get_tenant_empresa()
        empresa_id = empresa.id if empresa else 0

        # Consultar instancias en el período
        instancias = InstanciaFlujo.objects.filter(
            plantilla=plantilla,
            fecha_inicio__date__gte=fecha_inicio,
            fecha_inicio__date__lte=fecha_fin,
        )

        total_instancias = instancias.count()
        completadas = instancias.filter(estado="COMPLETADO").count()
        canceladas = instancias.filter(estado="CANCELADO").count()

        # Tiempo promedio de instancias completadas (en días)
        avg_time = instancias.filter(
            estado="COMPLETADO",
            tiempo_total_horas__isnull=False,
        ).aggregate(avg=Avg("tiempo_total_horas"))
        tiempo_promedio_horas = avg_time["avg"]
        tiempo_promedio_dias = (
            round(Decimal(str(tiempo_promedio_horas)) / Decimal("24"), 2)
            if tiempo_promedio_horas
            else None
        )

        # Consultar tareas del período
        tareas = TareaActiva.objects.filter(
            instancia__plantilla=plantilla,
            fecha_creacion__date__gte=fecha_inicio,
            fecha_creacion__date__lte=fecha_fin,
        )

        tareas_totales = tareas.count()
        tareas_completadas = tareas.filter(estado="COMPLETADA").count()
        tareas_rechazadas = tareas.filter(estado="RECHAZADA").count()

        # Cuellos de botella: nodos con mayor tiempo promedio de ejecución
        cuellos = (
            tareas.filter(
                tiempo_ejecucion_horas__isnull=False,
            )
            .values("nodo__nombre", "nodo__codigo")
            .annotate(
                promedio_horas=Avg("tiempo_ejecucion_horas"),
                total_tareas=Count("id"),
            )
            .order_by("-promedio_horas")[:5]
        )

        cuellos_botella = {
            "nodos": [
                {
                    "nodo": c["nodo__nombre"],
                    "codigo": c["nodo__codigo"],
                    "promedio_horas": float(c["promedio_horas"]),
                    "total_tareas": c["total_tareas"],
                }
                for c in cuellos
            ]
        }

        # Crear o actualizar la métrica
        metrica, created = MetricaFlujo.objects.update_or_create(
            plantilla=plantilla,
            periodo=periodo,
            fecha_inicio=fecha_inicio,
            empresa_id=empresa_id,
            defaults={
                "fecha_fin": fecha_fin,
                "total_instancias": total_instancias,
                "instancias_completadas": completadas,
                "instancias_canceladas": canceladas,
                "tiempo_promedio_dias": tiempo_promedio_dias,
                "tareas_totales": tareas_totales,
                "tareas_completadas": tareas_completadas,
                "tareas_rechazadas": tareas_rechazadas,
                "cuellos_botella": cuellos_botella,
            },
        )

        serializer = self.get_serializer(metrica)
        return Response(serializer.data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)

    @action(detail=False, methods=["get"])
    def tendencias(self, request):
        """
        Retorna métricas mensuales de los últimos N meses.
        Params: meses (default 6), plantilla_id (opcional)
        """
        meses = int(request.query_params.get("meses", 6))
        plantilla_id = request.query_params.get("plantilla_id")
        now = timezone.now()

        qs = MetricaFlujo.objects.all()
        if plantilla_id:
            qs = qs.filter(plantilla_id=plantilla_id)

        # Filtrar por los últimos N meses
        fecha_limite = now - relativedelta(months=meses)
        qs = qs.filter(fecha_inicio__gte=fecha_limite.date()).order_by("fecha_inicio")

        # Agrupar por mes
        metricas_por_mes = {}
        for metrica in qs:
            periodo_key = metrica.fecha_inicio.strftime("%Y-%m")
            if periodo_key not in metricas_por_mes:
                metricas_por_mes[periodo_key] = {
                    "periodo": periodo_key,
                    "total_instancias": 0,
                    "completadas": 0,
                    "canceladas": 0,
                    "tareas_totales": 0,
                    "tareas_completadas": 0,
                    "tareas_rechazadas": 0,
                    "tiempo_promedio_dias": [],
                }
            entry = metricas_por_mes[periodo_key]
            entry["total_instancias"] += metrica.total_instancias
            entry["completadas"] += metrica.instancias_completadas
            entry["canceladas"] += metrica.instancias_canceladas
            entry["tareas_totales"] += metrica.tareas_totales
            entry["tareas_completadas"] += metrica.tareas_completadas
            entry["tareas_rechazadas"] += metrica.tareas_rechazadas
            if metrica.tiempo_promedio_dias is not None:
                entry["tiempo_promedio_dias"].append(float(metrica.tiempo_promedio_dias))

        # Calcular promedios de tiempo
        resultado = []
        for key in sorted(metricas_por_mes.keys()):
            entry = metricas_por_mes[key]
            tiempos = entry.pop("tiempo_promedio_dias")
            entry["tiempo_promedio_dias"] = (
                round(sum(tiempos) / len(tiempos), 2) if tiempos else None
            )
            tasa = (
                round((entry["completadas"] / entry["total_instancias"]) * 100, 1)
                if entry["total_instancias"] > 0
                else 0
            )
            entry["tasa_completadas"] = tasa
            resultado.append(entry)

        return Response({"metricas": resultado})

    @action(detail=False, methods=["get"])
    def comparativo(self, request):
        """
        Compara métricas entre diferentes PlantillaFlujo.
        Retorna un resumen por plantilla con totales y promedios.
        """
        from apps.workflow_engine.disenador_flujos.models import PlantillaFlujo
        from apps.workflow_engine.ejecucion.models import InstanciaFlujo

        # Obtener plantillas activas
        plantillas = PlantillaFlujo.objects.filter(estado="ACTIVO")
        resultado = []

        for plantilla in plantillas:
            instancias = InstanciaFlujo.objects.filter(plantilla=plantilla)
            total = instancias.count()
            completadas = instancias.filter(estado="COMPLETADO").count()
            canceladas = instancias.filter(estado="CANCELADO").count()

            avg_time = instancias.filter(
                estado="COMPLETADO",
                tiempo_total_horas__isnull=False,
            ).aggregate(avg=Avg("tiempo_total_horas"))
            tiempo_promedio_horas = avg_time["avg"]
            tiempo_promedio_dias = (
                round(float(tiempo_promedio_horas) / 24, 2)
                if tiempo_promedio_horas
                else None
            )

            tasa = round((completadas / total) * 100, 1) if total > 0 else 0

            resultado.append({
                "plantilla_id": plantilla.id,
                "plantilla": plantilla.nombre,
                "codigo": plantilla.codigo,
                "total": total,
                "completadas": completadas,
                "canceladas": canceladas,
                "tasa_completadas": tasa,
                "tiempo_promedio": tiempo_promedio_dias,
            })

        # Ordenar por total descendente
        resultado.sort(key=lambda x: x["total"], reverse=True)
        return Response(resultado)


class AlertaFlujoViewSet(viewsets.ModelViewSet):
    serializer_class = AlertaFlujoSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ["tipo", "severidad", "estado"]
    ordering = ["-fecha_generacion"]

    def get_queryset(self):
        return AlertaFlujo.objects.all()

    def perform_create(self, serializer):
        serializer.save(empresa=get_tenant_empresa())

    @action(detail=False, methods=["get"])
    def activas(self, request):
        alertas = self.get_queryset().filter(estado="activa")
        por_severidad = {}
        for sev_code, sev_label in AlertaFlujo.SEVERIDAD_CHOICES:
            count = alertas.filter(severidad=sev_code).count()
            if count > 0:
                por_severidad[sev_code] = count

        return Response({
            "total": alertas.count(),
            "por_severidad": por_severidad,
            "alertas": AlertaFlujoSerializer(alertas[:20], many=True).data,
        })

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
        return ReglaSLA.objects.all()

    def perform_create(self, serializer):
        serializer.save(empresa=get_tenant_empresa())


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
        return ReporteAutomatico.objects.all()

    def perform_create(self, serializer):
        serializer.save(empresa=get_tenant_empresa())

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

