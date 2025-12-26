"""
ViewSets para el módulo de Organización

ÚLTIMA ACTUALIZACIÓN: 2025-12-24
Cambios realizados:
- Migrado a StandardViewSetMixin para funcionalidad común (toggle_active, filtros, bulk actions, audit)
- AreaViewSet: Agregado StandardViewSetMixin + OrderingMixin, manteniendo acciones custom (tree, root, children)
- CategoriaDocumentoViewSet: Agregado StandardViewSetMixin + ValidateBeforeDeleteMixin
- TipoDocumentoViewSet: Agregado StandardViewSetMixin + ValidateBeforeDeleteMixin
- ConsecutivoConfigViewSet: Agregado FilterInactiveMixin + ToggleActiveMixin
- Eliminada acción toggle custom de AreaViewSet (ahora usa ToggleActiveMixin)
- Consistencia con el patrón establecido en apps.core.mixins

Mixins aplicados:
- StandardViewSetMixin = ToggleActiveMixin + FilterInactiveMixin + BulkActionsMixin + AuditMixin
- ValidateBeforeDeleteMixin = Validación de dependencias antes de eliminar
- OrderingMixin = Reordenamiento de registros con campo 'orden'

Endpoints generados automáticamente:
- POST /{resource}/{id}/toggle-active/ - Toggle is_active
- POST /{resource}/bulk-activate/ - Activar múltiples
- POST /{resource}/bulk-deactivate/ - Desactivar múltiples
- POST /{resource}/bulk-delete/ - Eliminar múltiples (con confirmación)
- POST /{resource}/reorder/ - Reordenar (solo AreaViewSet)
"""
from django.db import models
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from .models import Area, CategoriaDocumento, TipoDocumento, ConsecutivoConfig
from .serializers import (
    AreaSerializer, AreaTreeSerializer, AreaListSerializer,
    CategoriaDocumentoSerializer, CategoriaDocumentoListSerializer, CategoriaDocumentoChoicesSerializer,
    TipoDocumentoSerializer, TipoDocumentoListSerializer, TipoDocumentoChoicesSerializer,
    ConsecutivoConfigSerializer, ConsecutivoConfigListSerializer, ConsecutivoChoicesSerializer,
)
from apps.core.models import Cargo, User
from apps.core.mixins import (
    StandardViewSetMixin,
    ValidateBeforeDeleteMixin,
    OrderingMixin,
    FilterInactiveMixin,
    ToggleActiveMixin,
)


