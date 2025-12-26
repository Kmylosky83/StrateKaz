# SEMANA 8 - PLAN DE EJECUCIÓN 200%

**Fecha:** 25 Diciembre 2025
**Objetivo:** Motor de Riesgos + Workflow Engine (Adelantar Semanas 9-10)
**Modo:** Agentes paralelos para máxima eficiencia

---

## ANÁLISIS PREVIO

### Estado Semana 7 (Completada)
- motor_cumplimiento: 4 apps, 18 modelos, 101 tests
- Partes Interesadas y Reglamentos: YA COMPLETADOS

### Código Existente a Revisar

**Motor de Riesgos (estructura existe, modelos parciales):**
```
backend/apps/motor_riesgos/
├── ipevr/              → Modelos GTC-45 (PARCIAL - revisar)
├── riesgos_procesos/   → Modelos riesgos (PARCIAL)
├── aspectos_ambientales/ → Modelos ambientales (PARCIAL)
├── riesgos_viales/     → Modelos PESV (PARCIAL)
├── contexto_organizacional/ → DOFA, PESTEL (PARCIAL)
├── seguridad_informacion/ → ISO 27001 (PARCIAL)
└── sagrilaft_ptee/     → Antilavado (PARCIAL)
```

**Workflow Engine (estructura existe, modelos completos):**
```
backend/apps/workflow_engine/
├── disenador_flujos/   → Modelos BPMN (1267 líneas - COMPLETO)
├── ejecucion/          → Ejecución workflows (PARCIAL)
└── monitoreo/          → Dashboard (PARCIAL)
```

---

## PLAN DE EJECUCIÓN - 6 AGENTES PARALELOS

### FASE 1: AUDITORÍA Y AJUSTE (30 min)

