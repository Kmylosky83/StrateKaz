"""ViewSets para Catálogo de Productos."""
from django.db.models import Count
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.core.permissions import GranularActionPermission

from .filters import CategoriaProductoFilter, UnidadMedidaFilter, ProductoFilter
from .models import CategoriaProducto, UnidadMedida, Producto
from .serializers import (
    CategoriaProductoSerializer,
    UnidadMedidaSerializer,
    ProductoSerializer,
)


def _protect_system_delete(instance, label: str):
    """Rechaza delete si el registro es del sistema."""
    if getattr(instance, 'is_system', False):
        raise PermissionDenied(
            f'{label} es del sistema y no puede eliminarse.'
        )


class CategoriaProductoViewSet(viewsets.ModelViewSet):
    """CRUD de categorías de productos."""

    serializer_class = CategoriaProductoSerializer
    permission_classes = [IsAuthenticated, GranularActionPermission]
    section_code = 'gestion_categorias'
    filterset_class = CategoriaProductoFilter
    search_fields = ['nombre', 'codigo']
    ordering_fields = ['nombre', 'orden', 'created_at']

    def get_queryset(self):
        return CategoriaProducto.objects.filter(
            is_deleted=False,
        ).select_related('parent').order_by('orden', 'nombre')

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user, updated_by=self.request.user)

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)

    def perform_destroy(self, instance):
        _protect_system_delete(instance, 'La categoría')
        instance.soft_delete(user=self.request.user)


class UnidadMedidaViewSet(viewsets.ModelViewSet):
    """CRUD de unidades de medida."""

    serializer_class = UnidadMedidaSerializer
    permission_classes = [IsAuthenticated, GranularActionPermission]
    section_code = 'gestion_unidades'
    filterset_class = UnidadMedidaFilter
    search_fields = ['nombre', 'abreviatura']
    ordering_fields = ['nombre', 'tipo', 'orden']

    def get_queryset(self):
        return UnidadMedida.objects.filter(
            is_deleted=False,
        ).order_by('tipo', 'orden', 'nombre')

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user, updated_by=self.request.user)

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)

    def perform_destroy(self, instance):
        _protect_system_delete(instance, 'La unidad de medida')
        instance.soft_delete(user=self.request.user)


class ProductoViewSet(viewsets.ModelViewSet):
    """CRUD de productos maestros."""

    serializer_class = ProductoSerializer
    permission_classes = [IsAuthenticated, GranularActionPermission]
    section_code = 'gestion_productos'
    granular_action_map = {'estadisticas': 'can_view'}
    filterset_class = ProductoFilter
    search_fields = ['nombre', 'codigo', 'sku']
    ordering_fields = ['nombre', 'codigo', 'tipo', 'created_at']

    def get_queryset(self):
        return Producto.objects.filter(
            is_deleted=False,
        ).select_related('categoria', 'unidad_medida').order_by('codigo', 'nombre')

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user, updated_by=self.request.user)

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)

    def perform_destroy(self, instance):
        instance.soft_delete(user=self.request.user)

    @action(detail=False, methods=['get'], url_path='estadisticas')
    def estadisticas(self, request):
        """Conteo de productos por tipo y categoría."""
        qs = self.get_queryset()

        por_tipo = list(
            qs.values('tipo').annotate(count=Count('id')).order_by('tipo')
        )
        por_categoria = list(
            qs.values('categoria__nombre').annotate(count=Count('id')).order_by('-count')[:10]
        )

        return Response({
            'total': qs.count(),
            'por_tipo': por_tipo,
            'por_categoria': por_categoria,
        })
