"""
Views para Accidentalidad (ATEL) - HSEQ Management
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.shortcuts import get_object_or_404
from django.utils import timezone
from datetime import date, timedelta
from apps.core.mixins import ExportMixin

from .models import (
    AccidenteTrabajo,
    EnfermedadLaboral,
    IncidenteTrabajo,
    InvestigacionATEL,
    CausaRaiz,
    LeccionAprendida,
    PlanAccionATEL,
    AccionPlan
)
from .serializers import (
    AccidenteTrabajoSerializer,
    AccidenteTrabajoListSerializer,
    EnfermedadLaboralSerializer,
    IncidenteTrabajoSerializer,
    InvestigacionATELSerializer,
    InvestigacionATELListSerializer,
    CausaRaizSerializer,
    LeccionAprendidaSerializer,
    PlanAccionATELSerializer,
    PlanAccionATELListSerializer,
    AccionPlanSerializer
)


class AccidenteTrabajoViewSet(ExportMixin, viewsets.ModelViewSet):
    """
    ViewSet para Accidentes de Trabajo

    Incluye actions:
    - iniciar_investigacion: Crea una investigación para el accidente
    - estadisticas: Muestra estadísticas de accidentalidad
    """
    permission_classes = [IsAuthenticated]
    export_fields = [('fecha_evento', 'Fecha'), ('tipo_evento', 'Tipo Evento'), ('gravedad', 'Gravedad'), ('dias_incapacidad', 'Días Incapacidad'), ('mortal', 'Mortal'), ('reportado_arl', 'Reportado ARL')]
    export_filename = 'accidentes_trabajo'
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['gravedad', 'mortal', 'reportado_arl', 'requiere_investigacion']
    ordering_fields = ['fecha_evento', 'dias_incapacidad', 'fecha_reporte_interno']
    ordering = ['-fecha_evento']

    def get_queryset(self):
        empresa_id = self.request.headers.get('X-Empresa-ID')
        if not empresa_id:
            return AccidenteTrabajo.objects.none()

        queryset = AccidenteTrabajo.objects.filter(empresa_id=empresa_id).select_related(
            'trabajador',
            'reportado_por',
            'actualizado_por'
        )

        # Filtros adicionales
        fecha_desde = self.request.query_params.get('fecha_desde')
        fecha_hasta = self.request.query_params.get('fecha_hasta')

        if fecha_desde:
            queryset = queryset.filter(fecha_evento__gte=fecha_desde)
        if fecha_hasta:
            queryset = queryset.filter(fecha_evento__lte=fecha_hasta)

        return queryset

    def get_serializer_class(self):
        if self.action == 'list':
            return AccidenteTrabajoListSerializer
        return AccidenteTrabajoSerializer

    def perform_create(self, serializer):
        empresa_id = self.request.headers.get('X-Empresa-ID')
        serializer.save(
            empresa_id=empresa_id,
            reportado_por=self.request.user
        )

    def perform_update(self, serializer):
        serializer.save(actualizado_por=self.request.user)

    @action(detail=True, methods=['post'])
    def iniciar_investigacion(self, request, pk=None):
        """
        Iniciar investigación de accidente de trabajo

        Payload:
        {
            "lider_investigacion": <user_id>,
            "metodologia": "ARBOL_CAUSAS",
            "fecha_limite": "2025-01-31",
            "descripcion_hechos": "Descripción detallada"
        }
        """
        accidente = self.get_object()

        # Verificar que no tenga ya una investigación
        if hasattr(accidente, 'investigacion'):
            return Response(
                {'error': 'Este accidente ya tiene una investigación asociada'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Crear investigación
        empresa_id = request.headers.get('X-Empresa-ID')

        investigacion = InvestigacionATEL.objects.create(
            empresa_id=empresa_id,
            accidente_trabajo=accidente,
            lider_investigacion_id=request.data.get('lider_investigacion'),
            metodologia=request.data.get('metodologia', 'ARBOL_CAUSAS'),
            fecha_inicio=date.today(),
            fecha_limite=request.data.get('fecha_limite'),
            descripcion_hechos=request.data.get('descripcion_hechos', ''),
            estado='INICIADA',
            creado_por=request.user
        )

        serializer = InvestigacionATELSerializer(investigacion)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['get'])
    def estadisticas(self, request):
        """
        Estadísticas de accidentalidad

        Query params:
        - fecha_desde: Fecha inicio del período
        - fecha_hasta: Fecha fin del período
        - periodo: 'mes', 'trimestre', 'semestre', 'ano' (default: 'ano')
        """
        empresa_id = request.headers.get('X-Empresa-ID')
        periodo = request.query_params.get('periodo', 'ano')

        # Calcular fechas según período
        fecha_hasta = date.today()
        if periodo == 'mes':
            fecha_desde = fecha_hasta - timedelta(days=30)
        elif periodo == 'trimestre':
            fecha_desde = fecha_hasta - timedelta(days=90)
        elif periodo == 'semestre':
            fecha_desde = fecha_hasta - timedelta(days=180)
        else:  # año
            fecha_desde = fecha_hasta - timedelta(days=365)

        # Permitir override con query params
        fecha_desde = request.query_params.get('fecha_desde', fecha_desde)
        fecha_hasta = request.query_params.get('fecha_hasta', fecha_hasta)

        queryset = AccidenteTrabajo.objects.filter(
            empresa_id=empresa_id,
            fecha_evento__gte=fecha_desde,
            fecha_evento__lte=fecha_hasta
        )

        total_accidentes = queryset.count()
        accidentes_leves = queryset.filter(gravedad='LEVE').count()
        accidentes_moderados = queryset.filter(gravedad='MODERADO').count()
        accidentes_graves = queryset.filter(gravedad='GRAVE').count()
        accidentes_mortales = queryset.filter(mortal=True).count()

        total_dias_incapacidad = sum(queryset.values_list('dias_incapacidad', flat=True))

        # Por tipo de evento
        por_tipo_evento = {}
        for tipo, _ in AccidenteTrabajo.TIPO_EVENTO_CHOICES:
            por_tipo_evento[tipo] = queryset.filter(tipo_evento=tipo).count()

        # Por parte del cuerpo
        por_parte_cuerpo = {}
        for parte, _ in AccidenteTrabajo.PARTE_CUERPO_CHOICES:
            count = queryset.filter(parte_cuerpo=parte).count()
            if count > 0:
                por_parte_cuerpo[parte] = count

        return Response({
            'periodo': {
                'fecha_desde': fecha_desde,
                'fecha_hasta': fecha_hasta,
                'tipo': periodo
            },
            'resumen': {
                'total_accidentes': total_accidentes,
                'total_dias_incapacidad': total_dias_incapacidad,
                'accidentes_mortales': accidentes_mortales,
            },
            'por_gravedad': {
                'leves': accidentes_leves,
                'moderados': accidentes_moderados,
                'graves': accidentes_graves,
                'mortales': accidentes_mortales,
            },
            'por_tipo_evento': por_tipo_evento,
            'por_parte_cuerpo': por_parte_cuerpo,
        })


class EnfermedadLaboralViewSet(viewsets.ModelViewSet):
    """
    ViewSet para Enfermedades Laborales
    """
    serializer_class = EnfermedadLaboralSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['tipo_enfermedad', 'estado_calificacion', 'reportado_arl']
    ordering_fields = ['fecha_diagnostico', 'fecha_calificacion']
    ordering = ['-fecha_diagnostico']

    def get_queryset(self):
        empresa_id = self.request.headers.get('X-Empresa-ID')
        if not empresa_id:
            return EnfermedadLaboral.objects.none()

        return EnfermedadLaboral.objects.filter(empresa_id=empresa_id).select_related(
            'trabajador',
            'reportado_por'
        )

    def perform_create(self, serializer):
        empresa_id = self.request.headers.get('X-Empresa-ID')
        serializer.save(
            empresa_id=empresa_id,
            reportado_por=self.request.user
        )

    def perform_update(self, serializer):
        serializer.save(actualizado_por=self.request.user)

    @action(detail=True, methods=['post'])
    def iniciar_investigacion(self, request, pk=None):
        """Iniciar investigación de enfermedad laboral"""
        enfermedad = self.get_object()

        if hasattr(enfermedad, 'investigacion'):
            return Response(
                {'error': 'Esta enfermedad ya tiene una investigación asociada'},
                status=status.HTTP_400_BAD_REQUEST
            )

        empresa_id = request.headers.get('X-Empresa-ID')

        investigacion = InvestigacionATEL.objects.create(
            empresa_id=empresa_id,
            enfermedad_laboral=enfermedad,
            lider_investigacion_id=request.data.get('lider_investigacion'),
            metodologia=request.data.get('metodologia', 'ISHIKAWA'),
            fecha_inicio=date.today(),
            fecha_limite=request.data.get('fecha_limite'),
            descripcion_hechos=request.data.get('descripcion_hechos', ''),
            estado='INICIADA',
            creado_por=request.user
        )

        serializer = InvestigacionATELSerializer(investigacion)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class IncidenteTrabajoViewSet(viewsets.ModelViewSet):
    """
    ViewSet para Incidentes de Trabajo
    """
    serializer_class = IncidenteTrabajoSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['tipo_incidente', 'potencial_gravedad', 'hubo_danos_materiales']
    ordering_fields = ['fecha_evento', 'costo_estimado']
    ordering = ['-fecha_evento']

    def get_queryset(self):
        empresa_id = self.request.headers.get('X-Empresa-ID')
        if not empresa_id:
            return IncidenteTrabajo.objects.none()

        return IncidenteTrabajo.objects.filter(empresa_id=empresa_id).select_related(
            'reportado_por'
        )

    def perform_create(self, serializer):
        empresa_id = self.request.headers.get('X-Empresa-ID')
        serializer.save(
            empresa_id=empresa_id,
            reportado_por=self.request.user
        )

    def perform_update(self, serializer):
        serializer.save(actualizado_por=self.request.user)

    @action(detail=True, methods=['post'])
    def iniciar_investigacion(self, request, pk=None):
        """Iniciar investigación de incidente"""
        incidente = self.get_object()

        if hasattr(incidente, 'investigacion'):
            return Response(
                {'error': 'Este incidente ya tiene una investigación asociada'},
                status=status.HTTP_400_BAD_REQUEST
            )

        empresa_id = request.headers.get('X-Empresa-ID')

        investigacion = InvestigacionATEL.objects.create(
            empresa_id=empresa_id,
            incidente_trabajo=incidente,
            lider_investigacion_id=request.data.get('lider_investigacion'),
            metodologia=request.data.get('metodologia', 'CINCO_PORQUES'),
            fecha_inicio=date.today(),
            fecha_limite=request.data.get('fecha_limite'),
            descripcion_hechos=request.data.get('descripcion_hechos', ''),
            estado='INICIADA',
            creado_por=request.user
        )

        serializer = InvestigacionATELSerializer(investigacion)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class InvestigacionATELViewSet(viewsets.ModelViewSet):
    """
    ViewSet para Investigaciones ATEL

    Actions:
    - completar_investigacion: Marca la investigación como completada
    - cerrar_investigacion: Cierra la investigación (con aprobación)
    - agregar_causas: Agrega causas raíz a la investigación
    """
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['estado', 'metodologia', 'aprobada']
    ordering_fields = ['fecha_inicio', 'fecha_limite', 'fecha_completada']
    ordering = ['-fecha_inicio']

    def get_queryset(self):
        empresa_id = self.request.headers.get('X-Empresa-ID')
        if not empresa_id:
            return InvestigacionATEL.objects.none()

        queryset = InvestigacionATEL.objects.filter(empresa_id=empresa_id).select_related(
            'lider_investigacion',
            'accidente_trabajo',
            'enfermedad_laboral',
            'incidente_trabajo',
            'creado_por',
            'aprobada_por'
        ).prefetch_related(
            'equipo_investigacion',
            'causas_raiz',
            'planes_accion',
            'lecciones_aprendidas'
        )

        return queryset

    def get_serializer_class(self):
        if self.action == 'list':
            return InvestigacionATELListSerializer
        return InvestigacionATELSerializer

    def perform_create(self, serializer):
        empresa_id = self.request.headers.get('X-Empresa-ID')
        serializer.save(
            empresa_id=empresa_id,
            creado_por=self.request.user
        )

    def perform_update(self, serializer):
        serializer.save(actualizado_por=self.request.user)

    @action(detail=True, methods=['post'])
    def completar_investigacion(self, request, pk=None):
        """
        Completar investigación

        Payload:
        {
            "conclusiones": "Conclusiones de la investigación",
            "recomendaciones": "Recomendaciones"
        }
        """
        investigacion = self.get_object()

        if investigacion.estado == 'COMPLETADA':
            return Response(
                {'error': 'La investigación ya está completada'},
                status=status.HTTP_400_BAD_REQUEST
            )

        investigacion.estado = 'COMPLETADA'
        investigacion.fecha_completada = date.today()
        investigacion.conclusiones = request.data.get('conclusiones', '')
        investigacion.recomendaciones = request.data.get('recomendaciones', '')
        investigacion.actualizado_por = request.user
        investigacion.save()

        serializer = self.get_serializer(investigacion)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def cerrar_investigacion(self, request, pk=None):
        """
        Cerrar investigación con aprobación

        Solo si está completada
        """
        investigacion = self.get_object()

        if investigacion.estado != 'COMPLETADA':
            return Response(
                {'error': 'Solo se pueden cerrar investigaciones completadas'},
                status=status.HTTP_400_BAD_REQUEST
            )

        investigacion.estado = 'CERRADA'
        investigacion.aprobada = True
        investigacion.aprobada_por = request.user
        investigacion.fecha_aprobacion = date.today()
        investigacion.save()

        serializer = self.get_serializer(investigacion)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def agregar_causas(self, request, pk=None):
        """
        Agregar causas raíz a la investigación

        Payload:
        {
            "causas": [
                {
                    "tipo_causa": "INMEDIATA_ACTO",
                    "descripcion": "Descripción",
                    "evidencia": "Evidencia",
                    "prioridad": 1
                }
            ]
        }
        """
        investigacion = self.get_object()
        empresa_id = request.headers.get('X-Empresa-ID')

        causas_data = request.data.get('causas', [])
        causas_creadas = []

        for causa_data in causas_data:
            causa = CausaRaiz.objects.create(
                empresa_id=empresa_id,
                investigacion=investigacion,
                tipo_causa=causa_data.get('tipo_causa'),
                descripcion=causa_data.get('descripcion'),
                evidencia=causa_data.get('evidencia', ''),
                prioridad=causa_data.get('prioridad', 1),
                creado_por=request.user
            )
            causas_creadas.append(causa)

        serializer = CausaRaizSerializer(causas_creadas, many=True)
        return Response({
            'message': f'{len(causas_creadas)} causas raíz agregadas',
            'causas': serializer.data
        }, status=status.HTTP_201_CREATED)


class CausaRaizViewSet(viewsets.ModelViewSet):
    """
    ViewSet para Causas Raíz
    """
    serializer_class = CausaRaizSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['investigacion', 'tipo_causa']
    ordering_fields = ['prioridad', 'fecha_creacion']
    ordering = ['prioridad']

    def get_queryset(self):
        empresa_id = self.request.headers.get('X-Empresa-ID')
        if not empresa_id:
            return CausaRaiz.objects.none()

        return CausaRaiz.objects.filter(empresa_id=empresa_id).select_related(
            'investigacion',
            'creado_por'
        )

    def perform_create(self, serializer):
        empresa_id = self.request.headers.get('X-Empresa-ID')
        serializer.save(
            empresa_id=empresa_id,
            creado_por=self.request.user
        )


class LeccionAprendidaViewSet(viewsets.ModelViewSet):
    """
    ViewSet para Lecciones Aprendidas

    Actions:
    - divulgar_leccion: Marca la lección como divulgada
    """
    serializer_class = LeccionAprendidaSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['categoria', 'estado_divulgacion', 'investigacion']
    ordering_fields = ['fecha_creacion', 'fecha_divulgacion']
    ordering = ['-fecha_creacion']

    def get_queryset(self):
        empresa_id = self.request.headers.get('X-Empresa-ID')
        if not empresa_id:
            return LeccionAprendida.objects.none()

        return LeccionAprendida.objects.filter(empresa_id=empresa_id).select_related(
            'investigacion',
            'creado_por',
            'divulgado_por'
        )

    def perform_create(self, serializer):
        empresa_id = self.request.headers.get('X-Empresa-ID')
        serializer.save(
            empresa_id=empresa_id,
            creado_por=self.request.user
        )

    def perform_update(self, serializer):
        serializer.save(actualizado_por=self.request.user)

    @action(detail=True, methods=['post'])
    def divulgar_leccion(self, request, pk=None):
        """
        Marcar lección como divulgada

        Payload:
        {
            "fecha_divulgacion": "2025-12-23",
            "metodo_divulgacion": "Charla de seguridad",
            "personas_divulgadas": "Todo el personal operativo",
            "evidencia_divulgacion": "Listado de asistencia adjunto"
        }
        """
        leccion = self.get_object()

        if leccion.estado_divulgacion == 'DIVULGADA':
            return Response(
                {'warning': 'Esta lección ya fue divulgada anteriormente'},
                status=status.HTTP_200_OK
            )

        leccion.estado_divulgacion = 'DIVULGADA'
        leccion.fecha_divulgacion = request.data.get('fecha_divulgacion', date.today())
        leccion.metodo_divulgacion = request.data.get('metodo_divulgacion', '')
        leccion.personas_divulgadas = request.data.get('personas_divulgadas', '')
        leccion.evidencia_divulgacion = request.data.get('evidencia_divulgacion', '')
        leccion.divulgado_por = request.user
        leccion.save()

        serializer = self.get_serializer(leccion)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def pendientes_divulgacion(self, request):
        """Listar lecciones pendientes de divulgación"""
        empresa_id = request.headers.get('X-Empresa-ID')

        lecciones = LeccionAprendida.objects.filter(
            empresa_id=empresa_id,
            estado_divulgacion__in=['PENDIENTE', 'PROGRAMADA']
        ).select_related('investigacion', 'creado_por')

        serializer = self.get_serializer(lecciones, many=True)
        return Response(serializer.data)


class PlanAccionATELViewSet(viewsets.ModelViewSet):
    """
    ViewSet para Planes de Acción ATEL

    Actions:
    - iniciar_ejecucion: Inicia la ejecución del plan
    - verificar_plan: Verifica el plan completado
    """
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['estado', 'investigacion', 'responsable', 'verificado']
    ordering_fields = ['fecha_inicio', 'fecha_compromiso', 'porcentaje_avance']
    ordering = ['-fecha_creacion']

    def get_queryset(self):
        empresa_id = self.request.headers.get('X-Empresa-ID')
        if not empresa_id:
            return PlanAccionATEL.objects.none()

        return PlanAccionATEL.objects.filter(empresa_id=empresa_id).select_related(
            'investigacion',
            'responsable',
            'creado_por',
            'verificado_por'
        ).prefetch_related('acciones')

    def get_serializer_class(self):
        if self.action == 'list':
            return PlanAccionATELListSerializer
        return PlanAccionATELSerializer

    def perform_create(self, serializer):
        empresa_id = self.request.headers.get('X-Empresa-ID')
        serializer.save(
            empresa_id=empresa_id,
            creado_por=self.request.user
        )

    def perform_update(self, serializer):
        serializer.save(actualizado_por=self.request.user)

    @action(detail=True, methods=['post'])
    def iniciar_ejecucion(self, request, pk=None):
        """Iniciar la ejecución del plan"""
        plan = self.get_object()

        if plan.estado != 'PLANIFICADO':
            return Response(
                {'error': 'Solo se pueden iniciar planes en estado PLANIFICADO'},
                status=status.HTTP_400_BAD_REQUEST
            )

        plan.estado = 'EN_EJECUCION'
        plan.save()

        serializer = self.get_serializer(plan)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def verificar_plan(self, request, pk=None):
        """
        Verificar plan completado

        Payload:
        {
            "efectividad": "Descripción de efectividad"
        }
        """
        plan = self.get_object()

        if plan.estado != 'COMPLETADO':
            return Response(
                {'error': 'Solo se pueden verificar planes completados'},
                status=status.HTTP_400_BAD_REQUEST
            )

        plan.estado = 'VERIFICADO'
        plan.verificado = True
        plan.verificado_por = request.user
        plan.fecha_verificacion = date.today()
        plan.efectividad = request.data.get('efectividad', '')
        plan.save()

        serializer = self.get_serializer(plan)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def vencidos(self, request):
        """Listar planes vencidos"""
        empresa_id = request.headers.get('X-Empresa-ID')

        planes = PlanAccionATEL.objects.filter(
            empresa_id=empresa_id,
            estado__in=['PLANIFICADO', 'EN_EJECUCION'],
            fecha_compromiso__lt=date.today()
        ).select_related('investigacion', 'responsable')

        serializer = PlanAccionATELListSerializer(planes, many=True)
        return Response(serializer.data)


class AccionPlanViewSet(viewsets.ModelViewSet):
    """
    ViewSet para Acciones de Plan
    """
    serializer_class = AccionPlanSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['plan_accion', 'estado', 'responsable', 'tipo_accion', 'verificado']
    ordering_fields = ['orden', 'fecha_inicio', 'fecha_compromiso']
    ordering = ['plan_accion', 'orden']

    def get_queryset(self):
        empresa_id = self.request.headers.get('X-Empresa-ID')
        if not empresa_id:
            return AccionPlan.objects.none()

        return AccionPlan.objects.filter(empresa_id=empresa_id).select_related(
            'plan_accion',
            'responsable',
            'causa_raiz',
            'creado_por',
            'verificado_por'
        )

    def perform_create(self, serializer):
        empresa_id = self.request.headers.get('X-Empresa-ID')
        serializer.save(
            empresa_id=empresa_id,
            creado_por=self.request.user
        )

    def perform_update(self, serializer):
        serializer.save(actualizado_por=self.request.user)

    @action(detail=True, methods=['post'])
    def completar_accion(self, request, pk=None):
        """
        Completar acción

        Payload:
        {
            "evidencia_implementacion": "Descripción de evidencias"
        }
        """
        accion = self.get_object()

        if accion.estado == 'COMPLETADA':
            return Response(
                {'warning': 'Esta acción ya está completada'},
                status=status.HTTP_200_OK
            )

        accion.estado = 'COMPLETADA'
        accion.fecha_completada = date.today()
        accion.evidencia_implementacion = request.data.get('evidencia_implementacion', '')
        accion.save()

        # Actualizar porcentaje del plan
        plan = accion.plan_accion
        total_acciones = plan.acciones.count()
        acciones_completadas = plan.acciones.filter(estado__in=['COMPLETADA', 'VERIFICADA']).count()
        plan.porcentaje_avance = int((acciones_completadas / total_acciones) * 100)

        if plan.porcentaje_avance == 100:
            plan.estado = 'COMPLETADO'
            plan.fecha_completado = date.today()

        plan.save()

        serializer = self.get_serializer(accion)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def verificar_accion(self, request, pk=None):
        """
        Verificar acción completada

        Payload:
        {
            "observaciones_verificacion": "Observaciones"
        }
        """
        accion = self.get_object()

        if accion.estado != 'COMPLETADA':
            return Response(
                {'error': 'Solo se pueden verificar acciones completadas'},
                status=status.HTTP_400_BAD_REQUEST
            )

        accion.estado = 'VERIFICADA'
        accion.verificado = True
        accion.verificado_por = request.user
        accion.fecha_verificacion = date.today()
        accion.observaciones_verificacion = request.data.get('observaciones_verificacion', '')
        accion.save()

        serializer = self.get_serializer(accion)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def mis_acciones(self, request):
        """Listar acciones asignadas al usuario actual"""
        empresa_id = request.headers.get('X-Empresa-ID')

        acciones = AccionPlan.objects.filter(
            empresa_id=empresa_id,
            responsable=request.user,
            estado__in=['PENDIENTE', 'EN_PROGRESO']
        ).select_related('plan_accion', 'causa_raiz').order_by('fecha_compromiso')

        serializer = self.get_serializer(acciones, many=True)
        return Response(serializer.data)
