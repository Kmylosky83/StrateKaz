# Arquitectura CI/CD - StrateKaz

## Diagrama de Flujo General

```
┌─────────────────────────────────────────────────────────────────┐
│                        DEVELOPER                                 │
│                                                                  │
│  1. Hace cambios en código                                      │
│  2. Ejecuta tests localmente (.github/scripts/test-ci-locally)  │
│  3. Commit siguiendo Conventional Commits                       │
│  4. Push a branch                                               │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                    GITHUB REPOSITORY                             │
│                                                                  │
│  Push detectado → Trigger workflows automáticos                 │
└─────────────────────┬───────────────────────────────────────────┘
                      │
        ┌─────────────┼─────────────┬──────────────┐
        │             │             │              │
        ▼             ▼             ▼              ▼
┌─────────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐
│  CI.yml     │ │PR Checks │ │ CodeQL   │ │Docker Build  │
│             │ │          │ │          │ │(solo tags)   │
│ Backend Test│ │Validation│ │Security  │ │              │
│ Frontend    │ │Stats     │ │Analysis  │ │Build Images  │
│ Build       │ │Deps Check│ │          │ │Push to GHCR  │
└─────────────┘ └──────────┘ └──────────┘ └──────────────┘
        │             │             │              │
        └─────────────┴─────────────┴──────────────┘
                      │
                      ▼
        ┌─────────────────────────┐
        │  ALL CHECKS PASSED?     │
        └─────────────────────────┘
                      │
            ┌─────────┴─────────┐
            │                   │
           YES                 NO
            │                   │
            ▼                   ▼
    ┌──────────────┐    ┌──────────────┐
    │ READY TO     │    │ FIX ISSUES   │
    │ MERGE        │    │ RE-RUN       │
    └──────────────┘    └──────────────┘
```

---

## Flujo de CI (Continuous Integration)

```
┌──────────────────────────────────────────────────────────────┐
│                    CI WORKFLOW (ci.yml)                       │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  TRIGGER: Push to main/develop, Pull Requests               │
│                                                              │
│  ┌─────────────────────┐  ┌─────────────────────┐           │
│  │  BACKEND-TEST       │  │  FRONTEND-BUILD     │           │
│  │                     │  │                     │           │
│  │  1. Checkout        │  │  1. Checkout        │           │
│  │  2. Setup Python    │  │  2. Setup Node 20   │           │
│  │  3. Cache pip       │  │  3. Cache npm       │           │
│  │  4. Setup MySQL     │  │  4. npm ci          │           │
│  │  5. Install deps    │  │  5. Type check      │           │
│  │  6. Django check    │  │  6. ESLint          │           │
│  │  7. Migrations      │  │  7. Build prod      │           │
│  │  8. Tests           │  │  8. Upload artifact │           │
│  │  9. Black/Ruff      │  │                     │           │
│  └─────────────────────┘  └─────────────────────┘           │
│           │                         │                        │
│           └────────┬────────────────┘                        │
│                    ▼                                         │
│           ┌─────────────────┐                                │
│           │ QUALITY SUMMARY │                                │
│           │                 │                                │
│           │ Generate report │                                │
│           │ Show results    │                                │
│           └─────────────────┘                                │
│                                                              │
└──────────────────────────────────────────────────────────────┘

DURACIÓN: ~5-8 minutos
CACHE: pip, npm
PARALELO: Backend y Frontend corren simultáneamente
```

---

## Flujo de Docker Build

