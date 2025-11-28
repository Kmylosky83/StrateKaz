"""
ViewSets del módulo Proveedores - API REST
Sistema de Gestión Grasas y Huesos del Norte
"""
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q
from django.utils import timezone

from .models import (
    UnidadNegocio,
    Proveedor,
    PrecioMateriaPrima,
    HistorialPrecioProveedor,
    CondicionComercialProveedor,
    PruebaAcidez
)
from .serializers import (
    UnidadNegocioSerializer,
    ProveedorListSerializer,
    ProveedorDetailSerializer,
    ProveedorCreateSerializer,
    ProveedorUpdateSerializer,
    PrecioMateriaPrimaSerializer,
    CambiarPrecioSerializer,
    HistorialPrecioSerializer,
    CondicionComercialSerializer,
    PruebaAcidezListSerializer,
    PruebaAcidezDetailSerializer,
    PruebaAcidezCreateSerializer,
    SimularPruebaAcidezSerializer,
)
from .permissions import (
    CanManageProveedores,
    CanModifyPrecioProveedor,
    CanManageUnidadesNegocio,
    CanManageCondicionesComerciales,
)
from .filters import ProveedorFilter


class UnidadNegocioViewSet(viewsets.ModelViewSet):
    """
    ViewSet para Unidades de Negocio

    Endpoints:
    - GET /api/proveedores/unidades-negocio/ - Lista de unidades
    - POST /api/proveedores/unidades-negocio/ - Crear unidad (Admin+)
    - GET /api/proveedores/unidades-negocio/{id}/ - Detalle
    - PUT/PATCH /api/proveedores/unidades-negocio/{id}/ - Actualizar (Admin+)
    - DELETE /api/proveedores/unidades-negocio/{id}/ - Eliminar (Admin+)
    """

    queryset = UnidadNegocio.objects.all()
    serializer_class = UnidadNegocioSerializer
    permission_classes = [IsAuthenticated, CanManageUnidadesNegocio]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['tipo_unidad', 'is_active', 'responsable']
    search_fields = ['codigo', 'nombre', 'ciudad']
    ordering_fields = ['codigo', 'nombre', 'created_at']
    ordering = ['codigo']

    def get_queryset(self):
        """Excluir unidades eliminadas por defecto"""
        queryset = super().get_queryset()

        # Excluir eliminadas lógicamente
        include_deleted = self.request.query_params.get('include_deleted', 'false')
        if include_deleted.lower() != 'true':
            queryset = queryset.filter(deleted_at__isnull=True)

        return queryset.select_related('responsable')

    def perform_destroy(self, instance):
        """Soft delete de unidad de negocio"""
        instance.soft_delete()

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, CanManageUnidadesNegocio])
    def restore(self, request, pk=None):
        """Restaurar unidad de negocio eliminada"""
        unidad = self.get_object()

        if not unidad.is_deleted:
            return Response(
                {'detail': 'La unidad de negocio no está eliminada'},
                status=status.HTTP_400_BAD_REQUEST
            )

        unidad.restore()
        serializer = self.get_serializer(unidad)

        return Response(serializer.data)


