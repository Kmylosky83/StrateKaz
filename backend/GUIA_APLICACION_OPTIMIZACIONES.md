# Guía de Aplicación de Optimizaciones Backend

## Paso 1: Generar Migraciones para Índices

Los índices compuestos agregados en `BaseCompanyModel` necesitan ser aplicados a todas las tablas:

```bash
# Posicionarse en el directorio backend
cd "c:\Proyectos\Grasas y Huesos del Norte\backend"

# Generar migraciones automáticamente
python manage.py makemigrations

# Revisar las migraciones generadas
# Deberías ver migraciones para cada app que usa BaseCompanyModel
```

### Aplicar Migraciones

```bash
# En desarrollo (local)
python manage.py migrate

# En producción (recomendación)
# Ejecutar en horario de bajo tráfico
python manage.py migrate --database=default
```

**⚠️ IMPORTANTE:** La creación de índices en tablas grandes puede tomar varios minutos. Planificar ventana de mantenimiento.

---

## Paso 2: Verificar Instalación de django-redis

```bash
# Verificar si está instalado
pip list | grep django-redis

# Si no está instalado
pip install django-redis==5.4.0

# Agregar a requirements.txt
echo "django-redis==5.4.0" >> requirements.txt
```

---

## Paso 3: Aplicar Mixins a ViewSets Existentes

### Ejemplo 1: Catálogos (Solo Lectura)

```python
# ANTES
from rest_framework import viewsets
from .models import TipoCliente
from .serializers import TipoClienteSerializer

class TipoClienteViewSet(viewsets.ModelViewSet):
    queryset = TipoCliente.objects.filter(activo=True)
    serializer_class = TipoClienteSerializer
    filterset_fields = ['activo']
    ordering = ['orden', 'nombre']

# DESPUÉS
from rest_framework import viewsets
from apps.core.viewset_mixins import ReadOnlyOptimizedViewSetMixin
from .models import TipoCliente
from .serializers import TipoClienteSerializer

class TipoClienteViewSet(ReadOnlyOptimizedViewSetMixin, viewsets.ReadOnlyModelViewSet):
    queryset = TipoCliente.objects.all()
    serializer_class = TipoClienteSerializer
    filterset_fields = ['activo']
    ordering = ['orden', 'nombre']

    # Configuración de caché (catálogos tienen timeout largo)
    cache_timeout = 7200  # 2 horas
    cache_key_prefix = 'tipo_cliente'
```

### Ejemplo 2: ViewSets Completos (CRUD)

```python
# ANTES
from rest_framework import viewsets
from .models import Cliente
from .serializers import ClienteSerializer

class ClienteViewSet(viewsets.ModelViewSet):
    queryset = Cliente.objects.filter(is_active=True)
    serializer_class = ClienteSerializer
    filterset_fields = ['tipo_cliente', 'estado']

    def get_queryset(self):
        return Cliente.objects.filter(
            empresa=self.request.user.empresa,
            is_active=True
        )

# DESPUÉS
from rest_framework import viewsets
from apps.core.viewset_mixins import FullyOptimizedViewSetMixin
from .models import Cliente
from .serializers import ClienteSerializer

class ClienteViewSet(FullyOptimizedViewSetMixin, viewsets.ModelViewSet):
    queryset = Cliente.objects.all()
    serializer_class = ClienteSerializer
    filterset_fields = ['tipo_cliente', 'estado']

    # Configuración de optimización de queries
    select_related_fields = [
        'tipo_cliente',
        'estado_cliente',
        'vendedor_asignado',
        'created_by'
    ]
    prefetch_related_fields = [
        'contactos',
        'segmentos'
    ]

    # Configuración de caché
    cache_timeout = 600  # 10 minutos
    cache_key_prefix = 'cliente'

    # El mixin ya maneja:
    # - Filtrado por empresa automático
    # - Exclusión de registros eliminados
    # - Caché automático para list()
```

---

## Paso 4: Usar Decoradores de Caché en Funciones

```python
from apps.core.cache_utils import cache_catalogo, cache_serializer_data

# Para funciones que retornan QuerySets
@cache_catalogo('estados_pedido', timeout=3600)
def get_estados_pedido_activos():
    return EstadoPedido.objects.filter(activo=True).order_by('orden')

# Para funciones que retornan datos serializados
@cache_serializer_data('dashboard_ventas', timeout=300)
def get_dashboard_ventas_data(empresa_id):
    # Cálculos complejos
    return {
        'total_ventas': calcular_ventas(empresa_id),
        'pedidos_pendientes': contar_pendientes(empresa_id),
        # ...
    }
```

---

## Paso 5: Invalidar Caché Cuando Cambian Datos

