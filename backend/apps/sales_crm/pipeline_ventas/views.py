"""
Views para Pipeline de Ventas - Sales CRM
Sistema dinámico de gestión de oportunidades y cotizaciones
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, Count, Sum, Avg, F, DecimalField, Case, When
from django.db.models.functions import Coalesce
from django.utils import timezone
from decimal import Decimal

from apps.core.base_models.mixins import get_tenant_empresa

from .models import (
    EtapaVenta,
    MotivoPerdida,
    FuenteOportunidad,
    Oportunidad,
    SeguimientoOportunidad,
    Cotizacion,
    DetalleCotizacion,
    HistorialEtapa
)
from .serializers import (
    EtapaVentaSerializer,
    MotivoPerdidaSerializer,
    FuenteOportunidadSerializer,
    OportunidadListSerializer,
    OportunidadDetailSerializer,
    OportunidadCreateUpdateSerializer,
    SeguimientoOportunidadSerializer,
    CotizacionListSerializer,
    CotizacionDetailSerializer,
    CotizacionCreateUpdateSerializer,
    DetalleCotizacionSerializer,
    HistorialEtapaSerializer,
    CambiarEtapaSerializer,
    CerrarPerdidaSerializer,
    DashboardPipelineSerializer
)


# ==================== CATÁLOGOS ====================

class EtapaVentaViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión de etapas de venta
    """
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['activo', 'es_inicial', 'es_ganada', 'es_perdida', 'es_final']
    search_fields = ['codigo', 'nombre']
    ordering_fields = ['orden', 'nombre', 'created_at']
    ordering = ['orden']

    def get_queryset(self):
        return EtapaVenta.objects.all().annotate(
            oportunidades_count=Count('oportunidades')
        )

    def get_serializer_class(self):
        return EtapaVentaSerializer

    def perform_create(self, serializer):
        serializer.save(empresa=get_tenant_empresa())


class MotivoPerdidaViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión de motivos de pérdida
    """
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['activo']
    search_fields = ['codigo', 'nombre']
    ordering_fields = ['orden', 'nombre', 'created_at']
    ordering = ['orden']

    def get_queryset(self):
        return MotivoPerdida.objects.all()

    def get_serializer_class(self):
        return MotivoPerdidaSerializer

    def perform_create(self, serializer):
        serializer.save(empresa=get_tenant_empresa())


class FuenteOportunidadViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión de fuentes de oportunidad
    """
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['activo']
    search_fields = ['codigo', 'nombre']
    ordering_fields = ['orden', 'nombre', 'created_at']
    ordering = ['orden']

    def get_queryset(self):
        return FuenteOportunidad.objects.all()

    def get_serializer_class(self):
        return FuenteOportunidadSerializer

    def perform_create(self, serializer):
        serializer.save(empresa=get_tenant_empresa())


# ==================== OPORTUNIDADES ====================

class OportunidadViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión de oportunidades de venta

    Incluye acciones custom:
    - cambiar_etapa: Cambiar etapa de la oportunidad
    - cerrar_ganada: Cerrar oportunidad como ganada
    - cerrar_perdida: Cerrar oportunidad como perdida
    - dashboard_pipeline: Métricas del pipeline
    - kanban: Vista Kanban agrupada por etapa
    """
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['etapa_actual', 'vendedor', 'cliente', 'fuente']
    search_fields = ['codigo', 'nombre', 'cliente__razon_social']
    ordering_fields = ['fecha_creacion', 'fecha_cierre_estimada', 'valor_estimado', 'created_at']
    ordering = ['-fecha_creacion']

    def get_queryset(self):
        queryset = Oportunidad.objects.select_related(
            'cliente',
            'vendedor',
            'etapa_actual',
            'fuente',
            'motivo_perdida'
        ).prefetch_related(
            'seguimientos',
            'historial_etapas',
            'cotizaciones'
        )

        # Filtros adicionales por query params
        params = self.request.query_params

        # Filtrar por rango de fechas de creación
        if params.get('fecha_desde'):
            queryset = queryset.filter(fecha_creacion__gte=params['fecha_desde'])
        if params.get('fecha_hasta'):
            queryset = queryset.filter(fecha_creacion__lte=params['fecha_hasta'])

        # Filtrar por estado (activas/cerradas)
        if params.get('solo_activas') == 'true':
            queryset = queryset.filter(etapa_actual__es_final=False)
        elif params.get('solo_cerradas') == 'true':
            queryset = queryset.filter(etapa_actual__es_final=True)

        return queryset

    def get_serializer_class(self):
        if self.action == 'list':
            return OportunidadListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return OportunidadCreateUpdateSerializer
        return OportunidadDetailSerializer

    def perform_create(self, serializer):
        serializer.save(empresa=get_tenant_empresa())

    @action(detail=True, methods=['post'])
    def cambiar_etapa(self, request, pk=None):
        """
        POST /oportunidades/{id}/cambiar_etapa/

        Body: {
            "etapa_nueva": <id>,
            "observaciones": "texto opcional"
        }
        """
        oportunidad = self.get_object()
        serializer = CambiarEtapaSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)

        nueva_etapa = serializer.validated_data['etapa_nueva']
        observaciones = serializer.validated_data.get('observaciones', '')

        # Validar que la etapa sea diferente
        if oportunidad.etapa_actual == nueva_etapa:
            return Response(
                {'error': 'La oportunidad ya está en esta etapa'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Cambiar etapa
        try:
            oportunidad.cambiar_etapa(
                nueva_etapa=nueva_etapa,
                observaciones=observaciones,
                usuario=request.user
            )

            return Response({
                'message': 'Etapa cambiada exitosamente',
                'oportunidad': OportunidadDetailSerializer(oportunidad, context={'request': request}).data
            })
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=True, methods=['post'])
    def cerrar_ganada(self, request, pk=None):
        """
        POST /oportunidades/{id}/cerrar_ganada/

        Cierra la oportunidad como ganada
        """
        oportunidad = self.get_object()

        if oportunidad.etapa_actual.es_final:
            return Response(
                {'error': 'La oportunidad ya está en una etapa final'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            oportunidad.cerrar_ganada(usuario=request.user)

            return Response({
                'message': 'Oportunidad cerrada como ganada exitosamente',
                'oportunidad': OportunidadDetailSerializer(oportunidad, context={'request': request}).data
            })
        except ValueError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=True, methods=['post'])
    def cerrar_perdida(self, request, pk=None):
        """
        POST /oportunidades/{id}/cerrar_perdida/

        Body: {
            "motivo_perdida": <id>,
            "observaciones": "texto obligatorio"
        }
        """
        oportunidad = self.get_object()

        if oportunidad.etapa_actual.es_final:
            return Response(
                {'error': 'La oportunidad ya está en una etapa final'},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = CerrarPerdidaSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)

        motivo = serializer.validated_data['motivo_perdida']
        observaciones = serializer.validated_data['observaciones']

        try:
            oportunidad.cerrar_perdida(
                motivo_perdida=motivo,
                observaciones=observaciones,
                usuario=request.user
            )

            return Response({
                'message': 'Oportunidad cerrada como perdida',
                'oportunidad': OportunidadDetailSerializer(oportunidad, context={'request': request}).data
            })
        except ValueError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=False, methods=['get'])
    def dashboard_pipeline(self, request):
        """
        GET /oportunidades/dashboard_pipeline/

        Retorna métricas del pipeline:
        - Oportunidades por etapa
        - Valor total por etapa
        - Tasa de conversión
        - Tiempo promedio en pipeline
        """
        # Obtener todas las oportunidades (schema isolation handles tenant filtering)
        oportunidades = Oportunidad.objects.all()
        activas = oportunidades.filter(etapa_actual__es_final=False)
        ganadas = oportunidades.filter(etapa_actual__es_ganada=True)
        perdidas = oportunidades.filter(etapa_actual__es_perdida=True)

        # Valores
        valor_total = activas.aggregate(
            total=Coalesce(Sum('valor_estimado'), Decimal('0.00'))
        )['total']

        # Valor ponderado (valor * probabilidad)
        valor_ponderado = activas.aggregate(
            total=Coalesce(
                Sum(F('valor_estimado') * F('probabilidad_cierre') / 100, output_field=DecimalField()),
                Decimal('0.00')
            )
        )['total']

        valor_ganado = ganadas.aggregate(
            total=Coalesce(Sum('valor_estimado'), Decimal('0.00'))
        )['total']

        valor_perdido = perdidas.aggregate(
            total=Coalesce(Sum('valor_estimado'), Decimal('0.00'))
        )['total']

        # Tasas de conversión
        total_oportunidades = oportunidades.count()
        if total_oportunidades > 0:
            tasa_conversion = (ganadas.count() / total_oportunidades) * 100
            tasa_perdida = (perdidas.count() / total_oportunidades) * 100
        else:
            tasa_conversion = 0
            tasa_perdida = 0

        # Ticket promedio
        if activas.count() > 0:
            ticket_promedio = valor_total / activas.count()
        else:
            ticket_promedio = Decimal('0.00')

        # Días promedio de cierre
        cerradas = oportunidades.filter(fecha_cierre_real__isnull=False)
        if cerradas.exists():
            dias_promedio = cerradas.aggregate(
                promedio=Avg(
                    Case(
                        When(fecha_cierre_real__isnull=False,
                             then=F('fecha_cierre_real') - F('fecha_creacion'))
                    )
                )
            )['promedio']
            dias_promedio_cierre = dias_promedio.days if dias_promedio else 0
        else:
            dias_promedio_cierre = 0

        # Oportunidades por etapa
        oportunidades_por_etapa = list(
            oportunidades.values(
                'etapa_actual__codigo',
                'etapa_actual__nombre',
                'etapa_actual__color',
                'etapa_actual__probabilidad_cierre'
            ).annotate(
                cantidad=Count('id'),
                valor_total=Coalesce(Sum('valor_estimado'), Decimal('0.00'))
            ).order_by('etapa_actual__orden')
        )

        # Oportunidades por fuente
        oportunidades_por_fuente = list(
            oportunidades.values(
                'fuente__codigo',
                'fuente__nombre'
            ).annotate(
                cantidad=Count('id'),
                valor_total=Coalesce(Sum('valor_estimado'), Decimal('0.00'))
            ).order_by('-cantidad')
        )

        # Motivos de pérdida
        motivos_perdida = list(
            perdidas.exclude(motivo_perdida__isnull=True).values(
                'motivo_perdida__codigo',
                'motivo_perdida__nombre'
            ).annotate(
                cantidad=Count('id')
            ).order_by('-cantidad')
        )

        data = {
            'total_oportunidades': total_oportunidades,
            'total_activas': activas.count(),
            'total_cerradas_ganadas': ganadas.count(),
            'total_cerradas_perdidas': perdidas.count(),
            'valor_total_pipeline': valor_total,
            'valor_ponderado': valor_ponderado,
            'valor_ganado': valor_ganado,
            'valor_perdido': valor_perdido,
            'tasa_conversion': round(tasa_conversion, 2),
            'tasa_perdida': round(tasa_perdida, 2),
            'ticket_promedio': ticket_promedio,
            'dias_promedio_cierre': dias_promedio_cierre,
            'oportunidades_por_etapa': oportunidades_por_etapa,
            'oportunidades_por_fuente': oportunidades_por_fuente,
            'motivos_perdida': motivos_perdida
        }

        serializer = DashboardPipelineSerializer(data)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def kanban(self, request):
        """
        GET /oportunidades/kanban/

        Retorna oportunidades agrupadas por etapa para vista Kanban
        """
        # Obtener etapas ordenadas (schema isolation handles tenant filtering)
        etapas = EtapaVenta.objects.filter(
            activo=True
        ).order_by('orden')

        kanban_data = []

        for etapa in etapas:
            oportunidades_etapa = Oportunidad.objects.filter(
                etapa_actual=etapa
            ).select_related(
                'cliente',
                'vendedor'
            ).order_by('-fecha_creacion')

            # Serializar oportunidades
            oportunidades_serialized = OportunidadListSerializer(
                oportunidades_etapa,
                many=True,
                context={'request': request}
            ).data

            # Calcular valor total de la etapa
            valor_total = sum(
                oportunidad.valor_estimado for oportunidad in oportunidades_etapa
            )

            kanban_data.append({
                'etapa': {
                    'id': etapa.id,
                    'codigo': etapa.codigo,
                    'nombre': etapa.nombre,
                    'color': etapa.color,
                    'probabilidad_cierre': etapa.probabilidad_cierre
                },
                'cantidad': oportunidades_etapa.count(),
                'valor_total': valor_total,
                'oportunidades': oportunidades_serialized
            })

        return Response(kanban_data)


# ==================== SEGUIMIENTOS ====================

class SeguimientoOportunidadViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión de seguimientos de oportunidades
    """
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['oportunidad', 'tipo_actividad', 'registrado_por']
    search_fields = ['descripcion', 'resultado']
    ordering_fields = ['fecha', 'created_at']
    ordering = ['-fecha']

    def get_queryset(self):
        return SeguimientoOportunidad.objects.select_related(
            'oportunidad',
            'registrado_por'
        ).all()

    def get_serializer_class(self):
        return SeguimientoOportunidadSerializer

    def perform_create(self, serializer):
        serializer.save(
            empresa=get_tenant_empresa(),
            registrado_por=self.request.user
        )


