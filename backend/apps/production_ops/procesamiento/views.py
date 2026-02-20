"""
Views para Procesamiento de Materia Prima - Production Ops
Sistema de Gestión StrateKaz

Autor: Sistema de Gestión
Fecha: 2025-12-28
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.utils import timezone
from django.db.models import Q, Count, Sum, Avg

from apps.core.base_models.mixins import get_tenant_empresa

from .models import (
    TipoProceso,
    EstadoProceso,
    LineaProduccion,
    OrdenProduccion,
    LoteProduccion,
    ConsumoMateriaPrima,
    ControlCalidadProceso
)
from .serializers import (
    TipoProcesoSerializer,
    EstadoProcesoSerializer,
    LineaProduccionSerializer,
    LineaProduccionListSerializer,
    OrdenProduccionSerializer,
    OrdenProduccionListSerializer,
    OrdenProduccionCreateSerializer,
    LoteProduccionSerializer,
    LoteProduccionListSerializer,
    ConsumoMateriaPrimaSerializer,
    ControlCalidadProcesoSerializer,
    IniciarProcesoSerializer,
    FinalizarProcesoSerializer
)


# ==============================================================================
# VIEWSETS DE CATÁLOGO
# ==============================================================================

class TipoProcesoViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión de Tipos de Proceso.

    Endpoints:
    - GET /api/procesamiento/tipos-proceso/ - Listar tipos de proceso
    - POST /api/procesamiento/tipos-proceso/ - Crear tipo de proceso
    - GET /api/procesamiento/tipos-proceso/{id}/ - Detalle de tipo de proceso
    - PUT /api/procesamiento/tipos-proceso/{id}/ - Actualizar tipo de proceso
    - PATCH /api/procesamiento/tipos-proceso/{id}/ - Actualizar parcialmente
    - DELETE /api/procesamiento/tipos-proceso/{id}/ - Eliminar tipo de proceso
    """
    queryset = TipoProceso.objects.all()
    serializer_class = TipoProcesoSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['activo', 'requiere_temperatura', 'requiere_presion']
    search_fields = ['codigo', 'nombre', 'descripcion']
    ordering_fields = ['orden', 'nombre', 'created_at']
    ordering = ['orden', 'nombre']

    def get_queryset(self):
        """Filtrar por activos si se especifica."""
        queryset = super().get_queryset()

        # Filtro para obtener solo activos
        solo_activos = self.request.query_params.get('solo_activos', None)
        if solo_activos and solo_activos.lower() == 'true':
            queryset = queryset.filter(activo=True)

        return queryset


class EstadoProcesoViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión de Estados de Proceso.

    Endpoints:
    - GET /api/procesamiento/estados-proceso/ - Listar estados
    - POST /api/procesamiento/estados-proceso/ - Crear estado
    - GET /api/procesamiento/estados-proceso/{id}/ - Detalle de estado
    - PUT /api/procesamiento/estados-proceso/{id}/ - Actualizar estado
    - DELETE /api/procesamiento/estados-proceso/{id}/ - Eliminar estado
    """
    queryset = EstadoProceso.objects.all()
    serializer_class = EstadoProcesoSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['activo', 'es_inicial', 'es_final', 'permite_edicion']
    search_fields = ['codigo', 'nombre', 'descripcion']
    ordering_fields = ['orden', 'nombre', 'created_at']
    ordering = ['orden', 'nombre']


class LineaProduccionViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión de Líneas de Producción.

    Endpoints:
    - GET /api/procesamiento/lineas-produccion/ - Listar líneas
    - POST /api/procesamiento/lineas-produccion/ - Crear línea
    - GET /api/procesamiento/lineas-produccion/{id}/ - Detalle de línea
    - PUT /api/procesamiento/lineas-produccion/{id}/ - Actualizar línea
    - DELETE /api/procesamiento/lineas-produccion/{id}/ - Eliminar línea
    """
    queryset = LineaProduccion.objects.select_related('empresa').prefetch_related(
        'tipo_proceso_compatible'
    )
    serializer_class = LineaProduccionSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['empresa', 'is_active']
    search_fields = ['codigo', 'nombre', 'descripcion', 'ubicacion']
    ordering_fields = ['orden', 'nombre', 'capacidad_kg_hora', 'created_at']
    ordering = ['orden', 'nombre']

    def get_serializer_class(self):
        """Usar serializer simplificado para listados."""
        if self.action == 'list':
            return LineaProduccionListSerializer
        return LineaProduccionSerializer

    def get_queryset(self):
        """Filtrar por empresa del usuario."""
        queryset = super().get_queryset()

        # Tenant schema isolation handles empresa filtering

        # Filtrar solo activas
        solo_activas = self.request.query_params.get('solo_activas', None)
        if solo_activas and solo_activas.lower() == 'true':
            queryset = queryset.filter(is_active=True)

        return queryset

    def perform_create(self, serializer):
        """Asignar empresa y usuario al crear."""
        serializer.save(
            created_by=self.request.user,
            empresa=get_tenant_empresa()
        )

    def perform_update(self, serializer):
        """Registrar usuario que actualiza."""
        serializer.save(updated_by=self.request.user)


