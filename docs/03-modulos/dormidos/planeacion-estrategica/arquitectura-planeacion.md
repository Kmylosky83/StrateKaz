# Módulo de Planeación Estratégica

**Versión:** 2.0
**Fecha:** 2026-02-06
**Estado:** En Desarrollo Activo

---

## Tabla de Contenidos

1. [Visión General](#visión-general)
2. [Arquitectura del Sistema](#arquitectura-del-sistema)
3. [Modelos de Datos](#modelos-de-datos)
4. [API Backend](#api-backend)
5. [Arquitectura Frontend](#arquitectura-frontend)
6. [Estado Actual y Brechas](#estado-actual-y-brechas)
7. [Plan de Implementación](#plan-de-implementación)

---

## Visión General

### Objetivo del Módulo

Crear un sistema completo de Planeación Estratégica que integra metodologías reconocidas internacionalmente para garantizar alineación organizacional y trazabilidad desde el análisis del contexto hasta la ejecución de proyectos.

### Capacidades Principales

#### 1. Análisis de Contexto (ISO 9001 Cláusula 4.1-4.2)

- **Partes Interesadas**: Identificación y análisis de requisitos de stakeholders
- **Análisis PESTEL**: Evaluación del entorno político, económico, social, tecnológico, ecológico y legal
- **Análisis DOFA**: Matriz de fortalezas, debilidades, oportunidades y amenazas
- **5 Fuerzas de Porter**: Análisis de la competencia y el entorno competitivo

#### 2. Formulación Estratégica

- **Matriz TOWS**: Cruce estratégico DOFA para generar estrategias FO, FA, DO, DA
- **Objetivos Estratégicos BSC**: Objetivos balanceados en 4 perspectivas (Financiera, Clientes, Procesos, Aprendizaje)
- **Mapa Estratégico Visual**: Representación gráfica de relaciones causa-efecto entre objetivos

#### 3. Operacionalización

- **KPIs por Objetivo**: Indicadores clave de desempeño con fórmulas y metas
- **Mediciones Periódicas**: Captura de valores reales con frecuencia configurable
- **Semáforos de Desempeño**: Indicadores visuales verde/amarillo/rojo basados en umbrales

#### 4. Gestión del Cambio y Ejecución

- **Gestión del Cambio**: Workflow estructurado para gestionar cambios organizacionales
- **Proyectos PMI**: Conversión de cambios u objetivos estratégicos en proyectos formales

---

## Arquitectura del Sistema

### Stack Tecnológico

#### Backend

```python
# Framework Base
Django 5.0.9
Django REST Framework 3.14.0
PostgreSQL 15+ (django-tenants)

# Validación y Documentación
django-filter 24.2        # Filtros avanzados
drf-spectacular 0.27.0    # OpenAPI 3.0 docs
```

#### Frontend

```json
{
  "framework": "React 18.3 + TypeScript 5.3",
  "state": {
    "client": "Zustand 4.4",
    "server": "TanStack Query v5.90",
    "forms": "React Hook Form 7.66 + Zod 3.22"
  },
  "ui": {
    "styling": "Tailwind CSS 3.4",
    "animation": "Framer Motion 11.x",
    "icons": "Lucide React 0.468",
    "charts": "Recharts 2.10",
    "tables": "TanStack Table v8.20",
    "drag": "dnd-kit 6.1.0"
  },
  "visualizations": {
    "strategicMap": "React Flow 11.11",
    "matrixView": "React Grid Layout 1.4"
  },
  "utilities": {
    "dates": "date-fns 3.0",
    "validation": "Zod 3.22",
    "toast": "Sonner 1.3"
  }
}
```

### Estructura de Apps Django

```
backend/apps/gestion_estrategica/
├── planeacion/                          # APP PRINCIPAL
│   ├── models.py                        # StrategicPlan, StrategicObjective, KPI, GestionCambio
│   ├── serializers.py
│   ├── views.py
│   ├── urls.py
│   ├── filters.py
│   ├── permissions.py
│   │
│   ├── contexto/                        # SUB-APP: Análisis de Contexto
│   │   ├── models.py                    # DOFA, PESTEL, Porter, TOWS
│   │   ├── serializers.py
│   │   ├── views.py
│   │   ├── urls.py
│   │   └── services.py                  # Lógica de negocio
│   │
│   ├── stakeholders/                    # SUB-APP: Partes Interesadas
│   │   ├── models.py                    # ParteInteresada, Requisitos, Comunicación
│   │   ├── serializers.py
│   │   ├── views.py
│   │   └── urls.py
│   │
│   ├── mapa_estrategico/                # SUB-APP: Mapa Estratégico
│   │   ├── models.py                    # MapaEstrategico, CausaEfecto
│   │   ├── serializers.py
│   │   ├── views.py
│   │   ├── urls.py
│   │   └── services.py                  # Auto-layout con dagre
│   │
│   └── migrations/
│
├── gestion_proyectos/                   # APP SEPARADA
│   ├── models.py                        # Proyecto (PMI)
│   └── ...
│
├── configuracion/                       # YA EXISTE
│   └── models.py                        # EmpresaConfig, NormaISO, TipoCambio
│
├── organizacion/                        # YA EXISTE
│   └── models.py                        # Area, Cargo
│
└── identidad/                           # YA EXISTE
    └── models.py                        # Mision, Vision, Valores, Politicas
```

### Dependencias entre Apps

```
┌─────────────────────────────────────────────────────────────┐
│                    NIVEL 0: CORE                            │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                  │
│  │  User    │  │   RBAC   │  │  Cargo   │                  │
│  └──────────┘  └──────────┘  └──────────┘                  │
└─────────────────────────────────────────────────────────────┘
              ▲                ▲                ▲
              │                │                │
┌─────────────┼────────────────┼────────────────┼─────────────┐
│             │   NIVEL 1: GESTIÓN ESTRATÉGICA  │             │
│  ┌──────────┴──────────┐  ┌─────────────────┴──────┐       │
│  │  Configuración      │  │  Organización          │       │
│  │  - EmpresaConfig    │  │  - Area                │       │
│  │  - NormaISO         │  │  - Cargo               │       │
│  └─────────────────────┘  └────────────────────────┘       │
│            ▲                        ▲                       │
│            │                        │                       │
│  ┌─────────┴────────────────────────┴─────────┐            │
│  │          Identidad                         │            │
│  │          - Mision, Vision, Valores         │            │
│  └────────────────────────────────────────────┘            │
│                      ▲                                      │
│                      │                                      │
│  ┌───────────────────┴──────────────────────────────────┐  │
│  │              PLANEACIÓN                              │  │
│  │  ┌──────────────────┐  ┌──────────────────┐         │  │
│  │  │  Stakeholders    │  │  Contexto        │         │  │
│  │  │  - ParteInter... │  │  - DOFA          │         │  │
│  │  └──────────────────┘  │  - PESTEL        │         │  │
│  │           ▲             │  - Porter        │         │  │
│  │           │             │  - TOWS          │         │  │
│  │           │             └─────────┬────────┘         │  │
│  │           │                       │                  │  │
│  │  ┌────────┴───────────────────────┴────────────┐    │  │
│  │  │     StrategicPlan + Objectives              │    │  │
│  │  │     - Plan Estratégico                      │    │  │
│  │  │     - Objetivos BSC                         │    │  │
│  │  │     - KPIs + Mediciones                     │    │  │
│  │  └─────────────┬───────────────────────────────┘    │  │
│  │                │                                     │  │
│  │  ┌─────────────┴───────────────────────────────┐    │  │
│  │  │     MapaEstrategico + CausaEfecto          │    │  │
│  │  └─────────────┬───────────────────────────────┘    │  │
│  │                │                                     │  │
│  │  ┌─────────────┴───────────────────────────────┐    │  │
│  │  │         GestionCambio                       │    │  │
│  │  └─────────────────────────────────────────────┘    │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                      │
                      │
┌─────────────────────┴─────────────────────────────────────┐
│             NIVEL 2: PROYECTOS                            │
│  ┌──────────────────────────────────────────────────┐    │
│  │         Gestion Proyectos                        │    │
│  │         - Proyecto (PMI)                         │    │
│  │         - Consume: StrategicObjective, Cambios   │    │
│  └──────────────────────────────────────────────────┘    │
└───────────────────────────────────────────────────────────┘
```

### Reglas de Dependencias

#### Permitido (Hacia arriba o lateral)

```python
# planeacion/stakeholders/models.py
from apps.core.models import User, Cargo
from apps.gestion_estrategica.organizacion.models import Area  # ✅ Lateral

# planeacion/models.py (StrategicObjective)
from apps.gestion_estrategica.configuracion.models import NormaISO  # ✅ Lateral
from apps.gestion_estrategica.organizacion.models import Area      # ✅ Lateral
from apps.core.models import User, Cargo                           # ✅ Arriba
```

#### Prohibido (Hacia abajo - crea ciclos)

```python
# ❌ NUNCA en configuracion/models.py:
from apps.gestion_estrategica.planeacion.models import StrategicObjective

# ❌ NUNCA en organizacion/models.py:
from apps.gestion_estrategica.planeacion.contexto.models import FactorDOFA
```

#### Solución: Relaciones Inversas

```python
# En configuracion/models.py
class NormaISO(models.Model):
    # NO importar StrategicObjective
    pass

# En organizacion/models.py
class Area(models.Model):
    # Acceder a objetivos relacionados:
    # area.objetivos_estrategicos.all()  # ✅ Via related_name
    pass
```

---

## Modelos de Datos

### Modelo Conceptual del Flujo Estratégico

```typescript
// FASE 1: Análisis de Contexto
ParteInteresada → Requisitos → Comunicación
AnalisisPESTEL → FactorPESTEL (6 dimensiones)
AnalisisDOFA → FactorDOFA (4 tipos)
AnalisisPorter → FuerzaPorter (5 fuerzas)

// FASE 2: Formulación Estratégica
AnalisisDOFA + FactorDOFA → EstrategiaTOWS (FO, FA, DO, DA)

// FASE 3: Objetivos Estratégicos
EstrategiaTOWS → StrategicObjective (BSC 4 perspectivas)
StrategicObjective → KPIObjetivo → Medicion
StrategicObjective → MapaEstrategico → CausaEfecto

// FASE 4: Gestión del Cambio
StrategicObjective → GestionCambio

// FASE 5: Ejecución
GestionCambio → Proyecto (PMI)
StrategicObjective → Proyecto (PMI)
```

### Entidades Principales

#### StrategicPlan

```python
class StrategicPlan(BaseModel):
    code = models.CharField(max_length=20, unique=True)
    name = models.CharField(max_length=200)
    start_date = models.DateField()
    end_date = models.DateField()
    status = models.CharField(choices=[
        ('DRAFT', 'Borrador'),
        ('APPROVED', 'Aprobado'),
        ('ACTIVE', 'Activo'),
        ('COMPLETED', 'Completado')
    ])
    mission = models.TextField()
    vision = models.TextField()
    strategic_axes = models.JSONField(default=list)
```

#### StrategicObjective

```python
class StrategicObjective(AuditModel):
    plan = models.ForeignKey(StrategicPlan, related_name='objectives')
    code = models.CharField(max_length=50, unique=True)
    name = models.CharField(max_length=300)
    description = models.TextField()
    bsc_perspective = models.CharField(choices=[
        ('FINANCIAL', 'Financiera'),
        ('CUSTOMER', 'Clientes'),
        ('PROCESSES', 'Procesos Internos'),
        ('LEARNING', 'Aprendizaje y Crecimiento')
    ])
    responsible = models.ForeignKey(User, related_name='objectives_responsible')
    areas_responsables = models.ManyToManyField(Area)
    target_value = models.DecimalField(max_digits=10, decimal_places=2)
    unit = models.CharField(max_length=50)
    status = models.CharField(choices=[
        ('PENDING', 'Pendiente'),
        ('IN_PROGRESS', 'En Progreso'),
        ('COMPLETED', 'Completado'),
        ('DELAYED', 'Retrasado')
    ])
    progress = models.IntegerField(default=0)  # 0-100
```

#### KPIObjetivo

```python
class KPIObjetivo(AuditModel):
    objective = models.ForeignKey(StrategicObjective, related_name='kpis')
    name = models.CharField(max_length=200)
    description = models.TextField()
    formula = models.TextField()
    target_value = models.DecimalField(max_digits=15, decimal_places=2)
    warning_threshold = models.DecimalField()
    critical_threshold = models.DecimalField()
    unit = models.CharField(max_length=50)
    frequency = models.CharField(choices=[
        ('DAILY', 'Diario'),
        ('WEEKLY', 'Semanal'),
        ('MONTHLY', 'Mensual'),
        ('QUARTERLY', 'Trimestral')
    ])
    trend_type = models.CharField(choices=[
        ('ASCENDING', 'Ascendente'),
        ('DESCENDING', 'Descendente')
    ])
```

#### GestionCambio

```python
class GestionCambio(AuditModel):
    code = models.CharField(max_length=50, unique=True)
    title = models.CharField(max_length=300)
    description = models.TextField()
    tipo_cambio = models.ForeignKey(TipoCambio)
    priority = models.CharField(choices=[
        ('CRITICAL', 'Crítica'),
        ('HIGH', 'Alta'),
        ('MEDIUM', 'Media'),
        ('LOW', 'Baja')
    ])
    status = models.CharField(choices=[
        ('IDENTIFIED', 'Identificado'),
        ('ANALYSIS', 'En Análisis'),
        ('PLANNED', 'Planificado'),
        ('IN_EXECUTION', 'En Ejecución'),
        ('COMPLETED', 'Completado'),
        ('CANCELLED', 'Cancelado')
    ])
    progress = models.IntegerField(default=0)  # 0-100
    impact_analysis = models.TextField()
    action_plan = models.TextField()
    related_objectives = models.ManyToManyField(StrategicObjective)
    proyecto_generado = models.ForeignKey('gestion_proyectos.Proyecto', null=True)
```

---

## API Backend

### Endpoints Principales

#### Análisis DOFA

```http
GET    /api/gestion-estrategica/planeacion/contexto/dofa/
POST   /api/gestion-estrategica/planeacion/contexto/dofa/
GET    /api/gestion-estrategica/planeacion/contexto/dofa/{id}/
PATCH  /api/gestion-estrategica/planeacion/contexto/dofa/{id}/
DELETE /api/gestion-estrategica/planeacion/contexto/dofa/{id}/
POST   /api/gestion-estrategica/planeacion/contexto/dofa/{id}/aprobar/
GET    /api/gestion-estrategica/planeacion/contexto/dofa/{id}/estadisticas/
```

#### Factores DOFA

```http
GET    /api/gestion-estrategica/planeacion/contexto/factores-dofa/
POST   /api/gestion-estrategica/planeacion/contexto/factores-dofa/
POST   /api/gestion-estrategica/planeacion/contexto/factores-dofa/reordenar/
```

#### Estrategias TOWS

```http
GET    /api/gestion-estrategica/planeacion/contexto/tows/
POST   /api/gestion-estrategica/planeacion/contexto/tows/
POST   /api/gestion-estrategica/planeacion/contexto/tows/{id}/convertir_objetivo/
```

#### Objetivos Estratégicos

```http
GET    /api/gestion-estrategica/planeacion/objectives/
POST   /api/gestion-estrategica/planeacion/objectives/
GET    /api/gestion-estrategica/planeacion/objectives/{id}/
PATCH  /api/gestion-estrategica/planeacion/objectives/{id}/
POST   /api/gestion-estrategica/planeacion/objectives/{id}/crear-proyecto/
```

### Filtros y Búsquedas

```python
# Ejemplo de filtros avanzados
GET /api/.../factores-dofa/?tipo=fortaleza&impacto=alto&area=5
GET /api/.../objectives/?bsc_perspective=FINANCIAL&status=IN_PROGRESS
GET /api/.../tows/?tipo=fo&estado=aprobada&prioridad=alta
```

---

## Arquitectura Frontend

### Estructura de Features

```
frontend/src/features/gestion-estrategica/
├── api/
│   ├── strategicApi.ts              # ✅ EXISTE
│   ├── contextoApi.ts               # En desarrollo
│   ├── stakeholdersApi.ts
│   ├── mapaEstrategicoApi.ts
│   └── kpisApi.ts
│
├── components/
│   ├── PlaneacionTab.tsx            # ✅ EXISTE
│   │
│   ├── contexto/
│   │   ├── StakeholdersSection.tsx
│   │   │   ├── StakeholdersTable.tsx
│   │   │   ├── StakeholderFormModal.tsx
│   │   │   └── StakeholderMatrix.tsx
│   │   │
│   │   ├── DOFASection.tsx
│   │   │   ├── DOFAMatrix.tsx              # Matriz 2x2 interactiva
│   │   │   ├── FactorFormModal.tsx
│   │   │   ├── DOFADragDrop.tsx
│   │   │   └── DOFACharts.tsx
│   │   │
│   │   ├── PESTELSection.tsx
│   │   │   ├── PESTELRadarChart.tsx        # Radar de 6 dimensiones
│   │   │   └── PESTELHeatmap.tsx
│   │   │
│   │   ├── PorterSection.tsx
│   │   │   └── PorterDiagram.tsx           # 5 fuerzas
│   │   │
│   │   └── TOWSSection.tsx
│   │       ├── TOWSMatrix.tsx              # Matriz TOWS 2x2
│   │       └── ConvertToObjectiveButton.tsx
│   │
│   ├── objetivos/
│   │   ├── ObjectivesTable.tsx             # TanStack Table
│   │   ├── ObjectiveFormModal.tsx
│   │   └── ObjectiveKanban.tsx
│   │
│   ├── mapa-estrategico/
│   │   ├── MapaEstrategicoCanvas.tsx       # React Flow
│   │   ├── ObjectiveNode.tsx
│   │   ├── CausaEfectoEdge.tsx
│   │   ├── BSCLanes.tsx
│   │   └── MapaMinimap.tsx
│   │
│   ├── kpis/
│   │   ├── KPIDashboard.tsx
│   │   ├── KPISemaforo.tsx
│   │   ├── KPIFormModal.tsx
│   │   └── TrendChart.tsx
│   │
│   └── gestion-cambio/
│       ├── CambiosTable.tsx
│       ├── CambioFormModal.tsx
│       ├── CambioKanban.tsx
│       └── ConvertirCambioProyectoModal.tsx
│
├── hooks/
│   ├── useStrategic.ts              # ✅ EXISTE
│   ├── useContexto.ts
│   ├── useStakeholders.ts
│   ├── useMapaEstrategico.ts
│   ├── useKPIs.ts
│   └── useTOWSGenerator.ts
│
├── types/
│   ├── strategic.types.ts           # ✅ EXISTE
│   ├── contexto.types.ts
│   ├── stakeholders.types.ts
│   ├── mapa-estrategico.types.ts
│   └── kpis.types.ts
│
└── pages/
    ├── PlaneacionPage.tsx           # ✅ EXISTE
    └── ContextoPage.tsx
```

### Componentes UI Destacados

#### 1. Matriz DOFA Interactiva

Matriz 2x2 con drag & drop usando dnd-kit para reordenar factores por prioridad. Cada cuadrante tiene color distintivo y muestra nivel de impacto.

#### 2. Mapa Estratégico con React Flow

Canvas interactivo con:
- Nodos personalizados para objetivos BSC
- Aristas con relaciones causa-efecto
- Layout automático en 4 perspectivas
- Minimap y controles de zoom

#### 3. Dashboard de KPIs

Grid de tarjetas con:
- Semáforos verde/amarillo/rojo
- Gráficos de tendencia con Recharts
- Indicadores de variación
- Filtros por perspectiva BSC

#### 4. Matriz TOWS

Matriz 2x2 editable que cruza:
- Fortalezas + Oportunidades (FO)
- Fortalezas + Amenazas (FA)
- Debilidades + Oportunidades (DO)
- Debilidades + Amenazas (DA)

Permite convertir estrategias en objetivos con un clic.

---

## Estado Actual y Brechas

### Estado Actual de Implementación

| Componente | Estado | Notas |
|------------|--------|-------|
| Modelos Backend | 🟡 Parcial | Falta campo `progress` en GestionCambio |
| API REST | 🟢 Completo | Endpoints CRUD implementados |
| Serializers | 🟢 Completo | Con filtros avanzados |
| Frontend Base | 🟡 Parcial | Faltan componentes de visualización |
| React Flow | 🔴 Pendiente | Mapa estratégico no implementado |
| Conversión Cambio→Proyecto | 🔴 Pendiente | Backend existe, falta modal frontend |

### Brechas Identificadas (Refactoring Activo)

#### B1: Campo `progress` en GestionCambio

**Estado:** No implementado
**Impacto:** Alto - No se puede medir avance del cambio
**Prioridad:** 🔴 Alta

**Solución:**
```python
class GestionCambio(AuditModel):
    progress = models.IntegerField(
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        verbose_name="Progreso (%)"
    )

    def update_progress_from_status(self):
        status_progress_map = {
            'IDENTIFIED': 10,
            'ANALYSIS': 30,
            'PLANNED': 50,
            'IN_EXECUTION': 70,
            'COMPLETED': 100,
            'CANCELLED': 0,
        }
        self.progress = status_progress_map.get(self.status, 0)
```

#### B2: Validación de Ciclos en CausaEfecto

**Estado:** No implementado
**Impacto:** Medio - Relaciones circulares en mapa BSC
**Prioridad:** 🟡 Media

**Solución:**
```python
class CausaEfecto(TimestampedModel):
    def clean(self):
        if self._creates_cycle():
            raise ValidationError({
                'target_objective': 'Esta relación crearía un ciclo en el mapa estratégico.'
            })

    def _creates_cycle(self):
        # Implementar detección de ciclos con BFS
        pass
```

#### B3: Índices en Base de Datos

**Estado:** No optimizado
**Impacto:** Medio - Rendimiento degradado
**Prioridad:** 🟡 Media

**Solución:**
```python
# Migración de índices compuestos
migrations.AddIndex(
    model_name='strategicobjective',
    index=models.Index(
        fields=['plan', 'bsc_perspective', 'is_active'],
        name='idx_obj_plan_persp_active'
    )
)
```

#### B4: Modal "Convertir Cambio a Proyecto"

**Estado:** Endpoint existe en backend, falta UI
**Impacto:** Alto - Flujo incompleto
**Prioridad:** 🔴 Alta

**Solución:**
Crear componente `ConvertirCambioProyectoModal.tsx` con:
- Pre-llenado automático de datos del cambio
- Validación con Zod
- Mapeo de tipo_cambio → tipo_proyecto
- Verificación de ya convertido

#### B5: Validaciones de Integridad Referencial

**Estado:** Parcial
**Impacto:** Medio - Datos huérfanos posibles
**Prioridad:** 🟡 Media

**Solución:**
```python
class Proyecto(BaseModel):
    def clean(self):
        if self.tipo_origen == 'CAMBIO' and not self.origen_cambio:
            raise ValidationError({
                'origen_cambio': 'Debe especificar el cambio de origen.'
            })
```

#### B6: Dashboard de Trazabilidad

**Estado:** No implementado
**Impacto:** Bajo - Auditoría ISO difícil
**Prioridad:** 🟢 Baja

Vista futura que muestre el flujo completo:
Contexto → Estrategia → Objetivo → Cambio → Proyecto

#### B7: Sincronización Estados Cambio ↔ Proyecto

**Estado:** No implementado
**Impacto:** Alto - Estados inconsistentes
**Prioridad:** 🔴 Alta

**Solución:**
```python
# signals.py
@receiver(post_save, sender=GestionCambio)
def sync_cambio_to_proyecto(sender, instance, **kwargs):
    proyecto = Proyecto.objects.filter(origen_cambio=instance).first()
    if proyecto:
        # Sincronizar estados
        pass
```

---

## Plan de Implementación

### Roadmap General

```
Semana 1-2: Sprint 1 → Stakeholders + DOFA
Semana 3:   Sprint 2 → PESTEL + Porter
Semana 4:   Sprint 3 → Matriz TOWS
Semana 5:   Sprint 4 → Objetivos + KPIs
Semana 6-7: Sprint 5 → Mapa Estratégico
Semana 8:   Sprint 6 → Gestión del Cambio
```

### Sprint 1: Stakeholders + DOFA (Semana 1-2)

#### Objetivo
Implementar identificación de partes interesadas y análisis DOFA completo.

#### Backend Tasks

1. **Reestructurar Partes Interesadas**
   - Mover `partes_interesadas` de `motor_cumplimiento` a `planeacion/stakeholders/`
   - Actualizar `INSTALLED_APPS` en settings
   - Crear migración de datos

2. **Serializers DOFA**
   ```python
   class AnalisisDOFASerializer(serializers.ModelSerializer):
       factores = FactorDOFASerializer(many=True, read_only=True)
       total_fortalezas = serializers.SerializerMethodField()
       total_debilidades = serializers.SerializerMethodField()
       total_oportunidades = serializers.SerializerMethodField()
       total_amenazas = serializers.SerializerMethodField()
   ```

3. **ViewSets con Filtros**
   ```python
   class FactorDOFAFilter(filters.FilterSet):
       tipo = filters.ChoiceFilter(choices=FactorDOFA.TipoFactor.choices)
       impacto = filters.ChoiceFilter(choices=FactorDOFA.NivelImpacto.choices)
       area = filters.NumberFilter(field_name='area__id')
   ```

4. **Endpoints REST**
   - CRUD completo para AnalisisDOFA
   - CRUD para FactorDOFA
   - Endpoint `aprobar/` para análisis
   - Endpoint `estadisticas/` para contadores

#### Frontend Tasks

1. **Instalar Dependencias**
   ```bash
   npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
   npm install @tanstack/react-table
   npm install recharts
   ```

2. **API Client**
   ```typescript
   export const contextoApi = {
     dofa: {
       getAll: (params?) => apiClient.get('/dofa/', { params }),
       aprobar: (id) => apiClient.post(`/dofa/${id}/aprobar/`),
       getEstadisticas: (id) => apiClient.get(`/dofa/${id}/estadisticas/`)
     }
   }
   ```

3. **Hook useContexto**
   ```typescript
   export const useContexto = () => {
     const createDofa = useMutation({
       mutationFn: (data) => contextoApi.dofa.create(data),
       onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: contextoKeys.dofa() })
         toast.success('Análisis DOFA creado')
       }
     })
   }
   ```

4. **Componente DOFAMatrix**
   Matriz 2x2 con:
   - Cuadrantes de colores (verde, azul, amarillo, rojo)
   - Lista de factores por tipo
   - Indicadores de impacto
   - Click para editar

### Sprint 2: PESTEL + Porter (Semana 3)

#### Backend
- Serializers para AnalisisPESTEL y FactorPESTEL
- Serializers para AnalisisPorter y FuerzaPorter
- Endpoints con agregaciones (avg impacto por dimensión)

#### Frontend
- `PESTELRadarChart` con Recharts (radar de 6 dimensiones)
- Heatmap Impacto/Probabilidad
- `PorterDiagram` con visualización de 5 fuerzas

### Sprint 3: Matriz TOWS (Semana 4)

#### Backend
- Serializers EstrategiaTOWS
- Servicio `generar_tows_automatico()` (opcional IA)
- Endpoint POST `/tows/convertir-objetivo/`

#### Frontend
- `TOWSMatrix` con 4 celdas editables
- Botón "Convertir a Objetivo"
- Modal de confirmación con preview

### Sprint 4: Objetivos + KPIs (Semana 5)

#### Backend
- Mejorar serializers de StrategicObjective
- CRUD completo de KPIs
- Endpoint `/kpis/{id}/mediciones/` (POST)
- Cálculo automático de semáforo

#### Frontend
- `ObjectivesTable` con TanStack Table
- `ObjectiveKanban` por estado
- `KPIDashboard` con semáforos
- `TrendChart` de mediciones

### Sprint 5: Mapa Estratégico (Semana 6-7)

#### Backend
- Serializers MapaEstrategico + CausaEfecto
- Servicio `auto_layout()` con dagre
- Endpoint `/mapa/export-image/` (screenshot)

#### Frontend
- `MapaEstrategicoCanvas` con React Flow
- Custom nodes `ObjectiveNode`
- Custom edges `CausaEfectoEdge`
- `BSCLanes` (swimlanes por perspectiva)
- Minimap + Controls
- Modal crear relación causa-efecto

### Sprint 6: Gestión del Cambio (Semana 8)

#### Backend
- Agregar campo `progress` a GestionCambio
- Implementar signals de sincronización
- Validaciones de integridad referencial

#### Frontend
- `CambiosTable` con filtros
- `CambioKanban` drag & drop de estados
- `ConvertirCambioProyectoModal` (B4)
- `CambioTimeline` con eventos

---

## Cronograma de Cierre de Brechas

| Fase | Brechas | Estimación | Dependencias |
|------|---------|------------|--------------|
| **Fase 1** | B1 (progress), B5 (validaciones) | 1 día | Ninguna |
| **Fase 2** | B4 (Modal Convertir) | 2 días | B1 |
| **Fase 3** | B7 (Sincronización estados) | 1 día | B4 |
| **Fase 4** | B2 (Ciclos), B3 (Índices) | 1 día | Ninguna |
| **Fase 5** | B6 (Dashboard trazabilidad) | 3 días | Todas las anteriores |

**Total estimado:** 8 días de desarrollo

---

## Instalación de Dependencias

### Frontend

```bash
cd frontend

# Visualizaciones
npm install reactflow
npm install recharts
npm install @tanstack/react-table

# Drag & Drop
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities

# Layout algorítmico
npm install dagre
npm install @types/dagre -D

# Animaciones
npm install framer-motion

# Utilidades
npm install date-fns
npm install zod
```

---

## Referencias Técnicas

- **React Flow:** https://reactflow.dev/
- **TanStack Table:** https://tanstack.com/table/latest
- **dnd-kit:** https://docs.dndkit.com/
- **Recharts:** https://recharts.org/
- **Framer Motion:** https://www.framer.com/motion/
- **Django REST Framework:** https://www.django-rest-framework.org/
- **drf-spectacular:** https://drf-spectacular.readthedocs.io/

---

## Reglas de Negocio Clave

1. **Un cambio solo puede generar UN proyecto** (validación única)
2. **La conversión debe hacerse en estado PLANIFICADO o posterior**
3. **Los objetivos vinculados al cambio se heredan al proyecto** (automático)
4. **El progreso del cambio se actualiza con las transiciones de estado**
5. **Estados terminales (COMPLETADO/CANCELADO) se sincronizan bidireccionalmente**

---

## Impacto en ISO 9001:2015

Esta arquitectura soporta:

- **Cláusula 6.1**: Acciones para abordar riesgos y oportunidades (Cambios → Proyectos)
- **Cláusula 6.2**: Objetivos de calidad y planificación (Objetivos BSC)
- **Cláusula 6.3**: Planificación de los cambios (GestionCambio workflow)
- **Cláusula 9.1**: Seguimiento, medición, análisis y evaluación (KPIs)

---

**Documento consolidado:** Claude Sonnet 4.5
**Fecha:** 2026-02-06
**Versión:** 2.0
**Estado:** Documentación Arquitectónica Completa
