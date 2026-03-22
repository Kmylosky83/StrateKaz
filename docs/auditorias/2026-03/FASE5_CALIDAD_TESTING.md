# FASE 5 — Calidad de Código y Testing

**Auditoría:** Health Check Integral StrateKaz SGI
**Fase:** 5 de 7
**Agentes:** Code Quality Specialist + CI/CD Specialist + pytest + vitest ejecutados
**Fecha:** 22 de marzo de 2026
**Duración:** ~25 minutos (2 agentes + test suites reales)

---

## Resumen Ejecutivo

Se ejecutaron las suites de tests reales y se auditó la calidad del código completo. El codebase tiene **excelente organización y naming** (0 violaciones de convenciones) pero **cobertura de tests crítica**: backend al 8% y frontend sin tests en CI. La deuda técnica documentada (158 TODOs) está bien organizada pero incluye gaps de seguridad multi-tenant. El CI pipeline funciona pero carece de gates de calidad obligatorios.

**Puntuación global Fase 5: 5.5/10**

---

## Métricas Clave (Datos Reales)

| Métrica | Valor |
|---------|-------|
| **Backend coverage (pytest)** | **8%** (94,869 statements, 87,158 missed) |
| **Frontend tests** | 468/494 pass (**94.7%**), 26 failing en 6 archivos |
| **Frontend test files** | 29 (23 pass, 6 fail) |
| **Vitest en CI** | **NUNCA SE EJECUTA** |
| **Backend tests colectados** | 579 (34 errores de colección en módulos comentados) |
| **TODOs/FIXMEs** | 158 total (114 backend, 44 frontend) |
| **Archivos >500 líneas (frontend)** | 20 |
| **Duplicación serializers** | 180+ pares List/Detail |
| **Duplicación FormModals** | 188 archivos con patrón idéntico |
| **Naming violations** | 0 |
| **Magic numbers** | <10 (todos documentados) |
| **Hardcoded URLs** | 20 instancias (mayormente fallbacks correctos) |
| **npm vulnerabilities** | 21 (1 critical, 10 high, 10 moderate) |

---

## Hallazgos por Severidad

### CRITICO (P0)

#### H1 — Backend test coverage: 8%

**Impacto:** Regressions invisibles. Refactorizaciones arriesgadas. Sin confidence para deploy.

**Evidencia real (pytest --cov):**
```
TOTAL    94,869    87,158    8%
```

**Módulos con 0% cobertura:** workflow_engine (views, serializers, urls), audit_system, analytics, gamificacion, y la mayoría de sub-apps activas.

**Módulos con cobertura parcial:** core (models parcial), gestion_estrategica (modelos base).

---

#### H2 — Vitest NUNCA se ejecuta en CI

**Impacto:** 494 tests frontend nunca validan el build. Los 80% thresholds configurados en vitest.config.ts son decorativos.

**Evidencia:**
- `ci.yml` no contiene paso de vitest
- Frontend CI solo ejecuta: `tsc --noEmit` + `eslint` + `vite build`
- vitest.config.ts tiene `coverage: { lines: 80, functions: 80, branches: 80, statements: 80 }` — nunca verificado

---

#### H3 — 26 tests frontend failing (6 archivos)

**Impacto:** Tests existentes rotos — regresiones no detectadas.

**Archivos con fallos:**
- AreasTab.test.tsx — heading text mismatch
- Y 5 archivos adicionales con errores de render/assertion

---

#### H4 — Multi-tenant filtering missing en medicina_laboral

**Impacto:** Usuarios pueden ver datos de otros tenants.

**Evidencia:** `apps/hseq_management/medicina_laboral/views.py` — 4 TODOs en líneas 242, 357, 446, 650:
```python
# TODO: Implementar filtro por empresa según usuario autenticado
```

**Severidad:** CRÍTICA — Gap de seguridad real.

---

### ALTO (P1)

#### H5 — pip-audit y npm audit non-blocking en CI

