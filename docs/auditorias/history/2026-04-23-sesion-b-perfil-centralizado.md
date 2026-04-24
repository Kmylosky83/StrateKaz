# Sesión 2026-04-23 (B) — Fusión `/perfil` centralizado + eliminación de redundancias

## Contexto

Continuación de la sesión A (paraguas Portales + rediseño Mi Portal + fix
bypass RBAC). Camilo detectó en browsing E2E que había **dos "Editar perfil"
con el mismo label** (Hero Mi Portal vs UserMenu → `/perfil`) que editaban
cosas distintas y confundían al usuario.

Después del análisis de mejores prácticas del mercado (Workday, BambooHR,
HiBob, GitHub, Google Workspace, Slack), decisión: **Opción B — fusión en
`/perfil` centralizado con edit inline atómico por sección**.

## Estrategia de ejecución

1. **Sincronización con remote** — `git pull --rebase` para traer 3 commits
   de la sesión paralela H-SC-10/H-SC-10.1/H-PROD-05. Stash de WIP ajeno.
2. **Research paralelo (3 agentes Explore en simultáneo):**
   - Mapear estado actual de `/perfil` (componentes, hooks, endpoints)
   - Mapear endpoints self-service + signals de sincronización User ↔ Colaborador
   - Mapear `ColaboradorFormModal` de Mi Equipo para identificar reusabilidad futura
3. **Diseño** — 5 cards + 3 modales atómicos + Mi Portal simplificado
4. **Implementación secuencial**
5. **Verificación** — TS check + tests + E2E browser
6. **Docs + commit**

## Resultados

### Nuevos componentes (3 modales atómicos)

Ubicación: `frontend/src/features/perfil/components/`

- **`EditIdentidadModal.tsx`** (159 LOC) — edita `User` via `PATCH /api/core/users/update_profile/`
  - Campos: first_name, last_name, email, phone (+ documento solo superadmin)
  - Reemplaza el legacy `EditProfileModal.tsx`
- **`EditContactoModal.tsx`** (168 LOC) — edita `Colaborador + InfoPersonal` via `PUT /api/mi-portal/mi-perfil/`
  - Campos: celular, email_personal, telefono_fijo, direccion, ciudad
- **`EditEmergenciaModal.tsx`** (150 LOC) — edita `InfoPersonal.contacto_emergencia_*` via `PUT /api/mi-portal/mi-perfil/`
  - Campos: nombre, parentesco (select), telefono
  - Banner informativo ámbar sobre privacidad laboral

### `PerfilPage.tsx` rediseñado (360 LOC)

5 secciones con edit inline por card (patrón Workday):

1. **📇 Identidad** — avatar (click → AvatarUploadModal) + nombre/cargo/email/teléfono/documento. Edit → `EditIdentidadModal`
2. **📞 Contacto personal** — email_personal, celular/teléfono, ciudad, dirección. Edit → `EditContactoModal`. Condicional: solo empleados
3. **🚨 Contacto de emergencia** — card con Heart rojo + info O empty state dashed "Agregar contacto". Edit → `EditEmergenciaModal`
4. **💼 Información laboral** — read-only con badge 🔒 "Solo lectura" + mensaje "gestiona desde Mi Equipo > Colaboradores"
5. **✍️ Firma digital** — link card a `/mi-portal?tab=firma` (UX SignaturePad se mantiene ahí)

**Vista superadmin:** solo cards 1 (Identidad) + 4 (Rol en el sistema). Sin Contacto/Emergencia/Firma (no aplican).

### Mi Portal simplificado

- Tab "Mis datos" **eliminado** de `BASE_TABS`
- Default activeTab ahora es `'firma'`
- `MiPortalTab` type: `'firma' | 'lecturas' | 'encuestas' | 'documentos'`
- Hero: botones "Editar perfil" (modal) → **"Ver mi perfil"** (link a `/perfil`)
- Icono: `Pencil` → `UserCog` (señala página de perfil, no edit inline)
- Eliminado estado `showEditPerfil` + render de `MiPerfilEditForm`

### Dead code eliminado (~440 LOC)

- `frontend/src/features/mi-portal/components/MiPerfilCard.tsx` — ya no se usa
- `frontend/src/features/mi-portal/components/MiPerfilEditForm.tsx` — reemplazado por los 3 modales
- `frontend/src/features/perfil/components/EditProfileModal.tsx` — reemplazado por `EditIdentidadModal`

### Actualizaciones colaterales

- `features/perfil/index.ts` — exports actualizados
- `features/perfil/components/index.ts` — exports actualizados
- `features/mi-portal/components/index.ts` — eliminados `MiPerfilCard`, `MiPerfilEditForm`
- `features/mi-portal/types/miPortal.types.ts` — `MiPortalTab` sin `'perfil'`
- `__tests__/features/mi-portal/MiPortalPage.test.tsx` — 3 tests actualizados:
  - "debe mostrar boton Editar perfil" → "debe mostrar enlace Ver mi perfil"
  - "tabs basicos: Mis datos, Mi Firma..." → "tabs basicos: Mi Firma, Lecturas, Encuestas, Documentos"
  - "MiPerfilCard en tab Mis datos" → "tab Mi Firma por defecto"
  - Agregado: "NO debe mostrar tab Mis datos"

### Docs

- `docs/03-modulos/perfil/arquitectura.md` — nuevo, explica SOT + 5 secciones + modales + flujo de foto + reusabilidad futura
- `docs/01-arquitectura/hallazgos-pendientes.md` — (cierre pendiente de redundancia "Editar perfil" al fusionar)

## Verificaciones

| Check | Resultado |
|---|---|
| `tsc --noEmit` | ✅ Exit 0 |
| Tests unit `MiPortalPage.test.tsx` | ✅ 20/20 pasan |
| E2E browser `/perfil` como superadmin | ✅ Renderiza Identidad + Rol read-only |
| E2E browser `/mi-portal` | ✅ Hero + tabs sin "Mis datos" |

## Balance LOC

| | +Líneas | -Líneas |
|---|---|---|
| Modales atómicos (Identidad/Contacto/Emergencia) | ~480 | — |
| `PerfilPage.tsx` rediseñado | 360 | 200 |
| Dead code eliminado | — | ~440 |
| Mi Portal simplificado (tab + edit modal) | — | ~50 |
| Docs | +400 | — |
| **Neto código** | | **~-250 LOC** con UX mucho más profesional |

## Principios validados

1. **Single Source of Truth visual** — un solo perfil, no fragmentos
2. **Separación semántica por modelo** — Identidad = User, Contacto = Colaborador+InfoPersonal, Emergencia = InfoPersonal, Laboral = Colaborador (read-only aquí)
3. **Patrón mercado B2B maduro** — Workday/BambooHR/HiBob/GitHub/Google usan este patrón
4. **Mi Portal = cabina de acciones** — no más viewer de datos personales
5. **Base para reusabilidad admin** — los 3 modales sirven tanto a `/perfil` (empleado) como a `/mi-equipo/colaboradores/:id` (admin) cuando se refactorice

## Próximo paso

**Retomar H-SC-05** o continuar optimizaciones de Mi Equipo que reusen los
modales atómicos de perfil.

**Sugerencia deferida:** refactorizar `ColaboradorFormModal` (823 LOC
monolítico) usando los 3 modales atómicos como piezas — reduciría la deuda
de duplicación con `/perfil` y daría al admin la misma UX que el empleado,
con permisos expandidos.
