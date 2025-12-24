"""
Views para IPEVR - GTC-45
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Count, Q

from .models import ClasificacionPeligro, Peligro, MatrizIPEVR, ControlPropuesto
from .serializers import (
    ClasificacionPeligroSerializer,
    PeligroSerializer,
    MatrizIPEVRListSerializer,
    MatrizIPEVRDetailSerializer,
    ControlPropuestoSerializer
)


class ClasificacionPeligroViewSet(viewsets.ModelViewSet):
    """ViewSet para ClasificacionPeligro"""
    queryset = ClasificacionPeligro.objects.all()
    serializer_class = ClasificacionPeligroSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['tipo', 'is_active']
    search_fields = ['codigo', 'nombre', 'descripcion']
    ordering_fields = ['tipo', 'codigo', 'nombre']
    ordering = ['tipo', 'codigo']


class PeligroViewSet(viewsets.ModelViewSet):
    """ViewSet para Peligro"""
    queryset = Peligro.objects.select_related('clasificacion', 'created_by')
    serializer_class = PeligroSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['clasificacion', 'clasificacion__tipo']
    search_fields = ['codigo', 'descripcion', 'fuente', 'efectos']
    ordering_fields = ['codigo', 'created_at']
    ordering = ['clasificacion', 'codigo']

    def get_queryset(self):
        queryset = super().get_queryset()
        if hasattr(self.request.user, 'empresa_id'):
            queryset = queryset.filter(empresa_id=self.request.user.empresa_id)
        return queryset

    def perform_create(self, serializer):
        serializer.save(
            created_by=self.request.user,
            empresa_id=getattr(self.request.user, 'empresa_id', 1)
        )


class MatrizIPEVRViewSet(viewsets.ModelViewSet):
    """ViewSet para MatrizIPEVR con acciones personalizadas"""
    queryset = MatrizIPEVR.objects.select_related('peligro', 'peligro__clasificacion', 'created_by')
    permission_classes = [IsAuthenticated]
    filterset_fields = ['proceso', 'estado', 'aceptabilidad', 'interpretacion_nr', 'rutinaria']
    search_fields = ['codigo', 'proceso', 'zona_lugar', 'actividad', 'tarea']
    ordering_fields = ['nivel_riesgo', 'proceso', 'fecha_evaluacion', 'created_at']
    ordering = ['-nivel_riesgo']

    def get_serializer_class(self):
        if self.action == 'list':
            return MatrizIPEVRListSerializer
        return MatrizIPEVRDetailSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        if hasattr(self.request.user, 'empresa_id'):
            queryset = queryset.filter(empresa_id=self.request.user.empresa_id)
        return queryset

    def perform_create(self, serializer):
        serializer.save(
            created_by=self.request.user,
            empresa_id=getattr(self.request.user, 'empresa_id', 1)
        )

    @action(detail=False, methods=['get'])
    def resumen_riesgos(self, request):
        """Resumen de riesgos por nivel de interpretación"""
        empresa_id = getattr(request.user, 'empresa_id', 1)

        matrices = MatrizIPEVR.objects.filter(
            empresa_id=empresa_id,
            estado='VIGENTE'
        )

        resumen = {
            'I': matrices.filter(interpretacion_nr='I').count(),
            'II': matrices.filter(interpretacion_nr='II').count(),
            'III': matrices.filter(interpretacion_nr='III').count(),
            'IV': matrices.filter(interpretacion_nr='IV').count(),
            'total': matrices.count(),
            'total_expuestos': sum(m.num_expuestos for m in matrices),
        }

        return Response(resumen)

    @action(detail=False, methods=['get'])
    def por_proceso(self, request):
        """Estadísticas agrupadas por proceso"""
        empresa_id = getattr(request.user, 'empresa_id', 1)

        stats = MatrizIPEVR.objects.filter(
            empresa_id=empresa_id,
            estado='VIGENTE'
        ).values('proceso').annotate(
            total=Count('id'),
            criticos=Count('id', filter=Q(interpretacion_nr='I')),
            altos=Count('id', filter=Q(interpretacion_nr='II')),
            medios=Count('id', filter=Q(interpretacion_nr='III')),
            bajos=Count('id', filter=Q(interpretacion_nr='IV')),
        ).order_by('-criticos', '-altos')

        return Response(list(stats))

    @action(detail=False, methods=['get'])
    def por_tipo_peligro(self, request):
        """Estadísticas agrupadas por tipo de peligro"""
        empresa_id = getattr(request.user, 'empresa_id', 1)

        stats = MatrizIPEVR.objects.filter(
            empresa_id=empresa_id,
            estado='VIGENTE'
        ).values(
            'peligro__clasificacion__tipo',
            'peligro__clasificacion__nombre'
        ).annotate(
            total=Count('id'),
            criticos=Count('id', filter=Q(interpretacion_nr='I')),
            altos=Count('id', filter=Q(interpretacion_nr='II')),
        ).order_by('-criticos', '-total')

        return Response(list(stats))

    @action(detail=False, methods=['get'])
    def criticos(self, request):
        """Lista de riesgos críticos (Nivel I y II)"""
        empresa_id = getattr(request.user, 'empresa_id', 1)

        matrices = MatrizIPEVR.objects.filter(
            empresa_id=empresa_id,
            estado='VIGENTE',
            interpretacion_nr__in=['I', 'II']
        ).order_by('-nivel_riesgo')

        serializer = MatrizIPEVRListSerializer(matrices, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def cambiar_estado(self, request, pk=None):
        """Cambiar estado de la matriz"""
        matriz = self.get_object()
        nuevo_estado = request.data.get('estado')

        if nuevo_estado not in dict(MatrizIPEVR.ESTADO_CHOICES):
            return Response(
                {'error': 'Estado inválido'},
                status=status.HTTP_400_BAD_REQUEST
            )

        matriz.estado = nuevo_estado
        matriz.save()

        serializer = self.get_serializer(matriz)
        return Response(serializer.data)


class ControlPropuestoViewSet(viewsets.ModelViewSet):
    """ViewSet para ControlPropuesto"""
    queryset = ControlPropuesto.objects.select_related('matriz', 'responsable')
    serializer_class = ControlPropuestoSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['matriz', 'tipo_control', 'estado', 'responsable']
    search_fields = ['descripcion']
    ordering_fields = ['tipo_control', 'fecha_implementacion', 'created_at']
    ordering = ['tipo_control', 'fecha_implementacion']

    def get_queryset(self):
        queryset = super().get_queryset()
        if hasattr(self.request.user, 'empresa_id'):
            queryset = queryset.filter(empresa_id=self.request.user.empresa_id)
        return queryset

    def perform_create(self, serializer):
        serializer.save(
            empresa_id=getattr(self.request.user, 'empresa_id', 1)
        )

    @action(detail=False, methods=['get'])
    def pendientes(self, request):
        """Controles pendientes de implementación"""
        empresa_id = getattr(request.user, 'empresa_id', 1)

        controles = ControlPropuesto.objects.filter(
            empresa_id=empresa_id,
            estado__in=['PROPUESTO', 'EN_IMPLEMENTACION']
        ).order_by('fecha_implementacion')

        serializer = self.get_serializer(controles, many=True)
        return Response(serializer.data)
