"""
ViewSets para Riesgos de Procesos - ISO 31000
==============================================

ViewSets para gestión completa de riesgos según ISO 31000.
Todos los ViewSets usan StandardViewSetMixin para funcionalidad común.

Incluye:
- CategoriaRiesgoViewSet: Gestión de categorías de riesgo
- RiesgoProcesoViewSet: CRUD de riesgos con acciones especiales
- TratamientoRiesgoViewSet: Planes de tratamiento de riesgos
- ControlOperacionalViewSet: Controles operacionales
- OportunidadViewSet: Gestión de oportunidades

Autor: Sistema ERP StrateKaz
Fecha: 26 Diciembre 2025
"""
from typing import Dict, Any, List

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.db.models import Count, Q, Avg
from django.utils import timezone

from apps.core.mixins import StandardViewSetMixin
from .models import (
    CategoriaRiesgo,
    RiesgoProceso,
    TratamientoRiesgo,
    ControlOperacional,
    Oportunidad
)
from .serializers import (
    CategoriaRiesgoSerializer,
    RiesgoProcesoListSerializer,
    RiesgoProcesoDetailSerializer,
    RiesgoProcesoCreateSerializer,
    TratamientoRiesgoSerializer,
    ControlOperacionalSerializer,
    OportunidadSerializer
)


class CategoriaRiesgoViewSet(StandardViewSetMixin, viewsets.ModelViewSet):
    """
    ViewSet para gestión de categorías de riesgo.

    Catálogo global de tipos de riesgo según ISO 31000:
    Estratégico, Operativo, Financiero, Cumplimiento, etc.

    Endpoints:
        - GET /api/riesgos/categorias/ - Listar categorías
        - POST /api/riesgos/categorias/ - Crear categoría
        - GET /api/riesgos/categorias/{id}/ - Detalle categoría
        - PUT/PATCH /api/riesgos/categorias/{id}/ - Actualizar
        - DELETE /api/riesgos/categorias/{id}/ - Eliminar
        - POST /api/riesgos/categorias/{id}/toggle-active/ - Activar/Desactivar
        - POST /api/riesgos/categorias/reorder/ - Reordenar categorías
    """
    queryset = CategoriaRiesgo.objects.all()
    serializer_class = CategoriaRiesgoSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['is_active']
    search_fields = ['codigo', 'nombre', 'descripcion']
    ordering_fields = ['orden', 'codigo', 'nombre', 'created_at']
    ordering = ['orden', 'codigo']

    protected_relations = ['riesgos']
    custom_error_messages = {
        'riesgos': 'No se puede eliminar: tiene riesgos asociados'
    }

    @action(detail=False, methods=['post'])
    def reorder(self, request) -> Response:
        """
        Actualiza el orden de múltiples categorías.

        Body:
            {
                "orders": [
                    {"id": 1, "orden": 0},
                    {"id": 2, "orden": 1}
                ]
            }
        """
        orders = request.data.get('orders', [])
        if not orders:
            return Response(
                {'error': 'Debe proporcionar un array de órdenes'},
                status=status.HTTP_400_BAD_REQUEST
            )

        updated_count = 0
        for item in orders:
            item_id = item.get('id')
            new_order = item.get('orden')
            if item_id is not None and new_order is not None:
                CategoriaRiesgo.objects.filter(id=item_id).update(orden=new_order)
                updated_count += 1

        return Response({
            'updated': updated_count,
            'success': True,
            'message': f'{updated_count} categoría(s) reordenada(s)'
        })