```
┌──────────────────────────────────────────────────────────────┐
│              DOCKER BUILD WORKFLOW (docker-build.yml)         │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  TRIGGER: Push to main, Tags (v*.*.*, release-*)            │
│                                                              │
│  ┌─────────────────────┐  ┌─────────────────────┐           │
│  │  BUILD-BACKEND      │  │  BUILD-FRONTEND     │           │
│  │                     │  │                     │           │
│  │  1. Checkout        │  │  1. Checkout        │           │
│  │  2. Setup Buildx    │  │  2. Setup Buildx    │           │
│  │  3. Login GHCR      │  │  3. Login GHCR      │           │
│  │  4. Extract meta    │  │  4. Extract meta    │           │
│  │  5. Build image     │  │  5. Build image     │           │
│  │  6. Push to GHCR    │  │  6. Push to GHCR    │           │
│  │                     │  │                     │           │
│  │  Tags:              │  │  Tags:              │           │
│  │  - latest           │  │  - latest           │           │
│  │  - v1.0.0           │  │  - v1.0.0           │           │
│  │  - main-sha123      │  │  - main-sha123      │           │
│  └─────────────────────┘  └─────────────────────┘           │
│           │                         │                        │
│           └────────┬────────────────┘                        │
│                    ▼                                         │
│           ┌─────────────────┐                                │
│           │ SECURITY-SCAN   │                                │
│           │                 │                                │
│           │ Trivy scanning  │                                │
│           │ Upload to       │                                │
│           │ GitHub Security │                                │
│           └─────────────────┘                                │
│                    │                                         │
│                    ▼                                         │
│           ┌─────────────────┐                                │
│           │  BUILD SUMMARY  │                                │
│           │                 │                                │
│           │  Generate       │                                │
│           │  pull commands  │                                │
│           └─────────────────┘                                │
│                                                              │
└──────────────────────────────────────────────────────────────┘

DURACIÓN: ~8-12 minutos
CACHE: Docker layers (GitHub Actions cache)
PARALELO: Backend y Frontend builds simultáneos
REGISTRY: GitHub Container Registry (ghcr.io)
```

---

## Flujo de PR Checks

```
┌──────────────────────────────────────────────────────────────┐
│                PR CHECKS WORKFLOW (pr-checks.yml)             │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  TRIGGER: Pull Request (opened, synchronize, reopened)      │
│                                                              │
│  ┌──────────────────┐  ┌──────────────────┐                 │
│  │ PR-VALIDATION    │  │  CODE-STATS      │                 │
│  │                  │  │                  │                 │
│  │ Check:           │  │ Calculate:       │                 │
│  │ - Title format   │  │ - Files changed  │                 │
│  │ - Conflicts      │  │ - Lines +/-      │                 │
│  │ - Branch name    │  │ - Categories     │                 │
│  └──────────────────┘  └──────────────────┘                 │
│           │                      │                           │
│           └──────────┬───────────┘                           │
│                      ▼                                       │
│           ┌──────────────────┐                               │
│           │ DEPENDENCY-CHECK │                               │
│           │                  │                               │
│           │ Check changes in:│                               │
│           │ - requirements   │                               │
│           │ - package.json   │                               │
│           └──────────────────┘                               │
│                      │                                       │
│                      ▼                                       │
│           ┌──────────────────┐                               │
│           │   PR-COMMENT     │                               │
│           │                  │                               │
│           │ Post/Update      │                               │
│           │ summary comment  │                               │
│           └──────────────────┘                               │
│                                                              │
└──────────────────────────────────────────────────────────────┘

DURACIÓN: ~2-3 minutos
AUTOMATIZACIÓN: Comentario automático en PR con resultados
```

---

## Flujo de CodeQL Security

```
┌──────────────────────────────────────────────────────────────┐
│             CODEQL WORKFLOW (codeql.yml)                      │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  TRIGGER: Push, PRs, Schedule (Mondays 6AM UTC)             │
│                                                              │
│  ┌─────────────────────┐  ┌─────────────────────┐           │
│  │  ANALYZE PYTHON     │  │  ANALYZE JAVASCRIPT │           │
│  │                     │  │                     │           │
│  │  1. Checkout        │  │  1. Checkout        │           │
│  │  2. Init CodeQL     │  │  2. Init CodeQL     │           │
│  │  3. Autobuild       │  │  3. Autobuild       │           │
│  │  4. Analyze         │  │  4. Analyze         │           │
│  │  5. Upload SARIF    │  │  5. Upload SARIF    │           │
│  │                     │  │                     │           │
│  │  Queries:           │  │  Queries:           │           │
│  │  - Security         │  │  - Security         │           │
│  │  - Quality          │  │  - Quality          │           │
│  └─────────────────────┘  └─────────────────────┘           │
│           │                         │                        │
│           └────────┬────────────────┘                        │
│                    ▼                                         │
│         ┌──────────────────────┐                             │
│         │ DEPENDENCY-REVIEW    │                             │
│         │ (Only on PRs)        │                             │
│         │                      │                             │
│         │ Check dependencies   │                             │
│         │ for vulnerabilities  │                             │
│         └──────────────────────┘                             │
│                    │                                         │
│                    ▼                                         │
│         ┌──────────────────────┐                             │
│         │  GITHUB SECURITY     │                             │
│         │                      │                             │
│         │  Results visible in  │                             │
│         │  Security tab        │                             │
│         └──────────────────────┘                             │
│                                                              │
└──────────────────────────────────────────────────────────────┘

DURACIÓN: ~10-15 minutos
FRECUENCIA: Cada push + Lunes 6AM
REPORTE: GitHub Security tab
```

