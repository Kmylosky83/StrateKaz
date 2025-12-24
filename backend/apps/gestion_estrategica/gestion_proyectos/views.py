"""
Views para Gestión de Proyectos (PMI)

Endpoints por subtab:
- Portafolio: /portafolios/, /programas/
- Iniciación: /proyectos/, /charters/
- Planificación: /fases/, /actividades/, /recursos/, /interesados/
- Ejecución/Monitoreo: /seguimientos/, /riesgos/
- Cierre: /lecciones/, /actas-cierre/
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.db.models import Count, Sum, Avg

from .models import (
    Portafolio, Programa, Proyecto, ProjectCharter,
    InteresadoProyecto, FaseProyecto, ActividadProyecto,
    RecursoProyecto, RiesgoProyecto, SeguimientoProyecto,
    LeccionAprendida, ActaCierre
)
from .serializers import (
    PortafolioSerializer, ProgramaSerializer,
    ProyectoSerializer, ProyectoListSerializer, ProyectoCreateUpdateSerializer,
    ProjectCharterSerializer, InteresadoProyectoSerializer,
    FaseProyectoSerializer, ActividadProyectoSerializer,
    RecursoProyectoSerializer, RiesgoProyectoSerializer,
    SeguimientoProyectoSerializer, LeccionAprendidaSerializer,
    ActaCierreSerializer
)


class PortafolioViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar Portafolios de proyectos.
    """
    queryset = Portafolio.objects.select_related('responsable', 'created_by').all()
    serializer_class = PortafolioSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ['empresa_id', 'is_active']
    search_fields = ['codigo', 'nombre', 'objetivo_estrategico']

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class ProgramaViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar Programas de proyectos.
    """
    queryset = Programa.objects.select_related('portafolio', 'responsable').all()
    serializer_class = ProgramaSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ['empresa_id', 'portafolio', 'is_active']
    search_fields = ['codigo', 'nombre']


class ProyectoViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar Proyectos.

    Endpoints:
    - GET /proyectos/ - Lista de proyectos
    - POST /proyectos/ - Crear proyecto
    - GET /proyectos/{id}/ - Detalle
    - GET /proyectos/dashboard/ - Dashboard de proyectos
    - GET /proyectos/por_estado/ - Proyectos agrupados por estado
    """
    queryset = Proyecto.objects.select_related(
        'programa', 'sponsor', 'gerente_proyecto', 'created_by'
    ).all()
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['empresa_id', 'programa', 'estado', 'prioridad', 'tipo', 'is_active']
    search_fields = ['codigo', 'nombre', 'descripcion']
    ordering_fields = ['fecha_propuesta', 'fecha_inicio_plan', 'prioridad', 'porcentaje_avance']
    ordering = ['-created_at']

    def get_serializer_class(self):
        if self.action == 'list':
            return ProyectoListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return ProyectoCreateUpdateSerializer
        return ProyectoSerializer

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=False, methods=['get'])
    def dashboard(self, request):
        """Retorna estadísticas del dashboard de proyectos"""
        empresa_id = request.query_params.get('empresa', 1)
        queryset = self.get_queryset().filter(empresa_id=empresa_id, is_active=True)

        # Proyectos por estado
        por_estado = dict(
            queryset.values('estado').annotate(count=Count('id')).values_list('estado', 'count')
        )

        # Proyectos por prioridad
        por_prioridad = dict(
            queryset.values('prioridad').annotate(count=Count('id')).values_list('prioridad', 'count')
        )

        # Agregaciones
        stats = queryset.aggregate(
            total=Count('id'),
            avance_promedio=Avg('porcentaje_avance'),
            presupuesto_total=Sum('presupuesto_aprobado'),
            costo_total=Sum('costo_real')
        )

        # Proyectos críticos (en rojo según último seguimiento)
        criticos = SeguimientoProyecto.objects.filter(
            proyecto__empresa_id=empresa_id,
            proyecto__is_active=True,
            estado_general='rojo'
        ).values('proyecto').distinct().count()

        return Response({
            'total_proyectos': stats['total'] or 0,
            'proyectos_por_estado': por_estado,
            'proyectos_por_prioridad': por_prioridad,
            'proyectos_criticos': criticos,
            'porcentaje_avance_promedio': round(stats['avance_promedio'] or 0, 1),
            'presupuesto_total': stats['presupuesto_total'] or 0,
            'costo_total_real': stats['costo_total'] or 0,
        })

    @action(detail=False, methods=['get'])
    def por_estado(self, request):
        """Retorna proyectos agrupados por estado"""
        empresa_id = request.query_params.get('empresa', 1)
        queryset = self.get_queryset().filter(empresa_id=empresa_id, is_active=True)

        resultado = {}
        for estado, _ in Proyecto.Estado.choices:
            proyectos = queryset.filter(estado=estado)
            resultado[estado] = ProyectoListSerializer(proyectos, many=True).data

        return Response(resultado)

    @action(detail=True, methods=['post'])
    def cambiar_estado(self, request, pk=None):
        """Cambia el estado de un proyecto"""
        proyecto = self.get_object()
        nuevo_estado = request.data.get('estado')

        if nuevo_estado not in dict(Proyecto.Estado.choices):
            return Response(
                {'detail': 'Estado inválido'},
                status=status.HTTP_400_BAD_REQUEST
            )

        proyecto.estado = nuevo_estado
        proyecto.save(update_fields=['estado', 'updated_at'])

        return Response({
            'detail': f'Estado cambiado a {proyecto.get_estado_display()}',
            'estado': proyecto.estado
        })


