"""
ViewSets para el Modulo de Direccion Estrategica
Sistema de Gestion StrateKaz

Este modulo contiene los ViewSets para:
- Tab 1: Identidad Corporativa (Mision, Vision, Valores, Politica Integral)
- Tab 2: Planeacion Estrategica (Mapa Estrategico, Objetivos BSC/ISO)
- Tab 4: Configuracion (Modulos, Branding, Consecutivos)

NOTA: Este archivo fue movido desde apps.core.viewsets_strategic para eliminar
dependencias circulares. Los imports de gestion_estrategica ahora son locales.
"""
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django_filters.rest_framework import DjangoFilterBackend
from django.db import transaction
from django.utils import timezone

from django.contrib.auth import get_user_model
from django.db.models import Prefetch

# Modelos de core (RBAC, Configuracion del Sistema)
from apps.core.models import (
    SystemModule, ModuleTab, TabSection,
    BrandingConfig,
    Role, Cargo, CargoSectionAccess
)

# Modelos locales de gestion_estrategica (imports relativos)
from .identidad.models import CorporateIdentity, CorporateValue
from .planeacion.models import StrategicPlan, StrategicObjective

# Serializers locales de gestion_estrategica (imports relativos)
from .serializers_strategic import (
    # Tab 1: Identidad
    CorporateValueSerializer, CorporateValueCreateSerializer,
    CorporateIdentityListSerializer, CorporateIdentityDetailSerializer,
    CorporateIdentityCreateSerializer, CorporateIdentityUpdateSerializer,
    SignPolicySerializer,
    # Tab 2: Planeacion
    StrategicPlanListSerializer, StrategicPlanDetailSerializer,
    StrategicPlanCreateSerializer, StrategicPlanUpdateSerializer,
    ApprovePlanSerializer,
    StrategicObjectiveListSerializer, StrategicObjectiveDetailSerializer,
    StrategicObjectiveCreateSerializer, StrategicObjectiveUpdateSerializer,
    # Tab 4: Configuracion
    SystemModuleListSerializer, SystemModuleDetailSerializer,
    SystemModuleCreateSerializer, SystemModuleUpdateSerializer,
    SystemModuleTreeSerializer, ToggleModuleSerializer,
    ModuleTabSerializer, ModuleTabCreateSerializer, ToggleTabSerializer,
    TabSectionSerializer, TabSectionCreateSerializer, ToggleSectionSerializer,
    ModulesTreeSerializer, SidebarModuleSerializer,
    BrandingConfigSerializer, BrandingConfigCreateSerializer, BrandingConfigUpdateSerializer,
    # Stats
    StrategicStatsSerializer,
)


# =============================================================================
# TAB 1: IDENTIDAD CORPORATIVA
# =============================================================================

