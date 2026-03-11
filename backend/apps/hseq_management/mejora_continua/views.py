"""
Views para Mejora Continua — hseq_management
Auditorías internas, hallazgos y evaluación de cumplimiento.

Phase B: FSM transitions vía django-fsm + EventBus
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.pagination import PageNumberPagination
from django.utils import timezone
from django.db.models import Q, Count
from django_fsm import TransitionNotAllowed

from apps.gestion_estrategica.revision_direccion.services.resumen_mixin import ResumenRevisionMixin

from .models import (
    ProgramaAuditoria,
    Auditoria,
    Hallazgo,
    EvaluacionCumplimiento
)
from .serializers import (
    ProgramaAuditoriaListSerializer,
    ProgramaAuditoriaDetailSerializer,
    AuditoriaListSerializer,
    AuditoriaDetailSerializer,
    HallazgoListSerializer,
    HallazgoDetailSerializer,
    EvaluacionCumplimientoListSerializer,
    EvaluacionCumplimientoDetailSerializer,
)


class StandardResultsSetPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100


# ============================================================================
# PROGRAMA DE AUDITORÍA
# ============================================================================

class ProgramaAuditoriaViewSet(viewsets.ModelViewSet):
    """ViewSet para Programas de Auditoría"""
    permission_classes = [IsAuthenticated]
    pagination_class = StandardResultsSetPagination
    filterset_fields = ['estado', 'año']
    search_fields = ['codigo', 'nombre', 'alcance']
    ordering_fields = ['año', 'created_at', 'codigo']
    ordering = ['-año', '-created_at']

    def get_queryset(self):
        queryset = ProgramaAuditoria.objects.all()

        estado = self.request.query_params.get('estado', None)
        if estado:
            queryset = queryset.filter(estado=estado)

        año = self.request.query_params.get('año', None)
        if año:
            queryset = queryset.filter(año=año)

        return queryset.select_related(
            'responsable_programa', 'aprobado_por', 'created_by'
        ).prefetch_related('auditorias')

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return ProgramaAuditoriaDetailSerializer
        return ProgramaAuditoriaListSerializer

    def perform_create(self, serializer):
        year = timezone.now().year

        last_prog = ProgramaAuditoria.objects.filter(
            codigo__startswith=f'PAU-{year}-'
        ).order_by('-codigo').first()

        new_num = int(last_prog.codigo.split('-')[-1]) + 1 if last_prog else 1
        codigo = f'PAU-{year}-{new_num:04d}'

        serializer.save(
            created_by=self.request.user,
            codigo=codigo
        )

    @action(detail=True, methods=['post'])
    def aprobar(self, request, pk=None):
        """Aprobar programa de auditoría (FSM: BORRADOR → APROBADO)"""
        programa = self.get_object()
        try:
            programa.aprobar(usuario=request.user)
            programa.save()
            return Response(
                ProgramaAuditoriaDetailSerializer(
                    programa, context={'request': request}
                ).data
            )
        except TransitionNotAllowed:
            return Response(
                {'error': 'Transición no permitida desde el estado actual'},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=True, methods=['post'])
    def iniciar(self, request, pk=None):
        """Iniciar ejecución del programa (FSM: APROBADO → EN_EJECUCION)"""
        programa = self.get_object()
        try:
            programa.iniciar()
            programa.save()
            return Response(
                ProgramaAuditoriaDetailSerializer(
                    programa, context={'request': request}
                ).data
            )
        except TransitionNotAllowed:
            return Response(
                {'error': 'Transición no permitida desde el estado actual'},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=True, methods=['post'])
    def completar(self, request, pk=None):
        """Marcar programa como completado (FSM: EN_EJECUCION → COMPLETADO)"""
        programa = self.get_object()
        try:
            programa.completar()
            programa.save()
            return Response(
                ProgramaAuditoriaDetailSerializer(
                    programa, context={'request': request}
                ).data
            )
        except TransitionNotAllowed:
            return Response(
                {'error': 'Transición no permitida desde el estado actual'},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=True, methods=['post'])
    def cancelar(self, request, pk=None):
        """Cancelar programa (FSM: BORRADOR|APROBADO|EN_EJECUCION → CANCELADO)"""
        programa = self.get_object()
        try:
            programa.cancelar()
            programa.save()
            return Response(
                ProgramaAuditoriaDetailSerializer(
                    programa, context={'request': request}
                ).data
            )
        except TransitionNotAllowed:
            return Response(
                {'error': 'Transición no permitida desde el estado actual'},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=False, methods=['get'])
    def dashboard(self, request):
        """Dashboard de programas de auditoría"""
        year = timezone.now().year

        programas = ProgramaAuditoria.objects.filter(año=year)

        stats = {
            'total_programas': programas.count(),
            'por_estado': {
                estado[0]: programas.filter(estado=estado[0]).count()
                for estado in ProgramaAuditoria.ESTADO_CHOICES
            },
            'año_actual': year,
        }
        return Response(stats)


# ============================================================================
# AUDITORÍA
# ============================================================================

class AuditoriaViewSet(ResumenRevisionMixin, viewsets.ModelViewSet):
    """ViewSet para Auditorías"""
    permission_classes = [IsAuthenticated]
    pagination_class = StandardResultsSetPagination
    filterset_fields = ['estado', 'tipo', 'norma_principal', 'programa']
    search_fields = ['codigo', 'titulo', 'objetivo', 'alcance']
    ordering_fields = ['fecha_planificada_inicio', 'created_at', 'codigo']
    ordering = ['-fecha_planificada_inicio']

    # ResumenRevisionMixin config
    resumen_date_field = 'fecha_planificada_inicio'
    resumen_modulo_nombre = 'auditorias_internas'

    def get_resumen_data(self, queryset, fecha_desde, fecha_hasta):
        """Resumen de auditorías para Revisión por la Dirección."""
        total = queryset.count()
        por_estado = list(
            queryset.values('estado').annotate(cantidad=Count('id')).order_by('estado')
        )
        por_tipo = list(
            queryset.values('tipo').annotate(cantidad=Count('id')).order_by('-cantidad')
        )

        cerradas = queryset.filter(estado='CERRADA').count()

        auditoria_ids = queryset.values_list('id', flat=True)
        hallazgos = Hallazgo.objects.filter(auditoria_id__in=auditoria_ids)
        total_hallazgos = hallazgos.count()
        hallazgos_por_tipo = list(
            hallazgos.values('tipo').annotate(cantidad=Count('id')).order_by('-cantidad')
        )
        hallazgos_cerrados = hallazgos.filter(estado='CERRADO').count()
        pct_cierre = round(
            (hallazgos_cerrados / total_hallazgos * 100), 1
        ) if total_hallazgos > 0 else 0

        return {
            'total_auditorias': total,
            'por_estado': por_estado,
            'por_tipo': por_tipo,
            'cerradas': cerradas,
            'hallazgos': {
                'total': total_hallazgos,
                'por_tipo': hallazgos_por_tipo,
                'cerrados': hallazgos_cerrados,
                'porcentaje_cierre': pct_cierre,
            },
        }

    def get_queryset(self):
        queryset = Auditoria.objects.all()

        estado = self.request.query_params.get('estado', None)
        if estado:
            queryset = queryset.filter(estado=estado)

        tipo = self.request.query_params.get('tipo', None)
        if tipo:
            queryset = queryset.filter(tipo=tipo)

        programa = self.request.query_params.get('programa', None)
        if programa:
            queryset = queryset.filter(programa_id=programa)

        auditor = self.request.query_params.get('auditor', None)
        if auditor:
            queryset = queryset.filter(
                Q(auditor_lider_id=auditor) | Q(equipo_auditor__id=auditor)
            ).distinct()

        return queryset.select_related(
            'programa', 'auditor_lider', 'created_by'
        ).prefetch_related('equipo_auditor', 'hallazgos')

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return AuditoriaDetailSerializer
        return AuditoriaListSerializer

    def perform_create(self, serializer):
        year = timezone.now().year

        last_aud = Auditoria.objects.filter(
            codigo__startswith=f'AUD-{year}-'
        ).order_by('-codigo').first()

        new_num = int(last_aud.codigo.split('-')[-1]) + 1 if last_aud else 1
        codigo = f'AUD-{year}-{new_num:04d}'

        serializer.save(
            created_by=self.request.user,
            codigo=codigo
        )

    @action(detail=True, methods=['post'])
    def planificar(self, request, pk=None):
        """Planificar auditoría (FSM: PROGRAMADA → PLANIFICADA)"""
        auditoria = self.get_object()
        try:
            auditoria.planificar()
            auditoria.save()
            return Response(
                AuditoriaDetailSerializer(
                    auditoria, context={'request': request}
                ).data
            )
        except TransitionNotAllowed:
            return Response(
                {'error': 'Transición no permitida desde el estado actual'},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=True, methods=['post'])
    def iniciar(self, request, pk=None):
        """Iniciar ejecución de auditoría (FSM: PROGRAMADA|PLANIFICADA → EN_EJECUCION)"""
        auditoria = self.get_object()
        try:
            auditoria.iniciar()
            auditoria.save()
            return Response(
                AuditoriaDetailSerializer(
                    auditoria, context={'request': request}
                ).data
            )
        except TransitionNotAllowed:
            return Response(
                {'error': 'Transición no permitida desde el estado actual'},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=True, methods=['post'], url_path='solicitar-informe')
    def solicitar_informe(self, request, pk=None):
        """Solicitar informe (FSM: EN_EJECUCION → INFORME_PENDIENTE)"""
        auditoria = self.get_object()
        try:
            auditoria.solicitar_informe()
            auditoria.save()
            return Response(
                AuditoriaDetailSerializer(
                    auditoria, context={'request': request}
                ).data
            )
        except TransitionNotAllowed:
            return Response(
                {'error': 'Transición no permitida desde el estado actual'},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=True, methods=['post'])
    def cerrar(self, request, pk=None):
        """Cerrar auditoría (FSM: INFORME_PENDIENTE → CERRADA)"""
        auditoria = self.get_object()
        try:
            auditoria.cerrar()
            auditoria.save()
            return Response(
                AuditoriaDetailSerializer(
                    auditoria, context={'request': request}
                ).data
            )
        except TransitionNotAllowed:
            return Response(
                {'error': 'Transición no permitida desde el estado actual'},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=True, methods=['post'])
    def cancelar(self, request, pk=None):
        """Cancelar auditoría (FSM: PROGRAMADA|PLANIFICADA|EN_EJECUCION → CANCELADA)"""
        auditoria = self.get_object()
        try:
            auditoria.cancelar()
            auditoria.save()
            return Response(
                AuditoriaDetailSerializer(
                    auditoria, context={'request': request}
                ).data
            )
        except TransitionNotAllowed:
            return Response(
                {'error': 'Transición no permitida desde el estado actual'},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=False, methods=['get'])
    def calendario(self, request):
        """Calendario de auditorías"""
        year = request.query_params.get('year', timezone.now().year)

        auditorias = Auditoria.objects.filter(
            fecha_planificada_inicio__year=year,
        ).values(
            'id', 'codigo', 'titulo', 'tipo', 'estado',
            'fecha_planificada_inicio', 'fecha_planificada_fin'
        )
        return Response(list(auditorias))

    @action(detail=False, methods=['get'])
    def dashboard(self, request):
        """Dashboard de auditorías"""
        year = timezone.now().year

        auditorias = Auditoria.objects.filter(
            fecha_planificada_inicio__year=year
        )

        stats = {
            'total_auditorias': auditorias.count(),
            'por_estado': {
                estado[0]: auditorias.filter(estado=estado[0]).count()
                for estado in Auditoria.ESTADO_CHOICES
            },
            'por_tipo': {
                tipo[0]: auditorias.filter(tipo=tipo[0]).count()
                for tipo in Auditoria.TIPO_CHOICES
            },
            'hallazgos_totales': auditorias.aggregate(
                total=Count('hallazgos')
            )['total'] or 0,
        }
        return Response(stats)


# ============================================================================
# HALLAZGO
# ============================================================================

class HallazgoViewSet(viewsets.ModelViewSet):
    """ViewSet para Hallazgos de Auditoría"""
    permission_classes = [IsAuthenticated]
    pagination_class = StandardResultsSetPagination
    filterset_fields = ['estado', 'tipo', 'auditoria', 'impacto']
    search_fields = ['codigo', 'titulo', 'descripcion', 'proceso_area', 'area_impactada']
    ordering_fields = ['fecha_deteccion', 'created_at', 'codigo', 'tipo']
    ordering = ['-fecha_deteccion']

    def get_queryset(self):
        queryset = Hallazgo.objects.all()

        estado = self.request.query_params.get('estado', None)
        if estado:
            queryset = queryset.filter(estado=estado)

        tipo = self.request.query_params.get('tipo', None)
        if tipo:
            queryset = queryset.filter(tipo=tipo)

        auditoria = self.request.query_params.get('auditoria', None)
        if auditoria:
            queryset = queryset.filter(auditoria_id=auditoria)

        impacto = self.request.query_params.get('impacto', None)
        if impacto:
            queryset = queryset.filter(impacto=impacto)

        responsable = self.request.query_params.get('responsable', None)
        if responsable:
            queryset = queryset.filter(responsable_proceso_id=responsable)

        if self.request.query_params.get('vencidos', None) == 'true':
            queryset = queryset.filter(
                estado__in=['IDENTIFICADO', 'COMUNICADO', 'EN_TRATAMIENTO'],
                fecha_cierre_esperada__lt=timezone.now().date()
            )

        return queryset.select_related(
            'auditoria', 'identificado_por', 'responsable_proceso', 'verificado_por'
        )

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return HallazgoDetailSerializer
        return HallazgoListSerializer

    def perform_create(self, serializer):
        year = timezone.now().year

        last_hall = Hallazgo.objects.filter(
            codigo__startswith=f'HAL-{year}-'
        ).order_by('-codigo').first()

        new_num = int(last_hall.codigo.split('-')[-1]) + 1 if last_hall else 1
        codigo = f'HAL-{year}-{new_num:04d}'

        serializer.save(
            created_by=self.request.user,
            codigo=codigo
        )

    @action(detail=True, methods=['post'])
    def comunicar(self, request, pk=None):
        """Comunicar hallazgo (FSM: IDENTIFICADO → COMUNICADO)"""
        hallazgo = self.get_object()
        try:
            hallazgo.comunicar()
            hallazgo.save()
            return Response(
                HallazgoDetailSerializer(
                    hallazgo, context={'request': request}
                ).data
            )
        except TransitionNotAllowed:
            return Response(
                {'error': 'Transición no permitida desde el estado actual'},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=True, methods=['post'], url_path='iniciar-tratamiento')
    def iniciar_tratamiento(self, request, pk=None):
        """Iniciar tratamiento (FSM: COMUNICADO → EN_TRATAMIENTO)"""
        hallazgo = self.get_object()
        try:
            hallazgo.iniciar_tratamiento()
            hallazgo.save()
            return Response(
                HallazgoDetailSerializer(
                    hallazgo, context={'request': request}
                ).data
            )
        except TransitionNotAllowed:
            return Response(
                {'error': 'Transición no permitida desde el estado actual'},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=True, methods=['post'])
    def verificar(self, request, pk=None):
        """Verificar eficacia (FSM: EN_TRATAMIENTO → VERIFICADO)"""
        hallazgo = self.get_object()
        es_eficaz = request.data.get('es_eficaz', False)
        observaciones = request.data.get('observaciones', '')
        try:
            hallazgo.verificar(
                usuario=request.user,
                es_eficaz=es_eficaz,
                observaciones_verificacion=observaciones
            )
            hallazgo.save()
            return Response(
                HallazgoDetailSerializer(
                    hallazgo, context={'request': request}
                ).data
            )
        except TransitionNotAllowed:
            return Response(
                {'error': 'Transición no permitida desde el estado actual'},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=True, methods=['post'])
    def cerrar(self, request, pk=None):
        """Cerrar hallazgo (FSM: VERIFICADO → CERRADO, requiere es_eficaz=True)"""
        hallazgo = self.get_object()
        try:
            hallazgo.cerrar()
            hallazgo.save()
            return Response(
                HallazgoDetailSerializer(
                    hallazgo, context={'request': request}
                ).data
            )
        except TransitionNotAllowed:
            return Response(
                {'error': 'El hallazgo debe estar verificado como eficaz para cerrarse'},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=True, methods=['post'], url_path='upload-evidencia')
    def upload_evidencia(self, request, pk=None):
        """Subir archivo de evidencia"""
        hallazgo = self.get_object()
        archivo = request.FILES.get('archivo')
        if not archivo:
            return Response(
                {'error': 'Se requiere un archivo'},
                status=status.HTTP_400_BAD_REQUEST
            )
        hallazgo.archivo_evidencia = archivo
        hallazgo.save()
        return Response(
            HallazgoDetailSerializer(
                hallazgo, context={'request': request}
            ).data
        )

    @action(detail=False, methods=['get'])
    def dashboard(self, request):
        """Dashboard de hallazgos"""
        hallazgos = Hallazgo.objects.all()

        abiertos = hallazgos.exclude(estado='CERRADO')

        stats = {
            'total_hallazgos': hallazgos.count(),
            'abiertos': abiertos.count(),
            'por_estado': {
                estado[0]: hallazgos.filter(estado=estado[0]).count()
                for estado in Hallazgo.ESTADO_CHOICES
            },
            'por_tipo': {
                tipo[0]: hallazgos.filter(tipo=tipo[0]).count()
                for tipo in Hallazgo.TIPO_CHOICES
            },
            'vencidos': abiertos.filter(
                fecha_cierre_esperada__lt=timezone.now().date()
            ).count(),
        }
        return Response(stats)


# ============================================================================
# EVALUACIÓN DE CUMPLIMIENTO
# ============================================================================

class EvaluacionCumplimientoViewSet(viewsets.ModelViewSet):
    """ViewSet para Evaluaciones de Cumplimiento"""
    permission_classes = [IsAuthenticated]
    pagination_class = StandardResultsSetPagination
    filterset_fields = ['tipo', 'resultado', 'periodicidad']
    search_fields = ['codigo', 'nombre', 'descripcion']
    ordering_fields = ['fecha_evaluacion', 'created_at', 'codigo']
    ordering = ['-fecha_evaluacion']

    def get_queryset(self):
        queryset = EvaluacionCumplimiento.objects.all()

        tipo = self.request.query_params.get('tipo', None)
        if tipo:
            queryset = queryset.filter(tipo=tipo)

        resultado = self.request.query_params.get('resultado', None)
        if resultado:
            queryset = queryset.filter(resultado=resultado)

        if self.request.query_params.get('proximas', None) == 'true':
            queryset = queryset.filter(
                proxima_evaluacion__lte=timezone.now().date() + timezone.timedelta(days=30)
            )

        return queryset.select_related(
            'evaluador', 'responsable_cumplimiento', 'created_by'
        )

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return EvaluacionCumplimientoDetailSerializer
        return EvaluacionCumplimientoListSerializer

    def perform_create(self, serializer):
        year = timezone.now().year

        last_eval = EvaluacionCumplimiento.objects.filter(
            codigo__startswith=f'EVC-{year}-'
        ).order_by('-codigo').first()

        new_num = int(last_eval.codigo.split('-')[-1]) + 1 if last_eval else 1
        codigo = f'EVC-{year}-{new_num:04d}'

        instance = serializer.save(
            created_by=self.request.user,
            codigo=codigo
        )
        instance.calcular_proxima_evaluacion()

    @action(detail=True, methods=['post'], url_path='programar-siguiente')
    def programar_siguiente(self, request, pk=None):
        """Programar siguiente evaluación"""
        evaluacion = self.get_object()
        evaluacion.calcular_proxima_evaluacion()
        return Response({
            'status': 'Próxima evaluación programada',
            'proxima_evaluacion': evaluacion.proxima_evaluacion
        })

    @action(detail=False, methods=['get'])
    def dashboard(self, request):
        """Dashboard de evaluaciones de cumplimiento"""
        evaluaciones = EvaluacionCumplimiento.objects.all()

        stats = {
            'total_evaluaciones': evaluaciones.count(),
            'por_resultado': {
                resultado[0]: evaluaciones.filter(resultado=resultado[0]).count()
                for resultado in EvaluacionCumplimiento.RESULTADO_CHOICES
            },
            'por_tipo': {
                tipo[0]: evaluaciones.filter(tipo=tipo[0]).count()
                for tipo in EvaluacionCumplimiento.TIPO_CHOICES
            },
            'proximas_30_dias': evaluaciones.filter(
                proxima_evaluacion__lte=timezone.now().date() + timezone.timedelta(days=30)
            ).count(),
            'no_cumple': evaluaciones.filter(resultado='NO_CUMPLE').count(),
        }
        return Response(stats)
