"""
Views para Gestión de Calidad
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.pagination import PageNumberPagination
from django.utils import timezone
from django.db.models import Q, Count, Avg
from datetime import timedelta


class StandardResultsSetPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100

from .models import (
    NoConformidad,
    AccionCorrectiva,
    SalidaNoConforme,
    SolicitudCambio,
    ControlCambio
)
from .serializers import (
    NoConformidadListSerializer,
    NoConformidadDetailSerializer,
    AccionCorrectivaListSerializer,
    AccionCorrectivaDetailSerializer,
    SalidaNoConformeListSerializer,
    SalidaNoConformeDetailSerializer,
    SolicitudCambioListSerializer,
    SolicitudCambioDetailSerializer,
    ControlCambioListSerializer,
    ControlCambioDetailSerializer,
)


# ============================================================================
# NO CONFORMIDADES
# ============================================================================

class NoConformidadViewSet(viewsets.ModelViewSet):
    """ViewSet para No Conformidades"""
    permission_classes = [IsAuthenticated]
    pagination_class = StandardResultsSetPagination
    filterset_fields = ['estado', 'tipo', 'origen', 'severidad']
    search_fields = ['codigo', 'titulo', 'descripcion', 'ubicacion']
    ordering_fields = ['fecha_deteccion', 'created_at', 'codigo']
    ordering = ['-fecha_deteccion']

    def get_queryset(self):
        empresa_id = self.request.user.empresa_id
        queryset = NoConformidad.objects.filter(empresa_id=empresa_id)

        estado = self.request.query_params.get('estado', None)
        if estado:
            queryset = queryset.filter(estado=estado)

        responsable = self.request.query_params.get('responsable', None)
        if responsable:
            queryset = queryset.filter(
                Q(responsable_analisis_id=responsable) |
                Q(responsable_cierre_id=responsable)
            )

        if self.request.query_params.get('vencidas', None) == 'true':
            queryset = queryset.filter(
                estado__in=['ABIERTA', 'EN_ANALISIS', 'EN_TRATAMIENTO'],
                fecha_deteccion__lt=timezone.now().date() - timedelta(days=30)
            )

        return queryset.select_related(
            'detectado_por', 'responsable_analisis', 'responsable_cierre'
        ).prefetch_related('acciones_correctivas')

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return NoConformidadDetailSerializer
        return NoConformidadListSerializer

    def perform_create(self, serializer):
        empresa_id = self.request.user.empresa_id
        year = timezone.now().year

        last_nc = NoConformidad.objects.filter(
            empresa_id=empresa_id, codigo__startswith=f'NC-{year}-'
        ).order_by('-codigo').first()

        new_num = int(last_nc.codigo.split('-')[-1]) + 1 if last_nc else 1
        codigo = f'NC-{year}-{new_num:04d}'

        serializer.save(empresa_id=empresa_id, created_by=self.request.user, codigo=codigo)

    @action(detail=True, methods=['post'], url_path='asignar-responsable')
    def asignar_responsable(self, request, pk=None):
        """Asignar responsable de análisis o cierre"""
        nc = self.get_object()
        tipo = request.data.get('tipo')
        responsable_id = request.data.get('responsable_id')

        if not tipo or not responsable_id:
            return Response(
                {'error': 'Tipo y responsable_id son requeridos'},
                status=status.HTTP_400_BAD_REQUEST
            )

        from django.contrib.auth import get_user_model
        User = get_user_model()

        try:
            responsable = User.objects.get(id=responsable_id, empresa_id=request.user.empresa_id)
        except User.DoesNotExist:
            return Response({'error': 'Usuario no encontrado'}, status=status.HTTP_404_NOT_FOUND)

        if tipo == 'analisis':
            nc.responsable_analisis = responsable
            if nc.estado == 'ABIERTA':
                nc.estado = 'EN_ANALISIS'
        elif tipo == 'cierre':
            nc.responsable_cierre = responsable
        else:
            return Response(
                {'error': 'Tipo debe ser "analisis" o "cierre"'},
                status=status.HTTP_400_BAD_REQUEST
            )

        nc.save()
        return Response(self.get_serializer(nc).data)

    @action(detail=True, methods=['post'])
    def cerrar(self, request, pk=None):
        """Cerrar una No Conformidad"""
        nc = self.get_object()

        if not nc.puede_cerrar():
            return Response(
                {'error': 'No se puede cerrar. Debe estar en verificación y tener al menos una acción eficaz'},
                status=status.HTTP_400_BAD_REQUEST
            )

        nc.estado = 'CERRADA'
        nc.fecha_cierre = timezone.now().date()
        nc.verificacion_eficaz = request.data.get('verificacion_eficaz', True)
        nc.comentarios_verificacion = request.data.get('comentarios_verificacion', '')

        if request.FILES.get('evidencia_cierre'):
            nc.evidencia_cierre = request.FILES['evidencia_cierre']

        nc.save()
        return Response(self.get_serializer(nc).data)

    @action(detail=True, methods=['post'], url_path='verificar-eficacia')
    def verificar_eficacia(self, request, pk=None):
        """Verificar eficacia de acciones"""
        nc = self.get_object()

        if nc.estado not in ['EN_TRATAMIENTO', 'VERIFICACION']:
            return Response(
                {'error': 'La NC debe estar en tratamiento o verificación'},
                status=status.HTTP_400_BAD_REQUEST
            )

        nc.estado = 'VERIFICACION'
        nc.fecha_verificacion = timezone.now().date()
        nc.verificacion_eficaz = request.data.get('eficaz', None)
        nc.comentarios_verificacion = request.data.get('comentarios', '')

        if request.FILES.get('evidencia_verificacion'):
            nc.evidencia_cierre = request.FILES['evidencia_verificacion']

        nc.save()
        return Response(self.get_serializer(nc).data)

    @action(detail=False, methods=['get'])
    def estadisticas(self, request):
        """Estadísticas de No Conformidades"""
        empresa_id = request.user.empresa_id

        por_estado = NoConformidad.objects.filter(empresa_id=empresa_id).values('estado').annotate(total=Count('id'))
        por_origen = NoConformidad.objects.filter(empresa_id=empresa_id).values('origen').annotate(total=Count('id'))
        por_severidad = NoConformidad.objects.filter(empresa_id=empresa_id).values('severidad').annotate(total=Count('id'))

        vencidas = NoConformidad.objects.filter(
            empresa_id=empresa_id,
            estado__in=['ABIERTA', 'EN_ANALISIS', 'EN_TRATAMIENTO'],
            fecha_deteccion__lt=timezone.now().date() - timedelta(days=30)
        ).count()

        cerradas = NoConformidad.objects.filter(
            empresa_id=empresa_id, estado='CERRADA', fecha_cierre__isnull=False
        )

        dias_promedio = 0
        if cerradas.exists():
            total_dias = sum([(nc.fecha_cierre - nc.fecha_deteccion).days for nc in cerradas])
            dias_promedio = total_dias / cerradas.count()

        return Response({
            'por_estado': list(por_estado),
            'por_origen': list(por_origen),
            'por_severidad': list(por_severidad),
            'vencidas': vencidas,
            'dias_promedio_cierre': round(dias_promedio, 1),
            'total': NoConformidad.objects.filter(empresa_id=empresa_id).count()
        })


# ============================================================================
# ACCIONES CORRECTIVAS
# ============================================================================

class AccionCorrectivaViewSet(viewsets.ModelViewSet):
    """ViewSet para Acciones Correctivas"""
    permission_classes = [IsAuthenticated]
    pagination_class = StandardResultsSetPagination
    filterset_fields = ['estado', 'tipo', 'responsable']
    search_fields = ['codigo', 'descripcion']
    ordering_fields = ['fecha_planificada', 'fecha_limite', 'created_at']
    ordering = ['-fecha_planificada']

    def get_queryset(self):
        empresa_id = self.request.user.empresa_id
        queryset = AccionCorrectiva.objects.filter(empresa_id=empresa_id)

        nc_id = self.request.query_params.get('no_conformidad', None)
        if nc_id:
            queryset = queryset.filter(no_conformidad_id=nc_id)

        if self.request.query_params.get('vencidas', None) == 'true':
            queryset = queryset.filter(
                estado__in=['PLANIFICADA', 'EN_EJECUCION'],
                fecha_limite__lt=timezone.now().date()
            )

        return queryset.select_related('no_conformidad', 'responsable', 'verificador')

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return AccionCorrectivaDetailSerializer
        return AccionCorrectivaListSerializer

    def perform_create(self, serializer):
        empresa_id = self.request.user.empresa_id
        year = timezone.now().year
        tipo = serializer.validated_data.get('tipo')
        prefix = 'AC' if tipo == 'CORRECTIVA' else 'AP' if tipo == 'PREVENTIVA' else 'AM'

        last_accion = AccionCorrectiva.objects.filter(
            empresa_id=empresa_id, codigo__startswith=f'{prefix}-{year}-'
        ).order_by('-codigo').first()

        new_num = int(last_accion.codigo.split('-')[-1]) + 1 if last_accion else 1
        codigo = f'{prefix}-{year}-{new_num:04d}'

        serializer.save(empresa_id=empresa_id, created_by=self.request.user, codigo=codigo)

    @action(detail=True, methods=['post'])
    def ejecutar(self, request, pk=None):
        """Marcar acción como ejecutada"""
        accion = self.get_object()

        if accion.estado not in ['PLANIFICADA', 'EN_EJECUCION']:
            return Response(
                {'error': 'La acción debe estar planificada o en ejecución'},
                status=status.HTTP_400_BAD_REQUEST
            )

        accion.estado = 'EJECUTADA'
        accion.fecha_ejecucion = timezone.now().date()
        accion.comentarios_ejecucion = request.data.get('comentarios', '')

        if request.FILES.get('evidencia'):
            accion.evidencia_ejecucion = request.FILES['evidencia']

        accion.save()
        return Response(self.get_serializer(accion).data)

    @action(detail=True, methods=['post'], url_path='verificar-eficacia')
    def verificar_eficacia(self, request, pk=None):
        """Verificar eficacia de la acción"""
        accion = self.get_object()

        if accion.estado != 'EJECUTADA':
            return Response(
                {'error': 'La acción debe estar ejecutada para verificar'},
                status=status.HTTP_400_BAD_REQUEST
            )

        accion.estado = 'VERIFICADA'
        accion.fecha_verificacion = timezone.now().date()
        accion.eficaz = request.data.get('eficaz', None)
        accion.metodo_verificacion = request.data.get('metodo_verificacion', '')
        accion.resultados_verificacion = request.data.get('resultados', '')

        if request.FILES.get('evidencia'):
            accion.evidencia_verificacion = request.FILES['evidencia']

        accion.save()

        if accion.eficaz and accion.no_conformidad.estado == 'EN_TRATAMIENTO':
            nc = accion.no_conformidad
            nc.estado = 'VERIFICACION'
            nc.save()

        return Response(self.get_serializer(accion).data)


# ============================================================================
# SALIDAS NO CONFORMES
# ============================================================================

class SalidaNoConformeViewSet(viewsets.ModelViewSet):
    """ViewSet para Salidas No Conformes"""
    permission_classes = [IsAuthenticated]
    pagination_class = StandardResultsSetPagination
    filterset_fields = ['estado', 'tipo', 'bloqueada', 'disposicion']
    search_fields = ['codigo', 'descripcion_producto', 'lote_numero']
    ordering_fields = ['fecha_deteccion', 'created_at']
    ordering = ['-fecha_deteccion']

    def get_queryset(self):
        empresa_id = self.request.user.empresa_id
        return SalidaNoConforme.objects.filter(empresa_id=empresa_id).select_related(
            'detectado_por', 'responsable_evaluacion', 'responsable_disposicion', 'no_conformidad'
        )

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return SalidaNoConformeDetailSerializer
        return SalidaNoConformeListSerializer

    def perform_create(self, serializer):
        empresa_id = self.request.user.empresa_id
        year = timezone.now().year

        last_snc = SalidaNoConforme.objects.filter(
            empresa_id=empresa_id, codigo__startswith=f'SNC-{year}-'
        ).order_by('-codigo').first()

        new_num = int(last_snc.codigo.split('-')[-1]) + 1 if last_snc else 1
        codigo = f'SNC-{year}-{new_num:04d}'

        serializer.save(empresa_id=empresa_id, created_by=self.request.user, codigo=codigo)

    @action(detail=True, methods=['post'], url_path='definir-disposicion')
    def definir_disposicion(self, request, pk=None):
        """Definir disposición de salida no conforme"""
        snc = self.get_object()

        if snc.estado not in ['DETECTADA', 'EN_EVALUACION']:
            return Response(
                {'error': 'La salida NC debe estar en evaluación'},
                status=status.HTTP_400_BAD_REQUEST
            )

        disposicion = request.data.get('disposicion')
        if not disposicion:
            return Response({'error': 'Disposición es requerida'}, status=status.HTTP_400_BAD_REQUEST)

        snc.disposicion = disposicion
        snc.justificacion_disposicion = request.data.get('justificacion', '')
        snc.fecha_disposicion = timezone.now().date()
        snc.estado = 'DISPOSICION_DEFINIDA'
        snc.save()

        return Response(self.get_serializer(snc).data)

    @action(detail=True, methods=['post'])
    def liberar(self, request, pk=None):
        """Liberar producto de bloqueo"""
        snc = self.get_object()

        if not snc.puede_liberar():
            return Response(
                {'error': 'No se puede liberar. Debe estar resuelta y bloqueada'},
                status=status.HTTP_400_BAD_REQUEST
            )

        snc.bloqueada = False
        snc.save()

        return Response(self.get_serializer(snc).data)


# ============================================================================
# SOLICITUDES DE CAMBIO
# ============================================================================

class SolicitudCambioViewSet(viewsets.ModelViewSet):
    """ViewSet para Solicitudes de Cambio"""
    permission_classes = [IsAuthenticated]
    pagination_class = StandardResultsSetPagination
    filterset_fields = ['estado', 'tipo', 'prioridad']
    search_fields = ['codigo', 'titulo', 'descripcion_cambio']
    ordering_fields = ['fecha_solicitud', 'prioridad', 'created_at']
    ordering = ['-fecha_solicitud']

    def get_queryset(self):
        empresa_id = self.request.user.empresa_id
        return SolicitudCambio.objects.filter(empresa_id=empresa_id).select_related(
            'solicitante', 'revisado_por', 'aprobado_por', 'responsable_implementacion'
        )

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return SolicitudCambioDetailSerializer
        return SolicitudCambioListSerializer

    def perform_create(self, serializer):
        empresa_id = self.request.user.empresa_id
        year = timezone.now().year

        last_sc = SolicitudCambio.objects.filter(
            empresa_id=empresa_id, codigo__startswith=f'SC-{year}-'
        ).order_by('-codigo').first()

        new_num = int(last_sc.codigo.split('-')[-1]) + 1 if last_sc else 1
        codigo = f'SC-{year}-{new_num:04d}'

        serializer.save(
            empresa_id=empresa_id,
            created_by=self.request.user,
            solicitante=self.request.user,
            codigo=codigo
        )

    @action(detail=True, methods=['post'])
    def aprobar(self, request, pk=None):
        """Aprobar solicitud de cambio"""
        solicitud = self.get_object()

        if solicitud.estado != 'EN_REVISION':
            return Response(
                {'error': 'La solicitud debe estar en revisión'},
                status=status.HTTP_400_BAD_REQUEST
            )

        solicitud.estado = 'APROBADA'
        solicitud.aprobado_por = request.user
        solicitud.fecha_aprobacion = timezone.now().date()
        solicitud.comentarios_aprobacion = request.data.get('comentarios', '')
        solicitud.save()

        return Response(self.get_serializer(solicitud).data)

    @action(detail=True, methods=['post'])
    def rechazar(self, request, pk=None):
        """Rechazar solicitud de cambio"""
        solicitud = self.get_object()

        if solicitud.estado not in ['SOLICITADA', 'EN_REVISION']:
            return Response(
                {'error': 'La solicitud debe estar solicitada o en revisión'},
                status=status.HTTP_400_BAD_REQUEST
            )

        solicitud.estado = 'RECHAZADA'
        solicitud.revisado_por = request.user
        solicitud.fecha_revision = timezone.now().date()
        solicitud.comentarios_revision = request.data.get('comentarios', '')
        solicitud.save()

        return Response(self.get_serializer(solicitud).data)


# ============================================================================
# CONTROL DE CAMBIOS
# ============================================================================

class ControlCambioViewSet(viewsets.ModelViewSet):
    """ViewSet para Control de Cambios"""
    permission_classes = [IsAuthenticated]
    pagination_class = StandardResultsSetPagination
    filterset_fields = ['verificacion_realizada', 'eficaz']
    search_fields = ['solicitud_cambio__codigo', 'solicitud_cambio__titulo']
    ordering_fields = ['fecha_fin_implementacion', 'created_at']
    ordering = ['-fecha_fin_implementacion']

    def get_queryset(self):
        empresa_id = self.request.user.empresa_id
        return ControlCambio.objects.filter(empresa_id=empresa_id).select_related('solicitud_cambio')

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return ControlCambioDetailSerializer
        return ControlCambioListSerializer

    def perform_create(self, serializer):
        empresa_id = self.request.user.empresa_id
        serializer.save(empresa_id=empresa_id, created_by=self.request.user)
