"""
Views para Servicio al Cliente - Sales CRM
Sistema de Gestión Grasas y Huesos del Norte
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q, Count, Avg, F, Case, When, IntegerField, Sum
from django.utils import timezone
from datetime import timedelta

from .models import (
    TipoPQRS, EstadoPQRS, PrioridadPQRS, CanalRecepcion, NivelSatisfaccion,
    PQRS, SeguimientoPQRS,
    EncuestaSatisfaccion, PreguntaEncuesta, RespuestaEncuesta,
    ProgramaFidelizacion, PuntosFidelizacion, MovimientoPuntos
)
from .serializers import (
    TipoPQRSSerializer, EstadoPQRSSerializer, PrioridadPQRSSerializer,
    CanalRecepcionSerializer, NivelSatisfaccionSerializer,
    PQRSSerializer, PQRSListSerializer,
    SeguimientoPQRSSerializer,
    EncuestaSatisfaccionSerializer, EncuestaSatisfaccionListSerializer,
    ResponderEncuestaSerializer, PreguntaEncuestaSerializer, RespuestaEncuestaSerializer,
    ProgramaFidelizacionSerializer, PuntosFidelizacionSerializer,
    AcumularPuntosSerializer, CanjearPuntosSerializer, MovimientoPuntosSerializer
)


# ==============================================================================
# VIEWSETS DE CATÁLOGOS
# ==============================================================================

class TipoPQRSViewSet(viewsets.ModelViewSet):
    """ViewSet para Tipos de PQRS"""
    queryset = TipoPQRS.objects.all()
    serializer_class = TipoPQRSSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['is_active', 'requiere_investigacion']
    search_fields = ['codigo', 'nombre']
    ordering_fields = ['orden', 'nombre']
    ordering = ['orden', 'nombre']

    def get_queryset(self):
        queryset = super().get_queryset()
        # Por defecto, solo mostrar activos
        if self.action == 'list' and not self.request.query_params.get('all'):
            queryset = queryset.filter(is_active=True)
        return queryset


class EstadoPQRSViewSet(viewsets.ModelViewSet):
    """ViewSet para Estados de PQRS"""
    queryset = EstadoPQRS.objects.all()
    serializer_class = EstadoPQRSSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['is_active', 'es_inicial', 'es_final']
    search_fields = ['codigo', 'nombre']
    ordering_fields = ['orden', 'nombre']
    ordering = ['orden', 'nombre']

    def get_queryset(self):
        queryset = super().get_queryset()
        if self.action == 'list' and not self.request.query_params.get('all'):
            queryset = queryset.filter(is_active=True)
        return queryset


class PrioridadPQRSViewSet(viewsets.ModelViewSet):
    """ViewSet para Prioridades de PQRS"""
    queryset = PrioridadPQRS.objects.all()
    serializer_class = PrioridadPQRSSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['is_active']
    search_fields = ['codigo', 'nombre']
    ordering_fields = ['nivel', 'orden', 'nombre']
    ordering = ['-nivel', 'orden']

    def get_queryset(self):
        queryset = super().get_queryset()
        if self.action == 'list' and not self.request.query_params.get('all'):
            queryset = queryset.filter(is_active=True)
        return queryset


class CanalRecepcionViewSet(viewsets.ModelViewSet):
    """ViewSet para Canales de Recepción"""
    queryset = CanalRecepcion.objects.all()
    serializer_class = CanalRecepcionSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['is_active']
    search_fields = ['codigo', 'nombre']
    ordering_fields = ['orden', 'nombre']
    ordering = ['orden', 'nombre']

    def get_queryset(self):
        queryset = super().get_queryset()
        if self.action == 'list' and not self.request.query_params.get('all'):
            queryset = queryset.filter(is_active=True)
        return queryset


class NivelSatisfaccionViewSet(viewsets.ModelViewSet):
    """ViewSet para Niveles de Satisfacción"""
    queryset = NivelSatisfaccion.objects.all()
    serializer_class = NivelSatisfaccionSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['is_active']
    search_fields = ['codigo', 'nombre']
    ordering_fields = ['valor_numerico', 'orden']
    ordering = ['valor_numerico', 'orden']

    def get_queryset(self):
        queryset = super().get_queryset()
        if self.action == 'list' and not self.request.query_params.get('all'):
            queryset = queryset.filter(is_active=True)
        return queryset


# ==============================================================================
# VIEWSETS DE PQRS
# ==============================================================================

class PQRSViewSet(viewsets.ModelViewSet):
    """ViewSet para PQRS"""
    permission_classes = [IsAuthenticated]
    filterset_fields = ['tipo', 'estado', 'prioridad', 'asignado_a', 'cliente', 'canal_recepcion']
    search_fields = ['codigo', 'asunto', 'descripcion', 'contacto_nombre']
    ordering_fields = ['fecha_radicacion', 'fecha_vencimiento_sla', 'prioridad__nivel']
    ordering = ['-fecha_radicacion']

    def get_queryset(self):
        queryset = PQRS.objects.select_related(
            'tipo', 'estado', 'prioridad', 'canal_recepcion',
            'asignado_a', 'escalado_a', 'cliente',
            'producto_relacionado', 'pedido_relacionado'
        ).prefetch_related('seguimientos').filter(deleted_at__isnull=True)

        # Filtro por empresa del usuario
        if hasattr(self.request.user, 'empresa'):
            queryset = queryset.filter(empresa=self.request.user.empresa)

        return queryset

    def get_serializer_class(self):
        if self.action == 'list':
            return PQRSListSerializer
        return PQRSSerializer

    @action(detail=True, methods=['post'])
    def asignar(self, request, pk=None):
        """Asigna PQRS a un usuario"""
        pqrs = self.get_object()
        usuario_id = request.data.get('usuario_id')

        if not usuario_id:
            return Response(
                {'error': 'Debe proporcionar usuario_id'},
                status=status.HTTP_400_BAD_REQUEST
            )

        from django.contrib.auth import get_user_model
        User = get_user_model()

        try:
            usuario = User.objects.get(pk=usuario_id)
        except User.DoesNotExist:
            return Response(
                {'error': 'Usuario no encontrado'},
                status=status.HTTP_404_NOT_FOUND
            )

        pqrs.asignar(usuario)

        # Registrar seguimiento
        SeguimientoPQRS.objects.create(
            pqrs=pqrs,
            tipo_accion='ASIGNACION',
            descripcion=f'PQRS asignada a {usuario.get_full_name()}',
            es_visible_cliente=False,
            registrado_por=request.user
        )

        serializer = self.get_serializer(pqrs)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def escalar(self, request, pk=None):
        """Escala PQRS a un nivel superior"""
        pqrs = self.get_object()
        usuario_id = request.data.get('usuario_id')
        motivo = request.data.get('motivo', '')

        if not usuario_id:
            return Response(
                {'error': 'Debe proporcionar usuario_id'},
                status=status.HTTP_400_BAD_REQUEST
            )

        from django.contrib.auth import get_user_model
        User = get_user_model()

        try:
            usuario = User.objects.get(pk=usuario_id)
        except User.DoesNotExist:
            return Response(
                {'error': 'Usuario no encontrado'},
                status=status.HTTP_404_NOT_FOUND
            )

        pqrs.escalar(usuario)

        # Registrar seguimiento
        SeguimientoPQRS.objects.create(
            pqrs=pqrs,
            tipo_accion='ESCALAMIENTO',
            descripcion=f'PQRS escalada a {usuario.get_full_name()}. Motivo: {motivo}',
            es_visible_cliente=False,
            registrado_por=request.user
        )

        serializer = self.get_serializer(pqrs)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def resolver(self, request, pk=None):
        """Marca PQRS como resuelta"""
        pqrs = self.get_object()
        solucion = request.data.get('solucion')

        if not solucion:
            return Response(
                {'error': 'Debe proporcionar la solución implementada'},
                status=status.HTTP_400_BAD_REQUEST
            )

        pqrs.resolver(solucion, request.user)

        # Registrar seguimiento
        SeguimientoPQRS.objects.create(
            pqrs=pqrs,
            tipo_accion='RESOLUCION',
            descripcion=f'PQRS resuelta: {solucion}',
            es_visible_cliente=True,
            registrado_por=request.user
        )

        serializer = self.get_serializer(pqrs)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def cerrar(self, request, pk=None):
        """Cierra PQRS"""
        pqrs = self.get_object()
        comentario = request.data.get('comentario', '')

        pqrs.cerrar()

        # Registrar seguimiento
        SeguimientoPQRS.objects.create(
            pqrs=pqrs,
            tipo_accion='CIERRE',
            descripcion=f'PQRS cerrada. {comentario}',
            es_visible_cliente=False,
            registrado_por=request.user
        )

        serializer = self.get_serializer(pqrs)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def dashboard_pqrs(self, request):
        """Dashboard con métricas de PQRS"""
        queryset = self.get_queryset()
        fecha_inicio = request.query_params.get('fecha_inicio')
        fecha_fin = request.query_params.get('fecha_fin')

        if fecha_inicio:
            queryset = queryset.filter(fecha_radicacion__gte=fecha_inicio)
        if fecha_fin:
            queryset = queryset.filter(fecha_radicacion__lte=fecha_fin)

        # Métricas por tipo
        por_tipo = queryset.values('tipo__nombre', 'tipo__color_hex').annotate(
            total=Count('id')
        ).order_by('-total')

        # Métricas por estado
        por_estado = queryset.values('estado__nombre', 'estado__color_hex').annotate(
            total=Count('id')
        ).order_by('-total')

        # Métricas por prioridad
        por_prioridad = queryset.values(
            'prioridad__nombre', 'prioridad__color_hex', 'prioridad__nivel'
        ).annotate(
            total=Count('id')
        ).order_by('-prioridad__nivel')

        # Tiempo promedio de respuesta
        resueltas = queryset.filter(fecha_respuesta__isnull=False)
        tiempo_promedio = resueltas.aggregate(Avg('dias_respuesta'))['dias_respuesta__avg'] or 0

        # PQRS vencidas
        vencidas = queryset.filter(
            fecha_vencimiento_sla__lt=timezone.now(),
            fecha_respuesta__isnull=True
        ).count()

        # Cumplimiento de SLA
        total_cerradas = resueltas.count()
        if total_cerradas > 0:
            dentro_sla = resueltas.filter(
                fecha_respuesta__lte=F('fecha_vencimiento_sla')
            ).count()
            cumplimiento_sla = (dentro_sla / total_cerradas) * 100
        else:
            cumplimiento_sla = 0

        return Response({
            'total': queryset.count(),
            'por_tipo': list(por_tipo),
            'por_estado': list(por_estado),
            'por_prioridad': list(por_prioridad),
            'tiempo_promedio_respuesta_dias': round(tiempo_promedio, 1),
            'vencidas': vencidas,
            'cumplimiento_sla_porcentaje': round(cumplimiento_sla, 1),
        })

    @action(detail=False, methods=['get'])
    def vencidas(self, request):
        """Lista PQRS vencidas o próximas a vencer"""
        queryset = self.get_queryset()
        horas_limite = int(request.query_params.get('horas', 48))

        # Vencidas
        vencidas = queryset.filter(
            fecha_vencimiento_sla__lt=timezone.now(),
            fecha_respuesta__isnull=True
        )

        # Próximas a vencer
        limite = timezone.now() + timedelta(hours=horas_limite)
        proximas = queryset.filter(
            fecha_vencimiento_sla__gte=timezone.now(),
            fecha_vencimiento_sla__lte=limite,
            fecha_respuesta__isnull=True
        )

        return Response({
            'vencidas': PQRSListSerializer(vencidas, many=True).data,
            'proximas_vencer': PQRSListSerializer(proximas, many=True).data,
        })

    @action(detail=False, methods=['get'])
    def mis_asignadas(self, request):
        """Lista PQRS asignadas al usuario actual"""
        queryset = self.get_queryset().filter(
            asignado_a=request.user,
            estado__es_final=False
        )

        serializer = PQRSListSerializer(queryset, many=True)
        return Response(serializer.data)


class SeguimientoPQRSViewSet(viewsets.ModelViewSet):
    """ViewSet para Seguimiento de PQRS"""
    serializer_class = SeguimientoPQRSSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['pqrs', 'tipo_accion', 'es_visible_cliente']
    ordering = ['-fecha']

    def get_queryset(self):
        return SeguimientoPQRS.objects.select_related(
            'pqrs', 'registrado_por'
        ).all()


# ==============================================================================
# VIEWSETS DE ENCUESTAS
# ==============================================================================

class EncuestaSatisfaccionViewSet(viewsets.ModelViewSet):
    """ViewSet para Encuestas de Satisfacción"""
    permission_classes = [IsAuthenticated]
    filterset_fields = ['cliente', 'estado', 'pedido', 'factura']
    search_fields = ['codigo', 'cliente__nombre']
    ordering_fields = ['fecha_envio', 'fecha_respuesta', 'nps_score']
    ordering = ['-fecha_envio']

    def get_queryset(self):
        queryset = EncuestaSatisfaccion.objects.select_related(
            'cliente', 'pedido', 'factura', 'satisfaccion_general', 'enviada_por'
        ).prefetch_related('respuestas').filter(deleted_at__isnull=True)

        if hasattr(self.request.user, 'empresa'):
            queryset = queryset.filter(empresa=self.request.user.empresa)

        return queryset

    def get_serializer_class(self):
        if self.action == 'list':
            return EncuestaSatisfaccionListSerializer
        return EncuestaSatisfaccionSerializer

    @action(detail=True, methods=['post'])
    def enviar(self, request, pk=None):
        """Marca encuesta como enviada"""
        encuesta = self.get_object()

        if encuesta.estado != 'ENVIADA':
            return Response(
                {'error': 'La encuesta ya ha sido procesada'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Aquí iría la lógica para enviar email al cliente
        # Por ahora solo confirmamos el envío

        return Response({
            'message': 'Encuesta enviada exitosamente',
            'codigo': encuesta.codigo
        })

    @action(detail=True, methods=['post'])
    def responder(self, request, pk=None):
        """Registra respuesta de encuesta"""
        encuesta = self.get_object()

        if encuesta.estado == 'RESPONDIDA':
            return Response(
                {'error': 'Esta encuesta ya ha sido respondida'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if encuesta.estado == 'VENCIDA':
            return Response(
                {'error': 'Esta encuesta ya ha vencido'},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = ResponderEncuestaSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data

        # Registrar respuesta principal
        encuesta.responder(
            satisfaccion=data['satisfaccion_general'],
            nps_score=data['nps_score'],
            comentarios=data.get('comentarios', ''),
            sugerencias=data.get('sugerencias', '')
        )

        # Registrar respuestas a preguntas específicas
        respuestas_data = data.get('respuestas', [])
        for resp in respuestas_data:
            RespuestaEncuesta.objects.create(
                encuesta=encuesta,
                pregunta_id=resp['pregunta'],
                respuesta_texto=resp.get('respuesta_texto'),
                respuesta_valor=resp.get('respuesta_valor')
            )

        return Response({
            'message': 'Respuesta registrada exitosamente',
            'categoria_nps': encuesta.categoria_nps
        })

    @action(detail=False, methods=['get'])
    def nps_dashboard(self, request):
        """Dashboard NPS: promotores, pasivos, detractores, score"""
        queryset = self.get_queryset().filter(
            estado='RESPONDIDA',
            nps_score__isnull=False
        )

        fecha_inicio = request.query_params.get('fecha_inicio')
        fecha_fin = request.query_params.get('fecha_fin')

        if fecha_inicio:
            queryset = queryset.filter(fecha_respuesta__gte=fecha_inicio)
        if fecha_fin:
            queryset = queryset.filter(fecha_respuesta__lte=fecha_fin)

        total = queryset.count()

        if total == 0:
            return Response({
                'total_respuestas': 0,
                'promotores': 0,
                'pasivos': 0,
                'detractores': 0,
                'nps_score': 0,
                'promedio_satisfaccion': 0
            })

        # Clasificar según NPS
        promotores = queryset.filter(nps_score__gte=9).count()
        pasivos = queryset.filter(nps_score__gte=7, nps_score__lte=8).count()
        detractores = queryset.filter(nps_score__lte=6).count()

        # Calcular NPS Score: % Promotores - % Detractores
        nps_score = ((promotores - detractores) / total) * 100

        # Promedio de satisfacción general
        promedio_satisfaccion = queryset.filter(
            satisfaccion_general__isnull=False
        ).aggregate(
            Avg('satisfaccion_general__valor_numerico')
        )['satisfaccion_general__valor_numerico__avg'] or 0

        return Response({
            'total_respuestas': total,
            'promotores': promotores,
            'promotores_porcentaje': round((promotores / total) * 100, 1),
            'pasivos': pasivos,
            'pasivos_porcentaje': round((pasivos / total) * 100, 1),
            'detractores': detractores,
            'detractores_porcentaje': round((detractores / total) * 100, 1),
            'nps_score': round(nps_score, 1),
            'promedio_satisfaccion': round(promedio_satisfaccion, 2),
        })


class PreguntaEncuestaViewSet(viewsets.ModelViewSet):
    """ViewSet para Preguntas de Encuesta"""
    queryset = PreguntaEncuesta.objects.all()
    serializer_class = PreguntaEncuestaSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['tipo_respuesta', 'es_obligatoria', 'is_active']
    search_fields = ['codigo', 'pregunta']
    ordering_fields = ['orden', 'pregunta']
    ordering = ['orden', 'pregunta']

    def get_queryset(self):
        queryset = super().get_queryset()
        if self.action == 'list' and not self.request.query_params.get('all'):
            queryset = queryset.filter(is_active=True)
        return queryset


# ==============================================================================
# VIEWSETS DE FIDELIZACIÓN
# ==============================================================================

class ProgramaFidelizacionViewSet(viewsets.ModelViewSet):
    """ViewSet para Programas de Fidelización"""
    serializer_class = ProgramaFidelizacionSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['is_active']
    search_fields = ['codigo', 'nombre']
    ordering = ['-created_at']

    def get_queryset(self):
        queryset = ProgramaFidelizacion.objects.select_related('created_by').all()

        if hasattr(self.request.user, 'empresa'):
            queryset = queryset.filter(empresa=self.request.user.empresa)

        return queryset


class PuntosFidelizacionViewSet(viewsets.ModelViewSet):
    """ViewSet para Puntos de Fidelización"""
    serializer_class = PuntosFidelizacionSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['cliente', 'programa', 'nivel_actual']
    search_fields = ['cliente__nombre']
    ordering = ['-puntos_disponibles']

    def get_queryset(self):
        return PuntosFidelizacion.objects.select_related(
            'cliente', 'programa'
        ).prefetch_related('movimientos').all()

    @action(detail=True, methods=['post'])
    def acumular_puntos(self, request, pk=None):
        """Acumula puntos a un cliente"""
        puntos_cliente = self.get_object()
        serializer = AcumularPuntosSerializer(
            data=request.data,
            context={'request': request}
        )

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        puntos_cliente.acumular(
            puntos=data['puntos'],
            factura=data.get('factura'),
            descripcion=data.get('descripcion', 'Acumulación manual')
        )

        return Response({
            'message': 'Puntos acumulados exitosamente',
            'puntos_acumulados': data['puntos'],
            'puntos_disponibles': puntos_cliente.puntos_disponibles,
            'nivel_actual': puntos_cliente.nivel_actual
        })

    @action(detail=True, methods=['post'])
    def canjear(self, request, pk=None):
        """Canjea puntos del cliente"""
        puntos_cliente = self.get_object()
        serializer = CanjearPuntosSerializer(
            data=request.data,
            context={'puntos_cliente': puntos_cliente}
        )

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data

        try:
            puntos_cliente.canjear(
                puntos=data['puntos'],
                descripcion=data['descripcion']
            )
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

        return Response({
            'message': 'Puntos canjeados exitosamente',
            'puntos_canjeados': data['puntos'],
            'puntos_disponibles': puntos_cliente.puntos_disponibles
        })

    @action(detail=True, methods=['get'])
    def consultar_saldo(self, request, pk=None):
        """Consulta saldo de puntos del cliente"""
        puntos_cliente = self.get_object()

        return Response({
            'cliente': puntos_cliente.cliente.nombre,
            'programa': puntos_cliente.programa.nombre,
            'puntos_acumulados': puntos_cliente.puntos_acumulados,
            'puntos_canjeados': puntos_cliente.puntos_canjeados,
            'puntos_disponibles': puntos_cliente.puntos_disponibles,
            'nivel_actual': puntos_cliente.get_nivel_actual_display(),
            'puntos_para_siguiente_nivel': puntos_cliente.puntos_para_siguiente_nivel,
            'beneficios': self.get_serializer(puntos_cliente).data.get('beneficios_actuales')
        })


class MovimientoPuntosViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet para Movimientos de Puntos (solo lectura)"""
    serializer_class = MovimientoPuntosSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['puntos_cliente', 'tipo', 'factura']
    ordering = ['-fecha']

    def get_queryset(self):
        return MovimientoPuntos.objects.select_related(
            'puntos_cliente', 'factura', 'registrado_por'
        ).all()
