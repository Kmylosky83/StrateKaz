"""
Views para Selección y Contratación - Talent Hub
Sistema de Gestión StrateKaz

ViewSets CRUD completos para vacantes, candidatos, entrevistas,
pruebas y afiliaciones de seguridad social.
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Count, Avg, Q
from django.utils import timezone

from .models import (
    TipoContrato,
    TipoEntidad,
    EntidadSeguridadSocial,
    TipoPrueba,
    VacanteActiva,
    Candidato,
    Entrevista,
    Prueba,
    AfiliacionSS,
    HistorialContrato,
)
from .serializers import (
    TipoContratoSerializer,
    TipoEntidadSerializer,
    EntidadSeguridadSocialSerializer,
    TipoPruebaSerializer,
    VacanteActivaListSerializer,
    VacanteActivaDetailSerializer,
    VacanteActivaCreateUpdateSerializer,
    CandidatoListSerializer,
    CandidatoDetailSerializer,
    CandidatoCreateUpdateSerializer,
    EntrevistaSerializer,
    EntrevistaCreateSerializer,
    PruebaSerializer,
    PruebaCreateSerializer,
    AfiliacionSSSerializer,
    AfiliacionSSCreateSerializer,
    ProcesoSeleccionEstadisticasSerializer,
)
from .serializers_contrato import (
    HistorialContratoListSerializer,
    HistorialContratoDetailSerializer,
    HistorialContratoCreateSerializer,
)


# =============================================================================
# CATÁLOGOS
# =============================================================================

class TipoContratoViewSet(viewsets.ModelViewSet):
    """ViewSet para TipoContrato"""
    queryset = TipoContrato.objects.filter(is_active=True).order_by('orden')
    serializer_class = TipoContratoSerializer
    permission_classes = [IsAuthenticated]


class TipoEntidadViewSet(viewsets.ModelViewSet):
    """ViewSet para TipoEntidad"""
    queryset = TipoEntidad.objects.filter(is_active=True).order_by('orden')
    serializer_class = TipoEntidadSerializer
    permission_classes = [IsAuthenticated]


class EntidadSeguridadSocialViewSet(viewsets.ModelViewSet):
    """ViewSet para EntidadSeguridadSocial"""
    serializer_class = EntidadSeguridadSocialSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = EntidadSeguridadSocial.objects.filter(
            is_active=True
        ).select_related('tipo_entidad').order_by('tipo_entidad__orden', 'orden')

        tipo_entidad = self.request.query_params.get('tipo_entidad')
        if tipo_entidad:
            queryset = queryset.filter(tipo_entidad_id=tipo_entidad)

        tipo_codigo = self.request.query_params.get('tipo_codigo')
        if tipo_codigo:
            queryset = queryset.filter(tipo_entidad__codigo=tipo_codigo)

        return queryset


class TipoPruebaViewSet(viewsets.ModelViewSet):
    """ViewSet para TipoPrueba"""
    queryset = TipoPrueba.objects.filter(is_active=True).order_by('orden')
    serializer_class = TipoPruebaSerializer
    permission_classes = [IsAuthenticated]


# =============================================================================
# VACANTE ACTIVA
# =============================================================================

class VacanteActivaViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión de Vacantes Activas.

    Endpoints:
    - GET /vacantes-activas/ - Listar vacantes
    - POST /vacantes-activas/ - Crear vacante
    - GET /vacantes-activas/{id}/ - Detalle
    - PUT /vacantes-activas/{id}/ - Actualizar
    - DELETE /vacantes-activas/{id}/ - Eliminar
    - GET /vacantes-activas/abiertas/ - Solo abiertas
    - POST /vacantes-activas/{id}/cerrar/ - Cerrar vacante
    - POST /vacantes-activas/{id}/publicar/ - Publicar externamente
    """
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = VacanteActiva.objects.filter(is_active=True)

        if hasattr(user, 'empresa_id') and user.empresa_id:
            queryset = queryset.filter(empresa_id=user.empresa_id)

        # Filtros
        estado = self.request.query_params.get('estado')
        if estado:
            queryset = queryset.filter(estado=estado)

        prioridad = self.request.query_params.get('prioridad')
        if prioridad:
            queryset = queryset.filter(prioridad=prioridad)

        area = self.request.query_params.get('area')
        if area:
            queryset = queryset.filter(area__icontains=area)

        return queryset.select_related('tipo_contrato', 'responsable_proceso', 'reclutador')

    def get_serializer_class(self):
        if self.action == 'list':
            return VacanteActivaListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return VacanteActivaCreateUpdateSerializer
        return VacanteActivaDetailSerializer

    def perform_create(self, serializer):
        user = self.request.user
        empresa_id = getattr(user, 'empresa_id', None)
        serializer.save(
            empresa_id=empresa_id,
            created_by=user,
            updated_by=user
        )

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)

    def perform_destroy(self, instance):
        instance.soft_delete()

    @action(detail=False, methods=['get'])
    def abiertas(self, request):
        """Retorna solo vacantes abiertas"""
        queryset = self.get_queryset().filter(estado__in=['abierta', 'en_proceso'])
        serializer = VacanteActivaListSerializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def cerrar(self, request, pk=None):
        """Cierra una vacante"""
        vacante = self.get_object()
        vacante.estado = 'cerrada'
        vacante.motivo_cierre = request.data.get('motivo_cierre', '')
        vacante.fecha_cierre_real = timezone.now().date()
        vacante.updated_by = request.user
        vacante.save()

        serializer = VacanteActivaDetailSerializer(vacante)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def publicar(self, request, pk=None):
        """Publica o despublica externamente"""
        vacante = self.get_object()
        vacante.publicada_externamente = not vacante.publicada_externamente
        if vacante.publicada_externamente:
            vacante.url_publicacion = request.data.get('url_publicacion', '')
        vacante.updated_by = request.user
        vacante.save()

        serializer = VacanteActivaDetailSerializer(vacante)
        return Response(serializer.data)


