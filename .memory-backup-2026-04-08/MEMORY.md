# StrateKaz | Consultoría 4.0 — Memory Index

## Proyecto
**NO es ERP. NO es SGI.** Plataforma de Gestión Empresarial 360° + Consultoría 4.0 para empresas colombianas.
3 líneas de negocio: Consultoría pura | Consultoría + SaaS | SaaS puro ($20,000 COP/usuario/mes).
Stack: Django 5 + DRF 3.14 + React 18/TS + Vite 5. Multi-tenant (django-tenants, schema-per-tenant).
Fase: **CASCADE DEPLOY** — Despliegue progresivo de módulos. 3 schemas PostgreSQL:
- `public` — SHARED_APPS (Tenant, TenantUser, Plan, Domain) — tabla: `tenant_tenant`
- `tenant_stratekaz` — Tenant demo principal (StrateKaz Demo)
- `tenant_grasas_y_huesos_del_` — Tenant cliente (Grasas y Huesos)
- **IMPORTANTE**: User (core_user) vive en TENANT schema, TenantUser (tenant_user) en PUBLIC

## Identidad y Negocio
- [brand-identity.md](brand-identity.md) — **CRÍTICO**: 3 líneas de negocio, posicionamiento, NO es ERP/SGI

## Deploy — Comando canónico
- **App completa**: `cd /opt/stratekaz && bash scripts/deploy.sh --no-backup`
- **Solo marketing**: `cd /opt/stratekaz && git pull origin main && cd marketing_site && npm install && npm run build`
- Flags: `--no-backup` (sin backup DB), `--backend` (solo Django), `--frontend` (solo build), `--dry-run` (preview)
- **NUNCA comandos manuales sueltos** — siempre usar `deploy.sh` como canónico

## Marketing Site (stratekaz.com)
- **App standalone**: `marketing_site/` — React 18 + TS + Vite 7 + Tailwind + Three.js + Framer Motion + Sentry
- **Dominio prod**: `stratekaz.com` — Nginx sirve `dist/`, NO server Node, NO restart servicios
- **[marketing-recursos.md](marketing-recursos.md)** — Biblioteca /recursos: 9 categorías Drive, newsletter, hero Framer Motion, pitfalls SW+DRF

## Archivos de Referencia — Arquitectura y Patrones
- [module-routing-architecture.md](module-routing-architecture.md) — Patrón routing módulos: withModuleGuard + DynamicSections
- [architecture.md](architecture.md) — Stack, estructura, componentes, patrones clave
- [multi-tenant.md](multi-tenant.md) — Schemas, auth flow, bootstrap, jerarquía de usuarios
- [security-2fa.md](security-2fa.md) — 2FA por nivel de rol, firma digital, cifrado, OTP email
- [jwt-session-strategy.md](jwt-session-strategy.md) — Duraciones JWT (8h/7d), refresh proactivo, blacklist bug fix
- [deploy.md](deploy.md) — **TODOS los comandos** (Docker, VPS, Git, Django, npm, systemd, backups)
- [pitfalls.md](pitfalls.md) — 40+ gotchas + Quick Reference Rules
- [reorganizacion-c1-pe-sgi.md](reorganizacion-c1-pe-sgi.md) — Arquitectura Cascada V3

## Archivos de Referencia — Convenciones y UI
- [coding-standards.md](coding-standards.md) — Patrones React/TS/Django, optimización, barrel exports
- [naming-conventions.md](naming-conventions.md) — snake_case vs kebab-case vs camelCase
- [ui-standards.md](ui-standards.md) — 3 tipos de vista, Design System obligatorio
- [audit-api-sync.md](audit-api-sync.md) — FE↔BE sync: url_path, tipos TS, actions fantasma
- [responsive-standards.md](responsive-standards.md) — Breakpoints, touch targets, ResponsiveTable
- [naming-modulos-portal.md](naming-modulos-portal.md) — "Gestión de Personas" (sidebar) vs "Mi Equipo" (portal jefe)
- [tech-automations.md](tech-automations.md) — EventBus + django-fsm para L30+

