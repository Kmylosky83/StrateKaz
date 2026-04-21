# Tecnología: Automatizaciones & Workflows (aprobado 2026-03-10)

> **ESTADO: ROADMAP CONGELADO — No ejecutado.**
> Se activa en el sprint de L30+ (Production Ops / HSEQ / Sales CRM).
> El diseño está aprobado; ninguna línea de código fue escrita aún.
> No consume ni modifica código LIVE hoy.

## Stack de automatización

### 1. django-fsm (State Machine)
- Transiciones de estado declarativas para todas las entidades con ciclo de vida
- Condiciones pre-transición, hooks post-transición, permisos por transición
- Package: `django-fsm` (pip install django-fsm)

### Entidades con FSM
```
Auditoría:    PROGRAMADA → PLANIFICADA → EN_EJECUCIÓN → INFORME → CERRADA
Hallazgo:     IDENTIFICADO → COMUNICADO → EN_TRATAMIENTO → VERIFICADO → CERRADO
NC:           ABIERTA → ANÁLISIS_CAUSA → PLAN_ACCIÓN → IMPLEMENTACIÓN → VERIFICACIÓN → CERRADA
Proyecto:     INICIACIÓN → PLANIFICACIÓN → EJECUCIÓN → CIERRE
Estrategia:   FORMULADA → APROBADA → EN_EJECUCIÓN → EVALUADA
Plan Trabajo: BORRADOR → APROBADO → EN_EJECUCIÓN → COMPLETADO
Programa:     BORRADOR → APROBADO → EN_EJECUCIÓN → COMPLETADO
```

### 2. EventBus centralizado (custom, ligero)
- Ubicación: `backend/utils/event_bus.py`
- Patrón pub/sub: módulo A emite evento, módulo B consume con `apps.get_model()`
- Respeta regla "C2 NUNCA importa de otro C2"
- Handlers se registran en `events.py` de cada app
- Ejecución async via Celery

### Automatizaciones cross-module
```
EVENTO                              →  ACCIÓN
estrategia.aprobada                 →  Crear Proyecto o Acción de Mejora
hallazgo.created (NC)               →  Crear No Conformidad
hallazgo.en_tratamiento             →  Crear Acción Correctiva
riesgo.tratamiento_definido         →  Crear Acción o Proyecto
programa.aprobado                   →  Crear actividades en Plan de Trabajo
indicador.fuera_de_meta             →  Crear Acción Correctiva
nc.verificada_no_eficaz             →  Re-abrir NC / Escalar
plan_trabajo.actividad_vencida      →  Notificación + alerta
auditoria.cerrada                   →  Actualizar métricas programa
```

### 3. Celery (ya instalado)
- Tareas async para handlers del EventBus
- Beat para verificación periódica (vencimientos, alertas)
- Cola `automations` para handlers de eventos

## Implementación
- Fase A: REORG (seed + permisos + rutas)
- Fase B: BUILD (B1: infra EventBus+FSM, B2: modelos+API, B3: auditorías+acciones, B4: automations+FE)
