"""
Views para riesgos_viales - PESV (Plan Estratégico de Seguridad Vial)
Basado en Resolución 40595/2022 - Ministerio de Transporte de Colombia
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q, Count, Avg, Sum
from django.db import transaction

from .models import (
    TipoRiesgoVial,
    RiesgoVial,
    ControlVial,
    IncidenteVial,
    InspeccionVehiculo
)
from .serializers import (
    TipoRiesgoVialSerializer,
    RiesgoVialListSerializer,
    RiesgoVialDetailSerializer,
    RiesgoVialCreateUpdateSerializer,
    ControlVialListSerializer,
    ControlVialDetailSerializer,
    ControlVialCreateUpdateSerializer,
    IncidenteVialListSerializer,
    IncidenteVialDetailSerializer,
    IncidenteVialCreateUpdateSerializer,
    InspeccionVehiculoListSerializer,
    InspeccionVehiculoDetailSerializer,
    InspeccionVehiculoCreateSerializer,
)

from apps.core.base_models.mixins import get_tenant_empresa

class FactorRiesgoVialViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión del catálogo de tipos de riesgos viales (factores)

    Este catálogo define los tipos de riesgos según la categoría:
    - Factor Humano: Comportamientos del conductor
    - Factor Vehículo: Estado mecánico y condiciones
    - Factor Vía: Infraestructura vial
    - Factor Ambiental: Condiciones climáticas

    Endpoints:
    - GET    /api/motor-riesgos/riesgos-viales/factores/           - Lista de tipos de riesgos
    - POST   /api/motor-riesgos/riesgos-viales/factores/           - Crear tipo de riesgo
    - GET    /api/motor-riesgos/riesgos-viales/factores/{id}/      - Detalle de tipo
    - PUT    /api/motor-riesgos/riesgos-viales/factores/{id}/      - Actualizar tipo
    - DELETE /api/motor-riesgos/riesgos-viales/factores/{id}/      - Eliminar tipo
    - GET    /api/motor-riesgos/riesgos-viales/factores/por-categoria/ - Agrupar por categoría
    """
    serializer_class = TipoRiesgoVialSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Retorna todos los tipos de riesgos viales (catálogo global)"""
        queryset = TipoRiesgoVial.objects.all()

        # Filtros opcionales
        categoria = self.request.query_params.get('categoria')
        if categoria:
            queryset = queryset.filter(categoria=categoria)

        is_active = self.request.query_params.get('is_active')
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')

        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(codigo__icontains=search) |
                Q(nombre__icontains=search) |
                Q(descripcion__icontains=search)
            )

        return queryset.order_by('categoria', 'codigo')

    @action(detail=False, methods=['get'], url_path='por-categoria')
    def por_categoria(self, request):
        """
        Agrupa tipos de riesgos por categoría

        Response:
        {
            "HUMANO": [
                {"id": 1, "codigo": "RH-01", "nombre": "Fatiga del conductor", ...},
                ...
            ],
            "VEHICULO": [...],
            "VIA": [...],
            "AMBIENTAL": [...]
        }
        """
        tipos = self.get_queryset()
        serializer = self.get_serializer(tipos, many=True)

        # Agrupar por categoría
        agrupado = {}
        for tipo in serializer.data:
            categoria = tipo['categoria']
            if categoria not in agrupado:
                agrupado[categoria] = []
            agrupado[categoria].append(tipo)

        return Response(agrupado)


class RiesgoVialViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión de riesgos viales identificados y evaluados

    Evaluación basada en metodología PESV:
    - Frecuencia de exposición (1-5)
    - Probabilidad de ocurrencia (1-5)
    - Severidad de consecuencias (1-5)
    - Valoración = Frecuencia × Probabilidad × Severidad

    Niveles de riesgo:
    - 1-25: Bajo
    - 26-60: Medio
    - 61-100: Alto
    - 101-125: Crítico

    Endpoints:
    - GET    /api/motor-riesgos/riesgos-viales/riesgos/               - Lista de riesgos
    - POST   /api/motor-riesgos/riesgos-viales/riesgos/               - Crear riesgo
    - GET    /api/motor-riesgos/riesgos-viales/riesgos/{id}/          - Detalle de riesgo
    - PUT    /api/motor-riesgos/riesgos-viales/riesgos/{id}/          - Actualizar riesgo
    - DELETE /api/motor-riesgos/riesgos-viales/riesgos/{id}/          - Eliminar riesgo
    - GET    /api/motor-riesgos/riesgos-viales/riesgos/estadisticas/  - Estadísticas
    - GET    /api/motor-riesgos/riesgos-viales/riesgos/criticos/      - Riesgos críticos
    """
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """
        Filtra riesgos por empresa via get_tenant_empresa()
        """
        empresa = get_tenant_empresa(auto_create=False)

        if not empresa:
            return RiesgoVial.objects.none()

        queryset = RiesgoVial.objects.filter(
            empresa_id=empresa.id
        ).select_related(
            'tipo_riesgo',
            'responsable',
            'created_by'
        )

        # Filtros opcionales
        nivel_riesgo = self.request.query_params.get('nivel_riesgo')
        if nivel_riesgo:
            queryset = queryset.filter(nivel_riesgo=nivel_riesgo)

        estado = self.request.query_params.get('estado')
        if estado:
            queryset = queryset.filter(estado=estado)

        tipo_riesgo_id = self.request.query_params.get('tipo_riesgo')
        if tipo_riesgo_id:
            queryset = queryset.filter(tipo_riesgo_id=tipo_riesgo_id)

        responsable_id = self.request.query_params.get('responsable')
        if responsable_id:
            queryset = queryset.filter(responsable_id=responsable_id)

        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(codigo__icontains=search) |
                Q(descripcion__icontains=search) |
                Q(proceso_afectado__icontains=search)
            )

        return queryset.order_by('-valoracion_riesgo', 'codigo')

    def get_serializer_class(self):
        """Retorna el serializer apropiado según la acción"""
        if self.action == 'retrieve':
            return RiesgoVialDetailSerializer
        if self.action in ['create', 'update', 'partial_update']:
            return RiesgoVialCreateUpdateSerializer
        return RiesgoVialListSerializer

    @action(detail=False, methods=['get'])
    def estadisticas(self, request):
        """
        Estadísticas de riesgos viales

        Response:
        {
            "total_riesgos": 45,
            "por_nivel": {
                "BAJO": 15,
                "MEDIO": 18,
                "ALTO": 10,
                "CRITICO": 2
            },
            "por_estado": {...},
            "por_categoria": {...},
            "valoracion_promedio": 42.5,
            "requieren_accion_inmediata": 12
        }
        """
        queryset = self.get_queryset()

        # Estadísticas generales
        total = queryset.count()
        valoracion_promedio = queryset.aggregate(Avg('valoracion_riesgo'))['valoracion_riesgo__avg'] or 0

        # Por nivel de riesgo
        por_nivel = {}
        for nivel_code, nivel_name in RiesgoVial.NIVEL_RIESGO_CHOICES:
            por_nivel[nivel_code] = queryset.filter(nivel_riesgo=nivel_code).count()

        # Por estado
        por_estado = {}
        for estado_code, estado_name in RiesgoVial.ESTADO_CHOICES:
            por_estado[estado_code] = queryset.filter(estado=estado_code).count()

        # Por categoría de tipo de riesgo
        por_categoria = queryset.values(
            'tipo_riesgo__categoria'
        ).annotate(
            count=Count('id')
        ).order_by('-count')

        # Riesgos que requieren acción inmediata
        requieren_accion = queryset.filter(
            nivel_riesgo__in=['ALTO', 'CRITICO']
        ).count()

        return Response({
            'total_riesgos': total,
            'por_nivel': por_nivel,
            'por_estado': por_estado,
            'por_categoria': list(por_categoria),
            'valoracion_promedio': round(valoracion_promedio, 2),
            'requieren_accion_inmediata': requieren_accion,
        })

    @action(detail=False, methods=['get'])
    def criticos(self, request):
        """
        Lista de riesgos críticos que requieren atención inmediata
        """
        queryset = self.get_queryset().filter(
            nivel_riesgo__in=['ALTO', 'CRITICO'],
            estado__in=['IDENTIFICADO', 'EN_EVALUACION', 'EN_TRATAMIENTO']
        )

        serializer = RiesgoVialListSerializer(queryset, many=True)

        return Response({
            'count': queryset.count(),
            'riesgos': serializer.data,
        })


class ControlVialViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión de controles de seguridad vial

    Clasificados según:
    - Tipo: Preventivo, Correctivo, Detectivo
    - Momento: Antes/Durante/Después del viaje, Permanente
    - Jerarquía: Eliminación, Sustitución, Ing., Admin., Señalización, EPP

    Endpoints:
    - GET    /api/motor-riesgos/riesgos-viales/controles/                  - Lista de controles
    - POST   /api/motor-riesgos/riesgos-viales/controles/                  - Crear control
    - GET    /api/motor-riesgos/riesgos-viales/controles/{id}/             - Detalle
    - PUT    /api/motor-riesgos/riesgos-viales/controles/{id}/             - Actualizar
    - DELETE /api/motor-riesgos/riesgos-viales/controles/{id}/             - Eliminar
    - GET    /api/motor-riesgos/riesgos-viales/controles/por-riesgo/{id}/  - Por riesgo
    - GET    /api/motor-riesgos/riesgos-viales/controles/atrasados/        - Controles atrasados
    """
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Filtra controles por empresa_id"""
        empresa = get_tenant_empresa(auto_create=False)

        if not empresa:
            return ControlVial.objects.none()

        queryset = ControlVial.objects.filter(
            empresa_id=empresa.id
        ).select_related(
            'riesgo_vial',
            'riesgo_vial__tipo_riesgo',
            'responsable',
            'created_by'
        )

        # Filtros opcionales
        riesgo_id = self.request.query_params.get('riesgo_vial')
        if riesgo_id:
            queryset = queryset.filter(riesgo_vial_id=riesgo_id)

        tipo_control = self.request.query_params.get('tipo_control')
        if tipo_control:
            queryset = queryset.filter(tipo_control=tipo_control)

        estado = self.request.query_params.get('estado')
        if estado:
            queryset = queryset.filter(estado=estado)

        jerarquia = self.request.query_params.get('jerarquia')
        if jerarquia:
            queryset = queryset.filter(jerarquia=jerarquia)

        responsable_id = self.request.query_params.get('responsable')
        if responsable_id:
            queryset = queryset.filter(responsable_id=responsable_id)

        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(codigo__icontains=search) |
                Q(nombre__icontains=search) |
                Q(descripcion__icontains=search)
            )

        return queryset.order_by('riesgo_vial', 'fecha_propuesta')

    def get_serializer_class(self):
        """Retorna el serializer apropiado"""
        if self.action == 'retrieve':
            return ControlVialDetailSerializer
        if self.action in ['create', 'update', 'partial_update']:
            return ControlVialCreateUpdateSerializer
        return ControlVialListSerializer

    @action(detail=False, methods=['get'], url_path='por-riesgo/(?P<riesgo_id>[^/.]+)')
    def por_riesgo(self, request, riesgo_id=None):
        """
        Obtiene todos los controles asociados a un riesgo específico
        """
        queryset = self.get_queryset().filter(riesgo_vial_id=riesgo_id)
        serializer = ControlVialListSerializer(queryset, many=True)

        return Response({
            'count': queryset.count(),
            'controles': serializer.data,
        })

    @action(detail=False, methods=['get'])
    def atrasados(self, request):
        """
        Lista de controles atrasados en su implementación
        """
        from django.utils import timezone

        queryset = self.get_queryset().filter(
            estado__in=['PROPUESTO', 'APROBADO', 'EN_IMPLEMENTACION'],
            fecha_implementacion_programada__lt=timezone.now().date()
        )

        serializer = ControlVialListSerializer(queryset, many=True)

        return Response({
            'count': queryset.count(),
            'controles_atrasados': serializer.data,
        })


class IncidenteVialViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión de incidentes y accidentes viales

    Para análisis de causalidad y mejora continua del PESV.

    Tipos de incidente:
    - Accidente de tránsito
    - Incidente menor
    - Casi accidente
    - Infracción de tránsito

    Endpoints:
    - GET    /api/motor-riesgos/riesgos-viales/incidentes/              - Lista de incidentes
    - POST   /api/motor-riesgos/riesgos-viales/incidentes/              - Crear incidente
    - GET    /api/motor-riesgos/riesgos-viales/incidentes/{id}/         - Detalle
    - PUT    /api/motor-riesgos/riesgos-viales/incidentes/{id}/         - Actualizar
    - DELETE /api/motor-riesgos/riesgos-viales/incidentes/{id}/         - Eliminar
    - GET    /api/motor-riesgos/riesgos-viales/incidentes/estadisticas/ - Estadísticas
    - GET    /api/motor-riesgos/riesgos-viales/incidentes/graves/       - Incidentes graves
    - POST   /api/motor-riesgos/riesgos-viales/incidentes/{id}/iniciar-investigacion/ - Iniciar investigación
    """
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Filtra incidentes por empresa_id"""
        empresa = get_tenant_empresa(auto_create=False)

        if not empresa:
            return IncidenteVial.objects.none()

        queryset = IncidenteVial.objects.filter(
            empresa_id=empresa.id
        ).select_related(
            'investigador',
            'created_by'
        ).prefetch_related(
            'riesgos_relacionados'
        )

        # Filtros opcionales
        tipo_incidente = self.request.query_params.get('tipo_incidente')
        if tipo_incidente:
            queryset = queryset.filter(tipo_incidente=tipo_incidente)

        gravedad = self.request.query_params.get('gravedad')
        if gravedad:
            queryset = queryset.filter(gravedad=gravedad)

        estado_investigacion = self.request.query_params.get('estado_investigacion')
        if estado_investigacion:
            queryset = queryset.filter(estado_investigacion=estado_investigacion)

        vehiculo_placa = self.request.query_params.get('vehiculo_placa')
        if vehiculo_placa:
            queryset = queryset.filter(vehiculo_placa__icontains=vehiculo_placa)

        fecha_desde = self.request.query_params.get('fecha_desde')
        if fecha_desde:
            queryset = queryset.filter(fecha_incidente__date__gte=fecha_desde)

        fecha_hasta = self.request.query_params.get('fecha_hasta')
        if fecha_hasta:
            queryset = queryset.filter(fecha_incidente__date__lte=fecha_hasta)

        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(numero_incidente__icontains=search) |
                Q(conductor_nombre__icontains=search) |
                Q(vehiculo_placa__icontains=search) |
                Q(ubicacion__icontains=search)
            )

        return queryset.order_by('-fecha_incidente')

    def get_serializer_class(self):
        """Retorna el serializer apropiado"""
        if self.action == 'retrieve':
            return IncidenteVialDetailSerializer
        if self.action in ['create', 'update', 'partial_update']:
            return IncidenteVialCreateUpdateSerializer
        return IncidenteVialListSerializer

    @action(detail=False, methods=['get'])
    def estadisticas(self, request):
        """
        Estadísticas de incidentes viales

        Response:
        {
            "total_incidentes": 25,
            "por_tipo": {...},
            "por_gravedad": {...},
            "total_lesionados": 5,
            "total_fallecidos": 0,
            "costo_total_estimado": 50000000,
            "por_mes": [...]
        }
        """
        queryset = self.get_queryset()

        # Estadísticas generales
        total = queryset.count()
        total_lesionados = queryset.aggregate(Sum('numero_lesionados'))['numero_lesionados__sum'] or 0
        total_fallecidos = queryset.aggregate(Sum('numero_fallecidos'))['numero_fallecidos__sum'] or 0
        costo_total = queryset.aggregate(Sum('costo_estimado_daños'))['costo_estimado_daños__sum'] or 0

        # Por tipo de incidente
        por_tipo = {}
        for tipo_code, tipo_name in IncidenteVial.TIPO_INCIDENTE_CHOICES:
            por_tipo[tipo_code] = queryset.filter(tipo_incidente=tipo_code).count()

        # Por gravedad
        por_gravedad = {}
        for gravedad_code, gravedad_name in IncidenteVial.GRAVEDAD_CHOICES:
            por_gravedad[gravedad_code] = queryset.filter(gravedad=gravedad_code).count()

        # Por estado de investigación
        por_estado_investigacion = {}
        for estado_code, estado_name in IncidenteVial.ESTADO_INVESTIGACION_CHOICES:
            por_estado_investigacion[estado_code] = queryset.filter(
                estado_investigacion=estado_code
            ).count()

        return Response({
            'total_incidentes': total,
            'por_tipo': por_tipo,
            'por_gravedad': por_gravedad,
            'por_estado_investigacion': por_estado_investigacion,
            'total_lesionados': total_lesionados,
            'total_fallecidos': total_fallecidos,
            'costo_total_estimado': float(costo_total),
        })

    @action(detail=False, methods=['get'])
    def graves(self, request):
        """
        Lista de incidentes graves (con lesiones o fallecidos)
        """
        queryset = self.get_queryset().filter(
            Q(gravedad__in=['LESION_GRAVE', 'FATAL']) |
            Q(numero_lesionados__gt=0) |
            Q(numero_fallecidos__gt=0)
        )

        serializer = IncidenteVialListSerializer(queryset, many=True)

        return Response({
            'count': queryset.count(),
            'incidentes_graves': serializer.data,
        })

    @action(detail=True, methods=['post'], url_path='iniciar-investigacion')
    @transaction.atomic
    def iniciar_investigacion(self, request, pk=None):
        """
        Inicia la investigación de un incidente

        Payload:
        {
            "investigador_id": 123,
            "fecha_inicio": "2024-12-23"
        }
        """
        incidente = self.get_object()

        if incidente.estado_investigacion != 'REPORTADO':
            return Response(
                {'error': 'Solo se puede iniciar investigación de incidentes en estado REPORTADO'},
                status=status.HTTP_400_BAD_REQUEST
            )

        investigador_id = request.data.get('investigador_id')
        fecha_inicio = request.data.get('fecha_inicio')

        if not investigador_id:
            return Response(
                {'error': 'Debe especificar el investigador'},
                status=status.HTTP_400_BAD_REQUEST
            )

        from django.contrib.auth import get_user_model
        User = get_user_model()

        try:
            investigador = User.objects.get(id=investigador_id)
        except User.DoesNotExist:
            return Response(
                {'error': 'Investigador no encontrado'},
                status=status.HTTP_404_NOT_FOUND
            )

        incidente.estado_investigacion = 'EN_INVESTIGACION'
        incidente.investigador = investigador

        if fecha_inicio:
            from datetime import datetime
            incidente.fecha_inicio_investigacion = datetime.strptime(fecha_inicio, '%Y-%m-%d').date()
        else:
            from django.utils import timezone
            incidente.fecha_inicio_investigacion = timezone.now().date()

        incidente.save()

        serializer = IncidenteVialDetailSerializer(incidente)

        return Response({
            'message': 'Investigación iniciada exitosamente',
            'incidente': serializer.data,
        })


