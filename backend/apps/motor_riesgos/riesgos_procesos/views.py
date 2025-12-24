"""
Views para Riesgos de Procesos - ISO 31000
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Count, Avg
from .models import (
    CategoriaRiesgo,
    RiesgoProceso,
    TratamientoRiesgo,
    MonitoreoRiesgo,
    MapaCalor
)
from .serializers import (
    CategoriaRiesgoSerializer,
    RiesgoProcesoListSerializer,
    RiesgoProcesoDetailSerializer,
    TratamientoRiesgoSerializer,
    MonitoreoRiesgoSerializer,
    MapaCalorSerializer
)


class CategoriaRiesgoViewSet(viewsets.ModelViewSet):
    """ViewSet para gestión de categorías de riesgo"""
    serializer_class = CategoriaRiesgoSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        empresa_id = self.request.headers.get('X-Empresa-ID')
        queryset = CategoriaRiesgo.objects.all()
        if empresa_id:
            queryset = queryset.filter(empresa_id=empresa_id)
        return queryset.order_by('orden', 'nombre')


class RiesgoProcesosViewSet(viewsets.ModelViewSet):
    """ViewSet para gestión de riesgos de procesos"""
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action == 'list':
            return RiesgoProcesoListSerializer
        return RiesgoProcesoDetailSerializer

    def get_queryset(self):
        empresa_id = self.request.headers.get('X-Empresa-ID')
        queryset = RiesgoProceso.objects.select_related(
            'categoria', 'responsable', 'created_by'
        )
        if empresa_id:
            queryset = queryset.filter(empresa_id=empresa_id)
        return queryset.order_by('-created_at')

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=False, methods=['get'])
    def resumen(self, request):
        """Resumen estadístico de riesgos"""
        empresa_id = request.headers.get('X-Empresa-ID')
        queryset = self.get_queryset()
        if empresa_id:
            queryset = queryset.filter(empresa_id=empresa_id)

        resumen = {
            'total': queryset.count(),
            'por_nivel': list(
                queryset.values('nivel_riesgo')
                .annotate(cantidad=Count('id'))
                .order_by('nivel_riesgo')
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
        }
        return Response(resumen)

    @action(detail=False, methods=['get'])
    def criticos(self, request):
        """Lista de riesgos críticos y altos"""
        queryset = self.get_queryset().filter(
            nivel_riesgo__in=['CRITICO', 'ALTO']
        )
        serializer = RiesgoProcesoListSerializer(queryset, many=True)
        return Response(serializer.data)


class TratamientoRiesgoViewSet(viewsets.ModelViewSet):
    """ViewSet para gestión de tratamientos de riesgo"""
    serializer_class = TratamientoRiesgoSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        empresa_id = self.request.headers.get('X-Empresa-ID')
        queryset = TratamientoRiesgo.objects.select_related(
            'riesgo', 'responsable'
        )
        if empresa_id:
            queryset = queryset.filter(empresa_id=empresa_id)

        # Filtrar por riesgo específico
        riesgo_id = self.request.query_params.get('riesgo')
        if riesgo_id:
            queryset = queryset.filter(riesgo_id=riesgo_id)

        return queryset.order_by('-created_at')

    @action(detail=False, methods=['get'])
    def pendientes(self, request):
        """Tratamientos pendientes o en progreso"""
        queryset = self.get_queryset().filter(
            estado__in=['PLANIFICADO', 'EN_PROGRESO']
        )
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


class MonitoreoRiesgoViewSet(viewsets.ModelViewSet):
    """ViewSet para monitoreo de riesgos"""
    serializer_class = MonitoreoRiesgoSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        empresa_id = self.request.headers.get('X-Empresa-ID')
        queryset = MonitoreoRiesgo.objects.select_related(
            'riesgo', 'realizado_por'
        )
        if empresa_id:
            queryset = queryset.filter(empresa_id=empresa_id)

        riesgo_id = self.request.query_params.get('riesgo')
        if riesgo_id:
            queryset = queryset.filter(riesgo_id=riesgo_id)

        return queryset.order_by('-fecha_monitoreo')

    def perform_create(self, serializer):
        serializer.save(realizado_por=self.request.user)


class MapaCalorViewSet(viewsets.ModelViewSet):
    """ViewSet para mapas de calor"""
    serializer_class = MapaCalorSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        empresa_id = self.request.headers.get('X-Empresa-ID')
        queryset = MapaCalor.objects.select_related('generado_por')
        if empresa_id:
            queryset = queryset.filter(empresa_id=empresa_id)
        return queryset.order_by('-fecha_generacion')

    def perform_create(self, serializer):
        serializer.save(generado_por=self.request.user)

    @action(detail=False, methods=['post'])
    def generar(self, request):
        """Genera un nuevo mapa de calor con datos actuales"""
        empresa_id = request.headers.get('X-Empresa-ID')

        # Obtener datos actuales de riesgos
        riesgos = RiesgoProceso.objects.filter(
            empresa_id=empresa_id, is_active=True
        ).values(
            'probabilidad', 'impacto', 'nivel_riesgo'
        )

        datos = {
            'matriz': [[0]*5 for _ in range(5)],
            'riesgos': list(riesgos)
        }

        # Llenar matriz
        for r in riesgos:
            prob = r['probabilidad'] - 1
            imp = r['impacto'] - 1
            if 0 <= prob < 5 and 0 <= imp < 5:
                datos['matriz'][prob][imp] += 1

        mapa = MapaCalor.objects.create(
            nombre=f"Mapa de Calor - {request.data.get('nombre', 'Auto')}",
            descripcion=request.data.get('descripcion', ''),
            tipo='INHERENTE',
            configuracion={},
            datos=datos,
            generado_por=request.user,
            empresa_id=empresa_id
        )

        serializer = self.get_serializer(mapa)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
