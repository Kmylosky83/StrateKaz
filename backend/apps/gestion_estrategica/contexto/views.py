"""
Views para Contexto Organizacional - Gestión Estratégica
========================================================

ViewSets para los modelos de análisis estratégico del contexto organizacional.

Todos los ViewSets implementan:
- StandardViewSetMixin: Funcionalidad estándar (toggle, filtros, bulk, auditoría)
- Filtros por empresa, estado, tipo, fecha
- Acciones especiales: aprobar(), archivar()
- Optimización de queries con select_related y prefetch_related

Endpoints generados:
- /api/gestion-estrategica/contexto/analisis-dofa/
- /api/gestion-estrategica/contexto/factores-dofa/
- /api/gestion-estrategica/contexto/estrategias-tows/
- /api/gestion-estrategica/contexto/analisis-pestel/
- /api/gestion-estrategica/contexto/factores-pestel/
- /api/gestion-estrategica/contexto/fuerzas-porter/
- /api/gestion-estrategica/contexto/tipos-parte-interesada/
- /api/gestion-estrategica/contexto/partes-interesadas/
- /api/gestion-estrategica/contexto/requisitos-pi/
- /api/gestion-estrategica/contexto/matriz-comunicacion/

Autor: Sistema ERP StrateKaz
Fecha: 2025-12-26
Actualizado: 2026-01-24 - Migrado a app independiente
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.db.models import Count
from datetime import date

from apps.core.mixins import StandardViewSetMixin
from .models import (
    TipoAnalisisDOFA,
    AnalisisDOFA,
    FactorDOFA,
    EstrategiaTOWS,
    TipoAnalisisPESTEL,
    AnalisisPESTEL,
    FactorPESTEL,
    FuerzaPorter,
    TipoParteInteresada,
    ParteInteresada,
    RequisitoParteInteresada,
    MatrizComunicacion
)
from .serializers import (
    TipoAnalisisDOFASerializer,
    AnalisisDOFASerializer,
    FactorDOFASerializer,
    EstrategiaTOWSSerializer,
    TipoAnalisisPESTELSerializer,
    AnalisisPESTELSerializer,
    FactorPESTELSerializer,
    FuerzaPorterSerializer,
    TipoParteInteresadaSerializer,
    ParteInteresadaSerializer,
    RequisitoParteInteresadaSerializer,
    MatrizComunicacionSerializer
)


# ============================================================================
# CATÁLOGOS GLOBALES
# ============================================================================

class TipoAnalisisDOFAViewSet(StandardViewSetMixin, viewsets.ModelViewSet):
    """
    ViewSet para gestión de Tipos de Análisis DOFA.

    Catálogo global de tipos de análisis (Organizacional, Anual, Por Área, etc.)
    No depende de empresa - es global para todo el sistema.
    """

    queryset = TipoAnalisisDOFA.objects.all()
    serializer_class = TipoAnalisisDOFASerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['is_active']
    search_fields = ['codigo', 'nombre', 'descripcion']
    ordering_fields = ['orden', 'nombre', 'codigo']
    ordering = ['orden', 'nombre']


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
        'tipo_analisis',
        'responsable',
        'aprobado_por',
        'empresa'
    ).prefetch_related(
        'factores',
        'estrategias'
    )
    serializer_class = AnalisisDOFASerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['empresa', 'estado', 'periodo', 'responsable', 'tipo_analisis']
    search_fields = ['nombre', 'periodo', 'observaciones']
    ordering_fields = ['fecha_analisis', 'created_at', 'periodo']
    ordering = ['-fecha_analisis']

    @action(detail=True, methods=['post'])
    def aprobar(self, request, pk=None) -> Response:
        """Aprobar un análisis DOFA."""
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
        """Archivar un análisis DOFA."""
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
        """Retorna la matriz DOFA completa con factores y estrategias organizados."""
        analisis = self.get_object()

        # Factores por tipo
        factores = analisis.factores.all()
        fortalezas = FactorDOFASerializer(factores.filter(tipo='fortaleza'), many=True).data
        oportunidades = FactorDOFASerializer(factores.filter(tipo='oportunidad'), many=True).data
        debilidades = FactorDOFASerializer(factores.filter(tipo='debilidad'), many=True).data
        amenazas = FactorDOFASerializer(factores.filter(tipo='amenaza'), many=True).data

        # Estrategias por tipo
        estrategias = analisis.estrategias.all()
        estrategias_fo = EstrategiaTOWSSerializer(estrategias.filter(tipo='fo'), many=True).data
        estrategias_fa = EstrategiaTOWSSerializer(estrategias.filter(tipo='fa'), many=True).data
        estrategias_do = EstrategiaTOWSSerializer(estrategias.filter(tipo='do'), many=True).data
        estrategias_da = EstrategiaTOWSSerializer(estrategias.filter(tipo='da'), many=True).data

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
        """Retorna estadísticas generales de análisis DOFA."""
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
    """ViewSet para gestión de factores DOFA."""

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
    """ViewSet para gestión de estrategias TOWS."""

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
        """Aprobar una estrategia TOWS."""
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
        """Marcar una estrategia como en ejecución."""
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
        """Marcar una estrategia como completada."""
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
        """Retorna estrategias próximas a vencer (30 días)."""
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

    @action(detail=True, methods=['post'])
    def convertir_objetivo(self, request, pk=None) -> Response:
        """Convierte una estrategia TOWS en un objetivo estratégico."""
        from apps.gestion_estrategica.planeacion.models import StrategicObjective, StrategicPlan

        estrategia = self.get_object()

        # Validar que no esté ya convertida
        if estrategia.objetivo_estrategico:
            return Response(
                {
                    'error': 'Esta estrategia ya fue convertida en objetivo',
                    'objetivo_id': str(estrategia.objetivo_estrategico.id),
                    'objetivo_code': estrategia.objetivo_estrategico.code
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validar que esté aprobada
        if estrategia.estado not in ['aprobada', 'en_ejecucion']:
            return Response(
                {'error': 'Solo se pueden convertir estrategias aprobadas o en ejecución'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Obtener plan activo
        plan_activo = StrategicPlan.get_active()
        if not plan_activo:
            return Response(
                {'error': 'No hay un plan estratégico activo. Cree uno primero.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Datos del objetivo
        objetivo_data = request.data
        code = objetivo_data.get('code')
        name = objetivo_data.get('name', estrategia.descripcion[:300])
        bsc_perspective = objetivo_data.get('bsc_perspective')
        target_value = objetivo_data.get('target_value')
        unit = objetivo_data.get('unit', '%')

        # Validar campos requeridos
        if not code or not bsc_perspective:
            return Response(
                {'error': 'Los campos code y bsc_perspective son requeridos'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validar que el código no exista
        if StrategicObjective.objects.filter(plan=plan_activo, code=code).exists():
            return Response(
                {'error': f'Ya existe un objetivo con el código {code} en el plan actual'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Crear objetivo estratégico
        objetivo = StrategicObjective.objects.create(
            plan=plan_activo,
            code=code,
            name=name,
            description=f"{estrategia.descripcion}\n\nObjetivo esperado: {estrategia.objetivo}",
            bsc_perspective=bsc_perspective,
            responsible=estrategia.responsable,
            target_value=target_value,
            unit=unit,
            status='PENDIENTE',
            created_by=request.user,
            updated_by=request.user
        )

        # Vincular área responsable si existe
        if estrategia.area_responsable:
            objetivo.areas_responsables.add(estrategia.area_responsable)

        # Vincular estrategia con objetivo
        estrategia.objetivo_estrategico = objetivo
        estrategia.save(update_fields=['objetivo_estrategico', 'updated_at'])

        # Serializar respuesta
        from apps.gestion_estrategica.planeacion.serializers import StrategicObjectiveSerializer
        objetivo_serializer = StrategicObjectiveSerializer(objetivo)
        estrategia_serializer = self.get_serializer(estrategia)

        return Response({
            'message': 'Objetivo estratégico creado exitosamente',
            'objetivo': objetivo_serializer.data,
            'estrategia': estrategia_serializer.data
        }, status=status.HTTP_201_CREATED)


class TipoAnalisisPESTELViewSet(StandardViewSetMixin, viewsets.ModelViewSet):
    """
    ViewSet para gestión de Tipos de Análisis PESTEL.

    Catálogo global de tipos de análisis (Macro-Entorno, Sectorial, Por País, etc.)
    No depende de empresa - es global para todo el sistema.
    """

    queryset = TipoAnalisisPESTEL.objects.all()
    serializer_class = TipoAnalisisPESTELSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['is_active']
    search_fields = ['codigo', 'nombre', 'descripcion']
    ordering_fields = ['orden', 'nombre', 'codigo']
    ordering = ['orden', 'nombre']


class AnalisisPESTELViewSet(StandardViewSetMixin, viewsets.ModelViewSet):
    """ViewSet para gestión de análisis PESTEL."""

    queryset = AnalisisPESTEL.objects.select_related(
        'tipo_analisis',
        'responsable',
        'empresa'
    ).prefetch_related(
        'factores'
    )
    serializer_class = AnalisisPESTELSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['empresa', 'estado', 'periodo', 'responsable', 'tipo_analisis']
    search_fields = ['nombre', 'periodo', 'conclusiones']
    ordering_fields = ['fecha_analisis', 'created_at', 'periodo']
    ordering = ['-fecha_analisis']

    @action(detail=True, methods=['post'])
    def aprobar(self, request, pk=None) -> Response:
        """Aprobar un análisis PESTEL."""
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
        """Archivar un análisis PESTEL."""
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
        """Retorna estadísticas generales de análisis PESTEL."""
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
    """ViewSet para gestión de factores PESTEL."""

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
    """ViewSet para gestión de fuerzas de Porter."""

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
        """Retorna resumen de las 5 fuerzas de Porter."""
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


# ============================================================================
# VIEWSETS PARTES INTERESADAS (Stakeholders) - ISO 9001:2015 Cláusula 4.2
# ============================================================================

class TipoParteInteresadaViewSet(StandardViewSetMixin, viewsets.ModelViewSet):
    """ViewSet para gestión de Tipos de Parte Interesada."""

    queryset = TipoParteInteresada.objects.all()
    serializer_class = TipoParteInteresadaSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['categoria', 'is_active']
    search_fields = ['codigo', 'nombre', 'descripcion']
    ordering_fields = ['orden', 'nombre', 'categoria']
    ordering = ['orden', 'categoria', 'nombre']


class ParteInteresadaViewSet(StandardViewSetMixin, viewsets.ModelViewSet):
    """ViewSet para gestión de Partes Interesadas (Stakeholders)."""

    queryset = ParteInteresada.objects.select_related('tipo').all()
    serializer_class = ParteInteresadaSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = [
        'empresa', 'tipo', 'nivel_influencia', 'nivel_interes',
        'relacionado_sst', 'relacionado_ambiental',
        'relacionado_calidad', 'relacionado_pesv', 'is_active'
    ]
    search_fields = ['nombre', 'descripcion', 'representante']
    ordering_fields = ['nombre', 'nivel_influencia', 'nivel_interes', 'created_at']
    ordering = ['-nivel_influencia', '-nivel_interes', 'nombre']

    @action(detail=False, methods=['get'])
    def matriz_poder_interes(self, request) -> Response:
        """Retorna las partes interesadas organizadas por cuadrante."""
        queryset = self.filter_queryset(self.get_queryset()).filter(is_active=True)

        cuadrantes = {
            'gestionar_cerca': [],
            'mantener_satisfecho': [],
            'mantener_informado': [],
            'monitorear': []
        }

        for parte in queryset:
            data = self.get_serializer(parte).data
            if parte.nivel_influencia == 'alta' and parte.nivel_interes == 'alto':
                cuadrantes['gestionar_cerca'].append(data)
            elif parte.nivel_influencia == 'alta':
                cuadrantes['mantener_satisfecho'].append(data)
            elif parte.nivel_interes == 'alto':
                cuadrantes['mantener_informado'].append(data)
            else:
                cuadrantes['monitorear'].append(data)

        return Response(cuadrantes)

    @action(detail=False, methods=['get'])
    def estadisticas(self, request) -> Response:
        """Retorna estadísticas de partes interesadas."""
        queryset = self.filter_queryset(self.get_queryset())

        stats = {
            'total': queryset.count(),
            'por_tipo': dict(
                queryset.values('tipo__nombre').annotate(
                    total=Count('id')
                ).values_list('tipo__nombre', 'total')
            ),
            'por_influencia': dict(
                queryset.values('nivel_influencia').annotate(
                    total=Count('id')
                ).values_list('nivel_influencia', 'total')
            ),
            'por_interes': dict(
                queryset.values('nivel_interes').annotate(
                    total=Count('id')
                ).values_list('nivel_interes', 'total')
            ),
            'por_sistema': {
                'sst': queryset.filter(relacionado_sst=True).count(),
                'ambiental': queryset.filter(relacionado_ambiental=True).count(),
                'calidad': queryset.filter(relacionado_calidad=True).count(),
                'pesv': queryset.filter(relacionado_pesv=True).count(),
            }
        }

        return Response(stats)


class RequisitoParteInteresadaViewSet(StandardViewSetMixin, viewsets.ModelViewSet):
    """ViewSet para gestión de Requisitos de Partes Interesadas."""

    queryset = RequisitoParteInteresada.objects.select_related('parte_interesada').all()
    serializer_class = RequisitoParteInteresadaSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = [
        'empresa', 'parte_interesada', 'tipo', 'prioridad', 'cumple', 'is_active'
    ]
    search_fields = ['descripcion', 'como_se_aborda', 'proceso_relacionado']
    ordering_fields = ['prioridad', 'tipo', 'created_at']
    ordering = ['-prioridad', 'tipo']


class MatrizComunicacionViewSet(StandardViewSetMixin, viewsets.ModelViewSet):
    """ViewSet para gestión de Matriz de Comunicación."""

    queryset = MatrizComunicacion.objects.select_related(
        'parte_interesada', 'responsable'
    ).all()
    serializer_class = MatrizComunicacionSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = [
        'empresa', 'parte_interesada', 'cuando_comunicar', 'como_comunicar',
        'aplica_sst', 'aplica_ambiental', 'aplica_calidad', 'aplica_pesv', 'is_active'
    ]
    search_fields = ['que_comunicar', 'registro_evidencia']
    ordering_fields = ['parte_interesada', 'cuando_comunicar', 'created_at']
    ordering = ['parte_interesada', 'cuando_comunicar']
