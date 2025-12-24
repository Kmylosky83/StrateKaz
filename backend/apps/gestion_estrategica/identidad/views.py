"""
Views del módulo Identidad Corporativa - Dirección Estratégica
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend

from apps.core.permissions import HasModulePermission
from .models import CorporateIdentity, CorporateValue
from .serializers import (
    CorporateIdentitySerializer,
    CorporateIdentityCreateUpdateSerializer,
    CorporateValueSerializer,
    SignPolicySerializer
)


class CorporateIdentityViewSet(viewsets.ModelViewSet):
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
    """

    queryset = CorporateIdentity.objects.all()
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['is_active', 'version']

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return CorporateIdentityCreateUpdateSerializer
        return CorporateIdentitySerializer

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=False, methods=['get'])
    def active(self, request):
        """Obtiene la identidad corporativa activa"""
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


class CorporateValueViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar los Valores Corporativos.

    Endpoints:
    - GET /valores/ - Lista de valores
    - POST /valores/ - Crear nuevo valor
    - GET /valores/{id}/ - Detalle de valor
    - PUT/PATCH /valores/{id}/ - Actualizar valor
    - DELETE /valores/{id}/ - Eliminar valor
    - POST /valores/reorder/ - Reordenar valores
    """

    queryset = CorporateValue.objects.all()
    serializer_class = CorporateValueSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['identity', 'is_active']

    @action(detail=False, methods=['post'])
    def reorder(self, request):
        """Reordena los valores corporativos"""
        order_data = request.data.get('order', [])

        if not order_data:
            return Response(
                {'detail': 'Se requiere lista de ordenamiento'},
                status=status.HTTP_400_BAD_REQUEST
            )

        for item in order_data:
            value_id = item.get('id')
            new_order = item.get('order')
            if value_id and new_order is not None:
                CorporateValue.objects.filter(id=value_id).update(order=new_order)

        return Response({'detail': 'Valores reordenados exitosamente'})
