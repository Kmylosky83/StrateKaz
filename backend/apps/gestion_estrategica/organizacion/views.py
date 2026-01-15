"""
ViewSets para el módulo de Organización

Mixins aplicados:
- StandardViewSetMixin = ToggleActiveMixin + FilterInactiveMixin + BulkActionsMixin + AuditMixin
- OrderingMixin = Reordenamiento de registros con campo 'orden'

Endpoints generados automáticamente:
- POST /{resource}/{id}/toggle-active/ - Toggle is_active
- POST /{resource}/bulk-activate/ - Activar múltiples
- POST /{resource}/bulk-deactivate/ - Desactivar múltiples
- POST /{resource}/bulk-delete/ - Eliminar múltiples (con confirmación)
- POST /{resource}/reorder/ - Reordenar (solo AreaViewSet)
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from .models import Area
from .serializers import (
    AreaSerializer, AreaTreeSerializer, AreaListSerializer,
)
from apps.core.models import Cargo, User
from apps.core.permissions import GranularActionPermission
from apps.core.mixins import (
    StandardViewSetMixin,
    OrderingMixin,
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
    permission_classes = [IsAuthenticated, GranularActionPermission]
    section_code = 'areas'

    granular_action_map = {
        'tree': 'can_view',
        'root': 'can_view',
        'children': 'can_view',
        'reorder': 'can_edit',
        'toggle_active': 'can_edit',
        'bulk_activate': 'can_edit',
        'bulk_deactivate': 'can_edit',
        'bulk_delete': 'can_delete',
    }

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
            return Area.objects.all()

        return queryset

    @action(detail=False, methods=['get'])
    def tree(self, request):
        """
        Retorna el árbol jerárquico completo de áreas.
        Solo incluye áreas raíz, las subáreas vienen anidadas.
        """
        root_areas = self.get_queryset().filter(parent__isnull=True)
        serializer = AreaTreeSerializer(root_areas, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def root(self, request):
        """
        Retorna solo las áreas raíz (sin padre).
        Útil para selects de área padre.
        """
        root_areas = self.get_queryset().filter(parent__isnull=True)
        serializer = AreaSerializer(root_areas, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def children(self, request, pk=None):
        """
        Retorna las subáreas directas de un área.
        """
        area = self.get_object()
        children_qs = area.children.all()

        if request.query_params.get('include_inactive') != 'true':
            children_qs = children_qs.filter(is_active=True)

        children = children_qs.order_by('orden', 'name')
        serializer = AreaSerializer(children, many=True)
        return Response(serializer.data)

    def destroy(self, request, *args, **kwargs):
        """
        Elimina un área solo si no tiene subáreas activas.
        """
        area = self.get_object()

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
    """
    permission_classes = [IsAuthenticated, GranularActionPermission]
    section_code = 'organigrama'

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
                'icon': area.icon,
                'color': area.color,
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

            # Contar usuarios en esta área
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
            # Obtener usuarios asignados
            usuarios_cargo = User.objects.filter(
                cargo=cargo,
                is_active=True,
                deleted_at__isnull=True
            )
            cargo_dict['usuarios_count'] = usuarios_cargo.count()

            cargo_dict['usuarios_asignados'] = [
                {
                    'id': u.id,
                    'full_name': u.get_full_name() or u.username,
                    'photo_url': u.photo.url if u.photo else None,
                    'initials': self._get_initials(u.get_full_name() or u.username),
                }
                for u in usuarios_cargo[:5]
            ]

            # Contar subordinados directos
            subordinados = Cargo.objects.filter(parent_cargo=cargo)
            if solo_activos:
                subordinados = subordinados.filter(is_active=True)
            cargo_dict['subordinados_count'] = subordinados.count()

            cargos_data.append(cargo_dict)

        # Usuarios (opcional)
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