```python
from apps.core.cache_utils import invalidate_cache, invalidate_empresa_cache

# En signals o métodos post_save
def after_save_cliente(sender, instance, created, **kwargs):
    # Invalidar caché específico de clientes de esta empresa
    invalidate_empresa_cache(instance.empresa_id, 'clientes')

# En ViewSets después de create/update/delete
def perform_create(self, serializer):
    instance = serializer.save()

    # Invalidar caché de catálogos si es necesario
    invalidate_cache('catalogo:tipo_cliente')
```

---

## Paso 6: Monitorear Rendimiento

### Instalar django-silk (opcional pero recomendado)

```bash
pip install django-silk
```

```python
# settings.py
INSTALLED_APPS = [
    # ...
    'silk',
]

MIDDLEWARE = [
    # ...
    'silk.middleware.SilkyMiddleware',
]

# urls.py
urlpatterns = [
    # ...
    path('silk/', include('silk.urls', namespace='silk')),
]
```

Acceder a: `http://localhost:8000/silk/`

### Verificar Caché Redis

```bash
# Conectar a Redis
redis-cli

# Verificar keys
KEYS grasas_huesos:*

# Ver info de memoria
INFO memory

# Ver estadísticas
INFO stats
```

---

## Paso 7: Testing de Optimizaciones

### Script de Test de Queries

```python
# test_performance.py
from django.test.utils import override_settings
from django.db import connection
from django.test import TestCase
from apps.sales_crm.gestion_clientes.models import Cliente

class QueryOptimizationTest(TestCase):
    def test_cliente_list_queries(self):
        """Verificar que listado de clientes no exceda 5 queries"""
        with self.assertNumQueries(5):  # Máximo 5 queries
            clientes = Cliente.objects.filter(
                is_active=True
            ).select_related(
                'tipo_cliente',
                'estado_cliente'
            ).prefetch_related('contactos')[:20]

            # Forzar evaluación
            list(clientes)
```

```bash
# Ejecutar tests
python manage.py test apps.sales_crm.gestion_clientes.tests.test_performance
```

---

## Paso 8: Documentar Cambios

Para cada ViewSet que optimices, documentar:

```python
class ClienteViewSet(FullyOptimizedViewSetMixin, viewsets.ModelViewSet):
    """
    ViewSet para gestión de clientes.

    Optimizaciones aplicadas (2025-12-30):
    - select_related: tipo_cliente, estado_cliente, vendedor_asignado
    - prefetch_related: contactos, segmentos
    - Caché: 10 minutos en list()
    - Índices DB: empresa + is_active + created_at

    Performance:
    - Queries: 15 → 3 (80% reducción)
    - Response time: ~350ms → ~85ms (76% mejora)
    """
```

---

## Checklist de Optimización

Para cada ViewSet nuevo o existente:

- [ ] Heredar de `FullyOptimizedViewSetMixin` o `ReadOnlyOptimizedViewSetMixin`
- [ ] Definir `select_related_fields` para todas las FKs usadas
- [ ] Definir `prefetch_related_fields` para M2M y reverse FKs
- [ ] Configurar `cache_timeout` apropiado
- [ ] Configurar `cache_key_prefix` único
- [ ] Agregar tests de número de queries
- [ ] Documentar optimizaciones en docstring
- [ ] Verificar con django-silk o debug toolbar

---

## Troubleshooting

### Problema: Migraciones no se generan

**Solución:**
```bash
# Forzar makemigrations en todas las apps
python manage.py makemigrations --empty nombre_app
```

### Problema: Redis no conecta

**Solución:**
```bash
# Verificar que Redis esté corriendo
redis-cli ping
# Debería responder: PONG

# Si no está corriendo (Windows)
# Descargar e instalar Redis desde:
# https://github.com/microsoftarchive/redis/releases
```

### Problema: Caché no se invalida

**Solución:**
```python
# Limpiar todo el caché manualmente
from django.core.cache import cache
cache.clear()

# O en Redis CLI
FLUSHDB
```

### Problema: Queries siguen siendo N+1

**Solución:**
- Verificar que los mixins estén ANTES de `viewsets.ModelViewSet`
- Verificar que `select_related_fields` y `prefetch_related_fields` estén correctos
- Usar django-debug-toolbar para inspeccionar queries

---

## Recomendaciones Adicionales

1. **Prioridad de Optimización:**
   - Primero: Endpoints más usados (dashboards, listados principales)
   - Segundo: Endpoints con más datos (reportes, exports)
   - Tercero: Resto de endpoints

2. **Timeout de Caché Sugeridos:**
   - Catálogos estáticos: 7200s (2 horas)
   - Listados normales: 600s (10 minutos)
   - Dashboards: 300s (5 minutos)
   - Datos en tiempo real: 60s (1 minuto)

3. **Monitoreo Continuo:**
   - Configurar alertas en Redis cuando uso de memoria > 80%
   - Revisar logs de queries lentas (> 1s)
   - Ejecutar tests de performance en CI/CD

---

**Última Actualización:** 2025-12-30
