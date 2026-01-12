# Análisis de Impacto Arquitectónico - Movimiento de Módulos ERP StrateKaz

**Fecha:** 2026-01-11
**Autor:** Arquitecto Senior - Claude Code
**Alcance:** Evaluación del impacto de mover módulos entre niveles arquitectónicos

---

## 📋 Resumen Ejecutivo

### Cambios Propuestos

1. **Extraer de HSEQ Management (Nivel 3):**
   - `planificacion_sistema`
   - `sistema_documental`

2. **Crear nuevo módulo independiente** para estos submódulos

3. **Mover de Motor de Riesgos (Nivel 2) a Gestión Estratégica (Nivel 1):**
   - `contexto_organizacional` → `gestion_estrategica/planeacion`

### Nivel de Riesgo: 🟡 MEDIO-ALTO

**Factores de Riesgo:**
- ✅ Baja acoplamiento técnico (sin ForeignKeys cruzadas críticas)
- ⚠️  Dependencias lógicas importantes
- ⚠️  Impacto en URLs y configuración
- ⚠️  Cambios en estructura de frontend
- ⚠️  Migraciones de base de datos necesarias

---

## 🔍 1. Análisis de Estructura Actual

### Backend - Apps Involucradas

#### HSEQ Management (`apps/hseq_management/`)
```
hseq_management/
├── planificacion_sistema/     ← A MOVER
│   ├── models.py              (5 modelos)
│   ├── urls.py
│   └── migrations/
├── sistema_documental/        ← A MOVER
│   ├── models.py              (10 modelos)
│   ├── urls.py
│   ├── views.py
│   ├── serializers.py
│   └── migrations/
├── calidad/
├── medicina_laboral/
├── seguridad_industrial/
├── higiene_industrial/
├── gestion_comites/
├── accidentalidad/
├── emergencias/
├── gestion_ambiental/
└── mejora_continua/
```

#### Motor de Riesgos (`apps/motor_riesgos/`)
```
motor_riesgos/
├── contexto_organizacional/   ← A MOVER
│   ├── models.py              (6 modelos)
│   ├── urls.py
│   └── migrations/
├── riesgos_procesos/
├── ipevr/
├── aspectos_ambientales/
├── riesgos_viales/
├── sagrilaft_ptee/
└── seguridad_informacion/
```

#### Gestión Estratégica (`apps/gestion_estrategica/`)
```
gestion_estrategica/
├── configuracion/
├── identidad/
├── organizacion/
├── planeacion/                ← DESTINO: contexto_organizacional
│   ├── models.py              (6 modelos actuales)
│   └── migrations/
├── gestion_proyectos/
└── revision_direccion/
```

### Frontend - Features Involucradas

```
frontend/src/features/
├── hseq/                      ← Impactado
│   ├── pages/
│   │   ├── SistemaDocumentalPage.tsx
│   │   └── PlanificacionSistemaPage.tsx
│   ├── api/
│   └── types/
├── riesgos/                   ← Impactado
│   ├── pages/
│   │   └── ContextoOrganizacionalPage.tsx
│   ├── components/tabs/
│   │   └── ContextoOrganizacionalTab.README.md
│   └── hooks/
└── gestion-estrategica/       ← Destino
    ├── pages/
    │   └── PlaneacionPage.tsx
    └── components/
```

---

## 🔗 2. Análisis de Dependencias

### 2.1 Dependencias de Backend

#### `planificacion_sistema` - Modelos y Relaciones

**Modelos (5):**
```python
# apps/hseq_management/planificacion_sistema/models.py

1. PlanTrabajoAnual
   - ForeignKey → core.User (responsable, aprobado_por, created_by)
   - empresa_id: PositiveBigIntegerField (multi-tenant)

2. ActividadPlan
   - ForeignKey → PlanTrabajoAnual (plan_trabajo)
   - ForeignKey → core.User (responsable, created_by)
   - ManyToManyField → core.User (colaboradores)

3. ObjetivoSistema
   - ForeignKey → PlanTrabajoAnual (plan_trabajo)
   - ForeignKey → core.User (responsable, created_by)
   - Vinculación: perspectiva_bsc, objetivo_bsc_id (string)

4. ProgramaGestion
   - ForeignKey → PlanTrabajoAnual (plan_trabajo)
   - ForeignKey → core.User (responsable, created_by)
   - ManyToManyField → core.User (coordinadores)

5. ActividadPrograma
   - ForeignKey → ProgramaGestion (programa)
   - ForeignKey → core.User (responsable, created_by)

6. SeguimientoCronograma
   - ForeignKey → PlanTrabajoAnual (plan_trabajo)
   - ForeignKey → core.User (realizado_por, created_by)
```

**Dependencias Identificadas:**
- ✅ **Solo depende de `core.User`** (modelo central)
- ✅ **NO hay ForeignKeys a otros módulos de HSEQ**
- ✅ **Usa empresa_id para multi-tenancy (no FK directa)**
- ⚠️  **Vinculación conceptual con BSC** (campo string, no FK)

**Tabla de Base de Datos:**
```sql
hseq_plan_trabajo_anual
hseq_actividad_plan
hseq_objetivo_sistema
hseq_programa_gestion
hseq_actividad_programa
hseq_seguimiento_cronograma
```

#### `sistema_documental` - Modelos y Relaciones

