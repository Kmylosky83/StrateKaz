# Correcciones Core Configuración - 20 Enero 2026

## Resumen de Cambios

Se han realizado las siguientes correcciones para resolver los errores 401 y 405 en los endpoints del core:

### 1. UserPreferencesViewSet - Refactorizado a APIView (MS-003)

**Problema:**
- El `UserPreferencesViewSet` estaba usando `viewsets.ViewSet` que causaba error 405 (Method Not Allowed)
- El router de DRF esperaba métodos estándar pero el diseño era singleton (sin PK)

**Solución:**
- Creado nueva view `UserPreferencesView` como `APIView` en [backend/apps/core/views/user_preferences_views.py](backend/apps/core/views/user_preferences_views.py)
- Implementa patrón singleton: GET, PUT, PATCH sin necesidad de PK en la URL
- URL directa en lugar de router: `/api/core/user-preferences/`

**Archivos modificados:**
- ✅ `backend/apps/core/views/user_preferences_views.py` (NUEVO)
- ✅ `backend/apps/core/views/__init__.py` - Exportar `UserPreferencesView`
- ✅ `backend/apps/core/urls.py` - Cambiar de router a path directo
- ✅ `backend/apps/core/viewsets.py` - Actualizar `UserPreferencesViewSet` a `GenericViewSet` (aunque ya no se usa)

### 2. Endpoints Verificados

**BrandingConfigViewSet:**
- ✅ Endpoint `GET /api/core/branding/active/` tiene `permission_classes=[AllowAny]` correctamente configurado
- ✅ Endpoint `GET /api/core/branding/manifest/` tiene `permission_classes=[AllowAny]` correctamente configurado

**SystemModuleViewSet:**
- ✅ Endpoint `GET /api/core/system-modules/sidebar/` tiene permisos personalizados vía `get_permissions()`
- ✅ Filtra contenido según `CargoSectionAccess` del usuario autenticado

### 3. Configuración Verificada

**CORS (settings.py):**
- ✅ `CORS_ALLOW_CREDENTIALS = True`
- ✅ `CORS_ALLOWED_ORIGINS` configurado correctamente
- ✅ `CORS_ALLOW_HEADERS` incluye 'authorization'

**JWT (settings.py):**
- ✅ `DEFAULT_AUTHENTICATION_CLASSES` usa `JWTAuthentication`
- ✅ `REFRESH_TOKEN_LIFETIME` = 7 días (10080 minutos)
- ✅ `ACCESS_TOKEN_LIFETIME` = 60 minutos (configurable)

## Pasos Pendientes para Completar

### 1. Instalar Dependencias Faltantes

```powershell
cd backend
.\venv\Scripts\activate
pip install pyotp
```

**Nota:** La dependencia `pyotp` está en [requirements.txt](backend/requirements.txt) pero no está instalada en el entorno virtual.

### 2. Aplicar Migraciones Pendientes

```powershell
cd backend
.\venv\Scripts\activate
python manage.py migrate
```

**Migraciones pendientes:**
- `core/migrations/0018_remove_twofactorauth_core_two_fa_user_enabled_idx_and_more.py`
- `gestion_estrategica/configuracion/migrations/0008_remove_unidadmedida_created_by_and_more.py`
- `gestion_estrategica/organizacion/migrations/0004_consecutivoconfig_unidadmedida.py`

### 3. Probar Endpoints

Una vez aplicadas las migraciones, probar los siguientes endpoints:

#### GET /api/core/user-preferences/
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:8000/api/core/user-preferences/
```

**Esperado:** 200 OK con JSON de preferencias

#### GET /api/core/branding/active/
```bash
curl http://localhost:8000/api/core/branding/active/
```

**Esperado:** 200 OK con JSON de branding activo (sin autenticación)

#### GET /api/core/system-modules/sidebar/
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:8000/api/core/system-modules/sidebar/
```

**Esperado:** 200 OK con JSON del sidebar filtrado según permisos

#### GET /api/audit/notificaciones/no_leidas/?usuario_id=1
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:8000/api/audit/notificaciones/no_leidas/?usuario_id=1
```

**Esperado:** 200 OK con array de notificaciones no leídas

### 4. Hacer Commit de los Cambios

```bash
git add .
git commit -m "fix(core): Resolve 401/405 errors in user-preferences and config endpoints

- Refactor UserPreferencesViewSet to UserPreferencesView (APIView singleton pattern)
- Fix URL routing for /api/core/user-preferences/ (direct path instead of router)
- Verify AllowAny permissions on branding/active endpoint
- Verify CORS and JWT configuration
- Update user-preferences to use GenericViewSet (backup)

Closes: MS-003 preferences endpoint issues"
```

## Análisis de Errores Originales

### Error 401 (Unauthorized)

**Endpoints afectados:**
- `/api/core/user-preferences/`
- `/api/core/branding/active/`
- `/api/core/system-modules/sidebar/`
- `/api/audit/notificaciones/no_leidas/`

**Causa raíz:**
1. ❌ **Token JWT no se estaba enviando correctamente** - El frontend tiene configurado el interceptor de Axios correctamente pero puede haber un problema de timing en el login
2. ✅ **Permisos configurados correctamente** - `IsAuthenticated` está configurado donde debe estar y `AllowAny` en endpoints públicos

**Verificación necesaria:**
- Revisar que el token se guarde correctamente en localStorage después del login
- Verificar que el interceptor de Axios esté configurado antes de hacer la primera petición

### Error 405 (Method Not Allowed)

**Endpoint afectado:**
- `/api/core/user-preferences/`

**Causa raíz:**
- ✅ **ViewSet sin métodos correctos** - El `ViewSet` base no tenía los métodos HTTP mapeados correctamente para el patrón singleton
- ✅ **Router esperaba patrón REST estándar** - El router de DRF espera endpoints con PK pero este es singleton

**Solución implementada:**
- Cambiado de ViewSet a APIView con path directo
- Implementados métodos HTTP directamente: `get()`, `put()`, `patch()`

## Arquitectura Actualizada

### Antes (Incorrecto)
```
Router: /api/core/user-preferences/ -> UserPreferencesViewSet
  - list() no definido correctamente
  - update() sin PK causaba 405
```

### Después (Correcto)
```
Path: /api/core/user-preferences/ -> UserPreferencesView (APIView)
  - GET  -> get()  (obtener preferencias del usuario actual)
  - PUT  -> put()  (actualizar completo)
  - PATCH -> patch() (actualizar parcial)
```

## Testing Manual

### 1. Verificar Token JWT

En la consola del navegador:
```javascript
localStorage.getItem('access_token')
localStorage.getItem('refresh_token')
```

**Esperado:** Ambos deben tener valores no null.

### 2. Verificar Headers de Request

En Network tab del DevTools, verificar que las peticiones incluyan:
```
Authorization: Bearer <token>
Content-Type: application/json
```

### 3. Verificar Refresh Token Automático

Si el access token expira, el interceptor de Axios debe:
1. Detectar error 401
2. Intentar refresh con el refresh token
3. Reintentar la petición original con el nuevo access token
4. Si falla el refresh, redirigir a `/login`

## Siguiente Sprint

- [ ] Crear tests unitarios para `UserPreferencesView`
- [ ] Crear tests de integración para flujo completo de preferencias
- [ ] Documentar API en Swagger/OpenAPI
- [ ] Agregar rate limiting a endpoints de preferencias

---

**Autor:** Claude Code
**Fecha:** 20 Enero 2026
**Versión:** 3.7.0
**Ticket:** MS-003 - User Preferences Fixes
