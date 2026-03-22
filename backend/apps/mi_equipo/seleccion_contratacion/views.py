"""
Views para Selección y Contratación - Talent Hub
Sistema de Gestión StrateKaz

ViewSets CRUD completos para vacantes, candidatos, entrevistas,
pruebas y afiliaciones de seguridad social.
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.throttling import AnonRateThrottle
from apps.core.permissions import GranularActionPermission
from django.db.models import Count, Avg, Q, F, Value, DecimalField
from decimal import Decimal
from django.utils import timezone

from apps.core.base_models.mixins import get_tenant_empresa
from apps.gestion_estrategica.revision_direccion.services.resumen_mixin import ResumenRevisionMixin

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
    PlantillaPruebaDinamica,
    AsignacionPruebaDinamica,
    EntrevistaAsincronica,
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
    PlantillaPruebaDinamicaListSerializer,
    PlantillaPruebaDinamicaDetailSerializer,
    PlantillaPruebaDinamicaCreateSerializer,
    AsignacionPruebaDinamicaListSerializer,
    AsignacionPruebaDinamicaDetailSerializer,
    AsignacionPruebaDinamicaCreateSerializer,
    ResponderPruebaDinamicaSerializer,
    EntrevistaAsincronicaListSerializer,
    EntrevistaAsincronicaDetailSerializer,
    EntrevistaAsincronicaCreateSerializer,
    EntrevistaAsincronicaPublicSerializer,
    ResponderEntrevistaAsincronicaSerializer,
    VacantePublicaListSerializer,
    VacantePublicaDetailSerializer,
    PostulacionPublicaSerializer,
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
    permission_classes = [IsAuthenticated, GranularActionPermission]
    section_code = 'seleccion_contratacion'


class TipoEntidadViewSet(viewsets.ModelViewSet):
    """ViewSet para TipoEntidad"""
    queryset = TipoEntidad.objects.filter(is_active=True).order_by('orden')
    serializer_class = TipoEntidadSerializer
    permission_classes = [IsAuthenticated, GranularActionPermission]
    section_code = 'seleccion_contratacion'


class EntidadSeguridadSocialViewSet(viewsets.ModelViewSet):
    """ViewSet para EntidadSeguridadSocial"""
    serializer_class = EntidadSeguridadSocialSerializer
    permission_classes = [IsAuthenticated, GranularActionPermission]
    section_code = 'seleccion_contratacion'

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
    permission_classes = [IsAuthenticated, GranularActionPermission]
    section_code = 'seleccion_contratacion'


# =============================================================================
# VACANTE ACTIVA
# =============================================================================

class VacanteActivaViewSet(ResumenRevisionMixin, viewsets.ModelViewSet):
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
    permission_classes = [IsAuthenticated, GranularActionPermission]
    section_code = 'seleccion_contratacion'

    # ResumenRevisionMixin config
    resumen_date_field = 'created_at'
    resumen_modulo_nombre = 'seleccion_contratacion'

    def get_resumen_data(self, queryset, fecha_desde, fecha_hasta):
        """Resumen de selección para Revisión por la Dirección."""
        total_vacantes = queryset.count()
        abiertas = queryset.filter(estado='abierta').count()
        cerradas = queryset.filter(estado='cerrada').count()
        cubiertas = queryset.filter(estado='cubierta').count()

        candidatos = Candidato.objects.filter(
            is_active=True,
            created_at__date__range=[fecha_desde, fecha_hasta]
        )
        total_candidatos = candidatos.count()
        contratados = candidatos.filter(estado='contratado').count()

        tasa_efectividad = round(
            (contratados / total_vacantes * 100), 1
        ) if total_vacantes > 0 else 0

        return {
            'vacantes_total': total_vacantes,
            'vacantes_abiertas': abiertas,
            'vacantes_cerradas': cerradas,
            'vacantes_cubiertas': cubiertas,
            'candidatos_total': total_candidatos,
            'candidatos_contratados': contratados,
            'tasa_efectividad': tasa_efectividad,
        }

    def get_queryset(self):
        queryset = VacanteActiva.objects.filter(is_active=True)

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

        return queryset.select_related('cargo', 'cargo__area', 'tipo_contrato', 'responsable_proceso', 'reclutador')

    def get_serializer_class(self):
        if self.action == 'list':
            return VacanteActivaListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return VacanteActivaCreateUpdateSerializer
        return VacanteActivaDetailSerializer

    def perform_create(self, serializer):
        user = self.request.user
        serializer.save(
            empresa=get_tenant_empresa(),
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

    @action(detail=True, methods=['get'])
    def perfilamiento(self, request, pk=None):
        """
        Calcula el score de matching de cada candidato para esta vacante.

        Factores (100 puntos total):
        - Educacion (20pts): nivel_educativo del candidato
        - Experiencia (20pts): anos_experiencia + anos_experiencia_cargo
        - Salario (15pts): pretension_salarial dentro del rango
        - Entrevistas (20pts): promedio calificaciones entrevistas
        - Pruebas (15pts): promedio porcentaje pruebas dinamicas
        - Evaluacion HR (10pts): calificacion_general del candidato
        """
        vacante = self.get_object()
        candidatos = Candidato.objects.filter(
            vacante=vacante,
            is_active=True,
        ).exclude(estado='rechazado')

        # Mapa de nivel educativo -> puntaje (0-20)
        NIVEL_EDUCATIVO_SCORE = {
            'bachiller': 4,
            'tecnico': 8,
            'tecnologo': 12,
            'profesional': 16,
            'especializacion': 18,
            'maestria': 19,
            'doctorado': 20,
        }

        results = []
        for candidato in candidatos:
            scores = {}

            # 1. Educacion (20pts)
            scores['educacion'] = NIVEL_EDUCATIVO_SCORE.get(
                candidato.nivel_educativo, 0
            )

            # 2. Experiencia (20pts) = 10pts general + 10pts especifica
            exp_general = min(candidato.anos_experiencia or 0, 10)  # Max 10 anos
            exp_cargo = min(candidato.anos_experiencia_cargo or 0, 10)
            scores['experiencia'] = exp_general + exp_cargo

            # 3. Salario (15pts)
            pretension = candidato.pretension_salarial
            if pretension and vacante.salario_minimo and vacante.salario_maximo:
                sal_min = float(vacante.salario_minimo)
                sal_max = float(vacante.salario_maximo)
                pret = float(pretension)
                if sal_min <= pret <= sal_max:
                    scores['salario'] = 15
                elif pret < sal_min:
                    # Candidato pide menos (positivo, pero podria indicar sub-calificacion)
                    ratio = pret / sal_min if sal_min > 0 else 0
                    scores['salario'] = round(max(ratio * 12, 5))
                else:
                    # Candidato pide mas
                    ratio = sal_max / pret if pret > 0 else 0
                    scores['salario'] = round(max(ratio * 10, 0))
            else:
                scores['salario'] = 8  # Neutral si no hay datos

            # 4. Entrevistas (20pts) - promedio de calificaciones
            entrevistas = Entrevista.objects.filter(
                candidato=candidato,
                estado='realizada',
            ).values_list('calificacion_general', flat=True)
            entrevista_scores = [e for e in entrevistas if e is not None]

            entrevistas_async = EntrevistaAsincronica.objects.filter(
                candidato=candidato,
                estado='evaluada',
            ).values_list('calificacion_general', flat=True)
            entrevista_scores.extend(
                [e for e in entrevistas_async if e is not None]
            )

            if entrevista_scores:
                avg_entrevista = sum(entrevista_scores) / len(entrevista_scores)
                scores['entrevistas'] = round(avg_entrevista / 100 * 20)
            else:
                scores['entrevistas'] = 0

            # 5. Pruebas (15pts) - promedio porcentaje de pruebas dinamicas
            pruebas_pct = AsignacionPruebaDinamica.objects.filter(
                candidato=candidato,
                estado__in=['completada', 'calificada'],
                porcentaje__isnull=False,
            ).values_list('porcentaje', flat=True)
            pruebas_list = [float(p) for p in pruebas_pct]

            # Tambien considerar Prueba (modelo legacy)
            pruebas_legacy = Prueba.objects.filter(
                candidato=candidato,
                estado='calificada',
                calificacion__isnull=False,
            ).values_list('calificacion', flat=True)
            pruebas_list.extend([float(p) for p in pruebas_legacy])

            if pruebas_list:
                avg_prueba = sum(pruebas_list) / len(pruebas_list)
                scores['pruebas'] = round(avg_prueba / 100 * 15)
            else:
                scores['pruebas'] = 0

            # 6. Evaluacion HR (10pts) - calificacion_general
            cal_general = candidato.calificacion_general
            if cal_general is not None and cal_general > 0:
                scores['evaluacion_hr'] = round(cal_general / 100 * 10)
            else:
                scores['evaluacion_hr'] = 0

            # Total
            total = sum(scores.values())

            results.append({
                'candidato_id': candidato.id,
                'candidato_nombre': candidato.nombre_completo,
                'estado': candidato.estado,
                'estado_display': candidato.get_estado_display(),
                'nivel_educativo': candidato.nivel_educativo,
                'nivel_educativo_display': candidato.get_nivel_educativo_display(),
                'anos_experiencia': candidato.anos_experiencia,
                'pretension_salarial': str(candidato.pretension_salarial) if candidato.pretension_salarial else None,
                'scores': scores,
                'total': total,
                'nivel': (
                    'excelente' if total >= 75
                    else 'bueno' if total >= 55
                    else 'regular' if total >= 35
                    else 'bajo'
                ),
            })

        # Ordenar por total descendente
        results.sort(key=lambda r: r['total'], reverse=True)

        return Response({
            'vacante_id': vacante.id,
            'vacante_titulo': vacante.titulo,
            'vacante_codigo': vacante.codigo_vacante,
            'salario_rango': (
                f"{vacante.salario_minimo or 0:,.0f} - {vacante.salario_maximo or 0:,.0f} COP"
                if vacante.salario_minimo or vacante.salario_maximo
                else None
            ),
            'total_candidatos': len(results),
            'candidatos': results,
        })


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
    permission_classes = [IsAuthenticated, GranularActionPermission]
    section_code = 'seleccion_contratacion'

    def get_queryset(self):
        queryset = Candidato.objects.filter(is_active=True)

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
        serializer.save(
            empresa=get_tenant_empresa(),
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

    @action(detail=True, methods=['post'], url_path='cambiar-estado')
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
        """
        Flujo completo de contratación: Candidato → Colaborador + Contrato + Onboarding.

        Request body:
        {
            "datos_contrato": {
                "numero_contrato": "CTR-2026-001",
                "tipo_contrato_id": 1,
                "fecha_inicio": "2026-03-01",
                "fecha_fin": null,
                "salario_pactado": 3500000,
                "objeto_contrato": "Prestación de servicios profesionales...",
                "justificacion_tipo_contrato": "Cargo permanente en la organización",
                "generar_documento": false,
                "plantilla_id": null
            }
        }
        """
        from apps.talent_hub.services.contratacion_service import ContratacionService

        datos_contrato = request.data.get('datos_contrato', {})

        # Soporte legacy: si no viene datos_contrato, armar desde campos planos
        if not datos_contrato:
            datos_contrato = {
                'numero_contrato': request.data.get('numero_contrato', ''),
                'tipo_contrato_id': request.data.get('tipo_contrato_id'),
                'fecha_inicio': request.data.get(
                    'fecha_contratacion',
                    str(timezone.now().date())
                ),
                'fecha_fin': request.data.get('fecha_fin'),
                'salario_pactado': request.data.get('salario_ofrecido'),
                'objeto_contrato': request.data.get('objeto_contrato', ''),
                'justificacion_tipo_contrato': request.data.get(
                    'justificacion_tipo_contrato', ''
                ),
            }

        resultado = ContratacionService.contratar_candidato(
            candidato_id=pk,
            datos_contrato=datos_contrato,
            usuario_contratante=request.user,
        )

        return Response({
            'message': 'Candidato contratado exitosamente',
            'colaborador_id': resultado['colaborador'].id,
            'colaborador_nombre': resultado['colaborador'].get_nombre_completo(),
            'contrato_id': resultado['contrato'].id,
            'contrato_numero': resultado['contrato'].numero_contrato,
            'onboarding': resultado['onboarding'],
            'documento_id': (
                resultado['documento'].id if resultado.get('documento') else None
            ),
        })


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
    permission_classes = [IsAuthenticated, GranularActionPermission]
    section_code = 'seleccion_contratacion'

    def get_queryset(self):
        queryset = Entrevista.objects.filter(is_active=True)

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
        serializer.save(
            empresa=get_tenant_empresa(),
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
    permission_classes = [IsAuthenticated, GranularActionPermission]
    section_code = 'seleccion_contratacion'

    def get_queryset(self):
        queryset = Prueba.objects.filter(is_active=True)

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
        serializer.save(
            empresa=get_tenant_empresa(),
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
    permission_classes = [IsAuthenticated, GranularActionPermission]
    section_code = 'seleccion_contratacion'

    def get_queryset(self):
        queryset = AfiliacionSS.objects.filter(is_active=True)

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
        serializer.save(
            empresa=get_tenant_empresa(),
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
    permission_classes = [IsAuthenticated, GranularActionPermission]
    section_code = 'seleccion_contratacion'

    def list(self, request):
        """Retorna estadísticas generales del proceso de selección"""
        # Vacantes
        vacantes = VacanteActiva.objects.filter(is_active=True)
        vacantes_abiertas = vacantes.filter(estado__in=['abierta', 'en_proceso']).count()

        # Candidatos
        candidatos = Candidato.objects.filter(is_active=True)
        candidatos_en_proceso = candidatos.filter(
            estado__in=['postulado', 'preseleccionado', 'en_evaluacion']
        ).count()
        candidatos_aprobados = candidatos.filter(estado='aprobado').count()
        candidatos_contratados = candidatos.filter(estado='contratado').count()
        candidatos_rechazados = candidatos.filter(estado='rechazado').count()

        # Entrevistas
        entrevistas = Entrevista.objects.filter(is_active=True)
        entrevistas_programadas = entrevistas.filter(estado='programada').count()
        entrevistas_realizadas = entrevistas.filter(estado='realizada').count()

        # Pruebas
        pruebas_pendientes = Prueba.objects.filter(
            is_active=True,
            estado='programada',
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
    permission_classes = [IsAuthenticated, GranularActionPermission]
    section_code = 'seleccion_contratacion'

    def get_queryset(self):
        queryset = HistorialContrato.objects.filter(is_active=True)

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
            empresa=get_tenant_empresa(),
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

    @action(detail=False, methods=['get'], url_path='por-vencer')
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

    @action(detail=True, methods=['post'])
    def renovar(self, request, pk=None):
        """
        Renueva un contrato existente (Ley 2466/2025 compliance).

        Request body:
        {
            "fecha_inicio": "2026-04-01",
            "fecha_fin": "2027-03-31",
            "salario_pactado": 3800000,
            "objeto_contrato": "Renovación...",
            "justificacion_tipo_contrato": "..."
        }
        """
        from apps.talent_hub.services.contratacion_service import ContratacionService

        nuevo_contrato = ContratacionService.renovar_contrato(
            historial_contrato_id=pk,
            datos_renovacion=request.data,
            usuario=request.user,
        )

        serializer = HistorialContratoDetailSerializer(nuevo_contrato)
        return Response({
            'message': 'Contrato renovado exitosamente',
            'contrato': serializer.data,
            'warnings': nuevo_contrato.get_warnings(),
        })

    @action(detail=True, methods=['post'])
    def otrosi(self, request, pk=None):
        """
        Crea un otrosí (modificación) al contrato.

        Request body:
        {
            "numero_contrato": "OTR-CTR-2026-001",
            "salario_pactado": 4000000,
            "objeto_contrato": "Descripción de las modificaciones...",
            "justificacion_tipo_contrato": "...",
            "fecha_fin": "2027-06-30"
        }
        """
        from apps.talent_hub.services.contratacion_service import ContratacionService

        otrosi = ContratacionService.crear_otrosi(
            historial_contrato_id=pk,
            datos_otrosi=request.data,
            usuario=request.user,
        )

        serializer = HistorialContratoDetailSerializer(otrosi)
        return Response({
            'message': 'Otrosí creado exitosamente',
            'contrato': serializer.data,
        })

    @action(detail=True, methods=['post'], url_path='enviar-contrato')
    def enviar_contrato(self, request, pk=None):
        """
        Genera token de firma y envía email al colaborador para firmar contrato.

        Flujo:
        1. Genera token UUID único
        2. Establece expiración a 7 días
        3. Envía email al colaborador con link de firma
        4. Retorna token generado
        """
        import uuid
        from datetime import timedelta

        contrato = self.get_object()

        if contrato.firmado:
            return Response(
                {'detail': 'Este contrato ya fue firmado.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Generar token
        token = uuid.uuid4().hex
        contrato.firma_token = token
        contrato.firma_token_expira = timezone.now() + timedelta(days=7)
        contrato.save(update_fields=[
            'firma_token', 'firma_token_expira', 'updated_at'
        ])

        # Enviar email al colaborador
        self._enviar_email_firma_contrato(contrato)

        return Response({
            'message': 'Contrato enviado para firma digital',
            'token': token,
            'expira': contrato.firma_token_expira.isoformat(),
        })

    def _enviar_email_firma_contrato(self, contrato):
        """Envía email con link para firmar contrato digitalmente."""
        from django.core.mail import send_mail
        from django.conf import settings as django_settings
        from django.template.loader import render_to_string

        colaborador = contrato.colaborador

        # Obtener email del colaborador (usuario vinculado o email personal)
        email_destino = None
        if colaborador.usuario and colaborador.usuario.email:
            email_destino = colaborador.usuario.email
        elif colaborador.email_personal:
            email_destino = colaborador.email_personal

        if not email_destino:
            return  # Sin email, no se puede enviar

        # Construir URL pública
        domain = self.request.get_host()
        protocol = 'https' if self.request.is_secure() else 'http'
        action_url = f"{protocol}://{domain}/contratos/firmar/{contrato.firma_token}"

        context = {
            'colaborador_nombre': colaborador.get_nombre_completo(),
            'numero_contrato': contrato.numero_contrato,
            'tipo_contrato': contrato.tipo_contrato.nombre,
            'fecha_inicio': contrato.fecha_inicio.strftime('%d/%m/%Y'),
            'fecha_fin': contrato.fecha_fin.strftime('%d/%m/%Y') if contrato.fecha_fin else 'Indefinido',
            'salario_pactado': f"${contrato.salario_pactado:,.0f}",
            'objeto_contrato': contrato.objeto_contrato or 'No especificado',
            'fecha_expiracion': contrato.firma_token_expira.strftime('%d/%m/%Y %H:%M'),
            'action_url': action_url,
        }

        html_content = render_to_string(
            'emails/contrato_firma_digital.html', context
        )

        try:
            send_mail(
                subject=f'Firma de contrato requerida: {contrato.numero_contrato}',
                message='',
                from_email=django_settings.DEFAULT_FROM_EMAIL,
                recipient_list=[email_destino],
                html_message=html_content,
                fail_silently=False,
            )
        except Exception:
            pass  # Log silently, token was already generated

    @action(detail=True, methods=['post'], url_path='reenviar-contrato')
    def reenviar_contrato(self, request, pk=None):
        """Reenvía el email de firma para un contrato ya enviado."""
        import uuid
        from datetime import timedelta

        contrato = self.get_object()

        if contrato.firmado:
            return Response(
                {'detail': 'Este contrato ya fue firmado.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not contrato.firma_token:
            return Response(
                {'detail': 'Este contrato no ha sido enviado para firma.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Regenerar token y extender expiración
        contrato.firma_token = uuid.uuid4().hex
        contrato.firma_token_expira = timezone.now() + timedelta(days=7)
        contrato.save(update_fields=[
            'firma_token', 'firma_token_expira', 'updated_at'
        ])

        self._enviar_email_firma_contrato(contrato)

        return Response({
            'message': 'Email de firma reenviado exitosamente',
            'token': contrato.firma_token,
            'expira': contrato.firma_token_expira.isoformat(),
        })


class FirmarContratoPublicView(viewsets.ViewSet):
    """
    Vista pública (AllowAny) para que colaboradores firmen contratos digitalmente.

    GET  /firmar-contrato/{token}/ → Ver información del contrato
    PUT  /firmar-contrato/{token}/ → Enviar firma y marcar como firmado
    """
    # AllowAny: endpoint público accedido por colaboradores via token único en email.
    # La autenticación se realiza mediante firma_token (UUID single-use con expiración).
    permission_classes = [AllowAny]
    authentication_classes = []

    def retrieve(self, request, pk=None):
        """Retorna información del contrato para visualización pública."""
        try:
            contrato = HistorialContrato.objects.select_related(
                'colaborador', 'tipo_contrato'
            ).get(firma_token=pk, is_active=True)
        except HistorialContrato.DoesNotExist:
            return Response(
                {'detail': 'Contrato no encontrado.'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Validar si ya fue firmado
        if contrato.firmado:
            return Response(
                {'detail': 'Este contrato ya fue firmado.', 'firmado': True},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validar si el token expiró
        if contrato.firma_token_expirado:
            return Response(
                {'detail': 'El enlace para firmar este contrato ha expirado.', 'expirado': True},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Datos del contrato para mostrar en la página pública
        data = {
            'numero_contrato': contrato.numero_contrato,
            'colaborador_nombre': contrato.colaborador.get_nombre_completo(),
            'tipo_contrato': contrato.tipo_contrato.nombre,
            'fecha_inicio': contrato.fecha_inicio.isoformat(),
            'fecha_fin': contrato.fecha_fin.isoformat() if contrato.fecha_fin else None,
            'salario_pactado': str(contrato.salario_pactado),
            'objeto_contrato': contrato.objeto_contrato or '',
            'tipo_movimiento': contrato.get_tipo_movimiento_display(),
            'archivo_contrato': contrato.archivo_contrato.url if contrato.archivo_contrato else None,
            'fecha_expiracion': contrato.firma_token_expira.isoformat() if contrato.firma_token_expira else None,
        }

        return Response(data)

    def update(self, request, pk=None):
        """Recibe la firma digital y marca el contrato como firmado."""
        try:
            contrato = HistorialContrato.objects.select_related(
                'colaborador', 'tipo_contrato'
            ).get(firma_token=pk, is_active=True)
        except HistorialContrato.DoesNotExist:
            return Response(
                {'detail': 'Contrato no encontrado.'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Validaciones
        if contrato.firmado:
            return Response(
                {'detail': 'Este contrato ya fue firmado.', 'firmado': True},
                status=status.HTTP_400_BAD_REQUEST
            )

        if contrato.firma_token_expirado:
            return Response(
                {'detail': 'El enlace para firmar este contrato ha expirado.', 'expirado': True},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validar firma
        firma_imagen = request.data.get('firma_imagen')
        if not firma_imagen:
            return Response(
                {'detail': 'La firma digital es requerida.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validar formato y tamaño de firma Base64
        if not isinstance(firma_imagen, str) or not firma_imagen.startswith('data:image/'):
            return Response(
                {'detail': 'Formato de firma inválido. Se espera una imagen Base64.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        # Limitar tamaño (~2MB en Base64 ≈ 2.7M caracteres)
        if len(firma_imagen) > 3_000_000:
            return Response(
                {'detail': 'La imagen de firma excede el tamaño máximo permitido.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Obtener IP del firmante
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0].strip()
        else:
            ip = request.META.get('REMOTE_ADDR')

        user_agent = request.META.get('HTTP_USER_AGENT', '')

        # Guardar firma y marcar como firmado
        contrato.firma_imagen = firma_imagen
        contrato.firma_ip = ip
        contrato.firma_user_agent = user_agent
        contrato.firmado = True
        contrato.fecha_firma = timezone.now()
        # Limpiar token (single-use)
        contrato.firma_token = None
        contrato.firma_token_expira = None
        contrato.save(update_fields=[
            'firma_imagen', 'firma_ip', 'firma_user_agent',
            'firmado', 'fecha_firma',
            'firma_token', 'firma_token_expira',
            'updated_at',
        ])

        return Response({
            'message': 'Contrato firmado exitosamente',
            'fecha_firma': contrato.fecha_firma.isoformat(),
        })


# =============================================================================
# PRUEBAS TÉCNICAS DINÁMICAS
# =============================================================================

class PlantillaPruebaDinamicaViewSet(viewsets.ModelViewSet):
    """
    CRUD de Plantillas de Pruebas Dinámicas (Form Builder).
    """
    permission_classes = [IsAuthenticated, GranularActionPermission]
    section_code = 'seleccion_contratacion'
    filterset_fields = ['categoria', 'tipo_scoring', 'is_active']
    search_fields = ['nombre', 'descripcion', 'categoria']
    ordering_fields = ['nombre', 'created_at', 'total_asignaciones']
    ordering = ['-created_at']

    def get_queryset(self):
        return PlantillaPruebaDinamica.objects.all()

    def get_serializer_class(self):
        if self.action == 'list':
            return PlantillaPruebaDinamicaListSerializer
        if self.action in ('create', 'update', 'partial_update'):
            return PlantillaPruebaDinamicaCreateSerializer
        return PlantillaPruebaDinamicaDetailSerializer

    def perform_create(self, serializer):
        serializer.save(
            empresa=get_tenant_empresa(),
            created_by=self.request.user
        )

    @action(detail=False, methods=['get'])
    def activas(self, request):
        """Lista solo plantillas activas"""
        queryset = self.get_queryset().filter(is_active=True)
        serializer = PlantillaPruebaDinamicaListSerializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def duplicar(self, request, pk=None):
        """Duplica una plantilla existente"""
        original = self.get_object()
        nueva = PlantillaPruebaDinamica.objects.create(
            empresa=original.empresa,
            nombre=f'{original.nombre} (copia)',
            descripcion=original.descripcion,
            instrucciones=original.instrucciones,
            campos=original.campos,
            scoring_config=original.scoring_config,
            tipo_scoring=original.tipo_scoring,
            duracion_estimada_minutos=original.duracion_estimada_minutos,
            tiempo_limite_minutos=original.tiempo_limite_minutos,
            categoria=original.categoria,
            created_by=request.user,
        )
        serializer = PlantillaPruebaDinamicaDetailSerializer(nueva)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class AsignacionPruebaDinamicaViewSet(viewsets.ModelViewSet):
    """
    CRUD de Asignaciones de Pruebas Dinámicas.
    """
    permission_classes = [IsAuthenticated, GranularActionPermission]
    section_code = 'seleccion_contratacion'
    filterset_fields = ['candidato', 'plantilla', 'estado']
    search_fields = ['candidato__nombres', 'candidato__apellidos', 'plantilla__nombre']
    ordering = ['-fecha_asignacion']

    def get_queryset(self):
        return AsignacionPruebaDinamica.objects.all(
        ).select_related('plantilla', 'candidato', 'vacante', 'asignado_por')

    def get_serializer_class(self):
        if self.action == 'list':
            return AsignacionPruebaDinamicaListSerializer
        if self.action in ('create',):
            return AsignacionPruebaDinamicaCreateSerializer
        return AsignacionPruebaDinamicaDetailSerializer

    def perform_create(self, serializer):
        from datetime import timedelta
        dias = serializer.validated_data.pop('dias_vencimiento', 7)
        enviar_email = serializer.validated_data.pop('enviar_email', True)

        asignacion = serializer.save(
            empresa=get_tenant_empresa(),
            asignado_por=self.request.user,
            fecha_vencimiento=timezone.now() + timedelta(days=dias),
        )

        # Incrementar contador de la plantilla
        asignacion.plantilla.total_asignaciones += 1
        asignacion.plantilla.save(update_fields=['total_asignaciones'])

        # Enviar email al candidato
        if enviar_email and asignacion.candidato.email:
            try:
                from apps.audit_system.centro_notificaciones.email_service import EmailService
                frontend_url = 'https://app.stratekaz.com'
                EmailService.send_email(
                    to_email=asignacion.candidato.email,
                    subject=f'Prueba asignada: {asignacion.plantilla.nombre}',
                    template_name='prueba_dinamica_asignada',
                    context={
                        'candidato_nombre': asignacion.candidato.nombre_completo,
                        'prueba_nombre': asignacion.plantilla.nombre,
                        'prueba_descripcion': asignacion.plantilla.descripcion,
                        'duracion': asignacion.plantilla.duracion_estimada_minutos,
                        'fecha_vencimiento': asignacion.fecha_vencimiento.strftime('%d/%m/%Y %H:%M') if asignacion.fecha_vencimiento else 'Sin límite',
                        'action_url': f'{frontend_url}/pruebas/responder/{asignacion.token}',
                    }
                )
                asignacion.email_enviado = True
                asignacion.save(update_fields=['email_enviado'])
            except Exception:
                pass  # Email failure should not block assignment

    @action(detail=False, methods=['get'], url_path='por-candidato')
    def por_candidato(self, request):
        """Lista asignaciones de un candidato"""
        candidato_id = request.query_params.get('candidato')
        if not candidato_id:
            return Response(
                {'detail': 'Se requiere el parámetro candidato.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        queryset = self.get_queryset().filter(candidato_id=candidato_id)
        serializer = AsignacionPruebaDinamicaListSerializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], url_path='calificar-manual')
    def calificar_manual(self, request, pk=None):
        """Calificación manual por HR (para campos de texto libre)"""
        asignacion = self.get_object()
        puntajes = request.data.get('puntajes', {})
        observaciones = request.data.get('observaciones', '')

        if asignacion.estado not in ('completada', 'calificada'):
            return Response(
                {'detail': 'Solo se pueden calificar pruebas completadas.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Actualizar detalle_calificacion con puntajes manuales
        detalle = asignacion.detalle_calificacion or {}
        from decimal import Decimal
        total_manual = Decimal('0')

        for campo_nombre, puntaje in puntajes.items():
            if campo_nombre in detalle and detalle[campo_nombre].get('requiere_revision_manual'):
                detalle[campo_nombre]['puntaje_obtenido'] = float(puntaje)
                detalle[campo_nombre]['requiere_revision_manual'] = False
                total_manual += Decimal(str(puntaje))

        # Recalcular totales
        total = sum(
            Decimal(str(d.get('puntaje_obtenido', 0) or 0))
            for d in detalle.values()
            if not d.get('requiere_revision_manual')
        )
        total_max = asignacion.puntaje_maximo or Decimal('0')

        asignacion.puntaje_obtenido = total
        asignacion.porcentaje = (total / total_max * 100) if total_max > 0 else Decimal('0')
        scoring_config = asignacion.plantilla.scoring_config or {}
        puntaje_aprobacion = scoring_config.get('puntaje_aprobacion', 60)
        asignacion.aprobado = float(asignacion.porcentaje) >= float(puntaje_aprobacion)
        asignacion.detalle_calificacion = detalle
        asignacion.estado = 'calificada'
        if observaciones:
            asignacion.observaciones = observaciones
        asignacion.save()

        serializer = AsignacionPruebaDinamicaDetailSerializer(asignacion)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], url_path='reenviar-email')
    def reenviar_email(self, request, pk=None):
        """Reenvía el email de invitación al candidato"""
        asignacion = self.get_object()
        if asignacion.estado not in ('pendiente',):
            return Response(
                {'detail': 'Solo se pueden reenviar pruebas pendientes.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        try:
            from apps.audit_system.centro_notificaciones.email_service import EmailService
            frontend_url = 'https://app.stratekaz.com'
            EmailService.send_email(
                to_email=asignacion.candidato.email,
                subject=f'Recordatorio - Prueba: {asignacion.plantilla.nombre}',
                template_name='prueba_dinamica_asignada',
                context={
                    'candidato_nombre': asignacion.candidato.nombre_completo,
                    'prueba_nombre': asignacion.plantilla.nombre,
                    'prueba_descripcion': asignacion.plantilla.descripcion,
                    'duracion': asignacion.plantilla.duracion_estimada_minutos,
                    'fecha_vencimiento': asignacion.fecha_vencimiento.strftime('%d/%m/%Y %H:%M') if asignacion.fecha_vencimiento else 'Sin límite',
                    'action_url': f'{frontend_url}/pruebas/responder/{asignacion.token}',
                }
            )
            return Response({'detail': 'Email reenviado exitosamente.'})
        except Exception as e:
            return Response(
                {'detail': f'Error al enviar email: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class ResponderPruebaDinamicaViewSet(viewsets.ViewSet):
    """
    Endpoint público (sin autenticación) para que el candidato responda la prueba.

    GET  /responder-prueba/{token}/ → Obtener datos de la prueba
    POST /responder-prueba/{token}/ → Enviar respuestas
    """
    # AllowAny: candidatos externos responden pruebas via token único enviado por email.
    # La autenticación se realiza mediante token UUID con expiración.
    permission_classes = [AllowAny]
    authentication_classes = []

    def retrieve(self, request, pk=None):
        """Obtiene los datos de la prueba para el candidato (sin respuestas correctas)"""
        try:
            asignacion = AsignacionPruebaDinamica.objects.select_related(
                'plantilla', 'candidato', 'vacante'
            ).get(token=pk)
        except AsignacionPruebaDinamica.DoesNotExist:
            return Response(
                {'detail': 'Prueba no encontrada o enlace inválido.'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Verificar estado
        if asignacion.estado in ('completada', 'calificada'):
            return Response(
                {'detail': 'Esta prueba ya fue completada.', 'completada': True},
                status=status.HTTP_400_BAD_REQUEST
            )
        if asignacion.estado in ('vencida', 'cancelada'):
            return Response(
                {'detail': 'Esta prueba ya no está disponible.', 'expirada': True},
                status=status.HTTP_400_BAD_REQUEST
            )
        if asignacion.esta_vencida:
            asignacion.estado = 'vencida'
            asignacion.save(update_fields=['estado'])
            return Response(
                {'detail': 'Esta prueba ha expirado.', 'expirada': True},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Marcar como en progreso si es pendiente
        if asignacion.estado == 'pendiente':
            asignacion.estado = 'en_progreso'
            asignacion.fecha_inicio = timezone.now()
            asignacion.save(update_fields=['estado', 'fecha_inicio'])

        # Preparar campos SIN respuestas correctas
        campos_publicos = []
        for campo in (asignacion.plantilla.campos or []):
            campo_limpio = {k: v for k, v in campo.items() if k != 'respuesta_correcta'}
            # También remover puntaje para no dar pistas
            campo_limpio.pop('puntaje', None)
            campos_publicos.append(campo_limpio)

        return Response({
            'token': asignacion.token,
            'prueba_nombre': asignacion.plantilla.nombre,
            'prueba_descripcion': asignacion.plantilla.descripcion,
            'instrucciones': asignacion.plantilla.instrucciones,
            'duracion_estimada_minutos': asignacion.plantilla.duracion_estimada_minutos,
            'tiempo_limite_minutos': asignacion.plantilla.tiempo_limite_minutos,
            'candidato_nombre': asignacion.candidato.nombre_completo,
            'vacante_titulo': asignacion.vacante.titulo if asignacion.vacante else '',
            'campos': campos_publicos,
            'fecha_inicio': asignacion.fecha_inicio,
            'fecha_vencimiento': asignacion.fecha_vencimiento,
        })

    def update(self, request, pk=None):
        """Recibe las respuestas del candidato"""
        try:
            asignacion = AsignacionPruebaDinamica.objects.select_related(
                'plantilla'
            ).get(token=pk)
        except AsignacionPruebaDinamica.DoesNotExist:
            return Response(
                {'detail': 'Prueba no encontrada.'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Validar estado
        if asignacion.estado in ('completada', 'calificada'):
            return Response(
                {'detail': 'Esta prueba ya fue completada.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        if asignacion.estado in ('vencida', 'cancelada'):
            return Response(
                {'detail': 'Esta prueba ya no está disponible.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = ResponderPruebaDinamicaSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Guardar respuestas
        asignacion.respuestas = serializer.validated_data['respuestas']
        asignacion.estado = 'completada'
        asignacion.fecha_completado = timezone.now()
        asignacion.ip_address = request.META.get('REMOTE_ADDR')
        asignacion.user_agent = request.META.get('HTTP_USER_AGENT', '')[:500]

        # Calcular scoring automático si aplica
        if asignacion.plantilla.tipo_scoring in ('automatico', 'mixto'):
            asignacion.calcular_scoring()
            if asignacion.plantilla.tipo_scoring == 'automatico':
                asignacion.estado = 'calificada'

        asignacion.save()

        return Response({
            'detail': 'Prueba completada exitosamente. Gracias por responder.',
            'completada': True,
        })


# =============================================================================
# ENTREVISTA ASINCRONICA
# =============================================================================

class EntrevistaAsincronicaViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión de Entrevistas Asincrónicas.

    Endpoints:
    - GET /entrevistas-async/ - Listar entrevistas asincronicas
    - POST /entrevistas-async/ - Crear entrevista asincronica
    - GET /entrevistas-async/{id}/ - Detalle
    - PUT /entrevistas-async/{id}/ - Actualizar
    - DELETE /entrevistas-async/{id}/ - Eliminar (soft)
    - GET /entrevistas-async/por-candidato/{id}/ - Filtrar por candidato
    - POST /entrevistas-async/{id}/evaluar/ - Evaluar respuestas
    - POST /entrevistas-async/{id}/reenviar-email/ - Reenviar email
    - POST /entrevistas-async/{id}/cancelar/ - Cancelar
    """
    permission_classes = [IsAuthenticated, GranularActionPermission]
    section_code = 'seleccion_contratacion'

    def get_queryset(self):
        queryset = EntrevistaAsincronica.objects.filter(is_active=True)

        candidato_id = self.request.query_params.get('candidato')
        if candidato_id:
            queryset = queryset.filter(candidato_id=candidato_id)

        estado = self.request.query_params.get('estado')
        if estado:
            queryset = queryset.filter(estado=estado)

        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(titulo__icontains=search) |
                Q(candidato__primer_nombre__icontains=search) |
                Q(candidato__primer_apellido__icontains=search)
            )

        return queryset.select_related('candidato', 'candidato__vacante', 'evaluador')

    def get_serializer_class(self):
        if self.action == 'create':
            return EntrevistaAsincronicaCreateSerializer
        if self.action == 'retrieve':
            return EntrevistaAsincronicaDetailSerializer
        return EntrevistaAsincronicaListSerializer

    def perform_create(self, serializer):
        user = self.request.user
        candidato = serializer.validated_data.get('candidato')
        dias_vencimiento = serializer.validated_data.pop('dias_vencimiento', 7)
        enviar_email = serializer.validated_data.pop('enviar_email', True)

        fecha_vencimiento = timezone.now() + timezone.timedelta(days=dias_vencimiento)

        instance = serializer.save(
            empresa=get_tenant_empresa(),
            fecha_vencimiento=fecha_vencimiento,
            created_by=user,
            updated_by=user,
        )

        # Enviar email al candidato
        if enviar_email and candidato.email:
            try:
                self._enviar_email_entrevista(instance, candidato)
                instance.email_enviado = True
                instance.fecha_envio = timezone.now()
                instance.estado = 'enviada'
                instance.save(update_fields=['email_enviado', 'fecha_envio', 'estado'])
            except Exception:
                pass  # No bloquear si falla email

    def _enviar_email_entrevista(self, entrevista, candidato):
        """Envia email con link de entrevista asincronica"""
        from django.core.mail import send_mail
        from django.conf import settings as django_settings
        from django.template.loader import render_to_string

        # Construir URL publica
        domain = self.request.get_host()
        protocol = 'https' if self.request.is_secure() else 'http'
        action_url = f"{protocol}://{domain}/entrevistas/responder/{entrevista.token}"

        context = {
            'candidato_nombre': candidato.nombre_completo,
            'entrevista_titulo': entrevista.titulo,
            'instrucciones': entrevista.instrucciones,
            'total_preguntas': entrevista.total_preguntas,
            'fecha_vencimiento': entrevista.fecha_vencimiento.strftime('%d/%m/%Y %H:%M') if entrevista.fecha_vencimiento else 'Sin limite',
            'action_url': action_url,
        }

        html_content = render_to_string(
            'emails/entrevista_asincronica_asignada.html', context
        )

        send_mail(
            subject=f'Entrevista asignada: {entrevista.titulo}',
            message='',
            from_email=django_settings.DEFAULT_FROM_EMAIL,
            recipient_list=[candidato.email],
            html_message=html_content,
            fail_silently=False,
        )

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)

    def perform_destroy(self, instance):
        instance.soft_delete()

    @action(detail=False, methods=['get'], url_path='por-candidato/(?P<candidato_id>[^/.]+)')
    def por_candidato(self, request, candidato_id=None):
        """Listar entrevistas asincronicas por candidato"""
        queryset = self.get_queryset().filter(candidato_id=candidato_id)
        serializer = EntrevistaAsincronicaListSerializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def evaluar(self, request, pk=None):
        """Evaluar respuestas de la entrevista"""
        entrevista = self.get_object()

        if entrevista.estado not in ('completada', 'evaluada'):
            return Response(
                {'detail': 'Solo se pueden evaluar entrevistas completadas.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        entrevista.evaluador = request.user
        entrevista.fecha_evaluacion = timezone.now()
        entrevista.calificacion_general = request.data.get('calificacion_general')
        entrevista.recomendacion = request.data.get('recomendacion')
        entrevista.fortalezas_identificadas = request.data.get('fortalezas_identificadas', '')
        entrevista.aspectos_mejorar = request.data.get('aspectos_mejorar', '')
        entrevista.observaciones_evaluador = request.data.get('observaciones_evaluador', '')
        entrevista.estado = 'evaluada'
        entrevista.updated_by = request.user
        entrevista.save()

        serializer = EntrevistaAsincronicaDetailSerializer(entrevista)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], url_path='reenviar-email')
    def reenviar_email(self, request, pk=None):
        """Reenviar email de entrevista al candidato"""
        entrevista = self.get_object()

        if entrevista.estado in ('completada', 'evaluada', 'cancelada'):
            return Response(
                {'detail': 'No se puede reenviar email para esta entrevista.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            self._enviar_email_entrevista(entrevista, entrevista.candidato)
            entrevista.email_enviado = True
            entrevista.fecha_envio = timezone.now()
            if entrevista.estado == 'pendiente':
                entrevista.estado = 'enviada'
            entrevista.save(update_fields=['email_enviado', 'fecha_envio', 'estado'])
            return Response({'detail': 'Email reenviado exitosamente.'})
        except Exception as e:
            return Response(
                {'detail': f'Error al enviar email: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['post'])
    def cancelar(self, request, pk=None):
        """Cancelar entrevista asincronica"""
        entrevista = self.get_object()

        if entrevista.estado in ('evaluada',):
            return Response(
                {'detail': 'No se puede cancelar una entrevista ya evaluada.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        entrevista.estado = 'cancelada'
        entrevista.updated_by = request.user
        entrevista.save(update_fields=['estado', 'updated_by', 'updated_at'])

        serializer = EntrevistaAsincronicaListSerializer(entrevista)
        return Response(serializer.data)


class ResponderEntrevistaAsincronicaViewSet(viewsets.ViewSet):
    """
    ViewSet publico (AllowAny) para que candidatos respondan entrevistas.

    GET /responder-entrevista/{token}/ - Ver preguntas
    PUT /responder-entrevista/{token}/ - Enviar respuestas
    """
    # AllowAny: candidatos externos responden entrevistas via token único enviado por email.
    # La autenticación se realiza mediante token UUID con expiración. Protegido por AnonRateThrottle.
    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_classes = [AnonRateThrottle]
    lookup_field = 'token'

    def retrieve(self, request, pk=None):
        """Retorna la entrevista con preguntas para el candidato"""
        try:
            entrevista = EntrevistaAsincronica.objects.select_related(
                'candidato', 'empresa'
            ).get(token=pk, is_active=True)
        except EntrevistaAsincronica.DoesNotExist:
            return Response(
                {'detail': 'Entrevista no encontrada.'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Validar estado
        if entrevista.estado in ('completada', 'evaluada'):
            return Response(
                {'detail': 'Esta entrevista ya fue completada. Gracias por tu participacion.', 'completada': True},
                status=status.HTTP_400_BAD_REQUEST
            )
        if entrevista.estado in ('cancelada',):
            return Response(
                {'detail': 'Esta entrevista fue cancelada.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        if entrevista.esta_vencida:
            entrevista.estado = 'vencida'
            entrevista.save(update_fields=['estado'])
            return Response(
                {'detail': 'Esta entrevista ha expirado.', 'expirada': True},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Marcar como en progreso si esta enviada
        if entrevista.estado in ('pendiente', 'enviada'):
            entrevista.estado = 'en_progreso'
            entrevista.fecha_inicio = timezone.now()
            entrevista.save(update_fields=['estado', 'fecha_inicio'])

        serializer = EntrevistaAsincronicaPublicSerializer(entrevista)
        return Response(serializer.data)

    def update(self, request, pk=None):
        """Recibe las respuestas del candidato"""
        try:
            entrevista = EntrevistaAsincronica.objects.select_related(
                'candidato'
            ).get(token=pk, is_active=True)
        except EntrevistaAsincronica.DoesNotExist:
            return Response(
                {'detail': 'Entrevista no encontrada.'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Validar estado
        if entrevista.estado in ('completada', 'evaluada'):
            return Response(
                {'detail': 'Esta entrevista ya fue completada.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        if entrevista.estado in ('vencida', 'cancelada'):
            return Response(
                {'detail': 'Esta entrevista ya no esta disponible.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = ResponderEntrevistaAsincronicaSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Validar preguntas obligatorias
        preguntas = entrevista.preguntas or []
        respuestas = serializer.validated_data['respuestas']
        for pregunta in preguntas:
            if pregunta.get('obligatoria', True):
                pregunta_id = pregunta.get('id', '')
                if pregunta_id not in respuestas or not str(respuestas[pregunta_id]).strip():
                    return Response(
                        {'detail': f'La pregunta "{pregunta.get("pregunta", "")}" es obligatoria.'},
                        status=status.HTTP_400_BAD_REQUEST
                    )

        # Guardar respuestas
        entrevista.respuestas = respuestas
        entrevista.estado = 'completada'
        entrevista.fecha_completado = timezone.now()
        entrevista.ip_address = request.META.get('REMOTE_ADDR')
        entrevista.user_agent = request.META.get('HTTP_USER_AGENT', '')[:500]
        entrevista.save()

        return Response({
            'detail': 'Entrevista completada exitosamente. Gracias por tus respuestas.',
            'completada': True,
        })


# =============================================================================
# PORTAL PÚBLICO DE VACANTES (AllowAny)
# =============================================================================

class VacantePublicaViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Vacantes públicas sin autenticación - solo abiertas y publicadas externamente.

    Endpoints:
    - GET /vacantes-publicas/ - Listar vacantes publicadas
    - GET /vacantes-publicas/{id}/ - Detalle de vacante
    - GET /vacantes-publicas/empresa-info/ - Info básica de la empresa
    """
    # AllowAny: portal público de empleo, solo lectura de vacantes abiertas y publicadas.
    # Protegido por AnonRateThrottle y filtro queryset (solo estado='abierta' + publicada_externamente=True).
    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_classes = [AnonRateThrottle]

    def get_queryset(self):
        queryset = VacanteActiva.objects.filter(
            estado='abierta',
            publicada_externamente=True,
            is_active=True,
        ).select_related('tipo_contrato').order_by('-prioridad', '-fecha_apertura')

        # Filtros opcionales
        modalidad = self.request.query_params.get('modalidad')
        if modalidad:
            queryset = queryset.filter(modalidad=modalidad)

        ubicacion = self.request.query_params.get('ubicacion')
        if ubicacion:
            queryset = queryset.filter(ubicacion__icontains=ubicacion)

        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(titulo__icontains=search) |
                Q(cargo_requerido__icontains=search) |
                Q(descripcion__icontains=search) |
                Q(area__icontains=search)
            )

        return queryset

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return VacantePublicaDetailSerializer
        return VacantePublicaListSerializer

    @action(detail=False, methods=['get'], url_path='empresa-info')
    def empresa_info(self, request):
        """Retorna información básica de la empresa para el portal público."""
        info = {
            'nombre': 'Empresa',
            'logo_url': None,
        }
        try:
            from django.apps import apps
            EmpresaConfig = apps.get_model('configuracion', 'EmpresaConfig')
            config = EmpresaConfig.objects.first()
            if config:
                info['nombre'] = config.razon_social
        except Exception:
            pass
        return Response(info)


class PostulacionThrottle(AnonRateThrottle):
    """Limita postulaciones a 5 por hora por IP para prevenir spam."""
    rate = '5/hour'


class PostulacionPublicaView(viewsets.ViewSet):
    """
    Permite a candidatos externos postularse a vacantes sin autenticación.

    POST /vacantes-publicas/{vacante_id}/postular/ - Crear postulación
    """
    # AllowAny: candidatos externos postulan desde el portal público de empleo.
    # Protegido por PostulacionThrottle (5/hora por IP) y validación de duplicados.
    permission_classes = [AllowAny]
    authentication_classes = []
    parser_classes = [MultiPartParser, FormParser]
    throttle_classes = [PostulacionThrottle]

    def create(self, request, vacante_id=None):
        """Procesa la postulación pública de un candidato externo."""

        # Verificar duplicado por numero_documento + vacante (409 Conflict)
        numero_documento = request.data.get('numero_documento', '').strip()
        if numero_documento and vacante_id:
            existe_duplicado = Candidato.objects.filter(
                vacante_id=vacante_id,
                numero_documento=numero_documento,
                is_active=True,
            ).exists()
            if existe_duplicado:
                return Response(
                    {'detail': 'Ya existe una postulación con este documento para esta vacante.'},
                    status=status.HTTP_409_CONFLICT,
                )

        # Inyectar vacante_id en los datos
        data = request.data.copy()
        data['vacante_id'] = vacante_id

        serializer = PostulacionPublicaSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        validated = serializer.validated_data

        # Obtener la vacante
        vacante = VacanteActiva.objects.get(
            id=validated['vacante_id'],
            estado='abierta',
            publicada_externamente=True,
            is_active=True,
        )

        # Crear el candidato
        candidato = Candidato(
            empresa=vacante.empresa,
            vacante=vacante,
            nombres=validated['nombres'],
            apellidos=validated['apellidos'],
            email=validated['email'],
            telefono=validated['telefono'],
            tipo_documento=validated['tipo_documento'],
            numero_documento=validated['numero_documento'],
            ciudad=validated['ciudad'],
            nivel_educativo=validated.get('nivel_educativo', 'profesional'),
            hoja_vida=validated['hoja_vida'],
            estado='postulado',
            origen_postulacion='portal_empleo',
        )

        # Guardar carta de presentación como texto en observaciones
        carta = validated.get('carta_presentacion', '').strip()
        if carta:
            candidato.observaciones = f"Carta de presentación:\n{carta}"

        candidato.save()

        # Notificar al reclutador/responsable
        try:
            from apps.talent_hub.services.notificador_th import NotificadorTH
            usuario_notificar = vacante.reclutador or vacante.responsable_proceso
            if usuario_notificar:
                from apps.audit_system.centro_notificaciones.services import NotificationService
                NotificationService.send_notification(
                    tipo_codigo='TH_NUEVA_POSTULACION',
                    usuario=usuario_notificar,
                    datos={
                        'candidato_nombre': f"{candidato.nombres} {candidato.apellidos}",
                        'vacante_titulo': vacante.titulo,
                        'vacante_codigo': vacante.codigo_vacante,
                        'origen': 'Portal de empleo',
                    },
                    url=f'/talent-hub/seleccion-contratacion/candidatos/{candidato.id}',
                    prioridad='normal',
                )
        except Exception:
            pass  # No bloquear la postulación si falla la notificación

        # Enviar email de confirmación al candidato
        try:
            self._enviar_email_confirmacion(candidato, vacante)
        except Exception:
            pass  # No bloquear la postulación si falla el email

        return Response(
            {
                'detail': 'Postulación registrada exitosamente. Te contactaremos pronto.',
                'candidato_id': candidato.id,
            },
            status=status.HTTP_201_CREATED,
        )

    def _enviar_email_confirmacion(self, candidato, vacante):
        """Envía email de confirmación de postulación al candidato."""
        from django.core.mail import send_mail
        from django.template.loader import render_to_string

        # Obtener branding de la empresa
        empresa_nombre = 'Empresa'
        empresa_logo_url = None
        primary_color = '#3B82F6'
        try:
            from django.apps import apps
            EmpresaConfig = apps.get_model('configuracion', 'EmpresaConfig')
            config = EmpresaConfig.objects.first()
            if config:
                empresa_nombre = config.razon_social or config.nombre_comercial or 'Empresa'
                if hasattr(config, 'logo') and config.logo:
                    empresa_logo_url = config.logo.url
                if hasattr(config, 'color_primario') and config.color_primario:
                    primary_color = config.color_primario
        except Exception:
            pass

        context = {
            'candidato_nombres': candidato.nombres,
            'candidato_apellidos': candidato.apellidos,
            'vacante_titulo': vacante.titulo,
            'vacante_cargo': vacante.cargo_requerido,
            'vacante_ubicacion': vacante.ubicacion,
            'empresa_nombre': empresa_nombre,
            'empresa_logo_url': empresa_logo_url,
            'primary_color': primary_color,
            'current_year': timezone.now().year,
        }

        html_message = render_to_string(
            'emails/confirmacion_postulacion.html', context
        )

        send_mail(
            subject=f'Confirmación de postulación - {empresa_nombre}',
            message=(
                f'Hola {candidato.nombres}, tu postulación a '
                f'{vacante.titulo} en {empresa_nombre} fue recibida exitosamente. '
                f'Nuestro equipo revisará tu perfil y te contactaremos pronto.'
            ),
            from_email=None,  # Usa DEFAULT_FROM_EMAIL
            recipient_list=[candidato.email],
            html_message=html_message,
            fail_silently=False,
        )
