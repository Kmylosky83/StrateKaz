# Plan de Migración: Consecutivos y UnidadesMedida → Organizacion

## Estado: ✅ COMPLETADO

**Fecha de Finalización:** 2026-01-19
**Commit:** `refactor(organizacion): Migrate ConsecutivoConfig and UnidadMedida from configuracion`

---

## Resumen Ejecutivo

**Objetivo:** Migrar `ConsecutivoConfig` y `UnidadMedida` desde `gestion_estrategica/configuracion` hacia `gestion_estrategica/organizacion`.

**Justificación de Negocio:**
- En `organizacion` se configuran las personas (Areas, Cargos)
- Los documentos y sus consecutivos son parte de la estructura organizacional
- Las unidades de medida son catálogos transversales de la organización
- Mantiene coherencia arquitectónica: organización = gente + documentos + medidas

**Resultado Final:**

- Modelos migrados exitosamente manteniendo `db_table` original (sin migraciones de BD)
- URLs actualizadas: `/api/strategic/organizacion/consecutivos/` y `/api/strategic/organizacion/unidades-medida/`
- Frontend actualizado para usar nuevas URLs
- Secciones movidas de ConfiguracionTab a OrganizacionTab

---

## Arquitectura Propuesta

```
gestion_estrategica/organizacion/
├── models.py                    # Area (existente)
├── models_consecutivos.py       # ConsecutivoConfig (migrar)
├── models_unidades.py           # UnidadMedida (migrar)
├── serializers.py               # Area serializers (existente)
├── serializers_consecutivos.py  # Consecutivo serializers (migrar)
├── serializers_unidades.py      # UnidadMedida serializers (migrar)
├── views.py                     # AreaViewSet, OrganigramaView (existente)
├── viewsets_consecutivos.py     # ConsecutivoConfigViewSet (migrar)
├── viewsets_unidades.py         # UnidadMedidaViewSet (migrar)
├── urls.py                      # Actualizar con nuevos routers
└── admin.py                     # Registrar nuevos modelos
```

**Nueva Estructura de URLs:**
```
/api/strategic/organizacion/
├── areas/                # Existente
├── organigrama/          # Existente
├── consecutivos/         # NUEVO
└── unidades-medida/      # NUEVO
```

---

## Fase 1: Preparación y Backup

### 1.1 Crear rama de trabajo
```bash
git checkout -b feature/migrate-consecutivos-unidades-to-organizacion
```

### 1.2 Backup de archivos fuente
- [ ] `configuracion/models_consecutivos.py`
- [ ] `configuracion/models_unidades.py`
- [ ] `configuracion/serializers_consecutivos.py`
- [ ] `configuracion/serializers_unidades.py`
- [ ] `configuracion/views.py` (extracto de ViewSets)
- [ ] `configuracion/urls.py`

### 1.3 Documentar estado actual
- [ ] Listar todos los imports de ConsecutivoConfig
- [ ] Listar todos los imports de UnidadMedida
- [ ] Verificar tablas en BD: `configuracion_consecutivo`, `configuracion_unidad_medida`

---

## Fase 2: Migrar ConsecutivoConfig

### 2.1 Mover archivos de modelo
```
COPIAR: configuracion/models_consecutivos.py
    →   organizacion/models_consecutivos.py
```

**Cambios requeridos en el archivo:**
```python
# Actualizar imports si es necesario
# Mantener db_table = 'configuracion_consecutivo' para no migrar datos
```

### 2.2 Mover serializers
```
COPIAR: configuracion/serializers_consecutivos.py
    →   organizacion/serializers_consecutivos.py
```

**Cambios requeridos:**
```python
# Actualizar import del modelo:
# FROM: from .models_consecutivos import ConsecutivoConfig
# TO:   from .models_consecutivos import ConsecutivoConfig (mismo, sin cambio)
```

### 2.3 Crear viewset
```
CREAR: organizacion/viewsets_consecutivos.py
```

**Contenido:**
- Copiar `ConsecutivoConfigViewSet` desde `configuracion/views.py`
- Actualizar imports para apuntar a modelos/serializers locales

