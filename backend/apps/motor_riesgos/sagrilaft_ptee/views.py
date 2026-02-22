"""
Views para SAGRILAFT/PTEE - Motor de Riesgos
Sistema de Administración del Riesgo de Lavado de Activos y Financiación del Terrorismo
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from .models import (
    FactorRiesgoLAFT,
    SegmentoCliente,
    MatrizRiesgoLAFT,
    SenalAlerta,
    ReporteOperacionSospechosa,
    DebidaDiligencia
)
from .serializers import (
    FactorRiesgoLAFTListSerializer,
    FactorRiesgoLAFTDetailSerializer,
    SegmentoClienteListSerializer,
    SegmentoClienteDetailSerializer,
    MatrizRiesgoLAFTListSerializer,
    MatrizRiesgoLAFTDetailSerializer,
    SenalAlertaListSerializer,
    SenalAlertaDetailSerializer,
    ReporteOperacionSospechosaListSerializer,
    ReporteOperacionSospechosaDetailSerializer,
    DebidaDiligenciaListSerializer,
    DebidaDiligenciaDetailSerializer
)
from apps.core.base_models.mixins import get_tenant_empresa


class FactorRiesgoLAFTViewSet(viewsets.ModelViewSet):
    """ViewSet para Factores de Riesgo LAFT (catálogo global)"""
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action == 'list':
            return FactorRiesgoLAFTListSerializer
        return FactorRiesgoLAFTDetailSerializer

    def get_queryset(self):
        queryset = FactorRiesgoLAFT.objects.all()

        tipo_factor = self.request.query_params.get('tipo_factor')
        if tipo_factor:
            queryset = queryset.filter(tipo_factor=tipo_factor)

        nivel = self.request.query_params.get('nivel')
        if nivel:
            queryset = queryset.filter(nivel_riesgo_inherente=nivel)

        activo = self.request.query_params.get('activo')
        if activo is not None:
            queryset = queryset.filter(is_active=activo.lower() == 'true')

        return queryset.order_by('tipo_factor', 'codigo')

    @action(detail=False, methods=['get'])
    def por_tipo(self, request):
        """Obtiene factores agrupados por tipo"""
        tipos = {}
        for tipo, tipo_display in FactorRiesgoLAFT.TIPO_FACTOR_CHOICES:
            factores = self.get_queryset().filter(tipo_factor=tipo, is_active=True)
            tipos[tipo] = FactorRiesgoLAFTListSerializer(factores, many=True).data
        return Response(tipos)


class SegmentoClienteViewSet(viewsets.ModelViewSet):
    """ViewSet para Segmentos de Cliente"""
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action == 'list':
            return SegmentoClienteListSerializer
        return SegmentoClienteDetailSerializer

    def get_queryset(self):
        empresa = get_tenant_empresa(auto_create=False)
        queryset = SegmentoCliente.objects.select_related('created_by')

        if empresa:
            queryset = queryset.filter(empresa_id=empresa.id)

        tipo = self.request.query_params.get('tipo_cliente')
        if tipo:
            queryset = queryset.filter(tipo_cliente=tipo)

        nivel = self.request.query_params.get('nivel_riesgo')
        if nivel:
            queryset = queryset.filter(nivel_riesgo=nivel)

        return queryset.order_by('tipo_cliente', 'nivel_riesgo', 'codigo')

    def perform_create(self, serializer):
        empresa = get_tenant_empresa(auto_create=False)
        serializer.save(empresa_id=empresa.id if empresa else None, created_by=self.request.user)


class MatrizRiesgoLAFTViewSet(viewsets.ModelViewSet):
    """ViewSet para Matrices de Riesgo LAFT"""
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action == 'list':
            return MatrizRiesgoLAFTListSerializer
        return MatrizRiesgoLAFTDetailSerializer

    def get_queryset(self):
        empresa = get_tenant_empresa(auto_create=False)
        queryset = MatrizRiesgoLAFT.objects.select_related(
            'segmento', 'created_by', 'aprobado_por'
        )

        if empresa:
            queryset = queryset.filter(empresa_id=empresa.id)

        tipo = self.request.query_params.get('tipo_evaluado')
        if tipo:
            queryset = queryset.filter(tipo_evaluado=tipo)

        nivel = self.request.query_params.get('nivel_residual')
        if nivel:
            queryset = queryset.filter(nivel_riesgo_residual=nivel)

        estado = self.request.query_params.get('estado')
        if estado:
            queryset = queryset.filter(estado=estado)

        return queryset.order_by('-fecha_evaluacion', 'codigo')

    def perform_create(self, serializer):
        empresa = get_tenant_empresa(auto_create=False)
        serializer.save(empresa_id=empresa.id if empresa else None, created_by=self.request.user)

    @action(detail=True, methods=['post'])
    def aprobar(self, request, pk=None):
        """Aprueba una matriz de riesgo"""
        matriz = self.get_object()
        if matriz.estado != 'BORRADOR':
            return Response(
                {'error': 'Solo se pueden aprobar matrices en estado BORRADOR'},
                status=status.HTTP_400_BAD_REQUEST
            )
        matriz.estado = 'APROBADO'
        matriz.aprobado_por = request.user
        matriz.fecha_aprobacion = timezone.now()
        matriz.save()
        return Response(MatrizRiesgoLAFTDetailSerializer(matriz).data)

    @action(detail=False, methods=['get'])
    def resumen(self, request):
        """Resumen de matrices por nivel de riesgo"""
        empresa = get_tenant_empresa(auto_create=False)
        queryset = MatrizRiesgoLAFT.objects.filter(estado='VIGENTE')
        if empresa:
            queryset = queryset.filter(empresa_id=empresa.id)

        resumen = {
            'total': queryset.count(),
            'por_nivel_residual': {},
            'por_tipo_evaluado': {}
        }

        for nivel, _ in MatrizRiesgoLAFT.NIVEL_RIESGO_CHOICES:
            resumen['por_nivel_residual'][nivel] = queryset.filter(nivel_riesgo_residual=nivel).count()

        for tipo, _ in MatrizRiesgoLAFT.TIPO_EVALUADO_CHOICES:
            resumen['por_tipo_evaluado'][tipo] = queryset.filter(tipo_evaluado=tipo).count()

        return Response(resumen)

    @action(detail=False, methods=['get'])
    def proximas_revisiones(self, request):
        """Matrices que requieren revision proximamente"""
        empresa = get_tenant_empresa(auto_create=False)
        hoy = timezone.now().date()
        en_30_dias = hoy + timezone.timedelta(days=30)

        queryset = MatrizRiesgoLAFT.objects.filter(
            estado='VIGENTE',
            proxima_revision__lte=en_30_dias
        )
        if empresa:
            queryset = queryset.filter(empresa_id=empresa.id)
        queryset = queryset.order_by('proxima_revision')

        return Response(MatrizRiesgoLAFTListSerializer(queryset, many=True).data)


class SenalAlertaViewSet(viewsets.ModelViewSet):
    """ViewSet para Senales de Alerta LAFT"""
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action == 'list':
            return SenalAlertaListSerializer
        return SenalAlertaDetailSerializer

    def get_queryset(self):
        empresa = get_tenant_empresa(auto_create=False)
        queryset = SenalAlerta.objects.select_related(
            'matriz_riesgo', 'analista_asignado', 'created_by'
        )

        # Filtrar por empresa (eventos) o catalogo global
        es_catalogo = self.request.query_params.get('catalogo')
        if es_catalogo == 'true':
            queryset = queryset.filter(es_catalogo=True)
        elif empresa:
            queryset = queryset.filter(empresa_id=empresa.id, es_catalogo=False)

        categoria = self.request.query_params.get('categoria')
        if categoria:
            queryset = queryset.filter(categoria=categoria)

        severidad = self.request.query_params.get('severidad')
        if severidad:
            queryset = queryset.filter(severidad=severidad)

        estado = self.request.query_params.get('estado')
        if estado:
            queryset = queryset.filter(estado=estado)

        return queryset.order_by('-fecha_deteccion', 'severidad')

    def perform_create(self, serializer):
        empresa = get_tenant_empresa(auto_create=False)
        serializer.save(empresa_id=empresa.id if empresa else None, created_by=self.request.user)

    @action(detail=True, methods=['post'])
    def asignar_analista(self, request, pk=None):
        """Asigna un analista a la señal"""
        senal = self.get_object()
        analista_id = request.data.get('analista_id')
        if not analista_id:
            return Response(
                {'error': 'Debe especificar analista_id'},
                status=status.HTTP_400_BAD_REQUEST
            )
        from django.contrib.auth import get_user_model
        User = get_user_model()
        try:
            analista = User.objects.get(pk=analista_id)
        except User.DoesNotExist:
            return Response(
                {'error': 'Analista no encontrado'},
                status=status.HTTP_404_NOT_FOUND
            )
        senal.analista_asignado = analista
        senal.estado = 'EN_ANALISIS'
        senal.save()
        return Response(SenalAlertaDetailSerializer(senal).data)

    @action(detail=False, methods=['get'])
    def pendientes(self, request):
        """Senales pendientes de análisis"""
        queryset = self.get_queryset().filter(
            estado__in=['DETECTADA', 'EN_ANALISIS'],
            es_catalogo=False
        )
        return Response(SenalAlertaListSerializer(queryset, many=True).data)

    @action(detail=False, methods=['get'])
    def requieren_ros(self, request):
        """Senales que requieren ROS"""
        queryset = self.get_queryset().filter(
            requiere_ros=True,
            estado='CONFIRMADA',
            es_catalogo=False
        )
        return Response(SenalAlertaListSerializer(queryset, many=True).data)


class ReporteOperacionSospechosaViewSet(viewsets.ModelViewSet):
    """ViewSet para Reportes de Operaciones Sospechosas (ROS)"""
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action == 'list':
            return ReporteOperacionSospechosaListSerializer
        return ReporteOperacionSospechosaDetailSerializer

    def get_queryset(self):
        empresa = get_tenant_empresa(auto_create=False)
        queryset = ReporteOperacionSospechosa.objects.select_related(
            'matriz_riesgo', 'elaborado_por', 'revisado_por', 'aprobado_por'
        ).prefetch_related('senales_alerta')

        if empresa:
            queryset = queryset.filter(empresa_id=empresa.id)

        estado = self.request.query_params.get('estado')
        if estado:
            queryset = queryset.filter(estado=estado)

        tipo = self.request.query_params.get('tipo_operacion')
        if tipo:
            queryset = queryset.filter(tipo_operacion=tipo)

        return queryset.order_by('-fecha_deteccion', 'numero_ros')

    def perform_create(self, serializer):
        empresa = get_tenant_empresa(auto_create=False)
        serializer.save(empresa_id=empresa.id if empresa else None, elaborado_por=self.request.user)

    @action(detail=True, methods=['post'])
    def enviar_uiaf(self, request, pk=None):
        """Marca el ROS como enviado a UIAF"""
        ros = self.get_object()
        if ros.estado != 'APROBADO':
            return Response(
                {'error': 'El ROS debe estar aprobado para enviarse a UIAF'},
                status=status.HTTP_400_BAD_REQUEST
            )
        ros.estado = 'ENVIADO'
        ros.fecha_envio_uiaf = timezone.now().date()
        ros.numero_radicado_uiaf = request.data.get('numero_radicado', '')
        ros.save()
        return Response(ReporteOperacionSospechosaDetailSerializer(ros).data)

    @action(detail=False, methods=['get'])
    def pendientes_envio(self, request):
        """ROS aprobados pendientes de envío"""
        queryset = self.get_queryset().filter(estado='APROBADO')
        return Response(ReporteOperacionSospechosaListSerializer(queryset, many=True).data)


class DebidaDiligenciaViewSet(viewsets.ModelViewSet):
    """ViewSet para Debidas Diligencias"""
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action == 'list':
            return DebidaDiligenciaListSerializer
        return DebidaDiligenciaDetailSerializer

    def get_queryset(self):
        empresa = get_tenant_empresa(auto_create=False)
        queryset = DebidaDiligencia.objects.select_related(
            'matriz_riesgo', 'responsable', 'aprobado_por', 'created_by'
        )

        if empresa:
            queryset = queryset.filter(empresa_id=empresa.id)

        tipo = self.request.query_params.get('tipo_diligencia')
        if tipo:
            queryset = queryset.filter(tipo_diligencia=tipo)

        estado = self.request.query_params.get('estado')
        if estado:
            queryset = queryset.filter(estado=estado)

        return queryset.order_by('-fecha_inicio', 'codigo')

    def perform_create(self, serializer):
        empresa = get_tenant_empresa(auto_create=False)
        serializer.save(empresa_id=empresa.id if empresa else None, created_by=self.request.user)

    @action(detail=False, methods=['get'])
    def vencidas(self, request):
        """Diligencias vencidas"""
        hoy = timezone.now().date()
        queryset = self.get_queryset().filter(
            fecha_vencimiento__lt=hoy,
            estado__in=['INICIADA', 'EN_PROCESO', 'DOCUMENTOS_INCOMPLETOS']
        )
        return Response(DebidaDiligenciaListSerializer(queryset, many=True).data)

    @action(detail=False, methods=['get'])
    def proximas_actualizacion(self, request):
        """Diligencias que requieren actualización próximamente"""
        hoy = timezone.now().date()
        en_30_dias = hoy + timezone.timedelta(days=30)
        queryset = self.get_queryset().filter(
            proxima_actualizacion__lte=en_30_dias,
            estado='APROBADA'
        ).order_by('proxima_actualizacion')
        return Response(DebidaDiligenciaListSerializer(queryset, many=True).data)

    @action(detail=False, methods=['get'])
    def peps(self, request):
        """Diligencias de PEPs"""
        queryset = self.get_queryset().filter(es_pep=True)
        return Response(DebidaDiligenciaListSerializer(queryset, many=True).data)
