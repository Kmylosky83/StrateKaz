"""Views para tareas_recordatorios"""
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import Tarea, Recordatorio, EventoCalendario, ComentarioTarea
from .serializers import TareaSerializer, RecordatorioSerializer, EventoCalendarioSerializer, ComentarioTareaSerializer

class TareaViewSet(viewsets.ModelViewSet):
    queryset = Tarea.objects.select_related('asignado_a', 'creado_por', 'content_type')
    serializer_class = TareaSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['asignado_a', 'estado', 'prioridad', 'tipo']
    
    @action(detail=True, methods=['post'])
    def completar(self, request, pk=None):
        tarea = self.get_object()
        tarea.completar()
        return Response({'status': 'task completed'})
    
    @action(detail=True, methods=['post'])
    def cancelar(self, request, pk=None):
        tarea = self.get_object()
        tarea.estado = 'cancelada'
        tarea.save()
        return Response({'status': 'task cancelled'})
    
    @action(detail=True, methods=['post'])
    def reasignar(self, request, pk=None):
        tarea = self.get_object()
        nuevo_usuario_id = request.data.get('nuevo_usuario_id')
        if nuevo_usuario_id:
            tarea.asignado_a_id = nuevo_usuario_id
            tarea.save()
            return Response({'status': 'task reassigned'})
        return Response({'error': 'nuevo_usuario_id required'}, status=400)
    
    @action(detail=False, methods=['get'])
    def mis_tareas(self, request):
        usuario_id = request.user.id
        tareas = self.get_queryset().filter(asignado_a_id=usuario_id, estado__in=['pendiente', 'en_progreso'])
        serializer = self.get_serializer(tareas, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def vencidas(self, request):
        from django.utils import timezone
        tareas = self.get_queryset().filter(estado__in=['pendiente', 'en_progreso'], fecha_limite__lt=timezone.now())
        serializer = self.get_serializer(tareas, many=True)
        return Response(serializer.data)

class RecordatorioViewSet(viewsets.ModelViewSet):
    queryset = Recordatorio.objects.select_related('usuario', 'tarea')
    serializer_class = RecordatorioSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['usuario', 'esta_activo', 'repetir']
    
    @action(detail=True, methods=['post'])
    def activar(self, request, pk=None):
        recordatorio = self.get_object()
        recordatorio.esta_activo = True
        recordatorio.save()
        return Response({'status': 'reminder activated'})
    
    @action(detail=True, methods=['post'])
    def desactivar(self, request, pk=None):
        recordatorio = self.get_object()
        recordatorio.esta_activo = False
        recordatorio.save()
        return Response({'status': 'reminder deactivated'})

class EventoCalendarioViewSet(viewsets.ModelViewSet):
    queryset = EventoCalendario.objects.prefetch_related('participantes')
    serializer_class = EventoCalendarioSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['tipo', 'creado_por']
    
    @action(detail=False, methods=['get'])
    def por_mes(self, request):
        from datetime import datetime
        mes = request.query_params.get('mes')
        anio = request.query_params.get('anio')
        if mes and anio:
            eventos = self.get_queryset().filter(fecha_inicio__month=mes, fecha_inicio__year=anio)
            serializer = self.get_serializer(eventos, many=True)
            return Response(serializer.data)
        return Response([])
    
    @action(detail=False, methods=['get'])
    def mis_eventos(self, request):
        usuario_id = request.user.id
        eventos = self.get_queryset().filter(participantes__id=usuario_id)
        serializer = self.get_serializer(eventos, many=True)
        return Response(serializer.data)

class ComentarioTareaViewSet(viewsets.ModelViewSet):
    queryset = ComentarioTarea.objects.select_related('tarea', 'usuario')
    serializer_class = ComentarioTareaSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['tarea']
