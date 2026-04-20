"""ViewSets para Proveedores (CT-layer)."""
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.core.permissions import GranularActionPermission

from .models import Proveedor, TipoProveedor
from .serializers import (
    ProveedorCreateUpdateSerializer,
    ProveedorDetailSerializer,
    ProveedorListSerializer,
    TipoProveedorSerializer,
)


class TipoProveedorViewSet(viewsets.ModelViewSet):
    """CRUD del catálogo dinámico de tipos de proveedor."""

    queryset = TipoProveedor.objects.all()
    serializer_class = TipoProveedorSerializer
    permission_classes = [IsAuthenticated, GranularActionPermission]
    section_code = 'proveedores'

    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['is_active']
    search_fields = ['codigo', 'nombre']
    ordering_fields = ['orden', 'nombre', 'created_at']
    ordering = ['orden', 'nombre']


class ProveedorViewSet(viewsets.ModelViewSet):
    """CRUD de proveedores (dato maestro CT)."""

    permission_classes = [IsAuthenticated, GranularActionPermission]
    section_code = 'proveedores'

    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['tipo_persona', 'tipo_proveedor', 'is_active', 'departamento']
    search_fields = ['nombre_comercial', 'razon_social', 'numero_documento', 'nit', 'codigo_interno']
    ordering_fields = ['nombre_comercial', 'razon_social', 'created_at']
    ordering = ['nombre_comercial']

    def get_queryset(self):
        qs = Proveedor.objects.filter(is_deleted=False).select_related(
            'tipo_proveedor', 'tipo_documento', 'departamento',
        )
        # Optimizar list: evitar prefetch M2M pesado
        if self.action == 'list':
            return qs
        return qs.prefetch_related('productos_suministrados')

    def get_serializer_class(self):
        if self.action in ('create', 'update', 'partial_update'):
            return ProveedorCreateUpdateSerializer
        if self.action == 'retrieve':
            return ProveedorDetailSerializer
        return ProveedorListSerializer

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user, updated_by=self.request.user)

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)

    def perform_destroy(self, instance):
        # Soft-delete vía override de Proveedor.delete()
        instance.delete(user=self.request.user)

    @action(detail=False, methods=['get'], url_path='estadisticas')
    def estadisticas(self, request):
        """KPIs básicos de proveedores (total, activos, por tipo_persona)."""
        qs = self.get_queryset()
        total = qs.count()
        activos = qs.filter(is_active=True).count()
        por_tipo_persona = {
            choice.value: qs.filter(tipo_persona=choice.value).count()
            for choice in Proveedor.TipoPersona
        }
        return Response({
            'total': total,
            'activos': activos,
            'inactivos': total - activos,
            'por_tipo_persona': por_tipo_persona,
        })
