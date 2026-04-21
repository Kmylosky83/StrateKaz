"""
ViewSets para Gestión de Proveedores (Supply Chain).

Post refactor 2026-04-21 (Proveedor → CT):
  Solo viewsets de lo que vive en SC:
    - ModalidadLogisticaViewSet (catálogo dinámico)
    - PrecioMateriaPrimaViewSet (CRUD de precios vigentes)
    - HistorialPrecioViewSet (readonly, audit log)

  ProveedorViewSet, TipoProveedorViewSet → /api/catalogo-productos/
  FormaPago, TipoCuentaBancaria, CondicionComercial, Criterio, Evaluacion,
  DetalleEvaluacion → eliminados.
"""
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, viewsets
from rest_framework.permissions import IsAuthenticated

from apps.core.permissions import GranularActionPermission

from .filters import HistorialPrecioFilter
from .models import ModalidadLogistica, PrecioMateriaPrima, HistorialPrecioProveedor
from .serializers import (
    ModalidadLogisticaSerializer,
    PrecioMateriaPrimaSerializer,
    HistorialPrecioSerializer,
)


class ModalidadLogisticaViewSet(viewsets.ModelViewSet):
    """Catálogo dinámico de modalidades logísticas (entrega planta, recolección, etc.)."""

    queryset = ModalidadLogistica.objects.all()
    serializer_class = ModalidadLogisticaSerializer
    permission_classes = [IsAuthenticated, GranularActionPermission]
    section_code = 'precios_materia_prima'

    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['is_active']
    search_fields = ['codigo', 'nombre']
    ordering_fields = ['orden', 'nombre', 'created_at']
    ordering = ['orden', 'nombre']


class PrecioMateriaPrimaViewSet(viewsets.ModelViewSet):
    """Precios vigentes Proveedor × Producto (MP)."""

    serializer_class = PrecioMateriaPrimaSerializer
    permission_classes = [IsAuthenticated, GranularActionPermission]
    section_code = 'precios_materia_prima'

    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['proveedor', 'producto']
    search_fields = ['proveedor__nombre_comercial', 'producto__nombre']
    ordering_fields = ['created_at', 'updated_at', 'precio_kg']
    ordering = ['-updated_at']

    def get_queryset(self):
        return PrecioMateriaPrima.objects.filter(
            is_deleted=False,
        ).select_related('proveedor', 'producto')

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user, updated_by=self.request.user)

    def perform_update(self, serializer):
        instance = self.get_object()
        precio_anterior = instance.precio_kg
        precio_nuevo = serializer.validated_data.get('precio_kg', precio_anterior)

        # Guardar historial si hay cambio de precio
        if precio_nuevo != precio_anterior:
            HistorialPrecioProveedor.objects.create(
                proveedor=instance.proveedor,
                producto=instance.producto,
                precio_anterior=precio_anterior,
                precio_nuevo=precio_nuevo,
                modificado_por=self.request.user,
                motivo=self.request.data.get('motivo', 'Sin motivo'),
            )

        serializer.save(updated_by=self.request.user)

    def perform_destroy(self, instance):
        instance.soft_delete(user=self.request.user)


class HistorialPrecioViewSet(viewsets.ReadOnlyModelViewSet):
    """Historial de precios (append-only)."""

    queryset = HistorialPrecioProveedor.objects.all()
    serializer_class = HistorialPrecioSerializer
    permission_classes = [IsAuthenticated, GranularActionPermission]
    section_code = 'precios_materia_prima'

    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = HistorialPrecioFilter
    search_fields = ['proveedor__nombre_comercial', 'motivo']
    ordering_fields = ['created_at']
    ordering = ['-created_at']

    def get_queryset(self):
        return HistorialPrecioProveedor.objects.all().select_related(
            'proveedor', 'producto', 'modificado_por',
        )
