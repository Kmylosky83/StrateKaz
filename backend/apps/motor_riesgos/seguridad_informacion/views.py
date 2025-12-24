"""
Views para Seguridad de la Información - ISO 27001
Motor de Riesgos
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.db.models import Count, Avg, Q

from .models import (
    ActivoInformacion,
    Amenaza,
    Vulnerabilidad,
    RiesgoSeguridad,
    ControlSeguridad,
    IncidenteSeguridad
)
from .serializers import (
    ActivoInformacionSerializer,
    ActivoInformacionListSerializer,
    AmenazaSerializer,
    AmenazaListSerializer,
    VulnerabilidadSerializer,
    VulnerabilidadListSerializer,
    RiesgoSeguridadListSerializer,
    RiesgoSeguridadDetailSerializer,
    ControlSeguridadSerializer,
    ControlSeguridadListSerializer,
    IncidenteSeguridadSerializer,
    IncidenteSeguridadListSerializer
)


class ActivoInformacionViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión de activos de información

    Endpoints:
    - GET /api/motor-riesgos/seguridad-informacion/activos-informacion/ - Lista activos
    - POST /api/motor-riesgos/seguridad-informacion/activos-informacion/ - Crea activo
    - GET /api/motor-riesgos/seguridad-informacion/activos-informacion/{id}/ - Detalle
    - PUT/PATCH /api/motor-riesgos/seguridad-informacion/activos-informacion/{id}/ - Actualiza
    - DELETE /api/motor-riesgos/seguridad-informacion/activos-informacion/{id}/ - Elimina
    - GET /api/motor-riesgos/seguridad-informacion/activos-informacion/criticos/ - Activos críticos
    """
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['tipo', 'clasificacion', 'is_active', 'propietario']
    search_fields = ['codigo', 'nombre', 'descripcion', 'ubicacion']
    ordering_fields = ['codigo', 'nombre', 'criticidad', 'created_at']
    ordering = ['codigo']

    def get_serializer_class(self):
        if self.action == 'list':
            return ActivoInformacionListSerializer
        return ActivoInformacionSerializer

    def get_queryset(self):
        empresa_id = self.request.headers.get('X-Empresa-ID')
        queryset = ActivoInformacion.objects.select_related('propietario', 'custodio')
        if empresa_id:
            queryset = queryset.filter(empresa_id=empresa_id)
        return queryset

    @action(detail=False, methods=['get'])
    def criticos(self, request):
        """Retorna activos con criticidad alta (>=4)"""
        queryset = self.get_queryset().filter(criticidad__gte=4)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def estadisticas(self, request):
        """Estadísticas de activos de información"""
        queryset = self.get_queryset()

        stats = {
            'total': queryset.count(),
            'activos': queryset.filter(is_active=True).count(),
            'por_tipo': list(
                queryset.values('tipo')
                .annotate(cantidad=Count('id'))
                .order_by('-cantidad')
            ),
            'por_clasificacion': list(
                queryset.values('clasificacion')
                .annotate(cantidad=Count('id'))
                .order_by('-cantidad')
            ),
            'criticidad_promedio': queryset.aggregate(Avg('criticidad'))['criticidad__avg'] or 0,
        }
        return Response(stats)


class AmenazaViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión de amenazas

    Las amenazas son catálogo compartido entre todas las empresas.
    """
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['tipo', 'is_active']
    search_fields = ['codigo', 'nombre', 'descripcion']
    ordering_fields = ['codigo', 'nombre', 'probabilidad_ocurrencia', 'created_at']
    ordering = ['tipo', 'codigo']

    def get_serializer_class(self):
        if self.action == 'list':
            return AmenazaListSerializer
        return AmenazaSerializer

    def get_queryset(self):
        return Amenaza.objects.all()


class VulnerabilidadViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión de vulnerabilidades

    Las vulnerabilidades están asociadas a activos de información específicos.
    """
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['activo', 'is_active']
    search_fields = ['codigo', 'descripcion']
    ordering_fields = ['codigo', 'facilidad_explotacion', 'created_at']
    ordering = ['-created_at']

    def get_serializer_class(self):
        if self.action == 'list':
            return VulnerabilidadListSerializer
        return VulnerabilidadSerializer

    def get_queryset(self):
        empresa_id = self.request.headers.get('X-Empresa-ID')
        queryset = Vulnerabilidad.objects.select_related('activo')
        if empresa_id:
            queryset = queryset.filter(empresa_id=empresa_id)

        # Filtrar por activo específico
        activo_id = self.request.query_params.get('activo')
        if activo_id:
            queryset = queryset.filter(activo_id=activo_id)

        return queryset


class RiesgoSeguridadViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión de riesgos de seguridad de la información

    Endpoints adicionales:
    - GET /criticos/ - Riesgos críticos y altos
    - GET /resumen/ - Resumen estadístico
    - GET /matriz/ - Datos para matriz de riesgos
    """
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['nivel_riesgo', 'estado', 'aceptabilidad', 'activo', 'amenaza']
    search_fields = ['escenario_riesgo', 'controles_existentes']
    ordering_fields = ['probabilidad', 'impacto', 'nivel_riesgo', 'created_at']
    ordering = ['-created_at']

    def get_serializer_class(self):
        if self.action == 'list':
            return RiesgoSeguridadListSerializer
        return RiesgoSeguridadDetailSerializer

    def get_queryset(self):
        empresa_id = self.request.headers.get('X-Empresa-ID')
        queryset = RiesgoSeguridad.objects.select_related(
            'activo', 'amenaza', 'vulnerabilidad',
            'responsable_tratamiento', 'created_by'
        )
        if empresa_id:
            queryset = queryset.filter(empresa_id=empresa_id)
        return queryset

    def perform_create(self, serializer):
        """Asigna empresa_id y created_by"""
        empresa_id = self.request.headers.get('X-Empresa-ID')
        serializer.save(
            created_by=self.request.user,
            empresa_id=empresa_id
        )

    @action(detail=False, methods=['get'])
    def criticos(self, request):
        """Riesgos críticos y altos"""
        queryset = self.get_queryset().filter(
            nivel_riesgo__in=['ALTO', 'CRITICO']
        )
        serializer = RiesgoSeguridadListSerializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def resumen(self, request):
        """Resumen estadístico de riesgos"""
        queryset = self.get_queryset()

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
            'por_aceptabilidad': list(
                queryset.values('aceptabilidad')
                .annotate(cantidad=Count('id'))
                .order_by('aceptabilidad')
            ),
        }
        return Response(resumen)

    @action(detail=False, methods=['get'])
    def matriz(self, request):
        """Datos para matriz de riesgos (probabilidad vs impacto)"""
        queryset = self.get_queryset()

        # Obtener datos de riesgos para la matriz
        riesgos = queryset.values(
            'id', 'probabilidad', 'impacto', 'nivel_riesgo',
            'activo__codigo', 'amenaza__nombre'
        )

        # Crear matriz 5x5
        matriz = [[[] for _ in range(5)] for _ in range(5)]

        for riesgo in riesgos:
            prob = riesgo['probabilidad'] - 1  # Convertir a índice 0-4
            imp = riesgo['impacto'] - 1
            if 0 <= prob < 5 and 0 <= imp < 5:
                matriz[prob][imp].append({
                    'id': riesgo['id'],
                    'activo': riesgo['activo__codigo'],
                    'amenaza': riesgo['amenaza__nombre'],
                    'nivel': riesgo['nivel_riesgo']
                })

        return Response({
            'matriz': matriz,
            'total_riesgos': len(riesgos)
        })


class ControlSeguridadViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión de controles de seguridad ISO 27001

    Endpoints adicionales:
    - GET /pendientes/ - Controles no implementados o en implementación
    - GET /por_efectividad/ - Análisis de efectividad de controles
    """
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['tipo_control', 'estado_implementacion', 'riesgo', 'responsable']
    search_fields = ['control_iso', 'descripcion', 'evidencia']
    ordering_fields = ['control_iso', 'efectividad', 'fecha_implementacion', 'created_at']
    ordering = ['control_iso']

    def get_serializer_class(self):
        if self.action == 'list':
            return ControlSeguridadListSerializer
        return ControlSeguridadSerializer

    def get_queryset(self):
        empresa_id = self.request.headers.get('X-Empresa-ID')
        queryset = ControlSeguridad.objects.select_related(
            'riesgo', 'riesgo__activo', 'riesgo__amenaza', 'responsable'
        )
        if empresa_id:
            queryset = queryset.filter(empresa_id=empresa_id)

        # Filtrar por riesgo específico
        riesgo_id = self.request.query_params.get('riesgo')
        if riesgo_id:
            queryset = queryset.filter(riesgo_id=riesgo_id)

        return queryset

    def perform_create(self, serializer):
        """Asigna empresa_id"""
        empresa_id = self.request.headers.get('X-Empresa-ID')
        serializer.save(empresa_id=empresa_id)

    @action(detail=False, methods=['get'])
    def pendientes(self, request):
        """Controles pendientes de implementar o en implementación"""
        queryset = self.get_queryset().filter(
            estado_implementacion__in=['NO_IMPLEMENTADO', 'EN_IMPLEMENTACION']
        )
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def por_efectividad(self, request):
        """Análisis de efectividad de controles"""
        queryset = self.get_queryset()

        stats = {
            'total': queryset.count(),
            'implementados': queryset.filter(estado_implementacion='IMPLEMENTADO').count(),
            'efectividad_promedio': queryset.aggregate(Avg('efectividad'))['efectividad__avg'] or 0,
            'por_tipo': list(
                queryset.values('tipo_control')
                .annotate(
                    cantidad=Count('id'),
                    efectividad_promedio=Avg('efectividad')
                )
            ),
        }
        return Response(stats)


class IncidenteSeguridadViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión de incidentes de seguridad

    Endpoints adicionales:
    - GET /abiertos/ - Incidentes no cerrados
    - GET /criticos/ - Incidentes críticos
    - GET /resumen/ - Resumen estadístico
    """
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['tipo_incidente', 'severidad', 'estado', 'reportado_por']
    search_fields = ['descripcion', 'impacto_real', 'acciones_contencion']
    ordering_fields = ['fecha_deteccion', 'severidad', 'created_at']
    ordering = ['-fecha_deteccion']

    def get_serializer_class(self):
        if self.action == 'list':
            return IncidenteSeguridadListSerializer
        return IncidenteSeguridadSerializer

    def get_queryset(self):
        empresa_id = self.request.headers.get('X-Empresa-ID')
        queryset = IncidenteSeguridad.objects.select_related('reportado_por').prefetch_related('activos_afectados')
        if empresa_id:
            queryset = queryset.filter(empresa_id=empresa_id)
        return queryset

    def perform_create(self, serializer):
        """Asigna empresa_id y reportado_por"""
        empresa_id = self.request.headers.get('X-Empresa-ID')
        serializer.save(empresa_id=empresa_id)

    @action(detail=False, methods=['get'])
    def abiertos(self, request):
        """Incidentes no cerrados"""
        queryset = self.get_queryset().exclude(estado='CERRADO')
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def criticos(self, request):
        """Incidentes críticos y de alta severidad"""
        queryset = self.get_queryset().filter(
            severidad__in=['ALTA', 'CRITICA']
        )
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def resumen(self, request):
        """Resumen estadístico de incidentes"""
        queryset = self.get_queryset()

        resumen = {
            'total': queryset.count(),
            'abiertos': queryset.exclude(estado='CERRADO').count(),
            'por_tipo': list(
                queryset.values('tipo_incidente')
                .annotate(cantidad=Count('id'))
                .order_by('-cantidad')
            ),
            'por_severidad': list(
                queryset.values('severidad')
                .annotate(cantidad=Count('id'))
                .order_by('severidad')
            ),
            'por_estado': list(
                queryset.values('estado')
                .annotate(cantidad=Count('id'))
                .order_by('estado')
            ),
        }
        return Response(resumen)