### 2.4 Actualizar organizacion/urls.py
```python
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AreaViewSet, OrganigramaView
from .viewsets_consecutivos import ConsecutivoConfigViewSet

router = DefaultRouter()
router.register(r'areas', AreaViewSet, basename='area')
router.register(r'consecutivos', ConsecutivoConfigViewSet, basename='consecutivo')

urlpatterns = [
    path('', include(router.urls)),
    path('organigrama/', OrganigramaView.as_view(), name='organigrama'),
]
```

### 2.5 Actualizar organizacion/__init__.py
```python
from .models import Area
from .models_consecutivos import ConsecutivoConfig
```

### 2.6 Actualizar organizacion/admin.py
```python
from .models_consecutivos import ConsecutivoConfig

@admin.register(ConsecutivoConfig)
class ConsecutivoConfigAdmin(admin.ModelAdmin):
    # ... configuración del admin
```

### 2.7 Eliminar de configuracion
- [ ] Eliminar `ConsecutivoConfigViewSet` de `configuracion/views.py`
- [ ] Eliminar registro de router en `configuracion/urls.py`
- [ ] Eliminar registro en `configuracion/admin.py`
- [ ] NO eliminar `models_consecutivos.py` aún (puede haber imports)

### 2.8 Actualizar imports en otros módulos
```python
# BUSCAR en todo el backend:
from apps.gestion_estrategica.configuracion.models_consecutivos import ConsecutivoConfig

# REEMPLAZAR POR:
from apps.gestion_estrategica.organizacion.models_consecutivos import ConsecutivoConfig
```

**Archivos a actualizar:**
- [ ] `supply_chain/almacenamiento/models.py` (línea ~598)
- [ ] `configuracion/stats_views.py` (calculate_consecutivos_stats)
- [ ] Tests que importen ConsecutivoConfig

### 2.9 Verificar funcionamiento
```bash
python manage.py check
python manage.py migrate --check
pytest backend/apps/gestion_estrategica/organizacion/tests/
```

---

## Fase 3: Migrar UnidadMedida

### 3.1 Mover archivos de modelo
```
COPIAR: configuracion/models_unidades.py
    →   organizacion/models_unidades.py
```

**Cambios requeridos:**
```python
# Mantener db_table = 'configuracion_unidad_medida' para no migrar datos
class Meta:
    db_table = 'configuracion_unidad_medida'
    # ... resto igual
```

### 3.2 Mover serializers
```
COPIAR: configuracion/serializers_unidades.py
    →   organizacion/serializers_unidades.py
```

### 3.3 Crear viewset
```
CREAR: organizacion/viewsets_unidades.py
```

**Contenido:**
- Copiar `UnidadMedidaViewSet` desde `configuracion/views.py`
- Actualizar imports locales

### 3.4 Actualizar organizacion/urls.py
```python
from .viewsets_unidades import UnidadMedidaViewSet

router.register(r'unidades-medida', UnidadMedidaViewSet, basename='unidad-medida')
```

### 3.5 Actualizar organizacion/__init__.py
```python
from .models_unidades import UnidadMedida
```

### 3.6 Actualizar organizacion/admin.py
```python
from .models_unidades import UnidadMedida

@admin.register(UnidadMedida)
class UnidadMedidaAdmin(admin.ModelAdmin):
    # ... configuración
```

### 3.7 Eliminar de configuracion
- [ ] Eliminar `UnidadMedidaViewSet` de `configuracion/views.py`
- [ ] Eliminar registro de router en `configuracion/urls.py`
- [ ] Eliminar registro en `configuracion/admin.py`

### 3.8 Actualizar imports en otros módulos

**Lista de archivos a actualizar:**
```python
# BUSCAR:
from apps.gestion_estrategica.configuracion.models_unidades import UnidadMedida

# REEMPLAZAR POR:
from apps.gestion_estrategica.organizacion.models_unidades import UnidadMedida
```

**Archivos identificados:**
- [ ] `configuracion/models.py` (SedeEmpresa.unidad_capacidad FK)
- [ ] `configuracion/serializers.py` (si tiene referencias)
- [ ] `configuracion/stats_views.py` (calculate_unidades_medida_stats)
- [ ] `supply_chain/catalogos/` (verificar si hay referencias)

### 3.9 Consolidar UnidadMedida duplicada en supply_chain

**Problema:** Existe `supply_chain/catalogos/models.py` con modelo `UnidadMedida` duplicado.

