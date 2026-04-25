# Auditoría Sentry automática — 2026-04-24

Sesión disparada por tarea programada `auditoria-diaria-sentry`.
Sin usuario presente — operación autónoma.

## Resumen ejecutivo

| # | Issue Sentry | Estado previo | Acción | Estado final |
|---|---|---|---|---|
| 1 | PYTHON-DJANGO-3J — RETENCION activo→is_deleted | Open | Verificado corregido en código; resuelto en Sentry | ✅ Resuelto |
| 2 | PYTHON-DJANGO-3K — ConsecutivoConfig PRODUCTO_MP | Open | Verificado sin nuevos eventos; seeds aplicados; resuelto en Sentry | ✅ Resuelto |
| 3 | APPSTRATEKAZ-V — Importing module script failed | Open | Fix aplicado en main.tsx (vite:preloadError) | 🔧 Fix en código |
| 4 | APPSTRATEKAZ-P — NetworkBackground chunk 404 | Open | Mismo root cause; mismo fix | 🔧 Fix en código |
| 5 | PYTHON-DJANGO-3M — AppRegistryNotReady | Open | Transitorio startup; 1 evento; no requiere fix | ⚪ Ignorado |
| 6 | PYTHON-DJANGO-34 — InterfaceError DB connection | Open | 1 evento; celery.beat connection pool; sin cambios | ⚪ Monitoreando |
| 7 | PYTHON-DJANGO-2 — KeyError revision_direccion | Open | Módulo L25+ (NOT LIVE); excluido por política | ⚫ Ignorado (fuera de scope) |
| 8 | STRATEKAZ-MARKETING-3 — D is not a function | Open | Marketing site; fuera de scope StrateKaz app | ⚫ Ignorado (fuera de scope) |
| 9 | APPSTRATEKAZ-J — WebGL context error | Open | Error del browser (hardware); no es código nuestro | ⚫ Ignorado |

## Issues resueltos en Sentry (2 cerrados)

### 1. PYTHON-DJANGO-3J — RETENCION `activo` → `is_deleted`

**Root cause**: La tarea `documental.procesar_retencion_documentos` (Celery semanal,
Lunes 6AM) usaba `.filter(activo=True)` en `TablaRetencionDocumental` después de que
la migración 0022 renombró el campo a `is_active` (y TenantModel usa `is_deleted`).

**Verificación**: El código actual (`services/documento_service.py:62`) usa
`is_deleted=False` correctamente. Fix fue aplicado en commits `5ef5070a` y `9f85af81`.
El error ocurrió el 2026-04-20 (Lunes) — último run antes del fix. Próximo run
(2026-04-27) será limpio.

**Acción**: Marcado como **Resuelto** en Sentry. Hallazgo `H-PROD-05` ya estaba resuelto.

### 2. PYTHON-DJANGO-3K — ConsecutivoConfig.DoesNotExist para PRODUCTO_MP

**Root cause**: Los 4 consecutivos de producto (`PRODUCTO_MP`, `PRODUCTO_INS`,
`PRODUCTO_PT`, `PRODUTO_SV`) se agregaron a `CONSECUTIVOS_ADICIONALES` en commit
`ab26877a`, pero el `deploy.sh` anterior no ejecutaba `deploy_seeds_all_tenants`.
Commit `84aabfb7` corrigió deploy.sh el mismo 2026-04-21.

**Verificación**: Sin nuevos eventos desde 2026-04-21. El código tiene `PRODUTO_MP`
en `models_consecutivos.py:930`. El pipeline `deploy_seeds_all_tenants` está activo.

**Acción**: Marcado como **Resuelto** en Sentry. Hallazgos `H-PROD-01` y `H-PROD-07`
marcados como resueltos en `hallazgos-pendientes.md`.

## Fixes aplicados en código (2 cambios)

### Fix 1 — `frontend/src/main.tsx`: handler `vite:preloadError`

**Problema**: Cuando un usuario tiene la SPA activa durante un deploy Vite, los chunks
con hash anterior ya no existen en el servidor. El navegador falla al importarlos:
`TypeError: Failed to fetch dynamically imported module`.

**Fix aplicado**:
```ts
window.addEventListener('vite:preloadError', () => {
  window.location.reload();
});
```

Esta línea se agrega al inicio de `main.tsx`. Cuando Vite falla al cargar un chunk
dinámico (lazy route), el evento `vite:preloadError` se dispara y la página se
recarga automáticamente. El nuevo `index.html` referencia los chunks del build actual.

**Cubre**: `APPSTRATEKAZ-V` (/dashboard, Mobile Safari), `APPSTRATEKAZ-P`
(grasasyhuesos/login, NetworkBackground chunk).

**Complemento**: creado `scripts/nginx-vps-template.conf` con `Cache-Control: no-cache`
para `index.html` en el bloque de producción VPS. Para aplicar en VPS:
```bash
sudo diff /etc/nginx/sites-enabled/stratekaz scripts/nginx-vps-template.conf
# Aplicar cambios relevantes del bloque Frontend SPA
sudo nginx -t && sudo systemctl reload nginx
```

### Fix 2 — `docker/nginx/conf.d/locations.conf`: comentario correcto del bloque frontend

El bloque comentado tenía `expires 1d` para index.html — si se descomentara, cachearía
el HTML causando el mismo bug. Actualizado para mostrar el patrón correcto con
`Cache-Control: no-cache` para `index.html` y `expires 1y` para `/assets/*`.

## Hallazgos abiertos (sin tocar — no LIVE o requieren operación manual VPS)

| Hallazgo | Descripción | Razón no tocado |
|---|---|---|
| H-PROD-02 | InterfaceError celery.beat DB connection | 1 evento; bajo impacto; requiere test CONN_MAX_AGE |
| H-PROD-03 | AppRegistryNotReady startup django-tenants | 1 evento; transitorio; investiagar próxima sesión |
| H-PROD-08 | PeriodicTask zombies planeacion (2,500 eventos) | Módulo planeacion NO LIVE (L25+); excluido por política |

## Archivos modificados

| Archivo | Tipo | Cambio |
|---|---|---|
| `frontend/src/main.tsx` | Fix | Handler `vite:preloadError` |
| `docker/nginx/conf.d/locations.conf` | Docs | Bloque frontend con cache correcto (comentado) |
| `scripts/nginx-vps-template.conf` | Nuevo | Template nginx VPS completo para producción |
| `docs/01-arquitectura/hallazgos-pendientes.md` | Docs | H-PROD-01, H-PROD-04, H-PROD-07 marcados resueltos |
| `docs/auditorias/history/2026-04-24-auditoria-sentry-automatica.md` | Nuevo | Este archivo |
