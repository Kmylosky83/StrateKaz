"""
ViewSets para el Sistema RBAC Dinamico
Sistema de Gestion StrateKaz

Este modulo contiene los ViewSets para la gestion de:
- Permisos (solo lectura)
- Roles (CRUD completo)
- Cargos extendidos (CRUD con permisos)
- Grupos (CRUD completo)
- Menu dinamico
"""
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.pagination import PageNumberPagination
from django_filters.rest_framework import DjangoFilterBackend


class CatalogoPagination(PageNumberPagination):
    """
    Paginacion para catalogos pequenos (cargos, roles, etc.)
    Soporta page_size como query param con un maximo de 200
    """
    page_size = 100  # Por defecto devuelve 100 registros
    page_size_query_param = 'page_size'
    max_page_size = 200


from django.apps import apps
from django.db import transaction
from django.db import transaction
from django.db.models import Count, Q
from collections import defaultdict

from .utils.audit_logging import (
    log_permissions_assigned, log_section_access_changed, log_role_assigned,
    log_additional_role_changed, log_group_membership_changed
)

from .models import (
    Permiso, Role, RolePermiso, Cargo, CargoPermiso,
    Group, GroupRole, UserRole, UserGroup, User, MenuItem, CargoRole,
    RiesgoOcupacional, RolAdicional, RolAdicionalPermiso, UserRolAdicional,
    PermisoModulo, PermisoAccion, PermisoAlcance,
    TabSection, CargoSectionAccess
)
from .serializers_rbac import (
    PermisoListSerializer, PermisoDetailSerializer, PermissionGroupSerializer,
    RoleListSerializer, RoleDetailSerializer, RoleCreateSerializer, RoleUpdateSerializer,
    AssignPermissionsSerializer, RemovePermissionsSerializer,
    CargoListRBACSerializer, CargoDetailRBACSerializer, CargoCreateSerializer, CargoUpdateSerializer,
    GroupListSerializer, GroupDetailSerializer, GroupCreateSerializer, GroupUpdateSerializer,
    ManageGroupUsersSerializer,
    UserPermissionsSerializer, AssignRoleToUserSerializer, RemoveRoleFromUserSerializer,
    UserRolesListSerializer,
    MenuItemSerializer, MenuItemCreateSerializer,
    RBACStatsSerializer,
    RiesgoOcupacionalSerializer,
    # Serializers para RBAC Híbrido (Roles Adicionales)
    RolAdicionalListSerializer, RolAdicionalDetailSerializer,
    RolAdicionalCreateSerializer, RolAdicionalUpdateSerializer,
    UserRolAdicionalListSerializer, AsignarRolAdicionalSerializer,
    RevocarRolAdicionalSerializer, RolesSugeridosSerializer,
    UserPermisosEfectivosSerializer,
)
from .permissions import IsSuperAdmin, RequireCargoLevel, GranularActionPermission


# =============================================================================
# PERMISSION VIEWSET
# =============================================================================

class PermissionViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet de solo lectura para Permisos

    Los permisos son del sistema y no se pueden crear/eliminar desde la API
    Solo usuarios con nivel Coordinacion o superior pueden verlos

    Endpoints:
    - GET /api/core/permissions/ - Listar permisos
    - GET /api/core/permissions/{id}/ - Detalle de permiso
    - GET /api/core/permissions/modules/ - Listar modulos disponibles
    - GET /api/core/permissions/grouped/ - Permisos agrupados por modulo
    """

    queryset = Permiso.objects.all()
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['modulo', 'accion', 'alcance', 'is_active']
    search_fields = ['code', 'name', 'description']
    ordering_fields = ['modulo__orden', 'accion__orden', 'created_at']
    ordering = ['modulo__orden', 'accion__orden', 'alcance__nivel']

    def get_serializer_class(self):
        if self.action == 'list':
            return PermisoListSerializer
        return PermisoDetailSerializer

    def get_queryset(self):
        queryset = super().get_queryset()

        # Filtrar solo activos por defecto
        include_inactive = self.request.query_params.get('include_inactive', 'false')
        if include_inactive.lower() != 'true':
            queryset = queryset.filter(is_active=True)

        # Prefetch para optimizar
        queryset = queryset.select_related('modulo', 'accion', 'alcance')

        return queryset

    @action(detail=False, methods=['get'])
    def modules(self, request):
        """
        GET /api/core/permissions/modules/

        Retorna lista de modulos disponibles (dinamico desde PermisoModulo)
        """
        modulos = PermisoModulo.objects.filter(is_active=True).order_by('orden', 'name')
        modules = [
            {'value': m.code, 'label': m.name, 'icon': m.icon}
            for m in modulos
        ]
        return Response(modules)

    @action(detail=False, methods=['get'])
    def actions(self, request):
        """
        GET /api/core/permissions/actions/

        Retorna lista de acciones disponibles (dinamico desde PermisoAccion)
        """
        acciones = PermisoAccion.objects.filter(is_active=True).order_by('orden', 'name')
        actions = [
            {'value': a.code, 'label': a.name, 'icon': a.icon}
            for a in acciones
        ]
        return Response(actions)

    @action(detail=False, methods=['get'])
    def grouped(self, request):
        """
        GET /api/core/permissions/grouped/

        Retorna permisos agrupados por modulo (dinamico)
        """
        permisos = self.get_queryset()
        result = defaultdict(list)

        for permiso in permisos:
            # Agrupar por codigo de modulo
            modulo_code = permiso.modulo.code if permiso.modulo else 'SIN_MODULO'
            result[modulo_code].append(PermisoListSerializer(permiso).data)

        # Obtener nombres de modulos
        modulos = {m.code: m for m in PermisoModulo.objects.filter(is_active=True)}

        # Formatear respuesta
        grouped = [
            {
                'module': module_code,
                'module_name': modulos.get(module_code, None) and modulos[module_code].name or module_code,
                'module_icon': modulos.get(module_code, None) and modulos[module_code].icon or None,
                'permissions': perms
            }
            for module_code, perms in result.items()
        ]

        # Ordenar por orden del modulo
        grouped.sort(key=lambda x: modulos.get(x['module'], None) and modulos[x['module']].orden or 999)

        return Response(grouped)


# =============================================================================
# ROLE VIEWSET
# =============================================================================

class RoleViewSet(viewsets.ModelViewSet):
    """
    ViewSet completo para Roles

    Solo usuarios con nivel Coordinacion o superior pueden gestionar roles

    Endpoints:
    - GET /api/core/roles/ - Listar roles
    - POST /api/core/roles/ - Crear rol
    - GET /api/core/roles/{id}/ - Detalle de rol
    - PATCH /api/core/roles/{id}/ - Actualizar rol
    - DELETE /api/core/roles/{id}/ - Soft delete de rol
    - POST /api/core/roles/{id}/assign-permissions/ - Asignar permisos
    - POST /api/core/roles/{id}/remove-permissions/ - Quitar permisos
    """

    queryset = Role.objects.all()
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['is_active', 'is_system']
    search_fields = ['code', 'name', 'description']
    ordering_fields = ['name', 'created_at']
    ordering = ['name']

    def get_serializer_class(self):
        if self.action == 'list':
            return RoleListSerializer
        elif self.action == 'create':
            return RoleCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return RoleUpdateSerializer
        elif self.action == 'assign_permissions':
            return AssignPermissionsSerializer
        elif self.action == 'remove_permissions':
            return RemovePermissionsSerializer
        return RoleDetailSerializer

    def get_queryset(self):
        queryset = super().get_queryset()

        include_inactive = self.request.query_params.get('include_inactive', 'false')
        if include_inactive.lower() != 'true':
            queryset = queryset.filter(is_active=True)

        # Prefetch related para optimizar
        return queryset.prefetch_related('permisos', 'user_roles', 'groups')

    def perform_destroy(self, instance):
        """Soft delete - no permite eliminar roles del sistema"""
        if instance.is_system:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('No se puede eliminar un rol del sistema')

        instance.is_active = False
        instance.save()

    @action(detail=True, methods=['post'])
    def assign_permissions(self, request, pk=None):
        """
        POST /api/core/roles/{id}/assign-permissions/

        Body:
        {
            "permission_ids": [1, 2, 3],
            "replace": false  // true = reemplaza, false = agrega
        }
        """
        role = self.get_object()

        if role.is_system:
            return Response(
                {'error': 'No se pueden modificar permisos de roles del sistema'},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = AssignPermissionsSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        permission_ids = serializer.validated_data['permission_ids']
        replace = serializer.validated_data['replace']

        with transaction.atomic():
            # Si replace=True, eliminar permisos existentes
            if replace:
                RolePermiso.objects.filter(role=role).delete()

            # Agregar nuevos permisos
            permisos = Permiso.objects.filter(id__in=permission_ids, is_active=True)
            for permiso in permisos:
                RolePermiso.objects.get_or_create(
                    role=role,
                    permiso=permiso,
                    defaults={'granted_by': request.user}
                )

        # P0-10: Audit logging
        log_permissions_assigned(request, role, 'role', permission_ids, action='assigned')

        # Retornar rol actualizado
        return Response(
            RoleDetailSerializer(role).data,
            status=status.HTTP_200_OK
        )

    @action(detail=True, methods=['post'])
    def remove_permissions(self, request, pk=None):
        """
        POST /api/core/roles/{id}/remove-permissions/

        Body:
        {
            "permission_ids": [1, 2, 3]
        }
        """
        role = self.get_object()

        if role.is_system:
            return Response(
                {'error': 'No se pueden modificar permisos de roles del sistema'},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = RemovePermissionsSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        permission_ids = serializer.validated_data['permission_ids']

        # Eliminar relaciones
        deleted_count = RolePermiso.objects.filter(
            role=role,
            permiso_id__in=permission_ids
        ).delete()[0]

        # P0-10: Audit logging
        log_permissions_assigned(request, role, 'role', permission_ids, action='removed')

        return Response({
            'message': f'{deleted_count} permisos removidos exitosamente',
            'role': RoleDetailSerializer(role).data
        }, status=status.HTTP_200_OK)


# =============================================================================
# CARGO RBAC VIEWSET
# =============================================================================

class CargoRBACViewSet(viewsets.ModelViewSet):
    """
    ViewSet extendido para Cargos con gestion de permisos y manual de funciones

    Endpoints:
    - GET /api/core/cargos-rbac/ - Listar cargos
    - POST /api/core/cargos-rbac/ - Crear cargo
    - GET /api/core/cargos-rbac/{id}/ - Detalle completo con manual de funciones
    - PATCH /api/core/cargos-rbac/{id}/ - Actualizar
    - DELETE /api/core/cargos-rbac/{id}/ - Soft delete
    - POST /api/core/cargos-rbac/{id}/assign-permissions/ - Asignar permisos
    - POST /api/core/cargos-rbac/{id}/assign-roles/ - Asignar roles por defecto
    - POST /api/core/cargos-rbac/{id}/assign-riesgos/ - Asignar riesgos SST
    - GET /api/core/cargos-rbac/levels/ - Listar niveles jerarquicos
    - GET /api/core/cargos-rbac/areas/ - Listar areas disponibles
    - GET /api/core/cargos-rbac/choices/ - Todos los choices para formularios
    """

    queryset = Cargo.objects.all()
    
    # Permission config
    permission_classes = [IsAuthenticated, GranularActionPermission]
    section_code = 'cargos'
    granular_action_map = {
        'levels': 'can_view',
        'areas': 'can_view',
        'choices': 'can_view',
        'section_accesses': 'can_view',
        'toggle': 'can_edit',
        'reorder': 'can_edit',
        'assign_permissions': 'can_edit',
        'assign_roles': 'can_edit',
        'assign_riesgos': 'can_edit',
        'assign_section_accesses': 'can_edit',
        'clear_section_accesses': 'can_edit',
        'plantilla_importacion': 'can_view',
        'importar': 'can_create',
    }

    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['nivel_jerarquico', 'area', 'is_active', 'is_system', 'is_jefatura']
    search_fields = ['code', 'name', 'description', 'objetivo_cargo']
    ordering = ['orden', 'nivel_jerarquico', 'name']
    # Paginacion para catalogos: 100 por defecto, soporta page_size query param (max 200)
    pagination_class = CatalogoPagination

    def get_serializer_class(self):
        if self.action == 'list':
            return CargoListRBACSerializer
        elif self.action == 'create':
            return CargoCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return CargoUpdateSerializer
        return CargoDetailRBACSerializer

    def get_queryset(self):
        queryset = super().get_queryset()

        # Acciones que necesitan ver TODOS los cargos (activos e inactivos)
        needs_all = self.action in ('toggle', 'destroy', 'retrieve', 'update', 'partial_update')
        include_inactive = self.request.query_params.get('include_inactive', 'false')
        if include_inactive.lower() != 'true' and not needs_all:
            queryset = queryset.filter(is_active=True)

        # is_system controla protección contra eliminación (perform_destroy),
        # NO visibilidad — los cargos seed son puestos reales de negocio.
        # Filtro opcional para excluir si se necesita en otro contexto.
        include_system = self.request.query_params.get('include_system')
        if include_system is not None and include_system.lower() == 'false':
            queryset = queryset.filter(is_system=False)

        return queryset.select_related('parent_cargo', 'area', 'rol_sistema').prefetch_related(
            'permisos', 'default_roles', 'expuesto_riesgos', 'usuarios'
        )

    def perform_destroy(self, instance):
        """
        Hard delete — el cargo se elimina permanentemente de la BD.

        Seguro con doctrina "tenant soberano post-setup": el seed de cargos
        ya no corre en el pipeline automatico (deploy_seeds_all_tenants),
        por lo que eliminar un cargo NO lo recrea en el proximo deploy.

        Bloqueos de integridad:
        - Si tiene usuarios activos asignados -> bloquear con error.
        - Si tiene vacantes activas sin candidatos -> cancelar en cascade.

        Para "desactivar sin eliminar" usar el endpoint /toggle/ que
        cambia is_active sin borrar el registro.
        """
        # Verificar si tiene usuarios asignados
        users_count = instance.usuarios.filter(is_active=True, deleted_at__isnull=True).count()
        if users_count > 0:
            from rest_framework.exceptions import ValidationError
            raise ValidationError({
                'error': f'No se puede eliminar el cargo porque tiene {users_count} usuario(s) asignado(s). '
                         'Reasigne los usuarios primero.'
            })

        # Cascade: cancelar vacantes vinculadas sin candidatos
        try:
            VacanteActiva = apps.get_model('seleccion_contratacion', 'VacanteActiva')
            vacantes = VacanteActiva.objects.filter(cargo=instance, is_active=True)
            for vacante in vacantes:
                candidatos_count = vacante.candidatos.filter(is_active=True).exclude(
                    estado__in=['rechazado', 'descartado']
                ).count()
                if candidatos_count == 0:
                    vacante.estado = 'cancelada'
                    vacante.is_active = False
                    vacante.motivo_cierre = 'Cargo eliminado del sistema'
                    vacante.save(update_fields=['estado', 'is_active', 'motivo_cierre'])
        except Exception:
            pass

        # Hard delete — borra permanentemente de la BD.
        # CargoSectionAccess y demas FKs cascadean segun on_delete del modelo.
        instance.delete()

    @action(detail=False, methods=['post'])
    @transaction.atomic
    def reorder(self, request):
        """
        POST /api/core/cargos-rbac/reorder/
        Body: {"orders": [{"id": 1, "orden": 0}, {"id": 2, "orden": 1}, ...]}

        Actualiza el orden de múltiples cargos de forma atómica.
        """
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
            'message': f'{updated_count} cargos reordenados',
        })

    @action(detail=True, methods=['post'], url_path='toggle')
    def toggle(self, request, pk=None):
        """
        POST /api/core/cargos-rbac/{id}/toggle/

        Activa o desactiva un cargo. Desactivar un cargo NO afecta usuarios
        asignados — solo lo oculta de dropdowns y listados filtrados.

        Body (opcional): {"is_active": true/false}
        Si no se envía body, alterna el estado actual.
        """
        cargo = self.get_object()

        new_state = request.data.get('is_active')
        if new_state is None:
            new_state = not cargo.is_active
        else:
            new_state = bool(new_state)

        cargo.is_active = new_state
        cargo.save(update_fields=['is_active'])

        return Response({
            'id': cargo.id,
            'name': cargo.name,
            'is_active': cargo.is_active,
            'message': f'Cargo {"activado" if new_state else "desactivado"} exitosamente',
        })

    @action(detail=True, methods=['post'])
    def assign_permissions(self, request, pk=None):
        """
        POST /api/core/cargos-rbac/{id}/assign-permissions/

        Body:
        {
            "permission_ids": [1, 2, 3],
            "replace": false
        }
        """
        cargo = self.get_object()
        serializer = AssignPermissionsSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        permission_ids = serializer.validated_data['permission_ids']
        replace = serializer.validated_data['replace']

        with transaction.atomic():
            if replace:
                CargoPermiso.objects.filter(cargo=cargo).delete()

            permisos = Permiso.objects.filter(id__in=permission_ids, is_active=True)
            for permiso in permisos:
                CargoPermiso.objects.get_or_create(
                    cargo=cargo,
                    permiso=permiso,
                    defaults={'granted_by': request.user}
                )

        # P0-10: Audit logging
        log_permissions_assigned(request, cargo, 'cargo', permission_ids, action='assigned')

        return Response(
            CargoDetailRBACSerializer(cargo).data,
            status=status.HTTP_200_OK
        )

    @action(detail=True, methods=['post'])
    def assign_roles(self, request, pk=None):
        """
        POST /api/core/cargos-rbac/{id}/assign-roles/

        Body:
        {
            "role_ids": [1, 2, 3],
            "replace": false
        }
        """
        cargo = self.get_object()

        role_ids = request.data.get('role_ids', [])
        replace = request.data.get('replace', False)

        if not role_ids:
            return Response(
                {'error': 'Debe proporcionar al menos un rol'},
                status=status.HTTP_400_BAD_REQUEST
            )

        with transaction.atomic():
            if replace:
                CargoRole.objects.filter(cargo=cargo).delete()

            roles = Role.objects.filter(id__in=role_ids, is_active=True)
            for role in roles:
                CargoRole.objects.get_or_create(cargo=cargo, role=role)

        # P0-10: Audit logging (log each role assigned)
        for role in roles:
            log_role_assigned(request, cargo, role, action='assigned')

        return Response(
            CargoDetailRBACSerializer(cargo).data,
            status=status.HTTP_200_OK
        )

    @action(detail=True, methods=['post'])
    def assign_riesgos(self, request, pk=None):
        """
        POST /api/core/cargos-rbac/{id}/assign-riesgos/

        Body:
        {
            "riesgo_ids": [1, 2, 3],
            "replace": false
        }
        """
        cargo = self.get_object()
        riesgo_ids = request.data.get('riesgo_ids', [])
        replace = request.data.get('replace', False)

        if not riesgo_ids:
            return Response(
                {'error': 'Debe proporcionar al menos un riesgo'},
                status=status.HTTP_400_BAD_REQUEST
            )

        from .models import RiesgoOcupacional as RiesgoModel

        with transaction.atomic():
            if replace:
                cargo.expuesto_riesgos.clear()

            riesgos = RiesgoModel.objects.filter(id__in=riesgo_ids, is_active=True)
            cargo.expuesto_riesgos.add(*riesgos)

        return Response(
            CargoDetailRBACSerializer(cargo).data,
            status=status.HTTP_200_OK
        )

    @action(detail=False, methods=['get'])
    def levels(self, request):
        """
        GET /api/core/cargos-rbac/levels/

        Retorna lista de niveles jerarquicos disponibles
        """
        levels = [
            {'value': code, 'label': label}
            for code, label in Cargo.NIVEL_JERARQUICO_CHOICES
        ]
        return Response(levels)

    @action(detail=False, methods=['get'])
    def areas(self, request):
        """
        GET /api/core/cargos-rbac/areas/

        Retorna lista de areas activas desde el modelo Area
        """
        from apps.gestion_estrategica.organizacion.models import Area as AreaModel

        areas = AreaModel.objects.filter(is_active=True).values('id', 'code', 'name')
        return Response([
            {'value': area['id'], 'label': f"{area['code']} - {area['name']}"}
            for area in areas
        ])

    @action(detail=False, methods=['get'])
    def choices(self, request):
        """
        GET /api/core/cargos-rbac/choices/

        Retorna todos los choices disponibles para formularios de cargo
        """
        from apps.gestion_estrategica.organizacion.models import Area as AreaModel

        areas = AreaModel.objects.filter(is_active=True).values('id', 'code', 'name')

        return Response({
            'nivel_jerarquico_choices': [
                {'value': code, 'label': label}
                for code, label in Cargo.NIVEL_JERARQUICO_CHOICES
            ],
            'nivel_educativo_choices': [
                {'value': code, 'label': label}
                for code, label in Cargo.NIVEL_EDUCATIVO_CHOICES
            ],
            'experiencia_choices': [
                {'value': code, 'label': label}
                for code, label in Cargo.EXPERIENCIA_CHOICES
            ],
            'areas': [
                {'value': area['id'], 'label': area['name']}
                for area in areas
            ],
        })

    # =========================================================================
    # ACCESO A SECCIONES (Matriz de Permisos por Cargo)
    # =========================================================================

    @action(detail=True, methods=['get'], url_path='section-accesses')
    def section_accesses(self, request, pk=None):
        """
        GET /api/core/cargos-rbac/{id}/section-accesses/

        Retorna las secciones a las que el cargo tiene acceso CON sus acciones CRUD.
        Sistema RBAC Unificado v4.0 - acciones integradas en acceso a secciones.

        Response:
        {
            "cargo_id": 1,
            "cargo_name": "Gerente General",
            "accesses": [
                {
                    "section_id": 1,
                    "section_code": "empresa",
                    "section_name": "Datos de Empresa",
                    "module_code": "gestion_estrategica",
                    "tab_code": "configuracion",
                    "can_view": true,
                    "can_create": false,
                    "can_edit": true,
                    "can_delete": false
                },
                ...
            ],
            "total_sections": 5
        }
        """
        cargo = self.get_object()

        # 1. Obtener TODAS las secciones habilitadas
        all_sections = TabSection.objects.filter(is_enabled=True).select_related(
            'tab__module'
        ).order_by(
            'tab__module__orden',
            'tab__orden',
            'orden'
        )

        # 2. Obtener accesos asignados
        assigned_accesses = CargoSectionAccess.objects.filter(cargo=cargo).select_related(
            'section'
        )
        access_map = {acc.section_id: acc for acc in assigned_accesses}

        accesses_data = []
        for section in all_sections:
            access = access_map.get(section.id)

            # Si tiene acceso, usar sus permisos. Si no, todo False.
            if access:
                can_view = access.can_view
                can_create = access.can_create
                can_edit = access.can_edit
                can_delete = access.can_delete
                custom_actions = access.custom_actions
            else:
                can_view = False
                can_create = False
                can_edit = False
                can_delete = False
                custom_actions = {}

            accesses_data.append({
                'section_id': section.id,
                'section_code': section.code,
                'section_name': section.name,
                'module_code': section.tab.module.code,
                'module_name': section.tab.module.name,
                'tab_code': section.tab.code,
                'tab_name': section.tab.name,
                'can_view': can_view,
                'can_create': can_create,
                'can_edit': can_edit,
                'can_delete': can_delete,
                'custom_actions': custom_actions,
                'supported_actions': section.supported_actions,
            })

        return Response({
            'cargo_id': cargo.id,
            'cargo_name': cargo.name,
            'accesses': accesses_data,
            'total_sections': len(accesses_data)
        })

    @action(detail=True, methods=['post'], url_path='assign-section-accesses')
    def assign_section_accesses(self, request, pk=None):
        """
        POST /api/core/cargos-rbac/{id}/assign-section-accesses/

        Asigna acceso a secciones para un cargo CON sus acciones CRUD.
        Sistema RBAC Unificado v4.0 - acciones integradas en acceso a secciones.

        Body (nuevo formato con acciones):
        {
            "accesses": [
                {
                    "section_id": 1, 
                    "can_view": true, 
                    "can_create": false, 
                    "can_edit": true, 
                    "can_delete": false,
                    "custom_actions": {"enviar": true, "aprobar": false}
                },
                ...
            ],
            "replace": true  // true = reemplaza todos los accesos
        }

        Body (formato legacy - solo section_ids, asigna can_view=true por defecto):
        {
            "section_ids": [1, 2, 3, 5, 7],
            "replace": true
        }

        Response:
        {
            "message": "Accesos actualizados exitosamente",
            "cargo_id": 1,
            "cargo_name": "Gerente General",
            "sections_added": 3,
            "sections_removed": 2,
            "total_sections": 5
        }
        """
        cargo = self.get_object()
        replace = request.data.get('replace', True)

        # Detectar formato: nuevo (accesses) o legacy (section_ids)
        accesses_data = request.data.get('accesses', None)
        section_ids = request.data.get('section_ids', None)

        if accesses_data is not None:
            # Nuevo formato con acciones CRUD
            if not isinstance(accesses_data, list):
                return Response(
                    {'error': 'accesses debe ser una lista'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            with transaction.atomic():
                if replace:
                    CargoSectionAccess.objects.filter(cargo=cargo).delete()

                sections_added = 0
                sections_updated = 0

                for access_item in accesses_data:
                    section_id = access_item.get('section_id')
                    if not section_id:
                        continue

                    try:
                        section = TabSection.objects.get(id=section_id, is_enabled=True)
                    except TabSection.DoesNotExist:
                        continue

                    # Validar custom_actions
                    custom_actions = access_item.get('custom_actions', {})
                    if custom_actions:
                        if not isinstance(custom_actions, dict):
                            # Si no es dict, ignorar o lanzar error (aquí ignoramos por robustez)
                            custom_actions = {}
                        else:
                            # Validacion Estricta: Solo permitir acciones soportadas
                            supported = set(section.supported_actions)
                            valid_custom_actions = {}
                            for action_key, action_value in custom_actions.items():
                                if action_key in supported:
                                    valid_custom_actions[action_key] = bool(action_value)
                            custom_actions = valid_custom_actions

                    # Crear o actualizar acceso
                    access, created = CargoSectionAccess.objects.update_or_create(
                        cargo=cargo,
                        section=section,
                        defaults={
                            'can_view': access_item.get('can_view', True),
                            'can_create': access_item.get('can_create', False),
                            'can_edit': access_item.get('can_edit', False),
                            'can_delete': access_item.get('can_delete', False),
                            'custom_actions': custom_actions,
                            'granted_by': request.user,
                        }
                    )

                    if created:
                        sections_added += 1
                    else:
                        sections_updated += 1

        elif section_ids is not None:
            # Formato legacy - solo IDs, asignar can_view=true por defecto
            if not isinstance(section_ids, list):
                return Response(
                    {'error': 'section_ids debe ser una lista de IDs'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            with transaction.atomic():
                existing_ids = set(
                    CargoSectionAccess.objects.filter(cargo=cargo)
                    .values_list('section_id', flat=True)
                )

                if replace:
                    CargoSectionAccess.objects.filter(cargo=cargo).delete()

                sections_to_add = TabSection.objects.filter(
                    id__in=section_ids,
                    is_enabled=True
                )
                sections_added = 0
                for section in sections_to_add:
                    CargoSectionAccess.objects.update_or_create(
                        cargo=cargo,
                        section=section,
                        defaults={
                            'can_view': True,
                            'can_create': False,
                            'can_edit': False,
                            'can_delete': False,
                            'granted_by': request.user,
                        }
                    )
                    sections_added += 1
                sections_updated = 0
        else:
            return Response(
                {'error': 'Debe proporcionar accesses o section_ids'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Contar total final
        total_sections = CargoSectionAccess.objects.filter(cargo=cargo).count()

        # P0-10: Audit logging
        log_section_access_changed(request, cargo, sections_added + sections_updated, action='assigned')

        return Response({
            'message': 'Accesos actualizados exitosamente',
            'cargo_id': cargo.id,
            'cargo_name': cargo.name,
            'sections_added': sections_added,
            'sections_updated': sections_updated,
            'total_sections': total_sections
        })

    @action(detail=True, methods=['delete'], url_path='clear-section-accesses')
    def clear_section_accesses(self, request, pk=None):
        """
        DELETE /api/core/cargos-rbac/{id}/clear-section-accesses/

        Elimina todos los accesos a secciones de un cargo.
        """
        cargo = self.get_object()

        deleted_count = CargoSectionAccess.objects.filter(cargo=cargo).delete()[0]

        # P0-10: Audit logging
        log_section_access_changed(request, cargo, deleted_count, action='cleared')

        return Response({
            'message': f'Se eliminaron {deleted_count} accesos del cargo {cargo.name}',
            'cargo_id': cargo.id,
            'deleted_count': deleted_count
        })

    # =========================================================================
    # IMPORTACIÓN MASIVA DESDE EXCEL
    # =========================================================================

    @action(detail=False, methods=['get'], url_path='plantilla-importacion')
    def plantilla_importacion(self, request):
        """
        Descarga la plantilla Excel para importación masiva de cargos.
        GET /api/core/cargos-rbac/plantilla-importacion/
        Incluye hoja de datos + hoja de referencia con valores válidos del tenant.
        """
        import logging
        from django.http import HttpResponse
        from .import_cargos_utils import generate_cargo_import_template

        logger = logging.getLogger(__name__)

        # Obtener áreas del tenant para la hoja de referencia
        try:
            from apps.gestion_estrategica.organizacion.models import Area as AreaModel
            areas = list(AreaModel.objects.filter(is_active=True).values('name'))
        except Exception:
            logger.warning("No se pudieron obtener las áreas para la plantilla de importación de cargos")
            areas = []

        # Obtener cargos existentes para referencia de cargo padre
        try:
            cargos_existentes = list(
                Cargo.objects.filter(is_active=True, is_system=False)
                .values('name', 'code')
                .order_by('name')
            )
        except Exception:
            logger.warning("No se pudieron obtener los cargos existentes para la plantilla")
            cargos_existentes = []

        excel_bytes = generate_cargo_import_template(
            areas=areas,
            cargos_existentes=cargos_existentes,
        )

        response = HttpResponse(
            excel_bytes,
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        response['Content-Disposition'] = 'attachment; filename="plantilla_cargos.xlsx"'
        return response

    @action(detail=False, methods=['post'], url_path='importar')
    def importar(self, request):
        """
        Importa cargos desde un archivo Excel.
        POST /api/core/cargos-rbac/importar/   multipart/form-data  campo: archivo

        Procesa fila por fila — los errores NO bloquean las filas válidas.
        Respuesta:
        {
          "creados": N,
          "actualizados": N,
          "errores": [{"fila": X, "codigo": "...", "errores": [...]}]
        }
        """
        import logging
        logger = logging.getLogger(__name__)

        archivo = request.FILES.get('archivo')
        if not archivo:
            return Response(
                {'detail': 'Se requiere el archivo Excel (.xlsx).'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validar extensión
        nombre = archivo.name.lower()
        if not (nombre.endswith('.xlsx') or nombre.endswith('.xls')):
            return Response(
                {'detail': 'El archivo debe ser Excel (.xlsx).'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Parsear el archivo
        try:
            from .import_cargos_utils import parse_cargo_excel, CARGO_COLUMNAS
            contenido = archivo.read()
            filas = parse_cargo_excel(contenido)
        except Exception as e:
            logger.error('Error parseando archivo de importación de cargos: %s', e, exc_info=True)
            return Response(
                {'detail': f'No se pudo leer el archivo: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not filas:
            return Response(
                {'detail': 'El archivo no contiene datos. Verifica que haya filas después de las cabeceras (fila 4 en adelante).'},
                status=status.HTTP_400_BAD_REQUEST
            )

        user = request.user
        creados = 0
        actualizados = 0
        errores = []

        from .import_cargos_serializer import CargoImportRowSerializer

        for fila_raw in filas:
            num_fila = fila_raw.pop('_fila', '?')
            codigo_raw = str(fila_raw.get('codigo', '')).strip()

            # Construir dict normalizado para el serializer
            datos = {col: fila_raw.get(col, '') for col in CARGO_COLUMNAS}

            serializer = CargoImportRowSerializer(data=datos)
            if not serializer.is_valid():
                # Aplanar errores a lista de strings
                msgs = []
                for field, errs in serializer.errors.items():
                    if isinstance(errs, list):
                        msgs.extend([str(e) for e in errs])
                    else:
                        msgs.append(str(errs))
                errores.append({
                    'fila': num_fila,
                    'codigo': codigo_raw or '—',
                    'errores': msgs,
                })
                continue

            vdata = serializer.validated_data
            area = vdata.pop('_area')
            parent_cargo = vdata.pop('_parent_cargo')

            # Limpiar campos auxiliares no presentes en el modelo
            for key in ['area_nombre', 'cargo_padre_nombre']:
                vdata.pop(key, None)

            # Renombrar campos al formato del modelo
            cargo_data = {
                'code': vdata.pop('codigo'),
                'name': vdata.pop('nombre'),
                'nivel_jerarquico': vdata.pop('nivel_jerarquico'),
                'description': vdata.pop('descripcion', '') or None,
                'nivel_educativo': vdata.pop('nivel_educativo', None),
                'experiencia_requerida': vdata.pop('experiencia_requerida', None),
                'cantidad_posiciones': vdata.pop('cantidad_posiciones', 1),
                'is_jefatura': vdata.pop('is_jefatura', False),
                'area': area,
                'parent_cargo': parent_cargo,
                'created_by': user,
            }

            try:
                with transaction.atomic():
                    cargo = Cargo(**cargo_data)
                    cargo.full_clean()
                    cargo.save()
                    creados += 1

            except Exception as e:
                logger.error(
                    'Error importando cargo fila %s (código %s): %s',
                    num_fila, codigo_raw, e, exc_info=True
                )
                errores.append({
                    'fila': num_fila,
                    'codigo': codigo_raw or '—',
                    'errores': [str(e)],
                })

        return Response({
            'creados': creados,
            'actualizados': actualizados,
            'errores': errores,
            'total_filas': creados + actualizados + len(errores),
        }, status=status.HTTP_200_OK if creados > 0 else status.HTTP_400_BAD_REQUEST)


# =============================================================================
# GROUP VIEWSET
# =============================================================================

class GroupViewSet(viewsets.ModelViewSet):
    """
    ViewSet completo para Grupos

    Endpoints:
    - GET /api/core/groups/ - Listar grupos
    - POST /api/core/groups/ - Crear grupo
    - GET /api/core/groups/{id}/ - Detalle de grupo
    - PATCH /api/core/groups/{id}/ - Actualizar grupo
    - DELETE /api/core/groups/{id}/ - Soft delete de grupo
    - POST /api/core/groups/{id}/add-users/ - Agregar usuarios
    - POST /api/core/groups/{id}/remove-users/ - Quitar usuarios
    - POST /api/core/groups/{id}/assign-roles/ - Asignar roles al grupo
    """

    queryset = Group.objects.all()
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['is_active']
    search_fields = ['code', 'name', 'description']
    ordering = ['name']

    def get_serializer_class(self):
        if self.action == 'list':
            return GroupListSerializer
        elif self.action == 'create':
            return GroupCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return GroupUpdateSerializer
        elif self.action in ['add_users', 'remove_users']:
            return ManageGroupUsersSerializer
        return GroupDetailSerializer

    def get_queryset(self):
        queryset = super().get_queryset()

        include_inactive = self.request.query_params.get('include_inactive', 'false')
        if include_inactive.lower() != 'true':
            queryset = queryset.filter(is_active=True)

        return queryset.prefetch_related('roles', 'user_groups')

    def perform_destroy(self, instance):
        """Soft delete"""
        instance.is_active = False
        instance.save()

    @action(detail=True, methods=['post'])
    def add_users(self, request, pk=None):
        """
        POST /api/core/groups/{id}/add-users/

        Body:
        {
            "user_ids": [1, 2, 3],
            "leader_id": 1  // opcional
        }
        """
        group = self.get_object()
        serializer = ManageGroupUsersSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        user_ids = serializer.validated_data['user_ids']
        leader_id = serializer.validated_data.get('leader_id')

        # Validar usuarios
        users = User.objects.filter(
            id__in=user_ids,
            is_active=True,
            deleted_at__isnull=True
        )

        if users.count() != len(user_ids):
            return Response(
                {'error': 'Algunos usuarios no existen o estan inactivos'},
                status=status.HTTP_400_BAD_REQUEST
            )

        with transaction.atomic():
            for user in users:
                is_leader = (user.id == leader_id)
                UserGroup.objects.get_or_create(
                    user=user,
                    group=group,
                    defaults={
                        'assigned_by': request.user,
                        'is_leader': is_leader
                    }
                )

        # P0-10: Audit logging
        log_group_membership_changed(request, group, user_ids, action='added')

        return Response(
            GroupDetailSerializer(group).data,
            status=status.HTTP_200_OK
        )

    @action(detail=True, methods=['post'])
    def remove_users(self, request, pk=None):
        """
        POST /api/core/groups/{id}/remove-users/

        Body:
        {
            "user_ids": [1, 2, 3]
        }
        """
        group = self.get_object()
        serializer = ManageGroupUsersSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        user_ids = serializer.validated_data['user_ids']

        deleted_count = UserGroup.objects.filter(
            group=group,
            user_id__in=user_ids
        ).delete()[0]

        # P0-10: Audit logging
        log_group_membership_changed(request, group, user_ids, action='removed')

        return Response({
            'message': f'{deleted_count} usuarios removidos del grupo',
            'group': GroupDetailSerializer(group).data
        }, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def assign_roles(self, request, pk=None):
        """
        POST /api/core/groups/{id}/assign-roles/

        Body:
        {
            "role_ids": [1, 2, 3],
            "replace": false
        }
        """
        group = self.get_object()

        role_ids = request.data.get('role_ids', [])
        replace = request.data.get('replace', False)

        if not role_ids:
            return Response(
                {'error': 'Debe proporcionar al menos un rol'},
                status=status.HTTP_400_BAD_REQUEST
            )

        with transaction.atomic():
            if replace:
                GroupRole.objects.filter(group=group).delete()

            roles = Role.objects.filter(id__in=role_ids, is_active=True)
            for role in roles:
                GroupRole.objects.get_or_create(
                    group=group,
                    role=role,
                    defaults={'assigned_by': request.user}
                )

        return Response(
            GroupDetailSerializer(group).data,
            status=status.HTTP_200_OK
        )


# =============================================================================
# MENU VIEWSET
# =============================================================================

class MenuViewSet(viewsets.ModelViewSet):
    """
    ViewSet para Menu dinamico

    Endpoints:
    - GET /api/core/menus/ - Listar estructura de menu
    - POST /api/core/menus/ - Crear item de menu
    - GET /api/core/menus/{id}/ - Detalle de item
    - PATCH /api/core/menus/{id}/ - Actualizar item
    - DELETE /api/core/menus/{id}/ - Eliminar item
    - GET /api/core/menus/user-menu/ - Menu del usuario actual
    - PATCH /api/core/menus/reorder/ - Reordenar items
    """

    queryset = MenuItem.objects.filter(parent__isnull=True)
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.OrderingFilter]
    ordering = ['orden']

    def get_serializer_class(self):
        if self.action == 'create':
            return MenuItemCreateSerializer
        return MenuItemSerializer

    def get_queryset(self):
        queryset = super().get_queryset()

        # Solo items activos por defecto
        include_inactive = self.request.query_params.get('include_inactive', 'false')
        if include_inactive.lower() != 'true':
            queryset = queryset.filter(is_active=True)

        return queryset.prefetch_related('children')

    @action(detail=False, methods=['get'])
    def user_menu(self, request):
        """
        GET /api/core/menus/user-menu/

        Retorna el menu filtrado por permisos del usuario actual
        """
        user = request.user
        menu_items = MenuItem.get_user_menu(user)

        return Response(MenuItemSerializer(menu_items, many=True).data)

    @action(detail=False, methods=['patch'])
    def reorder(self, request):
        """
        PATCH /api/core/menus/reorder/

        Body:
        {
            "items": [
                {"id": 1, "order": 0},
                {"id": 2, "order": 1},
                ...
            ]
        }
        """
        items = request.data.get('items', [])

        if not items:
            return Response(
                {'error': 'Debe proporcionar items para reordenar'},
                status=status.HTTP_400_BAD_REQUEST
            )

        with transaction.atomic():
            for item_data in items:
                MenuItem.objects.filter(id=item_data['id']).update(orden=item_data.get('orden', item_data.get('order')))

        return Response({'message': 'Menu reordenado exitosamente'})


# =============================================================================
# RBAC STATS VIEWSET
# =============================================================================

class RBACStatsViewSet(viewsets.ViewSet):
    """
    ViewSet para estadisticas RBAC

    Endpoints:
    - GET /api/core/rbac/stats/ - Estadisticas generales
    """

    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """
        GET /api/core/rbac/stats/

        Retorna estadisticas generales del sistema RBAC
        """
        stats = {
            'total_cargos': Cargo.objects.count(),
            'active_cargos': Cargo.objects.filter(is_active=True).count(),
            'system_cargos': Cargo.objects.filter(is_system=True).count(),
            'total_roles': Role.objects.count(),
            'active_roles': Role.objects.filter(is_active=True).count(),
            'system_roles': Role.objects.filter(is_system=True).count(),
            'total_groups': Group.objects.count(),
            'active_groups': Group.objects.filter(is_active=True).count(),
            'total_permissions': Permiso.objects.count(),
            'active_permissions': Permiso.objects.filter(is_active=True).count(),
            'total_users': User.objects.filter(
                deleted_at__isnull=True
            ).exclude(is_superuser=True, cargo__isnull=True).count(),
            'users_with_cargo': User.objects.filter(
                cargo__isnull=False,
                is_active=True,
                deleted_at__isnull=True
            ).count(),
        }

        return Response(stats)


# =============================================================================
# RIESGO OCUPACIONAL VIEWSET
# =============================================================================

class RiesgoOcupacionalViewSet(viewsets.ModelViewSet):
    """
    ViewSet para Riesgos Ocupacionales (Catalogo SST)

    Endpoints:
    - GET /api/core/riesgos-ocupacionales/ - Listar riesgos
    - POST /api/core/riesgos-ocupacionales/ - Crear riesgo
    - GET /api/core/riesgos-ocupacionales/{id}/ - Detalle
    - PATCH /api/core/riesgos-ocupacionales/{id}/ - Actualizar
    - DELETE /api/core/riesgos-ocupacionales/{id}/ - Soft delete
    - GET /api/core/riesgos-ocupacionales/clasificaciones/ - Listar clasificaciones GTC 45
    """

    queryset = RiesgoOcupacional.objects.all()
    serializer_class = RiesgoOcupacionalSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['clasificacion', 'nivel_riesgo', 'is_active']
    search_fields = ['code', 'name', 'descripcion', 'fuente']
    ordering = ['clasificacion', 'code']
    # Deshabilitamos paginacion para este catalogo (78 riesgos fijos)
    pagination_class = None

    def get_queryset(self):
        queryset = super().get_queryset()

        include_inactive = self.request.query_params.get('include_inactive', 'false')
        if include_inactive.lower() != 'true':
            queryset = queryset.filter(is_active=True)

        return queryset

    def perform_destroy(self, instance):
        """Soft delete - no elimina si tiene cargos asociados"""
        cargos_count = instance.cargos_expuestos.filter(is_active=True).count()
        if cargos_count > 0:
            from rest_framework.exceptions import ValidationError
            raise ValidationError(
                f'No se puede eliminar el riesgo porque esta asignado a {cargos_count} cargo(s)'
            )

        instance.is_active = False
        instance.save()

    @action(detail=False, methods=['get'])
    def clasificaciones(self, request):
        """
        GET /api/core/riesgos-ocupacionales/clasificaciones/

        Retorna lista de clasificaciones GTC 45
        """
        clasificaciones = [
            {'value': code, 'label': label}
            for code, label in RiesgoOcupacional.CLASIFICACION_CHOICES
        ]
        return Response(clasificaciones)

    @action(detail=False, methods=['get'], url_path='niveles-riesgo')
    def niveles_riesgo(self, request):
        """
        GET /api/core/riesgos-ocupacionales/niveles-riesgo/

        Retorna lista de niveles de riesgo
        """
        niveles = [
            {'value': code, 'label': label}
            for code, label in RiesgoOcupacional.NIVEL_RIESGO_CHOICES
        ]
        return Response(niveles)


# =============================================================================
# ROL ADICIONAL VIEWSET (RBAC Híbrido)
# =============================================================================

class RolAdicionalViewSet(viewsets.ModelViewSet):
    """
    ViewSet para Roles Adicionales (Sistema RBAC Híbrido)

    Los roles adicionales son roles transversales que NO son cargos organizacionales.
    Ejemplos: COPASST, Brigadista, Auditor ISO, Aprobador de Compras, etc.

    Endpoints:
    - GET /api/core/roles-adicionales/ - Listar roles adicionales
    - POST /api/core/roles-adicionales/ - Crear rol adicional
    - GET /api/core/roles-adicionales/{id}/ - Detalle de rol adicional
    - PATCH /api/core/roles-adicionales/{id}/ - Actualizar rol adicional
    - DELETE /api/core/roles-adicionales/{id}/ - Eliminar rol adicional
    - GET /api/core/roles-adicionales/tipos/ - Listar tipos de roles
    - GET /api/core/roles-adicionales/{id}/usuarios/ - Usuarios con este rol
    - POST /api/core/roles-adicionales/asignar/ - Asignar rol a usuario
    - POST /api/core/roles-adicionales/revocar/ - Revocar rol de usuario
    """

    queryset = RolAdicional.objects.all()
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['tipo', 'is_system', 'is_active', 'requiere_certificacion']
    search_fields = ['code', 'nombre', 'descripcion', 'justificacion_legal']
    ordering_fields = ['tipo', 'nombre', 'created_at']
    ordering = ['tipo', 'nombre']

    def get_serializer_class(self):
        if self.action == 'list':
            return RolAdicionalListSerializer
        elif self.action == 'retrieve':
            return RolAdicionalDetailSerializer
        elif self.action == 'create':
            return RolAdicionalCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return RolAdicionalUpdateSerializer
        return RolAdicionalListSerializer

    def get_queryset(self):
        queryset = super().get_queryset()

        # Por defecto solo activos
        include_inactive = self.request.query_params.get('include_inactive', 'false')
        if include_inactive.lower() != 'true':
            queryset = queryset.filter(is_active=True)

        return queryset.select_related('created_by')

    def perform_destroy(self, instance):
        """
        No se pueden eliminar roles del sistema.
        Para roles normales, verificar si hay usuarios asignados.
        """
        if instance.is_system:
            from rest_framework.exceptions import ValidationError
            raise ValidationError('No se pueden eliminar roles del sistema')

        usuarios_count = instance.usuarios_asignados.filter(is_active=True).count()
        if usuarios_count > 0:
            from rest_framework.exceptions import ValidationError
            raise ValidationError(
                f'No se puede eliminar el rol porque está asignado a {usuarios_count} usuario(s). '
                'Revoque las asignaciones primero.'
            )

        # Soft delete
        instance.is_active = False
        instance.save()

    @action(detail=False, methods=['get'])
    def tipos(self, request):
        """
        GET /api/core/roles-adicionales/tipos/

        Retorna lista de tipos de roles adicionales
        """
        tipos = [
            {'value': code, 'label': label}
            for code, label in RolAdicional.TIPO_CHOICES
        ]
        return Response(tipos)
    @action(detail=True, methods=['get'])
    def usuarios(self, request, pk=None):
        """
        GET /api/core/roles-adicionales/{id}/usuarios/

        Retorna lista de usuarios asignados a este rol adicional
        """
        rol = self.get_object()
        asignaciones = rol.usuarios_asignados.filter(
            is_active=True
        ).select_related('user', 'assigned_by')

        serializer = UserRolAdicionalListSerializer(asignaciones, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def asignar(self, request):
        """
        POST /api/core/roles-adicionales/asignar/

        Asigna un rol adicional a un usuario

        Body:
        {
            "user_id": 1,
            "rol_adicional_id": 1,
            "expires_at": "2025-12-31T23:59:59Z",  # opcional
            "justificacion": "Asignado como miembro del COPASST 2025",
            "fecha_certificacion": "2024-06-15",  # requerido si rol requiere cert
            "certificacion_expira": "2026-06-15"  # opcional
        }
        """
        serializer = AsignarRolAdicionalSerializer(
            data=request.data,
            context={'request': request}
        )
        serializer.is_valid(raise_exception=True)
        asignacion = serializer.save()

        # P0-10: Audit logging
        log_additional_role_changed(request, asignacion.user, asignacion.rol_adicional, action='assigned')

        return Response(
            UserRolAdicionalListSerializer(asignacion).data,
            status=status.HTTP_201_CREATED
        )

    @action(detail=False, methods=['post'])
    def revocar(self, request):
        """
        POST /api/core/roles-adicionales/revocar/

        Revoca un rol adicional de un usuario

        Body:
        {
            "user_id": 1,
            "rol_adicional_id": 1
        }
        """
        serializer = RevocarRolAdicionalSerializer(
            data=request.data,
            context={'request': request}
        )
        serializer.is_valid(raise_exception=True)

        asignacion = serializer.validated_data['asignacion']
        asignacion.is_active = False
        asignacion.save()

        # P0-10: Audit logging
        log_additional_role_changed(request, asignacion.user, asignacion.rol_adicional, action='revoked')

        return Response({'message': 'Rol revocado exitosamente'})



# =============================================================================
# USER ROLES ADICIONALES VIEWSET
# =============================================================================

class UserRolesAdicionalesViewSet(viewsets.ViewSet):
    """
    ViewSet para gestionar roles adicionales de un usuario específico

    Endpoints:
    - GET /api/users/{user_id}/roles-adicionales/ - Listar roles del usuario
    - GET /api/users/{user_id}/permisos-efectivos/ - Permisos efectivos del usuario
    - GET /api/users/{user_id}/certificaciones-por-vencer/ - Certificaciones próximas a vencer
    """

    permission_classes = [IsAuthenticated]

    @action(detail=True, methods=['get'], url_path='roles-adicionales')
    def roles_adicionales(self, request, pk=None):
        """
        GET /api/users/{user_id}/roles-adicionales/

        Retorna todos los roles adicionales del usuario
        """
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response(
                {'error': 'Usuario no encontrado'},
                status=status.HTTP_404_NOT_FOUND
            )

        asignaciones = user.usuarios_roles_adicionales.filter(
            is_active=True
        ).select_related('rol_adicional', 'assigned_by')

        serializer = UserRolAdicionalListSerializer(asignaciones, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'], url_path='permisos-efectivos')
    def permisos_efectivos(self, request, pk=None):
        """
        GET /api/users/{user_id}/permisos-efectivos/

        Retorna todos los permisos efectivos del usuario desglosados por fuente
        """
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response(
                {'error': 'Usuario no encontrado'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Permisos del cargo
        permisos_cargo = []
        if user.cargo:
            permisos_cargo = user.cargo.permisos.filter(is_active=True)

        # Permisos de roles adicionales (agrupados por rol)
        permisos_roles_adicionales = []
        for asignacion in user.get_roles_adicionales_activos():
            permisos_roles_adicionales.append({
                'rol_code': asignacion.rol_adicional.code,
                'rol_nombre': asignacion.rol_adicional.nombre,
                'permisos': PermisoListSerializer(
                    asignacion.rol_adicional.permisos.filter(is_active=True),
                    many=True
                ).data
            })

        # Permisos efectivos totales
        permisos_efectivos = user.get_all_permissions()

        data = {
            'user_id': user.id,
            'user_nombre': user.get_full_name(),
            'cargo': user.cargo.name if user.cargo else None,
            'permisos_cargo': PermisoListSerializer(permisos_cargo, many=True).data,
            'permisos_roles_adicionales': permisos_roles_adicionales,
            'permisos_efectivos': PermisoListSerializer(permisos_efectivos, many=True).data,
            'total_permisos': permisos_efectivos.count(),
        }

        return Response(data)

    @action(detail=True, methods=['get'], url_path='certificaciones-por-vencer')
    def certificaciones_por_vencer(self, request, pk=None):
        """
        GET /api/users/{user_id}/certificaciones-por-vencer/

        Retorna las certificaciones próximas a vencer (30 días por defecto)

        Query params:
        - dias: número de días para considerar (default: 30)
        """
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response(
                {'error': 'Usuario no encontrado'},
                status=status.HTTP_404_NOT_FOUND
            )

        dias = int(request.query_params.get('dias', 30))
        certificaciones = user.get_certificaciones_por_vencer(dias=dias)

        serializer = UserRolAdicionalListSerializer(certificaciones, many=True)
        return Response({
            'user_id': user.id,
            'user_nombre': user.get_full_name(),
            'dias_limite': dias,
            'certificaciones_por_vencer': serializer.data,
            'total': certificaciones.count(),
        })
