# PLAN DE CIERRE DE BRECHAS - StrateKaz

**Fecha:** 15 de enero de 2026
**Versión:** 1.1
**Consolidación de:** 7 Auditorías Técnicas

---

## CONTEXTO DE ARQUITECTURA

### Modelo de Deployment Actual: MULTI-INSTANCIA

```
┌─────────────────────────────────────────────────────────────────┐
│                    ARQUITECTURA ACTUAL                          │
│                      (20 empresas)                              │
└─────────────────────────────────────────────────────────────────┘

Empresa A ──▶ [Instancia A] ──▶ [DB A] ──▶ stratekaz-empresaA.com
Empresa B ──▶ [Instancia B] ──▶ [DB B] ──▶ stratekaz-empresaB.com
Empresa C ──▶ [Instancia C] ──▶ [DB C] ──▶ stratekaz-empresaC.com
...
Empresa N ──▶ [Instancia N] ──▶ [DB N] ──▶ stratekaz-empresaN.com
```

**Características:**
- Una instalación Django separada por cliente
- Base de datos independiente por empresa
- Dominio/subdominio único por instancia
- **NO hay riesgo de filtración de datos entre empresas**
- Escalamiento horizontal (más instancias)

### Modelo Futuro: MULTI-TENANT (Preparación)

```
┌─────────────────────────────────────────────────────────────────┐
│                    ARQUITECTURA FUTURA                          │
│                    (Post migración)                             │
└─────────────────────────────────────────────────────────────────┘

Empresa A ─┐
Empresa B ─┼──▶ [Instancia Única] ──▶ [DB Compartida] ──▶ stratekaz.com
Empresa C ─┤         │
...        │         ▼
Empresa N ─┘    Filtrado por empresa_id en TODAS las queries
```

**El código incluye `BaseCompanyModel` y campo `empresa` en algunos modelos como preparación para esta migración futura.**

### Implicaciones para el Plan

| Hallazgo | Impacto Multi-Instancia | Impacto Multi-Tenant |
|----------|-------------------------|----------------------|
| 58.5% modelos sin campo `empresa` | ✅ NO CRÍTICO (datos aislados por DB) | 🔴 CRÍTICO (filtración de datos) |
| User sin campo `empresa` | ✅ NO CRÍTICO (usuarios de esa empresa) | 🔴 CRÍTICO (auth rota) |
| Endpoints sin validación tenant | ✅ NO CRÍTICO (instancia aislada) | 🔴 CRÍTICO (acceso cruzado) |

**Conclusión:** Los hallazgos P0-07 y P0-08 sobre multi-tenancy se **reclasifican de P0 a P2** para el modelo actual de multi-instancia. Son preparación para el futuro, no bloqueantes para Go-Live.

---

## ESTRATEGIA MVP: DEPLOYMENT MODULAR PROGRESIVO

### Filosofía: Sistema Dinámico

StrateKaz está diseñado como un **sistema dinámico** donde:
- ✅ Normas ISO se administran desde BD (no hardcodeadas)
- ✅ RBAC configurable por Cargo sin deploy
- ✅ Estructura organizacional auto-referencial
- ✅ Catálogos configurables en runtime
- ✅ Módulos independientes que se habilitan progresivamente

**Esto permite ir a producción con un MVP e ir agregando módulos.**

### MVP Definido: Dirección Estratégica

| Tab | Módulo Backend | Funcionalidad |
|-----|----------------|---------------|
| **Configuración** | `configuracion` | EmpresaConfig, Sedes, Normas ISO, Integraciones |
| **Organización** | `organizacion` | Áreas, Organigrama, Jerarquías |
| **Identidad** | `identidad` | Misión, Visión, Valores, Políticas, Alcances |

### Dependencias del MVP

```
┌─────────────────────────────────────────────────────────────────┐
│                         MVP CORE                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
    ┌─────────────────────────┼─────────────────────────┐
    │                         │                         │
    ▼                         ▼                         ▼
┌─────────┐            ┌─────────────┐           ┌──────────┐
│  CORE   │◄───────────│CONFIGURACIÓN│───────────►│IDENTIDAD │
│ (Base)  │            │  (Empresa)  │           │(Políticas)│
└────┬────┘            └──────┬──────┘           └─────┬────┘
     │                        │                        │
     │    ┌───────────────────┘                        │
     │    │                                            │
     ▼    ▼                                            │
┌─────────────┐                                        │
│ORGANIZACIÓN │◄───────────────────────────────────────┘
│   (Áreas)   │
└─────────────┘

Orden de inicialización:
1. CORE (User, Cargo, RBAC)
2. CONFIGURACIÓN (EmpresaConfig singleton, NormasISO)
3. ORGANIZACIÓN (Áreas jerárquicas)
4. IDENTIDAD (Vinculado a Empresa)
```

