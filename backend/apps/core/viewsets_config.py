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
- BrandingConfigViewSet
"""
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from apps.core.permissions import GranularActionPermission
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Prefetch

# Modelos de core (sin dependencias externas)
from .models import (
    SystemModule, ModuleTab, TabSection, BrandingConfig,
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
    BrandingConfigSerializer, BrandingConfigCreateSerializer, BrandingConfigUpdateSerializer,
)


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
        if self.action in ['tree', 'sidebar']:
            return queryset.prefetch_related('tabs__sections').order_by('orden', 'name')
        return queryset.prefetch_related('dependencies', 'dependents')

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

        return Response({
            'success': True,
            'message': f'Módulo {"activado" if is_enabled else "desactivado"} correctamente',
            'is_enabled': module.is_enabled
        })

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
        user = request.user

        # Super usuario ve todo
        if user.is_superuser:
            return self._get_full_tree()

        # Usuario normal: filtrar por CargoSectionAccess
        cargo = getattr(user, 'cargo', None)
        if not cargo:
            return Response({
                'modules': [],
                'total_modules': 0,
                'enabled_modules': 0,
                'categories': []
            })

        # Obtener section_ids autorizados para este cargo
        authorized_section_ids = set(
            CargoSectionAccess.objects.filter(cargo=cargo)
            .values_list('section_id', flat=True)
        )

        if not authorized_section_ids:
            return Response({
                'modules': [],
                'total_modules': 0,
                'enabled_modules': 0,
                'categories': []
            })

        return self._get_filtered_tree(authorized_section_ids)

    def _get_full_tree(self):
        """Retorna árbol completo para super usuarios."""
        modules = self.get_queryset()
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
            'categories': categories
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
            'categories': categories
        })

    @action(detail=False, methods=['get'])
    def sidebar(self, request):
        """
        GET /api/core/system-modules/sidebar/

        RBAC v3.3: Retorna módulos filtrados según permisos del usuario:
        - Super usuario: todos los módulos habilitados
        - Usuario normal: solo módulos/tabs/secciones autorizadas por su cargo
        """
        user = request.user

        # Super usuario ve todo
        if user.is_superuser:
            return self._get_full_sidebar()

        # Usuario normal: filtrar por CargoSectionAccess
        cargo = getattr(user, 'cargo', None)
        if not cargo:
            # Usuario sin cargo no ve nada
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

            # Usar campo route del modelo, o generar desde code como fallback
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
                'route': f"/{module_route_segment}" if not children else None,
                'is_category': False,
                'children': children
            }
            result.append(module_data)

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


class BrandingConfigViewSet(viewsets.ModelViewSet):
    """ViewSet para Configuración de Branding"""

    queryset = BrandingConfig.objects.all()
    permission_classes = [IsAuthenticated, GranularActionPermission]
    section_code = 'branding'

    granular_action_map = {
        'active': 'can_view', # Aunque AllowAny sobreescribe esto
    }
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
        Retorna la configuración de branding activa (público para login page).

        Fuentes de branding:
        1. Multi-tenant: BrandingConfig de la BD del tenant + datos básicos del Tenant
        2. Fallback: BrandingConfig de BD master
        """
        import logging
        logger = logging.getLogger(__name__)

        # Verificar si hay tenant activo (multi-tenant mode)
        tenant = getattr(request, 'tenant', None)

        if tenant:
            # Modo multi-tenant: usar BrandingConfig de la BD del tenant
            try:
                branding = BrandingConfig.objects.filter(is_active=True).first()

                if branding:
                    serializer = BrandingConfigSerializer(branding, context={'request': request})
                    data = serializer.data
                    # Sobrescribir con datos del Tenant si existen
                    if tenant.primary_color:
                        data['primary_color'] = tenant.primary_color
                    if tenant.logo_url:
                        data['logo'] = tenant.logo_url
                    if tenant.name:
                        data['company_name'] = tenant.name
                    return Response(data)
            except Exception as e:
                logger.warning(f"Error obteniendo branding de tenant: {e}")

        # Fallback: usar BrandingConfig de BD master
        branding = BrandingConfig.objects.filter(is_active=True).first()
        if not branding:
            return Response(
                {'detail': 'No hay configuración de branding activa'},
                status=status.HTTP_404_NOT_FOUND
            )
        serializer = BrandingConfigSerializer(branding, context={'request': request})
        return Response(serializer.data)

    @action(detail=False, methods=['get'], permission_classes=[AllowAny])
    def manifest(self, request):
        """
        GET /api/core/branding/manifest/

        MB-001: Retorna manifest.json dinámico para PWA.
        Fuente única: BrandingConfig + override de Tenant.primary_color si aplica.
        """
        import logging
        logger = logging.getLogger(__name__)

        tenant = getattr(request, 'tenant', None)
        branding = BrandingConfig.objects.filter(is_active=True).first()

        if not branding:
            # Fallback mínimo sin branding configurado
            manifest = {
                "name": "StrateKaz",
                "short_name": "StrateKaz",
                "description": "Sistema de Gestión Empresarial",
                "start_url": "/",
                "display": "standalone",
                "background_color": "#ffffff",
                "theme_color": "#16A34A",
                "icons": []
            }
        else:
            # Construir iconos desde BrandingConfig
            icons = []

            if branding.pwa_icon_192:
                icons.append({
                    "src": request.build_absolute_uri(branding.pwa_icon_192.url),
                    "sizes": "192x192",
                    "type": "image/png",
                    "purpose": "any"
                })

            if branding.pwa_icon_512:
                icons.append({
                    "src": request.build_absolute_uri(branding.pwa_icon_512.url),
                    "sizes": "512x512",
                    "type": "image/png",
                    "purpose": "any"
                })

            if branding.pwa_icon_maskable:
                icons.append({
                    "src": request.build_absolute_uri(branding.pwa_icon_maskable.url),
                    "sizes": "512x512",
                    "type": "image/png",
                    "purpose": "maskable"
                })

            if not icons and branding.favicon:
                icons.append({
                    "src": request.build_absolute_uri(branding.favicon.url),
                    "sizes": "any",
                    "type": "image/png",
                    "purpose": "any"
                })

            # Determinar theme_color: prioridad Tenant > BrandingConfig
            theme_color = branding.pwa_theme_color or branding.primary_color or "#16A34A"
            if tenant and tenant.primary_color:
                theme_color = tenant.primary_color

            # Determinar nombre: prioridad Tenant > BrandingConfig
            company_name = branding.company_name or "StrateKaz"
            if tenant and tenant.name:
                company_name = tenant.name

            manifest = {
                "name": branding.pwa_name or f"{company_name} - ERP",
                "short_name": branding.pwa_short_name or company_name[:12],
                "description": branding.pwa_description or branding.company_slogan or "Sistema de Gestión Empresarial",
                "start_url": "/",
                "scope": "/",
                "display": "standalone",
                "orientation": "portrait-primary",
                "background_color": branding.pwa_background_color or "#ffffff",
                "theme_color": theme_color,
                "icons": icons,
                "categories": ["business", "productivity"],
                "lang": "es-CO"
            }

        return Response(manifest, content_type='application/manifest+json')