## Archivos de Referencia — Módulos y Features
- [onboarding-architecture.md](onboarding-architecture.md) — SmartOnboarding por tipo, creación usuarios, setup-password
- [b2b2b-model.md](b2b2b-model.md) — Modelo B2B2B: portales, roles, superadmin, contratistas
- [source-of-truth.md](source-of-truth.md) — Colaborador master, User identidad digital
- [seeds-idempotentes.md](seeds-idempotentes.md) — Seeds create-only, is_system, CARGO_AREA_MAPPING
- [usuarios-centro-control.md](usuarios-centro-control.md) — /usuarios solo lectura + impersonar
- [plantillas-sgi.md](plantillas-sgi.md) — Arquitectura plantillas: public→tenant
- [firma-digital-integration.md](firma-digital-integration.md) — Integración Plantillas↔FirmaDigital
- [firma-digital-e2e-audit.md](firma-digital-e2e-audit.md) — Auditoría E2E FirmaDigital
- [gamificacion-decoupling.md](gamificacion-decoupling.md) — Juego SST DESACTIVADO
- [gestion-documental-architecture.md](gestion-documental-architecture.md) — **GD cerrado v5.1**: 8 modelos, 203 campos, 33 TRD, Design System 99.5%

## Archivos de Referencia — Calidad y TypeScript
- [ts-errors-policy.md](ts-errors-policy.md) — Post-limpieza: fix-on-activate + fix-on-touch
- [audit-security-profile-2026-03-29.md](audit-security-profile-2026-03-29.md) — Auditoría Centro Control + Seguridad + Preferencias

## Archivos de Referencia — Feedback y Deploy
- [feedback_deploy_services.md](feedback_deploy_services.md) — Servicios systemd VPS: prefijo `stratekaz-`
- [feedback_deploy_commands.md](feedback_deploy_commands.md) — NUNCA generar comandos deploy de memoria
- [feedback_mi_equipo_decoupled.md](feedback_mi_equipo_decoupled.md) — Mi Equipo 100% independiente
- [feedback_audit_requirement.md](feedback_audit_requirement.md) — Auditoría profunda obligatoria antes de merge
- [feedback_vps_commands.md](feedback_vps_commands.md) — Comandos VPS completos con venv + -c inline
- [feedback_version_bump.md](feedback_version_bump.md) — "actualizar versión": revisar commits, bump SemVer
- [self-service-rbac.md](self-service-rbac.md) — Self-service bypass RBAC + withModuleGuard
- [middleware-portal-exclusions.md](middleware-portal-exclusions.md) — ModuleAccessMiddleware excluye portales

## Archivos de Referencia — Config, Pricing y Capacidad
- [config-admin-module.md](config-admin-module.md) — Config Plataforma + Cascada V2.1
- [pricing-plans.md](pricing-plans.md) — Precios en COP, dos líneas de negocio
- [sprint-history.md](sprint-history.md) — Historial de sprints + roadmap MVP
- [health-check-marzo-2026.md](health-check-marzo-2026.md) — Auditoría 7 fases + cierre roadmap L20
- [capacity-planning.md](capacity-planning.md) — Fórmula carga=(T×40)+(U×1), alertas VPS

