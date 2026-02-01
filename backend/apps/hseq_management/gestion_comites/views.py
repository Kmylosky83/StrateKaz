"""
Views para Gestión de Comités HSEQ
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.db import transaction
from django.db.models import Q, Count, Avg

from .models import (
    TipoComite, Comite, MiembroComite, Reunion, AsistenciaReunion,
    ActaReunion, Compromiso, SeguimientoCompromiso, Votacion, VotoMiembro
)
from .serializers import (
    TipoComiteSerializer, ComiteSerializer, MiembroComiteSerializer,
    ReunionSerializer, AsistenciaReunionSerializer, ActaReunionSerializer,
    CompromisoSerializer, SeguimientoCompromisoSerializer,
    VotacionSerializer, VotoMiembroSerializer,
    RegistrarAsistenciaSerializer, AprobarActaSerializer,
    CerrarCompromisoSerializer, CerrarVotacionSerializer
)


class TipoComiteViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar tipos de comités.

    Permite configurar tipos de comités dinámicos (COPASST, COCOLA, CSV, etc.)
    con sus parámetros específicos.
    """
    queryset = TipoComite.objects.all()
    serializer_class = TipoComiteSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['empresa_id', 'activo', 'requiere_eleccion']
    search_fields = ['codigo', 'nombre', 'descripcion']
    ordering_fields = ['nombre', 'created_at']
    ordering = ['nombre']

    def get_queryset(self):
        """Filtra tipos de comités por empresa."""
        queryset = super().get_queryset()
        empresa_id = self.request.query_params.get('empresa_id')
        if empresa_id:
            queryset = queryset.filter(empresa_id=empresa_id)
        return queryset

    @action(detail=False, methods=['get'])
    def activos(self, request):
        """Lista tipos de comités activos."""
        empresa_id = request.query_params.get('empresa_id')
        queryset = self.get_queryset().filter(activo=True)
        if empresa_id:
            queryset = queryset.filter(empresa_id=empresa_id)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


class ComiteViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar comités activos.

    Maneja comités con sus periodos, miembros y estado.
    """
    queryset = Comite.objects.select_related('tipo_comite').prefetch_related('miembros')
    serializer_class = ComiteSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['empresa_id', 'tipo_comite', 'estado']
    search_fields = ['codigo_comite', 'nombre', 'periodo_descripcion']
    ordering_fields = ['fecha_inicio', 'created_at']
    ordering = ['-fecha_inicio']

    def get_queryset(self):
        """Filtra comités por empresa."""
        queryset = super().get_queryset()
        empresa_id = self.request.query_params.get('empresa_id')
        if empresa_id:
            queryset = queryset.filter(empresa_id=empresa_id)
        return queryset

    @action(detail=False, methods=['get'])
    def vigentes(self, request):
        """Lista comités vigentes."""
        empresa_id = request.query_params.get('empresa_id')
        hoy = timezone.now().date()

        queryset = self.get_queryset().filter(
            estado='ACTIVO',
            fecha_inicio__lte=hoy,
            fecha_fin__gte=hoy
        )

        if empresa_id:
            queryset = queryset.filter(empresa_id=empresa_id)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def activar(self, request, pk=None):
        """Activa un comité."""
        comite = self.get_object()

        if comite.estado != 'CONFORMACION':
            return Response(
                {'error': 'Solo se pueden activar comités en conformación'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Verificar que tenga el número mínimo de miembros
        num_miembros = comite.num_miembros
        if num_miembros < comite.tipo_comite.num_minimo_miembros:
            return Response(
                {
                    'error': f'El comité requiere al menos {comite.tipo_comite.num_minimo_miembros} miembros. '
                            f'Actualmente tiene {num_miembros}'
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        comite.estado = 'ACTIVO'
        comite.save()

        serializer = self.get_serializer(comite)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def estadisticas(self, request, pk=None):
        """Estadísticas del comité."""
        comite = self.get_object()

        # Reuniones
        total_reuniones = comite.reuniones.count()
        reuniones_realizadas = comite.reuniones.filter(estado='REALIZADA').count()

        # Compromisos
        total_compromisos = Compromiso.objects.filter(
            acta__reunion__comite=comite
        ).count()
        compromisos_completados = Compromiso.objects.filter(
            acta__reunion__comite=comite,
            estado='COMPLETADO'
        ).count()
        compromisos_vencidos = Compromiso.objects.filter(
            acta__reunion__comite=comite,
            estado='VENCIDO'
        ).count()

        # Votaciones
        total_votaciones = comite.votaciones.count()
        votaciones_cerradas = comite.votaciones.filter(estado='CERRADA').count()

        return Response({
            'comite': ComiteSerializer(comite).data,
            'reuniones': {
                'total': total_reuniones,
                'realizadas': reuniones_realizadas,
                'pendientes': total_reuniones - reuniones_realizadas
            },
            'compromisos': {
                'total': total_compromisos,
                'completados': compromisos_completados,
                'vencidos': compromisos_vencidos,
                'tasa_cumplimiento': round((compromisos_completados / total_compromisos * 100), 2) if total_compromisos > 0 else 0
            },
            'votaciones': {
                'total': total_votaciones,
                'cerradas': votaciones_cerradas,
                'activas': total_votaciones - votaciones_cerradas
            }
        })


class MiembroComiteViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar miembros de comités.
    """
    queryset = MiembroComite.objects.select_related('comite')
    serializer_class = MiembroComiteSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['empresa_id', 'comite', 'activo', 'rol', 'es_principal']
    search_fields = ['empleado_nombre', 'empleado_cargo', 'rol']
    ordering_fields = ['empleado_nombre', 'fecha_inicio']
    ordering = ['comite', 'empleado_nombre']

    def get_queryset(self):
        """Filtra miembros por empresa."""
        queryset = super().get_queryset()
        empresa_id = self.request.query_params.get('empresa_id')
        if empresa_id:
            queryset = queryset.filter(empresa_id=empresa_id)
        return queryset

    @action(detail=True, methods=['post'])
    def retirar(self, request, pk=None):
        """Retira un miembro del comité."""
        miembro = self.get_object()

        motivo = request.data.get('motivo_retiro', '')
        fecha_fin = request.data.get('fecha_fin', timezone.now().date())

        miembro.activo = False
        miembro.fecha_fin = fecha_fin
        miembro.motivo_retiro = motivo
        miembro.save()

        serializer = self.get_serializer(miembro)
        return Response(serializer.data)


class ReunionViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar reuniones de comités.
    """
    queryset = Reunion.objects.select_related('comite').prefetch_related('asistencias')
    serializer_class = ReunionSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['empresa_id', 'comite', 'estado', 'tipo']
    search_fields = ['numero_reunion', 'lugar', 'agenda']
    ordering_fields = ['fecha_programada', 'created_at']
    ordering = ['-fecha_programada']

    def get_queryset(self):
        """Filtra reuniones por empresa."""
        queryset = super().get_queryset()
        empresa_id = self.request.query_params.get('empresa_id')
        if empresa_id:
            queryset = queryset.filter(empresa_id=empresa_id)
        return queryset

    @action(detail=True, methods=['post'])
    @transaction.atomic
    def registrar_asistencia(self, request, pk=None):
        """
        Registra la asistencia de los miembros a una reunión.

        Body: {
            "asistencias": [
                {"miembro_id": 1, "asistio": true, "hora_llegada": "09:00", "excusa": ""},
                {"miembro_id": 2, "asistio": false, "excusa": "Cita médica"}
            ]
        }
        """
        reunion = self.get_object()
        serializer = RegistrarAsistenciaSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        asistencias_data = serializer.validated_data['asistencias']
        asistencias_creadas = []
        num_asistentes = 0

        for asistencia_data in asistencias_data:
            miembro_id = asistencia_data['miembro_id']
            asistio = asistencia_data.get('asistio', False)

            try:
                miembro = MiembroComite.objects.get(
                    id=miembro_id,
                    comite=reunion.comite,
                    activo=True
                )
            except MiembroComite.DoesNotExist:
                continue

            asistencia, created = AsistenciaReunion.objects.update_or_create(
                empresa_id=reunion.empresa_id,
                reunion=reunion,
                miembro=miembro,
                defaults={
                    'asistio': asistio,
                    'hora_llegada': asistencia_data.get('hora_llegada'),
                    'excusa': asistencia_data.get('excusa', ''),
                    'excusa_justificada': asistencia_data.get('excusa_justificada', False),
                    'observaciones': asistencia_data.get('observaciones', '')
                }
            )

            asistencias_creadas.append(asistencia)
            if asistio:
                num_asistentes += 1

        # Actualizar número de asistentes y verificar quorum
        reunion.num_asistentes = num_asistentes
        reunion.cumple_quorum = reunion.comite.cumple_quorum(num_asistentes)
        reunion.save()

        return Response({
            'message': f'Asistencia registrada para {len(asistencias_creadas)} miembros',
            'num_asistentes': num_asistentes,
            'cumple_quorum': reunion.cumple_quorum,
            'asistencias': AsistenciaReunionSerializer(asistencias_creadas, many=True).data
        })

    @action(detail=True, methods=['post'])
    def iniciar(self, request, pk=None):
        """Inicia una reunión."""
        reunion = self.get_object()

        if reunion.estado != 'PROGRAMADA':
            return Response(
                {'error': 'Solo se pueden iniciar reuniones programadas'},
                status=status.HTTP_400_BAD_REQUEST
            )

        reunion.estado = 'EN_CURSO'
        reunion.hora_inicio_real = timezone.now().time()
        reunion.fecha_realizada = timezone.now().date()
        reunion.save()

        serializer = self.get_serializer(reunion)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def finalizar(self, request, pk=None):
        """Finaliza una reunión."""
        reunion = self.get_object()

        if reunion.estado != 'EN_CURSO':
            return Response(
                {'error': 'Solo se pueden finalizar reuniones en curso'},
                status=status.HTTP_400_BAD_REQUEST
            )

        reunion.estado = 'REALIZADA'
        reunion.hora_fin_real = timezone.now().time()
        reunion.save()

        serializer = self.get_serializer(reunion)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def cancelar(self, request, pk=None):
        """Cancela una reunión."""
        reunion = self.get_object()

        motivo = request.data.get('motivo_cancelacion', '')

        reunion.estado = 'CANCELADA'
        reunion.motivo_cancelacion = motivo
        reunion.save()

        serializer = self.get_serializer(reunion)
        return Response(serializer.data)


class ActaReunionViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar actas de reuniones.
    """
    queryset = ActaReunion.objects.select_related('reunion__comite').prefetch_related('compromisos')
    serializer_class = ActaReunionSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['empresa_id', 'reunion__comite', 'estado']
    search_fields = ['numero_acta', 'desarrollo', 'conclusiones']
    ordering_fields = ['created_at', 'fecha_aprobacion']
    ordering = ['-created_at']

    def get_queryset(self):
        """Filtra actas por empresa."""
        queryset = super().get_queryset()
        empresa_id = self.request.query_params.get('empresa_id')
        if empresa_id:
            queryset = queryset.filter(empresa_id=empresa_id)
        return queryset

    @action(detail=True, methods=['post'])
    @transaction.atomic
    def aprobar_acta(self, request, pk=None):
        """
        Aprueba un acta de reunión.

        Body: {
            "aprobada_por_id": 123,
            "aprobada_por_nombre": "Juan Pérez",
            "observaciones": "Acta aprobada sin observaciones"
        }
        """
        acta = self.get_object()
        serializer = AprobarActaSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        if acta.estado == 'APROBADA':
            return Response(
                {'error': 'El acta ya está aprobada'},
                status=status.HTTP_400_BAD_REQUEST
            )

        acta.estado = 'APROBADA'
        acta.fecha_aprobacion = timezone.now()
        acta.aprobada_por_id = serializer.validated_data['aprobada_por_id']
        acta.aprobada_por_nombre = serializer.validated_data['aprobada_por_nombre']

        if 'observaciones' in serializer.validated_data:
            acta.observaciones_revision = serializer.validated_data['observaciones']

        acta.save()

        return Response({
            'message': 'Acta aprobada exitosamente',
            'acta': ActaReunionSerializer(acta).data
        })

    @action(detail=True, methods=['post'])
    def rechazar(self, request, pk=None):
        """Rechaza un acta."""
        acta = self.get_object()

        observaciones = request.data.get('observaciones_revision', '')

        acta.estado = 'RECHAZADA'
        acta.observaciones_revision = observaciones
        acta.save()

        serializer = self.get_serializer(acta)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def enviar_revision(self, request, pk=None):
        """Envía un acta a revisión."""
        acta = self.get_object()

        if acta.estado != 'BORRADOR':
            return Response(
                {'error': 'Solo se pueden enviar a revisión actas en borrador'},
                status=status.HTTP_400_BAD_REQUEST
            )

        acta.estado = 'REVISION'
        acta.save()

        serializer = self.get_serializer(acta)
        return Response(serializer.data)


class CompromisoViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar compromisos derivados de actas.
    """
    queryset = Compromiso.objects.select_related('acta__reunion__comite').prefetch_related('seguimientos')
    serializer_class = CompromisoSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['empresa_id', 'acta__reunion__comite', 'estado', 'responsable_id', 'prioridad']
    search_fields = ['numero_compromiso', 'descripcion', 'responsable_nombre']
    ordering_fields = ['fecha_limite', 'created_at', 'prioridad']
    ordering = ['fecha_limite']

    def get_queryset(self):
        """Filtra compromisos por empresa."""
        queryset = super().get_queryset()
        empresa_id = self.request.query_params.get('empresa_id')
        if empresa_id:
            queryset = queryset.filter(empresa_id=empresa_id)
        return queryset

    @action(detail=False, methods=['get'])
    def vencidos(self, request):
        """Lista compromisos vencidos."""
        empresa_id = request.query_params.get('empresa_id')
        hoy = timezone.now().date()

        queryset = self.get_queryset().filter(
            fecha_limite__lt=hoy,
            estado__in=['PENDIENTE', 'EN_PROCESO']
        )

        if empresa_id:
            queryset = queryset.filter(empresa_id=empresa_id)

        # Actualizar estado a VENCIDO
        queryset.update(estado='VENCIDO')

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def proximos_vencer(self, request):
        """Lista compromisos próximos a vencer (7 días)."""
        empresa_id = request.query_params.get('empresa_id')
        hoy = timezone.now().date()

        from datetime import timedelta
        fecha_limite = hoy + timedelta(days=7)

        queryset = self.get_queryset().filter(
            fecha_limite__gte=hoy,
            fecha_limite__lte=fecha_limite,
            estado__in=['PENDIENTE', 'EN_PROCESO']
        )

        if empresa_id:
            queryset = queryset.filter(empresa_id=empresa_id)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    @transaction.atomic
    def cerrar_compromiso(self, request, pk=None):
        """
        Cierra un compromiso marcándolo como completado.

        Body: {
            "verificado_por_id": 123,
            "verificado_por_nombre": "María López",
            "observaciones_verificacion": "Compromiso verificado y cumplido",
            "evidencias": [{"tipo": "archivo", "url": "..."}]
        }
        """
        compromiso = self.get_object()
        serializer = CerrarCompromisoSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        if compromiso.estado == 'COMPLETADO':
            return Response(
                {'error': 'El compromiso ya está completado'},
                status=status.HTTP_400_BAD_REQUEST
            )

        compromiso.estado = 'COMPLETADO'
        compromiso.fecha_cierre = timezone.now().date()
        compromiso.porcentaje_avance = 100
        compromiso.verificado_por_id = serializer.validated_data['verificado_por_id']
        compromiso.verificado_por_nombre = serializer.validated_data['verificado_por_nombre']
        compromiso.fecha_verificacion = timezone.now().date()

        if 'observaciones_verificacion' in serializer.validated_data:
            compromiso.observaciones_verificacion = serializer.validated_data['observaciones_verificacion']

        if 'evidencias' in serializer.validated_data:
            compromiso.evidencias = serializer.validated_data['evidencias']

        compromiso.save()

        return Response({
            'message': 'Compromiso cerrado exitosamente',
            'compromiso': CompromisoSerializer(compromiso).data
        })

    @action(detail=True, methods=['post'])
    def actualizar_avance(self, request, pk=None):
        """Actualiza el avance de un compromiso."""
        compromiso = self.get_object()

        porcentaje_avance = request.data.get('porcentaje_avance')

        if porcentaje_avance is None:
            return Response(
                {'error': 'El porcentaje de avance es requerido'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if porcentaje_avance < 0 or porcentaje_avance > 100:
            return Response(
                {'error': 'El porcentaje de avance debe estar entre 0 y 100'},
                status=status.HTTP_400_BAD_REQUEST
            )

        compromiso.porcentaje_avance = porcentaje_avance

        if porcentaje_avance > 0 and compromiso.estado == 'PENDIENTE':
            compromiso.estado = 'EN_PROCESO'

        compromiso.save()

        serializer = self.get_serializer(compromiso)
        return Response(serializer.data)


class SeguimientoCompromisoViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar seguimientos de compromisos.
    """
    queryset = SeguimientoCompromiso.objects.select_related('compromiso')
    serializer_class = SeguimientoCompromisoSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['empresa_id', 'compromiso', 'requiere_apoyo']
    search_fields = ['descripcion_avance', 'dificultades']
    ordering_fields = ['fecha_seguimiento', 'created_at']
    ordering = ['-fecha_seguimiento']

    def get_queryset(self):
        """Filtra seguimientos por empresa."""
        queryset = super().get_queryset()
        empresa_id = self.request.query_params.get('empresa_id')
        if empresa_id:
            queryset = queryset.filter(empresa_id=empresa_id)
        return queryset

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        """Crea un seguimiento y actualiza el avance del compromiso."""
        response = super().create(request, *args, **kwargs)

        # Actualizar el avance del compromiso
        seguimiento = SeguimientoCompromiso.objects.get(id=response.data['id'])
        compromiso = seguimiento.compromiso
        compromiso.porcentaje_avance = seguimiento.avance_reportado

        if seguimiento.avance_reportado > 0 and compromiso.estado == 'PENDIENTE':
            compromiso.estado = 'EN_PROCESO'

        compromiso.save()

        return response


class VotacionViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar votaciones de comités.
    """
    queryset = Votacion.objects.select_related('comite', 'reunion').prefetch_related('votos')
    serializer_class = VotacionSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['empresa_id', 'comite', 'reunion', 'estado', 'tipo']
    search_fields = ['numero_votacion', 'titulo', 'descripcion']
    ordering_fields = ['fecha_inicio', 'created_at']
    ordering = ['-fecha_inicio']

    def get_queryset(self):
        """Filtra votaciones por empresa."""
        queryset = super().get_queryset()
        empresa_id = self.request.query_params.get('empresa_id')
        if empresa_id:
            queryset = queryset.filter(empresa_id=empresa_id)
        return queryset

    @action(detail=True, methods=['post'])
    def iniciar(self, request, pk=None):
        """Inicia una votación."""
        votacion = self.get_object()

        if votacion.estado != 'PROGRAMADA':
            return Response(
                {'error': 'Solo se pueden iniciar votaciones programadas'},
                status=status.HTTP_400_BAD_REQUEST
            )

        votacion.estado = 'EN_CURSO'
        votacion.save()

        serializer = self.get_serializer(votacion)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    @transaction.atomic
    def cerrar(self, request, pk=None):
        """
        Cierra una votación y calcula los resultados.

        Body: {
            "cerrada_por_id": 123,
            "observaciones": "Votación cerrada"
        }
        """
        votacion = self.get_object()
        serializer = CerrarVotacionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        if votacion.estado == 'CERRADA':
            return Response(
                {'error': 'La votación ya está cerrada'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Calcular resultados
        votos = votacion.votos.all()
        total_votos = votos.count()

        resultados = {}
        for opcion in votacion.opciones:
            opcion_id = opcion.get('id')
            votos_opcion = votos.filter(opcion_id=opcion_id).count()
            porcentaje = round((votos_opcion / total_votos * 100), 2) if total_votos > 0 else 0

            resultados[opcion_id] = {
                'texto': opcion.get('texto'),
                'votos': votos_opcion,
                'porcentaje': porcentaje
            }

        # Contar abstenciones
        abstenciones = votos.filter(es_abstencion=True).count()
        if abstenciones > 0:
            resultados['abstenciones'] = {
                'votos': abstenciones,
                'porcentaje': round((abstenciones / total_votos * 100), 2)
            }

        # Determinar opción ganadora
        opcion_ganadora = max(resultados.items(), key=lambda x: x[1].get('votos', 0))

        votacion.estado = 'CERRADA'
        votacion.fecha_cierre_real = timezone.now()
        votacion.cerrada_por_id = serializer.validated_data['cerrada_por_id']
        votacion.total_votos_emitidos = total_votos
        votacion.resultados = resultados
        votacion.opcion_ganadora = opcion_ganadora[1].get('texto', '')

        if 'observaciones' in serializer.validated_data:
            votacion.observaciones = serializer.validated_data['observaciones']

        votacion.save()

        return Response({
            'message': 'Votación cerrada exitosamente',
            'votacion': VotacionSerializer(votacion).data,
            'resultados': resultados
        })

    @action(detail=True, methods=['get'])
    def resultados(self, request, pk=None):
        """Obtiene los resultados de una votación."""
        votacion = self.get_object()

        if votacion.estado != 'CERRADA':
            return Response(
                {'error': 'La votación debe estar cerrada para ver resultados'},
                status=status.HTTP_400_BAD_REQUEST
            )

        return Response({
            'votacion': VotacionSerializer(votacion).data,
            'resultados': votacion.resultados,
            'opcion_ganadora': votacion.opcion_ganadora,
            'total_votos': votacion.total_votos_emitidos
        })


class VotoMiembroViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar votos individuales de miembros.
    """
    queryset = VotoMiembro.objects.select_related('votacion', 'miembro')
    serializer_class = VotoMiembroSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['empresa_id', 'votacion', 'miembro', 'es_abstencion']
    ordering_fields = ['fecha_voto']
    ordering = ['-fecha_voto']

    def get_queryset(self):
        """Filtra votos por empresa."""
        queryset = super().get_queryset()
        empresa_id = self.request.query_params.get('empresa_id')
        if empresa_id:
            queryset = queryset.filter(empresa_id=empresa_id)

        # Si la votación es secreta, ocultar información del miembro
        votacion_id = self.request.query_params.get('votacion')
        if votacion_id:
            try:
                votacion = Votacion.objects.get(id=votacion_id)
                if votacion.es_secreta:
                    queryset = queryset.only('id', 'votacion', 'opcion_texto', 'es_abstencion', 'fecha_voto')
            except Votacion.DoesNotExist:
                pass

        return queryset

    def create(self, request, *args, **kwargs):
        """Crea un voto y valida que la votación esté activa."""
        votacion_id = request.data.get('votacion')

        try:
            votacion = Votacion.objects.get(id=votacion_id)
        except Votacion.DoesNotExist:
            return Response(
                {'error': 'Votación no encontrada'},
                status=status.HTTP_404_NOT_FOUND
            )

        if not votacion.esta_activa:
            return Response(
                {'error': 'La votación no está activa'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Si se proporciona opcion_id, obtener el texto de la opción
        opcion_id = request.data.get('opcion_id')
        if opcion_id:
            opcion = next((o for o in votacion.opciones if o.get('id') == opcion_id), None)
            if opcion:
                request.data['opcion_texto'] = opcion.get('texto', '')

        return super().create(request, *args, **kwargs)