---

## Dependabot Automation

```
┌──────────────────────────────────────────────────────────────┐
│                    DEPENDABOT (dependabot.yml)                │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  LUNES 6:00 AM            MARTES 6:00 AM                     │
│  ┌──────────────┐         ┌──────────────┐                  │
│  │   Python     │         │   Docker     │                  │
│  │   Packages   │         │   Images     │                  │
│  │              │         │              │                  │
│  │ requirements │         │ backend/     │                  │
│  │ .txt         │         │ Dockerfile   │                  │
│  └──────────────┘         └──────────────┘                  │
│  ┌──────────────┐                                            │
│  │     NPM      │         MIÉRCOLES 6:00 AM                 │
│  │   Packages   │         ┌──────────────┐                  │
│  │              │         │   GitHub     │                  │
│  │ package.json │         │   Actions    │                  │
│  └──────────────┘         │              │                  │
│                           │ workflows/   │                  │
│                           └──────────────┘                  │
│                                                              │
│  PROCESO:                                                    │
│  1. Detecta actualizaciones disponibles                     │
│  2. Crea branch automáticamente                             │
│  3. Abre Pull Request                                       │
│  4. Ejecuta CI workflows                                    │
│  5. Asigna a reviewer                                       │
│                                                              │
│  AGRUPAMIENTO INTELIGENTE:                                  │
│  - Django packages juntas                                   │
│  - React packages juntas                                    │
│  - Build tools juntas                                       │
│                                                              │
└──────────────────────────────────────────────────────────────┘

FRECUENCIA: Semanal (días específicos)
LÍMITE: 5 PRs abiertos por ecosistema
AUTO-MERGE: No (requiere revisión manual)
```

---

## Estrategia de Caching

```
┌─────────────────────────────────────────────────────────────┐
│                    CACHE STRATEGY                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  PIP CACHE (Backend)                                        │
│  ┌──────────────────────────────────────────────┐          │
│  │ Key: os-pip-hash(requirements.txt)           │          │
│  │ Path: ~/.cache/pip                           │          │
│  │ Benefit: Skip pip download (~2-3 min saved) │          │
│  └──────────────────────────────────────────────┘          │
│                                                             │
│  NPM CACHE (Frontend)                                       │
│  ┌──────────────────────────────────────────────┐          │
│  │ Key: os-node-hash(package-lock.json)         │          │
│  │ Path: frontend/node_modules                  │          │
│  │ Benefit: Skip npm install (~1-2 min saved)  │          │
│  └──────────────────────────────────────────────┘          │
│                                                             │
│  DOCKER LAYER CACHE                                         │
│  ┌──────────────────────────────────────────────┐          │
│  │ Type: GitHub Actions cache                   │          │
│  │ Mode: max (cache all layers)                 │          │
│  │ Benefit: Skip unchanged layers (~3-5 min)   │          │
│  └──────────────────────────────────────────────┘          │
│                                                             │
│  CACHE INVALIDATION:                                        │
│  - Pip: cuando cambia requirements.txt                      │
│  - NPM: cuando cambia package-lock.json                     │
│  - Docker: automático por layer hash                        │
│                                                             │
│  MANTENIMIENTO:                                             │
│  - Auto-limpieza de caches viejos (7 días)                 │
│  - Manual delete en Actions > Caches                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Estrategia de Tags y Versiones

```
┌─────────────────────────────────────────────────────────────┐
│                    VERSION STRATEGY                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  TAG FORMAT                    DOCKER TAGS GENERATED        │
│                                                             │
│  v1.0.0          ────────────→  backend:1.0.0              │
│  (SemVer)                        backend:1.0                │
│                                  backend:1                  │
│                                  backend:latest             │
│                                                             │
│  release-2025Q1  ────────────→  backend:release-2025Q1     │
│  (Release)                       backend:latest             │
│                                                             │
│  main branch     ────────────→  backend:main               │
│  (commit)                        backend:main-sha12345     │
│                                                             │
│  METADATA LABELS:                                           │
│  - org.opencontainers.image.version                        │
│  - org.opencontainers.image.created                        │
│  - org.opencontainers.image.revision (git sha)             │
│  - org.opencontainers.image.source                         │
│                                                             │
│  SEMANTIC VERSIONING:                                       │
│  MAJOR.MINOR.PATCH                                          │
│  1.0.0 → Breaking changes                                  │
│  0.1.0 → New features                                      │
│  0.0.1 → Bug fixes                                         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Security Layers