Vulnerabilidades pueden mergearse sin review. `continue-on-error: true` en ambos.

#### H6 — 34 errores de colección pytest en módulos comentados

Tests de módulos C2 comentados (supply_chain, sales_crm, etc.) intentan importar modelos no registrados → `RuntimeError`. Requiere configurar pytest para ignorar estos módulos automáticamente.

#### H7 — Workflow firma_digital: 6 acciones críticas sin implementar

```python
# TODO: Implementar lógica específica según los roles del usuario
# TODO: Crear notificación para el siguiente firmante
# TODO: Implementar lógica de destinatarios según configuración
# TODO: Implementar lógica de inicio/rechazo/renovación
```

#### H8 — 20 archivos frontend >500 líneas

Top offenders: MedicinaLaboralPage (1,489), EmergenciasPage (1,395), useMedicinaLaboral hook (1,332), AuditoriasInternasPage (1,298).

#### H9 — Black/Ruff no están en requirements.txt

CI los instala via requirements-dev.txt implícitamente. Versiones no garantizadas.

---

### MEDIO (P2)

#### H10 — 158 TODOs/FIXMEs (114 backend, 44 frontend)

Bien documentados pero representan deuda técnica real. Top módulos: gestion_estrategica (27), production_ops (16), hseq (8), workflow_engine (7).

#### H11 — 180+ pares de serializers duplicados

Patrón `ModelListSerializer` + `ModelSerializer` repetido en todos los módulos. Candidato a factory.

#### H12 — 188 FormModals con patrón idéntico

70% de código duplicado entre modales CRUD. Hook factory + wrapper component reduciría significativamente.

#### H13 — Backend pre-commit no lint Python

`.husky/pre-commit` solo ejecuta `cd frontend && npx lint-staged`. Backend code puede commitearse sin Black/Ruff.

#### H14 — Prettier no verificado en CI

Solo enforced via pre-commit local. CI no verifica formatting frontend.

#### H15 — No hay `manage.py check --deploy` en CI

Production safety checks (HSTS, SECURE_*, etc.) no verificados automáticamente.

---

### BAJO (P3)

#### H16 — No hay Dependabot configurado

Actualizaciones de dependencias manuales.

#### H17 — No hay E2E tests (Playwright/Cypress)

Integration coverage desconocida.

#### H18 — No hay bundle size limits

Frontend bloat pasa desapercibido.

---

## Verificaciones Exitosas

### Linting: FUNCIONAL

| Tool | Configurado | CI Blocking | Estado |
|------|-----------|-------------|--------|
| Black (Python) | 88 chars, v23.12.0 | SI | PASS |
| Ruff (Python) | Default rules | SI | PASS |
| ESLint (TS/React) | max-warnings 0 | SI | PASS |
| Prettier (TS/CSS) | Pre-commit only | NO | Parcial |
| TypeScript strict | strict: true | SI | PASS |
| commitlint | Conventional commits | SI | PASS |

### Naming Conventions: PERFECTO

| Contexto | Convención | Violaciones |
|----------|-----------|-------------|
| Python files | snake_case | 0 |
| Python functions | snake_case | 0 |
| Python classes | PascalCase | 0 |
| TS/TSX files | kebab-case / PascalCase | 0 |
| TS functions | camelCase | 0 |
| TS types/interfaces | PascalCase | 0 |
| Constants | UPPER_CASE | 0 |

### CI Pipeline: OPERACIONAL

```
Git Push → ci.yml (parallel):
  ├─ Backend: Django checks → migrate → pytest → Black → Ruff → pip-audit
  └─ Frontend: tsc --noEmit → ESLint → vite build → npm audit

PR → pr-checks.yml: Conventional commits + merge conflict detection
Schedule → codeql.yml: JS + Python security scan (weekly)
```

### Test Infrastructure: EXISTENTE