class InspeccionVehiculoViewSet(viewsets.ModelViewSet):
    """
    ViewSet para inspecciones pre-operacionales de vehículos

    Parte fundamental del PESV para prevención de riesgos viales.
    Inspecciones diarias antes de iniciar operación.

    El resultado se calcula automáticamente según el checklist:
    - APROBADO: Todos los ítems OK
    - APROBADO_OBSERVACIONES: Hasta 3 ítems fallidos no críticos
    - RECHAZADO: Más de 3 ítems o fallas críticas

    Endpoints:
    - GET    /api/motor-riesgos/riesgos-viales/inspecciones/          - Lista
    - POST   /api/motor-riesgos/riesgos-viales/inspecciones/          - Crear
    - GET    /api/motor-riesgos/riesgos-viales/inspecciones/{id}/     - Detalle
    - PUT    /api/motor-riesgos/riesgos-viales/inspecciones/{id}/     - Actualizar
    - DELETE /api/motor-riesgos/riesgos-viales/inspecciones/{id}/     - Eliminar
    - GET    /api/motor-riesgos/riesgos-viales/inspecciones/por-vehiculo/{placa}/ - Por vehículo
    """
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Filtra inspecciones por empresa_id"""
        empresa = get_tenant_empresa(auto_create=False)

        if not empresa:
            return InspeccionVehiculo.objects.none()

        queryset = InspeccionVehiculo.objects.filter(
            empresa_id=empresa.id
        ).select_related(
            'created_by',
            'inspeccion_confirmada_por'
        )

        # Filtros opcionales
        vehiculo_placa = self.request.query_params.get('vehiculo_placa')
        if vehiculo_placa:
            queryset = queryset.filter(vehiculo_placa__icontains=vehiculo_placa)

        resultado = self.request.query_params.get('resultado')
        if resultado:
            queryset = queryset.filter(resultado=resultado)

        requiere_mantenimiento = self.request.query_params.get('requiere_mantenimiento')
        if requiere_mantenimiento is not None:
            queryset = queryset.filter(
                requiere_mantenimiento=requiere_mantenimiento.lower() == 'true'
            )

        fecha_desde = self.request.query_params.get('fecha_desde')
        if fecha_desde:
            queryset = queryset.filter(fecha_inspeccion__date__gte=fecha_desde)

        fecha_hasta = self.request.query_params.get('fecha_hasta')
        if fecha_hasta:
            queryset = queryset.filter(fecha_inspeccion__date__lte=fecha_hasta)

        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(numero_inspeccion__icontains=search) |
                Q(vehiculo_placa__icontains=search) |
                Q(conductor_nombre__icontains=search)
            )

        return queryset.order_by('-fecha_inspeccion')

    def get_serializer_class(self):
        """Retorna el serializer apropiado"""
        if self.action == 'retrieve':
            return InspeccionVehiculoDetailSerializer
        if self.action == 'create':
            return InspeccionVehiculoCreateSerializer
        return InspeccionVehiculoListSerializer

    @action(detail=False, methods=['get'], url_path='por-vehiculo/(?P<placa>[^/.]+)')
    def por_vehiculo(self, request, placa=None):
        """
        Historial de inspecciones de un vehículo específico
        """
        queryset = self.get_queryset().filter(vehiculo_placa__iexact=placa)
        serializer = InspeccionVehiculoListSerializer(queryset, many=True)

        return Response({
            'count': queryset.count(),
            'vehiculo_placa': placa,
            'inspecciones': serializer.data,
        })