### Bloqueantes P0 para MVP

| ID | Vulnerabilidad | Afecta MVP | Acción |
|----|----------------|------------|--------|
| P0-01 | Credenciales en Git | ✅ SÍ | Remover + rotar |
| P0-02 | SECRET_KEY inseguro | ✅ SÍ | Validar requerido |
| P0-03 | Sin endpoint logout | ✅ SÍ | Implementar |
| P0-04 | JWT payload sensible | ✅ SÍ | Reducir datos |
| P0-05 | Endpoints sin RBAC | ⚠️ Parcial | Solo MVP endpoints |
| P0-06 | DEBUG=True | ✅ SÍ | Cambiar default |
| P0-07 | core/models.py grande | ❌ NO | Diferir |
| P0-08 | Bare except | ❌ NO | Diferir |
| P0-09 | try-except silenciosos | ❌ NO | Diferir |
| P0-10 | Sin logging crítico | ⚠️ Parcial | Solo auth |

**P0 Mínimo para MVP: ~20 horas** (P0-01 a P0-06 + logging auth)

### Roadmap de Deployment Modular

```
SEMANA 1: PREPARACIÓN
├── Día 1-2: P0-01, P0-02, P0-06 (Seguridad base)
├── Día 3-4: P0-03, P0-04 (Auth seguro)
└── Día 5: P1-19, P1-20 (Scripts deployment)

SEMANA 2: MVP PRODUCCIÓN
├── Día 1: Deploy instancia piloto
├── Día 2: Seed data (EmpresaConfig, NormasISO)
├── Día 3: Configurar RBAC para roles iniciales
├── Día 4-5: Testing con usuario piloto
└── ✅ GO-LIVE MVP: Configuración + Organización + Identidad

SEMANA 3-4: ESTABILIZACIÓN
├── Monitoreo y corrección de bugs
├── Feedback de usuarios
└── Ajustes de permisos RBAC

SEMANA 5+: MÓDULOS ADICIONALES
├── Planeación Estratégica
├── Gestión de Proyectos
├── Revisión por Dirección
└── ... (según demanda)
```

### Checklist MVP Go-Live

#### Seguridad (OBLIGATORIO - 20h) ✅ COMPLETADO 2026-01-15

- [x] P0-01: Credenciales removidas de Git (verificado - no hay exposición)
- [x] P0-02: SECRET_KEY validado como requerido (settings.py sin default)
- [x] P0-03: Endpoint logout implementado (/api/auth/logout/ con blacklist)
- [x] P0-04: Payload JWT reducido (solo user_id + is_superuser)
- [x] P0-06: DEBUG=False por defecto (settings.py default=False)
- [x] Logging de login/logout (security logger en logout_view)

#### Infraestructura (OBLIGATORIO - 8h)

- [x] Script create-instance.sh funcional (deploy/cpanel/create-instance.sh)
- [x] Template .env.production configurado (deploy/cpanel/.env.production.template)
- [ ] SSL/HTTPS habilitado (cPanel AutoSSL) - Por instancia
- [ ] Health check respondiendo (/api/health/) - Por instancia

#### Datos Iniciales (OBLIGATORIO - 2h)

> **NOTA**: Los datos de empresa se configuran desde la UI (Tab Configuración > Branding).
> El seed solo incluye datos base de la plataforma StrateKaz, no de cada cliente.

- [x] Seed de estructura de menú (seed_estructura_final.py)
- [x] Seed de NormasISO base (seed_config_identidad.py)
- [ ] Usuario superadmin creado (createsuperuser)
- [ ] Cargo "Administrador" con permisos full (configurable en UI)

#### Funcionalidad MVP (VALIDAR - 8h)

- [ ] Tab Configuración: Branding empresa, sedes, integraciones
- [ ] Tab Organización: CRUD áreas, organigrama jerárquico
- [ ] Tab Identidad: Misión, visión, valores, políticas con workflow
- [ ] RBAC funcionando (permisos por Cargo)
- [ ] Exportación PDF/DOCX de políticas

**Total MVP Go-Live: ~40 horas (1 semana)**

### Criterios de Notificación Go-Live

**El sistema está LISTO PARA PRODUCCIÓN cuando:**

#### Criterios Mandatorios (100% requeridos)

| # | Criterio | Verificación | Comando/URL |
|---|----------|--------------|-------------|
| 1 | Todos los P0 de seguridad cerrados | Checklist arriba completo | Manual |
| 2 | Health check responde 200 | `curl https://DOMINIO/api/health/` | HTTP 200 |
| 3 | Login/Logout funcionando | Test manual con admin | UI |
| 4 | HTTPS habilitado y forzado | Sin warnings de SSL | Browser |
| 5 | .env sin credenciales hardcodeadas | `grep -r "password=" .env` vacío | Bash |
| 6 | DEBUG=False en producción | `.env` verificado | Manual |
| 7 | SECRET_KEY único por instancia | Diferente a development | `.env` |
| 8 | Backup de BD configurado | cPanel backup schedule | cPanel |

#### Criterios de Calidad (80% requeridos)

| # | Criterio | Verificación | Aceptable |
|---|----------|--------------|-----------|
| 1 | Tiempo de respuesta API | `curl -w "%{time_total}"` | < 2 segundos |
| 2 | Sin errores 500 en logs | `tail -100 logs/django.log` | 0 errores |
| 3 | Migrations aplicadas | `python manage.py showmigrations` | Sin pendientes |
| 4 | Datos seed cargados | EmpresaConfig existe | Query BD |
| 5 | RBAC configurado | Admin tiene permisos | UI |

#### Script de Validación Pre-Go-Live

```bash
#!/bin/bash
# Ejecutar desde APP_ROOT/backend

echo "=== VALIDACIÓN PRE-GO-LIVE ==="

# 1. Health check
echo -n "Health check... "
HTTP=$(curl -s -o /dev/null -w "%{http_code}" https://$DOMINIO/api/health/)
[ "$HTTP" = "200" ] && echo "✅ OK" || echo "❌ FALLO ($HTTP)"

# 2. DEBUG=False
echo -n "DEBUG=False... "
grep -q "DEBUG=False" .env && echo "✅ OK" || echo "❌ FALLO"

# 3. Migraciones
echo -n "Migraciones... "
PENDING=$(python manage.py showmigrations --plan | grep "\[ \]" | wc -l)
[ "$PENDING" = "0" ] && echo "✅ OK" || echo "❌ $PENDING pendientes"

# 4. EmpresaConfig
echo -n "EmpresaConfig... "
python manage.py shell -c "from apps.gestion_estrategica.configuracion.models import EmpresaConfig; print('✅ OK' if EmpresaConfig.objects.exists() else '❌ FALLO')"

# 5. Admin existe
echo -n "Admin user... "
python manage.py shell -c "from django.contrib.auth import get_user_model; User = get_user_model(); print('✅ OK' if User.objects.filter(is_superuser=True).exists() else '❌ FALLO')"

echo "=== FIN VALIDACIÓN ==="
```

#### Proceso de Notificación

1. **Ejecutar script de validación** en la instancia
2. **Verificar todos los ✅** (criterios mandatorios)
3. **Documentar cualquier ❌** con plan de remediación
4. **Notificar al equipo** con:
   - URL de producción
   - Credenciales admin (via canal seguro)
   - Estado de cada criterio
   - Fecha de Go-Live efectiva

### Módulos Post-MVP (Habilitación Progresiva)

| Módulo | Dependencia | Esfuerzo | Prioridad |
|--------|-------------|----------|-----------|
| Planeación | MVP + Identidad | 8h | Alta |
| Gestión Proyectos | MVP + Áreas | 16h | Media |
| Revisión Dirección | MVP + Planeación | 8h | Media |
| Contexto (DOFA) | MVP | 8h | Alta |
| Motor Cumplimiento | MVP + Normas | 24h | Alta |
| HSEQ | MVP + Cumplimiento | 40h | Media |
| Talent Hub | MVP + Organización | 40h | Baja |

**Cada módulo se habilita cuando:**
1. Sus dependencias están en producción
2. Se validan permisos RBAC
3. Se hace seed de catálogos necesarios
4. Se prueba con usuarios piloto

---

## RESUMEN EJECUTIVO

### Puntuación Global por Área

| # | Área | Puntuación | Estado |
|---|------|------------|--------|
| 1 | Backend Architecture | 8.5/10 | ✅ Bueno |
| 2 | Data Architecture | 7.0/10 | ⚠️ Gaps críticos |
| 3 | Frontend Architecture | 7.5/10 | ⚠️ Refactorización necesaria |
| 4 | Code Quality | 7.0/10 | ⚠️ Deuda técnica |
| 5 | Security & Permissions | 7.5/10 | ⚠️ Vulnerabilidades |
| 6 | DevOps/Deployment | 8.7/10 | ✅ Bueno |
| 7 | Testing | 6.9/10 | ⚠️ Cobertura baja |

