# Diagrama de Dependencias - Movimiento de Módulos

**Fecha:** 2026-01-11

---

## 📊 Estado Actual de Dependencias

### 1. sistema_documental (HSEQ → gestion_documental)

```
┌─────────────────────────────────────────────────────────────┐
│  sistema_documental (hseq_management)                       │
│  • 10 modelos                                               │
│  • 7 tablas BD: documental_*                                │
└─────────────────────────────────────────────────────────────┘
                    ↓ depende de
        ┌───────────────────────┐
        │  core.User            │
        └───────────────────────┘

DEPENDENCIAS EXTERNAS:
╔══════════════════════════════════════════════════════════════╗
║  ⚠️  DEPENDENCIA CIRCULAR CRÍTICA                            ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  gestion_estrategica/identidad/services.py                  ║
║      ↓ import (línea 106, 411)                              ║
║  hseq_management/sistema_documental/models.py               ║
║      ↓ import (línea 671)                                   ║
║  gestion_estrategica/identidad/models.py                    ║
║                                                              ║
║  BLOQUEA MOVIMIENTO DIRECTO                                 ║
╚══════════════════════════════════════════════════════════════╝

SOLUCIÓN:
┌─────────────────────────────────────────────────────────────┐
│  Crear gestion_documental/ (Nivel 0.5 - Transversal)       │
│  • Rompe la dependencia circular                            │
│  • Módulo usado por todos los niveles                       │
└─────────────────────────────────────────────────────────────┘
```

### 2. contexto_organizacional (motor_riesgos → gestion_estrategica)

```
┌─────────────────────────────────────────────────────────────┐
│  contexto_organizacional (motor_riesgos)                    │
│  • 6 modelos: DOFA, PESTEL, Porter                          │
│  • 6 tablas BD: motor_riesgos_*                             │
└─────────────────────────────────────────────────────────────┘
                    ↓ depende de
        ┌───────────────────────┐
        │  core.User            │
        │  core.base_models     │
        └───────────────────────┘

DEPENDENCIAS EXTERNAS:
╔══════════════════════════════════════════════════════════════╗
║  ✅ NINGUNA DEPENDENCIA EXTERNA                              ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  • Solo depende de core.User                                ║
║  • No hay imports de otros módulos                          ║
║  • No hay ForeignKeys cruzadas                              ║
║                                                              ║
║  MOVIMIENTO SEGURO                                          ║
╚══════════════════════════════════════════════════════════════╝

ALINEACIÓN CONCEPTUAL:
┌─────────────────────────────────────────────────────────────┐
│  DOFA/PESTEL/Porter = Análisis Estratégico                 │
│  ✅ Pertenece a Planeación Estratégica (ISO 31000)         │
│  ✅ Input para formulación de estrategias BSC              │
└─────────────────────────────────────────────────────────────┘
```

### 3. planificacion_sistema (HSEQ → gestion_estrategica)

