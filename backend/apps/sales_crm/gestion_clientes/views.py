"""
Views para Gestión de Clientes - Sales CRM
Sistema de Gestión StrateKaz

ViewSets para la gestión de clientes, contactos, segmentos,
interacciones y scoring de clientes.

Autor: Sistema de Gestión
Fecha: 2025-12-28
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.db.models import Q, Count, Sum, Avg, F, DecimalField
from django.db.models.functions import Coalesce
from django.utils import timezone
from datetime import timedelta
from drf_spectacular.utils import extend_schema, extend_schema_view, OpenApiParameter
from drf_spectacular.types import OpenApiTypes

from apps.core.base_models.mixins import get_tenant_empresa

from .models import (
    TipoCliente, EstadoCliente, CanalVenta, Cliente,
    ContactoCliente, SegmentoCliente, ClienteSegmento,
    InteraccionCliente, ScoringCliente
)
from .serializers import (
    TipoClienteSerializer, EstadoClienteSerializer, CanalVentaSerializer,
    ClienteListSerializer, ClienteSerializer, ContactoClienteSerializer,
    SegmentoClienteSerializer, ClienteSegmentoSerializer,
    InteraccionClienteListSerializer, InteraccionClienteSerializer,
    ScoringClienteSerializer, ActualizarScoringSerializer,
    AsignarSegmentoSerializer
)


# ==============================================================================
# VIEWSETS PARA CATÁLOGOS
# ==============================================================================

class TipoClienteViewSet(viewsets.ModelViewSet):
    """
    ViewSet para tipos de cliente.

    list: Listar todos los tipos de cliente activos
    retrieve: Obtener detalle de un tipo de cliente
    create: Crear nuevo tipo de cliente
    update: Actualizar tipo de cliente
    partial_update: Actualizar parcialmente tipo de cliente
    destroy: Eliminar tipo de cliente (soft delete)
    """
    serializer_class = TipoClienteSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['activo']
    search_fields = ['codigo', 'nombre', 'descripcion']
    ordering_fields = ['orden', 'nombre', 'created_at']
    ordering = ['orden', 'nombre']

    def get_queryset(self):
        """Filtrar por empresa del usuario."""
        # Los catálogos no tienen empresa, son globales
        queryset = TipoCliente.objects.filter(activo=True)
        return queryset


class EstadoClienteViewSet(viewsets.ModelViewSet):
    """
    ViewSet para estados de cliente.

    list: Listar todos los estados activos
    retrieve: Obtener detalle de un estado
    create: Crear nuevo estado
    update: Actualizar estado
    partial_update: Actualizar parcialmente estado
    destroy: Eliminar estado (soft delete)
    """
    serializer_class = EstadoClienteSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['activo', 'permite_ventas', 'requiere_aprobacion']
    search_fields = ['codigo', 'nombre', 'descripcion']
    ordering_fields = ['orden', 'nombre', 'created_at']
    ordering = ['orden', 'nombre']

    def get_queryset(self):
        """Filtrar estados activos."""
        queryset = EstadoCliente.objects.filter(activo=True)
        return queryset


class CanalVentaViewSet(viewsets.ModelViewSet):
    """
    ViewSet para canales de venta.

    list: Listar todos los canales activos
    retrieve: Obtener detalle de un canal
    create: Crear nuevo canal
    update: Actualizar canal
    partial_update: Actualizar parcialmente canal
    destroy: Eliminar canal (soft delete)
    """
    serializer_class = CanalVentaSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['activo', 'aplica_comision']
    search_fields = ['codigo', 'nombre', 'descripcion']
    ordering_fields = ['orden', 'nombre', 'created_at']
    ordering = ['orden', 'nombre']

    def get_queryset(self):
        """Filtrar canales activos."""
        queryset = CanalVenta.objects.filter(activo=True)
        return queryset


# ==============================================================================
# VIEWSETS PRINCIPALES - CLIENTES
# ==============================================================================

@extend_schema_view(
    list=extend_schema(
        summary='Listar clientes',
        description='Obtiene el listado de clientes con paginación, filtros y búsqueda avanzada',
        tags=['Sales CRM']
    ),
    retrieve=extend_schema(
        summary='Obtener detalle de cliente',
        description='Obtiene el detalle completo de un cliente incluyendo contactos, scoring y segmentos',
        tags=['Sales CRM']
    ),
    create=extend_schema(
        summary='Crear nuevo cliente',
        description='Registra un nuevo cliente en el sistema',
        tags=['Sales CRM']
    ),
    update=extend_schema(
        summary='Actualizar cliente',
        description='Actualiza completamente la información de un cliente',
        tags=['Sales CRM']
    ),
    partial_update=extend_schema(
        summary='Actualizar parcialmente cliente',
        description='Actualiza campos específicos de un cliente',
        tags=['Sales CRM']
    ),
    destroy=extend_schema(
        summary='Eliminar cliente',
        description='Elimina un cliente del sistema (soft delete)',
        tags=['Sales CRM']
    )
)
class ClienteViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión completa de clientes

    Permite administrar el portafolio de clientes del sistema, incluyendo:
    - Información de contacto y documentación
    - Asignación de vendedores y canales de venta
    - Segmentación de clientes
    - Scoring y análisis de comportamiento
    - Historial de compras y métricas
    - Dashboard con indicadores clave

    Filtros disponibles:
    - tipo_cliente: Tipo de cliente (PERSONA_NATURAL, JURIDICA, etc.)
    - estado_cliente: Estado actual del cliente
    - canal_venta: Canal de venta asignado
    - vendedor_asignado: Vendedor responsable
    - ciudad, departamento: Ubicación geográfica
    - sin_compras: Clientes que no han comprado (true/false)
    - dias_inactividad: Días sin comprar (número)
    """
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = [
        'tipo_cliente', 'estado_cliente', 'canal_venta',
        'vendedor_asignado', 'is_active', 'ciudad', 'departamento'
    ]
    search_fields = [
        'codigo_cliente', 'numero_documento', 'razon_social',
        'nombre_comercial', 'email', 'telefono'
    ]
    ordering_fields = [
        'codigo_cliente', 'razon_social', 'created_at',
        'ultima_compra', 'total_compras_acumulado', 'cantidad_pedidos'
    ]
    ordering = ['-created_at']

    def get_queryset(self):
        """
        Filtrar clientes por tenant (schema isolation).
        Optimizado con select_related y prefetch_related.
        """
        queryset = Cliente.objects.select_related(
            'tipo_cliente',
            'estado_cliente',
            'canal_venta',
            'vendedor_asignado',
            'created_by',
            'updated_by'
        ).prefetch_related(
            'contactos',
            'segmentos__segmento'
        )

        # Filtros adicionales por query params
        tipo_cliente = self.request.query_params.get('tipo_cliente', None)
        if tipo_cliente:
            queryset = queryset.filter(tipo_cliente_id=tipo_cliente)

        estado_cliente = self.request.query_params.get('estado_cliente', None)
        if estado_cliente:
            queryset = queryset.filter(estado_cliente_id=estado_cliente)

        vendedor = self.request.query_params.get('vendedor_asignado', None)
        if vendedor:
            queryset = queryset.filter(vendedor_asignado_id=vendedor)

        # Filtrar clientes sin compras
        sin_compras = self.request.query_params.get('sin_compras', None)
        if sin_compras == 'true':
            queryset = queryset.filter(cantidad_pedidos=0)

        # Filtrar clientes inactivos (sin compras recientes)
        dias_inactividad = self.request.query_params.get('dias_inactividad', None)
        if dias_inactividad:
            fecha_limite = timezone.now().date() - timedelta(days=int(dias_inactividad))
            queryset = queryset.filter(
                Q(ultima_compra__lt=fecha_limite) | Q(ultima_compra__isnull=True)
            )

        return queryset

    def get_serializer_class(self):
        """Usar serializer según la acción."""
        if self.action == 'list':
            return ClienteListSerializer
        return ClienteSerializer

    def perform_create(self, serializer):
        """Asignar empresa al crear cliente."""
        serializer.save(
            empresa=get_tenant_empresa(),
            created_by=self.request.user
        )

    def perform_update(self, serializer):
        """Actualizar usuario de modificación."""
        serializer.save(updated_by=self.request.user)

    @extend_schema(
        summary='Actualizar scoring del cliente',
        description='Recalcula el scoring del cliente basado en su comportamiento de compras y actividad',
        tags=['Sales CRM']
    )
    @action(detail=True, methods=['post'])
    def actualizar_scoring(self, request, pk=None):
        """
        Recalcular el scoring del cliente.

        POST /api/sales-crm/clientes/{id}/actualizar_scoring/
        """
        cliente = self.get_object()

        # Actualizar scoring
        cliente.actualizar_scoring()

        # Obtener scoring actualizado
        scoring = ScoringCliente.objects.get(cliente=cliente)
        serializer = ScoringClienteSerializer(scoring)

        return Response({
            'message': 'Scoring actualizado correctamente',
            'scoring': serializer.data
        })

    @extend_schema(
        summary='Obtener historial de compras',
        description='Retorna el historial completo de compras del cliente con métricas y estadísticas',
        tags=['Sales CRM']
    )
    @action(detail=True, methods=['get'])
    def historial_compras(self, request, pk=None):
        """
        Obtener historial de compras del cliente.

        GET /api/sales-crm/clientes/{id}/historial_compras/
        """
        cliente = self.get_object()

        # TODO: Implementar cuando exista el modelo de Pedidos
        historial = cliente.get_historial_compras()

        return Response({
            'cliente': cliente.razon_social,
            'total_compras': cliente.total_compras_acumulado,
            'cantidad_pedidos': cliente.cantidad_pedidos,
            'ticket_promedio': cliente.ticket_promedio,
            'primera_compra': cliente.fecha_primera_compra,
            'ultima_compra': cliente.ultima_compra,
            'dias_sin_comprar': cliente.dias_sin_comprar,
            'historial': historial
        })

    @extend_schema(
        summary='Dashboard de clientes',
        description='''
        Retorna un dashboard completo con métricas de clientes:
        - Total de clientes y clientes activos
        - Distribución por estado y tipo
        - Clientes por vendedor
        - Top 10 clientes por compras
        - Métricas de scoring
        - Clientes sin compras e inactivos
        ''',
        tags=['Sales CRM']
    )
    @action(detail=False, methods=['get'])
    def dashboard(self, request):
        """
        Dashboard con métricas de clientes.

        GET /api/sales-crm/clientes/dashboard/

        Retorna:
        - Total de clientes
        - Clientes por estado
        - Clientes por tipo
        - Clientes por vendedor
        - Top 10 clientes por compras
        - Métricas de scoring
        """
        queryset = self.get_queryset()

        # Total de clientes
        total_clientes = queryset.count()
        clientes_activos = queryset.filter(is_active=True).count()

        # Clientes por estado
        por_estado = list(queryset.values(
            'estado_cliente__codigo',
            'estado_cliente__nombre',
            'estado_cliente__color'
        ).annotate(
            cantidad=Count('id')
        ).order_by('-cantidad'))

        # Clientes por tipo
        por_tipo = list(queryset.values(
            'tipo_cliente__codigo',
            'tipo_cliente__nombre'
        ).annotate(
            cantidad=Count('id')
        ).order_by('-cantidad'))

        # Clientes por vendedor
        por_vendedor = list(queryset.filter(
            vendedor_asignado__isnull=False
        ).values(
            'vendedor_asignado__id',
            'vendedor_asignado__first_name',
            'vendedor_asignado__last_name'
        ).annotate(
            cantidad=Count('id'),
            ventas_totales=Sum('total_compras_acumulado')
        ).order_by('-ventas_totales')[:10])

        # Top 10 clientes por compras
        top_clientes = list(queryset.order_by('-total_compras_acumulado')[:10].values(
            'id',
            'codigo_cliente',
            'razon_social',
            'total_compras_acumulado',
            'cantidad_pedidos'
        ))

        # Métricas de scoring
        scorings = ScoringCliente.objects.aggregate(
            promedio_scoring=Avg('puntuacion_total'),
            clientes_excelentes=Count('id', filter=Q(puntuacion_total__gte=80)),
            clientes_buenos=Count('id', filter=Q(puntuacion_total__gte=60, puntuacion_total__lt=80)),
            clientes_regulares=Count('id', filter=Q(puntuacion_total__gte=40, puntuacion_total__lt=60)),
            clientes_bajos=Count('id', filter=Q(puntuacion_total__lt=40))
        )

        # Clientes sin compras
        sin_compras = queryset.filter(cantidad_pedidos=0).count()

        # Clientes inactivos (>90 días sin comprar)
        fecha_limite = timezone.now().date() - timedelta(days=90)
        inactivos = queryset.filter(
            Q(ultima_compra__lt=fecha_limite) | Q(ultima_compra__isnull=True)
        ).exclude(cantidad_pedidos=0).count()

        return Response({
            'resumen': {
                'total_clientes': total_clientes,
                'clientes_activos': clientes_activos,
                'sin_compras': sin_compras,
                'inactivos_90_dias': inactivos
            },
            'por_estado': por_estado,
            'por_tipo': por_tipo,
            'por_vendedor': por_vendedor,
            'top_clientes': top_clientes,
            'scoring': scorings
        })