**Solución:**
1. Verificar si supply_chain.UnidadMedida tiene datos únicos
2. Crear migración para consolidar datos
3. Actualizar imports en supply_chain a usar organizacion.UnidadMedida
4. Deprecar/eliminar supply_chain.catalogos.UnidadMedida

**Archivos supply_chain a actualizar:**
- [ ] `supply_chain/almacenamiento/models.py`
- [ ] `supply_chain/programacion_abastecimiento/models.py`
- [ ] `supply_chain/compras/models.py`
- [ ] `production_ops/mantenimiento/models.py`
- [ ] `production_ops/recepcion/models.py`
- [ ] `production_ops/procesamiento/models.py`
- [ ] `sales_crm/servicio_cliente/models.py`

---

## Fase 4: Actualizar Frontend

### 4.1 Actualizar API paths

**Archivo:** `frontend/src/features/gestion-estrategica/api/strategicApi.ts`

```typescript
// ANTES:
const CONFIGURACION_URL = `${STRATEGIC_BASE_URL}/configuracion`;

// Consecutivos endpoints:
getAll: () => api.get(`${CONFIGURACION_URL}/consecutivos/`),

// UnidadesMedida endpoints:
getAll: () => api.get(`${CONFIGURACION_URL}/unidades-medida/`),

// DESPUÉS:
const ORGANIZACION_URL = `${STRATEGIC_BASE_URL}/organizacion`;

// Consecutivos endpoints:
getAll: () => api.get(`${ORGANIZACION_URL}/consecutivos/`),

// UnidadesMedida endpoints:
getAll: () => api.get(`${ORGANIZACION_URL}/unidades-medida/`),
```

### 4.2 Verificar tipos y exports
- [ ] Los tipos en `strategicApi.ts` no necesitan cambios (son interfaces TS)
- [ ] Los hooks en `useStrategic.ts` no necesitan cambios (usan API layer)

### 4.3 Actualizar stats endpoint

**Si stats se mantiene en configuracion:**
```typescript
// stats_views.py debe actualizar imports:
from apps.gestion_estrategica.organizacion.models_consecutivos import ConsecutivoConfig
from apps.gestion_estrategica.organizacion.models_unidades import UnidadMedida
```

---

## Fase 5: Limpieza Final

### 5.1 Eliminar archivos obsoletos de configuracion
```
ELIMINAR:
- configuracion/models_consecutivos.py
- configuracion/models_unidades.py
- configuracion/serializers_consecutivos.py
- configuracion/serializers_unidades.py
```

### 5.2 Actualizar configuracion/urls.py
```python
# Eliminar registros de consecutivos y unidades-medida
router = DefaultRouter()
router.register(r'empresa-config', EmpresaConfigViewSet)
router.register(r'sedes', SedeEmpresaViewSet)
router.register(r'integraciones-externas', IntegracionExternaViewSet)
router.register(r'icons', IconRegistryViewSet)
router.register(r'normas-iso', NormaISOViewSet)
# YA NO: router.register(r'unidades-medida', ...)
# YA NO: router.register(r'consecutivos', ...)
```

### 5.3 Actualizar VALID_SECTIONS en stats_views.py
```python
# Si stats se mantiene en configuracion, actualizar para reflejar
# que consecutivos y unidades_medida ahora están en organizacion
# O mover las funciones de stats a organizacion
```

### 5.4 Crear migración vacía para documentar el cambio
```bash
python manage.py makemigrations organizacion --empty --name move_consecutivos_unidades
```

**Contenido de la migración:**
```python
"""
Migration to document the move of ConsecutivoConfig and UnidadMedida
from configuracion to organizacion app.

Note: No database changes needed - models keep the same db_table.
"""
from django.db import migrations

class Migration(migrations.Migration):
    dependencies = [
        ('organizacion', '0003_add_review_date_to_politica_integral'),
    ]
    operations = []  # No operations - just documentation
```

---

## Fase 6: Testing y Validación

### 6.1 Tests Backend
```bash
# Tests de organizacion
pytest backend/apps/gestion_estrategica/organizacion/tests/ -v

# Tests de configuracion (verificar que no se rompieron)
pytest backend/apps/gestion_estrategica/configuracion/tests/ -v

# Tests de supply_chain
pytest backend/apps/supply_chain/ -v

# Tests completos
pytest backend/ -v
```

