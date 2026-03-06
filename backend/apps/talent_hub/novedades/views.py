"""
Views de Novedades - Talent Hub

ViewSets para gestión de incapacidades, licencias, permisos y vacaciones.
Multi-tenant: data isolation is automatic via django-tenants schema separation.
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.db.models import Q

from apps.core.base_models.mixins import get_tenant_empresa
from apps.gestion_estrategica.revision_direccion.services.resumen_mixin import ResumenRevisionMixin

from .models import (
    TipoIncapacidad,
    Incapacidad,
    TipoLicencia,
    Licencia,
    Permiso,
    PeriodoVacaciones,
    SolicitudVacaciones,
    ConfiguracionDotacion,
    EntregaDotacion
)
from .serializers import (
    # Tipos
    TipoIncapacidadListSerializer,
    TipoIncapacidadDetailSerializer,
    TipoLicenciaListSerializer,
    TipoLicenciaDetailSerializer,
    # Incapacidades
    IncapacidadListSerializer,
    IncapacidadDetailSerializer,
    IncapacidadCreateSerializer,
    # Licencias
    LicenciaListSerializer,
    LicenciaDetailSerializer,
    LicenciaCreateSerializer,
    # Permisos
    PermisoListSerializer,
    PermisoDetailSerializer,
    PermisoCreateSerializer,
    # Vacaciones
    PeriodoVacacionesListSerializer,
    PeriodoVacacionesDetailSerializer,
    PeriodoVacacionesCreateSerializer,
    SolicitudVacacionesListSerializer,
    SolicitudVacacionesDetailSerializer,
    SolicitudVacacionesCreateSerializer,
    # Dotación
    ConfiguracionDotacionSerializer,
    EntregaDotacionListSerializer,
    EntregaDotacionDetailSerializer,
    EntregaDotacionCreateSerializer,
)


# =============================================================================
# TIPOS DE INCAPACIDAD Y LICENCIA
# =============================================================================

class TipoIncapacidadViewSet(viewsets.ModelViewSet):
    """
    ViewSet para tipos de incapacidad.

    Catálogo de tipos según normativa colombiana (EPS/ARL).
    """
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Filtrar tipos activos del tenant."""
        return TipoIncapacidad.objects.filter(
            is_active=True
        ).order_by('nombre')

    def get_serializer_class(self):
        """Serializer según acción"""
        if self.action == 'list':
            return TipoIncapacidadListSerializer
        return TipoIncapacidadDetailSerializer

    def perform_create(self, serializer):
        serializer.save(
            empresa=get_tenant_empresa(),
            created_by=self.request.user
        )

    def perform_update(self, serializer):
        """Actualizar usuario de modificación"""
        serializer.save(updated_by=self.request.user)