**Puntuación Global: 7.6/10** - Proyecto sólido con brechas remediables

### Resumen de Hallazgos

| Severidad | Cantidad | Ejemplos |
|-----------|----------|----------|
| 🔴 **CRÍTICOS** | 10 | Credenciales expuestas, sin logout, endpoints sin RBAC |
| 🟠 **ALTOS** | 18 | Componentes >1000 líneas, 0 tests E2E, archivos gigantes |
| 🟡 **MEDIOS** | 27 | Multi-tenancy (futuro), duplicación código, tests faltantes |
| 🟢 **BAJOS** | 15 | TODO pendientes, nombres genéricos, mejoras menores |

---

## MATRIZ DE VULNERABILIDADES CONSOLIDADA

### P0 - CRÍTICO (Bloquea Go-Live)

| ID | Área | Vulnerabilidad | Impacto | Esfuerzo |
|----|------|----------------|---------|----------|
| P0-01 | Security | **Credenciales en .env rastreados en Git** | 6 archivos con contraseñas expuestas | 2h |
| P0-02 | Security | **SECRET_KEY con default inseguro** | Tokens pueden ser forjados | 1h |
| P0-03 | Security | **Sin endpoint logout** | Usuario no puede revocar tokens | 4h |
| P0-04 | Security | **Información sensible en JWT payload** | Datos personales legibles en base64 | 4h |
| P0-05 | Security | **Endpoints sin validación RBAC** | Analytics, HSEQ, Supply Chain expuestos | 8h |
| P0-06 | DevOps | **DEBUG=True por defecto** | Exposición de información en prod | 1h |
| P0-07 | Backend | **core/models.py con 3,245 líneas** | Mantenibilidad crítica | 16h |
| P0-08 | Backend | **6 bare except clauses** | Errores ocultos | 2h |
| P0-09 | Code | **try-except silenciosos (19 bloques)** | Fallos ocultos | 4h |
| P0-10 | Code | **Sin logging de operaciones críticas** | Auditoría nula | 8h |

**Esfuerzo Total P0: ~50 horas (~6 días)**

> **Nota:** Los hallazgos de multi-tenancy (anteriormente P0-07/P0-08) fueron reclasificados a P2 porque en el modelo actual de **multi-instancia** cada empresa tiene su propia base de datos aislada, eliminando el riesgo de filtración de datos.

---

### P1 - ALTO (Resolver antes de Semana 26)

| ID | Área | Vulnerabilidad | Impacto | Esfuerzo |
|----|------|----------------|---------|----------|
| P1-01 | Frontend | **9 componentes >1000 líneas (HSEQ)** | Mantenibilidad crítica | 24h |
| P1-02 | Frontend | **useStrategic.ts 1,064 líneas** | Necesita split | 8h |
| P1-03 | Frontend | **4 conjuntos componentes duplicados** | Migración supply-chain incompleta | 16h |
| P1-04 | Testing | **Talent Hub sin tests (12 módulos)** | Regresiones no detectadas | 24h |
| P1-05 | Testing | **Accounting sin tests (4 módulos)** | Transacciones sin validar | 16h |
| P1-06 | Testing | **Frontend 11% cobertura** | Regresiones frecuentes | 32h |
| P1-07 | Testing | **Factory Boy no implementado** | Tests verbosos | 8h |
| P1-08 | Testing | **Sin tests E2E** | Flujos críticos sin validar | 24h |
| P1-09 | Security | **Sin MFA/2FA** | Solo username+password | 16h |
| P1-10 | Security | **CSRF_COOKIE_HTTPONLY=False** | XSS puede leer CSRF | 1h |
| P1-11 | Security | **Sin límite sesiones concurrentes** | N tokens activos | 8h |
| P1-12 | Data | **15+ patrones N+1 detectados** | Performance degradada | 16h |
| P1-13 | Data | **Índices faltantes en modelos críticos** | Queries lentas | 8h |
| P1-14 | DevOps | **Sin logging de login fallido** | Sin detección de ataques | 4h |
| P1-15 | DevOps | **CONN_MAX_AGE no configurado** | Sin connection pooling | 1h |
| P1-16 | Code | **147 TODO/FIXME pendientes** | Deuda técnica | 24h |
| P1-17 | Code | **~1,500 líneas código duplicado** | Mantenibilidad | 16h |
| P1-18 | Code | **Sin sistema i18n** | Internacionalización bloqueada | 40h |
| P1-19 | DevOps | **Sin scripts de deployment multi-instancia** | Provisioning manual de nuevas empresas | 16h |
| P1-20 | DevOps | **Sin templates de configuración por instancia** | Configuración inconsistente entre instancias | 8h |

**Esfuerzo Total P1: ~310 horas (~39 días)**

---

### P2 - MEDIO (Resolver en próximos 90 días)

| ID | Área | Vulnerabilidad | Impacto | Esfuerzo |
|----|------|----------------|---------|----------|
| P2-01 | Data | **58.5% modelos sin campo empresa** | Preparación multi-tenant futuro | 40h |
| P2-02 | Data | **User model sin campo empresa** | Preparación multi-tenant futuro | 8h |
| P2-03 | Security | **Algoritmo HS256 (simétrico)** | Menos seguro para distribuido | 8h |
| P2-04 | Security | **Políticas contraseña básicas** | Sin mayúsculas/especiales requeridos | 4h |
| P2-05 | Security | **Rate limit solo por IP** | Ataques distribuidos evaden | 8h |
| P2-06 | Security | **Sin validación MIME archivos** | Upload malicioso posible | 8h |
| P2-07 | Security | **Campos TextField sin max_length** | DoS almacenamiento | 8h |
| P2-08 | Frontend | **50+ tipos `any` en TypeScript** | Type safety degradada | 16h |
| P2-09 | Frontend | **24+ TODO pendientes** | Deuda técnica | 12h |
| P2-10 | Frontend | **Mock data en código producción** | Datos falsos expuestos | 4h |
| P2-11 | Backend | **20+ archivos >500 líneas** | Refactorización necesaria | 40h |
| P2-12 | Backend | **64 TODO/FIXME en backend** | Deuda técnica | 16h |
| P2-13 | Data | **Catálogos sin versionado** | Cambios destructivos | 16h |
| P2-14 | Testing | **Fixtures compartidas mutables** | Tests no aislados | 8h |
| P2-15 | Testing | **Tests de concurrencia flaky** | Resultados inconsistentes | 8h |
| P2-16 | Testing | **HSEQ restante sin tests (10 módulos)** | Cobertura incompleta | 40h |
| P2-17 | DevOps | **RATELIMIT_ENABLE sin documentar** | Confusión configuración | 1h |

**Esfuerzo Total P2: ~245 horas (~31 días)**

> **P2-01 y P2-02 (Multi-tenancy):** Estos hallazgos son para preparación de migración futura a multi-tenant. En el modelo actual de multi-instancia NO son críticos porque cada empresa opera en su propia base de datos aislada.

---

### P3 - BAJO (Mejoras opcionales)

| ID | Área | Vulnerabilidad | Impacto | Esfuerzo |
|----|------|----------------|---------|----------|
| P3-01 | Security | **Sin histórico de contraseñas** | Reutilización permitida | 8h |
| P3-02 | Security | **UPDATE_LAST_LOGIN overhead** | Escritura extra en DB | 1h |
| P3-03 | Frontend | **Storybook sin tests** | Visual regression no detectada | 16h |
| P3-04 | Backend | **Soft dependency circular** | Ya mitigada con lazy imports | 0h |
| P3-05 | Data | **118 migraciones (aceptable)** | No requiere squash aún | 0h |
| P3-06 | Testing | **Nombres tests genéricos** | Debugging más difícil | 8h |
| P3-07 | Testing | **Assertions sin contexto** | Debug difícil | 4h |
| P3-08 | Code | **Comentarios desactualizados** | Confusión | 8h |

**Esfuerzo Total P3: ~45 horas (~6 días)**

---

## ROADMAP DE REMEDIACIÓN

### Fase 1: Pre Go-Live (Semanas 1-2)

**Objetivo:** Eliminar vulnerabilidades críticas de seguridad

| Día | Tareas | Horas | Responsable |
|-----|--------|-------|-------------|
| 1-2 | P0-01: Remover credenciales de Git + rotar contraseñas | 4h | DevOps |
| 1-2 | P0-02: Validar SECRET_KEY requerido sin default | 1h | Backend |
| 1-2 | P0-06: Cambiar DEBUG default a False | 1h | Backend |
| 3-4 | P0-03: Implementar endpoint logout con blacklist | 4h | Backend |
| 3-4 | P0-04: Reducir payload JWT (solo user_id, exp) | 4h | Backend |
| 5-6 | P0-05: Agregar GranularActionPermission a viewsets | 8h | Backend |
| 7-8 | P0-08: Eliminar bare except clauses | 2h | Backend |
| 7-8 | P0-09: Reemplazar try-except silenciosos | 4h | Backend |
| 9-10 | P0-10: Agregar logging operaciones críticas | 8h | Backend |

**Total Fase 1: 36 horas**

---

### Fase 2: Estabilización (Semanas 3-4)

**Objetivo:** Refactorizar código crítico y configuración

| Día | Tareas | Horas | Responsable |
|-----|--------|-------|-------------|
| 1-4 | P0-07: Split core/models.py en módulos | 16h | Backend |
| 5-6 | P1-15: Configurar CONN_MAX_AGE | 1h | DevOps |
| 5-6 | P1-10: CSRF_COOKIE_HTTPONLY=True | 1h | DevOps |
| 7-10 | Validación y testing de cambios Fase 1-2 | 8h | QA |

**Total Fase 2: 26 horas**

---

### Fase 3: Frontend & Testing (Semanas 5-8)

**Objetivo:** Refactorizar frontend y aumentar cobertura

| Semana | Tareas | Horas | Responsable |
|--------|--------|-------|-------------|
| 5 | P1-01: Refactorizar componentes HSEQ >1000 líneas | 24h | Frontend |
| 5 | P1-02: Split useStrategic.ts | 8h | Frontend |
| 6 | P1-03: Completar migración supply-chain | 16h | Frontend |
| 6 | P1-07: Implementar Factory Boy | 8h | Testing |
| 7 | P1-04: Tests para Talent Hub | 24h | Testing |
| 7 | P1-05: Tests para Accounting | 16h | Testing |
| 8 | P1-06: Aumentar cobertura frontend | 32h | Testing |
| 8 | P1-08: Configurar tests E2E básicos | 24h | Testing |

**Total Fase 3: 152 horas**

---

### Fase 4: Optimización (Semanas 9-12)

**Objetivo:** Performance, seguridad avanzada, deuda técnica

| Semana | Tareas | Horas | Responsable |
|--------|--------|-------|-------------|
| 9 | P1-12: Resolver patrones N+1 | 16h | Backend |
| 9 | P1-13: Agregar índices faltantes | 8h | Backend |
| 10 | P1-09: Implementar MFA/2FA para admins | 16h | Backend |
| 10 | P1-11: Límite sesiones concurrentes | 8h | Backend |
| 11 | P1-14: Agregar logging login fallido | 4h | Backend |
| 11 | P1-16: Resolver TODO/FIXME críticos | 24h | Full Stack |
| 12 | P1-17: Eliminar código duplicado | 16h | Full Stack |
| 13 | P1-19: Scripts de deployment multi-instancia | 16h | DevOps |
| 14 | P1-20: Templates de configuración por instancia | 8h | DevOps |

**Total Fase 4: 116 horas**

---

### Fase 5: Internacionalización (Semanas 13-16)

**Objetivo:** Preparar para multi-idioma

| Semana | Tareas | Horas | Responsable |
|--------|--------|-------|-------------|
| 13-14 | P1-18: Implementar sistema i18n backend | 20h | Backend |
| 15-16 | P1-18: Implementar sistema i18n frontend | 20h | Frontend |

**Total Fase 5: 40 horas**

---

### Fase 6: Mejoras Continuas (Semanas 17-26)

**Objetivo:** Resolver P2 y P3 según capacidad

- P2-01 a P2-15: ~197 horas distribuidas
- P3-01 a P3-08: ~45 horas opcionales

---

## DEPENDENCIAS ENTRE CORRECCIONES

```text
┌─────────────────────────────────────────────────────────────────┐
│                    DEPENDENCIAS CRÍTICAS                        │
└─────────────────────────────────────────────────────────────────┘

P0-02 (SECRET_KEY) ─────┐
P0-06 (DEBUG=False) ────┼──▶ P0-03 (Logout) ──▶ P1-09 (MFA)
P0-01 (Credenciales) ───┘

P0-07 (Split models.py) ──▶ P0-08 (bare except) ──▶ P0-09 (try-except)

P1-07 (Factory Boy) ──▶ P1-04 (Tests Talent Hub)
                   ──▶ P1-05 (Tests Accounting)
                   ──▶ P1-06 (Tests Frontend)
                   ──▶ P1-08 (Tests E2E)

P1-01 (HSEQ refactor) ──▶ P1-02 (useStrategic split)
                      ──▶ P1-03 (Supply chain migration)

P1-12 (N+1 queries) ◀──▶ P1-13 (Índices) [Paralelas]

[FUTURO - Multi-Tenant]
P2-02 (User.empresa) ──▶ P2-01 (Multi-tenancy 310 modelos)

[INFRAESTRUCTURA MULTI-INSTANCIA]
P1-19 (Scripts deployment) ──▶ P1-20 (Templates config)
                           ──▶ Provisioning automatizado nuevas empresas
```

---

## DETALLE: SCRIPTS DE DEPLOYMENT MULTI-INSTANCIA (P1-19, P1-20)

### P1-19: Scripts de Deployment

| Script | Propósito | Contenido |
|--------|-----------|-----------|
| `create-instance.sh` | Crear nueva instancia para empresa | Crear DB, clonar código, configurar virtualenv, ejecutar migraciones |
| `deploy-all.sh` | Desplegar actualizaciones a todas las instancias | Loop por instancias, pull código, migraciones, collectstatic, restart |
| `deploy-single.sh` | Desplegar a una instancia específica | Recibe nombre de instancia como parámetro |
| `backup-instance.sh` | Backup de una instancia | Dump DB, backup media files, comprimir |
| `restore-instance.sh` | Restaurar instancia desde backup | Restore DB, restore media, verificar integridad |

### P1-20: Templates de Configuración

| Template | Propósito |
|----------|-----------|
| `.env.template` | Variables de entorno con placeholders por instancia |
| `nginx-instance.conf.template` | Configuración nginx con server_name dinámico |
| `supervisor-instance.conf.template` | Proceso supervisor por instancia |
| `passenger_wsgi.py.template` | WSGI para cPanel con path dinámico |

### Ejemplo de Uso

```bash
# Crear nueva instancia para "EmpresaXYZ"
./create-instance.sh empresaxyz

# Desplegar actualización a todas las instancias
./deploy-all.sh

# Backup antes de actualización mayor
./backup-instance.sh empresaxyz
```

---

## CHECKLIST DE GO-LIVE (Multi-Instancia)

### Seguridad (OBLIGATORIO)
- [ ] P0-01: Credenciales removidas de Git
- [ ] P0-02: SECRET_KEY validado como requerido
- [ ] P0-03: Endpoint logout implementado
- [ ] P0-04: Payload JWT reducido
- [ ] P0-05: GranularActionPermission en todos los viewsets
- [ ] P0-06: DEBUG=False por defecto
- [ ] P1-10: CSRF_COOKIE_HTTPONLY=True

### Código (OBLIGATORIO)

- [ ] P0-07: core/models.py refactorizado (<500 líneas por archivo)
- [ ] P0-08: Sin bare except clauses
- [ ] P0-09: Sin try-except silenciosos
- [ ] P0-10: Logging de operaciones críticas

### Multi-Tenancy (FUTURO - NO bloquea Go-Live actual)

- [ ] P2-01: Modelos con campo empresa (para migración futura)
- [ ] P2-02: User model con campo empresa (para migración futura)

### Testing (RECOMENDADO)
- [ ] P1-07: Factory Boy implementado
- [ ] P1-04: Tests para Talent Hub (mínimo 50%)
- [ ] P1-05: Tests para Accounting (mínimo 50%)

### DevOps (OBLIGATORIO)

- [ ] P1-15: CONN_MAX_AGE configurado
- [ ] P1-19: Scripts de deployment multi-instancia (create-instance.sh, deploy-all.sh)
- [ ] P1-20: Templates de configuración (.env, nginx, supervisor)
- [ ] Verificar .env en producción con valores reales
- [ ] SSL/HTTPS habilitado
- [ ] Health check respondiendo
- [ ] Logs rotando correctamente
- [ ] Sentry configurado (si aplica)

---

## ESTIMACIÓN DE RECURSOS

### Por Fase

| Fase | Duración | Horas | FTE Equivalente |
|------|----------|-------|-----------------|
| 1. Pre Go-Live | 2 semanas | 36h | 0.45 |
| 2. Estabilización | 2 semanas | 26h | 0.33 |
| 3. Frontend & Testing | 4 semanas | 152h | 0.95 |
| 4. Optimización + Infraestructura | 4 semanas | 116h | 0.73 |
| 5. i18n | 4 semanas | 40h | 0.25 |
| 6. Mejoras + Multi-Tenant | 10 semanas | 290h | 0.73 |

**Total: 660 horas en 26 semanas**

> **Nota:** La migración a multi-tenant (P2-01, P2-02) se incluye en Fase 6 como preparación para escalar más allá de 20 empresas. No es bloqueante para Go-Live en modelo multi-instancia actual.

