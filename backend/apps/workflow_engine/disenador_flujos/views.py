from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone

from .models import (
    CategoriaFlujo,
    PlantillaFlujo,
    NodoFlujo,
    TransicionFlujo,
    CampoFormulario,
    RolFlujo
)
from .serializers import (
    CategoriaFlujoSerializer,
    PlantillaFlujoSerializer,
    NodoFlujoSerializer,
    TransicionFlujoSerializer,
    CampoFormularioSerializer,
    RolFlujoSerializer
)


class CategoriaFlujoViewSet(viewsets.ModelViewSet):
    serializer_class = CategoriaFlujoSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['activo', 'codigo']
    search_fields = ['codigo', 'nombre', 'descripcion']
    ordering_fields = ['orden', 'nombre', 'created_at']
    ordering = ['orden', 'nombre']

    def get_queryset(self):
        return CategoriaFlujo.objects.filter(empresa_id=self.request.user.empresa_id).select_related('created_by')

    def perform_create(self, serializer):
        serializer.save(empresa_id=self.request.user.empresa_id, created_by=self.request.user)


class PlantillaFlujoViewSet(viewsets.ModelViewSet):
    serializer_class = PlantillaFlujoSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['categoria', 'estado', 'version', 'codigo']
    search_fields = ['codigo', 'nombre', 'descripcion']
    ordering_fields = ['nombre', 'version', 'created_at']
    ordering = ['-created_at']

    def get_queryset(self):
        return PlantillaFlujo.objects.filter(
            empresa_id=self.request.user.empresa_id
        ).select_related('categoria', 'created_by', 'activado_por', 'plantilla_origen')

    def perform_create(self, serializer):
        serializer.save(empresa_id=self.request.user.empresa_id, created_by=self.request.user)

    @action(detail=True, methods=['post'])
    def activar(self, request, pk=None):
        """Activa una plantilla en estado BORRADOR"""
        plantilla = self.get_object()

        if plantilla.estado != 'BORRADOR':
            return Response(
                {'error': 'Solo se pueden activar plantillas en estado BORRADOR'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validar que tenga al menos un nodo INICIO y FIN
        tiene_inicio = plantilla.nodos.filter(tipo='INICIO').exists()
        tiene_fin = plantilla.nodos.filter(tipo='FIN').exists()

        if not tiene_inicio or not tiene_fin:
            return Response(
                {'error': 'La plantilla debe tener al menos un nodo INICIO y un nodo FIN'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Marcar versiones anteriores como OBSOLETO
        PlantillaFlujo.objects.filter(
            empresa_id=request.user.empresa_id,
            codigo=plantilla.codigo,
            estado='ACTIVO'
        ).exclude(pk=plantilla.pk).update(
            estado='OBSOLETO',
            fecha_obsolescencia=timezone.now()
        )

        # Activar la plantilla
        plantilla.estado = 'ACTIVO'
        plantilla.fecha_activacion = timezone.now()
        plantilla.activado_por = request.user
        plantilla.save()

        return Response(self.get_serializer(plantilla).data)

    @action(detail=True, methods=['post'])
    def crear_nueva_version(self, request, pk=None):
        """Crea una nueva versión de la plantilla"""
        plantilla = self.get_object()

        if plantilla.estado not in ['ACTIVO', 'OBSOLETO']:
            return Response(
                {'error': 'Solo se pueden crear versiones de plantillas ACTIVO u OBSOLETO'},
                status=status.HTTP_400_BAD_REQUEST
            )

        nueva = plantilla.crear_nueva_version(request.user)
        return Response(self.get_serializer(nueva).data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['get'])
    def activas(self, request):
        """Lista plantillas activas"""
        queryset = self.get_queryset().filter(estado='ACTIVO')
        return Response(self.get_serializer(queryset, many=True).data)


class NodoFlujoViewSet(viewsets.ModelViewSet):
    serializer_class = NodoFlujoSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['plantilla', 'tipo', 'rol_asignado']
    search_fields = ['codigo', 'nombre', 'descripcion']
    ordering_fields = ['codigo', 'nombre']
    ordering = ['plantilla', 'codigo']

    def get_queryset(self):
        return NodoFlujo.objects.filter(
            empresa_id=self.request.user.empresa_id
        ).select_related('plantilla', 'rol_asignado', 'created_by')

    def perform_create(self, serializer):
        serializer.save(empresa_id=self.request.user.empresa_id, created_by=self.request.user)


class TransicionFlujoViewSet(viewsets.ModelViewSet):
    serializer_class = TransicionFlujoSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['plantilla', 'nodo_origen', 'nodo_destino']
    search_fields = ['nombre']
    ordering_fields = ['prioridad', 'nombre']
    ordering = ['plantilla', '-prioridad']

    def get_queryset(self):
        return TransicionFlujo.objects.filter(
            empresa_id=self.request.user.empresa_id
        ).select_related('plantilla', 'nodo_origen', 'nodo_destino', 'created_by')

    def perform_create(self, serializer):
        serializer.save(empresa_id=self.request.user.empresa_id, created_by=self.request.user)


class CampoFormularioViewSet(viewsets.ModelViewSet):
    serializer_class = CampoFormularioSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['nodo', 'tipo', 'requerido']
    search_fields = ['nombre', 'etiqueta']
    ordering_fields = ['orden', 'nombre']
    ordering = ['nodo', 'orden']

    def get_queryset(self):
        return CampoFormulario.objects.filter(
            empresa_id=self.request.user.empresa_id
        ).select_related('nodo', 'created_by')

    def perform_create(self, serializer):
        serializer.save(empresa_id=self.request.user.empresa_id, created_by=self.request.user)


class RolFlujoViewSet(viewsets.ModelViewSet):
    serializer_class = RolFlujoSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['activo', 'tipo_asignacion', 'codigo']
    search_fields = ['codigo', 'nombre', 'descripcion']
    ordering_fields = ['nombre', 'created_at']
    ordering = ['nombre']

    def get_queryset(self):
        return RolFlujo.objects.filter(empresa_id=self.request.user.empresa_id).select_related('created_by')

    def perform_create(self, serializer):
        serializer.save(empresa_id=self.request.user.empresa_id, created_by=self.request.user)
