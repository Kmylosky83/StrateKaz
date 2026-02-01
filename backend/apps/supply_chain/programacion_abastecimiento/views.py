"""
ViewSets para Programación de Abastecimiento - Supply Chain
Sistema de Gestión StrateKaz

100% DINÁMICO: ViewSets usan modelos de catálogo dinámicos.
"""
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from django.db.models import Q, Sum, Count, Avg

from apps.supply_chain.catalogos.models import UnidadMedida
from .models import (
    # Catálogos dinámicos
    TipoOperacion,
    EstadoProgramacion,
    EstadoEjecucion,
    EstadoLiquidacion,
    # Modelos principales
    Programacion,
    AsignacionRecurso,
    Ejecucion,
    Liquidacion,
)
from .serializers import (
    # Catálogos
    TipoOperacionSerializer,
    EstadoProgramacionSerializer,
    UnidadMedidaSerializer,
    EstadoEjecucionSerializer,
    EstadoLiquidacionSerializer,
    # Asignación de recursos
    AsignacionRecursoSerializer,
    # Ejecución
    EjecucionListSerializer,
    EjecucionDetailSerializer,
    EjecucionCreateSerializer,
    # Liquidación
    LiquidacionListSerializer,
    LiquidacionDetailSerializer,
    LiquidacionCreateSerializer,
    LiquidacionUpdateSerializer,
    # Programación
    ProgramacionListSerializer,
    ProgramacionDetailSerializer,
    ProgramacionCreateSerializer,
    ProgramacionUpdateSerializer,
)


# ==============================================================================
# VIEWSETS DE CATÁLOGOS DINÁMICOS
# ==============================================================================

class CatalogoBaseViewSet(viewsets.ModelViewSet):
    """
    ViewSet base para catálogos dinámicos.
    Proporciona funcionalidad CRUD estándar con filtros comunes.
    """
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    ordering = ['orden', 'nombre']

    def get_queryset(self):
        """Filtrar por estado activo si se solicita."""
        queryset = super().get_queryset()

        # Filtrar solo activos si se solicita
        solo_activos = self.request.query_params.get('solo_activos', 'false')
        if solo_activos.lower() == 'true':
            queryset = queryset.filter(is_active=True)

        return queryset


class TipoOperacionViewSet(CatalogoBaseViewSet):
    """
    ViewSet para Tipos de Operación (dinámico).

    Endpoints:
    - GET /api/supply-chain/tipos-operacion/
    - POST /api/supply-chain/tipos-operacion/
    - GET /api/supply-chain/tipos-operacion/{id}/
    - PUT/PATCH /api/supply-chain/tipos-operacion/{id}/
    - DELETE /api/supply-chain/tipos-operacion/{id}/
    """

    queryset = TipoOperacion.objects.all()
    serializer_class = TipoOperacionSerializer
    search_fields = ['codigo', 'nombre']
    filterset_fields = ['is_active', 'requiere_vehiculo', 'requiere_conductor']
    ordering_fields = ['orden', 'nombre', 'codigo']


class EstadoProgramacionViewSet(CatalogoBaseViewSet):
    """ViewSet para Estados de Programación (dinámico)."""

    queryset = EstadoProgramacion.objects.all()
    serializer_class = EstadoProgramacionSerializer
    search_fields = ['codigo', 'nombre']
    filterset_fields = ['is_active', 'es_estado_inicial', 'es_estado_final']
    ordering_fields = ['orden', 'nombre']


class UnidadMedidaViewSet(CatalogoBaseViewSet):
    """ViewSet para Unidades de Medida (dinámico)."""

    queryset = UnidadMedida.objects.all()
    serializer_class = UnidadMedidaSerializer
    search_fields = ['codigo', 'nombre', 'simbolo']
    filterset_fields = ['is_active']
    ordering_fields = ['orden', 'nombre']


