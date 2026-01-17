"""
Views del módulo Identidad Corporativa - Dirección Estratégica

ViewSets para:
- CorporateIdentity: Identidad corporativa (misión, visión)
- CorporateValue: Valores corporativos
- AlcanceSistema: Alcance del sistema de gestión
- PoliticaEspecifica: Políticas (integrales y específicas) - v3.1 unificado

NOTA v3.1: PoliticaIntegral ha sido consolidado en PoliticaEspecifica.
Las políticas integrales se identifican con is_integral_policy=True.
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
    IniciarFirmaPoliticaSerializer,
    FirmarPoliticaSerializer,
    RechazarFirmaPoliticaSerializer,
    EnviarADocumentalSerializer,
)
# Fase 0.3.4: Sistema de firmas consolidado - usar solo FirmaDigital
from django.contrib.contenttypes.models import ContentType
from apps.workflow_engine.firma_digital.models import (
    FirmaDigital,
    ConfiguracionFlujoFirma as ConfigFlujoUniversal,
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
        'iniciar_firma': 'iniciar_firma',
        'firmar': 'firmar',
        'rechazar_firma': 'rechazar_firma',
        'crear_nueva_version': 'can_create',  # Crear nueva versión sigue requiriendo permiso de CREAR
        'enviar_a_documental': 'enviar_a_documental',
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
        Bloquea la edición de políticas VIGENTES.

        Las políticas VIGENTES ya fueron firmadas y publicadas en el Gestor Documental.
        Para modificar una política vigente, se debe crear una nueva versión usando
        el endpoint crear-nueva-version/.

        Estados editables: BORRADOR
        Estados NO editables: EN_REVISION, FIRMADO, VIGENTE, OBSOLETO
        """
        instance = self.get_object()

        if instance.status in ['VIGENTE', 'FIRMADO', 'OBSOLETO']:
            return Response(
                {
                    'detail': f'No se puede editar una política en estado {instance.get_status_display()}',
                    'status': instance.status,
                    'mensaje': 'Para modificar esta política, debe crear una nueva versión usando el endpoint crear-nueva-version/',
                    'endpoint_sugerido': f'/api/v1/identidad/politicas-especificas/{instance.id}/crear-nueva-version/'
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        if instance.status == 'EN_REVISION':
            return Response(
                {
                    'detail': 'No se puede editar una política mientras está en proceso de firma',
                    'status': instance.status,
                    'mensaje': 'Espere a que el proceso de firma se complete o sea rechazado'
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
    # WORKFLOW DE FIRMAS
    # =========================================================================

    @action(detail=True, methods=['post'], url_path='iniciar-firma')
    def iniciar_firma(self, request, pk=None):
        """
        Inicia el proceso de firma para una política específica.

        Fase 0.3.4: Usa FirmaDigital (workflow_engine) directamente.

        El proceso de firma:
        1. Obtiene o crea ConfiguracionFlujoFirma universal
        2. Crea FirmaDigital para cada firmante requerido
        3. Cambia el estado de la política a EN_REVISION
        4. Notifica a los firmantes

        Body:
        - firmantes: Lista de {rol_firmante, cargo_id} o {rol_firmante, usuario_id}
        """
        politica = self.get_object()

        # Validar estado actual
        if politica.status not in ['BORRADOR', 'EN_REVISION']:
            return Response(
                {'detail': 'Solo se pueden enviar a firma políticas en borrador o en revisión'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Verificar que no tenga firmas pendientes activas
        content_type = ContentType.objects.get_for_model(politica)
        firmas_pendientes = FirmaDigital.objects.filter(
            content_type=content_type,
            object_id=politica.id,
            estado='PENDIENTE'
        ).count()

        if firmas_pendientes > 0:
            return Response(
                {
                    'detail': 'La política ya tiene firmas pendientes',
                    'firmas_pendientes': firmas_pendientes
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = IniciarFirmaPoliticaSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        firmantes_manuales = serializer.validated_data.get('firmantes', [])

        from apps.core.models import Cargo
        from django.contrib.auth import get_user_model
        User = get_user_model()

        # Obtener empresa_id de la política
        empresa_id = politica.identity.empresa_id if hasattr(politica, 'identity') else None

        # Obtener o crear configuración de flujo universal
        config_flujo, _ = ConfigFlujoUniversal.objects.get_or_create(
            codigo='FLUJO-POL-STD',
            defaults={
                'nombre': 'Flujo Estándar Políticas',
                'descripcion': 'Flujo de firma para políticas corporativas',
                'tipo_flujo': 'SECUENCIAL',
                'configuracion_nodos': [],
                'permite_delegacion': True,
                'dias_max_firma': 7,
                'requiere_comentario_rechazo': True,
                'empresa_id': empresa_id,
            }
        )

        # Calcular hash del contenido de la política
        import hashlib
        contenido_hash = hashlib.sha256(
            (politica.content or '').encode('utf-8')
        ).hexdigest()

        firmas_creadas = []
        ip_address = self._get_client_ip(request)
        user_agent = request.META.get('HTTP_USER_AGENT', '')

        # Mapeo de roles legacy a roles universales
        mapeo_rol = {
            'ELABORO': 'ELABORO',
            'REVISO_TECNICO': 'REVISO',
            'REVISO_JURIDICO': 'REVISO',
            'APROBO_DIRECTOR': 'APROBO',
            'APROBO_GERENTE': 'APROBO',
            'APROBO_REPRESENTANTE_LEGAL': 'AUTORIZO',
        }

        # Mapeo de orden por rol
        orden_mapping = {
            'ELABORO': 1,
            'REVISO_TECNICO': 2,
            'REVISO_JURIDICO': 2,
            'APROBO_DIRECTOR': 3,
            'APROBO_GERENTE': 3,
            'APROBO_REPRESENTANTE_LEGAL': 4,
        }

        # PASO 1: ELABORO es el usuario actual
        firma_elaboro = FirmaDigital.objects.create(
            content_type=content_type,
            object_id=politica.id,
            configuracion_flujo=config_flujo,
            usuario=None,  # Pendiente - el usuario actual firmará
            cargo=request.user.cargo,
            rol_firma='ELABORO',
            orden=1,
            estado='PENDIENTE',
            documento_hash=contenido_hash,
            ip_address=ip_address,
            user_agent=user_agent,
            comentarios=f'Elaboración de política {politica.title}',
        )
        firmas_creadas.append({
            'firma': firma_elaboro,
            'usuario_asignado': request.user,
            'es_cargo': False,
        })

        # PASOS 2+: Firmantes seleccionados
        for firmante_data in firmantes_manuales:
            rol_legacy = firmante_data['rol_firmante']
            rol_universal = mapeo_rol.get(rol_legacy, 'VALIDO')
            orden = orden_mapping.get(rol_legacy, 2)

            if firmante_data.get('cargo_id'):
                # MODO POR CARGO
                cargo = Cargo.objects.get(id=firmante_data['cargo_id'])
                firma = FirmaDigital.objects.create(
                    content_type=content_type,
                    object_id=politica.id,
                    configuracion_flujo=config_flujo,
                    usuario=None,  # Cualquier usuario del cargo puede firmar
                    cargo=cargo,
                    rol_firma=rol_universal,
                    orden=orden,
                    estado='PENDIENTE',
                    documento_hash=contenido_hash,
                    ip_address=ip_address,
                    user_agent=user_agent,
                    comentarios=f'{rol_legacy} por cargo {cargo.name}',
                )
                firmas_creadas.append({
                    'firma': firma,
                    'cargo': cargo,
                    'es_cargo': True,
                })
            elif firmante_data.get('usuario_id'):
                # MODO POR USUARIO
                usuario = User.objects.get(id=firmante_data['usuario_id'])
                firma = FirmaDigital.objects.create(
                    content_type=content_type,
                    object_id=politica.id,
                    configuracion_flujo=config_flujo,
                    usuario=None,  # Pendiente - el usuario asignado firmará
                    cargo=usuario.cargo,
                    rol_firma=rol_universal,
                    orden=orden,
                    estado='PENDIENTE',
                    documento_hash=contenido_hash,
                    ip_address=ip_address,
                    user_agent=user_agent,
                    comentarios=f'{rol_legacy} asignado a {usuario.get_full_name()}',
                )
                firmas_creadas.append({
                    'firma': firma,
                    'usuario_asignado': usuario,
                    'es_cargo': False,
                })

        # Actualizar estado de la política
        politica.status = 'EN_REVISION'
        politica.save(update_fields=['status', 'updated_at'])

        # NOTIFICAR A LOS FIRMANTES
        from apps.audit_system.centro_notificaciones.utils import (
            enviar_notificacion,
            notificar_cargo,
            notificar_politica_revision_pendiente
        )

        import logging
        logger = logging.getLogger(__name__)

        # Fecha límite por defecto
        fecha_limite = timezone.now() + timezone.timedelta(days=7)

        for firma_info in firmas_creadas:
            firma = firma_info['firma']

            # Si es secuencial, solo notificar si es el primer paso (orden 1)
            if config_flujo.tipo_flujo == 'SECUENCIAL' and firma.orden != 1:
                continue

            if firma_info['es_cargo']:
                # Notificar a todo el cargo
                cargo = firma_info['cargo']
                try:
                    if firma.rol_firma == 'REVISO':
                        resultado = notificar_politica_revision_pendiente(
                            politica=politica,
                            cargo_revisor=cargo,
                            usuario_solicitante=request.user
                        )
                    else:
                        resultado = notificar_cargo(
                            cargo=cargo,
                            tipo='FIRMA_REQUERIDA',
                            asunto=f'Firma Requerida: {politica.title}',
                            mensaje=(
                                f'Se requiere su firma para la política "{politica.title}" '
                                f'como {firma.get_rol_firma_display()}. '
                                f'Tiene hasta el {fecha_limite.strftime("%d/%m/%Y")} para firmar.'
                            ),
                            link=f'/gestion-estrategica/identidad?politica={politica.id}',
                            prioridad='ALTA',
                            empresa=politica.identity.empresa if hasattr(politica, 'identity') else None,
                            datos_adicionales={
                                'firma_id': str(firma.id),
                                'politica_id': politica.id,
                                'rol_firma': firma.rol_firma,
                            }
                        )
                    logger.info(f"Notificación enviada a cargo '{cargo.name}'")
                except Exception as e:
                    logger.warning(f"Error notificando a cargo {cargo.name}: {str(e)}")
            else:
                # Notificar a usuario específico
                usuario = firma_info.get('usuario_asignado')
                if usuario:
                    try:
                        enviar_notificacion(
                            destinatario=usuario,
                            tipo='FIRMA_REQUERIDA',
                            asunto=f'Firma Requerida: {politica.title}',
                            mensaje=(
                                f'Se requiere su firma para la política "{politica.title}" '
                                f'como {firma.get_rol_firma_display()}. '
                                f'Tiene hasta el {fecha_limite.strftime("%d/%m/%Y")} para firmar.'
                            ),
                            link=f'/gestion-estrategica/identidad?politica={politica.id}',
                            prioridad='ALTA',
                            datos_adicionales={
                                'firma_id': str(firma.id),
                                'politica_id': politica.id,
                                'rol_firma': firma.rol_firma,
                            }
                        )
                        logger.info(f"Notificación enviada a {usuario.username}")
                    except Exception as e:
                        logger.warning(f"Error notificando a {usuario.username}: {str(e)}")

        # Preparar respuesta con información de firmas
        firmas_response = []
        for firma_info in firmas_creadas:
            firma = firma_info['firma']
            firmas_response.append({
                'id': str(firma.id),
                'rol': firma.rol_firma,
                'orden': firma.orden,
                'estado': firma.estado,
                'cargo': firma.cargo.name if firma.cargo else None,
            })

        return Response({
            'detail': 'Proceso de firma iniciado exitosamente',
            'total_firmas': len(firmas_creadas),
            'politica_status': politica.status,
            'firmas': firmas_response,
        }, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def firmar(self, request, pk=None):
        """
        Registra una firma en el proceso de firma de la política.

        Fase 0.3.4: Usa FirmaDigital directamente.

        Body:
        - firma_id: ID de la FirmaDigital a completar
        - firma_imagen: Imagen de la firma en Base64
        - comentarios (opcional): Comentarios del firmante
        """
        politica = self.get_object()

        serializer = FirmarPoliticaSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        firma_id = serializer.validated_data['firma_id']
        firma_imagen = serializer.validated_data['firma_imagen']
        comentarios = serializer.validated_data.get('comentarios', '')

        # Obtener la firma digital
        content_type = ContentType.objects.get_for_model(politica)
        try:
            firma = FirmaDigital.objects.select_related(
                'configuracion_flujo', 'cargo'
            ).get(
                id=firma_id,
                content_type=content_type,
                object_id=politica.id
            )
        except FirmaDigital.DoesNotExist:
            return Response(
                {'detail': 'Firma no encontrada para esta política'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Validar que la firma esté pendiente
        if firma.estado != 'PENDIENTE':
            return Response(
                {'detail': f'La firma ya está en estado {firma.estado}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validar que el usuario puede firmar
        puede_firmar = (
            request.user.cargo_id == firma.cargo_id or
            request.user.is_superuser or
            request.user.is_staff
        )
        if not puede_firmar:
            return Response(
                {'detail': f'No tiene permisos para firmar como {firma.cargo.name}'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Verificar firma secuencial si aplica
        config_flujo = firma.configuracion_flujo
        if config_flujo and config_flujo.tipo_flujo == 'SECUENCIAL':
            # Verificar que todas las firmas anteriores estén completadas
            firmas_anteriores_pendientes = FirmaDigital.objects.filter(
                content_type=content_type,
                object_id=politica.id,
                orden__lt=firma.orden,
                estado='PENDIENTE'
            ).exists()

            if firmas_anteriores_pendientes:
                return Response(
                    {
                        'detail': 'Debe esperar a que se completen las firmas anteriores',
                        'su_orden': firma.orden
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

        # Registrar la firma
        ip_address = self._get_client_ip(request)
        user_agent = request.META.get('HTTP_USER_AGENT', '')

        import hashlib
        import json

        # Calcular hash de la firma
        firma_data = {
            'firma_id': str(firma.id),
            'usuario_id': request.user.id,
            'fecha_firma': timezone.now().isoformat(),
            'firma_imagen': firma_imagen[:100],  # Primeros 100 chars
        }
        firma_hash = hashlib.sha256(
            json.dumps(firma_data, sort_keys=True).encode('utf-8')
        ).hexdigest()

        # Actualizar la firma
        firma.usuario = request.user
        firma.firma_imagen = firma_imagen
        firma.firma_hash = firma_hash
        firma.estado = 'FIRMADO'
        firma.fecha_firma = timezone.now()
        firma.ip_address = ip_address
        firma.user_agent = user_agent
        if comentarios:
            firma.comentarios = comentarios
        firma.save()

        # GESTIÓN DE NOTIFICACIONES POST-FIRMA
        from apps.audit_system.centro_notificaciones.models import Notificacion
        from apps.audit_system.centro_notificaciones.utils import (
            enviar_notificacion,
            notificar_cargo,
            notificar_politica_aprobacion_pendiente,
            notificar_politica_aprobada
        )

        import logging
        logger = logging.getLogger(__name__)

        # 1. Archivar notificación de firma pendiente del usuario actual
        try:
            Notificacion.objects.filter(
                usuario=request.user,
                datos_extra__firma_id=str(firma.id),
                esta_archivada=False
            ).update(
                esta_leida=True,
                esta_archivada=True,
                fecha_lectura=timezone.now()
            )
        except Exception:
            pass

        # Verificar estado general del proceso de firmas
        firmas_pendientes = FirmaDigital.objects.filter(
            content_type=content_type,
            object_id=politica.id,
            estado='PENDIENTE'
        ).order_by('orden')

        firmas_completadas = FirmaDigital.objects.filter(
            content_type=content_type,
            object_id=politica.id,
            estado='FIRMADO'
        ).count()

        total_firmas = FirmaDigital.objects.filter(
            content_type=content_type,
            object_id=politica.id
        ).count()

        proceso_completado = not firmas_pendientes.exists()

        # 2. Notificar al siguiente firmante si es secuencial y hay más pasos
        if not proceso_completado and config_flujo.tipo_flujo == 'SECUENCIAL':
            siguiente_firma = firmas_pendientes.first()
            if siguiente_firma and siguiente_firma.cargo:
                fecha_limite = timezone.now() + timezone.timedelta(days=7)
                try:
                    if siguiente_firma.rol_firma == 'APROBO':
                        notificar_politica_aprobacion_pendiente(
                            politica=politica,
                            cargo_aprobador=siguiente_firma.cargo,
                            usuario_revisor=request.user
                        )
                    else:
                        notificar_cargo(
                            cargo=siguiente_firma.cargo,
                            tipo='FIRMA_REQUERIDA',
                            asunto=f'Firma Requerida: {politica.title}',
                            mensaje=(
                                f'Es su turno para firmar la política "{politica.title}" '
                                f'como {siguiente_firma.get_rol_firma_display()}. '
                                f'Tiene hasta el {fecha_limite.strftime("%d/%m/%Y")} para firmar.'
                            ),
                            link=f'/gestion-estrategica/identidad?politica={politica.id}',
                            prioridad='ALTA',
                            empresa=politica.identity.empresa if hasattr(politica, 'identity') else None,
                            datos_adicionales={
                                'firma_id': str(siguiente_firma.id),
                                'politica_id': politica.id,
                                'rol_firma': siguiente_firma.rol_firma,
                            }
                        )
                    logger.info(f"Notificación siguiente firmante (cargo '{siguiente_firma.cargo.name}')")
                except Exception as e:
                    logger.warning(f"Error notificando siguiente firmante: {str(e)}")

        # Si el proceso se completó, actualizar política
        if proceso_completado:
            # Determinar el nuevo estado basado en el último rol firmante
            ultima_firma = FirmaDigital.objects.filter(
                content_type=content_type,
                object_id=politica.id,
                estado='FIRMADO'
            ).order_by('-orden').first()

            if ultima_firma:
                if ultima_firma.rol_firma in ['APROBO', 'AUTORIZO']:
                    politica.status = 'POR_CODIFICAR'
                    try:
                        notificar_politica_aprobada(
                            politica=politica,
                            usuario_aprobador=request.user,
                            notificar_creador=True,
                            cargo_codificador=None
                        )
                    except Exception as e:
                        logger.warning(f"Error notificando aprobación: {str(e)}")
                elif ultima_firma.rol_firma == 'REVISO':
                    politica.status = 'EN_APROBACION'
                else:
                    politica.status = 'POR_CODIFICAR'
            else:
                politica.status = 'POR_CODIFICAR'

            politica.save(update_fields=['status', 'updated_at'])

        # Calcular progreso
        progreso = int((firmas_completadas / total_firmas) * 100) if total_firmas > 0 else 0

        return Response({
            'detail': 'Firma registrada exitosamente',
            'firma_id': str(firma.id),
            'firma_estado': firma.estado,
            'proceso_completado': proceso_completado,
            'progreso': progreso,
            'politica_status': politica.status
        })

    @action(detail=True, methods=['post'], url_path='rechazar-firma')
    def rechazar_firma(self, request, pk=None):
        """
        Rechaza una firma y cancela el proceso de firma.

        Fase 0.3.4: Usa FirmaDigital directamente.

        Body:
        - firma_id: ID de la FirmaDigital a rechazar
        - motivo: Motivo del rechazo (mínimo 10 caracteres)
        """
        politica = self.get_object()

        serializer = RechazarFirmaPoliticaSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        firma_id = serializer.validated_data['firma_id']
        motivo = serializer.validated_data['motivo']

        # Obtener la firma digital
        content_type = ContentType.objects.get_for_model(politica)
        try:
            firma = FirmaDigital.objects.select_related('cargo').get(
                id=firma_id,
                content_type=content_type,
                object_id=politica.id
            )
        except FirmaDigital.DoesNotExist:
            return Response(
                {'detail': 'Firma no encontrada para esta política'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Validar que la firma esté pendiente
        if firma.estado != 'PENDIENTE':
            return Response(
                {'detail': f'La firma ya está en estado {firma.estado}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validar que el usuario puede rechazar
        puede_rechazar = (
            request.user.cargo_id == firma.cargo_id or
            request.user.is_superuser or
            request.user.is_staff
        )
        if not puede_rechazar:
            return Response(
                {'detail': f'No tiene permisos para rechazar como {firma.cargo.name}'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Rechazar la firma
        firma.estado = 'RECHAZADO'
        firma.usuario = request.user
        firma.comentarios = f'RECHAZADO: {motivo}'
        firma.save()

        # Marcar todas las demás firmas como expiradas
        FirmaDigital.objects.filter(
            content_type=content_type,
            object_id=politica.id,
            estado='PENDIENTE'
        ).update(estado='EXPIRADO')

        # La política pasa a estado RECHAZADO
        politica.status = 'RECHAZADO'
        politica.save(update_fields=['status', 'updated_at'])

        # Notificar al creador sobre el rechazo
        from apps.audit_system.centro_notificaciones.utils import notificar_politica_rechazada
        import logging
        logger = logging.getLogger(__name__)

        try:
            notificar_politica_rechazada(
                politica=politica,
                usuario_que_rechazo=request.user,
                motivo_rechazo=motivo,
                usuario_creador=getattr(politica, 'created_by', None)
            )
        except Exception as e:
            logger.warning(f"Error notificando rechazo de política: {str(e)}")

        return Response({
            'detail': 'Firma rechazada. El proceso de firma ha sido cancelado.',
            'firma_id': str(firma.id),
            'firma_estado': firma.estado,
            'motivo': motivo,
            'politica_status': politica.status
        })

    @action(detail=True, methods=['get'], url_path='proceso-firma')
    def proceso_firma(self, request, pk=None):
        """
        Obtiene el estado actual del proceso de firma de una política.

        Fase 0.3.4: Usa FirmaDigital directamente.

        Retorna:
        - Lista de firmas con su estado
        - Progreso del proceso
        """
        politica = self.get_object()

        content_type = ContentType.objects.get_for_model(politica)
        firmas = FirmaDigital.objects.filter(
            content_type=content_type,
            object_id=politica.id
        ).select_related('cargo', 'usuario').order_by('orden')

        if not firmas.exists():
            return Response(
                {'detail': 'No hay proceso de firma para esta política'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Calcular estadísticas
        total = firmas.count()
        firmadas = firmas.filter(estado='FIRMADO').count()
        pendientes = firmas.filter(estado='PENDIENTE').count()
        rechazadas = firmas.filter(estado='RECHAZADO').count()

        progreso = int((firmadas / total) * 100) if total > 0 else 0

        # Determinar estado del proceso
        if rechazadas > 0:
            estado_proceso = 'RECHAZADO'
        elif pendientes == 0:
            estado_proceso = 'COMPLETADO'
        else:
            estado_proceso = 'EN_PROCESO'

        # Preparar lista de firmas
        firmas_data = []
        for firma in firmas:
            firmas_data.append({
                'id': str(firma.id),
                'orden': firma.orden,
                'rol_firma': firma.rol_firma,
                'rol_display': firma.get_rol_firma_display(),
                'cargo': firma.cargo.name if firma.cargo else None,
                'usuario': firma.usuario.get_full_name() if firma.usuario else None,
                'estado': firma.estado,
                'fecha_firma': firma.fecha_firma.isoformat() if firma.fecha_firma else None,
                'comentarios': firma.comentarios,
            })

        return Response({
            'politica_id': politica.id,
            'politica_title': politica.title,
            'politica_status': politica.status,
            'estado': estado_proceso,
            'progreso': progreso,
            'total_firmas': total,
            'firmas_completadas': firmadas,
            'firmas_pendientes': pendientes,
            'firmas_rechazadas': rechazadas,
            'firmas': firmas_data,
        })

    def _get_client_ip(self, request):
        """Obtiene la IP del cliente"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip

    # =========================================================================
    # INTEGRACIÓN CON GESTOR DOCUMENTAL
    # =========================================================================

    @action(detail=True, methods=['post'], url_path='enviar-a-documental')
    def enviar_a_documental(self, request, pk=None):
        """
        Envía una política firmada al Gestor Documental para codificación y publicación.

        Fase 0.3.4: Verifica firmas usando FirmaDigital.

        Flujo AUTOMÁTICO completo:
        1. IDENTIDAD: Crear política → Enviar a firma → Completar firmas
        2. Este endpoint: Valida → Envía automáticamente al Gestor Documental
        3. GESTOR DOCUMENTAL: Asigna código → Crea documento → Publica
        4. CALLBACK: Actualiza la política a VIGENTE con código oficial

        Requisitos:
        - La política debe estar en estado EN_REVISION o POR_CODIFICAR
        - Todas las firmas deben estar completadas

        Body (opcional):
        - clasificacion: 'PUBLICO' | 'INTERNO' | 'CONFIDENCIAL' | 'RESTRINGIDO'
        - areas_aplicacion: [lista de IDs de áreas]
        - observaciones: texto libre
        """
        from .services import GestorDocumentalService

        politica = self.get_object()

        # Validar estado actual
        if politica.status not in ['EN_REVISION', 'POR_CODIFICAR']:
            return Response(
                {
                    'detail': 'Solo se pueden enviar políticas que están en revisión o por codificar',
                    'status_actual': politica.status
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # Fase 0.3.4: Verificar firmas con FirmaDigital
        content_type = ContentType.objects.get_for_model(politica)
        firmas = FirmaDigital.objects.filter(
            content_type=content_type,
            object_id=politica.id
        )

        if not firmas.exists():
            return Response(
                {'detail': 'No se encontraron firmas para esta política'},
                status=status.HTTP_400_BAD_REQUEST
            )

        firmas_pendientes = firmas.filter(estado='PENDIENTE').count()
        firmas_rechazadas = firmas.filter(estado='RECHAZADO').count()

        if firmas_rechazadas > 0:
            return Response(
                {
                    'detail': 'El proceso de firma fue rechazado',
                    'firmas_rechazadas': firmas_rechazadas
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        if firmas_pendientes > 0:
            total = firmas.count()
            firmadas = firmas.filter(estado='FIRMADO').count()
            progreso = int((firmadas / total) * 100) if total > 0 else 0
            return Response(
                {
                    'detail': 'El proceso de firma aún no está completado',
                    'progreso': progreso,
                    'firmas_pendientes': firmas_pendientes
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

        serializer = EnviarADocumentalSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Actualizar estado de la política a FIRMADO (antes de enviar)
        politica.status = 'FIRMADO'
        politica.save(update_fields=['status', 'updated_at'])

        try:
            # Fase 0.3.4: Enviar al Gestor Documental usando FirmaDigital
            resultado = GestorDocumentalService.enviar_politica_a_documental(
                politica=politica,
                firmas_digitales=list(firmas.filter(estado='FIRMADO')),
                request_user=request.user,
                clasificacion=serializer.validated_data.get('clasificacion', 'INTERNO'),
                areas_aplicacion=serializer.validated_data.get('areas_aplicacion', []),
                observaciones=serializer.validated_data.get('observaciones', '')
            )

            # Refrescar la política para obtener los datos actualizados
            politica.refresh_from_db()

            return Response({
                'detail': 'Política enviada, codificada y publicada exitosamente',
                'politica': {
                    'id': politica.id,
                    'status': politica.status,
                    'code': politica.code,
                    'effective_date': politica.effective_date,
                },
                'documento': {
                    'id': resultado['documento_id'],
                    'codigo': resultado['codigo'],
                    'estado': resultado['estado'],
                    'version': resultado['version'],
                    'fecha_publicacion': resultado['fecha_publicacion'],
                    'url': resultado['url_documento'],
                },
                'es_actualizacion': resultado['es_actualizacion'],
                'total_firmas_registradas': resultado['total_firmas_registradas'],
            }, status=status.HTTP_201_CREATED)

        except ValueError as e:
            # Revertir estado si falla la validación
            politica.status = 'EN_REVISION'
            politica.save(update_fields=['status', 'updated_at'])
            return Response(
                {'detail': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            # Revertir estado si falla el envío
            politica.status = 'EN_REVISION'
            politica.save(update_fields=['status', 'updated_at'])
            return Response(
                {
                    'detail': 'Error al enviar la política al Gestor Documental',
                    'error': str(e)
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
