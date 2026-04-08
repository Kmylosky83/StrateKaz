---
name: JWT Session Strategy
description: Duraciones reales de tokens JWT, refresh proactivo, PWA skipWaiting y por qué las sesiones sobreviven deploys
type: reference
---

# JWT Session Strategy — StrateKaz

## Duraciones reales de tokens (verificado 2026-04-03)

```python
ACCESS_TOKEN_LIFETIME  = 480 min (8 horas)   # default, configurable via JWT_ACCESS_TOKEN_LIFETIME env
REFRESH_TOKEN_LIFETIME = 10080 min (7 días)   # configurable via JWT_REFRESH_TOKEN_LIFETIME env
ROTATE_REFRESH_TOKENS  = False                # DESACTIVADO — blacklist sin for_user() + race condition multi-tab
BLACKLIST_AFTER_ROTATION = False              # DESACTIVADO
```

> **Nota**: Memory anterior decía ROTATE=True pero el código real en `base.py` tiene ROTATE=False (2026-04-03 verificado).

## Refresh proactivo (frontend — axios-config.ts)

- Función: `scheduleProactiveRefresh()` — se dispara al cargar si hay sesión activa
- Lógica: `refreshBeforeMs = min(5min, ttl/2)` → para un token de 8h, refresca a las ~7h55min
- Si el refresh falla: NO hace logout, reintenta en 60s (el interceptor de 401 maneja el logout)
- Al refrescar exitoso: reprograma el timer con el nuevo token

## Por qué las sesiones sobreviven deploys y hard reloads

1. **Tokens en localStorage** — no en memoria ni en cookie de sesión. Sobreviven cualquier reload.
2. **PWA `skipWaiting: true`** — el nuevo Service Worker activa inmediatamente, pero no toca localStorage.
3. **ErrorBoundary detecta chunk errors** (hashes Vite cambiaron post-deploy) → muestra banner manual "Recargar página". NO hace auto-reload para evitar loops.
4. **`handleReload()`** limpia caches del SW antes de recargar → fuerza chunks nuevos, pero tokens siguen intactos.

## Cuándo SÍ se invalida la sesión

| Causa | Por qué |
|-------|---------|
| Fix que cambia el comportamiento de tokens | Ej: `006ba9b6` corregía bug que borraba tokens — sesiones previas "sucias" quedan inválidas |
| Refresh token expirado (>7 días sin abrir) | Expiración natural |
| `BLACKLIST_AFTER_ROTATION=True` (si se reactiva) | Race condition multi-pestaña → NO reactivar |
| Logout explícito | `TenantLogoutView` blacklistea el refresh token |
| ~~`TenantRefreshView.blacklist()`~~ | **BUG RESUELTO (3a4117a0)** — blacklisteaba el mismo token que retornaba con ROTATE=False → logout diario |

## Regla de blacklist (2026-04-03)

**SOLO blacklistear en `TenantLogoutView`** (logout explícito).
**NUNCA blacklistear en `TenantRefreshView`** — con ROTATE=False, `str(refresh)` retorna el mismo token; blacklistearlo lo invalida para siempre.

### Por qué `refresh.blacklist()` funciona (aunque tokens sean sin `for_user()`)
- `create_tokens_for_tenant_user()` usa `RefreshToken()` bare (sin `for_user()`)
- `OutstandingToken.user` es nullable FK → `get_or_create` funciona sin user
- Por tanto `refresh.blacklist()` SÍ crea `OutstandingToken` + `BlacklistedToken` → token queda invalidado

## Flujo típico de invalidación post-deploy (no es bug)

```
Deploy con fix de auth
  → Usuario tiene sesión con tokens en estado "sucio" (del bug anterior)
  → Primer request → 401
  → Interceptor intenta refresh → falla (token inválido)
  → forceLogout() → redirect /login
  → Usuario re-hace login → sesión limpia
```
Esto es correcto y esperado cuando se corrige un bug de tokens.

## Archivos clave

| Archivo | Contenido |
|---------|-----------|
| `backend/config/settings/base.py` | `SIMPLE_JWT` config — duraciones y flags |
| `frontend/src/api/axios-config.ts` | `scheduleProactiveRefresh()`, `doRefreshToken()`, interceptor 401 |
| `frontend/src/components/common/ErrorBoundary.tsx` | `isChunkLoadError()`, `handleReload()`, banner de nueva versión |
| `frontend/vite.config.ts` | `skipWaiting: true` en PWA plugin |