class ProveedorViewSet(viewsets.ModelViewSet):
    """
    ViewSet completo para Proveedores

    Endpoints:
    - GET /api/proveedores/proveedores/ - Lista de proveedores
    - POST /api/proveedores/proveedores/ - Crear proveedor (Líder Comercial+)
    - GET /api/proveedores/proveedores/{id}/ - Detalle de proveedor
    - PUT/PATCH /api/proveedores/proveedores/{id}/ - Actualizar proveedor
    - DELETE /api/proveedores/proveedores/{id}/ - Soft delete (Admin+)
    - POST /api/proveedores/proveedores/{id}/cambiar_precio/ - Cambiar precio (SOLO Gerente)
    - GET /api/proveedores/proveedores/{id}/historial_precio/ - Ver historial de precios
    - POST /api/proveedores/proveedores/{id}/restore/ - Restaurar eliminado
    """

    queryset = Proveedor.objects.all()
    permission_classes = [IsAuthenticated, CanManageProveedores]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = ProveedorFilter
    search_fields = ['nombre_comercial', 'razon_social', 'numero_documento', 'nit']
    ordering_fields = ['nombre_comercial', 'created_at']
    ordering = ['nombre_comercial']

    def get_queryset(self):
        """Excluir proveedores eliminados por defecto"""
        queryset = super().get_queryset()

        # Excluir eliminados lógicamente
        include_deleted = self.request.query_params.get('include_deleted', 'false')
        if include_deleted.lower() != 'true':
            queryset = queryset.filter(deleted_at__isnull=True)

        return queryset.select_related(
            'unidad_negocio',
            'created_by'
        ).prefetch_related('precios_materia_prima')

    def get_serializer_class(self):
        """Retornar serializer según la acción"""
        if self.action == 'list':
            return ProveedorListSerializer
        elif self.action == 'create':
            return ProveedorCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return ProveedorUpdateSerializer
        elif self.action == 'cambiar_precio':
            return CambiarPrecioSerializer
        else:
            return ProveedorDetailSerializer

    def perform_create(self, serializer):
        """Guardar quién creó el proveedor"""
        serializer.save(created_by=self.request.user)

    def perform_destroy(self, instance):
        """Soft delete de proveedor"""
        instance.soft_delete()

    @action(
        detail=True,
        methods=['post'],
        permission_classes=[IsAuthenticated, CanModifyPrecioProveedor],
        url_path='cambiar-precio'
    )
    def cambiar_precio(self, request, pk=None):
        """
        Cambiar precio de proveedor de materia prima por tipo

        SOLO Gerente o SuperAdmin pueden ejecutar esta acción

        Body:
        {
            "tipo_materia": "SEBO",
            "precio_nuevo": 3500.00,
            "motivo": "Ajuste por inflación"
        }
        """
        proveedor = self.get_object()

        # Validar que sea proveedor de materia prima
        if not proveedor.es_proveedor_materia_prima:
            return Response(
                {'detail': 'Solo se puede cambiar precio a proveedores de materia prima'},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = CambiarPrecioSerializer(
            data=request.data,
            context={
                'proveedor': proveedor,
                'usuario': request.user
            }
        )
        serializer.is_valid(raise_exception=True)

        # Guardar (actualiza PrecioMateriaPrima y crea historial)
        precio_obj = serializer.save()

        return Response({
            'detail': 'Precio actualizado exitosamente',
            'tipo_materia': precio_obj.tipo_materia,
            'tipo_materia_display': precio_obj.get_tipo_materia_display(),
            'precio_nuevo': precio_obj.precio_kg,
            'modificado_por': request.user.get_full_name(),
            'fecha_modificacion': precio_obj.modificado_fecha
        })

    @action(
        detail=True,
        methods=['get'],
        url_path='historial-precio'
    )
    def historial_precio(self, request, pk=None):
        """Ver historial de cambios de precio del proveedor"""
        proveedor = self.get_object()

        if not proveedor.es_proveedor_materia_prima:
            return Response(
                {'detail': 'Este proveedor no es de materia prima'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Obtener precios actuales por tipo de materia
        precios_actuales = PrecioMateriaPrima.objects.filter(
            proveedor=proveedor
        ).select_related('modificado_por')

        # Obtener historial
        historial = HistorialPrecioProveedor.objects.filter(
            proveedor=proveedor
        ).select_related('modificado_por').order_by('-fecha_modificacion')

        return Response({
            'proveedor': proveedor.nombre_comercial,
            'precios_actuales': PrecioMateriaPrimaSerializer(precios_actuales, many=True).data,
            'historial': HistorialPrecioSerializer(historial, many=True).data
        })

    @action(
        detail=True,
        methods=['post'],
        permission_classes=[IsAuthenticated, CanManageProveedores]
    )
    def restore(self, request, pk=None):
        """Restaurar proveedor eliminado"""
        proveedor = self.get_object()

        if not proveedor.is_deleted:
            return Response(
                {'detail': 'El proveedor no está eliminado'},
                status=status.HTTP_400_BAD_REQUEST
            )

        proveedor.restore()
        serializer = self.get_serializer(proveedor)

        return Response(serializer.data)

    @action(
        detail=True,
        methods=['get', 'post'],
        permission_classes=[IsAuthenticated, CanManageCondicionesComerciales],
        url_path='condiciones-comerciales'
    )
    def condiciones_comerciales(self, request, pk=None):
        """
        Gestionar condiciones comerciales del proveedor

        GET: Lista condiciones comerciales
        POST: Crea nueva condición comercial
        """
        proveedor = self.get_object()

        # Validar que sea proveedor de PRODUCTO_SERVICIO
        if proveedor.tipo_proveedor != 'PRODUCTO_SERVICIO':
            return Response(
                {'detail': 'Solo proveedores de productos/servicios tienen condiciones comerciales'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if request.method == 'GET':
            condiciones = CondicionComercialProveedor.objects.filter(
                proveedor=proveedor
            ).order_by('-vigencia_desde')

            serializer = CondicionComercialSerializer(condiciones, many=True)

            return Response({
                'proveedor': proveedor.nombre_comercial,
                'condiciones': serializer.data
            })

        elif request.method == 'POST':
            serializer = CondicionComercialSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            serializer.save(proveedor=proveedor, created_by=request.user)

            return Response(serializer.data, status=status.HTTP_201_CREATED)


class HistorialPrecioViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet de solo lectura para Historial de Precios

    Endpoints:
    - GET /api/proveedores/historial-precios/ - Lista de cambios de precio
    - GET /api/proveedores/historial-precios/{id}/ - Detalle de cambio
    """

    queryset = HistorialPrecioProveedor.objects.all()
    serializer_class = HistorialPrecioSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['proveedor', 'modificado_por']
    ordering_fields = ['fecha_modificacion']
    ordering = ['-fecha_modificacion']

    def get_queryset(self):
        """Filtrar por permisos del usuario"""
        queryset = super().get_queryset()
        return queryset.select_related('proveedor', 'modificado_por')


class CondicionComercialViewSet(viewsets.ModelViewSet):
    """
    ViewSet para Condiciones Comerciales de Proveedores

    Endpoints:
    - GET /api/proveedores/condiciones-comerciales/ - Lista de condiciones
    - POST /api/proveedores/condiciones-comerciales/ - Crear condición
    - GET /api/proveedores/condiciones-comerciales/{id}/ - Detalle
    - PUT/PATCH /api/proveedores/condiciones-comerciales/{id}/ - Actualizar
    - DELETE /api/proveedores/condiciones-comerciales/{id}/ - Eliminar (Admin+)
    """

    queryset = CondicionComercialProveedor.objects.all()
    serializer_class = CondicionComercialSerializer
    permission_classes = [IsAuthenticated, CanManageCondicionesComerciales]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['proveedor']
    ordering_fields = ['vigencia_desde', 'vigencia_hasta']
    ordering = ['-vigencia_desde']

    def get_queryset(self):
        """Filtrar condiciones"""
        queryset = super().get_queryset()

        # Filtrar solo vigentes si se solicita
        solo_vigentes = self.request.query_params.get('solo_vigentes', 'false')
        if solo_vigentes.lower() == 'true':
            from datetime import date
            hoy = date.today()
            queryset = queryset.filter(
                Q(vigencia_hasta__isnull=True, vigencia_desde__lte=hoy) |
                Q(vigencia_desde__lte=hoy, vigencia_hasta__gte=hoy)
            )

        return queryset.select_related('proveedor', 'created_by')

    def perform_create(self, serializer):
        """Guardar quién creó la condición"""
        serializer.save(created_by=self.request.user)


class PruebaAcidezViewSet(viewsets.ModelViewSet):
    """
    ViewSet para Pruebas de Acidez de Sebo Procesado

    Endpoints:
    - GET /api/proveedores/pruebas-acidez/ - Lista de pruebas
    - POST /api/proveedores/pruebas-acidez/ - Crear prueba
    - GET /api/proveedores/pruebas-acidez/{id}/ - Detalle de prueba
    - DELETE /api/proveedores/pruebas-acidez/{id}/ - Soft delete (Admin+)
    - POST /api/proveedores/pruebas-acidez/simular/ - Simular resultado sin crear
    - POST /api/proveedores/pruebas-acidez/{id}/restore/ - Restaurar eliminada
    """

    queryset = PruebaAcidez.objects.all()
    permission_classes = [IsAuthenticated, CanManageProveedores]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['proveedor', 'calidad_resultante', 'realizado_por']
    search_fields = ['codigo_voucher', 'proveedor__nombre_comercial', 'lote_numero']
    ordering_fields = ['fecha_prueba', 'created_at', 'valor_acidez', 'cantidad_kg']
    ordering = ['-fecha_prueba']

    def get_queryset(self):
        """Excluir pruebas eliminadas por defecto"""
        queryset = super().get_queryset()

        # Excluir eliminadas lógicamente
        include_deleted = self.request.query_params.get('include_deleted', 'false')
        if include_deleted.lower() != 'true':
            queryset = queryset.filter(deleted_at__isnull=True)

        # Filtrar por rango de fechas
        fecha_desde = self.request.query_params.get('fecha_desde')
        fecha_hasta = self.request.query_params.get('fecha_hasta')

        if fecha_desde:
            queryset = queryset.filter(fecha_prueba__gte=fecha_desde)
        if fecha_hasta:
            queryset = queryset.filter(fecha_prueba__lte=fecha_hasta)

        return queryset.select_related('proveedor', 'realizado_por')

    def get_serializer_class(self):
        """Retornar serializer según la acción"""
        if self.action == 'list':
            return PruebaAcidezListSerializer
        elif self.action == 'create':
            return PruebaAcidezCreateSerializer
        elif self.action == 'simular':
            return SimularPruebaAcidezSerializer
        else:
            return PruebaAcidezDetailSerializer

    def perform_create(self, serializer):
        """Guardar quién realizó la prueba"""
        serializer.save(realizado_por=self.request.user)

    def perform_destroy(self, instance):
        """Soft delete de prueba de acidez"""
        instance.soft_delete()

    @action(detail=False, methods=['post'])
    def simular(self, request):
        """
        Simular resultado de prueba de acidez sin crear registro

        Útil para mostrar al usuario qué calidad obtendrá antes de confirmar

        Body:
        {
            "valor_acidez": 4.5,
            "proveedor_id": 123,
            "cantidad_kg": 500  (opcional)
        }
        """
        serializer = SimularPruebaAcidezSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        resultado = serializer.simulate()

        return Response(resultado)

    @action(detail=True, methods=['post'])
    def restore(self, request, pk=None):
        """Restaurar prueba de acidez eliminada"""
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
        """
        Lista pruebas de acidez de un proveedor específico

        GET /api/proveedores/pruebas-acidez/por-proveedor/{proveedor_id}/
        """
        try:
            proveedor = Proveedor.objects.get(pk=proveedor_id)
        except Proveedor.DoesNotExist:
            return Response(
                {'detail': 'Proveedor no encontrado'},
                status=status.HTTP_404_NOT_FOUND
            )

        if not proveedor.subtipo_materia or 'SEBO' not in proveedor.subtipo_materia:
            return Response(
                {'detail': 'El proveedor no maneja SEBO'},
                status=status.HTTP_400_BAD_REQUEST
            )

        pruebas = PruebaAcidez.objects.filter(
            proveedor=proveedor,
            deleted_at__isnull=True
        ).order_by('-fecha_prueba')

        serializer = PruebaAcidezListSerializer(pruebas, many=True)

        return Response({
            'proveedor': proveedor.nombre_comercial,
            'proveedor_id': proveedor.id,
            'total_pruebas': pruebas.count(),
            'pruebas': serializer.data
        })

    @action(detail=False, methods=['get'])
    def estadisticas(self, request):
        """
        Estadísticas de pruebas de acidez

        GET /api/proveedores/pruebas-acidez/estadisticas/
        """
        from django.db.models import Avg, Sum, Count

        # Filtrar por rango de fechas si se proporcionan
        queryset = PruebaAcidez.objects.filter(deleted_at__isnull=True)

        fecha_desde = request.query_params.get('fecha_desde')
        fecha_hasta = request.query_params.get('fecha_hasta')

        if fecha_desde:
            queryset = queryset.filter(fecha_prueba__gte=fecha_desde)
        if fecha_hasta:
            queryset = queryset.filter(fecha_prueba__lte=fecha_hasta)

        # Estadísticas por calidad
        por_calidad = queryset.values('calidad_resultante').annotate(
            cantidad=Count('id'),
            total_kg=Sum('cantidad_kg'),
            total_valor=Sum('valor_total'),
            acidez_promedio=Avg('valor_acidez')
        ).order_by('calidad_resultante')

        # Estadísticas generales
        totales = queryset.aggregate(
            total_pruebas=Count('id'),
            total_kg=Sum('cantidad_kg'),
            total_valor=Sum('valor_total'),
            acidez_promedio=Avg('valor_acidez')
        )

        return Response({
            'por_calidad': list(por_calidad),
            'totales': totales,
            'filtros': {
                'fecha_desde': fecha_desde,
                'fecha_hasta': fecha_hasta
            }
        })
