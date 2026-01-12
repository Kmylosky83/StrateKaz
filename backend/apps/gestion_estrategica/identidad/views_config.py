"""
Views para configuración dinámica de Identidad Corporativa

Expone endpoints para que el frontend consuma la configuración
de estados, tipos, roles y demás catálogos dinámicos.
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .models_config import EstadoPolitica, TipoPolitica, RolFirmante, EstadoFirma
from .serializers_config import (
    EstadoPoliticaSerializer,
    TipoPoliticaSerializer,
    TipoPoliticaOptionSerializer,
    RolFirmanteSerializer,
    EstadoFirmaSerializer,
    ConfiguracionIdentidadSerializer,
)


class EstadoPoliticaViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet para estados de política.

    Solo lectura - la configuración se gestiona via admin o seed.
    """
    permission_classes = [IsAuthenticated]
    serializer_class = EstadoPoliticaSerializer
    queryset = EstadoPolitica.objects.filter(is_active=True).order_by('orden')

    @action(detail=False, methods=['get'])
    def choices(self, request):
        """
        Retorna estados en formato choices para selects.
        GET /api/v1/identidad/config/estados-politica/choices/
        """
        choices = list(
            self.get_queryset().values('code', 'label', 'color', 'icon')
        )
        return Response(choices)

    @action(detail=False, methods=['get'])
    def initial(self, request):
        """
        Retorna el estado inicial por defecto.
        GET /api/v1/identidad/config/estados-politica/initial/
        """
        estado = self.get_queryset().filter(es_estado_inicial=True).first()
        if estado:
            return Response(self.get_serializer(estado).data)
        return Response({'detail': 'No hay estado inicial configurado'}, status=404)


class TipoPoliticaViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet para tipos de política.

    Solo lectura - la configuración se gestiona via admin o seed.
    """
    permission_classes = [IsAuthenticated]
    serializer_class = TipoPoliticaSerializer
    queryset = TipoPolitica.objects.filter(is_active=True).order_by('orden')

    def get_serializer_class(self):
        if self.action == 'options':
            return TipoPoliticaOptionSerializer
        return TipoPoliticaSerializer

    @action(detail=False, methods=['get'])
    def options(self, request):
        """
        Retorna tipos en formato simplificado para selects.
        GET /api/v1/identidad/config/tipos-politica/options/
        """
        serializer = TipoPoliticaOptionSerializer(self.get_queryset(), many=True)
        return Response(serializer.data)


class RolFirmanteViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet para roles de firmante.

    Solo lectura - la configuración se gestiona via admin o seed.
    """
    permission_classes = [IsAuthenticated]
    serializer_class = RolFirmanteSerializer
    queryset = RolFirmante.objects.filter(is_active=True).order_by('orden')

    @action(detail=False, methods=['get'])
    def choices(self, request):
        """
        Retorna roles en formato choices para selects.
        GET /api/v1/identidad/config/roles-firmante/choices/
        """
        choices = list(
            self.get_queryset().values('code', 'label', 'icon', 'color', 'es_obligatorio')
        )
        return Response(choices)


class EstadoFirmaViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet para estados de firma.

    Solo lectura - la configuración se gestiona via admin o seed.
    """
    permission_classes = [IsAuthenticated]
    serializer_class = EstadoFirmaSerializer
    queryset = EstadoFirma.objects.filter(is_active=True).order_by('orden')

    @action(detail=False, methods=['get'])
    def choices(self, request):
        """
        Retorna estados en formato choices para selects.
        GET /api/v1/identidad/config/estados-firma/choices/
        """
        choices = list(
            self.get_queryset().values('code', 'label', 'color', 'icon')
        )
        return Response(choices)


class ConfiguracionIdentidadViewSet(viewsets.ViewSet):
    """
    ViewSet combinado que retorna toda la configuración
    de Identidad en un solo request.

    Útil para cargar toda la configuración al iniciar la app
    y evitar múltiples requests.
    """
    permission_classes = [IsAuthenticated]

    def list(self, request):
        """
        Retorna toda la configuración de identidad.
        GET /api/v1/identidad/config/all/
        """
        data = {
            'estados_politica': EstadoPoliticaSerializer(
                EstadoPolitica.objects.filter(is_active=True).order_by('orden'),
                many=True
            ).data,
            'tipos_politica': TipoPoliticaSerializer(
                TipoPolitica.objects.filter(is_active=True).order_by('orden'),
                many=True
            ).data,
            'roles_firmante': RolFirmanteSerializer(
                RolFirmante.objects.filter(is_active=True).order_by('orden'),
                many=True
            ).data,
            'estados_firma': EstadoFirmaSerializer(
                EstadoFirma.objects.filter(is_active=True).order_by('orden'),
                many=True
            ).data,
        }
        return Response(data)