| Componente | Backend | Frontend |
|-----------|---------|----------|
| Runner | pytest + Django | Vitest |
| DB | PostgreSQL 15 (CI) | jsdom |
| Fixtures | factory-boy + Faker | testing-library |
| Coverage tool | pytest-cov | v8 provider |
| Coverage threshold | **NINGUNO** | 80% (no verificado) |
| Test markers | unit, integration, slow | N/A |
| Mocks | unittest.mock | window.matchMedia, etc. |

---

## Puntuación por Área

| Área | Puntuación | Justificación |
|------|-----------|---------------|
| Naming conventions | 10/10 | 0 violaciones en todo el codebase |
| Linting enforcement | 8/10 | ESLint strict, Black/Ruff en CI |
| Code organization | 8/10 | Buena estructura, factory patterns |
| CI pipeline | 6.5/10 | Funcional pero sin gates de calidad |
| **Backend test coverage** | **1/10** | **8% — crítico** |
| **Frontend test coverage** | **4/10** | **94.7% pass rate pero nunca en CI** |
| Code duplication | 4/10 | 180+ serializers, 188 FormModals |
| Tech debt management | 6/10 | 158 TODOs bien documentados |
| Large files | 5/10 | 20 archivos >500 líneas |
| Dependency security | 5/10 | 21 npm vulns, CI non-blocking |
| **GLOBAL FASE 5** | **5.5/10** | **Cobertura crítica, CI incompleto** |

---

## Recomendaciones Priorizadas

| Prioridad | Acción | Esfuerzo | Impacto |
|-----------|--------|----------|---------|
| P0-1 | Agregar vitest al CI pipeline | 10 min | Tests frontend verificados |
| P0-2 | Fix 26 tests frontend failing | 2 horas | Suite verde |
| P0-3 | Agregar `--cov-fail-under 10` a pytest (subir progresivamente) | 5 min | Coverage gate |
| P0-4 | Fix multi-tenant filtering en medicina_laboral (4 views) | 1 hora | Seguridad |
| P1-1 | Configurar pytest para ignorar módulos comentados | 15 min | CI limpio |
| P1-2 | Hacer pip-audit/npm audit blocking en CI | 5 min | Supply chain |
| P1-3 | Agregar `manage.py check --deploy` al CI | 5 min | Prod safety |
| P1-4 | Backend pre-commit hook (Black + Ruff) | 10 min | Dev quality |
| P2-1 | Escribir tests para core (users, auth, RBAC) — target 40% | 2 semanas | Coverage core |
| P2-2 | Refactorizar MedicinaLaboralPage (1,489 líneas) | 1 día | Mantenibilidad |
| P2-3 | Crear DynamicListSerializer factory | 1 día | DRY 180+ serializers |
| P2-4 | Crear FormModal hook factory | 1 día | DRY 188 modals |
| P3-1 | Configurar Dependabot | 5 min | Auto-updates |
| P3-2 | Agregar Prettier al CI | 5 min | Formatting |
| P3-3 | Bundle size limits en vite build | 15 min | Performance |

---

## Comparativa con Fases Anteriores

| Aspecto | F1 (7.0) | F2 (7.5) | F3 (7.0) | F4 (6.0) | F5 (5.5) |
|---------|----------|----------|----------|----------|----------|
| Lo mejor | Cascada correcta | 0 código muerto | Type safety 10/10 | Infra security 10/10 | Naming 10/10 |
| Lo peor | SectionGuard 5% | juego_sst sin migraciones | ProtectedAction 0% | RBAC 2/10 | **Coverage 8%** |
| Tendencia | — | Mejora | Estable | Baja | **La más baja** |

**Patrón:** La plataforma tiene **excelente estructura y organización** pero **testing críticamente bajo**. La calidad del código es alta (naming, linting, types) pero la confianza en el código es baja por falta de tests.

---

*Reporte generado por 2 agentes especializados + pytest real + vitest real ejecutados.*
*Metodología: CVEA + SonarQube-grade analysis*
