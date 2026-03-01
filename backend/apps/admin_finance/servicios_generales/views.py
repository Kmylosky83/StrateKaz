"""
Views para Servicios Generales - Admin Finance
Sistema de Gestión StrateKaz

ViewSets para:
- Mantenimiento Locativo
- Servicios Públicos
- Contratos de Servicio

Autor: Sistema de Gestión
Fecha: 2025-12-29
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from datetime import timedelta
from django.db.models import Sum, Count, Q
from decimal import Decimal

from .models import (
    MantenimientoLocativo,
    ServicioPublico,
    ContratoServicio
)
from .serializers import (
    MantenimientoLocativoSerializer,
    MantenimientoLocativoListSerializer,
    ServicioPublicoSerializer,
    ServicioPublicoListSerializer,
    ContratoServicioSerializer,
    ContratoServicioListSerializer
)


# ==============================================================================
# VIEWSET: MANTENIMIENTO LOCATIVO
# ==============================================================================

class MantenimientoLocativoViewSet(viewsets.ModelViewSet):
    """
    ViewSet para MantenimientoLocativo.

    Endpoints:
    - list: Listar mantenimientos
    - create: Crear mantenimiento
    - retrieve: Detalle de mantenimiento
    - update: Actualizar mantenimiento
    - partial_update: Actualización parcial
    - destroy: Soft delete de mantenimiento
    - programar: Programar fecha de mantenimiento
    - completar: Marcar mantenimiento como completado
    - cancelar: Cancelar mantenimiento
    - estadisticas: Estadísticas de mantenimientos
    """

    queryset = MantenimientoLocativo.objects.select_related(
        'empresa', 'responsable'
    ).filter(is_active=True)
    serializer_class = MantenimientoLocativoSerializer
    filterset_fields = ['tipo', 'estado', 'responsable', 'proveedor']
    search_fields = ['codigo', 'ubicacion', 'descripcion_trabajo']
    ordering_fields = ['fecha_solicitud', 'fecha_programada', 'costo_estimado']
    ordering = ['-fecha_solicitud']

    def get_serializer_class(self):
        """Usa serializer simplificado para listado."""
        if self.action == 'list':
            return MantenimientoLocativoListSerializer
        return MantenimientoLocativoSerializer

    @action(detail=True, methods=['post'])
    def programar(self, request, pk=None):
        """
        Programa fecha para mantenimiento.

        Body:
        {
            "fecha_programada": "2024-12-30"
        }
        """
        mantenimiento = self.get_object()

        if mantenimiento.estado not in ['solicitado', 'programado']:
            return Response(
                {'error': 'Solo se pueden programar mantenimientos en estado solicitado o programado.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        fecha_programada = request.data.get('fecha_programada')
        if not fecha_programada:
            return Response(
                {'error': 'Debe proporcionar fecha_programada.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        mantenimiento.fecha_programada = fecha_programada
        mantenimiento.estado = 'programado'
        mantenimiento.save()

        serializer = self.get_serializer(mantenimiento)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def completar(self, request, pk=None):
        """
        Marca mantenimiento como completado.

        Body:
        {
            "fecha_ejecucion": "2024-12-30",
            "costo_real": 150000.00
        }
        """
        mantenimiento = self.get_object()

        if mantenimiento.estado == 'completado':
            return Response(
                {'error': 'El mantenimiento ya está completado.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        fecha_ejecucion = request.data.get('fecha_ejecucion', timezone.now().date())
        costo_real = request.data.get('costo_real')

        mantenimiento.fecha_ejecucion = fecha_ejecucion
        mantenimiento.estado = 'completado'

        if costo_real is not None:
            mantenimiento.costo_real = costo_real

        mantenimiento.save()

        serializer = self.get_serializer(mantenimiento)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def cancelar(self, request, pk=None):
        """Cancela un mantenimiento."""
        mantenimiento = self.get_object()

        if mantenimiento.estado in ['completado', 'cancelado']:
            return Response(
                {'error': 'No se puede cancelar un mantenimiento completado o ya cancelado.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        mantenimiento.estado = 'cancelado'
        mantenimiento.save()

        serializer = self.get_serializer(mantenimiento)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def estadisticas(self, request):
        """
        Estadísticas de mantenimientos.

        Query params opcionales:
        - anio: Año para filtrar
        """
        anio = request.query_params.get('anio', timezone.now().year)

        queryset = self.get_queryset().filter(
            fecha_solicitud__year=anio
        )

        # Conteo por tipo
        por_tipo = queryset.values('tipo').annotate(
            total=Count('id')
        ).order_by('tipo')

        # Conteo por estado
        por_estado = queryset.values('estado').annotate(
            total=Count('id')
        ).order_by('estado')

        # Costos totales
        costos = queryset.aggregate(
            total_estimado=Sum('costo_estimado'),
            total_real=Sum('costo_real')
        )

        # Variación promedio
        completados = queryset.filter(estado='completado')
        variacion_total = sum(
            m.variacion_costo for m in completados if m.costo_estimado > 0
        )

        return Response({
            'anio': anio,
            'total_mantenimientos': queryset.count(),
            'por_tipo': list(por_tipo),
            'por_estado': list(por_estado),
            'costo_estimado_total': costos['total_estimado'] or Decimal('0.00'),
            'costo_real_total': costos['total_real'] or Decimal('0.00'),
            'variacion_total': variacion_total,
        })


# ==============================================================================
# VIEWSET: SERVICIO PÚBLICO
# ==============================================================================

class ServicioPublicoViewSet(viewsets.ModelViewSet):
    """
    ViewSet para ServicioPublico.

    Endpoints:
    - list: Listar servicios públicos
    - create: Crear servicio
    - retrieve: Detalle de servicio
    - update: Actualizar servicio
    - partial_update: Actualización parcial
    - destroy: Soft delete de servicio
    - servicios_por_vencer: Servicios próximos a vencer
    - resumen_consumos: Resumen de consumos por tipo
    - marcar_pagado: Marcar servicio como pagado
    """

    queryset = ServicioPublico.objects.select_related('empresa').filter(is_active=True)
    serializer_class = ServicioPublicoSerializer
    filterset_fields = ['tipo_servicio', 'estado_pago', 'periodo_mes', 'periodo_anio']
    search_fields = ['codigo', 'proveedor_nombre', 'numero_cuenta', 'ubicacion']
    ordering_fields = ['fecha_vencimiento', 'valor', 'periodo_anio', 'periodo_mes']
    ordering = ['-periodo_anio', '-periodo_mes']

    def get_serializer_class(self):
        """Usa serializer simplificado para listado."""
        if self.action == 'list':
            return ServicioPublicoListSerializer
        return ServicioPublicoSerializer

    @action(detail=False, methods=['get'])
    def servicios_por_vencer(self, request):
        """
        Lista servicios próximos a vencer (próximos 7 días).

        Query params opcionales:
        - dias: Cantidad de días a futuro (default: 7)
        """
        dias = int(request.query_params.get('dias', 7))
        fecha_limite = timezone.now().date() + timedelta(days=dias)

        servicios = self.get_queryset().filter(
            fecha_vencimiento__lte=fecha_limite,
            fecha_vencimiento__gte=timezone.now().date(),
            estado_pago='pendiente'
        ).order_by('fecha_vencimiento')

        serializer = ServicioPublicoListSerializer(servicios, many=True)

        return Response({
            'dias': dias,
            'fecha_limite': fecha_limite,
            'total': servicios.count(),
            'servicios': serializer.data
        })

    @action(detail=False, methods=['get'])
    def resumen_consumos(self, request):
        """
        Resumen de consumos por tipo de servicio.

        Query params opcionales:
        - periodo_mes: Mes
        - periodo_anio: Año
        """
        periodo_mes = request.query_params.get('periodo_mes')
        periodo_anio = request.query_params.get('periodo_anio')

        queryset = self.get_queryset()

        if periodo_mes:
            queryset = queryset.filter(periodo_mes=periodo_mes)
        if periodo_anio:
            queryset = queryset.filter(periodo_anio=periodo_anio)

        # Resumen por tipo
        resumen = queryset.values('tipo_servicio').annotate(
            total_servicios=Count('id'),
            valor_total=Sum('valor'),
            consumo_total=Sum('consumo')
        ).order_by('tipo_servicio')

        # Total general
        totales = queryset.aggregate(
            total_valor=Sum('valor'),
            total_servicios=Count('id')
        )

        return Response({
            'periodo_mes': periodo_mes,
            'periodo_anio': periodo_anio,
            'resumen_por_tipo': list(resumen),
            'total_valor': totales['total_valor'] or Decimal('0.00'),
            'total_servicios': totales['total_servicios']
        })

    @action(detail=True, methods=['post'])
    def marcar_pagado(self, request, pk=None):
        """Marca un servicio como pagado."""
        servicio = self.get_object()

        if servicio.estado_pago == 'pagado':
            return Response(
                {'error': 'El servicio ya está marcado como pagado.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        servicio.estado_pago = 'pagado'
        servicio.save()

        serializer = self.get_serializer(servicio)
        return Response(serializer.data)


# ==============================================================================
# VIEWSET: CONTRATO DE SERVICIO
# ==============================================================================

class ContratoServicioViewSet(viewsets.ModelViewSet):
    """
    ViewSet para ContratoServicio.

    Endpoints:
    - list: Listar contratos
    - create: Crear contrato
    - retrieve: Detalle de contrato
    - update: Actualizar contrato
    - partial_update: Actualización parcial
    - destroy: Soft delete de contrato
    - contratos_vigentes: Contratos vigentes
    - contratos_por_vencer: Contratos próximos a vencer
    - terminar: Terminar contrato anticipadamente
    - resumen_por_proveedor: Resumen de contratos por proveedor
    """

    queryset = ContratoServicio.objects.select_related(
        'empresa'
    ).filter(is_active=True)
    serializer_class = ContratoServicioSerializer
    filterset_fields = ['tipo_servicio', 'estado', 'proveedor']
    search_fields = ['codigo', 'objeto']
    ordering_fields = ['fecha_inicio', 'fecha_fin', 'valor_total']
    ordering = ['-fecha_inicio']

    def get_serializer_class(self):
        """Usa serializer simplificado para listado."""
        if self.action == 'list':
            return ContratoServicioListSerializer
        return ContratoServicioSerializer

    @action(detail=False, methods=['get'])
    def contratos_vigentes(self, request):
        """Lista contratos actualmente vigentes."""
        hoy = timezone.now().date()

        contratos = self.get_queryset().filter(
            fecha_inicio__lte=hoy,
            fecha_fin__gte=hoy,
            estado='vigente'
        )

        serializer = ContratoServicioListSerializer(contratos, many=True)

        # Calcular valor total mensual
        valor_mensual_total = contratos.aggregate(
            total=Sum('valor_mensual')
        )['total'] or Decimal('0.00')

        return Response({
            'total': contratos.count(),
            'valor_mensual_total': valor_mensual_total,
            'contratos': serializer.data
        })

    @action(detail=False, methods=['get'])
    def contratos_por_vencer(self, request):
        """
        Lista contratos próximos a vencer (próximos 30 días).

        Query params opcionales:
        - dias: Cantidad de días a futuro (default: 30)
        """
        dias = int(request.query_params.get('dias', 30))
        fecha_limite = timezone.now().date() + timedelta(days=dias)

        contratos = self.get_queryset().filter(
            fecha_fin__lte=fecha_limite,
            fecha_fin__gte=timezone.now().date(),
            estado='vigente'
        ).order_by('fecha_fin')

        serializer = ContratoServicioListSerializer(contratos, many=True)

        return Response({
            'dias': dias,
            'fecha_limite': fecha_limite,
            'total': contratos.count(),
            'contratos': serializer.data
        })

    @action(detail=True, methods=['post'])
    def terminar(self, request, pk=None):
        """Termina un contrato anticipadamente."""
        contrato = self.get_object()

        if contrato.estado == 'terminado':
            return Response(
                {'error': 'El contrato ya está terminado.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        contrato.estado = 'terminado'
        contrato.save()

        serializer = self.get_serializer(contrato)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def resumen_por_proveedor(self, request):
        """Resumen de contratos agrupados por proveedor."""
        queryset = self.get_queryset().filter(
            proveedor__isnull=False
        )

        resumen = queryset.values(
            'proveedor__id',
            'proveedor__razon_social'
        ).annotate(
            total_contratos=Count('id'),
            contratos_vigentes=Count('id', filter=Q(estado='vigente')),
            valor_mensual_total=Sum('valor_mensual'),
            valor_total=Sum('valor_total')
        ).order_by('-valor_total')

        return Response({
            'total_proveedores': resumen.count(),
            'resumen': list(resumen)
        })
