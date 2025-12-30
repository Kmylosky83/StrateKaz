"""
Views de Control de Tiempo - Talent Hub
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.db.models import Sum, Avg, Count, Q

from .models import Turno, AsignacionTurno, RegistroAsistencia, HoraExtra, ConsolidadoAsistencia
from .serializers import (
    TurnoListSerializer, TurnoDetailSerializer,
    AsignacionTurnoSerializer, RegistroAsistenciaSerializer,
    HoraExtraSerializer, ConsolidadoAsistenciaSerializer
)


class TurnoViewSet(viewsets.ModelViewSet):
    """ViewSet para gestion de turnos"""
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Turno.objects.filter(
            empresa=self.request.user.empresa,
            is_active=True
        ).order_by('codigo')
    
    def get_serializer_class(self):
        if self.action == 'list':
            return TurnoListSerializer
        return TurnoDetailSerializer
    
    def perform_create(self, serializer):
        serializer.save(empresa=self.request.user.empresa, created_by=self.request.user)
    
    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)


class AsignacionTurnoViewSet(viewsets.ModelViewSet):
    """ViewSet para gestion de asignaciones de turno"""
    permission_classes = [IsAuthenticated]
    serializer_class = AsignacionTurnoSerializer
    
    def get_queryset(self):
        qs = AsignacionTurno.objects.filter(
            empresa=self.request.user.empresa,
            is_active=True
        ).select_related('colaborador', 'turno')
        
        colaborador_id = self.request.query_params.get('colaborador')
        if colaborador_id:
            qs = qs.filter(colaborador_id=colaborador_id)
        
        return qs.order_by('-fecha_inicio')
    
    def perform_create(self, serializer):
        serializer.save(empresa=self.request.user.empresa, created_by=self.request.user)
    
    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)


class RegistroAsistenciaViewSet(viewsets.ModelViewSet):
    """ViewSet para gestion de registros de asistencia"""
    permission_classes = [IsAuthenticated]
    serializer_class = RegistroAsistenciaSerializer
    
    def get_queryset(self):
        qs = RegistroAsistencia.objects.filter(
            empresa=self.request.user.empresa
        ).select_related('colaborador', 'turno')
        
        fecha_desde = self.request.query_params.get('fecha_desde')
        if fecha_desde:
            qs = qs.filter(fecha__gte=fecha_desde)
        
        return qs.order_by('-fecha')
    
    def perform_create(self, serializer):
        serializer.save(
            empresa=self.request.user.empresa,
            registrado_por=self.request.user,
            created_by=self.request.user
        )
    
    @action(detail=False, methods=['post'])
    def registrar_entrada(self, request):
        """Registra entrada de un colaborador"""
        return Response({'message': 'Accion para registrar entrada'})
    
    @action(detail=True, methods=['post'])
    def registrar_salida(self, request, pk=None):
        """Registra salida"""
        return Response({'message': 'Accion para registrar salida'})
    
    @action(detail=False, methods=['get'])
    def estadisticas(self, request):
        """Estadisticas de asistencia"""
        return Response({'message': 'Estadisticas'})


class HoraExtraViewSet(viewsets.ModelViewSet):
    """ViewSet para gestion de horas extras"""
    permission_classes = [IsAuthenticated]
    serializer_class = HoraExtraSerializer
    
    def get_queryset(self):
        return HoraExtra.objects.filter(
            empresa=self.request.user.empresa
        ).select_related('colaborador')
    
    def perform_create(self, serializer):
        serializer.save(empresa=self.request.user.empresa, created_by=self.request.user)
    
    @action(detail=True, methods=['post'])
    def aprobar(self, request, pk=None):
        """Aprueba una hora extra"""
        hora_extra = self.get_object()
        hora_extra.aprobar(request.user)
        return Response({'message': 'Hora extra aprobada'})
    
    @action(detail=True, methods=['post'])
    def rechazar(self, request, pk=None):
        """Rechaza una hora extra"""
        hora_extra = self.get_object()
        hora_extra.rechazar()
        return Response({'message': 'Hora extra rechazada'})


class ConsolidadoAsistenciaViewSet(viewsets.ModelViewSet):
    """ViewSet para gestion de consolidados"""
    permission_classes = [IsAuthenticated]
    serializer_class = ConsolidadoAsistenciaSerializer
    
    def get_queryset(self):
        return ConsolidadoAsistencia.objects.filter(
            empresa=self.request.user.empresa
        ).select_related('colaborador')
    
    def perform_create(self, serializer):
        serializer.save(empresa=self.request.user.empresa, created_by=self.request.user)
    
    @action(detail=True, methods=['post'])
    def cerrar_mes(self, request, pk=None):
        """Cierra el consolidado del mes"""
        consolidado = self.get_object()
        consolidado.cerrar_mes(request.user)
        return Response({'message': 'Consolidado cerrado'})
    
    @action(detail=True, methods=['post'])
    def reabrir_mes(self, request, pk=None):
        """Reabre el consolidado del mes"""
        consolidado = self.get_object()
        consolidado.reabrir_mes()
        return Response({'message': 'Consolidado reabierto'})