# =============================================================================
# CANDIDATO
# =============================================================================

class CandidatoViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión de Candidatos.

    Endpoints:
    - GET /candidatos/ - Listar candidatos
    - POST /candidatos/ - Crear candidato
    - GET /candidatos/{id}/ - Detalle
    - PUT /candidatos/{id}/ - Actualizar
    - DELETE /candidatos/{id}/ - Eliminar
    - GET /candidatos/por-vacante/{vacante_id}/ - Filtrar por vacante
    - POST /candidatos/{id}/cambiar-estado/ - Cambiar estado
    - POST /candidatos/{id}/contratar/ - Marcar como contratado
    """
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = Candidato.objects.filter(is_active=True)

        if hasattr(user, 'empresa_id') and user.empresa_id:
            queryset = queryset.filter(empresa_id=user.empresa_id)

        # Filtros
        vacante_id = self.request.query_params.get('vacante')
        if vacante_id:
            queryset = queryset.filter(vacante_id=vacante_id)

        estado = self.request.query_params.get('estado')
        if estado:
            queryset = queryset.filter(estado=estado)

        return queryset.select_related('vacante')

    def get_serializer_class(self):
        if self.action == 'list':
            return CandidatoListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return CandidatoCreateUpdateSerializer
        return CandidatoDetailSerializer

    def perform_create(self, serializer):
        user = self.request.user
        # La empresa se hereda de la vacante
        vacante = serializer.validated_data.get('vacante')
        serializer.save(
            empresa_id=vacante.empresa_id,
            created_by=user,
            updated_by=user
        )

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)

    def perform_destroy(self, instance):
        instance.soft_delete()

    @action(detail=False, methods=['get'], url_path='por-vacante/(?P<vacante_id>[^/.]+)')
    def por_vacante(self, request, vacante_id=None):
        """Retorna candidatos de una vacante"""
        queryset = self.get_queryset().filter(vacante_id=vacante_id)
        serializer = CandidatoListSerializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def cambiar_estado(self, request, pk=None):
        """Cambia el estado del candidato"""
        candidato = self.get_object()
        nuevo_estado = request.data.get('estado')
        motivo = request.data.get('motivo', '')

        if nuevo_estado not in dict(Candidato.ESTADO_CHOICES):
            return Response(
                {'error': 'Estado no válido'},
                status=status.HTTP_400_BAD_REQUEST
            )

        candidato.estado = nuevo_estado
        if nuevo_estado == 'rechazado':
            candidato.motivo_rechazo = motivo
        candidato.updated_by = request.user
        candidato.save()

        serializer = CandidatoDetailSerializer(candidato)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def contratar(self, request, pk=None):
        """Marca al candidato como contratado"""
        candidato = self.get_object()
        candidato.estado = 'contratado'
        candidato.fecha_contratacion = request.data.get(
            'fecha_contratacion',
            timezone.now().date()
        )
        candidato.salario_ofrecido = request.data.get('salario_ofrecido')
        candidato.updated_by = request.user
        candidato.save()

        # Actualizar posiciones cubiertas de la vacante
        vacante = candidato.vacante
        vacante.posiciones_cubiertas = (vacante.posiciones_cubiertas or 0) + 1
        if vacante.posiciones_cubiertas >= vacante.numero_posiciones:
            vacante.estado = 'cerrada'
            vacante.fecha_cierre_real = timezone.now().date()
        vacante.save()

        serializer = CandidatoDetailSerializer(candidato)
        return Response(serializer.data)


# =============================================================================
# ENTREVISTA
# =============================================================================

class EntrevistaViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión de Entrevistas.

    Endpoints:
    - GET /entrevistas/ - Listar entrevistas
    - POST /entrevistas/ - Programar entrevista
    - GET /entrevistas/{id}/ - Detalle
    - PUT /entrevistas/{id}/ - Actualizar
    - DELETE /entrevistas/{id}/ - Eliminar
    - GET /entrevistas/por-candidato/{id}/ - Filtrar por candidato
    - POST /entrevistas/{id}/realizar/ - Marcar como realizada
    - POST /entrevistas/{id}/cancelar/ - Cancelar entrevista
    """
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = Entrevista.objects.filter(is_active=True)

        if hasattr(user, 'empresa_id') and user.empresa_id:
            queryset = queryset.filter(empresa_id=user.empresa_id)

        candidato_id = self.request.query_params.get('candidato')
        if candidato_id:
            queryset = queryset.filter(candidato_id=candidato_id)

        estado = self.request.query_params.get('estado')
        if estado:
            queryset = queryset.filter(estado=estado)

        entrevistador = self.request.query_params.get('entrevistador')
        if entrevistador:
            queryset = queryset.filter(entrevistador_principal_id=entrevistador)

        return queryset.select_related('candidato', 'candidato__vacante', 'entrevistador_principal')

    def get_serializer_class(self):
        if self.action in ['create']:
            return EntrevistaCreateSerializer
        return EntrevistaSerializer

    def perform_create(self, serializer):
        user = self.request.user
        candidato = serializer.validated_data.get('candidato')
        serializer.save(
            empresa_id=candidato.empresa_id,
            created_by=user,
            updated_by=user
        )

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)

    def perform_destroy(self, instance):
        instance.soft_delete()

    @action(detail=False, methods=['get'], url_path='por-candidato/(?P<candidato_id>[^/.]+)')
    def por_candidato(self, request, candidato_id=None):
        queryset = self.get_queryset().filter(candidato_id=candidato_id)
        serializer = EntrevistaSerializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def realizar(self, request, pk=None):
        """Marca la entrevista como realizada con evaluación"""
        entrevista = self.get_object()
        entrevista.estado = 'realizada'
        entrevista.fecha_realizacion = timezone.now()
        entrevista.duracion_real_minutos = request.data.get('duracion_real_minutos')
        entrevista.asistio_candidato = request.data.get('asistio_candidato', True)
        entrevista.calificacion_tecnica = request.data.get('calificacion_tecnica')
        entrevista.calificacion_competencias = request.data.get('calificacion_competencias')
        entrevista.calificacion_general = request.data.get('calificacion_general')
        entrevista.fortalezas_identificadas = request.data.get('fortalezas_identificadas', '')
        entrevista.aspectos_mejorar = request.data.get('aspectos_mejorar', '')
        entrevista.observaciones = request.data.get('observaciones', '')
        entrevista.recomendacion = request.data.get('recomendacion')
        entrevista.updated_by = request.user
        entrevista.save()

        serializer = EntrevistaSerializer(entrevista)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def cancelar(self, request, pk=None):
        """Cancela o reprograma la entrevista"""
        entrevista = self.get_object()
        entrevista.estado = request.data.get('estado', 'cancelada')
        entrevista.motivo_cancelacion = request.data.get('motivo', '')
        if entrevista.estado == 'reprogramada':
            entrevista.fecha_reprogramada = request.data.get('fecha_reprogramada')
        entrevista.updated_by = request.user
        entrevista.save()

        serializer = EntrevistaSerializer(entrevista)
        return Response(serializer.data)