**Modelos (10):**
```python
# apps/hseq_management/sistema_documental/models.py

1. TipoDocumento
   - ForeignKey → core.User (created_by)

2. PlantillaDocumento
   - ForeignKey → TipoDocumento
   - ForeignKey → core.User (created_by)

3. Documento
   - ForeignKey → TipoDocumento
   - ForeignKey → PlantillaDocumento (nullable)
   - ForeignKey → core.User (elaborado_por, revisado_por, aprobado_por)
   - ManyToManyField → core.User (usuarios_autorizados)
   - ForeignKey → self (documento_padre, nullable)
   - ManyToManyField → self (documentos_referenciados)

4. VersionDocumento
   - ForeignKey → Documento
   - ForeignKey → core.User (creado_por, aprobado_por)

5. CampoFormulario
   - ForeignKey → PlantillaDocumento (nullable)
   - ForeignKey → TipoDocumento (nullable)
   - ForeignKey → core.User (created_by)

6. FirmaDocumento
   - ForeignKey → Documento
   - ForeignKey → VersionDocumento (nullable)
   - ForeignKey → core.User (firmante)

7. ControlDocumental
   - ForeignKey → Documento
   - ForeignKey → VersionDocumento (nullable)
   - ForeignKey → Documento (documento_sustituto, nullable)
   - ForeignKey → core.User (created_by, responsable_destruccion)
   - ManyToManyField → core.User (usuarios_distribucion)
```

**Dependencias Identificadas:**
- ✅ **Solo depende de `core.User`**
- ⚠️  **CRÍTICO: Usado por `gestion_estrategica.identidad`**
  ```python
  # apps/gestion_estrategica/identidad/services.py
  from apps.hseq_management.sistema_documental.models import (
      Documento, TipoDocumento, PlantillaDocumento
  )
  ```
- ⚠️  **Usado en views de `sistema_documental`:**
  ```python
  # apps/hseq_management/sistema_documental/views.py:671
  from apps.gestion_estrategica.identidad.models import PoliticaEspecifica
  ```

**Dependencia Circular Detectada:**
```
gestion_estrategica.identidad.services → hseq_management.sistema_documental.models
hseq_management.sistema_documental.views → gestion_estrategica.identidad.models
```

**Tablas de Base de Datos:**
```sql
documental_tipo_documento
documental_plantilla_documento
documental_documento
documental_version_documento
documental_campo_formulario
documental_firma_documento
documental_control_documental
```

#### `contexto_organizacional` - Modelos y Relaciones

**Modelos (6):**
```python
# apps/motor_riesgos/contexto_organizacional/models.py

1. AnalisisDOFA
   - BaseCompanyModel (hereda empresa FK)
   - ForeignKey → core.User (responsable, aprobado_por)

2. FactorDOFA
   - BaseCompanyModel, OrderedModel
   - ForeignKey → AnalisisDOFA (analisis)

3. EstrategiaTOWS
   - BaseCompanyModel
   - ForeignKey → AnalisisDOFA (analisis)
   - ForeignKey → core.User (responsable)

4. AnalisisPESTEL
   - BaseCompanyModel
   - ForeignKey → core.User (responsable)

5. FactorPESTEL
   - BaseCompanyModel, OrderedModel
   - ForeignKey → AnalisisPESTEL (analisis)

6. FuerzaPorter
   - BaseCompanyModel
   - (sin FK adicionales)
```

**Dependencias Identificadas:**
- ✅ **Solo depende de `core.User` y `core.base_models`**
- ✅ **NO hay ForeignKeys a otros módulos**
- ✅ **Alineación conceptual PERFECTA con Planeación Estratégica**

**Tablas de Base de Datos:**
```sql
motor_riesgos_analisis_dofa
motor_riesgos_factor_dofa
motor_riesgos_estrategia_tows
motor_riesgos_analisis_pestel
motor_riesgos_factor_pestel
motor_riesgos_fuerza_porter
```

### 2.2 Dependencias de Frontend

**Rutas Actuales:**
```typescript
// frontend/src/routes/index.tsx

// NIVEL 3: HSEQ
const SistemaDocumentalPage = lazy(() =>
  import('@/features/hseq').then(m => ({ default: m.SistemaDocumentalPage }))
);
const PlanificacionSistemaPage = lazy(() =>
  import('@/features/hseq').then(m => ({ default: m.PlanificacionSistemaPage }))
);

// NIVEL 2: Motor de Riesgos
const ContextoOrganizacionalPage = lazy(() =>
  import('@/features/riesgos').then(m => ({ default: m.ContextoOrganizacionalPage }))
);

// NIVEL 1: Gestión Estratégica
const PlaneacionPage = lazy(() =>
  import('@/features/gestion-estrategica/pages/PlaneacionPage')
);
```

**Archivos Impactados:**
```
frontend/src/
├── routes/index.tsx                    ← Actualizar imports y rutas
├── features/
│   ├── hseq/
│   │   ├── pages/
│   │   │   ├── SistemaDocumentalPage.tsx    ← MOVER
│   │   │   └── PlanificacionSistemaPage.tsx ← MOVER
│   │   └── index.ts                          ← Actualizar exports
│   ├── riesgos/
│   │   ├── pages/
│   │   │   └── ContextoOrganizacionalPage.tsx ← MOVER
│   │   ├── components/tabs/
│   │   │   └── ContextoOrganizacionalTab.README.md
│   │   └── index.ts                          ← Actualizar exports
│   └── gestion-estrategica/
│       ├── pages/
│       │   ├── PlaneacionPage.tsx            ← Actualizar integración
│       │   ├── SistemaDocumentalPage.tsx     ← NUEVO (posible ubicación)
│       │   └── PlanificacionSistemaPage.tsx  ← NUEVO (posible ubicación)
│       └── components/
│           └── tabs/
│               └── ContextoOrganizacionalTab.tsx ← NUEVO
└── layouts/Sidebar.tsx                        ← Actualizar menú
```

