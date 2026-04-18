"""
Views para Gestión de Almacenamiento e Inventario — Supply Chain

TenantModel garantiza aislamiento por schema (django-tenants), por lo que
las querysets no requieren filtrado manual por empresa.

Producto se referencia por FK a catalogo_productos.Producto.
"""
from datetime import timedelta
from decimal import Decimal

from django.db import transaction
from django.db.models import Count, Q, Sum
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.catalogo_productos.models import UnidadMedida

from .models import (
    AlertaStock,
    ConfiguracionStock,
    EstadoInventario,
    Inventario,
    Kardex,
    MovimientoInventario,
    TipoAlerta,
    TipoMovimientoInventario,
)
from .serializers import (
    AjustarInventarioSerializer,
    AlertaStockListSerializer,
    AlertaStockSerializer,
    ConfiguracionStockListSerializer,
    ConfiguracionStockSerializer,
    ConsultaKardexSerializer,
    DashboardInventarioSerializer,
    EstadoInventarioListSerializer,
    EstadoInventarioSerializer,
    InventarioListSerializer,
    InventarioSerializer,
    KardexSerializer,
    MovimientoInventarioListSerializer,
    MovimientoInventarioSerializer,
    RegistrarMovimientoSerializer,
    TipoAlertaListSerializer,
    TipoAlertaSerializer,
    TipoMovimientoInventarioListSerializer,
    TipoMovimientoInventarioSerializer,
    UnidadMedidaListSerializer,
    UnidadMedidaSerializer,
)


# ==============================================================================
# VIEWSETS DE CATÁLOGOS
# ==============================================================================

class TipoMovimientoInventarioViewSet(viewsets.ModelViewSet):
    queryset = TipoMovimientoInventario.objects.all()
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['codigo', 'nombre', 'descripcion']
    filterset_fields = ['afecta_stock', 'is_active']
    ordering_fields = ['orden', 'nombre', 'created_at']
    ordering = ['orden', 'nombre']

    def get_serializer_class(self):
        if self.action == 'list':
            return TipoMovimientoInventarioListSerializer
        return TipoMovimientoInventarioSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        if self.action == 'list':
            queryset = queryset.filter(is_active=True)
        return queryset


class EstadoInventarioViewSet(viewsets.ModelViewSet):
    queryset = EstadoInventario.objects.all()
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['codigo', 'nombre', 'descripcion']
    filterset_fields = ['permite_uso', 'is_active']
    ordering_fields = ['orden', 'nombre', 'created_at']
    ordering = ['orden', 'nombre']

    def get_serializer_class(self):
        if self.action == 'list':
            return EstadoInventarioListSerializer
        return EstadoInventarioSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        if self.action == 'list':
            queryset = queryset.filter(is_active=True)
        return queryset


class TipoAlertaViewSet(viewsets.ModelViewSet):
    queryset = TipoAlerta.objects.all()
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['codigo', 'nombre', 'descripcion']
    filterset_fields = ['prioridad', 'is_active']
    ordering_fields = ['orden', 'nombre', 'prioridad', 'created_at']
    ordering = ['orden', 'nombre']

    def get_serializer_class(self):
        if self.action == 'list':
            return TipoAlertaListSerializer
        return TipoAlertaSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        if self.action == 'list':
            queryset = queryset.filter(is_active=True)
        return queryset


class UnidadMedidaViewSet(viewsets.ModelViewSet):
    queryset = UnidadMedida.objects.all()
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['nombre', 'abreviatura']
    filterset_fields = ['tipo', 'es_base']
    ordering_fields = ['orden', 'nombre', 'created_at']
    ordering = ['orden', 'nombre']

    def get_serializer_class(self):
        if self.action == 'list':
            return UnidadMedidaListSerializer
        return UnidadMedidaSerializer


# ==============================================================================
# VIEWSETS PRINCIPALES
# ==============================================================================