## Instrucciones Permanentes
- ELIMINAR código legacy, no deprecar ("estamos en desarrollo")
- **Git**: Todo a `origin main` — NO crear ramas salvo indicación explícita
- **Al finalizar**: `git push` → verificar CI en GitHub → solo si CI pasa ejecutar deploy VPS
- **Español colombiano**: SIEMPRE tildes y caracteres correctos
- **Design System PRIMERO**: Buscar componentes existentes ANTES de HTML crudo
- **Auditoría obligatoria**: Siempre doble auditoría profunda ANTES de merge/push
- **Docker**: SIEMPRE usar Docker local para backend. `docker compose exec backend`
- **Gestión de Personas ≠ Talent Hub**: Módulos 100% independientes
- **Juego SST**: DESACTIVADO — pendiente refactor completo
- **VPS venv path**: `/opt/stratekaz/backend/venv/bin/activate`
- **VPS servicios**: `stratekaz-gunicorn`, `stratekaz-celery`, `stratekaz-celerybeat`
- **/usuarios es SOLO LECTURA**: Centro de control, NO tiene crear/editar
- **Self-service bypass RBAC**: Acciones personales solo requieren IsAuthenticated
- **Firmantes son dinámicos**: Se asignan manualmente por documento
- **Flujo de deploy**: local → commit → push → CI GitHub → deploy VPS
- **Browser disponible**: Puedo navegar al browser del usuario para verificar
- **JWT — NO blacklist en TenantRefreshView**: Blacklist SOLO en logout explícito
- **WeasyPrint 60.2 + pydyf 0.10.0**: PINNEADOS. 68.x rompe PDF generation. NO aceptar bumps de Dependabot
- **GD solo acepta PDF**: Política absoluta. No Word, no Excel. Camino C eliminado
- **GD Design System PDF**: NO flex ni grid en CSS WeasyPrint. Usar float/inline-block/table-cell. Arial (no Segoe UI)

---

## Estado Actual (2026-04-06) — Consolidación L0→L20

### Niveles Desplegados (VPS sincronizado en `9ca3e9ae`)
| Nivel | Capa | Contenido | Estado |
|-------|------|-----------|--------|
| L0 | C0 | Core + IA + shared_library | LIVE |
| L10 | C1 | Fundación (5 apps) | LIVE |
| L12 | CT | Transversal: workflow (4) + audit (4) + analytics (2) | LIVE |
| L15 | CT | Gestión Documental (1 app, **8 modelos**, 8 fases) | LIVE v5.1.1 |
| L20 | C2 | `apps.mi_equipo` (4 sub-apps) | LIVE |
| LIVE | — | Mi Portal (portal personal del empleado) | LIVE |
| L25-L90 | C2/C3 | 312+ modelos construidos | **DISABLED — no tocar** |

### Deuda Técnica — Solo LIVE
| # | Item | Alcance | Estado |
|---|------|---------|--------|
| 14 | 322 inline styles → Tailwind | Solo en features LIVE | PENDIENTE |
| 15 | 180+ serializers duplicados (factory pending) | Solo en apps LIVE | PENDIENTE |
| 16 | 188 FormModals con patrón idéntico | Solo en features LIVE | PENDIENTE |
| 41 | GD: FIRMA_WORKFLOW↔SignatureModal GenericFK | GD (L15) | Post-Core-1.0 |

### Items diferidos a Sprint 4 (LIVE pero no urgente hoy)
- workflow_engine/firma_digital: 5 TODOs (rechazar, renovar_politica,
  iniciar_revision, content_types, destinatarios desde Cargo) — código LIVE,
  se cierran dentro del Sprint 4 (Pulir L15) porque firma digital es parte
  integral de gestión documental

### Items fix-on-activate (módulos DISABLED, no tocar ahora)
- audit_system: 4 TODOs (SMS + FCM — no hay proveedor configurado)
- accounting + acciones-mejora: TS errors (módulos DISABLED)
- 48 modelos legacy TenantModel → BaseCompanyModel (riesgo alto, beneficio
  bajo, hacer cuando haya tests robustos del workflow_engine)

---

## 2026-04-06 — Cambio de estrategia: Consolidación L0→L20

### Insight que disparó el cambio
1. Arreglar bugs en módulos DISABLED es trabajo "a ciegas" — no se puede browsear, no se puede validar end-to-end
2. L0→L20 ya es una plataforma completa y vendible: **StrateKaz Core**

### Nueva estrategia
**Consolidar L0→L20 como núcleo estable y vendible antes de activar L25+.**

L0→L20 = StrateKaz Core permite a una empresa colombiana:
- Configurar identidad corporativa + estructura organizacional
- Gestionar documentos con ciclo completo + firma digital 7 capas
- Diseñar workflows BPMN con SLA
- Reclutar, contratar y hacer onboarding de empleados
- Cada usuario tiene Mi Portal personal