class CorporateIdentityViewSet(viewsets.ModelViewSet):
    """
    ViewSet para Identidad Corporativa

    Endpoints:
    - GET /api/core/corporate-identity/ - Listar identidades
    - POST /api/core/corporate-identity/ - Crear identidad
    - GET /api/core/corporate-identity/{id}/ - Detalle de identidad
    - PATCH /api/core/corporate-identity/{id}/ - Actualizar identidad
    - DELETE /api/core/corporate-identity/{id}/ - Eliminar identidad
    - GET /api/core/corporate-identity/active/ - Obtener identidad activa
    - POST /api/core/corporate-identity/{id}/sign-policy/ - Firmar politica
    - POST /api/core/corporate-identity/{id}/add-value/ - Agregar valor
    - DELETE /api/core/corporate-identity/{id}/remove-value/{value_id}/ - Quitar valor
    """

    queryset = CorporateIdentity.objects.all()
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['is_active']
    ordering = ['-effective_date']

    def get_serializer_class(self):
        if self.action == 'list':
            return CorporateIdentityListSerializer
        elif self.action == 'create':
            return CorporateIdentityCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return CorporateIdentityUpdateSerializer
        elif self.action == 'sign_policy':
            return SignPolicySerializer
        elif self.action == 'add_value':
            return CorporateValueCreateSerializer
        return CorporateIdentityDetailSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        return queryset.prefetch_related('values').select_related(
            'policy_signed_by', 'created_by'
        )

    @action(detail=False, methods=['get'])
    def active(self, request):
        """
        GET /api/core/corporate-identity/active/

        Retorna la identidad corporativa activa
        """
        identity = CorporateIdentity.objects.filter(is_active=True).first()
        if not identity:
            return Response(
                {'detail': 'No hay identidad corporativa activa'},
                status=status.HTTP_404_NOT_FOUND
            )
        return Response(CorporateIdentityDetailSerializer(identity).data)

    @action(detail=True, methods=['post'])
    def sign_policy(self, request, pk=None):
        """
        POST /api/core/corporate-identity/{id}/sign-policy/

        Firma digitalmente la politica integral
        """
        identity = self.get_object()

        if identity.is_signed:
            return Response(
                {'error': 'La politica ya esta firmada'},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = SignPolicySerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        identity.sign_policy(request.user)

        return Response({
            'message': 'Politica firmada exitosamente',
            'identity': CorporateIdentityDetailSerializer(identity).data
        })

    @action(detail=True, methods=['post'])
    def add_value(self, request, pk=None):
        """
        POST /api/core/corporate-identity/{id}/add-value/

        Agrega un valor corporativo
        """
        identity = self.get_object()
        serializer = CorporateValueCreateSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        # Obtener el orden maximo actual
        max_order = identity.values.order_by('-orden').values_list(
            'orden', flat=True
        ).first() or 0

        value = CorporateValue.objects.create(
            identity=identity,
            orden=max_order + 1,
            **serializer.validated_data
        )

        return Response(
            CorporateValueSerializer(value).data,
            status=status.HTTP_201_CREATED
        )

    @action(detail=True, methods=['delete'], url_path='remove-value/(?P<value_id>[^/.]+)')
    def remove_value(self, request, pk=None, value_id=None):
        """
        DELETE /api/core/corporate-identity/{id}/remove-value/{value_id}/

        Elimina un valor corporativo
        """
        identity = self.get_object()

        try:
            value = identity.values.get(id=value_id)
            value.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except CorporateValue.DoesNotExist:
            return Response(
                {'error': 'Valor no encontrado'},
                status=status.HTTP_404_NOT_FOUND
            )


class CorporateValueViewSet(viewsets.ModelViewSet):
    """
    ViewSet para Valores Corporativos

    Endpoints:
    - GET /api/core/corporate-values/ - Listar valores
    - POST /api/core/corporate-values/ - Crear valor
    - GET /api/core/corporate-values/{id}/ - Detalle de valor
    - PATCH /api/core/corporate-values/{id}/ - Actualizar valor
    - DELETE /api/core/corporate-values/{id}/ - Eliminar valor
    """

    queryset = CorporateValue.objects.all()
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['identity', 'is_active']
    search_fields = ['name', 'description']
    ordering = ['orden', 'name']

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return CorporateValueCreateSerializer
        return CorporateValueSerializer


# =============================================================================
# TAB 2: PLANEACION ESTRATEGICA
# =============================================================================

class StrategicPlanViewSet(viewsets.ModelViewSet):
    """
    ViewSet para Planes Estrategicos

    Endpoints:
    - GET /api/core/strategic-plans/ - Listar planes
    - POST /api/core/strategic-plans/ - Crear plan
    - GET /api/core/strategic-plans/{id}/ - Detalle de plan
    - PATCH /api/core/strategic-plans/{id}/ - Actualizar plan
    - DELETE /api/core/strategic-plans/{id}/ - Soft delete
    - GET /api/core/strategic-plans/active/ - Plan activo
    - POST /api/core/strategic-plans/{id}/approve/ - Aprobar plan
    - GET /api/core/strategic-plans/bsc-perspectives/ - Perspectivas BSC
    - GET /api/core/strategic-plans/iso-standards/ - Estandares ISO
    - GET /api/core/strategic-plans/period-types/ - Tipos de periodo
    """

    queryset = StrategicPlan.objects.all()
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['is_active', 'period_type']
    search_fields = ['name', 'description']
    ordering = ['-start_date']

    def get_serializer_class(self):
        if self.action == 'list':
            return StrategicPlanListSerializer
        elif self.action == 'create':
            return StrategicPlanCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return StrategicPlanUpdateSerializer
        elif self.action == 'approve':
            return ApprovePlanSerializer
        return StrategicPlanDetailSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        return queryset.prefetch_related('objectives').select_related(
            'approved_by', 'created_by'
        )

    def perform_destroy(self, instance):
        """Soft delete"""
        instance.is_active = False
        instance.save()

    @action(detail=False, methods=['get'])
    def active(self, request):
        """
        GET /api/core/strategic-plans/active/

        Retorna el plan estrategico activo
        """
        plan = StrategicPlan.objects.filter(is_active=True).first()
        if not plan:
            return Response(
                {'detail': 'No hay plan estrategico activo'},
                status=status.HTTP_404_NOT_FOUND
            )
        return Response(StrategicPlanDetailSerializer(plan).data)

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """
        POST /api/core/strategic-plans/{id}/approve/

        Aprueba el plan estrategico
        """
        plan = self.get_object()

        if plan.approved_by:
            return Response(
                {'error': 'El plan ya esta aprobado'},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = ApprovePlanSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        plan.approved_by = request.user
        plan.approved_at = timezone.now()
        plan.save(update_fields=['approved_by', 'approved_at'])

        return Response({
            'message': 'Plan aprobado exitosamente',
            'plan': StrategicPlanDetailSerializer(plan).data
        })

    @action(detail=False, methods=['get'])
    def bsc_perspectives(self, request):
        """
        GET /api/core/strategic-plans/bsc-perspectives/

        Retorna las perspectivas BSC disponibles
        """
        perspectives = [
            {'value': code, 'label': label}
            for code, label in StrategicObjective.BSC_PERSPECTIVE_CHOICES
        ]
        return Response(perspectives)

    @action(detail=False, methods=['get'])
    def iso_standards(self, request):
        """
        GET /api/core/strategic-plans/iso-standards/

        Retorna los estandares ISO disponibles
        """
        standards = [
            {'value': code, 'label': label}
            for code, label in StrategicObjective.ISO_STANDARD_CHOICES
        ]
        return Response(standards)

    @action(detail=False, methods=['get'])
    def period_types(self, request):
        """
        GET /api/core/strategic-plans/period-types/

        Retorna los tipos de periodo disponibles
        """
        types = [
            {'value': code, 'label': label}
            for code, label in StrategicPlan.PERIOD_CHOICES
        ]
        return Response(types)


class StrategicObjectiveViewSet(viewsets.ModelViewSet):
    """
    ViewSet para Objetivos Estrategicos

    Endpoints:
    - GET /api/core/strategic-objectives/ - Listar objetivos
    - POST /api/core/strategic-objectives/ - Crear objetivo
    - GET /api/core/strategic-objectives/{id}/ - Detalle de objetivo
    - PATCH /api/core/strategic-objectives/{id}/ - Actualizar objetivo
    - DELETE /api/core/strategic-objectives/{id}/ - Soft delete
    - POST /api/core/strategic-objectives/{id}/update-progress/ - Actualizar progreso
    - GET /api/core/strategic-objectives/statuses/ - Estados disponibles
    """

    queryset = StrategicObjective.objects.all()
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['plan', 'bsc_perspective', 'status', 'is_active', 'responsible']
    search_fields = ['code', 'name', 'description']
    ordering = ['bsc_perspective', 'orden', 'code']

    def get_serializer_class(self):
        if self.action == 'list':
            return StrategicObjectiveListSerializer
        elif self.action == 'create':
            return StrategicObjectiveCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return StrategicObjectiveUpdateSerializer
        return StrategicObjectiveDetailSerializer

    def get_queryset(self):
        queryset = super().get_queryset()

        include_inactive = self.request.query_params.get('include_inactive', 'false')
        if include_inactive.lower() != 'true':
            queryset = queryset.filter(is_active=True)

        return queryset.select_related(
            'plan', 'responsible', 'responsible_cargo', 'created_by'
        )

    def perform_destroy(self, instance):
        """Soft delete"""
        instance.is_active = False
        instance.save()

    @action(detail=True, methods=['post'])
    def update_progress(self, request, pk=None):
        """
        POST /api/core/strategic-objectives/{id}/update-progress/

        Actualiza el progreso del objetivo basado en valor actual vs meta
        """
        objective = self.get_object()

        current_value = request.data.get('current_value')
        if current_value is not None:
            objective.current_value = current_value
            objective.save(update_fields=['current_value'])

        objective.update_progress()

        return Response({
            'message': 'Progreso actualizado',
            'objective': StrategicObjectiveDetailSerializer(objective).data
        })

    @action(detail=False, methods=['get'])
    def statuses(self, request):
        """
        GET /api/core/strategic-objectives/statuses/

        Retorna los estados disponibles
        """
        statuses = [
            {'value': code, 'label': label}
            for code, label in StrategicObjective.STATUS_CHOICES
        ]
        return Response(statuses)


# =============================================================================
# TAB 4: CONFIGURACION
# =============================================================================

class SystemModuleViewSet(viewsets.ModelViewSet):
    """
    ViewSet para Modulos del Sistema

    Endpoints:
    - GET /api/core/system-modules/ - Listar modulos
    - POST /api/core/system-modules/ - Crear modulo
    - GET /api/core/system-modules/{id}/ - Detalle de modulo
    - PATCH /api/core/system-modules/{id}/ - Actualizar modulo
    - DELETE /api/core/system-modules/{id}/ - Eliminar modulo
    - PATCH /api/core/system-modules/{id}/toggle/ - Activar/Desactivar (mejorado)
    - GET /api/core/system-modules/categories/ - Categorias disponibles
    - GET /api/core/system-modules/enabled/ - Modulos habilitados
    - GET /api/core/system-modules/tree/ - Arbol completo con tabs y secciones
    - GET /api/core/system-modules/sidebar/ - Version compacta para sidebar
    """

    queryset = SystemModule.objects.all()
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category', 'is_enabled', 'is_core', 'requires_license']
    search_fields = ['code', 'name', 'description']
    ordering = ['category', 'orden', 'name']

    def get_serializer_class(self):
        if self.action == 'list':
            return SystemModuleListSerializer
        elif self.action == 'create':
            return SystemModuleCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return SystemModuleUpdateSerializer
        elif self.action == 'toggle':
            return ToggleModuleSerializer
        elif self.action == 'tree':
            return SystemModuleTreeSerializer
        elif self.action == 'sidebar':
            return SidebarModuleSerializer
        return SystemModuleDetailSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        if self.action in ['tree', 'sidebar']:
            return queryset.prefetch_related('tabs__sections').order_by('orden', 'name')
        return queryset.prefetch_related('dependencies', 'dependents')

    def perform_destroy(self, instance):
        """Validar antes de eliminar"""
        if instance.is_core:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('No se puede eliminar un modulo core')

        can_disable, reason = instance.can_disable()
        if not can_disable:
            from rest_framework.exceptions import ValidationError
            raise ValidationError(reason)

        instance.delete()

    @action(detail=True, methods=['patch'])
    def toggle(self, request, pk=None):
        """
        PATCH /api/core/system-modules/{id}/toggle/

        Activa o desactiva un modulo
        """
        module = self.get_object()
        is_enabled = request.data.get('is_enabled', not module.is_enabled)

        if not is_enabled:
            can_disable, reason = module.can_disable()
            if not can_disable:
                return Response(
                    {'error': reason or 'Este modulo no puede desactivarse'},
                    status=status.HTTP_400_BAD_REQUEST
                )

        if is_enabled:
            module.enable()
        else:
            # Ya verificamos que puede desactivarse, usar save directo
            module.is_enabled = False
            module.save(update_fields=['is_enabled'])

        return Response({
            'success': True,
            'message': f'Modulo {"activado" if is_enabled else "desactivado"} correctamente',
            'is_enabled': module.is_enabled
        })

    @action(detail=False, methods=['get'])
    def categories(self, request):
        """
        GET /api/core/system-modules/categories/

        Retorna las categorias disponibles
        """
        categories = [
            {'value': code, 'label': label}
            for code, label in SystemModule.CATEGORY_CHOICES
        ]
        return Response(categories)

    @action(detail=False, methods=['get'])
    def enabled(self, request):
        """
        GET /api/core/system-modules/enabled/

        Retorna los modulos habilitados
        """
        modules = SystemModule.objects.filter(is_enabled=True)
        return Response(SystemModuleListSerializer(modules, many=True).data)

    @action(detail=False, methods=['get'])
    def tree(self, request):
        """
        GET /api/core/system-modules/tree/

        Retorna el arbol completo de modulos con tabs y secciones
        """
        modules = self.get_queryset()

        # Estadisticas
        total = modules.count()
        enabled = modules.filter(is_enabled=True).count()

        # Categorias con conteo
        categories = []
        for cat_code, cat_name in SystemModule.CATEGORY_CHOICES:
            count = modules.filter(category=cat_code).count()
            categories.append({
                'code': cat_code,
                'name': cat_name,
                'modules_count': count
            })

        serializer = SystemModuleTreeSerializer(modules, many=True)

        return Response({
            'modules': serializer.data,
            'total_modules': total,
            'enabled_modules': enabled,
            'categories': categories
        })

    @action(detail=False, methods=['get'])
    def sidebar(self, request):
        """
        GET /api/core/system-modules/sidebar/

        Retorna módulos filtrados según permisos del usuario:
        - Super usuario: todos los módulos habilitados
        - Usuario normal: solo módulos/tabs/secciones autorizadas por su cargo

        Cada módulo tiene:
        - code, name, icon, color
        - route: ruta base del módulo
        - is_category: False (los módulos son navegables)
        - children: tabs habilitados del módulo
        - sections: (opcional) secciones para usuarios normales
        """
        user = request.user

        # Super usuario ve todo
        if user.is_superuser:
            return self._get_full_sidebar()

        # Usuario normal: filtrar por CargoSectionAccess
        cargo = getattr(user, 'cargo', None)
        if not cargo:
            # Usuario sin cargo no ve nada (no debería pasar por validación previa)
            return Response([])

        # Obtener section_ids autorizados para este cargo
        authorized_section_ids = set(
            CargoSectionAccess.objects.filter(cargo=cargo)
            .values_list('section_id', flat=True)
        )

        if not authorized_section_ids:
            # Sin secciones autorizadas = sidebar vacío
            return Response([])

        # Obtener tabs que contienen secciones autorizadas
        authorized_tab_ids = set(
            TabSection.objects.filter(
                id__in=authorized_section_ids,
                is_enabled=True
            ).values_list('tab_id', flat=True)
        )

        if not authorized_tab_ids:
            return Response([])

        # Obtener módulos que contienen tabs autorizados
        authorized_module_ids = set(
            ModuleTab.objects.filter(
                id__in=authorized_tab_ids,
                is_enabled=True
            ).values_list('module_id', flat=True)
        )

        if not authorized_module_ids:
            return Response([])

        # Construir sidebar filtrado con secciones incluidas
        modules = SystemModule.objects.filter(
            id__in=authorized_module_ids,
            is_enabled=True
        ).prefetch_related(
            Prefetch(
                'tabs',
                queryset=ModuleTab.objects.filter(
                    id__in=authorized_tab_ids,
                    is_enabled=True
                ).prefetch_related(
                    Prefetch(
                        'sections',
                        queryset=TabSection.objects.filter(
                            id__in=authorized_section_ids,
                            is_enabled=True
                        ).order_by('orden')
                    )
                ).order_by('orden')
            )
        ).order_by('orden', 'name')

        return self._build_sidebar_response(modules, include_sections=True)

    def _get_full_sidebar(self):
        """Retorna sidebar completo para super usuarios."""
        modules = SystemModule.objects.filter(
            is_enabled=True
        ).prefetch_related(
            Prefetch(
                'tabs',
                queryset=ModuleTab.objects.filter(is_enabled=True).order_by('orden')
            )
        ).order_by('orden', 'name')
        return self._build_sidebar_response(modules, include_sections=False)

    def _build_sidebar_response(self, modules, include_sections=False):
        """Construye la respuesta del sidebar."""
        result = []
        for module in modules:
            enabled_tabs = list(module.tabs.all())
            children = None
            module_effective_color = module.get_effective_color()

            if enabled_tabs:
                children = []
                for tab in enabled_tabs:
                    tab_data = {
                        'code': tab.code,
                        'name': tab.name,
                        'icon': tab.icon,
                        'color': module_effective_color,
                        'route': f"/{module.code.replace('_', '-')}/{tab.code.replace('_', '-')}",
                        'is_category': False,
                        'children': None
                    }

                    # Incluir secciones si es usuario normal (para filtrado adicional en frontend)
                    if include_sections and hasattr(tab, 'sections'):
                        sections = list(tab.sections.all())
                        if sections:
                            tab_data['sections'] = [
                                {
                                    'id': s.id,
                                    'code': s.code,
                                    'name': s.name
                                }
                                for s in sections
                            ]

                    children.append(tab_data)

            module_data = {
                'code': module.code,
                'name': module.name,
                'icon': module.icon,
                'color': module_effective_color,
                'route': f"/{module.code.replace('_', '-')}" if not children else None,
                'is_category': False,
                'children': children
            }
            result.append(module_data)

        return Response(result)


class ModuleTabViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestion de tabs de modulos

    Endpoints:
    - GET /api/core/module-tabs/ - Listar tabs
    - POST /api/core/module-tabs/ - Crear tab
    - GET /api/core/module-tabs/{id}/ - Detalle de tab
    - PATCH /api/core/module-tabs/{id}/ - Actualizar tab
    - DELETE /api/core/module-tabs/{id}/ - Eliminar tab
    - PATCH /api/core/module-tabs/{id}/toggle/ - Activar/desactivar tab
    """
    queryset = ModuleTab.objects.all()
    serializer_class = ModuleTabSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['module', 'is_enabled', 'is_core']
    search_fields = ['code', 'name', 'description']
    ordering = ['module__orden', 'orden', 'name']

    def get_queryset(self):
        queryset = ModuleTab.objects.prefetch_related('sections')
        module_id = self.request.query_params.get('module')
        if module_id:
            queryset = queryset.filter(module_id=module_id)
        return queryset.order_by('orden', 'name')

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return ModuleTabCreateSerializer
        elif self.action == 'toggle':
            return ToggleTabSerializer
        return ModuleTabSerializer

    @action(detail=True, methods=['patch'])
    def toggle(self, request, pk=None):
        """
        PATCH /api/core/module-tabs/{id}/toggle/

        Activa o desactiva un tab
        """
        tab = self.get_object()
        is_enabled = request.data.get('is_enabled', not tab.is_enabled)

        if not is_enabled:
            can_disable, reason = tab.can_disable()
            if not can_disable:
                return Response(
                    {'error': reason or 'Este tab no puede desactivarse'},
                    status=status.HTTP_400_BAD_REQUEST
                )

        if is_enabled:
            tab.enable()
        else:
            # Ya verificamos que puede desactivarse, usar save directo
            tab.is_enabled = False
            tab.save(update_fields=['is_enabled'])

        return Response({
            'success': True,
            'message': f'Tab {"activado" if is_enabled else "desactivado"} correctamente',
            'is_enabled': tab.is_enabled
        })


class TabSectionViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestion de secciones de tabs

    Endpoints:
    - GET /api/core/tab-sections/ - Listar secciones
    - POST /api/core/tab-sections/ - Crear seccion
    - GET /api/core/tab-sections/{id}/ - Detalle de seccion
    - PATCH /api/core/tab-sections/{id}/ - Actualizar seccion
    - DELETE /api/core/tab-sections/{id}/ - Eliminar seccion
    - PATCH /api/core/tab-sections/{id}/toggle/ - Activar/desactivar seccion
    """
    queryset = TabSection.objects.all()
    serializer_class = TabSectionSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['tab', 'is_enabled', 'is_core']
    search_fields = ['code', 'name', 'description']
    ordering = ['tab__orden', 'orden', 'name']

    def get_queryset(self):
        queryset = TabSection.objects.all()
        tab_id = self.request.query_params.get('tab')
        if tab_id:
            queryset = queryset.filter(tab_id=tab_id)
        return queryset.order_by('orden', 'name')

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return TabSectionCreateSerializer
        elif self.action == 'toggle':
            return ToggleSectionSerializer
        return TabSectionSerializer

    @action(detail=True, methods=['patch'])
    def toggle(self, request, pk=None):
        """
        PATCH /api/core/tab-sections/{id}/toggle/

        Activa o desactiva una seccion
        """
        section = self.get_object()
        is_enabled = request.data.get('is_enabled', not section.is_enabled)

        if not is_enabled:
            can_disable, reason = section.can_disable()
            if not can_disable:
                return Response(
                    {'error': reason or 'Esta seccion no puede desactivarse'},
                    status=status.HTTP_400_BAD_REQUEST
                )

        if is_enabled:
            section.enable()
        else:
            # Ya verificamos que puede desactivarse, usar save directo
            section.is_enabled = False
            section.save(update_fields=['is_enabled'])

        return Response({
            'success': True,
            'message': f'Seccion {"activada" if is_enabled else "desactivada"} correctamente',
            'is_enabled': section.is_enabled
        })


class BrandingConfigViewSet(viewsets.ModelViewSet):
    """
    ViewSet para Configuracion de Branding

    Endpoints:
    - GET /api/core/branding/ - Listar configuraciones
    - POST /api/core/branding/ - Crear configuracion
    - GET /api/core/branding/{id}/ - Detalle
    - PATCH /api/core/branding/{id}/ - Actualizar
    - DELETE /api/core/branding/{id}/ - Eliminar
    - GET /api/core/branding/active/ - Configuracion activa
    """

    queryset = BrandingConfig.objects.all()
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['is_active']
    ordering = ['-created_at']

    def get_serializer_class(self):
        if self.action == 'create':
            return BrandingConfigCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return BrandingConfigUpdateSerializer
        return BrandingConfigSerializer

    def partial_update(self, request, *args, **kwargs):
        """Override para debugging de errores 400"""
        import logging
        logger = logging.getLogger(__name__)
        logger.info(f"[BRANDING DEBUG] Request data: {request.data}")
        logger.info(f"[BRANDING DEBUG] Content-Type: {request.content_type}")

        serializer = self.get_serializer(
            self.get_object(),
            data=request.data,
            partial=True
        )
        if not serializer.is_valid():
            logger.error(f"[BRANDING DEBUG] Validation errors: {serializer.errors}")

        return super().partial_update(request, *args, **kwargs)

    @action(detail=False, methods=['get'], permission_classes=[AllowAny])
    def active(self, request):
        """
        GET /api/core/branding/active/

        Retorna la configuracion de branding activa.
        Retorna 404 si no hay configuracion activa (el frontend usa defaults locales).

        NOTA: Este endpoint es publico (sin autenticacion) porque el branding
        se necesita en la pagina de login, antes de que el usuario se autentique.
        """
        branding = BrandingConfig.objects.filter(is_active=True).first()
        if not branding:
            # Retornar 404 para que el frontend use sus defaults locales
            # Esto es consistente con corporate-identity/active/
            return Response(
                {'detail': 'No hay configuracion de branding activa'},
                status=status.HTTP_404_NOT_FOUND
            )
        # Pasar request al context para construir URLs absolutas de media
        serializer = BrandingConfigSerializer(branding, context={'request': request})
        return Response(serializer.data)


# NOTA: ConsecutivoConfigViewSet fue migrado a apps.gestion_estrategica.organizacion.views
# Los consecutivos ahora estan disponibles en /api/organizacion/consecutivos/


# =============================================================================
# ESTADISTICAS DE GESTION ESTRATEGICA
# =============================================================================

class StrategicStatsViewSet(viewsets.ViewSet):
    """
    ViewSet para estadisticas de Direccion Estrategica

    Endpoints:
    - GET /api/core/strategic/ - Estadisticas generales (list)
    - GET /api/core/strategic/stats/ - Alias para estadisticas
    """

    permission_classes = [IsAuthenticated]

    def list(self, request):
        """
        GET /api/core/strategic/

        Retorna estadisticas de valor para Direccion Estrategica:
        1. Completitud del Sistema (%)
        2. Objetivos Estrategicos (cumplidos/total, en riesgo)
        3. Control de Acceso RBAC (usuarios con/sin roles)
        4. Identidad Corporativa (estado de firma)
        """
        return self._get_stats(request)

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """
        GET /api/core/strategic/stats/

        Alias para el metodo list
        """
        return self._get_stats(request)

    def _get_stats(self, request):
        """
        Metodo interno para obtener estadisticas
        """
        User = get_user_model()

        # === 1. DATOS BASE ===
        active_identity = CorporateIdentity.objects.filter(is_active=True).first()
        active_plan = StrategicPlan.objects.filter(is_active=True).first()

        # === 2. OBJETIVOS ESTRATEGICOS ===
        total_objs = 0
        completed_objs = 0
        in_progress_objs = 0
        at_risk_objs = 0
        avg = 0

        if active_plan:
            plan_objectives = StrategicObjective.objects.filter(
                plan=active_plan, is_active=True
            )
            total_objs = plan_objectives.count()
            completed_objs = plan_objectives.filter(status='COMPLETADO').count()
            in_progress_objs = plan_objectives.filter(status='EN_PROGRESO').count()
            # Objetivos en riesgo: retrasados o con progreso <30%
            at_risk_objs = plan_objectives.filter(status='RETRASADO').count()
            at_risk_objs += plan_objectives.filter(
                status='EN_PROGRESO', progress__lt=30
            ).count()

            progress_values = list(plan_objectives.values_list('progress', flat=True))
            avg = sum(progress_values) / len(progress_values) if progress_values else 0

        # === 3. CONTROL DE ACCESO (RBAC) ===
        total_users = User.objects.filter(is_active=True).count()
        # Usuarios con al menos un rol asignado (via user_roles relation)
        users_with_roles = User.objects.filter(
            is_active=True, user_roles__isnull=False
        ).distinct().count()
        users_without_roles = total_users - users_with_roles
        total_roles = Role.objects.filter(is_active=True).count()
        total_cargos = Cargo.objects.filter(is_active=True).count()

        # === 4. CONFIGURACION ===
        enabled_modules = SystemModule.objects.filter(is_enabled=True).count()
        total_modules = SystemModule.objects.count()

        # === 5. COMPLETITUD DEL SISTEMA ===
        has_identity = active_identity is not None
        has_organization = total_cargos >= 1 and total_roles >= 1
        has_plan = active_plan is not None
        has_config = enabled_modules >= 1

        # Calcular porcentaje (25% por cada seccion)
        completeness_score = 0
        if has_identity:
            completeness_score += 25
        if has_organization:
            completeness_score += 25
        if has_plan:
            completeness_score += 25
        if has_config:
            completeness_score += 25

        stats = {
            # 1. Completitud del Sistema
            'system_completeness': completeness_score,
            'completeness_details': {
                'has_identity': has_identity,
                'has_organization': has_organization,
                'has_plan': has_plan,
                'has_config': has_config,
            },

            # 2. Objetivos Estrategicos
            'total_objectives': total_objs,
            'completed_objectives': completed_objs,
            'in_progress_objectives': in_progress_objs,
            'at_risk_objectives': at_risk_objs,
            'avg_progress': round(avg, 1),
            'active_plan_name': active_plan.name if active_plan else None,

            # 3. Control de Acceso (RBAC)
            'total_users': total_users,
            'users_with_roles': users_with_roles,
            'users_without_roles': users_without_roles,
            'total_roles': total_roles,
            'total_cargos': total_cargos,

            # 4. Identidad Corporativa
            'has_active_identity': has_identity,
            'identity_is_signed': active_identity.is_signed if active_identity else False,
            'identity_version': active_identity.version if active_identity else 0,
            'values_count': active_identity.values.filter(is_active=True).count() if active_identity else 0,
            'policy_pending_signature': has_identity and not active_identity.is_signed,

            # Configuracion del sistema
            'enabled_modules': enabled_modules,
            'total_modules': total_modules,
        }

        return Response(stats)
