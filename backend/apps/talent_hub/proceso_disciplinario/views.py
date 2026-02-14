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

from apps.core.base_models.mixins import get_tenant_empresa

from .models import (
    TipoFalta, LlamadoAtencion, Descargo, Memorando, HistorialDisciplinario,
    NotificacionDisciplinaria, PruebaDisciplinaria, DenunciaAcosoLaboral
)
from .serializers import (
    TipoFaltaListSerializer, TipoFaltaDetailSerializer,
    LlamadoAtencionListSerializer, LlamadoAtencionDetailSerializer, LlamadoAtencionCreateSerializer,
    DescargoListSerializer, DescargoDetailSerializer, DescargoCreateSerializer,
    ApelarDescargoSerializer, ResolverApelacionDescargoSerializer,
    MemorandoListSerializer, MemorandoDetailSerializer, MemorandoCreateSerializer,
    HistorialDisciplinarioSerializer,
    NotificacionDisciplinariaSerializer, NotificacionDisciplinariaCreateSerializer,
    PruebaDisciplinariaSerializer, PruebaDisciplinariaCreateSerializer,
    DenunciaAcosoLaboralListSerializer, DenunciaAcosoLaboralDetailSerializer,
    DenunciaAcosoLaboralCreateSerializer, CambiarEstadoDenunciaSerializer,
)


class TipoFaltaViewSet(viewsets.ModelViewSet):
    """ViewSet para gestión de Tipos de Falta"""
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = TipoFalta.objects.filter(is_active=True)
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
            empresa=get_tenant_empresa(),
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
        queryset = LlamadoAtencion.objects.filter(is_active=True)
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
            empresa=get_tenant_empresa(),
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
        queryset = Descargo.objects.filter(is_active=True)
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
            empresa=get_tenant_empresa(),
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

    @action(detail=True, methods=['post'])
    def apelar(self, request, pk=None):
        """Registra apelación del descargo (Ley 2466/2025)"""
        descargo = self.get_object()
        serializer = ApelarDescargoSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        descargo.apelado = True
        descargo.fecha_apelacion = serializer.validated_data['fecha_apelacion']
        descargo.motivo_apelacion = serializer.validated_data['motivo_apelacion']
        descargo.resultado_apelacion = 'pendiente'
        descargo.save()
        return Response(DescargoDetailSerializer(descargo).data)

    @action(detail=True, methods=['post'])
    def resolver_apelacion(self, request, pk=None):
        """Resuelve apelación del descargo"""
        descargo = self.get_object()
        if not descargo.apelado:
            return Response(
                {'error': 'Este descargo no ha sido apelado.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        serializer = ResolverApelacionDescargoSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        descargo.resultado_apelacion = serializer.validated_data['resultado_apelacion']
        descargo.resuelto_por = request.user
        descargo.save()
        return Response(DescargoDetailSerializer(descargo).data)


class MemorandoViewSet(viewsets.ModelViewSet):
    """ViewSet para gestión de Memorandos"""
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = Memorando.objects.filter(is_active=True)
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
            empresa=get_tenant_empresa(),
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
        queryset = HistorialDisciplinario.objects.filter(is_active=True)
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


class NotificacionDisciplinariaViewSet(viewsets.ModelViewSet):
    """ViewSet para gestión de Notificaciones Disciplinarias (Ley 2466/2025)"""
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = NotificacionDisciplinaria.objects.filter(is_active=True)
        colaborador_id = self.request.query_params.get('colaborador')
        if colaborador_id:
            queryset = queryset.filter(colaborador_id=colaborador_id)
        descargo_id = self.request.query_params.get('descargo')
        if descargo_id:
            queryset = queryset.filter(descargo_id=descargo_id)
        memorando_id = self.request.query_params.get('memorando')
        if memorando_id:
            queryset = queryset.filter(memorando_id=memorando_id)
        tipo = self.request.query_params.get('tipo')
        if tipo:
            queryset = queryset.filter(tipo=tipo)
        return queryset.select_related('colaborador', 'descargo', 'memorando').order_by('-created_at')

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return NotificacionDisciplinariaCreateSerializer
        return NotificacionDisciplinariaSerializer

    def perform_create(self, serializer):
        serializer.save(
            empresa=get_tenant_empresa(),
            created_by=self.request.user,
            updated_by=self.request.user
        )

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)

    def perform_destroy(self, instance):
        instance.soft_delete()

    @action(detail=True, methods=['post'])
    def registrar_acuse(self, request, pk=None):
        """Registra acuse de recibo de la notificación"""
        notificacion = self.get_object()
        notificacion.acuse_recibo = True
        notificacion.fecha_acuse = timezone.now()
        notificacion.save()
        return Response(NotificacionDisciplinariaSerializer(notificacion).data)


class PruebaDisciplinariaViewSet(viewsets.ModelViewSet):
    """ViewSet para gestión de Pruebas Disciplinarias (Ley 2466/2025)"""
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = PruebaDisciplinaria.objects.filter(is_active=True)
        descargo_id = self.request.query_params.get('descargo')
        if descargo_id:
            queryset = queryset.filter(descargo_id=descargo_id)
        presentada_por = self.request.query_params.get('presentada_por')
        if presentada_por:
            queryset = queryset.filter(presentada_por=presentada_por)
        return queryset.select_related('descargo').order_by('-fecha_presentacion')

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return PruebaDisciplinariaCreateSerializer
        return PruebaDisciplinariaSerializer

    def perform_create(self, serializer):
        serializer.save(
            empresa=get_tenant_empresa(),
            created_by=self.request.user,
            updated_by=self.request.user
        )

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)

    def perform_destroy(self, instance):
        instance.soft_delete()

    @action(detail=True, methods=['post'])
    def admitir(self, request, pk=None):
        """Admite o rechaza una prueba"""
        prueba = self.get_object()
        admitida = request.data.get('admitida')
        if admitida is None:
            return Response(
                {'error': 'Debe indicar si la prueba es admitida (true/false).'},
                status=status.HTTP_400_BAD_REQUEST
            )
        prueba.admitida = admitida
        prueba.observaciones_admision = request.data.get('observaciones_admision', '')
        prueba.save()
        return Response(PruebaDisciplinariaSerializer(prueba).data)


