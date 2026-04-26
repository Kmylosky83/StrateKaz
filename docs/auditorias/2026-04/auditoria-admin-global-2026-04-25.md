# Auditoría Admin Global — 2026-04-25

> Auditoría profunda del módulo `frontend/src/features/admin-global/` solicitada
> tras feedback de UX en producción (modal cierra sin confirmación, dropdown
> mal posicionado, asimetría crear-vs-editar admin de tenant).

**Origen:** Sesión 2026-04-25, post-deploy `39ae263f`.
**Estado:** Hallazgos abiertos. Plan de fix priorizado abajo.

---

## Resumen ejecutivo

El módulo es **funcional pero tiene 3 problemas críticos de UX** que provocan
pérdida de datos y confusión:

1. **Sin confirmación de cierre** — usuario pierde todo al click accidental fuera del modal de tenant
2. **Sin validación por tab** — no se sabe qué tabs tienen errores hasta que se intenta guardar
3. **Modal custom duplica `BaseModal`** — deuda técnica + inconsistencia de DS

Adicionalmente, hay una **asimetría legítima pero incompleta** entre crear y
editar tenant respecto al usuario admin (H-AG-16/17).

---

## Hallazgos por severidad

### 🔴 CRÍTICO (pérdida de datos / bloqueante UX)

#### H-AG-01 — TenantFormModal cierra sin confirmar cambios sin guardar
- **Archivo:** `frontend/src/features/admin-global/components/TenantFormModal.tsx:479,506`
- **Síntoma:** Click en X o backdrop pierde TODO el progreso del wizard de 7 tabs.
- **Fix:** Detectar dirty state (comparar con `fullTenant` o initial). Si dirty, mostrar `ConfirmDialog` antes de cerrar.
- **Esfuerzo:** M

#### H-AG-02 — Navegación entre tabs sin validar el tab actual
- **Archivo:** `TenantFormModal.tsx:516`
- **Síntoma:** El usuario salta de TabBasico a TabFiscal sin saber que TabBasico tiene errores. Solo descubre al hacer Submit.
- **Fix:** Función `isTabValid(tabId)` + badge rojo en tabs con errores + scroll/focus al primer tab inválido al submit.
- **Patrón referencia:** `ColaboradorFormModal.tsx:269` (`isStepValid`).
- **Esfuerzo:** M

---

### 🟠 ALTA (UX rota o mejor práctica violada)

#### H-AG-03 — Dropdown de acciones mal posicionado / overflow
- **Archivos:** `TenantsSection.tsx:631-687` (tabla), `137-197` (cards); `components/common/Dropdown.tsx:51-56`
- **Síntoma:** `Menu.Items` con `absolute z-50 w-56` puede cortarse en bordes / mobile. Sin Floating UI / Popper.
- **Fix:** Adoptar `@floating-ui/react` (o el equivalente integrado de Headless UI v2) para auto-reposicionar. Responsive width: `max-w-48 sm:max-w-56`.
- **Esfuerzo:** M

#### H-AG-04 — TenantFormModal `max-w-4xl` no es responsive en tablet/mobile
- **Archivo:** `TenantFormModal.tsx:486`
- **Síntoma:** En mobile no ocupa espacio completo, layout apretado, tabs horizontales se compresan.
- **Fix:** Migrar a `BaseModal` (que ya tiene sizing responsive) o usar `max-w-[95vw] sm:max-w-4xl`.
- **Esfuerzo:** L (si migra a BaseModal)

#### H-AG-05 — TenantFormModal duplica `BaseModal` (Portal, animaciones, focus trap)
- **Archivo:** `TenantFormModal.tsx:472-557`
- **Síntoma:** Reimplementa createPortal, Framer Motion, headers/footers, sin `closeOnEscape/closeOnBackdrop` controlados.
- **Fix:** Refactor a `BaseModal` como wrapper, mover contenido a `children`, usar prop `footer` para botones.
- **Esfuerzo:** L (deuda técnica)

#### H-AG-06 — Tabs sin indicador de errores ni completitud
- **Archivo:** `TenantFormModal.tsx:143-151,513-518`
- **Síntoma:** Los 7 tabs no muestran badge rojo si tienen errores ni checkmark si están válidos.
- **Fix:** Computar `tabErrors`/`tabComplete` y pasar como metadata al componente Tabs.
- **Esfuerzo:** M

---

### 🟡 MEDIA (mejoras notables)

#### H-AG-07 — `ImageUpload` sin progreso ni validación per-archivo
- **Archivo:** `tenant-form-tabs/ImageUpload.tsx`
- **Fix:** Validar formato/tamaño client-side, preview con estado, toast por archivo.
- **Esfuerzo:** M

#### H-AG-08 — Validación de `code`/`subdomain` único solo en backend
- **Archivo:** `TenantFormModal.tsx:287-333`
- **Síntoma:** Usuario llena todo, recibe 400 al final.
- **Fix:** Endpoint `check-availability/?code=X` con debounce + indicador visual.
- **Esfuerzo:** M (requiere endpoint backend)

