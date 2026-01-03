"""Views para Acciones por Indicador"""
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from apps.core.mixins import StandardViewSetMixin
from .models import PlanAccionKPI, ActividadPlanKPI, SeguimientoPlanKPI, IntegracionAccionCorrectiva
from .serializers import (
    PlanAccionKPISerializer, ActividadPlanKPISerializer,
    SeguimientoPlanKPISerializer, IntegracionAccionCorrectivaSerializer
)

class PlanAccionKPIViewSet(StandardViewSetMixin, viewsets.ModelViewSet):
    queryset = PlanAccionKPI.objects.all()
    serializer_class = PlanAccionKPISerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['kpi', 'estado', 'prioridad', 'is_active']
    ordering = ['-prioridad', 'fecha_meta']

class ActividadPlanKPIViewSet(StandardViewSetMixin, viewsets.ModelViewSet):
    queryset = ActividadPlanKPI.objects.all()
    serializer_class = ActividadPlanKPISerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['plan', 'estado', 'is_active']
    ordering = ['plan', 'numero_actividad']

class SeguimientoPlanKPIViewSet(StandardViewSetMixin, viewsets.ModelViewSet):
    queryset = SeguimientoPlanKPI.objects.all()
    serializer_class = SeguimientoPlanKPISerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['plan', 'is_active']
    ordering = ['-fecha_seguimiento']

class IntegracionAccionCorrectivaViewSet(StandardViewSetMixin, viewsets.ModelViewSet):
    queryset = IntegracionAccionCorrectiva.objects.all()
    serializer_class = IntegracionAccionCorrectivaSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['plan_kpi', 'accion_correctiva_id', 'tipo_vinculo', 'is_active']
    ordering = ['-fecha_vinculacion']