### Principios
1. **Solo se modifica código LIVE** — DISABLED no se toca hasta sprint de activación
2. **Toda modificación se valida en browser** — tenant demo local antes del commit
3. **Factories obligatorias para código nuevo** — serializer, FormModal, crud-hooks, api-client
4. **Ningún módulo nuevo se activa** hasta StrateKaz Core 1.0

### Plan de fases
- **FASE 1:** Consolidar L0→L20 (factories + cleanup + polish por sub-app)
- **FASE 2:** Crecimiento modular (un módulo a la vez según valor al cliente)

### Lo que NO hacemos ahora
- Activar módulos nuevos (L25+)
- Refactorizar código DISABLED
- Migrar modelos legacy (48 TenantModel)
- Pasarelas de pago
- Self-service onboarding

---

## Definición de "Básico bien hecho" (criterio de aceptación por sub-app)

Una sub-app de L0→L20 se considera **consolidada** cuando cumple los 6 criterios:

1. **Funcional:** El usuario ejecuta las 3-5 funciones esenciales del módulo
   sin errores, sin flujos rotos, sin features fantasma en la UI que no
   hagan nada.

2. **Browseable end-to-end:** Cada función esencial se prueba en el tenant
   demo de local, recorriéndola desde el sidebar hasta el resultado final,
   sin tocar la API directamente.

3. **Sin code smells críticos:** Cero TODOs sin cerrar, cero `except Exception`
   silenciosos, cero god-classes (>1500 LOC), cero raw SQL bypassing ORM.

4. **Patrón consistente:** Usa las factories obligatorias (serializer,
   FormModal, crud-hooks, api-client). Si la sub-app es vieja y no las
   usaba, se migra durante este sprint.

5. **Tests mínimos:** Coverage del 40% en los happy paths críticos. No
   busca 80% — busca que los flujos que el usuario realmente toca tengan
   red de seguridad.

6. **Documentación interna:** README breve en la carpeta de la sub-app
   que diga: qué hace, qué consume de otras sub-apps, qué expone, cuáles
   son sus modelos clave.

**Regla maestra:** Una sub-app NO se declara consolidada hasta que el
usuario (Camilo) la haya browseado en local y aprobado explícitamente.

---

## 2026-04-07 — Checkpoint de transición Sub-bloque 3 → próxima sesión

### Estado del inventario L0

| Sub-bloque | Estado | Documento |
|------------|--------|-----------|
| L0-INDEX (índice general) | ✅ Completo y validado | docs/inventory/L0-INDEX.md |
| 3 — System Modules / Sidebar | ✅ Inventariado, hallazgos aprobados | docs/inventory/L0-03-system-modules-sidebar.md |
| 7 — Infraestructura Transversal | ⏳ Pendiente | — |
| 1 — Auth / JWT / Session | ⏳ Pendiente | — |
| 5 — 2FA / Seguridad | ⏳ Pendiente | — |
| 6 — IA Multi-Provider | ⏳ Pendiente | — |
| 4 — User / Cargo / Datos Maestros | ⏳ Pendiente | — |
| 2 — RBAC Dinámico | ⏳ Pendiente | — |

### Hallazgos del Sub-bloque 3 (resumen ejecutivo)

**Hipótesis del usuario confirmada:** El sidebar filtra correctamente por
cargo. El código es sólido y seguro. Backend valida en cada request.
Imposible bypasear desde frontend.

**1 punto ciego funcional encontrado:**
El sidebar solo consulta `CargoSectionAccess`. NO incluye
`RolAdicionalSectionAccess` ni `GroupSectionAccess`. Un usuario con Rol
Adicional o membresía de Grupo tendría permission_codes para actuar pero
no vería el módulo en el sidebar.
**Impacto actual:** ninguno (los 2 tenants en producción no usan
RolAdicional/Groups activamente).
**Impacto futuro:** alto cuando se empiece a usar (cliente confundido por
"tengo permisos pero no veo el módulo").

**0 puntos ciegos de seguridad encontrados.**

### Decisiones aprobadas para el refactor del Sub-bloque 3

El usuario aprobó el alcance recomendado por Claude:

