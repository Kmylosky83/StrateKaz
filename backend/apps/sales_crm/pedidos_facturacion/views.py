"""
Views para Pedidos y Facturación - Sales CRM
Sistema dinámico de gestión de pedidos, facturación y pagos
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, Count, Sum, Avg, F, Case, When, DecimalField
from django.db.models.functions import Coalesce
from django.utils import timezone
from decimal import Decimal

from apps.core.base_models.mixins import get_tenant_empresa

from .models import (
    EstadoPedido,
    MetodoPago,
    CondicionPago,
    Pedido,
    DetallePedido,
    Factura,
    PagoFactura
)
from .serializers import (
    EstadoPedidoSerializer,
    MetodoPagoSerializer,
    CondicionPagoSerializer,
    PedidoListSerializer,
    PedidoDetailSerializer,
    PedidoCreateUpdateSerializer,
    DetallePedidoSerializer,
    FacturaListSerializer,
    FacturaDetailSerializer,
    PagoFacturaSerializer,
    AprobarPedidoSerializer,
    CancelarPedidoSerializer,
    GenerarFacturaSerializer,
    RegistrarPagoSerializer,
    DashboardFacturacionSerializer
)


# ==================== CATÁLOGOS ====================

class EstadoPedidoViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión de estados de pedido
    """
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['activo', 'es_inicial', 'es_final', 'permite_modificacion', 'permite_facturar']
    search_fields = ['codigo', 'nombre']
    ordering_fields = ['orden', 'nombre', 'created_at']
    ordering = ['orden']

    def get_queryset(self):
        # Estados de pedido son globales (no multi-tenant)
        return EstadoPedido.objects.all()

    def get_serializer_class(self):
        return EstadoPedidoSerializer


class MetodoPagoViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión de métodos de pago
    """
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['activo', 'requiere_referencia', 'requiere_autorizacion']
    search_fields = ['codigo', 'nombre']
    ordering_fields = ['orden', 'nombre', 'created_at']
    ordering = ['orden']

    def get_queryset(self):
        # Métodos de pago son globales (no multi-tenant)
        return MetodoPago.objects.all()

    def get_serializer_class(self):
        return MetodoPagoSerializer


class CondicionPagoViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión de condiciones de pago
    """
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['activo', 'aplica_descuento']
    search_fields = ['codigo', 'nombre']
    ordering_fields = ['orden', 'nombre', 'dias_plazo', 'created_at']
    ordering = ['orden']

    def get_queryset(self):
        # Condiciones de pago son globales (no multi-tenant)
        return CondicionPago.objects.all()

    def get_serializer_class(self):
        return CondicionPagoSerializer


# ==================== PEDIDOS ====================

class PedidoViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión de pedidos de venta

    Incluye acciones custom:
    - aprobar: Aprobar pedido
    - cancelar: Cancelar pedido
    - generar_factura: Generar factura desde pedido
    - dashboard: Métricas de pedidos
    """
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['estado', 'vendedor', 'cliente', 'condicion_pago']
    search_fields = ['codigo', 'cliente__razon_social', 'cliente__numero_documento']
    ordering_fields = ['fecha_pedido', 'fecha_entrega_estimada', 'total', 'created_at']
    ordering = ['-fecha_pedido']

    def get_queryset(self):
        queryset = Pedido.objects.select_related(
            'cliente',
            'vendedor',
            'estado',
            'condicion_pago',
            'cotizacion'
        ).prefetch_related(
            'detalles',
            'facturas'
        )

        # Filtros adicionales
        estado = self.request.query_params.get('estado_codigo')
        if estado:
            queryset = queryset.filter(estado__codigo=estado)

        fecha_desde = self.request.query_params.get('fecha_desde')
        if fecha_desde:
            queryset = queryset.filter(fecha_pedido__gte=fecha_desde)

        fecha_hasta = self.request.query_params.get('fecha_hasta')
        if fecha_hasta:
            queryset = queryset.filter(fecha_pedido__lte=fecha_hasta)

        return queryset

    def get_serializer_class(self):
        if self.action == 'list':
            return PedidoListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return PedidoCreateUpdateSerializer
        return PedidoDetailSerializer

    def perform_create(self, serializer):
        serializer.save(
            empresa=get_tenant_empresa(),
            created_by=self.request.user,
            updated_by=self.request.user
        )

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)

    @action(detail=True, methods=['post'])
    def aprobar(self, request, pk=None):
        """Aprobar pedido"""
        pedido = self.get_object()

        serializer = AprobarPedidoSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            pedido.aprobar(usuario=request.user)

            if serializer.validated_data.get('observaciones'):
                pedido.observaciones = f"{pedido.observaciones}\n\n{serializer.validated_data['observaciones']}" if pedido.observaciones else serializer.validated_data['observaciones']
                pedido.save(update_fields=['observaciones', 'updated_at'])

            return Response({
                'message': f'Pedido {pedido.codigo} aprobado exitosamente',
                'pedido': PedidoDetailSerializer(pedido).data
            })
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=True, methods=['post'])
    def cancelar(self, request, pk=None):
        """Cancelar pedido"""
        pedido = self.get_object()

        serializer = CancelarPedidoSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            pedido.cancelar(
                usuario=request.user,
                motivo=serializer.validated_data['motivo']
            )

            return Response({
                'message': f'Pedido {pedido.codigo} cancelado exitosamente',
                'pedido': PedidoDetailSerializer(pedido).data
            })
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=True, methods=['post'], url_path='generar-factura')
    def generar_factura(self, request, pk=None):
        """Generar factura desde pedido aprobado"""
        pedido = self.get_object()

        try:
            factura = Factura.generar_desde_pedido(
                pedido=pedido,
                usuario=request.user
            )

            return Response({
                'message': f'Factura {factura.codigo} generada exitosamente',
                'factura': FacturaDetailSerializer(factura).data
            }, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=False, methods=['get'])
    def dashboard(self, request):
        """Dashboard de métricas de pedidos"""
        # Filtros de fecha
        fecha_desde = request.query_params.get('fecha_desde')
        fecha_hasta = request.query_params.get('fecha_hasta')

        queryset = Pedido.objects.all()

        if fecha_desde:
            queryset = queryset.filter(fecha_pedido__gte=fecha_desde)
        if fecha_hasta:
            queryset = queryset.filter(fecha_pedido__lte=fecha_hasta)

        # Resumen general
        total_pedidos = queryset.count()
        valor_total = queryset.aggregate(
            total=Coalesce(Sum('total'), Decimal('0.00'))
        )['total']

        # Por estado
        pedidos_por_estado = queryset.values(
            'estado__codigo',
            'estado__nombre',
            'estado__color'
        ).annotate(
            count=Count('id'),
            valor_total=Coalesce(Sum('total'), Decimal('0.00'))
        ).order_by('estado__orden')

        # Top clientes
        top_clientes = queryset.values(
            'cliente__id',
            'cliente__razon_social'
        ).annotate(
            total_pedidos=Count('id'),
            valor_total=Coalesce(Sum('total'), Decimal('0.00'))
        ).order_by('-valor_total')[:10]

        # Pedidos pendientes facturar
        pedidos_pendientes_facturar = queryset.filter(
            estado__permite_facturar=True,
            facturas__isnull=True
        ).count()

        data = {
            'total_pedidos': total_pedidos,
            'valor_total_pedidos': valor_total,
            'pedidos_por_estado': list(pedidos_por_estado),
            'top_clientes': list(top_clientes),
            'pedidos_pendientes_facturar': pedidos_pendientes_facturar
        }

        return Response(data)


# ==================== DETALLES DE PEDIDO ====================

class DetallePedidoViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión de detalles de pedido
    """
    permission_classes = [IsAuthenticated]
    serializer_class = DetallePedidoSerializer

    def get_queryset(self):
        queryset = DetallePedido.objects.select_related(
            'pedido',
            'producto'
        ).all()

        # Filtrar por pedido
        pedido_id = self.request.query_params.get('pedido')
        if pedido_id:
            queryset = queryset.filter(pedido_id=pedido_id)

        return queryset

    def perform_create(self, serializer):
        serializer.save(
            empresa=get_tenant_empresa(),
            created_by=self.request.user,
            updated_by=self.request.user
        )

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)


