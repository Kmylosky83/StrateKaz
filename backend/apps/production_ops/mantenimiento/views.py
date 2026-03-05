"""
Views para Mantenimiento de Equipos - Production Ops
Sistema de Gestión StrateKaz
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.utils import timezone
from django.db.models import Q, Sum, Count, Avg
from decimal import Decimal
from datetime import date, timedelta

from .models import (
    # Catálogos dinámicos
    TipoActivo,
    TipoMantenimiento,
    # Activos
    ActivoProduccion,
    EquipoMedicion,
    # Planificación
    PlanMantenimiento,
    # Ejecución
    OrdenTrabajo,
    Calibracion,
    Parada,
)
from .serializers import (
    # Catálogos
    TipoActivoSerializer,
    TipoMantenimientoSerializer,
    # Activos
    ActivoProduccionSerializer,
    ActivoProduccionListSerializer,
    EquipoMedicionSerializer,
    EquipoMedicionListSerializer,
    # Planificación
    PlanMantenimientoSerializer,
    PlanMantenimientoListSerializer,
    # Ejecución
    OrdenTrabajoSerializer,
    OrdenTrabajoListSerializer,
    IniciarTrabajoSerializer,
    CompletarTrabajoSerializer,
    CalibracionSerializer,
    CalibracionListSerializer,
    ParadaSerializer,
    ParadaListSerializer,
    CerrarParadaSerializer,
)


# ==============================================================================
# VIEWSETS DE CATÁLOGOS DINÁMICOS
# ==============================================================================

class TipoActivoViewSet(viewsets.ModelViewSet):
    """ViewSet para tipos de activo"""
    queryset = TipoActivo.objects.all()
    serializer_class = TipoActivoSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ['codigo', 'nombre']
    ordering_fields = ['orden', 'nombre']
    ordering = ['orden']


class TipoMantenimientoViewSet(viewsets.ModelViewSet):
    """ViewSet para tipos de mantenimiento"""
    queryset = TipoMantenimiento.objects.all()
    serializer_class = TipoMantenimientoSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ['codigo', 'nombre']
    ordering_fields = ['orden', 'nombre']
    ordering = ['orden']


# ==============================================================================
# VIEWSETS DE ACTIVOS
# ==============================================================================

class ActivoProduccionViewSet(viewsets.ModelViewSet):
    """
    ViewSet para activos de producción.

    Acciones personalizadas:
    - requiere_mantenimiento: Listar activos que requieren mantenimiento
    - dashboard: Dashboard con métricas de activos
    """
    queryset = ActivoProduccion.objects.select_related(
        'empresa', 'tipo_activo', 'linea_produccion', 'created_by'
    ).prefetch_related('ordenes_trabajo', 'paradas', 'planes_mantenimiento')
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['tipo_activo', 'estado', 'linea_produccion', 'empresa']
    search_fields = ['codigo', 'nombre', 'marca', 'modelo', 'numero_serie']
    ordering_fields = ['codigo', 'nombre', 'fecha_adquisicion', 'valor_actual']
    ordering = ['codigo']

    def get_serializer_class(self):
        if self.action == 'list':
            return ActivoProduccionListSerializer
        return ActivoProduccionSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        # Filtrar por empresa_id si se proporciona en query params
        empresa_id = self.request.query_params.get('empresa_id')
        if empresa_id:
            queryset = queryset.filter(empresa_id=empresa_id)
        return queryset

    @action(detail=False, methods=['get'], url_path='requiere-mantenimiento')
    def requiere_mantenimiento(self, request):
        """Listar activos que requieren mantenimiento urgente o están vencidos"""
        hoy = date.today()
        umbral_urgente = hoy + timedelta(days=7)

        activos = self.get_queryset().filter(
            Q(fecha_proximo_mantenimiento__lte=umbral_urgente) &
            Q(fecha_proximo_mantenimiento__gte=hoy) |
            Q(fecha_proximo_mantenimiento__lt=hoy)
        ).filter(estado='OPERATIVO')

        serializer = self.get_serializer(activos, many=True)
        return Response({
            'total': activos.count(),
            'activos': serializer.data
        })

    @action(detail=False, methods=['get'])
    def dashboard(self, request):
        """Dashboard con métricas de activos"""
        empresa_id = request.query_params.get('empresa_id')
        queryset = self.get_queryset()

        if empresa_id:
            queryset = queryset.filter(empresa_id=empresa_id)

        # Métricas generales
        total_activos = queryset.count()
        por_estado = queryset.values('estado').annotate(total=Count('id'))

        # Valor total y depreciación
        valor_total = queryset.aggregate(
            adquisicion=Sum('valor_adquisicion'),
            actual=Sum('valor_actual')
        )

        # Activos críticos
        hoy = date.today()
        vencidos = queryset.filter(
            fecha_proximo_mantenimiento__lt=hoy,
            estado='OPERATIVO'
        ).count()

        urgentes = queryset.filter(
            fecha_proximo_mantenimiento__gte=hoy,
            fecha_proximo_mantenimiento__lte=hoy + timedelta(days=7),
            estado='OPERATIVO'
        ).count()

        # Activos por tipo
        por_tipo = queryset.values(
            'tipo_activo__nombre'
        ).annotate(
            total=Count('id')
        )

        # Top 5 activos con más mantenimientos
        with_ordenes = queryset.annotate(
            total_ordenes=Count('ordenes_trabajo')
        ).filter(total_ordenes__gt=0).order_by('-total_ordenes')[:5]

        top_mantenimiento = ActivoProduccionListSerializer(with_ordenes, many=True).data

        return Response({
            'resumen': {
                'total_activos': total_activos,
                'por_estado': list(por_estado),
                'vencidos_mantenimiento': vencidos,
                'urgentes_mantenimiento': urgentes,
            },
            'valores': {
                'total_adquisicion': str(valor_total['adquisicion'] or 0),
                'total_actual': str(valor_total['actual'] or 0),
                'depreciacion_total': str(
                    (valor_total['adquisicion'] or 0) - (valor_total['actual'] or 0)
                ),
            },
            'distribucion': {
                'por_tipo': list(por_tipo),
            },
            'top_mantenimiento': top_mantenimiento,
        })


class EquipoMedicionViewSet(viewsets.ModelViewSet):
    """
    ViewSet para equipos de medición.

    Acciones personalizadas:
    - requiere_calibracion: Listar equipos que requieren calibración
    - vencidos: Listar equipos con calibración vencida
    """
    queryset = EquipoMedicion.objects.select_related(
        'empresa', 'activo', 'created_by'
    ).prefetch_related('calibraciones')
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['estado', 'empresa', 'activo']
    search_fields = ['codigo', 'nombre', 'marca', 'modelo', 'numero_serie']
    ordering_fields = ['codigo', 'nombre', 'fecha_proxima_calibracion']
    ordering = ['codigo']

    def get_serializer_class(self):
        if self.action == 'list':
            return EquipoMedicionListSerializer
        return EquipoMedicionSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        empresa_id = self.request.query_params.get('empresa_id')
        if empresa_id:
            queryset = queryset.filter(empresa_id=empresa_id)
        return queryset

    @action(detail=False, methods=['get'], url_path='requiere-calibracion')
    def requiere_calibracion(self, request):
        """Listar equipos que requieren calibración urgente (próximos 30 días)"""
        hoy = date.today()
        umbral = hoy + timedelta(days=30)

        equipos = self.get_queryset().filter(
            fecha_proxima_calibracion__lte=umbral,
            fecha_proxima_calibracion__gte=hoy,
            estado='OPERATIVO'
        )

        serializer = self.get_serializer(equipos, many=True)
        return Response({
            'total': equipos.count(),
            'equipos': serializer.data
        })

    @action(detail=False, methods=['get'])
    def vencidos(self, request):
        """Listar equipos con calibración vencida"""
        hoy = date.today()

        equipos = self.get_queryset().filter(
            fecha_proxima_calibracion__lt=hoy,
            estado='OPERATIVO'
        )

        serializer = self.get_serializer(equipos, many=True)
        return Response({
            'total': equipos.count(),
            'equipos': serializer.data
        })


# ==============================================================================
# VIEWSETS DE PLANIFICACIÓN
# ==============================================================================

class PlanMantenimientoViewSet(viewsets.ModelViewSet):
    """
    ViewSet para planes de mantenimiento.

    Acciones personalizadas:
    - proximos: Listar planes próximos a ejecutar
    - vencidos: Listar planes vencidos
    """
    queryset = PlanMantenimiento.objects.select_related(
        'empresa', 'activo', 'tipo_mantenimiento', 'created_by'
    ).prefetch_related('ordenes_trabajo')
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['activo', 'tipo_mantenimiento', 'activo_plan', 'empresa']
    search_fields = ['nombre', 'activo__codigo', 'activo__nombre']
    ordering_fields = ['nombre', 'proxima_ejecucion', 'frecuencia_dias']
    ordering = ['proxima_ejecucion']

    def get_serializer_class(self):
        if self.action == 'list':
            return PlanMantenimientoListSerializer
        return PlanMantenimientoSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        empresa_id = self.request.query_params.get('empresa_id')
        if empresa_id:
            queryset = queryset.filter(empresa_id=empresa_id)
        return queryset

    @action(detail=False, methods=['get'])
    def proximos(self, request):
        """Listar planes próximos a ejecutar (próximos 7 días)"""
        hoy = date.today()
        umbral = hoy + timedelta(days=7)

        planes = self.get_queryset().filter(
            activo_plan=True,
            proxima_ejecucion__lte=umbral,
            proxima_ejecucion__gte=hoy
        )

        serializer = self.get_serializer(planes, many=True)
        return Response({
            'total': planes.count(),
            'planes': serializer.data
        })

    @action(detail=False, methods=['get'])
    def vencidos(self, request):
        """Listar planes vencidos"""
        hoy = date.today()

        planes = self.get_queryset().filter(
            activo_plan=True,
            proxima_ejecucion__lt=hoy
        )

        serializer = self.get_serializer(planes, many=True)
        return Response({
            'total': planes.count(),
            'planes': serializer.data
        })


# ==============================================================================
# VIEWSETS DE EJECUCIÓN
# ==============================================================================

class OrdenTrabajoViewSet(viewsets.ModelViewSet):
    """
    ViewSet para órdenes de trabajo.

    Acciones personalizadas:
    - iniciar: Iniciar una orden de trabajo
    - completar: Completar una orden de trabajo
    - por_estado: Listar órdenes por estado
    - estadisticas: Estadísticas de órdenes de trabajo
    """
    queryset = OrdenTrabajo.objects.select_related(
        'empresa', 'activo', 'tipo_mantenimiento', 'plan_mantenimiento',
        'solicitante', 'asignado_a', 'created_by'
    )
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = [
        'activo', 'tipo_mantenimiento', 'estado', 'prioridad',
        'solicitante', 'asignado_a', 'empresa'
    ]
    search_fields = ['codigo', 'descripcion_problema', 'activo__codigo', 'activo__nombre']
    ordering_fields = ['fecha_solicitud', 'fecha_programada', 'prioridad', 'costo_total']
    ordering = ['-fecha_solicitud']

    def get_serializer_class(self):
        if self.action == 'list':
            return OrdenTrabajoListSerializer
        elif self.action == 'iniciar':
            return IniciarTrabajoSerializer
        elif self.action == 'completar':
            return CompletarTrabajoSerializer
        return OrdenTrabajoSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        empresa_id = self.request.query_params.get('empresa_id')
        if empresa_id:
            queryset = queryset.filter(empresa_id=empresa_id)
        return queryset

    def perform_create(self, serializer):
        """Asignar solicitante automáticamente"""
        serializer.save(
            solicitante=self.request.user,
            created_by=self.request.user
        )

    @action(detail=True, methods=['post'])
    def iniciar(self, request, pk=None):
        """Iniciar una orden de trabajo"""
        orden = self.get_object()

        if orden.estado != 'ABIERTA':
            return Response(
                {'error': 'Solo se pueden iniciar órdenes en estado ABIERTA'},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = IniciarTrabajoSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Asignar técnico si se proporcionó
            if serializer.validated_data.get('asignado_a'):
                orden.asignado_a = serializer.validated_data['asignado_a']

            # Agregar observaciones si se proporcionaron
            if serializer.validated_data.get('observaciones'):
                orden.observaciones = (
                    f"{orden.observaciones or ''}\n\n"
                    f"[INICIO] {serializer.validated_data['observaciones']}"
                )

            orden.iniciar_trabajo()

            response_serializer = OrdenTrabajoSerializer(orden)
            return Response({
                'message': 'Orden de trabajo iniciada exitosamente',
                'data': response_serializer.data
            })
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=True, methods=['post'])
    def completar(self, request, pk=None):
        """Completar una orden de trabajo"""
        orden = self.get_object()

        if orden.estado != 'EN_PROCESO':
            return Response(
                {'error': 'Solo se pueden completar órdenes en estado EN_PROCESO'},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = CompletarTrabajoSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Actualizar datos de la orden
            orden.descripcion_trabajo_realizado = serializer.validated_data['descripcion_trabajo_realizado']
            orden.horas_trabajadas = serializer.validated_data['horas_trabajadas']
            orden.costo_mano_obra = serializer.validated_data['costo_mano_obra']
            orden.costo_repuestos = serializer.validated_data['costo_repuestos']

            if serializer.validated_data.get('observaciones'):
                orden.observaciones = (
                    f"{orden.observaciones or ''}\n\n"
                    f"[FINALIZACIÓN] {serializer.validated_data['observaciones']}"
                )

            orden.completar_trabajo()

            response_serializer = OrdenTrabajoSerializer(orden)
            return Response({
                'message': 'Orden de trabajo completada exitosamente',
                'data': response_serializer.data
            })
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=False, methods=['get'], url_path='por-estado')
    def por_estado(self, request):
        """Listar órdenes agrupadas por estado"""
        empresa_id = request.query_params.get('empresa_id')
        queryset = self.get_queryset()

        if empresa_id:
            queryset = queryset.filter(empresa_id=empresa_id)

        estados = queryset.values('estado').annotate(
            total=Count('id'),
            costo_total=Sum('costo_total')
        )

        return Response({
            'estados': list(estados)
        })

    @action(detail=False, methods=['get'])
    def estadisticas(self, request):
        """Estadísticas generales de órdenes de trabajo"""
        empresa_id = request.query_params.get('empresa_id')
        periodo = request.query_params.get('periodo', '30')  # días

        queryset = self.get_queryset()

        if empresa_id:
            queryset = queryset.filter(empresa_id=empresa_id)

        # Filtrar por período
        fecha_desde = date.today() - timedelta(days=int(periodo))
        ordenes_periodo = queryset.filter(fecha_solicitud__gte=fecha_desde)

        # Estadísticas generales
        total_ordenes = ordenes_periodo.count()
        completadas = ordenes_periodo.filter(estado='COMPLETADA').count()
        en_proceso = ordenes_periodo.filter(estado='EN_PROCESO').count()
        abiertas = ordenes_periodo.filter(estado='ABIERTA').count()

        # Costos
        costo_total = ordenes_periodo.aggregate(
            total=Sum('costo_total')
        )['total'] or Decimal('0.00')

        promedio_costo = ordenes_periodo.filter(
            costo_total__gt=0
        ).aggregate(
            promedio=Avg('costo_total')
        )['promedio'] or Decimal('0.00')

        # Horas trabajadas
        total_horas = ordenes_periodo.aggregate(
            total=Sum('horas_trabajadas')
        )['total'] or Decimal('0.00')

        # Por prioridad
        por_prioridad = ordenes_periodo.values('prioridad').annotate(
            total=Count('id')
        ).order_by('prioridad')

        # Por tipo de mantenimiento
        por_tipo = ordenes_periodo.values(
            'tipo_mantenimiento__nombre'
        ).annotate(
            total=Count('id')
        )

        # Activos con más órdenes
        top_activos = ordenes_periodo.values(
            'activo__codigo', 'activo__nombre'
        ).annotate(
            total=Count('id'),
            costo_total=Sum('costo_total')
        ).order_by('-total')[:10]

        return Response({
            'periodo_dias': int(periodo),
            'resumen': {
                'total_ordenes': total_ordenes,
                'completadas': completadas,
                'en_proceso': en_proceso,
                'abiertas': abiertas,
                'tasa_completadas': round((completadas / total_ordenes * 100) if total_ordenes > 0 else 0, 2),
            },
            'costos': {
                'total': str(costo_total),
                'promedio': str(promedio_costo),
            },
            'horas': {
                'total': str(total_horas),
            },
            'distribucion': {
                'por_prioridad': list(por_prioridad),
                'por_tipo': list(por_tipo),
            },
            'top_activos': list(top_activos),
        })


class CalibracionViewSet(viewsets.ModelViewSet):
    """ViewSet para calibraciones"""
    queryset = Calibracion.objects.select_related(
        'empresa', 'equipo', 'responsable', 'created_by'
    )
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['equipo', 'resultado', 'responsable', 'empresa']
    search_fields = [
        'numero_certificado', 'laboratorio_calibrador',
        'equipo__codigo', 'equipo__nombre'
    ]
    ordering_fields = ['fecha_calibracion', 'fecha_vencimiento']
    ordering = ['-fecha_calibracion']

    def get_serializer_class(self):
        if self.action == 'list':
            return CalibracionListSerializer
        return CalibracionSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        empresa_id = self.request.query_params.get('empresa_id')
        if empresa_id:
            queryset = queryset.filter(empresa_id=empresa_id)
        return queryset

    def perform_create(self, serializer):
        """Asignar responsable automáticamente"""
        serializer.save(
            responsable=self.request.user,
            created_by=self.request.user
        )


class ParadaViewSet(viewsets.ModelViewSet):
    """
    ViewSet para paradas no programadas.

    Acciones personalizadas:
    - activas: Listar paradas activas
    - cerrar: Cerrar una parada
    """
    queryset = Parada.objects.select_related(
        'empresa', 'activo', 'reportado_por', 'orden_trabajo', 'created_by'
    )
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['activo', 'tipo', 'reportado_por', 'empresa']
    search_fields = ['causa', 'descripcion_falla', 'activo__codigo', 'activo__nombre']
    ordering_fields = ['fecha_inicio', 'duracion_horas', 'impacto_produccion_kg']
    ordering = ['-fecha_inicio']

    def get_serializer_class(self):
        if self.action == 'list':
            return ParadaListSerializer
        elif self.action == 'cerrar':
            return CerrarParadaSerializer
        return ParadaSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        empresa_id = self.request.query_params.get('empresa_id')
        if empresa_id:
            queryset = queryset.filter(empresa_id=empresa_id)
        return queryset

    def perform_create(self, serializer):
        """Asignar reportado_por automáticamente"""
        serializer.save(
            reportado_por=self.request.user,
            created_by=self.request.user
        )

    @action(detail=False, methods=['get'])
    def activas(self, request):
        """Listar paradas activas (sin fecha de fin)"""
        paradas = self.get_queryset().filter(fecha_fin__isnull=True)

        serializer = self.get_serializer(paradas, many=True)
        return Response({
            'total': paradas.count(),
            'paradas': serializer.data
        })

    @action(detail=True, methods=['post'])
    def cerrar(self, request, pk=None):
        """Cerrar una parada"""
        parada = self.get_object()

        if not parada.esta_activa():
            return Response(
                {'error': 'La parada ya está cerrada'},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = CerrarParadaSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Actualizar parada
            parada.acciones_correctivas = serializer.validated_data['acciones_correctivas']

            if serializer.validated_data.get('costo_estimado_parada'):
                parada.costo_estimado_parada = serializer.validated_data['costo_estimado_parada']

            parada.cerrar_parada()

            # Generar orden de trabajo si se solicitó
            if serializer.validated_data.get('genera_orden_trabajo'):
                tipo_mantenimiento = serializer.validated_data.get('tipo_mantenimiento')
                if not tipo_mantenimiento:
                    return Response(
                        {'error': 'Debe especificar el tipo de mantenimiento para generar la orden'},
                        status=status.HTTP_400_BAD_REQUEST
                    )

                orden = OrdenTrabajo.objects.create(
                    empresa=parada.empresa,
                    activo=parada.activo,
                    tipo_mantenimiento=tipo_mantenimiento,
                    prioridad=1,  # Crítica
                    estado='ABIERTA',
                    descripcion_problema=f"Correctivo por parada: {parada.causa}\n\n{parada.descripcion_falla}",
                    solicitante=request.user,
                    created_by=request.user
                )

                # Vincular orden con parada
                parada.orden_trabajo = orden
                parada.save()

            response_serializer = ParadaSerializer(parada)
            return Response({
                'message': 'Parada cerrada exitosamente',
                'data': response_serializer.data
            })
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