class EstadoEjecucionViewSet(CatalogoBaseViewSet):
    """ViewSet para Estados de Ejecución (dinámico)."""

    queryset = EstadoEjecucion.objects.all()
    serializer_class = EstadoEjecucionSerializer
    search_fields = ['codigo', 'nombre']
    filterset_fields = ['is_active', 'es_estado_inicial', 'es_estado_final']
    ordering_fields = ['orden', 'nombre']


class EstadoLiquidacionViewSet(CatalogoBaseViewSet):
    """ViewSet para Estados de Liquidación (dinámico)."""

    queryset = EstadoLiquidacion.objects.all()
    serializer_class = EstadoLiquidacionSerializer
    search_fields = ['codigo', 'nombre']
    filterset_fields = ['is_active', 'permite_edicion', 'es_estado_inicial', 'es_estado_final']
    ordering_fields = ['orden', 'nombre']


# ==============================================================================
# VIEWSET DE PROGRAMACIÓN
# ==============================================================================

class ProgramacionViewSet(viewsets.ModelViewSet):
    """
    ViewSet completo para Programaciones de Abastecimiento (100% dinámico).

    Endpoints:
    - GET /api/supply-chain/programaciones/ - Lista de programaciones
    - POST /api/supply-chain/programaciones/ - Crear programación
    - GET /api/supply-chain/programaciones/{id}/ - Detalle de programación
    - PUT/PATCH /api/supply-chain/programaciones/{id}/ - Actualizar programación
    - DELETE /api/supply-chain/programaciones/{id}/ - Soft delete
    - POST /api/supply-chain/programaciones/{id}/restore/ - Restaurar eliminada
    - POST /api/supply-chain/programaciones/{id}/asignar-recursos/ - Asignar recursos
    - GET /api/supply-chain/programaciones/calendario/ - Vista calendario
    - GET /api/supply-chain/programaciones/estadisticas/ - Estadísticas
    """

    queryset = Programacion.objects.all()
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['sede', 'tipo_operacion', 'proveedor', 'responsable', 'estado']
    search_fields = ['codigo', 'proveedor__nombre_comercial', 'observaciones']
    ordering_fields = ['codigo', 'fecha_programada', 'fecha_ejecucion', 'created_at']
    ordering = ['-fecha_programada']

    def get_queryset(self):
        """Excluir programaciones eliminadas por defecto."""
        queryset = super().get_queryset()

        include_deleted = self.request.query_params.get('include_deleted', 'false')
        if include_deleted.lower() != 'true':
            queryset = queryset.filter(deleted_at__isnull=True)

        # Filtrar por rango de fechas
        fecha_desde = self.request.query_params.get('fecha_desde')
        fecha_hasta = self.request.query_params.get('fecha_hasta')

        if fecha_desde:
            queryset = queryset.filter(fecha_programada__gte=fecha_desde)
        if fecha_hasta:
            queryset = queryset.filter(fecha_programada__lte=fecha_hasta)

        return queryset.select_related(
            'empresa',
            'sede',
            'tipo_operacion',
            'proveedor',
            'responsable',
            'estado',
            'created_by'
        ).prefetch_related('asignacion_recurso', 'ejecucion')

    def get_serializer_class(self):
        """Retornar serializer según la acción."""
        if self.action == 'list':
            return ProgramacionListSerializer
        elif self.action == 'create':
            return ProgramacionCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return ProgramacionUpdateSerializer
        else:
            return ProgramacionDetailSerializer

    def perform_destroy(self, instance):
        """Soft delete de programación."""
        instance.soft_delete()

    @action(detail=True, methods=['post'])
    def restore(self, request, pk=None):
        """Restaurar programación eliminada."""
        programacion = self.get_object()

        if not programacion.is_deleted:
            return Response(
                {'detail': 'La programación no está eliminada'},
                status=status.HTTP_400_BAD_REQUEST
            )

        programacion.restore()
        serializer = self.get_serializer(programacion)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], url_path='asignar-recursos')
    def asignar_recursos(self, request, pk=None):
        """
        Asignar recursos (vehículo, conductor) a una programación.

        Body:
        {
            "vehiculo": "ABC123",
            "conductor": 15,
            "observaciones": "Observaciones de asignación"
        }
        """
        programacion = self.get_object()

        # Verificar si ya tiene asignación
        if hasattr(programacion, 'asignacion_recurso'):
            # Actualizar asignación existente
            serializer = AsignacionRecursoSerializer(
                programacion.asignacion_recurso,
                data=request.data,
                partial=True,
                context={'request': request}
            )
        else:
            # Crear nueva asignación
            data = request.data.copy()
            data['programacion'] = programacion.id

            serializer = AsignacionRecursoSerializer(
                data=data,
                context={'request': request}
            )

        serializer.is_valid(raise_exception=True)

        # Agregar usuario que asigna
        if not hasattr(programacion, 'asignacion_recurso'):
            serializer.save(asignado_por=request.user)
        else:
            serializer.save()

        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def calendario(self, request):
        """
        Vista calendario de programaciones.

        GET /api/supply-chain/programaciones/calendario/?fecha_inicio=YYYY-MM-DD&fecha_fin=YYYY-MM-DD
        """
        fecha_inicio = request.query_params.get('fecha_inicio')
        fecha_fin = request.query_params.get('fecha_fin')

        if not fecha_inicio or not fecha_fin:
            return Response(
                {'detail': 'Debe proporcionar fecha_inicio y fecha_fin'},
                status=status.HTTP_400_BAD_REQUEST
            )

        programaciones = Programacion.objects.filter(
            deleted_at__isnull=True,
            fecha_programada__gte=fecha_inicio,
            fecha_programada__lte=fecha_fin
        ).select_related(
            'tipo_operacion', 'proveedor', 'responsable', 'estado'
        )

        # Formatear para calendario
        eventos = []
        for prog in programaciones:
            eventos.append({
                'id': prog.id,
                'title': f"{prog.proveedor.nombre_comercial} - {prog.tipo_operacion.nombre}",
                'start': prog.fecha_programada.isoformat(),
                'end': prog.fecha_ejecucion.isoformat() if prog.fecha_ejecucion else None,
                'color': prog.tipo_operacion.color_hex,
                'extendedProps': {
                    'codigo': prog.codigo,
                    'tipo_operacion': prog.tipo_operacion.nombre,
                    'proveedor': prog.proveedor.nombre_comercial,
                    'responsable': prog.responsable.get_full_name(),
                    'estado': prog.estado.nombre,
                    'estado_color': prog.estado.color_hex,
                }
            })

        return Response(eventos)

    @action(detail=False, methods=['get'])
    def estadisticas(self, request):
        """
        Estadísticas de programaciones.

        GET /api/supply-chain/programaciones/estadisticas/?fecha_desde=YYYY-MM-DD&fecha_hasta=YYYY-MM-DD
        """
        queryset = Programacion.objects.filter(deleted_at__isnull=True)

        fecha_desde = request.query_params.get('fecha_desde')
        fecha_hasta = request.query_params.get('fecha_hasta')

        if fecha_desde:
            queryset = queryset.filter(fecha_programada__gte=fecha_desde)
        if fecha_hasta:
            queryset = queryset.filter(fecha_programada__lte=fecha_hasta)

        # Estadísticas por estado
        por_estado = queryset.values('estado__nombre').annotate(
            cantidad=Count('id')
        ).order_by('estado__nombre')

        # Estadísticas por tipo de operación
        por_tipo = queryset.values('tipo_operacion__nombre').annotate(
            cantidad=Count('id')
        ).order_by('tipo_operacion__nombre')

        # Estadísticas por proveedor
        por_proveedor = queryset.values('proveedor__nombre_comercial').annotate(
            cantidad=Count('id')
        ).order_by('-cantidad')[:10]

        # Totales generales
        totales = {
            'total_programaciones': queryset.count(),
            'con_ejecucion': queryset.filter(ejecucion__isnull=False).count(),
            'con_liquidacion': queryset.filter(
                ejecucion__liquidacion__isnull=False
            ).count(),
        }

        return Response({
            'por_estado': list(por_estado),
            'por_tipo_operacion': list(por_tipo),
            'por_proveedor': list(por_proveedor),
            'totales': totales,
            'filtros': {
                'fecha_desde': fecha_desde,
                'fecha_hasta': fecha_hasta
            }
        })