# =============================================================================
# PRUEBA
# =============================================================================

class PruebaViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión de Pruebas.

    Endpoints:
    - GET /pruebas/ - Listar pruebas
    - POST /pruebas/ - Programar prueba
    - GET /pruebas/{id}/ - Detalle
    - PUT /pruebas/{id}/ - Actualizar
    - DELETE /pruebas/{id}/ - Eliminar
    - GET /pruebas/por-candidato/{id}/ - Filtrar por candidato
    - POST /pruebas/{id}/calificar/ - Registrar calificación
    """
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = Prueba.objects.filter(is_active=True)

        if hasattr(user, 'empresa_id') and user.empresa_id:
            queryset = queryset.filter(empresa_id=user.empresa_id)

        candidato_id = self.request.query_params.get('candidato')
        if candidato_id:
            queryset = queryset.filter(candidato_id=candidato_id)

        tipo_prueba = self.request.query_params.get('tipo_prueba')
        if tipo_prueba:
            queryset = queryset.filter(tipo_prueba_id=tipo_prueba)

        estado = self.request.query_params.get('estado')
        if estado:
            queryset = queryset.filter(estado=estado)

        return queryset.select_related('candidato', 'tipo_prueba', 'responsable')

    def get_serializer_class(self):
        if self.action == 'create':
            return PruebaCreateSerializer
        return PruebaSerializer

    def perform_create(self, serializer):
        user = self.request.user
        candidato = serializer.validated_data.get('candidato')
        serializer.save(
            empresa_id=candidato.empresa_id,
            created_by=user,
            updated_by=user
        )

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)

    def perform_destroy(self, instance):
        instance.soft_delete()

    @action(detail=False, methods=['get'], url_path='por-candidato/(?P<candidato_id>[^/.]+)')
    def por_candidato(self, request, candidato_id=None):
        queryset = self.get_queryset().filter(candidato_id=candidato_id)
        serializer = PruebaSerializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def calificar(self, request, pk=None):
        """Registra la calificación de la prueba"""
        prueba = self.get_object()
        prueba.estado = 'calificada'
        prueba.fecha_realizacion = request.data.get('fecha_realizacion', timezone.now())
        prueba.calificacion = request.data.get('calificacion')
        prueba.observaciones = request.data.get('observaciones', '')
        prueba.recomendaciones = request.data.get('recomendaciones', '')

        # Auto-calcular aprobación
        if prueba.puntaje_minimo_aprobacion and prueba.calificacion:
            prueba.aprobado = prueba.calificacion >= prueba.puntaje_minimo_aprobacion
        else:
            prueba.aprobado = request.data.get('aprobado')

        prueba.updated_by = request.user
        prueba.save()

        serializer = PruebaSerializer(prueba)
        return Response(serializer.data)


# =============================================================================
# AFILIACIÓN SEGURIDAD SOCIAL
# =============================================================================

class AfiliacionSSViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión de Afiliaciones a Seguridad Social.

    Endpoints:
    - GET /afiliaciones/ - Listar afiliaciones
    - POST /afiliaciones/ - Crear afiliación
    - GET /afiliaciones/{id}/ - Detalle
    - PUT /afiliaciones/{id}/ - Actualizar
    - DELETE /afiliaciones/{id}/ - Eliminar
    - GET /afiliaciones/por-candidato/{id}/ - Por candidato
    - POST /afiliaciones/{id}/confirmar/ - Confirmar afiliación
    """
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = AfiliacionSS.objects.filter(is_active=True)

        if hasattr(user, 'empresa_id') and user.empresa_id:
            queryset = queryset.filter(empresa_id=user.empresa_id)

        candidato_id = self.request.query_params.get('candidato')
        if candidato_id:
            queryset = queryset.filter(candidato_id=candidato_id)

        estado = self.request.query_params.get('estado')
        if estado:
            queryset = queryset.filter(estado=estado)

        tipo_entidad = self.request.query_params.get('tipo_entidad')
        if tipo_entidad:
            queryset = queryset.filter(entidad__tipo_entidad__codigo=tipo_entidad)

        return queryset.select_related('candidato', 'entidad', 'entidad__tipo_entidad', 'responsable_tramite')

    def get_serializer_class(self):
        if self.action == 'create':
            return AfiliacionSSCreateSerializer
        return AfiliacionSSSerializer

    def perform_create(self, serializer):
        user = self.request.user
        candidato = serializer.validated_data.get('candidato')
        serializer.save(
            empresa_id=candidato.empresa_id,
            created_by=user,
            updated_by=user
        )

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)

    def perform_destroy(self, instance):
        instance.soft_delete()

    @action(detail=False, methods=['get'], url_path='por-candidato/(?P<candidato_id>[^/.]+)')
    def por_candidato(self, request, candidato_id=None):
        queryset = self.get_queryset().filter(candidato_id=candidato_id)
        serializer = AfiliacionSSSerializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def confirmar(self, request, pk=None):
        """Confirma la afiliación"""
        afiliacion = self.get_object()
        afiliacion.estado = 'afiliado'
        afiliacion.fecha_afiliacion = request.data.get('fecha_afiliacion', timezone.now().date())
        afiliacion.numero_afiliacion = request.data.get('numero_afiliacion', '')
        afiliacion.updated_by = request.user
        afiliacion.save()

        serializer = AfiliacionSSSerializer(afiliacion)
        return Response(serializer.data)


