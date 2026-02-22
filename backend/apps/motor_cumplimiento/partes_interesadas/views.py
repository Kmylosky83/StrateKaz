from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter

from apps.core.mixins import StandardViewSetMixin
from apps.core.base_models.mixins import get_tenant_empresa
from .models import TipoParteInteresada, ParteInteresada, RequisitoParteInteresada, MatrizComunicacion
from .serializers import TipoParteInteresadaSerializer, ParteInteresadaSerializer, RequisitoParteInteresadaSerializer, MatrizComunicacionSerializer


class TipoParteInteresadaViewSet(StandardViewSetMixin, viewsets.ModelViewSet):
    """
    ViewSet para gestionar Tipos de Parte Interesada.

    Incluye funcionalidad del StandardViewSetMixin:
    - toggle_active, bulk_activate, bulk_deactivate
    - Filtrado automático de inactivos (use ?include_inactive=true para incluir todos)
    - Auditoría automática (created_by, updated_by)
    """
    queryset = TipoParteInteresada.objects.all()
    serializer_class = TipoParteInteresadaSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ["categoria", "is_active"]
    search_fields = ["codigo", "nombre"]


class ParteInteresadaViewSet(StandardViewSetMixin, viewsets.ModelViewSet):
    """
    ViewSet para gestionar Partes Interesadas.

    Incluye funcionalidad del StandardViewSetMixin:
    - toggle_active, bulk_activate, bulk_deactivate
    - Filtrado automático de inactivos (use ?include_inactive=true para incluir todos)
    - Auditoría automática (created_by, updated_by)
    """
    queryset = ParteInteresada.objects.select_related("tipo").all()
    serializer_class = ParteInteresadaSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ["empresa_id", "tipo", "nivel_influencia", "nivel_interes", "is_active"]
    search_fields = ["nombre", "representante"]

    @action(detail=False, methods=["get"])
    def matriz_poder_interes(self, request):
        empresa = get_tenant_empresa(auto_create=False)
        queryset = self.get_queryset().filter(is_active=True)
        if empresa:
            queryset = queryset.filter(empresa_id=empresa.id)
        partes = queryset
        cuadrantes = {
            "gestionar_cerca": [],
            "mantener_satisfecho": [],
            "mantener_informado": [],
            "monitorear": []
        }
        for p in partes:
            data = ParteInteresadaSerializer(p).data
            if p.nivel_influencia == "alta" and p.nivel_interes == "alto":
                cuadrantes["gestionar_cerca"].append(data)
            elif p.nivel_influencia == "alta":
                cuadrantes["mantener_satisfecho"].append(data)
            elif p.nivel_interes == "alto":
                cuadrantes["mantener_informado"].append(data)
            else:
                cuadrantes["monitorear"].append(data)
        return Response(cuadrantes)


class RequisitoParteInteresadaViewSet(StandardViewSetMixin, viewsets.ModelViewSet):
    """
    ViewSet para gestionar Requisitos de Parte Interesada.

    Incluye funcionalidad del StandardViewSetMixin:
    - toggle_active, bulk_activate, bulk_deactivate
    - Filtrado automático de inactivos (use ?include_inactive=true para incluir todos)
    - Auditoría automática (created_by, updated_by)
    """
    queryset = RequisitoParteInteresada.objects.select_related("parte_interesada").all()
    serializer_class = RequisitoParteInteresadaSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ["parte_interesada", "tipo", "prioridad", "cumple", "is_active"]
    search_fields = ["descripcion"]


class MatrizComunicacionViewSet(StandardViewSetMixin, viewsets.ModelViewSet):
    """
    ViewSet para gestionar Matriz de Comunicación.

    Incluye funcionalidad del StandardViewSetMixin:
    - toggle_active, bulk_activate, bulk_deactivate
    - Filtrado automático de inactivos (use ?include_inactive=true para incluir todos)
    - Auditoría automática (created_by, updated_by)
    """
    queryset = MatrizComunicacion.objects.select_related("parte_interesada", "responsable").all()
    serializer_class = MatrizComunicacionSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["empresa_id", "parte_interesada", "cuando_comunicar", "is_active"]
