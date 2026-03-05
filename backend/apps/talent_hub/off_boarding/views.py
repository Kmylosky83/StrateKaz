"""
Views de Off-Boarding - Talent Hub

ViewSets para la gestión completa del proceso de retiro de colaboradores.
Incluye acciones personalizadas para procesos de negocio según legislación colombiana.
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django.db.models import Count, Q, Avg
from decimal import Decimal

from apps.core.base_models.mixins import get_tenant_empresa

from .models import (
    TipoRetiro,
    ProcesoRetiro,
    ChecklistRetiro,
    PazSalvo,
    ExamenEgreso,
    EntrevistaRetiro,
    LiquidacionFinal,
    CertificadoTrabajo
)
from .serializers import (
    TipoRetiroListSerializer,
    TipoRetiroDetailSerializer,
    TipoRetiroCreateSerializer,
    ProcesoRetiroListSerializer,
    ProcesoRetiroDetailSerializer,
    ProcesoRetiroCreateSerializer,
    ChecklistRetiroListSerializer,
    ChecklistRetiroDetailSerializer,
    ChecklistRetiroCreateSerializer,
    PazSalvoListSerializer,
    PazSalvoDetailSerializer,
    PazSalvoCreateSerializer,
    ExamenEgresoListSerializer,
    ExamenEgresoDetailSerializer,
    ExamenEgresoCreateSerializer,
    EntrevistaRetiroListSerializer,
    EntrevistaRetiroDetailSerializer,
    EntrevistaRetiroCreateSerializer,
    LiquidacionFinalListSerializer,
    LiquidacionFinalDetailSerializer,
    LiquidacionFinalCreateSerializer,
    CertificadoTrabajoListSerializer,
    CertificadoTrabajoDetailSerializer,
    CertificadoTrabajoCreateSerializer
)


# =============================================================================
# TIPO DE RETIRO
# =============================================================================

class TipoRetiroViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión de tipos de retiro.

    Acciones:
    - list: Listado de tipos de retiro
    - retrieve: Detalle de tipo de retiro
    - create: Crear nuevo tipo
    - update: Actualizar tipo
    - partial_update: Actualización parcial
    - destroy: Eliminación lógica
    """

    queryset = TipoRetiro.objects.all()

    def get_queryset(self):
        """Filtrar tipos activos del tenant."""
        queryset = TipoRetiro.objects.filter(
            is_active=True
        )

        # Filtro por tipo
        tipo = self.request.query_params.get('tipo', None)
        if tipo:
            queryset = queryset.filter(tipo=tipo)

        return queryset.order_by('orden', 'nombre')

    def get_serializer_class(self):
        """Serializer según acción."""
        if self.action == 'list':
            return TipoRetiroListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return TipoRetiroCreateSerializer
        return TipoRetiroDetailSerializer

    def perform_create(self, serializer):
        serializer.save(empresa=get_tenant_empresa())

    def perform_destroy(self, instance):
        """Soft delete."""
        instance.soft_delete()


# =============================================================================
# PROCESO DE RETIRO
# =============================================================================

class ProcesoRetiroViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión de procesos de retiro.

    Acciones personalizadas:
    - autorizar: Autorizar proceso de retiro
    - verificar_progreso: Actualizar progreso del proceso
    - completar_checklist: Marcar checklist como completado
    - completar_paz_salvos: Marcar paz y salvos como completos
    - completar_examen: Marcar examen de egreso como realizado
    - completar_entrevista: Marcar entrevista como realizada
    - completar_liquidacion: Marcar liquidación como aprobada
    - cerrar_proceso: Cerrar proceso completo
    - estadisticas: Estadísticas del proceso
    """

    queryset = ProcesoRetiro.objects.all()

    def get_queryset(self):
        """Filtrar procesos activos del tenant."""
        queryset = ProcesoRetiro.objects.filter(
            is_active=True
        ).select_related('colaborador', 'tipo_retiro', 'responsable_proceso')

        # Filtros opcionales
        estado = self.request.query_params.get('estado', None)
        if estado:
            queryset = queryset.filter(estado=estado)

        colaborador_id = self.request.query_params.get('colaborador', None)
        if colaborador_id:
            queryset = queryset.filter(colaborador_id=colaborador_id)

        return queryset.order_by('-fecha_notificacion')

    def get_serializer_class(self):
        """Serializer según acción."""
        if self.action == 'list':
            return ProcesoRetiroListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return ProcesoRetiroCreateSerializer
        return ProcesoRetiroDetailSerializer

    def perform_create(self, serializer):
        """Calcular preaviso al crear proceso."""
        proceso = serializer.save(empresa=get_tenant_empresa())

        # Calcular cumplimiento de preaviso
        dias_notificados = (proceso.fecha_ultimo_dia_trabajo - proceso.fecha_notificacion).days
        proceso.dias_preaviso_cumplidos = dias_notificados
        proceso.cumple_preaviso = dias_notificados >= proceso.tipo_retiro.dias_preaviso
        proceso.requiere_autorizacion = proceso.tipo_retiro.requiere_autorizacion
        proceso.save()

    def perform_destroy(self, instance):
        """Soft delete solo si está en estado inicial."""
        if instance.estado not in ['iniciado', 'cancelado']:
            return Response(
                {'error': 'Solo se pueden eliminar procesos iniciados o cancelados.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        instance.soft_delete()

    @action(detail=True, methods=['post'])
    def autorizar(self, request, pk=None):
        """Autorizar proceso de retiro."""
        proceso = self.get_object()

        if not proceso.requiere_autorizacion:
            return Response(
                {'error': 'Este proceso no requiere autorización.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if proceso.autorizado_por:
            return Response(
                {'error': 'El proceso ya fue autorizado.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        proceso.autorizado_por = request.user
        proceso.fecha_autorizacion = timezone.now()
        proceso.save()

        serializer = self.get_serializer(proceso)
        return Response({
            'message': 'Proceso autorizado exitosamente.',
            'proceso': serializer.data
        })

    @action(detail=True, methods=['post'], url_path='verificar-progreso')
    def verificar_progreso(self, request, pk=None):
        """Actualizar progreso del proceso."""
        proceso = self.get_object()
        proceso.calcular_progreso()

        serializer = self.get_serializer(proceso)
        return Response({
            'message': 'Progreso actualizado.',
            'progreso': proceso.progreso_porcentaje,
            'proceso': serializer.data
        })

    @action(detail=True, methods=['post'], url_path='completar-checklist')
    def completar_checklist(self, request, pk=None):
        """Marcar checklist como completado."""
        proceso = self.get_object()

        # Verificar que todos los items estén completados
        items_pendientes = proceso.items_checklist.filter(
            is_active=True
        ).exclude(estado='completado').count()

        if items_pendientes > 0:
            return Response(
                {'error': f'Hay {items_pendientes} items pendientes en el checklist.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        proceso.checklist_completado = True
        proceso.calcular_progreso()
        proceso.verificar_completitud()
        proceso.save()

        serializer = self.get_serializer(proceso)
        return Response({
            'message': 'Checklist marcado como completado.',
            'proceso': serializer.data
        })

    @action(detail=True, methods=['post'], url_path='completar-paz-salvos')
    def completar_paz_salvos(self, request, pk=None):
        """Marcar paz y salvos como completos."""
        proceso = self.get_object()

        # Verificar que todos los paz y salvos estén aprobados
        paz_salvos_pendientes = proceso.paz_salvos.filter(
            is_active=True
        ).exclude(estado='aprobado').count()

        if paz_salvos_pendientes > 0:
            return Response(
                {'error': f'Hay {paz_salvos_pendientes} paz y salvos pendientes.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        proceso.paz_salvo_completo = True
        proceso.calcular_progreso()
        proceso.verificar_completitud()
        proceso.save()

        serializer = self.get_serializer(proceso)
        return Response({
            'message': 'Paz y salvos marcados como completos.',
            'proceso': serializer.data
        })

    @action(detail=True, methods=['post'], url_path='completar-examen')
    def completar_examen(self, request, pk=None):
        """Marcar examen de egreso como realizado."""
        proceso = self.get_object()

        # Verificar que existe examen
        if not hasattr(proceso, 'examen_egreso'):
            return Response(
                {'error': 'No se ha registrado el examen de egreso.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        proceso.examen_egreso_realizado = True
        proceso.calcular_progreso()
        proceso.verificar_completitud()
        proceso.save()

        serializer = self.get_serializer(proceso)
        return Response({
            'message': 'Examen de egreso marcado como realizado.',
            'proceso': serializer.data
        })

    @action(detail=True, methods=['post'], url_path='completar-entrevista')
    def completar_entrevista(self, request, pk=None):
        """Marcar entrevista como realizada."""
        proceso = self.get_object()

        # Verificar que existe entrevista
        if not hasattr(proceso, 'entrevista_retiro'):
            return Response(
                {'error': 'No se ha registrado la entrevista de retiro.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        proceso.entrevista_realizada = True
        proceso.calcular_progreso()
        proceso.verificar_completitud()
        proceso.save()

        serializer = self.get_serializer(proceso)
        return Response({
            'message': 'Entrevista marcada como realizada.',
            'proceso': serializer.data
        })

    @action(detail=True, methods=['post'], url_path='completar-liquidacion')
    def completar_liquidacion(self, request, pk=None):
        """Marcar liquidación como aprobada."""
        proceso = self.get_object()

        # Verificar que existe liquidación
        if not hasattr(proceso, 'liquidacion_final'):
            return Response(
                {'error': 'No se ha registrado la liquidación final.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Verificar que la liquidación esté aprobada
        if not proceso.liquidacion_final.esta_aprobada:
            return Response(
                {'error': 'La liquidación debe estar aprobada primero.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        proceso.liquidacion_aprobada = True
        proceso.calcular_progreso()
        proceso.verificar_completitud()
        proceso.save()

        serializer = self.get_serializer(proceso)
        return Response({
            'message': 'Liquidación marcada como aprobada.',
            'proceso': serializer.data
        })

    @action(detail=True, methods=['post'], url_path='cerrar-proceso')
    def cerrar_proceso(self, request, pk=None):
        """Cerrar proceso completo."""
        proceso = self.get_object()

        if proceso.estado == 'completado':
            return Response(
                {'error': 'El proceso ya está completado.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Verificar que todo esté completo
        if not proceso.verificar_completitud():
            return Response(
                {'error': 'El proceso no está completo. Verificar todos los pasos.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        proceso.cerrado_por = request.user
        proceso.fecha_cierre = timezone.now()
        proceso.save()

        serializer = self.get_serializer(proceso)
        return Response({
            'message': 'Proceso cerrado exitosamente.',
            'proceso': serializer.data
        })

    @action(detail=True, methods=['get'])
    def estadisticas(self, request, pk=None):
        """Obtener estadísticas del proceso."""
        proceso = self.get_object()

        stats = {
            'proceso': proceso.nombre_proceso,
            'estado': proceso.get_estado_display(),
            'progreso_porcentaje': proceso.progreso_porcentaje,
            'checklist': {
                'total': proceso.items_checklist.filter(is_active=True).count(),
                'completados': proceso.items_checklist.filter(
                    is_active=True, estado='completado'
                ).count(),
                'completado': proceso.checklist_completado
            },
            'paz_salvos': {
                'total': proceso.paz_salvos.filter(is_active=True).count(),
                'aprobados': proceso.paz_salvos.filter(
                    is_active=True, estado='aprobado'
                ).count(),
                'completado': proceso.paz_salvo_completo
            },
            'examen_egreso': proceso.examen_egreso_realizado,
            'entrevista': proceso.entrevista_realizada,
            'liquidacion': proceso.liquidacion_aprobada,
            'dias_preaviso': {
                'requeridos': proceso.dias_preaviso_requeridos,
                'cumplidos': proceso.dias_preaviso_cumplidos,
                'cumple': proceso.cumple_preaviso
            }
        }

        return Response(stats)


# =============================================================================
# CHECKLIST DE RETIRO
# =============================================================================

class ChecklistRetiroViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión de checklist de retiro.

    Acciones personalizadas:
    - marcar_completado: Marcar item como completado
    - marcar_no_aplica: Marcar item como no aplica
    """

    queryset = ChecklistRetiro.objects.all()

    def get_queryset(self):
        """Filtrar checklist activos del tenant."""
        queryset = ChecklistRetiro.objects.filter(
            is_active=True
        ).select_related('proceso_retiro', 'validado_por')

        # Filtrar por proceso
        proceso_id = self.request.query_params.get('proceso_retiro', None)
        if proceso_id:
            queryset = queryset.filter(proceso_retiro_id=proceso_id)

        return queryset.order_by('proceso_retiro', 'orden', 'tipo_item')

    def get_serializer_class(self):
        """Serializer según acción."""
        if self.action == 'list':
            return ChecklistRetiroListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return ChecklistRetiroCreateSerializer
        return ChecklistRetiroDetailSerializer

    def perform_create(self, serializer):
        serializer.save(empresa=get_tenant_empresa())

    def perform_destroy(self, instance):
        """Soft delete."""
        instance.soft_delete()

    @action(detail=True, methods=['post'], url_path='marcar-completado')
    def marcar_completado(self, request, pk=None):
        """Marcar item como completado."""
        item = self.get_object()

        observaciones = request.data.get('observaciones', '')
        item.marcar_completado(request.user)

        if observaciones:
            item.observaciones = observaciones
            item.save()

        serializer = self.get_serializer(item)
        return Response({
            'message': 'Item marcado como completado.',
            'item': serializer.data
        })

    @action(detail=True, methods=['post'], url_path='marcar-no-aplica')
    def marcar_no_aplica(self, request, pk=None):
        """Marcar item como no aplica."""
        item = self.get_object()

        item.estado = 'no_aplica'
        item.validado_por = request.user
        item.fecha_validacion = timezone.now()
        item.observaciones = request.data.get('observaciones', '')
        item.save()

        serializer = self.get_serializer(item)
        return Response({
            'message': 'Item marcado como no aplica.',
            'item': serializer.data
        })


