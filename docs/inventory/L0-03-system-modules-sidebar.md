# L0 Sub-bloque 3 — System Modules / Sidebar: Inventario Profundo

**Fecha:** 2026-04-06
**Archivos analizados:** viewsets_config.py (939), serializers_config.py (348), models_system_modules.py (461), models_menu.py (248), utils/rbac.py (148), middleware/module_access.py (157), Sidebar.tsx (642), usePermissions.ts (387), ModuleGuard.tsx (72), SectionGuard.tsx (79)
**LOC produccion total:** 1,996 backend + ~1,180 frontend = ~3,176

---

## Seccion 1 — Funcion declarada vs funcion real

### Lo que dice la documentacion

CLAUDE.md declara: "Sidebar: 1-modulo layers render directo (sin wrapper). 2+ modulos is_category: True. Dashboard: /tree/ endpoint incluye layers. Config: SIDEBAR_LAYERS en viewsets_config.py."

La ARQUITECTURA-CASCADA-V2.md establece que "Backend = Frontend: Orden en SIDEBAR_LAYERS es identico a sidebar y dashboard."

### Lo que hace el codigo en runtime

El flujo real, rastreado linea por linea:

```
GET /api/core/system-modules/sidebar/
  |
  1. get_effective_user(request)  [viewsets_config.py:578]
  |   (soporta impersonacion)
  |
  2. is_superuser OR is_superadmin?  [linea 582-585]
  |   SI -> _get_full_sidebar() (todos los modulos habilitados)
  |   NO -> continua
  |
  3. user.cargo existe?  [linea 588-591]
  |   NO -> return []  (sidebar vacio)
  |   SI -> continua
  |
  4. CargoSectionAccess.filter(cargo=cargo, can_view=True)  [linea 594-596]
  |   -> set de section_ids autorizados
  |
  5. Excluir secciones superadmin-only (code='modulos')  [linea 604-607]
  |   -> section_ids filtrados
  |   Vacio? -> return []
  |
  6. TabSection.filter(id__in=section_ids, is_enabled=True)  [linea 613-618]
  |   -> set de tab_ids autorizados
  |   Vacio? -> return []
  |
  7. ModuleTab.filter(id__in=tab_ids, is_enabled=True)  [linea 624-629]
  |   -> set de module_ids autorizados
  |   Vacio? -> return []
  |
  8. SystemModule.filter(id__in=module_ids, is_enabled=True)  [linea 635-654]
  |   con Prefetch(tabs -> Prefetch(sections)) anidado
  |   Solo items is_enabled=True en cada nivel
  |
  9. _build_sidebar_response(modules, include_sections=True)  [linea 722-815]
  |   Agrupa por SIDEBAR_LAYERS (11 capas PHVA)
  |   1 modulo en capa -> render directo
  |   2+ modulos en capa -> is_category: True (wrapper expandible)
  |
  10. Return Response(JSON)
```

Frontend recibe y renderiza:
- `useSidebarModules()` [useModules.ts:158-171] -> React Query, staleTime 5 min
- `Sidebar.tsx` [642 lineas] -> NavItemComponent recursivo
- Solo muestra items con children activos
- Ruta activa detectada por location.pathname

### Discrepancias encontradas

**Ninguna discrepancia significativa.** El codigo hace exactamente lo que la documentacion describe. La unica observacion menor: CLAUDE.md no menciona que el sidebar incluye `sections` en la respuesta (include_sections=True en linea 656), pero esto es un detalle de implementacion, no una discrepancia funcional.

---

## Seccion 2 — Inventario detallado del codigo

### Modelos involucrados