# ==============================================================================
# VIEWSETS DE CONTACTOS
# ==============================================================================

class ContactoClienteViewSet(viewsets.ModelViewSet):
    """
    ViewSet para contactos de clientes.

    list: Listar contactos
    retrieve: Obtener detalle de un contacto
    create: Crear nuevo contacto
    update: Actualizar contacto
    partial_update: Actualizar parcialmente contacto
    destroy: Eliminar contacto (soft delete)
    """
    serializer_class = ContactoClienteSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['cliente', 'es_principal', 'is_active']
    search_fields = ['nombre_completo', 'cargo', 'email', 'telefono']
    ordering_fields = ['nombre_completo', 'created_at']
    ordering = ['-es_principal', 'nombre_completo']

    def get_queryset(self):
        """Filtrar contactos por tenant (schema isolation)."""
        queryset = ContactoCliente.objects.select_related('cliente').all()

        # Filtrar por cliente si se especifica
        cliente_id = self.request.query_params.get('cliente', None)
        if cliente_id:
            queryset = queryset.filter(cliente_id=cliente_id)

        return queryset

    def perform_create(self, serializer):
        """Asignar empresa al crear contacto."""
        serializer.save(
            empresa=get_tenant_empresa(),
            created_by=self.request.user
        )

    def perform_update(self, serializer):
        """Actualizar usuario de modificación."""
        serializer.save(updated_by=self.request.user)


