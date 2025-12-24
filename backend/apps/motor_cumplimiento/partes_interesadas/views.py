from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter
from .models import TipoParteInteresada, ParteInteresada, RequisitoParteInteresada, MatrizComunicacion
from .serializers import TipoParteInteresadaSerializer, ParteInteresadaSerializer, RequisitoParteInteresadaSerializer, MatrizComunicacionSerializer


class TipoParteInteresadaViewSet(viewsets.ModelViewSet):
    queryset = TipoParteInteresada.objects.all()
    serializer_class = TipoParteInteresadaSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ["categoria", "is_active"]
    search_fields = ["codigo", "nombre"]


class ParteInteresadaViewSet(viewsets.ModelViewSet):
    queryset = ParteInteresada.objects.select_related("tipo").all()
    serializer_class = ParteInteresadaSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ["empresa_id", "tipo", "nivel_influencia", "nivel_interes", "is_active"]
    search_fields = ["nombre", "representante"]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=False, methods=["get"])
    def matriz_poder_interes(self, request):
        empresa_id = request.query_params.get("empresa", 1)
        partes = self.get_queryset().filter(empresa_id=empresa_id, is_active=True)
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


class RequisitoParteInteresadaViewSet(viewsets.ModelViewSet):
    queryset = RequisitoParteInteresada.objects.select_related("parte_interesada").all()
    serializer_class = RequisitoParteInteresadaSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ["parte_interesada", "tipo", "prioridad", "cumple", "is_active"]
    search_fields = ["descripcion"]


class MatrizComunicacionViewSet(viewsets.ModelViewSet):
    queryset = MatrizComunicacion.objects.select_related("parte_interesada", "responsable").all()
    serializer_class = MatrizComunicacionSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["empresa_id", "parte_interesada", "cuando_comunicar", "is_active"]