**Incluido en el refactor (estimado 5-6 horas):**
1. Agregar las 5 pruebas automatizadas mínimas para proteger el sidebar
   contra regresiones futuras
2. Crear README breve en la carpeta del sub-bloque documentando cómo
   funciona el filtrado del sidebar
3. Arreglar el punto ciego: el sidebar debe consultar las 3 fuentes de
   permisos (Cargo + RolAdicional + Group) con lógica OR (el más permisivo
   gana), igual como ya lo hace el cálculo de permission_codes

**NO incluido (diferido):**
- Optimización de cache: prematura, no hay evidencia de lentitud en
  producción actual. Se hace cuando haya 50+ clientes.
- Limpieza de código duplicado: queda protegida por las 5 pruebas nuevas.
  Se limpia naturalmente durante el sprint de refactor de factories.

### Plan de la próxima sesión

**Disciplina del usuario:** "Cerramos todos los hallazgos antes de
continuar." No se avanza al Sub-bloque 7 hasta que el Sub-bloque 3 esté
100% consolidado.

**Orden de ejecución de la próxima sesión:**

1. **Validar contexto:** leer checkpoint + inventario L0-03
2. **Ejecutar refactor del Sub-bloque 3** en este orden:
   a) Crear README de la carpeta (más fácil, calienta motores)
   b) Arreglar el bug del RolAdicional/Group en el sidebar
   c) Agregar las 5 pruebas automatizadas
   d) Smoke test manual en tenant demo local antes del commit
   e) Commit final
3. **Declarar Sub-bloque 3 como CONSOLIDADO**
4. **Arrancar inventario del Sub-bloque 7** con mayor celeridad

### Nota sobre método ágil para próximas sesiones

El usuario pidió acelerar: inventarios más directos, decisiones obvias
(tests, código muerto, factories) se ejecutan sin pedir aprobación,
refactor inmediato después del inventario.

---

## 2026-04-07 — REFUNDACIÓN DE TESTING BACKEND COMPLETADA + Sub-bloque 3 CONSOLIDADO

### Resumen ejecutivo

Sesión completa dedicada a la refundación de testing backend. 6 fases
ejecutadas. Sub-bloque 3 cerrado como prueba de concepto del patrón nuevo.

### Cambios principales

**Infraestructura nueva:**
- `backend/apps/core/tests/base.py` — BaseTenantTestCase con 6 helpers
- `backend/apps/core/tests/test_base.py` — smoke test
- `backend/apps/core/tests/test_sidebar.py` — 5 tests del Sub-bloque 3
- `docs/testing-debt.md` — registro de tests legacy skipped
- `docs/inventory/L0-03-system-modules-sidebar-README.md` — primer README de sub-bloque
- `CLAUDE.md` — sección nueva "Testing — Lectura obligatoria"

**Cambios estructurales:**
- `config/settings/testing.py` — eliminado fallback SQLite, PostgreSQL obligatorio
- `requirements/base.txt` — agregado django-fsm (faltaba, rompía Docker)
- `.github/workflows/ci.yml` — tests migrados bloqueantes, legacy informativos
- `apps/core/viewsets_config.py` — sidebar usa compute_user_rbac (3 fuentes RBAC)

**Tests legacy:**
- 7 archivos triajeados, 143 tests skipped con motivo
- test_health.py: 7 tests pasan, 3 skipped individualmente

### Métricas

| Métrica | Antes | Después |
|---|---|---|
| Tests backend en verde verificados | 0 | 13 |
| Tests con tenant real | 0 | 6 |
| CI bloqueante backend | No | Sí |
| Tests rotos sin documentar | ~110 | 0 |

### Hallazgos de dominio

**rbac_signals auto-propaga CargoSectionAccess:** cuando se crea una
TabSection, un signal post_save crea automáticamente CargoSectionAccess
para los cargos existentes. Comportamiento de producción. Cualquier test
o refactor del RBAC debe respetarlo.

**El bug del sidebar (RolAdicional/Group) ya estaba arreglado en la
sesión previa.** En esta sesión se cubrió con tests para evitar regresión.

