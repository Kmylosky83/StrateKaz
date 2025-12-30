"""
Views para informes_contables - accounting
Sistema de Gestión Grasas y Huesos del Norte
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from .models import InformeContable, LineaInforme, GeneracionInforme
from .serializers import (
    InformeContableListSerializer, InformeContableSerializer,
    LineaInformeSerializer, GeneracionInformeListSerializer, GeneracionInformeSerializer
)


class InformeContableViewSet(viewsets.ModelViewSet):
    """ViewSet para gestión de Informes Contables."""
    queryset = InformeContable.objects.select_related('empresa').prefetch_related('lineas').filter(is_active=True)
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['empresa', 'tipo_informe', 'nivel_detalle']
    search_fields = ['codigo', 'nombre', 'descripcion']
    ordering_fields = ['codigo', 'nombre', 'tipo_informe', 'created_at']
    ordering = ['codigo']

    def get_serializer_class(self):
        if self.action == 'list':
            return InformeContableListSerializer
        return InformeContableSerializer

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)

    @action(detail=True, methods=['get'])
    def lineas(self, request, pk=None):
        informe = self.get_object()
        lineas = informe.lineas.order_by('secuencia')
        serializer = LineaInformeSerializer(lineas, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def duplicar(self, request, pk=None):
        informe_original = self.get_object()
        nuevo_codigo = request.data.get('codigo')
        nuevo_nombre = request.data.get('nombre')
        if not nuevo_codigo or not nuevo_nombre:
            return Response({'error': 'Debe especificar codigo y nombre para el nuevo informe'}, status=status.HTTP_400_BAD_REQUEST)
        nuevo_informe = InformeContable.objects.create(
            empresa=informe_original.empresa,
            codigo=nuevo_codigo,
            nombre=nuevo_nombre,
            tipo_informe=informe_original.tipo_informe,
            nivel_detalle=informe_original.nivel_detalle,
            incluye_saldo_cero=informe_original.incluye_saldo_cero,
            descripcion=informe_original.descripcion,
            created_by=request.user
        )
        for linea in informe_original.lineas.all():
            LineaInforme.objects.create(
                informe=nuevo_informe,
                secuencia=linea.secuencia,
                codigo_linea=linea.codigo_linea,
                descripcion=linea.descripcion,
                tipo_linea=linea.tipo_linea,
                cuenta_desde=linea.cuenta_desde,
                cuenta_hasta=linea.cuenta_hasta,
                formula=linea.formula,
                nivel_indentacion=linea.nivel_indentacion,
                negrita=linea.negrita
            )
        return Response({'status': 'duplicado', 'nuevo_informe_id': nuevo_informe.id, 'codigo': nuevo_informe.codigo})


class LineaInformeViewSet(viewsets.ModelViewSet):
    """ViewSet para gestión de Líneas de Informes."""
    queryset = LineaInforme.objects.select_related('informe', 'cuenta_desde', 'cuenta_hasta')
    serializer_class = LineaInformeSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['informe', 'tipo_linea']
    search_fields = ['codigo_linea', 'descripcion']
    ordering_fields = ['secuencia', 'codigo_linea']
    ordering = ['informe', 'secuencia']


class GeneracionInformeViewSet(viewsets.ModelViewSet):
    """ViewSet para gestión de Generación de Informes."""
    queryset = GeneracionInforme.objects.select_related('empresa', 'informe', 'centro_costo').filter(is_active=True)
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['empresa', 'informe', 'estado', 'centro_costo']
    search_fields = ['informe__codigo', 'informe__nombre']
    ordering_fields = ['fecha_desde', 'fecha_hasta', 'created_at']
    ordering = ['-created_at']

    def get_serializer_class(self):
        if self.action == 'list':
            return GeneracionInformeListSerializer
        return GeneracionInformeSerializer

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user, estado='generando')

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)

    @action(detail=True, methods=['post'])
    def regenerar(self, request, pk=None):
        generacion = self.get_object()
        generacion.estado = 'generando'
        generacion.mensaje_error = ''
        generacion.resultado_json = {}
        generacion.save(update_fields=['estado', 'mensaje_error', 'resultado_json', 'updated_at'])
        return Response({'status': 'regenerando', 'generacion_id': generacion.id})

    @action(detail=False, methods=['get'])
    def historial(self, request):
        informe_id = request.query_params.get('informe')
        if not informe_id:
            return Response({'error': 'Debe especificar el parámetro informe'}, status=status.HTTP_400_BAD_REQUEST)
        queryset = self.get_queryset().filter(informe_id=informe_id).order_by('-created_at')[:10]
        serializer = GeneracionInformeListSerializer(queryset, many=True)
        return Response(serializer.data)
