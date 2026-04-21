"""
ViewSets para Gestión de Proveedores (Supply Chain).

Post refactor 2026-04-21 (Proveedor → CT):
  Solo viewsets de lo que vive en SC:
    - ModalidadLogisticaViewSet (catálogo dinámico)
    - PrecioMateriaPrimaViewSet (CRUD de precios vigentes + batch por proveedor)
    - HistorialPrecioViewSet (readonly, audit log)

  ProveedorViewSet, TipoProveedorViewSet → /api/catalogo-productos/
  FormaPago, TipoCuentaBancaria, CondicionComercial, Criterio, Evaluacion,
  DetalleEvaluacion → eliminados.
"""
from django.db import transaction
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

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
    granular_action_map = {
        'batch_por_proveedor': 'can_edit',
        'por_proveedor': 'can_view',
    }

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

    @action(detail=False, methods=['get'], url_path='por-proveedor/(?P<proveedor_id>[^/.]+)')
    def por_proveedor(self, request, proveedor_id=None):
        """
        Lista de precios de un proveedor, incluyendo filas 'pendientes' para
        MPs que tiene suministradas pero aún sin precio asignado.

        Response:
          [
            {id, proveedor, producto, producto_nombre, producto_codigo,
             unidad_medida, precio_kg, modalidad_logistica,
             modalidad_logistica_nombre, es_pendiente: bool},
            ...
          ]
        """
        # Lazy import — Proveedor vive en CT (evita ciclo)
        from apps.catalogo_productos.models import Proveedor

        try:
            proveedor = Proveedor.objects.get(pk=proveedor_id, is_deleted=False)
        except Proveedor.DoesNotExist:
            return Response(
                {'error': 'Proveedor no encontrado'},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Precios existentes
        precios_existentes = {
            p.producto_id: p for p in PrecioMateriaPrima.objects.filter(
                proveedor=proveedor, is_deleted=False
            ).select_related('producto', 'producto__unidad_medida', 'modalidad_logistica')
        }

        # MPs que el proveedor suministra
        productos_suministrados = list(
            proveedor.productos_suministrados.filter(is_deleted=False)
            .select_related('unidad_medida')
        )

        result = []
        for prod in productos_suministrados:
            precio = precios_existentes.get(prod.id)
            if precio:
                result.append({
                    'id': precio.id,
                    'proveedor': proveedor.id,
                    'producto': prod.id,
                    'producto_nombre': prod.nombre,
                    'producto_codigo': prod.codigo,
                    'unidad_medida': getattr(prod.unidad_medida, 'abreviatura', '') if prod.unidad_medida else '',
                    'precio_kg': str(precio.precio_kg),
                    'modalidad_logistica': precio.modalidad_logistica_id,
                    'modalidad_logistica_nombre': (
                        precio.modalidad_logistica.nombre
                        if precio.modalidad_logistica else None
                    ),
                    'es_pendiente': False,
                    'updated_at': precio.updated_at.isoformat() if precio.updated_at else None,
                })
            else:
                result.append({
                    'id': None,
                    'proveedor': proveedor.id,
                    'producto': prod.id,
                    'producto_nombre': prod.nombre,
                    'producto_codigo': prod.codigo,
                    'unidad_medida': getattr(prod.unidad_medida, 'abreviatura', '') if prod.unidad_medida else '',
                    'precio_kg': None,
                    'modalidad_logistica': None,
                    'modalidad_logistica_nombre': None,
                    'es_pendiente': True,
                    'updated_at': None,
                })

        return Response(result)

    @action(detail=False, methods=['post'], url_path='batch-por-proveedor')
    def batch_por_proveedor(self, request):
        """
        Upsert masivo de precios para un proveedor.

        Payload:
          {
            "proveedor": <id>,
            "precios": [
              {"producto": <id>, "precio_kg": <decimal>,
               "modalidad_logistica": <id|null>, "motivo": <str opcional>},
              ...
            ]
          }

        Trazabilidad:
          - PrecioMP nuevo → created_by, updated_by = request.user
          - Cambio de precio_kg → HistorialPrecioProveedor con precio_anterior,
            precio_nuevo, modificado_por, motivo

        Si precio_kg es null/vacío, se omite la fila (permite dejar pendientes).
        """
        from apps.catalogo_productos.models import Proveedor

        proveedor_id = request.data.get('proveedor')
        precios_data = request.data.get('precios', [])

        if not proveedor_id:
            return Response(
                {'error': 'proveedor es requerido'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not isinstance(precios_data, list):
            return Response(
                {'error': '"precios" debe ser una lista'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            proveedor = Proveedor.objects.get(pk=proveedor_id, is_deleted=False)
        except Proveedor.DoesNotExist:
            return Response(
                {'error': 'Proveedor no encontrado'},
                status=status.HTTP_404_NOT_FOUND,
            )

        creados, actualizados, omitidos, errores = [], [], [], []

        with transaction.atomic():
            for idx, item in enumerate(precios_data):
                producto_id = item.get('producto')
                precio_kg_raw = item.get('precio_kg')
                modalidad_id = item.get('modalidad_logistica')

                if not producto_id:
                    errores.append({'index': idx, 'error': 'producto requerido'})
                    continue

                # Permitir omitir filas pendientes (sin precio asignado)
                if precio_kg_raw in (None, '', 0, '0'):
                    omitidos.append(producto_id)
                    continue

                try:
                    precio_kg = float(precio_kg_raw)
                except (TypeError, ValueError):
                    errores.append({'index': idx, 'error': 'precio_kg inválido'})
                    continue
                if precio_kg < 0:
                    errores.append({'index': idx, 'error': 'precio_kg no puede ser negativo'})
                    continue

                existing = PrecioMateriaPrima.objects.filter(
                    proveedor=proveedor,
                    producto_id=producto_id,
                    is_deleted=False,
                ).first()

                if existing:
                    if float(existing.precio_kg) != precio_kg:
                        HistorialPrecioProveedor.objects.create(
                            proveedor=proveedor,
                            producto_id=producto_id,
                            precio_anterior=existing.precio_kg,
                            precio_nuevo=precio_kg,
                            modificado_por=request.user,
                            motivo=item.get('motivo') or 'Asignación masiva',
                        )
                    existing.precio_kg = precio_kg
                    existing.modalidad_logistica_id = modalidad_id
                    existing.updated_by = request.user
                    existing.save(update_fields=[
                        'precio_kg', 'modalidad_logistica', 'updated_by', 'updated_at',
                    ])
                    actualizados.append(existing.id)
                else:
                    nuevo = PrecioMateriaPrima.objects.create(
                        proveedor=proveedor,
                        producto_id=producto_id,
                        precio_kg=precio_kg,
                        modalidad_logistica_id=modalidad_id,
                        created_by=request.user,
                        updated_by=request.user,
                    )
                    creados.append(nuevo.id)

        return Response({
            'proveedor_id': proveedor.id,
            'creados': creados,
            'actualizados': actualizados,
            'omitidos': omitidos,
            'errores': errores,
        }, status=status.HTTP_200_OK if not errores else status.HTTP_207_MULTI_STATUS)


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