### Deuda colateral descubierta (NO arreglada)

1. **requirements.txt vs requirements/base.txt desincronizados.** Pin
   exacto vs rangos amplios. Bomba de tiempo. Sesión dedicada futura.
2. **django-fsm 3.0 deprecated.** Migrar a viewflow.fsm cuando se active
   mejora_continua (módulo DISABLED).
3. **test_health.py: 3 tests rotos** por endpoint que retorna status
   inesperados para POST/PUT y deep_health que necesita Redis.
4. **pytest.ini con --cov=apps global** hace pytest ~10x más lento.
   Mover --cov a target explícito sería quick win.

### Estado del inventario L0

| Sub-bloque | Estado |
|---|---|
| L0-INDEX | Completo |
| 3 — System Modules / Sidebar | CONSOLIDADO |
| 7 — Infraestructura Transversal | Siguiente |
| 1 — Auth / JWT / Session | Pendiente |
| 5 — 2FA / Seguridad | Pendiente |
| 6 — IA Multi-Provider | Pendiente |
| 4 — User / Cargo / Datos Maestros | Pendiente |
| 2 — RBAC Dinámico | Pendiente |

### Lecciones aprendidas (método de trabajo)

**Fase 3 tomó 4 rounds de fix porque arrancamos con micro-instrucciones
paso a paso.** A partir del round 4 cambiamos a "brief amplio + Code
trabaja autónomo + reporta al final". Ese cambio cerró Fases 3+4+5 en
una sola tanda. Para próximas sesiones: arrancar directo con briefs
amplios, no con ping-pong de un paso.

**El diagnóstico empírico le ganó a las hipótesis plausibles.** Después
de 3 hipótesis técnicas que fallaron, un script de diagnóstico de 30
líneas reveló el signal de rbac_signals en 5 minutos. Cuando algo no
cierra, parar y medir en vez de adivinar.

---

## 2026-04-07 (segunda sesión) — Sub-bloque 7 CONSOLIDADO

### Resumen ejecutivo

Inventario + refactor + tests del Sub-bloque 7 (Infraestructura Transversal)
completado en 2 sesiones. Primera sesión: inventario profundo (443 líneas,
17 hallazgos). Segunda sesión: limpieza obvia + 10 tests + README.

### Cambios principales

**Limpieza:**
- Eliminadas 4 tareas basura de `tasks.py`: `generate_report_async` (stub),
  `process_file_upload` (stub), `example_task` (test), `long_running_task` (test)
- `send_weekly_reports` actualizado para no llamar al stub eliminado
- Eliminadas 2 rutas de routing en `celery.py` para tareas borradas
- `serializers_mixins.py` y `cache_utils.py` marcados con banner
  "INFRAESTRUCTURA ADELANTADA — NO CONSUMIDA EN PRODUCCIÓN"

**Tests nuevos:**
- `test_infraestructura.py` — 10 tests con BaseTenantTestCase
- Cubre: `get_tenant_empresa()` (3 tests), signals mágicos (5 tests),
  tareas Celery importables (2 tests)

**Documentación:**
- `docs/inventory/L0-07-infraestructura-transversal.md` — inventario (443 LOC)
- `docs/inventory/L0-07-infraestructura-transversal-README.md` — README

### Tests agregados: 10

| Test | Qué verifica |
|------|-------------|
| `test_returns_empresa_when_exists` | get_tenant_empresa retorna empresa |
| `test_auto_creates_when_missing` | auto_create=True crea empresa |
| `test_returns_none_when_missing_and_no_autocreate` | auto_create=False retorna None |
| `test_creating_section_propagates_to_existing_cargo` | Signal crea CargoSectionAccess |
| `test_creating_user_creates_tenant_user` | Signal crea TenantUser en public |
| `test_creating_user_creates_onboarding` | Signal crea UserOnboarding |
| `test_superuser_gets_admin_onboarding_type` | Superuser → tipo 'admin' |
| `test_cargo_nivel_change_propagates_to_users` | Propaga nivel_firma |
| `test_critical_tasks_importable` | Tareas Tier 1 son importables |
| `test_deleted_stubs_not_importable` | Stubs eliminados no existen |