# ==============================================================================
# VIEWSETS DE ORDEN DE PRODUCCIÓN
# ==============================================================================

class OrdenProduccionViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión de Órdenes de Producción.

    Endpoints:
    - GET /api/procesamiento/ordenes-produccion/ - Listar órdenes
    - POST /api/procesamiento/ordenes-produccion/ - Crear orden
    - GET /api/procesamiento/ordenes-produccion/{id}/ - Detalle de orden
    - PUT /api/procesamiento/ordenes-produccion/{id}/ - Actualizar orden
    - DELETE /api/procesamiento/ordenes-produccion/{id}/ - Eliminar orden

    Acciones personalizadas:
    - POST /api/procesamiento/ordenes-produccion/{id}/iniciar/ - Iniciar proceso
    - POST /api/procesamiento/ordenes-produccion/{id}/finalizar/ - Finalizar proceso
    - GET /api/procesamiento/ordenes-produccion/dashboard/ - Dashboard de indicadores
    """
    queryset = OrdenProduccion.objects.select_related(
        'empresa', 'tipo_proceso', 'linea_produccion', 'estado',
        'recepcion_origen', 'responsable', 'created_by'
    ).prefetch_related('lotes')
    serializer_class = OrdenProduccionSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = [
        'empresa', 'tipo_proceso', 'linea_produccion', 'estado',
        'prioridad', 'responsable', 'is_active'
    ]
    search_fields = ['codigo', 'observaciones']
    ordering_fields = [
        'codigo', 'fecha_programada', 'fecha_inicio', 'fecha_fin',
        'cantidad_programada', 'prioridad', 'created_at'
    ]
    ordering = ['-fecha_programada', '-prioridad', '-created_at']

    def get_serializer_class(self):
        """Usar serializer apropiado según la acción."""
        if self.action == 'list':
            return OrdenProduccionListSerializer
        elif self.action == 'create':
            return OrdenProduccionCreateSerializer
        elif self.action == 'iniciar':
            return IniciarProcesoSerializer
        elif self.action == 'finalizar':
            return FinalizarProcesoSerializer
        return OrdenProduccionSerializer

    def get_queryset(self):
        """Filtrar por empresa del usuario."""
        queryset = super().get_queryset()

        # Tenant schema isolation handles empresa filtering

        # Filtros adicionales
        fecha_desde = self.request.query_params.get('fecha_desde', None)
        fecha_hasta = self.request.query_params.get('fecha_hasta', None)

        if fecha_desde:
            queryset = queryset.filter(fecha_programada__gte=fecha_desde)
        if fecha_hasta:
            queryset = queryset.filter(fecha_programada__lte=fecha_hasta)

        return queryset

    def perform_create(self, serializer):
        """Asignar empresa y usuario al crear."""
        serializer.save(
            created_by=self.request.user,
            empresa=get_tenant_empresa()
        )

    def perform_update(self, serializer):
        """Registrar usuario que actualiza."""
        serializer.save(updated_by=self.request.user)

    @action(detail=True, methods=['post'])
    def iniciar(self, request, pk=None):
        """
        Iniciar la ejecución de la orden de producción.

        Cambia el estado a EN_PROCESO y registra fecha_inicio.
        """
        orden = self.get_object()

        try:
            orden.iniciar_proceso(usuario=request.user)
            serializer = self.get_serializer(orden)
            return Response({
                'message': 'Orden de producción iniciada exitosamente',
                'data': serializer.data
            })
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=True, methods=['post'])
    def finalizar(self, request, pk=None):
        """
        Finalizar la orden de producción.

        Cambia el estado a COMPLETADA y registra fecha_fin.
        """
        orden = self.get_object()
        serializer = FinalizarProcesoSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            # Actualizar cantidad real si se proporcionó
            cantidad_real = serializer.validated_data.get('cantidad_real')
            if cantidad_real:
                orden.cantidad_real = cantidad_real

            orden.finalizar_proceso(usuario=request.user)

            response_serializer = self.get_serializer(orden)
            return Response({
                'message': 'Orden de producción finalizada exitosamente',
                'data': response_serializer.data
            })
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=False, methods=['get'])
    def dashboard(self, request):
        """
        Dashboard con indicadores de órdenes de producción.

        Retorna:
        - Total de órdenes por estado
        - Órdenes del día
        - Rendimiento promedio
        - Estadísticas de producción
        """
        queryset = self.filter_queryset(self.get_queryset())

        # Total por estado
        por_estado = queryset.values('estado__nombre', 'estado__color').annotate(
            total=Count('id')
        ).order_by('estado__orden')

        # Órdenes del día
        hoy = timezone.now().date()
        ordenes_hoy = queryset.filter(fecha_programada=hoy).count()

        # En proceso
        en_proceso = queryset.filter(estado__codigo='EN_PROCESO').count()

        # Pendientes
        pendientes = queryset.filter(estado__codigo='PROGRAMADA').count()

        # Rendimiento promedio
        rendimiento_promedio = queryset.aggregate(
            promedio=Avg('rendimiento_promedio')
        )['promedio'] or 0

        # Total cantidad producida (del mes actual)
        from datetime import datetime
        primer_dia_mes = datetime.now().replace(day=1).date()
        cantidad_mes = queryset.filter(
            fecha_programada__gte=primer_dia_mes
        ).aggregate(
            total=Sum('total_cantidad_producida')
        )['total'] or 0

        return Response({
            'por_estado': list(por_estado),
            'ordenes_hoy': ordenes_hoy,
            'en_proceso': en_proceso,
            'pendientes': pendientes,
            'rendimiento_promedio': round(rendimiento_promedio, 2),
            'cantidad_producida_mes': round(cantidad_mes, 2)
        })


# ==============================================================================
# VIEWSETS DE LOTE DE PRODUCCIÓN
# ==============================================================================

class LoteProduccionViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión de Lotes de Producción.

    Endpoints:
    - GET /api/procesamiento/lotes-produccion/ - Listar lotes
    - POST /api/procesamiento/lotes-produccion/ - Crear lote
    - GET /api/procesamiento/lotes-produccion/{id}/ - Detalle de lote
    - PUT /api/procesamiento/lotes-produccion/{id}/ - Actualizar lote
    - DELETE /api/procesamiento/lotes-produccion/{id}/ - Eliminar lote
    """
    queryset = LoteProduccion.objects.select_related(
        'orden_produccion', 'orden_produccion__empresa',
        'orden_produccion__tipo_proceso', 'operador'
    ).prefetch_related('consumos', 'controles_calidad')
    serializer_class = LoteProduccionSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['orden_produccion', 'fecha_produccion', 'operador']
    search_fields = ['codigo', 'producto_salida', 'materia_prima_entrada']
    ordering_fields = [
        'codigo', 'fecha_produccion', 'cantidad_salida',
        'porcentaje_rendimiento', 'created_at'
    ]
    ordering = ['-fecha_produccion', '-created_at']

    def get_serializer_class(self):
        """Usar serializer simplificado para listados."""
        if self.action == 'list':
            return LoteProduccionListSerializer
        return LoteProduccionSerializer

    def get_queryset(self):
        """Filtrar por empresa del usuario."""
        queryset = super().get_queryset()

        # Tenant schema isolation handles empresa filtering

        # Filtros adicionales
        fecha_desde = self.request.query_params.get('fecha_desde', None)
        fecha_hasta = self.request.query_params.get('fecha_hasta', None)

        if fecha_desde:
            queryset = queryset.filter(fecha_produccion__gte=fecha_desde)
        if fecha_hasta:
            queryset = queryset.filter(fecha_produccion__lte=fecha_hasta)

        return queryset


