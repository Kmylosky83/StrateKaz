"""
Views para Producto Terminado - Production Ops
Sistema de Gestión Grasas y Huesos del Norte

ViewSets para gestión de producto terminado, liberación de calidad y certificados.

Autor: Sistema de Gestión
Fecha: 2025-12-28
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum, Q, Count
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal

from .models import (
    TipoProducto,
    EstadoLote,
    ProductoTerminado,
    StockProducto,
    Liberacion,
    CertificadoCalidad
)
from .serializers import (
    TipoProductoSerializer,
    EstadoLoteSerializer,
    ProductoTerminadoSerializer,
    ProductoTerminadoListSerializer,
    StockProductoSerializer,
    StockProductoListSerializer,
    StockProductoCreateSerializer,
    ReservarCantidadSerializer,
    LiberarReservaSerializer,
    LiberacionSerializer,
    LiberacionListSerializer,
    LiberacionCreateSerializer,
    AprobarLiberacionSerializer,
    RechazarLiberacionSerializer,
    CertificadoCalidadSerializer,
    CertificadoCalidadListSerializer,
    CertificadoCalidadCreateSerializer,
)


# ==============================================================================
# VIEWSETS DE CATÁLOGOS
# ==============================================================================

class TipoProductoViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión de tipos de producto terminado.

    list: Lista todos los tipos de producto
    create: Crea un nuevo tipo de producto
    retrieve: Obtiene un tipo de producto específico
    update: Actualiza un tipo de producto
    partial_update: Actualiza parcialmente un tipo de producto
    destroy: Elimina un tipo de producto
    """
    queryset = TipoProducto.objects.all()
    serializer_class = TipoProductoSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['activo', 'requiere_certificado', 'requiere_ficha_tecnica']
    search_fields = ['codigo', 'nombre', 'descripcion']
    ordering_fields = ['orden', 'codigo', 'nombre', 'created_at']
    ordering = ['orden', 'nombre']


class EstadoLoteViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión de estados de lote PT.

    list: Lista todos los estados de lote
    create: Crea un nuevo estado de lote
    retrieve: Obtiene un estado de lote específico
    update: Actualiza un estado de lote
    partial_update: Actualiza parcialmente un estado de lote
    destroy: Elimina un estado de lote
    """
    queryset = EstadoLote.objects.all()
    serializer_class = EstadoLoteSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['activo', 'permite_despacho', 'requiere_liberacion']
    search_fields = ['codigo', 'nombre', 'descripcion']
    ordering_fields = ['orden', 'codigo', 'nombre', 'created_at']
    ordering = ['orden', 'nombre']


# ==============================================================================
# VIEWSETS PRINCIPALES
# ==============================================================================

class ProductoTerminadoViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión de productos terminados.

    list: Lista todos los productos terminados
    create: Crea un nuevo producto terminado
    retrieve: Obtiene un producto terminado específico
    update: Actualiza un producto terminado
    partial_update: Actualiza parcialmente un producto terminado
    destroy: Elimina un producto terminado
    """
    queryset = ProductoTerminado.objects.select_related(
        'tipo_producto', 'empresa', 'created_by', 'updated_by'
    ).all()
    permission_classes = [IsAuthenticated]
    filterset_fields = ['tipo_producto', 'is_active', 'moneda']
    search_fields = ['codigo', 'nombre', 'descripcion']
    ordering_fields = ['codigo', 'nombre', 'precio_base', 'created_at']
    ordering = ['codigo']

    def get_serializer_class(self):
        """Retorna el serializer apropiado según la acción."""
        if self.action == 'list':
            return ProductoTerminadoListSerializer
        return ProductoTerminadoSerializer

    def perform_create(self, serializer):
        """Guarda el producto con el usuario y empresa actual."""
        serializer.save(
            created_by=self.request.user,
            updated_by=self.request.user
        )

    def perform_update(self, serializer):
        """Actualiza el producto con el usuario actual."""
        serializer.save(updated_by=self.request.user)


class StockProductoViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión de stock de producto terminado.

    list: Lista todos los stocks de producto
    create: Crea un nuevo registro de stock
    retrieve: Obtiene un stock específico
    update: Actualiza un stock
    partial_update: Actualiza parcialmente un stock
    destroy: Elimina un stock

    Acciones personalizadas:
    - reservar: Reserva una cantidad del stock
    - liberar_reserva: Libera una cantidad reservada
    - por_vencer: Lista stocks próximos a vencer
    - dashboard: Indicadores del inventario de PT
    """
    queryset = StockProducto.objects.select_related(
        'producto', 'producto__tipo_producto', 'estado_lote', 'lote_produccion',
        'empresa', 'created_by', 'updated_by'
    ).all()
    permission_classes = [IsAuthenticated]
    filterset_fields = ['producto', 'estado_lote', 'lote_produccion', 'is_active']
    search_fields = ['codigo_lote_pt', 'producto__nombre', 'producto__codigo', 'ubicacion_almacen']
    ordering_fields = ['fecha_produccion', 'fecha_vencimiento', 'cantidad_disponible', 'valor_total']
    ordering = ['-fecha_produccion']

    def get_serializer_class(self):
        """Retorna el serializer apropiado según la acción."""
        if self.action == 'list':
            return StockProductoListSerializer
        elif self.action == 'create':
            return StockProductoCreateSerializer
        elif self.action == 'reservar':
            return ReservarCantidadSerializer
        elif self.action == 'liberar_reserva':
            return LiberarReservaSerializer
        return StockProductoSerializer

    def perform_create(self, serializer):
        """Guarda el stock con el usuario y empresa actual."""
        serializer.save(
            created_by=self.request.user,
            updated_by=self.request.user
        )

    def perform_update(self, serializer):
        """Actualiza el stock con el usuario actual."""
        serializer.save(updated_by=self.request.user)

    @action(detail=True, methods=['post'])
    def reservar(self, request, pk=None):
        """
        Reserva una cantidad del stock para un pedido.

        POST /producto_terminado/stocks/{id}/reservar/
        Body: {
            "cantidad": 150.500
        }
        """
        stock = self.get_object()
        serializer = self.get_serializer(data=request.data, context={'stock': stock})
        serializer.is_valid(raise_exception=True)

        cantidad = serializer.validated_data['cantidad']

        try:
            stock.reservar_cantidad(cantidad)
            return Response({
                'message': f'Se reservaron {cantidad} {stock.producto.tipo_producto.unidad_medida} exitosamente.',
                'cantidad_disponible': float(stock.cantidad_disponible),
                'cantidad_reservada': float(stock.cantidad_reservada)
            })
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=True, methods=['post'])
    def liberar_reserva(self, request, pk=None):
        """
        Libera una cantidad previamente reservada.

        POST /producto_terminado/stocks/{id}/liberar_reserva/
        Body: {
            "cantidad": 50.000
        }
        """
        stock = self.get_object()
        serializer = self.get_serializer(data=request.data, context={'stock': stock})
        serializer.is_valid(raise_exception=True)

        cantidad = serializer.validated_data['cantidad']

        try:
            stock.liberar_reserva(cantidad)
            return Response({
                'message': f'Se liberaron {cantidad} {stock.producto.tipo_producto.unidad_medida} exitosamente.',
                'cantidad_disponible': float(stock.cantidad_disponible),
                'cantidad_reservada': float(stock.cantidad_reservada)
            })
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=False, methods=['get'])
    def por_vencer(self, request):
        """
        Lista stocks próximos a vencer (menos de 30 días).

        GET /producto_terminado/stocks/por_vencer/?dias=30
        """
        dias = int(request.query_params.get('dias', 30))
        fecha_limite = timezone.now().date() + timedelta(days=dias)

        stocks = self.get_queryset().filter(
            fecha_vencimiento__lte=fecha_limite,
            fecha_vencimiento__gte=timezone.now().date(),
            is_active=True
        ).order_by('fecha_vencimiento')

        serializer = StockProductoListSerializer(stocks, many=True)
        return Response({
            'count': stocks.count(),
            'dias_limite': dias,
            'stocks': serializer.data
        })

    @action(detail=False, methods=['get'])
    def dashboard(self, request):
        """
        Indicadores del inventario de producto terminado.

        GET /producto_terminado/stocks/dashboard/

        Retorna:
        - Total en stock por producto
        - Stock por estado
        - Productos próximos a vencer
        - Valor total del inventario
        """
        empresa_id = request.query_params.get('empresa')

        queryset = self.get_queryset().filter(is_active=True)
        if empresa_id:
            queryset = queryset.filter(empresa_id=empresa_id)

        # Stock total por producto
        stock_por_producto = queryset.values(
            'producto__codigo',
            'producto__nombre'
        ).annotate(
            cantidad_total=Sum('cantidad_disponible'),
            valor_total=Sum('valor_total')
        ).order_by('-cantidad_total')[:10]

        # Stock por estado
        stock_por_estado = queryset.values(
            'estado_lote__nombre',
            'estado_lote__color'
        ).annotate(
            cantidad=Sum('cantidad_disponible'),
            lotes=Count('id')
        ).order_by('estado_lote__orden')

        # Próximos a vencer (30 días)
        fecha_limite = timezone.now().date() + timedelta(days=30)
        proximos_vencer = queryset.filter(
            fecha_vencimiento__lte=fecha_limite,
            fecha_vencimiento__gte=timezone.now().date()
        ).count()

        # Vencidos
        vencidos = queryset.filter(
            fecha_vencimiento__lt=timezone.now().date()
        ).count()

        # Valor total del inventario
        totales = queryset.aggregate(
            valor_total=Sum('valor_total'),
            cantidad_total=Sum('cantidad_disponible'),
            cantidad_reservada=Sum('cantidad_reservada')
        )

        return Response({
            'stock_por_producto': list(stock_por_producto),
            'stock_por_estado': list(stock_por_estado),
            'proximos_vencer': proximos_vencer,
            'vencidos': vencidos,
            'valor_total_inventario': float(totales['valor_total'] or 0),
            'cantidad_total': float(totales['cantidad_total'] or 0),
            'cantidad_reservada': float(totales['cantidad_reservada'] or 0),
        })


class LiberacionViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión de liberaciones de calidad.

    list: Lista todas las liberaciones
    create: Crea una nueva solicitud de liberación
    retrieve: Obtiene una liberación específica
    update: Actualiza una liberación
    partial_update: Actualiza parcialmente una liberación
    destroy: Elimina una liberación

    Acciones personalizadas:
    - aprobar: Aprueba una liberación pendiente
    - rechazar: Rechaza una liberación pendiente
    - pendientes: Lista liberaciones pendientes
    """
    queryset = Liberacion.objects.select_related(
        'stock_producto', 'stock_producto__producto', 'stock_producto__estado_lote',
        'solicitado_por', 'aprobado_por', 'empresa', 'created_by', 'updated_by'
    ).all()
    permission_classes = [IsAuthenticated]
    filterset_fields = ['stock_producto', 'resultado', 'solicitado_por', 'aprobado_por', 'is_active']
    search_fields = ['stock_producto__codigo_lote_pt', 'stock_producto__producto__nombre', 'observaciones']
    ordering_fields = ['fecha_solicitud', 'fecha_liberacion', 'resultado']
    ordering = ['-fecha_solicitud']

    def get_serializer_class(self):
        """Retorna el serializer apropiado según la acción."""
        if self.action == 'list':
            return LiberacionListSerializer
        elif self.action == 'create':
            return LiberacionCreateSerializer
        elif self.action == 'aprobar':
            return AprobarLiberacionSerializer
        elif self.action == 'rechazar':
            return RechazarLiberacionSerializer
        return LiberacionSerializer

    def perform_create(self, serializer):
        """Guarda la liberación con el usuario y empresa actual."""
        serializer.save(
            created_by=self.request.user,
            updated_by=self.request.user
        )

    def perform_update(self, serializer):
        """Actualiza la liberación con el usuario actual."""
        serializer.save(updated_by=self.request.user)

    @action(detail=True, methods=['post'])
    def aprobar(self, request, pk=None):
        """
        Aprueba una liberación pendiente.

        POST /producto_terminado/liberaciones/{id}/aprobar/
        Body: {
            "parametros_evaluados": [
                {"parametro": "Proteína", "valor": "45.2%", "cumple": true},
                {"parametro": "Humedad", "valor": "8.5%", "cumple": true}
            ],
            "observaciones": "Producto cumple con todas las especificaciones"
        }
        """
        liberacion = self.get_object()
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            liberacion.aprobar(
                usuario=request.user,
                observaciones=serializer.validated_data.get('observaciones', ''),
                parametros_evaluados=serializer.validated_data.get('parametros_evaluados')
            )

            return Response({
                'message': 'Liberación aprobada exitosamente',
                'liberacion': LiberacionSerializer(liberacion).data
            })
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=True, methods=['post'])
    def rechazar(self, request, pk=None):
        """
        Rechaza una liberación pendiente.

        POST /producto_terminado/liberaciones/{id}/rechazar/
        Body: {
            "parametros_evaluados": [
                {"parametro": "Proteína", "valor": "38.2%", "cumple": false, "observacion": "Bajo especificación"}
            ],
            "observaciones": "Producto no cumple con especificación de proteína mínima"
        }
        """
        liberacion = self.get_object()
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            liberacion.rechazar(
                usuario=request.user,
                observaciones=serializer.validated_data['observaciones'],
                parametros_evaluados=serializer.validated_data.get('parametros_evaluados')
            )

            return Response({
                'message': 'Liberación rechazada',
                'liberacion': LiberacionSerializer(liberacion).data
            })
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=False, methods=['get'])
    def pendientes(self, request):
        """
        Lista liberaciones pendientes de aprobación.

        GET /producto_terminado/liberaciones/pendientes/
        """
        empresa_id = request.query_params.get('empresa')

        queryset = self.get_queryset().filter(
            resultado='PENDIENTE',
            is_active=True
        )

        if empresa_id:
            queryset = queryset.filter(empresa_id=empresa_id)

        serializer = LiberacionListSerializer(queryset, many=True)
        return Response({
            'count': queryset.count(),
            'liberaciones': serializer.data
        })


class CertificadoCalidadViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión de certificados de calidad.

    list: Lista todos los certificados
    create: Crea un nuevo certificado de calidad
    retrieve: Obtiene un certificado específico
    update: Actualiza un certificado
    partial_update: Actualiza parcialmente un certificado
    destroy: Elimina un certificado
    """
    queryset = CertificadoCalidad.objects.select_related(
        'liberacion', 'liberacion__stock_producto', 'liberacion__stock_producto__producto',
        'emitido_por', 'empresa', 'created_by', 'updated_by'
    ).all()
    permission_classes = [IsAuthenticated]
    filterset_fields = ['liberacion', 'cliente_nombre', 'emitido_por', 'is_active']
    search_fields = ['numero_certificado', 'cliente_nombre', 'observaciones']
    ordering_fields = ['fecha_emision', 'numero_certificado']
    ordering = ['-fecha_emision']

    def get_serializer_class(self):
        """Retorna el serializer apropiado según la acción."""
        if self.action == 'list':
            return CertificadoCalidadListSerializer
        elif self.action == 'create':
            return CertificadoCalidadCreateSerializer
        return CertificadoCalidadSerializer

    def perform_create(self, serializer):
        """Guarda el certificado con el usuario y empresa actual."""
        serializer.save(
            created_by=self.request.user,
            updated_by=self.request.user
        )

    def perform_update(self, serializer):
        """Actualiza el certificado con el usuario actual."""
        serializer.save(updated_by=self.request.user)
