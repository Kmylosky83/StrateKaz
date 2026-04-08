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

### Severidad
**ALTA** — Bloquea activación de talent_hub.novedades, sales_crm,
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

## Orden de ataque sugerido

| # | Hallazgo | Razón del orden |
|---|---|---|
| 1 | **H2 — Auto-memory** | Bloquea todo lo demás porque sin un sistema confiable de memoria del proyecto, las decisiones de H1 (y de cualquier sesión futura) viven en frágil. |
| 2 | **H1 — Portales** | Una vez que tenemos memoria confiable, podemos atacar la decisión arquitectónica de Portales con la garantía de que el resultado va a sobrevivir. |

**Sesiones estimadas:** 1 sesión completa cada uno, posiblemente 2 para H1
si el patrón elegido requiere prototipo de migración.

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
