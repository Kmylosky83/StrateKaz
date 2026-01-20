"""
ViewSet para Unidades de Medida
Sistema de Gestión StrateKaz

Catálogo transversal utilizado por múltiples módulos:
- SedeEmpresa (capacidad de almacenamiento)
- Supply Chain (cantidades de productos)
- Gestión Ambiental (residuos, emisiones)
- Gestor Documental (tamaños de archivo)

Ubicación: organizacion (catálogo transversal de la organización)
"""
from rest_framework import viewsets, status, serializers
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.utils import timezone
import logging

from apps.core.permissions import GranularActionPermission
from .models_unidades import UnidadMedida, CATEGORIA_UNIDAD_CHOICES
from .serializers_unidades import (
    UnidadMedidaSerializer,
    UnidadMedidaListSerializer,
    ConversionRequestSerializer,
    FormateoRequestSerializer,
)

logger = logging.getLogger(__name__)


class UnidadMedidaViewSet(viewsets.ModelViewSet):
    """
    MC-001: ViewSet para gestionar Unidades de Medida.

    Catálogo transversal utilizado por múltiples módulos:
    - SedeEmpresa (capacidad de almacenamiento)
    - Supply Chain (cantidades de productos)
    - Gestión Ambiental (residuos, emisiones)
    - Gestor Documental (tamaños de archivo)

    Endpoints:
    - GET /unidades-medida/ -> Lista todas las unidades activas
    - GET /unidades-medida/{id}/ -> Detalle de una unidad
    - POST /unidades-medida/ -> Crear nueva unidad (solo custom)
    - PUT/PATCH /unidades-medida/{id}/ -> Actualizar unidad
    - DELETE /unidades-medida/{id}/ -> Eliminar unidad (solo custom)
    - GET /unidades-medida/choices/ -> Opciones para dropdowns
    - GET /unidades-medida/by-categoria/ -> Unidades agrupadas por categoría
    - POST /unidades-medida/convertir/ -> Convertir valor entre unidades
    - POST /unidades-medida/formatear/ -> Formatear valor con unidad
    - POST /unidades-medida/cargar-sistema/ -> Cargar unidades del sistema (admin)
    """

    permission_classes = [IsAuthenticated, GranularActionPermission]
    section_code = 'unidades_medida'
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['categoria', 'es_sistema', 'is_active']
    search_fields = ['codigo', 'nombre', 'simbolo', 'descripcion']
    ordering_fields = ['categoria', 'orden_display', 'nombre', 'codigo']
    ordering = ['categoria', 'orden_display', 'nombre']

    def get_queryset(self):
        """Retorna unidades no eliminadas por defecto."""
        queryset = UnidadMedida.objects.filter(deleted_at__isnull=True)

        include_inactive = self.request.query_params.get('include_inactive', 'false')
        if include_inactive.lower() != 'true':
            queryset = queryset.filter(is_active=True)

        return queryset.select_related('unidad_base')

    def get_serializer_class(self):
        """Usa serializer reducido para listados."""
        if self.action == 'list':
            return UnidadMedidaListSerializer
        return UnidadMedidaSerializer

    def destroy(self, request, *args, **kwargs):
        """Solo permite eliminar unidades custom (no del sistema)."""
        instance = self.get_object()

        if instance.es_sistema:
            return Response(
                {'detail': 'No se pueden eliminar unidades del sistema.'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Soft delete
        instance.deleted_at = timezone.now()
        instance.is_active = False
        instance.save(update_fields=['deleted_at', 'is_active', 'updated_at'])

        logger.info(
            f"Unidad de medida '{instance.codigo}' eliminada por {request.user.username}"
        )

        return Response(status=status.HTTP_204_NO_CONTENT)

    def perform_create(self, serializer):
        """Al crear, asegura que no sea marcada como sistema."""
        serializer.save(es_sistema=False)

    def perform_update(self, serializer):
        """Previene modificar unidades del sistema (excepto campos permitidos)."""
        instance = self.get_object()

        if instance.es_sistema:
            # Solo permitir modificar ciertos campos en unidades del sistema
            allowed_fields = {'orden_display', 'is_active', 'descripcion'}
            data_keys = set(serializer.validated_data.keys())
            disallowed = data_keys - allowed_fields

            if disallowed:
                raise serializers.ValidationError({
                    'detail': f'Las unidades del sistema solo permiten modificar: {", ".join(allowed_fields)}. '
                              f'Campos no permitidos: {", ".join(disallowed)}'
                })

        serializer.save()

    @action(detail=False, methods=['get'])
    def choices(self, request):
        """
        Retorna opciones para dropdowns de unidades de medida.

        GET /unidades-medida/choices/

        Returns:
            - unidades: Lista de unidades para selects
            - categorias: Categorías disponibles
            - unidades_base: Unidades que pueden ser base de conversión
        """
        unidades = self.get_queryset()

        return Response({
            'unidades': [
                {
                    'value': u.id,
                    'label': f"{u.nombre} ({u.simbolo})",
                    'codigo': u.codigo,
                    'simbolo': u.simbolo,
                    'categoria': u.categoria,
                    'es_sistema': u.es_sistema,
                }
                for u in unidades
            ],
            'categorias': [
                {'value': code, 'label': label}
                for code, label in CATEGORIA_UNIDAD_CHOICES
            ],
            'unidades_base': [
                {
                    'value': u.id,
                    'label': f"{u.nombre} ({u.simbolo})",
                    'codigo': u.codigo,
                    'categoria': u.categoria,
                }
                for u in unidades.filter(unidad_base__isnull=True)
            ],
        })

    @action(detail=False, methods=['get'], url_path='by-categoria')
    def by_categoria(self, request):
        """
        Retorna unidades agrupadas por categoría.

        GET /unidades-medida/by-categoria/
        """
        unidades = self.get_queryset()
        result = {}

        for cat_code, cat_label in CATEGORIA_UNIDAD_CHOICES:
            cat_unidades = unidades.filter(categoria=cat_code)
            if cat_unidades.exists():
                result[cat_code] = {
                    'label': cat_label,
                    'unidades': UnidadMedidaListSerializer(cat_unidades, many=True).data
                }

        return Response(result)

    @action(detail=False, methods=['post'])
    def convertir(self, request):
        """
        Convierte un valor entre dos unidades compatibles.

        POST /unidades-medida/convertir/

        Body:
        {
            "valor": 1000,
            "unidad_origen": "KG",
            "unidad_destino": "TON"
        }

        Returns:
        {
            "valor_original": 1000,
            "unidad_origen": {"codigo": "KG", "simbolo": "kg"},
            "valor_convertido": 1.0,
            "unidad_destino": {"codigo": "TON", "simbolo": "ton"}
        }
        """
        serializer = ConversionRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        unidad_origen = UnidadMedida.obtener_por_codigo(
            serializer.validated_data['unidad_origen']
        )
        unidad_destino = UnidadMedida.obtener_por_codigo(
            serializer.validated_data['unidad_destino']
        )
        valor = serializer.validated_data['valor']

        try:
            valor_convertido = unidad_origen.convertir_a(valor, unidad_destino)

            return Response({
                'valor_original': float(valor),
                'unidad_origen': {
                    'codigo': unidad_origen.codigo,
                    'simbolo': unidad_origen.simbolo,
                    'nombre': unidad_origen.nombre,
                },
                'valor_convertido': float(valor_convertido),
                'unidad_destino': {
                    'codigo': unidad_destino.codigo,
                    'simbolo': unidad_destino.simbolo,
                    'nombre': unidad_destino.nombre,
                },
            })
        except Exception as e:
            return Response(
                {'detail': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=False, methods=['post'])
    def formatear(self, request):
        """
        Formatea un valor con su unidad de medida.

        POST /unidades-medida/formatear/

        Body:
        {
            "valor": 1234.567,
            "unidad": "KG",
            "incluir_simbolo": true
        }

        Returns:
        {
            "valor_original": 1234.567,
            "valor_formateado": "1,234.57 kg",
            "unidad": "KG"
        }
        """
        serializer = FormateoRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        unidad = UnidadMedida.obtener_por_codigo(
            serializer.validated_data['unidad']
        )
        valor = serializer.validated_data['valor']
        incluir_simbolo = serializer.validated_data.get('incluir_simbolo', True)

        # Configuración locale por defecto para Colombia
        locale_config = {
            'separador_miles': '.',
            'separador_decimales': ','
        }

        valor_formateado = unidad.formatear(
            valor,
            incluir_simbolo=incluir_simbolo,
            locale_config=locale_config
        )

        return Response({
            'valor_original': float(valor),
            'valor_formateado': valor_formateado,
            'unidad': {
                'codigo': unidad.codigo,
                'simbolo': unidad.simbolo,
                'nombre': unidad.nombre,
            },
        })

    @action(detail=False, methods=['post'], url_path='cargar-sistema')
    def cargar_sistema(self, request):
        """
        Carga las unidades predefinidas del sistema.

        POST /unidades-medida/cargar-sistema/

        Solo para administradores. Idempotente (seguro ejecutar múltiples veces).
        """
        if not request.user.is_staff:
            return Response(
                {'detail': 'Solo administradores pueden cargar unidades del sistema.'},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            count = UnidadMedida.cargar_unidades_sistema()

            logger.info(
                f"Unidades del sistema cargadas por {request.user.username}: {count} nuevas"
            )

            return Response({
                'message': 'Unidades del sistema cargadas exitosamente.',
                'unidades_creadas': count,
                'total_unidades': UnidadMedida.objects.filter(
                    is_active=True,
                    deleted_at__isnull=True
                ).count()
            })
        except Exception as e:
            logger.error(f"Error cargando unidades del sistema: {str(e)}")
            return Response(
                {'detail': f'Error cargando unidades: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['post'])
    def restore(self, request, pk=None):
        """
        Restaura una unidad eliminada lógicamente.

        POST /unidades-medida/{id}/restore/
        """
        try:
            unidad = UnidadMedida.objects.get(pk=pk)
        except UnidadMedida.DoesNotExist:
            return Response(
                {'detail': 'Unidad de medida no encontrada.'},
                status=status.HTTP_404_NOT_FOUND
            )

        if unidad.deleted_at is None:
            return Response(
                {'detail': 'La unidad no está eliminada.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        unidad.deleted_at = None
        unidad.is_active = True
        unidad.save(update_fields=['deleted_at', 'is_active', 'updated_at'])

        logger.info(
            f"Unidad de medida '{unidad.codigo}' restaurada por {request.user.username}"
        )

        serializer = self.get_serializer(unidad)
        return Response({
            'message': 'Unidad de medida restaurada exitosamente.',
            'data': serializer.data
        })