# ==================== FACTURAS ====================

class FacturaViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión de facturas

    Incluye acciones custom:
    - registrar_pago: Registrar pago para factura
    - anular: Anular factura
    - dashboard: Métricas de facturación
    """
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['estado', 'cliente', 'pedido']
    search_fields = ['codigo', 'cliente__razon_social', 'pedido__codigo']
    ordering_fields = ['fecha_factura', 'fecha_vencimiento', 'total', 'created_at']
    ordering = ['-fecha_factura']

    def get_queryset(self):
        queryset = Factura.objects.select_related(
            'pedido',
            'cliente'
        ).prefetch_related(
            'pagos'
        )

        # Filtros adicionales
        estado = self.request.query_params.get('estado')
        if estado:
            queryset = queryset.filter(estado=estado)

        vencidas = self.request.query_params.get('vencidas')
        if vencidas == 'true':
            queryset = queryset.filter(
                fecha_vencimiento__lt=timezone.now().date()
            ).exclude(
                estado__in=['PAGADA', 'ANULADA']
            )

        fecha_desde = self.request.query_params.get('fecha_desde')
        if fecha_desde:
            queryset = queryset.filter(fecha_factura__gte=fecha_desde)

        fecha_hasta = self.request.query_params.get('fecha_hasta')
        if fecha_hasta:
            queryset = queryset.filter(fecha_factura__lte=fecha_hasta)

        return queryset

    def get_serializer_class(self):
        if self.action == 'list':
            return FacturaListSerializer
        return FacturaDetailSerializer

    @action(detail=True, methods=['post'], url_path='registrar-pago')
    def registrar_pago(self, request, pk=None):
        """Registrar pago para factura"""
        factura = self.get_object()

        # Obtener datos del pago
        monto = request.data.get('monto')
        metodo_pago_id = request.data.get('metodo_pago')
        referencia_pago = request.data.get('referencia_pago', '')
        observaciones = request.data.get('observaciones', '')

        try:
            # Obtener método de pago
            metodo_pago = MetodoPago.objects.get(pk=metodo_pago_id, activo=True)

            # Registrar pago
            pago = factura.registrar_pago(
                monto=Decimal(str(monto)),
                metodo_pago=metodo_pago,
                referencia_pago=referencia_pago,
                observaciones=observaciones,
                usuario=request.user
            )

            return Response({
                'message': f'Pago {pago.codigo} registrado exitosamente',
                'pago': PagoFacturaSerializer(pago).data,
                'factura': FacturaDetailSerializer(factura).data
            }, status=status.HTTP_201_CREATED)
        except MetodoPago.DoesNotExist:
            return Response(
                {'error': 'Método de pago no encontrado o inactivo'},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=True, methods=['post'])
    def anular(self, request, pk=None):
        """Anular factura"""
        factura = self.get_object()

        if factura.estado == 'ANULADA':
            return Response(
                {'error': 'La factura ya está anulada'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if factura.pagos.exists():
            return Response(
                {'error': 'No se puede anular una factura con pagos registrados'},
                status=status.HTTP_400_BAD_REQUEST
            )

        factura.estado = 'ANULADA'
        factura.updated_by = request.user
        factura.save(update_fields=['estado', 'updated_by', 'updated_at'])

        return Response({
            'message': f'Factura {factura.codigo} anulada exitosamente',
            'factura': FacturaDetailSerializer(factura).data
        })

    @action(detail=False, methods=['get'])
    def dashboard(self, request):
        """Dashboard de métricas de facturación"""
        # Filtros de fecha
        fecha_desde = request.query_params.get('fecha_desde')
        fecha_hasta = request.query_params.get('fecha_hasta')

        queryset = Factura.objects.all()

        if fecha_desde:
            queryset = queryset.filter(fecha_factura__gte=fecha_desde)
        if fecha_hasta:
            queryset = queryset.filter(fecha_factura__lte=fecha_hasta)

        # Resumen general
        total_facturas = queryset.count()
        valor_total_facturas = queryset.aggregate(
            total=Coalesce(Sum('total'), Decimal('0.00'))
        )['total']

        # Total pagado
        total_pagos = PagoFactura.objects.filter(
            factura__in=queryset
        ).count()

        valor_total_pagado = PagoFactura.objects.filter(
            factura__in=queryset
        ).aggregate(
            total=Coalesce(Sum('monto'), Decimal('0.00'))
        )['total']

        # Valor pendiente de cobro
        valor_pendiente_cobro = valor_total_facturas - valor_total_pagado

        # Por estado
        facturas_por_estado = queryset.values('estado').annotate(
            count=Count('id'),
            valor_total=Coalesce(Sum('total'), Decimal('0.00'))
        )

        # Facturas vencidas
        facturas_vencidas = queryset.filter(
            fecha_vencimiento__lt=timezone.now().date()
        ).exclude(
            estado__in=['PAGADA', 'ANULADA']
        )

        total_vencidas = facturas_vencidas.count()
        valor_vencidas = facturas_vencidas.aggregate(
            total=Coalesce(Sum('total'), Decimal('0.00'))
        )['total']

        # Top clientes
        top_clientes = queryset.values(
            'cliente__id',
            'cliente__razon_social'
        ).annotate(
            total_facturas=Count('id'),
            valor_total=Coalesce(Sum('total'), Decimal('0.00'))
        ).order_by('-valor_total')[:10]

        # Pedidos correspondientes
        total_pedidos = Pedido.objects.filter(
            facturas__in=queryset
        ).distinct().count()

        valor_total_pedidos = Pedido.objects.filter(
            facturas__in=queryset
        ).distinct().aggregate(
            total=Coalesce(Sum('total'), Decimal('0.00'))
        )['total']

        data = {
            'total_pedidos': total_pedidos,
            'total_facturas': total_facturas,
            'total_pagos': total_pagos,
            'valor_total_pedidos': valor_total_pedidos,
            'valor_total_facturas': valor_total_facturas,
            'valor_total_pagado': valor_total_pagado,
            'valor_pendiente_cobro': valor_pendiente_cobro,
            'pedidos_por_estado': [],  # Se llena desde PedidoViewSet.dashboard
            'facturas_por_estado': list(facturas_por_estado),
            'facturas_vencidas': total_vencidas,
            'valor_facturas_vencidas': valor_vencidas,
            'top_clientes': list(top_clientes)
        }

        return Response(data)


# ==================== PAGOS ====================

class PagoFacturaViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión de pagos de facturas
    """
    permission_classes = [IsAuthenticated]
    serializer_class = PagoFacturaSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['factura', 'metodo_pago']
    search_fields = ['codigo', 'factura__codigo', 'referencia_pago']
    ordering_fields = ['fecha_pago', 'monto', 'created_at']
    ordering = ['-fecha_pago']

    def get_queryset(self):
        queryset = PagoFactura.objects.select_related(
            'factura',
            'metodo_pago',
            'registrado_por'
        )

        # Filtrar por factura
        factura_id = self.request.query_params.get('factura')
        if factura_id:
            queryset = queryset.filter(factura_id=factura_id)

        # Filtrar por fecha
        fecha_desde = self.request.query_params.get('fecha_desde')
        if fecha_desde:
            queryset = queryset.filter(fecha_pago__gte=fecha_desde)

        fecha_hasta = self.request.query_params.get('fecha_hasta')
        if fecha_hasta:
            queryset = queryset.filter(fecha_pago__lte=fecha_hasta)

        return queryset

    def perform_create(self, serializer):
        serializer.save(
            empresa=get_tenant_empresa(),
            registrado_por=self.request.user,
            created_by=self.request.user,
            updated_by=self.request.user
        )

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)
