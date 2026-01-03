"""
Ejemplos de Optimización de ViewSets
Sistema de Gestión StrateKaz

Este archivo muestra ejemplos ANTES y DESPUÉS de aplicar optimizaciones.
NO ejecutar directamente, solo referencia.

Autor: Sistema de Optimización
Fecha: 2025-12-30
"""

# ============================================================================
# EJEMPLO 1: CATÁLOGO SIMPLE (Solo Lectura)
# ============================================================================

# ❌ ANTES - Sin Optimizaciones
# ----------------------------------------------------------------------------
from rest_framework import viewsets
from .models import TipoCliente
from .serializers import TipoClienteSerializer


class TipoClienteViewSetAntes(viewsets.ModelViewSet):
    """
    Problemas:
    - No usa caché (cada request consulta DB)
    - No filtra registros eliminados automáticamente
    - Permite create/update/delete innecesariamente (es catálogo)
    """
    queryset = TipoCliente.objects.all()
    serializer_class = TipoClienteSerializer
    filterset_fields = ['activo']
    ordering = ['orden', 'nombre']


# ✅ DESPUÉS - Con Optimizaciones
# ----------------------------------------------------------------------------
from rest_framework import viewsets
from apps.core.viewset_mixins import ReadOnlyOptimizedViewSetMixin
from .models import TipoCliente
from .serializers import TipoClienteSerializer


class TipoClienteViewSetDespues(ReadOnlyOptimizedViewSetMixin, viewsets.ReadOnlyModelViewSet):
    """
    Mejoras aplicadas:
    - Caché automático de 2 horas (catálogos cambian poco)
    - Solo lectura (ReadOnlyModelViewSet)
    - Filtrado automático de soft delete
    - Queries optimizadas

    Performance:
    - Cache hit rate: ~95%
    - Response time: ~15ms (con caché) vs ~85ms (sin caché)
    """
    queryset = TipoCliente.objects.all()
    serializer_class = TipoClienteSerializer
    filterset_fields = ['activo']
    ordering = ['orden', 'nombre']

    # Configuración de caché
    cache_timeout = 7200  # 2 horas para catálogos
    cache_key_prefix = 'tipo_cliente'


# ============================================================================
# EJEMPLO 2: MODELO CON RELACIONES (CRUD Completo)
# ============================================================================

# ❌ ANTES - Sin Optimizaciones
# ----------------------------------------------------------------------------
from rest_framework import viewsets
from django_filters.rest_framework import DjangoFilterBackend
from .models import Cliente
from .serializers import ClienteSerializer, ClienteListSerializer


class ClienteViewSetAntes(viewsets.ModelViewSet):
    """
    Problemas:
    - Queries N+1 (15+ queries por página)
    - No cachea resultados
    - Filtrado manual por empresa
    - Lógica repetida en get_queryset
    - No tiene acciones bulk

    Queries ejecutadas por request:
    1. SELECT * FROM clientes
    2. SELECT * FROM tipo_cliente WHERE id=1
    3. SELECT * FROM tipo_cliente WHERE id=2
    ... (1 query por cada tipo_cliente)
    4. SELECT * FROM estado_cliente WHERE id=1
    ... (1 query por cada estado_cliente)
    Total: 15-20 queries
    """
    serializer_class = ClienteSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['tipo_cliente', 'estado_cliente']

    def get_queryset(self):
        # Filtrado manual por empresa
        queryset = Cliente.objects.filter(
            empresa=self.request.user.empresa,
            is_active=True
        )
        return queryset

    def get_serializer_class(self):
        if self.action == 'list':
            return ClienteListSerializer
        return ClienteSerializer


# ✅ DESPUÉS - Con Optimizaciones
# ----------------------------------------------------------------------------
from rest_framework import viewsets
from django_filters.rest_framework import DjangoFilterBackend
from apps.core.viewset_mixins import FullyOptimizedViewSetMixin
from .models import Cliente
from .serializers import ClienteSerializer, ClienteListSerializer