---

## 📊 3. Matriz de Impacto

### 3.1 Impacto por Componente

| Componente | planificacion_sistema | sistema_documental | contexto_organizacional |
|------------|----------------------|-------------------|------------------------|
| **Modelos Django** | 🟡 5 modelos | 🔴 10 modelos | 🟢 6 modelos |
| **Migraciones BD** | 🟡 Rename tables | 🔴 Rename + FK circular | 🟢 Rename tables |
| **URLs Backend** | 🟡 2 archivos | 🟡 2 archivos | 🟡 2 archivos |
| **Settings.py** | 🟡 1 línea | 🟡 1 línea | 🟡 1 línea |
| **Tests** | 🟢 0 archivos | 🟡 Posibles tests | 🟡 Tests existentes |
| **Frontend Pages** | 🟡 1 página | 🟡 1 página | 🟡 1 página |
| **Frontend Routes** | 🟡 1 ruta | 🟡 1 ruta | 🟡 1 ruta |
| **API Endpoints** | 🟡 ~10 endpoints | 🔴 ~20 endpoints | 🟡 ~15 endpoints |

**Leyenda:**
- 🟢 Bajo impacto (< 5 cambios)
- 🟡 Medio impacto (5-15 cambios)
- 🔴 Alto impacto (> 15 cambios)

### 3.2 Dependencias Circulares Críticas

#### ⚠️ Dependencia Circular: `sistema_documental` ↔ `identidad`

**Situación Actual:**
```python
# A → B
gestion_estrategica/identidad/services.py:
    from apps.hseq_management.sistema_documental.models import (
        Documento, TipoDocumento, PlantillaDocumento
    )

# B → A
hseq_management/sistema_documental/views.py:671:
    from apps.gestion_estrategica.identidad.models import PoliticaEspecifica
```

**Uso en services.py:**
```python
# Línea 106-112
def generar_pdf_politica_integral(self, corporateidentity_id: int) -> Optional[str]:
    from apps.hseq_management.sistema_documental.models import (
        Documento, TipoDocumento, PlantillaDocumento
    )
    # Genera PDF de política usando sistema documental

# Línea 411
def generar_documento_politica(self, politica):
    from apps.hseq_management.sistema_documental.models import Documento
    # Crea documento en sistema documental para política
```

**Impacto:**
- 🔴 **CRÍTICO**: Esta dependencia impide mover `sistema_documental` sin refactorizar
- 🔴 **BLOQUEANTE**: Debe resolverse antes del movimiento

**Soluciones Propuestas:**
1. **Opción A (Recomendada):** Crear módulo común `apps/gestion_documental/`
2. **Opción B:** Usar servicios de integración con imports dinámicos
3. **Opción C:** Mantener `sistema_documental` en nivel superior común

---

## 🎯 4. Propuesta de Nueva Arquitectura

### 4.1 Opción A: Crear Módulo Común de Gestión Documental (RECOMENDADA)

```
apps/
├── core/                           # Nivel 0: Núcleo
├── gestion_documental/            # Nivel 0.5: NUEVO - Transversal
│   ├── __init__.py
│   ├── apps.py
│   ├── models.py                  # Desde sistema_documental
│   ├── services.py
│   ├── views.py
│   ├── serializers.py
│   ├── urls.py
│   └── migrations/
├── gestion_estrategica/           # Nivel 1
│   ├── configuracion/
│   ├── identidad/
│   ├── organizacion/
│   ├── planeacion/
│   │   ├── contexto/              # NUEVO: desde motor_riesgos
│   │   │   ├── models.py          # DOFA, PESTEL, Porter
│   │   │   └── migrations/
│   │   ├── planificacion/         # NUEVO: desde hseq_management
│   │   │   ├── models.py          # PlanTrabajo, Objetivo
│   │   │   └── migrations/
│   │   ├── estrategia/            # Existente
│   │   │   └── models.py          # StrategicPlan, KPIs
│   │   └── urls.py
│   ├── gestion_proyectos/
│   └── revision_direccion/
├── motor_riesgos/                 # Nivel 2
│   ├── riesgos_procesos/
│   ├── ipevr/
│   ├── aspectos_ambientales/
│   ├── riesgos_viales/
│   ├── sagrilaft_ptee/
│   └── seguridad_informacion/
└── hseq_management/               # Nivel 3
    ├── calidad/
    ├── medicina_laboral/
    ├── seguridad_industrial/
    ├── higiene_industrial/
    ├── gestion_comites/
    ├── accidentalidad/
    ├── emergencias/
    ├── gestion_ambiental/
    └── mejora_continua/
```

**Ventajas:**
- ✅ Resuelve la dependencia circular
- ✅ `gestion_documental` es transversal y usado por todos
- ✅ Alineación conceptual perfecta
- ✅ Escalable para futuros módulos documentales

**Desventajas:**
- ⚠️  Requiere crear nueva app
- ⚠️  Migración más compleja inicialmente

### 4.2 Opción B: Mantener Sistema Documental en HSEQ + Mover Solo Contexto