# =============================================================================
# ESTADÍSTICAS GENERALES
# =============================================================================

class ProcesoSeleccionEstadisticasViewSet(viewsets.ViewSet):
    """ViewSet para estadísticas del proceso de selección"""
    permission_classes = [IsAuthenticated]

    def list(self, request):
        """Retorna estadísticas generales del proceso de selección"""
        user = request.user
        empresa_filter = {}
        if hasattr(user, 'empresa_id') and user.empresa_id:
            empresa_filter = {'empresa_id': user.empresa_id}

        # Vacantes
        vacantes = VacanteActiva.objects.filter(is_active=True, **empresa_filter)
        vacantes_abiertas = vacantes.filter(estado__in=['abierta', 'en_proceso']).count()

        # Candidatos
        candidatos = Candidato.objects.filter(is_active=True, **empresa_filter)
        candidatos_en_proceso = candidatos.filter(
            estado__in=['postulado', 'preseleccionado', 'en_evaluacion']
        ).count()
        candidatos_aprobados = candidatos.filter(estado='aprobado').count()
        candidatos_contratados = candidatos.filter(estado='contratado').count()
        candidatos_rechazados = candidatos.filter(estado='rechazado').count()

        # Entrevistas
        entrevistas = Entrevista.objects.filter(is_active=True, **empresa_filter)
        entrevistas_programadas = entrevistas.filter(estado='programada').count()
        entrevistas_realizadas = entrevistas.filter(estado='realizada').count()

        # Pruebas
        pruebas_pendientes = Prueba.objects.filter(
            is_active=True,
            estado='programada',
            **empresa_filter
        ).count()

        # Tiempo promedio de contratación
        contratados = candidatos.filter(
            estado='contratado',
            fecha_contratacion__isnull=False
        )
        if contratados.exists():
            tiempos = [
                (c.fecha_contratacion - c.fecha_postulacion.date()).days
                for c in contratados
            ]
            tiempo_promedio = sum(tiempos) / len(tiempos)
        else:
            tiempo_promedio = 0

        data = {
            'vacantes_total': vacantes.count(),
            'vacantes_abiertas': vacantes_abiertas,
            'candidatos_total': candidatos.count(),
            'candidatos_en_proceso': candidatos_en_proceso,
            'candidatos_aprobados': candidatos_aprobados,
            'candidatos_contratados': candidatos_contratados,
            'candidatos_rechazados': candidatos_rechazados,
            'entrevistas_programadas': entrevistas_programadas,
            'entrevistas_realizadas': entrevistas_realizadas,
            'pruebas_pendientes': pruebas_pendientes,
            'tiempo_promedio_contratacion': tiempo_promedio,
        }

        serializer = ProcesoSeleccionEstadisticasSerializer(data)
        return Response(serializer.data)