class TipoLicenciaViewSet(viewsets.ModelViewSet):
    """
    ViewSet para tipos de licencia.

    Catálogo de tipos de licencia (remuneradas, no remuneradas, legales).
    """
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Filtrar tipos activos del tenant."""
        return TipoLicencia.objects.filter(
            is_active=True
        ).order_by('nombre')

    def get_serializer_class(self):
        """Serializer según acción"""
        if self.action == 'list':
            return TipoLicenciaListSerializer
        return TipoLicenciaDetailSerializer

    def perform_create(self, serializer):
        serializer.save(
            empresa=get_tenant_empresa(),
            created_by=self.request.user
        )

    def perform_update(self, serializer):
        """Actualizar usuario de modificación"""
        serializer.save(updated_by=self.request.user)


# =============================================================================
# INCAPACIDADES
# =============================================================================

class IncapacidadViewSet(ResumenRevisionMixin, viewsets.ModelViewSet):
    """
    ViewSet para incapacidades.

    Gestión completa de incapacidades con radicación y cobro a EPS/ARL.
    """
    permission_classes = [IsAuthenticated]

    # ResumenRevisionMixin config
    resumen_date_field = 'fecha_inicio'
    resumen_modulo_nombre = 'novedades'

    def get_resumen_data(self, queryset, fecha_desde, fecha_hasta):
        """Resumen de novedades para Revisión por la Dirección."""
        total_incapacidades = queryset.count()
        dias_perdidos = 0
        for inc in queryset:
            if inc.fecha_fin and inc.fecha_inicio:
                dias_perdidos += (inc.fecha_fin - inc.fecha_inicio).days + 1

        licencias = Licencia.objects.filter(
            is_active=True,
            fecha_inicio__range=[fecha_desde, fecha_hasta]
        ).count()

        permisos = Permiso.objects.filter(
            is_active=True,
            fecha__range=[fecha_desde, fecha_hasta]
        ).count()

        vacaciones = SolicitudVacaciones.objects.filter(
            is_active=True,
            fecha_inicio__range=[fecha_desde, fecha_hasta]
        ).count()

        return {
            'incapacidades': total_incapacidades,
            'dias_perdidos_incapacidad': dias_perdidos,
            'licencias': licencias,
            'permisos': permisos,
            'vacaciones_solicitadas': vacaciones,
        }

    def get_queryset(self):
        """Filtrar incapacidades activas del tenant."""
        return Incapacidad.objects.filter(
            is_active=True
        ).select_related(
            'colaborador',
            'tipo_incapacidad',
            'prorroga_de'
        ).order_by('-fecha_inicio')

    def get_serializer_class(self):
        """Serializer según acción"""
        if self.action == 'list':
            return IncapacidadListSerializer
        elif self.action == 'create':
            return IncapacidadCreateSerializer
        return IncapacidadDetailSerializer

    def perform_create(self, serializer):
        serializer.save(
            empresa=get_tenant_empresa(),
            created_by=self.request.user
        )

    def perform_update(self, serializer):
        """Actualizar usuario de modificación"""
        serializer.save(updated_by=self.request.user)

    @action(detail=True, methods=['post'])
    def aprobar(self, request, pk=None):
        """Aprobar una incapacidad"""
        incapacidad = self.get_object()

        if incapacidad.estado != 'pendiente':
            return Response(
                {'error': 'Solo se pueden aprobar incapacidades pendientes'},
                status=status.HTTP_400_BAD_REQUEST
            )

        incapacidad.estado = 'aprobada'
        incapacidad.save()

        serializer = self.get_serializer(incapacidad)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def rechazar(self, request, pk=None):
        """Rechazar una incapacidad"""
        incapacidad = self.get_object()

        if incapacidad.estado != 'pendiente':
            return Response(
                {'error': 'Solo se pueden rechazar incapacidades pendientes'},
                status=status.HTTP_400_BAD_REQUEST
            )

        incapacidad.estado = 'rechazada'
        incapacidad.observaciones = request.data.get('observaciones', '')
        incapacidad.save()

        serializer = self.get_serializer(incapacidad)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], url_path='radicar-cobro')
    def radicar_cobro(self, request, pk=None):
        """Radicar cobro a EPS/ARL"""
        incapacidad = self.get_object()

        if incapacidad.estado != 'aprobada':
            return Response(
                {'error': 'Solo se pueden radicar incapacidades aprobadas'},
                status=status.HTTP_400_BAD_REQUEST
            )

        fecha_radicacion = request.data.get('fecha_radicacion_cobro')
        if not fecha_radicacion:
            return Response(
                {'error': 'Debe especificar la fecha de radicación'},
                status=status.HTTP_400_BAD_REQUEST
            )

        incapacidad.estado = 'en_cobro'
        incapacidad.fecha_radicacion_cobro = fecha_radicacion
        incapacidad.save()

        serializer = self.get_serializer(incapacidad)
        return Response(serializer.data)

    @action(detail=True, methods=['get'], url_path='calcular-dias')
    def calcular_dias(self, request, pk=None):
        """Calcular días de incapacidad incluyendo prórrogas"""
        incapacidad = self.get_object()

        return Response({
            'dias_incapacidad': incapacidad.dias_incapacidad,
            'es_prorroga': incapacidad.es_prorroga,
            'tiene_prorrogas': incapacidad.tiene_prorrogas,
            'dias_totales_con_prorrogas': incapacidad.dias_totales_con_prorrogas
        })

    @action(detail=False, methods=['get'])
    def estadisticas(self, request):
        """Estadísticas de incapacidades por empresa"""
        queryset = self.get_queryset()

        total = queryset.count()
        por_estado = {}
        for estado_code, estado_name in Incapacidad._meta.get_field('estado').choices:
            por_estado[estado_code] = queryset.filter(estado=estado_code).count()

        return Response({
            'total': total,
            'por_estado': por_estado,
            'pendientes': por_estado.get('pendiente', 0),
            'aprobadas': por_estado.get('aprobada', 0),
            'en_cobro': por_estado.get('en_cobro', 0),
            'pagadas': por_estado.get('pagada', 0),
        })


# =============================================================================
# LICENCIAS
# =============================================================================

class LicenciaViewSet(viewsets.ModelViewSet):
    """
    ViewSet para licencias.

    Gestión de solicitudes de licencias con workflow de aprobación.
    """
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Filtrar licencias activas del tenant."""
        return Licencia.objects.filter(
            is_active=True
        ).select_related(
            'colaborador',
            'tipo_licencia',
            'aprobado_por'
        ).order_by('-fecha_inicio')

    def get_serializer_class(self):
        """Serializer según acción"""
        if self.action == 'list':
            return LicenciaListSerializer
        elif self.action == 'create':
            return LicenciaCreateSerializer
        return LicenciaDetailSerializer

    def perform_create(self, serializer):
        serializer.save(
            empresa=get_tenant_empresa(),
            created_by=self.request.user
        )

    def perform_update(self, serializer):
        """Actualizar usuario de modificación"""
        serializer.save(updated_by=self.request.user)

    @action(detail=True, methods=['post'])
    def aprobar(self, request, pk=None):
        """Aprobar una solicitud de licencia"""
        licencia = self.get_object()

        if licencia.estado != 'solicitada':
            return Response(
                {'error': 'Solo se pueden aprobar licencias solicitadas'},
                status=status.HTTP_400_BAD_REQUEST
            )

        licencia.estado = 'aprobada'
        licencia.aprobado_por = request.user
        licencia.fecha_aprobacion = timezone.now()
        licencia.observaciones_aprobacion = request.data.get('observaciones', '')
        licencia.save()

        serializer = self.get_serializer(licencia)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def rechazar(self, request, pk=None):
        """Rechazar una solicitud de licencia"""
        licencia = self.get_object()

        if licencia.estado != 'solicitada':
            return Response(
                {'error': 'Solo se pueden rechazar licencias solicitadas'},
                status=status.HTTP_400_BAD_REQUEST
            )

        observaciones = request.data.get('observaciones')
        if not observaciones:
            return Response(
                {'error': 'Debe especificar el motivo del rechazo'},
                status=status.HTTP_400_BAD_REQUEST
            )

        licencia.estado = 'rechazada'
        licencia.aprobado_por = request.user
        licencia.fecha_aprobacion = timezone.now()
        licencia.observaciones_aprobacion = observaciones
        licencia.save()

        serializer = self.get_serializer(licencia)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='pendientes-aprobacion')
    def pendientes_aprobacion(self, request):
        """Listar licencias pendientes de aprobación"""
        queryset = self.get_queryset().filter(estado='solicitada')
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