```
apps/
├── gestion_estrategica/           # Nivel 1
│   └── planeacion/
│       ├── contexto/              # NUEVO: desde motor_riesgos
│       │   ├── models.py          # DOFA, PESTEL, Porter
│       │   └── migrations/
│       └── estrategia/            # Existente
│           └── models.py          # StrategicPlan + PlanTrabajo fusionados
├── motor_riesgos/                 # Nivel 2
│   └── (resto de apps)
└── hseq_management/               # Nivel 3
    ├── sistema_documental/        # MANTENER AQUÍ
    ├── planificacion_sistema/     # MANTENER O FUSIONAR
    └── (resto de apps)
```

**Ventajas:**
- ✅ Menor impacto inmediato
- ✅ No requiere nueva app
- ✅ Resuelve dependencia circular parcialmente

**Desventajas:**
- ⚠️  No resuelve dependencia circular completamente
- ⚠️  `planificacion_sistema` queda desalineado conceptualmente

### 4.3 Opción C: Movimiento Completo sin Resolver Circular (NO RECOMENDADA)

**Riesgos:**
- 🔴 Mantiene dependencia circular
- 🔴 Puede generar errores en producción
- 🔴 Dificulta mantenimiento futuro

---

## 📝 5. Plan de Implementación Recomendado

### Fase 1: Preparación (Semana 1)

#### 1.1 Crear Módulo `gestion_documental`

```bash
# Backend
mkdir -p backend/apps/gestion_documental/migrations
touch backend/apps/gestion_documental/{__init__.py,apps.py,models.py,views.py,serializers.py,urls.py}
```

**Archivo: `apps/gestion_documental/apps.py`**
```python
from django.apps import AppConfig

class GestionDocumentalConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.gestion_documental'
    verbose_name = 'Gestión Documental'
```

**Actualizar `config/settings.py`:**
```python
INSTALLED_APPS = [
    # ...
    'apps.core',

    # ═══ NIVEL 0.5: TRANSVERSAL ═══
    'apps.gestion_documental',  # NUEVO

    # ═══ NIVEL 1: ESTRATÉGICO ═══
    'apps.gestion_estrategica.configuracion',
    # ...
]
```

#### 1.2 Migrar Modelos de `sistema_documental` a `gestion_documental`

**Crear migración personalizada:**
```python
# apps/gestion_documental/migrations/0001_initial.py
from django.db import migrations

class Migration(migrations.Migration):
    dependencies = [
        ('hseq_management', 'ultimo_migration'),
    ]

    operations = [
        # Renombrar tablas
        migrations.RenameModel(
            old_name='sistema_documental.TipoDocumento',
            new_name='TipoDocumento',
        ),
        # ... repetir para todos los modelos
    ]
```

**SQL equivalente:**
```sql
-- Renombrar tablas
ALTER TABLE documental_tipo_documento
  COMMENT = 'Movido de hseq_management a gestion_documental';

ALTER TABLE documental_documento
  COMMENT = 'Movido de hseq_management a gestion_documental';

-- Verificar integridad
SELECT table_name, table_rows
FROM information_schema.tables
WHERE table_schema = 'grasas_huesos_db'
  AND table_name LIKE 'documental_%';
```

#### 1.3 Actualizar Imports en `identidad/services.py`

**Antes:**
```python
from apps.hseq_management.sistema_documental.models import (
    Documento, TipoDocumento, PlantillaDocumento
)
```

**Después:**
```python
from apps.gestion_documental.models import (
    Documento, TipoDocumento, PlantillaDocumento
)
```

### Fase 2: Mover `contexto_organizacional` (Semana 2)

#### 2.1 Crear Submódulo en `gestion_estrategica/planeacion`

```bash
mkdir -p backend/apps/gestion_estrategica/planeacion/contexto/migrations
```

**Estructura:**
```
gestion_estrategica/planeacion/
├── __init__.py
├── contexto/                      # NUEVO
│   ├── __init__.py
│   ├── models.py                  # Desde motor_riesgos/contexto_organizacional
│   ├── serializers.py
│   ├── views.py
│   ├── urls.py
│   └── migrations/
│       └── 0001_initial.py
├── estrategia/                    # Existente (renombrar desde models.py)
│   ├── __init__.py
│   └── models.py                  # StrategicPlan, StrategicObjective, etc.
├── urls.py
└── apps.py
```

#### 2.2 Migración de Base de Datos

**SQL para renombrar tablas:**
```sql
-- Renombrar tablas de contexto_organizacional
RENAME TABLE motor_riesgos_analisis_dofa
  TO planeacion_analisis_dofa;

RENAME TABLE motor_riesgos_factor_dofa
  TO planeacion_factor_dofa;

RENAME TABLE motor_riesgos_estrategia_tows
  TO planeacion_estrategia_tows;

RENAME TABLE motor_riesgos_analisis_pestel
  TO planeacion_analisis_pestel;

RENAME TABLE motor_riesgos_factor_pestel
  TO planeacion_factor_pestel;

RENAME TABLE motor_riesgos_fuerza_porter
  TO planeacion_fuerza_porter;

-- Verificar
SHOW TABLES LIKE 'planeacion_%';
```

