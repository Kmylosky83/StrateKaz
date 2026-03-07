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
from django.apps import apps
from django.db.models import Count, Sum, Avg

from apps.core.mixins import StandardViewSetMixin
from apps.core.base_models.mixins import get_tenant_empresa
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


class PortafolioViewSet(StandardViewSetMixin, viewsets.ModelViewSet):
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
        empresa = get_tenant_empresa()
        serializer.save(created_by=self.request.user, empresa=empresa)


class ProgramaViewSet(StandardViewSetMixin, viewsets.ModelViewSet):
    """
    ViewSet para gestionar Programas de proyectos.
    """
    queryset = Programa.objects.select_related('portafolio', 'responsable').all()
    serializer_class = ProgramaSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ['empresa_id', 'portafolio', 'is_active']
    search_fields = ['codigo', 'nombre']

    def perform_create(self, serializer):
        empresa = get_tenant_empresa()
        serializer.save(empresa=empresa)


class ProyectoViewSet(StandardViewSetMixin, viewsets.ModelViewSet):
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
        'programa', 'sponsor', 'gerente_proyecto', 'created_by',
        'origen_cambio', 'origen_objetivo', 'origen_estrategia_tows',
        'charter',
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
        empresa = get_tenant_empresa()
        serializer.save(created_by=self.request.user, empresa=empresa)

    @action(detail=False, methods=['get'])
    def dashboard(self, request):
        """Retorna estadísticas completas del dashboard de proyectos"""
        empresa = get_tenant_empresa()
        empresa_id = request.query_params.get('empresa', empresa.id if empresa else 1)
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

        # Salud de proyectos (según último seguimiento)
        proyectos_verde = SeguimientoProyecto.objects.filter(
            proyecto__empresa_id=empresa_id,
            proyecto__is_active=True,
            estado_general='verde'
        ).values('proyecto').distinct().count()

        proyectos_amarillo = SeguimientoProyecto.objects.filter(
            proyecto__empresa_id=empresa_id,
            proyecto__is_active=True,
            estado_general='amarillo'
        ).values('proyecto').distinct().count()

        proyectos_rojo = SeguimientoProyecto.objects.filter(
            proyecto__empresa_id=empresa_id,
            proyecto__is_active=True,
            estado_general='rojo'
        ).values('proyecto').distinct().count()

        # Portafolios y programas
        portafolios_activos = Portafolio.objects.filter(
            empresa_id=empresa_id, is_active=True
        ).count()
        total_portafolios = Portafolio.objects.filter(empresa_id=empresa_id).count()

        programas_activos = Programa.objects.filter(
            empresa_id=empresa_id, is_active=True
        ).count()
        total_programas = Programa.objects.filter(empresa_id=empresa_id).count()

        # Cálculos de presupuesto
        presupuesto_total = float(stats['presupuesto_total'] or 0)
        costo_real = float(stats['costo_total'] or 0)
        presupuesto_disponible = presupuesto_total - costo_real
        porcentaje_ejecucion = round((costo_real / presupuesto_total * 100), 1) if presupuesto_total > 0 else 0

        return Response({
            # Totales generales
            'total_proyectos': stats['total'] or 0,
            'progreso_promedio': round(stats['avance_promedio'] or 0, 1),

            # Por estado
            'propuestos': por_estado.get('propuesto', 0),
            'en_iniciacion': por_estado.get('iniciacion', 0),
            'en_planificacion': por_estado.get('planificacion', 0),
            'en_ejecucion': por_estado.get('ejecucion', 0),
            'en_monitoreo': por_estado.get('monitoreo', 0),
            'en_cierre': por_estado.get('cierre', 0),
            'completados': por_estado.get('completado', 0),
            'cancelados': por_estado.get('cancelado', 0),
            'proyectos_por_estado': por_estado,

            # Salud del portafolio
            'proyectos_verde': proyectos_verde,
            'proyectos_amarillo': proyectos_amarillo,
            'proyectos_rojo': proyectos_rojo,
            'proyectos_atrasados': 0,  # TODO: Calcular basado en fechas

            # Por prioridad
            'criticos': proyectos_rojo,
            'alta_prioridad': por_prioridad.get('alta', 0),
            'media_prioridad': por_prioridad.get('media', 0),
            'baja_prioridad': por_prioridad.get('baja', 0),
            'proyectos_por_prioridad': por_prioridad,

            # Presupuesto
            'presupuesto_total': presupuesto_total,
            'presupuesto_ejecutado': costo_real,
            'presupuesto_disponible': presupuesto_disponible,
            'porcentaje_ejecucion': porcentaje_ejecucion,

            # Portafolios y programas
            'portafolios_activos': portafolios_activos,
            'total_portafolios': total_portafolios,
            'programas_activos': programas_activos,
            'total_programas': total_programas,
        })

    @action(detail=False, methods=['get'], url_path='por-estado')
    def por_estado(self, request):
        """Retorna proyectos agrupados por estado"""
        empresa = get_tenant_empresa(auto_create=False)
        queryset = self.get_queryset().filter(is_active=True)
        if empresa:
            queryset = queryset.filter(empresa_id=empresa.id)

        resultado = {}
        for estado, _ in Proyecto.Estado.choices:
            proyectos = queryset.filter(estado=estado)
            resultado[estado] = ProyectoListSerializer(proyectos, many=True).data

        return Response(resultado)

    @action(detail=True, methods=['post'], url_path='cambiar-estado')
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

    @action(detail=False, methods=['post'], url_path='crear-desde-cambio')
    def crear_desde_cambio(self, request):
        """
        Crea un proyecto a partir de un registro de Gestión de Cambios.
        Mapea automáticamente los campos del cambio al proyecto.
        """
        from apps.gestion_estrategica.planeacion.models import GestionCambio

        cambio_id = request.data.get('cambio_id')
        if not cambio_id:
            return Response(
                {'detail': 'Se requiere cambio_id'},
                status=status.HTTP_400_BAD_REQUEST
            )

        from apps.core.base_models.mixins import get_tenant_empresa

        try:
            cambio = GestionCambio.objects.get(id=cambio_id)
        except GestionCambio.DoesNotExist:
            return Response(
                {'detail': 'Cambio no encontrado'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Verificar si ya existe un proyecto generado desde este cambio
        if Proyecto.objects.filter(origen_cambio=cambio).exists():
            return Response(
                {'detail': 'Ya existe un proyecto generado desde este cambio'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Mapear prioridad del cambio a prioridad del proyecto
        prioridad_map = {
            'CRITICA': 'alta',
            'ALTA': 'alta',
            'MEDIA': 'media',
            'BAJA': 'baja',
        }

        # Mapear tipo de cambio a tipo de proyecto
        tipo_map = {
            'ESTRATEGICO': 'mejora',
            'ORGANIZACIONAL': 'mejora',
            'PROCESO': 'mejora',
            'TECNOLOGICO': 'desarrollo',
            'CULTURAL': 'mejora',
            'NORMATIVO': 'normativo',
            'OTRO': 'otro',
        }

        # Generar código del proyecto
        empresa = get_tenant_empresa()
        count = Proyecto.objects.count() + 1
        codigo = f"PRY-{count:04d}"

        # Crear el proyecto
        proyecto = Proyecto.objects.create(
            empresa=empresa,
            codigo=codigo,
            nombre=f"Proyecto: {cambio.titulo}",
            descripcion=cambio.descripcion or '',
            justificacion=cambio.justificacion or '',
            tipo=tipo_map.get(cambio.tipo_cambio_interno, 'mejora'),
            prioridad=prioridad_map.get(cambio.prioridad, 'media'),
            tipo_origen=Proyecto.OrigenProyecto.CAMBIO,
            origen_cambio=cambio,
            gerente_proyecto=cambio.responsible,
            created_by=request.user,
        )

        # Vincular objetivos estratégicos si existen
        if cambio.related_objectives.exists():
            primer_objetivo = cambio.related_objectives.first()
            proyecto.origen_objetivo = primer_objetivo
            proyecto.save(update_fields=['origen_objetivo'])

        return Response({
            'detail': f'Proyecto {codigo} creado exitosamente desde cambio',
            'proyecto': ProyectoSerializer(proyecto).data
        }, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['post'], url_path='crear-desde-estrategia-tows')
    def crear_desde_estrategia_tows(self, request):
        """
        Crea un proyecto a partir de una Estrategia TOWS.
        Mapea automáticamente la estrategia al proyecto.
        """
        from apps.core.base_models.mixins import get_tenant_empresa

        estrategia_id = request.data.get('estrategia_id')
        if not estrategia_id:
            return Response(
                {'detail': 'Se requiere estrategia_id'},
                status=status.HTTP_400_BAD_REQUEST
            )

        EstrategiaTOWS = apps.get_model('gestion_estrategica_contexto', 'EstrategiaTOWS')

        try:
            estrategia = EstrategiaTOWS.objects.get(id=estrategia_id)
        except EstrategiaTOWS.DoesNotExist:
            return Response(
                {'detail': 'Estrategia TOWS no encontrada'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Verificar si ya existe un proyecto generado desde esta estrategia
        if Proyecto.objects.filter(origen_estrategia_tows=estrategia).exists():
            return Response(
                {'detail': 'Ya existe un proyecto generado desde esta estrategia TOWS'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Mapear tipo TOWS a tipo de proyecto
        tipo_map = {
            'FO': 'desarrollo',     # Fortalezas-Oportunidades → Desarrollo
            'FA': 'mejora',         # Fortalezas-Amenazas → Mejora defensiva
            'DO': 'mejora',         # Debilidades-Oportunidades → Mejora correctiva
            'DA': 'normativo',      # Debilidades-Amenazas → Supervivencia
        }

        empresa = get_tenant_empresa()
        count = Proyecto.objects.count() + 1
        codigo = f"PRY-{count:04d}"

        tipo_tows = getattr(estrategia, 'tipo', 'FO')
        proyecto = Proyecto.objects.create(
            empresa=empresa,
            codigo=codigo,
            nombre=f"Proyecto TOWS ({tipo_tows}): {estrategia.descripcion[:80]}",
            descripcion=estrategia.objetivo or estrategia.descripcion or '',
            justificacion=f"Originado desde estrategia TOWS tipo {tipo_tows}",
            tipo=tipo_map.get(tipo_tows, 'mejora'),
            prioridad='media',
            tipo_origen=Proyecto.OrigenProyecto.ESTRATEGIA_TOWS,
            origen_estrategia_tows=estrategia,
            created_by=request.user,
        )

        return Response({
            'detail': f'Proyecto {codigo} creado exitosamente desde estrategia TOWS',
            'proyecto': ProyectoSerializer(proyecto).data
        }, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['get'], url_path='origenes-choices')
    def origenes_choices(self, request):
        """Retorna las opciones de origen de proyectos"""
        return Response({
            'tipo_origen': [
                {'value': choice[0], 'label': choice[1]}
                for choice in Proyecto.OrigenProyecto.choices
            ]
        })


class ProjectCharterViewSet(viewsets.ModelViewSet):
    """ViewSet para Project Charters (Actas de Constitución).
    No usa StandardViewSetMixin porque ProjectCharter no tiene is_active.
    """
    queryset = ProjectCharter.objects.select_related('proyecto', 'aprobado_por').all()
    serializer_class = ProjectCharterSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['proyecto']

    @action(detail=True, methods=['post'], url_path='aprobar')
    def aprobar(self, request, pk=None):
        """Aprueba el charter con fecha y observaciones"""
        charter = self.get_object()
        from django.utils import timezone

        charter.fecha_aprobacion = request.data.get(
            'fecha_aprobacion', timezone.now().date()
        )
        charter.aprobado_por = request.user
        charter.observaciones_aprobacion = request.data.get(
            'observaciones_aprobacion', ''
        )
        charter.save(update_fields=[
            'fecha_aprobacion', 'aprobado_por', 'observaciones_aprobacion'
        ])
        return Response(ProjectCharterSerializer(charter).data)


class InteresadoProyectoViewSet(StandardViewSetMixin, viewsets.ModelViewSet):
    """ViewSet para gestionar Interesados/Stakeholders"""
    queryset = InteresadoProyecto.objects.select_related('proyecto').all()
    serializer_class = InteresadoProyectoSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ['proyecto', 'nivel_interes', 'nivel_influencia', 'is_internal', 'is_active']
    search_fields = ['nombre', 'cargo_rol', 'organizacion']

    @action(detail=False, methods=['post'], url_path='importar-desde-contexto')
    def importar_desde_contexto(self, request):
        """Importa ParteInteresada (Contexto §4.2) como InteresadoProyecto.
        Payload: { proyecto_id: int, partes_interesadas_ids: int[] }
        """
        proyecto_id = request.data.get('proyecto_id')
        pi_ids = request.data.get('partes_interesadas_ids', [])

        if not proyecto_id or not pi_ids:
            return Response(
                {'detail': 'Se requieren proyecto_id y partes_interesadas_ids'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            proyecto = Proyecto.objects.get(pk=proyecto_id)
        except Proyecto.DoesNotExist:
            return Response(
                {'detail': 'Proyecto no encontrado'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Cross-module: apps.get_model (NO FK directo)
        ParteInteresada = apps.get_model('gestion_estrategica_contexto', 'ParteInteresada')
        partes = ParteInteresada.objects.filter(
            id__in=pi_ids, is_active=True
        ).select_related('tipo')

        creados = []
        for pi in partes:
            # Evitar duplicados por origen
            if InteresadoProyecto.objects.filter(
                proyecto=proyecto,
                origen_parte_interesada_id=pi.id
            ).exists():
                continue

            # Mapear categoría → is_internal
            is_internal = True
            if hasattr(pi, 'tipo') and pi.tipo:
                is_internal = getattr(pi.tipo, 'categoria', 'interna') == 'interna'

            # Contacto: combinar email + teléfono
            contacto_parts = []
            if getattr(pi, 'email', ''):
                contacto_parts.append(pi.email)
            if getattr(pi, 'telefono', ''):
                contacto_parts.append(pi.telefono)

            interesado = InteresadoProyecto.objects.create(
                proyecto=proyecto,
                nombre=pi.nombre,
                cargo_rol=getattr(pi, 'cargo_representante', '') or '',
                organizacion=(
                    pi.tipo.grupo.nombre if hasattr(pi, 'tipo')
                    and pi.tipo and hasattr(pi.tipo, 'grupo')
                    and pi.tipo.grupo else ''
                ),
                contacto=', '.join(contacto_parts),
                nivel_interes=getattr(pi, 'nivel_interes', 'medio'),
                nivel_influencia=getattr(pi, 'nivel_influencia_pi', 'media'),
                requisitos=getattr(pi, 'requisitos_pertinentes', '') or '',
                estrategia_gestion=getattr(pi, 'temas_interes_pi', '') or '',
                is_internal=is_internal,
                origen_parte_interesada_id=pi.id,
            )
            creados.append(interesado)

        return Response({
            'importados': len(creados),
            'interesados': InteresadoProyectoSerializer(creados, many=True).data,
        }, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['get'], url_path='matriz-poder-interes')
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


class FaseProyectoViewSet(StandardViewSetMixin, viewsets.ModelViewSet):
    """ViewSet para gestionar Fases del proyecto"""
    queryset = FaseProyecto.objects.select_related('proyecto').all()
    serializer_class = FaseProyectoSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['proyecto', 'is_active']
    ordering = ['orden']


class ActividadProyectoViewSet(StandardViewSetMixin, viewsets.ModelViewSet):
    """ViewSet para gestionar Actividades/WBS"""
    queryset = ActividadProyecto.objects.select_related(
        'proyecto', 'fase', 'responsable'
    ).prefetch_related('predecesoras').all()
    serializer_class = ActividadProyectoSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['proyecto', 'fase', 'estado', 'responsable', 'is_active', 'kanban_column']
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

    @action(detail=False, methods=['get'], url_path='kanban')
    def kanban_view(self, request):
        """Retorna actividades para vista Kanban, agrupadas por columna."""
        proyecto_id = request.query_params.get('proyecto_id')
        if not proyecto_id:
            return Response(
                {'error': 'Se requiere el parámetro proyecto_id'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        qs = (
            self.get_queryset()
            .filter(proyecto_id=proyecto_id, is_active=True)
            .order_by('kanban_order')
        )
        serializer = self.get_serializer(qs, many=True)

        # Agrupar por columna
        columns = {}
        for item in serializer.data:
            col = item.get('kanban_column', 'backlog')
            if col not in columns:
                columns[col] = []
            columns[col].append(item)

        return Response({
            'columns': columns,
            'column_order': ['backlog', 'todo', 'in_progress', 'review', 'done'],
            'column_labels': {
                'backlog': 'Backlog',
                'todo': 'Por Hacer',
                'in_progress': 'En Progreso',
                'review': 'En Revisión',
                'done': 'Completado',
            },
        })

    @action(detail=False, methods=['post'], url_path='reorder')
    def reorder(self, request):
        """Reordena actividades dentro del tablero Kanban (columna y posición)."""
        items = request.data.get('items', [])
        if not items:
            return Response(
                {'error': 'Se requiere el parámetro items'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        valid_columns = {'backlog', 'todo', 'in_progress', 'review', 'done'}
        for item in items:
            if item.get('kanban_column') not in valid_columns:
                return Response(
                    {'error': f"Columna inválida: {item.get('kanban_column')}"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            ActividadProyecto.objects.filter(
                id=item['id'],
                is_active=True,
            ).update(
                kanban_column=item['kanban_column'],
                kanban_order=item['kanban_order'],
            )

        return Response({'status': 'ok'})


class RecursoProyectoViewSet(StandardViewSetMixin, viewsets.ModelViewSet):
    """ViewSet para gestionar Recursos del proyecto"""
    queryset = RecursoProyecto.objects.select_related('proyecto', 'usuario').all()
    serializer_class = RecursoProyectoSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ['proyecto', 'tipo', 'is_active']
    search_fields = ['nombre', 'rol_proyecto']


class RiesgoProyectoViewSet(StandardViewSetMixin, viewsets.ModelViewSet):
    """ViewSet para gestionar Riesgos del proyecto"""
    queryset = RiesgoProyecto.objects.select_related('proyecto', 'responsable').all()
    serializer_class = RiesgoProyectoSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['proyecto', 'tipo', 'probabilidad', 'impacto', 'is_materializado', 'is_active']
    search_fields = ['codigo', 'descripcion', 'causa']
    ordering = ['-impacto', '-probabilidad']

    @action(detail=False, methods=['get'], url_path='matriz-riesgos')
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
    """ViewSet para gestionar Seguimientos del proyecto.
    No usa StandardViewSetMixin porque SeguimientoProyecto no tiene is_active.
    """
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

    @action(detail=False, methods=['get'], url_path='curva-s')
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


class LeccionAprendidaViewSet(StandardViewSetMixin, viewsets.ModelViewSet):
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
        empresa = get_tenant_empresa(auto_create=False)
        query = request.query_params.get('q', '')

        lecciones = self.get_queryset().filter(is_active=True)
        if empresa:
            lecciones = lecciones.filter(proyecto__empresa_id=empresa.id)

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
    """ViewSet para gestionar Actas de Cierre.
    No usa StandardViewSetMixin porque ActaCierre no tiene is_active.
    """
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
