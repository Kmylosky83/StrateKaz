# Hallazgos Arquitectónicos Pendientes — Abril 2026

> Documento de registro de hallazgos arquitectónicos críticos descubiertos
> durante el inventario L0. Cada hallazgo requiere una sesión dedicada propia
> antes de poder ser resuelto. NO son tareas — son **decisiones de fondo**
> que bloquean trabajo futuro.

**Origen:** Sesión de consolidación L0 del 2026-04-08 (inventario Sub-bloque 1
+ diagnóstico de módulos OFF).

**Estado al cierre:** Ambos hallazgos anotados, ninguno resuelto. Próxima
sesión debe decidir orden de ataque.

---

## H1 — Capa Portales no definida arquitectónicamente

### Estado: RESUELTO PARCIAL (2026-04-23)

**Resolución — Capa A (ubicación estructural):**
- Creada app `apps.portales.mi_portal` como paraguas para la capa de
  portales. Mi Portal (empleado interno + superadmin) es el único portal
  LIVE hoy. Agregado a `INSTALLED_APPS` en `base.py` (antes estaba montado
  por URL sin estar registrado — anomalía latente corregida).
- Montaje: `config/urls.py` → `/api/mi-portal/` → `apps.portales.mi_portal.urls`.
- Frontend sin cambios (`features/mi-portal/` sigue consumiendo `/mi-portal/`).
- Sidebar, branding, guards: intactos.
- **Dead code eliminado** (~1500 LOC):
  - Backend: `apps/talent_hub/api/{ess_urls.py, ess_serializers.py, employee_self_service.py}` (MisVacacionesView, SolicitarPermisoView, etc. que importaban modelos OFF).
  - Frontend features huérfanas: `features/proveedor-portal/` (553 LOC de ProveedorPortalPage + hooks + tabs), `features/cliente-portal/` (559 LOC).
  - Layout: `layouts/PortalLayout.tsx` (solo servía a portales externos).
  - Utilities: `utils/portalUtils.ts` (isPortalOnlyUser, CARGO_PORTAL_CODE).
  - Hooks: `hooks/useHasProveedor.ts`, `useHasCliente.ts`.
  - Frontend components dead: `mi-portal/components/{PortalProveedorView, PortalClienteView}.tsx` + branches en MiPortalPage.
- Referencias limpiadas en: LoginPage, UserImpersonationModal, UsersPage, AdaptiveLayout, use2FA, ui-labels, test mocks.

**Pendiente — Capa B (ver H-PORTAL-02):** el patrón de acceso externo para
proveedores, clientes y candidatos. La Capa A (estructura) solo dejó la
puerta lista; la Capa B decide *cómo entran* los externos.

### Severidad original
**ALTA** — Bloqueaba activación de talent_hub.novedades, sales_crm,
supply_chain, y cualquier módulo futuro que necesite exponerse a portales
externos (proveedores, clientes).

### Síntoma observable
Mi Portal (la landing del empleado en el tenant) vive físicamente en
`apps/talent_hub/api/ess_urls.py` y `apps/talent_hub/api/people_analytics.py`.
Se monta vía un guard `_is_installed('colaboradores')` en `talent_hub/urls.py`
(líneas 56 y 63) que matchea el label de `apps.mi_equipo.colaboradores`
(LIVE en L20). El frontend lo consume desde
`frontend/src/features/mi-portal/api/miPortalApi.ts` apuntando a
`/api/talent-hub/mi-portal/`.

### Estado actual de los endpoints

| Endpoint | Estado | Razón |
|---|---|---|
| `/api/talent-hub/mi-portal/mi-perfil/` | Funciona | Solo consume `mi_equipo.colaboradores` |
| `/api/talent-hub/mi-portal/mis-vacaciones/` | HTTP 500 si se llama | Importa `talent_hub.novedades` (OFF) |
| `/api/talent-hub/mi-portal/solicitar-permiso/` | HTTP 500 si se llama | Importa `talent_hub.novedades` (OFF) |
| `/api/talent-hub/people-analytics/` | Funciona parcial | Métrica de capacitaciones siempre `None` (formacion_reinduccion OFF) |

**Camilo confirmó (2026-04-08):** Mi Portal en producción se usa activamente
solo para perfil, encuestas y documentación. Los botones de vacaciones y
permisos no están siendo clickeados activamente todavía. Por eso los 2
endpoints rotos no están sangrando alertas.

### El error de fondo
Quien escribió el código original mezcló dos conceptos distintos:
- **El tema de los datos** (vacaciones, permisos -> talent_hub)
- **La audiencia que los consume** (empleado interno -> Mi Portal)

Y ubicó el código según el primero. El criterio correcto es ubicarlo según
el segundo: los Portales son una **capa transversal de presentación**
orientada por tipo de audiencia, NO son features de un módulo de negocio.

### Visión del producto (Camilo, 2026-04-08)
Los Portales son **el aterrizaje** de cada tipo de usuario dentro del tenant.
Tres audiencias confirmadas hoy:

| Portal | Audiencia | Naturaleza |
|---|---|---|
| **Mi Portal** | Empleados internos del tenant | Interno, con tabs por tipo de actividad |
| **Portal Externo Proveedores** | Terceros vendedores | Externo, con sus tabs propios |
| **Portal Externo Clientes** | Terceros compradores | Externo, con sus tabs propios |

Mi Portal específicamente debe ser una "landing dentro del tenant" pensada
como **acceso rápido** a las actividades del empleado. Hoy funciona
parcialmente. Crecerá con cada activación de módulos:
- L20 (LIVE): perfil, encuestas, documentación
- L35: SST personal, riesgos del cargo
- L60: vacaciones, permisos, recibos de nómina, capacitaciones, evaluación
- L80+: indicadores personales, plan de mejora individual

Mi Portal debe seguir las **mejores prácticas del mercado** para landings
dentro de SaaS B2B. Camilo pidió explícitamente investigar el patrón
correcto antes de definir.

### Patrones del mercado a evaluar

| Patrón | Ejemplo del mercado | Descripción |
|---|---|---|
| 1 — Dashboard de widgets | Workday, BambooHR, SuccessFactors | Cada módulo registra widgets al portal vía plugin system |
| 2 — App con secciones | Notion, Linear, Slack home | Portal es app de primera clase con secciones condicionales |
| 3 — BFF (Backend-For-Frontend) | Spotify, Netflix, Shopify Admin | Portal solo agrega backend; frontend es SPA dedicada |
| 4 — Vista del sidebar | ERPs tradicionales, intranets corporativas | Portal es solo un grupo del sidebar con tabs filtradas por RBAC |

**Hipótesis preliminar a validar:** Patrón 2 (App con secciones) con la
variante de **una app por tipo de portal** en `apps/portales/`:
- `apps/portales/mi_portal/`
- `apps/portales/portal_proveedores/`
- `apps/portales/portal_clientes/`

Razones de la hipótesis:
1. El USP de StrateKaz es la experiencia (no es un ERP más)
2. Los empleados son usuarios casuales, no power users que personalicen widgets
3. La cascada L0->L90 ya tiene la disciplina de "secciones condicionales"
4. Acoplamiento controlado, no eliminado — el portal decide qué experiencia tiene cada audiencia
5. Mobile-first viable a futuro

**Esta hipótesis NO está validada.** La sesión dedicada debe decidir.

### Entregables esperados de la sesión dedicada

1. Documento `docs/architecture/portales.md` con el patrón elegido y la
   justificación, incluyendo evaluación honesta de los 4 patrones del mercado.
2. Catálogo definitivo de portales (nombres, audiencias, alcance).
3. Decisión del patrón arquitectónico (1, 2, 3, 4 o variante).
4. Plan de migración del código actual con **URL aliasing** para cero
   impacto en frontend y usuarios actuales:
   - Las URLs viejas (`/api/talent-hub/mi-portal/...`) siguen vivas como
     aliases que apuntan a las views nuevas.
   - El frontend NO se entera del cambio.
   - Migración endpoint por endpoint (`mi-perfil` primero porque funciona,
     después los rotos cuando `novedades` se active).
5. Definición de cómo cada portal mapea al RBAC dinámico (es un
   `SystemModule`? es un agregador de tabs de varios módulos?).
6. Definición de cómo cada portal consume módulos OFF gracefully:
   - Feature flags, secciones ocultas, respuestas vacías documentadas
   - Patrón explícito para "esta funcionalidad estará disponible cuando se
     active el módulo X"

### Lo que bloquea
- Activación de `talent_hub.novedades` (los endpoints rotos empezarían a
  funcionar pero en el lugar arquitectónicamente equivocado)
- Activación de cualquier módulo C2 que necesite exponerse a empleados,
  proveedores o clientes finales
- Cualquier rediseño UX/UI de Mi Portal

### Decisión tomada el 2026-04-08
**NO tocar el código de Mi Portal en la sesión actual.** Dejar los 2
endpoints rotos vivos porque no están sangrando alertas Sentry y porque
parchearlos sería poner curitas a algo que va a ser refactorizado
completamente cuando se defina la capa Portales.

### Ejecución 2026-04-23
Refactor ejecutado en sesión con Camilo. Capa A cerrada. Ver sección
"Estado: RESUELTO PARCIAL" arriba. Código vive ahora en
`apps/portales/mi_portal/` (backend) + `frontend/src/features/mi-portal/`
(frontend). Portales externos pendientes → H-PORTAL-02.

---

## H-PORTAL-02 — Patrón de acceso externo para portales no-empleado

### Detectado
2026-04-23 (cierre Capa A del H1).

### Severidad
**MEDIA** — No bloquea operación actual (los externos no entran al sistema
hoy). Pero bloquea la construcción de los portales de proveedores, clientes
y candidatos cuando se activen sus módulos de origen.

### Contexto
Con la Capa A resuelta, Mi Portal (empleado interno) vive en
`apps/portales/mi_portal/`. Los portales externos **no existen todavía** —
se eliminó código huérfano que los implementaba parcialmente (ver H1
"Resolución Capa A"). Cuando toque construirlos, **primero hay que decidir
cómo entran los externos al sistema** porque nunca entraron: el modelo
`Proveedor` no tiene campo `user`, no hay flujo de invitación, no hay
creación automática de User con `proveedor_id_ext`.

### Patrones candidatos

| # | Patrón | Ejemplos | Cuándo aplica |
|---|---|---|---|
| 1 | **Magic link por email** | DocuSign, Stripe Dashboard Light | Proveedor recibe email "revisa tu OC #123" → URL con token firmado 7d → ve solo su dato, sin password |
| 2 | **Login simple en subdomain** | Amazon Seller, Shopify Partner | Sí entran, con password. Subdominio separado (`proveedores.stratekaz.com`). Scope limitado. 2FA opcional |
| 3 | **Token QR read-only** | Factura electrónica DIAN | URL pública con hash en el QR. Solo lectura. Sin estado de sesión |
| 4 | **Portal de candidatos público** | LinkedIn Easy Apply, Workday Careers | Ya existe parcialmente en talent-hub `/vacantes-publicas` — sin login para postular |

### Entregables de la sesión dedicada

1. `docs/01-arquitectura/portales-externos.md` con el patrón elegido por
   tipo de audiencia (puede ser distinto: magic link para proveedores,
   público para candidatos).
2. Modelo de datos: ¿se crea `User` con `proveedor_id_ext` set, o se crea
   tabla `ProveedorPortalAccess` separada? Impacto en auth middleware.
3. Flujo de invitación: endpoint `/api/proveedores/{id}/invitar-portal/`
   que envía email con token.
4. Scope de datos: cómo se garantiza que un proveedor **solo** ve sus
   propias OCs / facturas / documentos y no los de otros.
5. 2FA: nivel de verificación para acciones críticas (ej: aceptar OC).
6. Subdomain routing (opcional): si se elige Patrón 2, configurar
   `proveedores.{tenant}.stratekaz.com` vía `TenantMainMiddleware`.

### Apps a crear cuando toque (bajo `apps/portales/`)

- `apps/portales/portal_proveedores/` — activar con `supply_chain`
- `apps/portales/portal_clientes/` — activar con `sales_crm`
- `apps/portales/portal_vacantes/` — activar con `mi_equipo.seleccion_contratacion` (ya LIVE, pero el portal público ya vive en `features/talent-hub/pages/VacantesPublicasPage.tsx` — evaluar mover)

### Lo que bloquea
- Construcción real de portales para proveedores y clientes.
- No bloquea nada LIVE hoy.

### Referencia histórica
Las features huérfanas eliminadas en H1 Capa A (ProveedorPortalPage 553 LOC,
ClientePortalPage 559 LOC) pueden consultarse en git history antes del
commit de refactor — contienen ideas sobre tabs de precios y profesionales
que pueden reutilizarse parcialmente cuando se rediseñen.

### Trigger
Antes de activar `supply_chain` con acceso externo, o antes de activar
`sales_crm`. Independiente del roadmap H-SC-* actual.

### Estado
🔲 Abierto. Prioridad: **diferida — se atiende cuando se requiera acceso externo real.**

---

## H-PORTAL-03 — Modal `LecturasObligatoriasGuard` redundante con ActionBar

### Detectado
2026-04-23 (sesión rediseño Mi Portal — browsing E2E con Ana García López).

### Severidad
**BAJA** — UX sub-óptima, no bloquea. Oportunidad de mejora.

### Síntoma
Al entrar a `/mi-portal` con lecturas obligatorias pendientes, se dispara
automáticamente un modal bloqueante (`LecturasObligatoriasGuard`) que dice
*"Tiene N documento(s) de lectura obligatoria pendiente de aceptación"* con
CTA "Ir a Lecturas Pendientes" + "Recordar después". El modal interrumpe el
flujo del empleado al aterrizar.

Con el nuevo **ActionBar del rediseño** (2026-04-23), esta información ya
está visible de forma no-bloqueante:
- ActionCard ámbar **"1 Lecturas pendientes"** con conteo destacado y CTA click
- Badge numérico **ámbar en el tab "Lecturas"**

Resultado: el usuario ve la pendiente 2 veces — una bloqueante, otra
informativa. El modal se vuelve ruido.

### Propuesta
Opciones (decidir en sesión futura):
1. **Eliminar el modal guard.** Confiar en ActionBar + tab badge + modal de
   escalación solo si el empleado ignora N días consecutivos (cumplimiento
   ISO sigue cubierto con audit log y reportes).
2. **Convertir a banner dismissible** en el Hero (menos intrusivo).
3. **Mantener solo en rutas distintas de Mi Portal** — el guard tiene
   sentido en `/dashboard` o en módulos donde no hay ActionBar.

### Trigger
Reactiva. Se atiende cuando haya feedback real de usuarios sobre la
doble-notificación, o en la próxima iteración de Mi Portal.

### Dependencia
- Ninguna. Independiente del H-SC-* roadmap.

### Estado
🔲 Abierto. Prioridad: **BAJA — UX polish diferido.**

---

## H-BE-01 — Naming inconsistente de bypass self-service en ViewSets

### Detectado
2026-04-23 (auditoría durante fix del H-PORTAL-02 bypass en AceptacionDocumentalViewSet).

### Severidad
**BAJA** — No causa bugs. Es deuda de coherencia.

### Síntoma
Distintos ViewSets implementan el mismo patrón "saltar RBAC para acciones
self-service" con nombres diferentes:

| ViewSet | Constante | Ubicación |
|---|---|---|
| `UserViewSet` (core) | `SELF_SERVICE_ACTIONS` | core/viewsets.py:110 |
| `AceptacionDocumentalViewSet` | `SELF_SERVICE_ACTIONS` | gestion_documental/views.py:1715 |
| `PreferenciaNotificacionViewSet` | `PERSONAL_ACTIONS` | centro_notificaciones/views.py:183 |
| `HojaVidaViewSet` | *(inline `if action == X`)* | mi_equipo/colaboradores/views.py:635 |
| Firma digital (`mis_firmas_pendientes`) | *(decorador `@action(permission_classes=[...])`)* | workflow_engine/firma_digital/views.py:852 |

Todos funcionan, pero un code reviewer nuevo ve 3 patrones distintos y no
sabe cuál es el canónico. También hace más difícil buscar "dónde hay bypass
RBAC" con grep único.

### Propuesta
Unificar al patrón canónico de `UserViewSet`:
```python
SELF_SERVICE_ACTIONS = frozenset({ ... })  # allowlist explícito

def get_permissions(self):
    if self.action in self.SELF_SERVICE_ACTIONS:
        return [IsAuthenticated()]
    return super().get_permissions()
```

- Renombrar `PERSONAL_ACTIONS` → `SELF_SERVICE_ACTIONS` en
  `PreferenciaNotificacionViewSet`.
- Migrar `HojaVidaViewSet.if action == 'por_colaborador'` al mismo patrón.
- Dejar el decorador `@action(permission_classes=[IsAuthenticated])` como
  alternativa válida cuando es UN solo endpoint aislado (no amerita
  constante de clase).

### Beneficio
- Grep único: `SELF_SERVICE_ACTIONS = frozenset` encuentra todo el bypass RBAC
- Code review más rápido
- Base para generar auditoría automática de endpoints expuestos a empleados

### Trigger
Reactiva. Se atiende cuando se toque alguno de los ViewSets afectados, o
proactivamente en una pasada de "coherencia de convenciones".

### Estado
🔲 Abierto. Prioridad: **BAJA — oportunidad de coherencia.**

---

## H-FE-01 — Prevenir errores `loading` vs `isLoading` en Button DS

### Detectado
2026-04-23 (fix de warning en MiFirmaDigital: 3 usos de `loading={...}` donde
Button espera `isLoading={...}`).

### Severidad
**BAJA** — No causa bugs visibles; solo warning en consola. Pero indica que
el error es fácil de cometer y puede estar en otros archivos.

### Síntoma
Button DS expone prop `isLoading`. Si un consumer pasa `loading={...}`, el
prop se forwardea al DOM como atributo HTML inválido y React tira warning
"non-boolean attribute `loading`". No rompe nada funcionalmente.

### Propuesta (2 opciones)

**Opción A — ESLint rule custom** (preventivo):
Regla que detecta JSX `<Button loading={...}>` y sugiere `isLoading`.
Requiere instalar plugin de ESLint custom o usar
`no-restricted-syntax`.

**Opción B — Hacer Button más defensivo** (correctivo):
```typescript
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  /** @deprecated usar isLoading. Se mapea automáticamente. */
  loading?: boolean;
}
```
Dentro del componente: `const effectiveLoading = isLoading ?? loading;` y
NO forwardear `loading` al DOM (destructurar).

Opción B ventaja: no rompe código legacy si quedan usos sin detectar.

### Auditoría rápida
Grep de `<Button[^>]*loading=` en el repo: solo los 3 casos de
`MiFirmaDigital.tsx` que ya corregí. No hay otros.

### Trigger
Reactiva. Si aparece otro caso o se decide hardening del DS.

### Estado
🔲 Abierto. Prioridad: **BAJA — oportunidad de hardening DS.**

---

## H-FE-02 — Unificar formularios de Colaborador entre admin y self-service

### Detectado
2026-04-23 (sesión B — fusión `/perfil` centralizado con modales atómicos).

### Severidad
**BAJA-MEDIA** — No causa bugs, pero es deuda técnica creciente: cambios en
validación o UX de campos compartidos deben replicarse en 2 lugares.

### Síntoma
Hay **dos sistemas paralelos** que editan los mismos campos de un empleado:

**Admin (Mi Equipo > Colaboradores):**
- `features/mi-equipo/components/colaboradores/ColaboradorFormModal.tsx` (823 LOC monolítico)
- Wizard de 3-4 pasos: Datos Básicos, Asignación, Contratación, Acceso al sistema
- Endpoint: `POST/PATCH /api/mi-equipo/empleados/colaboradores/`