**Migración Django:**
```python
# apps/gestion_estrategica/planeacion/contexto/migrations/0001_initial.py
from django.db import migrations

class Migration(migrations.Migration):
    dependencies = [
        ('core', '0001_initial'),
    ]

    database_operations = [
        migrations.RunSQL(
            sql="RENAME TABLE motor_riesgos_analisis_dofa TO planeacion_analisis_dofa;",
            reverse_sql="RENAME TABLE planeacion_analisis_dofa TO motor_riesgos_analisis_dofa;"
        ),
        # ... repetir para todas las tablas
    ]

    state_operations = [
        # Definir modelos completos aquí
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            database_operations=database_operations,
            state_operations=state_operations
        )
    ]
```

#### 2.3 Actualizar URLs

**Actualizar `motor_riesgos/urls.py`:**
```python
# ANTES
urlpatterns = [
    path('contexto/', include('apps.motor_riesgos.contexto_organizacional.urls')),
    # ...
]

# DESPUÉS
urlpatterns = [
    # path('contexto/', ...) ← ELIMINAR
    path('riesgos-procesos/', include('apps.motor_riesgos.riesgos_procesos.urls')),
    # ...
]
```

**Actualizar `gestion_estrategica/planeacion/urls.py`:**
```python
from django.urls import path, include
from . import views

app_name = 'planeacion'

urlpatterns = [
    # Estrategia
    path('planes/', views.StrategicPlanViewSet.as_view({'get': 'list'})),
    path('objetivos/', views.StrategicObjectiveViewSet.as_view({'get': 'list'})),

    # Contexto Organizacional (NUEVO)
    path('contexto/', include('apps.gestion_estrategica.planeacion.contexto.urls')),
]
```

### Fase 3: Decisión sobre `planificacion_sistema` (Semana 3)

#### Opción A: Fusionar con `planeacion/estrategia`

**Justificación:**
- `PlanTrabajoAnual` es similar conceptualmente a `StrategicPlan`
- `ObjetivoSistema` es similar a `StrategicObjective`
- Evita redundancia

**Modelo Fusionado:**
```python
# apps/gestion_estrategica/planeacion/estrategia/models.py

class StrategicPlan(AuditModel, SoftDeleteModel):
    """
    Plan Estratégico (BSC) + Plan de Trabajo Anual (HSEQ)
    Unifica planificación estratégica y operativa
    """
    # Campos existentes de StrategicPlan
    name = models.CharField(max_length=200)
    period_type = models.CharField(...)

    # Nuevos campos desde PlanTrabajoAnual
    codigo = models.CharField(max_length=50, unique=True)
    periodo_fiscal = models.IntegerField()  # Año
    tipo_plan = models.CharField(
        max_length=20,
        choices=[
            ('ESTRATEGICO', 'Plan Estratégico (BSC)'),
            ('OPERATIVO', 'Plan de Trabajo Anual (HSEQ)'),
            ('INTEGRAL', 'Plan Integral (BSC + HSEQ)'),
        ]
    )
```

#### Opción B: Mover Completo a `planeacion/operativo`

**Estructura:**
```
gestion_estrategica/planeacion/
├── contexto/          # DOFA, PESTEL
├── estrategia/        # StrategicPlan, StrategicObjective
├── operativo/         # NUEVO: PlanTrabajoAnual
│   ├── models.py
│   └── migrations/
└── urls.py
```

### Fase 4: Frontend (Semana 4)

#### 4.1 Crear Nuevos Archivos Frontend

**Opción: Módulo Independiente**
```bash
mkdir -p frontend/src/features/gestion-documental/{pages,components,api,hooks,types}
```

**Opción: Integrar en `gestion-estrategica`**
```bash
# Mover archivos
mv frontend/src/features/hseq/pages/SistemaDocumentalPage.tsx \
   frontend/src/features/gestion-estrategica/pages/

mv frontend/src/features/hseq/pages/PlanificacionSistemaPage.tsx \
   frontend/src/features/gestion-estrategica/pages/

mv frontend/src/features/riesgos/pages/ContextoOrganizacionalPage.tsx \
   frontend/src/features/gestion-estrategica/pages/
```

#### 4.2 Actualizar Rutas

**`frontend/src/routes/index.tsx`:**
```typescript
// ANTES
// NIVEL 3: HSEQ
const SistemaDocumentalPage = lazy(() =>
  import('@/features/hseq').then(m => ({ default: m.SistemaDocumentalPage }))
);

// DESPUÉS - Opción A: Módulo Independiente
const SistemaDocumentalPage = lazy(() =>
  import('@/features/gestion-documental/pages/SistemaDocumentalPage')
);

// DESPUÉS - Opción B: Integrado en Gestión Estratégica
const SistemaDocumentalPage = lazy(() =>
  import('@/features/gestion-estrategica/pages/SistemaDocumentalPage')
);

// Contexto Organizacional
// ANTES
const ContextoOrganizacionalPage = lazy(() =>
  import('@/features/riesgos').then(m => ({ default: m.ContextoOrganizacionalPage }))
);

// DESPUÉS
const ContextoOrganizacionalPage = lazy(() =>
  import('@/features/gestion-estrategica/pages/ContextoOrganizacionalPage')
);
```

