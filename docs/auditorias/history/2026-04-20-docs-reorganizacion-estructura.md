# Sesión 2026-04-20 — Auditoría y Reorganización Documental

> **Fecha:** 2026-04-20 · **Rama:** `main` · **Commit de cierre:** pendiente
> **Scope:** Solo `docs/` — no se tocó código LIVE ni código de módulos.

---

## Resumen ejecutivo

Sesión de deuda documental acumulada. Empezó como auditoría del perímetro LIVE
y se convirtió en la primera reorganización profunda de `docs/` desde que el
proyecto arrancó. Se dejó la documentación alineada con las mejores prácticas
del mercado (arc42 + Divio) y coherente con el principio "LIVE es la verdad".

---

## Commits del día (de esta sesión)

| Commit | Descripción | CI |
|--------|-------------|----|
| `9e4a8885` | docs: reorganizar 01-arquitectura con kebab-case y fuente de verdad única | ⏳ no verificado |
| `9afc76ea` | docs(arquitectura): marcar estados y cross-references quirúrgicas | ⏳ no verificado |
| `3bc187d8` | docs: Bloque A — reorganización estructural y limpieza | ⏳ no verificado |
| `f9059ed3` | docs: Bloque B — normalización naming + estructura modular + docs nuevos | ⏳ no verificado |

**Pendientes de commit (esta sesión, archivos sin añadir):**
- `README.md` — reescritura completa
- `CLAUDE.md` — adelgazamiento (-57 líneas) + versiones corregidas
- `.claude/commands/cerrar-sesion.md` — rutas `docs/auditorias/history/` + tabla routing

---

## Estado del producto

- **CURRENT_DEPLOY_LEVEL:** L20 (sin cambios — sesión solo docs)
- **Tests:** no corridos en esta sesión (no se tocó código)
- **Gate CI:** ⏳ no verificado para los 4 commits de docs
- **Apps LIVE tocadas:** ninguna (sesión 100% documental)

---

## Trabajo realizado (cronología)

### Bloque 0 — Auditoría Fase 1 (empírica)
- Levantamiento de perímetro LIVE real vs declarado
- Comparación apps en `base.py` vs código en disco
- Base para decisiones de reorganización

### Bloque 1 — Consolidación `docs/01-arquitectura/`
- Absorbido `docs/architecture/` (directorio duplicado) → `docs/01-arquitectura/`
- Renombrados 10 archivos a kebab-case (UPPERCASE → kebab, dos pasos en Windows)
- Creados 4 documentos nuevos:
  - `INDEX.md` — mapa de entrada y orden canónico de lectura
  - `estructura.md` — árbol del repo (2 niveles)
  - `capas.md` — modelo de capas C0/C1/CT/C2/C3 con mapa capa→apps
  - `stack.md` — versiones pinneadas de todas las dependencias
  - `apps-django.md` — inventario completo de apps Django

### Bloque 2 — Cross-references quirúrgicas en arquitectura
- `config-admin.md` — añadido banner `> ESTADO: BUGS ACTIVOS EN UI`
- `automatizaciones.md` — añadido banner `> ESTADO: ROADMAP CONGELADO`
- `rbac-sistema.md` — añadida Sección 15 "Evolución futura — RBAC v5" con link a `rbac-v5-roadmap.md`

### Bloque A — Reorganización estructural y limpieza
- 22 logs de sesión movidos de `docs/history/` → `docs/auditorias/history/`
- Creados directorios: `docs/05-negocio/`, `docs/06-changelog/`
- Docs de negocio movidos de `docs/business/` → `docs/05-negocio/`
- 7 stubs de módulos dormidos eliminados (`ACCOUNTING.md`, `ADMIN-FINANCE.md`, etc.)
- Stubs de módulos dormidos con contenido → `docs/03-modulos/dormidos/`
- `docs/testing/` → `docs/02-desarrollo/`

### Bloque B — Naming + docs nuevos
- Creados `INDEX.md` en cada directorio de `docs/` (02, 03, 04, 05)
- Creado `docs/02-desarrollo/onboarding-dev.md` — guía de onboarding para devs nuevos
- Creado `docs/06-changelog/CHANGELOG.md` — versiones 5.1.0 → 5.9.0 documentadas
- Renombrados archivos legacy UPPERCASE → kebab-case en `02-desarrollo/` y `03-modulos/`

### Bloque final — Alineación README / CLAUDE.md / cerrar-sesion
- `README.md` reescrito: "ERP" eliminado, versiones actualizadas (5.9.0/5.4.0), 6 capas, sección LIVE, 6+1 directorios docs, RBAC correcto
- `CLAUDE.md` adelgazado (687→630 líneas): stack table reducida a 10 filas críticas, árbol proyecto reemplazado por bullets+pointer, tabla apps-django reemplazada por pointer, docs tree reemplazado por pointer, versiones corregidas, Sistema de Memoria actualizado con ruta `docs/auditorias/history/`
- `.claude/commands/cerrar-sesion.md` corregido: rutas Steps 3/4/5/6 apuntan a `docs/auditorias/history/`, añadida tabla de routing documental (9 tipos × directorio × razón)