# ==============================================================================
# VIEWSET DE ASIGNACIÓN DE RECURSOS
# ==============================================================================

class AsignacionRecursoViewSet(viewsets.ModelViewSet):
    """
    ViewSet para Asignaciones de Recursos.

    Endpoints:
    - GET /api/supply-chain/asignaciones-recurso/
    - POST /api/supply-chain/asignaciones-recurso/
    - GET /api/supply-chain/asignaciones-recurso/{id}/
    - PUT/PATCH /api/supply-chain/asignaciones-recurso/{id}/
    - DELETE /api/supply-chain/asignaciones-recurso/{id}/
    """

    queryset = AsignacionRecurso.objects.all()
    serializer_class = AsignacionRecursoSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['programacion', 'conductor']
    search_fields = ['vehiculo', 'programacion__codigo']
    ordering_fields = ['fecha_asignacion']
    ordering = ['-fecha_asignacion']

    def get_queryset(self):
        queryset = super().get_queryset()
        return queryset.select_related('programacion', 'conductor', 'asignado_por')

    def perform_create(self, serializer):
        """Guardar quién asignó el recurso."""
        serializer.save(asignado_por=self.request.user)


# ==============================================================================
# VIEWSET DE EJECUCIÓN
# ==============================================================================

class EjecucionViewSet(viewsets.ModelViewSet):
    """
    ViewSet para Ejecuciones de Programaciones.

    Endpoints:
    - GET /api/supply-chain/ejecuciones/ - Lista de ejecuciones
    - POST /api/supply-chain/ejecuciones/ - Crear ejecución
    - GET /api/supply-chain/ejecuciones/{id}/ - Detalle de ejecución
    - PUT/PATCH /api/supply-chain/ejecuciones/{id}/ - Actualizar ejecución
    - DELETE /api/supply-chain/ejecuciones/{id}/ - Eliminar ejecución
    - POST /api/supply-chain/ejecuciones/{id}/completar/ - Completar ejecución
    - GET /api/supply-chain/ejecuciones/estadisticas/ - Estadísticas
    """

    queryset = Ejecucion.objects.all()
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['programacion', 'estado', 'unidad_medida', 'ejecutado_por']
    search_fields = ['programacion__codigo', 'observaciones']
    ordering_fields = ['fecha_inicio', 'fecha_fin', 'cantidad_recolectada', 'created_at']
    ordering = ['-fecha_inicio']

    def get_queryset(self):
        queryset = super().get_queryset()

        # Filtrar por rango de fechas
        fecha_desde = self.request.query_params.get('fecha_desde')
        fecha_hasta = self.request.query_params.get('fecha_hasta')

        if fecha_desde:
            queryset = queryset.filter(fecha_inicio__gte=fecha_desde)
        if fecha_hasta:
            queryset = queryset.filter(fecha_inicio__lte=fecha_hasta)

        return queryset.select_related(
            'programacion',
            'programacion__proveedor',
            'programacion__tipo_operacion',
            'unidad_medida',
            'estado',
            'ejecutado_por'
        ).prefetch_related('liquidacion')

    def get_serializer_class(self):
        """Retornar serializer según la acción."""
        if self.action == 'list':
            return EjecucionListSerializer
        elif self.action == 'create':
            return EjecucionCreateSerializer
        else:
            return EjecucionDetailSerializer

    @action(detail=True, methods=['post'])
    def completar(self, request, pk=None):
        """
        Completar una ejecución.

        Body (opcional):
        {
            "fecha_fin": "2024-12-27T18:00:00Z",
            "kilometraje_final": 15234.50
        }
        """
        ejecucion = self.get_object()

        # Actualizar campos si se proporcionan
        if 'fecha_fin' in request.data:
            ejecucion.fecha_fin = request.data['fecha_fin']

        if 'kilometraje_final' in request.data:
            ejecucion.kilometraje_final = request.data['kilometraje_final']

        # Si no tiene fecha_fin, usar ahora
        if not ejecucion.fecha_fin:
            ejecucion.fecha_fin = timezone.now()

        # Cambiar estado a COMPLETADA si existe ese estado
        try:
            estado_completada = EstadoEjecucion.objects.get(codigo='COMPLETADA', is_active=True)
            ejecucion.estado = estado_completada
        except EstadoEjecucion.DoesNotExist:
            pass

        ejecucion.save()

        serializer = self.get_serializer(ejecucion)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def estadisticas(self, request):
        """
        Estadísticas de ejecuciones.

        GET /api/supply-chain/ejecuciones/estadisticas/?fecha_desde=YYYY-MM-DD&fecha_hasta=YYYY-MM-DD
        """
        queryset = Ejecucion.objects.all()

        fecha_desde = request.query_params.get('fecha_desde')
        fecha_hasta = request.query_params.get('fecha_hasta')

        if fecha_desde:
            queryset = queryset.filter(fecha_inicio__gte=fecha_desde)
        if fecha_hasta:
            queryset = queryset.filter(fecha_inicio__lte=fecha_hasta)

        # Estadísticas por estado
        por_estado = queryset.values('estado__nombre').annotate(
            cantidad=Count('id'),
            total_kg=Sum('cantidad_recolectada')
        ).order_by('estado__nombre')

        # Estadísticas por unidad de medida
        por_unidad = queryset.values('unidad_medida__nombre', 'unidad_medida__simbolo').annotate(
            cantidad=Count('id'),
            total=Sum('cantidad_recolectada')
        ).order_by('unidad_medida__nombre')

        # Totales generales
        totales = queryset.aggregate(
            total_ejecuciones=Count('id'),
            total_cantidad=Sum('cantidad_recolectada'),
            promedio_cantidad=Avg('cantidad_recolectada')
        )

        return Response({
            'por_estado': list(por_estado),
            'por_unidad_medida': list(por_unidad),
            'totales': totales,
            'filtros': {
                'fecha_desde': fecha_desde,
                'fecha_hasta': fecha_hasta
            }
        })


