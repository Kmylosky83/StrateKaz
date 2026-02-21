"""
Views para Revisión por la Dirección

Endpoints por subtab:
- Programación: /programaciones/, /participantes/, /temas/
- Actas de Revisión: /actas/, /analisis-temas/
- Seguimiento Compromisos: /compromisos/, /seguimientos/
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.db.models import Count, Q
from django.utils import timezone

from apps.core.mixins import StandardViewSetMixin
from apps.core.base_models.mixins import get_tenant_empresa
from .models import (
    ProgramaRevision, ParticipanteRevision, TemaRevision,
    ActaRevision, AnalisisTemaActa, CompromisoRevision,
    SeguimientoCompromiso
)
from .serializers import (
    ProgramaRevisionSerializer, ProgramaRevisionListSerializer,
    ProgramaRevisionCreateSerializer,
    ParticipanteRevisionSerializer, TemaRevisionSerializer,
    ActaRevisionSerializer, AnalisisTemaActaSerializer,
    CompromisoRevisionSerializer, CompromisoRevisionListSerializer,
    SeguimientoCompromisoSerializer
)


class ProgramaRevisionViewSet(StandardViewSetMixin, viewsets.ModelViewSet):
    """
    ViewSet para gestionar Programas de Revisión por la Dirección.

    Endpoints:
    - GET /programaciones/ - Lista de programas
    - POST /programaciones/ - Crear programa
    - GET /programaciones/{id}/ - Detalle
    - GET /programaciones/dashboard/ - Dashboard de revisiones
    - GET /programaciones/stats/ - Alias de dashboard
    - GET /programaciones/calendario/ - Calendario de revisiones
    """
    queryset = ProgramaRevision.objects.select_related(
        'responsable_convocatoria', 'created_by'
    ).prefetch_related('participantes', 'temas').all()
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['empresa', 'anio', 'estado', 'frecuencia', 'is_active']
    search_fields = ['periodo', 'lugar']
    ordering_fields = ['fecha_programada', 'anio']
    ordering = ['-fecha_programada']

    def get_serializer_class(self):
        if self.action == 'list':
            return ProgramaRevisionListSerializer
        if self.action in ['create', 'update', 'partial_update']:
            return ProgramaRevisionCreateSerializer
        return ProgramaRevisionSerializer

    def perform_create(self, serializer):
        empresa = get_tenant_empresa()
        # Auto-derive anio from fecha_programada if not provided
        fecha = serializer.validated_data.get('fecha_programada')
        anio = serializer.validated_data.get('anio')
        if not anio and fecha:
            anio = fecha.year
        serializer.save(
            created_by=self.request.user,
            empresa=empresa,
            anio=anio,
        )

    @action(detail=False, methods=['get'])
    def dashboard(self, request):
        """Retorna estadísticas del dashboard de revisiones"""
        empresa = get_tenant_empresa()
        empresa_id = request.query_params.get('empresa', empresa.id if empresa else 1)
        anio = request.query_params.get('anio', timezone.now().year)

        programas = self.get_queryset().filter(empresa=empresa_id, anio=anio)

        total = programas.count()
        realizadas = programas.filter(estado='realizada').count()
        pendientes = programas.filter(estado__in=['programada', 'convocada']).count()

        # Próxima revisión
        proxima = programas.filter(
            estado__in=['programada', 'convocada'],
            fecha_programada__gte=timezone.now().date()
        ).order_by('fecha_programada').first()

        # Compromisos
        compromisos = CompromisoRevision.objects.filter(
            acta__programa__empresa=empresa_id,
            is_active=True
        )
        total_compromisos = compromisos.count()
        pendientes_comp = compromisos.filter(estado__in=['pendiente', 'en_progreso']).count()
        vencidos = compromisos.filter(
            estado__in=['pendiente', 'en_progreso'],
            fecha_compromiso__lt=timezone.now().date()
        ).count()
        cumplidos = compromisos.filter(estado='completado').count()

        porcentaje_cumplimiento = (cumplidos / total_compromisos * 100) if total_compromisos > 0 else 0

        return Response({
            'total_revisiones': total,
            'revisiones_realizadas': realizadas,
            'revisiones_pendientes': pendientes,
            'proxima_revision': {
                'id': proxima.id,
                'periodo': proxima.periodo,
                'fecha': proxima.fecha_programada,
                'estado': proxima.estado,
            } if proxima else None,
            'compromisos_totales': total_compromisos,
            'compromisos_pendientes': pendientes_comp,
            'compromisos_vencidos': vencidos,
            'porcentaje_cumplimiento': round(porcentaje_cumplimiento, 1),
        })

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """
        Alias de dashboard para compatibilidad con frontend.
        GET /api/revision-direccion/programaciones/stats/
        """
        return self.dashboard(request)

    @action(detail=False, methods=['get'])
    def proximas(self, request):
        """
        Retorna las próximas revisiones programadas.
        GET /api/revision-direccion/programaciones/proximas/?limit=5
        """
        empresa = get_tenant_empresa()
        empresa_id = request.query_params.get('empresa', empresa.id if empresa else 1)
        limit = int(request.query_params.get('limit', 5))

        proximas = self.get_queryset().filter(
            empresa=empresa_id,
            estado__in=['programada', 'convocada'],
            fecha_programada__gte=timezone.now().date(),
            is_active=True
        ).order_by('fecha_programada')[:limit]

        data = [
            {
                'id': p.id,
                'periodo': p.periodo,
                'fecha_programada': p.fecha_programada,
                'hora_inicio': p.hora_inicio,
                'lugar': p.lugar,
                'estado': p.estado,
                'estado_display': p.get_estado_display(),
                'total_participantes': p.participantes.filter(is_active=True).count(),
            }
            for p in proximas
        ]

        return Response(data)

    @action(detail=False, methods=['get'])
    def calendario(self, request):
        """Retorna revisiones para vista de calendario"""
        empresa = get_tenant_empresa()
        empresa_id = request.query_params.get('empresa', empresa.id if empresa else 1)
        anio = request.query_params.get('anio', timezone.now().year)

        programas = self.get_queryset().filter(
            empresa=empresa_id, anio=anio, is_active=True
        )

        eventos = []
        for p in programas:
            eventos.append({
                'id': p.id,
                'titulo': p.periodo,
                'fecha': p.fecha_programada,
                'estado': p.estado,
                'color': {
                    'programada': '#3b82f6',
                    'convocada': '#f59e0b',
                    'realizada': '#10b981',
                    'cancelada': '#ef4444',
                    'reprogramada': '#8b5cf6',
                }.get(p.estado, '#6b7280')
            })

        return Response(eventos)

    @action(detail=True, methods=['post'])
    def cambiar_estado(self, request, pk=None):
        """Cambia el estado de un programa"""
        programa = self.get_object()
        nuevo_estado = request.data.get('estado')

        if nuevo_estado not in dict(ProgramaRevision.Estado.choices):
            return Response(
                {'detail': 'Estado inválido'},
                status=status.HTTP_400_BAD_REQUEST
            )

        programa.estado = nuevo_estado
        if nuevo_estado == 'realizada' and not programa.fecha_realizada:
            programa.fecha_realizada = timezone.now().date()

        programa.save(update_fields=['estado', 'fecha_realizada', 'updated_at'])

        return Response({
            'detail': f'Estado cambiado a {programa.get_estado_display()}',
            'estado': programa.estado
        })


class ParticipanteRevisionViewSet(StandardViewSetMixin, viewsets.ModelViewSet):
    """ViewSet para gestionar Participantes de revisiones"""
    queryset = ParticipanteRevision.objects.select_related('programa', 'usuario').all()
    serializer_class = ParticipanteRevisionSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['programa', 'rol', 'es_obligatorio', 'asistio']


class TemaRevisionViewSet(StandardViewSetMixin, viewsets.ModelViewSet):
    """ViewSet para gestionar Temas de revisión"""
    queryset = TemaRevision.objects.select_related('programa', 'responsable').all()
    serializer_class = TemaRevisionSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['programa', 'categoria', 'fue_presentado']
    ordering = ['orden']

    @action(detail=False, methods=['get'])
    def plantilla_temas_iso(self, request):
        """Retorna plantilla de temas según ISO"""
        temas_iso = [
            {'categoria': 'estado_acciones', 'titulo': 'Estado de acciones de revisiones anteriores'},
            {'categoria': 'cambios_contexto', 'titulo': 'Cambios en cuestiones externas e internas pertinentes'},
            {'categoria': 'info_desempeno', 'titulo': 'Información sobre el desempeño del SG'},
            {'categoria': 'satisfaccion_cliente', 'titulo': 'Satisfacción del cliente y retroalimentación de PI'},
            {'categoria': 'objetivos', 'titulo': 'Grado de cumplimiento de objetivos'},
            {'categoria': 'no_conformidades', 'titulo': 'No conformidades y acciones correctivas'},
            {'categoria': 'auditorias', 'titulo': 'Resultados de auditorías internas y externas'},
            {'categoria': 'proveedores', 'titulo': 'Desempeño de proveedores externos'},
            {'categoria': 'adecuacion_recursos', 'titulo': 'Adecuación de recursos'},
            {'categoria': 'eficacia_acciones', 'titulo': 'Eficacia de acciones para abordar riesgos y oportunidades'},
            {'categoria': 'oportunidades_mejora', 'titulo': 'Oportunidades de mejora'},
            # SST
            {'categoria': 'incidentes', 'titulo': 'Incidentes, no conformidades y acciones correctivas (SST)'},
            {'categoria': 'participacion', 'titulo': 'Resultados de consulta y participación de trabajadores'},
            {'categoria': 'requisitos_legales', 'titulo': 'Estado de cumplimiento de requisitos legales'},
        ]
        return Response(temas_iso)


class ActaRevisionViewSet(StandardViewSetMixin, viewsets.ModelViewSet):
    """ViewSet para gestionar Actas de Revisión"""
    queryset = ActaRevision.objects.select_related(
        'programa', 'elaborado_por', 'revisado_por', 'aprobado_por'
    ).prefetch_related('analisis_temas', 'compromisos').all()
    serializer_class = ActaRevisionSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['programa', 'evaluacion_sistema']
    ordering = ['-fecha']

    def perform_create(self, serializer):
        acta = serializer.save(elaborado_por=self.request.user)

        # Marcar programa como realizado
        programa = acta.programa
        if programa.estado != 'realizada':
            programa.estado = 'realizada'
            programa.fecha_realizada = acta.fecha
            programa.save(update_fields=['estado', 'fecha_realizada'])


class AnalisisTemaActaViewSet(StandardViewSetMixin, viewsets.ModelViewSet):
    """ViewSet para análisis de temas en actas"""
    queryset = AnalisisTemaActa.objects.select_related('acta', 'tema', 'presentado_por').all()
    serializer_class = AnalisisTemaActaSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['acta', 'tema']


class CompromisoRevisionViewSet(StandardViewSetMixin, viewsets.ModelViewSet):
    """
    ViewSet para gestionar Compromisos de revisión.

    Endpoints:
    - GET /compromisos/ - Lista de compromisos
    - GET /compromisos/pendientes/ - Compromisos pendientes
    - GET /compromisos/vencidos/ - Compromisos vencidos
    - GET /compromisos/por_responsable/ - Agrupados por responsable
    """
    queryset = CompromisoRevision.objects.select_related(
        'acta', 'tema_relacionado', 'responsable'
    ).prefetch_related('seguimientos').all()
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['acta', 'tipo', 'estado', 'prioridad', 'responsable', 'is_active']
    search_fields = ['consecutivo', 'descripcion']
    ordering_fields = ['fecha_compromiso', 'prioridad', 'estado']
    ordering = ['fecha_compromiso']

    def get_serializer_class(self):
        if self.action == 'list':
            return CompromisoRevisionListSerializer
        return CompromisoRevisionSerializer

    @action(detail=False, methods=['get'])
    def pendientes(self, request):
        """Retorna compromisos pendientes"""
        _empresa = get_tenant_empresa()
        empresa_id = request.query_params.get('empresa', _empresa.id if _empresa else 1)
        queryset = self.get_queryset().filter(
            acta__programa__empresa=empresa_id,
            estado__in=['pendiente', 'en_progreso'],
            is_active=True
        ).order_by('fecha_compromiso')

        serializer = CompromisoRevisionListSerializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def vencidos(self, request):
        """Retorna compromisos vencidos"""
        _empresa = get_tenant_empresa()
        empresa_id = request.query_params.get('empresa', _empresa.id if _empresa else 1)
        queryset = self.get_queryset().filter(
            acta__programa__empresa=empresa_id,
            estado__in=['pendiente', 'en_progreso'],
            fecha_compromiso__lt=timezone.now().date(),
            is_active=True
        ).order_by('fecha_compromiso')

        serializer = CompromisoRevisionListSerializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def por_responsable(self, request):
        """Agrupa compromisos por responsable"""
        _empresa = get_tenant_empresa()
        empresa_id = request.query_params.get('empresa', _empresa.id if _empresa else 1)
        queryset = self.get_queryset().filter(
            acta__programa__empresa=empresa_id,
            estado__in=['pendiente', 'en_progreso'],
            is_active=True
        )

        # Agrupar por responsable
        por_responsable = {}
        for comp in queryset:
            if comp.responsable:
                nombre = comp.responsable.get_full_name()
                if nombre not in por_responsable:
                    por_responsable[nombre] = {
                        'usuario_id': comp.responsable.id,
                        'total': 0,
                        'vencidos': 0,
                        'compromisos': []
                    }
                por_responsable[nombre]['total'] += 1
                if comp.esta_vencido:
                    por_responsable[nombre]['vencidos'] += 1
                por_responsable[nombre]['compromisos'].append(
                    CompromisoRevisionListSerializer(comp).data
                )

        return Response(por_responsable)

    @action(detail=True, methods=['post'])
    def registrar_avance(self, request, pk=None):
        """Registra avance en un compromiso"""
        compromiso = self.get_object()

        porcentaje = request.data.get('porcentaje_avance')
        descripcion = request.data.get('descripcion_avance', '')

        if porcentaje is None:
            return Response(
                {'detail': 'Se requiere porcentaje_avance'},
                status=status.HTTP_400_BAD_REQUEST
            )

        seguimiento = SeguimientoCompromiso.objects.create(
            compromiso=compromiso,
            fecha=timezone.now().date(),
            porcentaje_avance=porcentaje,
            descripcion_avance=descripcion,
            registrado_por=request.user
        )

        return Response({
            'detail': 'Avance registrado exitosamente',
            'porcentaje': compromiso.porcentaje_avance,
            'estado': compromiso.estado
        })


class SeguimientoCompromisoViewSet(StandardViewSetMixin, viewsets.ModelViewSet):
    """ViewSet para seguimientos de compromisos"""
    queryset = SeguimientoCompromiso.objects.select_related(
        'compromiso', 'registrado_por'
    ).all()
    serializer_class = SeguimientoCompromisoSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['compromiso']
    ordering = ['-fecha']

    def perform_create(self, serializer):
        serializer.save(registrado_por=self.request.user)


class RevisionDireccionStatsViewSet(viewsets.ViewSet):
    """
    ViewSet para estadísticas y dashboard de Revisión por Dirección.

    Endpoints:
    - GET /api/revision-direccion/stats/ - Estadísticas generales
    - GET /api/revision-direccion/dashboard/ - Dashboard completo
    """
    permission_classes = [IsAuthenticated]

    def list(self, request):
        """
        GET /api/revision-direccion/stats/
        Retorna estadísticas generales de revisión por dirección
        """
        _empresa = get_tenant_empresa()
        empresa_id = request.query_params.get('empresa', _empresa.id if _empresa else 1)
        anio = request.query_params.get('anio', timezone.now().year)

        programas = ProgramaRevision.objects.filter(empresa=empresa_id, anio=anio)

        total = programas.count()
        realizadas = programas.filter(estado='realizada').count()
        pendientes = programas.filter(estado__in=['programada', 'convocada']).count()

        # Próxima revisión
        proxima = programas.filter(
            estado__in=['programada', 'convocada'],
            fecha_programada__gte=timezone.now().date()
        ).order_by('fecha_programada').first()

        # Compromisos
        compromisos = CompromisoRevision.objects.filter(
            acta__programa__empresa=empresa_id,
            is_active=True
        )
        total_compromisos = compromisos.count()
        pendientes_comp = compromisos.filter(estado__in=['pendiente', 'en_progreso']).count()
        vencidos = compromisos.filter(
            estado__in=['pendiente', 'en_progreso'],
            fecha_compromiso__lt=timezone.now().date()
        ).count()
        cumplidos = compromisos.filter(estado='completado').count()

        porcentaje_cumplimiento = (cumplidos / total_compromisos * 100) if total_compromisos > 0 else 0

        return Response({
            'total_revisiones': total,
            'revisiones_realizadas': realizadas,
            'revisiones_pendientes': pendientes,
            'proxima_revision': {
                'id': proxima.id,
                'periodo': proxima.periodo,
                'fecha': proxima.fecha_programada,
                'estado': proxima.estado,
            } if proxima else None,
            'compromisos_totales': total_compromisos,
            'compromisos_pendientes': pendientes_comp,
            'compromisos_vencidos': vencidos,
            'porcentaje_cumplimiento': round(porcentaje_cumplimiento, 1),
        })

    @action(detail=False, methods=['get'])
    def dashboard(self, request):
        """
        GET /api/revision-direccion/stats/dashboard/
        Retorna dashboard completo de revisión por dirección
        """
        _empresa = get_tenant_empresa()
        empresa_id = request.query_params.get('empresa', _empresa.id if _empresa else 1)
        anio = request.query_params.get('anio', timezone.now().year)

        programas = ProgramaRevision.objects.filter(empresa=empresa_id, anio=anio)

        # Estadísticas de programas
        stats_programas = {
            'total': programas.count(),
            'realizadas': programas.filter(estado='realizada').count(),
            'pendientes': programas.filter(estado__in=['programada', 'convocada']).count(),
            'canceladas': programas.filter(estado='cancelada').count(),
        }

        # Compromisos por estado
        compromisos = CompromisoRevision.objects.filter(
            acta__programa__empresa=empresa_id,
            is_active=True
        )

        stats_compromisos = {
            'total': compromisos.count(),
            'pendientes': compromisos.filter(estado='pendiente').count(),
            'en_progreso': compromisos.filter(estado='en_progreso').count(),
            'completados': compromisos.filter(estado='completado').count(),
            'vencidos': compromisos.filter(
                estado__in=['pendiente', 'en_progreso'],
                fecha_compromiso__lt=timezone.now().date()
            ).count(),
        }

        # Próximas revisiones (siguientes 3)
        proximas = programas.filter(
            estado__in=['programada', 'convocada'],
            fecha_programada__gte=timezone.now().date()
        ).order_by('fecha_programada')[:3]

        proximas_data = [
            {
                'id': p.id,
                'periodo': p.periodo,
                'fecha': p.fecha_programada,
                'estado': p.estado,
                'lugar': p.lugar,
            }
            for p in proximas
        ]

        # Compromisos vencidos recientes (últimos 5)
        vencidos_recientes = compromisos.filter(
            estado__in=['pendiente', 'en_progreso'],
            fecha_compromiso__lt=timezone.now().date()
        ).order_by('fecha_compromiso')[:5]

        vencidos_data = [
            {
                'id': c.id,
                'descripcion': c.descripcion[:100] + '...' if len(c.descripcion) > 100 else c.descripcion,
                'fecha_compromiso': c.fecha_compromiso,
                'responsable': c.responsable.get_full_name() if c.responsable else None,
                'prioridad': c.prioridad,
            }
            for c in vencidos_recientes
        ]

        return Response({
            'programas': stats_programas,
            'compromisos': stats_compromisos,
            'proximas_revisiones': proximas_data,
            'compromisos_vencidos': vencidos_data,
        })