**Empleado self-service (`/perfil`):**
- `features/perfil/components/EditIdentidadModal.tsx` (User.first_name, last_name, email, phone)
- `features/perfil/components/EditContactoModal.tsx` (celular, email_personal, teléfono, dirección, ciudad)
- `features/perfil/components/EditEmergenciaModal.tsx` (contacto emergencia)
- Endpoints: `PATCH /api/core/users/update_profile/` + `PUT /api/mi-portal/mi-perfil/`

**Campos superpuestos:**
| Campo | Admin (ColaboradorFormModal) | Empleado (/perfil) |
|---|---|---|
| primer_nombre / last_name | ✅ | ✅ (EditIdentidadModal) |
| email (User) | ✅ | ✅ (EditIdentidadModal) |
| email_personal | ✅ | ✅ (EditContactoModal) |
| telefono_movil / celular | ✅ | ✅ (EditContactoModal) |
| tipo_documento + numero_identificacion | ✅ | ✅ (superadmin only) |

Si se agrega validación (ej: regex de teléfono, longitud máx de nombre),
hay que tocarla en 2 lugares. Si se cambia placeholder o helper text,
también. Si cambia el flujo del email (ej: confirmación), idem.

### Propuesta
Extraer los campos compartidos en **componentes atómicos reutilizables**:

```
features/perfil/components/fields/  (nueva carpeta canónica)
  ├─ IdentidadFields.tsx      (first_name, last_name, email, phone, documento)
  ├─ ContactoFields.tsx       (celular, email_personal, telefono, direccion, ciudad)
  └─ EmergenciaFields.tsx     (nombre, parentesco, telefono)
```

Cada field component:
- Expone props `{ register, errors, disabled, adminMode? }`
- Contiene los `<Input>`/`<Select>` con validaciones Zod + placeholders + helperText
- `adminMode={true}` desbloquea campos admin-only (ej: documento editable sin flag superadmin)

**Consumidores:**
- `/perfil` (sesión B): los 3 `Edit*Modal` existentes importan y componen los fields
- **Mi Equipo** (refactor objetivo): `ColaboradorFormModal` importa los mismos fields + agrega paso "Contratación" (salario, tipo_contrato, cargo) que es exclusivo de admin

### Beneficio
- **Un solo lugar** para validaciones, placeholders, helper text, iconos
- **Tests compartidos**: un test del IdentidadFields cubre `/perfil` y Mi Equipo
- **Consistencia UX garantizada** entre admin y empleado
- **Reducción de LOC**: `ColaboradorFormModal` baja de 823 → ~400 LOC aprox

### Trigger natural
Se atiende cuando:
1. Cambie alguna validación de campo compartido (empuja a refactorizar en vez de duplicar)
2. Se active `talent_hub.nomina` y admin necesite editar más campos del empleado (momento natural para partir el monolito)
3. O proactivamente en pasada de "consolidación de formularios"

### Dependencia
- Independiente. No bloquea nada. Los 2 flujos funcionan hoy.

### Precedente
Los 3 modales de `/perfil` (sesión B 2026-04-23) fueron diseñados con
props simples (`{ isOpen, onClose, user | perfil }`) justo para facilitar
este refactor futuro.

### Estado
🔲 Abierto. Prioridad: **BAJA-MEDIA — oportunidad de consolidación. Detalle en `docs/03-modulos/perfil/arquitectura.md` sección "Reusabilidad para Mi Equipo".**

---

## H2 — Sistema de auto-memory de Claude Code vive fuera del repo

### Estado: RESUELTO (2026-04-08)

**Resolución:** Migración completa ejecutada. 28 archivos promovidos a
`docs/`, 9 descartados (redundantes con docs/ existentes), 2 mergeados,
10 se quedan en auto-memory (scratch pad). Snapshot de emergencia eliminado.
CLAUDE.md actualizado con 4 referencias corregidas + sección "Sistema de
Memoria — Regla de Persistencia". MEMORY.md reescrito como índice de punteros.

### Severidad original
**ALTA** — Riesgo de pérdida total de conocimiento crítico del proyecto
ante fallo de disco, reinstalación de Claude Code, o cambio de máquina.

### Síntoma observable
El directorio `C:\Users\Lenovo\.claude\projects\C--Proyectos-StrateKaz\memory\`
en la máquina local de Camilo contiene **45 archivos .md (~475 KB)** de
conocimiento del proyecto que NO están versionados, NO están en el repo,
NO tienen backup, NO viajan entre máquinas, y NO son visibles para
colaboradores futuros.

### Inventario del directorio (al 2026-04-08)

| Categoría | Archivos | Tamaño aprox |
|---|---|---|
| Índice principal (`MEMORY.md`) | 1 | 28 KB |
| Arquitectura/patrones (architecture, multi-tenant, module-routing, reorganización, coding-standards, naming-conventions, etc.) | 10 | 67 KB |
| Feedback/convenciones (feedback_*, self-service-rbac, middleware-portal, ui-standards, etc.) | 9 | 18 KB |
| Features/módulos (firma-digital x3, gestion-documental, onboarding, plantillas, seeds, etc.) | 11 | 60 KB |
| Auditorías/health checks (audit-*, health-check, ts-errors-policy) | 5 | 18 KB |
| Negocio/pricing (brand-identity, b2b2b, pricing, marketing-recursos) | 4 | 13 KB |
| Deploy/infra (deploy, capacity-planning, jwt-session-strategy) | 3 | 32 KB |
| Historia/sprint (`sprint-history.md`) | 1 | **135 KB (monstruo)** |
| Pitfalls aprendidos (`pitfalls.md`) | 1 | **69 KB (monstruo)** |
| Otros (tech-automations, usuarios-centro-control) | 2 | 4 KB |
| **TOTAL** | **45** | **~475 KB** |

Los dos archivos gigantes (`sprint-history.md` y `pitfalls.md`) representan
el 43% del directorio. Son contexto histórico y conocimiento aprendido a
los golpes que sería catastrófico perder.

### El error de fondo
Asumimos durante varias sesiones que `MEMORY.md` vivía en el repo. La
realidad es que Claude Code lo escribe en su propio directorio
`.claude/projects/<proyecto>/memory/` que es:
- Local a la máquina
- Local a la instalación de Claude Code
- Local al proyecto específico de Claude Code
- Borrable en cualquier reinstalación o limpieza
- Invisible para git
- Sin historia versionada
- Sin posibilidad de `git blame` ni `git log`

`CLAUDE.md` (que SÍ vive en el repo) referencia estos archivos en
**al menos 4 lugares** (líneas 52, 73, 361, 499) asumiendo que Claude Code
los carga automáticamente. Esto funciona para Camilo en su máquina, pero
**no funcionaría para ningún otro colaborador**, ni sobreviviría a una
reinstalación.

### Estado al 2026-04-08
**Snapshot bruto del directorio entero ya commiteado** en
`.memory-backup-2026-04-08/` dentro del repo (commit `445f1210`). Esto
elimina el riesgo de pérdida total inmediata. Es una **medida de emergencia**,
NO la solución definitiva.

El directorio original en `.claude/projects/...` sigue intacto y Claude
Code lo sigue usando como su auto-memory. **Tenemos dos fuentes de verdad
parciales:** el snapshot (versionado pero estático) y el directorio vivo
(actualizable pero no versionado). Esto es una situación temporal aceptable
solo hasta que se ejecute la sesión dedicada.

### Decisiones pendientes para la sesión dedicada

1. **Catálogo de archivos a promover al repo:** cuáles de los 45 son
   conocimiento del proyecto (van al repo) y cuáles son scratch pad operacional
   de Code (pueden quedarse fuera)?

2. **Detección de duplicaciones:** varios archivos del snapshot pueden ya
   existir en `docs/` del repo en versiones más nuevas o más viejas. Hay
   que comparar archivo por archivo y decidir cuál fuente gana.

3. **Ubicación definitiva en el repo:** `docs/memory/`? `docs/architecture/`
   + `docs/operations/` + `docs/business/`? una sola raíz `MEMORY.md` que
   referencia archivos en sus categorías?

4. **Rol futuro del directorio auto-memory de Claude Code:** se vacía y
   se le pide a Code que solo lea del repo? se mantiene como "scratch pad"
   con regla explícita de "nada importante vive acá, todo se promueve al
   repo al final de la sesión"?

5. **Actualización de `CLAUDE.md`:** las 4+ referencias actuales asumen el
   sistema viejo. Hay que reescribirlas para apuntar al nuevo sistema.

6. **Mecanismo de prevención:** cómo evitamos que en 6 meses tengamos
   otro directorio paralelo de 50 archivos viviendo fuera del repo? Una
   regla escrita en `CLAUDE.md` no alcanza — necesita ser un workflow
   habitual, posiblemente con un check al cierre de cada sesión.

7. **Archivos huérfanos en el snapshot:** algunos pueden ser obsoletos
   (decisiones revertidas, planes abandonados). Hay que hacer una pasada
   de "sigue siendo cierto" antes de promover.

### Lo que bloquea
- Cualquier intento de hacer `MEMORY.md` referencia versionada confiable
- Onboarding de cualquier colaborador externo al proyecto
- Cualquier migración del proyecto a otra máquina
- Confianza en que las "reglas aprendidas a los golpes" no se van a perder

### Decisión tomada el 2026-04-08
**Snapshot de emergencia hoy. Migración real y reorganización en sesión
dedicada futura.** No tocar `CLAUDE.md` hoy porque cualquier edición seria
requiere primero entender el sistema completo, y eso es trabajo de la
sesión dedicada.

---

## H3 — Archivos promovidos del snapshot no validados contra código actual

### Severidad
**MEDIA** — No bloquea, pero erosiona la confianza en docs/ como fuente de verdad.

### Síntoma
Durante la resolución de H2 (2026-04-08), 28 archivos del snapshot de auto-memory
fueron promovidos a docs/ sin hacer la pasada de "sigue siendo cierto" contra el
estado actual del código. Algunos de esos archivos pueden contener decisiones
revertidas, planes abandonados, o referencias a estructuras que ya cambiaron.

### Por qué se aceptó la deuda
La sesión H2 estaba enfocada en arquitectura del sistema de memoria, no en validar
contenido archivo por archivo. Validar 28 archivos contra el código actual habría
tomado una sesión completa adicional y habría escalado el compromiso de la sesión H2.

### Lo que bloquea
Nada urgente. Pero significa que docs/ contiene contenido sin validación de frescura,
y un colaborador futuro podría leer una decisión vieja como si fuera vigente.

### Qué hay que hacer en sesión dedicada
Para cada uno de los 28 archivos promovidos:
1. Identificar las afirmaciones técnicas concretas (rutas de archivos, nombres de
   clases, decisiones de diseño)
2. Verificar contra el código actual del repo
3. Marcar el archivo como VIGENTE, ACTUALIZAR, o DESCARTAR
4. Si hay actualizaciones, hacerlas en el mismo PR

### Origen
Resolución de H2, sesión 2026-04-08 parte 2.

---

## H4 — Infraestructura de test multi-tenant rota

### Detectado
2026-04-08 (sesión auditoría perímetro LIVE)

### Severidad
**ALTA** — Bloquea cualquier validación automatizada del perímetro LIVE.

### Síntoma
~525 de ~530 tests fallan con `OperationalError` de DB de test o setup
failure por no usar `BaseTenantTestCase`. Los únicos tests que pasan son:
- 6 tests migrados de core (usan `BaseTenantTestCase`)
- 37 tests de configuracion (unit tests puras que no tocan modelos tenant)

### Hipótesis inicial
Una sola pieza de infra compartida está rota. Arreglarla podría
desbloquear la mayoría de los tests de un saque. Evidencia: los tests
que SÍ usan `BaseTenantTestCase` pasan limpiamente.

### Próxima sesión
Dedicada exclusivamente a este hallazgo.

### Documento de referencia
`docs/architecture/PERIMETRO-LIVE.md`

---

## H-S5-pwa-branding-unificado — Modelo Tenant duplica branding PWA

### Detectado
2026-04-19 (validación visual post-deploy Catálogo Productos S5)

### Severidad
**MEDIA** — Arquitectónica, afecta a **TODOS los tenants** (presentes y
futuros), no sólo al que se detectó. No bloquea funcionalidad pero
genera data quality issues recurrentes y onboarding más lento por cada
tenant que se crea.

### Alcance
- **Modelo**: `apps.tenant.models.Tenant` — campos duplicados estructurales
- **Universo afectado**: TODOS los tenants del sistema (productivos + futuros)
- **No es bug de un tenant específico** — es falla del data model
- **Grasas y Huesos del Norte** fue el primer caso visible, pero cada
  tenant creado a través del admin workflow hereda el mismo riesgo de
  data quality

### Síntoma observable
El modelo `Tenant` (apps/tenant/models.py) tiene **5 campos de texto/color
PWA que duplican información del branding core**:

| Campo PWA | Debería derivarse de | Realidad |
|---|---|---|
| `pwa_name` | `nombre_comercial` o `name` | Requiere llenado manual separado |
| `pwa_short_name` | `nombre_comercial[:12]` o `name[:12]` | Requiere llenado manual separado |
| `pwa_description` | `slogan` o computed | Requiere llenado manual separado |
| `pwa_theme_color` | `primary_color` | Requiere llenado manual separado |
| `pwa_background_color` | `secondary_color` o bg | Requiere llenado manual separado |

**Caso observado (primero de muchos)**: el tenant Grasas y Huesos del Norte
tenía:
- `pwa_name = "StrateKaz App"` (placeholder genérico)
- `pwa_short_name = "StrateKaz"` (placeholder)
- `pwa_description = "Aplicación Adecuada para los sistemas de Gestion"` (genérico con typo)
- `pwa_theme_color = "#000000"` (negro, no marca del tenant)
- `pwa_background_color = "#ec268f"` (pink de StrateKaz, no del tenant)

Resultado visual: la PWA en escritorio muestra "StrateKaz App" + logo amarillo
StrateKaz en lugar del branding del tenant. Sólo los íconos del tenant se
renderizan correctos (porque viven en su propio folder `/media/tenants/...`).

**Este no es caso aislado.** Cualquier tenant creado por el admin workflow
puede acabar con valores placeholder, genéricos o desincronizados, porque
el modelo obliga a llenar dos capas paralelas de branding para información
que debería ser una sola. El fix por tenant es imposible de escalar; el
fix es eliminar la duplicación del data model.

### El error de fondo
El diseño original violó **DRY (Don't Repeat Yourself)** al crear una capa
paralela de branding para PWA en vez de derivar del tenant core. Esto:

1. Obliga a llenar información duplicada en 2 lugares (tab General + tab PWA)
2. Es propenso a quedar desincronizado (exactamente lo que pasó)
3. Multiplica la superficie de bugs de data quality
4. No alinea con patrones de industria

### Patrones de industria para multi-tenant PWA

| Plataforma | Patrón |
|---|---|
| **Slack** | Workspace name + icon → manifest auto-computed |
| **Linear** | Workspace identity → manifest computed |
| **Notion** | Workspace → manifest computed |
| **Shopify** | Store name + logo → manifest computed |
| **GitHub** | Org/repo identity → manifest computed |

**Principio universal**: el PWA manifest se deriva del core identity del
tenant. No se duplica. Sólo los íconos pueden ser uploads separados por
requisitos técnicos (sizes 192/512, maskable).

### Solución propuesta

**Refactor: Branding Unificado v2**

1. **Eliminar del modelo Tenant** los 5 campos duplicados:
   - `pwa_name`, `pwa_short_name`, `pwa_description`
   - `pwa_theme_color`, `pwa_background_color`
2. **Mantener en el modelo** los 3 uploads específicos:
   - `pwa_icon_192`, `pwa_icon_512`, `pwa_icon_maskable`
3. **Computar el manifest** al vuelo desde el branding core:
   ```python
   def get_pwa_manifest(self):
       return {
           'name': self.nombre_comercial or self.name,
           'short_name': (self.nombre_comercial or self.name)[:12],
           'description': self.slogan or f'Sistema de gestión - {self.name}',
           'theme_color': self.primary_color,
           'background_color': self.secondary_color or '#FFFFFF',
           'icons': self._build_pwa_icons(),
       }
   ```
4. **Actualizar frontend** `TabPwa.tsx`:
   - Remover 5 inputs de texto/color
   - Mantener solo los 3 uploads de íconos
   - Agregar nota: "El nombre, descripción y colores se derivan del tab
     Información General"
5. **Data migration**: para cada tenant, si tiene valores PWA no-genéricos
   distintos al core, decidir override vs rescue. Luego drop columns.

### Esfuerzo estimado
1-2 días:
- Model + migration: 2h
- Endpoint refactor: 1h
- Frontend TabPwa: 2h
- Tests: 2h
- Data migration + validación por tenant: 4h
- Documentación: 1h

### Trigger de activación
Sprint dedicado "Branding Unificado v2", scheduled para post-S6 (Supply
Chain). Bundled potencialmente con refactor de `Admin Global` /
`Configuración Organizacional`.

### Política aplicada: NO workaround
**Decisión 2026-04-19:** no se aplica ningún parche en producción. Política
de desarrollo del software StrateKaz: **solución de fondo o deuda documentada,
sin punto medio**. Aplicar workarounds en prod (vaciar campos manualmente,
crear commands paliativos) genera falsa sensación de resolución y diluye la
urgencia del refactor. El tenant Grasas y Huesos del Norte queda con branding
PWA genérico hasta que el refactor se ejecute. Data quality aceptable
temporalmente porque no bloquea funcionalidad ni compromete integridad.

### Criterio de cierre del hallazgo
1. Los 5 campos duplicados eliminados del modelo `Tenant` con migration
2. Endpoint manifest computa desde core branding (`name`, `nombre_comercial`,
   `slogan`, `primary_color`, `secondary_color`)
3. Frontend `TabPwa.tsx` actualizado: sólo uploads de íconos
4. Tests verifican el manifest para tenants con y sin branding completo
5. Verificación visual en al menos 2 tenants productivos que el branding
   correcto aparece en desktop app PWA

### Documentos de referencia
- `backend/apps/tenant/models.py` — campos duplicados
- `backend/apps/tenant/views.py:1038-1122` — endpoint manifest dinámico
- `frontend/src/features/admin-global/components/tenant-form-tabs/TabPwa.tsx`

---

## H-S6-activation-procedure — ✅ RESUELTO (2026-04-19)

### Resolución
Era un **bug de datos en el seed**, no un problema arquitectónico de 3 gates.
Fix: 1 línea en `seed_estructura_final.py:936` (`is_enabled: False` → `True`).

### Doctrina correcta (validada vs patrones Saleor/Wagtail/Odoo)

El sistema tiene **3 conceptos con responsabilidades distintas**, no 3 gates:

| Concepto | Significado | Fuente |
|----------|-------------|--------|
| **Codebase LIVE** | "StrateKaz soporta este módulo en producción" | `TENANT_APPS` en base.py + `is_enabled=True` en seed |
| **Licensing** | "Este tenant pagó por este módulo" | `Tenant.enabled_modules` + `Plan.features` |
| **RBAC** | "Este cargo puede ver esta sección" | `CargoSectionAccess` (granular) |

**Empty `enabled_modules` + empty `Plan.features` = sin filtro** — el tenant
ve TODOS los módulos LIVE. Esto es la doctrina "módulos universales
post-deploy" que Camilo articuló.

### Causa original del síntoma
El seed tenía `'is_enabled': False, # CASCADE L30` hardcodeado para
supply_chain — legado de la doctrina vieja (cascada lineal L0→L90). Cuando
S6 promovió supply_chain a LIVE, el seed no fue actualizado.

