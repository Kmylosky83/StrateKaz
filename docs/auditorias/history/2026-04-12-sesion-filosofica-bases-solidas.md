# Sesión filosófica — Bases sólidas para StrateKaz

**Fecha:** 2026-04-12
**Participantes:** Camilo (dueño producto) + Claude Web (estratega) + Claude Code (ejecutor técnico)
**Duración:** Sesión completa
**Tipo:** Filosófica + Auditoría + Ejecución encadenadas

## Contexto

Sesión arrancó con el plan de atacar Sub-bloque 1 (Auth/JWT) como quick win.
Camilo redirigió: antes de ejecutar Sub-bloque 1 necesitaba resolver 3 preguntas
arquitectónicas congeladas y, más importante, **definir qué son "bases sólidas"**
porque la había preguntado "mil veces" sin respuesta clara.

## Pregunta origen

> "Si vas a crear un SaaS Multi-Tenant Monolito Modular con Django + React/Vite
> en VPS con PostgreSQL, ¿qué checklist de bases necesitás?"

## Proceso de consenso (método de los tres roles aplicado)

1. Claude Web propuso una checklist inicial de 12 puntos
2. Camilo pidió validar esa checklist con Claude Code antes de usarla
3. Claude Code discrepó en puntos importantes (método funcionando — consenso real,
   no validación mutua)
4. Se consolidó checklist final de 14 puntos separados en 7 críticos + 7 paralelos

## Checklist consensuada final — 14 puntos

### 7 CRÍTICOS (bloqueantes antes de construir features encima)

1. **Aislamiento de tenants** — Estrategia única, routing resuelto, imposibilidad
   de cross-tenant leak, storage segregado, migrate_schemas limpio
2. **Modelo de datos base + migraciones** — Una sola cadena de herencia, convenciones
   consistentes, migraciones limpias
3. **Auth + permisos** — Un solo login, tokens seguros, RBAC con fuente única de
   verdad, frontend que respeta backend
4. **CI/CD funcional** — Pipeline reproducible, deploy con un comando, rollback
   conocido
5. **Onboarding de tenant** — Atómico, auto-cleanup en fallo, primer admin funcional
6. **Estrategia de migraciones de datos en multi-tenant** — Data migrations separadas,
   batch execution, failure handling per-schema
7. **Background tasks con aislamiento de tenant** — Patrón único de tenant context,
   fairness, reintentos con contexto preservado

### 7 PARALELOS (se construyen junto con primeros features)

8. Tests — Infraestructura funcional, pirámide básica, CI que bloquea
9. API — Versionada, documentada, errores consistentes
10. Frontend — Un solo sistema de routing/estado/formularios
11. Observabilidad — Logs buscables, Sentry, health check
12. Backups y recuperación — Automáticos, probados, offsite
13. Seguridad básica — HTTPS, env vars, headers, dependencias
14. Documentación viva — README funcional, decisiones de arquitectura

## Correcciones de Code a la propuesta inicial de Claude Web

- **Mezcla de niveles de criticidad:** La lista de 12 puntos ponía 2FA al mismo
  nivel que aislamiento de tenants. Code corrigió: separar críticos de "nice to have".
- **Faltaban 2 puntos críticos:** Code agregó "estrategia de migraciones de datos
  multi-tenant" y "background tasks con aislamiento de tenant".
- **Sobraban sub-puntos aspiracionales:** 2FA, tracking UI de onboarding,
  documentación como pilar independiente.

## Decisiones de Camilo durante la sesión

- **Principio maestro:** "Las bases sólidas no se mantienen con código muerto al
  lado. Lo que no funciona se elimina, no se deprecia. Mejores prácticas del mercado."
- **Orden de trabajo:** Checklist se recorre secuencialmente por número de punto,
  saltando los que quedan verdes.
- **Sub-bloque 1 reformulado:** Eliminar endpoint legacy en vez de mantener dual.

## Resultado

Checklist consensuada disponible como vara de medida para auditar StrateKaz y
para futuras decisiones arquitectónicas.