# ==============================================================================
# VIEWSETS DE SEGMENTACIÓN
# ==============================================================================

class SegmentoClienteViewSet(viewsets.ModelViewSet):
    """
    ViewSet para segmentos de clientes.

    list: Listar segmentos
    retrieve: Obtener detalle de un segmento
    create: Crear nuevo segmento
    update: Actualizar segmento
    partial_update: Actualizar parcialmente segmento
    destroy: Eliminar segmento (soft delete)
    """
    serializer_class = SegmentoClienteSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['is_active']
    search_fields = ['codigo', 'nombre', 'descripcion']
    ordering_fields = ['nombre', 'created_at']
    ordering = ['nombre']

    def get_queryset(self):
        """Filtrar segmentos por tenant (schema isolation)."""
        return SegmentoCliente.objects.prefetch_related('clientes').all()

    def perform_create(self, serializer):
        """Asignar empresa al crear segmento."""
        serializer.save(
            empresa=get_tenant_empresa(),
            created_by=self.request.user
        )

    def perform_update(self, serializer):
        """Actualizar usuario de modificación."""
        serializer.save(updated_by=self.request.user)


class ClienteSegmentoViewSet(viewsets.ModelViewSet):
    """
    ViewSet para asignaciones cliente-segmento.

    list: Listar asignaciones
    retrieve: Obtener detalle de una asignación
    create: Crear nueva asignación
    update: Actualizar asignación
    partial_update: Actualizar parcialmente asignación
    destroy: Eliminar asignación (soft delete)
    """
    serializer_class = ClienteSegmentoSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['cliente', 'segmento', 'is_active']
    search_fields = ['cliente__razon_social', 'segmento__nombre']
    ordering_fields = ['fecha_asignacion']
    ordering = ['-fecha_asignacion']

    def get_queryset(self):
        """Filtrar asignaciones por tenant (schema isolation)."""
        return ClienteSegmento.objects.select_related(
            'cliente', 'segmento', 'asignado_por'
        ).all()

    def perform_create(self, serializer):
        """Asignar empresa y usuario al crear asignación."""
        serializer.save(
            empresa=get_tenant_empresa(),
            asignado_por=self.request.user,
            created_by=self.request.user
        )

    def perform_update(self, serializer):
        """Actualizar usuario de modificación."""
        serializer.save(updated_by=self.request.user)


