"""
Views para Recepción de Materia Prima - Production Ops
Sistema de Gestión StrateKaz

100% DINÁMICO: ViewSets con StandardViewSetMixin y acciones especiales.

Autor: Sistema de Gestión
Fecha: 2025-12-28
"""
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, Count, Sum, Avg, Min, Max
from django.utils import timezone
from datetime import datetime, timedelta
from decimal import Decimal

from apps.core.mixins import StandardViewSetMixin
from .models import (
    TipoRecepcion,
    EstadoRecepcion,
    PuntoRecepcion,
    Recepcion,
    DetalleRecepcion,
    ControlCalidadRecepcion,
    PruebaAcidez,
)
from .serializers import (
    # Catálogos
    TipoRecepcionSerializer,
    TipoRecepcionListSerializer,
    EstadoRecepcionSerializer,
    EstadoRecepcionListSerializer,
    PuntoRecepcionSerializer,
    PuntoRecepcionListSerializer,
    # Recepción
    RecepcionListSerializer,
    RecepcionDetailSerializer,
    RecepcionCreateSerializer,
    RecepcionUpdateSerializer,
    CambiarEstadoSerializer,
    # Detalle y Control
    DetalleRecepcionSerializer,
    ControlCalidadRecepcionSerializer,
    RegistrarControlCalidadSerializer,
    # Pruebas de Acidez
    PruebaAcidezListSerializer,
    PruebaAcidezDetailSerializer,
    PruebaAcidezCreateSerializer,
    SimularPruebaAcidezSerializer,
)


# ==============================================================================
# VIEWSETS DE CATÁLOGOS DINÁMICOS
# ==============================================================================

class TipoRecepcionViewSet(StandardViewSetMixin, viewsets.ModelViewSet):
    """
    ViewSet para Tipos de Recepción (catálogo dinámico).

    Endpoints:
    - GET /api/production-ops/recepcion/tipos-recepcion/
    - POST /api/production-ops/recepcion/tipos-recepcion/
    - GET /api/production-ops/recepcion/tipos-recepcion/{id}/
    - PUT/PATCH /api/production-ops/recepcion/tipos-recepcion/{id}/
    - DELETE /api/production-ops/recepcion/tipos-recepcion/{id}/
    - POST /api/production-ops/recepcion/tipos-recepcion/{id}/toggle-active/
    - POST /api/production-ops/recepcion/tipos-recepcion/bulk-activate/
    - POST /api/production-ops/recepcion/tipos-recepcion/bulk-deactivate/
    - POST /api/production-ops/recepcion/tipos-recepcion/reorder/
    """

    queryset = TipoRecepcion.objects.all()
    serializer_class = TipoRecepcionSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['is_active', 'requiere_pesaje', 'requiere_acidez']
    search_fields = ['codigo', 'nombre']
    ordering_fields = ['orden', 'nombre', 'codigo', 'created_at']
    ordering = ['orden', 'nombre']


class EstadoRecepcionViewSet(StandardViewSetMixin, viewsets.ModelViewSet):
    """
    ViewSet para Estados de Recepción (catálogo dinámico).

    Endpoints:
    - GET /api/production-ops/recepcion/estados-recepcion/
    - POST /api/production-ops/recepcion/estados-recepcion/
    - GET /api/production-ops/recepcion/estados-recepcion/{id}/
    - PUT/PATCH /api/production-ops/recepcion/estados-recepcion/{id}/
    - DELETE /api/production-ops/recepcion/estados-recepcion/{id}/
    - GET /api/production-ops/recepcion/estados-recepcion/iniciales/ - Estados iniciales
    - GET /api/production-ops/recepcion/estados-recepcion/finales/ - Estados finales
    """

    queryset = EstadoRecepcion.objects.all()
    serializer_class = EstadoRecepcionSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['is_active', 'es_inicial', 'es_final', 'genera_inventario']
    search_fields = ['codigo', 'nombre']
    ordering_fields = ['orden', 'nombre', 'codigo']
    ordering = ['orden', 'nombre']

    @action(detail=False, methods=['get'])
    def iniciales(self, request):
        """Listar estados iniciales activos."""
        estados = self.get_queryset().filter(es_inicial=True, is_active=True)
        serializer = EstadoRecepcionListSerializer(estados, many=True)
        return Response({
            'count': estados.count(),
            'estados': serializer.data
        })

    @action(detail=False, methods=['get'])
    def finales(self, request):
        """Listar estados finales activos."""
        estados = self.get_queryset().filter(es_final=True, is_active=True)
        serializer = EstadoRecepcionListSerializer(estados, many=True)
        return Response({
            'count': estados.count(),
            'estados': serializer.data
        })


