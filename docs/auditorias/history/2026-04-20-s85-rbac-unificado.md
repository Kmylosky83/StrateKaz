# Sesión S8.5 — RBAC Unificado para módulos LIVE

> **Fecha:** 2026-04-20 · **Rama:** `main` · **Commit de cierre:** pendiente push.
> **Scope:** L0–L20 (core, ia, fundacion, workflow_engine, audit_system,
> gestion_documental, mi_equipo). **Fuera de alcance:** supply_chain,
> catalogo_productos, y cualquier otro módulo C2 no-LIVE.
>
> Ref: [docs/history/2026-04-20-auditoria-s85-supply-chain.md](2026-04-20-auditoria-s85-supply-chain.md) — auditoría origen.

---

## Resumen ejecutivo

**Cierre ajustado acordado con Camilo**: ver conversación de sesión —
Paso 1 quedó vacío porque el hallazgo de auditoría se generalizó
incorrectamente a módulos LIVE, Paso 2 se cerró completo, Paso 3 se adoptó
**un ejemplo canónico** (EntrevistasTab) + documentación de deuda, Paso 4 se
difiere a sesión dedicada.

| Paso | Estado | Detalle |
|------|--------|---------|
| Paso 1 — Registrar secciones faltantes en seed | ✅ no-op | Seed LIVE ya completo. No hay commit |
| Paso 2 — Migrar ViewSets LIVE a RBAC unificado | ✅ cerrado | Commit `3db17b11` |
| Paso 3 — Adoptar helpers FE | 🟡 parcial | Commit canónico + deuda documentada abajo |
| Paso 4 — Tests con cargos restringidos | 🔴 diferido | Requiere sesión dedicada |

---

## Paso 1 — Seed de secciones LIVE (no-op)

### Hallazgo que invalidó el paso

La auditoría S8.5 (2026-04-20-auditoria-s85-supply-chain.md) reportó
`H-S85-permission-codes-no-registrados` como hallazgo CRÍTICO sistémico.
**La realidad**: ese hallazgo aplicaba únicamente a `supply_chain` y
`catalogo_productos` (NO-LIVE). Para todos los módulos LIVE (L0–L20) el seed
`seed_estructura_final.py` ya registra todas las secciones que el frontend
consulta.

### Evidencia del crosscheck

| Sección FE usada | Registrada en seed | Línea |
|------------------|--------------------|-------|
| `fundacion.cargos` | ✅ | 631 |
| `fundacion.empresa` | ✅ | 604 |
| `fundacion.partes_interesadas` | ✅ | 615 |
| `fundacion.analisis_contexto` | ✅ | 616 |
| `fundacion.valores` | ✅ | 618 |
| `audit_system.tareas` | ✅ | 1358 |
| `audit_system.reglas_alerta` | ✅ | 1355 |
| `audit_system.notificaciones` | ✅ | 1352 |
| `audit_system.logs_auditoria` | ✅ | 1349 |
| `workflow_engine.flujos` | ✅ | 717 |
| `workflow_engine.instancias` | ✅ | 720 |
| `workflow_engine.metricas` | ✅ | 723 |
| `gestion_documental.repositorio` | ✅ | 664 |
| `gestion_documental.dashboard` | ✅ | 663 |
| `gestion_documental.en_proceso` | ✅ | 665 |
| `gestion_documental.archivo` | ✅ | 666 |
| `gestion_documental.configuracion` | ✅ | 667 |
| `configuracion_plataforma.modulos` | ✅ | 1323 |
| `configuracion_plataforma.consecutivos` | ✅ | 1324 |
| `configuracion_plataforma.catalogos` | ✅ | 1327 |
| `configuracion_plataforma.integraciones` | ✅ | 1330 |
| `talent_hub.perfiles_cargo` | ✅ | 745 |
| `talent_hub.vacantes` | ✅ | 748 |
| `talent_hub.candidatos` | ✅ | 749 |
| `talent_hub.contratacion` | ✅ | 750 |
| `talent_hub.directorio` | ✅ | 753 |
| `talent_hub.hoja_vida` | ✅ | 754 |
| `talent_hub.contratos` | ✅ | 755 |
| `talent_hub.programas_induccion` | ✅ | 758 |
| `talent_hub.afiliaciones` | ✅ | 759 |
| `talent_hub.entrega_dotacion` | ✅ | 760 |