class ProjectCharterViewSet(viewsets.ModelViewSet):
    """ViewSet para Project Charters (Actas de Constitución)"""
    queryset = ProjectCharter.objects.select_related('proyecto', 'aprobado_por').all()
    serializer_class = ProjectCharterSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['proyecto']


class InteresadoProyectoViewSet(viewsets.ModelViewSet):
    """ViewSet para gestionar Interesados/Stakeholders"""
    queryset = InteresadoProyecto.objects.select_related('proyecto').all()
    serializer_class = InteresadoProyectoSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ['proyecto', 'nivel_interes', 'nivel_influencia', 'is_internal', 'is_active']
    search_fields = ['nombre', 'cargo_rol', 'organizacion']

    @action(detail=False, methods=['get'])
    def matriz_poder_interes(self, request):
        """Retorna datos para matriz de poder/interés"""
        proyecto_id = request.query_params.get('proyecto')
        if not proyecto_id:
            return Response(
                {'detail': 'Se requiere parámetro proyecto'},
                status=status.HTTP_400_BAD_REQUEST
            )

        interesados = self.get_queryset().filter(proyecto_id=proyecto_id, is_active=True)

        # Clasificar en cuadrantes
        cuadrantes = {
            'gestionar_cerca': [],  # Alto poder, alto interés
            'mantener_satisfecho': [],  # Alto poder, bajo interés
            'mantener_informado': [],  # Bajo poder, alto interés
            'monitorear': [],  # Bajo poder, bajo interés
        }

        for i in interesados:
            alto_interes = i.nivel_interes == 'alto'
            alta_influencia = i.nivel_influencia == 'alta'

            if alta_influencia and alto_interes:
                cuadrantes['gestionar_cerca'].append(InteresadoProyectoSerializer(i).data)
            elif alta_influencia and not alto_interes:
                cuadrantes['mantener_satisfecho'].append(InteresadoProyectoSerializer(i).data)
            elif not alta_influencia and alto_interes:
                cuadrantes['mantener_informado'].append(InteresadoProyectoSerializer(i).data)
            else:
                cuadrantes['monitorear'].append(InteresadoProyectoSerializer(i).data)

        return Response(cuadrantes)


class FaseProyectoViewSet(viewsets.ModelViewSet):
    """ViewSet para gestionar Fases del proyecto"""
    queryset = FaseProyecto.objects.select_related('proyecto').all()
    serializer_class = FaseProyectoSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['proyecto', 'is_active']
    ordering = ['orden']


class ActividadProyectoViewSet(viewsets.ModelViewSet):
    """ViewSet para gestionar Actividades/WBS"""
    queryset = ActividadProyecto.objects.select_related(
        'proyecto', 'fase', 'responsable'
    ).prefetch_related('predecesoras').all()
    serializer_class = ActividadProyectoSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['proyecto', 'fase', 'estado', 'responsable', 'is_active']
    search_fields = ['codigo_wbs', 'nombre', 'descripcion']
    ordering = ['codigo_wbs', 'prioridad']

    @action(detail=False, methods=['get'])
    def gantt(self, request):
        """Retorna datos para diagrama de Gantt"""
        proyecto_id = request.query_params.get('proyecto')
        if not proyecto_id:
            return Response(
                {'detail': 'Se requiere parámetro proyecto'},
                status=status.HTTP_400_BAD_REQUEST
            )

        actividades = self.get_queryset().filter(
            proyecto_id=proyecto_id, is_active=True
        ).order_by('fecha_inicio_plan')

        data = []
        for act in actividades:
            data.append({
                'id': act.id,
                'codigo_wbs': act.codigo_wbs,
                'nombre': act.nombre,
                'inicio': act.fecha_inicio_plan,
                'fin': act.fecha_fin_plan,
                'avance': act.porcentaje_avance,
                'responsable': act.responsable.get_full_name() if act.responsable else None,
                'predecesoras': list(act.predecesoras.values_list('id', flat=True)),
                'estado': act.estado,
            })

        return Response(data)


class RecursoProyectoViewSet(viewsets.ModelViewSet):
    """ViewSet para gestionar Recursos del proyecto"""
    queryset = RecursoProyecto.objects.select_related('proyecto', 'usuario').all()
    serializer_class = RecursoProyectoSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ['proyecto', 'tipo', 'is_active']
    search_fields = ['nombre', 'rol_proyecto']