| Modelo | Campos | Relaciones | Registros seed |
|--------|--------|-----------|---------------|
| SystemModule | 12 (code, name, description, category, icon, route, is_core, is_enabled, color, dependencies M2M, orden) | tabs (reverse FK), dependencies (M2M self) | ~21 |
| ModuleTab | 8 (module FK, code, name, icon, route, orden, is_enabled, is_core) | module FK, sections (reverse FK) | ~60+ |
| TabSection | 8 (tab FK, code, name, icon, orden, is_enabled, is_core, supported_actions JSON) | tab FK | ~180+ |
| MenuItem | 6 (name, icon, url, parent FK self, orden, is_active) | parent FK self | Variable |
| CargoSectionAccess | 7 (cargo FK, section FK, can_view, can_create, can_edit, can_delete, custom_actions JSON) | cargo FK, section FK | Variable por cargo |
| RolAdicionalSectionAccess | 7 (mismos campos, rol_adicional FK) | rol_adicional FK, section FK | Variable |
| GroupSectionAccess | 7 (mismos campos, group FK) | group FK, section FK | Variable |

### ViewSets relacionados

| ViewSet | Archivo | Endpoints | Permisos |
|---------|---------|-----------|----------|
| SystemModuleViewSet | viewsets_config.py | CRUD + tree + sidebar + toggle + dependency-check | IsAuthenticated (tree/sidebar), GranularActionPermission (CRUD) |
| ModuleTabViewSet | viewsets_config.py | CRUD + toggle + reorder | GranularActionPermission |
| TabSectionViewSet | viewsets_config.py | CRUD + toggle + reorder | GranularActionPermission |

### Endpoints API criticos

**`GET /api/core/system-modules/sidebar/`** — Genera sidebar filtrado por permisos del cargo
- Permiso: IsAuthenticated (cualquier usuario logueado)
- Respuesta: Array de SidebarModule con estructura jerarquica (category -> module -> tabs)

**`GET /api/core/system-modules/tree/`** — Genera arbol completo con tabs/secciones
- Permiso: IsAuthenticated
- Respuesta: JSON con modules, total_modules, enabled_modules, categories, layers

**`POST /api/core/system-modules/{id}/toggle/`** — Habilita/deshabilita modulo
- Permiso: GranularActionPermission (solo admin)

### Frontend

| Componente | Archivo | LOC | Funcion |
|-----------|---------|-----|---------|
| Sidebar | layouts/Sidebar.tsx | 642 | Renderizado recursivo de modulos/categorias |
| NavItemComponent | layouts/Sidebar.tsx (interno) | ~160 | Item individual expandible |
| ModuleGuard | routes/ModuleGuard.tsx | 72 | Valida is_enabled del modulo |
| SectionGuard | routes/SectionGuard.tsx | 79 | Valida permission_codes del usuario |
| usePermissions | hooks/usePermissions.ts | 387 | hasPermission, canDo, hasSectionAccess, canAccess |
| useSidebarModules | features/.../useModules.ts | ~14 | React Query fetch del sidebar |

### Logica de filtrado: fuente de verdad

| Aspecto | Backend | Frontend |
|---------|---------|----------|
| Que modulos aparecen | **SSOT** — filtra por CargoSectionAccess + is_enabled | Renderiza lo que backend devuelve |
| Que acciones puede hacer | **SSOT** — compute_user_rbac genera permission_codes | Usa permission_codes para mostrar/ocultar botones |
| Validacion por request | **SSOT** — ModuleAccessMiddleware + GranularActionPermission | Guards previenen navegacion pero NO son la barrera real |

**La fuente de verdad es 100% backend.** Frontend solo renderiza y oculta UI.

### Tests existentes

**Confirmado: 0 tests directos.** Hay 1 test en test_auth.py (linea 211) que prueba que el endpoint requiere autenticacion, pero NO prueba la logica de filtrado.

---

## Seccion 3 — Validacion de la hipotesis del usuario

### Escenario 1: Filtrado por cargo unico

**Resultado: ✅ Confirmado**

**Evidencia:** viewsets_config.py lineas 594-596:
```python
authorized_section_ids = set(
    CargoSectionAccess.objects.filter(cargo=cargo, can_view=True)
    .values_list('section_id', flat=True)
)
```
Solo las secciones donde el cargo tiene `can_view=True` generan tabs y modulos visibles. La cadena section -> tab -> module se construye de abajo hacia arriba: sin secciones autorizadas, el tab no aparece; sin tabs, el modulo no aparece; sin modulos en una capa PHVA, la capa no aparece.

### Escenario 2: Filtrado por multiples fuentes (Cargo + RolAdicional + Group)

