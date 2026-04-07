"""
ViewSets para Configuración del Sistema (Tab 4)
Sistema de Gestión StrateKaz

Este módulo contiene SOLO ViewSets que usan modelos de core,
sin dependencias de otras apps. Esto permite que core funcione
de forma independiente en el sistema modular.

Incluye:
- SystemModuleViewSet
- ModuleTabViewSet
- TabSectionViewSet

NOTA: BrandingConfigViewSet fue ELIMINADO - el branding se maneja ahora
directamente en el modelo Tenant (apps.tenant.models.Tenant)
Ver: /api/tenant/public/branding/ para endpoint público de branding
"""
import logging
from rest_framework import viewsets, status, filters

logger = logging.getLogger(__name__)
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from apps.core.permissions import GranularActionPermission
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Prefetch
from apps.core.utils.impersonation import get_effective_user

# Modelos de core (sin dependencias externas)
from .models import (
    SystemModule, ModuleTab, TabSection,
    CargoSectionAccess  # RBAC v3.3: Filtrado por cargo
)

# Serializers de configuración (sin dependencias externas)
from .serializers_config import (
    SystemModuleListSerializer, SystemModuleDetailSerializer,
    SystemModuleCreateSerializer, SystemModuleUpdateSerializer,
    SystemModuleTreeSerializer, ToggleModuleSerializer,
    ModuleTabSerializer, ModuleTabCreateSerializer, ToggleTabSerializer,
    TabSectionSerializer, TabSectionCreateSerializer, ToggleSectionSerializer,
    SidebarModuleSerializer,
)


# =============================================================================
# SIDEBAR: Cascada V2 — 11 capas visuales (14 niveles lógicos)
# Orden = lógica de empresa colombiana (Planear → Hacer → Verificar → Actuar)
# Frontend Sidebar.tsx renderiza en el orden recibido del backend.
# Capas con 1 módulo → render directo (sin wrapper).
# Capas con 2+ módulos → is_category: True (grupo expandible).
# Fuente de verdad: docs/01-arquitectura/ARQUITECTURA-CASCADA-V2.md
# =============================================================================
SIDEBAR_LAYERS = [
    # ═══════════════════════════════════════════════════════════════
    # PLANEAR (P) — Constituir, documentar, vincular, planificar
    # ═══════════════════════════════════════════════════════════════
    {
        'code': 'NIVEL_FUNDACION',
        'name': 'Fundación',
        'icon': 'Landmark',
        'color': '#3B82F6',
        'phase': 'PLANEAR',
        'module_codes': ['fundacion'],
    },
    {
        # Gestión Documental = infraestructura transversal
        'code': 'NIVEL_INFRAESTRUCTURA',
        'name': 'Infraestructura',
        'icon': 'FileText',
        'color': '#6366F1',
        'phase': 'PLANEAR',
        'module_codes': ['gestion_documental'],
    },
    {
        'code': 'NIVEL_EQUIPO',
        'name': 'Gestión de Personas',
        'icon': 'UserPlus',
        'color': '#0EA5E9',
        'phase': 'PLANEAR',
        'module_codes': ['mi_equipo'],
    },
    {
        # Planificación Operativa + Planeación Estratégica
        'code': 'NIVEL_PLANIFICACION',
        'name': 'Planificación',
        'icon': 'Target',
        'color': '#6366F1',
        'phase': 'PLANEAR',
        'module_codes': ['planificacion_operativa', 'planeacion_estrategica'],
    },
    # ═══════════════════════════════════════════════════════════════
    # HACER (H) — Proteger, operar, gestionar talento, soportar
    # ═══════════════════════════════════════════════════════════════
    {
        'code': 'NIVEL_PROTECCION',
        'name': 'Protección y Cumplimiento',
        'icon': 'ShieldCheck',
        'color': '#F59E0B',
        'phase': 'HACER',
        'module_codes': ['proteccion_cumplimiento'],
    },
    {
        'code': 'NIVEL_HSEQ',
        'name': 'Gestión Integral',
        'icon': 'Shield',
        'color': '#10B981',
        'phase': 'HACER',
        'module_codes': ['gestion_integral'],
    },
    {
        'code': 'NIVEL_CADENA',
        'name': 'Cadena de Valor',
        'icon': 'Package',
        'color': '#10B981',
        'phase': 'HACER',
        'module_codes': [
            'supply_chain', 'production_ops',
            'logistics_fleet', 'sales_crm',
        ],
    },
    {
        'code': 'NIVEL_TALENTO',
        'name': 'Gestión del Talento',
        'icon': 'GraduationCap',
        'color': '#8B5CF6',
        'phase': 'HACER',
        'module_codes': ['talent_hub'],
    },
    {
        'code': 'NIVEL_SOPORTE',
        'name': 'Soporte',
        'icon': 'Building2',
        'color': '#F59E0B',
        'phase': 'HACER',
        'module_codes': ['administracion', 'tesoreria', 'accounting'],
    },
    # ═══════════════════════════════════════════════════════════════
    # VERIFICAR + ACTUAR (V/A) — Medir, revisar, mejorar
    # ═══════════════════════════════════════════════════════════════
    {
        'code': 'NIVEL_INTELIGENCIA',
        'name': 'Inteligencia',
        'icon': 'BarChart3',
        'color': '#8B5CF6',
        'phase': 'VERIFICAR_ACTUAR',
        'module_codes': ['analytics', 'revision_direccion', 'acciones_mejora', 'audit_system'],
    },
    # ═══════════════════════════════════════════════════════════════
    # TRANSVERSAL — Workflows (motor de ejecución) + Configuración
    # ═══════════════════════════════════════════════════════════════
    {
        'code': 'NIVEL_WORKFLOWS',
        'name': 'Flujos de Trabajo',
        'icon': 'Workflow',
        'color': '#0891B2',
        'phase': 'TRANSVERSAL',
        'module_codes': ['workflow_engine'],
    },
    {
        'code': 'NIVEL_CONFIG',
        'name': 'Configuración',
        'icon': 'Settings',
        'color': '#64748B',
        'phase': 'TRANSVERSAL',
        'module_codes': ['configuracion_plataforma'],
    },
]


