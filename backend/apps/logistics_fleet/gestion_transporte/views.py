"""
ViewSets para Gestión de Transporte
Sistema de programación, despachos y manifiestos
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.pagination import PageNumberPagination
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.utils import timezone
from django.db.models import Count, Sum, Q
from datetime import timedelta

from .models import (
    TipoRuta, EstadoDespacho, Ruta, Conductor,
    ProgramacionRuta, Despacho, DetalleDespacho, Manifiesto
)
from .serializers import (
    TipoRutaSerializer, EstadoDespachoSerializer, RutaSerializer,
    ConductorSerializer, ProgramacionRutaSerializer, DespachoSerializer,
    DetalleDespachoSerializer, ManifiestoSerializer
)


class StandardResultsSetPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100


class TipoRutaViewSet(viewsets.ModelViewSet):
    """ViewSet para gestión de tipos de ruta."""
    queryset = TipoRuta.objects.all()
    serializer_class = TipoRutaSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = StandardResultsSetPagination
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['es_recoleccion', 'es_entrega', 'es_transferencia']
    search_fields = ['codigo', 'nombre', 'descripcion']
    ordering_fields = ['orden', 'codigo', 'nombre']
    ordering = ['orden', 'nombre']


class EstadoDespachoViewSet(viewsets.ModelViewSet):
    """ViewSet para gestión de estados de despacho."""
    queryset = EstadoDespacho.objects.all()
    serializer_class = EstadoDespachoSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = StandardResultsSetPagination
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['en_transito', 'es_final']
    search_fields = ['codigo', 'nombre']
    ordering_fields = ['orden', 'codigo']
    ordering = ['orden']


class RutaViewSet(viewsets.ModelViewSet):
    """ViewSet para gestión de rutas definidas."""
    queryset = Ruta.objects.select_related('tipo_ruta').filter(is_active=True)
    serializer_class = RutaSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = StandardResultsSetPagination
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['tipo_ruta', 'origen_ciudad', 'destino_ciudad', 'is_active']
    search_fields = ['codigo', 'nombre', 'origen_nombre', 'destino_nombre']
    ordering_fields = ['codigo', 'nombre', 'distancia_km']
    ordering = ['codigo']

    def get_queryset(self):
        queryset = super().get_queryset()
        empresa_id = self.request.query_params.get('empresa_id')
        if empresa_id:
            queryset = queryset.filter(empresa_id=empresa_id)
        return queryset


class ConductorViewSet(viewsets.ModelViewSet):
    """ViewSet para gestión de conductores."""
    queryset = Conductor.objects.select_related('usuario').filter(is_active=True)
    serializer_class = ConductorSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = StandardResultsSetPagination
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['es_empleado', 'categoria_licencia', 'is_active']
    search_fields = ['nombre_completo', 'documento_identidad', 'licencia_conduccion']
    ordering_fields = ['nombre_completo', 'fecha_ingreso']
    ordering = ['nombre_completo']

    def get_queryset(self):
        queryset = super().get_queryset()
        empresa_id = self.request.query_params.get('empresa_id')
        if empresa_id:
            queryset = queryset.filter(empresa_id=empresa_id)
        return queryset

    @action(detail=False, methods=['get'])
    def disponibles(self, request):
        """Lista conductores disponibles (licencia vigente y activos)."""
        hoy = timezone.now().date()
        conductores = self.get_queryset().filter(
            is_active=True,
            fecha_vencimiento_licencia__gt=hoy
        ).exclude(fecha_retiro__isnull=False)
        serializer = self.get_serializer(conductores, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='licencias-por-vencer')
    def licencias_por_vencer(self, request):
        """Conductores con licencia próxima a vencer (30 días)."""
        hoy = timezone.now().date()
        limite = hoy + timedelta(days=30)
        conductores = self.get_queryset().filter(
            fecha_vencimiento_licencia__gte=hoy,
            fecha_vencimiento_licencia__lte=limite
        )
        serializer = self.get_serializer(conductores, many=True)
        return Response(serializer.data)


class ProgramacionRutaViewSet(viewsets.ModelViewSet):
    """ViewSet para gestión de programaciones de ruta."""
    queryset = ProgramacionRuta.objects.select_related(
        'ruta', 'ruta__tipo_ruta', 'vehiculo', 'conductor', 'programado_por'
    ).prefetch_related('despachos')
    serializer_class = ProgramacionRutaSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = StandardResultsSetPagination
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['estado', 'ruta', 'vehiculo', 'conductor', 'fecha_programada']
    search_fields = ['codigo', 'ruta__nombre', 'vehiculo__placa']
    ordering_fields = ['fecha_programada', 'hora_salida_programada', 'codigo']
    ordering = ['-fecha_programada', 'hora_salida_programada']

    def get_queryset(self):
        queryset = super().get_queryset()
        empresa_id = self.request.query_params.get('empresa_id')
        if empresa_id:
            queryset = queryset.filter(empresa_id=empresa_id)
        return queryset

    def perform_create(self, serializer):
        serializer.save(programado_por=self.request.user)

    @action(detail=True, methods=['post'])
    def iniciar(self, request, pk=None):
        """Iniciar viaje (registrar km inicial y hora salida)."""
        programacion = self.get_object()

        if programacion.estado != 'PROGRAMADA':
            return Response(
                {'error': 'Solo se pueden iniciar programaciones en estado PROGRAMADA'},
                status=status.HTTP_400_BAD_REQUEST
            )

        km_inicial = request.data.get('km_inicial')
        if not km_inicial:
            return Response(
                {'error': 'Debe proporcionar el kilometraje inicial'},
                status=status.HTTP_400_BAD_REQUEST
            )

        programacion.estado = 'EN_CURSO'
        programacion.km_inicial = km_inicial
        programacion.hora_salida_real = timezone.now()
        programacion.save()

        # Actualizar estado del vehículo
        if programacion.vehiculo:
            programacion.vehiculo.km_actual = km_inicial
            programacion.vehiculo.save(update_fields=['km_actual'])

        serializer = self.get_serializer(programacion)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def finalizar(self, request, pk=None):
        """Finalizar viaje (registrar km final y hora llegada)."""
        programacion = self.get_object()

        if programacion.estado != 'EN_CURSO':
            return Response(
                {'error': 'Solo se pueden finalizar programaciones en estado EN_CURSO'},
                status=status.HTTP_400_BAD_REQUEST
            )

        km_final = request.data.get('km_final')
        if not km_final:
            return Response(
                {'error': 'Debe proporcionar el kilometraje final'},
                status=status.HTTP_400_BAD_REQUEST
            )

        programacion.estado = 'COMPLETADA'
        programacion.km_final = km_final
        programacion.hora_llegada_real = timezone.now()
        programacion.save()

        # Actualizar kilometraje del vehículo
        if programacion.vehiculo:
            programacion.vehiculo.km_actual = km_final
            programacion.vehiculo.save(update_fields=['km_actual'])

        serializer = self.get_serializer(programacion)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def hoy(self, request):
        """Programaciones de hoy."""
        hoy = timezone.now().date()
        programaciones = self.get_queryset().filter(fecha_programada=hoy)
        serializer = self.get_serializer(programaciones, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def dashboard(self, request):
        """Dashboard de KPIs de transporte."""
        empresa_id = request.query_params.get('empresa_id')
        hoy = timezone.now().date()
        inicio_mes = hoy.replace(day=1)

        queryset = self.get_queryset()
        if empresa_id:
            queryset = queryset.filter(empresa_id=empresa_id)

        # Estadísticas generales
        total_programaciones = queryset.count()
        programaciones_mes = queryset.filter(fecha_programada__gte=inicio_mes).count()

        # Por estado
        por_estado = queryset.values('estado').annotate(
            total=Count('id')
        ).order_by('estado')

        # Programaciones de hoy
        programaciones_hoy = queryset.filter(fecha_programada=hoy).count()
        en_curso_hoy = queryset.filter(
            fecha_programada=hoy,
            estado='EN_CURSO'
        ).count()

        # Kilometraje total del mes
        km_total_mes = queryset.filter(
            fecha_programada__gte=inicio_mes,
            estado='COMPLETADA'
        ).aggregate(
            total_km=Sum('km_recorridos')
        )['total_km'] or 0

        return Response({
            'resumen': {
                'total_programaciones': total_programaciones,
                'programaciones_mes': programaciones_mes,
                'programaciones_hoy': programaciones_hoy,
                'en_curso_hoy': en_curso_hoy,
                'km_total_mes': km_total_mes
            },
            'por_estado': list(por_estado)
        })


class DespachoViewSet(viewsets.ModelViewSet):
    """ViewSet para gestión de despachos."""
    queryset = Despacho.objects.select_related(
        'programacion_ruta', 'programacion_ruta__vehiculo',
        'programacion_ruta__conductor', 'estado_despacho'
    ).prefetch_related('detalles')
    serializer_class = DespachoSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = StandardResultsSetPagination
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['estado_despacho', 'programacion_ruta', 'novedad', 'requiere_cadena_frio']
    search_fields = ['codigo', 'cliente_nombre', 'cliente_direccion']
    ordering_fields = ['fecha_entrega_estimada', 'codigo']
    ordering = ['-created_at']

    def get_queryset(self):
        queryset = super().get_queryset()
        empresa_id = self.request.query_params.get('empresa_id')
        if empresa_id:
            queryset = queryset.filter(empresa_id=empresa_id)
        return queryset

    @action(detail=True, methods=['post'])
    def entregar(self, request, pk=None):
        """Registrar entrega con firma."""
        despacho = self.get_object()

        # Obtener estado final
        estado_entregado = EstadoDespacho.objects.filter(
            es_final=True
        ).first()

        if not estado_entregado:
            return Response(
                {'error': 'No hay un estado final configurado'},
                status=status.HTTP_400_BAD_REQUEST
            )

        despacho.estado_despacho = estado_entregado
        despacho.fecha_entrega_real = timezone.now()
        despacho.recibido_por = request.data.get('recibido_por', '')
        despacho.documento_recibido = request.data.get('documento_recibido', '')
        despacho.firma_recibido_url = request.data.get('firma_recibido_url', '')
        despacho.save()

        serializer = self.get_serializer(despacho)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], url_path='reportar-novedad')
    def reportar_novedad(self, request, pk=None):
        """Registrar novedad en el despacho."""
        despacho = self.get_object()

        descripcion = request.data.get('descripcion_novedad')
        if not descripcion:
            return Response(
                {'error': 'Debe proporcionar la descripción de la novedad'},
                status=status.HTTP_400_BAD_REQUEST
            )

        despacho.novedad = True
        despacho.descripcion_novedad = descripcion
        despacho.save()

        serializer = self.get_serializer(despacho)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def pendientes(self, request):
        """Despachos pendientes de entrega."""
        estados_no_finales = EstadoDespacho.objects.filter(es_final=False)
        despachos = self.get_queryset().filter(
            estado_despacho__in=estados_no_finales
        )
        serializer = self.get_serializer(despachos, many=True)
        return Response(serializer.data)


class DetalleDespachoViewSet(viewsets.ModelViewSet):
    """ViewSet para gestión de detalles de despacho."""
    queryset = DetalleDespacho.objects.select_related('despacho', 'stock_producto')
    serializer_class = DetalleDespachoSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = StandardResultsSetPagination
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['despacho']
    search_fields = ['descripcion_producto', 'codigo_producto', 'lote_origen']
    ordering = ['id']


class ManifiestoViewSet(viewsets.ModelViewSet):
    """ViewSet para gestión de manifiestos RNDC."""
    queryset = Manifiesto.objects.select_related(
        'programacion_ruta', 'generado_por'
    )
    serializer_class = ManifiestoSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = StandardResultsSetPagination
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['programacion_ruta', 'origen_ciudad', 'destino_ciudad']
    search_fields = ['numero_manifiesto', 'remitente_nombre', 'destinatario_nombre', 'conductor_nombre']
    ordering_fields = ['fecha_expedicion', 'numero_manifiesto']
    ordering = ['-fecha_expedicion']

    def get_queryset(self):
        queryset = super().get_queryset()
        empresa_id = self.request.query_params.get('empresa_id')
        if empresa_id:
            queryset = queryset.filter(empresa_id=empresa_id)
        return queryset

    def perform_create(self, serializer):
        serializer.save(generado_por=self.request.user)
