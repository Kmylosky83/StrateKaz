"""Views para config_alertas"""
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import TipoAlerta, ConfiguracionAlerta, AlertaGenerada, EscalamientoAlerta
from .serializers import TipoAlertaSerializer, ConfiguracionAlertaSerializer, AlertaGeneradaSerializer, EscalamientoAlertaSerializer

class TipoAlertaViewSet(viewsets.ModelViewSet):
    queryset = TipoAlerta.objects.all()
    serializer_class = TipoAlertaSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['categoria', 'modulo_origen', 'is_active']

class ConfiguracionAlertaViewSet(viewsets.ModelViewSet):
    queryset = ConfiguracionAlerta.objects.all()
    serializer_class = ConfiguracionAlertaSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['tipo_alerta', 'is_active']

class AlertaGeneradaViewSet(viewsets.ModelViewSet):
    queryset = AlertaGenerada.objects.select_related('configuracion')
    serializer_class = AlertaGeneradaSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['severidad', 'esta_atendida']
    
    @action(detail=True, methods=['post'])
    def atender(self, request, pk=None):
        from django.utils import timezone
        alerta = self.get_object()
        alerta.esta_atendida = True
        alerta.atendida_por = request.user
        alerta.fecha_atencion = timezone.now()
        alerta.accion_tomada = request.data.get('accion_tomada', '')
        alerta.save()
        return Response({'status': 'alert attended'})
    
    @action(detail=False, methods=['get'])
    def pendientes(self, request):
        alertas = self.get_queryset().filter(esta_atendida=False)
        serializer = self.get_serializer(alertas, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def por_severidad(self, request):
        severidad = request.query_params.get('severidad')
        alertas = self.get_queryset().filter(severidad=severidad)
        serializer = self.get_serializer(alertas, many=True)
        return Response(serializer.data)

class EscalamientoAlertaViewSet(viewsets.ModelViewSet):
    queryset = EscalamientoAlerta.objects.all()
    serializer_class = EscalamientoAlertaSerializer