# ==============================================================================
# VIEWSET DE LIQUIDACIÓN
# ==============================================================================

class LiquidacionViewSet(viewsets.ModelViewSet):
    """
    ViewSet para Liquidaciones.

    Endpoints:
    - GET /api/supply-chain/liquidaciones/ - Lista de liquidaciones
    - POST /api/supply-chain/liquidaciones/ - Crear liquidación
    - GET /api/supply-chain/liquidaciones/{id}/ - Detalle de liquidación
    - PUT/PATCH /api/supply-chain/liquidaciones/{id}/ - Actualizar liquidación
    - DELETE /api/supply-chain/liquidaciones/{id}/ - Eliminar liquidación
    - POST /api/supply-chain/liquidaciones/{id}/aprobar/ - Aprobar liquidación
    - POST /api/supply-chain/liquidaciones/{id}/generar-cxp/ - Generar cuenta por pagar
    - GET /api/supply-chain/liquidaciones/estadisticas/ - Estadísticas
    """

    queryset = Liquidacion.objects.all()
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['ejecucion', 'estado', 'liquidado_por', 'aprobado_por', 'genera_cxp']
    search_fields = ['ejecucion__programacion__codigo', 'numero_cxp', 'observaciones']
    ordering_fields = ['fecha_liquidacion', 'valor_total', 'created_at']
    ordering = ['-fecha_liquidacion']

    def get_queryset(self):
        queryset = super().get_queryset()

        # Filtrar por rango de fechas
        fecha_desde = self.request.query_params.get('fecha_desde')
        fecha_hasta = self.request.query_params.get('fecha_hasta')

        if fecha_desde:
            queryset = queryset.filter(fecha_liquidacion__gte=fecha_desde)
        if fecha_hasta:
            queryset = queryset.filter(fecha_liquidacion__lte=fecha_hasta)

        return queryset.select_related(
            'ejecucion',
            'ejecucion__programacion',
            'ejecucion__programacion__proveedor',
            'estado',
            'liquidado_por',
            'aprobado_por'
        )

    def get_serializer_class(self):
        """Retornar serializer según la acción."""
        if self.action == 'list':
            return LiquidacionListSerializer
        elif self.action == 'create':
            return LiquidacionCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return LiquidacionUpdateSerializer
        else:
            return LiquidacionDetailSerializer

    @action(detail=True, methods=['post'])
    def aprobar(self, request, pk=None):
        """Aprobar liquidación."""
        liquidacion = self.get_object()

        if liquidacion.esta_aprobada:
            return Response(
                {'detail': 'La liquidación ya está aprobada'},
                status=status.HTTP_400_BAD_REQUEST
            )

        liquidacion.aprobar(request.user)

        serializer = self.get_serializer(liquidacion)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], url_path='generar-cxp')
    def generar_cxp(self, request, pk=None):
        """
        Generar cuenta por pagar en el módulo contable.

        Body (opcional):
        {
            "observaciones_cxp": "Observaciones adicionales para CxP"
        }
        """
        liquidacion = self.get_object()

        if not liquidacion.esta_aprobada:
            return Response(
                {'detail': 'La liquidación debe estar aprobada antes de generar CxP'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if liquidacion.genera_cxp and liquidacion.numero_cxp:
            return Response(
                {
                    'detail': 'Esta liquidación ya tiene una CxP generada',
                    'numero_cxp': liquidacion.numero_cxp
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # TODO: Integración con módulo contable para generar CxP
        # Por ahora solo marcamos que genera CxP
        # En futuro: crear registro en módulo contable/cuentas_por_pagar

        liquidacion.genera_cxp = True
        liquidacion.numero_cxp = f"CXP-{liquidacion.ejecucion.programacion.codigo}"
        liquidacion.save()

        serializer = self.get_serializer(liquidacion)
        return Response({
            'detail': 'Cuenta por pagar generada exitosamente',
            'numero_cxp': liquidacion.numero_cxp,
            'liquidacion': serializer.data
        })

    @action(detail=False, methods=['get'])
    def estadisticas(self, request):
        """
        Estadísticas de liquidaciones.

        GET /api/supply-chain/liquidaciones/estadisticas/?fecha_desde=YYYY-MM-DD&fecha_hasta=YYYY-MM-DD
        """
        queryset = Liquidacion.objects.all()

        fecha_desde = request.query_params.get('fecha_desde')
        fecha_hasta = request.query_params.get('fecha_hasta')

        if fecha_desde:
            queryset = queryset.filter(fecha_liquidacion__gte=fecha_desde)
        if fecha_hasta:
            queryset = queryset.filter(fecha_liquidacion__lte=fecha_hasta)

        # Estadísticas por estado
        por_estado = queryset.values('estado__nombre').annotate(
            cantidad=Count('id'),
            total_valor=Sum('valor_total'),
            promedio_valor=Avg('valor_total')
        ).order_by('estado__nombre')

        # Estadísticas por proveedor
        por_proveedor = queryset.values(
            'ejecucion__programacion__proveedor__nombre_comercial'
        ).annotate(
            cantidad=Count('id'),
            total_valor=Sum('valor_total')
        ).order_by('-total_valor')[:10]

        # Totales generales
        totales = queryset.aggregate(
            total_liquidaciones=Count('id'),
            total_valor=Sum('valor_total'),
            total_deducciones=Sum('deducciones'),
            promedio_valor=Avg('valor_total'),
            aprobadas=Count('id', filter=Q(aprobado_por__isnull=False)),
            con_cxp=Count('id', filter=Q(genera_cxp=True))
        )

        return Response({
            'por_estado': list(por_estado),
            'por_proveedor': list(por_proveedor),
            'totales': totales,
            'filtros': {
                'fecha_desde': fecha_desde,
                'fecha_hasta': fecha_hasta
            }
        })