### Hallazgo menor (no bloqueante)

- `gestion_documental.ejecucion_auditoria` está usada en
  [AuditoriasInternasPage.tsx](../../frontend/src/features/gestion-documental/pages/AuditoriasInternasPage.tsx)
  pero **no está registrada** en el seed. Sin embargo, **esa página no está
  en el router LIVE** (grep en `frontend/src/routes/` confirmó 0 matches) y
  `apps.auditoria_interna` **no está en `base.py` TENANT_APPS**. Es
  scaffolding de módulo C2 futuro. No-LIVE → fuera de scope.

### Corrección del reporte de auditoría

El hallazgo original `H-S85-permission-codes-no-registrados` se reformula:

> **H-S85-permission-codes-no-registrados (revisado)**: aplica solo a
> `supply_chain.*` y `catalogo_productos.*`. Estas secciones están en
> `frontend/src/constants/permissions.ts` pero NO en el seed. Fuera de
> alcance de S8.5. Se resolverá cuando supply_chain y catalogo_productos
> entren a fase de consolidación LIVE.

---

## Paso 2 — Migración de ViewSets LIVE ✅

**Commit**: `3db17b11` · `feat(rbac): migrar ViewSets de modulos Live a RBAC unificado`

### Descubrimiento inicial

`GranularActionPermission` (RBAC v4.1) **ya existe** en
[backend/apps/core/permissions.py:609](../../backend/apps/core/permissions.py).
API: `section_code` + `granular_action_map`. Mapea HTTP→flag
automáticamente (GET→can_view, POST→can_create, PUT/PATCH→can_edit,
DELETE→can_delete). Usa `CombinedPermissionService` con fallback legacy.

### Estado real de la migración antes de S8.5

~95% de ViewSets de módulos LIVE **ya usaban** `GranularActionPermission`
(migración progresiva de sesiones previas). Se identificaron 11 ViewSets
pendientes.

### Archivos migrados

**1. `backend/apps/core/viewsets_rbac.py` — 8 ViewSets a `IsSuperAdmin`**

| ViewSet | Antes | Después |
|---------|-------|---------|
| PermissionViewSet | `[IsAuthenticated]` | `[IsAuthenticated, IsSuperAdmin]` |
| RoleViewSet | `[IsAuthenticated]` | `[IsAuthenticated, IsSuperAdmin]` |
| GroupViewSet | `[IsAuthenticated]` | `[IsAuthenticated, IsSuperAdmin]` |
| MenuViewSet | `[IsAuthenticated]` | `[IsAuthenticated, IsSuperAdmin]` |
| RBACStatsViewSet | `[IsAuthenticated]` | `[IsAuthenticated, IsSuperAdmin]` |
| RiesgoOcupacionalViewSet | `[IsAuthenticated]` | `[IsAuthenticated, IsSuperAdmin]` |
| RolAdicionalViewSet | `[IsAuthenticated]` | `[IsAuthenticated, IsSuperAdmin]` |
| UserRolesAdicionalesViewSet | `[IsAuthenticated]` | `[IsAuthenticated, IsSuperAdmin]` |

**Razón**: son gestión de la estructura RBAC del tenant. `IsAuthenticated`
puro permitía a cualquier usuario autenticado editar roles/grupos del
sistema — **bug latente de seguridad**. Hoy solo superadmin.

**2. `backend/apps/core/viewsets.py` PermisoViewSet**

| | Antes | Después |
|---|-------|---------|
| PermisoViewSet | `[IsAuthenticated, CanManageUsers]` (nivel 2+) | `[IsAuthenticated, IsSuperAdmin]` |

**Razón**: catálogo de permisos sistema, sensible.

**3. `backend/apps/gestion_estrategica/identidad/views_valores_vividos.py` — 2 ViewSets a `GranularActionPermission`**

| ViewSet | Antes | Después | section_code |
|---------|-------|---------|--------------|
| ValorVividoViewSet | `[IsAuthenticated]` | `[IsAuthenticated, GranularActionPermission]` | `valores` |
| ConfiguracionMetricaValorViewSet | `[IsAuthenticated]` | `[IsAuthenticated, GranularActionPermission]` | `valores` |

**Razón**: gestión de valores corporativos, sección `valores` ya registrada en seed (línea 618).

