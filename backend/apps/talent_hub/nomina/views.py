"""
Views de Nómina - Talent Hub

ViewSets para la gestión de liquidación de nómina.
Incluye acciones personalizadas para procesos de negocio.
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django.db.models import Sum, Count, Q
from decimal import Decimal

from apps.core.base_models.mixins import get_tenant_empresa
from apps.gestion_estrategica.revision_direccion.services.resumen_mixin import ResumenRevisionMixin

from .models import (
    ConfiguracionNomina,
    ConceptoNomina,
    PeriodoNomina,
    LiquidacionNomina,
    DetalleLiquidacion,
    Prestacion,
    PagoNomina
)
from .serializers import (
    ConfiguracionNominaListSerializer,
    ConfiguracionNominaDetailSerializer,
    ConfiguracionNominaCreateSerializer,
    ConceptoNominaListSerializer,
    ConceptoNominaDetailSerializer,
    ConceptoNominaCreateSerializer,
    PeriodoNominaListSerializer,
    PeriodoNominaDetailSerializer,
    PeriodoNominaCreateSerializer,
    LiquidacionNominaListSerializer,
    LiquidacionNominaDetailSerializer,
    LiquidacionNominaCreateSerializer,
    DetalleLiquidacionListSerializer,
    PrestacionListSerializer,
    PrestacionDetailSerializer,
    PrestacionCreateSerializer,
    PagoNominaListSerializer,
    PagoNominaDetailSerializer,
    PagoNominaCreateSerializer
)


# =============================================================================
# CONFIGURACIÓN DE NÓMINA
# =============================================================================

class ConfiguracionNominaViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión de configuraciones de nómina.

    Acciones:
    - list: Listado de configuraciones
    - retrieve: Detalle de configuración
    - create: Crear nueva configuración
    - update: Actualizar configuración
    - partial_update: Actualización parcial
    - destroy: Eliminación lógica (soft delete)
    """

    queryset = ConfiguracionNomina.objects.all()

    def get_queryset(self):
        """Filtrar configuraciones activas del tenant."""
        return ConfiguracionNomina.objects.filter(
            is_active=True
        ).order_by('-anio')

    def get_serializer_class(self):
        """Serializer según acción."""
        if self.action == 'list':
            return ConfiguracionNominaListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return ConfiguracionNominaCreateSerializer
        return ConfiguracionNominaDetailSerializer

    def perform_create(self, serializer):
        serializer.save(empresa=get_tenant_empresa())

    def perform_destroy(self, instance):
        """Soft delete."""
        instance.soft_delete()


# =============================================================================
# CONCEPTO DE NÓMINA
# =============================================================================

class ConceptoNominaViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión de conceptos de nómina.

    Acciones:
    - list: Listado de conceptos
    - retrieve: Detalle de concepto
    - create: Crear nuevo concepto
    - update: Actualizar concepto
    - partial_update: Actualización parcial
    - destroy: Eliminación lógica
    - devengados: Listar solo conceptos de devengados
    - deducciones: Listar solo conceptos de deducciones
    """

    queryset = ConceptoNomina.objects.all()

    def get_queryset(self):
        """Filtrar conceptos activos del tenant."""
        queryset = ConceptoNomina.objects.filter(
            is_active=True
        )

        # Filtros opcionales
        tipo = self.request.query_params.get('tipo', None)
        if tipo:
            queryset = queryset.filter(tipo=tipo)

        categoria = self.request.query_params.get('categoria', None)
        if categoria:
            queryset = queryset.filter(categoria=categoria)

        return queryset.order_by('tipo', 'orden', 'nombre')

    def get_serializer_class(self):
        """Serializer según acción."""
        if self.action == 'list':
            return ConceptoNominaListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return ConceptoNominaCreateSerializer
        return ConceptoNominaDetailSerializer

    def perform_create(self, serializer):
        serializer.save(empresa=get_tenant_empresa())

    def perform_destroy(self, instance):
        """Soft delete."""
        instance.soft_delete()

    @action(detail=False, methods=['get'])
    def devengados(self, request):
        """Listar solo conceptos de devengados."""
        conceptos = self.get_queryset().filter(tipo='devengado')
        serializer = ConceptoNominaListSerializer(conceptos, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def deducciones(self, request):
        """Listar solo conceptos de deducciones."""
        conceptos = self.get_queryset().filter(tipo='deduccion')
        serializer = ConceptoNominaListSerializer(conceptos, many=True)
        return Response(serializer.data)


# =============================================================================
# PERIODO DE NÓMINA
# =============================================================================

class PeriodoNominaViewSet(ResumenRevisionMixin, viewsets.ModelViewSet):
    """
    ViewSet para gestión de periodos de nómina.

    Acciones personalizadas:
    - preliquidar: Cambiar estado a preliquidado
    - cerrar_periodo: Cerrar periodo (no modificable)
    - estadisticas: Estadísticas del periodo
    """

    queryset = PeriodoNomina.objects.all()

    # ResumenRevisionMixin config
    resumen_date_field = 'created_at'
    resumen_modulo_nombre = 'nomina'

    def get_resumen_data(self, queryset, fecha_desde, fecha_hasta):
        """Resumen de nómina para Revisión por la Dirección."""
        periodos_cerrados = queryset.filter(estado='cerrado').count()
        total_periodos = queryset.count()

        liquidaciones = LiquidacionNomina.objects.filter(
            is_active=True,
            periodo__in=queryset
        )
        total_devengado = liquidaciones.aggregate(
            total=Sum('total_devengado')
        )['total'] or Decimal('0')
        total_deducido = liquidaciones.aggregate(
            total=Sum('total_deducido')
        )['total'] or Decimal('0')
        total_neto = liquidaciones.aggregate(
            total=Sum('total_neto')
        )['total'] or Decimal('0')

        return {
            'periodos_total': total_periodos,
            'periodos_cerrados': periodos_cerrados,
            'total_devengado': str(total_devengado),
            'total_deducido': str(total_deducido),
            'total_neto': str(total_neto),
        }

    def get_queryset(self):
        """Filtrar periodos activos del tenant."""
        queryset = PeriodoNomina.objects.filter(
            is_active=True
        )

        # Filtros opcionales
        anio = self.request.query_params.get('anio', None)
        if anio:
            queryset = queryset.filter(anio=anio)

        estado = self.request.query_params.get('estado', None)
        if estado:
            queryset = queryset.filter(estado=estado)

        return queryset.select_related('cerrado_por').order_by('-anio', '-mes', 'tipo')

    def get_serializer_class(self):
        """Serializer según acción."""
        if self.action == 'list':
            return PeriodoNominaListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return PeriodoNominaCreateSerializer
        return PeriodoNominaDetailSerializer

    def perform_create(self, serializer):
        serializer.save(empresa=get_tenant_empresa())

    def perform_destroy(self, instance):
        """Soft delete solo si está abierto."""
        if instance.estado != 'abierto':
            return Response(
                {'error': 'Solo se pueden eliminar periodos en estado abierto.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        instance.soft_delete()

    @action(detail=True, methods=['post'])
    def preliquidar(self, request, pk=None):
        """Cambiar estado del periodo a preliquidado."""
        periodo = self.get_object()

        if periodo.estado != 'abierto':
            return Response(
                {'error': 'Solo se pueden preliquidar periodos abiertos.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Verificar que haya liquidaciones
        if not periodo.liquidaciones.filter(is_active=True).exists():
            return Response(
                {'error': 'El periodo no tiene liquidaciones.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        periodo.estado = 'preliquidado'
        periodo.calcular_totales()
        periodo.save()

        serializer = self.get_serializer(periodo)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], url_path='cerrar-periodo')
    def cerrar_periodo(self, request, pk=None):
        """Cerrar periodo definitivamente."""
        periodo = self.get_object()

        if periodo.estado == 'cerrado':
            return Response(
                {'error': 'El periodo ya está cerrado.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Verificar que todas las liquidaciones estén aprobadas
        liquidaciones_pendientes = periodo.liquidaciones.filter(
            is_active=True
        ).exclude(
            estado__in=['aprobado', 'pagado']
        ).count()

        if liquidaciones_pendientes > 0:
            return Response(
                {'error': f'Hay {liquidaciones_pendientes} liquidaciones sin aprobar.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        periodo.estado = 'cerrado'
        periodo.cerrado_por = request.user
        periodo.fecha_cierre = timezone.now()
        periodo.calcular_totales()
        periodo.save()

        serializer = self.get_serializer(periodo)
        return Response({
            'message': 'Periodo cerrado exitosamente.',
            'periodo': serializer.data
        })

    @action(detail=True, methods=['get'])
    def estadisticas(self, request, pk=None):
        """Obtener estadísticas del periodo."""
        periodo = self.get_object()

        liquidaciones = periodo.liquidaciones.filter(is_active=True)

        stats = {
            'periodo': periodo.nombre_periodo,
            'estado': periodo.get_estado_display(),
            'total_colaboradores': liquidaciones.count(),
            'total_devengados': periodo.total_devengados,
            'total_deducciones': periodo.total_deducciones,
            'total_neto': periodo.total_neto,
            'por_estado': liquidaciones.values('estado').annotate(
                cantidad=Count('id')
            ),
            'salario_promedio': liquidaciones.aggregate(
                promedio=Sum('salario_base')
            )['promedio'] / liquidaciones.count() if liquidaciones.count() > 0 else 0
        }

        return Response(stats)


# =============================================================================
# LIQUIDACIÓN DE NÓMINA
# =============================================================================

class LiquidacionNominaViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión de liquidaciones de nómina.

    Acciones personalizadas:
    - aprobar: Aprobar liquidación
    - pagar: Marcar como pagada
    - recalcular: Recalcular totales
    - duplicar: Duplicar liquidación a otro periodo
    """

    queryset = LiquidacionNomina.objects.all()

    def get_queryset(self):
        """Filtrar liquidaciones activas del tenant."""
        queryset = LiquidacionNomina.objects.filter(
            is_active=True
        ).select_related('periodo', 'colaborador', 'aprobado_por')

        # Filtros opcionales
        periodo_id = self.request.query_params.get('periodo', None)
        if periodo_id:
            queryset = queryset.filter(periodo_id=periodo_id)

        colaborador_id = self.request.query_params.get('colaborador', None)
        if colaborador_id:
            queryset = queryset.filter(colaborador_id=colaborador_id)

        estado = self.request.query_params.get('estado', None)
        if estado:
            queryset = queryset.filter(estado=estado)

        return queryset.order_by('-periodo__anio', '-periodo__mes', 'colaborador__primer_apellido')

    def get_serializer_class(self):
        """Serializer según acción."""
        if self.action == 'list':
            return LiquidacionNominaListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return LiquidacionNominaCreateSerializer
        return LiquidacionNominaDetailSerializer

    def perform_create(self, serializer):
        serializer.save(empresa=get_tenant_empresa())

    def perform_destroy(self, instance):
        """Soft delete solo si está en borrador."""
        if instance.estado != 'borrador':
            return Response(
                {'error': 'Solo se pueden eliminar liquidaciones en borrador.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        instance.soft_delete()

    @action(detail=True, methods=['post'])
    def aprobar(self, request, pk=None):
        """Aprobar liquidación."""
        liquidacion = self.get_object()

        if liquidacion.estado not in ['borrador', 'preliquidado']:
            return Response(
                {'error': 'Solo se pueden aprobar liquidaciones en borrador o preliquidadas.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        liquidacion.estado = 'aprobado'
        liquidacion.aprobado_por = request.user
        liquidacion.fecha_aprobacion = timezone.now()
        liquidacion.save()

        serializer = self.get_serializer(liquidacion)
        return Response({
            'message': 'Liquidación aprobada exitosamente.',
            'liquidacion': serializer.data
        })

    @action(detail=True, methods=['post'])
    def pagar(self, request, pk=None):
        """Marcar liquidación como pagada."""
        liquidacion = self.get_object()

        if liquidacion.estado != 'aprobado':
            return Response(
                {'error': 'Solo se pueden pagar liquidaciones aprobadas.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        liquidacion.estado = 'pagado'
        liquidacion.save()

        # Actualizar totales del periodo
        liquidacion.periodo.calcular_totales()

        serializer = self.get_serializer(liquidacion)
        return Response({
            'message': 'Liquidación marcada como pagada.',
            'liquidacion': serializer.data
        })

    @action(detail=True, methods=['post'])
    def recalcular(self, request, pk=None):
        """Recalcular totales de liquidación."""
        liquidacion = self.get_object()

        liquidacion.calcular_totales()

        serializer = self.get_serializer(liquidacion)
        return Response({
            'message': 'Totales recalculados exitosamente.',
            'liquidacion': serializer.data
        })


# =============================================================================
# DETALLE DE LIQUIDACIÓN
# =============================================================================

class DetalleLiquidacionViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión de detalles de liquidación.
    """

    queryset = DetalleLiquidacion.objects.all()
    serializer_class = DetalleLiquidacionListSerializer

    def get_queryset(self):
        """Filtrar detalles activos del tenant."""
        queryset = DetalleLiquidacion.objects.filter(
            is_active=True
        ).select_related('liquidacion', 'concepto')

        # Filtrar por liquidación
        liquidacion_id = self.request.query_params.get('liquidacion', None)
        if liquidacion_id:
            queryset = queryset.filter(liquidacion_id=liquidacion_id)

        return queryset.order_by('liquidacion', '-es_devengado', 'concepto__orden')

    def perform_create(self, serializer):
        serializer.save(empresa=get_tenant_empresa())

        # Recalcular totales de liquidación
        detalle = serializer.instance
        detalle.liquidacion.calcular_totales()

    def perform_update(self, serializer):
        """Recalcular totales después de actualizar."""
        serializer.save()
        detalle = serializer.instance
        detalle.liquidacion.calcular_totales()

    def perform_destroy(self, instance):
        """Soft delete y recalcular totales."""
        liquidacion = instance.liquidacion
        instance.soft_delete()
        liquidacion.calcular_totales()


# =============================================================================
# PRESTACIÓN SOCIAL
# =============================================================================

class PrestacionViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión de prestaciones sociales.
    """

    queryset = Prestacion.objects.all()

    def get_queryset(self):
        """Filtrar prestaciones activas del tenant."""
        queryset = Prestacion.objects.filter(
            is_active=True
        ).select_related('colaborador')

        # Filtros opcionales
        colaborador_id = self.request.query_params.get('colaborador', None)
        if colaborador_id:
            queryset = queryset.filter(colaborador_id=colaborador_id)

        anio = self.request.query_params.get('anio', None)
        if anio:
            queryset = queryset.filter(anio=anio)

        tipo = self.request.query_params.get('tipo', None)
        if tipo:
            queryset = queryset.filter(tipo=tipo)

        return queryset.order_by('-anio', 'colaborador', 'tipo')

    def get_serializer_class(self):
        """Serializer según acción."""
        if self.action == 'list':
            return PrestacionListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return PrestacionCreateSerializer
        return PrestacionDetailSerializer

    def perform_create(self, serializer):
        serializer.save(empresa=get_tenant_empresa())

    def perform_destroy(self, instance):
        """Soft delete."""
        instance.soft_delete()


# =============================================================================
# PAGO DE NÓMINA
# =============================================================================

class PagoNominaViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión de pagos de nómina.
    """

    queryset = PagoNomina.objects.all()

    def get_queryset(self):
        """Filtrar pagos activos del tenant."""
        queryset = PagoNomina.objects.filter(
            is_active=True
        ).select_related('liquidacion', 'liquidacion__colaborador')

        # Filtros opcionales
        liquidacion_id = self.request.query_params.get('liquidacion', None)
        if liquidacion_id:
            queryset = queryset.filter(liquidacion_id=liquidacion_id)

        fecha_desde = self.request.query_params.get('fecha_desde', None)
        if fecha_desde:
            queryset = queryset.filter(fecha_pago__gte=fecha_desde)

        fecha_hasta = self.request.query_params.get('fecha_hasta', None)
        if fecha_hasta:
            queryset = queryset.filter(fecha_pago__lte=fecha_hasta)

        return queryset.order_by('-fecha_pago')

    def get_serializer_class(self):
        """Serializer según acción."""
        if self.action == 'list':
            return PagoNominaListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return PagoNominaCreateSerializer
        return PagoNominaDetailSerializer

    def perform_create(self, serializer):
        """Actualizar estado de liquidación al crear pago."""
        pago = serializer.save(empresa=get_tenant_empresa())

        # Marcar liquidación como pagada
        liquidacion = pago.liquidacion
        if liquidacion.estado == 'aprobado':
            liquidacion.estado = 'pagado'
            liquidacion.save()

    def perform_destroy(self, instance):
        """Soft delete."""
        instance.soft_delete()
