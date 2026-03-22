"""
Views para Ejecución de Flujos - Workflow Engine
"""
import logging

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.db.models import Q, Count
from apps.core.permissions import GranularActionPermission
from .models import (
    InstanciaFlujo,
    TareaActiva,
    HistorialTarea,
    ArchivoAdjunto,
    NotificacionFlujo
)
from .serializers import (
    InstanciaFlujoSerializer,
    TareaActivaSerializer,
    HistorialTareaSerializer,
    ArchivoAdjuntoSerializer,
    NotificacionFlujoSerializer
)
from apps.core.base_models.mixins import get_tenant_empresa

logger = logging.getLogger('workflow')


class InstanciaFlujoViewSet(viewsets.ModelViewSet):
    """ViewSet para instancias de flujos"""
    serializer_class = InstanciaFlujoSerializer
    permission_classes = [IsAuthenticated, GranularActionPermission]
    section_code = 'ejecucion_flujos'
    filterset_fields = ['estado', 'prioridad', 'plantilla', 'responsable_actual']
    search_fields = ['codigo_instancia', 'titulo', 'descripcion']
    ordering_fields = ['fecha_inicio', 'fecha_limite', 'prioridad']
    ordering = ['-fecha_inicio']

    def get_queryset(self):
        empresa = get_tenant_empresa(auto_create=False)
        queryset = InstanciaFlujo.objects.select_related(
            'plantilla',
            'nodo_actual',
            'iniciado_por',
            'responsable_actual',
            'finalizado_por'
        )
        if empresa:
            queryset = queryset.filter(empresa_id=empresa.id)
        return queryset

    def perform_create(self, serializer):
        empresa = get_tenant_empresa(auto_create=False)
        serializer.save(empresa_id=empresa.id if empresa else None, iniciado_por=self.request.user)

    @action(detail=False, methods=['get'], url_path='mis-instancias')
    def mis_instancias(self, request):
        """Obtener instancias donde el usuario es responsable actual"""
        instancias = self.get_queryset().filter(
            responsable_actual=request.user,
            estado__in=['INICIADO', 'EN_PROCESO']
        )
        serializer = self.get_serializer(instancias, many=True)
        return Response({
            'total': instancias.count(),
            'instancias': serializer.data
        })

    @action(detail=False, methods=['get'])
    def vencidas(self, request):
        """Obtener instancias vencidas (fecha_limite pasada)"""
        ahora = timezone.now()
        instancias = self.get_queryset().filter(
            fecha_limite__lt=ahora,
            estado__in=['INICIADO', 'EN_PROCESO', 'PAUSADO']
        )
        serializer = self.get_serializer(instancias, many=True)
        return Response({
            'total': instancias.count(),
            'instancias': serializer.data
        })

    @action(detail=False, methods=['get'])
    def estadisticas(self, request):
        """Obtener estadísticas generales de instancias"""
        queryset = self.get_queryset()
        total = queryset.count()
        por_estado = queryset.values('estado').annotate(count=Count('id'))
        por_prioridad = queryset.values('prioridad').annotate(count=Count('id'))
        activas = queryset.filter(estado__in=['INICIADO', 'EN_PROCESO', 'PAUSADO']).count()
        ahora = timezone.now()
        vencidas = queryset.filter(
            fecha_limite__lt=ahora,
            estado__in=['INICIADO', 'EN_PROCESO', 'PAUSADO']
        ).count()

        return Response({
            'total': total,
            'activas': activas,
            'vencidas': vencidas,
            'por_estado': list(por_estado),
            'por_prioridad': list(por_prioridad)
        })

    @action(detail=True, methods=['post'])
    def pausar(self, request, pk=None):
        """Pausar una instancia"""
        instancia = self.get_object()
        if instancia.estado not in ['INICIADO', 'EN_PROCESO']:
            return Response(
                {'error': 'Solo se pueden pausar instancias iniciadas o en proceso'},
                status=status.HTTP_400_BAD_REQUEST
            )
        motivo_pausa = request.data.get('motivo_pausa', '')
        if not motivo_pausa:
            return Response(
                {'error': 'Debe indicar el motivo de pausa'},
                status=status.HTTP_400_BAD_REQUEST
            )
        instancia.estado = 'PAUSADO'
        instancia.motivo_pausa = motivo_pausa
        instancia.save()
        serializer = self.get_serializer(instancia)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def reanudar(self, request, pk=None):
        """Reanudar una instancia pausada"""
        instancia = self.get_object()
        if instancia.estado != 'PAUSADO':
            return Response(
                {'error': 'Solo se pueden reanudar instancias pausadas'},
                status=status.HTTP_400_BAD_REQUEST
            )
        instancia.estado = 'EN_PROCESO'
        instancia.motivo_pausa = ''
        instancia.save()
        serializer = self.get_serializer(instancia)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def cancelar(self, request, pk=None):
        """Cancelar una instancia"""
        instancia = self.get_object()
        if instancia.estado in ['COMPLETADO', 'CANCELADO']:
            return Response(
                {'error': 'La instancia ya está finalizada'},
                status=status.HTTP_400_BAD_REQUEST
            )
        motivo_cancelacion = request.data.get('motivo_cancelacion', '')
        if not motivo_cancelacion:
            return Response(
                {'error': 'Debe indicar el motivo de cancelación'},
                status=status.HTTP_400_BAD_REQUEST
            )
        instancia.estado = 'CANCELADO'
        instancia.motivo_cancelacion = motivo_cancelacion
        instancia.fecha_fin = timezone.now()
        instancia.finalizado_por = request.user
        instancia.save()
        serializer = self.get_serializer(instancia)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def completar(self, request, pk=None):
        """Completar una instancia"""
        instancia = self.get_object()
        if instancia.estado in ['COMPLETADO', 'CANCELADO']:
            return Response(
                {'error': 'La instancia ya está finalizada'},
                status=status.HTTP_400_BAD_REQUEST
            )
        instancia.estado = 'COMPLETADO'
        instancia.fecha_fin = timezone.now()
        instancia.finalizado_por = request.user
        instancia.save()
        serializer = self.get_serializer(instancia)
        return Response(serializer.data)

    @action(detail=False, methods=['post'], url_path='iniciar-flujo')
    def iniciar_flujo(self, request):
        """
        Iniciar una nueva instancia de flujo desde una plantilla.

        POST body:
        {
            "plantilla_id": 1,
            "titulo": "Solicitud de Compra - Materiales",
            "descripcion": "...",
            "prioridad": "NORMAL",
            "datos_iniciales": {"monto": 5000000, "tipo": "URGENTE"},
            "entidad_tipo": "solicitud_compra",
            "entidad_id": 42
        }
        """
        from .services import WorkflowExecutionService
        from .services.node_handlers import WorkflowConfigError, WorkflowExecutionError

        plantilla_id = request.data.get('plantilla_id')
        if not plantilla_id:
            return Response(
                {'error': 'plantilla_id es requerido'},
                status=status.HTTP_400_BAD_REQUEST
            )

        empresa = get_tenant_empresa(auto_create=False)
        empresa_id = empresa.id if empresa else None
        if not empresa_id:
            return Response(
                {'error': 'empresa_id no disponible'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            instancia = WorkflowExecutionService.iniciar_flujo(
                plantilla_id=int(plantilla_id),
                datos_iniciales=request.data.get('datos_iniciales', {}),
                usuario=request.user,
                empresa_id=int(empresa_id),
                titulo=request.data.get('titulo', ''),
                descripcion=request.data.get('descripcion', ''),
                prioridad=request.data.get('prioridad', 'NORMAL'),
                entidad_tipo=request.data.get('entidad_tipo', ''),
                entidad_id=request.data.get('entidad_id'),
            )
            serializer = self.get_serializer(instancia)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except WorkflowConfigError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        except WorkflowExecutionError as e:
            logger.error(f"Error de ejecucion al iniciar flujo: {e}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class TareaActivaViewSet(viewsets.ModelViewSet):
    """ViewSet para tareas activas"""
    serializer_class = TareaActivaSerializer
    permission_classes = [IsAuthenticated, GranularActionPermission]
    section_code = 'ejecucion_flujos'
    filterset_fields = ['estado', 'instancia', 'asignado_a', 'tipo_tarea', 'rol_asignado']
    search_fields = ['codigo_tarea', 'nombre_tarea', 'descripcion']
    ordering_fields = ['fecha_creacion', 'fecha_vencimiento', 'fecha_completada']
    ordering = ['-fecha_creacion']

    def get_queryset(self):
        empresa = get_tenant_empresa(auto_create=False)
        queryset = TareaActiva.objects.select_related(
            'instancia',
            'nodo',
            'asignado_a',
            'asignado_por',
            'escalada_a',
            'created_by'
        )
        if empresa:
            queryset = queryset.filter(empresa_id=empresa.id)
        return queryset

    def perform_create(self, serializer):
        empresa = get_tenant_empresa(auto_create=False)
        serializer.save(
            empresa_id=empresa.id if empresa else None,
            created_by=self.request.user
        )

    @action(detail=False, methods=['get'], url_path='mis-tareas')
    def mis_tareas(self, request):
        """Tareas asignadas al usuario actual"""
        tareas = self.get_queryset().filter(
            Q(asignado_a=request.user) | Q(rol_asignado__in=request.user.groups.values_list('name', flat=True)),
            estado__in=['PENDIENTE', 'EN_PROGRESO']
        )
        serializer = self.get_serializer(tareas, many=True)
        return Response({
            'total': tareas.count(),
            'tareas': serializer.data
        })

    @action(detail=False, methods=['get'])
    def vencidas(self, request):
        """Tareas vencidas"""
        ahora = timezone.now()
        tareas = self.get_queryset().filter(
            fecha_vencimiento__lt=ahora,
            estado__in=['PENDIENTE', 'EN_PROGRESO']
        )
        serializer = self.get_serializer(tareas, many=True)
        return Response({
            'total': tareas.count(),
            'tareas': serializer.data
        })

    @action(detail=False, methods=['get'])
    def bandeja(self, request):
        """Bandeja de tareas del usuario con estadísticas"""
        tareas_query = self.get_queryset().filter(
            Q(asignado_a=request.user) | Q(rol_asignado__in=request.user.groups.values_list('name', flat=True))
        )
        pendientes = tareas_query.filter(estado='PENDIENTE')
        en_progreso = tareas_query.filter(estado='EN_PROGRESO')
        ahora = timezone.now()
        vencidas = tareas_query.filter(
            fecha_vencimiento__lt=ahora,
            estado__in=['PENDIENTE', 'EN_PROGRESO']
        )

        return Response({
            'pendientes': {
                'total': pendientes.count(),
                'tareas': self.get_serializer(pendientes[:10], many=True).data
            },
            'en_progreso': {
                'total': en_progreso.count(),
                'tareas': self.get_serializer(en_progreso[:10], many=True).data
            },
            'vencidas': {
                'total': vencidas.count(),
                'tareas': self.get_serializer(vencidas[:10], many=True).data
            }
        })

    @action(detail=True, methods=['post'])
    def iniciar(self, request, pk=None):
        """Iniciar una tarea"""
        tarea = self.get_object()
        if tarea.estado != 'PENDIENTE':
            return Response(
                {'error': 'Solo se pueden iniciar tareas pendientes'},
                status=status.HTTP_400_BAD_REQUEST
            )
        tarea.estado = 'EN_PROGRESO'
        tarea.fecha_inicio = timezone.now()
        tarea.save()

        empresa = get_tenant_empresa(auto_create=False)
        HistorialTarea.objects.create(
            tarea=tarea,
            instancia=tarea.instancia,
            accion='INICIO',
            descripcion=f'Tarea iniciada por {request.user.get_full_name()}',
            estado_anterior='PENDIENTE',
            estado_nuevo='EN_PROGRESO',
            usuario=request.user,
            empresa_id=empresa.id if empresa else None
        )
        serializer = self.get_serializer(tarea)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def completar(self, request, pk=None):
        """Completar una tarea"""
        empresa = get_tenant_empresa(auto_create=False)
        tarea = self.get_object()
        if tarea.estado not in ['PENDIENTE', 'EN_PROGRESO']:
            return Response(
                {'error': 'Solo se pueden completar tareas pendientes o en progreso'},
                status=status.HTTP_400_BAD_REQUEST
            )
        tarea.estado = 'COMPLETADA'
        tarea.fecha_completada = timezone.now()
        tarea.decision = request.data.get('decision', '')
        tarea.formulario_data = request.data.get('formulario_data', {})
        tarea.observaciones = request.data.get('observaciones', '')
        tarea.save()

        HistorialTarea.objects.create(
            tarea=tarea,
            instancia=tarea.instancia,
            accion='COMPLETACION',
            descripcion=f'Tarea completada por {request.user.get_full_name()}',
            estado_anterior='EN_PROGRESO',
            estado_nuevo='COMPLETADA',
            datos_cambio={
                'decision': tarea.decision,
                'formulario_data': tarea.formulario_data
            },
            usuario=request.user,
            empresa_id=empresa.id if empresa else None
        )

        # Auto-avanzar el flujo de trabajo
        try:
            from .services import WorkflowExecutionService
            WorkflowExecutionService.completar_tarea_y_avanzar(
                tarea_id=tarea.id,
                datos=tarea.formulario_data or {},
                decision=tarea.decision or '',
                usuario=request.user,
            )
        except Exception as e:
            logger.error(
                f"Error avanzando flujo tras completar tarea {tarea.id}: {e}",
                exc_info=True,
            )

        serializer = self.get_serializer(tarea)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def rechazar(self, request, pk=None):
        """Rechazar una tarea"""
        empresa = get_tenant_empresa(auto_create=False)
        tarea = self.get_object()
        if tarea.estado not in ['PENDIENTE', 'EN_PROGRESO']:
            return Response(
                {'error': 'Solo se pueden rechazar tareas pendientes o en progreso'},
                status=status.HTTP_400_BAD_REQUEST
            )
        motivo_rechazo = request.data.get('motivo_rechazo', '')
        if not motivo_rechazo:
            return Response(
                {'error': 'Debe indicar el motivo de rechazo'},
                status=status.HTTP_400_BAD_REQUEST
            )
        estado_anterior = tarea.estado
        tarea.estado = 'RECHAZADA'
        tarea.motivo_rechazo = motivo_rechazo
        tarea.fecha_completada = timezone.now()
        tarea.save()

        HistorialTarea.objects.create(
            tarea=tarea,
            instancia=tarea.instancia,
            accion='RECHAZO',
            descripcion=f'Tarea rechazada por {request.user.get_full_name()}',
            estado_anterior=estado_anterior,
            estado_nuevo='RECHAZADA',
            datos_cambio={'motivo_rechazo': motivo_rechazo},
            usuario=request.user,
            empresa_id=empresa.id if empresa else None
        )

        # Manejar rechazo en el flujo de trabajo
        try:
            from .services import WorkflowExecutionService
            WorkflowExecutionService.rechazar_tarea(
                tarea_id=tarea.id,
                motivo=motivo_rechazo,
                usuario=request.user,
            )
        except Exception as e:
            logger.error(
                f"Error manejando rechazo en flujo para tarea {tarea.id}: {e}",
                exc_info=True,
            )

        serializer = self.get_serializer(tarea)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def reasignar(self, request, pk=None):
        """Reasignar una tarea a otro usuario"""
        empresa = get_tenant_empresa(auto_create=False)
        tarea = self.get_object()
        asignado_a_id = request.data.get('asignado_a')
        if not asignado_a_id:
            return Response(
                {'error': 'Debe indicar a quien se asignara la tarea'},
                status=status.HTTP_400_BAD_REQUEST
            )
        from django.contrib.auth import get_user_model
        User = get_user_model()
        try:
            nuevo_asignado = User.objects.get(id=asignado_a_id)
        except User.DoesNotExist:
            return Response(
                {'error': 'Usuario no encontrado'},
                status=status.HTTP_400_BAD_REQUEST
            )
        asignado_anterior = tarea.asignado_a
        tarea.asignado_a = nuevo_asignado
        tarea.asignado_por = request.user
        tarea.save()

        HistorialTarea.objects.create(
            tarea=tarea,
            instancia=tarea.instancia,
            accion='REASIGNACION',
            descripcion=f'Tarea reasignada por {request.user.get_full_name()} a {nuevo_asignado.get_full_name()}',
            asignado_anterior=asignado_anterior,
            asignado_nuevo=nuevo_asignado,
            usuario=request.user,
            empresa_id=empresa.id if empresa else None
        )
        serializer = self.get_serializer(tarea)
        return Response(serializer.data)


class HistorialTareaViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet para historial de tareas (solo lectura)"""
    serializer_class = HistorialTareaSerializer
    permission_classes = [IsAuthenticated, GranularActionPermission]
    section_code = 'ejecucion_flujos'
    filterset_fields = ['tarea', 'instancia', 'accion', 'usuario']
    ordering_fields = ['fecha_accion']
    ordering = ['-fecha_accion']

    def get_queryset(self):
        empresa = get_tenant_empresa(auto_create=False)
        queryset = HistorialTarea.objects.select_related(
            'tarea',
            'instancia',
            'usuario',
            'asignado_anterior',
            'asignado_nuevo'
        )
        if empresa:
            queryset = queryset.filter(empresa_id=empresa.id)
        return queryset

    @action(detail=False, methods=['get'], url_path='por-instancia')
    def por_instancia(self, request):
        """Obtener historial de una instancia específica"""
        instancia_id = request.query_params.get('instancia_id')
        if not instancia_id:
            return Response(
                {'error': 'Debe proporcionar instancia_id'},
                status=status.HTTP_400_BAD_REQUEST
            )
        historial = self.get_queryset().filter(instancia_id=instancia_id)
        serializer = self.get_serializer(historial, many=True)
        return Response({
            'total': historial.count(),
            'historial': serializer.data
        })


class ArchivoAdjuntoViewSet(viewsets.ModelViewSet):
    """ViewSet para archivos adjuntos"""
    serializer_class = ArchivoAdjuntoSerializer
    permission_classes = [IsAuthenticated, GranularActionPermission]
    section_code = 'ejecucion_flujos'
    filterset_fields = ['instancia', 'tarea', 'tipo_archivo', 'subido_por']
    ordering_fields = ['fecha_subida']
    ordering = ['-fecha_subida']

    def get_queryset(self):
        empresa = get_tenant_empresa(auto_create=False)
        queryset = ArchivoAdjunto.objects.select_related(
            'instancia',
            'tarea',
            'subido_por'
        )
        if empresa:
            queryset = queryset.filter(empresa_id=empresa.id)
        return queryset

    def perform_create(self, serializer):
        empresa = get_tenant_empresa(auto_create=False)
        empresa_id = empresa.id if empresa else None
        archivo = self.request.FILES.get('archivo')
        if archivo:
            serializer.save(
                empresa_id=empresa_id,
                subido_por=self.request.user,
                nombre_original=archivo.name,
                tamano_bytes=archivo.size,
                mime_type=archivo.content_type
            )
        else:
            serializer.save(
                empresa_id=empresa_id,
                subido_por=self.request.user
            )

    @action(detail=False, methods=['get'], url_path='por-instancia')
    def por_instancia(self, request):
        """Obtener archivos de una instancia específica"""
        instancia_id = request.query_params.get('instancia_id')
        if not instancia_id:
            return Response(
                {'error': 'Debe proporcionar instancia_id'},
                status=status.HTTP_400_BAD_REQUEST
            )
        archivos = self.get_queryset().filter(instancia_id=instancia_id)
        serializer = self.get_serializer(archivos, many=True)
        return Response({
            'total': archivos.count(),
            'archivos': serializer.data
        })

    @action(detail=False, methods=['get'], url_path='por-tarea')
    def por_tarea(self, request):
        """Obtener archivos de una tarea específica"""
        tarea_id = request.query_params.get('tarea_id')
        if not tarea_id:
            return Response(
                {'error': 'Debe proporcionar tarea_id'},
                status=status.HTTP_400_BAD_REQUEST
            )
        archivos = self.get_queryset().filter(tarea_id=tarea_id)
        serializer = self.get_serializer(archivos, many=True)
        return Response({
            'total': archivos.count(),
            'archivos': serializer.data
        })


class NotificacionFlujoViewSet(viewsets.ModelViewSet):
    """ViewSet para notificaciones de flujos"""
    serializer_class = NotificacionFlujoSerializer
    permission_classes = [IsAuthenticated, GranularActionPermission]
    section_code = 'ejecucion_flujos'
    filterset_fields = ['tipo_notificacion', 'prioridad', 'leida', 'destinatario']
    ordering_fields = ['fecha_creacion']
    ordering = ['-fecha_creacion']

    def get_queryset(self):
        empresa = get_tenant_empresa(auto_create=False)
        queryset = NotificacionFlujo.objects.select_related(
            'destinatario',
            'instancia',
            'tarea',
            'generada_por'
        )
        if empresa:
            queryset = queryset.filter(empresa_id=empresa.id)
        return queryset

    def perform_create(self, serializer):
        empresa = get_tenant_empresa(auto_create=False)
        serializer.save(
            empresa_id=empresa.id if empresa else None,
            generada_por=self.request.user
        )

    @action(detail=False, methods=['get'], url_path='mis-notificaciones')
    def mis_notificaciones(self, request):
        """Obtener notificaciones del usuario autenticado"""
        notificaciones = self.get_queryset().filter(destinatario=request.user)
        no_leidas = notificaciones.filter(leida=False)
        serializer = self.get_serializer(notificaciones[:50], many=True)
        return Response({
            'total': notificaciones.count(),
            'no_leidas': no_leidas.count(),
            'notificaciones': serializer.data
        })

    @action(detail=False, methods=['get'], url_path='no-leidas')
    def no_leidas(self, request):
        """Obtener notificaciones no leídas del usuario"""
        notificaciones = self.get_queryset().filter(
            destinatario=request.user,
            leida=False
        )
        serializer = self.get_serializer(notificaciones, many=True)
        return Response({
            'total': notificaciones.count(),
            'notificaciones': serializer.data
        })

    @action(detail=True, methods=['post'], url_path='marcar-leida')
    def marcar_leida(self, request, pk=None):
        """Marcar una notificación como leída"""
        notificacion = self.get_object()
        if notificacion.destinatario != request.user:
            return Response(
                {'error': 'No tiene permiso para modificar esta notificación'},
                status=status.HTTP_403_FORBIDDEN
            )
        notificacion.marcar_como_leida()
        serializer = self.get_serializer(notificacion)
        return Response(serializer.data)

    @action(detail=False, methods=['post'], url_path='marcar-todas-leidas')
    def marcar_todas_leidas(self, request):
        """Marcar todas las notificaciones como leídas"""
        notificaciones = self.get_queryset().filter(
            destinatario=request.user,
            leida=False
        )
        count = notificaciones.update(
            leida=True,
            fecha_lectura=timezone.now()
        )
        return Response({
            'message': f'{count} notificaciones marcadas como leídas',
            'total': count
        })
