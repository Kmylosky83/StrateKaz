"""
Views para Contexto Organizacional - Motor de Riesgos
====================================================

ViewSets para los modelos de análisis estratégico del contexto organizacional.

Todos los ViewSets implementan:
- StandardViewSetMixin: Funcionalidad estándar (toggle, filtros, bulk, auditoría)
- Filtros por empresa, estado, tipo, fecha
- Acciones especiales: aprobar(), archivar()
- Optimización de queries con select_related y prefetch_related

Endpoints generados:
- /api/motor-riesgos/contexto/analisis-dofa/
- /api/motor-riesgos/contexto/factores-dofa/
- /api/motor-riesgos/contexto/estrategias-tows/
- /api/motor-riesgos/contexto/analisis-pestel/
- /api/motor-riesgos/contexto/factores-pestel/
- /api/motor-riesgos/contexto/fuerzas-porter/

Autor: Sistema ERP StrateKaz
Fecha: 2025-12-26
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.db.models import Count, Q
from datetime import date

from apps.core.mixins import StandardViewSetMixin
from .models import (
    AnalisisDOFA,
    FactorDOFA,
    EstrategiaTOWS,
    AnalisisPESTEL,
    FactorPESTEL,
    FuerzaPorter
)
from .serializers import (
    AnalisisDOFASerializer,
    FactorDOFASerializer,
    EstrategiaTOWSSerializer,
    AnalisisPESTELSerializer,
    FactorPESTELSerializer,
    FuerzaPorterSerializer
)


class AnalisisDOFAViewSet(StandardViewSetMixin, viewsets.ModelViewSet):
    """
    ViewSet para gestión de análisis DOFA.

    Funcionalidad:
    - CRUD completo de análisis DOFA
    - Filtros por empresa, estado, periodo, fecha
    - Búsqueda por nombre, periodo, observaciones
    - Ordenamiento por fecha de análisis, creación
    - Acciones: aprobar(), archivar(), matriz_completa()
    - Funcionalidad estándar: toggle_active, bulk actions, auditoría

    Endpoints especiales:
    - POST /analisis-dofa/{id}/aprobar/ - Aprobar análisis
    - POST /analisis-dofa/{id}/archivar/ - Archivar análisis
    - GET /analisis-dofa/{id}/matriz-completa/ - Matriz DOFA completa con factores y estrategias
    - GET /analisis-dofa/estadisticas/ - Estadísticas generales
    """

    queryset = AnalisisDOFA.objects.select_related(
        'responsable',
        'aprobado_por',
        'empresa'
    ).prefetch_related(
        'factores',
        'estrategias'
    )
    serializer_class = AnalisisDOFASerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['empresa', 'estado', 'periodo', 'responsable']
    search_fields = ['nombre', 'periodo', 'observaciones']
    ordering_fields = ['fecha_analisis', 'created_at', 'periodo']
    ordering = ['-fecha_analisis']

    @action(detail=True, methods=['post'])
    def aprobar(self, request, pk=None) -> Response:
        """
        Aprobar un análisis DOFA.

        Cambia el estado a 'aprobado', registra quién aprobó y la fecha.

        Body: {}
        Response: {análisis actualizado}
        """
        analisis = self.get_object()

        if analisis.estado == 'aprobado':
            return Response(
                {'error': 'El análisis ya está aprobado'},
                status=status.HTTP_400_BAD_REQUEST
            )

        analisis.estado = 'aprobado'
        analisis.aprobado_por = request.user
        analisis.fecha_aprobacion = date.today()
        analisis.save(update_fields=['estado', 'aprobado_por', 'fecha_aprobacion', 'updated_at'])

        serializer = self.get_serializer(analisis)
        return Response({
            'message': 'Análisis DOFA aprobado exitosamente',
            'data': serializer.data
        })

    @action(detail=True, methods=['post'])
    def archivar(self, request, pk=None) -> Response:
        """
        Archivar un análisis DOFA.

        Cambia el estado a 'archivado'.

        Body: {}
        Response: {análisis actualizado}
        """
        analisis = self.get_object()

        if analisis.estado == 'archivado':
            return Response(
                {'error': 'El análisis ya está archivado'},
                status=status.HTTP_400_BAD_REQUEST
            )

        analisis.estado = 'archivado'
        analisis.save(update_fields=['estado', 'updated_at'])

        serializer = self.get_serializer(analisis)
        return Response({
            'message': 'Análisis DOFA archivado exitosamente',
            'data': serializer.data
        })

    @action(detail=True, methods=['get'])
    def matriz_completa(self, request, pk=None) -> Response:
        """
        Retorna la matriz DOFA completa con factores y estrategias organizados.

        Response: {
            'analisis': {...},
            'factores': {
                'fortalezas': [...],
                'oportunidades': [...],
                'debilidades': [...],
                'amenazas': [...]
            },
            'estrategias': {
                'fo': [...],
                'fa': [...],
                'do': [...],
                'da': [...]
            },
            'resumen': {...}
        }
        """
        analisis = self.get_object()

        # Factores por tipo
        factores = analisis.factores.all()
        fortalezas = FactorDOFASerializer(
            factores.filter(tipo='fortaleza'),
            many=True
        ).data
        oportunidades = FactorDOFASerializer(
            factores.filter(tipo='oportunidad'),
            many=True
        ).data
        debilidades = FactorDOFASerializer(
            factores.filter(tipo='debilidad'),
            many=True
        ).data
        amenazas = FactorDOFASerializer(
            factores.filter(tipo='amenaza'),
            many=True
        ).data

        # Estrategias por tipo
        estrategias = analisis.estrategias.all()
        estrategias_fo = EstrategiaTOWSSerializer(
            estrategias.filter(tipo='fo'),
            many=True
        ).data
        estrategias_fa = EstrategiaTOWSSerializer(
            estrategias.filter(tipo='fa'),
            many=True
        ).data
        estrategias_do = EstrategiaTOWSSerializer(
            estrategias.filter(tipo='do'),
            many=True
        ).data
        estrategias_da = EstrategiaTOWSSerializer(
            estrategias.filter(tipo='da'),
            many=True
        ).data

        return Response({
            'analisis': AnalisisDOFASerializer(analisis).data,
            'factores': {
                'fortalezas': fortalezas,
                'oportunidades': oportunidades,
                'debilidades': debilidades,
                'amenazas': amenazas,
            },
            'estrategias': {
                'fo': estrategias_fo,
                'fa': estrategias_fa,
                'do': estrategias_do,
                'da': estrategias_da,
            },
            'resumen': {
                'total_fortalezas': len(fortalezas),
                'total_oportunidades': len(oportunidades),
                'total_debilidades': len(debilidades),
                'total_amenazas': len(amenazas),
                'total_estrategias': len(estrategias),
                'total_estrategias_fo': len(estrategias_fo),
                'total_estrategias_fa': len(estrategias_fa),
                'total_estrategias_do': len(estrategias_do),
                'total_estrategias_da': len(estrategias_da),
            }
        })

    @action(detail=False, methods=['get'])
    def estadisticas(self, request) -> Response:
        """
        Retorna estadísticas generales de análisis DOFA.

        Response: {
            'total': int,
            'por_estado': {...},
            'por_periodo': [...],
            'vigentes': int
        }
        """
        queryset = self.filter_queryset(self.get_queryset())

        stats = {
            'total': queryset.count(),
            'por_estado': dict(
                queryset.values('estado').annotate(
                    total=Count('id')
                ).values_list('estado', 'total')
            ),
            'vigentes': queryset.filter(estado='vigente').count(),
        }

        return Response(stats)


class FactorDOFAViewSet(StandardViewSetMixin, viewsets.ModelViewSet):
    """
    ViewSet para gestión de factores DOFA.

    Funcionalidad:
    - CRUD completo de factores DOFA
    - Filtros por empresa, análisis, tipo, impacto
    - Búsqueda por descripción, área afectada
    - Ordenamiento por análisis, tipo, orden, creación
    - Funcionalidad estándar: toggle_active, bulk actions, auditoría
    """

    queryset = FactorDOFA.objects.select_related(
        'analisis',
        'empresa',
        'created_by'
    )
    serializer_class = FactorDOFASerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['empresa', 'analisis', 'tipo', 'impacto']
    search_fields = ['descripcion', 'area_afectada', 'evidencias']
    ordering_fields = ['analisis', 'tipo', 'orden', 'created_at']
    ordering = ['analisis', 'tipo', 'orden']


class EstrategiaTOWSViewSet(StandardViewSetMixin, viewsets.ModelViewSet):
    """
    ViewSet para gestión de estrategias TOWS.

    Funcionalidad:
    - CRUD completo de estrategias TOWS
    - Filtros por empresa, análisis, tipo, estado, prioridad, responsable
    - Búsqueda por descripción, objetivo
    - Ordenamiento por prioridad, fecha límite, estado
    - Acciones: aprobar(), ejecutar(), completar()
    - Funcionalidad estándar: toggle_active, bulk actions, auditoría

    Endpoints especiales:
    - POST /estrategias-tows/{id}/aprobar/ - Aprobar estrategia
    - POST /estrategias-tows/{id}/ejecutar/ - Marcar como en ejecución
    - POST /estrategias-tows/{id}/completar/ - Marcar como completada
    - GET /estrategias-tows/proximas-vencer/ - Estrategias próximas a vencer
    """

    queryset = EstrategiaTOWS.objects.select_related(
        'analisis',
        'responsable',
        'empresa',
        'created_by'
    )
    serializer_class = EstrategiaTOWSSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['empresa', 'analisis', 'tipo', 'estado', 'prioridad', 'responsable']
    search_fields = ['descripcion', 'objetivo', 'recursos_necesarios']
    ordering_fields = ['prioridad', 'fecha_limite', 'estado', 'created_at']
    ordering = ['-prioridad', 'fecha_limite']

    @action(detail=True, methods=['post'])
    def aprobar(self, request, pk=None) -> Response:
        """
        Aprobar una estrategia TOWS.

        Cambia el estado a 'aprobada'.
        """
        estrategia = self.get_object()

        if estrategia.estado != 'propuesta':
            return Response(
                {'error': 'Solo se pueden aprobar estrategias propuestas'},
                status=status.HTTP_400_BAD_REQUEST
            )

        estrategia.estado = 'aprobada'
        estrategia.save(update_fields=['estado', 'updated_at'])

        serializer = self.get_serializer(estrategia)
        return Response({
            'message': 'Estrategia aprobada exitosamente',
            'data': serializer.data
        })

    @action(detail=True, methods=['post'])
    def ejecutar(self, request, pk=None) -> Response:
        """
        Marcar una estrategia como en ejecución.

        Cambia el estado a 'en_ejecucion'.
        """
        estrategia = self.get_object()

        if estrategia.estado not in ['propuesta', 'aprobada']:
            return Response(
                {'error': 'La estrategia debe estar propuesta o aprobada'},
                status=status.HTTP_400_BAD_REQUEST
            )

        estrategia.estado = 'en_ejecucion'
        if not estrategia.fecha_implementacion:
            estrategia.fecha_implementacion = date.today()
        estrategia.save(update_fields=['estado', 'fecha_implementacion', 'updated_at'])

        serializer = self.get_serializer(estrategia)
        return Response({
            'message': 'Estrategia marcada como en ejecución',
            'data': serializer.data
        })

    @action(detail=True, methods=['post'])
    def completar(self, request, pk=None) -> Response:
        """
        Marcar una estrategia como completada.

        Cambia el estado a 'completada' y establece progreso al 100%.

        Body (opcional):
        {
            "observaciones": "string"
        }
        """
        estrategia = self.get_object()

        if estrategia.estado != 'en_ejecucion':
            return Response(
                {'error': 'Solo se pueden completar estrategias en ejecución'},
                status=status.HTTP_400_BAD_REQUEST
            )

        estrategia.estado = 'completada'
        estrategia.progreso_porcentaje = 100
        estrategia.save(update_fields=['estado', 'progreso_porcentaje', 'updated_at'])

        serializer = self.get_serializer(estrategia)
        return Response({
            'message': 'Estrategia completada exitosamente',
            'data': serializer.data
        })

    @action(detail=False, methods=['get'])
    def proximas_vencer(self, request) -> Response:
        """
        Retorna estrategias próximas a vencer (30 días).

        Query params:
        - dias: int (default: 30) - Días de anticipación

        Response: {
            'estrategias': [...],
            'total': int
        }
        """
        from datetime import timedelta

        dias = int(request.query_params.get('dias', 30))
        fecha_limite = date.today() + timedelta(days=dias)

        estrategias = self.filter_queryset(self.get_queryset()).filter(
            fecha_limite__lte=fecha_limite,
            fecha_limite__gte=date.today(),
            estado__in=['propuesta', 'aprobada', 'en_ejecucion']
        ).order_by('fecha_limite')

        serializer = self.get_serializer(estrategias, many=True)
        return Response({
            'estrategias': serializer.data,
            'total': estrategias.count()
        })


class AnalisisPESTELViewSet(StandardViewSetMixin, viewsets.ModelViewSet):
    """
    ViewSet para gestión de análisis PESTEL.

    Funcionalidad:
    - CRUD completo de análisis PESTEL
    - Filtros por empresa, estado, periodo, fecha
    - Búsqueda por nombre, periodo, conclusiones
    - Ordenamiento por fecha de análisis, creación
    - Acciones: aprobar(), archivar()
    - Funcionalidad estándar: toggle_active, bulk actions, auditoría

    Endpoints especiales:
    - POST /analisis-pestel/{id}/aprobar/ - Aprobar análisis
    - POST /analisis-pestel/{id}/archivar/ - Archivar análisis
    - GET /analisis-pestel/estadisticas/ - Estadísticas generales
    """

    queryset = AnalisisPESTEL.objects.select_related(
        'responsable',
        'empresa'
    ).prefetch_related(
        'factores'
    )
    serializer_class = AnalisisPESTELSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['empresa', 'estado', 'periodo', 'responsable']
    search_fields = ['nombre', 'periodo', 'conclusiones']
    ordering_fields = ['fecha_analisis', 'created_at', 'periodo']
    ordering = ['-fecha_analisis']

    @action(detail=True, methods=['post'])
    def aprobar(self, request, pk=None) -> Response:
        """
        Aprobar un análisis PESTEL.

        Cambia el estado a 'aprobado'.
        """
        analisis = self.get_object()

        if analisis.estado == 'aprobado':
            return Response(
                {'error': 'El análisis ya está aprobado'},
                status=status.HTTP_400_BAD_REQUEST
            )

        analisis.estado = 'aprobado'
        analisis.save(update_fields=['estado', 'updated_at'])

        serializer = self.get_serializer(analisis)
        return Response({
            'message': 'Análisis PESTEL aprobado exitosamente',
            'data': serializer.data
        })

    @action(detail=True, methods=['post'])
    def archivar(self, request, pk=None) -> Response:
        """
        Archivar un análisis PESTEL.

        Cambia el estado a 'archivado'.
        """
        analisis = self.get_object()

        if analisis.estado == 'archivado':
            return Response(
                {'error': 'El análisis ya está archivado'},
                status=status.HTTP_400_BAD_REQUEST
            )

        analisis.estado = 'archivado'
        analisis.save(update_fields=['estado', 'updated_at'])

        serializer = self.get_serializer(analisis)
        return Response({
            'message': 'Análisis PESTEL archivado exitosamente',
            'data': serializer.data
        })

    @action(detail=False, methods=['get'])
    def estadisticas(self, request) -> Response:
        """
        Retorna estadísticas generales de análisis PESTEL.

        Response: {
            'total': int,
            'por_estado': {...},
            'vigentes': int
        }
        """
        queryset = self.filter_queryset(self.get_queryset())

        stats = {
            'total': queryset.count(),
            'por_estado': dict(
                queryset.values('estado').annotate(
                    total=Count('id')
                ).values_list('estado', 'total')
            ),
            'vigentes': queryset.filter(estado='vigente').count(),
        }

        return Response(stats)


class FactorPESTELViewSet(StandardViewSetMixin, viewsets.ModelViewSet):
    """
    ViewSet para gestión de factores PESTEL.

    Funcionalidad:
    - CRUD completo de factores PESTEL
    - Filtros por empresa, análisis, tipo, impacto, probabilidad, tendencia
    - Búsqueda por descripción, implicaciones, fuentes
    - Ordenamiento por análisis, tipo, orden, creación
    - Funcionalidad estándar: toggle_active, bulk actions, auditoría
    """

    queryset = FactorPESTEL.objects.select_related(
        'analisis',
        'empresa',
        'created_by'
    )
    serializer_class = FactorPESTELSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['empresa', 'analisis', 'tipo', 'impacto', 'probabilidad', 'tendencia']
    search_fields = ['descripcion', 'implicaciones', 'fuentes']
    ordering_fields = ['analisis', 'tipo', 'orden', 'created_at']
    ordering = ['analisis', 'tipo', 'orden']


class FuerzaPorterViewSet(StandardViewSetMixin, viewsets.ModelViewSet):
    """
    ViewSet para gestión de fuerzas de Porter.

    Funcionalidad:
    - CRUD completo de fuerzas de Porter
    - Filtros por empresa, tipo, nivel, periodo
    - Búsqueda por descripción, implicaciones estratégicas
    - Ordenamiento por tipo, nivel, fecha de análisis
    - Funcionalidad estándar: toggle_active, bulk actions, auditoría

    Endpoints especiales:
    - GET /fuerzas-porter/resumen/ - Resumen de las 5 fuerzas por periodo
    """

    queryset = FuerzaPorter.objects.select_related(
        'empresa',
        'created_by'
    )
    serializer_class = FuerzaPorterSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['empresa', 'tipo', 'nivel', 'periodo']
    search_fields = ['descripcion', 'implicaciones_estrategicas']
    ordering_fields = ['tipo', 'nivel', 'fecha_analisis', 'created_at']
    ordering = ['tipo']

    @action(detail=False, methods=['get'])
    def resumen(self, request) -> Response:
        """
        Retorna resumen de las 5 fuerzas de Porter.

        Query params:
        - periodo: string (opcional) - Filtrar por periodo específico

        Response: {
            'periodo': string,
            'fuerzas': [
                {
                    'tipo': string,
                    'tipo_display': string,
                    'nivel': string,
                    'nivel_display': string,
                    'descripcion': string
                },
                ...
            ],
            'total_fuerzas': int,
            'distribucion_niveles': {...}
        }
        """
        periodo = request.query_params.get('periodo')

        queryset = self.filter_queryset(self.get_queryset())
        if periodo:
            queryset = queryset.filter(periodo=periodo)

        serializer = self.get_serializer(queryset, many=True)

        distribucion = dict(
            queryset.values('nivel').annotate(
                total=Count('id')
            ).values_list('nivel', 'total')
        )

        return Response({
            'periodo': periodo,
            'fuerzas': serializer.data,
            'total_fuerzas': queryset.count(),
            'distribucion_niveles': distribucion
        })
