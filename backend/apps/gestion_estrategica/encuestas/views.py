"""
Views para Encuestas Colaborativas DOFA + PCI-POAM
===================================================

ViewSets para gestión de encuestas, temas, participantes y respuestas.
Incluye endpoints públicos para diligenciamiento anónimo,
banco de preguntas PCI-POAM, compartir y QR.
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.shortcuts import get_object_or_404
from django.db import transaction
from django.http import HttpResponse
from django.utils import timezone

from apps.core.mixins import StandardViewSetMixin
from .models import (
    PreguntaContexto,
    EncuestaDofa,
    TemaEncuesta,
    ParticipanteEncuesta,
    RespuestaEncuesta
)
from .serializers import (
    PreguntaContextoSerializer,
    EncuestaDofaListSerializer,
    EncuestaDofaDetailSerializer,
    EncuestaDofaCreateSerializer,
    EncuestaDofaUpdateSerializer,
    EncuestaPublicaSerializer,
    TemaEncuestaSerializer,
    TemaEncuestaCreateSerializer,
    ParticipanteEncuestaSerializer,
    ParticipanteEncuestaCreateSerializer,
    RespuestaEncuestaSerializer,
    RespuestaEncuestaCreateSerializer,
    RespuestasLoteSerializer,
    EstadisticasEncuestaSerializer,
    CompartirEmailSerializer
)
from .services import EncuestaService


class PreguntaContextoViewSet(StandardViewSetMixin, viewsets.ReadOnlyModelViewSet):
    """
    ViewSet de solo lectura para banco de preguntas PCI-POAM.

    Endpoints:
    - GET /preguntas-contexto/ - Listar todas las preguntas
    - GET /preguntas-contexto/{id}/ - Detalle de pregunta
    """

    queryset = PreguntaContexto.objects.filter(
        is_active=True
    ).order_by('orden')
    serializer_class = PreguntaContextoSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = None
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ['perfil', 'capacidad_pci', 'factor_poam', 'clasificacion_esperada']
    search_fields = ['texto', 'codigo']


class EncuestaDofaViewSet(StandardViewSetMixin, viewsets.ModelViewSet):
    """
    ViewSet para gestionar Encuestas DOFA + PCI-POAM.

    Endpoints:
    - GET /encuestas/ - Listar encuestas
    - POST /encuestas/ - Crear encuesta (libre o PCI-POAM)
    - GET /encuestas/{id}/ - Detalle de encuesta
    - PUT/PATCH /encuestas/{id}/ - Actualizar encuesta
    - DELETE /encuestas/{id}/ - Eliminar encuesta
    - POST /encuestas/{id}/activar/ - Activar encuesta
    - POST /encuestas/{id}/cerrar/ - Cerrar encuesta
    - POST /encuestas/{id}/enviar-notificaciones/ - Enviar invitaciones
    - POST /encuestas/{id}/enviar-recordatorio/ - Enviar recordatorio
    - GET /encuestas/{id}/estadisticas/ - Ver estadísticas
    - POST /encuestas/{id}/consolidar/ - Consolidar en DOFA + PESTEL
    - POST /encuestas/{id}/compartir-email/ - Compartir por email
    - GET /encuestas/{id}/qr-code/ - Generar QR code PNG
    """

    queryset = EncuestaDofa.objects.select_related(
        'analisis_dofa', 'analisis_pestel', 'responsable'
    ).prefetch_related('temas', 'participantes').all()
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['estado', 'es_publica', 'analisis_dofa', 'tipo_encuesta']
    search_fields = ['titulo', 'descripcion']
    ordering_fields = ['fecha_inicio', 'fecha_cierre', 'created_at']
    ordering = ['-created_at']

    def get_serializer_class(self):
        if self.action == 'list':
            return EncuestaDofaListSerializer
        elif self.action == 'create':
            return EncuestaDofaCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return EncuestaDofaUpdateSerializer
        return EncuestaDofaDetailSerializer

    @action(detail=True, methods=['post'])
    def activar(self, request, pk=None):
        """Activa la encuesta para recibir respuestas"""
        encuesta = self.get_object()

        if encuesta.estado != EncuestaDofa.EstadoEncuesta.BORRADOR:
            return Response(
                {'detail': 'Solo se pueden activar encuestas en borrador'},
                status=status.HTTP_400_BAD_REQUEST
            )

        encuesta.activar()
        return Response({
            'detail': 'Encuesta activada exitosamente',
            'estado': encuesta.estado
        })

    @action(detail=True, methods=['post'])
    def cerrar(self, request, pk=None):
        """Cierra la encuesta"""
        encuesta = self.get_object()

        if encuesta.estado != EncuestaDofa.EstadoEncuesta.ACTIVA:
            return Response(
                {'detail': 'Solo se pueden cerrar encuestas activas'},
                status=status.HTTP_400_BAD_REQUEST
            )

        encuesta.cerrar()
        return Response({
            'detail': 'Encuesta cerrada exitosamente',
            'estado': encuesta.estado
        })

    @action(detail=True, methods=['post'], url_path='enviar-notificaciones')
    def enviar_notificaciones(self, request, pk=None):
        """Envía notificaciones de invitación a los participantes"""
        encuesta = self.get_object()

        if encuesta.estado not in [
            EncuestaDofa.EstadoEncuesta.BORRADOR,
            EncuestaDofa.EstadoEncuesta.ACTIVA
        ]:
            return Response(
                {'detail': 'La encuesta debe estar en borrador o activa'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Si está en borrador, activarla primero
        if encuesta.estado == EncuestaDofa.EstadoEncuesta.BORRADOR:
            encuesta.activar()

        resultado = EncuestaService.enviar_notificaciones(encuesta)

        if resultado['success']:
            return Response(resultado)
        return Response(resultado, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'], url_path='enviar-recordatorio')
    def enviar_recordatorio(self, request, pk=None):
        """Envía recordatorio a participantes que no han respondido"""
        encuesta = self.get_object()

        if not encuesta.esta_vigente:
            return Response(
                {'detail': 'La encuesta no está vigente'},
                status=status.HTTP_400_BAD_REQUEST
            )

        resultado = EncuestaService.enviar_recordatorio(encuesta)

        if resultado['success']:
            return Response(resultado)
        return Response(resultado, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['get'])
    def estadisticas(self, request, pk=None):
        """Obtiene estadísticas detalladas de la encuesta"""
        encuesta = self.get_object()
        stats = EncuestaService.obtener_estadisticas(encuesta)
        serializer = EstadisticasEncuestaSerializer(stats)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def consolidar(self, request, pk=None):
        """Consolida las respuestas en factores DOFA (y PESTEL para PCI-POAM)"""
        encuesta = self.get_object()

        umbral = request.data.get('umbral_consenso', 0.6)

        try:
            umbral = float(umbral)
            if not 0 < umbral <= 1:
                raise ValueError()
        except (TypeError, ValueError):
            return Response(
                {'detail': 'El umbral debe ser un número entre 0 y 1'},
                status=status.HTTP_400_BAD_REQUEST
            )

        resultado = EncuestaService.consolidar(encuesta, umbral)

        if resultado['success']:
            return Response(resultado)
        return Response(resultado, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'], url_path='regenerar-temas')
    def regenerar_temas(self, request, pk=None):
        """
        Regenera los temas PCI-POAM desde el banco de preguntas.
        Útil si la encuesta se creó antes de cargar el seed o con error.
        Solo funciona para encuestas PCI-POAM en borrador con 0 temas.
        """
        encuesta = self.get_object()

        if encuesta.tipo_encuesta != EncuestaDofa.TipoEncuesta.PCI_POAM:
            return Response(
                {'detail': 'Solo aplica para encuestas PCI-POAM'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if encuesta.temas.exists():
            return Response(
                {'detail': 'Esta encuesta ya tiene temas. Elimínelos primero si desea regenerar.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        from .models import PreguntaContexto as PC
        preguntas = PC.objects.filter(is_active=True).order_by('orden')

        if not preguntas.exists():
            return Response(
                {'detail': 'No hay preguntas PCI-POAM en el sistema. Ejecute el seed primero.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        with transaction.atomic():
            temas_creados = 0
            for pregunta in preguntas:
                TemaEncuesta.objects.create(
                    encuesta=encuesta,
                    empresa=encuesta.empresa,
                    pregunta_contexto=pregunta,
                    titulo=pregunta.texto[:500],
                    orden=pregunta.orden,
                )
                temas_creados += 1

        return Response({
            'detail': f'{temas_creados} temas generados desde banco PCI-POAM',
            'temas_creados': temas_creados,
        })

    @action(detail=True, methods=['post'], url_path='compartir-email')
    def compartir_email(self, request, pk=None):
        """Envía enlace de encuesta a emails externos"""
        encuesta = self.get_object()

        serializer = CompartirEmailSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Construir base_url del frontend desde el request
        base_url = f"{request.scheme}://{request.get_host()}"

        resultado = EncuestaService.compartir_por_email(
            encuesta=encuesta,
            emails=serializer.validated_data['emails'],
            mensaje_personalizado=serializer.validated_data.get(
                'mensaje_personalizado', ''
            ),
            base_url=base_url
        )

        if resultado['success']:
            return Response(resultado)
        return Response(resultado, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['get'], url_path='qr-code')
    def qr_code(self, request, pk=None):
        """Genera QR code PNG con el enlace público de la encuesta"""
        encuesta = self.get_object()

        # Construir base_url del frontend desde el request
        base_url = f"{request.scheme}://{request.get_host()}"

        qr_buffer = EncuestaService.generar_qr_code(
            encuesta=encuesta,
            base_url=base_url
        )

        if qr_buffer is None:
            return Response(
                {'detail': 'No se pudo generar el QR code'},
                status=status.HTTP_400_BAD_REQUEST
            )

        response = HttpResponse(
            qr_buffer,
            content_type='image/png'
        )
        response['Content-Disposition'] = (
            f'inline; filename="encuesta-{encuesta.pk}-qr.png"'
        )
        return response


class TemaEncuestaViewSet(StandardViewSetMixin, viewsets.ModelViewSet):
    """
    ViewSet para gestionar Temas de Encuesta.
    """

    queryset = TemaEncuesta.objects.select_related('encuesta', 'area').all()
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['encuesta', 'area']
    ordering_fields = ['orden', 'created_at']
    ordering = ['orden']

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return TemaEncuestaCreateSerializer
        return TemaEncuestaSerializer


class ParticipanteEncuestaViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar Participantes de Encuesta.
    Nota: No usa StandardViewSetMixin porque ParticipanteEncuesta
    hereda TimestampedModel (sin is_active).
    """

    queryset = ParticipanteEncuesta.objects.select_related(
        'encuesta', 'usuario', 'area', 'cargo'
    ).all()
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['encuesta', 'tipo', 'estado']
    ordering_fields = ['created_at', 'estado']
    ordering = ['-created_at']

    def get_serializer_class(self):
        if self.action in ['create']:
            return ParticipanteEncuestaCreateSerializer
        return ParticipanteEncuestaSerializer


class RespuestaEncuestaViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar Respuestas de Encuesta.
    Nota: No usa StandardViewSetMixin porque RespuestaEncuesta
    hereda TimestampedModel (sin is_active).
    """

    queryset = RespuestaEncuesta.objects.select_related(
        'tema', 'tema__encuesta', 'respondente'
    ).all()
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['tema', 'tema__encuesta', 'clasificacion', 'respondente']
    ordering_fields = ['created_at']
    ordering = ['-created_at']

    def get_serializer_class(self):
        if self.action in ['create']:
            return RespuestaEncuestaCreateSerializer
        return RespuestaEncuestaSerializer


# ==============================================================================
# ENDPOINTS PÚBLICOS (SIN AUTENTICACIÓN)
# ==============================================================================

class EncuestaPublicaView(APIView):
    """
    Vista pública para acceder a encuestas mediante token.

    GET /encuestas/publica/{token}/
    - Obtiene la encuesta y sus temas para diligenciamiento

    POST /encuestas/publica/{token}/
    - Envía las respuestas de la encuesta
    """
    # Autenticación opcional: si hay JWT válido identifica al usuario,
    # si no hay JWT permite acceso anónimo (encuesta pública).
    permission_classes = [AllowAny]

    def get(self, request, token):
        """Obtiene la encuesta pública por token"""
        encuesta = get_object_or_404(
            EncuestaDofa.objects.prefetch_related(
                'temas',
                'temas__pregunta_contexto',
                'temas__area',
            ),
            token_publico=token
        )

        # Verificar si puede responder
        token_anonimo = request.session.get(f'encuesta_token_{token}')
        verificacion = EncuestaService.puede_responder(
            encuesta,
            usuario=request.user if request.user.is_authenticated else None,
            token_anonimo=token_anonimo
        )

        if not verificacion['puede'] and verificacion['razon'] != 'Ya has respondido esta encuesta':
            if not encuesta.es_publica and not request.user.is_authenticated:
                return Response(
                    {'detail': 'Esta encuesta requiere autenticación'},
                    status=status.HTTP_401_UNAUTHORIZED
                )

        serializer = EncuestaPublicaSerializer(encuesta)
        data = serializer.data
        data['puede_responder'] = verificacion['puede']
        data['razon'] = verificacion['razon']

        return Response(data)

    @transaction.atomic
    def post(self, request, token):
        """Envía respuestas a la encuesta pública"""
        encuesta = get_object_or_404(EncuestaDofa, token_publico=token)

        # Generar o recuperar token anónimo
        session_key = f'encuesta_token_{token}'
        token_anonimo = request.session.get(session_key)

        if not token_anonimo and not request.user.is_authenticated:
            token_anonimo = EncuestaService.generar_token_anonimo(
                ip=self.get_client_ip(request),
                user_agent=request.META.get('HTTP_USER_AGENT', '')
            )
            request.session[session_key] = token_anonimo

        # Verificar si puede responder
        verificacion = EncuestaService.puede_responder(
            encuesta,
            usuario=request.user if request.user.is_authenticated else None,
            token_anonimo=token_anonimo
        )

        if not verificacion['puede']:
            return Response(
                {'detail': verificacion['razon']},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validar respuestas
        serializer = RespuestasLoteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        respuestas_data = serializer.validated_data['respuestas']
        respuestas_creadas = []

        for resp_data in respuestas_data:
            tema = get_object_or_404(TemaEncuesta, id=resp_data['tema_id'], encuesta=encuesta)

            # Crear respuesta
            respuesta = RespuestaEncuesta.objects.create(
                tema=tema,
                respondente=request.user if request.user.is_authenticated else None,
                token_anonimo=token_anonimo if not request.user.is_authenticated else '',
                clasificacion=resp_data['clasificacion'],
                justificacion=resp_data.get('justificacion', ''),
                impacto_percibido=resp_data.get(
                    'impacto_percibido',
                    RespuestaEncuesta.NivelImpacto.MEDIO
                ),
                ip_address=self.get_client_ip(request),
                user_agent=request.META.get('HTTP_USER_AGENT', '')
            )
            respuestas_creadas.append(respuesta.id)

        # Actualizar estadísticas
        encuesta.actualizar_estadisticas()

        # Actualizar participante si es usuario autenticado
        if request.user.is_authenticated:
            ParticipanteEncuesta.objects.filter(
                encuesta=encuesta,
                usuario=request.user
            ).update(
                estado=ParticipanteEncuesta.EstadoParticipacion.COMPLETADO,
                fecha_completado=timezone.now()
            )

        return Response({
            'detail': 'Respuestas guardadas exitosamente',
            'respuestas_creadas': len(respuestas_creadas)
        }, status=status.HTTP_201_CREATED)

    def get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip
