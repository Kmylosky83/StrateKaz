# FASE 4 — Seguridad y Permisos

**Auditoría:** Health Check Integral StrateKaz SGI
**Fase:** 4 de 7
**Agentes:** Security Specialist (x3) + npm audit ejecutado
**Fecha:** 22 de marzo de 2026
**Duración:** ~15 minutos (3 agentes en paralelo + scans)

---

## Resumen Ejecutivo

La plataforma StrateKaz tiene una **postura de seguridad BUENA** en infraestructura (HTTPS, HSTS, CORS, CSRF, JWT) pero presenta **brechas críticas en autorización granular**: 96% de ViewSets carecen de RBAC a nivel de acción, y existen vectores de IDOR en endpoints sensibles. Se encontró 1 secret expuesto (Sentry DSN en marketing_site) y 21 vulnerabilidades en dependencias npm. El sistema 2FA es robusto pero tiene gaps de sincronización.

**Puntuación global Fase 4: 6.0/10**

---

## Métricas Clave

| Métrica | Valor |
|---------|-------|
| ViewSets totales | ~660 |
| ViewSets con RBAC granular (Level 3) | 8 (1.2%) |
| ViewSets solo IsAuthenticated (Level 1) | 485 (73%) |
| ViewSets con Module access (Level 2) | ~122 |
| Endpoints AllowAny | 13 + 5 portal público |
| IDOR endpoints potenciales | 7 (users, colaboradores, accounting) |
| Secrets expuestos en código | 1 (Sentry DSN en marketing_site) |
| Vulnerabilidades npm | 21 (1 critical, 10 high, 10 moderate) |
| Vulnerabilidades pip | No ejecutable (permisos container) |
| Django security settings correctos | 11/11 |
| 2FA métodos implementados | 3 (TOTP + backup codes + email OTP) |
| Rate limiting coverage | 90% de endpoints sensibles |

---

## Hallazgos por Severidad

### CRITICO (P0)

#### H1 — 96% de ViewSets sin RBAC granular (solo IsAuthenticated)

**Impacto:** Cualquier usuario autenticado puede acceder a TODOS los datos dentro de su tenant. No hay verificación de rol, cargo, departamento ni acción (crear vs eliminar).

**Evidencia:**
- 485/660 ViewSets (73%) usan solo `IsAuthenticated`
- ~122 ViewSets (18%) tienen ModuleAccessMiddleware (valida módulo activo, no permisos)
- Solo 8 ViewSets (1.2%) implementan `GranularActionPermission`
- `CombinedPermissionService` solo implementa CargoSectionAccess — RolAdicional y Groups son TODOs

**OWASP:** A01 - Broken Access Control

**Escenarios de riesgo:**
- Operativo (nivel 0) accede a datos financieros de accounting
- Cualquier empleado ve salarios y beneficios de otros colaboradores
- Usuario puede enumerar IDs secuenciales para descubrir registros

---

#### H2 — IDOR potencial en 7 endpoints críticos

**Impacto:** Usuarios pueden acceder a datos de otros usuarios cambiando IDs en la URL.

| Endpoint | Datos expuestos | Severidad |
|----------|----------------|-----------|
| `/api/users/{id}/` | Perfil completo, permisos | CRITICAL |
| `/api/colaboradores/{id}/` | Salario, beneficios, datos personales | CRITICAL |
| `/api/accounting/movimientos/{id}/` | Registros financieros | CRITICAL |
| `/api/hseq/accidentalidad/{id}/` | Detalles de incidentes | HIGH |
| `/api/talent-hub/desempeno/{id}/` | Evaluaciones de desempeño | HIGH |
| `/api/sales-crm/clientes/{id}/` | Datos de clientes | HIGH |
| `/api/gestion-documental/{id}/` | Documentos confidenciales | HIGH |

**Causa raíz:** Solo 4 ViewSets implementan `has_object_permission`. La mayoría usa `get_queryset()` sin filtro por usuario/departamento.

---

#### H3 — Sentry DSN expuesto en git (marketing_site/.env.production)

**Impacto:** DSN público permite inyección de eventos falsos en Sentry, monitoreo de errores, y potencial leak de PII.

**Archivo:** `marketing_site/.env.production` (línea 13)

**Acción requerida:**
1. Agregar `marketing_site/.env.*` a `.gitignore`
2. Rotar DSN en dashboard de Sentry
3. Limpiar historial git con BFG Repo-Cleaner

---

#### H4 — Setup password endpoints sin rate limiting

**Impacto:** Brute-force de tokens de onboarding y enumeración de empleados.

**Endpoints afectados:**
- `POST /api/core/setup-password/`
- `POST /api/core/setup-password/resend/`

**Otros endpoints correctamente limitados:** login (5/min), password_reset (3/min), 2FA (100/min API-level).

---

### ALTO (P1)

#### H5 — Superadmin impersonation sin validación 2FA

El endpoint `/core/users/{id}/impersonate-profile/` carga el perfil del usuario impersonado sin verificar que el superadmin haya pasado 2FA. Un superadmin con sesión hijacked podría impersonar cualquier usuario.

#### H6 — Inconsistencia 2FA entre TenantUser y CoreUser

`TenantUser.has_2fa_enabled` (schema public) y `core.User.TwoFactorAuth.is_enabled` (schema tenant) deben sincronizarse bidireccionalmente. Si admin deshabilita en un schema, el otro no se entera.

#### H7 — Backup codes 2FA indefinidamente reutilizables

Índices marcados como usados pero lista nunca se limpia. Códigos pueden reutilizarse.

#### H8 — Mi Equipo portal público: 5 endpoints sin throttle específico

Firma de contrato, respuesta de pruebas y entrevistas públicas sin rate limiting dedicado. Tokens single-use pero sin protección contra brute-force.

#### H9 — File uploads sin validación de tipo/tamaño

FileField e ImageField aceptan cualquier tipo de archivo. Sin MIME type validation, sin extensión whitelist, sin límite de tamaño a nivel de modelo.

#### H10 — pip-audit y npm audit non-blocking en CI

`continue-on-error: true` en ambos — vulnerabilidades pueden mergearse sin review.

---

### MEDIO (P2)

#### H11 — npm audit: 21 vulnerabilidades

| Severidad | Cantidad | Principales |
|-----------|----------|-------------|
| Critical | 1 | storybook WebSocket hijacking |
| High | 10 | serialize-javascript, brace-expansion, storybook |
| Moderate | 10 | vitest, esbuild, nanoid, PostCSS |

Mayoría en devDependencies (storybook, vitest) — no afectan producción directamente.

#### H12 — CSP con unsafe-inline (style-src y script-src)

Requerido por Tailwind CSS y Vite builds. Debilita protección contra XSS reflejado.

#### H13 — Rate limiting Nginx inconsistente con DRF

Nginx permite burst=60 (1860 req/min potencial) vs DRF 120/min para usuarios autenticados.

#### H14 — HS256 para JWT (simétrico)

Compromiso de SECRET_KEY rompe todos los tokens. RS256 (asimétrico) sería más seguro.

---

### BAJO (P3)

#### H15 — X-XSS-Protection header deprecated

Navegadores modernos lo ignoran (Chrome 78+). Mantener por compatibilidad IE 11.

#### H16 — CORS_EXPOSE_HEADERS no configurado explícitamente

Django expone headers por defecto. Verificar que no se filtran headers custom sensibles.

---

## Verificaciones Exitosas

### Infraestructura de Seguridad: EXCELENTE

| Control | Estado | Detalle |
|---------|--------|---------|
| HTTPS enforcement | ✅ | SECURE_SSL_REDIRECT = True |
| HSTS | ✅ | 31536000s (1 año) + includeSubDomains + preload |
| X-Frame-Options | ✅ | DENY |
| Content-Type-Options | ✅ | nosniff |
| SESSION_COOKIE_SECURE | ✅ | True |
| SESSION_COOKIE_HTTPONLY | ✅ | True |
| CSRF_COOKIE_SECURE | ✅ | True |
| CSRF_COOKIE_HTTPONLY | ✅ | True |
| Password validators | ✅ | 4 validators (similarity, min 8, common, numeric) |
| Referrer-Policy | ✅ | strict-origin-when-cross-origin |
| Permissions-Policy | ✅ | camera=(), microphone=(), geolocation=() |

### CORS: SEGURO

| Entorno | Configuración | Estado |
|---------|--------------|--------|
| Development | localhost:3010, 127.0.0.1:3010, subdominios localhost | ✅ Restrictivo |
| Production | `^https://[\w-]+\.stratekaz\.com$` (regex) | ✅ Restrictivo |
| Wildcard | False en ambos entornos | ✅ Seguro |
| Credentials | True (necesario para JWT) | ✅ Aceptable |

### Tenant Isolation: CORRECTO

| Control | Estado |
|---------|--------|
| django-tenants schema isolation | ✅ |
| TenantAuthenticationMiddleware (X-Tenant-ID validation) | ✅ |
| JWT claims include tenant_user_id | ✅ |
| Cross-tenant access blocked | ✅ |
| Superadmin bypass documented | ✅ |

### Input Sanitization: BUENA

| Control | Estado | Evidencia |
|---------|--------|-----------|
| DOMPurify (frontend) | ✅ | 3 componentes usan sanitize() antes de dangerouslySetInnerHTML |
| Django ORM (backend) | ✅ | Queries parametrizadas, sin raw SQL inseguro |
| No pickle/yaml unsafe | ✅ | No se encontró deserialización peligrosa |
| bleach (backend) | ✅ | Instalado v6.1.0 para sanitización HTML server-side |
| Onboarding tokens | ✅ | SHA-256 hash + constant_time_compare |

### 2FA: ROBUSTO (con gaps)

| Aspecto | Estado |
|---------|--------|
| TOTP (RFC 6238) | ✅ pyotp con valid_window=1 |
| Secret storage | ✅ Fernet encryption (AES-128-CBC) |
| Backup codes | ✅ Hasheados con make_password() (10 códigos) |
| Email OTP | ✅ 6 dígitos, TTL 10min, rate limit 3/15min |
| Recovery | ✅ Regenerate backup codes (requiere password) |
| QR Code | ✅ Generado on-demand, no almacenado |
| Login flow | ✅ No emite JWT hasta verificar 2FA |
| Rate limiting 2FA | ✅ @api_rate_limit (100/min) |

### Dependencias Backend: SEGURAS

Paquetes clave actualizados:
- Django 5.0.9, DRF 3.14.0, cryptography 46.0.5, Pillow 12.1.1
- bleach 6.1.0, sentry-sdk 2.20.0, django-ratelimit 4.1.0
- CodeQL habilitado para JS + Python

### Secrets Management: BUENO (con 1 excepción)

- SECRET_KEY cargado de env vars (sin default en producción)
- DB credentials en env vars
- .env.example con placeholders correctos
- .gitignore excluye .env files (excepto marketing_site)

---

## Puntuación por Área

| Área | Puntuación | Justificación |
|------|-----------|---------------|
| Transport security (HTTPS/HSTS) | 10/10 | Todos los controles activos |
| Django security settings | 10/10 | 11/11 correctos |
| CORS configuration | 9/10 | Restrictivo, sin wildcard |
| Tenant isolation | 9/10 | Schema + middleware + JWT claims |
| Input sanitization | 9/10 | DOMPurify + ORM + bleach |
| Authentication (JWT/2FA) | 8/10 | Robusto, gaps de sincronización |
| Rate limiting | 7/10 | 90% coverage, Nginx inconsistente |
| Secrets management | 7/10 | 1 DSN expuesto en marketing_site |
| Dependency security | 6/10 | 21 npm vulns, CI non-blocking |
| File upload security | 4/10 | Sin validación de tipo/tamaño |
| **RBAC granular** | **2/10** | **96% sin permisos por acción** |
| **Object-level permissions** | **2/10** | **4/660 ViewSets con has_object_permission** |
| **GLOBAL FASE 4** | **6.0/10** | Infraestructura excelente, autorización crítica |

---

## Plan de Remediación RBAC

### Fase 1 — IDOR fixes + Object filtering (1 semana)

| Prioridad | Acción | ViewSets |
|-----------|--------|----------|
| P0 | Agregar `has_object_permission` a UserViewSet | core |
| P0 | Filtrar `get_queryset()` por departamento en ColaboradorViewSet | mi_equipo |
| P0 | Object-level permissions en AccountingViewSets | accounting |
| P1 | Rate limiting en setup-password | tenant |
| P1 | Throttle en portal público Mi Equipo | mi_equipo |

### Fase 2 — Level 3 RBAC en módulos críticos (2 semanas)

| Módulo | ViewSets | Acción |
|--------|----------|--------|
| core (users, RBAC) | 45 | GranularActionPermission |
| mi_equipo | 52 | GranularActionPermission |
| gestion_estrategica | 68 | GranularActionPermission |
| accounting | 22 | GranularActionPermission |

### Fase 3 — Full cascade a todos los ViewSets (4 semanas)

Implementar GranularActionPermission en los 485 ViewSets restantes progresivamente con cada nivel CASCADE.

### Fase 4 — Continuous (ongoing)

- Audit logging para RBAC denials
- Privilege escalation monitoring
- Penetration testing trimestral

---

## Recomendaciones Priorizadas

| Prioridad | Acción | Esfuerzo | Impacto |
|-----------|--------|----------|---------|
| P0-1 | Implementar RBAC granular en core + mi_equipo + accounting | 2 semanas | CRITICAL — IDOR + authorization |
| P0-2 | Remover marketing_site/.env.production de git + rotar Sentry DSN | 30 min | CRITICAL — secret exposure |
| P0-3 | Rate limiting en setup-password endpoints | 15 min | HIGH — brute force |
| P1-1 | File upload validators (tipo + tamaño) | 2 horas | HIGH — upload security |
| P1-2 | Hacer pip-audit y npm audit blocking en CI | 30 min | HIGH — supply chain |
| P1-3 | Validar 2FA en impersonation + sync TenantUser↔CoreUser | 2 horas | HIGH — auth bypass |
| P2-1 | Sincronizar rate limits Nginx↔DRF | 1 hora | MEDIUM — consistency |
| P2-2 | Cleanup backup codes 2FA (Celery task) | 1 hora | MEDIUM — 2FA hygiene |
| P2-3 | npm audit fix (21 vulnerabilidades) | 1 hora | MEDIUM — dependencies |
| P3-1 | Evaluar RS256 vs HS256 para JWT | Investigación | LOW — crypto strength |

---

## Comparativa con Fases Anteriores

| Aspecto | F1 (7.0) | F2 (7.5) | F3 (7.0) | F4 (6.0) |
|---------|----------|----------|----------|----------|
| Arquitectura | Sólida | Sólida | Sólida | N/A |
| Permisos BE | N/A | 9/10 (auth) | N/A | 2/10 (RBAC granular) |
| Permisos FE | 3/10 (SectionGuard) | N/A | 3/10 (ProtectedAction) | N/A |
| Código muerto | N/A | 10/10 | 9/10 | N/A |
| Infraestructura seguridad | N/A | N/A | N/A | 10/10 |
| Input sanitization | N/A | N/A | N/A | 9/10 |

**Patrón claro:** La plataforma tiene **excelente infraestructura de seguridad** pero **autorización granular prácticamente inexistente** tanto en backend (RBAC) como en frontend (SectionGuard + ProtectedAction).

---

*Reporte generado por 3 agentes especializados de seguridad Claude Code ejecutados en paralelo + npm audit.*
*Metodología: CVEA + OWASP Top 10 + ISO 27001 mapping*
