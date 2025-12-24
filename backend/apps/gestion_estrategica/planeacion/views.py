"""
Views del módulo Planeación Estratégica - Dirección Estratégica
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.utils import timezone

from apps.core.permissions import HasModulePermission
from .models import StrategicPlan, StrategicObjective
from .serializers import (
    StrategicPlanSerializer,
    StrategicPlanCreateUpdateSerializer,
    StrategicObjectiveSerializer,
    StrategicObjectiveCreateUpdateSerializer,
    ApprovePlanSerializer,
    UpdateProgressSerializer
)


class StrategicPlanViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar Planes Estratégicos.

    Endpoints:
    - GET /planes/ - Lista de planes estratégicos
    - POST /planes/ - Crear nuevo plan
    - GET /planes/{id}/ - Detalle del plan
    - PUT/PATCH /planes/{id}/ - Actualizar plan
    - DELETE /planes/{id}/ - Eliminar plan
    - GET /planes/active/ - Obtener plan activo
    - POST /planes/{id}/approve/ - Aprobar plan
    - GET /planes/{id}/dashboard/ - Dashboard del plan
    """

    queryset = StrategicPlan.objects.prefetch_related('objectives').all()
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['is_active', 'period_type']
    search_fields = ['name', 'description']
    ordering_fields = ['start_date', 'end_date', 'created_at']
    ordering = ['-start_date']

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return StrategicPlanCreateUpdateSerializer
        return StrategicPlanSerializer

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=False, methods=['get'])
    def active(self, request):
        """Obtiene el plan estratégico activo"""
        plan = StrategicPlan.get_active()
        if plan:
            serializer = StrategicPlanSerializer(plan)
            return Response(serializer.data)
        return Response(
            {'detail': 'No hay plan estratégico activo'},
            status=status.HTTP_404_NOT_FOUND
        )

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Aprueba el plan estratégico"""
        plan = self.get_object()

        serializer = ApprovePlanSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        if plan.approved_by:
            return Response(
                {'detail': 'El plan ya está aprobado'},
                status=status.HTTP_400_BAD_REQUEST
            )

        plan.approved_by = request.user
        plan.approved_at = timezone.now()
        plan.save(update_fields=['approved_by', 'approved_at'])

        return Response({
            'detail': 'Plan aprobado exitosamente',
            'approved_by': request.user.get_full_name(),
            'approved_at': plan.approved_at
        })

    @action(detail=True, methods=['get'])
    def dashboard(self, request, pk=None):
        """Retorna estadísticas del plan para dashboard"""
        plan = self.get_object()
        objectives = plan.objectives.filter(is_active=True)

        # Estadísticas por perspectiva BSC
        by_perspective = {}
        for perspective, label in StrategicObjective.BSC_PERSPECTIVE_CHOICES:
            objs = objectives.filter(bsc_perspective=perspective)
            by_perspective[perspective] = {
                'label': label,
                'total': objs.count(),
                'completed': objs.filter(status='COMPLETADO').count(),
                'in_progress': objs.filter(status='EN_PROGRESO').count(),
                'pending': objs.filter(status='PENDIENTE').count(),
                'delayed': objs.filter(status='RETRASADO').count(),
            }

        # Estadísticas por norma ISO
        by_iso = {}
        for iso, label in StrategicObjective.ISO_STANDARD_CHOICES:
            count = objectives.filter(iso_standards__contains=[iso]).count()
            if count > 0:
                by_iso[iso] = {'label': label, 'count': count}

        return Response({
            'plan_id': plan.id,
            'plan_name': plan.name,
            'progress': plan.progress,
            'total_objectives': objectives.count(),
            'completed': objectives.filter(status='COMPLETADO').count(),
            'in_progress': objectives.filter(status='EN_PROGRESO').count(),
            'pending': objectives.filter(status='PENDIENTE').count(),
            'delayed': objectives.filter(status='RETRASADO').count(),
            'by_perspective': by_perspective,
            'by_iso_standard': by_iso,
        })


class StrategicObjectiveViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar Objetivos Estratégicos.

    Endpoints:
    - GET /objetivos/ - Lista de objetivos
    - POST /objetivos/ - Crear nuevo objetivo
    - GET /objetivos/{id}/ - Detalle del objetivo
    - PUT/PATCH /objetivos/{id}/ - Actualizar objetivo
    - DELETE /objetivos/{id}/ - Eliminar objetivo
    - POST /objetivos/{id}/update_progress/ - Actualizar progreso
    - GET /objetivos/by_perspective/ - Objetivos por perspectiva BSC
    """

    queryset = StrategicObjective.objects.select_related(
        'plan', 'responsible', 'responsible_cargo', 'created_by'
    ).all()
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['plan', 'bsc_perspective', 'status', 'is_active']
    search_fields = ['code', 'name', 'description']
    ordering_fields = ['code', 'order', 'due_date', 'progress']
    ordering = ['bsc_perspective', 'order', 'code']

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return StrategicObjectiveCreateUpdateSerializer
        return StrategicObjectiveSerializer

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=['post'])
    def update_progress(self, request, pk=None):
        """Actualiza el progreso del objetivo"""
        objective = self.get_object()

        serializer = UpdateProgressSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        objective.current_value = serializer.validated_data['current_value']
        objective.update_progress()

        return Response({
            'detail': 'Progreso actualizado',
            'current_value': str(objective.current_value),
            'progress': objective.progress,
            'status': objective.status
        })

    @action(detail=False, methods=['get'])
    def by_perspective(self, request):
        """Retorna objetivos agrupados por perspectiva BSC"""
        plan_id = request.query_params.get('plan')

        queryset = self.get_queryset().filter(is_active=True)
        if plan_id:
            queryset = queryset.filter(plan_id=plan_id)

        result = {}
        for perspective, label in StrategicObjective.BSC_PERSPECTIVE_CHOICES:
            objectives = queryset.filter(bsc_perspective=perspective)
            serializer = StrategicObjectiveSerializer(objectives, many=True)
            result[perspective] = {
                'label': label,
                'objectives': serializer.data
            }

        return Response(result)

    @action(detail=False, methods=['post'])
    def reorder(self, request):
        """Reordena los objetivos estratégicos"""
        order_data = request.data.get('order', [])

        if not order_data:
            return Response(
                {'detail': 'Se requiere lista de ordenamiento'},
                status=status.HTTP_400_BAD_REQUEST
            )

        for item in order_data:
            obj_id = item.get('id')
            new_order = item.get('order')
            if obj_id and new_order is not None:
                StrategicObjective.objects.filter(id=obj_id).update(order=new_order)

        return Response({'detail': 'Objetivos reordenados exitosamente'})