### ViewSets NO migrados (excepciones legítimas)

Aplicado STOP rule #2 del brief (lógica de negocio no trivial):

| Categoría | Archivos | Razón |
|-----------|----------|-------|
| Self-service del user | `core/views/{two_factor_views,onboarding_views,user_preferences_views,setup_password_views}.py`, `viewsets_session.py` | Lógica "solo yo" — `IsAuthenticated` + filtro en `get_queryset` |
| Stats ReadOnly | `viewsets_strategic.py`, `identidad/views_stats.py` | Lectura de agregados sin sensibilidad |
| Data maestra ReadOnly | `core/viewsets_datos_maestros.py` (TipoDocumento, Departamento, Ciudad), `identidad/views_config.py` (EstadoPolitica, TipoPolitica, RolFirmante, EstadoFirma) | Catálogos compartidos públicos |
| ReadOnly catálogo de cargos | `core/viewsets.py` CargoViewSet | Lectura pública del catálogo del tenant |
| Portal Jefe MSS | `mi_equipo/api/views.py` (5 APIViews) | Lógica de scope-by-área en `get_queryset` — no se mapea a RBAC granular trivialmente |
| Acciones públicas | `seleccion_contratacion/views.py`: VacantePublica, ResponderPruebaDinamica, ResponderEntrevistaAsincronica | `AllowAny` intencional — portal candidato externo |

### Validación

- `manage.py check --settings=development`: **0 issues**.
- Archivos modificados: 3
- Líneas insertadas: +15, eliminadas: −12

---

## Paso 3 — Adopción de helpers RBAC en FE 🟡

### 3.1 Archivo canónico migrado

**`frontend/src/features/mi-equipo/components/seleccion/EntrevistasTab.tsx`**

Adoptado el patrón canónico de RBAC FE con comentario exhaustivo al inicio
del archivo. Sirve como **referencia para las futuras migraciones**.

Cambios aplicados:
- `import { useSectionPermissions } from '@/components/common/ProtectedAction'`
- `import { Modules, Sections } from '@/constants/permissions'`
- Hook en el componente padre:
  ```tsx
  const { canCreate, canEdit, canDelete } = useSectionPermissions(
    Modules.TALENT_HUB,
    Sections.CANDIDATOS
  );
  ```
- Flags pasados como props a `SyncEntrevistasView` y `AsyncEntrevistasView`.
- Botones "Programar Entrevista" / "Nueva Entrevista Async" → condicionados con `canCreate`.
- Botones "Realizar" / "Reenviar email" / "Evaluar" → condicionados con `canEdit`.
- Botones "Cancelar" → condicionados con `canDelete`.
- Botones "Ver evaluación" / "Copiar link" → se mantienen visibles (acciones de lectura / copia de token público, no requieren modificar datos).

### 3.2 Validación

- `npx tsc --noEmit`: ✅ sin errores.
- `npx eslint EntrevistasTab.tsx --max-warnings=0`: ✅ sin warnings.

### 3.3 Deuda documentada — Componentes LIVE pendientes de migrar

Grep `ConfirmDialog|handleDelete|onDelete` en features LIVE sin ningún
helper RBAC (`canDo`, `usePermissions`, `ProtectedAction`, `CanCreate/Edit/Delete`,
`useSectionPermissions`) identificó **16 archivos LIVE restantes**:

#### Modales hijos (probablemente OK — el padre ya protege la apertura)

Estos son modales que se abren desde un botón "Crear/Editar" del componente
padre. Si el padre ya tiene `canDo`, el modal no necesita guard propio. Aun
así, revisar en S8.6+ para confirmar.

1. `frontend/src/features/gestion-estrategica/components/modals/AnalisisDofaFormModal.tsx`
2. `frontend/src/features/gestion-estrategica/components/modals/AnalisisPestelFormModal.tsx`
3. `frontend/src/features/gestion-estrategica/components/modals/CausaEfectoFormModal.tsx`
4. `frontend/src/features/gestion-estrategica/components/modals/EncuestaFormModal.tsx`
5. `frontend/src/features/gestion-documental/components/DocumentoDetailModal.tsx`
6. `frontend/src/features/gestion-documental/components/DocumentoReaderModal.tsx`

#### Componentes con botones de acción — **migrar siguiendo patrón EntrevistasTab**