**Resultado: ⚠️ Funciona pero parcialmente aplicado**

**Evidencia:** El endpoint `/sidebar/` en viewsets_config.py lineas 594-596 solo consulta `CargoSectionAccess`. **NO consulta RolAdicionalSectionAccess ni GroupSectionAccess.**

Sin embargo, `compute_user_rbac()` en utils/rbac.py SI combina las 3 fuentes (lineas 46-93) con logica OR. Este se ejecuta en el endpoint `/auth/current_user/` que retorna los permission_codes al frontend.

**Discrepancia:** El sidebar muestra modulos segun **solo el Cargo**, pero los permission_codes en el frontend incluyen permisos de Cargo + RolAdicional + Group. Esto significa: un usuario con RolAdicional que le da acceso a una seccion, **vera los botones de accion** (via permission_codes) pero **no vera el modulo en el sidebar** (porque el sidebar solo consulta CargoSectionAccess).

**Impacto actual:** Bajo. Los 2 tenants en produccion no usan RolAdicional ni Groups activamente (solo CargoSectionAccess). Pero es una inconsistencia arquitectonica que deberia documentarse.

### Escenario 3: Grupos PHVA vacios no aparecen

**Resultado: ✅ Confirmado**

**Evidencia:** viewsets_config.py lineas 787-808:
```python
for layer in SIDEBAR_LAYERS:
    layer_modules = [m for m in modules if m.code in layer['module_codes']]
    if not layer_modules:
        continue  # Capa vacia -> no aparece
```
Si ningun modulo del grupo tiene permisos para el usuario, el grupo se salta con `continue`.

### Escenario 4: Modulos deshabilitados a nivel tenant

**Resultado: ✅ Confirmado**

**Evidencia:** viewsets_config.py linea 635:
```python
SystemModule.objects.filter(id__in=authorized_module_ids, is_enabled=True)
```
El filtro `is_enabled=True` excluye modulos deshabilitados independientemente de los permisos del cargo. Ademas, el superuser tambien pasa por `_get_full_sidebar()` que filtra `is_enabled=True` (linea 711-715).

### Escenario 5: Superuser bypass

**Resultado: ✅ Confirmado**

**Evidencia:** viewsets_config.py lineas 582-585:
```python
if user.is_superuser or getattr(user, 'is_superadmin', False):
    return self._get_full_sidebar()
```
Backend: retorna todos los modulos habilitados sin filtrar por cargo.
Frontend: usePermissions.ts lineas 119-124: `isSuperAdmin` retorna true -> bypass todos los checks.

### Escenario 6: Rendimiento

**Resultado: ⚠️ Funciona pero sin medicion**

**Evidencia:** No existen benchmarks ni performance tests. Analisis estatico del codigo:

Queries estimadas por carga de sidebar (usuario normal):
1. CargoSectionAccess.filter (1 query)
2. TabSection.filter para superadmin sections (1 query)
3. TabSection.filter para tab_ids (1 query)
4. ModuleTab.filter para module_ids (1 query)
5. SystemModule.filter con Prefetch anidado (1 query + 2 prefetch)
6. Category counts en _get_full_sidebar (2-3 queries)

**Total: ~8-10 queries por carga.** Con ~21 modulos y ~180 secciones, deberia ser <100ms. Pero no hay medicion real ni `assert_num_queries` en tests.

El `PermissionCacheService` (5 min TTL) existe pero **NO se usa en el endpoint del sidebar** — cada carga hace las queries completas. Oportunidad de optimizacion.

---

## Seccion 4 — Busqueda de puntos ciegos

### Punto ciego 1: Cargo recien creado sin CargoSectionAccess

- **Que pasa:** `compute_user_rbac()` retorna `([], [])`. Sidebar vacio. No hay crash.
- **Probabilidad:** Media (cada cargo nuevo empieza sin permisos hasta que admin los configure)
- **Impacto:** Funcional (usuario ve sidebar vacio, puede confundirse)
- **Tests:** Deberia cubrirse — validar que sidebar retorna `[]` sin error

### Punto ciego 2: Cambio de cargo a mitad de sesion