# ==================== COTIZACIONES ====================

class CotizacionViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión de cotizaciones

    Incluye acciones custom:
    - aprobar: Aprobar cotización
    - rechazar: Rechazar cotización
    - convertir_pedido: Convertir a pedido
    - clonar: Clonar cotización
    - enviar_email: Enviar cotización por email
    """
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['estado', 'cliente', 'vendedor', 'oportunidad']
    search_fields = ['codigo', 'cliente__razon_social']
    ordering_fields = ['fecha_cotizacion', 'fecha_vencimiento', 'total', 'created_at']
    ordering = ['-fecha_cotizacion']

    def get_queryset(self):
        queryset = Cotizacion.objects.select_related(
            'cliente',
            'vendedor',
            'oportunidad'
        ).prefetch_related(
            'detalles',
            'detalles__producto'
        )

        # Filtros adicionales
        params = self.request.query_params

        if params.get('fecha_desde'):
            queryset = queryset.filter(fecha_cotizacion__gte=params['fecha_desde'])
        if params.get('fecha_hasta'):
            queryset = queryset.filter(fecha_cotizacion__lte=params['fecha_hasta'])

        return queryset

    def get_serializer_class(self):
        if self.action == 'list':
            return CotizacionListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return CotizacionCreateUpdateSerializer
        return CotizacionDetailSerializer

    def perform_create(self, serializer):
        serializer.save(empresa=get_tenant_empresa())

    @action(detail=True, methods=['post'])
    def aprobar(self, request, pk=None):
        """
        POST /cotizaciones/{id}/aprobar/

        Marca la cotización como aprobada
        """
        cotizacion = self.get_object()

        if cotizacion.estado != 'ENVIADA':
            return Response(
                {'error': 'Solo se pueden aprobar cotizaciones en estado ENVIADA'},
                status=status.HTTP_400_BAD_REQUEST
            )

        cotizacion.aprobar()

        return Response({
            'message': 'Cotización aprobada exitosamente',
            'cotizacion': CotizacionDetailSerializer(cotizacion, context={'request': request}).data
        })

    @action(detail=True, methods=['post'])
    def rechazar(self, request, pk=None):
        """
        POST /cotizaciones/{id}/rechazar/

        Marca la cotización como rechazada
        """
        cotizacion = self.get_object()

        if cotizacion.estado != 'ENVIADA':
            return Response(
                {'error': 'Solo se pueden rechazar cotizaciones en estado ENVIADA'},
                status=status.HTTP_400_BAD_REQUEST
            )

        cotizacion.rechazar()

        return Response({
            'message': 'Cotización rechazada',
            'cotizacion': CotizacionDetailSerializer(cotizacion, context={'request': request}).data
        })

    @action(detail=True, methods=['post'])
    def convertir_pedido(self, request, pk=None):
        """
        POST /cotizaciones/{id}/convertir_pedido/

        Marca como convertida a pedido
        Nota: La creación real del pedido debe hacerse en otro módulo
        """
        cotizacion = self.get_object()

        if cotizacion.estado != 'APROBADA':
            return Response(
                {'error': 'Solo se pueden convertir cotizaciones aprobadas'},
                status=status.HTTP_400_BAD_REQUEST
            )

        cotizacion.convertir_a_pedido()

        return Response({
            'message': 'Cotización marcada como convertida',
            'cotizacion': CotizacionDetailSerializer(cotizacion, context={'request': request}).data
        })

    @action(detail=True, methods=['post'])
    def clonar(self, request, pk=None):
        """
        POST /cotizaciones/{id}/clonar/

        Crea una copia de la cotización
        """
        cotizacion_original = self.get_object()

        # Clonar
        nueva_cotizacion = cotizacion_original.clonar()

        return Response({
            'message': 'Cotización clonada exitosamente',
            'cotizacion': CotizacionDetailSerializer(nueva_cotizacion, context={'request': request}).data
        }, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def enviar_email(self, request, pk=None):
        """
        POST /cotizaciones/{id}/enviar_email/

        Body: {
            "destinatario": "email@example.com",
            "mensaje": "texto opcional"
        }

        Envía la cotización por correo electrónico
        """
        cotizacion = self.get_object()

        # TODO: Implementar lógica de envío de email
        # - Generar PDF de la cotización
        # - Enviar email con adjunto
        # - Actualizar estado a ENVIADA

        cotizacion.estado = 'ENVIADA'
        cotizacion.save(update_fields=['estado'])

        return Response({
            'message': 'Cotización enviada por email (funcionalidad pendiente de implementar)',
            'cotizacion': CotizacionDetailSerializer(cotizacion, context={'request': request}).data
        })


# ==================== HISTORIAL ====================

class HistorialEtapaViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet de solo lectura para historial de cambios de etapa
    """
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['oportunidad', 'etapa_anterior', 'etapa_nueva', 'cambiado_por']
    ordering_fields = ['fecha_cambio']
    ordering = ['-fecha_cambio']

    def get_queryset(self):
        return HistorialEtapa.objects.select_related(
            'oportunidad',
            'etapa_anterior',
            'etapa_nueva',
            'cambiado_por'
        )

    def get_serializer_class(self):
        return HistorialEtapaSerializer