7. `frontend/src/features/gestion-estrategica/components/OrgTemplateSelector.tsx`
   → Sección: `fundacion.areas` o `fundacion.mapa_procesos`
8. `frontend/src/features/gestion-estrategica/components/ValoresDragDrop.tsx`
   → Sección: `fundacion.valores`
9. `frontend/src/features/gestion-documental/pages/GestionDocumentalPage.tsx`
   → Sección: según tab activo (`repositorio`, `archivo`, `en_proceso`, etc.)
10. `frontend/src/features/workflows/components/nodes/BpmnNodes.tsx`
    → Sección: `workflow_engine.flujos`
11. `frontend/src/features/workflows/components/WorkflowDesignerCanvas.tsx`
    → Sección: `workflow_engine.flujos`
12. `frontend/src/features/workflows/pages/EjecucionPage.tsx`
    → Sección: `workflow_engine.instancias`
13. `frontend/src/features/audit-system/pages/NotificacionesPage.tsx`
    → Sección: `audit_system.notificaciones`
14. `frontend/src/features/mi-equipo/components/onboarding/EppActivosTab.tsx`
    → Sección: `talent_hub.entrega_dotacion`

#### Falso positivo / no-componente

15. `frontend/src/features/workflows/types/workflow.types.ts` — archivo de
    tipos TS, no renderiza UI. Descartado.

#### Confusión de scope (ya migrado parcialmente, verificar)

16. Revisar en S8.6: `AuditoriasInternasPage.tsx` (gestion_documental) —
    aunque está en `features/gestion-documental/pages/`, la página no está
    en el router LIVE (ver Paso 1, hallazgo menor). Revisar cuando el
    módulo Auditoría Interna (C2) entre a LIVE.

**Esfuerzo estimado por archivo**: 15–30 min cada uno siguiendo el patrón
de EntrevistasTab. Total estimado: **~5–6 horas** para los ~10 componentes
reales (sin contar modales hijos y falsos positivos).

### 3.4 Sidebar tabs (pendiente de inventario detallado)

El brief pedía "confirmar que cada tab del sidebar chequea acceso".
El sidebar usa `section_ids` del backend (generado por `compute_user_rbac`)
— el filtrado es **implícito** vía `TabSection.is_enabled` + `CargoSectionAccess`.
El chequeo ya funciona. Verificación formal diferida a S8.6.

---

## Paso 4 — Tests con cargos restringidos 🔴 (diferido)

### Razón del diferir

El brief requiere:
- **4.1**: Fixtures de cargo nivel 1 sin create/edit/delete + cargo nivel 2 con view+create sin delete.
- **4.2**: Tests backend (por cada ViewSet migrado) con cargo restringido → 403 en POST/PATCH/DELETE.
- **4.3**: Tests frontend (vitest) para `<CanCreate>` y `useSectionPermissions`.

Esto requiere:
- Crear helpers en `apps/core/tests/base.py` (BaseTenantTestCase) para
  "crear cargo con CargoSectionAccess granulares".
- Infraestructura vitest para mockear `useAuthStore.user.permission_codes`.
- Probablemente 15–25 tests nuevos entre BE y FE.

**No cabe** en esta sesión (contexto > 70%). Se difiere a sesión dedicada.

### Plan para la sesión futura (S8.7 o equivalente)

1. Agregar en `apps/core/tests/base.py`:
   - `BaseTenantTestCase.create_cargo_with_sections(permissions: list)` —
     crea cargo + CargoSectionAccess con flags granulares.
   - `BaseTenantTestCase.create_user_with_limited_cargo(permissions: list)`
     — helper combinado.

2. Tests backend por cada ViewSet migrado en Paso 2:
   - `test_role_viewset_limited_cargo_403_on_create`
   - `test_role_viewset_limited_cargo_200_on_list`
   - `test_valor_vivido_limited_cargo_403_on_delete`
   - `test_valor_vivido_limited_cargo_200_on_view`
   - ... (un test por combinación relevante)

3. Tests frontend vitest:
   - `CanCreate.test.tsx` — no renderiza children si `permission_codes` no incluye `.create`
   - `useSectionPermissions.test.tsx` — flags correctos según input

4. Agregar al CI `ci.yml` los archivos como bloqueantes.

---

## Commits creados esta sesión