### Estado del inventario L0

| Sub-bloque | Estado |
|---|---|
| L0-INDEX | Completo |
| 3 — System Modules / Sidebar | CONSOLIDADO |
| 7 — Infraestructura Transversal | CONSOLIDADO |
| 1 — Auth / JWT / Session | Siguiente |
| 5 — 2FA / Seguridad | Pendiente |
| 6 — IA Multi-Provider | Pendiente |
| 4 — User / Cargo / Datos Maestros | Pendiente |
| 2 — RBAC Dinámico | Pendiente |

### Métricas acumuladas

| Métrica | Antes | Después |
|---|---|---|
| Tests backend en verde verificados | 13 | 23 |
| Tests con tenant real | 6 | 16 |
| Sub-bloques consolidados | 1 | 2 |

### Deuda colateral descubierta (NO arreglada)

1. **`test_celery_task` view en core_views.py es código muerto.** Importa
   `example_task` y `generate_report_async` (ya eliminados), pero no está
   wired a ninguna URL. Eliminar en próxima sesión de limpieza.
2. **`send_weekly_reports` llama a un email placeholder.** La tarea periódica
   existe pero solo envía un email genérico. Se implementará cuando se
   active analytics (L50+).
3. **serializers_mixins.py (1,419 LOC) y cache_utils.py (329 LOC) siguen
   sin consumidores.** Marcados como infraestructura adelantada. Se usarán
   cuando se implemente la serializer factory y el caching general.

---

## 2026-04-07 (tercera sesión) — Limpieza Celery Beat + Hallazgo Portales

### Limpieza Celery Beat — 12 tareas zombie comentadas

Diagnóstico encontró 12 tareas en `app.conf.beat_schedule` (backend/config/celery.py)
que apuntaban a módulos no instalados en TENANT_APPS (CURRENT_DEPLOY_LEVEL=20):
motor_cumplimiento (4), talent_hub (2), gestion_estrategica.planeacion (4),
gestion_estrategica.revision_direccion (2). Las 4 de planeacion usaban
paths cortos sin prefijo `apps.gestion_estrategica.` y ni siquiera
resolvían — fallaban en cada disparo.

Las 12 fueron comentadas (no eliminadas) con marcador
"DESACTIVADO L20 — Reactivar al activar <módulo>" para que cuando cada
módulo se active en su nivel correspondiente, solo haya que descomentar
el bloque correspondiente.

Estado pre-limpieza: 35 entradas en beat_schedule (23 LIVE + 12 zombie).
Estado post-limpieza: 23 tareas activas, 12 comentadas con marcador.

NOTA: las rutas de routing (`task_routes`) para módulos OFF (líneas 421-458
de celery.py) siguen activas pero NO causan errores — solo definen a qué
cola iría una tarea si se disparara. No se tocaron por no estar en alcance.

### Decisión documentada: 2 apps de analytics activas en L20

Las apps `apps.analytics.config_indicadores` y `apps.analytics.exportacion_integracion`
están activas en TENANT_APPS desde antes de esta sesión. La decisión está
justificada en base.py:237-240 con el comentario "no dependen de C2, solo
de core.Cargo". Esta sesión documenta esta decisión que estaba presente
en el código pero ausente del MEMORY.md y del L0-INDEX.

Implicación para el modelo mental: el nivel real de despliegue es
"L20 + 2 parches de analytics", no "L20 puro". CURRENT_DEPLOY_LEVEL=20
sigue siendo correcto numéricamente porque analytics no tiene un nivel
asignado en la cascada.

### HALLAZGO ARQUITECTÓNICO CRÍTICO — Capa Portales no definida

Durante el diagnóstico se descubrió que Mi Portal (la landing del empleado
en el tenant) vive físicamente en `apps/talent_hub/api/ess_urls.py` y
`apps/talent_hub/api/people_analytics.py`. Esto es arquitectónicamente
incorrecto: los Portales son una capa transversal de presentación
orientada por tipo de audiencia (empleado, proveedor, cliente), NO son
features de un módulo de negocio.

