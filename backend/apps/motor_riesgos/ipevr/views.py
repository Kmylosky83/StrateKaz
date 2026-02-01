"""
Views para IPEVR - Identificacion de Peligros, Evaluacion y Valoracion de Riesgos
==================================================================================

ViewSets para la gestion de la matriz IPEVR segun GTC-45.
Incluye acciones especiales para resumen, estadisticas y filtrado por criterios.

Autor: Sistema ERP StrateKaz
Fecha: 26 Diciembre 2025
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.db.models import Count, Q, Sum

from apps.core.mixins import StandardViewSetMixin
from .models import ClasificacionPeligro, PeligroGTC45, MatrizIPEVR, ControlSST
from .serializers import (
    ClasificacionPeligroSerializer,
    PeligroGTC45Serializer,
    MatrizIPEVRListSerializer,
    MatrizIPEVRDetailSerializer,
    ControlSSTSerializer
)


class ClasificacionPeligroViewSet(StandardViewSetMixin, viewsets.ModelViewSet):
    """
    ViewSet para Clasificaciones de Peligros GTC-45.

    Catalogo global de las 7 categorias de peligros ocupacionales.
    Incluye funcionalidad del StandardViewSetMixin.
    """
    queryset = ClasificacionPeligro.objects.all()
    serializer_class = ClasificacionPeligroSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['categoria', 'is_active']
    search_fields = ['codigo', 'nombre', 'descripcion']
    ordering_fields = ['orden', 'categoria', 'codigo']
    ordering = ['orden', 'categoria']

    @action(detail=False, methods=['get'])
    def por_categoria(self, request):
        """Retorna clasificaciones agrupadas por categoria."""
        clasificaciones = self.get_queryset().filter(is_active=True)
        resultado = {}
        for cat in ClasificacionPeligro.Categoria.choices:
            cat_code = cat[0]
            cat_name = cat[1]
            items = clasificaciones.filter(categoria=cat_code)
            resultado[cat_code] = {
                'nombre': cat_name,
                'items': ClasificacionPeligroSerializer(items, many=True).data
            }
        return Response(resultado)


class PeligroGTC45ViewSet(StandardViewSetMixin, viewsets.ModelViewSet):
    """
    ViewSet para Peligros GTC-45.

    Catalogo de 78 peligros segun la guia tecnica colombiana.
    Incluye funcionalidad del StandardViewSetMixin.
    """
    queryset = PeligroGTC45.objects.select_related('clasificacion').all()
    serializer_class = PeligroGTC45Serializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['clasificacion', 'clasificacion__categoria', 'is_active']
    search_fields = ['codigo', 'nombre', 'descripcion', 'efectos_posibles']
    ordering_fields = ['orden', 'codigo', 'nombre']
    ordering = ['clasificacion', 'orden']

    @action(detail=False, methods=['get'])
    def por_clasificacion(self, request):
        """Retorna peligros agrupados por clasificacion."""
        clasificacion_id = request.query_params.get('clasificacion_id')
        peligros = self.get_queryset().filter(is_active=True)

        if clasificacion_id:
            peligros = peligros.filter(clasificacion_id=clasificacion_id)

        resultado = {}
        for clasificacion in ClasificacionPeligro.objects.filter(is_active=True):
            items = peligros.filter(clasificacion=clasificacion)
            if items.exists():
                resultado[clasificacion.codigo] = {
                    'nombre': clasificacion.nombre,
                    'categoria': clasificacion.categoria,
                    'color': clasificacion.color,
                    'peligros': PeligroGTC45Serializer(items, many=True).data
                }
        return Response(resultado)


class MatrizIPEVRViewSet(StandardViewSetMixin, viewsets.ModelViewSet):
    """
    ViewSet para Matriz IPEVR.

    Gestion completa de la matriz de identificacion de peligros
    y valoracion de riesgos segun GTC-45.
    Incluye funcionalidad del StandardViewSetMixin.
    """
    queryset = MatrizIPEVR.objects.select_related(
        'peligro', 'peligro__clasificacion', 'responsable', 'created_by'
    ).all()
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['empresa_id', 'area', 'cargo', 'proceso', 'estado', 'rutinaria', 'is_active']
    search_fields = ['area', 'cargo', 'proceso', 'actividad', 'tarea']
    ordering_fields = ['created_at', 'fecha_valoracion', 'area', 'cargo']
    ordering = ['-created_at']

    def get_serializer_class(self):
        if self.action == 'list':
            return MatrizIPEVRListSerializer
        return MatrizIPEVRDetailSerializer

    @action(detail=False, methods=['get'])
    def resumen(self, request):
        """Resumen estadistico de la matriz IPEVR."""
        empresa_id = request.query_params.get('empresa', 1)
        matrices = self.get_queryset().filter(empresa_id=empresa_id, is_active=True)

        # Contar por interpretacion NR
        nivel_i = matrices.filter(estado='vigente').count()

        # Calcular manualmente ya que son properties
        resumen = {
            'total': matrices.count(),
            'vigentes': matrices.filter(estado='vigente').count(),
            'borradores': matrices.filter(estado='borrador').count(),
            'total_expuestos': matrices.aggregate(total=Sum('num_expuestos'))['total'] or 0,
            'por_estado': list(
                matrices.values('estado').annotate(cantidad=Count('id')).order_by('estado')
            ),
            'por_area': list(
                matrices.values('area').annotate(cantidad=Count('id')).order_by('-cantidad')[:10]
            ),
            'por_cargo': list(
                matrices.values('cargo').annotate(cantidad=Count('id')).order_by('-cantidad')[:10]
            ),
        }
        return Response(resumen)

    @action(detail=False, methods=['get'])
    def criticos(self, request):
        """Lista de riesgos criticos (niveles I y II)."""
        empresa_id = request.query_params.get('empresa', 1)
        matrices = self.get_queryset().filter(
            empresa_id=empresa_id,
            estado='vigente',
            is_active=True
        )

        # Filtrar por nivel de riesgo alto (NR >= 150)
        criticos = [m for m in matrices if m.nivel_riesgo >= 150]
        serializer = MatrizIPEVRListSerializer(criticos, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def por_area(self, request):
        """Matrices agrupadas por area."""
        empresa_id = request.query_params.get('empresa', 1)
        stats = self.get_queryset().filter(
            empresa_id=empresa_id,
            estado='vigente',
            is_active=True
        ).values('area').annotate(
            total=Count('id'),
        ).order_by('-total')
        return Response(list(stats))

    @action(detail=False, methods=['get'])
    def por_cargo(self, request):
        """Matrices agrupadas por cargo."""
        empresa_id = request.query_params.get('empresa', 1)
        stats = self.get_queryset().filter(
            empresa_id=empresa_id,
            estado='vigente',
            is_active=True
        ).values('cargo').annotate(
            total=Count('id'),
        ).order_by('-total')
        return Response(list(stats))

    @action(detail=False, methods=['get'])
    def por_peligro(self, request):
        """Matrices agrupadas por tipo de peligro."""
        empresa_id = request.query_params.get('empresa', 1)
        stats = self.get_queryset().filter(
            empresa_id=empresa_id,
            estado='vigente',
            is_active=True
        ).values(
            'peligro__clasificacion__categoria',
            'peligro__clasificacion__nombre'
        ).annotate(
            total=Count('id'),
        ).order_by('-total')
        return Response(list(stats))

    @action(detail=True, methods=['post'])
    def cambiar_estado(self, request, pk=None):
        """Cambiar el estado de una matriz IPEVR."""
        matriz = self.get_object()
        nuevo_estado = request.data.get('estado')

        estados_validos = [e[0] for e in MatrizIPEVR.EstadoMatriz.choices]
        if nuevo_estado not in estados_validos:
            return Response(
                {'error': f'Estado invalido. Opciones: {estados_validos}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        matriz.estado = nuevo_estado
        matriz.save()
        serializer = MatrizIPEVRDetailSerializer(matriz)
        return Response(serializer.data)


class ControlSSTViewSet(StandardViewSetMixin, viewsets.ModelViewSet):
    """
    ViewSet para Controles SST.

    Gestion de controles de seguridad y salud en el trabajo
    asociados a la matriz IPEVR.
    Incluye funcionalidad del StandardViewSetMixin.
    """
    queryset = ControlSST.objects.select_related(
        'matriz_ipevr', 'responsable', 'created_by'
    ).all()
    serializer_class = ControlSSTSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['empresa_id', 'matriz_ipevr', 'tipo_control', 'estado', 'efectividad', 'is_active']
    search_fields = ['descripcion', 'observaciones']
    ordering_fields = ['tipo_control', 'fecha_implementacion', 'created_at']
    ordering = ['tipo_control', '-created_at']

    @action(detail=False, methods=['get'])
    def pendientes(self, request):
        """Controles pendientes de implementacion."""
        empresa_id = request.query_params.get('empresa', 1)
        controles = self.get_queryset().filter(
            empresa_id=empresa_id,
            estado__in=['propuesto', 'en_implementacion'],
            is_active=True
        ).order_by('fecha_implementacion')
        serializer = self.get_serializer(controles, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def por_tipo(self, request):
        """Estadisticas de controles por tipo."""
        empresa_id = request.query_params.get('empresa', 1)
        stats = self.get_queryset().filter(
            empresa_id=empresa_id,
            is_active=True
        ).values('tipo_control').annotate(
            total=Count('id'),
            implementados=Count('id', filter=Q(estado='implementado')),
            verificados=Count('id', filter=Q(estado='verificado')),
        ).order_by('tipo_control')
        return Response(list(stats))
