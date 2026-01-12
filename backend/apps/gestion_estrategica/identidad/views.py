"""
Views del módulo Identidad Corporativa - Dirección Estratégica

ViewSets para:
- CorporateIdentity: Identidad corporativa (misión, visión)
- CorporateValue: Valores corporativos
- AlcanceSistema: Alcance del sistema de gestión
- PoliticaIntegral: Política integral con versionamiento
- PoliticaEspecifica: Políticas específicas por área/módulo
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
from .models import (
    CorporateIdentity, CorporateValue, AlcanceSistema,
    PoliticaIntegral, PoliticaEspecifica
)
from .serializers import (
    CorporateIdentitySerializer,
    CorporateIdentityCreateUpdateSerializer,
    CorporateValueSerializer,
    AlcanceSistemaSerializer,
    AlcanceSistemaCreateUpdateSerializer,
    PoliticaIntegralSerializer,
    PoliticaIntegralCreateUpdateSerializer,
    SignPoliticaIntegralSerializer,
    PublishPoliticaIntegralSerializer,
    PoliticaEspecificaSerializer,
    PoliticaEspecificaCreateUpdateSerializer,
    ApprovePoliticaEspecificaSerializer,
    IniciarFirmaPoliticaSerializer,
    FirmarPoliticaSerializer,
    RechazarFirmaPoliticaSerializer,
    ProcesoFirmaPoliticaSerializer,
    EnviarADocumentalSerializer,
)
from .models_workflow_firmas import (
    ConfiguracionFlujoFirma,
    ProcesoFirmaPolitica,
    FirmaPolitica,
    HistorialFirmaPolitica,
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
    """

    queryset = CorporateIdentity.objects.select_related(
        'empresa', 'created_by', 'updated_by'
    ).prefetch_related(
        'values', 'alcances', 'politicas_especificas', 'politicas_integrales'
    ).all()
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['is_active', 'version']
    search_fields = ['mission', 'vision']
    ordering_fields = ['effective_date', 'version', 'created_at']
    ordering = ['-effective_date']

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

        # Obtener política integral vigente
        politica_integral = identity.politicas_integrales.filter(
            is_active=True, status='VIGENTE'
        ).first()

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
                'signed_by_name': politica_integral.signed_by.get_full_name() if politica_integral and politica_integral.signed_by else None,
                'signed_at': politica_integral.signed_at if politica_integral else None,
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

        Este endpoint está deprecado. Usar PoliticaIntegralViewSet.sign() en su lugar:
        POST /api/v1/identidad/politicas-integrales/{id}/sign/

        Se mantiene por compatibilidad pero retorna un mensaje de redirección.
        """
        return Response(
            {
                'detail': 'Este endpoint está deprecado.',
                'message': 'La firma de políticas integrales ahora se realiza desde el gestor de políticas.',
                'redirect': '/api/v1/identidad/politicas-integrales/{id}/sign/',
                'deprecated_since': 'v3.0',
            },
            status=status.HTTP_410_GONE
        )

    @action(detail=True, methods=['get'])
    def dashboard(self, request, pk=None):
        """Retorna estadísticas de la identidad corporativa"""
        identity = self.get_object()

        # Obtener política integral vigente
        politica_vigente = identity.politicas_integrales.filter(
            is_active=True, status='VIGENTE'
        ).first()

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
                'integrales': identity.politicas_integrales.filter(is_active=True).count(),
                'integrales_vigentes': identity.politicas_integrales.filter(
                    is_active=True, status='VIGENTE'
                ).count(),
                'integral_is_signed': politica_vigente.is_signed if politica_vigente else False,
                'especificas': identity.politicas_especificas.filter(is_active=True).count(),
                'especificas_vigentes': identity.politicas_especificas.filter(
                    is_active=True, status='VIGENTE'
                ).count(),
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
    """

    queryset = CorporateValue.objects.select_related('identity').all()
    serializer_class = CorporateValueSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['identity', 'is_active']
    search_fields = ['name', 'description']
    ordering_fields = ['orden', 'name', 'created_at']
    ordering = ['orden', 'name']


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
    """

    queryset = AlcanceSistema.objects.select_related('identity', 'created_by').all()
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['identity', 'norma_iso', 'is_certified', 'is_active']
    search_fields = ['scope', 'exclusions', 'certification_body', 'certificate_number']
    ordering_fields = ['norma_iso', 'certification_date', 'expiry_date', 'created_at']
    ordering = ['norma_iso']

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


class PoliticaIntegralViewSet(StandardViewSetMixin, OrderingMixin, viewsets.ModelViewSet):
    """
    ViewSet para gestionar Políticas Integrales.

    Endpoints:
    - GET /politicas-integrales/ - Lista de políticas
    - POST /politicas-integrales/ - Crear nueva política
    - GET /politicas-integrales/{id}/ - Detalle de política
    - PUT/PATCH /politicas-integrales/{id}/ - Actualizar política
    - DELETE /politicas-integrales/{id}/ - Eliminar política
    - GET /politicas-integrales/current/ - Política vigente actual
    - POST /politicas-integrales/{id}/sign/ - Firmar política
    - POST /politicas-integrales/{id}/publish/ - Publicar política
    - POST /politicas-integrales/{id}/toggle-active/ - Toggle estado activo
    """

    queryset = PoliticaIntegral.objects.select_related(
        'identity', 'signed_by', 'created_by'
    ).all()
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['identity', 'status', 'is_active']
    search_fields = ['title', 'content', 'version']
    ordering_fields = ['version', 'effective_date', 'created_at', 'orden']
    ordering = ['-version']

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return PoliticaIntegralCreateUpdateSerializer
        return PoliticaIntegralSerializer

    @action(detail=False, methods=['get'])
    def current(self, request):
        """Obtiene la política integral vigente actual"""
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

        politica = PoliticaIntegral.get_current(identity)
        if politica:
            serializer = PoliticaIntegralSerializer(politica)
            return Response(serializer.data)

        return Response(
            {'detail': 'No hay política integral vigente'},
            status=status.HTTP_404_NOT_FOUND
        )

    @action(detail=True, methods=['post'])
    def sign(self, request, pk=None):
        """Firma digitalmente la política integral"""
        politica = self.get_object()

        serializer = SignPoliticaIntegralSerializer(data=request.data)
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
            'signed_at': politica.signed_at,
            'signature_hash': politica.signature_hash
        })

    @action(detail=True, methods=['post'])
    def publish(self, request, pk=None):
        """Publica la política integral (la pone como VIGENTE)"""
        politica = self.get_object()

        serializer = PublishPoliticaIntegralSerializer(data=request.data)
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
            'effective_date': politica.effective_date
        })

    @action(detail=False, methods=['get'])
    def versions(self, request):
        """Lista de versiones de una política"""
        identity_id = request.query_params.get('identity')
        if not identity_id:
            return Response(
                {'detail': 'Se requiere el parámetro identity'},
                status=status.HTTP_400_BAD_REQUEST
            )

        queryset = self.get_queryset().filter(identity_id=identity_id)
        serializer = PoliticaIntegralSerializer(queryset, many=True)
        return Response(serializer.data)


class PoliticaEspecificaViewSet(
    StandardViewSetMixin, OrderingMixin, ValidateBeforeDeleteMixin, viewsets.ModelViewSet
):
    """
    ViewSet para gestionar Políticas Específicas.

    Endpoints:
    - GET /politicas-especificas/ - Lista de políticas
    - POST /politicas-especificas/ - Crear nueva política
    - GET /politicas-especificas/{id}/ - Detalle de política
    - PUT/PATCH /politicas-especificas/{id}/ - Actualizar política
    - DELETE /politicas-especificas/{id}/ - Eliminar política
    - POST /politicas-especificas/{id}/approve/ - Aprobar política
    - GET /politicas-especificas/by-standard/ - Por norma ISO
    - GET /politicas-especificas/pending-review/ - Pendientes de revisión
    - POST /politicas-especificas/{id}/toggle-active/ - Toggle estado activo
    """

    queryset = PoliticaEspecifica.objects.select_related(
        'identity', 'area', 'responsible', 'responsible_cargo',
        'approved_by', 'created_by'
    ).all()
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['identity', 'norma_iso', 'status', 'area', 'is_active']
    search_fields = ['code', 'title', 'content', 'keywords']
    ordering_fields = ['code', 'norma_iso', 'status', 'effective_date', 'orden', 'created_at']
    ordering = ['norma_iso', 'orden', 'code']

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

        El proceso de firma:
        1. Crea un ProcesoFirmaPolitica
        2. Crea las FirmaPolitica según los pasos del flujo configurado
        3. Cambia el estado de la política a EN_REVISION
        4. Notifica a los firmantes (si está configurado)

        Body:
        - flujo_firma_id (opcional): ID del flujo de firma a usar
        """
        politica = self.get_object()

        # Validar estado actual
        if politica.status not in ['BORRADOR', 'EN_REVISION']:
            return Response(
                {'detail': 'Solo se pueden enviar a firma políticas en borrador o en revisión'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Verificar que no tenga un proceso de firma activo
        proceso_activo = ProcesoFirmaPolitica.objects.filter(
            politica_especifica=politica,
            estado='EN_PROCESO'
        ).first()

        if proceso_activo:
            return Response(
                {
                    'detail': 'La política ya tiene un proceso de firma activo',
                    'proceso_id': proceso_activo.id,
                    'progreso': proceso_activo.progreso_porcentaje
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = IniciarFirmaPoliticaSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # =====================================================================
        # DETERMINAR MODO: MANUAL o AUTOMÁTICO
        # =====================================================================
        firmantes_manuales = serializer.validated_data.get('firmantes', [])
        flujo_firma_id = serializer.validated_data.get('flujo_firma_id')

        from apps.core.models import Cargo
        from django.utils import timezone
        from django.contrib.auth import get_user_model
        User = get_user_model()

        # Determinar si usamos modo manual o automático
        modo_manual = len(firmantes_manuales) > 0

        if modo_manual:
            # =====================================================================
            # MODO MANUAL: Firmantes seleccionados por el usuario
            # =====================================================================
            # El usuario actual es automáticamente ELABORO (paso 1)
            # Los firmantes seleccionados son REVISO y APROBO (pasos 2, 3, ...)

            # Obtener o crear un flujo de firma "manual" para referencia
            flujo_firma, _ = ConfiguracionFlujoFirma.objects.get_or_create(
                nombre='Flujo Manual - Políticas',
                tipo_politica='ESPECIFICA',
                defaults={
                    'descripcion': 'Flujo de firma con selección manual de firmantes',
                    'es_activo': True,
                    'requiere_firma_secuencial': True,
                    'pasos_firma': [],  # Los pasos se definen al vuelo
                }
            )

            # Crear proceso de firma
            proceso = ProcesoFirmaPolitica.objects.create(
                tipo_politica='ESPECIFICA',
                politica_especifica=politica,
                flujo_firma=flujo_firma,
                estado='EN_PROCESO',
                paso_actual=1,
                iniciado_por=request.user,
            )

            firmas_creadas = []

            # PASO 1: ELABORO es el usuario actual
            fecha_limite = timezone.now() + timezone.timedelta(days=7)
            firma_elaboro = FirmaPolitica.objects.create(
                proceso_firma=proceso,
                orden=1,
                rol_firmante='ELABORO',
                cargo=request.user.cargo,  # Cargo del creador
                usuario=request.user,       # Usuario específico
                estado='PENDIENTE',
                fecha_limite=fecha_limite,
            )
            firmas_creadas.append(firma_elaboro)

            HistorialFirmaPolitica.objects.create(
                firma=firma_elaboro,
                accion='ASIGNADO',
                usuario=request.user,
                detalles={
                    'cargo_id': request.user.cargo_id,
                    'cargo_nombre': request.user.cargo.name if request.user.cargo else 'N/A',
                    'rol_firmante': 'ELABORO',
                    'usuario_asignado_id': request.user.id,
                    'usuario_asignado_nombre': request.user.get_full_name() or request.user.username,
                    'modo': 'manual',
                },
                ip_address=self._get_client_ip(request)
            )

            # PASOS 2+: Firmantes seleccionados manualmente
            orden_mapping = {
                'REVISO_TECNICO': 2,
                'REVISO_JURIDICO': 2,
                'APROBO_DIRECTOR': 3,
                'APROBO_GERENTE': 3,
                'APROBO_REPRESENTANTE_LEGAL': 4,
            }

            for firmante_data in firmantes_manuales:
                usuario = User.objects.get(id=firmante_data['usuario_id'])
                rol = firmante_data['rol_firmante']
                orden = orden_mapping.get(rol, 2)

                firma = FirmaPolitica.objects.create(
                    proceso_firma=proceso,
                    orden=orden,
                    rol_firmante=rol,
                    cargo=usuario.cargo,
                    usuario=usuario,  # Usuario específico seleccionado
                    estado='PENDIENTE',
                    fecha_limite=timezone.now() + timezone.timedelta(days=7),
                )
                firmas_creadas.append(firma)

                HistorialFirmaPolitica.objects.create(
                    firma=firma,
                    accion='ASIGNADO',
                    usuario=request.user,
                    detalles={
                        'cargo_id': usuario.cargo_id,
                        'cargo_nombre': usuario.cargo.name if usuario.cargo else 'N/A',
                        'rol_firmante': rol,
                        'usuario_asignado_id': usuario.id,
                        'usuario_asignado_nombre': usuario.get_full_name() or usuario.username,
                        'modo': 'manual',
                        'asignado_por': request.user.get_full_name() or request.user.username,
                    },
                    ip_address=self._get_client_ip(request)
                )

            # Reordenar firmas por orden
            firmas_creadas.sort(key=lambda f: f.orden)

        else:
            # =====================================================================
            # MODO AUTOMÁTICO: Flujo de firma predefinido por cargos
            # =====================================================================
            if flujo_firma_id:
                try:
                    flujo_firma = ConfiguracionFlujoFirma.objects.get(
                        id=flujo_firma_id,
                        tipo_politica='ESPECIFICA',
                        es_activo=True
                    )
                except ConfiguracionFlujoFirma.DoesNotExist:
                    return Response(
                        {'detail': 'Flujo de firma no encontrado o no válido'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            else:
                # Buscar flujo por defecto para políticas específicas
                flujo_firma = ConfiguracionFlujoFirma.objects.filter(
                    tipo_politica='ESPECIFICA',
                    es_activo=True
                ).first()

                if not flujo_firma:
                    return Response(
                        {'detail': 'No hay un flujo de firma configurado. Use firmantes manuales o configure un flujo.'},
                        status=status.HTTP_400_BAD_REQUEST
                    )

            # Validar que el flujo tenga pasos
            if not flujo_firma.pasos_firma:
                return Response(
                    {'detail': 'El flujo de firma no tiene pasos configurados'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Crear proceso de firma
            proceso = ProcesoFirmaPolitica.objects.create(
                tipo_politica='ESPECIFICA',
                politica_especifica=politica,
                flujo_firma=flujo_firma,
                estado='EN_PROCESO',
                paso_actual=1,
                iniciado_por=request.user,
            )

            # Crear firmas según los pasos del flujo
            firmas_creadas = []
            for paso in flujo_firma.pasos_firma:
                try:
                    cargo = Cargo.objects.get(id=paso['rol_cargo_id'])
                except (Cargo.DoesNotExist, KeyError):
                    # Si no se encuentra el cargo, usar cargo genérico o saltar
                    continue

                # Calcular fecha límite (7 días por defecto)
                fecha_limite = timezone.now() + timezone.timedelta(days=7)

                firma = FirmaPolitica.objects.create(
                    proceso_firma=proceso,
                    orden=paso['orden'],
                    rol_firmante=paso['rol_firmante'],
                    cargo=cargo,
                    estado='PENDIENTE',
                    fecha_limite=fecha_limite,
                )
                firmas_creadas.append(firma)

                # Registrar en historial
                HistorialFirmaPolitica.objects.create(
                    firma=firma,
                    accion='ASIGNADO',
                    usuario=request.user,
                    detalles={
                        'cargo_id': cargo.id,
                        'cargo_nombre': cargo.name,
                        'rol_firmante': paso['rol_firmante'],
                        'modo': 'automatico',
                    },
                    ip_address=self._get_client_ip(request)
                )

        # Actualizar estado de la política
        politica.status = 'EN_REVISION'
        politica.save(update_fields=['status', 'updated_at'])

        # =====================================================================
        # NOTIFICAR A LOS FIRMANTES
        # =====================================================================
        # Enviar notificación (email + in-app) a cada firmante cuyo turno aplique
        # Para firmas secuenciales, solo notificar al primer firmante
        # Para firmas paralelas, notificar a todos
        # En modo manual, notificar al usuario específico asignado
        from apps.audit_system.centro_notificaciones.utils import enviar_notificacion

        import logging
        logger = logging.getLogger(__name__)

        for firma in firmas_creadas:
            # Si es secuencial, solo notificar si es el primer paso (orden 1)
            if flujo_firma.requiere_firma_secuencial and firma.orden != 1:
                continue

            # Determinar a quién notificar
            if modo_manual and firma.usuario:
                # MODO MANUAL: Notificar al usuario específico asignado
                usuarios_a_notificar = [firma.usuario]
            else:
                # MODO AUTOMÁTICO: Notificar a todos los usuarios con el cargo
                usuarios_a_notificar = list(User.objects.filter(
                    cargo_id=firma.cargo_id,
                    is_active=True
                ))

            for usuario in usuarios_a_notificar:
                try:
                    enviar_notificacion(
                        destinatario=usuario,
                        tipo='FIRMA_REQUERIDA',
                        asunto=f'Firma Requerida: {politica.title}',
                        mensaje=(
                            f'Se requiere su firma para la política "{politica.title}" '
                            f'como {firma.get_rol_firmante_display()}. '
                            f'Tiene hasta el {firma.fecha_limite.strftime("%d/%m/%Y")} para firmar.'
                        ),
                        link=f'/gestion-estrategica/identidad?politica={politica.id}',
                        prioridad='ALTA',
                        datos_adicionales={
                            'firma_id': firma.id,
                            'politica_id': politica.id,
                            'proceso_id': proceso.id,
                            'rol_firmante': firma.rol_firmante,
                        }
                    )
                    logger.info(f"Notificación de firma enviada a {usuario.username} para política {politica.id}")
                except Exception as e:
                    # Loggear error pero no fallar el proceso
                    logger.warning(f"Error notificando a {usuario.username}: {str(e)}")

        return Response({
            'detail': 'Proceso de firma iniciado exitosamente',
            'proceso_id': proceso.id,
            'total_firmas': len(firmas_creadas),
            'politica_status': politica.status,
            'proceso': ProcesoFirmaPoliticaSerializer(proceso).data
        }, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def firmar(self, request, pk=None):
        """
        Registra una firma en el proceso de firma de la política.

        Body:
        - firma_id: ID de la firma a completar
        - firma_imagen: Imagen de la firma en Base64
        - comentarios (opcional): Comentarios del firmante
        """
        politica = self.get_object()

        serializer = FirmarPoliticaSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        firma_id = serializer.validated_data['firma_id']
        firma_imagen = serializer.validated_data['firma_imagen']
        comentarios = serializer.validated_data.get('comentarios', '')

        # Obtener la firma
        try:
            firma = FirmaPolitica.objects.select_related(
                'proceso_firma', 'cargo'
            ).get(
                id=firma_id,
                proceso_firma__politica_especifica=politica
            )
        except FirmaPolitica.DoesNotExist:
            return Response(
                {'detail': 'Firma no encontrada para esta política'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Validar que el usuario puede firmar
        # El usuario debe tener asignado el cargo requerido para la firma
        puede_firmar = (
            request.user.cargo_id == firma.cargo_id or
            # También permitir si el usuario es superuser o staff
            request.user.is_superuser or
            request.user.is_staff
        )
        if not puede_firmar:
            return Response(
                {'detail': f'No tiene permisos para firmar como {firma.cargo.name}'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Verificar firma secuencial si aplica
        proceso = firma.proceso_firma
        if proceso.flujo_firma.requiere_firma_secuencial:
            if firma.orden != proceso.paso_actual:
                return Response(
                    {
                        'detail': f'Debe esperar a que se complete el paso {proceso.paso_actual} antes de firmar',
                        'paso_actual': proceso.paso_actual,
                        'su_paso': firma.orden
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

        # Registrar la firma
        try:
            firma.firmar(
                usuario=request.user,
                firma_base64=firma_imagen,
                ip_address=self._get_client_ip(request),
                user_agent=request.META.get('HTTP_USER_AGENT', ''),
                comentarios=comentarios
            )
        except Exception as e:
            return Response(
                {'detail': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Registrar en historial
        HistorialFirmaPolitica.objects.create(
            firma=firma,
            accion='FIRMADO',
            usuario=request.user,
            detalles={
                'firma_hash': firma.firma_hash,
            },
            ip_address=self._get_client_ip(request)
        )

        # Refrescar proceso
        proceso.refresh_from_db()

        # =====================================================================
        # GESTIÓN DE NOTIFICACIONES POST-FIRMA
        # =====================================================================
        from apps.audit_system.centro_notificaciones.models import Notificacion
        from apps.audit_system.centro_notificaciones.utils import enviar_notificacion
        from django.contrib.auth import get_user_model
        User = get_user_model()

        # 1. Archivar notificación de firma pendiente del usuario actual
        try:
            notifs_archivadas = Notificacion.objects.filter(
                usuario=request.user,
                datos_extra__firma_id=firma.id,
                esta_archivada=False
            ).update(
                esta_leida=True,
                esta_archivada=True,
                fecha_lectura=timezone.now()
            )
        except Exception:
            pass  # No es crítico

        # 2. Notificar al siguiente firmante si es secuencial y hay más pasos
        if proceso.estado == 'EN_PROCESO' and proceso.flujo_firma.requiere_firma_secuencial:
            # Obtener la siguiente firma pendiente
            siguiente_firma = FirmaPolitica.objects.filter(
                proceso_firma=proceso,
                estado='PENDIENTE',
                orden=proceso.paso_actual
            ).first()

            if siguiente_firma:
                # Notificar a usuarios con el cargo del siguiente firmante
                usuarios_cargo = User.objects.filter(
                    cargo_id=siguiente_firma.cargo_id,
                    is_active=True
                )

                for usuario in usuarios_cargo:
                    try:
                        enviar_notificacion(
                            destinatario=usuario,
                            tipo='FIRMA_REQUERIDA',
                            asunto=f'Firma Requerida: {politica.title}',
                            mensaje=(
                                f'Es su turno para firmar la política "{politica.title}" '
                                f'como {siguiente_firma.get_rol_firmante_display()}. '
                                f'Tiene hasta el {siguiente_firma.fecha_limite.strftime("%d/%m/%Y")} para firmar.'
                            ),
                            link=f'/gestion-estrategica/identidad?politica={politica.id}',
                            prioridad='ALTA',
                            datos_adicionales={
                                'firma_id': siguiente_firma.id,
                                'politica_id': politica.id,
                                'proceso_id': proceso.id,
                                'rol_firmante': siguiente_firma.rol_firmante,
                            }
                        )
                    except Exception as e:
                        import logging
                        logger = logging.getLogger(__name__)
                        logger.warning(f"Error notificando siguiente firmante {usuario.username}: {str(e)}")

        # Si el proceso se completó, actualizar política
        if proceso.estado == 'COMPLETADO':
            politica.status = 'FIRMADO'  # Cambiado: FIRMADO en lugar de VIGENTE
            # VIGENTE se asigna cuando se envía al Gestor Documental
            politica.save(update_fields=['status', 'updated_at'])

        return Response({
            'detail': 'Firma registrada exitosamente',
            'firma_id': firma.id,
            'firma_estado': firma.estado,
            'proceso_estado': proceso.estado,
            'proceso_progreso': proceso.progreso_porcentaje,
            'politica_status': politica.status
        })

    @action(detail=True, methods=['post'], url_path='rechazar-firma')
    def rechazar_firma(self, request, pk=None):
        """
        Rechaza una firma y devuelve el proceso de firma.

        Body:
        - firma_id: ID de la firma a rechazar
        - motivo: Motivo del rechazo (mínimo 10 caracteres)
        """
        politica = self.get_object()

        serializer = RechazarFirmaPoliticaSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        firma_id = serializer.validated_data['firma_id']
        motivo = serializer.validated_data['motivo']

        # Obtener la firma
        try:
            firma = FirmaPolitica.objects.select_related(
                'proceso_firma', 'cargo'
            ).get(
                id=firma_id,
                proceso_firma__politica_especifica=politica
            )
        except FirmaPolitica.DoesNotExist:
            return Response(
                {'detail': 'Firma no encontrada para esta política'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Validar que el usuario puede rechazar
        if not firma.cargo.usuarios.filter(id=request.user.id).exists():
            return Response(
                {'detail': f'No tiene permisos para rechazar como {firma.cargo.name}'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Rechazar la firma
        try:
            firma.rechazar(request.user, motivo)
        except Exception as e:
            return Response(
                {'detail': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Registrar en historial
        HistorialFirmaPolitica.objects.create(
            firma=firma,
            accion='RECHAZADO',
            usuario=request.user,
            detalles={
                'motivo': motivo,
            },
            ip_address=self._get_client_ip(request)
        )

        # La política vuelve a BORRADOR
        politica.status = 'BORRADOR'
        politica.save(update_fields=['status', 'updated_at'])

        return Response({
            'detail': 'Firma rechazada. El proceso de firma ha sido cancelado.',
            'firma_id': firma.id,
            'firma_estado': firma.estado,
            'motivo': motivo,
            'politica_status': politica.status
        })

    @action(detail=True, methods=['get'], url_path='proceso-firma')
    def proceso_firma(self, request, pk=None):
        """
        Obtiene el estado actual del proceso de firma de una política.

        Retorna:
        - Información del proceso activo o el último completado
        - Lista de firmas con su estado
        - Progreso del proceso
        """
        politica = self.get_object()

        # Buscar proceso activo o el último
        proceso = ProcesoFirmaPolitica.objects.filter(
            politica_especifica=politica
        ).order_by('-fecha_inicio').first()

        if not proceso:
            return Response(
                {'detail': 'No hay proceso de firma para esta política'},
                status=status.HTTP_404_NOT_FOUND
            )

        return Response(ProcesoFirmaPoliticaSerializer(proceso).data)

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

        Flujo AUTOMÁTICO completo:
        1. IDENTIDAD: Crear política → Enviar a firma → Completar firmas
        2. Este endpoint: Valida → Envía automáticamente al Gestor Documental
        3. GESTOR DOCUMENTAL: Asigna código → Crea documento → Publica
        4. CALLBACK: Actualiza la política a VIGENTE con código oficial

        Requisitos:
        - La política debe estar en estado EN_REVISION
        - El proceso de firma debe estar COMPLETADO

        Body (opcional):
        - clasificacion: 'PUBLICO' | 'INTERNO' | 'CONFIDENCIAL' | 'RESTRINGIDO'
        - areas_aplicacion: [lista de IDs de áreas]
        - observaciones: texto libre
        """
        from .services import GestorDocumentalService

        politica = self.get_object()

        # Validar estado actual
        if politica.status not in ['EN_REVISION']:
            return Response(
                {
                    'detail': 'Solo se pueden enviar políticas que están en revisión con firmas completadas',
                    'status_actual': politica.status
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # Verificar que el proceso de firma esté completado
        proceso = ProcesoFirmaPolitica.objects.filter(
            politica_especifica=politica,
            estado='COMPLETADO'
        ).first()

        if not proceso:
            # Verificar si hay proceso activo
            proceso_activo = ProcesoFirmaPolitica.objects.filter(
                politica_especifica=politica,
                estado='EN_PROCESO'
            ).first()

            if proceso_activo:
                return Response(
                    {
                        'detail': 'El proceso de firma aún no está completado',
                        'progreso': proceso_activo.progreso_porcentaje,
                        'firmas_pendientes': proceso_activo.firmas_pendientes
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

            return Response(
                {'detail': 'No se encontró un proceso de firma completado para esta política'},
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
            # Enviar AUTOMÁTICAMENTE al Gestor Documental
            resultado = GestorDocumentalService.enviar_politica_a_documental(
                politica=politica,
                proceso_firma=proceso,
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