#### H-AG-09 — Archivos no se limpian al success del submit
- **Archivo:** `TenantFormModal.tsx:215-224`
- **Fix:** Reset de `logoFile`, `logoWhiteFile`, etc. en `onSubmit` success o key forzada.
- **Esfuerzo:** S

#### H-AG-10 — `PlanFormModal` también reimplementa modal custom
- **Archivo:** `PlanFormModal.tsx:6-200`
- **Fix:** Migrar a `BaseModal` (mismo refactor que H-AG-05).
- **Esfuerzo:** M

#### H-AG-11 — `useCreateTenant` invalida queries demasiado amplio
- **Archivo:** `hooks/useAdminGlobal.ts:177-178`
- **Fix:** Invalidar solo `tenantsList()` y `tenantsStats()` en lugar de `tenants` raíz.
- **Esfuerzo:** S

---

### 🟢 BAJA (polish)

- **H-AG-12** — Hardcoded `"4xl"` en lugar de tipo `ModalSize` exportado por BaseModal. **S**
- **H-AG-13** — Mensajes de error inconsistentes (mayúsculas, spacing). **S**
- **H-AG-14** — i18n no preparado (textos hardcoded en es-co). **L** — no prioritario.
- **H-AG-15** — `Dropdown` trigger sin `aria-label`. **S**

---

### 🟠 Asimetría crear-vs-editar admin del tenant (descubierta en producción)

#### H-AG-16 — Tenants legacy sin admin no son visibles desde la lista
- **Archivo:** `TenantsSection.tsx`
- **Síntoma:** Tenants creados antes del bloque "Administrador Inicial" (vía management command, DB directa o flujo viejo) pueden no tener admin asignado. La tabla de tenants no muestra columna ni warning.
- **Fix:** Agregar columna/badge "Admin: nombre@empresa.com" en TenantsSection. Si está vacío: pill rojo `⚠ Sin admin` clicable que abre flujo de asignación.
- **Bonus:** Management command `audit_tenants_without_admin` que liste para Centro de Control.
- **Esfuerzo:** M

#### H-AG-17 — En modo edición no hay visibilidad ni acceso al admin actual
- **Archivo:** `tenant-form-tabs/TabBasico.tsx:32` (bloque solo aparece con `!isEditing`)
- **Síntoma:** Al editar, no se ve quién es el admin del tenant ni hay atajo para cambiarlo. Hay que cerrar modal → ir a Usuarios Globales → filtrar.
- **Fix:** En TabBasico modo edición, agregar widget read-only:
  ```
  Admin actual: Juan Pérez <admin@empresa.com>
  [Cambiar admin]  [Ver usuarios del tenant]
  ```
  Los botones llevan a la UI correcta, NO manipulan en el mismo modal.
- **Esfuerzo:** S-M

> **Nota de diseño:** la asimetría de fondo (crear obliga admin, editar no
> permite cambiarlo en el mismo modal) es **correcta** — separa configuración
> del tenant de gestión de usuarios. Lo que falta es **visibilidad** y
> **atajos** desde el modal de edición y la lista.

---

## Comparación con buen ejemplo: `ColaboradorFormModal.tsx`

Lo que hace mejor el patrón de Colaborador:
1. Usa `BaseModal` (estandarizado, focus trap, scroll lock)
2. **Validación por step** (`isStepValid`) — botón "Siguiente" disabled si step inválido
3. Visual progress (números/checkmarks)
4. Footer con navegación clara (Anterior/Siguiente/Crear)
5. RHF + Zod (`isDirty` automático)

Lo que TenantFormModal hace diferente y es debilidad:
1. Estado manual con `formData` en useState (sin `isDirty` automático)
2. 7 tabs vs 4 steps lineales (más complejo)
3. No pide confirmación al cerrar

---

## Plan de fix priorizado

### Sprint actual (críticos + alta prioridad)

| ID | Título | Esfuerzo | Dependencias |
|---|---|---|---|
| H-AG-01 | Confirmación al cerrar con cambios sin guardar | M | — |
| H-AG-02 | Validación por tab + indicador visual de errores | M | H-AG-01 |
| H-AG-03 | Dropdown: posicionamiento con Floating UI | M | — |
| H-AG-16 | Visibilidad de admin del tenant en lista | M | — |
| H-AG-17 | Widget admin actual + atajo en edición | S-M | — |

### Próximo sprint (refactor)

| ID | Título | Esfuerzo |
|---|---|---|
| H-AG-04 | TenantFormModal responsive (vía BaseModal) | L |
| H-AG-05 | Migrar TenantFormModal a BaseModal | L |
| H-AG-06 | Indicador de errores/completitud en tabs | M |
| H-AG-10 | Migrar PlanFormModal a BaseModal | M |

### Backlog

H-AG-07, H-AG-08, H-AG-09, H-AG-11, H-AG-12, H-AG-13, H-AG-15.

---

## Decisiones de UX a confirmar con usuario

1. **¿Confirmación de cierre siempre o solo si dirty?** → Recomendación: solo si dirty.
2. **¿Permitir navegación entre tabs si hay errores?** → Recomendación: permitir + warning visual (no bloquear).
3. **¿Endpoint de "check-availability" para code/subdomain?** → Decisión backend, opcional.