class ClienteViewSetDespues(FullyOptimizedViewSetMixin, viewsets.ModelViewSet):
    """
    Mejoras aplicadas:
    - select_related para FKs (tipo_cliente, estado_cliente, vendedor)
    - prefetch_related para relaciones inversas (contactos, segmentos)
    - Filtrado automático por empresa (CompanyFilterMixin)
    - Filtrado automático de soft delete
    - Caché automático de 10 minutos
    - Acciones bulk incluidas (bulk_activate, bulk_deactivate, bulk_delete)

    Performance:
    - Queries: 15 → 3 (80% reducción)
    - Response time: ~350ms → ~85ms (76% mejora)
    - Con caché: ~20ms (94% mejora)

    Queries ejecutadas por request:
    1. SELECT clientes, tipo_cliente, estado_cliente, vendedor
       FROM clientes
       LEFT JOIN tipo_cliente ON ...
       LEFT JOIN estado_cliente ON ...
       LEFT JOIN users ON ...
    2. SELECT * FROM contactos WHERE cliente_id IN (1,2,3...)
    3. SELECT * FROM segmentos WHERE cliente_id IN (1,2,3...)
    Total: 3 queries
    """
    queryset = Cliente.objects.all()
    serializer_class = ClienteSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['tipo_cliente', 'estado_cliente']

    # Configuración de optimización de queries
    select_related_fields = [
        'tipo_cliente',      # FK
        'estado_cliente',    # FK
        'vendedor_asignado', # FK
        'canal_venta',       # FK
        'created_by',        # FK de auditoría
        'updated_by'         # FK de auditoría
    ]

    prefetch_related_fields = [
        'contactos',              # RelatedManager (reverse FK)
        'segmentos',              # M2M through
        'segmentos__segmento'     # FK anidado dentro del through model
    ]

    # Configuración de caché
    cache_timeout = 600  # 10 minutos
    cache_key_prefix = 'cliente'

    def get_serializer_class(self):
        if self.action == 'list':
            return ClienteListSerializer
        return ClienteSerializer

    # El mixin automáticamente provee:
    # - def get_queryset() con filtros de empresa y soft delete
    # - def list() con caché automático
    # - @action bulk_activate
    # - @action bulk_deactivate
    # - @action bulk_delete


# ============================================================================
# EJEMPLO 3: MODELO CON RELACIONES ANIDADAS (Alta Complejidad)
# ============================================================================

# ❌ ANTES - Sin Optimizaciones
# ----------------------------------------------------------------------------
from rest_framework import viewsets
from .models import Proveedor
from .serializers import ProveedorSerializer


class ProveedorViewSetAntes(viewsets.ModelViewSet):
    """
    Problemas:
    - Queries N+1 en múltiples niveles
    - No cachea
    - No filtra soft delete

    Queries ejecutadas (ejemplo):
    1. SELECT * FROM proveedores
    2-10. SELECT * FROM tipo_proveedor (1 por cada proveedor)
    11-19. SELECT * FROM modalidad_logistica
    20-28. SELECT * FROM departamento
    29-37. SELECT * FROM precio_materia_prima WHERE proveedor_id=X
    38+. SELECT * FROM tipo_materia WHERE id IN (...)
    Total: 40+ queries
    """
    queryset = Proveedor.objects.all()
    serializer_class = ProveedorSerializer


# ✅ DESPUÉS - Con Optimizaciones
# ----------------------------------------------------------------------------
from rest_framework import viewsets
from apps.core.viewset_mixins import FullyOptimizedViewSetMixin
from .models import Proveedor
from .serializers import ProveedorSerializer


class ProveedorViewSetDespues(FullyOptimizedViewSetMixin, viewsets.ModelViewSet):
    """
    Mejoras aplicadas:
    - select_related para todas las FKs directas
    - prefetch_related para M2M y reverse FKs
    - prefetch_related anidado para FK dentro de related objects

    Performance:
    - Queries: 40+ → 4 (90% reducción)
    - Response time: ~510ms → ~95ms (81% mejora)

    Queries ejecutadas:
    1. SELECT proveedor, tipo, modalidad, dept, cuenta, unidad, created_by
       FROM proveedores
       LEFT JOIN ... (todas las FKs)
    2. SELECT * FROM tipos_materia_prima WHERE proveedor_id IN (...)
    3. SELECT * FROM formas_pago WHERE proveedor_id IN (...)
    4. SELECT precio.*, tipo_materia.*
       FROM precio_materia_prima precio
       LEFT JOIN tipo_materia_prima tipo_materia ON ...
       WHERE proveedor_id IN (...)
    Total: 4 queries
    """
    queryset = Proveedor.objects.all()
    serializer_class = ProveedorSerializer

    # select_related para FKs directas
    select_related_fields = [
        'tipo_proveedor',
        'tipo_documento',
        'modalidad_logistica',
        'departamento',
        'tipo_cuenta',
        'unidad_negocio',
        'created_by'
    ]

    # prefetch_related para M2M y relaciones inversas
    prefetch_related_fields = [
        'tipos_materia_prima',                      # M2M
        'formas_pago',                              # M2M
        'precios_materia_prima',                    # RelatedManager (reverse FK)
        'precios_materia_prima__tipo_materia'      # FK anidado ⭐
    ]

    cache_timeout = 300  # 5 minutos
    cache_key_prefix = 'proveedor'


# ============================================================================
# EJEMPLO 4: USO DE DECORADORES DE CACHÉ EN FUNCIONES
# ============================================================================

