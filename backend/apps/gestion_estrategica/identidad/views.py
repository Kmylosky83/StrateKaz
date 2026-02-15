"""
Views del módulo Identidad Corporativa - Dirección Estratégica

ViewSets para:
- CorporateIdentity: Identidad corporativa (misión, visión)
- CorporateValue: Valores corporativos
- AlcanceSistema: Alcance del sistema de gestión
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.filters import SearchFilter, OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend
from django.views.decorators.cache import cache_page
from django.utils.decorators import method_decorator
from apps.core.mixins import (
    StandardViewSetMixin, OrderingMixin,
)
from apps.core.permissions import GranularActionPermission
from .models import (
    CorporateIdentity, CorporateValue, AlcanceSistema,
)
from .serializers import (
    CorporateIdentitySerializer,
    CorporateIdentityCreateUpdateSerializer,
    CorporateValueSerializer,
    AlcanceSistemaSerializer,
    AlcanceSistemaCreateUpdateSerializer,
)


class CorporateIdentityViewSet(StandardViewSetMixin, viewsets.ModelViewSet):
    """
    ViewSet para gestionar la Identidad Corporativa.

    Endpoints:
    - GET /identidad/ - Lista de identidades corporativas
    - POST /identidad/ - Crear nueva identidad
    - GET /identidad/{id}/ - Detalle de identidad
    - PUT/PATCH /identidad/{id}/ - Actualizar identidad
    - DELETE /identidad/{id}/ - Eliminar identidad
    - GET /identidad/active/ - Obtener identidad activa
    - GET /identidad/showcase/ - Showcase público
    - GET /identidad/{id}/dashboard/ - Dashboard de estadísticas
    - POST /identidad/{id}/toggle-active/ - Toggle estado activo

    RBAC v3.3: Requiere acceso a sección 'identidad_corporativa' + permisos CRUD
    """

    queryset = CorporateIdentity.objects.select_related(
        'empresa', 'created_by', 'updated_by'
    ).prefetch_related(
        'values', 'alcances'
    ).all()
    permission_classes = [IsAuthenticated, GranularActionPermission]
    section_code = 'identidad_corporativa'
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['is_active', 'version']
    search_fields = ['mission', 'vision']
    ordering_fields = ['effective_date', 'version', 'created_at']
    ordering = ['-effective_date']

    def get_queryset(self):
        """
        Filtrado multi-tenant: Tenant schema isolation handles data separation.
        No need to filter by empresa - each tenant has its own schema.
        """
        return super().get_queryset()

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return CorporateIdentityCreateUpdateSerializer
        return CorporateIdentitySerializer

    def perform_create(self, serializer):
        """
        Asigna automáticamente la empresa al crear una identidad.
        Usa get_tenant_empresa() para resolver la empresa del tenant actual.
        auto_create=True ensures EmpresaConfig is created if missing.
        """
        from apps.core.base_models.mixins import get_tenant_empresa
        from rest_framework.exceptions import ValidationError

        empresa = get_tenant_empresa()

        # Verificar que no exista ya una identidad para esta empresa
        if CorporateIdentity.objects.filter(empresa=empresa).exists():
            raise ValidationError({
                'empresa': 'Ya existe una identidad corporativa para esta empresa. '
                           'Solo puede existir una identidad por empresa.'
            })
        serializer.save(empresa=empresa, created_by=self.request.user)

    def update(self, request, *args, **kwargs):
        """
        Sobrescribir update para retornar el objeto completo con el serializer de lectura.
        Esto permite que el frontend reciba todos los datos actualizados inmediatamente.
        """
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        if getattr(instance, '_prefetched_objects_cache', None):
            instance._prefetched_objects_cache = {}

        # Retornar con el serializer de lectura (completo)
        read_serializer = CorporateIdentitySerializer(instance)
        return Response(read_serializer.data)

    @action(detail=False, methods=['get'], permission_classes=[AllowAny])
    def active(self, request):
        """
        Obtiene la identidad corporativa activa.

        NOTA: Este endpoint es público (sin autenticación) porque la identidad
        se puede mostrar en la página de login antes de autenticarse.
        Sin cache para permitir actualizaciones en tiempo real.
        """
        identity = CorporateIdentity.get_active()
        if identity:
            serializer = CorporateIdentitySerializer(identity)
            return Response(serializer.data)
        return Response(
            {'detail': 'No hay identidad corporativa activa'},
            status=status.HTTP_404_NOT_FOUND
        )

    @method_decorator(cache_page(60 * 5))  # Cache 5 minutos
    @action(detail=False, methods=['get'], permission_classes=[AllowAny], url_path='showcase')
    def showcase(self, request):
        """
        Endpoint PÚBLICO para el Showcase de Identidad Corporativa.

        Retorna todos los datos necesarios para la vista de showcase:
        - Identidad corporativa (misión, visión)
        - Valores corporativos ordenados
        - Métricas resumidas

        Este endpoint es público para permitir compartir la identidad
        corporativa externamente (via URL o QR Code).
        """
        identity = CorporateIdentity.get_active()
        if not identity:
            return Response(
                {'detail': 'No hay identidad corporativa configurada'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Obtener valores ordenados y activos
        values = identity.values.filter(is_active=True).order_by('orden')
        values_data = CorporateValueSerializer(values, many=True).data

        # Métricas resumidas
        metrics = {
            'values_count': values.count(),
            'alcances_count': identity.alcances.filter(is_active=True).count(),
            'version': identity.version,
        }

        return Response({
            'identity': {
                'id': identity.id,
                'mission': identity.mission,
                'vision': identity.vision,
                'effective_date': identity.effective_date,
                'version': identity.version,
            },
            'values': values_data,
            'metrics': metrics,
            'empresa': {
                'name': identity.empresa.name if hasattr(identity, 'empresa') and identity.empresa else None,
                'logo': identity.empresa.logo.url if hasattr(identity, 'empresa') and identity.empresa and identity.empresa.logo else None,
            } if hasattr(identity, 'empresa') else None,
        })

    @action(detail=True, methods=['get'])
    def dashboard(self, request, pk=None):
        """Retorna estadísticas de la identidad corporativa"""
        identity = self.get_object()

        return Response({
            'identity_id': identity.id,
            'version': identity.version,
            'effective_date': identity.effective_date,
            'values_count': identity.values.filter(is_active=True).count(),
            'alcances': {
                'total': identity.alcances.filter(is_active=True).count(),
                'certified': identity.alcances.filter(is_active=True, is_certified=True).count(),
            },
        })


class CorporateValueViewSet(StandardViewSetMixin, OrderingMixin, viewsets.ModelViewSet):
    """
    ViewSet para gestionar los Valores Corporativos.

    Endpoints:
    - GET /valores/ - Lista de valores
    - POST /valores/ - Crear nuevo valor
    - GET /valores/{id}/ - Detalle de valor
    - PUT/PATCH /valores/{id}/ - Actualizar valor
    - DELETE /valores/{id}/ - Eliminar valor
    - POST /valores/reorder/ - Reordenar valores (del OrderingMixin)
    - POST /valores/{id}/toggle-active/ - Toggle estado activo

    RBAC v3.3: Requiere acceso a sección 'valores_corporativos' + permisos CRUD
    """

    queryset = CorporateValue.objects.select_related('identity').all()
    serializer_class = CorporateValueSerializer
    permission_classes = [IsAuthenticated, GranularActionPermission]
    section_code = 'valores_corporativos'
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['identity', 'is_active']
    search_fields = ['name', 'description']
    ordering_fields = ['orden', 'name', 'created_at']
    ordering = ['orden', 'name']

    def get_queryset(self):
        """
        Filtrado multi-tenant: Tenant schema isolation handles data separation.
        """
        return super().get_queryset()


class AlcanceSistemaViewSet(StandardViewSetMixin, viewsets.ModelViewSet):
    """
    ViewSet para gestionar Alcances del Sistema de Gestión.

    Endpoints:
    - GET /alcances/ - Lista de alcances
    - POST /alcances/ - Crear nuevo alcance
    - GET /alcances/{id}/ - Detalle de alcance
    - PUT/PATCH /alcances/{id}/ - Actualizar alcance
    - DELETE /alcances/{id}/ - Eliminar alcance
    - GET /alcances/by-standard/ - Alcances por norma ISO
    - GET /alcances/certifications/ - Resumen de certificaciones
    - POST /alcances/{id}/toggle-active/ - Toggle estado activo

    RBAC v3.3: Requiere acceso a sección 'alcance_sig' + permisos CRUD
    """

    queryset = AlcanceSistema.objects.select_related('identity', 'created_by').all()
    permission_classes = [IsAuthenticated, GranularActionPermission]
    section_code = 'alcance_sig'
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['identity', 'norma_iso', 'is_certified', 'is_active']
    search_fields = ['scope', 'exclusions', 'certification_body', 'certificate_number']
    ordering_fields = ['norma_iso', 'certification_date', 'expiry_date', 'created_at']
    ordering = ['norma_iso']

    def get_queryset(self):
        """
        Filtrado multi-tenant: Tenant schema isolation handles data separation.
        """
        return super().get_queryset()

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return AlcanceSistemaCreateUpdateSerializer
        return AlcanceSistemaSerializer

    @action(detail=False, methods=['get'], url_path='by-standard')
    def by_standard(self, request):
        """Retorna alcances agrupados por norma ISO (dinámico desde BD)"""
        from apps.gestion_estrategica.configuracion.models import NormaISO

        queryset = self.filter_queryset(self.get_queryset())
        normas = NormaISO.objects.filter(is_active=True).order_by('orden')
        result = {}

        for norma in normas:
            alcance = queryset.filter(norma_iso=norma, is_active=True).first()
            result[norma.code] = {
                'label': norma.short_name,
                'has_scope': alcance is not None,
                'is_certified': alcance.is_certified if alcance else False,
                'is_valid': alcance.is_certificate_valid if alcance else False,
                'expiry_date': alcance.expiry_date if alcance else None,
                'days_until_expiry': alcance.days_until_expiry if alcance else None,
            }

        return Response(result)

    @action(detail=False, methods=['get'])
    def certifications(self, request):
        """Retorna resumen de certificaciones"""
        queryset = self.get_queryset().filter(is_active=True)

        certified = queryset.filter(is_certified=True)
        expiring_soon = []

        for alcance in certified:
            if alcance.days_until_expiry is not None and alcance.days_until_expiry <= 90:
                expiring_soon.append({
                    'id': alcance.id,
                    'norma_iso': alcance.norma_iso.code if alcance.norma_iso else None,
                    'norma_iso_display': alcance.norma_iso.short_name if alcance.norma_iso else 'Sin Norma',
                    'expiry_date': alcance.expiry_date,
                    'days_until_expiry': alcance.days_until_expiry,
                })

        return Response({
            'total_alcances': queryset.count(),
            'certified': certified.count(),
            'pending': queryset.filter(is_certified=False).count(),
            'expiring_soon': expiring_soon,
        })


