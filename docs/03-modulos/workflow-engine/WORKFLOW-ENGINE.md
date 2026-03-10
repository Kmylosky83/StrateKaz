# Workflow Engine — Modulo C2

**Capa:** C2 (Operaciones) | **Grupo visual:** NIVEL_OPS | **Color:** `#10B981`

## Sub-apps (4)

| Sub-app | App label | Proposito |
|---------|-----------|-----------|
| disenador_flujos | `workflow_engine_disenador_flujos` | Editor visual BPMN, nodos, transiciones |
| ejecucion | `workflow_engine_ejecucion` | Instancias de flujo, tareas, asignaciones |
| monitoreo | `workflow_engine_monitoreo` | Dashboard de flujos, tiempos, cuellos de botella |
| firma_digital | `workflow_engine_firma_digital` | Firma electronica, cadena de aprobacion |

## Modelos: 27

## Backend
- **Path:** `backend/apps/workflow_engine/`
- **API prefix:** `/api/workflows/`

## Frontend
- **Feature:** `frontend/src/features/workflows/`
- **Ruta:** `/workflows`

## Documentacion detallada
- Ver `docs/02-desarrollo/backend/WORKFLOWS-FIRMAS.md` para arquitectura completa de workflows y firmas digitales.

## Dependencias cross-module
- Usado por: TODOS los modulos C2 (aprobaciones, firmas, flujos de trabajo)
- Lee de: talent_hub (aprobadores), core (RBAC)

## Estado
Backend funcional con diseñador de flujos y firma digital. Frontend con editor visual React Flow.

---
> Documentacion skeleton. Expandir al desarrollar el modulo.
