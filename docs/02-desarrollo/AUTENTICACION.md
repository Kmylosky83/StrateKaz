# Sistema de Autenticación

El sistema implementa autenticación basada en JWT (JSON Web Tokens).

## Configuración JWT

| Parámetro | Valor | Descripción |
|-----------|-------|-------------|
| **Access Token** | 60 minutos | Token de acceso corto |
| **Refresh Token** | 7 días | Token de renovación largo |
| **Algoritmo** | HS256 | Firma simétrica |
| **Blacklist** | Habilitado | Tokens revocados |

---

## Endpoints

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/tenant/auth/login/` | POST | Login multi-tenant (obtener tokens) |
| `/api/tenant/auth/refresh/` | POST | Renovar access token |
| `/api/tenant/auth/logout/` | POST | Logout (blacklist token) |
| `/api/tenant/auth/me/` | GET | Usuario actual + tenants accesibles |
| `/api/auth/change-password/` | POST | Cambiar contrasena |
| `/api/core/2fa/setup/` | POST | Configurar 2FA (generar QR) |
| `/api/core/2fa/verify/` | POST | Verificar y activar 2FA |
| `/api/core/2fa/disable/` | POST | Desactivar 2FA |
| `/api/core/users/{id}/impersonate-verify/` | POST | Verificar 2FA para impersonar |
| `/api/core/users/{id}/impersonate-profile/` | GET | Perfil de usuario impersonado |

---

## Flujo de Autenticación

```
1. Usuario envía credenciales
   POST /api/tenant/auth/login/
   { "email": "...", "password": "..." }

2. Backend valida TenantUser y retorna tokens + tenants accesibles
   {
     "access": "eyJ...",
     "refresh": "eyJ...",
     "user": { "id": 1, "email": "...", ... },
     "tenants": [{ "id": 1, "schema_name": "...", "name": "..." }]
   }

3. Frontend almacena tokens y selecciona tenant
   Requests subsiguientes incluyen header X-Tenant-ID

4. Requests autenticados
   Authorization: Bearer eyJ...
   X-Tenant-ID: tenant_schema_name

5. Token expirado → Renovar
   POST /api/tenant/auth/refresh/
   { "refresh": "eyJ..." }

6. Logout → Blacklist
   POST /api/tenant/auth/logout/
   { "refresh": "eyJ..." }
```

---

## Configuración Django

```python
# settings.py

INSTALLED_APPS = [
    ...
    'rest_framework_simplejwt',
    'rest_framework_simplejwt.token_blacklist',
]

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
}

from datetime import timedelta

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'UPDATE_LAST_LOGIN': True,

    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,

    'AUTH_HEADER_TYPES': ('Bearer',),
    'AUTH_HEADER_NAME': 'HTTP_AUTHORIZATION',

    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',
}
```

---

## Frontend - Axios Interceptor

El cliente Axios centralizado configura dos interceptors:

- **Request interceptor:** inyecta el header `Authorization: Bearer <access_token>`
  en toda request autenticada. Incluye `X-Tenant-ID` cuando hay tenant activo.
- **Response interceptor:** detecta respuestas 401, intenta refrescar el access
  token via `POST /api/tenant/auth/refresh/`, y reintenta el request original con
  el nuevo token. Si el refresh falla, dispara logout y redirige a `/login`.

**Implementacion:** `frontend/src/api/axios-config.ts`

---

## Estado de autenticacion (Zustand)

El estado global de autenticacion se gestiona con Zustand (store persistido):

- **login:** envia credenciales a `POST /api/tenant/auth/login/`, almacena
  tokens (access + refresh) y datos de usuario, selecciona tenant activo.
- **logout:** blacklista el refresh token via `POST /api/tenant/auth/logout/`,
  limpia tokens y estado local, redirige a login.
- **refreshUser:** obtiene datos actualizados del usuario autenticado via
  `GET /api/tenant/auth/me/` (incluye tenants accesibles y permisos).

**Implementacion:**
- API client: `frontend/src/api/auth.api.ts`
- Store Zustand: `frontend/src/store/authStore.ts`

---

## Protección de Rutas

```tsx
// src/components/auth/ProtectedRoute.tsx
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: string;
}

export function ProtectedRoute({
  children,
  requiredPermission
}: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredPermission && !hasPermission(user, requiredPermission)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
}
```

---

## 2FA e Impersonacion

### Autenticacion de Dos Factores (TOTP)

El sistema soporta 2FA via TOTP (Time-based One-Time Password) usando apps como Google Authenticator o Authy.

| Endpoint | Metodo | Descripcion |
|----------|--------|-------------|
| `/api/core/2fa/setup/` | POST | Generar QR code para configurar 2FA |
| `/api/core/2fa/verify/` | POST | Verificar codigo TOTP y activar 2FA |
| `/api/core/2fa/disable/` | POST | Desactivar 2FA |

**Modelo:** `TwoFactorAuth` — almacena secret cifrado (AES via `ENCRYPTION_KEY` en `.env`) con `is_enabled` flag.

**IMPORTANTE:** Configurar `ENCRYPTION_KEY` en `.env` de produccion. Sin ella, se usa clave de desarrollo (inseguro).

### Impersonacion (Superadmin)

Permite al superadmin ver la plataforma como otro usuario. Requiere 2FA obligatorio.

| Endpoint | Metodo | Descripcion |
|----------|--------|-------------|
| `/api/core/users/{id}/impersonate-verify/` | POST | Verifica 2FA antes de impersonar |
| `/api/core/users/{id}/impersonate-profile/` | GET | Carga perfil del usuario impersonado |

**Flujo frontend:**
1. Superadmin clic en ojo (UsersPage) → abre `ImpersonateVerifyModal`
2. Ingresa codigo TOTP → `POST impersonate-verify` con `{ totp_code }`
3. Backend valida via `TwoFactorAuth.verify_token()` (ventana ±60s)
4. Si pasa → `GET impersonate-profile` con header `X-Impersonated-User-ID`
5. Frontend carga la vista del usuario target

**Headers de impersonacion:**
```
X-Impersonated-User-ID: {target_user_id}
Authorization: Bearer {superadmin_jwt}
```

**Audit log:** Cada impersonacion registra `impersonated_by`, `target_user_id`, `2fa_verified_at`.

**NOTA tecnica:** `get_effective_user()` en `impersonation.py` NO usa `select_related('proveedor', 'cliente')` porque `proveedor_id_ext` y `cliente_id_ext` son `IntegerField`, no FK.

---

## Seguridad

### Buenas Practicas

- Tokens almacenados en localStorage (considerar httpOnly cookies para producción)
- Refresh token rotado después de cada uso
- Tokens revocados agregados a blacklist
- HTTPS obligatorio en producción

### Headers de Seguridad

```python
# settings.py (producción)
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'
CSRF_COOKIE_SECURE = True
SESSION_COOKIE_SECURE = True
```