**Visión del producto (Camilo, 2026-04-07):**
Los Portales son el aterrizaje de cada tipo de usuario dentro del tenant.
Tres audiencias confirmadas hoy:
- Mi Portal → empleados internos (con tabs de empleados)
- Portal Externo Proveedores → terceros vendedores (con sus tabs)
- Portal Externo Clientes → terceros compradores (con sus tabs)

Mi Portal específicamente debe ser una "landing dentro del tenant" pensada
como acceso rápido a las actividades del empleado. Hoy funciona parcialmente
para: perfil, encuestas, documentación. Crecerá con cada activación de
módulos (SST, capacitaciones, vacaciones, recibos, evaluación, etc.).

**Estado actual roto en producción:**
- `/api/talent-hub/mi-portal/mi-perfil/` → FUNCIONA (consume mi_equipo.colaboradores)
- `/api/talent-hub/mi-portal/mis-vacaciones/` → 500 si se llama (importa novedades — OFF)
- `/api/talent-hub/mi-portal/solicitar-permiso/` → 500 si se llama (importa novedades — OFF)
- `/api/talent-hub/people-analytics/` → funciona parcial (capacitaciones siempre None)

Estos endpoints se montan porque `talent_hub/urls.py:56,63` usa
`_is_installed('colaboradores')` que matchea el label de
`apps.mi_equipo.colaboradores` (LIVE). El frontend los consume desde
`frontend/src/features/mi-portal/api/miPortalApi.ts` apuntando a
`/api/talent-hub/mi-portal/`.

**Decisión tomada en esta sesión:**
NO tocar el código de Mi Portal hoy. Dejar los 2 endpoints rotos vivos
porque no están generando alertas en Sentry y porque parchearlos sería
poner curitas a algo que va a ser refactorizado completamente cuando se
defina la capa Portales.

**Pendiente: SESIÓN DEDICADA "Definición arquitectónica de la capa Portales"**
Salida esperada de esa sesión:
1. Documento `docs/architecture/portales.md` con el patrón elegido
2. Catálogo definitivo de portales (Mi Portal, Proveedores, Clientes,
   posiblemente Auditor, Consultor, etc.)
3. Decisión de patrón arquitectónico (hipótesis a validar: Patrón 2 —
   App con secciones, una app por portal en `apps/portales/`)
4. Plan de migración de los endpoints actuales con URL aliasing para
   cero impacto en frontend y usuarios actuales
5. Definición de cómo cada portal mapea al RBAC dinámico
6. Definición de cómo cada portal consume módulos OFF gracefully
   (feature flags, secciones ocultas, respuestas vacías documentadas)

### Diagnóstico de módulos OFF — Resumen

| Dimensión | Resultado |
|-----------|----------|
| Apps OFF en INSTALLED_APPS | 0 (2 de analytics son decisión deliberada) |
| Tareas Celery zombie (corregido) | 12 → 0 (comentadas) |
| URLs de apps OFF | 0 directas (guards correctos) + 1 indirecta (talent-hub) |
| Apps OFF con ready() ejecutándose | 0 |
| LOC dormidas en disco (L25-L90) | ~144,264 LOC |

---

## Próxima Sesión — PRIORIDADES

### Pendientes del usuario (no código)
1. SSL: renovar en Hostinger panel

### Siguiente paso: Inventario + Refactor Sub-bloque 1 — Auth / JWT / Session

**Método:** brief amplio. Inventario + refactor en la misma sesión.

**Sub-bloque 1 es MÁS GRANDE de lo que el INDEX estimaba:** ~2,735 LOC
producción (no 1,137). La diferencia: tenant/auth_views.py (925 LOC) y
tenant/authentication.py (329 LOC) son el corazón real del login y no
estaban contadas en el INDEX original. 16 tests existentes PERO todos
skipped y apuntan al flujo legacy (no al flujo real tenant).

El orden de inventario L0 sigue siendo:
3 CONSOLIDADO → 7 CONSOLIDADO → 1 → 5 → 6 → 4 → 2
