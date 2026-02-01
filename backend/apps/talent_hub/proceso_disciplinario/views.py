"""
Views para Proceso Disciplinario - Talent Hub
Sistema de Gestión StrateKaz
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Count, Q
from django.utils import timezone

from .models import TipoFalta, LlamadoAtencion, Descargo, Memorando, HistorialDisciplinario
from .serializers import (
    TipoFaltaListSerializer, TipoFaltaDetailSerializer,
    LlamadoAtencionListSerializer, LlamadoAtencionDetailSerializer, LlamadoAtencionCreateSerializer,
    DescargoListSerializer, DescargoDetailSerializer, DescargoCreateSerializer,
    MemorandoListSerializer, MemorandoDetailSerializer, MemorandoCreateSerializer,
    HistorialDisciplinarioSerializer
)


class TipoFaltaViewSet(viewsets.ModelViewSet):
    """ViewSet para gestión de Tipos de Falta"""
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = TipoFalta.objects.filter(is_active=True)
        if hasattr(user, 'empresa'):
            queryset = queryset.filter(empresa=user.empresa)
        gravedad = self.request.query_params.get('gravedad')
        if gravedad:
            queryset = queryset.filter(gravedad=gravedad)
        return queryset.order_by('gravedad', 'codigo')

    def get_serializer_class(self):
        if self.action == 'list':
            return TipoFaltaListSerializer
        return TipoFaltaDetailSerializer

    def perform_create(self, serializer):
        serializer.save(
            empresa=self.request.user.empresa,
            created_by=self.request.user,
            updated_by=self.request.user
        )

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)

    def perform_destroy(self, instance):
        instance.soft_delete()


class LlamadoAtencionViewSet(viewsets.ModelViewSet):
    """ViewSet para gestión de Llamados de Atención"""
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = LlamadoAtencion.objects.filter(is_active=True)
        if hasattr(user, 'empresa'):
            queryset = queryset.filter(empresa=user.empresa)
        colaborador_id = self.request.query_params.get('colaborador')
        if colaborador_id:
            queryset = queryset.filter(colaborador_id=colaborador_id)
        tipo = self.request.query_params.get('tipo')
        if tipo:
            queryset = queryset.filter(tipo=tipo)
        return queryset.select_related('colaborador', 'tipo_falta', 'realizado_por').order_by('-fecha_llamado')

    def get_serializer_class(self):
        if self.action == 'list':
            return LlamadoAtencionListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return LlamadoAtencionCreateSerializer
        return LlamadoAtencionDetailSerializer

    def perform_create(self, serializer):
        serializer.save(
            empresa=self.request.user.empresa,
            created_by=self.request.user,
            updated_by=self.request.user
        )

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)

    def perform_destroy(self, instance):
        instance.soft_delete()

    @action(detail=True, methods=['post'])
    def registrar_firma(self, request, pk=None):
        """Registra la firma del colaborador"""
        llamado = self.get_object()
        llamado.firmado_colaborador = True
        llamado.fecha_firma = timezone.now()
        llamado.save()
        serializer = LlamadoAtencionDetailSerializer(llamado)
        return Response(serializer.data)


class DescargoViewSet(viewsets.ModelViewSet):
    """ViewSet para gestión de Descargos"""
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = Descargo.objects.filter(is_active=True)
        if hasattr(user, 'empresa'):
            queryset = queryset.filter(empresa=user.empresa)
        colaborador_id = self.request.query_params.get('colaborador')
        if colaborador_id:
            queryset = queryset.filter(colaborador_id=colaborador_id)
        estado = self.request.query_params.get('estado')
        if estado:
            queryset = queryset.filter(estado=estado)
        decision = self.request.query_params.get('decision')
        if decision:
            queryset = queryset.filter(decision=decision)
        return queryset.select_related('colaborador', 'tipo_falta', 'decidido_por').order_by('-fecha_citacion')

    def get_serializer_class(self):
        if self.action == 'list':
            return DescargoListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return DescargoCreateSerializer
        return DescargoDetailSerializer

    def perform_create(self, serializer):
        serializer.save(
            empresa=self.request.user.empresa,
            created_by=self.request.user,
            updated_by=self.request.user
        )

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)

    def perform_destroy(self, instance):
        instance.soft_delete()

    @action(detail=True, methods=['post'])
    def registrar_descargo(self, request, pk=None):
        """Registra el descargo del colaborador"""
        descargo = self.get_object()
        descargo.estado = 'realizado'
        descargo.fecha_descargo = timezone.now()
        descargo.descargo_colaborador = request.data.get('descargo_colaborador', '')
        descargo.pruebas_presentadas = request.data.get('pruebas_presentadas', '')
        descargo.testigos_colaborador = request.data.get('testigos_colaborador', '')
        descargo.save()
        serializer = DescargoDetailSerializer(descargo)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def emitir_decision(self, request, pk=None):
        """Emite decisión sobre el descargo"""
        descargo = self.get_object()
        descargo.decision = request.data.get('decision')
        descargo.justificacion_decision = request.data.get('justificacion_decision')
        descargo.decidido_por = request.user
        descargo.fecha_decision = timezone.now()
        descargo.save()
        serializer = DescargoDetailSerializer(descargo)
        return Response(serializer.data)


class MemorandoViewSet(viewsets.ModelViewSet):
    """ViewSet para gestión de Memorandos"""
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = Memorando.objects.filter(is_active=True)
        if hasattr(user, 'empresa'):
            queryset = queryset.filter(empresa=user.empresa)
        colaborador_id = self.request.query_params.get('colaborador')
        if colaborador_id:
            queryset = queryset.filter(colaborador_id=colaborador_id)
        sancion = self.request.query_params.get('sancion_aplicada')
        if sancion:
            queryset = queryset.filter(sancion_aplicada=sancion)
        return queryset.select_related('colaborador', 'tipo_falta', 'elaborado_por').order_by('-fecha_memorando')

    def get_serializer_class(self):
        if self.action == 'list':
            return MemorandoListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return MemorandoCreateSerializer
        return MemorandoDetailSerializer

    def perform_create(self, serializer):
        serializer.save(
            empresa=self.request.user.empresa,
            elaborado_por=self.request.user,
            created_by=self.request.user,
            updated_by=self.request.user
        )

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)

    def perform_destroy(self, instance):
        instance.soft_delete()

    @action(detail=True, methods=['post'])
    def notificar(self, request, pk=None):
        """Registra notificación del memorando al colaborador"""
        memorando = self.get_object()
        memorando.notificado = True
        memorando.fecha_notificacion = timezone.now()
        memorando.save()
        serializer = MemorandoDetailSerializer(memorando)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def registrar_apelacion(self, request, pk=None):
        """Registra apelación del colaborador"""
        memorando = self.get_object()
        memorando.apelacion = request.data.get('apelacion', '')
        memorando.fecha_apelacion = timezone.now()
        memorando.save()
        serializer = MemorandoDetailSerializer(memorando)
        return Response(serializer.data)


class HistorialDisciplinarioViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet de solo lectura para Historial Disciplinario"""
    permission_classes = [IsAuthenticated]
    serializer_class = HistorialDisciplinarioSerializer

    def get_queryset(self):
        user = self.request.user
        queryset = HistorialDisciplinario.objects.filter(is_active=True)
        if hasattr(user, 'empresa'):
            queryset = queryset.filter(empresa=user.empresa)
        colaborador_id = self.request.query_params.get('colaborador')
        if colaborador_id:
            queryset = queryset.filter(colaborador_id=colaborador_id)
        tipo_evento = self.request.query_params.get('tipo_evento')
        if tipo_evento:
            queryset = queryset.filter(tipo_evento=tipo_evento)
        return queryset.select_related('colaborador').order_by('-fecha_evento')

    @action(detail=False, methods=['get'])
    def resumen_colaborador(self, request):
        """Obtiene resumen disciplinario de un colaborador"""
        colaborador_id = request.query_params.get('colaborador')
        if not colaborador_id:
            return Response({'error': 'Se requiere ID de colaborador'}, status=status.HTTP_400_BAD_REQUEST)

        historial = self.get_queryset().filter(colaborador_id=colaborador_id)
        resumen = historial.values('tipo_evento').annotate(total=Count('id'))

        return Response({
            'colaborador_id': colaborador_id,
            'total_eventos': historial.count(),
            'resumen_por_tipo': list(resumen),
            'ultimo_evento': HistorialDisciplinarioSerializer(historial.first()).data if historial.exists() else None
        })
