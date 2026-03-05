"""
Views para Gestión de Compras - Supply Chain
Sistema de Gestión StrateKaz
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.utils import timezone
from decimal import Decimal

from .models import (
    EstadoRequisicion, EstadoCotizacion, EstadoOrdenCompra,
    TipoContrato, PrioridadRequisicion, Moneda, EstadoContrato,
    EstadoMaterial, Requisicion, DetalleRequisicion, Cotizacion,
    EvaluacionCotizacion, OrdenCompra, DetalleOrdenCompra,
    Contrato, RecepcionCompra
)
from .serializers import (
    EstadoRequisicionSerializer, EstadoCotizacionSerializer,
    EstadoOrdenCompraSerializer, TipoContratoSerializer,
    PrioridadRequisicionSerializer, MonedaSerializer,
    EstadoContratoSerializer, EstadoMaterialSerializer,
    RequisicionSerializer, RequisicionListSerializer,
    RequisicionCreateUpdateSerializer, CotizacionSerializer,
    CotizacionListSerializer, EvaluacionCotizacionSerializer,
    OrdenCompraSerializer, OrdenCompraListSerializer,
    OrdenCompraCreateUpdateSerializer, ContratoSerializer,
    ContratoListSerializer, RecepcionCompraSerializer,
    RecepcionCompraListSerializer
)


# ==============================================================================
# VIEWSETS DE CATÁLOGOS DINÁMICOS
# ==============================================================================

class EstadoRequisicionViewSet(viewsets.ModelViewSet):
    """ViewSet para estados de requisición"""
    queryset = EstadoRequisicion.objects.all()
    serializer_class = EstadoRequisicionSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ['codigo', 'nombre']
    ordering_fields = ['orden', 'nombre']
    ordering = ['orden']


class EstadoCotizacionViewSet(viewsets.ModelViewSet):
    """ViewSet para estados de cotización"""
    queryset = EstadoCotizacion.objects.all()
    serializer_class = EstadoCotizacionSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ['codigo', 'nombre']
    ordering_fields = ['orden', 'nombre']
    ordering = ['orden']


class EstadoOrdenCompraViewSet(viewsets.ModelViewSet):
    """ViewSet para estados de orden de compra"""
    queryset = EstadoOrdenCompra.objects.all()
    serializer_class = EstadoOrdenCompraSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ['codigo', 'nombre']
    ordering_fields = ['orden', 'nombre']
    ordering = ['orden']


class TipoContratoViewSet(viewsets.ModelViewSet):
    """ViewSet para tipos de contrato"""
    queryset = TipoContrato.objects.all()
    serializer_class = TipoContratoSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ['codigo', 'nombre']
    ordering_fields = ['orden', 'nombre']
    ordering = ['orden']


class PrioridadRequisicionViewSet(viewsets.ModelViewSet):
    """ViewSet para prioridades de requisición"""
    queryset = PrioridadRequisicion.objects.all()
    serializer_class = PrioridadRequisicionSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ['codigo', 'nombre']
    ordering_fields = ['nivel', 'nombre']
    ordering = ['-nivel']


class MonedaViewSet(viewsets.ModelViewSet):
    """ViewSet para monedas"""
    queryset = Moneda.objects.all()
    serializer_class = MonedaSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ['codigo', 'nombre']
    ordering_fields = ['orden', 'codigo']
    ordering = ['orden']


class EstadoContratoViewSet(viewsets.ModelViewSet):
    """ViewSet para estados de contrato"""
    queryset = EstadoContrato.objects.all()
    serializer_class = EstadoContratoSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ['codigo', 'nombre']
    ordering_fields = ['orden', 'nombre']
    ordering = ['orden']


class EstadoMaterialViewSet(viewsets.ModelViewSet):
    """ViewSet para estados de material"""
    queryset = EstadoMaterial.objects.all()
    serializer_class = EstadoMaterialSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ['codigo', 'nombre']
    ordering_fields = ['orden', 'nombre']
    ordering = ['orden']


# ==============================================================================
# VIEWSETS PRINCIPALES
# ==============================================================================

class RequisicionViewSet(viewsets.ModelViewSet):
    """
    ViewSet para requisiciones de compra.

    Acciones personalizadas:
    - aprobar: Aprobar una requisición
    - rechazar: Rechazar una requisición
    """
    queryset = Requisicion.objects.select_related(
        'empresa', 'sede', 'solicitante', 'estado', 'prioridad',
        'aprobado_por', 'created_by'
    ).prefetch_related('detalles').filter(deleted_at__isnull=True)

    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['estado', 'prioridad', 'solicitante', 'sede']
    search_fields = ['codigo', 'area_solicitante', 'justificacion']
    ordering_fields = ['fecha_solicitud', 'fecha_requerida', 'created_at']
    ordering = ['-fecha_solicitud']

    def get_serializer_class(self):
        if self.action == 'list':
            return RequisicionListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return RequisicionCreateUpdateSerializer
        return RequisicionSerializer

    @action(detail=True, methods=['post'])
    def aprobar(self, request, pk=None):
        """Aprobar una requisición"""
        requisicion = self.get_object()

        if requisicion.esta_aprobada:
            return Response(
                {'error': 'La requisición ya está aprobada'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not requisicion.puede_editar:
            return Response(
                {'error': 'La requisición no puede ser modificada en su estado actual'},
                status=status.HTTP_400_BAD_REQUEST
            )

        requisicion.aprobar(request.user)

        serializer = self.get_serializer(requisicion)
        return Response({
            'message': 'Requisición aprobada exitosamente',
            'data': serializer.data
        })

    @action(detail=True, methods=['post'])
    def rechazar(self, request, pk=None):
        """Rechazar una requisición"""
        requisicion = self.get_object()

        if requisicion.esta_aprobada:
            return Response(
                {'error': 'No se puede rechazar una requisición ya aprobada'},
                status=status.HTTP_400_BAD_REQUEST
            )

        motivo = request.data.get('motivo', '')
        if not motivo:
            return Response(
                {'error': 'Debe proporcionar un motivo para el rechazo'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            estado_rechazada = EstadoRequisicion.objects.get(codigo='RECHAZADA', is_active=True)
            requisicion.estado = estado_rechazada
            requisicion.observaciones = f"{requisicion.observaciones or ''}\n\n[RECHAZO] {motivo}"
            requisicion.save()

            serializer = self.get_serializer(requisicion)
            return Response({
                'message': 'Requisición rechazada',
                'data': serializer.data
            })
        except EstadoRequisicion.DoesNotExist:
            return Response(
                {'error': 'No se encontró el estado RECHAZADA en el sistema'},
                status=status.HTTP_400_BAD_REQUEST
            )


class CotizacionViewSet(viewsets.ModelViewSet):
    """
    ViewSet para cotizaciones.

    Acciones personalizadas:
    - evaluar: Crear evaluación de una cotización
    - seleccionar: Marcar cotización como seleccionada
    """
    queryset = Cotizacion.objects.select_related(
        'proveedor', 'requisicion', 'estado', 'moneda', 'created_by'
    ).filter(deleted_at__isnull=True)

    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['estado', 'proveedor', 'requisicion', 'moneda']
    search_fields = ['numero_cotizacion', 'proveedor__nombre_comercial']
    ordering_fields = ['fecha_cotizacion', 'fecha_vencimiento', 'total']
    ordering = ['-fecha_cotizacion']

    def get_serializer_class(self):
        if self.action == 'list':
            return CotizacionListSerializer
        return CotizacionSerializer

    @action(detail=True, methods=['post'])
    def evaluar(self, request, pk=None):
        """Crear evaluación de una cotización"""
        cotizacion = self.get_object()

        if not cotizacion.puede_evaluar:
            return Response(
                {'error': 'La cotización no puede ser evaluada en su estado actual'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if cotizacion.tiene_evaluacion:
            return Response(
                {'error': 'La cotización ya tiene una evaluación'},
                status=status.HTTP_400_BAD_REQUEST
            )

        evaluacion_data = {
            'cotizacion': cotizacion.id,
            'criterios_evaluacion': request.data.get('criterios_evaluacion', {}),
            'recomendacion': request.data.get('recomendacion', ''),
            'observaciones': request.data.get('observaciones', '')
        }

        serializer = EvaluacionCotizacionSerializer(
            data=evaluacion_data,
            context={'request': request}
        )

        if serializer.is_valid():
            serializer.save()
            return Response({
                'message': 'Evaluación creada exitosamente',
                'data': serializer.data
            }, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def seleccionar(self, request, pk=None):
        """Marcar cotización como seleccionada"""
        cotizacion = self.get_object()

        try:
            estado_seleccionada = EstadoCotizacion.objects.get(codigo='SELECCIONADA', is_active=True)
            cotizacion.estado = estado_seleccionada
            cotizacion.save()

            serializer = self.get_serializer(cotizacion)
            return Response({
                'message': 'Cotización seleccionada exitosamente',
                'data': serializer.data
            })
        except EstadoCotizacion.DoesNotExist:
            return Response(
                {'error': 'No se encontró el estado SELECCIONADA'},
                status=status.HTTP_400_BAD_REQUEST
            )


class EvaluacionCotizacionViewSet(viewsets.ModelViewSet):
    """ViewSet para evaluaciones de cotizaciones"""
    queryset = EvaluacionCotizacion.objects.select_related(
        'cotizacion', 'evaluado_por'
    )
    serializer_class = EvaluacionCotizacionSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['cotizacion', 'evaluado_por']
    search_fields = ['cotizacion__numero_cotizacion', 'recomendacion']
    ordering_fields = ['fecha_evaluacion', 'puntaje_total']
    ordering = ['-fecha_evaluacion']


class OrdenCompraViewSet(viewsets.ModelViewSet):
    """
    ViewSet para órdenes de compra.

    Acciones personalizadas:
    - aprobar: Aprobar una orden de compra
    - registrar_recepcion: Registrar recepción de materiales
    """
    queryset = OrdenCompra.objects.select_related(
        'empresa', 'sede', 'proveedor', 'estado', 'moneda',
        'requisicion', 'cotizacion', 'creado_por', 'aprobado_por'
    ).prefetch_related('detalles').filter(deleted_at__isnull=True)

    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['estado', 'proveedor', 'sede', 'moneda']
    search_fields = ['numero_orden', 'proveedor__nombre_comercial']
    ordering_fields = ['fecha_orden', 'fecha_entrega_esperada', 'total']
    ordering = ['-fecha_orden']

    def get_serializer_class(self):
        if self.action == 'list':
            return OrdenCompraListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return OrdenCompraCreateUpdateSerializer
        return OrdenCompraSerializer

    @action(detail=True, methods=['post'])
    def aprobar(self, request, pk=None):
        """Aprobar una orden de compra"""
        orden = self.get_object()

        if orden.esta_aprobada:
            return Response(
                {'error': 'La orden ya está aprobada'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not orden.puede_editar:
            return Response(
                {'error': 'La orden no puede ser modificada en su estado actual'},
                status=status.HTTP_400_BAD_REQUEST
            )

        orden.aprobar(request.user)

        serializer = self.get_serializer(orden)
        return Response({
            'message': 'Orden de compra aprobada exitosamente',
            'data': serializer.data
        })

    @action(detail=True, methods=['post'], url_path='registrar-recepcion')
    def registrar_recepcion(self, request, pk=None):
        """Registrar recepción de materiales para esta orden"""
        orden = self.get_object()

        if not orden.puede_recibir:
            return Response(
                {'error': 'La orden no está en un estado que permita recepción'},
                status=status.HTTP_400_BAD_REQUEST
            )

        recepcion_data = {
            'orden_compra': orden.id,
            'numero_remision': request.data.get('numero_remision'),
            'fecha_recepcion': request.data.get('fecha_recepcion', timezone.now()),
            'cantidad_recibida': request.data.get('cantidad_recibida'),
            'estado_material': request.data.get('estado_material'),
            'observaciones': request.data.get('observaciones', ''),
            'genera_movimiento_inventario': request.data.get('genera_movimiento_inventario', True)
        }

        serializer = RecepcionCompraSerializer(
            data=recepcion_data,
            context={'request': request}
        )

        if serializer.is_valid():
            recepcion = serializer.save()

            cantidad_recibida = recepcion.cantidad_recibida
            detalles = orden.detalles.all()

            if detalles.exists():
                detalle = detalles.first()
                detalle.cantidad_recibida = Decimal(str(detalle.cantidad_recibida)) + Decimal(str(cantidad_recibida))
                detalle.save()

                if detalle.esta_completo:
                    try:
                        estado_recibida = EstadoOrdenCompra.objects.get(codigo='RECIBIDA_TOTAL', is_active=True)
                        orden.estado = estado_recibida
                    except EstadoOrdenCompra.DoesNotExist:
                        pass
                else:
                    try:
                        estado_parcial = EstadoOrdenCompra.objects.get(codigo='RECIBIDA_PARCIAL', is_active=True)
                        orden.estado = estado_parcial
                    except EstadoOrdenCompra.DoesNotExist:
                        pass

                orden.save()

            return Response({
                'message': 'Recepción registrada exitosamente',
                'data': serializer.data
            }, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ContratoViewSet(viewsets.ModelViewSet):
    """ViewSet para contratos con proveedores"""
    queryset = Contrato.objects.select_related(
        'empresa', 'proveedor', 'tipo_contrato', 'moneda',
        'estado', 'responsable', 'created_by'
    ).filter(deleted_at__isnull=True)

    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['proveedor', 'tipo_contrato', 'estado']
    search_fields = ['numero_contrato', 'objeto', 'proveedor__nombre_comercial']
    ordering_fields = ['fecha_inicio', 'fecha_fin', 'valor_total']
    ordering = ['-fecha_inicio']

    def get_serializer_class(self):
        if self.action == 'list':
            return ContratoListSerializer
        return ContratoSerializer

    @action(detail=False, methods=['get'])
    def vigentes(self, request):
        """Listar contratos vigentes"""
        from datetime import date
        hoy = date.today()
        contratos = self.get_queryset().filter(
            fecha_inicio__lte=hoy,
            fecha_fin__gte=hoy
        )

        serializer = self.get_serializer(contratos, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='por-vencer')
    def por_vencer(self, request):
        """Listar contratos próximos a vencer (30 días)"""
        from datetime import date, timedelta
        hoy = date.today()
        fecha_limite = hoy + timedelta(days=30)

        contratos = self.get_queryset().filter(
            fecha_fin__gte=hoy,
            fecha_fin__lte=fecha_limite
        )

        serializer = self.get_serializer(contratos, many=True)
        return Response(serializer.data)


class RecepcionCompraViewSet(viewsets.ModelViewSet):
    """ViewSet para recepciones de compra"""
    queryset = RecepcionCompra.objects.select_related(
        'orden_compra', 'orden_compra__proveedor',
        'estado_material', 'recibido_por'
    ).filter(deleted_at__isnull=True)

    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['orden_compra', 'estado_material', 'recibido_por']
    search_fields = ['numero_remision', 'orden_compra__numero_orden']
    ordering_fields = ['fecha_recepcion', 'created_at']
    ordering = ['-fecha_recepcion']

    def get_serializer_class(self):
        if self.action == 'list':
            return RecepcionCompraListSerializer
        return RecepcionCompraSerializer

    @action(detail=False, methods=['get'], url_path='no-conformes')
    def no_conformes(self, request):
        """Listar recepciones con material no conforme"""
        recepciones = self.get_queryset().exclude(
            estado_material__codigo='CONFORME'
        )

        serializer = self.get_serializer(recepciones, many=True)
        return Response(serializer.data)