# =============================================================================
# TAB 4: CONFIGURACIÓN (SOLO MODELOS DE CORE)
# =============================================================================

class SystemModuleViewSet(viewsets.ModelViewSet):
    """
    ViewSet para Módulos del Sistema

    Endpoints:
    - GET /api/core/system-modules/ - Listar módulos
    - POST /api/core/system-modules/ - Crear módulo
    - GET /api/core/system-modules/{id}/ - Detalle de módulo
    - PATCH /api/core/system-modules/{id}/ - Actualizar módulo
    - DELETE /api/core/system-modules/{id}/ - Eliminar módulo
    - PATCH /api/core/system-modules/{id}/toggle/ - Activar/Desactivar
    - GET /api/core/system-modules/categories/ - Categorías disponibles
    - GET /api/core/system-modules/enabled/ - Módulos habilitados
    - GET /api/core/system-modules/tree/ - Árbol completo con tabs y secciones
    - GET /api/core/system-modules/sidebar/ - Versión compacta para sidebar
    """

    queryset = SystemModule.objects.all()
    permission_classes = [IsAuthenticated, GranularActionPermission]
    section_code = 'modulos'

    granular_action_map = {
        'toggle': 'can_edit',
        'dependents': 'can_view',  # MM-003: Ver dependencias antes de desactivar
    }

    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category', 'is_enabled', 'is_core', 'requires_license']
    search_fields = ['code', 'name', 'description']
    ordering = ['category', 'orden', 'name']

    def get_permissions(self):
        """
        Personalizar permisos por acción
        
        'sidebar' y 'tree': 
        - Deben ser accesibles para cualquier usuario autenticado.
        - La vista se encarga de filtrar el contenido según los permisos del usuario via CargoSectionAccess.
        - No deben usar GranularActionPermission porque este valida acceso a la configuración de 'modulos',
          lo cual bloquearía a los usuarios normales.
        """
        if self.action in ['sidebar', 'tree', 'categories', 'enabled']:
            return [IsAuthenticated()]
        return super().get_permissions()

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

        # Filtrar por módulos licenciados del tenant (Admin Global → Tenant.enabled_modules)
        # Aplica a list, retrieve, toggle, etc. — NO a sidebar/tree (tienen su propio filtro)
        if self.action not in ['sidebar', 'tree']:
            effective_modules = self._get_tenant_effective_modules()
            if effective_modules:
                queryset = queryset.filter(code__in=effective_modules)
            return queryset.prefetch_related('dependencies', 'dependents')

        return queryset.prefetch_related('tabs__sections').order_by('orden', 'name')

    def perform_destroy(self, instance):
        """Validar antes de eliminar"""
        if instance.is_core:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('No se puede eliminar un módulo core')

        can_disable, reason = instance.can_disable()
        if not can_disable:
            from rest_framework.exceptions import ValidationError
            raise ValidationError(reason)

        instance.delete()

    @action(detail=True, methods=['patch'])
    def toggle(self, request, pk=None):
        """PATCH /api/core/system-modules/{id}/toggle/"""
        module = self.get_object()
        is_enabled = request.data.get('is_enabled', not module.is_enabled)

        if not is_enabled:
            can_disable, reason = module.can_disable()
            if not can_disable:
                return Response(
                    {'error': reason or 'Este módulo no puede desactivarse'},
                    status=status.HTTP_400_BAD_REQUEST
                )

        if is_enabled:
            module.enable()
        else:
            module.is_enabled = False
            module.save(update_fields=['is_enabled'])

        response_data = {
            'success': True,
            'message': f'Módulo {"activado" if is_enabled else "desactivado"} correctamente',
            'is_enabled': module.is_enabled,
        }

        # Incluir advertencia si aplica (ej: workflow_engine afecta firmas)
        if not is_enabled:
            warning = module.get_disable_warning()
            if warning:
                response_data['warning'] = warning

        return Response(response_data)

    @action(detail=True, methods=['get'])
    def dependents(self, request, pk=None):
        """
        GET /api/core/system-modules/{id}/dependents/

        MM-003: Retorna los módulos que dependen de este módulo.
        Útil para mostrar feedback antes de desactivar.
        """
        module = self.get_object()

        # Obtener módulos que dependen de este (y están habilitados)
        enabled_dependents = module.dependents.filter(is_enabled=True)
        all_dependents = module.dependents.all()

        # También incluir tabs y secciones que pertenecen a este módulo
        tabs_count = module.tabs.count()
        enabled_tabs_count = module.tabs.filter(is_enabled=True).count()
        sections_count = sum(tab.sections.count() for tab in module.tabs.all())
        enabled_sections_count = sum(
            tab.sections.filter(is_enabled=True).count()
            for tab in module.tabs.all()
        )

        return Response({
            'module_id': module.id,
            'module_name': module.name,
            'module_code': module.code,
            'is_core': module.is_core,
            'can_disable': not module.is_core and not enabled_dependents.exists(),
            'dependents': {
                'enabled': [
                    {'id': d.id, 'name': d.name, 'code': d.code}
                    for d in enabled_dependents
                ],
                'all': [
                    {'id': d.id, 'name': d.name, 'code': d.code, 'is_enabled': d.is_enabled}
                    for d in all_dependents
                ],
            },
            'children': {
                'tabs': {
                    'total': tabs_count,
                    'enabled': enabled_tabs_count,
                },
                'sections': {
                    'total': sections_count,
                    'enabled': enabled_sections_count,
                },
            },
            'warning_message': self._get_disable_warning(module, enabled_dependents),
        })

    def _get_disable_warning(self, module, enabled_dependents):
        """Genera mensaje de advertencia para desactivar módulo"""
        if module.is_core:
            return "Este es un módulo core del sistema y no puede desactivarse."

        if enabled_dependents.exists():
            names = ", ".join(enabled_dependents.values_list('name', flat=True))
            return f"Los siguientes módulos dependen de este y serán afectados: {names}"

        tabs_count = module.tabs.filter(is_enabled=True).count()
        if tabs_count > 0:
            return f"Al desactivar este módulo, {tabs_count} tab(s) y sus secciones también serán desactivados."

        return None

    @action(detail=False, methods=['get'])
    def categories(self, request):
        """GET /api/core/system-modules/categories/"""
        categories = [
            {'value': code, 'label': label}
            for code, label in SystemModule.CATEGORY_CHOICES
        ]
        return Response(categories)

    @action(detail=False, methods=['get'])
    def enabled(self, request):
        """GET /api/core/system-modules/enabled/"""
        modules = SystemModule.objects.filter(is_enabled=True)
        return Response(SystemModuleListSerializer(modules, many=True).data)

    @action(detail=False, methods=['get'])
    def tree(self, request):
        """
        GET /api/core/system-modules/tree/

        RBAC v3.3: Retorna árbol de módulos filtrado según permisos del usuario:
        - Super usuario: todos los módulos/tabs/secciones
        - Usuario normal: solo módulos/tabs/secciones autorizadas por su cargo

        El filtrado es GRANULAR a nivel de sección.
        """
        try:
            return self._tree_inner(request)
        except Exception as e:
            logger.error(f'tree error: {type(e).__name__}: {e}', exc_info=True)
            return Response(
                {'error': f'Error cargando árbol de módulos: {type(e).__name__}: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def _tree_inner(self, request):
        """Lógica interna del tree, envuelta en try/except en tree()."""
        user = get_effective_user(request)

        # Super usuario ve todo
        # Usar getattr porque TenantUser no tiene is_superuser, pero User sí
        is_superuser = getattr(user, 'is_superuser', False) or getattr(user, 'is_superadmin', False)
        if is_superuser:
            return self._get_full_tree()

        # Usuario normal: filtrar por CargoSectionAccess
        cargo = getattr(user, 'cargo', None)
        if not cargo:
            return Response({
                'modules': [],
                'total_modules': 0,
                'enabled_modules': 0,
                'categories': [],
                'layers': self._get_layers_config(),
            })

        # Obtener section_ids autorizados para este cargo (SOLO can_view=True)
        authorized_section_ids = set(
            CargoSectionAccess.objects.filter(cargo=cargo, can_view=True)
            .values_list('section_id', flat=True)
        )

        if not authorized_section_ids:
            return Response({
                'modules': [],
                'total_modules': 0,
                'enabled_modules': 0,
                'categories': [],
                'layers': self._get_layers_config(),
            })

        # Excluir secciones restringidas a superadmin (ej: 'modulos')
        superadmin_only_sections = set(
            TabSection.objects.filter(code__in=['modulos'])
            .values_list('id', flat=True)
        )
        authorized_section_ids -= superadmin_only_sections

        if not authorized_section_ids:
            return Response({
                'modules': [],
                'total_modules': 0,
                'enabled_modules': 0,
                'categories': [],
                'layers': self._get_layers_config(),
            })

        return self._get_filtered_tree(authorized_section_ids)

    def _get_layers_config(self):
        """Retorna SIDEBAR_LAYERS para que el Dashboard agrupe módulos."""
        return [
            {
                'code': layer['code'],
                'name': layer['name'],
                'icon': layer['icon'],
                'color': layer['color'],
                'phase': layer.get('phase', ''),
                'module_codes': layer['module_codes'],
            }
            for layer in SIDEBAR_LAYERS
        ]

    def _get_full_tree(self):
        """
        Retorna árbol completo para super usuarios.

        Filtra por Tenant.effective_modules si está configurado.
        """
        # Obtener módulos permitidos por el tenant
        effective_modules = self._get_tenant_effective_modules()

        # Base queryset
        modules = self.get_queryset()

        # Aplicar filtro de effective_modules si existe
        if effective_modules:
            modules = modules.filter(code__in=effective_modules)

        total = modules.count()
        enabled = modules.filter(is_enabled=True).count()

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
            'categories': categories,
            'layers': self._get_layers_config(),
        })

    def _get_filtered_tree(self, authorized_section_ids):
        """Retorna árbol filtrado por secciones autorizadas."""
        # Obtener tabs que contienen secciones autorizadas
        authorized_tab_ids = set(
            TabSection.objects.filter(
                id__in=authorized_section_ids
            ).values_list('tab_id', flat=True)
        )

        # Obtener módulos que contienen tabs autorizados
        authorized_module_ids = set(
            ModuleTab.objects.filter(
                id__in=authorized_tab_ids
            ).values_list('module_id', flat=True)
        )

        # Cargar módulos con prefetch filtrado
        modules = SystemModule.objects.filter(
            id__in=authorized_module_ids
        ).prefetch_related(
            Prefetch(
                'tabs',
                queryset=ModuleTab.objects.filter(
                    id__in=authorized_tab_ids
                ).prefetch_related(
                    Prefetch(
                        'sections',
                        queryset=TabSection.objects.filter(
                            id__in=authorized_section_ids
                        ).order_by('orden')
                    )
                ).order_by('orden')
            )
        ).order_by('orden', 'name')

        total = modules.count()
        enabled = modules.filter(is_enabled=True).count()

        categories = []
        for cat_code, cat_name in SystemModule.CATEGORY_CHOICES:
            count = modules.filter(category=cat_code).count()
            if count > 0:
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
            'categories': categories,
            'layers': self._get_layers_config(),
        })

    @action(detail=False, methods=['get'])
    def sidebar(self, request):
        """
        GET /api/core/system-modules/sidebar/

        RBAC v3.3: Retorna módulos filtrados según permisos del usuario:
        - Super usuario: todos los módulos habilitados
        - Usuario normal: solo módulos/tabs/secciones autorizadas por su cargo
        """
        try:
            return self._sidebar_inner(request)
        except Exception as e:
            logger.error(f'sidebar error: {type(e).__name__}: {e}', exc_info=True)
            return Response(
                {'error': f'Error cargando sidebar: {type(e).__name__}: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def _sidebar_inner(self, request):
        user = get_effective_user(request)

        # Super usuario ve todo
        # Usar getattr porque TenantUser no tiene is_superuser, pero User sí
        is_superuser = getattr(user, 'is_superuser', False) or getattr(user, 'is_superadmin', False)
        if is_superuser:
            return self._get_full_sidebar()

        # Usuario normal: filtrar por Cargo + RolAdicional + Group (lógica OR)
        from apps.core.utils.rbac import compute_user_rbac

        section_ids, _permission_codes = compute_user_rbac(user)

        if not section_ids:
            return Response([])

        authorized_section_ids = set(section_ids)

        # Excluir secciones restringidas a superadmin (ej: 'modulos')
        superadmin_only_sections = TabSection.objects.filter(
            code__in=['modulos']
        ).values_list('id', flat=True)
        authorized_section_ids -= set(superadmin_only_sections)

        if not authorized_section_ids:
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

    def _get_tenant_effective_modules(self):
        """
        Obtiene los módulos efectivos del tenant actual.

        FLUJO DE CONTROL DE MÓDULOS:
        1. Admin Global configura Tenant.enabled_modules (o hereda de Plan.features)
        2. Tenant.effective_modules retorna la lista de códigos de módulos permitidos
        3. El sidebar filtra SystemModule.code IN effective_modules

        Retorna None si no hay restricción (mostrar todos los módulos habilitados).
        """
        from django.db import connection

        # Si estamos en schema 'public', no hay restricción
        if connection.schema_name == 'public':
            return None

        # Obtener el tenant actual desde connection
        tenant = getattr(connection, 'tenant', None)
        if not tenant:
            return None

        # Obtener effective_modules (propiedad del modelo Tenant)
        # Retorna: lista con códigos = filtrar, lista vacía = sin módulos, None no ocurre
        effective_modules = getattr(tenant, 'effective_modules', None)

        # None = propiedad no existe (edge case) → sin restricción
        if effective_modules is None:
            return None

        # Lista vacía [] = ni tenant ni plan tienen módulos → sin restricción (fallback)
        # Lista con contenido = filtrar a esos módulos
        if not effective_modules:
            return None

        return effective_modules

    def _get_full_sidebar(self):
        """
        Retorna sidebar completo para super usuarios.

        Filtra por:
        1. SystemModule.is_enabled = True (configuración del schema)
        2. SystemModule.code IN Tenant.effective_modules (control desde Admin Global)
        """
        # Obtener módulos permitidos por el tenant
        effective_modules = self._get_tenant_effective_modules()

        # Base queryset: módulos habilitados en el schema
        queryset = SystemModule.objects.filter(is_enabled=True)

        # Aplicar filtro de effective_modules si existe
        if effective_modules:
            queryset = queryset.filter(code__in=effective_modules)

        modules = queryset.prefetch_related(
            Prefetch(
                'tabs',
                queryset=ModuleTab.objects.filter(is_enabled=True).order_by('orden')
            )
        ).order_by('orden', 'name')

        return self._build_sidebar_response(modules, include_sections=False)

    def _build_sidebar_response(self, modules, include_sections=False):
        """
        Construye la respuesta del sidebar agrupada por capas (C1/C2/C3).

        Estructura:
        [
          {is_category: True, code: 'NIVEL_C1', name: 'Fundación', children: [módulos...]},
          {is_category: True, code: 'NIVEL_C2', name: 'Módulos de Negocio', children: [módulos...]},
          {is_category: True, code: 'NIVEL_C3', name: 'Inteligencia', children: [módulos...]},
        ]
        """
        # 1. Serializar módulos a dicts
        module_dicts = {}
        for module in modules:
            enabled_tabs = list(module.tabs.all())
            children = None
            module_effective_color = module.get_effective_color()
            module_route_segment = (module.route or module.code.replace('_', '-')).lstrip('/')

            if enabled_tabs:
                children = []
                for tab in enabled_tabs:
                    tab_route_segment = (tab.route or tab.code.replace('_', '-')).lstrip('/')
                    tab_data = {
                        'code': tab.code,
                        'name': tab.name,
                        'icon': tab.icon,
                        'color': module_effective_color,
                        'route': f"/{module_route_segment}/{tab_route_segment}",
                        'is_category': False,
                        'children': None
                    }

                    if include_sections and hasattr(tab, 'sections'):
                        sections = list(tab.sections.all())
                        if sections:
                            tab_data['sections'] = [
                                {'id': s.id, 'code': s.code, 'name': s.name}
                                for s in sections
                            ]

                    children.append(tab_data)

            # Flatten single-tab modules: direct link instead of expandable
            if children and len(children) == 1:
                module_route = children[0]['route']
                children = None
            else:
                module_route = f"/{module_route_segment}" if not children else None

            module_data = {
                'code': module.code,
                'name': module.name,
                'icon': module.icon,
                'color': module_effective_color,
                'route': module_route,
                'is_category': False,
                'children': children
            }
            module_dicts[module.code] = module_data

        # 2. Agrupar en capas (SIDEBAR_LAYERS)
        result = []
        assigned_codes = set()

        for layer in SIDEBAR_LAYERS:
            layer_children = []
            for mc in layer['module_codes']:
                if mc in module_dicts:
                    layer_children.append(module_dicts[mc])
                    assigned_codes.add(mc)

            # Solo incluir capas con ≥1 módulo visible
            if layer_children:
                if len(layer_children) == 1:
                    # Capa con 1 solo módulo → render directo sin wrapper redundante
                    result.append(layer_children[0])
                else:
                    result.append({
                        'code': layer['code'],
                        'name': layer['name'],
                        'icon': layer['icon'],
                        'color': layer['color'],
                        'route': None,
                        'is_category': True,
                        'children': layer_children,
                    })

        # 3. Módulos huérfanos (no asignados a ninguna capa) → al final
        for code, mod_data in module_dicts.items():
            if code not in assigned_codes:
                result.append(mod_data)

        return Response(result)


class ModuleTabViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión de tabs de módulos.

    RBAC v3.3: Protegido con GranularActionPermission (P0-05)
    Requiere permisos en sección 'modulos' para operaciones CRUD.
    """
    queryset = ModuleTab.objects.all()
    serializer_class = ModuleTabSerializer
    permission_classes = [IsAuthenticated, GranularActionPermission]
    section_code = 'modulos'

    # P0-05: Mapeo de acciones custom a permisos RBAC
    granular_action_map = {
        'toggle': 'can_edit',
    }
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
        """PATCH /api/core/module-tabs/{id}/toggle/"""
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
            tab.is_enabled = False
            tab.save(update_fields=['is_enabled'])

        return Response({
            'success': True,
            'message': f'Tab {"activado" if is_enabled else "desactivado"} correctamente',
            'is_enabled': tab.is_enabled
        })


class TabSectionViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión de secciones de tabs.

    RBAC v3.3: Protegido con GranularActionPermission (P0-05)
    Requiere permisos en sección 'modulos' para operaciones CRUD.
    """
    queryset = TabSection.objects.all()
    serializer_class = TabSectionSerializer
    permission_classes = [IsAuthenticated, GranularActionPermission]
    section_code = 'modulos'

    # P0-05: Mapeo de acciones custom a permisos RBAC
    granular_action_map = {
        'toggle': 'can_edit',
    }
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
        """PATCH /api/core/tab-sections/{id}/toggle/"""
        section = self.get_object()
        is_enabled = request.data.get('is_enabled', not section.is_enabled)

        if not is_enabled:
            can_disable, reason = section.can_disable()
            if not can_disable:
                return Response(
                    {'error': reason or 'Esta sección no puede desactivarse'},
                    status=status.HTTP_400_BAD_REQUEST
                )

        if is_enabled:
            section.enable()
        else:
            section.is_enabled = False
            section.save(update_fields=['is_enabled'])

        return Response({
            'success': True,
            'message': f'Sección {"activada" if is_enabled else "desactivada"} correctamente',
            'is_enabled': section.is_enabled
        })