class RiesgoProyectoViewSet(viewsets.ModelViewSet):
    """ViewSet para gestionar Riesgos del proyecto"""
    queryset = RiesgoProyecto.objects.select_related('proyecto', 'responsable').all()
    serializer_class = RiesgoProyectoSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['proyecto', 'tipo', 'probabilidad', 'impacto', 'is_materializado', 'is_active']
    search_fields = ['codigo', 'descripcion', 'causa']
    ordering = ['-impacto', '-probabilidad']

    @action(detail=False, methods=['get'])
    def matriz_riesgos(self, request):
        """Retorna datos para matriz de riesgos (probabilidad x impacto)"""
        proyecto_id = request.query_params.get('proyecto')
        if not proyecto_id:
            return Response(
                {'detail': 'Se requiere parámetro proyecto'},
                status=status.HTTP_400_BAD_REQUEST
            )

        riesgos = self.get_queryset().filter(
            proyecto_id=proyecto_id, is_active=True, is_materializado=False
        )

        # Matriz 5x5
        matriz = {}
        for prob in ['muy_baja', 'baja', 'media', 'alta', 'muy_alta']:
            matriz[prob] = {}
            for imp in ['muy_bajo', 'bajo', 'medio', 'alto', 'muy_alto']:
                riesgos_celda = riesgos.filter(probabilidad=prob, impacto=imp)
                matriz[prob][imp] = RiesgoProyectoSerializer(riesgos_celda, many=True).data

        return Response({
            'matriz': matriz,
            'total_riesgos': riesgos.count(),
            'riesgos_alto_nivel': riesgos.filter(
                probabilidad__in=['alta', 'muy_alta'],
                impacto__in=['alto', 'muy_alto']
            ).count()
        })


class SeguimientoProyectoViewSet(viewsets.ModelViewSet):
    """ViewSet para gestionar Seguimientos del proyecto"""
    queryset = SeguimientoProyecto.objects.select_related('proyecto', 'registrado_por').all()
    serializer_class = SeguimientoProyectoSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['proyecto', 'estado_general']
    ordering = ['-fecha']

    def perform_create(self, serializer):
        seguimiento = serializer.save(registrado_por=self.request.user)

        # Actualizar avance del proyecto
        proyecto = seguimiento.proyecto
        proyecto.porcentaje_avance = seguimiento.porcentaje_avance
        proyecto.costo_real = seguimiento.costo_acumulado
        proyecto.save(update_fields=['porcentaje_avance', 'costo_real', 'updated_at'])

    @action(detail=False, methods=['get'])
    def curva_s(self, request):
        """Retorna datos para curva S del proyecto"""
        proyecto_id = request.query_params.get('proyecto')
        if not proyecto_id:
            return Response(
                {'detail': 'Se requiere parámetro proyecto'},
                status=status.HTTP_400_BAD_REQUEST
            )

        seguimientos = self.get_queryset().filter(
            proyecto_id=proyecto_id
        ).order_by('fecha')

        data = []
        for s in seguimientos:
            data.append({
                'fecha': s.fecha,
                'valor_planificado': s.valor_planificado,
                'valor_ganado': s.valor_ganado,
                'costo_actual': s.costo_actual,
                'avance': s.porcentaje_avance,
                'spi': s.spi,
                'cpi': s.cpi,
            })

        return Response(data)


class LeccionAprendidaViewSet(viewsets.ModelViewSet):
    """ViewSet para gestionar Lecciones Aprendidas"""
    queryset = LeccionAprendida.objects.select_related('proyecto', 'registrado_por').all()
    serializer_class = LeccionAprendidaSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ['proyecto', 'tipo', 'is_active']
    search_fields = ['titulo', 'situacion', 'recomendacion', 'tags']

    def perform_create(self, serializer):
        serializer.save(registrado_por=self.request.user)

    @action(detail=False, methods=['get'])
    def buscar(self, request):
        """Busca lecciones aprendidas en todos los proyectos"""
        empresa_id = request.query_params.get('empresa', 1)
        query = request.query_params.get('q', '')

        lecciones = self.get_queryset().filter(
            proyecto__empresa_id=empresa_id,
            is_active=True
        )

        if query:
            lecciones = lecciones.filter(
                titulo__icontains=query
            ) | lecciones.filter(
                recomendacion__icontains=query
            ) | lecciones.filter(
                tags__icontains=query
            )

        serializer = LeccionAprendidaSerializer(lecciones[:50], many=True)
        return Response(serializer.data)


class ActaCierreViewSet(viewsets.ModelViewSet):
    """ViewSet para gestionar Actas de Cierre"""
    queryset = ActaCierre.objects.select_related('proyecto', 'aprobado_por', 'created_by').all()
    serializer_class = ActaCierreSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['proyecto', 'aprobado_por_sponsor']

    def perform_create(self, serializer):
        acta = serializer.save(created_by=self.request.user)

        # Marcar proyecto como completado
        proyecto = acta.proyecto
        proyecto.estado = Proyecto.Estado.COMPLETADO
        proyecto.fecha_fin_real = acta.fecha_cierre
        proyecto.save(update_fields=['estado', 'fecha_fin_real', 'updated_at'])
