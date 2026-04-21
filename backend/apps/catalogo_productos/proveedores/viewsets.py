"""ViewSets para Proveedores (CT-layer)."""
from django.db import transaction
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

    @action(detail=True, methods=['post'], url_path='asignar-precios')
    def asignar_precios(self, request, pk=None):
        """
        Batch upsert de precios por (proveedor, producto).

        Payload esperado:
          {
            "precios": [
              {"producto": <id>, "precio_kg": <decimal>, "modalidad_logistica": <id|null>},
              ...
            ]
          }

        Trazabilidad:
          - PrecioMateriaPrima nuevo → created_by = request.user
          - Cambio de precio_kg existente → HistorialPrecioProveedor append-only
            (se dispara en perform_update del PrecioMateriaPrimaViewSet, pero aquí
            creamos el historial manualmente porque usamos update_or_create).

        Permisos: requiere can_edit en proveedores (el proveedor ya existe).
        """
        proveedor = self.get_object()
        precios_data = request.data.get('precios', [])
        if not isinstance(precios_data, list):
            return Response(
                {'error': '"precios" debe ser una lista.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Lazy import — PrecioMateriaPrima vive en supply_chain (C2 consume de CT).
        from apps.supply_chain.gestion_proveedores.models import (
            PrecioMateriaPrima,
            HistorialPrecioProveedor,
        )

        creados, actualizados = [], []
        errores = []

        with transaction.atomic():
            for idx, item in enumerate(precios_data):
                producto_id = item.get('producto')
                precio_kg = item.get('precio_kg')
                modalidad_id = item.get('modalidad_logistica')

                if not producto_id or precio_kg is None:
                    errores.append({
                        'index': idx,
                        'error': 'producto y precio_kg son requeridos.',
                    })
                    continue

                try:
                    precio_kg = float(precio_kg)
                except (TypeError, ValueError):
                    errores.append({'index': idx, 'error': 'precio_kg inválido.'})
                    continue
                if precio_kg < 0:
                    errores.append({'index': idx, 'error': 'precio_kg no puede ser negativo.'})
                    continue

                existing = PrecioMateriaPrima.objects.filter(
                    proveedor=proveedor,
                    producto_id=producto_id,
                    is_deleted=False,
                ).first()

                if existing:
                    precio_anterior = existing.precio_kg
                    if float(precio_anterior) != precio_kg:
                        # Registrar en historial append-only
                        HistorialPrecioProveedor.objects.create(
                            proveedor=proveedor,
                            producto_id=producto_id,
                            precio_anterior=precio_anterior,
                            precio_nuevo=precio_kg,
                            modificado_por=request.user,
                            motivo=item.get('motivo') or 'Asignación inline',
                        )
                    existing.precio_kg = precio_kg
                    existing.modalidad_logistica_id = modalidad_id
                    existing.updated_by = request.user
                    existing.save(update_fields=[
                        'precio_kg', 'modalidad_logistica', 'updated_by', 'updated_at',
                    ])
                    actualizados.append(existing.id)
                else:
                    precio = PrecioMateriaPrima.objects.create(
                        proveedor=proveedor,
                        producto_id=producto_id,
                        precio_kg=precio_kg,
                        modalidad_logistica_id=modalidad_id,
                        created_by=request.user,
                        updated_by=request.user,
                    )
                    creados.append(precio.id)

        return Response({
            'proveedor_id': proveedor.id,
            'creados': creados,
            'actualizados': actualizados,
            'errores': errores,
        }, status=status.HTTP_200_OK if not errores else status.HTTP_207_MULTI_STATUS)
