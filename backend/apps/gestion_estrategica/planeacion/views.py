"""
Views del módulo Planeación Estratégica - Dirección Estratégica

ViewSets para:
- StrategicPlan: Plan estratégico
- StrategicObjective: Objetivos estratégicos
- MapaEstrategico: Mapa estratégico con perspectivas BSC
- CausaEfecto: Relaciones causa-efecto
- KPIObjetivo: Indicadores clave
- MedicionKPI: Mediciones de KPI
- GestionCambio: Gestión de cambios
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.utils import timezone

from apps.core.mixins import StandardViewSetMixin, OrderingMixin
from .models import (
    StrategicPlan, StrategicObjective, MapaEstrategico,
    CausaEfecto, KPIObjetivo, MedicionKPI, GestionCambio
)
from .serializers import (
    StrategicPlanSerializer,
    StrategicPlanCreateUpdateSerializer,
    StrategicObjectiveSerializer,
    StrategicObjectiveCreateUpdateSerializer,
    ApprovePlanSerializer,
    UpdateProgressSerializer,
    MapaEstrategicoSerializer,
    MapaEstrategicoCreateUpdateSerializer,
    UpdateCanvasSerializer,
    CausaEfectoSerializer,
    KPIObjetivoSerializer,
    KPIObjetivoCreateUpdateSerializer,
    AddMeasurementSerializer,
    MedicionKPISerializer,
    GestionCambioSerializer,
    GestionCambioCreateUpdateSerializer,
    TransitionStatusSerializer,
)


class StrategicPlanViewSet(StandardViewSetMixin, viewsets.ModelViewSet):
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
    - POST /planes/{id}/toggle-active/ - Toggle estado activo
    """

    queryset = StrategicPlan.objects.prefetch_related('objectives', 'mapas').all()
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['is_active', 'period_type', 'status']
    search_fields = ['name', 'description']
    ordering_fields = ['start_date', 'end_date', 'created_at', 'status']
    ordering = ['-start_date']

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return StrategicPlanCreateUpdateSerializer
        return StrategicPlanSerializer

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

        # Estadísticas por norma ISO (usando M2M normas_iso)
        from apps.gestion_estrategica.configuracion.models import NormaISO
        by_iso = {}
        for norma in NormaISO.objects.filter(is_active=True):
            count = objectives.filter(normas_iso=norma).count()
            if count > 0:
                by_iso[norma.code] = {'label': f'{norma.code} - {norma.name}', 'count': count}

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

    @action(detail=False, methods=['get'], url_path='period-types')
    def period_types(self, request):
        """Retorna los tipos de período disponibles para planes estratégicos"""
        choices = [
            {'value': code, 'label': label}
            for code, label in StrategicPlan.PERIOD_CHOICES
        ]
        return Response(choices)

    @action(detail=False, methods=['get'], url_path='bsc-perspectives')
    def bsc_perspectives(self, request):
        """
        Retorna las perspectivas BSC disponibles para objetivos estratégicos.

        GET /planes/bsc-perspectives/

        Returns:
            Lista de perspectivas con value y label
        """
        choices = [
            {'value': code, 'label': label}
            for code, label in StrategicObjective.BSC_PERSPECTIVE_CHOICES
        ]
        return Response(choices)