# ==============================================================================
# VIEWSETS DE CONSUMO DE MATERIA PRIMA
# ==============================================================================

class ConsumoMateriaPrimaViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión de Consumos de Materia Prima.

    Endpoints:
    - GET /api/procesamiento/consumos-materia-prima/ - Listar consumos
    - POST /api/procesamiento/consumos-materia-prima/ - Crear consumo
    - GET /api/procesamiento/consumos-materia-prima/{id}/ - Detalle de consumo
    - PUT /api/procesamiento/consumos-materia-prima/{id}/ - Actualizar consumo
    - DELETE /api/procesamiento/consumos-materia-prima/{id}/ - Eliminar consumo
    """
    queryset = ConsumoMateriaPrima.objects.select_related(
        'lote_produccion', 'lote_produccion__orden_produccion',
        'tipo_materia_prima'
    )
    serializer_class = ConsumoMateriaPrimaSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['lote_produccion', 'tipo_materia_prima']
    search_fields = ['lote_origen']
    ordering_fields = ['cantidad', 'costo_total', 'created_at']
    ordering = ['-created_at']

    def get_queryset(self):
        """Filtrar por empresa del usuario."""
        queryset = super().get_queryset()

        # Tenant schema isolation handles empresa filtering

        return queryset


# ==============================================================================
# VIEWSETS DE CONTROL DE CALIDAD
# ==============================================================================

class ControlCalidadProcesoViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión de Controles de Calidad en Proceso.

    Endpoints:
    - GET /api/procesamiento/controles-calidad/ - Listar controles
    - POST /api/procesamiento/controles-calidad/ - Crear control
    - GET /api/procesamiento/controles-calidad/{id}/ - Detalle de control
    - PUT /api/procesamiento/controles-calidad/{id}/ - Actualizar control
    - DELETE /api/procesamiento/controles-calidad/{id}/ - Eliminar control
    """
    queryset = ControlCalidadProceso.objects.select_related(
        'lote_produccion', 'lote_produccion__orden_produccion',
        'verificado_por'
    )
    serializer_class = ControlCalidadProcesoSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['lote_produccion', 'parametro', 'cumple', 'verificado_por']
    search_fields = ['parametro', 'observaciones']
    ordering_fields = ['fecha_verificacion', 'parametro', 'cumple']
    ordering = ['-fecha_verificacion']

    def get_queryset(self):
        """Filtrar por empresa del usuario."""
        queryset = super().get_queryset()

        # Tenant schema isolation handles empresa filtering

        return queryset

    def perform_create(self, serializer):
        """Asignar usuario verificador al crear."""
        serializer.save(verificado_por=self.request.user)
