"""
Views para Tesorería - Admin Finance
Sistema de Gestión StrateKaz
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum, Q, Count
from decimal import Decimal
from datetime import datetime, timedelta
from django.utils import timezone

from apps.core.mixins import StandardViewSetMixin
from apps.core.base_models.mixins import get_tenant_empresa
from .models import (
    Banco, CuentaPorPagar, CuentaPorCobrar,
    FlujoCaja, Pago, Recaudo
)
from .serializers import (
    BancoSerializer, BancoListSerializer,
    CuentaPorPagarSerializer, CuentaPorPagarListSerializer,
    CuentaPorCobrarSerializer, CuentaPorCobrarListSerializer,
    FlujoCajaSerializer, FlujoCajaListSerializer,
    PagoSerializer, PagoListSerializer,
    RecaudoSerializer, RecaudoListSerializer
)


class BancoViewSet(StandardViewSetMixin, viewsets.ModelViewSet):
    """
    ViewSet para gestión de bancos/cuentas bancarias.

    list: Listar bancos de la empresa
    create: Crear nuevo banco
    retrieve: Ver detalle de banco
    update: Actualizar banco
    partial_update: Actualizar parcialmente banco
    destroy: Eliminar banco (soft delete)
    saldos: Resumen de saldos de todas las cuentas
    """
    queryset = Banco.objects.all()
    permission_classes = [IsAuthenticated]
    filterset_fields = ['estado', 'tipo_cuenta', 'entidad_bancaria']
    search_fields = ['nombre_cuenta', 'numero_cuenta', 'entidad_bancaria']
    ordering_fields = ['saldo_actual', 'saldo_disponible', 'created_at']
    ordering = ['-created_at']

    def get_serializer_class(self):
        if self.action == 'list':
            return BancoListSerializer
        return BancoSerializer

    @action(detail=False, methods=['get'])
    def saldos(self, request):
        """Resumen consolidado de saldos."""
        empresa = get_tenant_empresa()
        bancos = Banco.objects.filter(empresa=empresa, estado='activo', is_active=True)

        totales = bancos.aggregate(
            saldo_total=Sum('saldo_actual'),
            saldo_disponible_total=Sum('saldo_disponible')
        )

        return Response({
            'total_bancos': bancos.count(),
            'saldo_total': totales['saldo_total'] or Decimal('0.00'),
            'saldo_disponible': totales['saldo_disponible_total'] or Decimal('0.00'),
            'saldo_comprometido': (totales['saldo_total'] or Decimal('0.00')) - (totales['saldo_disponible_total'] or Decimal('0.00')),
            'bancos': BancoListSerializer(bancos, many=True).data
        })


class CuentaPorPagarViewSet(StandardViewSetMixin, viewsets.ModelViewSet):
    """
    ViewSet para gestión de cuentas por pagar.

    list: Listar cuentas por pagar
    create: Crear cuenta por pagar
    retrieve: Ver detalle
    update: Actualizar cuenta
    partial_update: Actualizar parcialmente
    destroy: Eliminar cuenta (soft delete)
    vencidas: Listar cuentas vencidas
    por_vencer: Listar cuentas próximas a vencer
    estadisticas: Estadísticas de cuentas por pagar
    """
    queryset = CuentaPorPagar.objects.all()
    permission_classes = [IsAuthenticated]
    filterset_fields = ['estado', 'proveedor_id']
    search_fields = ['codigo', 'concepto']
    ordering_fields = ['fecha_vencimiento', 'monto_total', 'created_at']
    ordering = ['fecha_vencimiento']

    def get_serializer_class(self):
        if self.action == 'list':
            return CuentaPorPagarListSerializer
        return CuentaPorPagarSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        queryset = queryset.select_related('proveedor', 'orden_compra', 'liquidacion_nomina')
        return queryset

    @action(detail=False, methods=['get'])
    def vencidas(self, request):
        """Listar cuentas vencidas."""
        empresa = get_tenant_empresa()
        vencidas = CuentaPorPagar.objects.filter(
            empresa=empresa,
            estado__in=['pendiente', 'parcial'],
            fecha_vencimiento__lt=timezone.now().date(),
            is_active=True
        ).select_related('proveedor')

        serializer = CuentaPorPagarListSerializer(vencidas, many=True)
        return Response({
            'count': vencidas.count(),
            'total': sum(c.saldo_pendiente for c in vencidas),
            'results': serializer.data
        })

    @action(detail=False, methods=['get'], url_path='por-vencer')
    def por_vencer(self, request):
        """Listar cuentas próximas a vencer (próximos 7 días)."""
        empresa = get_tenant_empresa()
        hoy = timezone.now().date()
        fecha_limite = hoy + timedelta(days=7)

        por_vencer = CuentaPorPagar.objects.filter(
            empresa=empresa,
            estado__in=['pendiente', 'parcial'],
            fecha_vencimiento__range=[hoy, fecha_limite],
            is_active=True
        ).select_related('proveedor')

        serializer = CuentaPorPagarListSerializer(por_vencer, many=True)
        return Response({
            'count': por_vencer.count(),
            'total': sum(c.saldo_pendiente for c in por_vencer),
            'results': serializer.data
        })

    @action(detail=False, methods=['get'])
    def estadisticas(self, request):
        """Estadísticas de cuentas por pagar."""
        empresa = get_tenant_empresa()
        cuentas = CuentaPorPagar.objects.filter(empresa=empresa, is_active=True)

        return Response({
            'total_cuentas': cuentas.count(),
            'pendientes': cuentas.filter(estado='pendiente').count(),
            'parciales': cuentas.filter(estado='parcial').count(),
            'vencidas': cuentas.filter(estado='vencida').count(),
            'pagadas': cuentas.filter(estado='pagada').count(),
            'monto_total_pendiente': sum(c.saldo_pendiente for c in cuentas if c.estado in ['pendiente', 'parcial', 'vencida']),
        })


class CuentaPorCobrarViewSet(StandardViewSetMixin, viewsets.ModelViewSet):
    """
    ViewSet para gestión de cuentas por cobrar.

    list: Listar cuentas por cobrar
    create: Crear cuenta por cobrar
    retrieve: Ver detalle
    update: Actualizar cuenta
    partial_update: Actualizar parcialmente
    destroy: Eliminar cuenta (soft delete)
    vencidas: Listar cuentas vencidas
    por_vencer: Listar cuentas próximas a vencer
    estadisticas: Estadísticas de cuentas por cobrar
    """
    queryset = CuentaPorCobrar.objects.all()
    permission_classes = [IsAuthenticated]
    filterset_fields = ['estado', 'cliente_id']
    search_fields = ['codigo', 'concepto']
    ordering_fields = ['fecha_vencimiento', 'monto_total', 'created_at']
    ordering = ['fecha_vencimiento']

    def get_serializer_class(self):
        if self.action == 'list':
            return CuentaPorCobrarListSerializer
        return CuentaPorCobrarSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        queryset = queryset.select_related('cliente', 'factura')
        return queryset

    @action(detail=False, methods=['get'])
    def vencidas(self, request):
        """Listar cuentas vencidas."""
        empresa = get_tenant_empresa()
        vencidas = CuentaPorCobrar.objects.filter(
            empresa=empresa,
            estado__in=['pendiente', 'parcial'],
            fecha_vencimiento__lt=timezone.now().date(),
            is_active=True
        ).select_related('cliente')

        serializer = CuentaPorCobrarListSerializer(vencidas, many=True)
        return Response({
            'count': vencidas.count(),
            'total': sum(c.saldo_pendiente for c in vencidas),
            'results': serializer.data
        })

    @action(detail=False, methods=['get'], url_path='por-vencer')
    def por_vencer(self, request):
        """Listar cuentas próximas a vencer (próximos 7 días)."""
        empresa = get_tenant_empresa()
        hoy = timezone.now().date()
        fecha_limite = hoy + timedelta(days=7)

        por_vencer = CuentaPorCobrar.objects.filter(
            empresa=empresa,
            estado__in=['pendiente', 'parcial'],
            fecha_vencimiento__range=[hoy, fecha_limite],
            is_active=True
        ).select_related('cliente')

        serializer = CuentaPorCobrarListSerializer(por_vencer, many=True)
        return Response({
            'count': por_vencer.count(),
            'total': sum(c.saldo_pendiente for c in por_vencer),
            'results': serializer.data
        })

    @action(detail=False, methods=['get'])
    def estadisticas(self, request):
        """Estadísticas de cuentas por cobrar."""
        empresa = get_tenant_empresa()
        cuentas = CuentaPorCobrar.objects.filter(empresa=empresa, is_active=True)

        return Response({
            'total_cuentas': cuentas.count(),
            'pendientes': cuentas.filter(estado='pendiente').count(),
            'parciales': cuentas.filter(estado='parcial').count(),
            'vencidas': cuentas.filter(estado='vencida').count(),
            'cobradas': cuentas.filter(estado='pagada').count(),
            'monto_total_pendiente': sum(c.saldo_pendiente for c in cuentas if c.estado in ['pendiente', 'parcial', 'vencida']),
        })


class FlujoCajaViewSet(StandardViewSetMixin, viewsets.ModelViewSet):
    """
    ViewSet para gestión de flujo de caja.

    list: Listar flujos de caja
    create: Crear flujo de caja
    retrieve: Ver detalle
    update: Actualizar flujo
    partial_update: Actualizar parcialmente
    destroy: Eliminar flujo (soft delete)
    resumen_periodo: Resumen de flujo por período
    """
    queryset = FlujoCaja.objects.all()
    permission_classes = [IsAuthenticated]
    filterset_fields = ['tipo', 'banco']
    search_fields = ['codigo', 'concepto']
    ordering_fields = ['fecha', 'monto_proyectado', 'created_at']
    ordering = ['-fecha']

    def get_serializer_class(self):
        if self.action == 'list':
            return FlujoCajaListSerializer
        return FlujoCajaSerializer

    @action(detail=False, methods=['get'], url_path='resumen-periodo')
    def resumen_periodo(self, request):
        """Resumen de flujo de caja por período."""
        empresa = get_tenant_empresa()
        fecha_inicio = request.query_params.get('fecha_inicio')
        fecha_fin = request.query_params.get('fecha_fin')

        if not fecha_inicio or not fecha_fin:
            return Response(
                {'error': 'Debe especificar fecha_inicio y fecha_fin'},
                status=status.HTTP_400_BAD_REQUEST
            )

        flujos = FlujoCaja.objects.filter(
            empresa=empresa,
            fecha__range=[fecha_inicio, fecha_fin],
            is_active=True
        )

        ingresos = flujos.filter(tipo='ingreso')
        egresos = flujos.filter(tipo='egreso')

        return Response({
            'periodo': {'inicio': fecha_inicio, 'fin': fecha_fin},
            'ingresos': {
                'proyectado': sum(i.monto_proyectado for i in ingresos),
                'real': sum(i.monto_real for i in ingresos),
            },
            'egresos': {
                'proyectado': sum(e.monto_proyectado for e in egresos),
                'real': sum(e.monto_real for e in egresos),
            },
            'neto': {
                'proyectado': sum(i.monto_proyectado for i in ingresos) - sum(e.monto_proyectado for e in egresos),
                'real': sum(i.monto_real for i in ingresos) - sum(e.monto_real for e in egresos),
            }
        })


class PagoViewSet(StandardViewSetMixin, viewsets.ModelViewSet):
    """
    ViewSet para gestión de pagos.

    list: Listar pagos realizados
    create: Registrar nuevo pago
    retrieve: Ver detalle de pago
    update: Actualizar pago
    partial_update: Actualizar parcialmente
    destroy: Eliminar pago (soft delete)
    """
    queryset = Pago.objects.all()
    permission_classes = [IsAuthenticated]
    filterset_fields = ['banco', 'metodo_pago', 'cuenta_por_pagar']
    search_fields = ['codigo', 'referencia']
    ordering_fields = ['fecha_pago', 'monto', 'created_at']
    ordering = ['-fecha_pago']

    def get_serializer_class(self):
        if self.action == 'list':
            return PagoListSerializer
        return PagoSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        queryset = queryset.select_related('cuenta_por_pagar', 'banco', 'cuenta_por_pagar__proveedor')
        return queryset


class RecaudoViewSet(StandardViewSetMixin, viewsets.ModelViewSet):
    """
    ViewSet para gestión de recaudos.

    list: Listar recaudos recibidos
    create: Registrar nuevo recaudo
    retrieve: Ver detalle de recaudo
    update: Actualizar recaudo
    partial_update: Actualizar parcialmente
    destroy: Eliminar recaudo (soft delete)
    """
    queryset = Recaudo.objects.all()
    permission_classes = [IsAuthenticated]
    filterset_fields = ['banco', 'metodo_pago', 'cuenta_por_cobrar']
    search_fields = ['codigo', 'referencia']
    ordering_fields = ['fecha_recaudo', 'monto', 'created_at']
    ordering = ['-fecha_recaudo']

    def get_serializer_class(self):
        if self.action == 'list':
            return RecaudoListSerializer
        return RecaudoSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        queryset = queryset.select_related('cuenta_por_cobrar', 'banco', 'cuenta_por_cobrar__cliente')
        return queryset
