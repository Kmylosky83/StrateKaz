from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter
from django.db.models import Count

from apps.core.mixins import StandardViewSetMixin
from .models import TipoReglamento, Reglamento, VersionReglamento, PublicacionReglamento, SocializacionReglamento
from .serializers import TipoReglamentoSerializer, ReglamentoSerializer, VersionReglamentoSerializer, PublicacionReglamentoSerializer, SocializacionReglamentoSerializer


class TipoReglamentoViewSet(StandardViewSetMixin, viewsets.ModelViewSet):
    """
    ViewSet para gestionar Tipos de Reglamento.

    Incluye funcionalidad del StandardViewSetMixin:
    - toggle_active, bulk_activate, bulk_deactivate
    - Filtrado automático de inactivos (use ?include_inactive=true para incluir todos)
    - Auditoría automática (created_by, updated_by)
    """
    queryset = TipoReglamento.objects.all()
    serializer_class = TipoReglamentoSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ['is_active']
    search_fields = ["codigo", "nombre"]


class ReglamentoViewSet(StandardViewSetMixin, viewsets.ModelViewSet):
    """
    ViewSet para gestionar Reglamentos Internos.

    Incluye funcionalidad del StandardViewSetMixin:
    - toggle_active, bulk_activate, bulk_deactivate
    - Filtrado automático de inactivos (use ?include_inactive=true para incluir todos)
    - Auditoría automática (created_by, updated_by)
    """
    queryset = Reglamento.objects.select_related("tipo", "aprobado_por").all()
    serializer_class = ReglamentoSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ["empresa_id", "tipo", "estado", "aplica_sst", "aplica_ambiental", "aplica_calidad", "aplica_pesv", "is_active"]
    search_fields = ["codigo", "nombre"]

    @action(detail=False, methods=["get"])
    def vigentes(self, request):
        empresa_id = request.query_params.get("empresa", 1)
        queryset = self.get_queryset().filter(empresa_id=empresa_id, estado="vigente", is_active=True)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def estadisticas(self, request):
        empresa_id = request.query_params.get("empresa", 1)
        queryset = self.get_queryset().filter(empresa_id=empresa_id, is_active=True)
        stats = queryset.values("estado").annotate(total=Count("id"))
        return Response({"por_estado": list(stats), "total": queryset.count()})


class VersionReglamentoViewSet(StandardViewSetMixin, viewsets.ModelViewSet):
    """
    ViewSet para gestionar Versiones de Reglamento.

    Incluye funcionalidad del StandardViewSetMixin:
    - toggle_active, bulk_activate, bulk_deactivate
    - Filtrado automático de inactivos (use ?include_inactive=true para incluir todos)
    - Auditoría automática (created_by, updated_by)
    """
    queryset = VersionReglamento.objects.select_related("reglamento", "elaborado_por").all()
    serializer_class = VersionReglamentoSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["reglamento", "is_active"]


class PublicacionReglamentoViewSet(StandardViewSetMixin, viewsets.ModelViewSet):
    """
    ViewSet para gestionar Publicaciones de Reglamento.

    Incluye funcionalidad del StandardViewSetMixin:
    - toggle_active, bulk_activate, bulk_deactivate
    - Filtrado automático de inactivos (use ?include_inactive=true para incluir todos)
    - Auditoría automática (created_by, updated_by)
    """
    queryset = PublicacionReglamento.objects.select_related("reglamento", "publicado_por").all()
    serializer_class = PublicacionReglamentoSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["reglamento", "medio", "is_active"]


class SocializacionReglamentoViewSet(StandardViewSetMixin, viewsets.ModelViewSet):
    """
    ViewSet para gestionar Socializaciones de Reglamento.

    Incluye funcionalidad del StandardViewSetMixin:
    - toggle_active, bulk_activate, bulk_deactivate
    - Filtrado automático de inactivos (use ?include_inactive=true para incluir todos)
    - Auditoría automática (created_by, updated_by)
    """
    queryset = SocializacionReglamento.objects.select_related("reglamento", "facilitador").all()
    serializer_class = SocializacionReglamentoSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["reglamento", "tipo", "is_active"]
