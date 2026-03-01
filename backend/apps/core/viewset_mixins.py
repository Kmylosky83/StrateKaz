"""
ViewSet Mixins - Core
Sistema de Gestión StrateKaz

Mixins reutilizables para optimizar ViewSets con select_related,
prefetch_related y caché automático.

Autor: Sistema de Gestión
Fecha: 2025-12-30
"""
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.db.models import QuerySet
from django.core.cache import cache
from .cache_utils import generate_cache_key, cache_list_view
from typing import Dict, List, Optional


class TenantModelViewSetMixin:
    """
    Base mixin for all tenant-model ViewSets.
    Provides standard permissions, filtering, and soft-delete awareness.

    Automatically:
    - Requires IsAuthenticated
    - Enables DjangoFilterBackend, SearchFilter, OrderingFilter
    - Filters out soft-deleted records (is_deleted=False)
    - Sets created_by on create, updated_by on update

    Ejemplo:
        class MiViewSet(TenantModelViewSetMixin, viewsets.ModelViewSet):
            queryset = MiModelo.objects.all()
            serializer_class = MiSerializer
    """
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]

    def get_queryset(self):
        qs = super().get_queryset()
        if hasattr(qs.model, 'is_deleted'):
            qs = qs.filter(is_deleted=False)
        return qs

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)


class OptimizedQuerySetMixin:
    """
    Mixin para optimizar queries con select_related y prefetch_related.

    Define en tu ViewSet:
        select_related_fields: List[str] - Campos para select_related
        prefetch_related_fields: List[str] - Campos para prefetch_related

    Ejemplo:
        class ClienteViewSet(OptimizedQuerySetMixin, viewsets.ModelViewSet):
            queryset = Cliente.objects.all()
            select_related_fields = ['tipo_cliente', 'estado_cliente', 'vendedor_asignado']
            prefetch_related_fields = ['contactos', 'segmentos']
    """

    select_related_fields: List[str] = []
    prefetch_related_fields: List[str] = []

    def get_queryset(self) -> QuerySet:
        """
        Aplica select_related y prefetch_related automáticamente.
        """
        queryset = super().get_queryset()

        # Aplicar select_related
        if self.select_related_fields:
            queryset = queryset.select_related(*self.select_related_fields)

        # Aplicar prefetch_related
        if self.prefetch_related_fields:
            queryset = queryset.prefetch_related(*self.prefetch_related_fields)

        return queryset


class CompanyFilterMixin:
    """
    Mixin para filtrar automáticamente por empresa del tenant.

    NOTA: En multi-tenant con django-tenants, el aislamiento por schema
    ya filtra los datos por tenant. Este mixin solo es necesario si el
    modelo tiene campo 'empresa' y hay múltiples empresas por schema.

    Usa get_tenant_empresa() en lugar de request.user.empresa
    (core.User NO tiene atributo empresa).
    """

    def get_queryset(self) -> QuerySet:
        """
        Filtra automáticamente por empresa del tenant actual.
        """
        queryset = super().get_queryset()

        if hasattr(self.request, 'user') and self.request.user.is_authenticated:
            from apps.core.base_models.mixins import get_tenant_empresa
            empresa = get_tenant_empresa(auto_create=False)
            if empresa:
                queryset = queryset.filter(empresa=empresa)

        return queryset


class SoftDeleteFilterMixin:
    """
    Mixin para excluir registros eliminados (soft delete) por defecto.

    Permite incluir eliminados con query param: ?include_deleted=true
    """

    def get_queryset(self) -> QuerySet:
        """
        Excluye registros con deleted_at != None por defecto.
        """
        queryset = super().get_queryset()

        # Verificar si el modelo tiene soft delete
        model = queryset.model
        if hasattr(model, 'deleted_at'):
            # Verificar query param
            include_deleted = self.request.query_params.get('include_deleted', 'false')

            if include_deleted.lower() != 'true':
                queryset = queryset.filter(deleted_at__isnull=True)

        return queryset


class CachedListMixin:
    """
    Mixin para cachear automáticamente la acción 'list' de un ViewSet.

    Define en tu ViewSet:
        cache_timeout: int - Segundos de timeout (default: 300)
        cache_key_prefix: str - Prefijo para la clave de caché

    Ejemplo:
        class EstadoClienteViewSet(CachedListMixin, viewsets.ModelViewSet):
            cache_timeout = 7200  # 2 horas para catálogos
            cache_key_prefix = 'estado_cliente'
    """

    cache_timeout: int = 300  # 5 minutos por defecto
    cache_key_prefix: Optional[str] = None

    def list(self, request, *args, **kwargs):
        """
        Override de list para agregar caché.
        """
        # Generar clave de caché
        from apps.core.base_models.mixins import get_tenant_empresa
        prefix = self.cache_key_prefix or self.__class__.__name__
        empresa = get_tenant_empresa(auto_create=False)
        empresa_id = empresa.id if empresa else None
        query_params = dict(request.query_params)

        cache_key = generate_cache_key(
            f'viewset:{prefix}:list',
            empresa_id=empresa_id,
            **query_params
        )

        # Intentar obtener del caché
        cached_response = cache.get(cache_key)
        if cached_response is not None:
            return cached_response

        # Ejecutar query normal
        response = super().list(request, *args, **kwargs)

        # Cachear respuesta
        cache.set(cache_key, response, self.cache_timeout)

        return response


