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
from rest_framework.permissions import IsAuthenticated
from apps.core.permissions import GranularActionPermission
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.shortcuts import get_object_or_404
from django.db import transaction
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
    TemaEncuestaSerializer,
    TemaEncuestaCreateSerializer,
    ParticipanteEncuestaSerializer,
    ParticipanteEncuestaCreateSerializer,
    RespuestaEncuestaSerializer,
    RespuestaEncuestaCreateSerializer,
    RespuestasLoteSerializer,
    EstadisticasEncuestaSerializer,
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
    permission_classes = [IsAuthenticated, GranularActionPermission]
    section_code = 'encuestas'
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
    permission_classes = [IsAuthenticated, GranularActionPermission]
    section_code = 'encuestas'

    def get_permissions(self):
        # Self-service: mis encuestas solo requiere autenticación (Mi Portal)
        if self.action == 'mis_encuestas':
            return [IsAuthenticated()]
        return super().get_permissions()
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['estado', 'analisis_dofa', 'tipo_encuesta']
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

    @action(detail=False, methods=['get'], url_path='mis-encuestas')
    def mis_encuestas(self, request):
        """
        Encuestas activas donde el usuario autenticado es participante.
        Incluye el estado de participación y progreso de respuesta del usuario.
        """
        from django.db.models import Q

        usuario = request.user
        cargo_id = getattr(usuario, 'cargo_id', None)
        area_id = getattr(usuario, 'area_id', None)

        q = Q(usuario=usuario)
        if cargo_id:
            q |= Q(tipo=ParticipanteEncuesta.TipoParticipante.CARGO, cargo_id=cargo_id)
        if area_id:
            q |= Q(tipo=ParticipanteEncuesta.TipoParticipante.AREA, area_id=area_id)

        encuesta_ids = ParticipanteEncuesta.objects.filter(
            q, encuesta__estado=EncuestaDofa.EstadoEncuesta.ACTIVA
        ).values_list('encuesta_id', flat=True).distinct()

        encuestas = EncuestaDofa.objects.filter(
            id__in=encuesta_ids
        ).prefetch_related('temas').order_by('-created_at')

        result = []
        for encuesta in encuestas:
            total_temas = encuesta.temas.count()
            total_mis_respuestas = RespuestaEncuesta.objects.filter(
                tema__encuesta=encuesta,
                respondente=usuario
            ).count()

            participante = ParticipanteEncuesta.objects.filter(
                q, encuesta=encuesta
            ).first()

            ya_respondio = total_temas > 0 and total_mis_respuestas >= total_temas

            serializer_data = EncuestaDofaListSerializer(
                encuesta, context={'request': request}
            ).data
            result.append({
                **serializer_data,
                'mi_estado_participacion': participante.estado if participante else 'pendiente',
                'ya_respondio': ya_respondio,
                'total_mis_respuestas': total_mis_respuestas,
            })

        return Response(result)

    @action(detail=True, methods=['post'], url_path='regenerar-temas')
    def regenerar_temas(self, request, pk=None):
        """
        Completa los temas PCI-POAM desde el banco de preguntas.
        Si la encuesta ya tiene algunos temas (ej. creada con seed incompleto),
        agrega solo los temas faltantes sin duplicar los existentes.
        """
        encuesta = self.get_object()

        if encuesta.tipo_encuesta != EncuestaDofa.TipoEncuesta.PCI_POAM:
            return Response(
                {'detail': 'Solo aplica para encuestas PCI-POAM'},
                status=status.HTTP_400_BAD_REQUEST
            )

        from .models import PreguntaContexto as PC
        preguntas_all = PC.objects.filter(is_active=True).order_by('orden')

        if not preguntas_all.exists():
            return Response(
                {'detail': 'No hay preguntas PCI-POAM en el sistema. Ejecute el seed primero.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Agregar solo preguntas que aún no tienen tema en esta encuesta
        existing_pregunta_ids = set(
            encuesta.temas.values_list('pregunta_contexto_id', flat=True)
        )
        preguntas_faltantes = preguntas_all.exclude(id__in=existing_pregunta_ids)

        if not preguntas_faltantes.exists():
            return Response({
                'detail': 'La encuesta ya tiene todos los temas del banco PCI-POAM.',
                'temas_creados': 0,
            })

        with transaction.atomic():
            temas_creados = 0
            for pregunta in preguntas_faltantes:
                TemaEncuesta.objects.create(
                    encuesta=encuesta,
                    empresa=encuesta.empresa,
                    pregunta_contexto=pregunta,
                    titulo=pregunta.texto[:500],
                    orden=pregunta.orden,
                )
                temas_creados += 1

        return Response({
            'detail': f'{temas_creados} temas agregados desde banco PCI-POAM',
            'temas_creados': temas_creados,
        })



class TemaEncuestaViewSet(StandardViewSetMixin, viewsets.ModelViewSet):
    """
    ViewSet para gestionar Temas de Encuesta.
    """

    queryset = TemaEncuesta.objects.select_related('encuesta', 'area').all()
    permission_classes = [IsAuthenticated, GranularActionPermission]
    section_code = 'encuestas'
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['encuesta', 'area']
    ordering_fields = ['orden', 'created_at']
    ordering = ['orden']

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return TemaEncuestaCreateSerializer
        return TemaEncuestaSerializer

    def perform_create(self, serializer):
        """Valida que encuesta esté presente al crear directamente."""
        if not serializer.validated_data.get('encuesta'):
            from rest_framework.exceptions import ValidationError
            raise ValidationError({'encuesta': 'Este campo es requerido.'})
        super().perform_create(serializer)


class ParticipanteEncuestaViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar Participantes de Encuesta.
    Nota: No usa StandardViewSetMixin porque ParticipanteEncuesta
    hereda TimestampedModel (sin is_active).
    """

    queryset = ParticipanteEncuesta.objects.select_related(
        'encuesta', 'usuario', 'area', 'cargo'
    ).all()
    permission_classes = [IsAuthenticated, GranularActionPermission]
    section_code = 'encuestas'
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['encuesta', 'tipo', 'estado']
    ordering_fields = ['created_at', 'estado']
    ordering = ['-created_at']

    def get_serializer_class(self):
        if self.action in ['create']:
            return ParticipanteEncuestaCreateSerializer
        return ParticipanteEncuestaSerializer

    def perform_create(self, serializer):
        """Valida que encuesta esté presente al crear directamente."""
        if not serializer.validated_data.get('encuesta'):
            from rest_framework.exceptions import ValidationError
            raise ValidationError({'encuesta': 'Este campo es requerido.'})
        serializer.save()


class RespuestaEncuestaViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar Respuestas de Encuesta.
    Nota: No usa StandardViewSetMixin porque RespuestaEncuesta
    hereda TimestampedModel (sin is_active).

    Permisos especiales:
    - create / partial_update: solo IsAuthenticated (empleados respondiendo su encuesta)
    - list / retrieve: GranularActionPermission (admins)
    """

    queryset = RespuestaEncuesta.objects.select_related(
        'tema', 'tema__encuesta', 'respondente'
    ).all()
    section_code = 'encuestas'
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['tema', 'tema__encuesta', 'clasificacion', 'respondente']
    ordering_fields = ['created_at']
    ordering = ['-created_at']

    def get_permissions(self):
        if self.action in ['create', 'partial_update', 'update']:
            return [IsAuthenticated()]
        return [IsAuthenticated(), GranularActionPermission()]

    def get_serializer_class(self):
        if self.action in ['create', 'partial_update', 'update']:
            return RespuestaEncuestaCreateSerializer
        return RespuestaEncuestaSerializer

    def perform_create(self, serializer):
        serializer.save(respondente=self.request.user)

    def perform_update(self, serializer):
        if serializer.instance.respondente != self.request.user:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('Solo puedes modificar tus propias respuestas.')
        serializer.save()


