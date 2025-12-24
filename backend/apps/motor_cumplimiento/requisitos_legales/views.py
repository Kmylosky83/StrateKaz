from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter
from django.utils import timezone
from django.db.models import Count
from .models import TipoRequisito, RequisitoLegal, EmpresaRequisito, AlertaVencimiento
from .serializers import TipoRequisitoSerializer, RequisitoLegalSerializer, EmpresaRequisitoSerializer, AlertaVencimientoSerializer


class TipoRequisitoViewSet(viewsets.ModelViewSet):
    queryset = TipoRequisito.objects.all()
    serializer_class = TipoRequisitoSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [SearchFilter]
    search_fields = ["codigo", "nombre"]


class RequisitoLegalViewSet(viewsets.ModelViewSet):
    queryset = RequisitoLegal.objects.select_related("tipo").all()
    serializer_class = RequisitoLegalSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ["tipo", "aplica_sst", "aplica_ambiental", "aplica_calidad", "aplica_pesv", "is_active"]
    search_fields = ["codigo", "nombre", "entidad_emisora"]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class EmpresaRequisitoViewSet(viewsets.ModelViewSet):
    queryset = EmpresaRequisito.objects.select_related("requisito", "responsable").all()
    serializer_class = EmpresaRequisitoSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ["empresa_id", "requisito", "estado", "is_active"]
    search_fields = ["numero_documento", "requisito__nombre"]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=False, methods=["get"])
    def por_vencer(self, request):
        empresa_id = request.query_params.get("empresa", 1)
        dias = int(request.query_params.get("dias", 30))
        fecha_limite = timezone.now().date() + timezone.timedelta(days=dias)
        queryset = self.get_queryset().filter(
            empresa_id=empresa_id,
            fecha_vencimiento__lte=fecha_limite,
            fecha_vencimiento__gte=timezone.now().date(),
            is_active=True
        ).order_by("fecha_vencimiento")
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def vencidos(self, request):
        empresa_id = request.query_params.get("empresa", 1)
        queryset = self.get_queryset().filter(
            empresa_id=empresa_id,
            fecha_vencimiento__lt=timezone.now().date(),
            is_active=True
        ).order_by("fecha_vencimiento")
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def estadisticas(self, request):
        empresa_id = request.query_params.get("empresa", 1)
        queryset = self.get_queryset().filter(empresa_id=empresa_id, is_active=True)
        stats = queryset.values("estado").annotate(total=Count("id"))
        return Response({"estadisticas_por_estado": list(stats), "total": queryset.count()})


class AlertaVencimientoViewSet(viewsets.ModelViewSet):
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