```
┌─────────────────────────────────────────────────────────────┐
│                    SECURITY LAYERS                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  LAYER 1: CODE ANALYSIS                                     │
│  ┌──────────────────────────────────────────┐              │
│  │ CodeQL                                   │              │
│  │ - Static analysis                        │              │
│  │ - Security queries                       │              │
│  │ - Quality queries                        │              │
│  └──────────────────────────────────────────┘              │
│                                                             │
│  LAYER 2: DEPENDENCY SCANNING                               │
│  ┌──────────────────────────────────────────┐              │
│  │ Dependabot                               │              │
│  │ - Vulnerability detection                │              │
│  │ - Auto PR creation                       │              │
│  │ - Severity-based alerts                  │              │
│  └──────────────────────────────────────────┘              │
│                                                             │
│  LAYER 3: CONTAINER SCANNING                                │
│  ┌──────────────────────────────────────────┐              │
│  │ Trivy                                    │              │
│  │ - OS vulnerability scan                  │              │
│  │ - Application dependency scan            │              │
│  │ - CRITICAL/HIGH severity focus           │              │
│  └──────────────────────────────────────────┘              │
│                                                             │
│  LAYER 4: SECRET SCANNING                                   │
│  ┌──────────────────────────────────────────┐              │
│  │ GitHub Secret Scanning                   │              │
│  │ - Detect exposed credentials             │              │
│  │ - API keys detection                     │              │
│  │ - Automatic alerts                       │              │
│  └──────────────────────────────────────────┘              │
│                                                             │
│  ALL RESULTS → GitHub Security Tab                         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Métricas y KPIs

```
┌─────────────────────────────────────────────────────────────┐
│                    SUCCESS METRICS                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  BUILD SUCCESS RATE                                         │
│  ┌────────────────────────────────┐                        │
│  │ Target: > 95%                  │                        │
│  │ Measurement: Successful runs / │                        │
│  │              Total runs        │                        │
│  └────────────────────────────────┘                        │
│                                                             │
│  AVERAGE BUILD TIME                                         │
│  ┌────────────────────────────────┐                        │
│  │ CI: ~5-8 minutes               │                        │
│  │ Docker: ~8-12 minutes          │                        │
│  │ PR Checks: ~2-3 minutes        │                        │
│  │ CodeQL: ~10-15 minutes         │                        │
│  └────────────────────────────────┘                        │
│                                                             │
│  SECURITY POSTURE                                           │
│  ┌────────────────────────────────┐                        │
│  │ Critical Vulns: 0              │                        │
│  │ High Vulns: 0                  │                        │
│  │ Medium: < 5                    │                        │
│  │ Code Quality: A rating         │                        │
│  └────────────────────────────────┘                        │
│                                                             │
│  DEPLOYMENT FREQUENCY                                       │
│  ┌────────────────────────────────┐                        │
│  │ Daily deployments to staging   │                        │
│  │ Weekly releases to production  │                        │
│  └────────────────────────────────┘                        │
│                                                             │
│  MEAN TIME TO RECOVERY (MTTR)                              │
│  ┌────────────────────────────────┐                        │
│  │ Target: < 1 hour               │                        │
│  │ Rollback capability enabled    │                        │
│  └────────────────────────────────┘                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

**Creado:** 2025-12-23
**Versión:** 1.0.0
**Autor:** DevOps Team