# =============================================================================
# PERMISOS
# =============================================================================

class PermisoViewSet(viewsets.ModelViewSet):
    """
    ViewSet para permisos.

    Gestión de permisos cortos (por horas) con aprobación.
    """
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Filtrar permisos activos del tenant."""
        return Permiso.objects.filter(
            is_active=True
        ).select_related(
            'colaborador',
            'aprobado_por'
        ).order_by('-fecha', '-hora_salida')

    def get_serializer_class(self):
        """Serializer según acción"""
        if self.action == 'list':
            return PermisoListSerializer
        elif self.action == 'create':
            return PermisoCreateSerializer
        return PermisoDetailSerializer

    def perform_create(self, serializer):
        serializer.save(
            empresa=get_tenant_empresa(),
            created_by=self.request.user
        )

    def perform_update(self, serializer):
        """Actualizar usuario de modificación"""
        serializer.save(updated_by=self.request.user)

    @action(detail=True, methods=['post'])
    def aprobar(self, request, pk=None):
        """Aprobar un permiso"""
        permiso = self.get_object()

        if permiso.estado != 'solicitado':
            return Response(
                {'error': 'Solo se pueden aprobar permisos solicitados'},
                status=status.HTTP_400_BAD_REQUEST
            )

        permiso.estado = 'aprobado'
        permiso.aprobado_por = request.user
        permiso.save()

        serializer = self.get_serializer(permiso)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def rechazar(self, request, pk=None):
        """Rechazar un permiso"""
        permiso = self.get_object()

        if permiso.estado != 'solicitado':
            return Response(
                {'error': 'Solo se pueden rechazar permisos solicitados'},
                status=status.HTTP_400_BAD_REQUEST
            )

        permiso.estado = 'rechazado'
        permiso.aprobado_por = request.user
        permiso.observaciones = request.data.get('observaciones', '')
        permiso.save()

        serializer = self.get_serializer(permiso)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='por-colaborador')
    def por_colaborador(self, request):
        """Listar permisos de un colaborador específico"""
        colaborador_id = request.query_params.get('colaborador_id')
        if not colaborador_id:
            return Response(
                {'error': 'Debe especificar colaborador_id'},
                status=status.HTTP_400_BAD_REQUEST
            )

        queryset = self.get_queryset().filter(colaborador_id=colaborador_id)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


# =============================================================================
# VACACIONES
# =============================================================================

class PeriodoVacacionesViewSet(viewsets.ModelViewSet):
    """
    ViewSet para períodos de vacaciones.

    Control de acumulación de vacaciones por colaborador.
    """
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Filtrar periodos activos del tenant."""
        return PeriodoVacaciones.objects.filter(
            is_active=True
        ).select_related('colaborador').order_by('-ultimo_corte')

    def get_serializer_class(self):
        """Serializer según acción"""
        if self.action == 'list':
            return PeriodoVacacionesListSerializer
        elif self.action == 'create':
            return PeriodoVacacionesCreateSerializer
        return PeriodoVacacionesDetailSerializer

    def perform_create(self, serializer):
        serializer.save(
            empresa=get_tenant_empresa(),
            created_by=self.request.user
        )

    def perform_update(self, serializer):
        """Actualizar usuario de modificación"""
        serializer.save(updated_by=self.request.user)

    @action(detail=True, methods=['post'], url_path='actualizar-acumulacion')
    def actualizar_acumulacion(self, request, pk=None):
        """Actualizar acumulación de días hasta hoy"""
        periodo = self.get_object()
        periodo.actualizar_acumulacion()

        serializer = self.get_serializer(periodo)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='por-colaborador')
    def por_colaborador(self, request):
        """Obtener período de un colaborador específico"""
        colaborador_id = request.query_params.get('colaborador_id')
        if not colaborador_id:
            return Response(
                {'error': 'Debe especificar colaborador_id'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            periodo = self.get_queryset().get(colaborador_id=colaborador_id)
            serializer = self.get_serializer(periodo)
            return Response(serializer.data)
        except PeriodoVacaciones.DoesNotExist:
            return Response(
                {'error': 'No existe período de vacaciones para este colaborador'},
                status=status.HTTP_404_NOT_FOUND
            )


class SolicitudVacacionesViewSet(viewsets.ModelViewSet):
    """
    ViewSet para solicitudes de vacaciones.

    Gestión de solicitudes con cálculo de días hábiles y workflow de aprobación.
    """
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Filtrar solicitudes activas del tenant."""
        return SolicitudVacaciones.objects.filter(
            is_active=True
        ).select_related(
            'colaborador',
            'periodo',
            'aprobado_por'
        ).order_by('-fecha_inicio')

    def get_serializer_class(self):
        """Serializer según acción"""
        if self.action == 'list':
            return SolicitudVacacionesListSerializer
        elif self.action == 'create':
            return SolicitudVacacionesCreateSerializer
        return SolicitudVacacionesDetailSerializer

    def perform_create(self, serializer):
        serializer.save(
            empresa=get_tenant_empresa(),
            created_by=self.request.user
        )

    def perform_update(self, serializer):
        """Actualizar usuario de modificación"""
        serializer.save(updated_by=self.request.user)

    @action(detail=True, methods=['post'])
    def aprobar(self, request, pk=None):
        """Aprobar solicitud de vacaciones"""
        solicitud = self.get_object()

        if solicitud.estado != 'solicitada':
            return Response(
                {'error': 'Solo se pueden aprobar solicitudes pendientes'},
                status=status.HTTP_400_BAD_REQUEST
            )

        solicitud.estado = 'aprobada'
        solicitud.aprobado_por = request.user
        solicitud.fecha_aprobacion = timezone.now()
        solicitud.save()

        # Descontar días del período
        periodo = solicitud.periodo
        periodo.dias_disfrutados += solicitud.dias_habiles
        periodo.save()

        serializer = self.get_serializer(solicitud)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def rechazar(self, request, pk=None):
        """Rechazar solicitud de vacaciones"""
        solicitud = self.get_object()

        if solicitud.estado != 'solicitada':
            return Response(
                {'error': 'Solo se pueden rechazar solicitudes pendientes'},
                status=status.HTTP_400_BAD_REQUEST
            )

        observaciones = request.data.get('observaciones')
        if not observaciones:
            return Response(
                {'error': 'Debe especificar el motivo del rechazo'},
                status=status.HTTP_400_BAD_REQUEST
            )

        solicitud.estado = 'rechazada'
        solicitud.aprobado_por = request.user
        solicitud.fecha_aprobacion = timezone.now()
        solicitud.observaciones = observaciones
        solicitud.save()

        serializer = self.get_serializer(solicitud)
        return Response(serializer.data)

    @action(detail=True, methods=['get'], url_path='calcular-dias')
    def calcular_dias(self, request, pk=None):
        """Calcular días hábiles de la solicitud"""
        solicitud = self.get_object()

        return Response({
            'dias_habiles': solicitud.dias_habiles,
            'dias_calendario': solicitud.dias_calendario,
            'fecha_inicio': solicitud.fecha_inicio,
            'fecha_fin': solicitud.fecha_fin,
            'dias_pendientes': solicitud.periodo.dias_pendientes
        })

    @action(detail=False, methods=['get'], url_path='pendientes-aprobacion')
    def pendientes_aprobacion(self, request):
        """Listar solicitudes pendientes de aprobación"""
        queryset = self.get_queryset().filter(estado='solicitada')
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


# =============================================================================
# DOTACIÓN - Art. 230 CST
# =============================================================================

class ConfiguracionDotacionViewSet(viewsets.ModelViewSet):
    """
    ViewSet para configuración de dotación.

    Catálogo de configuración según Art. 230 CST.
    """
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return ConfiguracionDotacion.objects.filter(
            is_active=True
        )

    def get_serializer_class(self):
        return ConfiguracionDotacionSerializer

    def perform_create(self, serializer):
        serializer.save(
            empresa=get_tenant_empresa(),
            created_by=self.request.user
        )

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)


class EntregaDotacionViewSet(viewsets.ModelViewSet):
    """
    ViewSet para entregas de dotación.

    Gestión de entregas individuales según Art. 230 CST.
    """
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = EntregaDotacion.objects.filter(
            is_active=True
        ).select_related('colaborador').order_by('-anio', '-fecha_entrega')

        # Filtros
        colaborador_id = self.request.query_params.get('colaborador')
        if colaborador_id:
            queryset = queryset.filter(colaborador_id=colaborador_id)

        periodo = self.request.query_params.get('periodo')
        if periodo:
            queryset = queryset.filter(periodo=periodo)

        anio = self.request.query_params.get('anio')
        if anio:
            queryset = queryset.filter(anio=anio)

        return queryset

    def get_serializer_class(self):
        if self.action == 'list':
            return EntregaDotacionListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return EntregaDotacionCreateSerializer
        return EntregaDotacionDetailSerializer

    def perform_create(self, serializer):
        serializer.save(
            empresa=get_tenant_empresa(),
            created_by=self.request.user
        )

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)