**Actualizar estructura de rutas:**
```typescript
{/* NIVEL 1: ESTRATÉGICO */}
<Route path="/gestion-estrategica">
  <Route path="configuracion" element={withSuspense(ConfiguracionPage)} />
  <Route path="identidad" element={withSuspense(IdentidadPage)} />
  <Route path="organizacion" element={withSuspense(OrganizacionPage)} />

  {/* Planeación */}
  <Route path="planeacion">
    <Route index element={withSuspense(PlaneacionPage)} />
    <Route path="contexto" element={withSuspense(ContextoOrganizacionalPage)} />
    <Route path="operativo" element={withSuspense(PlanificacionSistemaPage)} />
  </Route>

  <Route path="proyectos" element={withSuspense(ProyectosPage)} />
  <Route path="revision" element={withSuspense(RevisionDireccionPage)} />
</Route>

{/* NIVEL 0.5: TRANSVERSAL */}
<Route path="/documentos">
  <Route index element={withSuspense(SistemaDocumentalPage)} />
  <Route path=":id" element={withSuspense(DocumentoDetailPage)} />
</Route>
```

#### 4.3 Actualizar Sidebar/Menú

**`frontend/src/layouts/Sidebar.tsx`:**
```typescript
const menuItems = [
  // Nivel 0.5: Transversal
  {
    label: 'Gestión Documental',
    icon: FileText,
    path: '/documentos',
    level: 0.5,
    color: '#6366f1'
  },

  // Nivel 1: Estratégico
  {
    label: 'Dirección Estratégica',
    icon: Target,
    path: '/gestion-estrategica',
    level: 1,
    children: [
      { label: 'Configuración', path: '/gestion-estrategica/configuracion' },
      { label: 'Identidad', path: '/gestion-estrategica/identidad' },
      { label: 'Organización', path: '/gestion-estrategica/organizacion' },
      {
        label: 'Planeación',
        path: '/gestion-estrategica/planeacion',
        children: [
          { label: 'Contexto Organizacional', path: '/gestion-estrategica/planeacion/contexto' },
          { label: 'Plan Estratégico (BSC)', path: '/gestion-estrategica/planeacion' },
          { label: 'Plan de Trabajo Anual', path: '/gestion-estrategica/planeacion/operativo' },
        ]
      },
      { label: 'Proyectos', path: '/gestion-estrategica/proyectos' },
      { label: 'Revisión Dirección', path: '/gestion-estrategica/revision' },
    ]
  },

  // Nivel 2: Cumplimiento (Motor de Riesgos SIN contexto)
  {
    label: 'Motor de Riesgos',
    icon: AlertTriangle,
    path: '/riesgos',
    level: 2,
    children: [
      // ❌ ELIMINAR: { label: 'Contexto Organizacional', ... }
      { label: 'Riesgos de Procesos', path: '/riesgos/procesos' },
      { label: 'IPEVR (SST)', path: '/riesgos/ipevr' },
      // ...
    ]
  },

  // Nivel 3: HSEQ (SIN sistema_documental ni planificacion)
  {
    label: 'HSEQ Management',
    icon: Shield,
    path: '/hseq',
    level: 3,
    children: [
      // ❌ ELIMINAR: { label: 'Sistema Documental', ... }
      // ❌ ELIMINAR: { label: 'Planificación Sistema', ... }
      { label: 'Calidad', path: '/hseq/calidad' },
      { label: 'Medicina Laboral', path: '/hseq/medicina' },
      // ...
    ]
  },
];
```

### Fase 5: Testing y Validación (Semana 5)

#### 5.1 Tests de Migración

**Test de integridad de base de datos:**
```python
# apps/gestion_documental/tests/test_migration.py
import pytest
from django.db import connection

@pytest.mark.django_db
class TestDocumentalMigration:
    def test_tables_renamed_correctly(self):
        """Verifica que las tablas fueron renombradas"""
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT COUNT(*)
                FROM information_schema.tables
                WHERE table_schema = 'grasas_huenos_db'
                  AND table_name LIKE 'documental_%'
            """)
            count = cursor.fetchone()[0]
            assert count == 7  # 7 modelos de sistema documental

    def test_foreign_keys_intact(self):
        """Verifica que las FKs siguen funcionando"""
        from apps.gestion_documental.models import Documento, TipoDocumento

        tipo = TipoDocumento.objects.first()
        docs = Documento.objects.filter(tipo_documento=tipo)
        assert docs.exists()

    def test_no_orphan_records(self):
        """Verifica que no hay registros huérfanos"""
        from apps.gestion_documental.models import (
            Documento, VersionDocumento, FirmaDocumento
        )

        # Todas las versiones deben tener documento padre
        versiones = VersionDocumento.objects.all()
        for version in versiones:
            assert version.documento is not None
```

**Test de funcionalidad:**
```python
# apps/gestion_estrategica/identidad/tests/test_services_after_migration.py
import pytest
from apps.gestion_estrategica.identidad.services import IdentidadService

@pytest.mark.django_db
class TestIdentidadServiceAfterMigration:
    def test_generar_pdf_politica_integral(self):
        """Verifica que el servicio sigue funcionando tras migración"""
        service = IdentidadService()

        # Crear identidad corporativa de prueba
        from apps.gestion_estrategica.identidad.models import CorporateIdentity
        identity = CorporateIdentity.objects.create(...)

        # Debe poder generar PDF usando nuevo import
        pdf_path = service.generar_pdf_politica_integral(identity.id)
        assert pdf_path is not None
```

#### 5.2 Tests de Frontend