class PuntoRecepcionViewSet(StandardViewSetMixin, viewsets.ModelViewSet):
    """
    ViewSet para Puntos de Recepción.

    Endpoints:
    - GET /api/production-ops/recepcion/puntos-recepcion/
    - POST /api/production-ops/recepcion/puntos-recepcion/
    - GET /api/production-ops/recepcion/puntos-recepcion/{id}/
    - PUT/PATCH /api/production-ops/recepcion/puntos-recepcion/{id}/
    - DELETE /api/production-ops/recepcion/puntos-recepcion/{id}/
    - POST /api/production-ops/recepcion/puntos-recepcion/{id}/toggle-active/
    """

    queryset = PuntoRecepcion.objects.all()
    serializer_class = PuntoRecepcionSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['empresa', 'is_active']
    search_fields = ['codigo', 'nombre', 'ubicacion']
    ordering_fields = ['orden', 'nombre', 'codigo', 'created_at']
    ordering = ['empresa', 'orden', 'nombre']

    def get_queryset(self):
        """Filtrar por empresa del query param."""
        queryset = super().get_queryset()

        # Filtrar por empresa
        empresa_id = self.request.query_params.get('empresa_id')
        if empresa_id:
            queryset = queryset.filter(empresa_id=empresa_id)

        return queryset.select_related('empresa', 'created_by')


# ==============================================================================
# VIEWSET DE RECEPCIÓN
# ==============================================================================

