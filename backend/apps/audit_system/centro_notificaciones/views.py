"""Views para centro_notificaciones"""
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import TipoNotificacion, Notificacion, PreferenciaNotificacion, NotificacionMasiva
from .serializers import TipoNotificacionSerializer, NotificacionSerializer, PreferenciaNotificacionSerializer, NotificacionMasivaSerializer

class TipoNotificacionViewSet(viewsets.ModelViewSet):
    queryset = TipoNotificacion.objects.all()
    serializer_class = TipoNotificacionSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['categoria', 'is_active']

class NotificacionViewSet(viewsets.ModelViewSet):
    queryset = Notificacion.objects.select_related('tipo', 'usuario')
    serializer_class = NotificacionSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['usuario', 'esta_leida', 'prioridad']
    
    @action(detail=True, methods=['post'])
    def marcar_leida(self, request, pk=None):
        notif = self.get_object()
        notif.marcar_leida()
        return Response({'status': 'marked as read'})
    
    @action(detail=False, methods=['post'])
    def marcar_todas_leidas(self, request):
        usuario_id = request.data.get('usuario_id')
        Notificacion.objects.filter(usuario_id=usuario_id, esta_leida=False).update(esta_leida=True)
        return Response({'status': 'all marked as read'})
    
    @action(detail=False, methods=['get'])
    def no_leidas(self, request):
        usuario_id = request.query_params.get('usuario_id')
        notifs = self.get_queryset().filter(usuario_id=usuario_id, esta_leida=False)
        serializer = self.get_serializer(notifs, many=True)
        return Response(serializer.data)

class PreferenciaNotificacionViewSet(viewsets.ModelViewSet):
    queryset = PreferenciaNotificacion.objects.all()
    serializer_class = PreferenciaNotificacionSerializer

class NotificacionMasivaViewSet(viewsets.ModelViewSet):
    queryset = NotificacionMasiva.objects.all()
    serializer_class = NotificacionMasivaSerializer