# =============================================================================
# HISTORIAL DE CONTRATOS (Ley 2466/2025)
# =============================================================================

class HistorialContratoViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión de Historial de Contratos.

    Ley 2466/2025 Compliance:
    - Validación de renovaciones y duraciones acumuladas
    - Justificación obligatoria para contratos no indefinidos
    - Warnings automáticos sin bloqueo
    """
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = HistorialContrato.objects.filter(is_active=True)

        if hasattr(user, 'empresa_id') and user.empresa_id:
            queryset = queryset.filter(empresa_id=user.empresa_id)

        colaborador_id = self.request.query_params.get('colaborador')
        if colaborador_id:
            queryset = queryset.filter(colaborador_id=colaborador_id)

        tipo_movimiento = self.request.query_params.get('tipo_movimiento')
        if tipo_movimiento:
            queryset = queryset.filter(tipo_movimiento=tipo_movimiento)

        vigentes = self.request.query_params.get('vigentes')
        if vigentes == 'true':
            queryset = queryset.filter(
                Q(fecha_fin__isnull=True) | Q(fecha_fin__gte=timezone.now().date())
            )

        return queryset.select_related(
            'colaborador', 'tipo_contrato', 'contrato_padre'
        ).order_by('-fecha_inicio')

    def get_serializer_class(self):
        if self.action == 'list':
            return HistorialContratoListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return HistorialContratoCreateSerializer
        return HistorialContratoDetailSerializer

    def perform_create(self, serializer):
        serializer.save(
            empresa=self.request.user.empresa,
            created_by=self.request.user,
            updated_by=self.request.user
        )

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)

    def perform_destroy(self, instance):
        instance.soft_delete()

    @action(detail=True, methods=['post'])
    def firmar(self, request, pk=None):
        """Registra la firma del contrato"""
        contrato = self.get_object()
        contrato.firmado = True
        contrato.fecha_firma = timezone.now()
        contrato.save()
        return Response(HistorialContratoDetailSerializer(contrato).data)

    @action(detail=True, methods=['get'])
    def warnings(self, request, pk=None):
        """Obtiene advertencias Ley 2466/2025 para el contrato"""
        contrato = self.get_object()
        return Response({'warnings': contrato.get_warnings()})

    @action(detail=False, methods=['get'])
    def por_vencer(self, request):
        """Lista contratos que vencen en los próximos N días"""
        dias = int(request.query_params.get('dias', 30))
        hoy = timezone.now().date()
        from datetime import timedelta
        fecha_limite = hoy + timedelta(days=dias)

        queryset = self.get_queryset().filter(
            fecha_fin__isnull=False,
            fecha_fin__gte=hoy,
            fecha_fin__lte=fecha_limite
        )
        serializer = HistorialContratoListSerializer(queryset, many=True)
        return Response(serializer.data)