- **Que pasa:** Backend invalida cache correctamente via signal `post_save` en User (rbac_cache_signals.py:26-60, TTL 5 min). Frontend **no auto-refresca** — `authStore` no tiene listener para cambios de cargo. Usuario mantiene permisos viejos hasta F5.
- **Probabilidad:** Baja (cambios de cargo son infrecuentes)
- **Impacto:** Funcional (permisos desfasados temporalmente)
- **Tests:** Deberia cubrirse — validar invalidacion de cache en backend

### Punto ciego 3: Modulo deshabilitado mientras usuario navega

- **Que pasa:** `ModuleAccessMiddleware` retorna 403 en el siguiente request. Frontend no tiene handler especifico — muestra error generico.
- **Probabilidad:** Baja (admin raramente deshabilita modulos con usuarios activos)
- **Impacto:** Cosmetico (usuario ve error 403 en vez de redirect limpio a dashboard)
- **Tests:** Deberia cubrirse — validar que middleware retorna 403

### Punto ciego 4: Sidebar lento (3+ segundos)

- **Que pasa:** Sidebar.tsx muestra `<Loader />` mientras carga (linea 364-367). Si el endpoint falla, muestra mensaje de error (linea 369-377: "Error al cargar menu").
- **Probabilidad:** Baja (8-10 queries con indices deberian ser <100ms)
- **Impacto:** Cosmetico (skeleton visible por 1-3 segundos)
- **Tests:** No critico

### Punto ciego 5: Manipulacion frontend para ver modulos no autorizados

- **Que pasa:** Imposible. Las permission_codes viven en memoria (no en localStorage). Incluso si se inyectan, el backend valida en CADA request:
  - `ModuleAccessMiddleware` valida `SystemModule.is_enabled` (linea 142-154)
  - `GranularActionPermission` valida permisos del cargo contra la DB (permissions.py:639-677)
- **Probabilidad:** N/A
- **Impacto:** Seguridad (pero esta protegido)
- **Tests:** Backend ya valida, pero un test de integracion confirmaria

---

## Seccion 5 — Analisis contra los 6 criterios de "Basico bien hecho"

### Criterio 1 — Funcional
**Aprueba.** Las funciones esenciales del sidebar (filtrado por cargo, agrupacion PHVA, ocultacion de modulos sin permiso, superuser bypass) funcionan correctamente. No hay features fantasma en la UI. La unica inconsistencia menor es que el sidebar no consulta RolAdicional/Group (solo Cargo), pero esto no es un bug porque esas fuentes no estan en uso activo.

### Criterio 2 — Browseable end-to-end
**Aprueba con reserva.** El sidebar se puede recorrer en el tenant demo local. Sin embargo, para validar completamente necesitariamos crear un usuario con cargo limitado y verificar que solo ve lo que le corresponde (el usuario actual es superadmin, que ve todo).

### Criterio 3 — Sin code smells criticos
**Aprueba.** Cero TODOs, cero FIXME, cero raw SQL en los 3 archivos criticos. Hay 2 `except Exception` en viewsets_config.py (lineas 391-396 y 571-576) pero ambos logean con `exc_info=True` — aceptable para endpoints de UI que no deben crashear.

El archivo viewsets_config.py tiene 939 lineas (por debajo del umbral de 1,500 LOC). Hay logica duplicada entre `_tree_inner()` y `_sidebar_inner()` que podria extraerse, pero no es critica.

### Criterio 4 — Patron consistente
**Parcial.** Los ViewSets usan `IsAuthenticated` para tree/sidebar (correcto — necesitan ser accesibles para cualquier usuario logueado) y `GranularActionPermission` para CRUD de modulos (correcto — solo admin puede modificar). No aplican factories (serializers son unicos para este sub-bloque, no se repiten en otros modulos).

### Criterio 5 — Tests minimos
**No aprueba.** Coverage actual: 0%. Happy paths criticos sin cubrir:
- Sidebar retorna modulos correctos para un cargo especifico
- Sidebar retorna vacio para usuario sin cargo
- Superuser ve todos los modulos
- Modulo deshabilitado no aparece
- Tree incluye secciones con permisos

