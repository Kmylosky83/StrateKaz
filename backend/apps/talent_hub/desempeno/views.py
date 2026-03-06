"""
Views para Desempeño - Talent Hub
Sistema de Gestión StrateKaz
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.db.models import Count, Avg, Q
from datetime import timedelta

from apps.core.base_models.mixins import get_tenant_empresa
from apps.gestion_estrategica.revision_direccion.services.resumen_mixin import ResumenRevisionMixin

from .models import (
    CicloEvaluacion, CompetenciaEvaluacion, CriterioEvaluacion, EscalaCalificacion,
    EvaluacionDesempeno, DetalleEvaluacion, EvaluadorPar,
    PlanMejora, ActividadPlanMejora, SeguimientoPlanMejora,
    TipoReconocimiento, Reconocimiento, MuroReconocimientos,
)
from .serializers import (
    CicloEvaluacionListSerializer, CicloEvaluacionDetailSerializer,
    CompetenciaEvaluacionListSerializer, CompetenciaEvaluacionDetailSerializer,
    CriterioEvaluacionSerializer, EscalaCalificacionSerializer,
    EvaluacionDesempenoListSerializer, EvaluacionDesempenoDetailSerializer,
    EvaluacionDesempenoCreateSerializer, DetalleEvaluacionSerializer, EvaluadorParSerializer,
    PlanMejoraListSerializer, PlanMejoraDetailSerializer, PlanMejoraCreateUpdateSerializer,
    ActividadPlanMejoraSerializer, SeguimientoPlanMejoraSerializer,
    TipoReconocimientoSerializer, ReconocimientoListSerializer, ReconocimientoDetailSerializer,
    ReconocimientoCreateSerializer, MuroReconocimientosSerializer,
    DesempenoEstadisticasSerializer,
)


class CicloEvaluacionViewSet(ResumenRevisionMixin, viewsets.ModelViewSet):
    """ViewSet para ciclos de evaluación."""
    permission_classes = [IsAuthenticated]
    filterset_fields = ['tipo_ciclo', 'anio', 'estado', 'is_active']
    search_fields = ['codigo', 'nombre']
    ordering = ['-anio', '-periodo']

    # ResumenRevisionMixin config
    resumen_date_field = 'created_at'
    resumen_modulo_nombre = 'desempeno'

    def get_resumen_data(self, queryset, fecha_desde, fecha_hasta):
        """Resumen de desempeño para Revisión por la Dirección."""
        evaluaciones = EvaluacionDesempeno.objects.filter(
            is_active=True,
            created_at__date__range=[fecha_desde, fecha_hasta]
        )
        total_eval = evaluaciones.exclude(estado='cancelada').count()
        completadas = evaluaciones.filter(estado='completada').count()
        promedio = evaluaciones.filter(
            calificacion_final__isnull=False
        ).aggregate(avg=Avg('calificacion_final'))['avg']

        planes = PlanMejora.objects.filter(
            is_active=True,
            created_at__date__range=[fecha_desde, fecha_hasta]
        )
        planes_activos = planes.filter(estado__in=['aprobado', 'en_ejecucion']).count()
        planes_completados = planes.filter(estado='completado').count()

        reconocimientos = Reconocimiento.objects.filter(
            is_active=True,
            fecha_reconocimiento__range=[fecha_desde, fecha_hasta]
        ).count()

        return {
            'evaluaciones_total': total_eval,
            'evaluaciones_completadas': completadas,
            'tasa_completitud': round((completadas / total_eval * 100), 1) if total_eval > 0 else 0,
            'promedio_calificacion': round(float(promedio), 2) if promedio else None,
            'planes_mejora_activos': planes_activos,
            'planes_mejora_completados': planes_completados,
            'reconocimientos': reconocimientos,
        }

    def get_queryset(self):
        return CicloEvaluacion.objects.filter(
            is_active=True
        )

    def get_serializer_class(self):
        if self.action == 'list':
            return CicloEvaluacionListSerializer
        return CicloEvaluacionDetailSerializer

    def perform_create(self, serializer):
        serializer.save(empresa=get_tenant_empresa(), created_by=self.request.user)

    @action(detail=False, methods=['get'])
    def activo(self, request):
        """Retorna el ciclo de evaluación activo."""
        ciclo = self.get_queryset().filter(
            estado__in=['activo', 'en_evaluacion']
        ).first()
        if ciclo:
            serializer = CicloEvaluacionDetailSerializer(ciclo)
            return Response(serializer.data)
        return Response({'detail': 'No hay ciclo activo'}, status=404)

    @action(detail=True, methods=['post'])
    def activar(self, request, pk=None):
        """Activa el ciclo de evaluación."""
        ciclo = self.get_object()
        ciclo.estado = 'activo'
        ciclo.save()
        return Response({'status': 'Ciclo activado'})

    @action(detail=True, methods=['post'], url_path='iniciar-evaluacion')
    def iniciar_evaluacion(self, request, pk=None):
        """Inicia el período de evaluación."""
        ciclo = self.get_object()
        ciclo.estado = 'en_evaluacion'
        ciclo.fecha_inicio_evaluacion = timezone.now().date()
        ciclo.save()
        return Response({'status': 'Evaluación iniciada'})

    @action(detail=True, methods=['post'])
    def cerrar(self, request, pk=None):
        """Cierra el ciclo de evaluación."""
        ciclo = self.get_object()
        ciclo.estado = 'cerrado'
        ciclo.fecha_cierre = timezone.now().date()
        ciclo.save()
        return Response({'status': 'Ciclo cerrado'})

    @action(detail=True, methods=['get'])
    def escala(self, request, pk=None):
        """Retorna la escala de calificación del ciclo."""
        ciclo = self.get_object()
        escalas = ciclo.escala_calificacion.all()
        serializer = EscalaCalificacionSerializer(escalas, many=True)
        return Response(serializer.data)


class CompetenciaEvaluacionViewSet(viewsets.ModelViewSet):
    """ViewSet para competencias de evaluación."""
    permission_classes = [IsAuthenticated]
    filterset_fields = ['tipo_competencia', 'nivel_esperado', 'aplica_a_todos', 'is_active']
    search_fields = ['codigo', 'nombre', 'descripcion']
    ordering = ['orden', 'nombre']

    def get_queryset(self):
        return CompetenciaEvaluacion.objects.filter(
            is_active=True
        ).prefetch_related('criterios')

    def get_serializer_class(self):
        if self.action == 'list':
            return CompetenciaEvaluacionListSerializer
        return CompetenciaEvaluacionDetailSerializer

    def perform_create(self, serializer):
        serializer.save(empresa=get_tenant_empresa(), created_by=self.request.user)

    @action(detail=False, methods=['get'], url_path='por-tipo')
    def por_tipo(self, request):
        """Retorna competencias agrupadas por tipo."""
        queryset = self.get_queryset()
        result = {}
        for tipo, _ in CompetenciaEvaluacion.TIPO_COMPETENCIA_CHOICES:
            comps = queryset.filter(tipo_competencia=tipo)
            result[tipo] = CompetenciaEvaluacionListSerializer(comps, many=True).data
        return Response(result)


class CriterioEvaluacionViewSet(viewsets.ModelViewSet):
    """ViewSet para criterios de evaluación."""
    permission_classes = [IsAuthenticated]
    serializer_class = CriterioEvaluacionSerializer
    filterset_fields = ['competencia']
    ordering = ['orden']

    def get_queryset(self):
        return CriterioEvaluacion.objects.filter(
            is_active=True
        )

    def perform_create(self, serializer):
        serializer.save(empresa=get_tenant_empresa(), created_by=self.request.user)


class EvaluacionDesempenoViewSet(viewsets.ModelViewSet):
    """ViewSet para evaluaciones de desempeño."""
    permission_classes = [IsAuthenticated]
    filterset_fields = ['ciclo', 'colaborador', 'estado', 'jefe_evaluador']
    search_fields = ['colaborador__primer_nombre', 'colaborador__primer_apellido']
    ordering = ['-ciclo__anio', 'colaborador']

    def get_queryset(self):
        return EvaluacionDesempeno.objects.filter(
            is_active=True
        ).select_related('ciclo', 'colaborador', 'jefe_evaluador')

    def get_serializer_class(self):
        if self.action == 'list':
            return EvaluacionDesempenoListSerializer
        if self.action == 'create':
            return EvaluacionDesempenoCreateSerializer
        return EvaluacionDesempenoDetailSerializer

    def perform_create(self, serializer):
        serializer.save(empresa=get_tenant_empresa(), created_by=self.request.user)

    @action(detail=True, methods=['post'], url_path='iniciar-autoevaluacion')
    def iniciar_autoevaluacion(self, request, pk=None):
        """Inicia la autoevaluación."""
        evaluacion = self.get_object()
        evaluacion.estado = 'en_autoevaluacion'
        evaluacion.fecha_inicio_autoevaluacion = timezone.now()
        evaluacion.save()
        return Response({'status': 'Autoevaluación iniciada'})

    @action(detail=True, methods=['post'], url_path='completar-autoevaluacion')
    def completar_autoevaluacion(self, request, pk=None):
        """Completa la autoevaluación."""
        evaluacion = self.get_object()
        calificacion = request.data.get('calificacion')
        if calificacion:
            evaluacion.calificacion_autoevaluacion = calificacion
        evaluacion.estado = 'en_evaluacion_jefe'
        evaluacion.fecha_fin_autoevaluacion = timezone.now()
        evaluacion.save()
        return Response({'status': 'Autoevaluación completada'})

    @action(detail=True, methods=['post'], url_path='evaluar-jefe')
    def evaluar_jefe(self, request, pk=None):
        """Registra la evaluación del jefe."""
        evaluacion = self.get_object()
        calificacion = request.data.get('calificacion')
        fortalezas = request.data.get('fortalezas', '')
        areas_mejora = request.data.get('areas_mejora', '')

        evaluacion.calificacion_jefe = calificacion
        evaluacion.fortalezas = fortalezas
        evaluacion.areas_mejora = areas_mejora
        evaluacion.fecha_evaluacion_jefe = timezone.now()

        if evaluacion.ciclo.incluye_evaluacion_pares:
            evaluacion.estado = 'en_evaluacion_pares'
        else:
            evaluacion.estado = 'en_revision'

        evaluacion.save()
        return Response({'status': 'Evaluación de jefe registrada'})

    @action(detail=True, methods=['post'])
    def calibrar(self, request, pk=None):
        """Aplica calibración gerencial."""
        evaluacion = self.get_object()
        evaluacion.calificacion_calibrada = request.data.get('calificacion')
        evaluacion.motivo_calibracion = request.data.get('motivo', '')
        evaluacion.calibrado_por = request.user
        evaluacion.estado = 'retroalimentacion'
        evaluacion.save()
        return Response({'status': 'Calibración aplicada'})

    @action(detail=True, methods=['post'])
    def firmar(self, request, pk=None):
        """El colaborador firma la evaluación."""
        evaluacion = self.get_object()
        evaluacion.comentarios_colaborador = request.data.get('comentarios', '')
        evaluacion.firma_colaborador = True
        evaluacion.fecha_firma_colaborador = timezone.now()
        evaluacion.estado = 'completada'
        evaluacion.fecha_cierre = timezone.now()
        evaluacion.calcular_calificacion_final()
        evaluacion.save()
        return Response({'status': 'Evaluación firmada y completada'})

    @action(detail=True, methods=['post'], url_path='asignar-par')
    def asignar_par(self, request, pk=None):
        """Asigna un evaluador par."""
        evaluacion = self.get_object()
        EvaluadorPar.objects.create(
            evaluacion=evaluacion,
            evaluador_id=request.data.get('evaluador_id'),
            es_subordinado=request.data.get('es_subordinado', False),
            fecha_limite=request.data.get('fecha_limite'),
            created_by=request.user
        )
        return Response({'status': 'Evaluador par asignado'})

    @action(detail=False, methods=['get'], url_path='mis-evaluaciones')
    def mis_evaluaciones(self, request):
        """Evaluaciones donde el usuario es evaluador."""
        evaluaciones = self.get_queryset().filter(jefe_evaluador=request.user)
        serializer = EvaluacionDesempenoListSerializer(evaluaciones, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='pendientes-pares')
    def pendientes_pares(self, request):
        """Evaluaciones pendientes como par."""
        asignaciones = EvaluadorPar.objects.filter(
            evaluador=request.user,
            estado='pendiente'
        ).select_related('evaluacion__colaborador')
        data = []
        for asig in asignaciones:
            data.append({
                'id': asig.id,
                'evaluacion_id': asig.evaluacion_id,
                'colaborador_nombre': asig.evaluacion.colaborador.get_nombre_completo(),
                'fecha_limite': asig.fecha_limite,
                'es_subordinado': asig.es_subordinado,
            })
        return Response(data)


class DetalleEvaluacionViewSet(viewsets.ModelViewSet):
    """ViewSet para detalles de evaluación."""
    permission_classes = [IsAuthenticated]
    serializer_class = DetalleEvaluacionSerializer
    filterset_fields = ['evaluacion', 'competencia', 'tipo_evaluador']
    ordering = ['competencia__orden']

    def get_queryset(self):
        return DetalleEvaluacion.objects.filter(
            is_active=True
        ).select_related('competencia', 'criterio', 'evaluador')

    def perform_create(self, serializer):
        serializer.save(
            empresa=get_tenant_empresa(),
            created_by=self.request.user,
            evaluador=self.request.user
        )


class PlanMejoraViewSet(viewsets.ModelViewSet):
    """ViewSet para planes de mejora."""
    permission_classes = [IsAuthenticated]
    filterset_fields = ['colaborador', 'tipo_plan', 'estado', 'responsable']
    search_fields = ['codigo', 'titulo', 'colaborador__primer_nombre']
    ordering = ['-fecha_inicio']

    def get_queryset(self):
        return PlanMejora.objects.filter(
            is_active=True
        ).select_related('colaborador', 'responsable', 'evaluacion')

    def get_serializer_class(self):
        if self.action == 'list':
            return PlanMejoraListSerializer
        if self.action in ['create', 'update', 'partial_update']:
            return PlanMejoraCreateUpdateSerializer
        return PlanMejoraDetailSerializer

    def perform_create(self, serializer):
        serializer.save(empresa=get_tenant_empresa(), created_by=self.request.user)

    @action(detail=True, methods=['post'])
    def aprobar(self, request, pk=None):
        """Aprueba el plan de mejora."""
        plan = self.get_object()
        plan.estado = 'aprobado'
        plan.aprobado_por = request.user
        plan.fecha_aprobacion = timezone.now().date()
        plan.save()
        return Response({'status': 'Plan aprobado'})

    @action(detail=True, methods=['post'])
    def iniciar(self, request, pk=None):
        """Inicia la ejecución del plan."""
        plan = self.get_object()
        plan.estado = 'en_ejecucion'
        plan.save()
        return Response({'status': 'Plan en ejecución'})

    @action(detail=True, methods=['post'])
    def completar(self, request, pk=None):
        """Marca el plan como completado."""
        plan = self.get_object()
        plan.estado = 'completado'
        plan.porcentaje_avance = 100
        plan.save()
        return Response({'status': 'Plan completado'})

    @action(detail=True, methods=['post'], url_path='agregar-seguimiento')
    def agregar_seguimiento(self, request, pk=None):
        """Agrega un registro de seguimiento."""
        plan = self.get_object()
        seguimiento = SeguimientoPlanMejora.objects.create(
            plan=plan,
            fecha_seguimiento=request.data.get('fecha_seguimiento', timezone.now().date()),
            realizado_por=request.user,
            porcentaje_avance=request.data.get('porcentaje_avance', 0),
            logros=request.data.get('logros', ''),
            dificultades=request.data.get('dificultades', ''),
            acciones_correctivas=request.data.get('acciones_correctivas', ''),
            proxima_fecha_seguimiento=request.data.get('proxima_fecha_seguimiento'),
            observaciones=request.data.get('observaciones', ''),
            created_by=request.user
        )
        plan.porcentaje_avance = seguimiento.porcentaje_avance
        plan.save(update_fields=['porcentaje_avance'])
        return Response({'status': 'Seguimiento registrado'})

    @action(detail=False, methods=['get'], url_path='por-colaborador')
    def por_colaborador(self, request):
        """Retorna planes de un colaborador."""
        colaborador_id = request.query_params.get('colaborador_id')
        if not colaborador_id:
            return Response({'error': 'Se requiere colaborador_id'}, status=400)
        planes = self.get_queryset().filter(colaborador_id=colaborador_id)
        serializer = PlanMejoraListSerializer(planes, many=True)
        return Response(serializer.data)


class ActividadPlanMejoraViewSet(viewsets.ModelViewSet):
    """ViewSet para actividades de plan de mejora."""
    permission_classes = [IsAuthenticated]
    serializer_class = ActividadPlanMejoraSerializer
    filterset_fields = ['plan', 'tipo_actividad', 'estado', 'responsable']
    ordering = ['prioridad', 'fecha_inicio']

    def get_queryset(self):
        return ActividadPlanMejora.objects.filter(
            is_active=True
        ).select_related('plan', 'responsable')

    def perform_create(self, serializer):
        serializer.save(empresa=get_tenant_empresa(), created_by=self.request.user)

    @action(detail=True, methods=['post'])
    def completar(self, request, pk=None):
        """Marca la actividad como completada."""
        actividad = self.get_object()
        actividad.estado = 'completada'
        actividad.fecha_completado = timezone.now().date()
        actividad.save()
        actividad.plan.actualizar_avance()
        return Response({'status': 'Actividad completada'})


class TipoReconocimientoViewSet(viewsets.ModelViewSet):
    """ViewSet para tipos de reconocimiento."""
    permission_classes = [IsAuthenticated]
    serializer_class = TipoReconocimientoSerializer
    filterset_fields = ['categoria', 'tiene_premio', 'is_active']
    ordering = ['orden', 'nombre']

    def get_queryset(self):
        return TipoReconocimiento.objects.filter(
            is_active=True
        )

    def perform_create(self, serializer):
        serializer.save(empresa=get_tenant_empresa(), created_by=self.request.user)


class ReconocimientoViewSet(viewsets.ModelViewSet):
    """ViewSet para reconocimientos."""
    permission_classes = [IsAuthenticated]
    filterset_fields = ['colaborador', 'tipo_reconocimiento', 'estado', 'nominado_por']
    search_fields = ['colaborador__primer_nombre', 'motivo']
    ordering = ['-fecha_reconocimiento']

    def get_queryset(self):
        return Reconocimiento.objects.filter(
            is_active=True
        ).select_related('colaborador', 'tipo_reconocimiento', 'nominado_por')

    def get_serializer_class(self):
        if self.action == 'list':
            return ReconocimientoListSerializer
        if self.action == 'create':
            return ReconocimientoCreateSerializer
        return ReconocimientoDetailSerializer

    def perform_create(self, serializer):
        serializer.save(
            empresa=get_tenant_empresa(),
            created_by=self.request.user,
            nominado_por=self.request.user
        )

    @action(detail=True, methods=['post'])
    def aprobar(self, request, pk=None):
        """Aprueba el reconocimiento."""
        reconocimiento = self.get_object()
        reconocimiento.aprobar(request.user)
        return Response({'status': 'Reconocimiento aprobado'})

    @action(detail=True, methods=['post'])
    def rechazar(self, request, pk=None):
        """Rechaza el reconocimiento."""
        reconocimiento = self.get_object()
        reconocimiento.estado = 'rechazado'
        reconocimiento.observaciones = request.data.get('motivo', '')
        reconocimiento.save()
        return Response({'status': 'Reconocimiento rechazado'})

    @action(detail=True, methods=['post'])
    def entregar(self, request, pk=None):
        """Marca como entregado."""
        reconocimiento = self.get_object()
        reconocimiento.entregar()
        return Response({'status': 'Reconocimiento entregado'})

    @action(detail=True, methods=['post'], url_path='publicar-muro')
    def publicar_muro(self, request, pk=None):
        """Publica en el muro de reconocimientos."""
        reconocimiento = self.get_object()
        MuroReconocimientos.objects.create(
            reconocimiento=reconocimiento,
            titulo=request.data.get('titulo', reconocimiento.tipo_reconocimiento.nombre),
            mensaje=request.data.get('mensaje', reconocimiento.motivo),
            es_destacado=request.data.get('es_destacado', False),
            created_by=request.user
        )
        reconocimiento.publicado_en_muro = True
        reconocimiento.fecha_publicacion = timezone.now()
        reconocimiento.save()
        return Response({'status': 'Publicado en muro'})

    @action(detail=False, methods=['get'], url_path='mis-reconocimientos')
    def mis_reconocimientos(self, request):
        """Reconocimientos del usuario actual."""
        colaborador_id = request.query_params.get('colaborador_id')
        if not colaborador_id:
            return Response({'error': 'Se requiere colaborador_id'}, status=400)
        reconocimientos = self.get_queryset().filter(colaborador_id=colaborador_id)
        serializer = ReconocimientoListSerializer(reconocimientos, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='pendientes-aprobacion')
    def pendientes_aprobacion(self, request):
        """Reconocimientos pendientes de aprobación."""
        reconocimientos = self.get_queryset().filter(estado='pendiente')
        serializer = ReconocimientoListSerializer(reconocimientos, many=True)
        return Response(serializer.data)


class MuroReconocimientosViewSet(viewsets.ModelViewSet):
    """ViewSet para el muro de reconocimientos."""
    permission_classes = [IsAuthenticated]
    serializer_class = MuroReconocimientosSerializer
    filterset_fields = ['es_destacado']
    ordering = ['-fecha_publicacion']

    def get_queryset(self):
        return MuroReconocimientos.objects.filter(
            is_active=True
        ).select_related('reconocimiento__colaborador', 'reconocimiento__tipo_reconocimiento')

    @action(detail=True, methods=['post'], url_path='dar-like')
    def dar_like(self, request, pk=None):
        """Incrementa los likes."""
        publicacion = self.get_object()
        publicacion.likes += 1
        publicacion.save(update_fields=['likes'])
        return Response({'likes': publicacion.likes})

    @action(detail=False, methods=['get'])
    def destacados(self, request):
        """Retorna publicaciones destacadas."""
        publicaciones = self.get_queryset().filter(es_destacado=True)[:5]
        serializer = MuroReconocimientosSerializer(publicaciones, many=True)
        return Response(serializer.data)


class DesempenoEstadisticasViewSet(viewsets.ViewSet):
    """ViewSet para estadísticas de desempeño."""
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['get'])
    def resumen(self, request):
        """Resumen general de desempeño."""
        hoy = timezone.now().date()
        inicio_mes = hoy.replace(day=1)

        # Ciclo activo
        ciclo_activo = CicloEvaluacion.objects.filter(
            is_active=True, estado__in=['activo', 'en_evaluacion']
        ).first()

        # Evaluaciones
        evaluaciones = EvaluacionDesempeno.objects.filter(is_active=True)
        if ciclo_activo:
            evaluaciones = evaluaciones.filter(ciclo=ciclo_activo)

        pendientes = evaluaciones.filter(estado='pendiente').count()
        completadas = evaluaciones.filter(estado='completada').count()
        en_proceso = evaluaciones.exclude(estado__in=['pendiente', 'completada', 'cancelada']).count()
        total = evaluaciones.exclude(estado='cancelada').count()

        # Promedio
        promedio = evaluaciones.filter(
            calificacion_final__isnull=False
        ).aggregate(avg=Avg('calificacion_final'))['avg'] or 0

        # Planes de mejora activos
        planes_activos = PlanMejora.objects.filter(
            is_active=True, estado__in=['aprobado', 'en_ejecucion', 'seguimiento']
        ).count()

        # Reconocimientos del mes
        reconocimientos_mes = Reconocimiento.objects.filter(
            is_active=True, fecha_reconocimiento__gte=inicio_mes
        ).count()

        # Tasa de completitud
        tasa = (completadas / total * 100) if total > 0 else 0

        data = {
            'ciclo_activo': ciclo_activo.nombre if ciclo_activo else 'Sin ciclo activo',
            'evaluaciones_pendientes': pendientes,
            'evaluaciones_completadas': completadas,
            'evaluaciones_en_proceso': en_proceso,
            'promedio_calificacion': round(promedio, 2),
            'planes_mejora_activos': planes_activos,
            'reconocimientos_mes': reconocimientos_mes,
            'tasa_completitud': round(tasa, 2),
        }
        serializer = DesempenoEstadisticasSerializer(data)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='distribucion-calificaciones')
    def distribucion_calificaciones(self, request):
        """Distribución de calificaciones del ciclo actual."""
        ciclo_id = request.query_params.get('ciclo_id')

        evaluaciones = EvaluacionDesempeno.objects.filter(
            is_active=True, estado='completada'
        )
        if ciclo_id:
            evaluaciones = evaluaciones.filter(ciclo_id=ciclo_id)

        rangos = [
            ('excelente', 90, 100),
            ('sobresaliente', 80, 89.99),
            ('bueno', 70, 79.99),
            ('aceptable', 60, 69.99),
            ('necesita_mejora', 0, 59.99),
        ]

        distribucion = {}
        for nombre, min_val, max_val in rangos:
            count = evaluaciones.filter(
                calificacion_final__gte=min_val,
                calificacion_final__lte=max_val
            ).count()
            distribucion[nombre] = count

        return Response(distribucion)

    @action(detail=False, methods=['get'], url_path='top-reconocidos')
    def top_reconocidos(self, request):
        """Colaboradores más reconocidos."""
        limite = int(request.query_params.get('limite', 10))

        top = Reconocimiento.objects.filter(
            is_active=True, estado='entregado'
        ).values('colaborador', 'colaborador__primer_nombre', 'colaborador__primer_apellido').annotate(
            total=Count('id')
        ).order_by('-total')[:limite]

        data = [{
            'colaborador_id': item['colaborador'],
            'colaborador_nombre': f"{item['colaborador__primer_nombre']} {item['colaborador__primer_apellido']}",
            'reconocimientos': item['total'],
        } for item in top]

        return Response(data)