**Test de rutas:**
```typescript
// frontend/src/__tests__/routes/migration.test.tsx
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AppRoutes } from '@/routes';

describe('Routes after migration', () => {
  it('should load Sistema Documental from new location', async () => {
    render(
      <MemoryRouter initialEntries={['/documentos']}>
        <AppRoutes />
      </MemoryRouter>
    );

    // Debe cargar sin errores
    expect(await screen.findByText(/Sistema Documental/i)).toBeInTheDocument();
  });

  it('should load Contexto Organizacional from gestion-estrategica', async () => {
    render(
      <MemoryRouter initialEntries={['/gestion-estrategica/planeacion/contexto']}>
        <AppRoutes />
      </MemoryRouter>
    );

    expect(await screen.findByText(/Contexto Organizacional/i)).toBeInTheDocument();
  });

  it('should NOT find contexto in riesgos', () => {
    render(
      <MemoryRouter initialEntries={['/riesgos/contexto']}>
        <AppRoutes />
      </MemoryRouter>
    );

    // Debe mostrar 404
    expect(screen.getByText(/404|Not Found/i)).toBeInTheDocument();
  });
});
```

#### 5.3 Checklist de Validación

**Backend:**
- [ ] Todas las migraciones ejecutadas sin errores
- [ ] Todas las tablas renombradas correctamente
- [ ] ForeignKeys intactas y funcionando
- [ ] No hay registros huérfanos
- [ ] Imports actualizados en todos los archivos
- [ ] URLs actualizadas y funcionando
- [ ] Tests unitarios pasando
- [ ] Tests de integración pasando

**Frontend:**
- [ ] Archivos movidos correctamente
- [ ] Rutas actualizadas
- [ ] Menú/Sidebar actualizado
- [ ] Lazy loading funcionando
- [ ] API calls apuntando a nuevos endpoints
- [ ] Tests de componentes pasando
- [ ] Tests de rutas pasando

**Datos:**
- [ ] Backup de BD antes de migración
- [ ] Verificación de integridad post-migración
- [ ] Conteo de registros coincide pre/post
- [ ] Queries de negocio funcionando

---

## ⚡ 6. Alternativas y Recomendaciones

### 6.1 Recomendación Final: Opción Híbrida

**Movimientos Recomendados:**

1. ✅ **Crear `apps/gestion_documental/`** (Nivel 0.5 - Transversal)
   - Mover todo `sistema_documental`
   - Resuelve dependencia circular
   - Lógica de negocio: Documentos son transversales

2. ✅ **Mover `contexto_organizacional` → `gestion_estrategica/planeacion/contexto/`**
   - Alineación conceptual perfecta
   - Sin dependencias circulares
   - Mejora cohesión del módulo estratégico

3. ⚠️  **Fusionar `planificacion_sistema` → `gestion_estrategica/planeacion/operativo/`**
   - Evita redundancia con `StrategicPlan`
   - Unifica planificación estratégica y operativa
   - ALTERNATIVA: Mantener separado si hay complejidad específica HSEQ

**Resultado:**
```
apps/
├── gestion_documental/        # Nivel 0.5 (Transversal)
│   └── (desde sistema_documental)
├── gestion_estrategica/       # Nivel 1 (Estratégico)
│   └── planeacion/
│       ├── contexto/          # DOFA, PESTEL, Porter
│       ├── estrategia/        # BSC, Strategic Plans
│       └── operativo/         # Plan Trabajo Anual HSEQ
├── motor_riesgos/             # Nivel 2 (Cumplimiento)
│   └── (sin contexto_organizacional)
└── hseq_management/           # Nivel 3 (Torre Control)
    └── (sin sistema_documental ni planificacion_sistema)
```

### 6.2 Estimación de Esfuerzo

| Fase | Backend | Frontend | Testing | Total |
|------|---------|----------|---------|-------|
| **Fase 1:** Crear gestion_documental | 16h | 8h | 8h | **32h** |
| **Fase 2:** Mover contexto_organizacional | 12h | 6h | 6h | **24h** |
| **Fase 3:** Decisión planificacion_sistema | 8-16h | 4-8h | 4-8h | **16-32h** |
| **Fase 4:** Frontend completo | 4h | 16h | 8h | **28h** |
| **Fase 5:** Testing y validación | 8h | 8h | 16h | **32h** |
| **TOTAL** | **48-56h** | **42-46h** | **42-46h** | **132-148h** |

**Tiempo estimado:** 17-19 días hábiles (3-4 semanas con 1 desarrollador)

### 6.3 Riesgos y Mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| Dependencia circular no detectada | Media | Alto | Análisis exhaustivo de imports con grep |
| Pérdida de datos en migración | Baja | Crítico | Backup obligatorio + dry-run + validación |
| Errores en producción post-deploy | Media | Alto | Deploy en staging primero + rollback plan |
| Tests fallando post-migración | Alta | Medio | Suite de tests completa antes de PR |
| Performance degradation | Baja | Medio | Benchmark antes/después + índices BD |

**Plan de Rollback:**
```sql
-- Rollback de tablas (ejemplo)
RENAME TABLE planeacion_analisis_dofa
  TO motor_riesgos_analisis_dofa;

-- Restaurar desde backup
mysql -u root -p grasas_huesos_db < backup_pre_migration.sql
```

---

## 📈 7. Beneficios Esperados

### 7.1 Arquitectónicos

- ✅ **Cohesión Mejorada:** Contexto organizacional en módulo estratégico (alineación conceptual)
- ✅ **Acoplamiento Reducido:** Sin dependencias circulares
- ✅ **Escalabilidad:** Módulo documental transversal reutilizable
- ✅ **Mantenibilidad:** Estructura más lógica y predecible

### 7.2 De Negocio

