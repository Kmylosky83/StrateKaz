"""
Views del módulo Identidad Corporativa - Dirección Estratégica

ViewSets para:
- CorporateIdentity: Identidad corporativa (misión, visión)
- CorporateValue: Valores corporativos
- AlcanceSistema: Alcance del sistema de gestión
- PoliticaEspecifica: Políticas (integrales y específicas)

NOTA v4.0: El flujo de firmas se maneja en Gestor Documental.
Identidad solo crea políticas en BORRADOR y las envía a gestión.
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.filters import SearchFilter, OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend
from django.views.decorators.cache import cache_page
from django.utils.decorators import method_decorator
from django.utils import timezone

from apps.core.mixins import (
    StandardViewSetMixin, OrderingMixin, ValidateBeforeDeleteMixin
)
from apps.core.permissions import RequireSectionAndCRUD, GranularActionPermission
from .models import (
    CorporateIdentity, CorporateValue, AlcanceSistema,
    PoliticaEspecifica
)
from .serializers import (
    CorporateIdentitySerializer,
    CorporateIdentityCreateUpdateSerializer,
    CorporateValueSerializer,
    AlcanceSistemaSerializer,
    AlcanceSistemaCreateUpdateSerializer,
    PoliticaEspecificaSerializer,
    PoliticaEspecificaCreateUpdateSerializer,
    ApprovePoliticaEspecificaSerializer,
    SignPoliticaSerializer,
    PublishPoliticaSerializer,
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
    - POST /identidad/{id}/sign/ - Firmar política integral
    - POST /identidad/{id}/toggle-active/ - Toggle estado activo

    RBAC v3.3: Requiere acceso a sección 'identidad_corporativa' + permisos CRUD
    """

    queryset = CorporateIdentity.objects.select_related(
        'empresa', 'created_by', 'updated_by'
    ).prefetch_related(
        'values', 'alcances', 'politicas_especificas'  # v3.1: politicas_integrales eliminado
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
        Filtrado multi-tenant: Solo retorna identidades de la empresa del usuario.
        Superusuarios pueden ver todas las identidades.
        """
        qs = super().get_queryset()
        user = self.request.user
        if user.is_superuser:
            return qs
        if not hasattr(user, 'empresa') or user.empresa is None:
            return qs.none()
        return qs.filter(empresa=user.empresa)

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return CorporateIdentityCreateUpdateSerializer
        return CorporateIdentitySerializer

    def perform_create(self, serializer):
        """
        Asigna automáticamente la empresa al crear una identidad.

        Para superusuarios o usuarios sin empresa asignada, se usa la primera
        EmpresaConfig disponible (single-tenant). Para multi-tenant futuro,
        el usuario debería tener empresa asignada vía sede_asignada.
        """
        from apps.gestion_estrategica.configuracion.models import EmpresaConfig
        from rest_framework.exceptions import ValidationError

        user = self.request.user
        empresa = None

        # Intentar obtener empresa del usuario (vía sede_asignada)
        if hasattr(user, 'sede_asignada') and user.sede_asignada:
            empresa = getattr(user.sede_asignada, 'empresa', None)

        # Si no tiene empresa y es superusuario, usar la primera EmpresaConfig
        if empresa is None and user.is_superuser:
            empresa = EmpresaConfig.objects.first()

        if empresa is None:
            raise ValidationError({
                'empresa': 'No se pudo determinar la empresa. '
                           'Asegúrese de tener una sede asignada o que exista una EmpresaConfig.'
            })

        # Verificar que no exista ya una identidad para esta empresa
        if CorporateIdentity.objects.filter(empresa=empresa).exists():
            raise ValidationError({
                'empresa': 'Ya existe una identidad corporativa para esta empresa. '
                           'Solo puede existir una identidad por empresa.'
            })
        serializer.save(empresa=empresa, created_by=user)

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
        - Política integral vigente
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

        # v3.1: Obtener política integral vigente desde PoliticaEspecifica
        politica_integral = PoliticaEspecifica.get_integral_vigente(identity)

        # Métricas resumidas
        metrics = {
            'values_count': values.count(),
            'alcances_count': identity.alcances.filter(is_active=True).count(),
            'politicas_count': identity.politicas_especificas.filter(
                is_active=True, status='VIGENTE'
            ).count(),
            'has_politica_integral': politica_integral is not None,
            'politica_is_signed': politica_integral.is_signed if politica_integral else False,
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
            'politica_integral': {
                'title': politica_integral.title if politica_integral else 'Política Integral',
                'content': politica_integral.content if politica_integral else None,
                'is_signed': politica_integral.is_signed if politica_integral else False,
                'signed_by_name': politica_integral.approved_by.get_full_name() if politica_integral and politica_integral.approved_by else None,
                'signed_at': politica_integral.approved_at if politica_integral else None,
                'version': politica_integral.version if politica_integral else None,
            } if politica_integral else None,
            'metrics': metrics,
            'empresa': {
                'name': identity.empresa.name if hasattr(identity, 'empresa') and identity.empresa else None,
                'logo': identity.empresa.logo.url if hasattr(identity, 'empresa') and identity.empresa and identity.empresa.logo else None,
            } if hasattr(identity, 'empresa') else None,
        })

    @action(detail=True, methods=['post'])
    def sign(self, request, pk=None):
        """
        DEPRECATED: Endpoint legacy para firmar política integral.

        Este endpoint está deprecado. Usar PoliticaEspecificaViewSet.sign() en su lugar:
        POST /api/v1/identidad/politicas-especificas/{id}/sign/

        Se mantiene por compatibilidad pero retorna un mensaje de redirección.
        """
        return Response(
            {
                'detail': 'Este endpoint está deprecado.',
                'message': 'La firma de políticas integrales ahora se realiza desde el gestor de políticas.',
                'redirect': '/api/v1/identidad/politicas-especificas/{id}/sign/',
                'deprecated_since': 'v3.0',
            },
            status=status.HTTP_410_GONE
        )

    @action(detail=True, methods=['get'])
    def dashboard(self, request, pk=None):
        """Retorna estadísticas de la identidad corporativa"""
        identity = self.get_object()

        # v3.1: Obtener política integral vigente desde PoliticaEspecifica
        politica_vigente = PoliticaEspecifica.get_integral_vigente(identity)

        # v3.1: Conteos de políticas (todas en politicas_especificas)
        politicas_integrales = identity.politicas_especificas.filter(
            is_active=True, is_integral_policy=True
        )
        politicas_especificas = identity.politicas_especificas.filter(
            is_active=True, is_integral_policy=False
        )

        return Response({
            'identity_id': identity.id,
            'version': identity.version,
            'effective_date': identity.effective_date,
            'values_count': identity.values.filter(is_active=True).count(),
            'alcances': {
                'total': identity.alcances.filter(is_active=True).count(),
                'certified': identity.alcances.filter(is_active=True, is_certified=True).count(),
            },
            'politicas': {
                'integrales': politicas_integrales.count(),
                'integrales_vigentes': politicas_integrales.filter(status='VIGENTE').count(),
                'integral_is_signed': politica_vigente.is_signed if politica_vigente else False,
                'especificas': politicas_especificas.count(),
                'especificas_vigentes': politicas_especificas.filter(status='VIGENTE').count(),
            }
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
        Filtrado multi-tenant: Solo retorna valores de la empresa del usuario.
        Superusuarios pueden ver todos los valores.
        """
        qs = super().get_queryset()
        user = self.request.user
        if user.is_superuser:
            return qs
        if not hasattr(user, 'empresa') or user.empresa is None:
            return qs.none()
        return qs.filter(identity__empresa=user.empresa)


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
        Filtrado multi-tenant: Solo retorna alcances de la empresa del usuario.
        Superusuarios pueden ver todos los alcances.
        """
        qs = super().get_queryset()
        user = self.request.user
        if user.is_superuser:
            return qs
        if not hasattr(user, 'empresa') or user.empresa is None:
            return qs.none()
        return qs.filter(identity__empresa=user.empresa)

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


class PoliticaEspecificaViewSet(
    StandardViewSetMixin, OrderingMixin, ValidateBeforeDeleteMixin, viewsets.ModelViewSet
):
    """
    ViewSet unificado para gestionar Políticas (v3.1)

    Soporta tanto políticas específicas como integrales.
    Las políticas integrales se identifican con is_integral_policy=True.

    Endpoints:
    - GET /politicas-especificas/ - Lista de políticas (ambos tipos)
    - POST /politicas-especificas/ - Crear nueva política
    - GET /politicas-especificas/{id}/ - Detalle de política
    - PUT/PATCH /politicas-especificas/{id}/ - Actualizar política
    - DELETE /politicas-especificas/{id}/ - Eliminar política
    - POST /politicas-especificas/{id}/approve/ - Aprobar política específica
    - POST /politicas-especificas/{id}/sign/ - Firmar política (integrales)
    - POST /politicas-especificas/{id}/publish/ - Publicar política
    - GET /politicas-especificas/integral-vigente/ - Política integral vigente
    - GET /politicas-especificas/by-standard/ - Por norma ISO
    - GET /politicas-especificas/pending-review/ - Pendientes de revisión
    - POST /politicas-especificas/{id}/toggle-active/ - Toggle estado activo

    Filtros adicionales v3.1:
    - ?is_integral_policy=true - Solo políticas integrales
    - ?is_integral_policy=false - Solo políticas específicas

    RBAC v3.3: Requiere acceso a sección 'politicas' + permisos CRUD
    """

    queryset = PoliticaEspecifica.objects.select_related(
        'identity', 'area', 'responsible', 'responsible_cargo',
        'approved_by', 'created_by'
    ).all()
    permission_classes = [IsAuthenticated, GranularActionPermission]
    section_code = 'politicas'

    granular_action_map = {
        'approve': 'approve',
        'sign': 'sign',
        'publish': 'publish',
        'crear_nueva_version': 'can_create',
        'enviar_a_gestion': 'can_update',  # Enviar a Gestor Documental
        'actualizar_estado': 'can_update',  # Callback desde Gestor Documental
        'integral_vigente': 'can_view',
        'by_standard': 'can_view',
        'pending_review': 'can_view',
        'stats': 'can_view',
    }
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['identity', 'norma_iso', 'status', 'area', 'is_active', 'is_integral_policy']
    search_fields = ['code', 'title', 'content', 'keywords']
    ordering_fields = ['code', 'norma_iso', 'status', 'effective_date', 'orden', 'created_at']
    ordering = ['norma_iso', 'orden', 'code']

    def get_queryset(self):
        """
        Filtrado multi-tenant: Solo retorna políticas de la empresa del usuario.
        Superusuarios pueden ver todas las políticas.
        """
        qs = super().get_queryset()
        user = self.request.user
        if user.is_superuser:
            return qs
        if not hasattr(user, 'empresa') or user.empresa is None:
            return qs.none()
        return qs.filter(identity__empresa=user.empresa)

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return PoliticaEspecificaCreateUpdateSerializer
        return PoliticaEspecificaSerializer

    def update(self, request, *args, **kwargs):
        """
        Bloquea la edición de políticas que no están en BORRADOR.

        Solo las políticas en BORRADOR son editables desde Identidad.
        Una vez enviadas a Gestor Documental (EN_GESTION), ya no se pueden editar.

        Estados editables: BORRADOR
        Estados NO editables: EN_GESTION, VIGENTE, OBSOLETO
        """
        instance = self.get_object()

        if instance.status != 'BORRADOR':
            return Response(
                {
                    'detail': f'No se puede editar una política en estado {instance.get_status_display()}',
                    'status': instance.status,
                    'mensaje': 'Solo las políticas en Borrador son editables. Para modificar una política vigente, cree una nueva versión.',
                    'endpoint_sugerido': f'/api/v1/identidad/politicas-especificas/{instance.id}/crear-nueva-version/'
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        return super().update(request, *args, **kwargs)

    @action(detail=True, methods=['post'], url_path='crear-nueva-version')
    def crear_nueva_version(self, request, pk=None):
        """
        Crea una nueva versión de una política VIGENTE.

        Flujo de versionamiento:
        1. Política VIGENTE (POL-SST-001 v1.0)
        2. Usuario solicita nueva versión
        3. Se crea COPIA de la política como BORRADOR con versión incrementada
        4. La nueva versión pasa por el mismo proceso de firma
        5. Al publicar, la versión anterior pasa a OBSOLETO
        6. El Gestor Documental recibe la nueva versión con el MISMO código

        Requisitos:
        - La política debe estar en estado VIGENTE
        - El usuario debe tener permisos de edición

        Body (opcional):
        - change_reason: Motivo del cambio de versión
        """
        politica_original = self.get_object()

        # Validar que la política esté VIGENTE
        if politica_original.status != 'VIGENTE':
            return Response(
                {
                    'detail': 'Solo se pueden crear nuevas versiones de políticas VIGENTES',
                    'status_actual': politica_original.status,
                    'estados_permitidos': ['VIGENTE']
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # Obtener motivo del cambio si se proporciona
        change_reason = request.data.get('change_reason', 'Nueva versión de la política')

        # Incrementar versión
        try:
            version_actual = float(politica_original.version)
            nueva_version = f"{version_actual + 1.0:.1f}"
        except (ValueError, TypeError):
            # Si la versión no es numérica, agregar sufijo
            nueva_version = f"{politica_original.version}.1"

        # Crear nueva politica como copia
        nueva_politica = PoliticaEspecifica.objects.create(
            identity=politica_original.identity,
            norma_iso=politica_original.norma_iso,
            # code: NULL - Se asignara cuando se publique en Gestor Documental
            # documento_id: NULL - Se asignara cuando se publique
            title=politica_original.title,
            content=f"{politica_original.content}\n\n<!-- Motivo del cambio: {change_reason} -->",
            area=politica_original.area,
            responsible=politica_original.responsible,
            responsible_cargo=politica_original.responsible_cargo,
            version=nueva_version,
            status='BORRADOR',  # Nueva version empieza como BORRADOR
            review_date=politica_original.review_date,
            keywords=politica_original.keywords,
            orden=politica_original.orden,
            is_active=True,
            created_by=request.user,
        )

        # Registrar la relación con la versión anterior (para trazabilidad)
        # Esto se podría hacer con un campo adicional, pero por ahora
        # usamos change_reason para documentar

        return Response({
            'detail': 'Nueva versión creada exitosamente',
            'nueva_politica_id': nueva_politica.id,
            'version_anterior': politica_original.version,
            'version_nueva': nueva_version,
            'status': nueva_politica.status,
            'mensaje': 'La nueva versión está en BORRADOR. Complete el proceso de firma para publicarla.',
            'politica_original': {
                'id': politica_original.id,
                'version': politica_original.version,
                'status': politica_original.status,
                'code': politica_original.code,
            },
            'siguiente_paso': 'Edite la nueva versión y envíela a firma usando iniciar-firma/',
            'politica': PoliticaEspecificaSerializer(nueva_politica).data
        }, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Aprueba la política específica"""
        politica = self.get_object()

        serializer = ApprovePoliticaEspecificaSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        if politica.status == 'VIGENTE':
            return Response(
                {'detail': 'La política ya está aprobada y vigente'},
                status=status.HTTP_400_BAD_REQUEST
            )

        politica.approve(request.user)

        return Response({
            'detail': 'Política aprobada exitosamente',
            'approved_by': request.user.get_full_name(),
            'approved_at': politica.approved_at,
            'status': politica.status
        })

    # =========================================================================
    # ACCIONES v3.1 - Soporte para políticas integrales
    # =========================================================================

    @action(detail=True, methods=['post'])
    def sign(self, request, pk=None):
        """
        Firma digitalmente la política (v3.1)

        Genera un hash SHA-256 del contenido + usuario + timestamp
        para garantizar la integridad y no repudio de la firma.

        Usado principalmente para políticas integrales que requieren
        firma digital con hash de integridad.
        """
        politica = self.get_object()

        serializer = SignPoliticaSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        if politica.is_signed:
            return Response(
                {'detail': 'La política ya está firmada'},
                status=status.HTTP_400_BAD_REQUEST
            )

        politica.sign(request.user)

        return Response({
            'detail': 'Política firmada exitosamente',
            'signed_by': request.user.get_full_name(),
            'signed_at': politica.approved_at,
            'signature_hash': politica.signature_hash,
            'is_integral_policy': politica.is_integral_policy
        })

    @action(detail=True, methods=['post'])
    def publish(self, request, pk=None):
        """
        Publica la política (v3.1)

        Cambia el estado a VIGENTE. Para políticas integrales,
        obsoleta automáticamente las versiones vigentes anteriores.
        """
        politica = self.get_object()

        serializer = PublishPoliticaSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            politica.publish(request.user)
        except ValueError as e:
            return Response(
                {'detail': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

        return Response({
            'detail': 'Política publicada exitosamente',
            'status': politica.status,
            'effective_date': politica.effective_date,
            'is_integral_policy': politica.is_integral_policy
        })

    @action(detail=False, methods=['get'], url_path='integral-vigente')
    def integral_vigente(self, request):
        """
        Obtiene la política integral vigente actual (v3.1)

        Query params:
        - identity: ID de la identidad corporativa (requerido)

        Retorna la política integral vigente o 404 si no existe.
        """
        identity_id = request.query_params.get('identity')
        if not identity_id:
            return Response(
                {'detail': 'Se requiere el parámetro identity'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            identity = CorporateIdentity.objects.get(pk=identity_id)
        except CorporateIdentity.DoesNotExist:
            return Response(
                {'detail': 'Identidad corporativa no encontrada'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Verificar acceso multi-tenant
        user = request.user
        if not user.is_superuser:
            if hasattr(user, 'empresa') and user.empresa:
                if identity.empresa_id != user.empresa_id:
                    return Response(
                        {'detail': 'No tiene acceso a esta identidad corporativa'},
                        status=status.HTTP_403_FORBIDDEN
                    )

        politica = PoliticaEspecifica.get_integral_vigente(identity)
        if politica:
            serializer = PoliticaEspecificaSerializer(politica)
            return Response(serializer.data)

        return Response(
            {'detail': 'No hay política integral vigente'},
            status=status.HTTP_404_NOT_FOUND
        )

    @action(detail=False, methods=['get'], url_path='by-standard')
    def by_standard(self, request):
        """Retorna políticas agrupadas por norma ISO (dinámico desde BD)"""
        from apps.gestion_estrategica.configuracion.models import NormaISO

        queryset = self.filter_queryset(self.get_queryset())
        normas = NormaISO.objects.filter(is_active=True).order_by('orden')
        result = {}

        for norma in normas:
            politicas = queryset.filter(norma_iso=norma, is_active=True)
            result[norma.code] = {
                'label': norma.short_name,
                'total': politicas.count(),
                'vigentes': politicas.filter(status='VIGENTE').count(),
                'borradores': politicas.filter(status='BORRADOR').count(),
            }

        return Response(result)

    @action(detail=False, methods=['get'], url_path='pending-review')
    def pending_review(self, request):
        """Retorna políticas pendientes de revisión"""
        queryset = self.get_queryset().filter(
            is_active=True,
            review_date__lte=timezone.now().date()
        )

        serializer = PoliticaEspecificaSerializer(queryset, many=True)
        return Response({
            'count': queryset.count(),
            'policies': serializer.data
        })

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Estadísticas de políticas específicas"""
        queryset = self.get_queryset().filter(is_active=True)

        return Response({
            'total': queryset.count(),
            'by_status': {
                'borrador': queryset.filter(status='BORRADOR').count(),
                'en_revision': queryset.filter(status='EN_REVISION').count(),
                'vigente': queryset.filter(status='VIGENTE').count(),
                'obsoleto': queryset.filter(status='OBSOLETO').count(),
            },
            'pending_review': queryset.filter(
                review_date__lte=__import__('django.utils', fromlist=['timezone']).timezone.now().date()
            ).count() if queryset.exists() else 0,
        })

    # =========================================================================
    # INTEGRACIÓN CON GESTOR DOCUMENTAL
    # =========================================================================
    # El flujo de firmas se maneja completamente en Gestor Documental.
    # Identidad solo crea políticas en BORRADOR y las envía a Gestión.
    # =========================================================================

    @action(detail=True, methods=['post'], url_path='enviar-a-gestion')
    def enviar_a_gestion(self, request, pk=None):
        """
        Envía una política al Gestor Documental para firma, codificación y publicación.

        Flujo simplificado:
        1. IDENTIDAD: Crear política en BORRADOR
        2. Este endpoint: Envía a Gestor Documental → Estado: EN_GESTION
        3. GESTOR DOCUMENTAL: Maneja firmas, asigna código, publica
        4. CALLBACK: Actualiza estado a VIGENTE con código oficial

        La política pasa a EN_GESTION y ya no es editable desde Identidad.

        Body (opcional):
        - clasificacion: 'PUBLICO' | 'INTERNO' | 'CONFIDENCIAL' | 'RESTRINGIDO'
        - observaciones: texto libre
        """
        from .services import GestorDocumentalService

        politica = self.get_object()

        # Solo se pueden enviar políticas en BORRADOR
        if politica.status != 'BORRADOR':
            return Response(
                {
                    'detail': 'Solo se pueden enviar políticas en estado Borrador',
                    'status_actual': politica.status,
                    'estados_permitidos': ['BORRADOR']
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # Verificar disponibilidad del Gestor Documental
        if not GestorDocumentalService.is_documental_available():
            return Response(
                {
                    'detail': 'El módulo Sistema Documental no está disponible',
                    'mensaje': 'Verifique que el módulo esté instalado en INSTALLED_APPS'
                },
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )

        # Cambiar estado a EN_GESTION (ya no editable desde Identidad)
        politica.status = 'EN_GESTION'
        politica.save(update_fields=['status', 'updated_at'])

        try:
            # Enviar al Gestor Documental (sin firmas locales)
            resultado = GestorDocumentalService.enviar_politica_a_documental(
                politica=politica,
                request_user=request.user,
                clasificacion=request.data.get('clasificacion', 'INTERNO'),
                observaciones=request.data.get('observaciones', '')
            )

            return Response({
                'detail': 'Política enviada al Gestor Documental exitosamente',
                'politica': {
                    'id': politica.id,
                    'title': politica.title,
                    'status': politica.status,
                },
                'gestor_documental': resultado,
                'mensaje': 'El proceso de firma y codificación continuará en Gestor Documental'
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            # Revertir estado si falla el envío
            politica.status = 'BORRADOR'
            politica.save(update_fields=['status', 'updated_at'])
            return Response(
                {
                    'detail': 'Error al enviar la política al Gestor Documental',
                    'error': str(e)
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['post'], url_path='actualizar-estado')
    def actualizar_estado(self, request, pk=None):
        """
        Callback para que Gestor Documental actualice el estado de la política.

        Este endpoint es llamado por Gestor Documental cuando:
        - La política es aprobada y publicada → VIGENTE
        - La política es rechazada → BORRADOR
        - Se asigna código oficial

        Body:
        - status: 'VIGENTE' | 'BORRADOR' | 'OBSOLETO'
        - code: Código oficial asignado (opcional)
        - documento_id: ID del documento en Gestor Documental (opcional)
        - effective_date: Fecha de vigencia (opcional)
        """
        politica = self.get_object()

        nuevo_status = request.data.get('status')
        if nuevo_status not in ['VIGENTE', 'BORRADOR', 'OBSOLETO']:
            return Response(
                {'detail': 'Estado inválido'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Actualizar campos
        politica.status = nuevo_status

        if request.data.get('code'):
            politica.code = request.data['code']

        if request.data.get('documento_id'):
            politica.documento_id = request.data['documento_id']

        if request.data.get('effective_date'):
            politica.effective_date = request.data['effective_date']

        # Si pasa a VIGENTE, obsoleta versiones anteriores
        if nuevo_status == 'VIGENTE' and politica.code:
            from .models import PoliticaEspecifica
            PoliticaEspecifica.objects.filter(
                identity=politica.identity,
                code=politica.code,
                status='VIGENTE'
            ).exclude(pk=politica.pk).update(status='OBSOLETO')

        politica.save()

        return Response({
            'detail': 'Estado actualizado exitosamente',
            'politica': {
                'id': politica.id,
                'code': politica.code,
                'status': politica.status,
                'effective_date': politica.effective_date,
            }
        })
