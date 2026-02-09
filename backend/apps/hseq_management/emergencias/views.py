"""
Views para Gestión de Emergencias
ViewSets con filtrado multi-tenant y actions personalizados
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters
from django.db.models import Avg, Count, Q
from django.utils import timezone

from .models import (
    AnalisisVulnerabilidad, Amenaza, PlanEmergencia, ProcedimientoEmergencia,
    PlanoEvacuacion, TipoBrigada, Brigada, BrigadistaActivo,
    Simulacro, EvaluacionSimulacro, RecursoEmergencia, InspeccionRecurso
)
from .serializers import (
    AnalisisVulnerabilidadListSerializer, AnalisisVulnerabilidadDetailSerializer,
    AmenazaSerializer, PlanEmergenciaListSerializer, PlanEmergenciaDetailSerializer,
    ProcedimientoEmergenciaSerializer, PlanoEvacuacionSerializer,
    TipoBrigadaSerializer, BrigadaListSerializer, BrigadaDetailSerializer,
    BrigadistaActivoSerializer, SimulacroListSerializer, SimulacroDetailSerializer,
    EvaluacionSimulacroSerializer, RecursoEmergenciaListSerializer,
    RecursoEmergenciaDetailSerializer, InspeccionRecursoSerializer,
    ProgramarSimulacroSerializer, RegistrarEvaluacionSerializer
)


class AnalisisVulnerabilidadViewSet(viewsets.ModelViewSet):
    """
    ViewSet para Análisis de Vulnerabilidad
    Maneja análisis de vulnerabilidad ante amenazas
    """
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['tipo_amenaza', 'nivel_vulnerabilidad', 'estado']
    search_fields = ['codigo', 'nombre', 'responsable_analisis']
    ordering_fields = ['fecha_analisis', 'puntuacion_vulnerabilidad', 'codigo']
    ordering = ['-fecha_analisis']

    def get_queryset(self):
        """Filtrar por empresa_id"""
        user = self.request.user
        empresa_id = getattr(user, 'empresa_id', None)
        if empresa_id:
            return AnalisisVulnerabilidad.objects.filter(
                empresa_id=empresa_id,
                activo=True
            ).prefetch_related('amenazas')
        return AnalisisVulnerabilidad.objects.none()

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return AnalisisVulnerabilidadDetailSerializer
        return AnalisisVulnerabilidadListSerializer

    def perform_create(self, serializer):
        """Asignar empresa_id al crear"""
        user = self.request.user
        empresa_id = getattr(user, 'empresa_id', None)
        serializer.save(
            empresa_id=empresa_id,
            creado_por=user.get_full_name() or user.username
        )

    def perform_update(self, serializer):
        """Registrar quién actualizó"""
        user = self.request.user
        serializer.save(
            actualizado_por=user.get_full_name() or user.username
        )

    @action(detail=True, methods=['post'])
    def aprobar(self, request, pk=None):
        """Aprobar análisis de vulnerabilidad"""
        analisis = self.get_object()
        analisis.estado = 'APROBADO'
        analisis.fecha_aprobacion = timezone.now().date()
        analisis.aprobado_por = request.user.get_full_name() or request.user.username
        analisis.save()

        return Response({
            'message': 'Análisis aprobado exitosamente',
            'analisis': self.get_serializer(analisis).data
        })

    @action(detail=False, methods=['get'])
    def estadisticas(self, request):
        """Estadisticas de analisis de vulnerabilidad"""
        qs = self.get_queryset()
        total = qs.count()
        por_estado = dict(qs.values_list('estado').annotate(c=Count('id')).values_list('estado', 'c'))
        por_nivel = dict(qs.values_list('nivel_vulnerabilidad').annotate(c=Count('id')).values_list('nivel_vulnerabilidad', 'c'))
        amenazas_criticas = Amenaza.objects.filter(
            analisis__in=qs,
            nivel_riesgo__in=['ALTO', 'MUY_ALTO'],
            activo=True,
        ).count()

        return Response({
            'total': total,
            'por_estado': por_estado,
            'por_nivel_vulnerabilidad': por_nivel,
            'amenazas_criticas': amenazas_criticas,
            'aprobados': por_estado.get('APROBADO', 0),
        })


class AmenazaViewSet(viewsets.ModelViewSet):
    """
    ViewSet para Amenazas
    Gestión de amenazas identificadas
    """
    serializer_class = AmenazaSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['categoria', 'analisis_vulnerabilidad', 'probabilidad', 'severidad']
    search_fields = ['codigo', 'nombre', 'descripcion']
    ordering_fields = ['nivel_riesgo', 'nombre', 'codigo']
    ordering = ['-nivel_riesgo']

    def get_queryset(self):
        user = self.request.user
        empresa_id = getattr(user, 'empresa_id', None)
        if empresa_id:
            return Amenaza.objects.filter(
                empresa_id=empresa_id,
                activo=True
            ).select_related('analisis_vulnerabilidad')
        return Amenaza.objects.none()

    def perform_create(self, serializer):
        user = self.request.user
        empresa_id = getattr(user, 'empresa_id', None)
        serializer.save(empresa_id=empresa_id)


class PlanEmergenciaViewSet(viewsets.ModelViewSet):
    """
    ViewSet para Planes de Emergencia
    Gestión de planes de emergencia
    """
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['estado', 'version']
    search_fields = ['codigo', 'nombre', 'director_emergencias']
    ordering_fields = ['fecha_elaboracion', 'fecha_vigencia', 'codigo']
    ordering = ['-fecha_elaboracion']

    def get_queryset(self):
        user = self.request.user
        empresa_id = getattr(user, 'empresa_id', None)
        if empresa_id:
            return PlanEmergencia.objects.filter(
                empresa_id=empresa_id,
                activo=True
            ).prefetch_related('procedimientos', 'planos_evacuacion', 'simulacros')
        return PlanEmergencia.objects.none()

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return PlanEmergenciaDetailSerializer
        return PlanEmergenciaListSerializer

    def perform_create(self, serializer):
        user = self.request.user
        empresa_id = getattr(user, 'empresa_id', None)
        serializer.save(
            empresa_id=empresa_id,
            creado_por=user.get_full_name() or user.username
        )

    @action(detail=True, methods=['post'])
    def aprobar(self, request, pk=None):
        """Aprobar plan de emergencia"""
        plan = self.get_object()
        plan.estado = 'APROBADO'
        plan.fecha_aprobacion = timezone.now().date()
        plan.aprobado_por = request.user.get_full_name() or request.user.username
        plan.save()

        return Response({
            'message': 'Plan de emergencia aprobado exitosamente',
            'plan': self.get_serializer(plan).data
        })

    @action(detail=True, methods=['post'])
    def activar(self, request, pk=None):
        """Activar plan de emergencia como vigente"""
        plan = self.get_object()

        if plan.estado != 'APROBADO':
            return Response(
                {'error': 'El plan debe estar aprobado para activarse'},
                status=status.HTTP_400_BAD_REQUEST
            )

        plan.estado = 'VIGENTE'
        plan.save()

        return Response({
            'message': 'Plan de emergencia activado como vigente',
            'plan': self.get_serializer(plan).data
        })


class ProcedimientoEmergenciaViewSet(viewsets.ModelViewSet):
    """
    ViewSet para Procedimientos de Emergencia (PON)
    """
    serializer_class = ProcedimientoEmergenciaSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['tipo_emergencia', 'estado', 'plan_emergencia']
    search_fields = ['codigo', 'nombre']
    ordering_fields = ['tipo_emergencia', 'codigo']
    ordering = ['tipo_emergencia']

    def get_queryset(self):
        user = self.request.user
        empresa_id = getattr(user, 'empresa_id', None)
        if empresa_id:
            return ProcedimientoEmergencia.objects.filter(
                empresa_id=empresa_id,
                activo=True
            ).select_related('plan_emergencia')
        return ProcedimientoEmergencia.objects.none()

    def perform_create(self, serializer):
        user = self.request.user
        empresa_id = getattr(user, 'empresa_id', None)
        serializer.save(empresa_id=empresa_id)


class PlanoEvacuacionViewSet(viewsets.ModelViewSet):
    """
    ViewSet para Planos de Evacuación
    """
    serializer_class = PlanoEvacuacionSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['edificio', 'piso', 'publicado', 'plan_emergencia']
    search_fields = ['codigo', 'nombre', 'area']
    ordering_fields = ['edificio', 'piso', 'codigo']
    ordering = ['edificio', 'piso']

    def get_queryset(self):
        user = self.request.user
        empresa_id = getattr(user, 'empresa_id', None)
        if empresa_id:
            return PlanoEvacuacion.objects.filter(
                empresa_id=empresa_id,
                activo=True
            ).select_related('plan_emergencia')
        return PlanoEvacuacion.objects.none()

    def perform_create(self, serializer):
        user = self.request.user
        empresa_id = getattr(user, 'empresa_id', None)
        serializer.save(
            empresa_id=empresa_id,
            creado_por=user.get_full_name() or user.username
        )

    @action(detail=True, methods=['post'])
    def publicar(self, request, pk=None):
        """Marcar plano como publicado"""
        plano = self.get_object()
        plano.publicado = True
        plano.save()

        return Response({
            'message': 'Plano marcado como publicado',
            'plano': self.get_serializer(plano).data
        })


class TipoBrigadaViewSet(viewsets.ModelViewSet):
    """
    ViewSet para Tipos de Brigada
    """
    serializer_class = TipoBrigadaSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['certificacion_requerida']
    search_fields = ['codigo', 'nombre']
    ordering_fields = ['nivel_prioridad', 'nombre']
    ordering = ['nivel_prioridad']

    def get_queryset(self):
        user = self.request.user
        empresa_id = getattr(user, 'empresa_id', None)
        if empresa_id:
            return TipoBrigada.objects.filter(
                empresa_id=empresa_id,
                activo=True
            )
        return TipoBrigada.objects.none()

    def perform_create(self, serializer):
        user = self.request.user
        empresa_id = getattr(user, 'empresa_id', None)
        serializer.save(empresa_id=empresa_id)


class BrigadaViewSet(viewsets.ModelViewSet):
    """
    ViewSet para Brigadas
    """
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['tipo_brigada', 'estado']
    search_fields = ['codigo', 'nombre', 'lider_brigada']
    ordering_fields = ['nombre', 'fecha_conformacion']
    ordering = ['tipo_brigada', 'nombre']

    def get_queryset(self):
        user = self.request.user
        empresa_id = getattr(user, 'empresa_id', None)
        if empresa_id:
            return Brigada.objects.filter(
                empresa_id=empresa_id,
                activo=True
            ).select_related('tipo_brigada').prefetch_related('brigadistas')
        return Brigada.objects.none()

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return BrigadaDetailSerializer
        return BrigadaListSerializer

    def perform_create(self, serializer):
        user = self.request.user
        empresa_id = getattr(user, 'empresa_id', None)
        serializer.save(
            empresa_id=empresa_id,
            creado_por=user.get_full_name() or user.username
        )

    @action(detail=True, methods=['post'])
    def activar(self, request, pk=None):
        """Activar brigada"""
        brigada = self.get_object()
        brigada.estado = 'ACTIVA'
        brigada.save()

        return Response({
            'message': 'Brigada activada exitosamente',
            'brigada': self.get_serializer(brigada).data
        })

    @action(detail=False, methods=['get'])
    def estadisticas(self, request):
        """Estadisticas de brigadas"""
        qs = self.get_queryset()
        user = request.user
        empresa_id = getattr(user, 'empresa_id', None)

        total_brigadas = qs.count()
        activas = qs.filter(estado='ACTIVA').count()

        brigadistas_qs = BrigadistaActivo.objects.filter(
            empresa_id=empresa_id, activo=True
        )
        total_brigadistas = brigadistas_qs.count()
        en_formacion = brigadistas_qs.filter(estado='EN_FORMACION').count()

        return Response({
            'total_brigadas': total_brigadas,
            'brigadas_activas': activas,
            'total_brigadistas': total_brigadistas,
            'brigadistas_en_formacion': en_formacion,
        })


class BrigadistaActivoViewSet(viewsets.ModelViewSet):
    """
    ViewSet para Brigadistas Activos
    """
    serializer_class = BrigadistaActivoSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['brigada', 'estado', 'rol', 'grupo_sanguineo']
    search_fields = ['nombre_completo', 'documento_identidad', 'codigo_empleado']
    ordering_fields = ['nombre_completo', 'fecha_ingreso_brigada']
    ordering = ['brigada', 'nombre_completo']

    def get_queryset(self):
        user = self.request.user
        empresa_id = getattr(user, 'empresa_id', None)
        if empresa_id:
            return BrigadistaActivo.objects.filter(
                empresa_id=empresa_id,
                activo=True
            ).select_related('brigada')
        return BrigadistaActivo.objects.none()

    def perform_create(self, serializer):
        user = self.request.user
        empresa_id = getattr(user, 'empresa_id', None)
        brigadista = serializer.save(empresa_id=empresa_id)

        # Actualizar conteo de brigadistas en la brigada
        brigada = brigadista.brigada
        brigada.numero_brigadistas_actuales = brigada.brigadistas.filter(
            activo=True,
            estado='ACTIVO'
        ).count()
        brigada.save()

    @action(detail=True, methods=['post'])
    def inactivar(self, request, pk=None):
        """Inactivar brigadista"""
        brigadista = self.get_object()
        brigadista.estado = 'INACTIVO'
        brigadista.fecha_inactivacion = timezone.now().date()
        brigadista.motivo_inactivacion = request.data.get('motivo', '')
        brigadista.save()

        # Actualizar conteo
        brigada = brigadista.brigada
        brigada.numero_brigadistas_actuales = brigada.brigadistas.filter(
            activo=True,
            estado='ACTIVO'
        ).count()
        brigada.save()

        return Response({
            'message': 'Brigadista inactivado exitosamente',
            'brigadista': self.get_serializer(brigadista).data
        })


class SimulacroViewSet(viewsets.ModelViewSet):
    """
    ViewSet para Simulacros
    """
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['tipo_simulacro', 'estado', 'alcance', 'plan_emergencia']
    search_fields = ['codigo', 'nombre', 'coordinador']
    ordering_fields = ['fecha_programada', 'codigo']
    ordering = ['-fecha_programada']

    def get_queryset(self):
        user = self.request.user
        empresa_id = getattr(user, 'empresa_id', None)
        if empresa_id:
            return Simulacro.objects.filter(
                empresa_id=empresa_id,
                activo=True
            ).select_related('plan_emergencia').prefetch_related('brigadas_participantes', 'evaluaciones')
        return Simulacro.objects.none()

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return SimulacroDetailSerializer
        return SimulacroListSerializer

    def perform_create(self, serializer):
        user = self.request.user
        empresa_id = getattr(user, 'empresa_id', None)
        serializer.save(
            empresa_id=empresa_id,
            creado_por=user.get_full_name() or user.username
        )

    @action(detail=False, methods=['post'])
    def programar_simulacro(self, request):
        """
        Action para programar un nuevo simulacro
        """
        serializer = ProgramarSimulacroSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        data = serializer.validated_data
        user = request.user
        empresa_id = getattr(user, 'empresa_id', None)

        # Verificar que el plan de emergencia existe
        try:
            plan = PlanEmergencia.objects.get(
                id=data['plan_emergencia_id'],
                empresa_id=empresa_id
            )
        except PlanEmergencia.DoesNotExist:
            return Response(
                {'error': 'Plan de emergencia no encontrado'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Generar código automático
        año = timezone.now().year
        count = Simulacro.objects.filter(
            empresa_id=empresa_id,
            fecha_programada__year=año
        ).count() + 1
        codigo = f"SIM-{año}-{count:03d}"

        # Crear simulacro
        simulacro = Simulacro.objects.create(
            empresa_id=empresa_id,
            plan_emergencia=plan,
            codigo=codigo,
            nombre=data['nombre'],
            tipo_simulacro=data['tipo_simulacro'],
            alcance=data['alcance'],
            fecha_programada=data['fecha_programada'],
            duracion_programada=data['duracion_programada'],
            objetivo_general=data['objetivo_general'],
            objetivos_especificos=data.get('objetivos_especificos', ''),
            descripcion_escenario=data['descripcion_escenario'],
            ubicacion=data['ubicacion'],
            areas_involucradas=data['areas_involucradas'],
            coordinador=data['coordinador'],
            numero_participantes_esperados=data['numero_participantes_esperados'],
            tipo_simulacro_anunciado=data.get('tipo_simulacro_anunciado', True),
            notificar_participantes=data.get('notificar_participantes', False),
            estado='PROGRAMADO',
            creado_por=user.get_full_name() or user.username
        )

        # Asignar brigadas participantes
        if 'brigadas_participantes_ids' in data and data['brigadas_participantes_ids']:
            brigadas = Brigada.objects.filter(
                id__in=data['brigadas_participantes_ids'],
                empresa_id=empresa_id
            )
            simulacro.brigadas_participantes.set(brigadas)

        return Response({
            'message': 'Simulacro programado exitosamente',
            'simulacro': SimulacroDetailSerializer(simulacro).data
        }, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def marcar_realizado(self, request, pk=None):
        """Marcar simulacro como realizado"""
        simulacro = self.get_object()

        if simulacro.estado not in ['PROGRAMADO', 'CONFIRMADO']:
            return Response(
                {'error': 'El simulacro no puede ser marcado como realizado en su estado actual'},
                status=status.HTTP_400_BAD_REQUEST
            )

        simulacro.estado = 'REALIZADO'
        simulacro.fecha_realizada = timezone.now()
        simulacro.duracion_real = request.data.get('duracion_real')
        simulacro.numero_participantes_reales = request.data.get('numero_participantes_reales', 0)
        simulacro.observaciones = request.data.get('observaciones', '')
        simulacro.fue_exitoso = request.data.get('fue_exitoso', False)
        simulacro.save()

        return Response({
            'message': 'Simulacro marcado como realizado',
            'simulacro': self.get_serializer(simulacro).data
        })

    @action(detail=False, methods=['post'])
    def registrar_evaluacion(self, request):
        """
        Action para registrar evaluación de simulacro
        """
        serializer = RegistrarEvaluacionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        data = serializer.validated_data
        user = request.user
        empresa_id = getattr(user, 'empresa_id', None)

        # Verificar que el simulacro existe
        try:
            simulacro = Simulacro.objects.get(
                id=data['simulacro_id'],
                empresa_id=empresa_id
            )
        except Simulacro.DoesNotExist:
            return Response(
                {'error': 'Simulacro no encontrado'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Verificar que el simulacro está realizado
        if simulacro.estado != 'REALIZADO':
            return Response(
                {'error': 'El simulacro debe estar realizado para ser evaluado'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Crear evaluación
        evaluacion = EvaluacionSimulacro.objects.create(
            empresa_id=empresa_id,
            simulacro=simulacro,
            fecha_evaluacion=data['fecha_evaluacion'],
            evaluador=data['evaluador'],
            cargo_evaluador=data.get('cargo_evaluador', ''),
            tiempo_respuesta_calificacion=data['tiempo_respuesta_calificacion'],
            tiempo_respuesta_observaciones=data.get('tiempo_respuesta_observaciones', ''),
            activacion_alarma_calificacion=data['activacion_alarma_calificacion'],
            activacion_alarma_observaciones=data.get('activacion_alarma_observaciones', ''),
            comunicacion_calificacion=data['comunicacion_calificacion'],
            comunicacion_observaciones=data.get('comunicacion_observaciones', ''),
            evacuacion_calificacion=data['evacuacion_calificacion'],
            evacuacion_observaciones=data.get('evacuacion_observaciones', ''),
            brigadas_calificacion=data['brigadas_calificacion'],
            brigadas_observaciones=data.get('brigadas_observaciones', ''),
            punto_encuentro_calificacion=data['punto_encuentro_calificacion'],
            punto_encuentro_observaciones=data.get('punto_encuentro_observaciones', ''),
            conteo_personas_calificacion=data['conteo_personas_calificacion'],
            conteo_personas_observaciones=data.get('conteo_personas_observaciones', ''),
            tiempo_deteccion=data.get('tiempo_deteccion'),
            tiempo_alarma=data.get('tiempo_alarma'),
            tiempo_evacuacion_total=data.get('tiempo_evacuacion_total'),
            personas_evacuadas=data['personas_evacuadas'],
            personas_no_evacuadas=data['personas_no_evacuadas'],
            personas_heridas_simuladas=data.get('personas_heridas_simuladas', 0),
            fortalezas_identificadas=data['fortalezas_identificadas'],
            debilidades_identificadas=data['debilidades_identificadas'],
            recomendaciones=data['recomendaciones'],
            requiere_acciones_correctivas=data.get('requiere_acciones_correctivas', False),
            acciones_correctivas=data.get('acciones_correctivas', ''),
            conclusion_general=data['conclusion_general'],
            aprobado=data.get('aprobado', False)
        )

        # Actualizar estado del simulacro
        simulacro.estado = 'EVALUADO'
        simulacro.save()

        return Response({
            'message': 'Evaluación registrada exitosamente',
            'evaluacion': EvaluacionSimulacroSerializer(evaluacion).data
        }, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['get'])
    def estadisticas(self, request):
        """Estadisticas de simulacros"""
        qs = self.get_queryset()
        año = timezone.now().year
        qs_año = qs.filter(fecha_programada__year=año)

        total = qs_año.count()
        por_estado = dict(qs_año.values_list('estado').annotate(c=Count('id')).values_list('estado', 'c'))
        realizados = qs_año.filter(estado__in=['REALIZADO', 'EVALUADO'])
        exitosos = realizados.filter(fue_exitoso=True).count()
        calificacion_promedio = EvaluacionSimulacro.objects.filter(
            simulacro__in=realizados,
            activo=True,
        ).aggregate(avg=Avg('calificacion_porcentaje'))['avg']

        return Response({
            'total': total,
            'por_estado': por_estado,
            'programados': por_estado.get('PROGRAMADO', 0),
            'realizados': realizados.count(),
            'exitosos': exitosos,
            'calificacion_promedio': round(calificacion_promedio, 1) if calificacion_promedio else None,
            'año': año,
        })


class EvaluacionSimulacroViewSet(viewsets.ModelViewSet):
    """
    ViewSet para Evaluaciones de Simulacros
    """
    serializer_class = EvaluacionSimulacroSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['simulacro', 'aprobado', 'requiere_acciones_correctivas']
    search_fields = ['evaluador', 'cargo_evaluador']
    ordering_fields = ['fecha_evaluacion', 'calificacion_porcentaje']
    ordering = ['-fecha_evaluacion']

    def get_queryset(self):
        user = self.request.user
        empresa_id = getattr(user, 'empresa_id', None)
        if empresa_id:
            return EvaluacionSimulacro.objects.filter(
                empresa_id=empresa_id,
                activo=True
            ).select_related('simulacro')
        return EvaluacionSimulacro.objects.none()

    def perform_create(self, serializer):
        user = self.request.user
        empresa_id = getattr(user, 'empresa_id', None)
        serializer.save(empresa_id=empresa_id)


class RecursoEmergenciaViewSet(viewsets.ModelViewSet):
    """
    ViewSet para Recursos de Emergencia
    """
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['tipo_recurso', 'estado', 'area', 'edificio', 'piso']
    search_fields = ['codigo', 'nombre', 'ubicacion_especifica']
    ordering_fields = ['tipo_recurso', 'fecha_proxima_inspeccion', 'codigo']
    ordering = ['tipo_recurso', 'area']

    def get_queryset(self):
        user = self.request.user
        empresa_id = getattr(user, 'empresa_id', None)
        if empresa_id:
            return RecursoEmergencia.objects.filter(
                empresa_id=empresa_id,
                activo=True
            ).prefetch_related('inspecciones')
        return RecursoEmergencia.objects.none()

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return RecursoEmergenciaDetailSerializer
        return RecursoEmergenciaListSerializer

    def perform_create(self, serializer):
        user = self.request.user
        empresa_id = getattr(user, 'empresa_id', None)
        serializer.save(
            empresa_id=empresa_id,
            creado_por=user.get_full_name() or user.username
        )

    @action(detail=False, methods=['get'])
    def estadisticas(self, request):
        """Estadisticas de recursos de emergencia"""
        qs = self.get_queryset()
        total = qs.count()
        por_estado = dict(qs.values_list('estado').annotate(c=Count('id')).values_list('estado', 'c'))
        por_tipo = dict(qs.values_list('tipo_recurso').annotate(c=Count('id')).values_list('tipo_recurso', 'c'))
        requieren_inspeccion = qs.filter(
            fecha_proxima_inspeccion__lte=timezone.now().date(),
            estado='OPERATIVO',
        ).count()
        por_vencer_30d = qs.filter(
            fecha_vencimiento__lte=timezone.now().date() + timezone.timedelta(days=30),
            fecha_vencimiento__gt=timezone.now().date(),
            estado='OPERATIVO',
        ).count()

        return Response({
            'total': total,
            'por_estado': por_estado,
            'por_tipo_recurso': por_tipo,
            'operativos': por_estado.get('OPERATIVO', 0),
            'en_mantenimiento': por_estado.get('EN_MANTENIMIENTO', 0),
            'requieren_inspeccion': requieren_inspeccion,
            'por_vencer_30d': por_vencer_30d,
        })

    @action(detail=False, methods=['get'])
    def requieren_inspeccion(self, request):
        """Listar recursos que requieren inspección"""
        queryset = self.get_queryset().filter(
            fecha_proxima_inspeccion__lte=timezone.now().date(),
            estado='OPERATIVO'
        )

        serializer = self.get_serializer(queryset, many=True)
        return Response({
            'count': queryset.count(),
            'recursos': serializer.data
        })

    @action(detail=False, methods=['get'])
    def por_vencer(self, request):
        """Recursos próximos a vencer (30 días)"""
        fecha_limite = timezone.now().date() + timezone.timedelta(days=30)
        queryset = self.get_queryset().filter(
            fecha_vencimiento__lte=fecha_limite,
            fecha_vencimiento__gt=timezone.now().date(),
            estado='OPERATIVO'
        )

        serializer = self.get_serializer(queryset, many=True)
        return Response({
            'count': queryset.count(),
            'recursos': serializer.data
        })


class InspeccionRecursoViewSet(viewsets.ModelViewSet):
    """
    ViewSet para Inspecciones de Recursos
    """
    serializer_class = InspeccionRecursoSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['recurso', 'resultado', 'inspector']
    search_fields = ['codigo', 'inspector', 'observaciones_generales']
    ordering_fields = ['fecha_inspeccion', 'resultado']
    ordering = ['-fecha_inspeccion']

    def get_queryset(self):
        user = self.request.user
        empresa_id = getattr(user, 'empresa_id', None)
        if empresa_id:
            return InspeccionRecurso.objects.filter(
                empresa_id=empresa_id,
                activo=True
            ).select_related('recurso')
        return InspeccionRecurso.objects.none()

    def perform_create(self, serializer):
        user = self.request.user
        empresa_id = getattr(user, 'empresa_id', None)
        inspeccion = serializer.save(empresa_id=empresa_id)

        # Actualizar fecha de última inspección en el recurso
        recurso = inspeccion.recurso
        recurso.fecha_ultima_inspeccion = inspeccion.fecha_inspeccion

        # Programar próxima inspección según frecuencia
        if inspeccion.proxima_inspeccion_programada:
            recurso.fecha_proxima_inspeccion = inspeccion.proxima_inspeccion_programada

        recurso.save()
