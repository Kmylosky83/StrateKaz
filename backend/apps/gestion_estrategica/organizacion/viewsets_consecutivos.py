"""
MC-002: ViewSet para Configuración de Consecutivos
Sistema de Gestión StrateKaz

Ubicación: organizacion (catálogo transversal de la organización)
"""
from rest_framework import viewsets, status, serializers
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import OrderingFilter
from django.utils import timezone
import logging

from apps.core.permissions import GranularActionPermission

from .models_consecutivos import ConsecutivoConfig, TODOS_CONSECUTIVOS_SISTEMA
from .filters_consecutivos import ConsecutivoConfigFilter
from .serializers_consecutivos import (
    ConsecutivoConfigSerializer,
    ConsecutivoConfigListSerializer,
    ConsecutivoConfigChoicesSerializer,
    GenerarConsecutivoSerializer,
    PreviewConsecutivoSerializer,
)

logger = logging.getLogger(__name__)


class ConsecutivoConfigViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar configuraciones de consecutivos.

    Los consecutivos permiten numerar automáticamente documentos y registros
    con formatos personalizables (prefijo, año, número, sufijo).

    section_code: 'consecutivos' para permisos RBAC

    Endpoints:
    - GET /consecutivos/ -> Lista todas las configuraciones activas
    - GET /consecutivos/{id}/ -> Detalle de una configuración
    - POST /consecutivos/ -> Crear nueva configuración (solo custom)
    - PUT/PATCH /consecutivos/{id}/ -> Actualizar configuración
    - DELETE /consecutivos/{id}/ -> Eliminar configuración (solo custom)
    - GET /consecutivos/choices/ -> Opciones para dropdowns
    - GET /consecutivos/by-categoria/ -> Consecutivos agrupados por categoría
    - POST /consecutivos/generar/ -> Genera el siguiente consecutivo
    - POST /consecutivos/preview/ -> Previsualiza el formato
    - POST /consecutivos/cargar-sistema/ -> Cargar consecutivos del sistema (admin)
    - POST /consecutivos/{id}/restore/ -> Restaurar consecutivo eliminado
    - POST /consecutivos/{id}/reiniciar/ -> Reiniciar contador a número inicial
    """

    permission_classes = [IsAuthenticated, GranularActionPermission]
    section_code = 'consecutivos'
    pagination_class = None  # Consecutivos son finitos (~50), no necesitan paginación

    # Filtros: FilterSet explícito para manejo robusto de booleanos
    # y escalabilidad para consumo por otras áreas del sistema
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_class = ConsecutivoConfigFilter  # Reemplaza filterset_fields

    # Ordenamiento
    ordering_fields = ['categoria', 'codigo', 'nombre', 'current_number', 'es_sistema']
    ordering = ['categoria', 'codigo']

    def get_queryset(self):
        """Retorna consecutivos no eliminados, filtrados por tenant."""
        from apps.core.base_models.mixins import get_tenant_empresa

        empresa = get_tenant_empresa()
        queryset = ConsecutivoConfig.objects.filter(
            deleted_at__isnull=True
        ).select_related('created_by', 'updated_by')

        if empresa:
            queryset = queryset.filter(empresa_id=empresa.id)

        include_inactive = self.request.query_params.get('include_inactive', 'false')
        if include_inactive.lower() != 'true':
            queryset = queryset.filter(is_active=True)

        return queryset

    def get_serializer_class(self):
        """Usa serializer reducido para listados."""
        if self.action == 'list':
            return ConsecutivoConfigListSerializer
        return ConsecutivoConfigSerializer

    def destroy(self, request, *args, **kwargs):
        """Solo permite eliminar consecutivos custom (no del sistema)."""
        instance = self.get_object()

        if instance.es_sistema:
            return Response(
                {'detail': 'No se pueden eliminar consecutivos del sistema.'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Soft delete
        instance.deleted_at = timezone.now()
        instance.is_active = False
        instance.save(update_fields=['deleted_at', 'is_active', 'updated_at'])

        logger.info(
            f"Consecutivo '{instance.codigo}' eliminado por {request.user.username}"
        )

        return Response(status=status.HTTP_204_NO_CONTENT)

    def perform_create(self, serializer):
        """Al crear, asegura que no sea marcada como sistema."""
        serializer.save(es_sistema=False)

    def perform_update(self, serializer):
        """Previene modificar consecutivos del sistema (excepto campos permitidos)."""
        instance = self.get_object()

        if instance.es_sistema:
            # Solo permitir modificar ciertos campos en consecutivos del sistema
            allowed_fields = {'is_active', 'descripcion'}
            data_keys = set(serializer.validated_data.keys())
            disallowed = data_keys - allowed_fields

            if disallowed:
                raise serializers.ValidationError({
                    'detail': f'Los consecutivos del sistema solo permiten modificar: {", ".join(allowed_fields)}. '
                              f'Campos no permitidos: {", ".join(disallowed)}'
                })

        serializer.save()

    @action(detail=False, methods=['get'])
    def choices(self, request):
        """
        Retorna opciones para dropdowns de consecutivos.

        GET /consecutivos/choices/

        Returns:
            - categorias: Categorías disponibles
            - separadores: Separadores disponibles
            - consecutivos: Lista de consecutivos para selects
        """
        serializer = ConsecutivoConfigChoicesSerializer(instance={})
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='by-categoria')
    def by_categoria(self, request):
        """
        Retorna consecutivos agrupados por categoría.

        GET /consecutivos/by-categoria/
        """
        from collections import defaultdict

        queryset = self.get_queryset()
        grouped = defaultdict(list)

        for config in queryset:
            grouped[config.categoria].append({
                'id': config.id,
                'codigo': config.codigo,
                'nombre': config.nombre,
                'prefix': config.prefix,
                'ejemplo': config.get_ejemplo_formato(),
                'es_sistema': config.es_sistema,
            })

        return Response(grouped)

    @action(detail=False, methods=['post'])
    def generar(self, request):
        """
        Genera el siguiente número de un consecutivo.

        POST /consecutivos/generar/
        Body: {"codigo": "FACTURA"} o {"consecutivo_id": 1}

        Returns:
            - consecutivo: El consecutivo generado
            - numero: El número generado
        """
        serializer = GenerarConsecutivoSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        codigo = serializer.validated_data.get('codigo')
        consecutivo_id = serializer.validated_data.get('consecutivo_id')

        try:
            if consecutivo_id:
                config = ConsecutivoConfig.objects.get(pk=consecutivo_id)
            else:
                config = ConsecutivoConfig.objects.get(codigo=codigo)

            consecutivo = config.generate_next()

            logger.info(
                f"Consecutivo '{config.codigo}' generado: {consecutivo} por {request.user.username}"
            )

            return Response({
                'consecutivo': consecutivo,
                'numero': config.current_number,
                'codigo': config.codigo,
            })

        except ConsecutivoConfig.DoesNotExist:
            return Response(
                {'detail': f'No existe configuración para el código "{codigo or consecutivo_id}"'},
                status=status.HTTP_404_NOT_FOUND
            )
        except ValueError as e:
            return Response(
                {'detail': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=False, methods=['post'])
    def preview(self, request):
        """
        Previsualiza el formato de un consecutivo sin generarlo.

        POST /consecutivos/preview/
        Body: {
            "prefix": "FAC",
            "separator": "-",
            "padding": 5,
            "numero": 1,
            "include_year": true
        }

        Returns:
            - formato: El formato previsualizado
        """
        serializer = PreviewConsecutivoSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        data = serializer.validated_data
        from datetime import date
        today = date.today()

        parts = []

        # Prefijo
        if data['prefix']:
            parts.append(data['prefix'])

        # Componentes de fecha
        if data.get('include_day'):
            parts.append(today.strftime('%Y%m%d'))
        elif data.get('include_month'):
            parts.append(today.strftime('%Y%m'))
        elif data.get('include_year'):
            parts.append(today.strftime('%Y'))

        # Número con padding
        padded_number = str(data['numero']).zfill(data['padding'])
        parts.append(padded_number)

        # Sufijo
        if data.get('suffix'):
            parts.append(data['suffix'])

        separator = data.get('separator', '-')
        formato = separator.join(parts)

        return Response({'formato': formato})

    @action(detail=False, methods=['post'], url_path='cargar-sistema')
    def cargar_sistema(self, request):
        """
        Carga o actualiza los consecutivos predefinidos del sistema.
        Solo disponible para administradores.

        POST /consecutivos/cargar-sistema/
        """
        if not request.user.is_staff:
            return Response(
                {'detail': 'Solo administradores pueden cargar consecutivos del sistema.'},
                status=status.HTTP_403_FORBIDDEN
            )

        from apps.core.base_models.mixins import get_tenant_empresa

        empresa = get_tenant_empresa()
        if not empresa:
            return Response(
                {'detail': 'No se pudo determinar la empresa del tenant actual.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        empresa_id = empresa.id

        created_count = 0
        updated_count = 0

        for config_data in TODOS_CONSECUTIVOS_SISTEMA:
            # Verificar si ya existe para preservar created_by
            existing = ConsecutivoConfig.objects.filter(
                codigo=config_data['codigo'],
                empresa_id=empresa_id
            ).first()

            defaults = {
                **config_data,
                'empresa_id': empresa_id,
                'is_active': True,       # Siempre activar al cargar sistema
                'deleted_at': None,       # Restaurar si estaba soft-deleted
            }

            # Solo asignar created_by si es nuevo registro
            if not existing:
                defaults['created_by'] = request.user

            config, created = ConsecutivoConfig.objects.update_or_create(
                codigo=config_data['codigo'],
                empresa_id=empresa_id,
                defaults=defaults
            )

            if created:
                created_count += 1
            else:
                updated_count += 1

        logger.info(
            f"Consecutivos del sistema cargados por {request.user.username}: "
            f"{created_count} creados, {updated_count} actualizados"
        )

        return Response({
            'message': 'Consecutivos del sistema cargados exitosamente.',
            'creados': created_count,
            'actualizados': updated_count,
            'total': len(TODOS_CONSECUTIVOS_SISTEMA)
        })

    @action(detail=True, methods=['post'])
    def restore(self, request, pk=None):
        """
        Restaura un consecutivo eliminado (soft delete).

        POST /consecutivos/{id}/restore/
        """
        try:
            config = ConsecutivoConfig.objects.get(pk=pk)
        except ConsecutivoConfig.DoesNotExist:
            return Response(
                {'detail': 'Consecutivo no encontrado.'},
                status=status.HTTP_404_NOT_FOUND
            )

        if config.deleted_at is None:
            return Response(
                {'detail': 'Este consecutivo no está eliminado.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        config.deleted_at = None
        config.is_active = True
        config.save(update_fields=['deleted_at', 'is_active', 'updated_at'])

        logger.info(
            f"Consecutivo '{config.codigo}' restaurado por {request.user.username}"
        )

        serializer = self.get_serializer(config)
        return Response({
            'message': 'Consecutivo restaurado exitosamente.',
            'data': serializer.data
        })

    @action(detail=True, methods=['post'])
    def reiniciar(self, request, pk=None):
        """
        Reinicia el contador de un consecutivo a su número inicial.
        Operación delicada que requiere confirmación.

        POST /consecutivos/{id}/reiniciar/
        Body: {"confirmar": true}
        """
        config = self.get_object()

        if config.es_sistema:
            # Verificar si el usuario tiene permisos de admin
            if not request.user.is_staff:
                return Response(
                    {'detail': 'Solo administradores pueden reiniciar consecutivos del sistema.'},
                    status=status.HTTP_403_FORBIDDEN
                )

        confirmar = request.data.get('confirmar', False)
        if not confirmar:
            return Response(
                {
                    'detail': 'Debe confirmar la operación.',
                    'warning': f'Esta acción reiniciará el contador de "{config.codigo}" '
                               f'desde {config.current_number} a {config.numero_inicial - 1}. '
                               'El siguiente consecutivo generado será el número inicial.',
                    'current_number': config.current_number,
                    'numero_inicial': config.numero_inicial,
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        old_number = config.current_number
        config.current_number = config.numero_inicial - 1
        config.last_reset_date = timezone.now().date()
        config.save(update_fields=['current_number', 'last_reset_date', 'updated_at'])

        logger.warning(
            f"Consecutivo '{config.codigo}' reiniciado por {request.user.username}: "
            f"{old_number} -> {config.current_number}"
        )

        serializer = self.get_serializer(config)
        return Response({
            'message': f'Consecutivo reiniciado exitosamente. Anterior: {old_number}, Nuevo: {config.current_number}',
            'data': serializer.data
        })