class BulkActionsMixin:
    """
    Mixin para agregar acciones en bulk (activar, desactivar, eliminar).

    Requiere que el modelo tenga is_active y soft_delete.
    """

    def get_queryset_for_bulk(self, ids: List[int]) -> QuerySet:
        """
        Obtiene el queryset para acciones en bulk.
        Aplica filtros de empresa y soft delete.
        """
        queryset = self.get_queryset()
        return queryset.filter(id__in=ids)

    def bulk_activate(self, request):
        """
        Activa múltiples registros.

        POST /endpoint/bulk_activate/
        Body: {"ids": [1, 2, 3]}
        """
        from rest_framework import status
        from rest_framework.response import Response

        ids = request.data.get('ids', [])
        if not ids:
            return Response(
                {'error': 'Debe proporcionar una lista de IDs'},
                status=status.HTTP_400_BAD_REQUEST
            )

        queryset = self.get_queryset_for_bulk(ids)
        count = queryset.update(is_active=True)

        return Response({
            'message': f'{count} registros activados exitosamente',
            'count': count
        })

    def bulk_deactivate(self, request):
        """
        Desactiva múltiples registros.

        POST /endpoint/bulk_deactivate/
        Body: {"ids": [1, 2, 3]}
        """
        from rest_framework import status
        from rest_framework.response import Response

        ids = request.data.get('ids', [])
        if not ids:
            return Response(
                {'error': 'Debe proporcionar una lista de IDs'},
                status=status.HTTP_400_BAD_REQUEST
            )

        queryset = self.get_queryset_for_bulk(ids)
        count = queryset.update(is_active=False)

        return Response({
            'message': f'{count} registros desactivados exitosamente',
            'count': count
        })

    def bulk_delete(self, request):
        """
        Elimina (soft delete) múltiples registros.

        POST /endpoint/bulk_delete/
        Body: {"ids": [1, 2, 3]}
        """
        from rest_framework import status
        from rest_framework.response import Response
        from django.utils import timezone

        ids = request.data.get('ids', [])
        if not ids:
            return Response(
                {'error': 'Debe proporcionar una lista de IDs'},
                status=status.HTTP_400_BAD_REQUEST
            )

        queryset = self.get_queryset_for_bulk(ids)

        # Soft delete
        count = queryset.update(
            is_active=False,
            deleted_at=timezone.now()
        )

        return Response({
            'message': f'{count} registros eliminados exitosamente',
            'count': count
        })


class FullyOptimizedViewSetMixin(
    OptimizedQuerySetMixin,
    CompanyFilterMixin,
    SoftDeleteFilterMixin,
    CachedListMixin,
    BulkActionsMixin
):
    """
    Mixin completo que combina todas las optimizaciones.

    Incluye:
    - Optimización de queries (select_related, prefetch_related)
    - Filtrado automático por empresa
    - Exclusión de registros eliminados
    - Caché automático para list
    - Acciones en bulk

    Ejemplo:
        class ClienteViewSet(FullyOptimizedViewSetMixin, viewsets.ModelViewSet):
            queryset = Cliente.objects.all()
            serializer_class = ClienteSerializer

            # Configuración de optimización
            select_related_fields = ['tipo_cliente', 'estado_cliente']
            prefetch_related_fields = ['contactos', 'segmentos']

            # Configuración de caché
            cache_timeout = 600  # 10 minutos
            cache_key_prefix = 'cliente'
    """
    pass


class ReadOnlyOptimizedViewSetMixin(
    OptimizedQuerySetMixin,
    CompanyFilterMixin,
    SoftDeleteFilterMixin,
    CachedListMixin
):
    """
    Mixin optimizado para ViewSets de solo lectura (catálogos).

    Similar a FullyOptimizedViewSetMixin pero sin acciones bulk.
    Ideal para catálogos y datos de referencia.

    Ejemplo:
        class TipoClienteViewSet(ReadOnlyOptimizedViewSetMixin, viewsets.ReadOnlyModelViewSet):
            queryset = TipoCliente.objects.all()
            serializer_class = TipoClienteSerializer
            cache_timeout = 7200  # 2 horas para catálogos
            cache_key_prefix = 'tipo_cliente'
    """
    pass


__all__ = [
    'TenantModelViewSetMixin',
    'OptimizedQuerySetMixin',
    'CompanyFilterMixin',
    'SoftDeleteFilterMixin',
    'CachedListMixin',
    'BulkActionsMixin',
    'FullyOptimizedViewSetMixin',
    'ReadOnlyOptimizedViewSetMixin',
]