class RiesgoProcesoViewSet(StandardViewSetMixin, viewsets.ModelViewSet):
    """
    ViewSet para gestión de riesgos de procesos.

    Gestión completa del ciclo de vida de riesgos según ISO 31000:
    identificación, evaluación inherente/residual, tratamiento y monitoreo.

    Endpoints:
        - GET /api/riesgos/riesgos/ - Listar riesgos
        - POST /api/riesgos/riesgos/ - Crear riesgo
        - GET /api/riesgos/riesgos/{id}/ - Detalle riesgo
        - PUT/PATCH /api/riesgos/riesgos/{id}/ - Actualizar
        - DELETE /api/riesgos/riesgos/{id}/ - Eliminar
        - POST /api/riesgos/riesgos/{id}/toggle-active/ - Activar/Desactivar
        - GET /api/riesgos/riesgos/resumen/ - Resumen estadístico
        - GET /api/riesgos/riesgos/criticos/ - Listar riesgos críticos
        - GET /api/riesgos/riesgos/mapa-calor/ - Generar mapa de calor
        - POST /api/riesgos/riesgos/{id}/cambiar-estado/ - Cambiar estado
    """
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = [
        'tipo', 'estado', 'categoria', 'responsable', 'proceso',
        'empresa', 'is_active'
    ]
    search_fields = ['codigo', 'nombre', 'descripcion', 'causa_raiz', 'consecuencia']
    ordering_fields = [
        'codigo', 'nombre', 'tipo', 'estado',
        'probabilidad_inherente', 'impacto_inherente',
        'probabilidad_residual', 'impacto_residual',
        'created_at', 'updated_at'
    ]
    ordering = ['-created_at']

    protected_relations = ['tratamientos', 'controles']
    custom_error_messages = {
        'tratamientos': 'No se puede eliminar: tiene tratamientos asociados',
        'controles': 'No se puede eliminar: tiene controles operacionales asociados'
    }

    def get_queryset(self):
        """
        QuerySet optimizado con prefetch.

        Tenant schema isolation handles empresa filtering automatically.
        """
        queryset = RiesgoProceso.objects.select_related(
            'categoria', 'responsable', 'empresa',
            'created_by', 'updated_by'
        ).prefetch_related(
            'tratamientos', 'controles'
        )

        return queryset

    def get_serializer_class(self):
        """
        Retorna el serializer apropiado según la acción.

        - list: Serializer simplificado para performance
        - retrieve: Serializer completo con todos los detalles
        - create/update: Serializer de creación con validaciones
        """
        if self.action == 'list':
            return RiesgoProcesoListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return RiesgoProcesoCreateSerializer
        return RiesgoProcesoDetailSerializer

    @action(detail=False, methods=['get'], url_path='resumen')
    def resumen(self, request) -> Response:
        """
        Resumen estadístico de riesgos.

        Retorna:
            - Total de riesgos
            - Conteo de riesgos críticos (nivel residual CRITICO)
            - Conteo en tratamiento
            - Distribución por nivel inherente
            - Distribución por nivel residual
            - Distribución por estado
            - Distribución por tipo
            - Distribución por categoría

        Query Params:
            - tipo: Filtrar por tipo de riesgo
            - estado: Filtrar por estado
            - categoria: Filtrar por categoría
        """
        queryset = self.filter_queryset(self.get_queryset())

        # Total
        total = queryset.count()

        # Calcular niveles para todos los riesgos
        criticos = 0
        riesgos_con_nivel = []
        for riesgo in queryset:
            interp_residual = riesgo.interpretacion_residual
            if interp_residual in ('CRITICO', 'ALTO'):
                criticos += 1
            riesgos_con_nivel.append({
                'id': riesgo.id,
                'interpretacion_inherente': riesgo.interpretacion_inherente,
                'interpretacion_residual': interp_residual,
                'tipo': riesgo.tipo,
                'estado': riesgo.estado,
                'categoria': riesgo.categoria.nombre if riesgo.categoria else None
            })

        # En tratamiento
        en_tratamiento = queryset.filter(
            estado=RiesgoProceso.EstadoRiesgo.EN_TRATAMIENTO
        ).count()

        # Contar por nivel inherente
        niveles_inherentes = {}
        for r in riesgos_con_nivel:
            nivel = r['interpretacion_inherente']
            niveles_inherentes[nivel] = niveles_inherentes.get(nivel, 0) + 1

        # Contar por nivel residual
        niveles_residuales = {}
        for r in riesgos_con_nivel:
            nivel = r['interpretacion_residual']
            niveles_residuales[nivel] = niveles_residuales.get(nivel, 0) + 1

        # Por estado
        por_estado = list(
            queryset.values('estado')
            .annotate(cantidad=Count('id'))
            .order_by('estado')
        )

        # Por tipo
        por_tipo = list(
            queryset.values('tipo')
            .annotate(cantidad=Count('id'))
            .order_by('-cantidad')
        )

        # Por categoría
        por_categoria = list(
            queryset.filter(categoria__isnull=False)
            .values('categoria__nombre', 'categoria__codigo')
            .annotate(cantidad=Count('id'))
            .order_by('-cantidad')
        )

        return Response({
            'total': total,
            'criticos': criticos,
            'en_tratamiento': en_tratamiento,
            'por_nivel_inherente': [
                {'nivel': k, 'cantidad': v}
                for k, v in niveles_inherentes.items()
            ],
            'por_nivel_residual': [
                {'nivel': k, 'cantidad': v}
                for k, v in niveles_residuales.items()
            ],
            'por_estado': por_estado,
            'por_tipo': por_tipo,
            'por_categoria': por_categoria,
        })

    @action(detail=False, methods=['get'], url_path='criticos')
    def criticos(self, request) -> Response:
        """
        Lista de riesgos críticos y altos.

        Retorna un array plano de riesgos con nivel residual CRITICO o ALTO.
        Útil para priorización y toma de decisiones.
        """
        queryset = self.get_queryset()

        # Filtrar riesgos críticos/altos manualmente
        riesgos_criticos = []
        for riesgo in queryset:
            if riesgo.interpretacion_residual in ['CRITICO', 'ALTO']:
                riesgos_criticos.append(riesgo)

        serializer = RiesgoProcesoListSerializer(riesgos_criticos, many=True)

        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='mapa-calor')
    def mapa_calor(self, request) -> Response:
        """
        Genera mapa de calor de riesgos como lista plana.

        Retorna un array de celdas con probabilidad, impacto, cantidad
        y lista de riesgos en esa celda.

        Query Params:
            - tipo_evaluacion: 'inherente' o 'residual' (default: 'residual')
            - tipo: Filtrar por tipo de riesgo
            - categoria: Filtrar por categoría

        Retorna:
            [
                {"probabilidad": 1-5, "impacto": 1-5, "cantidad": N,
                 "riesgos": [{"id": X, "nombre": "..."}]}
            ]
        """
        tipo_evaluacion = request.query_params.get('tipo_evaluacion', 'residual')
        queryset = self.filter_queryset(self.get_queryset())

        # Agrupar riesgos por celda (probabilidad, impacto)
        celdas: Dict[tuple, List[Dict[str, Any]]] = {}

        for riesgo in queryset:
            if tipo_evaluacion == 'inherente':
                prob = riesgo.probabilidad_inherente
                imp = riesgo.impacto_inherente
            else:
                prob = riesgo.probabilidad_residual
                imp = riesgo.impacto_residual

            if 1 <= prob <= 5 and 1 <= imp <= 5:
                key = (prob, imp)
                if key not in celdas:
                    celdas[key] = []
                celdas[key].append({
                    'id': riesgo.id,
                    'nombre': riesgo.nombre,
                })

        # Convertir a lista plana
        resultado = [
            {
                'probabilidad': prob,
                'impacto': imp,
                'cantidad': len(riesgos_lista),
                'riesgos': riesgos_lista,
            }
            for (prob, imp), riesgos_lista in celdas.items()
        ]

        return Response(resultado)

    @action(detail=True, methods=['post'], url_path='cambiar-estado')
    def cambiar_estado(self, request, pk=None) -> Response:
        """
        Cambia el estado del riesgo.

        Body:
            {
                "estado": "en_tratamiento",
                "observaciones": "Iniciando plan de tratamiento..."
            }

        Estados válidos:
            - identificado
            - en_analisis
            - en_tratamiento
            - monitoreado
            - cerrado
        """
        riesgo = self.get_object()
        nuevo_estado = request.data.get('estado')
        observaciones = request.data.get('observaciones', '')

        if not nuevo_estado:
            return Response(
                {'error': 'Debe proporcionar el nuevo estado'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validar estado
        estados_validos = [choice[0] for choice in RiesgoProceso.EstadoRiesgo.choices]
        if nuevo_estado not in estados_validos:
            return Response(
                {
                    'error': f'Estado inválido: {nuevo_estado}',
                    'estados_validos': estados_validos
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        estado_anterior = riesgo.estado
        riesgo.estado = nuevo_estado
        riesgo.save(update_fields=['estado', 'updated_at'])

        return Response({
            'success': True,
            'mensaje': f'Estado cambiado de {estado_anterior} a {nuevo_estado}',
            'riesgo': RiesgoProcesoDetailSerializer(riesgo).data
        })


class TratamientoRiesgoViewSet(StandardViewSetMixin, viewsets.ModelViewSet):
    """
    ViewSet para gestión de tratamientos de riesgo.

    Planes de tratamiento según ISO 31000:
    Evitar, Mitigar, Transferir, Aceptar.

    Endpoints:
        - GET /api/riesgos/tratamientos/ - Listar tratamientos
        - POST /api/riesgos/tratamientos/ - Crear tratamiento
        - GET /api/riesgos/tratamientos/{id}/ - Detalle tratamiento
        - PUT/PATCH /api/riesgos/tratamientos/{id}/ - Actualizar
        - DELETE /api/riesgos/tratamientos/{id}/ - Eliminar
        - POST /api/riesgos/tratamientos/{id}/actualizar-avance/ - Actualizar avance
    """
    queryset = TratamientoRiesgo.objects.select_related(
        'riesgo', 'responsable', 'empresa',
        'created_by', 'updated_by'
    )
    serializer_class = TratamientoRiesgoSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = [
        'riesgo', 'tipo', 'estado', 'responsable',
        'empresa', 'is_active'
    ]
    search_fields = ['descripcion', 'control_propuesto', 'riesgo__codigo', 'riesgo__nombre']
    ordering_fields = ['tipo', 'estado', 'fecha_implementacion', 'created_at']
    ordering = ['-created_at']

    @action(detail=True, methods=['post'], url_path='actualizar-avance')
    def actualizar_avance(self, request, pk=None) -> Response:
        """
        Actualiza el estado y efectividad del tratamiento.

        Body:
            {
                "estado": "completado",
                "efectividad": "Alta",
                "observaciones": "Implementado correctamente"
            }

        Estados válidos:
            - pendiente
            - en_curso
            - completado
            - cancelado
        """
        tratamiento = self.get_object()

        nuevo_estado = request.data.get('estado')
        efectividad = request.data.get('efectividad')
        observaciones = request.data.get('observaciones', '')

        # Validar estado si se proporciona
        if nuevo_estado:
            estados_validos = [choice[0] for choice in TratamientoRiesgo.EstadoTratamiento.choices]
            if nuevo_estado not in estados_validos:
                return Response(
                    {
                        'error': f'Estado inválido: {nuevo_estado}',
                        'estados_validos': estados_validos
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )
            tratamiento.estado = nuevo_estado

        # Actualizar efectividad
        if efectividad:
            tratamiento.efectividad = efectividad

        tratamiento.save(update_fields=['estado', 'efectividad', 'updated_at'])

        return Response({
            'success': True,
            'mensaje': 'Tratamiento actualizado correctamente',
            'tratamiento': TratamientoRiesgoSerializer(tratamiento).data
        })


class ControlOperacionalViewSet(StandardViewSetMixin, viewsets.ModelViewSet):
    """
    ViewSet para gestión de controles operacionales.

    Controles implementados para gestionar riesgos:
    Preventivos, Detectivos, Correctivos.

    Endpoints:
        - GET /api/riesgos/controles/ - Listar controles
        - POST /api/riesgos/controles/ - Crear control
        - GET /api/riesgos/controles/{id}/ - Detalle control
        - PUT/PATCH /api/riesgos/controles/{id}/ - Actualizar
        - DELETE /api/riesgos/controles/{id}/ - Eliminar
    """
    queryset = ControlOperacional.objects.select_related(
        'riesgo', 'responsable', 'empresa',
        'created_by', 'updated_by'
    )
    serializer_class = ControlOperacionalSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = [
        'riesgo', 'tipo_control', 'responsable',
        'efectividad', 'empresa', 'is_active'
    ]
    search_fields = ['nombre', 'descripcion', 'documentacion', 'riesgo__codigo']
    ordering_fields = ['tipo_control', 'frecuencia', 'fecha_ultima_evaluacion', 'created_at']
    ordering = ['-created_at']


class OportunidadViewSet(StandardViewSetMixin, viewsets.ModelViewSet):
    """
    ViewSet para gestión de oportunidades.

    Gestiona el lado positivo del riesgo según ISO 31000:
    eventos que pueden generar valor o beneficio.

    Endpoints:
        - GET /api/riesgos/oportunidades/ - Listar oportunidades
        - POST /api/riesgos/oportunidades/ - Crear oportunidad
        - GET /api/riesgos/oportunidades/{id}/ - Detalle oportunidad
        - PUT/PATCH /api/riesgos/oportunidades/{id}/ - Actualizar
        - DELETE /api/riesgos/oportunidades/{id}/ - Eliminar
        - POST /api/riesgos/oportunidades/{id}/cambiar-estado/ - Cambiar estado
    """
    queryset = Oportunidad.objects.select_related(
        'responsable', 'empresa',
        'created_by', 'updated_by'
    )
    serializer_class = OportunidadSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = [
        'estado', 'fuente', 'impacto_potencial',
        'viabilidad', 'responsable', 'empresa', 'is_active'
    ]
    search_fields = ['codigo', 'nombre', 'descripcion', 'recursos_requeridos']
    ordering_fields = [
        'codigo', 'estado', 'impacto_potencial',
        'viabilidad', 'created_at'
    ]
    ordering = ['-created_at']

    @action(detail=True, methods=['post'], url_path='cambiar-estado')
    def cambiar_estado(self, request, pk=None) -> Response:
        """
        Cambia el estado de la oportunidad.

        Body:
            {
                "estado": "en_ejecucion",
                "observaciones": "Iniciando implementación..."
            }

        Estados válidos:
            - identificada
            - en_evaluacion
            - aprobada
            - en_ejecucion
            - materializada
            - descartada
        """
        oportunidad = self.get_object()
        nuevo_estado = request.data.get('estado')
        observaciones = request.data.get('observaciones', '')

        if not nuevo_estado:
            return Response(
                {'error': 'Debe proporcionar el nuevo estado'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validar estado
        estados_validos = [choice[0] for choice in Oportunidad.EstadoOportunidad.choices]
        if nuevo_estado not in estados_validos:
            return Response(
                {
                    'error': f'Estado inválido: {nuevo_estado}',
                    'estados_validos': estados_validos
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        estado_anterior = oportunidad.estado
        oportunidad.estado = nuevo_estado
        oportunidad.save(update_fields=['estado', 'updated_at'])

        return Response({
            'success': True,
            'mensaje': f'Estado cambiado de {estado_anterior} a {nuevo_estado}',
            'oportunidad': OportunidadSerializer(oportunidad).data
        })