### Por Rol

| Rol | Horas Totales | % del Esfuerzo |
|-----|---------------|----------------|
| Backend Developer | 280h | 42% |
| Frontend Developer | 160h | 24% |
| QA/Testing | 120h | 18% |
| DevOps | 64h | 10% |
| Full Stack | 36h | 6% |

---

## MÉTRICAS DE ÉXITO

### Seguridad
- [ ] 0 vulnerabilidades P0 abiertas
- [ ] 100% endpoints con validación RBAC
- [ ] Penetration test sin hallazgos críticos

### Calidad
- [ ] 0 archivos >1000 líneas
- [ ] <10 archivos >500 líneas
- [ ] 0 bare except clauses
- [ ] <50 TODO/FIXME pendientes

### Testing
- [ ] Backend: >70% cobertura
- [ ] Frontend: >50% cobertura
- [ ] 10+ tests E2E para flujos críticos

### Performance
- [ ] 0 patrones N+1 en endpoints críticos
- [ ] Tiempo de respuesta API <200ms (p95)
- [ ] Índices en todos los campos de búsqueda

### Multi-tenancy (Preparación Futura)

- [ ] 100% modelos de negocio con campo empresa
- [ ] Filtrado automático por tenant en queries
- [ ] Middleware de tenant configurado

> **Nota:** Estas métricas aplican cuando se migre a multi-tenant. En modelo multi-instancia actual, el aislamiento está garantizado por bases de datos separadas.

---

## ANEXO: REPORTES DE AUDITORÍA

| # | Reporte | Ubicación |
|---|---------|-----------|
| 1 | Backend Architecture | [AUDITORIA_BACKEND_ARCHITECTURE.md](AUDITORIA_BACKEND_ARCHITECTURE.md) |
| 2 | Data Architecture | [AUDITORIA_DATA_ARCHITECTURE.md](AUDITORIA_DATA_ARCHITECTURE.md) |
| 3 | Frontend Architecture | [AUDITORIA_FRONTEND_ARCHITECTURE.md](AUDITORIA_FRONTEND_ARCHITECTURE.md) |
| 4 | Code Quality | [AUDITORIA_CODE_QUALITY.md](AUDITORIA_CODE_QUALITY.md) |
| 5 | Security & Permissions | [AUDITORIA_SECURITY_PERMISSIONS.md](AUDITORIA_SECURITY_PERMISSIONS.md) |
| 6 | DevOps/Deployment | [AUDITORIA_DEVOPS_DEPLOYMENT.md](AUDITORIA_DEVOPS_DEPLOYMENT.md) |
| 7 | Testing | [AUDITORIA_TESTING.md](AUDITORIA_TESTING.md) |

---

## CONCLUSIÓN

El proyecto StrateKaz tiene una **arquitectura sólida** con puntuación global de **7.6/10**. Las principales fortalezas son:

✅ **80 apps Django bien organizadas** en niveles de deployment
✅ **659 endpoints** con documentación OpenAPI
✅ **Sistema RBAC robusto** (CargoSectionAccess)
✅ **Infraestructura de deployment excelente** (scripts, documentación)
✅ **2,047 tests** con buena estructura de fixtures
✅ **Modelo multi-instancia** que garantiza aislamiento de datos entre empresas

Las **brechas críticas** que deben resolverse antes de Go-Live son:

🔴 **Seguridad:** Credenciales expuestas, sin logout, endpoints sin RBAC
🔴 **Código:** Archivos gigantes (core/models.py 3,245 líneas), excepciones silenciosas

**NO son bloqueantes para Go-Live (modelo multi-instancia):**
🟡 **Multi-tenancy:** El 58.5% de modelos sin campo `empresa` es preparación para migración futura. En el modelo actual, cada empresa tiene su propia base de datos aislada.

**Recomendación:** Ejecutar Fases 1-2 (62 horas) antes de cualquier deployment a producción. Esto elimina las vulnerabilidades críticas de seguridad.

**Tiempo Total Estimado:** 660 horas distribuidas en 26 semanas
**Inversión Crítica (P0):** 50 horas (~6 días con 1 desarrollador dedicado)
**Inversión Go-Live (Fases 1-4):** 330 horas (incluye infraestructura multi-instancia)

---

*Plan generado automáticamente a partir de 7 auditorías técnicas - StrateKaz v3.3.0*
*Modelo de deployment: Multi-Instancia (20 empresas)*
*Fecha de generación: 15 de enero de 2026*