- ✅ **Experiencia de Usuario:** Navegación más intuitiva (DOFA/PESTEL en Planeación)
- ✅ **Consistencia:** Un solo lugar para planificación estratégica
- ✅ **Documentación:** Sistema documental accesible desde cualquier módulo
- ✅ **Cumplimiento:** Separación clara entre niveles de gestión

### 7.3 Técnicos

- ✅ **Rendimiento:** Menos queries cruzadas entre módulos
- ✅ **Testing:** Modularidad facilita tests unitarios
- ✅ **Deploy:** Menor riesgo al desacoplar módulos
- ✅ **Documentación:** Arquitectura más clara para nuevos devs

---

## 🚀 8. Siguiente Pasos Inmediatos

### Paso 1: Validación con Stakeholders
- [ ] Revisar este documento con equipo técnico
- [ ] Validar con usuarios finales la nueva navegación
- [ ] Aprobar opción de arquitectura (A, B o Híbrida)

### Paso 2: Preparación
- [ ] Crear backup completo de BD
- [ ] Crear branch `feature/refactor-module-structure`
- [ ] Configurar entorno de staging para pruebas

### Paso 3: Ejecución Fase 1
- [ ] Crear `apps/gestion_documental/`
- [ ] Migrar modelos de `sistema_documental`
- [ ] Actualizar imports en `identidad/services.py`
- [ ] Ejecutar migraciones
- [ ] Validar tests

### Paso 4: Revisión y Continuación
- [ ] Code review de Fase 1
- [ ] Merge a develop si exitoso
- [ ] Continuar con Fase 2 (contexto_organizacional)

---

## 📚 Apéndices

### A. Scripts Útiles

#### Verificar Dependencias Circulares
```bash
#!/bin/bash
# scripts/check_circular_deps.sh

echo "Buscando dependencias circulares..."

# Buscar imports de gestion_estrategica en otros módulos
echo "=== Imports de gestion_estrategica en otros módulos ==="
grep -r "from apps.gestion_estrategica" backend/apps/ \
  --exclude-dir=gestion_estrategica \
  --include="*.py" | grep -v "__pycache__"

# Buscar imports de hseq_management en otros módulos
echo "=== Imports de hseq_management en otros módulos ==="
grep -r "from apps.hseq_management" backend/apps/ \
  --exclude-dir=hseq_management \
  --include="*.py" | grep -v "__pycache__"

# Buscar imports de motor_riesgos en otros módulos
echo "=== Imports de motor_riesgos en otros módulos ==="
grep -r "from apps.motor_riesgos" backend/apps/ \
  --exclude-dir=motor_riesgos \
  --include="*.py" | grep -v "__pycache__"
```

#### Verificar Tablas de BD
```sql
-- scripts/verify_tables.sql

-- Tablas actuales de sistema_documental
SELECT table_name, table_rows
FROM information_schema.tables
WHERE table_schema = 'grasas_huesos_db'
  AND table_name LIKE 'documental_%'
ORDER BY table_name;

-- Tablas actuales de contexto_organizacional
SELECT table_name, table_rows
FROM information_schema.tables
WHERE table_schema = 'grasas_huesos_db'
  AND table_name LIKE 'motor_riesgos_%'
  AND table_name IN (
    'motor_riesgos_analisis_dofa',
    'motor_riesgos_factor_dofa',
    'motor_riesgos_estrategia_tows',
    'motor_riesgos_analisis_pestel',
    'motor_riesgos_factor_pestel',
    'motor_riesgos_fuerza_porter'
  )
ORDER BY table_name;

-- Verificar ForeignKeys
SELECT
  TABLE_NAME,
  COLUMN_NAME,
  REFERENCED_TABLE_NAME,
  REFERENCED_COLUMN_NAME
FROM information_schema.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = 'grasas_huesos_db'
  AND REFERENCED_TABLE_NAME IS NOT NULL
  AND TABLE_NAME LIKE 'documental_%'
ORDER BY TABLE_NAME;
```

### B. Plantillas de Migración

#### Migración de Renombrado de Tablas
```python
# Template: migration_rename_tables.py
from django.db import migrations

class Migration(migrations.Migration):
    dependencies = [
        ('source_app', 'previous_migration'),
    ]

    database_operations = [
        # Renombrar tablas sin tocar datos
        migrations.RunSQL(
            sql=[
                "RENAME TABLE old_table_name TO new_table_name;",
                "ALTER TABLE new_table_name COMMENT = 'Migrado desde source_app';",
            ],
            reverse_sql=[
                "RENAME TABLE new_table_name TO old_table_name;",
            ]
        ),
    ]

    state_operations = [
        # Definir nuevos modelos
        migrations.CreateModel(
            name='NewModel',
            fields=[
                # ... definir campos
            ],
            options={
                'db_table': 'new_table_name',
            },
        ),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            database_operations=database_operations,
            state_operations=state_operations
        )
    ]
```

### C. Documentos Relacionados

- `docs/ARQUITECTURA-6-NIVELES.md` - Arquitectura general del sistema
- `docs/PLAN-REFACTORIZACION-IDENTIDAD-CORPORATIVA.md` - Refactorización de identidad
- `docs/CHECKLIST-REFACTOR-DEPENDENCIAS.md` - Checklist de dependencias
- `backend/apps/core/management/commands/README_HSEQ.md` - Comandos HSEQ

---

**Fin del Análisis de Impacto Arquitectónico**

**Próxima Revisión:** Post-implementación Fase 1
**Responsable:** Equipo de Arquitectura + Lead Developer