```
┌─────────────────────────────────────────────────────────────┐
│  planificacion_sistema (hseq_management)                    │
│  • 5 modelos: PlanTrabajo, Objetivo, Programa               │
│  • 6 tablas BD: hseq_plan_*, hseq_objetivo_*                │
└─────────────────────────────────────────────────────────────┘
                    ↓ depende de
        ┌───────────────────────┐
        │  core.User            │
        └───────────────────────┘

DEPENDENCIAS EXTERNAS:
╔══════════════════════════════════════════════════════════════╗
║  ✅ NINGUNA DEPENDENCIA EXTERNA                              ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  • Solo depende de core.User                                ║
║  • Vinculación BSC por campo string (no FK)                 ║
║  • No hay imports de otros módulos                          ║
║                                                              ║
║  MOVIMIENTO SEGURO                                          ║
╚══════════════════════════════════════════════════════════════╝

REDUNDANCIA DETECTADA:
┌─────────────────────────────────────────────────────────────┐
│  PlanTrabajoAnual ≈ StrategicPlan                           │
│  ObjetivoSistema ≈ StrategicObjective                       │
│                                                              │
│  OPCIONES:                                                   │
│  A) Fusionar modelos (unificar planificación)              │
│  B) Mover completo a planeacion/operativo/                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 Nueva Arquitectura Propuesta

```
apps/
│
├── core/                           # Nivel 0: Núcleo
│   ├── User (usado por todos)
│   └── base_models
│
├── gestion_documental/            # Nivel 0.5: NUEVO - Transversal
│   ├── models.py
│   │   ├── TipoDocumento
│   │   ├── PlantillaDocumento
│   │   ├── Documento ──────────────┐
│   │   ├── VersionDocumento        │
│   │   ├── CampoFormulario         │ Usado por
│   │   ├── FirmaDocumento          │ identidad
│   │   └── ControlDocumental       │
│   └── [Resuelve circular] ◄───────┘
│
├── gestion_estrategica/           # Nivel 1: Estratégico
│   ├── configuracion/
│   ├── identidad/
│   │   └── services.py
│   │       └── import gestion_documental ✅
│   ├── organizacion/
│   ├── planeacion/
│   │   ├── contexto/              # NUEVO ← motor_riesgos
│   │   │   ├── models.py
│   │   │   │   ├── AnalisisDOFA
│   │   │   │   ├── FactorDOFA
│   │   │   │   ├── EstrategiaTOWS
│   │   │   │   ├── AnalisisPESTEL
│   │   │   │   ├── FactorPESTEL
│   │   │   │   └── FuerzaPorter
│   │   │   └── urls.py
│   │   ├── estrategia/            # Existente (renombrado)
│   │   │   └── models.py
│   │   │       ├── StrategicPlan
│   │   │       ├── StrategicObjective
│   │   │       └── KPIObjetivo
│   │   └── operativo/             # NUEVO ← hseq_management
│   │       └── models.py          # (o fusionar con estrategia)
│   │           ├── PlanTrabajoAnual
│   │           ├── ActividadPlan
│   │           ├── ObjetivoSistema
│   │           ├── ProgramaGestion
│   │           └── ActividadPrograma
│   ├── gestion_proyectos/
│   └── revision_direccion/
│
├── motor_riesgos/                 # Nivel 2: Cumplimiento
│   ├── [contexto_organizacional REMOVIDO] ✅
│   ├── riesgos_procesos/
│   ├── ipevr/
│   ├── aspectos_ambientales/
│   ├── riesgos_viales/
│   ├── sagrilaft_ptee/
│   └── seguridad_informacion/
│
└── hseq_management/               # Nivel 3: Torre de Control
    ├── [sistema_documental REMOVIDO] ✅
    ├── [planificacion_sistema REMOVIDO] ✅
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

---

## 🔄 Flujo de Datos Post-Migración

### Antes (con circular):
```
┌───────────────────┐         ┌───────────────────┐
│  identidad        │ ───────>│  sistema_documental│
│  (Nivel 1)        │<─────── │  (Nivel 3)        │
└───────────────────┘         └───────────────────┘
        CIRCULAR ❌
```

### Después (resuelto):
```
┌───────────────────┐
│  gestion_documental│  Nivel 0.5 (Transversal)
│                   │
└─────────┬─────────┘
          │ usado por
   ┌──────┴──────┬──────────┬──────────┐
   ↓             ↓          ↓          ↓
identidad    calidad    proyectos   hseq
(Nivel 1)   (Nivel 3)  (Nivel 1)  (Nivel 3)
```

---

## 📋 Checklist de Validación

### Backend

- [ ] **sistema_documental**
  - [ ] Crear app `gestion_documental/`
  - [ ] Migrar 10 modelos
  - [ ] Renombrar 7 tablas (mantener prefijo `documental_`)
  - [ ] Actualizar imports en `identidad/services.py`
  - [ ] Actualizar imports en `sistema_documental/views.py`
  - [ ] Actualizar INSTALLED_APPS en settings.py
  - [ ] Actualizar URLs en config/urls.py
  - [ ] Tests: validar integridad BD
  - [ ] Tests: validar servicios de identidad

- [ ] **contexto_organizacional**
  - [ ] Crear `planeacion/contexto/`
  - [ ] Migrar 6 modelos
  - [ ] Renombrar 6 tablas: `motor_riesgos_*` → `planeacion_*`
  - [ ] Actualizar INSTALLED_APPS
  - [ ] Actualizar URLs en motor_riesgos/urls.py (eliminar)
  - [ ] Actualizar URLs en gestion_estrategica/planeacion/urls.py (agregar)
  - [ ] Tests: validar migración
  - [ ] Tests: validar queries