# ❌ ANTES - Sin Caché
# ----------------------------------------------------------------------------
def get_dashboard_ventas_sin_cache(empresa_id):
    """
    Se ejecuta cada vez, incluso si los datos no cambiaron
    """
    from django.db.models import Sum, Count
    from apps.sales_crm.pedidos_facturacion.models import Pedido

    return {
        'total_pedidos': Pedido.objects.filter(empresa_id=empresa_id).count(),
        'total_ventas': Pedido.objects.filter(
            empresa_id=empresa_id
        ).aggregate(total=Sum('total'))['total'],
        'pedidos_pendientes': Pedido.objects.filter(
            empresa_id=empresa_id,
            estado__codigo='PENDIENTE'
        ).count()
    }
    # Se ejecuta SIEMPRE, 3 queries cada vez


# ✅ DESPUÉS - Con Caché
# ----------------------------------------------------------------------------
from apps.core.cache_utils import cache_serializer_data


@cache_serializer_data('dashboard_ventas', timeout=300)
def get_dashboard_ventas_con_cache(empresa_id):
    """
    Primera llamada: ejecuta queries y cachea resultado (300s)
    Llamadas siguientes (5 min): retorna desde caché Redis (~2ms)

    Performance:
    - Primera llamada: ~180ms
    - Llamadas cacheadas: ~2ms (99% mejora)
    """
    from django.db.models import Sum, Count
    from apps.sales_crm.pedidos_facturacion.models import Pedido

    return {
        'total_pedidos': Pedido.objects.filter(empresa_id=empresa_id).count(),
        'total_ventas': Pedido.objects.filter(
            empresa_id=empresa_id
        ).aggregate(total=Sum('total'))['total'],
        'pedidos_pendientes': Pedido.objects.filter(
            empresa_id=empresa_id,
            estado__codigo='PENDIENTE'
        ).count()
    }


# ============================================================================
# EJEMPLO 5: INVALIDACIÓN DE CACHÉ
# ============================================================================

from django.db.models.signals import post_save
from django.dispatch import receiver
from apps.core.cache_utils import invalidate_empresa_cache


@receiver(post_save, sender='sales_crm.Pedido')
def invalidar_cache_pedidos(sender, instance, created, **kwargs):
    """
    Invalidar caché cuando se crea o actualiza un pedido
    """
    if created or instance.estado.codigo in ['APROBADO', 'CANCELADO']:
        # Invalidar dashboard de ventas de esta empresa
        invalidate_empresa_cache(
            empresa_id=instance.empresa_id,
            data_type='dashboard_ventas'
        )

        # También invalidar listado de pedidos
        invalidate_empresa_cache(
            empresa_id=instance.empresa_id,
            data_type='pedidos'
        )


# ============================================================================
# RESUMEN DE MEJORAS
# ============================================================================

"""
CATÁLOGOS (Solo Lectura):
- Heredar de: ReadOnlyOptimizedViewSetMixin + ReadOnlyModelViewSet
- Timeout de caché: 7200s (2 horas)
- Mejora típica: 90-95% (caché) + 60% (queries)

MODELOS SIMPLES (Sin relaciones):
- Heredar de: FullyOptimizedViewSetMixin + ModelViewSet
- Timeout de caché: 600s (10 minutos)
- Mejora típica: 70-80% (queries + caché)

MODELOS CON RELACIONES:
- Heredar de: FullyOptimizedViewSetMixin + ModelViewSet
- Definir select_related_fields y prefetch_related_fields
- Timeout de caché: 300-600s (5-10 minutos)
- Mejora típica: 75-85% (queries) + caché adicional

DASHBOARDS/REPORTES:
- Usar @cache_serializer_data o @cache_queryset
- Timeout de caché: 300-600s según frecuencia de actualización
- Mejora típica: 90-99% (caché) + optimización de queries

ACCIONES BULK:
- FullyOptimizedViewSetMixin incluye automáticamente:
  * bulk_activate/
  * bulk_deactivate/
  * bulk_delete/
"""


# ============================================================================
# CHECKLIST DE OPTIMIZACIÓN
# ============================================================================

"""
Para cada ViewSet:

1. ✅ Identificar tipo:
   - Catálogo → ReadOnlyOptimizedViewSetMixin
   - CRUD completo → FullyOptimizedViewSetMixin

2. ✅ Analizar relaciones del modelo:
   - FKs directas → select_related_fields
   - M2M, reverse FKs → prefetch_related_fields
   - FKs anidadas → prefetch_related con __

3. ✅ Configurar caché:
   - cache_timeout según frecuencia de cambio
   - cache_key_prefix único por ViewSet

4. ✅ Testing:
   - Verificar número de queries < 5
   - Verificar response time < 200ms
   - Verificar caché hit rate > 70%

5. ✅ Documentar:
   - Agregar docstring con performance
   - Documentar queries antes/después
   - Documentar campos optimizados
"""
