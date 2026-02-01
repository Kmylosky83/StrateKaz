"""
ViewSet Mixins para funcionalidad común reutilizable.

Este módulo provee mixins para ViewSets de DRF que eliminan duplicación
de código y estandarizan comportamientos comunes en toda la aplicación.

Uso:
    class MiViewSet(ToggleActiveMixin, FilterInactiveMixin, viewsets.ModelViewSet):
        queryset = MiModelo.objects.all()
        serializer_class = MiSerializer
        protected_relations = ['hijos', 'dependencias']

Autor: Sistema ERP StrateKaz
Fecha: 24 Diciembre 2025
"""

from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status
from django.db import transaction
from django.db.models import ProtectedError
from typing import List


class ToggleActiveMixin:
    """
    Mixin para toggle de estado activo/inactivo.

    Provee una acción POST para cambiar el estado is_active de una instancia.
    El modelo debe tener un campo booleano llamado 'is_active'.

    Endpoints generados:
        POST /api/resource/{id}/toggle-active/
    """

    toggle_field = 'is_active'

    @action(detail=True, methods=['post'], url_path='toggle-active')
    def toggle_active(self, request, pk=None):
        """Cambia el estado activo/inactivo de una instancia."""
        instance = self.get_object()
        current_value = getattr(instance, self.toggle_field)
        setattr(instance, self.toggle_field, not current_value)
        instance.save(update_fields=[self.toggle_field, 'updated_at'])
        serializer = self.get_serializer(instance)
        return Response(serializer.data)


class FilterInactiveMixin:
    """
    Mixin para filtrar registros inactivos por defecto.

    Por defecto, solo retorna registros con is_active=True.
    Para incluir inactivos, agregar query param: ?include_inactive=true
    """

    filter_field = 'is_active'
    inactive_param = 'include_inactive'

    def get_queryset(self):
        """Sobrescribe get_queryset para filtrar por defecto."""
        qs = super().get_queryset()
        if self.request.query_params.get(self.inactive_param) != 'true':
            filter_kwargs = {self.filter_field: True}
            qs = qs.filter(**filter_kwargs)
        return qs


class ValidateBeforeDeleteMixin:
    """
    Mixin para validar dependencias antes de eliminar.

    Verifica que no existan relaciones protegidas antes de permitir
    la eliminación. Retorna un error 400 con mensaje descriptivo.
    """

    protected_relations: List[str] = []
    custom_error_messages = {}

    def destroy(self, request, *args, **kwargs):
        """Sobrescribe destroy para validar antes de eliminar."""
        instance = self.get_object()

        for relation in self.protected_relations:
            try:
                related_manager = getattr(instance, relation, None)
                if related_manager is None:
                    continue
                if hasattr(related_manager, 'exists') and related_manager.exists():
                    count = related_manager.count()
                    error_message = self.custom_error_messages.get(
                        relation,
                        f'No se puede eliminar: tiene {count} {relation} asociado(s)'
                    )
                    return Response(
                        {
                            'error': error_message,
                            'detail': {
                                'relation': relation,
                                'count': count,
                                'protected': True
                            }
                        },
                        status=status.HTTP_400_BAD_REQUEST
                    )
            except AttributeError:
                continue

        try:
            return super().destroy(request, *args, **kwargs)
        except ProtectedError as e:
            return Response(
                {
                    'error': 'No se puede eliminar: tiene dependencias protegidas',
                    'detail': str(e)
                },
                status=status.HTTP_400_BAD_REQUEST
            )