class StrategicObjectiveViewSet(StandardViewSetMixin, OrderingMixin, viewsets.ModelViewSet):
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
    - POST /objetivos/{id}/toggle-active/ - Toggle estado activo
    - POST /objetivos/reorder/ - Reordenar objetivos
    """

    queryset = StrategicObjective.objects.select_related(
        'plan', 'responsible', 'responsible_cargo', 'created_by'
    ).prefetch_related('kpis').all()
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['plan', 'bsc_perspective', 'status', 'is_active']
    search_fields = ['code', 'name', 'description']
    ordering_fields = ['code', 'orden', 'due_date', 'progress', 'bsc_perspective']
    ordering = ['bsc_perspective', 'orden', 'code']

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return StrategicObjectiveCreateUpdateSerializer
        return StrategicObjectiveSerializer

    @action(detail=False, methods=['get'], url_path='normas-iso-choices')
    def normas_iso_choices(self, request):
        """
        Retorna las normas ISO activas para vincular a objetivos.

        GET /objetivos/normas-iso-choices/

        Returns:
            Lista de normas ISO activas con sus datos para el selector
        """
        from apps.gestion_estrategica.configuracion.models import NormaISO

        normas = NormaISO.objects.filter(
            is_active=True,
            deleted_at__isnull=True
        ).order_by('orden', 'name')

        return Response([
            {
                'id': n.id,
                'code': n.code,
                'name': n.name,
                'short_name': n.short_name,
                'icon': n.icon,
                'color': n.color,
                'category': n.category,
                # Para compatibilidad con el formato anterior
                'value': n.id,
                'label': f"{n.code} - {n.short_name or n.name}",
            }
            for n in normas
        ])

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

    @action(detail=True, methods=['get'])
    def kpis(self, request, pk=None):
        """Obtiene los KPIs del objetivo"""
        objective = self.get_object()
        kpis = objective.kpis.filter(is_active=True)
        serializer = KPIObjetivoSerializer(kpis, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def statuses(self, request):
        """
        Retorna los estados disponibles para objetivos estratégicos.

        GET /objetivos/statuses/

        Returns:
            Lista de estados con value y label
        """
        choices = [
            {'value': code, 'label': label}
            for code, label in StrategicObjective.STATUS_CHOICES
        ]
        return Response(choices)


# =============================================================================
# NUEVOS VIEWSETS - Semana 4
# =============================================================================

class MapaEstrategicoViewSet(StandardViewSetMixin, viewsets.ModelViewSet):
    """
    ViewSet para gestionar Mapas Estratégicos.

    Endpoints:
    - GET /mapas/ - Lista de mapas
    - POST /mapas/ - Crear nuevo mapa
    - GET /mapas/{id}/ - Detalle del mapa
    - PUT/PATCH /mapas/{id}/ - Actualizar mapa
    - DELETE /mapas/{id}/ - Eliminar mapa
    - GET /mapas/{id}/canvas/ - Obtener datos del canvas
    - POST /mapas/{id}/update-canvas/ - Actualizar canvas
    - GET /mapas/{id}/objectives-by-perspective/ - Objetivos organizados
    """

    queryset = MapaEstrategico.objects.select_related(
        'plan', 'created_by'
    ).prefetch_related('relaciones').all()
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['plan', 'is_active']
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'version', 'created_at']
    ordering = ['-created_at']

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return MapaEstrategicoCreateUpdateSerializer
        return MapaEstrategicoSerializer

    @action(detail=True, methods=['get'])
    def canvas(self, request, pk=None):
        """Obtiene los datos del canvas"""
        mapa = self.get_object()
        return Response({
            'canvas_data': mapa.canvas_data,
            'version': mapa.version
        })

    @action(detail=True, methods=['post'], url_path='update-canvas')
    def update_canvas(self, request, pk=None):
        """Actualiza los datos del canvas"""
        mapa = self.get_object()

        serializer = UpdateCanvasSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        mapa.canvas_data = serializer.validated_data['canvas_data']
        mapa.save(update_fields=['canvas_data', 'updated_at'])

        return Response({
            'detail': 'Canvas actualizado exitosamente',
            'canvas_data': mapa.canvas_data
        })

    @action(detail=True, methods=['get'], url_path='objectives-by-perspective')
    def objectives_by_perspective(self, request, pk=None):
        """Obtiene objetivos del plan organizados por perspectiva BSC"""
        mapa = self.get_object()
        objectives = StrategicObjective.objects.filter(
            plan=mapa.plan,
            is_active=True
        )

        result = {}
        for perspective, label in StrategicObjective.BSC_PERSPECTIVE_CHOICES:
            objs = objectives.filter(bsc_perspective=perspective)
            result[perspective] = {
                'label': label,
                'objectives': [
                    {
                        'id': o.id,
                        'code': o.code,
                        'name': o.name,
                        'progress': o.progress,
                        'status': o.status
                    }
                    for o in objs
                ]
            }

        return Response(result)

    @action(detail=False, methods=['get'])
    def visualizacion(self, request):
        """
        Endpoint para el canvas interactivo del Mapa Estratégico.

        GET /mapas/visualizacion/?plan={plan_id}

        Retorna todos los datos necesarios para React Flow:
        - mapa: Datos del mapa (o null si no existe)
        - objetivos: Lista de objetivos con datos completos para los nodos
        - relaciones: Lista de relaciones causa-efecto para las conexiones
        - stats: Estadísticas del mapa

        Si no existe mapa para el plan, se crea uno automáticamente.
        """
        plan_id = request.query_params.get('plan')
        if not plan_id:
            return Response(
                {'detail': 'Se requiere el parámetro plan'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            plan = StrategicPlan.objects.get(pk=plan_id)
        except StrategicPlan.DoesNotExist:
            return Response(
                {'detail': 'Plan no encontrado'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Obtener o crear el mapa para el plan
        mapa, created = MapaEstrategico.objects.get_or_create(
            plan=plan,
            defaults={
                'name': f'Mapa Estratégico - {plan.name}',
                'description': f'Mapa estratégico del plan {plan.name}',
                'created_by': request.user,
                'canvas_data': {'nodes': {}, 'viewport': {'x': 0, 'y': 0, 'zoom': 1}},
            }
        )

        # Obtener objetivos con normas ISO
        objectives = StrategicObjective.objects.filter(
            plan=plan,
            is_active=True
        ).select_related(
            'responsible', 'responsible_cargo'
        ).prefetch_related('normas_iso').order_by('bsc_perspective', 'orden', 'code')

        # Construir lista de objetivos para el canvas
        objetivos_data = []
        for obj in objectives:
            normas_detail = [
                {
                    'id': n.id,
                    'code': n.code,
                    'short_name': n.short_name or n.name,
                    'icon': n.icon,
                    'color': n.color,
                }
                for n in obj.normas_iso.filter(is_active=True)
            ]

            objetivos_data.append({
                'id': obj.id,
                'code': obj.code,
                'name': obj.name,
                'description': obj.description,
                'bsc_perspective': obj.bsc_perspective,
                'progress': obj.progress,
                'status': obj.status,
                'target_value': float(obj.target_value) if obj.target_value else None,
                'current_value': float(obj.current_value) if obj.current_value else None,
                'unit': obj.unit,
                'normas_iso_detail': normas_detail,
                'responsible_name': obj.responsible.get_full_name() if obj.responsible else None,
                'due_date': obj.due_date.isoformat() if obj.due_date else None,
            })

        # Obtener relaciones causa-efecto
        relaciones = CausaEfecto.objects.filter(mapa=mapa).select_related(
            'source_objective', 'target_objective'
        )

        relaciones_data = [
            {
                'id': r.id,
                'mapa': r.mapa_id,
                'source_objective': r.source_objective_id,
                'source_objective_code': r.source_objective.code,
                'source_objective_name': r.source_objective.name,
                'target_objective': r.target_objective_id,
                'target_objective_code': r.target_objective.code,
                'target_objective_name': r.target_objective.name,
                'description': r.description,
                'weight': r.weight,
            }
            for r in relaciones
        ]

        # Calcular estadísticas
        objectives_by_perspective = {}
        for perspective, _ in StrategicObjective.BSC_PERSPECTIVE_CHOICES:
            count = sum(1 for o in objetivos_data if o['bsc_perspective'] == perspective)
            objectives_by_perspective[perspective] = count

        avg_progress = sum(o['progress'] for o in objetivos_data) / len(objetivos_data) if objetivos_data else 0

        # Serializar mapa
        mapa_data = MapaEstrategicoSerializer(mapa).data

        return Response({
            'mapa': mapa_data,
            'objetivos': objetivos_data,
            'relaciones': relaciones_data,
            'stats': {
                'total_objetivos': len(objetivos_data),
                'objetivos_por_perspectiva': objectives_by_perspective,
                'total_relaciones': len(relaciones_data),
                'progreso_promedio': round(avg_progress, 1),
            }
        })


class CausaEfectoViewSet(StandardViewSetMixin, viewsets.ModelViewSet):
    """ViewSet para gestionar Relaciones Causa-Efecto"""

    queryset = CausaEfecto.objects.select_related(
        'mapa', 'source_objective', 'target_objective'
    ).all()
    serializer_class = CausaEfectoSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['mapa', 'source_objective', 'target_objective']


class KPIObjetivoViewSet(StandardViewSetMixin, viewsets.ModelViewSet):
    """
    ViewSet para gestionar KPIs de Objetivos.

    Endpoints:
    - GET /kpis/ - Lista de KPIs
    - POST /kpis/ - Crear nuevo KPI
    - GET /kpis/{id}/ - Detalle del KPI
    - PUT/PATCH /kpis/{id}/ - Actualizar KPI
    - DELETE /kpis/{id}/ - Eliminar KPI
    - POST /kpis/{id}/add-measurement/ - Agregar medición
    - GET /kpis/{id}/trend/ - Obtener tendencia
    - GET /kpis/semaforo/ - Semáforo de todos los KPIs
    """

    queryset = KPIObjetivo.objects.select_related(
        'objective', 'responsible', 'responsible_cargo', 'created_by'
    ).prefetch_related('measurements').all()
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['objective', 'frequency', 'is_active']
    search_fields = ['name', 'description', 'formula']
    ordering_fields = ['name', 'frequency', 'last_measurement_date', 'created_at']
    ordering = ['objective', 'name']

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return KPIObjetivoCreateUpdateSerializer
        return KPIObjetivoSerializer

    @action(detail=True, methods=['post'], url_path='add-measurement')
    def add_measurement(self, request, pk=None):
        """Agrega una medición al KPI"""
        kpi = self.get_object()

        serializer = AddMeasurementSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        measurement = kpi.add_measurement(
            value=serializer.validated_data['value'],
            measured_by=request.user,
            period=serializer.validated_data.get('period'),
            notes=serializer.validated_data.get('notes'),
            evidence=serializer.validated_data.get('evidence_file')
        )

        return Response({
            'detail': 'Medición agregada exitosamente',
            'measurement': MedicionKPISerializer(measurement).data,
            'kpi_status': kpi.status_semaforo
        })

    @action(detail=True, methods=['get'])
    def trend(self, request, pk=None):
        """Obtiene la tendencia histórica del KPI"""
        kpi = self.get_object()
        limit = int(request.query_params.get('limit', 12))

        measurements = kpi.measurements.order_by('-period')[:limit]

        return Response({
            'kpi_id': kpi.id,
            'kpi_name': kpi.name,
            'target_value': str(kpi.target_value),
            'current_status': kpi.status_semaforo,
            'measurements': [
                {
                    'period': m.period,
                    'value': str(m.value)
                }
                for m in reversed(list(measurements))
            ]
        })

    @action(detail=False, methods=['get'])
    def semaforo(self, request):
        """Retorna el semáforo de todos los KPIs"""
        queryset = self.filter_queryset(self.get_queryset()).filter(is_active=True)

        result = {
            'VERDE': [],
            'AMARILLO': [],
            'ROJO': [],
            'SIN_DATOS': []
        }

        for kpi in queryset:
            status = kpi.status_semaforo
            result[status].append({
                'id': kpi.id,
                'name': kpi.name,
                'objective_code': kpi.objective.code,
                'last_value': str(kpi.last_value) if kpi.last_value else None,
                'target_value': str(kpi.target_value)
            })

        return Response({
            'total': queryset.count(),
            'verde': len(result['VERDE']),
            'amarillo': len(result['AMARILLO']),
            'rojo': len(result['ROJO']),
            'sin_datos': len(result['SIN_DATOS']),
            'details': result
        })


class MedicionKPIViewSet(StandardViewSetMixin, viewsets.ModelViewSet):
    """ViewSet para gestionar Mediciones de KPI"""

    queryset = MedicionKPI.objects.select_related('kpi', 'measured_by').all()
    serializer_class = MedicionKPISerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['kpi', 'period']
    ordering_fields = ['period', 'created_at']
    ordering = ['-period']


class GestionCambioViewSet(StandardViewSetMixin, viewsets.ModelViewSet):
    """
    ViewSet para gestionar Gestión de Cambios.

    Endpoints:
    - GET /cambios/ - Lista de cambios
    - POST /cambios/ - Crear nuevo cambio
    - GET /cambios/{id}/ - Detalle del cambio
    - PUT/PATCH /cambios/{id}/ - Actualizar cambio
    - DELETE /cambios/{id}/ - Eliminar cambio
    - POST /cambios/{id}/transition/ - Transicionar estado
    - GET /cambios/kanban/ - Vista kanban por estado
    - GET /cambios/stats/ - Estadísticas
    """

    queryset = GestionCambio.objects.select_related(
        'responsible', 'responsible_cargo', 'created_by'
    ).prefetch_related('related_objectives').all()
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['change_type', 'priority', 'status', 'is_active']
    search_fields = ['code', 'title', 'description']
    ordering_fields = ['code', 'priority', 'status', 'due_date', 'created_at']
    ordering = ['-priority', '-created_at']

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return GestionCambioCreateUpdateSerializer
        return GestionCambioSerializer

    @action(detail=True, methods=['post'])
    def transition(self, request, pk=None):
        """Transiciona el estado del cambio"""
        cambio = self.get_object()

        serializer = TransitionStatusSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            cambio.transition_status(
                serializer.validated_data['new_status'],
                user=request.user
            )
        except ValueError as e:
            return Response(
                {'detail': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

        return Response({
            'detail': 'Estado actualizado exitosamente',
            'status': cambio.status,
            'status_display': cambio.get_status_display()
        })

    @action(detail=False, methods=['get'])
    def kanban(self, request):
        """Retorna cambios organizados para vista kanban"""
        queryset = self.filter_queryset(self.get_queryset()).filter(is_active=True)

        result = {}
        for status_code, status_label in GestionCambio.STATUS_CHOICES:
            cambios = queryset.filter(status=status_code)
            result[status_code] = {
                'label': status_label,
                'count': cambios.count(),
                'items': GestionCambioSerializer(cambios, many=True).data
            }

        return Response(result)

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Estadísticas de gestión de cambios"""
        queryset = self.get_queryset().filter(is_active=True)

        return Response({
            'total': queryset.count(),
            'by_type': {
                code: queryset.filter(change_type=code).count()
                for code, _ in GestionCambio.CHANGE_TYPE_CHOICES
            },
            'by_priority': {
                code: queryset.filter(priority=code).count()
                for code, _ in GestionCambio.PRIORITY_CHOICES
            },
            'by_status': {
                code: queryset.filter(status=code).count()
                for code, _ in GestionCambio.STATUS_CHOICES
            },
            'overdue': queryset.filter(
                due_date__lt=timezone.now().date(),
                status__in=['IDENTIFICADO', 'ANALISIS', 'PLANIFICADO', 'EN_EJECUCION']
            ).count()
        })