### 6.2 Verificación Manual
- [ ] GET `/api/strategic/organizacion/consecutivos/` → Lista consecutivos
- [ ] POST `/api/strategic/organizacion/consecutivos/cargar-sistema/` → Carga sistema
- [ ] GET `/api/strategic/organizacion/unidades-medida/` → Lista unidades
- [ ] POST `/api/strategic/organizacion/unidades-medida/cargar-sistema/` → Carga sistema

### 6.3 Frontend E2E
- [ ] Abrir página Configuración
- [ ] Navegar a tab Consecutivos
- [ ] Verificar que lista se carga
- [ ] Crear nuevo consecutivo
- [ ] Navegar a tab Unidades de Medida
- [ ] Verificar que lista se carga
- [ ] Convertir unidades (probar función)

---

## Checklist de Archivos

### Backend - MOVER a organizacion/

| Archivo | Origen | Destino | Estado |
|---------|--------|---------|--------|
| models_consecutivos.py | configuracion/ | organizacion/ | ✅ |
| models_unidades.py | configuracion/ | organizacion/ | ✅ |
| serializers_consecutivos.py | configuracion/ | organizacion/ | ✅ |
| serializers_unidades.py | configuracion/ | organizacion/ | ✅ |

### Backend - CREAR en organizacion/

| Archivo | Descripción | Estado |
|---------|-------------|--------|
| viewsets_consecutivos.py | ViewSet extraído de views.py | ✅ |
| viewsets_unidades.py | ViewSet extraído de views.py | ✅ |

### Backend - ACTUALIZAR

| Archivo | Cambio | Estado |
|---------|--------|--------|
| organizacion/urls.py | Agregar routers | ✅ |
| organizacion/models.py | Re-exportar modelos | ✅ |
| organizacion/admin.py | Registrar modelos | ✅ |
| configuracion/views.py | Eliminar ViewSets | ✅ |
| configuracion/urls.py | Eliminar routers | ✅ |
| configuracion/admin.py | Eliminar registros | ✅ |
| configuracion/stats_views.py | Actualizar imports | ✅ |
| configuracion/models.py | ForeignKey a organizacion.UnidadMedida | ✅ |
| configuracion/utils_unidades.py | Actualizar imports | ✅ |

### Frontend - ACTUALIZAR

| Archivo | Cambio | Estado |
|---------|--------|--------|
| strategicApi.ts | Cambiar URLs a /organizacion/ | ✅ |
| OrganizacionTab.tsx | Agregar secciones consecutivos y unidades_medida | ✅ |
| ConfiguracionTab.tsx | Remover secciones migradas | ✅ |
| seed_estructura_final.py | Mover secciones a tab organizacion | ✅ |

---

## Riesgos y Mitigación

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| Imports rotos | Alta | Alto | Búsqueda global antes/después |
| FK SedeEmpresa | Media | Alto | Mantener db_table original |
| supply_chain duplicado | Alta | Medio | Consolidar en fase separada |
| Frontend 404s | Media | Medio | Actualizar API paths |
| Stats endpoint roto | Baja | Bajo | Actualizar imports |

---

## Tiempo Estimado

| Fase | Duración |
|------|----------|
| Fase 1: Preparación | 30 min |
| Fase 2: ConsecutivoConfig | 1-2 horas |
| Fase 3: UnidadMedida | 1-2 horas |
| Fase 4: Frontend | 30 min |
| Fase 5: Limpieza | 30 min |
| Fase 6: Testing | 1 hora |
| **TOTAL** | **4-6 horas** |

---

## Notas Adicionales

### ¿Por qué NO crear migraciones de base de datos?
- Los modelos mantienen `db_table` original
- No hay cambios en estructura de tablas
- Solo se mueve la ubicación del código Python
- Django resuelve imports dinámicamente

### Consolidación de supply_chain.UnidadMedida (Fase Futura)
Esta es una tarea separada que requiere:
1. Análisis de datos en ambas tablas
2. Migración de datos si hay diferencias
3. Actualización de ForeignKeys en supply_chain
4. Deprecación del modelo duplicado

Se recomienda hacer esto en un sprint separado después de estabilizar la migración principal.