class RecepcionViewSet(StandardViewSetMixin, viewsets.ModelViewSet):
    """
    ViewSet completo para Recepciones de Materia Prima (100% dinámico).

    Endpoints:
    - GET /api/production-ops/recepcion/recepciones/ - Lista de recepciones
    - POST /api/production-ops/recepcion/recepciones/ - Crear recepción
    - GET /api/production-ops/recepcion/recepciones/{id}/ - Detalle de recepción
    - PUT/PATCH /api/production-ops/recepcion/recepciones/{id}/ - Actualizar recepción
    - DELETE /api/production-ops/recepcion/recepciones/{id}/ - Eliminar recepción
    - POST /api/production-ops/recepcion/recepciones/{id}/cambiar-estado/ - Cambiar estado
    - POST /api/production-ops/recepcion/recepciones/{id}/registrar-control-calidad/ - Registrar control
    - GET /api/production-ops/recepcion/recepciones/{id}/generar-reporte/ - Generar reporte
    - GET /api/production-ops/recepcion/recepciones/por-estado/?estado_id=X - Por estado
    - GET /api/production-ops/recepcion/recepciones/estadisticas/ - Estadísticas
    - POST /api/production-ops/recepcion/recepciones/{id}/toggle-active/
    """

    queryset = Recepcion.objects.all()
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = [
        'empresa', 'proveedor_id', 'tipo_recepcion', 'punto_recepcion',
        'estado', 'programacion_id', 'recibido_por', 'is_active'
    ]
    search_fields = [
        'codigo', 'proveedor_nombre',
        'vehiculo_proveedor', 'conductor_proveedor', 'observaciones'
    ]
    ordering_fields = [
        'fecha', 'created_at', 'codigo', 'peso_bruto', 'peso_neto'
    ]
    ordering = ['-fecha', '-created_at']

    def get_queryset(self):
        """Filtrar por empresa y optimizar consultas."""
        queryset = super().get_queryset()

        # Filtrar por empresa
        empresa_id = self.request.query_params.get('empresa_id')
        if empresa_id:
            queryset = queryset.filter(empresa_id=empresa_id)

        # Filtrar por rango de fechas
        fecha_desde = self.request.query_params.get('fecha_desde')
        fecha_hasta = self.request.query_params.get('fecha_hasta')

        if fecha_desde:
            queryset = queryset.filter(fecha__gte=fecha_desde)
        if fecha_hasta:
            queryset = queryset.filter(fecha__lte=fecha_hasta)

        # Optimizar consultas
        return queryset.select_related(
            'empresa',
            'proveedor',
            'tipo_recepcion',
            'punto_recepcion',
            'estado',
            'programacion',
            'recibido_por',
            'created_by'
        ).prefetch_related(
            'detalles',
            'detalles__tipo_materia_prima',
            'controles_calidad',
            'controles_calidad__verificado_por'
        )

    def get_serializer_class(self):
        """Retornar serializer según la acción."""
        if self.action == 'list':
            return RecepcionListSerializer
        elif self.action == 'create':
            return RecepcionCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return RecepcionUpdateSerializer
        elif self.action == 'cambiar_estado':
            return CambiarEstadoSerializer
        elif self.action == 'registrar_control_calidad':
            return RegistrarControlCalidadSerializer
        else:
            return RecepcionDetailSerializer

    @action(
        detail=True,
        methods=['post'],
        url_path='cambiar-estado'
    )
    def cambiar_estado(self, request, pk=None):
        """
        Cambiar estado de una recepción.

        Body:
        {
            "estado_id": 2,
            "observaciones": "Pasando a control de calidad"
        }
        """
        recepcion = self.get_object()

        serializer = CambiarEstadoSerializer(
            data=request.data,
            context={'recepcion': recepcion}
        )
        serializer.is_valid(raise_exception=True)

        nuevo_estado = serializer.context['nuevo_estado']
        observaciones = serializer.validated_data.get('observaciones', '')

        # Cambiar estado
        estado_anterior = recepcion.cambiar_estado(
            nuevo_estado=nuevo_estado,
            usuario=request.user
        )

        # Actualizar observaciones si se proporcionan
        if observaciones:
            obs_actual = recepcion.observaciones or ''
            timestamp = timezone.now().strftime('%Y-%m-%d %H:%M')
            nueva_obs = f"{obs_actual}\n[{timestamp}] Cambio de estado {estado_anterior.nombre} → {nuevo_estado.nombre}: {observaciones}"
            recepcion.observaciones = nueva_obs.strip()
            recepcion.save(update_fields=['observaciones', 'updated_at'])

        return Response({
            'detail': 'Estado actualizado exitosamente',
            'estado_anterior': {
                'id': estado_anterior.id,
                'nombre': estado_anterior.nombre
            },
            'estado_nuevo': {
                'id': nuevo_estado.id,
                'nombre': nuevo_estado.nombre,
                'color': nuevo_estado.color
            },
            'genera_inventario': nuevo_estado.genera_inventario
        })

    @action(
        detail=True,
        methods=['post'],
        url_path='registrar-control-calidad'
    )
    def registrar_control_calidad(self, request, pk=None):
        """
        Registrar control de calidad en una recepción existente.

        Body:
        {
            "parametro": "acidez",
            "valor_esperado": "< 5%",
            "valor_obtenido": "4.2%",
            "cumple": true,
            "observaciones": "Dentro de rango aceptable"
        }
        """
        recepcion = self.get_object()

        serializer = RegistrarControlCalidadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Crear control de calidad
        control = ControlCalidadRecepcion.objects.create(
            recepcion=recepcion,
            parametro=serializer.validated_data['parametro'],
            valor_esperado=serializer.validated_data['valor_esperado'],
            valor_obtenido=serializer.validated_data['valor_obtenido'],
            cumple=serializer.validated_data['cumple'],
            observaciones=serializer.validated_data.get('observaciones', ''),
            verificado_por=request.user
        )

        control_serializer = ControlCalidadRecepcionSerializer(control)

        return Response({
            'detail': 'Control de calidad registrado exitosamente',
            'control': control_serializer.data
        }, status=status.HTTP_201_CREATED)

    @action(
        detail=True,
        methods=['get'],
        url_path='generar-reporte'
    )
    def generar_reporte(self, request, pk=None):
        """
        Generar reporte completo de la recepción.

        Retorna toda la información de la recepción formateada para impresión/PDF.
        """
        recepcion = self.get_object()

        # Serializar recepción completa
        recepcion_data = RecepcionDetailSerializer(recepcion).data

        # Calcular totales
        detalles = recepcion.detalles.all()
        total_cantidad = sum(d.cantidad for d in detalles)
        total_valor = sum(d.subtotal for d in detalles)

        # Controles de calidad
        controles = recepcion.controles_calidad.all()
        controles_cumplidos = controles.filter(cumple=True).count()
        controles_total = controles.count()

        return Response({
            'recepcion': recepcion_data,
            'resumen': {
                'total_items': detalles.count(),
                'total_cantidad': str(total_cantidad),
                'total_valor': str(total_valor),
                'controles_total': controles_total,
                'controles_cumplidos': controles_cumplidos,
                'controles_porcentaje': round(
                    (controles_cumplidos / controles_total * 100) if controles_total > 0 else 0,
                    2
                ),
                'duracion_recepcion_minutos': recepcion.duracion_recepcion,
            },
            'generado_por': request.user.get_full_name(),
            'fecha_generacion': timezone.now(),
        })

    @action(
        detail=False,
        methods=['get'],
        url_path='por-estado'
    )
    def por_estado(self, request):
        """
        Listar recepciones filtradas por estado.

        GET /api/production-ops/recepcion/recepciones/por-estado/?estado_id=1
        """
        estado_id = request.query_params.get('estado_id')

        if not estado_id:
            return Response(
                {'detail': 'Debe proporcionar el parámetro "estado_id"'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            estado = EstadoRecepcion.objects.get(pk=estado_id)
        except EstadoRecepcion.DoesNotExist:
            return Response(
                {'detail': 'Estado no encontrado'},
                status=status.HTTP_404_NOT_FOUND
            )

        recepciones = self.filter_queryset(
            self.get_queryset().filter(estado=estado)
        )

        # Paginación
        page = self.paginate_queryset(recepciones)
        if page is not None:
            serializer = RecepcionListSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = RecepcionListSerializer(recepciones, many=True)

        return Response({
            'estado': {
                'id': estado.id,
                'nombre': estado.nombre,
                'color': estado.color
            },
            'count': recepciones.count(),
            'recepciones': serializer.data
        })

    @action(detail=False, methods=['get'])
    def estadisticas(self, request):
        """
        Estadísticas de recepciones.

        GET /api/production-ops/recepcion/recepciones/estadisticas/
        Parámetros opcionales:
        - empresa_id: Filtrar por empresa
        - fecha_desde: Fecha inicio
        - fecha_hasta: Fecha fin
        - proveedor_id: Filtrar por proveedor
        """
        queryset = self.filter_queryset(self.get_queryset())

        # Filtros adicionales
        empresa_id = request.query_params.get('empresa_id')
        proveedor_id = request.query_params.get('proveedor_id')
        fecha_desde = request.query_params.get('fecha_desde')
        fecha_hasta = request.query_params.get('fecha_hasta')

        if empresa_id:
            queryset = queryset.filter(empresa_id=empresa_id)
        if proveedor_id:
            queryset = queryset.filter(proveedor_id=proveedor_id)
        if fecha_desde:
            queryset = queryset.filter(fecha__gte=fecha_desde)
        if fecha_hasta:
            queryset = queryset.filter(fecha__lte=fecha_hasta)

        # Estadísticas por estado
        por_estado = queryset.values(
            'estado__nombre', 'estado__color'
        ).annotate(
            cantidad=Count('id'),
            peso_total=Sum('peso_neto')
        ).order_by('-cantidad')

        # Estadísticas por tipo de recepción
        por_tipo = queryset.values(
            'tipo_recepcion__nombre'
        ).annotate(
            cantidad=Count('id'),
            peso_total=Sum('peso_neto')
        ).order_by('-cantidad')

        # Estadísticas por proveedor (top 10)
        por_proveedor = queryset.values(
            'proveedor__nombre_comercial', 'proveedor__id'
        ).annotate(
            cantidad=Count('id'),
            peso_total=Sum('peso_neto')
        ).order_by('-cantidad')[:10]

        # Estadísticas por punto de recepción
        por_punto = queryset.values(
            'punto_recepcion__nombre'
        ).annotate(
            cantidad=Count('id'),
            peso_total=Sum('peso_neto')
        ).order_by('-cantidad')

        # Totales generales
        totales = queryset.aggregate(
            total_recepciones=Count('id'),
            peso_bruto_total=Sum('peso_bruto'),
            peso_tara_total=Sum('peso_tara'),
            peso_neto_total=Sum('peso_neto'),
            peso_neto_promedio=Avg('peso_neto'),
            peso_neto_min=Min('peso_neto'),
            peso_neto_max=Max('peso_neto'),
            temperatura_promedio=Avg('temperatura_llegada'),
        )

        # Estadísticas de detalles
        from .models import DetalleRecepcion
        detalles_stats = DetalleRecepcion.objects.filter(
            recepcion__in=queryset
        ).aggregate(
            total_valor=Sum('subtotal'),
            total_cantidad=Sum('cantidad'),
            precio_promedio=Avg('precio_unitario'),
        )

        # Estadísticas de controles de calidad
        controles_stats = ControlCalidadRecepcion.objects.filter(
            recepcion__in=queryset
        ).aggregate(
            total_controles=Count('id'),
            controles_cumplidos=Count('id', filter=Q(cumple=True)),
            controles_no_cumplidos=Count('id', filter=Q(cumple=False)),
        )

        # Calcular porcentaje de cumplimiento
        if controles_stats['total_controles'] > 0:
            controles_stats['porcentaje_cumplimiento'] = round(
                (controles_stats['controles_cumplidos'] / controles_stats['total_controles']) * 100,
                2
            )
        else:
            controles_stats['porcentaje_cumplimiento'] = 0

        # Recepciones por mes (últimos 12 meses)
        from django.db.models.functions import TruncMonth
        doce_meses_atras = timezone.now().date() - timedelta(days=365)

        por_mes = queryset.filter(
            fecha__gte=doce_meses_atras
        ).annotate(
            mes=TruncMonth('fecha')
        ).values('mes').annotate(
            cantidad=Count('id'),
            peso_total=Sum('peso_neto')
        ).order_by('mes')

        return Response({
            'filtros': {
                'empresa_id': empresa_id,
                'proveedor_id': proveedor_id,
                'fecha_desde': fecha_desde,
                'fecha_hasta': fecha_hasta,
            },
            'totales': totales,
            'detalles': detalles_stats,
            'controles_calidad': controles_stats,
            'por_estado': list(por_estado),
            'por_tipo_recepcion': list(por_tipo),
            'por_proveedor': list(por_proveedor),
            'por_punto_recepcion': list(por_punto),
            'por_mes': list(por_mes),
        })


# ==============================================================================
# VIEWSET DE DETALLE DE RECEPCIÓN
# ==============================================================================

class DetalleRecepcionViewSet(viewsets.ModelViewSet):
    """
    ViewSet para Detalles de Recepción (nested bajo recepcion).

    Endpoints:
    - GET /api/production-ops/recepcion/detalles-recepcion/
    - POST /api/production-ops/recepcion/detalles-recepcion/
    - GET /api/production-ops/recepcion/detalles-recepcion/{id}/
    - PUT/PATCH /api/production-ops/recepcion/detalles-recepcion/{id}/
    - DELETE /api/production-ops/recepcion/detalles-recepcion/{id}/
    - GET /api/production-ops/recepcion/detalles-recepcion/por-recepcion/{recepcion_id}/
    """

    queryset = DetalleRecepcion.objects.all()
    serializer_class = DetalleRecepcionSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['recepcion', 'tipo_materia_prima_id', 'unidad_medida']
    ordering_fields = ['cantidad', 'precio_unitario', 'subtotal', 'created_at']
    ordering = ['id']

    def get_queryset(self):
        """Optimizar consultas."""
        queryset = super().get_queryset()

        # Filtrar por recepción
        recepcion_id = self.request.query_params.get('recepcion_id')
        if recepcion_id:
            queryset = queryset.filter(recepcion_id=recepcion_id)

        return queryset.select_related(
            'recepcion',
            'tipo_materia_prima',
            'tipo_materia_prima__categoria'
        )

    @action(
        detail=False,
        methods=['get'],
        url_path='por-recepcion/(?P<recepcion_id>[^/.]+)'
    )
    def por_recepcion(self, request, recepcion_id=None):
        """
        Listar detalles de una recepción específica.

        GET /api/production-ops/recepcion/detalles-recepcion/por-recepcion/{recepcion_id}/
        """
        try:
            recepcion = Recepcion.objects.get(pk=recepcion_id)
        except Recepcion.DoesNotExist:
            return Response(
                {'detail': 'Recepción no encontrada'},
                status=status.HTTP_404_NOT_FOUND
            )

        detalles = DetalleRecepcion.objects.filter(
            recepcion=recepcion
        ).select_related('tipo_materia_prima', 'tipo_materia_prima__categoria')

        serializer = DetalleRecepcionSerializer(detalles, many=True)

        # Calcular totales
        total_cantidad = sum(d.cantidad for d in detalles)
        total_valor = sum(d.subtotal for d in detalles)

        return Response({
            'recepcion': {
                'id': recepcion.id,
                'codigo': recepcion.codigo,
                'fecha': recepcion.fecha,
            },
            'count': detalles.count(),
            'total_cantidad': str(total_cantidad),
            'total_valor': str(total_valor),
            'detalles': serializer.data
        })


# ==============================================================================
# VIEWSET DE CONTROL DE CALIDAD
# ==============================================================================

class ControlCalidadRecepcionViewSet(viewsets.ModelViewSet):
    """
    ViewSet para Controles de Calidad de Recepción.

    Endpoints:
    - GET /api/production-ops/recepcion/controles-calidad/
    - POST /api/production-ops/recepcion/controles-calidad/
    - GET /api/production-ops/recepcion/controles-calidad/{id}/
    - PUT/PATCH /api/production-ops/recepcion/controles-calidad/{id}/
    - DELETE /api/production-ops/recepcion/controles-calidad/{id}/
    - GET /api/production-ops/recepcion/controles-calidad/por-recepcion/{recepcion_id}/
    - GET /api/production-ops/recepcion/controles-calidad/no-conformes/ - Controles no conformes
    """

    queryset = ControlCalidadRecepcion.objects.all()
    serializer_class = ControlCalidadRecepcionSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['recepcion', 'cumple', 'verificado_por', 'parametro']
    search_fields = ['parametro', 'valor_esperado', 'valor_obtenido', 'observaciones']
    ordering_fields = ['fecha_verificacion', 'created_at']
    ordering = ['-fecha_verificacion']

    def get_queryset(self):
        """Optimizar consultas."""
        queryset = super().get_queryset()

        # Filtrar por recepción
        recepcion_id = self.request.query_params.get('recepcion_id')
        if recepcion_id:
            queryset = queryset.filter(recepcion_id=recepcion_id)

        return queryset.select_related(
            'recepcion',
            'recepcion__proveedor',
            'verificado_por'
        )

    def perform_create(self, serializer):
        """Asignar verificador automáticamente."""
        serializer.save(verificado_por=self.request.user)

    @action(
        detail=False,
        methods=['get'],
        url_path='por-recepcion/(?P<recepcion_id>[^/.]+)'
    )
    def por_recepcion(self, request, recepcion_id=None):
        """
        Listar controles de calidad de una recepción específica.

        GET /api/production-ops/recepcion/controles-calidad/por-recepcion/{recepcion_id}/
        """
        try:
            recepcion = Recepcion.objects.get(pk=recepcion_id)
        except Recepcion.DoesNotExist:
            return Response(
                {'detail': 'Recepción no encontrada'},
                status=status.HTTP_404_NOT_FOUND
            )

        controles = ControlCalidadRecepcion.objects.filter(
            recepcion=recepcion
        ).select_related('verificado_por')

        serializer = ControlCalidadRecepcionSerializer(controles, many=True)

        # Calcular estadísticas
        total = controles.count()
        cumplidos = controles.filter(cumple=True).count()
        no_cumplidos = controles.filter(cumple=False).count()
        porcentaje = round((cumplidos / total * 100) if total > 0 else 0, 2)

        return Response({
            'recepcion': {
                'id': recepcion.id,
                'codigo': recepcion.codigo,
                'fecha': recepcion.fecha,
            },
            'estadisticas': {
                'total': total,
                'cumplidos': cumplidos,
                'no_cumplidos': no_cumplidos,
                'porcentaje_cumplimiento': porcentaje,
            },
            'controles': serializer.data
        })

    @action(detail=False, methods=['get'], url_path='no-conformes')
    def no_conformes(self, request):
        """
        Listar controles de calidad no conformes (que no cumplen).

        Útil para tomar acciones correctivas.
        """
        # Filtros opcionales
        empresa_id = request.query_params.get('empresa_id')
        fecha_desde = request.query_params.get('fecha_desde')
        fecha_hasta = request.query_params.get('fecha_hasta')

        controles = self.get_queryset().filter(cumple=False)

        if empresa_id:
            controles = controles.filter(recepcion__empresa_id=empresa_id)
        if fecha_desde:
            controles = controles.filter(fecha_verificacion__gte=fecha_desde)
        if fecha_hasta:
            controles = controles.filter(fecha_verificacion__lte=fecha_hasta)

        serializer = ControlCalidadRecepcionSerializer(controles, many=True)

        # Agrupar por parámetro
        por_parametro = controles.values('parametro').annotate(
            cantidad=Count('id')
        ).order_by('-cantidad')

        # Agrupar por proveedor
        por_proveedor = controles.values(
            'recepcion__proveedor__nombre_comercial',
            'recepcion__proveedor__id'
        ).annotate(
            cantidad=Count('id')
        ).order_by('-cantidad')[:10]

        return Response({
            'count': controles.count(),
            'controles': serializer.data,
            'por_parametro': list(por_parametro),
            'por_proveedor': list(por_proveedor),
            'filtros': {
                'empresa_id': empresa_id,
                'fecha_desde': fecha_desde,
                'fecha_hasta': fecha_hasta,
            }
        })


# ==============================================================================
# VIEWSET DE PRUEBA DE ACIDEZ (Migrado desde Supply Chain)
# ==============================================================================

class PruebaAcidezViewSet(viewsets.ModelViewSet):
    """
    ViewSet para Pruebas de Acidez de Sebo Procesado.

    Endpoints:
    - GET /api/production-ops/recepcion/pruebas-acidez/
    - POST /api/production-ops/recepcion/pruebas-acidez/
    - GET /api/production-ops/recepcion/pruebas-acidez/{id}/
    - DELETE /api/production-ops/recepcion/pruebas-acidez/{id}/
    - POST /api/production-ops/recepcion/pruebas-acidez/simular/
    - POST /api/production-ops/recepcion/pruebas-acidez/{id}/restore/
    - GET /api/production-ops/recepcion/pruebas-acidez/por-proveedor/{id}/
    - GET /api/production-ops/recepcion/pruebas-acidez/estadisticas/
    """

    queryset = PruebaAcidez.objects.all()
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['proveedor_id', 'calidad_resultante', 'realizado_por']
    search_fields = ['codigo_voucher', 'proveedor_nombre', 'lote_numero']
    ordering_fields = ['fecha_prueba', 'created_at', 'valor_acidez', 'cantidad_kg']
    ordering = ['-fecha_prueba']

    def get_queryset(self):
        queryset = super().get_queryset()

        include_deleted = self.request.query_params.get('include_deleted', 'false')
        if include_deleted.lower() != 'true':
            queryset = queryset.filter(deleted_at__isnull=True)

        fecha_desde = self.request.query_params.get('fecha_desde')
        fecha_hasta = self.request.query_params.get('fecha_hasta')
        if fecha_desde:
            queryset = queryset.filter(fecha_prueba__gte=fecha_desde)
        if fecha_hasta:
            queryset = queryset.filter(fecha_prueba__lte=fecha_hasta)

        return queryset.select_related('realizado_por')

    def get_serializer_class(self):
        if self.action == 'list':
            return PruebaAcidezListSerializer
        elif self.action == 'create':
            return PruebaAcidezCreateSerializer
        elif self.action == 'simular':
            return SimularPruebaAcidezSerializer
        return PruebaAcidezDetailSerializer

    def perform_create(self, serializer):
        serializer.save(realizado_por=self.request.user)

    def perform_destroy(self, instance):
        instance.soft_delete()

    @action(detail=False, methods=['post'])
    def simular(self, request):
        serializer = SimularPruebaAcidezSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        resultado = serializer.simulate()
        return Response(resultado)

    @action(detail=True, methods=['post'])
    def restore(self, request, pk=None):
        prueba = self.get_object()
        if not prueba.is_deleted:
            return Response(
                {'detail': 'La prueba no está eliminada'},
                status=status.HTTP_400_BAD_REQUEST
            )
        prueba.restore()
        serializer = self.get_serializer(prueba)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='por-proveedor/(?P<proveedor_id>[^/.]+)')
    def por_proveedor(self, request, proveedor_id=None):
        from django.apps import apps
        try:
            Proveedor = apps.get_model('catalogo_productos', 'Proveedor')
            proveedor = Proveedor.objects.get(pk=proveedor_id)
        except Exception:
            return Response(
                {'detail': 'Proveedor no encontrado'},
                status=status.HTTP_404_NOT_FOUND
            )

        pruebas = PruebaAcidez.objects.filter(
            proveedor_id=proveedor_id,
            deleted_at__isnull=True
        ).select_related('realizado_por').order_by('-fecha_prueba')

        serializer = PruebaAcidezListSerializer(pruebas, many=True)
        return Response({
            'proveedor': proveedor.nombre_comercial,
            'proveedor_id': proveedor.id,
            'total_pruebas': pruebas.count(),
            'pruebas': serializer.data
        })

    @action(detail=False, methods=['get'])
    def estadisticas(self, request):
        queryset = PruebaAcidez.objects.filter(deleted_at__isnull=True)

        fecha_desde = request.query_params.get('fecha_desde')
        fecha_hasta = request.query_params.get('fecha_hasta')
        if fecha_desde:
            queryset = queryset.filter(fecha_prueba__gte=fecha_desde)
        if fecha_hasta:
            queryset = queryset.filter(fecha_prueba__lte=fecha_hasta)

        por_calidad = queryset.values('calidad_resultante').annotate(
            cantidad=Count('id'),
            total_kg=Sum('cantidad_kg'),
            total_valor=Sum('valor_total'),
            acidez_promedio=Avg('valor_acidez')
        ).order_by('calidad_resultante')

        por_tipo = queryset.values(
            'tipo_materia_resultante_nombre'
        ).annotate(
            cantidad=Count('id'),
            total_kg=Sum('cantidad_kg'),
            total_valor=Sum('valor_total'),
            acidez_promedio=Avg('valor_acidez')
        ).order_by('tipo_materia_resultante_nombre')

        totales = queryset.aggregate(
            total_pruebas=Count('id'),
            total_kg=Sum('cantidad_kg'),
            total_valor=Sum('valor_total'),
            acidez_promedio=Avg('valor_acidez')
        )

        return Response({
            'por_calidad': list(por_calidad),
            'por_tipo_materia': list(por_tipo),
            'totales': totales,
            'filtros': {
                'fecha_desde': fecha_desde,
                'fecha_hasta': fecha_hasta
            }
        })
