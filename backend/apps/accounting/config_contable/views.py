"""
Views para config_contable - accounting
Sistema de Gestión Grasas y Huesos del Norte
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.db.models import Count, Q

from .models import (
    PlanCuentas, CuentaContable, TipoDocumentoContable,
    Tercero, CentroCostoContable, ConfiguracionModulo
)
from .serializers import (
    PlanCuentasListSerializer, PlanCuentasSerializer,
    CuentaContableListSerializer, CuentaContableSerializer, CuentaContableTreeSerializer,
    TipoDocumentoContableListSerializer, TipoDocumentoContableSerializer,
    TerceroListSerializer, TerceroSerializer,
    CentroCostoContableListSerializer, CentroCostoContableSerializer, CentroCostoContableTreeSerializer,
    ConfiguracionModuloSerializer
)


class PlanCuentasViewSet(viewsets.ModelViewSet):
    """ViewSet para gestión de Planes de Cuentas PUC."""
    queryset = PlanCuentas.objects.select_related('empresa').annotate(total_cuentas=Count('cuentas')).filter(is_active=True)
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['empresa', 'tipo_plan', 'es_activo']
    search_fields = ['nombre', 'version']
    ordering_fields = ['nombre', 'fecha_inicio_vigencia', 'created_at']
    ordering = ['-fecha_inicio_vigencia']

    def get_serializer_class(self):
        if self.action == 'list':
            return PlanCuentasListSerializer
        return PlanCuentasSerializer

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)

    @action(detail=True, methods=['post'])
    def activar(self, request, pk=None):
        plan = self.get_object()
        PlanCuentas.objects.filter(empresa=plan.empresa, es_activo=True).exclude(pk=plan.pk).update(es_activo=False)
        plan.es_activo = True
        plan.save(update_fields=['es_activo', 'updated_at'])
        return Response({'status': 'activado', 'mensaje': f'Plan {plan.nombre} activado.'})

    @action(detail=True, methods=['get'])
    def cuentas(self, request, pk=None):
        plan = self.get_object()
        cuentas = CuentaContable.objects.filter(plan_cuentas=plan, is_active=True).order_by('codigo')
        serializer = CuentaContableListSerializer(cuentas, many=True)
        return Response(serializer.data)


class CuentaContableViewSet(viewsets.ModelViewSet):
    """ViewSet para gestión de Cuentas Contables PUC."""
    queryset = CuentaContable.objects.select_related('empresa', 'plan_cuentas', 'cuenta_padre').filter(is_active=True)
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['empresa', 'plan_cuentas', 'nivel', 'naturaleza', 'tipo_cuenta', 'clase_cuenta', 'acepta_movimientos']
    search_fields = ['codigo', 'nombre']
    ordering_fields = ['codigo', 'nombre', 'nivel']
    ordering = ['codigo']

    def get_serializer_class(self):
        if self.action == 'list':
            return CuentaContableListSerializer
        if self.action == 'arbol':
            return CuentaContableTreeSerializer
        return CuentaContableSerializer

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)

    @action(detail=False, methods=['get'])
    def arbol(self, request):
        empresa_id = request.query_params.get('empresa')
        plan_id = request.query_params.get('plan_cuentas')
        queryset = self.get_queryset().filter(cuenta_padre__isnull=True)
        if empresa_id:
            queryset = queryset.filter(empresa_id=empresa_id)
        if plan_id:
            queryset = queryset.filter(plan_cuentas_id=plan_id)
        serializer = CuentaContableTreeSerializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def movimientos(self, request):
        queryset = self.get_queryset().filter(acepta_movimientos=True, tipo_cuenta='detalle')
        serializer = CuentaContableListSerializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def subcuentas(self, request, pk=None):
        cuenta = self.get_object()
        subcuentas = cuenta.subcuentas.filter(is_active=True).order_by('codigo')
        serializer = CuentaContableListSerializer(subcuentas, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def saldos(self, request, pk=None):
        cuenta = self.get_object()
        def get_saldos_recursivos(c):
            total_debito = c.saldo_debito
            total_credito = c.saldo_credito
            for sub in c.subcuentas.filter(is_active=True):
                sub_debito, sub_credito = get_saldos_recursivos(sub)
                total_debito += sub_debito
                total_credito += sub_credito
            return total_debito, total_credito
        total_debito, total_credito = get_saldos_recursivos(cuenta)
        saldo_final = total_debito - total_credito if cuenta.naturaleza == 'debito' else total_credito - total_debito
        return Response({'cuenta': cuenta.codigo, 'nombre': cuenta.nombre, 'total_debito': total_debito, 'total_credito': total_credito, 'saldo_final': saldo_final})


class TipoDocumentoContableViewSet(viewsets.ModelViewSet):
    """ViewSet para gestión de Tipos de Documento Contable."""
    queryset = TipoDocumentoContable.objects.select_related('empresa').filter(is_active=True)
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['empresa', 'clase_documento', 'requiere_aprobacion', 'afecta_contabilidad']
    search_fields = ['codigo', 'nombre']
    ordering_fields = ['codigo', 'nombre']
    ordering = ['codigo']

    def get_serializer_class(self):
        if self.action == 'list':
            return TipoDocumentoContableListSerializer
        return TipoDocumentoContableSerializer

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)

    @action(detail=True, methods=['post'])
    def reiniciar_consecutivo(self, request, pk=None):
        tipo = self.get_object()
        nuevo_consecutivo = request.data.get('consecutivo', 0)
        tipo.consecutivo_actual = nuevo_consecutivo
        tipo.save(update_fields=['consecutivo_actual', 'updated_at'])
        return Response({'status': 'reiniciado', 'tipo_documento': tipo.codigo, 'nuevo_consecutivo': tipo.consecutivo_actual})


class TerceroViewSet(viewsets.ModelViewSet):
    """ViewSet para gestión de Terceros Contables."""
    queryset = Tercero.objects.select_related('empresa').filter(is_active=True)
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['empresa', 'tipo_identificacion', 'tipo_tercero', 'tipo_persona', 'regimen', 'responsable_iva']
    search_fields = ['numero_identificacion', 'razon_social', 'nombre_comercial', 'ciudad']
    ordering_fields = ['razon_social', 'numero_identificacion', 'created_at']
    ordering = ['razon_social']

    def get_serializer_class(self):
        if self.action == 'list':
            return TerceroListSerializer
        return TerceroSerializer

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)

    @action(detail=False, methods=['get'])
    def por_tipo(self, request):
        tipo = request.query_params.get('tipo')
        if not tipo:
            return Response({'error': 'Debe especificar el parámetro tipo'}, status=status.HTTP_400_BAD_REQUEST)
        queryset = self.get_queryset().filter(tipo_tercero=tipo)
        serializer = TerceroListSerializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def buscar(self, request):
        q = request.query_params.get('q', '')
        queryset = self.get_queryset().filter(
            Q(numero_identificacion__icontains=q) | Q(razon_social__icontains=q) | Q(nombre_comercial__icontains=q)
        )[:20]
        serializer = TerceroListSerializer(queryset, many=True)
        return Response(serializer.data)


class CentroCostoContableViewSet(viewsets.ModelViewSet):
    """ViewSet para gestión de Centros de Costo Contables."""
    queryset = CentroCostoContable.objects.select_related('empresa', 'centro_padre', 'responsable').filter(is_active=True)
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['empresa', 'tipo_centro', 'responsable']
    search_fields = ['codigo', 'nombre']
    ordering_fields = ['codigo', 'nombre', 'presupuesto_anual']
    ordering = ['codigo']

    def get_serializer_class(self):
        if self.action == 'list':
            return CentroCostoContableListSerializer
        if self.action == 'arbol':
            return CentroCostoContableTreeSerializer
        return CentroCostoContableSerializer

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)

    @action(detail=False, methods=['get'])
    def arbol(self, request):
        empresa_id = request.query_params.get('empresa')
        queryset = self.get_queryset().filter(centro_padre__isnull=True)
        if empresa_id:
            queryset = queryset.filter(empresa_id=empresa_id)
        serializer = CentroCostoContableTreeSerializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def subcentros(self, request, pk=None):
        centro = self.get_object()
        subcentros = centro.subcentros.filter(is_active=True).order_by('codigo')
        serializer = CentroCostoContableListSerializer(subcentros, many=True)
        return Response(serializer.data)


class ConfiguracionModuloViewSet(viewsets.ModelViewSet):
    """ViewSet para Configuración del Módulo Contable."""
    queryset = ConfiguracionModulo.objects.select_related(
        'empresa', 'plan_cuentas_activo', 'cuenta_utilidad_ejercicio', 'cuenta_perdida_ejercicio', 'cuenta_ganancias_retenidas'
    ).filter(is_active=True)
    serializer_class = ConfiguracionModuloSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['empresa']

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)

    @action(detail=True, methods=['post'])
    def cerrar_periodo(self, request, pk=None):
        config = self.get_object()
        config.ultimo_periodo_cerrado = config.periodo_actual
        config.save(update_fields=['ultimo_periodo_cerrado', 'updated_at'])
        return Response({'status': 'cerrado', 'periodo': config.ultimo_periodo_cerrado})

    @action(detail=True, methods=['post'])
    def abrir_periodo(self, request, pk=None):
        config = self.get_object()
        nuevo_periodo = request.data.get('periodo')
        if not nuevo_periodo:
            return Response({'error': 'Debe especificar el nuevo período (YYYY-MM)'}, status=status.HTTP_400_BAD_REQUEST)
        config.periodo_actual = nuevo_periodo
        config.save(update_fields=['periodo_actual', 'updated_at'])
        return Response({'status': 'abierto', 'periodo': config.periodo_actual})

    @action(detail=True, methods=['get'])
    def estado(self, request, pk=None):
        config = self.get_object()
        return Response({
            'periodo_actual': config.periodo_actual,
            'ultimo_periodo_cerrado': config.ultimo_periodo_cerrado,
            'ejercicio_abierto': config.ejercicio_abierto,
            'fecha_inicio_ejercicio': config.fecha_inicio_ejercicio,
            'fecha_fin_ejercicio': config.fecha_fin_ejercicio,
            'plan_activo': config.plan_cuentas_activo.nombre if config.plan_cuentas_activo else None
        })