### Flujo correcto de liberación (documentado en seed docstring post-fix)

1. Descomentar app en `base.py` TENANT_APPS
2. `makemigrations` + `migrate_schemas`
3. Editar `seed_estructura_final.py`: cambiar `is_enabled: True` en el bloque del módulo
4. Deploy VPS → `deploy_seeds_all_tenants` propaga a todos los tenants
5. Módulo visible universalmente (salvo override comercial en Admin Global)

### Cambios aplicados
- `seed_estructura_final.py:936`: `is_enabled=True` para supply_chain
- `seed_estructura_final.py:1-63`: docstring reescrito con doctrina nueva
- `tenant_demo.enabled_modules`: reseteado a `[]` (respeta "universal")

---

---

## H-S6-unidades-medida-dup — Ruta `unidades-medida` duplicada post-activación

### Detectado
2026-04-19 (S6 activación supply_chain)

### Severidad
**BAJA** → ⚠️ PARCIAL tras S7-consolidacion.

### Estado: ⚠️ PARCIAL (wrapper supply_chain aún vivo)

**S7 (2026-04-19 noche)** resolvió la duplicación GRANDE:
`organizacion.UnidadMedida` legacy fue eliminado completamente (modelo,
viewset, tabla, FK `SedeEmpresa.unidad_capacidad` reapuntada). Ahora el
**source-of-truth único** es `catalogo_productos.UnidadMedida` (CT-layer).

Lo que **sigue pendiente** (menor):
- Wrapper `UnidadMedidaViewSet` en `supply_chain/almacenamiento/views.py:125`
  sigue sirviendo el canónico vía `/supply-chain/almacenamiento/unidades-medida/`
- `MovimientoInventarioFormModal.tsx` consume esa ruta
- Cierre total requiere migrar el hook FE al endpoint canónico

### Solución futura (cerrar wrapper)
1. Cambiar `frontend/src/features/supply-chain/hooks/useAlmacenamiento.ts` para
   que `useUnidadesMedidaAlmacenamiento` apunte a `/catalogo-productos/unidades-medida/`
2. Eliminar `UnidadMedidaViewSet` de `supply_chain/almacenamiento/views.py`
3. Eliminar el register en `supply_chain/almacenamiento/urls.py`
4. Verificar que `MovimientoInventarioFormModal.tsx` sigue funcionando

### Trigger
Sprint de refactor frontend de supply-chain (sin urgencia).

---

## H-S7-geo-catalog-location — Departamentos/Ciudades en Supply Chain vs Configuración

### Detectado
2026-04-19 (S7 consolidación catálogos)

### Severidad
**BAJA** — UX. No bloquea funcionalidad.

### Síntoma
Departamentos y Ciudades (33 deptos + 81 ciudades) son datos geográficos
nacionales (Core C0, `apps.core.models`). Actualmente aparecen en sidebar
bajo **Supply Chain → Catálogos** junto con catálogos específicos del módulo.

Evaluación pendiente: ¿mover a Configuración → Catálogos → General (junto
con Tipos Contrato y Tipos Documento)? Eso sería más coherente con el
principio de source-of-truth único por audiencia (transversal vs específico).

### Trigger
Sprint dedicado de UX sidebar (sin urgencia).

---

## H-S7-unidad-base-conflicto — Inconsistencias en jerarquía VOLUMEN post-merge

### Detectado
2026-04-19 (S7 consolidación catálogos)

### Severidad
**BAJA** — No rompe runtime, pero cálculos de conversión en VOLUMEN quedan matemáticamente inconsistentes.

### Síntoma
Tras consolidar legacy + canónico en `catalogo_productos.UnidadMedida`:
- **Canónico pre-merge**: Litro base=True factor=1.0, Metro cúbico base=False factor=1000
- **Legacy pre-merge**: M3 base=True factor=1.0, LT factor=0.001 apuntando a M3

Post-merge, el Pass 2 asignó `unidad_base=Metro cúbico` a Litro (copiando
jerarquía legacy), pero el `factor_conversion` de Litro se mantuvo en 1.0 (el
del canónico). Jerarquía inconsistente: Litro no es base pero tampoco tiene
factor correcto para convertir a m³.

### Impacto
Conversiones kg↔L, L↔m³ pueden dar resultados incorrectos si algún módulo
usa los métodos `convertir_a_base()` o `convertir_a()`. Actualmente ningún
módulo LIVE las usa (VOLUMEN solo aparece en capacidades de sede, no en
cálculos de negocio).

### Solución
Normalizar manualmente la jerarquía de VOLUMEN desde
`/catalogo-productos/unidades-medida/`:
- Opción A: Litro es base (factor=1, unidad_base=NULL); Metro cúbico factor=1000
- Opción B: Metro cúbico es base (factor=1, unidad_base=NULL); Litro factor=0.001

Criterio: cuál es más común en contexto colombiano/agroindustrial. Sugerido: **Opción A** (Litro como base, coherente con tanques y alimentos).

### Trigger
Cuando Production Ops o HSEQ activen cálculos de conversión de VOLUMEN.

---

## H-S7-supply-chain-tabla-unidad-medida-huerfana — ✅ RESUELTO (2026-04-20)

Cerrado en S8 con migración `supply_chain.catalogos.0002_drop_unidad_medida_huerfana`.
DROP TABLE IF EXISTS + RemoveModel aplicados. Cero consumidores verificados.

### Detectado
2026-04-19 (verificación post-RemoveModel en S7)

### Severidad
**BAJA** — Tabla DB sin modelo Django (huérfana por migración anterior incompleta).

### Síntoma
`SELECT tablename FROM pg_tables WHERE tablename LIKE '%unidad_medida%'`
muestra en tenant_demo y test: `supply_chain_unidad_medida`. Esta tabla
corresponde al modelo legacy `supply_chain.catalogos.UnidadMedida` que fue
eliminado del código en S6 (2026-04-19 noche, `43800b1f`) pero cuya migración
de DROP TABLE no se ejecutó (o se omitió).

### Impacto
Cero funcional. La tabla existe sin modelo Django que la use. Ocupa espacio
mínimo (vacía). No genera FK dangling porque ningún modelo vivo le apunta.

### Solución
Migración manual en `supply_chain.catalogos`:
```python
migrations.RunSQL(
    sql="DROP TABLE IF EXISTS supply_chain_unidad_medida CASCADE;",
    reverse_sql=migrations.RunSQL.noop,
)
```

### Trigger
Sprint de limpieza DB (sin urgencia).

---

## H-S7-rbac-v5-refactor — Separar Navigation de Permissions + Permission Templates

### Detectado
2026-04-19 (S7 — análisis arquitectónico tras bug de tab_code vs section_code)

### Severidad
**MEDIA-ALTA** — No bloquea funcionalidad actual (fix táctico `7d81d63f`
aplicado) pero acumula deuda cada vez que se libera un módulo nuevo.

### Síntoma
El modelo RBAC v4.1 acopla 3 conceptos que el mercado profesional separa:
1. **Permission unit = Menu node** (`TabSection`): cambiar UX del sidebar
   afecta permisos
2. **Nivel jerárquico → permisos default**: metadata organizacional
   decide authorization (un OPERATIVO no puede crear aunque el negocio
   lo requiera)
3. **Sin `PermissionTemplate` reutilizable**: 10 cargos con mismos
   permisos = 10 configuraciones individuales

### Evidencia
- Bug en rutas FE `supply-chain.routes.tsx`: pasaban tab_code como
  sectionCode → `compute_user_rbac` no generaba tab-level codes →
  usuarios con RBAC completo veían "Sin acceso"
- Fix táctico (commit `7d81d63f`): enriquecer `permission_codes` con
  tab-level codes. Desbloqueó la situación pero no resuelve el
  acoplamiento subyacente.
- Camilo observación (2026-04-19): *"el nivel del cargo no debería
  solapar el control RBAC, eso es innecesario y confuso"*

### Solución (v5.0)
Implementar arquitectura **Hybrid RBAC + Permission Templates + Nav
Separation** inspirada en Salesforce/Odoo/Workday:
- `Permission`: capability flat (`supply_chain.proveedor.create`)
- `PermissionTemplate`: role reutilizable (N cargos : 1 template)
- `Cargo`: estructura organizacional + FK a template
- `nivel_jerarquico`: metadata PURA (organigrama, reporting, nómina)
- Navigation layout en archivo config separado (YAML/JSON),
  independiente de permissions

**Ver plan detallado:** [docs/architecture/RBAC-V5-ROADMAP.md](RBAC-V5-ROADMAP.md)

### Duración estimada
4-5 días de un dev enfocado (5 fases A-E).

### Trigger
**CRÍTICO:** ejecutar antes del Sprint S8 (activación Production Ops).
Cada módulo C2 liberado bajo v4.1 acumula deuda arquitectónica.
Esperar a Sales CRM o HSEQ multiplica el trabajo del refactor.

---

## H-S7-seed-industrias-templates — Wizard UI de plantillas por industria

### Detectado
2026-04-19 (S7 — feedback de Camilo tras ver materias primas específicas
de rendering en modal de proveedor de un tenant genérico)

### Severidad
**BAJA** — UX, no bloquea funcionalidad. Ya mitigado parcialmente en
commit posterior (sacar data específica de industria del seed universal).

### Síntoma
Al crear proveedor tipo MP en cualquier tenant nuevo, el modal mostraba
12 tipos específicos de industria rendering (Sebo Bovino, Aceite Vegetal,
Hueso Bovino, etc.). Esos tipos SÍ aplican a grasas_y_huesos pero NO a
manufactura electrónica, retail, servicios, farmacéutica, etc.

### Mitigación ya aplicada
1. Sacar `CategoriaMateriaPrima` y `TipoMateriaPrima` del seed universal
   (`seed_supply_chain_catalogs`). Tenants nuevos arrancan sin data
   específica; el admin los crea desde `/supply-chain/catalogos`.
2. Crear seed dedicado `seed_supply_chain_demo_data` con los 6 cats +
   12 tipos de rendering, para ejecutar manual solo en `tenant_demo` o
   tenants reales de industria rendering.

### Solución definitiva (pendiente)
Wizard UI en `/supply-chain/catalogos` con botón "Cargar plantilla por
industria". Opciones sugeridas:

| Industria | Categorías sugeridas | Tipos MP ejemplo |
|---|---|---|
| Rendering / Agroindustria | Grasas, Huesos, Pieles, Químicos, Empaques | Sebo, Aceite, Cuero, Soda Cáustica |
| Manufactura electrónica | Componentes, Metales, Plásticos, Empaques | Resistores, Cobre, ABS, Cajas |
| Retail / Distribución | Productos terminados, Empaques, Limpieza | Por SKU proveedor |
| Servicios profesionales | Papelería, Software, Equipos | Licencias, Suscripciones |
| Farmacéutica | API, Excipientes, Empaques primarios | Principios activos, Excipientes |

El admin elige una industria, preview de lo que se cargará, confirma.
Registro en `TenantSeedRegistry` (consistente con patrón de cargos).

### Complejidad
- Backend: ~3-5 seeds por industria (1-2 días)
- FE: componente wizard + preview (1-2 días)
- Total: 3-5 días de un dev enfocado.

### Trigger
Cuando el onboarding de clientes reales muestre fricción (clientes
complain de "modal vacío") o cuando 5+ clientes de la misma industria
pidan la misma plantilla.

---

## H-S8-sidebar-db-driven — Mover SIDEBAR_LAYERS a base de datos

### Detectado
2026-04-20 (buenos-dias + cleanup post-S7 — `SIDEBAR_LAYERS` reducido
de 12 a 7 capas para reflejar LIVE real).

### Severidad
**MEDIA** — No bloquea L20 ni L25, pero cada activación de módulo C2
requerirá tocar el hardcode Python + redeploy. No escala a multi-tenant
con sidebars personalizables por cliente.

### Síntoma
`SIDEBAR_LAYERS` vive como constante Python en
`apps/core/viewsets_config.py:55-169`. Cualquier cambio de estructura
del sidebar (agregar capa, mover módulo entre capas, renombrar) exige:
- Editar código Python
- Commit + push + CI
- Deploy VPS
- Sin posibilidad de que admin global personalice por tenant

Patrón mercado moderno (SAP Fiori Launchpad, Salesforce App Launcher,
Dynamics 365, Odoo): navegación en DB, configurable por role/tenant.

### Solución propuesta

Modelo nuevo `SidebarLayer` en `apps.core`:

```python
class SidebarLayer(SharedModel):
    code = CharField(unique=True)       # 'NIVEL_FUNDACION'
    name = CharField()                  # 'Fundación'
    icon = CharField()                  # 'Landmark' (Lucide)
    color = CharField()                 # '#3B82F6'
    phase = CharField(choices=PHASES)   # 'PLANEAR'
    orden = PositiveIntegerField()
    is_active = BooleanField(default=True)

# SystemModule ya existe — agregar FK:
class SystemModule(...):
    sidebar_layer = ForeignKey(SidebarLayer, null=True, on_delete=SET_NULL)
```

Endpoint `_get_layers_config()` pasa de iterar constante a:
```python
SidebarLayer.objects.filter(
    is_active=True,
    systemmodule__is_enabled=True,  # solo capas con al menos 1 mod LIVE
).distinct().order_by('orden')
```

Admin global UI en `/admin/sidebar-layers/` para CRUD.

### Complejidad
- 1 model + migration + 1 seed (capas actuales) + admin UI: 1-2 días
- Migrar `SIDEBAR_LAYERS` → DB (data migration): 1 día
- Testing + QA browseable: 1 día
- **Total:** 2-4 días

### Trigger
- Antes de activar primer módulo C2 post-supply_chain (production_ops, sales_crm)
- O si un cliente pide sidebar personalizado

### Mitigación actual
`SIDEBAR_LAYERS` en Python funciona perfectamente para L0-L20 + supply_chain
(7 capas). No urgente hasta Sprint S8+ (siguiente activación C2).

---

## H-S8-catalogos-financieros-a-configuracion — Mover FormaPago y TipoCuentaBancaria a C1

