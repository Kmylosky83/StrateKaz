# Refundación de Testing Backend — StrateKaz

## Contexto

Sesión 2026-04-07: al intentar cerrar el Sub-bloque 3 (System Modules / Sidebar) con 5 tests de integración, descubrimos que la infraestructura de testing del proyecto está rota para cualquier test que toque modelos de TENANT_APPS. CI no detecta el problema porque tiene `continue-on-error: true` en el job de pytest.

Ver `MEMORY.md` sesión 2026-04-07 para diagnóstico completo.

## Decisión arquitectónica

**Adoptar `FastTenantTestCase` de `django-tenants` como base para todos los tests de backend que tocan modelos de TENANT_APPS.**

Tests nuevos: `unittest`-style heredando de `BaseTenantTestCase`.
Tests viejos en pytest: se migran cuando se tocan, no en bloque.

## Alcance de la sesión de refundación

**Objetivo único:** dejar la infraestructura de testing backend funcional y CI bloqueante real, con el Sub-bloque 3 cerrado como prueba de concepto.

**Dentro del alcance:**
1. Crear `backend/apps/core/tests/base.py` con `BaseTenantTestCase` heredando de `FastTenantTestCase`. Setup común: tenant de prueba, helpers de autenticación, factories básicas.
2. Reescribir los 5 tests del Sub-bloque 3 (`test_sidebar.py`) usando `BaseTenantTestCase`. Verificar que pasen en verde.
3. Triage de tests viejos rotos en `apps/core/tests/`: identificar cuáles se rompen por tenant, cuáles por modelos cambiados, cuáles por otra razón. Marcar todos con `@unittest.skip(reason="...")` con motivo claro y referencia a issue/TODO.
4. Arreglar `.github/workflows/ci.yml`:
   - Cambiar el comando de tests para que use `manage.py test apps.core.tests.test_sidebar` (alcance acotado al sub-bloque ya migrado).
   - Quitar `continue-on-error: true`.
   - Mantener pytest corriendo en paralelo solo para los tests viejos no migrados, con `continue-on-error: true` mientras se completa la migración progresiva.
5. Documentar en `CLAUDE.md` el patrón nuevo: cómo escribir un test de backend en StrateKaz a partir de hoy.
6. Escribir el README del Sub-bloque 3 (tarea A pendiente de la sesión anterior).
7. Declarar Sub-bloque 3 CONSOLIDADO.

**Fuera del alcance (explícitamente):**
- Migrar los ~150 tests viejos a `BaseTenantTestCase`. Eso es trabajo progresivo, sub-bloque por sub-bloque.
- Subir el threshold de coverage. Decisión separada, después de tener tests reales corriendo.
- Tocar conftests de módulos apagados (`medicina_laboral`, etc.).
- Tocar `firma_digital/tests/conftest.py` salvo que sea absolutamente necesario.

## Plan de ejecución

**Fase 1 — Diagnóstico previo (15 min)**
- Verificar versión exacta de `django-tenants` en `requirements.txt`.
- Confirmar que `FastTenantTestCase` está disponible y documentado en esa versión.
- Revisar `settings/testing.py` para identificar si hay incompatibilidades obvias (ej: fallback a SQLite mencionado en sesión anterior).
- Revisar el modelo `apps.tenant.models.Tenant` para ver campos obligatorios y signals que disparan al crear.

**Fase 2 — Implementación de `BaseTenantTestCase` (45 min)**
- Crear `backend/apps/core/tests/base.py`.
- Definir setup mínimo del tenant de prueba.
- Helpers: `authenticate_as(user)`, factories básicas para `SystemModule`, `Cargo`, `User`.
- Probar con un test trivial (`test_base_works`) que solo verifica que el setup funciona.

**Fase 3 — Reescribir tests del Sub-bloque 3 (30 min)**
- Reescribir los 5 tests de `test_sidebar.py` usando `BaseTenantTestCase`.
- Correr con `manage.py test apps.core.tests.test_sidebar -v 2`.
- Los 5 tests deben pasar en verde.

**Fase 4 — Triage de tests viejos (45 min)**
- Correr `manage.py test apps.core.tests` y capturar todos los errores.
- Marcar uno por uno con skip y motivo. Prioridad: motivo claro y accionable, no "skip y olvido".
- Crear lista de tests skipped en `docs/testing-debt.md` para tracking futuro.

**Fase 5 — Arreglar CI (30 min)**
- Modificar `.github/workflows/ci.yml`.
- Verificar que el push pone CI en verde con los 5 tests del sidebar pasando bloqueante.

**Fase 6 — Cierre del Sub-bloque 3 (30 min)**
- Escribir README del Sub-bloque 3 (tarea A).
- Actualizar `MEMORY.md` con cierre del Sub-bloque 3 CONSOLIDADO.
- Actualizar `CLAUDE.md` con el patrón nuevo de testing.

**Total estimado:** 3-3.5 horas. Realista con tropiezos: 4-5 horas. Asumir que la sesión completa se dedica a esto.

## Criterios de éxito

1. Existe `BaseTenantTestCase` funcional en `backend/apps/core/tests/base.py`.
2. Los 5 tests del Sub-bloque 3 pasan en verde con `manage.py test`.
3. CI bloqueante (sin `continue-on-error`) en al menos los tests del Sub-bloque 3.
4. Sub-bloque 3 declarado CONSOLIDADO con README escrito.
5. `MEMORY.md` y `CLAUDE.md` actualizados con el patrón nuevo.
6. Tests viejos rotos no bloquean CI (skipped explícitos, no ignorados silenciosamente).

## Lo que NO se decide en la próxima sesión

- Cuándo migrar el resto de tests viejos. Eso es decisión por sub-bloque a medida que avancen los inventarios L0→L20.
- Subir el threshold de coverage. Después de tener tests reales corriendo, no antes.
- Adoptar herramientas adicionales (hypothesis, mutation testing, etc.). Fuera del alcance.