class InventarioViewSet(viewsets.ModelViewSet):
    queryset = Inventario.objects.select_related(
        'almacen', 'producto', 'unidad_medida', 'estado',
    ).all()
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['producto__codigo', 'producto__nombre', 'lote']
    filterset_fields = ['almacen', 'producto', 'estado', 'lote', 'fecha_vencimiento']
    ordering_fields = [
        'producto__nombre', 'cantidad_disponible', 'valor_total',
        'fecha_vencimiento', 'updated_at',
    ]
    ordering = ['-updated_at']

    def get_serializer_class(self):
        if self.action == 'list':
            return InventarioListSerializer
        return InventarioSerializer

    def get_queryset(self):
        queryset = super().get_queryset()

        almacen_id = self.request.query_params.get('almacen_id')
        if almacen_id:
            queryset = queryset.filter(almacen_id=almacen_id)

        bajo_stock = self.request.query_params.get('bajo_stock')
        if bajo_stock == 'true':
            queryset = self._filter_bajo_stock(queryset)

        vencidos = self.request.query_params.get('vencidos')
        if vencidos == 'true':
            queryset = queryset.filter(fecha_vencimiento__lt=timezone.now().date())

        por_vencer = self.request.query_params.get('por_vencer')
        if por_vencer == 'true':
            dias = int(self.request.query_params.get('dias', 30))
            fecha_limite = timezone.now().date() + timedelta(days=dias)
            queryset = queryset.filter(
                fecha_vencimiento__lte=fecha_limite,
                fecha_vencimiento__gte=timezone.now().date(),
            )

        return queryset

    def _filter_bajo_stock(self, queryset):
        """Filtra productos con stock bajo punto de reorden."""
        inventarios_bajos = []
        for inventario in queryset:
            try:
                config = ConfiguracionStock.objects.get(
                    almacen=inventario.almacen,
                    producto=inventario.producto,
                    activo=True,
                )
                if inventario.cantidad_disponible <= config.punto_reorden:
                    inventarios_bajos.append(inventario.id)
            except ConfiguracionStock.DoesNotExist:
                pass
        return queryset.filter(id__in=inventarios_bajos)

    @action(detail=False, methods=['get'], url_path='resumen-por-almacen')
    def resumen_por_almacen(self, request):
        almacen_id = request.query_params.get('almacen_id')
        queryset = self.get_queryset()
        if almacen_id:
            queryset = queryset.filter(almacen_id=almacen_id)
        resumen = queryset.aggregate(
            total_productos=Count('producto', distinct=True),
            cantidad_total=Sum('cantidad_disponible'),
            valor_total=Sum('valor_total'),
        )
        return Response(resumen)

    @action(detail=False, methods=['get'], url_path='productos-criticos')
    def productos_criticos(self, request):
        almacen_id = request.query_params.get('almacen_id')

        bajo_stock = []
        vencidos = []
        por_vencer = []

        queryset = self.get_queryset()
        if almacen_id:
            queryset = queryset.filter(almacen_id=almacen_id)

        for inventario in queryset:
            try:
                config = ConfiguracionStock.objects.get(
                    almacen=inventario.almacen,
                    producto=inventario.producto,
                    activo=True,
                )
                if inventario.cantidad_disponible <= config.punto_reorden:
                    bajo_stock.append({
                        'producto_id': inventario.producto_id,
                        'producto_codigo': inventario.producto.codigo,
                        'producto_nombre': inventario.producto.nombre,
                        'cantidad_actual': float(inventario.cantidad_disponible),
                        'punto_reorden': float(config.punto_reorden),
                    })
            except ConfiguracionStock.DoesNotExist:
                pass

            if inventario.esta_vencido:
                vencidos.append({
                    'producto_id': inventario.producto_id,
                    'producto_codigo': inventario.producto.codigo,
                    'producto_nombre': inventario.producto.nombre,
                    'lote': inventario.lote,
                    'fecha_vencimiento': inventario.fecha_vencimiento,
                })

            if inventario.dias_para_vencer is not None and 0 < inventario.dias_para_vencer <= 30:
                por_vencer.append({
                    'producto_id': inventario.producto_id,
                    'producto_codigo': inventario.producto.codigo,
                    'producto_nombre': inventario.producto.nombre,
                    'lote': inventario.lote,
                    'fecha_vencimiento': inventario.fecha_vencimiento,
                    'dias_restantes': inventario.dias_para_vencer,
                })

        return Response({
            'bajo_stock': bajo_stock,
            'vencidos': vencidos,
            'por_vencer': por_vencer,
        })

    @action(detail=True, methods=['post'])
    def reservar(self, request, pk=None):
        inventario = self.get_object()
        cantidad = Decimal(str(request.data.get('cantidad', 0)))

        if cantidad <= 0:
            return Response(
                {'error': 'La cantidad debe ser mayor a cero'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if cantidad > inventario.cantidad_disponible:
            return Response(
                {'error': 'Cantidad insuficiente en inventario'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        inventario.cantidad_disponible -= cantidad
        inventario.cantidad_reservada += cantidad
        inventario.save()

        return Response({
            'message': 'Cantidad reservada exitosamente',
            'cantidad_disponible': float(inventario.cantidad_disponible),
            'cantidad_reservada': float(inventario.cantidad_reservada),
        })

    @action(detail=True, methods=['post'], url_path='liberar-reserva')
    def liberar_reserva(self, request, pk=None):
        inventario = self.get_object()
        cantidad = Decimal(str(request.data.get('cantidad', 0)))

        if cantidad <= 0:
            return Response(
                {'error': 'La cantidad debe ser mayor a cero'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if cantidad > inventario.cantidad_reservada:
            return Response(
                {'error': 'No hay suficiente cantidad reservada'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        inventario.cantidad_reservada -= cantidad
        inventario.cantidad_disponible += cantidad
        inventario.save()

        return Response({
            'message': 'Reserva liberada exitosamente',
            'cantidad_disponible': float(inventario.cantidad_disponible),
            'cantidad_reservada': float(inventario.cantidad_reservada),
        })


class MovimientoInventarioViewSet(viewsets.ModelViewSet):
    queryset = MovimientoInventario.objects.select_related(
        'almacen_origen', 'almacen_destino',
        'tipo_movimiento', 'producto', 'unidad_medida', 'registrado_por',
    ).all()
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = [
        'codigo', 'producto__codigo', 'producto__nombre', 'documento_referencia',
    ]
    filterset_fields = [
        'tipo_movimiento', 'almacen_origen', 'almacen_destino',
        'producto', 'fecha_movimiento',
    ]
    ordering_fields = ['fecha_movimiento', 'created_at', 'codigo']
    ordering = ['-fecha_movimiento', '-created_at']

    def get_serializer_class(self):
        if self.action == 'list':
            return MovimientoInventarioListSerializer
        return MovimientoInventarioSerializer

    def perform_create(self, serializer):
        serializer.save(registrado_por=self.request.user)

    @action(detail=False, methods=['post'], url_path='registrar-movimiento')
    @transaction.atomic
    def registrar_movimiento(self, request):
        """Registra un movimiento y actualiza automáticamente inventario + kardex."""
        serializer = RegistrarMovimientoSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        movimiento = MovimientoInventario.objects.create(
            tipo_movimiento=data['tipo_movimiento'],
            almacen_origen=data.get('almacen_origen'),
            almacen_destino=data.get('almacen_destino'),
            producto=data['producto'],
            lote=data.get('lote', ''),
            cantidad=data['cantidad'],
            unidad_medida=data['unidad_medida'],
            costo_unitario=data.get('costo_unitario', Decimal('0.00')),
            documento_referencia=data.get('documento_referencia', ''),
            observaciones=data.get('observaciones', ''),
            registrado_por=request.user,
        )

        self._actualizar_inventario(movimiento)
        self._crear_kardex(movimiento)
        self._generar_alertas_automaticas(movimiento)

        return Response(
            {
                'message': 'Movimiento registrado exitosamente',
                'movimiento': MovimientoInventarioSerializer(movimiento).data,
            },
            status=status.HTTP_201_CREATED,
        )

    def _actualizar_inventario(self, movimiento):
        tipo = movimiento.tipo_movimiento
        almacen = (
            movimiento.almacen_destino if tipo.afecta_stock == 'POSITIVO'
            else movimiento.almacen_origen
        )
        if not almacen:
            return

        estado_disponible = EstadoInventario.objects.filter(
            codigo='DISPONIBLE', is_active=True,
        ).first()
        if not estado_disponible:
            return

        inventario, created = Inventario.objects.get_or_create(
            almacen=almacen,
            producto=movimiento.producto,
            lote=movimiento.lote or '',
            estado=estado_disponible,
            defaults={
                'unidad_medida': movimiento.unidad_medida,
                'costo_unitario': movimiento.costo_unitario,
                'costo_promedio': movimiento.costo_unitario,
                'cantidad_disponible': Decimal('0'),
            },
        )

        if tipo.afecta_stock == 'POSITIVO':
            inventario.actualizar_costo_promedio(
                movimiento.cantidad, movimiento.costo_unitario,
            )
            inventario.cantidad_disponible += movimiento.cantidad
        elif tipo.afecta_stock == 'NEGATIVO':
            inventario.cantidad_disponible -= movimiento.cantidad

        inventario.costo_unitario = movimiento.costo_unitario
        inventario.save()

    def _crear_kardex(self, movimiento):
        tipo = movimiento.tipo_movimiento
        almacen = (
            movimiento.almacen_destino if tipo.afecta_stock == 'POSITIVO'
            else movimiento.almacen_origen
        )
        if not almacen:
            return

        estado_disponible = EstadoInventario.objects.filter(
            codigo='DISPONIBLE', is_active=True,
        ).first()

        inventario = Inventario.objects.filter(
            almacen=almacen,
            producto=movimiento.producto,
            lote=movimiento.lote or '',
            estado=estado_disponible,
        ).first()
        if not inventario:
            return

        ultimo_kardex = Kardex.objects.filter(
            inventario=inventario,
        ).order_by('-fecha').first()

        saldo_anterior = ultimo_kardex.saldo_cantidad if ultimo_kardex else Decimal('0')
        costo_saldo_anterior = ultimo_kardex.saldo_costo if ultimo_kardex else Decimal('0')

        if tipo.afecta_stock == 'POSITIVO':
            cantidad_entrada = movimiento.cantidad
            cantidad_salida = Decimal('0')
            costo_entrada = movimiento.costo_total
            costo_salida = Decimal('0')
        elif tipo.afecta_stock == 'NEGATIVO':
            cantidad_entrada = Decimal('0')
            cantidad_salida = movimiento.cantidad
            costo_entrada = Decimal('0')
            costo_salida = movimiento.cantidad * inventario.costo_promedio
        else:
            cantidad_entrada = Decimal('0')
            cantidad_salida = Decimal('0')
            costo_entrada = Decimal('0')
            costo_salida = Decimal('0')

        saldo_cantidad = saldo_anterior + cantidad_entrada - cantidad_salida
        saldo_costo = costo_saldo_anterior + costo_entrada - costo_salida

        Kardex.objects.create(
            inventario=inventario,
            movimiento=movimiento,
            fecha=movimiento.fecha_movimiento,
            cantidad_entrada=cantidad_entrada,
            cantidad_salida=cantidad_salida,
            saldo_cantidad=saldo_cantidad,
            costo_entrada=costo_entrada,
            costo_salida=costo_salida,
            saldo_costo=saldo_costo,
            costo_unitario=movimiento.costo_unitario,
        )

    def _generar_alertas_automaticas(self, movimiento):
        tipo = movimiento.tipo_movimiento
        almacen = (
            movimiento.almacen_destino if tipo.afecta_stock == 'POSITIVO'
            else movimiento.almacen_origen
        )
        if not almacen:
            return

        try:
            config = ConfiguracionStock.objects.get(
                almacen=almacen,
                producto=movimiento.producto,
                activo=True,
            )
        except ConfiguracionStock.DoesNotExist:
            return

        inventarios = Inventario.objects.filter(
            almacen=almacen, producto=movimiento.producto,
        )
        total_disponible = inventarios.aggregate(
            total=Sum('cantidad_disponible'),
        )['total'] or Decimal('0')

        tipo_alerta_stock_min = TipoAlerta.objects.filter(
            codigo='STOCK_MINIMO', is_active=True,
        ).first()

        if total_disponible <= config.stock_minimo and tipo_alerta_stock_min:
            for inv in inventarios:
                AlertaStock.objects.get_or_create(
                    almacen=almacen,
                    inventario=inv,
                    tipo_alerta=tipo_alerta_stock_min,
                    leida=False,
                    resuelta=False,
                    defaults={
                        'mensaje': (
                            f'Stock por debajo del mínimo: {total_disponible} '
                            f'(mínimo: {config.stock_minimo})'
                        ),
                        'criticidad': 'ALTA',
                    },
                )

    @action(detail=False, methods=['get'], url_path='ultimos-movimientos')
    def ultimos_movimientos(self, request):
        limite = int(request.query_params.get('limite', 10))
        almacen_id = request.query_params.get('almacen_id')

        queryset = self.get_queryset()
        if almacen_id:
            queryset = queryset.filter(
                Q(almacen_origen_id=almacen_id) | Q(almacen_destino_id=almacen_id),
            )

        movimientos = queryset[:limite]
        serializer = MovimientoInventarioListSerializer(movimientos, many=True)
        return Response(serializer.data)


class KardexViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Kardex.objects.select_related(
        'inventario', 'inventario__producto',
        'movimiento', 'movimiento__tipo_movimiento',
    ).all()
    serializer_class = KardexSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['inventario', 'movimiento']
    ordering_fields = ['fecha']
    ordering = ['fecha']

    @action(detail=False, methods=['post'])
    def consultar(self, request):
        serializer = ConsultaKardexSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        queryset = self.get_queryset()

        if 'almacen' in data and data.get('almacen') is not None:
            queryset = queryset.filter(inventario__almacen=data['almacen'])
        if 'producto' in data and data.get('producto') is not None:
            queryset = queryset.filter(inventario__producto=data['producto'])
        if 'fecha_inicio' in data:
            queryset = queryset.filter(fecha__gte=data['fecha_inicio'])
        if 'fecha_fin' in data:
            queryset = queryset.filter(fecha__lte=data['fecha_fin'])

        kardex = queryset.order_by('fecha')
        serializer = KardexSerializer(kardex, many=True)
        return Response(serializer.data)


class AlertaStockViewSet(viewsets.ModelViewSet):
    queryset = AlertaStock.objects.select_related(
        'almacen', 'inventario', 'inventario__producto',
        'tipo_alerta', 'resuelta_por',
    ).all()
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['mensaje', 'inventario__producto__nombre']
    filterset_fields = ['tipo_alerta', 'almacen', 'criticidad', 'leida', 'resuelta']
    ordering_fields = ['fecha_generacion', 'criticidad']
    ordering = ['-fecha_generacion']

    def get_serializer_class(self):
        if self.action == 'list':
            return AlertaStockListSerializer
        return AlertaStockSerializer

    @action(detail=True, methods=['post'], url_path='marcar-leida')
    def marcar_leida(self, request, pk=None):
        alerta = self.get_object()
        alerta.marcar_como_leida(request.user)
        return Response({
            'message': 'Alerta marcada como leída',
            'fecha_lectura': alerta.fecha_lectura,
        })

    @action(detail=True, methods=['post'])
    def resolver(self, request, pk=None):
        alerta = self.get_object()
        observaciones = request.data.get('observaciones', '')
        alerta.resolver(request.user, observaciones)
        return Response({
            'message': 'Alerta resuelta',
            'fecha_resolucion': alerta.fecha_resolucion,
        })

    @action(detail=False, methods=['get'])
    def pendientes(self, request):
        queryset = self.get_queryset().filter(resuelta=False)
        serializer = AlertaStockListSerializer(queryset, many=True)
        return Response(serializer.data)


class ConfiguracionStockViewSet(viewsets.ModelViewSet):
    queryset = ConfiguracionStock.objects.select_related('almacen', 'producto').all()
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['producto__codigo', 'producto__nombre']
    filterset_fields = ['almacen', 'producto', 'activo']
    ordering_fields = ['producto__nombre', 'updated_at']
    ordering = ['producto__nombre']

    def get_serializer_class(self):
        if self.action == 'list':
            return ConfiguracionStockListSerializer
        return ConfiguracionStockSerializer

    @action(detail=False, methods=['post'], url_path='generar-alertas')
    def generar_alertas(self, request):
        configuraciones = self.get_queryset().filter(activo=True)
        alertas_generadas = 0

        for config in configuraciones:
            inventarios = Inventario.objects.filter(
                almacen=config.almacen, producto=config.producto,
            )
            total_disponible = inventarios.aggregate(
                total=Sum('cantidad_disponible'),
            )['total'] or Decimal('0')

            if total_disponible <= config.stock_minimo:
                tipo_alerta = TipoAlerta.objects.filter(
                    codigo='STOCK_MINIMO', is_active=True,
                ).first()
                if tipo_alerta:
                    for inv in inventarios:
                        _, created = AlertaStock.objects.get_or_create(
                            almacen=config.almacen,
                            inventario=inv,
                            tipo_alerta=tipo_alerta,
                            resuelta=False,
                            defaults={
                                'mensaje': (
                                    f'Stock por debajo del mínimo: {total_disponible} '
                                    f'(mínimo: {config.stock_minimo})'
                                ),
                                'criticidad': 'ALTA',
                            },
                        )
                        if created:
                            alertas_generadas += 1

            for inv in inventarios:
                if (
                    inv.dias_para_vencer is not None
                    and 0 < inv.dias_para_vencer <= config.dias_alerta_vencimiento
                ):
                    tipo_alerta = TipoAlerta.objects.filter(
                        codigo='VENCIMIENTO', is_active=True,
                    ).first()
                    if tipo_alerta:
                        _, created = AlertaStock.objects.get_or_create(
                            almacen=config.almacen,
                            inventario=inv,
                            tipo_alerta=tipo_alerta,
                            resuelta=False,
                            defaults={
                                'mensaje': (
                                    f'Producto por vencer en {inv.dias_para_vencer} días '
                                    f'(lote: {inv.lote})'
                                ),
                                'criticidad': (
                                    'MEDIA' if inv.dias_para_vencer > 15 else 'ALTA'
                                ),
                            },
                        )
                        if created:
                            alertas_generadas += 1

        return Response({
            'message': f'{alertas_generadas} alertas generadas',
            'total_configuraciones_revisadas': configuraciones.count(),
        })


# ==============================================================================
# VIEWSET DE DASHBOARD
# ==============================================================================

class DashboardInventarioViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['get'])
    def estadisticas(self, request):
        almacen_id = request.query_params.get('almacen_id')

        queryset = Inventario.objects.all()
        if almacen_id:
            queryset = queryset.filter(almacen_id=almacen_id)

        total_productos = queryset.values('producto').distinct().count()
        valor_total = queryset.aggregate(total=Sum('valor_total'))['total'] or Decimal('0')

        vencidos = queryset.filter(
            fecha_vencimiento__lt=timezone.now().date(),
        ).count()

        fecha_limite = timezone.now().date() + timedelta(days=30)
        por_vencer = queryset.filter(
            fecha_vencimiento__lte=fecha_limite,
            fecha_vencimiento__gte=timezone.now().date(),
        ).count()

        alertas_qs = AlertaStock.objects.filter(resuelta=False)
        if almacen_id:
            alertas_qs = alertas_qs.filter(almacen_id=almacen_id)
        alertas_pendientes = alertas_qs.count()

        primer_dia_mes = timezone.now().replace(day=1).date()
        movimientos_qs = MovimientoInventario.objects.filter(
            fecha_movimiento__gte=primer_dia_mes,
        )
        if almacen_id:
            movimientos_qs = movimientos_qs.filter(
                Q(almacen_origen_id=almacen_id) | Q(almacen_destino_id=almacen_id),
            )
        movimientos_mes = movimientos_qs.count()

        productos_bajo_stock = 0
        configs = ConfiguracionStock.objects.filter(activo=True)
        if almacen_id:
            configs = configs.filter(almacen_id=almacen_id)

        for config in configs:
            total_disponible = Inventario.objects.filter(
                almacen=config.almacen, producto=config.producto,
            ).aggregate(total=Sum('cantidad_disponible'))['total'] or Decimal('0')
            if total_disponible <= config.punto_reorden:
                productos_bajo_stock += 1

        data = {
            'total_productos': total_productos,
            'valor_total_inventario': float(valor_total),
            'productos_bajo_stock': productos_bajo_stock,
            'productos_vencidos': vencidos,
            'productos_por_vencer': por_vencer,
            'alertas_pendientes': alertas_pendientes,
            'movimientos_mes': movimientos_mes,
        }
        serializer = DashboardInventarioSerializer(data)
        return Response(serializer.data)