### Detectado
2026-04-20 (auditoría de catálogos post-S7 — usuario pidió "no catálogos
redundantes en supply_chain").

### Severidad
**BAJA** — No es redundante hoy (no hay otro consumidor LIVE). Se vuelve
redundante cuando se activen `accounting`, `sales_crm`, `admin_finance`.

### Síntoma
`apps.supply_chain.gestion_proveedores` define dos catálogos financieros:
- `FormaPago` (CONTADO, CHEQUE, TRANSFERENCIA, CREDITO, ...)
- `TipoCuentaBancaria` (AHORROS, CORRIENTE, ...)

Estos son **transversales al dominio financiero**, no específicos de
proveedores. Cuando se active `sales_crm` (facturación a clientes) o
`accounting` (movimientos bancarios) o `tesoreria` (cuentas propias),
cada uno necesitará los mismos enums — duplicación inevitable.

### Solución propuesta
Mover los dos modelos a `apps.gestion_estrategica.configuracion` (C1):

- `gestion_estrategica.configuracion.FormaPago`
- `gestion_estrategica.configuracion.TipoCuentaBancaria`

Refactor equivalente al de `UnidadMedida` en S7:
- Crear los modelos nuevos en configuracion
- Data migration RunPython: copiar registros, crear FK temporal
- Reapuntar `Proveedor.formas_pago` y `Proveedor.tipo_cuenta`
- Eliminar modelos viejos de supply_chain
- Actualizar serializers/viewsets/FE hooks

### Complejidad
- Data migration cross-app: 1 día (patrón ya aplicado en S7 UnidadMedida)
- Refactor FE hooks + consumidores: 0.5 día
- Testing: 0.5 día
- **Total:** 2 días

### Trigger
Cuando se active el PRIMER consumidor adicional (`sales_crm` para facturas,
`accounting` para bancos, `admin_finance.tesoreria` para cuentas propias).
Se hará en la sesión de activación de ese módulo, no aislado.

### Mitigación actual
Ninguna necesaria. Los modelos funcionan en supply_chain; solo registra
la decisión de ubicación futura para no multiplicar catálogos cuando
crezca.

---

## H-S8-ct-disperso — Capa CT físicamente fragmentada

### Detectado
2026-04-20 (inventario arquitectónico para rehidratación Claude Web).

### Severidad
**MEDIA** — No bloquea deploy pero crea fricción cognitiva. Sin regla
estructural, futuras activaciones de CT no sabrán dónde ubicarse.

### Síntoma
La capa CT LIVE vive en ubicaciones dispersas en `backend/apps/`:
- `apps.catalogo_productos` — app plana en raíz (suelto).
- `apps.workflow_engine.{disenador_flujos, ejecucion, monitoreo, firma_digital}` — paraguas propio.
- `apps.gestion_estrategica.gestion_documental` — dentro de paraguas mixto `gestion_estrategica/`
  que también contiene C1 (configuracion, organizacion, identidad, contexto, encuestas)
  y C2 (planeacion, gestion_proyectos, planificacion_sistema, revision_direccion).

No existe paraguas `apps/infraestructura/`, `apps/shared/`, `apps/platform/`
ni `apps/ct/` que dé hogar unificado. El único candidato cercano es
`apps/shared_library/` pero es SHARED_APP public (biblioteca de plantillas
multi-tenant), distinta de CT.

### Impacto
- Cualquier desarrollador nuevo debe aprender memorizando dónde vive cada CT.
- Decisiones futuras ("¿este módulo nuevo es CT o C2?") no tienen criterio estructural, solo doc.
- `gestion_estrategica/` como paraguas mixto viola el principio "1 paraguas = 1 capa".

### Solución propuesta
Cuando se active el primer CT hoy comentado (workflow_engine sub-apps adicionales
o gestion_documental mudado), evaluar mover todos los CT a un paraguas común:

```
apps/infraestructura/
├── catalogo_productos/
├── gestion_documental/      # extraído de gestion_estrategica/
└── workflow_engine/
    ├── disenador_flujos/
    ├── ejecucion/
    ├── monitoreo/
    └── firma_digital/
```

Revisar también si `catalogo_productos` se muda (rompe ~15 imports, data
migration del `label` Django no necesaria si se mantiene mismo `label=catalogo_productos`).

### Trigger
Antes de activar el siguiente CT comentado (hoy ninguno está previsto).
Alternativa: aprovechar Sprint S10+ cuando toque activar motor_cumplimiento/motor_riesgos.

### Estado: ✅ RESUELTO (2026-05-02)
Cerrado en sprint dedicado de 4 días (29 abr → 2 may). Refactor masivo en 7 fases
con paralelización por agentes. **Estrategia Opción B+** aplicada: rename `app_label`
con prefijo `infra_*` + preservar `Meta.db_table` con valor histórico (cero `ALTER TABLE`
en N tenants).

**Estructura final ejecutada:**
```
apps/infraestructura/
├── catalogo_productos/      (label: infra_catalogo_productos)
│   ├── proveedores/         (sub-paquete fusionado, app_label = infra_catalogo_productos)
│   └── impresoras/          (label: infra_impresoras)
├── gestion_documental/      (label: infra_gestion_documental)
└── workflow_engine/
    ├── disenador_flujos/    (label: infra_disenador_flujos)
    ├── ejecucion/           (label: infra_workflow_ejecucion — explícito ahora)
    ├── monitoreo/           (label: infra_workflow_monitoreo — explícito ahora)
    └── firma_digital/       (label: infra_firma_digital)
```

**Volumen del refactor:** 199 archivos backend movidos con `git mv` (history preservada),
82 consumidores actualizados, 3 features frontend movidos a `features/infraestructura/`,
14 migraciones nuevas RunSQL reversibles, doble auditoría estructural+funcional convergente.

**Mergeado a `main`** en commit `6db6c874` (push origin verde, 10 commits).

**Procedimiento crítico para deploy VPS** (documentado en commit `50876af5`): aplicar
SQL manual en cada schema antes de `migrate` para evitar `InconsistentMigrationHistory`.

Detalle: `docs/auditorias/history/2026-05-02-ct-unification-cierre-completo.md`.

---

## H-S8-proveedores-ubicacion-incorrecta — Proveedor es CT, no C2

### Detectado
2026-04-20 (auditoría pre-deploy S8, rehidratación Claude Web).

### Severidad
**MEDIA-ALTA** — Bloquea limpieza arquitectónica futura. No bloquea deploy MP
porque ya funciona operativamente.

### Síntoma
`apps.supply_chain.gestion_proveedores` vive físicamente bajo el paraguas
`supply_chain/` (C2), pero conceptualmente es un dato maestro transversal:

| Consumidor futuro | App | Capa | ¿Necesita Proveedor? |
|---|---|---|---|
| Supply Chain (hoy) | supply_chain.compras, recepcion, liquidaciones | C2 | Sí |
| Admin Finance | administracion.presupuesto, tesoreria.tesoreria | C2 | Sí (pagos a proveedores) |
| Logistics & Fleet | logistics_fleet.gestion_transporte | C2 | Sí (transportistas) |
| Accounting | accounting.movimientos | C2 | Sí (terceros) |
| HSEQ | hseq_management.gestion_comites | C2 | Parcial (contratistas) |

Cuando el segundo C2 necesite consumirlo, Django obliga a `apps.get_model()` + IntegerField
(patrón cross-C2 del CLAUDE.md), lo que pierde el grafo de relaciones y obliga a manejar
integridad referencial a mano.

La ubicación correcta según principio de capa: CT (Infraestructura transversal), al mismo
nivel que `catalogo_productos`.

### Solución propuesta (refactor planeado)
Mover `supply_chain.gestion_proveedores/` → `catalogo_productos/proveedores/` o
`apps/proveedores/` (raíz CT).

Mudanza requiere:
- Renombrar label Django en `apps.py` (`gestion_proveedores` → `proveedores` o mantener).
- Data migration para actualizar `django_migrations.app` si cambia label.
- Actualizar imports en consumidores internos (4 archivos en `supply_chain/`).
- Actualizar imports en frontend si usa paths absolutos.
- Actualizar `SIDEBAR_LAYERS`, `urls.py` del config, y `INSTALLED_APPS`.

Rompe ~40 referencias; tests rescriben `apps.get_model('gestion_proveedores', ...)`.

### Estado
🔲 Abierto. Prioridad: S10-S12 (cuando se active el segundo C2 que consuma Proveedor,
típicamente `administracion.tesoreria` o `logistics_fleet.gestion_transporte`).

### Deuda interina (S8)
Se conserva la ubicación actual por pragmatismo — el deploy MP no puede
esperar la mudanza. Registrado aquí para no perder el contexto.

---

## H-S8-revision-direccion-coupling-eliminado — ✅ RESUELTO (2026-04-20)

Cerrado en S8 commit `e51f8b56`.

### Problema original
`apps.supply_chain.gestion_proveedores.viewsets:66` importaba
`ResumenRevisionMixin` desde `apps.gestion_estrategica.revision_direccion`
(módulo comentado en `base.py:144`, NO-LIVE). `ProveedorViewSet` heredaba
el mixin y sobrescribía `get_resumen_data()` — exponiendo un endpoint
`GET /api/supply-chain/proveedores/resumen-revision/` que alimentaba al
módulo futuro no-LIVE.

Violaba la regla operativa "LIVE es la única verdad": código LIVE acoplado
a app borrador. Además era cross-C2 conceptual (gestion_proveedores C2
importando de revision_direccion C2), doble infracción.

### Resolución
Eliminados:
- Import `ResumenRevisionMixin` en `viewsets.py:66`
- Herencia del mixin en `class ProveedorViewSet` línea 174
- Atributos `resumen_date_field`, `resumen_modulo_nombre` (líneas 198-200)
- Método `get_resumen_data()` (líneas 202-237, 36 LOC)

Verificado: cero consumidores del endpoint `resumen-revision` en backend
y frontend (greps limpios).

### Plan futuro
Cuando `revision_direccion` se active (roadmap C3), el mecanismo de resumen
se replantea desde el módulo correcto: C3 consumiendo vía API REST a los
C2 (no C2 heredando mixin de C2).

---

## Orden de ataque sugerido

| # | Hallazgo | Estado | Razón del orden |
|---|---|---|---|
| 1 | **H2 — Auto-memory** | ✅ RESUELTO | Bloquea todo lo demás porque sin un sistema confiable de memoria del proyecto, las decisiones de H1 (y de cualquier sesión futura) viven en frágil. |
| 2 | **H4 — Infra de test** | ✅ RESUELTO (2026-04-09) | Infra de test multi-tenant reconstruida. 528 passed, 0 errors. |
| 3 | **H10 — fast_test huérfano** | ✅ RESUELTO (2026-04-10) | Purgado vía TenantLifecycleService.delete_tenant_with_schema(). |
| 4 | **H3 — Validación de frescura** | 🔲 PENDIENTE | Los 28 archivos promovidos pueden tener info obsoleta. Menos urgente que H4. |
| 5 | **H1 — Portales** | 🔲 PENDIENTE | Decisión arquitectónica grande. Requiere perímetro LIVE sólido primero. |
| 6 | **H11 — DatabaseScheduler drift** | 🔲 PENDIENTE | 15 tareas zombie en DB. Requiere purga de django_celery_beat_periodictask. |
| 7 | **H17 — Docker healthcheck celery** | 🔲 PENDIENTE | Dockerfile healthcheck asume HTTP :8000. celery/celerybeat no tienen HTTP. |

| 8 | **H13 — Paths cortos documental** | 🔲 PENDIENTE | Tasks documental usan paths cortos en vez de dotted path completo. |
| 9 | **H14 — ess_urls.py imports incondicionales** | 🔲 PENDIENTE | Amplía H1 — views NO-LIVE importadas a nivel de módulo. |
| 10 | **H18 — bootstrap Fase 4b legacy** | 🔲 PENDIENTE | Cleanup migraciones fantasma. Evaluar si sigue siendo necesario. |
| 11 | **H19 — delete_tenant dry-run/confirm** | 🔲 PENDIENTE | Flags redundantes. Simplificar. |
| 12 | **H20 — delete_tenant → purge_tenant** | ✅ RESUELTO (2026-04-10) | Renombrado por colisión con django-tenants. |
| 13 | **H21 — hard-delete sin tests API** | 🔲 PENDIENTE | Endpoint usa servicio testeado, falta cobertura HTTP. |
| 14 | **H22 — Idempotencia Fase B** | ✅ RESUELTO (2026-04-10) | Pre-check validate_invariant antes de CREATE SCHEMA. |
| 15 | **H23 — testing.py lee DB_NAME del env** | 🔲 PENDIENTE | Config frágil: test DB name depende de .env en vez de ser independiente. |
| 16 | **H-S5-pwa-branding-unificado** | 🔲 PENDIENTE | Sin workaround por política. Scheduled para sprint Branding v2 post-S6 Supply Chain. |
| 17 | **H-S8-sidebar-db-driven** | 🔲 PENDIENTE | Escalabilidad: SIDEBAR_LAYERS hardcoded en Python no escala. Trigger: antes de activar primer C2 post-supply_chain. |
| 18 | **H-S8-catalogos-financieros-a-configuracion** | 🔲 PENDIENTE | Mover FormaPago + TipoCuentaBancaria a C1 cuando se active primer consumidor adicional (sales_crm/accounting/tesoreria). |
| 19 | **H-S8-ct-disperso** | ✅ RESUELTO (2026-05-02) | Cerrado en sprint dedicado 4 días. 3 paquetes movidos a `apps/infraestructura/` con app_label `infra_*` (Opción B+). 199 archivos BE + 82 consumidores + 3 features FE + 14 migraciones reversibles. Mergeado a main commit `6db6c874`. Pendiente deploy VPS con SQL manual previo. |
| 20 | **H-S8-proveedores-ubicacion-incorrecta** | 🔲 PENDIENTE | gestion_proveedores conceptualmente es CT, vive en C2 por pragmatismo. Mudanza S10-S12 al activar segundo consumidor. |
| 21 | **H-S7-supply-chain-tabla-unidad-medida-huerfana** | ✅ RESUELTO (2026-04-20) | Cerrado en S8 con migración `catalogos.0002_drop_unidad_medida_huerfana`. |
| 22 | **H-S8-revision-direccion-coupling-eliminado** | ✅ RESUELTO (2026-04-20) | Cerrado en S8 commit `e51f8b56`. Sin acoplamiento LIVE → NO-LIVE. |
| 23 | **H-S8-rbac-botones-sin-check** | 🔲 PENDIENTE | **CRÍTICA — BLOQUEANTE PRE-DEPLOY**. Frontend renderiza botones sin consultar permisos. S8.5 sesión dedicada. |
| 24 | **H-S8-modal-proveedor-ux-rota** | 🔲 PENDIENTE | **ALTA — BLOQUEANTE PRE-DEPLOY**. 5 problemas UX + bug funcional de submit. S8.6 sesión dedicada. |
| 25 | **H-S8-dependabot-45-vulns** | 🔲 PENDIENTE | **ALTA POST-DEPLOY**. 45 vulns acumuladas (1 crítica Django CVE-2025-64459). Triage antes de S10. |

**Sesiones estimadas:** H3 (1 sesión), H1 (1-2 sesiones), H11 (30 min), H13 (15 min), H23 (15 min), H-S5-pwa-branding (1-2 sesiones), H-S8-sidebar-db-driven (2-4 días), H-S8-catalogos-financieros (2 días).

---

## Lo que NO se hizo en la sesión 2026-04-08 (para evitar escalada de compromiso)

- Inventario Sub-bloque 1 (Auth/JWT/Session) — postergado a próxima sesión
- Refactor Opción B del Sub-bloque 1 — postergado
- Migración real de auto-memory — solo snapshot bruto
- Definición arquitectónica de Portales — solo registro del hallazgo
- Modificación de `CLAUDE.md` — intacto

## Lo que SÍ se hizo

- Limpieza Celery Beat: 12 tareas zombie comentadas (commit `ccb27ced`)
- Documentación de excepción analytics en L0-INDEX.md
- Snapshot de emergencia de auto-memory (commit `445f1210`)
- Este documento de hallazgos pendientes

---

## H-S8-rbac-botones-sin-check — Botones de acción no chequean permisos RBAC

### Detectado
2026-04-20, validación manual en browser post-push S8.

### Módulo
Supply Chain / Catálogo de Productos (confirmado). **Probable sistémico en todos los módulos LIVE**.

### Severidad
**CRÍTICA** — Bloqueante de deploy MP. Viola el modelo de seguridad RBAC.

### Síntoma
Los botones de acción (eliminar, editar, crear) en el frontend NO chequean permisos
del usuario antes de renderizarse. Reproducción:

1. Super admin desmarca permiso `delete` para un Cargo X en `/usuarios/rbac/`.
2. Usuario con Cargo X hace logout + hard refresh + login.
3. Entra a `/catalogo-productos/productos` y el botón "Eliminar" sigue visible y
   funcional — ejecuta la acción exitosamente.

Backend correctamente rechaza la acción si se llama al endpoint directamente (RBAC
middleware OK). El fallo es puramente del frontend: renderiza UI sin consultar
permisos.

### Impacto
- Usuario ve acciones que no debería — confusión UX.
- Si la acción logra iniciarse, espera response del backend; si backend falla por RBAC,
  surge error que debió prevenirse en UI.
- Viola principio least-privilege UI: mostrar solo lo autorizado.
- Cualquier decisión de "desactivar feature por RBAC" se anula si el botón no
  respeta el permiso.

### Causa raíz (hipótesis)
No existe patrón estandarizado de consulta de permisos en componentes de acción.
Cada módulo implementa (o no) su propio chequeo, sin enforcement. El hook
`compute_user_rbac` del backend expone `permission_codes` en `/api/core/users/me/`
pero no hay wrapper frontend que lo consuma uniformemente.

### Propuesta de fix
Refactor sistémico:

1. Crear componente `<PermissionButton>` en `frontend/src/components/common/`:
   ```tsx
   <PermissionButton
     permission="catalogo_productos.productos.delete"
     onClick={handleDelete}
   >
     Eliminar
   </PermissionButton>
   ```
   Oculta el botón si el usuario no tiene el permission_code.

2. Alternativa/complemento: hook `usePermission()`:
   ```tsx
   const canDelete = usePermission('catalogo_productos.productos.delete');
   return canDelete ? <Button onClick={...}>Eliminar</Button> : null;
   ```

3. Audit global de todos los botones de acción en módulos LIVE y migrarlos.

4. Tests: cada módulo debe tener test E2E con usuario de cargo restringido.

### Trigger
**BLOQUEANTE pre-deploy MP.** Próxima sesión dedicada (S8.5).

### Estado
🔲 Abierto

---

## H-S8-modal-proveedor-ux-rota — Modal crear proveedor con UX y bug funcional

### Detectado
2026-04-20, validación manual en browser post-push S8.

### Módulo
Supply Chain / Proveedores / Modal `ProveedorForm.tsx`.

### Severidad
**ALTA** — Bloquea 33% del objetivo operativo S8: "crear proveedores en producción".

### Síntomas (5 problemas descubiertos)

1. **Checkboxes planos no escalables**: tipos de MP renderizados como grid de
   checkboxes en contenedor `max-h-48 overflow-y-auto`. Con >10 ítems se satura,
   sin búsqueda, sin chips de seleccionados.
2. **Catálogo stale**: si el usuario crea una MP nueva en otra pantalla
   (`/catalogo-productos/productos`) y vuelve al modal, la lista no refleja
   el nuevo ítem. No hay re-fetch al abrir el modal.
3. **Multi-select no visible**: el backend soporta M2M
   (`productos_suministrados`) pero el modal no muestra claramente que permite
   múltiples selecciones simultáneas.
4. **No dinámico por tipo de proveedor**: un proveedor Transportista ve campos
   irrelevantes de MP. Debería renderizar solo las secciones aplicables al
   `TipoProveedor` seleccionado (hoy hay flag `requiere_materia_prima` pero
   el FE no la consume para ocultar secciones).
5. **🚨 Bug funcional — submit no crea proveedor**: el botón "Crear" ejecuta el
   POST pero la creación falla. Validación backend rechaza o el payload del
   FE es inválido. No se crea el proveedor → **objetivo de deploy bloqueado**.

### Impacto
- Usuario no puede completar la operación más básica de Supply Chain.
- 33% del deploy MP inutilizable (crear proveedor + asignar MP + asignar precio).
- UX por debajo del estándar de mercado (Linear, Vercel, Stripe, Notion).

### Propuesta de fix
Sesión dedicada (S8.6):

1. **Auditoría del payload actual**: inspeccionar Network tab del POST
   `/api/supply-chain/proveedores/` y compararlo con `ProveedorCreateSerializer`
   del backend. Identificar field mismatch o validación bloqueante.
2. **Rediseño del modal** con patrón mercado:
   - `Combobox` multi-select con búsqueda integrada + chips visibles.
   - Agrupación de productos por `CategoriaProducto` (catálogo canónico).
   - Re-fetch de catálogos al abrir modal (`staleTime: 0` para ese query).
   - Secciones dinámicas condicionales al `tipo_proveedor`:
     - `requiere_materia_prima` → muestra sección productos/precios.
     - `requiere_modalidad_logistica` → muestra sección logística.
     - `codigo == 'CONSULTOR'` → muestra flag `es_independiente`.
   - Validación inline (Zod + RHF) en lugar de solo al submit.
   - Botón Crear disabled hasta que los requeridos estén completos.
   - Empty state educativo si no hay productos en catálogo.
3. **Eliminar campo `nit` redundante**: ver H-S8-nit-redundante (pendiente de
   abrir si se confirma).

### Trigger
**BLOQUEANTE pre-deploy MP.** Sesión dedicada (S8.6), después de S8.5 RBAC.

### Estado
🔲 Abierto

---

## H-S8-dependabot-45-vulns — 45 vulnerabilidades acumuladas, 1 crítica

### Detectado
2026-04-20, push de S8 a GitHub.

### Módulo
Dependencias globales del repo (pip + npm).

### Severidad
**ALTA** — Deuda de seguridad. No bloquea funcionalidad LIVE pero expone
superficie de ataque.

### Breakdown
| Severidad | Cantidad |
|-----------|----------|
| Critical  | 1 |
| High      | 14 |
| Moderate  | 26 |
| Low       | 4 |
| **Total** | **45** |

### Vulnerabilidad crítica identificada

- **Paquete**: `django` (pip, `backend/requirements.txt`)
- **Versión afectada**: `>= 5.0a1, < 5.1.14` (local: Django **5.0.14** → afectada)
- **Parche**: **5.1.14** (upgrade minor 5.0 → 5.1)
- **CVE**: [CVE-2025-64459](https://github.com/advisories/GHSA-frmv-pr5f-9mcr)
  (GHSA-frmv-pr5f-9mcr) — **CVSS 9.1 Critical**
- **Advisory**: SQL injection en `QuerySet.filter()`, `QuerySet.exclude()`,
  `QuerySet.get()` y `Q()` cuando se usa `_connector` como key en dict-expansion
  (`**kwargs`).
- **Tipo**: Runtime dependency (producción).
- **Exposición real en StrateKaz**: bajo. Requiere código que haga
  `Q(**user_controlled_dict)` donde el dict incluya `_connector` — patrón no
  presente en el código LIVE verificado.
- **Nota operativa**: Dependabot intentó PR #70 que fue cerrado (probable
  incompatibilidad con `django-tenants` u otros pinns). Upgrade manual
  requiere evaluación de compat.

### Impacto
- 1 vuln crítica explotable si código downstream introduce dict-expansion
  con `_connector` user-controlled.
- 14 high pendientes de triage individual.
- El repo `security/dependabot` crece sin triage sistemático.

### Propuesta de fix
Sesión dedicada post-deploy MP (pre-S10):

1. **Triage automatizado** (30 min):
   - Listar las 15 críticas + high por paquete y ecosystem.
   - Clasificar en: (a) upgrade directo compat, (b) requiere breaking change,
     (c) no afecta superficie pública.
2. **Upgrade en bloque** (1-2 días):
   - Django 5.0.14 → 5.1.14 (validar django-tenants 3.10 compat).
   - axios, picomatch, lodash, follow-redirects (high frecuentes).
   - Tests de regresión post-upgrade.
3. **Setup Dependabot auto-merge** para parches security low/moderate
   (configurar `.github/dependabot.yml`).
4. **Política**: revisar alertas cada sprint, no esperar acumulación.

### Trigger
**ALTA post-deploy MP.** Antes de Sprint S10.

### Estado
🔲 Abierto

---

## H-S9-modal-mount-condicional — Modales se montan aunque estén cerrados

### Detectado
2026-04-21, navegando a `/supply-chain/precios` (browser console warning
"Maximum update depth exceeded" en `PreciosProveedorModal.tsx:87`).

### Módulo
Supply Chain (`features/supply-chain/components/PreciosProveedorModal.tsx`)
y, por extensión, el patrón general de modales en el frontend.

### Severidad
**MEDIA** — No bloquea funcionalidad post-fix, pero es un patrón
arquitectónico que amplifica cualquier bug de render loop en un modal.

### Síntoma observable
`PreciosTab` renderiza `<PreciosProveedorModal isOpen={modalOpen} ... />`
**siempre**, incluso con `modalOpen=false`. Esto implica que:

1. El modal se monta al cargar el tab (antes de que el usuario haga click).
2. `useQuery` se registra en React Query aunque `enabled=false` (el hook
   corre, solo no dispara el request).
3. `useEffect([data])` corre al menos 1 vez con `data=undefined`.
4. Cualquier dependencia inestable en hooks del modal se amplifica aunque
   el usuario nunca lo abra.

El bug del loop infinito (deps `[filas]` con default `[]` creando nueva
referencia cada render) existía hace semanas pero quedaba invisible
porque el modal solo se renderiza con `isOpen=false` hasta que el
usuario clickea un proveedor. El fix actual (`[data]` + guard `!data`)
elimina el síntoma, pero el patrón de montaje permanente sigue ahí.

### Causa raíz
Patrón copiado de `BaseModal` legacy donde el modal controla su
visibilidad internamente con CSS (display:none / opacity:0) en lugar de
unmount. Útil para animaciones de apertura/cierre, pero caro en:

- Effects corriendo en vacío
- Subscripciones a React Query sin utilidad
- Estado residual entre aperturas (si se abre modal A, se cierra y se
  abre modal B del mismo componente, rowStates puede contener datos
  stale de A hasta que React Query resuelva B)

### Alcance del patrón en el repo
Grep pendiente confirmar, pero al menos estos modales heredan el patrón:
- `PreciosProveedorModal` (supply-chain)
- `HistorialPrecioDialog` (supply-chain)
- Probablemente modales de `mi_equipo`, `catalogo_productos`,
  `gestion_documental`.

### Impacto
- **Performance:** effects y queries innecesarias en cada tab con modales.
- **Bugs latentes:** un loop infinito en cualquier modal se dispara en
  carga de página, no cuando el usuario lo abre.
- **Estado residual:** modales reutilizados pueden mostrar datos stale
  entre aperturas.

### Propuesta de fix
**Patrón recomendado:** montaje condicional explícito.

```tsx
{modalOpen && (
  <PreciosProveedorModal
    isOpen={modalOpen}
    onClose={handleClose}
    proveedorId={selectedId}
    ...
  />
)}
```

Alternativas a evaluar en sesión dedicada:
1. Montaje condicional manual (patrón arriba) — simple, sin animaciones
   de cierre.
2. `AnimatePresence` de framer-motion si se quiere animación de salida
   con unmount real.
3. Refactor de `BaseModal` para aceptar prop `unmountOnClose` (default
   `true`) — fix sistémico en un solo lugar.

**Migración sugerida:** opción 3 (BaseModal con `unmountOnClose`) porque:
- Fix centralizado.
- Default seguro (unmount) preserva invariantes actuales.
- Callers con animación específica pueden opt-out.

### Trigger
**MEDIA post-deploy MP.** No bloqueante. Entrar cuando se toque
`BaseModal` o cuando aparezca otro bug de render loop en modales.

### Estado
🔲 Abierto

---

## H-C1-01 — Admin de plataforma mezclado con Fundación (C1)

### Detectado
2026-04-22 (análisis de composición C1 para preparar refactor hacia microservicios).

### Severidad
**MEDIA-ALTA** — No bloquea operación, pero ensucia el bounded context de C1.
Si mañana extraemos `fundacion-service` como microservicio, nos llevamos por
accidente infraestructura técnica que pertenece a la plataforma (C0).

### Síntoma
El paraguas `apps.gestion_estrategica.configuracion` (C1) aloja 4 modelos
cuya naturaleza es **admin técnico de plataforma**, no "identidad fundacional
de la empresa":

| Modelo | Archivo | Naturaleza real |
|---|---|---|
| `IntegracionExterna` + `ProveedorIntegracion` + `TipoServicioIntegracion` | `configuracion/models.py` L916-1775 | Conexiones con sistemas externos (API, webhook, ERP). Es admin de plataforma |
| `CertificadoDigital` | `configuracion/models.py` L1776 | Infraestructura criptográfica PKI. Pertenece a `workflow_engine/firma_digital` (CT) o a un C0 de seguridad |
| `IconRegistry` | `configuracion/models.py` L2241 | Registro de íconos Lucide disponibles. Metadata UI pura — C0 (`shared_library` o similar) |
| `ConsecutivoConfig` | `organizacion/models_consecutivos.py` | Numeración automática de documentos por tipo. Es admin técnico transversal |

El propio doc `arquitectura-cascada.md` §13 "Secciones que se mueven" ya declaró
que `Integraciones` y `Consecutivos` deben migrar de Fundación a
`configuracion_plataforma`. Pendiente de ejecutar + descubrir adicionalmente
`CertificadoDigital` e `IconRegistry`.

### Impacto
- **Microservicios:** un servicio "Fundación" separado debería poder arrancar
  sin depender de certificados digitales, catálogo de íconos, ni proveedores
  de integración externa. Hoy no puede.
- **Cognitivo:** un dev nuevo busca "dónde se configura una integración
  con SAP" y encuentra la sección dentro de "Fundación" — inconsistente con
  el modelo mental de capas.
- **Seeds/permisos RBAC:** los section codes de C1 se mezclan con los de
  admin técnico; la matriz de permisos es más pesada de lo necesario.

### Solución propuesta
Crear app `apps.configuracion_plataforma` (ya referenciada en `SIDEBAR_LAYERS`
bajo `NIVEL_CONFIG` pero sin implementación real) y migrar:

```
apps.configuracion_plataforma/
├── integraciones/       # desde configuracion/ → IntegracionExterna + ProveedorIntegracion + TipoServicioIntegracion
├── consecutivos/        # desde organizacion/models_consecutivos.py
├── certificados/        # desde configuracion/ → CertificadoDigital (o mover a CT/firma_digital)
└── iconos/              # desde configuracion/ → IconRegistry (o mover a shared_library C0)
```

Alternativa más conservadora para `CertificadoDigital` e `IconRegistry`:
no los muevo a `configuracion_plataforma`, los mando a CT/C0 directo según
su naturaleza real (firma digital / shared UI).

Migración requiere:
- Data migration preservando IDs (foreign keys desde otros modelos).
- Actualizar `label` en `apps.py` y `django_migrations.app`.
- Actualizar `INSTALLED_APPS`, `SIDEBAR_LAYERS`, `urls.py`, seeds de
  `SystemModule`/`ModuleTab`/`TabSection`.
- Mover serializers, viewsets, frontend pages.

### Trigger
Antes de promover StrateKaz a "Core 1.0" o antes del primer split en
microservicios. No antes de consolidar L0-L20 estable (criterio del proyecto).

### Estado
🔲 Abierto. Prioridad: **S10+** (después de cerrar S8.7 y consolidar supply_chain).

---

## H-C1-02 — Zonas grises entre C1, CT y C2 sin decisión explícita

### Detectado
2026-04-22 (análisis de composición C1 para preparar refactor hacia microservicios).

### Severidad
**MEDIA** — No rompe nada hoy. Pero el día que se dividan las capas en
servicios independientes, sin decisión previa cada modelo gris se va a
colar al servicio equivocado.

### Síntoma
Cuatro modelos de C1 tienen naturaleza dual C1/CT o C1/C2 que nunca se
resolvió formalmente:

| Modelo | Ubicación actual | Tensión | Argumento C1 | Argumento CT / C2 |
|---|---|---|---|---|
| `EstrategiaTOWS` | `contexto/models.py` L262 | Nace del análisis DOFA pero es planeación | Contexto la genera | Planeación Estratégica (C2) la ejecuta. Ya hay comentario en el código sobre dependencia circular contexto→planeación |
| `MatrizComunicacion` | `contexto/models.py` L1133 | Define comunicaciones periódicas con PI (ISO 7.4) | Es config declarativa de stakeholders | Es infraestructura operativa transversal — se ejecuta continuamente, se audita |
| `encuestas` (app entera) | `gestion_estrategica/encuestas/` | Hoy solo alimenta DOFA/PESTEL | App acoplada a contexto (FK directo a `AnalisisDOFA`) | Si evoluciona a evaluación desempeño/clima/satisfacción → motor transversal (CT) |
| `AlcanceSistema` (campos de certificación) | `identidad/models.py` L184 | Alcance declarativo del SIG + datos vigentes de certificación ISO | El alcance es declarativo C1 | `expiry_date`, `next_audit_date`, `certificate_file` son operación → C2 Auditoría Interna o CT |

### Impacto
- **Microservicios:** si se extrae `contexto-service`, se lleva la matriz
  de comunicaciones (que debería ser transversal) y las estrategias TOWS
  (que deberían vivir en `planeacion-service`).
- **Reglas de independencia frágiles:** la regla "CT no importa de C2"
  está documentada, pero si `MatrizComunicacion` (hoy C1) en el futuro
  necesita pull desde varios C2 (auditorías, proyectos), la decisión se
  tomará caliente y sin marco.
- **Duplicación futura:** si se crea un motor genérico de encuestas para
  desempeño (talent_hub) sin mover el actual, habrá dos motores de
  encuestas desalineados.

### Solución propuesta
**Sesión dedicada de decisión arquitectónica** que produzca, para cada uno
de los 4 items:

1. Capa final declarada (C1 / CT / C2).
2. Fecha tentativa de mudanza (ej: "cuando se active talent_hub.desempeno").
3. Cualquier `IntegerField` de referencia cross-capa necesario para
   desacoplar, anotado explícitamente.

Decisión preliminar sugerida (para discusión):
- `EstrategiaTOWS` → mudar a `planeacion` (C2) cuando planeación se active.
  La DOFA la origina pero la ejecución es planeación.
- `MatrizComunicacion` → CT (servicio transversal de comunicaciones con PI).
  Requiere que Partes Interesadas siga siendo maestro en C1.
- `encuestas` → permanece C1 hoy. Promover a CT cuando primer C2
  no-contexto la consuma (ver H-C1-03).
- `AlcanceSistema` campos operativos → extraer a C2 Auditoría Interna
  cuando se active. Alcance declarativo permanece en `identidad`.

### Trigger
Sesión de auditoría cross-capa, antes de la activación de:
- `planeacion_estrategica` (mueve `EstrategiaTOWS`).
- `talent_hub.desempeno` (dispara H-C1-03 encuestas).
- `auditoria_interna` (mueve campos operativos de `AlcanceSistema`).

### Estado
🔲 Abierto. Prioridad: **S12+** (después de H-C1-01).

---

## H-C1-03 — `encuestas` candidata a promoción a CT cuando primer C2 no-contexto la consuma

### Detectado
2026-04-22 (análisis de composición C1).

### Severidad
**BAJA-MEDIA** — No hay bug hoy. Es deuda *anticipada*: si el primer C2
que necesite encuestas fuera de contexto las re-implementa, habrá doble
motor desde el día 1.

### Síntoma
`apps.gestion_estrategica.encuestas` está hoy 100% acoplada a contexto:
- `EncuestaDofa` tiene FK directa a `AnalisisDOFA` + `AnalisisPESTEL`.
- El banco de preguntas (`PreguntaContexto`) es específico PCI-POAM.
- Las tablas viven bajo `db_table='encuestas_*'` pero sus foreign keys
  apuntan solo a contexto.

Sin embargo, la arquitectura natural de encuestas es **transversal**:

| Módulo futuro | Uso de encuestas |
|---|---|
| `talent_hub.desempeno` (L60) | Evaluación de desempeño 360°, autoevaluaciones |
| `talent_hub.control_tiempo` (L60) | Encuesta de clima laboral anual |
| `sales_crm.servicio_cliente` (L35) | NPS, satisfacción de cliente |
| `supply_chain.evaluaciones` (LIVE) | Evaluación periódica de proveedores |
| `hseq_management.gestion_comites` (L30) | Encuestas de percepción SST |
| `revision_direccion` (L85) | Encuesta pre-revisión gerencial |

El día que el primer C2 de arriba quiera encuestas, si `encuestas` sigue
acoplada a contexto, el dev tendrá dos caminos:
1. Re-implementar encuestas dentro del C2 → **duplicación**.
2. Forzar una FK de contexto desde el C2 → **inversión de dependencia**
   (CT importando de C2 está prohibido).

### Solución propuesta
Promover `encuestas` a CT en un refactor progresivo:

**Fase 1** (cuando activa el primer C2 consumidor):
- Renombrar `EncuestaDofa` → `Encuesta` (genérica).
- Quitar FK a `AnalisisDOFA`/`AnalisisPESTEL`; cambiar por `contexto_type`
  + `contexto_id` (generic FK o IntegerField cross-capa).
- Mover `PreguntaContexto` y el banco PCI-POAM a `apps.gestion_estrategica.contexto/models_preguntas_contexto.py`
  (específico de contexto).
- Dejar en `encuestas` solo: `Encuesta`, `TemaEncuesta`, `ParticipanteEncuesta`,
  `RespuestaEncuesta` como motor puro.
- Mover físicamente `apps/gestion_estrategica/encuestas/` → `apps/infraestructura/encuestas/`
  (en línea con H-S8-ct-disperso).

**Fase 2**:
- Cada C2 consumidor implementa su propia "fuente" de encuestas
  (`evaluacion_desempeno`, `clima_laboral`, `nps_cliente`, etc.) que crea
  `Encuesta` y lee `RespuestaEncuesta` sin duplicar el motor.

### Trigger
Cuando el primer C2 no-contexto declare necesidad de encuestas. El
candidato más probable por roadmap es `talent_hub.desempeno` (L60) o
`supply_chain.evaluaciones` (ya LIVE pero aún no implementa encuestas).

### Dependencia
- Depende de H-C1-02 (decisión formal de capa).
- Independiente de H-C1-01.

### Estado
🔲 Abierto. Prioridad: reactiva — se atiende cuando llegue el trigger.

---

## H-C1-05 — `TipoContrato` duplica Gestor Documental (aplicar patrón v4.0 de políticas)

### Detectado
2026-04-22 (análisis de composición C1).

### Severidad
**BAJA-MEDIA** — No hay bug hoy. Es **inconsistencia arquitectónica** con
el patrón ya validado en `identidad` v4.0 (eliminación de `PoliticaEspecifica`).

### Síntoma
`TipoContrato` vive hoy en `apps.gestion_estrategica.configuracion`
(`models.py` L2423) como modelo propio con sus campos (nombre, tipo de
contrato, cláusulas, etc.).

Esto **reproduce el anti-patrón** que ya fue corregido en `identidad` v4.0:

| Modelo | Antes | Después |
|---|---|---|
| `PoliticaEspecifica` (políticas) | Modelo propio en `identidad` con contenido + flujo | **ELIMINADO**. Políticas viven en GD con `tipo_documento=POL`. `identidad` solo referencia read-only |
| `TipoContrato` (contratos) | Modelo propio en `configuracion` con contenido + campos | ⚠️ **Aún duplicado**. Debería ser documento en GD con `tipo_documento=PLANTILLA_CONTRATO_*` |

Comentario textual en `identidad/models.py` L302-307:

> **NOTA v4.0:** `PoliticaEspecifica` ELIMINADA. Las políticas se gestionan
> exclusivamente desde Gestión Documental (tipo_documento=POL). Identidad
> Corporativa solo muestra políticas vigentes como referencia read-only.

El patrón correcto (ya demostrado en producción para políticas) no fue
propagado a contratos.

### Impacto
- **Doble fuente de verdad:** si un consultor edita la plantilla desde
  Fundación → toca `TipoContrato`. Si alguien la actualiza desde GD →
  toca `Documento`. Pueden quedar desalineados.
- **No hereda features de GD:** versionado (Borrador→Vigente→Obsoleto),
  control de cambios, flujo de aprobación, asignación a cargos, firma
  gerencial. `TipoContrato` tendría que re-implementar todo esto si se
  quieren esas features.
- **Cuando Mi Equipo instancia un contrato** (contrata a Juan), hoy debe
  consumir `TipoContrato` como dato maestro. Si se migrara a GD, pediría
  a GD "dame la plantilla vigente de término fijo" y recibiría el
  `Documento` con historial, firma, etc.

### Solución propuesta (replicar patrón políticas v4.0)
1. Crear `tipo_documento=PLANTILLA_CONTRATO_TERMINO_FIJO`, `PLANTILLA_CONTRATO_INDEFINIDO`,
   etc. en catálogo de tipos de documento GD.
2. Migrar datos de `TipoContrato` a `Documento` con nuevos tipos.
3. En Fundación Tab 4, sección "Contratos Tipo" → queda como **vista
   read-only** que lista plantillas vigentes (como hoy lo hace con
   políticas).
4. En Mi Equipo → Colaboradores → al contratar, consumir plantilla desde
   GD vía `apps.get_model('gestion_documental', 'Documento')` +
   filtro por `tipo_documento__code__startswith='PLANTILLA_CONTRATO_'`.
5. Eliminar `TipoContrato` modelo.

### Trigger
**Reactivo** — se atiende cuando:
- Se active `talent_hub.novedades` o se necesite versionar plantillas con
  firma (ambos hoy fuera de LIVE).
- Se haga otra pasada a `identidad` / `configuracion` para limpieza C1.
- O proactivamente junto con H-C1-01 (limpieza de admin de plataforma
  en C1) — son el mismo esfuerzo de reorganización.

### Dependencia
- Independiente de H-C1-01, H-C1-02, H-C1-03.
- Precedente validado: v4.0 de `identidad` (PoliticaEspecifica eliminada).

### Estado
🔲 Abierto. Prioridad: **reactiva o junto con H-C1-01**.

---

## H-UI-01 — Sidebar V3: reorganización completa (capas invisibles, historia visible)

### Detectado
2026-04-22 (sesión de análisis Frente A del sidebar con Camilo).

### Severidad
**MEDIA-ALTA** — El sidebar actual no cuenta historia coherente. Los módulos
LIVE están ordenados por accidente de activación, no por lógica de uso.

### Síntoma
Sidebar actual (orden):
```
Dashboard / Mi Portal
Fundación / INFRAESTRUCTURA (wrapper) / Gestión de Personas
Cadena de Suministro / Centro de Control / Flujos de Trabajo / Configuración
```

Problemas:
- "INFRAESTRUCTURA" es la única categoría UPPERCASE — rompe visualmente
- Workflows (CT) aparece al final, separado de otros CT
- "Centro de Control" (C0 admin) se confunde con módulos de negocio
- Orden no refleja flujo narrativo del empresario

### Estructura V3 acordada
```
Dashboard / Mi Portal / Mi Muro                    ← landings personales
─── sep ───
Fundación                                           ← C1
─── sep ───
Gestión Documental                                  ← CT (sin wrapper)
Catálogos Maestros
Flujos de Trabajo
Firma Digital
─── sep ───
═══ Gente ═══                                       ← C2 con sub-separadores B
Mi Equipo
Talent Hub (futuro)
═══ Planeación ═══
Planificación Operativa (futuro)
Planeación Estratégica (futuro)
═══ Riesgo ═══
Protección y Cumplimiento (futuro)
Gestión Integral HSEQ (futuro)
═══ Operación Comercial ═══
Cadena de Suministro (LIVE)
Producción / Logística / Sales CRM (futuro)
═══ Finanzas ═══
Administración / Tesorería / Contabilidad (futuro)
─── sep ───
Configuración                                       ← C0 admin tenant (1 tab: Integraciones)
Centro de Control                                   ← C0 (sin tocar esta pasada)
```

### Decisiones clave
1. Eliminar wrapper "INFRAESTRUCTURA" — los 4 CT se muestran al mismo nivel entre 2 separadores
2. Orden C2: Gente → Planeación → Riesgo → Operación → Finanzas (lógica del empresario: "primero gente, luego qué hacen, luego riesgos, luego ejecuto, luego dinero")
3. Usar sub-separadores uppercase muted (patrón GitHub/Atlassian/Notion) — Odoo NO es buen referente
4. Mi Muro como nueva entidad (ver H-UI-06)
5. Cadena al final de operación, NO al final del sidebar total

### Impacto
- Requiere reordenar `SIDEBAR_LAYERS` en `viewsets_config.py`
- Requiere introducir concepto de sub-separadores (hoy solo existen capas con/sin wrapper)
- No rompe RBAC — el filtrado granular por cargo sigue igual

### Trigger
Próxima pasada post-documentación. Es la base para el trabajo de organización LIVE.

### Estado
🔲 Abierto. Prioridad: **ALTA — siguiente sprint de reorganización LIVE**.

---

## H-UI-02 — Redistribuir UI de `audit_system` (diferido)

### Detectado
2026-04-22.

### Severidad
**BAJA** (esta pasada) — Se conserva intacto hasta sesión dedicada.

### Síntoma
`audit_system` aparece como módulo "Centro de Control" en el sidebar del
tenant con 4 sub-apps (Logs, Config. Alertas, Notificaciones, Tareas).
Pero su naturaleza es C0 infraestructura — expone al usuario final cosas
técnicas que no le corresponden.

### Decisión en esta sesión
**NO tocar en esta pasada.** Se conserva `audit_system` intacto junto a
Configuración al final del sidebar.

### Propuesta futura (próxima pasada dedicada)
El **motor** de audit_system se queda (modelos + API + middleware — es
compliance ISO 9001/27001). Solo se **redistribuye la UI**:

| Sub-app | UI futura propuesta |
|---|---|
| `logs_sistema` (trazabilidad `LogCambio`) | Admin Global (superadmin global) + tab "Auditoría" en Configuración del tenant (admins del tenant) + botón "Ver historial" inline en cada modelo |
| `config_alertas` | Inline en cada módulo (vencimiento docs en GD, etc.) o tab en Configuración |
| `centro_notificaciones` | Campana del header + inbox de notificaciones |
| `tareas_recordatorios` | Mi Portal (tab "Mis Tareas") |

### Dependencia
- Depende de que Mi Portal tenga tabs (H-UI-06 Mi Muro relacionado).
- Depende de que Configuración del tenant exista como hogar consolidado.

### Trigger
Sesión dedicada posterior a la reorganización LIVE del sidebar.

### Estado
🔲 Abierto. Prioridad: **diferida — próxima pasada del sidebar**.

---

## H-UI-03 — Naming inconsistente: 3 "Catálogos" + "Catálogo de Productos" engañoso

### Detectado
2026-04-22.

### Severidad
**MEDIA** — Genera confusión real al usuario: el mismo label apunta a 3
datos distintos y el nombre principal miente sobre el contenido.

### Síntoma
El word "Catálogos" aparece en 3 ubicaciones distintas del sidebar:

| Ubicación | Qué contiene | App |
|---|---|---|
| INFRAESTRUCTURA → Catálogo de Productos | Productos, Categorías, UM, Proveedores | `catalogo_productos` (CT) |
| Cadena de Suministro → Catálogos | MP, tipos almacén, etc. | `supply_chain.catalogos` (C2) |
| Configuración → Catálogos | (vacío / placeholder) | `configuracion_plataforma` |

Además, "**Catálogo de Productos**" como nombre **miente** — contiene:
- Productos ✓
- Categorías ✓ (de producto)
- Unidades de Medida ❌ (es transversal, no solo productos)
- Proveedores ❌ (no son productos)

### Propuesta
1. Renombrar `catalogo_productos` → **"Catálogos Maestros"** (nombre honesto).
2. Eliminar "Catálogos" de Configuración (redundante, no tiene contenido real).
3. Mantener `supply_chain.catalogos` pero renombrar a algo específico ("Catálogos SC" o fusionar con Catálogos Maestros cuando se consolide CT).

### Trigger
Junto con H-UI-01 (reorganización LIVE del sidebar).

### Estado
🔲 Abierto. Prioridad: ALTA (bloquea claridad del sidebar V3).

---

## H-UI-04 — Fundación Tab 4 "Políticas y Reglamentos" faltante

### Detectado
2026-04-22.

### Severidad
**MEDIA** — El doc Cascada V2 declara 4 tabs para Fundación; solo hay 3 en LIVE.

### Síntoma
Hoy en Fundación se ven 3 tabs:
- Mi Empresa
- Mi Contexto e Identidad
- Mi Organización

Falta el Tab 4 declarado en Cascada V2 §3 Nivel 1:
- **Mis Políticas y Reglamentos** (políticas obligatorias + reglamento interno + contratos tipo)

### Causa
Las políticas se migraron a GD en v4.0 (patrón correcto) pero no se
creó la vista read-only en Fundación que lista las políticas vigentes.
Los contratos tipo siguen mal ubicados en `configuracion` (H-C1-05).

### Propuesta
Crear Tab 4 en Fundación como **vista read-only** que consume:
- Políticas de GD (`tipo_documento=POL`) — ya migradas
- Plantillas de contrato de GD (`tipo_documento=PLANTILLA_CONTRATO_*`) — cuando H-C1-05 se ejecute
- Reglamento Interno de GD (`tipo_documento=REG_INTERNO`)

No tiene lógica propia — es vista. El contenido y flujos viven en GD.

### Dependencia
- H-C1-05 (migrar `TipoContrato` a GD).

### Trigger
Reactiva — cuando se trabaje Fundación o GD. No bloquea nada hoy.

### Estado
🔲 Abierto. Prioridad: MEDIA.

---

## H-UI-05 — `ConsecutivoConfig` (Sistema B) — 🟡 CERRADO PARCIAL (2026-04-22)

### Detectado
2026-04-22 (análisis de configuración C0).

### Severidad
**BAJA** — No causa bugs. Era **deuda de diseño** (infra dormida).

### Acciones aplicadas (2026-04-22)
1. **Refactor a Sistema A en 9 modelos** (LIVE + OFF) — ahora NO dependen de `ConsecutivoConfig`:
   - `catalogo_productos.Producto.generar_codigo()` (MP/INS/PT/SV, padding 5)
   - `catalogo_productos.CategoriaProducto.generar_codigo()` (CAT, padding 3)
   - `catalogo_productos.proveedores.Proveedor.generar_codigo_interno()` (PROV, padding 5)
   - `supply_chain.compras.OrdenCompra.generar_numero_orden()` (OC-YYYY, padding 5)
   - `supply_chain.compras.RequisicionCompra.generar_codigo()` (RC-YYYY, padding 5)
   - `supply_chain.almacenamiento.MovimientoInventario.generar_codigo()` (MOV-YYYY, padding 5)
   - `production_ops.mantenimiento.*` (ActivoProduccion, EquipoMedicion, OrdenTrabajo)
   - `production_ops.procesamiento.*` (OrdenProduccion, LoteProduccion)
   - `production_ops.recepcion.*` (Recepcion, PruebaAcidez voucher)
   - `sales_crm.servicio_cliente.*` (PQRS, EncuestaSatisfaccion)
   - `talent_hub.services.contrato_documento_service._generar_codigo_documento`
   - `gestion_estrategica.gestion_documental.services.documento_service.generar_codigo` (TIPO-PROCESO-NNN)
2. **Creado helper compartido** `apps.core.utils.consecutivos.siguiente_consecutivo_scan()` — scan-and-increment reutilizable con soporte para `include_year`.
3. **Eliminada UI tenant**: `ModulosSection.tsx`, `ConsecutivosSection.tsx`, `ConsecutivoFormModal.tsx`.
4. **Eliminado tab `general` del seed** `configuracion_plataforma` (cleanup_obsolete_tabs lo borra en ambos tenants automáticamente).
5. **Limpiados hooks** `useConsecutivos*` del `useConfigAdmin.ts`.
6. **Módulos del Sistema** (tenant UI) eliminado — gestión ahora vive 100% en Admin Global (TenantFormModal → TabModulos).

### Pendiente (deuda residual — por qué NO se eliminó el modelo del backend)
Algunos consumidores **legacy** aún importan `ConsecutivoConfig` directamente:
- `gestion_estrategica.configuracion.serializers.py` (genera código de `Sede`)
- `gestion_estrategica.configuracion.stats_views.py` (conteo dashboard)
- `gestion_estrategica.configuracion.serializers_consecutivos.py` (serializers legacy)
- `gestion_estrategica.viewsets_strategic.py` (conteo)
- `supply_chain.almacenamiento.tests.factories.py` (test factory)

El modelo + endpoints + seed `seed_consecutivos_sistema` **se conservan** hasta refactorizar estos 5 puntos. Cuando se refactoricen → eliminar el modelo + migración DeleteModel + retirar seed del pipeline.

### Trigger del cierre total
Refactor de `SedeEmpresa.codigo` + eliminación de serializers legacy no usados en UI.

### Estado
🟡 **Cerrado parcial.** Sistema A ya cubre 100% de modelos LIVE + OFF. Modelo `ConsecutivoConfig` queda como backend-only (sin UI) hasta completar el cleanup residual.

---

## H-UI-06 — Mi Muro como nueva entidad de landing (feature nueva)

### Detectado
2026-04-22 (sesión de definición de estructura del sidebar).

### Severidad
**BAJA-MEDIA** — Feature nueva, no es bug. Pero es parte integral del
modelo narrativo del sidebar V3 acordado.

### Síntoma (ausencia)
Hoy el tenant tiene 2 landings universales: **Dashboard** (métricas) y
**Mi Portal** (lo mío). Falta un tercer espacio para **comunicación
corporativa al empleado**: políticas vigentes, reglamentos, noticias,
anuncios, misión/visión/valores.

Si esta info se mete en Mi Portal → satura su propósito (lo mío).
Si se mete en Fundación → el empleado no tiene por qué editar ni ver el detrás.

### Propuesta
Crear **Mi Muro** como tercera landing universal:

```
Dashboard    ← métricas: "qué está pasando"
Mi Portal    ← mis cosas: "lo que me toca hacer"
Mi Muro      ← cartelera: "lo que la empresa me comunica"
```

**Qué vive en Mi Muro (read-only para empleados):**
- Políticas vigentes (pulled de GD)
- Reglamento Interno (pulled de GD)
- Misión, Visión, Valores (pulled de identidad)
- Organigrama (read-only, pulled de organizacion)
- Anuncios / noticias corporativas (motor de publicaciones, nuevo)
- Calendario de eventos corporativos

**Quién publica:**
- Admin del tenant / Comunicaciones internas
- Flujo de aprobación (via workflow_engine si aplica)

### Implicación técnica
- Nuevo módulo `mi_muro` o extensión de `mi_portal` con tab
- Motor de publicaciones con versionado + vigencia
- RBAC por cargo (políticas específicas por rol vs. generales)
- Integración read-only con GD + identidad

### Trigger
No bloquea. Se construye cuando haya decisión estratégica de hacerlo.
Alternativa: arrancar con Mi Portal con sección "Información Corporativa"
y promover a Mi Muro cuando el uso lo justifique.

### Estado
🔲 Abierto. Prioridad: BAJA — feature futura. Declarada en estructura V3.

---

## H-UI-07 — Clientes deben vivir en CT (preventivo, antes de activar sales_crm)

### Detectado
2026-04-22 (análisis predictivo — no hay código de cliente aún).

### Severidad
**BAJA** (preventiva) — No hay bug hoy porque `sales_crm` está DORMIDO.
Pero si se activa sin esta decisión previa, repite el anti-patrón que se
corrigió con Proveedor (H-S8-proveedores-ubicacion-incorrecta).

### Síntoma anticipado
Cliente es dato maestro transversal — igual que Proveedor. Será consumido por:
- `sales_crm.pipeline_ventas` (C2)
- `sales_crm.pedidos_facturacion` (C2)
- `sales_crm.servicio_cliente` (C2 - PQRS)
- `accounting.movimientos` (C2 - terceros)
- `tesoreria.tesoreria` (C2 - cobros)
- Portal Cliente (capa Portales)

Si Cliente se crea dentro de `sales_crm.gestion_clientes` (C2), los
demás C2 tendrán que usar `apps.get_model()` + `IntegerField` — mismo
problema que tuvo Proveedor antes del refactor Opción A (2026-04-21).

### Propuesta preventiva
**Cuando se active `sales_crm`, crear Cliente directamente en CT**:
- Opción A: `apps/catalogo_productos/clientes/` (co-ubicado con proveedores)
- Opción B: `apps/catalogo_maestros/clientes/` (si se renombra el paraguas)
- Opción C: `apps/clientes/` (app raíz CT, al nivel de proveedores)

Decisión exacta cuando se active. Lo importante hoy: **dejar registrado
que no debe caer en `sales_crm.gestion_clientes` (C2)**.

### Precedente
Refactor Opción A de Proveedor (sesión 2026-04-21): movimiento de C2 →
CT con éxito, 11 commits, deploy estable.

### Dependencia
- Activación de `sales_crm` (L35).

### Trigger
Antes de descomentar `sales_crm.gestion_clientes` en `base.py`.

### Estado
🔲 Abierto. Prioridad: **preventiva — leer antes de activar sales_crm**.

---

## H-CAT-01 — UI de `NormaISO` duplicada en Configuración → Organizacional

### Detectado
2026-04-22 (inventario canónico de catálogos — Sidebar V3 Fase 2)

### Severidad
**MEDIA** — confusión de UX. Genera dos puntos de verdad para administrar normas ISO.

### Síntoma
- Existe un solo modelo: `apps.gestion_estrategica.configuracion.NormaISO`
- La app `configuracion` es sub-app del módulo LIVE **Fundación** → el modelo YA vive en Fundación
- La UI natural de administración es **Fundación → Contexto → Partes Interesadas** (donde se declaran normas aplicables a la empresa como M2M)
- Paralelamente existe UI redundante en `configuracion-admin/components/catalogs/CatalogOrganizacionalTab.tsx` (Config → Catálogos → Organizacional) que expone un CRUD duplicado

### Impacto
- Admin del tenant no sabe dónde administrar normas (Fundación o Configuración)
- Riesgo de estados inconsistentes si un lado crea/desactiva y el otro no refresca
- Ensucia el sidebar y obliga a mantener dos UIs

### Acción propuesta
1. Eliminar `CatalogOrganizacionalTab.tsx` (era el único contenido del sub-tab Organizacional de Config → Catálogos)
2. Validar que la UI de Fundación → Contexto → Partes Interesadas cubre todos los casos de uso (crear, editar, activar/desactivar)
3. Si falta algo, completar la UI de Fundación antes de eliminar la duplicada

### Dependencia
Ninguna — se puede ejecutar de inmediato en cualquier sesión.

### Trigger
Fase 2C del Sidebar V3 (eliminación tab `catalogos` en Configuración).

### Estado
🔲 Abierto.

---

## H-CAT-02 — `TipoEPP` debe promoverse a CT cuando activen consumidores transversales

### Detectado
2026-04-22 (inventario canónico de catálogos — Sidebar V3 Fase 2)

### Severidad
**BAJA** hoy (HSEQ OFF), **ALTA** el día que HSEQ o Supply-inventario activen.

### Síntoma
- Modelo `TipoEPP` vive en `apps.hseq_management.seguridad_industrial` (app OFF)
- Consumidores LIVE hoy:
  - `mi_equipo.cargos` → EPP requerido por perfil de cargo (`core/serializers_rbac.py` usa `tipo_epp_id` opcional, pero cae a CharField si no hay modelo)
  - `mi_equipo.onboarding_induccion.EntregaEPP` → campo `tipo_epp` es CharField hardcoded (NO FK)
  - `mi_equipo.offboarding → paz_salvo` → devolución EPP al inventario
- Consumidores futuros (al activar):
  - Supply Chain → almacenamiento (inventario físico EPP)
  - Administración → compras EPP a proveedores
  - HSEQ → trazabilidad EPP por colaborador

### Impacto
- Hoy hay inconsistencia: el serializer RBAC permite `tipo_epp_id` (FK a HSEQ OFF) y `nombre` libre — ambos caminos coexisten
- Cuando HSEQ o Supply-inventario activen, habrá que migrar el CharField de `EntregaEPP` a FK → migración de datos no trivial

### Acción propuesta
Cuando el primer módulo LIVE (aparte de Mi Equipo) necesite FK real a `TipoEPP`:
1. Promover `TipoEPP` a CT — ubicación candidata: `apps.catalogo_productos.epp/` (co-ubicación con proveedores) o app CT dedicada
2. Migrar `EntregaEPP.tipo_epp` CharField → FK
3. Consolidar definiciones en `core/serializers_rbac.py` (decidir si `tipo_epp_id` es la única vía)

### Dependencia
- Activación de HSEQ (L40) o Supply-inventario (L50 extensión)

### Trigger
Antes de descomentar `hseq_management.seguridad_industrial` o activar inventario EPP en Supply.

### Estado
🔲 Abierto. Prioridad: **preventiva — revalidar antes de activar HSEQ**.

---

## H-CAT-04 — Colaborador/Candidato `tipo_documento` como CharField hardcoded

### Detectado
2026-04-22 (auditoría pre-deploy catálogos C0)

### Severidad
**MEDIA** — el modelo no consume el catálogo canónico `TipoDocumentoIdentidad` de Core.

### Síntoma
Los modelos `apps.mi_equipo.colaboradores.Colaborador.tipo_documento` y
`apps.mi_equipo.seleccion_contratacion.Candidato.tipo_documento` son
`CharField` con choices hardcoded en el modelo (`CC`, `CE`, `TI`, `PA`, `PEP`, `PPT`).

Paralelamente:
- `apps.core.TipoDocumentoIdentidad` existe como catálogo C0 canónico.
- `apps.catalogo_productos.proveedores.Proveedor.tipo_documento` sí es FK
  a `TipoDocumentoIdentidad` ✅ (referencia correcta).

Los formularios del frontend (`ColaboradorFormModal.tsx`) también usan
`TIPO_DOCUMENTO_OPTIONS` hardcoded, no el hook canónico
`useSelectTiposDocumento()`.

### Impacto
- Un tenant que agregue un nuevo tipo de documento al catálogo C0 no lo ve
  disponible al crear un Colaborador o Candidato.
- Inconsistencia: Proveedor usa FK pero Colaborador no — mismo concepto,
  dos implementaciones.

### Acción propuesta
1. Migración: `Colaborador.tipo_documento` CharField → FK a `TipoDocumentoIdentidad`
2. Data migration: mapear los códigos hardcoded ('CC', 'CE', etc.) a los
   IDs del catálogo canónico (los códigos ya coinciden — solo falta el JOIN).
3. Mismo para `Candidato.tipo_documento`.
4. Frontend: reemplazar `TIPO_DOCUMENTO_OPTIONS` por `useSelectTiposDocumento()`.

### Dependencia
Ninguna — pero requiere sesión dedicada de migración con data migration y
tests de regresión de `ColaboradorFormModal` y `CandidatoFormModal`.

### Trigger
Próxima sesión post-deploy que toque mi_equipo.

### Estado
🔲 Abierto. **Deuda consciente — no bloquea deploy** (los datos se guardan
como strings, el backend acepta los valores, los formularios funcionan).

---

## H-CAT-05 — `Tenant.departamento` y `SedeEmpresa.departamento` como CharField con choices hardcoded

> **Actualización 2026-04-22:** `Proveedor.ciudad` **resuelto** via migración
> `CharField → ForeignKey(Ciudad)` + seed DIVIPOLA completo (33 deptos + 1,104
> municipios). Pendientes: `Tenant.departamento`, `SedeEmpresa.departamento`,
> `Colaborador.ciudad` y campo `ciudad` como CharField en Tenant/Sede.
> Ver "Bitácora" en `catalogos-maestros.md`.

### Detectado
2026-04-22 (auditoría pre-deploy catálogos C0)

### Severidad
**MEDIA** — no bloquea producción pero impide agregar departamentos dinámicos.

### Síntoma
- `apps.tenant.Tenant.departamento` es `CharField(choices=DEPARTAMENTOS_COLOMBIA)`.
  La constante `DEPARTAMENTOS_COLOMBIA` está hardcoded en `apps.tenant.models`
  (tuple de 33 pares code/name).
- `apps.gestion_estrategica.configuracion.SedeEmpresa.departamento` es
  `CharField` similar. El `SedeEmpresaChoicesSerializer.get_departamentos`
  también usa `DEPARTAMENTOS_COLOMBIA` hardcoded en vez de consultar el
  catálogo canónico `apps.core.Departamento`.
- `Tenant.ciudad` y `SedeEmpresa.ciudad` son `CharField` sin catálogo.

Paralelamente existe el catálogo canónico `apps.core.Departamento` y
`apps.core.Ciudad` que sí está siendo consumido correctamente por
`Proveedor.departamento` (FK).

### Impacto
- Si se agrega un nuevo departamento al catálogo canónico (aunque improbable),
  no aparece disponible para crear Tenants o Sedes.
- Si en el futuro se normaliza el catálogo (ej: agregar código DANE a
  Cundinamarca), el dato de Tenant/Sede queda desacoplado.
- `TenantFormModal.TabContacto` no puede migrarse a
  `useSelectDepartamentos()` porque el backend espera el code ('ANTIOQUIA')
  no el label ('Antioquia'), y el hook canónico devuelve `{id, label}`.

### Acción propuesta
**Sesión dedicada de migración:**
1. Migrar `Tenant.departamento` CharField → FK a `Departamento`.
2. Data migration: mapear los códigos ('ANTIOQUIA', 'CUNDINAMARCA', etc.) a
   los IDs del catálogo canónico via join por `Departamento.codigo`.
3. Mismo para `SedeEmpresa.departamento`.
4. Eliminar constante `DEPARTAMENTOS_COLOMBIA` de `apps.tenant.models`.
5. Actualizar `SedeEmpresaChoicesSerializer.get_departamentos` para consultar
   el catálogo.
6. Actualizar `TabContacto.tsx` a `useSelectDepartamentos()`.
7. Actualizar `SedeFormModal.tsx` a Select de Ciudades filtrado por departamento.

### Dependencia
Ninguna.

### Trigger
Sesión post-deploy que migre Tenant/SedeEmpresa o limpieza de duplicaciones C0.

### Estado
🔲 Abierto. **Deuda consciente** — no bloquea deploy.

---

## H-CAT-03 — `RolFirmante` y `EstadoFirma` mal ubicados en `identidad`

### Detectado
2026-04-22 (inventario canónico de catálogos — Sidebar V3 Fase 2)

### Severidad
**BAJA** — ubicación sub-óptima, no afecta funcionalidad.

### Síntoma
- Modelos `RolFirmante` y `EstadoFirma` viven en `apps.gestion_estrategica.identidad`
- Pero son consumidos 100% por `FirmaDigital` del módulo `workflow_engine` (CT)
- Semánticamente pertenecen al **motor de firma digital**, no a la identidad corporativa

### Impacto
- Acoplamiento innecesario: cualquier cambio al catálogo de roles/estados de firma toca `identidad` aunque el dominio sea workflow
- Cuando se documente el módulo `workflow_engine`, hay que explicar por qué dos de sus catálogos clave viven en otra app

### Acción propuesta
1. Mover `RolFirmante` y `EstadoFirma` de `apps.gestion_estrategica.identidad` a `apps.workflow_engine.firma_digital`
2. Migrar FKs en `FirmaDigital` y cualquier otro consumidor
3. Actualizar seeds

### Dependencia
Ninguna crítica.

### Trigger
Sesión dedicada a refactor de `workflow_engine` o a consolidación de catálogos de firma.

### Estado
🔲 Abierto. Prioridad: **baja — deferible hasta que se toque workflow_engine**.

---

## Roadmap Supply Chain — Recepción MP end-to-end

Identificados durante sesión 2026-04-22 (tarde): al completar H-SC-03 (QC
obligatorio) quedó mapeado el camino hasta recibir MP de punta a punta.
Orden propuesto de ejecución: H-SC-05 → H-SC-02 → H-SC-04 → H-SC-06 →
H-SC-01. Cada uno es sesión dedicada propia.

---

## H-SC-05 — Sincronización Fundación ↔ Proveedores (próximo paso)

### Origen
Sesión 2026-04-22 (tarde). Camilo identificó que las Unidades de Negocio
propias (recolectoras, centros de acopio) se crean hoy en Fundación
(`SedeEmpresa.es_proveedor_interno=True`) pero no aparecen automáticamente
en el catálogo de Proveedores. Obliga a crear el mismo ente en dos lugares,
con riesgo de datos divergentes. La fuente de verdad **debe ser Fundación**.

### Propuesta técnica

#### Backend
- Nuevo campo `Proveedor.sede_empresa_origen: FK(SedeEmpresa, null, unique)`
- Signal `post_save` en `SedeEmpresa`:
  - Si `es_proveedor_interno=True` y no existe Proveedor vinculado → crear
    Proveedor espejo con código especial (`PROV-UN-xxx`), tipo de proveedor
    "Unidad de Negocio", datos mínimos sincronizados desde SedeEmpresa
  - Si se desmarca → desactivar el Proveedor espejo (soft delete, no eliminar)
  - Si se edita el nombre/documento en SedeEmpresa → propagar al Proveedor espejo
- Validación: proveedor con `sede_empresa_origen != null` **NO es editable**
  vía `/api/catalogo-productos/proveedores/{id}/` (redirige a editar la
  SedeEmpresa). Sí es editable la modalidad logística y tipos productos
  permitidos (datos operativos puros de Supply Chain).

#### Frontend
- Listado `/catalogo-productos/proveedores`:
  - Badge "🏢 Unidad interna" en los proveedores espejo
  - Click en Editar → redirige a Fundación si es UNeg
- ProveedorFormModal: deshabilita campos de identificación si `sede_empresa_origen`
  está seteado (muestra banner "Gestionado en Fundación")

#### Datos existentes
- Migración de backfill: por cada `SedeEmpresa` con `es_proveedor_interno=True`
  que no tenga Proveedor vinculado → crear uno. Política: usar razón social
  de la empresa + tipo_unidad como nombre comercial.

### Bloquea / desbloquea
- **Bloquea**: `H-SC-04` (voucher consolidado) necesita que el recolector sea un
  Proveedor "interno" para poder consolidar los recibos de ruta.
- **Desbloquea**: el listado de proveedores mostrará tanto los externos como las
  UNegs propias, unificado.

### Acción propuesta
Sesión dedicada. Estimado: 4-5h (backend 2h, frontend 2h, tests + migración 1h).

### Estado
🔲 Abierto. Prioridad: **alta — next**. Desbloquea H-SC-04.

---

## H-SC-02 — Liquidación sugerida + ajuste de precio trazado

### Origen
Sesión 2026-04-22 (tarde). Diseño documentado durante planning de los 3
hallazgos paralelos de recepción MP.

### Propuesta técnica
Extender el modelo `Liquidacion` (ya existente en `supply_chain/liquidacion`)
para que al aprobar un `VoucherRecepcion` se cree automáticamente una
Liquidacion sugerida con estado `SUGERIDA`:
- `precio_kg_sugerido` = snapshot del voucher
- `precio_kg_final` = editable con obligación de motivo
- Tabla append-only `HistorialAjusteLiquidacion` con origen (QC / MANUAL /
  CORRECCION) y diff de precios
- Transiciones: SUGERIDA → AJUSTADA → CONFIRMADA → PAGADA

Documentado en detalle en `docs/auditorias/history/` (plan agent H-SC-02
de la sesión 2026-04-22 tarde). ~17h estimadas.

### Bloquea / desbloquea
- **Depende de**: H-SC-03 (ya completa) — precio único por proveedor y
  voucher APROBADO dispara signal.
- **Desbloquea**: H-SC-06 (liquidación periódica acumulada) requiere el
  modelo Liquidacion extendido.

### Estado
🔲 Abierto. Prioridad: **alta — siguiente tras H-SC-05**.

---

## H-SC-04 — Voucher consolidado de recolección con merma

### Origen
Sesión 2026-04-22 (tarde). Camilo explicó el flujo operativo real del
acopio de grasas: una Unidad de Negocio sale a recolectar en N puntos,
trae recibos individuales por proveedor de punto y al llegar a planta
se pesa el total en báscula.

### Problema operativo que resuelve
Hoy `VoucherRecepcion` es 1:1 (un proveedor, un voucher). No refleja el
flujo real cuando una ruta recolecta de múltiples proveedores de punto
en un solo viaje. La diferencia entre peso en báscula de planta y suma
de recibos individuales es **merma** (pérdida por humedad, derrame,
inexactitud de básculas de campo) que la planta absorbe.

### Propuesta técnica

#### Modelo nuevo `VoucherRecoleccionConsolidado`
```python
class VoucherRecoleccionConsolidado(TenantModel):
    recolector = FK(Proveedor)           # la UNeg que trajo (sede_empresa_origen != null)
    vehiculo = CharField(blank)
    operador_recolector = FK(User)
    fecha_viaje = DateField
    peso_total_bascula_planta = Decimal  # pesaje al llegar
    estado = choices(PENDIENTE_QC, APROBADO, RECHAZADO, LIQUIDADO)
    observaciones = Text

    @property
    def peso_total_recibos(self) -> Decimal:
        return sum(v.peso_neto_kg for v in self.vouchers_individuales.all())

    @property
    def merma_kg(self) -> Decimal:
        return self.peso_total_bascula_planta - self.peso_total_recibos

    @property
    def merma_porcentaje(self) -> Decimal:
        if self.peso_total_recibos == 0: return 0
        return (self.merma_kg / self.peso_total_recibos) * 100
```

#### Extensión de `VoucherRecepcion`
- Nuevo FK `voucher_consolidado_padre: FK(self, null)` — si es hijo de una
  recolección consolidada. Null = voucher independiente (flujo actual).

#### Política de merma
- La merma la **absorbe la planta**. La liquidación por proveedor de punto
  usa su peso individual del recibo, no afectado por la merma.
- La merma queda registrada para análisis de eficiencia de rutas y calidad
  de básculas de campo.

#### Frontend
- Nueva página `/supply-chain/recepcion/ruta` o extensión del modal actual
- Modal "Recepción de Ruta" con:
  - Header: Recolector (Proveedor UNeg) + Vehículo + Fecha
  - Input: Peso total en báscula planta
  - Tabla editable: sub-recibos (Proveedor de punto + peso individual + precio snapshot)
  - Cálculo en vivo: Σ recibos, Merma kg, Merma %
  - Al aprobar: dispara signals de cada voucher hijo (inventario + liquidación sugerida)

### Tests mínimos
- Merma = peso_bascula − Σ recibos (property)
- Aprobar consolidado aprueba hijos idempotentemente
- Cada hijo crea su propia Liquidacion sugerida
- Si se rechaza el consolidado, se rechazan los hijos

### Bloquea / desbloquea
- **Depende de**: H-SC-05 (sincronización Fundación↔Proveedores, para que
  el recolector sea un Proveedor válido).
- **Depende de**: H-SC-02 (modelo Liquidacion extendido, para que cada hijo
  genere su liquidación sugerida).

### Estado
🔲 Abierto. Prioridad: **alta — corazón operativo del negocio**.

---

## H-SC-06 — Liquidación periódica por proveedor (semanal/quincenal/mensual)

### Origen
Sesión 2026-04-22 (tarde). Camilo explicó que a los proveedores de punto
se les paga acumulado por período (semanal, quincenal, mensual), no por
cada entrega individual.

### Propuesta técnica

#### Backend
- Nuevo campo `Proveedor.frecuencia_pago: choices(SEMANAL, QUINCENAL, MENSUAL, POR_ENTREGA)`
  con default `POR_ENTREGA` (comportamiento actual)
- Nuevo modelo `LiquidacionPeriodica` (o agregar campos a `Liquidacion`):
  - `proveedor`, `periodo_inicio`, `periodo_fin`, `frecuencia`
  - `vouchers_incluidos: M2M(VoucherRecepcion)`
  - `total_kg`, `total_pagar` (calculados)
  - estado (BORRADOR → EMITIDA → PAGADA)
- Celery beat task semanal/mensual: genera borradores de liquidación
  periódica por proveedor según su frecuencia

#### Frontend
- Dashboard en `/supply-chain/liquidaciones`:
  - Tarjetas por proveedor con período acumulado en curso
  - Total kg recibidos · precio promedio · total a pagar
  - Lista de vouchers del período (drill-down)
  - Botón "Emitir liquidación" → consolida vouchers del período en una
    LiquidacionPeriodica y genera PDF
- Filtros: por frecuencia de pago, por proveedor, por período

### Relación con H-SC-02
- H-SC-02 es la liquidación **individual sugerida** (al aprobar voucher)
- H-SC-06 es la liquidación **periódica acumulada** (para pago efectivo)
- Un mismo VoucherRecepcion puede tener Liquidacion individual (trazabilidad
  operativa) y ser referenciado por una LiquidacionPeriodica (pago real)

### Bloquea / desbloquea
- **Depende de**: H-SC-02 (modelo Liquidacion extendido), H-SC-04 (para que
  vouchers de ruta puedan acumularse por proveedor de punto).
- **Bloquea**: integración con Tesorería/Bancos (pago efectivo).

### Estado
🔲 Abierto. Prioridad: **alta — cierra el ciclo operativo de pago a proveedores**.

---

## H-SC-01 — Voucher PDF con branding + archivo GD + impresora térmica 58mm

### Origen
Sesión 2026-04-22 (tarde). Planificado como uno de los 3 hallazgos
paralelos del próximo gran paso recepción MP.

### Propuesta técnica
- Servicio `VoucherPDFService` con WeasyPrint 60.2 + template HTML/CSS 58mm
  (monospace, inline-block, ESC/POS-ready). Template paralelo 80mm como
  iteración 2.
- Archivado automático en Gestión Documental como tipo `VOU` (inmutable
  al aprobar)
- Modelo nuevo `ImpresoraTermica` (CT-layer, `catalogo_productos/impresoras/`)
  con tipo_conexion (BLUETOOTH / USB / TCP_IP / PDF_FALLBACK), ancho_mm,
  ubicación por SedeEmpresa
- Hook FE `useThermalPrinter` con Web Bluetooth API + WebUSB + PDF fallback
- Endpoint `POST /vouchers/{id}/imprimir/` retorna comandos ESC/POS codificados
  o URL del PDF según tipo de conexión

Documentado en detalle en plan agent H-SC-01 (sesión 2026-04-22 tarde).
~80-90h estimadas.

### Bloquea / desbloquea
- Independiente de otros H-SC. Se puede construir en paralelo con los demás.
- Aplica a VoucherRecepcion individual Y a VoucherRecoleccionConsolidado
  (mismo PDF pattern, distinto template).

### Estado
🔲 Abierto. Prioridad: **media — puede esperar tras H-SC-05/02/04/06**.

---

## H-PROD-01 — ✅ RESUELTO (2026-04-24) — ConsecutivoConfig 'PRODUCTO_MP' DoesNotExist (Sentry)

### Origen
Sentry `PYTHON-DJANGO-3K`. Detectado 2026-04-23 en auditoría de issues.
Primero visto: 2026-04-21. Último: 2026-04-21.

### Síntoma
`ConsecutivoConfig.DoesNotExist: No existe configuración de consecutivo para el código 'PRODUCTO_MP'`
en `POST /api/catalogo-productos/productos/`.
Stack: `models_consecutivos.py:380 obtener_siguiente_consecutivo` con `empresa_id=None`.

### Estado actual del código
El modelo `Producto.generar_codigo()` **ya usa `siguiente_consecutivo_scan`** (scan local),
NO llama a `ConsecutivoConfig`. Los 5 eventos son de releases `99a9909d47b27` y `ab26877a7c55`
(período de transición), y el usuario confirmó que productos MP se crean correctamente hoy.

### Hipótesis
Los eventos son artefactos de la transición (versión anterior del código aún desplegada
en workers Gunicorn durante el rolling restart). La instancia en producción ya funciona.

### Resolución
Issue Sentry `PYTHON-DJANGO-3K` marcado como **Resuelto** (2026-04-24).
Sin nuevos eventos desde 2026-04-21. El deploy con `84aabfb7` (`fix(deploy): ejecutar
pipeline completo de seeds post-deploy`) resolvió la causa raíz: `deploy.sh` ahora
llama `deploy_seeds_all_tenants` que incluye `seed_consecutivos_sistema`.

### Estado
✅ Resuelto. Ver también H-PROD-07 (duplicado parcial).

---

## H-PROD-02 — InterfaceError: DB connection closed en Celery Beat (Sentry)

### Origen
Sentry `PYTHON-DJANGO-34`. Detectado 2026-04-23.
`celery.beat` proceso en estado **Ongoing** (recurrente).

### Síntoma
`InterfaceError: connection already closed` en
`django.db.models.sql.compiler.execute_sql` desde `celery.beat`.
El beat mantiene una conexión de larga duración que PostgreSQL cierra
por timeout antes de que Django la detecte.

### Causa raíz probable
`CONN_MAX_AGE` no está configurado (o está en `None` — persistente), lo que
puede causar que conexiones idle sean cerradas por PostgreSQL (parámetro
`tcp_keepalives_idle` del servidor) antes de que Django lo note.
Django no tiene health-check automático en conexiones persistentes < 4.1.

### Opciones de fix
**Opción A (rápida):** `CONN_MAX_AGE = 0` en `base.py` — desactiva conexiones
persistentes en Celery. Overhead mínimo, seguro para beat.

**Opción B (elegante):** `CONN_MAX_AGE = 60` + `CONN_HEALTH_CHECKS = True`
(Django 4.1+). Re-conecta antes de cada query si la conexión está muerta.

**Opción C (infraestructura):** Configurar `pgbouncer` como connection pooler
entre Celery Beat y PostgreSQL. Overkill para el VPS actual.

### Restricción
CONN_MAX_AGE aplica globalmente → verificar que no rompa Gunicorn (que sí
puede beneficiarse de conexiones persistentes). Usar `DATABASES` con
overrides por proceso si es necesario.

### Estado
🔲 Abierto. Prioridad: **media — no bloquea pero genera noise en Sentry**.

---

## H-PROD-03 — AppRegistryNotReady: django-tenants carga DB backend antes que app registry

### Origen
Sentry `PYTHON-DJANGO-3M`. Detectado 2026-04-23. Estado: **New**, 1 evento.
Ocurrió durante deploy del 2026-04-21 (release `ab26877a7c55`).

### Síntoma
`AppRegistryNotReady: Apps aren't loaded yet.` en
`<frozen importlib._bootstrap>:488 __call_with_frames_removed`.
Crash en `django_tenants/postgresql_backend/base.py` line 1 — al importar
el backend de DB antes que `django.setup()` complete.

### Causa raíz
`django-tenants` usa `DATABASES.ENGINE = django_tenants.postgresql_backend`.
Durante un rolling restart o cuando un worker Gunicorn arranca, hay una
ventana donde el backend de DB se importa (al leer `settings.py`) antes que
el app registry esté disponible. Ocurre en deployments, no en operación normal.

Seer Autofix lo confirma: *"initialization order is likely incorrect, possibly
due to django-tenants loading a database backend before Django's app registry
is fully ready."*

### Acción pendiente
Investigar si es un bug conocido de `django-tenants 3.10.0` con Python 3.12.
Posibles mitigaciones:
- Verificar `DJANGO_SETTINGS_MODULE` antes del startup en Gunicorn
- `--preload` flag en Gunicorn para cargar app ANTES de fork de workers
- Actualizar `django-tenants` si hay fix disponible (verificar compatibility)

### Estado
🔲 Abierto. Prioridad: **baja — ocurre solo en deploy, se auto-resuelve**.

---

## H-PROD-04 — ✅ RESUELTO (2026-04-24) — Chunks JS obsoletos post-deploy

### Origen
Sentry `APPSTRATEKAZ-V` y `APPSTRATEKAZ-P`. Detectados 2026-04-23.
Ambos en estado **Ongoing** (recurrentes en cada deploy).

### Síntoma
- `TypeError: Failed to fetch dynamically imported module: .../NetworkBackground-Cr676EUx.js` en `/login`
- `TypeError: Importing a module script failed.` en `/dashboard`

Ocurre cuando un usuario tiene la app cargada en memoria (SPA) y se hace un
deploy nuevo. El HTML de la SPA sigue referenciando chunks con hashes del
build anterior, que ya no existen en el servidor.

### Causa raíz
Vite genera chunks con content-hash. Al deploy, los archivos viejos se borran.
Usuarios con sesión activa durante el deploy intentan cargar chunks inexistentes → `TypeError`.
No hay mecanismo de detección de "nueva versión disponible" que fuerce reload.

### Opciones de solución
**Opción A (mínima):** Retener chunks del build anterior en el servidor por
24h post-deploy (`--keep-previous-build` o carpeta `/assets/previous/`).
No resuelve el problema, solo lo atenúa.

**Opción B (correcta):** Detectar "nueva versión" en el frontend y hacer
reload automático cuando un chunk falla:
```ts
// vite.config.ts — chunk error handler
window.addEventListener('vite:preloadError', () => window.location.reload())
```
Vite 5.x expone `vite:preloadError` cuando un dynamic import falla.

**Opción C (proactiva):** Polling de versión: `GET /api/version/` cada 5 min,
comparar con versión del build actual, mostrar banner "Nueva versión disponible".

### Restricción
Opción B es la más simple y estándar para Vite. Requiere 1 línea en `main.tsx`.

### Fix aplicado
`window.addEventListener('vite:preloadError', () => window.location.reload())` agregado
al inicio de `frontend/src/main.tsx`. Cuando Vite falla al cargar un chunk dinámico,
la página se recarga automáticamente cargando el HTML + assets del nuevo build.
Commit: `fix(frontend): vite:preloadError reload automático para chunks obsoletos (H-PROD-04)`.

Adicionalmente: template nginx VPS creado en `scripts/nginx-vps-template.conf` con
`Cache-Control: no-cache` en `index.html` (evita que el HTML viejo se cachee y siga
referenciando chunks con hash anterior).

### Estado
✅ Resuelto. Issues Sentry `APPSTRATEKAZ-V` y `APPSTRATEKAZ-P` quedan en Ongoing
hasta el próximo deploy que cargue el nuevo `main.tsx` — después dejarán de ocurrir.

---

## H-PROD-05 — ✅ RESUELTO (2026-04-23) — activo→is_deleted en TablaRetencionDocumental

### Origen
Sentry `PYTHON-DJANGO-3J`. Tarea Celery `documental.procesar_retencion_documentos`.

### Síntoma resuelto
`FieldError: Cannot resolve keyword 'activo' into field` en
`gestion_documental/services/documento_service.py:113`.
El refactor `TenantModel` (S17) renombró `activo` → `is_deleted` pero
`aplicar_retencion()` seguía usando `.filter(activo=True)`.
`SoftDeleteManager` ya excluye `is_deleted=True` por defecto, por lo que
simplemente se eliminó la cláusula `activo=True` redundante.

### Fix aplicado
Eliminado `activo=True` del filtro en
`apps/gestion_estrategica/gestion_documental/services/documento_service.py:110-114`.
Commit: `fix(gestion-documental): eliminar activo=True obsoleto en TablaRetencionDocumental (H-PROD-05)`.

### Estado
✅ Resuelto y pusheado (2026-04-23 — auditoría Sentry automática).

---

## H-PROD-06 — ✅ RESUELTO (2026-04-23) — motor_cumplimiento routes activas con app desinstalada

### Origen
Sentry `PYTHON-DJANGO-2`. `KeyError: apps.motor_cumplimiento.evidencias.tasks.verificar_evidencias_vencidas`
en `celery.worker.consumer`.

### Síntoma resuelto
`task_routes` en `config/celery.py` tenía 6 rutas de `motor_cumplimiento` activas
aunque el beat_schedule ya estaba comentado. Celery Worker las registraba al arrancar
e intentaba importar módulos no instalados → KeyError en `on_task_received`.

### Fix aplicado
Comentadas las 6 entradas de `motor_cumplimiento` en `task_routes` de `config/celery.py`.

### Estado
✅ Resuelto. Pusheado en mismo commit que H-PROD-05.

---

## H-PROD-07 — ✅ RESUELTO (2026-04-24) — ConsecutivoConfig faltante para PRODUCTO_MP en producción

### Origen
Sentry `PYTHON-DJANGO-3K`. URL `/api/catalogo-productos/productos/`. 5 eventos, 2 días.

### Síntoma
`ConsecutivoConfig.DoesNotExist: No existe configuración de consecutivo para el código 'PRODUCTO_MP'`
en `models_consecutivos.py:380 obtener_siguiente_consecutivo`.
Los códigos `PRODUCTO_MP`, `PRODUCTO_INS`, `PRODUCTO_PT`, `PRODUCTO_SV` se agregaron a
`CONSECUTIVOS_ADICIONALES` en commit `ab26877a` pero el seed no los creó en producción.

### Causa probable
El comando `deploy_seeds_all_tenants` → `seed_consecutivos_sistema` usa lógica
create-only: si el ConsecutivoConfig ya existe, lo salta. Si nunca existió
(nuevo código agregado al código después del último deploy con seeds), no se crea.
El deploy que incluyó `ab26877a` puede no haber corrido seeds correctamente.

### Fix requerido (VPS — operacional, no code)
```bash
# En el VPS, para cada tenant:
cd /opt/stratekaz/backend
source venv/bin/activate
DJANGO_SETTINGS_MODULE=config.settings.production python manage.py \
  deploy_seeds_all_tenants --only consecutivos
```
O directamente:
```bash
DJANGO_SETTINGS_MODULE=config.settings.production python manage.py \
  tenant_command seed_consecutivos_sistema --schema=tenant_stratekaz
DJANGO_SETTINGS_MODULE=config.settings.production python manage.py \
  tenant_command seed_consecutivos_sistema --schema=tenant_grasas_y_huesos_del_
```

### Estado
✅ RESUELTO — commit `84aabfb7` agregó `deploy_seeds_all_tenants` al pipeline de deploy.sh.
El próximo deploy aplica seeds automáticamente. Issue Sentry cerrado (2026-04-24).
Sin eventos desde 2026-04-21.

---

## H-PROD-08 — ABIERTO — PeriodicTask zombies para apps planeacion (2,500 eventos Sentry)

### Origen
Sentry `PYTHON-DJANGO-2`. `KeyError('planeacion.check_kpi_measurements_due')`. 2,500 eventos en 30 días.

### Síntoma
Celery Beat (DatabaseScheduler) continúa disparando tareas de `planeacion.*` aunque
el `beat_schedule` en `celery.py` está comentado. La causa es que `DatabaseScheduler`
persiste `PeriodicTask` records en BD y no los elimina cuando se comentan entradas en `celery.py`.
El worker recibe las tareas, no las encuentra registradas (app `planeacion` no está en
`INSTALLED_APPS` en prod), y genera `KeyError` → el mensaje se descarta.

### Fix requerido (VPS — operacional)
```bash
cd /opt/stratekaz/backend && source venv/bin/activate
DJANGO_SETTINGS_MODULE=config.settings.production python manage.py shell << 'EOF'
from django_celery_beat.models import PeriodicTask
dormant = [
    'planeacion.check_kpi_measurements_due',
    'planeacion.check_objectives_overdue',
    'planeacion.check_changes_overdue',
    'planeacion.check_plan_expiration',
]
deleted, _ = PeriodicTask.objects.filter(task__in=dormant).delete()
print(f'Eliminados: {deleted} PeriodicTask records de planeacion')
EOF
```

### Estado
🔴 ABIERTO — requiere operación en VPS. Es ruido continuo en Sentry (no afecta funcionalidad).

---

## 🎯 SUPPLY CHAIN MARATHON 2026-04-27 — 16 hallazgos cerrados

Sesión maratónica de consolidación. Detalle completo en
`docs/auditorias/history/2026-04-27-supply-chain-marathon.md`.

### Resueltos en esta sesión

| Hallazgo | Estado | Commit |
|---|---|---|
| H-SC-01 (PDF service + impresoras app, sin BT) | ✅ PARCIAL | `2109d749` + `f5350f9e` |
| H-SC-02 (estados liquidación + historial append-only) | ✅ RESUELTO | `f5350f9e` |
| H-SC-04 (cálculo de merma kg/%) | ✅ RESUELTO | `da37a5c4` |
| H-SC-05 (sync Fundación Ruta A) | ✅ RESUELTO | `28b56980` |
| H-SC-06 (LiquidacionPeriodica + Celery) | ✅ RESUELTO | `223b2f9e` |
| H-SC-12 (cleanup tests rotos QC + liquidaciones) | ✅ RESUELTO | `a80968dc` |
| H-SC-CAT-MODALIDAD (5→2 modalidades) | ✅ RESUELTO | `1a17c2c2` |
| H-SC-CAT-TIPO-PROV (drop UNIDAD_NEGOCIO) | ✅ RESUELTO | `1a17c2c2` |
| H-SC-E2E-01 (UI CRUD Almacenes) | ✅ RESUELTO | `f8660348` |
| H-SC-E2E-05 (LÍNEAS=0 en serializer list) | ✅ RESUELTO | `f5350f9e` |
| H-SC-GD-ARCHIVE (recepción + recolección + liquidaciones) | ✅ RESUELTO | `da37a5c4` + `6025ef11` + `f5350f9e` |
| H-SC-RBAC (40 viewsets enforced + unifica RBAC paralelo) | ✅ RESUELTO | `27fe03b8` |
| H-SC-RUTA-03 (lectura M2M directa, no FK OneToOne) | ✅ RESUELTO | `f5350f9e` |
| H-SC-RUTA-04 (Dashboard merma FE) | ✅ RESUELTO | `1c088d78` |
| H-SC-TALONARIO (registro manual post-hoc BE+FE) | ✅ RESUELTO | `7b9607fa` + `da37a5c4` + `2109d749` |
| H-PROV-DROP (drop FK legacy `Proveedor.ruta_origen`) | ✅ RESUELTO | `736b6980` |

### Followups generados (pendientes nuevos)

- **H-SC-05-followup** — `select_lists.py` UNeg filter, comentario migración
  0008 configuracion, test E2E manual tenant demo, UniqueConstraint DB en
  `sede_empresa_origen`.
- **H-SC-01-followup** — Web Bluetooth API completa para impresión térmica
  (~30h adicionales).
- **H-SC-RUTA-04-followup** — Gráfico ECharts tendencia temporal +
  ExportButton CSV/PDF en MermaDashboard.
- **H-SC-E2E-01-followup** — Correr `seed_estructura_final` post-deploy
  por tenant para que tab Almacenes aparezca en sidebar.
- **H-SC-GD-ARCHIVE-AREA** — `Almacen.proceso_default` FK para asignación
  determinística del Area en archivado GD (hoy fallback al primer Area
  activa).
- **H-SC-PDF-LOGO-URL** — branding usa `tenant.logo.url` relativo;
  WeasyPrint puede fallar en producción si no resuelve absoluto.
- **TipoDocumento seed post-deploy** — correr `seed_tipos_documento_sc` en
  cada tenant para crear `VOUCHER_RECEPCION_SC`,
  `VOUCHER_RECOLECCION_SC`, `LIQUIDACION_SC`.
- **RBAC unificación transversal** — documentar política y deprecar
  `GranularActionPermission` o consolidar uso.

---

## H-SC-RUTA-RBAC-INSTANCIA — Object-level RBAC por ruta (asignación cargo→ruta)

### Estado: ✅ RESUELTO (2026-04-28) — variante Opción 2

**Implementación:**
- `RutaRecoleccion.conductor_principal`: FK(User), nullable, SET_NULL on delete.
- `RutaRecoleccion.conductores_adicionales`: M2M(User), backup/supervisores.
- `RutaRecoleccionViewSet.get_queryset()`: filtro `Q(conductor_principal=user) | Q(conductores_adicionales=user)` con bypass para `is_superuser`, `is_staff`, y cargos con `can_admin` sobre sección catalogos.
- `VoucherRecoleccionViewSet.get_queryset()`: mismo filtro vía `ruta__conductor_principal` / `ruta__conductores_adicionales`.
- Migración `catalogos.0012_rutarecoleccion_conductor_principal_and_more`.
- Serializer expone `conductor_principal_nombre` y `conductores_adicionales_info` para la UI.

**Decisión:** se eligió ownership por User en lugar de por Cargo (Opción 1) porque:
- En SC los operadores/conductores se identifican por User (no por Cargo) — coherente con `operador`, `registrado_por_planta`, `aprobado_por` que ya usan `AUTH_USER_MODEL`.
- Para escalar a otros modelos (Almacen, Proveedor, LiquidacionPeriodica) considerar el patrón principal+adicionales como base reutilizable, o promover a `django-guardian` si crecen los casos.

### Estado original: 🔲 ABIERTO (anotado 2026-04-27)

### Problema

RBAC actual es a nivel de **sección** (ej: `supply_chain.rutas_recoleccion.view`
permite ver TODAS las rutas). El usuario solicita que un cargo/rol específico
pueda ver/operar **solo las rutas que tiene asignadas** ("ruta X solo la ve
cargo Y").

Esto es **row-level security** o **object-level permissions** — no existe
hoy en el sistema.

### Casos de uso

- Operador de ruta `RUTA-NORTE` no debería ver `RUTA-SUR`
- Supervisor de zona X solo gestiona rutas de zona X
- Auditoría: trazabilidad de qué cargos pueden tocar qué ruta

### Opciones de implementación

**Opción 1 — M2M cargos asignados** (recomendada)
- Agregar `RutaRecoleccion.cargos_asignados = M2M(Cargo)`
- En `get_queryset()` del ViewSet filtrar `qs.filter(cargos_asignados=user.cargo)`
- Bypass para superuser y cargos con flag `puede_ver_todas_las_rutas=True`
- UI: pestaña "Permisos" en RutaParadasModal o nuevo modal "Asignar cargos"
- Estimado: 3-4h backend + 2h FE

**Opción 2 — Ownership simple por user**
- Campo `RutaRecoleccion.responsable = FK(User)` único
- Más simple, menos flexible (no soporta supervisores compartidos)
- Estimado: 2h total

**Opción 3 — django-guardian completo**
- Sistema de permisos por instancia genérico para todo el modelo
- Mucho más potente pero overhead de configuración
- Estimado: 1 día + extender a otros modelos críticos

### Decisión sugerida

**Opción 1 (M2M cargos asignados)**. Calza con el modelo de Cargo existente
sin introducir nueva dependencia. Si después se necesita escalar a más
modelos (Almacenes, Liquidaciones), considerar django-guardian.

### Trigger

Cuando se promueva a producción multi-zona donde varios operadores manejan
rutas distintas y se quiera evitar visibilidad cruzada. Antes de eso, el
RBAC por sección actual es suficiente.

### Aplicabilidad transversal

Si se acepta el patrón M2M para Ruta, considerar replicar para:
- `Almacen.cargos_asignados` (operadores por bodega)
- `Proveedor.cargos_asignados` (compradores asignados)
- `LiquidacionPeriodica.aprobadores` (control financiero)

### Estado
🔲 ABIERTO — esperar disparador de negocio (multi-zona o segregación operativa).

---

## H-SC-RUTA-CERTIFICADOS-PV — Certificados a productores en rutas semi-autónomas

### Estado: 🔲 ABIERTO (anotado 2026-04-28)

### Problema

En el flujo Ruta Semi-Autónoma la **ruta** paga directo al productor (con su
caja propia) y la **empresa** le paga después a la ruta a precio mayor. Hoy
no hay un mecanismo para que el productor reciba un **certificado de entrega
+ pago** de la ruta (documento legal/fiscal del productor).

### Casos de uso

- Productor necesita certificado de venta (para impuestos, contabilidad propia).
- Inspector/auditor de la empresa puede pedir trazabilidad de pago al productor.
- Ruta semi-autónoma debe poder generar PDFs por productor con totales del
  período.

### Diseño preliminar (no implementar hasta disparador)

- Modelo `CertificadoProductor` (ruta + productor + período + total + items
  + estado FIRMADO/EMITIDO).
- Generación batch al cierre de período (semanal/mensual según frecuencia).
- PDF con branding de la **ruta** (no de la empresa) o ambos según política.
- Archivado en GD bajo `CERTIFICADO_PROD_SC` o similar.

### Trigger

- Que un cliente real con ruta semi-autónoma lo solicite.
- Que regulación tributaria local lo exija (DIAN, retenciones, etc.).

Por ahora la liquidación a la ruta + voucher de recolección al productor son
suficientes evidencia operativa.

### Estado
🔲 ABIERTO — sin trigger inmediato. Documentado para no perder el contexto
de la conversación con el usuario el 2026-04-28.

---

## H-SC-RUTA-LIQ-PRODUCTORES — Liquidación a productores en modalidad RECOLECCION

### Estado: 🔲 ABIERTO (anotado 2026-04-28)

### Problema

En el factory `Liquidacion.desde_voucher(voucher)` el flujo de precio es:
```python
PrecioMateriaPrima.objects.get(
    proveedor=voucher.proveedor,
    producto=voucher_linea.producto,
)
```

Pero en modalidad **RECOLECCION**, `voucher.proveedor` es **NULL** (la fuente
es la ruta + N vouchers de recolección por productor). Resultado actual:
todas las líneas de la liquidación quedan en `precio_kg=0.00`.

### Lo que se debería hacer

En modalidad RECOLECCION, la liquidación debe generarse **por productor**
(uno por cada VoucherRecoleccion COMPLETADO asociado a la recepción), no
sobre las líneas del voucher consolidado:
- 1 VoucherRecepcion (RECOLECCION) → N Liquidaciones (una por
  voucher_recoleccion.proveedor + producto + período)
- Precio resuelto: `PrecioRutaSemiAutonoma` para SEMI_AUTONOMA, o
  `PrecioMateriaPrima` para PASS_THROUGH
- LiquidacionPeriodica (H-SC-06) puede agrupar después esas N por proveedor
  según frecuencia de pago

### Trigger

- Producción real con rutas activas y reportes de "todas las liquidaciones
  vienen en $0".
- Que el usuario solicite explícitamente liquidar a productores
  individuales desde una ruta.

### Workaround temporal

Hoy se puede ajustar precio manualmente en cada `LiquidacionLinea` antes de
confirmar (`/liquidaciones/<id>/lineas/<id>/ajuste/` con motivo
"Precio inicial recolección"). Es funcional pero no escalable.

### Estado
🔲 ABIERTO — sin trigger inmediato. Workaround documentado.