# =============================================================================
# DENUNCIA ACOSO LABORAL - Ley 1010/2006
# =============================================================================

class DenunciaAcosoLaboralViewSet(viewsets.ModelViewSet):
    """
    ViewSet para denuncias de acoso laboral - Ley 1010/2006.

    Acciones personalizadas:
    - cambiar_estado: Cambiar estado de la denuncia
    - notificar_comite: Notificar al Comité de Convivencia
    """
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = DenunciaAcosoLaboral.objects.filter(is_active=True)

        # Filtros
        estado = self.request.query_params.get('estado')
        if estado:
            queryset = queryset.filter(estado=estado)

        tipo_acoso = self.request.query_params.get('tipo_acoso')
        if tipo_acoso:
            queryset = queryset.filter(tipo_acoso=tipo_acoso)

        return queryset.select_related('denunciante', 'denunciado').order_by('-created_at')

    def get_serializer_class(self):
        if self.action == 'list':
            return DenunciaAcosoLaboralListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return DenunciaAcosoLaboralCreateSerializer
        return DenunciaAcosoLaboralDetailSerializer

    def perform_create(self, serializer):
        serializer.save(
            empresa=get_tenant_empresa(),
            created_by=self.request.user,
            updated_by=self.request.user
        )

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)

    def perform_destroy(self, instance):
        instance.soft_delete()

    @action(detail=True, methods=['post'])
    def cambiar_estado(self, request, pk=None):
        """Cambiar estado de la denuncia."""
        denuncia = self.get_object()
        serializer = CambiarEstadoDenunciaSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        denuncia.estado = serializer.validated_data['estado']
        if serializer.validated_data.get('observacion'):
            denuncia.resolucion = serializer.validated_data['observacion']

        if denuncia.estado == 'cerrada':
            denuncia.fecha_cierre = timezone.now().date()

        denuncia.save()
        return Response(DenunciaAcosoLaboralDetailSerializer(denuncia).data)

    @action(detail=True, methods=['post'])
    def notificar_comite(self, request, pk=None):
        """Notificar al Comité de Convivencia Laboral."""
        denuncia = self.get_object()

        if denuncia.comite_convivencia_notificado:
            return Response(
                {'error': 'El Comité ya fue notificado.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        denuncia.comite_convivencia_notificado = True
        denuncia.fecha_notificacion_comite = timezone.now().date()
        denuncia.estado = 'comite'
        denuncia.save()

        return Response({
            'message': 'Comité de Convivencia notificado exitosamente.',
            'denuncia': DenunciaAcosoLaboralDetailSerializer(denuncia).data
        })
