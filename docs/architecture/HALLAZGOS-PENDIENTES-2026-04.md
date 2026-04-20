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

### Estado
🔲 Abierto. Prioridad: decidir al activar el primer CT comentado.

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
| 19 | **H-S8-ct-disperso** | 🔲 PENDIENTE | Capa CT fragmentada en 3 ubicaciones. Decidir paraguas único `apps/infraestructura/` al activar el siguiente CT. |
| 20 | **H-S8-proveedores-ubicacion-incorrecta** | 🔲 PENDIENTE | gestion_proveedores conceptualmente es CT, vive en C2 por pragmatismo. Mudanza S10-S12 al activar segundo consumidor. |
| 21 | **H-S7-supply-chain-tabla-unidad-medida-huerfana** | ✅ RESUELTO (2026-04-20) | Cerrado en S8 con migración `catalogos.0002_drop_unidad_medida_huerfana`. |
| 22 | **H-S8-revision-direccion-coupling-eliminado** | ✅ RESUELTO (2026-04-20) | Cerrado en S8 commit `e51f8b56`. Sin acoplamiento LIVE → NO-LIVE. |

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
