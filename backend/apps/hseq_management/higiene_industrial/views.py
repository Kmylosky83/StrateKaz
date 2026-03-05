"""
Views para Higiene Industrial - HSEQ Management
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Count, Avg, Q
from django.utils import timezone
from datetime import datetime

from .models import (
    TipoAgente,
    AgenteRiesgo,
    GrupoExposicionSimilar,
    PuntoMedicion,
    MedicionAmbiental,
    ControlExposicion,
    MonitoreoBiologico
)
from .serializers import (
    TipoAgenteSerializer,
    AgenteRiesgoSerializer,
    AgenteRiesgoListSerializer,
    GrupoExposicionSimilarSerializer,
    PuntoMedicionSerializer,
    MedicionAmbientalSerializer,
    MedicionAmbientalListSerializer,
    RegistrarMedicionSerializer,
    EvaluarCumplimientoSerializer,
    ControlExposicionSerializer,
    ControlExposicionListSerializer,
    MonitoreoBiologicoSerializer,
    MonitoreoBiologicoListSerializer,
    EstadisticasMedicionesSerializer,
    EstadisticasControlesSerializer
)


class TipoAgenteViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión de Tipos de Agentes
    """
    queryset = TipoAgente.objects.all()
    serializer_class = TipoAgenteSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['empresa_id', 'categoria', 'is_active']
    search_fields = ['codigo', 'nombre', 'descripcion']
    ordering_fields = ['codigo', 'nombre', 'categoria', 'created_at']
    ordering = ['categoria', 'nombre']

    def get_queryset(self):
        """Filtrar por empresa_id del usuario autenticado"""
        queryset = super().get_queryset()
        empresa_id = self.request.query_params.get('empresa_id')
        if empresa_id:
            queryset = queryset.filter(empresa_id=empresa_id)
        return queryset


class AgenteRiesgoViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión de Agentes de Riesgo
    """
    queryset = AgenteRiesgo.objects.select_related('tipo_agente').all()
    permission_classes = [IsAuthenticated]
    filterset_fields = ['empresa_id', 'tipo_agente', 'is_active']
    search_fields = ['codigo', 'nombre', 'descripcion']
    ordering_fields = ['codigo', 'nombre', 'limite_permisible', 'created_at']
    ordering = ['tipo_agente__categoria', 'nombre']

    def get_serializer_class(self):
        if self.action == 'list':
            return AgenteRiesgoListSerializer
        return AgenteRiesgoSerializer

    def get_queryset(self):
        """Filtrar por empresa_id"""
        queryset = super().get_queryset()
        empresa_id = self.request.query_params.get('empresa_id')
        if empresa_id:
            queryset = queryset.filter(empresa_id=empresa_id)
        return queryset

    @action(detail=False, methods=['get'], url_path='por-tipo')
    def por_tipo(self, request):
        """Obtener agentes agrupados por tipo"""
        empresa_id = request.query_params.get('empresa_id')
        if not empresa_id:
            return Response(
                {'error': 'Se requiere empresa_id'},
                status=status.HTTP_400_BAD_REQUEST
            )

        agentes_por_tipo = TipoAgente.objects.filter(
            empresa_id=empresa_id,
            is_active=True
        ).prefetch_related('agentes').annotate(
            total_agentes=Count('agentes', filter=Q(agentes__is_active=True))
        )

        resultado = []
        for tipo in agentes_por_tipo:
            agentes = AgenteRiesgoListSerializer(
                tipo.agentes.filter(is_active=True),
                many=True
            ).data
            resultado.append({
                'tipo': TipoAgenteSerializer(tipo).data,
                'agentes': agentes,
                'total_agentes': tipo.total_agentes
            })

        return Response(resultado)


class GrupoExposicionSimilarViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión de Grupos de Exposición Similar (GES)
    """
    queryset = GrupoExposicionSimilar.objects.prefetch_related('agentes_riesgo').all()
    serializer_class = GrupoExposicionSimilarSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['empresa_id', 'area', 'is_active']
    search_fields = ['codigo', 'nombre', 'area', 'proceso']
    ordering_fields = ['codigo', 'nombre', 'area', 'numero_trabajadores', 'created_at']
    ordering = ['area', 'nombre']

    def get_queryset(self):
        """Filtrar por empresa_id"""
        queryset = super().get_queryset()
        empresa_id = self.request.query_params.get('empresa_id')
        if empresa_id:
            queryset = queryset.filter(empresa_id=empresa_id)
        return queryset

    @action(detail=True, methods=['post'], url_path='asignar-agentes')
    def asignar_agentes(self, request, pk=None):
        """Asignar agentes de riesgo a un GES"""
        grupo = self.get_object()
        agentes_ids = request.data.get('agentes_ids', [])

        # Validar que los agentes pertenezcan a la misma empresa
        agentes = AgenteRiesgo.objects.filter(
            id__in=agentes_ids,
            empresa_id=grupo.empresa_id
        )

        if len(agentes) != len(agentes_ids):
            return Response(
                {'error': 'Algunos agentes no pertenecen a la misma empresa'},
                status=status.HTTP_400_BAD_REQUEST
            )

        grupo.agentes_riesgo.set(agentes)
        serializer = self.get_serializer(grupo)
        return Response(serializer.data)


class PuntoMedicionViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión de Puntos de Medición
    """
    queryset = PuntoMedicion.objects.select_related('grupo_exposicion').all()
    serializer_class = PuntoMedicionSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['empresa_id', 'area', 'grupo_exposicion', 'is_active']
    search_fields = ['codigo', 'nombre', 'area', 'seccion']
    ordering_fields = ['codigo', 'nombre', 'area', 'created_at']
    ordering = ['area', 'nombre']

    def get_queryset(self):
        """Filtrar por empresa_id"""
        queryset = super().get_queryset()
        empresa_id = self.request.query_params.get('empresa_id')
        if empresa_id:
            queryset = queryset.filter(empresa_id=empresa_id)
        return queryset

    @action(detail=False, methods=['get'], url_path='por-area')
    def por_area(self, request):
        """Obtener puntos de medición agrupados por área"""
        empresa_id = request.query_params.get('empresa_id')
        if not empresa_id:
            return Response(
                {'error': 'Se requiere empresa_id'},
                status=status.HTTP_400_BAD_REQUEST
            )

        puntos = self.get_queryset().filter(
            empresa_id=empresa_id,
            is_active=True
        ).order_by('area', 'nombre')

        # Agrupar por área
        puntos_por_area = {}
        for punto in puntos:
            if punto.area not in puntos_por_area:
                puntos_por_area[punto.area] = []
            puntos_por_area[punto.area].append(PuntoMedicionSerializer(punto).data)

        resultado = [
            {'area': area, 'puntos': puntos}
            for area, puntos in puntos_por_area.items()
        ]

        return Response(resultado)


class MedicionAmbientalViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión de Mediciones Ambientales
    """
    queryset = MedicionAmbiental.objects.select_related(
        'agente_riesgo',
        'punto_medicion',
        'grupo_exposicion'
    ).all()
    permission_classes = [IsAuthenticated]
    filterset_fields = [
        'empresa_id', 'agente_riesgo', 'punto_medicion',
        'grupo_exposicion', 'estado', 'cumplimiento'
    ]
    search_fields = ['numero_medicion', 'observaciones', 'realizado_por']
    ordering_fields = ['numero_medicion', 'fecha_medicion', 'valor_medido', 'created_at']
    ordering = ['-fecha_medicion', '-hora_inicio']

    def get_serializer_class(self):
        if self.action == 'list':
            return MedicionAmbientalListSerializer
        return MedicionAmbientalSerializer

    def get_queryset(self):
        """Filtrar por empresa_id y parámetros adicionales"""
        queryset = super().get_queryset()
        empresa_id = self.request.query_params.get('empresa_id')
        if empresa_id:
            queryset = queryset.filter(empresa_id=empresa_id)

        # Filtro por rango de fechas
        fecha_desde = self.request.query_params.get('fecha_desde')
        fecha_hasta = self.request.query_params.get('fecha_hasta')
        if fecha_desde:
            queryset = queryset.filter(fecha_medicion__gte=fecha_desde)
        if fecha_hasta:
            queryset = queryset.filter(fecha_medicion__lte=fecha_hasta)

        return queryset

    def perform_create(self, serializer):
        """Generar número de medición automático si no se proporciona"""
        if not serializer.validated_data.get('numero_medicion'):
            empresa_id = serializer.validated_data['empresa_id']
            ultimo_numero = MedicionAmbiental.objects.filter(
                empresa_id=empresa_id
            ).count() + 1
            numero = f"MED-{empresa_id}-{ultimo_numero:05d}"
            serializer.save(numero_medicion=numero)
        else:
            serializer.save()

    @action(detail=False, methods=['post'], url_path='registrar-medicion')
    def registrar_medicion(self, request):
        """
        Action para registrar una nueva medición ambiental
        """
        serializer = RegistrarMedicionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        data = serializer.validated_data
        empresa_id = request.data.get('empresa_id')

        # Obtener agente de riesgo para límite permisible
        agente = AgenteRiesgo.objects.get(id=data['agente_riesgo_id'])

        # Generar número de medición
        ultimo_numero = MedicionAmbiental.objects.filter(
            empresa_id=empresa_id
        ).count() + 1
        numero = f"MED-{empresa_id}-{ultimo_numero:05d}"

        # Crear medición
        medicion = MedicionAmbiental.objects.create(
            empresa_id=empresa_id,
            numero_medicion=numero,
            agente_riesgo_id=data['agente_riesgo_id'],
            punto_medicion_id=data['punto_medicion_id'],
            grupo_exposicion_id=data.get('grupo_exposicion_id'),
            fecha_medicion=data['fecha_medicion'],
            hora_inicio=data['hora_inicio'],
            hora_fin=data.get('hora_fin'),
            duracion_minutos=data.get('duracion_minutos'),
            valor_medido=data['valor_medido'],
            unidad_medida=data['unidad_medida'],
            limite_permisible_aplicable=agente.limite_permisible,
            temperatura_ambiente=data.get('temperatura_ambiente'),
            humedad_relativa=data.get('humedad_relativa'),
            presion_atmosferica=data.get('presion_atmosferica'),
            equipo_utilizado=data.get('equipo_utilizado', ''),
            numero_serie=data.get('numero_serie', ''),
            fecha_calibracion=data.get('fecha_calibracion'),
            realizado_por=data.get('realizado_por', ''),
            licencia_profesional=data.get('licencia_profesional', ''),
            observaciones=data.get('observaciones', ''),
            estado='COMPLETADA',
            created_by=request.user.username if hasattr(request.user, 'username') else ''
        )

        # El método save() del modelo evaluará automáticamente el cumplimiento
        result_serializer = MedicionAmbientalSerializer(medicion)
        return Response(result_serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], url_path='evaluar-cumplimiento')
    def evaluar_cumplimiento(self, request, pk=None):
        """
        Action para evaluar o re-evaluar el cumplimiento de una medición
        """
        medicion = self.get_object()
        serializer = EvaluarCumplimientoSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        data = serializer.validated_data

        # Si se proporciona un límite personalizado, usarlo
        if 'limite_permisible_aplicable' in data:
            medicion.limite_permisible_aplicable = data['limite_permisible_aplicable']

        # Re-evaluar cumplimiento
        medicion.evaluar_cumplimiento()
        medicion.save()

        result_serializer = MedicionAmbientalSerializer(medicion)
        return Response(result_serializer.data)

    @action(detail=False, methods=['get'])
    def estadisticas(self, request):
        """Obtener estadísticas de mediciones"""
        empresa_id = request.query_params.get('empresa_id')
        if not empresa_id:
            return Response(
                {'error': 'Se requiere empresa_id'},
                status=status.HTTP_400_BAD_REQUEST
            )

        mediciones = self.get_queryset().filter(empresa_id=empresa_id)

        total = mediciones.count()
        cumple = mediciones.filter(cumplimiento='CUMPLE').count()
        no_cumple = mediciones.filter(cumplimiento='NO_CUMPLE').count()
        pendientes = mediciones.filter(cumplimiento='PENDIENTE').count()

        porcentaje_cumplimiento = (cumple / total * 100) if total > 0 else 0

        # Agentes críticos (con más incumplimientos)
        agentes_criticos = mediciones.filter(
            cumplimiento='NO_CUMPLE'
        ).values(
            'agente_riesgo__nombre',
            'agente_riesgo__codigo'
        ).annotate(
            total_incumplimientos=Count('id')
        ).order_by('-total_incumplimientos')[:5]

        estadisticas = {
            'total_mediciones': total,
            'mediciones_cumple': cumple,
            'mediciones_no_cumple': no_cumple,
            'mediciones_pendientes': pendientes,
            'porcentaje_cumplimiento': round(porcentaje_cumplimiento, 2),
            'agentes_criticos': list(agentes_criticos)
        }

        serializer = EstadisticasMedicionesSerializer(estadisticas)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='no-conformes')
    def no_conformes(self, request):
        """Obtener mediciones que no cumplen con el límite"""
        empresa_id = request.query_params.get('empresa_id')
        if not empresa_id:
            return Response(
                {'error': 'Se requiere empresa_id'},
                status=status.HTTP_400_BAD_REQUEST
            )

        mediciones_nc = self.get_queryset().filter(
            empresa_id=empresa_id,
            cumplimiento='NO_CUMPLE'
        ).order_by('-porcentaje_limite')

        serializer = self.get_serializer(mediciones_nc, many=True)
        return Response(serializer.data)


class ControlExposicionViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión de Controles de Exposición
    """
    queryset = ControlExposicion.objects.select_related('agente_riesgo').prefetch_related(
        'grupos_exposicion',
        'puntos_medicion'
    ).all()
    permission_classes = [IsAuthenticated]
    filterset_fields = [
        'empresa_id', 'agente_riesgo', 'jerarquia_control',
        'tipo_control', 'estado', 'is_active'
    ]
    search_fields = ['codigo', 'nombre', 'descripcion', 'area_aplicacion']
    ordering_fields = ['codigo', 'nombre', 'jerarquia_control', 'efectividad_medida', 'created_at']
    ordering = ['jerarquia_control', 'nombre']

    def get_serializer_class(self):
        if self.action == 'list':
            return ControlExposicionListSerializer
        return ControlExposicionSerializer

    def get_queryset(self):
        """Filtrar por empresa_id"""
        queryset = super().get_queryset()
        empresa_id = self.request.query_params.get('empresa_id')
        if empresa_id:
            queryset = queryset.filter(empresa_id=empresa_id)
        return queryset

    @action(detail=False, methods=['get'])
    def estadisticas(self, request):
        """Obtener estadísticas de controles"""
        empresa_id = request.query_params.get('empresa_id')
        if not empresa_id:
            return Response(
                {'error': 'Se requiere empresa_id'},
                status=status.HTTP_400_BAD_REQUEST
            )

        controles = self.get_queryset().filter(empresa_id=empresa_id)

        total = controles.count()
        implementados = controles.filter(estado='IMPLEMENTADO').count()
        planificados = controles.filter(estado='PLANIFICADO').count()

        # Efectividad promedio de controles implementados
        efectividad_promedio = controles.filter(
            estado='IMPLEMENTADO',
            efectividad_medida__isnull=False
        ).aggregate(Avg('efectividad_medida'))['efectividad_medida__avg'] or 0

        # Distribución por jerarquía
        distribucion = {}
        for control in controles.values('jerarquia_control').annotate(total=Count('id')):
            jerarquia = control['jerarquia_control']
            distribucion[jerarquia] = control['total']

        estadisticas = {
            'total_controles': total,
            'controles_implementados': implementados,
            'controles_planificados': planificados,
            'efectividad_promedio': round(efectividad_promedio, 2),
            'distribucion_jerarquia': distribucion
        }

        serializer = EstadisticasControlesSerializer(estadisticas)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], url_path='registrar-efectividad')
    def registrar_efectividad(self, request, pk=None):
        """Registrar la efectividad medida de un control"""
        control = self.get_object()

        efectividad = request.data.get('efectividad_medida')
        fecha_medicion = request.data.get('fecha_medicion', timezone.now().date())

        if efectividad is None:
            return Response(
                {'error': 'Se requiere efectividad_medida'},
                status=status.HTTP_400_BAD_REQUEST
            )

        control.efectividad_medida = efectividad
        control.fecha_medicion_efectividad = fecha_medicion
        control.save()

        serializer = self.get_serializer(control)
        return Response(serializer.data)


class MonitoreoBiologicoViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión de Monitoreo Biológico
    """
    queryset = MonitoreoBiologico.objects.select_related('grupo_exposicion').prefetch_related(
        'agentes_riesgo'
    ).all()
    permission_classes = [IsAuthenticated]
    filterset_fields = [
        'empresa_id', 'grupo_exposicion', 'tipo_examen',
        'resultado', 'requiere_seguimiento', 'is_active'
    ]
    search_fields = [
        'numero_examen', 'trabajador_nombre', 'trabajador_identificacion',
        'trabajador_cargo', 'medico_responsable'
    ]
    ordering_fields = ['numero_examen', 'fecha_examen', 'trabajador_nombre', 'created_at']
    ordering = ['-fecha_examen']

    def get_serializer_class(self):
        if self.action == 'list':
            return MonitoreoBiologicoListSerializer
        return MonitoreoBiologicoSerializer

    def get_queryset(self):
        """Filtrar por empresa_id y parámetros adicionales"""
        queryset = super().get_queryset()
        empresa_id = self.request.query_params.get('empresa_id')
        if empresa_id:
            queryset = queryset.filter(empresa_id=empresa_id)

        # Filtro por trabajador
        trabajador_id = self.request.query_params.get('trabajador_identificacion')
        if trabajador_id:
            queryset = queryset.filter(trabajador_identificacion=trabajador_id)

        return queryset

    def perform_create(self, serializer):
        """Generar número de examen automático si no se proporciona"""
        if not serializer.validated_data.get('numero_examen'):
            empresa_id = serializer.validated_data['empresa_id']
            ultimo_numero = MonitoreoBiologico.objects.filter(
                empresa_id=empresa_id
            ).count() + 1
            numero = f"EXA-{empresa_id}-{ultimo_numero:05d}"
            serializer.save(numero_examen=numero)
        else:
            serializer.save()

    @action(detail=False, methods=['get'], url_path='por-trabajador')
    def por_trabajador(self, request):
        """Obtener historial de exámenes por trabajador"""
        trabajador_id = request.query_params.get('trabajador_identificacion')
        if not trabajador_id:
            return Response(
                {'error': 'Se requiere trabajador_identificacion'},
                status=status.HTTP_400_BAD_REQUEST
            )

        examenes = self.get_queryset().filter(
            trabajador_identificacion=trabajador_id
        ).order_by('-fecha_examen')

        serializer = self.get_serializer(examenes, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='seguimiento-pendiente')
    def seguimiento_pendiente(self, request):
        """Obtener exámenes que requieren seguimiento"""
        empresa_id = request.query_params.get('empresa_id')
        if not empresa_id:
            return Response(
                {'error': 'Se requiere empresa_id'},
                status=status.HTTP_400_BAD_REQUEST
            )

        examenes = self.get_queryset().filter(
            empresa_id=empresa_id,
            requiere_seguimiento=True,
            fecha_proximo_examen__isnull=False
        ).order_by('fecha_proximo_examen')

        serializer = self.get_serializer(examenes, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='no-aptos')
    def no_aptos(self, request):
        """Obtener exámenes con resultado no apto"""
        empresa_id = request.query_params.get('empresa_id')
        if not empresa_id:
            return Response(
                {'error': 'Se requiere empresa_id'},
                status=status.HTTP_400_BAD_REQUEST
            )

        examenes = self.get_queryset().filter(
            empresa_id=empresa_id,
            resultado='NO_APTO'
        ).order_by('-fecha_examen')

        serializer = self.get_serializer(examenes, many=True)
        return Response(serializer.data)