# =============================================================================
# PAZ Y SALVO
# =============================================================================

class PazSalvoViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión de paz y salvos.

    Acciones personalizadas:
    - aprobar: Aprobar paz y salvo
    - rechazar: Rechazar paz y salvo
    """

    queryset = PazSalvo.objects.all()

    def get_queryset(self):
        """Filtrar paz y salvos activos del tenant."""
        queryset = PazSalvo.objects.filter(
            is_active=True
        ).select_related('proceso_retiro', 'responsable', 'aprobado_por')

        # Filtrar por proceso
        proceso_id = self.request.query_params.get('proceso_retiro', None)
        if proceso_id:
            queryset = queryset.filter(proceso_retiro_id=proceso_id)

        # Filtrar por área
        area = self.request.query_params.get('area', None)
        if area:
            queryset = queryset.filter(area=area)

        return queryset.order_by('proceso_retiro', 'area')

    def get_serializer_class(self):
        """Serializer según acción."""
        if self.action == 'list':
            return PazSalvoListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return PazSalvoCreateSerializer
        return PazSalvoDetailSerializer

    def perform_create(self, serializer):
        serializer.save(empresa=get_tenant_empresa())

    def perform_destroy(self, instance):
        """Soft delete."""
        instance.soft_delete()

    @action(detail=True, methods=['post'])
    def aprobar(self, request, pk=None):
        """Aprobar paz y salvo."""
        paz_salvo = self.get_object()

        if paz_salvo.esta_aprobado:
            return Response(
                {'error': 'El paz y salvo ya está aprobado.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        observaciones = request.data.get('observaciones', '')
        paz_salvo.aprobar(request.user, observaciones)

        serializer = self.get_serializer(paz_salvo)
        return Response({
            'message': 'Paz y salvo aprobado exitosamente.',
            'paz_salvo': serializer.data
        })

    @action(detail=True, methods=['post'])
    def rechazar(self, request, pk=None):
        """Rechazar paz y salvo."""
        paz_salvo = self.get_object()

        if paz_salvo.esta_aprobado:
            return Response(
                {'error': 'El paz y salvo ya está aprobado.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        motivo = request.data.get('motivo', '')
        if not motivo:
            return Response(
                {'error': 'Debe proporcionar un motivo para el rechazo.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        paz_salvo.rechazar(request.user, motivo)

        serializer = self.get_serializer(paz_salvo)
        return Response({
            'message': 'Paz y salvo rechazado.',
            'paz_salvo': serializer.data
        })


# =============================================================================
# EXAMEN DE EGRESO
# =============================================================================

class ExamenEgresoViewSet(viewsets.ModelViewSet):
    """ViewSet para gestión de exámenes de egreso."""

    queryset = ExamenEgreso.objects.all()

    def get_queryset(self):
        """Filtrar examenes activos del tenant."""
        queryset = ExamenEgreso.objects.filter(
            is_active=True
        ).select_related('proceso_retiro')

        # Filtrar por resultado
        resultado = self.request.query_params.get('resultado', None)
        if resultado:
            queryset = queryset.filter(resultado=resultado)

        return queryset.order_by('-fecha_examen')

    def get_serializer_class(self):
        """Serializer según acción."""
        if self.action == 'list':
            return ExamenEgresoListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return ExamenEgresoCreateSerializer
        return ExamenEgresoDetailSerializer

    def perform_create(self, serializer):
        serializer.save(empresa=get_tenant_empresa())

    def perform_destroy(self, instance):
        """Soft delete."""
        instance.soft_delete()


# =============================================================================
# ENTREVISTA DE RETIRO
# =============================================================================

class EntrevistaRetiroViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión de entrevistas de retiro.

    Acciones personalizadas:
    - estadisticas_generales: Estadísticas de todas las entrevistas
    """

    queryset = EntrevistaRetiro.objects.all()

    def get_queryset(self):
        """Filtrar entrevistas activas del tenant."""
        queryset = EntrevistaRetiro.objects.filter(
            is_active=True
        ).select_related('proceso_retiro', 'entrevistador')

        # Filtrar por motivo
        motivo = self.request.query_params.get('motivo_principal_retiro', None)
        if motivo:
            queryset = queryset.filter(motivo_principal_retiro=motivo)

        return queryset.order_by('-fecha_entrevista')

    def get_serializer_class(self):
        """Serializer según acción."""
        if self.action == 'list':
            return EntrevistaRetiroListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return EntrevistaRetiroCreateSerializer
        return EntrevistaRetiroDetailSerializer

    def perform_create(self, serializer):
        serializer.save(empresa=get_tenant_empresa())

    def perform_destroy(self, instance):
        """Soft delete."""
        instance.soft_delete()

    @action(detail=False, methods=['get'], url_path='estadisticas-generales')
    def estadisticas_generales(self, request):
        """Estadísticas generales de entrevistas."""
        entrevistas = self.get_queryset()

        stats = {
            'total_entrevistas': entrevistas.count(),
            'promedio_satisfaccion': entrevistas.aggregate(
                Avg('satisfaccion_general')
            )['satisfaccion_general__avg'],
            'promedio_liderazgo': entrevistas.aggregate(
                Avg('evaluacion_liderazgo')
            )['evaluacion_liderazgo__avg'],
            'promedio_clima': entrevistas.aggregate(
                Avg('evaluacion_clima_laboral')
            )['evaluacion_clima_laboral__avg'],
            'volverian_trabajar': entrevistas.filter(volveria_trabajar=True).count(),
            'recomendarian_empresa': entrevistas.filter(recomendaria_empresa=True).count(),
            'por_motivo': entrevistas.values('motivo_principal_retiro').annotate(
                cantidad=Count('id')
            ),
            'evaluaciones_positivas': entrevistas.filter(
                satisfaccion_general__gte=4
            ).count()
        }

        return Response(stats)


