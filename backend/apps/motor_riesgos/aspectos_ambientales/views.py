"""
Views para Aspectos Ambientales - ISO 14001
Sistema de Gestión Ambiental
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Count, Q
from .models import (
    CategoriaAspecto,
    AspectoAmbiental,
    ImpactoAmbiental,
    ProgramaAmbiental,
    MonitoreoAmbiental
)
from .serializers import (
    CategoriaAspectoSerializer,
    AspectoAmbientalListSerializer,
    AspectoAmbientalDetailSerializer,
    ImpactoAmbientalSerializer,
    ProgramaAmbientalListSerializer,
    ProgramaAmbientalDetailSerializer,
    MonitoreoAmbientalSerializer
)
from apps.core.base_models.mixins import get_tenant_empresa


class CategoriaAspectoViewSet(viewsets.ModelViewSet):
    """ViewSet para gestión de categorías de aspectos ambientales"""
    serializer_class = CategoriaAspectoSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # CategoriaAspecto no tiene empresa_id (es catálogo global)
        queryset = CategoriaAspecto.objects.filter(is_active=True)
        return queryset.order_by('tipo', 'nombre')


class AspectoAmbientalViewSet(viewsets.ModelViewSet):
    """ViewSet para gestión de aspectos ambientales"""
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action == 'list':
            return AspectoAmbientalListSerializer
        return AspectoAmbientalDetailSerializer

    def get_queryset(self):
        empresa = get_tenant_empresa(auto_create=False)
        queryset = AspectoAmbiental.objects.select_related('categoria', 'created_by')
        if empresa:
            queryset = queryset.filter(empresa_id=empresa.id)
        return queryset.order_by('-valor_significancia', '-created_at')

    def perform_create(self, serializer):
        empresa = get_tenant_empresa(auto_create=False)
        serializer.save(
            created_by=self.request.user,
            empresa_id=empresa.id if empresa else None
        )

    @action(detail=False, methods=['get'])
    def resumen(self, request):
        """Resumen estadístico de aspectos ambientales"""
        empresa = get_tenant_empresa(auto_create=False)
        queryset = self.get_queryset()

        resumen = {
            'total': queryset.count(),
            'por_significancia': list(
                queryset.values('significancia')
                .annotate(cantidad=Count('id'))
                .order_by('significancia')
            ),
            'por_estado': list(
                queryset.values('estado')
                .annotate(cantidad=Count('id'))
                .order_by('estado')
            ),
            'por_categoria': list(
                queryset.values('categoria__nombre')
                .annotate(cantidad=Count('id'))
                .order_by('-cantidad')
            ),
            'por_condicion': list(
                queryset.values('condicion_operacion')
                .annotate(cantidad=Count('id'))
                .order_by('condicion_operacion')
            ),
        }
        return Response(resumen)

    @action(detail=False, methods=['get'])
    def significativos(self, request):
        """Aspectos ambientales significativos"""
        queryset = self.get_queryset().filter(significancia='SIGNIFICATIVO')
        serializer = AspectoAmbientalListSerializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def criticos(self, request):
        """Aspectos ambientales críticos"""
        queryset = self.get_queryset().filter(significancia='CRITICO')
        serializer = AspectoAmbientalListSerializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def incumplimiento_legal(self, request):
        """Aspectos que no cumplen normatividad legal"""
        queryset = self.get_queryset().filter(cumplimiento_legal=False)
        serializer = AspectoAmbientalListSerializer(queryset, many=True)
        return Response(serializer.data)


class ImpactoAmbientalViewSet(viewsets.ModelViewSet):
    """ViewSet para gestión de impactos ambientales"""
    serializer_class = ImpactoAmbientalSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        empresa = get_tenant_empresa(auto_create=False)
        queryset = ImpactoAmbiental.objects.select_related('aspecto', 'created_by')
        if empresa:
            queryset = queryset.filter(empresa_id=empresa.id)

        # Filtrar por aspecto específico
        aspecto_id = self.request.query_params.get('aspecto')
        if aspecto_id:
            queryset = queryset.filter(aspecto_id=aspecto_id)

        # Filtrar por componente ambiental
        componente = self.request.query_params.get('componente')
        if componente:
            queryset = queryset.filter(componente_ambiental=componente)

        return queryset.order_by('-created_at')

    def perform_create(self, serializer):
        empresa = get_tenant_empresa(auto_create=False)
        serializer.save(
            created_by=self.request.user,
            empresa_id=empresa.id if empresa else None
        )

    @action(detail=False, methods=['get'])
    def por_componente(self, request):
        """Impactos agrupados por componente ambiental"""
        empresa = get_tenant_empresa(auto_create=False)
        queryset = self.get_queryset()

        resumen = list(
            queryset.values('componente_ambiental')
            .annotate(cantidad=Count('id'))
            .order_by('-cantidad')
        )
        return Response(resumen)


class ProgramaAmbientalViewSet(viewsets.ModelViewSet):
    """ViewSet para gestión de programas ambientales"""
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action == 'list':
            return ProgramaAmbientalListSerializer
        return ProgramaAmbientalDetailSerializer

    def get_queryset(self):
        empresa = get_tenant_empresa(auto_create=False)
        queryset = ProgramaAmbiental.objects.select_related(
            'responsable', 'created_by'
        ).prefetch_related('aspectos_relacionados', 'equipo_apoyo')
        if empresa:
            queryset = queryset.filter(empresa_id=empresa.id)

        # Filtrar por estado
        estado = self.request.query_params.get('estado')
        if estado:
            queryset = queryset.filter(estado=estado)

        return queryset.order_by('-fecha_inicio', '-created_at')

    def perform_create(self, serializer):
        empresa = get_tenant_empresa(auto_create=False)
        serializer.save(
            created_by=self.request.user,
            empresa_id=empresa.id if empresa else None
        )

    @action(detail=False, methods=['get'])
    def resumen(self, request):
        """Resumen estadístico de programas ambientales"""
        empresa = get_tenant_empresa(auto_create=False)
        queryset = self.get_queryset()

        resumen = {
            'total': queryset.count(),
            'por_estado': list(
                queryset.values('estado')
                .annotate(cantidad=Count('id'))
                .order_by('estado')
            ),
            'por_tipo': list(
                queryset.values('tipo_programa')
                .annotate(cantidad=Count('id'))
                .order_by('-cantidad')
            ),
        }
        return Response(resumen)

    @action(detail=False, methods=['get'])
    def activos(self, request):
        """Programas en ejecución"""
        queryset = self.get_queryset().filter(estado='EN_EJECUCION')
        serializer = ProgramaAmbientalListSerializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def vencidos(self, request):
        """Programas vencidos"""
        from django.utils import timezone
        queryset = self.get_queryset().filter(
            fecha_fin__lt=timezone.now().date(),
            estado__in=['PLANIFICADO', 'EN_EJECUCION']
        )
        serializer = ProgramaAmbientalListSerializer(queryset, many=True)
        return Response(serializer.data)


class MonitoreoAmbientalViewSet(viewsets.ModelViewSet):
    """ViewSet para gestión de monitoreos ambientales"""
    serializer_class = MonitoreoAmbientalSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        empresa = get_tenant_empresa(auto_create=False)
        queryset = MonitoreoAmbiental.objects.select_related(
            'aspecto_relacionado', 'programa_relacionado',
            'responsable_medicion', 'created_by'
        )
        if empresa:
            queryset = queryset.filter(empresa_id=empresa.id)

        # Filtrar por aspecto
        aspecto_id = self.request.query_params.get('aspecto')
        if aspecto_id:
            queryset = queryset.filter(aspecto_relacionado_id=aspecto_id)

        # Filtrar por programa
        programa_id = self.request.query_params.get('programa')
        if programa_id:
            queryset = queryset.filter(programa_relacionado_id=programa_id)

        # Filtrar por tipo de monitoreo
        tipo = self.request.query_params.get('tipo')
        if tipo:
            queryset = queryset.filter(tipo_monitoreo=tipo)

        # Filtrar por cumplimiento
        cumplimiento = self.request.query_params.get('cumplimiento')
        if cumplimiento:
            queryset = queryset.filter(cumplimiento=cumplimiento)

        return queryset.order_by('-fecha_monitoreo', '-hora_monitoreo')

    def perform_create(self, serializer):
        empresa = get_tenant_empresa(auto_create=False)
        serializer.save(
            created_by=self.request.user,
            empresa_id=empresa.id if empresa else None
        )

    @action(detail=False, methods=['get'])
    def resumen(self, request):
        """Resumen estadístico de monitoreos ambientales"""
        empresa = get_tenant_empresa(auto_create=False)
        queryset = self.get_queryset()

        resumen = {
            'total': queryset.count(),
            'por_tipo': list(
                queryset.values('tipo_monitoreo')
                .annotate(cantidad=Count('id'))
                .order_by('-cantidad')
            ),
            'por_cumplimiento': list(
                queryset.values('cumplimiento')
                .annotate(cantidad=Count('id'))
                .order_by('cumplimiento')
            ),
            'por_frecuencia': list(
                queryset.values('frecuencia_requerida')
                .annotate(cantidad=Count('id'))
                .order_by('frecuencia_requerida')
            ),
        }
        return Response(resumen)

    @action(detail=False, methods=['get'])
    def incumplimientos(self, request):
        """Monitoreos que no cumplen con los límites"""
        queryset = self.get_queryset().filter(cumplimiento='NO_CUMPLE')
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def por_rango_fechas(self, request):
        """Monitoreos en un rango de fechas"""
        fecha_inicio = request.query_params.get('fecha_inicio')
        fecha_fin = request.query_params.get('fecha_fin')

        queryset = self.get_queryset()

        if fecha_inicio:
            queryset = queryset.filter(fecha_monitoreo__gte=fecha_inicio)
        if fecha_fin:
            queryset = queryset.filter(fecha_monitoreo__lte=fecha_fin)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