class AreaViewSet(StandardViewSetMixin, OrderingMixin, viewsets.ModelViewSet):
    """
    ViewSet para gestión de Áreas/Departamentos

    Mixins aplicados:
    - StandardViewSetMixin: toggle_active, filtros, bulk actions, audit
    - OrderingMixin: reordenamiento de áreas

    Endpoints estándar:
    - GET /api/organizacion/areas/ - Lista todas las áreas
    - POST /api/organizacion/areas/ - Crea una nueva área
    - GET /api/organizacion/areas/{id}/ - Detalle de un área
    - PUT/PATCH /api/organizacion/areas/{id}/ - Actualiza un área
    - DELETE /api/organizacion/areas/{id}/ - Elimina un área

    Endpoints automáticos (mixins):
    - POST /api/organizacion/areas/{id}/toggle-active/ - Activa/desactiva área
    - POST /api/organizacion/areas/bulk-activate/ - Activar múltiples
    - POST /api/organizacion/areas/bulk-deactivate/ - Desactivar múltiples
    - POST /api/organizacion/areas/bulk-delete/ - Eliminar múltiples
    - POST /api/organizacion/areas/reorder/ - Reordenar áreas

    Endpoints custom:
    - GET /api/organizacion/areas/tree/ - Árbol jerárquico de áreas
    - GET /api/organizacion/areas/root/ - Solo áreas raíz (sin padre)
    - GET /api/organizacion/areas/{id}/children/ - Subáreas directas

    Parámetros de filtrado:
    - is_active: true/false
    - parent: ID del área padre
    - include_inactive: true (para incluir inactivas, por defecto solo activas)
    """
    queryset = Area.objects.all()
    serializer_class = AreaSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['is_active', 'parent']
    search_fields = ['code', 'name', 'description', 'cost_center']
    ordering_fields = ['orden', 'name', 'code', 'created_at']
    ordering = ['orden', 'name']

    # Configuración para ValidateBeforeDeleteMixin
    protected_relations = ['children']
    custom_error_messages = {
        'children': 'No se puede eliminar un área con subáreas. Elimine primero las subáreas.'
    }

    def get_queryset(self):
        """
        Filtra áreas según parámetros.
        FilterInactiveMixin ya maneja el filtro por is_active con param include_inactive.
        """
        queryset = super().get_queryset()

        # Para acciones de detalle (retrieve, update, destroy, toggle, children)
        # NO aplicar filtro de activas para poder operar sobre áreas inactivas
        if self.action in ['retrieve', 'update', 'partial_update', 'destroy', 'toggle_active', 'children']:
            # Retornar queryset completo sin filtro de is_active
            # Necesitamos acceso directo, así que temporalmente deshabilitamos el filtro del mixin
            return Area.objects.all()

        # Para list, tree, root, etc. el FilterInactiveMixin ya aplica el filtro
        return queryset

    @action(detail=False, methods=['get'])
    def tree(self, request):
        """
        Retorna el árbol jerárquico completo de áreas.
        Solo incluye áreas raíz, las subáreas vienen anidadas.

        Query params:
        - include_inactive: true/false (heredado de FilterInactiveMixin)
        """
        root_areas = self.get_queryset().filter(parent__isnull=True)
        serializer = AreaTreeSerializer(root_areas, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def root(self, request):
        """
        Retorna solo las áreas raíz (sin padre).
        Útil para selects de área padre.

        Query params:
        - include_inactive: true/false (heredado de FilterInactiveMixin)
        """
        root_areas = self.get_queryset().filter(parent__isnull=True)
        serializer = AreaSerializer(root_areas, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def children(self, request, pk=None):
        """
        Retorna las subáreas directas de un área.

        Por defecto solo retorna subáreas activas.
        Para incluir inactivas: ?include_inactive=true
        """
        area = self.get_object()
        children_qs = area.children.all()

        # Aplicar filtro de activas si no se solicita incluir inactivas
        if request.query_params.get('include_inactive') != 'true':
            children_qs = children_qs.filter(is_active=True)

        children = children_qs.order_by('orden', 'name')
        serializer = AreaSerializer(children, many=True)
        return Response(serializer.data)

    def destroy(self, request, *args, **kwargs):
        """
        Elimina un área solo si no tiene subáreas activas.
        ValidateBeforeDeleteMixin ya maneja la validación.
        """
        area = self.get_object()

        # Verificar si tiene subáreas activas
        if area.children.filter(is_active=True).exists():
            return Response(
                {'error': 'No se puede eliminar un área con subáreas activas. Desactive o elimine primero las subáreas.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        return super().destroy(request, *args, **kwargs)

    def get_serializer_class(self):
        """Usa serializer simplificado para listados"""
        if self.action == 'list':
            return AreaListSerializer
        return AreaSerializer


# =============================================================================
# CATEGORÍA DOCUMENTO VIEWSET
# =============================================================================

class CategoriaDocumentoViewSet(StandardViewSetMixin, ValidateBeforeDeleteMixin, viewsets.ModelViewSet):
    """
    ViewSet para gestionar categorías de documentos.

    Mixins aplicados:
    - StandardViewSetMixin: toggle_active, filtros, bulk actions, audit
    - ValidateBeforeDeleteMixin: validación de dependencias antes de eliminar

    Endpoints estándar:
    - GET /api/organizacion/categorias-documento/ - Lista todas las categorías
    - POST /api/organizacion/categorias-documento/ - Crea una nueva categoría
    - GET /api/organizacion/categorias-documento/{id}/ - Detalle de una categoría
    - PUT/PATCH /api/organizacion/categorias-documento/{id}/ - Actualiza una categoría
    - DELETE /api/organizacion/categorias-documento/{id}/ - Elimina una categoría

    Endpoints automáticos (mixins):
    - POST /api/organizacion/categorias-documento/{id}/toggle-active/ - Toggle is_active
    - POST /api/organizacion/categorias-documento/bulk-activate/ - Activar múltiples
    - POST /api/organizacion/categorias-documento/bulk-deactivate/ - Desactivar múltiples
    - POST /api/organizacion/categorias-documento/bulk-delete/ - Eliminar múltiples

    Endpoints custom:
    - GET /api/organizacion/categorias-documento/choices/ - Opciones para formularios

    Parámetros de filtrado:
    - is_active: true/false
    - is_system: true/false
    - include_inactive: true (para incluir inactivas, por defecto solo activas)
    """
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['is_active', 'is_system']
    search_fields = ['code', 'name', 'description']
    ordering_fields = ['name', 'code', 'orden', 'created_at']
    ordering = ['orden', 'name']

    # Configuración para ValidateBeforeDeleteMixin
    protected_relations = ['tipos_documento']
    custom_error_messages = {
        'tipos_documento': 'No se puede eliminar la categoría porque tiene tipos de documento asociados.'
    }

    def get_queryset(self):
        """Incluye conteo de tipos de documento activos"""
        from django.db.models import Count
        queryset = CategoriaDocumento.objects.annotate(
            tipos_count=Count('tipos_documento', filter=models.Q(tipos_documento__is_active=True))
        )
        # FilterInactiveMixin ya aplica el filtro por is_active
        return queryset

    def get_serializer_class(self):
        """Usa serializer simplificado para listados"""
        if self.action == 'list':
            return CategoriaDocumentoListSerializer
        return CategoriaDocumentoSerializer

    def destroy(self, request, *args, **kwargs):
        """
        Valida si la categoría puede eliminarse.
        Usa el método del modelo para validación adicional.
        """
        instance = self.get_object()

        puede_eliminar, mensaje = instance.puede_eliminar()
        if not puede_eliminar:
            return Response(
                {'detail': mensaje},
                status=status.HTTP_400_BAD_REQUEST
            )

        # ValidateBeforeDeleteMixin ya maneja la validación de relaciones
        return super().destroy(request, *args, **kwargs)

    @action(detail=False, methods=['get'])
    def choices(self, request):
        """
        Retorna opciones de categorías para formularios.
        Incluye todas las choices disponibles.
        """
        serializer = CategoriaDocumentoChoicesSerializer({})
        return Response(serializer.data)


# =============================================================================
# TIPO DOCUMENTO VIEWSET
# =============================================================================

class TipoDocumentoViewSet(StandardViewSetMixin, ValidateBeforeDeleteMixin, viewsets.ModelViewSet):
    """
    ViewSet para gestionar tipos de documento.

    Mixins aplicados:
    - StandardViewSetMixin: toggle_active, filtros, bulk actions, audit
    - ValidateBeforeDeleteMixin: validación de dependencias antes de eliminar

    Endpoints estándar:
    - GET /api/organizacion/tipos-documento/ - Lista todos los tipos
    - POST /api/organizacion/tipos-documento/ - Crea un nuevo tipo custom
    - GET /api/organizacion/tipos-documento/{id}/ - Detalle de un tipo
    - PUT/PATCH /api/organizacion/tipos-documento/{id}/ - Actualiza un tipo
    - DELETE /api/organizacion/tipos-documento/{id}/ - Elimina un tipo custom

    Endpoints automáticos (mixins):
    - POST /api/organizacion/tipos-documento/{id}/toggle-active/ - Toggle is_active
    - POST /api/organizacion/tipos-documento/bulk-activate/ - Activar múltiples
    - POST /api/organizacion/tipos-documento/bulk-deactivate/ - Desactivar múltiples
    - POST /api/organizacion/tipos-documento/bulk-delete/ - Eliminar múltiples

    Endpoints custom:
    - GET /api/organizacion/tipos-documento/choices/ - Opciones para formularios
    - GET /api/organizacion/tipos-documento/sistema/ - Solo tipos del sistema
    - GET /api/organizacion/tipos-documento/custom/ - Solo tipos custom

    Parámetros de filtrado:
    - categoria: ID de la categoría
    - is_active: true/false
    - is_system: true/false
    - tipo: sistema/custom (filtro especial)
    - include_inactive: true (para incluir inactivos, por defecto solo activos)
    """
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['categoria', 'is_active', 'is_system']
    search_fields = ['code', 'name', 'description']
    ordering_fields = ['name', 'code', 'categoria__orden', 'orden', 'created_at']
    ordering = ['categoria__orden', 'orden', 'name']

    # Configuración para ValidateBeforeDeleteMixin
    # Los tipos de documento pueden tener relaciones con consecutivos, documentos, etc.
    protected_relations = ['consecutivos']
    custom_error_messages = {
        'consecutivos': 'No se puede eliminar el tipo porque tiene consecutivos configurados.'
    }

    def get_queryset(self):
        """Filtra tipos según parámetros"""
        queryset = TipoDocumento.objects.select_related('categoria').all()

        # Filtro por tipo (sistema/custom) via query param
        tipo = self.request.query_params.get('tipo')
        if tipo == 'sistema':
            queryset = queryset.filter(is_system=True)
        elif tipo == 'custom':
            queryset = queryset.filter(is_system=False)

        # FilterInactiveMixin ya aplica el filtro por is_active
        return queryset

    def get_serializer_class(self):
        """Usa serializer simplificado para listados"""
        if self.action == 'list':
            return TipoDocumentoListSerializer
        return TipoDocumentoSerializer

    def perform_create(self, serializer):
        """
        Solo se pueden crear tipos custom.
        AuditMixin ya maneja created_by.
        """
        serializer.save(is_system=False)

    def update(self, request, *args, **kwargs):
        """
        Los tipos del sistema solo permiten editar is_active.
        Los tipos custom pueden editarse completamente.
        """
        instance = self.get_object()

        if instance.is_system:
            # Solo permitir cambiar is_active
            allowed_fields = {'is_active'}
            provided_fields = set(request.data.keys())

            if not provided_fields.issubset(allowed_fields):
                return Response(
                    {'detail': 'Los tipos del sistema solo permiten modificar el campo is_active.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

        # AuditMixin ya maneja updated_by
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        """
        Valida si el tipo puede eliminarse.
        Los tipos del sistema NO se pueden eliminar.
        """
        instance = self.get_object()

        puede_eliminar, mensaje = instance.puede_eliminar()
        if not puede_eliminar:
            return Response(
                {'detail': mensaje},
                status=status.HTTP_400_BAD_REQUEST
            )

        # ValidateBeforeDeleteMixin ya maneja la validación de relaciones
        return super().destroy(request, *args, **kwargs)

    @action(detail=False, methods=['get'])
    def choices(self, request):
        """
        Retorna las opciones de categorías para formularios.
        Incluye todas las choices disponibles.
        """
        serializer = TipoDocumentoChoicesSerializer({})
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def sistema(self, request):
        """
        Retorna solo tipos del sistema.
        Aplica el filtro de activos según include_inactive.
        """
        tipos = self.get_queryset().filter(is_system=True)
        serializer = self.get_serializer(tipos, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def custom(self, request):
        """
        Retorna solo tipos custom creados por la empresa.
        Aplica el filtro de activos según include_inactive.
        """
        tipos = self.get_queryset().filter(is_system=False)
        serializer = self.get_serializer(tipos, many=True)
        return Response(serializer.data)


# =============================================================================
# CONSECUTIVO CONFIG VIEWSET
# =============================================================================

class ConsecutivoConfigViewSet(FilterInactiveMixin, ToggleActiveMixin, viewsets.ModelViewSet):
    """
    ViewSet para gestionar configuración de consecutivos.

    Mixins aplicados:
    - FilterInactiveMixin: filtrar inactivos por defecto
    - ToggleActiveMixin: toggle de is_active

    Nota: No se usa StandardViewSetMixin completo porque:
    - No necesita BulkActionsMixin (consecutivos son sensibles, no se modifican en masa)
    - Tiene lógica custom de auditoría en el modelo

    Endpoints estándar:
    - GET /api/organizacion/consecutivos/ - Lista todos los consecutivos
    - POST /api/organizacion/consecutivos/ - Crea un nuevo consecutivo
    - GET /api/organizacion/consecutivos/{id}/ - Detalle de un consecutivo
    - PUT/PATCH /api/organizacion/consecutivos/{id}/ - Actualiza un consecutivo
    - DELETE /api/organizacion/consecutivos/{id}/ - Elimina un consecutivo

    Endpoints automáticos (mixins):
    - POST /api/organizacion/consecutivos/{id}/toggle-active/ - Activa/desactiva consecutivo

    Endpoints custom:
    - GET /api/organizacion/consecutivos/choices/ - Opciones para formularios
    - POST /api/organizacion/consecutivos/{id}/generate/ - Genera siguiente número
    - POST /api/organizacion/consecutivos/generate_by_type/ - Genera por tipo

    Parámetros de filtrado:
    - is_active: true/false
    - tipo_documento__categoria: ID de la categoría
    - include_inactive: true (para incluir inactivos, por defecto solo activos)
    """
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['is_active', 'tipo_documento__categoria']
    search_fields = ['prefix', 'tipo_documento__code', 'tipo_documento__name']
    ordering_fields = ['tipo_documento__name', 'prefix', 'created_at']
    ordering = ['tipo_documento__categoria__orden', 'tipo_documento__name']

    def get_queryset(self):
        """Optimiza queries con select_related"""
        return ConsecutivoConfig.objects.select_related('tipo_documento', 'tipo_documento__categoria')

    def get_serializer_class(self):
        """Usa serializer simplificado para listados"""
        if self.action == 'list':
            return ConsecutivoConfigListSerializer
        return ConsecutivoConfigSerializer

    @action(detail=False, methods=['get'])
    def choices(self, request):
        """
        Retorna opciones para formularios.
        Incluye todas las choices disponibles.
        """
        serializer = ConsecutivoChoicesSerializer({})
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def generate(self, request, pk=None):
        """
        Genera el siguiente consecutivo.

        POST /api/organizacion/consecutivos/{id}/generate/

        Validaciones:
        - El consecutivo debe estar activo
        """
        config = self.get_object()
        if not config.is_active:
            return Response(
                {'error': 'El consecutivo está inactivo'},
                status=status.HTTP_400_BAD_REQUEST
            )

        consecutivo = config.generate_next()
        return Response({
            'consecutivo': consecutivo,
            'current_number': config.current_number
        })

    @action(detail=False, methods=['post'])
    def generate_by_type(self, request):
        """
        Genera consecutivo por código de tipo de documento.

        POST /api/organizacion/consecutivos/generate_by_type/

        Body:
        {
            "tipo_documento_code": "DOC-001"
        }
        """
        tipo_code = request.data.get('tipo_documento_code')

        if not tipo_code:
            return Response(
                {'error': 'tipo_documento_code es requerido'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            consecutivo = ConsecutivoConfig.obtener_siguiente_consecutivo(tipo_code)
            return Response({'consecutivo': consecutivo})
        except ConsecutivoConfig.DoesNotExist as e:
            return Response({'error': str(e)}, status=status.HTTP_404_NOT_FOUND)
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


# =============================================================================
# ORGANIGRAMA VIEW - Datos para visualización interactiva
# =============================================================================

class OrganigramaView(APIView):
    """
    Vista para obtener datos del organigrama visual interactivo.

    Endpoint: GET /api/organizacion/organigrama/

    Retorna:
    - areas: Lista de áreas con jerarquía
    - cargos: Lista de cargos con relaciones y usuarios asignados
    - usuarios: Lista resumida de usuarios (opcional)
    - stats: Estadísticas del organigrama

    Query params:
    - include_usuarios: true/false (incluir lista completa de usuarios)
    - solo_activos: true/false (por defecto true)
    """
    permission_classes = [IsAuthenticated]

    def _get_initials(self, name: str) -> str:
        """Genera iniciales a partir del nombre completo"""
        if not name:
            return '??'
        parts = name.strip().split()
        if len(parts) >= 2:
            return f"{parts[0][0]}{parts[1][0]}".upper()
        return name[:2].upper()

    def get(self, request):
        """Obtiene todos los datos necesarios para el organigrama"""
        include_usuarios = request.query_params.get('include_usuarios', 'false').lower() == 'true'
        solo_activos = request.query_params.get('solo_activos', 'true').lower() == 'true'

        # Obtener áreas
        areas_qs = Area.objects.all()
        if solo_activos:
            areas_qs = areas_qs.filter(is_active=True)

        areas_data = []
        for area in areas_qs.order_by('orden', 'name'):
            area_dict = {
                'id': area.id,
                'code': area.code,
                'name': area.name,
                'description': area.description,
                'parent': area.parent_id,
                'parent_name': area.parent.name if area.parent else None,
                'cost_center': area.cost_center,
                'manager': area.manager_id,
                'manager_name': area.manager.get_full_name() if area.manager else None,
                'is_active': area.is_active,
                'orden': area.orden,
                'level': area.level,
                'children_count': area.children.filter(is_active=True).count() if solo_activos else area.children.count(),
            }
            # Contar cargos en esta área
            cargos_area = Cargo.objects.filter(area=area)
            if solo_activos:
                cargos_area = cargos_area.filter(is_active=True)
            area_dict['cargos_count'] = cargos_area.count()

            # Contar usuarios en esta área (a través de sus cargos)
            usuarios_area = User.objects.filter(
                cargo__area=area,
                is_active=True,
                deleted_at__isnull=True
            ).count()
            area_dict['usuarios_count'] = usuarios_area

            areas_data.append(area_dict)

        # Obtener cargos
        cargos_qs = Cargo.objects.select_related('area', 'parent_cargo')
        if solo_activos:
            cargos_qs = cargos_qs.filter(is_active=True)

        cargos_data = []
        for cargo in cargos_qs.order_by('nivel_jerarquico', 'name'):
            cargo_dict = {
                'id': cargo.id,
                'code': cargo.code,
                'name': cargo.name,
                'description': cargo.description,
                'area': cargo.area_id,
                'area_name': cargo.area.name if cargo.area else None,
                'parent_cargo': cargo.parent_cargo_id,
                'parent_cargo_name': cargo.parent_cargo.name if cargo.parent_cargo else None,
                'nivel_jerarquico': cargo.nivel_jerarquico,
                'is_jefatura': cargo.is_jefatura,
                'is_active': cargo.is_active,
                'cantidad_posiciones': cargo.cantidad_posiciones,
            }
            # Obtener usuarios asignados con sus fotos
            usuarios_cargo = User.objects.filter(
                cargo=cargo,
                is_active=True,
                deleted_at__isnull=True
            )
            cargo_dict['usuarios_count'] = usuarios_cargo.count()

            # Lista de usuarios asignados con avatar info
            cargo_dict['usuarios_asignados'] = [
                {
                    'id': u.id,
                    'full_name': u.get_full_name() or u.username,
                    'photo_url': u.photo.url if u.photo else None,
                    'initials': self._get_initials(u.get_full_name() or u.username),
                }
                for u in usuarios_cargo[:5]  # Máximo 5 avatares por cargo
            ]

            # Contar subordinados directos
            subordinados = Cargo.objects.filter(parent_cargo=cargo)
            if solo_activos:
                subordinados = subordinados.filter(is_active=True)
            cargo_dict['subordinados_count'] = subordinados.count()

            cargos_data.append(cargo_dict)

        # Usuarios (opcional, para vista detallada)
        usuarios_data = []
        if include_usuarios:
            usuarios_qs = User.objects.filter(
                is_active=True,
                deleted_at__isnull=True
            ).select_related('cargo', 'cargo__area')

            for user in usuarios_qs:
                usuarios_data.append({
                    'id': user.id,
                    'username': user.username,
                    'full_name': user.get_full_name() or user.username,
                    'email': user.email,
                    'cargo_id': user.cargo_id,
                    'cargo_name': user.cargo.name if user.cargo else None,
                    'area_id': user.cargo.area_id if user.cargo else None,
                    'photo_url': user.photo.url if user.photo else None,
                    'initials': self._get_initials(user.get_full_name() or user.username),
                })

        # Estadísticas
        stats = {
            'total_areas': Area.objects.count(),
            'total_cargos': Cargo.objects.count(),
            'total_usuarios': User.objects.filter(is_active=True, deleted_at__isnull=True).count(),
            'areas_activas': Area.objects.filter(is_active=True).count(),
            'cargos_activos': Cargo.objects.filter(is_active=True).count(),
        }

        response_data = {
            'areas': areas_data,
            'cargos': cargos_data,
            'stats': stats,
        }

        if include_usuarios:
            response_data['usuarios'] = usuarios_data

        return Response(response_data)