# =============================================================================
# LIQUIDACIÓN FINAL
# =============================================================================

class LiquidacionFinalViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión de liquidaciones finales.

    Acciones personalizadas:
    - calcular: Calcular liquidación completa
    - aprobar: Aprobar liquidación
    - registrar_pago: Registrar pago de liquidación
    """

    queryset = LiquidacionFinal.objects.all()

    def get_queryset(self):
        """Filtrar liquidaciones activas del tenant."""
        queryset = LiquidacionFinal.objects.filter(
            is_active=True
        ).select_related('proceso_retiro', 'aprobado_por')

        return queryset.order_by('-fecha_liquidacion')

    def get_serializer_class(self):
        """Serializer según acción."""
        if self.action == 'list':
            return LiquidacionFinalListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return LiquidacionFinalCreateSerializer
        return LiquidacionFinalDetailSerializer

    def perform_create(self, serializer):
        """Calcular liquidación al crear."""
        liquidacion = serializer.save(empresa=get_tenant_empresa())
        liquidacion.calcular_liquidacion_completa()

    def perform_destroy(self, instance):
        """Soft delete solo si no está aprobada."""
        if instance.esta_aprobada:
            return Response(
                {'error': 'No se puede eliminar una liquidación aprobada.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        instance.soft_delete()

    @action(detail=True, methods=['post'])
    def calcular(self, request, pk=None):
        """Recalcular liquidación completa."""
        liquidacion = self.get_object()

        liquidacion.calcular_liquidacion_completa()

        serializer = self.get_serializer(liquidacion)
        return Response({
            'message': 'Liquidación calculada exitosamente.',
            'liquidacion': serializer.data
        })

    @action(detail=True, methods=['post'])
    def aprobar(self, request, pk=None):
        """Aprobar liquidación final."""
        liquidacion = self.get_object()

        if liquidacion.esta_aprobada:
            return Response(
                {'error': 'La liquidación ya está aprobada.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        liquidacion.aprobar(request.user)

        serializer = self.get_serializer(liquidacion)
        return Response({
            'message': 'Liquidación aprobada exitosamente.',
            'liquidacion': serializer.data
        })

    @action(detail=True, methods=['post'], url_path='registrar-pago')
    def registrar_pago(self, request, pk=None):
        """Registrar pago de liquidación."""
        liquidacion = self.get_object()

        if not liquidacion.esta_aprobada:
            return Response(
                {'error': 'La liquidación debe estar aprobada antes de registrar el pago.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if liquidacion.esta_pagada:
            return Response(
                {'error': 'La liquidación ya fue pagada.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validar datos requeridos
        fecha_pago = request.data.get('fecha_pago')
        metodo_pago = request.data.get('metodo_pago')
        referencia_pago = request.data.get('referencia_pago')

        if not all([fecha_pago, metodo_pago, referencia_pago]):
            return Response(
                {'error': 'Debe proporcionar fecha_pago, metodo_pago y referencia_pago.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        liquidacion.fecha_pago = fecha_pago
        liquidacion.metodo_pago = metodo_pago
        liquidacion.referencia_pago = referencia_pago
        liquidacion.save()

        serializer = self.get_serializer(liquidacion)
        return Response({
            'message': 'Pago registrado exitosamente.',
            'liquidacion': serializer.data
        })


# =============================================================================
# CERTIFICADO DE TRABAJO - Art. 57 y 62 CST
# =============================================================================

class CertificadoTrabajoViewSet(viewsets.ModelViewSet):
    """
    ViewSet para certificados de trabajo.

    Gestión de certificados laborales según Art. 57 y 62 CST.
    Acciones personalizadas:
    - generar: Marca el certificado como generado
    - entregar: Marca el certificado como entregado
    """

    queryset = CertificadoTrabajo.objects.all()

    def get_queryset(self):
        queryset = CertificadoTrabajo.objects.filter(
            is_active=True
        ).select_related('colaborador', 'generado_por')

        # Filtros
        estado = self.request.query_params.get('estado')
        if estado:
            queryset = queryset.filter(estado=estado)

        tipo = self.request.query_params.get('tipo_certificado')
        if tipo:
            queryset = queryset.filter(tipo_certificado=tipo)

        colaborador_id = self.request.query_params.get('colaborador')
        if colaborador_id:
            queryset = queryset.filter(colaborador_id=colaborador_id)

        return queryset.order_by('-fecha_solicitud')

    def get_serializer_class(self):
        if self.action == 'list':
            return CertificadoTrabajoListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return CertificadoTrabajoCreateSerializer
        return CertificadoTrabajoDetailSerializer

    def perform_create(self, serializer):
        serializer.save(empresa=get_tenant_empresa())

    def perform_destroy(self, instance):
        instance.soft_delete()

    @action(detail=True, methods=['post'])
    def generar(self, request, pk=None):
        """Marca el certificado como generado."""
        certificado = self.get_object()
        certificado.estado = 'generado'
        certificado.fecha_expedicion = timezone.now().date()
        certificado.generado_por = request.user
        certificado.save()

        serializer = self.get_serializer(certificado)
        return Response({
            'message': 'Certificado generado exitosamente.',
            'certificado': serializer.data
        })

    @action(detail=True, methods=['post'])
    def entregar(self, request, pk=None):
        """Marca el certificado como entregado."""
        certificado = self.get_object()

        if certificado.estado != 'generado':
            return Response(
                {'error': 'El certificado debe estar generado antes de entregarse.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        certificado.estado = 'entregado'
        certificado.save()

        serializer = self.get_serializer(certificado)
        return Response({
            'message': 'Certificado marcado como entregado.',
            'certificado': serializer.data
        })
