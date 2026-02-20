"""
Views para Mejora Continua - hseq_management
Auditorías internas, hallazgos y evaluación de cumplimiento
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.pagination import PageNumberPagination
from django.utils import timezone
from django.db.models import Q, Count

from apps.core.base_models.mixins import get_tenant_empresa

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
# PROGRAMA DE AUDITORIA
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
        queryset = ProgramaAuditoria.objects.filter(is_active=True)

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
        empresa = get_tenant_empresa()
        year = timezone.now().year

        last_prog = ProgramaAuditoria.objects.filter(
            codigo__startswith=f'PAU-{year}-'
        ).order_by('-codigo').first()

        new_num = int(last_prog.codigo.split('-')[-1]) + 1 if last_prog else 1
        codigo = f'PAU-{year}-{new_num:04d}'

        serializer.save(
            empresa=empresa,
            created_by=self.request.user,
            codigo=codigo
        )

    @action(detail=True, methods=['post'])
    def aprobar(self, request, pk=None):
        """Aprobar programa de auditoría"""
        programa = self.get_object()
        if programa.estado != 'BORRADOR':
            return Response(
                {'error': 'Solo se pueden aprobar programas en estado Borrador'},
                status=status.HTTP_400_BAD_REQUEST
            )
        programa.aprobar(request.user)
        return Response({'status': 'Programa aprobado'})

    @action(detail=True, methods=['post'])
    def iniciar(self, request, pk=None):
        """Iniciar ejecución del programa"""
        programa = self.get_object()
        if programa.estado != 'APROBADO':
            return Response(
                {'error': 'Solo se pueden iniciar programas aprobados'},
                status=status.HTTP_400_BAD_REQUEST
            )
        programa.iniciar()
        return Response({'status': 'Programa iniciado'})

    @action(detail=True, methods=['post'])
    def completar(self, request, pk=None):
        """Marcar programa como completado"""
        programa = self.get_object()
        programa.completar()
        return Response({'status': 'Programa completado'})

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
# AUDITORIA
# ============================================================================

class AuditoriaViewSet(viewsets.ModelViewSet):
    """ViewSet para Auditorías"""
    permission_classes = [IsAuthenticated]
    pagination_class = StandardResultsSetPagination
    filterset_fields = ['estado', 'tipo', 'norma_principal', 'programa']
    search_fields = ['codigo', 'titulo', 'objetivo', 'alcance']
    ordering_fields = ['fecha_planificada_inicio', 'created_at', 'codigo']
    ordering = ['-fecha_planificada_inicio']

    def get_queryset(self):
        queryset = Auditoria.objects.filter(is_active=True)

        estado = self.request.query_params.get('estado', None)
        if estado:
            queryset = queryset.filter(estado=estado)

        tipo = self.request.query_params.get('tipo', None)
        if tipo:
            queryset = queryset.filter(tipo=tipo)

        programa = self.request.query_params.get('programa', None)
        if programa:
            queryset = queryset.filter(programa_id=programa)

        # Filtro por auditor
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
        empresa = get_tenant_empresa()
        year = timezone.now().year

        last_aud = Auditoria.objects.filter(
            codigo__startswith=f'AUD-{year}-'
        ).order_by('-codigo').first()

        new_num = int(last_aud.codigo.split('-')[-1]) + 1 if last_aud else 1
        codigo = f'AUD-{year}-{new_num:04d}'

        serializer.save(
            empresa=empresa,
            created_by=self.request.user,
            codigo=codigo
        )

    @action(detail=True, methods=['post'])
    def iniciar(self, request, pk=None):
        """Iniciar ejecución de auditoría"""
        auditoria = self.get_object()
        if auditoria.estado not in ['PROGRAMADA', 'PLANIFICADA']:
            return Response(
                {'error': 'Solo se pueden iniciar auditorías programadas o planificadas'},
                status=status.HTTP_400_BAD_REQUEST
            )
        auditoria.iniciar()
        return Response({'status': 'Auditoría iniciada'})

    @action(detail=True, methods=['post'])
    def cerrar(self, request, pk=None):
        """Cerrar auditoría"""
        auditoria = self.get_object()
        auditoria.cerrar()
        return Response({'status': 'Auditoría cerrada'})

    @action(detail=False, methods=['get'])
    def calendario(self, request):
        """Calendario de auditorías"""
        year = request.query_params.get('year', timezone.now().year)

        auditorias = Auditoria.objects.filter(
            fecha_planificada_inicio__year=year,
            is_active=True
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
    filterset_fields = ['estado', 'tipo', 'auditoria']
    search_fields = ['codigo', 'titulo', 'descripcion', 'proceso_area']
    ordering_fields = ['fecha_deteccion', 'created_at', 'codigo', 'tipo']
    ordering = ['-fecha_deteccion']

    def get_queryset(self):
        queryset = Hallazgo.objects.filter(is_active=True)

        estado = self.request.query_params.get('estado', None)
        if estado:
            queryset = queryset.filter(estado=estado)

        tipo = self.request.query_params.get('tipo', None)
        if tipo:
            queryset = queryset.filter(tipo=tipo)

        auditoria = self.request.query_params.get('auditoria', None)
        if auditoria:
            queryset = queryset.filter(auditoria_id=auditoria)

        # Filtro por responsable
        responsable = self.request.query_params.get('responsable', None)
        if responsable:
            queryset = queryset.filter(responsable_proceso_id=responsable)

        # Filtro por vencidos
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
        empresa = get_tenant_empresa()
        year = timezone.now().year

        last_hall = Hallazgo.objects.filter(
            codigo__startswith=f'HAL-{year}-'
        ).order_by('-codigo').first()

        new_num = int(last_hall.codigo.split('-')[-1]) + 1 if last_hall else 1
        codigo = f'HAL-{year}-{new_num:04d}'

        serializer.save(
            empresa=empresa,
            codigo=codigo
        )

    @action(detail=True, methods=['post'])
    def comunicar(self, request, pk=None):
        """Comunicar hallazgo al responsable"""
        hallazgo = self.get_object()
        hallazgo.comunicar()
        return Response({'status': 'Hallazgo comunicado'})

    @action(detail=True, methods=['post'], url_path='iniciar-tratamiento')
    def iniciar_tratamiento(self, request, pk=None):
        """Iniciar tratamiento del hallazgo"""
        hallazgo = self.get_object()
        hallazgo.iniciar_tratamiento()
        return Response({'status': 'Tratamiento iniciado'})

    @action(detail=True, methods=['post'])
    def verificar(self, request, pk=None):
        """Verificar eficacia de acciones"""
        hallazgo = self.get_object()
        es_eficaz = request.data.get('es_eficaz', False)
        observaciones = request.data.get('observaciones', '')
        hallazgo.verificar(request.user, es_eficaz, observaciones)
        return Response({'status': 'Hallazgo verificado', 'es_eficaz': es_eficaz})

    @action(detail=True, methods=['post'])
    def cerrar(self, request, pk=None):
        """Cerrar hallazgo"""
        hallazgo = self.get_object()
        if hallazgo.cerrar():
            return Response({'status': 'Hallazgo cerrado'})
        return Response(
            {'error': 'El hallazgo debe estar verificado como eficaz para cerrarse'},
            status=status.HTTP_400_BAD_REQUEST
        )

    @action(detail=False, methods=['get'])
    def dashboard(self, request):
        """Dashboard de hallazgos"""
        hallazgos = Hallazgo.objects.filter(is_active=True)

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
# EVALUACION DE CUMPLIMIENTO
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
        queryset = EvaluacionCumplimiento.objects.filter(is_active=True)

        tipo = self.request.query_params.get('tipo', None)
        if tipo:
            queryset = queryset.filter(tipo=tipo)

        resultado = self.request.query_params.get('resultado', None)
        if resultado:
            queryset = queryset.filter(resultado=resultado)

        # Filtro por próximas evaluaciones
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
        empresa = get_tenant_empresa()
        year = timezone.now().year

        last_eval = EvaluacionCumplimiento.objects.filter(
            codigo__startswith=f'EVC-{year}-'
        ).order_by('-codigo').first()

        new_num = int(last_eval.codigo.split('-')[-1]) + 1 if last_eval else 1
        codigo = f'EVC-{year}-{new_num:04d}'

        instance = serializer.save(
            empresa=empresa,
            created_by=self.request.user,
            codigo=codigo
        )
        # Calcular próxima evaluación automáticamente
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
        evaluaciones = EvaluacionCumplimiento.objects.filter(is_active=True)

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