---

## Decisiones tomadas (no reabrir)

1. **`docs/01-arquitectura/` es la única fuente de verdad de arquitectura** — `docs/architecture/` absorbido y eliminado. No hay dos directorios de arquitectura.
2. **Kebab-case estricto para todos los docs** — sin números en nombres de archivo, sin UPPERCASE, sin underscores. El orden lo define cada `INDEX.md`.
3. **Los logs de sesión van en `docs/auditorias/history/`** — nunca en `docs/history/` (que es solo para pitfalls y sprint-history permanentes).
4. **Stubs de módulos dormidos eliminados** — solo `docs/03-modulos/dormidos/` mantiene stubs con contenido real. Crear stubs vacíos = ruido.
5. **README.md es la verdad pública** — no debe duplicar docs internas, solo apuntar. CLAUDE.md es reglas de comportamiento, no referencia técnica.
6. **CLAUDE.md solo tiene lo que Claude necesita para decidir** — tablas completas (stack, apps, árbol) viven en `docs/`, CLAUDE.md tiene pointer. Sin duplicación.
7. **`cerrar-sesion.md` es el single source of truth del protocolo de cierre** — incluye tabla de routing documental que acompaña cualquier sesión futura.

---

## Deuda consciente activa

- **CI no verificado para commits de docs**: Los 4 commits de reorganización docs no tienen verificación de CI. Los docs no afectan tests, pero los renames de archivos podrían romper links en CI si algún check los valida. Verificar antes del próximo push.
- **`docs/audits/` vs `docs/auditorias/`**: El commit `9e4a8885` creó `docs/audits/2026-04-20-fase1-perimetro-stack.md`. Este path usa inglés (`audits`) cuando la convención es español (`auditorias`). Al próximo commit de docs, mover el archivo al path correcto.
- **Bloque A git mv**: Algunos renames de sesión anterior usaron `mv` regular (no `git mv`) porque los archivos eran untracked. Git los detectó como renames por similitud de contenido. Verificar con `git log --follow` que el historial quedó limpio si se necesita rastrear un archivo.
- **S8.6 pendiente**: ~10 componentes FE LIVE pendientes de adoptar patrón RBAC `EntrevistasTab` (deuda de sesión S8.5).
- **S8.7 diferido**: Tests con fixtures de cargo restringido (Paso 4 de S8.5).

---

## Próximo paso claro

Verificar CI de los 4 commits de docs en GitHub → luego continuar S8.6: adopción RBAC FE en los ~10 componentes LIVE pendientes siguiendo patrón `EntrevistasTab.tsx`.

---

## Archivos clave tocados

- `docs/01-arquitectura/INDEX.md` — creado: mapa de entrada y orden canónico
- `docs/01-arquitectura/estructura.md` — creado: árbol del repo 2 niveles
- `docs/01-arquitectura/capas.md` — creado: modelo de capas + mapa capa→apps
- `docs/01-arquitectura/stack.md` — creado: versiones pinneadas todas las dependencias
- `docs/01-arquitectura/apps-django.md` — creado: inventario completo apps Django
- `docs/01-arquitectura/config-admin.md` — editado: banner BUGS ACTIVOS añadido
- `docs/01-arquitectura/automatizaciones.md` — editado: banner ROADMAP CONGELADO añadido
- `docs/01-arquitectura/rbac-sistema.md` — editado: Sección 15 RBAC v5 añadida
- `docs/02-desarrollo/INDEX.md` — creado: mapa del directorio de desarrollo
- `docs/02-desarrollo/onboarding-dev.md` — creado: guía onboarding para devs nuevos
- `docs/03-modulos/INDEX.md` — creado: mapa de módulos LIVE vs dormidos
- `docs/04-devops/INDEX.md` — creado: mapa del directorio DevOps
- `docs/05-negocio/INDEX.md` — creado: mapa del directorio de negocio
- `docs/06-changelog/CHANGELOG.md` — creado: historial versiones 5.1.0→5.9.0
- `README.md` — reescrito: versiones, arquitectura 6 capas, LIVE principle, docs completos
- `CLAUDE.md` — adelgazado: −57 líneas, versiones corregidas, pointer a docs
- `.claude/commands/cerrar-sesion.md` — corregido: rutas + tabla routing documental

---

## Hallazgos abiertos

*(ninguno nuevo generado en esta sesión — solo reorganización de documentación)*
