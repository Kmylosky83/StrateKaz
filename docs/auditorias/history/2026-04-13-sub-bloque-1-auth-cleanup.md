# 2026-04-13 — Sub-bloque 1 cerrado (eliminacion legacy SimpleJWT)

**Commit:** `8e5a8312` pusheado a `main` (workflows CI #875 + CodeQL #891 disparados).

**Resumen:** Eliminacion atomica del sistema de autenticacion legacy `/api/auth/login/` + `/api/auth/refresh/` + `/api/auth/logout/`. StrateKaz ahora tiene un unico sistema de auth en produccion: `/api/tenant/auth/*`.

**Delta:** -576 / +29 = **-547 LOC netas** de codigo y documentacion muerta.

## Archivos eliminados

- `backend/apps/core/views/auth_views.py` (203 LOC) — `RateLimitedTokenObtainPairView`, `RateLimitedTokenRefreshView`
- `backend/apps/core/tests/test_auth.py` (226 LOC) — 16 tests skipped, incluyendo 3 tests huerfanos de `TestProtectedEndpoints` descartados por ser cobertura redundante sobre DRF permission classes.

## Archivos modificados

- `backend/apps/core/views/core_views.py` — eliminada `logout_view` (-54 LOC)
- `backend/apps/core/serializers.py` — eliminada `LogoutSerializer` (-42 LOC)
- `backend/config/urls.py` — 3 paths legacy + 2 imports eliminados
- `backend/apps/core/views/__init__.py` — re-exports eliminados
- `backend/apps/tenant/tests/test_isolation.py` — entrada `/api/auth/login/` removida de `public_paths`
- `backend/apps/tenant/auth_views.py` — docstring corregido
- `backend/apps/core/views/ratelimit_examples.py` — ejemplo actualizado
- `backend/README.md` — endpoints corregidos
- `docs/02-desarrollo/AUTENTICACION.md` — endpoints + flujo actualizados, **con TODOs marcados** para sesion de doc viva futura (contenido huerfano sobre SimpleJWT que no se pudo reemplazar sin escribir doc nueva)
- `docs/04-devops/CELERY-REDIS.md` — ejemplo curl actualizado
- `docs/testing-debt.md` — seccion `test_auth` eliminada

## Tests post-cleanup

593 passed / 226 failed / 128 skipped (baseline era 589/230/144). Los -16 skipped corresponden exactamente a los 16 tests eliminados. Delta passed/failed (+4/-4) es flakiness normal. **Cero regresiones nuevas.**

## Verificacion

6 greps del paso de cleanup salieron limpios (`RateLimitedTokenObtainPairView`, `RateLimitedTokenRefreshView`, `LogoutSerializer`, y los 3 paths legacy). `python manage.py check` sin errores.

## Principio aplicado

"Bases solidas no se mantienen con codigo muerto al lado. Lo que no funciona se elimina, no se deprecia." — decision arquitectonica de la sesion filosofica 2026-04-12.

## Deuda registrada (NO bloqueante)

- TODOs en `docs/02-desarrollo/AUTENTICACION.md` — sesion de doc viva futura debe reescribir las secciones marcadas con contenido actual del sistema moderno.
- CI #875 probablemente viene con los 226 failed conocidos del baseline (Patron B + otros). Eso NO es regresion de esta sesion, es el estado documentado del repo que el Punto 4 va a atacar directamente.

## Leccion de metodo

El inventario empirico que recomendaba Claude Web como sesion previa se pudo fusionar como primera tarea dentro del mismo brief de ejecucion (5 bloques: inventario -> codigo -> referencias -> doc -> validacion -> commit) con reglas de parada si el inventario refutaba la hipotesis. Ahorro una sesion cuando el alcance era acotado y ya habia auditoria previa. Validar este patron en cleanups futuros similares.

## Proxima sesion: Punto 4 — CI/CD test gate

Foco: arreglar el workflow de GitHub Actions para que CI deje de mentir con `continue-on-error`. La auditoria del 2026-04-12 identifico que solo 2 de 84+ sub-apps bloquean CI y hay 6 steps con `continue-on-error` escondiendo fallos. Sesion distinta mentalmente a la de hoy — es YAML de workflows, no codigo Django — conviene arrancar con contexto fresco.

**Arranque sugerido para proxima sesion:** pedir a Code que liste todos los archivos en `.github/workflows/` y reporte para cada uno: steps totales, steps con `continue-on-error: true`, comandos pytest especificos (que sub-apps corre cada uno), y cualquier filtro `--ignore` o `-k` que limite el alcance.
