"""
Views para matriz_legal - motor_cumplimiento

Endpoints:
- /tipos-norma/ - CRUD de tipos de norma
- /normas/ - CRUD de normas legales
- /empresa-normas/ - Relación empresa-norma con cumplimiento
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.utils import timezone

from apps.core.mixins import StandardViewSetMixin
from .models import TipoNorma, NormaLegal, EmpresaNorma
from .serializers import (
    TipoNormaSerializer,
    NormaLegalSerializer,
    NormaLegalCreateUpdateSerializer,
    NormaLegalListSerializer,
    EmpresaNormaSerializer,
    EmpresaNormaCreateUpdateSerializer,
    EvaluarCumplimientoSerializer
)


class TipoNormaViewSet(StandardViewSetMixin, viewsets.ModelViewSet):
    """
    ViewSet para gestionar Tipos de Norma.

    Endpoints:
    - GET /tipos-norma/ - Lista de tipos
    - POST /tipos-norma/ - Crear tipo
    - GET /tipos-norma/{id}/ - Detalle
    - PUT/PATCH /tipos-norma/{id}/ - Actualizar
    - DELETE /tipos-norma/{id}/ - Eliminar
    """

    queryset = TipoNorma.objects.all()
    serializer_class = TipoNormaSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ['is_active']
    search_fields = ['codigo', 'nombre']


class NormaLegalViewSet(StandardViewSetMixin, viewsets.ModelViewSet):
    """
    ViewSet para gestionar Normas Legales.

    Endpoints:
    - GET /normas/ - Lista de normas
    - POST /normas/ - Crear norma
    - GET /normas/{id}/ - Detalle
    - PUT/PATCH /normas/{id}/ - Actualizar
    - DELETE /normas/{id}/ - Eliminar
    - POST /normas/{id}/toggle-active/ - Activar/desactivar (StandardViewSetMixin)
    - POST /normas/bulk-activate/ - Activar múltiples (StandardViewSetMixin)
    - POST /normas/bulk-deactivate/ - Desactivar múltiples (StandardViewSetMixin)
    - GET /normas/by_sistema/ - Filtrar por sistema (sst/ambiental/calidad/pesv)
    - GET /normas/vigentes/ - Solo normas vigentes
    """

    queryset = NormaLegal.objects.select_related('tipo_norma').all()
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = [
        'tipo_norma', 'anio', 'vigente', 'is_active',
        'aplica_sst', 'aplica_ambiental', 'aplica_calidad', 'aplica_pesv'
    ]
    search_fields = ['numero', 'titulo', 'entidad_emisora', 'resumen']
    ordering_fields = ['fecha_expedicion', 'anio', 'numero']
    ordering = ['-fecha_expedicion']

    def get_serializer_class(self):
        if self.action == 'list':
            return NormaLegalListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return NormaLegalCreateUpdateSerializer
        return NormaLegalSerializer

    @action(detail=False, methods=['get'], url_path='by-sistema')
    def by_sistema(self, request):
        """Filtra normas por sistema de gestión"""
        sistema = request.query_params.get('sistema', '').lower()
        if sistema not in ['sst', 'ambiental', 'calidad', 'pesv']:
            return Response(
                {'detail': 'Sistema debe ser: sst, ambiental, calidad o pesv'},
                status=status.HTTP_400_BAD_REQUEST
            )

        queryset = NormaLegal.get_by_sistema(sistema)
        serializer = NormaLegalListSerializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def vigentes(self, request):
        """Retorna solo normas vigentes"""
        queryset = self.get_queryset().filter(vigente=True)
        serializer = NormaLegalListSerializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def estadisticas(self, request):
        """Retorna estadísticas de normas legales"""
        total = self.get_queryset().count()
        vigentes = self.get_queryset().filter(vigente=True).count()

        return Response({
            'total': total,
            'vigentes': vigentes,
            'no_vigentes': total - vigentes,
            'por_sistema': {
                'sst': self.get_queryset().filter(aplica_sst=True, vigente=True).count(),
                'ambiental': self.get_queryset().filter(aplica_ambiental=True, vigente=True).count(),
                'calidad': self.get_queryset().filter(aplica_calidad=True, vigente=True).count(),
                'pesv': self.get_queryset().filter(aplica_pesv=True, vigente=True).count(),
            }
        })


class EmpresaNormaViewSet(StandardViewSetMixin, viewsets.ModelViewSet):
    """
    ViewSet para gestionar relación Empresa-Norma.

    Endpoints:
    - GET /empresa-normas/ - Lista de normas por empresa
    - POST /empresa-normas/ - Asignar norma a empresa
    - GET /empresa-normas/{id}/ - Detalle
    - PUT/PATCH /empresa-normas/{id}/ - Actualizar
    - DELETE /empresa-normas/{id}/ - Eliminar
    - POST /empresa-normas/{id}/toggle-active/ - Activar/desactivar (StandardViewSetMixin)
    - POST /empresa-normas/bulk-activate/ - Activar múltiples (StandardViewSetMixin)
    - POST /empresa-normas/bulk-deactivate/ - Desactivar múltiples (StandardViewSetMixin)
    - POST /empresa-normas/{id}/evaluar/ - Evaluar cumplimiento
    - GET /empresa-normas/matriz/ - Matriz de cumplimiento
    """

    queryset = EmpresaNorma.objects.select_related(
        'norma', 'norma__tipo_norma', 'responsable', 'created_by'
    ).all()
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = [
        'empresa_id', 'aplica', 'porcentaje_cumplimiento', 'is_active',
        'norma__aplica_sst', 'norma__aplica_ambiental',
        'norma__aplica_calidad', 'norma__aplica_pesv'
    ]
    search_fields = ['norma__numero', 'norma__titulo', 'observaciones']
    ordering_fields = ['fecha_evaluacion', 'porcentaje_cumplimiento']
    ordering = ['-fecha_evaluacion']

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return EmpresaNormaCreateUpdateSerializer
        return EmpresaNormaSerializer

    @action(detail=True, methods=['post'])
    def evaluar(self, request, pk=None):
        """Evalúa el cumplimiento de una norma"""
        empresa_norma = self.get_object()

        serializer = EvaluarCumplimientoSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        empresa_norma.porcentaje_cumplimiento = serializer.validated_data['porcentaje_cumplimiento']
        empresa_norma.observaciones = serializer.validated_data.get('observaciones', '')
        empresa_norma.fecha_evaluacion = timezone.now().date()
        empresa_norma.save(update_fields=[
            'porcentaje_cumplimiento', 'observaciones', 'fecha_evaluacion'
        ])

        return Response({
            'detail': 'Cumplimiento evaluado exitosamente',
            'porcentaje': empresa_norma.porcentaje_cumplimiento,
            'estado': empresa_norma.estado_cumplimiento,
            'fecha_evaluacion': empresa_norma.fecha_evaluacion
        })

    @action(detail=False, methods=['get'])
    def matriz(self, request):
        """Retorna matriz de cumplimiento para empresa"""
        empresa_id = request.query_params.get('empresa')
        if not empresa_id:
            return Response(
                {'detail': 'Se requiere parámetro empresa'},
                status=status.HTTP_400_BAD_REQUEST
            )

        queryset = self.get_queryset().filter(empresa_id=empresa_id, aplica=True)

        # Estadísticas de cumplimiento
        total = queryset.count()
        cumple = queryset.filter(porcentaje_cumplimiento=100).count()
        alto = queryset.filter(porcentaje_cumplimiento=75).count()
        medio = queryset.filter(porcentaje_cumplimiento=50).count()
        bajo = queryset.filter(porcentaje_cumplimiento=25).count()
        no_evaluado = queryset.filter(porcentaje_cumplimiento=0).count()

        # Calcular porcentaje general
        if total > 0:
            suma = sum([en.porcentaje_cumplimiento for en in queryset])
            porcentaje_general = round(suma / total, 1)
        else:
            porcentaje_general = 0

        serializer = EmpresaNormaSerializer(queryset, many=True)

        return Response({
            'empresa_id': empresa_id,
            'total_normas': total,
            'porcentaje_cumplimiento_general': porcentaje_general,
            'resumen': {
                'cumple_100': cumple,
                'alto_75': alto,
                'medio_50': medio,
                'bajo_25': bajo,
                'no_evaluado': no_evaluado,
            },
            'normas': serializer.data
        })

    @action(detail=False, methods=['get'], url_path='pendientes-evaluacion')
    def pendientes_evaluacion(self, request):
        """Retorna normas pendientes de evaluación"""
        empresa_id = request.query_params.get('empresa')
        queryset = self.get_queryset().filter(
            aplica=True,
            porcentaje_cumplimiento=0
        )
        if empresa_id:
            queryset = queryset.filter(empresa_id=empresa_id)

        serializer = EmpresaNormaSerializer(queryset, many=True)
        return Response(serializer.data)