# ==============================================================================
# VIEWSETS DE INTERACCIONES
# ==============================================================================

class InteraccionClienteViewSet(viewsets.ModelViewSet):
    """
    ViewSet para interacciones con clientes.

    list: Listar interacciones
    retrieve: Obtener detalle de una interacción
    create: Registrar nueva interacción
    update: Actualizar interacción
    partial_update: Actualizar parcialmente interacción
    destroy: Eliminar interacción (soft delete)

    Acciones adicionales:
    - proximas_acciones: Listar seguimientos pendientes
    """
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = [
        'cliente', 'tipo_interaccion', 'registrado_por', 'is_active'
    ]
    search_fields = ['descripcion', 'resultado', 'cliente__razon_social']
    ordering_fields = ['fecha', 'fecha_proxima_accion', 'created_at']
    ordering = ['-fecha']

    def get_queryset(self):
        """Filtrar interacciones por tenant (schema isolation)."""
        queryset = InteraccionCliente.objects.select_related(
            'cliente', 'registrado_por', 'created_by'
        )

        # Filtros adicionales
        cliente_id = self.request.query_params.get('cliente', None)
        if cliente_id:
            queryset = queryset.filter(cliente_id=cliente_id)

        tipo = self.request.query_params.get('tipo_interaccion', None)
        if tipo:
            queryset = queryset.filter(tipo_interaccion=tipo)

        # Filtrar solo con próximas acciones
        con_seguimiento = self.request.query_params.get('con_seguimiento', None)
        if con_seguimiento == 'true':
            queryset = queryset.filter(
                fecha_proxima_accion__isnull=False,
                fecha_proxima_accion__gte=timezone.now().date()
            )

        return queryset

    def get_serializer_class(self):
        """Usar serializer según la acción."""
        if self.action == 'list':
            return InteraccionClienteListSerializer
        return InteraccionClienteSerializer

    def perform_create(self, serializer):
        """Asignar empresa y usuario al crear interacción."""
        serializer.save(
            empresa=get_tenant_empresa(),
            registrado_por=self.request.user,
            created_by=self.request.user
        )

    def perform_update(self, serializer):
        """Actualizar usuario de modificación."""
        serializer.save(updated_by=self.request.user)

    @action(detail=False, methods=['get'])
    def proximas_acciones(self, request):
        """
        Listar seguimientos pendientes.

        GET /api/sales-crm/interacciones/proximas_acciones/

        Retorna interacciones con próxima acción programada.
        """
        # Obtener interacciones con seguimiento pendiente
        hoy = timezone.now().date()
        proximos_7_dias = hoy + timedelta(days=7)

        pendientes = InteraccionCliente.objects.filter(
            is_active=True,
            fecha_proxima_accion__isnull=False,
            fecha_proxima_accion__gte=hoy
        ).select_related('cliente', 'registrado_por').order_by('fecha_proxima_accion')

        # Agrupar por período
        hoy_list = list(pendientes.filter(fecha_proxima_accion=hoy).values(
            'id', 'cliente__razon_social', 'tipo_interaccion',
            'proxima_accion', 'fecha_proxima_accion', 'registrado_por__first_name'
        ))

        proximos_dias = list(pendientes.filter(
            fecha_proxima_accion__gt=hoy,
            fecha_proxima_accion__lte=proximos_7_dias
        ).values(
            'id', 'cliente__razon_social', 'tipo_interaccion',
            'proxima_accion', 'fecha_proxima_accion', 'registrado_por__first_name'
        ))

        futuras = list(pendientes.filter(
            fecha_proxima_accion__gt=proximos_7_dias
        ).values(
            'id', 'cliente__razon_social', 'tipo_interaccion',
            'proxima_accion', 'fecha_proxima_accion', 'registrado_por__first_name'
        ))

        return Response({
            'hoy': hoy_list,
            'proximos_7_dias': proximos_dias,
            'futuras': futuras,
            'total_pendientes': pendientes.count()
        })


# ==============================================================================
# VIEWSETS DE SCORING
# ==============================================================================

class ScoringClienteViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet para scoring de clientes (solo lectura).

    list: Listar scorings
    retrieve: Obtener detalle de un scoring

    El scoring se calcula automáticamente, no se puede crear o modificar manualmente.
    """
    serializer_class = ScoringClienteSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['cliente']
    ordering_fields = ['puntuacion_total', 'ultima_actualizacion']
    ordering = ['-puntuacion_total']

    def get_queryset(self):
        """Filtrar scorings por tenant (schema isolation)."""
        queryset = ScoringCliente.objects.select_related('cliente').all()

        # Filtrar por nivel de scoring
        nivel = self.request.query_params.get('nivel', None)
        if nivel == 'EXCELENTE':
            queryset = queryset.filter(puntuacion_total__gte=80)
        elif nivel == 'BUENO':
            queryset = queryset.filter(puntuacion_total__gte=60, puntuacion_total__lt=80)
        elif nivel == 'REGULAR':
            queryset = queryset.filter(puntuacion_total__gte=40, puntuacion_total__lt=60)
        elif nivel == 'BAJO':
            queryset = queryset.filter(puntuacion_total__lt=40)

        return queryset
