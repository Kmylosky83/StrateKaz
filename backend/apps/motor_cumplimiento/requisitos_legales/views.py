from datetime import date, timedelta

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter
from django.utils import timezone
from django.db.models import Count, Q

from apps.core.mixins import StandardViewSetMixin
from apps.core.base_models.mixins import get_tenant_empresa
from apps.gestion_estrategica.revision_direccion.services.resumen_mixin import ResumenRevisionMixin
from .models import TipoRequisito, RequisitoLegal, EmpresaRequisito, AlertaVencimiento
from .serializers import TipoRequisitoSerializer, RequisitoLegalSerializer, EmpresaRequisitoSerializer, AlertaVencimientoSerializer


class TipoRequisitoViewSet(StandardViewSetMixin, viewsets.ModelViewSet):
    """
    ViewSet para gestionar Tipos de Requisito.

    Incluye funcionalidad del StandardViewSetMixin:
    - toggle_active, bulk_activate, bulk_deactivate
    - Filtrado automático de inactivos (use ?include_inactive=true para incluir todos)
    - Auditoría automática (created_by, updated_by)
    """
    queryset = TipoRequisito.objects.all()
    serializer_class = TipoRequisitoSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ['is_active']
    search_fields = ["codigo", "nombre"]


class RequisitoLegalViewSet(StandardViewSetMixin, viewsets.ModelViewSet):
    """
    ViewSet para gestionar Requisitos Legales.

    Incluye funcionalidad del StandardViewSetMixin:
    - toggle_active, bulk_activate, bulk_deactivate
    - Filtrado automático de inactivos (use ?include_inactive=true para incluir todos)
    - Auditoría automática (created_by, updated_by)
    """
    queryset = RequisitoLegal.objects.select_related("tipo").all()
    serializer_class = RequisitoLegalSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ["tipo", "aplica_sst", "aplica_ambiental", "aplica_calidad", "aplica_pesv", "is_active"]
    search_fields = ["codigo", "nombre", "entidad_emisora"]


class EmpresaRequisitoViewSet(ResumenRevisionMixin, StandardViewSetMixin, viewsets.ModelViewSet):
    """
    ViewSet para gestionar Requisitos de Empresa.

    Incluye funcionalidad del StandardViewSetMixin:
    - toggle_active, bulk_activate, bulk_deactivate
    - Filtrado automático de inactivos (use ?include_inactive=true para incluir todos)
    - Auditoría automática (created_by, updated_by)
    """
    queryset = EmpresaRequisito.objects.select_related("requisito", "responsable").all()
    serializer_class = EmpresaRequisitoSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ["empresa_id", "requisito", "estado", "is_active"]
    search_fields = ["numero_documento", "requisito__nombre"]

    # ResumenRevisionMixin config
    resumen_date_field = 'created_at'
    resumen_modulo_nombre = 'cumplimiento_legal'

    def get_resumen_data(self, queryset, fecha_desde, fecha_hasta):
        """Resumen de cumplimiento legal para Revisión por la Dirección."""
        # Todos los requisitos activos (sin filtro de fecha para totales generales)
        todos = EmpresaRequisito.objects.filter(is_active=True)
        total = todos.count()

        # Por estado
        por_estado = list(
            todos.values('estado').annotate(cantidad=Count('id')).order_by('estado')
        )

        # Calcular porcentaje de cumplimiento
        vigentes = todos.filter(estado='vigente').count()
        pct_cumplimiento = round((vigentes / total * 100), 1) if total > 0 else 0

        # Vencidos
        hoy = timezone.now().date()
        vencidos = todos.filter(
            fecha_vencimiento__lt=hoy,
            estado__in=['vigente', 'proximo_vencer', 'en_tramite']
        ).count()

        # Próximos a vencer (30 días)
        proximos_vencer = todos.filter(
            fecha_vencimiento__range=[hoy, hoy + timedelta(days=30)],
        ).count()

        # Nuevos en el período
        nuevos_periodo = queryset.count()

        return {
            'total_requisitos': total,
            'por_estado': por_estado,
            'porcentaje_cumplimiento': pct_cumplimiento,
            'vigentes': vigentes,
            'vencidos': vencidos,
            'proximos_vencer_30d': proximos_vencer,
            'nuevos_en_periodo': nuevos_periodo,
        }

    @action(detail=False, methods=["get"], url_path='por-vencer')
    def por_vencer(self, request):
        empresa = get_tenant_empresa(auto_create=False)
        empresa_id = empresa.id if empresa else None
        dias = int(request.query_params.get("dias", 30))
        fecha_limite = timezone.now().date() + timezone.timedelta(days=dias)
        queryset = self.get_queryset().filter(
            fecha_vencimiento__lte=fecha_limite,
            fecha_vencimiento__gte=timezone.now().date(),
            is_active=True
        )
        if empresa_id:
            queryset = queryset.filter(empresa_id=empresa_id)
        queryset = queryset.order_by("fecha_vencimiento")
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def vencidos(self, request):
        empresa = get_tenant_empresa(auto_create=False)
        empresa_id = empresa.id if empresa else None
        queryset = self.get_queryset().filter(
            fecha_vencimiento__lt=timezone.now().date(),
            is_active=True
        )
        if empresa_id:
            queryset = queryset.filter(empresa_id=empresa_id)
        queryset = queryset.order_by("fecha_vencimiento")
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def estadisticas(self, request):
        empresa = get_tenant_empresa(auto_create=False)
        empresa_id = empresa.id if empresa else None
        queryset = self.get_queryset().filter(is_active=True)
        if empresa_id:
            queryset = queryset.filter(empresa_id=empresa_id)
        stats = queryset.values("estado").annotate(total=Count("id"))
        return Response({"estadisticas_por_estado": list(stats), "total": queryset.count()})


class AlertaVencimientoViewSet(StandardViewSetMixin, viewsets.ModelViewSet):
    """
    ViewSet para gestionar Alertas de Vencimiento.

    Incluye funcionalidad del StandardViewSetMixin:
    - toggle_active, bulk_activate, bulk_deactivate
    - Filtrado automático de inactivos (use ?include_inactive=true para incluir todos)
    - Auditoría automática (created_by, updated_by)
    """
    queryset = AlertaVencimiento.objects.select_related("empresa_requisito").all()
    serializer_class = AlertaVencimientoSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["empresa_requisito", "enviada"]

    @action(detail=False, methods=["get"])
    def pendientes(self, request):
        queryset = self.get_queryset().filter(enviada=False, fecha_programada__lte=timezone.now().date())
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
