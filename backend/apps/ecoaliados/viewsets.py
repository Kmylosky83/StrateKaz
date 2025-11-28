"""
ViewSets del módulo Ecoaliados - API REST
Sistema de Gestión Grasas y Huesos del Norte
"""
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone

from .models import Ecoaliado, HistorialPrecioEcoaliado
from .serializers import (
    EcoaliadoListSerializer,
    EcoaliadoDetailSerializer,
    EcoaliadoCreateSerializer,
    EcoaliadoUpdateSerializer,
    CambiarPrecioEcoaliadoSerializer,
    HistorialPrecioEcoaliadoSerializer,
)
from .permissions import (
    CanManageEcoaliados,
    CanChangePrecioEcoaliado,
)
from .filters import EcoaliadoFilter


class EcoaliadoViewSet(viewsets.ModelViewSet):
    """
    ViewSet completo para Ecoaliados

    Permisos por rol:
    - comercial_econorte: Solo CRUD de sus propios ecoaliados (filtrado por comercial_asignado)
    - lider_com_econorte: CRUD de todos los ecoaliados
    - gerente/superadmin: CRUD de todos los ecoaliados

    Endpoints:
    - GET /api/ecoaliados/ecoaliados/ - Lista de ecoaliados
    - POST /api/ecoaliados/ecoaliados/ - Crear ecoaliado (Comercial+)
    - GET /api/ecoaliados/ecoaliados/{id}/ - Detalle de ecoaliado
    - PUT/PATCH /api/ecoaliados/ecoaliados/{id}/ - Actualizar ecoaliado
    - DELETE /api/ecoaliados/ecoaliados/{id}/ - Soft delete (Líder Comercial+)
    - POST /api/ecoaliados/ecoaliados/{id}/cambiar-precio/ - Cambiar precio (SOLO Líder Comercial+)
    - GET /api/ecoaliados/ecoaliados/{id}/historial-precios/ - Ver historial completo
    - POST /api/ecoaliados/ecoaliados/{id}/restore/ - Restaurar eliminado
    """

    queryset = Ecoaliado.objects.all()
    permission_classes = [IsAuthenticated, CanManageEcoaliados]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = EcoaliadoFilter
    search_fields = ['codigo', 'razon_social', 'documento_numero', 'telefono']
    ordering_fields = ['codigo', 'razon_social', 'created_at', 'precio_compra_kg']
    ordering = ['-created_at']

    def get_queryset(self):
        """
        Filtrar ecoaliados según permisos del usuario
        - comercial_econorte: Solo SUS ecoaliados
        - lider_com_econorte: Todos los ecoaliados
        - lider_log_econorte: Todos los ecoaliados (solo lectura)
        - gerente/superadmin: Todos los ecoaliados
        """
        queryset = super().get_queryset()

        # Excluir eliminados lógicamente por defecto
        include_deleted = self.request.query_params.get('include_deleted', 'false')
        if include_deleted.lower() != 'true':
            queryset = queryset.filter(deleted_at__isnull=True)

        # Aplicar filtros por rol
        user = self.request.user

        # SuperAdmin ve todo
        if user.is_superuser:
            return queryset.select_related(
                'unidad_negocio',
                'comercial_asignado',
                'created_by'
            ).prefetch_related('historial_precios')

        # Gerente (nivel 3+) ve todo
        if user.has_cargo_level(3):
            return queryset.select_related(
                'unidad_negocio',
                'comercial_asignado',
                'created_by'
            ).prefetch_related('historial_precios')

        # Verificar que tenga cargo
        if not user.cargo:
            return queryset.none()

        # Líder Comercial Econorte ve todos los ecoaliados
        if user.cargo.code == 'lider_com_econorte':
            return queryset.select_related(
                'unidad_negocio',
                'comercial_asignado',
                'created_by'
            ).prefetch_related('historial_precios')

        # Líder Logística Econorte ve todos los ecoaliados (solo lectura)
        if user.cargo.code == 'lider_log_econorte':
            return queryset.select_related(
                'unidad_negocio',
                'comercial_asignado',
                'created_by'
            ).prefetch_related('historial_precios')

        # Comercial Econorte ve SOLO sus ecoaliados
        if user.cargo.code == 'comercial_econorte':
            return queryset.filter(
                comercial_asignado=user
            ).select_related(
                'unidad_negocio',
                'comercial_asignado',
                'created_by'
            ).prefetch_related('historial_precios')

        # Si no tiene cargo permitido, no ve nada
        return queryset.none()

    def get_serializer_class(self):
        """Retornar serializer según la acción"""
        if self.action == 'list':
            return EcoaliadoListSerializer
        elif self.action == 'create':
            return EcoaliadoCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return EcoaliadoUpdateSerializer
        elif self.action == 'cambiar_precio':
            return CambiarPrecioEcoaliadoSerializer
        else:
            return EcoaliadoDetailSerializer

    def perform_create(self, serializer):
        """Guardar quién creó el ecoaliado"""
        serializer.save(created_by=self.request.user)

    def perform_destroy(self, instance):
        """Soft delete de ecoaliado"""
        instance.soft_delete()

    @action(
        detail=True,
        methods=['post'],
        permission_classes=[IsAuthenticated, CanChangePrecioEcoaliado],
        url_path='cambiar-precio'
    )
    def cambiar_precio(self, request, pk=None):
        """
        Cambiar precio de ecoaliado

        SOLO Líder Comercial Econorte, Gerente o SuperAdmin pueden ejecutar esta acción

        Body:
        {
            "precio_nuevo": 1500.00,
            "justificacion": "Ajuste por inflación"
        }
        """
        ecoaliado = self.get_object()

        # Validar que no esté eliminado
        if ecoaliado.is_deleted:
            return Response(
                {'detail': 'No se puede cambiar el precio de un ecoaliado eliminado'},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = CambiarPrecioEcoaliadoSerializer(
            data=request.data,
            context={
                'ecoaliado': ecoaliado,
                'usuario': request.user
            }
        )
        serializer.is_valid(raise_exception=True)

        # Guardar (actualiza precio en ecoaliado y crea historial)
        historial = serializer.save()

        return Response({
            'detail': 'Precio actualizado exitosamente',
            'ecoaliado_codigo': ecoaliado.codigo,
            'ecoaliado_razon_social': ecoaliado.razon_social,
            'precio_anterior': historial.precio_anterior,
            'precio_nuevo': historial.precio_nuevo,
            'diferencia': float(historial.precio_nuevo - historial.precio_anterior),
            'tipo_cambio': historial.tipo_cambio,
            'tipo_cambio_display': historial.get_tipo_cambio_display(),
            'modificado_por': request.user.get_full_name(),
            'fecha_modificacion': historial.fecha_modificacion
        })

    @action(
        detail=True,
        methods=['get'],
        url_path='historial-precios'
    )
    def historial_precios(self, request, pk=None):
        """Ver historial completo de cambios de precio del ecoaliado"""
        ecoaliado = self.get_object()

        # Obtener historial completo ordenado
        historial = HistorialPrecioEcoaliado.objects.filter(
            ecoaliado=ecoaliado
        ).select_related('modificado_por').order_by('-fecha_modificacion')

        return Response({
            'ecoaliado': {
                'id': ecoaliado.id,
                'codigo': ecoaliado.codigo,
                'razon_social': ecoaliado.razon_social,
                'precio_actual': ecoaliado.precio_compra_kg,
            },
            'total_cambios': historial.count(),
            'historial': HistorialPrecioEcoaliadoSerializer(historial, many=True).data
        })

    @action(
        detail=True,
        methods=['post'],
        permission_classes=[IsAuthenticated, CanManageEcoaliados]
    )
    def restore(self, request, pk=None):
        """Restaurar ecoaliado eliminado (solo Líder Comercial+)"""
        ecoaliado = self.get_object()

        if not ecoaliado.is_deleted:
            return Response(
                {'detail': 'El ecoaliado no está eliminado'},
                status=status.HTTP_400_BAD_REQUEST
            )

        ecoaliado.restore()
        serializer = self.get_serializer(ecoaliado)

        return Response({
            'detail': 'Ecoaliado restaurado exitosamente',
            'ecoaliado': serializer.data
        })

    @action(
        detail=False,
        methods=['get'],
        url_path='estadisticas'
    )
    def estadisticas(self, request):
        """
        Obtener estadísticas de ecoaliados según permisos del usuario
        """
        from django.db.models import Count, Avg, Min, Max, Sum

        # Obtener queryset filtrado por permisos
        queryset = self.get_queryset().filter(deleted_at__isnull=True)

        # Estadísticas generales
        total = queryset.count()
        activos = queryset.filter(is_active=True).count()
        inactivos = queryset.filter(is_active=False).count()

        # Estadísticas de precios
        stats_precios = queryset.aggregate(
            precio_promedio=Avg('precio_compra_kg'),
            precio_minimo=Min('precio_compra_kg'),
            precio_maximo=Max('precio_compra_kg'),
        )

        # Por unidad de negocio
        por_unidad = queryset.values(
            'unidad_negocio__nombre_comercial'
        ).annotate(
            cantidad=Count('id'),
            precio_promedio=Avg('precio_compra_kg')
        ).order_by('-cantidad')

        # Por comercial asignado
        por_comercial = queryset.values(
            'comercial_asignado__first_name',
            'comercial_asignado__last_name'
        ).annotate(
            cantidad=Count('id')
        ).order_by('-cantidad')

        # Por ciudad
        por_ciudad = queryset.values('ciudad').annotate(
            cantidad=Count('id')
        ).order_by('-cantidad')[:10]

        # Con geolocalización
        con_geolocalizacion = queryset.exclude(
            latitud__isnull=True,
            longitud__isnull=True
        ).count()

        return Response({
            'resumen': {
                'total': total,
                'activos': activos,
                'inactivos': inactivos,
                'con_geolocalizacion': con_geolocalizacion,
                'porcentaje_geolocalizacion': round((con_geolocalizacion / total * 100) if total > 0 else 0, 2)
            },
            'precios': {
                'promedio': round(float(stats_precios['precio_promedio'] or 0), 2),
                'minimo': float(stats_precios['precio_minimo'] or 0),
                'maximo': float(stats_precios['precio_maximo'] or 0),
            },
            'por_unidad_negocio': list(por_unidad),
            'por_comercial': list(por_comercial),
            'por_ciudad': list(por_ciudad),
        })

    @action(
        detail=False,
        methods=['get'],
        permission_classes=[IsAuthenticated],
        url_path='unidades-negocio'
    )
    def unidades_negocio(self, request):
        """
        GET /api/ecoaliados/ecoaliados/unidades-negocio/
        Retorna lista de proveedores tipo UNIDAD_NEGOCIO con ACU en subtipo_materia
        Accesible para todos los usuarios autenticados (comerciales, líderes, gerentes)
        """
        from apps.proveedores.models import Proveedor

        unidades = Proveedor.objects.filter(
            tipo_proveedor='UNIDAD_NEGOCIO',
            is_active=True,
            deleted_at__isnull=True
        ).order_by('nombre_comercial')

        data = [{
            'id': unidad.id,
            'razon_social': unidad.razon_social,
            'nombre_comercial': unidad.nombre_comercial,
            'ciudad': unidad.ciudad,
            'departamento': unidad.departamento,
            'subtipo_materia': unidad.subtipo_materia,
        } for unidad in unidades]

        return Response({
            'count': len(data),
            'results': data
        }, status=status.HTTP_200_OK)


class HistorialPrecioEcoaliadoViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet de solo lectura para Historial de Precios de Ecoaliados

    Endpoints:
    - GET /api/ecoaliados/historial-precios/ - Lista de cambios de precio
    - GET /api/ecoaliados/historial-precios/{id}/ - Detalle de cambio
    """

    queryset = HistorialPrecioEcoaliado.objects.all()
    serializer_class = HistorialPrecioEcoaliadoSerializer
    permission_classes = [IsAuthenticated, CanManageEcoaliados]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['ecoaliado', 'modificado_por', 'tipo_cambio']
    ordering_fields = ['fecha_modificacion']
    ordering = ['-fecha_modificacion']

    def get_queryset(self):
        """
        Filtrar historial según permisos del usuario
        Misma lógica que EcoaliadoViewSet
        """
        queryset = super().get_queryset()
        user = self.request.user

        # SuperAdmin ve todo
        if user.is_superuser:
            return queryset.select_related('ecoaliado', 'modificado_por')

        # Gerente (nivel 3+) ve todo
        if user.has_cargo_level(3):
            return queryset.select_related('ecoaliado', 'modificado_por')

        # Verificar que tenga cargo
        if not user.cargo:
            return queryset.none()

        # Líder Comercial Econorte ve todos los historiales
        if user.cargo.code == 'lider_com_econorte':
            return queryset.select_related('ecoaliado', 'modificado_por')

        # Comercial Econorte ve SOLO historiales de sus ecoaliados
        if user.cargo.code == 'comercial_econorte':
            return queryset.filter(
                ecoaliado__comercial_asignado=user
            ).select_related('ecoaliado', 'modificado_por')

        # Si no tiene cargo permitido, no ve nada
        return queryset.none()