class BulkActionsMixin:
    """
    Mixin para acciones masivas sobre múltiples registros.

    Endpoints generados:
        POST /api/resource/bulk-activate/   {"ids": [1, 2, 3]}
        POST /api/resource/bulk-deactivate/ {"ids": [1, 2, 3]}
        POST /api/resource/bulk-delete/     {"ids": [1, 2, 3], "confirm": true}
    """

    @action(detail=False, methods=['post'], url_path='bulk-activate')
    @transaction.atomic
    def bulk_activate(self, request):
        """Activa múltiples registros en una transacción atómica."""
        ids = request.data.get('ids', [])
        if not ids:
            return Response(
                {'error': 'Debe proporcionar una lista de IDs'},
                status=status.HTTP_400_BAD_REQUEST
            )
        updated = self.get_queryset().filter(id__in=ids).update(is_active=True)
        return Response({
            'updated': updated,
            'success': True,
            'message': f'{updated} registro(s) activado(s)'
        })

    @action(detail=False, methods=['post'], url_path='bulk-deactivate')
    @transaction.atomic
    def bulk_deactivate(self, request):
        """Desactiva múltiples registros en una transacción atómica."""
        ids = request.data.get('ids', [])
        if not ids:
            return Response(
                {'error': 'Debe proporcionar una lista de IDs'},
                status=status.HTTP_400_BAD_REQUEST
            )
        updated = self.get_queryset().filter(id__in=ids).update(is_active=False)
        return Response({
            'updated': updated,
            'success': True,
            'message': f'{updated} registro(s) desactivado(s)'
        })

    @action(detail=False, methods=['post'], url_path='bulk-delete')
    @transaction.atomic
    def bulk_delete(self, request):
        """Elimina múltiples registros en una transacción atómica."""
        ids = request.data.get('ids', [])
        confirm = request.data.get('confirm', False)
        if not ids:
            return Response(
                {'error': 'Debe proporcionar una lista de IDs'},
                status=status.HTTP_400_BAD_REQUEST
            )
        if not confirm:
            return Response(
                {
                    'error': 'Debe confirmar la eliminación masiva',
                    'detail': 'Agregar "confirm": true en el body'
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        try:
            queryset = self.get_queryset().filter(id__in=ids)
            count = queryset.count()
            queryset.delete()
            return Response({
                'deleted': count,
                'success': True,
                'message': f'{count} registro(s) eliminado(s)'
            })
        except ProtectedError as e:
            return Response(
                {
                    'error': 'No se pueden eliminar algunos registros: tienen dependencias protegidas',
                    'detail': str(e)
                },
                status=status.HTTP_400_BAD_REQUEST
            )


class AuditMixin:
    """
    Mixin para auditoría automática de created_by y updated_by.

    Automáticamente asigna el usuario actual a los campos created_by
    y updated_by durante la creación y actualización.
    """

    auto_audit = True

    def perform_create(self, serializer):
        """Sobrescribe perform_create para asignar created_by."""
        if self.auto_audit and hasattr(self.request, 'user') and self.request.user.is_authenticated:
            model = serializer.Meta.model
            if hasattr(model, 'created_by'):
                serializer.save(created_by=self.request.user)
                return
        super().perform_create(serializer)

    def perform_update(self, serializer):
        """Sobrescribe perform_update para asignar updated_by."""
        if self.auto_audit and hasattr(self.request, 'user') and self.request.user.is_authenticated:
            model = serializer.Meta.model
            if hasattr(model, 'updated_by'):
                serializer.save(updated_by=self.request.user)
                return
        super().perform_update(serializer)


class ExportMixin:
    """
    Mixin para exportar datos a diferentes formatos.

    Endpoints generados:
        GET /api/resource/export/?format=csv
        GET /api/resource/export/?format=excel
    """

    export_formats = ['csv', 'excel']
    export_fields = []

    @action(detail=False, methods=['get'])
    def export(self, request):
        """Exporta el queryset actual al formato solicitado."""
        format_type = request.query_params.get('format', 'csv')
        if format_type not in self.export_formats:
            return Response(
                {
                    'error': f'Formato no soportado: {format_type}',
                    'supported_formats': self.export_formats
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        queryset = self.filter_queryset(self.get_queryset())
        return Response({
            'message': 'Funcionalidad de exportación pendiente de implementar',
            'format': format_type,
            'count': queryset.count(),
            'note': 'Requiere instalación de pandas/openpyxl para Excel'
        })


class OrderingMixin:
    """
    Mixin para reordenar registros con campo 'orden'.

    Endpoint generado:
        POST /api/resource/reorder/ {"orders": [{"id": 1, "orden": 0}, ...]}
    """

    @action(detail=False, methods=['post'])
    @transaction.atomic
    def reorder(self, request):
        """Actualiza el orden de múltiples registros."""
        orders = request.data.get('orders', [])
        if not orders:
            return Response(
                {'error': 'Debe proporcionar un array de órdenes'},
                status=status.HTTP_400_BAD_REQUEST
            )
        updated_count = 0
        for item in orders:
            item_id = item.get('id')
            new_order = item.get('orden')
            if item_id is not None and new_order is not None:
                self.get_queryset().filter(id=item_id).update(orden=new_order)
                updated_count += 1
        return Response({
            'updated': updated_count,
            'success': True,
            'message': f'{updated_count} registro(s) reordenado(s)'
        })


class StandardViewSetMixin(
    ToggleActiveMixin,
    FilterInactiveMixin,
    BulkActionsMixin,
    AuditMixin
):
    """
    Mixin combinado con funcionalidad estándar común.

    Combina los mixins más utilizados en un solo mixin.
    Útil para ViewSets típicos de la aplicación.

    Incluye:
        - ToggleActiveMixin: toggle_active action
        - FilterInactiveMixin: filtrado automático de inactivos
        - BulkActionsMixin: acciones masivas
        - AuditMixin: auditoría automática
    """
    pass