- [ ] **planificacion_sistema**
  - [ ] Decidir: Fusionar vs Mover completo
  - [ ] Si fusionar: combinar con `StrategicPlan`
  - [ ] Si mover: crear `planeacion/operativo/`
  - [ ] Migrar 5 modelos
  - [ ] Renombrar 6 tablas: `hseq_*` → `planeacion_*`
  - [ ] Actualizar INSTALLED_APPS
  - [ ] Actualizar URLs
  - [ ] Tests: validar

### Frontend

- [ ] **Archivos**
  - [ ] Mover/crear `gestion-documental/` (o integrar en gestion-estrategica)
  - [ ] Mover `SistemaDocumentalPage.tsx`
  - [ ] Mover `ContextoOrganizacionalPage.tsx`
  - [ ] Mover `PlanificacionSistemaPage.tsx`

- [ ] **Rutas**
  - [ ] Actualizar `routes/index.tsx`
  - [ ] Actualizar lazy imports
  - [ ] Actualizar paths

- [ ] **Menú**
  - [ ] Actualizar `Sidebar.tsx`
  - [ ] Eliminar de HSEQ: sistema_documental, planificacion_sistema
  - [ ] Eliminar de Riesgos: contexto_organizacional
  - [ ] Agregar en Estratégica: contexto, planificacion

- [ ] **Tests**
  - [ ] Tests de rutas
  - [ ] Tests de navegación
  - [ ] Tests de lazy loading

### Base de Datos

- [ ] **Pre-migración**
  - [ ] Backup completo BD
  - [ ] Verificar integridad pre-migración
  - [ ] Contar registros por tabla

- [ ] **Migración**
  - [ ] Ejecutar migraciones en orden
  - [ ] Verificar renombrado de tablas
  - [ ] Verificar ForeignKeys intactas
  - [ ] Verificar no hay registros huérfanos

- [ ] **Post-migración**
  - [ ] Contar registros (debe coincidir)
  - [ ] Ejecutar queries de negocio
  - [ ] Validar performance

---

## 🚦 Semáforo de Riesgo

| Módulo | Complejidad | Dependencias | Datos | Riesgo Global |
|--------|-------------|--------------|-------|---------------|
| `sistema_documental` | 🔴 Alta (10 modelos) | 🔴 Circular | 🟡 Media | 🔴 **ALTO** |
| `contexto_organizacional` | 🟢 Baja (6 modelos) | 🟢 Ninguna | 🟢 Baja | 🟢 **BAJO** |
| `planificacion_sistema` | 🟡 Media (5 modelos) | 🟢 Ninguna | 🟡 Media | 🟡 **MEDIO** |

---

## 📈 Impacto Estimado

### Líneas de Código Afectadas

| Tipo | sistema_documental | contexto_organizacional | planificacion_sistema | Total |
|------|-------------------|------------------------|----------------------|-------|
| Modelos | ~1125 líneas | ~486 líneas | ~1005 líneas | ~2616 |
| Views | ~500 líneas | ~300 líneas | ~200 líneas | ~1000 |
| Serializers | ~300 líneas | ~200 líneas | ~150 líneas | ~650 |
| URLs | ~50 líneas | ~30 líneas | ~30 líneas | ~110 |
| Tests | ~200 líneas | ~100 líneas | ~100 líneas | ~400 |
| Frontend | ~800 líneas | ~500 líneas | ~400 líneas | ~1700 |
| **TOTAL** | **~2975** | **~1616** | **~1885** | **~6476** |

### Endpoints Afectados

- `sistema_documental`: ~20 endpoints
- `contexto_organizacional`: ~15 endpoints
- `planificacion_sistema`: ~10 endpoints
- **Total**: ~45 endpoints requieren actualización de URLs

---

**Próximos Pasos:**
1. Aprobar arquitectura propuesta
2. Crear branch `feature/refactor-module-structure`
3. Ejecutar Fase 1: Crear `gestion_documental/`

**Ver Detalles Completos:** `docs/ANALISIS-IMPACTO-MOVIMIENTO-MODULOS.md`
