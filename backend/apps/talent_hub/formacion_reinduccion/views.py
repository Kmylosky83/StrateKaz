"""
Views para Formación y Reinducción - Talent Hub
Sistema de Gestión StrateKaz
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.db.models import Count, Sum, Avg, Q
from datetime import timedelta

from apps.core.base_models.mixins import get_tenant_empresa

from .models import (
    PlanFormacion, Capacitacion, ProgramacionCapacitacion,
    EjecucionCapacitacion, Badge, GamificacionColaborador,
    BadgeColaborador, EvaluacionEficacia, Certificado,
)
from .serializers import (
    PlanFormacionListSerializer, PlanFormacionDetailSerializer,
    CapacitacionListSerializer, CapacitacionDetailSerializer, CapacitacionCreateUpdateSerializer,
    ProgramacionCapacitacionListSerializer, ProgramacionCapacitacionDetailSerializer,
    EjecucionCapacitacionListSerializer, EjecucionCapacitacionDetailSerializer,
    BadgeSerializer, GamificacionColaboradorSerializer, BadgeColaboradorSerializer, LeaderboardSerializer,
    EvaluacionEficaciaSerializer, CertificadoListSerializer, CertificadoDetailSerializer,
    FormacionEstadisticasSerializer,
)


class PlanFormacionViewSet(viewsets.ModelViewSet):
    """ViewSet para planes de formación."""
    permission_classes = [IsAuthenticated]
    filterset_fields = ['anio', 'aprobado', 'is_active']
    search_fields = ['codigo', 'nombre']
    ordering = ['-anio', '-fecha_inicio']

    def get_queryset(self):
        return PlanFormacion.objects.filter(is_active=True).select_related('responsable')

    def get_serializer_class(self):
        if self.action == 'list':
            return PlanFormacionListSerializer
        return PlanFormacionDetailSerializer

    def perform_create(self, serializer):
        serializer.save(empresa=get_tenant_empresa(), created_by=self.request.user)

    @action(detail=True, methods=['post'])
    def aprobar(self, request, pk=None):
        plan = self.get_object()
        plan.aprobado = True
        plan.fecha_aprobacion = timezone.now().date()
        plan.aprobado_por = request.user
        plan.save()
        return Response({'status': 'Plan aprobado'})


class CapacitacionViewSet(viewsets.ModelViewSet):
    """ViewSet para capacitaciones."""
    permission_classes = [IsAuthenticated]
    filterset_fields = ['tipo_capacitacion', 'modalidad', 'estado', 'plan_formacion']
    search_fields = ['codigo', 'nombre', 'descripcion']
    ordering = ['-created_at']

    def get_queryset(self):
        return Capacitacion.objects.filter(is_active=True).select_related('plan_formacion', 'instructor_interno')

    def get_serializer_class(self):
        if self.action == 'list':
            return CapacitacionListSerializer
        if self.action in ['create', 'update', 'partial_update']:
            return CapacitacionCreateUpdateSerializer
        return CapacitacionDetailSerializer

    def perform_create(self, serializer):
        serializer.save(empresa=get_tenant_empresa(), created_by=self.request.user)

    @action(detail=True, methods=['post'])
    def publicar(self, request, pk=None):
        capacitacion = self.get_object()
        capacitacion.estado = 'publicada'
        capacitacion.save()
        return Response({'status': 'Capacitación publicada'})

    @action(detail=False, methods=['get'])
    def por_tipo(self, request):
        queryset = self.get_queryset()
        result = {}
        for tipo, _ in Capacitacion._meta.get_field('tipo_capacitacion').choices:
            caps = queryset.filter(tipo_capacitacion=tipo)
            result[tipo] = CapacitacionListSerializer(caps, many=True).data
        return Response(result)


class ProgramacionCapacitacionViewSet(viewsets.ModelViewSet):
    """ViewSet para programación de capacitaciones."""
    permission_classes = [IsAuthenticated]
    filterset_fields = ['capacitacion', 'estado', 'fecha']
    ordering = ['fecha', 'hora_inicio']

    def get_queryset(self):
        return ProgramacionCapacitacion.objects.filter(is_active=True).select_related('capacitacion', 'instructor')

    def get_serializer_class(self):
        if self.action == 'list':
            return ProgramacionCapacitacionListSerializer
        return ProgramacionCapacitacionDetailSerializer

    def perform_create(self, serializer):
        serializer.save(empresa=get_tenant_empresa(), created_by=self.request.user)

    @action(detail=False, methods=['get'])
    def calendario(self, request):
        """Retorna sesiones para el calendario."""
        fecha_inicio = request.query_params.get('fecha_inicio')
        fecha_fin = request.query_params.get('fecha_fin')
        queryset = self.get_queryset()
        if fecha_inicio:
            queryset = queryset.filter(fecha__gte=fecha_inicio)
        if fecha_fin:
            queryset = queryset.filter(fecha__lte=fecha_fin)
        serializer = ProgramacionCapacitacionListSerializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def proximas(self, request):
        """Retorna próximas sesiones."""
        dias = int(request.query_params.get('dias', 7))
        hoy = timezone.now().date()
        queryset = self.get_queryset().filter(
            fecha__gte=hoy,
            fecha__lte=hoy + timedelta(days=dias),
            estado__in=['programada', 'confirmada']
        )
        serializer = ProgramacionCapacitacionListSerializer(queryset, many=True)
        return Response(serializer.data)


class EjecucionCapacitacionViewSet(viewsets.ModelViewSet):
    """ViewSet para ejecución de capacitaciones."""
    permission_classes = [IsAuthenticated]
    filterset_fields = ['colaborador', 'programacion', 'estado', 'asistio']
    ordering = ['programacion__fecha']

    def get_queryset(self):
        return EjecucionCapacitacion.objects.filter(is_active=True).select_related('colaborador', 'programacion__capacitacion')

    def get_serializer_class(self):
        if self.action == 'list':
            return EjecucionCapacitacionListSerializer
        return EjecucionCapacitacionDetailSerializer

    def perform_create(self, serializer):
        ejecucion = serializer.save(empresa=get_tenant_empresa(), created_by=self.request.user)
        # Incrementar inscritos
        ejecucion.programacion.inscritos += 1
        ejecucion.programacion.save(update_fields=['inscritos'])

    @action(detail=True, methods=['post'])
    def registrar_asistencia(self, request, pk=None):
        ejecucion = self.get_object()
        ejecucion.asistio = request.data.get('asistio', True)
        ejecucion.hora_entrada = request.data.get('hora_entrada')
        ejecucion.hora_salida = request.data.get('hora_salida')
        ejecucion.estado = 'asistio' if ejecucion.asistio else 'no_asistio'
        ejecucion.save()
        return Response({'status': 'Asistencia registrada'})

    @action(detail=True, methods=['post'])
    def registrar_evaluacion(self, request, pk=None):
        ejecucion = self.get_object()
        nota = request.data.get('nota')
        ejecucion.nota_evaluacion = nota
        ejecucion.fecha_evaluacion = timezone.now().date()
        ejecucion.intentos_evaluacion += 1
        cap = ejecucion.programacion.capacitacion
        if nota >= cap.nota_aprobacion:
            ejecucion.estado = 'aprobado'
            ejecucion.puntos_ganados = cap.puntos_otorgados
        else:
            ejecucion.estado = 'reprobado'
        ejecucion.save()
        return Response({'status': 'Evaluación registrada', 'aprobo': ejecucion.aprobo})

    @action(detail=False, methods=['get'])
    def por_colaborador(self, request):
        colaborador_id = request.query_params.get('colaborador_id')
        if not colaborador_id:
            return Response({'error': 'Se requiere colaborador_id'}, status=400)
        queryset = self.get_queryset().filter(colaborador_id=colaborador_id)
        serializer = EjecucionCapacitacionListSerializer(queryset, many=True)
        return Response(serializer.data)


class BadgeViewSet(viewsets.ModelViewSet):
    """ViewSet para badges de gamificación."""
    permission_classes = [IsAuthenticated]
    serializer_class = BadgeSerializer
    filterset_fields = ['tipo', 'is_active']
    ordering = ['orden', 'nombre']

    def get_queryset(self):
        return Badge.objects.filter(is_active=True)

    def perform_create(self, serializer):
        serializer.save(empresa=get_tenant_empresa(), created_by=self.request.user)


class GamificacionViewSet(viewsets.ViewSet):
    """ViewSet para gamificación y leaderboard."""
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['get'])
    def leaderboard(self, request):
        """Retorna el leaderboard de gamificación."""
        limite = int(request.query_params.get('limite', 10))
        gamificaciones = GamificacionColaborador.objects.filter(
            is_active=True
        ).select_related('colaborador').order_by('-puntos_totales')[:limite]

        data = []
        for i, g in enumerate(gamificaciones, 1):
            data.append({
                'posicion': i,
                'colaborador_id': g.colaborador_id,
                'colaborador_nombre': g.colaborador.get_nombre_completo(),
                'nivel': g.nivel,
                'nombre_nivel': g.nombre_nivel,
                'puntos_totales': g.puntos_totales,
                'badges_obtenidos': g.badges_obtenidos,
                'capacitaciones_completadas': g.capacitaciones_completadas,
            })
        serializer = LeaderboardSerializer(data, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def mi_perfil(self, request):
        """Retorna el perfil de gamificación del colaborador actual."""
        colaborador_id = request.query_params.get('colaborador_id')
        if not colaborador_id:
            return Response({'error': 'Se requiere colaborador_id'}, status=400)
        try:
            gamificacion = GamificacionColaborador.objects.get(
                colaborador_id=colaborador_id
            )
            serializer = GamificacionColaboradorSerializer(gamificacion)
            return Response(serializer.data)
        except GamificacionColaborador.DoesNotExist:
            return Response({'error': 'Perfil no encontrado'}, status=404)

    @action(detail=False, methods=['get'])
    def mis_badges(self, request):
        """Retorna los badges del colaborador."""
        colaborador_id = request.query_params.get('colaborador_id')
        if not colaborador_id:
            return Response({'error': 'Se requiere colaborador_id'}, status=400)
        badges = BadgeColaborador.objects.filter(
            colaborador_id=colaborador_id
        ).select_related('badge')
        serializer = BadgeColaboradorSerializer(badges, many=True)
        return Response(serializer.data)


class EvaluacionEficaciaViewSet(viewsets.ModelViewSet):
    """ViewSet para evaluaciones de eficacia."""
    permission_classes = [IsAuthenticated]
    serializer_class = EvaluacionEficaciaSerializer
    filterset_fields = ['ejecucion', 'nivel_evaluacion', 'requiere_refuerzo']
    ordering = ['-fecha_evaluacion']

    def get_queryset(self):
        return EvaluacionEficacia.objects.filter(is_active=True).select_related('ejecucion__colaborador', 'evaluador')

    def perform_create(self, serializer):
        serializer.save(empresa=get_tenant_empresa(), created_by=self.request.user, evaluador=self.request.user)


class CertificadoViewSet(viewsets.ModelViewSet):
    """ViewSet para certificados."""
    permission_classes = [IsAuthenticated]
    filterset_fields = ['anulado']
    search_fields = ['numero_certificado', 'titulo_capacitacion']
    ordering = ['-fecha_emision']

    def get_queryset(self):
        return Certificado.objects.filter(is_active=True).select_related('ejecucion__colaborador')

    def get_serializer_class(self):
        if self.action == 'list':
            return CertificadoListSerializer
        return CertificadoDetailSerializer

    def perform_create(self, serializer):
        serializer.save(empresa=get_tenant_empresa(), created_by=self.request.user)

    @action(detail=True, methods=['post'])
    def anular(self, request, pk=None):
        certificado = self.get_object()
        certificado.anulado = True
        certificado.motivo_anulacion = request.data.get('motivo', '')
        certificado.save()
        return Response({'status': 'Certificado anulado'})

    @action(detail=False, methods=['get'])
    def por_colaborador(self, request):
        colaborador_id = request.query_params.get('colaborador_id')
        if not colaborador_id:
            return Response({'error': 'Se requiere colaborador_id'}, status=400)
        queryset = self.get_queryset().filter(ejecucion__colaborador_id=colaborador_id)
        serializer = CertificadoListSerializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def verificar(self, request):
        """Verifica autenticidad de un certificado."""
        codigo = request.query_params.get('codigo')
        if not codigo:
            return Response({'error': 'Se requiere código de verificación'}, status=400)
        try:
            certificado = Certificado.objects.get(codigo_verificacion=codigo)
            return Response({
                'valido': certificado.esta_vigente,
                'numero': certificado.numero_certificado,
                'titulo': certificado.titulo_capacitacion,
                'fecha_emision': certificado.fecha_emision,
                'anulado': certificado.anulado,
            })
        except Certificado.DoesNotExist:
            return Response({'valido': False, 'error': 'Certificado no encontrado'}, status=404)


class FormacionEstadisticasViewSet(viewsets.ViewSet):
    """ViewSet para estadísticas de formación."""
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['get'])
    def resumen(self, request):
        hoy = timezone.now().date()
        inicio_mes = hoy.replace(day=1)
        inicio_anio = hoy.replace(month=1, day=1)

        capacitaciones_activas = Capacitacion.objects.filter(
            is_active=True, estado__in=['publicada', 'en_ejecucion']
        ).count()

        sesiones_mes = ProgramacionCapacitacion.objects.filter(
            is_active=True, fecha__gte=inicio_mes, fecha__lte=hoy
        )
        sesiones_programadas_mes = sesiones_mes.count()

        ejecuciones_mes = EjecucionCapacitacion.objects.filter(
            is_active=True, programacion__fecha__gte=inicio_mes
        )
        participantes_mes = ejecuciones_mes.values('colaborador').distinct().count()
        total_ejecuciones = ejecuciones_mes.count()
        asistencias = ejecuciones_mes.filter(asistio=True).count()
        tasa_asistencia = (asistencias / total_ejecuciones * 100) if total_ejecuciones > 0 else 0

        aprobados = ejecuciones_mes.filter(estado='aprobado').count()
        evaluados = ejecuciones_mes.filter(nota_evaluacion__isnull=False).count()
        tasa_aprobacion = (aprobados / evaluados * 100) if evaluados > 0 else 0

        horas_mes = sesiones_mes.aggregate(total=Sum('capacitacion__duracion_horas'))['total'] or 0

        certificados_mes = Certificado.objects.filter(
            is_active=True, fecha_emision__gte=inicio_mes
        ).count()

        presupuesto_anio = PlanFormacion.objects.filter(
            is_active=True, anio=hoy.year
        ).aggregate(total=Sum('presupuesto_ejecutado'))['total'] or 0

        data = {
            'capacitaciones_activas': capacitaciones_activas,
            'sesiones_programadas_mes': sesiones_programadas_mes,
            'participantes_mes': participantes_mes,
            'tasa_asistencia': round(tasa_asistencia, 2),
            'tasa_aprobacion': round(tasa_aprobacion, 2),
            'horas_formacion_mes': horas_mes,
            'certificados_emitidos_mes': certificados_mes,
            'presupuesto_ejecutado_anio': presupuesto_anio,
        }
        serializer = FormacionEstadisticasSerializer(data)
        return Response(serializer.data)
