# -*- coding: utf-8 -*-
"""
Views para Planificacion del Sistema - Gestion Estrategica

Migrado desde hseq_management.planificacion_sistema
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.db import models
from datetime import date

from .models import (
    PlanTrabajoAnual,
    ActividadPlan,
    ObjetivoSistema,
    ProgramaGestion,
    ActividadPrograma,
    SeguimientoCronograma
)
from .serializers import (
    PlanTrabajoAnualListSerializer,
    PlanTrabajoAnualDetailSerializer,
    ActividadPlanListSerializer,
    ActividadPlanDetailSerializer,
    ObjetivoSistemaListSerializer,
    ObjetivoSistemaDetailSerializer,
    ProgramaGestionListSerializer,
    ProgramaGestionDetailSerializer,
    ActividadProgramaListSerializer,
    ActividadProgramaDetailSerializer,
    SeguimientoCronogramaListSerializer,
    SeguimientoCronogramaDetailSerializer,
)


# ==================== PLAN TRABAJO ANUAL ====================

class PlanTrabajoAnualViewSet(viewsets.ModelViewSet):
    """
    ViewSet para Plan de Trabajo Anual

    Acciones especiales:
    - aprobar: Aprobar un plan de trabajo
    - cerrar: Cerrar un plan completado
    - reporte_ejecutivo: Generar reporte ejecutivo del plan
    """
    queryset = PlanTrabajoAnual.objects.all()
    permission_classes = [IsAuthenticated]
    filterset_fields = ['empresa_id', 'periodo', 'estado', 'responsable']
    search_fields = ['codigo', 'nombre']
    ordering_fields = ['periodo', 'created_at', 'fecha_inicio']
    ordering = ['-periodo']

    def get_serializer_class(self):
        if self.action in ['list']:
            return PlanTrabajoAnualListSerializer
        return PlanTrabajoAnualDetailSerializer

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=['post'])
    def aprobar(self, request, pk=None):
        """
        Aprobar un Plan de Trabajo Anual

        Cambia el estado a APROBADO y registra quien aprobo
        """
        plan = self.get_object()

        if plan.estado != 'EN_REVISION':
            return Response(
                {'error': 'Solo se pueden aprobar planes en revision'},
                status=status.HTTP_400_BAD_REQUEST
            )

        plan.estado = 'APROBADO'
        plan.aprobado_por = request.user
        plan.fecha_aprobacion = timezone.now()
        plan.save()

        serializer = self.get_serializer(plan)
        return Response({
            'message': 'Plan de Trabajo aprobado exitosamente',
            'data': serializer.data
        })

    @action(detail=True, methods=['post'])
    def iniciar_ejecucion(self, request, pk=None):
        """
        Iniciar la ejecucion de un plan aprobado
        """
        plan = self.get_object()

        if plan.estado != 'APROBADO':
            return Response(
                {'error': 'Solo se pueden ejecutar planes aprobados'},
                status=status.HTTP_400_BAD_REQUEST
            )

        plan.estado = 'EN_EJECUCION'
        plan.save()

        serializer = self.get_serializer(plan)
        return Response({
            'message': 'Ejecucion del plan iniciada',
            'data': serializer.data
        })

    @action(detail=True, methods=['post'])
    def cerrar(self, request, pk=None):
        """
        Cerrar un Plan de Trabajo completado
        """
        plan = self.get_object()

        if plan.estado != 'EN_EJECUCION':
            return Response(
                {'error': 'Solo se pueden cerrar planes en ejecucion'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Verificar que todas las actividades esten completadas o canceladas
        actividades_pendientes = plan.actividades.exclude(
            estado__in=['COMPLETADA', 'CANCELADA']
        ).count()

        if actividades_pendientes > 0:
            return Response(
                {
                    'error': f'Hay {actividades_pendientes} actividades pendientes',
                    'actividades_pendientes': actividades_pendientes
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        plan.estado = 'CERRADO'
        plan.save()

        serializer = self.get_serializer(plan)
        return Response({
            'message': 'Plan de Trabajo cerrado exitosamente',
            'data': serializer.data
        })

    @action(detail=True, methods=['get'])
    def reporte_ejecutivo(self, request, pk=None):
        """
        Generar reporte ejecutivo del plan con metricas clave
        """
        plan = self.get_object()

        # Metricas de actividades
        actividades = plan.actividades.all()
        total_actividades = actividades.count()

        actividades_por_estado = {
            'pendientes': actividades.filter(estado='PENDIENTE').count(),
            'en_proceso': actividades.filter(estado='EN_PROCESO').count(),
            'completadas': actividades.filter(estado='COMPLETADA').count(),
            'retrasadas': actividades.filter(estado='RETRASADA').count(),
            'canceladas': actividades.filter(estado='CANCELADA').count(),
        }

        # Metricas de objetivos
        objetivos = plan.objetivos.all()
        total_objetivos = objetivos.count()

        objetivos_por_estado = {
            'activos': objetivos.filter(estado='ACTIVO').count(),
            'en_seguimiento': objetivos.filter(estado='EN_SEGUIMIENTO').count(),
            'cumplidos': objetivos.filter(estado='CUMPLIDO').count(),
            'no_cumplidos': objetivos.filter(estado='NO_CUMPLIDO').count(),
        }

        # Promedio de cumplimiento de objetivos
        avg_cumplimiento = 0
        if objetivos:
            total_cumplimiento = sum(obj.porcentaje_cumplimiento for obj in objetivos)
            avg_cumplimiento = round(total_cumplimiento / total_objetivos, 2)

        # Metricas de programas
        programas = plan.programas.all()
        total_programas = programas.count()

        programas_por_estado = {
            'planificados': programas.filter(estado='PLANIFICADO').count(),
            'en_ejecucion': programas.filter(estado='EN_EJECUCION').count(),
            'completados': programas.filter(estado='COMPLETADO').count(),
        }

        # Presupuesto
        presupuesto_total = sum(
            act.presupuesto_estimado for act in actividades
            if act.presupuesto_estimado
        )
        presupuesto_ejecutado = sum(
            act.presupuesto_ejecutado for act in actividades
            if act.presupuesto_ejecutado
        )

        # Porcentaje avance general
        if total_actividades > 0:
            total_avance = sum(act.porcentaje_avance for act in actividades)
            porcentaje_avance_general = round(total_avance / total_actividades, 2)
        else:
            porcentaje_avance_general = 0

        return Response({
            'plan': {
                'codigo': plan.codigo,
                'nombre': plan.nombre,
                'periodo': plan.periodo,
                'estado': plan.estado,
            },
            'metricas_actividades': {
                'total': total_actividades,
                'por_estado': actividades_por_estado,
                'porcentaje_avance': porcentaje_avance_general,
            },
            'metricas_objetivos': {
                'total': total_objetivos,
                'por_estado': objetivos_por_estado,
                'cumplimiento_promedio': avg_cumplimiento,
            },
            'metricas_programas': {
                'total': total_programas,
                'por_estado': programas_por_estado,
            },
            'presupuesto': {
                'estimado': float(presupuesto_total),
                'ejecutado': float(presupuesto_ejecutado),
                'eficiencia': round(
                    (presupuesto_ejecutado / presupuesto_total * 100)
                    if presupuesto_total > 0 else 0,
                    2
                ),
            }
        })


# ==================== ACTIVIDAD PLAN ====================

class ActividadPlanViewSet(viewsets.ModelViewSet):
    """
    ViewSet para Actividades del Plan de Trabajo

    Acciones especiales:
    - reportar_avance: Reportar avance de una actividad
    - completar: Marcar actividad como completada
    - cancelar: Cancelar una actividad
    """
    queryset = ActividadPlan.objects.select_related(
        'plan_trabajo', 'responsable'
    ).prefetch_related('colaboradores')
    permission_classes = [IsAuthenticated]
    filterset_fields = [
        'empresa_id', 'plan_trabajo', 'estado',
        'tipo_actividad', 'responsable'
    ]
    search_fields = ['codigo', 'nombre', 'area_responsable']
    ordering_fields = ['fecha_programada_inicio', 'porcentaje_avance', 'created_at']
    ordering = ['fecha_programada_inicio']

    def get_serializer_class(self):
        if self.action in ['list']:
            return ActividadPlanListSerializer
        return ActividadPlanDetailSerializer

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=['post'])
    def reportar_avance(self, request, pk=None):
        """
        Reportar avance de una actividad

        Body params:
        - porcentaje_avance: decimal (0-100)
        - observaciones: string (opcional)
        - evidencias: string (opcional)
        """
        actividad = self.get_object()

        porcentaje = request.data.get('porcentaje_avance')
        if porcentaje is None:
            return Response(
                {'error': 'porcentaje_avance es requerido'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            porcentaje = float(porcentaje)
            if porcentaje < 0 or porcentaje > 100:
                raise ValueError()
        except ValueError:
            return Response(
                {'error': 'porcentaje_avance debe estar entre 0 y 100'},
                status=status.HTTP_400_BAD_REQUEST
            )

        actividad.porcentaje_avance = porcentaje

        # Actualizar estado segun avance
        if porcentaje == 0:
            actividad.estado = 'PENDIENTE'
        elif porcentaje < 100:
            actividad.estado = 'EN_PROCESO'
            if not actividad.fecha_real_inicio:
                actividad.fecha_real_inicio = date.today()
        elif porcentaje == 100:
            actividad.estado = 'COMPLETADA'
            actividad.fecha_real_fin = date.today()

        if request.data.get('observaciones'):
            actividad.observaciones = request.data.get('observaciones')

        if request.data.get('evidencias'):
            actividad.evidencias = request.data.get('evidencias')

        actividad.save()

        serializer = self.get_serializer(actividad)
        return Response({
            'message': 'Avance reportado exitosamente',
            'data': serializer.data
        })

    @action(detail=True, methods=['post'])
    def completar(self, request, pk=None):
        """
        Marcar actividad como completada

        Body params:
        - resultados_obtenidos: string
        - evidencias: string (opcional)
        """
        actividad = self.get_object()

        if actividad.estado == 'COMPLETADA':
            return Response(
                {'error': 'La actividad ya esta completada'},
                status=status.HTTP_400_BAD_REQUEST
            )

        resultados = request.data.get('resultados_obtenidos')
        if not resultados:
            return Response(
                {'error': 'resultados_obtenidos es requerido'},
                status=status.HTTP_400_BAD_REQUEST
            )

        actividad.estado = 'COMPLETADA'
        actividad.porcentaje_avance = 100
        actividad.fecha_real_fin = date.today()
        actividad.resultados_obtenidos = resultados

        if request.data.get('evidencias'):
            actividad.evidencias = request.data.get('evidencias')

        actividad.save()

        serializer = self.get_serializer(actividad)
        return Response({
            'message': 'Actividad completada exitosamente',
            'data': serializer.data
        })

    @action(detail=True, methods=['post'])
    def cancelar(self, request, pk=None):
        """
        Cancelar una actividad
        """
        actividad = self.get_object()

        if actividad.estado == 'COMPLETADA':
            return Response(
                {'error': 'No se puede cancelar una actividad completada'},
                status=status.HTTP_400_BAD_REQUEST
            )

        motivo = request.data.get('motivo')
        if motivo:
            actividad.observaciones = f"CANCELADA: {motivo}"

        actividad.estado = 'CANCELADA'
        actividad.save()

        serializer = self.get_serializer(actividad)
        return Response({
            'message': 'Actividad cancelada',
            'data': serializer.data
        })


# ==================== OBJETIVO SISTEMA ====================

class ObjetivoSistemaViewSet(viewsets.ModelViewSet):
    """
    ViewSet para Objetivos del Sistema

    Acciones especiales:
    - actualizar_valor: Actualizar valor actual del indicador
    - marcar_cumplido: Marcar objetivo como cumplido
    """
    queryset = ObjetivoSistema.objects.select_related(
        'plan_trabajo', 'responsable'
    )
    permission_classes = [IsAuthenticated]
    filterset_fields = [
        'empresa_id', 'plan_trabajo', 'estado',
        'perspectiva_bsc', 'tipo_objetivo', 'area_aplicacion'
    ]
    search_fields = ['codigo', 'nombre', 'indicador_nombre']
    ordering_fields = ['fecha_meta', 'porcentaje_cumplimiento', 'created_at']
    ordering = ['perspectiva_bsc', 'codigo']

    def get_serializer_class(self):
        if self.action in ['list']:
            return ObjetivoSistemaListSerializer
        return ObjetivoSistemaDetailSerializer

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=['post'])
    def actualizar_valor(self, request, pk=None):
        """
        Actualizar valor actual del indicador y calcular cumplimiento

        Body params:
        - valor_actual: decimal
        - observaciones: string (opcional)
        """
        objetivo = self.get_object()

        valor = request.data.get('valor_actual')
        if valor is None:
            return Response(
                {'error': 'valor_actual es requerido'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            valor = float(valor)
        except ValueError:
            return Response(
                {'error': 'valor_actual debe ser numerico'},
                status=status.HTTP_400_BAD_REQUEST
            )

        objetivo.valor_actual = valor

        # Calcular porcentaje de cumplimiento
        if objetivo.meta_cuantitativa:
            porcentaje = (valor / float(objetivo.meta_cuantitativa)) * 100
            objetivo.porcentaje_cumplimiento = min(porcentaje, 100)

            # Actualizar estado segun cumplimiento
            if porcentaje >= 100:
                objetivo.estado = 'CUMPLIDO'
            else:
                objetivo.estado = 'EN_SEGUIMIENTO'

        if request.data.get('observaciones'):
            objetivo.observaciones = request.data.get('observaciones')

        objetivo.save()

        serializer = self.get_serializer(objetivo)
        return Response({
            'message': 'Valor actualizado exitosamente',
            'data': serializer.data
        })

    @action(detail=True, methods=['post'])
    def marcar_cumplido(self, request, pk=None):
        """
        Marcar objetivo como cumplido
        """
        objetivo = self.get_object()

        if objetivo.estado == 'CUMPLIDO':
            return Response(
                {'error': 'El objetivo ya esta marcado como cumplido'},
                status=status.HTTP_400_BAD_REQUEST
            )

        objetivo.estado = 'CUMPLIDO'
        objetivo.porcentaje_cumplimiento = 100

        if request.data.get('observaciones'):
            objetivo.observaciones = request.data.get('observaciones')

        objetivo.save()

        serializer = self.get_serializer(objetivo)
        return Response({
            'message': 'Objetivo marcado como cumplido',
            'data': serializer.data
        })


# ==================== PROGRAMA GESTION ====================

class ProgramaGestionViewSet(viewsets.ModelViewSet):
    """
    ViewSet para Programas de Gestion
    """
    queryset = ProgramaGestion.objects.select_related(
        'plan_trabajo', 'responsable'
    ).prefetch_related('coordinadores')
    permission_classes = [IsAuthenticated]
    filterset_fields = [
        'empresa_id', 'plan_trabajo', 'estado',
        'tipo_programa', 'responsable'
    ]
    search_fields = ['codigo', 'nombre']
    ordering_fields = ['fecha_inicio', 'porcentaje_avance', 'created_at']
    ordering = ['tipo_programa', 'codigo']

    def get_serializer_class(self):
        if self.action in ['list']:
            return ProgramaGestionListSerializer
        return ProgramaGestionDetailSerializer

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=['post'])
    def iniciar(self, request, pk=None):
        """
        Iniciar ejecucion del programa
        """
        programa = self.get_object()

        if programa.estado != 'PLANIFICADO':
            return Response(
                {'error': 'Solo se pueden iniciar programas planificados'},
                status=status.HTTP_400_BAD_REQUEST
            )

        programa.estado = 'EN_EJECUCION'
        programa.save()

        serializer = self.get_serializer(programa)
        return Response({
            'message': 'Programa iniciado',
            'data': serializer.data
        })

    @action(detail=True, methods=['post'])
    def completar(self, request, pk=None):
        """
        Completar programa
        """
        programa = self.get_object()

        if programa.estado != 'EN_EJECUCION':
            return Response(
                {'error': 'Solo se pueden completar programas en ejecucion'},
                status=status.HTTP_400_BAD_REQUEST
            )

        programa.estado = 'COMPLETADO'
        programa.porcentaje_avance = 100
        programa.save()

        serializer = self.get_serializer(programa)
        return Response({
            'message': 'Programa completado',
            'data': serializer.data
        })


# ==================== ACTIVIDAD PROGRAMA ====================

class ActividadProgramaViewSet(viewsets.ModelViewSet):
    """
    ViewSet para Actividades del Programa
    """
    queryset = ActividadPrograma.objects.select_related(
        'programa', 'responsable'
    )
    permission_classes = [IsAuthenticated]
    filterset_fields = [
        'empresa_id', 'programa', 'estado', 'responsable'
    ]
    search_fields = ['codigo', 'nombre']
    ordering_fields = ['fecha_programada', 'created_at']
    ordering = ['fecha_programada']

    def get_serializer_class(self):
        if self.action in ['list']:
            return ActividadProgramaListSerializer
        return ActividadProgramaDetailSerializer

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=['post'])
    def ejecutar(self, request, pk=None):
        """
        Marcar actividad como ejecutada

        Body params:
        - resultado: string
        - evidencias: string (opcional)
        """
        actividad = self.get_object()

        resultado = request.data.get('resultado')
        if not resultado:
            return Response(
                {'error': 'resultado es requerido'},
                status=status.HTTP_400_BAD_REQUEST
            )

        actividad.estado = 'EJECUTADA'
        actividad.fecha_ejecucion = date.today()
        actividad.resultado = resultado

        if request.data.get('evidencias'):
            actividad.evidencias = request.data.get('evidencias')

        actividad.save()

        serializer = self.get_serializer(actividad)
        return Response({
            'message': 'Actividad ejecutada',
            'data': serializer.data
        })


# ==================== SEGUIMIENTO CRONOGRAMA ====================

class SeguimientoCronogramaViewSet(viewsets.ModelViewSet):
    """
    ViewSet para Seguimiento de Cronograma
    """
    queryset = SeguimientoCronograma.objects.select_related(
        'plan_trabajo', 'realizado_por'
    )
    permission_classes = [IsAuthenticated]
    filterset_fields = [
        'empresa_id', 'plan_trabajo', 'periodo', 'nivel_cumplimiento'
    ]
    search_fields = ['periodo']
    ordering_fields = ['fecha_seguimiento', 'created_at']
    ordering = ['-fecha_seguimiento']

    def get_serializer_class(self):
        if self.action in ['list']:
            return SeguimientoCronogramaListSerializer
        return SeguimientoCronogramaDetailSerializer

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=False, methods=['post'])
    def generar_seguimiento(self, request):
        """
        Generar seguimiento automatico basado en el estado actual del plan

        Body params:
        - plan_trabajo_id: int
        - periodo: string
        """
        from django.db.models import Count, Sum, Avg

        plan_trabajo_id = request.data.get('plan_trabajo_id')
        periodo = request.data.get('periodo')

        if not plan_trabajo_id or not periodo:
            return Response(
                {'error': 'plan_trabajo_id y periodo son requeridos'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            plan = PlanTrabajoAnual.objects.get(pk=plan_trabajo_id)
        except PlanTrabajoAnual.DoesNotExist:
            return Response(
                {'error': 'Plan de trabajo no encontrado'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Calcular metricas
        actividades = plan.actividades.all()

        metricas = actividades.aggregate(
            total=Count('id'),
            completadas=Count('id', filter=models.Q(estado='COMPLETADA')),
            en_proceso=Count('id', filter=models.Q(estado='EN_PROCESO')),
            retrasadas=Count('id', filter=models.Q(estado='RETRASADA')),
            pendientes=Count('id', filter=models.Q(estado='PENDIENTE')),
            presupuesto_estimado=Sum('presupuesto_estimado'),
            presupuesto_ejecutado=Sum('presupuesto_ejecutado'),
        )

        # Calcular avance general
        if metricas['total'] > 0:
            total_avance = sum(act.porcentaje_avance for act in actividades)
            porcentaje_avance = total_avance / metricas['total']
        else:
            porcentaje_avance = 0

        # Determinar nivel de cumplimiento
        if porcentaje_avance >= 90:
            nivel = 'EXCELENTE'
        elif porcentaje_avance >= 75:
            nivel = 'BUENO'
        elif porcentaje_avance >= 60:
            nivel = 'ACEPTABLE'
        else:
            nivel = 'DEFICIENTE'

        # Crear seguimiento
        seguimiento = SeguimientoCronograma.objects.create(
            empresa_id=plan.empresa_id,
            plan_trabajo=plan,
            periodo=periodo,
            fecha_seguimiento=date.today(),
            realizado_por=request.user,
            actividades_totales=metricas['total'],
            actividades_completadas=metricas['completadas'],
            actividades_en_proceso=metricas['en_proceso'],
            actividades_retrasadas=metricas['retrasadas'],
            actividades_pendientes=metricas['pendientes'],
            porcentaje_avance_general=porcentaje_avance,
            presupuesto_planificado=metricas['presupuesto_estimado'] or 0,
            presupuesto_ejecutado=metricas['presupuesto_ejecutado'] or 0,
            nivel_cumplimiento=nivel,
            created_by=request.user
        )

        serializer = SeguimientoCronogramaDetailSerializer(seguimiento)
        return Response({
            'message': 'Seguimiento generado exitosamente',
            'data': serializer.data
        }, status=status.HTTP_201_CREATED)