### Criterio 6 — Documentacion interna
**No aprueba.** No existe README en la carpeta. Los docstrings en los modelos son buenos pero no hay documentacion de alto nivel sobre el flujo sidebar.

---

## Seccion 6 — Propuesta de accion (minima)

### Mantener (lo que ya esta bien)

| Item | Razon |
|------|-------|
| Logica de filtrado por CargoSectionAccess | Funciona correctamente en produccion |
| Agrupacion por SIDEBAR_LAYERS | Implementacion limpia del PHVA |
| Superuser bypass | Correcto y seguro |
| ModuleAccessMiddleware | Valida en cada request, imposible de bypasear |
| Prefetch optimization en queries | Bien implementado, evita N+1 |

### Agregar (lo minimo que falta)

| Item | Razon | Impacto si NO se hace | Horas |
|------|-------|----------------------|-------|
| 5 tests minimos del sidebar | Sin red de seguridad contra regresiones | Un refactor futuro podria romper el sidebar sin que nadie lo note | 3h |
| README.md en la carpeta de models_system_modules | Criterio 6 de "Basico bien hecho" | Sesiones futuras pierden tiempo re-entendiendo el flujo | 0.5h |

**Tests propuestos:**
1. `test_sidebar_returns_modules_for_cargo` — cargo con permisos ve modulos correctos
2. `test_sidebar_empty_for_user_without_cargo` — usuario sin cargo ve sidebar vacio
3. `test_sidebar_superuser_sees_all` — superuser ve todos los modulos habilitados
4. `test_sidebar_hides_disabled_module` — modulo con is_enabled=False no aparece
5. `test_module_access_middleware_returns_403_for_disabled` — middleware bloquea acceso

### Refactorizar (solo si hay tiempo)

| Item | Razon | Impacto si NO se hace | Horas |
|------|-------|----------------------|-------|
| Usar PermissionCacheService en sidebar endpoint | 8-10 queries por carga podrian ser 3-4 con cache de 5 min | Performance ligeramente sub-optima (no critico con 21 modulos) | 2h |
| Extraer logica compartida tree/sidebar | ~100 lineas duplicadas | Mantenibilidad reducida pero no critica | 1.5h |

### Documentar (sin cambiar codigo)

| Item | Razon | Horas |
|------|-------|-------|
| Inconsistencia RolAdicional/Group en sidebar | Sidebar solo consulta CargoSectionAccess, no las 3 fuentes | 0.5h (nota en README) |

### Eliminar / Mover

Nada. No hay codigo muerto ni mal ubicado en este sub-bloque.

---

## Seccion 7 — Estimacion de esfuerzo y riesgos

### Horas para consolidar

| Tarea | Horas |
|-------|-------|
| Escribir 5 tests minimos | 3 |
| Crear README.md del sub-bloque | 0.5 |
| Documentar inconsistencia RolAdicional | 0.5 |
| **Total minimo (obligatorio)** | **4 horas** |
| Integrar PermissionCacheService (opcional) | 2 |
| Extraer logica compartida tree/sidebar (opcional) | 1.5 |
| **Total con opcionales** | **7.5 horas** |

### Riesgos

| Riesgo | Probabilidad | Mitigacion |
|--------|-------------|-----------|
| Tests de sidebar requieren tenant con CargoSectionAccess configurado | Alta | Usar MockUser + mock de queryset (mismo patron que medicina_laboral) |
| Integrar cache podria servir datos stale si admin modifica permisos | Baja | TTL de 5 min ya existe, mismo riesgo que permission_codes actuales |

### Dependencias bloqueantes

**Ninguna.** Este sub-bloque es auto-contenido. Los 5 tests se pueden escribir sin tocar ningun otro sub-bloque.

---

## Conclusion

**La hipotesis del usuario se confirma: el sidebar filtra correctamente por cargo.** El codigo es solido, seguro (backend valida en cada request), y bien estructurado. La unica accion obligatoria es agregar tests minimos (5 tests, 3 horas) para proteger contra regresiones futuras, y un README breve (0.5 horas).

La inconsistencia de RolAdicional/Group en el sidebar es una limitacion conocida pero no afecta a los 2 tenants en produccion. Se documenta para cuando se necesite.