| # | Agente | Tarea | Archivos |
|---|--------|-------|----------|
| 1 | `django-master` | Auditar motor_riesgos/ipevr/models.py, migrar a BaseCompanyModel | ipevr/*.py |
| 2 | `django-master` | Auditar contexto_organizacional, completar DOFA/PESTEL | contexto/*.py |
| 3 | `django-master` | Auditar workflow_engine/disenador_flujos, verificar políticas | disenador_flujos/*.py |
| 4 | `qa-testing-specialist` | Revisar tests existentes en motor_riesgos | tests/*.py |
| 5 | `react-architect` | Auditar frontend motor_riesgos si existe | frontend/features/riesgos/ |
| 6 | `documentation-expert` | Actualizar cronograma Semana 7→8 | CRONOGRAMA-26-SEMANAS.md |

### FASE 2: IMPLEMENTACIÓN BACKEND (60 min)

| # | Agente | Tarea | Entregables |
|---|--------|-------|-------------|
| 1 | `django-master` | Completar motor_riesgos/ipevr con GTC-45 | Modelos, Serializers, ViewSets |
| 2 | `django-master` | Completar motor_riesgos/contexto_organizacional | DOFA, PESTEL, Porter, PCI/POAM |
| 3 | `django-master` | Completar motor_riesgos/riesgos_procesos | Matriz 5x5, tratamientos |
| 4 | `django-master` | Completar workflow_engine/ejecucion | Motor BPM, instancias |
| 5 | `django-master` | Completar workflow_engine/monitoreo | Dashboard, métricas |
| 6 | `data-architect` | Crear migraciones consolidadas | 0001_initial.py |

### FASE 3: IMPLEMENTACIÓN FRONTEND (60 min)

| # | Agente | Tarea | Entregables |
|---|--------|-------|-------------|
| 1 | `react-architect` | Tipos TypeScript motor_riesgos | types/riesgos.ts |
| 2 | `react-architect` | API clients motor_riesgos | api/riesgosApi.ts |
| 3 | `react-architect` | Hooks motor_riesgos | hooks/useRiesgos.ts |
| 4 | `react-architect` | IPEVRTab con matriz GTC-45 | components/IPEVRTab.tsx |
| 5 | `react-architect` | ContextoTab con DOFA visual | components/ContextoTab.tsx |
| 6 | `react-architect` | WorkflowDesigner con React Flow | components/WorkflowDesigner.tsx |

### FASE 4: TESTING (30 min)

| # | Agente | Tarea | Objetivo |
|---|--------|-------|----------|
| 1 | `qa-testing-specialist` | Tests motor_riesgos/ipevr | 25+ tests |
| 2 | `qa-testing-specialist` | Tests motor_riesgos/contexto | 20+ tests |
| 3 | `qa-testing-specialist` | Tests workflow_engine | 30+ tests |

---

## CHECKLIST DE POLÍTICAS DE DESARROLLO

### Backend
- [ ] Todos los modelos heredan de `BaseCompanyModel`
- [ ] ViewSets usan `StandardViewSetMixin`
- [ ] Campo ordenamiento: `orden` (no `order`)
- [ ] Campos de negocio en español
- [ ] Campos de auditoría en inglés (created_at, updated_at)
- [ ] Enums en minúsculas
- [ ] Type hints en funciones públicas
- [ ] Docstrings en clases

### Frontend
- [ ] Tipos TypeScript sincronizados con backend
- [ ] Usar `useGenericCRUD` para operaciones CRUD
- [ ] Usar `useFormModal` para modales
- [ ] Componentes funcionales con hooks
- [ ] Enums sincronizados con backend

### Testing
- [ ] Cobertura mínima 80%
- [ ] Tests de modelos
- [ ] Tests de ViewSets
- [ ] Tests de serializers

---

## MODELOS A MIGRAR/COMPLETAR

### motor_riesgos/ipevr (GTC-45)

```python
# Modelos existentes que necesitan migración a BaseCompanyModel:
- ClasificacionPeligro → TimestampedModel (catálogo global)
- Peligro → BaseCompanyModel
- MatrizIPEVR → BaseCompanyModel
- ControlPropuesto → BaseCompanyModel
```

### motor_riesgos/contexto_organizacional

```python
# Modelos a crear/completar:
- AnalisisDOFA → BaseCompanyModel
- FactorDOFA → BaseCompanyModel (tipo: F, O, D, A)
- AnalisisPESTEL → BaseCompanyModel
- FactorPESTEL → BaseCompanyModel (tipo: P, E, S, T, E, L)
- FuerzaPorter → BaseCompanyModel
- AnalisisPCI → BaseCompanyModel
- CapacidadInterna → BaseCompanyModel
- AnalisisPOAM → BaseCompanyModel
- OportunidadAmenaza → BaseCompanyModel
```

### workflow_engine/ejecucion

```python
# Modelos a crear (complementan disenador_flujos):
- InstanciaFlujo → BaseCompanyModel
- TareaInstancia → BaseCompanyModel
- HistorialTarea → TimestampedModel
- DelegacionTarea → BaseCompanyModel
- NotificacionWorkflow → BaseCompanyModel
```

---

## COMANDOS DE EJECUCIÓN

### Iniciar Fase 1 - Auditoría (6 agentes paralelos)

```bash
# Ejecutar en Claude Code:
# Lanzar 6 agentes Task simultáneos
```

### Verificar migraciones

```bash
cd backend
python manage.py makemigrations motor_riesgos workflow_engine
python manage.py migrate
```

### Ejecutar tests

```bash
cd backend
pytest apps/motor_riesgos/ -v --cov
pytest apps/workflow_engine/ -v --cov
```

---

## MÉTRICAS DE ÉXITO

| Métrica | Objetivo |
|---------|----------|
| Modelos migrados | 100% a BaseCompanyModel |
| ViewSets con mixin | 100% con StandardViewSetMixin |
| Tests creados | 75+ nuevos tests |
| Cobertura | >85% |
| Frontend components | 6+ componentes principales |
| Tiempo total | <3 horas (eficiencia 200%) |

---

## RESULTADO ESPERADO

Al finalizar Semana 8:
- Motor de Riesgos completamente funcional (7 apps)
- Workflow Engine operativo (3 apps)
- 75+ tests nuevos
- Frontend con tabs de Riesgos y Workflows
- Documentación actualizada

**Versión resultante:** 2.0.0-alpha.9
