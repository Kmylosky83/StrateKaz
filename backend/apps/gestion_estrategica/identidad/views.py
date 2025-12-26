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
    SignPolicySerializer,
    AlcanceSistemaSerializer,
    AlcanceSistemaCreateUpdateSerializer,
    PoliticaIntegralSerializer,
    PoliticaIntegralCreateUpdateSerializer,
    SignPoliticaIntegralSerializer,
    PublishPoliticaIntegralSerializer,
    PoliticaEspecificaSerializer,
    PoliticaEspecificaCreateUpdateSerializer,
    ApprovePoliticaEspecificaSerializer,
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

    queryset = CorporateIdentity.objects.prefetch_related(
        'values', 'alcances', 'politicas_especificas'
    ).all()
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['is_active', 'version']
    search_fields = ['mission', 'vision', 'integral_policy']
    ordering_fields = ['effective_date', 'version', 'created_at']
    ordering = ['-effective_date']

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return CorporateIdentityCreateUpdateSerializer
        return CorporateIdentitySerializer

    @action(detail=False, methods=['get'], permission_classes=[AllowAny])
    def active(self, request):
        """
        Obtiene la identidad corporativa activa.

        NOTA: Este endpoint es público (sin autenticación) porque la identidad
        se puede mostrar en la página de login antes de autenticarse.
        """
        identity = CorporateIdentity.get_active()
        if identity:
            serializer = CorporateIdentitySerializer(identity)
            return Response(serializer.data)
        return Response(
            {'detail': 'No hay identidad corporativa activa'},
            status=status.HTTP_404_NOT_FOUND
        )

    @action(detail=True, methods=['post'])
    def sign(self, request, pk=None):
        """Firma digitalmente la política integral"""
        identity = self.get_object()

        serializer = SignPolicySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        if identity.is_signed:
            return Response(
                {'detail': 'La política ya está firmada'},
                status=status.HTTP_400_BAD_REQUEST
            )

        identity.sign_policy(request.user)

        return Response({
            'detail': 'Política firmada exitosamente',
            'signed_by': request.user.get_full_name(),
            'signed_at': identity.policy_signed_at,
            'signature_hash': identity.policy_signature_hash
        })

    @action(detail=True, methods=['get'])
    def dashboard(self, request, pk=None):
        """Retorna estadísticas de la identidad corporativa"""
        identity = self.get_object()

        return Response({
            'identity_id': identity.id,
            'version': identity.version,
            'is_signed': identity.is_signed,
            'values_count': identity.values.filter(is_active=True).count(),
            'alcances': {
                'total': identity.alcances.filter(is_active=True).count(),
                'certified': identity.alcances.filter(is_active=True, is_certified=True).count(),
            },
            'politicas': {
                'integrales': identity.politicas_integrales.filter(is_active=True).count(),
                'especificas': identity.politicas_especificas.filter(is_active=True).count(),
                'vigentes': identity.politicas_especificas.filter(
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
    filterset_fields = ['identity', 'iso_standard', 'is_certified', 'is_active']
    search_fields = ['scope', 'exclusions', 'certification_body', 'certificate_number']
    ordering_fields = ['iso_standard', 'certification_date', 'expiry_date', 'created_at']
    ordering = ['iso_standard']

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return AlcanceSistemaCreateUpdateSerializer
        return AlcanceSistemaSerializer

    @action(detail=False, methods=['get'], url_path='by-standard')
    def by_standard(self, request):
        """Retorna alcances agrupados por norma ISO"""
        from .models import ISO_STANDARD_CHOICES

        queryset = self.filter_queryset(self.get_queryset())
        result = {}

        for code, label in ISO_STANDARD_CHOICES:
            alcance = queryset.filter(iso_standard=code, is_active=True).first()
            result[code] = {
                'label': label,
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
                    'iso_standard': alcance.iso_standard,
                    'iso_standard_display': alcance.get_iso_standard_display(),
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
    filterset_fields = ['identity', 'iso_standard', 'status', 'area', 'is_active']
    search_fields = ['code', 'title', 'content', 'keywords']
    ordering_fields = ['code', 'iso_standard', 'status', 'effective_date', 'orden', 'created_at']
    ordering = ['iso_standard', 'orden', 'code']

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return PoliticaEspecificaCreateUpdateSerializer
        return PoliticaEspecificaSerializer

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
        """Retorna políticas agrupadas por norma ISO"""
        from .models import ISO_STANDARD_CHOICES

        queryset = self.filter_queryset(self.get_queryset())
        result = {}

        for code, label in ISO_STANDARD_CHOICES:
            politicas = queryset.filter(iso_standard=code, is_active=True)
            result[code] = {
                'label': label,
                'total': politicas.count(),
                'vigentes': politicas.filter(status='VIGENTE').count(),
                'borradores': politicas.filter(status='BORRADOR').count(),
            }

        return Response(result)

    @action(detail=False, methods=['get'], url_path='pending-review')
    def pending_review(self, request):
        """Retorna políticas pendientes de revisión"""
        from django.utils import timezone

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