| Hash | Mensaje | Paso |
|------|---------|------|
| `3db17b11` | `feat(rbac): migrar ViewSets de modulos Live a RBAC unificado` | Paso 2 |
| (pendiente) | `feat(rbac): adoptar patron canonico RBAC FE en EntrevistasTab + reporte S8.5` | Paso 3 + reporte |

Ningún commit en Paso 1 (no-op). Ningún commit en Paso 4 (diferido).

---

## Archivos tocados

### Backend (Paso 2)
- `backend/apps/core/viewsets.py`
- `backend/apps/core/viewsets_rbac.py`
- `backend/apps/gestion_estrategica/identidad/views_valores_vividos.py`

### Frontend (Paso 3)
- `frontend/src/features/mi-equipo/components/seleccion/EntrevistasTab.tsx`

### Documentación
- `docs/history/2026-04-20-s85-rbac-unificado.md` (este archivo)

---

## Validación

- ✅ `manage.py check --settings=development`: 0 issues
- ✅ `npx tsc --noEmit`: 0 errores
- ✅ `npx eslint EntrevistasTab.tsx --max-warnings=0`: 0 warnings
- ⏸️ CI remoto: pendiente tras push
- ⏸️ Browseo manual en tenant demo: pendiente S8.6

---

## Hallazgos NO arreglados (para revisar con Camilo)

### Baja prioridad

1. **`H-S85-permission-codes-no-registrados` (revisado)**: hallazgo original
   de auditoría generalizado incorrectamente. Aplica solo a `supply_chain` y
   `catalogo_productos` (NO-LIVE). Se corrige cuando esos módulos entren a
   LIVE. Actualizar el reporte `2026-04-20-auditoria-s85-supply-chain.md`
   en el cierre de próxima sesión.

2. **`gestion_documental.ejecucion_auditoria`** no registrado en seed.
   Scaffolding C2 (Auditoría Interna) futuro, no-LIVE. Agregar al seed
   cuando el módulo pase a LIVE.

3. **16 componentes LIVE FE sin RBAC completo** (ver sección 3.3). Deuda
   documentada. ~6 horas estimadas para cerrar todos.

4. **Paso 4 completo diferido** — infra de tests + tests BE + tests FE.
   Estimación: 1 sesión dedicada.

### Alta prioridad — bug latente de seguridad cerrado

**`H-S85-rbac-core-sin-guard`** (identificado y cerrado en Paso 2): antes
de `3db17b11`, cualquier usuario autenticado del tenant podía hacer
`PATCH /api/core/roles/{id}/` o `DELETE /api/core/groups/{id}/` y
modificar la estructura RBAC del tenant. Silencioso pero crítico. Hoy
cerrado: solo superadmin.

---

## Plan siguiente

1. **Push de esta sesión** → validar CI remoto.
2. **S8.6**: continuar con los 10 componentes FE pendientes + sidebar
   verification + browseo manual en tenant demo. ~5–6 horas.
3. **S8.7**: tests con cargos restringidos (Paso 4 del brief). ~1 sesión.
4. **S9**: deploy MP a producción (ref: cierre S8), solo después de S8.5 +
   S8.6 + S8.7 cerrados.

---

## Referencias

- [docs/history/2026-04-20-auditoria-s85-supply-chain.md](2026-04-20-auditoria-s85-supply-chain.md) — auditoría origen
- [docs/history/2026-04-20-cierre-s8.md](2026-04-20-cierre-s8.md) — sesión previa, origen del objetivo deploy MP
- [backend/apps/core/permissions.py](../../backend/apps/core/permissions.py) — `GranularActionPermission` y `IsSuperAdmin`
- [backend/apps/core/utils/rbac.py](../../backend/apps/core/utils/rbac.py) — `compute_user_rbac()` (generador de `permission_codes`)
- [frontend/src/hooks/usePermissions.ts](../../frontend/src/hooks/usePermissions.ts) — API del hook FE
- [frontend/src/components/common/ProtectedAction.tsx](../../frontend/src/components/common/ProtectedAction.tsx) — `useSectionPermissions` + `CanCreate/Edit/Delete`
- [frontend/src/features/mi-equipo/components/seleccion/EntrevistasTab.tsx](../../frontend/src/features/mi-equipo/components/seleccion/EntrevistasTab.tsx) — **ejemplo canónico**
